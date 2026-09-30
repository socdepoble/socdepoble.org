/* T6-T8 (ordre del Mestre, 260930) · L'organisme del mes amb esdeveniments.
   Sense onTriaDia és el DOM de T40 amb la variant gran; amb onTriaDia, cada
   dia és un botó amb nom complet. */
import React from 'react';
import { act, cleanup, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { CalendariEsdeveniments } from './CalendariEsdeveniments.jsx';
import { GraellaMes, NavegacioMes } from './CalendariMes.jsx';
import { creaEsdeveniment } from '../../../utils/esdeveniment.js';

afterEach(cleanup);

const AVUI = new Date(2026, 8, 28, 10, 0);
const SETEMBRE = { any: 2026, mes: 8 };
const aplec = creaEsdeveniment({ id: 'aplec', titol: 'Aplec', inici: { data: '2026-09-03' } });
const fira = creaEsdeveniment({ id: 'fira', titol: 'Fira de tardor', inici: { data: '2026-09-02' }, fi: { data: '2026-09-04' } });
const concert = creaEsdeveniment({ id: 'concert', titol: 'Concert', inici: { dataHora: '2026-09-28T22:00' } });
const ESDEVENIMENTS = [aplec, null, fira, concert];

test('sense onTriaDia: el DOM de T40 (NavegacioMes + GraellaMes) amb la variant gran', () => {
  const xip = (esd) => <div><span>{esd.id}</span></div>;
  const nou = render(
    <CalendariEsdeveniments esdeveniments={ESDEVENIMENTS} cursor={SETEMBRE} avui={AVUI} locale="ca-ES"
      navegacioClassName="sdp-consola__capcal" renderEsdeveniment={xip} />
  ).container.innerHTML;
  cleanup();
  const perDia = { 2: ['fira'], 3: ['aplec', 'fira'], 28: ['concert'] };
  const antic = render(
    <>
      <NavegacioMes className="sdp-consola__capcal" cursor={SETEMBRE} onCanvia={() => {}} avui={AVUI} />
      <GraellaMes any={2026} mes={8} locale="ca-ES" avui={AVUI} className="sdp-calendari--gran"
        renderDia={(dia, { numero }) => <>{numero}{(perDia[dia] ?? []).map((id) => <div key={id}><span>{id}</span></div>)}</>} />
    </>
  ).container.innerHTML;
  expect(nou).toBe(antic);
  expect(nou).not.toContain('<button type="button" class="sdp-calendari__cella"');
});

test('la píndola per defecte porta el títol, i la ranura va entre la navegació i la graella', () => {
  const { container } = render(
    <CalendariEsdeveniments esdeveniments={ESDEVENIMENTS} cursorInicial={SETEMBRE} avui={AVUI} locale="ca-ES">
      <p className="avis-de-prova">Cap acte</p>
    </CalendariEsdeveniments>
  );
  const pindoles = [...container.querySelectorAll('.sdp-calendari__pindola')].map((p) => p.textContent);
  expect(pindoles).toEqual(['Fira de tardor', 'Aplec', 'Fira de tardor', 'Concert']);
  const avis = container.querySelector('.avis-de-prova');
  expect(avis.previousElementSibling.querySelectorAll('button')).toHaveLength(3);
  expect(avis.nextElementSibling.getAttribute('role')).toBe('region');
  expect(avis.nextElementSibling.className).toBe('sdp-taula sdp-calendari--gran');
});

test('amb onTriaDia: cada dia és un botó amb aria-pressed, aria-current i el nom complet', () => {
  const onTriaDia = vi.fn();
  const { container, getByRole } = render(
    <CalendariEsdeveniments esdeveniments={ESDEVENIMENTS} cursorInicial={SETEMBRE} avui={AVUI} locale="ca-ES"
      titol="Agenda del poble" diaTriat="2026-09-03" onTriaDia={onTriaDia} recompte={(n) => (n === 1 ? '1 acte' : `${n} actes`)} />
  );
  const regio = getByRole('region', { name: 'Agenda del poble' });
  expect(regio.className).toBe('sdp-taula sdp-calendari--gran sdp-calendari--triable');
  const dies = within(regio).getAllByRole('button');
  expect(dies).toHaveLength(30);
  const tres = dies[2];
  expect(tres.getAttribute('aria-pressed')).toBe('true');
  expect(tres.getAttribute('aria-label')).toBe(
    `${new Date(2026, 8, 3).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · 2 actes: Aplec, Fira de tardor`
  );
  expect(dies[0].getAttribute('aria-label')).toMatch(/ · 0 actes$/);
  expect(dies[0].getAttribute('aria-pressed')).toBe('false');
  expect(container.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  expect(dies[27].getAttribute('aria-current')).toBe('date');
  act(() => dies[1].click());
  expect(onTriaDia).toHaveBeenLastCalledWith('2026-09-02');
});

test('el mes: cursorInicial es porta sol; amb cursor, el porta qui el passa', () => {
  const onCanviaCursor = vi.fn();
  const caption = (c) => c.querySelector('caption').textContent;
  const lliure = render(
    <CalendariEsdeveniments esdeveniments={ESDEVENIMENTS} cursorInicial={SETEMBRE} avui={AVUI} locale="ca-ES" onCanviaCursor={onCanviaCursor} />
  );
  const setembre = caption(lliure.container);
  act(() => lliure.getByRole('button', { name: 'Mes següent' }).click());
  expect(onCanviaCursor).toHaveBeenLastCalledWith({ any: 2026, mes: 9 });
  expect(caption(lliure.container)).not.toBe(setembre);
  expect(lliure.container.querySelector('.sdp-calendari__pindola')).toBeNull();
  cleanup();

  const controlat = render(
    <CalendariEsdeveniments esdeveniments={ESDEVENIMENTS} cursor={SETEMBRE} avui={AVUI} locale="ca-ES" onCanviaCursor={onCanviaCursor} />
  );
  act(() => controlat.getByRole('button', { name: 'Mes anterior' }).click());
  expect(onCanviaCursor).toHaveBeenLastCalledWith({ any: 2026, mes: 7 });
  expect(caption(controlat.container)).toBe(setembre);
});
