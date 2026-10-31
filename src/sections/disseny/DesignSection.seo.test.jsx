/**
 * Ordre del Mestre (30-10-2026, prompt 2208, T2.1; OG-GAP-01 de Gemini) ·
 * /disseny és pública i indexable. La portada registra el head que
 * prerenderitza el build (metadadesDePagina sobre el copy de la portada): el
 * títol, l'entradeta i la il·lustració pel selector social, que va al <head>
 * per la seua variant JPEG de 1200x630 (la WebP no la pinta WhatsApp). Un
 * espècimen registra el seu títol i l'entradeta que pinta. La pàgina no canvia.
 * Fixtures com editorial.test.js: l'espai de treball pinta el detall triat.
 */
import { createElement as h } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({ itemId: null, crides: [] }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  useSearchParams: () => [new URLSearchParams(estat.itemId ? `item=${estat.itemId}` : ''), () => {}],
  Link: 'a'
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({
  UniversalWorkspace: ({ model, renderDetail }) => h('div', null, renderDetail({
    item: model.items.find((item) => item.id === (estat.itemId ?? '__intro'))
  }))
}));
vi.mock('./cataleg/detailRegistry', () => ({
  CATALOG_DETAIL_LOADERS: new Proxy({}, { get: () => function Mostra() { return null; } })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (args) => { estat.crides.push(args); } }));

import DesignSection from './DesignSection.jsx';
import { CATALOG_ITEMS } from './cataleg/manifest';
import { LIMIT_DESCRIPCIO, LIMIT_TITOL, textPla } from '../../config/metadadesSocials.js';
import { PAGE_COPY } from '../text/pageContent.js';

afterEach(() => { cleanup(); estat.itemId = null; estat.crides = []; });

describe('el head de /disseny', () => {
  test('la portada: títol, entradeta i la variant social de la il·lustració, amb el seu alt', () => {
    const portada = PAGE_COPY.disseny;
    const { container } = render(h(DesignSection));
    expect(estat.crides.at(-1)).toEqual({
      title: textPla(portada.title, LIMIT_TITOL),
      description: textPla(portada.lead || portada.subtitle, LIMIT_DESCRIPCIO),
      image: {
        url: 'https://socdepoble.org/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211-social-1200x630.jpg',
        alt: textPla(portada.imageAlt || portada.title, LIMIT_TITOL)
      }
    });
    // La portada que es pinta continua sent la WebP de sempre (Llei del Píxel).
    expect(container.querySelector('.hero-image img').getAttribute('src')).toBe(portada.image);
  });

  test('un espècimen: el seu títol i l’entradeta que pinta, sense imatge pròpia', () => {
    const especimen = CATALOG_ITEMS.find((item) => item.id === 'inventari-global');
    estat.itemId = especimen.id;
    render(h(DesignSection));
    const seo = estat.crides.at(-1);
    expect(seo.title).toBe(textPla(especimen.title, LIMIT_TITOL));
    if (especimen.lead) expect(seo.description).toBe(textPla(especimen.lead, LIMIT_DESCRIPCIO));
    else expect(seo.description).toMatch(/^Espècimen viu del catàleg Pedra Seca/);
    expect(seo.image).toBeUndefined();
  });
});
