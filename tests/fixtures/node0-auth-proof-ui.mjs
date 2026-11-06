import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import assert from 'node:assert/strict';
import {VERSIO_POLITICA_PRIVACITAT} from '../../src/config/politicaPrivacitat.js';
const req=createRequire(import.meta.url),{build}=req('esbuild');
export async function verificaAmbFormulari({token,password,onConfirma}){
 const dom=new JSDOM('<div id="root"></div>',{url:'https://socdepoble.cat/confirmar-correu'}),saved=new Map();
 for(const key of ['window','document','navigator','HTMLElement','IS_REACT_ACT_ENVIRONMENT'])saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
 Object.defineProperties(globalThis,{window:{value:dom.window,configurable:true},document:{value:dom.window.document,configurable:true},navigator:{value:dom.window.navigator,configurable:true},HTMLElement:{value:dom.window.HTMLElement,configurable:true},IS_REACT_ACT_ENVIRONMENT:{value:true,configurable:true,writable:true}});
 const result=await build({entryPoints:[new URL('../../src/sections/onboarding/ProvaCorreuAmbContrasenya.jsx',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'canonical-react',setup(b){b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},arg=>({path:req.resolve(arg.path),external:true}));}}]});
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-email-proof-ui-')),bundle=path.join(temp,'proof.mjs');fs.writeFileSync(bundle,result.outputFiles[0].contents,{flag:'wx',mode:0o600});
 const{ProvaCorreuAmbContrasenya}=await import(pathToFileURL(bundle).href),React=await import('react'),{createRoot}=await import('react-dom/client'),{fireEvent}=await import('@testing-library/react'),{act}=React;
 const root=createRoot(dom.window.document.getElementById('root'));let pending;
 try{
  await act(async()=>root.render(React.createElement(ProvaCorreuAmbContrasenya,{token,onConfirma:(...args)=>{pending=onConfirma(...args);return pending;}})));
  const inputs=dom.window.document.querySelectorAll('input');assert.equal(inputs[2].checked,false);assert.equal(dom.window.document.querySelector('a').textContent.includes(`versió ${VERSIO_POLITICA_PRIVACITAT}`),true);
  await act(async()=>{fireEvent.change(inputs[0],{target:{value:password}});fireEvent.change(inputs[1],{target:{value:password}});fireEvent.click(inputs[2]);});
  await act(async()=>{fireEvent.submit(dom.window.document.querySelector('form'));await pending;});
  assert.match(dom.window.document.body.textContent,/Ara pots entrar amb el correu/);
  for(const input of inputs)assert.equal(input.type==='checkbox'?input.checked:input.value,input.type==='checkbox'?false:'');
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[key,d]of saved)if(d)Object.defineProperty(globalThis,key,d);else Reflect.deleteProperty(globalThis,key);fs.rmSync(temp,{recursive:true,force:true});}
}
