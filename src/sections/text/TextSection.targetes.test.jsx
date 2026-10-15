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

  test('totes les pàgines del copy amb cos, menys «legal» i «drets-autor», van pel camí de sempre', () => {
    expect(senseTargetes.length).toBeGreaterThan(10);
    expect(Object.entries(PAGE_COPY).filter(([, pagina]) => pagina?.html?.includes(MARCA_GRUP)).map(([clau]) => clau)).toEqual(['legal', 'drets-autor']);
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
