"""Preserve every non-heading request passage with source line and planning status.

Usage: python tools/build_requirements.py path/to/latest-pasted-request.txt
The matrix is a coverage register, not a claim that each item has shipped.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
MODULE={6:'Foodsharing',7:'Foodsharing',8:'Vytal',9:'Transdev',10:'traffiQ',11:'FES'}
SOURCE={3:'Gesamtaufgabe.pdf S.1–2; Eröffnung Folien 8–10',5:'Gesamtaufgabe.pdf S.2 + Produktwunsch',6:'Gesprächsbriefing laut Auftrag; Foodsharing API',7:'Foodsharing API/API-GUIDE.md und SCHEMA.md; OpenAPI 2.4.0',8:'Gesamtaufgabe.pdf S.5–6; Vytal-Notion',9:'Gesamtaufgabe.pdf S.3–4; Mobilitätsdaten/docs/DATENKATALOG.md',10:'Gesamtaufgabe.pdf S.10–13; Dateninventar',11:'Gesamtaufgabe.pdf S.7',12:'Gesamtaufgabe.pdf S.2; Produktvorschlag',13:'Produktwunsch; Gesamtaufgabe.pdf S.2',14:'Gesamtaufgabe.pdf S.13',15:'Gesamtaufgabe.pdf S.13; UBA',21:'Eröffnung Folien 8–10'}
PLAN={1:'Zuständigkeit und Arbeitsstand dokumentieren',2:'Originalquelle prüfen und Befund/Abweichung festhalten',3:'Demo gegen Jurykriterien abnehmen',4:'Nutzerproblem im Pilot prüfen',5:'Gemeinsame Shell, Design und Übersetzungsschlüssel',6:'Foodsharing-Journey im zugeordneten Fachmodul',7:'Serverseitiger Adapter und Vertrags-/Berechtigungstests',8:'Storeadapter und kanonischer Ausleihzyklus',9:'Fahrtsitzung und ausdrücklich gekennzeichnete Erkennungsfixtures',10:'Begrenzte serverseitige Aggregation mit Herkunft',11:'Lerninhalt und Organisatorbestätigung',12:'Zentrales Regelwerk mit Budget-/Missbrauchsgrenzen',13:'Freiwillige soziale Teilnahme und finanzierter Rewardprozess',14:'Idempotentes Journal und berechtigter Nachweis',15:'Versionierte Vergleichsrechnung mit unbekannt/negativ',16:'Zentrale Historie und Benachrichtigungs-Outbox',17:'Modulare Verträge und später freigegebene Datenbank',18:'Sechs klar abgegrenzte Übergaben und menschliche Zuordnung',19:'Kern priorisieren, übrige Anforderungen behalten',20:'Risikoorientierte Abnahme, Ergebnis nicht behaupten',21:'Demo-/Pitchdrehbuch und Pilothypothesen',22:'Nachvollziehbare Artefakte und Statuspflege',23:'Quellenprüfung und erste ausführbare gemeinsame Referenz'}

def build(source):
    text=Path(source).read_text(encoding='utf-8-sig')
    (ROOT/'docs/AUFTRAG_SNAPSHOT.md').write_text(text,encoding='utf-8')
    rows=[];section=0;title='Einleitung';counts=Counter();fence=False
    for number,line in enumerate(text.splitlines(),1):
        stripped=line.strip()
        if not stripped:continue
        if stripped.startswith('## '):
            m=re.match(r'## (\d+)\. (.*)',stripped)
            if m:section=int(m[1]);title=m[2]
            continue
        if stripped.startswith('#'):continue
        if stripped.startswith('```'):fence=not fence;continue
        if re.fullmatch(r'\|[-: |]+\|',stripped):continue
        counts[section]+=1
        module=MODULE.get(section,'Plattform / Gesamtkoordination')
        future=any(w in stripped.lower() for w in ('langfrist','prognos','forecast','finanzierung','top 100','top-100','freund','benachrichtigung','push','nfc','bilderkennung','warteliste','teilreservierung','mainlastenrad','echte rewards','hintergrundortung'))
        stage='Nächste Ausbaustufe' if future or section in (13,16) else 'Vorführbarer Kern'
        if any(w in stripped.lower() for w in ('langfristige vision','automatische streichung','prognosegüte')):stage='Langfristige Vision'
        source_type='Nutzerauftrag / Produktwunsch'
        if section in (6,9) and any(w in stripped.lower() for w in ('partnergespräch','berichteten','whatsapp','rewe')):source_type='Berichtetes Partnergespräch (nicht unabhängig bestätigt)'
        if section in (2,7,10):source_type='Auftrag mit Quellen-/Datenbehauptung; Gegenprüfung erforderlich'
        row={'id':f'R{section:02}-{counts[section]:03}','section':title,'source':f'AUFTRAG_SNAPSHOT.md:{number}',
             'source_type':source_type,'official_cross_reference':SOURCE.get(section,'Aktueller Nutzerauftrag'),
             'partner':module,'requirement':stripped,'user_problem':title,'data':'Siehe ENTSCHEIDUNGEN.md und generated/*audit.json; keine ungeprüfte Verfügbarkeitszusage',
             'implementation':PLAN.get(section,'Qualitätsanspruch ohne Erfolgsgarantie erfüllen'),
             'owner':module+'; Person offen','priority':'P1' if stage=='Vorführbarer Kern' else 'P2' if stage=='Nächste Ausbaustufe' else 'P3',
             'stage':stage,'status':'spezifiziert' if stage=='Vorführbarer Kern' else 'später','environment':'Noch kein pauschaler Funktionsnachweis',
             'acceptance':'Die vollständige Anforderung dieser Zeile im zugeordneten Modul nachweisen; Test oder begründete Verschiebung im Prüfprotokoll verlinken. Details: VERTRAEGE.md, REWARDS_UND_WIRKUNG.md und STATUS_UND_TESTS.md.'}
        rows.append(row)
    (ROOT/'docs/anforderungen.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
    lines=['# Vollständiges Anforderungsregister','',f'{len(rows)} Textpassagen aus dem tatsächlich eingegangenen Auftrag. Jede nichtleere Inhaltszeile ist erhalten (Absätze, Listenpunkte, Tabellenzeilen und Formelzeilen). Tabellenköpfe bleiben bewusst mitgeführt. Mehrteilige Absätze behalten alle Teilanforderungen; dies ist ein Abdeckungsregister und noch keine atomisierte Testfallsuite.','',
           'Der konkrete, geprüfte Funktionsstand steht in [STATUS_UND_TESTS.md](STATUS_UND_TESTS.md). **spezifiziert** bedeutet hier: in Planung/Vertrag erfasst, nicht vollständig implementiert. **später** bezeichnet eine begründete Ausbaupriorität. Die maschinenlesbare [anforderungen.json](anforderungen.json) enthält zusätzlich Datenlage, Quelle/Fundstelle, Nutzerproblem, Eigentümer, Umsetzung und Abnahme. Noch nicht zugewiesene Fachmodule werden nicht als geliefert behauptet.','',
           'Abnahmebedingung pro Eintrag: alle im Originaltext enthaltenen Muss-/Fehlerfälle nachweisen; je nach Gegenstand durch Quellenbeleg, Vertrag, Fachtest oder tatsächlichen Gerätetest. Keine Quellenbehauptung allein gilt als bestandener Test. Priorisierung ist ein Vorschlag, Verschiebungsgrund ist Zeitbedarf und die in ENTSCHEIDUNGEN.md genannte externe/organisatorische Abhängigkeit.','',
           '| ID / Quelle | Partner / Verantwortlichkeit | Priorität / Stufe / Status | Vollständige Anforderung |','|---|---|---|---|']
    for r in rows:
        req=r['requirement'].replace('|','\\|').replace('<','&lt;').replace('>','&gt;')
        lines.append(f"| {r['id']} · {r['source']} | {r['owner']} | {r['priority']} · {r['stage']} · {r['status']} | {req} |")
    (ROOT/'docs/ANFORDERUNGEN.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps({'passages':len(rows),'sections':dict(counts),'stages':dict(Counter(r['stage'] for r in rows))}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source');build(parser.parse_args().source)
