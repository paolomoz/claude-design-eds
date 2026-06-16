# DA Mount Deploy Protocol

Reference for the deploy sequence used by Snowflake's Serve panel. This replaces the previous `aem put` / `aem preview` / `aem publish` pipeline with mount-based writes.

## Prerequisites

- DA mount active at `/mnt/da` (established during `connect-repo`)
- Adobe IMS auth active (reuses the Adobe LLM provider OAuth token)
- `tools/da/sanitise.js` available in the repo

## Variables

| Variable | Source | Example |
|---|---|---|
| `<daOrg>` | First segment of `daSpace` | `my-org` |
| `<daRepo>` | Second segment of `daSpace` | `my-site` |
| `<daPath>` | From lick payload (defaults to `/<branch>`) | `/feat-xyz` |
| `<branch>` | From lick payload | `feat-xyz` |
| `<name>` | Repo basename from `connect-repo` | `snowflake` |

## Sequence (per item, sequential)

### Stage 1: Write

```bash
# 1. Sanitise non-ASCII to HTML entities (in-place, idempotent)
node tools/da/sanitise.js /workspace/<name>/content/<relative>.html

# 2. Read the sanitised content
cat /workspace/<name>/content/<relative>.html

# 3. Write to the DA mount
write_file /mnt/da/<daPath>/<relative>.html <content>
```

Where `<relative>` is the page basename (e.g. `home`, `about`).

Note: Static fragments (header/footer) are NOT deployed to DA — they are code committed to the GitHub branch under `fragments/`.

Sprinkle events:
```
{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"write","status":"running"}
{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"write","status":"done","daUrl":"<DA Edit URL>"}
```

### Stage 2: Refresh

```bash
mount refresh /mnt/da
```

Output format: `Refreshed /mnt/da: +N -N ~N (N unchanged, N errors)`

- `0 errors` → success
- errors > 0 → mark item as error

Sprinkle events:
```
{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"refresh","status":"running"}
{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"refresh","status":"done"}
```

### Stage 3: Live

No API call needed — DA content is live post-refresh. Immediately resolve with the live URL.

Sprinkle events:
```
{"type":"deploy-progress","kind":"<kind>","file":"<n>","stage":"live","status":"done","liveUrl":"<Live URL>"}
```

## URL Construction

### DA Edit URL
```
https://da.live/edit#/<daOrg>/<daRepo>/<daPath>/<relative>
```
Note: NO `.html` extension in the URL.

### Live URL
```
https://<branch>--<daRepo>--<daOrg>.aem.live/<daPath>/<relative>
```
Note: NO `.html` extension. Use branch host prefix, never `main--`.

## Error Recovery

| Error | Action |
|---|---|
| `EACCES` | Re-authenticate via Adobe provider; push item error |
| `EBUSY` | Re-read mount path, retry write once |
| `EFBIG` (>5 MB) | Push item error, continue |
| Refresh errors > 0 | Push item error, continue |

## Ordering

Deploy pages sequentially. Static fragments (header/footer) are not part of the DA deploy — they are code served from the GitHub branch via the EDS CDN.

## Completion

After all items processed:
```
{"type":"deploy-complete"}
```

## Mount Lifecycle

- Mount is established during `connect-repo` and persists indefinitely
- Do NOT unmount after deploy
- Use `mount list` to verify mount is active before starting
- If mount is gone, re-establish: `mount --source da://<daOrg>/<daRepo> /mnt/da`
