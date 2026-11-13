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
import { describe, expect, test, vi } from 'vitest';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { MARCA_FALLBACK, instalaFallbackDeBessones } from '../../config/fallbackBessones.js';
import { LLIBRES_ARBRES_MONUMENTALS } from '../../data/patrimoni/llibresArbresMonumentals.js';
import { VERSIO_CLIENT_NATIU } from '../../data/contracte.js';
import { MUR_PUBLIC_FILTRAT } from '../notes/visibilitatNota.js';
import { caraDAutor, caresDelFil } from '../xat/conversa.js';
import { ENTRADES_AMB_ESTAT_EN_MEMORIA, FINESTRA_ANTI_BUCLE_MS, instalLaRecuperacioChunkDeploy, recuperaErrorChunkDeploy } from '../../pwa/recuperacioChunkDeploy.js';
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
import { TEXTOS_ALERGENS } from '../../utils/textosAlergens.js';
import { RUTA_PAGINA_NODRIR_IAIA, TEXTOS_IAIA_SABUDA } from './pageContent.nodrirIaia.js';
import { resolvePageSlugPath } from '../../config/navigation.js';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import { LAMINES_BOTANIQUES_NODE0, obteLaminaBotanicaNode0 } from '../../data/patrimoni/laminesBotaniquesNode0.js';
import { ESTAT_PROVES, PLUGINS, TEXTOS_BETA_OBERTA } from '../plugins/registrePlugins.js';
// T8 · D-12: la capçalera es contrasta amb package.json i amb la capçalera del connector.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const html = String(PAGE_COPY.versions?.html ?? '');
const llegix = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const PAQUET = JSON.parse(llegix('package.json'));
const CONNECTOR = llegix('wordpress-plugin/socdepoble-enxufe.php').match(/^ \* Version:\s+(\d+\.\d+\.\d+)\s*$/m)?.[1];
/* Onada R21 · La versió del connector publicada a WordPress.org, la que diuen l'entrada de la 1.1.0 i la capçalera de
   /versions: la 1.1.12 (SVN tags/1.1.12 r3781091, comprovat el 03-11-2026; systemPages.test.js). És història i es fixa
   literal: la capçalera del connector del repositori (CONNECTOR) ja pot ser més nova (la 1.1.13 de la v1.2.0), i
   l'entrada vella no es reescriu quan el repositori puja de versió. */
const CONNECTOR_PUBLICAT = '1.1.12';
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
/* Arbitratge R18.3 (P1-c) · Una pàgina amb ruta pròpia a App.jsx (com <Route path="/page/avisador">) també existix,
   encara que no siga de PAGE_COPY. */
const rutaExistix = (href) => {
  const cami = href.split(/[?#]/)[0];
  const pagina = /^\/page\/([^/]+)$/.exec(cami);
  if (pagina) {
    return RUTES.includes(`<Route path="${cami}" `)
      || (RUTES.includes('<Route path="/page/:slug" ') && Object.hasOwn(PAGE_COPY, pagina[1]));
  }
  const primer = cami.slice(1).split('/')[0];
  return new RegExp(`<Route path="/?${primer}(?:/\\*)?" `).test(RUTES);
};
const interns = (fragment) => [...fragment.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);

const TITOL_110 = `3 de novembre de 2026 · v1.1.0 (build pendent de desplegar) · Connector WordPress v${CONNECTOR_PUBLICAT} a WordPress.org`;
/* P0-62 / IDEA-193 (ordre del Mestre, 261108) · La fita de l'App Store, al capdamunt. */
const TITOL_FITA_APP_STORE = '6 de novembre de 2026 · Fita · L’app d’iPhone i iPad, publicada a l’App Store (versió 1.0)';
const fitaAppStore = blocDe(TITOL_FITA_APP_STORE);
/* Encàrrec mestre R13+R14 (ordre del Mestre, 08-11-2026 23:00, punt 4) · La crònica de les Onades R13 i R14, al
   capdamunt, davant de la fita de l'App Store. */
const TITOL_FITA_R13_R14 = '9 de novembre de 2026 · Onades R13 i R14 · El receptari «Què dinem?», la targeta d’usuaris i dispositius i el Segon Brain';
const fitaR13R14 = blocDe(TITOL_FITA_R13_R14);
/* Onada R15b (PRODNM-08) · La fita R15, al capdamunt, davant de la crònica R13+R14. */
const TITOL_FITA_R15 = '9 de novembre de 2026 · Onada R15 · El Workspace dels catàlegs i la proposta d’al·lèrgens';
const fitaR15 = blocDe(TITOL_FITA_R15);
const INICIS_R15 = { ca: '9 de novembre de 2026 · Onada R15', es: '9 de noviembre de 2026 · Oleada R15', en: '9 November 2026 · Wave R15',
  eu: '2026ko azaroaren 9a · R15 olatua', gl: '9 de novembro de 2026 · Onda R15' };
/* Onada R16 (R16b) · La fita R16, la de la versió 1.1.12, al capdamunt, davant de la fita R15. */
const TITOL_FITA_R16 = '10 de novembre de 2026 · Onada R16 · La versió 1.1.12, el Panell de Control en tres espais i La IAIA Sabuda';
const fitaR16 = blocDe(TITOL_FITA_R16);
const INICIS_R16 = { ca: '10 de novembre de 2026 · Onada R16', es: '10 de noviembre de 2026 · Oleada R16', en: '10 November 2026 · Wave R16',
  eu: '2026ko azaroaren 10a · R16 olatua', gl: '10 de novembro de 2026 · Onda R16' };
/* Onada R18 (Kit R18.3, P0-101; arbitratge R18) · La crònica de les Onades R17 i R18 va davant de la fita R16. */
const TITOL_FITA_R18 = '11 de novembre de 2026 · Onades R17 i R18 · Nucli verge, biblioteca multipoble d’arbres, L’Avisador i l’autoria dels catàlegs';
const fitaR18 = blocDe(TITOL_FITA_R18);
const INICIS_R18 = { ca: '11 de novembre de 2026 · Onades R17 i R18', es: '11 de noviembre de 2026 · Oleadas R17 y R18', en: '11 November 2026 · Waves R17 and R18',
  eu: '2026ko azaroaren 11 · R17 eta R18 olatuak', gl: '11 de novembro de 2026 · Ondas R17 e R18' };
/* Onada R19 · La crònica de l'Onada R19 va davant de la fita R18. */
const TITOL_FITA_R19 = '11 de novembre de 2026, vesprada · Onada R19 · Co-publicació entre entitats a la barra taronja, traspàs en línia i revisió de les làmines fotobotàniques';
const fitaR19 = blocDe(TITOL_FITA_R19);
const INICIS_R19 = { ca: '11 de novembre de 2026, vesprada · Onada R19', es: '11 de noviembre de 2026, tarde · Oleada R19', en: '11 November 2026, afternoon · Wave R19',
  eu: '2026ko azaroaren 11, arratsaldea · R19 olatua', gl: '11 de novembro de 2026, tarde · Onda R19' };
/* Onada R20 · La crònica de l'Onada R20 obri /versions, davant de la fita R19. */
const TITOL_FITA_R20 = '11 de novembre de 2026, nit · Onada R20 · Publicació en línia de Notes cap al Mur, filtre de verificació de les imatges botàniques i poliment responsive del Panell';
const fitaR20 = blocDe(TITOL_FITA_R20);
const INICIS_R20 = { ca: '11 de novembre de 2026, nit · Onada R20', es: '11 de noviembre de 2026, noche · Oleada R20', en: '11 November 2026, night · Wave R20',
  eu: '2026ko azaroaren 11, gaua · R20 olatua', gl: '11 de novembro de 2026, noite · Onda R20' };
/* Onada R21 · La fita R21, la de la versió 1.2.0, obri /versions, davant de la crònica R20. */
const TITOL_FITA_R21 = '12 de novembre de 2026 · Onada R21 · La versió 1.2.0, el xat propi, la IAIA en una sola fila i la frontera del contingut públic';
const fitaR21 = blocDe(TITOL_FITA_R21);
const INICIS_R21 = { ca: '12 de novembre de 2026 · Onada R21', es: '12 de noviembre de 2026 · Oleada R21', en: '12 November 2026 · Wave R21',
  eu: '2026ko azaroaren 12a · R21 olatua', gl: '12 de novembro de 2026 · Onda R21' };
/* Onada R21 (COMMIT 5) · La fita R21 C5, la del build 5 i el connector 1.1.14, obri /versions, davant de la fita R21. */
const TITOL_FITA_R21_C5 = '13 de novembre de 2026 · Onada R21 (COMMIT 5) · El Mur per als membres, el xat amb imatges i la recuperació després de cada actualització';
const fitaR21C5 = blocDe(TITOL_FITA_R21_C5);
const INICIS_R21_C5 = { ca: '13 de novembre de 2026 · Onada R21 (COMMIT 5)', es: '13 de noviembre de 2026 · Oleada R21 (COMMIT 5)',
  en: '13 November 2026 · Wave R21 (COMMIT 5)', eu: '2026ko azaroaren 13a · R21 olatua (COMMIT 5)', gl: '13 de novembro de 2026 · Onda R21 (COMMIT 5)' };

/* Onada R20 (Llei 0) · La crònica R19 no ven les làmines generades com a fotos: diu la quarantena reversible de les
   67 recreacions sintètiques, els 24 estudis morfològics corregits i el mòdul diferit de 0 B, en les cinc llengües. */
const VERITAT_R19 = {
  ca: ['67 imatges', 'recreacions sintètiques', 'quarantena reversible', '24 estudis morfològics corregits', '0 B'],
  es: ['67 imágenes', 'recreaciones sintéticas', 'cuarentena reversible', '24 estudios morfológicos corregidos', '0 B'],
  en: ['67 images', 'synthetic recreations', 'reversible quarantine', '24 corrected morphological studies', '0 B'],
  eu: ['67 irudiak', 'birsortze sintetikoak', 'berrogeialdi itzulgarri', 'zuzendutako 24 azterketa morfologiko', '0 B'],
  gl: ['67 imaxes', 'recreacións sintéticas', 'corentena reversible', '24 estudos morfolóxicos corrixidos', '0 B']
};
/* Gauntlet R21 (regressio_commit1-01) · La crònica R20 deia que l'Herbari i el Banc de Llavors incorporaven «exclusivament
   fotografia òptica real de Wikimedia Commons» amb SHA-256 verificada, i cap làmina té cap variant que passe
   potMostrarVariantBotanica. L'apartat es lliga al recompte real: mentre no n'hi haja cap, diu que les fitxes no en
   mostren; quan n'hi haja, la prova cau i el text s'ha de tornar a escriure en les cinc llengües. */
const VARIANTS_BOTANIQUES_ACTIVES = Object.keys(LAMINES_BOTANIQUES_NODE0)
  .reduce((n, id) => n + obteLaminaBotanicaNode0(id).variants.length, 0);
const SENSE_IMATGES_R20 = {
  ca: 'no mostren cap imatge', es: 'no muestran ninguna imagen', en: 'show no images',
  eu: 'ez dute irudirik erakusten', gl: 'non amosan ningunha imaxe'
};
const VENDA_FOTOGRAFIA_R20 = /fotografia òptica|fotografía óptica|optical photography|argazkilaritza optiko|exclusivament|exclusively/i;
const VENDA_R19 = /noves fotografies|nuevas fotografías|new photographs|argazki berriak|novas fotografías|ampliació verificada|ampliación verificada|verified expansion|hedapen egiaztatua/i;
test('R20 · la crònica R19 explica la quarantena de les làmines generades en les cinc llengües', () => {
  for (const [llengua, frases] of Object.entries(VERITAT_R19)) {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = cos.indexOf(`<h3>${INICIS_R19[llengua]}`);
    expect([llengua, inici > 0]).toEqual([llengua, true]);
    const bloc = cos.slice(inici, cos.indexOf('<h3>', inici + 1)).replace(/<[^>]+>/g, '');
    expect([llengua, frases.filter((frase) => !bloc.includes(frase)), VENDA_R19.test(bloc)]).toEqual([llengua, [], false]);
  }
});
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
      // Onada R21 (COMMIT 5) · La fita R21 C5 obri la pàgina, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R21_C5,
      // Onada R21 · La fita R21, darrere de la C5: diu la versió 1.2.0, però no com a número vX.Y.Z del títol.
      TITOL_FITA_R21,
      // Onada R20 · La crònica de l'Onada R20, davant de R19, sense número vX.Y.Z al títol.
      TITOL_FITA_R20,
      // Onada R19 · La crònica de l'Onada R19, davant de R18, sense número vX.Y.Z al títol.
      TITOL_FITA_R19,
      // Onada R18 · La crònica de les Onades R17 i R18, davant de la fita R16, sense número vX.Y.Z al títol.
      TITOL_FITA_R18,
      // Onada R16 (R16b) · La fita R16, la de la versió 1.1.12: diu la versió, però no com a número vX.Y.Z del títol.
      TITOL_FITA_R16,
      // Onada R15b · La fita R15, la segona (no és una entrega numerada del web).
      TITOL_FITA_R15,
      // Encàrrec R13+R14 · La crònica de les Onades R13 i R14, la segona.
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
    // Gauntlet T3 · S'exclou per títol: la fita R21 també cita l'etiqueta «v1.2.0 · suplement…» al tercer paràgraf.
    const entregues = html.split(/(?=<h3>)/).filter((b) => b.startsWith('<h3>') && !b.startsWith('<h3>Crònica') && !/^<h3>[^<]* · v1\.2\.0 · suplement/.test(b));
    // P0-62, encàrrec R13+R14, R15b, R16b, R18, R19, R20 i R21 · Set entregues, la fita de l'App Store, la crònica R13+R14,
    // les fites R15 i R16, la crònica R17+R18, la crònica R19, la crònica R20 i la fita R21, amb el mateix format.
    // R21 (COMMIT 5) · I la fita R21 C5: setze en total.
    expect(entregues).toHaveLength(16);
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

  test('és la primera entrada numerada del 3 de novembre, amb el títol literal, i la versió unificada d’ara és 1.2.0', () => {
    expect(html.indexOf('<h3>')).toBeLessThan(html.indexOf(`<h3>${TITOL_110}</h3>`));
    expect(html.slice(0, html.indexOf(`<h3>${TITOL_110}</h3>`))).toContain('v1.2.0 · suplement pendent d’integració');
    /* Onada R21 · La versió unificada passa de la 1.1.12 (R16) a la 1.2.0: la fita R21 ho explica. */
    expect(PAQUET.version).toBe('1.2.0');
    expect(TITOL_110).toContain('· v1.1.0 (');
    /* Gauntlet O6 (VER-02/VER-03) · El connector del títol és el publicat a WordPress.org, que no pot ser més nou
       que el del repositori (la capçalera del connector). Onada R21 · El repositori ja porta la 1.1.13 i el títol
       continua dient la 1.1.12 publicada: la història no es reescriu. */
    expect(TITOL_110.match(/Connector WordPress v(\d+\.\d+\.\d+) a WordPress\.org$/)?.[1]).toBe(CONNECTOR_PUBLICAT);
    expect(noMesNova(CONNECTOR_PUBLICAT, CONNECTOR), `${CONNECTOR_PUBLICAT} ≤ ${CONNECTOR}`).toBe(true);
  });

  test('pendent de desplegar: cap frase no diu que siga desplegat, en viu o en producció', () => {
    expect(pla).toContain('està pendent de desplegar');
    expect(pla).toContain('El build del web portarà la data del desplegament.');
    expect(entrega110).not.toMatch(/build \d{6}/);
    expect(pla).not.toMatch(/\bdesplega(?:t|ts|d[ae]s?)\b|\ben viu\b|en producció|ja és públic|publicada a socdepoble/i);
  });

  /* Onada R21 · L'entrada de la 1.1.0 diu el build d'aquell dia, el 2: és història i es fixa literal (abans es derivava
     del versionCode, i pujar el build l'haguera reescrita). Les apps d'ara, 1.2.0 amb el build 4, les fixa la fita R21.
     Onada R21 (COMMIT 5) · El build passa al 5 (la fita R21 C5), sense tocar la versió 1.2.0. */
  test('la versió de les apps d’ara és la 1.2.0, unificada amb package.json, i l’entrada conserva el build d’aquell dia, el 2', () => {
    const gradle = llegix('android/app/build.gradle');
    const pbx = llegix('ios/App/App.xcodeproj/project.pbxproj');
    expect(gradle).toMatch(/versionName "1\.2\.0"/);
    expect([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1])).toEqual(expect.arrayContaining(['1.2.0']));
    expect(new Set([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]))).toEqual(new Set(['1.2.0']));
    const build = gradle.match(/versionCode (\d+)/)[1];
    expect(new Set([...pbx.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => m[1]))).toEqual(new Set([build]));
    expect(build).toBe('5');
    expect(pla).toContain('el número de build de les apps, el 2, no canvia');
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
    /* Onada R21 · La 1.1.12 és la publicada (CONNECTOR_PUBLICAT); el repositori ja porta la 1.1.13, pendent de l'SVN. */
    expect(cos).toContain(`El connector ${CONNECTOR_PUBLICAT} ja està publicat a WordPress.org`);
    expect(publicada).toBe('1.1.12');
    expect(publicada).toBe(CONNECTOR_PUBLICAT);
    expect(noMesNova(publicada, CONNECTOR), `${publicada} ≤ ${CONNECTOR}`).toBe(true);
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
    // P0-62, encàrrec R13+R14, R15b, R16b, R18 i R19 · Sis posicions més avall: les cròniques R19 i R17+R18, les fites R16 i R15,
    // la crònica R13+R14 i la fita de l'App Store obrin la pàgina. R20 i R21 · Les cròniques R20 i R21 també (R21, una posició més).
    // R21 (COMMIT 5) · La fita R21 C5, una posició més.
    expect(titols[12]).toMatch(/^1 de novembre de 2026 · v/);
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
/* Onada R21 (COMMIT 5) · Amb R21.1 v1+v2, revocacioPublicacions és al contracte i l'adaptador local no l'oferix: entra a
   l'inventari d'ara (com a pageContent.fediversity.test.js), i el rebut de l'1 de novembre continua sense nomenar-la. */
test('12 de novembre · l’inventari local actual no reescriu el rebut històric de l’1 de novembre', () => {
  expect(CAPACITATS_NO_DECLARADES).toEqual(['revocacioPublicacions','administracioSessions','curadoriaCultural','iaia','xatRitme','importacioPaquetMunicipal','verificacioCorreu','recuperacioCorreu']);
  expect(entregaAssalt).toMatch(/^<h3>1 de novembre de 2026, tarda/);
  expect(entregaAssalt).not.toContain('revocacioPublicacions');
});

describe('Assalt 10/10 · /versions té l’entrada honesta de la tarda de l’1 de novembre', () => {
  const pla = text(entregaAssalt);

  test('és la segona entrada, darrere de la 1.1.0, amb el format de les altres', () => {
    const titols = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
    // P0-62, encàrrec R13+R14, R15b, R16b, R18 i R19 · Sis posicions més avall: les cròniques R19 i R17+R18, les fites R16 i R15,
    // la crònica R13+R14 i la fita de l'App Store obrin la pàgina. R20 i R21 · Les cròniques R20 i R21 també (R21, una posició més).
    // R21 (COMMIT 5) · La fita R21 C5, una posició més.
    expect(titols[11]).toMatch(/^1 de novembre de 2026, tarda · /);
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
    // The dated 1-November receipt stays historical; a later local capability
    // must not be retroactively attributed to that release.
    expect(entregaAssalt).not.toContain('revocacioPublicacions');
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

  test('és la cinquena entrada, just darrere de la crònica R17+R18, de les fites R16 i R15 i de la crònica R13+R14, amb la data real, la versió 1.0 i el format de les entregues', () => {
    // R18, R16b, R15b i encàrrec R13+R14 · La crònica R17+R18 i les fites R16 i R15 van primer, la crònica de les Onades R13 i R14
    // després i la fita, tot seguit.
    // Onada R21 · La fita R21 va davant de tot, i la resta, en el mateix ordre.
    // Onada R21 (COMMIT 5) · La fita R21 C5 va davant de la R21.
    const cos = html.trimStart();
    expect(cos.startsWith(`<h3>${TITOL_FITA_R21_C5}</h3>`)).toBe(true);
    expect(cos.slice(fitaR21C5.length).startsWith(`<h3>${TITOL_FITA_R21}</h3>`)).toBe(true);
    const r21 = fitaR21C5.length + fitaR21.length;
    expect(cos.slice(r21).startsWith(`<h3>${TITOL_FITA_R20}</h3>`)).toBe(true);
    expect(cos.slice(r21 + fitaR20.length).startsWith(`<h3>${TITOL_FITA_R19}</h3>`)).toBe(true);
    expect(cos.slice(r21 + fitaR20.length + fitaR19.length).startsWith(`<h3>${TITOL_FITA_R18}</h3>`)).toBe(true);
    expect(cos.slice(r21 + fitaR20.length + fitaR19.length + fitaR18.length).startsWith(`<h3>${TITOL_FITA_R16}</h3>`)).toBe(true);
    expect(cos.slice(r21 + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length).startsWith(`<h3>${TITOL_FITA_R15}</h3>`)).toBe(true);
    expect(cos.slice(r21 + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length + fitaR15.length).startsWith(`<h3>${TITOL_FITA_R13_R14}</h3>`)).toBe(true);
    expect(cos.slice(r21 + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length + fitaR15.length + fitaR13R14.length).startsWith(`<h3>${TITOL_FITA_APP_STORE}</h3>`)).toBe(true);
    expect(fitaAppStore).toMatch(/^<h3>[^<]+<\/h3>\n {6}<p>/);
    expect(titolsH4(fitaAppStore)).toEqual(['Novetat · Sóc de Poble a l’App Store']);
    const pla = text(fitaAppStore);
    expect(pla).toContain('Apple ha aprovat i publicat l’app de Sóc de Poble per a iPhone i iPad: la versió 1.0 és a l’App Store des del 6 de novembre de 2026, gratis i per a iOS i iPadOS 16 o posterior.');
    expect(pla).toContain('Ho hem comprovat el 8 de novembre a la consulta pública d’Apple.');
    // La fita no és cap entrega del web: no porta cap número vX.Y.Z que entre en l'ordre de les versions.
    expect(TITOL_FITA_APP_STORE).not.toMatch(/ · v\d+\.\d+\.\d+/);
  });

  test('l’enllaç és la fitxa del canal obert, i cap altra plataforma mòbil al bloc', () => {
    expect(APP_STORE).toBe('https://apps.apple.com/es/app/soc-de-poble/id6826441844');
    expect([...fitaAppStore.matchAll(/href="([^"]+)"/g)].map((m) => m[1])).toEqual([APP_STORE]);
    expect(fitaAppStore).toContain(`<a href="${APP_STORE}" target="_blank" rel="noopener noreferrer">enllaç directe a la fitxa</a>`);
    expect(PLATAFORMA_ALIENA.test(text(fitaAppStore))).toBe(false);
    expect(fitaAppStore).not.toMatch(/TestFlight|\bbeta\b|en proves/i);
  });

  test('les cinc llengües: la crònica R17+R18, les fites R16 i R15, la crònica R13+R14, la fita i, després, l’entrada del 5 de novembre i el registre en valencià', () => {
    const inicis = {
      ca: [INICIS_R18.ca, INICIS_R16.ca, INICIS_R15.ca, '9 de novembre de 2026 · Onades R13 i R14', '6 de novembre de 2026 · Fita', '5 de novembre de 2026 · '],
      es: [INICIS_R18.es, INICIS_R16.es, INICIS_R15.es, '9 de noviembre de 2026 · Oleadas R13 y R14', '6 de noviembre de 2026 · Hito', '5 de noviembre de 2026 · '],
      en: [INICIS_R18.en, INICIS_R16.en, INICIS_R15.en, '9 November 2026 · Waves R13 and R14', '6 November 2026 · Milestone', '5 November 2026 · '],
      eu: [INICIS_R18.eu, INICIS_R16.eu, INICIS_R15.eu, '2026ko azaroaren 9a · R13 eta R14 olatuak', '2026ko azaroaren 6a · Mugarria', '2026ko azaroaren 5a · '],
      gl: [INICIS_R18.gl, INICIS_R16.gl, INICIS_R15.gl, '9 de novembro de 2026 · Ondas R13 e R14', '6 de novembro de 2026 · Fito', '5 de novembro de 2026 · ']
    };
    for (const [llengua, [r18, r16, r15, cronica, fita, seguent]] of Object.entries(inicis)) {
      const pagina = localitzaPagina(PAGE_COPY.versions, llengua);
      const cos = pagina.html.trimStart();
      // Onada R21 · La fita R21 obri la pàgina i la resta baixa una posició.
      // Onada R21 (COMMIT 5) · La fita R21 C5 obri la pàgina, davant de la R21, i la resta baixa una posició més.
      expect([llengua, cos.startsWith(`<h3>${INICIS_R21_C5[llengua]}`)]).toEqual([llengua, true]);
      const h3 = [...cos.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
      expect([llengua, h3[1].startsWith(INICIS_R21[llengua]), h3[2].startsWith(INICIS_R20[llengua]), h3[3].startsWith(INICIS_R19[llengua]), h3[4].startsWith(r18), h3[5].startsWith(r16), h3[6].startsWith(r15), h3[7].startsWith(cronica), h3[8].startsWith(fita), h3[9].startsWith(seguent)]).toEqual([llengua, true, true, true, true, true, true, true, true, true]);
      const hrefs = (des, fins) => [...cos.slice(des, fins).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect([llengua, hrefs(cos.indexOf(h3[8]), cos.indexOf(h3[9]))]).toEqual([llengua, [APP_STORE]]);
      expect([llengua, hrefs(cos.indexOf(h3[7]), cos.indexOf(h3[8]))]).toEqual([llengua, ['/page/receptes']]);
      expect([llengua, hrefs(cos.indexOf(h3[6]), cos.indexOf(h3[7]))]).toEqual([llengua, ['/page/receptes']]);
      expect([llengua, hrefs(cos.indexOf(h3[5]), cos.indexOf(h3[6]))]).toEqual([llengua, ['/control', '/page/la-iaia-sabuda', '/page/receptes']]);
      expect([llengua, hrefs(cos.indexOf(h3[4]), cos.indexOf(h3[5]))]).toEqual([llengua, ['/control', '/page/arbres-monumentals', '/page/avisador', '/page/receptes', '/disseny']]);
      expect([llengua, cos.indexOf('<div lang="ca">') === -1 || cos.indexOf('<div lang="ca">') > cos.indexOf(h3[9])]).toEqual([llengua, true]);
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
  /* R15b · La crònica R13+R14 ja no és la primera: es busca pel seu títol en cada llengua. */
  const INICIS_R13 = { ca: '9 de novembre de 2026 · Onades R13 i R14', es: '9 de noviembre de 2026 · Oleadas R13 y R14', en: '9 November 2026 · Waves R13 and R14',
    eu: '2026ko azaroaren 9a · R13 eta R14 olatuak', gl: '9 de novembro de 2026 · Ondas R13 e R14' };
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = cos.indexOf(`<h3>${INICIS_R13[llengua]}`);
    expect([llengua, inici]).not.toEqual([llengua, -1]);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 1));
  };

  test('és la quarta entrada, darrere de la crònica R17+R18 i de les fites R16 i R15, amb el format de les entregues i tres apartats amb el prefix de novetat de cada llengua', () => {
    expect(html.trimStart().startsWith(`<h3>${TITOL_FITA_R21_C5}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR21C5.length).startsWith(`<h3>${TITOL_FITA_R21}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length).startsWith(`<h3>${TITOL_FITA_R20}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length + fitaR20.length).startsWith(`<h3>${TITOL_FITA_R19}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length).startsWith(`<h3>${TITOL_FITA_R18}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length).startsWith(`<h3>${TITOL_FITA_R16}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length).startsWith(`<h3>${TITOL_FITA_R15}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length + fitaR15.length).startsWith(`<h3>${TITOL_FITA_R13_R14}</h3>`)).toBe(true);
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

/* Onada R15b (PRODNM-08) · La fita R15 obri /versions en les cinc llengües, breu i veraç: R15a (kit sanejat) i R15b
   (el Workspace de les pàgines públiques de catàleg, amb Llista/Rajola i la fitxa sense finestra; la proposta
   d'al·lèrgens pendent de validació humana; la taula d'usuaris i dispositius i Nodrir la IAIA, que esperen la
   migració 2611091500). Les etiquetes ixen de la interfície (textosCatalegWorkspace i textosAlergens) i la
   migració, del directori supabase/migrations: si canvien, la prova cau. Cap altra plataforma mòbil, cap botiga,
   l'enllaç intern sense target i la densitat de negretes de la fita anterior.
   R16b · Des de la fita R16, la R15 és la segona. És història del 9-11-2026 i no es reescriu: aquell dia la pàgina
   es deia «Nodrir la IAIA» en cada llengua (NOMS_R15), i la fita R16 conta que ara es diu La IAIA Sabuda. */
const NOMS_R15 = Object.freeze({ ca: 'Nodrir la IAIA', es: 'Alimentar a la IAIA', en: 'Feed IAIA', eu: 'IAIA elikatu', gl: 'Nutrir a IAIA' });
describe('R15b · /versions porta la fita R15, darrere de la fita R16', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const PREFIX = { ca: 'Novetat', es: 'Novedad', en: 'New', eu: 'Berritasuna', gl: 'Novidade' };
  /* R18 · La fita R15 ja no és la segona: es busca pel seu títol en cada llengua, i la posició la fixa la prova de dalt. */
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = cos.indexOf(`<h3>${INICIS_R15[llengua]}`);
    expect([llengua, inici]).not.toEqual([llengua, -1]);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 1));
  };

  test('és la tercera entrada, darrere de la crònica R17+R18 i de la fita R16, amb el format de les entregues i tres novetats en cada llengua', () => {
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length).startsWith(`<h3>${TITOL_FITA_R15}</h3>`)).toBe(true);
    expect(titolsH4(fitaR15)).toEqual(['Novetat · El Workspace dels catàlegs', 'Novetat · Al·lèrgens de les receptes', 'Novetat · Usuaris, dispositius i Nodrir la IAIA']);
    expect(TITOL_FITA_R15).not.toMatch(/ · v\d+\.\d+\.\d+/);
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      expect([llengua, bloc]).toEqual([llengua, expect.stringMatching(/^<h3>[^<]+<\/h3>\n {6}<p>/)]);
      expect([llengua, titolsH4(bloc).map((t) => t.split(' · ')[0])]).toEqual([llengua, Array(3).fill(PREFIX[llengua])]);
      expect([llengua, bloc.endsWith('</p>\n\n      ')]).toEqual([llengua, true]);
    }
  });

  test('R15a i R15b, les etiquetes de la interfície, els símbols del panell i la migració que existix', () => {
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    expect(migracions.filter((nom) => nom.startsWith('2611091500_'))).toHaveLength(1);
    const VISTES_R15 = {
      ca: ['Llista', 'Rajola quadrada'],
      es: ['Lista', 'Baldosa cuadrada'],
      en: ['List', 'Square tiles'],
      eu: ['Zerrenda', 'Lauza karratuak'],
      gl: ['Lista', 'Baldosa cadrada']
    };
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      const pla = text(bloc);
      for (const peca of ['R15a', 'R15b']) expect([llengua, peca, pla.includes(peca)]).toEqual([llengua, peca, true]);
      for (const etiqueta of VISTES_R15[llengua]) expect([llengua, etiqueta, pla.includes(etiqueta)]).toEqual([llengua, etiqueta, true]);
      for (const simbol of ['«•»', '«T»', `«${TEXTOS_ALERGENS[llengua].desconegut}»`]) expect([llengua, simbol, pla.includes(simbol)]).toEqual([llengua, simbol, true]);
      expect([llengua, bloc.includes('<code>2611091500</code>')]).toEqual([llengua, true]);
      /* PRODUCCIO-02 bis i R16b · La pàgina es diu pel títol que tenia el 9-11-2026 en cada llengua (NOMS_R15), al
         títol de la novetat i al cos; mai «Nodrir la IAIA» fora del valencià, i cap nom d'ara (TEXTOS_IAIA_SABUDA):
         la història no es reescriu. */
      const nom = NOMS_R15[llengua];
      expect([llengua, titolsH4(bloc)[2].endsWith(` ${nom}`), bloc.includes(`<strong>${nom}</strong>`)]).toEqual([llengua, true, true]);
      if (llengua !== 'ca') expect([llengua, pla.includes('Nodrir la IAIA')]).toEqual([llengua, false]);
      expect([llengua, pla.includes(TEXTOS_IAIA_SABUDA[llengua].titol)]).toEqual([llengua, false]);
    }
    // «Quatre pàgines públiques»: les del Workspace de patrimoni i Fediversity a PageDetailSection.
    const detall = llegix('src/sections/detail/PageDetailSection.jsx');
    const workspaces = detall.match(/const WORKSPACES_PATRIMONI = \{([\s\S]*?)\n\};/)?.[1] ?? '';
    /* Onada R17 (Kit R17.3) · La nota de R15 parla de quatre, i la història no es reescriu. El codi pot créixer
       (R17.3 hi afig arbres-monumentals).
       T1b (ordre directa del Mestre, 12-11-2026 21:26; prova posada al dia a propòsit) · /page/fediversity ja no
       és cap Workspace: torna a ser una UniversalPage normal. Les tres de patrimoni continuen sent-ho. */
    const claus = [...workspaces.matchAll(/^\s+'?([\w-]+)'?: lazy\(/gm)].map((m) => m[1]);
    expect(claus).toEqual(expect.arrayContaining(['herbari', 'banc-de-llavors', 'receptes']));
    expect(claus).not.toContain('fediversity');
    expect(text(fitaR15)).toContain('quatre pàgines públiques');
  });

  test('l’enllaç és intern de l’SPA: cap target ni rel, i la ruta existix', () => {
    for (const llengua of LLENGUES) {
      const enllacos = [...blocEn(llengua).matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
      expect([llengua, enllacos]).toEqual([llengua, ['<a href="/page/receptes">']]);
    }
    expect(rutaExistix('/page/receptes')).toBe(true);
  });

  test('2.3.10 · cap altra plataforma mòbil ni cap botiga, i cap promesa per damunt del que hi ha', () => {
    for (const llengua of LLENGUES) {
      const pla = text(blocEn(llengua));
      expect([llengua, PLATAFORMA_ALIENA.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /Google|Apple|App Store|iPhone|iPad|TestFlight/.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /\bdesplegad[ae]s?\b|en producció|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a|La Parr[òo]quia|Mercadona|escandall/i.test(pla)]).toEqual([llengua, false]);
    }
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
      expect(blocEn(llengua), llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });
});

/* Onada R16 (R16b) · La capçalera diu «Versió actual: v1.1.12» i la fita R16 ho explica, al capdamunt de /versions i
   en les cinc llengües, amb l'estructura de les fites anteriors. El que diu es fixa literal, com a història del
   10-11-2026: la versió, el build, els noms dels tres espais del Panell, el nom vell i el nou de La IAIA Sabuda,
   «Què dinem?» al Mur i la subnavegació de Pobles i Gent. Del codi d'ara només es comprova el que la fita promet que
   continua: l'adreça antiga porta a La IAIA Sabuda i la targeta de Receptes du la portada. Cap xifra fora de la data,
   l'onada, la versió i el build, cap altra plataforma mòbil i res del que s'ha descartat. */
describe('R16b · /versions s’obri amb la fita R16, la de la versió 1.1.12', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const PREFIX = { ca: 'Novetat', es: 'Novedad', en: 'New', eu: 'Berritasuna', gl: 'Novidade' };
  /* El text pla escapa com l'HTML de la fita: «Economy & Business» hi és «Economy &amp; Business». */
  const enHtml = (cadena) => cadena.replace(/&/g, '&amp;');
  /* R18 · La fita R16 ja no és la primera: es busca pel seu títol en cada llengua. */
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = cos.indexOf(`<h3>${INICIS_R16[llengua]}`);
    expect([llengua, inici]).not.toEqual([llengua, -1]);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 1));
  };
  const apartatEn = (llengua, index) => apartats(blocEn(llengua))[index];

  test('és la quarta entrada, darrere de les cròniques R20, R19 i R17+R18 i davant de la fita R15, amb el format de les entregues i quatre novetats en cada llengua', () => {
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length).startsWith(`<h3>${TITOL_FITA_R16}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length).startsWith(`<h3>${TITOL_FITA_R15}</h3>`)).toBe(true);
    expect(titolsH4(fitaR16)).toEqual([
      'Novetat · El Panell de Control, en tres espais', 'Novetat · La IAIA Sabuda', 'Novetat · «Què dinem?» al Mur',
      'Novetat · La subnavegació de Pobles i Gent'
    ]);
    // Com les altres fites, el títol no porta cap « · vX.Y.Z» que entre en l'ordre de les entregues numerades.
    expect(TITOL_FITA_R16).not.toMatch(/ · v\d+\.\d+\.\d+/);
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      expect([llengua, bloc]).toEqual([llengua, expect.stringMatching(/^<h3>[^<]+<\/h3>\n {6}<p>/)]);
      expect([llengua, titolsH4(bloc).map((t) => t.split(' · ')[0])]).toEqual([llengua, Array(4).fill(PREFIX[llengua])]);
      expect([llengua, apartats(bloc).length]).toEqual([llengua, 4]);
      expect([llengua, bloc.endsWith('</p>\n\n      ')]).toEqual([llengua, true]);
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      const iniciR16 = cos.indexOf(`<h3>${INICIS_R16[llengua]}`);
      expect([llengua, cos.startsWith(`<h3>${INICIS_R15[llengua]}`, iniciR16 + bloc.length)]).toEqual([llengua, true]);
    }
  });

  /* La fita és història del 10-11-2026: el que diu es fixa literal (com NOMS_R15) i no es deriva del codi d'ara, que
     continuarà canviant. Si el codi canvia, la fita no es reescriu: es conta en una entrada nova. */
  const VERSIO_R16 = '1.1.12';
  const BUILD_R16 = {
    ca: 'El número de build de les apps, el 2, no canvia.', es: 'El número de build de las apps, el 2, no cambia.',
    en: 'The apps’ build number, 2, does not change.', eu: 'Aplikazioen build zenbakia, 2, ez da aldatzen.',
    gl: 'O número de build das apps, o 2, non cambia.'
  };
  const PANELL_R16 = { ca: 'Panell de Control', es: 'Panel de Control', en: 'Control Panel', eu: 'Kontrol panela', gl: 'Panel de control' };
  const ESPAIS_R16 = {
    ca: ['Economia i Empresa', 'La llar', 'Maquinària i Sistema'], es: ['Economía y Empresa', 'El hogar', 'Maquinaria y Sistema'],
    en: ['Economy & Business', 'The Home', 'Machinery and System'], eu: ['Ekonomia eta Enpresa', 'Etxea', 'Makineria eta Sistema'],
    gl: ['Economía e Empresa', 'O fogar', 'Maquinaria e Sistema']
  };
  const NOMS_R16 = { ca: 'La IAIA Sabuda', es: 'La IAIA Sabia', en: 'The Wise IAIA', eu: 'IAIA Jakintsua', gl: 'A IAIA Sabia' };
  const MUR_R16 = { ca: 'Mur', es: 'Muro', en: 'Wall', eu: 'Horma', gl: 'Muro' };
  const SUBNAV_R16 = {
    ca: ['Pobles', 'Gent i Entitats', 'Demografia'], es: ['Pueblos', 'Gente y Entidades', 'Demografía'],
    en: ['Towns', 'People & Entities', 'Demographics'], eu: ['Herriak', 'Jendea eta Entitateak', 'Demografia'],
    gl: ['Vilas', 'Xente e Entidades', 'Demografía']
  };

  test('la web i les apps passen a la 1.1.12, el número del connector, i el número de build, el 2, no canvia', () => {
    // El mateix build que deia l'entrada de la 1.1.0.
    expect(text(entrega110)).toContain('el número de build de les apps, el 2, no canvia');
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      const obertura = text(bloc.match(/<\/h3>\n {6}<p>([\s\S]*?)<\/p>/)[1]);
      expect([llengua, bloc.match(/^<h3>([^<]+)<\/h3>/)[1].includes(VERSIO_R16)]).toEqual([llengua, true]);
      expect([llengua, obertura.includes(VERSIO_R16), obertura.includes('WordPress'), obertura.includes(BUILD_R16[llengua])]).toEqual([llengua, true, true, true]);
    }
  });

  test('el Panell de Control, en tres espais amb el nom de cada llengua', () => {
    for (const llengua of LLENGUES) {
      const { cos } = apartatEn(llengua, 0);
      const posicions = ESPAIS_R16[llengua].map((nom) => cos.indexOf(`<strong>«${enHtml(nom)}»</strong>`));
      expect([llengua, posicions.every((p) => p >= 0)]).toEqual([llengua, true]);
      expect([llengua, [...posicions].sort((a, b) => a - b)]).toEqual([llengua, posicions]);
      expect([llengua, cos.includes(`<a href="/control">${PANELL_R16[llengua]}</a>`)]).toEqual([llengua, true]);
    }
  });

  test('La IAIA Sabuda: el nom del 9-11 i el del 10-11 en cada llengua, i l’adreça antiga hi porta', () => {
    expect(Object.hasOwn(PAGE_COPY, 'nodrir-la-iaia')).toBe(false);
    expect(resolvePageSlugPath('nodrir-la-iaia')).toBe(RUTA_PAGINA_NODRIR_IAIA);
    expect(RUTA_PAGINA_NODRIR_IAIA).toBe('/page/la-iaia-sabuda');
    // La guarda de la curadoria de la targeta del Panell es prova pel comportament a ControlSection.test.jsx (PRODUCCIO-02).
    for (const llengua of LLENGUES) {
      const ara = NOMS_R16[llengua];
      const { titol, cos } = apartatEn(llengua, 1);
      expect([llengua, titol]).toEqual([llengua, `${PREFIX[llengua]} · ${ara}`]);
      expect([llengua, cos.includes(`<strong>«${NOMS_R15[llengua]}»</strong>`)]).toEqual([llengua, true]);
      expect([llengua, cos.includes(`<a href="${RUTA_PAGINA_NODRIR_IAIA}"><strong>${ara}</strong></a>`)]).toEqual([llengua, true]);
      expect([llengua, cos.indexOf(NOMS_R15[llengua]) < cos.indexOf(ara)]).toEqual([llengua, true]);
    }
  });

  test('«Què dinem?» entra al Mur com a targeta, amb la portada del llibre', () => {
    // La targeta d'ara, amb la portada, es prova a targetesMur.test.js: ací només la història.
    for (const llengua of LLENGUES) {
      const { titol, cos } = apartatEn(llengua, 2);
      const mur = MUR_R16[llengua];
      expect([llengua, titol.includes('«Què dinem?»'), titol.includes(mur), text(cos).includes(mur)]).toEqual([llengua, true, true, true]);
      expect([llengua, [...cos.matchAll(/href="([^"]+)"/g)].map((m) => m[1])]).toEqual([llengua, ['/page/receptes']]);
    }
  });

  test('la subnavegació de Pobles i Gent, amb els noms de cada llengua', () => {
    for (const llengua of LLENGUES) {
      const { cos } = apartatEn(llengua, 3);
      for (const nom of SUBNAV_R16[llengua]) {
        expect([llengua, nom, cos.includes(`<strong>${enHtml(nom)}</strong>`)]).toEqual([llengua, nom, true]);
      }
    }
  });

  test('els enllaços són interns de l’SPA: cap target ni rel, i les rutes existixen', () => {
    for (const llengua of LLENGUES) {
      const enllacos = [...blocEn(llengua).matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
      expect([llengua, enllacos]).toEqual([llengua, ['<a href="/control">', '<a href="/page/la-iaia-sabuda">', '<a href="/page/receptes">']]);
      // Cada enllaç és una paraula més de la frase: un espai (o l'inici del paràgraf) davant, i cap enganxat a la de darrere.
      expect([llengua, blocEn(llengua).match(/[^\s>]<a |<\/a>[^\s,.:]/g)]).toEqual([llengua, null]);
    }
    for (const ruta of interns(fitaR16)) expect(rutaExistix(ruta), ruta).toBe(true);
  });

  test('2.3.10, cap xifra inventada i res del que s’ha descartat', () => {
    const permeses = new Set(['10', '2026', '16', VERSIO_R16, '2']);
    for (const llengua of LLENGUES) {
      const pla = text(blocEn(llengua));
      expect([llengua, PLATAFORMA_ALIENA.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /Google|Apple|App Store|iPhone|iPad|TestFlight/.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /\bdesplegad[ae]s?\b|en producció|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a/i.test(pla)]).toEqual([llengua, false]);
      // Res del que s'ha descartat: L'Avisador, la versió viva, el mode sense connexió, la fitxa científica, l'RSVP, el Snippet ni cap .zip.
      expect([llengua, /Avisador|versi[óo]n? viv[ao]|live version|bertsio bizi|connexi[óo]|conexi[óo]n|offline|konexio|cient[íi]fic|scientific|zientifiko|RSVP|Snippet|\.zip\b/i.test(pla)]).toEqual([llengua, false]);
      const xifres = [...pla.matchAll(/\d+(?:\.\d+)*/g)].map((m) => m[0]);
      expect([llengua, xifres.filter((x) => !permeses.has(x))]).toEqual([llengua, []]);
    }
  });

  test('densitat de negretes de cada paràgraf, en les cinc llengües (el contracte de l’Onada 6)', () => {
    for (const llengua of LLENGUES) {
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...blocEn(llengua).matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect([llengua, paragrafsDelBloc.length]).toEqual([llengua, 5]);
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

/* Onada R18 (Kit R18.3 de Gemini Carbon, P0-100 i P0-101; arbitratge R18) · La crònica de les Onades R17 i R18 obri
   /versions en les cinc llengües, amb l'estructura de les fites anteriors: tres novetats i una millora, enllaços
   interns, cap altra plataforma mòbil i la densitat de negretes de l'Onada 6. I només conta el que hi ha: el nombre
   d'arbres ix del catàleg de 2020, les eines en proves són les que diu el registre de connectors i cap format
   d'intercanvi que no exporte cap mòdul. */
describe('R18 · /versions s’obri amb la crònica de les Onades R17 i R18 en les cinc llengües', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const PREFIXOS = {
    ca: ['Novetat', 'Novetat', 'Novetat', 'Millora'],
    es: ['Novedad', 'Novedad', 'Novedad', 'Mejora'],
    en: ['New', 'New', 'New', 'Improvement'],
    eu: ['Berritasuna', 'Berritasuna', 'Berritasuna', 'Hobekuntza'],
    gl: ['Novidade', 'Novidade', 'Novidade', 'Mellora']
  };
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = cos.indexOf(`<h3>${INICIS_R18[llengua]}`);
    expect([llengua, inici >= 0]).toEqual([llengua, true]);
    const seguent = cos.indexOf('<h3>', inici + 1);
    return cos.slice(inici, seguent < 0 ? undefined : seguent);
  };

  test('obri la pàgina en les cinc llengües, sense número vX.Y.Z al títol, amb tres novetats i una millora, rutes vives i regla 2.3.10', () => {
    expect(TITOL_FITA_R18).not.toMatch(/ · v\d+\.\d+\.\d+/);
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      expect([llengua, bloc]).toEqual([llengua, expect.stringMatching(/^<h3>[^<]+<\/h3>\n {6}<p>/)]);
      expect([llengua, titolsH4(bloc).map((t) => t.split(' · ')[0])]).toEqual([llengua, PREFIXOS[llengua]]);
      expect([llengua, bloc.endsWith('</p>\n\n      ')]).toEqual([llengua, true]);
      const enllacos = [...bloc.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
      expect([llengua, enllacos]).toEqual([llengua, [
        '<a href="/control">',
        '<a href="/page/arbres-monumentals">',
        '<a href="/page/avisador">',
        '<a href="/page/receptes">',
        '<a href="/disseny">'
      ]]);
      // Cada enllaç és una paraula més de la frase, com a la fita R16.
      expect([llengua, bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g)]).toEqual([llengua, null]);
      const pla = text(bloc);
      expect([llengua, PLATAFORMA_ALIENA.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /Google|Apple|App Store|iPhone|iPad|TestFlight/.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /\bdesplegad[ae]s?\b|en producció|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a/i.test(pla)]).toEqual([llengua, false]);
      expect([llengua, pla.includes('Sóc de Poble')]).toEqual([llengua, true]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect([llengua, paragrafsDelBloc.length]).toEqual([llengua, 5]);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
    }
    for (const ruta of interns(fitaR18)) expect(rutaExistix(ruta), ruta).toBe(true);
  });

  test('només conta el que hi ha: els arbres del catàleg, les eines en proves del registre i cap format que no s’exporte', () => {
    // «hui el porten set»: les eines del registre de connectors amb estat 'proves' (P0-113 i R19 · T3, ordre del Mestre, 261111).
    // L'apartat del Panell cita el seu nombre, en lletra en cada llengua, i el `titol` de cadascuna tal com el pinta
    // la targeta. Si el registre en guanya o en perd una, la crònica ja no diu la veritat i esta prova es posa roja.
    const enProves = PLUGINS.filter((plugin) => plugin.estat === ESTAT_PROVES);
    expect(enProves.length).toBeGreaterThan(0);
    const NOMBRES = {
      ca: ['cap', 'una', 'dues', 'tres', 'quatre', 'cinc', 'sis', 'set', 'huit', 'nou'],
      es: ['ninguna', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'],
      en: ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
      eu: ['ez', 'bat', 'bi', 'hiru', 'lau', 'bost', 'sei', 'zazpi', 'zortzi', 'bederatzi'],
      gl: ['ningunha', 'unha', 'dúas', 'tres', 'catro', 'cinco', 'seis', 'sete', 'oito', 'nove']
    };
    expect(text(fitaR18)).toContain(`${ARBRES_MONUMENTALS_2020.length} arbres i conjunts arboris`);
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      const pla = text(bloc);
      const panell = apartats(bloc).find((a) => a.cos.includes(TEXTOS_BETA_OBERTA[llengua]));
      expect([llengua, panell === undefined]).toEqual([llengua, false]);
      const plaPanell = text(panell.cos);
      const nombre = NOMBRES[llengua][enProves.length];
      expect([llengua, nombre, new RegExp(`(?:^|[\\s>])${nombre}(?=[\\s:,.<]|$)`, 'u').test(panell.cos)]).toEqual([llengua, nombre, true]);
      expect([llengua, enProves.map((plugin) => plugin.titol).filter((titol) => !plaPanell.includes(titol))]).toEqual([llengua, []]);
      // Cap eina fora del registre en proves. P0-114 (ordre del Mestre, 261111): L'Avisador torna al Panell en proves
      // i, per tant, l'apartat el nomena (els títols es comproven dalt, derivats del registre). R19 · T3 (ordre del Mestre,
      // 261111; pla 261111_1720): l'Arbre Genealògic s'encén i hi entra, i la prova es deriva del registre en lloc
      // de nomenar-lo. DEROGAT «l'Arbre Genealògic (en obres)» (/Arbre Genealògic/ absent de l'apartat).
      const fora = PLUGINS.filter((plugin) => plugin.estat !== ESTAT_PROVES).map((plugin) => plugin.titol);
      expect(fora.length).toBeGreaterThan(0);
      expect([llengua, fora.filter((titol) => plaPanell.includes(titol))]).toEqual([llengua, []]);
      expect([llengua, plaPanell.includes('Arbre Genealògic')]).toEqual([llengua, enProves.some((plugin) => plugin.id === 'genealogia')]);
      expect([llengua, pla.includes(String(ARBRES_MONUMENTALS_2020.length))]).toEqual([llengua, true]);
      expect([llengua, pla.includes(TEXTOS_BETA_OBERTA[llengua])]).toEqual([llengua, true]);
      expect([llengua, pla.includes('L’Avisador')]).toEqual([llengua, true]);
      expect([llengua, /Darwin Core|JSON-LD|GeoJSON|BibTeX|\b22\b|avisador de drets|per defecte|càrrega diferida|carga diferida|lazy/i.test(pla)]).toEqual([llengua, false]);
    }
  });

  test('arbitratge R18.3 · L’Avisador porta la seua limitació (112) i la seua pàgina, i cap «paquet de dades»', () => {
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      // P1-c · L'Avisador mai sense la seua limitació: només amb la sessió oberta, l'app en marxa i el Xat disponible,
      // i no substituïx el 112 (textosAvisador.js, `limitacions`); l'apartat porta a la pàgina amb les condicions.
      const avisador = apartats(bloc).find((a) => a.titol.includes('L’Avisador'));
      expect([llengua, avisador?.cos.includes('<strong>112</strong>')]).toEqual([llengua, true]);
      // La condició és el nucli de l'honestedat: només avisa amb la sessió oberta (textosAvisador.js, `limitacions`).
      const CONDICIO = { ca: 'només amb la sessió oberta', es: 'solo con la sesión abierta', en: 'only while the session is open', eu: 'saioa irekita', gl: 'só coa sesión aberta' };
      expect([llengua, avisador?.cos.includes(CONDICIO[llengua])]).toEqual([llengua, true]);
      expect([llengua, avisador?.cos.includes('href="/page/avisador"')]).toEqual([llengua, true]);
      expect(rutaExistix('/page/avisador')).toBe(true);
      // P2-e · Cap «paquet de dades»: importacioPaquetMunicipal és una capacitat absent (INVENTARI_CONTRACTE.absents).
      expect([llengua, /paquets? de dades|paquetes de datos|data packages|datu-pakete/i.test(text(bloc))]).toEqual([llengua, false]);
    }
  });

  /* R19 · Arbitratge del carril Genealogia + Perfil (P1) · «hui el porten set» és el nombre de la web pròpia: el
     paquet de l'amfitrió no porta mai la Gestoria, Salut ni l'Arbre Genealògic, i el registre els lleva la insígnia en
     eixe build (registrePlugins.test.js ho prova amb VITE_SDP_APP_<ID>=0). L'apartat ho diu en les cinc llengües. */
  test('arbitratge R19 · el nombre d’eines en proves és el de la web pròpia de Sóc de Poble', () => {
    const WEB_PROPIA = {
      ca: 'a la web pròpia de Sóc de Poble', es: 'en la web propia de Sóc de Poble', en: 'on Sóc de Poble’s own website',
      eu: 'Sóc de Pobleren berezko webgunean', gl: 'na web propia de Sóc de Poble'
    };
    for (const llengua of LLENGUES) {
      const panell = apartats(blocEn(llengua)).find((a) => a.cos.includes(TEXTOS_BETA_OBERTA[llengua]));
      expect([llengua, text(panell.cos).includes(WEB_PROPIA[llengua])]).toEqual([llengua, true]);
    }
  });
});

/* R19 · Arbitratge del carril Genealogia + Perfil (P1, tractor-promesa) · El dossier dels nodes (fedivers, fediversity i
   node-zero) conta en present com s'omple l'Arbre Genealògic. Mentre l'app porte l'entrada d'intercanvi i la
   importació d'un GEDCOM o d'una còpia (apps/genealogia: manifest.js, entrada 'intercanvi'; textos.js, 'importa.fitxer'),
   cap llengua no pot dir que només s'omple amb el teclat, i totes diuen la importació. La frase del dictat que vigila
   pageContent.r9.test.js no canvia. DEROGAT «l'Arbre Genealògic, en proves, només s'omple amb el teclat». */
describe('R19 · el dossier dels nodes no nega la importació GEDCOM de l’Arbre Genealògic', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const NOMES_TECLAT = /només s’omple amb el teclat|solo se rellena con el teclado|can only be filled in from the keyboard|teklatuarekin bakarrik betetzen|só se enche co teclado/;
  const IMPORTACIO = {
    ca: 'important un fitxer GEDCOM', es: 'importando un fichero GEDCOM', en: 'by importing a GEDCOM file',
    eu: 'GEDCOM fitxategi bat inportatuz', gl: 'importando un ficheiro GEDCOM'
  };
  test('cap «només amb el teclat», i la importació GEDCOM en les cinc llengües, mentre l’app importa', () => {
    expect(llegix('src/apps/genealogia/manifest.js')).toContain("{ slug: 'intercanvi',");
    expect(llegix('src/apps/genealogia/textos.js')).toContain("'importa.fitxer': 'Fitxer GEDCOM (.ged) o còpia (.json)'");
    for (const clau of ['fedivers', 'fediversity', 'node-zero']) {
      for (const llengua of LLENGUES) {
        const pla = text(localitzaPagina(PAGE_COPY[clau], llengua).html);
        expect([clau, llengua, NOMES_TECLAT.test(pla)]).toEqual([clau, llengua, false]);
        expect([clau, llengua, pla.includes(IMPORTACIO[llengua])]).toEqual([clau, llengua, true]);
      }
    }
  });
});

describe('R19 · /versions conserva la crònica de l’Onada R19 en les cinc llengües davant de R18', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const PREFIXOS = {
    ca: ['Novetat', 'Novetat', 'Millora'],
    es: ['Novedad', 'Novedad', 'Mejora'],
    en: ['New', 'New', 'Improvement'],
    eu: ['Berritasuna', 'Berritasuna', 'Hobekuntza'],
    gl: ['Novidade', 'Novidade', 'Mellora']
  };
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = cos.indexOf(`<h3>${INICIS_R19[llengua]}`);
    expect([llengua, inici > 0]).toEqual([llengua, true]);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 1));
  };

  test('va darrere de R20 i davant de R18 en les cinc llengües, sense número vX.Y.Z, amb rutes vives, densitat de negretes i regla 2.3.10', () => {
    expect(TITOL_FITA_R19).not.toMatch(/ · v\d+\.\d+\.\d+/);
    for (const llengua of LLENGUES) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      const inici = cos.indexOf(`<h3>${INICIS_R19[llengua]}`);
      const bloc = blocEn(llengua);
      expect([llengua, cos.startsWith(`<h3>${INICIS_R18[llengua]}`, inici + bloc.length)]).toEqual([llengua, true]);
      expect([llengua, bloc]).toEqual([llengua, expect.stringMatching(/^<h3>[^<]+<\/h3>\n {6}<p>/)]);
      expect([llengua, titolsH4(bloc).map((t) => t.split(' · ')[0])]).toEqual([llengua, PREFIXOS[llengua]]);
      expect([llengua, bloc.endsWith('</p>\n\n      ')]).toEqual([llengua, true]);
      const enllacos = [...bloc.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
      expect([llengua, enllacos]).toEqual([llengua, [
        '<a href="/disseny">',
        '<a href="/page/herbari">',
        '<a href="/page/banc-de-llavors">',
        '<a href="/page/node-zero">',
        '<a href="/disseny">',
        '<a href="/page/fediversity">'
      ]]);
      expect([llengua, bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g)]).toEqual([llengua, null]);
      const pla = text(bloc);
      expect([llengua, PLATAFORMA_ALIENA.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /Google|Apple|App Store|iPhone|iPad|TestFlight/.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /\bdesplegad[ae]s?\b|en producció|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a/i.test(pla)]).toEqual([llengua, false]);
      expect([llengua, pla.includes('Sóc de Poble')]).toEqual([llengua, true]);
      expect([llengua, pla.includes('Z-Image-Turbo-mflux-4bit')]).toEqual([llengua, true]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect([llengua, paragrafsDelBloc.length]).toEqual([llengua, 4]);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
    }
    for (const ruta of interns(fitaR19)) expect(rutaExistix(ruta), ruta).toBe(true);
  });
});

describe('R20 · /versions conserva la crònica de l’Onada R20 en les cinc llengües, darrere de R21 i davant de R19', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const PREFIXOS = {
    ca: ['Novetat', 'Novetat', 'Millora'],
    es: ['Novedad', 'Novedad', 'Mejora'],
    en: ['New', 'New', 'Improvement'],
    eu: ['Berritasuna', 'Berritasuna', 'Hobekuntza'],
    gl: ['Novidade', 'Novidade', 'Mellora']
  };
  /* Onada R21 · La crònica R20 ja no és la primera: es busca pel seu títol en cada llengua, i va just darrere de R21. */
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = cos.indexOf(`<h3>${INICIS_R20[llengua]}`);
    expect([llengua, inici > 0]).toEqual([llengua, true]);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 1));
  };

  test('va darrere de R21 i davant de R19 en les cinc llengües, sense número vX.Y.Z, amb rutes vives, densitat de negretes i regla 2.3.10', () => {
    expect(TITOL_FITA_R20).not.toMatch(/ · v\d+\.\d+\.\d+/);
    for (const llengua of LLENGUES) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      const bloc = blocEn(llengua);
      const inici = cos.indexOf(`<h3>${INICIS_R20[llengua]}`);
      // Onada R21 (COMMIT 5) · La C5 obri la pàgina; la R21 la seguix i acaba just on comença la R20.
      const iniciR21 = cos.indexOf(`<h3>${INICIS_R21[llengua]}`);
      const fiR21 = cos.indexOf('<h3>', iniciR21 + 1);
      expect([llengua, cos.startsWith(`<h3>${INICIS_R21_C5[llengua]}`), iniciR21 > 0, fiR21 === inici, cos.startsWith(`<h3>${INICIS_R19[llengua]}`, inici + bloc.length)]).toEqual([llengua, true, true, true, true]);
      expect([llengua, bloc]).toEqual([llengua, expect.stringMatching(/^<h3>[^<]+<\/h3>\n {6}<p>/)]);
      expect([llengua, titolsH4(bloc).map((t) => t.split(' · ')[0])]).toEqual([llengua, PREFIXOS[llengua]]);
      expect([llengua, bloc.endsWith('</p>\n\n      ')]).toEqual([llengua, true]);
      const enllacos = [...bloc.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
      expect([llengua, enllacos]).toEqual([llengua, [
        '<a href="/notes">',
        '<a href="/mur">',
        '<a href="/disseny">',
        '<a href="/page/herbari">',
        '<a href="/page/banc-de-llavors">',
        '<a href="/page/node-zero">',
        '<a href="/page/fediversity">',
        '<a href="/el-meu-perfil">',
        '<a href="/control">'
      ]]);
      expect([llengua, bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g)]).toEqual([llengua, null]);
      const pla = text(bloc);
      expect([llengua, PLATAFORMA_ALIENA.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /Google|Apple|App Store|iPhone|iPad|TestFlight/.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /\bdesplegad[ae]s?\b|en producció|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a|sobir/i.test(pla)]).toEqual([llengua, false]);
      expect([llengua, pla.includes('Sóc de Poble')]).toEqual([llengua, true]);
      expect([llengua, pla.includes(SENSE_IMATGES_R20[llengua])]).toEqual([llengua, VARIANTS_BOTANIQUES_ACTIVES === 0]);
      expect([llengua, VENDA_FOTOGRAFIA_R20.test(pla)]).toEqual([llengua, false]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect([llengua, paragrafsDelBloc.length]).toEqual([llengua, 4]);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
    }
    for (const ruta of interns(fitaR20)) expect(rutaExistix(ruta), ruta).toBe(true);
  });
});

/* Onada R21 (COMMIT 3; v1.2.0 · build 4 · WP 1.1.13) · La fita R21 obri /versions en les cinc llengües, davant de la
   crònica R20: tres paràgrafs d'obertura (la versió, els commits que reunix i la numeració) i cinc apartats, de
   Novetat a Correcció.
   És història del 12-11-2026 i es fixa literal, com les fites R16 a R20: la versió, el build, el connector del
   repositori, els commits, les migracions i els noms de cada llengua no es deriven del codi d'ara, que continuarà
   canviant. Del repositori només es lligen els fitxers que ja no canvien (les migracions segellades). I cap promesa
   per damunt del que hi ha: les tres migracions noves no s'han aplicat al servidor, la política 2.6 no s'ha publicat,
   el kit R21.1 no hi és i la capçalera diu la versió del connector publicada a WordPress.org, no la del repositori. */
describe('R21 · /versions porta la fita R21, la de la versió 1.2.0, darrere de la fita R21 C5, en les cinc llengües', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const PREFIXOS = {
    ca: ['Novetat', 'Novetat', 'Novetat', 'Millora', 'Correcció'],
    es: ['Novedad', 'Novedad', 'Novedad', 'Mejora', 'Corrección'],
    en: ['New', 'New', 'New', 'Improvement', 'Fix'],
    eu: ['Berritasuna', 'Berritasuna', 'Berritasuna', 'Hobekuntza', 'Zuzenketa'],
    gl: ['Novidade', 'Novidade', 'Novidade', 'Mellora', 'Corrección']
  };
  const VERSIO_R21 = '1.2.0';
  const CONNECTOR_R21 = '1.1.13';
  const BUILD_R21 = {
    ca: 'número de build 4', es: 'número de build 4', en: 'build number 4', eu: 'build zenbakia 4 da', gl: 'número de build 4'
  };
  const COMMITS_R21 = ['cd0b3a4ef', '2bd56146a', '776f77186'];
  const MIGRACIONS_R21 = ['2611121630', '2611121700', '2611121830'];
  /* Les frases que diuen que res d'açò no és al servidor ni publicat, literals de cada llengua. */
  const SENSE_APLICAR = {
    ca: ['que encara no s’hi ha aplicat', 'la purga de les dades del servidor espera la migració 2611121700', 'Encara no s’ha aplicat al servidor', 'la 2.6 encara no s’ha publicat: l’app continua mostrant la 2.5', 'El kit R21.1', 'no hi és'],
    es: ['que todavía no se ha aplicado', 'la purga de los datos del servidor espera la migración 2611121700', 'Todavía no se ha aplicado en el servidor', 'la 2.6 todavía no se ha publicado: la app sigue mostrando la 2.5', 'El kit R21.1', 'no está incluido'],
    en: ['which has not been applied yet', 'purging the server data awaits migration 2611121700', 'It has not been applied on the server yet', '2.6 has not been published yet: the app still shows 2.5', 'Kit R21.1', 'is not included'],
    eu: ['oraindik aplikatu ez dena', 'zerbitzariko datuen garbiketa 2611121700 migrazioaren zain dago', 'Oraindik ez da aplikatu zerbitzarian', '2.6 ez da oraindik argitaratu: aplikazioak 2.5 erakusten jarraitzen du', 'R21.1 kita', 'ez dago barne'],
    gl: ['que aínda non se aplicou', 'a purga dos datos do servidor agarda pola migración 2611121700', 'Aínda non se aplicou no servidor', 'a 2.6 aínda non se publicou: a app segue amosando a 2.5', 'O kit R21.1', 'non está incluído']
  };
  /* La fila pròpia i el botó retirat, amb el nom que tenien en cada llengua el 12-11-2026. */
  const PROPI_R21 = { ca: '«(Tu)»', es: '«(Tú)»', en: '“(You)”', eu: '«(Zu)»', gl: '«(Ti)»' };
  const RETIRAT_R21 = { ca: '«Pregunta a la IAIA»', es: '«Pregunta a la IAIA»', en: '“Ask IAIA”', eu: '«Galdetu IAIAri»', gl: '«Pregunta á IAIA»' };
  const NOU_CLAUS = { ca: 'nou claus', es: 'nueve claves', en: 'nine keys', eu: 'bederatzi gakoak', gl: 'nove claves' };
  /* Onada R21 (COMMIT 5) · La fita R21 ja no és la primera: va just darrere de la fita R21 C5 i es busca pel seu
     títol en cada llengua. */
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = cos.indexOf(`<h3>${INICIS_R21[llengua]}`);
    expect([llengua, inici > 0]).toEqual([llengua, true]);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 1));
  };

  test('va darrere de la fita R21 C5 i davant de R20, sense número vX.Y.Z, amb tres paràgrafs d’obertura, cinc apartats, rutes vives, densitat de negretes i regla 2.3.10', () => {
    expect(TITOL_FITA_R21).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(fitaR21.startsWith(`<h3>${TITOL_FITA_R21}</h3>`)).toBe(true);
    for (const llengua of LLENGUES) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      const bloc = blocEn(llengua);
      const inici = cos.indexOf(bloc);
      const blocC5 = cos.slice(0, cos.indexOf('<h3>', 1));
      expect([llengua, cos.startsWith(`<h3>${INICIS_R21_C5[llengua]}`), inici === blocC5.length, cos.startsWith(`<h3>${INICIS_R20[llengua]}`, inici + bloc.length)]).toEqual([llengua, true, true, true]);
      expect([llengua, bloc]).toEqual([llengua, expect.stringMatching(/^<h3>[^<]+<\/h3>\n {6}<p>[\s\S]*?<\/p>\n {6}<p>[\s\S]*?<\/p>\n {6}<p>[\s\S]*?<\/p>\n {6}<h4>/)]);
      expect([llengua, titolsH4(bloc).map((t) => t.split(' · ')[0])]).toEqual([llengua, PREFIXOS[llengua]]);
      expect([llengua, apartats(bloc).length]).toEqual([llengua, 5]);
      expect([llengua, bloc.endsWith('</p>\n\n      ')]).toEqual([llengua, true]);
      const enllacos = [...bloc.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
      expect([llengua, enllacos]).toEqual([llengua, ['<a href="/xat">', '<a href="/notes">', '<a href="/page/fediversity">', '<a href="/mur">']]);
      expect([llengua, bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g)]).toEqual([llengua, null]);
      const pla = text(bloc);
      expect([llengua, PLATAFORMA_ALIENA.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /Google|Apple|App Store|iPhone|iPad|TestFlight/.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a|sobir/i.test(pla)]).toEqual([llengua, false]);
      // Marca: «de poble»; cap «del poble», que només val per a un municipi concret.
      expect([llengua, /\bdel poble\b/i.test(pla)]).toEqual([llengua, false]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect([llengua, paragrafsDelBloc.length]).toEqual([llengua, 8]);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
    for (const ruta of interns(fitaR21)) expect(rutaExistix(ruta), ruta).toBe(true);
  });

  test('la versió 1.2.0, el build 4 i el connector 1.1.13 del repositori, literals; la capçalera diu el connector publicat', () => {
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      const obertura = text(bloc.match(/<\/h3>\n {6}<p>([\s\S]*?)<\/p>/)[1]);
      expect([llengua, bloc.match(/^<h3>([^<]+)<\/h3>/)[1].includes(VERSIO_R21)]).toEqual([llengua, true]);
      expect([llengua, obertura.includes(VERSIO_R21), obertura.includes(BUILD_R21[llengua]), obertura.includes(CONNECTOR_R21), obertura.includes('WordPress.org')])
        .toEqual([llengua, true, true, true, true]);
    }
    // El repositori no pot anar per darrere del que conta la fita, i la capçalera no diu cap connector sense publicar.
    expect(noMesNova(VERSIO_R21, PAQUET.version), `${VERSIO_R21} ≤ ${PAQUET.version}`).toBe(true);
    expect(noMesNova(CONNECTOR_R21, CONNECTOR), `${CONNECTOR_R21} ≤ ${CONNECTOR}`).toBe(true);
    expect(PAGE_COPY.versions.subtitle).toBe(`Versió actual: v${PAQUET.version} · Connector WordPress v${CONNECTOR_PUBLICAT} a WordPress.org`);
  });

  test('el subtítol de les altres quatre llengües diu la mateixa versió actual i el mateix connector publicat que el valencià', () => {
    const SUBTITOLS = {
      es: `Versión actual: v${PAQUET.version} · Conector WordPress v${CONNECTOR_PUBLICAT} en WordPress.org`,
      en: `Current version: v${PAQUET.version} · WordPress plugin v${CONNECTOR_PUBLICAT} on WordPress.org`,
      eu: `Uneko bertsioa: v${PAQUET.version} · WordPress konektorea v${CONNECTOR_PUBLICAT} WordPress.org-en`,
      gl: `Versión actual: v${PAQUET.version} · Conector WordPress v${CONNECTOR_PUBLICAT} en WordPress.org`
    };
    for (const [llengua, esperat] of Object.entries(SUBTITOLS)) {
      const { subtitle } = localitzaPagina(PAGE_COPY.versions, llengua);
      expect([llengua, subtitle]).toEqual([llengua, esperat]);
      expect([llengua, /build|\b\d{6}\b/i.test(subtitle)]).toEqual([llengua, false]);
    }
  });

  test('els commits i els kits que reunix, i el kit R21.1, que no hi és', () => {
    for (const llengua of LLENGUES) {
      const commits = blocEn(llengua).match(/<\/h3>\n {6}<p>[\s\S]*?<\/p>\n {6}<p>([\s\S]*?)<\/p>/)[1];
      expect([llengua, COMMITS_R21.filter((c) => !commits.includes(`<code>${c}</code>`))]).toEqual([llengua, []]);
      expect([llengua, commits.includes('R21.2'), commits.includes('R21.6'), commits.includes('R21.1')]).toEqual([llengua, true, true, true]);
    }
  });

  test('cap promesa per damunt del que hi ha: les tres migracions existixen, el text diu que no s’han aplicat, i la frontera és de nou claus', () => {
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    for (const id of MIGRACIONS_R21) expect([id, migracions.filter((nom) => nom.startsWith(`${id}_`)).length]).toEqual([id, 1]);
    // La frontera es llig de la migració segellada: les nou claus de la política de lectura pública.
    const frontera = llegix(`supabase/migrations/${migracions.find((nom) => nom.startsWith('2611121830_'))}`);
    const claus = /create policy "app_content lectura publica"[\s\S]*?using \(key in \(([^)]*)\)\)/.exec(frontera)?.[1].split(',') ?? [];
    expect(claus).toHaveLength(9);
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      const pla = text(bloc);
      expect([llengua, MIGRACIONS_R21.filter((id) => !bloc.includes(`<code>${id}</code>`))]).toEqual([llengua, []]);
      expect([llengua, SENSE_APLICAR[llengua].filter((frase) => !pla.includes(frase))]).toEqual([llengua, []]);
      expect([llengua, pla.includes(NOU_CLAUS[llengua])]).toEqual([llengua, true]);
    }
  });

  /* Gauntlet T3 (P1) · L'entrada del 5 de novembre porta l'etiqueta «v1.2.0 · suplement pendent d’integració» en
     valencià i «v1.2.1 · …» en les altres llengües. La història no es reescriu: el tercer paràgraf diu que era un
     suplement editorial i no una versió, i que la numeració passa de la 1.1.12 (R16) a la 1.2.0. L'etiqueta citada ha
     de ser la que porta de veres el títol d'aquella entrada en cada llengua. */
  const NUMERACIO_R21 = {
    ca: { etiqueta: 'v1.2.0 · suplement pendent d’integració', frases: ['L’etiqueta «v1.2.0 · suplement pendent d’integració» de l’entrada del 5 de novembre', 'era el nom d’un suplement editorial, no una versió de la web ni de les apps', 'la numeració passa ara de la 1.1.12 a la 1.2.0'] },
    es: { etiqueta: 'v1.2.1', frases: ['La etiqueta «v1.2.1» de la entrada del 5 de noviembre', 'era el nombre de un suplemento editorial, no una versión de la web ni de las apps', 'la numeración pasa ahora de la 1.1.12 a la 1.2.0'] },
    en: { etiqueta: 'v1.2.1', frases: ['The “v1.2.1” label on the 5 November entry', 'was the name of an editorial supplement, not a version of the web or the apps', 'the numbering now goes from 1.1.12 to 1.2.0'] },
    eu: { etiqueta: 'v1.2.1', frases: ['Azaroaren 5eko sarrerako «v1.2.1» etiketa', 'gehigarri editorial baten izena zen, ez webgunearen ez aplikazioen bertsio bat', 'zenbakiketa 1.1.12 bertsiotik 1.2.0 bertsiora igarotzen da orain'] },
    gl: { etiqueta: 'v1.2.1', frases: ['A etiqueta «v1.2.1» da entrada do 5 de novembro', 'era o nome dun suplemento editorial, non unha versión da web nin das apps', 'a numeración pasa agora da 1.1.12 á 1.2.0'] }
  };
  const DATA_5_NOVEMBRE = { ca: '5 de novembre de 2026', es: '5 de noviembre de 2026', en: '5 November 2026', eu: '2026ko azaroaren 5a', gl: '5 de novembro de 2026' };

  test('la numeració: el tercer paràgraf diu que l’etiqueta del 5 de novembre era un suplement editorial, no una versió', () => {
    for (const llengua of LLENGUES) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html;
      const numeracio = text(blocEn(llengua).match(/<\/h3>\n {6}<p>[\s\S]*?<\/p>\n {6}<p>[\s\S]*?<\/p>\n {6}<p>([\s\S]*?)<\/p>/)[1]);
      const { etiqueta, frases } = NUMERACIO_R21[llengua];
      expect([llengua, frases.filter((frase) => !numeracio.includes(frase))]).toEqual([llengua, []]);
      // L'etiqueta citada és la del títol real de l'entrada del 5 de novembre en esta llengua.
      expect([llengua, cos.includes(`<h3>${DATA_5_NOVEMBRE[llengua]} · ${etiqueta}`)]).toEqual([llengua, true]);
    }
  });

  /* Gauntlet T3 (P1) · La barra negra a 359 px: la regla @container usa --sdp-touch-min, que val 48 px («48px sempre»),
     i cap prova no n'ha mesurat la geometria en un navegador. La fita no diu cap mida en píxels dels botons ni promet
     que la barra no es desborde: diu que els botons no baixen del mínim tàctil. */
  const MINIM_TACTIL_R21 = { ca: 'mínim tàctil', es: 'mínimo táctil', en: 'minimum touch size', eu: 'gutxieneko ukipen-neurritik', gl: 'mínimo táctil' };

  test('la barra negra estreta: cap mida en píxels dels botons ni cap promesa de no desbordar-se, i el mínim tàctil', () => {
    for (const llengua of LLENGUES) {
      const pla = text(blocEn(llengua));
      expect([llengua, /\b4[48]\b/.test(pla), /desbord|overflow|gainezka/i.test(pla), pla.includes(MINIM_TACTIL_R21[llengua])])
        .toEqual([llengua, false, false, true]);
    }
  });

  test('el xat propi, la IAIA en una sola fila i el botó retirat, amb el nom de cada llengua', () => {
    for (const llengua of LLENGUES) {
      const { titol, cos } = apartats(blocEn(llengua))[0];
      const pla = text(cos);
      expect([llengua, titol.startsWith(`${PREFIXOS[llengua][0]} · `)]).toEqual([llengua, true]);
      expect([llengua, pla.includes(PROPI_R21[llengua]), pla.includes(RETIRAT_R21[llengua]), pla.includes('IAIA MarIA')]).toEqual([llengua, true, true, true]);
      expect([llengua, [...cos.matchAll(/href="([^"]+)"/g)].map((m) => m[1])]).toEqual([llengua, ['/xat']]);
    }
  });
});

/* Onada R21 (COMMIT 5; v1.2.0 · build 5 · WP 1.1.14) · La fita R21 C5 obri /versions en les cinc llengües, davant de la
   fita R21: dos paràgrafs d'obertura (la versió i el build; els kits que reunix i el que encara no és al servidor) i sis
   apartats, de Novetat a Correcció.
   És història del 13-11-2026 i es fixa literal, com les fites R16 a R21: la versió, el build, el connector del
   repositori, els kits, les migracions i els noms de cada llengua no es deriven del codi d'ara, que continuarà
   canviant. Del repositori es lligen només els fets que el text no pot contradir: les migracions segellades, la bandera
   del Mur filtrat, la porta de la co-publicació i el nom del menú de la negreta de cada diccionari. Cap promesa per
   damunt del que hi ha: cap migració s'ha aplicat al servidor, la co-publicació registrada continua apagada, cap tasca
   programada no corre, i la capçalera diu la versió del connector publicada a WordPress.org, no la del repositori.
   Marca «de poble»: cap «del poble» (ni «del pueblo» ni «do pobo»), que només val per a un poble concret.
   Onada R22 (Gauntlet 5 sobre el COMMIT 5) · Quatre guardes més, cadascuna lligada al codi que la justifica i escrita
   perquè obligue a tornar a escriure el text si el codi canvia:
   · honestedat-03 · El text diu sencera la dependència del Mur, el Mercat, el Calendari i Multimèdia (loadMur i
     loadMultimedia) de les migracions 2611121430 i 2611122200, no com una part del Mur. Què fan sense elles ho diu la
     segona ronda (dades-01, més avall): lligPublicacions baixa a la lectura d'abans i les quatre es lligen com abans.
   · honestedat-04 · La recuperació dels trossos vells és de la web pròpia (main.jsx): ni el paquet del connector
     (embed.jsx, host.js) ni l'app nativa (motiuPerNoRegistrar torna 'nativa') no la porten. Mentre el worker no espere
     el seu statechange (pwa-03), el text no diu que el service worker es posa al dia.
   · honestedat-07 · Arbres i receptes continuen en dos espais (dos CatalegWorkspace amb id propi) i la graella de
     catàlegs municipals en té un (LLIBRES_ARBRES_MONUMENTALS): cap espai «unificat» ni cap prestatgeria «multipoble».
   · honestedat-09 · La correcció dels 404 es comprova pel comportament de fallbackBessones.js, no per un nom que ja hi
     era al COMMIT 4.
   Onada R22, segona ronda (carril text2) · Amb les correccions dels altres carrils integrades, quatre frases ja no eren
   certes i s'han tornat a escriure, cadascuna amb la guarda que la lliga al codi (simètrica: si el codi canvia, la
   frase ha de canviar):
   · dades-01 · lligPublicacions baixa a la lectura d'abans (lligPublicacionsAnteriors, section_submissions) davant
     d'un 404 PGRST202: sense cap migració, les quatre seccions es lligen com abans, sense la lectura mínima. Sense
     2611122200, el Bloc de Notes no publica res al Mur i ho diu (CODI_ESQUEMA_ABSENT → motiuPublicacioNoFeta). La
     guarda d'abans buscava `async function lligPublicacions` sense el parèntesi i trobava lligPublicacionsAnteriors.
   · dades-06 i honestedat-06 · La còpia pública porta el bloc EXIF que la casella de l'editor ha deixat conservar.
   · sql-03, notes-01 i honestedat-02 · Bloquejar i Denunciar des d'una publicació guarden una fila opaca o un autor
     null per a qui no és membre del poble (private.mur_lector_ric).
   · xat-01 i xat-09 · El visor es pinta amb un portal per damunt de les barres, i les cares dels grups prenen la foto
     del padró del fil o, sense, les inicials.
   · pwa-01 · La recuperació, provada pel comportament: com a molt una recàrrega per build retirat i cap després d'una
     entrada de la persona; l'avís de la secció és el de RouteErrorBoundary. */
describe('R21 C5 · /versions s’obri amb la fita R21 C5, la del build 5, en les cinc llengües', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  const PREFIXOS = {
    ca: ['Novetat', 'Novetat', 'Novetat', 'Novetat', 'Millora', 'Correcció'],
    es: ['Novedad', 'Novedad', 'Novedad', 'Novedad', 'Mejora', 'Corrección'],
    en: ['New', 'New', 'New', 'New', 'Improvement', 'Fix'],
    eu: ['Berritasuna', 'Berritasuna', 'Berritasuna', 'Berritasuna', 'Hobekuntza', 'Zuzenketa'],
    gl: ['Novidade', 'Novidade', 'Novidade', 'Novidade', 'Mellora', 'Corrección']
  };
  const VERSIO_C5 = '1.2.0';
  const BUILD_C5 = 5;
  const CONNECTOR_C5 = '1.1.14';
  const FRASE_BUILD_C5 = {
    ca: 'número de build 5', es: 'número de build 5', en: 'build number 5', eu: 'build zenbakia 5 da', gl: 'número de build 5'
  };
  const KITS_C5 = ['R21.1', 'R21.7', 'R21.10', 'R21.9b'];
  const MIGRACIONS_MUR_C5 = ['2611121430', '2611121850', '2611122200'];
  const MIGRACIO_BETA_C5 = '20261113003000';
  /* Les frases que diuen que res d'açò no és al servidor ni encés, literals de cada llengua. */
  const SENSE_APLICAR_C5 = {
    ca: ['Les migracions noves encara no s’han aplicat al servidor', 'la co-publicació registrada entre entitats continua apagada', 'que encara no s’han aplicat al servidor', 'encara no s’ha aplicat', 'sense cap tasca programada en marxa'],
    es: ['Las migraciones nuevas todavía no se han aplicado en el servidor', 'la copublicación registrada entre entidades sigue apagada', 'que todavía no se han aplicado en el servidor', 'todavía no se ha aplicado', 'sin ninguna tarea programada en marcha'],
    en: ['The new migrations have not been applied on the server yet', 'registered co-publishing between entities stays switched off', 'which have not been applied on the server yet', 'it has not been applied yet', 'with no scheduled task running'],
    eu: ['Migrazio berriak oraindik ez dira aplikatu zerbitzarian', 'erakundeen arteko ko-argitalpen erregistratua itzalita dago', 'horiek oraindik ez dira aplikatu zerbitzarian', 'oraindik ez da aplikatu', 'programatutako atazarik martxan jarri gabe'],
    gl: ['As migracións novas aínda non se aplicaron no servidor', 'a copublicación rexistrada entre entidades segue apagada', 'que aínda non se aplicaron no servidor', 'aínda non se aplicou', 'sen ningunha tarefa programada en marcha']
  };
  const COMETES = { ca: ['«', '»'], es: ['«', '»'], en: ['“', '”'], eu: ['«', '»'], gl: ['«', '»'] };
  /* Les frases de la dependència del Mur (dades-01) i de les metadades de les còpies públiques (dades-06,
     honestedat-06) viuen amb les seues proves de comportament a src/data/supabase/versionsC5.comportament.test.js. */
  /* Onada R22, segona ronda (sql-03, notes-01, honestedat-02) · Denunciar i Bloquejar, sense revelar l'autor a qui no
     és membre d'este poble. */
  const MODERACIO_C5 = {
    ca: 'Denunciar i Bloquejar des d’una publicació no revelen l’autor a qui no és membre d’este poble',
    es: 'Denunciar y Bloquear desde una publicación no revelan el autor a quien no es miembro de este pueblo',
    en: 'Report and Block from a post do not reveal the author to people who are not members of this village',
    eu: 'Argitalpen batetik, Salatu eta Blokeatu aukerek ez diote egilea erakusten herri honetako kide ez denari',
    gl: 'Denunciar e Bloquear desde unha publicación non revelan o autor a quen non é membro deste pobo'
  };
  /* Onada R22, segona ronda (xat-01, xat-09) · El visor per damunt de les barres, i la cara amb foto o inicials. */
  const XAT_C5 = {
    ca: ['visor de galeria per damunt de les barres i del menú lateral, amb zoom i miniatures', 'cara de qui escriu, amb la foto que porta la conversa o, si no n’hi ha, amb les inicials'],
    es: ['visor de galería por encima de las barras y del menú lateral, con zoom y miniaturas', 'cara de quien escribe, con la foto que lleva la conversación o, si no la hay, con las iniciales'],
    en: ['gallery viewer above the bars and the side menu, with zoom and thumbnails', 'face of the writer, with the photo the conversation carries or, if there is none, their initials'],
    eu: ['galeria-ikustailean irekitzen da, barren eta alboko menuaren gainean', 'idazten duenaren aurpegia erakusten dute, elkarrizketak daraman argazkiarekin edo, argazkirik ez badago, inizialekin'],
    gl: ['visor de galería por riba das barras e do menú lateral, con zoom e miniaturas', 'cara de quen escribe, coa foto que leva a conversa ou, se non a hai, coas iniciais']
  };
  /* Onada R22, segona ronda (pwa-01) · Com a molt una vegada, sense bucles; i res després d'una entrada de la persona. */
  const UNA_VEGADA_C5 = {
    ca: 'com a molt una vegada, sense bucles', es: 'como mucho una vez, sin bucles', en: 'at most once, without loops',
    eu: 'gehienez behin, begiztarik gabe', gl: 'como moito unha vez, sen bucles'
  };
  /* Tercera ronda (regressió del crític, pwa-01 parcial) · El veto només el donen les entrades
     (ENTRADES_AMB_ESTAT_EN_MEMORIA); un toc sol (les preguntes suggerides de la IAIA, una emoticona del calaix) no deixa
     cap entrada ni cap camp amb valor, la pàgina es recarrega i eixe estat es pot perdre. El text ja no diu «no
     s'esborra res» ni compta «triar» com si fora qualsevol tria: diu «en un camp» i diu el límit dels tocs. */
  const VETO_C5 = {
    ca: 'Si la persona ja hi ha escrit, enganxat o deixat anar res, o ha triat res en un camp, la pàgina no es recarrega; el que naix només d’un toc, com una pregunta suggerida de la IAIA o una emoticona triada al calaix, no impedix la recàrrega i s’hi pot perdre. Si el que no ha pogut carregar és una secció, ho diu i avisa que recarregar descarta el que només viu a la memòria.',
    es: 'Si la persona ya ha escrito, pegado o soltado algo, o ha elegido algo en un campo, la página no se recarga; lo que nace solo de un toque, como una pregunta sugerida de la IAIA o un emoticono elegido en el cajón, no impide la recarga y puede perderse con ella. Si lo que no ha podido cargarse es una sección, lo dice y avisa de que recargar descarta lo que solo vive en la memoria.',
    en: 'If the person has already typed, pasted or dropped anything, or picked anything in a field, the page does not reload; what comes from a tap alone, such as one of IAIA’s suggested questions or an emoji picked from the drawer, does not prevent the reload and can be lost with it. If what failed to load is a section, it says so and warns that reloading discards whatever lives only in memory.',
    eu: 'Pertsonak dagoeneko zerbait idatzi, itsatsi edo jaregin badu, edo eremu batean zerbait aukeratu badu, orria ez da birkargatzen; ukitu bakar batetik sortzen dena, hala nola IAIAren galdera iradokietako bat edo tiradetik aukeratutako emotikono bat, ez du birkarga eragozten eta harekin gal daiteke. Kargatu ezin izan dena atal bat bada, hala esaten du eta ohartarazten du birkargatzeak memorian bakarrik dagoena baztertzen duela.',
    gl: 'Se a persoa xa escribiu, pegou ou soltou algo, ou escolleu algo nun campo, a páxina non se recarga; o que nace só dun toque, como unha pregunta suxerida da IAIA ou unha emoticona escollida no caixón, non impide a recarga e pode perderse con ela. Se o que non puido cargar é unha sección, dío e avisa de que recargar descarta o que só vive na memoria.'
  };
  /* La promesa de la segona ronda, en cada llengua: no torna mentre un toc sol no vete la recàrrega. */
  const NO_SESBORRA_RES = /no s’esborra res|no se borra nada|nothing is deleted|ez da ezer ezabatzen|non se borra nada/i;
  /* Onada R22 (honestedat-04) · La recuperació és de la web pròpia; el connector i les apps no la porten. */
  const RECUPERACIO_NOMES_WEB_C5 = {
    ca: ['A la web pròpia de Sóc de Poble', 'El connector de WordPress i les apps no porten esta recuperació.'],
    es: ['En la web propia de Sóc de Poble', 'El conector de WordPress y las apps no llevan esta recuperación.'],
    en: ['On the Sóc de Poble website itself', 'The WordPress plugin and the apps do not carry this recovery.'],
    eu: ['Sóc de Poble-ren webgune propioan', 'WordPress konektoreak eta aplikazioek ez dute berreskurapen hau.'],
    gl: ['Na web propia de Sóc de Poble', 'O conector de WordPress e as apps non levan esta recuperación.']
  };
  /* Onada R22 (honestedat-07) · Cap espai unificat ni cap prestatgeria multipoble, en cap llengua. */
  const UNIFICAT = /unifica|unified|bateratu/i;
  const MULTIPOBLE = /multipob|multi-village|multipueblo|herri anitz/i;
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    expect([llengua, cos.startsWith(`<h3>${INICIS_R21_C5[llengua]}`)]).toEqual([llengua, true]);
    return cos.slice(0, cos.indexOf('<h3>', 1));
  };

  test('obri la pàgina davant de la fita R21, sense número vX.Y.Z, amb dos paràgrafs d’obertura, sis apartats, rutes vives, densitat de negretes, regla 2.3.10 i marca «de poble»', () => {
    expect(TITOL_FITA_R21_C5).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(fitaR21C5.startsWith(`<h3>${TITOL_FITA_R21_C5}</h3>`)).toBe(true);
    for (const llengua of LLENGUES) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      const bloc = blocEn(llengua);
      expect([llengua, cos.startsWith(`<h3>${INICIS_R21[llengua]}`, bloc.length)]).toEqual([llengua, true]);
      expect([llengua, bloc.match(/^<h3>([^<]+)<\/h3>/)[1]]).toEqual([llengua, expect.not.stringMatching(/ · v\d+\.\d+\.\d+/)]);
      expect([llengua, bloc]).toEqual([llengua, expect.stringMatching(/^<h3>[^<]+<\/h3>\n {6}<p>[\s\S]*?<\/p>\n {6}<p>[\s\S]*?<\/p>\n {6}<h4>/)]);
      expect([llengua, titolsH4(bloc).map((t) => t.split(' · ')[0])]).toEqual([llengua, PREFIXOS[llengua]]);
      expect([llengua, apartats(bloc).length]).toEqual([llengua, 6]);
      expect([llengua, bloc.endsWith('</p>\n\n      ')]).toEqual([llengua, true]);
      // Darrere del primer h4, només parells h4 + p; cada explicació comença en majúscula, per un codi o per un enllaç.
      expect([llengua, bloc.slice(bloc.indexOf('<h4>')).replace(/<h4>[\s\S]*?<\/h4>\n {6}<p>[\s\S]*?<\/p>(?:\n {6}|\n\n {6})/g, '')]).toEqual([llengua, '']);
      for (const { titol: h4, cos: p } of apartats(bloc)) expect([llengua, h4, /^(?:<code>|<a |[«(“]?[A-ZÀ-ÚÇ])/.test(p.replace(/<\/?strong>/g, ''))]).toEqual([llengua, h4, true]);
      const enllacos = [...bloc.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
      expect([llengua, enllacos]).toEqual([llengua, ['<a href="/mur">', '<a href="/notes">', '<a href="/xat">', '<a href="/page/arbres-monumentals">', '<a href="/page/receptes">', '<a href="/mercat">']]);
      expect([llengua, bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g)]).toEqual([llengua, null]);
      const pla = text(bloc);
      expect([llengua, PLATAFORMA_ALIENA.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /Google|Apple|App Store|iPhone|iPad|TestFlight|\bPlay\b/.test(pla)]).toEqual([llengua, false]);
      expect([llengua, /\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a|sobir/i.test(pla)]).toEqual([llengua, false]);
      // Marca: «de poble»; cap «del poble» (ni la seua forma castellana o gallega), que només val per a un poble concret.
      expect([llengua, /\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla)]).toEqual([llengua, false]);
      expect([llengua, pla.includes('Sóc de Poble')]).toEqual([llengua, true]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect([llengua, paragrafsDelBloc.length]).toEqual([llengua, 8]);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      for (const m of bloc.matchAll(/<strong>([\s\S]*?)<\/strong>/g)) {
        expect([llengua, m[1]]).toEqual([llengua, expect.not.stringMatching(/<strong>/)]);
        expect([llengua, m[1].replace(/<[^>]+>/g, '').trim().split(/\s+/).length <= 6]).toEqual([llengua, true]);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
    for (const ruta of interns(fitaR21C5)) expect(rutaExistix(ruta), ruta).toBe(true);
  });

  test('la versió 1.2.0, el build 5 i el connector 1.1.14 del repositori, literals; el codi no hi va per darrere i la capçalera diu el connector publicat', () => {
    for (const llengua of LLENGUES) {
      const obertura = text(blocEn(llengua).match(/<\/h3>\n {6}<p>([\s\S]*?)<\/p>/)[1]);
      expect([llengua, obertura.includes(VERSIO_C5), obertura.includes(FRASE_BUILD_C5[llengua]), obertura.includes(CONNECTOR_C5), obertura.includes('WordPress.org'), obertura.includes('COMMIT 5')])
        .toEqual([llengua, true, true, true, true, true]);
    }
    expect(noMesNova(VERSIO_C5, PAQUET.version), `${VERSIO_C5} ≤ ${PAQUET.version}`).toBe(true);
    expect(noMesNova(CONNECTOR_C5, CONNECTOR), `${CONNECTOR_C5} ≤ ${CONNECTOR}`).toBe(true);
    expect(VERSIO_CLIENT_NATIU).toBeGreaterThanOrEqual(BUILD_C5);
    expect(Number(llegix('android/app/build.gradle').match(/versionCode (\d+)/)[1])).toBeGreaterThanOrEqual(BUILD_C5);
    expect(PAGE_COPY.versions.subtitle).toBe(`Versió actual: v${PAQUET.version} · Connector WordPress v${CONNECTOR_PUBLICAT} a WordPress.org`);
  });

  test('els kits que reunix, i cap promesa per damunt del que hi ha: migracions sense aplicar, co-publicació apagada i cap tasca programada', () => {
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    for (const id of [...MIGRACIONS_MUR_C5, MIGRACIO_BETA_C5]) expect([id, migracions.filter((nom) => nom.startsWith(`${id}_`)).length]).toEqual([id, 1]);
    // El Mur filtrat és el que diu el text; la co-publicació només s'encén amb la bandera exacta, que cap .env del repositori encén.
    expect(MUR_PUBLIC_FILTRAT).toBe(true);
    expect(llegix('src/data/supabase/copublicacio.js')).toContain("import.meta.env.VITE_SDP_COPUBLICACIO !== '1'");
    expect(llegix('.env.example')).not.toMatch(/^\s*VITE_SDP_COPUBLICACIO\s*=\s*1\b/m);
    // La migració del canal no programa cap tasca (cron.schedule), com diu el text.
    const beta = llegix(`supabase/migrations/${migracions.find((nom) => nom.startsWith(`${MIGRACIO_BETA_C5}_`))}`);
    expect(beta).not.toMatch(/cron\.schedule/i);
    expect(llegix('src/pwa/recuperacioChunkDeploy.js')).toContain('FINESTRA_ANTI_BUCLE_MS');
    // La correcció dels 404: la bessona sense original ràster no demana cap còpia inventada (fallbackBessones.js).
    // Amb política de mitjans (connector i autònom), el parell exacte de la política, com al COMMIT 4.
    expect(llegix('src/config/fallbackBessones.js')).toContain('recursOriginalDeBessona');
    /* Onada R22 (honestedat-09) · I sense política (la web pròpia), el canvi d'R21.7 pel seu comportament, no per un nom
       que ja hi era: una .webp autònoma sense original ràster no demana cap adreça, i una bessona amb original en demana
       només l'extensió exacta, una vegada, mai .png ni .JPG. Amb la cascada .jpg → .png → .JPG del COMMIT 4, cap de les
       dues imatges no acabaria on diu el text. */
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const [src, final] of [['/assets/uploads/brain/xat_portada.webp', '/assets/uploads/brain/xat_portada.webp'], ['/assets/towns/tibi/1.webp', '/assets/towns/tibi/1.jpg']]) {
        const arrel = document.createElement('div');
        const img = document.createElement('img');
        img.setAttribute('src', src);
        arrel.appendChild(img);
        document.body.appendChild(arrel);
        const retira = instalaFallbackDeBessones(arrel);
        img.dispatchEvent(new Event('error'));
        img.dispatchEvent(new Event('error'));
        retira();
        arrel.remove();
        expect([src, img.getAttribute('src'), img.dataset[MARCA_FALLBACK] ?? null]).toEqual([src, final, src === final ? null : 'original']);
      }
    } finally { avisos.mockRestore(); }
    for (const llengua of LLENGUES) {
      const bloc = blocEn(llengua);
      const abast = bloc.match(/<\/h3>\n {6}<p>[\s\S]*?<\/p>\n {6}<p>([\s\S]*?)<\/p>/)[1];
      expect([llengua, KITS_C5.filter((kit) => !abast.includes(kit))]).toEqual([llengua, []]);
      const pla = text(bloc);
      expect([llengua, [...MIGRACIONS_MUR_C5, MIGRACIO_BETA_C5].filter((id) => !bloc.includes(`<code>${id}</code>`))]).toEqual([llengua, []]);
      expect([llengua, SENSE_APLICAR_C5[llengua].filter((frase) => !pla.includes(frase))]).toEqual([llengua, []]);
    }
  });

  test('el Mur en dues lectures, el menú de la negreta amb el nom de cada diccionari i la retirada durable de les Notes', () => {
    for (const llengua of LLENGUES) {
      const [mur, notes, xat] = apartats(blocEn(llengua));
      expect([llengua, [...mur.cos.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), [...notes.cos.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), [...xat.cos.matchAll(/href="([^"]+)"/g)].map((m) => m[1])])
        .toEqual([llengua, ['/mur'], ['/notes'], ['/xat']]);
      const [obri, tanca] = COMETES[llengua];
      expect([llengua, text(xat.cos).includes(`${obri}${DICCIONARIS[llengua]['section.xat.negreta.menu']}${tanca}`)]).toEqual([llengua, true]);
      expect([llengua, MIGRACIONS_MUR_C5.filter((id) => !mur.cos.includes(`<code>${id}</code>`))]).toEqual([llengua, []]);
      expect([llengua, notes.cos.includes('<code>2611122200</code>')]).toEqual([llengua, true]);
    }
  });

  /* Onada R22 (honestedat-03, dades-01; dades-06, honestedat-06) · La dependència del Mur i les metadades de les
     còpies públiques es proven pel comportament de content.js i storage.js de veritat. Fora del port cap mòdul no
     importa l'adaptador (Porta Enxufe, E1): les dues proves, amb les seues frases, viuen a
     src/data/supabase/versionsC5.comportament.test.js. */

  /* Onada R22, segona ronda (sql-03, notes-01, honestedat-02) · bloqueja_publicacio_mur i denuncia_publicacio_mur
     (2611122200) només guarden l'autor a la fila de qui el llig (private.mur_lector_ric: compte actiu i membre del
     poble). Per a la resta, el bloqueig és una fila opaca ('publicacio' + UUID públic, l'autor en
     private.mur_bloquejos_opacs) i la denúncia guarda l'autor null (l'autoria, en private.mur_denuncies_autoria); i
     llistaBloquejos (moderacio.js) mostra eixos bloquejos pel UUID, sense nom. El text diu «no revelen l'autor a qui no
     és membre d'este poble» si i només si és així. */
  test('Denunciar i Bloquejar des d’una publicació no revelen l’autor a qui no és membre d’este poble', () => {
    const migracio = readdirSync(resolve(process.cwd(), 'supabase/migrations')).find((nom) => nom.startsWith('2611122200_'));
    const sql = llegix(`supabase/migrations/${migracio}`);
    const funcio = (nom) => sql.match(new RegExp(`create or replace function ${nom.replace('.', '\\.')}\\([\\s\\S]*?\\n\\$\\$;`))?.[0] ?? '';
    const lector = funcio('private.mur_lector_ric');
    const bloqueja = funcio('public.bloqueja_publicacio_mur');
    const denuncia = funcio('public.denuncia_publicacio_mur');
    expect([lector === '', bloqueja === '', denuncia === '']).toEqual([false, false, false]);
    const nomesMembres = /private\.is_town_member\(p_tenant\)/.test(lector);
    const bloqueigOpac = /if private\.mur_lector_ric\(s\.tenant_id\) then/.test(bloqueja)
      && /insert into public\.bloquejos\(bloquejat_tipus,publicacio_id\) values\('publicacio',p_id\)/.test(bloqueja)
      && /insert into private\.mur_bloquejos_opacs\(/.test(bloqueja);
    const denunciaOpaca = /v_opac:=auth\.uid\(\) is not null and not private\.mur_lector_ric\(s\.tenant_id\);/.test(denuncia)
      && /case when v_opac then null else v_autor_id end/.test(denuncia);
    const llistaSenseNom = /tipus: TIPUS_PUBLICACIO, id: publicacio\.toLowerCase\(\), nom: null/.test(llegix('src/data/supabase/moderacio.js'));
    for (const llengua of LLENGUES) {
      const pla = text(apartats(blocEn(llengua))[0].cos);
      expect([llengua, pla.includes(MODERACIO_C5[llengua])]).toEqual([llengua, nomesMembres && bloqueigOpac && denunciaOpaca && llistaSenseNom]);
    }
  });

  /* Onada R22, segona ronda (xat-01, xat-09) · VisorGaleriaXat es pinta amb createPortal a la capa de dalt, amb
     --z-calaix per damunt de la barra negra, del lateral i de la navegació mòbil. Les cares dels grups (Bombolla) i
     del visor prenen `src`, el que llig CaraXat, del padró del fil (caresDelFil, caraDAutor): la foto de la persona o
     de l'entitat que la conversa porta, i sense foto, null (CaraXat hi posa les inicials). */
  test('el visor del xat per damunt de les barres i les cares dels grups amb la foto de la conversa o les inicials', () => {
    const visor = llegix('src/sections/xat/components/VisorGaleriaXat.jsx');
    const tokens = llegix('src/css/tokens.css');
    const z = (nom) => Number(tokens.match(new RegExp(`--z-${nom}: (\\d+);`))?.[1] ?? NaN);
    const perDamunt = /^import \{ createPortal \} from 'react-dom';$/m.test(visor) && /return createPortal\(/.test(visor)
      && /\.sdp-xat-visor \{[^}]*position: fixed;[^}]*z-index: var\(--z-calaix\);/.test(llegix('src/css/modules.css'))
      && ['barra-negra', 'sidebar', 'nav-mobil'].every((capa) => z('calaix') > z(capa));
    const fil = { entitatId: 'e1', altres: [{ id: 'u1', tipus: 'persona', avatarUrl: 'https://exemple.test/u1.webp' },
      { id: 'e1', tipus: 'entitat', avatarUrl: 'https://exemple.test/e1.webp' }, { id: 'u2', tipus: 'persona', avatarUrl: null }] };
    const cares = caresDelFil(fil);
    const ambFoto = [caraDAutor({ usuariId: 'u1' }, fil, cares), caraDAutor({ usuariId: 'u1', comEntitat: true }, fil, cares),
      caraDAutor({ usuariId: 'u2' }, fil, cares), caraDAutor({ usuariId: 'u3' }, fil, cares)];
    const caresDelPadro = JSON.stringify(ambFoto) === JSON.stringify(['https://exemple.test/u1.webp', 'https://exemple.test/e1.webp', null, null])
      && /^export default function CaraXat\(\{ nom, src = null,/m.test(llegix('src/sections/xat/components/CaraXat.jsx'))
      && /<CaraXat\s+nom=\{autorGrup\.nom\}\s+src=\{caraAutor \|\| null\}/.test(llegix('src/sections/xat/components/Bombolla.jsx'))
      && /caraAutor=\{caraDAutor\(msg, fil, caresFil\)\}/.test(llegix('src/sections/xat/components/Conversa.jsx'))
      && /<CaraXat nom=\{actual\.autor\} src=\{actual\.avatar \|\| null\}/.test(visor);
    for (const llengua of LLENGUES) {
      const pla = text(apartats(blocEn(llengua))[2].cos);
      const [visorText, caraText] = XAT_C5[llengua];
      expect([llengua, pla.includes(visorText), pla.includes(caraText)]).toEqual([llengua, perDamunt, caresDelPadro]);
    }
  });

  /* Onada R22, segona ronda (pwa-01) · La recuperació, provada pel seu comportament amb la mateixa màquina que
     instal·la la web (instalLaRecuperacioChunkDeploy) i un document fals: un error d'un tros retirat recarrega una
     vegada; el mateix build ja no torna a recarregar ni passat FINESTRA_ANTI_BUCLE_MS (sense bucles); i després d'una
     entrada de la persona (escriure, enganxar, triar o deixar anar: ENTRADES_AMB_ESTAT_EN_MEMORIA) no recarrega mai.
     L'avís és el de RouteErrorBoundary, la barrera de les seccions. El text ho diu si i només si és així.
     Tercera ronda · I el límit: un toc sol (pointerdown, click) no veta i la pàgina es recarrega; el text ho diu i ja no
     promet «no s'esborra res». */
  test('la recuperació: com a molt una vegada, sense bucles, i res després d’una entrada de la persona; la secció ho avisa', async () => {
    const ORIGEN = 'https://socdepoble.org';
    const bytes = new TextEncoder().encode('<!doctype html><html><head><script type="module" src="/assets/index-Nou12345.js"></script></head><body></body></html>');
    const prova = async (entrada = null) => {
      const dades = new Map();
      const oients = new Map();
      const reload = vi.fn();
      const finestra = {
        document: { querySelectorAll: (selector) => (selector.startsWith('script') ? [{ getAttribute: () => '/assets/index-Vell1234.js' }] : []) },
        sessionStorage: { getItem: (clau) => dades.get(clau) ?? null, setItem: (clau, valor) => { dades.set(clau, valor); } },
        location: { origin: ORIGEN, href: `${ORIGEN}/xat`, reload },
        addEventListener: (tipus, oient) => { oients.set(tipus, oient); },
        removeEventListener: (tipus) => { oients.delete(tipus); }
      };
      const fetchFn = async (url) => (url.endsWith('/index.html')
        ? { status: 200, redirected: false, url, headers: { get: (nom) => (nom === 'content-type' ? 'text/html; charset=utf-8' : null) },
          body: { getReader: () => { let llegit = false; return { read: async () => { if (llegit) return { done: true }; llegit = true; return { done: false, value: bytes }; }, cancel: async () => {} }; } } }
        : { status: 404, redirected: false, url, headers: { get: () => null } });
      let ara = 1_000_000;
      const atura = instalLaRecuperacioChunkDeploy({ finestra, navegador: { onLine: true }, fetchFn, ara: () => ara, topallMs: 1000 });
      try {
        if (entrada) oients.get(entrada)?.({ type: entrada });
        const error = new TypeError(`Failed to fetch dynamically imported module: ${ORIGEN}/assets/FitxaVivaDeComunitat-CQbREbBV.js`);
        const primera = await recuperaErrorChunkDeploy(error);
        ara += FINESTRA_ANTI_BUCLE_MS * 10;
        const segona = await recuperaErrorChunkDeploy(error);
        return [primera, segona, reload.mock.calls.length];
      } finally { atura(); }
    };
    // Una sola recuperació instal·lada alhora (instalLaRecuperacioChunkDeploy atura l'anterior): en sèrie.
    const senseEntrada = await prova();
    const ambEntrada = [];
    for (const tipus of ENTRADES_AMB_ESTAT_EN_MEMORIA) ambEntrada.push(await prova(tipus));
    const unaVegada = JSON.stringify(senseEntrada) === JSON.stringify([true, false, 1]);
    const vetoDeLesEntrades = [...ENTRADES_AMB_ESTAT_EN_MEMORIA].sort().join() === 'change,drop,input,paste'
      && ambEntrada.every((resultat) => JSON.stringify(resultat) === JSON.stringify([false, false, 0]));
    // Tercera ronda · El límit que el text diu: un toc sol no veta (cap escolta de clic), i la pàgina es recarrega.
    const ambToc = [];
    for (const tipus of ['pointerdown', 'click']) ambToc.push(await prova(tipus));
    const unTocNoHoVeta = ambToc.every((resultat) => JSON.stringify(resultat) === JSON.stringify([true, false, 1]));
    const barrera = llegix('src/app/RouteErrorBoundary.jsx');
    const laSeccioHoAvisa = barrera.includes('Aquesta secció no ha pogut carregar-se correctament.')
      && barrera.includes('Recarregar reinicia l’aplicació i descarta les dades que només viuen a la memòria.');
    for (const llengua of LLENGUES) {
      const pla = text(apartats(blocEn(llengua))[5].cos);
      expect([llengua, pla.includes(UNA_VEGADA_C5[llengua]), pla.includes(VETO_C5[llengua])])
        .toEqual([llengua, unaVegada, unaVegada && vetoDeLesEntrades && unTocNoHoVeta && laSeccioHoAvisa]);
      if (unTocNoHoVeta) expect([llengua, NO_SESBORRA_RES.test(pla)]).toEqual([llengua, false]);
    }
  });

  /* Onada R22 (honestedat-04) · La recuperació dels trossos vells només la instal·la registraServiceWorker, que només
     crida main.jsx: el paquet del connector (embed.jsx, host.js i PedraSecaEmbed.jsx) no importa res de pwa/, i
     motiuPerNoRegistrar exclou l'app nativa. El text la limita a la web pròpia i ho diu. I mentre actualitzaWorkerPerDeploy
     no espere el statechange del worker nou (pwa-03), el text no diu que el service worker es posa al dia. */
  test('la recuperació després d’una actualització és de la web pròpia: ni el connector de WordPress ni les apps no la porten', () => {
    const importsDelPaquet = ['src/embed.jsx', 'src/host.js', 'src/PedraSecaEmbed.jsx'].map(llegix).join('\n')
      .match(/^\s*import\b[^;]*?['"][^'"]+['"]|\bimport\(\s*['"][^'"]+['"]/gm) ?? [];
    expect(importsDelPaquet.length).toBeGreaterThan(0);
    const paquetAmbRecuperacio = importsDelPaquet.some((linia) => /pwa\/|recuperacioChunkDeploy/.test(linia));
    const registre = llegix('src/pwa/registre.js');
    const nativaExclosa = /isNativePlatform\(\)\) return 'nativa'/.test(registre);
    const swAlDia = /statechange/.test(registre);
    for (const llengua of LLENGUES) {
      const pla = text(apartats(blocEn(llengua))[5].cos);
      const [webPropia, senseConnector] = RECUPERACIO_NOMES_WEB_C5[llengua];
      expect([llengua, pla.includes(webPropia)]).toEqual([llengua, true]);
      expect([llengua, pla.includes(senseConnector)]).toEqual([llengua, !paquetAmbRecuperacio && nativaExclosa]);
      if (!swAlDia) expect([llengua, /service worker/i.test(pla)]).toEqual([llengua, false]);
    }
  });

  /* Onada R22 (honestedat-07) · Arbres i receptes continuen en dos espais de treball (cada secció amb el seu
     CatalegWorkspace i el seu id), i la graella de catàlegs municipals recorre LLIBRES_ARBRES_MONUMENTALS, que hui en té
     un. El text no diu cap espai unificat ni cap prestatgeria multipoble, i nomena el poble del catàleg que hi ha. */
  test('patrimoni: dos espais de treball i un sol catàleg municipal, sense cap espai unificat ni prestatgeria multipoble', () => {
    const ids = ['src/sections/patrimoni/NaturaPatrimoniWorkspaceSection.jsx', 'src/sections/patrimoni/ReceptesWorkspaceSection.jsx']
      .map((ruta) => llegix(ruta).match(/<CatalegWorkspace\b[\s\S]*?\bid="([^"]+)"/)?.[1] ?? null);
    expect(ids.every(Boolean)).toBe(true);
    const dosEspais = new Set(ids).size === 2;
    for (const llengua of LLENGUES) {
      const pla = text(apartats(blocEn(llengua))[4].cos);
      if (dosEspais) expect([llengua, UNIFICAT.test(pla)]).toEqual([llengua, false]);
      if (LLIBRES_ARBRES_MONUMENTALS.length === 1) {
        expect([llengua, MULTIPOBLE.test(pla), pla.includes(LLIBRES_ARBRES_MONUMENTALS[0].poble)]).toEqual([llengua, false, true]);
      }
    }
  });
});
