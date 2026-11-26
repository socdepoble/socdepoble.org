/**
 * C26-2 #1 i #3 (Gauntlet c13, v1.2.26) · Paritat absoluta d'un producte entre la Card del Mur
 * (TargetaDelMur), la Card del Mercat (TargetaDelMercat) i la seua UniversalPage (paginaDElement),
 * en les 5 llengües. Llibre Mestre, IDEA-365: 21:40, regla 1 («un producte del /mercat que també ix
 * al /mur porta Mur + Mercat»); 21:58, punt 1 (paritat absoluta Card ↔ UniversalPage) i punt 2
 * (les botelles d'Oli de La Torre porten Mur + Mercat mentre es mostren als dos llocs).
 * La fixture fa el camí de lectura remota de veres (mapSectionSubmissionToItem · classificaProducte).
 * Dades sintètiques: cap producte real.
 */
import '../../../tests/helpers/diccionaris.js';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ language: 'ca', t: (_clau, reserva) => reserva, towns: [] }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, language: mocks.language }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: mocks.towns }) }));

import { TargetaDelMur } from './TargetaDelMur.jsx';
import { TargetaDelMercat } from '../mercat/TargetaDelMercat.jsx';
import { paginaDElement } from '../detail/elementDeSeccio.js';
import { buildMercatDetailSectionMeta } from '../detail/detailSectionMeta.jsx';
import { rutaDePindola } from '../../components/PedraSeca/organismes/rutaDePindola.js';
import { mapSectionSubmissionToItem } from '../../data/mapejadorSeccions.js';
import { classificaProducte } from '../../data/taxonomia/destinsDeProducte.js';
import { nomEstructural } from '../../data/taxonomia/taxonomiaCanonica.js';
import { createTranslator } from '../../config/i18n.js';

const IDIOMES = ['ca', 'es', 'en', 'eu', 'gl'];
/* IDEA-365 (Llibre Mestre, línia 3820) · Les Categories de Sistema amb ruta pròpia. */
const RUTES_DEDICADES = ['/mur', '/mercat', '/calendari'];
const TORRE = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', etiqueta_curta_poble: 'La Torre' };
const OLI = mapSectionSubmissionToItem({
  id: '5e0e0000-0000-4000-8000-000000001226',
  sectionId: 'mercat',
  createdAt: '2026-11-26T05:00:00.000Z',
  payload: {
    type: 'product', title: 'Oli sintètic · Verge Extra', category_slug: 'alimentacio', tag: 'oli-verge-extra',
    author_name: 'Almàssera sintètica', poble_id: 'la-torre-de-les-macanes',
    variations: [{ id: 'u1', name: 'Variant 1' }, { id: 'u2', name: 'Variant 2' }, { id: 'u3', name: 'Variant 3' }]
  }
});

/* [text, classe, href] de les pastilles pintades, en l'ordre de la targeta. */
const pastilles = (container) => [...container.querySelectorAll('li.sp-card-label')].map((li) => [
  li.textContent, li.className.replace(/^sp-card-label\s*/, ''), li.querySelector('a')?.getAttribute('href') ?? null
]);
/* Les de la UniversalPage, amb la mateixa regla de ruta que pinta PageFrame i UniversalCard (IDEA-365). */
const deLaPagina = (labels) => labels.map((l) => [l.text, l.className, rutaDePindola(l)]);

afterEach(() => { cleanup(); mocks.language = 'ca'; mocks.t = (_clau, reserva) => reserva; mocks.towns = []; });

describe('C26-2 #1 · IDEA-365 · la Card del Mur d’un producte és la Card del Mercat i la seua pàgina, en 5L', () => {
  test.each(IDIOMES)('%s: mateixes pastilles, mateix ordre i mateixes rutes a les tres superfícies', (idioma) => {
    mocks.language = idioma;
    mocks.t = createTranslator(idioma);
    mocks.towns = [TORRE];
    const mur = pastilles(render(<TargetaDelMur item={OLI} />).container);
    cleanup();
    const mercat = pastilles(render(<TargetaDelMercat item={OLI} />).container);
    const pagina = deLaPagina(paginaDElement(buildMercatDetailSectionMeta({ marketItems: [OLI], t: mocks.t, towns: [TORRE] }), OLI, { idioma, t: mocks.t }).labels);
    expect(mur).toEqual(mercat);
    expect(mur).toEqual(pagina);
    // Regla 1 (21:40): els destins de sistema davant, Mur + Mercat, en la llengua de la interfície.
    expect(mur.slice(0, 2)).toEqual([[nomEstructural('Mur', idioma), 'sdp-badge-system', '/mur'], [nomEstructural('Mercat', idioma), 'sdp-badge-system', '/mercat']]);
    // Res no es perd: categoria, etiqueta, recompte de variants i el poble, l'últim.
    expect(mur.map(([, classe]) => classe)).toEqual(['sdp-badge-system', 'sdp-badge-system', 'sdp-badge-category', 'sdp-badge-tag', 'sdp-badge-accent', 'sdp-badge-tag sp-card-label--enllac']);
    expect(mur[4][0]).toBe(`3 ${mocks.t('section.mercat.variations', 'variants')}`);
    expect(mur.at(-1)).toEqual(['La Torre', 'sdp-badge-tag sp-card-label--enllac', '/pobles/la-torre-de-les-macanes']);
    /* C26-2 · D3 de l'integrador (IDEA-365, 21:40, regla 3; línia 3820) · Cap píndola porta a «no trobada»: el
       recompte de variants no és taxonomia (text inert), i la categoria i l'etiqueta porten a la ruta del seu
       slug intern, la MATEIXA en les 5 llengües (abans «Food» portava a /categoria/food). Cada ruta és dedicada
       (/mur, /mercat, la fitxa de /pobles) o és /categoria|/etiqueta/<slug>, que resol la pàgina editorial o
       l'automàtica (R2-4) perquè este producte ja porta eixa categoria i eixa etiqueta. */
    expect(mur[4][2]).toBeNull();
    expect(mur.slice(2, 4).map(([, , ruta]) => ruta)).toEqual([`/categoria/${OLI.category_slug}`, `/etiqueta/${OLI.tag}`]);
    for (const [text, , ruta] of mur.filter(([, , r]) => r !== null)) {
      expect([text, RUTES_DEDICADES.includes(ruta) || /^\/pobles\/[a-z0-9-]+$/.test(ruta) || /^\/(?:categoria|etiqueta)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ruta)]).toEqual([text, true]);
    }
  });

  test('ca i es, lletra a lletra (el cas de l’Oli de La Torre del Llibre Mestre)', () => {
    mocks.towns = [TORRE];
    expect(pastilles(render(<TargetaDelMur item={OLI} />).container).map(([text]) => text))
      .toEqual(['Mur', 'Mercat', 'Alimentació', 'Oli Verge Extra', '3 variants', 'La Torre']);
    cleanup();
    mocks.language = 'es';
    mocks.t = createTranslator('es');
    const es = pastilles(render(<TargetaDelMur item={OLI} />).container).map(([text]) => text);
    expect(es.slice(0, 2)).toEqual(['Muro', 'Mercado']);
    expect(es[4]).toBe('3 variantes');
    expect(es).not.toContain('Mur');
    expect(es).not.toContain('Mercat');
  });

  test('classificaProducte només completa categoriesSistema: cap «labels» fabricada que tape la reserva', () => {
    const font = Object.freeze({ id: 'p', type: 'product', category_slug: 'roba', tag: 'samarreta', variations: [{ id: 'a' }, { id: 'b' }] });
    const classificat = classificaProducte(font);
    expect(classificat.categoriesSistema).toEqual(['Mur', 'Mercat']);
    expect(Object.hasOwn(classificat, 'labels')).toBe(false);
    expect(Object.hasOwn(OLI, 'labels')).toBe(false);
    expect(OLI.categoriesSistema).toEqual(['Mur', 'Mercat']);
  });

  test('llevar Mur (categoriesSistema declarades) es reflectix igual a la Card del Mur i a la del Mercat', () => {
    const nomesMercat = { ...OLI, categoriesSistema: ['Mercat'] };
    const mur = pastilles(render(<TargetaDelMur item={nomesMercat} />).container);
    cleanup();
    expect(pastilles(render(<TargetaDelMercat item={nomesMercat} />).container)).toEqual(mur);
    expect(mur.filter(([, classe]) => classe === 'sdp-badge-system').map(([text]) => text)).toEqual(['Mercat']);
  });
});
