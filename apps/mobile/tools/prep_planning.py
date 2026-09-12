"""Derive the planning view from the supplied CSVs; keep measured and simulated trips separate."""
import csv, json, statistics
from collections import defaultdict
from pathlib import Path
root = Path(__file__).resolve().parents[3]
def number(v): return float(v.replace('%','').replace(',','.'))
def sec(v):
    p=[int(x) for x in v.split(':')]; return p[0]*3600+p[1]*60+(p[2] if len(p)>2 else 0)
groups=defaultdict(list)
with (root/'Mobilitätsdaten/BeispielAFZ.csv').open(encoding='cp1252',newline='') as f:
    for idx,r in enumerate(list(csv.reader(f,delimiter=';'))[1:],2):
        if r[16]=='0': continue
        groups[(r[0],r[2],r[3],r[4],r[5],r[6],r[7],idx<=101)].append(r)
trips=[]
for key,rows in groups.items():
    date,line,direction,start,origin,end,destination,original=key
    weighted=capacity_seconds=0; intervals=0
    for a,b in zip(rows,rows[1:]):
        dt=sec(b[13])-sec(a[14])
        if 0<dt<=1800:
            weighted+=number(a[19])*dt;capacity_seconds+=number(a[8])*dt;intervals+=1
    delays=[(sec(r[13])-sec(r[11]))/60 for r in rows]
    stops=[dict(name=r[15],load=round(number(r[20]),1),on=round(number(r[17]),1),off=round(number(r[18]),1)) for r in rows]
    trips.append(dict(id='|'.join(map(str,key)),line=line,date=date,original=original,direction=direction,start=start,origin=origin,destination=destination,
       duration=round((sec(end)-sec(start))/60,1),boardings=round(sum(number(r[17]) for r in rows),1),
       mean=round(sum(number(r[20]) for r in rows)/len(rows),1),peak=round(max(number(r[20]) for r in rows),1),
       utilization=round(weighted/capacity_seconds*100,1) if capacity_seconds else None,validSegments=intervals,totalSegments=len(rows)-1,
       delayMedian=round(statistics.median(delays),1),stops=stops))
result={'source':'BeispielAFZ.csv','originalDate':'30.04.2024','demoDate':'15.09.2025','trips':trips}
(root/'apps/mobile/src/data/planning.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
print(f'{len(trips)} trips: {sum(t["original"] for t in trips)} original, {sum(not t["original"] for t in trips)} simulated')
