# Jay Vale Audio Lab — Reconstruction self-check v0.1 (offline branch)

Updated: 18 November 2026. This is development-only on `audio-lab/task5-offline-20261118`, not a production deployment. **Do not merge or trigger Netlify until its credits are available again and the user approves the release.**

## What was built

- `studio/audio-lab/drum-audit.js`: deterministic client-side PCM source-reference audit; source stays local.
- `studio/audio-lab/index.html`: after a drum reconstruction, checks the output against the decoded source; shows a quality status and inspectable hit table. Automatic candidate layers with severe mismatches revert to `Source` before the second bounded render. Manual edit results remain visible and are never silently changed; a critical unresolved result blocks reconstructed WAV/ZIP export but **A/B diagnosis and original source export remain available**.
- JSON match report now records `processing.quality_audit`, full per-hit metrics and automatic rollback count. ZIP manifest records a compact quality summary.
- CI workflow watches both matcher and audit JS files and runs tests offline on GitHub Actions.

## Measurements and deliberately conservative limits

| Measurement | Method | Result interpretation |
|---|---|---|
| Frame alignment | Same original and output channel/frame lengths | Exact dimension equality; not proof of perceptual alignment |
| Attack | 5 ms RMS envelope onset to peak within individual hit window | Warn for >10 ms delta, fail for >20 ms delta if window >=70 ms |
| Audible length/decay | End of above-threshold envelope, 18% of hit peak | Warn for >35 ms delta; show **unknown** if a hit tail is truncated by the next hit or 180 ms window |
| Frequency character | Three approximate IIR band energies (below ~220 Hz, ~220–3800 Hz, above ~3800 Hz) | Warn if total-variation band difference >0.15; fail above 0.32 |
| Loudness | 20 log10 of isolated hit RMS ratio | Warn above 1 dB, fail above 3 dB |
| Waveform | Source/render cosine correlation over original sample positions | Fail if correlation below 0.80 |
| Audio integrity | Whole-song reconstructed vs original comparison | Frame-aligned channels, peak, nonfinite samples, newly added >=0.999 clipping; loudness of residual component |

Each hit window stops before the next detected onset or after 180 ms. A collision can therefore obscure a true decay, and the audit must not report a definitive duration in that case. The 0.15/0.32 and 1/3 dB thresholds are **pilot engineering gates, not empirically calibrated human listening thresholds**. The code does not claim 95% similarity, true source instrument recovery, or whether the performance was created by a person.

When a sample fails, the fallback is to preserve the source, not to fabricate a different recorded instrument. A result of `original-only` means **no rebuilt sample was validated**, not reconstruction success. The source-preserving render already keeps the original decoded PCM; a 24-bit WAV export necessarily re-encodes the signal.

## Verification

- GitHub Actions offline branch run [44382075486](https://github.com/Jayvaleheartship/Jay-vale-website/actions/runs/44382075486): **38/38 Node tests passed** (previous 26 plus 12 new self-check regression tests). Checks include source identity, minor additions, audible-level failure, manual preference, 30 ms onset offset, contrasting low/high timbre, decay/truncation, stereo anti-phase, clipping, frame mismatch and multiple events.
- Private original `2 Drums.mp3` was decoded locally to 48 kHz stereo PCM, **193.104 seconds**, no upload to public repository. Offline transcription using the 5 ms stereo-energy + high-frequency novelty onset algorithm found **773 onset candidates**. An independent per-hit analysis measured:
  - attack p10 / median / p90: **0 / 5 / 25 ms**;
  - duration p10 / median / p90 on **396 non-truncated candidate windows**: **20 / 55 / 165 ms**;
  - **377 hits had an incomplete/truncated decay window** and must remain `unknown` for definitive hit length.
  - ~173 adjacent candidate intervals were below 60 ms; this does not validate precise ground truth.
- The original MP3 header is misleading about duration: some inspection methods estimate about 844 seconds; full PCM decoding verifies the actual 193.104 seconds. This fits Audio Lab's 240-second decoded limit.
- No cloud READ_TOKEN was handled. There is **no full real-recorded-bank in-browser A/B reconstruction** or human listening acceptance for the user's `2 Drums.mp3` yet. This is the remaining Task 5/8 gate.

## Future verification gate

1. Load user's real `2 Drums.mp3` into the development build and a legally usable recorded sample bank.
2. Inspect ambiguous overlapping hits, per-event matcher selections, false positives/negatives and audit fallbacks. Benchmark memory on mobile and desktop.
3. Export and listen to level-matched source and rebuilt tracks, document false rejections, musical timing, attack, decay and artifacts.
4. Keep production untouched until Netlify credits refresh / deployment is specifically authorized.

## User's actual drum ZIP: offline MP3 comparison (18 November 2026)

See the trial checklist for full provenance. The ZIP contains only the original `2 Drums.mp3`; it has no separate recordings. We used isolated user-owned transient snippets from the same MP3 for a cautious **source-locked** sample-layer test. Of 773 possible detected hits, 554 were matched to a temporary same-song snippet bank, 15 sample layers failed source-reference QC and were reverted, leaving 539 applied. **This is a real-sound technical reconstruction test, not independent instrument reconstruction, not a 99% perceptual score, and not proof of human playing**.

Two exported 320-kbps stereo MP3s independently decode to 193.104 seconds/9,268,992 frames at 48 kHz. Output samples differ. Original-to-rebuild post-MP3 waveform correlation 0.9900247, residual relative level -16.83 dB, 0 new clipped samples. Both files and the full private JSON hit report were returned through the conversation, never placed in public GitHub. Still pending: human listening and independent licensed recorded-bank test under Tasks 5/8. No Netlify deployment.
