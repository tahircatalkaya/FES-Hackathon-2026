import csv, json, math, collections, statistics, random, os, re
G = 'gtfs/GTFS_gefiltert_Frankfurt+30km'  # 7z aus Mobilitätsdaten/ hierhin entpacken
OUT = 'src/data'
os.makedirs(OUT, exist_ok=True)
BBOX = (50.02, 50.24, 8.44, 8.86)  # lat min, lat max, lon min, lon max
random.seed(7)

def inbox(lat, lon):
    return BBOX[0] <= lat <= BBOX[1] and BBOX[2] <= lon <= BBOX[3]

def hav(a, b, c, d):
    R = 6371000; p1, p2 = math.radians(a), math.radians(c)
    dp = math.radians(c - a); dl = math.radians(d - b)
    x = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(x))

# ---------- routes ----------
routes = {r['route_id']: r for r in csv.DictReader(open(f'{G}/routes.txt', encoding='utf-8'))}
sel = {}
for rid, r in routes.items():
    n = r['route_short_name']; ag = r['agency_id']; t = r['route_type']
    if ag == '8639' and re.fullmatch(r'U[1-9]', n): sel[rid] = ('U', n)
    elif ag == '8639' and re.fullmatch(r'1[1-9]|2[01]', n): sel[rid] = ('T', n)
    elif t == '109' and re.fullmatch(r'S[1-9]', n): sel[rid] = ('S', n)
print('selected routes', len(sel))

# ---------- service day: Monday 2025-09-15 ----------
DAY = '20250915'
active = set()
for c in csv.DictReader(open(f'{G}/calendar.txt', encoding='utf-8')):
    if c['monday'] == '1' and c['start_date'] <= DAY <= c['end_date']: active.add(c['service_id'])
for c in csv.DictReader(open(f'{G}/calendar_dates.txt', encoding='utf-8')):
    if c['date'] == DAY:
        if c['exception_type'] == '1': active.add(c['service_id'])
        else: active.discard(c['service_id'])
print('active services', len(active))

trips = {}
for t in csv.DictReader(open(f'{G}/trips.txt', encoding='utf-8')):
    if t['route_id'] in sel and t['service_id'] in active:
        trips[t['trip_id']] = t
print('trips', len(trips))

# ---------- stops ----------
stops_raw = {s['stop_id']: s for s in csv.DictReader(open(f'{G}/stops.txt', encoding='utf-8'))}

# ---------- stop_times (stream) ----------
st = collections.defaultdict(list)
with open(f'{G}/stop_times.txt', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        tid = row['trip_id']
        if tid in trips:
            st[tid].append((int(row['stop_sequence']), row['stop_id'], int(row['departure_time_seconds'])))
for tid in st: st[tid].sort()
print('trips with times', len(st))

# station key = normalised name
def station_key(sid):
    s = stops_raw[sid]
    name = s['stop_name']
    return name

stations = {}  # key -> {name, lat, lon, ids:set}
def add_station(sid):
    s = stops_raw[sid]; k = station_key(sid)
    lat, lon = float(s['stop_lat']), float(s['stop_lon'])
    if k not in stations: stations[k] = {'name': s['stop_name'], 'lats': [], 'lons': [], 'ids': set()}
    stations[k]['lats'].append(lat); stations[k]['lons'].append(lon); stations[k]['ids'].add(sid)
    return k

# ---------- patterns ----------
pat = collections.defaultdict(list)  # (route_id, dir, tuple(stationkeys)) -> list of (trip_id, times)
for tid, rows in st.items():
    t = trips[tid]
    keys = tuple(add_station(sid) for _, sid, _ in rows)
    times = [sec for _, _, sec in rows]
    pat[(t['route_id'], t['direction_id'], keys, t['trip_headsign'], t['shape_id'])].append((tid, times))

# choose top patterns per route/dir
byrd = collections.defaultdict(list)
for k, v in pat.items(): byrd[(k[0], k[1])].append((len(v), k))
chosen = []
for rd, lst in byrd.items():
    lst.sort(reverse=True)
    total = sum(n for n, _ in lst)
    acc = 0
    for n, k in lst:
        if n < 4 and acc > 0: break
        chosen.append(k); acc += n
        if acc >= total * 0.9 or len([c for c in chosen if (c[0], c[1]) == rd]) >= 3: break
print('patterns', len(chosen))

# station index for chosen patterns only
used = set()
for k in chosen: used.update(k[2])
st_list = sorted(used)
st_idx = {k: i for i, k in enumerate(st_list)}
stations_out = []
for k in st_list:
    s = stations[k]
    stations_out.append({'id': st_idx[k], 'name': s['name'].replace('Frankfurt (Main) ', '').replace('Frankfurt (M) ', ''),
                         'lat': round(statistics.mean(s['lats']), 6), 'lon': round(statistics.mean(s['lons']), 6)})

# shapes
need_shapes = set(k[4] for k in chosen if k[4])
shp = collections.defaultdict(list)
with open(f'{G}/shapes.txt', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        sid = row['shape_id']
        if sid in need_shapes:
            shp[sid].append((int(row['shape_pt_sequence']), float(row['shape_pt_lat']), float(row['shape_pt_lon'])))
for sid in shp: shp[sid].sort()

def rdp(pts, eps):
    if len(pts) < 3: return pts
    def d(p, a, b):
        # perpendicular distance in metres (approx planar)
        ax, ay = a[1]*111320*math.cos(math.radians(a[0])), a[0]*110540
        bx, by = b[1]*111320*math.cos(math.radians(b[0])), b[0]*110540
        px, py = p[1]*111320*math.cos(math.radians(p[0])), p[0]*110540
        dx, dy = bx-ax, by-ay
        if dx == dy == 0: return math.hypot(px-ax, py-ay)
        t = max(0, min(1, ((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)))
        return math.hypot(px-(ax+t*dx), py-(ay+t*dy))
    dmax, idx = 0, 0
    for i in range(1, len(pts)-1):
        dd = d(pts[i], pts[0], pts[-1])
        if dd > dmax: dmax, idx = dd, i
    if dmax > eps:
        return rdp(pts[:idx+1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]

COLORS = {'U1': '#B3007A', 'U2': '#00A650', 'U3': '#4C2C82', 'U4': '#F2A2C4', 'U5': '#00795C', 'U6': '#0069B4', 'U7': '#E67B1B', 'U8': '#C6198F', 'U9': '#FFD500',
          'S1': '#00A6E2', 'S2': '#F02E27', 'S3': '#00A650', 'S4': '#EF8CAB', 'S5': '#8C5D2C', 'S6': '#F58220', 'S7': '#00875B', 'S8': '#8FBE20', 'S9': '#8B2A8F'}
patterns_out = []
for k in chosen:
    rid, d, keys, headsign, shape_id = k
    lst = pat[k]
    times = [t for _, t in lst]
    n = len(keys)
    offsets = [int(round(statistics.median([t[i]-t[0] for t in times])/60)) for i in range(n)]
    deps = sorted(int(round(t[0]/60)) for t in times)
    shape = []
    if shape_id and shape_id in shp:
        pts = [(la, lo) for _, la, lo in shp[shape_id]]
        pts = rdp(pts, 12)
        shape = [[round(a, 5), round(b, 5)] for a, b in pts]
    else:
        shape = [[stations_out[st_idx[x]]['lat'], stations_out[st_idx[x]]['lon']] for x in keys]
    kind, name = sel[rid]
    patterns_out.append({'route': name, 'kind': kind, 'color': COLORS.get(name, '#1B5E20' if kind == 'T' else '#555'),
                         'dir': d, 'headsign': headsign.replace('Frankfurt (Main) ', ''), 'stops': [st_idx[x] for x in keys],
                         'offsets': offsets, 'departures': deps, 'shape': shape})

transit = {'serviceDay': '2025-09-15 (Montag, GTFS RMV)', 'stations': stations_out, 'patterns': patterns_out}
json.dump(transit, open(f'{OUT}/transit.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('transit.json', os.path.getsize(f'{OUT}/transit.json')//1024, 'KB', len(stations_out), 'stations')

# ---------- test traces ----------
def interp_along(shape, a_idx_pt, b_idx_pt, n):
    pass

def nearest_shape_idx(shape, lat, lon):
    return min(range(len(shape)), key=lambda i: hav(shape[i][0], shape[i][1], lat, lon))

def build_trace(p, start_i, end_i, dep_minute, noise=12, step=5, dwell=25, speed_kmh=None, offset_m=0):
    """Generate GPS points along pattern p from stop index start_i to end_i."""
    stops = [stations_out[s] for s in p['stops']]
    shape = p['shape']
    pts = []
    t = dep_minute*60 + p['offsets'][start_i]*60
    for si in range(start_i, end_i):
        a, b = stops[si], stops[si+1]
        ia, ib = nearest_shape_idx(shape, a['lat'], a['lon']), nearest_shape_idx(shape, b['lat'], b['lon'])
        if ib < ia: ia, ib = ib, ia
        seg = shape[ia:ib+1] or [[a['lat'], a['lon']], [b['lat'], b['lon']]]
        # segment length
        L = sum(hav(seg[i][0], seg[i][1], seg[i+1][0], seg[i+1][1]) for i in range(len(seg)-1)) or 1
        dur = max(40, (p['offsets'][si+1]-p['offsets'][si])*60 - dwell) if not speed_kmh else L/(speed_kmh/3.6)
        # dwell at stop a
        for _ in range(0, dwell, step):
            pts.append([a['lat']+random.gauss(0, noise/110540), a['lon']+random.gauss(0, noise/70000), t]); t += step
        # move
        nsteps = max(2, int(dur/step))
        for s in range(nsteps):
            frac = s/nsteps; dist = frac*L; acc = 0
            for i in range(len(seg)-1):
                dl = hav(seg[i][0], seg[i][1], seg[i+1][0], seg[i+1][1])
                if acc+dl >= dist or i == len(seg)-2:
                    f = (dist-acc)/dl if dl else 0
                    la = seg[i][0]+(seg[i+1][0]-seg[i][0])*f; lo = seg[i][1]+(seg[i+1][1]-seg[i][1])*f
                    break
                acc += dl
            pts.append([la+random.gauss(0, noise/110540)+offset_m/110540, lo+random.gauss(0, noise/70000)+offset_m/70000, t]); t += step
    b = stops[end_i]
    for _ in range(0, 15, step):
        pts.append([b['lat']+random.gauss(0, noise/110540), b['lon']+random.gauss(0, noise/70000), t]); t += step
    return [[round(x[0], 6), round(x[1], 6), x[2]] for x in pts]

def find_pattern(name, dir_pref=None):
    c = [p for p in patterns_out if p['route'] == name]
    c.sort(key=lambda p: -len(p['departures']))
    return c[0]

u4 = find_pattern('U4')
print('U4', u4['headsign'], [stations_out[s]['name'] for s in u4['stops']])
# choose a departure around 08:1x
dep = min(u4['departures'], key=lambda m: abs(m-8*60-12))
s0 = min(3, len(u4['stops'])-7); s1 = s0+6
traces = {
 'u4_ok': {'title': 'U4-Fahrt (Simulation)', 'desc': 'Echte Fahrt entlang der U4, Fahrplan +1,5 min', 'expect': 'plausibel',
           'points': build_trace(u4, s0, s1, dep+1.5, noise=10)},
 'car_parallel': {'title': 'Autofahrt neben der Linie', 'desc': 'Gleiche Richtung, aber ohne Halte und 400 m versetzt', 'expect': 'nicht zuordenbar',
           'points': build_trace(u4, s0, s1, dep, noise=6, dwell=0, speed_kmh=42, offset_m=400)},
}
tram = find_pattern('16')
dep2 = min(tram['departures'], key=lambda m: abs(m-17*60-40))
traces['tram16_ok'] = {'title': 'Tram 16 Feierabend (Simulation)', 'desc': 'Straßenbahn 16, fünf Halte', 'expect': 'plausibel',
                       'points': build_trace(tram, 2, 7, dep2+0.5, noise=14)}
json.dump(traces, open(f'{OUT}/traces.json', 'w', encoding='utf-8'), separators=(',', ':'))
print('traces', {k: len(v['points']) for k, v in traces.items()})

# ---------- traffiQ ----------
def rd(path, delim=';'):
    for enc in ('utf-8-sig', 'latin-1'):
        try:
            return list(csv.DictReader(open(path, encoding=enc), delimiter=delim))
        except UnicodeDecodeError: continue

hs = rd('../../Mobilitätsdaten/haltestellen_avg.csv')
hs_out = []
for r in hs:
    try:
        lon, lat = float(r['gps_x']), float(r['gps_y'])
    except: continue
    if inbox(lat, lon):
        hs_out.append({'n': r['haltestelle'].replace('Frankfurt (Main) ', ''), 'lat': round(lat, 5), 'lon': round(lon, 5), 'v': int(float(r['anfragen_durchschnittsmonat']))})
hs_out.sort(key=lambda x: -x['v'])
json.dump({'source': 'traffiQ haltestellen_avg.csv, Anfragen je Monat (Durchschnitt), Bezugszeitraum nicht dokumentiert', 'items': hs_out[:400]},
          open(f'{OUT}/haltestellen.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
tg = rd('../../Mobilitätsdaten/tagesgang_avg.csv')
json.dump({'source': 'traffiQ tagesgang_avg.csv, Anfragen je Stunde (Durchschnittstag)', 'hours': [float(r['anfragen_durchschnittstag']) for r in tg]},
          open(f'{OUT}/tagesgang.json', 'w'), separators=(',', ':'))

afz = rd('../../Mobilitätsdaten/BeispielAFZ.csv')
line_hour = collections.defaultdict(list); stop_board = collections.Counter(); synthetic = 0
for r in afz:
    try:
        ausl = float(r['Auslastung'].replace('%', '').replace(',', '.'))
        h = int(r['AbZeit'].split(':')[0])
    except: continue
    if r['Datum'] != '30.04.2024': synthetic += 1
    line_hour[(r['Linie'], h)].append(ausl)
    stop_board[r['HstName(Fpl)']] += int(float((r['Einsteiger'] or '0').replace(',', '.')))
lines = sorted(set(l for l, _ in line_hour))
afz_out = {'source': 'Fahrgastzählung BeispielAFZ.csv (4 Originalfahrten U7 vom 30.04.2024, Rest synthetisch 15.09.2025)',
           'lines': {l: [round(statistics.mean(line_hour[(l, h)]), 1) if (l, h) in line_hour else None for h in range(24)] for l in lines},
           'topBoarding': [{'n': n.replace('Frankfurt (Main) ', ''), 'v': v} for n, v in stop_board.most_common(12) if n not in ('einfahrend', 'ausfahrend')]}
json.dump(afz_out, open(f'{OUT}/afz.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

efa = rd('../../Mobilitätsdaten/BeispielDataSetEFA.csv')
def fixnum(s, lat=False):
    s = s.replace('.', '')
    return float(s[:2]+'.'+s[2:]) if lat else float(s[:1]+'.'+s[1:])
rel = collections.Counter(); coords = {}
for r in efa:
    a, b = r['s_adress_name'].replace('Frankfurt (Main) ', ''), r['z_adress_name'].replace('Frankfurt (Main) ', '')
    rel[(a, b)] += 1
    try:
        coords[a] = (fixnum(r['s_latitude'], True), fixnum(r['s_longitude'])); coords[b] = (fixnum(r['z_latitude'], True), fixnum(r['z_longitude']))
    except: pass
efa_out = {'source': 'EFA-Verbindungsanfragen BeispielDataSetEFA.csv (27 Originalzeilen, Rest synthetisch)', 'rows': len(efa),
           'top': [{'from': a, 'to': b, 'n': n, 'fromLL': coords.get(a), 'toLL': coords.get(b)} for (a, b), n in rel.most_common(10)]}
json.dump(efa_out, open(f'{OUT}/efa.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

sc = rd('../../Mobilitätsdaten/e-scooter-beispiel.csv', ',')
agg = collections.defaultdict(lambda: collections.Counter())
for r in sc:
    if r['radius'] != '250': continue
    agg[r['stop_name']][r['vehicle_type']] += int(float(r['trips_starting'] or 0))
sc_out = {'source': 'Sharing-Nutzung e-scooter-beispiel.csv, Radius 250 m, 7 simulierte Tage ab 07.04.2025 (20 Originalzeilen nextbike, Rest synthetisch)',
          'stops': [{'n': n.lstrip('*0123456789 ').removeprefix('F ').strip(), 'bike': c.get('bicycle', 0), 'scooter': c.get('e-scooter', 0) + c.get('scooter', 0)} for n, c in agg.items()],
          'vehicleTypes': sorted(set(r['vehicle_type'] for r in sc))}
json.dump(sc_out, open(f'{OUT}/sharing.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('sharing types', sc_out['vehicleTypes'])

vs = json.load(open('../../Mobilitätsdaten/vytal-stores.json'))
json.dump([{'id': s['id'], 'name': s['name'], 'lat': round(s['lonlat']['latitude'], 6), 'lon': round(s['lonlat']['longitude'], 6), 'type': s['store']['type'], 'address': s['store']['location_name']} for s in vs],
          open(f'{OUT}/vytal-stores.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
ft = json.load(open('../../Mobilitätsdaten/fairteiler.json'))
json.dump(ft, open(f'{OUT}/fairteiler.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for f in os.listdir(OUT): print(f, os.path.getsize(f'{OUT}/{f}')//1024, 'KB')
