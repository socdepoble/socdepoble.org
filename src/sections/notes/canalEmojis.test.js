/* Gauntlet 261017 (F32, F34) · El canal entre la graella d'emojis del Bloc i
   l'editor de la nota oberta (canalEmojis.js), sense React de pantalla:
     · copiaAlPortaretalls: null sense porta-retalls, i sempre una promesa
       (també quan writeText peta de colp);
     · useCanalEmojisDelBloc: mana l'últim editor registrat, el desregistre
       només esborra el seu, obri() fixa si s'escriu amb el pot() d'eixe
       moment i un editor que peta compta com a no;
     · carregaCatalegEmojis: el catàleg de veres, en famílies del selector, i
       el porten tots els DialegEmoticona de l'app (F30). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { carregaCatalegEmojis, copiaAlPortaretalls, useCanalEmojis, useCanalEmojisDelBloc } from './canalEmojis.js';

/* El porta-retalls del navegador (jsdom no en porta). */
const portaretalls = (valor) => Object.defineProperty(globalThis.navigator, 'clipboard', { configurable: true, value: valor });
afterEach(() => {
  delete globalThis.navigator.clipboard;
});

describe('copiaAlPortaretalls', () => {
  test('sense porta-retalls, o sense writeText, null', () => {
    expect(copiaAlPortaretalls('🍅')).toBeNull();
    portaretalls({});
    expect(copiaAlPortaretalls('🍅')).toBeNull();
  });

  test('torna la promesa de writeText, també si writeText no en torna cap', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    portaretalls({ writeText });
    await expect(copiaAlPortaretalls('🍅')).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith('🍅');
    portaretalls({ writeText: () => 'fet' });
    await expect(copiaAlPortaretalls('🌽')).resolves.toBe('fet');
  });

  test('un writeText que peta de colp (Safari fora del gest) és una promesa rebutjada, mai una excepció', async () => {
    const error = new Error('NotAllowedError');
    portaretalls({ writeText: () => { throw error; } });
    let copia;
    expect(() => { copia = copiaAlPortaretalls('🍅'); }).not.toThrow();
    await expect(copia).rejects.toBe(error);
    portaretalls({ writeText: () => Promise.reject(error) });
    await expect(copiaAlPortaretalls('🍅')).rejects.toBe(error);
  });
});

describe('useCanalEmojisDelBloc', () => {
  const editor = (pot = true, inserix = true) => ({ pot: vi.fn(() => pot), inserix: vi.fn(() => inserix) });

  test('arrenca tancat; el canal és estable entre pintats; fora del Bloc, useCanalEmojis és null', () => {
    const { result, rerender } = renderHook(() => useCanalEmojisDelBloc());
    expect(result.current).toMatchObject({ obert: false, inserir: false });
    const { canal } = result.current;
    rerender();
    expect(result.current.canal).toBe(canal);
    expect(Object.keys(canal).sort()).toEqual(['obri', 'registra']);
    expect(renderHook(() => useCanalEmojis()).result.current).toBeNull();
  });

  test('sense cap editor: obri() copia (inserir false) i inserix diu que no', () => {
    const { result } = renderHook(() => useCanalEmojisDelBloc());
    act(() => result.current.canal.obri());
    expect(result.current).toMatchObject({ obert: true, inserir: false });
    expect(result.current.inserix('🍅')).toBe(false);
    // Un registre sense funció no registra res, i el seu desregistre no fa res.
    const desregistra = result.current.canal.registra('no és una funció');
    expect(typeof desregistra).toBe('function');
    expect(() => desregistra()).not.toThrow();
    expect(result.current.inserix('🍅')).toBe(false);
  });

  test('mana l’últim editor registrat; el desregistre només esborra el seu', () => {
    const { result } = renderHook(() => useCanalEmojisDelBloc());
    const a = editor();
    const b = editor();
    const fora = result.current.canal.registra(a.inserix, { pot: a.pot });
    const foraB = result.current.canal.registra(b.inserix, { pot: b.pot });
    expect(result.current.inserix('🍅')).toBe(true);
    expect(b.inserix).toHaveBeenCalledWith('🍅');
    expect(a.inserix).not.toHaveBeenCalled();
    // El vell es desregistra tard (un desmuntatge després del muntatge del nou): B continua.
    fora();
    expect(result.current.inserix('🌽')).toBe(true);
    expect(b.inserix).toHaveBeenLastCalledWith('🌽');
    expect(a.inserix).not.toHaveBeenCalled();
    foraB();
    expect(result.current.inserix('🌿')).toBe(false);
    expect(b.inserix).toHaveBeenCalledTimes(2);
  });

  test('obri() fixa inserir amb el pot() d’eixe moment; sense pot, s’hi pot escriure', () => {
    const { result } = renderHook(() => useCanalEmojisDelBloc());
    const a = editor(true);
    result.current.canal.registra(a.inserix, { pot: a.pot });
    act(() => result.current.canal.obri());
    expect(result.current).toMatchObject({ obert: true, inserir: true });
    expect(a.pot).toHaveBeenCalledTimes(1);
    // El diàleg modal tapa la resta: el que diga pot() després no canvia res fins a tornar a obrir.
    a.pot.mockReturnValue(false);
    expect(result.current.inserir).toBe(true);
    act(() => result.current.tanca());
    expect(result.current.obert).toBe(false);
    act(() => result.current.canal.obri());
    expect(result.current).toMatchObject({ obert: true, inserir: false });
    const sensePot = vi.fn(() => true);
    result.current.canal.registra(sensePot);
    act(() => result.current.canal.obri());
    expect(result.current.inserir).toBe(true);
  });

  test('un editor que peta, o que no diu exactament true, compta com a no', () => {
    const { result } = renderHook(() => useCanalEmojisDelBloc());
    const peta = () => { throw new Error('editor destruït'); };
    result.current.canal.registra(peta, { pot: peta });
    act(() => result.current.canal.obri());
    expect(result.current.inserir).toBe(false);
    expect(result.current.inserix('🍅')).toBe(false);
    result.current.canal.registra(() => 1, { pot: () => 'sí' });
    act(() => result.current.canal.obri());
    expect(result.current.inserir).toBe(false);
    expect(result.current.inserix('🍅')).toBe(false);
  });

  test('tanca() amb el diàleg ja tancat no torna a pintar', () => {
    let pintats = 0;
    const { result } = renderHook(() => { pintats += 1; return useCanalEmojisDelBloc(); });
    const abans = pintats;
    act(() => result.current.tanca());
    expect(pintats).toBe(abans);
  });
});

describe('carregaCatalegEmojis', () => {
  test('el catàleg de veres, a demanda i en famílies del selector', async () => {
    const modul = await carregaCatalegEmojis();
    expect(Object.keys(modul)).toEqual(['GRUPS_EMOJIS']);
    expect(modul.GRUPS_EMOJIS.map((familia) => familia.nom)).toEqual(
      ['Cares', 'Persones', 'Animals', 'Menjar', 'Activitats', 'Viatges', 'Objectes', 'Símbols', 'Banderes']
    );
    expect(modul.GRUPS_EMOJIS.reduce((suma, familia) => suma + familia.emojis.length, 0)).toBe(3963);
  }, 30000);
});

/* F30 («DialegEmoticona substituït per graella Unicode18 accessible», sencera)
   · Cada muntatge de l'app, fora de proves, porta el catàleg. Gauntlet 261017
   (WP7a) · Els dos espècimens de Disseny (EspecimenClassificacio i
   EspecimenEmoticonaBarra) ja el porten: la llista de pendents és buida i ha
   de continuar buida. */
describe('F30 · els DialegEmoticona de l’app', () => {
  const ARREL = process.cwd();
  const PENDENTS = Object.freeze([]);

  test('tots porten carregaCataleg, també els espècimens de Disseny', () => {
    const fitxers = readdirSync(path.join(ARREL, 'src'), { recursive: true })
      .map((relatiu) => path.join('src', String(relatiu)).split(path.sep).join('/'))
      .filter((ruta) => /\.jsx?$/.test(ruta) && !/\.test\.jsx?$/.test(ruta));
    const muntatges = fitxers.flatMap((ruta) => {
      const codi = readFileSync(path.join(ARREL, ruta), 'utf8');
      return [...codi.matchAll(/<DialegEmoticona\b[\s\S]*?\/>/g)].map(([element]) => ({ ruta, element }));
    });
    expect(muntatges.map(({ ruta }) => ruta)).toEqual(expect.arrayContaining([
      'src/sections/notes/NotesEditor.jsx', 'src/sections/notes/SnippetCurador.jsx', 'src/sections/profile/PerfilEditor.jsx',
      'src/sections/disseny/cataleg/detalls/EspecimenClassificacio.jsx', 'src/sections/disseny/cataleg/detalls/EspecimenEmoticonaBarra.jsx'
    ]));
    const senseGraella = muntatges.filter(({ element }) => !/\scarregaCataleg=\{carregaCatalegEmojis\}/.test(element)).map(({ ruta }) => ruta);
    expect(senseGraella.sort()).toEqual([...PENDENTS]);
  });
});
