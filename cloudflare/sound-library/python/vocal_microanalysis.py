#!/usr/bin/env python3
"""Reference and recorded lead/backing vocal forensics (not detector evasion).

Analyzes pitch candidates, vocal spectral balance, stereo width/phase, dynamics,
noise and approximate LPC formants; never claims generated vocals became human.
New real vocal recordings must be supplied and declared with provenance.
"""
import csv,json,math,subprocess,sys
from pathlib import Path
import numpy as np
from scipy.signal import stft,lfilter
from analyze_interlude import sh256,decode

FS=16000

def db(v):return round(20*math.log10(max(float(v),1e-12)),3)

def formants_lpc(frame, fs=FS, order=18):
 """Approximate vocal tract resonances; not speaker identification."""
 if len(frame)<order*2:return []
 x=np.asarray(frame,dtype=np.float64)
 x=lfilter([1,-.97],[1],x)
 x*=np.hamming(len(x))
 if np.sqrt(np.mean(x*x))<.008:return []
 # Levinson-Durbin autocorrelation solver with stability bounds.
 ac=np.correlate(x,x,'full')[len(x)-1:len(x)+order]
 if ac[0]<1e-12:return []
 a=np.array([1.]);noise=float(ac[0]);
 for i in range(1,order+1):
  if noise<1e-12:return []
  refl=-(float(ac[i])+sum(a[k]*float(ac[i-k]) for k in range(1,len(a))))/noise
  refl=np.clip(refl,-.999,.999)
  a=np.r_[a,0.]+refl*np.r_[0.,a[::-1]]
  noise*=max(1e-6,1-refl*refl)
 try:roots=np.roots(a)
 except np.linalg.LinAlgError:return []
 roots=roots[np.imag(roots)>=0]
 freqs=np.angle(roots)*fs/(2*np.pi)
 bw=-.5*fs/np.pi*np.log(np.maximum(np.abs(roots),1e-9))
 return sorted(round(float(f),1) for f,b in zip(freqs,bw) if 200<f<4500 and 0<b<500)[:4]

def voice_features(path,name,outputdir):
 audio=decode(path)
 frame=int(.04*FS);hop=int(.02*FS)
 rows=[];spectra=[]
 for at in range(0,len(audio)-frame,hop):
  chunk=audio[at:at+frame].astype(np.float64)
  l,r=chunk[:,0],chunk[:,1]
  mid=.5*(l+r);side=.5*(l-r)
  rms=np.sqrt(np.mean(mid*mid));
  if rms<0.0005:continue
  side_ratio=np.sqrt(np.mean(side*side))/(rms+1e-12)
  corr=float(np.corrcoef(l,r)[0,1]) if np.std(l)>1e-8 and np.std(r)>1e-8 else 0
  z=np.abs(np.fft.rfft(mid*np.hanning(frame)))
  hz=np.fft.rfftfreq(frame,1/FS)
  spectral_centroid=float(np.sum(hz*z)/(np.sum(z)+1e-12))
  spec_db=np.log10(z+1e-8)
  hi=int(np.searchsorted(hz,4000));low=int(np.searchsorted(hz,500))
  spectral_tilt=float(np.mean(spec_db[hi:])-np.mean(spec_db[low:hi]))
  # 4-second spaced LPC keeps the forensic pass bounded.
  formants=formants_lpc(mid) if len(rows)%200==0 else []
  rows.append({'time_sec':round(at/FS,3),'mid_rms_dbfs':db(rms),
    'side_to_mid_db':db(side_ratio),'lr_correlation':round(corr,4),
    'centroid_hz':round(spectral_centroid,1),
    'high_low_spectral_tilt_log10':round(spectral_tilt,4),
    'formants_candidate_hz':';'.join(map(str,formants))})
 outputdir.mkdir(parents=True,exist_ok=True)
 pathout=outputdir/(name+'_voice_microframes.csv')
 with pathout.open('w',newline='') as out:
  w=csv.DictWriter(out,fieldnames=rows[0].keys() if rows else ['time_sec']);w.writeheader();w.writerows(rows)
 summary={'recording_file':path.name,'sha256':sh256(path),
  'duration_sec':len(audio)/FS,'analyzed_voiced_or_active_windows':len(rows),
  'analysis_hop_ms':20,'analysis_window_ms':40,
  'median_active_mid_rms_dbfs':float(np.median([r['mid_rms_dbfs'] for r in rows])) if rows else None,
  'median_active_side_to_mid_db':float(np.median([r['side_to_mid_db'] for r in rows])) if rows else None,
  'median_active_lr_correlation':float(np.median([r['lr_correlation'] for r in rows])) if rows else None,
  'mean_active_spectral_centroid_hz':round(float(np.mean([r['centroid_hz'] for r in rows])),2) if rows else None,
  'human_performance_verified':False,
  'missing_features':['human take provenance','phoneme alignment/transcription','sufficiently reliable jitter/shimmer','validated vocal formant tracking'],
  'warning':'Stereo and spectral features do not establish AI vs human origin; approximate formants have high uncertainty on processed/polyphonic audio'}
 (outputdir/(name+'_voice_summary.json')).write_text(json.dumps(summary,indent=2)+'\n')
 return summary

def analyze_pair(lead,backing,out,recorded_lead=None,recorded_backing=None):
 out=Path(out);summaries={}
 for name,p in [('lead_reference',Path(lead)),('backing_reference',Path(backing))]:
  summaries[name]=voice_features(p,name,out)
 if recorded_lead and recorded_backing:
  for name,p in [('lead_real',Path(recorded_lead)),('backing_real',Path(recorded_backing))]:
   summaries[name]=voice_features(p,name,out)
   summaries[name]['human_performance_verified']='REQUIRES_USER_CONFIRMED_RECORDING_PROVENANCE'
 else:
  summaries['human_vocal_recording_status']='BLOCKED: new lead and backing human performances not supplied'
 (out/'VOICE_REFERENCE_VS_REAL_STATUS.json').write_text(json.dumps(summaries,indent=2)+'\n')
 return summaries

if __name__=='__main__':
 if len(sys.argv) not in (4,6):raise SystemExit('usage: vocal_microanalysis.py <lead.mp3> <backing.mp3> <output_dir> [real_lead.wav real_backing.wav]')
 summaries=analyze_pair(*sys.argv[1:])
 print('Voice analysis generated; real vocal status:',summaries.get('human_vocal_recording_status','requires provenance verification'))