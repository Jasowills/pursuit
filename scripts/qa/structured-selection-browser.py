"""Built desktop UI; simulated IPC. Real local inference is tested separately in Rust."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
SOURCE = 'Alex Morgan\n\nExperience\nExample | QA Analyst | 2022-2025\n- Tested REST APIs with SQL and Postman.\n- Edited training videos.\n\nEducation\nBA Design | Example | 2020'

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1360, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_init_script('''window.isTauri=true; window.__QA_COMMANDS__=[];
    window.__TAURI_INTERNALS__={invoke:async(command,args)=>{
      window.__QA_COMMANDS__.push(command);
      if(command==='career_book')return localStorage.getItem('qa-book')||JSON.stringify({version:1,messages:[],notes:[],opportunities:[{id:'qa-role',company:'Example',role:'QA Analyst',location:'Remote',salary:'Not specified',status:'Review',reason:'Fictional test role',posting:'Test APIs with Postman and SQL.'}]});
      if(command==='save_career_book'){localStorage.setItem('qa-book',args.body);return;}
      if(command==='managed_status')return {running:true,provider:'ollama',model:'fixture-model'};
      if(command==='select_resume_evidence'){
        if(args.model!=='fixture-model'||!args.candidateIds.length||args.candidateIds.length>20)throw Error('Wrong structured request');
        window.__QA_SELECTION_ARGS__=args;
        return JSON.stringify({selectedIds:[window.__QA_FAIL__?'invented-id':args.candidateIds[0]]});
      }
      if(command==='managed_prompt'||command==='managed_create')throw Error('Selection leaked into freeform runtime');
      return null;
    }};''')
    page.goto(os.environ.get('PURSUIT_TEST_URL', 'http://127.0.0.1:1428'), wait_until='networkidle')
    page.get_by_role('button', name='Resumes & letters', exact=True).click()
    page.get_by_label('Original resume', exact=True).set_input_files({'name': 'fictional.txt', 'mimeType': 'text/plain', 'buffer': SOURCE.encode()})
    expect(page.get_by_role('textbox', name='Review extracted text', exact=True)).to_have_value(SOURCE, timeout=20000)
    page.get_by_label('I checked my name, roles, employers, dates, qualifications and results.').check()
    page.get_by_role('button', name='Ask my model to select experience', exact=True).click()
    page.get_by_role('heading', name='Review your packet', exact=True).wait_for(timeout=20000)
    saved = page.evaluate("JSON.parse(localStorage.getItem('qa-book')).tailoring.packet")
    assert all(SOURCE[block['start']:block['end']] == block['text'] for block in saved['blocks'])
    assert any('Tested REST APIs' in block['text'] for block in saved['blocks'])
    assert not page.evaluate("window.__QA_COMMANDS__.includes('managed_prompt')")
    page.evaluate('window.__QA_FAIL__=true')
    page.get_by_role('button', name='Ask my model to select experience', exact=True).click()
    page.get_by_role('status').filter(has_text='unknown_fact_id').wait_for(timeout=20000)
    assert page.evaluate("JSON.parse(localStorage.getItem('qa-book')).tailoring.packet") == saved
    assert not errors, errors
    report = {
        'scope': 'Built desktop UI with simulated IPC; actual Ollama request, schema and response validation tested separately in Rust.',
        'local_selection_route': 'pass',
        'no_freeform_session_for_selection': 'pass',
        'saved_blocks_preserve_source': 'pass',
        'unsupported_selection_cannot_replace_saved_packet': 'pass',
        'browser_errors': errors,
    }
    (ROOT / 'docs/qa/evidence/structured-selection-browser.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    browser.close()
