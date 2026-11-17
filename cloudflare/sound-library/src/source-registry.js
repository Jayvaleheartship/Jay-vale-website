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
  {id:'discord_gm_selected',name:'Discord SFZ GM — reviewed CC0 instruments',url:'https://github.com/sfzinstruments/Discord-SFZ-GM-Bank',license:'CC0-1.0 (per instrument SFZ)',manifest_files:49,kind:'piano_electric_bass_steel_guitar',status:'import_configured',families:['bass','guitar','keys']},
  {id:'vcsl_expansion',name:'VCSL — CC0 instrument starter set',url:'https://github.com/sgossner/VCSL',license:'CC0-1.0',manifest_files:33,kind:'pianos_fm_synth_mallets',status:'import_configured',families:['keys','synths','percussion']},
  {id:'vsco2_expansion',name:'VSCO 2 Community Edition — CC0 orchestra and percussion',url:'https://github.com/sgossner/VSCO-2-CE',license:'CC0-1.0',manifest_files:51,kind:'strings_brass_woodwinds_drums',status:'import_configured',families:['strings','brass','woodwinds','drums','percussion']},
  {id:'classic_0x808',name:'0x808 bundled CC0 classic drum machines',url:'https://github.com/averagenative/0x808',license:'CC0-1.0 (bundled samples)',manifest_files:42,kind:'tr808_tr909',status:'import_configured',families:['drums','percussion']},
  {id:'bitwig_factory',name:'User-owned Bitwig Studio factory library',url:'https://www.bitwig.com/',license:'PROPRIETARY_LOCAL_USE',kind:'installed_local_instruments_and_presets',status:'local_bridge_only_never_mirror',families:[]}
]);
