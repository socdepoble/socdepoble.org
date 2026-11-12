/* PRIVADESA-01 (R15b) · Les referències d'altres persones que el catàleg barreja a la seua llista (Herbari, Banc de
   llavors, Receptes) passen per la moderació com el Mur moderat: sense el que has bloquejat, amb el text de la fitxa
   canònica (mai el de la fila; la que no casa no apareix) i amb el ⋮ de denúncia i bloqueig a cada referència d'altri.
   Les fitxes del catàleg mateix no canvien (Llei del Píxel). Espai de treball, targeta i moderació de veres. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { ModeracioContext } from '../PedraSeca/hooks/moderacioDePoble.js';
import { clauDeBloqueig, elementBloquejat, objectiuDeTargeta } from '../../config/moderacio.js';
import { carregaFitxesCanoniques } from '../../data/fitxesCanoniquesCataleg.js';
import { delVal } from '../../config/storage.js';
import { CLAU_VISTA_CATALEG, desaVista } from './workspace/vistaCataleg.js';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import { RECEPTES_QUE_DINEM } from '../../data/patrimoni/queDinem.js';

const JO = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', BLOQUEJADA = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d', VEINA = '2b3c4d5e-6f70-4812-9345-6789abcdef01';
const m = vi.hoisted(() => ({ rows: [] }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(), useUIActionsOpcional: () => ({ language: 'ca' }) }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('./workspace/ProjeccionsCatalegContext.js', () => ({ useProjeccionsCatalegContext: () => ({ projeccions: m.rows, error: null,
  ownerId: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', persistent: true, autoritzat: false, desa: async () => {} }) }));
import CatalegWorkspace from './CatalegWorkspace.jsx';

let n = 0;
const fila = (owner, font, id, title) => ({ id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, ownerUserId: owner, sectionId: 'mur',
  title, subtitle: '', entradilla: '', author_name: title, projeccioCataleg: { v: 1, font, id, destins: ['herbari'], audiencia: 'publica' } });
const context = { disponible: true, potBloquejar: true,
  esElementBloquejat: (item) => elementBloquejat(item, new Set([clauDeBloqueig('persona', BLOQUEJADA)]), { esDeQuiMira: id => id === JO }),
  objectiuDeTargeta: (objecte) => objectiuDeTargeta(objecte, { esDeQuiMira: id => id === JO }), demanaDenuncia: vi.fn(), demanaBloqueig: vi.fn() };
const model = { status: 'ready', canAutoSelect: () => false, categories: [{ id: 'a', label: 'Carpeta A' }],
  items: [{ id: 'romer', title: 'Romer', categoryIds: ['a'], glyph: '🌿' }] };
const pinta = (vista = 'gran') => {
  if (vista === 'gran') desaVista('prova-moderacio', 'gran');
  return render(<MemoryRouter rutaInicial="/page/herbari"><ModeracioContext.Provider value={context}>
  <CatalegWorkspace id="prova-moderacio" font="herbari" destiPublicacio="herbari" ruta="/page/herbari" model={model}
    renderDetail={() => <header className="page-title"><h1>Introducció</h1></header>} />
</ModeracioContext.Provider></MemoryRouter>);
};
const titols = () => screen.queryAllByRole('heading', { level: 3 }).map(node => node.textContent);

beforeEach(async () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
  await Promise.all(['llavors', 'receptes'].map(font => carregaFitxesCanoniques(font, 'ca')));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); m.rows = []; delVal(CLAU_VISTA_CATALEG); });

test('la persona bloquejada no apareix al catàleg; el text fals es canvia pel canònic i el que no casa no apareix', async () => {
  const font = FONTS_BANC_LLAVORS[0], [primera, segona] = entradesDelCataleg(font.id), recepta = RECEPTES_QUE_DINEM[0];
  m.rows = [fila(BLOQUEJADA, 'llavors', primera.id, 'TEXT DE LA PERSONA BLOQUEJADA'), fila(VEINA, 'llavors', segona.id, 'TEXT OFENSIU'),
    fila(VEINA, 'receptes', 'no-existix', 'ALTRE TEXT OFENSIU'), fila(VEINA, 'receptes', recepta.slug, 'TERCER TEXT OFENSIU')];
  const { container } = pinta();
  expect(await screen.findByRole('heading', { level: 3, name: segona.nom })).toBeTruthy();
  expect(titols()).toEqual(['Romer', segona.nom, recepta.titol]);
  expect(container.textContent).not.toMatch(/OFENSIU|BLOQUEJADA/);
});

test('la referència d’altri porta la via de denúncia; la fitxa del catàleg i la referència pròpia, no', async () => {
  const font = FONTS_BANC_LLAVORS[0], [primera, segona] = entradesDelCataleg(font.id);
  m.rows = [fila(VEINA, 'llavors', primera.id, 'x'), fila(JO, 'llavors', segona.id, 'y')];
  pinta();
  expect(await screen.findByRole('button', { name: `Més opcions: ${primera.nom}` })).toBeTruthy();
  expect(screen.queryByRole('button', { name: `Més opcions: ${segona.nom}` })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Més opcions: Romer' })).toBeNull();
  expect(screen.queryAllByRole('button', { name: /^Més opcions/ })).toHaveLength(1);
});

test('a la Rajola, la targeta no porta el ⋮ (el menú no hi cap); el detall de la referència d’altri el porta a la barra, en les dues vistes', async () => {
  const font = FONTS_BANC_LLAVORS[0], [primera, segona] = entradesDelCataleg(font.id);
  m.rows = [fila(VEINA, 'llavors', primera.id, 'x'), fila(JO, 'llavors', segona.id, 'y')];
  pinta();
  fireEvent.click(screen.getByRole('button', { name: 'Quadrícula 2×2', exact: true }));
  await screen.findByRole('heading', { level: 3, name: primera.nom });
  expect(screen.queryAllByRole('button', { name: /^Més opcions/ })).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: `Obri fitxa: ${primera.nom}` }));
  expect(await screen.findByRole('button', { name: `Més opcions: ${primera.nom}` })).toBeTruthy();
  expect(document.querySelector('.sdp-cataleg-workspace__rajola .sdp-moderacio')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: `Obri fitxa: ${segona.nom}` }));
  await screen.findByRole('heading', { level: 1, name: segona.nom });
  expect(screen.queryAllByRole('button', { name: /^Més opcions/ })).toHaveLength(0);
});


test('Canònica conserva la denúncia en el detall de la referència sense posar un menú dins de la fila compacta', async () => {
  const font = FONTS_BANC_LLAVORS[0], [primera] = entradesDelCataleg(font.id);
  m.rows = [fila(VEINA, 'llavors', primera.id, 'text alié')];
  const { container } = pinta('canonica');
  fireEvent.click(await screen.findByRole('button', { name: primera.nom, exact: true }));
  expect(await screen.findByRole('button', { name: `Més opcions: ${primera.nom}` })).toBeTruthy();
  expect(container.querySelector('#app-grid-list .sdp-moderacio')).toBeNull();
});
