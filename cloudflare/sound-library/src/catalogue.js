/**
 * Jay Vale Sound Library taxonomy v1.
 * GM1 program numbers are 1-128, as documented at https://midi.community/docs/general-midi/
 * A catalogue entry is a TARGET, not evidence of available recorded audio.
 * Files are stored at samples/<family>/<instrument>/<sample_type>/<collection>/<sha256>.<ext>
 */
export const FAMILY_BUDGETS = Object.freeze({
  drums:2500000000,bass:1500000000,guitar:1000000000,keys:1000000000,
  synths:1000000000,strings:900000000,brass:300000000,woodwinds:300000000,
  percussion:400000000,world:300000000,vocals:200000000,effects:100000000
});
export const SAMPLE_TYPES = Object.freeze([
  'one_shot','sustain','loop','multisample','articulation','texture','phrase','impulse_response'
]);
export const INSTRUMENT_FAMILIES = Object.freeze({
  drums:['kick','kick808','snare','clap','hat','hat_closed','hat_open','tom','rimshot','brush_snare','ride','crash','cymbal','shaker','perc808','drum_machine','acoustic_kit'],
  bass:['bass808','sub_bass','electric_bass','finger_bass','picked_bass','slap_bass','fretless_bass','upright_bass','synth_bass','reese_bass','fm_bass'],
  guitar:['acoustic_guitar','nylon_guitar','steel_guitar','electric_guitar','clean_guitar','jazz_guitar','muted_guitar','overdriven_guitar','distorted_guitar','harmonics'],
  keys:['piano','grand_piano','upright_piano','electric_piano','rhodes','wurlitzer','organ','hammond_organ','harpsichord','clavinet','celesta','music_box','accordion'],
  synths:['synth_lead','synth_pad','synth_pluck','synth_keys','synth_strings','fm_synth','granular_synth','wavetable_synth','analog_synth','arpeggio','drone'],
  strings:['violin','viola','cello','contrabass','string_section','pizzicato_strings','tremolo_strings','harp','string_ensemble'],
  brass:['trumpet','muted_trumpet','trombone','tuba','french_horn','brass_section','synth_brass'],
  woodwinds:['alto_sax','soprano_sax','tenor_sax','baritone_sax','oboe','clarinet','bassoon','flute','piccolo','recorder','pan_flute','shakuhachi'],
  percussion:['conga','bongo','timbale','cowbell','tambourine','marimba','vibraphone','xylophone','glockenspiel','kalimba','steel_drum','cymbal','percussion','timpani'],
  world:['sitar','banjo','shamisen','koto','bagpipe','fiddle','oud','duduk','shanai','world_percussion'],
  vocals:['male_vocal','female_vocal','choir','vocal_phrase','vocal_chop','spoken','humming','breath'],
  effects:['risers','impacts','sweeps','foley','vinyl_crackle','noise','transitions','ambience','sound_effects']
});
const GM_ROWS = [
  ['Piano','keys',['Acoustic Grand Piano','Bright Acoustic Piano','Electric Grand Piano','Honky-tonk Piano','Electric Piano 1','Electric Piano 2','Harpsichord','Clavi']],
  ['Chromatic Percussion','percussion',['Celesta','Glockenspiel','Music Box','Vibraphone','Marimba','Xylophone','Tubular Bells','Dulcimer']],
  ['Organ','keys',['Drawbar Organ','Percussive Organ','Rock Organ','Church Organ','Reed Organ','Accordion','Harmonica','Tango Accordion']],
  ['Guitar','guitar',['Acoustic Guitar (nylon)','Acoustic Guitar (steel)','Electric Guitar (jazz)','Electric Guitar (clean)','Electric Guitar (muted)','Overdriven Guitar','Distortion Guitar','Guitar harmonics']],
  ['Bass','bass',['Acoustic Bass','Electric Bass (finger)','Electric Bass (pick)','Fretless Bass','Slap Bass 1','Slap Bass 2','Synth Bass 1','Synth Bass 2']],
  ['Strings','strings',['Violin','Viola','Cello','Contrabass','Tremolo Strings','Pizzicato Strings','Orchestral Harp','Timpani']],
  ['Ensemble','strings',['String Ensemble 1','String Ensemble 2','SynthStrings 1','SynthStrings 2','Choir Aahs','Voice Oohs','Synth Voice','Orchestra Hit']],
  ['Brass','brass',['Trumpet','Trombone','Tuba','Muted Trumpet','French Horn','Brass Section','SynthBrass 1','SynthBrass 2']],
  ['Reed','woodwinds',['Soprano Sax','Alto Sax','Tenor Sax','Baritone Sax','Oboe','English Horn','Bassoon','Clarinet']],
  ['Pipe','woodwinds',['Piccolo','Flute','Recorder','Pan Flute','Blown Bottle','Shakuhachi','Whistle','Ocarina']],
  ['Synth Lead','synths',['Lead 1 (square)','Lead 2 (sawtooth)','Lead 3 (calliope)','Lead 4 (chiff)','Lead 5 (charang)','Lead 6 (voice)','Lead 7 (fifths)','Lead 8 (bass + lead)']],
  ['Synth Pad','synths',['Pad 1 (new age)','Pad 2 (warm)','Pad 3 (polysynth)','Pad 4 (choir)','Pad 5 (bowed)','Pad 6 (metallic)','Pad 7 (halo)','Pad 8 (sweep)']],
  ['Synth Effects','synths',['FX 1 (rain)','FX 2 (soundtrack)','FX 3 (crystal)','FX 4 (atmosphere)','FX 5 (brightness)','FX 6 (goblins)','FX 7 (echoes)','FX 8 (sci-fi)']],
  ['Ethnic','world',['Sitar','Banjo','Shamisen','Koto','Kalimba','Bag pipe','Fiddle','Shanai']],
  ['Percussive','percussion',['Tinkle Bell','Agogo','Steel Drums','Woodblock','Taiko Drum','Melodic Tom','Synth Drum','Reverse Cymbal']],
  ['Sound Effects','effects',['Guitar Fret Noise','Breath Noise','Seashore','Bird Tweet','Telephone Ring','Helicopter','Applause','Gunshot']]
];
export function slug(value) { return String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,64); }
export function collectionSlug(value) {return slug(value).slice(0,48);}
export function sampleKey({family,instrument,sample_type='one_shot',source_name},sha256,extension='wav') {
  if(!Object.hasOwn(FAMILY_BUDGETS,family))throw Error('Unknown family');
  if(!/^[a-z][a-z0-9_]{1,40}$/.test(instrument))throw Error('Invalid instrument');
  if(!SAMPLE_TYPES.includes(sample_type))throw Error('Unknown sample type');
  if(!/^[0-9a-f]{64}$/.test(sha256))throw Error('Invalid audio hash');
  if(!['wav','flac','mp3','ogg'].includes(extension))throw Error('Invalid extension');
  return 'samples/'+family+'/'+instrument+'/'+sample_type+'/'+collectionSlug(source_name||'unknown')+'/'+sha256+'.'+extension;
}
export const GM_PROGRAMS = Object.freeze(GM_ROWS.flatMap(([group,family,names],groupIndex)=>
  names.map((label,i)=>({program:groupIndex*8+i+1,group,family,label,id:'gm_'+String(groupIndex*8+i+1).padStart(3,'0')+'_'+slug(label)}))
));
export const GM_PERCUSSION = Object.freeze((
  ['Acoustic Bass Drum','Bass Drum 1','Side Stick','Acoustic Snare','Hand Clap','Electric Snare','Low Floor Tom','Closed Hi Hat','High Floor Tom','Pedal Hi-Hat','Low Tom','Open Hi-Hat','Low-Mid Tom','Hi-Mid Tom','Crash Cymbal 1','High Tom','Ride Cymbal 1','Chinese Cymbal','Ride Bell','Tambourine','Splash Cymbal','Cowbell','Crash Cymbal 2','Vibraslap','Ride Cymbal 2','Hi Bongo','Low Bongo','Mute Hi Conga','Open Hi Conga','Low Conga','High Timbale','Low Timbale','High Agogo','Low Agogo','Cabasa','Maracas','Short Whistle','Long Whistle','Short Guiro','Long Guiro','Claves','Hi Wood Block','Low Wood Block','Mute Cuica','Open Cuica','Mute Triangle','Open Triangle']
).map((label,i)=>({midi_note:35+i,label,id:'gm_drum_'+(35+i)+'_'+slug(label)})));
export function catalogueTemplate() {
 return {
  schema_version:1,
  meaning:'Targets only. Indexed sample counts must come from the actual D1 database.',
  families:Object.entries(INSTRUMENT_FAMILIES).map(([id,instruments])=>({id,storage_budget_bytes:FAMILY_BUDGETS[id],instruments:instruments.map(x=>({id:x,label:x.split('_').map(w=>w==='808'?'808':w[0].toUpperCase()+w.slice(1)).join(' ')}))})),
  sample_types:SAMPLE_TYPES,
  general_midi:{programs:GM_PROGRAMS,percussion:GM_PERCUSSION}
 };
}
