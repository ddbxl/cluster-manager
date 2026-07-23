#!/usr/bin/env node
/*
 * Cluster Manager — build script
 * ------------------------------------------------------------------
 * Turns src/ClusterManagerSimulator.jsx into the self-contained
 * index.html that GitHub Pages serves and that you can double-click
 * to play offline.
 *
 * Usage:
 *     npm install          # one-time: installs esbuild + react
 *     node build/build.mjs           # writes index.html
 *     node build/build.mjs --readable # also writes index_readable.html (unminified, for debugging)
 *
 * There is deliberately no framework and no config file: one script,
 * one command, one output. React and the game engine are compiled in,
 * so the result makes zero network calls except to load web fonts.
 * ------------------------------------------------------------------
 */

import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src", "ClusterManagerSimulator.jsx");
const READABLE = process.argv.includes("--readable");

// ── Meta / branding (edit these if you fork) ─────────────────────
const SITE_URL = "https://ddbxl.github.io/cluster-manager/";
const DESC =
  "A browser strategy game: grow a regional cluster into the Pan-European " +
  "Cluster Network across 27 countries. Real NUTS-2 map, rival AI, political " +
  "seats, EU-style project finance.";
// Inline SVG favicon (three linked nodes) — no separate icon file needed.
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E" +
  "%3Crect width='100' height='100' rx='18' fill='%23004494'/%3E" +
  "%3Ccircle cx='50' cy='38' r='12' fill='%23FF9D0A'/%3E" +
  "%3Ccircle cx='28' cy='66' r='9' fill='%23fff'/%3E" +
  "%3Ccircle cx='72' cy='66' r='9' fill='%23fff'/%3E" +
  "%3Cpath d='M50 50 28 58M50 50l22 8' stroke='%23fff' stroke-width='4'/%3E%3C/svg%3E";
const OG_IMG = SITE_URL + "preview.png"; // committed screenshot used for link previews

// ── The app entry point, generated on the fly ────────────────────
// It (1) installs a localStorage-backed storage shim matching the
// async API the game expects, then (2) mounts <App/>. We write it to
// a temp dir alongside a copy of the source so esbuild can resolve
// the relative import, then clean up.
const ENTRY = `
(function(){
  if (typeof window === "undefined" || window.storage) return;
  // Prefer localStorage (persists across sessions); fall back to in-memory when the
  // browser blocks it (some privacy modes / sandboxed origins) so saving never crashes.
  let backend;
  try {
    const ls = window.localStorage; ls.setItem("__probe__","1"); ls.removeItem("__probe__");
    backend = { get:k=>ls.getItem(k), set:(k,v)=>ls.setItem(k,v), del:k=>ls.removeItem(k),
                keys:()=>{const a=[];for(let i=0;i<ls.length;i++)a.push(ls.key(i));return a;} };
  } catch(e) {
    const mem = new Map();
    backend = { get:k=>mem.has(k)?mem.get(k):null, set:(k,v)=>mem.set(k,v), del:k=>mem.delete(k), keys:()=>[...mem.keys()] };
  }
  window.storage = {
    async get(key){ const v = backend.get(key); if (v === null || v === undefined) throw new Error("key not found"); return {key, value:v}; },
    async set(key, value){ backend.set(key, String(value)); return {key, value}; },
    async delete(key){ backend.del(key); return {key, deleted:true}; },
    async list(prefix=""){ return { keys: backend.keys().filter(k=>k && k.startsWith(prefix)) }; },
  };
})();

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./ClusterManagerSimulator.jsx";
createRoot(document.getElementById("root")).render(<App/>);
`;

// esbuild inserts module-path banner comments (e.g. "// index.jsx",
// "// node_modules/react/index.js") into non-minified bundles. Strip any
// line that is nothing but such a comment so the readable build doesn't
// advertise internal file names. Real code comments are left untouched.
function stripModuleComments(js) {
  const marker = /^\s*\/\/\s*\S+\.(jsx|mjs|cjs|js|ts|json)\s*$/;
  return js
    .split("\n")
    .filter((line) => !marker.test(line))
    .join("\n");
}

function htmlShell(js, { readable }) {
  const title =
    "Cluster Manager · EU Industrial Strategy Simulation" +
    (readable ? " (readable build)" : "");
  const header = readable
    ? `
<!-- Cluster Manager — readable build. Free software (GNU GPL v3). -->`
    : "";
  if (readable) js = stripModuleComments(js);
  // Escape any literal </script> in the bundle so it can't close our tag early.
  const safeJs = js.replace(/<\/script/g, "<\\/script");
  return `<!DOCTYPE html>${header}
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${DESC}">
<link rel="icon" href="${FAVICON}">
<link rel="apple-touch-icon" href="${FAVICON}">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#004494">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Cluster Manager">
<meta property="og:type" content="website">
<meta property="og:title" content="Cluster Manager · EU Industrial Strategy Simulation">
<meta property="og:description" content="${DESC}">
<meta property="og:image" content="${OG_IMG}">
<meta property="og:url" content="${SITE_URL}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Cluster Manager · EU Industrial Strategy Simulation">
<meta name="twitter:description" content="${DESC}">
<meta name="twitter:image" content="${OG_IMG}">
<style>html,body{margin:0;padding:0;height:100%;background:#F8F9FD}#root{height:100%}noscript{display:block;padding:40px;font-family:sans-serif;color:#26324B}</style>
</head>
<body>
<div id="root"></div>
<noscript>Cluster Manager needs JavaScript enabled to run.</noscript>
<script>
${safeJs}
</script>
</body>
</html>
`;
}

async function bundle({ minify }) {
  // esbuild needs the entry file to sit next to the source so the relative
  // import resolves. Use a temp dir, copy the source in, build, clean up.
  const dir = mkdtempSync(join(tmpdir(), "cm-build-"));
  try {
    writeFileSync(join(dir, "ClusterManagerSimulator.jsx"), readFileSync(SRC));
    writeFileSync(join(dir, "entry.jsx"), ENTRY);
    const result = await build({
      entryPoints: [join(dir, "entry.jsx")],
      bundle: true,
      minify,
      format: "iife",
      loader: { ".jsx": "jsx" },
      jsx: "automatic",
      define: { "process.env.NODE_ENV": '"production"' },
      // The entry/source live in a temp dir, but the dependencies are installed
      // in the repo root — nodePaths lets esbuild find react/react-dom there.
      nodePaths: [join(ROOT, "node_modules")],
      write: false,
      logLevel: "error",
    });
    return result.outputFiles[0].text;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  const prod = await bundle({ minify: true });
  const html = htmlShell(prod, { readable: false });
  writeFileSync(join(ROOT, "index.html"), html);
  console.log(`✓ index.html  (${Math.round(html.length / 1024)} KB)`);

  if (READABLE) {
    const dev = await bundle({ minify: false });
    const devHtml = htmlShell(dev, { readable: true });
    writeFileSync(join(ROOT, "index_readable.html"), devHtml);
    console.log(`✓ index_readable.html  (${Math.round(devHtml.length / 1024)} KB)`);
  }
  console.log("Done. Open index.html in a browser, or commit it to deploy via GitHub Pages.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
