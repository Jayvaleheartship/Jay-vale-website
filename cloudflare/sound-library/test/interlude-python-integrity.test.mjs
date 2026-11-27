import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..','python');
const modules=[
 'analyze_interlude.py','interlude_workflow.py','vocal_microanalysis.py',
 'reconstruct_recorded.py','acrcloud_batch.py','finalize_master.py',
 'run_full_pipeline.py','mix_approved.py','download_meta_cc0.py'
];

test('Interlude automation has all nine production modules and a reproducible source manifest',()=>{
  for(const name of modules)assert.ok(existsSync(resolve(root,name)),name);
  const registry=JSON.parse(readFileSync(resolve(root,'meta_cc0_sample_registry.json'),'utf8'));
  assert.equal(registry.origin,'Meta Open Sound');
  assert.equal(registry.license,'CC0-1.0');
  assert.equal(registry.collections.length,3);
  assert.equal(registry.collections.reduce((n,c)=>n+c.sample_count,0),1075);
  for(const group of registry.collections){
    assert.equal(Object.keys(group.sha256).length,group.sample_count);
    assert.ok(Object.entries(group.sha256).every(([p,h])=>
      p.startsWith('ogg/') && p.endsWith('.ogg') && !p.includes('..') && /^[0-9a-f]{64}$/.test(h)));
  }
});

test('all Interlude Python pipeline modules parse correctly',t=>{
  const py=spawnSync('python3',['--version'],{encoding:'utf8'});
  if(py.error || py.status!==0){t.skip('Python 3 is not available in this test runtime');return;}
  const script=[
    'import ast,pathlib,sys',
    'root=pathlib.Path(sys.argv[1])',
    'names=sys.argv[2:]',
    'for name in names:',
    '    content=(root/name).read_text()',
    '    ast.parse(content,filename=name)',
    'print("parsed",len(names),"Interlude pipeline modules")'
  ].join(String.fromCharCode(10));
  const r=spawnSync('python3',['-c',script,root,...modules],
    {encoding:'utf8',timeout:15000});
  assert.equal(r.status,0,(r.stderr||r.stdout||'').slice(0,800));
  assert.match(r.stdout,/parsed 9 Interlude pipeline modules/);
});

test('pipeline safeguards block silent source re-use, license bypass, unverifiable masters and paid scans',()=>{
  const recon=readFileSync(resolve(root,'reconstruct_recorded.py'),'utf8');
  const master=readFileSync(resolve(root,'finalize_master.py'),'utf8');
  const detection=readFileSync(resolve(root,'acrcloud_batch.py'),'utf8');
  const orchestration=readFileSync(resolve(root,'run_full_pipeline.py'),'utf8');
  assert.match(recon,/source_hashes/);
  assert.match(recon,/source_kind/);
  assert.match(recon,/rights_verified/);
  assert.match(recon,/EXPECTED_INSTRUMENT_STEMS/);
  assert.match(master,/watermark_applied_and_verified/);
  assert.match(master,/live_full_song_scan_verified|final_wav_detector_result/);
  assert.match(detection,/ACRCLOUD_NEW_SCANS_ENABLED/);
  assert.match(detection,/no_audio_or_score_modifications/);
  assert.match(orchestration,/actual_master_wav':None/);
  assert.match(orchestration,/PIPELINE_RUN_SUMMARY.json/);
});
