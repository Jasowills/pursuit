'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';

const VERTEX = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 uv=gl_FragCoord.xy/resolution;
 float aspect=resolution.x/resolution.y;
 vec2 p=vec2((uv.x-.5)*aspect,uv.y);
 float wave=sin(p.x*1.4+time*.14)*.022;
 float curve=.16+.14*p.x*p.x+wave+pointer.y*.006;
 float d=p.y-curve;
 vec3 lime=vec3(.82,.96,.38),blue=vec3(.82,.82,.80);
 float shift=smoothstep(-.8,.85,p.x);
 vec3 hue=mix(lime,blue,shift);
 float line=exp(-abs(d)*380.);
 float bloom=exp(-abs(d)*21.)*.15;
 float threads=0.;
 for(int i=1;i<13;i++){
  float f=float(i);
  float offset=f*.013+f*f*.0006;
  float wobble=sin(p.x*2.3+time*.12+f*.31)*f*.0009;
  threads+=exp(-abs(d+offset+wobble)*(300.-f*9.))*(.17-f*.009);
 }
 vec2 grid=vec2(uv.x*130.,uv.y*72.);
 vec2 cell=floor(grid);
 float dotMask=1.-smoothstep(.025,.09,length(fract(grid)-.5));
 float rnd=hash(cell);
 float pulse=.4+.6*pow(.5+.5*sin(time*.6+rnd*40.),3.);
 float field=exp(-abs(d)*5.)*smoothstep(.94,1.,rnd)*dotMask*pulse;
 float sweep=exp(-pow((fract(uv.x-time*.035)-.45)*5.,2.));
 vec3 color=hue*(line*.8+bloom+threads*.3)+mix(blue,lime,rnd)*field*.8;
 color+=hue*exp(-abs(d)*80.)*sweep*.18;
 color*=smoothstep(0.,.12,uv.x)*smoothstep(1.,.88,uv.x);
 color*=1.-smoothstep(.48,.8,uv.y);
 color+=vec3(hash(gl_FragCoord.xy)*.005);
 gl_FragColor=vec4(color,1.);
}`;

/** Decorative local shader. No tracking, network calls, or rendering dependency. */
export function OpportunityField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;
    let frame = 0,
      alive = true,
      inView = true,
      last = 0,
      seconds = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compile = (kind: number, source: string) => {
      const shader = gl.createShader(kind);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX),
      fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const size = gl.getUniformLocation(program, 'resolution'),
      clock = gl.getUniformLocation(program, 'time'),
      mouse = gl.getUniformLocation(program, 'pointer');
    const render = () => {
      if (!alive || gl.isContextLost()) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(size, canvas.width, canvas.height);
      gl.uniform1f(clock, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      render();
    };
    const tick = (now: number) => {
      frame = 0;
      if (!alive || !inView || document.hidden || reduced.matches) return;
      if (now - last > 32) {
        seconds += Math.min((now - last) / 1000, 0.05);
        last = now;
        render();
      }
      frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = performance.now();
      if (!reduced.matches && inView && !document.hidden) frame = requestAnimationFrame(tick);
      else render();
    };
    const observe = new ResizeObserver(resize);
    observe.observe(canvas);
    const visibility = new IntersectionObserver((e) => {
      inView = e[0]?.isIntersecting ?? false;
      resume();
    });
    visibility.observe(canvas);
    const move = (event: PointerEvent) => {
      if (reduced.matches || !inView || document.hidden) return;
      gl.uniform2f(mouse, event.clientX / innerWidth - 0.5, event.clientY / innerHeight - 0.5);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setReady(false);
    };
    resize();
    render();
    setReady(true);
    resume();
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', resume);
    window.addEventListener('pointermove', move, { passive: true });
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observe.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', resume);
      reduced.removeEventListener('change', resume);
      window.removeEventListener('pointermove', move);
      canvas.removeEventListener('webglcontextlost', lost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);
  return (
    <div className="opportunity-field" aria-hidden="true" data-ready={ready}>
      <div className="field-fallback" />
      <canvas ref={ref} />
    </div>
  );
}

const SCENES = [
  {
    title: 'A search with direction.',
    body: 'Start with your real experience, the work you want, and the places you want to do it. Keep every opportunity tied to a clear reason.',
    name: 'Discover',
    icon: 'search' as const,
  },
  {
    title: 'A case only you can make.',
    body: 'Bring your career facts and your model together. Shape your resume and introduction around the role, without inventing a different version of you.',
    name: 'Prepare',
    icon: 'file' as const,
  },
  {
    title: 'Momentum, with boundaries.',
    body: 'Schedule the research. Review the drafts. Give future auto-apply an explicit policy, and keep outreach approval in your hands.',
    name: 'Move forward',
    icon: 'command' as const,
  },
];
export function CareerFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setActive(Number((best.target as HTMLElement).dataset.scene));
      },
      { rootMargin: '-20% 0px -20% 0px', threshold: [0, 0.25, 0.5, 0.75] },
    );
    root.querySelectorAll('[data-scene]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <section className="career-flow dark-frame" id="how-it-works" ref={ref}>
      <div className="flow-intro">
        <h2>
          The search is a process.
          <br />
          <span>Make it work for you.</span>
        </h2>
        <p>
          From “what’s out there?” to “here’s my next move.”
          <br />
          Keep the work connected, every step of the way.
        </p>
      </div>
      <div className="flow-layout">
        <div className="flow-scenes">
          {SCENES.map((s, i) => (
            <article key={s.name} data-scene={i} data-active={active === i}>
              <h3>
                <Icon name={s.icon} size={21} />
                {s.title}
              </h3>
              <p>{s.body}</p>
              <a href={i === 0 ? '#product' : i === 1 ? '#features' : '#autopilot'}>
                Explore {s.name.toLowerCase()} <Icon name="arrowUpRight" size={15} />
              </a>
            </article>
          ))}
        </div>
        <div className="flow-screen">
          <div className="flow-screen-top">
            <span>
              <i /> Pursuit / Career workspace
            </span>
            <span>Illustrative workflow</span>
          </div>
          <div className="flow-view" data-scene-active={active}>
            <div className="flow-context">
              <Icon name="user" size={20} />
              <div>
                <strong>Your career brief</strong>
                <span>Software engineer · Remote · Full-time</span>
              </div>
              <Icon name="check" size={15} />
            </div>
            <div className="flow-result" aria-live="polite">
              {active === 0 ? (
                <>
                  <div className="flow-window-title">Find the work that fits.</div>
                  <p className="flow-muted">Illustrative roles · fictional companies</p>
                  {[
                    ['Platform Engineer', 'ExampleCorp', 'TypeScript · PostgreSQL'],
                    ['Product Engineer', 'GraphiteWorks', 'Product systems · React'],
                    ['Backend Engineer', 'TerraVine', 'APIs · Distributed systems'],
                  ].map(([role, company, skills], i) => (
                    <div className="opportunity-row" key={role}>
                      <span className="company-monogram">{company?.[0] ?? 'E'}</span>
                      <div>
                        <strong>{role}</strong>
                        <span>{company} · Remote</span>
                        <small>{skills}</small>
                      </div>
                      <Icon name={i === 0 ? 'arrowUpRight' : 'plus'} size={16} />
                    </div>
                  ))}
                  <div className="flow-bottom">
                    <Icon name="shield" size={15} /> Fit reasons stay attached to the record.
                  </div>
                </>
              ) : active === 1 ? (
                <>
                  <div className="flow-window-title">Your experience, made relevant.</div>
                  <p className="flow-muted">Platform Engineer / ExampleCorp</p>
                  <div className="flow-document">
                    <span>Experience · tailored emphasis</span>
                    <p>
                      Built internal developer tools with TypeScript and PostgreSQL, supporting a
                      12-person engineering team.
                    </p>
                    <div>
                      <Icon name="check" size={13} /> Grounded in the original experience
                    </div>
                  </div>
                  <div className="flow-model">
                    <img src="/brands/openai.svg" alt="" width={20} height={20} />
                    <span>Your selected model</span>
                    <Icon name="sparkles" size={15} />
                  </div>
                  <div className="flow-bottom">
                    <Icon name="file" size={15} /> Resume text · Cover letter · Outreach
                  </div>
                </>
              ) : (
                <>
                  <div className="flow-window-title">Move forward. Stay in control.</div>
                  <p className="flow-muted">Career autopilot / Policy preview</p>
                  <div className="flow-policy">
                    <div>
                      <span>Research schedule</span>
                      <strong>Daily</strong>
                    </div>
                    <div>
                      <span>Future application cap</span>
                      <strong>5 / day</strong>
                    </div>
                    <div>
                      <span>Outreach</span>
                      <strong>Approval required</strong>
                    </div>
                  </div>
                  <div className="flow-next">
                    <Icon name="clock" size={17} />
                    <div>
                      <strong>Auto-apply executor in development</strong>
                      <span>No applications are submitted by this preview.</span>
                    </div>
                  </div>
                  <div className="flow-bottom">
                    <Icon name="bell" size={15} /> Run history and completion notifications
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flow-screen-foot">
            <span>Your context. Your model. Your next move.</span>
            <div>
              {SCENES.map((s, i) => (
                <button
                  key={s.name}
                  data-active={i === active}
                  aria-pressed={i === active}
                  aria-label={`Show ${s.name} example`}
                  onClick={() => setActive(i)}
                >
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
