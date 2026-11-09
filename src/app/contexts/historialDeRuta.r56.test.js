import { expect, test, vi } from 'vitest';
import { ambEntradaHistorial, campsHostDeHistorial, CLAU_ENTRADA_HISTORIAL as META, estatPublicDeHistorial, llegixEntradaHistorial, novaClauDeRuta } from './historialDeRuta.js';

test('R56 · identitats distintes fins i tot amb el generador aleatori retornant zero', () => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0);
  try {
    const a = novaClauDeRuta(), b = novaClauDeRuta(); expect(a).not.toBe(b);
    expect(llegixEntradaHistorial(ambEntradaHistorial(null, a, {})).key).toBe(a);
  } finally { random.mockRestore(); }
});

test.each([null, 0, false, 'CONTROL', [], { user: 'CONTROL' }])('R56 · projecció exacta %j i camps host separats del payload públic', state => {
  const host = { host: 'CONTROL host' }, key = novaClauDeRuta();
  const raw = ambEntradaHistorial(state, key, host);
  expect(estatPublicDeHistorial(raw)).toEqual(state);
  expect(campsHostDeHistorial(raw)).toEqual(host);
  expect(raw.host).toBe(host.host);
  expect(raw[META]).toEqual({ version: 2, key, state });
});

test('R56 · namespace host desconegut queda embolcallat i es reconstruïx sense triar slots', () => {
  const host = { [META]: { version: 99, opaque: 'CONTROL' }, host: 17 };
  const raw = ambEntradaHistorial('CONTROL estat', novaClauDeRuta(), host);
  expect(raw[META]).toMatchObject({ version: 2, hostValue: host[META] });
  expect(campsHostDeHistorial(raw)).toEqual(host);
  expect(estatPublicDeHistorial(raw)).toBe('CONTROL estat');
});

test.each([
  { version: 3, key: 'sdp:control:1', state: null },
  { version: 2, key: 'desconeguda', state: null },
  { version: 2, key: 'sdp:control:1', state: null, scroll: 80 },
])('R56 · format desconegut %j es conserva i no es confon amb estat privat', marker => {
  const raw = { [META]: marker, host: 'CONTROL' };
  expect(llegixEntradaHistorial(raw)).toBeNull();
  expect(estatPublicDeHistorial(raw)).toBe(raw);
});

test('R56 · getters i dos marcadors v1 numerats no s’interpreten', () => {
  const getter = vi.fn(() => ({ version: 1, key: 'sdp:control:1', state: null }));
  const raw = Object.defineProperty({}, META, { enumerable: true, get: getter });
  expect(llegixEntradaHistorial(raw)).toBeNull(); expect(getter).not.toHaveBeenCalled();
  const marker = { version: 1, key: 'sdp:control:1', state: null };
  expect(llegixEntradaHistorial({ [META]: marker, [`${META}_1`]: marker })).toBeNull();
});

test('R56-COLD-SCROLL-01 · escriure després de dos slots host v1 opacs recupera estat públic i host exactes', () => {
  const marker = key => ({ version: 1, key, state: 'CONTROL opac' });
  const host = { host: 'CONTROL host', [META]: marker('sdp:host:1'), [`${META}_1`]: marker('sdp:host:2') };
  const state = { public: 'CONTROL nou' };
  const raw = ambEntradaHistorial(state, novaClauDeRuta(), campsHostDeHistorial(host));
  expect(estatPublicDeHistorial(raw)).toEqual(state);
  expect(campsHostDeHistorial(raw)).toEqual(host);
});

test.each([undefined, null, 0, false, 'CONTROL', { opaque: true }])('R56 v2 · presència pròpia del namespace host amb %j es reconstruïx exactament', hostValue => {
  const host = { keep: 'CONTROL', [META]: hostValue }, state = { public: 'CONTROL' };
  const raw = ambEntradaHistorial(state, novaClauDeRuta(), host);
  expect(raw[META].version).toBe(2); expect(Object.hasOwn(raw[META], 'hostValue')).toBe(true);
  expect(estatPublicDeHistorial(raw)).toEqual(state);
  const recovered = campsHostDeHistorial(raw);
  expect(Object.hasOwn(recovered, META)).toBe(true); expect(recovered[META]).toEqual(hostValue); expect(recovered.keep).toBe(host.keep);
});

test('R56 v2 · absència del namespace host i slots numerats v2 opacs no creen col·lisions', () => {
  const host = { keep: 0, [`${META}_1`]: { version: 2, key: 'sdp:host:1', state: 'OPAC' } };
  const raw = ambEntradaHistorial(false, novaClauDeRuta(), host);
  expect(Object.hasOwn(raw[META], 'hostValue')).toBe(false);
  expect(estatPublicDeHistorial(raw)).toBe(false); expect(campsHostDeHistorial(raw)).toEqual(host);
  expect(Object.hasOwn(campsHostDeHistorial(raw), META)).toBe(false);
});

test('R56 v2 · un namespace futur/malformat es conserva després de JSON round-trip', () => {
  const host = { keep: 0, [META]: { version: 99, state: 'OPAC' } };
  const raw = JSON.parse(JSON.stringify(ambEntradaHistorial(0, novaClauDeRuta(), host)));
  expect(estatPublicDeHistorial(raw)).toBe(0); expect(campsHostDeHistorial(raw)).toEqual(host);
});

test('R56 v2 · metadata accessor és opaca; copiar un accessor host es rebutja sense executar-lo', () => {
  const getter = vi.fn(() => 'CONTROL');
  const host = Object.defineProperty({}, META, { enumerable: true, get: getter });
  expect(llegixEntradaHistorial(host)).toBeNull(); expect(estatPublicDeHistorial(host)).toBe(host);
  expect(() => ambEntradaHistorial(null, novaClauDeRuta(), host)).toThrow(); expect(getter).not.toHaveBeenCalled();
});
