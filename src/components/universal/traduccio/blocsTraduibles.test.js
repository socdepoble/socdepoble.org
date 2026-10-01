import { afterEach, expect, test } from 'vitest';
import { MAX_BLOCS, blocsTraduibles } from './blocsTraduibles.js';

/* Traductor Sobirà (ordre del Mestre, 260930 · via B) · Es traduïx text, mai
   HTML: els blocs de lectura de l'article, el més extern de cada niu, sense
   controls ni el que no es veu. */
afterEach(() => { document.body.replaceChildren(); });

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
    { etiqueta: 'li', text: 'Música' },
    { etiqueta: 'li', text: 'Ball' },
    { etiqueta: 'blockquote', text: 'Cita' },
  ]);
});

test('només el bloc més extern: un <li> amb un <p> dins és un sol bloc', () => {
  const li = el('li');
  li.append(el('p', 'Primer'), el('p', 'Segon'));
  const ul = el('ul');
  ul.append(li);
  expect(blocsTraduibles(arrelAmb(ul))).toEqual([{ etiqueta: 'li', text: 'PrimerSegon' }]);
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
    { etiqueta: 'li', text: 'Element' },
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
