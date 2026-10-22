"""Annotation regression: neutral surfaces, compact phone, brand assets, table, motion and alignment."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('PURSUIT_PREVIEW_URL','http://127.0.0.1:3001/')
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.impeccable/review/neutral-refinement';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch();q=b.new_page(viewport={'width':1263,'height':1024},reduced_motion='reduce');errors=[];q.on('pageerror',lambda e:errors.append(str(e)))
 q.goto(BASE);q.wait_for_load_state('networkidle');q.evaluate('document.fonts.ready')
 for width,height,name in [(1440,1000,'desktop'),(1263,1024,'annotated'),(973,968,'tablet'),(390,844,'mobile'),(320,800,'small-mobile')]:
  q.set_viewport_size({'width':width,'height':height});q.evaluate('scrollTo(0,0)');q.screenshot(path=str(OUT/(name+'-hero.png')))
  assert q.evaluate('document.documentElement.scrollWidth<=innerWidth'),name
  if width>600:
   a=q.locator('.hero-download a').bounding_box();c=q.locator('.hero-watch').bounding_box();assert abs((a['y']+a['height']/2)-(c['y']+c['height']/2))<3,(name,a,c)
  for key,sel in [('journey','#how-it-works'),('companion','#companion'),('activity','#autopilot'),('watchers','#watchers'),('outreach','#outreach'),('footer','.new-footer')]:
   q.locator(sel).scroll_into_view_if_needed();q.evaluate("document.querySelectorAll('[data-motion]').forEach(el=>el.dataset.visible='true')")
   q.locator(sel).screenshot(path=str(OUT/(name+'-'+key+'.png')),style='.site-header{visibility:hidden!important;}')
  for selector in ['.source-product-window','.phone-device','.activity-ledger','.watcher-console','.outreach-draft','.gmail-connect-story']:
   rgb=q.locator(selector).evaluate('(el)=>getComputedStyle(el).backgroundColor');vals=[int(v) for v in rgb.removeprefix('rgb(').removesuffix(')').split(',')];assert max(vals)-min(vals)<=2,(selector,rgb)
 q.set_viewport_size({'width':1263,'height':1024})
 q.get_by_role('button',name='Apply and keep track',exact=True).click();expect(q.locator('.application-progress li')).to_have_count(3);expect(q.locator('.source-mode')).to_have_count(0);q.locator('.source-approve').click();q.locator('.source-approve').hover();expect(q.locator('.source-approve')).to_have_css('color','rgb(20, 20, 20)');expect(q.locator('.source-delivery')).to_contain_text('Your application is in.');q.locator('#how-it-works').screenshot(path=str(OUT/'annotated-approval.png'),style='.site-header{visibility:hidden!important;}')
 q.locator('.activity-toolbar').get_by_role('button',name='Needs you',exact=False).click();expect(q.locator('.activity-ledger tbody tr')).to_have_count(2);q.get_by_role('button',name='Northstar application Resume and cover letter prepared',exact=True).click();expect(q.locator('.activity-detail')).to_contain_text('Sample activity record');q.get_by_role('button',name='Close activity detail').click();q.get_by_role('button',name='All activity',exact=True).click()
 for logo in ['posthog','stripe','linear','gmail','composio']:
  assert q.locator(f'img[src="/brands/{logo}.svg"]').first.evaluate('(el)=>el.complete&&el.naturalWidth>0'),logo
 q.get_by_role('button',name='Preview a new-role alert',exact=True).click();q.locator('#watchers').screenshot(path=str(OUT/'watcher-alert.png'),style='.site-header{visibility:hidden!important;}')
 companion=q.locator('#companion');companion.get_by_role('button',name='Get the match',exact=False).click();expect(companion.locator('.phone-worklist')).to_have_count(0);assert companion.locator('.phone-device').bounding_box()['height']<=662
 companion.get_by_role('button',name='Assistant',exact=True).click();expect(companion.locator('.phone-chat-preview')).to_contain_text('Illustrative assistant response');companion.get_by_role('button',name='Applications',exact=True).click();expect(companion.locator('.phone-application-list button')).to_have_count(4)
 companion.get_by_role('button',name='Get the match',exact=False).click();companion.get_by_role('button',name='Review the opportunity',exact=True).click();q.locator('#companion').screenshot(path=str(OUT/'companion-review.png'),style='.site-header{visibility:hidden!important;}')
 q.get_by_role('button',name='Video introduction',exact=True).click();expect(q.locator('.recording-photo')).to_be_visible();q.locator('#features').screenshot(path=str(OUT/'video-photo.png'),style='.site-header{visibility:hidden!important;}')
 q.emulate_media(reduced_motion='no-preference');q.reload();q.wait_for_load_state('networkidle');companion.scroll_into_view_if_needed();expect(companion.get_by_role('button',name='Pause preview',exact=True)).to_be_visible();expect(companion.locator('.phone-greeting h3')).to_have_text('Review this role.',timeout=7500);companion.get_by_role('button',name='Pause preview',exact=True).click();paused=companion.locator('.phone-greeting h3').inner_text();q.wait_for_timeout(4700);expect(companion.locator('.phone-greeting h3')).to_have_text(paused)
 q.locator('.footer-lettering').scroll_into_view_if_needed();expect(q.locator('.footer-lettering')).to_have_attribute('data-visible','true');expect(q.locator('.footer-pen-stroke')).to_have_count(10);assert 'pursuit-pen-draw' in q.locator('.footer-pen-stroke').first.evaluate('(el)=>getComputedStyle(el).animationName');q.wait_for_timeout(4200);q.locator('.new-footer').screenshot(path=str(OUT/'footer-settled.png'),style='.site-header{visibility:hidden!important;}')
 q.emulate_media(reduced_motion='reduce');assert q.locator('.footer-pen-stroke').first.evaluate('(el)=>getComputedStyle(el).animationName')=='none';assert not errors,errors
 b.close();print('Neutral refinement passed: five widths, aligned hero, neutral surfaces, timeline, ledger filters, official assets, compact companion/autoplay/pause, Pexels, pen motion/reduced motion.')
