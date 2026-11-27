#!/usr/bin/env python3
"""Authorized ACRCloud File Scanning adapter for repeatable Interlude batch reports.

New paid scans are OFF by default. Requires a privately provided API token,
container ID and region. Returns exact provider results, never invented scores.
"""
import json,os,re,time,urllib.request,urllib.parse,urllib.error,uuid,hashlib,sys
from pathlib import Path
from datetime import datetime,timezone
from analyze_interlude import sh256

ALLOWED_REGIONS={'eu-west-1','us-west-2','ap-southeast-1'}

class ProviderError(RuntimeError):pass

def config():
 token=os.environ.get('ACRCLOUD_ACCESS_TOKEN','')
 cid=os.environ.get('ACRCLOUD_CONTAINER_ID','')
 region=os.environ.get('ACRCLOUD_REGION','')
 if len(token)<16 or not re.fullmatch(r'[1-9][0-9]{0,15}',cid) or region not in ALLOWED_REGIONS:
  raise ProviderError('ACRCloud private server configuration unavailable; no provider requests issued')
 return token,cid,region

def request_api(method,suffix,body=None,headers=None,timeout=35):
 token,cid,region=config()
 if any(x in suffix for x in ('://','..','\\','\n')):
  raise ProviderError('Invalid ACRCloud endpoint')
 url='https://api-'+region+'.acrcloud.com/api/fs-containers/'+cid+suffix
 safe={'Accept':'application/json','Authorization':'Bearer '+token}
 safe.update(headers or {})
 req=urllib.request.Request(url,method=method,data=body,headers=safe)
 try:
  with urllib.request.urlopen(req,timeout=timeout) as response:
   raw=response.read(12*1024*1024)
   return json.loads(raw) if raw else {}
 except urllib.error.HTTPError as e:
  # Avoid forwarding provider response text, which might include credentials.
  raise ProviderError('ACRCloud request failed with HTTP '+str(e.code)) from None
 except (ValueError,urllib.error.URLError,TimeoutError) as e:
  raise ProviderError('ACRCloud unavailable / unreadable result') from None

def list_existing(limit=30):
 q=urllib.parse.urlencode({'page':1,'per_page':min(limit,100),'with_result':0})
 obj=request_api('GET','/files?'+q)
 return obj.get('data',[])

def get_existing(file_id):
 if not re.fullmatch('[0-9a-fA-F-]{36}',file_id):
  raise ProviderError('Invalid file ID')
 obj=request_api('GET','/files/'+file_id)
 row=obj.get('data')
 if isinstance(row,list):row=next((x for x in row if x.get('id')==file_id),None)
 if not row or row.get('id')!=file_id:raise ProviderError('Provider file result unavailable')
 return row

def real_provider_verdict(row,source_file=None,kind='original'):
 scores=row.get('results',{}).get('ai_detection',[])
 if not isinstance(scores,list):scores=[]
 entries=[]
 for component in scores:
  probability=component.get('ai_probability')
  flag='UNKNOWN' if not isinstance(probability,(float,int)) else ('RED_REVIEW' if probability>15 else 'BELOW_REVIEW_THRESHOLD')
  entries.append({'stem':component.get('stem'),
   'prediction':component.get('prediction'),'likely_source':component.get('likely_source'),
   'ai_probability':probability,'model_id':component.get('model_id'),
   'red_flag_gt15':flag,'source_probabilities':component.get('source_probabilities',[]),
   'segments':component.get('segments',[])})
 return {'source_file':str(source_file) if source_file else None,
  'version':kind,'file_id':row.get('id'),'state':row.get('state'),
  'provider':'ACRCloud','result_retrieved_utc':datetime.now(timezone.utc).isoformat(),
  'results':entries,'raw_provider_response':row,
  'no_audio_or_score_modifications':True,
  'note':'Provider probability is not the percentage of human authorship'}

def upload_paid_file(file_path):
 if os.environ.get('ACRCLOUD_NEW_SCANS_ENABLED','').lower()!='true':
  raise ProviderError('New paid ACRCloud scans disabled by default')
 # Using direct upload for files < 50 MiB; provider accepts larger in its docs.
 path=Path(file_path)
 if not path.is_file() or path.stat().st_size>50*1024*1024:
  raise ProviderError('Upload file missing or larger than guarded 50 MiB')
 token,cid,region=config()
 boundary='----jay-vale-'+uuid.uuid4().hex
 filename=re.sub(r'[^a-zA-Z0-9._ -]','_',path.name)
 parts=[
  ('--'+boundary+'\r\nContent-Disposition: form-data; name="data_type"\r\n\r\naudio\r\n').encode(),
  ('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="'+filename+'"\r\nContent-Type: application/octet-stream\r\n\r\n').encode(),
  path.read_bytes(),('\r\n--'+boundary+'--\r\n').encode()
 ]
 raw=b''.join(parts)
 obj=request_api('POST','/files',body=raw,headers={'Content-Type':'multipart/form-data; boundary='+boundary},timeout=90)
 row=obj.get('data',{})
 if isinstance(row,list):row=row[0] if row else {}
 file_id=row.get('file_id') or row.get('id')
 if not isinstance(file_id,str) or not re.fullmatch('[0-9a-fA-F-]{36}',file_id):
  raise ProviderError('Provider did not return a valid file scan ID')
 return file_id

def scan_and_poll(file_path,timeout_sec=240):
 id=upload_paid_file(file_path)
 started=time.monotonic()
 while time.monotonic()-started<timeout_sec:
  row=get_existing(id)
  state=int(row.get('state',0))
  if state==1:return real_provider_verdict(row,file_path,'submitted_in_this_run')
  if state<0:raise ProviderError('Provider could not scan supplied audio')
  time.sleep(5)
 raise ProviderError('Provider still processing; retain this file ID for later read-only polling: '+id)

def check_previously_scanned_interlude(outdir):
 """Read previously generated result; do not create a new billable submission."""
 files=list_existing()
 matches=[x for x in files if 'Interlude' in str(x.get('name',''))]
 if not matches:raise ProviderError('No Interlude scan found in first page (no new scan submitted)')
 outdir=Path(outdir);outdir.mkdir(parents=True,exist_ok=True)
 results=[]
 for x in matches:
  id=x.get('id')
  if isinstance(id,str):
   report=real_provider_verdict(get_existing(id),x.get('name'),'previously_scanned')
   (outdir/('ACRCLOUD_EXISTING_'+id+'.json')).write_text(json.dumps(report,indent=2)+'\n')
   results.append(report)
 return results

if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('usage: ACRCLOUD_ACCESS_TOKEN=... ACRCLOUD_CONTAINER_ID=... ACRCLOUD_REGION=... python acrcloud_batch.py <report_folder>')
 try:print('Retrieved',len(check_previously_scanned_interlude(sys.argv[1])),'previously scanned records (no uploads)')
 except ProviderError as e:raise SystemExit('BLOCKED: '+str(e))