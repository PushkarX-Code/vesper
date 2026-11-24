using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media.Imaging;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Windows.ApplicationModel;
using Windows.Security.Credentials;
using Windows.Storage;

namespace Vesper_App;

public sealed partial class MainPage : Page
{
    private readonly ProviderCredentialService _credentials = new();
    private readonly List<ChatMessage> _conversation = [];
    private readonly List<LocalConversation> _savedConversations = [];
    private readonly LocalConversationStore _conversationStore = new();
    private bool _sending;
    private string? _currentConversationId;

    public MainPage()
    {
        InitializeComponent();
        ChatProviderSelector.ItemsSource = ProviderCatalog.All;
        ChatProviderSelector.DisplayMemberPath = nameof(ProviderDefinition.Name);
        ChatProviderSelector.SelectedItem = ProviderCatalog.All.FirstOrDefault(p => _credentials.IsConnected(p.Id));
        if (ChatProviderSelector.SelectedItem is null)
            ChatProviderSelector.SelectedItem = ProviderCatalog.All[0];
        BuildProviderCards();
        _ = LoadConversationAsync();
    }

    private void OnNavigationSelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        HidePages();
        var tag = (args.SelectedItem as NavigationViewItem)?.Tag?.ToString();
        switch (tag)
        {
            case "connectors":
                ConnectorsPage.Visibility = Visibility.Visible;
                break;
            case "library":
                LibraryPage.Visibility = Visibility.Visible;
                break;
            case "local":
                LocalPage.Visibility = Visibility.Visible;
                break;
            case "settings":
                SettingsPage.Visibility = Visibility.Visible;
                break;
            default:
                if (tag == "chat") StartNewChat();
                ChatPage.Visibility = Visibility.Visible;
                break;
        }
    }

    private void HidePages()
    {
        ChatPage.Visibility = Visibility.Collapsed;
        ConnectorsPage.Visibility = Visibility.Collapsed;
        LibraryPage.Visibility = Visibility.Collapsed;
        LocalPage.Visibility = Visibility.Collapsed;
        SettingsPage.Visibility = Visibility.Collapsed;
    }

    private void OnConnectModelClick(object sender, RoutedEventArgs e)
    {
        ShellNavigation.SelectedItem = ShellNavigation.MenuItems
            .OfType<NavigationViewItem>()
            .First(item => item.Tag?.ToString() == "connectors");
    }

    private async void OnSendClick(object sender, RoutedEventArgs e)
    {
        await SendPromptAsync();
    }

    private async void OnPromptKeyDown(object sender, Microsoft.UI.Xaml.Input.KeyRoutedEventArgs e)
    {
        if (e.Key == Windows.System.VirtualKey.Enter && !Microsoft.UI.Input.InputKeyboardSource.GetKeyStateForCurrentThread(Windows.System.VirtualKey.Shift).HasFlag(Windows.UI.Core.CoreVirtualKeyStates.Down))
        {
            e.Handled = true;
            await SendPromptAsync();
        }
    }

    private void OnChatProviderChanged(object sender, SelectionChangedEventArgs e)
    {
        if (ChatProviderSelector.SelectedItem is ProviderDefinition provider)
            ChatModelBox.Text = provider.DefaultModel;
    }

    private async Task SendPromptAsync()
    {
        if (_sending) return;
        var prompt = PromptBox.Text.Trim();
        if (prompt.Length == 0) return;
        if (ChatProviderSelector.SelectedItem is not ProviderDefinition provider)
        {
            await ShowMessageAsync("Choose a provider", "Select a model provider first.");
            return;
        }
        if (!_credentials.IsConnected(provider.Id))
        {
            await ShowMessageAsync("Connect a provider", $"Add an API key for {provider.Name} in Connectors before sending a prompt.");
            return;
        }

        var model = string.IsNullOrWhiteSpace(ChatModelBox.Text) ? provider.DefaultModel : ChatModelBox.Text.Trim();
        if (_currentConversationId is null)
        {
            _currentConversationId = Guid.NewGuid().ToString("N");
            _savedConversations.Insert(0, new LocalConversation(_currentConversationId, prompt.Length > 56 ? prompt[..56] + "…" : prompt, []));
            RefreshSavedChats();
        }
        PromptBox.Text = string.Empty;
        _conversation.Add(new ChatMessage("user", prompt));
        var userBubble = AddMessageBubble("You", prompt, true);
        WelcomePanel.Visibility = Visibility.Collapsed;
        _sending = true;
        SendButton.IsEnabled = false;
        var pending = AddMessageBubble("Vesper", "Thinking…", false);
        try
        {
            var answer = await _credentials.SendChatAsync(provider, model, _conversation);
            _conversation.Add(new ChatMessage("assistant", answer));
            pending.Child = MakeMessageContent("Vesper", answer, false);
            try { await SaveConversationAsync(); }
            catch { await ShowMessageAsync("Conversation not saved", "The response arrived, but Vesper could not write the conversation to local app storage. Your provider response is still visible in this session."); }
        }
        catch (Exception ex)
        {
            if (_conversation.Count > 0 && _conversation[^1].Role == "user") _conversation.RemoveAt(_conversation.Count - 1);
            MessagesPanel.Children.Remove(pending);
            MessagesPanel.Children.Remove(userBubble);
            await ShowMessageAsync("Could not get a response", ex.Message);
        }
        finally
        {
            _sending = false;
            SendButton.IsEnabled = true;
            ChatScroll.ChangeView(null, ChatScroll.ExtentHeight, null, true);
        }
    }

    private async Task LoadConversationAsync()
    {
        try
        {
            _savedConversations.AddRange(await _conversationStore.LoadAsync());
            RefreshSavedChats();
            var latest = _savedConversations.FirstOrDefault();
            if (latest is null) return;
            _currentConversationId = latest.Id;
            _conversation.AddRange(latest.Messages);
            foreach (var message in latest.Messages)
                AddMessageBubble(message.Role == "user" ? "You" : "Vesper", message.Content, message.Role == "user");
            WelcomePanel.Visibility = latest.Messages.Count == 0 ? Visibility.Visible : Visibility.Collapsed;
        }
        catch { /* An unreadable local history should not prevent app startup. */ }
    }

    private void StartNewChat()
    {
        if (_conversation.Count == 0) return;
        _currentConversationId = null;
        _conversation.Clear();
        MessagesPanel.Children.Clear();
        WelcomePanel.Visibility = Visibility.Visible;
    }

    private async Task SaveConversationAsync()
    {
        if (_currentConversationId is null) return;
        var index = _savedConversations.FindIndex(c => c.Id == _currentConversationId);
        if (index < 0) return;
        _savedConversations[index] = _savedConversations[index] with { Messages = _conversation.ToList() };
        await _conversationStore.SaveAsync(_savedConversations);
        RefreshSavedChats();
    }

    private void RefreshSavedChats()
    {
        if (SavedChatsList is null) return;
        SavedChatsList.Items.Clear();
        foreach (var conversation in _savedConversations)
        {
            var button = new Button { Content = conversation.Title, Tag = conversation.Id, HorizontalAlignment = HorizontalAlignment.Stretch, HorizontalContentAlignment = HorizontalAlignment.Left, Margin = new Thickness(0, 0, 0, 6) };
            button.Click += OnSavedChatClick;
            SavedChatsList.Items.Add(button);
        }
    }

    private void OnSavedChatClick(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: string id }) return;
        var conversation = _savedConversations.FirstOrDefault(c => c.Id == id);
        if (conversation is null) return;
        _currentConversationId = conversation.Id;
        _conversation.Clear();
        _conversation.AddRange(conversation.Messages);
        MessagesPanel.Children.Clear();
        foreach (var message in conversation.Messages)
            AddMessageBubble(message.Role == "user" ? "You" : "Vesper", message.Content, message.Role == "user");
        WelcomePanel.Visibility = conversation.Messages.Count == 0 ? Visibility.Visible : Visibility.Collapsed;
        ShellNavigation.SelectedItem = ShellNavigation.MenuItems.OfType<NavigationViewItem>().First(item => item.Tag?.ToString() == "chat");
    }

    private Border AddMessageBubble(string author, string text, bool isUser)
    {
        var bubble = new Border
        {
            HorizontalAlignment = isUser ? HorizontalAlignment.Right : HorizontalAlignment.Left,
            MaxWidth = 760,
            Padding = new Thickness(16, 12, 16, 12),
            Background = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, isUser ? (byte)35 : (byte)23, isUser ? (byte)37 : (byte)24, isUser ? (byte)40 : (byte)25)),
            BorderBrush = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 48, 50, 53)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(18),
            Child = MakeMessageContent(author, text, isUser)
        };
        MessagesPanel.Children.Add(bubble);
        ChatScroll.ChangeView(null, ChatScroll.ExtentHeight, null, true);
        return bubble;
    }

    private static UIElement MakeMessageContent(string author, string text, bool isUser)
    {
        var panel = new StackPanel { Spacing = 6 };
        panel.Children.Add(new TextBlock { Text = author, FontSize = 12, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold, Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 165, 168, 172)) });
        panel.Children.Add(new TextBlock { Text = text, FontSize = 14, Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 239, 240, 238)), TextWrapping = TextWrapping.Wrap, IsTextSelectionEnabled = true });
        return panel;
    }

    private async Task ShowMessageAsync(string title, string content) => await new ContentDialog
    {
        Title = title,
        Content = content,
        CloseButtonText = "Close",
        XamlRoot = XamlRoot
    }.ShowAsync();

    private void BuildProviderCards()
    {
        ProviderCards.Items.Clear();
        foreach (var provider in ProviderCatalog.All)
        {
            ProviderCards.Items.Add(CreateProviderCard(provider));
        }
    }

    private UIElement CreateProviderCard(ProviderDefinition provider)
    {
        var row = new Grid
        {
            MinHeight = 58,
            ColumnSpacing = 12
        };
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(44) });
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var logo = new Image
        {
            Width = 28,
            Height = 28,
            Stretch = Microsoft.UI.Xaml.Media.Stretch.Uniform,
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center
        };
        if (!string.IsNullOrWhiteSpace(provider.Logo))
        {
            if (provider.Logo.EndsWith(".svg", StringComparison.OrdinalIgnoreCase))
                logo.Source = new Microsoft.UI.Xaml.Media.Imaging.SvgImageSource(new Uri($"ms-appx:///Assets/Providers/{provider.Logo}"));
            else
                logo.Source = new BitmapImage(new Uri($"ms-appx:///Assets/Providers/{provider.Logo}"));
            row.Children.Add(logo);
        }
        else
            row.Children.Add(new TextBlock { Text = provider.Name, FontSize = 11, FontWeight = Microsoft.UI.Text.FontWeights.Bold, Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.Colors.White), VerticalAlignment = VerticalAlignment.Center, TextAlignment = TextAlignment.Center });

        var details = new StackPanel { Spacing = 3, VerticalAlignment = VerticalAlignment.Center };
        details.Children.Add(new TextBlock { Text = provider.Name, FontSize = 14, FontWeight = Microsoft.UI.Text.FontWeights.SemiBold, Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.Colors.White) });
        details.Children.Add(new TextBlock { Text = provider.Description, FontSize = 12, Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 155, 157, 160)), TextWrapping = TextWrapping.Wrap });
        Grid.SetColumn(details, 1);
        row.Children.Add(details);

        var action = new Button
        {
            Content = _credentials.IsConnected(provider.Id) ? "Disconnect" : "Connect",
            MinWidth = 92,
            VerticalAlignment = VerticalAlignment.Center,
            Tag = provider
        };
        action.Click += OnProviderActionClick;
        Grid.SetColumn(action, 2);
        row.Children.Add(action);
        return new Border
        {
            MinHeight = 82,
            Margin = new Thickness(0, 0, 0, 8),
            Padding = new Thickness(14, 11, 14, 11),
            Background = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 23, 24, 25)),
            BorderBrush = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 48, 50, 53)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(14),
            Child = row
        };
    }

    private async void OnProviderActionClick(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: ProviderDefinition provider } button)
            return;

        if (_credentials.IsConnected(provider.Id))
        {
            _credentials.Disconnect(provider.Id);
            button.Content = "Connect";
            return;
        }

        var keyBox = new PasswordBox
        {
            PlaceholderText = "Paste your API key",
            MinWidth = 340,
            MaxWidth = 440,
            PasswordRevealMode = PasswordRevealMode.Peek
        };
        var instructions = new TextBlock
        {
            Text = $"Create an API key at {provider.SiteHost}. It is validated with the provider and stored in Windows Credential Locker on this device.",
            TextWrapping = TextWrapping.Wrap,
            FontSize = 13,
            Margin = new Thickness(0, 0, 0, 12)
        };
        var content = new StackPanel { Spacing = 8 };
        content.Children.Add(instructions);
        content.Children.Add(keyBox);
        var dialog = new ContentDialog
        {
            Title = $"Connect {provider.Name}",
            Content = content,
            PrimaryButtonText = "Validate and connect",
            CloseButtonText = "Cancel",
            DefaultButton = ContentDialogButton.Primary,
            XamlRoot = XamlRoot
        };

        if (await dialog.ShowAsync() != ContentDialogResult.Primary)
            return;

        button.IsEnabled = false;
        button.Content = "Checking…";
        var result = await _credentials.ConnectAsync(provider, keyBox.Password);
        button.IsEnabled = true;
        button.Content = result.Success ? "Disconnect" : "Connect";
        await new ContentDialog
        {
            Title = result.Success ? "Connected" : "Could not connect",
            Content = result.Message,
            CloseButtonText = "Close",
            XamlRoot = XamlRoot
        }.ShowAsync();
    }
}

internal sealed record ProviderDefinition(string Id, string Name, string Description, string Logo, string ModelsUri, string SiteHost, string AuthKind, string DefaultModel);
internal sealed record ChatMessage(string Role, string Content);
internal sealed record LocalConversation(string Id, string Title, List<ChatMessage> Messages);

internal static class ProviderCatalog
{
    public static readonly IReadOnlyList<ProviderDefinition> All =
    [
        new("openai", "OpenAI", "OpenAI API · usage billed by OpenAI", "openai.png", "https://api.openai.com/v1/models", "platform.openai.com", "bearer", "gpt-4o-mini"),
        new("anthropic", "Anthropic · Claude", "Claude API · usage billed by Anthropic", "anthropic.svg", "https://api.anthropic.com/v1/models", "console.anthropic.com", "anthropic", "claude-3-5-haiku-latest"),
        new("gemini", "Google Gemini", "Gemini API · free quota varies by account", "googlegemini.svg", "https://generativelanguage.googleapis.com/v1beta/models", "aistudio.google.com", "gemini", "gemini-2.0-flash"),
        new("openrouter", "OpenRouter", "One key for models from many providers", "openrouter.svg", "https://openrouter.ai/api/v1/models", "openrouter.ai", "bearer", "openai/gpt-4o-mini"),
        new("groq", "Groq", "Fast inference · provider limits apply", "groq.png", "https://api.groq.com/openai/v1/models", "console.groq.com", "bearer", "llama-3.3-70b-versatile"),
        new("mistral", "Mistral AI", "Mistral API · plan limits apply", "mistralai.svg", "https://api.mistral.ai/v1/models", "console.mistral.ai", "bearer", "mistral-small-latest"),
        new("cerebras", "Cerebras", "Cerebras Inference · account limits apply", "", "https://api.cerebras.ai/v1/models", "cloud.cerebras.ai", "bearer", "llama3.1-8b")
    ];
}

internal sealed class ProviderCredentialService
{
    private const string Resource = "Vesper.ModelProvider.ApiKey";
    private readonly PasswordVault _vault = new();
    private static readonly HttpClient Client = new() { Timeout = TimeSpan.FromSeconds(20) };

    public bool IsConnected(string providerId)
    {
        try { return _vault.FindAllByResource(Resource).Any(item => item.UserName == providerId); }
        catch { return false; }
    }

    public void Disconnect(string providerId)
    {
        try
        {
            foreach (var credential in _vault.FindAllByResource(Resource).Where(item => item.UserName == providerId).ToList())
                _vault.Remove(credential);
        }
        catch { }
    }

    public async Task<string> SendChatAsync(ProviderDefinition provider, string model, IReadOnlyList<ChatMessage> messages)
    {
        var credential = _vault.Retrieve(Resource, provider.Id);
        var apiKey = credential.Password;
        using var request = new HttpRequestMessage(HttpMethod.Post, BuildChatUri(provider, model, apiKey));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        object payload;
        if (provider.AuthKind == "anthropic")
        {
            request.Headers.TryAddWithoutValidation("x-api-key", apiKey);
            request.Headers.TryAddWithoutValidation("anthropic-version", "2023-06-01");
            payload = new { model, max_tokens = 2048, messages = messages.Select(m => new { role = m.Role, content = m.Content }) };
        }
        else if (provider.AuthKind == "gemini")
        {
            payload = new { contents = messages.Select(m => new { role = m.Role == "assistant" ? "model" : "user", parts = new[] { new { text = m.Content } } }) };
        }
        else
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            payload = new { model, messages = messages.Select(m => new { role = m.Role, content = m.Content }), temperature = 0.7 };
        }
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await Client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            var detail = TryGetProviderError(body);
            throw new InvalidOperationException(response.StatusCode switch
            {
                System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden => "The provider rejected this key. Reconnect it in Connectors.",
                System.Net.HttpStatusCode.TooManyRequests => "The provider rate limit or quota was reached. Check the provider account and retry later.",
                _ => $"{provider.Name} returned {(int)response.StatusCode}: {detail}"
            });
        }
        using var json = JsonDocument.Parse(body);
        if (provider.AuthKind == "anthropic") return json.RootElement.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
        if (provider.AuthKind == "gemini") return json.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
        return json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private static Uri BuildChatUri(ProviderDefinition provider, string model, string apiKey) => provider.AuthKind switch
    {
        "gemini" => new Uri($"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(apiKey)}"),
        "anthropic" => new Uri("https://api.anthropic.com/v1/messages"),
        "bearer" => new Uri(provider.ModelsUri.Replace("/models", "/chat/completions", StringComparison.Ordinal)),
        _ => throw new InvalidOperationException("This provider is not supported.")
    };

    private static string TryGetProviderError(string body)
    {
        try { return JsonDocument.Parse(body).RootElement.GetProperty("error").GetProperty("message").GetString() ?? "Request failed."; }
        catch { return "Check the selected model ID and provider settings."; }
    }

    public async Task<(bool Success, string Message)> ConnectAsync(ProviderDefinition provider, string apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return (false, "Paste an API key to continue.");

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, BuildUri(provider, apiKey));
            if (provider.AuthKind == "anthropic")
            {
                request.Headers.TryAddWithoutValidation("x-api-key", apiKey);
                request.Headers.TryAddWithoutValidation("anthropic-version", "2023-06-01");
            }
            else if (provider.AuthKind == "bearer")
            {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            }

            using var response = await Client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return response.StatusCode switch
                {
                    System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden => (false, "The provider rejected this key. Check it and try again."),
                    System.Net.HttpStatusCode.TooManyRequests => (false, "The provider is rate-limiting this request. Wait briefly, then try again."),
                    _ => (false, $"The provider returned {(int)response.StatusCode}. Check the key and provider account, then retry.")
                };
            }

            Disconnect(provider.Id);
            _vault.Add(new PasswordCredential(Resource, provider.Id, apiKey));
            return (true, "The key was validated and saved in Windows Credential Locker on this device.");
        }
        catch (TaskCanceledException)
        {
            return (false, "The provider did not respond in time. Check your connection and try again.");
        }
        catch
        {
            return (false, "The connection could not be completed. Check your internet connection and try again.");
        }
    }

    private static Uri BuildUri(ProviderDefinition provider, string apiKey)
    {
        var url = provider.AuthKind == "gemini"
            ? $"{provider.ModelsUri}?key={Uri.EscapeDataString(apiKey)}"
            : provider.ModelsUri;
        return new Uri(url);
    }
}

internal sealed class LocalConversationStore
{
    private const string FileName = "conversations.json";
    public async Task SaveAsync(IReadOnlyList<LocalConversation> conversations)
    {
        var file = await ApplicationData.Current.LocalFolder.CreateFileAsync(FileName, CreationCollisionOption.ReplaceExisting);
        await FileIO.WriteTextAsync(file, JsonSerializer.Serialize(conversations));
    }
    public async Task<IReadOnlyList<LocalConversation>> LoadAsync()
    {
        var file = await ApplicationData.Current.LocalFolder.GetFileAsync(FileName);
        var json = await FileIO.ReadTextAsync(file);
        return JsonSerializer.Deserialize<List<LocalConversation>>(json) ?? [];
    }
}
