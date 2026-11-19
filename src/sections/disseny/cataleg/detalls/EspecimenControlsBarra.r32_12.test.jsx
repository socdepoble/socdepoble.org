import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';

const ui = vi.hoisted(() => ({ language: 'ca' }));
vi.mock('../../../../app/contexts/UIContext', async (importOriginal) => {
  const real = await importOriginal();
  const useUIActions = () => ({ t: (_k, fb) => fb, language: ui.language, resolveAsset: (u) => u });
  const useUIState = () => ({ externalConfig: {}, locale: 'ca-ES', language: ui.language });
  return {
    ...real,
    useUIActions,
    useUIState,
    useUIActionsOpcional: useUIActions,
    useUIStateOpcional: useUIState,
  };
});

import EspecimenControlsBarra from './EspecimenControlsBarra.jsx';
import EspecimenTraspasCopublicacio from './EspecimenTraspasCopublicacio.jsx';
import { METADADES_CONTROLS_BARRA, TEXTOS_CONTROLS_BARRA, localitzaItemCataleg } from '../i18nControlsBarra.js';
import { CATALOG_ITEMS } from '../manifest.js';

afterEach(() => {
  cleanup();
  ui.language = 'ca';
});

describe('Onada R32.12 · Lot 01 · fonaments-controls-barra i Design System 10/10', () => {
  test('purga vestigis de Rentonar / Som de Poble i utilitza l’entitat viva Oli de La Torre en co-publicació', () => {
    const { container: c1 } = render(<MemoryRouter><EspecimenControlsBarra /></MemoryRouter>);
    expect(c1.textContent).not.toMatch(/Rentonar|Som de Poble/i);
    const copub = screen.getByRole('region', { name: 'Co-publicació registrada (espècimen, lectura)' });
    const linksSdp = within(copub).getAllByRole('link', { name: /Sóc de Poble/ });
    expect(linksSdp.length).toBeGreaterThanOrEqual(1);
    for (const link of linksSdp) expect(link.getAttribute('href')).toBe('/socdepoble');
    expect(within(copub).getByRole('link', { name: /Oli de La Torre/ }).getAttribute('href')).toBe('/empresa/olidelatorre');

    cleanup();
    const { container: c2 } = render(<MemoryRouter><EspecimenTraspasCopublicacio /></MemoryRouter>);
    expect(c2.textContent).not.toMatch(/Som de Poble/i);
    const bipartit = screen.getByRole('region', { name: 'Co-publicació de dues entitats registrades' });
    expect(bipartit.textContent).not.toMatch(/Rentonar/i);
    expect(bipartit.textContent).toContain('Oli de La Torre');
  });

  test('reflectix l’estat viu de BarraNegra, BarraBlava amb MenuTraduir, BarraTaronja amb PaginaEmojis i el peu de UniversalCard amb Llei 35 i Llei 32', () => {
    const { container } = render(<MemoryRouter><EspecimenControlsBarra /></MemoryRouter>);
    const text = container.textContent;
    for (const peca of ['BarraNegra', 'BarraBlava', 'MenuTraduir', 'BarraTaronja', 'PaginaEmojis', 'UniversalCard']) {
      expect(text, peca).toContain(peca);
    }
    expect(text).not.toMatch(/servidor del poble|serveis del poble/i);
    expect(text).toContain('els serveis de Sóc de Poble');
    expect(text).toContain('el servidor de Sóc de Poble');

    // Peu real de la UniversalCard amb els mateixos àtoms (sense afegir cap header.bar-blue extra).
    expect(container.querySelectorAll('header.bar-blue')).toHaveLength(2);
    expect(container.querySelector('article.sp-card footer.sp-card-footer')).not.toBeNull();

    // Jerarquia H3 -> H4 -> H5 sense salts i amb negretes d'escaneig Llei 35 als paràgrafs explicatius.
    const h3s = [...container.querySelectorAll('h3')].map((h) => h.textContent);
    expect(h3s.length).toBeGreaterThanOrEqual(3);
    const paragrafsArquitectura = [...container.querySelectorAll('#controls-barra-arquitectura ~ p')];
    expect(paragrafsArquitectura).toHaveLength(4);
    for (const p of paragrafsArquitectura) {
      expect(p.querySelectorAll('strong').length).toBeGreaterThanOrEqual(5);
    }
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('paritat editorial i escaneig <strong> en %s sense fugues de Llei 32', (llengua) => {
    ui.language = llengua;
    const baseItem = CATALOG_ITEMS.find((i) => i.id === 'fonaments-controls-barra');
    const loc = localitzaItemCataleg(baseItem, llengua);
    expect(loc.title).toBe(METADADES_CONTROLS_BARRA[llengua].title);
    expect(loc.lead).toBe(METADADES_CONTROLS_BARRA[llengua].lead);

    const { container } = render(<MemoryRouter><EspecimenControlsBarra /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 3, name: TEXTOS_CONTROLS_BARRA[llengua].arquitecturaTitol })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: TEXTOS_CONTROLS_BARRA[llengua].h4Blava })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: TEXTOS_CONTROLS_BARRA[llengua].h4TaronjaEdicio })).toBeTruthy();

    const paragrafsVius = [...container.querySelectorAll('.sdp-especimen__viu > p')];
    expect(paragrafsVius.length).toBeGreaterThanOrEqual(9);
    for (const p of paragrafsVius) {
      expect(p.querySelectorAll('strong').length, `${llengua}: ${p.textContent.slice(0, 50)}`).toBeGreaterThanOrEqual(2);
    }
    expect(container.textContent).not.toMatch(/servidor del poble|serveis del poble|servidor del pueblo|servicios del pueblo|village server|village services|herriko zerbitzari|servidor da vila/i);
  });
});
