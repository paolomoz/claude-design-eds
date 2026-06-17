# DA Mount Deploy Protocol

Reference for the deploy sequence used by Snowflake's Serve panel. This replaces the previous `aem put` / `aem preview` / `aem publish` pipeline with mount-based writes.

> **Two transports.** The **mount** path below (`write_file /mnt/da` + `mount refresh`) is for the sprinkle/cone runtime. From a **local agent** (Claude Code / CLI) there is no mount — use the **headless (Source API)** path in the next section instead. Both write the same sanitised **body-fragment** HTML; only the transport differs.

## Headless deploy (Source API + curl) — local agent

Use when running without the cone/mount. Needs an IMS token (`DA_TOKEN`; see the `da-content` / `da-auth` skills — may live in the repo `.env`, which MUST be gitignored). Also **push the code branch to GitHub first** so AEM Code Sync builds it and the branch preview renders your blocks.

```bash
ORG=<daOrg>; REPO=<daRepo>; BRANCH=<branch>; P=<path-without-extension>   # e.g. snowflake-blocks/test-1
TOKEN="$DA_TOKEN"

# 1. sanitise non-ASCII to entities (in place, idempotent) — DA corrupts raw UTF-8
node tools/da/sanitise.js content/$P.html

# 2. write the body fragment to DA (multipart, field name MUST be `data`, type text/html)
curl -sS -X PUT -H "Authorization: Bearer $TOKEN" \
  -F "data=@content/$P.html;type=text/html" \
  "https://admin.da.live/source/$ORG/$REPO/$P.html"           # expect 201

# 2b. NEW image assets must be LIVE on Code Bus BEFORE the preview ingests them (#75).
#     The preview fetches every <img src>, hashes the bytes into Media Bus, and writes
#     about:error if a URL doesn't return image bytes AT THAT MOMENT. A just-pushed
#     img/<brand>/x.jpg can lose the race with Code Sync. Wait for each authored image:
for u in $(grep -oE 'https://[^"]+/img/[^"]+\.(jpg|jpeg|png|webp|svg)' content/$P.html | sort -u); do
  until [ "$(curl -s -o /dev/null -w '%{http_code}' "$u")" = "200" ]; do sleep 3; done
done

# 3. preview (separate, required; path WITHOUT .html; ref = the code branch)
curl -sS -X POST -H "Authorization: Bearer $TOKEN" \
  "https://admin.hlx.page/preview/$ORG/$REPO/$BRANCH/$P"       # expect 200

# 3b. VERIFY no broken-image ingestion (#75) — must be 0; if not, an asset wasn't on
#     Code Bus yet. Re-run step 3 (preview is idempotent; it re-ingests and repairs).
curl -s "https://$BRANCH--$REPO--$ORG.aem.page/$P.plain.html" | grep -c about:error   # expect 0

# 4. (optional) publish to aem.live
curl -sS -X POST -H "Authorization: Bearer $TOKEN" \
  "https://admin.hlx.page/live/$ORG/$REPO/$BRANCH/$P"
```

URLs: DA edit `https://da.live/#/$ORG/$REPO/$P` · preview `https://$BRANCH--$REPO--$ORG.aem.page/$P` · live `https://$BRANCH--$REPO--$ORG.aem.live/$P`. Token pre-flight: a 401 with empty body means it expired (dev tokens last ~24h) — re-auth. The remaining sections describe the **mount** transport.

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
