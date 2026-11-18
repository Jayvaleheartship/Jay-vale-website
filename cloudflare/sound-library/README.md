# Jay Vale Sound Library — Cloudflare one-click deployment

This is the **backend** for the Jay Vale Audio Lab, intentionally isolated from the website in its own project folder.

## One-click install from Chrome

[Deploy to Cloudflare](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2FJayvaleheartship%2FJay-vale-website%2Ftree%2Fmain%2Fcloudflare%2Fsound-library)

Open the link in **normal Chrome**, not the TinyFish embedded browser. Sign into the Cloudflare account yourself. Cloudflare's deployment wizard should create its own Worker, private R2 bucket and D1 database from `wrangler.jsonc`. This may require enabling R2 billing (the Standard storage free allowance is 10 GB-month); review any billing prompts before accepting. Source repository stays public, but no secrets or audio samples are committed here.

The Wrangler configuration intentionally leaves both the D1 resource ID and R2 bucket name unspecified so Cloudflare can automatically provision them. Cloudflare will assign resource names/IDs during deployment; dashboard deployments may not write these IDs back into this GitHub repository.

The `npm run deploy` command deploys the Worker and provisions R2 and D1 first, then applies `migrations/0001_schema.sql` to the new D1 database. The default Worker `/health` endpoint is public for connectivity tests, but **all sample endpoints are locked until distinct `READ_TOKEN` and `ADMIN_TOKEN` secrets of at least 32 random characters are set in Cloudflare's Worker Secrets settings**. The one-click wizard may offer to enter the two secrets during deployment based on `.dev.vars.example`; otherwise set them in Worker Settings > Variables and Secrets. Generate them in your password manager and never paste them into chat or the website source.

After deployment, you can safely share the Worker `https://...workers.dev` URL here (not the tokens) so the Audio Lab can be connected.

## Available endpoints

- `GET /health` — public status and readiness (no secrets).
- `GET /v1/status` — authenticated 9.5 GB budget and current usage.
- `GET /v1/session/challenge` — one-time 90-second proof challenge from the official website.
- `POST /v1/session/open` — HMAC proof-of-possession exchange for 15-minute read-only bearer session.
- `GET /v1/catalog` — authenticated family and GM inventory with actual indexed counts.
- `GET /v1/library/samples?family=drums&limit=150` — authenticated sample metadata list (no private R2 key).
- `GET /v1/match?family=drums&instrument=kick&duration_ms=300&features=...` — authenticated prototype fingerprint search.
- `GET /v1/samples/{id}` — authenticated private audio retrieval.
- `POST /v1/admin/samples` — authenticated multipart upload with `audio` and `metadata` JSON.

All sample data is private in R2; **never turn on public bucket access**. Only ingest properly licensed samples with source URL and attribution stored in D1. The Audio Lab v0.6 now has a **read-only remote Cloudflare connection panel** on the Rebuild drums tab. It securely exchanges a proof of READ_TOKEN possession for a 15-minute in-memory read session, browses the private catalogue, and loads up to 72 selected recorded drum/percussion one-shots. No permanent token is hardcoded in GitHub Pages; the original local library remains available as a fallback. See [CLOUD_BRIDGE.md](CLOUD_BRIDGE.md).

## Budget and limitations

Total library soft cap: **9.5 billion bytes**, leaving room below the 10 GB-month R2 Standard storage allowance. Software budget is not a Cloudflare spending cap: requests, Worker/D1 activity, billing rules, and uploads made directly in R2 may incur charges.

Family budgets are defined in `src/catalogue.js`: drums 2.5 GB, bass 1.5 GB, guitar 1.0 GB, keys 1.0 GB, synths 1.0 GB, strings 0.9 GB, brass 0.3 GB, woodwinds 0.3 GB, percussion 0.4 GB, world 0.3 GB, vocals 0.2 GB and effects 0.1 GB. This API prevents individual over-limit uploads, but concurrent uploads and modifications outside it can bypass the cap. For mass ingestion, add a serialized queue and reconciliation.

The 12-band spectral similarity is **prototype-quality**, not an exact sample identity detector. Keep the original audio protected, and evaluate matched recording fidelity before automated reconstruction at scale.

No Cloudflare account access, sample files, passwords, secret tokens or billing details are contained in this repository.

## Workers Builds installation settings

On Cloudflare's **Set up your application** screen for the connected `Jayvaleheartship/Jay-vale-website` repository set Project name to `jay-vale-sound-library`, leave Build command empty, set Deploy command to `npm run deploy`, and under Advanced settings set Path to `/cloudflare/sound-library`. Do not enter tokens as public variables or publish the private bucket. If the build token lacks R2/D1 editing permissions, the deployment will fail and the token must be adjusted through Cloudflare's token settings.
