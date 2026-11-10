/* PRIVADESA-01 (R15b) · Les referències publicades del Mur i del Mercat passen per la moderació com el Mur moderat
   (MurContext): sense el que has bloquejat, amb el text canònic de les fonts canòniques (mai el de la fila) i amb la
   via de denúncia i bloqueig (el ⋮ d'UniversalCard) a cada referència d'una altra persona. La targeta i la moderació
   són les de veres; només el lector de referències és de mentida. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { ModeracioContext } from '../../PedraSeca/hooks/moderacioDePoble.js';
import { clauDeBloqueig, elementBloquejat, objectiuDeTargeta } from '../../../config/moderacio.js';
import { carregaFitxesCanoniques } from '../../../data/fitxesCanoniquesCataleg.js';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../../data/patrimoni/bancLlavors.js';
import { RECEPTES_QUE_DINEM } from '../../../data/patrimoni/queDinem.js';

const JO = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', BLOQUEJADA = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d', VEINA = '2b3c4d5e-6f70-4812-9345-6789abcdef01';
const m = vi.hoisted(() => ({ rows: [], ownerId: null, opcions: [] }));
vi.mock('../../../hooks/useProjeccionsCataleg.js', () => ({ useProjeccionsCataleg: (opcions) => { m.opcions.push(opcions); return { projeccions: m.rows, error: null, ownerId: m.ownerId }; } }));
vi.mock('../../../app/contexts/UIContext.jsx', () => ({ useUIActionsOpcional: () => ({ language: 'ca' }) }));
import ProjeccionsEnSuperficie from './ProjeccionsEnSuperficie.jsx';

let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const fila = (owner, font, id, title, desti = 'mur') => ({ id: uuid(), ownerUserId: owner, sectionId: 'mur', title, subtitle: '', entradilla: '',
  author_name: title, projeccioCataleg: { v: 1, font, id, destins: [desti], audiencia: 'publica' } });
function valor(claus = new Set([clauDeBloqueig('persona', BLOQUEJADA)])) {
  const esDeQuiMira = (id) => id === m.ownerId;
  return { disponible: true, potBloquejar: true, esElementBloquejat: (item) => elementBloquejat(item, claus, { esDeQuiMira }),
    objectiuDeTargeta: (objecte) => objectiuDeTargeta(objecte, { esDeQuiMira }), demanaDenuncia: vi.fn(), demanaBloqueig: vi.fn() };
}
const pinta = (desti, context = valor()) => render(<MemoryRouter rutaInicial={`/${desti}`}>
  <ModeracioContext.Provider value={context}><ProjeccionsEnSuperficie desti={desti} /></ModeracioContext.Provider></MemoryRouter>);
const titols = () => screen.queryAllByRole('heading', { level: 3 }).map(node => node.textContent);

beforeEach(async () => { m.rows = []; m.ownerId = JO; m.opcions = []; await Promise.all(['llavors', 'receptes'].map(font => carregaFitxesCanoniques(font, 'ca'))); });
afterEach(cleanup);

describe('ProjeccionsEnSuperficie · moderació', () => {
  test('només llig: no demana el bloqueig d’escriptura del magatzem (PRODUCCIO-01)', () => {
    pinta('mur');
    expect(m.opcions.at(-1)).toEqual({ escriptura: false });
  });

  test.each(['mur', 'mercat'])('%s · una persona bloquejada no apareix; la veïna i les pròpies, sí', async (desti) => {
    m.rows = [fila(BLOQUEJADA, 'nevera', 'oli', 'Oli de la persona bloquejada', desti), fila(VEINA, 'nevera', 'mel', 'Mel de la veïna', desti),
      fila(JO, 'bar', 'cafe', 'Cafè meu', desti)];
    pinta(desti);
    expect(titols()).toEqual(['Mel de la veïna', 'Cafè meu']);
  });

  test('sense cap bloqueig, totes; sense proveïdor de moderació, totes (cap filtre inventat)', () => {
    m.rows = [fila(BLOQUEJADA, 'nevera', 'oli', 'Oli'), fila(VEINA, 'nevera', 'mel', 'Mel')];
    pinta('mur', valor(new Set()));
    expect(titols()).toEqual(['Oli', 'Mel']);
    cleanup();
    render(<MemoryRouter rutaInicial="/mur"><ProjeccionsEnSuperficie desti="mur" /></MemoryRouter>);
    expect(titols()).toEqual(['Oli', 'Mel']);
  });

  test('una fila amb text fals d’una font canònica mostra el text canònic; la que no casa no apareix', async () => {
    const font = FONTS_BANC_LLAVORS[0], entrada = entradesDelCataleg(font.id)[0], recepta = RECEPTES_QUE_DINEM[0];
    m.rows = [fila(VEINA, 'llavors', entrada.id, 'TEXT OFENSIU'), fila(VEINA, 'receptes', 'no-existix', 'ALTRE TEXT OFENSIU'),
      fila(VEINA, 'receptes', recepta.slug, 'TERCER TEXT OFENSIU')];
    const { container } = pinta('mur');
    expect(await screen.findByRole('heading', { level: 3, name: entrada.nom })).toBeTruthy();
    expect(titols()).toEqual([entrada.nom, recepta.titol]);
    expect(container.textContent).not.toMatch(/OFENSIU/);
    expect(container.textContent).toContain(font.autoria);
  });

  test('la targeta d’altri porta la via de denúncia i bloqueig; la pròpia, no', async () => {
    m.rows = [fila(VEINA, 'nevera', 'mel', 'Mel de la veïna'), fila(JO, 'bar', 'cafe', 'Cafè meu')];
    const context = valor();
    pinta('mur', context);
    expect(screen.getByRole('button', { name: 'Més opcions: Mel de la veïna' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Més opcions: Cafè meu' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Més opcions: Mel de la veïna' }));
    expect(screen.getByRole('menuitem', { name: 'Bloqueja qui ha publicat esta referència' })).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('menuitem', { name: /^Denuncia/ })); });
    expect(context.demanaDenuncia).toHaveBeenCalledTimes(1);
    expect(context.demanaDenuncia.mock.calls[0][0]).toMatchObject({ tipus: 'publicacio', id: m.rows[0].id,
      autor: { tipus: 'persona', id: VEINA, nom: 'qui ha publicat esta referència' } });
  });
});
