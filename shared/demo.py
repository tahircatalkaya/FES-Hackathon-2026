"""Run `python -m shared.demo`; no partner writes, no real reward entitlement."""
from datetime import datetime,timezone
import json
from pathlib import Path
from .contracts import EvidenceEvent
from .ledger import Ledger

def run(path=Path('.runtime/demo.sqlite')):
    ledger=Ledger(path)
    event=EvidenceEvent(event_id='demo-receipt-v1',partner='vytal',environment='local_demo',
        action_key='demo:container-1:user-demo:checkout-1',user_id='demo',action='vytal.return',
        occurred_at=datetime.now(timezone.utc).isoformat(),source='own_fixture',
        evidence_status='confirmed',reason='Eigene Simulation eines abgeschlossenen Ausleihzyklus')
    first=ledger.accept(event,'demo'); replay=ledger.accept(event,'demo')
    return {'environment':'local_demo','first':{'points':first['points'],'duplicate':first['duplicate']},
            'replay':{'points_added':0,'duplicate':replay['duplicate']},
            'account':ledger.account('demo')}

if __name__=='__main__': print(json.dumps(run(),ensure_ascii=False,indent=2))
