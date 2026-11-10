<p align="center">
  <a href="https://pushkarx-code.github.io/vesper/"><img src="docs/banner.png" alt="Vesper. A fast, private AI chat app for your phone. Free models, your own key, no servers." width="100%"></a>
</p>

<p align="center">
  <a href="https://pushkarx-code.github.io/vesper/"><b>Open Vesper</b></a>
</p>

## What it is

Vesper is a chat app that lives in your browser and installs to your home screen like a native app. It connects straight to [OpenRouter](https://openrouter.ai), so you can talk to dozens of AI models, including free ones, through one clean interface.

There is no backend. Nothing you type passes through a Vesper server, because there isn't one. Your key and your chats stay on your device.

## Features

<p align="center">
  <img src="docs/features.png" alt="Streaming replies. Any OpenRouter model. Private by design. Every chat, kept. Installs like an app. Tuned to you." width="100%">
</p>

Also in the box: retry and copy on every answer, and plain language errors that tell you what to do when a free model is busy or gone.

## Get started

**1. Open the app**

Go to [pushkarx-code.github.io/vesper](https://pushkarx-code.github.io/vesper/) in Chrome on your phone.

**2. Install it (optional, recommended)**

Tap the Chrome menu, then **Add to Home screen**, then **Install**.

**3. Add your key**

1. Create a free account at [openrouter.ai](https://openrouter.ai).
2. Open **Keys** and create a new key.
3. In Vesper, tap **Add API key**, paste it, then tap **Save key** and **Test**.

That's it. Start typing.

## Privacy

* Your API key is stored only in your browser's local storage on your device.
* Your chats are stored only on your device. Clearing the site data deletes them.
* Messages go directly from your browser to OpenRouter, and from there to the model provider you picked. Their privacy terms apply to that part of the trip.
* Vesper has no analytics, no tracking and no accounts.

Treat your key like a password. Never paste it into a chat, a screenshot or a public file.

## Models

Vesper ships with a short list of free models to get you going. Free models on OpenRouter change often and have rate limits, so if one stops responding:

1. Tap the model name at the top.
2. Tap **Find all free models** to load the current list.
3. Pick another one.

You can also add any model by its OpenRouter name. Names ending in `:free` cost nothing. Anything else uses your OpenRouter credits.

## Under the hood

* One HTML file with plain JavaScript and CSS. No framework and no build step.
* [marked](https://github.com/markedjs/marked) and [DOMPurify](https://github.com/cure53/DOMPurify) render replies safely as formatted text.
* A small service worker and a web manifest make it installable.
* Hosted for free on GitHub Pages.

### Project structure

```
index.html              The whole app: layout, styles and logic
manifest.webmanifest    Install settings (name, icons, colours)
sw.js                   Service worker for install and offline shell
icon.svg, icon-*.png    App icons
docs/                   Screenshots for this README
```

### Run it yourself

Fork this repo, turn on GitHub Pages for the `main` branch, and you have your own copy. To try it on a computer, serve the folder with any static server:

```
npx serve .
```

## Good to know

* Vesper needs an internet connection to chat. The models run in the cloud, not on your phone.
* AI models make mistakes and can state wrong things with confidence. Check anything important.
* The screens in the banner show a sample conversation.

## Credits

Designed and directed by [Pushkar Choudhury](https://github.com/PushkarX-Code). Built with [Claude](https://claude.com).
