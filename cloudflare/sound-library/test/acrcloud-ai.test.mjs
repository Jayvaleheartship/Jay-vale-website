import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  aiDetectionConfigured, aiDetectionStatus, submitAiDetection,submitLargeAiDetection,
  pollAiDetection, deleteAiDetection
} from '../src/acrcloud-ai.js';

const env = Object.freeze({
  ACRCLOUD_REGION: 'eu-west-1',
  ACRCLOUD_CONTAINER_ID: '12345',
  ACRCLOUD_ACCESS_TOKEN: 'this-is-a-fake-test-token-not-real'
});
const sampleId = 'f60c40d8-f35e-488e-bca4-105d85b080dc';
function req(name = 'test.mp3', contents = 'ID3example', consent = 'yes') {
  const form = new FormData();
  form.set('file', new File([contents], name, {type: 'audio/mpeg'}));
  return new Request('https://worker.test/v1/ai-detection', {
    method: 'POST',
    headers: {'x-confirm-provider-upload': consent},
    body: form
  });
}
async function mockFetch(fn, callback) {
  const previous = globalThis.fetch;
  globalThis.fetch = fn;
  try { return await callback(); }
  finally { globalThis.fetch = previous; }
}

test('only accepted ACRCloud region and server-side secrets enable detection', async () => {
  assert.equal(aiDetectionConfigured(env), true);
  assert.equal(aiDetectionConfigured({...env, ACRCLOUD_REGION:'evil.tld'}), false);
  assert.equal(aiDetectionConfigured({...env, ACRCLOUD_ACCESS_TOKEN:'bad'}), false);
  assert.equal(aiDetectionConfigured({...env, ACRCLOUD_CONTAINER_ID:'../secret'}), false);
  await mockFetch(async (url) => {
    assert.equal(url, 'https://api-v2.acrcloud.com/api/fs-containers/12345');
    return Response.json({data:{id:12345,region:'eu-west-1',engine:1,policy:{ai_detection:1}}});
  }, async () => {
    const status = await (await aiDetectionStatus(env)).json();
    assert.equal(status.configured, true);
    assert.equal(status.provider_verified, true);
    assert.equal(status.provider_ready, true);
    assert.equal(status.provider_max_duration_seconds, 900);
  });
});

test('missing provider configuration fails closed without an upstream request', async () => {
  const response = await submitAiDetection(req(), {});
  assert.equal(response.status, 503);
});

test('upload is blocked without explicit external-provider consent', async () => {
  const response = await submitAiDetection(req('test.mp3','ID3test','no'), env);
  assert.equal(response.status, 400);
});

test('upload rejects non-audio extension before contacting provider', async () => {
  const response = await submitAiDetection(req('unsafe.exe'), env);
  assert.equal(response.status, 400);
});

test('upload rejects zero-byte files', async () => {
  const response = await submitAiDetection(req('empty.wav',''), env);
  assert.equal(response.status, 413);
});

test('upload submits to an allowlisted ACRCloud host and returns provider ID', async () => {
  await mockFetch(async (url, options) => {
    if (url === 'https://api-v2.acrcloud.com/api/fs-containers/12345') {
      return Response.json({data:{id:12345,region:'eu-west-1',engine:1,
        policy:{ai_detection:1}}});
    }
    assert.equal(url, 'https://api-eu-west-1.acrcloud.com/api/fs-containers/12345/files');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('authorization'), 'Bearer '+env.ACRCLOUD_ACCESS_TOKEN);
    assert.equal(options.body.get('data_type'), 'audio');
    assert.equal(options.body.get('file').name, 'test.mp3');
    return Response.json({data: {file_id: sampleId, state: 0}}, {status: 201});
  }, async () => {
    const response = await submitAiDetection(req(), env);
    assert.equal(response.status, 202);
    assert.equal((await response.json()).file_id, sampleId);
  });
});

test('disabled AI detector is refused even with valid provider token', async () => {
  let calls = 0;
  await mockFetch(async (url) => {
    calls++;
    assert.equal(url, 'https://api-v2.acrcloud.com/api/fs-containers/12345');
    return Response.json({data:{id:12345,region:'eu-west-1',engine:1,
      policy:{ai_detection:0}}});
  }, async () => {
    const result = await submitAiDetection(req(), env);
    assert.equal(result.status, 503);
    assert.match((await result.json()).error, /not enabled/);
  });
  assert.equal(calls,1);
});

test('mismatched region is blocked before provider upload', async () => {
  await mockFetch(async () => Response.json({data:{id:12345,region:'us-west-2',engine:5}}),
    async () => {
      const status = await (await aiDetectionStatus(env)).json();
      assert.equal(status.provider_ready,false);
      assert.equal(status.provider_verified,false);
    });
});

test('streaming upload remains disabled without verified provider contract',async()=>{
  const request = new Request('https://worker.test/v1/ai-detection/stream',{
    method:'POST',body:new File(['audio'],'track.wav'),
    headers:{'x-confirm-provider-upload':'yes','x-audio-size':'5','x-audio-filename':'track.wav'}
  });
  const response = await submitLargeAiDetection(request,env);
  assert.equal(response.status,503);
});

test('presigned streaming upload verifies container, avoids Bearer token on S3, then submits metadata', async () => {
  const called = [];
  const request = new Request('https://worker.test/v1/ai-detection/stream', {
    method:'POST',body: new File(['RIFFexample'],'track.wav',{type:'audio/wav'}),
    headers:{'x-confirm-provider-upload':'yes','x-audio-size':'11',
      'x-audio-filename':'track.wav','content-type':'audio/wav'}
  });
  await mockFetch(async (url,options) => {
    const address=String(url);called.push(address);
    if(address.includes('api-v2.acrcloud.com')){
      assert.equal(options.headers.authorization,'Bearer '+env.ACRCLOUD_ACCESS_TOKEN);
      return Response.json({data:{id:12345,region:'eu-west-1',engine:1,policy:{ai_detection:1}}});
    }
    if(address.includes('/presigned-upload')){
      assert.equal(options.headers.get('authorization'),'Bearer '+env.ACRCLOUD_ACCESS_TOKEN);
      return Response.json({data:{
        presigned_url:'https://my-bucket.s3.eu-west-1.amazonaws.com/fs/queue/abc.wav?X-Amz-Signature=dummy',
        key:'fs/queue/abc.wav',headers:{'content-type':'audio/wav'}
      }});
    }
    if(address.includes('amazonaws.com')){
      assert.equal(options.method,'PUT');
      assert.equal(options.headers.has('authorization'),false);
      assert.equal(options.headers.get('content-type'),'audio/wav');
      return new Response('',{status:200});
    }
    assert.equal(options.method,'POST');
    const submission=JSON.parse(options.body);
    assert.deepEqual(submission,{data_type:'audio',key:'fs/queue/abc.wav',filename:'track.wav'});
    return Response.json({data:{file_id:sampleId,state:0}},{status:201});
  },async()=>{
    const response=await submitLargeAiDetection(request,{...env,ACRCLOUD_ENABLE_EXPERIMENTAL_STREAM:'true'});
    assert.equal(response.status,202);
    assert.equal((await response.json()).upload_method,'presigned_stream');
  });
  assert.equal(called.length,4);
});

test('presigned upload rejects non-S3 URL and never sends any audio to that host',async()=>{
  let calls=0;
  const request = new Request('https://worker.test/v1/ai-detection/stream',{
    method:'POST',body:new File(['RIFFexample'],'track.wav',{type:'audio/wav'}),
    headers:{'x-confirm-provider-upload':'yes','x-audio-size':'11','x-audio-filename':'track.wav'}
  });
  await mockFetch(async(url)=>{
    calls++;
    if(String(url).includes('api-v2.acrcloud.com'))
      return Response.json({data:{id:12345,region:'eu-west-1',engine:1,policy:{ai_detection:1}}});
    return Response.json({data:{presigned_url:'https://evil.example.net/receive',
      key:'fs/queue/test.wav'}});
  },async()=>{
    const response=await submitLargeAiDetection(request,{...env,ACRCLOUD_ENABLE_EXPERIMENTAL_STREAM:'true'});
    assert.equal(response.status,502);
    assert.match((await response.json()).error,/untrusted upload destination/);
  });
  assert.equal(calls,2);
});

test('large upload refuses 100 MiB before contacting any provider',async()=>{
  const request=new Request('https://worker.test/v1/ai-detection/stream',{
    method:'POST',body:new File(['x'],'track.wav'),
    headers:{'x-confirm-provider-upload':'yes',
      'x-audio-size':String(100*1024*1024),'x-audio-filename':'track.wav'}
  });
  const response=await submitLargeAiDetection(request,{...env,ACRCLOUD_ENABLE_EXPERIMENTAL_STREAM:'true'});
  assert.equal(response.status,413);
});

test('poll preserves exact provider model output including stem, segments and source scores', async () => {
  const detector = [
    {stem:'original',ai_probability:97.61,prediction:'ai_generated',likely_source:'Suno',model_id:'model-v1',
      segments:[{start:0,end:14.8,ai_probability:98.24}],
      source_probabilities:[{source:'Suno',probability:96.02}]},
    {stem:'vocals',ai_probability:42.77,prediction:'human',likely_source:'Human',segments:[]},
    {stem:'accompaniment',ai_probability:99.09,prediction:'ai_generated'}
  ];
  await mockFetch(async () => Response.json({data:[{id:sampleId,state:1,duration:15,results:{ai_detection:detector}}]}),async()=>{
    const response = await pollAiDetection(env,sampleId);
    assert.equal(response.status,200);
    const payload=await response.json();
    assert.equal(payload.status,'ready');
    assert.deepEqual(payload.model_results,detector);
  });
});

test('incomplete provider results are not represented as a finished detection', async () => {
  await mockFetch(async()=>Response.json({data:[{id:sampleId,state:0,results:{}}]}),async()=>{
    const response=await pollAiDetection(env,sampleId);
    const result=await response.json();
    assert.equal(result.status,'processing');
    assert.deepEqual(result.model_results,[]);
  });
});

test('successful provider deletion does not expose credentials', async () => {
  await mockFetch(async (url,options)=>{
    assert.ok(url.endsWith('/files/'+sampleId));
    assert.equal(options.method,'DELETE');
    return new Response(null,{status:204});
  },async()=>{
    const response=await deleteAiDetection(env,sampleId);
    assert.deepEqual(await response.json(),{deleted:true,file_id:sampleId});
  });
});

test('provider error payload is not reflected to browser', async () => {
  await mockFetch(async()=>Response.json({access_token:'LEAK-ME'}, {status:401}),async()=>{
    const response=await pollAiDetection(env,sampleId);
    assert.equal(response.status,502);
    assert.equal(JSON.stringify(await response.json()).includes('LEAK-ME'),false);
  });
});

test('UI documents provenance and does not embed any ACRCloud access token', async () => {
  const page=await readFile(new URL('../../../studio/audio-lab/ai-detection.html',import.meta.url),'utf8');
  assert.match(page,/AI Detection Lab/);
  assert.match(page,/provider's scores without editing them/);
  assert.match(page,/x-confirm-provider-upload/);
  const scripts=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length,1);
  assert.doesNotThrow(()=>new Function(scripts[0][1]));
  assert.doesNotMatch(page,/ACRCLOUD_ACCESS_TOKEN\s*=/);
  assert.doesNotMatch(page,/localStorage/);
  const worker=await readFile(new URL('../src/index.js',import.meta.url),'utf8');
  assert.match(worker,/await aiDetectionStatus\(env\)/);
  assert.match(worker,/submitLargeAiDetection\(req,env\)/);
});
