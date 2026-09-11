from contextlib import closing
import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from shared.ledger import Ledger
from shared.server import handler

class ServerTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.ledger=Ledger(Path(self.tmp.name)/'test.sqlite')
        self.server=ThreadingHTTPServer(('127.0.0.1',0),handler(self.ledger,0));self.port=self.server.server_port
        self.server.RequestHandlerClass=handler(self.ledger,self.port)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
    def call(self,path,body=None,origin=True):
        headers={}
        if body is not None:
            headers['Content-Type']='application/json'
            if origin:headers['Origin']=f'http://127.0.0.1:{self.port}'
        with closing(http.client.HTTPConnection('127.0.0.1',self.port,timeout=5)) as connection:
            connection.request('GET' if body is None else 'POST',path,None if body is None else json.dumps(body),headers)
            response=connection.getresponse();return response.status,response.read()
    def test_cannot_serve_secrets_or_repository_files(self):
        for path in ('/Foodsharing%20API/KEYS.txt','/../README.md','/shared/ledger.py','/.git/config'):
            self.assertEqual(self.call(path)[0],404)
    def test_client_cannot_submit_user_or_points(self):
        self.assertEqual(self.call('/api/demo/evidence',{'fixture':'return','user_id':'other','points':999})[0],400)
        self.assertEqual(self.ledger.account('demo')['earned'],0)
    def test_cross_origin_write_denied(self):
        self.assertEqual(self.call('/api/demo/evidence',{'fixture':'return'},origin=False)[0],403)
    def test_fixture_roundtrip_and_replay(self):
        first=json.loads(self.call('/api/demo/evidence',{'fixture':'return'})[1])
        second=json.loads(self.call('/api/demo/evidence',{'fixture':'return'})[1])
        self.assertEqual(first['points_added'],10);self.assertTrue(second['duplicate']);self.assertEqual(second['points_added'],0)
        account=json.loads(self.call('/api/account')[1]);self.assertEqual(account['earned'],10);self.assertEqual(account['redeemable'],0)
    def test_unverified_foodsharing_has_no_award(self):
        result=json.loads(self.call('/api/demo/evidence',{'fixture':'pickup'})[1]);self.assertEqual(result['points_added'],0)
        self.assertEqual(result['reason'],'partner_reward_eligibility_missing')

if __name__=='__main__':unittest.main()
