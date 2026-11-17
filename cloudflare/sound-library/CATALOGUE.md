# Jay Vale — Private Instrument Catalogue v1

This catalogue is part of the **live Cloudflare Worker source** in `src/catalogue.js`. It is distinct from the separate public music website. Do not expose R2 audio files or read/admin secrets in a browser.

## Folder keys

Cloudflare R2 stores objects by string key, not physical directories. Prefixes produce the folder view in the dashboard.

```text
samples/
  drums/kick/one_shot/tr808/michael-fischer-tr-808-tidalcycles-cc0/<sha256>.wav
  drums/snare/one_shot/hard_trap/boochi44-free-drum-samples/<sha256>.wav
  drums/hat/one_shot/tr808_open/michael-fischer-tr-808-tidalcycles-cc0/<sha256>.wav
  bass/bass808/one_shot/hard_trap/boochi44-free-drum-samples/<sha256>.wav
  bass/electric_bass/multisample/finger/<collection>/<sha256>.wav
  guitar/nylon_guitar/multisample/sustain/<collection>/<sha256>.wav
  keys/piano/multisample/velocity_layer_3/<collection>/<sha256>.wav
  synths/synth_pad/loop/warm/<collection>/<sha256>.wav
  strings/violin/articulation/pizzicato/<collection>/<sha256>.wav
```

The naming rule is `samples/<family>/<instrument>/<sample_type>/<variant>/<source_collection>/<sha256>.<extension>`.
Original filenames, human-friendly instrument names, source rights, pitch, velocity, and spectral fingerprints belong in D1 records. Hash-based keys avoid collisions; metadata still preserves the original file name. Existing legacy R2 sample keys remain readable.

## Families / budgets

| Family | Budget (GB) |
|---|---:|
| Drums | 2.5 |
| Bass (808 and acoustic) | 1.5 |
| Guitar | 1.0 |
| Keys | 1.0 |
| Synths | 1.0 |
| Strings | 0.9 |
| Brass | 0.3 |
| Woodwinds | 0.3 |
| Percussion | 0.4 |
| World | 0.3 |
| Vocals | 0.2 |
| Effects | 0.1 |
| **Combined soft budget** | **9.5** |

The software's 9.5GB cap is not a Cloudflare spending limit. This allocation can be adjusted after real use. Do not assume the free tier includes unbounded requests, CPU, or database operations.

## Catalogue versus available recordings

- **General MIDI reference:** 128 melodic instruments (16 groups of 8), plus the 47 standard GM1 drum notes 35–81.
- **Additional contemporary descriptors:** 131 target entries across 12 families, including 808, reese bass, granular, organ, world sounds, vocal material and drum types.
- These are *catalogue targets only*. The actual audio availability is determined by D1 records. The source manifests list 173 CC0 WAVs but these are not proof the files were successfully stored.
- A category can be **unfilled**, **source found**, or **indexed**. All searchable recordings must be marked `indexed` only if they have a matching R2 object and D1 metadata.
- **Do not confuse complete instrument names with complete instrument sample coverage.** A full playable instrument may require many note samples and articulations.

## Candidate freely licensed instrument collections

| Source | Licence | Scope | Current state |
|---|---|---|---|
| Boochi44 Free Drum Samples | CC0 1.0 | 57 source WAV files: trap, bounce, vintage, 808s | In importer manifest |
| Michael Fischer TR-808 (TidalCycles) | CC0 1.0 | 116 samples of analog drum machine | In importer manifest |
| Versilian Community Sample Library | CC0 1.0 | ~4GB WAV multi-instrument collection, many keys/strings/brass/winds/world instruments | Planned, not imported |
| Meta Open Sound Piano | CC0 1.0 | 352 note/velocity recordings | Planned, not imported |
| Meta Open Sound Nylon Guitar | CC0 1.0 | 348 recordings | Planned, not imported |
| Meta Open Sound Steel Guitar | CC0 1.0 | 375 recordings | Planned, not imported |
| Keyboardia source catalogue | Individual source licences | Curated individual electric bass, slap bass, brass, woodwind, keyboard, guitar | Review per instrument |
| User-owned Bitwig Studio | Proprietary | Factory sounds/presets available inside licensed local installation | Local-only bridge, never mirror to R2 without authorization |

Documentation: https://github.com/sgossner/VCSL , https://github.com/facebookincubator/Meta-open-sound , https://github.com/adewale/keyboardia/blob/main/app/public/instruments/LICENSE.md .

## API and privacy

`GET /v1/catalog` requires **READ_TOKEN** or **ADMIN_TOKEN**. It returns catalogue targets, actual indexed counts grouped by family/type, grouped original source collections, and approved candidate sources. There is no public sample catalogue or sample download endpoint.

`GET /v1/match` and `GET /v1/samples/:id` stay protected. Never write private tokens into the public website JavaScript; a future paired user-authenticated session should proxy authorized catalogue queries. `/health` publishes counts only as a basic connectivity check.

## Rollout

1. Verify import cron and migrations. The `/health` endpoint reports `sample_count` and an importer status.
2. Index first CC0 drums and 808s and inspect object key prefixes in the R2 dashboard.
3. Add priority instruments (finger/slap bass, electric/acoustic guitars, piano, synths, strings) from separately verified licenses and assign family budgets.
4. Add sample-quality validation, pitch/velocity parsing, duplicate detection and source-locked reconstruction tests.
5. Keep the entire Bitwig factory collection local to the user's licensed installation rather than copying into R2.
