// @vitest-environment node
/* Plataforma d'Apps Enxufables · el pressupost de pes del nucli (Onada 6,
   261009, ADR-2026-12). Un trinquet sobre el paquet de WordPress que ja
   s'ha construït (wordpress-plugin/dist, fora de git): llig l'inventari, el
   manifest de release i el text dels trossos; no compila res.
     · Cap tros de trossos/ porta el nom d'un mòdul de la Gestoria o de Salut,
       i l'arrencada (l'entrada i els trossos que importa) el de cap app
       opcional. P0-113 (ordre del Mestre, 261111): el Bar, la Nevera i el
       Lector són oberts i hi poden ser com a trossos diferits.
     · Cap tros (tampoc el d'entrada, on Rollup podria haver-lo inlinat) porta
       el codi de Salut o de la Gestoria, i l'arrencada el de cap d'estes
       apps: les marques són els noms de les seues bases
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
/* Apujat a posta el 261105 (integració R8-r57 + R12 + genealogia, Claude/Codex/MarIA): 1.591.855 → 1.690.000 B. El build real de l'arbre integrat
   incorpora les dades hidratades dels 22 pobles (poblesAplecViquipedia.js, AH-27/IDEA-86), l'edició editorial i carpetes de notes (R12) i l'Arbre Genealògic. SquareBadge
   té mòdul propi perquè PageFrame no arrossegue UniversalCard (30 KB) a l'entrada. */
const SOSTRE_DEL_TROS_D_ENTRADA = 1690000;
/* Onada R17 · T2.1 (P0-95, Closca Pura; prompt 261110_2334) · L'arrencada
   estàtica: el tros d'entrada més els trossos que importa de manera estàtica
   (trossDArrencada, vite.standalone.config.js). Des que React, l'estil, el
   valencià, DOMPurify, la navegació i les dades dels pobles ixen de l'entrada,
   el sostre de dalt només diu el pes del nucli; este diu el que es baixa abans
   del primer pintat, i no deixa que el pes s'amague en trossos germans.
   El valor és el tros d'entrada sencer d'abans d'R17 (build real del 261111,
   tests/standalone-build.test.mjs, que el llig d'ací): partir l'entrada no pot
   fer créixer l'arrencada. La mesura amb els trossos va donar 1.733.512 B
   (entrada 741.904 B). Només pot baixar. */
const SOSTRE_DE_L_ARRENCADA_ESTATICA = 1737422;

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

  /* P0-113 (ordre del Mestre, 261111) · Actualitzades a posta. El Bar, la Nevera i el Lector són oberts
     per defecte i, al paquet trossejat, entren com a trossos DIFERITS (vite.standalone.config.js,
     definicionsDeLesApps): poden ser a trossos/, però mai a l'arrencada (l'entrada i els trossos que
     importa de manera estàtica). Salut i la Gestoria (dades de salut i financeres) no entren mai al paquet
     de l'amfitrió: ni el nom ni el codi, en cap tros. La intenció de les proves velles es conserva: el
     nucli verge no porta cap app, i les dades personals no viatgen a una web d'altri. */
  const NOMS_DE_SALUT_I_GESTORIA = Object.freeze(['AppGestoria', 'ShellGestoria', 'Facturacio', 'Aprendre', 'AppSalut']);
  const MARQUES_DE_SALUT_I_GESTORIA = Object.freeze([...MARQUES_DE_LES_APPS['src/apps/salut'], ...MARQUES_DE_LES_APPS['src/sections/gestoria']]);

  test('cap tros porta el nom d’un mòdul de la Gestoria o de Salut, i l’arrencada cap d’una app opcional', () => {
    const propis = nomsPropisDeLesApps();
    /* La porta mira de veres: els components d'entrada de cada app hi són. */
    for (const nom of [...NOMS_DE_SALUT_I_GESTORIA, 'AppBar', 'AppNevera', 'AppLector']) {
      expect(propis.has(nom), nom).toBe(true);
    }
    const delsTrossos = trossos.map((cami) => [cami, cami.match(PATRO_TROS)[1]]);
    expect(delsTrossos.filter(([, nom]) => NOMS_DE_SALUT_I_GESTORIA.includes(nom) || /gestoria/i.test(nom)).map(([cami]) => cami)).toEqual([]);
    const arrencada = new Set(deLArrencada);
    expect(delsTrossos.filter(([cami, nom]) => arrencada.has(cami) && propis.has(nom)).map(([cami]) => cami)).toEqual([]);
  });

  test('cap tros, tampoc el d’entrada, porta el codi de Salut o de la Gestoria; l’arrencada, el de cap app opcional (les marques)', () => {
    const camins = [...new Set([RELEASE.formatDelPaquet.modul, ...trossos])].filter((cami) => !esTextDeLaWiki(cami));
    const ambMarques = (llista, marques) => llista.flatMap((cami) => {
      const text = readFileSync(path.join(DIST, cami), 'utf8');
      return marques.filter((marca) => comACadena(marca).test(text)).map((marca) => `${cami}: ${marca}`);
    });
    expect(ambMarques(camins, MARQUES_DE_SALUT_I_GESTORIA)).toEqual([]);
    expect(ambMarques(deLArrencada.filter((cami) => typeof cami === 'string' && !esTextDeLaWiki(cami)), TOTES_LES_MARQUES)).toEqual([]);
    expect(camins.length).toBeGreaterThan(50);
  });

  test(`el tros d’entrada no passa del sostre (${SOSTRE_DEL_TROS_D_ENTRADA} B) ni el carregador del seu (${LIMIT_DEL_CARREGADOR} B)`, () => {
    expect(midaDe(RELEASE.formatDelPaquet.modul)).toBeLessThanOrEqual(SOSTRE_DEL_TROS_D_ENTRADA);
    expect(midaDe(ENTRADA_DEL_PAQUET)).toBeLessThanOrEqual(LIMIT_DEL_CARREGADOR);
  });

  /* Onada R17 · T2.1 · Els trossos que l'entrada importa de manera estàtica,
     del manifest de Vite (cap, en un dist d'abans de R17). */
  const deVite = HI_HA_BUILD && existsSync(path.join(DIST, '.vite/manifest.json'))
    ? JSON.parse(readFileSync(path.join(DIST, '.vite/manifest.json'), 'utf8')) : {};
  const registreDEntrada = Object.values(deVite).find((registre) => registre.isEntry && registre.file === RELEASE?.formatDelPaquet?.modul);
  const deLArrencada = HI_HA_BUILD ? [RELEASE.formatDelPaquet.modul, ...(registreDEntrada?.imports ?? []).map((clau) => deVite[clau]?.file)] : [];

  test(`l’arrencada estàtica (entrada i trossos que importa) no passa del sostre (${SOSTRE_DE_L_ARRENCADA_ESTATICA} B)`, () => {
    expect(registreDEntrada, 'el manifest de Vite nomena el tros d’entrada').toBeTruthy();
    expect(deLArrencada.every((cami) => typeof cami === 'string' && Number.isFinite(midaDe(cami))), JSON.stringify(deLArrencada)).toBe(true);
    expect(deLArrencada.reduce((suma, cami) => suma + midaDe(cami), 0)).toBeLessThanOrEqual(SOSTRE_DE_L_ARRENCADA_ESTATICA);
  });

  /* [DEFECTE] Deute conegut: el CSS de la Gestoria (modules.css) va inlinat
     amb tota la cascada (index.css?inline) i es baixa a l'arrencada (des de
     R17, al tros «estils»). Quan la fase 2 de l'ADR-2026-12 el traga al full
     del mòdul, esta prova s'ha de girar: cap `sdp-gestoria` a l'arrencada. */
  test('[DEFECTE] el CSS de la Gestoria encara viatja a l’arrencada', () => {
    const arrencada = deLArrencada.map((cami) => readFileSync(path.join(DIST, cami), 'utf8')).join('\n');
    expect(arrencada.split('sdp-gestoria').length - 1).toBeGreaterThan(0);
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
