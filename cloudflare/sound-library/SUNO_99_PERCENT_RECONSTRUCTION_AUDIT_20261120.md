# Full-song reconstruction provenance and ACRCloud follow-up — 20 November 2026

## Critical correction: AI classification does not equal failed independent reconstruction, because independent reconstruction was not done

The user reported that ACRCloud flagged the previously supplied full-song hybrid as 99% AI, likely Suno. This is user-provided detector feedback; no raw ACRCloud API response, model version or segment report has been verified here. Do **not** invent what proprietary internal features triggered the score.

- The original full-song hybrid **retained eleven source-generated stems** and replaced the drum stem only with the earlier **self-sampled, source-locked** test. **Zero stems** were rebuilt from independently recorded licensed samples.
- This pilot is suitable for transport, stem alignment, analysis and reversible A/B; it **fails** the acceptance definition of independently recorded musical reconstruction.
- All twelve supplied MP3s have the ordinary ID3/format comment `made with suno studio; created=2026-11-17T15:26:05Z` and `encoder=Lavf59.27.100`. The FFmpeg-exported mixed hybrid has different metadata and no source 'made with suno studio' comment. ACRCloud's public descriptions say it analyzes waveforms; metadata alone does not establish why the user saw 99%.
- Metadata comments are not cryptographic evidence, and **no acoustic watermark or valid C2PA check** has been performed. Do not assert that a watermark exists/does not exist from this file alone.

## Two new 10-stem instrumental-only MP3 experiments (actual local audio, verified)

Both versions omit original stems `0 Lead Vocals.mp3` and `1 Backing Vocals.mp3`. Their input provenance is `Interlude x Detuned Fragments (Mashup) Stems.zip`, SHA-256 `63973b514ad7b622d3daa25429442d35ec3416b2e70468aa9204781a271dc96a`.

1. **Reference**: source instrumental stems 2–11 summed in-place.
2. **Drum hybrid**: nine original instrumental stems 3–11, plus the self-sampled drum test previously exported.
3. Both MP3s: 320 kbps, stereo 48 kHz, 9,268,992 independently decoded frames/channel = **193.104 seconds**, same static linear gain **-3.2169 dB**, **0 near-clipped output samples**. Waveform correlation **0.99788508**, residual level **-23.70 dB** relative RMS. No human-recorded independent substitutions in either version.
4. SHA256 of reference MP3 `c74564ce27b5411b6cede02c8d7d50c61899878be6f62827f6b9abd73ef895a6`; drum hybrid MP3 `13791c79528a81ae8106987706c28aec40a69435f019e37f7b900451b2939d0b`.
5. Original instrumental left/right correlation **0.7353**, hybrid **0.7375**; source spectral centroid **299 Hz**, hybrid **297 Hz**; source energy **72.77%** below 160 Hz and hybrid **73.29%** (from sampled FFT frames). Changes are small and not evidence of detector authorship. Original/source instrumentals have pre-gain float peaks above 0 dBFS; shared static gain avoids output clipping.
6. Acoustic check has measured spectrum, side/mid channel balance, 100 ms dynamics, relative mix residuals and alignment. **No validated low-level Suno signature model**, **no full MIDI transcription or independently performed note event reconstruction**, **no signed watermark/C2PA verification**; the existing comment metadata is the only identifiable Suno marker in stem containers.

Private copies of both instrumentals plus report, per-stem provenance and JSON QA are in ChatGPT Library:
`/Jay_Vale_Audio_Lab_Projects/Interlude_x_Detuned_Fragments/Instrumental_Only_Research_Pack.zip`
and `Detector_Followup_Reconstruction_Audit.md`. **Never commit source audio, file passwords, private tokens or vocals to GitHub.**

## Actual ACRCloud metadata and proper test interpretation

ACRCloud's public File Scanning AI Music Detection response includes fields `stem=original|vocals|accompaniment`, `ai_probability`, `likely_source`, `source_probabilities`, and time-coded `segments`. Reference: https://docs.acrcloud.com/reference/console-api/file-scanning/metadata/ai-music-detection . These scores are classifier estimates, not instrument attribution or model-feature explainability. For our existing 99% claim, the detailed metadata has not been supplied or retrieved.

Run the exact same provider and settings on: (A) previously reported full hybrid, (B) source instrumental-only, (C) drum-hybrid instrumental-only; store raw responses, provider analysis date/model, file SHA256 and exact time windows. Do not interpret missing vocals as a new human performance, and do not make claims about future scores before tests. An instrumental may contain residual vocal separation bleed.

## Engineering plan: independently recorded reconstruction, not detector evasion

1. **Source and residual accounting:** per-stem timeline, separated sub-layers, exactly measured source-derived fractions. Never label `source retained`, self-sampled or additive enhancement as full instrument replacement.
2. **Drums:** redo kick/snare/hat/tom/808 matching against independent verifiably licensed recordings, with onsets/duration/velocity, overlays and collisions, no automatic use of original drum samples in the `independently recreated` path.
3. **Bass:** pitch curves/continuous slides, note durations and articulations first; generate an editable MIDI-like map and matched multisample performances, recording every note's sample provenance.
4. **Keys, guitar, synth and 'Other':** identify actual simultaneous notes and sound sources. Chords, strums, bends, synth modulation and effects must be rebuilt as independent performance or patches; source-extracted harmonic/transient components are only diagnostic.
5. **Strings, brass, woodwinds, percussion:** fill only explicitly verified sample gaps, with each source pinned to proper rights evidence. Preserve stereo: previous brass L/R correlation -0.52 with 6.19 dB estimated mono fold-down loss; cannot blindly mono-downmix.
6. **Vocals:** currently still generated; to independently recreate the voice requires an actual performer recording. Micro-data changes do not retroactively change who/what performed the original. If original vocals are retained, label the product hybrid.
7. **Quality gate:** each stem/source recording MIDI event validated for onset, pitch, articulation, length, envelope, loudness, spectrum, spatialization, clipping and residual source fraction. Produce a source/rebuilt/difference trio. Source-only fallback counts as *not reconstructed*.
8. **Release gate:** no full reconstruction completion until all specified musical components are replaced by independently recorded/performed or transparently marked nonreconstructed, every source is licensed and logged, frame alignment and full-song QC passed, and human listening comparison accepted. Record optional AI detector outcomes without promising or attempting to guarantee a specific classification.

## Status

- **DONE:** 10-stem instrumental export A/B, objective spectrum/stereo/timing/metadata review, source-retention accounting, private reproducible report.
- **OPEN:** user independently checks instrumental A/B via ACRCloud; retrieves detailed component/segment results if available; real instrument sample acquisition and reconstruction across all stems; authenticated Cloudflare library imports; human listening.
- **NO NETLIFY DEPLOYMENT**, no production merge, no audio written to GitHub.
