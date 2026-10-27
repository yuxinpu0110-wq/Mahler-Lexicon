"""Render the registered historical scan for readable web score views; no OMR."""
from pathlib import Path
import hashlib
import pymupdf
from PIL import Image
source=Path('tmp/pdfs/mahler2-hofmeister-ue.pdf')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='e56f9fb7f1e6507483b8cee8d806e722d95d9be8a8c265adf509dcd0e7d5d3f6'
doc=pymupdf.open(source)
for page in range(80,128):
 pix=doc[page-1].get_pixmap(matrix=pymupdf.Matrix(4,4),colorspace=pymupdf.csRGB)
 Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(f'public/assets/scores/third/page-{page}.webp',quality=85,method=4)
print('Rendered 48 registered score pages at 1822 x 2464')
