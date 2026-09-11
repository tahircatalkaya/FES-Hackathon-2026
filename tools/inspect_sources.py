"""Read-only source inspection; writes reproducible findings under docs/generated."""
from pathlib import Path
import csv
import hashlib
import json
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'generated'
OUT.mkdir(parents=True, exist_ok=True)

def digest(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def main():
    inventory = []
    for p in sorted(ROOT.rglob('*')):
        if not p.is_file() or any(x in p.parts for x in ('.git', 'node_modules', '.runtime', 'generated', '__pycache__')):
            continue
        inventory.append({'path':p.relative_to(ROOT).as_posix(), 'bytes':p.stat().st_size,
                          'sha256':None if p.name == 'KEYS.txt' else digest(p)})
    (OUT/'inventory.json').write_text(json.dumps(inventory, indent=2, ensure_ascii=False), encoding='utf-8')
    pdf = PdfReader(ROOT/'Gesamtaufgabe.pdf')
    (OUT/'aufgabe.txt').write_text('\n\n'.join(f'## Seite {i+1}\n{p.extract_text()}' for i,p in enumerate(pdf.pages)), encoding='utf-8')
    with zipfile.ZipFile(ROOT/'2026_09_08_Vorstellung_Eröffnung_V2.pptx') as z:
        ns = {'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
        sections=[]
        for kind in ('slides/slide','notesSlides/notesSlide'):
            names = [n for n in z.namelist() if n.startswith('ppt/'+kind) and n.endswith('.xml')]
            for n in sorted(names, key=lambda s:int(s.rsplit('slide',1)[-1][:-4]) if '/slides/' in s else int(s.rsplit('notesSlide',1)[-1][:-4])):
                root = ET.fromstring(z.read(n))
                sections.append('## '+n+'\n'+'\n'.join(t.text or '' for t in root.findall('.//a:t',ns)))
        (OUT/'eroeffnung.txt').write_text('\n\n'.join(sections), encoding='utf-8')
        media=OUT/'ppt-media'; media.mkdir(exist_ok=True)
        for n in z.namelist():
            if n.startswith('ppt/media/'):
                (media/Path(n).name).write_bytes(z.read(n))
    reports={}
    data=ROOT/'Mobilitätsdaten'
    for p in sorted(data.rglob('*.csv')):
        encoding='cp1252' if p.name=='BeispielAFZ.csv' else 'utf-8-sig'
        with p.open(encoding=encoding,newline='') as f:
            sample=f.read(4096); f.seek(0)
            delimiter=csv.Sniffer().sniff(sample,delimiters=';,\t').delimiter
            reader=csv.reader(f,delimiter=delimiter); header=next(reader); rows=list(reader)
        report={'rows':len(rows),'columns':len(header),'encoding':encoding,'delimiter':delimiter,
                'headers':header,'sha256':digest(p),'row_widths':dict(Counter(map(len,rows)))}
        if p.name=='BeispielAFZ.csv':
            report['dates']=dict(Counter(r[0] for r in rows)); report['lines']=dict(Counter(r[2] for r in rows))
            report['operational_marker_rows']=sum(r[16]=='0' for r in rows)
        if p.name=='e-scooter-beispiel.csv':
            report['providers']=dict(Counter(r[header.index('provider_name')] for r in rows))
        if p.name=='tagesgang_avg.csv':
            report['sum_requests']=sum(float(r[1].replace(',','.')) for r in rows)
        if p.name=='haltestellen_avg.csv':
            report['missing_coordinates']=sum(not r[1] or not r[2] for r in rows)
        reports[p.relative_to(ROOT).as_posix()]=report
    (OUT/'data-audit.json').write_text(json.dumps(reports,indent=2,ensure_ascii=False),encoding='utf-8')
    print(json.dumps({k:{'rows':v['rows'],'columns':v['columns']} for k,v in reports.items()},ensure_ascii=False))

if __name__=='__main__': main()
