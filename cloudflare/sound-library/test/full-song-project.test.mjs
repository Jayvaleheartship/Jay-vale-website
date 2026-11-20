import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../../studio/audio-lab/full-song-project.js',import.meta.url),'utf8');
const root={};vm.runInNewContext(source,{globalThis:root,Math,Number,RegExp,Set});
const m=root.JVFullSongProject;
function stems(){return ['0 Lead Vocals.mp3','1 Backing Vocals.mp3','2 Drums.mp3','3 Bass.mp3','4 Guitar.mp3','5 Keyboard.mp3','6 Percussion.mp3','7 Strings.mp3','8 Synth.mp3','9 Other.mp3','10 Brass.mp3','11 Woodwinds.mp3'].map(name=>({name,bytes:4000000,compressedBytes:3900000}));}
const decoded=Object.fromEntries(stems().map(i=>[i.name,{sampleRate:48000,frames:9268992,channels:2}]));
const inputSha256='a'.repeat(64);
test('all 12 stem filenames classified and sorted numerically',()=>{
 const a=m.inspectEntries(stems());assert.equal(a.length,12);assert.equal(a[2].family,'drums');assert.equal(a[5].family,'keys');assert.equal(a[8].family,'synths');assert.equal(a[9].family,'unknown');assert.equal(a[10].order,10);
});
test('rejects ZIP traversal, duplicate tracks and zip bombs',()=>{
 assert.throws(()=>m.inspectEntries([{name:'../x.mp3',bytes:10}]),/Unsafe|traversal/);
 assert.throws(()=>m.inspectEntries([{name:'C:\\evil.mp3',bytes:10}]),/Unsafe/);
 assert.throws(()=>m.inspectEntries([{name:'2 Drums.mp3',bytes:10},{name:'2 drums.mp3',bytes:10}]),/Duplicate/);
 assert.throws(()=>m.inspectEntries([{name:'0 Voice.mp3',bytes:100000000,compressedBytes:10}]),/expansion/);
});
test('accurate decoded alignment avoids misleading MP3 header metadata',()=>{
 const x=m.decodedAlignment(m.inspectEntries(stems()),decoded);assert.equal(x.aligned,true);assert.equal(x.frames,9268992);assert.equal(x.durationSeconds,193.104);assert.equal(x.reliableSource,'decoded_pcm_not_mp3_header');
});
test('one-frame mismatch blocks aligned status',()=>{
 const d={...decoded,'2 Drums.mp3':{sampleRate:48000,frames:9268993,channels:2}};
 const x=m.decodedAlignment(m.inspectEntries(stems()),d);assert.equal(x.aligned,false);assert.equal(x.unmatched.length,1);
});
test('project manifest has repeatable folders and unknown sample coverage',()=>{
 const x=m.createProject({projectId:'jv-test-song',inputSha256,entries:stems(),decoded,libraryCounts:{drums:124}});
 assert.equal(x.stems.length,12);assert.equal(x.paths.analysis,'projects/jv-test-song/analysis/');assert.equal(x.library.actuallyQueried,false);assert.equal(x.quality.actualRecreatedStemCount,0);assert.equal(m.canClaimFullReconstruction(x),false);
});
test('source-locked hybrid is never labeled fully independently reconstructed',()=>{
 const x=m.createProject({projectId:'jv-test-song',inputSha256,entries:stems(),decoded});
 m.markLayer(x,'2 Drums.mp3',{mode:'hybrid'});assert.equal(x.quality.hybridStemCount,1);assert.equal(x.quality.actualRecreatedStemCount,0);assert.equal(m.canClaimFullReconstruction(x),false);
});
test('independent replacement must have real sample license and provenance',()=>{
 const x=m.createProject({projectId:'jv-test-song',inputSha256,entries:stems(),decoded});
 assert.throws(()=>m.markLayer(x,'3 Bass.mp3',{mode:'independent_sample_rebuild',sources:[]}),/requires recorded sample/);
 m.markLayer(x,'3 Bass.mp3',{mode:'independent_sample_rebuild',sources:[{sha256:'b'.repeat(64),license_spdx:'CC0-1.0',originUrl:'https://example.org/real.wav'}]});assert.equal(x.quality.actualRecreatedStemCount,1);assert.equal(m.canClaimFullReconstruction(x),false);
});
test('stereo anti-correlation warns against mono loss',()=>{
 const a=m.stereoMetrics(1,1,-.52);assert.ok(a.monoFoldDownDb< -5);assert.equal(a.antiCorrelated,true);assert.equal(a.wideStereo,true);
});
test('full reconstruction only if every stem is independently rebuilt and audited/listened',()=>{
 const x=m.createProject({projectId:'jv-test-song',inputSha256,entries:stems(),decoded});
 for(const st of x.stems)m.markLayer(x,st.filename,{mode:'independent_sample_rebuild',sources:[{sha256:'b'.repeat(64),license_spdx:'CC0-1.0',originUrl:'https://example.org/real.wav'}]});
 assert.equal(m.canClaimFullReconstruction(x),false);x.quality.qualityAudited=true;x.quality.listenerAccepted=true;assert.equal(m.canClaimFullReconstruction(x),true);
});
