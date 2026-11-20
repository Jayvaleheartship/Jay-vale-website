# Jay Vale Audio Lab — First-Trial Checklist

Updated 18 November 2026 after Audio Lab v0.8 production verification, Task 5 offline reconstruction self-audit and 38/38 tests (Netlify credit freeze). For **every to-do task**: complete the work, verify the outcome, update this saved checklist immediately, display the revised task list, and let the user choose the next item. Never mark a task complete from code commits alone.

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


## Task 5 offline development and Netlify credit freeze — 18 November 2026

- [x] Created **non-production** GitHub branch [audio-lab/task5-offline-20261118](https://github.com/Jayvaleheartship/Jay-vale-website/tree/audio-lab/task5-offline-20261118); `main` and the published Audio Lab v0.8 were left unchanged.
- [x] Added `JVDrumMatcher.detectOnsets()` (adaptive 5 ms RMS + high-frequency novelty, 32 ms minimum spacing), separate-channel energy for stereo anti-phase safety, and absolute-sample timestamp retention.
- [x] Integrated adaptive onset detection into recorded-bank drum analysis, without changing the deterministic demo pathway; anti-phase stereo downmix safety and JSON report detector lineage added.
- [x] Offline fixture checks cover kick, high-frequency hats, 808, 40 ms flams, simple overlap, anti-phase stereo, silence, invalid channel lengths, source-locked rejected hits and accepted layered hits.
- [x] **GitHub Actions on offline branch:** 26 tests passed, 0 failed, current verified run [44374924086](https://github.com/Jayvaleheartship/Jay-vale-website/actions/runs/44374924086), commit `2468843def`. Earlier failed test-harness runs were corrected.
- [x] **First actual user audio offline detector pass (no cloud credentials):** existing private Library upload `2 Drums.mp3`, 4,255,436 bytes, decoded stereo PCM at 48 kHz to **193.104 seconds**. Its MP3 header made `ffprobe` estimate **844.226 seconds**; actual complete decoding gives the correct ~3:13 duration, within the app's 240-second decoded limit. A successful browser import is NOT yet claimed.
- [x] On that real recording, legacy 60 ms onset code produced **437 possible hits**; adaptive 32 ms code produced **773 possible hits** including **168 intervals under 60 ms**. These are *candidate counts*, not verified true-hit detections; higher count is not proof of better precision. No user audio file was committed or uploaded.
- [x] **Long-stem memory improvement:** source-locked renderer now allocates separated audio buffers only for drum groups with applied layers, instead of preallocating all silent groups. Regression checks verify empty group map when retaining original and one group for one accepted kick. Larger real-bank and browser memory stress tests are still open.
- [ ] **Task 5 is NOT complete:** the real `2 Drums.mp3` received an offline onset pass, but hit correctness, recorded-bank matching, A/B listening quality, mobile memory stress, and published-browser acceptance remain unverified. Do not claim matching accuracy or 95% audio similarity from fixture tests or onset counts.
- [ ] No published browser check for this new branch. **Netlify account credits are exhausted until 16 December 2026 according to the user.** Do not merge to `main`, start Netlify builds, trigger deploy previews or spend additional Netlify credits during the freeze. Branch commits use `[skip netlify]`; this does NOT change account settings or guarantee builds are stopped in the Netlify dashboard.
- [ ] Netlify build status must be set to **Stopped builds** in the Netlify project's build settings for an account-level guarantee; this has not been changed or verified by this assistant. The main website may be hosted independently; no claim is made about Netlify-hosted site availability.

## Task 5 frequency, timbre and reconstruction self-check — 18 November 2026

- [x] Added offline `drum-audit.js` source-reference validator. It measures original-vs-rebuild hit envelope/attack, decay length (or marks overlapping tails unknown), coarse three-band frequency balance, waveform correlation, dB level, whole-file channel/frame alignment and newly introduced clipping.
- [x] Implemented safety loop: on clearly failed measured checks, automatically selected recorded layers are reverted to `Source` before re-render; manual edits are never silently reverted; severe unresolved findings block rebuilt exports while diagnostic A/B playback and original export remain available.
- [x] The UI shows quality status and a hit-by-hit table; JSON/ZIP reports preserve provenance, quality summary and automatic reverts. This is **not** a measured 95% audible-similarity guarantee.
- [x] **38/38 GitHub Actions Node tests pass** including 12 new self-check tests. Verified branch run [44382075486](https://github.com/Jayvaleheartship/Jay-vale-website/actions/runs/44382075486). Dedicated documentation: [SELF_CHECK_V1.md](SELF_CHECK_V1.md).
- [x] Actual **`2 Drums.mp3`** offline source measurement: 48 kHz, stereo, 193.104 seconds after decoding, 773 candidate transients; attack p10/median/p90 0/5/25 ms; 396 measurable nontruncated durations p10/median/p90 20/55/165 ms; **377 durations unresolved** because following hits or the 180 ms window truncate the tail. These statistics are **not** a verified hit-type or true-positive accuracy score. No private audio uploaded to GitHub.
- [ ] Full user-song reconstruction through licensed recorded-bank browser workflow, listening-based acceptance, mobile performance and false-positive/negative analysis remain open. No production deployment is authorized while the stated Netlify credits are depleted until 16 December.

## Actual user's drum ZIP — offline reconstruction and exported-MP3 self-check (18 November 2026)

- [x] User-supplied `Jay_Vale_Drums_Stem.zip` inspected: one `2 Drums.mp3`, 4,255,436 bytes, SHA-256 `614fe9709f7910b0309e78421c73963295d09262eae5bff4f75bd32a884cd704`. No independent recorded sample bank is inside this ZIP. No private audio was uploaded to the public repository.
- [x] Used previously measured stereo PCM (48 kHz, 193.104 s) and source-derived isolated drum transients to build an explicitly labeled **source-locked, self-sampled reconstruction pilot**. Matched 554 candidate onsets from 773 candidates; after automatic source-reference self-check, **539 added layers retained** and **15 reverted**. This is not full individual-instrument human recorded rebuilding and not the private Cloudflare sample-bank acceptance.
- [x] Re-encoded a decoded-source reference MP3 and a separate reconstructed MP3 at **320 kbps, stereo, 48 kHz** (MP3 source header previously gave unreliable duration). Both MP3 exports were independently decoded and verified as exactly **9,268,992 samples per channel = 193.104 s**. Hashes differ, and waveforms are non-identical.
- [x] Exported MP3 waveform correlation: **0.9900247**; reconstruction residual level relative to original **-16.83 dB**; RMS level change before MP3 encoding **+0.171 dB**; **0 newly clipped samples**. These establish measurable similarity and technical integrity, NOT independently verified listening quality, human authorship, or a universal 99% perceptual-fidelity claim.
- [x] Exported private report `Jay_Vale_Drums_Reconstruction_Selfcheck.json` and both MP3s as downloadable conversation files; **not committed to GitHub**.
- [ ] **User listening acceptance pending:** compare original vs source-locked trial, report specific hit times that sound worse/better. Then run full real one-shot library replacement and identical QC. Task 5 remains **IN PROGRESS**, Task 8 remains **OPEN**.
- [x] No Netlify deployment, no merge to `main`. Existing non-production GitHub branch retained.

## First-trial tasks (ordered)

- [x] **1. Fix and verify sample importer — COMPLETE.** Live Worker v0.5 verified 173/173 source entries processed; 134 distinct WAV recordings in D1, 39 duplicate source entries. R2 integrity audit confirmed 134/134 corresponding objects and exact sizes, 0 missing files, 0 size mismatches and 0 unindexed objects, with last scheduled batch reporting 0 errors. Verified at `2026-11-17T20:30:33.623Z` (UTC).
- [x] **2. Expand licensed instrument and 808 library — COMPLETE (first expansion phase).** Live Worker reconciled 348/348 CC0 source entries (173 original + 175 newly added), 39 duplicates, 309 unique D1 recordings verified against 309 R2 objects of identical byte sizes. No missing objects, mismatches, unindexed files or final-batch errors. Family coverage: drums 124, bass 23, guitar 15, keys 24, synths 14, strings 17, brass 6, woodwinds 12, percussion 74. Verified `2026-11-17T20:57:38.979Z` (UTC). Sample quality, remaining instrument coverage and enhanced pitch extraction are future work.
- [x] **3. Securely connect Audio Lab to cloud sample database — TECHNICAL INTEGRATION COMPLETE (personal login still to verify).** Audio Lab v0.6 website includes a HMAC-SHA256 proof-of-possession read-only connection; permanent READ_TOKEN is never in source code/network requests/browser storage, and ADMIN_TOKEN remains backend-only. 90-second single-use challenge, 15-minute session token in RAM, private D1 catalogue and authenticated R2 sample retrieval, up to 72 balanced drum/percussion one-shots for browser matching; local bank fallback retained. GitHub Actions Audio Lab Cloud Bridge Tests passed 4/4; live browser displayed 309 indexed samples and correctly kept downloads disabled without valid login; production Cloudflare `cloud_bridge.status=passed` with session_verified, d1_sample_verified, r2_sample_verified all true at `2026-11-18T08:30:34.353Z` UTC, 309/309 R2 objects verified. **Pending manual acceptance:** user enters READ_TOKEN on own phone and checks cloud drum bank loads; no private key shared in chat.
- [x] **4. Improve sample-matching accuracy — COMPLETE (algorithm and recorded-bank integration verified).** Audio Lab v0.8 uses the new `studio/audio-lab/drum-matcher.js` for **real** recorded banks, with spectral distance, transient/envelope, attack/decay, low-bass autocorrelation pitch (octave error corrected), and explicit open/closed hi-hat articulation heuristics. Strict acceptance gates reject bad/ambiguous candidates, >2 semitone clear-bass mismatches and conflicting hat articulations; rejected hits keep `choice=Source`. Per-hit match decision/reason appears in UI and JSON report. Cloud selector now includes 808 bass from private D1 family `bass`; local ZIP recognizes 808 names. GitHub Actions `npm test` passed **19/19** (including 10 matcher tests) on 2026-11-18. Live public browser v0.8 installed **33 real recordings** from Virtuosity/Salamander, ran an independent *integration pathway* using a 12-step recorded-bank-generated calibration loop: **4 detected onsets, 4 accepted** (Kick 3, Tom 1), source and A/B previews enabled, no browser errors. **This calibration loop reuses source-bank audio and is not an independent accuracy benchmark**; user-supplied `2 Drums.mp3` fidelity and true overlapping hit separation remain Tasks 5/8. See `MATCHING_V8.md`.
- [ ] **5. Automate single drum-stem reconstruction — CRITICAL; IN PROGRESS OFFLINE.** Adaptive-onset detector plus real recorded-stem profiling, timbre/attack/decay/level/waveform/clipping self-check, automatic source fallback and export safety gate implemented on `audio-lab/task5-offline-20261118`. **38/38 CI passed**; offline `2 Drums.mp3` study found 773 candidate onsets, 396 resolved duration windows and 377 deliberately unknown durations. Actual private drum-ZIP tested offline with same-song recorded-hit source-lock: 539 layers applied, 15 reverted by QC; both 320 kbps MP3 exports decoded frame-aligned, 0 new clips. **Independent CC0/Cloudflare bank matching, human listening review, mobile stress testing and safe future publication remain outstanding.** Not complete.
- [ ] **6. Extend reconstruction to melodic instruments — HIGH.** Bass and pitch-aware multisample matching; velocity and articulation with identical timeline alignment.
- [x] **7. Finish the first-trial UI — COMPLETE (demo/browser verified, real music trial is Task 8).** Published Audio Lab v0.7 supports multi-stem ZIPs with WAV/FLAC/MP3/M4A, selecting a specific track and directly opening it for drum reconstruction, single-stem ZIP/audio drag-and-drop, five-step progress and inline error states, recorded sample source/accepted-match statistics, A/B playback, direct 24-bit 48 kHz reconstructed and reference WAVs, JSON provenance/match report, and Bitwig/ACE Studio ZIP export. GitHub Actions `Audio Lab Cloud Bridge Tests` verified **9/9 automated tests passed** (including ZIP creation/parser, MP3/M4A selection, WAV header/stereo sample validation and report provenance) on `2026-11-18`. Live browser v0.7 completed all **6/6 steps** without errors: demo ZIP import (Kick.wav, Clap.wav), handoff of Kick.wav, generated 64 synthetic demo onsets, downloaded rebuilt WAV and match JSON, and loaded synchronized A/B audio. The **real supplied `2 Drums.mp3` + licensed Cloudflare-samples listening evaluation** is NOT yet tested and remains Task 8.
- [ ] **8. Run first real A/B trial — CRITICAL.** Use the existing 2 Drums.mp3 ZIP, compare loudness-matched original and reconstruction. Document human listening feedback.
- [ ] **9. Objective evaluation — HIGH.** Spectral similarity, transient timing, tempo, loudness, artifact metrics; AI classifiers supplementary only.
- [ ] **10. Bitwig / ACE Studio connections — LATER.** Local-only bridge for licensed Bitwig sounds and a practical exported-stem flow.

## Full-song reconstruction workstream — 20 November 2026

**Design accepted as a proposed next phase; not built or deployed.** See [FULL_SONG_RECONSTRUCTION_PLAN.md](FULL_SONG_RECONSTRUCTION_PLAN.md). A full uploaded stem ZIP is the input to the first complete-song test. Existing tasks 5, 6, 8 and 9 remain prerequisites; do not conflate the previous self-sampled drum pilot with independent instrument reconstruction.

- [ ] **11. Persistent whole-song ZIP projects.** Validate and decode complete aligned stems, immutable original hash inventory, fixed timeline, mono/stereo analysis, reusable `projects/<project_id>/` path, resumable manifests and private storage policy.
- [ ] **12. Layer discovery across every stem.** Drums/bass/polyphonic pitched instruments/vocals/effects classification, note/onset articulation analysis, uncertain/unknown labels and editable review.
- [ ] **13. Demand-driven sample gap queue and legal sourcing.** Search current 309-recording R2 bank first, generate missing instrument/pitch/velocity/articulation list, review CC0/license for each new source, deduplicate by hash, import only through authorized admin backend, reconcile D1/R2 and monitor 9.5GB soft cap.
- [ ] **14. Full-stem sample reconstruction and original-time mixdown.** Reuse measured drum system, implement polyphonic multisample matching, source/hybrid fallback, preserve vocals and stereo effects as appropriate; export independent stems, MIDI-like events and full WAV/master without changing timing.
- [ ] **15. Full-song source-reference self-audit and A/B listening.** Event/stem/master spectral, pitch, attack/decay, alignment, clipping, distortion, residuals and transparent provenance shares; measure and listen to actual user material, log bad segments, auto-revert unsafe choices.
- [ ] **16. External music/voice detector evaluation.** Test exported originals/hybrids/rebuilds only with genuine provider output; record model, content type, result, uncertainty and file hashes. An AI detector score is not proof of human authorship.
- [x] **Planning record only:** new detailed spec committed on development branch. No tests claimed for unbuilt work; no production branch merge, Cloudflare write or Netlify deploy.

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
