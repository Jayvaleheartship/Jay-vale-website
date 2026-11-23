// Offline, deterministic gap planner. No network, credentials or source audio.
(function(root){
'use strict';
function text(x){return typeof x==='string'&&x.trim()?x.trim():null;}
function validHash(x){return typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);}
function plan(layers,catalogue=[]){
 if(!Array.isArray(layers)||!Array.isArray(catalogue))throw Error('Expected arrays');
 const gaps=[],matched=[],unresolved=[],seenIds=new Set();
 for(const layer of layers){
  const id=text(layer?.id);
  if(!id)throw Error('Layer id required');
  if(seenIds.has(id))throw Error('Duplicate layer id: '+id);
  seenIds.add(id);
  const family=text(layer.family),instrument=text(layer.instrument),articulation=text(layer.articulation);
  const pitch=layer.pitch,velocity=layer.velocity;
  if(!family||!instrument||instrument.toLowerCase()==='unknown'||!Number.isInteger(pitch)||pitch<0||pitch>127||
     !Number.isInteger(velocity)||velocity<1||velocity>127||!articulation){
   unresolved.push({layerId:id,reason:'classification_or_event_metadata_missing'});continue;
  }
  const candidates=catalogue.filter(s=>s&&s.family===family&&s.instrument===instrument&&s.articulation===articulation&&
    s.pitch===pitch&&Number.isInteger(s.velocityMin)&&Number.isInteger(s.velocityMax)&&
    velocity>=s.velocityMin&&velocity<=s.velocityMax&&validHash(s.sha256)&&
    s.recordingOriginVerified===true&&text(s.originEvidence)&&text(s.sourceUrl)&&
    /^https:\/\//.test(s.sourceUrl)&&s.licenseSpdx==='CC0-1.0'&&text(s.licenseEvidenceUrl)&&
    /^https:\/\//.test(s.licenseEvidenceUrl)&&text(s.originalFilename));
  if(candidates.length)matched.push({layerId:id,candidateHashes:[...new Set(candidates.map(s=>s.sha256.toLowerCase()))].sort()});
  else gaps.push({layerId:id,family,instrument,articulation,pitch,velocity,reason:'no_file_level_verified_cc0_match'});
 }
 const acquisitionGroups=new Map();
 for(const gap of gaps){
  const key=JSON.stringify([gap.family,gap.instrument,gap.articulation,gap.pitch,gap.velocity]);
  if(!acquisitionGroups.has(key))acquisitionGroups.set(key,{family:gap.family,instrument:gap.instrument,articulation:gap.articulation,pitch:gap.pitch,velocity:gap.velocity,layerIds:[]});
  acquisitionGroups.get(key).layerIds.push(gap.layerId);
 }
 const acquisitionQueue=[...acquisitionGroups.values()].map(group=>({...group,layerIds:group.layerIds.sort()}))
  .sort((a,b)=>JSON.stringify([a.family,a.instrument,a.articulation,a.pitch,a.velocity]).localeCompare(JSON.stringify([b.family,b.instrument,b.articulation,b.pitch,b.velocity])));
 return {schemaVersion:1,matched,gaps,unresolved,acquisitionQueue,verifiedMatchCount:matched.length,unresolvedCount:unresolved.length,
  note:'Catalogue metadata preflight only; no acoustic matching or rendered audio verified.'};
}
root.JVSampleGapPlanner={plan};
})(typeof globalThis!=='undefined'?globalThis:this);
