/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · WCAG 2.5.3 (Etiqueta
   en el nom, nivell A): el nom accessible del botó «Més tard» conté el text que
   es veu. Abans, l'aria-label («Amaga l’avís…») el substituïa: qui el crida per
   veu dient «Més tard» no el trobava. El lector de pantalla continua sentint
   per a quina versió s'amaga. Cap canvi visible. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import BarraActualitzacioRecomanada from './BarraActualitzacioRecomanada.jsx';
import { ENLLAC_IOS_APP_STORE } from '../../../config/actualitzacioRecomanada.js';
import CA from '../../../config/idiomes/ca.js';
import EN from '../../../config/idiomes/en.js';

afterEach(cleanup);

test.each([['ca', CA], ['en', EN]])('%s · el nom accessible de «Més tard» comença pel text visible i diu què amaga', (_llengua, diccionari) => {
  const t = (clau, reserva) => diccionari[clau] ?? reserva;
  render(<BarraActualitzacioRecomanada mostra={{ plataforma: 'ios', versioRecomanada: 6, enllac: ENLLAC_IOS_APP_STORE, marketUrl: null }} t={t} />);
  const visible = diccionari['natiu.actualitzacioRecomanada.mesTard'];
  const boto = screen.getByText(visible).closest('button');
  const nom = boto.getAttribute('aria-label') ?? boto.textContent;
  expect(nom.startsWith(visible)).toBe(true);
  expect(nom).toContain(diccionari['natiu.actualitzacioRecomanada.tanca']);
});
