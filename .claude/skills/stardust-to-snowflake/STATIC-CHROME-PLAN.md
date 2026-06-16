# Static Header/Footer Plan — `feat-static-header-footer`

## Problem

The current header/footer approach treats chrome as DA-authored fragments: store structured content in DA, then have block JS (`blocks/header/header.js`, `blocks/footer/footer.js`) parse the flat structure and rebuild it into a styled DOM. This is the standard EDS pattern, but it creates unnecessary complexity for Snowflake conversions:

1. The fragment content must be simplified to a flat structure that EDS can author (losing the prototype's original classes and nesting)
2. Block JS must reverse-engineer the flat structure back into a styled DOM
3. The result never matches the prototype exactly — visual fidelity suffers
4. Two round-trips at page load: fetch fragment HTML from DA, then process it

## Solution

Store header and footer as **static HTML fragment files** in the GitHub repo (code, not content). During conversion, extract the prototype's nav and footer DOM + their CSS verbatim. The EDS runtime fetches these static fragments from the code origin and injects them directly — no parsing, no rebuilding.

### Artifact routing (updated)

| Artifact | Destination | Mechanism |
|---|---|---|
| Static header fragment (`fragments/header.html`) | GitHub branch | git commit + push |
| Static footer fragment (`fragments/footer.html`) | GitHub branch | git commit + push |
| Block JS/CSS, scripts, styles | GitHub branch | git commit + push |
| Content pages (body) | DA space | mount + write_file |

Header and footer are **code** — they ship with the site like blocks do. Content pages only contain the body sections + metadata block.

---

## File structure

```
fragments/
  header.html    ← full DOM + <style> scoped to header
  footer.html    ← full DOM + <style> scoped to footer
```

These are NOT EDS content pages (no `<main>`, no sections, no block markup). They are raw HTML fragments — a `<style>` tag plus the chrome DOM, ready to inject.

### Fragment file format

```html
<style>
  /* scoped styles for this fragment — lifted from prototype */
  .utility { ... }
  nav.topnav { ... }
  /* responsive breakpoints included */
</style>
<div class="utility">...</div>
<nav class="topnav">...</nav>
```

No `<!DOCTYPE>`, no `<html>`, no `<body>` — just the raw content. The loader injects it directly into `<header>` or `<footer>`.

---

## EDS Code Changes

### 1. Remove `blocks/header/header.js` (the DA fragment parser)

The current header block:
- Fetches a DA fragment via `loadFragment()`
- Parses the flat structure (picture → logo, ul → nav links, etc.)
- Rebuilds into `.header-nav` structure

**Replace with:** A new loader in `scripts/ak.js` (or `postlcp.js`) that fetches the static fragment and injects it raw.

### 2. Remove `blocks/footer/footer.js` (same)

Same treatment — no more fragment parsing for footer.

### 3. New: Static chrome loader

Add a function to the boot sequence that handles header/footer loading:

```js
async function loadChrome() {
  const codeBase = getConfig().codeBase;
  const branch = getBranch(); // resolve from hostname or metadata
  
  const load = async (el, path) => {
    const resp = await fetch(`${codeBase}/${path}`);
    if (!resp.ok) return;
    const html = await resp.text();
    el.innerHTML = html;
  };
  
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  
  await Promise.all([
    header ? load(header, 'fragments/header.html') : null,
    footer ? load(footer, 'fragments/footer.html') : null,
  ]);
}
```

### 4. Branch resolution

Since Snowflake uses a single EDS repo with multiple branch-based sites, the static fragments live at the branch level. The EDS CDN already serves branch content at `https://<branch>--<repo>--<org>.aem.live/...`, so fetching `fragments/header.html` on a branch-hosted page automatically resolves to the correct branch's fragment.

**No special branch logic needed** — the browser's origin already includes the branch. Relative URLs (`/fragments/header.html`) resolve to the correct branch automatically on `<branch>--<repo>--<org>.aem.live`.

However, for local development and DA preview (where the origin might be `localhost` or `da.live`), the `codeBase` already handles this — it's set from `import.meta.url` which points at the code origin.

### 5. Header loading timing

Currently: header loads via `postlcp.js` (after LCP) using `loadBlock(header)` which calls `blocks/header/header.js`.

New: The static chrome loader should run in `postlcp.js` as before (header is not LCP-critical). The fetch is fast (same-origin, CDN-cached), and injection is a single `innerHTML` — no parsing/rebuild overhead.

### 6. `metadata` block in content pages — simplified

Content pages no longer need `header` / `footer` metadata entries since the chrome isn't loaded from DA fragments. The metadata block can be removed entirely from content pages (or kept for other metadata).

If we want to support opt-out (`header: off`), keep the `getMetadata('header')` check in the loader.

---

## SKILL.md Changes

### Conversion Step 6 (Chrome) — rewritten

Instead of:
> Write `blocks/header/{header.js,header.css}`, `blocks/footer/{footer.js,footer.css}`, and fragment pair at `content/fragments/{nav.html,footer.html}`

New:
> Extract the header and footer DOM + styles verbatim from the prototype. Write to `fragments/header.html` and `fragments/footer.html` in the repo root. These are static fragments — full HTML with a `<style>` block. No EDS authoring shape, no content page format.

### Content page scaffold — metadata removed

The metadata section pointing to `/<daPath>/fragments/nav` and `/<daPath>/fragments/footer` is removed. Content pages end after the last body section.

### Deploy changes

Fragments no longer go to DA. They're committed to the GitHub branch with the rest of the code. The `start-deploy` lick only handles content pages (no `fragments` array needed).

---

## Implementation Checklist

1. [ ] Create `fragments/` directory at repo root
2. [ ] Remove `blocks/header/header.js` (keep the directory — CSS stays for any non-chrome header styling)
3. [ ] Remove `blocks/footer/footer.js` (same)
4. [ ] Add static chrome loader function to `scripts/postlcp.js` or a new `scripts/chrome.js`
5. [ ] Update `scripts/ak.js` `decorateHeader()` to skip loadBlock call (chrome loads separately)
6. [ ] Update SKILL.md Step 6 (Chrome) to describe static extraction
7. [ ] Update SKILL.md Step 9 (Content page scaffold) to remove metadata block
8. [ ] Update SKILL.md `start-deploy` to remove fragments from DA deploy
9. [ ] Update `snowflake.shtml` — remove fragments from `conversion-complete` / `start-deploy` payloads, remove Fragments section from Serve panel (or repurpose for "committed to branch" confirmation)
10. [ ] Update `da-deploy-protocol.md` — pages only, no fragments

---

## Open questions

1. **Should we keep `blocks/header/` and `blocks/footer/` directories at all?** — Recommend removing them entirely since there's no block JS to run. Any header/footer CSS goes into the fragment's `<style>` tag.
2. **`header: off` support** — Should the loader still check `getMetadata('header')` for pages that want to suppress chrome? Recommend yes — lightweight and useful.
3. **Fragment CSS: inline `<style>` vs separate `.css` file?** — Inline is simpler (one fetch per fragment) and avoids FOUC. Recommend inline.
