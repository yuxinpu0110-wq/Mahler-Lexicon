"""Recover displayed score regions from the user supplied score video, using SIFT.
No notation OCR, no copied video frames in the app. Matched regions point to our PDF.
"""
import subprocess,json
from pathlib import Path
import cv2,numpy as np
root=Path('tmp/sync');root.joinpath('slides').mkdir(exist_ok=True)
sift=cv2.SIFT_create(nfeatures=5000)
refs=[];desc=[];owners=[]
for page in range(80,128):
 im=cv2.imread(f'public/assets/scores/third/page-{page}.webp',cv2.IMREAD_GRAYSCALE)
 im=cv2.resize(im,(911,1232));kp,de=sift.detectAndCompute(im,None);refs.append((im,kp,de));desc.append(de);owners.extend([page]*len(de))
all_desc=np.concatenate(desc);owners=np.array(owners);matcher=cv2.FlannBasedMatcher(dict(algorithm=1,trees=5),dict(checks=64));matcher.add([all_desc]);matcher.train()
# Keep the first fully stable frame after each change.
proc=subprocess.Popen(['ffmpeg','-v','error','-ss','2172','-i','tmp/sync/score-video.mp4','-t','650','-vf','fps=4,scale=1280:720','-pix_fmt','gray','-f','rawvideo','-'],stdout=subprocess.PIPE)
segments=[];prev=None;idx=0;frames=[]
while True:
 raw=proc.stdout.read(1280*720)
 if len(raw)!=1280*720:break
 im=np.frombuffer(raw,np.uint8).reshape(720,1280)
 if prev is None or np.mean(cv2.absdiff(im,prev))>1:
  frames.append((idx/4,im.copy()));prev=im.copy()
 idx+=1
proc.wait();print('CANDIDATE SLIDES',len(frames),flush=True)

def match_image(im):
 kp,de=sift.detectAndCompute(im,None)
 if de is None:return None
 votes={}
 for a,b in matcher.knnMatch(de,k=2):
  if a.distance<.72*b.distance:
   page=int(owners[a.trainIdx]);votes[page]=votes.get(page,0)+1
 best=None
 h,w=im.shape
 for page in sorted(votes,key=votes.get,reverse=True)[:5]:
  ref,rkp,rde=refs[page-80];good=[a for a,b in cv2.BFMatcher().knnMatch(de,rde,k=2) if a.distance<.72*b.distance]
  if len(good)<12:continue
  src=np.float32([kp[a.queryIdx].pt for a in good]);dst=np.float32([rkp[a.trainIdx].pt for a in good]);H,mask=cv2.findHomography(src,dst,cv2.RANSAC,4)
  if H is None:continue
  score=int(mask.sum());corners=cv2.perspectiveTransform(np.float32([[[0,0],[w,0],[w,h],[0,h]]]),H)[0]
  box=[float(corners[:,0].min()/911),float(corners[:,1].min()/1232),float(corners[:,0].max()/911),float(corners[:,1].max()/1232)]
  if box[2]-box[0]<.3 or box[3]-box[1]<.2:continue
  if best is None or score>best['inliers']:best={'page':page,'inliers':score,'bbox':box}
 return best if best and best['inliers']>=20 else None

for t,im in frames:
 full=match_image(im)
 if full and full['bbox'][2]-full['bbox'][0]<1.7:
  pages=[full]
 else:
  pages=[p for crop in [im[:,:640],im[:,640:]] if (p:=match_image(crop))]
  if len(pages)==2 and pages[0]['page']==pages[1]['page']:pages=[max(pages,key=lambda x:x['inliers'])]
  pages.sort(key=lambda p:p['page'])
 if not pages:raise RuntimeError(f'Unmatched slide {t}')
 segments.append({'start':t,'pages':pages});cv2.imwrite(str(root/'slides'/f'spread-{t}.jpg'),im);print(t,[(p['page'],p['inliers']) for p in pages],flush=True)
root.joinpath('video-spreads.json').write_text(json.dumps(segments,indent=2))
