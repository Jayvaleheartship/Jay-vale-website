/*
 * Jay Vale Audio Lab — source-reference reconstruction audit v0.1
 *
 * Deterministic PCM measurements only, not a trained perceptual score.
 * Compare attack, tail, coarse frequency-band energy, level, waveform
 * correlation and frame alignment. Use source-lock fallback when untrusted
 * automatic recorded layers fail. Manual/experimental work is flagged.
 * No uploads or secrets. Runs entirely in the browser or Node.
 */
(function(root){
  'use strict';
  const RATE=48000, EPS=1e-12;
  const round=(v,n=2)=>Number.isFinite(v)?Number(v.toFixed(n)):null;
  function monoAt(channels,i){
    if(channels.length===1)return channels[0][i]||0;
    // Squared-energy values are taken by channel below. For timbre, sum
    // channel band energies, never average anti-phase L/R to silence.
    return channels[0][i]||0;
  }
  function profile(channels,start,end,rate=RATE) {
    if(!Array.isArray(channels))channels=[channels];
    if(!channels.length||!channels[0]||!channels.every(x=>x?.length>=end))
      throw Error('Audit profile: missing or misaligned audio channels');
    start=Math.max(0,Math.floor(start));end=Math.max(start+1,Math.floor(end));
    const hop=Math.max(24,Math.round(rate*.005));
    const rms=[],band=[0,0,0];
    const alphaLow=1-Math.exp(-2*Math.PI*220/rate);
    const alphaMid=1-Math.exp(-2*Math.PI*3800/rate);
    let energy=0,peak=0,clipped=0;
    for (let c=0;c<channels.length;c++){
      const ch=channels[c];let low=0,mid=0,prev=0;
      for(let i=start;i<end;i++){
        const v=ch[i];if(!Number.isFinite(v))throw Error('Audit profile: non-finite sample');
        energy+=v*v;peak=Math.max(peak,Math.abs(v));
        if(Math.abs(v)>=.999)clipped++;
        low+=alphaLow*(v-low);mid+=alphaMid*(v-mid);
        const x0=low,x1=mid-low,x2=v-mid;
        band[0]+=x0*x0;band[1]+=x1*x1;band[2]+=x2*x2;
        prev=v;
      }
    }
    for(let i=start;i<end;i+=hop){
      const stop=Math.min(end,i+hop);
      let sum=0;
      for(const ch of channels)for(let j=i;j<stop;j++)sum+=ch[j]*ch[j];
      rms.push(Math.sqrt(sum/((stop-i)*channels.length)));
    }
    const max=Math.max(...rms,0),maxAt=rms.indexOf(max);
    const onset=rms.findIndex(v=>v>=max*.17);
    let last=maxAt;
    for(let i=maxAt;i<rms.length;i++)if(rms[i]>=max*.18)last=i;
    const sumBands=band.reduce((a,b)=>a+b,EPS);
    return {rms:Math.sqrt(energy/((end-start)*channels.length)),peak,
      attackMs:max>1e-5?(maxAt-Math.max(0,onset))*hop*1000/rate:null,
      durationMs:max>1e-5?(last-Math.max(0,onset)+1)*hop*1000/rate:null,
      tailTruncated:max>1e-5&&rms.at(-1)>=max*.18,
      bands:band.map(x=>x/sumBands),clipped,frames:end-start};
  }
  function compareHit(source,out,start,end,rate=RATE){
    const s=profile(source,start,end,rate),r=profile(out,start,end,rate);
    const gainDb=20*Math.log10(Math.max(EPS,r.rms)/Math.max(EPS,s.rms));
    const timbreDistance=.5*s.bands.reduce((a,b,i)=>a+Math.abs(b-r.bands[i]),0);
    let dot=0,e1=0,e2=0;
    // At most 180 ms; skip every 4 frames to control phone CPU cost.
    for(let ch=0;ch<source.length;ch++)for(let i=start;i<end;i+=4){
      const a=source[ch][i]||0,b=out[ch][i]||0;
      dot+=a*b;e1+=a*a;e2+=b*b;
    }
    const correlation=e1>EPS&&e2>EPS?dot/Math.sqrt(e1*e2):null;
    const attackDeltaMs=s.attackMs===null||r.attackMs===null?null:r.attackMs-s.attackMs;
    const durationDeltaMs=s.tailTruncated||r.tailTruncated||s.durationMs===null||r.durationMs===null
      ?null:r.durationMs-s.durationMs;
    const flags=[];
    if(s.rms<.001&&r.rms>=.005)flags.push('New energy over near-silent original');
    if(gainDb>3.0||gainDb< -3.0)flags.push('Hit level changed over 3 dB');
    if(timbreDistance>.32)flags.push('Frequency-band character changed substantially');
    if(correlation!==null&&correlation<.80)flags.push('Source waveform correlation too low');
    if(attackDeltaMs!==null&&Math.abs(attackDeltaMs)>20&&end-start>=rate*.07)
      flags.push('Attack shape shifted over 20 ms');
    const warnings=[];
    if(Math.abs(gainDb)>1&&Math.abs(gainDb)<=3)warnings.push('Level deviation >1 dB');
    if(timbreDistance>.15&&timbreDistance<=.32)warnings.push('Timbre deviation');
    if(durationDeltaMs!==null&&Math.abs(durationDeltaMs)>35)warnings.push('Decay length deviation >35 ms');
    if(attackDeltaMs!==null&&Math.abs(attackDeltaMs)>10&&Math.abs(attackDeltaMs)<=20)
      warnings.push('Attack shape deviation');
    return {status:flags.length?'fail':warnings.length?'warn':'pass',
      gainDb:round(gainDb),timbreDistance:round(timbreDistance,4),
      correlation:round(correlation,4),attackDeltaMs:round(attackDeltaMs),
      durationDeltaMs:round(durationDeltaMs),
      sourceDurationMs:round(s.durationMs),outputDurationMs:round(r.durationMs),
      tailTruncated:s.tailTruncated||r.tailTruncated,flags,warnings};
  }
  function run(source,out,events=[],options={}){
    if(!Array.isArray(source)||!Array.isArray(out)||!source.length
      ||source.length!==out.length||source.some((v,i)=>!v||!out[i]||v.length!==out[i].length))
      return {status:'fail',frameAligned:false,reason:'Source and output channel/frame dimensions differ',
        appliedCount:0,checks:[],failCount:1,warnCount:0,autoRevertIndices:[]};
    const rate=options.sampleRate||RATE,preserve=options.preserve!==false;
    const len=source[0].length,applied=events.map((e,i)=>({...e,index:i})).filter(e=>e.choice!=='Source');
    const checks=[],autoRevertIndices=[];
    let clipAdded=0,nonFinite=0,deltaEnergy=0,originalEnergy=0,maxOut=0;
    // Deterministic whole-song scan. No hidden threshold on track duration.
    for(let c=0;c<source.length;c++)for(let i=0;i<len;i++){
      const s=source[c][i],o=out[c][i];
      if(!Number.isFinite(o)||!Number.isFinite(s)){nonFinite++;continue;}
      const d=o-s;deltaEnergy+=d*d;originalEnergy+=s*s;
      maxOut=Math.max(maxOut,Math.abs(o));
      if(Math.abs(o)>=.999&&Math.abs(s)<.999)clipAdded++;
    }
    const componentDb=deltaEnergy<=EPS?null:10*Math.log10(Math.max(EPS,deltaEnergy)/Math.max(EPS,originalEnergy));
    for(const e of applied){
      const at=Math.floor(e.at||0);
      if(at<0||at>=len){checks.push({index:e.index,timeSec:round(at/rate,3),status:'fail',flags:['Hit outside source timeline']});if(!e.manual)autoRevertIndices.push(e.index);continue;}
      const next=events[e.index+1]?.at??len;
      const end=Math.min(len,at+Math.round(rate*.18),Math.max(at+1,Math.floor(next)));
      const audit=compareHit(source,out,at,end,rate);
      checks.push({index:e.index,timeSec:round(at/rate,3),sample:e.choice,manual:!!e.manual,...audit});
      if(preserve&&audit.status==='fail'&&!e.manual)autoRevertIndices.push(e.index);
    }
    const failCount=checks.filter(x=>x.status==='fail').length;
    const warnCount=checks.filter(x=>x.status==='warn').length;
    const globalFlags=[];
    if(nonFinite)globalFlags.push('Non-finite PCM samples');
    if(preserve&&clipAdded)globalFlags.push('New clipping samples');
    if(preserve&&componentDb!==null&&componentDb> -9&&applied.length)globalFlags.push('Added audio is unusually strong');
    const status=globalFlags.length||failCount?'fail':warnCount?'warn':applied.length?'pass':'original-only';
    return {status,frameAligned:true,reason:status==='original-only'?'No recorded layers applied; original retained':null,
      sourceChannels:source.length,sourceFrames:len,durationSeconds:round(len/rate,3),
      appliedCount:applied.length,failCount,warnCount,checks,autoRevertIndices,
      globalFlags,componentDb:round(componentDb),peakOutput:round(maxOut,5),
      newClipSamples:clipAdded,nonFiniteSamples:nonFinite,
      method:'PCM source-reference; three broad energy bands, attack, decay, correlation and loudness; not perceptual accuracy'};
  }
  root.JVDrumAudit=Object.freeze({version:'0.1.0',profile,compareHit,run});
})(globalThis);
