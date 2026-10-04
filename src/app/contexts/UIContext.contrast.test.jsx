/**
 * D6 · Mode Bancal (Q1 del Mestre, 261004) · El contrast al UIProvider real.
 *
 *  · El primer pintat ja porta el mode bo: la preferència desada i el que
 *    diu `prefers-contrast: more` es lligen en l'inicialitzador, no en un efecte.
 *  · setContrast desa la tria (storage.js) i el mode canvia a l'acte; un
 *    valor desconegut no fa res.
 *  · «Segons el sistema» seguix els canvis del dispositiu amb la pàgina oberta.
 *  · Sense emmagatzematge (mode privat) la tria val mentre dura la pàgina.
 *
 * L'emmagatzematge es toca només per storage.js (tractor L2).
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { UIProvider, useUIActions, useUIState } from './UIContext.jsx';
import { CONSULTA_CONTRAST_SISTEMA, CONTRAST_KEY } from '../../config/theme.js';
import { delVal, getVal, setVal } from '../../config/storage.js';

/* Una MediaQueryList controlable per consulta: el tema (prefers-color-scheme)
   i el contrast (prefers-contrast) viuen al mateix proveïdor. */
function sistema({ contrastMes = false } = {}) {
  const llistes = new Map();
  const llista = (consulta) => {
    if (!llistes.has(consulta)) {
      const oients = new Set();
      const mq = {
        matches: consulta === CONSULTA_CONTRAST_SISTEMA ? contrastMes : false,
        media: consulta,
        addEventListener: (tipus, oient) => { if (tipus === 'change') oients.add(oient); },
        removeEventListener: (tipus, oient) => { if (tipus === 'change') oients.delete(oient); },
        addListener: (oient) => oients.add(oient),
        removeListener: (oient) => oients.delete(oient),
        oients
      };
      llistes.set(consulta, mq);
    }
    return llistes.get(consulta);
  };
  vi.stubGlobal('matchMedia', vi.fn(llista));
  return {
    canviaContrast(valor) {
      const mq = llista(CONSULTA_CONTRAST_SISTEMA);
      mq.matches = valor;
      for (const oient of [...mq.oients]) oient({ matches: valor, media: CONSULTA_CONTRAST_SISTEMA });
    },
    oientsContrast: () => llista(CONSULTA_CONTRAST_SISTEMA).oients.size
  };
}

const accions = {};
/* Apunta cada mode que es pinta: el primer és el del primer fotograma. */
const pintats = [];

function Sonda() {
  const { contrastMode, contrastPreference } = useUIState();
  const { setContrast } = useUIActions();
  accions.setContrast = setContrast;
  pintats.push(contrastMode);
  return <p data-testid="sonda" data-mode={contrastMode} data-preferencia={contrastPreference} />;
}

const sonda = () => screen.getByTestId('sonda');
const munta = () => render(<UIProvider externalConfig={{}}><Sonda /></UIProvider>);

let abans = null;
beforeEach(() => {
  abans = getVal(CONTRAST_KEY);
  delVal(CONTRAST_KEY);
  pintats.length = 0;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (abans == null) delVal(CONTRAST_KEY);
  else setVal(CONTRAST_KEY, abans);
});

test('per defecte, «Normal»: cap Bancal encara que no s’haja triat res', () => {
  sistema();
  munta();
  expect(sonda().dataset.preferencia).toBe('normal');
  expect(sonda().dataset.mode).toBe('normal');
});

test('una tria desada de «Bancal» es pinta ja en el primer fotograma', () => {
  sistema();
  setVal(CONTRAST_KEY, 'bancal');
  munta();
  expect(pintats[0]).toBe('bancal');
  expect(sonda().dataset.mode).toBe('bancal');
});

test('«Segons el sistema» amb el dispositiu en contrast alt: Bancal des del primer fotograma', () => {
  sistema({ contrastMes: true });
  setVal(CONTRAST_KEY, 'sistema');
  munta();
  expect(pintats[0]).toBe('bancal');
});

test('setContrast desa la tria i canvia el mode a l’acte; un valor desconegut no fa res', () => {
  sistema();
  munta();
  act(() => { accions.setContrast('bancal'); });
  expect(sonda().dataset.mode).toBe('bancal');
  expect(getVal(CONTRAST_KEY)).toBe('bancal');
  act(() => { accions.setContrast('fosc'); });
  expect(sonda().dataset.preferencia).toBe('bancal');
  expect(getVal(CONTRAST_KEY)).toBe('bancal');
  act(() => { accions.setContrast('normal'); });
  expect(sonda().dataset.mode).toBe('normal');
  expect(getVal(CONTRAST_KEY)).toBe('normal');
});

test('«Segons el sistema» seguix el dispositiu amb la pàgina oberta; «Normal» i «Bancal» no en fan cas', () => {
  const sis = sistema();
  munta();
  act(() => { accions.setContrast('sistema'); });
  expect(sonda().dataset.mode).toBe('normal');
  act(() => { sis.canviaContrast(true); });
  expect(sonda().dataset.mode).toBe('bancal');
  act(() => { sis.canviaContrast(false); });
  expect(sonda().dataset.mode).toBe('normal');

  act(() => { accions.setContrast('normal'); });
  act(() => { sis.canviaContrast(true); });
  expect(sonda().dataset.mode).toBe('normal');
  act(() => { accions.setContrast('bancal'); });
  act(() => { sis.canviaContrast(false); });
  expect(sonda().dataset.mode).toBe('bancal');
});

test('en desmuntar, deixa d’escoltar el sistema', () => {
  const sis = sistema();
  const { unmount } = munta();
  expect(sis.oientsContrast()).toBe(1);
  unmount();
  expect(sis.oientsContrast()).toBe(0);
});

test('sense emmagatzematge (mode privat): la tria val mentre dura la pàgina i res no llança', () => {
  sistema();
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloquejat', 'SecurityError'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Plena', 'QuotaExceededError'); });
  munta();
  expect(sonda().dataset.mode).toBe('normal');
  act(() => { accions.setContrast('bancal'); });
  expect(sonda().dataset.mode).toBe('bancal');
});
