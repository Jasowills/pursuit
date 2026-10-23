import json, os, re, io, zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path('/Users/jasonamadi/pursuit')
SOURCE='Alex Morgan\nalex.morgan@example.com\n\nExperience\nMeridian Studio | QA Analyst | 2022-2025\n- Tested REST APIs with Postman and SQL.\n- Produced training videos.\n\nEducation\nBA Design | Example University | 2020'
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':1360,'height':1000})
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.on('console',lambda msg: print('BROWSER:',msg.type,msg.text[:500],flush=True) if msg.type=='error' else None)
    page.on('response',lambda response: print('HTTP:',response.status,response.url,flush=True) if response.status>=400 else None)
    page.add_init_script('''window.isTauri=true;window.__TAURI_INTERNALS__={invoke:async(command,args)=>{
       if(command==='career_book')return localStorage.getItem('qa-book')||JSON.stringify({version:1,messages:[],notes:[],opportunities:[{id:'qa-role',company:'Example',role:'QA Analyst',location:'Remote',salary:'Not specified',status:'Review',reason:'Synthetic test role',posting:'Test APIs with Postman and SQL.'}]});
       if(command==='save_career_book'){localStorage.setItem('qa-book',args.body);return;}
       if(command==='save_resume_pdf'){window.__QA_PDF_BYTES__=args.bytes;return;}
       if(command==='export_resume_pdf')return 'simulated/Documents/Pursuit/resume.pdf';
       if(command==='managed_status')return {running:false,provider:'offline'};
       return null;
    }};''')
    page.goto(os.environ.get('PURSUIT_TEST_URL','http://127.0.0.1:1427'),wait_until='networkidle')
    page.get_by_role('button',name='Resumes & letters',exact=True).click()
    page.get_by_label('Original resume',exact=True).set_input_files({'name':'resume.txt','mimeType':'text/plain','buffer':SOURCE.encode()})
    text=page.get_by_role('textbox',name='Review extracted text',exact=True)
    text.wait_for()
    from playwright.sync_api import expect
    expect(text).to_have_value(SOURCE,timeout=20000)
    page.get_by_label('I checked my name, roles, employers, dates, qualifications and results.').check()
    page.get_by_label('Why this work matters to you, in your words').fill('I enjoy making releases reliable.')
    page.get_by_role('button',name='Prepare without a model',exact=True).click()
    page.get_by_role('heading',name='Review your packet').wait_for(timeout=20000)
    page.get_by_role('button',name='Build and export PDF',exact=True).click()
    page.get_by_role('status').filter(has_text='PDF saved and exported').wait_for(timeout=30000)
    pdf=bytes(page.evaluate('window.__QA_PDF_BYTES__'))
    assert pdf.startswith(b'%PDF-')
    (ROOT/'.validation/tailoring-ui.pdf').write_bytes(pdf)
    page.screenshot(path=str(ROOT/'.validation/tailoring-studio.png'),full_page=True)
    page.reload(wait_until='networkidle')
    page.get_by_role('button',name='Resumes & letters',exact=True).click()
    page.get_by_role('button',name='Export saved PDF',exact=True).wait_for()
    page.get_by_label('Original resume',exact=True).set_input_files({'name':'generated.pdf','mimeType':'application/pdf','buffer':pdf})
    expect(page.get_by_role('textbox',name='Review extracted text',exact=True)).to_have_value(re.compile(r'.*SQL.*',re.S),timeout=30000)
    expect(page.get_by_label('I checked my name, roles, employers, dates, qualifications and results.')).not_to_be_checked()
    docx=io.BytesIO()
    with zipfile.ZipFile(docx,'w',zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('word/document.xml','<w:document xmlns:w="w"><w:body><w:p><w:r><w:t>Alex Morgan</w:t></w:r></w:p><w:p><w:r><w:t>- Tested APIs with SQL.</w:t></w:r></w:p></w:body></w:document>')
    page.get_by_label('Original resume',exact=True).set_input_files({'name':'source.docx','mimeType':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','buffer':docx.getvalue()})
    expect(page.get_by_role('textbox',name='Review extracted text',exact=True)).to_have_value(re.compile(r'Alex Morgan.*Tested APIs with SQL.*',re.S),timeout=30000)
    assert not errors, errors
    report={'scope':'Real browser and bundled parser/PDF code; native IPC simulated. Rust persistence separately tested. No live applications or messages.','import_txt':'pass','import_pdf':'pass','import_docx':'pass','source_review':'pass','prepare_without_model':'pass','pdf_export':'pass','reload_saved_packet':'pass','pdf_bytes':len(pdf),'browser_errors':errors}
    (ROOT/'docs/qa/evidence/tailoring-browser.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
    browser.close()
