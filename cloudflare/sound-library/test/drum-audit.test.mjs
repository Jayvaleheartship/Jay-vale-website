import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base=new URL('../../../studio/audio-lab/',import.meta.url);
const source=fs.readFileSync(new URL('drum-audit.js',base),'utf8');
const html=fs.readFileSync(new URL('index.html',base),'utf8');
const scope={};
vm.runInNewContext(source,{globalThis:scope,Math,Float32Array,Number,Array});
const audit=scope.JVDrumAudit;
assert.equal(audit.version,'0.1.0');

const RATE=48000,LENGTH=RATE*2;
function tone(hz=65,seconds=1,decay=20,gain=.65){
 const a=new Float32Array(Math.round(seconds*RATE));
 for(let i=0;i<a.length;i++){
  const t=i/RATE;
  a[i]=gain*Math.sin(2*Math.PI*hz*t)*Math.exp(-t*decay)*(1-Math.exp(-t*1000));
 }
 return a;
}
function eventArray(signal,places=[.2],length=LENGTH){
 const a=new Float32Array(length);
 for(const at of places){
  const start=Math.round(at*RATE);
  for(let i=0;i<signal.length&&start+i<a.length;i++)a[start+i]+=signal[i];
 }
 return a;
}
const e=(at=.2,manual=false)=>({at:Math.round(RATE*at),choice:'sample-kick',
 matched:true,manual});
test('self-check source code is imported into Audio Lab and emits JSON provenance',()=>{
 assert.match(html,/<script src="\.\/drum-audit\.js"><\/script>/);
 assert.match(html,/assertSafeDrumExport\(\)/);
 assert.match(html,/quality_audit:drumOutput.quality/);
 assert.match(html,/Automatic reconstruction self-check/);
 assert.match(html,/SELF-CHECK: unsafe layer reverted to original/);
});
test('identity: empty original-only path preserves sample frames without pretending to validate a layer',()=>{
 const a=eventArray(tone());
 const res=audit.run([a],[a],[{at:9600,choice:'Source'}]);
 assert.equal(res.status,'original-only');
 assert.equal(res.frameAligned,true);
 assert.equal(res.appliedCount,0);
 assert.equal(res.newClipSamples,0);
 assert.equal(res.sourceFrames,LENGTH);
});
test('minor <1dB gain preserves measured hit acceptance and waveform correlation',()=>{
 const a=eventArray(tone());
 const b=Float32Array.from(a,x=>x*1.035);
 const res=audit.run([a],[b],[e()]);
 assert.equal(res.failCount,0);
 assert.equal(res.status,'pass');
 assert.ok(res.checks[0].correlation>.999);
 assert.ok(Math.abs(res.checks[0].gainDb)<1);
 assert.deepEqual(Array.from(res.autoRevertIndices),[]);
});
test('large reconstructed hit gain triggers fail and automatic rollback suggestion',()=>{
 const a=eventArray(tone(65,1,20,.4));
 const b=Float32Array.from(a,x=>x*1.75);
 const res=audit.run([a],[b],[e()]);
 assert.equal(res.status,'fail');
 assert.match(Array.from(res.checks[0].flags).join(' '),/level changed over 3 dB/i);
 assert.deepEqual(Array.from(res.autoRevertIndices),[0]);
});
test('manual change is flagged but never silently reverted',()=>{
 const a=eventArray(tone(65,1,20,.4));
 const b=Float32Array.from(a,x=>x*2);
 const res=audit.run([a],[b],[e(.2,true)]);
 assert.equal(res.status,'fail');
 assert.deepEqual(Array.from(res.autoRevertIndices),[]);
});
test('attack shifted by 30ms is caught as a source mismatch',()=>{
 const a=eventArray(tone(75,.1,40),[.2]);
 const b=eventArray(tone(75,.1,40),[.23]);
 const res=audit.run([a],[b],[e()]);
 assert.equal(res.status,'fail');
 assert.ok(res.checks[0].correlation<.8||Math.abs(res.checks[0].attackDeltaMs)>20);
});
test('coarse frequency bands describe source and changed cymbal-like timbre',()=>{
 const a=eventArray(tone(65,.25,18,.5));
 const high=eventArray(tone(7000,.25,18,.5));
 const s=audit.profile([a],9600,16000);
 const h=audit.profile([high],9600,16000);
 assert.ok(s.bands[0]>h.bands[0], 'low sub-band energy should be larger for kick');
 assert.ok(h.bands[2]>s.bands[2], 'high-band energy should be larger for bright hit');
 const res=audit.run([a],[high],[e()]);
 assert.ok(res.checks[0].timbreDistance>.15);
 assert.equal(res.status,'fail');
});
test('tail duration quantifies longer decay and does not invent measurement when tail overlaps next hit',()=>{
 const short=eventArray(tone(65,.25,42));
 const long=eventArray(tone(65,.25,16));
 const complete=audit.compareHit([short],[long],9600,9600+Math.round(.18*RATE));
 assert.ok(complete.durationDeltaMs>0||complete.tailTruncated);
 const truncated=audit.compareHit([short],[long],9600,9600+Math.round(.04*RATE));
 assert.equal(truncated.durationDeltaMs,null,'short next-hit window must not imply definite decay');
 assert.equal(truncated.tailTruncated,true);
});
test('opposite phase stereo retains separate channel data for analysis',()=>{
 const l=eventArray(tone());
 const r=Float32Array.from(l,x=>-x);
 const outL=Float32Array.from(l,x=>x*1.01),outR=Float32Array.from(r,x=>x*1.01);
 const res=audit.run([l,r],[outL,outR],[e()]);
 assert.equal(res.status,'pass');
 assert.equal(res.sourceChannels,2);
 assert.ok(res.checks[0].correlation>.999);
});
test('new clipped output is reported and contributes global failure',()=>{
 const a=eventArray(tone(65,.2,20,.72));
 const b=Float32Array.from(a,x=>Math.max(-1,Math.min(1,x*2)));
 const res=audit.run([a],[b],[e()]);
 assert.ok(res.newClipSamples>0);
 assert.equal(res.status,'fail');
 assert.ok(res.globalFlags.some(x=>/clipping/.test(x)));
});
test('unmatched channel lengths fail loudly, never produce passing self-check',()=>{
 const res=audit.run([new Float32Array(1000)],[new Float32Array(999)],[e()]);
 assert.equal(res.status,'fail');
 assert.equal(res.frameAligned,false);
});
test('same sound and duration with isolated events cannot introduce phantom changes',()=>{
 const a=eventArray(tone(90,.16,25),[.2,.6,1]);
 const out=Float32Array.from(a);
 const res=audit.run([a],[out],[e(.2),e(.6),e(1)]);
 assert.equal(res.status,'pass');
 assert.equal(res.appliedCount,3);
 assert.ok(res.checks.every(x=>x.status==='pass'));
});
