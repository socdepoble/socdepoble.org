// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { creaControlStorage, informaReconciliacioStorage, observaReconciliacioStorage } from './controlStorage.js';
import { _reiniciaAutocuracio, incidents } from '../../utils/autocuracio.js';
afterEach(() => vi.useRealTimers());
/* T1 · F6 (assalt 261101) · Una reconciliació 'pendent' queda al registre
   d'autoreparacions (una etiqueta, sense ruta ni uid); les assentades, no. */
test('una reconciliació pendent s’anota a incidents(); compensat, comprovat i invalida, no', () => {
  _reiniciaAutocuracio();
  const vistos = [];
  const deixa = observaReconciliacioStorage((detall) => vistos.push(detall));
  try {
    for (const estat of ['compensat', 'comprovat', 'invalida']) informaReconciliacioStorage({ tipus: 'pujada', estat });
    expect(incidents()).toEqual([]);
    informaReconciliacioStorage({ tipus: 'esborrat', estat: 'pendent' });
    informaReconciliacioStorage({ tipus: 'pujada', estat: 'pendent', motiu: 'sessio-canviada' });
    expect(incidents().map(({ tipus, on, accio, vegades }) => ({ tipus, on, accio, vegades }))).toEqual([
      { tipus: 'dades', on: 'storage', accio: 'reconciliacio-pendent', vegades: 2 },
      { tipus: 'dades', on: 'storage', accio: 'reconciliacio-pendent', vegades: 1 }
    ]);
    expect(JSON.stringify(incidents())).not.toMatch(/esborrat|pujada|sessio/);
    expect(vistos.map((detall) => detall.estat)).toEqual(['compensat', 'comprovat', 'invalida', 'pendent', 'pendent']);
  } finally { deixa(); _reiniciaAutocuracio(); }
});
/* Una signatura o una lectura que acaba després d'un canvi de sessió no deixa
   res al servidor: els observadors ho saben, però no és cap incident. */
test('una lectura o una signatura pendent per canvi de sessió no s’anota a incidents()', () => {
  _reiniciaAutocuracio();
  const vistos = [];
  const deixa = observaReconciliacioStorage((detall) => vistos.push(detall.tipus));
  try {
    for (const tipus of ['signatura', 'lectura', undefined]) informaReconciliacioStorage({ tipus, estat: 'pendent', motiu: 'sessio-canviada' });
    expect(incidents()).toEqual([]);
    expect(vistos).toEqual(['signatura', 'lectura', undefined]);
  } finally { deixa(); _reiniciaAutocuracio(); }
});
test('els transports que ignoren AbortSignal continuen ocupant plaça; la cua cancel·lada no s’executa', async () => {
  vi.useFakeTimers(); const control = creaControlStorage({ maxim: 2, cuaMaxima: 2 });
  const resoldre = [], feina = vi.fn(() => new Promise(r => resoldre.push(r)));
  const crides = Array.from({length:4}, () => control.executa(feina,{ms:100}).catch(e=>e));
  await Promise.resolve(); expect(feina).toHaveBeenCalledTimes(2);
  // V2-01: les dues primeres expiren als 100 ms; les dues de la cua, sense senyal, als 200 (el seu ms més el més llarg de davant).
  await vi.advanceTimersByTimeAsync(100); await Promise.all(crides.slice(0, 2));
  expect(control.estat()).toEqual({ enVol:2, enCua:2 });
  await vi.advanceTimersByTimeAsync(100);
  expect((await Promise.all(crides)).map(e => e.message)).toEqual(['Storage no ha respost a temps.', 'Storage no ha respost a temps.', 'Storage està ocupat.', 'Storage està ocupat.']);
  expect(control.estat()).toEqual({ enVol:2, enCua:0 });
  expect(feina).toHaveBeenCalledTimes(2);
  resoldre.forEach(r=>r('tard')); await vi.advanceTimersByTimeAsync(0);
  expect(control.estat()).toEqual({ enVol:0, enCua:0 }); expect(vi.getTimerCount()).toBe(0);
});
test('sostre de cua i cancel·lació externa; reconciliació exactament una volta', async () => {
  vi.useFakeTimers(); const control = creaControlStorage({ maxim:1, cuaMaxima:0 }), ac=new AbortController(), reconcilia=vi.fn(); let resol;
  const feina = control.executa(() => new Promise(r=>{resol=r;}),{ms:1000,signal:ac.signal,reconcilia}).catch(e=>e);
  await Promise.resolve(); await expect(control.executa(()=>null,{ms:100})).rejects.toThrow('ocupat');
  ac.abort(); expect((await feina).name).toBe('AbortError');
  resol('resultat-tardà'); await vi.advanceTimersByTimeAsync(0);
  expect(reconcilia).toHaveBeenCalledExactlyOnceWith({ valor:'resultat-tardà' }); expect(vi.getTimerCount()).toBe(0);
});
/* R2-COR-06 (revisió de la Ronda 2) · El termini comença quan l'operació arranca. */
test('una operació a la cua té el seu termini sencer des que arranca', async () => {
  vi.useFakeTimers(); const control = creaControlStorage({ maxim: 1, cuaMaxima: 4 });
  const primera = control.executa(() => new Promise((r) => setTimeout(() => r('a'), 60)), { ms: 90 });
  const segona = control.executa(() => new Promise((r) => setTimeout(() => r('b'), 80)), { ms: 90 }).catch((e) => e);
  await vi.advanceTimersByTimeAsync(60); await expect(primera).resolves.toBe('a');
  // Ha esperat 60 ms a la cua i en tarda 80: amb el termini des de la cua (90) cauria a 90 ms.
  await vi.advanceTimersByTimeAsync(85);
  expect(await segona).toBe('b');
  expect(control.estat()).toEqual({ enVol: 0, enCua: 0 }); expect(vi.getTimerCount()).toBe(0);
});
/* V1-01 i V2-01 · El sostre de l'espera a la cua no és el ms de l'operació tot sol: hi suma el termini més llarg de les que volen. */
test('límits de producció: una signatura de 200 ms darrere de 4 pujades de 30 s no cau per l’espera a la cua', async () => {
  vi.useFakeTimers(); const control = creaControlStorage();
  const pujades = Array.from({ length: 4 }, (_, i) =>
    control.executa(() => new Promise((r) => setTimeout(() => r(`pujada-${i}`), 30_000)), { ms: 60_000 }));
  const signatura = control.executa(() => new Promise((r) => setTimeout(() => r('url'), 200)), { ms: 12_000 }).catch((e) => e);
  await Promise.resolve(); expect(control.estat()).toEqual({ enVol: 4, enCua: 1 });
  // Amb un sostre de cua igual al ms (12 s), la signatura cauria ací amb «Storage està ocupat».
  await vi.advanceTimersByTimeAsync(12_000); expect(control.estat()).toEqual({ enVol: 4, enCua: 1 });
  await vi.advanceTimersByTimeAsync(18_000 + 200);
  await expect(Promise.all(pujades)).resolves.toEqual(['pujada-0', 'pujada-1', 'pujada-2', 'pujada-3']);
  expect(await signatura).toBe('url');
  expect(control.estat()).toEqual({ enVol: 0, enCua: 0 }); expect(vi.getTimerCount()).toBe(0);
});
test('a la cua, el senyal extern la trau abans del sostre: AbortError, la feina no arranca i no queda cap rellotge', async () => {
  vi.useFakeTimers(); const control = creaControlStorage({ maxim: 1, cuaMaxima: 4 });
  let allibera; const penjada = control.executa(() => new Promise((r) => { allibera = r; }), { ms: 1000 }).catch((e) => e);
  const feina = vi.fn(() => 'mai'), ac = new AbortController();
  const encuada = control.executa(feina, { ms: 100, signal: ac.signal }).catch((e) => e);
  await vi.advanceTimersByTimeAsync(500);
  // El termini de la que vola i el sostre d'espera de la de la cua.
  expect(control.estat()).toEqual({ enVol: 1, enCua: 1 }); expect(vi.getTimerCount()).toBe(2);
  ac.abort();
  expect((await encuada).name).toBe('AbortError');
  expect(feina).not.toHaveBeenCalled(); expect(control.estat()).toEqual({ enVol: 1, enCua: 0 }); expect(vi.getTimerCount()).toBe(1);
  allibera('ok'); expect(await penjada).toBe('ok'); expect(vi.getTimerCount()).toBe(0);
});
/* V2-01 · PN-04: sense senyal, l'espera a la cua no és infinita encara que el transport en vol no acabe mai. */
test('l’espera a la cua té sostre (el seu ms més el més llarg de les que volen): «Storage està ocupat», no TimeoutError', async () => {
  vi.useFakeTimers(); const control = creaControlStorage({ maxim: 1, cuaMaxima: 4 });
  let allibera; const penjada = control.executa(() => new Promise((r) => { allibera = r; }), { ms: 1000 }).catch((e) => e);
  const feina = vi.fn(() => 'mai');
  const encuada = control.executa(feina, { ms: 100 }).catch((e) => e);
  await vi.advanceTimersByTimeAsync(1000); expect((await penjada).name).toBe('TimeoutError');
  // El transport ignora l'avortament i continua ocupant la plaça: la de la cua espera encara.
  await vi.advanceTimersByTimeAsync(99); expect(control.estat()).toEqual({ enVol: 1, enCua: 1 });
  await vi.advanceTimersByTimeAsync(1);
  const error = await encuada;
  expect(error.message).toBe('Storage està ocupat.'); expect(error.name).not.toBe('TimeoutError');
  expect(error.codi).toBe('backend-inabastable');
  expect(feina).not.toHaveBeenCalled(); expect(control.estat()).toEqual({ enVol: 1, enCua: 0 });
  allibera('tard'); await vi.advanceTimersByTimeAsync(0);
  expect(control.estat()).toEqual({ enVol: 0, enCua: 0 }); expect(vi.getTimerCount()).toBe(0);
});
test('el sostre de la cua també compta el termini més llarg de les que té davant, encara que arranquen després', async () => {
  vi.useFakeTimers(); const control = creaControlStorage({ maxim: 1, cuaMaxima: 4 });
  const curta = control.executa(() => new Promise((r) => setTimeout(() => r('a'), 90)), { ms: 100 });
  const llarga = control.executa(() => new Promise((r) => setTimeout(() => r('b'), 900)), { ms: 1000 });
  const darrere = control.executa(() => new Promise((r) => setTimeout(() => r('c'), 40)), { ms: 50 }).catch((e) => e);
  // Amb només les que volien en entrar (100 ms), cauria als 150 ms; amb la de davant (1000 ms), el sostre és als 1050.
  await vi.advanceTimersByTimeAsync(990); await expect(curta).resolves.toBe('a'); await expect(llarga).resolves.toBe('b');
  expect(control.estat()).toEqual({ enVol: 1, enCua: 0 });
  await vi.advanceTimersByTimeAsync(40);
  expect(await darrere).toBe('c');
  expect(control.estat()).toEqual({ enVol: 0, enCua: 0 }); expect(vi.getTimerCount()).toBe(0);
});
