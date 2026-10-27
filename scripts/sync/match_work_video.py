"""Match full score-video page turns to our registered scan with SIFT/RANSAC."""
from pathlib import Path
import os,json,subprocess,hashlib
import cv2,numpy as np

ROOT=Path(__file__).resolve().parents[2];os.chdir(ROOT)
cache=Path('tmp/sync/work-slides');cache.mkdir(exist_ok=True)
sift=cv2.SIFT_create(nfeatures=2200)
refs={};descriptors=[];owners=[]
for page in range(3,210):
 image=cv2.imread(f'tmp/sync/work-pages/page-{page}.png',0)
 kp,de=sift.detectAndCompute(image,None);refs[page]=(kp,de);descriptors.append(de);owners.extend([page]*len(de))
print('Reference descriptors',sum(len(d) for d in descriptors),flush=True)
owners=np.asarray(owners)
matcher=cv2.FlannBasedMatcher(dict(algorithm=1,trees=4),dict(checks=48));matcher.add([np.concatenate(descriptors)]);matcher.train()
last_page=None
def match(image):
 kp,de=sift.detectAndCompute(image,None)
 if de is None or len(de)<20:return None
 votes={}
 for a,b in matcher.knnMatch(de,k=2):
  if a.distance<.74*b.distance:
   page=int(owners[a.trainIdx])
   if (last_page is None and page>6) or (last_page is not None and not last_page-1<=page<=last_page+6):continue
   votes[page]=votes.get(page,0)+1
 best=None;h,w=image.shape
 for page in sorted(votes,key=votes.get,reverse=True)[:4]:
  rkp,rde=refs[page];good=[a for a,b in cv2.BFMatcher().knnMatch(de,rde,k=2) if a.distance<.73*b.distance]
  if len(good)<25:continue
  src=np.float32([kp[a.queryIdx].pt for a in good]);dst=np.float32([rkp[a.trainIdx].pt for a in good]);H,mask=cv2.findHomography(src,dst,cv2.RANSAC,4)
  if H is None:continue
  inliers=int(mask.sum());corners=cv2.perspectiveTransform(np.float32([[[0,0],[w,0],[w,h],[0,h]]]),H)[0]
  box=[float(corners[:,0].min()/911),float(corners[:,1].min()/1232),float(corners[:,0].max()/911),float(corners[:,1].max()/1232)]
  if box[2]-box[0]<.3 or box[3]-box[1]<.15:continue
  if best is None or inliers>best['inliers']:best={'page':page,'inliers':inliers,'bbox':box}
 return best if best and best['inliers']>=30 else None

proc=subprocess.Popen(['ffmpeg','-nostdin','-v','error','-i','tmp/sync/score-video.mp4','-vf','fps=2,scale=1280:720','-pix_fmt','gray','-f','rawvideo','-'],stdout=subprocess.PIPE)
segments=[];prev=None;index=0;identity=None;unmatched=[]
while True:
 raw=proc.stdout.read(1280*720)
 if len(raw)!=1280*720:break
 image=np.frombuffer(raw,np.uint8).reshape(720,1280)
 if prev is None or np.mean(cv2.absdiff(image,prev))>1:
  prev=image.copy();full=match(image)
  if full and full['bbox'][2]-full['bbox'][0]<1.7:pages=[full]
  else:pages=[p for crop in [image[:,:640],image[:,640:]] if (p:=match(crop))]
  if len(pages)==2 and pages[0]['page']==pages[1]['page']:pages=[max(pages,key=lambda p:p['inliers'])]
  pages.sort(key=lambda p:p['page'])
  if pages:
   def kind(p):
    y0,y1=p['bbox'][1],p['bbox'][3]
    return 'full' if y1-y0>.7 else 'upper' if (y0+y1)/2<.5 else 'lower'
   new_identity=tuple((p['page'],kind(p)) for p in pages)
   if new_identity!=identity:
    t=index/2;segments.append({'start':t,'pages':pages});identity=new_identity;last_page=min(p['page'] for p in pages)
    cv2.imwrite(str(cache/f'view-{t}.jpg'),image);print(t,[(p['page'],p['inliers'],kind(p)) for p in pages],flush=True)
  else:unmatched.append(index/2)
 index+=1
proc.wait()
Path('tmp/sync/work-video-views.json').write_text(json.dumps({'views':segments,'unmatchedCandidates':unmatched,'frameStep':.5,'duration':index/2,'inputs':{'referenceVideoSHA256':hashlib.sha256(Path('tmp/sync/score-video.mp4').read_bytes()).hexdigest(),'scoreFingerprint':json.loads(Path('tmp/sync/work-score-ranges.json').read_text())['scoreFingerprint']}},indent=2),encoding='utf-8')
print('Finished',len(segments),'views; unmatched candidates',len(unmatched),flush=True)
