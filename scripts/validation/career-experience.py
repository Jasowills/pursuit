"""Product renderer and landing journey tests; tour data is visibly labeled, never native IPC mocks."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.impeccable/review/career-experience';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':1536,'height':1050},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:1420/?tour=1');page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
 expect(page.get_by_text('Product tour · sample data',exact=True)).to_be_visible()
 page.screenshot(path=str(ROOT/'apps/web/public/product/harness-dark.png'))
 page.screenshot(path=str(OUT/'harness-desktop.png'))
 page.get_by_role('button',name='Dismiss notification',exact=True).click()
 page.get_by_label('Ask Pursuit or paste a job posting').fill('How many applications so far?');page.get_by_role('button',name='Send message',exact=True).click()
 expect(page.locator('.cw-thread')).to_contain_text('1 recorded application')
 page.get_by_role('button',name='Opportunities',exact=True).click();expect(page.get_by_role('heading',name='Your next opportunity is here.')).to_be_visible()
 page.get_by_role('button',name='Add job posting',exact=True).click()
 page.get_by_label('Company',exact=True).fill('ExampleCo');page.get_by_label('Job title',exact=True).fill('Designer');page.get_by_label('Job posting',exact=True).fill('Design accessible tools for teams.')
 page.get_by_role('button',name='Save opportunity',exact=True).click();expect(page.locator('.cw-jobs')).to_contain_text('ExampleCo')
 page.get_by_role('button',name='Cold outreach',exact=True).click();expect(page.locator('.cw-email')).to_contain_text('Hi Priya')
 page.screenshot(path=str(OUT/'harness-outreach.png'));page.screenshot(path=str(ROOT/'apps/web/public/product/harness-outreach.png'))
 page.get_by_role('button',name='Connect Gmail',exact=True).click();expect(page.get_by_role('button',name='Continue with Google',exact=True)).to_be_visible()
 page.get_by_role('button',name='Background work',exact=True).click();expect(page.locator('.cw-background-task')).to_have_count(4)
 page.screenshot(path=str(OUT/'harness-background.png'))
 page.get_by_role('button',name='Resumes & letters',exact=True).click();expect(page.locator('.cw-body .cw-paper')).to_contain_text('Meridian Studio')
 page.get_by_role('button',name='Video',exact=True).click();expect(page.locator('.cw-script-part')).to_have_count(4)
 for width,height,name in [(1024,960,'harness-minimum'),(390,844,'harness-mobile')]:
  page.set_viewport_size({'width':width,'height':height});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(OUT/(name+'.png')),full_page=True)
 page.goto('http://127.0.0.1:3001/');page.wait_for_load_state('networkidle')
 for width,height,name in [(1440,1000,'desktop'),(973,968,'user-973'),(390,844,'mobile'),(320,800,'small-mobile')]:
  page.set_viewport_size({'width':width,'height':height});page.reload();page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
  page.evaluate("document.querySelectorAll('[data-motion]').forEach(el=>el.dataset.visible='true')")
  page.evaluate('scrollTo(0,0)');page.screenshot(path=str(OUT/(name+'-hero.png')));page.screenshot(path=str(OUT/(name+'.png')),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Overflow {width}'
  assert page.locator('img').evaluate_all("(imgs)=>imgs.filter(i=>i.loading!=='lazy').every(i=>i.complete&&i.naturalWidth>0)")
  if width<1100:
   page.get_by_role('button',name='Open menu',exact=True).click();expect(page.get_by_role('navigation',name='Mobile',exact=True)).to_be_visible();page.keyboard.press('Escape')
  if width in [1440,390]:
   for key,sel in [('journey','#how-it-works'),('resume','#features'),('companion','#companion'),('background','#autopilot'),('watchers','#watchers'),('outreach','#outreach'),('cta','.closing-invitation'),('footer','.new-footer')]:
    page.locator(sel).screenshot(path=str(OUT/(name+'-'+key+'.png')),style='.site-header {visibility:hidden!important;}')
 page.set_viewport_size({'width':1440,'height':1000})
 page.get_by_role('button',name='Cover letter',exact=True).click();expect(page.locator('.marketing-letter')).to_contain_text('Dear Northstar team')
 page.locator('#features').screenshot(path=str(OUT/'desktop-letter.png'),style='.site-header {visibility:hidden!important;}')
 page.get_by_role('button',name='Video introduction',exact=True).click();expect(page.locator('.script-sheet')).to_contain_text('0:15–0:50')
 page.locator('#features').screenshot(path=str(OUT/'desktop-video.png'),style='.site-header {visibility:hidden!important;}')
 page.get_by_role('button',name='Resume tailoring',exact=True).click();page.get_by_role('button',name='Changes highlighted',exact=True).click();expect(page.locator('.document-switch')).to_have_attribute('aria-pressed','false')
 page.get_by_role('button',name='Get the match',exact=False).click();page.get_by_role('button',name='Review the opportunity',exact=True).click();expect(page.locator('.phone-role')).to_be_visible()
 page.get_by_role('button',name='Review approval',exact=True).click();page.get_by_role('button',name='Approve sample application',exact=True).click();expect(page.locator('.phone-complete')).to_contain_text('Your application is in.')
 page.get_by_role('button',name='Composio',exact=True).click();expect(page.locator('.gmail-consent')).to_contain_text('Composio project')
 page.get_by_role('button',name='Review draft',exact=True).click();expect(page.get_by_role('status').filter(has_text='No email')).to_be_visible()
 page.get_by_role('button',name='Apply and keep track',exact=True).click();expect(page.locator('.source-delivery')).to_contain_text('A role worth your attention')
 page.locator('.source-approve').click();expect(page.locator('.source-delivery')).to_contain_text('Your application is in.')
 page.get_by_role('button',name='Preview a new-role alert',exact=True).click();expect(page.locator('.watcher-found')).to_contain_text('not a live PostHog vacancy')
 assert not errors,errors
 b.close();print('Career experience passed: actual renderer tour, conversation counts, role intake, outreach, background, full resume/video; landing 1440/973/390/320, document changes, companion approval, Gmail paths, sample run.')
