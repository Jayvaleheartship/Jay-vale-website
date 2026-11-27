# Jay Vale Audio Lab — Mandatory Per-Song Production Standard (v1.0)

**Owner workflow:** Jimmy Jansen / Jay Vale · Heartship Records  
**Adopted:** 2026-11-27  
**Scope:** Every new song opened under this workflow. Create a separate, dated checklist and manifest for each project before analysis. No completed stage may be skipped, assumed, or marked done from a code commit alone.

## Fixed order and hold points

| Stage | Required action | Evidence and completion gate |
|---|---|---|
| 00 — Project opened | Create song-specific checklist, source/provenance manifest, sample requests, and output inventory. Capture title, version, creator credits, dates, target tempo/key when known. | Project files exist; status remains pending until verified. |
| 01 — Human composition | Jimmy writes lyrics, melodic ideas and instrumental direction. Store originals and revisions with provenance (privately, not in the public website repository). | User-owned lyrics/music inputs acknowledged and source dates recorded. |
| 02 — AI reference draft | Use Suno as a **reference draft**. Record generator, model/version if known, prompt/production notes, source audio SHA-256 and generated/stem provenance. | Reference is retained; it is not relabeled as a human recording. |
| 03 — All stems supplied | User supplies *all* lead, backing, drums, bass, keyboards, synths, percussion, guitars, orchestral/other effects in a single batch/ZIP (additional missing stems tracked). | Manifest matches ZIP contents; no absent or swapped layers. |
| 04 — Ingest/align | Analyze duration, sample rate, bit depth, codec, offset, common start, silence, phase, channels, clipping and checksum; preserve unchanged originals. | All files decode correctly; synchronized test playback/offset report accepted. |
| 05 — Micro-analysis of **every** stem | Perform event-level transient/onset, tempo, pitch/F0, harmonics, STFT/multiscale spectra, timbre, formants where relevant, envelope, dynamics, loudness, reverb, residual/noise, mid/side, stereo width, channel balance, phase correlation, mono compatibility, artifacts, and waveform/spectral features. | Per-stem analysis report and indexed event/source inventory; no layer silently omitted. |
| 06 — Source/sample search | Match instrument, note, velocity, articulation, attack/decay, stereo image and acoustic signature to existing approved recordings. Search and download missing licensed samples; store source URL, rights/license, version, checksum, and instrument family in the library. Synthetic reference sounds may not correspond to an actual pre-existing sample. | Every proposed sample documented and legally usable; unfilled sounds entered in sample-request log. |
| 07 — Instrumental reconstruction | Rebuild **all musical layers** from eligible real recordings or genuinely performed parts. Preserve arrangement, rhythm, pitch, sound design and intentional energy, without silently reusing generated instrumental audio. | Rebuilt stem for every musical stem, time-aligned against reference; source provenance recorded. |
| 08 — Fidelity/A-B review | Compare each instrumental source and rebuild using time-aligned listening, spectral/temporal distance, pitch/onset timing, dynamics, stereo/phase and audible artifacts. User wants **95% perceived similarity**; percentage must be defined by a calibrated test, not invented from a single arbitrary metric. | Blind/level-matched A/B, objective metrics, known differences, user approval; unresolved differences remain blocked. |
| 09 — Human vocals | Deeply inspect lead/backing vocals separately: pitch and contour, timing/phonemes, breaths, formants, transitions, sibilance, transient detail, dynamics, mono/stereo and mid/side content, doubled voices, reverb and audible artifacts. **Capture Jimmy's actual lead/backing performances** (or other permitted real performers), and mix/comp them to the intended emotional reference. | Evidence of real takes, alignment, listening review and explicit source provenance. Do not merely perturb AI vocal data to confuse detection. |
| 10 — Stem AI detection | For **each** original reference stem **and** genuinely rebuilt/recorded counterpart, retain exact ACRCloud result(s) including full/original/vocals/accompaniment, source/model version and time segments where returned. A value strictly **>15** triggers a **red review flag**; missing results remain unknown. | Report labels source vs rebuilt and records all flagged items. A lower score is not proof of human origin. Never change a model score or run cosmetic transformations solely to evade the classifier. |
| 11 — Stem review hold | Resolve every flagged rebuilt stem by investigating actual source, rights, performance and reconstruction quality; repeat **substantive and documented work** if needed. Reviewer decides whether a high/uncertain model score is a false positive. | All stem reports received, each concern reviewed, track has an explicit quality/provenance decision. User's 15% target is a review threshold, not an authenticity guarantee. |
| 12 — Mix and render | Merge approved reconstructed instrumentals and recorded vocals. Recheck gain staging, true peak, loudness, clipping, sample alignment, mono fold-down, phase, channels and export specs. | Playable lossless WAV candidate (target 24-bit, 48 kHz stereo unless project specifies otherwise); verified by decoding and listening. |
| 13 — Full-song AI check | Scan the **actual final WAV candidate** with ACRCloud where authorized; record provider/model, date, stem-specific results and user-selected 15% review gate. | Strictly >15 = red flag requiring review. Lower than/equal to 15 does not by itself validate authorship or permit misrepresentation. Report unknown/unavailable scores transparently. |
| 14 — Verified release master | Only after actual provenance, QA, truthful attribution and review are approved, write BWF/WAV INFO/iXML where supported: **Artist: Jay Vale; producer and writer: Jimmy Jansen; label/claimed rights holder: Heartship Records; exact creation/master date** and appropriate rights notices. Do not describe this as immutable DRM. | Re-open file and verify audio integrity, embedded metadata, channels, bit depth, dates, and release-sidecar SHA-256. If a separately licensed robust audible/inaudible watermark is used, disclose it and confirm no unacceptable audio damage; metadata alone is *not* a watermark. |
| 15 — Deliver and archive | Place finished master, signed/hashed provenance manifest, per-stem analysis, source/license inventory, detector reports and reconciliation notes in the project archive; provide verified working download link. | Link exists in the same session; file can be opened, length/hash validated. No link is fabricated. |

## Mandatory gates

1. **No missing stems.** If an instrument is not represented in the supplied ZIP, record that fact and hold reconstruction until it is supplied or confirmed intentionally absent.
2. **No hidden replacement.** Each reconstructed instrumental uses traceable approved sample recordings or newly recorded performances; synthetic/AI source audio remains labeled as a reference, not a recording.
3. **Human vocals mean human performances.** Prefer new lead/backing recordings; the user may record special mouth noises, breaths or percussive sounds on request. Only request a recording when the specific sound cannot be sourced appropriately. No task should require impossible "50% less AI perfection" measurement without defining a reproducible human-listening evaluation.
4. **Fidelity goal ≠ measured 95% automatically.** Track several published metrics and human A/B acceptance. If a metric reports 0.95 similarity it must name the algorithm, parameters and validation set; do not claim a universal 95% sonic identity.
5. **15% = user-chosen internal review threshold.** Flag all provider AI probabilities above 15 (strict inequality), clearly distinguish stem/original vs rebuilt, include the model and date, and flag unavailable/ambiguous results as unresolved. No system can promise scores below 15 for every genuine recording; no detector score should be used to conceal AI-assisted provenance.
6. **Per-step verification.** Each checklist item must attach evidence file(s), pass/fail review, and dated notes. Block subsequent steps when a mandatory prerequisite is missing; only overrides grounded in truthful provenance and the user's informed approval can be recorded.
7. **License ledger.** Approved samples must include license and allowable commercial usage, attribution requirements, source URL, checksum and date. Never download or redistribute unlicensed audio.
8. **Preserve source files.** No destructive alterations or deletion of originals; always store untouched originals separately.
9. **Credentials and privacy.** Provider tokens and private song stems/lyrics are not put into a public GitHub Pages repository. Request private exports through approved channels.
10. **Delivery verification.** Final download link may be supplied only once the actual final artifact exists and the exact path/link works.

## Supporting files per song

- `CHECKLIST.md`: 16 stages with independent dates, verification and blockers.
- `project.json`: title, contributors, labels, source lineage, quality thresholds and stage statuses.
- `STEM_REGISTER.csv`: one row per input layer and counterpart, technical stats, analysis references and provider result IDs.
- `SAMPLE_REQUESTS.csv`: unmatched event/instrument, search status, recorded sample/license/URL/checksum and resolution.
- `DETECTION_LOG.csv`: exact provider scores for each original and rebuilt stem, model, time region and review flag.
- `DELIVERY.md`: master export format, metadata validation, hashes and actual verified download link.

## Reality checks

- "Samples used by Suno" may not be identifiable or exist as discrete recordings; target **equivalent sounds**, not unverifiable claims of exact sample origin.
- BWF metadata fields are standardized but not immutable, encrypted or an ownership guarantee. Metadata, optional watermarking and cryptographic checksums solve different problems.
- Results must separate creative authorship (lyrics/composition), performances, sound recordings, and AI generation assistance accurately.
- An ACRCloud output is a model prediction and **not** a mathematical percentage of how much of a song was made by AI.

This standard is the fixed order for project tracking. If a sound cannot be reproduced, a human take is missing, provider access is unavailable, licensing is unclear or a quality gate fails, mark **BLOCKED** with the reason. Do not claim completion or deliver an ersatz master.
