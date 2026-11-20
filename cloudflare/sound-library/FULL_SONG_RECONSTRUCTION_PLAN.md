# Jay Vale Audio Lab — Full-song stem reconstruction and demand-driven sample library v1

Status: **PLANNED / NOT IMPLEMENTED**. Created 20 November 2026 on the non-production `audio-lab/task5-offline-20261118` branch. No deployment, no Netlify build, no private audio added to GitHub. This is the implementation plan for extending the working drum and voice experiments to entire multitrack songs. The original audio, arrangement and authorship provenance must remain visible; a detector score cannot establish human performance.

## Goal and boundaries

Input: one complete ZIP containing aligned WAV/FLAC/MP3/M4A stems and optionally a full-song master, original BPM/key/reference notes. The names may already label lead/backing vocals, drums, bass, guitar, keyboard, percussion, strings, brass, woodwinds and effects, but any label must be verified from audio; each stem may contain multiple overlapping sources, processing and stereo effects.

Output: project manifest, original-stem immutable archive, per-stem/per-layer analysis, verified sample matches, import gap queue, reconstructed audio layers, stem-by-stem A/B and combined master, self-audit and reproducible provenance report. Keep original source as fallback and do not automatically claim 100% independent instrument reconstruction. Target *perceptual quality and source fidelity*, not detector evasion or false claims about the recording process.

**Reality:** notes, envelopes and percussion hits can be approximately transcribed; complex layered pads, polyphonic guitar, vocal identity, room acoustics, reverbs and nonlinear FX may not be exactly recoverable from stems. A reconstruction that retains original signal for unmodeled residue is a *hybrid*, not a fully recreated recording. Distinguish 100% reconstructed, partial/hybrid and unchanged source by exact shares and timestamps in every report.

## 1 — Project import, indexing and alignment

- Import ZIP locally first: detect path traversal, decompression bombs, duplicate files and unsupported formats; never execute ZIP content.
- Read actual decoded PCM duration (some MP3 container/header estimates are wrong), sample rate, channel count, peaks, loudness, starts/offsets; decode to a common 48 kHz floating-point processing rate, preserving original bytes.
- Keep per-stem hash, filename, codec, channel layout, duration, original alignment and gain, and immutable original file for fallback.
- Estimate beat grid/BPM and key with confidence, but do not force quantization; explicitly retain microtiming and variable tempo.
- Split stereo into mid/side for analysis while preserving left/right or multichannel reconstruction; identify true mono, dual mono, decorrelated reverb, polarity inversion and side-chain artifacts.
- Output `project_manifest.json` plus `stems.json` and `timeline.json` with exact sample offsets.
- Persistent local project path: `projects/<project_id>/source/`, `analysis/`, `layers/`, `reconstructed/`, `reports/`, `exports/`. Private cloud project sync is optional and must be separately authenticated/consented; do not publish user audio.

## 2 — Automatic layer discovery and event transcription

- Layer categories: lead/backing vocals, kick/snare/clap/closed/open hat/toms/cymbals, 808/sub, electric/acoustic bass, guitar articulation, piano/keys, synth pad/lead/pluck, strings, brass, woodwinds, percussion, ambiance, sound effects and unknown.
- For each stem analyze multi-band transients, harmonic/percussive/residual components, pitch contours, polyphonic onsets/offsets, dynamics, attack-decay-sustain-release envelope, articulation, spectral timbre, spatial information and effects tails.
- Use confidence intervals; one instrument stem may contain two sounds and two instruments can share a frequency range. All ambiguous labels remain editable. Keep `unknown_or_effects` rather than forcing a nearest match.
- Transcribe MIDI-like event lists for pitched layers with note, start and end samples, pitch/multiple simultaneous pitches, velocity proxy, articulation and uncertainty. Store the unmodeled residual separately.

## 3 — Library matching and gap-driven acquisition

Existing pinned inventory (last verified 17–18 November): **309 unique licensed CC0 R2 objects**, 348 source references with 39 content duplicates, covering drums 124, bass 23, guitar 15, keys 24, synth 14, strings 17, brass 6, woodwinds 12, percussion 74. Do not mistake category inventory for full playable multisample coverage.

Search D1 catalogue first; match by source family, instrument, pitch/range, velocity, articulation, time envelope, timbre, noise profile, sample rate and perceptual spectral descriptors, not just tags. Each event receives confidence, alternative sample IDs, mismatch reasons and playback audition. Never silently force an unsafe match.

For missing coverage, emit `missing_samples.json` with prioritized gaps (instrument, exact pitch and velocity, articulation, required duration, quality target), grouped across projects to avoid duplicate downloads. Prioritize broadly reusable one-shots and multisamples rather than unlimited copies of single-song synthetic audio.

Review and separately verify actual source license and scope **before download/import**. Strong source candidates for further *reviewed* expansion:
- [Meta Open Sound](https://github.com/facebookincubator/Meta-open-sound): CC0 piano, nylon guitar and steel guitar multisamples, plus distinct-license sound effects. Record each individual collection's declared license and immutable revision.
- [Versilian Community Sample Library](https://github.com/sgossner/VCSL): CC0 sampled instruments. Prioritize genuine missing notes, articulations, and longer sustains.
- [VSCO 2 Community Edition](https://versilian-studios.com/vsco-community/): CC0; review instrument samples and coverage gaps.
- Existing approved drum/tr-808 manifests and sources: reuse provenance, deduplication and licensing checks.
Do **not** mirror proprietary Bitwig packs, unverified marketplace libraries, or entire original songs into the shared sample bank without appropriate rights.

Keep current R2 naming rule unchanged:
`samples/<family>/<instrument>/<sample_type>/<variant>/<source_collection>/<sha256>.<extension>`.
Each D1 entry stores exact license / source URI / source revision / sha256 / original filename / source ownership or CC0 status / pitch and velocity / duration / measured acoustic features / import date / validation evidence. Reject new samples if hash duplicate, unsupported license, missing verifiable source, audio corruption, or library soft cap exceeded.

Use existing authenticated `POST /v1/admin/samples` / import scheduling or a future private queue to ingest and reconcile. No public-bucket exposure or READ/ADMIN tokens in frontend, user ZIP or repository. New cloud writes require authorized secure connection and independent R2/D1 health confirmation. Budget and request costs require monitoring; 9.5 GB is a software *soft* cap, not a billing cap.

## 4 — Instrument-specific reconstruction

- **Drums/percussion:** adapt existing source-locked 5 ms onset/matcher/audit, improve close-hit overlap and tails, choose recorded one-shots by timbre, velocity and articulation, normalize attack timing.
- **Bass/808:** harmonic tracking and fundamental pitch with uncertainty; select accurate pitch-dynamic samples and continuous 808 slides where possible; preserve note endings.
- **Guitars/keys/strings/brass/woodwinds:** multisampled key zones, root note, multiple velocity/articulation layers, polyphonic note events and performance envelopes. Preserve original chord voicings and bends when detectable.
- **Synths:** try licensed multisample/synthesis patch matching and time-envelope approximation; if exact patch/modulation cannot be recreated, label the section hybrid/source-retained rather than assert instrument equivalence.
- **Vocals:** keep original voice identity, words, phrasing, breaths and musical performance. The completed microdata pilot only changes tiny envelope data, not singer provenance. Recreating the voice from separate samples is not equivalent to a real performed retake. Any processing is reversible and must be honestly identified.
- **Effects/stereo:** model independent reverbs/delays, pan and width only when identifiable. Preserve source tails as residual as needed and report source-derived portions.

Align all reconstructed events in original sample coordinates. Define a deterministic render graph and optionally export individual WAV tracks and MIDI-like event lists for ACE Studio/Bitwig. Preserve original stems separately.

## 5 — Quantitative and listening self-check

Per event: onset offset, pitch deviation, envelope attack/decay, three-to-many-band spectral energy, timbre descriptor, stereo balance and confidence. Per stem: sample length and channel equality, integrated loudness, peak, clipping, frequency balance, temporal alignment, residual energy, loudness-matched spectral/perceptual distance and effect tails.

Set numerical safety gates per instrument after real calibration; existing drum audit thresholds are experimental, not guaranteed perceptual quality. On failure, revert automatic replacement to source/approved hybrid; never silently undo manual changes. Never call source-only fallback a successful reconstruction. Protect from destructive phase cancellation, clipping, reverb mismatch, or silence.

ABX-style listening: time-aligned and loudness-matched Original / Reconstructed / Difference; annotate failures by time region and layer. Export independent human listening notes.

Only after final export, optionally submit to reputable music and speech AI detectors to **measure their behavior**, including uncertainties and no-music/no-decision states. Detector acceptance does not prove that audio was created by a human or that a reconstruction is authentic. Any service upload requires user-authorized transfer and real result IDs.

## 6 — Project manifests, repeatable task queue and UI

Suggested metadata per project:
```json
{
  "schema_version": 1,
  "project_id": "sha256-derived-safe-id",
  "original_stems": [],
  "alignment": {"processing_rate_hz": 48000, "original_offset_samples": 0},
  "detected_layers": [],
  "sample_matches": [],
  "missing_samples": [],
  "sample_imports": [],
  "render_graph": [],
  "source_retained_regions": [],
  "quality_results": [],
  "exports": [],
  "history": [],
  "status": "imported"
}
```
Each project uses the same stages: `imported -> inspected -> layers_reviewed -> library_checked -> gaps_reviewed -> rebuilt -> audited -> user_listening_reviewed -> exported -> detector_reported`. All stages checkpoint and resume after crash, without redoing unnecessary imports. Every stage must have source hashes, build version, result hash, timestamps, status and actionable errors.

UI: overview of all stems; expandable per-stem event map; library coverage % and missing sample list with rights evidence; accept/reject sample choices; render progress; synchronized original/rebuilt/difference players; independent stem/mix exports and report. Show distinct completion badges for original/hybrid/independently rebuilt layers, not generic “humanized.”

## 7 — Development sequence and acceptance criteria

1. **First complete-song ingest trial** using the user-provided full stem ZIP or the previously supplied individual aligned stems; verify audio, dates, sync, channels, file boundaries and metadata.
2. Add multi-stem analysis manifest and editable layer map. For each detected layer log unknowns and confidence, not fabricated instrument identification.
3. Implement sample coverage and missing-source queue; review+license+download+import only for actual identified gaps. Verify R2/D1 size/hash integrity and budget.
4. Complete Task 5 authentic CC0 drum reconstruction and Task 6 polyphonic bass/keys/melodic reconstruction.
5. Rebuild instrumental layers conservatively; include reversible source-retained vocal and unknown components. Export separate stem tracks and mixed WAV, plus optional MP3 for listening.
6. Execute automated QC and double-blind listening, with at least one real song and actionable timestamped disagreements.
7. Attempt music AI detector assessment independently and document exact vendor, model/date, sample types, uploaded files, raw response and inconclusive responses. Compare original/rebuild without claiming authorship change.

**Done means:** Every supplied stem represented and accounted for in manifest; original bytes retained; exported mixed WAV exactly time-aligned; every applied sound has verifiable sample provenance or explicit source-retention label; all license records complete; full-song no-clipping/finite-output checks pass; real-user A/B audible findings recorded. No fake “100% recreated”, “95% identical”, or successful detector claim without external evidence.

## Current implementation status

- [x] Sample backend and private R2/D1 with 309 recorded sounds (last verified 17–18 November).
- [x] Multi-stem ZIP recognition and single-stem handoff (published Audio Lab v0.7/0.8).
- [x] Drum matcher and source-reference auditor on offline branch; CI 38/38.
- [x] Independent offline drum ZIP self-sampled A/B pilot.
- [ ] Full song project manifest, all-stem batch layer analysis.
- [ ] Polyphonic melody/velocity/articulation reconstruction.
- [ ] Automatic missing-sample planner and licensed source importer across all families.
- [ ] Accurate independent sample-based full-song reconstruction.
- [ ] Cross-stem synchronized mixdown and full-song self-check.
- [ ] Real A/B listening acceptance, validated detector report.
- [ ] Production deployment; do not trigger Netlify while user reports credit freeze.
