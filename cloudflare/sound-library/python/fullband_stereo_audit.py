#!/usr/bin/env python3
"""48kHz two-channel spectral/phase audit for every original Interlude stem.

This supplements 16kHz microframes with true 8–24 kHz source-band data.
It measures spectral/channel characteristics; no AI-authorship inference.
"""
import csv,json,subprocess,sys
from pathlib import Path
import numpy as np
from analyze_interlude import sh256,ffprobe

FS=48000
BANDS=[(20,160),(160,800),(800,4000),(4000,8000),(8000,12000),(12000,18000),(18000,24000)]
NFFT=8192; HOP=12000

def decode48(path):
 cmd=['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-i',str(path),
      '-vn','-ac','2','-ar','48000','-f','f32le','-acodec','pcm_f32le','pipe:1']
 result=subprocess.run(cmd,capture_output=True,check=True).stdout
 if len(result)%8:raise ValueError('Invalid 48 kHz decoded stereo frames')
 x=np.frombuffer(result,dtype='<f4').reshape(-1,2).copy()
 if not np.isfinite(x).all():raise ValueError('Non-finite source samples')
 return x

def inspect(path,out):
 audio=decode48(path)
 frames=len(audio)
 if frames!=9268992:raise ValueError('Interlude source stem expected 9,268,992 exactly aligned frames, found '+str(frames))
 window=np.hanning(NFFT).astype('float32')
 hz=np.fft.rfftfreq(NFFT,d=1/FS)
 masks=[(hz>=lo)&(hz<hi) for lo,hi in BANDS]
 totals={str(lo)+'-'+str(hi):{'left':0.,'right':0.,'mid':0.,'side':0.,'cross_real':0.,'cross_imag':0.} for lo,hi in BANDS}
 records=[]
 for at in range(0,frames-NFFT+1,HOP):
  x=audio[at:at+NFFT]
  L=np.fft.rfft(x[:,0]*window)
  R=np.fft.rfft(x[:,1]*window)
  Pleft=np.abs(L)**2;Pright=np.abs(R)**2
  Pmid=.25*np.abs(L+R)**2;Pside=.25*np.abs(L-R)**2
  cross=L*np.conj(R)
  record={'window_start_sec':round(at/FS,4)}
  for (lo,hi),mask in zip(BANDS,masks):
   key=str(lo)+'-'+str(hi)
   vals=totals[key]
   l=float(Pleft[mask].sum());r=float(Pright[mask].sum())
   mid=float(Pmid[mask].sum());side=float(Pside[mask].sum())
   c=cross[mask].sum()
   for typ,n in [('left',l),('right',r),('mid',mid),('side',side),('cross_real',float(c.real)),('cross_imag',float(c.imag))]:vals[typ]+=n
   record[key+'_mono_loss_db']=round(10*np.log10((mid+1e-18)/(.5*(l+r)+1e-18)),3)
   record[key+'_lr_coherence']=round(float(c.real)/(np.sqrt(l*r)+1e-18),4)
  records.append(record)
 out.mkdir(parents=True,exist_ok=True)
 with (out/(path.stem+'_fullband_spatial_frames.csv')).open('w',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=records[0].keys());writer.writeheader();writer.writerows(records)
 bands={}
 for key,v in totals.items():
  lr=.5*(v['left']+v['right'])
  loss=10*np.log10((v['mid']+1e-20)/(lr+1e-20))
  coh=v['cross_real']/(np.sqrt(v['left']*v['right'])+1e-20)
  side_mid=10*np.log10((v['side']+1e-20)/(v['mid']+1e-20))
  bands[key]={'mono_fold_loss_db':round(float(loss),3),
   'lr_complex_phase_coherence_real':round(float(coh),5),
   'side_to_mid_power_db':round(float(side_mid),3),
   'source_band_power_fraction':round(float(lr)/(sum(.5*(x['left']+x['right']) for x in totals.values())+1e-20),5)}
 report={'file':path.name,'source_sha256':sh256(path),'original_samplerate':int(ffprobe(path).get('sample_rate',0)),
   'decoded_frames_at_48khz':frames,'decoded_duration_sec':frames/FS,
   'window_samples':NFFT,'window_hop_samples':HOP,'analysis_windows':len(records),
   'bands':bands,'independent_reconstruction':False,
   'note':'Measured 48kHz original MP3 source, not a proof of AI/human creation. Mono loss = mid spectral power vs channel average. No direct audible reconstruction performed.'}
 (out/(path.stem+'_fullband_summary.json')).write_text(json.dumps(report,indent=2)+'\n')
 return report

def run(source,out):
 source=Path(source);out=Path(out);reports=[]
 for idx in range(12):
  matches=list(source.glob(str(idx)+' *.mp3'))
  if len(matches)!=1:raise ValueError('Missing or ambiguous Interlude stem '+str(idx))
  print('FULLBAND',matches[0].name,flush=True)
  reports.append(inspect(matches[0],out))
 (out/'FULLBAND_ALL_12_STEMS.json').write_text(json.dumps({'samples':48_000,'count':12,
   'sources':[{'name':r['file'],'sha256':r['source_sha256']} for r in reports],
   'status':'SOURCE_ANALYSIS_COMPLETED_NOT_INDEPENDENT_RECONSTRUCTION'},indent=2)+'\n')
 return reports

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: fullband_stereo_audit.py <12-source-stems-folder> <reports-folder>')
 x=run(*sys.argv[1:]);print('COMPLETE',len(x),'source stems at native 48 kHz')