# Jay Vale Audio Lab v0.8 — Conservative Sample Matching

## Completed implementation

- The static browser app at https://jayvalemusic.com/studio/audio-lab/?v=8 loads `drum-matcher.js`, a pure JavaScript drum-hit ranking engine. All recording analysis and matching happen locally in the browser; a source stem is **not** uploaded to Cloudflare for matching.
- The first-stage legacy signature contributes a normalized 31-value acoustic feature vector including low/mid/high energy and two attack/decay spectral snapshots.
- The new engine adds a time-domain RMS envelope (eight 25 ms bins), onset-to-peak attack time, post-peak decay time, spectral weighting and estimated low-frequency fundamental from a downsampled normalized autocorrelation search. It handles octave ambiguity by choosing an early strong periodicity peak.
- Low-frequency candidate tuning is compared in semitones when the source and recording provide reliable tonal evidence; a clear mismatch greater than two semitones is rejected.
- Candidate ranking also uses conservative articulation heuristics for explicit open/closed hi-hat and brush/rim label evidence. Open/closed conflicts between measured short/long decay and recorded articulation can reject otherwise close sounds. This is **not** full automatic identification of every articulation.
- Hard acceptance gates check normalized score (strict threshold 0.26), a very-close exception (0.115), instrument-family margin (0.055), spectral discrepancy and tonal/articulation conflicts. If no sound passes, the decision is `Uncertain`, replacement choice is `Source`, and source-locked audio remains untouched. The score is a **relative heuristic**, not a calibrated probability or an accuracy percentage.
- Each hit now records `reason`, `matcher`, `distance`, `margin`, `confidence`, ranked alternatives and original onset position; the UI shows a visible **Match decision** column and JSON export retains provenance.
- The licensed cloud drum selector now requests `drums`, `percussion` **and** `bass`, including `bass808` and `sub_bass` material among conventional kicks. The cloud catalogue still requires read-only authenticated connection; do not embed or share credentials. Local sample ZIP indexing recognizes 808/sub-bass filenames.

## Repeatable checks and limitations

- GitHub Actions `Audio Lab Cloud Bridge Tests` runs `npm test`, including `drum-matcher.test.mjs` with synthetic positive/negative/cross-family examples, 46/55/60/82/105/140 Hz pitch checks, wrong-pitch rejection, ambiguous instrument rejection, silence rejection, hi-hat articulation and actual `classifyHits` integration. The suite also retains security, ZIP and audio export tests.
- The live browser v0.8 tested public-source installation of 33 licensed real recordings (Virtuosity Drums and Salamander Drumkit), then built a **recorded-bank calibration loop** and used the advanced matching pathway on that loop: four detected onsets, four close matches, two ready comparison players and WAV/JSON export controls. This only proves correct wiring with actual recordings; it does not provide an independent accuracy score because the loop was composed from the sample bank itself. Another synthetic-fixture test retained all 64 conventional demo onsets.
- The full 309-sample private Cloudflare set remains indexed in R2/D1 but the user's personal READ_TOKEN has not been entered into a shared test browser; a direct 808 download and user-device read-only connection remain manual acceptance for Task 3.
- Onsets inside dense overlapping or heavily compressed real drum stems may have unreliable features; exact original instrument identification is **not guaranteed**, nor is any claimed 95% audible similarity. A/B listening using the user's real `2 Drums.mp3` and documented error analysis is Task 8. More robust onset separation and performance on long stems is Task 5.

## First-trial success criteria

1. Run `npm test` via GitHub Actions; fail the task if any assertion fails.
2. Confirm published `drum-matcher.js` and Audio Lab v0.8 serve successfully and the detected-hit table contains the Match decision field.
3. Connect licensed cloud/local samples, load a real drum stem, and evaluate mismatches and retained original hits without forcing substitutions.
4. Review equal-loudness A/B, rhythm alignment and listener feedback. A detector score cannot establish human provenance.

The current task 4 implementation and internal recorded-bank integration are verified; **step 3 with the user's own song is still deliberately open under Task 8**.
