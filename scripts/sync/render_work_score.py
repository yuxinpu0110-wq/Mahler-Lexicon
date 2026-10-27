"""Render the registered scan for the other four movements; no notation OCR."""
from pathlib import Path
import hashlib,json,os
import pymupdf
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
os.chdir(ROOT)
PDF=Path('tmp/pdfs/mahler2-hofmeister-ue.pdf')
EXPECTED='e56f9fb7f1e6507483b8cee8d806e722d95d9be8a8c265adf509dcd0e7d5d3f6'
assert hashlib.sha256(PDF.read_bytes()).hexdigest()==EXPECTED
# Movement headings visually checked in the registered scan: I at PDF page 3,
# II at 57, III at 80, IV at 128, V at 134; the final score page is 209.
RANGES={1:(3,56),2:(57,79),3:(80,127),4:(128,133),5:(134,209)}
cache=Path('tmp/sync/work-pages');cache.mkdir(parents=True,exist_ok=True)
output=Path('public/assets/scores/work');output.mkdir(parents=True,exist_ok=True)
doc=pymupdf.open(PDF)
for movement,(first,last) in RANGES.items():
 for number in range(first,last+1):
  page=doc[number-1]
  thumb=cache/f'page-{number}.png'
  if not thumb.exists():
   pix=page.get_pixmap(matrix=pymupdf.Matrix(2,2),colorspace=pymupdf.csGRAY)
   Image.frombytes('L',(pix.width,pix.height),pix.samples).resize((911,1232)).save(thumb)
  target=output/f'page-{number}.webp'
  if movement!=3 and not target.exists():
   pix=page.get_pixmap(matrix=pymupdf.Matrix(4,4),colorspace=pymupdf.csRGB)
   Image.frombytes('RGB',(pix.width,pix.height),pix.samples).resize((1822,2464)).save(target,quality=85,method=4)
 print('Rendered',movement,first,last,flush=True)
Path('tmp/sync/work-score-ranges.json').write_text(json.dumps({'scoreFingerprint':'sha256:'+EXPECTED,'ranges':RANGES,'basis':[911,1232],'method':'Movement headings and final page visually inspected in the registered PDF.'},indent=2),encoding='utf-8')
