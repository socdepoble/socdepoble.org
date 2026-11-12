import {describe,it,expect,vi,afterEach} from 'vitest';
import {act,render as renderReact,screen,fireEvent,cleanup} from '@testing-library/react';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import AparadorFediversity from './AparadorFediversity.jsx';
import {aplicaAparadorR20,APARADOR_R20_TEXTS} from './pageContent.fediversityR20.js';
import {PAGE_COPY} from './pageContent.js';
import {localitzaPagina} from './pageContent.r10.js';
import {FEDIVERSITY_ACTORS,FEDIVERSITY_ARCHITECTURE_TEXTS,FEDIVERSITY_CONTRACT_COUNTS} from './fediversityArchitectureR11.js';
import {CAPACITATS,CONTRACTE_NUCLI} from '../../data/contracte.js';
const render = (component) => renderReact(component, { wrapper: MemoryRouter });
/* R19 (Carril 0+1) · El contracte és viu (src/data/contracte.js, carril de Codex): 52/151 a R18, 53/153 hui, i
   tornarà a moure's. Un literal es tornava roig a cada capacitat nova sense que l'Aparador mentira. L'oracle es
   recompta ací, directament del contracte i per un camí propi (cap .flat() ni la constant de l'Aparador), i la
   prova vigila el mateix: que l'Aparador diga les xifres del contracte viu, i no un número escrit a mà. */
const CONTRACTE_VIU=(()=>{
 const metodes=new Set(CONTRACTE_NUCLI);
 for(const [capacitat,llista] of Object.entries(CAPACITATS)){
  if(!Array.isArray(llista))throw new Error(`La capacitat ${capacitat} del contracte no és una llista de mètodes`);
  for(const metode of llista)metodes.add(metode);
 }
 return {capacitats:Object.keys(CAPACITATS).length,metodes:metodes.size};
})();
const xifraSola=(n)=>new RegExp(`(^|\\D)${n}(\\D|$)`);
const PAGINES_DE_PATRIMONI=['anatomia-rural','herbari','banc-de-llavors','rutes-de-poble','arbres-monumentals'];
/* R11 loop 3 (R35-L2-01/02/03/04/07) · Oracle escrit a mà, independent de les constants que pinten el DOM:
   les etiquetes de la font (architecture.pdf, p. 1), un ancoratge per rol i per llengua (pp. 1 i 4), un ancoratge per pas (p. 5)
   i els dos enllaços fixos de l'evidència. Amb arrays copiats de les constants, la prova passaria amb qualsevol text. */
const LLENGUES_DE_L_ARQUITECTURA=['ca','es','en','eu','gl'];
const ROLS_DE_LA_FONT=['Maintainers','Developers','Hosting provider','Operator','User'];
const ANCORATGES_DELS_ROLS={
 ca:['desplegament','mòduls d’aplicació','infraestructura','configura aplicacions','contingut'],
 es:['despliegue','módulos de aplicación','infraestructura','configura aplicaciones','contenido'],
 en:['deployment','application modules','infrastructure','configures applications','content'],
 eu:['hedapen','aplikazio moduluak','azpiegitura','konfiguratzen','edukia'],
 gl:['despregamento','módulos de aplicación','infraestrutura','configura aplicacións','contido'],
};
const ANCORATGES_DELS_PASSOS={ca:['DNS','reproduïble','URL'],es:['DNS','reproducible','URL'],en:['DNS','reproducible','URL'],eu:['DNS','erreproduzigarri','URL'],gl:['DNS','reproducible','URL']};
const TITOLS_DE_LA_FONT={"ca":"Responsabilitats i portabilitat de Fediversity","es":"Responsabilidades y portabilidad de Fediversity","en":"Fediversity responsibilities and portability","eu":"Fediversityren ardurak eta eramangarritasuna","gl":"Responsabilidades e portabilidade de Fediversity"};
const LIMIT_DEL_MODUL_PROPI={"ca":"encara no és un mòdul d’aplicació de Fediversity","es":"todavía no es un módulo de aplicación de Fediversity","en":"it is not yet a Fediversity application module","eu":"oraindik ez da Fediversityren aplikazio modulu bat","gl":"aínda non é un módulo de aplicación de Fediversity"};
const LIMIT_DE_L_API={ca:'la font no acredita eixa API',es:'la fuente no acredita esa API',en:'the source does not establish that API',eu:'iturriak ez du API hori frogatzen',gl:'a fonte non acredita esa API'};
const CLAUS_DELS_ROLS=['maintainers','developers','hostingProvider','operator','user'];
const ENLLACOS_DE_LA_SECCIO=['https://fediversity.eu/wp-content/uploads/2025/07/architecture.pdf',
 'https://github.com/socdepoble/socdepoble.org/blob/64e242dace633e8f80e0fa7522ebc0d2fc917494/nix/module.nix',
 'https://github.com/socdepoble/socdepoble.org/blob/64e242dace633e8f80e0fa7522ebc0d2fc917494/tests/fediversity-nixos-module.test.mjs'];
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('Aparador verificable R20',()=>{
 it('arquitectura: cinc llengües amb els mateixos cinc rols per clau, tres passos i cap text buit',()=>{
  expect(Object.keys(FEDIVERSITY_ARCHITECTURE_TEXTS).sort()).toEqual([...LLENGUES_DE_L_ARQUITECTURA].sort());
  expect(Object.values(FEDIVERSITY_ACTORS)).toEqual(ROLS_DE_LA_FONT);
  expect(FEDIVERSITY_CONTRACT_COUNTS).toEqual(CONTRACTE_VIU);
  for(const n of Object.values(CONTRACTE_VIU))expect(Number.isInteger(n)&&n>0).toBe(true);
  expect(CONTRACTE_VIU.metodes).toBeGreaterThan(new Set(CONTRACTE_NUCLI).size);
  for(const text of Object.values(FEDIVERSITY_ARCHITECTURE_TEXTS)){
   expect(Object.keys(text.actors).sort()).toEqual([...CLAUS_DELS_ROLS].sort());
   expect(text.steps).toHaveLength(3);
   for(const valor of [text.title,text.source,text.flow,text.portability,text.evidence,text.sourceUi,text.contract,...Object.values(text.actors),...text.steps])expect(valor.trim()).not.toBe('');
  }
 });
 it.each(LLENGUES_DE_L_ARQUITECTURA)('%s · responsabilitats de la font i tres passos de migració accessibles sense activar serveis',language=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  render(<AparadorFediversity language={language}/>);
  const region=screen.getByRole('region',{name:TITOLS_DE_LA_FONT[language]});
  expect(region.querySelector('h3').textContent).toBe(TITOLS_DE_LA_FONT[language]);
  expect(region.querySelector('p').textContent).toMatch(xifraSola(CONTRACTE_VIU.capacitats));expect(region.querySelector('p').textContent).toMatch(xifraSola(CONTRACTE_VIU.metodes));
  expect(region.textContent).not.toMatch(/\{capacitats\}|\{metodes\}|100\s*%|<\s*15\s*min/);
  // R35-L2-01: jsdom no mesura la graella de :where(dl); la prova fixa que dt i dd en siguen fills directes i alternats.
  const dl=region.querySelector('dl');
  expect(dl.querySelectorAll(':scope > div')).toHaveLength(0);
  expect([...dl.children].map(el=>el.tagName)).toEqual(ROLS_DE_LA_FONT.flatMap(()=>['DT','DD']));
  expect([...dl.querySelectorAll(':scope > dt')].map(el=>el.textContent)).toEqual(ROLS_DE_LA_FONT);
  expect([...dl.querySelectorAll(':scope > dt')].map(el=>el.lang)).toEqual(ROLS_DE_LA_FONT.map(()=>'en'));
  const dds=[...dl.querySelectorAll(':scope > dd')];
  expect(dds).toHaveLength(5);
  dds.forEach((dd,i)=>expect(dd.textContent.toLowerCase()).toContain(ANCORATGES_DELS_ROLS[language][i].toLowerCase()));
  const passos=[...region.querySelectorAll('ol > li')].map(el=>el.textContent);
  expect(passos).toHaveLength(3);
  passos.forEach((pas,i)=>expect(pas).toContain(ANCORATGES_DELS_PASSOS[language][i]));
  expect(region.querySelector('code').textContent).toBe('application-options → config-mapping → resource-mapping → staged → deployed');
  // The official source names a demo front-end; the requested API is still pending evidence.
  expect(region.textContent).toContain('demo front-end');expect(region.textContent).toContain('Nix-Panel API');
  expect(region.textContent).toContain(LIMIT_DEL_MODUL_PROPI[language]);
  expect(region.textContent).toContain(LIMIT_DE_L_API[language]);
  expect(region.textContent).toMatch(/execució|ejecución|execution|exekuzio|execución/);
  expect(region.textContent).toContain('services.socdepoble');
  const enllacos=[...region.querySelectorAll('a')];
  expect(enllacos.map(a=>a.href)).toEqual(ENLLACOS_DE_LA_SECCIO);
  for(const a of enllacos)expect(a.rel.split(' ')).toEqual(expect.arrayContaining(['noopener','noreferrer']));
  expect(fetch).not.toHaveBeenCalled();
 });
 it('arquitectura: reordenar claus de la traducció conserva cada responsabilitat al seu rol',()=>{
  const text=FEDIVERSITY_ARCHITECTURE_TEXTS.ca,original=text.actors;
  text.actors=Object.fromEntries(Object.entries(original).reverse());
  try{
   render(<AparadorFediversity language="ca"/>);
   const dl=screen.getByRole('region',{name:TITOLS_DE_LA_FONT.ca}).querySelector('dl');
   expect([...dl.querySelectorAll('dt')].map(el=>el.textContent)).toEqual(ROLS_DE_LA_FONT);
   [...dl.querySelectorAll('dd')].forEach((dd,i)=>expect(dd.textContent).toContain(ANCORATGES_DELS_ROLS.ca[i]));
  }finally{text.actors=original;}
 });
 it('compilació local real amb OKF, font privada i sense fetch',async()=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  const {container}=render(<AparadorFediversity language="ca"/>);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'Al poble recordem les festes i la vida de les famílies. L’agricultura i les collites reunien els veïns cada estiu.'}});
  fireEvent.click(screen.getByRole('button',{name:'Compila en local'}));
  await screen.findByRole('heading',{name:'Esborrany privat'},{timeout:8000});
  expect(container.querySelector('pre').textContent).toContain('visibility: "private"');expect(container.querySelector('pre').textContent).toContain('SHA-256');expect(fetch).not.toHaveBeenCalled();expect(container.querySelector('[data-sdp-privat="true"]')).toBeTruthy();vi.unstubAllGlobals();
 });
 it('R104 · el batec de vida i el protocol d’emergències, una vegada cadascun i després de la secció privada',()=>{
  const {container}=render(<AparadorFediversity language="ca"/>);
  const privat=container.querySelector('[data-sdp-privat="true"]');
  const batec=container.querySelectorAll('[data-sdp-batec-vida="true"]'),emergencies=container.querySelectorAll('[data-sdp-emergencies-offline="true"]');
  expect([batec.length,emergencies.length]).toEqual([1,1]);
  expect(batec[0].querySelector('a').getAttribute('href')).toBe('/page/avisador');
  for(const targeta of [batec[0],emergencies[0]])expect(privat.compareDocumentPosition(targeta)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
