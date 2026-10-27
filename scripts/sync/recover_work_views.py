"""Recover low-feature page turns using local SIFT matching; cache only."""
from pathlib import Path
import os,json,subprocess
import cv2,numpy as np
ROOT=Path(__file__).resolve().parents[2];os.chdir(ROOT)
path=Path('tmp/sync/work-video-views.json');data=json.loads(path.read_text())
sift=cv2.SIFT_create(nfeatures=7000,contrastThreshold=.015)
refs={}
def match(image,page):
 if page not in refs:
  refs[page]=sift.detectAndCompute(cv2.imread(f'tmp/sync/work-pages/page-{page}.png',0),None)
 kp,de=sift.detectAndCompute(image,None);rk,rd=refs[page]
 if de is None:return None
 good=[a for a,b in cv2.BFMatcher().knnMatch(de,rd,k=2) if a.distance<.77*b.distance]
 if len(good)<15:return None
 H,mask=cv2.findHomography(np.float32([kp[a.queryIdx].pt for a in good]),np.float32([rk[a.trainIdx].pt for a in good]),cv2.RANSAC,4)
 if H is None or mask.sum()<20:return None
 h,w=image.shape;c=cv2.perspectiveTransform(np.float32([[[0,0],[w,0],[w,h],[0,h]]]),H)[0]
 box=[float(c[:,0].min()/911),float(c[:,1].min()/1232),float(c[:,0].max()/911),float(c[:,1].max()/1232)]
 if not .3<box[2]-box[0]<1.7 or not .15<box[3]-box[1]<1.8:return None
 return dict(page=page,inliers=int(mask.sum()),bbox=box)
for t in data['unmatchedCandidates']:
 if t<1 or t>=5369:continue
 prev=[v for v in data['views'] if v['start']<t][-1]
 following=next((v for v in data['views'] if v['start']>t),None)
 lo=max(p['page'] for p in prev['pages']);hi=min(p['page'] for p in following['pages']) if following else 210
 raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t+2),'-i','tmp/sync/score-video.mp4','-frames:v','1','-f','image2pipe','-vcodec','png','-'])
 im=cv2.imdecode(np.frombuffer(raw,np.uint8),0);pages=[]
 for crop in [im,im[:,:640],im[:,640:]]:
  matches=[m for page in range(max(3,lo),min(209,hi)+1) if (m:=match(crop,page))]
  if matches:pages.append(max(matches,key=lambda m:m['inliers']))
 unique={p['page']:p for p in sorted(pages,key=lambda p:p['inliers'])}
 if unique:
  view=dict(start=t,pages=sorted(unique.values(),key=lambda p:p['page']))
  data['views'].append(view);data['views'].sort(key=lambda v:v['start'])
  cv2.imwrite(f'tmp/sync/work-slides/view-{t}.jpg',im)
  print(t,[(p['page'],p['inliers']) for p in view['pages']],flush=True)
 else:print('UNMATCHED',t,lo,hi,flush=True)
Path('tmp/sync/work-video-views-recovered.json').write_text(json.dumps(data,indent=2))

