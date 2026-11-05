/**
 * P0-25 (Onada R6, Bloc 2) · El magatzem de revisions editorials de la llavor
 * i dels actes: desat al navegador, solapament sobre l'element, oients de la
 * mateixa pestanya i de les altres (esdeveniment `storage`).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { STORAGE_PREFIX } from '../config/storage.js';
import {
  _reiniciaRevisionsEditorialsPerAProves,
  desaRevisioEditorial,
  oblidaRevisioEditorial,
  revisaElement,
  revisaLlista,
  revisioEditorial,
  subscriuRevisionsEditorials,
  versioRevisionsEditorials
} from './revisionsEditorials.js';

const CLAU = `${STORAGE_PREFIX}publicacions.revisions.v1`;
const MANIFEST = { id: 'manifest-de-poble', title: 'Manifest de Poble', post_subtitle: 'Una veu', entradilla: 'Resum', content: 'Text pla vell', image_url: '/assets/m.webp' };
const APLEC = { id: 'aplec-2023', title: '2n Aplec pel Territori', subtitle: 'Nou Aplec', entradilla: 'Benillup', content: '<p>Vell</p>' };

beforeEach(() => { _reiniciaRevisionsEditorialsPerAProves(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('revisionsEditorials', () => {
  test('desa per secció i id, fusiona i persistix al localStorage amb la clau prefixada', () => {
    expect(desaRevisioEditorial('mur', 'manifest-de-poble', { content: '<p>Nou</p>' })).toBe(true);
    expect(desaRevisioEditorial('mur', 'manifest-de-poble', { title: 'Manifest revisat' })).toBe(true);
    expect(revisioEditorial('mur', 'manifest-de-poble')).toEqual({ content: '<p>Nou</p>', title: 'Manifest revisat' });
    expect(revisioEditorial('events', 'manifest-de-poble')).toBeNull();
    const desat = JSON.parse(window.localStorage.getItem(CLAU));
    expect(desat['mur:manifest-de-poble'].camps).toEqual({ content: '<p>Nou</p>', title: 'Manifest revisat' });
    expect(typeof desat['mur:manifest-de-poble'].desadaEl).toBe('string');
  });

  test('rebutja seccions, ids i camps desconeguts o mal tipats', () => {
    expect(desaRevisioEditorial('mercat', 'samarreta', { title: 'X' })).toBe(false);
    expect(desaRevisioEditorial('mur', '', { title: 'X' })).toBe(false);
    expect(desaRevisioEditorial('mur', 'm', { autor: 'algú', title: 42 })).toBe(false);
    expect(desaRevisioEditorial('mur', 'm', { title: 'x'.repeat(5000) })).toBe(false);
    expect(desaRevisioEditorial('mur', 'm', { title: 'Bo', isSystem: true, tags: ['a', 3] })).toBe(true);
    expect(revisioEditorial('mur', 'm')).toEqual({ title: 'Bo', tags: ['a'] });
  });

  test('el solapament posa cada camp a la clau que l’element ja llig, sense tocar l’original', () => {
    desaRevisioEditorial('mur', 'manifest-de-poble', { title: 'T', subtitle: 'S', lead: 'L', content: '<p>Nou</p>', heroImage: '/assets/n.webp' });
    const revisat = revisaElement('mur', MANIFEST);
    expect(revisat).toMatchObject({ title: 'T', post_subtitle: 'S', entradilla: 'L', content: '<p>Nou</p>', image_url: '/assets/n.webp' });
    expect(revisat).not.toHaveProperty('subtitle');
    expect(MANIFEST.content).toBe('Text pla vell');
    desaRevisioEditorial('events', 'aplec-2023', { subtitle: 'Aplec revisat' });
    expect(revisaElement('events', APLEC).subtitle).toBe('Aplec revisat');
    expect(revisaElement('events', APLEC)).not.toHaveProperty('post_subtitle');
  });

  test('revisaLlista torna la MATEIXA llista si cap element té revisió', () => {
    const llista = [MANIFEST, { id: 'altre', title: 'Altre' }];
    expect(revisaLlista(llista, 'mur')).toBe(llista);
    desaRevisioEditorial('mur', 'manifest-de-poble', { content: '<p>Nou</p>' });
    const revisada = revisaLlista(llista, 'mur');
    expect(revisada).not.toBe(llista);
    expect(revisada[0].content).toBe('<p>Nou</p>');
    expect(revisada[1]).toBe(llista[1]);
    expect(revisaLlista(llista, 'events')).toBe(llista);
  });

  test('avisa la mateixa pestanya en desar i oblidar', () => {
    const oient = vi.fn();
    const deixa = subscriuRevisionsEditorials(oient);
    const abans = versioRevisionsEditorials();
    desaRevisioEditorial('events', 'aplec-2023', { content: '<p>Nou</p>' });
    expect(oient).toHaveBeenCalledTimes(1);
    expect(oblidaRevisioEditorial('events', 'aplec-2023')).toBe(true);
    expect(oient).toHaveBeenCalledTimes(2);
    expect(versioRevisionsEditorials()).toBe(abans + 2);
    expect(revisioEditorial('events', 'aplec-2023')).toBeNull();
    deixa();
  });

  test('una altra pestanya: l’esdeveniment `storage` amb la clau torna a llegir i avisa; una altra clau, no', () => {
    const oient = vi.fn();
    const deixa = subscriuRevisionsEditorials(oient);
    window.localStorage.setItem(CLAU, JSON.stringify({ 'mur:manifest-de-poble': { camps: { content: '<p>D’una altra pestanya</p>' } } }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'una-altra-clau' }));
    expect(oient).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent('storage', { key: CLAU }));
    expect(oient).toHaveBeenCalledTimes(1);
    expect(revisaElement('mur', MANIFEST).content).toBe('<p>D’una altra pestanya</p>');
    deixa();
    window.dispatchEvent(new StorageEvent('storage', { key: CLAU }));
    expect(oient).toHaveBeenCalledTimes(1);
  });

  test('un storage manipulat no injecta claus ni camps estranys; un storage que peta no trenca res', () => {
    window.localStorage.setItem(CLAU, JSON.stringify({
      'mur:x': { camps: { title: 'Bo', onclick: 'mal' } }, 'mercat:y': { camps: { title: 'No' } }, '__proto__': { camps: { title: 'No' } }
    }));
    const deixa = subscriuRevisionsEditorials(() => {});
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    deixa();
    expect(revisioEditorial('mur', 'x')).toEqual({ title: 'Bo' });
    expect(revisioEditorial('mercat', 'y')).toBeNull();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(desaRevisioEditorial('mur', 'x', { content: '<p>En memòria</p>' })).toBe(true);
    expect(revisioEditorial('mur', 'x').content).toBe('<p>En memòria</p>');
  });
});
