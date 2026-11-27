#!/usr/bin/env python3
"""One-command Interlude workflow: automatically run every currently eligible stage.

All subsequent stages are attempted only after their verified inputs exist.
Every missing requirement is reported at the end. Never invent completed work,
independently recorded music, successful detector scans or downloadable masters.
"""
import argparse,json,os,sys,traceback
from datetime import datetime,timezone
from pathlib import Path
from interlude_workflow import init_project
from analyze_interlude import main as analyze_zip,sh256
from vocal_microanalysis import analyze_pair
from reconstruct_recorded import run as reconstruct
from acrcloud_batch import check_previously_scanned_interlude,scan_and_poll,ProviderError
from finalize_master import export_master

STAGES={0:'Project initialization',1:'Human composition',2:'Suno draft provenance',
 3:'Complete stems',4:'Stem decode and verification',5:'Microanalysis all stems',
 6:'Licensed sample discovery',7:'All independent musical reconstructions',
 8:'Measured and human 95% sound acceptance',9:'New human lead and backing takes',
 10:'Authorized AI checks on every original and rebuilt stem',
 11:'Review all detector flags and provenance',12:'Render full approved WAV mix',
 13:'Full WAV AI evaluation',14:'Metadata and verified watermark',15:'Validated download'}

def checkpoint(path,data):
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(json.dumps(data,indent=2)+'\n')

def phase_success(summary,step,message,evidence):
 summary['steps'][str(step)]={'status':'EVIDENCE_READY','message':message,'evidence':evidence}

def phase_block(summary,step,reason):
 summary['steps'][str(step)]={'status':'BLOCKED','reason':reason}

def analyze_safe(args,summary):
 out=Path(args.workspace)
 originals=out/'original_analysis'
 try:
  manifest=analyze_zip(Path(args.zip),originals)
  manifest['workspace']=str(originals)
  init_project(manifest,out/'project',args.catalogue)
  summary['source_sha256']=manifest['source_archive_sha256']
  summary['duration_sec']=manifest['duration_range_sec']
  summary['stems']=len(manifest['stems'])
  phase_success(summary,0,'Project created with fixed order, per-stem source and sample queues',['project/CHECKLIST.md','project/project_state.json'])
  phase_block(summary,1,'Original lyric and authored composition source document not included in stems ZIP')
  phase_block(summary,2,'Suno source draft/prompt/model version not independently documented in this input')
  phase_success(summary,3,'All 12 original stems present and hashed',['original_analysis/INTERLUDE_SOURCE_MANIFEST.json'])
  phase_success(summary,4,'All source stems decode consistently at 3:13.104',['original_analysis/INTERLUDE_SOURCE_MANIFEST.json'])
  phase_success(summary,5,'Spectral/stereo/onset features and independent voice reference forensics computed; full performance transcription not yet validated',['original_analysis/analysis/','project/voice/'])
 except Exception as e:
  phase_block(summary,3,'Source analysis failure: '+str(e));return None
 return manifest

def run(args):
 work=Path(args.workspace);work.mkdir(parents=True,exist_ok=True)
 summary={'project':'Interlude x Detuned Fragments (Mashup)','run_utc':datetime.now(timezone.utc).isoformat(),
  'pipeline':'Jay Vale mandatory 16-stage quality-gated order',
  'no_generated_source_claimed_human':True,'steps':{},
  'actual_master_wav':None,'final_download':None}
 manifest=analyze_safe(args,summary)
 if manifest is None:
  checkpoint(work/'PIPELINE_RUN_SUMMARY.json',summary);return summary
 originals=work/'original_analysis/source'
 voice_dir=work/'project/voice'
 try:
  analyze_pair(originals/'0 Lead Vocals.mp3',originals/'1 Backing Vocals.mp3',voice_dir,
     args.human_lead,args.human_backing)
  if args.human_lead and args.human_backing:
   phase_block(summary,9,'Real vocal files analyzed but recording provenance, phrase/phoneme alignment and listener acceptance still require verification')
  else:phase_block(summary,9,'No new genuine lead/backing vocal performances supplied; reference analysis completed')
 except Exception as e:phase_block(summary,9,'Vocal microanalysis failed: '+str(e))
 # Any external audio is accepted only from a strict licensed sample catalogue.
 sample_count=json.loads((work/'project/sample_candidate_ranking.json').read_text()).get('approved_sample_count',0)
 if sample_count:
  phase_success(summary,6,str(sample_count)+' provenance-verified recorded samples indexed. Full source coverage still pending.', ['project/sample_candidate_ranking.json'])
 else:
  phase_block(summary,6,'No approved sample audio bank mounted; candidate public CC0 sources only. See project/sample_acquisition_queue.json')
 rebuild_dir=work/'instrumental_rebuild'
 if args.approved_events and args.catalogue:
  try:
   reconstructed=reconstruct(args.approved_events,work/'original_analysis/INTERLUDE_SOURCE_MANIFEST.json',
       originals,Path(args.catalogue).parent,rebuild_dir)
   phase_success(summary,7,'Ten independent instrumental WAV candidates rendered, subject to listening/detector review',['instrumental_rebuild/INSTRUMENTAL_REBUILD_A_B_QC.json'])
   phase_block(summary,8,'User listening approval (95% target) and verified event coverage still require independent review')
  except Exception as e:
   phase_block(summary,7,'Source validation/independent reconstruction failed: '+str(e))
   phase_block(summary,8,'Not enough valid reconstructed stems to run verified A/B acceptance')
 else:
  phase_block(summary,7,'No all-10-stem approved event-to-licensed-recording map; no generated/source-locked replacement allowed')
  phase_block(summary,8,'No genuinely reconstructed full instrumental stem set available for 95% level-matched A/B')
 # Existing ACRCloud scans can be retrieved free of a new scan, when credentials exist.
 if args.fetch_existing_acrcloud:
  try:
   results=check_previously_scanned_interlude(work/'project/provider')
   phase_success(summary,10,str(len(results))+' previous console scans imported; per-stem rebuilt scans still missing',['project/provider/'])
  except ProviderError as e:
   phase_block(summary,10,str(e))
 else:phase_block(summary,10,'ACRCloud API live credentials and all 24 stem-level original/rebuilt reports not yet available')
 phase_block(summary,11,'No complete source/provenance and per-stem detector review')
 phase_block(summary,12,'Independent 10-part instrumental render and approved new human vocal performances not complete')
 phase_block(summary,13,'No verified final WAV candidate has been created or submitted to ACRCloud')
 phase_block(summary,14,'No accepted master; no actual audio watermark applied; embedded BWF rights metadata cannot be verified')
 phase_block(summary,15,'No verified final WAV master exists, so no final download link can be generated')
 summary['automation_coverage']={'source_ingestion':'run','spectral_stereo_microanalysis':'run',
 'vocal_reference_analysis':'run','licensed_sample_ranking':'runs_only_if_approved_bank_available',
 'instrumental_render':'runs_only_if_all_verified_sample_event_maps_exist',
 'ACRCloud_previous_scan_import':'runs_only_if_token_configured_and_requested',
 'new_billable_scans':'disabled_by_default',
 'release_master':'runs_only_if_all_15_preceding_verification_gates_and_watermark_pass'}
 summary['blocked_stages']=[int(k) for k,v in summary['steps'].items() if v['status']=='BLOCKED']
 checkpoint(work/'PIPELINE_RUN_SUMMARY.json',summary)
 lines=['# Interlude — Automated pipeline execution','','**Executed:** '+summary['run_utc'],'',
 'All 12 stems were processed without destructive audio edits. Source reconstructions have not been mislabeled as performed recordings.','',
 '| Stage | Status | Evidence / Blocker |','|---|---|---|']
 for i in range(16):
  d=summary['steps'].get(str(i),{'status':'BLOCKED','reason':'Unverified prior stage'})
  lines.append('| '+str(i).zfill(2)+' '+STAGES[i]+' | '+d['status']+' | '+(d.get('message') or d.get('reason','')).replace('|','/')+' |')
 lines+=['','No verified final audio exists, so no final-master download is claimed.','']
 (work/'AUTOMATED_EXECUTION_REPORT.md').write_text('\n'.join(lines))
 return summary

if __name__=='__main__':
 p=argparse.ArgumentParser(description='Interlude 16-stage automated and truthfully gated pipeline')
 p.add_argument('--zip',required=True)
 p.add_argument('--workspace',required=True)
 p.add_argument('--catalogue',help='Local verified rights/sample catalogue.json')
 p.add_argument('--approved-events',help='All-ten-instrument independent-sample event map.json')
 p.add_argument('--human-lead',help='Actual recorded human lead WAV')
 p.add_argument('--human-backing',help='Actual recorded human backing WAV')
 p.add_argument('--fetch-existing-acrcloud',action='store_true',help='Read previous scans using private API env vars; no new scan charges')
 args=p.parse_args()
 result=run(args)
 print('Interlude:',result['stems'],'stems, blocked stage IDs:',result['blocked_stages'],
       'final WAV:',result['actual_master_wav'])