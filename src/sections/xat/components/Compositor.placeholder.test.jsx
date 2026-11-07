/* IDEA-133 (Onada R10, B2-02) i P0-36 (ordre del Mestre del 261107) · El
   placeholder del compositor és el literal curt «Escriu…», amb el caràcter
   d'el·lipsi (es «Escribe…», en «Write…», eu «Idatzi…», gl «Escribe…»), que no
   es talla al mòbil amb la lletra gran. El nom accessible no canvia: és
   l'aria-label, section.xat.compositor.etiqueta («Escriu un missatge»). */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import Compositor from './Compositor.jsx';
import fontCompositor from './Compositor.jsx?raw';

const PLACEHOLDER = { ca: 'Escriu…', es: 'Escribe…', en: 'Write…', eu: 'Idatzi…', gl: 'Escribe…' };
const ETIQUETA = { ca: 'Escriu un missatge', es: 'Escribe un mensaje', en: 'Write a message', eu: 'Idatzi mezu bat', gl: 'Escribe unha mensaxe' };

afterEach(cleanup);

const pinta = (t) => render(
  <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
    <Compositor valor="" onCanvia={vi.fn()} onEnvia={vi.fn()} t={t} />
  </AppGridContext.Provider>
);

test('B2-02 · en les cinc llengües, el placeholder curt i el nom accessible de sempre', () => {
  for (const codi of Object.keys(PLACEHOLDER)) {
    const t = createTranslator(codi);
    expect([codi, t('section.xat.composePlaceholder')]).toEqual([codi, PLACEHOLDER[codi]]);
    pinta(t);
    const camp = screen.getByRole('textbox', { name: ETIQUETA[codi] });
    expect([codi, camp.getAttribute('placeholder'), camp.getAttribute('aria-label')]).toEqual([codi, PLACEHOLDER[codi], ETIQUETA[codi]]);
    cleanup();
  }
});

test('B2-02 · la reserva del codi és el valor valencià, i l’aria-label continua sent la seua clau', () => {
  expect(fontCompositor).toContain("placeholder={t('section.xat.composePlaceholder', 'Escriu…')}");
  expect(fontCompositor).toContain("aria-label={t('section.xat.compositor.etiqueta', 'Escriu un missatge')}");
  /* Amb el traductor que torna la reserva, el mateix. */
  pinta((_, reserva) => reserva);
  const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
  expect(camp.getAttribute('placeholder')).toBe('Escriu…');
});
