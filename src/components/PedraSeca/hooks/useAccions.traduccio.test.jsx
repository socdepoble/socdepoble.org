import { renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import { useAccions } from './useAccions.js';

/* Traductor Sobirà (ordre del Mestre, 260930 · via B) · Traduir de la barra
   d'una pàgina ja no porta a /traduccions: obri el menú de llengües. Un
   onTranslate propi mana com sempre; les targetes (sense `traduccio`)
   continuen com abans. */

const traduccio = (disponible = true) => {
  const menu = { obert: false, opcions: [], actual: null, onTria: vi.fn(), onTanca: vi.fn() };
  return { disponible, menu, commutaMenu: vi.fn() };
};

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.toast.mockReset();
});

test('amb el traductor de la pàgina, Traduir obri el menú i no navega a /traduccions', () => {
  const t = traduccio();
  const { result } = renderHook(() => useAccions({ title: 'Festa', hasFooter: true, telemetria: { origen: 'pagina' }, traduccio: t }));
  result.current.handleTranslate();
  expect(t.commutaMenu).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(result.current.menuTraduir).toBe(t.menu);
  expect(result.current.traduirVisible).toBe(true);
});

test('sense servei, cap menú per a la barra; el clic va al traductor (que avisa), mai a /traduccions', () => {
  const t = traduccio(false);
  const { result } = renderHook(() => useAccions({ title: 'Festa', hasFooter: true, traduccio: t }));
  expect(result.current.menuTraduir).toBeNull();
  result.current.handleTranslate();
  expect(t.commutaMenu).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('un onTranslate propi mana: és el handler i no hi ha menú', () => {
  const t = traduccio();
  const onTranslate = vi.fn();
  const { result } = renderHook(() => useAccions({ title: 'Festa', onTranslate, traduccio: t }));
  expect(result.current.handleTranslate).toBe(onTranslate);
  expect(result.current.menuTraduir).toBeNull();
  result.current.handleTranslate();
  expect(t.commutaMenu).not.toHaveBeenCalled();
});

test('sense traductor (les targetes, l’editor), el de sempre: /traduccions i cap menú', () => {
  const { result } = renderHook(() => useAccions({ title: 'Samarreta', hasFooter: true }));
  expect(result.current.menuTraduir).toBeNull();
  result.current.handleTranslate();
  expect(mocks.navigate).toHaveBeenCalledWith('/traduccions');
});
