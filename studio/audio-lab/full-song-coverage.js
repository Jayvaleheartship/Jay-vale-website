// Jay Vale Audio Lab: no-false-success reconstruction acceptance across ALL instrumental stems/layers.
// No audio modification or detector manipulation. Version 0.1; gate is not a 95% perceptual predictor.
(function (global) {
  'use strict';
  const version='0.1.0';
  const INSTRUMENTAL=new Set(['drums','bass','guitar','keys','percussion','strings','synths','brass','woodwinds','effects','unknown','world']);
  const VERIFIED_ORIGINS=new Set(['recorded_acoustic_instrument','recorded_hardware_instrument','recorded_live_foley','recorded_environment']);
  function nonempty(x){return typeof x==='string'&&x.trim().length>0;}
  function sourceValid(source) {
    return Boolean(source && /^[a-f0-9]{64}$/i.test(source.sha256||'') && nonempty(source.sourceUrl)
      && /^https:\/\//i.test(source.sourceUrl) && nonempty(source.licenseSpdx)
      && VERIFIED_ORIGINS.has(source.originType) && source.recordingOriginVerified===true
      && nonempty(source.originEvidence));
  }
  function auditStem(stem,target=0.95) {
    const findings=[];
    const family=stem?.family;
    if(family==='vocals')return {filename:stem.filename,category:'vocal',technicalComplete:false,listenerAccepted:false,status:'separate_vocal_workflow',findings:['Vocal measurement and recorded-performance acceptance are separate; spectral edits do not change performance provenance.']};
    if(!INSTRUMENTAL.has(family))findings.push('unclassified_stem_family');
    if(stem?.layerInventoryReviewed!==true)findings.push('unreviewed_layer_inventory');
    const layers=Array.isArray(stem?.layers)?stem.layers:[];
    if(!layers.length)findings.push('no_detected_or_confirmed_layers');
    if(stem?.residualAccountedFor!==true)findings.push('unaccounted_residual_or_effects');
    if(stem?.sourceAudioFraction>0||!Number.isFinite(stem?.sourceAudioFraction))findings.push('source_audio_fraction_unknown_or_retained');
    const details=[];
    for(const l of layers) {
      const issues=[];
      if(!nonempty(l.id)||!nonempty(l.instrument)||l.instrument==='unknown')issues.push('unidentified_layer');
      if(l.mode!=='independent_recorded_sample')issues.push('not_independent_sample');
      if(l.sourceDerived===true||l.sourceRetained===true)issues.push('source_audio_retained');
      if(!Array.isArray(l.samples)||!l.samples.length||!l.samples.every(sourceValid))issues.push('missing_verified_recording_provenance');
      if(l.eventsAudited!==true||l.transcriptionReviewed!==true)issues.push('musical_event_validation_missing');
      const q=l.quality;
      if(!q||q.frameAligned!==true||q.clipped!==false||q.timingPass!==true||q.pitchPass!==true||q.spectralPass!==true||q.stereoPass!==true||q.artifactPass!==true)issues.push('objective_audio_quality_unverified');
      if(!l.stemAndLayerRendered)issues.push('no_verified_render');
      details.push({layerId:l.id||'unidentified',passed:issues.length===0,issues});
    }
    const technicalComplete=!findings.length&&details.every(x=>x.passed);
    const review=stem?.listening;
    const listenerAccepted=Boolean(technicalComplete&&review?.explicitlyAccepted===true&&review?.referenceMatched===true&&
      review?.scoreSource==='listener_assessment'&&typeof review?.similarityRatio==='number'&&review.similarityRatio>=target&&review.similarityRatio<=1);
    return {filename:stem?.filename||'unknown',category:'instrumental',technicalComplete,listenerAccepted,
      status:listenerAccepted?'listener_accepted':technicalComplete?'ready_for_95_percent_listening_test':'incomplete_reconstruction',
      requestedListeningThreshold:target,findings,layerAudit:details};
  }
  function auditProject(project,{target=0.95}={}) {
    if(!Number.isFinite(target)||target<=0||target>1)throw Error('Invalid quality target');
    if(!Array.isArray(project?.stems)||!project.stems.length)throw Error('Project has no stems');
    const perStem=project.stems.map(s=>auditStem(s,target));
    const inst=perStem.filter(s=>s.category==='instrumental');
    const vocal=perStem.filter(s=>s.category==='vocal');
    const technicalComplete=Boolean(inst.length&&inst.every(s=>s.technicalComplete)&&project?.finalMix?.decodedFrameAligned===true&&project?.finalMix?.noClipping===true);
    const listenerAccepted=technicalComplete&&inst.every(s=>s.listenerAccepted)&&project?.finalMix?.listeningApproved===true;
    return {version,qualityTargetDescription:'95% is a user listening-similarity target, not a validated spectral score or ACRCloud prediction',
      target,technicalComplete,listenerAccepted,overallStatus:listenerAccepted?'accepted':technicalComplete?'listening_pending':'incomplete',
      instrumentalStems:inst.length,instrumentalStemsTechnicalComplete:inst.filter(s=>s.technicalComplete).length,
      instrumentalStemsListenerAccepted:inst.filter(s=>s.listenerAccepted).length,voiceStemsSeparate:vocal.length,
      stems:perStem};
  }
  global.JVFullSongCoverage={version,sourceValid,auditStem,auditProject};
})(typeof globalThis!=='undefined'?globalThis:this);