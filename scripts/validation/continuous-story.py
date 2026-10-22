"""Scroll camera, responsive/manual fallback, autoplay and brand reveal regression.
Requires the web app on port 3001; captures are ignored review evidence.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect
out=Path(__file__).resolve().parents[2] / '.impeccable/review/continuous-story';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':1263,'height':1024});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3001/');page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
 track=page.locator('.source-story-track');top=track.evaluate('(e)=>e.getBoundingClientRect().top+scrollY');distance=track.evaluate('(e)=>e.offsetHeight-innerHeight')
 result=[]
 for i in range(6):
  page.evaluate('(y)=>scrollTo(0,y)',top+distance*(i+.5)/6);page.wait_for_timeout(850)
  expect(page.locator('.source-story-stage')).to_have_attribute('data-chapter',str(i))
  result.append(page.locator('.source-center').evaluate('(e)=>getComputedStyle(e).transform'))
  if i==4:
   action=page.locator('.source-scene-layer[data-current=true] .source-approve').bounding_box()
   caption=page.locator('.source-focus-caption').bounding_box()
   assert action['y']+action['height'] < caption['y'], (action,caption)
   page.locator('.source-scene-layer[data-current=true] .source-approve').click()
   expect(page.locator('.source-scene-layer[data-current=true] .source-delivery')).to_contain_text('did not submit an application')
  page.screenshot(path=str(out/f'desktop-step-{i}.png'))
 assert len(set(result))>=5,result
 # Rewinding to the same coordinate must restore the same geometry.
 page.evaluate('(y)=>scrollTo(0,y)',top+distance*2.5/6);page.wait_for_timeout(100)
 assert page.locator('.source-center').evaluate('(e)=>getComputedStyle(e).transform')==result[2]
 expect(page.get_by_role('button',name='Preview a new-role alert')).to_have_count(0)
 expect(page.locator('#watchers > div').first).to_have_class('watcher-console')
 page.locator('#companion').scroll_into_view_if_needed();page.wait_for_timeout(300);first=page.locator('.companion-refined').get_attribute('data-preview-stage');page.wait_for_timeout(2800);assert page.locator('.companion-refined').get_attribute('data-preview-stage')!=first
 page.get_by_role('button',name='Get the match',exact=True).click();page.screenshot(path=str(out/'desktop-companion.png'))
 page.locator('.footer-handwriting').scroll_into_view_if_needed();page.wait_for_timeout(3300);page.screenshot(path=str(out/'desktop-footer.png'))
 assert 'geist' in page.locator('.brand-glyph text').first.evaluate('(e)=>getComputedStyle(e).fontFamily').lower()
 page.emulate_media(reduced_motion='reduce')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844})
  for i,label in enumerate(['Find the opportunities','Check the requirements','Tailor your resume','Prepare your application','Apply and keep track','Get the update']):
   page.get_by_role('button',name=label,exact=True).click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,i)
  page.get_by_role('button',name='Apply and keep track',exact=True).click()
  page.locator('.source-scene-layer[data-current=true] .source-approve').click()
  page.get_by_role('button',name='Get the update',exact=True).click()
  page.locator('.source-center').scroll_into_view_if_needed();page.screenshot(path=str(out/f'mobile-{width}-story.png'))
  page.locator('.companion-refined').scroll_into_view_if_needed();page.screenshot(path=str(out/f'mobile-{width}-companion.png'))
  page.locator('.footer-handwriting').scroll_into_view_if_needed();page.screenshot(path=str(out/f'mobile-{width}-footer.png'))
 assert not errors,errors
 (out/'checks.json').write_text(json.dumps({'cameraTransforms':result,'pageErrors':errors},indent=2));b.close()
 print('PASS: six scrubbed scenes, distinct camera transforms, responsive controls, companion autoplay, watcher button absent, Geist footer, no page errors.')
