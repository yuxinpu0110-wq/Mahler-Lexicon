"""Build remaining-movement page/system maps; never invent bar numbers."""
from pathlib import Path
import os,json,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[2];os.chdir(ROOT)
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
video=read('tmp/sync/work-video-views-recovered.json');warp=read('tmp/sync/work-time-map.json')
manifest=read('content/real/continuous-recording.json');catalog=read('content/real/catalog.json')
assert warp['inputs']['referenceAudioSHA256']==sha('tmp/sync/score-audio.m4a')
assert warp['inputs']['targetFingerprints']==[t['fingerprint'] for t in manifest['tracks']]
score=read('tmp/sync/work-score-ranges.json');scorehash='sha256:'+sha('tmp/pdfs/mahler2-hofmeister-ue.pdf')
assert scorehash==score['scoreFingerprint'], 'Registered score changed; render again'
assert video['inputs']['referenceVideoSHA256']==sha('tmp/sync/score-video.mp4'), 'Reference video changed; match pages again'
assert video['inputs']['scoreFingerprint']==scorehash, 'Page matches belong to another score'
views={v['start']:v for v in video['views']}
corrections=read('scripts/sync/work-view-corrections.json')
for v in corrections['views']:views[v['start']]=v
views=sorted(views.values(),key=lambda v:v['start'])
w=np.asarray(warp['anchors']);offset=0;documents=[]
sources=read('content/real/score-sync.json')['sources']
sources[0]['usage']='用户提供的整部跟谱视频作为离线翻页与声音对齐参考；不打包视频画面或参考音轨。'
sources[1]['usage']='使用同一历史UE重印扫描的原谱图像；页码为PDF页序，不把图像识别当作音符转录。'
for track in manifest['tracks']:
 movement=track['movement'];duration=track['duration'];a=offset;b=offset+duration;offset=b
 if movement==3:continue
 lo,hi=score['ranges'][str(movement)]
 relevant=[v for v in views if any(lo<=p['page']<=hi for p in v['pages'])]
 regions=[];intervals=[]
 for index,v in enumerate(relevant):
  start=0 if index==0 else float(np.interp(v['start'],w[:,0],w[:,1]))-a
  end=duration if index+1==len(relevant) else float(np.interp(relevant[index+1]['start'],w[:,0],w[:,1]))-a
  start=max(0,min(duration,start));end=max(0,min(duration,end))
  if end<=start:raise ValueError((movement,v['start'],start,end))
  pages=[]
  for p in v['pages']:
   if not lo<=p['page']<=hi:continue
   y0,y1=p['bbox'][1],p['bbox'][3]
   if y1-y0>=.7:y0,y1=0,1
   else:y0,y1=max(0,y0),min(1,y1)
   pages.append(dict(page=p['page'],url=f'/assets/scores/work/page-{p["page"]}.webp',box=[0,round(y0,5),1,round(y1-y0,5)]))
  identity=f'ue-{movement}-view-{index+1:03}'
  regions.append(dict(id=identity,pages=pages,sourceStart=v['start'],sourceEnd=relevant[index+1]['start'] if index+1<len(relevant) else max(v['start']+.001,float(np.interp(b,w[:,1],w[:,0])))))
  intervals.append(dict(regionId=identity,start=round(start,6),end=round(end,6) if end<duration else duration,status='needs_review'))
 assert set(range(lo,hi+1))=={p['page']for r in regions for p in r['pages']},(movement,'missing page')
 document=dict(version=1,movement=movement,edition=catalog['edition'],scoreFingerprint=scorehash,granularity='page_system',status='needs_review',method='Offline full-work 10Hz chroma MrMsDTW between reference and project recording; SIFT/RANSAC page-turn recognition at 2 fps, with recorded visual corrections. Continuous-file-local seconds. Page/system follow only; no generated measure numbering.',sources=sources,regions=regions,tracks=[dict(id=track['id'],fingerprint=track['fingerprint'],duration=duration,intervals=intervals)],evidence=dict(referenceVideoSHA256=sha('tmp/sync/score-video.mp4'),referenceAudioSHA256=warp['inputs']['referenceAudioSHA256'],targetFingerprints=warp['inputs']['targetFingerprints'],meanCosine=warp['meanCosine'],medianCosine=warp['medianCosine'],frameResolutionSeconds=.5,humanAuditionVerified=False,visualCorrections=[v for v in corrections['views'] if any(lo<=p['page']<=hi for p in v['pages'])],pageMatches=relevant))
 documents.append(document)
 print('Movement',movement,'pages',lo,hi,'views',len(regions),'duration',duration,flush=True)
Path('content/real/work-score-sync.json').write_text(json.dumps(dict(version=1,movements=documents),ensure_ascii=False,indent=2),encoding='utf-8')
