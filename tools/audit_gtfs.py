"""Stream large GTFS tables; never loads stop_times or shapes into the client."""
import csv
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
directory=ROOT/'.runtime/gtfs/GTFS_gefiltert_Frankfurt+30km'

def main():
    report={}; stops=set(); parents=set(); shapes=set(); trip_shapes=set(); seconds_max=0
    for path in sorted(directory.glob('*.txt')):
        count=0; dates=[]; zones=set(); suffixes=0
        with path.open(encoding='utf-8-sig',newline='') as stream:
            for row in csv.DictReader(stream):
                count+=1
                if path.stem=='agency': zones.add(row.get('agency_timezone'))
                if path.stem=='calendar': dates.extend([row['start_date'],row['end_date']])
                if path.stem=='stops':
                    stops.add(row['stop_id'])
                    if row.get('parent_station'): parents.add(row['parent_station'])
                if path.stem=='shapes': shapes.add(row['shape_id'])
                if path.stem=='trips':
                    shape=row['shape_id']; suffixes+=shape.endswith('.0'); trip_shapes.add(shape.removesuffix('.0'))
                if path.stem=='stop_times':
                    seconds_max=max(seconds_max,int(float(row['arrival_time_seconds'])),int(float(row['departure_time_seconds'])))
        report[path.name]={'rows':count}
        if dates: report[path.name].update({'start':min(dates),'end':max(dates)})
        if zones: report[path.name]['timezones']=sorted(zones)
        if suffixes: report[path.name]['shape_id_dot_zero_rows']=suffixes
    report['relations']={'missing_parent_ids':len(parents-stops),'unique_shapes':len(shapes),'unmatched_normalized_trip_shapes':len(trip_shapes-shapes),'max_service_day_seconds':seconds_max}
    (ROOT/'docs/generated/gtfs-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
