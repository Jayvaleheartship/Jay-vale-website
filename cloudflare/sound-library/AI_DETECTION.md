# Jay Vale Audio Lab — AI Detection Provider Integration

Status: **development implementation only; live provider connection NOT verified yet.**

## Purpose

Use ACRCloud's authorized File Scanning AI Music Detection API through a private Cloudflare Worker. This is the only implementation path that uses the actual **ACRCloud detection model**; it is not proprietary source code, copied model weights, or a reverse-engineered substitute.

The UI lives at studio/audio-lab/ai-detection.html and is separate from reconstruction. Uploaded audio is not modified or imported into the sample library. Provider output remains unchanged.

## Private setup

In Cloudflare Worker jay-vale-sound-library, configure these values as server-side secrets, never in GitHub or browser:

- ACRCLOUD_ACCESS_TOKEN: token with ACRCloud File Scanning API access.
- ACRCLOUD_CONTAINER_ID: an AI Music Detection-enabled ACRCloud File Scanning container (engine 5).
- ACRCLOUD_REGION: eu-west-1, us-west-2, or ap-southeast-1, matching that container.

For example use npx wrangler secret put followed by each of those names from the cloudflare/sound-library directory. Enter secrets only in a trusted private terminal. Never paste them in chat.

The page uses the existing HMAC-protected READ_TOKEN to create a 15-minute session. Never enter ADMIN_TOKEN into a browser page. After provisioning, explicitly deploy the Cloudflare Worker: publishing static files alone does not activate the new API endpoints.

For any customer-facing offering, verify the ACRCloud contract allows redistribution or integration; this integration is intended for the owner's authenticated internal research. Paid scans can incur costs.

## API endpoints

All routes require an authorized short-lived bearer session:

- GET /v1/ai-detection/status — provider configured status.
- POST /v1/ai-detection — confirmed multipart audio upload, plus x-confirm-provider-upload: yes.
- GET /v1/ai-detection/:uuid — provider state and unchanged results.ai_detection entries.
- DELETE /v1/ai-detection/:uuid — delete the provider's stored result.

The Worker allows MP3, WAV, M4A, FLAC and OGG up to 50 MiB. ACRCloud documents a 900-second duration limit. The Worker uses an allowlisted ACRCloud regional hostname and never forwards provider tokens or raw error payloads to the browser.

## Workflow

1. Open AI Detection Lab from the Audio Lab page and connect using READ_TOKEN.
2. Choose audio and its comparison label: original, rebuilt, vocals, instrumental, other.
3. Explicitly approve external provider submission; submit.
4. Inspect full mix/vocal/accompaniment scores and segments if ACRCloud returns them.
5. Repeat with another variant and compare provider scores without recalibration.
6. Export JSON, and optionally delete the provider result.

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
- [ ] GitHub Actions tests pass after latest source changes.
- [ ] Real ACRCloud credentials and AI-enabled container configured privately.
- [ ] Cloudflare Worker containing detection routes deployed.
- [ ] Real uploaded track scanned successfully in the browser.
- [ ] Result cross-checked against ACRCloud's console for the same model version.
- [ ] Vocals/accompaniment segmentation, deletion and provider billing verified.
