/* IDEA-116 (Onada R9, carril C2) · La primera targeta incrustada del cos de
   /page/fediversity és la de la primera publicació del Mur, en les cinc
   llengües: la clau publicacio:<id>, la ruta /mur/<id> (que resol una
   publicació de la llavor), la instantània de reserva amb el títol de la
   llavor i, darrere, la targeta del Node 0 de sempre. Una sola vegada. */
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import {
  CLAU_PRIMERA_TARGETA_FEDIVERSITY, GRUP_PRIMERA_TARGETA_FEDIVERSITY, GRUP_PRIMERA_TARGETA_FEDIVERSITY_TRADUIDA, RUTA_PRIMERA_TARGETA_FEDIVERSITY,
  afigPrimeraTargetaFediversity
} from './pageContent.targetaMur.js';
import { CosAmbTargetes } from '../../components/universal/richText/extensions/targetes/CosAmbTargetes.jsx';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { segmentsAmbTargetes, MARCA_GRUP } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
import { APP_SEED } from '../../data/appSeed.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST as POST } from '../mur/articles/novesTecnologiesCulturaRuralContent.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const targetesDe = (html) => segmentsAmbTargetes(sanitizeHtml(html)).filter((segment) => segment.tipus === 'targetes').flatMap((segment) => segment.targetes);

describe('/page/fediversity · la primera targeta del cos', () => {
  test.each(LLENGUES)('%s: la primera targeta és la publicació del Mur, i una sola vegada', (llengua) => {
    const pagina = localitzaPagina(PAGE_COPY.fediversity, llengua);
    const targetes = targetesDe(pagina.html);
    expect(targetes[0]).toMatchObject({
      clau: CLAU_PRIMERA_TARGETA_FEDIVERSITY, ruta: RUTA_PRIMERA_TARGETA_FEDIVERSITY,
      titol: POST.title, subtitol: POST.post_subtitle, entradilla: POST.entradilla, autor: 'Sóc de Poble', autorRuta: '/projecte'
    });
    expect(targetes.filter((targeta) => targeta.clau === CLAU_PRIMERA_TARGETA_FEDIVERSITY)).toHaveLength(1);
    // G1-N02 · A les traduccions, la targeta diu que el seu text és en valencià; en valencià, la de sempre.
    expect(targetes[0].llengua).toBe(llengua === 'ca' ? undefined : 'ca');
    expect(pagina.html.trim().startsWith(llengua === 'ca' ? GRUP_PRIMERA_TARGETA_FEDIVERSITY : GRUP_PRIMERA_TARGETA_FEDIVERSITY_TRADUIDA)).toBe(true);
  });

  test('en valencià, darrere continua la targeta del Node 0 (el dossier detallat no canvia)', () => {
    const claus = targetesDe(PAGE_COPY.fediversity.html).map((targeta) => targeta.clau);
    expect(claus[0]).toBe(CLAU_PRIMERA_TARGETA_FEDIVERSITY);
    expect(claus).toContain('pagina:node-zero');
    expect(PAGE_COPY.fediversity.html).toBe(PAGE_COPY.fediversity.translations.ca.html);
  });

  test('la ruta resol una publicació de la llavor del Mur, signada per l’entitat', () => {
    expect(RUTA_PRIMERA_TARGETA_FEDIVERSITY).toBe(`/mur/${POST.id}`);
    // R9V-C2-01 · La llavor del Mur (APP_SEED.feedPosts, els dos adaptadors en seed) la porta; en remot, content.js.
    expect(APP_SEED.feedPosts.find((item) => `/mur/${item.id}` === RUTA_PRIMERA_TARGETA_FEDIVERSITY)).toMatchObject(POST);
    expect(GRUP_PRIMERA_TARGETA_FEDIVERSITY.startsWith(`<div ${MARCA_GRUP}=""`)).toBe(true);
    expect(GRUP_PRIMERA_TARGETA_FEDIVERSITY).not.toMatch(/\sstyle=|<img/);
  });

  test('idempotent: aplicar-la dues vegades no duplica la targeta', () => {
    // G1-N02 · La llengua de cada traducció tria el grup: amb lang a les traduccions i sense en valencià.
    const ambLlengues = { fediversity: { html: '<h3>A</h3>', contentLanguage: 'ca', translations: { ca: { html: '<h3>A</h3>' }, en: { html: '<h3>B</h3>' } } } };
    afigPrimeraTargetaFediversity(ambLlengues);
    expect(ambLlengues.fediversity.html.startsWith(GRUP_PRIMERA_TARGETA_FEDIVERSITY)).toBe(true);
    expect(ambLlengues.fediversity.translations.ca.html.startsWith(GRUP_PRIMERA_TARGETA_FEDIVERSITY)).toBe(true);
    expect(ambLlengues.fediversity.translations.en.html.startsWith(GRUP_PRIMERA_TARGETA_FEDIVERSITY_TRADUIDA)).toBe(true);
    const copia = { fediversity: { html: '<h3>A</h3>', translations: { es: { html: '<h3>B</h3>' }, en: null } } };
    afigPrimeraTargetaFediversity(copia);
    afigPrimeraTargetaFediversity(copia);
    expect(copia.fediversity.html.split(CLAU_PRIMERA_TARGETA_FEDIVERSITY)).toHaveLength(2);
    expect(copia.fediversity.translations.es.html.split(CLAU_PRIMERA_TARGETA_FEDIVERSITY)).toHaveLength(2);
    expect(() => afigPrimeraTargetaFediversity({})).not.toThrow();
    expect(() => afigPrimeraTargetaFediversity(null)).not.toThrow();
  });
});

/* G1-N02 (Gauntlet de l'arbre R9) · En una traducció de /page/fediversity, el títol, el subtítol i
   l'entradeta de la targeta del Mur són en valencià i ho diuen (lang="ca"), com el nom de l'enllaç de
   la targeta, que és el títol. Els botons del peu són de la interfície i no en porten. En valencià,
   cap lang a la targeta (el DOM de sempre). */
describe('/page/fediversity · la llengua de la primera targeta (G1-N02)', () => {
  afterEach(cleanup);
  const pinta = (llengua) => {
    const segments = segmentsAmbTargetes(sanitizeHtml(localitzaPagina(PAGE_COPY.fediversity, llengua).html));
    const { container } = render(createElement(MemoryRouter, null, createElement(CosAmbTargetes, { segments })));
    return container.querySelector('.sdp-targetes > .sdp-targeta');
  };
  const langDe = (node) => node?.closest('[lang]')?.getAttribute('lang') ?? null;

  test.each(['es', 'en', 'eu', 'gl'])('%s: títol, subtítol, entradeta i enllaç en valencià; el peu, no', (llengua) => {
    const targeta = pinta(llengua);
    expect(targeta.querySelector('.sp-card-title').textContent).toBe(POST.title);
    for (const peca of ['.sp-card-title', '.sp-card-subtitle', '.sp-card-text', 'a.sp-card-link-overlay']) {
      expect([peca, targeta.querySelector(peca)?.getAttribute('lang')]).toEqual([peca, 'ca']);
    }
    const peu = targeta.querySelector('.sp-card-footer');
    expect(peu).not.toBeNull();
    expect([...peu.querySelectorAll('button, a')].length).toBeGreaterThan(0);
    for (const control of peu.querySelectorAll('button, a')) expect(langDe(control)).toBeNull();
    expect(langDe(targeta)).toBeNull();
  });

  test('ca: la targeta de sempre, sense cap lang', () => {
    const targeta = pinta('ca');
    expect(targeta.querySelector('.sp-card-title').textContent).toBe(POST.title);
    expect(targeta.querySelectorAll('[lang]')).toHaveLength(0);
  });
});
