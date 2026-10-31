import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import {
  MAX_BLOCS, MAX_HTML, blocsTraduibles, hrefSegur, htmlDePeces, pecesDeHtml, preparaTraduccio
} from './blocsTraduibles.js';
import { CosTraduit } from './TraduccioPagina.jsx';
import { sanitizeHtml } from '../../../utils/sanitize.js';

/* Traductor Sobirà (ordre del Mestre, 260930 · via B) · Es traduïx text, mai
   HTML: els blocs de lectura de l'article, el més extern de cada niu, sense
   controls ni el que no es veu. */
afterEach(() => { cleanup(); document.body.replaceChildren(); });

const arrelAmb = (...fills) => {
  const arrel = document.createElement('article');
  arrel.append(...fills);
  document.body.append(arrel);
  return arrel;
};
const el = (etiqueta, text, atributs = {}) => {
  const node = document.createElement(etiqueta);
  if (text) node.textContent = text;
  for (const [nom, valor] of Object.entries(atributs)) node.setAttribute(nom, valor);
  return node;
};

test('títols, paràgrafs i llistes, en ordre; l’h1 del cos baixa a h2; espais col·lapsats', () => {
  const llista = el('ul');
  llista.append(el('li', 'Música'), el('li', 'Ball'));
  const arrel = arrelAmb(el('h1', 'Títol'), el('h3', 'Divendres'), el('p', '  Sopar   a la\n plaça. '), llista, el('blockquote', 'Cita'));
  expect(blocsTraduibles(arrel)).toEqual([
    { etiqueta: 'h2', text: 'Títol' },
    { etiqueta: 'h3', text: 'Divendres' },
    { etiqueta: 'p', text: 'Sopar a la plaça.' },
    { etiqueta: 'li', text: 'Música', llista: { tipus: 'ul', id: 0 } },
    { etiqueta: 'li', text: 'Ball', llista: { tipus: 'ul', id: 0 } },
    { etiqueta: 'blockquote', text: 'Cita' },
  ]);
});

/* C5 (Codex 261030) · Els dos paràgrafs no s'ajunten: «Primer Segon», no
   «PrimerSegon» (el motor rebia una paraula que no existix). */
test('només el bloc més extern: un <li> amb un <p> dins és un sol bloc (amb un espai entre els paràgrafs)', () => {
  const li = el('li');
  li.append(el('p', 'Primer'), el('p', 'Segon'));
  const ul = el('ul');
  ul.append(li);
  expect(blocsTraduibles(arrelAmb(ul))).toEqual([{ etiqueta: 'li', text: 'Primer Segon', llista: { tipus: 'ul', id: 0 } }]);
});

test('fora: botons, lectors de pantalla, amagats, aria-hidden i editables', () => {
  const boto = el('button');
  boto.append(el('p', 'Dins del botó'));
  const arrel = arrelAmb(
    boto,
    el('p', 'Lector', { class: 'sr-only' }),
    el('p', 'Amagat', { hidden: '' }),
    el('p', 'Decoratiu', { 'aria-hidden': 'true' }),
    el('p', 'Editable', { contenteditable: 'true' }),
    el('p', 'Es veu'),
    el('p', '   '),
  );
  expect(blocsTraduibles(arrel)).toEqual([{ etiqueta: 'p', text: 'Es veu' }]);
});

/* Correcció final del torn 260930 (avís de Codex en plegar) · El filtre
   mirava el bloc i els seus avantpassats, però el text es prenia amb
   textContent, que arrossega TOTS els descendents: un fill ocult o editable
   dins d'un bloc visible s'enviava a traduir. I l'ocultació per CSS no es
   mirava mai. */
test('dins d’un bloc visible, els fills ocults, de lector, controls i editables no es tradueixen', () => {
  const p = el('p', 'Visible');
  p.append(
    el('span', ' ocult', { hidden: '' }),
    el('span', ' lector', { class: 'sdp-nomes-lector' }),
    el('span', ' decoratiu', { 'aria-hidden': 'true' }),
    el('button', ' botó'),
    el('span', ' editable', { contenteditable: 'true' }),
    el('span', ' ·', {}),
  );
  const li = el('li', 'Element');
  li.append(el('span', ' sense display', { style: 'display: none' }));
  const ul = el('ul');
  ul.append(li);
  expect(blocsTraduibles(arrelAmb(p, ul))).toEqual([
    { etiqueta: 'p', text: 'Visible ·' },
    { etiqueta: 'li', text: 'Element', llista: { tipus: 'ul', id: 0 } },
  ]);
});

test('l’ocultació per CSS: display:none i visibility:hidden, en el bloc, en un avantpassat o en un fill', () => {
  const estil = document.createElement('style');
  estil.textContent = '.amagat-per-classe { display: none; } .invisible-per-classe { visibility: hidden; }';
  document.head.append(estil);
  try {
    const contenidor = el('div', null, { style: 'display: none' });
    contenidor.append(el('p', 'Dins d’un avantpassat sense display'));
    const invisible = el('div', null, { style: 'visibility: hidden' });
    invisible.append(el('p', 'Invisible'));
    const tornaVisible = el('div', null, { style: 'visibility: hidden' });
    /* Un fill visibility:visible dins d'un pare visibility:hidden SÍ que es
       veu (visibility s'hereta però es pot tornar a encendre). */
    tornaVisible.append(el('p', 'Torna a vore’s', { style: 'visibility: visible' }));
    const mixt = el('p', 'Es veu');
    mixt.append(el('span', ' no es veu', { class: 'invisible-per-classe' }));
    const arrel = arrelAmb(
      el('p', 'Per classe', { class: 'amagat-per-classe' }),
      el('p', 'Per estil', { style: 'display: none' }),
      contenidor,
      invisible,
      tornaVisible,
      mixt,
    );
    expect(blocsTraduibles(arrel)).toEqual([
      { etiqueta: 'p', text: 'Torna a vore’s' },
      { etiqueta: 'p', text: 'Es veu' },
    ]);
  } finally {
    estil.remove();
  }
});

test('tot el que és editable: contenteditable buit, «true», «plaintext-only» i els seus descendents', () => {
  const editor = el('div', null, { contenteditable: '' });
  editor.append(el('p', 'Dins de l’editor'));
  const illa = el('div', null, { contenteditable: 'true' });
  /* Una illa no editable dins d'un editor continua sent part de l'editor. */
  illa.append(el('p', 'Illa', { contenteditable: 'false' }));
  const arrel = arrelAmb(
    editor,
    illa,
    el('p', 'Text pla editable', { contenteditable: 'plaintext-only' }),
    el('p', 'No editable', { contenteditable: 'false' }),
  );
  expect(blocsTraduibles(arrel)).toEqual([{ etiqueta: 'p', text: 'No editable' }]);
});

test('l’article original amagat (hidden) continua sent la font', () => {
  const arrel = arrelAmb(el('p', 'Original'));
  arrel.hidden = true;
  expect(blocsTraduibles(arrel)).toEqual([{ etiqueta: 'p', text: 'Original' }]);
});

/* Mentre es veu la traducció, l'article original està amagat també per CSS
   (display: none o visibility: hidden des de fora): continua sent la font,
   i el que hi ha amagat DINS continua fora. */
test('l’arrel amagada per CSS continua sent la font; el que hi ha amagat dins, no', () => {
  const p = el('p', 'Original');
  p.append(el('span', ' intern', { style: 'display: none' }));
  const arrel = arrelAmb(p);
  arrel.style.display = 'none';
  expect(blocsTraduibles(arrel)).toEqual([{ etiqueta: 'p', text: 'Original' }]);
  arrel.style.display = '';
  arrel.style.visibility = 'hidden';
  expect(blocsTraduibles(arrel)).toEqual([{ etiqueta: 'p', text: 'Original' }]);
});

test('sense arrel, cap bloc; amb massa blocs, el sostre', () => {
  expect(blocsTraduibles(null)).toEqual([]);
  const arrel = arrelAmb(...Array.from({ length: MAX_BLOCS + 5 }, (_, i) => el('p', `p${i}`)));
  expect(blocsTraduibles(arrel)).toHaveLength(MAX_BLOCS);
});

/* ── C4 (Codex 261030) i decisió del Mestre (261030 §3): l'estructura ───── */

/* L'article d'una cadena (fixa, de la prova), sense innerHTML: DOMParser. */
const arrelHtml = (html) => {
  const arrel = document.createElement('article');
  arrel.append(...new DOMParser().parseFromString(html, 'text/html').body.childNodes);
  document.body.append(arrel);
  return arrel;
};

test('llistes: cada <li> diu si és d’una <ol> (amb el seu start) o d’una <ul>, i de quina', () => {
  const blocs = blocsTraduibles(arrelHtml('<ol start="3"><li>U</li><li>Dos</li></ol><ul><li>A</li></ul><ul><li>B</li></ul><ol><li>Z</li></ol>'));
  expect(blocs.map(({ text, llista }) => [text, llista])).toEqual([
    ['U', { tipus: 'ol', id: 0, inici: 3 }], ['Dos', { tipus: 'ol', id: 0, inici: 3 }],
    ['A', { tipus: 'ul', id: 1 }], ['B', { tipus: 'ul', id: 2 }], ['Z', { tipus: 'ol', id: 3 }],
  ]);
});

test('peces: enllaços (href de l’original, només segurs), negretes, cursives i codi; el text ajuntat és el del bloc', () => {
  const [bloc] = blocsTraduibles(arrelHtml(
    '<p>  Visita el <a href="/mur">Mur   del poble</a> i llig <strong>totes</strong> les <em>notícies</em> de <code>sdp-xat-v1</code>. </p>'
  ));
  expect(bloc.text).toBe('Visita el Mur del poble i llig totes les notícies de sdp-xat-v1.');
  expect(bloc.peces.map(({ text, marques }) => [text, marques.map((marca) => marca.etiqueta)])).toEqual([
    ['Visita el ', []], ['Mur del poble', ['a']], [' i llig ', []], ['totes', ['strong']], [' les ', []],
    ['notícies', ['em']], [' de ', []], ['sdp-xat-v1', ['code']], ['.', []],
  ]);
  expect(bloc.peces[1].marques[0]).toEqual({ id: 0, etiqueta: 'a', href: '/mur' });
  expect(bloc.peces.map(({ text }) => text).join('')).toBe(bloc.text);
  const sense = blocsTraduibles(arrelHtml('<p>Res de marques</p>'));
  expect(sense).toEqual([{ etiqueta: 'p', text: 'Res de marques' }]);
});

test('hrefSegur: camins de l’app, consultes, fragments i https; mai javascript:, //host, /\\host, http: ni control', () => {
  for (const bo of ['/mur', '/page/consola?x=1#a', '?item=2', '#seccio', 'https://gentdelatorre.net', 'https://nlnet.nl/fediversity/']) {
    expect(hrefSegur(bo)).toBe(bo);
  }
  for (const dolent of ['javascript:alert(1)', '//dolent.example', '/\\dolent.example', 'http://socdepoble.org', 'mailto:a@b.c',
    'https://u:p@host.example', '/\n/dolent.example', ' /mur x', '', null, 'data:text/html,x']) {
    expect([dolent, hrefSegur(dolent)]).toEqual([dolent, null]);
  }
  const [bloc] = blocsTraduibles(arrelHtml('<p><a href="javascript:alert(1)">perill</a> i <a href="https://nlnet.nl" target="_blank">NLnet</a></p>'));
  expect(bloc.peces.map(({ text, marques }) => [text, marques])).toEqual([
    ['perill i ', []], ['NLnet', [{ id: 1, etiqueta: 'a', href: 'https://nlnet.nl', novaFinestra: true }]],
  ]);
});

test('htmlDePeces: HTML LOCAL sense cap atribut de l’original (només data-sdp), escapat, i el codi buit', () => {
  const [bloc] = blocsTraduibles(arrelHtml(
    '<p>Bon <strong class="x" onclick="y()">dia</strong> &amp; <a href="/mur" title="t"><em>Mur</em> nou</a> amb <code>a&lt;b</code>.</p>'
  ));
  expect(htmlDePeces(bloc.peces)).toBe(
    'Bon <strong data-sdp="0">dia</strong> &amp; <a data-sdp="1"><em data-sdp="2">Mur</em> nou</a> amb <code data-sdp="3"></code>.'
  );
});

/* Respostes REALS de beta.apertium.org (261030, format=html, frase inventada)
   a l'HTML local exacte. Apertium trau «dia» de l'etiqueta quan traduïx la
   locució «Bon dia» (queda <strong></strong>), però no el perd. */
const LOCAL_REAL = '<p>Bon <strong>dia</strong> a tothom. Visita el <a href="/mur">Mur del poble</a>, llig el fitxer <code>sdp-xat-v1</code> de Sóc de Poble i <em>totes</em> les notícies &amp; avisos.</p>';
const REAL_SPA = 'Buen día <strong data-sdp="0"></strong> a todo el mundo. Visita el <a data-sdp="1">Mur del pueblo</a>, lee el fichero <code data-sdp="2"></code> de ZSDPAZ y <em data-sdp="3">todas</em> las noticias &amp; avisos.';
const REAL_ENG = 'Good morning <strong data-sdp="0"></strong> at everybody. It Visits the <a data-sdp="1">Mur of the people</a>, reads the file <code data-sdp="2"></code> of ZSDPAZ and <em data-sdp="3">all</em> the news &amp; notices.';

test('pecesDeHtml amb respostes reals d’Apertium: el href i el codi de l’original, cap paraula perduda, entitats desfetes', () => {
  const [bloc] = blocsTraduibles(arrelHtml(LOCAL_REAL));
  expect(htmlDePeces(bloc.peces)).toBe('Bon <strong data-sdp="0">dia</strong> a tothom. Visita el <a data-sdp="1">Mur del poble</a>, llig el fitxer <code data-sdp="2"></code> de Sóc de Poble i <em data-sdp="3">totes</em> les notícies &amp; avisos.');
  const spa = pecesDeHtml(REAL_SPA, bloc.peces);
  expect(spa.map(({ text }) => text).join('')).toBe('Buen día a todo el mundo. Visita el Mur del pueblo, lee el fichero sdp-xat-v1 de ZSDPAZ y todas las noticias & avisos.');
  expect(spa.find(({ text }) => text === 'Mur del pueblo').marques).toEqual([{ id: 1, etiqueta: 'a', href: '/mur' }]);
  expect(spa.find(({ text }) => text === 'sdp-xat-v1').marques.map((marca) => marca.etiqueta)).toEqual(['code']);
  expect(spa.find(({ text }) => text === 'todas').marques.map((marca) => marca.etiqueta)).toEqual(['em']);
  const eng = pecesDeHtml(REAL_ENG, bloc.peces);
  expect(eng.map(({ text }) => text).join('')).toContain('Good morning at everybody.');
  expect(eng.find(({ text }) => text === 'Mur of the people').marques[0].href).toBe('/mur');
});

test('pecesDeHtml amb una resposta hostil: cap atribut, etiqueta ni marca desconeguda passa; el text es queda com a text', () => {
  const [bloc] = blocsTraduibles(arrelHtml('<p>Visita el <a href="/mur">Mur</a> i <strong>llig</strong>.</p>'));
  /* Amb les dos marques de l'original, una vegada cada una: les etiquetes
     sense data-sdp no fan res, i cap atribut del proveïdor passa. */
  const hostil = '<img src=x onerror="alert(1)">Visit the <a data-sdp="0" href="javascript:alert(1)" onclick="x()">Mur</a>'
    + '<script>alert(2)</script> and <strong data-sdp="1" class="x">read</strong>!';
  const peces = pecesDeHtml(hostil, bloc.peces);
  expect(peces.map(({ text }) => text).join('')).toBe('Visit the Muralert(2) and read!');
  const ambMarca = peces.filter(({ marques }) => marques.length);
  expect(ambMarca.map(({ text, marques }) => [text, marques])).toEqual([
    ['Mur', [{ id: 0, etiqueta: 'a', href: '/mur' }]], ['read', [{ id: 1, etiqueta: 'strong' }]],
  ]);
  /* C4 (Codex 261030) · Un índex que no s'ha enviat (9), una marca amb una
     altra etiqueta (<em> per a la 1) o repetida: el bloc es queda en l'original. */
  const alterades = [
    `${hostil} <a data-sdp="9" href="https://dolent.example">and</a>`,
    hostil.replace('<strong data-sdp="1" class="x">read</strong>', '<em data-sdp="1">read</em>'),
    `${hostil}<strong data-sdp="1">!</strong>`,
    `${hostil}<a data-sdp="0">x</a>`,
  ];
  expect(alterades.map((html) => pecesDeHtml(html, bloc.peces))).toEqual([null, null, null, null]);
});

/* C4 (Codex 261030) · Les marques que es perden o tornen amb cometes simples. */
test('pecesDeHtml: data-sdp amb cometes simples o sense val; una marca que falta deixa el bloc en l’original (cap enllaç sense href)', () => {
  const [bloc] = blocsTraduibles(arrelHtml('<p>Visita el <a href="/mur">Mur</a> i <strong>llig</strong>.</p>'));
  for (const html of [
    "Visit the <a data-sdp='0'>Wall</a> and <strong data-sdp='1'>read</strong>.",
    'Visit the <a data-sdp=0>Wall</a> and <strong DATA-SDP = 1>read</strong>.',
  ]) {
    const peces = pecesDeHtml(html, bloc.peces);
    expect([html, peces.map(({ text }) => text).join(''), peces.find(({ text }) => text === 'Wall')?.marques]).toEqual(
      [html, 'Visit the Wall and read.', [{ id: 0, etiqueta: 'a', href: '/mur' }]]
    );
  }
  // L'enllaç (o la negreta) que el motor perd: null, mai un «Wall» sense el seu href.
  expect(pecesDeHtml('Visit the Wall and <strong data-sdp="1">read</strong>.', bloc.peces)).toBeNull();
  expect(pecesDeHtml('Visit the <a data-sdp="0">Wall</a> and read.', bloc.peces)).toBeNull();
  expect(pecesDeHtml('Visit the <a data-sdp="x">Wall</a> and <strong data-sdp="1">read</strong>.', bloc.peces)).toBeNull();
});

/* C4 i MITJÀ-03 (Codex i Gemini 261030) · El codi de l'original una sola
   vegada: el que el motor torna dins de l'etiqueta no compta. */
test('pecesDeHtml: el codi de l’original una sola vegada (mai «LICENSELICENSE»); un codi sense tancar, null', () => {
  const [bloc] = blocsTraduibles(arrelHtml('<p>El fitxer <code>LICENSE</code> diu AGPL.</p>'));
  const text = (html) => pecesDeHtml(html, bloc.peces)?.map(({ text: t }) => t).join('') ?? null;
  expect(text('The file <code data-sdp="0">LICENSE</code> says AGPL.')).toBe('The file LICENSE says AGPL.');
  expect(text('The file <code data-sdp="0">LICENCIA <b>x</b><br>y</code> says AGPL.')).toBe('The file LICENSE says AGPL.');
  expect(pecesDeHtml('The file <code data-sdp="0">LICENSE</code> says AGPL.', bloc.peces).find(({ text: t }) => t === 'LICENSE').marques)
    .toEqual([{ id: 0, etiqueta: 'code' }]);
  expect(text('The file <code data-sdp="0"> says AGPL.')).toBeNull();
  // Un enllaç dins del codi torna amb ell, de l'original, i no pot aparéixer fora.
  const [ambEnllac] = blocsTraduibles(arrelHtml('<p>Mira <code><a href="/llicencia">LICENSE</a></code> ara.</p>'));
  const peces = pecesDeHtml('Look <code data-sdp="0"><a data-sdp="1">LICENCIA</a></code> now.', ambEnllac.peces);
  expect(peces.map(({ text: t, marques }) => [t, marques.map((marca) => marca.href ?? marca.etiqueta)])).toEqual([
    ['Look ', []], ['LICENSE', ['code', '/llicencia']], [' now.', []],
  ]);
  expect(pecesDeHtml('Look <code data-sdp="0"></code> <a data-sdp="1">now</a>.', ambEnllac.peces)).toBeNull();
});

test('pecesDeHtml: si el motor perd l’etiqueta del codi, null (el bloc es queda en l’original)', () => {
  const [bloc] = blocsTraduibles(arrelHtml('<p>El fitxer <code>LICENSE</code> diu AGPL.</p>'));
  expect(pecesDeHtml('The file says AGPL.', bloc.peces)).toBeNull();
  expect(pecesDeHtml(42, bloc.peces)).toBeNull();
  expect(pecesDeHtml('The file <code data-sdp="0"></code> says AGPL.', bloc.peces).map(({ text }) => text).join('')).toBe('The file LICENSE says AGPL.');
});

test('preparaTraduccio amb HTML (Apertium, servidor): text pla per als blocs sense marques, HTML local per als altres, i munta', () => {
  const blocs = blocsTraduibles(arrelHtml('<h3>Títol</h3><p>Visita el <a href="/mur">Mur</a> ara.</p><ol><li><a href="/xat">Xat</a></li></ol>'));
  const { textos, munta } = preparaTraduccio(blocs, { html: true });
  expect(textos).toEqual(['Títol', { text: 'Visita el <a data-sdp="0">Mur</a> ara.', format: 'html' }, { text: '<a data-sdp="0">Xat</a>', format: 'html' }]);
  const traduits = munta(['Title', 'Visit the <a data-sdp="0">Wall</a> now.', '<a data-sdp="0">Chat</a>']);
  expect(traduits.map(({ text }) => text)).toEqual(['Title', 'Visit the Wall now.', 'Chat']);
  expect(traduits[1].peces[1]).toEqual({ text: 'Wall', marques: [{ id: 0, etiqueta: 'a', href: '/mur' }] });
  expect(traduits[2].llista).toEqual({ tipus: 'ol', id: 0 });
  // Una traducció que falta deixa el bloc en l'original (marcat, cicle 2: porta el lang de l'original).
  expect(munta(['', '', ''])[1]).toEqual({ ...blocs[1], original: true });
  // Un bloc HTML massa llarg va per segments.
  const llarg = blocsTraduibles(arrelHtml(`<p>${'paraula '.repeat(MAX_HTML / 8)}<a href="/mur">Mur</a></p>`));
  expect(preparaTraduccio(llarg, { html: true }).textos.every((text) => typeof text === 'string')).toBe(true);
});

/* Mesura en viu (261030): /page/fediversity, 8783 caràcters de text, passava
   dels 10000 del pressupost amb les etiquetes i deixava de traduir-se. */
test('preparaTraduccio amb `maxim`: els blocs van en HTML mentre les etiquetes hi caben; la resta, per segments', () => {
  const blocs = blocsTraduibles(arrelHtml(Array.from({ length: 40 }, (_, i) => `<p>Bloc ${i} amb <a href="/mur">el Mur</a> i <strong>força</strong> text.</p>`).join('')));
  const mida = (textos) => textos.reduce((suma, t) => suma + (typeof t === 'string' ? t : t.text).length, 0);
  const formats = (textos) => textos.map((t) => (typeof t === 'string' ? 't' : 'h')).join('');
  const html = mida(preparaTraduccio(blocs, { html: true }).textos);
  const text = mida(preparaTraduccio(blocs, { html: false }).textos);
  expect(html).toBeGreaterThan(text);
  expect(formats(preparaTraduccio(blocs, { html: true, maxim: html }).textos)).toBe('h'.repeat(40));
  // Un caràcter menys: només l'últim bloc passa a segments (3 textos: abans, l'enllaç i després).
  const justa = preparaTraduccio(blocs, { html: true, maxim: html - 1 });
  expect(formats(justa.textos)).toBe(`${'h'.repeat(39)}ttt`);
  expect(mida(justa.textos)).toBeLessThanOrEqual(html - 1);
  // Amb el pressupost del text, cap etiqueta; els enllaços es conserven igual.
  const pobra = preparaTraduccio(blocs, { html: true, maxim: text });
  expect(pobra.textos.every((t) => typeof t === 'string')).toBe(true);
  expect(mida(pobra.textos)).toBe(text);
  expect(pobra.munta(pobra.textos)[0].peces.find(({ marques }) => marques.length).marques[0].href).toBe('/mur');
});

test('preparaTraduccio sense HTML (MyMemory): partit pels enllaços; les negretes no partixen; el codi no s’envia', () => {
  const blocs = blocsTraduibles(arrelHtml('<p>Bon <strong>dia</strong>, visita el <a href="/mur">Mur del poble</a> i el fitxer <code>LICENSE</code>.</p><p><a href="/xat">El Xat</a></p>'));
  const { textos, munta } = preparaTraduccio(blocs, { html: false });
  expect(textos).toEqual(['Bon dia, visita el', 'Mur del poble', 'i el fitxer', '.', 'El Xat']);
  const [primer, segon] = munta(['Egun on, bisitatu', 'Herriko Horma', 'eta fitxategia', '.', 'Txata']);
  expect(primer.text).toBe('Egun on, bisitatu Herriko Horma eta fitxategia LICENSE.');
  expect(primer.peces.filter(({ marques }) => marques.length).map(({ text, marques }) => [text, marques.map((marca) => marca.href ?? marca.etiqueta)]))
    .toEqual([['Herriko Horma', ['/mur']], ['LICENSE', ['code']]]);
  expect(segon.peces).toEqual([{ text: 'Txata', marques: [{ id: 0, etiqueta: 'a', href: '/xat' }] }]);
});

test('CosTraduit: <ol start> i <ul> per llista, enllaços amb el href de l’original i una segona porta per al href', () => {
  const a = { id: 0, etiqueta: 'a', href: '/mur' };
  const extern = { id: 1, etiqueta: 'a', href: 'https://nlnet.nl', novaFinestra: true };
  const dolent = { id: 2, etiqueta: 'a', href: 'javascript:alert(1)' };
  const { container } = render(createElement(CosTraduit, { blocs: [
    { etiqueta: 'li', text: 'U', llista: { tipus: 'ol', id: 0, inici: 3 } },
    { etiqueta: 'li', text: 'Dos', llista: { tipus: 'ol', id: 0, inici: 3 } },
    { etiqueta: 'li', text: 'A', llista: { tipus: 'ul', id: 1 } },
    { etiqueta: 'li', text: 'B', llista: { tipus: 'ul', id: 2 } },
    { etiqueta: 'p', text: 'Visit the Wall', peces: [{ text: 'Visit the ', marques: [] }, { text: 'Wall', marques: [a] }] },
    { etiqueta: 'p', text: 'NLnet x', peces: [{ text: 'NLnet', marques: [extern] }, { text: ' x', marques: [dolent] }] },
  ] }));
  expect([...container.children].map((node) => [node.tagName, node.getAttribute('start'), node.textContent])).toEqual([
    ['OL', '3', 'UDos'], ['UL', null, 'A'], ['UL', null, 'B'], ['P', null, 'Visit the Wall'], ['P', null, 'NLnet x'],
  ]);
  const enllacos = [...container.querySelectorAll('a')].map((node) => [node.getAttribute('href'), node.getAttribute('target'), node.getAttribute('rel')]);
  /* Cicle 4 (traduccio-enllacos-sense-rel-noreferrer) · El rel de
     sanitize.js a cada enllaç, com a l'original; target només amb finestra nova. */
  expect(enllacos).toEqual([
    ['/mur', null, 'noopener noreferrer nofollow'], ['https://nlnet.nl', '_blank', 'noopener noreferrer nofollow'],
  ]);
});

/* ── Gauntlet 261030 (cicle 2), corrector de l'àrea traductor-client ────── */

/* traduir-correu-a-registre · translate="no" (l'atribut estàndard) deixa
   fora el que el porta: un correu dins d'una frase no ix cap al motor, ni en
   HTML (Apertium) ni en text (MyMemory, que el posaria en una URL GET). */
test('translate="no": el correu dins d’una frase no ix mai cap al motor (amb HTML i sense)', () => {
  const arrel = arrelHtml([
    '<p role="status">Hem enviat l’enllaç de confirmació a <strong translate="no">maria.prova@example.org</strong>. Quan l’hages confirmat, torna ací.</p>',
    '<p>Compte: <strong translate="no">maria.prova@example.org</strong>. Tria la contrasenya.</p>',
    '<section translate="no"><h3>Veïnat connectat amb tu</h3><ul><li>Rosa Inventada</li></ul></section>',
    '<p>Text públic.</p>',
  ].join(''));
  const blocs = blocsTraduibles(arrel);
  expect(blocs.map(({ text }) => text)).toEqual([
    'Hem enviat l’enllaç de confirmació a . Quan l’hages confirmat, torna ací.',
    'Compte: . Tria la contrasenya.',
    'Text públic.',
  ]);
  for (const html of [true, false]) {
    const enviats = preparaTraduccio(blocs, { html }).textos.map((text) => (typeof text === 'string' ? text : text.text));
    expect([html, enviats.some((text) => /@|Rosa|Veïnat/.test(text))]).toEqual([html, false]);
  }
});

/* traduccio-lang-index-i-blocs-de-reserva · Un bloc que torna en l'original
   porta `original` (munta) i CosTraduit li posa lang="ca"; els traduïts, cap. */
test('munta amb `originals`: el bloc que torna en l’original (text, HTML o segments) va marcat; els traduïts, no', () => {
  const blocs = blocsTraduibles(arrelHtml('<h3>Títol</h3><p>Visita el <a href="/mur">Mur</a> ara.</p><p>Bon dia</p><ul><li><a href="/xat">Xat</a> i res</li></ul>'));
  const amb = preparaTraduccio(blocs, { html: true });
  const traduccions = ['Title', 'Visit the <a data-sdp="0">Wall</a> now.', 'Bon dia', '<a data-sdp="0">Chat</a> and nothing'];
  const muntats = amb.munta(traduccions, new Set([2]));
  expect(muntats.map((bloc) => Boolean(bloc.original))).toEqual([false, false, true, false]);
  expect(amb.munta(traduccions, new Set([1]))[1]).toEqual({ ...blocs[1], original: true });
  // Per segments (sense HTML): original només si cap segment enviat no s'ha traduït.
  const sense = preparaTraduccio(blocs, { html: false });
  expect(sense.textos).toEqual(['Títol', 'Visita el', 'Mur', 'ara.', 'Bon dia', 'Xat', 'i res']);
  const segments = ['Title', 'Visit the', 'Wall', 'now.', 'Good morning', 'Chat', 'and nothing'];
  expect(sense.munta(segments, new Set([5, 6]))[3]).toEqual({ ...blocs[3], original: true });
  expect(sense.munta(segments, new Set([5]))[3].original).toBeUndefined();
  expect(sense.munta(segments, new Set())[3].text).toBe('Chat and nothing');
});

test('CosTraduit: lang="ca" al bloc (p o li) que torna en l’original; cap lang als traduïts', () => {
  const { container } = render(createElement(CosTraduit, { blocs: [
    { etiqueta: 'h3', text: 'Title' },
    { etiqueta: 'p', text: 'Text en valencià', original: true },
    { etiqueta: 'li', text: 'One', llista: { tipus: 'ul', id: 0 } },
    { etiqueta: 'li', text: 'Dos', llista: { tipus: 'ul', id: 0 }, original: true },
  ] }));
  expect([...container.querySelectorAll('h3, p, li')].map((node) => [node.tagName, node.getAttribute('lang')]))
    .toEqual([['H3', null], ['P', 'ca'], ['LI', null], ['LI', 'ca']]);
});

/* ── Cicle 4 (auditoria matinal de Codex 261030, C5) ────────────────────── */

/* «Bon<br>dia» era «Bondia»: el motor rebia una paraula que no existix. */
test('C5 · un <br> és un espai entre els dos textos, també dins d’una negreta o al costat d’un enllaç', () => {
  const blocs = blocsTraduibles(arrelHtml(
    '<p>Bon<br>dia</p><p><strong>Carrer Major, 3<br>Alcoi</strong></p><p>Escriu-nos<br><a href="/xat">pel xat</a></p><p>Hola<span class="sr-only">!</span>, veí</p>'
  ));
  expect(blocs.map(({ text }) => text)).toEqual(['Bon dia', 'Carrer Major, 3 Alcoi', 'Escriu-nos pel xat', 'Hola, veí']);
  // L'espai porta les marques que comparteixen els dos textos: la negreta sencera, l'enllaç sense l'espai.
  expect(blocs[1].peces).toEqual([{ text: 'Carrer Major, 3 Alcoi', marques: [{ id: 0, etiqueta: 'strong' }] }]);
  expect(blocs[2].peces.map(({ text, marques }) => [text, marques.length])).toEqual([['Escriu-nos ', 0], ['pel xat', 1]]);
  // En eixir d'un bloc intern, també: «<p>Primer</p>després» és «Primer després».
  expect(blocsTraduibles(arrelHtml('<ul><li><p>Primer</p>després</li><li>Abans<div>dins</div></li></ul>')).map(({ text }) => text))
    .toEqual(['Primer després', 'Abans dins']);
});

/* Una llista dins d'un <li> s'aplanava dins del text de fora («FruitaPomaPera»). */
test('C5 · llistes niuades: cada <li> és un bloc, amb `dins` (l’índex del <li> pare), i el text de fora no les inclou', () => {
  const blocs = blocsTraduibles(arrelHtml([
    '<ul><li>Fruita<ul><li>Poma</li><li>Pera<ol start="2"><li>Conferència</li></ol></li></ul></li><li>Verdura</li>',
    '<li><ul><li>Sense text de fora</li></ul></li></ul>',
    '<ol><li><blockquote>Cita<ul><li>dins</li></ul></blockquote></li></ol>',
  ].join('')));
  expect(blocs.map(({ text, llista }) => [text, llista])).toEqual([
    ['Fruita', { tipus: 'ul', id: 0 }],
    ['Poma', { tipus: 'ul', id: 1, dins: 0 }],
    ['Pera', { tipus: 'ul', id: 1, dins: 0 }],
    ['Conferència', { tipus: 'ol', id: 2, inici: 2, dins: 2 }],
    ['Verdura', { tipus: 'ul', id: 0 }],
    ['', { tipus: 'ul', id: 0 }],
    ['Sense text de fora', { tipus: 'ul', id: 3, dins: 5 }],
    /* Amb un altre bloc entre tots dos (la cita), un sol bloc. Cicle 4
       (c5-llistes-niuades-aplanades-consagrades) · No es pot reconstruir
       (la llista s'aplanaria dins de la cita): porta el seu arbre. */
    ['Cita dins', { tipus: 'ol', id: 4 }],
  ]);
  expect(blocs[7].arbre).toEqual([{ etiqueta: 'blockquote', fills: ['Cita', { etiqueta: 'ul', fills: [{ etiqueta: 'li', fills: ['dins'] }] }] }]);
  expect(blocs.slice(0, 7).some((bloc) => 'arbre' in bloc)).toBe(false);
  // El <li> buit no s'envia i torna tal qual; el no fidel tampoc s'envia i torna en l'original; la resta es traduïx.
  const { textos, munta } = preparaTraduccio(blocs, { html: true });
  expect(textos).toEqual(['Fruita', 'Poma', 'Pera', 'Conferència', 'Verdura', 'Sense text de fora']);
  const muntats = munta(['Fruit', 'Apple', 'Pear', 'Conference', 'Vegetable', 'No outer text']);
  expect(muntats.map(({ text }) => text)).toEqual(['Fruit', 'Apple', 'Pear', 'Conference', 'Vegetable', '', 'No outer text', 'Cita dins']);
  expect(muntats[5]).toEqual(blocs[5]);
  expect(muntats[7]).toEqual({ ...blocs[7], original: true });
});

test('C5 · CosTraduit torna a niuar cada llista dins del seu <li>, com a l’original', () => {
  const original = '<ul><li>Fruita<ul><li>Poma</li><li>Pera<ol start="2"><li>Conferència</li></ol></li></ul></li><li>Verdura</li>'
    + '<li><ul><li>Sense text de fora</li></ul></li></ul><p>Fi</p>';
  const arrel = arrelHtml(original);
  const blocs = blocsTraduibles(arrel);
  const { container } = render(createElement(CosTraduit, { blocs }));
  // Sense traduir, el mateix arbre que l'original.
  expect(container.innerHTML).toBe(arrel.innerHTML);
  // Traduït, la mateixa forma.
  const { munta } = preparaTraduccio(blocs, { html: true });
  cleanup();
  const traduit = render(createElement(CosTraduit, { blocs: munta(['Fruit', 'Apple', 'Pear', 'Conference', 'Vegetable', 'No outer text', 'End']) }));
  expect(traduit.container.innerHTML).toBe(
    '<ul><li>Fruit<ul><li>Apple</li><li>Pear<ol start="2"><li>Conference</li></ol></li></ul></li><li>Vegetable</li>'
    + '<li><ul><li>No outer text</li></ul></li></ul><p>End</p>'
  );
  // Un `dins` que no apunta a un <li> d'abans no amaga res: la llista es pinta on és.
  cleanup();
  const solts = render(createElement(CosTraduit, { blocs: [
    { etiqueta: 'p', text: 'Pare' },
    { etiqueta: 'li', text: 'A', llista: { tipus: 'ul', id: 0, dins: 0 } },
    { etiqueta: 'li', text: 'B', llista: { tipus: 'ul', id: 1, dins: 5 } },
  ] }));
  expect(solts.container.innerHTML).toBe('<p>Pare</p><ul><li>A</li></ul><ul><li>B</li></ul>');
});

/* ── Gauntlet 261030 (cicle 4), corrector de l'àrea traductor ───────────── */

/* traduccio-enllac-buit-es-perd-en-silenci · Apertium trau la paraula de
   l'etiqueta en una locució: amb una negreta només es perd el format, però
   un enllaç buit desapareixia en silenci (original:false, sense href). */
test('pecesDeHtml: un enllaç que torna buit deixa el bloc en l’original (amb el seu href); una negreta buida, no', () => {
  const [bloc] = blocsTraduibles(arrelHtml('<p>Bon <a href="/guia">dia</a></p>'));
  expect(htmlDePeces(bloc.peces)).toBe('Bon <a data-sdp="0">dia</a>');
  expect(pecesDeHtml('Buen día <a data-sdp="0"></a>', bloc.peces)).toBeNull();
  expect(pecesDeHtml('Buen <a data-sdp="0"> </a>día', bloc.peces)).toBeNull();
  expect(pecesDeHtml('Buen <a data-sdp="0">día</a>', bloc.peces).find(({ text }) => text === 'día').marques[0].href).toBe('/guia');
  // Amb un segon enllaç, el buit tampoc es perd: tot el bloc torna en l'original.
  const [dos] = blocsTraduibles(arrelHtml('<p>Bon <a href="/guia">dia</a> i <a href="/mur">el Mur</a></p>'));
  expect(pecesDeHtml('Buen día <a data-sdp="0"></a> y <a data-sdp="1">el Muro</a>', dos.peces)).toBeNull();
  // L'enllaç que perd el codi de dins (el motor el trau fora i deixa l'<a> buit).
  const [ambCodi] = blocsTraduibles(arrelHtml('<p>Mira <a href="/x"><code>LICENSE</code></a> ara</p>'));
  expect(pecesDeHtml('Mira <code data-sdp="1"></code> <a data-sdp="0"></a> ahora', ambCodi.peces)).toBeNull();
  expect(pecesDeHtml('Mira <a data-sdp="0"><code data-sdp="1"></code></a> ahora', ambCodi.peces).map(({ text }) => text).join('')).toBe('Mira LICENSE ahora');
  // La negreta buida (mesura real d'Apertium, 261030): la paraula hi és i el bloc es traduïx.
  const [negreta] = blocsTraduibles(arrelHtml('<p>Bon <strong>dia</strong></p>'));
  expect(pecesDeHtml('Buen día <strong data-sdp="0"></strong>', negreta.peces).map(({ text }) => text).join('')).toBe('Buen día');
  // Per munta: l'original, marcat, amb l'enllaç de sempre.
  const { munta } = preparaTraduccio([bloc], { html: true });
  const [muntat] = munta(['Buen día <a data-sdp="0"></a>']);
  expect(muntat).toEqual({ ...bloc, original: true });
});

/* c5-llistes-niuades-aplanades-consagrades · «Si un bloc no es pot
   reconstruir fidelment, es queda en l'original» (C5): el text de després
   d'una subllista, i una llista dins d'una cita o d'una cel·la. */
test('C5 · un bloc que no es pot reconstruir no s’envia i es pinta tal qual, en ordre (també les formes de TipTap)', () => {
  const formes = [
    '<ul><li>Ingredients<ul><li>farina</li><li>aigua</li></ul>Barreja-ho tot.</li><li>Cou-ho</li></ul>',
    '<ul><li><p>Abans</p><ul><li><p>Dins</p></li></ul><p>Després</p></li></ul>',
    '<blockquote><p>Cita</p><ul><li><p>u</p></li><li><p>dos</p></li></ul></blockquote>',
    '<ol start="3"><li>Pas<ol start="2"><li><a href="/guia" rel="noopener noreferrer nofollow">guia</a></li></ol>i <strong>prou</strong><br>fi</li></ol>',
  ];
  for (const original of formes) {
    cleanup();
    document.body.replaceChildren();
    const arrel = arrelHtml(original);
    const blocs = blocsTraduibles(arrel);
    // Sense traduir, el mateix arbre que l'original: cap text reordenat, cap llista aplanada.
    const { container } = render(createElement(CosTraduit, { blocs }));
    expect([original, container.innerHTML]).toEqual([original, arrel.innerHTML]);
    // No s'envia res del bloc no fidel; torna en l'original, amb lang="ca".
    const { textos, munta } = preparaTraduccio(blocs, { html: true });
    const enviat = textos.map((text) => (typeof text === 'string' ? text : text.text)).join(' | ');
    expect([original, /Barreja|Després|Cita|guia|prou/.test(enviat)]).toEqual([original, false]);
    cleanup();
    const traduit = render(createElement(CosTraduit, { blocs: munta(textos.map((text) => (typeof text === 'string' ? text.toUpperCase() : text.text))), llengua: 'es' }));
    const noFidel = traduit.container.querySelector('[lang="ca"]');
    expect([original, noFidel?.outerHTML.replace(' lang="ca"', '')]).toEqual([original, arrel.querySelector(noFidel?.tagName.toLowerCase())?.outerHTML]);
  }
  // El <li> germà, fidel, es traduïx igual.
  const blocs = blocsTraduibles(arrelHtml(formes[0]));
  expect(blocs.map(({ text, arbre }) => [text, Boolean(arbre)])).toEqual([['Ingredients Barreja-ho tot.', true], ['Cou-ho', false]]);
  expect(preparaTraduccio(blocs, { html: true }).textos).toEqual(['Cou-ho']);
  // Una cel·la amb una llista: el text i la llista, en ordre, dins d'un <div> (mai una llista dins d'un <p>).
  cleanup();
  document.body.replaceChildren();
  const cella = blocsTraduibles(arrelHtml('<table><tbody><tr><td>Cel·la<ul><li>u</li><li>dos</li></ul>i fi</td></tr></tbody></table>'));
  const pintada = render(createElement(CosTraduit, { blocs: cella }));
  expect(pintada.container.innerHTML).toBe('<div>Cel·la<ul><li>u</li><li>dos</li></ul>i fi</div>');
  // Res del que no es veu passa a l'arbre, i cap href insegur.
  cleanup();
  document.body.replaceChildren();
  const [amagat] = blocsTraduibles(arrelHtml('<blockquote>Cita<ul><li>u<span class="sr-only">secret</span></li><li hidden>amagat</li><li><a href="javascript:alert(1)">mal</a></li></ul></blockquote>'));
  expect(amagat.arbre).toEqual([
    'Cita', { etiqueta: 'ul', fills: [{ etiqueta: 'li', fills: ['u'] }, { etiqueta: 'li', fills: ['mal'] }] },
  ]);
});

/* traduccio-enllacos-sense-rel-noreferrer · La vista traduïda torna a pintar
   l'enllaç amb el mateix rel que el sanejador posa a l'original. */
test('CosTraduit: l’enllaç traduït porta el rel de l’original (noopener noreferrer nofollow), també dins d’un bloc no fidel', () => {
  const arrel = arrelHtml(sanitizeHtml('<p>Mira <a href="https://exemple.org/pagina">esta pàgina</a> ara.</p><p><a href="https://exemple.org/nova" target="_blank">nova</a></p>'));
  const originals = [...arrel.querySelectorAll('a')].map((node) => [node.getAttribute('rel'), node.getAttribute('target')]);
  expect(originals).toEqual([['noopener noreferrer nofollow', null], ['noopener noreferrer nofollow', '_blank']]);
  const { munta } = preparaTraduccio(blocsTraduibles(arrel), { html: true });
  const { container } = render(createElement(CosTraduit, {
    blocs: munta(['Look at <a data-sdp="0">this page</a> now.', '<a data-sdp="0">new</a>']), llengua: 'en-GB',
  }));
  expect([...container.querySelectorAll('a')].map((node) => [node.getAttribute('href'), node.getAttribute('rel'), node.getAttribute('target')])).toEqual([
    ['https://exemple.org/pagina', 'noopener noreferrer nofollow', null], ['https://exemple.org/nova', 'noopener noreferrer nofollow', '_blank'],
  ]);
});

/* traduccio-llista-niuada-hereta-lang-ca · Un <li> que torna en l'original
   (un nom propi que el motor no traduïx) porta lang="ca"; els seus fills
   traduïts no l'han d'heretar. */
test('C5 · un element traduït dins d’un <li> que torna en l’original porta la llengua de la traducció', () => {
  const blocs = blocsTraduibles(arrelHtml('<ul><li>Xàtiva<ul><li>la fira</li><li>el castell<ul><li>Xàtiva</li></ul></li></ul></li><li>Alcoi</li></ul>'));
  const { munta } = preparaTraduccio(blocs, { html: true });
  const muntats = munta(['Xàtiva', 'la feria', 'el castillo', 'Xàtiva', 'Alcoy'], new Set([0, 3]));
  // Com a PageFrame: dins de l'<article lang> de la traducció.
  const article = document.body.appendChild(document.createElement('article'));
  article.setAttribute('lang', 'es');
  render(createElement(CosTraduit, { blocs: muntats, llengua: 'es' }), { container: article });
  const langDe = (text) => [...article.querySelectorAll('li')].find((li) => li.firstChild?.nodeValue === text)?.closest('[lang]')?.getAttribute('lang');
  expect(['Xàtiva', 'la feria', 'el castillo', 'Alcoy'].map(langDe)).toEqual(['ca', 'es', 'es', 'es']);
  // El nom de dins del castell, també original: ca.
  expect([...article.querySelectorAll('li li li')].map((li) => li.closest('[lang]').getAttribute('lang'))).toEqual(['ca']);
  // Tot traduït: cap lang als elements (hereten el de l'article).
  cleanup();
  const tots = render(createElement(CosTraduit, { blocs: munta(['Xàtiva!', 'la feria', 'el castillo', 'Xàtiva!', 'Alcoy']), llengua: 'es' }));
  expect([...tots.container.querySelectorAll('[lang]')]).toHaveLength(0);
});
