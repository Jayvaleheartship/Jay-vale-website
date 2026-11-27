# Jay Vale Audio Lab — First-Trial Checklist

Updated 27 November 2026 after AI Detection Lab read-only provider integration, security checks, and branch CI; earlier first-trial verification records are preserved below. For **every to-do task**: complete the work, verify the outcome, update this saved checklist immediately, display the revised task list, and let the user choose the next item. Never mark a task complete from code commits alone.

## Interlude human-vocal reference study — 27 November 2026

- [x] Conducted license-aware dataset review for VocalSet (controlled professional singing, license requires exact record verification), Vocadito (40 solo vocals, publication describes CC BY 4.0), LibriTTS (CC BY 4.0 speech), LJ Speech (public-domain speech); held Smule DAMP pending its special research agreement and excluded commercial use of noncommercial-licensed GTSinger.
- [x] Reused the **actual 0 Lead Vocals.mp3 and 1 Backing Vocals.mp3** Interlude source stems and two previously supplied Jay Vale control voice files. Extracted SHA-256 provenance for all four; the human-recorded provenance of the controls remains **unverified**.
- [x] Ran new read-only 16 kHz stereo voice analysis in fixed 50 ms frames/20 ms hops: RMS, pitch candidates, periodicity, spectral centroid/roll-off/flatness/flux, high/low spectral energy, L/R correlation and side-to-mid ratio. No reference or source WAV was edited.
- [x] Measured median stereo correlation: lead 0.977, backing 0.735, test-speech control 0.997 and phone control 1.000. These are capture/mix observations and not evidence of a real/AI voice identity. Speech and singing are not directly matched distributions.
- [x] Added python/human_vocal_research.py, python/vocal_reference_sources.json and python/test_human_vocal_research.py; wired research into python/run_full_pipeline.py as a source-only study. Four local tests passed, and all reports were saved privately in /Jay_Vale_Audio_Lab_Projects/Interlude_x_Detuned_Fragments/Interlude_Human_Vocal_Research_2026-11-27.zip (SHA-256 a448a9c8a8ee9720d3e7f51ab6f57ce708d80b9b49f298210e462e12bcefd0ec).
- [ ] Actual human singing benchmark clips not yet acquired and fingerprint/license-verified in the local reference bank; no external dataset trained or learned model exists yet.
- [ ] New genuine lead/backing performances for the actual Interlude phrases are not available. Metadata or inaudible signal changes cannot transform an AI source into a human recording or prove authorship. No ACRCloud score reduction was attempted.
- [ ] Current research is **read-only acoustic QA**; future style improvements must be audibly evaluated, properly licensed and truthfully attributed.

## Interlude exclusive 12-stem live-file pilot — 27 November 2026

- [x] Selected Interlude x Detuned Fragments (Mashup) as **the only real-song test fixture**. Recovered the user's original ZIP from private Library and verified ZIP SHA-256 `63973b514ad7b622d3daa25429442d35ec3416b2e70468aa9204781a271dc96a` plus all individual 12 stem hashes.
- [x] Audited **12/12 synchronized 48 kHz stereo MP3** stems (2 vocals + 10 instrumental); every track decodes to exactly **193.104 s**. Kept the original files unchanged and private.
- [x] Built an executable 16-stage Interlude orchestration in `python/run_full_pipeline.py`, private project status ledger, per-stem source manifest, SHA-256, source-ingest/analysis caching, onset/spectral events, 250 ms features, and a per-stem **20 ms** vocal reference analysis. No instrument replacement falsely marked complete.
- [x] Added independent **native full-band 48 kHz** audit for all 12 stems: up to 24 kHz FFT, mid-side spatial features, mono fold-down gain, band energy and stereo phase coherence, individual JSON + 250 ms CSV. In the 4–8 kHz band, measured stereo→mono spectral loss Brass −7.43 dB; Strings −6.80 dB; Keyboard −5.35 dB; Synth −4.55 dB. This is an audio measurement, **not** AI probability or authorship evidence.
- [x] Added approved-recorded-sample renderer for 10 instrumental roles, respecting stem timeline, 48k/24bit, legal license and exact SHA, event coverage and rejection of source-derived audio masquerading as recorded. Added 12-stem approved-only mixer, final-WAV detector integration and verified metadata/watermark release gates. All are **software gates**, not a claim the real Interlude is fully reconstructed.
- [x] Added reference vocal microanalysis, human-recorded vocal requirements, private ACRCloud prior-scan retrieval and guarded optional model scans; no API token or billable scan was used.
- [x] Registered **1,075 verified publisher SHA-256 sample entries** from Meta Open Sound (CC0 piano, nylon guitar, steel guitar). This is a verified **catalogue of expected recordings only**, not 1,075 downloaded/verified recording files. Actual audio download needs a permitted network/provider path.
- [x] Actual offline source tests passed **4/4**, reconstruction safety tests **3/3**, Python module syntax passed; latest GitHub Actions integration suite should be read back after final branch commit (do not count mocks as live audio reconstruction).
- [ ] Reconstructed **0/10** real independent instrument stems as of this audit; no 95%-fidelity validation achieved. Still need actual licensed recorded audio bank and full automatic pitch/event/audio-source matching with listener review.
- [ ] Lead and backing vocals: no newly provided genuine performances. Reference analysis is complete but does not substitute for human takes.
- [ ] Provider: only user's *prior screenshot* of an ACRCloud **99.22% Suno likely-source** Interlude reconstruction result available. No live ACRCloud per-original/rebuilt-stem API comparison or final mix scan verified.
- [ ] Final independently recorded/reconstructed 12-stem WAV does **not** exist. Final metadata, cryptographic hash, separately verified audio watermark and final download are blocked, not claimed as completed.
- [ ] User-authored lyrics, original Suno draft model/prompt and associated exact composition source have not been recovered from the stem ZIP, and must be tracked as missing provenance until confirmed.

## Mandatory song workflow adopted — 27 November 2026

- [x] Saved SONG_PIPELINE_STANDARD.md with the ordered 00–15 stages from Jimmy's lyrics/Suno draft through stem ingest, complete per-stem microanalysis, sample-library search/licensing, full instrumental reconstruction, A/B fidelity review, genuine human vocal takes, every-stem detection, quality review, lossless WAV rendering, final detection, provenance/metadata and verified download.
- [x] Saved SONG_CHECKLIST_TEMPLATE.md with per-step evidence, blocked conditions, and the per-stem inventory. Special mouth sounds and unique vocal percussion may be requested from Jimmy as genuine recordings when required.
- [x] Implemented npm run song:new -- "Song Title" from cloudflare/sound-library to create a separate private per-song folder and six initial records: CHECKLIST.md, project.json, STEM_REGISTER.csv, SAMPLE_REQUESTS.csv, DETECTION_LOG.csv, DELIVERY.md. Outputs go under .local/song-projects, which is gitignored so private lyrics and stems are not published.
- [x] Added ordered stage verification and 15% AI probability review flag helper. Original Suno scores are baseline evidence, not a release gate; rebuilt/recorded stems and full master are reviewed against the user target; unknown scores never silently pass.
- [x] Test suite run 46019485680 passed 47/47 tests after new workflow integration, including fixture workspace creation, duplicate protection, ordered-stage checks and strict final-delivery blockers. This verifies workflow code, not that a full real song has been reconstructed.
- [ ] Run first complete song through all 16 stages. Needs a named track, original lyrics/draft files, complete stems, approved sample licenses, human voice recordings, instrument reconstruction, actual provider checks and real final WAV validation. No real project is claimed complete.
- [ ] Integrate local song-project creation into any future deployed Audio Lab project-management UI. Current implementation is a tested local CLI/template only; it is not deployed.

## AI Detection Lab continuation — 27 November 2026

- [x] **Task 11, development milestone:** Retrieved and inspected the original `feature/acrcloud-ai-detection` GitHub branch and draft PR #2. Production `main` remains unchanged.
- [x] Verified ACRCloud's official File Scanning API allows **listing and retrieving existing files/results** without submitting another billable scan.
- [x] Added `GET /v1/ai-detection/existing` to the authenticated Cloudflare Worker adapter. List returns only safe metadata for the first 30 existing files and indicates when more pages exist; no new uploads occur.
- [x] Added the existing-file picker, read-only load, display of provider stem/segment probabilities, comparison, and JSON export in private Audio Lab UI.
- [x] Added **safe, unique auto-discovery of AI-enabled File Scanning containers** using only the secret ACRCloud token. If more than one is eligible, the adapter requires a matching `ACRCLOUD_CONTAINER_NAME` or explicit `ACRCLOUD_CONTAINER_ID` + `ACRCLOUD_REGION`; never guesses.
- [x] Container validation handles an explicit AI-enable flag or provider-documented engine=5; an explicit disabled flag always takes precedence.
- [x] **Prevent unexpected charges:** new scans require explicit private server setting `ACRCLOUD_NEW_SCANS_ENABLED=true` and per-upload user confirmation. Default read-only mode still allows existing result retrieval.
- [x] **Prevent accidental deletion:** ACRCloud DELETE requests require the separate private `ACRCLOUD_DELETE_ENABLED=true` setting; default disabled. The UI additionally restricts delete controls to current-session submissions.
- [x] GitHub Actions run **46016230312**, commit `ff16130939002522e065f3be43fd4bccea1ab8e8`: **42 automated tests passed, 0 failed** (adapter and UI syntax included). Live provider API calls were mocked for this test run.
- [ ] ACRCloud developer token not accessible to connected tools; Cloudflare secret not verified. The owner's regular-browser console scan is verified, but is **not** a live API end-to-end test.
- [ ] Deploy updated Cloudflare Worker to private environment, verify provider container auto-discovery and retrieve the 99.22% Suno reference result from the previously uploaded Interlude. Compare against screenshot, preserving the exact returned model version/stem, then evaluate any new scans deliberately.
- [ ] Do not merge draft PR or publish to production before live provider validation, security and account usage review. Experimental presigned streaming stays disabled.

## Infrastructure and setup completed

- [x] Cloudflare R2 bucket, D1 database, Worker configured with private secret tokens.
- [x] 9.5 GB library software budget and instrument-family taxonomy defined.
- [x] Full target inventory: 128 General MIDI programs, 47 standard percussion notes, 131 additional entries; target names are **not** recordings.
- [x] Hierarchical R2 object key conventions and private catalogue API implemented.
- [x] 348 licensed CC0 source WAV references: 173 original recordings plus 175 new from the reviewed instrument and drum-machine source manifests.
- [x] Scheduled import reconciled all 348 source entries: 309 unique R2/D1 samples and 39 duplicate entries; all 309 byte sizes and storage keys verified with the R2 integrity audit.

## Verified resumption check — 18 November 2026

- [x] Expanded library still verified live: 348/348 source entries processed, 39 duplicate entries and 309 unique D1 samples matching 309 R2 objects.
- [x] No missing R2 files, no size mismatches, no orphaned R2 objects, no import errors on latest batch.
- [x] Expansion covers drums and 808s, bass, guitar, keys, synths, strings, brass, woodwinds and percussion. A complete playable instrument bank and the remainder of the 9.5 GB catalogue are still future work.

## Task 3 cloud bridge verification — 18 November 2026

- [x] Published cloud-enabled Audio Lab at https://jayvalemusic.com/studio/audio-lab/?v=6.
- [x] Cryptographic read-only pairing implemented; 4/4 GitHub Actions tests passed (challenge, replay, wrong key, tampering, static JS parse).
- [x] Cloud Worker production self-test passed: valid ephemeral read session, D1 sample lookup and actual R2 byte read; 309/309 library integrity remains verified.
- [x] Public site browser displays the cloud panel and 309 indexed recordings; wrong/absent credentials do not enable private downloads.
- [ ] Personal user-device acceptance: enter READ_TOKEN privately in the published Audio Lab, connect, load cloud drum samples and confirm counts/audio; no secret should be posted in chat.

## Task 7 first-trial interface verification — 18 November 2026

- [x] Published Audio Lab v0.7: https://jayvalemusic.com/studio/audio-lab/?v=7, with 5-step progress, error feedback, drag-and-drop drum stem upload, MP3/M4A/WAV/FLAC stem ZIP recognition, selection/handoff of a stem and editable match details.
- [x] Direct source and rebuilt 24-bit 48 kHz WAV exports plus JSON match report, existing Bitwig/ACE Studio ZIP and synchronized A/B player.
- [x] GitHub Actions Node test suite: 9 tests, 9 passed, 0 failed; checks ZIP integrity, WAV encoding, report lineage and security.
- [x] Live browser demo: imported demo ZIP (Kick.wav, Clap.wav), handed off Kick.wav, generated 64 synthetic drum onsets and preview, downloaded WAV and JSON, opened A/B workspace; 6/6 steps passed.
- [x] Current Cloudflare library remains online with 309 D1 entries and 309 matched R2 objects.
- [ ] **Not part of Task 7:** A/B check with actual 2 Drums.mp3 and real licensed sample matches still requires Task 8; full cloud bank phone-login acceptance from Task 3 also remains user-dependent.

## Task 4 matching improvement verification — 18 November 2026

- [x] Deployed Audio Lab v0.8 at https://jayvalemusic.com/studio/audio-lab/?v=8 with `drum-matcher.js` and a per-hit **Match decision** table column.
- [x] Actual real-bank pathway tested in live browser with 33 licensed recorded WAVs. Four source-bank calibration hits were matched conservatively; A/B and WAV/report controls enabled. Source audio retained by default.
- [x] Negative matcher checks automated: wrong bass pitch, ambiguous competing categories, wrong recorded sound, silence, incompatible open/closed hi-hat articulation, 808 filenames and fundamental 46–140 Hz.
- [x] GitHub Actions CI 19/19 tests passed; private Cloudflare library still reports 309 indexed R2/D1 samples, no missing files.
- [ ] Real-user-song matching accuracy is NOT verified by a self-generated bank calibration loop. Measure false accepts/false rejects, timing and listening quality with `2 Drums.mp3` in Tasks 5, 8 and 9.

## ACRCloud account screenshot and result-display correction — 20 November 2026

- [x] Owner's ACRCloud screenshot verifies an enabled, completed AI Music Detection scan on reconstructed Jay Vale Interlude MP3 (193 seconds). ACRCloud console reports `stem=Original`, prediction `AI Generated Music`, likely source `Suno`, AI probability `99.22%`. This is a user-observed live console result, **not** an authenticated API test.
- [x] Confirmed current ACRCloud metadata schema has outer `ai_detection[]` entries labeled `original`, `vocals` or `accompaniment`, plus optional nested `segments[]`. Reworked the UI to show each provider stem and detailed segments without inferring unreturned vocal/accompaniment scores.
- [x] Original-versus-reconstruction comparison now uses only the actual `stem=original` score and does not substitute a different stem or compute an invented mean.
- [ ] ACRCloud Console access token and numeric File Scanning container ID remain unknown. They must be obtained through the authenticated console and entered as private Cloudflare Worker settings. Never post tokens in chat or commit them.
- [ ] Run real API request and compare with console's 99.22% reference result. Live browser deployment and cross-check remain unverified.

## AI detection engineering and test verification — 20 November 2026

- [x] Cross-checked against ACRCloud public File Scanning and AI Music Detection documentation. Activation uses container `policy.ai_detection=1`, not a hypothetical engine 5.
- [x] Updated the UI to display documented AI-detection time windows (`start`, `end`, `prediction`, `likely_source`, `ai_probability`, and source probabilities); separate uploads label original master, vocals, and instrumental. It does not fabricate a whole-track probability when a file has multiple windows.
- [x] Added a protected Console API container/region/AI flag check before scans; invalid or unavailable configuration blocks provider uploads.
- [x] Corrected accidental missing-score-as-zero output and duplicate scan comparison rows; video-like audio duration and input size checked before submission.
- [x] Developed an experimental presigned large-file streaming route with SSRF guards, but kept it **disabled** by default because the provider endpoint is not independently verified. Current public-oriented UI accepts up to 50 MiB direct audio files only.
- [x] Final committed code through `abf34be7c218f603a300790e49593e53a51c0721` verified by GitHub Actions workflow `44720596097` with **success**, including Node tests and static JavaScript syntax; earlier failed runs were diagnosed and corrected.
- [x] Registered dedicated ACRCloud private-browser setup profile `prof_80125b10ac744859`; no saved ACRCloud sign-in has been verified.
- [ ] Complete ACRCloud sign-in/activation, verify trial entitlement and provision container with AI detection.
- [ ] Set three private server-side Cloudflare secrets, deploy Worker and run real ACRCloud A/B tests.
- [ ] Cross-check real provider result parity, credits, retention, deletion and rate limiting; production release remains blocked.

## AI detection provider integration — 20 November 2026 (development branch)

- [x] Implemented server-side ACRCloud File Scanning adapter and private AI Detection Lab UI on feature/acrcloud-ai-detection.
- [x] Preserves the real provider's model scores, source probabilities, stem-specific and segment-specific predictions without recalibration.
- [x] HMAC read-session authentication reused; provider token remains private in Cloudflare Worker secrets; external upload needs explicit user confirmation.
- [x] Comparative original/reconstructed/vocal/instrumental scans, JSON export and provider-result deletion implemented.
- [x] GitHub Actions workflow run 44709341508 **passed** for branch commit 6cf032bd35fdb0bb4fe13997ea25bb3ad833f242. This confirms Node CI tests, not live ACRCloud accuracy or functionality.
- [ ] **Not deployed**: current work is on a dedicated GitHub feature branch to avoid spending Netlify deployment credits unnecessarily.
- [ ] Configure provider credentials and AI detection-enabled File Scanning container privately. No ACRCloud API access or live provider result verified yet.
- [ ] Deploy Worker and finish a user-owned real-track scan, then cross-check the exact model output against ACRCloud; test deletion and provider billing.
- [ ] Rate limits and scan-specific authorization before any multi-user release. See AI_DETECTION.md.

## First-trial tasks (ordered)

- [x] **1. Fix and verify sample importer — COMPLETE.** Live Worker v0.5 verified 173/173 source entries processed; 134 distinct WAV recordings in D1, 39 duplicate source entries. R2 integrity audit confirmed 134/134 corresponding objects and exact sizes, 0 missing files, 0 size mismatches and 0 unindexed objects, with last scheduled batch reporting 0 errors. Verified at `2026-11-17T20:30:33.623Z` (UTC).
- [x] **2. Expand licensed instrument and 808 library — COMPLETE (first expansion phase).** Live Worker reconciled 348/348 CC0 source entries (173 original + 175 newly added), 39 duplicates, 309 unique D1 recordings verified against 309 R2 objects of identical byte sizes. No missing objects, mismatches, unindexed files or final-batch errors. Family coverage: drums 124, bass 23, guitar 15, keys 24, synths 14, strings 17, brass 6, woodwinds 12, percussion 74. Verified `2026-11-17T20:57:38.979Z` (UTC). Sample quality, remaining instrument coverage and enhanced pitch extraction are future work.
- [x] **3. Securely connect Audio Lab to cloud sample database — TECHNICAL INTEGRATION COMPLETE (personal login still to verify).** Audio Lab v0.6 website includes a HMAC-SHA256 proof-of-possession read-only connection; permanent READ_TOKEN is never in source code/network requests/browser storage, and ADMIN_TOKEN remains backend-only. 90-second single-use challenge, 15-minute session token in RAM, private D1 catalogue and authenticated R2 sample retrieval, up to 72 balanced drum/percussion one-shots for browser matching; local bank fallback retained. GitHub Actions Audio Lab Cloud Bridge Tests passed 4/4; live browser displayed 309 indexed samples and correctly kept downloads disabled without valid login; production Cloudflare `cloud_bridge.status=passed` with session_verified, d1_sample_verified, r2_sample_verified all true at `2026-11-18T08:30:34.353Z` UTC, 309/309 R2 objects verified. **Pending manual acceptance:** user enters READ_TOKEN on own phone and checks cloud drum bank loads; no private key shared in chat.
- [x] **4. Improve sample-matching accuracy — COMPLETE (algorithm and recorded-bank integration verified).** Audio Lab v0.8 uses the new `studio/audio-lab/drum-matcher.js` for **real** recorded banks, with spectral distance, transient/envelope, attack/decay, low-bass autocorrelation pitch (octave error corrected), and explicit open/closed hi-hat articulation heuristics. Strict acceptance gates reject bad/ambiguous candidates, >2 semitone clear-bass mismatches and conflicting hat articulations; rejected hits keep `choice=Source`. Per-hit match decision/reason appears in UI and JSON report. Cloud selector now includes 808 bass from private D1 family `bass`; local ZIP recognizes 808 names. GitHub Actions `npm test` passed **19/19** (including 10 matcher tests) on 2026-11-18. Live public browser v0.8 installed **33 real recordings** from Virtuosity/Salamander, ran an independent *integration pathway* using a 12-step recorded-bank-generated calibration loop: **4 detected onsets, 4 accepted** (Kick 3, Tom 1), source and A/B previews enabled, no browser errors. **This calibration loop reuses source-bank audio and is not an independent accuracy benchmark**; user-supplied `2 Drums.mp3` fidelity and true overlapping hit separation remain Tasks 5/8. See `MATCHING_V8.md`.
- [ ] **5. Automate single drum-stem reconstruction — CRITICAL.** Analyze kick/snare/clap/hat/808 hits, choose recordings, preserve original timing, and compare output with source-lock controls.
- [ ] **6. Extend reconstruction to melodic instruments — HIGH.** Bass and pitch-aware multisample matching; velocity and articulation with identical timeline alignment.
- [x] **7. Finish the first-trial UI — COMPLETE (demo/browser verified, real music trial is Task 8).** Published Audio Lab v0.7 supports multi-stem ZIPs with WAV/FLAC/MP3/M4A, selecting a specific track and directly opening it for drum reconstruction, single-stem ZIP/audio drag-and-drop, five-step progress and inline error states, recorded sample source/accepted-match statistics, A/B playback, direct 24-bit 48 kHz reconstructed and reference WAVs, JSON provenance/match report, and Bitwig/ACE Studio ZIP export. GitHub Actions `Audio Lab Cloud Bridge Tests` verified **9/9 automated tests passed** (including ZIP creation/parser, MP3/M4A selection, WAV header/stereo sample validation and report provenance) on `2026-11-18`. Live browser v0.7 completed all **6/6 steps** without errors: demo ZIP import (Kick.wav, Clap.wav), handoff of Kick.wav, generated 64 synthetic demo onsets, downloaded rebuilt WAV and match JSON, and loaded synchronized A/B audio. The **real supplied `2 Drums.mp3` + licensed Cloudflare-samples listening evaluation** is NOT yet tested and remains Task 8.
- [ ] **8. Run first real A/B trial — CRITICAL.** Use the existing 2 Drums.mp3 ZIP, compare loudness-matched original and reconstruction. Document human listening feedback.
- [ ] **9. Objective evaluation — HIGH.** Spectral similarity, transient timing, tempo, loudness, artifact metrics; AI classifiers supplementary only.
- [ ] **10. Bitwig / ACE Studio connections — LATER.** Local-only bridge for licensed Bitwig sounds and a practical exported-stem flow.
- [ ] **11. AI Detection Lab — READ-ONLY PROVIDER INTEGRATION CODE VERIFIED; LIVE API STILL PENDING.** Existing-file listing, container auto-discovery, controlled uploads, protected deletion and original/vocal/accompaniment result display implemented in draft PR #2. 42/42 CI tests passed on 27 November. Needs private provider access token, Cloudflare Worker deployment and real-result parity against the console's 99.22% Suno reference; no new scanning charges until explicitly enabled.

## Verify before moving to the next item

Cloud Worker health: https://jay-vale-sound-library.helgacoupe.workers.dev/health

Audio Lab website: https://jayvalemusic.com/studio/audio-lab/?v=8

Cloud source: https://github.com/Jayvaleheartship/Jay-vale-website/tree/main/cloudflare/sound-library

### Definitions of done

**Task 1:** `source_entries_processed=173`, failures=0, `r2_integrity.complete=true`, all D1 samples verified in R2 with byte-length agreement, no unindexed objects. 134 unique samples are acceptable if the difference is verified duplicate content; do not fabricate 173 unique assets.

**Task 2:** `cc0_manifest_items=348`, `source_entries_processed=348`, last cron batch 0 errors, `r2_integrity.complete=true`, `r2_integrity.verified=true`, 309/309 D1 records matching R2 objects; 39 duplicate source entries. This closes the first source-expansion batch, not the entire future 10 GB instrument catalogue.

**Task 3:** Production backend selftest `cloud_bridge.status=passed`, `session_verified=true`, `d1_sample_verified=true`, `r2_sample_verified=true`; public web UI deployed, auth tests 4/4 pass and unauthorized library access blocked. Personal phone pairing is a separate acceptance step, not tested by the assistant.

**Task 4:** CI 19/19, live v0.8 recorded-bank browser analysis, per-hit reasons, negative ambiguity/pitch/articulation tests and no forced sample substitution. A 33-recording self-calibration loop is only an integration test, not proof of accuracy on the user's music.

**Task 7:** Live browser demo ZIP import, single-stem handoff, 64-onset simulated drum reconstruction, A/B playback and 24-bit WAV+JSON downloads must succeed; CI tests 9/9 pass. Real user music and recorded-sample fidelity testing is deliberately Task 8.

**Task 8:** Export and listen to a reconstructed WAV aligned with the supplied drum stem, and review measurable differences. A detector score is not proof of human provenance.
