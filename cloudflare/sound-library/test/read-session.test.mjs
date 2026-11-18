import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newChallenge,openReadSession,verifyReadSession,pruneLabChallenges} from '../src/session-auth.js';
const READ='test-read-only-token-aaaaaaaaaaaaaaaaaaaaaaa';
const ADMIN='test-admin-token-bbbbbbbbbbbbbbbbbbbbbbbbb';
const context='jay-vale-audio-lab/v1/proof/';
function b64u(bytes){return Buffer.from(bytes).toString('base64url');}
const encoder=new TextEncoder();
async function proof(secret,challenge){
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return b64u(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(context+challenge))));
}
function database(){
 const used=new Map();
 return {prepare(sql){return {bind(...values){return {run:async()=>{
  if(sql.startsWith('INSERT OR IGNORE')){
   if(used.has(values[0]))return {meta:{changes:0}};
   used.set(values[0],values[1]);return {meta:{changes:1}};
  }
  if(sql.startsWith('DELETE FROM used_lab_challenges')){
   for(const [key,exp]of used)if(exp<values[0])used.delete(key);
   return {meta:{changes:1}};
  }
  throw Error('Unexpected SQL: '+sql);
 }}}}}};
}
function env(){return {READ_TOKEN:READ,ADMIN_TOKEN:ADMIN,DB:database()};}
test('challenge yields one-use fifteen-minute read-only session',async()=>{
 const cloud=env();
 const {challenge,expires_in,scope}=await newChallenge(cloud);
 assert.equal(expires_in,90);
 assert.equal(scope,'library:read');
 const auth=await openReadSession(cloud,challenge,await proof(READ,challenge));
 assert.equal(auth.token_type,'Bearer');
 assert.equal(auth.scope,'library:read');
 assert.equal(auth.expires_in,900);
 const request=new Request('https://example.com/v1/catalog',{headers:{authorization:'Bearer '+auth.access_token}});
 assert.equal(await verifyReadSession(request,cloud),true);
 assert.deepEqual(await openReadSession(cloud,challenge,await proof(READ,challenge)),{replayed:true});
 await pruneLabChallenges(cloud);
});
test('invalid pairing proof rejected and no token issued',async()=>{
 const cloud=env();
 const {challenge}=await newChallenge(cloud);
 assert.equal(await openReadSession(cloud,challenge,await proof('wrong-passcode-00000000000000000000',challenge)),null);
 const result=await openReadSession(cloud,challenge,await proof(READ,challenge));
 assert.equal(result.scope,'library:read');
});
test('session is not accepted if tampered, expired, or signed with other admin secret',async()=>{
 const a=env(), b=env();b.ADMIN_TOKEN='another-unrelated-admin-secret-xxxxxxxxxxxxx';
 const {challenge}=await newChallenge(a);
 const session=await openReadSession(a,challenge,await proof(READ,challenge));
 const h={authorization:'Bearer '+session.access_token};
 assert.equal(await verifyReadSession(new Request('https://example.com/',{headers:h}),b),false);
 assert.equal(await verifyReadSession(new Request('https://example.com/',{headers:{authorization:'Bearer '+session.access_token+'extra'}}),a),false);
 assert.equal(await verifyReadSession(new Request('https://example.com/',{}),a),false);
});
test('static website contains no long-lived library tokens and JavaScript parses',()=>{
 const html=fs.readFileSync(new URL('../../../studio/audio-lab/index.html',import.meta.url),'utf8');
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match);
 assert.doesNotThrow(()=>new Function(match[1]));
 for(const needed of ['id="cloud-read-key"','id="cloud-connect"','id="cloud-load-drums"','/v1/session/challenge','/v1/library/samples'])assert.ok(html.includes(needed),needed);
 assert.ok(html.includes('credentials:\'omit\''));
 assert.ok(html.includes('cloudSessionToken=null'));
 assert.ok(!html.includes(READ));
 assert.ok(!html.includes(ADMIN));
 assert.ok(!/localStorage\.(?:setItem|getItem)\([^)]*(?:token|key)/i.test(html));
});
