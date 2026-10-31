/* Bloc 3.8 del Gauntlet (261016) · La graella del catàleg Emojis XL: dades a
   demanda (la funció del consumidor), famílies plegables que només pinten els
   seus botons oberts, botons natius amb el nom oficial en anglès, cerca pel
   nom, tabulador mòbil amb les fletxes i un error que es pot reintentar. I el
   DialegEmoticona: amb `carregaCataleg`, la graella assigna; sense, el diàleg
   de sempre. Dades sintètiques i, en una prova, el catàleg de veres.
   Gauntlet 261017 (F30, F34) · Amunt i avall, el focus quan arriba el
   catàleg dins d'un diàleg (sense robar-lo mai) i l'avís dels glifs que este
   navegador no reconeix, ara dins de la graella (textNoReconegut). */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { GraellaEmojis } from './GraellaEmojis.jsx';
import { DialegEmoticona } from './DialegEmoticona.jsx';
import { emojiSol } from '../../../utils/emoji.js';
import { creaDetectorDePintat } from '../../../utils/emojiPintable.js';

afterEach(cleanup);

const GRUPS = Object.freeze([
  { id: 'cares', nom: 'Cares i emocions', emojis: [['1F600', '😀', 'grinning face'], ['1F642', '🙂', 'slightly smiling face'], ['1F609', '😉', 'winking face']] },
  { id: 'menjar', nom: 'Menjar i beguda', emojis: [['1F345', '🍅', 'tomato'], ['1F33D', '🌽', 'ear of corn']] }
]);
const cataleg = (grups = GRUPS) => vi.fn(async () => ({ GRUPS_EMOJIS: grups }));
const familia = (nom) => screen.getByText(new RegExp(`^${nom} \\(`)).closest('details');
/* jsdom no fa el clic del summary: s'obri o es plega el <details> i el
   navegador avisa amb un toggle. */
const commuta = (details, obert) => act(() => {
  details.open = obert;
  details.dispatchEvent(new Event('toggle'));
});

test('carrega a demanda: «Carregant…» i, després, la primera família oberta i les altres plegades i sense botons', async () => {
  const carrega = cataleg();
  render(<GraellaEmojis carregaCataleg={carrega} onTria={vi.fn()} />);
  expect(screen.getByRole('status').textContent).toBe('Carregant els emojis…');
  const somriure = await screen.findByRole('button', { name: 'grinning face' });
  expect(carrega).toHaveBeenCalledTimes(1);
  expect(familia('Cares i emocions').open).toBe(true);
  expect(familia('Menjar i beguda').open).toBe(false);
  expect(within(familia('Menjar i beguda')).queryAllByRole('button')).toEqual([]);
  // El nom oficial en anglès és el nom accessible; el glif, decoratiu.
  expect(somriure.getAttribute('lang')).toBe('en');
  expect(somriure.getAttribute('title')).toBe('grinning face');
  expect(somriure.querySelector('[aria-hidden="true"]').textContent).toBe('😀');
  expect(screen.getByRole('list', { name: 'Cares i emocions' })).toBeTruthy();
  // El summary diu quantes n'hi ha.
  expect(familia('Menjar i beguda').querySelector('summary').textContent).toBe('Menjar i beguda (2)');
});

test('obrir una família pinta els seus botons; plegar-la els lleva; un clic tria el glif i el nom', async () => {
  const onTria = vi.fn();
  render(<GraellaEmojis carregaCataleg={cataleg()} onTria={onTria} />);
  await screen.findByRole('button', { name: 'grinning face' });
  commuta(familia('Menjar i beguda'), true);
  fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
  expect(onTria).toHaveBeenCalledWith('🍅', 'tomato');
  commuta(familia('Cares i emocions'), false);
  expect(screen.queryByRole('button', { name: 'grinning face' })).toBeNull();
  expect(screen.getByRole('button', { name: 'tomato' })).toBeTruthy();
});

test('la cerca és un camp de cerca amb etiqueta, busca pel nom oficial i anuncia el recompte; Escape l’esborra', async () => {
  render(<GraellaEmojis carregaCataleg={cataleg()} onTria={vi.fn()} />);
  await screen.findByRole('button', { name: 'grinning face' });
  const cerca = screen.getByRole('searchbox', { name: 'Cerca un emoji' });
  // Cap camp de text que es diga «Emoticona»: les proves del diàleg el busquen així.
  expect(screen.queryByRole('textbox')).toBeNull();
  fireEvent.change(cerca, { target: { value: 'FACE' } });
  const resultats = screen.getByRole('list', { name: 'Resultats de la cerca' });
  expect(within(resultats).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['grinning face', 'slightly smiling face', 'winking face']);
  expect(screen.getByText('3 emojis.')).toBeTruthy();
  expect(screen.queryByText(/^Cares i emocions \(/)).toBeNull();
  fireEvent.change(cerca, { target: { value: 'tomato' } });
  expect(screen.getByText('1 emoji.')).toBeTruthy();
  fireEvent.change(cerca, { target: { value: 'cap-ni-un' } });
  expect(screen.getByText('Cap emoji amb eixe nom.')).toBeTruthy();
  expect(screen.queryByRole('list', { name: 'Resultats de la cerca' })).toBeNull();
  fireEvent.keyDown(cerca, { key: 'Escape' });
  expect(cerca.value).toBe('');
  expect(familia('Cares i emocions')).toBeTruthy();
});

test('una cerca amb massa resultats en pinta els primers i ho diu', async () => {
  const molts = Array.from({ length: 130 }, (_, i) => [`X${i}`, '🙂', `face ${i}`]);
  render(<GraellaEmojis carregaCataleg={cataleg([{ id: 'molts', nom: 'Molts', emojis: molts }])} onTria={vi.fn()} />);
  await screen.findByRole('button', { name: 'face 0' });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cerca un emoji' }), { target: { value: 'face' } });
  expect(within(screen.getByRole('list', { name: 'Resultats de la cerca' })).getAllByRole('button')).toHaveLength(120);
  expect(screen.getByText('Els primers 120 de 130 emojis: afina la cerca.')).toBeTruthy();
});

test('teclat: un sol botó de cada llista entra al tabulador, i les fletxes, Inici i Fi s’hi mouen', async () => {
  render(<GraellaEmojis carregaCataleg={cataleg()} onTria={vi.fn()} />);
  const primer = await screen.findByRole('button', { name: 'grinning face' });
  const botons = within(screen.getByRole('list', { name: 'Cares i emocions' })).getAllByRole('button');
  expect(botons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
  act(() => primer.focus());
  fireEvent.keyDown(primer, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(botons[1]);
  expect(botons.map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
  fireEvent.keyDown(botons[1], { key: 'End' });
  expect(document.activeElement).toBe(botons[2]);
  fireEvent.keyDown(botons[2], { key: 'ArrowRight' });
  expect(document.activeElement).toBe(botons[2]);
  fireEvent.keyDown(botons[2], { key: 'Home' });
  expect(document.activeElement).toBe(botons[0]);
  fireEvent.keyDown(botons[0], { key: 'ArrowLeft' });
  expect(document.activeElement).toBe(botons[0]);
});

/* Gauntlet 261017 (F34) · Amunt i avall depenen del layout (offsetTop), que
   jsdom no fa: un doble del prototip pinta tres emojis per fila, i es
   restaura en acabar. */
test('teclat: amunt i avall salten una fila (les columnes, de la primera fila pintada) i no ixen de la llista', async () => {
  const set = Array.from({ length: 7 }, (_, i) => [`E${i}`, '🙂', `emoji ${i}`]);
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get() {
      const fila = this.closest('li');
      return fila ? Math.floor(Array.prototype.indexOf.call(fila.parentElement.children, fila) / 3) * 48 : 0;
    }
  });
  try {
    render(<GraellaEmojis carregaCataleg={cataleg([{ id: 'set', nom: 'Set', emojis: set }])} onTria={vi.fn()} />);
    await screen.findByRole('button', { name: 'emoji 0' });
    const botons = within(screen.getByRole('list', { name: 'Set' })).getAllByRole('button');
    const prem = (tecla) => fireEvent.keyDown(document.activeElement, { key: tecla });
    act(() => botons[0].focus());
    prem('ArrowDown');
    expect(document.activeElement).toBe(botons[3]);
    expect(botons.map((b) => b.tabIndex)).toEqual([-1, -1, -1, 0, -1, -1, -1]);
    prem('ArrowDown');
    expect(document.activeElement).toBe(botons[6]);
    // L'última fila: avall no ix de la llista.
    prem('ArrowDown');
    expect(document.activeElement).toBe(botons[6]);
    prem('ArrowUp');
    prem('ArrowUp');
    expect(document.activeElement).toBe(botons[0]);
    prem('ArrowUp');
    expect(document.activeElement).toBe(botons[0]);
    // Des de la fi de la segona fila no hi ha res davall: es queda.
    act(() => botons[5].focus());
    prem('ArrowDown');
    expect(document.activeElement).toBe(botons[5]);
    prem('ArrowUp');
    expect(document.activeElement).toBe(botons[2]);
    expect(botons.map((b) => b.tabIndex)).toEqual([-1, -1, 0, -1, -1, -1, -1]);
  } finally {
    if (original) Object.defineProperty(HTMLElement.prototype, 'offsetTop', original);
    else delete HTMLElement.prototype.offsetTop;
  }
  expect(document.body.offsetTop).toBe(0);
});

/* Gauntlet 261017 (F30) · El focus quan arriba el catàleg. Un diàleg com el
   DialegEmoticona: la X dalt, un camp, la graella i el peu. jsdom no obri el
   <dialog> amb showModal: el focus inicial del diàleg es posa a mà. */
const diferit = () => {
  let resol;
  const promesa = new Promise((r) => { resol = r; });
  return { promesa, resol };
};
function DialegDeProva({ carrega, obert = true }) {
  return (
    <dialog open={obert}>
      <button type="button">Tancar</button>
      <input aria-label="Emoticona" />
      <GraellaEmojis carregaCataleg={carrega} onTria={() => {}} />
      <footer><button type="button">Desar</button></footer>
    </dialog>
  );
}

test('dins d’un diàleg obert: quan arriba el catàleg, el focus passa d’on el va deixar el diàleg al primer emoji (no a la cerca)', async () => {
  const dades = diferit();
  render(<DialegDeProva carrega={() => dades.promesa} />);
  act(() => screen.getByRole('button', { name: 'Tancar' }).focus());
  await act(async () => { dades.resol({ GRUPS_EMOJIS: GRUPS }); });
  const primer = await screen.findByRole('button', { name: 'grinning face' });
  expect(document.activeElement).toBe(primer);
  expect(primer.tabIndex).toBe(0);
});

test('mai roba el focus: ni si la persona ja l’ha mogut, ni fora d’un diàleg obert', async () => {
  // La persona ha anat al camp (o al peu) mentre carregava.
  for (const nom of ['Emoticona', 'Desar']) {
    const dades = diferit();
    const { unmount } = render(<DialegDeProva carrega={() => dades.promesa} />);
    const triat = nom === 'Emoticona' ? screen.getByRole('textbox', { name: nom }) : screen.getByRole('button', { name: nom });
    act(() => triat.focus());
    await act(async () => { dades.resol({ GRUPS_EMOJIS: GRUPS }); });
    await screen.findByRole('button', { name: 'grinning face' });
    expect(document.activeElement).toBe(triat);
    unmount();
  }
  // Fora de cap diàleg.
  const { unmount } = render(<><button type="button">Fora</button><GraellaEmojis carregaCataleg={cataleg()} onTria={vi.fn()} /></>);
  const fora = screen.getByRole('button', { name: 'Fora' });
  act(() => fora.focus());
  await screen.findByRole('button', { name: 'grinning face' });
  expect(document.activeElement).toBe(fora);
  unmount();
  // Un diàleg tancat (sense open).
  const { container } = render(<DialegDeProva carrega={cataleg()} obert={false} />);
  const tancar = container.querySelector('button');
  act(() => tancar.focus());
  await act(async () => {});
  await vi.waitFor(() => expect(container.querySelector('.sdp-graella-emojis__boto')).not.toBeNull());
  expect(document.activeElement).toBe(tancar);
});

test('dins d’un diàleg, amb el focus perdut («Torna-ho a provar» ja no hi és), el recupera el primer emoji', async () => {
  const carrega = vi.fn().mockRejectedValueOnce(new Error('xarxa')).mockResolvedValueOnce({ GRUPS_EMOJIS: GRUPS });
  render(<DialegDeProva carrega={carrega} />);
  const reintent = await screen.findByRole('button', { name: 'Torna-ho a provar' });
  act(() => reintent.focus());
  fireEvent.click(reintent);
  const primer = await screen.findByRole('button', { name: 'grinning face' });
  expect(document.activeElement).toBe(primer);
});

/* Revisió del Gauntlet 261017 (A11Y-2) · «Mai en roba» també davant del web
   amfitrió. Encastat (un <soc-de-poble> amb arrel d'ombra tancada), el
   diàleg és modal només dins de la seua caixa: mentre el catàleg arriba, la
   persona pot clicar el text de la pàgina de WordPress i el focus queda al
   <body> del document. Abans, eixe <body> comptava com a «focus perdut» i,
   en arribar el catàleg, el focus tornava al widget («grinning face»). Ara
   el focus només es mou si encara és dins del diàleg (on el va deixar) o si
   l'ha perdut la mateixa graella («Torna-ho a provar»). */
function muntaEncastat(element) {
  Object.defineProperty(HTMLDialogElement.prototype, 'show', { configurable: true, value: function () { this.setAttribute('open', ''); } });
  const host = document.createElement('soc-de-poble');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = document.createElement('div');
  root.className = 'sdp-root';
  shadow.append(root);
  const muntatge = document.createElement('div');
  root.append(muntatge);
  const vista = render(element, { container: muntatge, baseElement: root });
  return { host, shadow, root, ...vista };
}
const netejaEncastat = () => {
  document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
  delete HTMLDialogElement.prototype.show;
};

test('encastat: amb el focus al web amfitrió (el <body>) mentre carrega, el catàleg no el torna al widget', async () => {
  try {
    const dades = diferit();
    const { shadow } = muntaEncastat(<DialegEmoticona obert onTanca={vi.fn()} onDesa={vi.fn()} carregaCataleg={() => dades.promesa} />);
    await act(async () => {});
    expect(shadow.activeElement).not.toBeNull();
    // Un clic al text de la pàgina amfitriona: el control enfocat perd el focus, que queda al <body>.
    act(() => { shadow.activeElement.blur(); });
    expect(document.activeElement).toBe(document.body);
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    await act(async () => { dades.resol({ GRUPS_EMOJIS: GRUPS }); });
    await act(async () => {});
    expect(shadow.querySelector('.sdp-graella-emojis__boto')).not.toBeNull();
    expect(document.activeElement).toBe(document.body);
    expect(shadow.activeElement).toBeNull();
    expect(focus).not.toHaveBeenCalled();
    focus.mockRestore();
  } finally {
    netejaEncastat();
  }
});

test('encastat: amb el focus on el va deixar el diàleg, el catàleg el passa al primer emoji (dins de l’arrel d’ombra)', async () => {
  try {
    const dades = diferit();
    const { shadow } = muntaEncastat(<DialegEmoticona obert onTanca={vi.fn()} onDesa={vi.fn()} carregaCataleg={() => dades.promesa} />);
    await act(async () => {});
    const inicial = shadow.activeElement;
    expect(inicial).not.toBeNull();
    await act(async () => { dades.resol({ GRUPS_EMOJIS: GRUPS }); });
    await act(async () => {});
    expect(shadow.activeElement?.getAttribute('aria-label')).toBe('grinning face');
  } finally {
    netejaEncastat();
  }
});

test('encastat: el «Torna-ho a provar» que se’n va amb el focus el deixa al <dialog> (modalLocal) i el catàleg el passa al primer emoji', async () => {
  try {
    // El primer commit del Dialeg local és de sonda (la graella es munta dues vegades): falla fins que la xarxa torna.
    let senseXarxa = true;
    const carrega = vi.fn(async () => {
      if (senseXarxa) throw new Error('xarxa');
      return { GRUPS_EMOJIS: GRUPS };
    });
    const { shadow, root } = muntaEncastat(<DialegEmoticona obert onTanca={vi.fn()} onDesa={vi.fn()} carregaCataleg={carrega} />);
    const reintent = await within(root).findByRole('button', { name: 'Torna-ho a provar' });
    senseXarxa = false;
    act(() => reintent.focus());
    expect(shadow.activeElement).toBe(reintent);
    fireEvent.click(reintent);
    await within(root).findByRole('button', { name: 'grinning face' });
    await act(async () => {});
    expect(shadow.activeElement?.getAttribute('aria-label')).toBe('grinning face');
  } finally {
    netejaEncastat();
  }
});

test('dins d’un diàleg obert, amb el focus al <body> que no ha perdut la graella, el catàleg no el mou', async () => {
  const dades = diferit();
  render(<DialegDeProva carrega={() => dades.promesa} />);
  act(() => screen.getByRole('button', { name: 'Tancar' }).focus());
  act(() => document.activeElement.blur());
  expect(document.activeElement).toBe(document.body);
  await act(async () => { dades.resol({ GRUPS_EMOJIS: GRUPS }); });
  await screen.findByRole('button', { name: 'grinning face' });
  expect(document.activeElement).toBe(document.body);
});

/* P1-06 (abans: es pintava i es refusava en triar-lo) · Un glif que este
   navegador no reconeix com a emoji ja no es pinta: ni botó, ni avís, i el
   recompte de la família només compta els que es veuen. La cerca tampoc no
   el troba. Amb textNoReconegut, el que es veu es tria i arriba a onTria. */
test('P1-06 · un glif que este navegador no reconeix no es pinta: ni botó, ni avís, ni a la cerca', async () => {
  const onTria = vi.fn();
  const grups = [{ id: 'x', nom: 'Proves', emojis: [['00A9', '©', 'copyright'], ['1F345', '🍅', 'tomato']] }];
  render(<GraellaEmojis carregaCataleg={cataleg(grups)} onTria={onTria} textNoReconegut={(glif) => `No reconec ${glif}.`} potPintar={null} />);
  await screen.findByRole('button', { name: 'tomato' });
  expect(screen.queryByRole('button', { name: 'copyright' })).toBeNull();
  expect(screen.getByText('Proves (1)')).toBeTruthy();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cerca un emoji' }), { target: { value: 'copy' } });
  expect(screen.getByRole('status').textContent).toBe('Cap emoji amb eixe nom.');
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cerca un emoji' }), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
  expect(onTria).toHaveBeenCalledWith('🍅', 'tomato');
  expect(screen.queryByText(/^No reconec/)).toBeNull();
});

test('sense textNoReconegut, onTria rep el glif tal qual i no hi ha cap avís', async () => {
  const onTria = vi.fn();
  render(<GraellaEmojis carregaCataleg={cataleg([{ id: 'x', nom: 'Proves', emojis: [['2764 FE0F', '❤️', 'red heart']] }])} onTria={onTria} />);
  fireEvent.click(await screen.findByRole('button', { name: 'red heart' }));
  expect(onTria).toHaveBeenCalledWith('❤️', 'red heart');
  expect(document.querySelector('.sdp-classificacio-dialeg__avis')).toBeNull();
});

/* P1-06 · El tipus de lletra: el detector de pintat (utils/emojiPintable.js)
   s'injecta, i cap prova no depén del canvas de jsdom. Les amplades són les
   del banc de Chrome 156 a macOS (261030): un emoji, 32; el tofu, 20,28. */
test('P1-06 · el que el navegador no sap pintar (tofu, seqüència partida) no es pinta; una família buida desapareix', async () => {
  const onTria = vi.fn();
  const AMPLES = new Map([['\u{1FFFD}', 20.28], ['\u{1F600}‍\u{1F600}', 64], ['\u{1FAF9}', 20.28], ['\u{1FAF9}\u{1F3FB}', 52.28], ['\u{1F426}‍\u{1F525}', 64], ['\u{1F6D9}', 20.28]]);
  const potPintar = creaDetectorDePintat((text) => AMPLES.get(text) ?? 32);
  const grups = [
    { id: 'mans', nom: 'Mans', emojis: [['1FAF9', '\u{1FAF9}', 'leftwards pushing hand nou'], ['1F44B', '👋', 'waving hand'], ['1FAF9 1F3FB', '\u{1FAF9}\u{1F3FB}', 'nou: to clar']] },
    { id: 'aus', nom: 'Aus', emojis: [['1F426 200D 1F525', '\u{1F426}‍\u{1F525}', 'phoenix']] },
    { id: 'llocs', nom: 'Llocs', emojis: [['1F345', '🍅', 'tomato']] }
  ];
  render(<GraellaEmojis carregaCataleg={cataleg(grups)} onTria={onTria} potPintar={potPintar} />);
  await screen.findByRole('button', { name: 'waving hand' });
  expect([...document.querySelectorAll('summary')].map((s) => s.textContent)).toEqual(['Mans (1)', 'Llocs (1)']);
  expect(screen.queryByRole('button', { name: /nou/ })).toBeNull();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cerca un emoji' }), { target: { value: 'phoenix' } });
  expect(screen.getByRole('status').textContent).toBe('Cap emoji amb eixe nom.');
});

test('P1-06 · sota jsdom (cap canvas), el detector per defecte no filtra res que el motor reconega i no toca el canvas', async () => {
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
  render(<GraellaEmojis carregaCataleg={cataleg()} onTria={vi.fn()} />);
  expect(await screen.findByRole('button', { name: 'grinning face' })).toBeTruthy();
  expect([...document.querySelectorAll('summary')].map((s) => s.textContent)).toEqual(['Cares i emocions (3)', 'Menjar i beguda (2)']);
  expect(getContext).not.toHaveBeenCalled();
  getContext.mockRestore();
});

test('si les dades no arriben, ho diu i «Torna-ho a provar» les torna a demanar', async () => {
  const carrega = vi.fn().mockRejectedValueOnce(new Error('xarxa')).mockResolvedValueOnce({ GRUPS_EMOJIS: GRUPS });
  render(<GraellaEmojis carregaCataleg={carrega} onTria={vi.fn()} />);
  expect((await screen.findByRole('alert')).textContent).toContain('No s’han pogut carregar els emojis.');
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect(await screen.findByRole('button', { name: 'grinning face' })).toBeTruthy();
  expect(carrega).toHaveBeenCalledTimes(2);
});

/* P1-06 · Del catàleg de veres (3972 entrades, Unicode 18) es pinten els que
   el motor reconeix: Node 24 no en coneix 16 (🫪 🫹 🛙…), Chrome 156, 9. */
test('amb el catàleg de veres: la primera família oberta, amb els que el motor reconeix, i la de Persones sense cap botó', async () => {
  const carrega = () => import('../../../sections/disseny/cataleg/dades/emojisUnicode18.js');
  render(<GraellaEmojis carregaCataleg={carrega} onTria={vi.fn()} />);
  await screen.findByRole('button', { name: 'grinning face' });
  const { GRUPS_EMOJIS } = await carrega();
  const reconeguts = GRUPS_EMOJIS[0].emojis.filter(([, glif]) => emojiSol(glif));
  expect(within(familia('Cares i emocions')).getAllByRole('button')).toHaveLength(reconeguts.length);
  expect(within(familia('Persones i cos')).queryAllByRole('button')).toEqual([]);
  expect(document.querySelectorAll('.sdp-graella-emojis__boto')).toHaveLength(reconeguts.length);
  expect(screen.getByText(`Cares i emocions (${reconeguts.length})`)).toBeTruthy();
}, 30000);

/* ── DialegEmoticona ───────────────────────────────────────────────────── */

test('DialegEmoticona sense carregaCataleg: el de sempre, amb la drecera de l’OS i sense graella', () => {
  render(<DialegEmoticona obert onTanca={vi.fn()} actual="🍅" onDesa={vi.fn()} />);
  const dialeg = screen.getByRole('dialog', { name: 'Emoticona del document' });
  expect(dialeg.className).toContain('sdp-dialeg--s');
  expect(within(dialeg).getByText(/Control \+ Ordre \+ Espai/)).toBeTruthy();
  expect(within(dialeg).queryByRole('searchbox')).toBeNull();
  expect(dialeg.querySelector('.sdp-graella-emojis')).toBeNull();
  expect(document.activeElement).toBe(within(dialeg).getByRole('textbox', { name: 'Emoticona' }));
});

test('DialegEmoticona amb carregaCataleg: la graella en lloc de la drecera, mida «g», i un clic assigna', async () => {
  const onDesa = vi.fn();
  render(<DialegEmoticona obert onTanca={vi.fn()} actual="🍅" onDesa={onDesa} carregaCataleg={cataleg()} />);
  const dialeg = screen.getByRole('dialog', { name: 'Emoticona del document' });
  expect(dialeg.className).toContain('sdp-dialeg--g');
  expect(within(dialeg).queryByText(/Control \+ Ordre/)).toBeNull();
  expect(within(dialeg).getByText('Toca una emoticona de la graella, o escriu-ne o apega-ne una ací.')).toBeTruthy();
  fireEvent.click(await within(dialeg).findByRole('button', { name: 'winking face' }));
  expect(onDesa).toHaveBeenLastCalledWith('😉');
  // El camp continua com a alternativa de teclat (sense autoFocus), amb Desar i Llevar.
  const camp = within(dialeg).getByRole('textbox', { name: 'Emoticona' });
  expect(document.activeElement).not.toBe(camp);
  fireEvent.change(camp, { target: { value: '🧱' } });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenLastCalledWith('🧱');
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Llevar' }));
  expect(onDesa).toHaveBeenLastCalledWith('');
});

/* P1-06 (abans: es pintava, es refusava i un avís ho deia) · Un glif que
   este navegador no reconeix com a emoji ni es pinta: no hi ha res a desar
   ni a refusar. */
test('DialegEmoticona · P1-06 · un glif que este navegador no reconeix com a emoji no es pinta ni es desa', async () => {
  const onDesa = vi.fn();
  const estranys = [{ id: 'x', nom: 'Proves', emojis: [['0061', 'a', 'latin small letter a'], ['1F345', '🍅', 'tomato']] }];
  render(<DialegEmoticona obert onTanca={vi.fn()} onDesa={onDesa} carregaCataleg={cataleg(estranys)} />);
  await screen.findByRole('button', { name: 'tomato' });
  expect(screen.queryByRole('button', { name: 'latin small letter a' })).toBeNull();
  expect(onDesa).not.toHaveBeenCalled();
  expect(screen.queryByText(/encara no reconeix/)).toBeNull();
});
