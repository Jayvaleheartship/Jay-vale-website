import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./full-song-coverage.js',import.meta.url),'utf8');
const root={};vm.runInNewContext(source,{globalThis:root,Math,Number,Set,RegExp});
const m=root.JVFullSongCoverage;
const recorded={sha256:'f'.repeat(64),sourceUrl:'https://example.org/recorded.wav',licenseSpdx:'CC0-1.0',originType:'recorded_acoustic_instrument',recordingOriginVerified:true,originEvidence:'Artist has confirmed recording provenance'};
const quality={frameAligned:true,clipped:false,timingPass:true,pitchPass:true,spectralPass:true,stereoPass:true,artifactPass:true};
function layer(id){return {id,instrument:'acoustic piano',mode:'independent_recorded_sample',sourceDerived:false,sourceRetained:false,samples:[{...recorded}],eventsAudited:true,transcriptionReviewed:true,quality:{...quality},stemAndLayerRendered:true}}
function stem(layers=[layer('l1')]){return {filename:'5 Keyboard.mp3',family:'keys',layers,layerInventoryReviewed:true,residualAccountedFor:true,sourceAudioFraction:0,listening:{explicitlyAccepted:true,referenceMatched:true,scoreSource:'listener_assessment',similarityRatio:0.95}}}
function project(stems=[stem()]){return {stems,finalMix:{decodedFrameAligned:true,noClipping:true,listeningApproved:true}}}
test('recorded provenance with origin verification passes',()=>assert.equal(m.sourceValid(recorded),true));
test('license alone does not prove independently recorded instrument',()=>assert.equal(m.sourceValid({...recorded,recordingOriginVerified:false}),false));
test('complete independently recorded stem can meet exact 95%-by-listening gate',()=>{const result=m.auditProject(project());assert.equal(result.technicalComplete,true);assert.equal(result.listenerAccepted,true)});
test('one missing layer rejects entire stem even if another layer passes',()=>{const result=m.auditProject(project([stem([layer('l1'),{...layer('l2'),samples:[]}])]));assert.equal(result.instrumentalStemsTechnicalComplete,0);assert.equal(result.technicalComplete,false)});
test('retaining source signal rejects complete reconstruction claim',()=>{const s=stem();s.sourceAudioFraction=0.01;assert.equal(m.auditStem(s).technicalComplete,false);});
test('self-sampled drum pilot cannot pass as independently recorded',()=>{const s=stem([{...layer('kick'),mode:'source_derived_retrigger',sourceDerived:true}]);assert.equal(m.auditStem(s).technicalComplete,false)});
test('uncertain or missing instrument-layer inventory must fail',()=>{const s=stem();s.layerInventoryReviewed=false;assert.equal(m.auditStem(s).technicalComplete,false)});
test('95% claimed from an objective correlation is not listener acceptance',()=>{const s=stem();s.listening={explicitlyAccepted:true,referenceMatched:true,scoreSource:'waveform_correlation',similarityRatio:.999};const result=m.auditStem(s);assert.equal(result.technicalComplete,true);assert.equal(result.listenerAccepted,false)});
test('94.9% listening is below threshold; 95% succeeds',()=>{const s=stem();s.listening.similarityRatio=.949;assert.equal(m.auditStem(s).listenerAccepted,false);s.listening.similarityRatio=.95;assert.equal(m.auditStem(s).listenerAccepted,true)});
test('vocals are a separate workflow, never automatically called human',()=>{const result=m.auditProject(project([stem(),{filename:'0 Lead Vocals.mp3',family:'vocals'}]));assert.equal(result.voiceStemsSeparate,1);assert.equal(result.stems[1].status,'separate_vocal_workflow');});
test('one stereo failure blocks instrument success',()=>{const s=stem();s.layers[0].quality.stereoPass=false;assert.equal(m.auditStem(s).technicalComplete,false)});
test('no clipping and frame alignment are mandatory for whole mix',()=>{let p=project();p.finalMix.noClipping=false;assert.equal(m.auditProject(p).technicalComplete,false);p=project();p.finalMix.decodedFrameAligned=false;assert.equal(m.auditProject(p).technicalComplete,false)});
test('unaccounted effects residual blocks reconstruction',()=>{const s=stem();s.residualAccountedFor=false;assert.equal(m.auditStem(s).technicalComplete,false)});
test('stem ZIP importer displays full-song source-only status and does not silently claim a rebuild',()=>{
  const html=fs.readFileSync(new URL('../../../studio/audio-lab/index.html',import.meta.url),'utf8');
  assert.match(html,/<script src="\.\/full-song-coverage\.js"><\/script>/);
  assert.match(html,/<script src="\.\/full-song-project\.js"><\/script>/);
  assert.match(html,/stem-reconstruction-provenance/);
  assert.match(html,/RECONSTRUCTION AUDIT:/);
  assert.match(html,/ALL imported tracks are currently original\/source-retained/);
  assert.match(html,/updateStemCoverage\(\);/);
});
