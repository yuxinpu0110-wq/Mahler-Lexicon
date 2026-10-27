from pathlib import Path
import json,cv2,numpy as np,os,hashlib
ROOT=Path(__file__).resolve().parents[2];os.chdir(ROOT)
assert hashlib.sha256(Path('tmp/pdfs/mahler2-hofmeister-ue.pdf').read_bytes()).hexdigest()=='e56f9fb7f1e6507483b8cee8d806e722d95d9be8a8c265adf509dcd0e7d5d3f6', 'Unexpected score scan'
docs=json.loads(Path('scripts/sync/work-box-spatial-anchors.json').read_text(encoding='utf-8'))
geo=json.loads(Path('scripts/sync/work-box-raster-systems.json').read_text(encoding='utf-8'))
pages={p['page']:p for p in geo};images={}
def groups(xs,gap=5):
 out=[]
 for x in xs:
  if not out or x-out[-1][-1]>gap:out.append([int(x)])
  else:out[-1].append(int(x))
 return out
def score_system(s):
 page=s['page'];p=pages[page]
 if page not in images:
  im=cv2.imread(f'tmp/sync/work-pages/page-{page}.png',0)
  assert im is not None and im.shape==(1232,911), f'Render the registered scan first: page {page}'
  im=cv2.warpAffine(im,cv2.getRotationMatrix2D((455.5,616),p['angle'],1),(911,1232),borderValue=255)
  ink=(im<160).astype('uint8');v=cv2.morphologyEx(cv2.dilate(ink,np.ones((1,3),np.uint8)),cv2.MORPH_OPEN,np.ones((23,1),np.uint8))
  images[page]=cv2.dilate(v,np.ones((1,9),np.uint8))
 y0,y1=s['y'];left,right=s['xs'][0],s['xs'][-1]
 score=images[page][y0:y1,:].sum(axis=0)/(y1-y0)
 # Find actual raster ridges, not an equal-width subdivision of the page.
 candidates=[]
 for g in groups(np.flatnonzero(score>=.16)):
  if g[-1]-g[0]>65:
   # Split a plateau only where the raster itself has a local valley.
   sub=[g]
  else:sub=[g]
  for points in sub:
   peak=max(score[points]);strong=[x for x in points if score[x]>=peak*.93]
   x=int(np.mean(strong))
   if left+24<x<right-20:candidates.append((x,float(peak)))
 return candidates
all_entries=[];reports=[]
for doc in docs:
 m=doc['movement'];systems=doc['systems'];reads=doc['readings']
 # The left page at reference 863s prints 278; 284 belongs to the right page.
 if m==1:
  next(r for r in reads if r['regionId']=='ue-1-view-031')['bar']=278
  next(r for r in reads if r['regionId']=='ue-1-view-044')['bar']=399
 if m==5:
  i=next(i for i,s in enumerate(systems)if s['page']==187 and s['system']==1)
  reads.append(dict(index=i,bar=490,regionId='ue-5-view-047',frame=4568))
 reads.sort(key=lambda r:r['index'])
 for ix,r in enumerate(reads):
  begin=r['index'];end=reads[ix+1]['index'] if ix+1<len(reads)else len(systems)
  first=r['bar'];last=reads[ix+1]['bar']-1 if ix+1<len(reads)else doc['barCount'];N=last-first+1
  block=systems[begin:end];options=[score_system(s)for s in block]
  # Short opening upbeat is displayed with the first numbered measure.
  if m in [2,4] and first==1 and options[0]:options[0]=options[0][1:]
  choices=sorted([(strength,si,x)for si,c in enumerate(options)for x,strength in c],reverse=True)
  needed=N-len(block);selected=choices[:max(0,needed)]
  good=needed>=0 and len(selected)==needed and (not selected or min(c[0]for c in selected)>=.2)
  positions=[]
  if good:
   for si,s in enumerate(block):
    xs=[s['xs'][0]]+sorted(x for _,j,x in selected if j==si)+[s['xs'][-1]]
    for x0,x1 in zip(xs,xs[1:]):positions.append((s,[x0,s['y'][0],x1-x0,s['y'][1]-s['y'][0]]))
   good=len(positions)==N and all(b[2]>=14 for _,b in positions)
  if not good:
   print('UNRESOLVED',m,first,last,'pages',[s['page']for s in block],'need',needed,'peaks',len(choices));continue
  old=sum(len(s['xs'])-1 for s in block)
  reports.append(dict(movement=m,fromBar=first,toBar=last,pages=sorted(set(s['page']for s in block)),referenceFrame=r['frame'],previousCount=old,candidateCount=sum(len(o)for o in options)+len(block),minimumStrength=round(min([c[0]for c in selected]or[1]),3)))
  for n,(s,b)in enumerate(positions,first):
   # Convert a conservative rectangle back to the original scan coordinates.
   inv=cv2.invertAffineTransform(cv2.getRotationMatrix2D((455.5,616),pages[s['page']]['angle'],1))
   x,y,w,h=b;corners=np.array([[x,y,1],[x+w,y,1],[x+w,y+h,1],[x,y+h,1]])@inv.T
   lo=np.maximum(corners.min(axis=0),[0,0]);hi=np.minimum(corners.max(axis=0),[911,1232]);box=[lo[0]/911,lo[1]/1232,(hi[0]-lo[0])/911,(hi[1]-lo[1])/1232]
   all_entries.append(dict(movement=m,measureId=f'ue-{m}-m{n:03}',number=n,page=s['page'],system=s['system'],box=[round(float(v),6)for v in box],status='needs_review',basis='raster_barline_candidates_with_local_numbered_view',includesPickup=m in [2,4] and n==1))
Path('tmp/sync/work-box-fit.json').write_text(json.dumps(dict(entries=all_entries,groups=reports),ensure_ascii=False,indent=2),encoding='utf-8')
assert len(all_entries)==1576, 'Incomplete spatial coverage; do not publish'
nav=json.loads(Path('content/real/work-measure-sync.json').read_text(encoding='utf-8'))
result=dict(version=1,edition=nav['movements'][0]['edition'],scoreFingerprint=nav['movements'][0]['scoreFingerprint'],status='needs_review',method='Deskewed scan vertical-ink candidates constrained by local numbered reference views. Not manually verified measure by measure. Opening upbeats in II/IV are included with bar 1. Spatial readings I/278 and I/399 correct left-page labels independently of estimated audio windows.',entries=all_entries)
Path('content/real/work-measure-boxes.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print('entries',len(all_entries),'expected',1576)
# Contact sheets: top of every affected system, with the selected boundaries.
from PIL import Image,ImageDraw
for m in [1,2,4,5]:
 keys=sorted(set((e['page'],e['system'])for e in all_entries if e['movement']==m))
 for chunk in range(0,len(keys),24):
  block=keys[chunk:chunk+24];sheet=Image.new('RGB',(1600,160*((len(block)+3)//4)),'#eee');d=ImageDraw.Draw(sheet)
  for j,(page,sys)in enumerate(block):
   es=[e for e in all_entries if e['movement']==m and e['page']==page and e['system']==sys];ys=min(e['box'][1]for e in es)*1232
   im=Image.open(f'tmp/sync/work-pages/page-{page}.png').convert('RGB');draw=ImageDraw.Draw(im)
   for e in es:
    x,y,w,h=e['box'];draw.rectangle((x*911,y*1232,(x+w)*911,(y+h)*1232),outline='red',width=2);draw.text((x*911+2,y*1232+2),str(e['number']),fill='blue')
   crop=im.crop((80,max(0,ys-14),890,min(1232,ys+210))).resize((400,112));x=j%4*400;y=j//4*160;sheet.paste(crop,(x,y+24));d.text((x+4,y+4),f'M{m} PDF{page} s{sys}: {es[0]["number"]}-{es[-1]["number"]}',fill='black')
  sheet.save(f'tmp/sync/box-audit-{m}-{chunk//24}.jpg')
