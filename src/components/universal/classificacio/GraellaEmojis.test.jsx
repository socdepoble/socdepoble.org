/* Bloc 3.8 del Gauntlet (261016) · La graella del catàleg Emojis XL: dades a
   demanda (la funció del consumidor), famílies plegables que només pinten els
   seus botons oberts, botons natius amb el nom oficial en anglès, cerca pel
   nom, tabulador mòbil amb les fletxes i un error que es pot reintentar. I el
   DialegEmoticona: amb `carregaCataleg`, la graella assigna; sense, el diàleg
   de sempre. Dades sintètiques i, en una prova, el catàleg de veres. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { GraellaEmojis } from './GraellaEmojis.jsx';
import { DialegEmoticona } from './DialegEmoticona.jsx';

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

test('si les dades no arriben, ho diu i «Torna-ho a provar» les torna a demanar', async () => {
  const carrega = vi.fn().mockRejectedValueOnce(new Error('xarxa')).mockResolvedValueOnce({ GRUPS_EMOJIS: GRUPS });
  render(<GraellaEmojis carregaCataleg={carrega} onTria={vi.fn()} />);
  expect((await screen.findByRole('alert')).textContent).toContain('No s’han pogut carregar els emojis.');
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect(await screen.findByRole('button', { name: 'grinning face' })).toBeTruthy();
  expect(carrega).toHaveBeenCalledTimes(2);
});

test('amb el catàleg de veres: 3972 entrades, la primera família oberta i la de Persones sense cap botó', async () => {
  const carrega = () => import('../../../sections/disseny/cataleg/dades/emojisUnicode18.js');
  render(<GraellaEmojis carregaCataleg={carrega} onTria={vi.fn()} />);
  await screen.findByRole('button', { name: 'grinning face' });
  const { GRUPS_EMOJIS } = await carrega();
  expect(within(familia('Cares i emocions')).getAllByRole('button')).toHaveLength(GRUPS_EMOJIS[0].emojis.length);
  expect(within(familia('Persones i cos')).queryAllByRole('button')).toEqual([]);
  expect(document.querySelectorAll('.sdp-graella-emojis__boto')).toHaveLength(GRUPS_EMOJIS[0].emojis.length);
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

test('DialegEmoticona · un glif que este navegador no reconeix com a emoji no es desa: un avís ho diu', async () => {
  const onDesa = vi.fn();
  const estranys = [{ id: 'x', nom: 'Proves', emojis: [['0061', 'a', 'latin small letter a']] }];
  render(<DialegEmoticona obert onTanca={vi.fn()} onDesa={onDesa} carregaCataleg={cataleg(estranys)} />);
  fireEvent.click(await screen.findByRole('button', { name: 'latin small letter a' }));
  expect(onDesa).not.toHaveBeenCalled();
  expect(screen.getByText('Este navegador encara no reconeix a com a emoji: no es pot desar.')).toBeTruthy();
});
