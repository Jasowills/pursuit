"""Scroll choreography and platform acquisition checks; no job/provider/network fixtures."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.impeccable/review/source-story';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch()
 page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='no-preference')
 errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 page.goto('http://127.0.0.1:3001/');page.wait_for_load_state('networkidle')
 track=page.locator('.source-story-track');stage=page.locator('.source-story-stage')
 start=track.evaluate('(el)=>scrollY+el.getBoundingClientRect().top')
 distance=track.evaluate('(el)=>el.offsetHeight-innerHeight')
 assert stage.evaluate('(el)=>getComputedStyle(el).position')=='sticky'
 for i in range(3):
  page.evaluate('(y)=>scrollTo(0,y)',start+distance*((i+.2)/3))
  expect(stage).to_have_attribute('data-chapter',str(i))
  page.wait_for_timeout(650)
  assert abs(stage.bounding_box()['y'])<2
  page.screenshot(path=str(OUT/f'scroll-{i}.png'))
 page.locator('.source-approve').click()
 expect(page.locator('.source-delivery')).to_contain_text('Your application is in.')
 page.locator('#watchers').scroll_into_view_if_needed();page.get_by_role('button',name='Preview a new-role alert',exact=True).click()
 expect(page.locator('.watcher-found')).to_contain_text('Simulated change')
 page.locator('#watchers').screenshot(path=str(OUT/'watcher-alert.png'),style='.site-header {visibility:hidden!important;}')
 page.evaluate('scrollTo(0,0)');page.locator('.nav-product summary').click();expect(page.get_by_role('link',name='Company watchers Be there when a role opens.')).to_be_visible();page.keyboard.press('Escape');assert page.locator('.nav-product').get_attribute('open') is None
 for platform,ua,touch,expected in [('macOS','Macintosh',0,'macOS'),('Windows','Windows NT',0,'Windows'),('Linux','X11; Linux',0,'Linux'),('macOS','iPad',5,None),('macOS','Macintosh',5,None),('Linux','Android',5,None)]:
  ctx=b.new_context(viewport={'width':1440,'height':1000},user_agent='Mozilla/5.0 '+ua,reduced_motion='reduce')
  ctx.add_init_script('Object.defineProperty(navigator,"userAgentData",{value:'+json.dumps({'platform':platform})+'});Object.defineProperty(navigator,"maxTouchPoints",{value:'+str(touch)+'})')
  q=ctx.new_page();q.goto('http://127.0.0.1:3001/',wait_until='domcontentloaded');q.locator('.hero-download').wait_for()
  expect(q.locator('.hero-download a')).to_contain_text('Get Pursuit for '+(expected or 'desktop'))
  if expected:
   expect(q.locator('.platform-picker button[aria-pressed=true]')).to_contain_text(expected)
   assert q.locator('.hero-download img').evaluate('(el)=>el.complete&&el.naturalWidth>0')
   q.screenshot(path=str(OUT/(expected+'-hero.png')))
  ctx.close()
 page.emulate_media(reduced_motion='reduce');page.reload();page.wait_for_load_state('networkidle')
 assert stage.evaluate('(el)=>getComputedStyle(el).position')=='relative'
 for width in [1440,973,390,320]:
  page.set_viewport_size({'width':width,'height':1000 if width>400 else 844})
  for i,label in enumerate(['Find the opportunities','Prepare your application','Apply and keep track']):
   page.get_by_role('button',name=label,exact=True).click();expect(stage).to_have_attribute('data-chapter',str(i))
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.locator('#how-it-works').screenshot(path=str(OUT/f'{width}-chapter-{i}.png'),style='.site-header {visibility:hidden!important;}')
 assert not errors,errors
 b.close();print('Source story passed: sticky progression, manual/reduced motion, 4 widths, watchers, menu, OS detection including mobile/iPad safeguards.')
