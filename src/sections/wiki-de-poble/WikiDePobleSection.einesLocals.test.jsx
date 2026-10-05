/* 261002 · Les eines locals de la Wiki (Tractors i Sentinelles), que només
   hi són en desenvolupament: vitest corre amb import.meta.env.DEV cert. El
   mode producció el proven modulsLocalsActius (ací) i
   WikiDePobleSection.produccio.test.jsx. Els components són dobles: les seues
   proves són a tractors/. UniversalPage és la de veres: es mira la capçalera
   que pinta.
   Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la Gestoria de Poble ja no és cap eina local de la Wiki.
   Viu a la seua app (src/apps/gestoria): ací es prova que en desenvolupament
   la Wiki no en porta cap carpeta, cap ítem ni cap closca. Els dobles de la
   Gestoria es queden com a sonda: si la Wiki la tornara a importar, es veurien. */
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FileText, Folder } from 'lucide-react';

const fixture = vi.hoisted(() => ({ itemId: '__intro', search: '', props: null, showToast: vi.fn(), redireccions: [] }));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: (props) => {
    fixture.props = props;
    const { model, renderDetail, className } = props;
    return <div className={className}>{renderDetail({ item: model.items.find(item => item.id === fixture.itemId) })}</div>;
  }
}));
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:02_saber', parentId: null, label: 'SABER' }],
    items: [
      { id: 'constructor', title: 'Constructor', subtitle: '', categoryId: 'folder:02_saber', tags: [], attributes: {}, content: '# Constructor de murs\n\nText.' }
    ]
  }
}));
/* Navigate és una sonda: la Wiki no redirigix enlloc, ni amb els enllaços
   antics de la Gestoria (ordre del Mestre, 261004). */
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), useLocation: () => ({ pathname: '/wikidepoble', search: fixture.search }), Link: 'a',
  Navigate: ({ to }) => { fixture.redireccions.push(to); return null; }
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: fixture.showToast }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../tractors/PanellTractors.jsx', () => ({ default: () => <p>Doble dels Tractors</p> }));
vi.mock('../tractors/PanellSentinelles.jsx', () => ({ default: () => <p>Doble dels Sentinelles</p> }));
/* Sondes: si la Wiki tornara a carregar la closca o Aprendre, es veurien. */
vi.mock('../gestoria/tauler/ShellGestoria.jsx', () => ({ default: () => <p>Doble de la Gestoria</p> }));
vi.mock('../gestoria/aprendre/Aprendre.jsx', () => ({ default: () => <p>Doble d’Aprendre</p> }));

import WikiDePobleSection, { AVIS_EINA_LOCAL_SENSE_TRADUCCIO, modulsLocalsActius } from './WikiDePobleSection.jsx';
import * as modulWiki from './WikiDePobleSection.jsx';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';

afterEach(() => {
  cleanup();
  fixture.itemId = '__intro';
  fixture.search = '';
  fixture.showToast.mockClear();
  fixture.redireccions.length = 0;
  fixture.props = null;
});

const obri = (itemId) => {
  fixture.itemId = itemId;
  fixture.search = `?item=${itemId}`;
  return render(<WikiDePobleSection />).container;
};
const pindoles = (arrel) => [...arrel.querySelectorAll('.page-title-labels > li')]
  .map((li) => [li.textContent, li.className.replace('sp-card-label ', '')]);

const LOCALS = [
  ['tractors_aprovacio', 'Aprovació de tractors', 'tractors_cat', 'tractors', 'Doble dels Tractors'],
  ['sentinelles_panell', 'Sentinelles', 'tractors_cat', 'sentinelles', 'Doble dels Sentinelles']
];
const esDeLaGestoria = (text) => /gestoria/i.test(String(text));

describe('modulsLocalsActius: la decisió, pura', () => {
  test('amb DEV cert: una categoria (Tractors) i dos ítems, amb la forma dels de la Consola; res de la Gestoria', () => {
    const { categories, items } = modulsLocalsActius({ DEV: true });
    expect(categories.map((c) => [c.id, c.label])).toEqual([['tractors_cat', 'Tractors']]);
    expect(items.map((i) => [i.id, i.title, i.categoryId, i.tags[0]])).toEqual(LOCALS.map(([id, titol, cat, etiqueta]) => [id, titol, cat, etiqueta]));
    expect([...categories, ...items].filter((x) => esDeLaGestoria(x.id) || esDeLaGestoria(x.label) || esDeLaGestoria(x.title))).toEqual([]);
    for (const item of items) {
      expect(item).toMatchObject({ categoryIds: [item.categoryId], attributes: { type: 'Eina local', author: 'Sistema' }, content: '' });
      expect(item.subtitle).toEqual(expect.any(String));
    }
  });

  /* Ordre del Mestre, 261004 (pla 2045, Marató 2230, F3) · Tractors agrupa dos
     documents: porta carpeta. Les seues fitxes porten FileText propi perquè no
     hereten la carpeta (Llei del Píxel: només canvia el glif de la categoria).
     Es compara la identitat del component, no la classe de lucide: toBe per
     element, perquè les icones de lucide-react són objectes forwardRef i
     toEqual només en compararia l'estructura. */
  test('amb DEV cert: Tractors porta Folder i cada eina, FileText propi', () => {
    const { categories, items } = modulsLocalsActius({ DEV: true });
    expect(categories).toHaveLength(1);
    expect(categories[0].icon).toBe(Folder);
    expect(items.map((i) => i.id)).toEqual(LOCALS.map(([id]) => id));
    for (const item of items) expect(item.icon).toBe(FileText);
  });

  test.each([
    ['DEV fals (el build de producció)', { DEV: false, PROD: true }],
    ['DEV com a text', { DEV: 'true' }],
    ['sense DEV', {}],
    ['sense entorn', undefined],
    ['entorn nul', null]
  ])('%s: cap categoria ni cap ítem', (_cas, env) => {
    expect(modulsLocalsActius(env)).toEqual({ categories: [], items: [] });
  });
});

describe('en desenvolupament', () => {
  test('la categoria dels Tractors va darrere de la Consola, i els seus dos ítems hi pengen', () => {
    render(<WikiDePobleSection />);
    const { model } = fixture.props;
    expect(model.categories.map((c) => c.id)).toEqual(['__intro_cat', 'consola_termodinamica_cat', 'tractors_cat', 'folder:02_saber']);
    expect(model.items.filter((i) => i.categoryId === 'tractors_cat').map((i) => i.id)).toEqual(LOCALS.map(([id]) => id));
  });

  /* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
     Gestoria i Wiki») · En DEV la Wiki ja no porta cap carpeta ni cap ítem de
     la Gestoria, ni la closca com a eina amb pàgina pròpia. */
  test('cap carpeta, cap ítem ni cap eina de la Gestoria a la Wiki', () => {
    render(<WikiDePobleSection />);
    const { model } = fixture.props;
    expect(model.categories.filter((c) => esDeLaGestoria(c.id) || esDeLaGestoria(c.label))).toEqual([]);
    expect(model.items.filter((i) => esDeLaGestoria(i.id) || esDeLaGestoria(i.title) || (i.tags || []).some(esDeLaGestoria))).toEqual([]);
    expect(Object.keys(modulWiki)).not.toContain('EINES_AMB_PAGINA_PROPIA');
    expect(screen.queryByText(/^Doble (de la Gestoria|d’Aprendre)$/)).toBeNull();
  });

  /* Ordre del Mestre, 261004: la Wiki no coneix cap id ni cap ruta de la
     Gestoria. Una URL vella cau com qualsevol ítem desconegut: es munta el
     Workspace i el detall és la portada, sense redirigir enlloc ni pintar res
     de la Gestoria. Amb router i Workspace de veres, a migracioGestoria.test.jsx. */
  test.each([
    ['?categoria=gestoria_cat&item=gestoria_panell', 'gestoria_panell'],
    ['?categoria=gestoria_cat&item=gestoria_aprendre', 'gestoria_aprendre'],
    ['?item=gestoria_panell', 'gestoria_panell'],
    ['?categoria=gestoria_cat', null]
  ])('la URL vella %s: un ítem desconegut, la portada i cap rastre de la Gestoria', async (search, itemId) => {
    const portada = render(<WikiDePobleSection />).container.querySelector('header.page-title h1').textContent;
    cleanup();
    fixture.search = search;
    fixture.itemId = itemId;
    const arrel = render(<WikiDePobleSection />).container;
    expect(fixture.redireccions).toEqual([]);
    expect(fixture.props).not.toBeNull();
    expect(fixture.props.model.categories.map((c) => c.id)).not.toContain('gestoria_cat');
    expect(fixture.props.model.items.map((i) => i.id)).not.toContain(itemId);
    expect(fixture.props.selection.categoryId).not.toBe('gestoria_cat');
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(portada);
    await Promise.resolve();
    expect(screen.queryByText(/^Doble /)).toBeNull();
    expect(arrel.querySelector('.sdp-gestoria-closca')).toBeNull();
    expect(arrel.textContent).not.toMatch(/Full trimestral|Tauler Central/);
  });

  test.each(LOCALS)('%s: pàgina amb la capçalera de la Consola i el component carregat a demanda', async (id, titol, _cat, etiqueta, doble) => {
    const arrel = obri(id);
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(titol);
    expect(pindoles(arrel)).toEqual([
      ['WIKI DE POBLE', 'sdp-badge-system'],
      ['Eina local', 'sdp-badge-category'],
      [etiqueta, 'sdp-badge-tag']
    ]);
    expect(arrel.querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_SDP);
    expect(await screen.findByText(doble)).toBeTruthy();
    expect(arrel.querySelectorAll('h1')).toHaveLength(1);
  });

  test('Traduir no envia el text de l’eina enlloc: ho diu i no obri cap menú', async () => {
    obri('tractors_aprovacio');
    await screen.findByText('Doble dels Tractors');
    fireEvent.click(screen.getByRole('button', { name: 'Traduir' }));
    expect(fixture.showToast).toHaveBeenCalledWith(AVIS_EINA_LOCAL_SENSE_TRADUCCIO);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('un document que es diu com una propietat d’objecte no és cap eina', () => {
    const arrel = obri('constructor');
    expect(arrel.querySelector('header.page-title h1').textContent).toBe('Constructor de murs');
    expect(pindoles(arrel)).toEqual([['SABER', 'sdp-badge-category']]);
  });
});
