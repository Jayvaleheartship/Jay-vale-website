/**
 * Jay Vale Audio Lab — one-time proof-of-possession read sessions.
 * The long-lived READ_TOKEN stays in Cloudflare Secrets and in the user's
 * password manager, never in source files, URLs or browser storage.
 * The client proves knowledge of the READ_TOKEN through a HMAC challenge;
 * the client never transmits the READ_TOKEN itself.
 *
 * 90-second challenge, single use. Read session expires after 15 minutes.
 * Session signature uses the separate ADMIN_TOKEN but does NOT permit admin
 * endpoints. Only the existing admin token can perform admin writes.
 */
const enc = new TextEncoder();
const dec = new TextDecoder();
const CHALLENGE_TTL = 90;
const SESSION_TTL = 900;
const MAX_TOKEN = 2048;
const PROOF_CONTEXT = 'jay-vale-audio-lab/v1/proof/';
const SIGN_CONTEXT = 'jay-vale-audio-lab/v1/token/';
function b64u(bytes){
 let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function unb64u(s){
 if(typeof s!=='string'||s.length>MAX_TOKEN||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Invalid token encoding');
 const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));
 return Uint8Array.from(b,x=>x.charCodeAt(0));
}
async function secretKey(secret,usage){
 return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,usage);
}
async function sign(secret,value){return new Uint8Array(await crypto.subtle.sign('HMAC',await secretKey(secret,['sign']),enc.encode(value)));}
async function verify(secret,value,sig){
 try{return sig.length===32&&await crypto.subtle.verify('HMAC',await secretKey(secret,['verify']),sig,enc.encode(value));}
 catch{return false;}
}
function payload(data){return b64u(enc.encode(JSON.stringify(data)));}
function unpack(payload64){
 const data=JSON.parse(dec.decode(unb64u(payload64)));
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid token');
 return data;
}
function now(){return Math.floor(Date.now()/1000);}
function expires(obj,maxAge){
 return Number.isInteger(obj.iat)&&Number.isInteger(obj.exp)&&obj.exp>now()&&
   obj.iat<=now()+5&&obj.exp<=obj.iat+maxAge&&obj.iat>=now()-maxAge-10;
}
export async function newChallenge(env) {
 const nonce=new Uint8Array(24);crypto.getRandomValues(nonce);
 const t=now(),body=payload({v:1,t:'connect',iat:t,exp:t+CHALLENGE_TTL,n:b64u(nonce)});
 return {challenge:body+'.'+b64u(await sign(env.ADMIN_TOKEN,SIGN_CONTEXT+'challenge/'+body)),
    expires_in:CHALLENGE_TTL,method:'HMAC-SHA256',scope:'library:read'};
}
async function validChallenge(env,token){
 if(typeof token!=='string'||token.length>MAX_TOKEN) return false;
 const parts=token.split('.');
 if(parts.length!==2)return false;
 try{
  const data=unpack(parts[0]);
  return data.v===1&&data.t==='connect'&&typeof data.n==='string'&&data.n.length===32&&
   expires(data,CHALLENGE_TTL)&&
   await verify(env.ADMIN_TOKEN,SIGN_CONTEXT+'challenge/'+parts[0],unb64u(parts[1]));
 }catch{return false}
}
export async function openReadSession(env,challenge,proof){
 if(typeof proof!=='string'||proof.length!==43||!await validChallenge(env,challenge))return null;
 let proofBytes;
 try{proofBytes=unb64u(proof)}catch{return null}
 if(!await verify(env.READ_TOKEN,PROOF_CONTEXT+challenge,proofBytes))return null;
 const fingerprint=b64u(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(challenge))));
 // D1 unique key ensures a one-time connection attempt cannot be replayed.
 const insert=await env.DB.prepare('INSERT OR IGNORE INTO used_lab_challenges(id,expires_at) VALUES(?,?)')
   .bind(fingerprint,now()+SESSION_TTL).run();
 if(!insert.meta?.changes)return {replayed:true};
 const t=now(),body=payload({v:1,t:'read',iat:t,exp:t+SESSION_TTL,n:crypto.randomUUID()});
 const access_token=body+'.'+b64u(await sign(env.ADMIN_TOKEN,SIGN_CONTEXT+'session/'+body));
 return {access_token,token_type:'Bearer',expires_in:SESSION_TTL,scope:'library:read'};
}
export async function verifyReadSession(request,env){
 const raw=request.headers.get('authorization')||'';
 if(!raw.startsWith('Bearer ')||raw.length>MAX_TOKEN+10)return false;
 const token=raw.slice(7),parts=token.split('.');
 if(parts.length!==2)return false;
 try{
  const data=unpack(parts[0]);
  return data.v===1&&data.t==='read'&&typeof data.n==='string'&&
   data.n.length>=30&&expires(data,SESSION_TTL)&&
   await verify(env.ADMIN_TOKEN,SIGN_CONTEXT+'session/'+parts[0],unb64u(parts[1]));
 }catch{return false}
}
export async function pruneLabChallenges(env){
 await env.DB.prepare('DELETE FROM used_lab_challenges WHERE expires_at < ?').bind(now()).run();
}
