/**
 * Jay Vale Audio Lab — authorized ACRCloud AI Music Detection adapter.
 *
 * This does not copy or emulate ACRCloud's proprietary model. All probability
 * scores, predictions, model IDs and segment results originate at ACRCloud.
 * The token stays in Cloudflare Worker secrets and is never sent to a client.
 */
const REGIONS = new Set(['eu-west-1', 'us-west-2', 'ap-southeast-1']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'flac', 'ogg']);
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const MAX_STREAM_BYTES = 95 * 1024 * 1024;
const AUDIO_TYPES = {mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',flac:'audio/flac',ogg:'audio/ogg'};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'}
  });
}
function fail(message, status = 400) { return json({error: message}, status); }

export function aiDetectionConfigured(env) {
  return Boolean(env &&
    typeof env.ACRCLOUD_ACCESS_TOKEN === 'string' &&
    env.ACRCLOUD_ACCESS_TOKEN.length >= 16 &&
    ((REGIONS.has(env.ACRCLOUD_REGION) &&
      /^[1-9]\d{0,15}$/.test(String(env.ACRCLOUD_CONTAINER_ID ?? ''))) ||
     (!env.ACRCLOUD_REGION && !env.ACRCLOUD_CONTAINER_ID)));
}
function explicitContainer(env) {
  return REGIONS.has(env.ACRCLOUD_REGION) &&
    /^[1-9]\d{0,15}$/.test(String(env.ACRCLOUD_CONTAINER_ID ?? ''));
}
function aiEnabled(c) {
  // Both a top-level AI flag and an engine=5 are documented by ACRCloud.
  const flag=c?.ai_detection ?? c?.policy?.ai_detection;
  // An explicit off flag must override an older engine classification.
  if(flag!==undefined&&flag!==null)
    return flag===true || Number(flag)===1;
  return Number(c?.engine)===5;
}
function safeContainer(c) {
  return {id:String(c.id),name:String(c.name||''),region:c.region,
    engine:Number(c.engine),ai_detection:aiEnabled(c)};
}
function authorizedProviderHeaders(env) {
  return {authorization:'Bearer '+env.ACRCLOUD_ACCESS_TOKEN,accept:'application/json'};
}

/**
 * A configured token does not imply that AI detection is enabled. Verify the
 * container via ACRCloud's official Console API before accepting paid scans.
 * The Console API hostname is fixed and cannot be changed by user settings.
 */
export async function inspectAiContainer(env) {
  if (!aiDetectionConfigured(env)) {
    return {verified: false, enabled: false,
      message: 'Configure ACRCLOUD_ACCESS_TOKEN, ACRCLOUD_CONTAINER_ID and ACRCLOUD_REGION privately.'};
  }
  const url=explicitContainer(env)
    ? 'https://api-v2.acrcloud.com/api/fs-containers/'+env.ACRCLOUD_CONTAINER_ID
    : 'https://api-v2.acrcloud.com/api/fs-containers?per_page=100';
  let response;
  try {
    response=await fetch(url,{method:'GET',redirect:'error',
      headers:authorizedProviderHeaders(env)});
  } catch {
    return {verified:false,enabled:false,message:'Could not contact ACRCloud Console API.'};
  }
  if (!response.ok) {
    return {verified:false,enabled:false,
      message:'Could not validate ACRCloud container (provider status '+response.status+').'};
  }
  let payload;
  try {payload=await response.json();}
  catch {return {verified:false,enabled:false,message:'Unexpected ACRCloud container response.'};}
  let container;
  if (explicitContainer(env)) {
    container=payload?.data;
    if (!container || String(container.id)!==String(env.ACRCLOUD_CONTAINER_ID) ||
        container.region!==env.ACRCLOUD_REGION) {
      return {verified:false,enabled:false,
        message:'ACRCloud container ID or region does not match private configuration.'};
    }
  } else {
    // Never silently select a container from an incomplete or ambiguous list.
    if (payload?.meta && Number(payload.meta.last_page)>1)
      return {verified:false,enabled:false,
        message:'Multiple container pages found. Set your container ID and region.'};
    const all=Array.isArray(payload?.data)?payload.data:[];
    let matches=all.filter(c=>REGIONS.has(c?.region)&&aiEnabled(c));
    const preferred=String(env.ACRCLOUD_CONTAINER_NAME||'').trim();
    if(preferred)matches=matches.filter(c=>String(c.name||'')===preferred);
    if(matches.length!==1)
      return {verified:false,enabled:false,
        message:matches.length===0?'No unique AI-enabled container found. Configure a container name or ID.':
          'Multiple AI-enabled containers found. Set ACRCLOUD_CONTAINER_NAME or a numeric container ID.'};
    container=matches[0];
  }
  const enabled=aiEnabled(container);
  return {...safeContainer(container),verified:true,enabled,
    message:enabled?'ACRCloud AI Music Detection is enabled.':
      'ACRCloud container exists, but AI Music Detection is not enabled.'};
}

export async function aiDetectionStatus(env) {
  const check = await inspectAiContainer(env);
  return json({
    provider: 'ACRCloud File Scanning AI Music Detection',
    configured: aiDetectionConfigured(env),
    provider_verified: check.verified,
    provider_ready: check.enabled,
    engine: check.engine ?? null,
    region: check.region ?? null,
    container_id: check.id ?? null,
    container_name: check.name ?? null,
    new_scans_enabled: check.enabled && env.ACRCLOUD_NEW_SCANS_ENABLED === 'true',
    deletion_enabled: env.ACRCLOUD_DELETE_ENABLED === 'true',
    upload_max_bytes: env.ACRCLOUD_ENABLE_EXPERIMENTAL_STREAM === 'true' ? MAX_STREAM_BYTES : MAX_AUDIO_BYTES,
    direct_upload_max_bytes: MAX_AUDIO_BYTES,
    provider_max_duration_seconds: 900,
    interpretation: 'Provider model output, not proof of origin',
    message: check.message
  });
}

function baseUrl(region,containerId) {
  // Both components are verified by the Console API, never client input.
  return 'https://api-' + region + '.acrcloud.com/api/fs-containers/' + containerId;
}

async function providerCall(env, suffix, options = {}, verifiedContainer = null) {
  if (!aiDetectionConfigured(env)) {
    return {ok:false,response:fail('ACRCloud API is not configured',503)};
  }
  const active=verifiedContainer || await inspectAiContainer(env);
  if (!active.verified || !active.enabled)
    return {ok:false,response:fail(active.message,503)};
  let response;
  try {
    const headers = new Headers(options.headers || {});
    headers.set('authorization', 'Bearer ' + env.ACRCLOUD_ACCESS_TOKEN);
    headers.set('accept', 'application/json');
    response = await fetch(baseUrl(active.region,active.id) + suffix,
      {...options, headers, redirect: 'error'});
  } catch {
    return {ok: false, response: fail('ACRCloud is unreachable or timed out', 502)};
  }
  if (options.method === 'DELETE' && response.status === 204) {
    return {ok: true, data: null, status: response.status};
  }
  if (!response.ok) {
    // Deliberately avoid forwarding provider raw errors, which can contain
    // account information, request URLs or other sensitive diagnostics.
    const errorStatus = response.status === 401 || response.status === 403 ? 502 :
      response.status === 429 ? 429 : 502;
    const message = response.status === 429
      ? 'ACRCloud quota or rate limit reached'
      : 'ACRCloud request unsuccessful (provider status ' + response.status + ')';
    return {ok: false, response: fail(message, errorStatus)};
  }
  try {
    return {ok: true, data: await response.json(), status: response.status};
  } catch {
    return {ok: false, response: fail('ACRCloud returned an unreadable response', 502)};
  }
}

export async function submitAiDetection(request, env) {
  if (!aiDetectionConfigured(env)) return fail('ACRCloud API is not configured',503);
  if (env.ACRCLOUD_NEW_SCANS_ENABLED !== 'true')
    return fail('New paid scans are disabled. Existing results remain readable.',403);
  if (request.headers.get('x-confirm-provider-upload') !== 'yes') {
    return fail('Confirm the external provider upload before submission', 400);
  }
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_AUDIO_BYTES + 500000) {
    return fail('Audio exceeds 50 MiB upload limit', 413);
  }

  let form;
  try { form = await request.formData(); }
  catch { return fail('Expected multipart form data containing an audio file'); }
  const file = form.get('file');
  if (!file || typeof file === 'string' || !Number.isInteger(file.size)) {
    return fail('Select an audio file to scan');
  }
  if (file.size < 1 || file.size > MAX_AUDIO_BYTES) {
    return fail('Audio must be larger than zero and no more than 50 MiB', 413);
  }
  const filename = String(file.name || 'audio').replace(/[/\\\r\n"]/g, '_').slice(0, 180);
  const extension = filename.split('.').pop().toLowerCase();
  if (!AUDIO_EXTENSIONS.has(extension)) {
    return fail('Supported formats: MP3, WAV, M4A, FLAC and OGG');
  }
  const containerCheck = await inspectAiContainer(env);
  if (!containerCheck.verified || !containerCheck.enabled) {
    return fail(containerCheck.message, 503);
  }

  const providerForm = new FormData();
  providerForm.set('data_type', 'audio');
  providerForm.set('file', file, filename);
  const upstream = await providerCall(env, '/files', {
    method:'POST',body:providerForm
  },containerCheck);
  if (!upstream.ok) return upstream.response;

  const record = upstream.data?.data;
  const id = record?.file_id || record?.id ||
    (Array.isArray(record) ? record[0]?.id : null);
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) {
    return fail('ACRCloud accepted the file but did not return a usable file identifier', 502);
  }
  return json({file_id: id, state: Number(record?.state ?? 0),
    status: 'submitted', provider: 'ACRCloud'}, 202);
}

/**
 * Large lossless WAV/FLAC files can exceed small multipart request limits.
 * Streaming directly from the authenticated browser request to ACRCloud's
 * provider-signed S3 object avoids buffering the full audio in Worker memory.
 * The S3 URL and key are never sent back to the browser.
 *
 * This route is experimental until verified with a live ACRCloud container.
 */
export async function submitLargeAiDetection(request, env) {
  // The presigned-upload contract is not yet verified against this provider
  // account. Keep the experimental path disabled instead of risking audio loss.
  if (env.ACRCLOUD_ENABLE_EXPERIMENTAL_STREAM !== 'true')
    return fail('Large-file streaming is not validated or enabled. Use a smaller original file.', 503);
  if (!aiDetectionConfigured(env)) return fail('ACRCloud API is not configured',503);
  if (env.ACRCLOUD_NEW_SCANS_ENABLED !== 'true')
    return fail('New paid scans are disabled. Existing results remain readable.',403);
  if (request.headers.get('x-confirm-provider-upload') !== 'yes')
    return fail('Confirm the external provider upload before submission');
  const declaredSize = Number(request.headers.get('x-audio-size'));
  if (!Number.isSafeInteger(declaredSize) || declaredSize < 1 ||
      declaredSize > MAX_STREAM_BYTES)
    return fail('Streamed audio must be between 1 byte and 95 MiB', 413);
  const transportSize = request.headers.get('content-length');
  if (transportSize !== null && Number(transportSize) !== declaredSize)
    return fail('Audio transfer size differs from the declared size', 400);
  let filename;
  try {filename = decodeURIComponent(request.headers.get('x-audio-filename') || '');}
  catch {return fail('Invalid encoded filename');}
  filename = filename.replace(/[/\\\r\n"]/g, '_').slice(0, 180);
  const extension = filename.split('.').pop().toLowerCase();
  if (!AUDIO_EXTENSIONS.has(extension) || !request.body)
    return fail('Provide a valid MP3, WAV, M4A, FLAC or OGG file body');
  const containerCheck = await inspectAiContainer(env);
  if (!containerCheck.verified || !containerCheck.enabled)
    return fail(containerCheck.message, 503);

  const requestedType = AUDIO_TYPES[extension];
  const presigned = await providerCall(env, '/presigned-upload?filename=' +
    encodeURIComponent(filename) + '&content_type=' + encodeURIComponent(requestedType),{},containerCheck);
  if (!presigned.ok) return presigned.response;
  const data = presigned.data?.data;
  if (!data || typeof data.presigned_url !== 'string' ||
      typeof data.key !== 'string' || !/^fs\/queue\/[A-Za-z0-9._/-]+$/.test(data.key))
    return fail('ACRCloud returned an invalid presigned upload response', 502);
  let url;
  try {url = new URL(data.presigned_url);}
  catch {return fail('ACRCloud supplied an invalid upload address', 502);}
  // Never stream user-controlled content to an arbitrary target.
  const s3Host = /(^|\.)s3([.-][a-z0-9-]+)?\.amazonaws\.com$/i.test(url.hostname);
  if (url.protocol !== 'https:' || url.username || url.password || !s3Host ||
      url.port !== '' || url.hash !== '')
    return fail('ACRCloud supplied an untrusted upload destination', 502);

  let headers;
  try {
    headers = new Headers(data.headers || {});
    for (const key of headers.keys()) {
      if (!/^(content-type|x-amz-[a-z0-9-]+)$/i.test(key))
        return fail('ACRCloud requested an unsafe storage header', 502);
    }
    if (!headers.has('content-type')) headers.set('content-type', requestedType);
  } catch {
    return fail('ACRCloud supplied invalid storage headers', 502);
  }
  let storageResponse;
  try {
    storageResponse = await fetch(url.toString(),{
      method:'PUT',body:request.body,headers,redirect:'error'
    });
  } catch {
    return fail('Unable to stream the audio to ACRCloud storage', 502);
  }
  if (!storageResponse.ok) return fail('ACRCloud storage did not accept the audio', 502);

  const submitted = await providerCall(env, '/files', {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({data_type:'audio',key:data.key,filename})
  },containerCheck);
  if (!submitted.ok) return submitted.response;
  const row = submitted.data?.data;
  const id = row?.file_id || row?.id;
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))
    return fail('ACRCloud accepted the file but returned no usable scan ID', 502);
  return json({file_id:id,state:Number(row?.state ?? 0),
    status:'submitted',provider:'ACRCloud',upload_method:'presigned_stream'},202);
}

/**
 * Read-only, zero-resubmission access to the user's previous ACRCloud scans.
 * The list deliberately excludes unrelated provider metadata and does not
 * report any new scans as completed.
 */
export async function listExistingAiDetections(env) {
  const active=await inspectAiContainer(env);
  if(!active.verified||!active.enabled) return fail(active.message,503);
  const upstream=await providerCall(env,'/files?page=1&per_page=30&with_result=0',{method:'GET'},active);
  if(!upstream.ok)return upstream.response;
  const data=upstream.data?.data;
  if(!Array.isArray(data))return fail('ACRCloud returned an unexpected file list',502);
  const files=data.filter(x=>x&&typeof x.id==='string'&&
    /^[0-9a-f-]{36}$/i.test(x.id)).map(x=>({
      id:x.id,name:String(x.name||'Untitled recording').slice(0,240),
      duration:x.duration??null,state:Number(x.state),
      created_at:x.created_at||null
    }));
  return json({provider:'ACRCloud',container_name:active.name,files,
    next_page_available:Number(upstream.data?.meta?.last_page||1)>1});
}

export async function pollAiDetection(env, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Invalid scan identifier', 400);
  const upstream = await providerCall(env, '/files/' + id);
  if (!upstream.ok) return upstream.response;
  const data = upstream.data?.data;
  const record = Array.isArray(data) ? data.find(x => x?.id === id) : data;
  if (!record || typeof record !== 'object' || record.id !== id) {
    return fail('ACRCloud has not returned a scan record', 502);
  }
  const state = Number(record.state ?? 0);
  const detections = Array.isArray(record.results?.ai_detection)
    ? record.results.ai_detection : [];
  const status = state === 0 ? 'processing'
    : state === 1 && detections.length ? 'ready'
    : state === 1 ? 'no_detection_results' : 'failed';
  // Do not invent, normalize, smooth or recalibrate provider predictions.
  return json({
    file_id: id, status, state,
    duration: record.duration != null && Number.isFinite(Number(record.duration))
      ? Number(record.duration) : null,
    model_results: detections,
    provider: 'ACRCloud',
    warning: 'Scores are provider probabilities, not a guarantee of human or AI origin.'
  });
}

export async function deleteAiDetection(env, id) {
  // READ_TOKEN ordinarily grants read-only sample access. Provider deletion
  // therefore requires a separate explicit server-side enablement flag.
  if (env.ACRCLOUD_DELETE_ENABLED !== 'true')
    return fail('Deletion of provider scan records is disabled by default',403);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Invalid scan identifier', 400);
  const upstream = await providerCall(env, '/files/' + id, {method: 'DELETE'});
  if (!upstream.ok) return upstream.response;
  return json({deleted: true, file_id: id});
}
