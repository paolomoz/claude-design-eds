#!/usr/bin/env node
/**
 * tools/da/visual-diff.mjs
 *
 * Prototype ↔ EDS visual reconcile probe for the stardust-to-snowflake skill
 * (optional Step 10). Renders BOTH the source prototype and the converted EDS
 * page at a fixed viewport with reduced motion, captures screenshots, and emits
 * a STRUCTURED metrics report — not a pixel diff. Computed-style measurements
 * (container widths, image natural-vs-rendered dims, heading colors) are the
 * signal; pixels are noise (fonts, animation, dynamic mock data).
 *
 * It also self-diagnoses the EDS page for the known post-pipeline regressions
 * the skill keeps re-learning:
 *   - stretched images        (#36 — EDS <img> width/height attrs + no height:auto)
 *   - full-bleed content      (#37 — dropped max-width .wrap, worst on plain bg)
 * The prototype side is for the agent to compare headings/eyebrow colors etc.
 *
 * Usage:
 *   node tools/da/visual-diff.mjs <prototypeURL> <edsURL> [options]
 *     --out <dir>        screenshot output dir            (default qa/vdiff)
 *     --width <px>       viewport width                   (default 1280)
 *     --sections <list>  comma-separated CSS selectors to also shoot per-section
 *                        (applied to whichever page has them)
 *
 * Example:
 *   node tools/da/visual-diff.mjs \
 *     http://localhost:8791/prototypes/home-C-cinematic.html \
 *     https://<branch>--<repo>--<owner>.aem.page/<path> \
 *     --sections ".hero,.feature-tabs,.compare"
 *
 * Prereq: a RENDERABLE prototype. Static prototypes serve directly (python3 -m
 * http.server from the dir so relative ../assets resolve); JSX prototypes must be
 * pre-rendered first (skill #24/#27). Requires playwright (project devDependency).
 *
 * Exit codes: 0 ran (report on stdout; red flags do NOT fail the run — they are
 * advisory for the agent), 1 error.
 */

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-restricted-syntax, brace-style, object-curly-newline, max-len */
/* standalone dev tool: playwright is a devDependency; sequential page ops use awaited loops by design */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

function parseArgs(argv) {
  const [, , proto, eds, ...rest] = argv;
  const opts = { out: 'qa/vdiff', width: 1280, sections: [] };
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--out') { opts.out = rest[i += 1]; }
    else if (a === '--width') { opts.width = Number(rest[i += 1]); }
    else if (a === '--sections') { opts.sections = (rest[i += 1] || '').split(',').map((s) => s.trim()).filter(Boolean); }
  }
  return { proto, eds, opts };
}

// Runs IN the page. Returns the structured metric set + intra-page red flags.
/* eslint-disable no-undef */
function analyse() {
  const vw = window.innerWidth;
  const round = (n) => Math.round(n);

  const images = [...document.querySelectorAll('img')].map((img) => {
    const r = img.getBoundingClientRect();
    const nW = img.naturalWidth; const nH = img.naturalHeight;
    const natAR = nW && nH ? nW / nH : 0;
    const renAR = r.width && r.height ? r.width / r.height : 0;
    const isSvg = /\.svg(\?|$)/i.test(img.currentSrc || img.src || '');
    const stretched = !isSvg && natAR && renAR && Math.abs(natAR - renAR) / natAR > 0.04;
    return {
      src: (img.currentSrc || img.src || '').split('/').pop(),
      natural: `${nW}x${nH}`,
      rendered: `${round(r.width)}x${round(r.height)}`,
      stretched,
    };
  });

  const headings = [...document.querySelectorAll('h1, h2, h3')].map((h) => {
    const cs = getComputedStyle(h);
    return {
      tag: h.tagName.toLowerCase(),
      text: h.textContent.trim().slice(0, 32),
      color: cs.color,
      fontSize: cs.fontSize,
    };
  });

  // small UPPERCASE labels (eyebrow-like) — catches dropped shared primitives
  const eyebrows = [...document.querySelectorAll('p, span, div')].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.textTransform === 'uppercase' && parseFloat(cs.fontSize) <= 16
      && el.textContent.trim().length > 0 && el.textContent.trim().length < 60
      && el.children.length === 0;
  }).slice(0, 8).map((el) => {
    const cs = getComputedStyle(el);
    return { text: el.textContent.trim().slice(0, 24), color: cs.color };
  });

  // Dropped-max-width-wrap symptom (#37): LEFT-ANCHORED text flush to the
  // viewport edge. A block root spanning full width is fine (EDS sections do
  // that — the wrap is on an inner element); the visible bug is a heading/para
  // whose own left edge sits at ~0 with no padding. Skip centered text (a
  // centered element is legitimately full-width with left 0) and skip elements
  // that span nearly the whole width (centered/justified blocks, not left-anchored).
  const flushText = [...document.querySelectorAll('main h1, main h2, main h3, main p')].filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false; // skip hidden (display:none → 0 rect)
    const cs = getComputedStyle(el);
    return r.left < 12 && r.right < vw - 40 && cs.textAlign !== 'center' && el.textContent.trim().length > 0;
  }).slice(0, 8).map((el) => ({
    tag: el.tagName.toLowerCase(),
    text: el.textContent.trim().slice(0, 28),
    left: round(el.getBoundingClientRect().left),
  }));

  // Advisory: the widest text-bearing block content boxes + left offset, so the
  // agent can eyeball proto vs eds (a wrapped block sits at left≈(vw-maxw)/2+pad).
  const STRUCT = /(^|[\s-])(section|block-content|default-content|wrapper)([\s-]|$)/i;
  let boxes = [...document.querySelectorAll('main [class]')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width >= vw * 0.6 && el.querySelector('h1, h2, h3, p') && !STRUCT.test((el.className || '').toString());
  });
  boxes = boxes.filter((el) => !boxes.some((o) => o !== el && el.contains(o))).slice(0, 12).map((el) => {
    const r = el.getBoundingClientRect();
    return { sel: (el.className || '').toString().trim().split(/\s+/)[0], width: round(r.width), left: round(r.left) };
  });

  return { viewport: vw, images, headings, eyebrows, flushText, contentBoxes: boxes };
}
/* eslint-enable no-undef */

async function capture(browser, url, tag, opts) {
  const ctx = await browser.newContext({ viewport: { width: opts.width, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  // scroll through to trigger reveal-on-scroll / lazy images, then return to top
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y); await new Promise((r) => { setTimeout(r, 50); });
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${opts.out}/${tag}-full.png`, fullPage: true });
  for (const sel of opts.sections) {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(200);
      const safe = sel.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
      await loc.screenshot({ path: `${opts.out}/${tag}-${safe}.png` }).catch(() => {});
    }
  }
  const metrics = await page.evaluate(analyse);
  await ctx.close();
  return metrics;
}

function redFlags(eds) {
  const flags = [];
  eds.images.filter((i) => i.stretched).forEach((i) => {
    flags.push(`STRETCHED IMAGE (#36): ${i.src} natural ${i.natural} → rendered ${i.rendered}. Add 'height: auto' to the img reset / block CSS.`);
  });
  eds.flushText.forEach((f) => {
    flags.push(`FLUSH-LEFT TEXT (#37): <${f.tag}> "${f.text}" sits at left ${f.left}px (no padding). Likely a dropped max-width .wrap (max-width: var(--maxw); margin: 0 auto; padding: 0 24px) on the owning block.`);
  });
  return flags;
}

async function main() {
  const { proto, eds, opts } = parseArgs(process.argv);
  if (!proto || !eds) {
    process.stderr.write('usage: node tools/da/visual-diff.mjs <prototypeURL> <edsURL> [--out dir] [--width px] [--sections a,b]\n');
    process.exit(1);
  }
  mkdirSync(resolve(opts.out), { recursive: true });
  const browser = await chromium.launch();
  let report;
  try {
    const [protoM, edsM] = [await capture(browser, proto, 'proto', opts), await capture(browser, eds, 'eds', opts)];
    report = { viewport: opts.width, out: opts.out, proto: protoM, eds: edsM, redFlags: redFlags(edsM) };
  } finally {
    await browser.close();
  }

  const f = report.redFlags;
  process.stdout.write(`\nVisual diff @ ${opts.width}px — screenshots in ${opts.out}/\n`);
  process.stdout.write(`\nEDS red flags (advisory): ${f.length ? '' : 'none'}\n`);
  f.forEach((x) => process.stdout.write(`  • ${x}\n`));
  process.stdout.write('\nFull metrics JSON (compare proto vs eds: heading colors, eyebrow colors, image dims, full-bleed):\n');
  process.stdout.write(`${JSON.stringify({ proto: report.proto, eds: report.eds }, null, 1)}\n`);
}

main().catch((e) => { process.stderr.write(`visual-diff error: ${e.message}\n`); process.exit(1); });
