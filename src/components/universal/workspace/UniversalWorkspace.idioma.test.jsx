/* B3 · P1-22 (marató 261101_2143, carril E) · L'espai de treball parla la
   llengua de la interfície també quan la secció no li passa etiquetes:
   · sense `labels`, les capçaleres, «Tot», la cerca, la roda dentada i els
     estats del detall ixen traduïts (abans, sempre en valencià);
   · les etiquetes que passa la secció continuen manant, una per una;
   · els estats propis del detall (no s'ha pogut obrir, no és accessible) i
     la fletxa ← que torna a la llista, traduïts;
   · sense traductor (fora de l'app), el valencià de sempre, lletra per
     lletra (Llei del Píxel).
   El traductor és el real (createTranslator) per la porta opcional de la
   interfície (useUIActionsOpcional). jsdom no fa layout: l'amplària de la
   closca, l'observador i els fotogrames, a mà. Dades sintètiques. */
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { FileText, Folder } from 'lucide-react';
import { createTranslator } from '../../../config/i18n.js';
import CA from '../../../config/idiomes/ca.js';
import ES from '../../../config/idiomes/es.js';
import EN from '../../../config/idiomes/en.js';
import EU from '../../../config/idiomes/eu.js';
import GL from '../../../config/idiomes/gl.js';
import { delVal } from '../../../config/storage.js';
import { CLAU_CARPETES_VISIBLES, _reiniciaCarpetesVisibles } from './carpetesVisibles.js';

const estat = vi.hoisted(() => ({ accions: null }));
vi.mock('../../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => estat.accions
}));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import { PARELLS_ETIQUETES_ESPAI, UniversalWorkspace } from './UniversalWorkspace.jsx';

vi.setConfig({ testTimeout: 30000 });

const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] }
  ],
  items: [
    { id: 'n1', title: 'Primera', categoryIds: ['f-mur'] },
    { id: 'n2', title: 'Tomaques', categoryIds: ['f-mercat'] }
  ]
});
const ICONES = Object.freeze({ categories: Folder, items: FileText });
/* Les tres columnes obertes en muntar: la franja estreta de la finestra no plega la navegació. */
const OBERTES = Object.freeze({ left: false, middle: false });

/* L'amplària de la closca, l'observador de mida i els fotogrames, a mà
   (el mateix entorn d'UniversalWorkspace.mestreDetall.test.jsx). */
function entorn(amplada, prova) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const observadorAbans = globalThis.ResizeObserver;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  const buida = () => act(() => { while (cua.length) cua.shift()(0); });
  try {
    prova({ buida });
  } finally {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.requestAnimationFrame = rafAbans;
    globalThis.ResizeObserver = observadorAbans;
  }
}

const munta = (props = {}) => render(
  <UniversalWorkspace
    model={MODEL}
    icons={ICONES}
    tagFilter={false}
    columnesInicials={OBERTES}
    renderDetail={() => null}
    {...props}
  />
);
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const llista = (c) => c.querySelector('#app-grid-list');
const detall = (c) => c.querySelector('#app-grid-main');
const ambTraductor = (codi) => { estat.accions = { t: createTranslator(codi) }; };
/* Un element seleccionat que no és a la llista: completa, «no és accessible»;
   parcial i sense resolveItemId, «no s'ha pogut obrir». La secció no deixa
   triar-ne cap altre (canAutoSelect), i el detall es queda en l'estat. */
const NO_HI_ES = Object.freeze({ initialSelection: { categoryId: 'f-mur', itemId: 'n9' }, selection: { categoryId: 'f-mur', itemId: 'n9' } });
const SENSE_RESERVA = Object.freeze({ ...MODEL, canAutoSelect: () => false });

beforeEach(() => {
  estat.accions = null;
  delVal(CLAU_CARPETES_VISIBLES);
  delVal('sdp-grid-widths');
  _reiniciaCarpetesVisibles();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
});

describe('sense `labels`, en la llengua de la interfície', () => {
  test('en anglés: les capçaleres, «All», la roda, la cerca i el seu «Close»', () => {
    ambTraductor('en');
    entorn(1400, () => {
      const { container } = munta();
      expect(navegacio(container).textContent).toContain('CATEGORIES');
      expect(llista(container).textContent).toContain('ITEMS');
      expect(llista(container).textContent).not.toContain('ELEMENTS');
      const nav = within(navegacio(container));
      expect(nav.getByRole('button', { name: 'All' })).toBeTruthy();
      expect(nav.queryByRole('button', { name: 'Tot' })).toBeNull();
      expect(within(container).getByRole('button', { name: 'Workspace settings' })).toBeTruthy();
      expect(within(container).queryByRole('button', { name: 'Configuració de l’espai de treball' })).toBeNull();
      fireEvent.click(within(llista(container)).getByRole('button', { name: 'Search items' }));
      const camp = llista(container).querySelector('input[type="search"]');
      expect(camp.getAttribute('placeholder')).toBe('Search items');
      expect(within(llista(container)).getByRole('button', { name: 'Close' })).toBeTruthy();
    });
  });

  test('en anglés: el detall que es carrega diu «Loading…»', () => {
    ambTraductor('en');
    entorn(1400, () => {
      const { container } = munta({ model: { ...MODEL, status: 'loading' } });
      expect(within(detall(container)).getByRole('status').textContent).toBe('Loading…');
    });
  });

  test.each(['es', 'eu', 'gl'])('%s: «Tot» i la roda són els del diccionari', (codi) => {
    ambTraductor(codi);
    entorn(1400, () => {
      const { container } = munta();
      const D = DICCIONARIS[codi];
      expect(within(navegacio(container)).getByRole('button', { name: D['workspace.etiqueta.tot'] })).toBeTruthy();
      expect(within(container).getByRole('button', { name: D['workspace.etiqueta.ajustos'] })).toBeTruthy();
      expect(navegacio(container).textContent).toContain(D['workspace.etiqueta.categories']);
      expect(D['workspace.etiqueta.tot']).not.toBe(CA['workspace.etiqueta.tot']);
    });
  });
});

describe('les etiquetes de la secció manen', () => {
  test('en anglés, amb labels parcials: les de la secció tal qual, la resta traduïda', () => {
    ambTraductor('en');
    entorn(1400, () => {
      const { container } = munta({ labels: { categories: 'CARPETES', all: 'Totes', settings: 'Ajustos del Bloc' } });
      expect(navegacio(container).textContent).toContain('CARPETES');
      expect(navegacio(container).textContent).not.toContain('CATEGORIES');
      expect(within(navegacio(container)).getByRole('button', { name: 'Totes' })).toBeTruthy();
      expect(within(container).getByRole('button', { name: 'Ajustos del Bloc' })).toBeTruthy();
      expect(llista(container).textContent).toContain('ITEMS');
      expect(within(llista(container)).getByRole('button', { name: 'Search items' })).toBeTruthy();
    });
  });

  test('els estats del detall també es poden passar', () => {
    ambTraductor('en');
    entorn(1400, () => {
      const { container } = munta({ ...NO_HI_ES, model: SENSE_RESERVA, labels: { notFound: 'Esta nota ja no hi és.' } });
      expect(within(detall(container)).getByRole('status').textContent).toBe('Esta nota ja no hi és.');
    });
  });
});

describe('els estats propis del detall i la seua fletxa', () => {
  test('en anglés: l’element que no és accessible', () => {
    ambTraductor('en');
    entorn(1400, () => {
      const { container } = munta({ ...NO_HI_ES, model: SENSE_RESERVA });
      expect(within(detall(container)).getByRole('status').textContent).toBe('The item is not accessible or no longer exists.');
    });
  });

  test('en anglés: l’element que no s’ha pogut obrir, amb «Try again»', () => {
    ambTraductor('en');
    entorn(1400, () => {
      const { container } = munta({ ...NO_HI_ES, model: { ...MODEL, itemsComplete: false } });
      const alerta = within(detall(container)).getByRole('alert');
      expect(alerta.textContent).toBe('The item could not be opened. Try again');
      expect(within(alerta).getByRole('button', { name: 'Try again' })).toBeTruthy();
    });
  });

  test('en anglés, en estret amb el mestre-detall: la fletxa ← del detall és «Back to the list» i hi torna', () => {
    ambTraductor('en');
    entorn(375, () => {
      const { container } = munta({ mestreDetall: 'detall', model: { ...MODEL, status: 'error' } });
      expect(within(detall(container)).getByRole('alert').textContent).toBe('The data could not be loaded.');
      const fletxa = within(detall(container)).getByRole('button', { name: 'Back to the list' });
      expect(fletxa.getAttribute('title')).toBe('Back to the list');
      expect(within(detall(container)).queryByRole('button', { name: 'Tornar a la llista' })).toBeNull();
      fireEvent.click(fletxa);
      expect(container.querySelector('.app-grid-shell').dataset.panell).toBe('middle');
    });
  });
});

describe('sense traductor (fora de l’app), el valencià de sempre', () => {
  test('les capçaleres, «Tot», la roda, la cerca i el «Tancar»', () => {
    entorn(1400, () => {
      const { container } = munta();
      expect(navegacio(container).textContent).toContain('CATEGORIES');
      expect(llista(container).textContent).toContain('ELEMENTS');
      expect(within(navegacio(container)).getByRole('button', { name: 'Tot' })).toBeTruthy();
      expect(within(container).getByRole('button', { name: 'Configuració de l’espai de treball' })).toBeTruthy();
      fireEvent.click(within(llista(container)).getByRole('button', { name: 'Cercar elements' }));
      expect(llista(container).querySelector('input[type="search"]').getAttribute('placeholder')).toBe('Cercar elements');
      expect(within(llista(container)).getByRole('button', { name: 'Tancar' })).toBeTruthy();
    });
  });

  test('els estats del detall, lletra per lletra', () => {
    entorn(1400, () => {
      const { container, unmount } = munta({ ...NO_HI_ES, model: SENSE_RESERVA });
      expect(within(detall(container)).getByRole('status').textContent).toBe('L’element no és accessible o ja no existix.');
      unmount();
    });
    entorn(1400, () => {
      const { container } = munta({ ...NO_HI_ES, model: { ...MODEL, itemsComplete: false } });
      const alerta = within(detall(container)).getByRole('alert');
      expect(alerta.textContent).toBe('No s’ha pogut obrir l’element. Reintentar');
      expect(alerta.querySelector('button').textContent).toBe('Reintentar');
    });
  });

  test('la fletxa ← del detall, en estret: «Tornar a la llista»', () => {
    entorn(375, () => {
      const { container } = munta({ mestreDetall: 'detall', model: { ...MODEL, status: 'error' } });
      expect(within(detall(container)).getByRole('alert').textContent).toBe('No s’han pogut carregar les dades.');
      const fletxa = within(detall(container)).getByRole('button', { name: 'Tornar a la llista' });
      expect(fletxa.getAttribute('title')).toBe('Tornar a la llista');
    });
  });

  test('un traductor que no té la clau torna la reserva: el text de sempre', () => {
    estat.accions = { t: (clau, reserva) => reserva };
    entorn(1400, () => {
      const { container } = munta({ ...NO_HI_ES, model: SENSE_RESERVA });
      expect(within(navegacio(container)).getByRole('button', { name: 'Tot' })).toBeTruthy();
      expect(within(detall(container)).getByRole('status').textContent).toBe('L’element no és accessible o ja no existix.');
    });
  });
});

describe('les claus de l’espai', () => {
  test('27 parells, cada clau als cinc diccionaris i la reserva és el valor valencià', () => {
    const parells = Object.values(PARELLS_ETIQUETES_ESPAI);
    expect(parells).toHaveLength(27);
    expect(Object.isFrozen(PARELLS_ETIQUETES_ESPAI)).toBe(true);
    for (const [clau, reserva] of parells) {
      expect([clau, CA[clau]]).toEqual([clau, reserva]);
      for (const [codi, D] of Object.entries(DICCIONARIS)) expect([codi, clau, typeof D[clau]]).toEqual([codi, clau, 'string']);
    }
  });

  /* Corrector (P3-1 de l'àrbitre) · La spec dona claus pròpies a dos textos
     que ja tenien germana: la fletxa ← del detall i la de la barra
     (UniversalToolbar, section.notes.tornaLlista) fan la mateixa acció, i
     «Tot» de l'espai és el de /multimedia (textosEspaiMultimedia.js). Si una
     es retoca sola, les dues fletxes dirien coses diferents: han de dir el
     mateix en les cinc llengües. Una divergència volguda lleva la parella
     d'ací, amb el motiu. */
  test.each([
    ['workspace.detall.tornaLlista', 'section.notes.tornaLlista'],
    ['workspace.etiqueta.tot', 'section.multimedia.espai.tot']
  ])('%s diu el mateix que la seua germana %s, en les cinc llengües', (propia, germana) => {
    for (const [codi, D] of Object.entries(DICCIONARIS)) {
      expect(typeof D[germana]).toBe('string');
      expect([codi, propia, D[propia]]).toEqual([codi, propia, D[germana]]);
    }
  });
});
