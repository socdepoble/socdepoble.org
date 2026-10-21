// @vitest-environment node
/* Encàrrec 261019_1425 · La política de mitjans del paquet: quan un .webp és
   la bessona d'un original, i què viatja a la variant del directori. */
import { describe, expect, test } from 'vitest';
import { MITJANS_EXTERNS_DEL_DIRECTORI, bessonaDe, bessonesDe, esExtern, separaRecursos } from './politicaDeMitjans.js';

describe('les bessones WebP', () => {
  test('el camí de la bessona: el mateix nom amb .webp en minúscules, només per a PNG i JPEG', () => {
    expect(bessonaDe('assets/towns/tibi/1.jpg')).toBe('assets/towns/tibi/1.webp');
    expect(bessonaDe('assets/a/foto.jpeg')).toBe('assets/a/foto.webp');
    expect(bessonaDe('assets/a/logo.PNG')).toBe('assets/a/logo.webp');
    // El tractor conserva la caixa del nom: DSC00410.JPG → DSC00410.webp.
    expect(bessonaDe('assets/uploads/poble/DSC00410.JPG')).toBe('assets/uploads/poble/DSC00410.webp');
    for (const cap of ['assets/a/x.webp', 'assets/a/x.svg', 'assets/a/x.gif', 'assets/a/jpg', '', null, undefined]) {
      expect(bessonaDe(cap), String(cap)).toBeNull();
    }
  });

  test('un original amb la seua bessona, i res més', () => {
    const camins = [
      'assets/a/foto.jpg', 'assets/a/foto.webp',
      'assets/a/sola.png',
      'assets/a/solta.webp',
      'assets/b/DSC00410.JPG', 'assets/b/DSC00410.webp'
    ];
    expect(bessonesDe(camins)).toEqual(['assets/a/foto.jpg', 'assets/b/DSC00410.JPG']);
    expect(Object.isFrozen(bessonesDe(camins))).toBe(true);
  });

  test('dos originals amb el mateix nom no tenen bessona (el tractor els salta)', () => {
    expect(bessonesDe(['assets/og.jpg', 'assets/og.png', 'assets/og.webp'])).toEqual([]);
    // Sense distingir majúscules, com el disc d'un Mac.
    expect(bessonesDe(['assets/Foto.jpg', 'assets/foto.PNG', 'assets/Foto.webp'])).toEqual([]);
  });

  test('la bessona porta el nom exacte: ni una altra caixa ni una altra carpeta', () => {
    expect(bessonesDe(['assets/a/Foto.jpg', 'assets/a/foto.webp'])).toEqual([]);
    expect(bessonesDe(['assets/a/foto.jpg', 'assets/a/foto.WEBP'])).toEqual([]);
    expect(bessonesDe(['assets/a/foto.jpg', 'assets/b/foto.webp'])).toEqual([]);
  });
});

describe('els mitjans externs del directori', () => {
  test('l’origen és https i els prefixos són carpetes senceres d’assets/, congelats', () => {
    expect(Object.isFrozen(MITJANS_EXTERNS_DEL_DIRECTORI)).toBe(true);
    expect(Object.isFrozen(MITJANS_EXTERNS_DEL_DIRECTORI.prefixos)).toBe(true);
    expect(MITJANS_EXTERNS_DEL_DIRECTORI.origen).toMatch(/^https:\/\/[^/]+$/);
    for (const prefix of MITJANS_EXTERNS_DEL_DIRECTORI.prefixos) expect(prefix, prefix).toMatch(/^assets\/[a-z_]+\/$/);
    // La interfície i el contingut fix de l'app viatgen (guia 7 del directori; D1 del Mestre, opció B): cap prefix no els cobrix.
    for (const cami of ['assets/system/ui/logo.png', 'assets/ui/plugins/consola_vinyeta.jpg', 'assets/notes/bloc_notes_vintage.jpg',
      'assets/nano_cards/mur_nano_card.jpg', 'assets/img/que-es-socdepoble-1.jpg',
      'assets/soc_de_poble_ibanez.webp', 'assets/pedra-seca.css', 'rag-index.json', 'fonts/noto-sans.css']) {
      expect(esExtern(cami, MITJANS_EXTERNS_DEL_DIRECTORI.prefixos), cami).toBe(false);
    }
    // El contingut del servei, a l'origen extern.
    expect([...MITJANS_EXTERNS_DEL_DIRECTORI.prefixos]).toEqual(['assets/uploads/', 'assets/towns/', 'assets/fotos/', 'assets/events/']);
    expect(esExtern('assets/uploads/poble/x.jpg', MITJANS_EXTERNS_DEL_DIRECTORI.prefixos)).toBe(true);
  });

  test('un prefix és una carpeta exacta: ni un nom que hi comença ni la mateixa carpeta més avall', () => {
    const prefixos = ['assets/uploads/'];
    expect(esExtern('assets/uploads/x.png', prefixos)).toBe(true);
    expect(esExtern('assets/uploadsX/x.png', prefixos)).toBe(false);
    expect(esExtern('x/assets/uploads/x.png', prefixos)).toBe(false);
    expect(esExtern('assets/uploads', prefixos)).toBe(false);
  });

  test('separaRecursos: externs fora, originals amb bessona substituïts, la resta viatja en ordre', () => {
    const camins = [
      'assets/towns/a/1.jpg', 'assets/towns/a/1.webp',
      'assets/ui/plugins/consola_vinyeta.jpg', 'assets/ui/plugins/consola_vinyeta.webp',
      'assets/ui/plugins/petita.jpg',
      'assets/system/ui/logo.svg',
      'rag-index.json'
    ];
    const politica = { externs: ['assets/towns/'], bessones: bessonesDe(camins) };
    expect(separaRecursos(camins, politica)).toEqual({
      viatgen: ['assets/ui/plugins/consola_vinyeta.webp', 'assets/ui/plugins/petita.jpg', 'assets/system/ui/logo.svg', 'rag-index.json'],
      externs: ['assets/towns/a/1.jpg', 'assets/towns/a/1.webp'],
      substituits: ['assets/ui/plugins/consola_vinyeta.jpg']
    });
  });

  test('sense política tot viatja; una política vella no deixa cap original sense la seua bessona', () => {
    const camins = ['assets/a/x.jpg', 'assets/b/y.png'];
    expect(separaRecursos(camins)).toEqual({ viatgen: camins, externs: [], substituits: [] });
    expect(separaRecursos(camins, { externs: [], bessones: ['assets/a/x.jpg'] })).toEqual({ viatgen: camins, externs: [], substituits: [] });
  });
});
