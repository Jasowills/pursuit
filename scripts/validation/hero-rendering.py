"""Verify decorative WebGL lifecycle and no-WebGL fallback. No external calls."""
from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='no-preference')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3001/');page.wait_for_load_state('networkidle')
 field=page.locator('.opportunity-field')
 expect(field).to_have_attribute('data-ready','true')
 page.wait_for_timeout(1400)
 first=page.locator('.opportunity-field canvas').screenshot()
 page.wait_for_timeout(400)
 second=page.locator('.opportunity-field canvas').screenshot()
 assert first!=second,'Shader did not animate'
 page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(150)
 first=page.locator('.opportunity-field canvas').screenshot();page.wait_for_timeout(250)
 second=page.locator('.opportunity-field canvas').screenshot()
 assert first==second,'Reduced motion should hold a static frame'
 page.evaluate("document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true}))")
 expect(field).to_have_attribute('data-ready','false')
 expect(page.locator('.field-fallback')).to_be_visible()
 page2=browser.new_page(viewport={'width':390,'height':844})
 page2.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(kind==='webgl')return null;return original.call(this,kind,...args)}")
 page2.goto('http://127.0.0.1:3001/');page2.wait_for_load_state('networkidle')
 expect(page2.locator('.opportunity-field')).to_have_attribute('data-ready','false')
 expect(page2.locator('.field-fallback')).to_be_visible()
 expect(page2.get_by_role('heading',level=1)).to_contain_text('Your career.')
 assert not errors,errors
 browser.close()
 print('Hero rendering passed: live shader animation, reduced-motion static frame, context-loss fallback, WebGL unavailable fallback.')
