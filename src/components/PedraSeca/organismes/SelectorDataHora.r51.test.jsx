/* R51 (P0-49 / IDEA-180) · El selector de data i hora de publicació: zona i
   desfasament visibles, «Posar data i hora d'ara mateix» i els dos casos del
   canvi d'hora (hora inexistent i hora ambigua). La zona s'injecta
   (Europe/Madrid, Asia/Kathmandu): les hores de paret no depenen de la zona
   de la màquina. Els dies es trien a migdia o a les 02:30 de dies sense salt
   a la vora, lluny de la mitjanit. */
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SelectorDataHora } from './SelectorDataHora.jsx';

afterEach(cleanup);

function Controlat({ inicial = null, onTria = () => {}, ...props }) {
  const [valor, setValor] = useState(inicial);
  return <SelectorDataHora valor={valor} onTria={(iso) => { onTria(iso); setValor(iso); }} {...props} />;
}

const obri = () => act(() => { fireEvent.click(screen.getByRole('button', { name: /Data de publicació/ })); });
const campHora = () => screen.getByLabelText('Hora');
const canviaHora = (valor) => act(() => { fireEvent.change(campHora(), { target: { value: valor } }); });
const dia = (patro) => screen.getByRole('button', { name: patro });
const regioViva = () => screen.getByRole('dialog', { name: 'Data de publicació' }).querySelector('[aria-live="polite"]');
const AMBIGUA = 'Eixa hora passa dues vegades este dia pel canvi d’hora. Tria quina:';

test('sota l’«Hora», la zona IANA i el desfasament, com a descripció del camp', () => {
  render(<Controlat avui={new Date(Date.UTC(2026, 10, 7, 10, 0))} zona="Europe/Madrid" />);
  obri();
  const descripcio = document.getElementById(campHora().getAttribute('aria-describedby'));
  expect(descripcio.textContent).toContain('Zona: Europe/Madrid · UTC+01:00.');
  cleanup();
  render(<Controlat avui={new Date(Date.UTC(2026, 6, 7, 10, 0))} zona="Asia/Kathmandu" />);
  obri();
  expect(screen.getByText(/Zona: Asia\/Kathmandu · UTC\+05:45\./)).toBeTruthy();
});

test('amb data triada, el desfasament és el de l’instant triat (estiu), i l’hora es llig a la zona', () => {
  render(<Controlat inicial="2026-07-10T10:00:00.000Z" avui={new Date(Date.UTC(2026, 10, 7, 10, 0))} zona="Europe/Madrid" />);
  obri();
  expect(screen.getByText('Zona: Europe/Madrid · UTC+02:00.')).toBeTruthy();
  expect(campHora().value).toBe('12:00');
});

test('«Posar data i hora d’ara mateix» ompli l’esborrany amb el rellotge del clic, amb els mil·lisegons, i no tanca res', () => {
  const onTria = vi.fn();
  render(<Controlat onTria={onTria} avui={new Date(Date.UTC(2026, 10, 7, 10, 30, 1, 234))} zona="Europe/Madrid" />);
  obri();
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Posar data i hora d’ara mateix' })); });
  expect(onTria).toHaveBeenCalledTimes(1);
  expect(onTria).toHaveBeenCalledWith('2026-11-07T10:30:01.234Z');
  // La finestra continua oberta: «Fet» la tanca. L'hora visible és la de la zona.
  expect(screen.getByRole('dialog', { name: 'Data de publicació' })).toBeTruthy();
  expect(campHora().value).toBe('11:30');
});

test('sense rellotge injectat, el botó pren l’hora del moment del clic', () => {
  const onTria = vi.fn();
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 7, 9, 0, 0, 5)));
    render(<Controlat onTria={onTria} zona="Europe/Madrid" />);
    obri();
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 7, 9, 0, 42, 7)));
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Posar data i hora d’ara mateix' })); });
    expect(onTria).toHaveBeenCalledWith('2026-11-07T09:00:42.007Z');
  } finally {
    vi.useRealTimers();
  }
});

test('una hora que el canvi d’estiu se salta no es desa: error al camp i cap onTria', () => {
  const onTria = vi.fn();
  render(<Controlat onTria={onTria} avui={new Date(Date.UTC(2026, 2, 20, 11, 0))} zona="Europe/Madrid" />);
  obri();
  canviaHora('02:30');
  expect(onTria).toHaveBeenLastCalledWith('2026-03-20T01:30:00.000Z');
  act(() => { fireEvent.click(dia(/29 de març del? 2026/)); });
  expect(onTria).toHaveBeenCalledTimes(1);
  // L'error, al camp (descripció) i, VU-03, també a la regió viva educada.
  expect(document.getElementById(`${campHora().id}-error`)?.textContent).toBe('Eixa hora no existix este dia pel canvi d’hora. Tria’n una altra.');
  expect(regioViva().textContent).toBe('Eixa hora no existix este dia pel canvi d’hora. Tria’n una altra.');
  expect(campHora().getAttribute('aria-invalid')).toBe('true');
  // Una hora que sí que existix EIXE dia (el 29, encara no desat) esborra l'error i es desa en eixe dia.
  canviaHora('03:30');
  expect(onTria).toHaveBeenCalledTimes(2);
  expect(onTria).toHaveBeenLastCalledWith('2026-03-29T01:30:00.000Z');
  expect(screen.queryByText('Eixa hora no existix este dia pel canvi d’hora. Tria’n una altra.')).toBeNull();
});

test('una hora que el canvi d’hivern repetix demana el desfasament, i només llavors es desa', () => {
  const onTria = vi.fn();
  render(<Controlat onTria={onTria} avui={new Date(Date.UTC(2026, 9, 20, 10, 0))} zona="Europe/Madrid" />);
  obri();
  canviaHora('02:30');
  expect(onTria).toHaveBeenLastCalledWith('2026-10-20T00:30:00.000Z');
  act(() => { fireEvent.click(dia(/25 d.octubre del? 2026/)); });
  expect(onTria).toHaveBeenCalledTimes(1);
  const grup = screen.getByRole('group', { name: 'Eixa hora passa dues vegades este dia pel canvi d’hora. Tria quina:' });
  expect(grup).toBeTruthy();
  const estiu = screen.getByRole('radio', { name: '02:30 UTC+02:00' });
  const hivern = screen.getByRole('radio', { name: '02:30 UTC+01:00' });
  expect(estiu.checked || hivern.checked).toBe(false);
  act(() => { fireEvent.click(hivern); });
  expect(onTria).toHaveBeenCalledTimes(2);
  expect(onTria).toHaveBeenLastCalledWith('2026-10-25T01:30:00.000Z');
  expect(screen.queryByRole('group', { name: /passa dues vegades/ })).toBeNull();
});

/* VU-01 · Teclejar l'hora desa cada pulsació completa (T40), però si el que es
   tecleja acaba ambigu, l'esborrany no es queda amb la intermèdia (00:03 camí
   de 02:30): torna a l'últim valor triat de veres fins que es tria el
   desfasament. Tancar sense triar-lo deixa eixe valor, no la intermèdia. */
test('VU-01 · una hora teclejada que acaba ambigua no deixa cap valor intermedi a l’esborrany', () => {
  const onTria = vi.fn();
  const inicial = '2026-10-25T08:00:00.000Z'; // 09:00 a Madrid, el dia del canvi d'hivern
  render(<Controlat inicial={inicial} onTria={onTria} avui={new Date(Date.UTC(2026, 9, 20, 10, 0))} zona="Europe/Madrid" />);
  obri();
  act(() => { campHora().focus(); });
  canviaHora('00:03');
  expect(onTria).toHaveBeenLastCalledWith('2026-10-24T22:03:00.000Z');
  canviaHora('02:30');
  // L'esborrany torna al valor de quan es va entrar al camp; el camp diu 02:30 i pregunta.
  expect(onTria).toHaveBeenLastCalledWith(inicial);
  expect(campHora().value).toBe('02:30');
  expect(screen.getByRole('group', { name: AMBIGUA })).toBeTruthy();
  const pastilla = screen.getByRole('button', { name: /Data de publicació/ });
  expect(pastilla.textContent).toContain('09:00');
  // Triat el desfasament, es desa la tria.
  act(() => { fireEvent.click(screen.getByRole('radio', { name: '02:30 UTC+02:00' })); });
  expect(onTria).toHaveBeenLastCalledWith('2026-10-25T00:30:00.000Z');
});

test('VU-01 · tancar amb «Fet» sense triar el desfasament deixa l’últim valor triat; una hora inexistent teclejada, igual', () => {
  const onTria = vi.fn();
  const inicial = '2026-03-29T08:00:00.000Z'; // 10:00 a Madrid, el dia del canvi d'estiu
  render(<Controlat inicial={inicial} onTria={onTria} avui={new Date(Date.UTC(2026, 2, 20, 10, 0))} zona="Europe/Madrid" />);
  obri();
  canviaHora('01:30');
  expect(onTria).toHaveBeenLastCalledWith('2026-03-29T00:30:00.000Z');
  canviaHora('02:30');
  expect(onTria).toHaveBeenLastCalledWith(inicial);
  expect(campHora().getAttribute('aria-invalid')).toBe('true');
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Fet' })); });
  expect(screen.getByRole('button', { name: /Data de publicació/ }).textContent).toContain('10:00');
  expect(onTria).toHaveBeenLastCalledWith(inicial);
});

/* V2-05 · Un dia triat amb l'hora ambigua queda pendent; una hora teclejada
   vàlida el resol i el desa. Una pulsació ambigua de després no pot tornar
   l'esborrany al dia d'abans (el 20): el dia triat (el 25) es queda. */
test('V2-05 · una pulsació ambigua després d’una hora vàlida en un dia pendent no perd el dia triat', () => {
  const onTria = vi.fn();
  const inicial = '2026-10-20T00:30:00.000Z'; // 02:30 a Madrid (UTC+02:00), el 20 d'octubre
  render(<Controlat inicial={inicial} onTria={onTria} avui={new Date(Date.UTC(2026, 9, 20, 10, 0))} zona="Europe/Madrid" />);
  obri();
  expect(campHora().value).toBe('02:30');
  act(() => { fireEvent.click(dia(/25 d.octubre del? 2026/)); });
  // El 25 a les 02:30 és ambigu: pregunta i no desa res.
  expect(onTria).not.toHaveBeenCalled();
  expect(screen.getByRole('group', { name: AMBIGUA })).toBeTruthy();
  canviaHora('05:00');
  expect(onTria).toHaveBeenLastCalledWith('2026-10-25T04:00:00.000Z');
  expect(screen.queryByRole('group', { name: AMBIGUA })).toBeNull();
  const crides = onTria.mock.calls.length;
  canviaHora('02:45');
  // Abans: onTria(inicial), el 20. Ara cap crida més: l'esborrany es queda el 25.
  expect(onTria).toHaveBeenCalledTimes(crides);
  expect(onTria).toHaveBeenLastCalledWith('2026-10-25T04:00:00.000Z');
  expect(screen.getByRole('radio', { name: '02:45 UTC+02:00' })).toBeTruthy();
  // Tancar sense triar el desfasament deixa el 25, no el 20.
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Fet' })); });
  const pastilla = screen.getByRole('button', { name: /Data de publicació/ });
  expect(pastilla.textContent).toContain('05:00');
  expect(pastilla.getAttribute('aria-label')).toMatch(/25 d.octubre/);
  // En tornar a obrir, el desfasament triat s'aplica al 25.
  obri();
  canviaHora('02:45');
  act(() => { fireEvent.click(screen.getByRole('radio', { name: '02:45 UTC+01:00' })); });
  expect(onTria).toHaveBeenLastCalledWith('2026-10-25T01:45:00.000Z');
});

test('V2-05 · igual amb una hora inexistent (canvi d’estiu): el dia triat es queda i la següent hora vàlida hi va', () => {
  const onTria = vi.fn();
  const inicial = '2026-03-20T01:30:00.000Z'; // 02:30 a Madrid (UTC+01:00), el 20 de març
  render(<Controlat inicial={inicial} onTria={onTria} avui={new Date(Date.UTC(2026, 2, 20, 10, 0))} zona="Europe/Madrid" />);
  obri();
  act(() => { fireEvent.click(dia(/29 de març del? 2026/)); });
  expect(onTria).not.toHaveBeenCalled();
  expect(campHora().getAttribute('aria-invalid')).toBe('true');
  canviaHora('04:00');
  expect(onTria).toHaveBeenLastCalledWith('2026-03-29T02:00:00.000Z');
  canviaHora('02:15');
  expect(onTria).toHaveBeenLastCalledWith('2026-03-29T02:00:00.000Z');
  expect(onTria).not.toHaveBeenCalledWith(inicial);
  expect(campHora().getAttribute('aria-invalid')).toBe('true');
  canviaHora('03:15');
  expect(onTria).toHaveBeenLastCalledWith('2026-03-29T01:15:00.000Z');
});

/* VU-02 · La pregunta del desfasament gestiona el focus i s'anuncia. */
test('VU-02 · d’un dia triat: el focus va al primer desfasament, s’anuncia, i triat torna al dia (mai a BODY)', () => {
  const onTria = vi.fn();
  render(<Controlat onTria={onTria} avui={new Date(Date.UTC(2026, 9, 20, 10, 0))} zona="Europe/Madrid" />);
  obri();
  expect(regioViva().textContent).toBe('');
  canviaHora('02:30');
  const diumenge = dia(/25 d.octubre del? 2026/);
  act(() => { diumenge.focus(); fireEvent.click(diumenge); });
  const estiu = screen.getByRole('radio', { name: '02:30 UTC+02:00' });
  expect(document.activeElement).toBe(estiu);
  expect(regioViva().textContent).toBe(AMBIGUA);
  act(() => { fireEvent.click(screen.getByRole('radio', { name: '02:30 UTC+01:00' })); });
  expect(onTria).toHaveBeenLastCalledWith('2026-10-25T01:30:00.000Z');
  expect(screen.queryByRole('group', { name: AMBIGUA })).toBeNull();
  expect(document.activeElement).toBe(within(screen.getByRole('dialog', { name: 'Data de publicació' })).getByRole('button', { name: /25 d.octubre del? 2026/ }));
  expect(screen.getByRole('dialog', { name: 'Data de publicació' }).contains(document.activeElement)).toBe(true);
  expect(regioViva().textContent).toBe('');
});

test('VU-02 · del teclat del camp «Hora»: s’anuncia però no roba el focus; triat, el focus torna al camp', () => {
  render(<Controlat avui={new Date(Date.UTC(2026, 9, 25, 10, 0))} zona="Europe/Madrid" />);
  obri();
  act(() => { campHora().focus(); });
  canviaHora('02:30');
  expect(regioViva().textContent).toBe(AMBIGUA);
  expect(document.activeElement).toBe(campHora());
  act(() => { fireEvent.click(screen.getByRole('radio', { name: '02:30 UTC+01:00' })); });
  expect(document.activeElement).toBe(campHora());
});
