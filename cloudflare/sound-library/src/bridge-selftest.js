import {newChallenge,openReadSession,verifyReadSession} from './session-auth.js';
// Runs at most once every 12 hours. Does not disclose keys, session tokens or sample data.
const enc=new TextEncoder();
const PROOF_CONTEXT='jay-vale-audio-lab/v1/proof/';
function b64u(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export async function verifyCloudBridge(env){
 const previous=await env.DB.prepare('SELECT checked_at FROM lab_connection_health WHERE id=1').first();
 if(previous?.checked_at&&Date.now()-Date.parse(previous.checked_at)<12*3600000)return;
 let session_verified=0,d1_sample_verified=0,r2_sample_verified=0,status='failed';
 try{
  const challenge=await newChallenge(env);
  const key=await crypto.subtle.importKey('raw',enc.encode(env.READ_TOKEN),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const proof=b64u(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(PROOF_CONTEXT+challenge.challenge))));
  const session=await openReadSession(env,challenge.challenge,proof);
  if(!session?.access_token)throw Error('Read-only proof rejected');
  const req=new Request('https://worker.example/v1/catalog',{headers:{authorization:'Bearer '+session.access_token}});
  session_verified=(await verifyReadSession(req,env))?1:0;
  if(!session_verified)throw Error('Read-only token not accepted');
  const sample=await env.DB.prepare('SELECT id,r2_key,bytes FROM samples LIMIT 1').first();
  d1_sample_verified=sample?.id?1:0;
  if(!d1_sample_verified)throw Error('No samples indexed');
  const obj=await env.SAMPLES.get(sample.r2_key);
  if(!obj)throw Error('Indexed R2 sample not found');
  const bytes=await obj.arrayBuffer();
  r2_sample_verified=bytes.byteLength===sample.bytes?1:0;
  if(!r2_sample_verified)throw Error('R2 sample length differed');
  status='passed';
 }catch(e){console.error('Lab connection self-check failed',String(e).slice(0,150));}
 await env.DB.prepare('UPDATE lab_connection_health SET checked_at=?,session_verified=?,d1_sample_verified=?,r2_sample_verified=?,status=? WHERE id=1')
  .bind(new Date().toISOString(),session_verified,d1_sample_verified,r2_sample_verified,status).run();
}
export async function readCloudBridgeHealth(env){
 try{
  const row=await env.DB.prepare('SELECT checked_at,session_verified,d1_sample_verified,r2_sample_verified,status FROM lab_connection_health WHERE id=1').first();
  if(!row)return {status:'pending'};
  return {checked_at:row.checked_at,status:row.status,session_verified:!!row.session_verified,
    d1_sample_verified:!!row.d1_sample_verified,r2_sample_verified:!!row.r2_sample_verified};
 }catch{return {status:'migration_pending'};}
}
