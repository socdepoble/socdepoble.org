// @vitest-environment node
/* Plataforma d'Apps Enxufables · el pressupost de pes del nucli (Onada 6,
   261009, ADR-2026-12). Un trinquet sobre el paquet de WordPress que ja
   s'ha construït (wordpress-plugin/dist, fora de git): llig l'inventari, el
   manifest de release i el text dels trossos; no compila res.
     · Cap tros de trossos/ porta el nom d'un mòdul de la Gestoria, del Bar,
       de Salut, de la Nevera o del Lector.
     · Cap tros (tampoc el d'entrada, on Rollup podria haver-lo inlinat) porta
       el codi d'una d'estes apps: les marques són els noms de les seues bases
       d'IndexedDB, contractes de dades que no canvien i que el minificador
       no toca. Una prova sense build comprova que les marques són de veres
       (cada una és al codi de la seua app i enlloc més del nucli).
     · El tros d'entrada no passa del sostre: si un build nou el passa, o
       s'aprima el nucli o s'apuja SOSTRE_DEL_TROS_D_ENTRADA a posta, amb el
       motiu escrit al costat. Mai en silenci.
   Una prova [DEFECTE] reproduïx el deute de CSS de la Gestoria inlinat dins
   del tros d'entrada (index.css?inline, PedraSecaEmbed.jsx). Els mitjans es
   comproven segons la política del manifest: locals al paquet complet,
   absents i resolts a l'origen declarat al connector lleuger.
   El títol diu de quan és el build que es mesura: el dist no es reconstruïx
   sol, i un build vell no diu res de l'arbre d'ara. Sense build (un clon net,
   la CI), les proves del dist se salten: vitest les compta com a saltades,
   mai com a verdes. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { bessonaDe, bessonesDe, esExtern, esHostLocal } from '../../config/politicaDeMitjans.js';
import { fixaBaseRecursos, fixaPoliticaDeMitjans, resolveAsset } from '../../config/assetResolver.js';

const ARREL = process.cwd();

/* Les constants del build, llegides de vite.standalone.config.js (la font
   única). No s'importa: arrossegaria @vitejs/plugin-react, que vitest
   transforma (server.deps.inline /react/) i que no s'hi deixa carregar. */
const CONFIG_DEL_PAQUET = readFileSync(path.join(ARREL, 'vite.standalone.config.js'), 'utf8');
const constant = (nom) => {
  const trobada = CONFIG_DEL_PAQUET.match(new RegExp(`export const ${nom} = (?:'([^']+)'|(\\d+));`));
  if (!trobada) throw new Error(`vite.standalone.config.js ja no exporta ${nom}`);
  return trobada[1] ?? Number(trobada[2]);
};
const CARPETA_DE_TROSSOS = constant('CARPETA_DE_TROSSOS');
const ENTRADA_DEL_PAQUET = constant('ENTRADA_DEL_PAQUET');
const FITXER_INVENTARI = constant('FITXER_INVENTARI');
const FITXER_RELEASE = constant('FITXER_RELEASE');
const LIMIT_DEL_CARREGADOR = constant('LIMIT_DEL_CARREGADOR');
const DIST = path.join(ARREL, 'wordpress-plugin/dist');
const HI_HA_BUILD = existsSync(path.join(DIST, FITXER_INVENTARI)) && existsSync(path.join(DIST, FITXER_RELEASE));
const llig = (fitxer) => JSON.parse(readFileSync(path.join(DIST, fitxer), 'utf8'));
const RELEASE = HI_HA_BUILD ? llig(FITXER_RELEASE) : null;
if (!HI_HA_BUILD) console.warn('[pesDelNucli] No hi ha wordpress-plugin/dist: el pressupost de pes no s’ha mesurat.');

/* El sostre del tros d'entrada: el del build del 261008 a les 22:01
   (sdp-inventari.json, trossos/soc-de-poble-f0sDoqpe.js). No s'apuja
   (ADR-2026-12, pregunta 8, resolta a l'Onada 7): el 261009 l'arbre en feia
   1.628.974 B, i amb el logotip negre de BrandMark fora de l'entrada en fa
   1.491.764 B. tests/standalone-build.test.mjs llig esta mateixa constant, i
   així el trinquet es comprova en cada build real, no només sobre el dist vell. */
const SOSTRE_DEL_TROS_D_ENTRADA = 1591855;

/* Les apps opcionals: el seu codi no ha de ser cap tros del nucli. */
const CARPETES_DE_LES_APPS = Object.freeze([
  'src/apps/bar', 'src/apps/salut', 'src/apps/nevera', 'src/apps/lector', 'src/apps/gestoria', 'src/sections/gestoria'
]);
/* Les marques del codi de cada app: els noms de les seues bases d'IndexedDB
   (magatzem.js de cada app; a la Gestoria, la de cada vista). */
const MARQUES_DE_LES_APPS = Object.freeze({
  'src/apps/bar': Object.freeze(['sdp-bar']),
  'src/apps/salut': Object.freeze(['sdp-salut']),
  'src/apps/nevera': Object.freeze(['sdp-nevera']),
  'src/apps/lector': Object.freeze(['sdp-lector']),
  'src/sections/gestoria': Object.freeze(['sdp-facturacio', 'sdp-gestoria-perfil', 'sdp-gestoria-cofre', 'sdp-aprendre'])
});
const TOTES_LES_MARQUES = Object.values(MARQUES_DE_LES_APPS).flat();
/* Una marca com a cadena del codi (entre cometes), no com a part d'una classe CSS. */
const comACadena = (marca) => new RegExp(`["'\`]${marca}["'\`]`);
/* La Wiki compilada (src/data/wikiManifest.js i el seu tros) és text de documentació: les
   skills i els ADR hi nomenen les bases de les apps sense portar-ne el codi. No compta. */
const esTextDeLaWiki = (ruta) => ruta === 'src/data/wikiManifest.js' || /\/wikiManifest-[A-Za-z0-9_-]{8}\.js$/.test(ruta);
/* Els mitjans de la Gestoria: cada perfil els ha de servir sense duplicar-los. */
const MITJANS_DE_LA_GESTORIA = Object.freeze(['assets/nano_cards/gestoria_nano_card.jpg', 'assets/ui/plugins/gestoria_vinyeta.jpg']);

const CODI = /\.(?:[cm]?js|jsx)$/;
const esProva = (f) => /\.test\.[cm]?jsx?$/.test(f) || f.includes('/__fixtures__/');

function fitxersDe(directori, extensio = CODI) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name) && !esProva(ruta)) fitxers.push(ruta);
  }
  return fitxers;
}

const nomDe = (ruta) => path.posix.basename(ruta).replace(CODI, '');
const dinsDeLesApps = (ruta) => CARPETES_DE_LES_APPS.some((carpeta) => ruta.startsWith(`${carpeta}/`));
/* El codi sense comentaris de bloc ni de línia sencera: el minificador no els porta al paquet. */
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* Els noms de mòdul propis de les apps: els que no es repetixen enlloc més de
   src (un `diners` o un `index` no diuen de qui és el tros). Rollup posa al
   tros el nom del mòdul que el demana: un tros amb un d'estos noms és codi
   d'una app opcional dins del nucli. */
function nomsPropisDeLesApps() {
  const tots = fitxersDe('src');
  const deFora = new Set(tots.filter((ruta) => !dinsDeLesApps(ruta)).map(nomDe));
  return new Set(tots.filter(dinsDeLesApps).map(nomDe).filter((nom) => !deFora.has(nom)));
}

/* El nom d'un tros, sense el hash de Rollup (8 caràcters): trossos/Taula-CNIoLyKT.js → Taula. */
const PATRO_TROS = new RegExp(`^${CARPETA_DE_TROSSOS}/(.+)-[A-Za-z0-9_-]{8}\\.js$`);

describe('les marques del codi de les apps són de veres (sense build)', () => {
  test('cada marca és una cadena del codi de la seua app i de cap fitxer del nucli', () => {
    for (const [carpeta, marques] of Object.entries(MARQUES_DE_LES_APPS)) {
      const codi = fitxersDe(carpeta).map((ruta) => senseComentaris(readFileSync(path.join(ARREL, ruta), 'utf8'))).join('\n');
      for (const marca of marques) expect(comACadena(marca).test(codi), `${carpeta}: ${marca}`).toBe(true);
    }
    const delNucli = [...fitxersDe('src'), ...fitxersDe('src', /\.css$/)].filter((ruta) => !dinsDeLesApps(ruta) && !esTextDeLaWiki(ruta));
    expect(delNucli.length).toBeGreaterThan(500);
    const repetides = delNucli.flatMap((ruta) => {
      const codi = senseComentaris(readFileSync(path.join(ARREL, ruta), 'utf8'));
      return TOTES_LES_MARQUES.filter((marca) => comACadena(marca).test(codi)).map((marca) => `${ruta}: ${marca}`);
    });
    expect(repetides).toEqual([]);
  });
});

describe.skipIf(!HI_HA_BUILD)(`pressupost de pes del nucli (wordpress-plugin/dist, build del ${RELEASE?.generat ?? 'cap'})`, () => {
  const inventari = HI_HA_BUILD ? llig(FITXER_INVENTARI).fitxers : [];
  const midaDe = (cami) => inventari.find((fitxer) => fitxer.cami === cami)?.mida;
  const trossos = inventari.map((fitxer) => fitxer.cami).filter((cami) => PATRO_TROS.test(cami));

  test('l’inventari mira de veres: el paquet trossejat, amb el seu tros d’entrada i desenes de trossos', () => {
    expect(RELEASE.formatDelPaquet?.format).toBe('trossos');
    expect(midaDe(RELEASE.formatDelPaquet.modul)).toBeGreaterThan(0);
    expect(trossos.length).toBeGreaterThan(50);
    expect(RELEASE.inventari.fitxers).toBe(inventari.length);
  });

  test('cap tros de trossos/ porta el nom d’un mòdul de la Gestoria, del Bar, de Salut, de la Nevera o del Lector', () => {
    const propis = nomsPropisDeLesApps();
    /* La porta mira de veres: els components d'entrada de cada app hi són. */
    for (const nom of ['AppGestoria', 'ShellGestoria', 'Facturacio', 'Aprendre', 'AppBar', 'AppSalut', 'AppNevera', 'AppLector']) {
      expect(propis.has(nom), nom).toBe(true);
    }
    const delsTrossos = trossos.map((cami) => [cami, cami.match(PATRO_TROS)[1]]);
    expect(delsTrossos.filter(([, nom]) => propis.has(nom) || /gestoria/i.test(nom)).map(([cami]) => cami)).toEqual([]);
  });

  test('cap tros, tampoc el d’entrada, porta el codi d’una app opcional (les marques)', () => {
    const camins = [...new Set([RELEASE.formatDelPaquet.modul, ...trossos])].filter((cami) => !esTextDeLaWiki(cami));
    const amb = camins.flatMap((cami) => {
      const text = readFileSync(path.join(DIST, cami), 'utf8');
      return TOTES_LES_MARQUES.filter((marca) => comACadena(marca).test(text)).map((marca) => `${cami}: ${marca}`);
    });
    expect(amb).toEqual([]);
    expect(camins.length).toBeGreaterThan(50);
  });

  test(`el tros d’entrada no passa del sostre (${SOSTRE_DEL_TROS_D_ENTRADA} B) ni el carregador del seu (${LIMIT_DEL_CARREGADOR} B)`, () => {
    expect(midaDe(RELEASE.formatDelPaquet.modul)).toBeLessThanOrEqual(SOSTRE_DEL_TROS_D_ENTRADA);
    expect(midaDe(ENTRADA_DEL_PAQUET)).toBeLessThanOrEqual(LIMIT_DEL_CARREGADOR);
  });

  /* [DEFECTE] Deute conegut: el CSS de la Gestoria (modules.css) va inlinat
     dins del tros d'entrada amb tota la cascada (index.css?inline). Quan la
     fase 2 de l'ADR-2026-12 el traga al full del mòdul, esta prova s'ha de
     girar: cap `sdp-gestoria` al tros d'entrada. */
  test('[DEFECTE] el CSS de la Gestoria encara viatja dins del tros d’entrada', () => {
    const entrada = readFileSync(path.join(DIST, RELEASE.formatDelPaquet.modul), 'utf8');
    expect(entrada.split('sdp-gestoria').length - 1).toBeGreaterThan(0);
  });

  test('els mitjans de la Gestoria respecten el perfil: locals o externs resolts, mai absents sense origen', () => {
    // El manifest conserva el nombre de bessones; la llista segellada al
    // bundle es calcula sobre public/ amb la mateixa regla d'única font.
    const bessones = bessonesDe(fitxersDe('public/assets', /\.(?:png|jpe?g|webp)$/i)
      .map(cami => cami.replace(/^public\//, '')));
    const politica = RELEASE.mitjans ? { ...RELEASE.mitjans, bessones } : null;
    const base = 'https://amfitrio.example/wp-content/plugins/socdepoble-enxufe/dist';
    fixaBaseRecursos(base);
    fixaPoliticaDeMitjans(politica);
    try {
      for (const cami of MITJANS_DE_LA_GESTORIA) {
        const externa = Boolean(politica?.origen) && esExtern(cami, politica.externs);
        const servit = politica && bessones.includes(cami) ? bessonaDe(cami) : cami;
        if (externa) {
          const origen = new URL(politica.origen);
          expect(origen.protocol).toBe('https:');
          expect(esHostLocal(origen.hostname)).toBe(false);
          expect(origen.username || origen.password || origen.search || origen.hash).toBe('');
          for (const local of [cami, bessonaDe(cami)]) {
            expect(midaDe(local), local).toBeUndefined();
            expect(existsSync(path.join(DIST, local)), local).toBe(false);
          }
          expect(resolveAsset(`/${cami}`), cami).toBe(`${politica.origen}/${servit}`);
        } else {
          expect(midaDe(servit), servit).toBeGreaterThan(0);
          expect(existsSync(path.join(DIST, servit)), servit).toBe(true);
          expect(resolveAsset(`/${cami}`), cami).toBe(`${base}/${servit}`);
        }
      }
    } finally {
      fixaPoliticaDeMitjans(null);
      fixaBaseRecursos('/');
    }
  });
});
