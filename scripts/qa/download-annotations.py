"""Check the built landing download flow. No external downloads or submissions."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
checks = []
screens = ROOT / '.validation'
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:3008', wait_until='networkidle')
    assert page.locator('.career-context-section').count() == 0
    assert page.locator('.hero-download-caption').count() == 0
    assert 'public installers coming later' not in page.locator('.dark-hero').inner_text()
    expect(page.locator('.hero-download a')).to_have_attribute('href', '#download')
    checks.append('context section and hero caption removed; hero still leads to download options')
    page.screenshot(path=str(screens / 'annotations-hero-desktop.png'))
    download = page.locator('#download')
    for platform, detail in [('macOS', 'Apple Silicon · arm64 · DMG'), ('Windows', '64-bit Windows · EXE'), ('Linux', '64-bit Linux · DEB & AppImage')]:
        button = download.get_by_role('button', name=platform, exact=True)
        button.click()
        expect(button).to_have_attribute('aria-pressed', 'true')
        expect(download).to_contain_text(detail)
        expect(download.locator('.download-availability')).to_be_visible()
        expect(download.get_by_role('link', name='Download source ZIP')).to_have_attribute('href', 'https://github.com/Jasowills/pursuit/archive/refs/heads/main.zip')
        expect(download.get_by_role('link', name='View unsigned builds')).to_have_attribute('href', 'https://github.com/Jasowills/pursuit/actions/workflows/desktop-alpha.yml')
    download.get_by_role('button', name='macOS', exact=True).click()
    processor = download.get_by_label('Mac processor')
    processor.select_option('intel')
    expect(download).to_contain_text('Intel · x64 · DMG')
    processor.select_option('apple-silicon')
    checks.append('all OS targets and both explicit Mac processor choices; truthful source and unsigned links')
    summary = download.locator('summary')
    summary.focus()
    page.keyboard.press('Enter')
    expect(download.locator('details')).to_have_attribute('open', '')
    expect(download).to_contain_text('Public signed releases are not available yet.')
    expect(download).to_contain_text('Node 22.13+')
    expect(download.get_by_role('link', name='Read the build guide')).to_be_visible()
    page.keyboard.press('Enter')
    expect(download.locator('details')).not_to_have_attribute('open', '')
    checks.append('keyboard-accessible setup disclosure exposes prerequisites and build guide')
    for width, height in [(1440, 1000), (768, 1024), (390, 844), (320, 740)]:
        page.set_viewport_size({'width': width, 'height': height})
        download.scroll_into_view_if_needed()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}'
        for control in download.locator('button, select, .download-actions a, summary').all():
            assert control.bounding_box()['height'] >= 44, f'touch target at {width}'
        page.screenshot(path=str(screens / f'annotations-download-{width}.png'))
        page.locator('.footer-large-word').scroll_into_view_if_needed()
        page.screenshot(path=str(screens / f'annotations-footer-{width}.png'))
    checks.append('320, 390, 768 and 1440px layouts have no horizontal overflow and 44px controls')
    assert page.locator('.footer-large-word').get_attribute('aria-hidden') == 'true'
    text = page.locator('.footer-pen-word text').first
    assert text.evaluate('(e)=>getComputedStyle(e).fill') == 'rgb(46, 51, 57)'
    assert text.evaluate('(e)=>getComputedStyle(e).animationName') == 'none'
    checks.append('footer wordmark is muted decorative text and respects reduced motion')
    assert not errors, errors
    checks.append('no uncaught browser errors')
    browser.close()

report = {'scope': 'Built landing page in Chromium. No downloads or external actions performed.', 'passed': len(checks), 'checks': checks}
(ROOT / 'docs/qa/evidence/download-annotations.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
