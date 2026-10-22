"""Real browser-renderer capture and marketing interaction checks. No IPC mocks."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.impeccable/review/dark-landing'
OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1,reduced_motion='reduce')
 errors=[]
 page.on('pageerror',lambda err:errors.append(str(err)))
 page.goto('http://127.0.0.1:1420');page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
 expect(page.get_by_text('This browser preview cannot save tasks.',exact=False)).to_be_visible()
 page.screenshot(path=str(ROOT/'apps/web/public/product/harness-dark.png'))
 page.get_by_role('link',name='Career Identity',exact=True).click()
 page.screenshot(path=str(OUT/'harness-identity.png'),full_page=True)
 page.get_by_role('link',name='Models',exact=True).click()
 page.screenshot(path=str(OUT/'harness-models.png'),full_page=True)
 page.get_by_role('link',name='Agent workspace',exact=True).click()
 page.screenshot(path=str(OUT/'harness-agent.png'),full_page=True)
 page.goto('http://127.0.0.1:3001/');page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
 expect(page.get_by_role('heading',level=1)).to_contain_text('Your career.')
 for width,height,name in [(1440,1000,'desktop'),(973,968,'user-973'),(390,844,'mobile'),(320,800,'small-mobile')]:
  page.set_viewport_size({'width':width,'height':height});page.reload();page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready');page.evaluate('scrollTo(0,0)')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Overflow at {width}'
  page.screenshot(path=str(OUT/(name+'.png')),full_page=True)
  page.screenshot(path=str(OUT/(name+'-hero.png')))
  if width in [1440,390]:
   for section in ['how-it-works','features','autopilot','models','download','connect']:
    page.locator('#'+section).scroll_into_view_if_needed();page.screenshot(path=str(OUT/(name+'-'+section+'.png')))
   page.locator('.new-footer').screenshot(path=str(OUT/(name+'-footer.png')),style='.site-header { visibility:hidden !important; }')
   page.evaluate('scrollTo(0,0)')
  assert page.locator('img').evaluate_all('(imgs)=>imgs.every(i=>i.complete&&i.naturalWidth>0)'), 'Broken image'
  if width<1100:
   page.get_by_role('button',name='Open menu',exact=True).click()
   expect(page.get_by_role('navigation',name='Mobile',exact=True)).to_be_visible()
   page.keyboard.press('Escape')
   expect(page.get_by_role('button',name='Open menu',exact=True)).to_be_focused()
 page.set_viewport_size({'width':1440,'height':1000})
 page.locator('.flow-screen').scroll_into_view_if_needed()
 for label in ['Discover','Prepare','Move forward']:
  page.get_by_role('button',name='Show '+label+' example',exact=True).click()
  expect(page.get_by_role('button',name='Show '+label+' example',exact=True)).to_have_attribute('aria-pressed','true')
 page.get_by_role('button',name='Product engineer',exact=True).click()
 expect(page.locator('.tailored')).to_contain_text('Partnered with a 12-person')
 page.get_by_role('button',name='Platform engineer',exact=True).click()
 expect(page.locator('.tailored')).to_contain_text('Built internal developer tools')
 page.get_by_role('button',name='Preview the workflow',exact=True).click()
 expect(page.get_by_role('status')).to_contain_text('Preview complete',timeout=10000)
 assert page.locator('.autopilot-steps li[data-state="done"]').count()==5
 for os in ['Windows','Linux','macOS']:
  page.get_by_role('button',name=os,exact=True).click()
  expect(page.locator('.download-options')).to_contain_text('qualification' if os!='macOS' else 'not published')
 page.get_by_role('button',name='Enlarge the actual desktop harness preview').click()
 expect(page.get_by_role('dialog')).to_be_visible()
 page.keyboard.press('Escape');expect(page.get_by_role('dialog')).not_to_be_visible()
 page.get_by_text('Does it automatically apply to jobs?',exact=True).click()
 expect(page.locator('details[open]')).to_contain_text('does not automatically submit')
 assert not errors,errors
 browser.close()
 print('Dark landing checks passed: widths 1440/973/390/320; assets, menu/Escape, resume switch, autopilot preview, platform picker, dialog, FAQ; no page errors.')
