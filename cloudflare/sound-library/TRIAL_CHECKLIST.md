# Jay Vale Audio Lab — First-Trial Checklist

Updated 17 November 2026 after live R2/D1 verification. This checklist is persisted with the cloud backend source. Only mark tasks complete after verifying actual results, not merely committing code.

## Infrastructure and setup completed

- [x] Cloudflare R2 bucket, D1 database, Worker configured with private secret tokens.
- [x] 9.5 GB library software budget and instrument-family taxonomy defined.
- [x] Full target inventory: 128 General MIDI programs, 47 standard percussion notes, 131 additional entries; target names are **not** recordings.
- [x] Hierarchical R2 object key conventions and private catalogue API implemented.
- [x] 173 CC0 source WAV references in pinned importer manifests (Boochi44 57, TR-808 116).
- [x] Scheduled import completed and reconciled all 173 source WAV references: 134 unique R2/D1 samples, 39 duplicate source entries; all 134 bytes and keys verified with the R2 integrity audit.

## First-trial tasks (ordered)

- [x] **1. Fix and verify sample importer — COMPLETE.** Live Worker v0.5 verified 173/173 source entries processed; 134 distinct WAV recordings in D1, 39 duplicate source entries. R2 integrity audit confirmed 134/134 corresponding objects and exact sizes, 0 missing files, 0 size mismatches and 0 unindexed objects, with last scheduled batch reporting 0 errors. Verified at `2026-11-17T20:30:33.623Z` (UTC).
- [ ] **2. Populate more licensed samples — HIGH.** Drums and 808s first, then bass, guitars, piano/keys, synths, strings and winds. Track each source's license and sample/velocity/pitch coverage.
- [ ] **3. Securely connect Audio Lab to cloud sample database — CRITICAL.** The public website must *never* contain R2/admin/read shared tokens. Use user authentication, short-lived signed URLs or a secure proxy.
- [ ] **4. Improve sample-matching accuracy — CRITICAL.** Rank by audio fingerprints, spectral shape, transient, attack/decay, bass pitch and articulation. Reject inadequate candidates.
- [ ] **5. Automate single drum-stem reconstruction — CRITICAL.** Analyze kick/snare/clap/hat/808 hits, choose recordings, preserve original timing, and compare output with source-lock controls.
- [ ] **6. Extend reconstruction to melodic instruments — HIGH.** Bass and pitch-aware multisample matching; velocity and articulation with identical timeline alignment.
- [ ] **7. Finish the first-trial UI — HIGH.** Single stem ZIP upload, analysis status, found samples, A/B preview, export WAV and error reporting.
- [ ] **8. Run first real A/B trial — CRITICAL.** Use the existing 2 Drums.mp3 ZIP, compare loudness-matched original and reconstruction. Document human listening feedback.
- [ ] **9. Objective evaluation — HIGH.** Spectral similarity, transient timing, tempo, loudness, artifact metrics; AI classifiers supplementary only.
- [ ] **10. Bitwig / ACE Studio connections — LATER.** Local-only bridge for licensed Bitwig sounds and a practical exported-stem flow.

## Verify before moving to the next item

Cloud Worker health: https://jay-vale-sound-library.helgacoupe.workers.dev/health

Audio Lab website: https://jayvalemusic.com/studio/audio-lab/?v=5

Cloud source: https://github.com/Jayvaleheartship/Jay-vale-website/tree/main/cloudflare/sound-library

### Definitions of done

**Task 1:** `source_entries_processed=173`, failures=0, `r2_integrity.complete=true`, all D1 samples verified in R2 with byte-length agreement, no unindexed objects. 134 unique samples are acceptable if the difference is verified duplicate content; do not fabricate 173 unique assets.

**Task 8:** Export and listen to a reconstructed WAV aligned with the supplied drum stem, and review measurable differences. A detector score is not proof of human provenance.
