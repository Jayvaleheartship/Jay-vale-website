import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createSongProject,slugify,STAGES} from '../scripts/new-song-project.mjs';
import {detectionFlag,verifyStageOrder,releaseBlockers} from '../scripts/song-quality-gates.mjs';

test('every new song has 16 fixed stages and six project records without fake outputs',async(t)=>{
  const base=await mkdtemp(join(tmpdir(),'jay-vale-song-'));
  t.after(()=>rm(base,{recursive:true,force:true}));
  const {projectDir,slug,files}=await createSongProject('Everything I Thought I Knew',
    {outputRoot:base,createdDate:'2026-11-27'});
  assert.equal(slug,'everything-i-thought-i-knew');
  assert.equal(files.length,6);
  assert.deepEqual((await readdir(projectDir)).sort(),files.sort());
  const manifest=JSON.parse(await readFile(join(projectDir,'project.json'),'utf8'));
  assert.equal(manifest.created_date,'2026-11-27');
  assert.equal(manifest.artist,'Jay Vale');
  assert.equal(manifest.writer,'Jimmy Jansen');
  assert.equal(manifest.producer,'Jimmy Jansen');
  assert.equal(manifest.label,'Heartship Records');
  assert.equal(manifest.stages.length,16);
  assert.ok(manifest.stages.every(x=>x.status==='pending'));
  assert.equal(manifest.acceptance_targets.ai_detection_red_flag_above_percent,15);
  assert.equal(manifest.acceptance_targets.instrumental_similarity_percent,95);
  assert.equal(manifest.output.final_wav,null);
  assert.equal(manifest.output.download_link,null);
  assert.equal((await readFile(join(projectDir,'CHECKLIST.md'),'utf8')).match(/- \[ \] \*\*[0-9]{2} — /g).length,16);
  assert.match(await readFile(join(projectDir,'SAMPLE_REQUESTS.csv'),'utf8'),/commercial_rights_verified/);
  assert.match(await readFile(join(projectDir,'STEM_REGISTER.csv'),'utf8'),/stereo_mid_side_report/);
  assert.match(await readFile(join(projectDir,'DETECTION_LOG.csv'),'utf8'),/red_flag_above_15/);
  await assert.rejects(createSongProject('Everything I Thought I Knew',
    {outputRoot:base,createdDate:'2026-11-27'}),/EEXIST/);
  await assert.rejects(stat(join(projectDir,'final-master.wav')));
});
test('titles are sanitized as safe directory slugs',()=>{
  assert.equal(slugify('  Échos / Mother?  '),'echos-mother');
  assert.throws(()=>slugify('../'));
  assert.throws(()=>slugify(' '));
  assert.throws(()=>slugify('☀️'));
  assert.equal(STAGES[0][0],'00');
  assert.equal(STAGES.at(-1)[0],'15');
});
test('15 percent is a strictly-greater-than red REVIEW flag, not proof',()=>{
  assert.equal(detectionFlag(15),'BELOW_REVIEW_THRESHOLD');
  assert.equal(detectionFlag(14.99),'BELOW_REVIEW_THRESHOLD');
  assert.equal(detectionFlag(15.01),'RED_FLAG');
  assert.equal(detectionFlag(99.22),'RED_FLAG');
  for(const x of [null,undefined,'',NaN,-1,101,'14.4'])
    assert.equal(detectionFlag(x),'UNKNOWN');
  assert.throws(()=>detectionFlag(10,-1));
});
function completeStage(index){
  return {id:String(index).padStart(2,'0'),name:'Stage '+index,
    status:'verified',evidence:['verified-analysis-'+index+'.json'],
    verified_at:'2026-11-27T15:00:00+01:00',blocking_reasons:[]};
}
test('ordered verification blocks skipped stages and undocumented completion',()=>{
  const stages=Array.from({length:16},(_,i)=>completeStage(i));
  assert.deepEqual(verifyStageOrder(stages),[]);
  stages[3].status='pending';
  assert.ok(verifyStageOrder(stages).some(x=>x.includes('04 verified')));
  stages[3].status='verified';
  stages[3].evidence=[];
  assert.ok(verifyStageOrder(stages).some(x=>x.includes('Stage 03 has no dated verification')));
});
test('release gate cannot pass simply from low detector scores; source evidence is mandatory',()=>{
  const base={stages:Array.from({length:16},(_,i)=>completeStage(i)),
    stem_files:[{id:'drums'},{id:'lead-vocal'}],
    source_disclosure:{real_vocals:'verified_human_recordings',
      instrumental_recordings:'verified_recordings'},
    output:{final_wav:'final-master.wav',sha256:'a'.repeat(64),
      embedded_metadata_verified:true,live_full_song_scan_verified:true}};
  const scores=[
    {stem_id:'drums',version:'original',ai_probability:99.22},
    {stem_id:'drums',version:'rebuilt',ai_probability:8.1},
    {stem_id:'lead-vocal',version:'original',ai_probability:98.7},
    {stem_id:'lead-vocal',version:'rebuilt',ai_probability:9.7}
  ];
  // The expected AI-generated SOURCE stems are baselines, not grounds to
  // declare the genuine rebuilt stem fraudulent.
  assert.deepEqual(releaseBlockers(base,{stemResults:scores,
    finalResults:[{ai_probability:11.9}]}),[]);
  assert.ok(releaseBlockers({...base,source_disclosure:{
    real_vocals:'pending',instrumental_recordings:'verified_recordings'}},
    {stemResults:scores,finalResults:[{ai_probability:4}]}).some(x=>x.includes('Human')));
  assert.ok(releaseBlockers(base,{stemResults:scores.map(x=>x.stem_id==='drums'&&x.version==='rebuilt'
    ?{...x,ai_probability:15.01}:x),
    finalResults:[{ai_probability:11.9}]}).some(x=>x.includes('Red detector')));
  assert.ok(releaseBlockers(base,{stemResults:scores,
    finalResults:[{ai_probability:16}]}).some(x=>x.includes('Final WAV flagged')));
  assert.ok(releaseBlockers({...base,output:{...base.output,final_wav:null}},
    {stemResults:scores,finalResults:[{ai_probability:5}]}).some(x=>x.includes('verified final WAV')));
});
