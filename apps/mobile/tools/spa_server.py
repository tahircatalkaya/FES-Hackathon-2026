import http.server, os, sys
ROOT='/home/claude/mainsam/dist'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def do_GET(self):
        p=self.path.split('?')[0]
        if not os.path.exists(os.path.join(ROOT,p.lstrip('/'))) or p=='/': self.path='/index.html'
        return super().do_GET()
    def log_message(self,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',8765),H).serve_forever()
