"""Offline chroma alignment; only writes estimated time maps, never music analysis."""
import argparse,json,subprocess,hashlib
from pathlib import Path
import numpy as np
import librosa
from synctoolbox.dtw.mrmsdtw import sync_via_mrmsdtw

def decode(path,start=0,duration=None):
 args=['ffmpeg','-v','error','-ss',str(start),'-i',str(path)]
 if duration:args+=['-t',str(duration)]
 b=subprocess.run(args+['-ac','1','-ar','22050','-f','f32le','-'],capture_output=True,check=True).stdout
 return np.frombuffer(b,np.float32).copy()

def features(a,key):
 cache=Path('tmp/sync')/(key+'.npy')
 identity=hashlib.sha256(a.tobytes()+b'chroma_stft-22050-4096-2205-tuning0-v1').hexdigest();meta=cache.with_suffix('.sha256')
 if cache.exists() and meta.exists() and meta.read_text()==identity:return np.load(cache)
 c=librosa.feature.chroma_stft(y=a,sr=22050,n_fft=4096,hop_length=2205,tuning=0,norm=2)
 np.save(cache,c);meta.write_text(identity);return c

def align(a,b):
 return sync_via_mrmsdtw(f_chroma1=a,f_chroma2=b,input_feature_rate=10,threshold_rec=1000000,win_len_smooth=np.array([41,21,5,1]),downsamp_smooth=np.array([10,5,2,1]),verbose=False)

def pair_map(a,b,name):
 w=align(a,b);sim=np.sum(a[:,w[0].astype(int)]*b[:,w[1].astype(int)],axis=0)
 rows=[]
 for i in np.unique(w[1]):rows.append([float(i/10),float(np.median(w[0,w[1]==i])/10)])
 return {'method':'Sync Toolbox MrMsDTW / chroma_stft 10Hz','status':'needs_review','meanCosine':float(sim.mean()),'medianCosine':float(np.median(sim)),'anchors':rows}

if __name__=='__main__':
 old=features(decode('tmp/sync/score-audio.m4a',2172,650),'score-third')
 new=features(decode('tmp/sync/concert-audio.m4a',2268,658),'concert-third')
 result=pair_map(new,old,'lso-videos');Path('tmp/sync/video-time-map.json').write_text(json.dumps(result));print('VIDEO MATCH',result['meanCosine'],result['medianCosine'],flush=True)
 manifest=json.loads(Path('.local/recording.json').read_text(encoding='utf-8-sig'));tracks=[t for t in manifest['tracks'] if t['movement']==3]
 nyp=features(np.concatenate([decode(t['file']) for t in tracks]),'nyp-third')
 result=pair_map(nyp,old,'nyp-score-video');result['inputs']={'referenceAudioSHA256':hashlib.sha256(Path('tmp/sync/score-audio.m4a').read_bytes()).hexdigest(),'targetFingerprints':[t['fingerprint'] for t in tracks]};Path('tmp/sync/nyp-time-map.json').write_text(json.dumps(result));print('NYP MATCH',result['meanCosine'],result['medianCosine'],flush=True)
