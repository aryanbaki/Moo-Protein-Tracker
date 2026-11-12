#!/usr/bin/env node
/**
 * Renders the app icon and splash image from the same artwork the app draws
 * (src/mascot/art.ts), so the icon can never drift from the in-app cow.
 *
 *   node scripts/generate-icons.mjs
 *
 * Outputs assets/icon.png (1024x1024, opaque) and assets/splash-icon.png
 * (1024x1024, transparent). Needs Playwright with Chromium; it is resolved from
 * the project first, then from PLAYWRIGHT_PATH or the cloud image's global tools.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));

function loadPlaywright() {
  const candidates = [root, process.env.PLAYWRIGHT_PATH, '/opt/node-tools'].filter(Boolean);
  for (const base of candidates) {
    try {
      return createRequire(path.join(base, 'package.json'))('playwright');
    } catch {
      // try the next location
    }
  }
  throw new Error('Playwright not found. Install it or set PLAYWRIGHT_PATH to a folder whose node_modules has it.');
}

/** Transpile the TypeScript art + theme modules to a temp dir and import them. */
async function loadArt() {
  const ts = require('typescript');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'moo-art-'));
  const transpile = (file) =>
    ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
  fs.mkdirSync(path.join(tmp, 'theme'));
  fs.mkdirSync(path.join(tmp, 'mascot'));
  fs.writeFileSync(path.join(tmp, 'theme', 'index.mjs'), transpile('src/theme/index.ts'));
  fs.writeFileSync(path.join(tmp, 'mascot', 'art.mjs'), transpile('src/mascot/art.ts').replace("'../theme'", "'../theme/index.mjs'"));
  const art = await import(pathToFileURL(path.join(tmp, 'mascot', 'art.mjs')).href);
  const theme = await import(pathToFileURL(path.join(tmp, 'theme', 'index.mjs')).href);
  fs.rmSync(tmp, { recursive: true, force: true });
  return { art, theme };
}

const { art, theme } = await loadArt();
const { colors } = theme;
const vb = art.HEAD_VB;
const font = fs.readFileSync(require.resolve('@expo-google-fonts/nunito/900Black/Nunito_900Black.ttf')).toString('base64');

/** The head as a nested <svg>, placed at x/y with the given width (it is square). */
function head(x, y, size, pose = 'idle') {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">${art.shapesToSvg(art.headStack(pose), 'icon')}</svg>`;
}

const O = colors.cowOutline;

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="${colors.fill}"/>
      <stop offset="1" stop-color="${colors.primary}"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <ellipse cx="512" cy="1010" rx="640" ry="190" fill="${colors.primaryDark}" opacity="0.55"/>
  ${head(36, 250, 790)}
  <g transform="rotate(7 760 210)">
    <path d="M 640 300 L 600 392 L 720 318 Z" fill="${colors.background}" stroke="${O}" stroke-width="20" stroke-linejoin="round"/>
    <rect x="534" y="92" width="440" height="232" rx="112" fill="${colors.background}" stroke="${O}" stroke-width="20"/>
    <path d="M 650 290 L 641 330 L 700 314 L 704 290 Z" fill="${colors.background}"/>
    <text x="754" y="256" text-anchor="middle" font-family="MooNunito" font-size="136" letter-spacing="2" fill="${colors.text}">MOO!</text>
  </g>
</svg>`;

const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${head(62, 62, 900)}
</svg>`;

const page = (svg) => `<!doctype html><html><head><style>
@font-face { font-family: MooNunito; src: url(data:font/ttf;base64,${font}) format('truetype'); }
html, body { margin: 0; background: transparent; }
svg { display: block; }
</style></head><body>${svg}</body></html>`;

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
try {
  const tab = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });

  await tab.setContent(page(iconSvg));
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: path.join(root, 'assets', 'icon.png'), omitBackground: false });

  await tab.setContent(page(splashSvg));
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: path.join(root, 'assets', 'splash-icon.png'), omitBackground: true });
} finally {
  await browser.close();
}
console.log('Wrote assets/icon.png and assets/splash-icon.png');
