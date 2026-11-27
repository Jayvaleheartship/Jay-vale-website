/**
 * Create a fresh, private Jay Vale Audio Lab workspace for ONE song.
 * Never stores or publishes actual lyrics, stems or tokens in GitHub Pages.
 * Usage: node scripts/new-song-project.mjs "Song title"
 */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const soundLibraryDir=resolve(here,'..');
export const STAGES=Object.freeze([
  ['00','Create project and credits'],
  ['01','Write lyrics and music'],
  ['02','Record Suno reference draft and provenance'],
  ['03','Ingest complete original stem batch'],
  ['04','Verify integrity, offsets and audio format'],
  ['05','Analyze each stem at event and micro-signal level'],
  ['06','Identify and license matching recordings'],
  ['07','Reconstruct all instrumental stems'],
  ['08','Verify instrumental A/B fidelity and quality'],
  ['09','Capture and match human lead and backing vocals'],
  ['10','Scan original and rebuilt stems with the authorized detector'],
  ['11','Review stem-level flags and source evidence'],
  ['12','Mix and render lossless final WAV candidate'],
  ['13','Scan final WAV and review classification'],
  ['14','Embed truthful metadata and verify master'],
  ['15','Archive and deliver verified downloadable file']
]);

export function safeTitle(title){
  if(typeof title!=='string')throw Error('Song title must be text');
  const clean=title.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
  if(!clean || clean.length>120)throw Error('Song title must contain 1–120 visible characters');
  return clean;
}
export function slugify(title){
  const slug=safeTitle(title).normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,72)
    .replace(/-+$/,'');
  if(!slug)throw Error('Song title must include at least one ASCII letter or number');
  return slug;
}
export function localDate(){
  return new Intl.DateTimeFormat('en-CA',{
    year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Amsterdam'
  }).format(new Date());
}
function csvRow(fields){
  return fields.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')+'\n';
}

/** No source audio or score is invented; all stages start pending. */
export async function createSongProject(title,{outputRoot,createdDate}={}){
  const clean=safeTitle(title),slug=slugify(clean);
  const date=createdDate||localDate();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Date must be YYYY-MM-DD');
  const base=resolve(outputRoot||join(soundLibraryDir,'.local','song-projects'));
  const projectDir=join(base,slug);
  await mkdir(base,{recursive:true});
  await mkdir(projectDir,{recursive:false}); // Never overwrite an existing song.
  const template=await readFile(join(soundLibraryDir,'SONG_CHECKLIST_TEMPLATE.md'),'utf8');
  const checklist=template
    .replaceAll('{{SONG_TITLE}}',clean.replace(/([*_{}\[\]<>])/g,'\\$1'))
    .replaceAll('{{PROJECT_SLUG}}',slug)
    .replaceAll('{{CREATED_DATE}}',date);
  const manifest={
    schema:'jay-vale-song-project-v1',song_id:slug,title:clean,
    created_date:date,timezone:'Europe/Amsterdam',status:'pending',
    artist:'Jay Vale',writer:'Jimmy Jansen',producer:'Jimmy Jansen',
    label:'Heartship Records',
    source_disclosure:{lyrics:'user written',melody:'to be verified',
      suno_draft:'pending',real_vocals:'pending',instrumental_recordings:'pending'},
    reference_files:[],stem_files:[],source_sample_ids:[],
    acceptance_targets:{
      instrumental_similarity_percent:95,
      similarity_calibration:'NOT_DEFINED — perceived sound similarity target, not a verified metric',
      ai_detection_red_flag_above_percent:15,
      ai_threshold_purpose:'review_only_not_authorship_proof',
      vocal_real_performance_required:true,
      final_audio:{container:'WAV/BWF',sample_rate_hz:48000,bit_depth:24,channels:2}
    },
    stages:STAGES.map(([id,name])=>({id,name,status:'pending',
      verified_at:null,evidence:[],blocking_reasons:[]})),
    output:{
      final_wav:null,sha256:null,embedded_metadata_verified:false,
      optional_watermark_verified:false,download_link:null,
      live_full_song_scan_verified:false
    }
  };
  const files={
    'CHECKLIST.md':checklist,
    'project.json':JSON.stringify(manifest,null,2)+'\n',
    'STEM_REGISTER.csv':csvRow([
      'stem_id','role','original_file','original_sha256','rebuild_file',
      'rebuild_sha256','sample_rate_hz','bit_depth','codec','channels',
      'duration_sec','start_offset_sec','spectral_report','onsets_report',
      'pitch_report','loudness_report','stereo_mid_side_report',
      'phase_report','source_provenance','similarity_method','similarity_value',
      'listening_approved','notes'
    ]),
    'SAMPLE_REQUESTS.csv':csvRow([
      'request_id','stem_id','event_time_sec','instrument_or_sound',
      'desired_pitch','desired_articulation','target_envelope','target_timbre',
      'existing_library_checked','candidate_url','license','attribution_required',
      'downloaded_filename','sha256','commercial_rights_verified',
      'status','notes'
    ]),
    'DETECTION_LOG.csv':csvRow([
      'scan_id','stem_id','version_original_or_rebuilt','analysis_date',
      'provider','model_id','stem_label','window_start_sec','window_end_sec',
      'prediction','likely_source','ai_probability','red_flag_above_15',
      'source_probabilities_json','report_file','reviewed','review_notes'
    ]),
    'DELIVERY.md':[
      '# '+clean+' — Delivery verification','',
      '- Master WAV: NOT CREATED',
      '- File SHA-256: NOT VERIFIED',
      '- Embedded artist: Jay Vale — NOT VERIFIED',
      '- Embedded writer/producer: Jimmy Jansen — NOT VERIFIED',
      '- Label/rights-holder field: Heartship Records — NOT VERIFIED',
      '- BWF creation/master date: NOT VERIFIED',
      '- Optional verified watermark: NOT APPLIED',
      '- Final ACRCloud report: NOT AVAILABLE',
      '- Download URL: NOT AVAILABLE','',
      'A working link may be added only when the actual file exists and is verified.',
      'Below-15 AI probability is an internal review target, not evidence of sole human origin.',''
    ].join('\n')
  };
  for(const [name,content] of Object.entries(files)){
    await writeFile(join(projectDir,name),content,{flag:'wx'});
  }
  return {projectDir,slug,files:Object.keys(files)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  const outIndex=args.indexOf('--out');
  const outputRoot=outIndex<0?undefined:args[outIndex+1];
  if(outIndex>=0)args.splice(outIndex,2);
  const title=args.join(' ');
  createSongProject(title,{outputRoot}).then(result=>{
    process.stdout.write('Created private per-song checklist: '+result.projectDir+'\n');
  }).catch(error=>{
    process.stderr.write('Cannot create song project: '+error.message+'\n');
    process.exitCode=1;
  });
}
