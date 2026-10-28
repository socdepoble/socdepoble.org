// @vitest-environment node
/* Onada 0.3 (Gauntlet 261016, M03) · La frescor del cens de l'Arxiu visual
   (censImatges.js), fet a mà a partir de `rg --files public/assets`:
     · cada src del cens existix al disc, amb la caixa exacta (el servidor de
       producció distingix «.JPG» de «.jpg»);
     · cada imatge ràster de public/assets és al cens o a EXCLOSES, amb el
       motiu: una foto nova que ningú no hi afig fa roja esta prova, i l'Arxiu
       no torna a quedar-se en una mostra;
     · res de la interfície (system/), cap SVG, cap logotip, cap còpia;
     · àmbits i orígens del vocabulari, ids únics i aptes per a ?foto=.
   Encàrrec 261019_1425 · Les bessones .webp que escriu el tractor de mitjans
   al costat d'un original (src/config/politicaDeMitjans.js) no són imatges
   noves: el cens nomena l'original i la bessona en seguix l'estat. Un .webp
   que no és la bessona de cap original declarat continua fent roja la prova.
   Ordre del Mestre (261021, torn fase 2, Mòdul B, P0-14) · Un original evacuat
   de public/ deixa la seua .webp sense ningú de qui ser bessona: el cens (o
   EXCLOSES) la nomena a ella, en el lloc de l'original i amb el mateix id. */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { bessonaDe, bessonesDe } from '../../config/politicaDeMitjans.js';
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

/* Les bessones del disc ({ bessona: original }), amb la regla del paquet i
   del resolutor. Una .webp que ja és al cens o a EXCLOSES (la vinyeta del
   Bar) és una imatge amb nom propi, no la bessona de ningú. */
const DECLARADA = (src) => CENS_IMATGES.some((entrada) => entrada.src === src) || Object.hasOwn(EXCLOSES, src);
const BESSONES = new Map(bessonesDe(DISC.map((src) => src.slice(1)))
  .map((original) => [`/${bessonaDe(original)}`, `/${original}`])
  .filter(([bessona]) => !DECLARADA(bessona)));
const esBessona = (src) => BESSONES.has(src);

describe('el cens de l’Arxiu visual', () => {
  test('cada src existix al disc amb la caixa exacta', () => {
    expect(CENS_IMATGES.filter((entrada) => !AL_DISC.has(entrada.src)).map((entrada) => entrada.src)).toEqual([]);
  });

  test('cada imatge ràster de public/assets és al cens o a EXCLOSES (fora de system/)', () => {
    const delCens = new Set(CENS_IMATGES.map((entrada) => entrada.src));
    const oblidades = DISC
      .filter((src) => RASTER.test(src) && !src.startsWith('/assets/system/'))
      .filter((src) => !delCens.has(src) && !Object.hasOwn(EXCLOSES, src) && !esBessona(src));
    expect(oblidades, 'imatges noves sense entrada: afegiu-les a CENS_IMATGES o a EXCLOSES amb el motiu').toEqual([]);
    expect(CENS_IMATGES.length).toBeGreaterThan(100);
  });

  /* Encàrrec 261019_1425 · Una bessona només s'estalvia l'entrada si el seu
     original és declarat; el cens nomena sempre l'original, mai la bessona
     (idDelCens lleva l'extensió: dos entrades per a la mateixa foto
     col·lidirien a ?foto=). */
  test('les bessones .webp: l’original és al cens, a EXCLOSES o a system/, i el cens no nomena mai alhora una foto i la seua bessona', () => {
    for (const [bessona, original] of BESSONES) {
      expect(bessona, original).toMatch(/\.webp$/);
      expect(AL_DISC.has(original), original).toBe(true);
      expect(DECLARADA(original) || original.startsWith('/assets/system/'), `${bessona} → ${original}`).toBe(true);
    }
    const delCens = new Set(CENS_IMATGES.map((entrada) => entrada.src));
    const parelles = CENS_IMATGES.map((entrada) => entrada.src).filter((src) => bessonaDe(src) && delCens.has(bessonaDe(src)));
    expect(parelles, 'una foto i la seua bessona al cens alhora (idDelCens col·lidiria)').toEqual([]);
    // Les dos .webp amb nom propi del cens no passen per bessones.
    expect(esBessona('/assets/ui/plugins/tpv_vinyeta.webp')).toBe(false);
    expect(esBessona('/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp')).toBe(false);
  });

  test('un .webp que no és la bessona de cap original no s’estalvia l’entrada', () => {
    const DISC_FICTICI = ['assets/a/sola.webp', 'assets/b/og.jpg', 'assets/b/og.png', 'assets/b/og.webp', 'assets/c/foto.jpg', 'assets/c/foto.webp'];
    const bessones = new Set(bessonesDe(DISC_FICTICI).map(bessonaDe));
    expect([...bessones]).toEqual(['assets/c/foto.webp']);
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
    // P1-26 · L'avatar mòbil de la IAIA duplicat a fotos/ apunta a l'original de brain/.
    expect(ALIES_DEL_CENS['/assets/fotos/iaia_maria_avatar_mobil.png']).toBe('/assets/uploads/brain/iaia_maria_avatar_mobil.png');
    for (const [copia, original] of Object.entries(ALIES_DEL_CENS)) {
      expect(Object.hasOwn(EXCLOSES, copia), copia).toBe(true);
      expect(delCens.has(original), `${copia} → ${original}`).toBe(true);
    }
    /* Una variant de resolució o un logotip no són còpies de res. */
    expect(ALIES_DEL_CENS).not.toHaveProperty(['/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.webp']);
    expect(ALIES_DEL_CENS).not.toHaveProperty(['/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg']);
    expect(Object.isFrozen(ALIES_DEL_CENS)).toBe(true);
  });

  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 5; Gemini 2030,
     A3.1) · La captura fòssil de la barra lateral i les targetes socials
     (OpenGraph) de La Torre no són fotos de l'Arxiu: fora del cens, amb el
     motiu, i cap no passa per còpia d'una altra (cap àlies). */
  test('la captura fòssil de la barra lateral i les targetes socials de La Torre, fora del cens', () => {
    const delCens = new Set(CENS_IMATGES.map((entrada) => entrada.src));
    const fossil = '/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png';
    expect(delCens.has(fossil)).toBe(false);
    expect(EXCLOSES[fossil]).toMatch(/fòssil/);
    expect(mitjansDelCens().some((m) => m.src === fossil)).toBe(false);
    // Les de system/ (la interfície) ja en queden fora sense nomenar-les.
    const socials = DISC.filter((src) => /\/og[-_][^/]+$/.test(src) && !src.startsWith('/assets/system/') && !esBessona(src));
    // Pla 261022_1645 · 8: el .jpg duplicat d'og_gentdelatorre_mapa_cuadrat_halo s'ha retirat (es queda el .png).
    expect(socials).toHaveLength(8);
    for (const src of socials) {
      expect(EXCLOSES[src], src).toBe('targeta social (OpenGraph): no és cap foto de l’Arxiu');
      expect(delCens.has(src), src).toBe(false);
      expect(ALIES_DEL_CENS, src).not.toHaveProperty([src]);
    }
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
