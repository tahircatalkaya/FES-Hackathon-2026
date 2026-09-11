"""Read-only partner connectivity report. Never prints or persists credentials."""
import argparse
from datetime import datetime,timezone
import json
from pathlib import Path
import re
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/generated'
BASE='https://app-foodsharing-hackathon.azurewebsites.net'

def request(url,headers=None,body=None):
    payload=None if body is None else json.dumps(body).encode()
    req=Request(url,data=payload,headers={'Accept':'application/json','Content-Type':'application/json',**(headers or {})})
    with urlopen(req,timeout=15) as response: return json.load(response)

def run(auth=False):
    OUT.mkdir(parents=True,exist_ok=True)
    report={'checked_at':datetime.now(timezone.utc).isoformat(),'writes':False,'checks':{}}
    for name,path in [('openapi','/openapi.json'),('fairteiler','/food-share-points')]:
        try:
            result=request(BASE+path)
            report['checks'][name]={'ok':True,'version':result['info']['version']} if name=='openapi' else {'ok':True,'count':len(result)}
            (OUT/('foodsharing-openapi.json' if name=='openapi' else 'fairteiler.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        except (HTTPError,URLError,TimeoutError) as err: report['checks'][name]={'ok':False,'error':type(err).__name__}
    if auth:
        # Only Team 01; do not expose any other credentials possibly in the file.
        content=(ROOT/'Foodsharing API/KEYS.txt').read_text(encoding='utf-8-sig')
        matches=set(re.findall(r'\bteam_01_[A-Za-z0-9_-]+',content))
        if len(matches)!=1: report['checks']['users']={'ok':False,'error':'expected_one_team_01_key'}
        else:
            headers={'X-API-Key':next(iter(matches))}
            try:
                users=request(BASE+'/users',headers)
                safe=[]
                for user in users:
                    selected=request(BASE+'/users/me',{**headers,'X-User-ID':str(user['id'])})
                    history=request(BASE+'/users/me/pickups?limit=1&offset=0',{**headers,'X-User-ID':str(user['id'])})
                    safe.append({'id':user['id'],'team_id':user['team_id'],'is_default':user['is_default'],
                                 'selected_correctly':selected['id']==user['id'],
                                 'is_verified':user['verification']['is_verified'],
                                 'may_earn_rewards':user['verification']['may_earn_rewards'],
                                 'trial_pickups_required':user['verification']['trial_pickups_required'],
                                 'history_sample_count':len(history)})
                report['checks']['users']={'ok':True,'users':safe}
            except (HTTPError,URLError,TimeoutError) as err: report['checks']['users']={'ok':False,'error':type(err).__name__}
    try:
        result=request('https://colugo.vytal.org/',{'Authorization':'ANONYMOUS'},{
            'query':'query ($query: String!, $user_location: LonLatIn, $limit: Int, $offset: Int, $filter: VytalStoreFilter) { storeSearch(query: $query, user_location: $user_location, limit: $limit, offset: $offset, filter: $filter) { id name lonlat { latitude longitude } store { type location_name } } }',
            'variables':{'query':'','user_location':{'latitude':50.1109,'longitude':8.6821},'limit':20,'offset':0,'filter':{}}})
        if result.get('errors'): report['checks']['vytal_public_stores']={'ok':False,'error':'graphql_errors'}
        else:
            stores=result['data']['storeSearch']
            report['checks']['vytal_public_stores']={'ok':True,'count':len(stores)}
            (OUT/'vytal-stores.json').write_text(json.dumps(stores,ensure_ascii=False,indent=2),encoding='utf-8')
    except (HTTPError,URLError,TimeoutError) as err: report['checks']['vytal_public_stores']={'ok':False,'error':type(err).__name__}
    (OUT/'partner-probe.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--auth',action='store_true'); args=parser.parse_args(); run(args.auth)
