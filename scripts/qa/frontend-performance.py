"""Small local production lab sample, not field Web Vitals or a Lighthouse audit."""
import json,statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
results=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for device,width,height,cpu in [('desktop',1440,1000,1),('mobile',390,844,4)]:
  for run in range(3):
   ctx=b.new_context(viewport={'width':width,'height':height},reduced_motion='reduce');q=ctx.new_page();cdp=ctx.new_cdp_session(q);cdp.send('Emulation.setCPUThrottlingRate',{'rate':cpu})
   q.add_init_script('''window.__lab={lcp:0,cls:0};new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lab.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__lab.cls+=e.value}).observe({type:'layout-shift',buffered:true});''')
   q.goto('http://127.0.0.1:3303/');q.wait_for_load_state('networkidle');q.wait_for_timeout(1000)
   data=q.evaluate('({...window.__lab,dom:performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd,bytes:performance.getEntriesByType("resource").reduce((n,r)=>n+r.transferSize,0)})');data.update(device=device,run=run+1,cpu=cpu);results.append(data);ctx.close()
 b.close()
Path('docs/qa/evidence/frontend-performance.json').write_text(json.dumps({'environment':'loopback production build, Chromium, warm host cache, no network throttling, reduced motion','samples':results},indent=2));print(json.dumps(results,indent=2))
