"""Video preparation preview: real section selection/copy, no camera or external actions."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright, expect
OUT=Path(__file__).resolve().parents[2]/'.impeccable/review/video-preparation'
OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch();ctx=b.new_context(viewport={'width':1263,'height':1024},reduced_motion='reduce',permissions=['clipboard-read','clipboard-write']);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3001/');page.wait_for_load_state('networkidle');page.get_by_role('button',name='Video introduction',exact=True).click()
 expect(page.locator('.recording-photo')).to_have_count(0)
 expect(page.locator('.video-employer-brief')).to_contain_text('Sample application')
 expect(page.locator('.video-outline button')).to_have_count(4)
 for i in range(4):
  page.locator('.video-outline button').nth(i).click();expect(page.locator('.video-script-passage').nth(i)).to_have_attribute('data-selected','true')
 page.get_by_role('button',name='Copy sample script',exact=True).click();expect(page.locator('.video-copy-status')).to_contain_text('Sample script copied')
 assert 'Meridian Studio' in page.evaluate('navigator.clipboard.readText()')
 for width,height in [(1263,1024),(390,844),(320,800)]:
  page.set_viewport_size({'width':width,'height':height});page.locator('.video-workshop').scroll_into_view_if_needed()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  if not os.environ.get('SKIP_SCREENSHOTS'): page.locator('.video-workshop').screenshot(path=str(OUT/f'video-{width}.png'),style='.site-header{visibility:hidden!important;}')
 page.set_viewport_size({'width':390,'height':844});page.locator('.video-outline button').first.click();expect(page.locator('.video-script-passage[data-section="0"]')).to_be_focused();expect(page.locator('.video-script-passage:visible')).to_have_count(1)
 page.locator('.video-checklist input').first.check();expect(page.locator('.video-checklist input').first).to_be_checked()
 page.evaluate("() => { navigator.clipboard.writeText=()=>Promise.reject(new Error('Fixture blocked clipboard')); }")
 page.get_by_role('button',name='Copy sample script',exact=True).click();expect(page.locator('.video-copy-status')).to_contain_text('Select the script text')
 assert not errors,errors;b.close();print('PASS: four selectable script sections, clipboard success/failure, checklist, three responsive widths, no stock photo or page errors.')
