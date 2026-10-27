"""Whole-work audio alignment, with source and target fingerprints in the cache."""
from pathlib import Path
import os,json,hashlib
import numpy as np
from align import decode,features,pair_map

ROOT=Path(__file__).resolve().parents[2];os.chdir(ROOT)
manifest=json.loads(Path('.local/recording.json').read_text(encoding='utf-8-sig'))
tracks=manifest['continuousTracks']
reference=Path('tmp/sync/score-audio.m4a')
print('Extracting reference chroma',flush=True)
ref=features(decode(reference),'work-reference')
print('Extracting target chroma',flush=True)
target=features(np.concatenate([decode(t['file']) for t in tracks]),'work-target')
print('Aligning full work',ref.shape,target.shape,flush=True)
result=pair_map(target,ref,'whole-work')
result['inputs']={'referenceAudioSHA256':hashlib.sha256(reference.read_bytes()).hexdigest(),'targetFingerprints':[t['fingerprint'] for t in tracks]}
result['targetMovements']=[{'movement':t['movement'],'duration':t['duration']} for t in tracks]
Path('tmp/sync/work-time-map.json').write_text(json.dumps(result),encoding='utf-8')
w=np.asarray(result['anchors']);print('Similarity',result['meanCosine'],result['medianCosine'],flush=True)
print('Third-movement boundary cross-check',float(np.interp(2172,w[:,0],w[:,1])),float(np.interp(2822,w[:,0],w[:,1])),'expected',2220,2904.8266666667,flush=True)
