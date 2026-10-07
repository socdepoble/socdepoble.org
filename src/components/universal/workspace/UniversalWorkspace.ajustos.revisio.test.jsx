/* Revisió del 261007 · La roda dentada (Llei de la Roda Dentada):
   · M2-02 · el diàleg parla la llengua de la interfície sencer: «Fet», la
     línia d'estat, els tres valors predefinits i el «Sí»/«No» de cada
     interruptor (abans, fixos en valencià);
   · M2-09 · en mode compacte (sense «Tot») l'ajuda no esmenta «Tot»;
   · M2-10 · el nom d'una carpeta amb «$&» o «$$» no desfà el nom accessible
     de l'interruptor (String.replace amb una cadena els interpreta);
   · M2-04 · si totes les carpetes del grup sense etiqueta s'amaguen, la
     capçalera de la navegació no és un botó plegable que no controla res.
   El traductor és el real (createTranslator) per la porta opcional de la
   interfície (useUIActionsOpcional). jsdom no fa layout: l'amplària, a mà. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { FileText, Folder } from 'lucide-react';
import { delVal, setVal } from '../../../config/storage.js';
import { createTranslator } from '../../../config/i18n.js';
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

import { UniversalWorkspace } from './UniversalWorkspace.jsx';

vi.setConfig({ testTimeout: 30000 });

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  estat.accions = null;
  delVal(CLAU_CARPETES_VISIBLES);
  delVal('sdp-grid-widths');
  _reiniciaCarpetesVisibles();
});
afterEach(() => {
  cleanup();
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
});

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-preus', label: 'Preus $$ i $& IVA' }] },
    { id: 'categories', label: 'CATEGORIES', options: [{ id: 'cat_Sistema', label: 'Sistema' }] }
  ],
  items: [{ id: 'n1', title: 'Crònica del Mur', categoryIds: ['f-mur'] }]
});

const munta = (props = {}) => render(
  <UniversalWorkspace
    model={MODEL}
    labels={{ categories: 'CARPETES', items: 'NOTES', settings: 'Ajustos' }}
    icons={{ categories: Folder, items: FileText }}
    tagFilter={false}
    initialSelection={{ categoryId: 'f-mur' }}
    mestreDetall={{ clau: 'notes', element: null }}
    renderDetail={() => null}
    {...props}
  />
);
const obriRoda = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Ajustos' }));
  return within(screen.getByRole('dialog', { name: 'Ajustos' }));
};

describe('M2-02 · el diàleg sencer en la llengua de la interfície', () => {
  test('en anglés: «Done», la línia d’estat, els tres valors predefinits i l’estat de cada interruptor', () => {
    estat.accions = { t: createTranslator('en') };
    munta();
    const dialeg = obriRoda();
    expect(dialeg.getByRole('button', { name: 'Done' })).toBeTruthy();
    expect(dialeg.queryByRole('button', { name: 'Fet' })).toBeNull();
    expect(dialeg.getByText('Now: navigation 260px · list 280px')).toBeTruthy();
    const grup = dialeg.getByRole('group', { name: 'Column width' });
    expect(within(grup).getAllByRole('button').map((b) => b.textContent)).toEqual(['Compact', 'Default', 'Wide']);
    expect(dialeg.getByRole('button', { name: 'Reset the column width' })).toBeTruthy();
    const interruptors = dialeg.getAllByRole('switch');
    expect(interruptors.map((i) => i.textContent)).toEqual(interruptors.map(() => 'Yes'));
    fireEvent.click(dialeg.getByRole('switch', { name: 'Show Mur' }));
    expect(dialeg.getByRole('switch', { name: 'Show Mur' }).textContent).toBe('No');
  });

  test('sense traductor (fora de l’app), la reserva valenciana de sempre', () => {
    munta();
    const dialeg = obriRoda();
    expect(dialeg.getByRole('button', { name: 'Fet' })).toBeTruthy();
    expect(dialeg.getByText('Ara: navegació 260px · llistat 280px')).toBeTruthy();
    expect(within(dialeg.getByRole('group', { name: 'Amplada de les columnes' })).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['Compacta', 'Per defecte', 'Ampla']);
    expect(dialeg.getAllByRole('switch').map((i) => i.textContent)).toEqual(['Sí', 'Sí', 'Sí']);
  });
});

describe('M2-09 · l’ajuda de «Carpetes a la vista»', () => {
  test('en ample (amb «Tot»), l’ajuda diu que els documents continuen a «Tot»', () => {
    munta();
    const ajuda = obriRoda().getByText(/^Amagar una carpeta/);
    expect(ajuda.textContent).toBe('Amagar una carpeta la lleva de la navegació, però no l’esborra: els seus documents continuen a «Tot» i a la cerca.');
  });

  test('en compacte (sense «Tot»), l’ajuda no l’esmenta', () => {
    munta({ compacte: true });
    const ajuda = obriRoda().getByText(/^Amagar una carpeta/);
    expect(ajuda.textContent).toBe('Amagar una carpeta la lleva de la navegació, però no l’esborra: els seus documents continuen a la cerca. Sempre n’hi ha d’haver almenys una a la vista.');
    expect(ajuda.textContent).not.toContain('«Tot»');
  });
});

describe('M2-10 · el nom d’una carpeta es pinta tal qual', () => {
  test('«$$» i «$&» no es reinterpreten al nom accessible de l’interruptor', () => {
    munta();
    const dialeg = obriRoda();
    expect(dialeg.getByRole('switch', { name: 'Vull vore Preus $$ i $& IVA' })).toBeTruthy();
  });
});

describe('M2-04 · la capçalera de la navegació amb el grup sense etiqueta amagat', () => {
  const plegables = (container) => container.querySelectorAll('.app-grid-col-header__plegable');

  test('amb alguna carpeta del grup a la vista, la capçalera plega el grup', () => {
    const { container } = munta();
    expect(plegables(container)).toHaveLength(1);
    expect(plegables(container)[0].getAttribute('aria-expanded')).toBe('true');
  });

  test('amb totes les carpetes del grup amagades, la capçalera és fixa: cap aria-expanded que no controle res', () => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { 'f-mur': false, 'f-preus': false } } });
    _reiniciaCarpetesVisibles();
    const { container } = munta({ initialSelection: { categoryId: 'cat_Sistema' } });
    expect(plegables(container)).toHaveLength(0);
    expect(container.querySelector('.app-grid-col-header__plec--fix')).not.toBeNull();
  });
});
