import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base=new URL('../../../studio/audio-lab/',import.meta.url);
const matcherSource=fs.readFileSync(new URL('drum-matcher.js',base),'utf8');
const html=fs.readFileSync(new URL('index.html',base),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline,'Inline Audio Lab engine required');
const scope={};
vm.runInNewContext(matcherSource,{globalThis:scope,Float32Array,Math});
const matcher=scope.JVDrumMatcher;
assert.equal(matcher.version,'1.1.0');

function extract(start,end){
  const i=inline.indexOf(start),j=inline.indexOf(end,i+start.length);
  assert.ok(i>=0&&j>i,'Unable to extract '+start);
  return inline.slice(i,j);
}
const fp = new Function('DRUM_RATE',
  extract('function drumFingerprint(','function classifyHits(').replace(
    /function fingerprintDistance\(a,b\)[\s\S]*?(?=\/\/ Frequency response)/,
    '') +'; return drumFingerprint;'
)(48000);

function synth(hz,kind='bass',amp=.75,decay=15){
 const count=12000,a=new Float32Array(count);
 let seed=78945;
 for(let i=0;i<count;i++){
  const t=i/48000;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=(seed/2147483648-1);
  const raw=kind==='bass'?Math.sin(2*Math.PI*hz*t):
    kind==='snare'?Math.sin(2*Math.PI*180*t)*.25+noise*.75:noise;
  a[i]=amp*raw*Math.exp(-t*decay)*Math.min(1,t/.002);
 }
 return a;
}
function signature(audio){return matcher.analyze(audio,0,fp(audio));}
function sample(id,kind,data){return {id,kind,mono:data,fp:fp(data),sig:signature(data)};}
test('matcher JavaScript parses and is loaded by published Audio Lab',()=>{
 new Function(inline);
 assert.match(html,/<script src="\.\/drum-matcher\.js"><\/script>/);
 assert.match(inline,/JVDrumMatcher\.select/);
 assert.match(html,/<th>Match decision<\/th>/);
});
test('bass pitch autocorrelation distinguishes 55/82/140 Hz without octave alias',()=>{
 for(const hz of [46,55,60,82,105,140]){
  const got=signature(synth(hz)).bassPitchHz;
  assert.ok(got&&Math.abs(got-hz)/hz<.035,hz+' Hz detected as '+got);
 }
 assert.equal(signature(synth(0,'noise',.7,70)).bassPitchHz,null);
});
test('exact same kind of hit is accepted and nearest-match score is zero',()=>{
 const kick=sample('kick55','Kick',synth(55));
 const snare=sample('snare','Snare',synth(0,'snare',.7,30));
 const result=matcher.select(kick.sig,[snare,kick]);
 assert.equal(result.accepted,true);
 assert.equal(result.winner.sample.id,'kick55');
 assert.equal(result.reason.includes('Very close'),true);
 assert.ok(Math.abs(result.winner.total)<1e-6);
});
test('pitch mismatch with high-tonality 808 is rejected, retaining original',()=>{
 const bass=sample('kick55','Kick',synth(55));
 const input=signature(synth(82));
 const result=matcher.select(input,[bass]);
 assert.equal(result.accepted,false);
 assert.equal(result.kind,'Uncertain');
 assert.ok(result.winner.pitchSemitones>2);
});
test('wrong sounding library candidates are rejected rather than forced replacements',()=>{
 const input=signature(synth(0,'noise',.7,55));
 const onlyKick=sample('kick','Kick',synth(55));
 const result=matcher.select(input,[onlyKick]);
 assert.equal(result.accepted,false);
 assert.equal(result.kind,'Uncertain');
});
test('ambiguous cross-instrument category ties are conservatively rejected',()=>{
 const q=signature(synth(55));
 const altered={...q,fp:[...q.fp],envelope:[...q.envelope]};
 altered.fp[0]=Math.min(1,altered.fp[0]+.2);
 altered.fp[1]=Math.min(1,altered.fp[1]+.17);
 const candidates=[{id:'a',kind:'Kick',sig:altered},{id:'b',kind:'Tom',sig:altered}];
 const result=matcher.select(q,candidates);
 assert.ok(result.winner.total>.115&&result.winner.total<.26,'score '+result.winner.total);
 assert.equal(result.accepted,false);
 assert.match(result.reason,/Ambiguous/);
});
test('silent stem never produces a confident match',()=>{
 const silent=signature(new Float32Array(12000));
 const bank=[sample('real','Kick',synth(55))];
 assert.equal(silent.silent,true);
 const r=matcher.select(silent,bank);
 assert.equal(r.accepted,false);
});
test('integration: actual classifier uses v1 for real bank and keeps unknown original',()=>{
 const source=extract('function soloChannel(','function demoSound(')
  +extract('function onset(','function drumShape(')
  +extract('function drumFingerprint(','function peakBetween(');
 const make=new Function('DRUM_RATE','CORE_DRUMS','fixture','bankSamples','kit','JVDrumMatcher','globalThis',source+';return classifyHits;');
 const bank=[sample('real-kick','Kick',synth(55))];
 const classify=make(48000,['Kick','Snare','Clap','Hat'],false,bank,{},matcher,{JVDrumMatcher:matcher});
 const same=new Float32Array(36000);same.set(synth(55),2400);
 const matched=classify([same]);
 assert.ok(matched.length>=1,'should detect at least one 808 onset');
 assert.equal(matched[0].matcher,'multi-feature-v1.1-adaptive-onsets');
 assert.equal(matched[0].matched,true);
 const different=new Float32Array(36000);different.set(synth(0,'noise',.7,70),2400);
 const rejected=classify([different]);
 assert.ok(rejected.length>=1);
 assert.equal(rejected[0].matched,false);
 assert.equal(rejected[0].choice,'Source');
 assert.ok(rejected[0].reason.length>10);
});

test('closed/open hi-hat articulation is ranked and incompatible long/short articulation rejected',()=>{
 const quick=signature(synth(0,'noise',.7,80));
 assert.ok(quick.decayMs<55,'short high-hat input');
 const open={id:'open',kind:'Hat',name:'open_hat.wav',sig:quick};
 const closed={id:'closed',kind:'Hat',name:'closed_hat.wav',sig:quick};
 const ranked=matcher.rank(quick,[open,closed]);
 assert.equal(ranked[0].sample.id,'closed');
 assert.ok(ranked[1].articulationPenalty>=.18);
 assert.equal(matcher.select(quick,[open]).accepted,false);
 assert.match(matcher.select(quick,[open]).reason,/Articulation/);
 assert.equal(matcher.select(quick,[closed]).accepted,true);
});
test('imported 808 names become pitch-aware kick candidates, while 808 snare remains snare',()=>{
 const kindCode=extract('function identifyDrumKind(name){','async function unpackDrumStem(zip){');
 const kind=new Function(kindCode+';return identifyDrumKind;')();
 assert.equal(kind('bass/808-sub.wav'),'Kick');
 assert.equal(kind('drums/TR808 Snare.wav'),'Snare');
 assert.equal(kind('drums/open-hi-hat.wav'),'Hat');
 assert.ok(inline.includes("['drums','percussion','bass']"),'Cloud sample loader includes 808 bass family');
});


function placeHits(hits,sound,frames=96000){
  const out=new Float32Array(frames);
  for(const [index,seconds] of hits.entries()){
    const start=Math.round(seconds*48000),gain=index%2?.55:1;
    for(let i=0;i<sound.length&&start+i<frames;i++)out[start+i]+=sound[i]*gain;
  }
  return out;
}
function checkTiming(found,expected,toleranceSamples=240){
  assert.equal(found.length,expected.length,'expected '+expected.length+' separate attacks, found '+found.join(', '));
  for(let i=0;i<expected.length;i++)
    assert.ok(Math.abs(found[i]-Math.round(expected[i]*48000))<=toleranceSamples,
      'onset '+i+' expected '+expected[i]+'s got '+(found[i]/48000)+'s');
}
test('adaptive detector retains kick, hi-hat and repeated pitched 808 timelines within 5ms',()=>{
  checkTiming(matcher.detectOnsets([placeHits([.2,.4,.8],synth(65))]),[.2,.4,.8]);
  checkTiming(matcher.detectOnsets([placeHits([.2,.35,.5,.65,.8],synth(0,'noise',.8,90))]),[.2,.35,.5,.65,.8]);
  checkTiming(matcher.detectOnsets([placeHits([.2,.45,.9],synth(55,'bass',.8,8))]),[.2,.45,.9]);
});
test('adaptive detector resolves 40ms flams instead of legacy 60ms refractory swallowing them',()=>{
  const sound=synth(0,'noise',.8,80);
  checkTiming(matcher.detectOnsets([placeHits([.2,.24,.6],sound)]),[.2,.24,.6]);
});
test('stereo anti-phase signals still give timed hits and no phantom onsets',()=>{
  const lead=placeHits([.2,.4],synth(55));
  const right=Float32Array.from(lead,x=>-x);
  checkTiming(matcher.detectOnsets([lead,right]),[.2,.4]);
  assert.deepEqual(Array.from(matcher.detectOnsets([new Float32Array(48000)])),[]);
});
test('simple overlapping kick and hat still reveal nearby distinct attacks',()=>{
  const kick=placeHits([.2,.4,.8],synth(60));
  const hats=placeHits([.2,.44,.8],synth(0,'noise',.8,90));
  const mixed=Float32Array.from(kick,(v,i)=>v+hats[i]);
  checkTiming(matcher.detectOnsets([mixed]),[.2,.4,.44,.8]);
});
test('onset detector rejects unequal channel lengths instead of silently corrupting timestamps',()=>{
  assert.throws(()=>matcher.detectOnsets([new Float32Array(100),new Float32Array(101)]),/Channel lengths/);
});
test('source-locked render preserves every original frame when matches are rejected',()=>{
  const source=extract('function soloChannel(','function demoSound(');
  const renderCode=extract('function peakBetween(','function refreshRender(');
  const main=new Float32Array(48000);
  main.set(synth(55),9600);
  const bank=[sample('clean-kick','Kick',synth(55))];
  const render=new Function('DRUM_RATE','drumSource','drumEvents','bankSamples','kit','EXPORT_DRUM_GROUPS','
    source+renderCode+';return renderDrums;')(
      48000,{channels:[main]},
      [{at:9600,length:8640,move:0,gain:0,choice:'Source',matched:false,manual:false}],
      bank,{},['Kick','Snare','Clap','Hat','Other'],
      id=>({'drum-fidelity-mode':{value:'preserve'},'drum-layer':{value:'50'}}[id])
    );
  const output=render();
  assert.equal(output.preserve,true);
  assert.equal(output.exportGain,1);
  assert.deepEqual(Array.from(output.mix[0]),Array.from(main));
  assert.deepEqual(Array.from(output.source[0]),Array.from(main));
});
test('source-locked accepted layer is added only at original hit timeline without shifting reference',()=>{
  const source=extract('function soloChannel(','function demoSound(');
  const renderCode=extract('function peakBetween(','function refreshRender(');
  const main=new Float32Array(48000);
  main.set(synth(55),9600);
  const bank=[sample('clean-kick','Kick',synth(55))];
  const render=new Function('drumSource','drumEvents','bankSamples','kit','EXPORT_DRUM_GROUPS','$',
    source+renderCode+';return renderDrums;')(
      48000,{channels:[main]},
      [{at:9600,length:8640,move:0,gain:0,choice:'clean-kick',matched:true,manual:false}],
      bank,{},['Kick','Snare','Clap','Hat','Other'],
      id=>({'drum-fidelity-mode':{value:'preserve'},'drum-layer':{value:'35'}}[id])
    );
  const output=render();
  assert.equal(output.mix[0].length,main.length);
  assert.deepEqual(Array.from(output.source[0]),Array.from(main));
  assert.equal(output.exportGain,1);
  assert.ok(output.mix[0].some((v,i)=>i>=9600&&i<16000&&v!==main[i]),'additive layer expected at onset');
  for(let i=0;i<9600;i++)assert.equal(output.mix[0][i],main[i]);
  for(let i=20000;i<48000;i++)assert.equal(output.mix[0][i],main[i]);
});
,
    source+renderCode+';return renderDrums;')(
      48000,{channels:[main]},
      [{at:9600,length:8640,move:0,gain:0,choice:'Source',matched:false,manual:false}],
      bank,{},['Kick','Snare','Clap','Hat','Other'],
      id=>({'drum-fidelity-mode':{value:'preserve'},'drum-layer':{value:'50'}}[id])
    );
  const output=render();
  assert.equal(output.preserve,true);
  assert.equal(output.exportGain,1);
  assert.deepEqual(Array.from(output.mix[0]),Array.from(main));
  assert.deepEqual(Array.from(output.source[0]),Array.from(main));
});
test('source-locked accepted layer is added only at original hit timeline without shifting reference',()=>{
  const source=extract('function soloChannel(','function demoSound(');
  const renderCode=extract('function peakBetween(','function refreshRender(');
  const main=new Float32Array(48000);
  main.set(synth(55),9600);
  const bank=[sample('clean-kick','Kick',synth(55))];
  const render=new Function('DRUM_RATE','drumSource','drumEvents','bankSamples','kit','EXPORT_DRUM_GROUPS','
    source+renderCode+';return renderDrums;')(
      48000,{channels:[main]},
      [{at:9600,length:8640,move:0,gain:0,choice:'clean-kick',matched:true,manual:false}],
      bank,{},['Kick','Snare','Clap','Hat','Other'],
      id=>({'drum-fidelity-mode':{value:'preserve'},'drum-layer':{value:'35'}}[id])
    );
  const output=render();
  assert.equal(output.mix[0].length,main.length);
  assert.deepEqual(Array.from(output.source[0]),Array.from(main));
  assert.equal(output.exportGain,1);
  assert.ok(output.mix[0].some((v,i)=>i>=9600&&i<16000&&v!==main[i]),'additive layer expected at onset');
  for(let i=0;i<9600;i++)assert.equal(output.mix[0][i],main[i]);
  for(let i=20000;i<48000;i++)assert.equal(output.mix[0][i],main[i]);
});
,
    source+renderCode+';return renderDrums;')(
      48000,{channels:[main]},
      [{at:9600,length:8640,move:0,gain:0,choice:'clean-kick',matched:true,manual:false}],
      bank,{},['Kick','Snare','Clap','Hat','Other'],
      id=>({'drum-fidelity-mode':{value:'preserve'},'drum-layer':{value:'35'}}[id])
    );
  const output=render();
  assert.equal(output.mix[0].length,main.length);
  assert.deepEqual(Array.from(output.source[0]),Array.from(main));
  assert.equal(output.exportGain,1);
  assert.ok(output.mix[0].some((v,i)=>i>=9600&&i<16000&&v!==main[i]),'additive layer expected at onset');
  for(let i=0;i<9600;i++)assert.equal(output.mix[0][i],main[i]);
  for(let i=20000;i<48000;i++)assert.equal(output.mix[0][i],main[i]);
});
