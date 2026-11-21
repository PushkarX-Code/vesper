// Copies the web app (the same files GitHub Pages serves) into desktop/dist for the Windows build.
import { cpSync, mkdirSync, rmSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const desktop = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(desktop, "..");
const dist = join(desktop, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const files = readdirSync(root).filter(f =>
  f === "index.html" || f === "sw.js" || f === "version.json" || /^manifest.*\.webmanifest$/.test(f));
for (const f of files) cpSync(join(root, f), join(dist, f));
for (const d of ["fonts", "vendor", "icons", "chars", "studio", "learn"]) if (existsSync(join(root, d))) cpSync(join(root, d), join(dist, d), { recursive: true });
console.log("Copied " + files.length + " files and fonts, vendor, icons into desktop/dist");
