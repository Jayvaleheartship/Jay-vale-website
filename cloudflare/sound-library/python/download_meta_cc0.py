#!/usr/bin/env python3
"""Verified-source downloader for Meta Open Sound's CC0 instrument recordings.

The library registry contains independently published SHA256SUMS for 1,075
piano, nylon-guitar, and steel-guitar OGG samples. Download only official
listed recordings; hash and license each asset. Never call a download a matched
replacement before separate event-level acoustic/listening confirmation.
"""
import argparse,hashlib,json,os,re,sys,urllib.request,urllib.error
from pathlib import Path

ALLOWED={'meta-piano':'keys','meta-nylon-guitar':'guitar','meta-steel-guitar':'guitar'}
MAX_SAMPLE_BYTES=10*1024*1024

class SourceError(Exception):pass

def validate_registry(r):
 if r.get('origin')!='Meta Open Sound' or r.get('license')!='CC0-1.0':
  raise SourceError('Source manifest is not the reviewed CC0 collection')
 for collection in r.get('collections',[]):
  if collection.get('id') not in ALLOWED or collection.get('license')!='CC0-1.0':
   raise SourceError('Unknown or unsupported CC0 collection')
  expected='https://raw.githubusercontent.com/facebookincubator/Meta-open-sound/main/systems/instruments/'+collection['id']+'/'
  if collection.get('base_url')!=expected:raise SourceError('Unexpected download URL base')
  for file,digest in collection.get('sha256',{}).items():
   if not re.fullmatch(r'ogg/[A-Za-z0-9_.-]+\.ogg',file) or not re.fullmatch('[0-9a-f]{64}',str(digest)):
    raise SourceError('Unsafe sample path or hash')

def download_recording(url,path,expected_hash):
 # External network calls can fail in restricted sandboxes; never fake success.
 req=urllib.request.Request(url,headers={'User-Agent':'JayValeAudioLab/1.0 (CC0 sample acquisition)'})
 partial=Path(str(path)+'.part')
 digest=hashlib.sha256();total=0
 try:
  with urllib.request.urlopen(req,timeout=30) as response:
   if response.geturl()!=url:raise SourceError('Unexpected redirect; refused')
   with partial.open('wb') as out:
    while True:
     chunk=response.read(1024*1024)
     if not chunk:break
     total+=len(chunk)
     if total>MAX_SAMPLE_BYTES:raise SourceError('Sample exceeds guarded per-file budget')
     digest.update(chunk);out.write(chunk)
  if digest.hexdigest()!=expected_hash:raise SourceError('Official SHA256SUMS checksum mismatch')
  partial.replace(path)
  return total
 finally:
  if partial.exists():partial.unlink()

def download(registry,dest,collections=None,limit=50):
 reg=json.loads(Path(registry).read_text());validate_registry(reg)
 dest=Path(dest).resolve();dest.mkdir(parents=True,exist_ok=True)
 wanted=set(collections or ALLOWED)
 results={'accepted':[],'failed':[],'skipped':[],'pending':[]}
 existing=(dest/'catalogue.json')
 if existing.exists():
  try:cached=json.loads(existing.read_text())
  except ValueError:cached=[]
 else:cached=[]
 used={(x.get('name'),x.get('sha256')) for x in cached}
 for collection in reg['collections']:
  id=collection['id'];
  if id not in wanted:continue
  for name,sha in collection['sha256'].items():
   entry={'name':id+'_'+Path(name).name,'license':'CC0-1.0',
    'source_url':collection['base_url']+name,'family':ALLOWED[id],
    'sha256':sha,'file':str(Path(id)/Path(name).name)}
   filepath=dest/entry['file']
   if filepath.exists():
    h=hashlib.sha256(filepath.read_bytes()).hexdigest()
    if h==sha:
     used.add((entry['name'],sha));results['skipped'].append(entry['name']);continue
    filepath.unlink() # invalid earlier file is never accepted
   if len(results['accepted'])>=limit:
    results['pending'].append(entry);continue
   filepath.parent.mkdir(parents=True,exist_ok=True)
   try:
    size=download_recording(entry['source_url'],filepath,sha)
    results['accepted'].append({'name':entry['name'],'bytes':size})
    cached.append(entry);used.add((entry['name'],sha))
   except (SourceError,urllib.error.URLError,TimeoutError,OSError) as e:
    results['failed'].append({'name':entry['name'],'reason':str(e)[:160]})
 # Reconcile cached assets: never keep a catalogue entry for missing bytes.
 valid=[]
 for row in cached:
  try:
   path=(dest/row['file']).resolve()
   if not path.is_relative_to(dest) or not path.is_file():continue
   if hashlib.sha256(path.read_bytes()).hexdigest()!=row['sha256']:continue
   if (row['name'],row['sha256']) not in {(x['name'],x['sha256']) for x in valid}:valid.append(row)
  except (KeyError,OSError):continue
 (dest/'catalogue.json').write_text(json.dumps(valid,indent=2)+'\n')
 (dest/'acquisition_report.json').write_text(json.dumps(results,indent=2)+'\n')
 return results

if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--registry',required=True)
 parser.add_argument('--dest',required=True)
 parser.add_argument('--collections',nargs='*',choices=list(ALLOWED),default=None)
 parser.add_argument('--limit',type=int,default=50)
 args=parser.parse_args()
 if args.limit<0 or args.limit>1075:parser.error('limit must be 0..1075')
 try:
  outcome=download(args.registry,args.dest,args.collections,args.limit)
  print('VERIFIED CC0 DOWNLOADS:',len(outcome['accepted']),'existing:',len(outcome['skipped']),'failed:',len(outcome['failed']),'pending:',len(outcome['pending']))
 except SourceError as e:raise SystemExit('BLOCKED: '+str(e))