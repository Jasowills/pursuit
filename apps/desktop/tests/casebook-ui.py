"""Synthetic native IPC regression, separate from the unmocked product-tour captures."""
from playwright.sync_api import sync_playwright,expect
FIXTURE=r"""
globalThis.isTauri=true;window.__TAURI_INTERNALS__={invoke:async(cmd,args)=>{
 const k='career-book-test';const calls=JSON.parse(sessionStorage.getItem('calls')||'[]');calls.push({cmd,args});sessionStorage.setItem('calls',JSON.stringify(calls));
 if(cmd==='career_book')return sessionStorage.getItem(k);
 if(cmd==='save_career_book'){sessionStorage.setItem(k,args.body);return;}
 if(cmd==='managed_status')return {running:true,provider:'fixture-provider',model:'fixture-model',directory:'/fixture'};
 if(cmd==='managed_create')return 'ses_fixture';
 if(cmd==='managed_prompt')return;
 if(cmd==='managed_view')return {state:'completed',messages:[{role:'assistant',text:'Synthetic native contract response; no model was called.'}]};
 return null;
}};
"""
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':1440,'height':1000});page.add_init_script(FIXTURE);page.goto('http://127.0.0.1:1420');page.wait_for_load_state('networkidle')
 page.get_by_role('button',name='Opportunities',exact=True).click();page.get_by_role('button',name='Add job posting').click();page.get_by_label('Company',exact=True).fill('Local Example');page.get_by_label('Job title',exact=True).fill('Product Designer');page.get_by_label('Job posting',exact=True).fill('Design useful products.');page.get_by_role('button',name='Save opportunity').click()
 expect(page.locator('.cw-jobs')).to_contain_text('Local Example');page.reload();page.get_by_role('button',name='Opportunities',exact=True).click();expect(page.locator('.cw-jobs')).to_contain_text('Local Example')
 page.get_by_role('button',name='Your assistant',exact=True).click();page.get_by_label('Ask Pursuit or paste a job posting').fill('How many applications so far?');page.get_by_role('button',name='Send message',exact=True).click();expect(page.locator('.cw-thread')).to_contain_text('0 recorded applications')
 assert page.evaluate("JSON.parse(sessionStorage.getItem('calls')).filter(c=>c.cmd==='managed_prompt').length")==0
 page.get_by_role('button',name='New conversation',exact=True).click();expect(page.locator('.cw-welcome')).to_be_visible()
 page.get_by_label('Ask Pursuit or paste a job posting').fill('Help me draft an introduction.');page.get_by_role('button',name='Send message',exact=True).click();expect(page.locator('.cw-thread')).to_contain_text('Synthetic native contract response',timeout=6000)
 assert page.evaluate("JSON.parse(sessionStorage.getItem('calls')).find(c=>c.cmd==='managed_prompt').args.includeIdentity")==False
 page.reload();expect(page.locator('.cw-thread')).to_contain_text('0 recorded applications');expect(page.locator('.cw-thread')).to_contain_text('Synthetic native contract response')
 page.get_by_role('button',name='Career Identity',exact=True).click();expect(page.get_by_role('dialog').first).to_be_visible();page.keyboard.press('Escape');expect(page.get_by_role('dialog')).not_to_be_visible()
 b.close();print('Native UI contract passed: persisted role/restart, local count without inference, non-destructive new conversation, explicit model request without identity sharing, response history, settings Escape.')
