# Jay Vale Audio Lab — AI Detection Provider Integration

Status: **development implementation only; live provider connection NOT verified yet.**

## Purpose

Use ACRCloud's authorized File Scanning AI Music Detection API through a private Cloudflare Worker. This is the only implementation path that uses the actual **ACRCloud detection model**; it is not proprietary source code, copied model weights, or a reverse-engineered substitute.

The UI lives at studio/audio-lab/ai-detection.html and is separate from reconstruction. Uploaded audio is not modified or imported into the sample library. Provider output remains unchanged.

## Private setup — 27 November 2026

The owner has logged in to ACRCloud's regular console and shown a completed **AI Music Detection** scan for the reconstructed 193-second Interlude, returning **99.22%**, likely source **Suno**, stem **Original**. This confirms the service works in the account's console; **it does not verify API credentials or the new Cloudflare integration**.

For the private Cloudflare Worker `jay-vale-sound-library`, configure **only the provider token at first**:

- **Required secret:** `ACRCLOUD_ACCESS_TOKEN` — generate in ACRCloud Console → Developer Settings.
- **Optional setting:** `ACRCLOUD_CONTAINER_NAME=Jimmy` — selects the single matching AI-enabled container during auto-discovery.
- **Optional settings:** `ACRCLOUD_CONTAINER_ID` and `ACRCLOUD_REGION` — explicitly select a container (region: eu-west-1, us-west-2, or ap-southeast-1). Configure both or neither.
- **Safe default:** `ACRCLOUD_NEW_SCANS_ENABLED` is **unset**; this blocks new paid scans but permits read-only retrieval of existing results.
- **Enable only after provider parity verification:** `ACRCLOUD_NEW_SCANS_ENABLED=true` enables user-confirmed new uploads.
- **Keep disabled:** `ACRCLOUD_ENABLE_EXPERIMENTAL_STREAM` is **unset**; experimental large-file streaming is not included in the production-ready path.

The server validates the named/selected ACRCloud container with the official Console API. If there are multiple eligible containers, it refuses to choose silently: set an exact name or numeric ID and region.

From a trusted local terminal in `cloudflare/sound-library`, set the required Cloudflare secret with:

    npx wrangler secret put ACRCLOUD_ACCESS_TOKEN

Never paste or commit token values. Do not configure secrets through GitHub source, this chat, or public HTML. The browser's existing HMAC-proven READ_TOKEN permits 15-minute scoped access to private library endpoints; do not enter ADMIN_TOKEN into the browser.

Publishing GitHub static files does **not** deploy new Cloudflare Worker routes. Deploy the Worker explicitly only after validating its configuration and provider contract. ACRCloud account charges and trial entitlements must be checked in the provider console before enabling new submissions.

The private TinyFish account profile is still not documented as signed in, but it is unnecessary for the API integration once a properly authorized access token is configured.

For a public or multi-user service, verify ACRCloud's license/redistribution terms and add dedicated scan-scoped authorization, rate limits, and billing alerts.

## API endpoints

All routes require an authorized short-lived bearer session:

- GET /v1/ai-detection/status — provider configured status.
- GET /v1/ai-detection/existing — first 30 previously submitted files (read-only, no new scan).
- POST /v1/ai-detection — confirmed multipart audio upload, plus x-confirm-provider-upload: yes.
- GET /v1/ai-detection/:uuid — provider state and unchanged results.ai_detection entries.
- DELETE /v1/ai-detection/:uuid — delete the provider's stored result.

The Worker supports validated direct MP3, WAV, M4A, FLAC and OGG uploads up to 50 MiB. Experimental presigned streaming is disabled by default until the endpoint contract is verified with ACRCloud. ACRCloud documents a 900-second duration limit. The Worker verifies the AI detection flag and region through ACRCloud's Console API before accepting paid scans. It uses an allowlisted ACRCloud regional hostname and never forwards provider tokens or raw error payloads to the browser.

## Workflow

1. Open AI Detection Lab from the Audio Lab page and connect using READ_TOKEN.
2. **First select Find existing scans.** Choose the previously uploaded Interlude and load its saved provider result without uploading any new audio or incurring a new scan.
3. View the provider's original/vocals/accompaniment classification and optional nested time segments. Download JSON to preserve the full returned record.
4. Compare any earlier original/reconstructed variants already saved by ACRCloud.
5. New uploads remain disabled unless the owner explicitly enables scans server-side. If enabled, select an audio file, confirm its external submission, and scan.
6. Only scans created in the current application session may be deleted through this UI. Earlier console scans cannot be deleted accidentally here.

The comparison stays in browser memory only. No persistent browser storage is used.

## Known limitations

- ACRCloud does not disclose its proprietary feature extraction, causal explanations or watermark keys through this API; segment and stem scores are the most detailed official results currently documented.
- A probability is not proof of origin. ACRCloud's accuracy metrics derive from internal evaluations, not independently reconstructed stems.
- This first private release reuses library read sessions for provider scans. Treat READ_TOKEN as highly confidential. Add separate scan-scoped authorization, spend limits and rate limiting before expanding access to multiple users.
- The uploader forwards files as-is but caps at 50 MiB, and direct upstream upload may time out with large files. Presigned-upload support is a later improvement.
- Provider scores should only be described as ACRCloud scores when fetched live; a separate original Jay Vale detector would require its own independently benchmarked model.

## Acceptance checks

- [x] Protected backend adapter, explicit upload consent and unchanged provider result mapping implemented.
- [x] UI supports scanning, result visualization, comparison, JSON export and provider deletion.
- [ ] GitHub Actions tests pass for the latest 27 November 2026 source changes (verify CI after final commit).
- [x] User verified ACRCloud Console AI Music Detection working; readout for one reconstructed Interlude was 99.22% Suno, original stem.
- [ ] Private ACRCloud API token is still unconfigured in Cloudflare; container auto-discovery and previous-scan retrieval await that configuration.
- [ ] Cloudflare Worker containing detection routes deployed.
- [ ] Real uploaded track scanned successfully in the browser.
- [ ] Result cross-checked against ACRCloud's console for the same model version.
- [ ] Vocals/accompaniment segmentation, deletion and provider billing verified.
