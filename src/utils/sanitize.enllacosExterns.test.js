import { createElement } from 'react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { sanitizeHtml } from './sanitize.js';
import { destinacioSeguraDEnllac, esEnllacExtern, esRecursEstaticPropi, relEnllacExtern } from './enllacosExterns.js';
import { parseMarkdown, parseMarkdownEnLinia } from '../sections/wiki-de-poble/parseMarkdown.js';
import { extensionsRiques } from '../components/universal/richText/extensions/index.js';
import { CosTraduit } from '../components/universal/traduccio/TraduccioPagina.jsx';
import LaminesBotaniquesNode0 from '../sections/patrimoni/LaminesBotaniquesNode0.jsx';
import CroniquesFites261104 from '../sections/text/CroniquesFites261104.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function primerEnllac(html, opcions) {
  const arrel = document.createElement('div');
  arrel.innerHTML = sanitizeHtml(html, opcions);
  return arrel.querySelector('a');
}

describe('IDEA-343 · Motor universal sanitizeHtml + parseMarkdown per a enllaços externs i interns', () => {
  it.each([
    ['https://blog.google/', undefined, 'ugc nofollow noopener noreferrer'],
    ['http://zona14.org/cronica', undefined, 'ugc nofollow noopener noreferrer'],
    ['https://nlnet.nl/fediversity/', { enllacosEditorials: true }, 'noopener noreferrer'],
    ['https://comerc.example/oli', { sponsored: true }, 'ugc nofollow sponsored noopener noreferrer'],
    ['https://comerc.example/oli', { enllacosEditorials: true, sponsored: true }, 'sponsored noopener noreferrer'],
  ])('injecta sempre target="_blank" i rel segur a %s (%j) encara que l’entrada no porte target', (href, opcions, relEsperat) => {
    const a = primerEnllac(`<a href="${href}">Enllaç extern</a>`, opcions);
    expect(a.getAttribute('href')).toBe(href);
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe(relEsperat);
  });

  it('sobreescriu target="_self", target="_top" o target="_parent" perillosos en enllaços externs i força _blank', () => {
    for (const targetMalicios of ['_self', '_top', '_parent', 'finestra']) {
      const a = primerEnllac(`<a href="https://extern.example/x" target="${targetMalicios}" rel="dofollow">Fora</a>`);
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('ugc nofollow noopener noreferrer');
    }
  });

  it('converteix enllaços Markdown de la Wiki ([text](https://...)) en pestanya nova sense tocar parseMarkdown cru', () => {
    const md = 'Consulta [The Keyword](https://blog.google/innovation-and-ai/) i la nota [[interna](?item=sistema_nervios_skills_i_repositoris)].';
    const arrel = document.createElement('div');
    arrel.innerHTML = sanitizeHtml(parseMarkdown(md, { entradilla: false }), { enllacosEditorials: true });
    const enllacos = [...arrel.querySelectorAll('a')].map((a) => [
      a.getAttribute('href'),
      a.getAttribute('target'),
      a.getAttribute('rel'),
    ]);
    expect(enllacos).toEqual([
      ['https://blog.google/innovation-and-ai/', '_blank', 'noopener noreferrer'],
      ['?item=sistema_nervios_skills_i_repositoris', null, 'noopener noreferrer nofollow'],
    ]);

    const entradilla = document.createElement('p');
    entradilla.innerHTML = sanitizeHtml(parseMarkdownEnLinia('Font: [NLnet](https://nlnet.nl/) i [Mur](/mur)'), { enllacosEditorials: true });
    expect([...entradilla.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.getAttribute('target')])).toEqual([
      ['https://nlnet.nl/', '_blank'],
      ['/mur', null],
    ]);
  });

  it.each([
    '/mur',
    '/page/reconeixements',
    '/wikidepoble?item=sistema_nervios_skills_i_repositoris',
    '?item=genoma',
    '#seccio-principal',
    'docs/guia.md',
    'pagina2',
    'mailto:hola@socdepoble.org',
    'tel:+34600000000',
  ])('elimina target="_blank" (i qualsevol altre target) en rutes internes, fragments i esquemes d’acció (%s)', (href) => {
    for (const atributTarget of [' target="_blank"', ' target="_top"', '']) {
      const a = primerEnllac(`<a href="${href}"${atributTarget}>Destí propi</a>`, { enllacosEditorials: true });
      expect(a.getAttribute('href')).toBe(href);
      expect(a.hasAttribute('target')).toBe(false);
      expect(a.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    }
  });

  it('conserva target="_blank" explícit en recursos estàtics crus (/assets/, /opendata/, /.well-known/), però mai target="_top"', () => {
    for (const recurs of ['/assets/uploads/planol.webp', '/opendata/manifest.json', '/.well-known/nodeinfo']) {
      const ambBlank = primerEnllac(`<a href="${recurs}" target="_blank">Recurs</a>`, { enllacosEditorials: true });
      expect(ambBlank.getAttribute('target')).toBe('_blank');

      const senseTarget = primerEnllac(`<a href="${recurs}">Recurs</a>`, { enllacosEditorials: true });
      expect(senseTarget.hasAttribute('target')).toBe(false);

      const ambTop = primerEnllac(`<a href="${recurs}" target="_top">Recurs</a>`, { enllacosEditorials: true });
      expect(ambTop.hasAttribute('target')).toBe(false);
    }
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    '//malicios.example/pesca',
    ' //malicios.example/pesca',
  ])('neutralitza intents de bypass (%s) i neteja target i rel sobrers quan cau l’href', (hrefPerillos) => {
    const a = primerEnllac(`<a href="${hrefPerillos}" target="_blank" rel="dofollow"> Parany </a>`);
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.hasAttribute('target')).toBe(false);
    expect(a.hasAttribute('rel')).toBe(false);
  });

  it('funciona idènticament sota Capacitor iOS (capacitor://localhost) i Android (https://localhost)', () => {
    vi.stubGlobal('location', {
      origin: 'capacitor://localhost',
      protocol: 'capacitor:',
      host: 'localhost',
      hostname: 'localhost',
      href: 'capacitor://localhost/wikidepoble',
      pathname: '/wikidepoble',
      search: '',
      hash: '',
    });
    expect(esEnllacExtern('https://blog.google/')).toBe(true);
    expect(esEnllacExtern('//malicios.example/x')).toBe(true);
    expect(esEnllacExtern('/mur')).toBe(false);
    expect(esEnllacExtern('mailto:hola@socdepoble.org')).toBe(false);

    const extern = primerEnllac('<a href="https://blog.google/">Blog</a>', { enllacosEditorials: true });
    expect([extern.getAttribute('target'), extern.getAttribute('rel')]).toEqual(['_blank', 'noopener noreferrer']);

    const intern = primerEnllac('<a href="/mur" target="_blank">Mur</a>');
    expect(intern.hasAttribute('target')).toBe(false);
  });

  it('manté idempotència estricta en passades successives per sanitizeHtml i en l’Editor Universal TipTap', () => {
    const entrada = '<p><a href="https://comerc.example/" rel="sponsored">Comerç</a> i <a href="/mur" target="_blank">Mur</a></p>';
    const primera = sanitizeHtml(entrada);
    expect(sanitizeHtml(primera)).toBe(primera);
    expect(relEnllacExtern({ editorial: false, sponsored: true })).toBe('ugc nofollow sponsored noopener noreferrer');
    expect(esRecursEstaticPropi('/assets/uploads/guia.pdf')).toBe(true);
    expect(esRecursEstaticPropi('/mur')).toBe(false);
    expect(destinacioSeguraDEnllac('https://nlnet.nl/', null)).toBe('_blank');
    expect(destinacioSeguraDEnllac('/pobles', '_blank')).toBeNull();
    expect(destinacioSeguraDEnllac('/assets/uploads/guia.pdf', '_blank')).toBe('_blank');

    const element = document.createElement('div');
    const editor = new Editor({
      element,
      extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] }, underline: false }), ...extensionsRiques()],
      content: '<p><a href="/pobles" target="_blank">Pobles</a>, <a href="https://blog.google/">Google</a> i <a href="/assets/doc.pdf" target="_blank">PDF</a>.</p>',
    });
    const htmlEditor = editor.getHTML();
    editor.destroy();
    const doc = new DOMParser().parseFromString(`<body>${htmlEditor}</body>`, 'text/html').body;
    expect([...doc.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.getAttribute('target')])).toEqual([
      ['/pobles', null],
      ['https://blog.google/', '_blank'],
      ['/assets/doc.pdf', '_blank'],
    ]);
    expect(sanitizeHtml('<p><a rel="noopener noreferrer nofollow" href="/pobles">Pobles</a></p>'))
      .toBe('<p><a rel="noopener noreferrer nofollow" href="/pobles">Pobles</a></p>');
  });
});

describe('IDEA-343 · Components JSX blindats (CosTraduit, LaminesBotaniquesNode0 i CroniquesFites261104)', () => {
  it('CosTraduit força target="_blank" en qualsevol href extern encara que la marca no declarara novaFinestra', () => {
    const { container } = render(
      createElement(CosTraduit, {
        blocs: [
          {
            etiqueta: 'p',
            text: 'NLnet i Mur',
            peces: [
              { text: 'NLnet', marques: [{ id: 0, etiqueta: 'a', href: 'https://nlnet.nl/' }] },
              { text: ' i ', marques: [] },
              { text: 'Mur', marques: [{ id: 1, etiqueta: 'a', href: '/mur' }] },
            ],
          },
        ],
      }),
    );
    const enllacos = [...container.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.getAttribute('target')]);
    expect(enllacos).toEqual([
      ['https://nlnet.nl/', '_blank'],
      ['/mur', null],
    ]);
  });

  it('LaminesBotaniquesNode0 pinta els enllaços d’atribució i llicència amb target="_blank" i noopener noreferrer', () => {
    const { container } = render(
      createElement(LaminesBotaniquesNode0, {
        nom: 'Timó',
        binomi: 'Thymus vulgaris',
        lamina: {
          morfologiaDoctoralCa: ' Subarbust aromàtic mediterrani.',
          variants: [
            {
              variant: 'flor',
              src: '/assets/patrimoni/timo.webp',
              width: 800,
              height: 600,
              etiqueta: 'Detall floral',
              tipusImatge: 'recreacio-auditada',
              urlOrigen: 'https://commons.wikimedia.org/wiki/File:Thymus.jpg',
              titolImatge: 'Wikimedia Commons',
              autor: 'Botànic',
              llicenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
              llicencia: 'CC BY-SA 4.0',
            },
          ],
        },
      }),
    );
    const enllacos = [...container.querySelectorAll('figcaption a')];
    expect(enllacos).toHaveLength(2);
    for (const a of enllacos) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('CroniquesFites261104 posa target="_blank" quan l’origen és extern i el retira al mateix origen', () => {
    const foraOrigen = render(createElement(CroniquesFites261104));
    const enllacosFora = [...foraOrigen.container.querySelectorAll('article a')];
    expect(enllacosFora.length).toBeGreaterThan(0);
    for (const a of enllacosFora) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    }
    foraOrigen.unmount();

    vi.stubGlobal('location', {
      origin: 'https://socdepoble.org',
      protocol: 'https:',
      host: 'socdepoble.org',
      hostname: 'socdepoble.org',
      href: 'https://socdepoble.org/versions',
      pathname: '/versions',
      search: '',
      hash: '',
    });
    const mateixOrigen = render(createElement(CroniquesFites261104));
    const enllacPropi = mateixOrigen.container.querySelector('a[href="https://socdepoble.org/mur"]');
    expect(enllacPropi.hasAttribute('target')).toBe(false);
    expect(enllacPropi.hasAttribute('rel')).toBe(false);
  });
});
