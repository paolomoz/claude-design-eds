# DA Integration Plan — `feat-da-integration`

## Summary

Replace the `aem put` / `aem preview` / `aem publish` deploy sequence with a DA mount-based write flow. The `mount` command in the Slicc environment provides full CRUD against DA spaces via `da://<org>/<repo>` URIs. After mounting, standard `write_file` calls push content directly to DA, and `mount refresh` confirms the write landed before reporting success.

---

## Architecture: Artifact Routing

| Artifact type | Destination | Mechanism |
|---|---|---|
| Block JS/CSS (`blocks/**`) | GitHub branch | `git commit + push` (unchanged) |
| Global styles (`styles/**`) | GitHub branch | `git commit + push` (unchanged) |
| Scripts (`scripts/**`) | GitHub branch | `git commit + push` (unchanged) |
| Content pages (`content/*.html`) | DA space | `mount` → `write_file` → `mount refresh` |
| Fragments (`content/fragments/*.html`) | DA space | `mount` → `write_file` → `mount refresh` |

Code goes to GitHub (where it's served by the EDS CDN via the branch). Content goes to DA (where it's editable in the DA UI and served to EDS via the DA backend).

---

## New User Inputs (Scoop panel)

Two new fields on the Scoop panel, below the existing GitHub repo + branch fields:

| Field | Label | Placeholder | Hint text |
|---|---|---|---|
| DA Space | `DA Space` | `org/repo` | "The DA space to deploy content pages into (e.g. `my-org/my-site`)" |
| DA Path | `DA Path` | `/` | "Sub-path within the DA repo for content (e.g. `/brand-x`). Defaults to `/<branch>`" |

**Validation rules:**
- DA Space: required when deploying. Format `<org>/<repo>` — split on `/`, min 2 segments.
- DA Path: optional; defaults to `/<branch>` (the same value from the branch field). Always starts with `/`. Trailing slash is stripped.

---

## Flow Changes

### Current flow (4 steps)
```
Scoop → Sprinkle → Swirl → Serve
  (repo)   (files)   (convert)  (deploy via `aem put/preview/publish`)
```

### New flow (same 4 steps, deploy logic changes)
```
Scoop → Sprinkle → Swirl → Serve
  (repo + DA)  (files)   (convert)  (deploy via mount + write_file)
```

The stepper stays at 4 panels. The Scoop panel gains the DA fields. The Serve panel gains a "DA mount" status row and the stage columns change from `Upload | Preview | Publish` to `Write | Refresh | Live`.

---

## Detailed Implementation

### 1. SKILL.md Changes

#### `connect-repo` lick — expanded payload

```json
{
  "repo": "owner/name",
  "branch": "feat-xyz",
  "daSpace": "org/repo",
  "daPath": "/feat-xyz"
}
```

New steps appended to the existing connect-repo handler:

5. Parse `daSpace` → `<daOrg>/<daRepo>`.
6. Mount: `mount --source da://<daOrg>/<daRepo> /mnt/da`
7. Verify mount: `mount list` — confirm `/mnt/da` appears.
8. On success: push `sprinkle send snowflake '{"type":"repo-connected","daMount":"/mnt/da"}'`.
9. On auth failure (`EACCES`): push error telling user to authenticate via Adobe provider first.

#### `start-deploy` lick — new payload shape

```json
{
  "files": ["home", "about"],
  "fragments": ["nav", "footer"],
  "branch": "feat-xyz",
  "daSpace": "org/repo",
  "daPath": "/feat-xyz"
}
```

#### Deploy sequence per item (replaces `aem put` / `aem preview` / `aem publish`)

**Stage 1 — Write** (replaces "Upload")

```bash
# Sanitise non-ASCII (unchanged — still critical for DA)
node tools/da/sanitise.js <local path>

# Write via the mount
write_file /mnt/da/<daPath>/<relative-path>.html <content>
```

Where `<relative-path>` is:
- Fragments: `fragments/<name>` (e.g. `fragments/nav`)
- Pages: `<name>` (e.g. `home`)

DA strips the `.html` extension internally, but we write the file WITH `.html` — the mount handles the extension semantics.

**Stage 2 — Refresh** (replaces "Preview")

```bash
mount refresh /mnt/da
```

Parse the output to confirm the file landed: look for the file in the `+N` or `~N` count. If `0 errors` → success. If errors > 0 → report error.

This is the critical confirmation step. Without it, a write could be cached locally but not yet synced to the DA backend.

**Stage 3 — Live** (replaces "Publish")

Once refresh confirms the write, the content is live at:
- Live URL: `https://<branch>--<daRepo>--<daOrg>.aem.live/<daPath>/<name>`
- DA Edit URL: `https://da.live/edit#/<daOrg>/<daRepo>/<daPath>/<name>`

No separate "publish" API call is needed — DA content is live as soon as it's written and the CDN picks it up. The "Live" stage transitions immediately to `done` after refresh succeeds, with the `liveUrl` attached.

#### URL templates (updated)

| Kind | Write path (mount) | DA Edit URL (`daUrl`) | Live URL (`liveUrl`) |
|---|---|---|---|
| fragment | `/mnt/da/<daPath>/fragments/<n>.html` | `https://da.live/edit#/<daOrg>/<daRepo>/<daPath>/fragments/<n>` | `https://<branch>--<daRepo>--<daOrg>.aem.live/<daPath>/fragments/<n>` |
| page | `/mnt/da/<daPath>/<n>.html` | `https://da.live/edit#/<daOrg>/<daRepo>/<daPath>/<n>` | `https://<branch>--<daRepo>--<daOrg>.aem.live/<daPath>/<n>` |

#### Mount persistence

The mount at `/mnt/da` is **not unmounted** after deploy. It stays active for:
- Ongoing bidirectional sync (user edits in DA UI → `mount refresh` → local view updates)
- Subsequent conversions without re-mounting
- Manual edits via `write_file /mnt/da/...` from chat

### 2. Sprinkle UI Changes (`snowflake.shtml`)

#### Scoop panel (panel-0) — new fields

Add after the branch input:

```html
<div class="sf-field">
  <label class="sf-field__label">DA Space</label>
  <input type="text" class="sf-field__input" id="daSpaceInput"
    placeholder="org/repo">
  <div class="sf-field__hint">DA space for content deployment (org/repo)</div>
</div>
<div class="sf-field">
  <label class="sf-field__label">DA Path</label>
  <input type="text" class="sf-field__input" id="daPathInput"
    placeholder="/<branch>">
  <div class="sf-field__hint">Sub-path within the DA repo &mdash; defaults to /&lt;branch&gt;</div>
</div>
```

#### State additions

```js
state.daSpace = '';
state.daPath = '';
```

#### `nextStep()` changes (step 0)

```js
state.daSpace = document.getElementById('daSpaceInput').value.trim();
state.daPath = document.getElementById('daPathInput').value.trim() || '/' + state.branch;
// Validate daSpace format
if (state.daSpace && state.daSpace.split('/').length < 2) {
  // show inline validation error
  return;
}
slicc.lick({
  action: 'connect-repo',
  data: {
    repo: state.repo,
    branch: state.branch,
    daSpace: state.daSpace,
    daPath: state.daPath
  }
});
```

#### `conversion-complete` → `start-deploy` lick (auto-fired)

Include DA fields in the lick payload:

```js
slicc.lick({
  action: 'start-deploy',
  data: {
    files: data.files || [],
    fragments: data.fragments || [],
    branch: data.branch,
    daSpace: state.daSpace,
    daPath: state.daPath
  }
});
```

#### Serve panel stages

Update `STAGES` array:

```js
var STAGES = [
  { key: 'write', label: 'Write' },
  { key: 'refresh', label: 'Refresh' },
  { key: 'live', label: 'Live' }
];
```

#### DA mount status indicator

Add a small status row at the top of the Serve panel showing mount health:

```html
<div class="sf-serve__mount-status" id="mountStatus">
  <span class="sf-serve__mount-dot"></span>
  <span class="sf-serve__mount-label">DA Mount: /mnt/da</span>
</div>
```

Styled green-dot when healthy, red when errored.

#### New sprinkle update types

| type | Purpose |
|---|---|
| `da-mount-ready` | Mount confirmed active — show green dot |
| `da-mount-error` | Mount failed — show red dot + message |

### 3. Deploy Logic (scoop instructions)

The deploy scoop receives this brief:

```
Mount is active at /mnt/da.
DA Space: <daOrg>/<daRepo>
DA Path: <daPath>
Branch: <branch>

For each item (fragments first, then pages):

1. WRITE stage:
   - Sanitise: node tools/da/sanitise.js <local-path>
   - Read sanitised content: read_file <local-path>
   - Write to mount: write_file /mnt/da/<daPath>/<relative>.html <content>
   - Push: sprinkle send snowflake '{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"write","status":"done","daUrl":"<url>"}'

2. REFRESH stage:
   - Run: mount refresh /mnt/da
   - Parse output for errors.
   - Push: sprinkle send snowflake '{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"refresh","status":"done"}'

3. LIVE stage:
   - Immediately resolve (no API call needed — DA content is live post-refresh).
   - Push: sprinkle send snowflake '{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"live","status":"done","liveUrl":"<url>"}'

Batch refresh: To avoid N refresh calls, batch all writes first, then do ONE
mount refresh covering all items. Report refresh+live stages for all items
together after the single refresh confirms 0 errors.
```

### 4. Error Handling

| Error | Detection | Response |
|---|---|---|
| `EACCES: da access denied` | Mount probe or first write | Push `da-mount-error` to sprinkle. Tell user to authenticate via Settings → Providers → Adobe |
| `EBUSY: remote modified since last read` | Write conflict | Re-read the mount path, retry write once |
| `EFBIG: body exceeds maxBodyBytes` | Write of very large page | Report per-item error, continue with others |
| `mount refresh` reports errors > 0 | Refresh output parsing | Mark affected items as `error`, continue with others |
| Network timeout on write | Write hangs | Retry once; on second failure, mark error |
| DA space doesn't exist | Mount probe returns 403/404 | Push `error` to sprinkle, stay on Scoop panel |

### 5. Metadata path adjustment

Content pages' metadata block currently uses `/<branch>/fragments/nav` etc. When deploying to DA with a custom `daPath`, the metadata paths must match:

```html
<div class="metadata">
  <div><div>header</div><div>/<daPath>/fragments/nav</div></div>
  <div><div>footer</div><div>/<daPath>/fragments/footer</div></div>
</div>
```

This means the conversion phase (Swirl) needs to know the `daPath` so it can emit correct metadata. Pass `daPath` into the `start-conversion` payload or resolve it from state.

---

## File Change Summary

| File | Change |
|---|---|
| `.claude/skills/stardust-to-snowflake/SKILL.md` | Add DA fields to `connect-repo` + `start-deploy` lick docs. Replace `aem put/preview/publish` sequence with mount+write+refresh. Update URL templates. Add mount persistence note. Update metadata path docs. |
| `.claude/skills/stardust-to-snowflake/snowflake.shtml` | Add DA Space + DA Path inputs. Update state. Pass DA fields in licks. Change deploy stages to Write/Refresh/Live. Add mount status indicator. |
| `tools/da/deploy.md` (new) | Reference doc for scoops: mount-based deploy protocol, batching strategy, error codes. |

---

## Migration Path

- The `aem` CLI command references in the SKILL.md are replaced entirely — no fallback needed since `aem` isn't available in Slicc.
- The `sanitise.js` script is retained unchanged — it's still needed before any DA write.
- The `tools/da/da.js` (DA preview loader) is unaffected — it's runtime client code, not deploy tooling.

---

## Decisions (resolved)

1. **`daPath` defaults to `/<branch>`** — isolates branch content from main.
2. **Live URL only** — no separate preview URL surfaced. DA content is live post-refresh.
3. **Per-item refresh** — each file gets its own `mount refresh` confirmation before reporting success. Slower but gives individual guarantees.
