from pathlib import Path
import subprocess, json
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1]
frames=root/'.validation/dashboard-refresh'
scenes=[('overview','Keep your search in view',5),('opportunities','Review each role and its eligibility evidence',6),('workflow','Prepare materials with your own model',6),('connections','Connect your model and Gmail account',6)]
clips=[]
for i,(name,title,duration) in enumerate(scenes):
 out=frames/f'scene-{i}.mp4'
 caption=frames/f'caption-{i}.png'
 image=Image.new('RGB',(1280,80),'#19172b'); draw=ImageDraw.Draw(image)
 font='/System/Library/Fonts/Supplemental/Arial.ttf'
 draw.text((30,25),title,font=ImageFont.truetype(font,23),fill='white')
 draw.text((1040,32),'Real app / fictional records',font=ImageFont.truetype(font,12),fill='#c6c0e1')
 image.save(caption)
 filters=f"[0:v]scale=1280:720,pad=1280:800:0:0:color=0x19172b[base];[base][1:v]overlay=0:720,fade=t=in:d=0.2,fade=t=out:st={duration-.2}:d=0.2"
 subprocess.run(['ffmpeg','-v','error','-y','-loop','1','-i',str(frames/f'{name}.png'),'-loop','1','-i',str(caption),'-t',str(duration),'-filter_complex',filters,'-r','24','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p',str(out)],check=True)
 clips.append(out)
listing=frames/'clips.txt';listing.write_text('\n'.join(f"file '{p}'" for p in clips))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(root/'apps/web/public/product/workflow.mp4')],check=True)
meta={'date':'2026-10-21','source':'CUA screenshots of the real redesigned local app, composed as a guided screenshot tour with ffmpeg','account':'Fictional Demo Operator','scenes':[{'screen':n,'seconds':d,'caption':t} for n,t,d in scenes],'does_not_demonstrate':['live model inference','OAuth consent completion','email delivery','automated browser submission'],'hero_poster':{'file':'hero-workspace.png','source':'Real loaded overview, seeded fictional records, no mocked network'}}
(root/'apps/web/public/product/capture.json').write_text(json.dumps(meta,indent=2)+'\n')
