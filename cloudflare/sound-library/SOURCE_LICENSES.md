# Jay Vale Sound Library — CC0 source provenance

> Source manifests are **candidates for ingestion**, not proof of files stored in R2. The definitive completion check is the live Cloudflare Worker health audit of R2/D1 and `source_entries_processed`.

## Current source manifest (348 audio entries)

| Source | Pinned revision | Source entries | License evidence | Content |
|---|---|---:|---|---|
| Boochi44 Free Drum Samples | `77ba31428a079dd8f17c8e144c1e649ea0a198b3` | 57 | [Repository README](https://github.com/Boochi44/free-drum-samples/blob/main/README.md) declares CC0 | Trap, 808 bass, snare, clap, hats |
| Michael Fischer TR-808 via TidalCycles | `85fbecf1bec32553395625ea659e2a56dfd7c0e1` | 116 | [CC0 license](https://github.com/tidalcycles/sounds-tr808-fischer/blob/main/LICENSE) | Full classic TR-808 sample set |
| Discord SFZ GM Bank — selected instruments only | `7a9c478fe331f94f246d33332f0adedb25bbbe27` | 49 | Each of the four selected `.sfz` instrument definitions specifies **CC0**: electric grand piano, electric piano 1, acoustic steel guitar, electric finger bass. Other bank instruments are not automatically approved. | Steel guitar, electric bass, electric pianos |
| Versilian Community Sample Library (VCSL) | `c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e` | 33 | [VCSL CC0 license](https://github.com/sgossner/VCSL/blob/master/LICENSE) | Steinway piano, FM synthesizers, mallets |
| Versilian VSCO 2 Community Edition | `440300901dfe9275fd84e0b7763af1f8443ae62e` | 51 | [VSCO CC0 license](https://github.com/sgossner/VSCO-2-CE/blob/master/LICENSE) | Violin, cello, contrabass, trumpet, clarinet, flute, acoustic percussion |
| 0x808 CC0 bundled drum machines | `7ec80a726cc6845d21912726fb0c134ddfa537fb` | 42 | [README, Bundled Samples](https://github.com/averagenative/0x808#bundled-samples) describes bundled samples as CC0; MIT source-code license is separate | 26 TR-808 plus 16 TR-909 recordings |

The import deduplicates by SHA-256; the unique stored WAV count can be lower than the 348 source entries. All original WAV files are stored privately under their family/instrument/sample type/variant/source collection prefixes. D1 stores source URLs, license, SHA-256, duration, rate, acoustic features, and verified MIDI pitch/velocity where available.

## Not automatically approved

- Bitwig Studio factory instruments and sample packs belong to the user's licensed local installation; no mass R2 mirror without explicit permission from the rightsholder.
- LANDR and ordinary royalty-free commercial libraries are **not** assumed to permit building a private sample database for an audio reconstruction service.
- More sources such as Meta Open Sound piano and guitars are *future imports* and require an individual ingestion format and metadata audit.

## Verification requirements

1. The live `/health` endpoint must report `cc0_manifest_items=348`.
2. `source_entries_processed=348` (imported and duplicates) and the final cron batch must report 0 errors.
3. `r2_integrity.complete=true` and `r2_integrity.verified=true`, `matched=sample_count`, 0 missing, mismatched or unindexed objects.
4. Check `family_counts` to confirm bass/guitar/keys/synth/strings/brass/woodwinds/drum categories have actual audio.
5. Record any gaps in note range, velocity, articulation and sample quality as later work; don't equate full catalogue names with multisampled instrument completeness.
