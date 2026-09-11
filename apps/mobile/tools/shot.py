"""Screenshot-Helfer: python3 tools/shot.py <route> <name> [--reset] [--click selector]...
Startet einen statischen Server auf dist/ und macht einen Handy-Screenshot."""
import sys, subprocess, time, os, json
from playwright.sync_api import sync_playwright

route = sys.argv[1] if len(sys.argv) > 1 else '/'
name = sys.argv[2] if len(sys.argv) > 2 else 'shot'
reset = '--reset' in sys.argv
state = None
for i, a in enumerate(sys.argv):
    if a == '--state': state = sys.argv[i + 1]
OUT = '/home/claude/mainsam/shots'; os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3', '/home/claude/mainsam/tools/spa_server.py'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='de-DE', geolocation={'latitude': 50.1206, 'longitude': 8.6506}, permissions=['geolocation'])
        page = ctx.new_page()
        logs = []
        page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
        page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        page.goto('http://127.0.0.1:8765/' + route.lstrip('/'), wait_until='networkidle')
        if state:
            page.evaluate(f"localStorage.setItem('mainsam-v1', JSON.stringify({state}))")
            page.goto('http://127.0.0.1:8765/' + route.lstrip('/'), wait_until='networkidle')
        elif not reset:
            page.evaluate("""() => { const k='mainsam-v1'; const cur = JSON.parse(localStorage.getItem(k)||'{"state":{},"version":0}'); cur.state.onboarded = true; cur.state.name = cur.state.name || 'Imad'; localStorage.setItem(k, JSON.stringify(cur)); }""")
            page.goto('http://127.0.0.1:8765/' + route.lstrip('/'), wait_until='networkidle')
        time.sleep(2.5)
        for i, a in enumerate(sys.argv):
            if a == '--click':
                sel = sys.argv[i + 1]
                try: page.get_by_text(sel, exact=False).first.click(timeout=3000); time.sleep(1.5)
                except Exception as e: logs.append(f'[click failed] {sel}: {e}')
            if a == '--wait': time.sleep(float(sys.argv[i + 1]))
        page.screenshot(path=f'{OUT}/{name}.png')
        errs = [l for l in logs if 'error' in l.lower() and 'favicon' not in l]
        print('\n'.join(errs[:15]) if errs else 'no console errors')
        b.close()
finally:
    srv.terminate()
