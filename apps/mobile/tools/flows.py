"""Klickt die wichtigsten Flows im Web-Build durch und meldet Laufzeitfehler."""
import subprocess, time, os
from playwright.sync_api import sync_playwright
OUT = '/home/claude/mainsam/shots'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3', '/home/claude/mainsam/tools/spa_server.py'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errors = []
def step(page, name, fn):
    try: fn(); time.sleep(1.2); page.screenshot(path=f'{OUT}/flow_{name}.png'); print('ok  ', name)
    except Exception as e: print('FAIL', name, str(e)[:160]); page.screenshot(path=f'{OUT}/flow_{name}_fail.png')
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True, locale='de-DE', geolocation={'latitude': 50.1206, 'longitude': 8.6506}, permissions=['geolocation'])
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(f'[pageerror] {e}'))
        page.on('console', lambda m: errors.append(f'[console.{m.type}] {m.text}') if m.type == 'error' and 'TUNNEL' not in m.text and '404' not in m.text and 'favicon' not in m.text else None)
        B = 'http://127.0.0.1:8765'
        T = lambda s: page.get_by_text(s, exact=False).first
        # Onboarding komplett
        page.goto(B + '/', wait_until='networkidle'); time.sleep(2)
        step(page, 'onb1', lambda: T('Weiter').click())
        step(page, 'onb2', lambda: T('Weiter').click())
        step(page, 'onb3', lambda: T('Weiter').click())
        step(page, 'onb_name', lambda: (page.get_by_placeholder('Anzeigename').fill('Lena'), T('Los geht').click()))
        time.sleep(2)
        # Quiz durchspielen
        page.goto(B + '/quiz/q1', wait_until='networkidle'); time.sleep(1.5)
        step(page, 'quiz_start', lambda: T('Los').click())
        step(page, 'quiz_a1', lambda: T('B · Restmüll').click())
        step(page, 'quiz_n1', lambda: T('Weiter').click())
        step(page, 'quiz_a2', lambda: T('C · Restmüll').click())
        step(page, 'quiz_n2', lambda: T('Weiter').click())
        step(page, 'quiz_a3', lambda: T('B · 40 Liter').click())
        step(page, 'quiz_done', lambda: T('Kapitel abschließen').click())
        # Fairteiler melden
        page.goto(B + '/fairteiler/6', wait_until='networkidle'); time.sleep(2)
        step(page, 'ft_report', lambda: T('Regal-Status melden').click())
        step(page, 'ft_fill', lambda: (T('voll').click(), T('Backwaren').click(), T('Foto (ohne EXIF)').click()))
        step(page, 'ft_send', lambda: T('Senden').click())
        # Korb anfragen -> Zusage -> Abholung
        page.goto(B + '/korb/9001', wait_until='networkidle'); time.sleep(2)
        step(page, 'korb_req', lambda: T('Anfrage senden').click())
        time.sleep(7)
        step(page, 'korb_accepted', lambda: None)
        step(page, 'korb_pick', lambda: T('Abholung bestätigen').click())
        # Vytal: Demo-Code ausleihen, zurückgeben, nochmal (Duplikat)
        page.goto(B + '/scan?mode=vytal', wait_until='networkidle'); time.sleep(1.5)
        step(page, 'vy_demo', lambda: T('Demo-Code').click())
        page.goto(B + '/mehrweg', wait_until='networkidle'); time.sleep(2)
        step(page, 'vy_return', lambda: T('Rückgabe am Store bestätigen').click())
        # Clean-up
        page.goto(B + '/cleanup/cu1', wait_until='networkidle'); time.sleep(2)
        step(page, 'cu_join', lambda: T('Mitmachen').click())
        step(page, 'cu_fes', lambda: (T('Vorher').click(), T('Nachher').click(), T('FES-Bestätigung (Demo)').click()))
        step(page, 'cu_claim', lambda: T('Teilnahme werten').click())
        # Melden
        page.goto(B + '/melden', wait_until='networkidle'); time.sleep(2)
        step(page, 'melden', lambda: (T('Wilde Müllkippe').click(), T('Foto (ohne EXIF)').click(), T('Absenden').click()))
        # Scan bin + litter
        page.goto(B + '/scan?mode=bin&id=bin-0421', wait_until='networkidle'); time.sleep(1.5)
        step(page, 'bin', lambda: (T('NFC antippen').click(), time.sleep(3.5)))
        page.goto(B + '/scan?mode=litter', wait_until='networkidle'); time.sleep(1.5)
        step(page, 'litter', lambda: T('Ja, aufgehoben').click())
        # Saver, Verteilung, Belohnungen, Journal, Daten, Profil-Sprache
        page.goto(B + '/saver', wait_until='networkidle'); time.sleep(2.5); step(page, 'saver', lambda: None)
        page.goto(B + '/verteilung/d1', wait_until='networkidle'); time.sleep(2)
        step(page, 'dist_slot', lambda: (page.get_by_text('18:', exact=False).nth(1).click(), T('Slot reservieren').click()))
        page.goto(B + '/belohnungen', wait_until='networkidle'); time.sleep(2); step(page, 'rewards', lambda: None)
        page.goto(B + '/journal', wait_until='networkidle'); time.sleep(2)
        step(page, 'journal_why', lambda: page.locator('text=+').first.click())
        page.goto(B + '/daten', wait_until='networkidle'); time.sleep(2); step(page, 'daten', lambda: None)
        page.goto(B + '/profil', wait_until='networkidle'); time.sleep(2)
        step(page, 'lang_ar', lambda: T('العربية').click())
        page.goto(B + '/handeln', wait_until='networkidle'); time.sleep(2); step(page, 'handeln_ar', lambda: None)
        page.goto(B + '/profil', wait_until='networkidle'); time.sleep(2)
        step(page, 'lang_leicht', lambda: T('Leichte Sprache').click())
        page.goto(B + '/impact', wait_until='networkidle'); time.sleep(2); step(page, 'impact_full', lambda: None)
        page.goto(B + '/gemeinsam', wait_until='networkidle'); time.sleep(2)
        step(page, 'gem_daten', lambda: T('Frankfurts Mobilität').click())
        b.close()
finally:
    srv.terminate()
print('\n'.join(errors[:20]) if errors else 'NO RUNTIME ERRORS')
