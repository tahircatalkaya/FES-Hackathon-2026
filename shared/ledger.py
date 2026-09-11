"""SQLite reference ledger, serialized writes, immutable evidence and reversals.

Call only from trusted server adapters after identity and evidence verification.
No public HTTP endpoint accepts EvidenceEvent. All demo points are nonredeemable.
"""
from contextlib import closing
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sqlite3
from zoneinfo import ZoneInfo
from .contracts import EvidenceEvent

# Product assumptions, not official partner rates: points, daily cap, weekly cap.
RULES = {
    'vytal.return':(10,10,30,'confirmed'),
    'foodsharing.basket_pickup':(10,10,30,'confirmed'),
    'foodsharing.business_pickup':(15,15,30,'confirmed'),
    'foodsharing.fairteiler_give':(2,2,6,'self_reported'),
    'foodsharing.fairteiler_take':(2,2,6,'self_reported'),
    'fes.cleanup':(15,15,30,'confirmed'),
    'fes.spontaneous':(2,2,6,'self_reported'),
    'fes.quiz':(3,3,9,'confirmed'),
    'foodsharing.stock_update':(1,1,3,'self_reported'),
    'transdev.journey':(5,5,15,'plausible'),
}
LEVELS={'rejected':-1,'unmatched':-1,'pending':0,'self_reported':1,'plausible':2,'confirmed':3}

SCHEMA='''
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS events(
 id INTEGER PRIMARY KEY, partner TEXT NOT NULL, environment TEXT NOT NULL,
 action_key TEXT NOT NULL, user_id TEXT NOT NULL, action TEXT NOT NULL,
 occurred_at TEXT NOT NULL, received_at TEXT NOT NULL, day TEXT NOT NULL, week TEXT NOT NULL,
 payload TEXT NOT NULL, decision TEXT NOT NULL, reason TEXT NOT NULL,
 rule_version TEXT NOT NULL, points INTEGER NOT NULL CHECK(points>=0),
 UNIQUE(partner,environment,action_key));
CREATE TABLE IF NOT EXISTS journal(
 id INTEGER PRIMARY KEY, event_id INTEGER NOT NULL REFERENCES events(id),
 user_id TEXT NOT NULL, delta INTEGER NOT NULL, kind TEXT NOT NULL,
 reason TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(event_id,kind));
CREATE TRIGGER IF NOT EXISTS immutable_journal_update BEFORE UPDATE ON journal
 BEGIN SELECT RAISE(ABORT,'journal_is_append_only'); END;
CREATE TRIGGER IF NOT EXISTS immutable_journal_delete BEFORE DELETE ON journal
 BEGIN SELECT RAISE(ABORT,'journal_is_append_only'); END;
CREATE TRIGGER IF NOT EXISTS immutable_event_update BEFORE UPDATE ON events
 BEGIN SELECT RAISE(ABORT,'event_is_immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_event_delete BEFORE DELETE ON events
 BEGIN SELECT RAISE(ABORT,'event_is_immutable'); END;
'''

class Ledger:
    def __init__(self, path, rule_version='demo-v1'):
        self.path=str(path); self.rule_version=rule_version
        Path(path).parent.mkdir(parents=True,exist_ok=True)
        with closing(self.connect()) as db: db.executescript(SCHEMA)

    def connect(self):
        db=sqlite3.connect(self.path,timeout=20)
        db.row_factory=sqlite3.Row
        db.execute('PRAGMA foreign_keys=ON')
        return db

    def accept(self,event:EvidenceEvent,principal:str,now:datetime|None=None):
        occurred=event.validate(principal)
        if event.environment=='production': raise PermissionError('production_disabled_in_reference')
        if event.action not in RULES or not event.action.startswith(event.partner+'.'):
            raise ValueError('unsupported_action')
        now=now or datetime.now(timezone.utc)
        if now.tzinfo is None: raise ValueError('timezone_required')
        local=occurred.astimezone(ZoneInfo('Europe/Berlin'))
        day=local.date().isoformat(); iso=local.isocalendar(); week=f'{iso.year}-W{iso.week:02}'
        with closing(self.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            existing=db.execute('SELECT * FROM events WHERE partner=? AND environment=? AND action_key=?',
                                (event.partner,event.environment,event.action_key)).fetchone()
            if existing:
                if existing['user_id']!=principal: raise PermissionError('event_already_claimed')
                if existing['action']!=event.action: raise ValueError('action_key_conflict')
                return {**dict(existing),'duplicate':True}
            base,dcap,wcap,minimum=RULES[event.action]
            points=0; decision='not_qualified'; reason='evidence_rejected'
            if occurred>now+timedelta(minutes=5) or occurred<now-timedelta(hours=24):
                decision='pending'; reason='outside_demo_time_window'
            elif LEVELS[event.evidence_status]<0: pass
            elif LEVELS[event.evidence_status]<LEVELS[minimum]:
                decision='pending'; reason='stronger_evidence_needed'
            elif event.partner=='foodsharing' and not event.reward_eligible:
                reason='partner_reward_eligibility_missing'
            else:
                # Count gross awards: reversing an award does not reopen farming capacity.
                args=(principal,event.environment)
                used=db.execute('SELECT action,day,week,points FROM events WHERE user_id=? AND environment=?',args).fetchall()
                ad=sum(r['points'] for r in used if r['action']==event.action and r['day']==day)
                aw=sum(r['points'] for r in used if r['action']==event.action and r['week']==week)
                gd=sum(r['points'] for r in used if r['day']==day)
                gw=sum(r['points'] for r in used if r['week']==week)
                points=max(0,min(base,dcap-ad,wcap-aw,50-gd,100-gw))
                decision='accepted' if points else 'not_qualified'
                reason='demo_progress_only' if points else 'limit_reached'
            payload=json.dumps(asdict(event),ensure_ascii=False,sort_keys=True)
            cursor=db.execute('INSERT INTO events(partner,environment,action_key,user_id,action,occurred_at,received_at,day,week,payload,decision,reason,rule_version,points) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                (event.partner,event.environment,event.action_key,principal,event.action,occurred.isoformat(),now.isoformat(),day,week,payload,decision,reason,self.rule_version,points))
            if points:
                db.execute('INSERT INTO journal(event_id,user_id,delta,kind,reason,created_at) VALUES(?,?,?,?,?,?)',
                           (cursor.lastrowid,principal,points,'award',reason,now.isoformat()))
            return {**dict(db.execute('SELECT * FROM events WHERE id=?',(cursor.lastrowid,)).fetchone()),'duplicate':False}

    def reverse(self,event_id:int,reason:str,*,admin:bool=False):
        if not admin: raise PermissionError('admin_required')
        if not reason.strip(): raise ValueError('reason_required')
        with closing(self.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute('SELECT * FROM journal WHERE event_id=? AND kind=?',(event_id,'award')).fetchone()
            if not row: raise ValueError('award_missing')
            db.execute('INSERT OR IGNORE INTO journal(event_id,user_id,delta,kind,reason,created_at) VALUES(?,?,?,?,?,?)',
                       (event_id,row['user_id'],-row['delta'],'reversal',reason,datetime.now(timezone.utc).isoformat()))

    def account(self,principal,environment='local_demo'):
        with closing(self.connect()) as db:
            rows=db.execute('SELECT e.id,e.action,e.occurred_at,e.decision,e.reason,e.points,e.environment,e.payload,COALESCE(SUM(j.delta),0) AS net_points FROM events e LEFT JOIN journal j ON j.event_id=e.id WHERE e.user_id=? AND e.environment=? GROUP BY e.id ORDER BY e.id DESC',(principal,environment)).fetchall()
            history=[dict(r) for r in rows]
            return {'earned':sum(r['net_points'] for r in history),'pending':sum(RULES[r['action']][0] for r in history if r['decision']=='pending'),
                    'redeemable':0,'environment':environment,'history':history}
