# Jay Vale Audio Lab — First-Trial Checklist

Updated 18 November 2026 after Audio Lab v0.8 production verification and Task 5 offline branch CI (Netlify credit freeze). For **every to-do task**: complete the work, verify the outcome, update this saved checklist immediately, display the revised task list, and let the user choose the next item. Never mark a task complete from code commits alone.

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
- [x] **GitHub Actions on offline branch:** 26 tests passed, 0 failed, run [44373919160](https://github.com/Jayvaleheartship/Jay-vale-website/actions/runs/44373919160), commit `ee5b684d1`. Earlier failed runs were corrected; only the latest complete passing run is evidence.
- [ ] **Task 5 is NOT complete:** real `2 Drums.mp3` timing/onset false positives, dense overlapping hits, long-stem performance and human listening quality remain unverified. Do not claim match accuracy or 95% audio similarity from fixture tests.
- [ ] No published browser check for this new branch. **Netlify account credits are exhausted until 16 December 2026 according to the user.** Do not merge to `main`, start Netlify builds, trigger deploy previews or spend additional Netlify credits during the freeze. Branch commits use `[skip netlify]`; this does NOT change account settings or guarantee builds are stopped in the Netlify dashboard.
- [ ] Netlify build status must be set to **Stopped builds** in the Netlify project's build settings for an account-level guarantee; this has not been changed or verified by this assistant. The main website may be hosted independently; no claim is made about Netlify-hosted site availability.

## First-trial tasks (ordered)

- [x] **1. Fix and verify sample importer — COMPLETE.** Live Worker v0.5 verified 173/173 source entries processed; 134 distinct WAV recordings in D1, 39 duplicate source entries. R2 integrity audit confirmed 134/134 corresponding objects and exact sizes, 0 missing files, 0 size mismatches and 0 unindexed objects, with last scheduled batch reporting 0 errors. Verified at `2026-11-17T20:30:33.623Z` (UTC).
- [x] **2. Expand licensed instrument and 808 library — COMPLETE (first expansion phase).** Live Worker reconciled 348/348 CC0 source entries (173 original + 175 newly added), 39 duplicates, 309 unique D1 recordings verified against 309 R2 objects of identical byte sizes. No missing objects, mismatches, unindexed files or final-batch errors. Family coverage: drums 124, bass 23, guitar 15, keys 24, synths 14, strings 17, brass 6, woodwinds 12, percussion 74. Verified `2026-11-17T20:57:38.979Z` (UTC). Sample quality, remaining instrument coverage and enhanced pitch extraction are future work.
- [x] **3. Securely connect Audio Lab to cloud sample database — TECHNICAL INTEGRATION COMPLETE (personal login still to verify).** Audio Lab v0.6 website includes a HMAC-SHA256 proof-of-possession read-only connection; permanent READ_TOKEN is never in source code/network requests/browser storage, and ADMIN_TOKEN remains backend-only. 90-second single-use challenge, 15-minute session token in RAM, private D1 catalogue and authenticated R2 sample retrieval, up to 72 balanced drum/percussion one-shots for browser matching; local bank fallback retained. GitHub Actions Audio Lab Cloud Bridge Tests passed 4/4; live browser displayed 309 indexed samples and correctly kept downloads disabled without valid login; production Cloudflare `cloud_bridge.status=passed` with session_verified, d1_sample_verified, r2_sample_verified all true at `2026-11-18T08:30:34.353Z` UTC, 309/309 R2 objects verified. **Pending manual acceptance:** user enters READ_TOKEN on own phone and checks cloud drum bank loads; no private key shared in chat.
- [x] **4. Improve sample-matching accuracy — COMPLETE (algorithm and recorded-bank integration verified).** Audio Lab v0.8 uses the new `studio/audio-lab/drum-matcher.js` for **real** recorded banks, with spectral distance, transient/envelope, attack/decay, low-bass autocorrelation pitch (octave error corrected), and explicit open/closed hi-hat articulation heuristics. Strict acceptance gates reject bad/ambiguous candidates, >2 semitone clear-bass mismatches and conflicting hat articulations; rejected hits keep `choice=Source`. Per-hit match decision/reason appears in UI and JSON report. Cloud selector now includes 808 bass from private D1 family `bass`; local ZIP recognizes 808 names. GitHub Actions `npm test` passed **19/19** (including 10 matcher tests) on 2026-11-18. Live public browser v0.8 installed **33 real recordings** from Virtuosity/Salamander, ran an independent *integration pathway* using a 12-step recorded-bank-generated calibration loop: **4 detected onsets, 4 accepted** (Kick 3, Tom 1), source and A/B previews enabled, no browser errors. **This calibration loop reuses source-bank audio and is not an independent accuracy benchmark**; user-supplied `2 Drums.mp3` fidelity and true overlapping hit separation remain Tasks 5/8. See `MATCHING_V8.md`.
- [ ] **5. Automate single drum-stem reconstruction — CRITICAL; IN PROGRESS OFFLINE.** Adaptive transient detection and timestamp/source-lock regression checks implemented on a non-production branch (26/26 CI passing). Still requires a real-song trial with `2 Drums.mp3`, overlap/error analysis, listening comparison and a safe future publish. Do not mark complete.
- [ ] **6. Extend reconstruction to melodic instruments — HIGH.** Bass and pitch-aware multisample matching; velocity and articulation with identical timeline alignment.
- [x] **7. Finish the first-trial UI — COMPLETE (demo/browser verified, real music trial is Task 8).** Published Audio Lab v0.7 supports multi-stem ZIPs with WAV/FLAC/MP3/M4A, selecting a specific track and directly opening it for drum reconstruction, single-stem ZIP/audio drag-and-drop, five-step progress and inline error states, recorded sample source/accepted-match statistics, A/B playback, direct 24-bit 48 kHz reconstructed and reference WAVs, JSON provenance/match report, and Bitwig/ACE Studio ZIP export. GitHub Actions `Audio Lab Cloud Bridge Tests` verified **9/9 automated tests passed** (including ZIP creation/parser, MP3/M4A selection, WAV header/stereo sample validation and report provenance) on `2026-11-18`. Live browser v0.7 completed all **6/6 steps** without errors: demo ZIP import (Kick.wav, Clap.wav), handoff of Kick.wav, generated 64 synthetic demo onsets, downloaded rebuilt WAV and match JSON, and loaded synchronized A/B audio. The **real supplied `2 Drums.mp3` + licensed Cloudflare-samples listening evaluation** is NOT yet tested and remains Task 8.
- [ ] **8. Run first real A/B trial — CRITICAL.** Use the existing 2 Drums.mp3 ZIP, compare loudness-matched original and reconstruction. Document human listening feedback.
- [ ] **9. Objective evaluation — HIGH.** Spectral similarity, transient timing, tempo, loudness, artifact metrics; AI classifiers supplementary only.
- [ ] **10. Bitwig / ACE Studio connections — LATER.** Local-only bridge for licensed Bitwig sounds and a practical exported-stem flow.

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
