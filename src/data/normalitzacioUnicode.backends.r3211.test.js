import { afterEach, expect, test, vi } from 'vitest';
import * as unicode from '../utils/normalitzaUnicodeSegura.js';
import { nomDeCarpetaValid } from './carpetesNotes.js';
import { avaluaFrase, kekDeFrase } from '../sections/gestoria/cofre/nucli/cripto.js';
import { indexsDeFrase } from './xifratXatParaules.js';
import { exportaCopiaSeguretatXatAmbRebut, nomArxiuCopiaSeguretatXat } from './xat/copiaSeguretatPortatil.js';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { webcrypto } from 'node:crypto';

const raw = 'aa' + '\u0315'.repeat(16383) + '\u0300'.repeat(16384);
const compat = 'a' + ('\u0315\uff9e').repeat(13107);
const native = String.prototype.normalize;
afterEach(() => vi.restoreAllMocks());
const watch = () => vi.spyOn(String.prototype, 'normalize');
const noWholeAttack = (spy) => expect(spy.mock.contexts.every((s) => String(s).length < 1000)).toBe(true);

test('strict API preserves every native form for admitted text and never coerces objects', () => {
  for (const form of ['NFC', 'NFD', 'NFKC', 'NFKD']) for (const text of ['', 'Cafe\u0301', 'ｶﾞ', 'ﬃ ①', '가', '👩🏽‍🌾', '\uff9e'.repeat(64)]) {
    expect(unicode.normalitzaUnicodeAmbLimit(text, form)).toBe(native.call(text, form));
  }
  const toString = vi.fn(() => 'secret');
  expect(() => unicode.normalitzaUnicodeAmbLimit({ toString })).toThrow(TypeError);
  expect(toString).not.toHaveBeenCalled();
});

test('strict API rejects raw and compatibility-expanded mark runs before whole native normalization', () => {
  expect(new TextEncoder().encode(raw).length).toBe(65536);
  expect(new TextEncoder().encode(compat).length).toBe(65536);
  const spy = watch();
  for (const [text, form] of [[raw, 'NFC'], [raw, 'NFD'], [compat, 'NFKC'], [compat, 'NFKD']]) {
    let failure;
    try { unicode.normalitzaUnicodeAmbLimit(text, form); } catch (e) { failure = e; }
    expect(failure).toBeInstanceOf(RangeError);
    expect(failure.code).toBe('UNICODE_MARK_LIMIT');
  }
  // NFKx només pot arribar al natiu amb un escalar (mai fragments de text).
  expect(spy.mock.contexts.every((s) => String(s).length <= 2)).toBe(true);
});

test('folder identity rejects the original input before expensive NFC without mutating it', () => {
  const input = Object.freeze({ nom: raw }); const spy = watch();
  expect(() => nomDeCarpetaValid(input)).toThrow();
  noWholeAttack(spy); expect(input.nom).toBe(raw);
  expect(nomDeCarpetaValid({ nom: '  Cafe\u0301  ' })).toBe('Café');
});

test('vault validation returns an explicit invalid result and KEK derivation never receives an empty substitute', async () => {
  const spy = watch();
  expect(avaluaFrase(raw)).toMatchObject({ valida: false, codi: 'UNICODE_MARK_LIMIT' });
  const importKey = vi.fn(), deriveKey = vi.fn();
  await expect(kekDeFrase({ subtle: { importKey, deriveKey } }, raw, { iter: 1000, sal: new Uint8Array(16) }))
    .rejects.toMatchObject({ code: 'UNICODE_MARK_LIMIT' });
  expect(importKey).not.toHaveBeenCalled(); expect(deriveKey).not.toHaveBeenCalled(); noWholeAttack(spy);
});

test('recovery phrase rejects compatibility marks rather than deriving indices from a blank phrase', () => {
  const spy = watch();
  expect(() => indexsDeFrase(compat)).toThrowError(expect.objectContaining({ code: 'UNICODE_MARK_LIMIT' }));
  noWholeAttack(spy);
});

test('portable backup rejects label and passphrase before crypto and preserves caller input', async () => {
  const spy = watch(), getRandomValues = vi.fn();
  const input = Object.freeze({ usuariId: 'audit-user', tenantId: 'audit-tenant', contrasenya: raw, araIso: '2026-11-18T00:00:00Z',
    cripto: { subtle: webcrypto.subtle, getRandomValues } });
  await expect(exportaCopiaSeguretatXatAmbRebut(input)).rejects.toMatchObject({ code: 'UNICODE_MARK_LIMIT' });
  expect(() => nomArxiuCopiaSeguretatXat({ data: new Date('2026-11-18T00:00:00Z'), etiqueta: compat }))
    .toThrowError(expect.objectContaining({ code: 'UNICODE_MARK_LIMIT' }));
  noWholeAttack(spy); expect(getRandomValues).not.toHaveBeenCalled(); expect(input.contrasenya).toBe(raw);
});

test('local directory rejects an invalid compatibility query instead of widening it to all rows', () => {
  const adapter = createLocalPerfilsAdapter({ entitats: [], persones: [] }); const spy = watch();
  expect(() => adapter.listPublicOrganizations({ consulta: compat })).toThrowError(expect.objectContaining({ code: 'UNICODE_MARK_LIMIT' }));
  noWholeAttack(spy);
});
