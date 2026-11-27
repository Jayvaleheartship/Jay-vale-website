# Interlude — Automated Audio Lab reference project

**Current state: running analysis and quality-gated project creation, not a finished independent reconstruction.**

## Fixed input

Use the originally supplied private ZIP `Interlude x Detuned Fragments (Mashup) Stems.zip` with all 12 synchronized MP3s (48kHz stereo, 193.104 sec). Do **not** commit the audio, private creator material, sample banks or tokens to GitHub.

## Install and run

From `cloudflare/sound-library` on a trusted machine with FFmpeg/FFprobe and Python 3.11+:

```bash
python3 -m pip install -r python/requirements-analysis.txt
python3 python/run_full_pipeline.py \
  --zip "/private/Interlude x Detuned Fragments (Mashup) Stems.zip" \
  --workspace ".local/song-projects/interlude-x-detuned-fragments"
```

The default run automatically completes **only** eligible evidence-gathering work: ZIP validation, SHA256 hashing, technical 12-stem decoding, spectral/onset/stereo microframes, reference vocal microanalysis, sample gap queues, a track-specific 16-stage checklist and a final honest blocker report. Repeated runs check source hashes to avoid repeating passed analyses.

## Native full-band 48 kHz audit

In addition to the initial 16 kHz analysis proxy, the orchestration now runs `python/fullband_stereo_audit.py` against the **original 48 kHz stereo stems**. It emits `fullband_48khz/FULLBAND_ALL_12_STEMS.json` and a per-stem JSON plus 250 ms frame CSV, including seven spectral frequency bands up to 24 kHz, mid/side, stereo phase correlation, and mono-fold spectral energy change. This is characterization, **not source reconstruction, humanization, or an AI-detection score**. Real original-file input hashes are checked before reusing cached results.

Tested on the actual Interlude 12-stem ZIP on 27 November 2026. The 4–8 kHz mono-fold measurement found brass −7.43 dB, strings −6.80 dB, keyboard −5.35 dB, synth −4.55 dB, confirming the need to preserve spatial behavior in reconstruction. Negative values must not be interpreted as an authenticity metric.

## Independent instrument matching and sample library

From the licensed Meta Open Sound CC0 registry (1,075 cryptographically indexed OGG recordings: piano, nylon and steel guitar):

```bash
python3 python/download_meta_cc0.py \
  --registry python/meta_cc0_sample_registry.json \
  --dest ".local/recorded-samples/meta" \
  --limit 50
```

Downloads require external HTTPS access, are restricted to the reviewed official source and accepted only after matching publisher SHA256SUMS. They are **not automatically accepted** as matches to the generated reference. The sample catalogue for the reconstruction engine lives at `.local/recorded-samples/meta/catalogue.json`. For additional CC0 instruments use VCSL/VSCO or the private R2 bank with separately verified rights, file hashes and source audio.

To rank currently verified recordings against events:

```bash
python3 python/run_full_pipeline.py --zip "/private/Interlude x Detuned Fragments (Mashup) Stems.zip" \
 --workspace ".local/song-projects/interlude-x-detuned-fragments" \
 --catalogue ".local/recorded-samples/meta/catalogue.json"
```

A ranking score is **not** an acoustic identity or a calibrated 95% perceptual match.

## Reconstruct instruments

Before any instrumental candidate is rendered, prepare a per-event map with **all 10 instrumental stems**, explicit source sample SHA256 + license + URL, a verified recording/performance provenance and all the independent coverage gates specified in `python/reconstruct_recorded.py`. Use:

```bash
python3 python/reconstruct_recorded.py \
 "/private/approved_interlude_events.json" \
 ".local/song-projects/interlude-x-detuned-fragments/original_analysis/INTERLUDE_SOURCE_MANIFEST.json" \
 ".local/song-projects/interlude-x-detuned-fragments/original_analysis/source" \
 ".local/recorded-samples/meta" \
 ".local/song-projects/interlude-x-detuned-fragments/instrumental_rebuild"
```

The engine refuses missing stems, unlicensed/missing samples, mismatched source hashes, source-derived reference recordings, incomplete event coverage, unintended clipping or timeline overruns. Any rendered output is an **unapproved candidate** until sound fidelity and listening checks are independently passed.

## Lead and backing vocals

```bash
python3 python/vocal_microanalysis.py "0 Lead Vocals.mp3" "1 Backing Vocals.mp3" "/private/voice-analysis" \
 "/private/actual-recorded-lead.wav" "/private/actual-recorded-backing.wav"
```

The analysis compares real and reference signal/spatial features; **the user must supply actual performed vocals** if human-recording provenance is required. No spectral processing is permitted to be labeled as a real performance or as proof of detector evasion.

## ACRCloud

Existing scans can be retrieved with **no new upload** once private environment settings `ACRCLOUD_ACCESS_TOKEN`, `ACRCLOUD_CONTAINER_ID`, and `ACRCLOUD_REGION` are configured:

```bash
python3 python/acrcloud_batch.py ".local/song-projects/interlude-x-detuned-fragments/provider"
```

New per-stem scans are **disabled** unless `ACRCLOUD_NEW_SCANS_ENABLED=true` is explicitly set in a controlled environment. Provider results are preserved verbatim with exact model IDs; a score >15% is a review warning, not proof of authorship or an instruction to manipulate waveform features.

## Master gate and downloads

`python/finalize_master.py` refuses release mastering without **all 15 prerequisite stage verifications**, genuine recorded instrument + vocal provenance, human A/B sign-off, comprehensive real ACRCloud results, a final-WAV detector review and a separately confirmed audio watermark. When fulfilled, it creates a verified 48kHz stereo 24-bit BWF with artist Jay Vale, writer/producer Jimmy Jansen, label Heartship Records and the real production date, checks metadata on the actual file, and emits a SHA256 manifest. The word “locked” does not mean cryptographic DRM.

No incomplete/placeholder file may be presented as a finished song.

## Tests and limitations

- `npm test`: GitHub Actions tests for JS security/CI and Python source syntax.
- Offline real 12-stem pass was performed on 27 November 2026 with all source files verified.
- Offline negative tests reject missing stems, wrong SHA256, missing rights, no vocal recordings and missing release evidence.
- A true 95% listener fidelity metric, complete automated pitch/event transcription and independently reconstructed **all** audio layers are not yet achieved. Continue source/performance acquisition instead of guessing.

Project production order: [SONG_PIPELINE_STANDARD.md](../SONG_PIPELINE_STANDARD.md).

