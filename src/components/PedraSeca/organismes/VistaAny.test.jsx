/* Fase visual (prompt 261001_0445) · La vista Any: dotze mesos xicotets de
   sis setmanes, els dies veïns atenuats i fora de l'arbre accessible, hui amb
   aria-current, un punt als dies amb actes (les mateixes ocurrències que la
   resta de vistes) i tot l'any com UN sol punt de tabulació, amb fletxes.
   Llavor neutra (cap dada de les captures). */
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { VistaAny } from './VistaAny.jsx';
import { creaEsdeveniment } from '../../../utils/esdeveniment.js';

afterEach(cleanup);

const AVUI = new Date(2026, 9, 1, 12, 0);
const mercat = creaEsdeveniment({ id: 'mercat', titol: 'Mercat dels dissabtes', inici: { data: '2026-01-03' }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] });
const fira = creaEsdeveniment({ id: 'fira', titol: 'Fira de tardor', inici: { data: '2026-10-16' }, fi: { data: '2026-10-18' } });
const acteA = creaEsdeveniment({ id: 'a', titol: 'Acte A', inici: { dataHora: '2026-10-17T10:00' } });
const capDAny = creaEsdeveniment({ id: 'cap', titol: 'Cap d’any', inici: { data: '2025-12-31' }, fi: { data: '2026-01-02' } });
const ESDEVENIMENTS = [mercat, null, fira, acteA, capDAny];
const dataLlarga = (d) => d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const pinta = (props = {}) => render(
  <VistaAny esdeveniments={ESDEVENIMENTS} any={2026} avui={AVUI} locale="ca-ES" titol="Any del poble" onTriaDia={() => {}} {...props} />
);
const dia = (container, clau) => container.querySelector(`[data-clau="${clau}"]`);

test('dotze mesos amb el seu nom i una taula de sis setmanes amb les abreviatures dels dies', () => {
  const { getByRole } = pinta();
  const regio = getByRole('region', { name: 'Any del poble' });
  const noms = within(regio).getAllByRole('heading', { level: 3 });
  expect(noms.map((h) => h.textContent)).toEqual(Array.from({ length: 12 }, (_, mes) => new Date(2026, mes, 1).toLocaleDateString('ca-ES', { month: 'long' })));
  const taules = within(regio).getAllByRole('table');
  expect(taules).toHaveLength(12);
  expect(taules[9].getAttribute('aria-labelledby')).toBe(noms[9].id);
  expect(within(taules[9]).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.', 'dg.']);
  expect(taules.every((t) => t.querySelectorAll('tbody tr').length === 6 && t.querySelectorAll('tbody td').length === 42)).toBe(true);
});

test('cada dia de l’any té UN botó, al seu mes; els dies veïns són atenuats, aria-hidden i quiets', () => {
  const { container } = pinta();
  expect(container.querySelectorAll('button.sdp-cal-any__dia')).toHaveLength(365);
  const veins = container.querySelectorAll('.sdp-cal-any__dia--fora');
  expect(veins).toHaveLength(12 * 42 - 365);
  expect([...veins].every((v) => v.tagName === 'SPAN' && v.getAttribute('aria-hidden') === 'true')).toBe(true);
  expect(new Set([...container.querySelectorAll('button[data-clau]')].map((b) => b.dataset.clau)).size).toBe(365);
  expect(container.querySelector('[style]')).toBeNull();
  cleanup();
  // Un any de traspàs en té 366.
  expect(pinta({ any: 2028 }).container.querySelectorAll('button.sdp-cal-any__dia')).toHaveLength(366);
});

test('el nom de cada dia diu la data llarga i el recompte; el punt marca els dies amb actes', () => {
  const { container } = pinta();
  expect(dia(container, '2026-10-17').getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 9, 17))} · 3 esdeveniments`);
  expect(dia(container, '2026-10-16').getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 9, 16))} · 1 esdeveniment`);
  expect(dia(container, '2026-10-15').getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 9, 15))} · 0 esdeveniments`);
  // Un acte que comença l'any d'abans compta l'1 de gener; el 2, ja no.
  expect(dia(container, '2026-01-01').getAttribute('aria-label')).toMatch(/ · 1 esdeveniment$/);
  expect(dia(container, '2026-01-02').getAttribute('aria-label')).toMatch(/ · 0 esdeveniments$/);
  expect(dia(container, '2026-10-17').querySelector('.sdp-cal-any__punt').className).toBe('sdp-cal-any__punt');
  expect(dia(container, '2026-10-15').querySelector('.sdp-cal-any__punt').className).toBe('sdp-cal-any__punt sdp-cal-any__punt--buit');
  // Els 52 dissabtes del mercat, més la fira, l'acte i el cap d'any (el 17 ja és dissabte).
  expect(container.querySelectorAll('button .sdp-cal-any__punt:not(.sdp-cal-any__punt--buit)')).toHaveLength(52 + 1 + 1);
});

test('hui porta aria-current; clicar un dia el passa a onTriaDia', () => {
  const onTriaDia = vi.fn();
  const { container } = pinta({ onTriaDia });
  expect(dia(container, '2026-10-01').getAttribute('aria-current')).toBe('date');
  expect(container.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  act(() => dia(container, '2026-03-18').click());
  expect(onTriaDia).toHaveBeenLastCalledWith('2026-03-18');
});

test('tot l’any és un sol punt de tabulació: hui, i les fletxes es mouen pels dies', () => {
  const { container, getByRole } = pinta();
  const tabulables = () => [...container.querySelectorAll('button[tabindex="0"]')].map((b) => b.dataset.clau);
  expect(tabulables()).toEqual(['2026-10-01']);
  expect(getByRole('region', { name: 'Any del poble' }).getAttribute('aria-describedby')).toBe(container.querySelector('.sdp-sr-only').id);
  act(() => dia(container, '2026-10-01').focus());
  act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' }); });
  expect(document.activeElement.dataset.clau).toBe('2026-10-02');
  expect(tabulables()).toEqual(['2026-10-02']);
  act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' }); });
  expect(document.activeElement.dataset.clau).toBe('2026-10-09');
  // ↑ i ← creuen el mes.
  act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' }); });
  act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' }); });
  expect(document.activeElement.dataset.clau).toBe('2026-09-25');
  // Una altra tecla no fa res.
  act(() => { fireEvent.keyDown(document.activeElement, { key: 'a' }); });
  expect(document.activeElement.dataset.clau).toBe('2026-09-25');
});

test('les fletxes no ixen de l’any; un any sense hui comença per l’1 de gener', () => {
  const { container } = pinta({ any: 2027 });
  expect([...container.querySelectorAll('button[tabindex="0"]')].map((b) => b.dataset.clau)).toEqual(['2027-01-01']);
  act(() => dia(container, '2027-01-01').focus());
  for (const key of ['ArrowLeft', 'ArrowUp']) act(() => { fireEvent.keyDown(document.activeElement, { key }); });
  expect(document.activeElement.dataset.clau).toBe('2027-01-01');
  act(() => dia(container, '2027-12-31').focus());
  for (const key of ['ArrowRight', 'ArrowDown']) act(() => { fireEvent.keyDown(document.activeElement, { key }); });
  expect(document.activeElement.dataset.clau).toBe('2027-12-31');
});

test('el dia triat es marca, ho diu el nom i és el punt de tabulació', () => {
  const { container } = pinta({ diaTriat: '2026-05-04' });
  const triat = dia(container, '2026-05-04');
  expect(triat.className).toBe('sdp-cal-any__dia sdp-cal-any__dia--triat');
  expect(triat.getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 4, 4))} · 0 esdeveniments · dia triat`);
  expect(triat.tabIndex).toBe(0);
  expect(dia(container, '2026-10-01').tabIndex).toBe(-1);
});

test('sense onTriaDia, els dies són quiets i el recompte va en text per al lector', () => {
  const { container, getByRole } = render(<VistaAny esdeveniments={ESDEVENIMENTS} any={2026} avui={AVUI} locale="ca-ES" />);
  const regio = getByRole('region', { name: 'Calendari de l’any 2026' });
  expect(regio.querySelector('button')).toBeNull();
  expect(regio.hasAttribute('aria-describedby')).toBe(false);
  const disset = [...container.querySelectorAll('.sdp-cal-any__dia:not(.sdp-cal-any__dia--fora)')][289];
  expect(disset.textContent).toBe('17 · 3 esdeveniments');
  expect(disset.querySelector('.sdp-sr-only').textContent).toBe(' · 3 esdeveniments');
});

test('un acte que es repetix massa sovint ho diu', () => {
  const campanades = creaEsdeveniment({ id: 'campanades', titol: 'Campanades', inici: { dataHora: '2026-01-01T00:00' }, recurrencia: ['RRULE:FREQ=HOURLY'] });
  const { getByText } = render(<VistaAny esdeveniments={[campanades]} any={2026} avui={AVUI} locale="ca-ES" />);
  expect(getByText('Algun acte es repetix massa sovint per a pintar-lo sencer: el trobaràs a les targetes.')).toBeTruthy();
});
