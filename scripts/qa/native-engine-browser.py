"""Built native frontend + real coordinator; simulated Tauri IPC and source/browser fixtures."""
import json, os, subprocess, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[2]
SOURCE='Alex Morgan\nalex@example.com\n\nExperience\nExample | QA Analyst | 2022-2025\n- Tested REST APIs using SQL and Postman.\n\nEducation\nBA Design | Example | 2020'
with tempfile.TemporaryDirectory(prefix='pursuit-ui-engine-') as root:
    worker=subprocess.Popen(['node',str(ROOT/'scripts/qa/native-engine-fixture.mjs'),root],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,cwd=ROOT)
    counts={'calls':0,'submitted':0}
    def call(request):
        counts['calls']+=1
        worker.stdin.write(json.dumps(request)+'\n');worker.stdin.flush()
        result=json.loads(worker.stdout.readline());counts['submitted']=result['submitted'];return result
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(channel='chrome',headless=True)
            page=browser.new_page(viewport={'width':1440,'height':1100})
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'favicon' not in m.text and '404' not in m.text else None)
            page.expose_function('qaEngine',call)
            page.add_init_script('''(()=>{let next=0;const callbacks={},listeners={};window.isTauri=true;
              window.__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener:(_event,id)=>{delete listeners[id]}};
              window.__TAURI_INTERNALS__={transformCallback:fn=>{const id=++next;callbacks[id]=fn;return id},unregisterCallback:id=>{delete callbacks[id]},invoke:async(command,args)=>{
                if(command==='plugin:event|listen'){const id=++next;listeners[id]=callbacks[args.handler];return id;}
                if(command==='plugin:event|unlisten')return;
                if(command==='career_book')return localStorage.getItem('qa-book')||JSON.stringify({version:1,messages:[],notes:[],opportunities:[]});
                if(command==='save_career_book'){localStorage.setItem('qa-book',args.body);return;}
                if(command==='save_resume_pdf'){let s='';for(const b of args.bytes)s+=String.fromCharCode(b);window.__QA_PDF__=btoa(s);return;}
                if(command==='export_resume_pdf')return 'simulated/Documents/Pursuit/resume.pdf';
                if(command==='career_engine_pause'){const response=await window.qaEngine({action:'application.pause'});return response.value;}
                if(command==='career_engine_call'){
                  let request=args.request;
                  if(request.action==='packet.register'){const t=JSON.parse(localStorage.getItem('qa-book')).tailoring;request={action:'packet.register',jobId:request.jobId,resume:t.resume,packet:t.packet,pdfHash:t.artifactHash,pdfBase64:window.__QA_PDF__};}
                  const response=await window.qaEngine(request);for(const event of response.events)for(const listener of Object.values(listeners))listener({payload:{requestId:args.requestId,event}});
                  if(response.error)throw Error(response.error);return response.value;
                }
                if(command==='career_engine_settings')return {nodeExecutable:'/usr/local/bin/node',browserExecutable:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',executionEnabled:false};
                return null;
              }};
            })();''')
            page.goto(os.environ.get('PURSUIT_TEST_URL','http://127.0.0.1:1428'),wait_until='networkidle')
            page.get_by_role('button',name='Opportunities',exact=True).click()
            page.get_by_label('Target roles, separated by commas',exact=True).fill('QA Analyst')
            page.get_by_label('Skills and source evidence, one per line',exact=True).fill('SQL | Tested REST APIs using SQL in my source resume.')
            page.get_by_label('Employer board or structured job-page URL',exact=True).fill('https://jobs.ashbyhq.com/fixture')
            page.get_by_role('button',name='Add source',exact=True).click()
            page.get_by_role('button',name='Search for roles',exact=True).click()
            expect(page.get_by_role('heading',name='QA Analyst',exact=True)).to_be_visible(timeout=30000)
            expect(page.get_by_text('unknown',exact=True)).to_be_visible()
            page.get_by_role('button',name='Save opportunity',exact=True).click()
            page.get_by_role('button',name='Prepare resume and PDF',exact=True).click()
            page.get_by_label('Original resume',exact=True).set_input_files({'name':'resume.txt','mimeType':'text/plain','buffer':SOURCE.encode()})
            expect(page.get_by_role('textbox',name='Review extracted text',exact=True)).to_have_value(SOURCE,timeout=20000)
            page.get_by_label('I checked my name, roles, employers, dates, qualifications and results.').check()
            page.get_by_role('button',name='Prepare without a model',exact=True).click()
            page.get_by_role('heading',name='Review your packet',exact=True).wait_for()
            page.get_by_role('button',name='Build and export PDF',exact=True).click()
            page.get_by_role('status').filter(has_text='PDF saved and exported').wait_for(timeout=30000)
            page.get_by_role('button',name='Applications',exact=True).click()
            call({'action':'__fixture_change_role'})
            page.get_by_role('button',name='Inspect Ashby form',exact=True).click()
            page.get_by_role('status').filter(has_text='posting changed retailor required').wait_for(timeout=20000)
            page.get_by_role('button',name='Opportunities',exact=True).click()
            page.get_by_role('button',name='Refresh saved posting',exact=True).click()
            page.get_by_role('button',name='Prepare resume and PDF',exact=True).click()
            expect(page.get_by_role('textbox',name='Review extracted text',exact=True)).to_have_value(SOURCE)
            page.get_by_role('button',name='Prepare without a model',exact=True).click()
            page.get_by_role('heading',name='Review your packet',exact=True).wait_for()
            page.get_by_role('button',name='Build and export PDF',exact=True).click()
            page.get_by_role('status').filter(has_text='PDF saved and exported').wait_for(timeout=30000)
            page.get_by_role('button',name='Applications',exact=True).click()
            page.get_by_role('button',name='Inspect Ashby form',exact=True).click()
            page.get_by_label('Full name *',exact=True).fill('Alex Morgan')
            page.get_by_label('Email *',exact=True).fill('alex@example.com')
            page.get_by_label('I reviewed the eligibility requirements and confirmed my answers.').check()
            page.get_by_label('I reviewed the tailored resume and its claims.').check()
            page.get_by_role('button',name='Review exact application',exact=True).click()
            page.get_by_text('Exact resume text',exact=True).click()
            expect(page.get_by_text('Full name',exact=True)).to_be_visible()
            assert counts['submitted']==0
            page.get_by_label('Enable execution of individually approved applications',exact=True).check()
            final='I reviewed this exact PDF, destination and answer set. I authorize this application.'
            page.get_by_label(final,exact=True).check()
            page.get_by_role('button',name='Approve exact application',exact=True).click()
            expect(page.get_by_role('button',name='Submit approved application',exact=True)).to_be_disabled()
            assert counts['submitted']==0
            page.get_by_label(final,exact=True).check()
            page.get_by_role('button',name='Submit approved application',exact=True).click()
            expect(page.get_by_text('CONFIRMED',exact=True)).to_be_visible(timeout=30000)
            assert counts['submitted']==1
            page.screenshot(path=str(ROOT/'.validation/native-application-review.png'),full_page=True)
            page.reload(wait_until='networkidle')
            page.get_by_role('button',name='Applications',exact=True).click()
            expect(page.get_by_text('CONFIRMED',exact=True)).to_be_visible(timeout=20000)
            assert counts['submitted']==1
            expect(page.get_by_role('button',name='Submit approved application',exact=True)).to_have_count(0)
            page.get_by_role('button',name='Pause pending applications',exact=True).click()
            assert call({'action':'snapshot'})['value']['policy']['enabled']==False
            page.get_by_role('button',name='Background work',exact=True).click()
            expect(page.get_by_text('CONFIRMED',exact=True)).to_be_visible()
            expect(page.locator('.cw-engine-history').filter(has_text='CONFIRMED')).to_contain_text('https://jobs.ashbyhq.com/fixture/qa')
            assert not errors,errors
            report={'scope':'Built native frontend and actual local coordinator/SQLite. Tauri IPC, source reads and application adapter simulated; real browser adapter and Rust process transport tested separately. No external submissions.','search':'pass','eligibility_unknown_visible':'pass','save_role':'pass','changed_posting_retailoring':'pass','prepare_and_export_pdf':'pass','exact_answer_review':'pass','explicit_approval_and_submit':'pass','reload_confirmation_no_resubmit':'pass','background_history':'pass','synthetic_submissions':counts['submitted'],'browser_errors':errors}
            (ROOT/'docs/qa/evidence/native-engine-browser.json').write_text(json.dumps(report,indent=2)+'\n')
            print(json.dumps(report,indent=2));browser.close()
    finally:
        worker.stdin.close();worker.wait(timeout=10)
