#!/usr/bin/env python3
"""Interlude complete source ingestion, lossless reference protection, and per-stem signal analysis.

No AI detector spoofing. Never infers a real recording when source is an AI stem.
No reconstruction or sample match is marked complete without independent recordings.
"""
import csv, hashlib, json, math, re, subprocess, sys, zipfile
from pathlib import Path
import numpy as np
from scipy.signal import stft, find_peaks

NAMES = ["Lead Vocals", "Backing Vocals", "Drums", "Bass", "Guitar", "Keyboard", "Percussion", "Strings", "Synth", "Other", "Brass", "Woodwinds"]
ROLES = ['vocal','vocal'] + ['instrument']*10
SRC_SAMPLE_RATE=48000
ANALYSIS_RATE=16000
F_MIN=35
F_MAX=1200

def sh256(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for buf in iter(lambda:f.read(1<<20),b''):h.update(buf)
    return h.hexdigest()

def ffprobe(p):
    result=subprocess.run(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels,channel_layout,bit_rate,duration','-of','json',str(p)],capture_output=True,text=True,check=True)
    streams=json.loads(result.stdout).get('streams') or []
    if not streams:raise ValueError('missing audio stream: '+str(p))
    return streams[0]

def decode(p):
    command=['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-i',str(p),'-vn','-ar',str(ANALYSIS_RATE),'-ac','2','-f','f32le','-acodec','pcm_f32le','pipe:1']
    out=subprocess.run(command,capture_output=True,check=True).stdout
    if len(out)%8:raise ValueError('invalid float32 stereo decode')
    audio=np.frombuffer(out,dtype='<f4').reshape(-1,2).copy()
    if not np.isfinite(audio).all():raise ValueError('non-finite samples')
    return audio

def db(x): return round(20*np.log10(max(float(x),1.e-12)),3)
def pct(x):return round(100*float(x),2)
def median(x):return round(float(np.median(x)),5)

def detect_fundamental(x,fs):
    # Conservative F0 candidate from the median of autocorrelation peaks.
    # Not a vocal identity/authorship detector; no high-confidence label implied.
    lag_min=int(fs/F_MAX);lag_max=int(fs/F_MIN)
    hop=int(0.40*fs);nframe=int(0.20*fs)
    values=[]
    for offset in range(0,len(x)-nframe,hop):
        frame=x[offset:offset+nframe].astype(np.float64)
        rms=np.sqrt(np.mean(frame*frame))
        if rms<.007:continue
        frame-=np.mean(frame)
        frame*=np.hanning(len(frame))
        spec=np.fft.rfft(frame,n=2**int(math.ceil(math.log2(2*nframe))))
        ac=np.fft.irfft(spec*np.conj(spec))[:lag_max+1]
        if ac[0]<=0:continue
        valid=ac[lag_min:lag_max+1]
        if not len(valid):continue
        lag=int(np.argmax(valid))+lag_min
        confidence=float(ac[lag]/ac[0])
        hz=fs/lag
        if confidence>=.50 and F_MIN<=hz<=F_MAX:
            values.append(hz)
    return {'method':'frame_autocorrelation_candidates','min_hz':F_MIN,'max_hz':F_MAX,
        'min_autocorrelation_ratio':.5,'accepted_frames':len(values),
        'median_hz':median(values) if values else None,
        'confidence_note':'Pitch candidates require manual verification; polyphonic/processed audio can cause octave errors'}

def inspect_stem(p,stem_id,analysis_dir):
    stream=ffprobe(p)
    audio=decode(p)
    seconds=len(audio)/ANALYSIS_RATE
    left,right=audio[:,0].astype(np.float64),audio[:,1].astype(np.float64)
    mid=.5*(left+right);side=.5*(left-right)
    correlation=float(np.corrcoef(left,right)[0,1]) if np.std(left)>1.e-10 and np.std(right)>1.e-10 else 0
    rms_channels=np.sqrt(np.mean(audio.astype(np.float64)**2,axis=0))
    mid_rms=np.sqrt(np.mean(mid**2));side_rms=np.sqrt(np.mean(side**2))
    clipped=np.abs(audio)>=.999
    mono_fold_loss=db(mid_rms/(np.sqrt(np.mean((rms_channels)**2))+.00000001))
    rms_window=ANALYSIS_RATE//10
    trimmed=audio[:len(audio)//rms_window*rms_window]
    frame_mid=trimmed.mean(axis=1).reshape(-1,rms_window)
    frame_rms=np.sqrt(np.mean(frame_mid.astype(np.float64)**2,axis=1))
    max_rms=float(np.max(frame_rms))
    audible=np.where(frame_rms>=max(.001,max_rms*.03))[0]
    first_active=float(audible[0]*.1) if len(audible) else None
    last_active=float((audible[-1]+1)*.1) if len(audible) else None
    # STFT microanalysis: detailed output every ~32 ms.
    freq,time,spectrum=stft(mid.astype(np.float32),fs=ANALYSIS_RATE,
        window='hann',nperseg=2048,noverlap=1536,boundary=None,padded=False)
    mag=np.abs(spectrum)
    power=np.square(mag,dtype=np.float64)
    freqs=freq.astype(float)
    total_power=np.sum(power,axis=0)+1.e-20
    centroid=np.sum(freqs[:,None]*power,axis=0)/total_power
    whitened=np.exp(np.mean(np.log(power+1.e-12),axis=0))/(np.mean(power,axis=0)+1.e-12)
    rollidx=np.argmax(np.cumsum(power,axis=0)>=.85*total_power,axis=0)
    rolloff=freq[rollidx]
    flux=np.zeros(len(time),dtype=float)
    if mag.shape[1]>1:
        flux[1:]=np.mean(np.maximum(0,mag[:,1:]-mag[:,:-1]),axis=0)
    prom=max(1.e-8,float(np.median(flux)*2),float(np.percentile(flux,85)*0.25))
    peaks,_=find_peaks(flux,prominence=prom,distance=3)
    if len(peaks)>400:peaks=peaks[np.argsort(flux[peaks])[-400:]]
    peaks=np.sort(peaks)
    event_rows=[{'at_sec':round(float(time[i]),4),'flux':round(float(flux[i]),7),
                 'centroid_hz':round(float(centroid[i]),2)} for i in peaks]
    with (analysis_dir/f'{stem_id:02d}_onsets.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['at_sec','flux','centroid_hz']);w.writeheader();w.writerows(event_rows)
    # Aggregate microframes in 250ms time bins into parsable feature CSV.
    binidx=(time*4).astype(int)
    with (analysis_dir/f'{stem_id:02d}_microframes_250ms.csv').open('w',newline='') as f:
        w=csv.writer(f);w.writerow(['time_bin_sec','spectral_centroid_hz','rolloff85_hz','flatness','positive_spectral_flux','low_20_160_power','lowmid_160_800_power','mid_800_4000_power','high_4000_8000_power'])
        masks=[(freq>=lo)&(freq<hi) for lo,hi in [(20,160),(160,800),(800,4000),(4000,8000)]]
        band_power=np.vstack([np.sum(power[m,:],axis=0) for m in masks])
        for idx in np.unique(binidx):
            inds=np.flatnonzero(binidx==idx)
            bands=band_power[:,inds].sum(axis=1)
            w.writerow([round(idx/4,2),round(float(np.mean(centroid[inds])),2),round(float(np.mean(rolloff[inds])),2),round(float(np.mean(whitened[inds])),5),round(float(np.mean(flux[inds])),7)]+[round(float(b),8) for b in bands])
    bands={(f'{lo}-{hi}Hz'):round(float(power[(freq>=lo)&(freq<hi),:].sum()/total_power.sum()),5) for lo,hi in [(20,160),(160,800),(800,4000),(4000,8000)]}
    pitch=detect_fundamental(mid,ANALYSIS_RATE) if stem_id in [0,1,3,4,5,7,8,10,11] else {'status':'not_estimated_for_non_tonal_or_mixed_stem'}
    out={
        'stem_id':stem_id,'name':p.name,'role':ROLES[stem_id],'source_sha256':sh256(p),
        'container_codec':stream.get('codec_name'),'source_sample_rate_hz':int(stream['sample_rate']),
        'source_channels':int(stream['channels']),
        'exact_decoded_analysis_frames':len(audio),
        'decoded_analysis_sample_rate_hz':ANALYSIS_RATE,
        'decoded_seconds':round(seconds,5),'peak_abs':round(float(np.max(np.abs(audio))),5),
        'decoded_samples_at_or_above_fullscale':int(np.count_nonzero(clipped)),
        'rms_dbfs':round(db(np.sqrt(np.mean(np.square(audio,dtype=np.float64)))),2),
        'left_rms_dbfs':db(rms_channels[0]),'right_rms_dbfs':db(rms_channels[1]),
        'lr_correlation':round(correlation,5),
        'mid_rms_dbfs':db(mid_rms),'side_rms_dbfs':db(side_rms),
        'side_to_mid_db':db(side_rms/(mid_rms+1e-12)),
        'mono_fold_loss_db_relative_channel_average':mono_fold_loss,
        'first_active_sec':first_active,'last_active_sec':last_active,
        'activity_percent':pct(np.mean(frame_rms>=max(.001,max_rms*.03))),
        'spectral_band_power_fractions':bands,'spectral_centroid_median_hz':round(float(np.median(centroid)),2),
        'rolloff85_median_hz':round(float(np.median(rolloff)),2),
        'spectral_flatness_median':round(float(np.median(whitened)),5),
        'number_of_retained_high_flux_onsets':len(event_rows),'retention_cap':400,'onset_count_not_exact_notes':True,
        'pitch_candidate_estimate':pitch,
        'analysis_method':'FFmpeg 16kHz float-stereo full decode + 2048-point STFT 512 hop, bandpower, autocorrelation candidate pitch',
        'independent_reconstruction':False,'sample_verified':False,'provider_detection_result':None
    }
    (analysis_dir/f'{stem_id:02d}_summary.json').write_text(json.dumps(out,indent=2)+'\n')
    return out

def main(path,out):
    out.mkdir(parents=True,exist_ok=True)
    src=out/'source';src.mkdir(exist_ok=True)
    analysis=out/'analysis';analysis.mkdir(exist_ok=True)
    names=[]
    with zipfile.ZipFile(path) as z:
        safe=z.infolist()
        if len(safe)!=12 or sum(x.file_size for x in safe)>150_000_000:raise ValueError('unexpected ZIP size/count')
        for x in safe:
            if not re.fullmatch(r'(?:[0-9]|10|11) (?:Lead Vocals|Backing Vocals|Drums|Bass|Guitar|Keyboard|Percussion|Strings|Synth|Other|Brass|Woodwinds)\.mp3',x.filename):raise ValueError('unsafe/unexpected file: '+x.filename)
            num=int(x.filename.split(' ',1)[0]);
            if NAMES[num] not in x.filename: raise ValueError('stem naming mismatch')
            with z.open(x.filename) as source, (src/x.filename).open('wb') as target:
                import shutil
                shutil.copyfileobj(source,target,1<<20)
            names.append((num,src/x.filename))
    if sorted(n for n,_ in names)!=list(range(12)):raise ValueError('missing or duplicate stem indexes')
    reports=[]
    for n,p in sorted(names):
        existing=analysis/f'{n:02d}_summary.json'
        if existing.exists():
            prior=json.loads(existing.read_text())
            if prior['source_sha256']==sh256(p):
                print('VERIFIED PREVIOUS',n,p.name,flush=True)
                reports.append(prior)
                continue
        print('ANALYZE',n,p.name,flush=True)
        reports.append(inspect_stem(p,n,analysis))
    durations=[x['decoded_seconds'] for x in reports]
    same_length=max(durations)-min(durations)<.004
    manifest={'song':'Interlude x Detuned Fragments (Mashup)',
      'source_archive':path.name,'source_archive_sha256':sh256(path),
      'date_utc':'2026-11-27','original_stems_count':len(reports),
      'original_vocal_stems_count':2,'original_instrument_stems_count':10,
      'all_mp3_source_sha256_verified':True,
      'analysis_sample_rate_hz':ANALYSIS_RATE,
      'source_format_synchronized':same_length,
      'duration_range_sec':[min(durations),max(durations)],
      'stems':reports,
      'not_performed':['real sample sound matching','independent reconstruction','real lead/backing vocal recording','ACRCloud API scan','95_percent_similarity_test','final master rendering']}
    (out/'INTERLUDE_SOURCE_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
    reqs=[]
    for item in reports:
        if item['role']=='vocal':continue
        reqs.append({'stem':item['name'],'recording_type_needed':item['name'].split(' ',1)[1].removesuffix('.mp3'),
        'source_library_search':'pending independent recorded-sample audio access',
        'sample_rights':'not yet verified','license':'unknown','best_candidate':None,
        '95_percent_fidelity':'not tested','independent_source_recording':False,
        'note':'source generated stem cannot itself prove what Suno sample existed; recorded equivalents required'})
    (out/'UNRESOLVED_SAMPLE_REQUIREMENTS.json').write_text(json.dumps(reqs,indent=2)+'\n')
    print('COMPLETE: source and microanalysis; independent reconstruction NOT performed')
    return manifest

if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('usage: python analyze_interlude.py <zip> <workspace>')
    main(Path(sys.argv[1]),Path(sys.argv[2]))