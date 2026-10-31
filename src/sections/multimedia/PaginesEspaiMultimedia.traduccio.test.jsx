/* Gauntlet 261030 (Fase 3, TC3.2; troballa P1 `traduir-contingut-de-membres`)
   · Les pàgines publicades de /multimedia (la FitxaWeb d'una imatge i la
   VistaGaleria d'una galeria) només es traduïxen si el que pinten és públic
   (traduccio/visibilitatTraduible.js): una imatge del veïnat
   (section_submissions, ownerUserId; només per als membres) les apaga. La
   Pàgina Universal es substituïx per una que en registra les props (com
   MultimediaSection.espai.test.jsx) i no pinta el cos: ací només compta la
   prop `traduccio`, la mateixa via que les pàgines locals (traduccio={false}). */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';

const mocks = vi.hoisted(() => ({ pagines: [] }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    mocks.pagines.push(props);
    return null;
  }
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
import { FitxaWeb, VistaGaleria } from './PaginesEspaiMultimedia.jsx';

const t = (_clau, text) => text;
const imatge = { id: 'foto-inventada', title: 'Fira inventada', tag: 'Arxiu', src: null, created_at: '2026-07-01T10:00:00Z' };
const delVeinat = { ...imatge, id: 'foto-del-veinat', title: 'Sopar del veïnat inventat', ownerUserId: null };
const espai = (totes) => ({
  t, cens: null, obriVisor: () => {}, visorObert: false, refTitol: null,
  cataleg: { totes, grupsMes: [] }, membresDe: () => totes, etiquetaDe: () => 'Galeria inventada'
});
const traduccioDe = (element) => {
  mocks.pagines.length = 0;
  render(<MemoryRouter rutaInicial="/multimedia">{element}</MemoryRouter>);
  const props = mocks.pagines.at(-1);
  cleanup();
  return props?.traduccio;
};

beforeEach(() => { mocks.pagines.length = 0; });
afterEach(cleanup);

test('FitxaWeb: una imatge pública es traduïx; una del veïnat, no', () => {
  expect(traduccioDe(<FitxaWeb espai={espai([imatge])} item={imatge} />)).toBe(true);
  expect(traduccioDe(<FitxaWeb espai={espai([delVeinat])} item={delVeinat} />)).toBe(false);
  expect(traduccioDe(<FitxaWeb espai={espai([imatge])} item={{ ...imatge, visibility: 'members' }} />)).toBe(false);
});

test('VistaGaleria: totes públiques, es traduïx; una del veïnat a la galeria, no', () => {
  expect(traduccioDe(<VistaGaleria espai={espai([imatge])} categoria="galeria-inventada" />)).toBe(true);
  expect(traduccioDe(<VistaGaleria espai={espai([imatge, delVeinat])} categoria="galeria-inventada" />)).toBe(false);
});
