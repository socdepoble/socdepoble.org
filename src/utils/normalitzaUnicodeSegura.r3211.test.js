import { performance } from 'node:perf_hooks';
import { describe, expect, test, vi } from 'vitest';
import { MAX_MARQUES_UNICODE_CONSECUTIVES, normalitzaUnicodeSegura } from './normalitzaUnicodeSegura.js';
import { netejaText } from './sanitize.js';
import { normalizeSearchText } from '../config/contentHelpers.js';
import { sanejaAutoria } from '../data/dretsAutor.js';
import { netejaCampOrigen } from '../data/origenNota.js';
import { normalitzaDades, projeccioPayload } from './publicacioUniversal.js';
import { mapSectionSubmissionToItem } from '../data/mapejadorSeccions.js';

const n = (65536 - 2) / 2;
const hostil = 'a' + '\u0315'.repeat(Math.floor(n / 2)) + '\u0300'.repeat(n - Math.floor(n / 2)) + 'x';
const textAntic = (v, maxim = 4000) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').normalize('NFC').trim().slice(0, maxim);
const cercaAntiga = v => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const autoriaAntiga = v => v.replace(/[\t\n\r\u{2028}\u{2029}]+/gu, ' ').replace(/[\u{0}-\u{1f}\u{7f}-\u{9f}\u{61c}\u{200e}\u{200f}\u{202a}-\u{202e}\u{2066}-\u{2069}\u{d800}-\u{dfff}]/gu, '').normalize('NFC').trim();
const regulars = [
  '', 'plain ASCII 123', '  Sóc de Poble, l’aigua i la il·lusió  ', 'Cafe\u0301 i Vale\u0300ncia',
  'ÀÉÍÓÚ àèíòú ç ï ü', 'Ελληνικά α\u0313\u0301', 'עברית שָׁלוֹם', 'العربية مُرَحَّبًا',
  'हिन्दी नमस्ते', 'বাংলা ভাষা', 'ภาษาไทย', 'བོད་ཡིག', '日本語 カフェ', '한국어 가',
  '🌾👩🏽‍🌾 👨‍👩‍👧‍👦 🏳️‍🌈', 'x\r\n y\u0001\n', 'a\u0344', 'a' + '\u0315'.repeat(32) + '\u0300'.repeat(32),
];

describe('R32.11 · pressupost Unicode abans del normalitzador natiu', () => {
  test('64 marques admeses; 65 rebutjades sense anomenar-les NFC ni inserir CGJ', () => {
    expect(MAX_MARQUES_UNICODE_CONSECUTIVES).toBe(64);
    for (const forma of ['NFC', 'NFD']) {
      const dins = 'a' + '\u0315'.repeat(32) + '\u0300'.repeat(32);
      expect(normalitzaUnicodeSegura(dins, forma)).toBe(dins.normalize(forma));
      expect(normalitzaUnicodeSegura(dins + '\u0300', forma)).toBe('');
    }
    // General_Category=M també inclou marques de CCC0: el límit és conservador.
    expect(normalitzaUnicodeSegura('\u034f'.repeat(65))).toBe('');
    expect(normalitzaUnicodeSegura('x' + '\u{1d165}'.repeat(65))).toBe('');
  });

  test('rebutja abans de normalize i no coacciona objectes', () => {
    const spy = vi.spyOn(String.prototype, 'normalize');
    try {
      expect(normalitzaUnicodeSegura(hostil)).toBe('');
      expect(spy).not.toHaveBeenCalled();
      const toString = vi.fn(() => { throw new Error('No executar'); });
      expect(normalitzaUnicodeSegura({ toString })).toBe('');
      expect(toString).not.toHaveBeenCalled();
      expect(() => normalitzaUnicodeSegura('x', 'NFKD')).toThrow(RangeError);
    } finally { spy.mockRestore(); }
  });

  test.each(regulars)('preserva el contracte natiu i els consumidors regulars: %s', valor => {
    expect(normalitzaUnicodeSegura(valor)).toBe(valor.normalize('NFC'));
    expect(normalitzaUnicodeSegura(valor, 'NFD')).toBe(valor.normalize('NFD'));
    expect(netejaText(valor)).toBe(textAntic(valor));
    expect(normalizeSearchText(valor)).toBe(cercaAntiga(valor));
    expect(sanejaAutoria(valor)).toBe(autoriaAntiga(valor));
    const origenAntic = textAntic(valor.replace(/[\uD800-\uDFFF]/gu, ''), Infinity);
    expect(netejaCampOrigen(valor)).toBe(Array.from(origenAntic).slice(0, 300).join(''));
  });

  test.each([
    ['netejaText', netejaText], ['normalizeSearchText', normalizeSearchText],
    ['sanejaAutoria', sanejaAutoria], ['netejaCampOrigen', netejaCampOrigen],
    ['normalitzaDades', x => normalitzaDades('vehicle', { lloc_eixida: x }).lloc_eixida ?? ''],
  ])('%s rebutja la contraprova de64KiB en menys de25ms', (_nom, fn) => {
    expect(new TextEncoder().encode(hostil).length).toBe(65536);
    for (let i = 0; i < 20; i += 1) fn('a');
    const inici = performance.now();
    expect(fn(hostil)).toBe('');
    expect(performance.now() - inici).toBeLessThan(25);
  });

  test('mapper i projecció/slug són consumidors reals i no alteren el draft original', () => {
    const payload = Object.freeze({ title: hostil, content: '', description: '', tag: '', source: '' });
    const submission = Object.freeze({ id: '1', sectionId: 'multimedia', createdAt: '2026-11-18T00:00:00Z', payload });
    const item = mapSectionSubmissionToItem(submission);
    expect(item.title).toBe('');
    expect(item.searchText).toBe('');
    expect(payload.title).toBe(hostil);
    expect(submission.payload).toBe(payload);

    const dades = Object.freeze({ categoria: hostil, preu: '3' });
    const draft = Object.freeze({ ambit: 'mercat', dades });
    const net = projeccioPayload(draft);
    expect(net.dades).not.toHaveProperty('categoria');
    expect(net).not.toHaveProperty('category_slug');
    expect(draft.dades.categoria).toBe(hostil);
    expect(projeccioPayload({ ambit: 'mercat', dades: { categoria: '  Fruïta de València  ', preu: '3' } }).category_slug).toBe('fruita-de-valencia');
  });

  test('els camps JSONB del mapper i de dades no executen coercions d’objectes', () => {
    const toString = vi.fn(() => { throw new Error('No executar'); });
    const hostilObjecte = Object.freeze({ toString });
    const item = mapSectionSubmissionToItem({ id: '2', sectionId: 'multimedia', createdAt: '2026-11-18T00:00:00Z', payload: { title: hostilObjecte, content: '', description: hostilObjecte } });
    expect(item.title).toBe('Arxiu Multimèdia');
    expect(normalitzaDades('vehicle', { lloc_eixida: hostilObjecte })).not.toHaveProperty('lloc_eixida');
    expect(toString).not.toHaveBeenCalled();
  });
});
