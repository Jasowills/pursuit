"""Real Expo web UI with isolated HTTP fixtures; no external actions.
Serve apps/mobile/web-dist on port 4183 after pnpm --filter @pursuit/mobile export:web.
This is not native iOS/Android runtime qualification.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect
out=Path(__file__).resolve().parents[2] / '.impeccable/review/continuous-story';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(); page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("localStorage.setItem('pursuit_dev_token','isolated-ui-fixture')")
 fixtures={'profile':{'user':{'display_name':'Alex Morgan','email':'alex@example.test'},'tenant_id':'fixture-only','profile':{'location':'London','role_families':['Design']}},'applications':{'items':[{'id':'a','job_title':'Senior Product Designer','company_name':'Northstar','status':'READY_FOR_REVIEW'},{'id':'b','job_title':'Product Designer','company_name':'Fieldstone','status':'SUBMITTED'}]},'agent/runs':{'items':[{'id':'r','goal':'Research design roles','status':'RUNNING'}]},'watchers':{'items':[{'id':'w','enabled':True}]},'notifications':{'items':[{'id':'n','read_at':None}]}}
 def api(route):
  key=route.request.url.split('/api/v1/')[-1];route.fulfill(status=200,json=fixtures.get(key,{'items':[]}))
 page.route('**/api/v1/**',api);page.goto('http://127.0.0.1:4183/');expect(page.get_by_text('Today, Alex',exact=True)).to_be_visible();expect(page.get_by_text('1 task running',exact=True)).to_be_visible();page.screenshot(path=str(out/'native-web-phone.png'))
 page.get_by_role('button',name='Review opportunities',exact=True).click();expect(page.get_by_text('Jobs',exact=True).first).to_be_visible()
 page.get_by_role('tab',name='Today',exact=True).click();expect(page.get_by_text('Today, Alex',exact=True)).to_be_visible()
 page.set_viewport_size({'width':820,'height':1180});page.screenshot(path=str(out/'native-web-tablet.png'))
 fixtures['agent/runs']=None
 page.route('**/api/v1/agent/runs',lambda r:r.fulfill(status=503,json={'error':'Fixture service unavailable'}));page.reload();expect(page.get_by_text('Fixture service unavailable',exact=True)).to_be_visible();page.screenshot(path=str(out/'native-web-error.png'))
 assert not errors,errors;b.close();print('PASS: real Expo web app with isolated HTTP fixtures; home, navigation and run-error state. Not iOS/Android runtime qualification.')
