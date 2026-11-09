/* QA-R2-09 (Codex, Ronda 2; P2 editorial) · /versions no pot proclamar una
   «activació automàtica» del xat xifrat d'extrem a extrem mentre la bandera
   està apagada (src/config/xifratXat.js: E2EE_ACTIU_PER_DEFECTE = false). El
   text ha de dir que la implementació sdp-xat-v1 està preparada darrere d'una
   bandera apagada i pendent d'activació. Si un dia s'encén la bandera, esta
   prova obliga a tornar a escriure el text (no se'n deriva cap). El text de
   /versions només existix en valencià (PAGE_COPY no té traduccions).
   Gauntlet 2 261101 (carril Y; correcció del crític) · Cada entrega es busca
   pel seu títol, no per la posició.
   Onada 6 (prompt 261102_1532, ordre del Mestre 261103 02:31; carril 1, grup
   G1-versions) · /versions deixa les llistes de punts: cada element passa a un
   <h4> amb el prefix de la seua categoria («Novetat ·», «Millora ·» o
   «Correcció ·») seguit d'un <p>, i cada paràgraf porta les seues paraules
   clau en negreta (contracte de densitat de core-llegibilitat-text §4). Les
   entregues del 29-10 a l'1-11, que portaven totes v1.0.0, reben ara la
   numeració v1.0.1–v1.0.4, i al capdamunt hi ha l'entrada de la 1.1.0 (3-11).
   Les invariants d'honestedat de cada entrega es conserven: només ha canviat
   l'estructura (els h4 de categoria i els <li> → h4 amb prefix + <p>) i el
   número dels títols. */
import { describe, expect, test } from 'vitest';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { CANALS_DE_BOTIGA } from '../../config/canalsDeBotiga.js';
import { VERSIO_FORMAT, exportaMunicipiOpenData } from '../../data/exportaMunicipiOpenData.js';
import { webcrypto } from 'node:crypto';
import { VIGENCIA_ALERTA_MS } from '../mur/alertesMunicipals.js';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { CAPACITATS_NO_DECLARADES } from '../../data/local/adaptadorLocal.js';
import { PLATAFORMA_ALIENA } from './perAppNativa.js';
import { AMBITS, RESERVES_I18N } from '../../utils/publicacioUniversal.js';
import { TOOLBAR_SCHEMA, FORMATS } from '../../components/universal/richText/toolbarContract.js';
import { RECOMPTES_QUE_DINEM } from '../../data/patrimoni/queDinem.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
// T8 · D-12: la capçalera es contrasta amb package.json i amb la capçalera del connector.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = String(PAGE_COPY.versions?.html ?? '');
const llegix = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const PAQUET = JSON.parse(llegix('package.json'));
const CONNECTOR = llegix('wordpress-plugin/socdepoble-enxufe.php').match(/^ \* Version:\s+(\d+\.\d+\.\d+)\s*$/m)?.[1];
const RUTES = llegix('src/app/App.jsx');

/* Un bloc d'entrega: del seu <h3> fins al <h3> següent (o fins al final). */
const blocDe = (titol) => {
  const inici = html.indexOf(`<h3>${titol}`);
  if (inici < 0) return '';
  const seguent = html.indexOf('<h3>', inici + 1);
  return html.slice(inici, seguent < 0 ? undefined : seguent);
};
/* El text que es llig: un bloc (h3, h4, p…) és un espai; una etiqueta de línia (strong, code, a), res. */
const text = (fragment) => fragment
  .replace(/<\/?(?:h[1-6]|p|ul|ol|li|div|img)\b[^>]*>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ');
/* Els apartats d'una entrega: cada <h4> amb el <p> que el seguix. */
const apartats = (entrega) => [...entrega.matchAll(/<h4>([\s\S]*?)<\/h4>\n {6}<p>([\s\S]*?)<\/p>/g)]
  .map((m) => ({ titol: text(m[1]).trim(), cos: m[2] }));
const apartat = (entrega, inici) => apartats(entrega).find((a) => a.titol.startsWith(inici));
const titolsH4 = (entrega) => [...entrega.matchAll(/<h4>([\s\S]*?)<\/h4>/g)].map((m) => text(m[1]).trim());
/** a ≤ b, per a versions X.Y.Z. */
const noMesNova = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  const i = x.findIndex((n, j) => n !== y[j]);
  return i < 0 || x[i] < y[i];
};
/* Una ruta interna existix si l'enrutador la declara (App.jsx), amb barra o sense (ActorRoutes), o si
   és /page/<clau> d'una pàgina de PAGE_COPY. */
const rutaExistix = (href) => {
  const cami = href.split(/[?#]/)[0];
  const pagina = /^\/page\/([^/]+)$/.exec(cami);
  if (pagina) return RUTES.includes('<Route path="/page/:slug" ') && Object.hasOwn(PAGE_COPY, pagina[1]);
  const primer = cami.slice(1).split('/')[0];
  return new RegExp(`<Route path="/?${primer}(?:/\\*)?" `).test(RUTES);
};
const interns = (fragment) => [...fragment.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);

const TITOL_110 = `3 de novembre de 2026 · v1.1.0 (build pendent de desplegar) · Connector WordPress v${CONNECTOR} a WordPress.org`;
/* P0-62 / IDEA-193 (ordre del Mestre, 261108) · La fita de l'App Store, al capdamunt. */
const TITOL_FITA_APP_STORE = '6 de novembre de 2026 · Fita · L’app d’iPhone i iPad, publicada a l’App Store (versió 1.0)';
const fitaAppStore = blocDe(TITOL_FITA_APP_STORE);
/* Encàrrec mestre R13+R14 (ordre del Mestre, 08-11-2026 23:00, punt 4) · La crònica de les Onades R13 i R14, al
   capdamunt, davant de la fita de l'App Store. */
const TITOL_FITA_R13_R14 = '9 de novembre de 2026 · Onades R13 i R14 · El receptari «Què dinem?», la targeta d’usuaris i dispositius i el Segon Brain';
const fitaR13R14 = blocDe(TITOL_FITA_R13_R14);
const entrega110 = blocDe('3 de novembre de 2026 · v');
const entregaAssalt = blocDe('1 de novembre de 2026, tarda');
const entrega261101 = blocDe('1 de novembre de 2026 · v');
const entregaRondes = blocDe("31 d'octubre de 2026");
const entrega261029 = blocDe("29 d'octubre de 2026");

describe('QA-R2-09 · /versions diu la veritat sobre l’E2EE', () => {
  test('la bandera continua apagada', () => {
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  });

  test('cap activació automàtica ni «consolidat» mentre la bandera és apagada', () => {
    expect(entrega261029).toContain('xifrat d\'extrem a extrem');
    expect(html).not.toMatch(/activaci[óo] autom[àa]tica/i);
    expect(entrega261029).not.toMatch(/consolida el <strong>xifratge/);
  });

  test('diu que sdp-xat-v1 està preparat darrere d’una bandera apagada i pendent d’activació', () => {
    expect(entrega261029).toContain('<code>sdp-xat-v1</code>');
    expect(entrega261029).toContain('<code>E2EE_ACTIU_PER_DEFECTE = false</code>');
    expect(entrega261029).toMatch(/preparad[ae]/);
    expect(entrega261029).toContain('pendent d\'activació');
  });
});

/* Onada 6 · L'estructura editorial: data i versió (h3), obertura (p), i cada novetat, millora o
   correcció en un h4 amb prefix seguit del seu paràgraf. Cap llista de punts a tota la pàgina. */
describe('Onada 6 · /versions sense llistes: h3 + obertura + h4 amb prefix i paràgraf', () => {
  test('cap <ul>, <ol> ni <li> a /versions', () => {
    expect(html).not.toMatch(/<(?:ul|ol|li)\b/);
  });

  test('els títols de les entregues, amb numeració pròpia i de la més nova a la més vella', () => {
    const titols = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
    expect(titols).toEqual([
      // Encàrrec R13+R14 · La crònica de les Onades R13 i R14 obri la pàgina (no és una entrega numerada del web).
      TITOL_FITA_R13_R14,
      // P0-62 · La fita de l'App Store, la segona (tampoc no és una entrega numerada del web).
      TITOL_FITA_APP_STORE,
      '5 de novembre de 2026 · v1.2.0 · suplement pendent d’integració',
      TITOL_110,
      '1 de novembre de 2026, tarda · v1.0.4 (build pendent de desplegar) · Connector WordPress v1.1.11 al repositori',
      '1 de novembre de 2026 · v1.0.3 (build pendent de desplegar) · Connector WordPress v1.1.10',
      "31 d'octubre de 2026 · v1.0.2 (build 261101) · Connector WordPress v1.1.10",
      "29 d'octubre de 2026 · v1.0.1 (build 261029) · Connector WordPress v1.1.10",
      "26 d'octubre de 2026 · v1.0.0 (build 261026) · Connector WordPress v1.1.9",
      "17 d'octubre de 2026 · v0.9.5 · El Llibre d'Or i la Plataforma d'Apps",
      'Crònica fundacional (2013 – setembre de 2026)'
    ]);
    const versions = titols.map((t) => / · v(\d+\.\d+\.\d+)\b/.exec(t)?.[1]).filter(Boolean);
    for (let i = 1; i < versions.length; i += 1) {
      expect(noMesNova(versions[i], versions[i - 1]) && versions[i] !== versions[i - 1], `${versions[i]} < ${versions[i - 1]}`).toBe(true);
    }
  });

  test('cada entrega: h3, obertura i apartats «Novetat · / Millora · / Correcció ·» en este ordre, sense els h4 de categoria', () => {
    const ORDRE = ['Novetat', 'Millora', 'Correcció'];
    const entregues = html.split(/(?=<h3>)/).filter((b) => b.startsWith('<h3>') && !b.startsWith('<h3>Crònica') && !b.includes('v1.2.0 · suplement'));
    // P0-62 i encàrrec R13+R14 · Set entregues, la fita de l'App Store i la crònica R13+R14, amb el mateix format.
    expect(entregues).toHaveLength(9);
    for (const entrega of entregues) {
      const titol = entrega.match(/^<h3>([^<]+)<\/h3>/)[1];
      expect(entrega, titol).toMatch(/^<h3>[^<]+<\/h3>\n {6}<p>/);
      expect(entrega, titol).not.toMatch(/<h4>(?:Novetats|Millorat|Corregit)<\/h4>/);
      const cos = entrega.slice(entrega.indexOf('<h4>'));
      /* Darrere del primer h4, només parells h4 + p. */
      expect(cos.replace(/<h4>[\s\S]*?<\/h4>\n {6}<p>[\s\S]*?<\/p>(?:\n {6}|\n\n {6}|\n {4}$)/g, ''), titol).toBe('');
      const prefixos = titolsH4(entrega).map((t) => t.split(' · ')[0]);
      for (const p of prefixos) expect(ORDRE, `${titol}: ${p}`).toContain(p);
      expect(prefixos.map((p) => ORDRE.indexOf(p)), titol).toEqual([...prefixos.map((p) => ORDRE.indexOf(p))].sort((a, b) => a - b));
      /* L'explicació comença en majúscula (o per un codi, o per un domini, que es queden com són). */
      for (const { titol: h4, cos: p } of apartats(entrega)) expect(p.replace(/<\/?strong>/g, ''), h4).toMatch(/^(?:<code>|<a |[«(]?[A-ZÀ-ÚÇ]|[a-z0-9-]+\.[a-z]{2,}\b)/);
      expect(entrega.endsWith('</p>\n\n      '), titol).toBe(true);
    }
  });

  test('la Crònica fundacional: V8 en un sol paràgraf que nomena els quatre pilars, i la il·lustració al final', () => {
    const cronica = blocDe('Crònica fundacional');
    const v8 = cronica.match(/<h4>Gener – Juny de 2026 · V8: L'Arquitectura de la Vella Wiki<\/h4>\n {6}<p>([\s\S]*?)<\/p>\n\n {6}<h4>/)?.[1] ?? '';
    for (const pilar of ['Gestoria', 'Llibreria i El Lector', 'Tràmits agraris', 'Consola Termodinàmica']) expect(v8).toContain(`<strong>${pilar}</strong>`);
    for (const frase of ['simplificació de formularis i tràmits per al veïnat i les associacions', 'catalogació i lectura accessible per a la comunitat',
      'assistència documental per al camp i la cooperativa', 'tauler de control per a vigilar la salut del codi i el consum de recursos']) expect(text(v8)).toContain(frase);
    expect(html.trimEnd()).toMatch(/<img src="\/assets\/uploads\/brain\/nano_versions_ibanez_v1_1_10\.webp" alt="[^"]+" \/>$/);
  });
});

/* Onada 6 · Contracte de densitat (core-llegibilitat-text §4; el mateix recompte de paraules que
   l'auditoria): ≥40 paraules → 6–8 negretes; 25–39 → 5–7; 12–24 → 2–4; menys → 1–3. Cap paràgraf
   pla, cap negreta buida, niuada, dins d'un encapçalament ni d'un codi, i cap sintagma llarg. */
describe('Onada 6 · cada paràgraf de /versions es llig en diagonal', () => {
  const segmentador = new Intl.Segmenter('ca', { granularity: 'word' });
  const paraules = (t) => [...segmentador.segment(t)].filter((s) => s.isWordLike).length;
  const pla = (h) => h.replace(/<[^>]+>/g, '');
  const BUIDES = new Set(['i', 'o', 'de', 'del', 'dels', 'la', 'el', 'els', 'les', 'l', 'a', 'al', 'als', 'en', 'amb', 'per', 'que', 'un', 'una', 'és', 'si', 'no', 'ni', 'ja', 'es', 'se', 'hi', 'ho', 'ne', 'd']);
  const paragrafs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);

  test('hi ha paràgrafs per a mesurar', () => {
    expect(paragrafs.length).toBeGreaterThan(80);
  });

  test('negretes per paràgraf segons la llargària, i cap paràgraf pla', () => {
    for (const p of paragrafs) {
      const w = paraules(pla(p));
      const n = (p.match(/<strong>/g) ?? []).length;
      const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
      expect(n >= min && n <= max, `${n} negretes per a ${w} paraules (${min}–${max}): «${pla(p).slice(0, 70)}…»`).toBe(true);
    }
  });

  test('negretes ben formades: cap buida, niuada, sobre una paraula buida, de més de sis paraules, dins de codi ni d’encapçalament', () => {
    expect((html.match(/<strong>/g) ?? []).length).toBe((html.match(/<\/strong>/g) ?? []).length);
    expect(html).not.toMatch(/<h([1-6])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
    expect(html).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    for (const m of html.matchAll(/<strong>([\s\S]*?)<\/strong>/g)) {
      const t = m[1].trim();
      expect(m[1], 'niuada').not.toMatch(/<strong>/);
      expect(t, 'buida').not.toBe('');
      expect(BUIDES.has(t.toLowerCase()), `buida: «${t}»`).toBe(false);
      expect(paraules(pla(t)), `llarga: «${t}»`).toBeLessThanOrEqual(6);
    }
  });
});

/* Onada 6 · L'entrada de la 1.1.0 (3 de novembre): la primera, pendent de desplegar i sense cap mentida
   bella. Cada fet que es pot derivar del codi o d'un fitxer del repositori, se'n deriva. */
describe('Onada 6 · l’entrada de la 1.1.0, la primera i honesta', () => {
  const pla = text(entrega110);

  test('és la primera entrada, amb el títol literal, i la versió és la de package.json', () => {
    expect(html.indexOf('<h3>')).toBeLessThan(html.indexOf(`<h3>${TITOL_110}</h3>`));
    expect(html.slice(0, html.indexOf(`<h3>${TITOL_110}</h3>`))).toContain('v1.2.0 · suplement pendent d’integració');
    expect(PAQUET.version).toBe('1.1.0');
    expect(TITOL_110).toContain(`· v${PAQUET.version} (`);
    /* Gauntlet O6 (VER-02/VER-03) · El connector del títol és el del repositori (la capçalera del
       connector), amb «al repositori» com a la v1.0.4: no es publica fins que l'SVN el porte. */
    expect(TITOL_110.match(/Connector WordPress v(\d+\.\d+\.\d+) a WordPress\.org$/)?.[1]).toBe(CONNECTOR);
  });

  test('pendent de desplegar: cap frase no diu que siga desplegat, en viu o en producció', () => {
    expect(pla).toContain('està pendent de desplegar');
    expect(pla).toContain('El build del web portarà la data del desplegament.');
    expect(entrega110).not.toMatch(/build \d{6}/);
    expect(pla).not.toMatch(/\bdesplega(?:t|ts|d[ae]s?)\b|\ben viu\b|en producció|ja és públic|publicada a socdepoble/i);
  });

  test('la versió de les apps passa a 1.1.0 i el número de build no canvia', () => {
    const gradle = llegix('android/app/build.gradle');
    const pbx = llegix('ios/App/App.xcodeproj/project.pbxproj');
    expect(gradle).toMatch(/versionName "1\.1\.0"/);
    expect([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1])).toEqual(expect.arrayContaining(['1.1.0']));
    expect(new Set([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]))).toEqual(new Set(['1.1.0']));
    const build = gradle.match(/versionCode (\d+)/)[1];
    expect(new Set([...pbx.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => m[1]))).toEqual(new Set([build]));
    expect(pla).toContain(`el número de build de les apps, el ${build}, no canvia`);
  });

  test('la numeració retrospectiva de les entregues del 29-10 a l’1-11, dita a l’obertura', () => {
    expect(pla).toContain("Les entregues del 29 d'octubre a l'1 de novembre portaven totes el número v1.0.0.");
    expect(pla).toContain("La numeració v1.0.1–v1.0.4 se'ls dona ara, en retrospectiva, perquè l'historial mostre l'evolució.");
  });

  test('l’App Store: «Waiting for Review» és el que ha vist el Mestre, i les mides de les captures', () => {
    const app = text(apartat(entrega110, "Novetat · L'app d'iPhone i iPad").cos);
    expect(app).toContain("s'ha enviat a revisió a l'App Store");
    expect(app).toContain('el Mestre l\'ha vista en l\'estat «Waiting for Review»');
    expect(app).toContain('1290 × 2796');
    expect(app).toContain('2048 × 2732');
  });

  test('2.3.10 · cap bloc de /versions barreja una altra plataforma mòbil amb Apple, l’iPhone o l’App Store', () => {
    /* /versions s'obri dins de l'app d'iPhone: un bloc que nomena Google Play, Android o l'APK no s'hi
       pinta (perAppNativa.js), i no pot arrossegar amb ell una frase d'Apple. Hui no n'hi ha cap:
       perAppNativa.test.js vigila que /versions no canvie dins de l'app. */
    for (const m of html.matchAll(/<(p|h[1-6])>([\s\S]*?)<\/\1>/g)) {
      if (PLATAFORMA_ALIENA.test(text(m[2]))) expect(text(m[2])).not.toMatch(/App Store|Apple|iPhone|iPad|\biOS\b/);
    }
  });

  test('«On es publica?»: en línia dins de l’«Edició avançada», en l’ordre del codi, amb els àmbits del contracte', () => {
    const cos = text(apartat(entrega110, 'Novetat · «On es publica?»').cos);
    expect(cos).toContain('en este ordre: capçalera, logotip, «On es publica?» i classificació');
    const closca = llegix('src/components/universal/UniversalEditorShell.jsx');
    const desplegable = closca.slice(closca.indexOf('className="sdp-edicio-avancada__cos"'));
    const posicions = ['data-sdp-ranura="capcalera"', 'data-sdp-ranura="logotip"', 'data-sdp-ranura="ambit"', 'page-title-classificacio'].map((m) => desplegable.indexOf(m));
    expect(posicions.every((p) => p >= 0)).toBe(true);
    expect([...posicions].sort((a, b) => a - b)).toEqual(posicions);
    const ambits110 = ['mur', 'mercat', 'vehicle', 'treball', 'habitatge'];
    for (const a of ambits110) expect(AMBITS).toContain(a);
    const llista110 = `(${ambits110.map((a) => RESERVES_I18N[`ambit.${a}`]).join(', ').replace(/, ([^,]+)$/, ' o $1')})`;
    const llistaVigent = `(${AMBITS.map((a) => RESERVES_I18N[`ambit.${a}`]).join(', ').replace(/, ([^,]+)$/, ' o $1')})`;
    expect(cos.includes(llista110) || cos.includes(llistaVigent)).toBe(true);
    expect(llegix('src/sections/notes/NotesSection.jsx')).toContain("const CLAU_AMBIT = 'ambit';");
    expect(llegix('src/sections/disseny/cataleg/manifest.js')).toContain("item: 'formularis-ambit'");
    expect(entrega110).toContain('<a href="/disseny?categoria=formularis&amp;item=formularis-ambit">');
  });

  test('les subtargetes: botó de la segona fila, i ja n’hi ha a les tres pàgines que nomena', () => {
    const boto = TOOLBAR_SCHEMA.find((b) => b.id === FORMATS.SUBTARGETA);
    expect(boto?.fila).toBe('segona');
    for (const clau of ['projecte', 'descarregues', 'fediversity']) expect(PAGE_COPY[clau].html, clau).toContain('class="sdp-subtargeta"');
    const cos = apartat(entrega110, 'Novetat · Subtargetes').cos;
    expect(interns(cos)).toEqual(['/projecte', '/descarregues', '/page/fediversity']);
  });

  test('les dades obertes concorden amb el snapshot i el manifest real del format vigent', async () => {
    const enllacats = [...PAGE_COPY.fediversity.html.matchAll(/href="(\/opendata\/[^"]+)"/g)].map(m => m[1]);
    const snapshot = JSON.parse(llegix('public/opendata/snapshot-public.json'));
    const paquet = await exportaMunicipiOpenData(snapshot.entrada, { subtle: webcrypto.subtle });
    const manifest = JSON.parse(llegix('public/opendata/manifest.json'));
    expect(manifest).toEqual(paquet.datapackage);
    expect(manifest.socdepoble.schemaVersion).toBe(VERSIO_FORMAT);
    const permesos = new Set(['/opendata/manifest.json', ...manifest.resources.map(r => '/opendata/' + r.path),
      '/opendata/' + paquet.nomFitxer, '/opendata/' + paquet.nomFitxer + '.sha256']);
    expect(enllacats).toEqual(expect.arrayContaining(['/opendata/manifest.json', '/opendata/noticies.jsonld', '/opendata/agenda.jsonld']));
    expect(enllacats.filter(href => !permesos.has(href))).toEqual([]);
    expect(llegix('src/config/assetResolver.js')).toContain('RE_HREF_OPENDATA');
    const cos = text(apartat(entrega110, 'Novetat · Dades obertes').cos);
    expect(cos).toContain('El manifest descriu els recursos');
    expect(cos).toContain('restauració local');
    expect(cos).toContain('Supabase continua absent');
    expect(cos).toContain('format ' + VERSIO_FORMAT);
  });

  test('els calaixos naixen davall de la barra negra: un sol càlcul per a l’Índex i per als calaixos', () => {
    // «\s*:» i no «: »: la prova llig el token, no el declara (tractor-tokens T3).
    expect(llegix('src/css/tokens.css')).toMatch(/--sdp-calaix-dalt\s*: calc\(var\(--sdp-alt-negra\)/);
    expect(llegix('src/css/modules.css')).toMatch(/\.toc-overlay \{[^}]*top: var\(--sdp-calaix-dalt\)/);
    expect(llegix('src/css/components.css')).toMatch(/\.sdp-dialeg--calaix \{[^}]*top: var\(--sdp-calaix-dalt\)/);
    expect(llegix('src/components/universal/PanellCrom.jsx')).toMatch(/titol="Crom del sistema" costat=/);
    expect(llegix('src/components/universal/identitat/CalaixIdentitats.jsx')).toContain('titol="Amb qui actues?"');
  });

  test('O7 · connector 1.1.12 publicat: la capçalera i el text actual concorden', () => {
    const publicada = PAGE_COPY.versions.subtitle.match(/Connector WordPress v(\d+\.\d+\.\d+) a WordPress\.org$/)?.[1];
    const cos = text(apartat(entrega110, 'Millora · Actualitzacions automàtiques').cos);
    expect(cos).toContain(`El connector ${CONNECTOR} ja està publicat a WordPress.org`);
    expect(publicada).toBe('1.1.12');
    expect(publicada).toBe(CONNECTOR);
    /* La capçalera llig la versió publicada d'una altra entrada (T8 · D-12). */
    expect(entrega110).not.toContain('en la versió');
  });

  /* Gauntlet O6 (VER-03) · El text diu que la descàrrega directa i Google Play són tancats: si
     s'obri un dels dos canals, el text queda fals i la prova cau. */
  test('Android: la descàrrega directa i Google Play, tancades mentre el text ho diga', () => {
    expect(text(apartat(entrega110, "Novetat · L'app per a Android").cos)).toContain('La descàrrega directa encara no és oberta.');
    for (const id of ['apk-directe', 'google-play']) expect(CANALS_DE_BOTIGA.find((c) => c.id === id).url, id).toBeNull();
  });

  /* Gauntlet O6 (VER-01) · Legal 2.4 (kit de Codex) ja no té cap paràgraf pla, però conserva les
     llistes «<li><strong>Etiqueta:</strong> …»: el text ho diu. Quan les passe a subtítols, esta
     prova cau i cal llevar «llevat de Legal». */
  test('les pàgines del sistema que es lligen d’un colp d’ull, llevat de Legal mentre conserve les llistes', () => {
    const cos = text(apartat(entrega110, "Millora · Pàgines que es lligen d'un colp d'ull").cos);
    expect(cos).toContain('Esta pàgina i les pàgines del sistema, llevat de Legal, passen');
    expect((PAGE_COPY.legal.html.match(/<li><strong>[^<]*:<\/strong>/g) ?? []).length).toBeGreaterThan(0);
  });

  test('la qualitat: la data i les xifres de la suite, i el certificador valida els ?item= de la Wiki', () => {
    expect(pla).toContain('La matinada del 3 de novembre, la suite de Vitest va executar 31.458 proves en 1.765 fitxers, totes en verd.');
    expect(llegix('tooling/gates/certifica-enllacos.mjs')).toContain("parsed.searchParams.get('item')");
  });

  test('cap identificador intern, ni avisos push ni migracions', () => {
    expect(pla).not.toMatch(/IDEA-\d|O\d-[A-Z]+-\d|torn_|\bpush\b|migraci/i);
  });

  test('els enllaços interns porten a rutes de l’aplicació', () => {
    expect(interns(entrega110)).toEqual(["/disseny?categoria=formularis&amp;item=formularis-ambit","/projecte","/descarregues","/page/fediversity","/page/fediversity","/control?fitxa=opendata","/page/node-zero"]);
    for (const ruta of interns(entrega110)) expect(rutaExistix(ruta), ruta).toBe(true);
  });
});

/* Gauntlet 2 261101 (carril Y) · L'entrega de l'1 de novembre (v1.0.3 des de l'Onada 6): el mateix
   format que les altres i cap mentida bella. El build el posa el desplegament: mentre no s'ha
   desplegat, el títol diu «pendent de desplegar» i cap frase no diu que ja siga al lloc publicat.
   Cada xifra que es pot derivar del codi, se'n deriva: si la peça canvia, la prova cau. */
describe('Gauntlet 2 261101 · /versions té l’entrada honesta de l’1 de novembre', () => {
  test('és la tercera entrada, darrere de la 1.1.0 i de la de l’assalt, amb el format de les altres', () => {
    const titols = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
    // P0-62 i encàrrec R13+R14 · Dues posicions més avall: la crònica R13+R14 i la fita de l'App Store obrin la pàgina.
    expect(titols[5]).toMatch(/^1 de novembre de 2026 · v/);
    expect(entrega261101).toMatch(/^<h3>1 de novembre de 2026 · v1\.0\.3 \(build pendent de desplegar\) · Connector WordPress v1\.1\.10<\/h3>\n {6}<p>/);
    expect(titolsH4(entrega261101)).toEqual([
      'Novetat · Connector a WordPress.org (wordpress.org/plugins/socdepoble)', 'Novetat · Alertes municipals al Mur',
      'Novetat · Fitxa de memòria oral (OKF v0.2) al Bloc de Notes', "Novetat · Agenda en iCalendar a l'Open Data (format 1.1.0)",
      'Millora · Candidatura NGI Fediversity verificable (/page/fediversity)', 'Millora · Bloc de Notes',
      'Millora · Volums locals a Multimèdia (/multimedia)', "Millora · Miniatura de l'avatar al Xat",
      'Correcció · Noms accessibles en la llengua de la interfície', "Correcció · Títols de l'Open Data"
    ]);
  });

  test('pendent de desplegar: cap frase no diu que ja siga al lloc publicat, tret del connector de WordPress.org', () => {
    expect(text(entrega261101)).toContain('està pendent de desplegar');
    expect(text(entrega261101)).toContain('El build portarà la data del desplegament.');
    expect(entrega261101).not.toMatch(/build \d{6}/);
    expect(text(entrega261101)).not.toMatch(/\bdesplegad[ae]s?\b|ja és en viu|ja està en producció/i);
  });

  test('el connector: l’adreça és la del canal obert de WordPress.org, amb target i rel', () => {
    const wordpress = CANALS_DE_BOTIGA.find((c) => c.id === 'wordpress-org');
    expect(wordpress.url).toBe('https://wordpress.org/plugins/socdepoble/');
    expect(entrega261101).toContain(`<a href="${wordpress.url}" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>`);
    expect(entrega261101).toContain('<code>socdepoble</code>, en la versió 1.1.10');
  });

  test('les xifres derivades del codi: 72 hores d’alerta i el format Open Data', () => {
    expect(VIGENCIA_ALERTA_MS).toBe(72 * 60 * 60 * 1000);
    expect(text(entrega261101)).toContain(`fins a ${VIGENCIA_ALERTA_MS / 3600000} hores després de la seua data`);
    /* T2 · D04/D10 (assalt 261101) · L'entrega de l'1 de novembre és la del format 1.1.0: el registre és
       històric, i la 1.2.0 (memòria oral i restaurador) va en una entrada pròpia. */
    expect(text(entrega261101)).toContain("a l'Open Data (format 1.1.0)");
    expect(VERSIO_FORMAT).toBe('1.2.0');
  });

  test('l’Open Data no promet el que no exporta, i la memòria oral no promet cap model de llenguatge', () => {
    /* Gauntlet transversal 261101 (H4-01) · L'entrada és història: diu en passat el que exportava, i no
       contradiu /page/fediversity, que ja porta les notícies i l'agenda (format 1.2.0, carril T2). */
    expect(text(entrega261101)).toContain("En esta entrega, la fitxa del poble encara només hi exportava el directori d'entitats; la lectura pública de les notícies i de l'agenda arriba amb el format 1.2.0, en una entrega posterior.");
    expect(text(entrega261101)).not.toMatch(/Hui la fitxa del poble|només hi exporta el directori/);
    expect(text(entrega261101)).toContain('sense xarxa ni models de llenguatge');
    expect(text(entrega261101)).toContain('naix com a esborrany');
  });

  test('cap «masia» a /versions', () => {
    expect(html).not.toMatch(/masia/i);
  });

  test('els enllaços interns porten a rutes de l’aplicació', () => {
    expect(interns(entrega261101)).toEqual(['/descarregues', '/page/fediversity', '/multimedia']);
    for (const ruta of interns(entrega261101)) expect(rutaExistix(ruta), ruta).toBe(true);
  });
});

/* T8 · D-12 (pla 261101_1246, decisió del Mestre) · La capçalera de /versions és estàtica: un
   text de pageContent.js no pot saber quin build hi ha desplegat (la frontissa l'importa des de
   Node, sense Vite), i per això no en nomena cap. Diu la versió de package.json i la del
   connector publicada a WordPress.org, que no pot ser més nova que la del connector d'este
   repositori. L'entrada de les Rondes 1, 2 i 3 (31-10, v1.0.2 des de l'Onada 6) porta el build que
   servia socdepoble.org en escriure-la, 261101 (assets/versio-Cuzo1lYB.js amb const t="261101" i
   index.html amb last-modified 2026-11-01T00:39:59Z, comprovat l'1-11-2026), i cada frase s'ha
   contrastat amb els trossos de producció d'eixe build. És història: es fixa literal i no es deriva
   del codi d'ara, que continuarà canviant. */
describe('T8 · D-12 · capçalera estàtica i entrada de les Rondes 1, 2 i 3', () => {
  test('la capçalera diu la versió de package.json i la del connector publicada, sense cap build', () => {
    const { subtitle, labels } = PAGE_COPY.versions;
    const capcalera = subtitle.match(/^Versió actual: v(\d+\.\d+\.\d+) · Connector WordPress v(\d+\.\d+\.\d+) a WordPress\.org$/);
    expect(capcalera?.[1]).toBe(PAQUET.version);
    const publicada = capcalera[2];
    /* P0-40/IDEA-167 (ordre directa del Mestre, 261107 05:23) · La insígnia de versió es conserva i va primer, com
       abans (INSIGNIES_SISTEMA_RETIRADES no la nomena; cadena R11, Loop 3, L2-03), després Sistema, i fora
       «Registre de canvis»: la mare i l'etiqueta canònica. */
    expect(labels.map((l) => l.text)).toEqual([`v${PAQUET.version} · WP v${publicada}`, 'Sistema', '💻 Tecnologia Lliure, Dades Obertes i Disseny', 'Documentació']);
    for (const t of [subtitle, ...labels.map((l) => l.text)]) expect(t).not.toMatch(/build|\b\d{6}\b/i);
    /* La publicada és la que diu l'entrada més recent que nomena una versió a WordPress.org (el
       registre va de la més nova a la més vella): les entrades velles són història i no es
       reescriuen quan es publica una versió nova. No pot ser més nova que la del connector. */
    const darreraPublicada = entrega110.match(/Connector WordPress v(\d+\.\d+\.\d+) a WordPress\.org<\/h3>/)?.[1];
    expect(publicada).toBe(darreraPublicada);
    expect(noMesNova(publicada, CONNECTOR), `${publicada} ≤ ${CONNECTOR}`).toBe(true);
  });

  test('l’entrada va entre la de l’1 de novembre i la del 29 d’octubre, amb el format de les altres', () => {
    const posicio = (titol) => html.indexOf(`<h3>${titol}`);
    expect(posicio('3 de novembre de 2026')).toBeLessThan(posicio('1 de novembre de 2026, tarda'));
    expect(posicio('1 de novembre de 2026, tarda')).toBeLessThan(posicio('1 de novembre de 2026 · v'));
    expect(posicio('1 de novembre de 2026 · v')).toBeLessThan(posicio("31 d'octubre de 2026"));
    expect(posicio("31 d'octubre de 2026")).toBeLessThan(posicio("29 d'octubre de 2026"));
    expect(entregaRondes).toMatch(/^<h3>31 d'octubre de 2026 · v1\.0\.2 \(build 261101\) · Connector WordPress v1\.1\.10<\/h3>\n {6}<p>/);
    expect(titolsH4(entregaRondes)).toEqual([
      'Novetat · Consola pública (/consola)', 'Novetat · Tauler del comptador de visites (/legal)', 'Novetat · Federació de només lectura',
      'Novetat · Dades obertes del poble', 'Millora · Telemetria més clara', 'Millora · Fletxes del teclat a les graelles de targetes',
      'Millora · Perfil públic en cinc llengües', 'Millora · Atles de la IAIA', 'Correcció · Fitxers del núvol', 'Correcció · Llistes',
      "Correcció · Fitxa d'empreses, entitats i ajuntaments"
    ]);
  });

  test('només el que ja servia producció: res de migracions sense aplicar, del xifratge ni dels rebuts d’entrega', () => {
    const pla = text(entregaRondes);
    expect(pla).toContain("publicada a socdepoble.org la matinada de l'1 de novembre");
    // Els rebuts d'entrega del Xat necessiten l'RPC xat_marca_rebut, que cap migració aplicada no crea.
    expect(pla).not.toMatch(/\bxifra(?:t|tge)\b|E2EE|rebut|migraci|pendent de desplegar/i);
    // El que encara no fa, ho diu.
    expect(pla).toContain('seguir o respondre des del Fedivers encara està pendent');
    /* Gauntlet transversal 261101 (H4-01) · El que exportava el paquet d'eixe build, en passat: hui ja hi
       van les notícies i l'agenda (/page/fediversity), i l'entrada no pot dir el contrari en present. */
    expect(pla).toContain("En esta entrega, el paquet portava el directori públic d'entitats; les notícies, l'agenda i la memòria cultural encara no s'hi exportaven.");
    expect(pla).not.toMatch(/Hui porta el directori|encara no s'hi exporten/);
    expect(pla).toContain('El registre final no es pot comprovar des del navegador.');
    // Les fletxes del Bloc de Notes ja hi eren: la Ronda 2 només les va posar a Pobles, al Mur i a la Consola.
    expect(text(apartat(entregaRondes, 'Millora · Fletxes').cos)).not.toMatch(/Notes/);
    // DT-LLISTES-D1 (modules.css) lleva el marge de cada li (--sdp-li-gap), no cap marge de paràgraf.
    const llistes = text(apartat(entregaRondes, 'Correcció · Llistes').cos);
    expect(llistes).toContain('el marge de cada element de llista');
    expect(llistes).not.toMatch(/paràgraf/);
  });

  test('els enllaços interns porten a rutes de l’aplicació', () => {
    expect(interns(entregaRondes)).toEqual(['/consola', '/legal']);
    for (const ruta of interns(entregaRondes)) expect(RUTES).toMatch(new RegExp(`<Route path="${ruta}(?:/\\*)?" `));
  });
});

/* Assalt 10/10 (pla 261101_1246, torn_3f5652a2) · L'entrada de la tarda de l'1 de novembre (v1.0.4 des de
   l'Onada 6): ara la segona, amb el format de les altres, i cap mentida bella. Res no és desplegat ni
   publicat, les migracions noves no estan aplicades i el xifratge continua apagat: el text ho diu, i
   cada peça que es pot derivar del codi se'n deriva. */
describe('Assalt 10/10 · /versions té l’entrada honesta de la tarda de l’1 de novembre', () => {
  const pla = text(entregaAssalt);

  test('és la segona entrada, darrere de la 1.1.0, amb el format de les altres', () => {
    const titols = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
    // P0-62 i encàrrec R13+R14 · Dues posicions més avall: la crònica R13+R14 i la fita de l'App Store obrin la pàgina.
    expect(titols[4]).toMatch(/^1 de novembre de 2026, tarda · /);
    expect(entregaAssalt).toMatch(/^<h3>1 de novembre de 2026, tarda · v1\.0\.4 \(build pendent de desplegar\) · Connector WordPress v(\d+\.\d+\.\d+) al repositori<\/h3>\n {6}<p>/);
    expect(titolsH4(entregaAssalt).map((t) => t.split(' · ')[0])).toEqual([
      ...Array(6).fill('Novetat'), ...Array(12).fill('Millora'), ...Array(3).fill('Correcció')
    ]);
  });

  test('el connector del títol és el de l’apartat, al repositori, no més nou que el d’ara, i no es diu publicat', () => {
    const delTitol = entregaAssalt.match(/Connector WordPress v(\d+\.\d+\.\d+) al repositori<\/h3>/)[1];
    expect(noMesNova(delTitol, CONNECTOR), `${delTitol} ≤ ${CONNECTOR}`).toBe(true);
    const connector = apartat(entregaAssalt, `Millora · Connector WordPress ${delTitol}`);
    expect(text(connector.cos)).toContain('És al repositori');
    expect(pla).toContain('pendent de publicar a WordPress.org');
    expect(entregaAssalt).not.toContain('en la versió'); // la capçalera llig la publicada d'una altra entrada
  });

  test('pendent de desplegar, migracions sense aplicar, xifratge apagat i bústia sense servei', () => {
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
    expect(pla).toContain('està pendent de desplegar');
    expect(pla).toContain("pendents d'aplicar");
    expect(pla).toContain('continua apagat');
    expect(pla).toContain('Cap conversa no es xifra encara.');
    expect(pla).toContain("Encara no s'ha desplegat cap bústia d'entrada");
    expect(pla).toContain('El build portarà la data del desplegament.');
    expect(pla).not.toMatch(/\bdesplegad[ae]s?\b|ja és en viu|ja està en producció|activaci[óo] autom[àa]tica/i);
  });

  test('les peces que es poden derivar del codi', () => {
    expect(VERSIO_FORMAT).toBe('1.2.0');
    expect(titolsH4(entregaAssalt)).toContain('Novetat · Dades obertes 1.2.0 i restaurador');
    // R7 (arbitratge 261106): importacioPaquetMunicipal és al contracte de R13; el seu SQL (2611060010) va entrar a la Fase 2 (R8) i el
    // Mestre l'aplicà a producció el 6-11-2026 (lectura REST). La capacitat continua sense declarar a l'adaptador local.
    expect(CAPACITATS_NO_DECLARADES).toEqual(['iaia','xatRitme','importacioPaquetMunicipal','verificacioCorreu','recuperacioCorreu']);
    expect(pla).toContain("llevat de la versió mínima de l'app");
    expect(entregaAssalt).toContain('<code>src/data/federacio/inboxActivityPub.js</code>');
  });

  test('cap enllaç intern ni «masia»', () => {
    expect([...entregaAssalt.matchAll(/href="(\/[^"]*)"/g)]).toHaveLength(0);
    expect(entregaAssalt).not.toMatch(/masia/i);
  });
});

/* P0-62 / IDEA-193 (ordre del Mestre, 261108) · Apple va publicar Sóc de Poble 1.0 a l'App Store el
   6-11-2026 (consulta d'Apple del 8-11-2026: trackId 6826441844, gratis, iOS 16.0 o posterior). La
   fita obri /versions en les cinc llengües, davant de l'entrada del 5 de novembre; l'enllaç és el del
   canal obert app-store de canalsDeBotiga.js, i el bloc no nomena cap altra plataforma mòbil (/versions
   s'obri dins de l'app d'iPhone). */
describe('P0-62 · /versions s’obri amb la fita de l’App Store', () => {
  const APP_STORE = CANALS_DE_BOTIGA.find((c) => c.id === 'app-store').url;

  test('és la segona entrada, just darrere de la crònica R13+R14, amb la data real, la versió 1.0 i el format de les entregues', () => {
    // Encàrrec R13+R14 · La crònica de les Onades R13 i R14 va primer; la fita, tot seguit.
    const cos = html.trimStart();
    expect(cos.startsWith(`<h3>${TITOL_FITA_R13_R14}</h3>`)).toBe(true);
    expect(cos.slice(fitaR13R14.length).startsWith(`<h3>${TITOL_FITA_APP_STORE}</h3>`)).toBe(true);
    expect(fitaAppStore).toMatch(/^<h3>[^<]+<\/h3>\n {6}<p>/);
    expect(titolsH4(fitaAppStore)).toEqual(['Novetat · Sóc de Poble a l’App Store']);
    const pla = text(fitaAppStore);
    expect(pla).toContain('Apple ha aprovat i publicat l’app de Sóc de Poble per a iPhone i iPad: la versió 1.0 és a l’App Store des del 6 de novembre de 2026, gratis i per a iOS i iPadOS 16 o posterior.');
    expect(pla).toContain('Ho hem comprovat el 8 de novembre a la consulta pública d’Apple.');
    // La fita no és cap entrega del web: no porta cap número vX.Y.Z que entre en l'ordre de les versions.
    expect(TITOL_FITA_APP_STORE).not.toMatch(/ · v\d+\.\d+\.\d+/);
  });

  test('l’enllaç és la fitxa del canal obert, i cap altra plataforma mòbil al bloc', () => {
    expect(APP_STORE).toBe('https://apps.apple.com/es/app/s%C3%B3c-de-poble/id6826441844');
    expect([...fitaAppStore.matchAll(/href="([^"]+)"/g)].map((m) => m[1])).toEqual([APP_STORE]);
    expect(fitaAppStore).toContain(`<a href="${APP_STORE}" target="_blank" rel="noopener noreferrer">enllaç directe a la fitxa</a>`);
    expect(PLATAFORMA_ALIENA.test(text(fitaAppStore))).toBe(false);
    expect(fitaAppStore).not.toMatch(/TestFlight|\bbeta\b|en proves/i);
  });

  test('les cinc llengües: la crònica R13+R14, la fita i, després, l’entrada del 5 de novembre i el registre en valencià', () => {
    const inicis = {
      ca: ['9 de novembre de 2026 · Onades R13 i R14', '6 de novembre de 2026 · Fita', '5 de novembre de 2026 · '],
      es: ['9 de noviembre de 2026 · Oleadas R13 y R14', '6 de noviembre de 2026 · Hito', '5 de noviembre de 2026 · '],
      en: ['9 November 2026 · Waves R13 and R14', '6 November 2026 · Milestone', '5 November 2026 · '],
      eu: ['2026ko azaroaren 9a · R13 eta R14 olatuak', '2026ko azaroaren 6a · Mugarria', '2026ko azaroaren 5a · '],
      gl: ['9 de novembro de 2026 · Ondas R13 e R14', '6 de novembro de 2026 · Fito', '5 de novembro de 2026 · ']
    };
    for (const [llengua, [cronica, fita, seguent]] of Object.entries(inicis)) {
      const pagina = localitzaPagina(PAGE_COPY.versions, llengua);
      const cos = pagina.html.trimStart();
      expect([llengua, cos.startsWith(`<h3>${cronica}`)]).toEqual([llengua, true]);
      const h3 = [...cos.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
      expect([llengua, h3[1].startsWith(fita), h3[2].startsWith(seguent)]).toEqual([llengua, true, true]);
      const hrefs = (des, fins) => [...cos.slice(des, fins).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      // La fita només enllaça la fitxa de l'App Store; la crònica, només el receptari (intern).
      expect([llengua, hrefs(cos.indexOf(h3[1]), cos.indexOf(h3[2]))]).toEqual([llengua, [APP_STORE]]);
      expect([llengua, hrefs(0, cos.indexOf(h3[1]))]).toEqual([llengua, ['/page/receptes']]);
      expect([llengua, cos.indexOf('<div lang="ca">') === -1 || cos.indexOf('<div lang="ca">') > cos.indexOf(h3[2])]).toEqual([llengua, true]);
    }
  });
});

/* Encàrrec mestre R13+R14 (ordre del Mestre, 08-11-2026 23:00, punt 4) · La crònica de les Onades R13 i R14 obri
   /versions en les cinc llengües. Les xifres del receptari ixen de les dades (RECOMPTES_QUE_DINEM); l'enllaç al
   receptari és intern de l'SPA (cap target=_blank); el bloc no nomena cap altra plataforma mòbil ni cap botiga
   (regla 2.3.10: /versions s'obri dins de l'app d'iPhone); i només conta el que R13 i R14 han desplegat, amb la
   condició de la card d'usuaris dita en el mateix text. El contracte de densitat de negretes de l'Onada 6 (que el
   valencià ja passa amb la resta de la pàgina) es comprova ací en cada llengua, amb el segmentador de la llengua. */
describe('Encàrrec R13+R14 · /versions s’obri amb la crònica de les Onades R13 i R14', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    return cos.slice(0, cos.indexOf('<h3>', 1));
  };

  test('és la primera entrada, amb el format de les entregues i tres apartats amb el prefix de novetat de cada llengua', () => {
    expect(html.trimStart().startsWith(`<h3>${TITOL_FITA_R13_R14}</h3>`)).toBe(true);
    expect(titolsH4(fitaR13R14)).toEqual(['Novetat · Administració del sistema', 'Novetat · Segon Brain', 'Novetat · Notes i accés']);
    expect(TITOL_FITA_R13_R14).not.toMatch(/ · v\d+\.\d+\.\d+/);
    const PREFIX = { ca: 'Novetat', es: 'Novedad', en: 'New', eu: 'Berritasuna', gl: 'Novidade' };
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      expect([llengua, bloc]).toEqual([llengua, expect.stringMatching(/^<h3>[^<]+<\/h3>\n {6}<p>/)]);
      expect([llengua, titolsH4(bloc).map((t) => t.split(' · ')[0])]).toEqual([llengua, Array(3).fill(PREFIX[llengua])]);
      expect([llengua, bloc.endsWith('</p>\n\n      ')]).toEqual([llengua, true]);
    }
  });

  test('les xifres del receptari ixen de les dades, en les cinc llengües', () => {
    expect(RECOMPTES_QUE_DINEM).toMatchObject({ receptes: 149, lamines: 148, videos: 47 });
    for (const llengua of LLENGUES) {
      const pla = text(blocEn(llengua));
      for (const n of [RECOMPTES_QUE_DINEM.receptes, RECOMPTES_QUE_DINEM.lamines, RECOMPTES_QUE_DINEM.videos]) {
        expect([llengua, n, pla.includes(` ${n} `)]).toEqual([llengua, n, true]);
      }
      expect([llengua, pla.includes('PDF')]).toEqual([llengua, true]);
    }
  });

  test('l’enllaç al receptari és intern de l’SPA: cap target ni rel, i la ruta existix', () => {
    for (const llengua of LLENGUES) {
      const enllacos = [...blocEn(llengua).matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
      expect([llengua, enllacos]).toEqual([llengua, ['<a href="/page/receptes">']]);
    }
    expect(rutaExistix('/page/receptes')).toBe(true);
    for (const ruta of ['/notes', '/control', '/consola/taxonomia']) expect(rutaExistix(ruta), ruta).toBe(true);
  });

  test('2.3.10 · cap altra plataforma mòbil ni cap botiga nomenada, i la card amb el seu nom real', () => {
    const titolCard = llegix('src/sections/profile/perfilModel.js').match(/title: '👥 (Usuaris, Dispositius i Botigues) \(Google i Apple\)'/)?.[1];
    expect(titolCard).toBe('Usuaris, Dispositius i Botigues');
    for (const llengua of LLENGUES) {
      const pla = text(blocEn(llengua));
      expect([llengua, PLATAFORMA_ALIENA.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /Google|Apple|App Store|iPhone|iPad|TestFlight/.test(pla)]).toEqual([llengua, false]);
      expect([llengua, pla.includes(`«${titolCard}»`)]).toEqual([llengua, true]);
      // El nom del botó de /control és el del diccionari de la llengua.
      expect([llengua, pla.includes(`«${DICCIONARIS[llengua]['section.control.compte']}»`)]).toEqual([llengua, true]);
    }
  });

  test('cap promesa per damunt del desplegat: la card depén del servidor, els al·lèrgens no estan revisats', () => {
    const pla = text(fitaR13R14);
    expect(pla).toContain('quan el servidor els pot donar, i diu clarament quan encara no els té');
    expect(pla).toContain('Els al·lèrgens no estan revisats: consulteu sempre els ingredients.');
    // El mot vetat, amb una classe de caràcters perquè la mateixa cerca de text no trobe esta prova.
    expect(pla).not.toMatch(/\bdesplegad[ae]s?\b|en producció|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a/i);
  });

  test('densitat de negretes de cada paràgraf, en les cinc llengües (el contracte de l’Onada 6)', () => {
    for (const llengua of LLENGUES) {
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...blocEn(llengua).matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect([llengua, paragrafsDelBloc.length]).toEqual([llengua, 4]);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(blocEn(llengua), llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
    }
  });
});
