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
import {
  CONSULTA_CONTRAST_SISTEMA, CONTRAST_KEY, SENIOR_KEY, esModeBancal, readContrastPreference, readSeniorPreference, reiniciaMemoriaSenior,
  subscriuModeSenior
} from '../../config/theme.js';
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
  const { contrastMode, contrastPreference, seniorMode } = useUIState();
  const { setContrast, toggleSeniorMode } = useUIActions();
  accions.setContrast = setContrast;
  accions.toggleSeniorMode = toggleSeniorMode;
  pintats.push(contrastMode);
  return <p data-testid="sonda" data-mode={contrastMode} data-preferencia={contrastPreference} data-senior={String(seniorMode)} />;
}

const sonda = () => screen.getByTestId('sonda');
const munta = () => render(<UIProvider externalConfig={{}}><Sonda /></UIProvider>);

let abans = null;
/* IDEA-323.4 · DOL-31 (v1.2.22) · El Mode Bancal és un sol mode: també es buida la seua clau de Sènior i la
   memòria cau de theme.js (en mode privat, l'estat d'una prova no passa a la següent). */
beforeEach(() => {
  abans = getVal(CONTRAST_KEY);
  delVal(CONTRAST_KEY);
  delVal(SENIOR_KEY);
  reiniciaMemoriaSenior();
  pintats.length = 0;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (abans == null) delVal(CONTRAST_KEY);
  else setVal(CONTRAST_KEY, abans);
  delVal(SENIOR_KEY);
  reiniciaMemoriaSenior();
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

/* IDEA-323.4 · DOL-31 (v1.2.22, ordre del Mestre del 261122) · «Bancal» és el Mode Bancal sencer: encén la
   lletra gran (la clau de Sènior) i el contrast, i la tria de contrast desada continua sent la d'abans
   ('normal' o 'sistema'), que torna en apagar-lo. S'actualitza a posta (abans es desava 'bancal'). */
test('setContrast canvia el mode a l’acte: «Bancal» encén el Mode Bancal sencer; un valor desconegut no fa res', () => {
  sistema();
  munta();
  act(() => { accions.setContrast('bancal'); });
  expect(sonda().dataset.mode).toBe('bancal');
  expect(sonda().dataset.preferencia).toBe('bancal');
  expect(sonda().dataset.senior).toBe('true');
  expect(getVal(SENIOR_KEY)).toBe(true);
  expect(getVal(CONTRAST_KEY)).not.toBe('bancal');
  act(() => { accions.setContrast('fosc'); });
  expect(sonda().dataset.preferencia).toBe('bancal');
  expect(sonda().dataset.senior).toBe('true');
  act(() => { accions.setContrast('normal'); });
  expect(sonda().dataset.mode).toBe('normal');
  expect(sonda().dataset.senior).toBe('false');
  expect(getVal(CONTRAST_KEY)).toBe('normal');
  expect(getVal(SENIOR_KEY)).toBe(false);
});

test('IDEA-323.4 · DOL-31 · el xip (toggleSeniorMode) encén i apaga alhora la lletra gran i el contrast Bancal', () => {
  sistema();
  munta();
  expect(sonda().dataset.senior).toBe('false');
  act(() => { accions.toggleSeniorMode(); });
  expect(sonda().dataset.senior).toBe('true');
  expect(sonda().dataset.mode).toBe('bancal');
  expect(sonda().dataset.preferencia).toBe('bancal');
  act(() => { accions.toggleSeniorMode(); });
  expect(sonda().dataset.senior).toBe('false');
  expect(sonda().dataset.mode).toBe('normal');
  expect(sonda().dataset.preferencia).toBe('normal');
});

test('IDEA-323.4 · DOL-31 · en apagar el Mode Bancal es respecta «Segons el sistema» (prefers-contrast: more)', () => {
  const sis = sistema({ contrastMes: true });
  setVal(CONTRAST_KEY, 'sistema');
  munta();
  expect(sonda().dataset.senior).toBe('false');
  expect(sonda().dataset.mode).toBe('bancal');
  act(() => { accions.toggleSeniorMode(); });
  expect(sonda().dataset.senior).toBe('true');
  act(() => { accions.toggleSeniorMode(); });
  expect(sonda().dataset.senior).toBe('false');
  expect(sonda().dataset.preferencia).toBe('sistema');
  expect(getVal(CONTRAST_KEY)).toBe('sistema');
  expect(sonda().dataset.mode).toBe('bancal');
  act(() => { sis.canviaContrast(false); });
  expect(sonda().dataset.mode).toBe('normal');
});

test('IDEA-323.4 · DOL-31 · un «Bancal» desat per una versió anterior és el Mode Bancal des del primer fotograma, i en apagar torna a «Normal»', () => {
  sistema();
  setVal(CONTRAST_KEY, 'bancal');
  munta();
  expect(pintats[0]).toBe('bancal');
  expect(sonda().dataset.senior).toBe('true');
  act(() => { accions.toggleSeniorMode(); });
  expect(sonda().dataset.senior).toBe('false');
  expect(sonda().dataset.mode).toBe('normal');
  expect(getVal(CONTRAST_KEY)).toBe('normal');
});

/* v1.2.22 · Gauntlet R2 (M2-04 b) · L2-07 · setSeniorMode desa el 'normal' ABANS de la clau de Sènior, que avisa els
   oients: qui escolta el mode amb subscriuModeSenior (el xip de fora del proveïdor, amb useSyncExternalStore) llig el mode
   nou a cada avís, mai un Bancal a mitges. Amb l'ordre d'abans, l'oient llegia esModeBancal(false, 'bancal') === true. */
test.each([
  ['sense la «Lletra gran» desada', false],
  ['amb la «Lletra gran» també desada', true]
])('IDEA-323.4 · L2-07 · en apagar un «Bancal» desat per una versió anterior (%s), cada avís de subscriuModeSenior ja llig el Mode Bancal apagat', (_nom, seniorDesat) => {
  sistema();
  setVal(CONTRAST_KEY, 'bancal');
  if (seniorDesat) setVal(SENIOR_KEY, true);
  munta();
  expect(sonda().dataset.senior).toBe('true');
  const vistos = [];
  const deixa = subscriuModeSenior(() => { vistos.push(esModeBancal(readSeniorPreference(), readContrastPreference())); });
  try {
    act(() => { accions.toggleSeniorMode(); });
  } finally {
    deixa();
  }
  expect(vistos.length).toBeGreaterThan(0);
  expect(vistos.every((v) => v === false), JSON.stringify(vistos)).toBe(true);
  expect(sonda().dataset.senior).toBe('false');
  expect(getVal(CONTRAST_KEY)).toBe('normal');
});

test('IDEA-323.4 · DOL-31 · una «Lletra gran» desada per una versió anterior porta també el contrast Bancal', () => {
  sistema();
  setVal(SENIOR_KEY, true);
  munta();
  expect(pintats[0]).toBe('bancal');
  expect(sonda().dataset.senior).toBe('true');
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
