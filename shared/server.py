"""Loopback-only integration harness. No partner credentials or partner writes.

Run: python -m shared.server --port 8765
Only named fixtures can be submitted. Never expose this development server.
"""
import argparse
import csv
from datetime import datetime,timezone
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo
from .contracts import EvidenceEvent
from .ledger import Ledger

ROOT=Path(__file__).resolve().parents[1]
ASSETS={'/':('index.html','text/html'),'/app.js':('app.js','text/javascript'),'/style.css':('style.css','text/css'),'/chameleon.svg':('chameleon.svg','image/svg+xml'),'/gecko.svg':('gecko.svg','image/svg+xml'),'/fes-logo.svg':('fes-logo.svg','image/svg+xml')}
FIXTURES={
    'learn':('fes','fes.quiz','confirmed',True),
    'return':('vytal','vytal.return','confirmed',True),
    'pickup':('foodsharing','foodsharing.basket_pickup','confirmed',False),
    'ride':('transdev','transdev.journey','plausible',True),
    'bin_bingo':('fes','fes.bin_bingo','self_reported',True),
    'bio_check':('fes','fes.bio_check','self_reported',True),
}
DAILY_FIXTURES={'bin_bingo','bio_check'}

def catalog():
    generated=ROOT/'docs/generated'
    def read(name,default):
        try:return json.loads((generated/name).read_text(encoding='utf-8-sig'))
        except (FileNotFoundError,json.JSONDecodeError):return default
    points=read('fairteiler.json',[])
    stores=read('vytal-stores.json',[])
    probe=read('partner-probe.json',{})
    with (ROOT/'Mobilitätsdaten/tagesgang_avg.csv').open(encoding='utf-8-sig') as f:
        rows=list(csv.DictReader(f,delimiter=';'))
    return {'points':points,'stores':stores,'retrieved_at':probe.get('checked_at'),
            'hours':[{'hour':int(r['stunde']),'requests':float(r['anfragen_durchschnittstag'].replace(',','.'))} for r in rows]}

def handler(ledger,port):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def allowed_host(self):return self.headers.get('Host') in (f'127.0.0.1:{port}',f'localhost:{port}')
        def respond(self,data,status=200,kind='application/json'):
            if kind=='application/json':data=json.dumps(data,ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header('Content-Type',kind+'; charset=utf-8')
            self.send_header('Content-Length',str(len(data)))
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('Referrer-Policy','no-referrer')
            self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src https://www.openstreetmap.org; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'")
            self.end_headers();self.wfile.write(data)
        def do_GET(self):
            if not self.allowed_host():return self.respond({'error':'host_denied'},403)
            path=urlsplit(self.path).path
            if path in ASSETS:
                filename,mime=ASSETS[path];return self.respond((ROOT/'shared/web'/filename).read_bytes(),kind=mime)
            if path=='/api/account':return self.respond(ledger.account('demo'))
            if path=='/api/catalog':return self.respond(catalog())
            return self.respond({'error':'not_found'},404)
        def do_POST(self):
            if not self.allowed_host():return self.respond({'error':'host_denied'},403)
            if self.headers.get('Origin') not in (f'http://127.0.0.1:{port}',f'http://localhost:{port}'):
                return self.respond({'error':'origin_denied'},403)
            if self.headers.get('Content-Type')!='application/json':return self.respond({'error':'json_required'},415)
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=256: return self.respond({'error':'invalid_size'},413)
                body=json.loads(self.rfile.read(length))
                if not isinstance(body,dict) or set(body)!={'fixture'} or body['fixture'] not in FIXTURES:
                    return self.respond({'error':'fixture_required'},400)
                if urlsplit(self.path).path!='/api/demo/evidence':return self.respond({'error':'not_found'},404)
                fixture=body['fixture'];partner,action,evidence,eligible=FIXTURES[fixture]
                if fixture in DAILY_FIXTURES:
                    day=datetime.now(timezone.utc).astimezone(ZoneInfo('Europe/Berlin')).date().isoformat()
                    key=f'demo:{fixture}:{day}:v1'
                else:
                    key=f'demo:{fixture}:v1'
                event=EvidenceEvent(event_id=key,partner=partner,environment='local_demo',
                    action_key=key,user_id='demo',action=action,
                    occurred_at=datetime.now(timezone.utc).isoformat(),source='own_fixture',
                    evidence_status=evidence,reason='Own integration fixture; no real action or environmental claim',reward_eligible=eligible)
                result=ledger.accept(event,'demo')
                return self.respond({'duplicate':result['duplicate'],'points_added':0 if result['duplicate'] else result['points'],
                                     'decision':result['decision'],'reason':result['reason']})
            except (ValueError,TypeError):return self.respond({'error':'invalid_request'},400)
    return Handler

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=int(os.environ.get('PORT','8765')));parser.add_argument('--db',default='.runtime/web-demo.sqlite');args=parser.parse_args()
    ledger=Ledger(args.db)
    server=ThreadingHTTPServer(('127.0.0.1',args.port),handler(ledger,args.port))
    print(f'Local integration demo: http://127.0.0.1:{args.port}',flush=True)
    server.serve_forever()

if __name__=='__main__':main()
