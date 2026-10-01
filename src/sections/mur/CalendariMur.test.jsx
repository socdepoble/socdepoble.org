/**
 * Ordre del Mestre, 261001 · CalendariMur (abans AgendaMur) és el calendari
 * del Mur i de la pàgina /calendari. Al Mur porta el mes sol; la pàgina li dona
 * els esdeveniments ja fets, el mes controlat i els textos de les targetes.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { CalendariMur, TEXTOS_ACTES, deMes } from './CalendariMur.jsx';
import { acteAEsdeveniment } from './agendaMur.js';

afterEach(cleanup);

const AVUI = new Date(2026, 9, 1, 12, 0);
const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-11-14' };
const caption = () => document.querySelector('.sdp-calendari--gran caption').textContent;
const nomMes = (any, mes) => new Date(any, mes, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });

test('sense cursor controlat, porta el mes sol: el de l’acte que ve més prompte', () => {
  render(<CalendariMur actes={[FIRA]} avui={AVUI} />);
  expect(caption()).toBe(nomMes(2026, 10));
  act(() => screen.getByRole('button', { name: 'Mes següent' }).click());
  expect(caption()).toBe(nomMes(2026, 11));
});

test('amb cursor controlat, mana el de qui el munta i les fletxes només ho demanen', () => {
  const onCanviaCursor = vi.fn();
  const esdeveniments = [acteAEsdeveniment(FIRA)];
  render(<CalendariMur esdeveniments={esdeveniments} cursor={{ any: 2026, mes: 9 }} onCanviaCursor={onCanviaCursor} avui={AVUI} />);
  expect(caption()).toBe(nomMes(2026, 9));
  act(() => screen.getByRole('button', { name: 'Mes següent' }).click());
  expect(onCanviaCursor).toHaveBeenLastCalledWith({ any: 2026, mes: 10 });
  expect(caption()).toBe(nomMes(2026, 9));
});

test('els textos són de qui el munta: el recompte del dia i el mes buit, amb la preposició apostrofada', () => {
  const textos = { ...TEXTOS_ACTES, recompte: (n) => `${n} targetes`, mesBuit: (mes) => `Cap targeta al calendari ${mes}.` };
  render(<CalendariMur esdeveniments={[acteAEsdeveniment(FIRA)]} cursor={{ any: 2026, mes: 9 }} onCanviaCursor={() => {}}
    onTriaDia={() => {}} textos={textos} avui={AVUI} />);
  expect(screen.getByText(`Cap targeta al calendari d’${nomMes(2026, 9)}. N’hi ha en altres mesos: passa de mes amb les fletxes.`)).toBeTruthy();
  expect(document.querySelector('.sdp-calendari__cella').getAttribute('aria-label')).toMatch(/ · 0 targetes$/);
});

test('deMes: «de» davant de consonant i «d’» davant de vocal', () => {
  expect(deMes('febrer de 2023')).toBe('de febrer de 2023');
  expect(['abril de 2026', 'agost de 2026', 'octubre de 2026'].map(deMes))
    .toEqual(['d’abril de 2026', 'd’agost de 2026', 'd’octubre de 2026']);
  expect(TEXTOS_ACTES.mesBuit(deMes('octubre de 2026'))).toBe('Cap acte al calendari d’octubre de 2026.');
  expect(TEXTOS_ACTES.recompte(1)).toBe('1 acte');
});
