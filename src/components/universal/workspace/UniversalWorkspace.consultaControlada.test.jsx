import React, { useMemo, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

/*
 * B6-B2 (IDEA-46, marató 261101_2143) · La consulta controlada de l'espai.
 * Dos camps opcionals del `model`, com `canAutoSelect` o `resolveItemId`:
 *   · `onQueryChange(consulta)`: la lupa avisa la secció de cada canvi de
 *     la consulta (escriure, «Tancar», «Netejar»). Mai en muntar, ni en
 *     tornar a muntar per `workspaceKey`, ni quan canvia la selecció.
 *   · `filtraPerConsulta: false` (només el booleà): l'espai no filtra per
 *     subcadena; la secció ja li dona els elements de la seua cerca (el
 *     rànquing, la I de les paraules i el padró de /cerca). La carpeta i les
 *     etiquetes continuen filtrant.
 * Sense els camps, la lupa filtra com sempre (Notes, Multimèdia, la Wiki…).
 * Dades sintètiques.
 */

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i amagaria (inert) la navegació.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

/* `cos` és un camp de la secció: l'espai no el mira mai. */
const ITEMS = Object.freeze([
  Object.freeze({ id: 't', title: 'Tomaques', categoryIds: ['hort'], tags: ['estiu'], cos: 'Cal regar-les cada vesprada.' }),
  Object.freeze({ id: 'b', title: 'Bajoques', categoryIds: ['hort'], tags: ['estiu'], cos: 'Collir-les tendres.' }),
  Object.freeze({ id: 'c', title: 'Carxofes', categoryIds: ['hort'], tags: ['hivern'], cos: 'Regar poc a l’hivern.' }),
  Object.freeze({ id: 'g', title: 'Gallines', categoryIds: ['corral'], cos: 'Ous cada matí.' })
]);
const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  categories: [{ id: 'hort', label: 'Hort' }, { id: 'corral', label: 'Corral' }],
  items: ITEMS
});
const HORT = Object.freeze(['Tomaques', 'Bajoques', 'Carxofes']);
const SELECCIO = Object.freeze({ categoryId: 'hort', itemId: 't' });

/* Munta l'espai i torna lectors del que es veu: els títols de la llista i
   l'últim argument de renderDetail. */
function munta(extraModel = {}, props = {}) {
  const rebuts = [];
  const pinta = (extra, mesProps) => (
    <UniversalWorkspace
      model={{ ...MODEL, ...extra }}
      initialSelection={SELECCIO}
      renderDetail={(arg) => { rebuts.push(arg); return null; }}
      {...mesProps}
    />
  );
  const vista = render(pinta(extraModel, props));
  return {
    titols: () => [...vista.container.querySelectorAll('.sdp-gestor-fitxa__titol')].map((node) => node.textContent),
    darrer: () => rebuts[rebuts.length - 1],
    rerender: (extra, mesProps = props) => vista.rerender(pinta(extra, mesProps))
  };
}
const obreCerca = () => fireEvent.click(screen.getByRole('button', { name: 'Cercar elements' }));
const camp = () => screen.getByRole('searchbox', { name: 'Cercar elements' });
const escriu = (text) => fireEvent.change(camp(), { target: { value: text } });
const tanca = () => fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
const consultes = (espia) => espia.mock.calls.map(([consulta]) => consulta);

describe('paritat: sense els camps nous, la lupa filtra com sempre', () => {
  test('escriure amaga el que no casa i «Tancar» torna la carpeta sencera', () => {
    const vista = munta();
    expect(vista.titols()).toEqual(HORT);
    obreCerca();
    escriu('baj');
    expect(vista.titols()).toEqual(['Bajoques']);
    expect(vista.darrer().visibleItemIds).toEqual(['b']);
    tanca();
    expect(vista.titols()).toEqual(HORT);
  });

  /* Només el booleà false desactiva el filtre: un valor rar és «sense camp». */
  test.each([null, 0, '', 'false', undefined])('filtraPerConsulta=%j filtra com sempre', (valor) => {
    const vista = munta({ filtraPerConsulta: valor });
    obreCerca();
    escriu('carx');
    expect(vista.titols()).toEqual(['Carxofes']);
  });
});

describe('filtraPerConsulta:false i onQueryChange', () => {
  test('escriure no amaga cap element i onQueryChange rep el text en cada canvi', () => {
    const onQueryChange = vi.fn();
    const vista = munta({ filtraPerConsulta: false, onQueryChange });
    obreCerca();
    expect(onQueryChange).not.toHaveBeenCalled();
    escriu('b');
    escriu('baj');
    escriu('bajoques de');
    expect(consultes(onQueryChange)).toEqual(['b', 'baj', 'bajoques de']);
    expect(vista.titols()).toEqual(HORT);
    expect(vista.darrer().visibleItemIds).toEqual(['t', 'b', 'c']);
    /* La consulta continua sent un filtre actiu per a la secció (F2). */
    expect(vista.darrer().filtered).toBe(true);
    /* El text es passa tal com és: sense retallar ni plegar. */
    escriu('  Bajoques ');
    expect(onQueryChange).toHaveBeenLastCalledWith('  Bajoques ');
  });

  test('«Tancar» la cerca emet la consulta buida; obrir i tancar sense escriure no emet res', () => {
    const onQueryChange = vi.fn();
    munta({ filtraPerConsulta: false, onQueryChange });
    obreCerca();
    escriu('carx');
    tanca();
    expect(consultes(onQueryChange)).toEqual(['carx', '']);
    obreCerca();
    tanca();
    expect(consultes(onQueryChange)).toEqual(['carx', '']);
  });

  test('«Netejar» també emet la consulta buida i lleva l’etiqueta', () => {
    const onQueryChange = vi.fn();
    const vista = munta({ filtraPerConsulta: false, onQueryChange });
    obreCerca();
    escriu('tom');
    fireEvent.click(screen.getByRole('button', { name: 'estiu' }));
    expect(vista.titols()).toEqual(['Tomaques', 'Bajoques']);
    fireEvent.click(screen.getByRole('button', { name: 'Netejar' }));
    expect(consultes(onQueryChange)).toEqual(['tom', '']);
    expect(vista.titols()).toEqual(HORT);
  });

  test('en muntar amb initialSelection.query no emet res, i la lupa ja porta el text', () => {
    const onQueryChange = vi.fn();
    const vista = munta({ filtraPerConsulta: false, onQueryChange }, { initialSelection: { ...SELECCIO, query: 'baj' } });
    expect(onQueryChange).not.toHaveBeenCalled();
    expect(camp().value).toBe('baj');
    expect(vista.titols()).toEqual(HORT);
    escriu('bajo');
    expect(consultes(onQueryChange)).toEqual(['bajo']);
  });

  test('tornar a muntar per workspaceKey amb una altra consulta no emet res', () => {
    const onQueryChange = vi.fn();
    const vista = munta(
      { filtraPerConsulta: false, onQueryChange, workspaceKey: 'baj' },
      { initialSelection: { ...SELECCIO, query: 'baj' } }
    );
    vista.rerender(
      { filtraPerConsulta: false, onQueryChange, workspaceKey: 'carx' },
      { initialSelection: { ...SELECCIO, query: 'carx' } }
    );
    expect(camp().value).toBe('carx');
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  test('les etiquetes i les categories continuen filtrant', () => {
    const vista = munta({ filtraPerConsulta: false, onQueryChange: vi.fn() });
    obreCerca();
    escriu('cap element no diu això');
    expect(vista.titols()).toEqual(HORT);
    fireEvent.click(screen.getByRole('button', { name: 'hivern' }));
    expect(vista.titols()).toEqual(['Carxofes']);
    expect(vista.darrer().visibleItemIds).toEqual(['c']);
    tanca();
    fireEvent.click(screen.getByRole('button', { name: 'Corral' }));
    expect(vista.titols()).toEqual(['Gallines']);
  });

  /* ARB-B6B2-01 · La llista depén de filtraPerConsulta: si la secció el canvia
     en calent, l'espai refà la llista amb la consulta ja escrita, en els dos
     sentits. Els elements i la consulta no canvien: només el camp. */
  test('canviar filtraPerConsulta en calent refà la llista amb la consulta ja escrita', () => {
    const vista = munta();
    obreCerca();
    escriu('baj');
    expect(vista.titols()).toEqual(['Bajoques']);
    vista.rerender({ filtraPerConsulta: false });
    expect(camp().value).toBe('baj');
    expect(vista.titols()).toEqual(HORT);
    expect(vista.darrer().visibleItemIds).toEqual(['t', 'b', 'c']);
    vista.rerender({});
    expect(vista.titols()).toEqual(['Bajoques']);
    expect(vista.darrer().visibleItemIds).toEqual(['b']);
  });

  /* B6-B2-D1 (ARB-B6B2-02) · Amb filtraPerConsulta:false, la tria automàtica
     en canviar de carpeta no mira la consulta: obri el primer element que la
     llista mostra, no cap. */
  test('triar una carpeta amb una consulta activa obri el primer element visible', () => {
    const onSelectionChange = vi.fn();
    const vista = munta({ filtraPerConsulta: false, onQueryChange: vi.fn() }, { onSelectionChange });
    obreCerca();
    escriu('zzz');
    fireEvent.click(screen.getByRole('button', { name: 'Corral' }));
    expect(vista.titols()).toEqual(['Gallines']);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: 'corral', itemId: 'g' }, { reason: 'user' });
    expect(vista.darrer().item?.id).toBe('g');
  });

  test('triar elements o categories no emet cap consulta', () => {
    const onQueryChange = vi.fn();
    const onSelectionChange = vi.fn();
    munta({ filtraPerConsulta: false, onQueryChange }, { onSelectionChange });
    fireEvent.click(screen.getByRole('button', { name: 'Bajoques' }));
    fireEvent.click(screen.getByRole('button', { name: 'Corral' }));
    expect(onSelectionChange).toHaveBeenCalled();
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  test('un callback nou no emet res en pintar, i la tecla següent la rep el més nou', () => {
    const primer = vi.fn();
    const segon = vi.fn();
    const vista = munta({ filtraPerConsulta: false, onQueryChange: primer });
    obreCerca();
    escriu('to');
    vista.rerender({ filtraPerConsulta: false, onQueryChange: segon });
    expect(segon).not.toHaveBeenCalled();
    escriu('tom');
    expect(consultes(primer)).toEqual(['to']);
    expect(consultes(segon)).toEqual(['tom']);
  });

  test('onQueryChange sense filtraPerConsulta: avisa i l’espai continua filtrant', () => {
    const onQueryChange = vi.fn();
    const vista = munta({ onQueryChange });
    obreCerca();
    escriu('carx');
    expect(consultes(onQueryChange)).toEqual(['carx']);
    expect(vista.titols()).toEqual(['Carxofes']);
  });
});

/* La secció cerca pel seu compte (un camp que l'espai no coneix, en l'ordre
   del seu rànquing) i li dona els elements ja filtrats. */
function SeccioAmbCercaPropia({ filtraPerConsulta }) {
  const [consulta, setConsulta] = useState('');
  const items = useMemo(() => {
    const q = consulta.trim().toLocaleLowerCase('ca');
    if (!q) return ITEMS;
    return ITEMS.filter((item) => item.cos.toLocaleLowerCase('ca').includes(q)).reverse();
  }, [consulta]);
  return (
    <UniversalWorkspace
      model={{ ...MODEL, items, filtraPerConsulta, onQueryChange: setConsulta }}
      initialSelection={SELECCIO}
      renderDetail={() => null}
    />
  );
}
const titolsDeLaLlista = (container) => [...container.querySelectorAll('.sdp-gestor-fitxa__titol')].map((node) => node.textContent);

describe('la secció alimenta la llista amb la seua cerca (IDEA-46)', () => {
  test('amb filtraPerConsulta:false, la llista és la de la secció, en el seu ordre', () => {
    const { container } = render(<SeccioAmbCercaPropia filtraPerConsulta={false} />);
    obreCerca();
    escriu('regar');
    expect(titolsDeLaLlista(container)).toEqual(['Carxofes', 'Tomaques']);
    tanca();
    expect(titolsDeLaLlista(container)).toEqual(HORT);
  });

  /* Per què cal l'extensió: amb el filtre de l'espai damunt del de la secció,
     «regar» no és a cap títol i la llista es queda buida. */
  test('sense filtraPerConsulta:false, el doble filtre buida la llista', () => {
    const { container } = render(<SeccioAmbCercaPropia />);
    obreCerca();
    escriu('regar');
    expect(titolsDeLaLlista(container)).toEqual([]);
  });
});
