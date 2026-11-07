/** Native Chrome/CDP visual QA. Uses an isolated profile and no dependencies. */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { LINE_ENDS } from './vendor/line-ends.mjs';
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const url = option('--url', 'http://127.0.0.1:3347/tooling/anatomia/preview.html');
const out = resolve(option('--out', '/tmp/sdp-r31-browser-shots'));
const scratch = await mkdtemp(join(tmpdir(), 'sdp-r31-chrome-'));
const profile = join(scratch, 'profile');
const cache = join(scratch, 'cache');
await Promise.all([mkdir(profile), mkdir(cache), mkdir(out, { recursive: true })]);
const chrome = spawn(process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--disk-cache-dir=${cache}`,
  '--use-mock-keychain', '--password-store=basic', '--no-first-run', '--no-default-browser-check',
  '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });
let socket;
const report = { url, offline: url.startsWith('file:'), networkRequests: [], scenarios: [], problems: [] };
try {
  let port;
  for (let index = 0; index < 100 && !port; index += 1) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); }
    catch { await delay(100); }
  }
  if (!port) throw new Error('Chrome did not open its isolated debugging port');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 0;
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const handler = pending.get(message.id);
      pending.delete(message.id);
      message.error ? handler.reject(new Error(JSON.stringify(message.error))) : handler.resolve(message.result);
    }
    if (message.method === 'Network.requestWillBeSent' && /^https?:/.test(message.params.request.url)) {
      report.networkRequests.push(message.params.request.url);
      if (report.offline) report.problems.push('Offline demo attempted a network request: '+message.params.request.url);
    }
    if (message.method === 'Runtime.exceptionThrown') report.problems.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type))
      report.problems.push(`${message.params.type}: ${message.params.args.map((argument) => argument.value || argument.description || '').join(' ')}`);
  });
  await new Promise((done) => socket.addEventListener('open', done, { once: true }));
  const send = (method, params = {}) => new Promise((resolveCall, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(id, { resolve: (result) => { clearTimeout(timeout); resolveCall(result); }, reject: (error) => { clearTimeout(timeout); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result?.value;
  };
  const until = async (expression) => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`Page condition timed out: ${expression}`);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  if(report.offline) await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1100, deviceScaleFactor: 1, mobile: false });
  const media = async (reduced, theme) => {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }, { name: 'prefers-color-scheme', value: theme }] });
    await evaluate(`document.documentElement.dataset.theme = '${theme}'`);
  };
  await media(true, 'light');
  const probe = await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const proto = window.WebGLRenderingContext?.prototype;
    if (!proto) return;
    const original = proto.drawArrays;
    window.__pouGLAudit = { draws: 0, edgeMax: 0, samples: [], shaderErrors: [] };
    const compile=proto.compileShader;
    proto.compileShader=function(shader){compile.call(this,shader);if(!this.getShaderParameter(shader,this.COMPILE_STATUS))window.__pouGLAudit.shaderErrors.push(this.getShaderInfoLog(shader));};
    proto.drawArrays = function(...parameters) {
      original.apply(this, parameters);
      const audit = window.__pouGLAudit;
      audit.draws++;
      if (audit.samples.length >= 64 || this.getParameter(this.FRAMEBUFFER_BINDING)) return;
      const w = this.drawingBufferWidth, h = this.drawingBufferHeight;
      const e = Math.min(10, w, h);
      if (!e) return;
      let maximum = 0;
      for (const [x, y, width, height] of [[0,0,w,e],[0,h-e,w,e],[0,0,e,h],[w-e,0,e,h]]) {
        const pixels = new Uint8Array(width*height*4);
        this.readPixels(x,y,width,height,this.RGBA,this.UNSIGNED_BYTE,pixels);
        for (const channel of pixels) maximum = Math.max(maximum,channel);
      }
      audit.edgeMax = Math.max(audit.edgeMax, maximum);
      const program=this.getParameter(this.CURRENT_PROGRAM);
      const read=(name)=>{ const location=this.getUniformLocation(program,name); const v=location?this.getUniform(program,location):null; return ArrayBuffer.isView(v)?Array.from(v):v; };
      audit.samples.push({ draw: audit.draws, edgeMax: maximum, width: w, height: h, fog:read('uFog'), flow:read('uFlow'), iceMove:read('uIceMove'), cameraScale:read('uK'), cameraOrigin:read('uOrigin') });
      const debug = this.getExtension('WEBGL_debug_renderer_info');
      audit.renderer = this.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : this.RENDERER);
    };
  })();` });
  const navigate = async () => {
    await send('Page.navigate', { url });
    await until(`!!document.querySelector('.pou-neu-card [data-part]')`);
    await evaluate(`document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`);
    await delay(300);
  };
  const snapshot = async (name, zoom = false) => {
    const state = await evaluate(`(() => {
      const card = document.querySelector('.pou-neu-card'), stage = card.querySelector('.pou-neu-stage');
      const box = (${zoom} ? stage : card).getBoundingClientRect();
      const corners = [...card.querySelectorAll('g[data-part]')].flatMap(group => {
        const b=group.getBBox(), m=group.ownerSVGElement.getCTM().inverse().multiply(group.getCTM());
        return [[b.x,b.y],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));
      });
      const xs=corners.map(p=>p.x), ys=corners.map(p=>p.y);
      const bounds={x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
      const rgb=text=>{const channels=text.match(/[0-9.]+/g).slice(0,3).map(Number);return text.startsWith('color(srgb')?channels:channels.map(c=>c/255);};
      const luminance=channels=>channels.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
      const controls=[...card.querySelectorAll('button,input,select')].map(node=>{
        const css=getComputedStyle(node), ink=luminance(rgb(css.color)), paper=luminance(rgb(css.backgroundColor));
        return {text:node.textContent,height:node.getBoundingClientRect().height,contrast:(Math.max(ink,paper)+.05)/(Math.min(ink,paper)+.05)};
      });
      const outflow=[...card.querySelectorAll('[data-fluid=outflow]')].map(node=>getComputedStyle(node).visibility!=='hidden'&&getComputedStyle(node).display!=='none');
      const fadeSamples=[...card.querySelectorAll('g[opacity] > .pou-neu-line')].filter(path=>Number(path.parentElement.getAttribute('opacity'))>0&&Number(path.parentElement.getAttribute('opacity'))<1).slice(0,12).map(path=>{
        const groupAlpha=Number(getComputedStyle(path.parentElement).opacity), toneAlpha=Number(getComputedStyle(path).opacity);
        let renderedAlpha=1;
        for(let node=path;node&&node!==stage;node=node.parentElement)renderedAlpha*=Number(getComputedStyle(node).opacity);
        return {groupAlpha,toneAlpha,renderedAlpha};
      });
      return { language: card.lang, azimuth: stage.dataset.azimuth, exploded: stage.dataset.exploded, season:stage.dataset.season, outflow, fadeSamples,
        solids: new Set([...card.querySelectorAll('g[data-part]')].map(node=>node.dataset.physicalId)).size, drawItems:card.querySelectorAll('g[data-part]').length, declaredSolids:Number(stage.dataset.physicalSolids), bounds, controls,
        assemblies: [...new Set([...card.querySelectorAll('g[data-part]')].map(p=>p.dataset.assembly))],
        readout: card.querySelector('[data-readout]')?.textContent,
        webgl: stage.hasAttribute('data-gl'), gl: window.__pouGLAudit,
        overflow: document.documentElement.scrollWidth > innerWidth,
        clip: { x: Math.max(0,box.x+scrollX), y: box.y+scrollY, width: Math.min(innerWidth,box.width), height: box.height, scale: ${zoom ? 4 : 1} }
      };
    })()`);
    if (state.season==='winter'&&state.outflow.some(Boolean)) report.problems.push(`${name}: winter jet visible with zero melt flow`);
    if (state.season==='summer'&&!state.outflow.some(Boolean)) report.problems.push(`${name}: summer jet missing`);
    if (!state.fadeSamples.length) report.problems.push(`${name}: no computed fading texture groups`);
    if (state.controls.some(control=>control.height<44)) report.problems.push(`${name}: control touch target below44px`);
    if (state.controls.filter(control=>control.text).some(control=>control.contrast<4.5)) report.problems.push(`${name}: text control contrast below4.5:1`);
    if (state.overflow) report.problems.push(`${name}: horizontal overflow`);
    if (/^(webgl-|spring-)/.test(name)&&!state.webgl) report.problems.push(`${name}: expected live WebGL on the test GPU`);
    if (/^no-webgl-/.test(name)&&state.webgl) report.problems.push(`${name}: fallback did not disable WebGL`);
    if (state.gl?.shaderErrors?.length) report.problems.push(`${name}: shader compile errors: ${state.gl.shaderErrors.join(' | ')}`);
    if (state.gl?.edgeMax > 0) report.problems.push(`${name}: canvas edge channels ${state.gl.edgeMax}`);
    if (state.assemblies.length !== 7 || state.solids < 85 || state.solids > 110 || state.solids !== state.declaredSolids) report.problems.push(`${name}: missing model parts`);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: state.clip });
    await writeFile(join(out, `${name}.png`), Buffer.from(shot.data, 'base64'));
    delete state.clip;
    report.scenarios.push({ name, ...state });
    console.log(name, JSON.stringify({ solids: state.solids, assemblies: state.assemblies.length, webgl: state.webgl, overflow: state.overflow }));
  };
  const lineAudit=async(name)=>{
    await evaluate(`document.querySelectorAll('.pou-neu-line').forEach(path=>{path.classList.add('iso-line');if(path.classList.contains('pou-neu-edge'))path.classList.add('iso-edge');else if(path.parentElement.hasAttribute('data-part'))path.classList.add(path.getAttribute('data-tone')==='mid'?'iso-bevel':'iso-crease');})`);
    const result=await evaluate(`(${LINE_ENDS})({select:'.pou-neu-card',show:true,tolerance:1})`);
    await writeFile(join(out,name+'.json'),JSON.stringify(result,null,2)+'\n');
    console.log(name+': line ends '+result.problems.length+' of '+result.ends+' ends on '+result.lines+' lines float');
    if(!result.lines)report.problems.push(name+': checker did not inspect actual texture lines');
    if(result.problems.length)report.problems.push(name+': '+result.problems.length+' floating line ends');
    await snapshot(name);
    await evaluate(`document.querySelector('[data-line-ends]')?.remove()`);
  };
  await navigate();
  if(args.includes('--lines')){
    await lineAudit('lines-compact-light');
    await evaluate(`document.querySelector('[data-explode-toggle]').click()`);
    await lineAudit('lines-exploded-light');
    await media(true,'dark');
    await lineAudit('lines-exploded-dark');
    await evaluate(`document.querySelector('[data-explode-toggle]').click()`);
    await lineAudit('lines-compact-dark');
    await evaluate(`(() => { const select=document.querySelector('select[data-season]'); select.selectedIndex=1; select.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    await lineAudit('lines-summer-compact-dark');
    await evaluate(`document.querySelector('[data-explode-toggle]').click()`);
    await lineAudit('lines-summer-exploded-dark');
    await media(true,'light');
    await lineAudit('lines-summer-exploded-light');
    await evaluate(`document.querySelector('[data-explode-toggle]').click()`);
    await lineAudit('lines-summer-compact-light');
    await writeFile(join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
    if(report.problems.length){console.error(report.problems.join('\n'));process.exitCode=1;}
  }else if(args.includes('--locales')){
    for(const language of ['ca','es','en','eu','gl']){
      const destination=new URL(url);destination.searchParams.set('lang',language);
      await send('Page.navigate',{url:destination.href});
      await until(`!!document.querySelector('.pou-neu-card [data-part]')`);
      if(await evaluate(`document.querySelector('.pou-neu-card').lang`)!==language)report.problems.push('Offline locale did not switch to '+language);
      await snapshot('offline-locale-'+language);
    }
    await writeFile(join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
    if(report.problems.length){console.error(report.problems.join('\n'));process.exitCode=1;}
  }else if(args.includes('--roof')){
    await snapshot('desktop-compact-light');
    await snapshot('detail-compact-4x',true);
    await evaluate(`document.querySelector('[data-explode-toggle]').click()`);
    await snapshot('desktop-exploded-light');
    await snapshot('detail-exploded-4x',true);
    await writeFile(join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
    if(report.problems.length){console.error(report.problems.join('\n'));process.exitCode=1;}
  }else{
  await snapshot('desktop-compact-light');
  await snapshot('detail-compact-4x', true);
  await evaluate(`document.querySelector('[data-explode-toggle]').click()`);
  await snapshot('desktop-exploded-light');
  await snapshot('detail-exploded-4x', true);
  for (const angle of [25, 65]) {
    await evaluate(`(() => { const input = document.querySelector('input[type="range"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'${angle}'); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    await snapshot(`azimuth-${angle}`);
  }
  await evaluate(`(() => { const select = document.querySelector('select[data-season]'); select.selectedIndex=1; select.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await snapshot('summer-exploded');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await snapshot('phone-exploded');
  await media(true,'dark');
  await snapshot('phone-dark');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1100, deviceScaleFactor: 1, mobile: false });
  await media(false,'light');
  await navigate();
  await delay(1200);
  await snapshot('webgl-live');
  const seasonChange=async(index)=>evaluate(`(() => { window.__pouGLAudit.samples=[]; const select=document.querySelector('select[data-season]'); select.selectedIndex=${index}; select.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await seasonChange(1);
  await delay(450);
  await snapshot('webgl-summer-transition');
  await delay(1200);
  await snapshot('webgl-summer-steady');
  await seasonChange(0);
  await delay(450);
  await snapshot('webgl-winter-transition');
  await delay(1200);
  await snapshot('webgl-winter-steady');
  await evaluate(`document.querySelector('[data-explode-toggle]').click()`);
  await delay(150);
  await snapshot('spring-transition');
  await delay(2500);
  await snapshot('spring-settled');
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: probe.identifier });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const original=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(type,...rest){ return /^webgl|experimental-webgl/.test(type)?null:original.call(this,type,...rest); }; })();` });
  await navigate();
  await snapshot('no-webgl-light');
  await media(true,'dark');
  await navigate();
  await snapshot('no-webgl-dark');
  await writeFile(join(out,'browser-report.json'), `${JSON.stringify(report,null,2)}\n`);
  if (report.problems.length) { console.error(report.problems.join('\n')); process.exitCode=1; }
  }
} catch (error) {
  report.problems.push(error.message);
  await writeFile(join(out,'browser-report.json'), `${JSON.stringify(report,null,2)}\n`);
  throw error;
} finally {
  socket?.close();
  chrome.kill('SIGKILL');
  await delay(150);
  await rm(scratch,{recursive:true,force:true,maxRetries:3});
}
