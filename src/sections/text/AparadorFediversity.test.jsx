import {describe,it,expect,vi,afterEach} from 'vitest';
import {act,render,screen,fireEvent,cleanup} from '@testing-library/react';
import AparadorFediversity from './AparadorFediversity.jsx';
import {aplicaAparadorR20,APARADOR_R20_TEXTS} from './pageContent.fediversityR20.js';
import {PAGE_COPY} from './pageContent.js';
import {localitzaPagina} from './pageContent.r10.js';
const PAGINES_DE_PATRIMONI=['anatomia-rural','herbari','banc-de-llavors','rutes-de-poble','arbres-monumentals'];
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
 /* Onada R9 · Les cinc pàgines de patrimoni (G3: + banc de llavors, rutes i arbres), enllaçades des de l'aparador en les 5 llengües: el títol i
    el subtítol són els de PAGE_COPY en la llengua de la interfície; l'anatomia, sense traducció, porta
    el lang i l'hreflang del valencià fora de la interfície en valencià. Cap fetch ni cap pestanya nova. */
 it.each(Object.keys(APARADOR_R20_TEXTS))('%s · enllaça les cinc pàgines de patrimoni amb el text de cada pàgina',language=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  render(<AparadorFediversity language={language}/>);
  const nav=screen.getByRole('navigation',{name:APARADOR_R20_TEXTS[language].patrimoni});
  expect(nav.querySelector('h3').textContent).toBe(APARADOR_R20_TEXTS[language].patrimoni);
  const enllacos=[...nav.querySelectorAll('a')];
  expect(enllacos.map(a=>[a.getAttribute('href'),a.getAttribute('target'),a.getAttribute('rel')])).toEqual(PAGINES_DE_PATRIMONI.map(clau=>[`/page/${clau}`,null,null]));
  for(const [a,clau] of enllacos.map((a,i)=>[a,PAGINES_DE_PATRIMONI[i]])){
   const pagina=localitzaPagina(PAGE_COPY[clau],language),llengua=pagina.contentLanguage||'ca';
   expect(a.textContent).toBe(pagina.title);
   expect(a.parentElement.textContent).toBe(`${pagina.title}: ${pagina.subtitle}`);
   expect([a.parentElement.getAttribute('lang'),a.getAttribute('hreflang')]).toEqual(llengua===language?[null,null]:[llengua,llengua]);
  }
  // L'herbari ja és traduït a les 5 llengües; l'anatomia continua només en valencià.
  expect(localitzaPagina(PAGE_COPY.herbari,language).title).toBe(language==='ca'?'Herbari de La Torre':PAGE_COPY.herbari.translations[language].title);
  // L'herbari i les tres pàgines de C5 són traduïdes a les 5 llengües: cap lang de més.
  for(const i of [1,2,3,4])expect(enllacos[i].parentElement.getAttribute('lang')).toBeNull();
  expect(screen.getByRole('region',{name:APARADOR_R20_TEXTS[language].compiler})).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
 });
 it('tres aparadors en cinc llengües, sense claims d’activació, i setter idempotent',()=>{
  const copy=Object.fromEntries(['fediversity','fedivers','node-zero'].map(key=>[key,{html:'<p>Base</p>',translations:Object.fromEntries(Object.keys(APARADOR_R20_TEXTS).map(l=>[l,{html:'<p>Base</p>'}]))}]));
  aplicaAparadorR20(copy);const once=JSON.stringify(copy);aplicaAparadorR20(copy);expect(JSON.stringify(copy)).toBe(once);
  for(const key of ['fediversity','fedivers','node-zero'])for(const lang of Object.keys(APARADOR_R20_TEXTS)){const html=copy[key].translations[lang].html;expect(html).toContain('6 ');expect(html).toContain('k=3');expect(html).toContain('3-2-1');expect(html).toContain('Mac mini M4');expect(html).toContain('/page/herbari');}
 });
});
