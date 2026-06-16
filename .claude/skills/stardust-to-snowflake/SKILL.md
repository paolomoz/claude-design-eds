---
name: stardust-to-snowflake
description: Convert stardust HTML prototypes (under stardust/prototypes/**) into Edge Delivery Services (EDS / AEM) blocks and content pages. Each prototype <section> becomes one EDS block; the prototype's per-section CSS becomes that block's CSS scoped under the block class. Use when the user wants to lift a stardust pipeline output (or any styled per-page HTML prototypes) into a working EDS site under blocks/ and content/.
references:
  - da-deploy-protocol.md
---

# Stardust → EDS

## When to use

The user has:
1. Static HTML prototypes (one per page) under `stardust/prototypes/**/*.html` with inline `<style>` blocks. Typically produced by the `stardust:prototype` skill, but any per-page styled HTML works.
2. An EDS project at the repo root — `blocks/`, `styles/`, `scripts/`, `head.html`, plus existing blocks (`fragment`, `section-metadata`).
3. A goal to convert: prototypes → authorable EDS blocks + EDS content pages under `content/**`.

If the user has prototypes but no EDS scaffolding, stop and ask whether to bootstrap. If they have EDS but no prototypes, this skill doesn't apply.

## Prerequisites

This skill depends on the `aem` skill from `ai-ecoverse/skills` for the EDS-specific patterns the conversion steps lean on. **Before any work**, ensure it is installed:

```bash
# Install (idempotent — safe to re-run)
upskill ai-ecoverse/skills --skill aem
```

The skill is installed to `/workspace/skills/aem/SKILL.md`. The sprinkle-driven flow auto-detects this on load and fires the `install-deps` lick when missing (see Sprinkle integration). When invoked from chat, run the command yourself before starting any of the steps below.

## Sprinkle integration

When invoked through the snowflake sprinkle (`.claude/skills/stardust-to-snowflake/snowflake.shtml`), the user drives the conversion through four stepper panels: **Scoop** (target repo + branch), **Sprinkle** (file selection), **Swirl** (conversion), **Serve** (results). The Scoop and Swirl panels emit licks; the Sprinkle panel scans the filesystem itself through the bridge file APIs and never reaches the agent.

Push updates with: `sprinkle send snowflake '<json>'`.

### Lick: `install-deps` (auto-fired on load when prerequisites missing)

Payload: empty.

The sprinkle fires this on open if `/workspace/skills/aem/SKILL.md` is absent. The Connect button stays disabled until the dependency is confirmed installed.

**Run `upskill` in the cone, never in a scoop.** Scoops are sandboxed and cannot write under `/workspace`, so `upskill ai-ecoverse/skills --skill aem` will fail in a scoop with no useful diagnostic. The cone has the filesystem access required to install the skill into `/workspace/skills/`.

Steps (executed in the cone):

1. Run `upskill ai-ecoverse/skills --skill aem`.
2. Verify `/workspace/skills/aem/SKILL.md` now exists.
3. On success: `sprinkle send snowflake '{"type":"deps-installed"}'` — the sprinkle re-checks and unlocks the Connect button.
4. On failure: `sprinkle send snowflake '{"type":"deps-error","message":"<reason>"}'` — the sprinkle shows a Retry link.

### Lick: `connect-repo` (Scoop panel)

Payload: `{ repo: "<owner>/<name>", branch: "<branch>", daSpace: "<daOrg>/<daRepo>", daPath: "/<path>" }`.

Split `repo` on `/` into `<owner>` and `<name>` (e.g. `ai-ecoverse/snowflake` → owner `ai-ecoverse`, name `snowflake`). These names are reused throughout the rest of the flow — the local clone always lives at `/workspace/<name>`.

The `branch` field is pre-filled with a fresh short hash on each sprinkle load. Treat the value as authoritative — the user may have replaced it with an existing branch name they want to target.

`daSpace` contains the DA space in `<daOrg>/<daRepo>` format. `daPath` is the sub-path within that DA repo where content will be written (defaults to `/<branch>`).

Steps:

1. If `/workspace/<name>/.git` doesn't exist, clone there: `git clone https://github.com/<owner>/<name> /workspace/<name>`. Always use the repo basename as the directory — the upload step depends on this.
2. `git fetch origin` to sync remote refs.
3. Resolve `<branch>` in this order:
   - Local branch `<branch>` exists → `git checkout <branch>`.
   - Remote branch `origin/<branch>` exists → `git checkout -b <branch> origin/<branch>` (tracks remote).
   - Otherwise → create it from the origin default branch: `git checkout -b <branch> origin/main` (fall back to `origin/master` when main is absent).
4. **Mount the DA space.** Split `daSpace` on `/` into `<daOrg>` and `<daRepo>`. Run:
   ```bash
   mount --source da://<daOrg>/<daRepo> /mnt/da
   ```
   Verify with `mount list` — confirm `/mnt/da` appears in the output. If the mount probe fails with `EACCES`, push an error telling the user to authenticate via Settings → Providers → Adobe (or `oauth-token adobe`) and retry.
5. Push: `sprinkle send snowflake '{"type":"repo-connected","daMount":"/mnt/da"}'` so the UI advances to the Sprinkle panel.

On any failure, push `sprinkle send snowflake '{"type":"error","message":"<reason>"}'` and let the user retry from the Scoop panel.

### Sprinkle panel — no lick

The Sprinkle panel walks the chosen folder on its own using `slicc.readDir` and `slicc.stat`, filters `.html` files, and renders the tree directly. There is no agent round-trip for file discovery; trust the `files` payload that arrives with `start-conversion`.

### Lick: `start-conversion` (Swirl panel)

Payload: `{ files: ["<absolute path>", ...], daPath: "/<path>" }` — every entry is an `.html` path the sprinkle has already verified via the bridge. `daPath` is the DA sub-path where content pages are deployed. No re-validation needed.

**Do not use `scoop_wait` for this lick.** Perform the conversion work directly in the cone or dispatch a fire-and-forget scoop; do not gate progress on a wait timer. Completion is signalled by the `conversion-complete` sprinkle push, not by scoop resolution.

The conversion runs in two phases: a one-time **site setup** that produces site-wide artifacts, then a **per-file loop** that scaffolds each page. **Do not collapse the two — running site-setup tasks per-file silently overwrites prior work; skipping them entirely leaves the site without global tokens, fonts, buttons, or header/footer and every page renders unstyled.**

#### Phase 1 — site setup (run ONCE for the whole batch, before any per-file work)

Run Steps 1–6 from the [Steps](#steps) section below in order. None of them are per-file:

1. **Audit** (Step 1) — cross-file section inventory of every prototype.
2. **Decide names + reuse** (Step 2) — lock block naming and reuse decisions across the whole batch.
3. **Foundation** (Step 3) — write `styles/styles.css` with `:root` tokens, reset, and the EDS section scaffold.
4. **Self-host fonts** (Step 4) — fetch woff2 files into `styles/fonts/`, write `@font-face` declarations in `styles/styles.css`, and set up the `body.session` metric-matched fallback pattern.
5. **Button system** (Step 5) — append the global button CSS to `styles/styles.css`.
6. **Chrome** (Step 6) — extract the header and footer from the prototype as static HTML fragments. Write `fragments/header.html` and `fragments/footer.html` at the repo root. These are raw HTML with an inline `<style>` block — no EDS authoring shape, no block JS. They are committed to GitHub (code) and served from the code origin.

Phase 1 produces no `conversion-progress` events; the Swirl panel just shows the bar at 0 / N until the first per-file event in Phase 2.

#### Phase 2 — per-file conversion

For each file in `files`, in order, push two `conversion-progress` events around **only the per-page work (Steps 7–9: block JS scaffold + content page scaffold)**. The global setup is already done.

```
sprinkle send snowflake '{"type":"conversion-progress","file":"<path>","status":"running","current":<i>,"total":<N>}'
# ...run Steps 7–9 below for this file...
sprinkle send snowflake '{"type":"conversion-progress","file":"<path>","status":"done","current":<i>,"total":<N>}'
```

`current` is 1-based; `total` is `files.length`. Use `"status":"error"` on per-file failure and continue with the rest — a single bad file shouldn't abort the batch.

When all files are processed, commit and push to the branch resolved during `connect-repo` (and optionally open a PR), then advance the UI to the Serve panel by emitting:

```
sprinkle send snowflake '{"type":"conversion-complete","files":["<basename1>","<basename2>",...],"branch":"<branch>","branchUrl":"https://github.com/<owner>/<name>/tree/<branch>","blocks":<N>,"prUrl":"<optional>"}'
```

`files` are the converted page basenames **without** the `.html` extension (e.g. `home` for `home.html`). `branchUrl` becomes the "View on GitHub" link in the Serve panel's branch card. `blocks` is the total EDS blocks generated.

Note: Static fragments (`fragments/header.html`, `fragments/footer.html`) are committed to the GitHub branch along with block code — they are NOT deployed to DA. They don't appear in the `files` array and are not part of the deploy sequence.

The conversion handler ends here. The sprinkle renders the Serve panel with the Documents section (pages to deploy to DA), all stages pending, and **immediately fires a `start-deploy` lick** to re-engage the cone for the actual deployment — see the next section.

### Lick: `start-deploy` (auto-fired by the sprinkle after `conversion-complete`)

Payload: `{ files: ["<basename>", ...], branch: "<branch>", daSpace: "<daOrg>/<daRepo>", daPath: "/<path>" }` — the page basenames and branch the sprinkle just received in `conversion-complete`, plus the DA target fields from state. `<owner>` and `<name>` are still the values resolved during `connect-repo`.

This lick exists so the deploy sequence is event-driven and cannot be silently skipped. **Begin the write → refresh → live sequence as soon as you receive it; do not wait for any further user input.**

**Only content pages are deployed to DA.** Static fragments (header/footer) are code committed to the GitHub branch — they don't go through the DA deploy flow. Every `deploy-progress` event MUST carry `kind: "page"` so the sprinkle routes the update correctly.

#### Prerequisites

The DA mount at `/mnt/da` MUST already be active (established during `connect-repo`). Verify with `mount list` before starting. If the mount is gone (e.g. session expired), re-mount:

```bash
mount --source da://<daOrg>/<daRepo> /mnt/da
```

Split `daSpace` on `/` to get `<daOrg>` and `<daRepo>`.

#### URL templates

| Kind | Local path                           | Mount write path              | DA Edit URL (`daUrl`)                                      | Live URL (`liveUrl`)                                            |
| ---- | ------------------------------------ | ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| page | `/workspace/<name>/content/<n>.html` | `/mnt/da/<daPath>/<n>.html` | `https://da.live/edit#/<daOrg>/<daRepo>/<daPath>/<n>` | `https://<branch>--<daRepo>--<daOrg>.aem.live/<daPath>/<n>` |

The local file has the `.html` extension; mount write paths include `.html`; the DA Edit and Live URLs do NOT include the extension. Use the branch host prefix (`<branch>--<daRepo>--<daOrg>`) for `liveUrl`, never `main--`.

#### Sequence per item

For each page (sequential), run three stages in order. Skip subsequent stages on a stage failure for that item; other items keep going.

**1. Write** — sanitise non-ASCII characters first, then write via the DA mount. DA strips `<head>` on ingestion and parses without a charset declaration, so any multibyte UTF-8 sequence (`·`, `–`, `→`, accented letters, emoji) gets corrupted to U+FFFD. The repo ships `tools/da/sanitise.js`, a zero-dependency Node script that rewrites all non-ASCII code points to named or numeric HTML entities in-place — entities survive the round-trip unchanged.

```bash
node tools/da/sanitise.js <local path>          # in-place, idempotent
```

Then read the sanitised content and write it to the mount:

```bash
cat <local path>
# Use write_file to write the content:
write_file /mnt/da/<daPath>/<relative>.html <content>
```

This applies to **every** deployed file — both pages and fragments. Skipping the sanitise step is the most common cause of corrupted typography in the deployed pages. The script is idempotent (running it twice is a no-op), so you can safely call it before each write without checking whether the file is already clean.

Surround the write with:

```
sprinkle send snowflake '{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"write","status":"running"}'
# ...sanitise + write_file...
sprinkle send snowflake '{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"write","status":"done","daUrl":"<DA Edit URL>"}'
```

The `daUrl` activates the "DA Edit" button on that item's row.

**2. Refresh** — confirm the write landed on the DA backend. Run:

```bash
mount refresh /mnt/da
```

Parse the output — it prints a structured summary like `Refreshed /mnt/da: +2 -1 ~3 (47 unchanged, 0 errors)`. If `0 errors` appears → success. If errors > 0, mark the item as `error`.

```
sprinkle send snowflake '{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"refresh","status":"running"}'
# ...mount refresh...
sprinkle send snowflake '{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"refresh","status":"done"}'
```

**This is the critical confirmation step.** Without it, a write could be cached locally in the mount layer but not yet synced to the DA backend. Do NOT skip this or collapse it into the write stage.

**3. Live** — DA content is live immediately after a confirmed refresh (no separate publish API call). Resolve the live URL and report:

```
sprinkle send snowflake '{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"live","status":"done","liveUrl":"<Live URL>"}'
```

On any failure, send `"status":"error"` with an optional `"message"` and move on — one bad item must not block the rest.

#### Mount persistence

Do NOT unmount `/mnt/da` after deploy. The mount stays active for:
- Ongoing bidirectional sync (user edits in DA UI → `mount refresh` → local view updates)
- Subsequent conversions without re-mounting
- Manual edits via `write_file /mnt/da/...` from chat

#### Error handling

| Error | Detection | Response |
|---|---|---|
| `EACCES: da access denied` | Write or refresh | Push error for the item; suggest re-authenticating via Adobe provider |
| `EBUSY: remote modified since last read` | Write conflict | Re-read the mount path (`read_file`), retry write once |
| `EFBIG: body exceeds maxBodyBytes` | Write of very large page (>5 MB) | Report per-item error, continue with others |
| `mount refresh` reports errors > 0 | Refresh output parsing | Mark affected item as `error`, continue with others |

#### Completion

When every item (fragments + pages) has reached its final stage, emit:

```
sprinkle send snowflake '{"type":"deploy-complete"}'
```

This is currently a no-op visually but reserved for future "all done" celebration / stats refresh.

## The one rule that drives everything else

**One prototype `<section>` = one EDS block.** Do not abstract. Do not invent variants. Do not extract "patterns" across prototypes unless two sections are visually identical.

The prototype is the visual spec. The block exists to author its content. This rule sounds obvious. It is not what you will be tempted to do. See ANTI-PATTERNS below — every entry there is a real failure mode that cost a full reset on a previous run.

## Output you will produce

For a typical 5–10 page site:

- **One block per distinct prototype section.** A 5-page site with 6 sections each → ~12–18 blocks (some are reused across pages, e.g. `closing`).
- **One EDS content page per prototype page.** Same number of pages.
- **Nav + footer fragments** at `content/fragments/{nav,footer}.html` (the navigation lives in `nav.html`, not `header.html`).
- **Updated `styles/styles.css`** with brand tokens lifted from the prototype's `:root`, a reset, the EDS section scaffold, and a global button system (see "Lean on EDS button conventions" below). Nothing more.
- **No shared utility modules.** No wave systems. No section-metadata style classes. No motion library. The prototype already encodes these per-section; keep them inside the owning block.

## Steps

### 1. Audit (light)

Read every prototype's `<main>` markup (skip the `<style>` for now) and produce a per-page section list:

```
home: hero, work, approach, team, clients, closing
approach: approach-hero, manifesto, tenets-detailed, cadence, closing
team: team-hero, team-roster, work-style, recent, careers, closing
…
```

A useful pattern: dispatch the `Explore` subagent at thoroughness=quick with this exact ask. You don't need a 22-pattern punch list — you need filenames + section names. **Resist the urge to "find shared patterns."** Pattern reuse will emerge organically when two sections turn out to be byte-identical.

### 2. Decide names + reuse — LOCK BEFORE WRITING ANY CODE

Naming rules:
- Block name = the prototype's `<section class="X">` value, kebab-cased (`hero`, `work`, `closing`, `approach`).
- When the same section appears on multiple pages with identical visual treatment, build ONE block and use it everywhere. The classic example: `closing` CTA at the end of every page.
- When a section appears on multiple pages but looks different (e.g. home `hero` vs case-study `case-hero` vs service `service-hero`), they are different blocks. Prefix with the page archetype.
- When two sections within one prototype share the same visual treatment but different copy (e.g. case-study `discovery` and `decisions` are both 2-col prose with eyebrow + headline), it is fine to merge into one block (`case-prose-2col`) with a single text variant cell ("tinted" / "default"). Use your judgment.

**Surface 3–5 naming questions to the user before writing any block code:**
- "What's the home hero called? `hero`?"
- "Are the closing CTAs across all pages identical? Same `closing` block?"
- "Should case-study discovery/decisions/solutions be one block or three?"
- "Is the per-service hero distinct from the home hero? Build `service-hero` separately?"

Lock the answers in writing (in `stardust/eds-conversion-log.md` or similar). This is the single highest-leverage step in the whole process.

### 3. Foundation

Update `styles/styles.css` to the following — and ONLY the following:

- Lift `:root` tokens verbatim from the prototype's `<style>` (colors, fonts, type scale, weights, tracking, layout, motion easing).
- Document reset (box-sizing, margin reset, scroll-behavior, body font + bg, ::selection, img defaults, button reset).
- A minimal EDS section scaffold:
  ```css
  main .section { display: block; }
  main .section > .default-content,
  main .section > .block-content { display: block; }
  main > div, .has-template, div[data-status] { display: none; }
  ```
- A global button system (see next section). This is the one place per-block CSS does NOT own its paint — buttons are site-wide and convention-driven.

That's it. No section-style classes. No motion primitives. No utility classes beyond the button system.

`scripts/scripts.js` stays minimal — only the page boot. No reveal-on-scroll. No marquee init. No header scroll-state. Per-block animation is owned by per-block CSS.

### 4. Self-host fonts and minimize CLS — never put font loads in `head.html`

Four principles, applied in this order on every project:

**1. Leave `head.html` untouched. No font lines, period.**
No Google Fonts `<link>`. No CDN `<link rel="stylesheet">` for type. No `<style>` blocks declaring `@font-face`. **No `<link rel="preload" as="font">`** either — even self-hosted preloads belong out of `head.html`. The browser will fetch the woff2 it needs as soon as `styles/styles.css` parses; the `body { arial }` / `body.session { var(--font-body) }` split (principle 3) eliminates the CLS that preloading is normally meant to prevent. **All `@font-face` declarations live in `styles/styles.css`.**

**2. Self-host the brand font when licensing permits.**
Inspect the prototype to identify each font family and its license:
- SIL OFL 1.1 (Inter, JetBrains Mono, Fraunces, Roboto, Open Sans, IBM Plex, Source Sans, etc.) → self-host. License permits redistribution, including embedding on the served domain.
- Apache 2.0 (some Google Fonts) → self-host.
- Proprietary commercial (Adobe Fonts / Typekit, Monotype, foundry-direct) → keep CDN load and document the licensing constraint in the conversion log; you will NOT achieve zero CLS in this case.

For OFL fonts, fetch latin-subset variable woff2 files. The fastest reliable source is jsDelivr's `@fontsource-variable/<name>` packages:

```bash
mkdir -p styles/fonts
curl -sSL -o styles/fonts/<name>-variable.woff2 \
  "https://cdn.jsdelivr.net/npm/@fontsource-variable/<name>@latest/files/<name>-latin-wght-normal.woff2"
# italic, if used:
curl -sSL -o styles/fonts/<name>-italic-variable.woff2 \
  "https://cdn.jsdelivr.net/npm/@fontsource-variable/<name>@latest/files/<name>-latin-wght-italic.woff2"
```

Latin-only variable woff2 is typically 30–60 KB per file, weights 100–900 included.

**3. Body.session pattern with a metric-matched fallback `@font-face`.**
The brand font must NOT render at first paint. Default to a metric-matched system font; switch to the brand font once `decorateSession()` (in `scripts/ak.js`) adds `body.session`. The recipe:

```css
@font-face {
  font-family: "<Brand>";
  src: url("/styles/fonts/<brand>-variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}

/* Override the system font's metrics so it renders with the brand font's
   line box. Naming the @font-face after the system font (e.g. "Arial",
   "Times New Roman") makes any reference to that family in a font stack
   pick up the metric-adjusted version site-wide — no per-block changes. */
@font-face {
  font-family: "Arial";          /* "Times New Roman" for a serif brand */
  src: local("Arial");           /* local("Times New Roman") for serif */
  size-adjust: <X>%;
  ascent-override: <Y>%;
  descent-override: <Z>%;
  line-gap-override: 0%;
}

:root {
  --font-body: "<Brand>", arial, sans-serif;       /* serif: times, "Times New Roman", serif */
}

body { font-family: arial, sans-serif; }
body.session { font-family: var(--font-body); }
```

The metric-override values come from the `@fontsource-variable/<name>` package's published calibration — fetch their CSS:

```bash
curl -s "https://cdn.jsdelivr.net/npm/@fontsource-variable/<name>@latest/index.css" \
  | grep -A 6 "Fallback"
```

Each fontsource package publishes a `<Name> Fallback` `@font-face` with `size-adjust`, `ascent-override`, and `descent-override` values. Lift those three numbers verbatim and apply them to a local-system `@font-face` renamed to the system font (`"Arial"`, `"Times New Roman"`, `"Courier New"`).

The CLS chain that results:
- **Initial paint**: `body { font-family: arial, sans-serif; }` — renders the metric-adjusted local Arial because the override `@font-face` named `"Arial"` wins over the OS Arial. Line box already matches the brand font's metrics.
- **Session activates**: `body.session` switches to `var(--font-body)`. Brand woff2 is still loading; Arial renders in its place with matching metrics. **Zero shift.**
- **Brand font loads**: swaps in. **Zero shift** because metrics already match.

**4. Match the fallback family to the brand font's classification.**
Use the SAME class of typeface for the fallback so visual rhythm is preserved during the load:
- Sans-serif brand → fallback `arial, sans-serif`. Override `@font-face "Arial"` with `local("Arial")`.
- Serif brand → fallback `times, "Times New Roman", serif`. Override `@font-face "Times New Roman"` with `local("Times New Roman")`.
- Monospace brand → fallback `"Courier New", courier, monospace`. Override `@font-face "Courier New"` with `local("Courier New")`. (Note: skipping monospace metric-matching is acceptable when the mono font is only used in small eyebrows/labels — CLS impact is negligible. Document the choice in the conversion log.)

Never substitute classifications (don't match a serif brand to Arial; don't match a sans brand to Times). Even with metric overrides, character widths and rhythm differ enough that the visible shift is jarring.

### 5. Lean on EDS button conventions — DO NOT manufacture button anchors in block JS

The EDS link decorator in `scripts/ak.js` (`decorateButton()`) automatically applies button classes when authors wrap a link in inline emphasis. This runs during page boot, AFTER block JS. Block JS just needs to clone the cell anchor as-is.

**Author markup → auto-applied class:**

| Author markup | Class applied | Visual |
|---|---|---|
| `<strong><a>` | `.btn.btn-primary` | wavelength fill, dark text |
| `<em><a>` | `.btn.btn-secondary` | transparent + outline (color-aware) |
| `<em><strong><a>` | `.btn.btn-accent` | canvas fill on dark surfaces |
| `<del><a>` | `.btn.btn-negative` | rare; destructive |
| `+ <u>` inside any | adds `.btn-outline` | transparent variant |
| 2+ buttons in same parent | parent gets `.btn-group` | flex with gap |

**Add to `styles/styles.css`** (the project's brand button system):

```css
a.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 26px;
  font-size: 12px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid transparent;
  transition: background 0.25s var(--ease-out), color 0.25s var(--ease-out), border-color 0.25s var(--ease-out);
}

a.btn-primary { background: var(--color-wavelength); color: var(--color-ink-rich); border-color: var(--color-wavelength); }
a.btn-primary:hover { background: var(--color-canvas); border-color: var(--color-canvas); }

a.btn-secondary { background: transparent; color: currentcolor; border-color: rgb(255 255 255 / 40%); }
a.btn-secondary:hover { border-color: currentcolor; background: rgb(255 255 255 / 5%); }

/* On light surfaces, secondary uses dark-tinted outline. List the dark sections explicitly. */
main .section:not(.dark, .closing, .hero, .team) a.btn-secondary { border-color: var(--color-rule-strong); color: var(--color-ink-rich); }
main .section:not(.dark, .closing, .hero, .team) a.btn-secondary:hover { border-color: var(--color-ink-rich); }

/* Trailing arrow on primary/accent. */
a.btn-primary::after, a.btn-accent::after { content: "→"; font-weight: 600; transition: transform 0.3s var(--ease-out); }
a.btn-primary:hover::after, a.btn-accent:hover::after { transform: translateX(4px); }

.btn-group { display: inline-flex; flex-wrap: wrap; gap: 16px; align-items: center; }
```

**Block JS pattern — just clone the cell:**

```js
// Get the cell that holds the CTAs
const ctaCell = rows[N]?.firstElementChild;
if (ctaCell && ctaCell.querySelector('a')) {
  const actions = document.createElement('div');
  actions.className = 'actions';
  [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
  container.append(actions);
}
```

DO NOT manufacture anchors with `cta.className = 'btn-loud'` or inject custom SVG arrows. The global `::after` arrow + the convention's class system handle 95% of cases.

**Block CSS pattern — only override what's actually different:**

The `closing` block's CTA is slightly larger than the global default. That's a legitimate override:

```css
.closing .actions a.btn-primary { padding: 22px 32px; font-size: 13px; }
```

Three lines. Targets the global class, not a custom one. This is the entire "blocks slightly augment defaults" pattern.

**When NOT to use the convention:**

Some links are NOT buttons. Examples:
- A wavelength-underlined text link in a section footer ("How we work →"). It's a styled text link, not a chip.
- Whole-card anchors on tile grids (`<a class="tile">…</a>`). The whole tile is the click target.
- Channel values in a closing CTA (`<a href="tel:…">801-363-0101</a>`). It's a value, not a CTA.
- `mailto:` / `tel:` links inside prose.

For these: the author leaves the `<a>` as a plain anchor in content (no `<strong>` / `<em>` wrap), and the owning block styles it with per-block CSS. The convention is for buttons; if it's not a button, don't apply it.

### 6. Static header + footer fragments

Header and footer are **static fragments** — extracted verbatim from the prototype with their full DOM and styles intact. No EDS authoring, no block JS parsing. They are stored in `fragments/header.html` and `fragments/footer.html` at the repo root and committed to GitHub as code.

**Fragment file format:**

```html
<style>
  /* Scoped styles lifted from the prototype's _tokens.css and page <style> */
  .utility { background: var(--color-ink); ... }
  nav.topnav { position: sticky; ... }
  .nav-inner { ... }
  /* Include responsive breakpoints */
  @media (max-width: 900px) { ... }
</style>
<!-- Full prototype DOM, copied verbatim -->
<div class="utility">...</div>
<nav class="topnav">...</nav>
```

No `<!DOCTYPE>`, no `<html>`, no `<body>` wrapper. Just the raw `<style>` + DOM. The EDS runtime injects it directly into the page's `<header>` or `<footer>` element via `innerHTML`.

**Extraction rules:**

1. Copy the header DOM (utility bar + topnav) from any prototype — it's shared across all pages.
2. Copy the footer DOM from any prototype — also shared.
3. For each fragment, collect the relevant CSS rules from the prototype's `_tokens.css` and any page `<style>` blocks. Include all responsive breakpoints.
4. Scope the CSS inside a `<style>` tag at the top of the fragment file.
5. Rewrite relative asset paths (e.g. `../assets/logo.png`) to fully-qualified URLs on the code origin: `https://main--<repo>--<owner>.aem.page/path/to/asset`.
6. Rewrite relative link hrefs (e.g. `donate.html`) to root-relative paths (e.g. `/donate`) matching how EDS serves pages.

**Loading mechanism:** `scripts/postlcp.js` fetches `fragments/header.html` and `fragments/footer.html` from the code origin (`codeBase`) and injects via `innerHTML`. On branch-hosted pages (`<branch>--repo--org.aem.live`), relative paths resolve to the correct branch automatically.

**`header: off` / `footer: off`:** To suppress header/footer on a specific page, add a metadata block with `header: off` or `footer: off`. The loader checks `getMetadata('header')` / `getMetadata('footer')` before fetching.

### 7. Blocks (parallel agents)

Dispatch one agent per page-archetype cluster (utility pages, services, case studies, etc.). Each agent owns a non-overlapping set of new blocks and content pages. Three to four parallel agents is the sweet spot.

The brief template:

> Per the project's locked direction: each prototype `<section>` becomes its own EDS block. Lift the prototype's `<style>` for that section verbatim, scope it under the block class (`.block-name .x` instead of `section.x .y`), and rebuild the prototype's DOM through a `decorate(block)` function that consumes EDS table-block input.
>
> **You own**: prototypes [list], content pages [list], sections [list].
>
> **Existing blocks — REUSE, do not recreate**: [list with one-line authoring shape per block].
>
> **Brand tokens** are global in `styles/styles.css`; do not redefine.
>
> **Buttons**: do NOT manufacture button anchors. Author CTAs as `<strong><a>` (primary) or `<em><a>` (secondary) in the content page; in block JS, clone the cell's child nodes into a `.actions` wrapper. Block CSS only overrides global button styles when something is genuinely different (e.g. larger size). Text links with flourish (wavelength underline) are NOT buttons — leave as plain `<a>` and style per-block.
>
> **EDS block convention**: each block at `blocks/<name>/<name>.{js,css}`. JS exports `default async function decorate(block)`. Block input is `<div class="block-name"><div>row<div>cell</div></div>…</div>`. CSS scoped under `.block-name`. Inline SVG markup per-block (no shared utility). Honor `prefers-reduced-motion`.
>
> **EDS content page format**: NO `<head>` element (project `head.html` is injected by EDS), empty `<header></header>`/`<footer></footer>`, each top-level `<div>` inside `<main>` is one section containing one block, no `<style>`/`<script>`/section-metadata, fully-qualified image URLs.
>
> **Done criteria**: [list of paths]. Return a list of new blocks + one-line summary per page.

Agents do not need to coordinate on shared blocks — the brief tells them which existing blocks to reuse.

### 8. Block JS scaffold

```js
/**
 * <block-name> — <one-line description from prototype data-intent attribute>
 *
 * Authoring rows (positional):
 *   1. <picture> background image
 *   2. eyebrow text
 *   3. <h2> headline (use <strong> for emphasis colored wavelength)
 *   4. body paragraph
 *   5. CTA links — wrap primary in <strong>, secondary in <em>; the EDS link
 *      decorator applies .btn.btn-primary / .btn.btn-secondary
 *   6..N: card rows — cells: num | label | description
 */

function text(cell) { return cell ? cell.textContent.trim() : ''; }
function pic(cell)  { return cell ? cell.querySelector('picture, img') : null; }

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // 1. Read each row positionally
  // 2. Build the prototype's DOM (with prototype-style class names)
  // 3. For CTA rows, clone the cell's child nodes into a .actions wrapper —
  //    do NOT manufacture button anchors with custom classes.
  // 4. block.replaceChildren(...newMarkup);
}
```

### 9. Content page scaffold

Content pages contain only the body sections — no metadata block for header/footer. The static fragments are loaded automatically by `postlcp.js` from `fragments/header.html` and `fragments/footer.html` on the same code origin. No per-page configuration is needed.

```html
<!DOCTYPE html>
<html lang="en">
<body>
  <header></header>
  <main>
    <div>
      <div class="block-name">
        <div><div>cell content</div><div>cell content</div></div>
        <div><div><strong><a href="/path">Primary CTA</a></strong> <em><a href="/path">Secondary CTA</a></em></div></div>
      </div>
    </div>
    <div>
      <!-- next section -->
    </div>
  </main>
  <footer></footer>
</body>
</html>
```

To suppress header/footer on a specific page, add a `metadata` block with `header: off` and/or `footer: off`:

```html
    <div>
      <div class="metadata">
        <div><div>header</div><div>off</div></div>
      </div>
    </div>
```

**Do NOT emit a `<head>` element.** EDS content pages are markdown-equivalent fragments: the document metadata (title, meta, stylesheets, scripts) lives in the project's `head.html`, which EDS injects at delivery time. A `<head>` block in a content page is dead weight at best and a duplication conflict at worst.

Image URLs MUST be fully qualified (`https://main--<repo>--<owner>.aem.page/stardust/prototypes/images/…`) so EDS preview and the rendered prototype agree on what to show.

## Anti-patterns (lessons paid for the hard way)

These look reasonable. They will cost a full reset.

**1. Abstracting prototype sections into "blocks with variants."**
Building one `hero` block with five class-variant treatments (`dark` / `light` / `image` / `full-bleed` / `with-wave`) seems DRY. In practice the variants don't share enough markup or CSS to compress; the JS forks too many ways; CSS gets brittle. **Build one block per distinct prototype section.** Reuse only when sections are byte-identical.

**2. Section-metadata style classes that parallel block variants.**
Defining `.section.dark`, `.section.prose-2col`, `.section.eyebrow`, etc. and applying them via section-metadata adds a second styling system that overlaps with block CSS. Authors don't know whether to set `dark` on the section or on the block. Pick one path: **per-block CSS that paints the entire section.** No section-style classes.

**3. Shared utility modules (waves, animation primitives).**
A wave SVG that all blocks import seems reusable. But each prototype section uses its wave differently (different dimensions, colors, animation). Inlining the SVG inside the owning block is more code on paper but eliminates a coupling and makes each block self-contained.

**4. Manually creating button anchors in block JS.**
Code like `cta.className = 'btn-loud'; cta.innerHTML = '<span>…</span>' + ARROW_SVG;` duplicates the EDS button decorator's job, fights its class-application order, and ties block JS to specific button classes. **Clone the cell anchor; let `decorateButton()` apply the class.** Block CSS overrides the global button style only when something is actually different (size, hover variant).

**5. Building complex block JS to parse and rebuild header/footer.**
The old pattern (fetch flat DA fragment → parse structurally → rebuild DOM) is fragile and lossy. Static fragments (`fragments/header.html`, `fragments/footer.html`) are injected verbatim — no parsing, no rebuild. If you find yourself writing block JS for header/footer, stop. Extract the prototype's header/footer as-is.

**6. `.default-content-wrapper` (or any guess about EDS's section DOM).**
The actual EDS shape is `<div class="section"><div class="default-content">…</div><div class="block-content">…</div></div>`. Confirm by inspecting a rendered page in the browser before designing CSS that relies on the wrapping shape.

**7. Doing the audit in too much depth.**
A 22-pattern audit produces abstractions. You only need a per-page section list. Pattern reuse emerges organically when you find two byte-identical sections.

**8. Building before locking decisions.**
Naming + reuse decisions look small but ripple through every block and content page. **Surface 3–5 naming questions to the user up front.** Lock answers in writing before any block code.

**9. Generic placeholder image paths.**
`/img/case-studies/foo.jpg` will 404 unless those images are uploaded. Use the prototype host URL so what you author renders correctly in EDS preview from day one.

**10. Touching `head.html` for fonts (preload included).**
Google Fonts `<link>` tags, Adobe Fonts script tags, any CDN-hosted stylesheet, AND `<link rel="preload" as="font">` lines all belong out of `head.html`. The first three add DNS/handshake hops and external coupling; the preload looks helpful but it's not — the metric-matched `body.session` pattern (principle 3) makes preload irrelevant for CLS, and adding it splits font discovery between two files. Declare `@font-face` in `styles/styles.css` only. Document any non-self-hostable proprietary font and the CLS trade-off it imposes.

**11. Skipping the metric-matched fallback `@font-face`.**
Without `size-adjust` + `ascent-override` + `descent-override` on a system-font fallback, the swap from system font → brand font shifts every line of text on the page when the woff2 lands. Lift the calibration from the matching `@fontsource-variable/<name>` package; rename the override `@font-face` after the system font (`"Arial"`, `"Times New Roman"`) so any reference to that family in a font stack picks up the adjusted metrics automatically.

**12. Over-applying the button convention.**
Not every link is a button. Whole-card tile anchors, tel:/mailto: channel values, and styled text links (e.g. wavelength-underlined "How we work →") are NOT buttons. Authors leave these as plain `<a>`; per-block CSS styles them. **The convention is for chips with a clickable boundary; if it's not that, don't apply it.**

## Checklist (per page)

- [ ] Each section in the prototype `<main>` has a corresponding block call in the content page.
- [ ] **No `<head>` element.** The page goes `<!DOCTYPE html><html><body>…</body></html>` — EDS injects the project `head.html` at delivery.
- [ ] `<header></header>` and `<footer></footer>` are EMPTY (static fragments load automatically via `postlcp.js`).
- [ ] No `metadata` block needed for header/footer. Only add one if suppressing them (`header: off` / `footer: off`).
- [ ] Image URLs are fully qualified (`https://main--…/stardust/prototypes/images/…`).
- [ ] No `<style>` or `<script>` tags in the content page.
- [ ] No section-metadata blocks.
- [ ] Closing CTA reuses the shared `closing` block.
- [ ] CTA links are wrapped in `<strong>` (primary) or `<em>` (secondary). Text links and tile-card anchors are plain `<a>`.
- [ ] Block JS exports `default async function decorate(block)` with JSDoc describing rows and noting any button conventions.
- [ ] Block CSS is scoped under `.block-name`.
- [ ] Block CSS does NOT redefine global tokens.
- [ ] Block CSS does NOT redefine global button classes (only legitimate overrides like size or hover variant).
- [ ] SVG markup is inline in the block JS (no shared waves utility).
- [ ] Block JS does NOT manufacture button anchors with custom classes.
- [ ] `prefers-reduced-motion: reduce` honored on any animation.
- [ ] `head.html` is untouched. No font `<link>`, `<script>`, `<style>`, or `<link rel="preload" as="font">` lines added. All `@font-face` declarations live in `styles/styles.css`. Brand woff2(s) live in `styles/fonts/`.
- [ ] Body defaults to a metric-matched system fallback (`arial, sans-serif` for sans brand, `times, "Times New Roman", serif` for serif). `body.session` switches to the brand stack via `var(--font-body)`.
- [ ] An override `@font-face` named after the system font (e.g. `"Arial"`) declares `size-adjust` / `ascent-override` / `descent-override` lifted from `@fontsource-variable/<name>`'s published calibration. Result: zero CLS on font swap.
- [ ] No per-block `font-family: var(--font-body)` or `var(--font-display)` declarations. Brand font flows from `body.session` via inheritance. Only mono and serif (Fraunces / Times) families are explicitly set per-block.

## When you finish

Update `stardust/eds-conversion-log.md` (or create one) with: final block inventory, decisions locked, anti-patterns avoided this run, anything site-specific the next person should know. The log is the running history of "why does this look the way it does."
