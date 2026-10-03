/* 261002 · Les eines locals de la Wiki (Tractors, Sentinelles i Gestoria de
   Poble), que només hi són en desenvolupament: vitest corre amb
   import.meta.env.DEV cert. El mode producció el proven modulsLocalsActius
   (ací) i WikiDePobleSection.produccio.test.jsx. Els quatre components són dobles:
   les seues proves són a gestoria/ i a tractors/. UniversalPage és la de
   veres: es mira la capçalera que pinta. */
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const fixture = vi.hoisted(() => ({ itemId: '__intro', search: '', props: null, showToast: vi.fn() }));
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
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), useLocation: () => ({ pathname: '/wikidepoble', search: fixture.search }), Link: 'a'
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: fixture.showToast }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../tractors/PanellTractors.jsx', () => ({ default: () => <p>Doble dels Tractors</p> }));
vi.mock('../tractors/PanellSentinelles.jsx', () => ({ default: () => <p>Doble dels Sentinelles</p> }));
vi.mock('../gestoria/ContenidorGestoria.jsx', () => ({ default: () => <p>Doble de la Gestoria</p> }));
vi.mock('../gestoria/aprendre/Aprendre.jsx', () => ({ default: () => <p>Doble d’Aprendre</p> }));

import WikiDePobleSection, { AVIS_EINA_LOCAL_SENSE_TRADUCCIO, modulsLocalsActius } from './WikiDePobleSection.jsx';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';

afterEach(() => {
  cleanup();
  fixture.itemId = '__intro';
  fixture.search = '';
  fixture.showToast.mockClear();
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
  ['sentinelles_panell', 'Sentinelles', 'tractors_cat', 'sentinelles', 'Doble dels Sentinelles'],
  ['gestoria_panell', 'Full trimestral', 'gestoria_cat', 'gestoria', 'Doble de la Gestoria'],
  ['gestoria_aprendre', 'Aprendre', 'gestoria_cat', 'gestoria', 'Doble d’Aprendre']
];

describe('modulsLocalsActius: la decisió, pura', () => {
  test('amb DEV cert: dues categories i quatre ítems, amb la forma dels de la Consola', () => {
    const { categories, items } = modulsLocalsActius({ DEV: true });
    expect(categories.map((c) => [c.id, c.label])).toEqual([['tractors_cat', 'Tractors'], ['gestoria_cat', 'Gestoria de Poble']]);
    expect(items.map((i) => [i.id, i.title, i.categoryId, i.tags[0]])).toEqual(LOCALS.map(([id, titol, cat, etiqueta]) => [id, titol, cat, etiqueta]));
    for (const item of items) {
      expect(item).toMatchObject({ categoryIds: [item.categoryId], attributes: { type: 'Eina local', author: 'Sistema' }, content: '' });
      expect(item.subtitle).toEqual(expect.any(String));
    }
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
  test('les categories van darrere de la Consola, i els quatre ítems hi pengen', () => {
    render(<WikiDePobleSection />);
    const { model } = fixture.props;
    expect(model.categories.map((c) => c.id)).toEqual(['__intro_cat', 'consola_termodinamica_cat', 'tractors_cat', 'gestoria_cat', 'folder:02_saber']);
    expect(model.items.filter((i) => i.categoryId === 'tractors_cat' || i.categoryId === 'gestoria_cat').map((i) => i.id))
      .toEqual(LOCALS.map(([id]) => id));
  });

  test('la carpeta es pot triar per la URL, com qualsevol altra', () => {
    fixture.search = '?categoria=gestoria_cat&item=gestoria_panell';
    fixture.itemId = 'gestoria_panell';
    render(<WikiDePobleSection />);
    expect(fixture.props.selection).toEqual({ categoryId: 'gestoria_cat', itemId: 'gestoria_panell' });
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
    obri('gestoria_panell');
    await screen.findByText('Doble de la Gestoria');
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
