/**
 * Private storage integrity scan. Scheduled by the Worker, not user-triggerable.
 * Confirms D1 indexed hashes have matching R2 objects and sizes.
 * R2 list() is paginated; a capped scan cannot be marked complete.
 */
const MAX_PAGES=30;
export async function auditStorage(env){
  if(!env.DB||!env.SAMPLES)return;
  const indexed=await env.DB.prepare('SELECT r2_key,bytes FROM samples').all();
  const records=indexed.results||[];
  const expected=new Map(records.map(x=>[x.r2_key,Number(x.bytes)]));
  const observed=new Map();
  let cursor,complete=false,pages=0;
  do{
    const page=await env.SAMPLES.list({prefix:'samples/',limit:1000,...(cursor?{cursor}:{})});
    for(const o of page.objects||[])observed.set(o.key,Number(o.size));
    pages++;
    if(page.truncated){
      if(!page.cursor)throw Error('R2 list truncated without cursor');
      cursor=page.cursor;
    }else{complete=true;cursor=null;}
  }while(!complete&&pages<MAX_PAGES);
  let matched=0,missing=0,mismatched=0,unindexed=0;
  for(const [key,bytes] of expected){
    if(!observed.has(key)){if(complete)missing++;}
    else if(observed.get(key)!==bytes)mismatched++;
    else matched++;
  }
  if(complete)for(const key of observed.keys())if(!expected.has(key))unindexed++;
  await env.DB.prepare('UPDATE storage_integrity SET checked_at=?,d1_rows=?,r2_objects=?,matched=?,missing_objects=?,size_mismatches=?,unindexed_objects=?,complete=?,error=NULL WHERE id=1')
   .bind(new Date().toISOString(),records.length,observed.size,matched,missing,mismatched,unindexed,complete?1:0).run();
}
export async function auditedHealth(env){
  let total=0,sourceFiles=0,duplicateEntries=0,importer=null,storage=null,sourceImportRows=null,familyCounts={};
  try{total=Number((await env.DB.prepare('SELECT COUNT(*) AS n FROM samples').first())?.n||0)}catch{}
  try{const groups=await env.DB.prepare('SELECT family,COUNT(*) AS count,COALESCE(SUM(bytes),0) AS bytes FROM samples GROUP BY family').all(); for(const r of groups.results||[])familyCounts[r.family]={samples:Number(r.count),bytes:Number(r.bytes)};}catch{}
  try{
    sourceImportRows=await env.DB.prepare('SELECT status,COUNT(*) AS n FROM cc0_seed_imports GROUP BY status').all();
    for(const r of sourceImportRows.results||[]){
      sourceFiles+=Number(r.n)||0;
      if(r.status==='duplicate')duplicateEntries+=Number(r.n)||0;
    }
  }catch{}
  try{importer=await env.DB.prepare('SELECT last_attempt_at,last_finished_at,attempted,imported,failed,last_error_code,last_error_detail,last_success_at FROM import_health WHERE id=1').first()}catch{}
  try{
    const x=await env.DB.prepare('SELECT checked_at,d1_rows,r2_objects,matched,missing_objects,size_mismatches,unindexed_objects,complete,error FROM storage_integrity WHERE id=1').first();
    if(x)storage={...x,complete:Boolean(x.complete),verified:x.complete===1&&x.d1_rows===total&&x.matched===total&&x.missing_objects===0&&x.size_mismatches===0};
  }catch{}
  return {service:'Jay Vale Sound Library',version:'0.5.0',online:true,
    sample_count:total,cc0_manifest_items:306,family_counts:familyCounts,
    source_entries_processed:sourceFiles,
    duplicate_source_entries:duplicateEntries,
    importer:importer||{status:'migration_pending_or_cron_not_started'},
    r2_integrity:storage||{status:'awaiting_first_audit'}};
}
