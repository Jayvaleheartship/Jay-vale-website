#!/usr/bin/env python3
"""Interlude-specific fixed-order pipeline with truthful gates and sample matching.

Runs real source analysis, selects evidence-based licensed sample candidates,
creates per-song checklists, and BLOCKS final rendering if actual independent
recordings / human vocal performances / licensed samples are not available.
Does not edit audio to mislead classifiers; no AI score is invented.
"""
import csv,hashlib,json,math,os,subprocess,sys,re
from pathlib import Path
from functools import lru_cache
import numpy as np
from scipy.signal import stft
from analyze_interlude import main as analyze_zip, sh256, decode, ffprobe

STAGES=[
 'Open Interlude private project and preserve source ownership',
 'Verify original human lyrics/music reference and creators',
 'Archive the Suno draft/model/prompt and establish song arrangement',
 'Verify complete ZIP containing every source stem',
 'Decode and analyze timing, format, dynamics and channels',
 'Micro-analyze all source stems and vocal/spatial material',
 'Identify and acquire traceably licensed real sample recordings',
 'Render independent instrumental stems from approved recordings',
 'Verify 95% listener fidelity and unbiased objective A/B metrics',
 'Capture/graft real lead and backing performances and microanalyze them',
 'Scan every original and rebuilt stem with authorized ACRCloud',
 'Review all detection concerns and verify real source provenance',
 'Mix genuine replacement instrumentals and real recorded vocals to WAV',
 'Detect on final rendered WAV and review 15% flags',
 'Embed and verify release metadata and optional real watermark',
 'Package final verified master and working download link'
]
PUBLIC_SOURCES={
 'Guitar':[{'name':'Meta Open Sound nylon & steel guitar','url':'https://github.com/facebookincubator/Meta-open-sound','license':'CC0-1.0','family':'guitar'}],
 'Keyboard':[{'name':'Meta Open Sound upright piano','url':'https://github.com/facebookincubator/Meta-open-sound','license':'CC0-1.0','family':'keys'}],
 'Strings':[{'name':'Versilian Community Sample Library Strings','url':'https://versilian-studios.com/vcsl/','license':'CC0-1.0','family':'strings'}],
 'Brass':[{'name':'Versilian Community Sample Library Brass','url':'https://versilian-studios.com/vcsl/','license':'CC0-1.0','family':'brass'}],
 'Woodwinds':[{'name':'Versilian Community Sample Library Woodwinds','url':'https://versilian-studios.com/vcsl/','license':'CC0-1.0','family':'woodwinds'}],
 'Percussion':[{'name':'Versilian Community Sample Library Percussion','url':'https://versilian-studios.com/vcsl/','license':'CC0-1.0','family':'percussion'}],
 'Drums':[{'name':'Private Cloudflare CC0 drum bank - verify credentials','url':None,'license':'unknown until R2 provenance confirmed','family':'drums'}],
 'Bass':[{'name':'Private licensed bass and 808 bank - verify credentials','url':None,'license':'unknown until R2 provenance confirmed','family':'bass'}],
 'Synth':[{'name':'Independently performed and documented hardware synth','url':None,'license':'requires original recorded performance','family':'synth'}],
 'Other':[{'name':'Unidentified effects; needs listening/transcription','url':None,'license':'unknown','family':'other'}]
}
SAFE_LICENSES={'CC0-1.0','CC-BY-4.0','CC-BY-SA-4.0','commercial-license-verified','user-owned-original-recording'}

def normalize(a):
 a=np.asarray(a,dtype=np.float64)
 n=np.linalg.norm(a)
 return a/n if n>1e-9 else np.zeros_like(a)

def recording_profile(x,fs=16000):
 """Relative timbre/attack fingerprint; not an authorship or similarity percentage."""
 mono=np.asarray(x,dtype=np.float32).mean(axis=1)
 part=mono[:min(len(mono),int(.45*fs))]
 if len(part)<100:return None
 freq,_,z=stft(part,fs=fs,nperseg=min(len(part),1024),noverlap=min(768,max(0,len(part)//2)),boundary=None)
 mag=np.mean(np.abs(z),axis=1)
 # Log-bin summary to reduce sensitivity to exact note/phase
 bands=np.geomspace(35,fs/2,49)
 spectrum=[]
 for lo,hi in zip(bands[:-1],bands[1:]):
  m=(freq>=lo)&(freq<hi)
  spectrum.append(float(np.mean(mag[m])) if m.any() else 0.0)
 env=[]
 for i in range(0,min(len(part),int(.4*fs)),int(.02*fs)):
  seg=part[i:i+int(.02*fs)]
  env.append(float(np.sqrt(np.mean(seg.astype(float)**2))) if len(seg) else 0.0)
 return {'spectrum':normalize(np.log1p(500*np.array(spectrum))),'envelope':normalize(env),
         'peak':float(np.max(np.abs(part))),'sample_length_sec':len(x)/fs}

def profile_distance(a,b):
 if a is None or b is None:return None
 sa,sb=a['spectrum'],b['spectrum']
 ea,eb=a['envelope'],b['envelope']
 n=min(len(ea),len(eb))
 spectral_cos=float(np.dot(sa,sb))
 envelope_cos=float(np.dot(normalize(ea[:n]),normalize(eb[:n]))) if n else 0.0
 # Ranking only, never interpret as 95% validated audible fidelity.
 score=.82*spectral_cos+.18*envelope_cos
 return {'ranking_score':round(score,5),'spectral_cosine':round(spectral_cos,5),
 'envelope_cosine':round(envelope_cos,5),
 'not_95_percent_quality_test':True}

def approved_sample_catalogue(path):
 """Only reads samples with verifiable rights/provenance and current file hashes."""
 if not path or not Path(path).is_file():return [],[{'status':'catalogue_missing'}]
 base=Path(path).resolve().parent
 data=json.loads(Path(path).read_text())
 if not isinstance(data,list):raise ValueError('Sample catalogue must be an array')
 approved=[];refused=[]
 for sample in data:
  try:
   name=str(sample['name'])
   license=str(sample['license'])
   source=str(sample['source_url'])
   family=str(sample['family']).lower()
   filepath=(base/str(sample['file'])).resolve()
   if not filepath.is_relative_to(base):raise ValueError('sample path escapes local library')
   if license not in SAFE_LICENSES or not source.startswith(('https://','owned-recording:')):
    raise ValueError('license or source provenance missing/unsupported')
   if not filepath.exists():raise ValueError('actual sample audio file unavailable')
   if filepath.suffix.lower() not in ['.wav','.flac','.ogg','.mp3']:
    raise ValueError('unsupported audio format')
   digest=sh256(filepath)
   if digest!=str(sample['sha256']).lower():raise ValueError('sample checksum mismatch')
   info=ffprobe(filepath)
   if int(info.get('sample_rate',0))<=0:raise ValueError('invalid sample audio')
   approved.append({'name':name,'file':str(filepath),'sha256':digest,
      'license':license,'source_url':source,'family':family})
  except (ValueError,KeyError,OSError) as e:
   refused.append({'name':sample.get('name','unknown'),'reason':str(e)})
 return approved,refused

def rank_sample_candidates(manifest,library_samples,limit_events=24):
 """Conservative ranking: no automatic claim of an accepted replacement."""
 source_dir=Path(manifest['workspace'])/'source'
 cache={}
 for sample in library_samples:
  if sample['file'] in cache:continue
  arr=decode(Path(sample['file']))
  if len(arr)>16000*30:arr=arr[:16000*30]
  cache[sample['file']]=recording_profile(arr)
 rows=[]
 for stem in manifest['stems']:
  if stem['role']!='instrument':continue
  group=stem['name'].split(' ',1)[1].removesuffix('.mp3').lower()
  family={'keyboard':'keys','drums':'drums','bass':'bass','guitar':'guitar',
    'percussion':'percussion','strings':'strings','synth':'synth','brass':'brass',
    'woodwinds':'woodwinds','other':'other'}[group]
  options=[s for s in library_samples if s['family'] in [family,'all']]
  events_file=Path(manifest['workspace'])/'analysis'/f"{stem['stem_id']:02d}_onsets.csv"
  events=list(csv.DictReader(events_file.open()))[:limit_events]
  # Audition sampled source events, not the full recording's averaged FFT.
  if not options:
   rows.append({'stem':stem['name'],'at_sec':None,'sample':None,
      'status':'BLOCKED: no provenance-verified recording in required family'})
   continue
  source=decode(source_dir/stem['name'])
  for event in events:
   at=float(event['at_sec']);i=int(at*16000)
   ref=recording_profile(source[i:i+int(.45*16000)])
   ranked=[]
   for option in options:
    quality=profile_distance(ref,cache.get(option['file']))
    if quality is not None:ranked.append((quality['ranking_score'],option,quality))
   ranked.sort(key=lambda row:row[0],reverse=True)
   for score,option,quality in ranked[:3]:
    rows.append({'stem':stem['name'],'at_sec':round(at,3),
      'sample':option['name'],'sample_sha256':option['sha256'],
      'license':option['license'],'ranking_score':score,
      'spectral_cosine':quality['spectral_cosine'],
      'envelope_cosine':quality['envelope_cosine'],
      'status':'UNCONFIRMED CANDIDATE — do not render/claim 95% fidelity'})
 return rows

def init_project(manifest,project_dir,sample_catalogue=None):
 """Produces a track-specific, audited checklist without fabricating gate completion."""
 project_dir.mkdir(parents=True,exist_ok=True)
 sample_list,refused=approved_sample_catalogue(sample_catalogue)
 gap=[]
 for stem in manifest['stems']:
  if stem['role']=='vocal':continue
  category=stem['name'].split(' ',1)[1].removesuffix('.mp3')
  for source in PUBLIC_SOURCES.get(category,[]):
   gap.append({'stem_id':stem['stem_id'],'stem':stem['name'],
     'source_category':category,'candidate':source['name'],
     'license':source['license'],'source_url':source['url'],
     'downloaded':False,'acoustically_matched':False,'independent_rebuild':False,
     'note':'Public library verified as a candidate, but no individual recording acquired/compared'})
 with (project_dir/'sample_acquisition_queue.json').open('w') as f:json.dump(gap,f,indent=2)
 rows=rank_sample_candidates(manifest,sample_list) if sample_list else []
 (project_dir/'sample_candidate_ranking.json').write_text(json.dumps({'results':rows,
    'rejected_samples':refused,'approved_sample_count':len(sample_list),
    'accepted_rebuilds':0,'no_samples_automatically_accepted':True},indent=2)+'\n')
 detected={
   'provider':'ACRCloud','reference_mix_result':{'prediction':'AI Generated Music','likely_source':'Suno','ai_probability_percent':99.22,'observed_in_user_console_screenshot':True,'model_id':'not provided','source':'User screenshot 2026-11-20'},
   'provider_API_live':False,'stem_scan_results':{},'rebuild_scan_results':{},
   'reconstructed_final_mix_scan':None,
   'threshold_review_percent':15,'below_threshold_is_not_authorship_proof':True}
 (project_dir/'detection_registry.json').write_text(json.dumps(detected,indent=2)+'\n')
 progress={
  'song':'Interlude x Detuned Fragments (Mashup)','project_opened_utc':'2026-11-27',
  'artist':'Jay Vale','writer':'Jimmy Jansen','producer':'Jimmy Jansen','claimed_label':'Heartship Records',
  'work_order':'Fixed pipeline v1.0, cannot skip prerequisites',
  'zip_sha256':manifest['source_archive_sha256'],'source_stems_available':12,
  'source_stems_decoded_and_analyzed':12,
  'quality_acceptance_policy':{'fidelity_target':'95% listener-perceived similarity, not calculated from correlation',
    'AI_detection_review_red_flag_percent':15,'AI_original_stems_expected_to_flag':True},
  'steps':[{'number':i,'title':name,
     'status':('COMPLETE' if i==0 else 'BLOCKED'),
     'technical_evidence_available':(i in (3,4,5)),
     'blocker':None if i==0 else {
      1:'Original written lyrics / base composition files not verified in stem ZIP',
      2:'Original Suno master, model/prompt/generation details not supplied with stem ZIP',
      3:'ZIP available and 12/12 stems verified, but earlier mandatory origin steps unresolved',
      4:'Audio decoded and technical report exists; previous authoring steps unresolved',
      5:'12 STFT/onset/stereo summaries generated; formant transcription and all audible layers unresolved',
      6:'Licensed independent source sample downloads and private R2 bank audio not available in this run',
      7:'No verified 100% independently recorded instrumental stem reconstruction',
      8:'No verified independent rebuild to compare or listening approval',
      9:'No human re-recorded lead/backing vocals supplied',
      10:'ACRCloud API credentials unavailable; no per-stem live detector reports',
      11:'Previous stem-review gates incomplete',
      12:'Required independently recorded and accepted stems do not exist',
      13:'No complete verified WAV candidate to scan',
      14:'No accepted master to embed verified release metadata and watermark',
      15:'No accepted final master or valid final download link'
     }.get(i),'evidence':(['INTERLUDE_SOURCE_MANIFEST.json'] if i in (3,4) else ['analysis/*_summary.json','analysis/*_microframes_250ms.csv','analysis/*_onsets.csv'] if i==5 else [])}
     for i,name in enumerate(STAGES)],
  'outputs':{'final_master_wav':None,'watermark':None,'final_verified_download':None}
 }
 (project_dir/'project_state.json').write_text(json.dumps(progress,indent=2)+'\n')
 checklist=['# Interlude — Mandatory 16-stage song checklist','','Reference: SONG_PIPELINE_STANDARD.md','',
    '**Technical scan is evidence only; an out-of-order stage is BLOCKED until prerequisites pass.**','']
 for stage in progress['steps']:
  c='x' if stage['status']=='COMPLETE' else ' '
  checklist.append(f"- [{c}] **{stage['number']:02d} — {stage['title']}** — {stage['status']}")
  if stage.get('technical_evidence_available'):checklist.append('  - Technical evidence obtained (not an independent reconstruction)')
  if stage.get('blocker'):checklist.append('  - Blocker: '+stage['blocker'])
 checklist+=['','## Sample acquisition','',f"{len(sample_list)} independently provenance-approved audio samples loaded for candidate comparison.",
  f"{len(refused)} sample records rejected for missing license/file/checksum.",'',
  '## Final WAV','', '**NOT CREATED — prerequisites are blocked.**','']
 (project_dir/'CHECKLIST.md').write_text('\n'.join(checklist)+'\n')
 report=['# Interlude — Automation audit report','','**Run date:** 27 November 2026',
  '**Source:** original uploaded 12-stem MP3 ZIP (kept unchanged)',
  '**Performed:** all-file hashing, safety checks, synchronized decode, per-stem stereo/spectral/onset analysis, source candidate queue, review-gate file generation.',
  '**Not performed:** independent licensed sample recreation, human re-recorded vocals, authenticated ACRCloud per-stem tests, finished master.',
  '', '## Evidence snapshot','',
  '| Original stem | RMS dBFS | L/R corr. | Side/Mid dB | Candidate onsets retained |',
  '|---|---:|---:|---:|---:|']
 for stem in manifest['stems']:
  report.append(f"| {stem['name']} | {stem['rms_dbfs']} | {stem['lr_correlation']} | {stem['side_to_mid_db']} | {stem.get('number_of_retained_high_flux_onsets',stem.get('number_of_candidate_onsets'))} |")
 report+=['','### Stereo flags','',
  'Brass and Strings have negative broad-band L/R correlation, requiring a real mono-fold-down listening check.',
  'The source signal is sampled at 16 kHz for per-event analysis; the original source is 48 kHz MP3, and all high-band diagnostics above 8 kHz require a separate 48 kHz pass.',
  '', '### Reference AI result','',
  'The user provided a console screenshot of 99.22% AI probability / Suno on a reconstructed Interlude reference in the ACRCloud console. This is **not** a complete per-stem detector test. The exact source-master association and model version are not established by the stem ZIP.',
  '', '### Real-world action needed','',
  'A reproducible instrument reconstruction needs approved, independently recorded sample bytes from the private library or documented external CC0 sources; all ten instrument stems must then be rebuilt, transcribed and independently verified. Human vocal takes, ACRCloud private API access, and verified ownership metadata are separate gates.','']
 (project_dir/'INTERLUDE_AUTOMATION_REPORT.md').write_text('\n'.join(report)+'\n')
 return progress

if __name__=='__main__':
 if len(sys.argv)<3:raise SystemExit('usage: python interlude_workflow.py <source_zip> <private_workspace> [licensed_sample_catalogue.json]')
 archive=Path(sys.argv[1]);out=Path(sys.argv[2]);
 stem_workspace=out/'original_analysis'
 manifest=analyze_zip(archive,stem_workspace)
 manifest['workspace']=str(stem_workspace)
 sample_catalogue=sys.argv[3] if len(sys.argv)>3 else None
 progress=init_project(manifest,out/'project',sample_catalogue)
 print('PRODUCTION STATE:',len(progress['steps']),'fixed steps; verified source and microanalysis; independent recorded reconstruction blocked')