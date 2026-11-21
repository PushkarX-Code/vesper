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
    { id: "k1", name: "Mira", about: "A calm, curious night owl who loves films and late talks.", style: "Warm, playful, short texts.", story: "", greeting: "Hey you. Long day?", color: "#f5a3b6" },
    { id: "k2", name: "Atlas", about: "A sharp creative director who pushes your ideas further.", style: "Direct and full of energy.", story: "", greeting: "", color: "#6ea8ff" }
  ],
  chats: [
    { id: "c1", title: "Hooks for a skincare ad", model: GEMMA, updated: NOW - 60e3, messages: [
      { role: "user", content: "Give me 3 hooks for a 15 second skincare ad. Make them stop the scroll." },
      { role: "assistant", model: GEMMA, secs: 4, reasoning: "Short openers, one idea each, built for the first second of a vertical video.",
        content: "Here are three that land in the first second:\n\n1. **\"I stopped buying serums after this.\"** Curiosity plus a bold claim.\n2. **\"Your bathroom shelf is lying to you.\"** Calls out the viewer directly.\n3. **\"Watch my skin in 10 seconds.\"** Promises a visible payoff.\n\nOpen on a tight close up, cut every 1.5 seconds, and get the product in frame by second 3." }
    ]},
    { id: "c2", title: "Mira", model: GEMMA, companion: "k1", updated: NOW - 3600e3, messages: [
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
  await ctx.close();
}

// README art is laid out as HTML with the app's own font, then captured.
function artPage(body, width) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:Inter;src:url("/fonts/inter-var.woff2") format("woff2");font-weight:100 900}
  *{box-sizing:border-box}
  body{margin:0;width:${width}px;background:#000;color:#f5f5f4;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
  .glow{position:absolute;inset:0;background:radial-gradient(60% 55% at 70% 110%,rgba(58,60,255,.45),rgba(0,0,0,0) 70%),radial-gradient(40% 40% at 15% 0%,rgba(110,168,255,.12),rgba(0,0,0,0) 70%)}
  .phone{border-radius:44px;padding:9px;background:linear-gradient(160deg,#3a3a40,#111114 40%,#2a2a30);box-shadow:0 40px 90px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.08)}
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

  const shows = [["home", "Ask anything", "Free models, one clean place"], ["chat-thinking", "Answers, beautifully set", "See how it thought, copy any part"], ["models", "Every model, one tap", "Switch providers when one runs out"], ["companion", "Companions", "Personalities with their own voice"]];
  await render("showcase.png", artPage(`<div style="position:relative;padding:90px 70px 100px;overflow:hidden"><div class="glow"></div>
    <div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:46px">
    ${shows.map(([n, c, s]) => `<div><div class="cap">${c}</div><p class="sub" style="margin-bottom:34px">${s}</p>${phone(n, 334)}</div>`).join("")}
    </div></div>`, 1700), 1700);

  const more = [["drawer", "Every chat, kept", "Search, rename and find anything"], ["memory", "Remembers what matters", "Facts you share stay on your device"], ["icons", "Seven finishes", "Each one recolors the whole app"], ["settings", "Tuned to you", "Personalize, response style and more"]];
  await render("features.png", artPage(`<div style="position:relative;padding:90px 70px 100px;overflow:hidden"><div class="glow" style="transform:scaleX(-1)"></div>
    <div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:46px">
    ${more.map(([n, c, s]) => `<div><div class="cap">${c}</div><p class="sub" style="margin-bottom:34px">${s}</p>${phone(n, 334)}</div>`).join("")}
    </div></div>`, 1700), 1700);

  const fin = ["chrome", "gold", "rose", "graphite", "midnight", "emerald", "aurora"];
  const finNames = { chrome: "Chrome", gold: "Gold", rose: "Rose Gold", graphite: "Graphite", midnight: "Midnight", emerald: "Emerald", aurora: "Aurora" };
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
  await ctx.close();
}

(async () => {
  await new Promise(r => server.listen(8791, r));
  const base = "http://localhost:8791/";
  const browser = await chromium.launch();
  try {
    await phoneShots(browser, base);
    await desktopShot(browser, base);
    await compose(browser, base);
  } finally {
    await browser.close(); server.close();
    fs.rmSync(path.join(__dirname, "_page.html"), { force: true });
  }
  console.log("README images written to docs/");
})();
