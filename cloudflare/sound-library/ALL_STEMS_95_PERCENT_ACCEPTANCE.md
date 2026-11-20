# Jay Vale Audio Lab — every-stem, every-layer reconstruction standard

Updated 2026-11-20. User target: **at least 95% perceived similarity**, with real recorded sample provenance for each individual instrumental layer, and a separately audited vocal workflow.

## Scope

- 10 current instrumental stems: Drums, Bass, Guitar, Keyboard, Percussion, Strings, Synth, Other, Brass and Woodwinds. **No stem is skipped**, even if quiet or seemingly empty. A silence diagnosis needs explicit verification; an `Other` stem needs sound-source classification and recorded background/effects material.
- 2 vocal stems: lead and backing, handled by independent speech/singing evaluation and stereo/spectral reconstruction, not blindly graded by the instrumental matcher.
- The real full-song test has 12 decoded 48-kHz stereo tracks of 193.104 seconds each. Before any label is marked complete, each genuine overlapping instrument/noise/effect layer must be reviewed and accounted for. Four acoustic spectral templates per stem are *exploratory bases*, never proof of actual instrument count.

## What qualifies as an independent instrumental layer

A fully reconstructed layer has: an identified instrument/performance/recorded-effects source; time-coded note/hit envelopes and articulation; one or more recordings from an independently documented, licensed real-world recording collection with SHA256 provenance; a rendered new track built **without copying original generated PCM**; no hidden original residue (including the side channel, reverb and tails); objective audio integrity; then >=95% listener-assessed similarity to the reference.

A recorded analog hardware synthesizer or physically recorded acoustic instrument can qualify if the recording's origin is verified. A digital or synthesized sample cannot silently be described as a live acoustic recording. License evidence alone doesn't prove sound origin. Source-retained effects/noise must be declared hybrid, and a detector result must never be used as proof of human musicianship.

## Automatic engineering quality gates

For every layer and then every full stereo stem measure:

1. Source/provenance: license, origin evidence, SHA256 and absence of original-signal fallback.
2. Musical structure: note/hit onset, duration, pitch and chords, velocity, articulation, bends/slides, unquantized microtiming, accompaniment interplay and room/tail modeling.
3. Sound quality: attack/decay envelope, multiresolution spectrogram, loudness and level trajectory, band balance, high-frequency residuals, time-varying timbre, stereo side-mid frequency dependence, left/right correlation and polarity, clipping, non-finite samples and exact length.
4. Side/routing: inspect **separate left and right** tracks; never rely on mono only, especially where negative L/R correlations could destroy brass or strings.
5. The mix: 48k reference length (9,268,992 frames), all 10 independently reconstructed instrumental stems, independent reverb/FX layers, reference-aligned sum, original/reference/difference previews.

Automated spectral distances or waveform correlations **cannot be interpreted directly as percent-quality**. The 95% target is a listening-similarity review (ideally blind or level-matched and repeatable); objective metrics flag gross errors and localize mismatches. A stem that fails any structural/provenance/engineering gate stays incomplete, regardless of a high mixed-track correlation. A 'passed' instrumental album cannot contain source-retained materials masquerading as recorded layers.

## Vocal workflow — separate from instruments

Lead and backing must be inspected independently as L/R waveforms and M/S energy, with pitch trajectory, voiced/unvoiced regions, formants, vocal attacks, consonants, breath/noise, F0 perturbation on reliable voiced vowels, shimmer, loudness contour, dynamic expression, double-tracking, stereo reverb and residual effects. Avoid imposing average acoustic values globally. Original retained AI vocals are **original/hybrid** regardless of microstructure editing; a genuine separate performed-vocal reconstruction requires an independent consenting performer recording or accurately disclosed alternative. None of this is evidence that an AI detector must change its result.

## Current verified baseline

- 12 original stems imported, 3:13.104 each. Their filenames are instrument hints, not confirmed sound source assignments.
- 48 preliminary acoustic spectral templates (fixed four per stem) from unsupervised magnitude decomposition, **not 48 independently identified/recorded components**, with fit quality in \
  `all_12_stem_candidate_layer_map.json`.
- **0 of 10 instrumental stems independently recorded/reconstructed; 0 complete recorded-sample event layers.** Prior drum/source pilot is not independent reconstruction.
- 2 vocal stems preserved, to be separately assessed. No independent voice re-performance yet.
- JS acceptance gate `studio/audio-lab/full-song-coverage.js`: every confirmed layer needs recording provenance, independent render, event audit, source-fraction zero, quality checks and >=95% explicit listener agreement. Hard fail on any absent layer. Existing HTML import initially reports source-only status; does not pretend reconstruction is done.

## Dependency and library work

- First query D1/R2 private 309-sample inventory with authenticated read permission; no upload/use of long-lived secret in public client JS. Use candidate filenames/note/pitch/velocity & spectral templates to derive missing real-sample requirements.
- Review source licenses and recording provenance before download. Suitable public CC0 candidates are Meta Open Sound piano/nylon/steel guitar and VCSL/VSCO acoustic instruments, though sample-by-sample coverage and accurate sound matching are not verified yet.
- Source import needs authenticated admin permission plus R2/D1 integrity check; currently NOT done. No Netlify deployment while credits are unavailable.

## Critical blockers

- No private READ_TOKEN/admin access was supplied in this offline session; cannot truthfully claim the R2 309 objects were read or new objects uploaded.
- The local execution environment has no outbound HTTPS access for acquiring sample binaries. The previously cited source links establish provenance and availability, not actual downloaded audio.
- No full polyphonic transcription, human-verified instrument assignments, independent all-stem reconstruction, or 95% listening trial has passed. These remain open, and the quality contract is deliberately designed to prevent false completion.