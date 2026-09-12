# -*- coding: utf-8 -*-
"""
Aggregierter Datenexport fuer Transdev und traffiQ.

Erzeugt eine Excel-Mappe aus den Verkehrsdaten im Repo und, wenn vorhanden, aus den
von Mainsam erkannten Fahrten. Der Export ist so gebaut, dass er wiederholbar laeuft:
    python tools/transdev_export.py [--ledger pfad/zu/ledger.json] [--out pfad.xlsx]

Datenschutz, gilt fuer jede Zeile in dieser Mappe:
  * Es werden ausschliesslich Summen und Mittelwerte geschrieben, nie Einzelfahrten.
  * k-Anonymitaet mit k >= 5: Jede Zeile, die auf weniger als fuenf Beobachtungen
    beruht, wird unterdrueckt und nur gezaehlt, nicht ausgewiesen.
  * Feinste Zeitaufloesung ist die Stunde. Keine Zeitstempel, keine GPS-Spuren,
    keine Geraete- oder Personenkennungen.
  * Synthetische Zeilen bleiben als "Demo-Daten" gekennzeichnet und werden nicht
    mit echten Messungen vermischt.

Die Mappe wird ohne Fremdbibliothek geschrieben (xlsx ist ein ZIP aus XML-Dateien),
damit der Export ohne Installation auf jedem Rechner im Team laeuft.
"""

import argparse
import csv
import io
import json
import os
import re
import zipfile
from collections import defaultdict
from datetime import datetime, timezone

K_MIN = 5  # k-Anonymitaet: darunter wird unterdrueckt
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(REPO, 'Mobilitätsdaten')
SUPPRESSED = f'unterdrückt (n < {K_MIN})'


# --------------------------------------------------------------------------- Einlesen

def read_csv(path, delim=';'):
    """Liest eine der traffiQ-Dateien. Encoding ist uneinheitlich, daher Fallback."""
    for enc in ('utf-8-sig', 'latin-1'):
        try:
            with io.open(path, encoding=enc, newline='') as f:
                return list(csv.DictReader(f, delimiter=delim))
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f'nicht lesbar: {path}')


def num(v):
    """Zahl aus einem Feld, das Komma als Dezimaltrenner und % enthalten kann."""
    if v is None:
        return None
    t = str(v).strip().replace('%', '').replace(' ', '')
    if not t:
        return None
    t = t.replace(',', '.')
    try:
        return float(t)
    except ValueError:
        return None


# --------------------------------------------------------------------------- Aggregate

def sheet_auslastung():
    """Fahrgastzaehlung je Linie, Richtung und Stunde. Grundlage fuer Taktentscheidungen."""
    rows = read_csv(os.path.join(DATA, 'BeispielAFZ.csv'))
    buckets = defaultdict(lambda: {'n': 0, 'ein': 0.0, 'aus': 0.0, 'bes': 0.0, 'ausl': 0.0, 'tage': set()})
    for r in rows:
        linie, ri, ab = (r.get('Linie') or '').strip(), (r.get('Ri') or '').strip(), (r.get('AbZeit') or '').strip()
        if not linie or ':' not in ab:
            continue
        stunde = int(ab.split(':')[0])
        datum = (r.get('Datum') or '').strip()
        # Laut Datenblatt sind nur die U7-Fahrten vom 30.04.2024 echte Messungen.
        echt = datum == '30.04.2024'
        b = buckets[(linie, ri, stunde, echt)]
        b['n'] += 1
        b['tage'].add(datum)
        for key, col in (('ein', 'Einsteiger'), ('aus', 'Aussteiger'), ('bes', 'Besetzung'), ('ausl', 'Auslastung')):
            v = num(r.get(col))
            if v is not None:
                b[key] += v

    out = [['Linie', 'Richtung', 'Stunde', 'Herkunft', 'Zählpunkte', 'Einsteiger', 'Aussteiger',
            'Ø Besetzung', 'Ø Auslastung %']]
    unterdrueckt = 0
    for (linie, ri, stunde, echt), b in sorted(buckets.items(), key=lambda kv: (kv[0][0], kv[0][1], kv[0][2])):
        herkunft = 'Messung' if echt else 'Demo-Daten'
        if b['n'] < K_MIN:
            unterdrueckt += 1
            out.append([linie, ri, stunde, herkunft, SUPPRESSED, '', '', '', ''])
            continue
        out.append([linie, ri, stunde, herkunft, b['n'], round(b['ein']), round(b['aus']),
                    round(b['bes'] / b['n'], 1), round(b['ausl'] / b['n'], 1)])
    return out, unterdrueckt


def sheet_tagesgang():
    """Verbindungsanfragen je Stunde. Zeigt, wann Kapazitaet gebraucht wird."""
    rows = read_csv(os.path.join(DATA, 'tagesgang_avg.csv'))
    out = [['Stunde', 'Anfragen Ø Tag', 'Anteil %']]
    werte = [(int(num(r['stunde'])), num(r['anfragen_durchschnittstag']) or 0.0) for r in rows]
    gesamt = sum(v for _, v in werte) or 1
    for stunde, v in sorted(werte):
        out.append([stunde, round(v), round(100 * v / gesamt, 2)])
    return out


def sheet_haltestellen(limit=250):
    """Nachfrage je Haltestelle. Kandidaten fuer Verdichtung oder Ausduennung."""
    rows = read_csv(os.path.join(DATA, 'haltestellen_avg.csv'))
    items = []
    for r in rows:
        v = num(r.get('anfragen_durchschnittsmonat'))
        name = (r.get('haltestelle') or '').strip()
        if not name or v is None:
            continue
        items.append((name, v, num(r.get('gps_y')), num(r.get('gps_x'))))
    items.sort(key=lambda x: -x[1])
    out = [['Haltestelle', 'Anfragen Ø Monat', 'Breite', 'Länge']]
    for name, v, lat, lon in items[:limit]:
        out.append([name, round(v), lat if lat is not None else '', lon if lon is not None else ''])
    return out, len(items)


def sheet_mainsam(ledger_path):
    """
    Von Mainsam erkannte Fahrten, aggregiert. Das ist der Teil, den der Verbund heute
    nicht hat: bestaetigte Fahrten mit Linie, Richtung und Stunde aus dem Alltag.
    """
    head = [['Linie', 'Ziel', 'Stunde', 'Nachweis', 'Fahrten', 'Ø km', 'Σ km', 'Σ CO₂e vermieden (kg)']]
    if not ledger_path or not os.path.exists(ledger_path):
        return head, 0, False

    with io.open(ledger_path, encoding='utf-8') as f:
        raw = json.load(f)
    eintraege = raw.get('state', {}).get('ledger', raw) if isinstance(raw, dict) else raw

    buckets = defaultdict(lambda: {'n': 0, 'km': 0.0, 'co2': 0.0})
    for l in eintraege:
        if not str(l.get('type', '')).startswith('ride.'):
            continue
        meta = l.get('meta') or {}
        titel = str(l.get('title') or '')
        m = re.match(r'^([A-Za-z0-9]+)\s*→\s*(.+)$', titel)
        linie = m.group(1) if m else str(meta.get('mode') or '?')
        ziel = m.group(2).strip() if m else ''
        stunde = datetime.fromtimestamp(l.get('at', 0) / 1000).hour
        b = buckets[(linie, ziel, stunde, l.get('status', 'unbekannt'))]
        b['n'] += 1
        b['km'] += float((l.get('impact') or {}).get('km') or 0)
        b['co2'] += float((l.get('impact') or {}).get('co2_g') or 0) / 1000

    unterdrueckt = 0
    for (linie, ziel, stunde, status), b in sorted(buckets.items()):
        if b['n'] < K_MIN:
            unterdrueckt += 1
            continue  # unter k wird gar nicht erst ausgewiesen
        head.append([linie, ziel, stunde, status, b['n'], round(b['km'] / b['n'], 2),
                     round(b['km'], 1), round(b['co2'], 2)])
    return head, unterdrueckt, True


def sheet_hinweise(stats):
    return [
        ['Aggregierter Mobilitätsexport für Transdev und traffiQ'],
        [],
        ['Erzeugt am', datetime.now(timezone.utc).astimezone().strftime('%d.%m.%Y %H:%M %Z')],
        ['Erzeugt von', 'tools/transdev_export.py (Mainsam, Frankfurt Impact Challenge)'],
        [],
        ['Datenschutz'],
        ['k-Anonymität', f'k ≥ {K_MIN}. Zeilen mit weniger Beobachtungen werden unterdrückt.'],
        ['Zeitauflösung', 'Stunde. Keine Zeitstempel, keine GPS-Spuren.'],
        ['Personenbezug', 'keiner. Keine Nutzer-, Geräte- oder Fahrscheinkennungen.'],
        ['Grundlage', 'Opt-in. Nur Fahrten von Personen, die dem Beitrag zugestimmt haben.'],
        [],
        ['Unterdrückte Zeilen'],
        ['Auslastung', stats['auslastung_unterdrueckt']],
        ['Mainsam-Fahrten', stats['mainsam_unterdrueckt']],
        [],
        ['Quellen'],
        ['Auslastung', 'Mobilitätsdaten/BeispielAFZ.csv · echte Messung nur 30.04.2024 (U7), Rest Demo-Daten'],
        ['Tagesgang', 'Mobilitätsdaten/tagesgang_avg.csv · Verbindungsanfragen, Durchschnittstag'],
        ['Haltestellen', f"Mobilitätsdaten/haltestellen_avg.csv · {stats['haltestellen_gesamt']} Haltestellen, Top {stats['haltestellen_top']} ausgewiesen"],
        ['Mainsam-Fahrten', 'Ledger der App, GPS gegen GTFS geprüft' if stats['mainsam_vorhanden'] else 'kein Ledger übergeben, Blatt bleibt leer'],
        [],
        ['Nicht addieren'],
        ['Hinweis', 'Anfragen, Zählwerte und erkannte Fahrten sind verschiedene Messgrößen.'],
        ['Hinweis', 'Die Zeiträume der Quellen unterscheiden sich (2024, 2025). Keine Zeitreihen über Dateigrenzen.'],
    ]


# --------------------------------------------------------------------------- XLSX

def col_name(i):
    name = ''
    while i >= 0:
        name = chr(ord('A') + i % 26) + name
        i = i // 26 - 1
    return name


def esc(t):
    return (str(t).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def sheet_xml(rows):
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
           '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>']
    for r, row in enumerate(rows, start=1):
        cells = []
        for c, v in enumerate(row):
            ref = f'{col_name(c)}{r}'
            if isinstance(v, bool) or v is None or v == '':
                continue
            if isinstance(v, (int, float)):
                cells.append(f'<c r="{ref}"><v>{v}</v></c>')
            else:
                style = ' s="1"' if r == 1 else ''
                cells.append(f'<c r="{ref}" t="inlineStr"{style}><is><t xml:space="preserve">{esc(v)}</t></is></c>')
        out.append(f'<row r="{r}">' + ''.join(cells) + '</row>')
    out.append('</sheetData></worksheet>')
    return ''.join(out)


def write_xlsx(path, sheets):
    """Minimale, gueltige xlsx-Mappe: ZIP aus den noetigen XML-Teilen."""
    names = [n for n, _ in sheets]
    content = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + ''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                  for i in range(1, len(names) + 1))
        + '</Types>'
    ][0]

    workbook = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
                + ''.join(f'<sheet name="{esc(n)}" sheetId="{i}" r:id="rId{i}"/>' for i, n in enumerate(names, 1))
                + '</sheets></workbook>')

    wb_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
               '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
               + ''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>'
                         for i in range(1, len(names) + 1))
               + f'<Relationship Id="rId{len(names)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
               '</Relationships>')

    root_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                 '</Relationships>')

    # Zwei Formate: normal und fett fuer die Kopfzeile.
    styles = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
              '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
              '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>'
              '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
              '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
              '<borders count="1"><border/></borders>'
              '<cellStyleXfs count="1"><xf/></cellStyleXfs>'
              '<cellXfs count="2"><xf xfId="0"/><xf xfId="0" fontId="1" applyFont="1"/></cellXfs>'
              '</styleSheet>')

    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content)
        z.writestr('_rels/.rels', root_rels)
        z.writestr('xl/workbook.xml', workbook)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels)
        z.writestr('xl/styles.xml', styles)
        for i, (_, rows) in enumerate(sheets, 1):
            z.writestr(f'xl/worksheets/sheet{i}.xml', sheet_xml(rows))


# --------------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description='Aggregierter Mobilitätsexport für Transdev und traffiQ')
    ap.add_argument('--ledger', help='JSON-Export des App-Ledgers (optional)')
    ap.add_argument('--out', default=os.path.join(REPO, 'exports', 'mainsam-mobilitaetsexport.xlsx'))
    a = ap.parse_args()

    auslastung, ausl_unterdrueckt = sheet_auslastung()
    haltestellen, halt_gesamt = sheet_haltestellen()
    mainsam, mainsam_unterdrueckt, mainsam_da = sheet_mainsam(a.ledger)

    stats = {
        'auslastung_unterdrueckt': ausl_unterdrueckt,
        'mainsam_unterdrueckt': mainsam_unterdrueckt,
        'mainsam_vorhanden': mainsam_da,
        'haltestellen_gesamt': halt_gesamt,
        'haltestellen_top': len(haltestellen) - 1,
    }

    write_xlsx(a.out, [
        ('Hinweise', sheet_hinweise(stats)),
        ('Auslastung', auslastung),
        ('Tagesgang', sheet_tagesgang()),
        ('Haltestellen', haltestellen),
        ('Mainsam-Fahrten', mainsam),
    ])

    print(f'geschrieben: {a.out}')
    print(f'  Auslastung      {len(auslastung) - 1} Zeilen, davon {ausl_unterdrueckt} unterdrückt (n < {K_MIN})')
    print(f'  Tagesgang       24 Stunden')
    print(f'  Haltestellen    {len(haltestellen) - 1} von {halt_gesamt}')
    print(f'  Mainsam-Fahrten {len(mainsam) - 1} Zeilen'
          + (f', {mainsam_unterdrueckt} unterdrückt' if mainsam_da else ' (kein Ledger übergeben)'))


if __name__ == '__main__':
    main()
