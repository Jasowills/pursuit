"""UI-only checks using a synthetic IPC fixture; not native integration evidence.
Run with the desktop Vite server on 1420 and Python Playwright installed.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[3]
CAPTURES = ROOT / '.impeccable/review/identity'
CAPTURES.mkdir(parents=True, exist_ok=True)
FIXTURE = r"""
globalThis.isTauri=true;
window.__TAURI_INTERNALS__={invoke:async(cmd,args)=>{
 const key='pursuit-interface-test';
 let data=JSON.parse(sessionStorage.getItem(key)||'{"sources":[],"facts":[]}');
 if(cmd==='career_book')return null;
 if(cmd==='save_career_book')return;
 if(cmd==='managed_status')return data.runtime || {running:false,provider:'',model:'',directory:''};
 if(cmd==='managed_start'){data.runtime={running:true,provider:args.provider,model:args.model,directory:'/fixture/managed-runtime'};sessionStorage.setItem(key,JSON.stringify(data));return data.runtime;}
 if(cmd==='managed_stop'){data.runtime.running=false;sessionStorage.setItem(key,JSON.stringify(data));return;}
 if(cmd==='managed_history')return data.sessions || [];
 if(cmd==='managed_create'){data.sessions=[{id:'ses_fixture',title:args.title,provider:data.runtime.provider,model:data.runtime.model,state:'idle',snapshot:'[]',updatedAt:'2026-10-22'}];sessionStorage.setItem(key,JSON.stringify(data));return 'ses_fixture';}
 if(cmd==='managed_view'){const s=data.sessions.find(s=>s.id===args.id);return {id:s.id,state:s.state,messages:JSON.parse(s.snapshot)};}
 if(cmd==='managed_prompt'){const s=data.sessions.find(s=>s.id===args.id);s.state=args.execute?'completed':'queued';s.snapshot=JSON.stringify([{role:args.execute?'assistant':'queued',text:args.execute?'Synthetic runtime fixture response':args.text}]);sessionStorage.setItem(key,JSON.stringify(data));return;}
 if(cmd==='managed_interrupt')return false;
 if(cmd==='provider_connections')return [{id:'openai',name:'OpenAI',credentialSaved:!!data.openaiSaved,storeError:null},{id:'opencode',name:'OpenCode hosted inference',credentialSaved:!!data.opencodeSaved,storeError:null}];
 if(cmd==='save_provider_key'){data[args.providerId+'Saved']=true;sessionStorage.setItem(key,JSON.stringify(data));return;}
 if(cmd==='remove_provider_key'){data[args.providerId+'Saved']=false;sessionStorage.setItem(key,JSON.stringify(data));return;}
 if(cmd==='provider_models')return {models:['fixture/nested-model:tag'],truncated:true};
 if(cmd==='test_provider')return 'ready (synthetic provider fixture)';
 if(cmd==='probe_opencode')return {version:'fixture-2.1.2',isolatedDirectory:'/fixture/opencode-probe'};
 if(cmd==='workspace')return {databasePath:'/fixture/workspace.sqlite',schemaVersion:4,tasks:[]};
 if(cmd==='identity')return data;
 if(cmd==='import_identity'){
  const sourceId=String(data.sources.length+1);
  data.sources.push({id:sourceId,name:args.name,text:args.text,contentHash:'fixture-hash'});
  data.facts.push({id:sourceId,sourceId,field:'location',value:args.text.split(':')[1].trim(),excerpt:args.text,lineNumber:1,status:'suggested',confirmedValue:null});
 }
 if(cmd==='decide_fact'){
  const fact=data.facts.find(f=>f.id===args.id);
  const old=data.facts.find(f=>f.field===fact.field&&f.status==='confirmed');
  if(args.decision==='confirm'){
   if((old?.id??null)!==args.expectedConfirmedId)throw Error('stale confirmed identity');
   if(old)old.status='superseded';fact.status='confirmed';fact.confirmedValue=args.value;
  }else fact.status='rejected';
 }
 if(cmd==='ollama_models')return [{name:'fixture/model:tag'}];
 if(cmd==='test_ollama')return 'ready (synthetic UI fixture)';
 sessionStorage.setItem(key,JSON.stringify(data));return data;
}};
"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 page=browser.new_page(viewport={'width':1440,'height':1000})
 page.goto('http://127.0.0.1:1420');page.wait_for_load_state('networkidle')
 def navigate(name):
  close=page.get_by_role('button',name='Close settings',exact=True)
  if close.is_visible():close.click()
  page.get_by_role('button',name=name,exact=True).click()

 navigate('Career Identity')
 expect(page.get_by_role('button',name='Save source and review')).to_be_disabled()
 page.screenshot(path=str(CAPTURES/'preview.png'),full_page=True)
 page.add_init_script(FIXTURE);page.reload();page.wait_for_load_state('networkidle')
 navigate('Career Identity')
 def import_source(name,text):
  page.get_by_label('Source name',exact=True).fill(name)
  page.get_by_label('Source text',exact=True).fill(text)
  page.get_by_role('button',name='Save source and review').click()
  expect(page.get_by_label('Your confirmed answer')).to_be_visible()
 import_source('Synthetic profile one','Location: Lagos')
 page.get_by_role('button',name='Confirm fact',exact=True).click()
 expect(page.locator('.confirmed-facts')).to_contain_text('Lagos')
 import_source('Synthetic profile two','Location: London')
 expect(page.get_by_role('button',name='Confirm replacement')).to_be_disabled()
 page.get_by_role('checkbox',name='Replace the current confirmed value:',exact=False).check()
 page.get_by_label('Your confirmed answer').fill('London, UK')
 for width,height,name in [(1440,1000,'desktop-fixture'),(973,968,'minimum-fixture')]:
  page.set_viewport_size({'width':width,'height':height})
  page.screenshot(path=str(CAPTURES/(name+'.png')),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.get_by_role('button',name='Confirm replacement').click()
 expect(page.locator('.confirmed-facts')).to_contain_text('London, UK')
 expect(page.locator('.history-record')).to_contain_text('superseded')
 page.reload();navigate('Career Identity')
 expect(page.locator('.confirmed-facts')).to_contain_text('London, UK')
 navigate('Models & connections')
 page.get_by_role('button',name='Find local models').click()
 expect(page.get_by_label('Installed model')).to_have_value('fixture/model:tag')
 page.get_by_role('button',name='Test text generation').click()
 expect(page.locator('.model-reply')).to_contain_text('synthetic UI fixture')
 page.screenshot(path=str(CAPTURES/'models-fixture.png'),full_page=True)
 page.get_by_label('API key',exact=True).first.fill('fixture-only-not-a-real-key')
 page.get_by_role('button',name='Save key',exact=True).first.click()
 expect(page.locator('#key-openai')).to_have_value('')
 card=page.locator('.provider-connection').filter(has=page.get_by_role('heading',name='OpenAI',exact=True))
 card.get_by_role('button',name='Load model catalog').click()
 expect(card.get_by_label('Model from current catalog')).to_have_value('fixture/nested-model:tag')
 card.get_by_role('button',name='Run provider generation test').click()
 expect(card.locator('.provider-reply')).to_contain_text('synthetic provider fixture')
 page.get_by_role('button',name='Check installed OpenCode').click()
 expect(page.get_by_text('Detected version: fixture-2.1.2')).to_be_visible()
 for width,height,name in [(1440,1000,'providers-desktop-fixture'),(973,968,'providers-minimum-fixture')]:
  page.set_viewport_size({'width':width,'height':height});page.screenshot(path=str(CAPTURES/(name+'.png')),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 card.get_by_role('button',name='Remove saved key').click()
 card.get_by_role('button',name='Remove key from app').click()
 expect(card).to_contain_text('No key saved')
 assert 'fixture-only-not-a-real-key' not in page.evaluate('JSON.stringify(sessionStorage)+JSON.stringify(localStorage)')
 navigate('Agent workspace')
 page.get_by_role('button',name='Start isolated runtime').click()
 expect(page.get_by_role('button',name='Stop runtime')).to_be_visible()
 page.get_by_label('New session title').fill('Synthetic runtime queue check')
 page.get_by_role('button',name='Create session',exact=True).click()
 page.get_by_label('Your request',exact=True).fill('Synthetic fixture request, not a real application')
 page.get_by_role('button',name='Queue without running').click()
 expect(page.locator('.transcript')).to_contain_text('Queued · not executed')
 page.get_by_role('button',name='Interrupt execution').click()
 expect(page.get_by_role('status')).to_contain_text('no active execution')
 for width,height,name in [(1440,1000,'agent-desktop-fixture'),(973,968,'agent-minimum-fixture')]:
  page.set_viewport_size({'width':width,'height':height});page.screenshot(path=str(CAPTURES/(name+'.png')),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.get_by_role('button',name='Stop runtime').click()
 expect(page.get_by_text('Last saved local snapshot.',exact=False)).to_be_visible()
 page.evaluate("""() => {const key='pursuit-interface-test';const data=JSON.parse(sessionStorage.getItem(key));data.runtime={running:true,provider:'ollama',model:'fixture/model:tag',directory:'/fixture/managed-runtime'};data.sessions=[{id:'ses_stream_fixture',title:'Synthetic streaming UI check',provider:'ollama',model:'fixture/model:tag',state:'running',snapshot:JSON.stringify([{role:'assistant_live',text:'Synthetic partial text from the UI fixture'}]),updatedAt:'2026-10-22'}];sessionStorage.setItem(key,JSON.stringify(data));}""")
 page.reload();navigate('Agent workspace')
 page.get_by_role('button',name='Synthetic streaming UI check',exact=False).click()
 expect(page.get_by_role('heading',name='Pursuit draft · streaming',exact=True)).to_be_visible()
 expect(page.get_by_role('button',name='Send request to model')).to_be_disabled()
 expect(page.get_by_role('checkbox',name='Include current confirmed Career Identity answers.',exact=False)).not_to_be_checked()
 for width,height,name in [(1440,1000,'agent-stream-desktop-fixture'),(973,968,'agent-stream-minimum-fixture')]:
  page.set_viewport_size({'width':width,'height':height});page.screenshot(path=str(CAPTURES/(name+'.png')),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')



 browser.close()
 print('UI fixture checks passed: preview guard, import/review, explicit replacement, history, reload, model check/test.')
