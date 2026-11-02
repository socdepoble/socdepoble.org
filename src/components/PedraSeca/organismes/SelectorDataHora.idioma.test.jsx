import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { carregaDiccionari, createTranslator } from '../../../config/i18n.js';
import '../../../../tests/helpers/diccionaris.js';
import { ETIQUETA_RESERVA_ARA } from '../../universal/barres/dataHoraBarra.js';

const dobles = vi.hoisted(() => ({ t: null }));
vi.mock('../hooks/useTraductorOpcional.js', async (importOriginal) => ({
  ...await importOriginal(), useTraductorOpcional: () => dobles.t
}));
import { SelectorDataHora } from './SelectorDataHora.jsx';

afterEach(() => { cleanup(); dobles.t = null; });
const AVUI = new Date(2026, 8, 28, 10, 7);

test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: el nom accessible, les instruccions i les accions es tradueixen', async (idioma) => {
  await carregaDiccionari(idioma);
  const t = createTranslator(idioma);
  dobles.t = t;
  render(<SelectorDataHora avui={AVUI} reserva={{ time: '10:07', date: '28/09/26' }} etiquetaReserva={ETIQUETA_RESERVA_ARA} />);
  const boto = screen.getByRole('button');
  expect(boto.getAttribute('aria-label')).toContain(t('editor.data.etiqueta'));
  expect(boto.getAttribute('aria-label')).toContain(t('editor.data.ara'));
  expect(boto.getAttribute('aria-label')).not.toMatch(/\{\w+\}/);
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: t('editor.data.etiqueta') });
  expect(dialeg.textContent).toContain(t('editor.data.descripcio'));
  expect(within(dialeg).getByRole('button', { name: t('editor.data.senseData') })).toBeTruthy();
  expect(within(dialeg).getByRole('button', { name: t('editor.data.fet') })).toBeTruthy();
  expect(within(dialeg).getByLabelText(t('editor.data.hora'))).toBeTruthy();
  expect(dialeg.textContent).toContain(t('editor.data.ajudaHora'));
});

test('les etiquetes pròpies es conserven literalment, també amb marcadors i símbols de reemplaçament', async () => {
  await carregaDiccionari('en'); dobles.t = createTranslator('en');
  render(<SelectorDataHora avui={AVUI} etiqueta="Acte {visible} $&" etiquetaReserva="reserva $&" reserva={{ time: '10:07' }} />);
  const nom = screen.getByRole('button').getAttribute('aria-label');
  expect(nom).toContain('Acte {visible} $&');
  expect(nom).toContain('reserva $&');
});
