// @vitest-environment node
/* Onada 0.3 (Gauntlet 261016, M03) · La frescor del cens de l'Arxiu visual
   (censImatges.js), fet a mà a partir de `rg --files public/assets`:
     · cada src del cens existix al disc, amb la caixa exacta (el servidor de
       producció distingix «.JPG» de «.jpg»);
     · cada imatge ràster de public/assets és al cens o a EXCLOSES, amb el
       motiu: una foto nova que ningú no hi afig fa roja esta prova, i l'Arxiu
       no torna a quedar-se en una mostra;
     · res de la interfície (system/), cap SVG, cap logotip, cap còpia;
     · àmbits i orígens del vocabulari, ids únics i aptes per a ?foto=. */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { ALIES_DEL_CENS, AMBITS, CENS_IMATGES, EXCLOSES, idDelCens, mitjansDelCens } from './censImatges.js';

const PUBLIC = path.join(process.cwd(), 'public');
const RASTER = /\.(?:jpe?g|png|webp|gif|avif)$/i;

/* Tots els fitxers de public/assets, amb el camí tal com el servix el web. */
function fitxersDe(dir) {
  return readdirSync(dir).flatMap((nom) => {
    const ple = path.join(dir, nom);
    if (statSync(ple).isDirectory()) return fitxersDe(ple);
    return [`/${path.relative(PUBLIC, ple).split(path.sep).join('/')}`];
  });
}
const DISC = fitxersDe(path.join(PUBLIC, 'assets'));
const AL_DISC = new Set(DISC);

describe('el cens de l’Arxiu visual', () => {
  test('cada src existix al disc amb la caixa exacta', () => {
    expect(CENS_IMATGES.filter((entrada) => !AL_DISC.has(entrada.src)).map((entrada) => entrada.src)).toEqual([]);
  });

  test('cada imatge ràster de public/assets és al cens o a EXCLOSES (fora de system/)', () => {
    const delCens = new Set(CENS_IMATGES.map((entrada) => entrada.src));
    const oblidades = DISC
      .filter((src) => RASTER.test(src) && !src.startsWith('/assets/system/'))
      .filter((src) => !delCens.has(src) && !Object.hasOwn(EXCLOSES, src));
    expect(oblidades, 'imatges noves sense entrada: afegiu-les a CENS_IMATGES o a EXCLOSES amb el motiu').toEqual([]);
    expect(CENS_IMATGES.length).toBeGreaterThan(100);
  });

  test('cada exclosa existix i porta el seu motiu; cap no és alhora al cens', () => {
    const delCens = new Set(CENS_IMATGES.map((entrada) => entrada.src));
    for (const [src, motiu] of Object.entries(EXCLOSES)) {
      expect(AL_DISC.has(src), src).toBe(true);
      expect(typeof motiu === 'string' && motiu.length > 3, src).toBe(true);
      expect(delCens.has(src), src).toBe(false);
    }
  });

  test('res de la interfície, cap SVG ni cap logotip; cap src repetit', () => {
    const srcs = CENS_IMATGES.map((entrada) => entrada.src);
    expect(srcs.filter((src) => src.startsWith('/assets/system/') || /\.svg$/i.test(src) || /logo|badge/i.test(src))).toEqual([]);
    expect(srcs.filter((src, index) => srcs.indexOf(src) !== index)).toEqual([]);
    expect(srcs.every((src) => RASTER.test(src))).toBe(true);
  });

  test('els avatars triplicats hi són una vegada, al camí que nomena el codi', () => {
    const srcs = CENS_IMATGES.map((entrada) => entrada.src);
    expect(srcs.filter((src) => src.includes('/uploads/gent/avatars/'))).toEqual([]);
    expect(srcs.filter((src) => /\/andreu-soler-comic\.png$/.test(src))).toEqual(['/assets/uploads/avatars/andreu-soler-comic.png']);
    /* Una sola foto de perfil de la persona pilot: la de PERSONA_PILOT. */
    expect(srcs.filter((src) => /javi-llinares-(perfil|foto)/.test(src))).toEqual([
      '/assets/fotos/javi-llinares-perfil-1200px.jpg',
      '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg'
    ]);
  });

  test('àmbits i orígens del vocabulari, amb títol; les fotos de poble diuen el poble', () => {
    for (const entrada of CENS_IMATGES) {
      expect(AMBITS, entrada.src).toContain(entrada.ambit);
      expect(['ia', 'foto', 'sistema'], entrada.src).toContain(entrada.origen);
      expect(typeof entrada.titol === 'string' && entrada.titol.trim() !== '', entrada.src).toBe(true);
      if (entrada.ambit === 'poble') expect(entrada.poble, entrada.src).toMatch(/^[a-z0-9-]+$/);
      expect(Object.isFrozen(entrada)).toBe(true);
    }
    /* Les quatre il·lustracions dels personatges i les vinyetes són d'IA; la
       persona pilot i els pobles, fotos. */
    const origenDe = (src) => CENS_IMATGES.find((entrada) => entrada.src === src)?.origen;
    expect(['carla-soriano.png', 'el-viatjant.png', 'iaia-maria.png', 'sultan.png'].map((f) => origenDe(`/assets/fotos/${f}`))).toEqual(['ia', 'ia', 'ia', 'ia']);
    expect(origenDe('/assets/fotos/javi-llinares-perfil-1200px.jpg')).toBe('foto');
    expect(origenDe('/assets/ui/plugins/tpv_vinyeta.webp')).toBe('ia');
    expect(CENS_IMATGES.filter((entrada) => entrada.src.startsWith('/assets/towns/')).every((entrada) => entrada.origen === 'foto' && entrada.ambit === 'poble')).toBe(true);
  });

  /* Revisió adversarial del 261016 · El port de producció porta la foto de
     perfil de Javi amb el camí de la còpia; el cens, amb el de l'original: la
     fusió de l'Arxiu les iguala amb estos àlies (mediaContent.js · fusionaMitjans). */
  test('els àlies: cada còpia d’EXCLOSES que nomena el seu original apunta a una entrada del cens', () => {
    const delCens = new Set(CENS_IMATGES.map((entrada) => entrada.src));
    expect(ALIES_DEL_CENS['/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg']).toBe('/assets/fotos/javi-llinares-perfil-1200px.jpg');
    expect(ALIES_DEL_CENS['/assets/uploads/gent/avatars/andreu-soler-comic.png']).toBe('/assets/uploads/avatars/andreu-soler-comic.png');
    for (const [copia, original] of Object.entries(ALIES_DEL_CENS)) {
      expect(Object.hasOwn(EXCLOSES, copia), copia).toBe(true);
      expect(delCens.has(original), `${copia} → ${original}`).toBe(true);
    }
    /* Una variant de resolució o un logotip no són còpies de res. */
    expect(ALIES_DEL_CENS).not.toHaveProperty(['/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.jpg']);
    expect(ALIES_DEL_CENS).not.toHaveProperty(['/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg']);
    expect(Object.isFrozen(ALIES_DEL_CENS)).toBe(true);
  });

  test('ids únics i aptes per a ?foto=; la forma d’un mitjà de l’Arxiu', () => {
    const mitjans = mitjansDelCens();
    const ids = mitjans.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^cens-[a-z0-9-]+$/.test(id))).toBe(true);
    expect(idDelCens('/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.JPG')).toBe('cens-uploads-poble-la-torre-de-les-macanes-dsc00320');
    expect(mitjans.find((m) => m.src === '/assets/towns/tibi/2.jpg')).toEqual({
      id: 'cens-towns-tibi-2', title: 'Tibi, segona vista', src: '/assets/towns/tibi/2.jpg', kind: 'image', tag: 'Arxiu',
      origen: 'foto', ambit: 'poble', poble: 'tibi', sectionId: 'multimedia'
    });
    expect(mitjans.find((m) => m.src === '/assets/notes/bloc_notes_vintage.jpg')).not.toHaveProperty('poble');
  });
});
