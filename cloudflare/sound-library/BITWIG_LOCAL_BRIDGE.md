# Bitwig Studio compatibility — private local bridge

The user owns a legitimate Bitwig Studio installation and sound content. **Do not copy or mirror the complete Bitwig factory catalog into Cloudflare R2 without explicit permission for that specific use.** Bitwig's published terms distinguish music created with the software from redistribution and copying of digital products.

Source: https://www.bitwig.com/terms-conditions/ — §10 Rights of use.

## Implementation plan (not yet implemented)
1. Bitwig remains installed and activated on the user's own computer. Download official Bitwig factory packages using Bitwig's licensed Package Manager.
2. A local companion service indexes only files the user explicitly selects and is permitted to process locally. Detect audio files (WAV/AIFF/FLAC/OGG), compute hashes, duration, spectral energy, pitch and transients.
3. Keep Bitwig-owned original audio and proprietary device presets on that computer. Do not transfer raw audio to R2; mark catalog entries as LOCAL_ONLY, with separate license provenance. Remote Cloudflare public database must not expose Bitwig sample files.
4. For remote/mobile matching, the Audio Lab uses R2 CC0/redistributable sounds. Where a matching Bitwig entry is local-only, a paired desktop bridge can reconstruct the sound on the local machine, not remotely on the cloud server.
5. Instrument presets/devices may depend on Bitwig's proprietary engine; match/render locally using Bitwig where lawful instead of pretending that a preset is already a WAV recording.
6. All sources are evaluated individually. Royalty-free use in a finished song is not the same as permission to redistribute raw samples or build a cloud sample service.

## CC0 Cloud Library status

The Cloudflare backend has manifests for 57 Boochi44 free drum WAV files and 116 TidalCycles/Michael Fischer TR-808 WAV files, both publicly licensed CC0 as asserted in their repositories, with pinned revisions and recorded source URLs. A scheduled importer is configured to index these recordings. Manifest inclusion is not verification that an item has reached R2: check the Worker `/health` endpoint's `sample_count` and verify R2/D1 before claiming success.

The online private R2 audio library and the user's Bitwig library must remain logically and legally separate.
