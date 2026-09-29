/* T40 (ordre del Mestre, 260928) · La pastilla de data de la barra taronja
   obri el mes en xicotet dins de la finestra de la barra. Sense jsdom
   showModal: el Dialeg posa l'atribut `open` i getByRole('dialog') el troba. */
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SelectorDataHora } from './SelectorDataHora.jsx';
import { horaDe } from '../../../utils/calendari.js';
import { ETIQUETA_RESERVA_ARA } from '../../universal/barres/dataHoraBarra.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const AVUI = new Date(2026, 8, 28, 10, 7);

function Controlat({ inicial = null, onTria = () => {}, ...props }) {
  const [valor, setValor] = useState(inicial);
  return <SelectorDataHora valor={valor} onTria={(iso) => { onTria(iso); setValor(iso); }} avui={AVUI} {...props} />;
}

/* Sense ancorar a l'inici: amb data triada, el nom comença pel text visible (WCAG 2.5.3). */
const pastilla = () => screen.getByRole('button', { name: /Data de publicació/ });
const textVisible = (boto) => [...boto.querySelectorAll('span')].map((s) => s.textContent).join(' ');
const obri = () => act(() => { fireEvent.click(pastilla()); });

test('la pastilla és un botó .btn-date-time que obri la finestra de la barra', () => {
  render(<Controlat reserva={{ time: '10:07', date: '28/09/26' }} />);
  const boto = pastilla();
  expect(boto.tagName).toBe('BUTTON');
  expect(boto.className).toBe('btn-date-time');
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  expect(boto.getAttribute('aria-expanded')).toBe('false');
  /* Sense data triada, la pastilla diu la reserva i el nom ho explica.
     Correcció W3A D3 · Sense etiqueta pròpia, la reserva és «la data i l'hora
     d'ara»: el nom mai parla de l'última edició, que la regla prohibix. */
  expect(boto.textContent).toBe('10:0728/09/26');
  expect(boto.getAttribute('aria-label')).toContain('sense triar');
  expect(boto.getAttribute('aria-label')).toContain(`ara es mostra ${ETIQUETA_RESERVA_ARA} (10:07 28/09/26)`);
  expect(boto.getAttribute('aria-label')).not.toContain('última edició');
  obri();
  const dialeg = screen.getByRole('dialog', { name: 'Data de publicació' });
  expect(dialeg.className).toContain('sdp-dialeg--barra');
  expect(boto.getAttribute('aria-expanded')).toBe('true');
});

/* T51 (decisió del Mestre, 260928) · cap document sense data: la pastilla mai
   diu «Data» ni queda buida; sense valor ni reserva, la data i l'hora d'ara. */
test('sense valor ni reserva, la pastilla diu la data i l’hora d’ara, i el nom ho explica', () => {
  render(<Controlat />);
  expect(textVisible(pastilla())).toBe('10:07 28/09/26');
  expect(pastilla().textContent).not.toContain('Data');
  expect(pastilla().getAttribute('aria-label')).toContain('sense triar');
  expect(pastilla().getAttribute('aria-label')).toContain('la data i l’hora d’ara (10:07 28/09/26)');
  cleanup();
  // Una reserva sense cap text compta com a absent.
  render(<Controlat reserva={{ time: '', date: '' }} />);
  expect(textVisible(pastilla())).toBe('10:07 28/09/26');
});

/* T51 · Regla d'edició (barres/dataHoraBarra.js · dataHoraEdicio): la tria
   tal qual; un valor de dia sol no pot vindre d'este calendari (sempre desa
   hora) i es mostra sense cap hora inventada (abans deia les «02:00» de la
   mitjanit UTC). */
test('T51 · amb una data triada, la pastilla la mostra en hora local; un dia sol, sense hora inventada', () => {
  render(<Controlat inicial={new Date(2026, 9, 3, 18, 30).toISOString()} reserva={{ time: '09:37', date: '02/01/26' }} />);
  expect(textVisible(pastilla())).toBe('18:30 03/10/26');
  cleanup();
  render(<Controlat inicial="2026-10-05" />);
  expect(textVisible(pastilla())).toBe('05/10/26');
  expect(pastilla().getAttribute('aria-label').startsWith('05/10/26. Data de publicació')).toBe(true);
});

/* Correcció W3A D3 · Una etiqueta de reserva pròpia es respecta tal qual. */
test('D3 · amb etiquetaReserva, el nom anomena la reserva amb eixe text', () => {
  render(<Controlat reserva={{ time: '09:00', date: '01/10/26' }} etiquetaReserva="la data prevista de l’acte" />);
  expect(pastilla().getAttribute('aria-label')).toContain('ara es mostra la data prevista de l’acte (09:00 01/10/26)');
});

/* Correcció W3A D4 · La tria i la pastilla ixen del MATEIX lector
   (editorial.js): un dia sol és aquell dia en hora local, no la mitjanit UTC
   (que a l'oest de Greenwich marcava el dia anterior i obria l'hora a les
   «02:00» a l'estiu de València). */
test('D4 · un dia sol: el nom, el dia marcat i la pastilla diuen el mateix dia, i l’hora no s’inventa', () => {
  render(<Controlat inicial="2026-10-05" />);
  expect(textVisible(pastilla())).toBe('05/10/26');
  expect(pastilla().getAttribute('aria-label')).toMatch(/^05\/10\/26\. Data de publicació: dilluns, 5 d.octubre /);
  obri();
  const dialeg = screen.getByRole('dialog');
  const marcat = within(dialeg).getByRole('button', { pressed: true });
  expect(marcat.textContent).toBe('5');
  expect(marcat.getAttribute('aria-label')).toMatch(/^dilluns, 5 d.octubre/);
  // Sense hora triada, el camp «Hora» s'obri a l'hora d'ara arrodonida (10:07 → 10:05), mai a una mitjanit.
  expect(within(dialeg).getByLabelText(/Hora/).value).toBe('10:05');
});

test('triar un dia desa el dia i l’hora locals a l’instant, i la finestra continua oberta', () => {
  const onTria = vi.fn();
  render(<Controlat onTria={onTria} />);
  obri();
  const dialeg = screen.getByRole('dialog');
  // El focus entra al dia de hui (cap dia triat encara).
  expect(document.activeElement.getAttribute('aria-current')).toBe('date');
  act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: /^dimarts, 15 de setembre/ })); });
  expect(onTria).toHaveBeenCalledTimes(1);
  const d = new Date(onTria.mock.calls[0][0]);
  expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 15]);
  // L'hora d'ara arrodonida a 5 minuts (10:07 → 10:05).
  expect(horaDe(d)).toBe('10:05');
  expect(screen.getByRole('dialog')).toBeTruthy();
  const triat = within(dialeg).getByRole('button', { name: /^dimarts, 15 de setembre/ });
  expect(triat.getAttribute('aria-pressed')).toBe('true');
  expect(within(dialeg).getByRole('button', { name: /^dilluns, 28 de setembre/ }).getAttribute('aria-pressed')).toBe('false');
  // La pastilla ja diu la data triada.
  expect(pastilla().textContent).toContain('10:05');
  expect(pastilla().getAttribute('aria-label')).not.toContain('sense triar');
  /* Poliment T40 · WCAG 2.5.3 (etiqueta en el nom): el nom accessible comença
     pel que es veu (hora i data curta); qui diu «10:05» per veu, l'encerta. */
  expect(textVisible(pastilla())).toBe('10:05 15/09/26');
  expect(pastilla().getAttribute('aria-label').startsWith('10:05 15/09/26')).toBe(true);
  expect(pastilla().getAttribute('aria-label')).toMatch(/dimarts, 15 de setembre/);
});

test('canviar l’hora desa el mateix dia amb l’hora nova; sense dia, s’aplica a hui', () => {
  const onTria = vi.fn();
  render(<Controlat onTria={onTria} inicial={new Date(2026, 8, 20, 8, 0).toISOString()} />);
  obri();
  const hora = screen.getByLabelText(/Hora/);
  expect(hora.getAttribute('type')).toBe('time');
  expect(hora.value).toBe('08:00');
  act(() => { fireEvent.change(hora, { target: { value: '18:30' } }); });
  const d = new Date(onTria.mock.calls.at(-1)[0]);
  expect([d.getDate(), horaDe(d)]).toEqual([20, '18:30']);
  cleanup();
  onTria.mockReset();
  render(<Controlat onTria={onTria} />);
  obri();
  act(() => { fireEvent.change(screen.getByLabelText(/Hora/), { target: { value: '07:15' } }); });
  const hui = new Date(onTria.mock.calls.at(-1)[0]);
  expect([hui.getDate(), horaDe(hui)]).toEqual([28, '07:15']);
});

/* Correcció C20 (260928) · En una pantalla curta, l'«Hora» davall del mes quedava fora de la vista. */
test('C20 · el camp «Hora» va damunt de la graella del mes', () => {
  render(<Controlat />);
  obri();
  const dialeg = screen.getByRole('dialog');
  const hora = within(dialeg).getByLabelText(/Hora/);
  const mes = within(dialeg).getByRole('region');
  expect(hora.compareDocumentPosition(mes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(hora.compareDocumentPosition(within(dialeg).getByRole('button', { name: 'Mes següent' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // El focus d'entrada continua sent el dia (no l'hora).
  expect(document.activeElement.classList.contains('sdp-calendari__dia')).toBe(true);
});

test('«Sense data» buida la data (null); sense res a buidar, no fa res', () => {
  const onTria = vi.fn();
  render(<Controlat onTria={onTria} inicial={new Date(2026, 8, 20, 8, 0).toISOString()} />);
  obri();
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Sense data' })); });
  expect(onTria).toHaveBeenLastCalledWith(null);
  const buit = screen.getByRole('button', { name: 'Sense data' });
  expect(buit.getAttribute('aria-disabled')).toBe('true');
  expect(buit.disabled).toBe(false);
  act(() => { fireEvent.click(buit); });
  expect(onTria).toHaveBeenCalledTimes(1);
});

test('una data futura porta l’avís honest; una passada, no', () => {
  const { unmount } = render(<Controlat inicial={new Date(2026, 9, 5, 9, 0).toISOString()} />);
  obri();
  expect(screen.getByRole('status').textContent).toContain('La data no programa res');
  unmount();
  render(<Controlat inicial={new Date(2026, 8, 1, 9, 0).toISOString()} />);
  obri();
  expect(screen.queryByText(/La data no programa res/)).toBeNull();
});

test('Escape i «Fet» tanquen; en tornar a obrir, el mes torna al del valor', () => {
  render(<Controlat inicial={new Date(2026, 8, 20, 8, 0).toISOString()} />);
  obri();
  let dialeg = screen.getByRole('dialog');
  expect(document.activeElement.getAttribute('aria-pressed')).toBe('true');
  act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Mes següent' })); });
  expect(within(dialeg).getByRole('region').getAttribute('aria-label')).toMatch(/octubre/);
  act(() => { fireEvent(dialeg, new Event('cancel', { cancelable: true })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  obri();
  dialeg = screen.getByRole('dialog');
  expect(within(dialeg).getByRole('region').getAttribute('aria-label')).toMatch(/setembre/);
  act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Fet' })); });
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* Correcció T40 · T38 amaga la barra taronja (display:none) en mòbil: un
   modal obert dins d'ella quedaria sense caixa i la pàgina, inert. */
test('si el disparador perd la caixa amb la finestra oberta (la barra s’amaga), la finestra es tanca', () => {
  let vigia = null;
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; vigia = this; }
    observe() {}
    disconnect() { if (vigia === this) vigia = null; }
  });
  render(<Controlat reserva={{ time: '09:37', date: '02/01/26' }} />);
  const boto = pastilla();
  let caixes = [{ width: 88, height: 44 }];
  boto.getClientRects = () => caixes;
  obri();
  expect(screen.getByRole('dialog', { name: 'Data de publicació' })).toBeTruthy();
  // Un canvi de mida amb caixa (la barra continua visible) no tanca res.
  act(() => { vigia.callback([]); });
  expect(screen.getByRole('dialog')).toBeTruthy();
  // La barra s'amaga: el disparador es queda sense caixa i la finestra es tanca.
  caixes = [];
  act(() => { vigia.callback([]); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(boto.getAttribute('aria-expanded')).toBe('false');
  // Tancada, ja no vigila.
  expect(vigia).toBeNull();
});

test('un disparador que mai no ha tingut caixa (jsdom) no tanca la finestra', () => {
  let vigia = null;
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; vigia = this; }
    observe() { this.callback([]); }
    disconnect() {}
  });
  render(<Controlat />);
  obri();
  act(() => { vigia.callback([]); });
  expect(screen.getByRole('dialog', { name: 'Data de publicació' })).toBeTruthy();
});

test('amb avisDesament, la descripció no promet el desat de sempre i l’avís ho diu en línia', () => {
  const AVIS = 'Al servidor encara no hi ha on guardar la data de publicació.';
  const descripcioDe = (dialeg) => document.getElementById(dialeg.getAttribute('aria-describedby')).textContent;
  const { unmount } = render(<Controlat avisDesament={AVIS} inicial={new Date(2026, 8, 1, 9, 0).toISOString()} />);
  obri();
  const dialeg = screen.getByRole('dialog', { name: 'Data de publicació' });
  expect(descripcioDe(dialeg)).not.toContain('Es desa sola');
  expect(descripcioDe(dialeg)).toContain('Si no en tries cap');
  expect(within(dialeg).getByRole('status').textContent).toContain(AVIS);
  unmount();
  render(<Controlat inicial={new Date(2026, 8, 1, 9, 0).toISOString()} />);
  obri();
  const normal = screen.getByRole('dialog', { name: 'Data de publicació' });
  expect(descripcioDe(normal)).toContain('Es desa sola, com la resta del document');
  expect(within(normal).queryByRole('status')).toBeNull();
});

test('cap atribut style i cap interactiu niat', () => {
  const { container } = render(<Controlat reserva={{ time: '09:37', date: '02/01/26' }} />);
  obri();
  expect(document.querySelector('[style]')).toBeNull();
  expect(container.querySelector('button button')).toBeNull();
});
