import concurrent.futures
from contextlib import closing
from dataclasses import replace
from datetime import datetime, timedelta, timezone
import sqlite3
import tempfile
from pathlib import Path
import unittest
from shared.contracts import EvidenceEvent
from shared.ledger import Ledger
from shared.impact import Leg, comparison

NOW=datetime(2026,9,11,19,0,tzinfo=timezone.utc)
def example(**changes):
    return replace(EvidenceEvent(event_id='receipt-1',partner='vytal',environment='local_demo',
        action_key='container-1:user-1:checkout-1',user_id='user-1',action='vytal.return',
        occurred_at=NOW.isoformat(),source='own_fixture',evidence_status='confirmed',reason='Simulated return cycle'),**changes)

class LedgerTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.path=Path(self.tmp.name)/'ledger.sqlite'; self.ledger=Ledger(self.path)
    def tearDown(self): self.tmp.cleanup()
    def accept(self,e): return self.ledger.accept(e,e.user_id,now=NOW)
    def test_concurrent_replay_and_new_rule_do_not_pay_twice(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results=list(pool.map(lambda _:self.accept(example()),range(32)))
        self.assertEqual(sum(not r['duplicate'] for r in results),1)
        self.assertTrue(Ledger(self.path,'demo-v2').accept(example(event_id='other-receipt'),'user-1',NOW)['duplicate'])
        self.assertEqual(self.ledger.account('user-1')['earned'],10)
    def test_new_container_cycle_is_retained_but_daily_cap_applies(self):
        self.accept(example()); r=self.accept(example(action_key='container-1:user-1:checkout-2'))
        self.assertFalse(r['duplicate']); self.assertEqual(r['reason'],'limit_reached')
        self.assertEqual(len(self.ledger.account('user-1')['history']),2)
    def test_next_day_cycle_is_eligible_and_weekly_cap_applies(self):
        for i in range(5):
            moment=NOW+timedelta(days=i)
            self.ledger.accept(example(action_key=f'cycle-{i}',occurred_at=moment.isoformat()),'user-1',moment)
        # Fri-Sun reaches 30 in W37; Mon-Tue 20 in W38.
        self.assertEqual(self.ledger.account('user-1')['earned'],50)
    def test_identity_and_environment_boundaries(self):
        with self.assertRaises(PermissionError): self.ledger.accept(example(),'attacker',NOW)
        with self.assertRaises(PermissionError): self.accept(example(environment='production'))
        self.accept(example())
        with self.assertRaises(PermissionError): self.accept(example(user_id='attacker'))
        self.assertEqual(self.ledger.account('attacker')['earned'],0)
        self.assertEqual(self.ledger.account('user-1','partner_sandbox')['earned'],0)
    def test_pending_and_unverified_do_not_pay(self):
        self.accept(example(evidence_status='pending'))
        self.assertEqual(self.ledger.account('user-1')['earned'],0)
        self.assertEqual(self.ledger.account('user-1')['pending'],10)
        r=self.accept(example(partner='foodsharing',action='foodsharing.basket_pickup',action_key='pickup-1'))
        self.assertEqual(r['reason'],'partner_reward_eligibility_missing')
    def test_future_and_old_imports_need_review(self):
        for i,difference in enumerate((timedelta(days=-3),timedelta(hours=2))):
            self.assertEqual(self.accept(example(action_key=f'late-{i}',occurred_at=(NOW+difference).isoformat()))['decision'],'pending')
    def test_reversal_is_idempotent_and_journal_immutable(self):
        event=self.accept(example())
        with self.assertRaises(PermissionError): self.ledger.reverse(event['id'],'correction')
        self.ledger.reverse(event['id'],'invalid evidence',admin=True)
        self.ledger.reverse(event['id'],'retry',admin=True)
        self.assertEqual(self.ledger.account('user-1')['earned'],0)
        self.assertTrue(self.accept(example())['duplicate'])
        with closing(self.ledger.connect()) as db:
            with self.assertRaises(sqlite3.IntegrityError): db.execute('DELETE FROM journal')
    def test_concurrent_new_events_respect_cap(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(lambda i:self.accept(example(action_key=f'cycle-{i}')),range(30)))
        self.assertEqual(self.ledger.account('user-1')['earned'],10)
    def test_same_berlin_day_with_different_utc_offset(self):
        self.accept(example())
        self.assertEqual(self.accept(example(action_key='cycle-2',occurred_at='2026-09-11T21:00:00+02:00'))['points'],0)
    def test_required_fields_and_timezone(self):
        for e in (example(action_key=''),example(occurred_at='2026-09-11T19:00:00'),example(quantity=float('nan'),unit='kg')):
            with self.assertRaises(ValueError): self.accept(e)

class ImpactTest(unittest.TestCase):
    def test_unknown_is_not_zero(self):
        self.assertIsNone(comparison(Leg(2,None,None,None),[Leg(2,3,'fixture','same')])['kg_co2e'])
    def test_negative_difference_and_multileg(self):
        r=comparison(Leg(2,0,'test-only','same'),[Leg(1,50,'test-only','same'),Leg(1,100,'test-only','same')])
        self.assertAlmostEqual(r['kg_co2e'],-.15)
    def test_incompatible_boundaries(self):
        self.assertIsNone(comparison(Leg(2,100,'fixture','energy'),[Leg(2,50,'fixture','lifecycle')])['kg_co2e'])

if __name__=='__main__': unittest.main()
