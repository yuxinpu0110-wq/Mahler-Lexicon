"""Build navigational bar times from local, visually read video labels.

Does not create barline rectangles or infer notes. Only the numbered local
view is subdivided; its estimated times are migrated through the existing DTW.
"""
from pathlib import Path
import json,hashlib,os
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
os.chdir(ROOT)
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
anchors=read('scripts/sync/work-measure-anchors.json')
scores=read('content/real/work-score-sync.json')
manifest=read('content/real/continuous-recording.json')
warp=read('tmp/sync/work-time-map.json')
assert sha('tmp/sync/score-audio.m4a')==warp['inputs']['referenceAudioSHA256']
assert warp['inputs']['targetFingerprints']==[t['fingerprint'] for t in manifest['tracks']]
assert 'sha256:'+sha('tmp/pdfs/mahler2-hofmeister-ue.pdf')==scores['movements'][0]['scoreFingerprint']
video_hash=sha('tmp/sync/score-video.mp4')
w=np.asarray(warp['anchors'])
documents=[]
for a in anchors['movements']:
 m=a['movement'];score=next(d for d in scores['movements'] if d['movement']==m)
 assert video_hash==score['evidence']['referenceVideoSHA256']
 track=next(t for t in manifest['tracks'] if t['movement']==m)
 offset=sum(t['duration'] for t in manifest['tracks'] if t['movement']<m)
 assert len(a['firstBars'])==len(score['regions'])
 assert a['firstBars'][0]==1 and all(x<y for x,y in zip(a['firstBars'],a['firstBars'][1:]))
 measures=[];intervals=[];readings=[]
 for i,region in enumerate(score['regions']):
  first=a['firstBars'][i];end=a['firstBars'][i+1] if i+1<len(a['firstBars']) else a['barCount']+1
  span=score['tracks'][0]['intervals'][i]
  assert span['regionId']==region['id']
  src=np.linspace(region['sourceStart'],region['sourceEnd'],end-first+1)
  times=np.clip(np.interp(src,w[:,0],w[:,1])-offset,span['start'],span['end'])
  times[0]=span['start'];times[-1]=span['end']
  # DTW may hold at a pause or movement entrance. Mark a local window-only
  # fallback explicitly; never extend this estimate to the whole movement.
  timing='reference_subdivision_then_dtw'
  if not np.all(np.diff(times)>.00001):
   times=np.linspace(span['start'],span['end'],end-first+1)
   timing='local_view_subdivision_dtw_plateau'
   print('Local view fallback:',m,region['id'],flush=True)
  readings.append(dict(regionId=region['id'],firstBar=first,lastBar=end-1,
      referenceFrameSeconds=region['sourceStart']+2,pages=[p['page'] for p in region['pages']],
      timing=timing,basis='Small printed bar label in the reference video, visually inspected; timing within this view remains estimated.'))
  for j,n in enumerate(range(first,end)):
   identity=f'ue-{m}-m{n:03}'
   measures.append(dict(id=identity,number=n,regionId=region['id'],sourceStart=round(float(src[j]),6),sourceEnd=round(float(src[j+1]),6),status='needs_review'))
   interval_end=track['duration'] if i==len(score['regions'])-1 and n==a['barCount'] else round(float(times[j+1]),6)
   intervals.append(dict(measureId=identity,start=round(float(times[j]),6),end=interval_end,status='needs_review'))
 documents.append(dict(version=1,movement=m,edition=score['edition'],scoreFingerprint=score['scoreFingerprint'],barCount=a['barCount'],granularity='estimated_measure_navigation',status='needs_review',method=anchors['method']+' Uniform subdivision inside each numbered video view, followed by the fingerprint-bound reference-to-project DTW. Full matched page/system shown; no claimed individual measure rectangle.',sources=score['sources'],readings=readings,notes=a['notes'],measures=measures,tracks=[dict(id=track['id'],fingerprint=track['fingerprint'],duration=track['duration'],intervals=intervals)],evidence=dict(referenceVideoSHA256=video_hash,referenceAudioSHA256=warp['inputs']['referenceAudioSHA256'],anchorFile='scripts/sync/work-measure-anchors.json',humanAuditionVerified=False)))
 print(f'Movement {m}: {len(measures)} estimated bar positions from {len(readings)} locally numbered views',flush=True)
Path('content/real/work-measure-sync.json').write_text(json.dumps(dict(version=1,movements=documents),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
