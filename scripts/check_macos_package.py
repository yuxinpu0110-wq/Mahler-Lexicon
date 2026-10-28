"""Archive/architecture checks only; this does not claim native Mac execution."""
from pathlib import Path
import hashlib,json,re,stat,struct,zipfile

ROOT=Path(__file__).resolve().parents[1];version=json.loads((ROOT/'package.json').read_text())['version']
for arch,cpu in [('arm64',0x0100000c),('x64',0x01000007)]:
 name=f'Mahler-Lexicon-v{version}-macos-{arch}';archive=ROOT/'release'/(name+'.zip')
 h=hashlib.sha256()
 with archive.open('rb') as stream:
  for data in iter(lambda:stream.read(1024*1024),b''):h.update(data)
 assert h.hexdigest()==archive.with_suffix('.zip.sha256').read_text().split()[0]
 with zipfile.ZipFile(archive) as z:
  manifest=json.loads(z.read(name+'/manifest.json'))
  assert manifest['platform']=='macos-'+arch and manifest['nativeTested'] is False
  actual=set(i.filename for i in z.infolist() if not i.is_dir())
  expected={name+'/'+f['path'] for f in manifest['files']}|{name+'/manifest.json'}
  assert actual==expected
  for entry in manifest['files']:
   path=entry['path'];assert not re.search(r'(^|/)(agents?\.md|webui_agent[^/]*|context[^/]*|\.claude|\.codex|\.git)(/|$)',path,re.I)
   info=z.getinfo(name+'/'+path);assert info.create_system==3 and info.file_size==entry['bytes']
   assert stat.S_IMODE(info.external_attr>>16)==int(entry['mode'],8)
   content_hash=hashlib.sha256()
   with z.open(info) as stream:
    for data in iter(lambda:stream.read(1024*1024),b''):content_hash.update(data)
   assert content_hash.hexdigest()==entry['sha256'],path
   if path.startswith('app/'):
    reference=ROOT/'dist'/path[4:];assert reference.is_file()
    reference_hash=hashlib.sha256(reference.read_bytes()).hexdigest();assert reference_hash==entry['sha256']
  launcher=z.read(name+'/START.command');assert launcher.startswith(b'#!/bin/bash\n') and b'\r' not in launcher
  node=z.read(name+'/runtime/node');assert node[:4]==b'\xcf\xfa\xed\xfe' and struct.unpack_from('<I',node,4)[0]==cpu
  assert stat.S_IMODE(z.getinfo(name+'/START.command').external_attr>>16)==0o755
  assert stat.S_IMODE(z.getinfo(name+'/runtime/node').external_attr>>16)==0o755
 print(f'PASS {arch}: {len(actual)} files, all hashes, official-runtime architecture, Unix execute permissions, LF launcher, identical web payload, no working records; native Mac execution NOT performed',flush=True)
