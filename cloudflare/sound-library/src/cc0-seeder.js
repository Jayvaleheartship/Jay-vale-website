import { CC0_PACK } from './cc0-seed-manifest.js';
const BASE = 'https://raw.githubusercontent.com/' + CC0_PACK.owner + '/' + CC0_PACK.repo + '/' + CC0_PACK.revision + '/';
const BANDS = [45, 75, 125, 205, 340, 560, 920, 1510, 2500, 4100, 6800, 11200];
const MAX_BATCH = 7;
function ascii(v, p) { return String.fromCharCode(...new Uint8Array(v.buffer, p, 4)); }
function analyzeWav(buffer) {
  const v = new DataView(buffer);
  if (v.byteLength < 44 || ascii(v, 0) !== 'RIFF' || ascii(v, 8) !== 'WAVE') throw Error('Invalid WAV container');
  let p = 12, fmt = null, start = -1, length = 0;
  while (p + 8 <= v.byteLength) {
    const id = ascii(v, p), n = v.getUint32(p + 4, true), end = p + 8 + n;
    if (end > v.byteLength) throw Error('Invalid RIFF chunk');
    if (id === 'fmt ') {
      fmt = { format: v.getUint16(p+8,true), channels: v.getUint16(p+10,true), rate: v.getUint32(p+12,true), align: v.getUint16(p+20,true), bits: v.getUint16(p+22,true) };
    }
    if (id === 'data' && start < 0) { start = p + 8; length = n; }
    p = end + (n % 2);
  }
  if (!fmt || start < 0 || !length || ![1,3].includes(fmt.format) || ![16,24,32].includes(fmt.bits) || fmt.channels < 1 || fmt.channels > 8 || fmt.rate < 8000 || fmt.rate > 192000 || fmt.align !== fmt.channels * fmt.bits / 8) throw Error('Unsupported WAV format');
  if (fmt.format === 3 && fmt.bits !== 32) throw Error('Unsupported float WAV');
  const frames = Math.floor(length / fmt.align), n = Math.min(frames, fmt.rate * 5);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let c = 0; c < fmt.channels; c++) {
      const at = start + i * fmt.align + c * fmt.bits / 8;
      let x;
      if (fmt.format === 3) x = v.getFloat32(at,true);
      else if (fmt.bits === 16) x = v.getInt16(at,true) / 32768;
      else if (fmt.bits === 32) x = v.getInt32(at,true) / 2147483648;
      else { x = v.getUint8(at) | v.getUint8(at+1)<<8 | v.getUint8(at+2)<<16; if(x & 0x800000)x -= 0x1000000; x /= 8388608; }
      if (!Number.isFinite(x)) throw Error('Invalid audio sample');
      sum += x;
    }
    mono[i] = sum / fmt.channels;
  }
  const hop = Math.max(1, Math.round(fmt.rate * 0.005)), env = [], size = 2048;
  let peak = 0, peakAt = 0;
  for (let i = 0; i < mono.length; i += hop) {
    let sq = 0, end = Math.min(i+hop,mono.length);
    for (let j = i; j < end; j++) sq += mono[j]*mono[j];
    const rms = Math.sqrt(sq/(end-i)); env.push(rms);
    if (rms > peak) { peak = rms; peakAt = env.length-1; }
  }
  const onset = Math.max(0,env.findIndex(x=>x > peak*.12));
  let last = peakAt;
  for (let i = peakAt; i < env.length; i++) if (env[i] > peak*.2) last=i;
  const spectralAt = Math.max(0, Math.floor(onset*hop));
  const power = BANDS.map(hz=>{
    if (hz >= fmt.rate*.48) return 0;
    const co = 2*Math.cos(2*Math.PI*hz/fmt.rate);
    let total = 0;
    for (const base of [spectralAt,spectralAt+Math.floor(fmt.rate*.04),spectralAt+Math.floor(fmt.rate*.08)]) {
      if (base+size>mono.length) continue;
      let s1=0,s2=0;
      for(let i=0;i<size;i++){
        const next=mono[base+i]*(.5-.5*Math.cos(2*Math.PI*i/(size-1)))+co*s1-s2;
        s2=s1; s1=next;
      }
      total+=Math.max(0,s1*s1+s2*s2-co*s1*s2);
    }
    return Math.sqrt(total);
  });
  const norm=Math.hypot(...power)||1, sum=power.reduce((a,b)=>a+b,0);
  return {
    duration_ms:Math.round(frames/fmt.rate*1000),
    sample_rate:fmt.rate,
    features:{
      band_energies:power.map(x=>Math.round(x/norm*1e6)/1e6),
      centroid_hz:sum?Math.round(power.reduce((s,x,i)=>s+x*BANDS[i],0)/sum):0,
      attack_ms:Math.max(0,Math.round((peakAt-onset)*5)),
      decay_ms:Math.max(0,Math.round((last-peakAt)*5))
    }
  };
}
function classify(path) {
  const part=path.split('/')[2];
  if(part==='808s')return ['bass','bass808',['808','sub-bass']];
  if(part==='kicks')return ['drums','kick',['one-shot']];
  if(part==='snares')return ['drums','snare',['one-shot']];
  if(part==='claps')return ['drums','clap',['one-shot']];
  if(part==='hi-hats'||part==='open-hats')return ['drums','hat',[part==='hi-hats'?'closed':'open']];
  if(part==='percs')return ['percussion','percussion',['one-shot']];
  return ['percussion','cymbal',['effect']];
}
export async function seedCC0(env) {
  if(!env.DB || !env.SAMPLES)return;
  const doneResult=await env.DB.prepare('SELECT source_url FROM cc0_seed_imports').all();
  const done=new Set((doneResult.results||[]).map(r=>r.source_url));
  let attempts=0,added=0,errors=0;
  for (const entry of CC0_PACK.entries) {
    const url=BASE+entry.path.split('/').map(encodeURIComponent).join('/');
    if(done.has(url))continue;
    if(attempts++>=MAX_BATCH)break;
    try {
      const resp=await fetch(url,{redirect:'error'});
      if(!resp.ok)throw Error('Source HTTP '+resp.status);
      if(Number(resp.headers.get('content-length')||0)>15000000)throw Error('Audio too large');
      const audio=await resp.arrayBuffer();
      if(audio.byteLength!==entry.bytes || audio.byteLength>15000000)throw Error('Audio size changed');
      const {duration_ms,sample_rate,features}=analyzeWav(audio);
      const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',audio)),v=>v.toString(16).padStart(2,'0')).join('');
      const duplicate=await env.DB.prepare('SELECT id FROM samples WHERE sha256=?').bind(sha).first();
      const id=duplicate?.id||crypto.randomUUID();
      if(!duplicate) {
        const [family,instrument,tags]=classify(entry.path);
        const used=await env.DB.prepare('SELECT COALESCE(SUM(bytes),0) AS amount FROM samples').first();
        if(Number(used?.amount||0)+audio.byteLength>Number(env.MAX_LIBRARY_BYTES||9500000000))throw Error('Library storage limit reached');
        const key='samples/'+family+'/'+instrument+'/'+sha+'.wav';
        await env.SAMPLES.put(key,audio,{httpMetadata:{contentType:'audio/wav'},customMetadata:{license:CC0_PACK.license_spdx}});
        await env.DB.prepare('INSERT OR IGNORE INTO samples(id,sha256,r2_key,original_filename,family,instrument,bytes,duration_ms,sample_rate,root_midi,articulation,velocity_layer,tags_json,features_json,source_name,source_url,license_spdx,license_url,attribution) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(
          id,sha,key,entry.path.split('/').at(-1),family,instrument,audio.byteLength,duration_ms,sample_rate,null,'normal',null,JSON.stringify(tags),JSON.stringify(features),
          CC0_PACK.source_name,url,CC0_PACK.license_spdx,CC0_PACK.license_url,
          'Boochi44 Free Drum Samples — CC0 1.0'
        ).run();
        added++;
      }
      await env.DB.prepare('INSERT OR IGNORE INTO cc0_seed_imports(source_url,sha256,status,sample_id) VALUES(?,?,?,?)').bind(url,sha,duplicate?'duplicate':'imported',id).run();
    } catch(e) { errors++;console.error('CC0 seed import',entry.path,String(e).slice(0,250)); }
  }
  console.log('CC0 seed:',{attempts,added,errors,total:CC0_PACK.entries.length});
}
