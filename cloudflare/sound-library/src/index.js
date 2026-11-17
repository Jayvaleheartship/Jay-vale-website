/**
 * Jay Vale Sound Library — private R2 + D1 API
 * A 9.5 GB software budget is NOT a Cloudflare billing cap.
 * All sample access requires a separate secret. Never embed tokens in public HTML.
 */
const BUDGETS = {drums:3000000000,bass:1500000000,guitar:1200000000,keys:1200000000,strings:1000000000,winds:800000000,percussion:800000000};
const LICENSES = new Set(['CC0-1.0','CC-BY-4.0','CC-BY-SA-3.0']);
const AUDIO_MIME = {wav:'audio/wav',flac:'audio/flac',mp3:'audio/mpeg',ogg:'audio/ogg'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});}
function error(msg,status=400){return json({error:msg},status);}
function number(n,otherwise=0){n=Number(n);return Number.isFinite(n)?n:otherwise;}
function authorized(request,token){return typeof token==='string'&&token.length>=32&&request.headers.get('authorization')==='Bearer '+token;}
function readable(request,env){return authorized(request,env.READ_TOKEN)||authorized(request,env.ADMIN_TOKEN);}
function configured(env){return !!(env.SAMPLES&&env.DB&&typeof env.READ_TOKEN==='string'&&env.READ_TOKEN.length>=32&&typeof env.ADMIN_TOKEN==='string'&&env.ADMIN_TOKEN.length>=32&&env.READ_TOKEN!==env.ADMIN_TOKEN);}
function corsHeaders(req,env){
 const origin=req.headers.get('origin');
 if(origin&&origin===env.ALLOWED_ORIGIN)return {'access-control-allow-origin':origin,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'authorization,content-type','vary':'Origin'};
 return {};
}
function wrap(response,request,env){
 const headers=new Headers(response.headers);
 for(const [k,v] of Object.entries(corsHeaders(request,env)))headers.set(k,v);
 return new Response(response.body,{status:response.status,headers});
}
async function totals(env){
 const rows=await env.DB.prepare('SELECT family,COUNT(*) AS count,COALESCE(SUM(bytes),0) AS bytes FROM samples GROUP BY family').all();
 const byFamily={};let used=0,objects=0;
 for(const family of Object.keys(BUDGETS))byFamily[family]={count:0,bytes:0,budget_bytes:BUDGETS[family]};
 for(const r of rows.results||[]){if(byFamily[r.family]){byFamily[r.family].count=r.count;byFamily[r.family].bytes=r.bytes;}used+=r.bytes;objects+=r.count;}
 return {used_bytes:used,object_count:objects,soft_limit_bytes:number(env.MAX_LIBRARY_BYTES,9500000000),by_family:byFamily,note:'Database-tracked sizes; this soft limit does not prevent direct R2 uploads or Cloudflare billing.'};
}
function metaError(m){
 if(!m||typeof m!=='object'||Array.isArray(m))return 'Metadata object required';
 if(!Object.hasOwn(BUDGETS,m.family))return 'Unknown instrument family';
 if(typeof m.instrument!=='string'||!/^[a-z][a-z0-9_-]{1,40}$/.test(m.instrument))return 'Invalid instrument';
 if(!LICENSES.has(m.license_spdx))return 'License must be verified and approved';
 for(const field of ['source_name','source_url','license_url','attribution'])if(typeof m[field]!=='string'||!m[field].trim()||m[field].length>1500)return 'Missing or invalid '+field;
 if(!Number.isInteger(m.duration_ms)||m.duration_ms<0||m.duration_ms>300000)return 'Invalid duration_ms';
 if(!Number.isInteger(m.sample_rate)||m.sample_rate<8000||m.sample_rate>384000)return 'Invalid sample_rate';
 if(m.root_midi!=null&&(!Number.isInteger(m.root_midi)||m.root_midi<0||m.root_midi>127))return 'Invalid root_midi';
 if(m.velocity_layer!=null&&(!Number.isInteger(m.velocity_layer)||m.velocity_layer<1||m.velocity_layer>127))return 'Invalid velocity_layer';
 if(m.articulation!=null&&(typeof m.articulation!=='string'||m.articulation.length>100))return 'Invalid articulation';
 if(m.tags!=null&&(!Array.isArray(m.tags)||m.tags.length>25||!m.tags.every(x=>typeof x==='string'&&x.length<=64)))return 'Invalid tags';
 if(!m.features||!Array.isArray(m.features.band_energies)||m.features.band_energies.length!==12||!m.features.band_energies.every(x=>Number.isFinite(x)&&x>=0))return '12-band audio features required';
 return null;
}
function featureDistance(a,b){
 if(!a||!b||!Array.isArray(a.band_energies)||!Array.isArray(b.band_energies)||a.band_energies.length!==12||b.band_energies.length!==12)return Infinity;
 const norm=x=>Math.sqrt(x.reduce((s,v)=>s+v*v,0));
 const an=norm(a.band_energies),bn=norm(b.band_energies);if(!an||!bn)return Infinity;
 let cos=0;for(let i=0;i<12;i++)cos+=a.band_energies[i]*b.band_energies[i]/an/bn;
 const centroid=Math.min(1,Math.abs(number(a.centroid_hz)-number(b.centroid_hz))/5000);
 const attack=Math.min(1,Math.abs(number(a.attack_ms)-number(b.attack_ms))/100);
 const decay=Math.min(1,Math.abs(number(a.decay_ms)-number(b.decay_ms))/1500);
 return Math.max(0,1-cos)*0.72+centroid*.14+attack*.07+decay*.07;
}
async function upload(req,env){
 if(!authorized(req,env.ADMIN_TOKEN))return error('Unauthorized',401);
 const max=number(env.MAX_SAMPLE_BYTES,15000000);
 if(number(req.headers.get('content-length'))>max+250000)return error('Upload too large',413);
 let form;try{form=await req.formData();}catch{return error('Multipart form data required');}
 const file=form.get('audio'),metadata=form.get('metadata');
 if(!file||typeof file==='string'||typeof metadata!=='string')return error('Provide audio file and metadata JSON');
 if(file.size>max||file.size<=0)return error('Audio file size outside permitted limits',413);
 const extension=(file.name||'').split('.').pop().toLowerCase();
 if(!Object.hasOwn(AUDIO_MIME,extension))return error('Allowed types: wav flac mp3 ogg');
 let meta;try{meta=JSON.parse(metadata);}catch{return error('Malformed metadata JSON');}
 const mError=metaError(meta);if(mError)return error(mError);
 const bytes=await file.arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
 const existing=await env.DB.prepare('SELECT id FROM samples WHERE sha256=?').bind(hash).first();
 if(existing)return json({already_indexed:true,id:existing.id});
 const used=await totals(env);
 if(used.used_bytes+bytes.byteLength>used.soft_limit_bytes)return error('Library soft limit reached',409);
 if(used.by_family[meta.family].bytes+bytes.byteLength>BUDGETS[meta.family])return error('Instrument-family budget reached',409);
 const id=crypto.randomUUID(),key='samples/'+meta.family+'/'+meta.instrument+'/'+hash+'.'+extension;
 await env.SAMPLES.put(key,bytes,{httpMetadata:{contentType:AUDIO_MIME[extension]},customMetadata:{sha256:hash,license:meta.license_spdx}});
 try{
   await env.DB.prepare('INSERT INTO samples(id,sha256,r2_key,original_filename,family,instrument,bytes,duration_ms,sample_rate,root_midi,articulation,velocity_layer,tags_json,features_json,source_name,source_url,license_spdx,license_url,attribution) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(
    id,hash,key,file.name.slice(0,300),meta.family,meta.instrument,bytes.byteLength,meta.duration_ms,meta.sample_rate,meta.root_midi??null,meta.articulation||'normal',meta.velocity_layer??null,JSON.stringify(meta.tags||[]),JSON.stringify(meta.features),meta.source_name,meta.source_url,meta.license_spdx,meta.license_url,meta.attribution
   ).run();
 }catch(e){await env.SAMPLES.delete(key);throw e;}
 return json({created:true,id,bytes:bytes.byteLength,used_bytes:used.used_bytes+bytes.byteLength},201);
}
async function matches(req,env){
 if(!readable(req,env))return error('Unauthorized',401);
 const u=new URL(req.url),family=u.searchParams.get('family'),instrument=u.searchParams.get('instrument');
 if(!Object.hasOwn(BUDGETS,family)||!instrument||!/^[a-z][a-z0-9_-]{1,40}$/.test(instrument))return error('Valid family and instrument required');
 let f;try{f=JSON.parse(u.searchParams.get('features')||'null');}catch{return error('Malformed features');}
 if(!f||!Array.isArray(f.band_energies)||f.band_energies.length!==12||!f.band_energies.every(x=>Number.isFinite(x)&&x>=0))return error('Valid 12-band features required');
 const duration=Math.max(0,Math.min(300000,number(u.searchParams.get('duration_ms'),500)));
 const window=Math.max(120,Math.round(duration*.8));
 const pitch=u.searchParams.get('root_midi'),midi=pitch==null?null:Number(pitch);
 if(midi!==null&&(!Number.isInteger(midi)||midi<0||midi>127))return error('Invalid root_midi');
 const sql='SELECT id,original_filename,bytes,duration_ms,root_midi,articulation,velocity_layer,tags_json,features_json,source_name,source_url,license_spdx,license_url,attribution FROM samples WHERE family=? AND instrument=? AND duration_ms BETWEEN ? AND ?'+(midi===null?'':' AND root_midi BETWEEN ? AND ?')+' LIMIT 500';
 const args=[family,instrument,Math.max(0,duration-window),duration+window];
 if(midi!==null)args.push(Math.max(0,midi-2),Math.min(127,midi+2));
 const r=await env.DB.prepare(sql).bind(...args).all();
 const found=(r.results||[]).map(x=>{
  let features;try{features=JSON.parse(x.features_json);}catch{features=null;}
  const distance=featureDistance(f,features)+(midi===null||x.root_midi===null?0:Math.abs(midi-x.root_midi)*.1);
  const {features_json,tags_json,...rest}=x;
  return {...rest,tags:JSON.parse(tags_json||'[]'),distance,confidence:Math.max(0,1-distance)};
 }).filter(x=>Number.isFinite(x.distance)).sort((a,b)=>a.distance-b.distance).slice(0,5);
 return json({family,instrument,candidates:found,warning:'No exact-match guarantee; reject low-confidence candidates.'});
}
async function sample(req,env,id){
 if(!readable(req,env))return error('Unauthorized',401);
 const row=await env.DB.prepare('SELECT r2_key,original_filename,license_spdx,attribution FROM samples WHERE id=?').bind(id).first();
 if(!row)return error('Sample not found',404);
 const object=await env.SAMPLES.get(row.r2_key);if(!object)return error('Sample bytes not found',404);
 const headers=new Headers({'cache-control':'private, no-store','x-sample-license':row.license_spdx,'x-sample-attribution':encodeURIComponent(row.attribution.slice(0,200))});
 object.writeHttpMetadata(headers);
 headers.set('content-disposition','attachment; filename="'+row.original_filename.replace(/["\\\r\n]/g,'_')+'"');
 return new Response(object.body,{headers});
}
export default {
 async fetch(req,env){
  const origin=req.headers.get('origin');
  if(origin&&origin!==env.ALLOWED_ORIGIN)return wrap(error('Origin not allowed',403),req,env);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(req,env)});
  const url=new URL(req.url),path=url.pathname;
  try{
   if(path==='/health'&&req.method==='GET')return wrap(json({service:'Jay Vale Sound Library',version:'0.2.0',online:true,configured:configured(env)}),req,env);
   if(!configured(env))return wrap(error('Library secrets not configured',503),req,env);
   if(path==='/v1/status'&&req.method==='GET')return wrap(readable(req,env)?json(await totals(env)):error('Unauthorized',401),req,env);
   if(path==='/v1/match'&&req.method==='GET')return wrap(await matches(req,env),req,env);
   if(path==='/v1/admin/samples'&&req.method==='POST')return wrap(await upload(req,env),req,env);
   const m=path.match(/^\/v1\/samples\/([0-9a-fA-F-]{36})$/);
   if(m&&req.method==='GET')return wrap(await sample(req,env,m[1]),req,env);
   return wrap(error('Not found',404),req,env);
  }catch(e){console.error('Jay Vale Library API error',e);return wrap(error('Internal server error',500),req,env);}
 }
};
