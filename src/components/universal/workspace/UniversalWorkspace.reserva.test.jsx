/* Correcció dels verificadors (261004) · La reserva de la barra mòbil
   (modules.css, bloc «ESTRUCTURA I SCROLL DEL GESTOR UNIVERSAL») cau només
   als scrollers propis del Workspace: el rail d'una columna plegada, el rail
   d'«estret», el cos de la navegació i de la llista, i el detall. Abans
   l'abast era descendent i el detall de Disseny, que pinta components de
   producció del Xat en marcs fixos (rail plegat, VistaComunitats), en rebia
   una segona: 144 px dins d'un marc de 576 que no toca la barra.
   Es pinta el Workspace de veres amb els dos espècimens del Xat de veres al
   detall, dins d'una arrel compacta, i es pregunta al DOM quins elements
   casen amb els selectors del full. jsdom no pinta: el que es comprova és
   l'abast, no la mida (la mida, al navegador). Dades sintètiques. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { FileText, Folder } from 'lucide-react';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import EspecimenXatRail from '../../../sections/disseny/cataleg/detalls/EspecimenXatRail.jsx';
import EspecimenXatComunitats from '../../../sections/disseny/cataleg/detalls/EspecimenXatComunitats.jsx';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

/* Els selectors de la regla, llegits del full. :where() només en baixa el
   pes; per a casar, la classe de dins. */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const regla = [...net('src/css/modules.css').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selector, cos]) => ({ selectors: selector.trim().split(',').map((s) => s.trim()), cos }))
  .find((r) => r.selectors.some((s) => s.includes('.sdp-workspace--universal')));
const SELECTORS = regla.selectors.map((s) => s.replace(/:where\(([^()]*)\)/g, '$1'));
const reservats = (c) => new Set(SELECTORS.flatMap((s) => [...c.querySelectorAll(s)]));

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] }
  ],
  items: [
    { id: 'n1', title: 'Primera', categoryIds: ['f-mur'] },
    { id: 'n2', title: 'Segona', categoryIds: ['f-mur'] }
  ]
});

/* El detall de Disseny: els espècimens del Xat de producció. */
const especimens = () => (
  <>
    <EspecimenXatRail />
    <EspecimenXatComunitats />
  </>
);

let descriptor;
beforeEach(() => {
  descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
  else delete HTMLElement.prototype.clientWidth;
  vi.unstubAllGlobals();
});

function munta(amplada, props = {}, arrel = 'sdp-root is-compact') {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  return render(
    <MemoryRouter>
      <div className={arrel}>
        <UniversalWorkspace
          model={MODEL}
          labels={{ categories: 'DISSENY', items: 'COMPONENTS' }}
          icons={{ categories: Folder, items: FileText }}
          tagFilter={false}
          initialSelection={{ categoryId: 'f-mur', itemId: 'n1' }}
          renderDetail={especimens}
          {...props}
        />
      </div>
    </MemoryRouter>
  );
}

/* Un nom curt per a l'informe de la prova: on viu i què és. */
const nom = (el) => `${el.closest('.sdp-xat-especimen') ? 'espècimen' : el.closest('[id^="app-grid-"]')?.id ?? '?'} ${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`;

/* Exactament els esperats, en l'ordre dels selectors del full. */
function nomesEls(tocats, esperats) {
  expect(esperats.every(Boolean)).toBe(true);
  expect([...tocats].map(nom)).toEqual(esperats.map(nom));
  expect([...tocats].every((el, i) => el === esperats[i])).toBe(true);
}

/* Els scrollers dels espècimens: hi ha de ser (si no, la prova no prova
   res) i cap no rep la reserva. */
function senseEspecimens(container, tocats) {
  const dels = [...container.querySelectorAll('.sdp-xat-especimen')]
    .flatMap((marc) => [...marc.querySelectorAll('.sdp-workspace-rail, .sdp-workspace-column__body, .sdp-workspace-detail')]);
  expect(dels.length).toBeGreaterThanOrEqual(3);
  expect(dels.filter((el) => tocats.has(el)).map(nom)).toEqual([]);
}

test('a 820 («mitja», rail de la navegació): el rail, el cos de la llista i el detall, i cap scroller dels espècimens del Xat', () => {
  const { container } = munta(820);
  expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('mitja');
  const tocats = reservats(container);
  const esperats = [
    container.querySelector('#app-grid-sidebar .sdp-workspace-rail'),
    container.querySelector('#app-grid-list .sdp-workspace-column__body'),
    container.querySelector('#app-grid-main > .sdp-workspace-detail')
  ];
  nomesEls(tocats, esperats);
  senseEspecimens(container, tocats);
});

test('a 375 («estret», mestre-detall): el rail d’estret, el cos de la navegació i de la llista, i el detall; cap espècimen', () => {
  const { container } = munta(375, { mestreDetall: 'detall' });
  expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('estret');
  const tocats = reservats(container);
  /* En l'ordre dels selectors del full: rail d'estret, cossos, detall. */
  const esperats = [
    container.querySelector('#app-grid-rail .sdp-workspace-rail'),
    container.querySelector('#app-grid-sidebar .sdp-workspace-column__body'),
    container.querySelector('#app-grid-list .sdp-workspace-column__body'),
    container.querySelector('#app-grid-main > .sdp-workspace-detail')
  ];
  nomesEls(tocats, esperats);
  senseEspecimens(container, tocats);
});

test('en «ample» amb les dues columnes plegades: els dos rails i el detall; cap espècimen', () => {
  const { container } = munta(1400, { columnesInicials: { left: true, middle: true } });
  expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('ample');
  const tocats = reservats(container);
  const esperats = [
    container.querySelector('#app-grid-sidebar .sdp-workspace-rail'),
    container.querySelector('#app-grid-list .sdp-workspace-rail'),
    container.querySelector('#app-grid-main > .sdp-workspace-detail')
  ];
  nomesEls(tocats, esperats);
  senseEspecimens(container, tocats);
});

test('sense l’arrel compacta (la barra mòbil no hi és), cap reserva', () => {
  const { container } = munta(820, {}, 'sdp-root');
  expect(reservats(container).size).toBe(0);
});
