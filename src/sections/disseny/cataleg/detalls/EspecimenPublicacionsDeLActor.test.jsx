/* Esmena 2 del pla 261007_1645 · Pedra Seca §9: l'espècimen de
   PublicacionsDeLActor abans d'endollar-lo al Bloc de Notes. El catàleg el
   coneix (registre, manifest i carregador); pinta el component de veres amb
   les dades de la llavor (la Samarreta i l'Aplec de Sóc de Poble), sense h1
   ni style= ni avisos de React; fora de l'App (sense UIProvider, com a
   allLoaders.test.jsx) ho diu en lloc de pintar el que llig l'estat de l'App. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';

const mocks = vi.hoisted(() => ({ dinsDeLApp: false }));
vi.mock('../../../../app/contexts/UIContext', async (importOriginal) => {
  const real = await importOriginal();
  const fora = () => { throw new Error('fora de l’app'); };
  return {
    ...real,
    useUIActions: () => (mocks.dinsDeLApp ? { t: (_clau, text) => text } : fora()),
    useUIState: () => (mocks.dinsDeLApp ? { externalConfig: {} } : fora())
  };
});

import { CATALOG_ITEMS } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { REGISTRE } from '../registre.js';
import EspecimenPublicacionsDeLActor from './EspecimenPublicacionsDeLActor.jsx';

const pinta = () => render(<MemoryRouter><EspecimenPublicacionsDeLActor /></MemoryRouter>).container;

let errors;
beforeEach(() => {
  mocks.dinsDeLApp = false;
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

describe('el catàleg el coneix', () => {
  it('registre «viu» (fora de PedraSeca), ítem del manifest amb emoji propi i carregador', () => {
    for (const nom of ['PublicacionsDeLActor', 'VistaPublicacionsDeLActor', 'TargetaDelMercat']) {
      expect(REGISTRE.find((e) => e.nom === nom), nom).toMatchObject({ estat: 'viu', fora: true });
    }
    expect(CATALOG_ITEMS.find((i) => i.id === 'fonaments-publicacions-actor'))
      .toMatchObject({ detailKey: 'fonaments/publicacions-actor', status: 'viu', icon: '📚' });
    expect(CATALOG_DETAIL_LOADERS['fonaments/publicacions-actor']).toBeTruthy();
  });
});

describe('l’espècimen', () => {
  it('fora de l’App: la Samarreta amb la targeta de /mercat, el Carregant i el buit; la resta, l’avís', () => {
    const arrel = pinta();
    expect(arrel.querySelector('h1')).toBeNull();
    expect(arrel.querySelector('[style]')).toBeNull();
    expect(arrel.querySelector('.sdp-especimen__nom').textContent).toBe('PublicacionsDeLActor · el que l’actor ja té publicat');
    expect(arrel.querySelector('table caption').textContent).toBe('Contracte');
    /* Les capçaleres de les regions (el subtítol de cada targeta també és un h4). */
    const titols = [...arrel.querySelectorAll('.sdp-especimen__viu > h4')].map((h) => h.textContent);
    expect(titols).toEqual(['Ja publicat al Mercat', 'Ja publicat al Mur', 'Ja publicat al Mur']);
    const targetes = [...arrel.querySelectorAll('.sdp-card-grid article.sp-card')];
    expect(targetes.map((t) => t.querySelector('.sp-card-title').textContent)).toEqual(['Samarreta Sóc de Poble']);
    expect(targetes[0].querySelector('.sp-card-link-overlay').getAttribute('href')).toBe('/mercat/samarreta-socdepoble');
    expect(screen.getByText('Carregant les publicacions…')).toBeTruthy();
    expect(screen.getByText('Amb esta identitat encara no hi ha res publicat al Mur.')).toBeTruthy();
    expect(screen.getAllByText(/^Fora de l’App/)).toHaveLength(2);
  });

  it('dins de l’App: també l’Aplec amb la targeta del Mur i l’error amb «Torna-ho a provar»', () => {
    mocks.dinsDeLApp = true;
    const arrel = pinta();
    const titols = [...arrel.querySelectorAll('.sdp-especimen__viu > h4')].map((h) => h.textContent);
    expect(titols).toEqual(['Ja publicat al Mercat', 'Ja publicat a Esdeveniments', 'Ja publicat al Mur', 'Ja publicat al Mur', 'Ja publicat al Mur']);
    expect(screen.getByText('2n Aplec pel Territori')).toBeTruthy();
    expect(screen.queryByText(/^Fora de l’App/)).toBeNull();
    const viu = arrel.querySelector('.sdp-especimen__viu');
    fireEvent.click(within(viu).getByRole('button', { name: 'Torna-ho a provar' }));
    expect(screen.getByText('Reintents de mostra: 1. No s’ha carregat res.')).toBeTruthy();
  });
});
