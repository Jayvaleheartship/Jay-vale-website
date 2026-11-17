/**
 * Verified source inventory for future collection expansion.
 * "planned" means NOT downloaded, indexed, or guaranteed to fill 128 GM instruments.
 */
export const SOURCE_REGISTRY = Object.freeze([
  {id:'boochi44_drums',name:'Boochi44 Free Drum Samples',url:'https://github.com/Boochi44/free-drum-samples',license:'CC0-1.0',manifest_files:57,kind:'drums_808',status:'import_configured',families:['drums','bass','percussion']},
  {id:'fischer_tr808',name:'Michael Fischer TR-808 (TidalCycles)',url:'https://github.com/tidalcycles/sounds-tr808-fischer',license:'CC0-1.0',manifest_files:116,kind:'analog_drums',status:'import_configured',families:['drums','percussion']},
  {id:'vcsl',name:'Versilian Community Sample Library',url:'https://github.com/sgossner/VCSL',license:'CC0-1.0',approx_wav_gb:4,kind:'multisampled_instruments',status:'planned_not_imported',families:['keys','strings','brass','woodwinds','percussion','world']},
  {id:'meta_piano',name:'Meta Open Sound — Piano',url:'https://github.com/facebookincubator/Meta-open-sound',license:'CC0-1.0',source_samples:352,kind:'88_key_4_velocity_piano',status:'planned_not_imported',families:['keys']},
  {id:'meta_nylon_guitar',name:'Meta Open Sound — Nylon Guitar',url:'https://github.com/facebookincubator/Meta-open-sound',license:'CC0-1.0',source_samples:348,kind:'multi_zone_guitar',status:'planned_not_imported',families:['guitar']},
  {id:'meta_steel_guitar',name:'Meta Open Sound — Steel Guitar',url:'https://github.com/facebookincubator/Meta-open-sound',license:'CC0-1.0',source_samples:375,kind:'multi_zone_guitar',status:'planned_not_imported',families:['guitar']},
  {id:'keyboardia_instrument_sources',name:'Keyboardia per-instrument source catalogue',url:'https://github.com/adewale/keyboardia/blob/main/app/public/instruments/LICENSE.md',license:'PER_INSTRUMENT_REVIEW',kind:'bass_brass_keys_guitars_winds_strings',status:'source_review_only',families:['bass','guitar','keys','brass','woodwinds','strings','percussion']},
  {id:'bitwig_factory',name:'User-owned Bitwig Studio factory library',url:'https://www.bitwig.com/',license:'PROPRIETARY_LOCAL_USE',kind:'installed_local_instruments_and_presets',status:'local_bridge_only_never_mirror',families:[]}
]);
