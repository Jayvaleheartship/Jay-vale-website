#!/usr/bin/env python3
"""Read-only, per-frame vocal naturalness research, never AI-origin proof.

All features are signal measurements, not a classifier or signal-edit recipe.
References carry explicit provenance / license assertions. No source audio is
modified, no detector scores are recalibrated and no human identity is inferred.

Usage:
  python human_vocal_research.py --target lead=path/to/lead.mp3 \
      --target backing=path/to/backing.mp3 \
      --reference test_speech=path/to/voice.wav \
      --out /private/interlude/voice_research
"""
import argparse, csv, hashlib, json, math, subprocess
from pathlib import Path
from datetime import date
import numpy as np
from scipy.signal import resample_poly, correlate

FS = 16000
FRAME = 800  # 50 ms window, reliable short-term context
HOP = 320    # 20 ms time step
MAX_DURATION = 240


def digest(path):
    hasher = hashlib.sha256()
    with open(path,'rb') as f:
        while data := f.read(1024*1024): hasher.update(data)
    return hasher.hexdigest()


def decode(path):
    """Decode exactly the same 16 kHz stereo PCM for all recordings."""
    cmd = ['ffmpeg','-nostdin','-v','error','-i',str(path),'-t',str(MAX_DURATION),
           '-ac','2','-ar',str(FS),'-f','f32le','pipe:1']
    p = subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if p.returncode:
        raise ValueError('Could not decode audio: '+p.stderr.decode(errors='replace')[:250])
    samples=np.frombuffer(p.stdout,dtype='<f4')
    if samples.size==0 or samples.size%2:
        raise ValueError('No valid stereo samples decoded')
    return samples.reshape((-1,2)).copy()


def safe_float(value):
    v=float(value)
    return round(v,5) if math.isfinite(v) else None


def pitch_periodicity(frame):
    """Autocorrelation *candidate* on isolated vocals; not a validated F0 tracker."""
    x=np.asarray(frame,dtype=np.float64)
    x=x-np.mean(x)
    x*=np.hanning(len(x))
    corr=correlate(x,x,mode='full',method='fft')[len(x)-1:]
    if corr[0]<1e-9:
        return None,0.0
    lo=int(FS/700) # 700 Hz high pitch limit
    hi=min(len(corr)-1,int(FS/65)) # 65 Hz low pitch limit
    if hi<=lo:return None,0.0
    segment=corr[lo:hi+1]
    lag=lo+int(np.argmax(segment))
    periodicity=float(corr[lag]/corr[0])
    if periodicity<0.32:
        return None,periodicity
    return safe_float(FS/lag),safe_float(periodicity)


def frame_features(samples):
    if not isinstance(samples,np.ndarray) or samples.ndim!=2 or samples.shape[1]!=2:
        raise ValueError('Audio must have exactly 2 channels')
    if samples.shape[0]<FRAME or not np.all(np.isfinite(samples)):
        raise ValueError('Audio is too short or contains nonfinite samples')
    bins=np.fft.rfftfreq(FRAME,1/FS)
    w=np.hanning(FRAME)
    rows=[]
    prev=None
    for n in range(0,len(samples)-FRAME+1,HOP):
        x=samples[n:n+FRAME].astype('float64',copy=False)
        l,r=x[:,0],x[:,1]
        mid=(l+r)*0.5
        side=(l-r)*0.5
        rms=float(np.sqrt(np.mean(mid*mid)))
        if rms<0.0008:continue
        m=np.abs(np.fft.rfft(mid*w))
        m=np.maximum(m,1e-9)
        energy=m*m
        e_sum=energy.sum()
        centroid=float(np.sum(bins*energy)/(e_sum+1e-12))
        cumsum=np.cumsum(energy)
        rolloff=float(bins[int(np.searchsorted(cumsum,.85*cumsum[-1]))])
        flatness=float(np.exp(np.mean(np.log(m)))/np.mean(m))
        flux=float(np.sqrt(np.mean(np.maximum(0,m/(np.sum(m)+1e-9)-prev)**2))) if prev is not None else 0
        prev=m/(np.sum(m)+1e-9)
        f0,periodicity=pitch_periodicity(mid)
        left=np.std(l);right=np.std(r)
        corr=float(np.corrcoef(l,r)[0,1]) if left>1e-7 and right>1e-7 else None
        side_rms=float(np.sqrt(np.mean(side*side)))
        # Mid/side ratio is a mixing/spatial metric, not a human-vs-AI fingerprint.
        side_db=float(20*np.log10(max(side_rms,1e-9)/max(rms,1e-9)))
        # Noise-like spectral energy, NOT an asserted inhale or consonant label.
        hi_energy=float(np.sum(energy[(bins>=3500)&(bins<7000)]))
        lo_energy=float(np.sum(energy[(bins>=80)&(bins<3000)]))
        rows.append({'time_sec':round(n/FS,3),'rms_dbfs':safe_float(20*np.log10(rms+1e-12)),
          'f0_candidate_hz':f0,'periodicity':periodicity,'spectral_centroid_hz':safe_float(centroid),
          'spectral_rolloff_85_hz':safe_float(rolloff),'spectral_flatness':safe_float(flatness),
          'positive_spectral_flux':safe_float(flux),
          'high_low_energy_db':safe_float(10*np.log10((hi_energy+1e-12)/(lo_energy+1e-12))),
          'lr_correlation':safe_float(corr) if corr is not None else None,
          'side_to_mid_db':safe_float(side_db)})
    return rows


def summary(rows):
    def stats(key):
        a=np.asarray([row[key] for row in rows if row[key] is not None],dtype='float64')
        if not len(a):return {'count':0,'median':None,'p10':None,'p90':None}
        return {'count':len(a),'median':safe_float(np.median(a)),
                'p10':safe_float(np.percentile(a,10)),'p90':safe_float(np.percentile(a,90))}
    fields=['rms_dbfs','f0_candidate_hz','periodicity','spectral_centroid_hz',
            'spectral_rolloff_85_hz','spectral_flatness','positive_spectral_flux',
            'high_low_energy_db','lr_correlation','side_to_mid_db']
    return {'active_frames':len(rows),'frame_ms':50,'hop_ms':20,'analysis_rate_hz':16000,
            'metrics':{k:stats(k) for k in fields},
            'measurement_limits':['autocorrelation F0 is candidate-only and may be wrong on harmony/effects',
              'no reliable jitter/shimmer result is inferred from MP3 or processed multitrack mixes',
              'speech and singing distributions are not interchangeable',
              'stereo features predominantly reflect recording/mixing, not human provenance',
              'features are insufficient to determine AI origin or justify human-recorded attribution']}


def write_analysis(out,filename,samples,source_role,provenance):
    rows=frame_features(samples)
    if not rows:raise ValueError('No active audio frames found')
    target=Path(out);target.mkdir(parents=True,exist_ok=True)
    filename=''.join(ch for ch in filename if ch.isalnum() or ch in '-_')
    if not filename:raise ValueError('Invalid analysis identifier')
    with (target/(filename+'_features.csv')).open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    report={'recording_id':filename,'role':source_role,'provenance':provenance,
            'features':summary(rows),'origin_classifier':'NOT RUN',
            'audio_output_modified':False}
    (target/(filename+'_summary.json')).write_text(json.dumps(report,indent=2)+'\n')
    return report


def run(targets,references,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    reports=[]
    for kind,group in [('interlude_reference',targets),('candidate_human_reference',references)]:
        for name,path in group:
            src=Path(path)
            if not src.is_file():raise FileNotFoundError(src)
            provenance={'file_sha256':digest(src),'source_file':src.name,
              'verified_human_recording':False,
              'status':'Interlude source is a Suno/reference stem' if kind=='interlude_reference'
                       else 'User-supplied recording: human capture not independently verified'}
            report=write_analysis(out,name,decode(src),kind,provenance)
            reports.append(report)
    index={'project':'Interlude x Detuned Fragments','generated_on':date.today().isoformat(),
      'report_count':len(reports),'analysis_only':True,'no_detectors_or_audio_edits':True,
      'reports':[{'recording_id':r['recording_id'], 'role':r['role'],
                   'sha256':r['provenance']['file_sha256'],
                   'human_provenance_verified':False} for r in reports]}
    (out/'VOICE_REFERENCE_RESEARCH_INDEX.json').write_text(json.dumps(index,indent=2)+'\n')
    return index


def parse_entry(text):
    if '=' not in text: raise argparse.ArgumentTypeError('Use label=/full/path/to/audio')
    label,path=text.split('=',1)
    if not label or not path:raise argparse.ArgumentTypeError('Missing label or path')
    return label,path

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--target',action='append',type=parse_entry,required=True)
    ap.add_argument('--reference',action='append',type=parse_entry,default=[])
    ap.add_argument('--out',required=True)
    ns=ap.parse_args()
    print(json.dumps(run(ns.target,ns.reference,ns.out),indent=2))