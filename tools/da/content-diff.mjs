#!/usr/bin/env node
/**
 * tools/da/content-diff.mjs
 *
 * Prototype ↔ EDS STRUCTURAL content + typography reconcile for the
 * stardust-to-snowflake skill (Step 10, run alongside visual-diff.mjs).
 *
 * visual-diff.mjs reasons about PIXELS via heuristics (stretch / flush / blank /
 * colour) — it is structurally blind to "the right text is in the wrong slot" or
 * "one CTA is gone": the pixels are full, the colours plausible, nothing looks
 * blank, so no flag fires. Those are the failures it kept missing (the-people
 * eyebrow↔body swap #76, the dropped the-place CTA, the typography fork #77).
 *
 * This tool adds the missing layer: it extracts an ORDERED, role-classified
 * inventory of every text-bearing node ({role, text, href, alt}) from each page's
 * <main>, classifying by COMPUTED STYLE + tag (symmetric across the prototype's
 * .ds-* DOM and the EDS block DOM), then DIFFS the two inventories:
 *   - MISSING   a proto heading / CTA / eyebrow with no EDS match   (🔴 structural)
 *   - ROLE SWAP same text present but under a different role         (🔴 the #76 class)
 *   - MISSING BODY / EXTRA  body copy dropped / invented             (🟡 advisory)
 *   - FONT DIFF a matched line whose rendered FACE differs           (🟠 width probe, #77)
 *
 * Font detection uses a WIDTH PROBE, never document.fonts.check (which returns
 * true for any family name the page references, installed or not — #77): the same
 * normalised string at a fixed size under each element's computed family+weight;
 * a materially different width across pages ⇒ a different actual face.
 *
 * Usage:
 *   node tools/da/content-diff.mjs <prototypeURL> <edsURL> [options]
 *     --main <selector>   content root to compare        (default "main")
 *     --width <px>        viewport width                 (default 1280)
 *     --json              also print the two raw inventories
 *
 * Exit codes: 0 ran (flags are advisory, they do NOT fail the run), 1 error.
 */

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-restricted-syntax, brace-style, object-curly-newline, max-len, no-plusplus, newline-per-chained-call, no-continue, no-multi-spaces */
/* standalone dev tool: playwright is a devDependency; sequential page ops use awaited loops by design */
import { chromium } from 'playwright';

function parseArgs(argv) {
  const [, , proto, eds, ...rest] = argv;
  const opts = { main: 'main', width: 1280, json: false };
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--main') { opts.main = rest[i += 1]; }
    else if (a === '--width') { opts.width = Number(rest[i += 1]); }
    else if (a === '--json') { opts.json = true; }
  }
  return { proto, eds, opts };
}

// Runs IN the page. Returns the ordered role-classified content inventory.
/* eslint-disable no-undef */
function inventory(mainSel) {
  const root = document.querySelector(mainSel) || document.querySelector('main') || document.body;
  const ARROWS = /[→➔➜›⇒➤>]+/g;
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  // match key: lowercase, arrows + trailing punctuation stripped, whitespace collapsed.
  const norm = (s) => clean(s).replace(ARROWS, ' ').replace(/\s+/g, ' ').trim()
    .toLowerCase().replace(/[.,;:!?·•]+$/g, '').trim();

  // Off-screen probe for rendered-face width (#77 method): a FIXED-size string
  // under an element's computed family+weight. Comparing this width across pages
  // for the SAME normalised string reveals a different actual face (e.g. the
  // prototype's system-ui fallback vs the EDS self-hosted Bebas Neue).
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:nowrap;font-size:48px';
  document.body.appendChild(probe);
  const widthOf = (text, family, weight) => {
    probe.style.fontFamily = family; probe.style.fontWeight = weight;
    probe.textContent = text || 'Agw1996';
    return Math.round(probe.getBoundingClientRect().width);
  };
  const namedFamily = (ff) => {
    const m = ff.match(/"([^"]+)"|'([^']+)'/);
    return (m && (m[1] || m[2])) || ff.split(',')[0].trim();
  };
  // Per element: the rendered-face width (its full computed stack), and — using
  // the SAME width probe, never document.fonts.check (#77) — whether the first
  // NAMED family actually loaded (probe it alone vs a guaranteed-absent name; equal
  // width ⇒ it fell back). The label then reads e.g. "Bebas Neue" vs "Bellfort→sys".
  const face = (text, cs) => {
    const s = (text || 'Agw1996').slice(0, 40);
    const named = namedFamily(cs.fontFamily);
    const w = widthOf(s, cs.fontFamily, cs.fontWeight);
    const loaded = widthOf(s, `"${named}",monospace`, cs.fontWeight)
      !== widthOf(s, '__no_such_face__,monospace', cs.fontWeight);
    return { w, family: loaded ? named : `${named}→sys`, loaded };
  };

  const out = [];
  let imgCount = 0;
  let order = 0;
  root.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toLowerCase();

    // Images are visual-diff's domain (load/stretch/imagery-gap) and their alt
    // text rarely matches verbatim across proto↔EDS — count them, don't diff them.
    if (tag === 'img') { imgCount += 1; return; }

    // A text CTA: an <a> whose label is text (not an image link). Use the FULL
    // label (textContent) so <strong><a>…</a></strong> and <a><strong>…</strong></a>
    // both resolve, then skip the link's inner nodes below via closest('a').
    if (tag === 'a') {
      if (el.querySelector('img, picture')) return; // image/logo link, not a text CTA
      const t = clean(el.textContent);
      if (!t) return;
      out.push({ role: 'cta', order: order++, text: t, key: norm(t), href: el.getAttribute('href') || '', ...face(norm(t), getComputedStyle(el)) });
      return;
    }

    // Own text = DIRECT child text nodes only, so a wrapper <div><p>…</p></div>
    // isn't double-counted (the <p> carries the text, the <div> is empty).
    const own = clean([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
    if (!own) return;
    if (el.closest('a')) return; // text inside a link — already captured by the <a>

    const cs = getComputedStyle(el);
    const item = { order: order++, text: own, key: norm(own), ...face(norm(own), cs) };
    if (/^h[1-6]$/.test(tag)) item.role = 'heading';
    else if (cs.textTransform === 'uppercase' && parseFloat(cs.fontSize) <= 18 && own.length <= 48) item.role = 'eyebrow';
    else item.role = 'body';
    out.push(item);
  });
  probe.remove();
  return { items: out, imgCount };
}
/* eslint-enable no-undef */

async function grab(browser, url, opts) {
  const ctx = await browser.newContext({ viewport: { width: opts.width, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // scroll through to trigger reveal-on-scroll / lazy nodes, then return to top
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => { setTimeout(r, 40); }); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  const inv = await page.evaluate(inventory, opts.main);
  await ctx.close();
  return inv;
}

// A matched line counts as a real face change only above this width delta —
// below it is sub-pixel / weight noise between two system fallbacks (#77).
const FONT_DELTA = 0.10;

// Diff: consume each proto item against the first unused EDS item with the same
// key (duplicates count correctly), classifying the outcome by role.
function diff(protoItems, edsItems) {
  const flags = [];
  const matched = []; // {proto, eds} pairs for the font pass
  const used = new Array(edsItems.length).fill(false);
  const findEds = (key, role) => {
    let fallback = -1;
    for (let i = 0; i < edsItems.length; i++) {
      if (used[i] || edsItems[i].key !== key || !key) continue;
      if (edsItems[i].role === role) return i; // exact role match preferred
      if (fallback < 0) fallback = i; // same text, other role
    }
    return fallback;
  };

  protoItems.forEach((p) => {
    if (!p.key) return;
    const i = findEds(p.key, p.role);
    if (i < 0) {
      const where = `proto ${p.role} "${p.text.slice(0, 48)}"`;
      if (p.role === 'cta') flags.push({ sev: '🔴', kind: 'MISSING CTA', msg: `${where}${p.href ? ` → ${p.href}` : ''} has no EDS link. A dropped call-to-action — author the CTA row + render it in the owning block.` });
      else if (p.role === 'heading') flags.push({ sev: '🔴', kind: 'MISSING HEADING', msg: `${where} has no EDS heading of the same text. A dropped/renamed section title.` });
      else if (p.role === 'eyebrow') flags.push({ sev: '🔴', kind: 'MISSING EYEBROW', msg: `${where} has no EDS match. Often a segmentation drop (#76) — the eyebrow precedes its heading and got dropped, or the block never authored it.` });
      else flags.push({ sev: '🟡', kind: 'MISSING BODY', msg: `${where.slice(0, 70)}… not found in EDS. Often fine (a prototype placeholder rewritten to real copy) — confirm it's not dropped prose.` });
      return;
    }
    used[i] = true;
    const e = edsItems[i];
    if (e.role !== p.role) {
      flags.push({ sev: '🔴', kind: 'ROLE SWAP', msg: `"${p.text.slice(0, 40)}" is a ${p.role} in the proto but a ${e.role} in EDS — mis-classified slot (the #76 class: body painted as eyebrow, eyebrow folded into a teaser, etc.).` });
    }
    matched.push({ p, e });
  });

  // EXTRA: EDS content with no proto source — invented copy to verify (advisory).
  edsItems.forEach((e, i) => {
    if (used[i] || !e.key) return;
    if (e.role === 'body') flags.push({ sev: '🟡', kind: 'EXTRA', msg: `EDS body "${e.text.slice(0, 48)}" has no proto source — invented/placeholder-filled copy; confirm it's intended.` });
    else flags.push({ sev: '🟠', kind: 'EXTRA', msg: `EDS ${e.role} "${e.text.slice(0, 48)}" has no proto source — unexpected ${e.role}.` });
  });

  // FONT FORK: matched lines whose rendered FACE differs (width probe, #77). A
  // proprietary→self-hosted-fallback substitution fires on EVERY display line, so
  // GROUP them into one advisory rather than N near-identical paragraphs — the
  // agent/user decides whether the fork is intended.
  const forks = matched
    .filter(({ p, e }) => p.w && e.w && Math.abs(1 - e.w / p.w) > FONT_DELTA)
    .map(({ p, e }) => ({ role: p.role, text: p.text.slice(0, 28), from: p.family, to: e.family, pct: Math.round((e.w / p.w - 1) * 100) }));
  if (forks.length) {
    const shown = forks.slice(0, 8).map((f) => `${f.role} "${f.text}": proto ${f.from} vs EDS ${f.to} (${f.pct}%)`).join('; ');
    const more = forks.length > 8 ? ` (+${forks.length - 8} more)` : '';
    flags.push({ sev: '🟠', kind: 'FONT FORK (#77)', msg: `${forks.length} matched line(s) render a DIFFERENT face: ${shown}${more}. A "→sys" on the proto side means it named a font it never loaded and fell back — EDS self-hosting the intended fallback is then CORRECT; confirm the fork is intended, else ship the missing @font-face.` });
  }

  return { flags, matchedCount: matched.length };
}

function summarise(inv) {
  const by = (r) => inv.items.filter((x) => x.role === r).length;
  return `${inv.items.length} text nodes — ${by('heading')} headings, ${by('eyebrow')} eyebrows, ${by('cta')} CTAs, ${by('body')} body; ${inv.imgCount} img`;
}

async function main() {
  const { proto, eds, opts } = parseArgs(process.argv);
  if (!proto || !eds) {
    process.stderr.write('usage: node tools/da/content-diff.mjs <prototypeURL> <edsURL> [--main sel] [--width px] [--json]\n');
    process.exit(1);
  }
  const browser = await chromium.launch();
  let protoInv; let edsInv;
  try {
    protoInv = await grab(browser, proto, opts);
    edsInv = await grab(browser, eds, opts);
  } finally {
    await browser.close();
  }

  const { flags } = diff(protoInv.items, edsInv.items);
  process.stdout.write(`\nContent diff @ ${opts.width}px (root "${opts.main}")\n`);
  process.stdout.write(`  proto: ${summarise(protoInv)}\n`);
  process.stdout.write(`  eds:   ${summarise(edsInv)}\n`);

  if ((protoInv.items.length < 3 || edsInv.items.length < 3)) {
    process.stdout.write('\n⚠ one side has almost no content — a blank/failed render; fix that before trusting the diff.\n');
  }

  const order = { '🔴': 0, '🟠': 1, '🟡': 2 };
  flags.sort((a, b) => order[a.sev] - order[b.sev]);
  const strong = flags.filter((f) => f.sev === '🔴').length;
  process.stdout.write(`\nFindings: ${flags.length ? `${flags.length} (${strong} structural 🔴)` : 'none — content + roles match'}\n`);
  flags.forEach((f) => process.stdout.write(`  ${f.sev} ${f.kind}: ${f.msg}\n`));

  if (opts.json) {
    process.stdout.write('\nInventories JSON:\n');
    process.stdout.write(`${JSON.stringify({ proto: protoInv, eds: edsInv }, null, 1)}\n`);
  }
}

main().catch((e) => { process.stderr.write(`content-diff error: ${e.message}\n`); process.exit(1); });
