# Jay Vale Audio Lab v0.6 — Cloudflare private connection

The Audio Lab on https://jayvalemusic.com/studio/audio-lab/?v=6 can connect directly to the Cloudflare Worker at https://jay-vale-sound-library.helgacoupe.workers.dev without hardcoding long-lived secrets in public HTML.

## Connect from your own browser

1. Open the Audio Lab's **Rebuild drums** tab and expand **Private Cloudflare instrument library**.
2. Get the existing **READ_TOKEN** from your password manager. Never use **ADMIN_TOKEN** and never paste either into chat.
3. Enter READ_TOKEN in the password field and select **Connect private library**. The field is cleared immediately. The app sends **only a HMAC-SHA256 proof** of the Cloudflare-issued challenge, not the permanent token.
4. The Worker verifies the one-time challenge (90-second lifetime, one use per D1 replay record) and grants a read-only session token valid for **15 minutes**. Session token is held in JS memory and not persisted in cookies, localStorage, sessionStorage or IndexedDB.
5. After connecting, the private catalogue displays the live instrument-family counts. Select **Load cloud drum samples for matching** to download **up to 72** balanced one-shot candidates into browser memory. Upload your drum stem and perform normal source-locked matching with these sounds.
6. **Disconnect** immediately erases the ephemeral access token and cloud sample bank from the active workspace (restoring any previous local bank). A page reload also clears the session.

## Architecture

**New backend routes**
- `GET /v1/session/challenge`: temporary, signed challenge; only accepts requests from the official site origin.
- `POST /v1/session/open`: verifies HMAC proof of READ_TOKEN, checks challenge signature/expiration/one-time D1 use, returns scoped 15-minute read token.
- `GET /v1/catalog`: protected, lists instrument families and actual D1 counts.
- `GET /v1/library/samples?family=drums&limit=150`: protected listing with ids, duration, size, license and instrument type; does not leak R2 object keys.
- `GET /v1/samples/{id}`: protected R2 sample download; now also allows read-only ephemeral sessions.
- `POST /v1/admin/samples`: remains **ADMIN_TOKEN only**. Ephemeral read-only sessions never have write permission.

The Worker CORS policy permits `https://jayvalemusic.com`. Note: origin checks are not a replacement for authentication; session signatures must validate cryptographically.

**Security boundaries**
- No private token in GitHub Pages source, query strings, URLs, or permanent browser storage.
- No entire audio stem is uploaded to Cloudflare during matching; the browser requests authorized sample recordings only.
- The user necessarily enters their READ_TOKEN into the browser page once to prove possession, but the token value is never sent over the network. Do not use this method on an untrusted device or if the website origin is compromised.
- Challenge replay prevention uses D1. Signed session tokens expire in 15 minutes and are read-only. Never copy private R2 bucket URLs or secret values into public source code.
- The public Worker health endpoint reports only status and aggregate file counts.

## Testing / acceptance

- GitHub Actions `Audio Lab Cloud Bridge Tests` must pass all tests for HMAC challenge issuance, replay rejection, incorrect proof rejection, tampered tokens and JS syntax.
- Published Audio Lab must show cloud panel and correct 309-indexed-file count without any private credentials.
- Anonymous catalogue requests must return HTTP 401.
- Cloud Worker scheduled test must report `cloud_bridge.status=passed`, including `session_verified=true`, `d1_sample_verified=true`, `r2_sample_verified=true`.
- **Human acceptance:** user pairs from their own browser with their existing private READ_TOKEN, sees the private catalogue, and loads cloud one-shots. We must not claim to have tested their personal authenticated browser session until they actually do this.

## Scope remaining for later tasks

The current browser loads a bounded drum subset for conservative transient matching. Full 309-sample browse and advanced pitch-aware matching are separate tasks 4–7, as is full 10 GB sample-library coverage. The 2 Drums.mp3 source-locked A/B reconstruction is Task 8. Bitwig factory sounds remain private/local unless their licenses explicitly permit other handling.
