import React from 'react';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../app/contexts/RouterContext', () => ({ Link: 'a', useNavigate: () => vi.fn() }));
import { BotoneraClassificacio } from './BotoneraClassificacio.jsx';
import { DialegValors, textDeSerie } from './DialegValors.jsx';
import { DialegCarpeta, carpetesEnArbre } from './DialegCarpeta.jsx';
import { DialegEmoticona } from './DialegEmoticona.jsx';

afterEach(cleanup);

const AVIS = 'Cal almenys una categoria. Si vols netejar-les, marca’n una de general, com «General».';

test('T23 · la botonera porta un quart botó d’emoticona: ploma sense emoticona, l’emoticona quan n’hi ha', () => {
  const onObri = vi.fn();
  const { rerender } = render(<BotoneraClassificacio carpeta="Mur" categories={[]} etiquetes={[]} onObri={onObri} />);
  const grup = screen.getByRole('group', { name: 'Classificació del document' });
  const botons = within(grup).getAllByRole('button');
  expect(botons).toHaveLength(4);
  expect(botons[3].textContent).toBe('Emoticona (—)');
  expect(botons[3].querySelector('svg.lucide-feather')).toBeTruthy();
  fireEvent.click(botons[3]);
  expect(onObri).toHaveBeenLastCalledWith('emoticona');

  rerender(<BotoneraClassificacio carpeta="Mur" categories={[]} etiquetes={[]} emoticona="🍅" onObri={onObri} />);
  const ambEmoticona = within(screen.getByRole('group', { name: 'Classificació del document' })).getAllByRole('button')[3];
  expect(ambEmoticona.querySelector('svg')).toBeNull();
  expect(ambEmoticona.querySelector('.sdp-classificacio-botonera__glif').textContent).toBe('🍅');
  expect(ambEmoticona.textContent).toBe('🍅Emoticona');
});

test('T23 · el diàleg d’emoticona només desa un sol emoji, i «Llevar» la buida', () => {
  const onDesa = vi.fn();
  render(<DialegEmoticona obert onTanca={vi.fn()} actual="🍅" onDesa={onDesa} />);
  const camp = screen.getByRole('textbox', { name: 'Emoticona' });
  const desar = screen.getByRole('button', { name: 'Desar' });
  expect(camp.value).toBe('🍅');
  expect(desar.disabled).toBe(false);
  fireEvent.change(camp, { target: { value: 'ab' } });
  expect(desar.disabled).toBe(true);
  expect(screen.getByText('Ha de ser un sol emoji, sense text.')).toBeTruthy();
  fireEvent.change(camp, { target: { value: ' 🧱 ' } });
  expect(desar.disabled).toBe(false);
  fireEvent.keyDown(camp, { key: 'Enter' });
  expect(onDesa).toHaveBeenLastCalledWith('🧱');
  fireEvent.click(screen.getByRole('button', { name: 'Llevar' }));
  expect(onDesa).toHaveBeenLastCalledWith('');
});

function dialegCategories(props = {}) {
  const handlers = { onDesa: vi.fn(), onReanomena: vi.fn(), onEsborra: vi.fn(), onTanca: vi.fn() };
  render(
    <DialegValors
      obert titol="Categories de la nota" etiquetaNou="Nova categoria"
      cataleg={['A', 'B', 'Sistema']} seleccionats={['A']} minim={1} fixos={['Sistema']}
      avisMinim={AVIS} {...handlers} {...props}
    />
  );
  return handlers;
}

test('sense res triat, la botonera porta els botons de resum de sempre i obri cada modal', () => {
  const onObri = vi.fn();
  render(<BotoneraClassificacio categories={[]} etiquetes={[]} onObri={onObri} />);
  const grup = screen.getByRole('group', { name: 'Classificació del document' });
  const botons = within(grup).getAllByRole('button');
  expect(botons.map((b) => b.textContent)).toEqual(['Carpetes (—)', 'Categories (0)', 'Etiquetes (0)', 'Emoticona (—)']);
  botons.forEach((b) => expect(b.className).toBe('sdp-classificacio-pindola'));
  botons.forEach((b) => expect(b.getAttribute('aria-haspopup')).toBe('dialog'));
  expect(grup.querySelectorAll('.sp-card-label.sdp-badge-buit')).toHaveLength(4);
  for (const boto of botons) fireEvent.click(boto);
  expect(onObri.mock.calls.map(([tipus]) => tipus)).toEqual(['carpeta', 'categories', 'etiquetes', 'emoticona']);
});

/* T7 (P8, ordre del Mestre) · Amb el contingut ja triat, cada valor és una
   píndola amb les classes de lectura (sp-card-label + sdp-badge-*): el botó
   de resum del grup desapareix. T7B-V1 · Les píndoles d'un grup viuen dins
   d'un sol botó, que obri el diàleg del grup; el nom accessible diu el grup i
   tots els valors. */
const classeDeLaIcona = (svg) => svg.getAttribute('class').split(' ').find((c) => c !== 'lucide' && c.startsWith('lucide-'));

test('T7 · amb carpeta, categories i etiquetes triades, la botonera pinta píndoles en lloc dels resums', () => {
  const onObri = vi.fn();
  render(<BotoneraClassificacio carpeta="Mur" categories={['Sistema']} etiquetes={['a', 'b']} onObri={onObri} />);
  const grup = screen.getByRole('group', { name: 'Classificació del document' });
  const botons = within(grup).getAllByRole('button');
  expect(botons.map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'ab', 'Emoticona (—)']);
  expect(botons.map((b) => b.getAttribute('aria-label'))).toEqual([
    'Carpetes: Mur', 'Categories: Sistema', 'Etiquetes: a, b', null
  ]);
  const grups = botons.slice(0, 3);
  for (const boto of grups) {
    expect(boto.className).toBe('sdp-classificacio-pindola');
    expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
    expect(boto.getAttribute('title')).toBe(boto.getAttribute('aria-label'));
  }
  // T7B-V2 · La carpeta és sdp-badge-system (sdp-universal-page §4.1).
  expect(grups.map((b) => [...b.children].map((p) => p.className))).toEqual([
    ['sp-card-label sdp-badge-system'],
    ['sp-card-label sdp-badge-category'],
    ['sp-card-label sdp-badge-tag', 'sp-card-label sdp-badge-tag']
  ]);
  // T7B-R1 · Cada píndola porta la icona del seu grup, la mateixa del botó de
  // resum: el grup es veu sense dependre del color (WCAG 1.4.1).
  expect(grups.map((b) => [...b.querySelectorAll('svg')].map(classeDeLaIcona))).toEqual([
    ['lucide-folder'], ['lucide-shapes'], ['lucide-tags', 'lucide-tags']
  ]);
  for (const svg of grup.querySelectorAll('.sdp-classificacio-pindola svg')) expect(svg.getAttribute('aria-hidden')).toBe('true');
  // Cap botó de resum dels grups triats: només el de l'emoticona.
  expect(within(grup).queryByText('Carpetes')).toBeNull();
  expect(grup.querySelectorAll('.sdp-classificacio-botonera__resum')).toHaveLength(1);
  for (const boto of grups) fireEvent.click(boto);
  expect(onObri.mock.calls.map(([tipus]) => tipus)).toEqual(['carpeta', 'categories', 'etiquetes']);
});

/* T7B-V1 · Totes les píndoles d'un grup obrien el mateix diàleg: una àrea
   tàctil per valor només afegia files de 44 px. Ara hi ha un objectiu per
   grup, i la botonera no passa mai de quatre botons, en tinga els valors que
   en tinga. */
test('T7B-V1 · un sol objectiu tàctil per grup: la botonera no passa mai de quatre botons', () => {
  const onObri = vi.fn();
  const etiquetes = ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble'];
  render(<BotoneraClassificacio carpeta="Mur" categories={['Hort', 'Reg', 'Festes']} etiquetes={etiquetes} onObri={onObri} />);
  const grup = screen.getByRole('group', { name: 'Classificació del document' });
  expect(within(grup).getAllByRole('button')).toHaveLength(4);
  expect(grup.querySelectorAll('.sdp-classificacio-pindola')).toHaveLength(4);
  expect(grup.querySelectorAll('.sp-card-label.sdp-badge-buit')).toHaveLength(1);
  const deLesEtiquetes = within(grup).getByRole('button', { name: 'Etiquetes: Sistema, Productivitat, Tutorial, Sóc de Poble' });
  expect([...deLesEtiquetes.querySelectorAll('.sp-card-label')].map((p) => p.textContent)).toEqual(etiquetes);
  // Cap botó niat: les píndoles de dins són text, no objectius propis.
  expect(deLesEtiquetes.querySelector('button, a, [tabindex]')).toBeNull();
  const deLesCategories = within(grup).getByRole('button', { name: 'Categories: Hort, Reg, Festes' });
  expect(deLesCategories.querySelectorAll('.sp-card-label.sdp-badge-category')).toHaveLength(3);
  fireEvent.click(deLesEtiquetes.querySelectorAll('.sp-card-label')[2]);
  fireEvent.click(deLesCategories);
  expect(onObri.mock.calls.map(([tipus]) => tipus)).toEqual(['etiquetes', 'categories']);
});

/* T7B-V2 · sdp-universal-page §4.1: «La Carpeta (Sistema) · Estil: fons blau
   fosc (.sdp-badge-system)», la classe de les carpetes de lectura. */
test('T7B-V2 · la píndola de la carpeta porta sdp-badge-system, no la neutra', () => {
  render(<BotoneraClassificacio carpeta="Hort" onObri={vi.fn()} />);
  const carpeta = screen.getByRole('button', { name: 'Carpetes: Hort' });
  const pindola = carpeta.querySelector('.sp-card-label');
  expect(pindola.classList.contains('sdp-badge-system')).toBe(true);
  expect(pindola.classList.contains('sdp-badge-neutral')).toBe(false);
  expect(classeDeLaIcona(pindola.querySelector('svg'))).toBe('lucide-folder');
});

test('T7 · cada grup decidix per separat: un grup buit conserva el seu botó de resum', () => {
  const onObri = vi.fn();
  render(<BotoneraClassificacio carpeta="Mur" categories={['Sistema']} etiquetes={[]} emoticona="🌿" onObri={onObri} />);
  const botons = within(screen.getByRole('group', { name: 'Classificació del document' })).getAllByRole('button');
  expect(botons.map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', '🌿Emoticona']);
  fireEvent.click(botons[2]);
  expect(onObri).toHaveBeenLastCalledWith('etiquetes');
});

/* T7B-R1 · Un mateix valor pot ser categoria i etiqueta alhora. Sense
   percebre el color, la icona del grup és la que les distingix a la vista. */
test('T7B-R1 · el mateix valor com a categoria i com a etiqueta es distingix sense el color', () => {
  render(<BotoneraClassificacio categories={['Hort']} etiquetes={['Hort']} onObri={vi.fn()} />);
  const grup = screen.getByRole('group', { name: 'Classificació del document' });
  const categoria = within(grup).getByRole('button', { name: 'Categories: Hort' });
  const etiqueta = within(grup).getByRole('button', { name: 'Etiquetes: Hort' });
  expect(categoria.textContent).toBe('Hort');
  expect(etiqueta.textContent).toBe('Hort');
  expect(categoria.querySelector('svg.lucide-shapes')).toBeTruthy();
  expect(etiqueta.querySelector('svg.lucide-tags')).toBeTruthy();
  expect(categoria.querySelector('svg.lucide-tags')).toBeNull();
  expect(etiqueta.querySelector('svg.lucide-shapes')).toBeNull();
});

/* T7B-R2 · El valor viu en un element propi perquè la CSS el puga escurçar
   amb punts suspensius: dins d'un contenidor flex, un text anònim no admet
   text-overflow i es talla en sec. */
test('T7B-R2 · el valor de cada píndola viu en el seu element de text, després de la icona', () => {
  const llarg = 'Categoria de nom molt llarg per a una columna estreta';
  render(<BotoneraClassificacio carpeta="Mur" categories={[llarg]} etiquetes={['a', 'b']} onObri={vi.fn()} />);
  const pindoles = [...document.querySelectorAll('.sdp-classificacio-pindola > .sp-card-label:not(.sdp-badge-buit)')];
  expect(pindoles.map((p) => p.textContent)).toEqual(['Mur', llarg, 'a', 'b']);
  for (const label of pindoles) {
    const text = label.querySelector(':scope > .sdp-classificacio-pindola__text');
    expect(text).toBeTruthy();
    expect(text.textContent).toBe(label.textContent);
    // Cap text solt fora de l'element: tot el valor és escurçable.
    expect([...label.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())).toEqual([]);
    expect(label.lastElementChild).toBe(text);
  }
  expect(screen.getByRole('button', { name: `Categories: ${llarg}` }).getAttribute('title')).toBe(`Categories: ${llarg}`);
});

test('T7 · valors buits o repetits no trenquen la botonera', () => {
  render(<BotoneraClassificacio carpeta="" categories={['', 'Hort', 'Hort']} etiquetes={[null, '']} onObri={vi.fn()} />);
  const botons = within(screen.getByRole('group', { name: 'Classificació del document' })).getAllByRole('button');
  expect(botons.map((b) => b.textContent)).toEqual(['Carpetes (—)', 'HortHort', 'Etiquetes (0)', 'Emoticona (—)']);
  expect(botons[1].getAttribute('aria-label')).toBe('Categories: Hort, Hort');
});

test('orfandat: la darrera categoria no es pot desmarcar ni esborrar, i la modal ho explica', () => {
  dialegCategories();
  const a = screen.getByRole('checkbox', { name: 'A' });
  expect(a.checked).toBe(true);
  expect(a.disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Esborrar «A»' }).disabled).toBe(true);
  expect(screen.getByText(AVIS)).toBeTruthy();
});

test('orfandat: amb dues categories se’n pot llevar una, i aleshores l’altra queda fixada', () => {
  const { onDesa } = dialegCategories({ seleccionats: ['A', 'B'] });
  fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
  expect(screen.getByRole('checkbox', { name: 'B' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith(['B']);
});

test('orfandat: una nota sense categoria no es pot desar fins que en tria una', () => {
  const { onDesa } = dialegCategories({ seleccionats: [] });
  const desar = screen.getByRole('button', { name: 'Desar' });
  expect(desar.disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: 'B' }));
  expect(desar.disabled).toBe(false);
  fireEvent.click(desar);
  expect(onDesa).toHaveBeenCalledWith(['B']);
});

test('les etiquetes poden quedar buides', () => {
  const onDesa = vi.fn();
  render(<DialegValors obert titol="Etiquetes" etiquetaNou="Nova etiqueta" cataleg={['x']} seleccionats={['x']} minim={0}
    onDesa={onDesa} onReanomena={vi.fn()} onEsborra={vi.fn()} onTanca={vi.fn()} />);
  const x = screen.getByRole('checkbox', { name: 'x' });
  expect(x.disabled).toBe(false);
  fireEvent.click(x);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith([]);
});

test('afegir crea el valor i el selecciona per a esta nota', () => {
  const { onDesa } = dialegCategories();
  const camp = screen.getByRole('textbox', { name: 'Nova categoria' });
  fireEvent.change(camp, { target: { value: '  Hort ' } });
  fireEvent.keyDown(camp, { key: 'Enter' });
  expect(screen.getByRole('checkbox', { name: 'Hort' }).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith(['A', 'Hort']);
});

test('reanomenar demana el nom nou i l’aplica a totes les notes', () => {
  const { onReanomena, onDesa } = dialegCategories();
  fireEvent.click(screen.getByRole('button', { name: 'Reanomenar «A»' }));
  const camp = screen.getByRole('textbox', { name: 'Nou nom per a «A»' });
  fireEvent.change(camp, { target: { value: 'B' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  // Un nom que ja existix no s'aplica.
  expect(onReanomena).not.toHaveBeenCalled();
  expect(screen.getByText('Ja hi ha «B». Tria un altre nom.')).toBeTruthy();
  fireEvent.change(camp, { target: { value: 'Z' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  expect(onReanomena).toHaveBeenCalledWith('A', 'Z');
  expect(screen.getByRole('checkbox', { name: 'Z' }).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith(['Z']);
});

test('esborrar demana confirmació i el lleva de totes les notes', () => {
  const { onEsborra } = dialegCategories({ seleccionats: ['A', 'B'] });
  fireEvent.click(screen.getByRole('button', { name: 'Esborrar «B»' }));
  expect(onEsborra).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar: esborrar «B»' }));
  expect(onEsborra).toHaveBeenCalledWith('B');
  expect(screen.queryByRole('checkbox', { name: 'B' })).toBeNull();
});

/* T7 (P8) · Un valor de sèrie no es reanomena ni s'esborra mai: la fila no
   porta cap control desactivat sense funció, només la casella. */
test('T7 · els valors de sèrie no porten llapis ni paperera; els propis, sí', () => {
  dialegCategories();
  expect(screen.queryByRole('button', { name: 'Reanomenar «Sistema»' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Esborrar «Sistema»' })).toBeNull();
  expect(screen.getByRole('checkbox', { name: 'Sistema' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Reanomenar «B»' }).disabled).toBe(false);
  expect(screen.getByRole('button', { name: 'Esborrar «B»' }).disabled).toBe(false);
});

/* T7B-V3 · Sense els botons desactivats, la fila d'un valor de sèrie havia
   perdut l'única explicació (el title). Ara la diu una frase visible a l'avís
   de davall, que nomena els valors de sèrie de la llista, i la casella la
   porta com a descripció. Cap control desactivat torna. */
test('T7B-V3 · el diàleg diu quins valors són de sèrie i per què no porten llapis ni paperera', () => {
  dialegCategories();
  const frase = '«Sistema» és de sèrie: no es reanomena ni s’esborra.';
  const avis = screen.getByText(frase);
  expect(avis.closest('p').textContent).toBe(`Reanomenar i esborrar s’apliquen de seguida a totes les notes. ${frase}`);
  const sistema = screen.getByRole('checkbox', { name: 'Sistema' });
  expect(sistema.getAttribute('aria-describedby')).toBe(avis.id);
  expect(document.getElementById(sistema.getAttribute('aria-describedby')).textContent).toBe(frase);
  // Un valor propi no es descriu com a sèrie.
  expect(screen.getByRole('checkbox', { name: 'A' }).getAttribute('aria-describedby')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Reanomenar «Sistema»' })).toBeNull();
});

test('T7B-V3 · la frase de sèrie: plural, amb notes per carregar, i cap frase sense valors de sèrie', () => {
  expect(textDeSerie(['A', 'B', 'C'])).toBe('«A», «B» i «C» són de sèrie: no es reanomenen ni s’esborren.');
  dialegCategories({ fixos: ['Sistema', 'A'], globalActiu: false, avisGlobal: 'Falten notes per carregar.' });
  const plural = screen.getByText('«A» i «Sistema» són de sèrie: no es reanomenen ni s’esborren.');
  expect(plural.closest('p').textContent).toBe('Falten notes per carregar. «A» i «Sistema» són de sèrie: no es reanomenen ni s’esborren.');
  cleanup();
  // Un valor de sèrie que no és a la llista no es nomena.
  dialegCategories({ fixos: ['General'] });
  expect(screen.queryByText(/de sèrie/)).toBeNull();
  for (const casella of screen.getAllByRole('checkbox')) expect(casella.getAttribute('aria-describedby')).toBeNull();
});

test('mentre falten notes per carregar, reanomenar i esborrar es veuen desactivats i l’avís diu per què', () => {
  dialegCategories({ globalActiu: false, avisGlobal: 'Falten notes per carregar.' });
  expect(screen.getByRole('button', { name: 'Reanomenar «B»' }).disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Esborrar «B»' }).disabled).toBe(true);
  expect(screen.getByText('Falten notes per carregar.')).toBeTruthy();
});

const CARPETES_PLANES = [{ id: 'f-mur', nom: 'Mur', parentId: null }, { id: 'f-notes', nom: 'Altres notes', parentId: null }];

/* T7 (P8) · Crear, reanomenar i esborrar carpetes no tenen contracte de
   dades: el diàleg ja no pinta tres botons desactivats, només l'avís. */
test('T7 · carpetes: se’n tria sempre una; cap control desactivat sense funció, i l’avís es conserva', () => {
  const onDesa = vi.fn();
  render(<DialegCarpeta obert onTanca={vi.fn()} onDesa={onDesa} seleccionada="f-mur"
    opcions={CARPETES_PLANES}
    avis="Encara no hi ha contracte de dades per a gestionar carpetes." />);
  expect(screen.getByRole('radio', { name: 'Mur' }).checked).toBe(true);
  fireEvent.click(screen.getByRole('radio', { name: 'Altres notes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith('f-notes');
  for (const nom of ['Crear carpeta', 'Reanomenar carpeta', 'Esborrar carpeta']) {
    expect(screen.queryByRole('button', { name: nom })).toBeNull();
  }
  const dialeg = screen.getByRole('dialog', { name: 'Carpeta del document' });
  expect(within(dialeg).queryAllByRole('button').filter((b) => b.disabled)).toEqual([]);
  expect(screen.getByText('Encara no hi ha contracte de dades per a gestionar carpetes.')).toBeTruthy();
});

test('T7 · carpetes planes: la llista de sempre, sense sagnat (GrupOpcions)', () => {
  render(<DialegCarpeta obert onTanca={vi.fn()} onDesa={vi.fn()} seleccionada="f-mur" opcions={CARPETES_PLANES} />);
  expect(document.querySelector('[class*="sdp-classificacio-carpeta--nivell"]')).toBeNull();
  expect(screen.getAllByRole('radio').map((r) => r.closest('.sdp-casella').className)).toEqual(['sdp-casella', 'sdp-casella']);
  expect(document.querySelector('.sdp-classificacio-dialeg__reservat')).toBeNull();
});

/* T7 (P5) · Contracte amb el Workspace: { id, nom, parentId }. L'arbre es
   pinta en profunditat, amb sagnat per nivell i el camí al nom accessible. */
const ARBRE = [
  { id: 'f-mur', nom: 'Mur', parentId: null },
  { id: 'antigravity', nom: 'Antigravity', parentId: 'foto' },
  { id: 'tic', nom: 'TIC', parentId: null },
  { id: 'foto', nom: 'Foto', parentId: 'tic' },
  { id: 'orfe', nom: 'Orfe', parentId: 'no-hi-es' }
];

test('T7 · carpetesEnArbre: profunditat primer, nivell i camí; un pare desconegut fa arrel', () => {
  expect(carpetesEnArbre(ARBRE).map(({ id, nivell, cami }) => [id, nivell, cami.join(' › ')])).toEqual([
    ['f-mur', 0, ''],
    ['tic', 0, ''],
    ['foto', 1, 'TIC'],
    ['antigravity', 2, 'TIC › Foto'],
    ['orfe', 0, '']
  ]);
  // Els ids no textuals tornen tal com van arribar.
  expect(carpetesEnArbre([{ id: 1, nom: 'U', parentId: null }, { id: 2, nom: 'D', parentId: 1 }]).map((f) => f.id)).toEqual([1, 2]);
});

test('T7 · carpetes niades: arbre amb sagnat, camí al nom accessible i una sola tria', () => {
  const onDesa = vi.fn();
  render(<DialegCarpeta obert onTanca={vi.fn()} onDesa={onDesa} seleccionada="foto" opcions={ARBRE} />);
  const grup = screen.getByRole('group', { name: 'Carpetes' });
  const radios = within(grup).getAllByRole('radio');
  expect(radios.map((r) => r.closest('.sdp-casella').className)).toEqual([
    'sdp-casella',
    'sdp-casella',
    'sdp-casella sdp-classificacio-carpeta--nivell-1',
    'sdp-casella sdp-classificacio-carpeta--nivell-2',
    'sdp-casella'
  ]);
  expect(screen.getByRole('radio', { name: 'TIC › Foto' }).checked).toBe(true);
  fireEvent.click(screen.getByRole('radio', { name: 'TIC › Foto › Antigravity' }));
  expect(screen.getByRole('radio', { name: 'TIC › Foto' }).checked).toBe(false);
  expect(radios.filter((r) => r.checked)).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith('antigravity');
});
