/* 261002 · La Wiki en mode producció: import.meta.env.DEV és fals ABANS
   d'importar-la (vi.hoisted), com quan Vite el reemplaça al build. Cap
   categoria ni ítem de les eines locals, i un ?item=gestoria_panell no pinta
   cap eina. Que el build no porte el codi de la Gestoria ho comprova
   gestoria/privacitat.test.js compilant la Wiki amb Vite. */
import React from 'react';
import { afterAll, afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const fixture = vi.hoisted(() => {
  vi.stubEnv('DEV', false);
  vi.stubEnv('PROD', true);
  return { itemId: 'gestoria_panell', search: '?item=gestoria_panell', props: null };
});
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: (props) => {
    fixture.props = props;
    const { model, renderDetail, className } = props;
    return <div className={className}>{renderDetail({ item: model.items.find(item => item.id === fixture.itemId) })}</div>;
  }
}));
vi.mock('../../data/wikiManifest.js', () => ({ wikiManifest: { categories: [], items: [] } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), useLocation: () => ({ pathname: '/wikidepoble', search: fixture.search }), Link: 'a'
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../tractors/PanellTractors.jsx', () => ({ default: () => <p>Doble dels Tractors</p> }));
vi.mock('../tractors/PanellSentinelles.jsx', () => ({ default: () => <p>Doble dels Sentinelles</p> }));
vi.mock('../gestoria/ContenidorGestoria.jsx', () => ({ default: () => <p>Doble de la Gestoria</p> }));
vi.mock('../gestoria/aprendre/Aprendre.jsx', () => ({ default: () => <p>Doble d’Aprendre</p> }));

import WikiDePobleSection from './WikiDePobleSection.jsx';
import { PAGE_COPY } from '../text/pageContent';

afterEach(cleanup);
afterAll(() => vi.unstubAllEnvs());

test('l’entorn de la prova és el de producció', () => {
  expect(import.meta.env.DEV).toBe(false);
});

test('cap categoria ni ítem de les eines locals', () => {
  render(<WikiDePobleSection />);
  const { model } = fixture.props;
  expect(model.categories.map((c) => c.id)).toEqual(['__intro_cat', 'consola_termodinamica_cat']);
  expect(model.items.map((i) => i.id)).toEqual(['__intro', 'consola_termodinamica']);
});

test('una URL amb l’ítem d’una eina no la pinta: l’ítem no existix i es veu la portada', async () => {
  for (const id of ['gestoria_panell', 'gestoria_aprendre', 'tractors_aprovacio', 'sentinelles_panell']) {
    fixture.itemId = id;
    fixture.search = `?item=${id}`;
    const arrel = render(<WikiDePobleSection />).container;
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(PAGE_COPY.wikidepoble.title);
    cleanup();
  }
  await Promise.resolve();
  expect(screen.queryByText(/^Doble /)).toBeNull();
});
