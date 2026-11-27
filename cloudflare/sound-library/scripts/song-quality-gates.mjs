/**
 * Review gates for Jay Vale's per-song pipeline.
 * Provider probabilities are NEVER treated as percentages of authorship.
 * The user-selected 15% flag is a policy alert, not a detector calibration.
 */
export const DEFAULT_REVIEW_THRESHOLD = 15;
export function detectionFlag(probability, threshold=DEFAULT_REVIEW_THRESHOLD) {
  if(probability === null || probability === undefined || probability === '')
    return 'UNKNOWN';
  if(typeof probability !== 'number' || !Number.isFinite(probability) ||
      probability<0 || probability>100)
    return 'UNKNOWN';
  if(typeof threshold!=='number'||!Number.isFinite(threshold) ||
    threshold<0||threshold>100)throw Error('Invalid review threshold');
  return probability>threshold?'RED_FLAG':'BELOW_REVIEW_THRESHOLD';
}
export function verifyStageOrder(stages) {
  const issues=[];
  if(!Array.isArray(stages)||stages.length!==16)
    return ['Expected precisely 16 stage entries (00 to 15).'];
  let earlierPending=false;
  for(let i=0;i<16;i++){
    const stage=stages[i];
    const id=String(i).padStart(2,'0');
    if(stage?.id!==id){issues.push('Wrong/missing stage '+id);continue;}
    if(!['pending','blocked','verified'].includes(stage.status)){
      issues.push('Invalid state for stage '+id);continue;
    }
    if(stage.status==='verified'&&earlierPending)
      issues.push('Stage '+id+' verified while a prior stage remains pending/blocked.');
    if(stage.status==='verified'){
      if(!Array.isArray(stage.evidence)||stage.evidence.length===0||
         typeof stage.verified_at!=='string'||!stage.verified_at.trim())
        issues.push('Stage '+id+' has no dated verification and evidence.');
    }else{
      earlierPending=true;
    }
  }
  return issues;
}
/**
 * Return blockers for release. This is deliberately conservative and
 * requires genuine provenance evidence, real final audio and full results.
 * A low detector score cannot override missing original files or vocals.
 */
export function releaseBlockers(project,{stemResults=[],finalResults=[]}={}) {
  const blockers=[];
  if(!project||typeof project!=='object')return ['No valid project manifest.'];
  const stages=project.stages;
  blockers.push(...verifyStageOrder(stages));
  if(!Array.isArray(stages)||stages.length!==16)return blockers;
  for(const stage of stages.slice(0,15)){
    if(stage.status!=='verified')
      blockers.push('Stage '+stage.id+' not verified.');
  }
  if(!Array.isArray(project.stem_files)||project.stem_files.length===0)
    blockers.push('No actual stem manifest.');
  if(project.source_disclosure?.real_vocals!=='verified_human_recordings')
    blockers.push('Human lead/backing vocal provenance not verified.');
  if(project.source_disclosure?.instrumental_recordings!=='verified_recordings')
    blockers.push('Instrumental sample/recording provenance not verified.');
  const want=project.stem_files?.map(x=>x.id).filter(Boolean)||[];
  for(const id of want){
    for(const version of ['original','rebuilt']){
      const results=stemResults.filter(x=>x.stem_id===id&&x.version===version);
      if(results.length===0){
        blockers.push('Missing '+version+' AI result for '+id);
        continue;
      }
      for(const x of results){
        const flag=detectionFlag(x.ai_probability);
        if(flag==='RED_FLAG')blockers.push('Red detector review flag: '+id+' ('+version+')');
        if(flag==='UNKNOWN')blockers.push('Unverified detector result: '+id+' ('+version+')');
      }
    }
  }
  if(!Array.isArray(finalResults)||finalResults.length===0)
    blockers.push('Missing final WAV AI detection.');
  else for(const x of finalResults){
    const flag=detectionFlag(x.ai_probability);
    if(flag==='RED_FLAG')blockers.push('Final WAV flagged above review threshold.');
    if(flag==='UNKNOWN')blockers.push('Unknown final WAV AI probability.');
  }
  if(!project.output?.final_wav||!project.output?.sha256)
    blockers.push('No independently verified final WAV and hash.');
  if(project.output?.embedded_metadata_verified!==true)
    blockers.push('Final WAV metadata has not been re-read and verified.');
  if(project.output?.live_full_song_scan_verified!==true)
    blockers.push('Final WAV scan has not been verified.');
  // The real external download URL is only allowed after successful delivery.
  return [...new Set(blockers)];
}
