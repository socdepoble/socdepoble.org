/* R · Onada 3 (261003) · correcció de la revisió · La marca «contrasenya nova
   pendent». Lligada al compte, a la capa persistent (la de la sessió que
   restringix), amb avís dins del document i entre pestanyes. R2 · I l'enllaç
   que espera «Desa»: en memòria, amb una marca sense secret a la pestanya. Les
   proves són fora de L2 (tractor-persistencia): poden tocar l'emmagatzematge
   directament. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { STORAGE_PREFIX } from '../config/storage.js';
import {
  CLAU_ENLLAC_OBERT, CLAU_RECUPERACIO_PENDENT, ESTAT_ENLLAC, EVENT_RECUPERACIO_PENDENT, anunciaEnllacDeRecuperacio,
  escoltaRecuperacioPendent, esClauDeRecuperacio, estatEnllacDeRecuperacio, marcaRecuperacioPendent,
  oblidaEnllacDeRecuperacio, oblidaRecuperacioPendent, recuperacioPendentPer
} from './recuperacioPendent.js';

const CLAU = STORAGE_PREFIX + CLAU_RECUPERACIO_PENDENT;
const CLAU_ENLLAC = STORAGE_PREFIX + CLAU_ENLLAC_OBERT;

beforeEach(() => { oblidaRecuperacioPendent(); });
afterEach(() => {
  vi.restoreAllMocks();
  oblidaRecuperacioPendent();
});

test('la marca és del compte: només compta per al seu sub, i no porta cap secret', () => {
  expect(recuperacioPendentPer('U-1')).toBe(false);
  expect(marcaRecuperacioPendent('U-1')).toBe(true);
  expect(recuperacioPendentPer('U-1')).toBe(true);
  expect(recuperacioPendentPer('U-2')).toBe(false);
  expect(recuperacioPendentPer(null)).toBe(false);
  expect(JSON.parse(window.localStorage.getItem(CLAU))).toEqual({ v: 1, sub: 'U-1' });
});

test('sense compte no es marca res', () => {
  expect(marcaRecuperacioPendent(null)).toBe(false);
  expect(marcaRecuperacioPendent('')).toBe(false);
  expect(window.localStorage.getItem(CLAU)).toBeNull();
});

test('oblidar-la l’esborra de la capa persistent', () => {
  marcaRecuperacioPendent('U-1');
  oblidaRecuperacioPendent();
  expect(recuperacioPendentPer('U-1')).toBe(false);
  expect(window.localStorage.getItem(CLAU)).toBeNull();
});

test('un valor mal format no compta com a marca', () => {
  for (const cru of ['"U-1"', '{"sub":"U-1"}', '{"v":2,"sub":"U-1"}', '{"v":1,"sub":""}', 'no-es-json']) {
    window.localStorage.setItem(CLAU, cru);
    expect(recuperacioPendentPer('U-1'), cru).toBe(false);
  }
});

test('avisa dins del document quan la marca canvia, i no quan oblidar no canvia res', () => {
  const avisos = vi.fn();
  window.addEventListener(EVENT_RECUPERACIO_PENDENT, avisos);
  try {
    marcaRecuperacioPendent('U-1');
    oblidaRecuperacioPendent();
    oblidaRecuperacioPendent();
  } finally { window.removeEventListener(EVENT_RECUPERACIO_PENDENT, avisos); }
  expect(avisos).toHaveBeenCalledTimes(2);
});

test('escolta els canvis d’este document i els de les altres pestanyes (storage), i deixa d’escoltar', () => {
  const escoltador = vi.fn();
  const deixa = escoltaRecuperacioPendent(escoltador);
  marcaRecuperacioPendent('U-1');
  expect(escoltador).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new StorageEvent('storage', { key: CLAU }));
  expect(escoltador).toHaveBeenCalledTimes(2);
  // null: una altra pestanya ho ha buidat tot.
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
  expect(escoltador).toHaveBeenCalledTimes(3);
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_PREFIX + 'una-altra-clau' }));
  expect(escoltador).toHaveBeenCalledTimes(3);
  deixa();
  oblidaRecuperacioPendent();
  expect(escoltador).toHaveBeenCalledTimes(3);
  expect(esClauDeRecuperacio(CLAU)).toBe(true);
  expect(esClauDeRecuperacio('una-altra')).toBe(false);
});

test('una altra pestanya que l’esborra l’esborra també d’ací (cap còpia vella en memòria)', () => {
  marcaRecuperacioPendent('U-1');
  window.localStorage.removeItem(CLAU);
  expect(recuperacioPendentPer('U-1')).toBe(false);
});

test('si el navegador no deixa escriure, la marca es queda en la memòria d’este document', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
  expect(marcaRecuperacioPendent('U-1')).toBe(false);
  expect(recuperacioPendentPer('U-1')).toBe(true);
  expect(recuperacioPendentPer('U-2')).toBe(false);
  oblidaRecuperacioPendent();
  expect(recuperacioPendentPer('U-1')).toBe(false);
});

/* ── R2 (decisió del Mestre, 261003) · L'enllaç que espera «Desa» ── */

test('R2 · sense res en curs, l’estat de l’enllaç és null', () => {
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

test('R2 · anunciar l’enllaç el deixa pendent en este document, amb una marca de pestanya SENSE secret i a cap capa persistent', () => {
  anunciaEnllacDeRecuperacio();
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  expect(JSON.parse(window.sessionStorage.getItem(CLAU_ENLLAC))).toEqual({ v: 1 });
  expect(window.localStorage.getItem(CLAU_ENLLAC)).toBeNull();
  // Anunciar-lo dues vegades (adaptador i App.jsx) no canvia res.
  anunciaEnllacDeRecuperacio();
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
});

test('R2 · recarregar: la memòria es perd i la marca de la pestanya diu «perdut»; oblidar-lo ho buida tot', async () => {
  anunciaEnllacDeRecuperacio();
  vi.resetModules();
  const recarregat = await import('./recuperacioPendent.js');
  expect(recarregat.estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PERDUT);
  recarregat.oblidaEnllacDeRecuperacio();
  expect(recarregat.estatEnllacDeRecuperacio()).toBeNull();
  expect(window.sessionStorage.getItem(CLAU_ENLLAC)).toBeNull();
});

test('R2 · oblidar l’enllaç avisa quan hi era i no toca la marca d’un compte; oblidar-ho tot, les dues coses', () => {
  const avisos = vi.fn();
  window.addEventListener(EVENT_RECUPERACIO_PENDENT, avisos);
  try {
    marcaRecuperacioPendent('U-1');
    anunciaEnllacDeRecuperacio();
    oblidaEnllacDeRecuperacio();
    expect(estatEnllacDeRecuperacio()).toBeNull();
    expect(recuperacioPendentPer('U-1')).toBe(true);
    oblidaEnllacDeRecuperacio();                           // ja no hi era: cap avís
    anunciaEnllacDeRecuperacio();
    oblidaRecuperacioPendent();
    expect(estatEnllacDeRecuperacio()).toBeNull();
    expect(recuperacioPendentPer('U-1')).toBe(false);
  } finally { window.removeEventListener(EVENT_RECUPERACIO_PENDENT, avisos); }
  // marca, anuncia, oblida l'enllaç, anuncia, oblida-ho tot.
  expect(avisos).toHaveBeenCalledTimes(5);
});

test('R2 · escolta l’enllaç d’este document', () => {
  const escoltador = vi.fn();
  const deixa = escoltaRecuperacioPendent(escoltador);
  anunciaEnllacDeRecuperacio();
  oblidaEnllacDeRecuperacio();
  deixa();
  expect(escoltador).toHaveBeenCalledTimes(2);
});
