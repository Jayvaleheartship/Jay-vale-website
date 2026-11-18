# Jay Vale Audio Lab v0.7 — First-Trial Interface

**Live:** https://jayvalemusic.com/studio/audio-lab/?v=7

## Completed interface

The frontend now supports two connected workflows:

**A. Prepare a stem ZIP**
1. Open **Prepare a stem ZIP** and upload a ZIP containing up to 24 WAV, FLAC, MP3 or M4A tracks (maximum 150 MB archive). Supplied `alignment.json` start offsets are retained.
2. See each decoded track, duration, sample rate and mono/stereo type. The interface warns about duplicate files, skipped entries, oversized tracks and unsuitable formats.
3. Build a mix preview, export an aligned ZIP with WAV tracks and manifest, or select an individual track in **Choose a stem for reconstruction** and choose **Open selected stem in drum trial**.
4. The selected stem is transferred **inside the browser**, retaining its source timeline offset. Drum reconstruction accepts a maximum total of 240 seconds including offset. All original source audio is retained rather than overwritten.

**B. Rebuild drums**
1. Drag one drum WAV, MP3, FLAC, M4A or one-stem ZIP into the upload dropzone; alternatively select it using the file picker. A ZIP must contain exactly one audio recording.
2. Use a licensed real sample bank from **Private Cloudflare instrument library** or existing local bank. Connecting to Cloudflare uses the Task 3 short-lived read-only session; no long-lived credentials are written to the website. The built-in demo uses synthetic one-shots and is useful for UI validation **only**.
3. Follow the five step indicator: upload, sample bank, analysis, A/B listening, export. Recoverable file errors and status changes are shown inline.
4. After analysis, review total onsets, candidates accepted by the prototype matcher, unchanged hits and recorded-bank count. Inspect identified types, candidate confidence and the editable hit list. The application does not claim exact sample identity or human origin.
5. Listen to the original and reconstructed preview; optionally open the existing synchronized A/B analysis workspace and add timestamped notes.
6. Download `<source>-reconstructed-24bit-48k.wav`, the decoded-source reference WAV, Bitwig/ACE Studio-compatible stem ZIP, or `<source>-match-report.json` with traceability, licensing and matched hit information.

## Safeguards and limits

- Uploads remain in the user's active browser session; stems are never sent to the cloud library.
- Cloudflare sample downloads remain read-only and authenticated; test/demo sounds must not be confused with recorded samples.
- One drum stem or single-stem ZIP is limited to 240 seconds and 125 MB of decoded source upload; the 150 MB ZIP handling limit also applies.
- Full stem ZIP preparation currently supports up to 24 tracks, 300 seconds per track, 150 MB compressed and 170 MB cumulative decoded-audio memory.
- Only one source-locked drum reconstruction can be active at a time; the browser may run out of memory on long stereo files.
- A ZIP with multiple separated stems must first be loaded through **Prepare a stem ZIP** so a single target stem can be chosen. The drum dropzone intentionally rejects multi-stem ZIPs.
- Output is 24-bit PCM / 48 kHz for the new direct WAV exports. Converted files are derived from the browser-decoded source and may differ from the uploaded compressed original.
- This interface does not constitute a completed end-to-end **real user** A/B trial; that is Task 8.

## Automated verification

The GitHub Actions `Audio Lab Cloud Bridge Tests` workflow runs `npm test` in `cloudflare/sound-library`. Tests also cover:

- Static interface JS syntax, controls and live library connection panel
- ZIP archive builder/reader round-trip and checksum directory metadata
- MP3/M4A recognition in multi-stem ZIP
- Exported 24-bit stereo WAV RIFF header, sample rate and signed samples
- Rebuild report provenance, source identity, CC0 licensing and source-lock metadata
- Read-only Cloudflare proof pairing, challenge replay, tampering and invalid key rejection

Production browser acceptance used **Try demo ZIP** → selected Kick.wav → **Open selected stem in drum trial** → **Run built-in demo** → downloaded reconstructed WAV and JSON report → **Open synchronized A/B**. All six tested steps passed without errors. Demonstration generated 64 synthetic drum onsets and did not require private cloud credentials.

## Next steps

Task 4: improve pitch-aware/spectral/transient matching.
Task 5: automate real full drum-stem reconstruction.
Task 8: run a real source-locked A/B test with the user's `2 Drums.mp3` and licensed cloud samples and record listening observations.
