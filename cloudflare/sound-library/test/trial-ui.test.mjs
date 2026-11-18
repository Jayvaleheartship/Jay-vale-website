import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../../../studio/audio-lab/index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Audio Lab inline JavaScript is present');
function section(from,to){
 const start=script.indexOf(from),end=script.indexOf(to,start+from.length);
 assert.ok(start>=0&&end>start,'expected source section: '+from);
 return script.slice(start,end);
}
const utils=new Function('DRUM_RATE','STEM_MAX_ZIP','STEM_MAX_EXPANDED','constrain',
 section('const crcTable =','function exportDrums()')+
 section('function crc32(bytes)','async function stemZipContents')+
 section('function stemWav24(','async function readStemProject(')+
 ';return {zipArchive,stemZipDirectory,stemWav24};'
)(48000,150_000_000,220_000_000,(x,a,b)=>Math.max(a,Math.min(b,x)));
test('new first trial interface is complete and has accessible upload, progress, previews and exports',()=>{
 new Function(script);
 for(const id of ['trial-drop','trial-stage','trial-steps','trial-error','trial-total-hits',
  'trial-matched-hits','trial-original-hits','trial-bank-count','trial-match-summary',
  'trial-export-wav','trial-export-reference','trial-export-report','stem-to-drum','stem-start-drum',
  'drum-original','drum-render','send-to-compare','drum-export','stem-input']){
  assert.ok(html.includes('id="'+id+'"'),'missing UI control '+id);
 }
 assert.match(html,/id="trial-stage"[^>]*role="status"|id="trial-stage" role="status"/);
 assert.match(html,/id="trial-error"[^>]*role="alert"/);
 assert.ok(script.includes("event.dataTransfer.files.length!==1"));
 assert.ok(script.includes("await prepareDrumTrial(decoded)"));
 assert.ok(script.includes("cloudSessionToken=null"));
});
test('stem ZIP accepts the MP3 and M4A formats used in separated stems',()=>{
 assert.ok(script.includes("const audioEntries=entries.filter(item=>/\\.(wav|flac|mp3|m4a)$/i.test(item.leaf));"));
 assert.ok(html.includes('Open selected stem in drum trial'));
});
test('ZIP creator and parser round-trip file names, entries and CRC metadata',async()=>{
 const files=[
  ['Drums/2 Drums.mp3',new TextEncoder().encode('test mp3 fixture bytes')],
  ['Lead Vocal.m4a',new Uint8Array([1,2,3,4,5])],
  ['Bass.wav',new Uint8Array([8,7,6])]
 ];
 const blob=utils.zipArchive(files),raw=new Uint8Array(await blob.arrayBuffer());
 const result=utils.stemZipDirectory(raw);
 assert.equal(result.entries.length,3);
 assert.deepEqual(result.entries.map(e=>e.name),files.map(x=>x[0]));
 for(let i=0;i<files.length;i++){
  const entry=result.entries[i];
  assert.equal(entry.expanded,files[i][1].length);
  assert.deepEqual(raw.subarray(entry.body,entry.body+entry.packed),files[i][1]);
 }
 assert.deepEqual(result.skipped,[]);
});
test('24-bit 48kHz WAV export is structurally correct and preserves stereo sign',()=>{
 const wave=utils.stemWav24([
  new Float32Array([0,0.5,-0.5,1]),
  new Float32Array([0,-0.5,0.5,-1])
 ],4);
 const view=new DataView(wave.buffer,wave.byteOffset,wave.byteLength);
 assert.equal(String.fromCharCode(...wave.subarray(0,4)),'RIFF');
 assert.equal(String.fromCharCode(...wave.subarray(8,12)),'WAVE');
 assert.equal(view.getUint16(22,true),2);
 assert.equal(view.getUint32(24,true),48000);
 assert.equal(view.getUint16(34,true),24);
 assert.equal(view.getUint32(40,true),24);
 assert.equal(wave.length,68);
 const signed24=p=>{let n=wave[p]|wave[p+1]<<8|wave[p+2]<<16;return n&0x800000?n-0x1000000:n;};
 assert.ok(signed24(50)>4000000,'positive left sample');
 assert.ok(signed24(53)<-4000000,'negative right sample');
});
test('match report records original source, selected sample license and conservative processing',()=>{
 const source={name:'2 Drums.mp3',digest:'abcdef',channels:[new Float32Array(480)]};
 const bank=[{id:'cloud-test',name:'808-kick.wav',kind:'Kick',license:'CC0-1.0',source:'Cloudflare',digest:'hash'}];
 const result={preserve:true,layerStrength:0.07,exportGain:1,differenceDb:-20};
 const events=[{at:120,length:80,estimate:'Kick',distance:0.1,confidence:0.95,matched:true,choice:'cloud-test',move:0,manual:false}];
 const fn=new Function('drumSource','drumOutput','drumEvents','bankSamples','fixture','DRUM_RATE',
 section('function makeTrialReport(){','function showWorkspace(mode)')+';return makeTrialReport;'
 )(source,result,events,bank,false,48000);
 const report=fn();
 assert.equal(report.analysis.onsets,1);
 assert.equal(report.analysis.confident_candidates,1);
 assert.equal(report.processing.method,'source-locked');
 assert.equal(report.source.filename,'2 Drums.mp3');
 assert.equal(report.selected_samples[0].license,'CC0-1.0');
 assert.equal(report.hits[0].output_sample,120);
 assert.ok(!JSON.stringify(report).includes('READ_TOKEN'),'never export secret');
});
