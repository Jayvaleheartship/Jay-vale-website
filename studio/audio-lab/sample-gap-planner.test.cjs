const {test}=require('node:test');const assert=require('node:assert/strict');
require('./sample-gap-planner.js');const {plan}=globalThis.JVSampleGapPlanner;
const layer={id:'bass-1',family:'bass',instrument:'electric_bass',articulation:'sustain',pitch:48,velocity:92};
const source={...layer,velocityMin:80,velocityMax:110,sha256:'a'.repeat(64),recordingOriginVerified:true,originEvidence:'session record',sourceUrl:'https://example.org/audio.wav',licenseSpdx:'CC0-1.0',licenseEvidenceUrl:'https://example.org/license',originalFilename:'C3.wav'};
test('exact verified metadata match',()=>{const x=plan([layer],[source]);assert.equal(x.verifiedMatchCount,1);assert.equal(x.gaps.length,0)});
test('missing file-level license evidence blocks',()=>{const x=plan([layer],[{...source,licenseEvidenceUrl:null}]);assert.equal(x.gaps.length,1)});
test('wrong pitch and articulation block',()=>{assert.equal(plan([layer],[{...source,pitch:49}]).gaps.length,1);assert.equal(plan([layer],[{...source,articulation:'pluck'}]).gaps.length,1)});
test('unverified origin and hash block',()=>{assert.equal(plan([layer],[{...source,recordingOriginVerified:false}]).gaps.length,1);assert.equal(plan([layer],[{...source,sha256:'bad'}]).gaps.length,1)});
test('uncertain layers never forced to nearest',()=>{const x=plan([{...layer,instrument:'unknown'}],[source]);assert.equal(x.unresolvedCount,1);assert.equal(x.verifiedMatchCount,0)});
test('velocity zone must contain event',()=>assert.equal(plan([layer],[{...source,velocityMax:90}]).gaps.length,1));
test('does not accept non CC0',()=>assert.equal(plan([layer],[{...source,licenseSpdx:'MIT'}]).gaps.length,1));

test('duplicate layer identifiers rejected',()=>assert.throws(()=>plan([layer,{...layer}],[source]),/Duplicate layer id/));
test('duplicate sample hashes collapse into one candidate',()=>assert.deepEqual(plan([layer],[source,{...source,sha256:'A'.repeat(64)}]).matched[0].candidateHashes,['a'.repeat(64)]));
test('null catalogue rows ignored safely',()=>assert.equal(plan([layer],[null,source]).verifiedMatchCount,1));

test('identical gaps share one deterministic acquisition request',()=>{
 const x=plan([{...layer,id:'bass-2'},layer],[]);
 assert.equal(x.gaps.length,2);assert.equal(x.acquisitionQueue.length,1);
 assert.deepEqual(x.acquisitionQueue[0].layerIds,['bass-1','bass-2']);
});
test('distinct velocity and pitch requirements remain separate',()=>{
 const x=plan([layer,{...layer,id:'bass-2',velocity:93},{...layer,id:'bass-3',pitch:49}],[]);
 assert.equal(x.acquisitionQueue.length,3);
});
test('unresolved layers never enter acquisition queue',()=>{
 const x=plan([{...layer,instrument:'unknown'}],[]);
 assert.equal(x.acquisitionQueue.length,0);assert.equal(x.unresolvedCount,1);
});
