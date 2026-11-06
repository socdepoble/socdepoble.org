import {describe,it,expect,vi,afterEach} from 'vitest';
import {act,render,screen,fireEvent,cleanup} from '@testing-library/react';
import AparadorFediversity from './AparadorFediversity.jsx';
import {aplicaAparadorR20,APARADOR_R20_TEXTS} from './pageContent.fediversityR20.js';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('Aparador verificable R20',()=>{
 it('compilació local real amb OKF, font privada i sense fetch',async()=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  const {container}=render(<AparadorFediversity language="ca"/>);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'Al poble recordem les festes i la vida de les famílies. L’agricultura i les collites reunien els veïns cada estiu.'}});
  fireEvent.click(screen.getByRole('button',{name:'Compila en local'}));
  await screen.findByRole('heading',{name:'Esborrany privat'});
  expect(container.querySelector('pre').textContent).toContain('visibility: "private"');expect(container.querySelector('pre').textContent).toContain('SHA-256');expect(fetch).not.toHaveBeenCalled();expect(container.querySelector('[data-sdp-privat="true"]')).toBeTruthy();vi.unstubAllGlobals();
 });
 it('resposta tardana no reapareix després d’esborrar la prova',async()=>{
  let resume;const carrega=()=>new Promise(resolve=>{resume=resolve;});
  render(<AparadorFediversity language="ca" carrega={carrega}/>);fireEvent.change(screen.getByRole('textbox'),{target:{value:'Relat de prova.'}});fireEvent.click(screen.getByRole('button',{name:'Compila en local'}));fireEvent.click(screen.getByRole('button',{name:'Esborra la prova'}));
  const compiled=vi.fn(async()=>({articles:[{sha256:'fake',markdown:'vell'}]})),estructura=vi.fn(()=>({titol:'T',okf:{}}));
  await act(async()=>resume([{compilaWikiKarpathy:compiled},{estructuraMemoriaOral:estructura}]));
  expect(estructura).not.toHaveBeenCalled();expect(compiled).not.toHaveBeenCalled();expect(screen.queryByText('vell')).toBeNull();expect(screen.getByRole('textbox').value).toBe('');
 });
 it('desmuntar abans del loader evita estructurar o compilar el relat privat pendent',async()=>{
  let resume;const carrega=vi.fn(()=>new Promise(resolve=>{resume=resolve;}));
  const estructura=vi.fn(()=>({titol:'T',okf:{}})),compiled=vi.fn(async()=>({articles:[{sha256:'fake',markdown:'relat antic'}]}));
  const {unmount}=render(<AparadorFediversity language="ca" carrega={carrega}/>);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'Relat privat pendent de carregar el compilador.'}});fireEvent.click(screen.getByRole('button',{name:'Compila en local'}));
  expect(carrega).toHaveBeenCalledOnce();unmount();
  await act(async()=>resume([{compilaWikiKarpathy:compiled},{estructuraMemoriaOral:estructura}]));
  expect(estructura).not.toHaveBeenCalled();expect(compiled).not.toHaveBeenCalled();
 });
 it('tres aparadors en cinc llengües, sense claims d’activació, i setter idempotent',()=>{
  const copy=Object.fromEntries(['fediversity','fedivers','node-zero'].map(key=>[key,{html:'<p>Base</p>',translations:Object.fromEntries(Object.keys(APARADOR_R20_TEXTS).map(l=>[l,{html:'<p>Base</p>'}]))}]));
  aplicaAparadorR20(copy);const once=JSON.stringify(copy);aplicaAparadorR20(copy);expect(JSON.stringify(copy)).toBe(once);
  for(const key of ['fediversity','fedivers','node-zero'])for(const lang of Object.keys(APARADOR_R20_TEXTS)){const html=copy[key].translations[lang].html;expect(html).toContain('6 ');expect(html).toContain('k=3');expect(html).toContain('3-2-1');expect(html).toContain('Mac mini M4');expect(html).toContain('/page/herbari');}
 });
});
