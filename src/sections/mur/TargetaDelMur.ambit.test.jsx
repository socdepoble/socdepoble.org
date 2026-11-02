/**
 * IDEA-61 (T0, prompt 261102_1532) · La targeta del Mur d'una fitxa del Flux
 * Universal de Publicació: la ruta del detall de l'àmbit (/vehicle/<id>…),
 * les dues etiquetes del contracte (l'àmbit i l'estat) davant de les de
 * sempre i el resum de la fitxa com a subtítol. I la Llei del Píxel: un
 * element SENSE àmbit (una publicació del Mur de sempre, un producte de
 * llegat) es pinta exactament igual que abans: cap insígnia, les etiquetes
 * de sempre, la ruta de sempre i el seu subtítol.
 * Patró de TargetaDelMur.autoria.test.jsx (router, avisos i i18n substituïts).
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));

import { TargetaDelMur } from './TargetaDelMur.jsx';
import { MARKET_ITEMS } from '../mercat/marketContent.js';

const CREAT = '2026-11-02T10:00:00.000Z';
const fitxa = (ambit, id, estat, dades, extra = {}) => ({ id, type: ambit, title: `Fitxa ${id}`, subtitle: 'Subtítol propi', ambit, estat, dades, created_at: CREAT, ...extra });
const VIATGE = fitxa('vehicle', 'v1', 'disponible', { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', hora_eixida: '08:00', places: 3, aportacio: '5 €' });
const OFERTA = fitxa('treball', 't1', 'reservat', { modalitat: 'oferta_feina', ofici: 'Forn', municipi: 'Sella', contacte: 'Secret' });
const CASA = fitxa('habitatge', 'h1', 'complet', { modalitat: 'lloguer', preu: '350 €', superficie_m2: 80 });
const POST = { id: 'p1', type: 'feed', title: 'La fira', subtitle: 'Diumenge', description: 'Entradeta', created_at: CREAT, author_name: 'Maria' };

const pinta = (item) => render(<TargetaDelMur item={item} />).container.querySelector('article');
const etiquetes = (article) => [...article.querySelectorAll('li.sp-card-label')].map((li) => [li.textContent, li.className.replace(/^sp-card-label\s*/, '')]);
const overlay = (article) => article.querySelector('a.sp-card-link-overlay')?.getAttribute('href') ?? null;
const subtitol = (article) => article.querySelector('.sp-card-subtitle')?.textContent ?? null;
/* Les etiquetes de sempre d'un element, calculades com les calculava la targeta abans d'IDEA-61. */
const deSempre = (item) => (item.labels || [
  { text: item.isSystem ? 'Sistema' : ((item.type === 'market' || item.type === 'product') ? 'Mercat' : (item.type || 'Publicació')), className: (item.isSystem || item.type === 'market' || item.type === 'product') ? 'sdp-badge-system' : 'sdp-badge-category' },
  (item.type === 'market' || item.type === 'product') && item.variations?.length ? { text: `${item.variations.length} variants`, className: 'sdp-badge-accent' } : null,
  (item.type === 'market' || item.type === 'product') && item.category_slug ? { text: item.category_slug, className: 'sdp-badge-category' } : null,
  (item.type === 'market' || item.type === 'product') && item.tag ? { text: item.tag, className: 'sdp-badge-tag' } : null
].filter(Boolean)).map((label) => [label.text, label.className]);

afterEach(cleanup);

describe('una fitxa d’àmbit', () => {
  /* Correcció L3-A6 · Sense el type cru ('vehicle') darrere: text sense t() i
     redundant amb l'etiqueta de l'àmbit. */
  test('vehicle: /vehicle/<id>, l’àmbit i l’estat (i cap type cru darrere), i el resum com a subtítol', () => {
    const article = pinta(VIATGE);
    expect(overlay(article)).toBe('/vehicle/v1');
    expect(etiquetes(article)).toEqual([['Compartir cotxe', 'sdp-badge-system'], ['Disponible', 'sdp-insignia sdp-insignia--exit']]);
    expect(article.textContent).not.toMatch(/\bvehicle\b/);
    expect(subtitol(article)).toBe('Oferisc places · La Torre → Alcoi · 2026-11-15 08:00 · Places disponibles: 3 · 5 €');
  });

  test('treball reservat i habitatge complet: el to de cada estat, el resum sense el contacte, i la superfície amb la unitat', () => {
    const treball = pinta(OFERTA);
    expect(overlay(treball)).toBe('/treball/t1');
    expect(etiquetes(treball).slice(0, 2)).toEqual([['Treball', 'sdp-badge-system'], ['Reservat', 'sdp-insignia sdp-insignia--avis']]);
    expect(subtitol(treball)).toBe('Oferta de feina · Forn · Sella');
    expect(treball.textContent).not.toContain('Secret');
    cleanup();
    const habitatge = pinta(CASA);
    expect(overlay(habitatge)).toBe('/habitatge/h1');
    expect(etiquetes(habitatge).slice(0, 2)).toEqual([['Habitatge', 'sdp-badge-system'], ['Complet', 'sdp-insignia sdp-insignia--neutre']]);
    expect(subtitol(habitatge)).toBe('Lloguer · 350 € · 80 m²');
  });

  test('un estat tancat o desconegut: «Tancat» en to d’error, o «Disponible» de sèrie', () => {
    expect(etiquetes(pinta({ ...VIATGE, estat: 'tancat' }))[1]).toEqual(['Tancat', 'sdp-insignia sdp-insignia--error']);
    cleanup();
    expect(etiquetes(pinta({ ...VIATGE, estat: 'constructor' }))[1]).toEqual(['Disponible', 'sdp-insignia sdp-insignia--exit']);
  });

  test('una fitxa sense cap dada vàlida conserva el seu subtítol; l’id s’escapa a la ruta', () => {
    const article = pinta(fitxa('vehicle', 'v 2', 'disponible', { modalitat: 'tot_gratis' }));
    expect(overlay(article)).toBe('/vehicle/v%202');
    expect(subtitol(article)).toBe('Subtítol propi');
  });

  test('un mainHref de fora en una fitxa cau al detall de l’àmbit; un d’intern mana', () => {
    expect(overlay(pinta({ ...VIATGE, mainHref: 'https://fals-poble.example/entra' }))).toBe('/vehicle/v1');
    cleanup();
    expect(overlay(pinta({ ...VIATGE, mainHref: '/calendari' }))).toBe('/calendari');
  });

  test('una fitxa de mercat: la ruta de sempre, l’àmbit i l’estat davant i, darrere, les del Mercat que afigen informació (sense repetir «Mercat»)', () => {
    const producte = fitxa('mercat', 'm1', 'disponible', { preu: '12 €', categoria: 'Oli' }, { type: 'product', price: '12 €', tag: 'Oli', category_slug: 'oli', variations: [{ id: 'a' }, { id: 'b' }] });
    const article = pinta(producte);
    expect(overlay(article)).toBe('/mercat/m1');
    expect(deSempre(producte)[0]).toEqual(['Mercat', 'sdp-badge-system']);
    expect(etiquetes(article)).toEqual([['Mercat', 'sdp-badge-system'], ['Disponible', 'sdp-insignia sdp-insignia--exit'], ...deSempre(producte).slice(1)]);
    expect(etiquetes(article).slice(2)).toEqual([['2 variants', 'sdp-badge-accent'], ['oli', 'sdp-badge-category'], ['Oli', 'sdp-badge-tag']]);
    expect(subtitol(article)).toBe('12 € · Oli');
  });

  /* Correcció L3-A6 · Un `labels` hostil (text, objecte) en una fitxa d'àmbit
     no trenca la targeta ni s'escampa en lletres: només les dues del contracte. */
  test('un «labels» que no és cap llista en una fitxa: només l’àmbit i l’estat', () => {
    for (const labels of ['abc', { slice: 1 }, 42, true]) {
      const article = pinta({ ...VIATGE, labels });
      expect([labels, etiquetes(article)]).toEqual([labels, [['Compartir cotxe', 'sdp-badge-system'], ['Disponible', 'sdp-insignia sdp-insignia--exit']]]);
      cleanup();
    }
  });
});

describe('Llei del Píxel: un element sense àmbit es pinta com abans', () => {
  test('una publicació de sempre: cap insígnia, l’etiqueta de sempre (el seu type), /mur/<id> i el seu subtítol', () => {
    const article = pinta(POST);
    expect(overlay(article)).toBe('/mur/p1');
    expect(etiquetes(article)).toEqual(deSempre(POST));
    expect(etiquetes(article)).toEqual([['feed', 'sdp-badge-category']]);
    expect(article.querySelector('.sdp-insignia')).toBeNull();
    expect(subtitol(article)).toBe('Diumenge');
  });

  test('el mateix HTML amb i sense les claus de l’àmbit a «mur»: la maquinària és inerta per al Mur de sempre', () => {
    const sense = render(<TargetaDelMur item={POST} />).container.innerHTML;
    cleanup();
    const amb = render(<TargetaDelMur item={{ ...POST, ambit: 'mur', estat: 'disponible', dades: {} }} />).container.innerHTML;
    expect(amb).toBe(sense);
  });

  test('un producte de llegat (type product, sense ambit) i les seues etiquetes de sempre, a /mercat/<id>', () => {
    const samarreta = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    const article = pinta(samarreta);
    expect(overlay(article)).toBe('/mercat/samarreta-socdepoble');
    expect(etiquetes(article)).toEqual(deSempre(samarreta));
    expect(article.querySelector('.sdp-insignia')).toBeNull();
  });

  test('les etiquetes del payload (labels) manen, com abans, també per a una fitxa', () => {
    const propies = [{ text: 'Fira', className: 'sdp-badge-tag' }];
    expect(etiquetes(pinta({ ...POST, labels: propies }))).toEqual([['Fira', 'sdp-badge-tag']]);
    cleanup();
    expect(etiquetes(pinta({ ...VIATGE, labels: propies }))).toEqual([['Compartir cotxe', 'sdp-badge-system'], ['Disponible', 'sdp-insignia sdp-insignia--exit'], ['Fira', 'sdp-badge-tag']]);
  });

  /* Correcció L3-A4 · El HTML d'un element sense àmbit, fixat lletra a lletra
     (capturat el 261102 amb la TZ de vitest, Europe/Madrid, vite.config.js):
     qualsevol píxel nou a la targeta de sempre mossega ací, no només la
     maquinària de l'àmbit. Si el Mestre ordena un redisseny de la targeta,
     esta és la prova que s'actualitza amb ell. */
  test('el HTML d’una publicació de sempre, lletra a lletra', () => {
    expect(render(<TargetaDelMur item={POST} />).container.innerHTML).toBe(HTML_DE_SEMPRE.publicacio);
  });

  test('el HTML del producte de llegat «samarreta-socdepoble», lletra a lletra', () => {
    const samarreta = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    expect(render(<TargetaDelMur item={samarreta} />).container.innerHTML).toBe(HTML_DE_SEMPRE.samarreta);
  });
});

/* Les icones del peu (Traduir, Comentar, Compartir), iguals a les dues targetes. */
const PEU = (titol) => `<footer class="sp-card-footer"><div class="sp-card-actions"><button type="button" class="sp-card-action" aria-label="Traduir ${titol}" title="Traduir ${titol}"><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg></button><button type="button" class="sp-card-action" aria-label="Comentar ${titol}" title="Comentar ${titol}" aria-haspopup="menu" aria-expanded="false"><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg></button><button type="button" class="sp-card-action" aria-label="Compartir ${titol}" title="Compartir ${titol}"><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg></button></div><button type="button" class="btn-connectar sp-card-connect" aria-label="Connectar amb ${titol}" title="Connectar amb ${titol}"><span class="sp-card-connect-text">Connectar</span><span class="sp-card-connect-plus" aria-hidden="true">+</span></button></footer>`;
const DRETS = '<p class="sp-card-copyright"><a href="/page/drets-autor" class="sp-card-copyright__enllac">CC BY-NC-SA 4.0 Sóc de Poble / Fet per la IAIA i Nano Banana</a></p>';
const HTML_DE_SEMPRE = {
  publicacio: '<article class="sp-card"><header class="sp-card-header"><span class="sp-card-author-block"><span class="sp-card-author"><img alt="" class="sp-card-avatar" src="/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png" width="48" height="48" referrerpolicy="no-referrer"><span class="sp-card-author-info"><span class="sp-card-author-name">Maria</span><span class="sp-card-author-location">La Torre de les Maçanes</span></span></span></span><div class="sp-card-meta"><button type="button" class="btn-date-time" aria-label="11:00 02/11/26 · Obri el calendari d’eixe mes" title="11:00 02/11/26 · Obri el calendari d’eixe mes"><span>11:00</span><span>02/11/26</span></button></div></header><a href="/mur/p1" class="sp-card-link-overlay" aria-label="La fira"></a><div class="sp-card-body"><h3 class="sp-card-title">La fira</h3><h4 class="sp-card-subtitle">Diumenge</h4><div class="sp-card-text"><p class="sp-card-text">Entradeta</p></div><ul class="sp-card-labels" aria-label="Categories"><li class="sp-card-label sdp-badge-category">feed</li></ul>'
    + `${DRETS}</div>${PEU('La fira')}</article>`,
  samarreta: '<article class="sp-card"><header class="sp-card-header"><a href="/empresa/socdepoble" class="sp-card-author-link"><span class="sp-card-author"><img alt="" class="sp-card-avatar" src="/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png" width="48" height="48" referrerpolicy="no-referrer"><span class="sp-card-author-info"><span class="sp-card-author-name">Sóc de Poble</span><span class="sp-card-author-location">La Torre de les Maçanes</span></span></span></a><div class="sp-card-meta"><button type="button" class="btn-date-time" aria-label="14:33 15/08/26 · Obri el calendari d’eixe mes" title="14:33 15/08/26 · Obri el calendari d’eixe mes"><span>14:33</span><span>15/08/26</span></button></div></header><a href="/mercat/samarreta-socdepoble" class="sp-card-link-overlay" aria-label="Samarreta Sóc de Poble"></a><div class="sp-card-media-container"><img class="sp-card-media" src="/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png" alt="Samarreta Sóc de Poble" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div><div class="sp-card-body has-price has-calendar-badge has-aside"><div class="sp-card-calendar-badge" aria-label="Preu: 15.00€"><span class="sp-card-calendar-badge__dia" data-oversized="true" data-mida="menuda">15.00€</span></div><h3 class="sp-card-title">Samarreta Sóc de Poble</h3><h4 class="sp-card-subtitle">L\'edició definitiva amb el logotip complet</h4><div class="sp-card-text"><p class="sp-card-text">Mapa del tresor sobre cotó resistent. La imatge complementa el text, no el substituïx.</p></div><ul class="sp-card-labels" aria-label="Categories"><li class="sp-card-label sdp-badge-system">Mercat</li><li class="sp-card-label sdp-badge-accent">2 variants</li><li class="sp-card-label sdp-badge-category">roba</li><li class="sp-card-label sdp-badge-tag">samarreta</li></ul>'
    + `${DRETS}</div>${PEU('Samarreta Sóc de Poble')}</article>`
};
