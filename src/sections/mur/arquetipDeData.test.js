/**
 * P0-77 / IDEA-208 (R16-P; ordre del Mestre, 261109 20:57) · L'arquetip de la
 * data d'una targeta del Mur: 'esdeveniment' (porta al dia), 'efimer' (un
 * <time> sense clic) o 'editorial' (la pastilla de sempre, al mes).
 */
import { describe, expect, test } from 'vitest';
import { arquetipDeLaData } from './arquetipDeData.js';

const post = (extra = {}) => ({ id: 'p', type: 'post', title: 'Títol', ...extra });

describe('arquetipDeLaData', () => {
  test('un acte és esdeveniment, porte les etiquetes que porte', () => {
    expect(arquetipDeLaData({ id: 'a', type: 'event', title: 'Concert' })).toBe('esdeveniment');
    expect(arquetipDeLaData({ id: 'a', type: 'event', labels: ['Busco'] }, { alertaMunicipal: 'alerta' })).toBe('esdeveniment');
  });

  test('una publicació de sempre és editorial', () => {
    expect(arquetipDeLaData(post())).toBe('editorial');
    expect(arquetipDeLaData(post({ labels: ['feed', { text: 'Crònica' }] }))).toBe('editorial');
    expect(arquetipDeLaData(post({ type: 'feed' }))).toBe('editorial');
  });

  test.each([
    ['Busco'], ['busco'], ['Perdut'], ['Perduda'], ['Trobat'], ['Trobada'], ['Avís'], ['AVÍS VEÏNAL'],
    ['Ajuda veïnal'], ['Claus trobades'], ['Avís d’aigua'], ["Avís d'aigua"], [{ text: 'Busco' }]
  ])('l’etiqueta %j fa efímera la publicació (sense accents ni majúscules)', (etiqueta) => {
    expect(arquetipDeLaData(post({ labels: [etiqueta] }))).toBe('efimer');
  });

  test('també categories, tags, category i tag', () => {
    expect(arquetipDeLaData(post({ categories: ['Trobat'] }))).toBe('efimer');
    expect(arquetipDeLaData(post({ tags: ['claus trobades'] }))).toBe('efimer');
    expect(arquetipDeLaData(post({ category: 'Avís' }))).toBe('efimer');
    expect(arquetipDeLaData(post({ tag: 'perdut' }))).toBe('efimer');
  });

  test('una alerta municipal ja comprovada o un avís marcat són efímers', () => {
    expect(arquetipDeLaData(post(), { alertaMunicipal: 'alerta' })).toBe('efimer');
    expect(arquetipDeLaData(post(), { alertaMunicipal: 'bandol_urgent' })).toBe('efimer');
    expect(arquetipDeLaData(post({ isAvis: true }))).toBe('efimer');
    /* Un tipus desconegut o heretat de l'objecte no compta. */
    expect(arquetipDeLaData(post(), { alertaMunicipal: 'toString' })).toBe('editorial');
    expect(arquetipDeLaData(post(), { alertaMunicipal: 'qualsevol' })).toBe('editorial');
  });

  test('una fitxa d’Animalets d’animal perdut o trobat és efímera (dades.modalitat, sense etiqueta)', () => {
    const fitxa = (modalitat, extra = {}) => ({ id: 'g', type: 'animalets', ambit: 'animalets', title: 'Gos negre', dades: { modalitat, especie: 'gos' }, ...extra });
    expect(arquetipDeLaData(fitxa('perdut'))).toBe('efimer');
    expect(arquetipDeLaData(fitxa('trobat'))).toBe('efimer');
    /* L'adopció i la cura no caduquen com un avís. */
    expect(arquetipDeLaData(fitxa('adopcio'))).toBe('editorial');
    expect(arquetipDeLaData(fitxa('cura'))).toBe('editorial');
    /* La modalitat només compta a Animalets, i només si és un text de dades. */
    expect(arquetipDeLaData({ ...fitxa('perdut'), ambit: 'vehicle', type: 'vehicle' })).toBe('editorial');
    expect(arquetipDeLaData(fitxa(['perdut']))).toBe('editorial');
    expect(arquetipDeLaData(fitxa('perdut', { dades: ['perdut'] }))).toBe('editorial');
    expect(arquetipDeLaData(fitxa('perdut', { isSystem: true }))).toBe('editorial');
  });

  test('una pàgina del sistema, un producte del Mercat o un poble mai no són efímers', () => {
    expect(arquetipDeLaData(post({ isSystem: true, isAvis: true, labels: ['Avís'] }), { alertaMunicipal: 'alerta' })).toBe('editorial');
    expect(arquetipDeLaData(post({ type: 'market', labels: ['Busco'] }), { alertaMunicipal: 'alerta' })).toBe('editorial');
    expect(arquetipDeLaData(post({ type: 'product', labels: ['Trobat'] }))).toBe('editorial');
    expect(arquetipDeLaData(post({ type: 'poble', labels: ['Avís'] }))).toBe('editorial');
  });

  test('una etiqueta de més de 64 caràcters no compta, ni una que només en conté una', () => {
    expect(arquetipDeLaData(post({ labels: [`Busco ${'x'.repeat(64)}`] }))).toBe('editorial');
    expect(arquetipDeLaData(post({ labels: ['Avisos de la festa'] }))).toBe('editorial');
  });

  test('una entrada que no és un element és editorial', () => {
    for (const brossa of [null, undefined, 'avis', 3, [], [post({ labels: ['Busco'] })]]) {
      expect(arquetipDeLaData(brossa)).toBe('editorial');
    }
  });
});
