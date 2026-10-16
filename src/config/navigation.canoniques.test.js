/* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre) · Les rutes canòniques netes
   de les tres identitats que controla el Mestre (RUTES_CANONIQUES) i la que
   declara cada fitxa pública (rutaCanonicaDePerfil): per id o per slug
   declarat, mai pel nom, i amb el tipus que toca. Cap no xoca amb una altra
   ruta de primer nivell, una secció, una pàgina coneguda o una pàgina del
   sistema. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { resolvePageSlugPath, RUTES_CANONIQUES, rutaCanonicaDePerfil, rutaDePerfil } from './navigation.js';
import { SECTIONS } from './sections.js';
import { SYSTEM_PAGES } from './systemPages.js';
import { AGENTS_MAP } from '../data/agentsSeed.js';
import {
  CLAUS_FUNDACIONALS, ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, IAIA_ID, PERSONA_PILOT
} from '../data/identitatsSeed.js';

const UUID = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';

describe('les tres rutes canòniques', () => {
  test('una per identitat, amb el slug declarat de cadascuna', () => {
    expect(CLAUS_FUNDACIONALS).toEqual(['javillinares', ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG]);
    expect(RUTES_CANONIQUES).toEqual({ javillinares: '/javillinares', socdepoble: '/socdepoble', rentonar: '/rentonar' });
    expect(Object.isFrozen(RUTES_CANONIQUES)).toBe(true);
  });

  /* Gauntlet 261016 (F3) · Actualitzada a posta: les tres són ara subrutes de Pobles (sections.js), com
     /gent i /empresa, perquè la barra encenga Pobles a la fitxa. Eixa declaració és la seua i no compta com
     a xoc; qualsevol altra secció, path o subruta amb el mateix nom continua sent-ne un. */
  test('cap xoca amb una ruta de primer nivell, una secció, una pàgina coneguda o del sistema', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/app/App.jsx'), 'utf8');
    const primersTrams = new Set([...codi.matchAll(/<Route\s+path="\/?([^"/:*]+)/g)].map(([, tram]) => tram));
    expect(primersTrams.size).toBeGreaterThan(20);
    const canoniques = new Set(Object.values(RUTES_CANONIQUES));
    const deLaSeccio = (s) => (s.subrutes || []).filter((r) => !(s.id === 'pobles' && canoniques.has(r)));
    const seccions = new Set(SECTIONS.flatMap((s) => [s.id, s.path, ...deLaSeccio(s)].map((r) => String(r).replace(/^\//, ''))));
    const sistema = new Set(SYSTEM_PAGES.flatMap((p) => [p.key, String(p.href || '').split('/')[1]]));
    for (const clau of CLAUS_FUNDACIONALS) {
      expect([clau, primersTrams.has(clau), seccions.has(clau), resolvePageSlugPath(clau), sistema.has(clau)])
        .toEqual([clau, false, false, null, false]);
    }
  });

  test('Pobles les encén, com /gent, /empresa i /grup: són subrutes seues i de cap altra secció', () => {
    const pobles = SECTIONS.find((s) => s.id === 'pobles');
    expect(pobles.subrutes).toEqual(expect.arrayContaining(['/gent', '/empresa', '/grup', ...Object.values(RUTES_CANONIQUES)]));
    const altres = SECTIONS.filter((s) => s.id !== 'pobles').flatMap((s) => [s.path, ...(s.subrutes || [])]);
    expect(altres.filter((r) => Object.values(RUTES_CANONIQUES).includes(r))).toEqual([]);
  });

  /* Gauntlet 261016 (F3) · public/sitemap.xml no el genera cap eina (tooling/ i scripts/ només el nomenen o
     el filtren del build): la declaració de cada canònica s'escriu a mà i esta prova la lliga a RUTES_CANONIQUES. */
  test('public/sitemap.xml declara cada ruta canònica, una sola vegada, sota https://socdepoble.org', () => {
    const sitemap = readFileSync(path.join(process.cwd(), 'public/sitemap.xml'), 'utf8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
    for (const ruta of Object.values(RUTES_CANONIQUES)) {
      expect(locs.filter((loc) => loc === `https://socdepoble.org${ruta}`), ruta).toHaveLength(1);
    }
  });

  test('App.jsx les declara a ActorRoutes, abans del comodí, amb la fitxa pública de sempre', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/app/App.jsx'), 'utf8');
    const actor = codi.slice(codi.indexOf('function ActorRoutes'), codi.indexOf('const MobileNav'));
    const canoniques = actor.indexOf('Object.entries(RUTES_CANONIQUES)');
    expect(canoniques).toBeGreaterThan(0);
    expect(canoniques).toBeLessThan(actor.indexOf('<Route path=":sectionId/:itemId"'));
    expect(actor.slice(canoniques, actor.indexOf('))}', canoniques))).toContain('<PerfilPublicSection agents={agents} id={clau} />');
  });
});

describe('rutaCanonicaDePerfil', () => {
  test.each([
    /* La persona pilot, per qualsevol àlies: el catàleg sense sessió, la fitxa de la sessió en llavor. */
    [{ tipus: 'persona', id: AGENTS_MAP.JAVI.id, slug: null }, '/javillinares'],
    [{ tipus: 'persona', id: 'u-de-la-sessio', slug: PERSONA_PILOT.slug }, '/javillinares'],
    [{ tipus: 'persona', id: 'javi-llinares', slug: null }, '/javillinares'],
    /* L'entitat pilot: l'id de la llavor o un àlies. */
    [{ tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG }, '/socdepoble'],
    [{ tipus: 'entitat', id: 'soc-de-poble_official', slug: null }, '/socdepoble'],
    /* Rentonar és un grup. */
    [{ tipus: 'grup', id: ENTITAT_RENTONAR_SLUG, slug: ENTITAT_RENTONAR_SLUG }, '/rentonar'],
  ])('%j → %s', (perfil, ruta) => {
    expect(rutaCanonicaDePerfil(perfil)).toBe(ruta);
  });

  test.each([
    /* Mai pel nom, i mai amb el tipus d'una altra identitat. */
    [{ tipus: 'entitat', id: UUID, slug: 'soc-de-poble-de-relleu', nom: 'Sóc de Poble' }],
    [{ tipus: 'persona', id: UUID, slug: null, nom: 'Javi Llinares' }],
    [{ tipus: 'persona', id: 'u-1', slug: ENTITAT_PILOT_SLUG }],
    [{ tipus: 'grup', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG }],
    [{ tipus: 'entitat', id: ENTITAT_RENTONAR_SLUG, slug: ENTITAT_RENTONAR_SLUG }],
    [{ tipus: 'ia', id: IAIA_ID, slug: 'iaia-maria' }],
    [{ tipus: 'ia', id: 'javillinares', slug: null }],
    [{ tipus: 'entitat', id: 'forn', slug: 'forn' }],
    /* Revisió adversarial del Gauntlet 261016 (encàrrec C) · DEROGAT «en
       remot, un UUID amb el slug declarat»: el slug només és únic dins d'un
       poble i el tria qui crea l'organització, i un grup «rentonar» d'un altre
       poble (o un veí que prenga «socdepoble») rebia la canònica del Mestre.
       En remot, només l'id del servidor que declara la llavor
       (IDS_REMOTS_FUNDACIONALS; ho prova identitatsSeed.fundacionals.test). */
    [{ tipus: 'entitat', id: UUID, slug: ENTITAT_PILOT_SLUG }],
    [{ tipus: 'grup', id: UUID, slug: ENTITAT_RENTONAR_SLUG }],
    [null], [undefined], [{}],
  ])('%j no és cap de les tres', (perfil) => {
    expect(rutaCanonicaDePerfil(perfil)).toBeNull();
  });

  test('les rutes de sempre no canvien: la canònica és una adreça més', () => {
    expect(rutaDePerfil('persona', AGENTS_MAP.JAVI.id)).toBe('/gent/0001');
    expect(rutaDePerfil('entitat', ENTITAT_PILOT_SLUG)).toBe('/empresa/socdepoble');
    expect(rutaDePerfil('grup', ENTITAT_RENTONAR_SLUG)).toBe('/grup/rentonar');
  });
});
