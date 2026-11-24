// Builds the Netlify upload folder: the web app (desktop/dist) plus the Ko-fi function.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, ".."), dist = join(root, "desktop", "dist");
execFileSync("node", [join(root, "desktop", "scripts", "copy-web.mjs")], { stdio: "inherit" });
cpSync(join(here, "netlify.toml"), join(dist, "netlify.toml"));
cpSync(join(here, "package.json"), join(dist, "package.json"));
cpSync(join(here, "functions"), join(dist, "netlify", "functions"), { recursive: true });
// Bundle the function so a CLI deploy works without installing dependencies on the build machine.
const fn = join(dist, "netlify", "functions", "kofi.mjs");
const nodeModules = join(here, "node_modules", "esbuild", "bin", "esbuild");
const bundler = existsSync(nodeModules) ? nodeModules : null;
if (bundler) execFileSync(bundler, [join(here, "functions", "kofi.mjs"), "--bundle", "--platform=node", "--format=esm", "--target=node22", `--outfile=${fn}`], { stdio: "inherit" });
else execFileSync("npx", ["-y", "esbuild@latest", join(here, "functions", "kofi.mjs"), "--bundle", "--platform=node", "--format=esm", "--target=node22", `--outfile=${fn}`], { stdio: "inherit" });
console.log("Netlify folder ready: desktop/dist");
