# {{SONG_TITLE}} — Jay Vale Audio Lab Song Checklist

Project ID: `{{PROJECT_SLUG}}`  
Opened: **{{CREATED_DATE}}**  
Project status: **NOT STARTED / HOLD**  
Policy: cloudflare/sound-library/SONG_PIPELINE_STANDARD.md  
**One project, one track, all stems; no skipped stages.** Mark a checkbox complete only after evidence/QA has been verified.

## Fixed production order

- [ ] **00 — Open project:** Save title/version, credited creators, project files and baseline manifest. Evidence:
- [ ] **01 — Write:** Jimmy Jansen's original lyrics, melody/instrument ideas and reference notes supplied. Evidence:
- [ ] **02 — Suno reference:** Draft and generator/provenance details supplied; checksum and reference archived. Evidence:
- [ ] **03 — Bulk stem import:** One complete ZIP/batch of stems supplied, including lead and backing vocals; manifest all intentional absences. Evidence:
- [ ] **04 — Import audit:** Decode every stem; inspect duration, offsets, sample rate, channels, clipping, phase and source SHA-256. Evidence:
- [ ] **05 — Microanalysis of EVERY stem:** Pitch, spectra, onsets, transients, dynamics, loudness, stereo/mono and mid-side characteristics, artifacts and event-level matches. Evidence:
- [ ] **06 — Identify/download sources:** Search the library first, then find appropriately licensed equivalents; catalog each sample, license, URL and SHA-256. Ask Jimmy to record a unique mouth/voice sound only when needed. Evidence:
- [ ] **07 — Rebuild EVERY instrumental:** Use documented recordings and/or genuinely performed parts; preserve timing, key, arrangement and character. Evidence:
- [ ] **08 — Instrumental A/B verification:** Record independent objective metrics, aligned A/B listening, exceptions and Jimmy's sound-fidelity approval (95% perceived-match target, not a mathematically assumed similarity). Evidence:
- [ ] **09 — Lead + backing vocal reconstruction:** Analyze voice microdetails and stereo/mono/double tracking; make or import real human performances, preserve intended vocal identity and emotion; document source. Evidence:
- [ ] **10 — Each original/rebuilt stem through AI detector:** Record exact model/version/probability per stem and time segment. **Red flag if AI probability >15%.** Evidence:
- [ ] **11 — Resolve stem flags:** Document legitimate recording/reconstruction improvements, source evidence and review for every red flag or unavailable score. No cosmetic detector evasion. Evidence:
- [ ] **12 — Merge/mix/export lossless WAV candidate:** Render all validated stems; verify alignment, phase, channels, clipping, bit depth and listening QA. Evidence:
- [ ] **13 — Final WAV AI detector:** Check actual merged candidate; **red review flag if AI probability >15%.** Preserve provider results without changing scores. Evidence:
- [ ] **14 — Verified master and rights metadata:** Jay Vale (artist), Jimmy Jansen (producer/writer), Heartship Records (label/claimed rights holder), actual year/month/day; BWF/INFO/iXML as compatible, integrity hash, separate optional watermark only if truly applied. Evidence:
- [ ] **15 — Download and archive:** Validate final WAV metadata and checksum; preserve proof files, supply a working verified file link. Evidence:

## Per-stem technical analysis inventory

All stems must be entered in `STEM_REGISTER.csv`. At minimum, the analysis of **each** stem captures:

- File SHA-256; source (Suno reference / recorded performance / licensed sample rebuild); sample rate/codec/bit depth/channels; exact start offset and length.
- STFT/multiscale spectrum, spectral centroid/roll-off/flatness, harmonics/pitch/formants when relevant; transient/onset timings, tempo/grid alignment, envelopes and note/event list.
- Loudness, RMS/crest, clipping/noise/reverb, stereo width, L/R gain differences, mid-side ratio, phase/correlation, mono fold-down compatibility and artifacts.
- Reference-to-rebuilt similarity method and named metrics, aligned A/B listening, actual differences and proof of recorded/licensed source.
- Both original and rebuilt AI detection if available, exact percentage from ACRCloud with model ID and segments.

## Gates — never silently pass

- **Blocked** when stems, rights, real vocal recordings, sample evidence, listening approval, provider report, or verified output is missing.
- AI percentage above **15.00**: **RED FLAG — NEEDS REVIEW**. Exactly 15.00 or less: **below user-defined review flag**, *not proof of human origin*.
- If score is unknown, label **UNKNOWN**, not pass. Do not modify audio solely to achieve a misleading detector result.
- Target **95% sound similarity** requires an explicitly defined metric plus blind/level-matched listening. If not calibrated, say "target not independently measured".
- An audible/inaudible watermark is only reported when truly applied and verified; artist/rights metadata are not a watermark or DRM lock.
- Delivery link appears only after final file is created, reopened and checked in the same delivery session.

## Current blockers

- Awaiting lyrics, Suno draft, stem batch and any later human performances for this track.
- Each missing instrument and sound should also appear in `SAMPLE_REQUESTS.csv`.

## Review log

| Date | Stage | Result | Evidence | Blocking issue | Next action |
|---|---|---|---|---|---|
| {{CREATED_DATE}} | 00 | Opened; verification pending | Project files | Song assets pending | Await input |

## Final output

Master WAV: **NOT CREATED**  
SHA-256: **NOT VERIFIED**  
Metadata embedded and re-read: **NO**  
Optional watermark applied/verified: **NO**  
Final AI detection: **NOT RUN**  
Working download link: **NOT AVAILABLE**
