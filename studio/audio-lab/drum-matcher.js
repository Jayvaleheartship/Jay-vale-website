/*
 * Jay Vale Audio Lab — Drum matching engine 1.0.
 *
 * Approximate one-shot ranking only. A mixed stem, compression, processing,
 * overlaps and missing source recordings can make exact identification
 * impossible. A rejected hit MUST retain original source audio.
 *
 * Browser: window.JVDrumMatcher; Node test: runInNewContext on this file.
 * No secrets, network, or data collection.
 */
(function(root){
  'use strict';
  const RATE=48000, HOP=240, MAX_FRAMES=10560;
  const FP_WEIGHTS=[1.5,1.4,1.5,.65,.7,.8,.8,.65,.55];
  const EPS=1e-10;
  const limit=(v,min,max)=>Math.max(min,Math.min(max,v));
  const logGap=(a,b)=>Math.abs(Math.log1p(a)-Math.log1p(b));
  function spectralDistance(a,b) {
    if(!a||!b||a.length<9||b.length<9)return Infinity;
    let base=0;
    for(let i=0;i<9;i++){
      if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))return Infinity;
      base+=FP_WEIGHTS[i]*(a[i]-b[i])**2;
    }
    const length=Math.min(a.length,b.length,31);
    let spectral=0;
    for(let i=9;i<length;i++)spectral+=(a[i]-b[i])**2;
    return Math.hypot(Math.sqrt(base),.63*Math.sqrt(spectral));
  }
  function bassPitch(samples,start,length,lowRatio){
    if(lowRatio<.36||length<2400)return {hz:null,clarity:0};
    const stride=8,downRate=RATE/stride;
    // Use 20–175 ms of early body, excluding the first click.
    const first=start+Math.min(960,Math.floor(length*.08));
    const count=Math.floor((Math.min(start+length,start+8400)-first)/stride);
    if(count<310)return {hz:null,clarity:0};
    const signal=new Float32Array(count);
    let low=0,mean=0;
    for(let i=0;i<count;i++){
      const at=first+i*stride;
      let sum=0;
      for(let j=0;j<stride;j++)sum+=samples[at+j]||0;
      const value=sum/stride;
      low+=.19*(value-low); // anti-alias-style smoothing; avoids high-frequency transient bias
      signal[i]=low;mean+=low;
    }
    mean/=count;
    let energy=0;
    for(let i=0;i<count;i++){signal[i]-=mean;energy+=signal[i]*signal[i];}
    if(energy/count<1e-7)return {hz:null,clarity:0};
    let best=-1,bestLag=0;
    const minLag=Math.floor(downRate/170),maxLag=Math.ceil(downRate/38),peaks=[];
    for(let lag=minLag;lag<=maxLag&&lag<count/2;lag++){
      let dot=0,a=0,b=0;
      for(let i=0;i<count-lag;i++){
        const x=signal[i],y=signal[i+lag];
        dot+=x*y;a+=x*x;b+=y*y;
      }
      const correlation=dot/Math.sqrt(Math.max(EPS,a*b));
      peaks.push({lag,correlation});
      if(correlation>best){best=correlation;bestLag=lag;}
    }
    // A tonal 808 may correlate almost equally at 1x and 2x periods.
    // Select the shortest *local maximum* close to the best peak to prevent
    // common octave-down misidentification of 80–170 Hz bass notes.
    if(best>=.72){
      const plausible=peaks.filter((p,i)=>p.correlation>=best-.018 &&
        p.correlation>=.72 && i>0 && i<peaks.length-1 &&
        p.correlation>=peaks[i-1].correlation &&
        p.correlation>peaks[i+1].correlation);
      if(plausible.length)bestLag=plausible[0].lag;
    }
    // Avoid identifying brief noisy clicks or near-silence as pitched 808s.
    const clarity=limit(best,0,1);
    return clarity>=.72?{hz:downRate/bestLag,clarity}:{hz:null,clarity};
  }
  function analyze(samples,start=0,fp=null) {
    if(!samples||!Number.isInteger(start)||start<0||start>=samples.length)throw Error('Invalid audio analysis region');
    const length=Math.min(MAX_FRAMES,samples.length-start);
    const envelope=[];
    let maxRms=0,peakIndex=0,energy=0;
    for(let i=0;i<length;i+=HOP){
      const n=Math.min(HOP,length-i);
      let block=0;
      for(let j=0;j<n;j++){const v=samples[start+i+j]||0;block+=v*v;}
      const rms=Math.sqrt(block/n);envelope.push(rms);energy+=block;
      if(rms>maxRms){maxRms=rms;peakIndex=envelope.length-1;}
    }
    const onset=envelope.findIndex(v=>v>=maxRms*.12);
    const startIndex=Math.max(0,onset);
    let last=peakIndex;
    for(let i=peakIndex;i<envelope.length;i++)if(envelope[i]>=maxRms*.22)last=i;
    const attackMs=Math.max(0,(peakIndex-startIndex)*5);
    const decayMs=Math.max(0,(last-peakIndex)*5);
    const total=envelope.reduce((sum,v)=>sum+v*v,EPS);
    // Eight 25-ms envelope slices with equalized weighting.
    const env=Array.from({length:8},(_,i)=>{
      let sum=0;
      for(let j=i*5;j<Math.min(envelope.length,(i+1)*5);j++)sum+=envelope[j]*envelope[j];
      return Math.sqrt(sum/total);
    });
    const lowRatio=Number.isFinite(fp?.[0])?fp[0]:0;
    const pitch=bassPitch(samples,start,length,lowRatio);
    return {fp,attackMs,decayMs,envelope:env,lowRatio,
      bassPitchHz:pitch.hz,tonality:pitch.clarity,
      rms:Math.sqrt(energy/Math.max(1,length)),
      silent:maxRms<.001||energy<1e-7};
  }
  function score(query,target){
    const spectral=spectralDistance(query.fp,target.fp);
    if(!Number.isFinite(spectral)||query.silent||target.silent)return {total:Infinity,spectral,pitchSemitones:null};
    let envelope=0;
    for(let i=0;i<8;i++)envelope+=(query.envelope[i]-target.envelope[i])**2;
    envelope=Math.sqrt(envelope);
    const attack=limit(logGap(query.attackMs,target.attackMs)/3,0,1);
    const decay=limit(logGap(query.decayMs,target.decayMs)/3,0,1);
    let pitchSemitones=null,pitchPenalty=0;
    if(query.bassPitchHz&&query.tonality>=.72&&query.lowRatio>=.36){
      if(target.bassPitchHz&&target.tonality>=.72){
        pitchSemitones=12*Math.abs(Math.log2(query.bassPitchHz/target.bassPitchHz));
        pitchPenalty=Math.min(.7,pitchSemitones*.10);
      }else if(target.lowRatio>.35)pitchPenalty=.20;
    }
    return {
      total:spectral*.82+envelope*.13+attack*.045+decay*.06+pitchPenalty,
      spectral,envelope,attack,decay,pitchSemitones,pitchPenalty
    };
  }
  function rank(query,candidates){
    return candidates.map(sample=>({sample,...score(query,sample.sig)}))
      .sort((a,b)=>a.total-b.total||String(a.sample.id).localeCompare(String(b.sample.id)));
  }
  function select(query,candidates,options={}){
    if(!candidates.length||query.silent)return {
      accepted:false,kind:'Uncertain',winner:null,ranking:[],reason:'Silence or no recorded candidates',confidence:0,
      margin:0
    };
    const ranking=rank(query,candidates),best=ranking[0];
    const competing=ranking.find(x=>x.sample.kind!==best.sample.kind);
    const margin=competing?competing.total-best.total:null;
    // Strict threshold is intentionally conservative for audio extracted from a mix.
    const strict=options.mode!=='demo';
    const absolute=strict?.26:.52,veryClose=strict?.115:.28;
    const separation=strict?.055:.045;
    let reason='Close source-spectrum, transient and decay match';
    let accepted=true;
    if(!Number.isFinite(best.total)||best.total>absolute){accepted=false;reason='Recorded candidates differ too much from source';}
    else if(best.pitchSemitones!=null&&best.pitchSemitones>2){accepted=false;reason='Clear bass fundamental differs by more than two semitones';}
    else if(margin!=null&&margin<separation&&best.total>veryClose){accepted=false;reason='Ambiguous instrument family; keep original';}
    else if(best.total>veryClose && best.spectral>.32){accepted=false;reason='Spectral shape mismatch; keep original';}
    if(accepted&&best.total<=veryClose)reason='Very close spectral, onset and decay signature';
    if(accepted&&best.pitchSemitones!=null)reason+='; low-frequency pitch compatible';
    const confidence=limit(1-best.total/(strict?.45:.65),0,1);
    return {accepted,kind:accepted?best.sample.kind:'Uncertain',winner:best,ranking,
      reason,margin,confidence};
  }
  root.JVDrumMatcher=Object.freeze({version:'1.0.0',analyze,score,rank,select,spectralDistance});
})(globalThis);
