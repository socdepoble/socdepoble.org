/**
 * Ordre del Mestre (261007) · Les targetes incrustades al cos d'una pàgina de
 * text: el MATEIX camí de lectura que les notes (renderRichText de
 * detailRichText.jsx: segmentsAmbTargetes i CosAmbTargetes), amb la classe
 * de sempre de la pàgina, «cms-preview».
 *
 *  · «Legal i privacitat»: davall de l'H4 «4. Propietat intel·lectual i
 *    industrial», la targeta de «Drets d'autor» (UniversalCard de
 *    /page/drets-autor), sola i alineada a la dreta; el text de l'apartat 4
 *    ve just després, en el mateix article, i l'envolta.
 *  · Una pàgina SENSE targetes: byte a byte el camí de sempre (Llei del
 *    Píxel), un sol <article class="cms-preview"> amb l'HTML sanejat.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
/* El patró de detailRichText.test.jsx: Link com un <a> que conserva `to`. */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
/* La pàgina, reduïda als seus fills: el cos és el que es prova ací. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => React.createElement('div', { 'data-pagina': '' }, children)
}));
import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';
import { MARCA_GRUP } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
import { sanitizeHtml } from '../../utils/sanitize';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const cosDe = (container) => container.querySelector('[data-pagina] > article');

describe('«Legal i privacitat»: la targeta de «Drets d’autor» incrustada a l’apartat 4', () => {
  const pinta = () => cosDe(render(<TextSection page={PAGE_COPY.legal} pageKey="legal" />).container);

  test('l’article de lectura amb targetes conserva «cms-preview» i porta el cos amb targetes', () => {
    const article = pinta();
    expect(article.className).toBe('cms-preview sdp-amb-targetes');
    expect([...article.children].map((fill) => fill.className)).toEqual(['sdp-cos-tros', 'sdp-targetes', 'sdp-cos-tros']);
  });

  test('una targeta sola, a la dreta: la regla de la flotant la fa flotar i el cos la conté', () => {
    const grup = pinta().querySelector('.sdp-targetes');
    expect(grup.getAttribute('data-forma')).toBe('sola');
    expect(grup.getAttribute('data-alineacio')).toBe('dreta');
    expect(grup.querySelectorAll(':scope > .sdp-targeta')).toHaveLength(1);
    /* jsdom no calcula flotants: les regles escrites de modules.css (les
       fixa també qualitat.test.js del front «editor»). */
    const moduls = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
    expect(moduls).toMatch(/\.sdp-targetes\[data-forma="sola"\]\[data-alineacio="dreta"\] > \.sdp-targeta \{\s*float: right;/);
    expect(moduls).toMatch(/\.sdp-amb-targetes::after \{\s*content: '';\s*display: block;\s*clear: both;/);
    /* Gauntlet O7-9, ronda 3 (PC-07) · Fins a 40rem de pantalla, la sola ocupa tota l'amplària i cap
       columna de text no li queda al costat; però continua flotant: amb float: none el grup prenia
       alçada i el text de davall baixava 8px, també a 375px (Llei del Píxel). */
    expect(moduls).toMatch(/@media \(max-width: 40rem\) \{\s*\.sdp-targetes\[data-forma="sola"\]\[data-alineacio\] > \.sdp-targeta \{\s*inline-size: 100%;\s*margin-left: 0;\s*margin-right: 0;\s*\}\s*\}/);
    expect(moduls).not.toMatch(/\[data-forma="sola"\][^{]*> \.sdp-targeta \{[^}]*float: none/);
  });

  test('la targeta és la UniversalCard de /page/drets-autor, signada per Sóc de Poble', () => {
    const carta = pinta().querySelector('.sdp-targetes > .sdp-targeta > article.sp-card');
    expect(carta.querySelector('.sp-card-title').textContent).toBe("Drets d'autor");
    expect(carta.querySelector('.sp-card-subtitle').textContent).toBe(PAGE_COPY['drets-autor'].subtitle);
    expect(carta.querySelector('.sp-card-text').textContent).toBe(PAGE_COPY['drets-autor'].lead);
    expect(carta.querySelector('a.sp-card-link-overlay').getAttribute('to')).toBe('/page/drets-autor');
    /* Onada 8 (261009) · L'HTML desat (legalContent.js) porta
       data-autor-ruta="/projecte": es llig com el pilot i la boina porta al
       perfil de Sóc de Poble, mai a /projecte. */
    const boina = carta.querySelector('.sp-card-header a.sp-card-author-link');
    expect(boina.getAttribute('to')).toBe(DEFAULT_AUTHOR.href);
    expect(boina.textContent).toContain('Sóc de Poble');
  });

  test('just davall de l’H4 de l’apartat 4, i el text de l’apartat 4 l’envolta (ve just després)', () => {
    const article = pinta();
    const [abans, , despres] = article.children;
    expect(abans.lastElementChild.tagName).toBe('H4');
    expect(abans.lastElementChild.textContent).toBe('4. Propietat intel·lectual i industrial');
    expect(despres.firstElementChild.tagName).toBe('P');
    expect(despres.firstElementChild.textContent).toMatch(/^La infraestructura tecnològica de Sóc de Poble/);
    expect(despres.querySelector('h4').textContent).toBe('5. Exempció de responsabilitat: el Mercat entre veïns');
  });

  test('l’enllaç antic a la llicència Creative Commons ja no hi és', () => {
    const article = pinta();
    expect(article.textContent).not.toMatch(/Veure Llicència Creative Commons/);
    expect(article.querySelector('a[href^="https://creativecommons.org"]')).toBeNull();
  });

  test('cap text del document es perd: els trossos són l’HTML sanejat sense el grup', () => {
    const article = pinta();
    const trossos = [...article.querySelectorAll(':scope > .sdp-cos-tros')].map((tros) => tros.innerHTML).join('');
    const senseGrup = document.createElement('div');
    senseGrup.innerHTML = sanitizeHtml(resolRecursosDeHtml(PAGE_COPY.legal.html));
    senseGrup.querySelector(`[${MARCA_GRUP}]`).remove();
    expect(trossos.replace(/\s+/g, ' ').trim()).toBe(senseGrup.innerHTML.replace(/\s+/g, ' ').trim());
  });
});

describe('Llei del Píxel: una pàgina sense targetes, byte a byte el camí de sempre', () => {
  const senseTargetes = Object.entries(PAGE_COPY).filter(([, pagina]) => typeof pagina?.html === 'string' && !pagina.html.includes(MARCA_GRUP));

  test('totes les pàgines del copy amb cos, menys les que porten targetes incrustades, van pel camí de sempre', () => {
    /* Gauntlet O7-9, ronda 2 (LR-G07) · El llindar de sempre: en queden 16, i el canvi no demanava baixar-lo. */
    expect(senseTargetes.length).toBeGreaterThan(10);
    expect(Object.entries(PAGE_COPY).filter(([, pagina]) => pagina?.html?.includes(MARCA_GRUP)).map(([clau]) => clau)).toEqual([
      'projecte',
      'legal',
      'anima',
      'fedivers',
      'consola',
      'cervell',
      'drets-autor',
      'fediversity',
      'node-zero',
    ]);
  });

  /* Gauntlet O7-9, ronda 2 (PC-01) · /disseny (DesignSection) i /wikidepoble (WikiDePobleSection) pinten
     la portada amb l'HTML cru, sense CosAmbTargetes: un grup hi seria un enllaç nu flotant, no una Card.
     La parella es queda amb els enllaços contextuals d'anada i tornada. Si una de les dues portades
     arriba a pintar el cos amb targetes, la prova cau i la Card hi pot tornar. */
  test('parella wikidepoble <-> disseny: enllaços contextuals d’anada i tornada, sense grup de targetes', () => {
    for (const fitxer of ['src/sections/disseny/DesignSection.jsx', 'src/sections/wiki-de-poble/WikiDePobleSection.jsx']) {
      expect([fitxer, /^import[^;]*\b(?:CosAmbTargetes|CosDeLaPagina)\b/m.test(readFileSync(resolve(process.cwd(), fitxer), 'utf8'))]).toEqual([fitxer, false]);
    }
    expect(PAGE_COPY.disseny.html).not.toContain(MARCA_GRUP);
    expect(PAGE_COPY.wikidepoble.html).not.toContain(MARCA_GRUP);
    expect(PAGE_COPY.disseny.html).toContain('<a href="/wikidepoble"><strong>regles</strong></a>');
    expect(PAGE_COPY.wikidepoble.html).toContain('<a href="/disseny"><strong>pedra seca</strong></a>');
  });

  test.each([
    ['projecte', 'pagina:anima', '/anima', 'anima', 'pagina:projecte', '/projecte'],
    ['fedivers', 'pagina:fediversity', '/page/fediversity', 'fediversity', 'pagina:fedivers', '/fedivers'],
    ['consola', 'pagina:cervell', '/page/cervell', 'cervell', 'pagina:consola', '/page/consola'],
  ])('parella germana %s <-> %s: targeta viva flotant a la dreta i enllaç contextual d’anada i tornada', (clauA, idB, rutaB, clauB, idA, rutaA) => {
    expect(PAGE_COPY[clauA].html).toContain(`data-sdp-targeta="${idB}"`);
    expect(PAGE_COPY[clauB].html).toContain(`data-sdp-targeta="${idA}"`);
    const cosA = cosDe(render(<TextSection page={PAGE_COPY[clauA]} pageKey={clauA} />).container);
    const grupA = cosA.querySelector('.sdp-targetes');
    expect([grupA?.getAttribute('data-forma'), grupA?.getAttribute('data-alineacio')]).toEqual(['sola', 'dreta']);
    expect(grupA?.querySelector('.sdp-targeta a.sp-card-link-overlay')?.getAttribute('to')).toBe(rutaB);
    expect(cosA.querySelector(`.sdp-cos-tros a[href="${rutaB}"]`)).not.toBeNull();
    cleanup();

    const cosB = cosDe(render(<TextSection page={PAGE_COPY[clauB]} pageKey={clauB} />).container);
    const grupB = cosB.querySelector('.sdp-targetes');
    expect([grupB?.getAttribute('data-forma'), grupB?.getAttribute('data-alineacio')]).toEqual(['sola', 'dreta']);
    expect(grupB?.querySelector('.sdp-targeta a.sp-card-link-overlay')?.getAttribute('to')).toBe(rutaA);
    expect(cosB.querySelector(`.sdp-cos-tros a[href="${rutaA}"]`)).not.toBeNull();
  });

  test.each(senseTargetes)('%s: el mateix <article class="cms-preview"> d’abans', (clau, pagina) => {
    const { container } = render(<TextSection page={pagina} pageKey={clau} />);
    const abans = render(<article className="cms-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(pagina.html)) }} />).container;
    expect(cosDe(container).outerHTML).toBe(abans.firstElementChild.outerHTML);
  });

  test('un text que només esmenta la marca, sense cap grup, també va pel camí de sempre', () => {
    const html = '<p>data-sdp-targetes és el nom de la marca</p>';
    const article = cosDe(render(<TextSection page={{ title: 'Marca', html }} pageKey="marca" />).container);
    expect(article.className).toBe('cms-preview');
    expect(article.innerHTML).toBe(sanitizeHtml(html));
  });
});
