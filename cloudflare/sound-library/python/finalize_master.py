#!/usr/bin/env python3
"""High-integrity 24-bit WAV/BWF master packaging for Jay Vale, strictly gated.

Never treats an AI detector score as human-authorship proof. Does not create a
'release master' unless independent audio, real vocal, rights and detector
review evidence have all been explicitly verified. A separate verified audio
watermark is required by the Interlude release policy.
"""
import hashlib,json,subprocess,sys,datetime
from pathlib import Path
import soundfile as sf
from analyze_interlude import sh256

CREDITS={'artist':'Jay Vale','composer':'Jimmy Jansen','producer':'Jimmy Jansen',
 'writer':'Jimmy Jansen','publisher':'Heartship Records','label':'Heartship Records'}
REQUIRED_STAGES=[f'{i:02d}' for i in range(15)]

def validate_release_release_manifest(state,qa):
 issues=[]
 statuses={str(s.get('id','')):s for s in state.get('stages',[])}
 for stage in REQUIRED_STAGES:
  item=statuses.get(stage,{})
  if item.get('status')!='verified' or not item.get('verified_at') or not item.get('evidence'):
   issues.append('Stage '+stage+' is not evidence-verified')
 if qa.get('all_ten_instruments_independently_recorded') is not True:
  issues.append('All ten instrument stems are not independently re-performed/reconstructed')
 if qa.get('lead_and_backing_real_performances_verified') is not True:
  issues.append('Human lead and backing vocal provenance not verified')
 if qa.get('license_inventory_verified') is not True:
  issues.append('Sample license inventory not verified')
 if qa.get('human_listener_95_percent_approval') is not True:
  issues.append('User has not approved 95% listening-fidelity goal')
 if qa.get('full_mix_listening_approved') is not True:
  issues.append('Final mix listening quality not approved')
 if qa.get('watermark_applied_and_verified') is not True:
  issues.append('Required audio watermark not yet actually applied and verified')
 results=qa.get('rebuilt_stem_detection_results')
 if not isinstance(results,list) or len(results)<12:
  issues.append('Not all rebuilt/recorded stems have real detector reports')
 else:
  seen=set()
  for row in results:
   if row.get('stem_id') in seen:issues.append('Duplicate stem detector record')
   seen.add(row.get('stem_id'))
   probability=row.get('ai_probability')
   if not isinstance(probability,(int,float)) or not (0<=probability<=100):
    issues.append('Unknown AI score for stem '+str(row.get('stem_id')))
   elif probability>15:issues.append('Stem above 15% review flag: '+str(row.get('stem_id')))
   if row.get('provider')!='ACRCloud' or not row.get('model_id') or not row.get('provider_report_sha256'):
    issues.append('Detector result not provenance-verifiable for '+str(row.get('stem_id')))
 full=qa.get('final_wav_detector_result',{})
 p=full.get('ai_probability')
 if not isinstance(p,(int,float)) or not (0<=p<=15):
  issues.append('Final mix ACRCloud result missing or above 15% review threshold')
 if full.get('provider')!='ACRCloud' or not full.get('model_id') or not full.get('provider_report_sha256'):
  issues.append('Final ACRCloud report and model provenance not verified')
 if qa.get('mix_sha256') is None:issues.append('No independently hashed candidate WAV')
 return issues

def export_master(candidate,statepath,qapath,destination,master_date=None):
 candidate=Path(candidate).resolve();destination=Path(destination).resolve()
 state=json.loads(Path(statepath).read_text());qa=json.loads(Path(qapath).read_text())
 issues=validate_release_release_manifest(state,qa)
 if not candidate.is_file():issues.append('Candidate mix WAV does not exist')
 elif sh256(candidate)!=qa.get('mix_sha256'):
  issues.append('Candidate WAV hash no longer matches approved mix')
 if destination.exists():issues.append('Target already exists; overwriting is forbidden')
 if issues:raise ValueError('Master export BLOCKED:\n'+ '\n'.join('- '+i for i in issues))
 info=sf.info(str(candidate))
 if info.samplerate!=48000 or info.channels!=2:
  raise ValueError('Only reviewed 48k stereo mixes accepted')
 date=master_date or datetime.date.today().isoformat()
 datetime.date.fromisoformat(date)
 output=destination
 output.parent.mkdir(parents=True,exist_ok=True)
 command=['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-n','-i',str(candidate),
  '-map','0:a:0','-ar','48000','-ac','2','-c:a','pcm_s24le',
  '-metadata','title=Interlude',
  '-metadata','artist='+CREDITS['artist'],
  '-metadata','composer='+CREDITS['composer'],
  '-metadata','comment=Writer and Producer: Jimmy Jansen; Heartship Records',
  '-metadata','publisher='+CREDITS['publisher'],
  '-metadata','copyright=Copyright '+date[:4]+' Heartship Records. All rights reserved where applicable.',
  '-metadata','date='+date,
  '-metadata','creation_time='+date+'T12:00:00Z',
  '-write_bext','1',str(output)]
 subprocess.run(command,check=True,capture_output=True)
 decoded=sf.info(str(output))
 if decoded.samplerate!=48000 or decoded.channels!=2 or decoded.subtype!='PCM_24' or decoded.frames!=info.frames:
  raise ValueError('Master WAV integrity check failed')
 tagproc=subprocess.run(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(output)],
  check=True,capture_output=True,text=True)
 tags=json.loads(tagproc.stdout).get('format',{}).get('tags',{})
 normalized={str(k).lower():str(v) for k,v in tags.items()}
 # BWF INFO support varies by decoder; verify what is really embedded.
 if not any('Jay Vale' in x for x in normalized.values()):
  raise ValueError('Artist metadata could not be verified inside WAV')
 if not any('Jimmy Jansen' in x for x in normalized.values()):
  raise ValueError('Writer/producer metadata could not be verified inside WAV')
 if not any('Heartship Records' in x for x in normalized.values()):
  raise ValueError('Label metadata could not be verified inside WAV')
 report={'file':str(output),'sha256':sh256(output),'created_date':date,
   'frames':decoded.frames,'sample_rate':decoded.samplerate,'channels':decoded.channels,
   'bit_depth':24,'embedded_tags_verified':normalized,
   'watermark_status':'previously applied and verified via QA manifest; revalidate independently after delivery',
   'not_drm_locked':True,'ai_score_is_not_proof_of_human_authorship':True}
 (output.parent/(output.stem+'_VERIFIED_METADATA.json')).write_text(json.dumps(report,indent=2)+'\n')
 return report

if __name__=='__main__':
 if len(sys.argv) not in (5,6):
  raise SystemExit('usage: finalize_master.py <approved_mix.wav> <project.json> <quality.json> <destination.wav> [YYYY-MM-DD]')
 print(json.dumps(export_master(*sys.argv[1:]),indent=2))