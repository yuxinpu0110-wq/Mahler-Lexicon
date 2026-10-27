"""Read printed system-start measure labels from the reference video, not the PDF.
OCR candidates are research evidence; build_work_measures validates/corrects them.
"""
from pathlib import Path
import os,json,subprocess,csv,io,sys
import cv2,numpy as np
ROOT=Path(__file__).resolve().parents[2];os.chdir(ROOT)
out=Path('tmp/sync/measure-labels');out.mkdir(exist_ok=True)
scores=json.loads(Path('content/real/work-score-sync.json').read_text(encoding='utf-8'))['movements']
layouts={p['page']:p for p in json.loads(Path('tmp/sync/work-bars-detected.json').read_text(encoding='utf-8'))}
sift=cv2.SIFT_create(nfeatures=7000,contrastThreshold=.015);refs={};results=[]
sample='--sample' in sys.argv
for doc in scores:
 for view in doc['evidence']['pageMatches']:
  time=view['start']
  if sample and time not in [4,1438.5,2822,4452,4672.5,5322]:continue
  path=out/f'frame-{time}.png'
  if not path.exists():
   subprocess.run(['ffmpeg','-v','error','-ss',str(time+2),'-i','tmp/sync/score-video.mp4','-frames:v','1','-y',str(path)],check=True)
  im=cv2.imread(str(path),0);ik,ide=sift.detectAndCompute(im,None)
  for p in view['pages']:
   page=p['page']
   if page not in refs:refs[page]=sift.detectAndCompute(cv2.imread(f'tmp/sync/work-pages/page-{page}.png',0),None)
   rk,rde=refs[page];good=[a for a,b in cv2.BFMatcher().knnMatch(ide,rde,k=2) if a.distance<.77*b.distance]
   if len(good)<12:continue
   H,mask=cv2.findHomography(np.float32([ik[m.queryIdx].pt for m in good]),np.float32([rk[m.trainIdx].pt for m in good]),cv2.RANSAC,4)
   if H is None or mask.sum()<15:continue
   rectified=cv2.warpPerspective(im,np.diag([4,4,1])@H,(3644,4928),borderValue=255)
   for index,system in enumerate(layouts[page]['systems']):
    x=system['staffBounds'][0];y=system['y'][0]
    point=cv2.perspectiveTransform(np.float32([[[x+50,y]]]),np.linalg.inv(H))[0,0]
    if not 5<point[0]<1270 or not 20<point[1]<700:continue
    crop=rectified[max(0,(y-32)*4):(y+15)*4,max(0,(x-10)*4):(x+125)*4]
    image_path=out/f'label-{page}-{index}-{time}.png';cv2.imwrite(str(image_path),crop)
    result=subprocess.run(['tesseract',str(image_path),'stdout','--tessdata-dir','tmp/sync','--psm','11','-c','tessedit_create_tsv=1'],capture_output=True,encoding='utf-8',check=True)
    words=[]
    for row in csv.DictReader(io.StringIO(result.stdout),delimiter='\t'):
     text=row.get('text','').strip('.,;:()[]|')
     if text.isdigit() and 0<int(text)<800:words.append(dict(number=int(text),x=int(row['left'])/4,y=int(row['top'])/4,confidence=float(row['conf'])))
    entry=dict(movement=doc['movement'],page=page,system=index,time=time,candidates=words)
    results.append(entry)
    print(page,index,time,[(w['number'],round(w['confidence'])) for w in words],flush=True)
    Path('tmp/sync/measure-labels'+('-sample' if sample else '')+'.json').write_text(json.dumps(results,indent=2),encoding='utf-8')

