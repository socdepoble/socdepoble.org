import {render,cleanup,act,fireEvent} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
vi.mock('../../config/assetResolver',()=>({resolveAsset:uri=>uri}));
vi.mock('../PedraSeca/hooks/useAccions.js',()=>({useAccions:()=>({})}));
import {PageFrame,selectorIndex} from './PageFrame.jsx';
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

/* T2 (ordre del Mestre, 260930) · L'Índex recull tots els encapçalaments,
   de h1 a h6, si la pàgina no en demana menys: els h4, h5 i h6 de les
   targetes hi entren a totes les pàgines, no només a la Consola. */
const CONTINGUT_INDEX=<><h3>Targeta</h3><h4>Subtítol</h4><h5>38 rebuts</h5><h6>Nota</h6></>;
const obriIndex=(container)=>fireEvent.click(container.querySelector('button[aria-label="Índex de secció"]'));
const entradesIndex=()=>[...document.querySelectorAll('.toc-nav li')].map(li=>[li.className,li.textContent]);
test('T2 · sense nivellMaxIndex, l’Índex recull fins a h6, cada entrada amb el seu nivell',()=>{
  const {container}=render(<PageFrame chrome="system" title="T">{CONTINGUT_INDEX}</PageFrame>);
  obriIndex(container);
  expect(entradesIndex()).toEqual([
    ['toc-item toc-level-3','Targeta'],['toc-item toc-level-4','Subtítol'],
    ['toc-item toc-level-5','38 rebuts'],['toc-item toc-level-6','Nota']
  ]);
});
test('T2 · una pàgina encara pot demanar-ne menys: amb nivellMaxIndex={4}, h5 i h6 no; amb 5, h6 no',()=>{
  const {container,unmount}=render(<PageFrame chrome="system" title="T" nivellMaxIndex={4}>{CONTINGUT_INDEX}</PageFrame>);
  obriIndex(container);
  expect(entradesIndex()).toEqual([['toc-item toc-level-3','Targeta'],['toc-item toc-level-4','Subtítol']]);
  unmount();
  const cinc=render(<PageFrame chrome="system" title="T" nivellMaxIndex={5}>{CONTINGUT_INDEX}</PageFrame>);
  obriIndex(cinc.container);
  expect(entradesIndex().map(([classe])=>classe)).toEqual(['toc-item toc-level-3','toc-item toc-level-4','toc-item toc-level-5']);
});
test('T2 · el selector de l’Índex es limita a h1-h6, i un valor que no és enter torna al per defecte (h6)',()=>{
  expect(selectorIndex(0)).toBe('h1');
  expect(selectorIndex(4)).toBe('h1, h2, h3, h4');
  expect(selectorIndex(9)).toBe('h1, h2, h3, h4, h5, h6');
  expect(selectorIndex('3')).toBe('h1, h2, h3, h4, h5, h6');
  expect(selectorIndex(undefined)).toBe('h1, h2, h3, h4, h5, h6');
});
test('T2 · l’Índex obert s’actualitza quan canvia el text d’un h5: l’observador usa el mateix selector',async()=>{
  const {container}=render(<PageFrame chrome="system" title="T">{CONTINGUT_INDEX}</PageFrame>);
  obriIndex(container);
  // Un canvi de text (characterData), com el que fa Refrescar dins d'una mètrica.
  await act(async()=>{ container.querySelector('h5').firstChild.data='39 rebuts'; });
  expect(entradesIndex()).toContainEqual(['toc-item toc-level-5','39 rebuts']);
});
