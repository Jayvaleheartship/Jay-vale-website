#!/usr/bin/env python3
"""Mix ONLY 12 approved independent Interlude stems into a 24-bit WAV candidate.

This utility will not combine AI reference stems, skip missing human vocal takes,
use unlicensed instruments, or substitute detector scores. Quality and provenance
are mandatory input evidence. Final AI scan/master watermark are separate steps.
"""
import hashlib,json,math,sys
from pathlib import Path
import numpy as np
import soundfile as sf
from analyze_interlude import sh256

SOURCE_STEMS={f'{i} {n}.mp3' for i,n in enumerate([
  'Lead Vocals','Backing Vocals','Drums','Bass','Guitar','Keyboard',
  'Percussion','Strings','Synth','Other','Brass','Woodwinds'])}
FRAMES=9268992
SAMPLE_RATE=48000

def check_approval_entry(record,source_hashes):
 stem=record.get('source_stem')
 if stem not in SOURCE_STEMS:raise ValueError('Unexpected or unidentified stem mapping')
 if record.get('real_recorded_source') is not True:raise ValueError('Source has not been independently recorded')
 if record.get('license_verified') is not True:raise ValueError('Missing verified license/provenance')
 if record.get('95_percent_listening_accepted') is not True:raise ValueError('95 percent listening acceptance missing')
 if record.get('stem_detector_reviewed') is not True:raise ValueError('Required per-stem detector review missing')
 probability=record.get('ai_probability')
 if not isinstance(probability,(float,int)) or not np.isfinite(probability):raise ValueError('Detector score not available')
 if probability>15 or probability<0:raise ValueError('Score above 15 percent internal review threshold')
 if not record.get('detector_model_id') or not record.get('provider_report_sha256'):
  raise ValueError('Detector provenance not available')
 path=Path(record.get('rebuilt_file','')).resolve()
 if not path.is_file() or path.suffix.lower()!='.wav':raise ValueError('Verified rebuilt WAV missing')
 digest=sh256(path)
 if digest!=record.get('rebuilt_sha256'):raise ValueError('WAV checksum mismatch')
 if digest in source_hashes:raise ValueError('A reference Suno stem was presented as independently rebuilt')
 info=sf.info(str(path))
 if info.samplerate!=SAMPLE_RATE or info.channels!=2 or info.frames!=FRAMES:
  raise ValueError('Stem has incorrect timing/sample rate/stereo format')
 return path

def mix_only_approved(approval_file,source_manifest_file,output):
 approval=json.loads(Path(approval_file).read_text())
 source=json.loads(Path(source_manifest_file).read_text())
 source_hashes={x['source_sha256'] for x in source['stems']}
 rows=approval.get('stems',[])
 if len(rows)!=12 or {x.get('source_stem') for x in rows}!=SOURCE_STEMS:
  raise ValueError('Exactly 12 approved stems required: all 10 music + real lead/backing')
 paths=[check_approval_entry(x,source_hashes) for x in rows]
 if len(set(str(p) for p in paths))!=12:
  raise ValueError('Duplicate WAVs used for multiple roles without justified provenance')
 if Path(output).exists():raise ValueError('Output already exists; refusing overwrite')
 # Stream chunks, avoid a 900+ MB RAM mix.
 path=Path(output);path.parent.mkdir(parents=True,exist_ok=True)
 chunksize=48000
 gain=10**(-12/20)
 maxpk=0.;energy=0.;fold=0.;written=0
 with sf.SoundFile(str(path),mode='x',samplerate=SAMPLE_RATE,channels=2,subtype='PCM_24') as out:
  handles=[sf.SoundFile(str(p)) for p in paths]
  try:
   while written<FRAMES:
    count=min(chunksize,FRAMES-written)
    audio=np.zeros((count,2),dtype=np.float64)
    for h in handles:
     chunk=h.read(count,dtype='float32',always_2d=True)
     if len(chunk)!=count:raise ValueError('Unexpected stem truncation')
     audio+=chunk
    audio*=gain
    peak=float(np.max(np.abs(audio)))
    if peak>0.999:
     raise ValueError('Potential summed clipping at '+str(written/SAMPLE_RATE)+' seconds; adjust gains explicitly')
    out.write(audio.astype('float32'))
    maxpk=max(maxpk,peak)
    energy+=float(np.square(audio).sum())
    fold+=float(np.square(.5*(audio[:,0]+audio[:,1])).sum())
    written+=count
  finally:
   for h in handles:h.close()
 result={'wav':str(path),'sha256':sh256(path),'stems':len(paths),
   'duration_sec':written/SAMPLE_RATE,'sample_rate_hz':SAMPLE_RATE,
   'channels':2,'bit_depth':24,'common_gain_db':-12,
   'peak_before_final_master':round(maxpk,5),
   'overall_rms_dbfs':round(20*math.log10(math.sqrt(energy/(written*2)+1e-20)),3),
   'mono_fold_loss_db':round(10*math.log10((fold+1e-20)/(energy/2+1e-20)),3),
   'actual_final_ai_scan':'NOT RUN',
   'human_sources_verified_by_input':True,
   'is_release_master':False}
 (path.parent/(path.stem+'_MIX_AUDIT.json')).write_text(json.dumps(result,indent=2)+'\n')
 return result

if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('usage: mix_approved.py <all_stem_approvals.json> <source_manifest.json> <candidate_output.wav>')
 result=mix_only_approved(*sys.argv[1:]);print(json.dumps(result,indent=2))