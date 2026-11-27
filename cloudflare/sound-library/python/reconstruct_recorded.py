#!/usr/bin/env python3
"""Reconstruct Interlude instrumental layers only from verifiable independent recordings.

Production execution requires an approved event map for ALL TEN instrumental stems.
Source-derived audio and unverifiable licenses are never accepted as replacements.
The rendered candidate is NOT a finished master; A/B and real-vocal gates follow.
"""
import csv,hashlib,json,math,os,subprocess,sys
from pathlib import Path
from fractions import Fraction
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly,stft
from interlude_workflow import SAFE_LICENSES,sh256

EXPECTED_INSTRUMENT_STEMS={f'{n} {name}.mp3' for n,name in [(2,'Drums'),(3,'Bass'),(4,'Guitar'),(5,'Keyboard'),(6,'Percussion'),(7,'Strings'),(8,'Synth'),(9,'Other'),(10,'Brass'),(11,'Woodwinds')]}
OUTPUT_SR=48000

def recording_audio(path):
 audio,sr=sf.read(str(path),dtype='float32',always_2d=True)
 if not sr or not len(audio):raise ValueError('No audio in independent recording')
 if audio.shape[1] not in (1,2):raise ValueError('Samples must be mono or stereo')
 if not np.isfinite(audio).all():raise ValueError('Independent recording has invalid samples')
 if sr!=OUTPUT_SR:
  frac=Fraction(OUTPUT_SR,int(sr))
  audio=resample_poly(audio,frac.numerator,frac.denominator,axis=0).astype('float32')
 if audio.shape[1]==1:audio=np.repeat(audio,2,axis=1)
 return audio

def safe_event(ev,bankroot,source_hashes):
 path=(bankroot/str(ev.get('file',''))).resolve()
 if not path.is_relative_to(bankroot) or not path.is_file():raise ValueError('Missing or escaped sample audio path')
 if path.suffix.lower() not in ('.wav','.flac','.ogg'):raise ValueError('Recording must be a supported lossless/library format')
 digest=sh256(path)
 if digest!=str(ev.get('sha256','')).lower():raise ValueError('Independent sample checksum mismatch')
 if digest in source_hashes:raise ValueError('Original Suno stem re-used as a purported recording')
 if ev.get('license') not in SAFE_LICENSES:raise ValueError('Source lacks approved license')
 url=str(ev.get('source_url',''))
 if not url.startswith(('https://','owned-recording:')):raise ValueError('Missing recording provenance URL')
 if ev.get('source_kind') not in ('recorded-instrument','recorded-performance'):
  raise ValueError('Unverifiable independent recorded source')
 at=float(ev['at_sec']);duration=float(ev['duration_sec']);gain=float(ev.get('gain',1));pan=float(ev.get('pan',0))
 if not np.isfinite([at,duration,gain,pan]).all() or min(at,duration)<0 or duration<=0 or gain<0 or gain>3 or not(-1<=pan<=1):
  raise ValueError('Invalid event time, gain or pan')
 return {'path':path,'sha256':digest,'at_sec':at,'duration_sec':duration,'gain':gain,'pan':pan,
    'license':ev['license'],'source_url':url}

def validate_map(map_path,bankroot,source_manifest):
 data=json.loads(Path(map_path).read_text())
 if data.get('source_zip_sha256')!=source_manifest['source_archive_sha256']:
  raise ValueError('Event map references another song/source archive')
 source_hashes={s['source_sha256'] for s in source_manifest['stems']}
 stems=data.get('stems')
 if not isinstance(stems,list) or {s.get('source_stem') for s in stems}!=EXPECTED_INSTRUMENT_STEMS:
  raise ValueError('All 10 instrumental stems must be covered exactly once')
 names=[s['source_stem'] for s in stems]
 if len(names)!=10:raise ValueError('Duplicate instrumental stem')
 validated={}
 for stem in stems:
  coverage=stem.get('coverage',{})
  required=['all_audible_layers_identified','all_note_and_effect_events_covered',
    'residual_effect_tails_addressed','source_recordings_independent','rights_verified']
  if not all(coverage.get(x) is True for x in required):
   raise ValueError('Coverage gate unresolved for '+stem['source_stem'])
  if not stem.get('events') or not isinstance(stem['events'],list):
   raise ValueError('No real note/hit events verified for '+stem['source_stem'])
  events=[safe_event(e,bankroot,source_hashes) for e in stem['events']]
  maxend=max(x['at_sec']+x['duration_sec'] for x in events)
  if maxend>193.104+0.005:raise ValueError('Event exceeds original song duration')
  validated[stem['source_stem']]=events
 return validated

def render_stem(events,output_path,duration_sec=193.104):
 n=int(round(duration_sec*OUTPUT_SR))
 output=np.zeros((n,2),dtype=np.float32)
 cache={}
 for ev in events:
  key=str(ev['path'])
  if key not in cache:cache[key]=recording_audio(ev['path'])
  sample=cache[key]
  at=int(round(ev['at_sec']*OUTPUT_SR))
  required=min(int(round(ev['duration_sec']*OUTPUT_SR)),n-at)
  if required<=0:continue
  if len(sample)<required:
   raise ValueError('Sample recording is too short for the approved sustain length: '+key)
  audio=sample[:required].copy()
  # 4 ms attack/12 ms release avoids clicks without changing recorded tone.
  fadein=min(required//2,int(.004*OUTPUT_SR))
  fadeout=min(required//2,int(.012*OUTPUT_SR))
  if fadein:audio[:fadein]*=np.linspace(0,1,fadein)[:,None]
  if fadeout:audio[-fadeout:]*=np.linspace(1,0,fadeout)[:,None]
  pan=ev['pan']
  gains=np.array([math.cos((pan+1)*math.pi/4),math.sin((pan+1)*math.pi/4)],dtype='float32')
  audio*=float(ev['gain'])*gains[None,:]
  output[at:at+required]+=audio
 peak=float(np.max(np.abs(output)))
 if peak>1:raise ValueError('Unapproved stem clipping; revise mapping/gain, do not silently limit')
 sf.write(str(output_path),output,OUTPUT_SR,subtype='PCM_24')
 check=sf.info(str(output_path))
 if check.samplerate!=OUTPUT_SR or check.frames!=n:raise ValueError('Rendered stem failed WAV integrity check')
 return {'wav':str(output_path),'sha256':sh256(output_path),'peak':peak,
   'rendered_events':len(events),'frames':n,'sample_rate':OUTPUT_SR}

def compare_source_and_candidate(source_mp3,reconstructed_wav):
 """Technical differences only; does NOT output a 95% human listening claim."""
 cmd=['ffmpeg','-nostdin','-v','error','-i',str(source_mp3),'-ac','2','-ar','16000',
       '-f','f32le','pipe:1']
 orig=subprocess.run(cmd,capture_output=True,check=True).stdout
 orig=np.frombuffer(orig,dtype='<f4').reshape(-1,2)
 sample,sr=sf.read(str(reconstructed_wav),dtype='float32',always_2d=True)
 if sr!=16000:
  frac=Fraction(16000,int(sr))
  sample=resample_poly(sample,frac.numerator,frac.denominator,axis=0)
 count=min(len(orig),len(sample))
 a=orig[:count].mean(axis=1).astype(float);b=sample[:count].mean(axis=1).astype(float)
 a-=np.mean(a);b-=np.mean(b)
 corr=float(np.dot(a,b)/(np.linalg.norm(a)*np.linalg.norm(b)+1e-20))
 ref_rms=float(np.sqrt(np.mean(a*a)));new_rms=float(np.sqrt(np.mean(b*b)))
 # Spectral difference is calculated independently of raw phase/correlation.
 _,_,xa=stft(a[::4],fs=4000,nperseg=1024,noverlap=512)
 _,_,xb=stft(b[::4],fs=4000,nperseg=1024,noverlap=512)
 log_distance=float(np.median(np.abs(np.log1p(100*np.abs(xa))-np.log1p(100*np.abs(xb)))))
 return {'waveform_correlation':round(corr,6),
  'rms_relative_db':round(20*np.log10((new_rms+1e-12)/(ref_rms+1e-12)),3),
  'spectral_log_magnitude_distance':round(log_distance,6),
  'human_95_percent_listening_approved':False,
  'warning':'Neither waveform correlation nor spectral distance alone establishes perceived 95% similarity'}

def run(mapfile,source_manifest_file,source_dir,bankroot,out):
 source_manifest=json.loads(Path(source_manifest_file).read_text())
 bankroot=Path(bankroot).resolve();out=Path(out)
 validated=validate_map(mapfile,bankroot,source_manifest)
 out.mkdir(parents=True,exist_ok=True)
 qc=[]
 for name,events in validated.items():
  destination=out/(name.replace('.mp3','_RECORDED_REBUILD.wav'))
  output=render_stem(events,destination)
  comparison=compare_source_and_candidate(Path(source_dir)/name,destination)
  qc.append({'source_stem':name,'render':output,'technical_comparison':comparison,
    'status':'READY_FOR_INDEPENDENT_LISTENING_REVIEW_NOT_95_ACCEPTED'})
 (out/'INSTRUMENTAL_REBUILD_A_B_QC.json').write_text(json.dumps(qc,indent=2)+'\n')
 return qc

if __name__=='__main__':
 if len(sys.argv)!=6:raise SystemExit('usage: reconstruct_recorded.py <approved_events.json> <original_manifest.json> <original_source_folder> <licensed_sample_bank> <output_folder>')
 qc=run(*sys.argv[1:]);print('Rendered',len(qc),'instrument stems; manual fidelity and AI detector gates remain pending')