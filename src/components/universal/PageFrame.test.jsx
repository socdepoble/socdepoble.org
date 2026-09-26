import {render,cleanup} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
vi.mock('../../config/assetResolver',()=>({resolveAsset:uri=>uri}));
vi.mock('../PedraSeca/hooks/useAccions.js',()=>({useAccions:()=>({})}));
import {PageFrame} from './PageFrame.jsx';
afterEach(cleanup);
for(const avatar of ['javascript:alert(1)','//tracker.test/avatar',{},null])test(`avatar no segur ${String(avatar)} usa fallback`,()=>{
  const {container}=render(<PageFrame chrome="context" authorAvatar={avatar} title="Perfil"/>);
  expect(container.querySelector('img.sp-card-avatar')).toBeNull();
  expect(container.querySelector('.sp-card-avatar--fallback.sp-card-avatar--amagat')).toBeNull();
});
test('avatar local vàlid conserva la imatge',()=>{
  const {container}=render(<PageFrame chrome="context" authorAvatar="/assets/profile.png" title="Perfil"/>);
  expect(container.querySelector('img.sp-card-avatar').getAttribute('src')).toBe('/assets/profile.png');
});

/* Llei del Píxel: sense la ranura `classificacio`, el bloc del títol és byte a
   byte el d'abans (Mur, Perfil, Pàgines i la lectura no la passen mai). */
const CAPCALERA_SENSE_RANURA='<header class="page-title"><h1>Títol</h1>'
  +'<ul class="sp-card-labels page-title-labels" aria-label="Categories">'
  +'<li class="sp-card-label sdp-badge-tag">Sistema</li><li class="sp-card-label sdp-badge-system">Mur</li></ul>'
  +'<p class="sp-card-copyright page-title-copyright">© Sóc de Poble</p></header>';
const LABELS=['Sistema',{text:'Mur',className:'sdp-badge-system'}];
test('sense ranura de classificació, la capçalera no canvia ni un node',()=>{
  const {container}=render(<PageFrame title="Títol" labels={LABELS} copyright="© Sóc de Poble"/>);
  expect(container.querySelector('header.page-title').outerHTML).toBe(CAPCALERA_SENSE_RANURA);
});
test('amb ranura, la botonera va just davall del títol i substituïx les píndoles',()=>{
  const {container}=render(<PageFrame title="Títol" labels={LABELS} copyright="© Sóc de Poble"
    classificacio={<div data-testid="botonera">Botonera</div>}/>);
  const capcalera=container.querySelector('header.page-title');
  expect([...capcalera.children].map(e=>e.tagName+'.'+e.className)).toEqual([
    'H1.', 'DIV.page-title-classificacio', 'P.sp-card-copyright page-title-copyright'
  ]);
  expect(capcalera.querySelector('.page-title-classificacio [data-testid="botonera"]')).not.toBeNull();
  expect(capcalera.querySelector('.page-title-labels')).toBeNull();
});
test('la ranura sola ja fa aparéixer el bloc del títol',()=>{
  const {container}=render(<PageFrame classificacio={<span>b</span>}/>);
  expect(container.querySelector('header.page-title .page-title-classificacio')).not.toBeNull();
});

/* Poliment editorial 260925: l'H1 i l'H2 de .page-intro no porten punt final. */
test('H1 i H2 sense punt final; l’entradilla el conserva',()=>{
  const {container}=render(<PageFrame title="Títol." subtitle="Subtítol.  " lead="Entradilla."/>);
  expect(container.querySelector('header.page-title h1').textContent).toBe('Títol');
  expect(container.querySelector('.page-intro h2').textContent).toBe('Subtítol');
  expect(container.querySelector('.page-intro p.lead').textContent).toBe('Entradilla.');
});
test('els suspensius es queden, i un títol que no és text passa tal qual',()=>{
  const {container}=render(<PageFrame title="Continuarà..." subtitle="I després…"/>);
  expect(container.querySelector('header.page-title h1').textContent).toBe('Continuarà...');
  expect(container.querySelector('.page-intro h2').textContent).toBe('I després…');
  cleanup();
  const node=render(<PageFrame title={<span>Node.</span>} subtitle={<em>Subnode.</em>}/>).container;
  expect(node.querySelector('header.page-title h1 > span').textContent).toBe('Node.');
  expect(node.querySelector('.page-intro h2 > em').textContent).toBe('Subnode.');
});
