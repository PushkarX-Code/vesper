// Makes the README images in docs/ from the real app, using demo data (no real keys, no network).
// Run from the repo root:  node docs/art/make-art.js   (needs Playwright with Chromium)
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs");
const SHOTS = path.join(__dirname, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

// tiny static server for the repo
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});

const NOW = Date.parse("2026-11-21T20:10:00Z");
const GEMMA = "openrouter::google/gemma-4-31b-it:free";
const CHAR_DIR = path.join(ROOT, "docs", "art", "characters");
const face = n => "data:image/webp;base64," + fs.readFileSync(path.join(CHAR_DIR, "av-" + n + ".webp")).toString("base64");
const DEMO = {
  v: 2, keys: { openrouter: "demo", groq: "demo" }, model: GEMMA, icon: "chrome", temp: 0.8, len: "normal",
  memOn: true,
  memory: [
    { id: "m1", text: "Makes short video ads for brands.", at: NOW },
    { id: "m2", text: "Prefers short, direct answers.", at: NOW },
    { id: "m3", text: "Edits in Premiere and shoots on a phone.", at: NOW },
    { id: "m4", text: "Is building an app called Vesper.", at: NOW }
  ],
  companions: [
    { id: "k1", name: "Seraphine", about: "Elegant, calm and a little mysterious. Loves late talks.", style: "Warm, playful, short texts.", story: "", greeting: "Hey you. Long day?", color: "#b89cff", photo: face("seraphine") },
    { id: "k3", name: "Scarlet", about: "Bold, witty and always up for a debate.", style: "Quick and teasing.", story: "", greeting: "", color: "#ff8f8f", photo: face("scarlet") },
    { id: "k4", name: "Aurelia", about: "Sunny, kind and full of travel stories.", style: "Bright and encouraging.", story: "", greeting: "", color: "#f0c26b", photo: face("aurelia") },
    { id: "k2", pid: "atlas", name: "Atlas", about: "A sharp creative director who pushes your ideas further.", style: "Direct and full of energy.", story: "", greeting: "", color: "#6ea8ff" }
  ],
  chats: [
    { id: "c1", title: "Hooks for a skincare ad", model: GEMMA, updated: NOW - 60e3, messages: [
      { role: "user", content: "Give me 3 hooks for a 15 second skincare ad. Make them stop the scroll." },
      { role: "assistant", model: GEMMA, secs: 4, reasoning: "Short openers, one idea each, built for the first second of a vertical video.",
        content: "Here are three that land in the first second:\n\n1. **\"I stopped buying serums after this.\"** Curiosity plus a bold claim.\n2. **\"Your bathroom shelf is lying to you.\"** Calls out the viewer directly.\n3. **\"Watch my skin in 10 seconds.\"** Promises a visible payoff.\n\nOpen on a tight close up, cut every 1.5 seconds, and get the product in frame by second 3." }
    ]},
    { id: "c2", title: "Seraphine", model: GEMMA, companion: "k1", updated: NOW - 3600e3, messages: [
      { role: "assistant", greeting: true, content: "Hey you. Long day?" },
      { role: "user", content: "Long but good. Finished the edit." },
      { role: "assistant", model: GEMMA, content: "Look at you. Was it the one with the coffee shots?" },
      { role: "user", content: "Yes! The client loved it." },
      { role: "assistant", model: GEMMA, content: "Of course they did. You always overdeliver. Celebrate tonight, okay?" }
    ]},
    { id: "c3", title: "Plan my shoot day", model: GEMMA, updated: NOW - 30 * 3600e3, messages: [{ role: "user", content: "Plan my shoot day" }, { role: "assistant", model: GEMMA, content: "Sure." }] },
    { id: "c4", title: "Pacing for product reels", model: GEMMA, updated: NOW - 3 * 86400e3, messages: [{ role: "user", content: "Pacing" }, { role: "assistant", model: GEMMA, content: "Sure." }] },
    { id: "c5", title: "Caption ideas for a launch", model: GEMMA, updated: NOW - 5 * 86400e3, messages: [{ role: "user", content: "Captions" }, { role: "assistant", model: GEMMA, content: "Sure." }] }
  ],
  current: null
};

async function phoneShots(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, serviceWorkers: "block", timezoneId: "UTC" });
  const page = await ctx.newPage();
  await page.clock.install({ time: NOW });
  const load = async (patch) => {
    await page.goto(base);
    await page.evaluate(s => { localStorage.setItem("vesper.v1", JSON.stringify(s)); }, Object.assign({}, DEMO, patch || {}));
    await page.goto(base); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
  };
  const shot = async name => { await page.waitForTimeout(450); await page.screenshot({ path: path.join(SHOTS, name + ".png") }); };
  const top = "section.page.on:last-of-type";

  await load(); await shot("home");
  await load({ current: "c1" }); await shot("chat");
  await page.click(".reason summary"); await page.waitForTimeout(250); await shot("chat-thinking");
  await load({ current: "c1" }); await page.click("#modelChip"); await shot("models");
  await load({ current: "c2" }); await shot("companion");
  await load({ current: "c1" }); await page.click("#openDrawer"); await shot("drawer");
  await page.click("#openSettings"); await shot("settings");
  await page.click(top + " >> text=App icon"); await shot("icons");
  await load({ current: null, icon: "gold" }); await shot("home-gold");
  await load({ current: "c1", icon: "emerald" }); await shot("chat-emerald");
  await load({ current: null }); await page.click("#openDrawer"); await page.waitForTimeout(400); await page.click("#openSettings"); await page.waitForTimeout(400);
  await page.click(top + " >> text=Memory"); await shot("memory");
  await load({ current: null }); await page.click("#openDrawer"); await page.waitForTimeout(400); await page.click("#openCompanions"); await shot("companions");
  await page.click(top + ' button[aria-label="Options for Seraphine"]'); await page.waitForTimeout(400); await page.click("button:has-text(\"Edit\"):visible"); await page.waitForTimeout(500);
  await page.evaluate(() => { const r = document.querySelector('section.page.on:last-of-type input[aria-label="Hue"]'); r.value = 262; r.dispatchEvent(new Event("input")); }); await shot("char-edit");
  await ctx.close();
}

// Screens for the in app Learn guides: small JPEGs in /learn
async function learnShots(browser, base) {
  const LEARN = path.join(ROOT, "learn");
  fs.mkdirSync(LEARN, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 1.5, hasTouch: true, isMobile: true, serviceWorkers: "block", timezoneId: "UTC" });
  const page = await ctx.newPage();
  await page.clock.install({ time: NOW });
  const top = "section.page.on:last-of-type";
  const load = async (state) => {
    await page.goto(base); await page.evaluate(s => { localStorage.clear(); if (s) localStorage.setItem("vesper.v1", JSON.stringify(s)); }, state || null);
    await page.goto(base); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
  };
  const shot = async name => { await page.waitForTimeout(450); await page.screenshot({ path: path.join(LEARN, name + ".jpg"), type: "jpeg", quality: 78 }); };
  const settings = async () => { await page.click("#openDrawer"); await page.waitForTimeout(400); await page.click("#openSettings"); await page.waitForTimeout(450); };

  await load(null); await shot("connect-1");
  await page.click("text=Connect a model"); await shot("connect-2");
  await page.click(top + " >> text=OpenRouter"); await shot("connect-3");
  await load(DEMO); await shot("connect-4");
  await page.click("#modelChip"); await shot("models-1");
  await load(DEMO); await settings(); await page.click(top + " >> text=Local models"); await page.waitForTimeout(400);
  await page.click(top + " >> text=Which model fits my computer?"); await page.waitForTimeout(300);
  await page.click(top + " .seg >> nth=0 >> text=32 GB"); await page.click(top + " .seg >> nth=1 >> text=12"); await shot("advisor");
  await load(DEMO); await page.click("#openDrawer"); await page.waitForTimeout(400); await page.click("#openCompanions"); await shot("characters-1");
  await page.click(top + ' button:has-text("Create your own")'); await page.waitForTimeout(400);
  await page.fill(top + ' input[aria-label="Name"]', "Juno"); await page.fill(top + " textarea >> nth=0", "A dry witted film buff who knows every behind the scenes story.");
  await page.fill(top + " textarea >> nth=1", "Quick, funny, a little sarcastic."); await shot("characters-2");
  await load(Object.assign({}, DEMO, { current: "c2" })); await shot("characters-3");
  await load(DEMO); await settings(); await page.click(top + " >> text=Memory"); await shot("memory-1");
  const memChat = JSON.parse(JSON.stringify(DEMO));
  memChat.chats.unshift({ id: "c9", title: "About me", model: GEMMA, updated: NOW, messages: [
    { role: "user", content: "I make short video ads, mostly for skincare brands." },
    { role: "assistant", model: GEMMA, saved: 1, content: "Nice. Skincare ads live or die on the first second and the texture shots. Want hooks, shot lists or captions next?" }] });
  memChat.current = "c9"; await load(memChat); await shot("memory-2");
  await load(DEMO); await settings(); await page.click(top + " >> text=Personalize"); await shot("personalize");
  await load(DEMO);
  await page.setInputFiles("#attachFile", [{ name: "shot.jpg", mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(ROOT, "docs", "art", "sample-photo.jpg")) }, { name: "brief.txt", mimeType: "text/plain", buffer: Buffer.from("Launch brief") }]);
  await page.fill("#input", "Write three captions for this shot"); await shot("attach-1");
  await load(DEMO); await settings(); await page.click(top + " >> text=App icon"); await shot("finish");
  await ctx.close();
}

async function desktopShot(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.clock.install({ time: NOW });
  await page.addInitScript(() => {
    window.__TAURI__ = {
      core: { invoke: async (cmd) => {
        if (cmd === "system_info") return { ram_gb: 31.8, vram_gb: 11.9, gpu_name: "NVIDIA GeForce RTX 3060", cores: 12 };
        if (cmd === "list_models") return [{ file: "Qwen3-14B-Q4_K_M.gguf", bytes: 1 }, { file: "gemma-3-4b-it-Q4_K_M.gguf", bytes: 1 }];
        if (cmd === "engine_status") return { running: false, port: 0, model: "" };
        return null;
      } },
      event: { listen: async () => () => {} },
      window: { getCurrentWindow: () => ({ setIcon: async () => {} }) }
    };
  });
  await page.goto(base);
  await page.evaluate(s => localStorage.setItem("vesper.v1", JSON.stringify(s)), Object.assign({}, DEMO, {
    current: null, model: "pc::Qwen3-14B-Q4_K_M.gguf",
    conns: [{ id: "pc", kind: "builtin", name: "This PC", base: "http://127.0.0.1:1/v1", key: "" }],
    models: [{ p: "pc", id: "Qwen3-14B-Q4_K_M.gguf", name: "Qwen 3 14B", note: "On this PC" }, { p: "pc", id: "gemma-3-4b-it-Q4_K_M.gguf", name: "Gemma 3 4B", note: "On this PC" }]
  }));
  await page.goto(base); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOTS, "desktop-home.png") });
  await page.click("#openDrawer"); await page.waitForTimeout(400); await page.click("#openSettings"); await page.waitForTimeout(400);
  await page.click("section.page.on:last-of-type >> text=Local models"); await page.waitForTimeout(400);
  await page.click("section.page.on:last-of-type >> text=Models on this PC"); await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SHOTS, "desktop-pc.png") });
  await page.screenshot({ path: path.join(ROOT, "learn", "pc-1.jpg"), type: "jpeg", quality: 78, clip: { x: 300, y: 0, width: 680, height: 800 } });
  await ctx.close();
}

// README art is laid out as HTML with the app's own font, then captured.
function artPage(body, width) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:Inter;src:url("/fonts/inter-var.woff2") format("woff2");font-weight:100 900}
  *{box-sizing:border-box}
  body{margin:0;width:${width}px;background:#000;color:#f5f5f4;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
  .glow{position:absolute;inset:0;background:radial-gradient(60% 55% at 70% 110%,rgba(58,60,255,.45),rgba(0,0,0,0) 70%),radial-gradient(40% 40% at 15% 0%,rgba(110,168,255,.12),rgba(0,0,0,0) 70%)}
  .phone{width:fit-content;margin:0 auto;border-radius:44px;padding:9px;background:linear-gradient(160deg,#3a3a40,#111114 40%,#2a2a30);box-shadow:0 40px 90px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.08)}
  .phone img{display:block;border-radius:36px}
  .cap{font-size:26px;font-weight:600;letter-spacing:-.02em;text-align:center;margin:0 0 6px}
  .sub{font-size:17px;color:#9a9a98;text-align:center;line-height:1.45;margin:0}
  </style></head><body>${body}</body></html>`;
}
const img = name => "/docs/art/shots/" + name + ".png";
const phone = (name, w) => `<div class="phone"><img src="${img(name)}" style="width:${w}px"></div>`;

async function compose(browser, base) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const render = async (file, html, width) => {
    fs.writeFileSync(path.join(__dirname, "_page.html"), html);
    await page.setViewportSize({ width, height: 400 });
    await page.goto(base + "docs/art/_page.html"); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  };

  await render("banner.png", artPage(`<div style="position:relative;height:760px;overflow:hidden">
    <div class="glow"></div>
    <div style="position:absolute;left:96px;top:150px;width:630px">
      <img src="/icon-512.png" style="width:132px;height:132px;display:block;margin-bottom:34px;filter:drop-shadow(0 18px 50px rgba(80,100,255,.45))">
      <div style="font-size:112px;font-weight:600;letter-spacing:-.045em;line-height:1">Vesper<span style="color:#6ea8ff">.</span></div>
      <div style="font-size:34px;font-weight:500;letter-spacing:-.02em;margin-top:26px;line-height:1.25">Private AI chat for phone and PC.</div>
      <div style="font-size:22px;color:#9a9a98;margin-top:18px;line-height:1.5">Free cloud models with your own key, or models that run right on your computer. No accounts, no servers, nothing stored anywhere but your device.</div>
    </div>
    <div style="position:absolute;right:450px;top:70px">${phone("chat", 330)}</div>
    <div style="position:absolute;right:80px;top:150px">${phone("home", 330)}</div>
  </div>`, 1600), 1600);

  const shows = [["home", "Ask anything", "Free models, one clean place"], ["chat-thinking", "Answers, beautifully set", "See how it thought, copy any part"], ["models", "Every model, one tap", "Switch providers when one runs out"], ["companion", "Characters", "Personalities with their own voice"]];
  await render("showcase.png", artPage(`<div style="position:relative;padding:90px 70px 100px;overflow:hidden"><div class="glow"></div>
    <div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:46px">
    ${shows.map(([n, c, s]) => `<div><div class="cap">${c}</div><p class="sub" style="margin-bottom:34px">${s}</p>${phone(n, 334)}</div>`).join("")}
    </div></div>`, 1700), 1700);

  const more = [["drawer", "Every chat, kept", "Search, rename and find anything"], ["memory", "Remembers what matters", "Facts you share stay on your device"], ["icons", "Six finishes", "Each one recolors the whole app"], ["settings", "Tuned to you", "Personalize, response style and more"]];
  await render("features.png", artPage(`<div style="position:relative;padding:90px 70px 100px;overflow:hidden"><div class="glow" style="transform:scaleX(-1)"></div>
    <div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:46px">
    ${more.map(([n, c, s]) => `<div><div class="cap">${c}</div><p class="sub" style="margin-bottom:34px">${s}</p>${phone(n, 334)}</div>`).join("")}
    </div></div>`, 1700), 1700);

  const chars = [["companions", "Your characters", "Give each one a face"], ["char-edit", "Any photo, any color", "Add a picture and pick a tone"], ["companion", "Their own voice", "Each keeps its own chats"]];
  await render("characters.png", artPage(`<div style="position:relative;padding:90px 120px 100px;overflow:hidden"><div class="glow"></div>
    <div style="position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:70px">
    ${chars.map(([n, c, s]) => `<div><div class="cap">${c}</div><p class="sub" style="margin-bottom:34px">${s}</p>${phone(n, 380)}</div>`).join("")}
    </div></div>`, 1700), 1700);

  const svg = d => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const mic = svg('<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>');
  const end = svg('<path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272"/><path d="M22 2 2 22"/><path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473"/>');
  const cam = svg('<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>');
  const liveCall = (n, name, col, glow, line) => `<div class="phone"><div style="position:relative;width:412px;height:892px;border-radius:36px;overflow:hidden;background:radial-gradient(70% 45% at 50% 38%,${glow},rgba(0,0,0,0) 70%),radial-gradient(90% 60% at 50% 100%,rgba(60,70,255,.22),rgba(0,0,0,0) 70%),#050507">
      <img src="/docs/art/characters/${n}-full.webp" style="position:absolute;left:50%;top:70px;height:1240px;transform:translateX(-50%);filter:drop-shadow(0 30px 60px rgba(0,0,0,.6))">
      <div style="position:absolute;inset:auto 0 0 0;height:420px;background:linear-gradient(180deg,rgba(5,5,7,0),rgba(5,5,7,.85) 45%,#050507)"></div>
      <div style="position:absolute;top:22px;left:0;right:0;display:flex;justify-content:center">
        <div style="display:flex;align-items:center;gap:10px;height:40px;padding:0 16px 0 6px;border-radius:999px;background:rgba(20,20,24,.6);backdrop-filter:blur(14px);box-shadow:0 0 0 1px rgba(255,255,255,.08)">
          <span style="width:30px;height:30px;border-radius:50%;background:${col} url(/docs/art/characters/av-${n}.webp) center/cover;box-shadow:0 0 0 1.5px ${col}"></span><b style="font-size:16px;font-weight:600">${name}</b>
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:${col};font-weight:600"><i style="width:7px;height:7px;border-radius:50%;background:#7ee8a0;box-shadow:0 0 10px #7ee8a0"></i>Live</span></div></div>
      <div style="position:absolute;left:26px;right:26px;bottom:150px;padding:16px 18px;border-radius:20px;background:rgba(22,22,28,.72);backdrop-filter:blur(16px);box-shadow:0 0 0 1px rgba(255,255,255,.08);font-size:17px;line-height:1.45;color:#ececea">${line}</div>
      <div style="position:absolute;left:0;right:0;bottom:46px;display:flex;justify-content:center;gap:26px">
        <div style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:rgba(40,40,46,.8);box-shadow:0 0 0 1px rgba(255,255,255,.1)">${mic}</div>
        <div style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:#ff5a5f;color:#fff">${end}</div>
        <div style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:rgba(40,40,46,.8);box-shadow:0 0 0 1px rgba(255,255,255,.1)">${cam}</div></div>
    </div></div>`;
  const side = (html, z, dx) => `<div style="position:relative;z-index:${z};transform:translateX(${dx}px) scale(${z === 2 ? 1 : .86});transform-origin:center;${z === 2 ? "" : "filter:brightness(.78)"}">${html}</div>`;
  await render("live.png", artPage(`<div style="position:relative;height:1100px;padding:0 90px;overflow:hidden;display:flex;align-items:center;gap:40px"><div class="glow"></div>
    <div style="position:relative;flex:0 0 470px">
      <div style="display:inline-block;font-size:15px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#6ea8ff;background:rgba(110,168,255,.14);padding:7px 14px;border-radius:999px;margin-bottom:28px">Coming soon · Beta</div>
      <div style="font-size:84px;font-weight:600;letter-spacing:-.04em;line-height:1.02">Live<br>Characters</div>
      <div style="font-size:26px;color:#9a9a98;margin-top:24px;line-height:1.45">A real virtual character you can see, hear and talk to, face to face. Private, like the rest of Vesper.</div></div>
    <div style="position:relative;flex:1;display:flex;align-items:center;justify-content:flex-start">
      ${side(liveCall("aurelia", "Aurelia", "#f0c26b", "rgba(255,190,90,.3)", "Close your eyes. We're in Kyoto, and the lanterns just came on."), 1, 60)}
      ${side(liveCall("seraphine", "Seraphine", "#b89cff", "rgba(150,110,255,.38)", "You're back! Tell me everything. Did the client love the edit?"), 2, 0)}
      ${side(liveCall("scarlet", "Scarlet", "#ff8f8f", "rgba(255,80,110,.32)", "Bold take incoming. Your second hook was better. Fight me."), 1, -60)}
    </div></div>`, 1900), 1900);

  const fin = ["chrome", "gold", "rose", "graphite", "midnight", "emerald"];
  const finNames = { chrome: "Chrome", gold: "Gold", rose: "Rose Gold", graphite: "Graphite", midnight: "Midnight", emerald: "Emerald" };
  await render("finishes.png", artPage(`<div style="position:relative;padding:80px 70px 70px;overflow:hidden"><div class="glow"></div>
    <div style="position:relative;text-align:center;font-size:44px;font-weight:600;letter-spacing:-.03em">Pick your finish</div>
    <p class="sub" style="position:relative;font-size:20px;margin:12px 0 54px">The icon and the whole app change together.</p>
    <div style="position:relative;display:flex;justify-content:center;gap:34px">
    ${fin.map(f => `<div style="text-align:center"><img src="${f === "chrome" ? "/icon-512.png" : "/icons/" + f + "/icon-512.png"}" style="width:170px;height:170px;filter:drop-shadow(0 20px 40px rgba(0,0,0,.6))"><div style="font-size:20px;font-weight:500;margin-top:16px;color:#cfcfcc">${finNames[f]}</div></div>`).join("")}
    </div>
    <div style="position:relative;display:flex;justify-content:center;gap:46px;margin-top:70px">${phone("home-gold", 300)}${phone("chat-emerald", 300)}</div>
  </div>`, 1700), 1700);

  await render("windows.png", artPage(`<div style="position:relative;padding:80px 90px 90px;overflow:hidden"><div class="glow"></div>
    <div style="position:relative;text-align:center;font-size:44px;font-weight:600;letter-spacing:-.03em">Vesper for Windows</div>
    <p class="sub" style="position:relative;font-size:20px;margin:12px 0 46px">Download a model and run it right on your PC. Offline, private, one tap.</p>
    <div style="position:relative;margin:0 auto;width:1280px;border-radius:14px;overflow:hidden;box-shadow:0 50px 120px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.1)">
      <div style="height:40px;background:#1b1b1e;display:flex;align-items:center;gap:10px;padding:0 14px;font-size:14px;color:#cfcfcc"><img src="/icon-192.png" style="width:18px;height:18px">Vesper<span style="margin-left:auto;letter-spacing:18px;color:#8a8a8a">─ ☐ ✕</span></div>
      <img src="${img("desktop-pc")}" style="display:block;width:1280px">
    </div></div>`, 1460), 1460);
  // why Vesper: honest comparison with typical AI chat apps
  const rows = [
    ["Account", "Sign up required", "None. Open and chat"],
    ["Your chats", "Stored on their servers", "Only on your device"],
    ["Models", "One company's models", "Dozens of free models, plus your own PC"],
    ["Price", "Monthly plan for the good stuff", "Free"],
    ["Offline", "No", "Yes, with models on your PC"],
    ["Filters", "Set by the company", "Your call, with Freeform models"]
  ];
  await render("why.png", artPage(`<div style="position:relative;padding:80px 110px 90px;overflow:hidden"><div class="glow"></div>
    <div style="position:relative;text-align:center;font-size:48px;font-weight:600;letter-spacing:-.035em">Why Vesper</div>
    <p class="sub" style="position:relative;font-size:21px;margin:12px 0 50px">Private by design, free by default, yours to shape.</p>
    <div style="position:relative;border:1px solid #26262a;border-radius:28px;overflow:hidden;background:#0b0b0d">
      <div style="display:grid;grid-template-columns:1.1fr 1.6fr 1.9fr;font-size:17px;font-weight:600;color:#8d8d8a;padding:22px 34px;border-bottom:1px solid #1d1d20">
        <div></div><div>Typical AI chat apps</div><div style="color:#6ea8ff;display:flex;align-items:center;gap:10px"><img src="/icon-192.png" style="width:26px;height:26px;border-radius:7px">Vesper</div></div>
      ${rows.map(([k, a, v], i) => `<div style="display:grid;grid-template-columns:1.1fr 1.6fr 1.9fr;align-items:center;padding:22px 34px;font-size:21px;${i ? "border-top:1px solid #18181b" : ""}">
        <div style="color:#cfcfcc;font-weight:500">${k}</div><div style="color:#77777a">${a}</div><div style="font-weight:600;display:flex;align-items:center;gap:12px"><span style="width:24px;height:24px;border-radius:50%;background:rgba(110,168,255,.16);color:#6ea8ff;display:grid;place-items:center;font-size:15px">✓</span>${v}</div></div>`).join("")}
    </div></div>`, 1500), 1500);

  // portrait promo slides, 1080 by 1350
  fs.mkdirSync(path.join(OUT, "promo"), { recursive: true });
  const slide = (title, sub, inner) => artPage(`<div style="position:relative;width:1080px;height:1350px;overflow:hidden"><div class="glow"></div>
    <div style="position:absolute;left:0;right:0;top:92px;text-align:center;padding:0 80px">
      <div style="display:inline-flex;align-items:center;gap:12px;font-size:24px;font-weight:600;color:#cfcfcc;margin-bottom:34px"><img src="/icon-192.png" style="width:40px;height:40px;border-radius:11px">Vesper</div>
      <div style="font-size:76px;font-weight:600;letter-spacing:-.04em;line-height:1.04">${title}</div>
      <div style="font-size:28px;color:#9a9a98;margin-top:22px;line-height:1.4">${sub}</div></div>
    ${inner}</div>`, 1080);
  const phoneAt = (name, w, top, x) => `<div style="position:absolute;top:${top}px;left:${x}px">${phone(name, w)}</div>`;
  await render("promo/1-every-ai.png", slide("Every AI.<br>One private app.", "Dozens of free models. No account, no subscription.",
    phoneAt("chat", 400, 520, 120) + phoneAt("models", 400, 600, 560)), 1080);
  await render("promo/2-private.png", slide("Your chats never<br>leave your phone.", "No servers, no tracking. Keys, chats and memory stay on your device.",
    phoneAt("drawer", 400, 560, 120) + phoneAt("memory", 400, 620, 560)), 1080);
  await render("promo/3-your-pc.png", slide("Run AI on your PC.<br>Offline.", "Vesper for Windows picks models that fit your computer and runs them right there.",
    `<div style="position:absolute;left:60px;right:60px;top:600px;border-radius:16px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.1)"><img src="${img("desktop-pc")}" style="display:block;width:960px"></div>`), 1080);
  await render("promo/4-characters.png", slide("Characters with<br>real personality.", "Pick a ready character or create your own. Each keeps its own chats.",
    phoneAt("companions", 400, 540, 120) + phoneAt("companion", 400, 610, 560)), 1080);
  await ctx.close();
}

(async () => {
  await new Promise(r => server.listen(8791, r));
  const base = "http://localhost:8791/";
  const browser = await chromium.launch();
  try {
    await phoneShots(browser, base);
    await learnShots(browser, base);
    await desktopShot(browser, base);
    await compose(browser, base);
  } finally {
    await browser.close(); server.close();
    fs.rmSync(path.join(__dirname, "_page.html"), { force: true });
  }
  console.log("README images written to docs/");
})();
