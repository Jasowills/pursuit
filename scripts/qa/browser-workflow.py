"""Real browser → isolated API → disposable Postgres. No model or mail mocks."""
import json,time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
OUT=Path('docs/qa/evidence');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(); page=b.new_page(viewport={'width':1440,'height':1000})
 # Forward the retained web client's API origin to the disposable real Nest API.
 page.route('http://127.0.0.1:400{0,1}/api/v1/**',lambda r:r.fulfill(response=r.fetch(url=r.request.url.replace(':4000',':4401').replace(':4001',':4401'))))
 page.goto('http://127.0.0.1:3001/app/login');page.wait_for_load_state('networkidle');page.get_by_label('Email',exact=True).fill(f'qa-browser-{int(time.time())}@pursuit.test');page.get_by_label('Display name',exact=True).fill('QA Browser Tester');page.get_by_role('button',name='Open the casebook').click();page.wait_for_url('**/app')
 token=page.evaluate("localStorage.getItem('pursuit_dev_token')");headers={'Authorization':f'Bearer {token}'}
 page.goto('http://127.0.0.1:3001/app/watchers');page.get_by_placeholder('https://acme.com/careers').fill('https://example.com/qa-careers');page.get_by_role('button',name='Add watcher').click();expect(page.get_by_text('https://example.com/qa-careers',exact=True)).to_be_visible();page.reload();expect(page.get_by_text('https://example.com/qa-careers',exact=True)).to_be_visible()
 rows=page.request.get('http://127.0.0.1:4401/api/v1/watchers',headers=headers).json()['items'];assert any(r['source_url']=='https://example.com/qa-careers' for r in rows)
 page.screenshot(path=str(OUT/'watcher-persistence.png'))
 # Normal read-only Greenhouse source import; no scraping attacks or application submission.
 sourced=page.request.post('http://127.0.0.1:4401/api/v1/workflow/discover',headers=headers,data={'board':'cloudflare'},timeout=30000)
 source_body=sourced.json();source_result={'status':sourced.status,'body':{k:source_body[k] for k in ['total_available','imported','limit']} if sourced.ok else source_body};(OUT/'source-import.json').write_text(json.dumps(source_result,indent=2))
 assert sourced.ok,source_result
 jobs=page.request.get('http://127.0.0.1:4401/api/v1/jobs',headers=headers).json()['items'];assert len(jobs)>0
 page.goto('http://127.0.0.1:3001/app/workflow');expect(page.get_by_role('heading',name='Discover',exact=True)).to_be_visible();page.screenshot(path=str(OUT/'workflow-imported.png'))
 gmail=page.request.get('http://127.0.0.1:4401/api/v1/connections/gmail',headers=headers);assert gmail.ok
 negative=[]
 for path in ['direct','composio']:
  r=page.request.post('http://127.0.0.1:4401/api/v1/connections/gmail',headers=headers,data={'path':path});assert not r.ok;negative.append({'path':path,'status':r.status,'body':r.json()})
 (OUT/'browser-result.json').write_text(json.dumps({'login':'passed','watcher_persistence':'passed','source_status':sourced.status,'jobs_persisted':len(jobs),'gmail_unconfigured':negative},indent=2));b.close()
 print('Real browser login, watcher persistence, Greenhouse import and unconfigured Gmail guards passed.')
