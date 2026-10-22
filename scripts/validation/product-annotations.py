"""Verify the annotated UI changes without pretending demo activity is live work."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '.impeccable/review/product-annotations'
OUT.mkdir(parents=True, exist_ok=True)
LABELS = ['Find the opportunities', 'Check the requirements', 'Tailor your resume',
          'Prepare your application', 'Apply and keep track', 'Get the update']

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1263, 'height': 1024}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:3001/')
    page.wait_for_load_state('networkidle')
    expect(page.locator('.nav-product')).to_have_count(0)
    expect(page.get_by_role('navigation', name='Primary').get_by_role('link', name='Product', exact=True)).to_have_attribute('href', '#product')
    expect(page.locator('.repo-link')).to_have_attribute('href', 'https://github.com/Jasowills/pursuit')
    page.locator('.site-header').screenshot(path=str(OUT / 'navbar.png'))
    for name, width, height in [('desktop', 1440, 1000), ('annotated', 1263, 1024), ('tablet', 973, 968), ('mobile', 390, 844), ('small', 320, 800)]:
        page.set_viewport_size({'width': width, 'height': height})
        for index, label in enumerate(LABELS):
            page.get_by_role('button', name=label, exact=True).click()
            expect(page.locator('.source-story-stage')).to_have_attribute('data-chapter', str(index))
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (name, index)
            if width in [1263, 390]:
                page.locator('.source-story-inner').screenshot(path=str(OUT / f'{name}-step-{index}.png'), style='.site-header{visibility:hidden!important;}')
        page.locator('#watchers').scroll_into_view_if_needed()
        expect(page.locator('.watcher-other-companies > div')).to_have_count(3)
        assert page.locator('img[src="/brands/cloudflare.png"]').evaluate('(el)=>el.complete && el.naturalWidth>0')
        if width in [1263, 390]:
            page.locator('#watchers').screenshot(path=str(OUT / f'{name}-watchers.png'), style='.site-header{visibility:hidden!important;}')
            page.locator('.new-footer').screenshot(path=str(OUT / f'{name}-footer.png'), style='.site-header{visibility:hidden!important;}')
        if width == 390:
            page.evaluate('scrollTo(0,0)')
            bounds = page.get_by_role('button', name='Open menu', exact=True).bounding_box()
            assert bounds['x'] >= 0 and bounds['x'] + bounds['width'] <= width
            page.locator('.site-header').screenshot(path=str(OUT / 'mobile-navbar.png'))
            page.get_by_role('button', name='Open menu', exact=True).click()
            expect(page.get_by_role('navigation', name='Mobile')).to_be_visible()
            page.keyboard.press('Escape')
            expect(page.get_by_role('button', name='Open menu', exact=True)).to_be_focused()
    page.set_viewport_size({'width': 1263, 'height': 1024})
    page.get_by_role('button', name=LABELS[0], exact=True).click()
    for label, tone in [('Strong fit', 'positive'), ('Video requested', 'attention'), ('Not a fit', 'negative')]:
        expect(page.locator('.source-scene-layer[data-current=true]').get_by_text(label, exact=True)).to_have_attribute('data-tone', tone)
    page.get_by_role('button', name=LABELS[4], exact=True).click()
    page.locator('.source-approve').click()
    expect(page.locator('.source-scene-layer[data-current=true] .source-delivery')).to_contain_text('did not submit an application')
    page.get_by_role('button', name='Video introduction', exact=True).click()
    expect(page.locator('.recording-photo')).to_have_count(0)
    expect(page.locator('.video-employer-brief')).to_contain_text('B2B reporting workspace')
    page.locator('#features').screenshot(path=str(OUT / 'video-preparation.png'))
    page.goto('http://127.0.0.1:3001/product-tour')
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Opportunities', exact=False).first.click()
    expect(page.locator('.cw-sourcing-status')).to_contain_text('Simulated search')
    assert page.locator('.cw-main').evaluate('(el)=>getComputedStyle(el).backgroundColor') == 'rgb(0, 0, 0)'
    expect(page.locator('.cw-body .status-badge[data-tone=attention]').first).to_be_visible()
    page.screenshot(path=str(OUT / 'harness-opportunities.png'))
    page.goto('http://127.0.0.1:1420/?tour=1')
    page.set_viewport_size({'width':1536,'height':1050})
    page.evaluate('document.fonts.ready')
    page.screenshot(path=str(ROOT / 'apps/web/public/product/harness-dark.png'))
    page.screenshot(path=str(OUT / 'harness-assistant.png'))
    page.set_viewport_size({'width':1263,'height':1024})
    page.goto('http://127.0.0.1:1420/')
    page.get_by_role('button', name='Opportunities', exact=False).first.click()
    expect(page.locator('.cw-sourcing-status')).to_contain_text('Not connected')
    expect(page.locator('.cw-sourcing-status')).not_to_contain_text('Simulated search')
    page.goto('http://127.0.0.1:3001/')
    page.emulate_media(reduced_motion='no-preference')
    page.locator('.footer-handwriting').scroll_into_view_if_needed()
    expect(page.locator('.footer-handwriting')).to_have_attribute('data-visible', 'true')
    expect(page.locator('.brand-pen-mask')).to_have_count(8)
    assert page.locator('.brand-pen-mask').first.evaluate('(el)=>getComputedStyle(el).animationName') == 'brand-ink'
    page.wait_for_timeout(4200)
    assert float(page.locator('.brand-pen-mask').first.evaluate('(el)=>getComputedStyle(el).strokeDashoffset').removesuffix('px')) == 0
    page.emulate_media(reduced_motion='reduce')
    assert page.locator('.brand-pen-mask').first.evaluate('(el)=>getComputedStyle(el).animationName') == 'none'
    assert not errors, errors
    browser.close()
    print('Passed: six steps, five widths, semantic statuses, direct nav, four companies, video brief, pen motion, tour/native sourcing honesty.')
