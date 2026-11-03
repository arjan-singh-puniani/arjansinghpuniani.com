"""Static production QA with an explicit optional failing asset; never part of hosting."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from pathlib import Path
import argparse
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8767);p.add_argument('--fail-asset',default='');p.add_argument('--fault-switch',default='');a=p.parse_args()
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(Path(__file__).resolve().parents[1]/'dist'),**kwargs)
 def do_GET(self):
  if a.fail_asset and (not a.fault_switch or Path(a.fault_switch).exists()) and urlparse(self.path).path==a.fail_asset:self.send_error(503,'Deliberate asset failure for QA');return
  super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler)
print(f'QA server ready: http://127.0.0.1:{a.port}',flush=True)
server.serve_forever()
