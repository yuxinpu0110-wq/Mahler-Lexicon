"""Create file-local estimated score maps from image matches and offline audio alignment."""
from pathlib import Path
import json,hashlib,numpy as np

def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
spreads=read('tmp/sync/video-spreads.json');warp=np.asarray(read('tmp/sync/nyp-time-map.json')['anchors']);catalog=read('content/real/catalog.json');parts=read('content/real/third-movement.json')['parts']
layout=read('content/real/score-layout.json')['pages']
time_map=read('tmp/sync/nyp-time-map.json')
assert time_map['inputs']['referenceAudioSHA256']==hashlib.sha256(Path('tmp/sync/score-audio.m4a').read_bytes()).hexdigest(), 'Reference audio changed; regenerate alignment'
assert time_map['inputs']['targetFingerprints']==[p['fingerprint'] for p in parts], 'Project audio changed; regenerate alignment'
regions=[]
for k,spread in enumerate(spreads):
 pages=[];suffix=[]
 for p in spread['pages']:
  y0=max(0,p['bbox'][1]);y1=min(1,p['bbox'][3]);kind='full'
  if y1-y0<.7:
   kind='upper' if (y0+y1)/2<.5 else 'lower'
   systems=layout[str(p['page'])]['systems']
   if len(systems)==2:
    a,b=systems[0 if kind=='upper' else 1];y0=max(0,a-.045);y1=min(1,b+.008)
  else:y0,y1=0,1
  pages.append({'page':p['page'],'url':f'/assets/scores/third/page-{p["page"]}.webp','box':[0,round(y0,5),1,round(y1-y0,5)]});suffix.append(f'p{p["page"]:03}-{kind}')
 regions.append({'id':'ue-iii-'+'-'.join(suffix),'pages':pages,'sourceStart':spread['start'],'sourceEnd':spreads[k+1]['start'] if k+1<len(spreads) else 650})
tracks=[]
for t in parts:
 intervals=[];offset=t['movementOffset'];end=offset+t['duration']
 for r in regions:
  a=0 if r['sourceStart']==0 else float(np.interp(r['sourceStart'],warp[:,0],warp[:,1]));b=sum(p['duration'] for p in parts) if r['sourceEnd']==650 else float(np.interp(r['sourceEnd'],warp[:,0],warp[:,1]))
  start=max(a,offset)-offset;stop=min(b,end)-offset
  if stop>start:intervals.append({'regionId':r['id'],'start':round(start,3),'end':min(t['duration'],round(stop,3)),'status':'needs_review'})
 tracks.append({'id':t['trackId'],'fingerprint':t['fingerprint'],'duration':t['duration'],'intervals':intervals})
d={'version':1,'movement':3,'edition':catalog['edition'],'scoreFingerprint':'sha256:'+hashlib.sha256(Path('tmp/pdfs/mahler2-hofmeister-ue.pdf').read_bytes()).hexdigest(),'granularity':'page_system','status':'needs_review','method':'Reference score-video cuts at 4 fps; SIFT/RANSAC page matching; Sync Toolbox MrMsDTW audio-audio chroma 10Hz to project NYP recording; cross-track intervals split into file-local seconds. No note OCR.','sources':[{'title':'symphony7526：Mahler Symphony No. 2 with Score / Bernstein LSO','url':'https://www.youtube.com/watch?v=C-1d0OY6o0k','usage':'用户提供的研究参考；复用第三乐章52次视图起点，不打包视频画面或参考音轨。参考视频36:12–47:02。'},{'title':'IMSLP #415748 历史UE重印扫描','url':'https://imslp.org/wiki/Symphony_No.2_(Mahler,_Gustav)','usage':'显示项目已有原谱页80–127，图像匹配定位，不声称完成音符识别。'},{'title':'Sync Toolbox / MIT','url':'https://github.com/groupmm/synctoolbox','usage':'本地离线生成估计时间映射；不是人工审阅或逐音定位。'}],'regions':regions,'tracks':tracks,'evidence':{'referenceVideoSha256':hashlib.sha256(Path('tmp/sync/score-video.mp4').read_bytes()).hexdigest(),'referenceAudioSha256':hashlib.sha256(Path('tmp/sync/score-audio.m4a').read_bytes()).hexdigest(),'pageMatchInliers':[{'sourceTime':s['start'],'pages':[{'page':p['page'],'inliers':p['inliers']} for p in s['pages']]} for s in spreads],'frameResolutionSeconds':.25,'humanAuditionVerified':False}}
Path('content/real/score-sync.json').write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8');print('52 source views / 48 score pages / 3 file-local tracks generated')
