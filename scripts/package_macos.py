"""Cross-package the verified web build with official native macOS runtimes.

Only Python's standard library is required. Never execute the downloaded Mach-O
on another platform, and never treat archive checks as native Mac acceptance.
"""
from pathlib import Path
import argparse,hashlib,json,os,re,shutil,stat,struct,tarfile,urllib.request,zipfile,time

ROOT=Path(__file__).resolve().parents[1]
RELEASE=ROOT/'release'
VERSION=json.loads((ROOT/'package.json').read_text(encoding='utf-8'))['version']
NODE_VERSION='v24.16.0'
BASE=f'https://nodejs.org/dist/{NODE_VERSION}'
FORBIDDEN=re.compile(r'(^|/)(agents?\.md|webui_agent[^/]*|context[^/]*|\.claude|\.codex|\.agents|\.aws|\.git|\.env[^/]*)(/|$)',re.I)
parser=argparse.ArgumentParser()
parser.add_argument('--arch',choices=['arm64','x64','all'],default='all')
parser.add_argument('--app-dir',type=Path,default=ROOT/'dist')
args=parser.parse_args()
if not re.fullmatch(r'\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?',VERSION):raise ValueError('Invalid version')
if not (args.app_dir/'index.html').is_file():raise ValueError('Build the web app first: npm run build')
if any(p.is_symlink() for p in args.app_dir.rglob('*')):raise ValueError('Symlinks are not allowed in the web payload')
cache=RELEASE/'cache';cache.mkdir(exist_ok=True)

def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()

def download(url,target):
 temporary=target.with_suffix(target.suffix+'.part')
 for attempt in range(3):
  try:
   with urllib.request.urlopen(url,timeout=60) as response,temporary.open('wb') as out:shutil.copyfileobj(response,out)
   temporary.replace(target);return
  except Exception:
   if temporary.exists():temporary.unlink()
   if attempt==2:raise
   time.sleep(2)

sumfile=cache/f'node-{NODE_VERSION}-SHASUMS256.txt'
if not sumfile.exists():download(BASE+'/SHASUMS256.txt',sumfile)
checksums={line.split()[1]:line.split()[0] for line in sumfile.read_text(encoding='utf-8').splitlines() if len(line.split())==2}
guide=(RELEASE/'macOS使用指南.md').read_text(encoding='utf-8')
results=[]
for arch in (['arm64','x64'] if args.arch=='all' else [args.arch]):
 filename=f'node-{NODE_VERSION}-darwin-{arch}.tar.gz'
 archive=cache/filename
 expected=checksums[filename]
 if not archive.exists() or sha(archive)!=expected:download(BASE+'/'+filename,archive)
 if sha(archive)!=expected:raise ValueError('Official runtime SHA-256 mismatch: '+filename)
 prefix=f'node-{NODE_VERSION}-darwin-{arch}'
 with tarfile.open(archive,'r:gz') as tar:
  node=tar.extractfile(prefix+'/bin/node').read()
  license_text=tar.extractfile(prefix+'/LICENSE').read()
 if node[:4]!=b'\xcf\xfa\xed\xfe' or struct.unpack_from('<I',node,4)[0]!={'arm64':0x0100000c,'x64':0x01000007}[arch]:raise ValueError('Wrong native Mach-O architecture')
 name=f'Mahler-Lexicon-v{VERSION}-macos-{arch}'
 folder=(RELEASE/name).resolve()
 # Verify an absolute child of release/ before replacing only our generated output.
 if folder.parent!=RELEASE.resolve():raise ValueError('Unsafe output path')
 if folder.exists():
  if json.loads((folder/'version.json').read_text(encoding='utf-8')).get('application')!='Mahler Lexicon':raise ValueError('Unknown output directory')
  shutil.rmtree(folder)
 (folder/'runtime').mkdir(parents=True)
 metadata=dict(application='Mahler Lexicon',version='v'+VERSION,build='packaging',platform='macos-'+arch,runtime=NODE_VERSION,minimumMacOS='13.5',nativeTested=False,runtimeArchiveSHA256=expected)
 (folder/'version.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
 shutil.copytree(args.app_dir,folder/'app',symlinks=False)
 (folder/'runtime/node').write_bytes(node)
 (folder/'runtime/LICENSE.txt').write_bytes(license_text)
 for src,dst in [(RELEASE/'launcher/START.command',folder/'START.command'),(RELEASE/'launcher/server.mjs',folder/'server.mjs'),(ROOT/'scripts/audio-range.mjs',folder/'audio-range.mjs')]:
  dst.write_bytes(src.read_bytes().replace(b'\r\n',b'\n'))
 for executable in ['START.command','runtime/node']:os.chmod(folder/executable,0o755)
 (folder/'README.md').write_text(guide,encoding='utf-8')
 (folder/'使用指南.txt').write_text(guide,encoding='utf-8')
 (folder/'THIRD_PARTY_NOTICES.txt').write_text(f'Node.js {NODE_VERSION}: official macOS {arch} runtime. Full licenses: runtime/LICENSE.txt\nRuntime archive: {BASE}/{filename}\nOfficial archive SHA-256: {expected}\nRecording and score sources: https://github.com/yuxinpu0110-wq/Mahler-Lexicon/blob/main/docs/SOURCES.md\n',encoding='utf-8')
 metadata['build']=hashlib.sha256((folder/'app/index.html').read_bytes()).hexdigest()[:16]
 (folder/'version.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
 files=[]
 for path in sorted(folder.rglob('*')):
  relative=path.relative_to(folder).as_posix()
  if path.is_symlink() or FORBIDDEN.search(relative):raise ValueError('Excluded path: '+relative)
  if path.is_file():files.append(dict(path=relative,bytes=path.stat().st_size,sha256=sha(path),mode='0755' if relative in ['START.command','runtime/node'] else '0644'))
 (folder/'manifest.json').write_text(json.dumps(dict(**metadata,files=files),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 output=RELEASE/(name+'.zip')
 with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as zip:
  for path in sorted(folder.rglob('*')):
   relative=path.relative_to(folder).as_posix()
   info=zipfile.ZipInfo(name+'/'+relative+('/' if path.is_dir() else ''),time.localtime(path.stat().st_mtime)[:6]);info.create_system=3
   mode=0o755 if path.is_dir() or relative in ['START.command','runtime/node'] else 0o644
   info.external_attr=((stat.S_IFDIR if path.is_dir() else stat.S_IFREG)|mode)<<16
   if path.is_dir():info.external_attr|=0x10;zip.writestr(info,b'');continue
   info.compress_type=zipfile.ZIP_STORED if path.suffix.lower() in ['.flac','.webp','.png','.jpg'] else zipfile.ZIP_DEFLATED
   with path.open('rb') as source,zip.open(info,'w') as destination:shutil.copyfileobj(source,destination)
 checksum=sha(output)
 (RELEASE/(name+'.zip.sha256')).write_text(f'{checksum}  {output.name}\n',encoding='utf-8')
 result=dict(archive=output.name,bytes=output.stat().st_size,sha256=checksum,platform=metadata['platform'],files=len(files)+1,nativeTested=False)
 results.append(result);print(json.dumps(result),flush=True)
(cache/'macos-package-results.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf-8')
