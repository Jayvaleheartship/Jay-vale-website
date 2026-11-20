// Jay Vale Audio Lab — reusable full-song project manifest and source-provenance guard.
// Browser-compatible; no network, secret access or audio uploads. Development v0.1.
(function(global){
 'use strict';
 const version='0.1.0';
 const categories={
  'lead vocals':'vocals','backing vocals':'vocals','drums':'drums',
  'bass':'bass','guitar':'guitar','keyboard':'keys','keys':'keys',
  'percussion':'percussion','strings':'strings','synth':'synths',
  'brass':'brass','woodwinds':'woodwinds','other':'unknown',
  'effects':'effects','fx':'effects'
 };
 const extRE=/\.(wav|flac|mp3|m4a|aiff|aif)$/i;
 const verified=Object.freeze(['imported','inspected','layers_reviewed','library_checked','gaps_reviewed','rebuilt','audited','user_listening_reviewed','exported','detector_reported']);
 function safePath(filename){
  if(typeof filename!=='string'||!filename.trim()||filename.includes('\0')||filename.startsWith('/')||filename.startsWith('\\')||/^[a-zA-Z]:[\\/]/.test(filename))throw Error('Unsafe ZIP entry');
  const parts=filename.replace(/\\/g,'/').split('/');
  if(parts.some(x=>x==='..'||x==='.'||!x))throw Error('ZIP path traversal or invalid path');
  if(parts.length>8)throw Error('Excessive ZIP depth');
  return parts.join('/');
 }
 function stemInfo(filename){
  const clean=safePath(filename),base=clean.split('/').pop();
  if(!extRE.test(base))throw Error('Unsupported stem file format');
  const raw=base.replace(extRE,'').trim();
  const match=raw.match(/^(\d{1,3})[\s._-]+(.+)$/);
  const order=match?Number(match[1]):null;
  const label=(match?match[2]:raw).replace(/[_-]+/g,' ').trim();
  const key=label.toLowerCase();
  return {filename:clean,label,order,family:categories[key]||'unknown',classification:'filename_only_unverified'};
 }
 function inspectEntries(entries){
  if(!Array.isArray(entries)||!entries.length||entries.length>64)throw Error('Invalid stem count (1–64 supported)');
  const seen=new Set(),result=[];
  let total=0;
  for(const e of entries){
   if(!e||e.isDirectory)continue;
   const s=stemInfo(e.name);
   const bytes=e.uncompressedBytes??e.bytes;
   if(!Number.isSafeInteger(bytes)||bytes<=0||bytes>750_000_000)throw Error('Stem ZIP entry exceeds limit');
   const compressed=e.compressedBytes;
   if(compressed!==undefined&&(!Number.isSafeInteger(compressed)||compressed<0||compressed>bytes*1.5))throw Error('Invalid compressed length');
   if(compressed!==undefined&&bytes>10_000_000&&compressed>0&&bytes/compressed>250)throw Error('ZIP expansion ratio too high');
   total+=bytes;
   if(total>2_000_000_000)throw Error('ZIP uncompressed limit exceeded');
   const id=s.filename.toLowerCase();
   if(seen.has(id))throw Error('Duplicate stem path');
   seen.add(id);result.push({...s,source_bytes:bytes,source_sha256:e.sha256||null,processing_state:'source_preserved'});
  }
  if(!result.length)throw Error('No playable stem audio');
  result.sort((a,b)=>a.order===null&&b.order===null?a.filename.localeCompare(b.filename):a.order===null?1:b.order===null?-1:a.order-b.order||a.filename.localeCompare(b.filename));
  return result;
 }
 function decodedAlignment(stems,decoded){
  if(!Array.isArray(stems)||!stems.length)throw Error('No stems');
  const entries=stems.map(s=>{
   const d=decoded?.[s.filename];
   if(!d||!Number.isSafeInteger(d.frames)||d.frames<=0||!Number.isInteger(d.sampleRate)||d.sampleRate<=0||!Number.isInteger(d.channels)||d.channels<1||d.channels>8)throw Error('Missing reliable decoded PCM information: '+s.filename);
   return {...d,name:s.filename};
  });
  const rate=entries[0].sampleRate,frames=entries[0].frames;
  const deviations=entries.filter(d=>d.frames!==frames||d.sampleRate!==rate);
  return {aligned:!deviations.length,frames,sampleRate:rate,durationSeconds:frames/rate,unmatched:deviations.map(d=>({name:d.name,frames:d.frames,sampleRate:d.sampleRate})),reliableSource:'decoded_pcm_not_mp3_header'};
 }
 function stereoMetrics(leftRms,rightRms,correlation){
  if(!Number.isFinite(leftRms)||!Number.isFinite(rightRms)||leftRms<0||rightRms<0||!Number.isFinite(correlation)||correlation< -1||correlation>1)throw Error('Invalid stereo measurements');
  const mid2=(leftRms*leftRms+rightRms*rightRms+2*correlation*leftRms*rightRms)/4;
  const side2=(leftRms*leftRms+rightRms*rightRms-2*correlation*leftRms*rightRms)/4;
  const width=10*Math.log10(Math.max(side2,1e-20)/Math.max(mid2,1e-20));
  const monoLoss=10*Math.log10(Math.max(mid2,1e-20)/Math.max((leftRms*leftRms+rightRms*rightRms)/2,1e-20));
  return {sideToMidDb:width,monoFoldDownDb:monoLoss,correlation,wideStereo:monoLoss<-2,antiCorrelated:correlation<0};
 }
 function createProject({projectId,inputSha256,entries,decoded={},libraryCounts={}}){
  if(!/^[a-z0-9][a-z0-9._-]{2,100}$/i.test(projectId||''))throw Error('Invalid project ID');
  if(!/^[0-9a-f]{64}$/i.test(inputSha256||''))throw Error('Missing verified ZIP SHA-256');
  const stems=inspectEntries(entries);
  const alignment=decodedAlignment(stems,decoded);
  return {schemaVersion:1,projectId,inputSha256,stage:'inspected',stages:verified.map(s=>({name:s,state:s==='imported'||s==='inspected'?'completed':'pending'})),paths:{source:`projects/${projectId}/source/`,analysis:`projects/${projectId}/analysis/`,layers:`projects/${projectId}/layers/`,reconstructed:`projects/${projectId}/reconstructed/`,reports:`projects/${projectId}/reports/`,exports:`projects/${projectId}/exports/`},alignment,stems:stems.map(s=>({...s,layerCount:null,sourceRetained:true,independentlyRecreated:false})),library:{lastVerifiedCounts:libraryCounts,actuallyQueried:false},quality:{sourcePreserved:true,actualRecreatedStemCount:0,hybridStemCount:0,qualityAudited:false,listenerAccepted:false,externalDetectorResult:null}};
 }
 function markLayer(manifest,stemName,details){
  const stem=manifest.stems.find(s=>s.filename===stemName);
  if(!stem)throw Error('Unknown stem');
  const mode=details?.mode;
  if(!['source','hybrid','independent_sample_rebuild'].includes(mode))throw Error('Invalid replacement mode');
  if(mode==='independent_sample_rebuild'){
   const sources=details.sources;
   if(!Array.isArray(sources)||!sources.length||sources.some(s=>!/^[a-f0-9]{64}$/i.test(s.sha256||'')||!s.license_spdx||!s.originUrl))throw Error('Independent rebuild requires recorded sample checksums, license and source URLs');
  }
  stem.processing_state=mode;stem.sourceRetained=mode!=='independent_sample_rebuild';stem.independentlyRecreated=mode==='independent_sample_rebuild';stem.sampleProvenance=mode==='source'?[]:(details.sources||[]);
  manifest.quality.actualRecreatedStemCount=manifest.stems.filter(s=>s.independentlyRecreated).length;
  manifest.quality.hybridStemCount=manifest.stems.filter(s=>s.processing_state==='hybrid').length;
  return manifest;
 }
 function canClaimFullReconstruction(manifest){
  return Boolean(manifest.alignment?.aligned&&manifest.stems?.length>0&&manifest.stems.every(s=>s.independentlyRecreated)&&manifest.quality?.qualityAudited&&manifest.quality?.listenerAccepted);
 }
 global.JVFullSongProject={version,stemInfo,inspectEntries,decodedAlignment,stereoMetrics,createProject,markLayer,canClaimFullReconstruction};
})(typeof globalThis!=='undefined'?globalThis:this);
