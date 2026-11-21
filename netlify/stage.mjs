// Builds the Netlify upload folder: the web app (desktop/dist) plus the Ko-fi function.
import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, ".."), dist = join(root, "desktop", "dist");
execFileSync("node", [join(root, "desktop", "scripts", "copy-web.mjs")], { stdio: "inherit" });
cpSync(join(here, "netlify.toml"), join(dist, "netlify.toml"));
cpSync(join(here, "package.json"), join(dist, "package.json"));
cpSync(join(here, "functions"), join(dist, "netlify", "functions"), { recursive: true });
console.log("Netlify folder ready: desktop/dist");
