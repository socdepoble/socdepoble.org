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
// Onada R30 · Els 90 dies de la compactació de la carpeta del Mode rural (PF-03), els del codi.
import { DIES_COMPACTACIO_CRDT_VAULT } from '../../data/sincronitzadorCarpetaLocal.js';
// Onada R32.3 · El títol de l'apartat «Salut de l'aparell i espai local» del Panell de Control, el del giny.
import { TEXTOS_SALUT_DISPOSITIU } from '../control/textosSalutDispositiuJarvis.js';
// Onada R32.4 · Els apartats de l'Administració del sistema, amb una sola icona vectorial i cap emoticona al títol.
import { itemsDAdministracioSistema } from '../profile/perfilModel.js';
// Onada v1.2.7 · Els textos que es veuen a la pantalla: el botó de l'avís web, la línia de versió, la banda beta i el
// marcador de data que la Nevera ja no posa als articles permanents.
import { TEXTOS_ACTUALITZACIO } from '../../components/universal/barres/textosActualitzacio.js';
import { TEXTOS_LINIA_VERSIO } from '../../components/universal/LiniaVersioInstallada.jsx';
import { TEXTOS_BANDA_BETA } from '../../components/PedraSeca/molecules/textosBandaBeta.js';
import { MARCADORS_NO_INDICATS } from '../../components/universal/editorial.js';
// Onada v1.2.8 · Els sostres del vídeo i de l'espai del Xat que diu la crònica R32.7, R32.8 i R32.9, els del codi.
import { MAXIM_ADJUNT_XAT, MAX_VIDEO_ENTRADA_BYTES, MAX_VIDEO_MS, QUOTA_XAT_BYTES } from '../../data/xatMultimedia.js';
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
      || (RUTES.includes('<Route path="/page/:slug" ') && (Object.hasOwn(PAGE_COPY, pagina[1]) || resolvePageSlugPath(pagina[1]) !== null));
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
/* Onada R23 · La crònica de l'Onada R23 obri /versions, davant de la fita R21 C5. */
const TITOL_FITA_R23 = '14 de novembre de 2026 · Onada R23 · La veu oberta del Node 0, el reproductor flotant universal, el joc «D’on parles?» i la frescor editorial';
const fitaR23Bloc = blocDe(TITOL_FITA_R23);
const INICIS_R23 = {
  ca: '14 de novembre de 2026 · Onada R23',
  es: '14 de noviembre de 2026 · Oleada R23',
  en: '14 November 2026 · Wave R23',
  eu: '2026ko azaroaren 14a · R23 olatua',
  gl: '14 de novembro de 2026 · Onda R23'
};
/* Onada R24 · La crònica de l'Onada R24 obri /versions, davant de la crònica R23. */
const TITOL_FITA_R24 = '14 de novembre de 2026, matinada · Onada R24 · Manual editorial a les pàgines públiques, precomanda per a la botiga local i reforç dels jocs de veu';
const fitaR24Bloc = blocDe(TITOL_FITA_R24);
const INICIS_R24 = {
  ca: '14 de novembre de 2026, matinada · Onada R24',
  es: '14 de noviembre de 2026, madrugada · Oleada R24',
  en: '14 November 2026, early morning · Wave R24',
  eu: '2026ko azaroaren 14a, goizaldea · R24 olatua',
  gl: '14 de novembro de 2026, madrugada · Onda R24'
};
/* Onades R26 i R27 · La crònica de les Onades R26 i R27 obri /versions, davant de la crònica R24. */
const TITOL_FITA_R26 = '15 de novembre de 2026, matinada · Onades R26 i R27 · El Farcellet Digital al Mur, una edició més clara al Bloc de Notes i més seguretat a les aplicacions i al connector';
const fitaR26Bloc = blocDe(TITOL_FITA_R26);
const INICIS_R26 = {
  ca: '15 de novembre de 2026, matinada · Onades R26 i R27',
  es: '15 de noviembre de 2026, madrugada · Oleadas R26 y R27',
  en: '15 November 2026, early morning · Waves R26 and R27',
  eu: '2026ko azaroaren 15a, goizaldea · R26 eta R27 olatuak',
  gl: '15 de novembro de 2026, madrugada · Ondas R26 e R27'
};
/* Onada R28 · La crònica de l'Onada R28 obri /versions, davant de la crònica R26 i R27. */
const TITOL_FITA_R28 = '15 de novembre de 2026, matí · Onada R28 · Una còpia xifrada del Xat, el reproductor de so centrat i més contrast i espai per a escriure al mòbil';
const fitaR28Bloc = blocDe(TITOL_FITA_R28);
const INICIS_R28 = {
  ca: '15 de novembre de 2026, matí · Onada R28',
  es: '15 de noviembre de 2026, mañana · Oleada R28',
  en: '15 November 2026, morning · Wave R28',
  eu: '2026ko azaroaren 15a, goiza · R28 olatua',
  gl: '15 de novembro de 2026, mañá · Onda R28'
};
/* Onada R29 · La crònica de l'Onada R29 obri /versions, davant de la crònica R28. */
const TITOL_FITA_R29 = '15 de novembre de 2026, tarda · Onada R29 · El teclat del mòbil al seu lloc, un reproductor de so que no es mou i carpetes del Bloc de Notes que arriben al servidor';
const fitaR29Bloc = blocDe(TITOL_FITA_R29);
const INICIS_R29 = {
  ca: '15 de novembre de 2026, tarda · Onada R29',
  es: '15 de noviembre de 2026, tarde · Oleada R29',
  en: '15 November 2026, afternoon · Wave R29',
  eu: '2026ko azaroaren 15a, arratsaldea · R29 olatua',
  gl: '15 de novembro de 2026, tarde · Onda R29'
};
/* Onada R30 · La crònica de l'Onada R30 obri /versions, davant de la crònica R29. */
const TITOL_FITA_R30 = '16 de novembre de 2026, matinada · Onada R30 · Les carpetes antigues del Bloc de Notes al servidor, una carpeta del Mode rural que es compacta sola i dos tocs que ja no compten doble';
const fitaR30Bloc = blocDe(TITOL_FITA_R30);
const INICIS_R30 = {
  ca: '16 de novembre de 2026, matinada · Onada R30',
  es: '16 de noviembre de 2026, madrugada · Oleada R30',
  en: '16 November 2026, early morning · Wave R30',
  eu: '2026ko azaroaren 16a, goizaldea · R30 olatua',
  gl: '16 de novembro de 2026, madrugada · Onda R30'
};
/* Onada R32 · La crònica de l'Onada R32 (versió 1.2.4, build 9) obri /versions, davant de la crònica R30. */
const TITOL_FITA_R32 = '16 de novembre de 2026, vesprada · Onada R32 · Missatges del Xat que no cauen en error en renovar la sessió, carpetes del Bloc de Notes que no es confonen i més seguretat al servidor compartit';
const fitaR32Bloc = blocDe(TITOL_FITA_R32);
const INICIS_R32 = {
  ca: '16 de novembre de 2026, vesprada · Onada R32',
  es: '16 de noviembre de 2026, tarde · Oleada R32',
  en: '16 November 2026, evening · Wave R32',
  eu: '2026ko azaroaren 16a, arratsaldea · R32 olatua',
  gl: '16 de novembro de 2026, tarde · Onda R32'
};
/* Onada R32.3 · La crònica de l'Onada R32.3 (versió 1.2.5, build 10) obri /versions, davant de la crònica R32. */
const TITOL_FITA_R32_3 = '17 de novembre de 2026, matinada · Onada R32.3 · Les aplicacions avisen soles d’una versió nova, el Perfil en dues columnes al mòbil i una eixida de la sessió més sòlida';
const fitaR32_3Bloc = blocDe(TITOL_FITA_R32_3);
const INICIS_R32_3 = {
  ca: '17 de novembre de 2026, matinada · Onada R32.3',
  es: '17 de noviembre de 2026, madrugada · Oleada R32.3',
  en: '17 November 2026, early morning · Wave R32.3',
  eu: '2026ko azaroaren 17a, goizaldea · R32.3 olatua',
  gl: '17 de novembro de 2026, madrugada · Onda R32.3'
};
/* Onada R32.4 · La crònica de l'Onada R32.4 (versió 1.2.6, build 11) obri /versions, davant de la crònica R32.3. */
const TITOL_FITA_R32_4 = '17 de novembre de 2026, vesprada · Onada R32.4 · L’idioma i l’eixida al calaix d’identitats, les Aplicacions en un sol enllaç del Perfil i comptes exactes al TPV i a la Gestoria';
const fitaR32_4Bloc = blocDe(TITOL_FITA_R32_4);
const INICIS_R32_4 = {
  ca: '17 de novembre de 2026, vesprada · Onada R32.4',
  es: '17 de noviembre de 2026, tarde · Oleada R32.4',
  en: '17 November 2026, afternoon · Wave R32.4',
  eu: '2026ko azaroaren 17a, arratsaldea · R32.4 olatua',
  gl: '17 de novembro de 2026, tarde · Onda R32.4'
};
/* Onada R32.4 · L'inici de la segona entrada (la de la R32.3) i el de la tercera (la de la R32) d'una pàgina localitzada.
   Onada v1.2.7 · Amb la crònica R32.5 i R32.6 davant: la segona és la R32.4, la tercera la R32.3 i la quarta la R32. */
const iniciDeLaSegona = (cos) => cos.indexOf('<h3>', 4);
const iniciDeLaTercera = (cos) => cos.indexOf('<h3>', iniciDeLaSegona(cos) + 4);
const iniciDeLaQuarta = (cos) => cos.indexOf('<h3>', iniciDeLaTercera(cos) + 4);
/* Onada v1.2.7 · La crònica de les Onades R32.5 i R32.6 (versió 1.2.7, build 12) obri /versions, davant de la crònica R32.4. */
const TITOL_FITA_R32_5 = '17 de novembre de 2026, nit · Onades R32.5 i R32.6 · L’avís d’actualització d’un toc, les fotos del mòbil al Xat i la fase beta a les aplicacions en proves';
const fitaR32_5Bloc = blocDe(TITOL_FITA_R32_5);
const INICIS_R32_5 = {
  ca: '17 de novembre de 2026, nit · Onades R32.5 i R32.6',
  es: '17 de noviembre de 2026, noche · Oleadas R32.5 y R32.6',
  en: '17 November 2026, night · Waves R32.5 and R32.6',
  eu: '2026ko azaroaren 17a, gaua · R32.5 eta R32.6 olatuak',
  gl: '17 de novembro de 2026, noite · Ondas R32.5 e R32.6'
};
/* Onada v1.2.8 · Amb la crònica R32.7, R32.8 i R32.9 davant: la segona és la R32.5 i R32.6, la tercera la R32.4, la
   quarta la R32.3 i la cinquena la R32. */
const iniciDeLaCinquena = (cos) => cos.indexOf('<h3>', iniciDeLaQuarta(cos) + 4);
/* Onada v1.2.9 · Amb la crònica R32.10, R32.11 i R32.12 davant: la segona és la R32.7, R32.8 i R32.9, la tercera la R32.5
   i R32.6, la quarta la R32.4, la cinquena la R32.3 i la sisena la R32. */
const iniciDeLaSisena = (cos) => cos.indexOf('<h3>', iniciDeLaCinquena(cos) + 4);
/* Onada v1.2.8 · La crònica de les Onades R32.7, R32.8 i R32.9 (versió 1.2.8, build 13) obri /versions, davant de la crònica
   R32.5 i R32.6. */
const TITOL_FITA_R32_8 = '18 de novembre de 2026 · Onades R32.7, R32.8 i R32.9 · Reaccions i missatges fixats al Xat, vídeos comprimits al navegador i capítols de la Wiki al Mur';
const fitaR32_8Bloc = blocDe(TITOL_FITA_R32_8);
const INICIS_R32_8 = {
  ca: '18 de novembre de 2026 · Onades R32.7, R32.8 i R32.9',
  es: '18 de noviembre de 2026 · Oleadas R32.7, R32.8 y R32.9',
  en: '18 November 2026 · Waves R32.7, R32.8 and R32.9',
  eu: '2026ko azaroaren 18a · R32.7, R32.8 eta R32.9 olatuak',
  gl: '18 de novembro de 2026 · Ondas R32.7, R32.8 e R32.9'
};
/* Onada v1.2.8 · La R32.7, R32.8 i R32.9 obri la pàgina i la R32.5 i R32.6 la seguix (cap altra pot obrir-la); la R32.4
   és la tercera. (Abans, obriR32_5iR32_4: la R32.5 i R32.6 obria la pàgina.) */
/* Onada v1.2.9 · La crònica de les Onades R32.10, R32.11 i R32.12 (versió 1.2.9, build 14) obri /versions, davant de la
   crònica R32.7, R32.8 i R32.9. */
const TITOL_FITA_R32_12 = '18 de novembre de 2026, nit · Onades R32.10, R32.11 i R32.12 · L’Avisador renovat, l’assistència als esdeveniments i les accions del Xat dins de la sessió';
const fitaR32_12Bloc = blocDe(TITOL_FITA_R32_12);
const INICIS_R32_12 = {
  ca: '18 de novembre de 2026, nit · Onades R32.10, R32.11 i R32.12',
  es: '18 de noviembre de 2026, noche · Oleadas R32.10, R32.11 y R32.12',
  en: '18 November 2026, night · Waves R32.10, R32.11 and R32.12',
  eu: '2026ko azaroaren 18a, gaua · R32.10, R32.11 eta R32.12 olatuak',
  gl: '18 de novembro de 2026, noite · Ondas R32.10, R32.11 e R32.12'
};
/* Onada v1.2.9 · La R32.10, R32.11 i R32.12 obri la pàgina, la R32.7, R32.8 i R32.9 la seguix, la R32.5 i R32.6 és la tercera
   i la R32.4 la quarta (cap altra pot obrir-la). (Abans, obriR32_8iR32_5 i obriR32_8R32_5iR32_4: la R32.7, R32.8 i R32.9
   obria la pàgina.) */
const obriR32_12iR32_8 = (cos, llengua) => cos.startsWith(`<h3>${INICIS_R32_12[llengua]}`)
  && cos.startsWith(`<h3>${INICIS_R32_8[llengua]}`, iniciDeLaSegona(cos));
const obriR32_12R32_8iR32_5 = (cos, llengua) => obriR32_12iR32_8(cos, llengua)
  && cos.startsWith(`<h3>${INICIS_R32_5[llengua]}`, iniciDeLaTercera(cos));
const obriR32_12R32_8R32_5iR32_4 = (cos, llengua) => obriR32_12R32_8iR32_5(cos, llengua)
  && cos.startsWith(`<h3>${INICIS_R32_4[llengua]}`, iniciDeLaQuarta(cos));

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
      // Onada v1.2.8 · La crònica de les Onades R32.7, R32.8 i R32.9 obri la pàgina, davant de R32.5 i R32.6, sense cap número vX.Y.Z al títol.
      // Onada v1.2.9 · La crònica de les Onades R32.10, R32.11 i R32.12 obri la pàgina, davant de R32.7, R32.8 i R32.9, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R32_12,
      TITOL_FITA_R32_8,
      // Onada v1.2.7 · La crònica de les Onades R32.5 i R32.6 va darrere de R32.7, R32.8 i R32.9, davant de R32.4, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R32_5,
      // Onada R32.4 · La crònica de l'Onada R32.4 va darrere de R32.5 i R32.6, davant de R32.3, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R32_4,
      // Onada R32.3 · La crònica de l'Onada R32.3 va darrere de R32.4, davant de R32, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R32_3,
      // Onada R32 · La crònica de l'Onada R32 va darrere de R32.3, davant de R30, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R32,
      // Onada R30 · La crònica de l'Onada R30 va darrere de R32, davant de R29, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R30,
      // Onada R29 · La crònica de l'Onada R29 va darrere de R30, davant de R28, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R29,
      // Onada R28 · La crònica de l'Onada R28 va darrere de R29, davant de R26 i R27, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R28,
      // Onades R26 i R27 · La crònica de les Onades R26 i R27 va darrere de R28, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R26,
      // Onada R24 · La crònica de l'Onada R24 va darrere de R26 i R27, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R24,
      // Onada R23 · La crònica de l'Onada R23 va darrere de R24, sense cap número vX.Y.Z al títol.
      TITOL_FITA_R23,
      // Onada R21 (COMMIT 5) · La fita R21 C5 va darrere de R23, sense cap número vX.Y.Z al títol.
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
    // Onada R23 · I la crònica R23: dèsset en total.
    // Onada R24 · I la crònica R24: díhuit en total.
    // Onades R26 i R27 · I la crònica R26 i R27: dènou en total.
    // Onada R28 · I la crònica R28: vint en total.
    // Onada R29 · I la crònica R29: vint-i-una en total.
    // Onada R30 · I la crònica R30: vint-i-dues en total.
    // Onada R32 · I la crònica R32: vint-i-tres en total.
    // Onada R32.3 · I la crònica R32.3: vint-i-quatre en total.
    // Onada R32.4 · I la crònica R32.4: vint-i-cinc en total.
    // Onada v1.2.7 · I la crònica R32.5 i R32.6: vint-i-sis en total.
    // Onada v1.2.8 · I la crònica R32.7, R32.8 i R32.9: vint-i-set en total.
    // Onada v1.2.9 · I la crònica R32.10, R32.11 i R32.12: vint-i-huit en total.
    expect(entregues).toHaveLength(28);
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

  test('és la primera entrada numerada del 3 de novembre, amb el títol literal, i la versió unificada d’ara és 1.2.9', () => {
    expect(html.indexOf('<h3>')).toBeLessThan(html.indexOf(`<h3>${TITOL_110}</h3>`));
    expect(html.slice(0, html.indexOf(`<h3>${TITOL_110}</h3>`))).toContain('v1.2.0 · suplement pendent d’integració');
    /* Onada R21 · La versió unificada passa de la 1.1.12 (R16) a la 1.2.0: la fita R21 ho explica.
       Onada R28 · I de la 1.2.0 a la 1.2.1: la crònica R28 ho explica. */
    /* Onada R29 · I de la 1.2.1 a la 1.2.2: la crònica R29 ho explica. */
    /* Onada R30 · I de la 1.2.2 a la 1.2.3: la crònica R30 ho explica. */
    /* Onada R32 · I de la 1.2.3 a la 1.2.4: la crònica R32 ho explica. */
    /* Onada R32.3 · I de la 1.2.4 a la 1.2.5: la crònica R32.3 ho explica. */
    /* Onada R32.4 · I de la 1.2.5 a la 1.2.6: la crònica R32.4 ho explica. */
    /* Onada v1.2.7 · I de la 1.2.6 a la 1.2.7: la crònica de les Onades R32.5 i R32.6 ho explica. */
    /* Onada v1.2.8 · I de la 1.2.7 a la 1.2.8: la crònica de les Onades R32.7, R32.8 i R32.9 ho explica. */
    /* Onada v1.2.9 · I de la 1.2.8 a la 1.2.9: la crònica de les Onades R32.10, R32.11 i R32.12 ho explica. */
    expect(PAQUET.version).toBe('1.2.9');
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
  /* Onada R28 (Lot C4) · Les apps passen a la 1.2.1 amb el build 6 (la crònica R28). */
  /* Onada R30 · I a la 1.2.3 amb el build 8 (la crònica R30), el mateix número que VERSIO_CLIENT_NATIU. */
  /* Onada R32 · I a la 1.2.4 amb el build 9 (la crònica R32), el mateix número que VERSIO_CLIENT_NATIU. */
  /* Onada R32.3 · I a la 1.2.5 amb el build 10 (la crònica R32.3), el mateix número que VERSIO_CLIENT_NATIU. */
  /* Onada R32.4 · I a la 1.2.6 amb el build 11 (la crònica R32.4), el mateix número que VERSIO_CLIENT_NATIU. */
  /* Onada v1.2.7 · I a la 1.2.7 amb el build 12 (la crònica R32.5 i R32.6), el mateix número que VERSIO_CLIENT_NATIU. */
  /* Onada v1.2.8 · I a la 1.2.8 amb el build 13 (la crònica R32.7, R32.8 i R32.9), el mateix número que VERSIO_CLIENT_NATIU. */
  /* Onada v1.2.9 · I a la 1.2.9 amb el build 14 (la crònica R32.10, R32.11 i R32.12), el mateix número que VERSIO_CLIENT_NATIU. */
  test('la versió de les apps d’ara és la 1.2.9, unificada amb package.json, i l’entrada conserva el build d’aquell dia, el 2', () => {
    const gradle = llegix('android/app/build.gradle');
    const pbx = llegix('ios/App/App.xcodeproj/project.pbxproj');
    expect(gradle).toMatch(/versionName "1\.2\.9"/);
    expect([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1])).toEqual(expect.arrayContaining(['1.2.9']));
    expect(new Set([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]))).toEqual(new Set(['1.2.9']));
    const build = gradle.match(/versionCode (\d+)/)[1];
    expect(new Set([...pbx.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => m[1]))).toEqual(new Set([build]));
    expect(build).toBe('14');
    expect(String(VERSIO_CLIENT_NATIU)).toBe(build);
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
    // Onada R23 · La crònica R23, una posició més.
    // Onada R24 · La crònica R24, una posició més.
    // Onades R26 i R27 · La crònica R26 i R27, una posició més.
    // Onada R28 · La crònica R28, una posició més.
    // Onada R29 · La crònica R29, una posició més.
    // Onada R30 · La crònica R30, una posició més.
    // Onada R32 · La crònica R32, una posició més.
    // Onada R32.3 · La crònica R32.3, una posició més.
    // Onada R32.4 · La crònica R32.4, una posició més.
    // Onada v1.2.7 · La crònica R32.5 i R32.6, una posició més.
    // Onada v1.2.8 · La crònica R32.7, R32.8 i R32.9, una posició més.
    // Onada v1.2.9 · La crònica R32.10, R32.11 i R32.12, una posició més.
    expect(titols[24]).toMatch(/^1 de novembre de 2026 · v/);
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
    expect(labels.map((l) => l.text)).toEqual([`v${PAQUET.version} · WP v${publicada}`, 'Sistema', '💻 Tecnologia i Disseny', 'Documentació']);
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
  expect(CAPACITATS_NO_DECLARADES).toEqual(['revocacioPublicacions','administracioSessions','curadoriaCultural','iaia','xatRitme','xatAccionsMissatge','importacioPaquetMunicipal','verificacioCorreu','recuperacioCorreu','moderacioLssi']);
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
    // Onada R23 · La crònica R23, una posició més.
    // Onada R24 · La crònica R24, una posició més.
    // Onades R26 i R27 · La crònica R26 i R27, una posició més.
    // Onada R28 · La crònica R28, una posició més.
    // Onada R29 · La crònica R29, una posició més.
    // Onada R30 · La crònica R30, una posició més.
    // Onada R32 · La crònica R32, una posició més.
    // Onada R32.3 · La crònica R32.3, una posició més.
    // Onada R32.4 · La crònica R32.4, una posició més.
    // Onada v1.2.7 · La crònica R32.5 i R32.6, una posició més.
    // Onada v1.2.8 · La crònica R32.7, R32.8 i R32.9, una posició més.
    // Onada v1.2.9 · La crònica R32.10, R32.11 i R32.12, una posició més.
    expect(titols[23]).toMatch(/^1 de novembre de 2026, tarda · /);
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
    // Onada R23 · La crònica R23 obri la pàgina, davant de la fita R21 C5.
    // Onada R24 · La crònica R24 obri la pàgina, davant de la crònica R23.
    // Onades R26 i R27 · La crònica R26 i R27 obri la pàgina, davant de la crònica R24.
    // Onada R28 · La crònica R28 obri la pàgina, davant de la crònica R26 i R27.
    // Onada R29 · La crònica R29 obri la pàgina, davant de la crònica R28.
    // Onada R30 · La crònica R30 obri la pàgina, davant de la crònica R29.
    // Onada R32 · La crònica R32 obri la pàgina, davant de la crònica R30.
    // Onada R32.3 · La crònica R32.3 obri la pàgina, davant de la crònica R32.
    // Onada R32.4 · La crònica R32.4 obri la pàgina, davant de la crònica R32.3.
    const cos = html.trimStart();
    // Onada v1.2.8 · La crònica R32.7, R32.8 i R32.9 obri la pàgina, davant de la crònica R32.5 i R32.6.
    // Onada v1.2.9 · La crònica R32.10, R32.11 i R32.12 obri la pàgina, davant de la crònica R32.7, R32.8 i R32.9.
    expect(cos.startsWith(`<h3>${TITOL_FITA_R32_12}</h3>`)).toBe(true);
    expect(cos.slice(fitaR32_12Bloc.length).startsWith(`<h3>${TITOL_FITA_R32_8}</h3>`)).toBe(true);
    expect(cos.slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length).startsWith(`<h3>${TITOL_FITA_R32_5}</h3>`)).toBe(true);
    expect(cos.slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length).startsWith(`<h3>${TITOL_FITA_R32_4}</h3>`)).toBe(true);
    expect(cos.slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length).startsWith(`<h3>${TITOL_FITA_R32_3}</h3>`)).toBe(true);
    expect(cos.slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length + fitaR32_3Bloc.length).startsWith(`<h3>${TITOL_FITA_R32}</h3>`)).toBe(true);
    expect(cos.slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length + fitaR32_3Bloc.length + fitaR32Bloc.length).startsWith(`<h3>${TITOL_FITA_R30}</h3>`)).toBe(true);
    const r29 = fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length + fitaR32_3Bloc.length + fitaR32Bloc.length + fitaR30Bloc.length;
    expect(cos.slice(r29).startsWith(`<h3>${TITOL_FITA_R29}</h3>`)).toBe(true);
    expect(cos.slice(r29 + fitaR29Bloc.length).startsWith(`<h3>${TITOL_FITA_R28}</h3>`)).toBe(true);
    expect(cos.slice(r29 + fitaR29Bloc.length + fitaR28Bloc.length).startsWith(`<h3>${TITOL_FITA_R26}</h3>`)).toBe(true);
    expect(cos.slice(r29 + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length).startsWith(`<h3>${TITOL_FITA_R24}</h3>`)).toBe(true);
    expect(cos.slice(r29 + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length).startsWith(`<h3>${TITOL_FITA_R23}</h3>`)).toBe(true);
    expect(cos.slice(r29 + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length + fitaR23Bloc.length).startsWith(`<h3>${TITOL_FITA_R21_C5}</h3>`)).toBe(true);
    expect(cos.slice(r29 + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length + fitaR23Bloc.length + fitaR21C5.length).startsWith(`<h3>${TITOL_FITA_R21}</h3>`)).toBe(true);
    const r21 = r29 + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length + fitaR23Bloc.length + fitaR21C5.length + fitaR21.length;
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
      // Onada R23 · La crònica R23 obri la pàgina, davant de la R21 C5, i la resta baixa una posició més.
      // Onada R24 · La crònica R24 obri la pàgina, davant de la R23, i la resta baixa una posició més.
      // Onades R26 i R27 · La crònica R26 i R27 obri la pàgina, davant de la R24: es compta des de la R24.
      // Onada R28 · La crònica R28 obri la pàgina, davant de la R26 i R27: es compta des de la R24.
      // Onada R29 · La crònica R29 obri la pàgina, davant de la R28 i de la R26 i R27: es compta des de la R24.
      // Onada R30 · La crònica R30 obri la pàgina, davant de la R29, la R28 i la R26 i R27: es compta des de la R24.
      // Onada R32 · La crònica R32 obri la pàgina, davant de la R30: es continua comptant des de la R24.
      // Onada R32.3 · La crònica R32.3 obri la pàgina, davant de la R32: la R24 passa a la setena posició.
      // Onada R32.4 · La crònica R32.4 obri la pàgina, davant de la R32.3: la R24 passa a la huitena posició.
      // Onada v1.2.8 · I la R32.7, R32.8 i R32.9 davant de la R32.5 i R32.6: la R24 passa a la desena posició.
      const h3R32 = iniciDeLaSisena(cos);
      const h3R30 = cos.indexOf('<h3>', h3R32 + 4);
      const segonaH3 = cos.indexOf('<h3>', h3R30 + 4);
      const terceraH3 = cos.indexOf('<h3>', segonaH3 + 4);
      expect([llengua, obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos)), cos.startsWith(`<h3>${INICIS_R32[llengua]}`, h3R32), cos.startsWith(`<h3>${INICIS_R30[llengua]}`, h3R30), cos.startsWith(`<h3>${INICIS_R29[llengua]}`, segonaH3), cos.startsWith(`<h3>${INICIS_R28[llengua]}`, terceraH3), cos.startsWith(`<h3>${INICIS_R26[llengua]}`, cos.indexOf('<h3>', terceraH3 + 4))]).toEqual([llengua, true, true, true, true, true, true]);
      const h3 = [...cos.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]).slice(10);
      expect([llengua, h3[0].startsWith(INICIS_R24[llengua])]).toEqual([llengua, true]);
      expect([llengua, h3[1].startsWith(INICIS_R23[llengua]), h3[2].startsWith(INICIS_R21_C5[llengua]), h3[3].startsWith(INICIS_R21[llengua]), h3[4].startsWith(INICIS_R20[llengua]), h3[5].startsWith(INICIS_R19[llengua]), h3[6].startsWith(r18), h3[7].startsWith(r16), h3[8].startsWith(r15), h3[9].startsWith(cronica), h3[10].startsWith(fita), h3[11].startsWith(seguent)]).toEqual([llengua, true, true, true, true, true, true, true, true, true, true, true]);
      const hrefs = (des, fins) => [...cos.slice(des, fins).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect([llengua, hrefs(cos.indexOf(h3[10]), cos.indexOf(h3[11]))]).toEqual([llengua, [APP_STORE]]);
      expect([llengua, hrefs(cos.indexOf(h3[9]), cos.indexOf(h3[10]))]).toEqual([llengua, ['/page/receptes']]);
      expect([llengua, hrefs(cos.indexOf(h3[8]), cos.indexOf(h3[9]))]).toEqual([llengua, ['/page/receptes']]);
      expect([llengua, hrefs(cos.indexOf(h3[7]), cos.indexOf(h3[8]))]).toEqual([llengua, ['/control', '/page/la-iaia-sabuda', '/page/receptes']]);
      expect([llengua, hrefs(cos.indexOf(h3[6]), cos.indexOf(h3[7]))]).toEqual([llengua, ['/control', '/page/arbres-monumentals', '/page/avisador', '/page/receptes', '/disseny']]);
      expect([llengua, cos.indexOf('<div lang="ca">') === -1 || cos.indexOf('<div lang="ca">') > cos.indexOf(h3[11])]).toEqual([llengua, true]);
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
    // Onada R30 · La crònica R30 obri la pàgina, davant de la R29.
    // Onada R32 · La crònica R32 obri la pàgina, davant de la R30.
    // Onada R32.3 · La crònica R32.3 obri la pàgina, davant de la R32.
    // Onada R32.4 · La crònica R32.4 obri la pàgina, davant de la R32.3.
    const r30 = fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length + fitaR32_3Bloc.length + fitaR32Bloc.length;
    const preC5 = r30 + fitaR30Bloc.length + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length + fitaR23Bloc.length;
    // Onada v1.2.8 · La crònica R32.7, R32.8 i R32.9 obri la pàgina, davant de la crònica R32.5 i R32.6.
    // Onada v1.2.9 · La crònica R32.10, R32.11 i R32.12 obri la pàgina, davant de la crònica R32.7, R32.8 i R32.9.
    expect(html.trimStart().startsWith(`<h3>${TITOL_FITA_R32_12}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR32_12Bloc.length).startsWith(`<h3>${TITOL_FITA_R32_8}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length).startsWith(`<h3>${TITOL_FITA_R32_5}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length).startsWith(`<h3>${TITOL_FITA_R32_4}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length).startsWith(`<h3>${TITOL_FITA_R32_3}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length + fitaR32_3Bloc.length).startsWith(`<h3>${TITOL_FITA_R32}</h3>`)).toBe(true);
    expect(html.trimStart().slice(r30).startsWith(`<h3>${TITOL_FITA_R30}</h3>`)).toBe(true);
    expect(html.trimStart().slice(r30 + fitaR30Bloc.length).startsWith(`<h3>${TITOL_FITA_R29}</h3>`)).toBe(true);
    expect(html.trimStart().slice(r30 + fitaR30Bloc.length + fitaR29Bloc.length).startsWith(`<h3>${TITOL_FITA_R28}</h3>`)).toBe(true);
    expect(html.trimStart().slice(r30 + fitaR30Bloc.length + fitaR29Bloc.length + fitaR28Bloc.length).startsWith(`<h3>${TITOL_FITA_R26}</h3>`)).toBe(true);
    expect(html.trimStart().slice(r30 + fitaR30Bloc.length + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length).startsWith(`<h3>${TITOL_FITA_R24}</h3>`)).toBe(true);
    expect(html.trimStart().slice(r30 + fitaR30Bloc.length + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length).startsWith(`<h3>${TITOL_FITA_R23}</h3>`)).toBe(true);
    expect(html.trimStart().slice(preC5).startsWith(`<h3>${TITOL_FITA_R21_C5}</h3>`)).toBe(true);
    expect(html.trimStart().slice(preC5 + fitaR21C5.length).startsWith(`<h3>${TITOL_FITA_R21}</h3>`)).toBe(true);
    expect(html.trimStart().slice(preC5 + fitaR21C5.length + fitaR21.length).startsWith(`<h3>${TITOL_FITA_R20}</h3>`)).toBe(true);
    expect(html.trimStart().slice(preC5 + fitaR21C5.length + fitaR21.length + fitaR20.length).startsWith(`<h3>${TITOL_FITA_R19}</h3>`)).toBe(true);
    expect(html.trimStart().slice(preC5 + fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length).startsWith(`<h3>${TITOL_FITA_R18}</h3>`)).toBe(true);
    expect(html.trimStart().slice(preC5 + fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length).startsWith(`<h3>${TITOL_FITA_R16}</h3>`)).toBe(true);
    expect(html.trimStart().slice(preC5 + fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length).startsWith(`<h3>${TITOL_FITA_R15}</h3>`)).toBe(true);
    expect(html.trimStart().slice(preC5 + fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length + fitaR15.length).startsWith(`<h3>${TITOL_FITA_R13_R14}</h3>`)).toBe(true);
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
    // Expectativa actualitzada a propòsit: P0-116 / IDEA-290 (ordre del Mestre, 261117) · Icona vectorial única del sistema sense emoji enganxat al títol.
    const titolCard = llegix('src/sections/profile/perfilModel.js').match(/title: '(Usuaris, Dispositius i Botigues) \(Google i Apple\)'/)?.[1];
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
    expect(html.trimStart().slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length + fitaR32_3Bloc.length + fitaR32Bloc.length + fitaR30Bloc.length + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length + fitaR23Bloc.length + fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length).startsWith(`<h3>${TITOL_FITA_R15}</h3>`)).toBe(true);
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
    /* Onada R29 · R29-RUT-01 · Els Workspace de patrimoni es carreguen ara amb lazyRoute (LazyRouteError i
       «Recarrega l’aplicació»): continuen sent trossos a part. */
    const claus = [...workspaces.matchAll(/^\s+'?([\w-]+)'?: lazy(?:Route)?\(/gm)].map((m) => m[1]);
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
    expect(html.trimStart().slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length + fitaR32_3Bloc.length + fitaR32Bloc.length + fitaR30Bloc.length + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length + fitaR23Bloc.length + fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length).startsWith(`<h3>${TITOL_FITA_R16}</h3>`)).toBe(true);
    expect(html.trimStart().slice(fitaR32_12Bloc.length + fitaR32_8Bloc.length + fitaR32_5Bloc.length + fitaR32_4Bloc.length + fitaR32_3Bloc.length + fitaR32Bloc.length + fitaR30Bloc.length + fitaR29Bloc.length + fitaR28Bloc.length + fitaR26Bloc.length + fitaR24Bloc.length + fitaR23Bloc.length + fitaR21C5.length + fitaR21.length + fitaR20.length + fitaR19.length + fitaR18.length + fitaR16.length).startsWith(`<h3>${TITOL_FITA_R15}</h3>`)).toBe(true);
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
      // Onada R23 · La crònica R23 obri la pàgina; la C5 i la R21 la seguixen i acaben just on comença la R20.
      // Onada R24 · La crònica R24 va davant de la R23 i obri la pàgina.
      // Onada R30 · Ara l'obri la crònica R30.
      // Onada R32 · Ara l'obri la crònica R32.
      // Onada R32.3 · Ara l'obri la crònica R32.3.
      // Onada R32.4 · Ara l'obri la crònica R32.4.
      const iniciR21 = cos.indexOf(`<h3>${INICIS_R21[llengua]}`);
      const fiR21 = cos.indexOf('<h3>', iniciR21 + 1);
      expect([llengua, obriR32_12R32_8R32_5iR32_4(cos, llengua), iniciR21 > 0, fiR21 === inici, cos.startsWith(`<h3>${INICIS_R19[llengua]}`, inici + bloc.length)]).toEqual([llengua, true, true, true, true]);
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
      const iniciC5 = cos.indexOf(`<h3>${INICIS_R21_C5[llengua]}`);
      const fiC5 = cos.indexOf('<h3>', iniciC5 + 1);
      // Onada R30 · La crònica R30 obri la pàgina.
      // Onada R32 · Ara l'obri la crònica R32.
      // Onada R32.3 · Ara l'obri la crònica R32.3.
      // Onada R32.4 · Ara l'obri la crònica R32.4.
      expect([llengua, obriR32_12R32_8R32_5iR32_4(cos, llengua), inici === fiC5, cos.startsWith(`<h3>${INICIS_R20[llengua]}`, inici + bloc.length)]).toEqual([llengua, true, true, true]);
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
    const inici = cos.indexOf(`<h3>${INICIS_R21_C5[llengua]}`);
    expect([llengua, inici > 0]).toEqual([llengua, true]);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 1));
  };

  test('va darrere de la crònica R23 i davant de la fita R21, sense número vX.Y.Z, amb dos paràgrafs d’obertura, sis apartats, rutes vives, densitat de negretes, regla 2.3.10 i marca «de poble»', () => {
    expect(TITOL_FITA_R21_C5).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(fitaR21C5.startsWith(`<h3>${TITOL_FITA_R21_C5}</h3>`)).toBe(true);
    for (const llengua of LLENGUES) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      const bloc = blocEn(llengua);
      const inici = cos.indexOf(bloc);
      expect([llengua, cos.startsWith(`<h3>${INICIS_R21[llengua]}`, inici + bloc.length)]).toEqual([llengua, true]);
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
      /* R32.6 (P0-120) · La cara (ara també en 1:1) pren `caraAutor`; sense foto, la de la IAIA o null (inicials). */
      && /const fontCara = caraAutor \|\| \([^;]*: null\);\s*[\s\S]*?<CaraXat\s+nom=\{autorCara\.nom\}\s+src=\{fontCara\}/.test(llegix('src/sections/xat/components/Bombolla.jsx'))
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

/* Fusió R24.2 (D5) · Les dues migracions R23 es diuen pels seus noms de 14 dígits (20261113233000 i 20261114023000). */
describe('Onada R23 · Crònica conservada darrere d’R24 en les cinc llengües amb honestedat Llei 0', () => {
  test('la crònica R23 es conserva darrere d’R24 en ca, es, en, eu i gl amb Matxa-TTS v2, NEL-VIVES, L’Alacantí, migracions pendents i el cron de frescor', () => {
    expect(fitaR23Bloc).toContain('Matxa-TTS v2 Multiaccent');
    expect(interns(fitaR23Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R23)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      const inici = cos.indexOf(`<h3>${iniciTitol}`);
      expect(inici > 0, llengua).toBe(true);
      const seguent = cos.indexOf('<h3>', inici + 4);
      const bloc = text(cos.slice(inici, seguent));
      for (const clau of ['Matxa-TTS v2 Multiaccent', 'socdepoble.cat/api/v1/node0/veu', 'Gina', 'Berta', 'Arnau', 'Lluc', 'NEL-VIVES', 'L’Alacantí', 'La Torre de les Maçanes', '20261113233000', '20261114023000', 'PostgreSQL 17.11', 'org.socdepoble.node0.frescor-editorial']) {
        expect(bloc, `${llengua} -> ${clau}`).toContain(clau);
      }
      expect(bloc, llengua).not.toMatch(/sobir[àa]|soberan/i);
    }
  });
});

describe('Onada R24 · Crònica d’obertura en les cinc llengües amb manual editorial, precomanda de botiga local i Llei 0', () => {
  const PREFIXOS_R24 = {
    ca: ['Novetat', 'Millora', 'Correcció'],
    es: ['Novedad', 'Mejora', 'Corrección'],
    en: ['New', 'Improvement', 'Fix'],
    eu: ['Berritasuna', 'Hobekuntza', 'Zuzenketa'],
    gl: ['Novidade', 'Mellora', 'Corrección']
  };
  test('obri /versions en ca, es, en, eu i gl sense vX.Y.Z al títol, amb densitat de negretes, rutes vives, 2.3.10 i zero marques de supermercat', () => {
    expect(TITOL_FITA_R24).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR24Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R24)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onades R26 i R27 · La crònica R24 ja no obri la pàgina: va just darrere de la R26 i R27.
      // Onada R28 · La R28 obri la pàgina i la R26 i R27 la seguix: la R24 és la tercera.
      // Onada R29 · La R29 obri la pàgina, la R28 i la R26 i R27 la seguixen: la R24 és la quarta.
      // Onada R30 · La R30 obri la pàgina, la R29, la R28 i la R26 i R27 la seguixen: la R24 és la cinquena.
      const inici = cos.indexOf(`<h3>${iniciTitol}`);
      // Onada R32 · La R32 obri la pàgina i la R30 la seguix: la R24 és la sisena.
      // Onada R32.3 · La R32.3 obri la pàgina i la R32 la seguix: la R24 és la setena.
      // Onada R32.4 · La R32.4 obri la pàgina i la R32.3 la seguix: la R24 és la huitena.
      const h3R32 = iniciDeLaSisena(cos);
      const h3R30 = cos.indexOf('<h3>', h3R32 + 4);
      const h3R29 = cos.indexOf('<h3>', h3R30 + 4);
      const h3R28 = cos.indexOf('<h3>', h3R29 + 4);
      const h3R26 = cos.indexOf('<h3>', h3R28 + 4);
      expect(obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos)) && cos.startsWith(`<h3>${INICIS_R32[llengua]}`, h3R32) && cos.startsWith(`<h3>${INICIS_R30[llengua]}`, h3R30) && cos.startsWith(`<h3>${INICIS_R29[llengua]}`, h3R29) && cos.startsWith(`<h3>${INICIS_R28[llengua]}`, h3R28) && cos.startsWith(`<h3>${INICIS_R26[llengua]}`, h3R26) && inici === cos.indexOf('<h3>', h3R26 + 4), llengua).toBe(true);
      const seguent = cos.indexOf('<h3>', inici + 4);
      const bloc = cos.slice(inici, seguent);
      expect(cos.startsWith(`<h3>${INICIS_R23[llengua]}`, seguent), llengua).toBe(true);
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R24[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|\bPlay\b/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|torn_|mas[i]a|sobir|Mercadona|Hacendado|Bosque Verde|Deliplus|Compy/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      expect(/\d+\s+models\b/i.test(pla), llengua).toBe(false);
      // Fusió R24.2 (D5) · La migració R23 del consens comarcal es diu pel seu nom de 14 dígits.
      expect(pla).toContain('20261114023000');
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(5);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });
});

/* Onades R26 i R27 · Crònica d'obertura en les cinc llengües: el Farcellet Digital (full de ruta i simulador didàctic,
   Llei 0: el motor de còpia no té cap botó per al veïnat), l'edició del Bloc de Notes i l'enduriment de xarxa. També
   fixa la correcció de les cròniques R23 i R24: les migracions del refranyer i del consens ja són al servidor compartit
   i el resum comarcal continua apagat per la bandera VITE_SDP_CONSENS_ISOGLOSSES. */
describe('Onades R26 i R27 · Crònica d’obertura en les cinc llengües amb el Farcellet Digital, el Bloc de Notes i Llei 0', () => {
  const PREFIXOS_R26 = {
    ca: ['Novetat', 'Millora', 'Correcció'],
    es: ['Novedad', 'Mejora', 'Corrección'],
    en: ['New', 'Improvement', 'Fix'],
    eu: ['Berritasuna', 'Hobekuntza', 'Zuzenketa'],
    gl: ['Novidade', 'Mellora', 'Corrección']
  };
  const SENSE_BOTO = { ca: 'no té cap botó', es: 'no tiene ningún botón', en: 'no button', eu: 'ez du botoirik', gl: 'non ten ningún botón' };
  test('va darrere de la R32.3, la R32, la R30, la R29 i la R28 i davant de la R24 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i 2.3.10', () => {
    expect(TITOL_FITA_R26).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR26Bloc)).toContain('/mur/copies-de-seguretat-soc-de-poble');
    expect(interns(fitaR26Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R26)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onada R28 · La crònica R28 obri la pàgina; la R26 i R27 va just darrere.
      // Onada R29 · La crònica R29 obri la pàgina i la R28 la seguix: la R26 i R27 és la tercera.
      // Onada R30 · La crònica R30 obri la pàgina, i la R29 i la R28 la seguixen: la R26 i R27 és la quarta.
      // Onada R32 · La crònica R32 obri la pàgina i la R30 la seguix: la R26 i R27 és la cinquena.
      // Onada R32.3 · La crònica R32.3 obri la pàgina i la R32 la seguix: la R26 i R27 és la sisena.
      const iniciR32 = iniciDeLaSisena(cos); // Onada R32.4 · La R32.4 i la R32.3 obrin la pàgina.
      const iniciR30 = cos.indexOf('<h3>', iniciR32 + 4);
      const iniciR29 = cos.indexOf('<h3>', iniciR30 + 4);
      const iniciR28 = cos.indexOf('<h3>', iniciR29 + 4);
      const iniciR26 = cos.indexOf('<h3>', iniciR28 + 4);
      expect(obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos)) && cos.startsWith(`<h3>${INICIS_R32[llengua]}`, iniciR32) && cos.startsWith(`<h3>${INICIS_R30[llengua]}`, iniciR30) && cos.startsWith(`<h3>${INICIS_R29[llengua]}`, iniciR29) && cos.startsWith(`<h3>${INICIS_R28[llengua]}`, iniciR28) && cos.startsWith(`<h3>${iniciTitol}`, iniciR26), llengua).toBe(true);
      const seguent = cos.indexOf('<h3>', iniciR26 + 4);
      const bloc = cos.slice(iniciR26, seguent);
      expect(cos.startsWith(`<h3>${INICIS_R24[llengua]}`, seguent), llengua).toBe(true);
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R26[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      expect(pla).toContain('20261114023000');
      expect(pla).toContain('20261114171500');
      expect(pla).toContain('1.2.0');
      expect(pla, llengua).toContain(SENSE_BOTO[llengua]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(5);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });

  test('les cròniques R23 i R24 ja no diuen que les migracions del refranyer i del consens estiguen pendents', () => {
    const PENDENT = /pendents? d’aplicar|pendientes? de aplicar|pending|aplikatzeko zain|pendentes? de aplicar/i;
    for (const llengua of Object.keys(INICIS_R26)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      for (const inicis of [INICIS_R24, INICIS_R23]) {
        const inici = cos.indexOf(`<h3>${inicis[llengua]}`);
        expect(inici > 0, llengua).toBe(true);
        const abast = text(cos.slice(inici, cos.indexOf('<h4>', inici)));
        expect(abast, llengua).toContain('20261114023000');
        expect(abast, llengua).not.toMatch(PENDENT);
        expect(abast, llengua).toMatch(/R26/);
      }
      const r23 = cos.indexOf(`<h3>${INICIS_R23[llengua]}`);
      expect(text(cos.slice(r23, cos.indexOf('<h4>', r23))), llengua).toContain('VITE_SDP_CONSENS_ISOGLOSSES');
    }
  });
});

/* Onada R28 · Crònica d'obertura en les cinc llengües: la còpia xifrada del Xat als Ajustos (Llei 0: es desa i es
   comprova, no es restaura i, a les aplicacions mòbils, es fa des del navegador), el reproductor de so centrat, el
   contrast i el teclat del mòbil. La 1.2.1 (build 6) és la del repositori, no la de les botigues, i la migració
   20261115030000 encara no s'ha aplicat al servidor compartit. */
describe('Onada R28 · Crònica d’obertura en les cinc llengües amb la còpia del Xat, el reproductor centrat i Llei 0', () => {
  const PREFIXOS_R28 = {
    ca: ['Novetat', 'Millora', 'Correcció'],
    es: ['Novedad', 'Mejora', 'Corrección'],
    en: ['New', 'Improvement', 'Fix'],
    eu: ['Berritasuna', 'Hobekuntza', 'Zuzenketa'],
    gl: ['Novidade', 'Mellora', 'Corrección']
  };
  const SENSE_RESTAURAR = { ca: 'no és possible', es: 'no es posible', en: 'not possible yet', eu: 'ez da posible oraindik', gl: 'non é posible' };
  const NO_BOTIGUES = { ca: 'no publicada a les botigues', es: 'no publicada en las tiendas', en: 'not yet published in the stores', eu: 'dendetan argitaratu gabe', gl: 'non publicada nas tendas' };
  test('va darrere de la R32.3, la R32, la R30 i la R29 i davant de la R26 i R27 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes i rutes vives', () => {
    expect(TITOL_FITA_R28).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR28Bloc)).toContain('/xat');
    expect(interns(fitaR28Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R28)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onada R29 · La crònica R29 obri la pàgina; la R28 va just darrere.
      // Onada R30 · La crònica R30 obri la pàgina i la R29 la seguix: la R28 és la tercera.
      // Onada R32 · La crònica R32 obri la pàgina i la R30 la seguix: la R28 és la quarta.
      // Onada R32.3 · La crònica R32.3 obri la pàgina i la R32 la seguix: la R28 és la cinquena.
      const iniciR32 = iniciDeLaSisena(cos); // Onada R32.4 · La R32.4 i la R32.3 obrin la pàgina.
      const iniciR30 = cos.indexOf('<h3>', iniciR32 + 4);
      const iniciR29 = cos.indexOf('<h3>', iniciR30 + 4);
      const iniciR28 = cos.indexOf('<h3>', iniciR29 + 4);
      expect(obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos)) && cos.startsWith(`<h3>${INICIS_R32[llengua]}`, iniciR32) && cos.startsWith(`<h3>${INICIS_R30[llengua]}`, iniciR30) && cos.startsWith(`<h3>${INICIS_R29[llengua]}`, iniciR29) && cos.startsWith(`<h3>${iniciTitol}`, iniciR28), llengua).toBe(true);
      const seguent = cos.indexOf('<h3>', iniciR28 + 4);
      const bloc = cos.slice(iniciR28, seguent);
      expect(cos.startsWith(`<h3>${INICIS_R26[llengua]}`, seguent), llengua).toBe(true);
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R28[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      expect(pla).toContain('20261115030000');
      expect(pla).toContain('1.2.1');
      expect(pla).toContain('.sdpbackup');
      expect(pla, llengua).toContain(SENSE_RESTAURAR[llengua]);
      expect(pla, llengua).toContain(NO_BOTIGUES[llengua]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(5);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });
});

/* Onada R29 · Crònica d'obertura en les cinc llengües: el teclat del mòbil al Xat i al Bloc de Notes, el reproductor de
   so que no es mou mentre llig i que en mode àudio parla d'àudio, l'enllaç per a entrar des del xat de mostra, les
   carpetes del Bloc de Notes al servidor (Llei 0: les creades abans continuen només al navegador). Cap missatge «sense
   duplicats»: PF-02 no canvia res que l'usuari veja al Xat. La 1.2.2 (build 7) és la del repositori, no la de les botigues; el connector publicat continua en la 1.1.12,
   i les migracions 20261115170000 i 20261115030000 encara no s'han aplicat al servidor compartit. */
describe('Onada R29 · Crònica d’obertura en les cinc llengües amb el teclat del mòbil, el reproductor de so, les carpetes al servidor i Llei 0', () => {
  const PREFIXOS_R29 = {
    ca: ['Novetat', 'Millora', 'Correcció'],
    es: ['Novedad', 'Mejora', 'Corrección'],
    en: ['New', 'Improvement', 'Fix'],
    eu: ['Berritasuna', 'Hobekuntza', 'Zuzenketa'],
    gl: ['Novidade', 'Mellora', 'Corrección']
  };
  const NO_BOTIGUES = { ca: 'no publicada a les botigues', es: 'no publicada en las tiendas', en: 'not yet published in the stores', eu: 'dendetan argitaratu gabe', gl: 'non publicada nas tendas' };
  const NO_APLICADA = { ca: 'encara no s’ha aplicat', es: 'todavía no se ha aplicado', en: 'has not yet been applied', eu: 'oraindik ez da aplikatu', gl: 'aínda non se aplicou' };
  const CARPETES_DABANS = { ca: 'continuen només en este navegador', es: 'siguen solo en este navegador', en: 'are still only in this browser', eu: 'nabigatzaile honetan bakarrik daude oraindik', gl: 'seguen só neste navegador' };
  test('va darrere de la R32.3, la R32 i la R30 i davant de la R28 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i Llei 0', () => {
    expect(TITOL_FITA_R29).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR29Bloc)).toEqual(expect.arrayContaining(['/xat', '/notes']));
    expect(interns(fitaR29Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R29)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onada R30 · La crònica R30 obri la pàgina; la R29 va just darrere. La R29 és història: la 1.2.2 i les
      // carpetes «només en este navegador» eren certes aquell dia, i la R30 conta que ara pugen al servidor.
      // Onada R32 · La crònica R32 obri la pàgina i la R30 la seguix: la R29 és la tercera.
      // Onada R32.3 · La crònica R32.3 obri la pàgina i la R32 la seguix: la R29 és la quarta.
      const iniciR32 = iniciDeLaSisena(cos); // Onada R32.4 · La R32.4 i la R32.3 obrin la pàgina.
      const iniciR30 = cos.indexOf('<h3>', iniciR32 + 4);
      const iniciR29 = cos.indexOf('<h3>', iniciR30 + 4);
      expect(obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos)) && cos.startsWith(`<h3>${INICIS_R32[llengua]}`, iniciR32) && cos.startsWith(`<h3>${INICIS_R30[llengua]}`, iniciR30) && cos.startsWith(`<h3>${iniciTitol}`, iniciR29), llengua).toBe(true);
      const seguent = cos.indexOf('<h3>', iniciR29 + 4);
      const bloc = cos.slice(iniciR29, seguent);
      expect(cos.startsWith(`<h3>${INICIS_R28[llengua]}`, seguent), llengua).toBe(true);
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R29[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      // Llei 0 · PF-02 no canvia res visible al Xat: cap «sense duplicats» en cap llengua.
      expect(/duplic|bikoiz/i.test(pla), llengua).toBe(false);
      expect(pla).toContain('20261115170000');
      expect(pla).toContain('20261115030000');
      expect(pla).toContain('1.2.2');
      expect(pla).toContain(CONNECTOR_PUBLICAT);
      expect(pla, llengua).toContain(NO_BOTIGUES[llengua]);
      expect(pla, llengua).toContain(NO_APLICADA[llengua]);
      expect(pla, llengua).toContain(CARPETES_DABANS[llengua]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(5);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });
});


/* Onada R30 · Crònica d'obertura en les cinc llengües: les carpetes del Bloc de Notes d'abans de la R29 que pugen
   al servidor sense tocar res del dispositiu (PF-01), la carpeta de notes del Mode rural que es compacta passats 90
   dies (PF-03), el connector de WordPress més lleuger, el deute de les portes, la veu que no llig la pàgina d'abans,
   el text del missatge xifrat tancat, el TPV del Bar, la Gestoria i els permisos que l'app ja no declara (NAT-04,
   sense nomenar cap plataforma: 2.3.10). Llei 0: el xifratge d'extrem a extrem continua apagat i la crònica ho diu;
   la 1.2.3 (build 8) és la del repositori i la crònica no diu res de les botigues; el connector publicat continua en
   la 1.1.12; les tres migracions ja s'han aplicat al servidor compartit (acta 261116_0103) i la 20261115230000
   encara no; el Rebost Domèstic no hi canvia. Onada R32 · Llei 0 · La 20261115230000 s'hi va aplicar el 16-11-2026
   a la vesprada (receptari 261116_sql_produccio_r30_r31): l'entrada ho diu, com va fer c11c35806 amb les tres. */
describe('Onada R30 · Crònica d’obertura en les cinc llengües amb les carpetes del Bloc de Notes, el Mode rural, el TPV del Bar i Llei 0', () => {
  const PREFIXOS_R30 = {
    ca: ['Millora', 'Millora', 'Correcció', 'Correcció', 'Correcció'],
    es: ['Mejora', 'Mejora', 'Corrección', 'Corrección', 'Corrección'],
    en: ['Improvement', 'Improvement', 'Fix', 'Fix', 'Fix'],
    eu: ['Hobekuntza', 'Hobekuntza', 'Zuzenketa', 'Zuzenketa', 'Zuzenketa'],
    gl: ['Mellora', 'Mellora', 'Corrección', 'Corrección', 'Corrección']
  };
  const DICCIONARIS_R30 = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  const MIGRACIONS_R30 = ['20261114000100', '20261115030000', '20261115170000'];
  /* Onada R30 · Llei 0 · Les tres es van aplicar a producció el 15-11-2026 a les 23.11 (acta 261116_0103); la
     20261115230000 del control de versions de les revisions de WordPress encara no.
     Onada R32 · Llei 0 · El Mestre va aplicar la 20261115230000 al servidor compartit el 16-11-2026 a la vesprada
     (RECEPTARI_SQL_PRODUCCIO_R30_R31.md, pas1_wp_cas_ok, captura 15.03): l'entrada R30 diu ara que llavors encara no
     s'havia aplicat i que s'hi va aplicar el 16 de novembre, i la prova rebutja el text que la donava per pendent. */
  const JA_APLICADES = { ca: 'ja s’han aplicat', es: 'ya se han aplicado', en: 'have already been applied', eu: 'jada aplikatu dira', gl: 'xa se aplicaron' };
  const APLICADA_16_11_R30 = { ca: 's’hi va aplicar el 16 de novembre', es: 'se aplicó el 16 de noviembre', en: 'was applied on 16 November',
    eu: 'azaroaren 16an arratsaldean aplikatu zen', gl: 'aplicouse o 16 de novembro' };
  const LLAVORS_NO_APLICADA_R30 = { ca: 'que llavors encara no s’havia aplicat', es: 'que entonces todavía no se había aplicado', en: 'which had not yet been applied at the time',
    eu: 'orduan oraindik aplikatu gabe zegoena', gl: 'que daquela aínda non se aplicara' };
  const ENCARA_PENDENT_R30 = /encara no s’ha aplicat|todavía no se ha aplicado|has not yet been applied|oraindik ez da aplikatu|aínda non se aplicou/;
  const XIFRATGE_APAGAT = { ca: 'xifratge d’extrem a extrem continua apagat', es: 'cifrado de extremo a extremo sigue apagado', en: 'end-to-end encryption stays switched off',
    eu: 'muturretik muturrerako zifratzea itzalita dago oraindik', gl: 'cifrado de extremo a extremo segue apagado' };
  const NOTES_ON_ERES = { ca: 'les notes continuen on eren', es: 'las notas siguen donde estaban', en: 'notes stay where they were', eu: 'oharrak lehen zeuden lekuan daude', gl: 'as notas seguen onde estaban' };
  const cometes = (llengua, frase) => (llengua === 'en' ? `“${frase}”` : `«${frase}»`);
  /* Onada R32 · La crònica R32 obri la pàgina: la R30 és la segona.
     Onada R32.3 · La crònica R32.3 obri la pàgina i la R32 la seguix: la R30 és la tercera. */
  // Onada R32.4 · I la R32.4 davant de totes: la R30 és la quarta.
  const iniciDeR30 = (cos) => cos.indexOf('<h3>', iniciDeLaSisena(cos) + 4);
  const blocR30 = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = iniciDeR30(cos);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 4));
  };

  test('va darrere de la R32.3 i la R32 i davant de la R29 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i 2.3.10', () => {
    expect(TITOL_FITA_R30).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR30Bloc)).toEqual(expect.arrayContaining(['/xat', '/notes', '/control?fitxa=mode-rural']));
    expect(interns(fitaR30Bloc).every(rutaExistix)).toBe(true);
    // rutaExistix no mira la consulta: la fitxa del Mode rural és la que obri el Panell.
    expect(llegix('src/sections/control/ControlSection.jsx')).toContain("const FITXA_MODE_RURAL = 'mode-rural';");
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R30)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      const iniciR30 = iniciDeR30(cos);
      expect(obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos))
        && cos.startsWith(`<h3>${INICIS_R32[llengua]}`, iniciDeLaSisena(cos))
        && cos.startsWith(`<h3>${iniciTitol}`, iniciR30), llengua).toBe(true);
      const bloc = blocR30(llengua);
      expect(cos.startsWith(`<h3>${INICIS_R29[llengua]}`, iniciR30 + bloc.length), llengua).toBe(true);
      expect(interns(bloc), llengua).toEqual(interns(fitaR30Bloc));
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R30[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      // Llei 0 · Cap paraula de les botigues: quan es fa el commit, la 1.2.3 encara no hi ha pujat.
      expect(/botig|tienda|\bstores?\b|denda|tenda/i.test(pla), llengua).toBe(false);
      // Llei 0 · Les correccions d'un sol gest són del TPV del Bar; el Rebost Domèstic no hi canvia.
      expect(pla, llengua).not.toMatch(/Rebost/);
      for (const migracio of MIGRACIONS_R30) expect(pla, `${llengua} · ${migracio}`).toContain(migracio);
      // Onada R32 · La R30 és història: la versió d'aquell dia era la 1.2.3 (build 8); la d'ara, 1.2.4, la diu la R32.
      // Onada R32.3 · I la d'ara, 1.2.5, la diu la R32.3.
      expect(pla, llengua).toMatch(/1\.2\.3 \(build 8\)|1\.2\.3 bertsiora \(8\. builda\)/);
      expect(pla).not.toContain(PAQUET.version);
      expect(pla).toContain(CONNECTOR_PUBLICAT);
      expect(pla, llengua).toContain(JA_APLICADES[llengua]);
      expect(pla, llengua).toContain('20261115230000');
      // Onada R32 · Llei 0 · La 20261115230000 ja és aplicada: llavors encara no, i el 16 de novembre sí.
      expect(pla, llengua).toContain(LLAVORS_NO_APLICADA_R30[llengua]);
      expect(pla, llengua).toContain(APLICADA_16_11_R30[llengua]);
      expect(pla, llengua).not.toMatch(ENCARA_PENDENT_R30);
      expect(pla, llengua).not.toMatch(/encara no s’han aplicat|todavía no se han aplicado|have not yet been applied|oraindik ez dira aplikatu|aínda non se aplicaron/);
      expect(pla, llengua).toContain(XIFRATGE_APAGAT[llengua]);
      expect(pla, llengua).toContain(NOTES_ON_ERES[llengua]);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(7);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });

  test('Llei 0 · cada fet té el seu consumidor a l’arbre: textos de la interfície, 90 dies, migracions, deute, permisos i proves', () => {
    /* El text del missatge xifrat tancat només és visible amb la bandera encesa: el dia que s'encenga, la crònica
       que diu «continua apagat» s'ha de tornar a escriure (no se'n deriva). */
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
    for (const [llengua, diccionari] of Object.entries(DICCIONARIS_R30)) {
      const pla = text(blocR30(llengua));
      for (const clau of ['section.xat.xifratge.tancat', 'section.xat.xifratge.noObert', 'section.traduir.escoltarPagina']) {
        expect(diccionari[clau], `${llengua} · ${clau}`).toBeTruthy();
        expect(pla, `${llengua} · ${clau}`).toContain(cometes(llengua, diccionari[clau]));
      }
      expect(pla, llengua).toContain(diccionari['pagina.barra.traduir']);
      expect(pla, llengua).toContain(`${DIES_COMPACTACIO_CRDT_VAULT} `);
      expect(diccionari['section.control.rural.carpetaCrdtAjuda'], llengua).toContain(`${DIES_COMPACTACIO_CRDT_VAULT} `);
    }
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    for (const migracio of MIGRACIONS_R30) expect(migracions.some((f) => f.startsWith(`${migracio}_`)), migracio).toBe(true);
    // PF-01 · Cap carpeta local s'esborra ni es reescriu.
    expect(llegix('src/components/universal/classificacio/migracioCarpetesLocals.js')).toContain('No destructiu: la carpeta local no s\'esborra ni es reescriu mai.');
    // A4 · La meitat del servidor de les revisions editorials ix de l'arrencada, i un trinquet ho vigila.
    expect(llegix('src/sections/mur/MurContext.jsx')).toContain("from '../../data/revisionsEditorialsDelNavegador.js'");
    expect(llegix('tests/standalone-build.test.mjs')).toContain('src/data/revisionsEditorialsDelNavegador.js');
    // El deute de les portes no puja: classes foranes a 0 i un sol accés directe al document.
    expect(JSON.parse(llegix('.agents/deute/.vocabulari-deute.json'))['classe-forastera']?.max ?? 0).toBe(0);
    expect(JSON.parse(llegix('.agents/deute/.pedra-seca-deute.json')).LLEI_06_ENCAPSULAMENT.max).toBeLessThanOrEqual(1);
    expect(llegix('tooling/gates/tancament.mjs')).toContain('chat_title_suggestion');
    expect(llegix('tooling/tests/node-suite-manifest.json')).toContain('tests/tractor-tokens-multilinia.r29.test.mjs');
    // La veu, el TPV del Bar i la Gestoria: les proves que reproduïxen cada correcció.
    expect(llegix('src/components/PedraSeca/hooks/useTraduccioPagina.d2.cicle.test.jsx')).toContain('canviar de ruta invalida');
    expect(llegix('src/apps/bar/correccionsOnadaR30.test.jsx')).toMatch(/R30-BAR-01[\s\S]*R30-BAR-02[\s\S]*R30-BAR-03/);
    expect(llegix('src/sections/gestoria/nucli/linealitat.test.js')).toContain('const N = 40000;');
    // NAT-04 · Els quatre permisos d'identitat i de biometria es lleven del manifest fusionat.
    const manifest = llegix('android/app/src/main/AndroidManifest.xml');
    for (const permis of ['USE_BIOMETRIC', 'USE_FINGERPRINT', 'USE_CREDENTIALS', 'GET_ACCOUNTS']) {
      expect(manifest, permis).toContain(`<uses-permission android:name="android.permission.${permis}" tools:node="remove" />`);
    }
  });
});

/* Onada R32 · Crònica d'obertura en les cinc llengües de la versió 1.2.4 (build 9) del repositori, amb el que ha
   aterrat de veres al worktree d'integració després del Gauntlet R32: el Xat que no passa a error quan la sessió es
   renova mentre s'envia (cablejat R30.2), les carpetes noves del Bloc de Notes fora de l'espai reservat i el llegat
   ambigu que no puja (invariants R31), la guia per als assistents d'IA (llms.txt i ard.json), els avisos del Xat
   lligats a la sessió i les 29 funcions amb configuració tancada (SQL aplicat pel Mestre el 16-11-2026), la poda de 28
   classes d'estil i la retirada local del contingut d'una nota eliminada al dispositiu del Mode rural. Llei 0: la 1.2.4
   és la del repositori i la crònica no diu res de les botigues; el connector publicat continua en la 1.1.12; el
   xifratge d'extrem a extrem continua apagat; els avisos no s'han provat en aparells reals i no es nomena cap
   plataforma (2.3.10); cap servidor confirma hui la retirada del dispositiu del Mode rural, i la carpeta de notes no
   la fa mai i en conserva els fitxers; la candidatura NLnet 2026-08-1a6 no va passar la primera selecció i no n'hi ha
   cap al NGI0 Commons Fund; cap promesa de Lighthouse ni de zero avisos. Corrector R32: la crònica no diu que els
   lectors de pantalla separen ara l'hora i la data (l'aria-label ja ho feia), ni que cap carpeta s'amaga davant d'un
   ACK que col·lidix (la guarda només mira les carpetes d'este navegador), ni que la carpeta de notes esborra res. */
describe('Onada R32 · Crònica d’obertura en les cinc llengües amb el Xat, les carpetes del Bloc de Notes, el servidor compartit i Llei 0', () => {
  const PREFIXOS_R32 = {
    ca: ['Novetat', 'Millora', 'Millora', 'Correcció', 'Correcció'],
    es: ['Novedad', 'Mejora', 'Mejora', 'Corrección', 'Corrección'],
    en: ['New', 'Improvement', 'Improvement', 'Fix', 'Fix'],
    eu: ['Berritasuna', 'Hobekuntza', 'Hobekuntza', 'Zuzenketa', 'Zuzenketa'],
    gl: ['Novidade', 'Mellora', 'Mellora', 'Corrección', 'Corrección']
  };
  /* Les cinc migracions que el Mestre va aplicar al servidor compartit el 16-11-2026 (receptari
     261116_sql_produccio_r30_r31, captura 15.03; supabase/migrations/README.md, seccions R30 i R31). */
  const MIGRACIONS_R32 = ['2611110455', '20261115230000', '2611110110', '20261116031000', '20261116040000'];
  /* Onada R32.3 · La R32 és història: la versió d'aquell dia era la 1.2.4 (build 9), i es fixa literal (abans es
     derivava de package.json i de VERSIO_CLIENT_NATIU); la d'ara, 1.2.5 (build 10), la diu la R32.3. */
  const VERSIO_R32 = {
    ca: 'versió 1.2.4 (build 9)', es: 'versión 1.2.4 (build 9)', en: 'version 1.2.4 (build 9)', eu: '1.2.4 bertsiora (9. builda)',
    gl: 'versión 1.2.4 (build 9)'
  };
  const XIFRATGE_APAGAT_R32 = { ca: 'xifratge d’extrem a extrem continua apagat', es: 'cifrado de extremo a extremo sigue apagado', en: 'encryption stays switched off',
    eu: 'zifratzea itzalita dago oraindik', gl: 'cifrado de extremo a extremo segue apagado' };
  const AVISOS_NO_PROVATS = { ca: 'no s’han provat en aparells reals', es: 'no se han probado en aparatos reales', en: 'not yet been tested on real devices',
    eu: 'ez dira oraindik probatu benetako gailuetan', gl: 'non se probaron en aparellos reais' };
  const NLNET_NO_PASSA = { ca: 'no va passar la primera selecció', es: 'no pasó la primera selección', en: 'did not pass the first selection',
    eu: 'ez zuela lehen hautaketa gainditu', gl: 'non pasou a primeira selección' };
  const SENSE_COMMONS_FUND = { ca: 'tampoc no hi ha cap candidatura al NGI0 Commons Fund', es: 'tampoco hay ninguna candidatura al NGI0 Commons Fund',
    en: 'nor is there any application to the NGI0 Commons Fund', eu: 'NGI0 Commons Fund funtsean ere ez dago hautagaitzarik', gl: 'tampouco hai ningunha candidatura ao NGI0 Commons Fund' };
  const CAP_SERVIDOR_RURAL = { ca: 'hui no n’hi ha cap de configurat', es: 'hoy no hay ninguno configurado', en: 'today none is configured',
    eu: 'gaur ez dago bat ere konfiguratuta', gl: 'hoxe non hai ningún configurado' };
  /* Corrector R32 · Llei 0 · Qui retira el contingut és el dispositiu, no la carpeta: la carpeta conserva el Markdown
     d'una nota retirada (invariant 10 de sincronitzadorCarpetaLocal.js). */
  const CARPETA_CONSERVA_RURAL = { ca: 'la carpeta conserva els fitxers d’eixa nota tal com eren', es: 'la carpeta conserva los archivos de esa nota tal como estaban',
    en: 'the folder keeps that note’s files as they were', eu: 'karpetak ohar horren fitxategiak zeuden bezala gordetzen ditu', gl: 'o cartafol conserva os ficheiros desa nota tal como estaban' };
  const CARPETA_ESBORRA_RURAL = /carpeta de notes del Mode rural ja sap|carpeta de notas del Modo rural ya sabe|notes folder of Rural mode can now|oharren karpetak badaki|cartafol de notas do Modo rural xa sabe/i;
  /* Corrector R32 · Llei 0 · Cap promesa absoluta sobre carpetes amagades o fusionades (la guarda per col·lisió només
     mira les carpetes creades en este navegador) ni cap canvi del que diuen els lectors de pantalla al botó de data i
     hora (l'aria-label ja separava l'hora i la data abans de la R32). */
  const PROMESA_COLISIO = /s’amaga ni dues|se oculta ni dos|is hidden and no two|ez da karpetarik ezkutatzen|se agocha nin dous/i;
  const LECTORS_DE_PANTALLA = /lectors de pantalla|lectores de pantalla|screen readers?|pantaila-irakurgailu/i;
  /* Onada R32.4 · Llei 0 · Les set funcions antigues que la R32 deixava «per revisar» les va blindar el Mestre el
     17-11-2026 a les 01:55 CET amb 20261116170000 (certificat CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md;
     supabase/README.md, fila 117): la crònica ho diu en les cinc llengües, i la forma vella no hi torna. */
  const FOSSILS_BLINDATS_R32 = { ca: 's’han blindat el 17 de novembre (1.55)', es: 'se han blindado el 17 de noviembre (1.55)',
    en: 'were tightened on 17 November (01:55)', eu: 'azaroaren 17an blindatu dira (01:55ean)', gl: 'blindáronse o 17 de novembro (1.55)' };
  const FOSSILS_PER_REVISAR_R32 = /per revisar|por revisar|remain to be reviewed|berrikusteke/i;
  /* Onada R32.3 · La crònica R32.3 obri la pàgina: la R32 és la segona. */
  /* Onada R32.4 · La crònica R32.4 obri la pàgina i la R32.3 la seguix: la R32 és la tercera.
     Onada v1.2.7 · I la R32.5 i R32.6 davant de totes: la R32 és la quarta. */
  const blocR32 = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    const inici = iniciDeLaSisena(cos);
    return cos.slice(inici, cos.indexOf('<h3>', inici + 4));
  };

  test('va darrere de la R32.3 i davant de la R30 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i 2.3.10', () => {
    expect(TITOL_FITA_R32).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR32Bloc)).toEqual(expect.arrayContaining(['/xat', '/notes', '/control?fitxa=mode-rural']));
    expect(interns(fitaR32Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R32)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onada R32.3 · La R32.3 obri la pàgina i la R32 la seguix.
      const iniciR32 = iniciDeLaSisena(cos); // Onada R32.4 · La R32.4 i la R32.3 obrin la pàgina.
      expect(obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos))
        && cos.startsWith(`<h3>${iniciTitol}`, iniciR32), llengua).toBe(true);
      const bloc = blocR32(llengua);
      // L'ordre de /versions: R32.3 → R32 → R30 → R29 → R28.
      const iniciR30 = iniciR32 + bloc.length;
      const iniciR29 = cos.indexOf('<h3>', iniciR30 + 4);
      expect(cos.startsWith(`<h3>${INICIS_R30[llengua]}`, iniciR30) && cos.startsWith(`<h3>${INICIS_R29[llengua]}`, iniciR29)
        && cos.startsWith(`<h3>${INICIS_R28[llengua]}`, cos.indexOf('<h3>', iniciR29 + 4)), llengua).toBe(true);
      expect(interns(bloc), llengua).toEqual(interns(fitaR32Bloc));
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R32[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b|\bAPK\b|\bAAB\b/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      // Llei 0 · Cap paraula de les botigues: quan es fa el commit, la 1.2.4 encara no hi ha pujat. El basc declina
      // (denda, dendetan, dendara): l'arrel «dend» + vocal ho cobrix (mutant R32 «dendetan»).
      expect(/botig|tienda|\bstores?\b|\bdend[ae]|tenda/i.test(pla), llengua).toBe(false);
      // Llei 0 · Cap jerga tècnica ni cap promesa de puntuació o d'avisos a zero.
      expect(/\bCAS\b|\bRPC\b|\bDOT\b|search_path|SECURITY DEFINER|\bACK\b|\bE2EE\b|\bCRDT\b|Lighthouse|\b100\s*\/\s*100\b|zero avisos|cero avisos|zero warnings/i.test(pla), llengua).toBe(false);
      expect(pla, llengua).toContain(VERSIO_R32[llengua]);
      // Onada R32.3 · La versió d'ara (1.2.5) no és la de la R32: la diu la R32.3.
      expect(pla).not.toContain(PAQUET.version);
      expect(pla).toContain(CONNECTOR_PUBLICAT);
      expect(pla).not.toContain('1.2.3');
      for (const migracio of MIGRACIONS_R32) expect(pla, `${llengua} · ${migracio}`).toContain(migracio);
      expect(pla, llengua).toContain(XIFRATGE_APAGAT_R32[llengua]);
      expect(pla, llengua).toContain(AVISOS_NO_PROVATS[llengua]);
      expect(pla, llengua).toContain('2026-08-1a6');
      expect(pla, llengua).toContain(NLNET_NO_PASSA[llengua]);
      expect(pla, llengua).toContain(SENSE_COMMONS_FUND[llengua]);
      expect(pla, llengua).toContain(CAP_SERVIDOR_RURAL[llengua]);
      expect(pla, llengua).toContain(CARPETA_CONSERVA_RURAL[llengua]);
      expect(CARPETA_ESBORRA_RURAL.test(pla), llengua).toBe(false);
      expect(PROMESA_COLISIO.test(pla), llengua).toBe(false);
      expect(LECTORS_DE_PANTALLA.test(pla), llengua).toBe(false);
      // La poda és de 28 classes (no 32: quatre eren vives i es conserven) i les 29 funcions són les del repositori.
      expect(pla, llengua).toMatch(/\b28\b/);
      expect(pla, llengua).not.toMatch(/\b32\b/);
      expect(pla, llengua).toMatch(/\b29\b/);
      // Onada R32.4 · Llei 0 · Les set funcions antigues ja s'han blindat.
      expect(pla, llengua).toContain(FOSSILS_BLINDATS_R32[llengua]);
      expect(FOSSILS_PER_REVISAR_R32.test(pla), llengua).toBe(false);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(7);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });

  test('Llei 0 · cada fet té el seu consumidor a l’arbre: versió, migracions, Xat, carpetes, guia, estils, Mode rural i avisos apagats', () => {
    // La versió i el build de la crònica eren els del codi aquell dia (1.2.4, build 9). Onada R32.3 · Ara el codi
    // ja és més nou (la R32.3 diu la 1.2.5 amb el build 10), i la R32 no pot ser posterior a la d'ara.
    expect(noMesNova('1.2.4', PAQUET.version) && PAQUET.version !== '1.2.4').toBe(true);
    expect(VERSIO_CLIENT_NATIU).toBeGreaterThan(9);
    // El xifratge d'extrem a extrem continua apagat: el dia que s'encenga, la crònica s'ha de tornar a escriure.
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    for (const migracio of MIGRACIONS_R32) expect(migracions.some((f) => f.startsWith(`${migracio}_`)), migracio).toBe(true);
    const readme = llegix('supabase/migrations/README.md');
    expect(readme).toContain('**Aplicada a producció** pel Mestre el 16-11-2026');
    expect(readme).toContain('**Totes dues, aplicades a producció** pel Mestre el 16-11-2026');
    // Els avisos lligats a la sessió (es revoquen els de sense sessió i s'esborren en tancar-la), les 29 funcions i el límit per persona.
    const push = llegix('supabase/migrations/20261116031000_r31_push_sessio_i_revocacio.sql');
    expect(push).toContain('delete from public.xat_dispositius_push where sessio_id is null;');
    expect(push).toContain('references auth.sessions(id) on delete cascade');
    expect(llegix('supabase/migrations/20261116040000_r31_definer_search_path.sql')).toContain('-- 29 funcions vigents auditades');
    expect(llegix('supabase/migrations/20261115170000_r29_quotes_rls_i_consens.sql')).toContain('1000 revisions desades per persona');
    // Cap servei d'avisos d'una altra plataforma configurat al repositori: el pont hi és, però el canal continua apagat.
    expect(() => readFileSync(resolve(process.cwd(), 'android/app/google-services.json'))).toThrow();
    // El Xat: una renovació no deixa la bombolla en error, un sol missatge confirmat, i cap «enviat» sense número del servidor.
    const xat = llegix('src/sections/xat/XatContext.cablejatR30_2.test.jsx');
    expect(xat).toContain('executa JWT → refresh → reintent idempotent i conserva un únic missatge confirmat després del relleu');
    expect(xat).toContain('no eleva a enviat un HTTP satisfactori sense seq de servidor');
    // Les carpetes del Bloc de Notes: l'espai reservat i el llegat ambigu que no puja. La guarda per col·lisió és un
    // invariant de codi i no una promesa pública (corrector R32): la crònica no en diu res.
    expect(llegix('src/components/universal/classificacio/carpetesCreades.js')).toContain('export const esIdReservat');
    const migracio = llegix('src/components/universal/classificacio/migracioCarpetesLocals.js');
    expect(migracio).toContain("export const MOTIU_AMBIGUA = 'identificador-reservat-sense-prova-remota';");
    expect(migracio).toContain("export const MOTIU_COLISIO = 'ack-amb-id-d-una-altra-carpeta';");
    // La guia per als assistents d'IA diu el resultat de NLnet i no presenta cap candidatura al Commons Fund.
    const guia = llegix('public/llms.txt');
    expect(guia).toContain('2026-08-1a6, que no va passar la primera selecció');
    expect(guia).not.toMatch(/Commons Fund/);
    expect(JSON.parse(llegix('public/.well-known/ard.json')).entries.every((e) => e.version === PAQUET.version)).toBe(true);
    // Les quatre classes que semblaven mortes i són vives es conserven.
    const moduls = llegix('src/css/modules.css');
    for (const classe of ['.sdp-slash-menu__titol', '.sdp-slash-menu__ajuda', '.sdp-slash-menu__buit', '.sdp-image-link__adreca']) expect(moduls, classe).toContain(classe);
    // El dispositiu del Mode rural: la confirmació remota és opcional i cap certificat de fora s'aplica.
    const sessio = llegix('src/data/sessioRural.js');
    expect(sessio).toContain('`transportCrdtRemot` és opt-in');
    expect(sessio).toContain("certificat que arriba d'una còpia o de la carpeta no s'aplica mai");
    // Corrector R32 · La retirada és del dispositiu: el certificat no viatja per la carpeta i la carpeta conserva el Markdown.
    const sincronitzador = llegix('src/data/sincronitzadorCarpetaLocal.js');
    expect(sincronitzador).toContain('seu ACK remot i no viatja mai per la carpeta');
    expect(sincronitzador).toContain('Es conserva intacte a la carpeta');
  });
});

/* Onada R32.3 · Crònica d'obertura en les cinc llengües de la versió 1.2.5 (build 10) del repositori (ordre T5 R32.3 del
   Mestre de 16-11-2026 22:09), amb el que ha aterrat de veres: l'avís automàtic de versió nova de les aplicacions, el
   Perfil en dues columnes al mòbil, l'eixida de la sessió que torna a provar l'oblit i no tanca la sessió d'una altra
   persona, els apartats d'administració amb «Tornar a provar», l'àlies ?data= del Calendari, el giny d'espai del Panell
   de Control, els cèntims del Rebost d'El Comú, el nom accessible del selector de fitxers i l'alta i la baixa dels
   avisos del Xat. Llei 0: la 1.2.5 és la del repositori i encara no és a les botigues; una de les dues espera la clau
   del compte de servei, i la crònica no en nomena cap plataforma ni cap canal de proves (2.3.10: perAppNativa.test.js
   fixa que de /versions només se'n va l'apartat de la v1.1.0); les aplicacions instal·lades s'han d'actualitzar una
   vegada a mà i l'avís no s'ha provat en un telèfon real; el manifest no promet cap build que el codi no tinga; els
   avisos del Xat no s'han provat en aparells reals i no hi ha cap paraula de Push; cap espai alliberat (la neteja no
   esborra res); les tres migracions R32 no estan aplicades; el connector publicat continua en la 1.1.12; la crònica no
   parla del xifratge; cap promesa de Lighthouse, AAA ni zero avisos.
   Onada R32.4 · La R32.3 ja no obri /versions: va darrere de la R32.4, i la seua versió (1.2.5, build 10) és història i
   es fixa literal. Llei 0: el Mestre va aplicar les tres migracions R32 al servidor compartit el 17-11-2026 a les 01:55
   CET (CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md; supabase/README.md, files 117 a 119), i la crònica ho diu
   en les cinc llengües, com la correcció de la R30 (c11c35806): la forma «encara no s'han aplicat» no hi torna. */
describe('Onada R32.3 · Crònica d’obertura en les cinc llengües amb l’avís de versió nova, el Perfil en dues columnes, l’eixida de la sessió i Llei 0', () => {
  const PREFIXOS_R32_3 = {
    ca: ['Novetat', 'Millora', 'Millora', 'Correcció', 'Correcció', 'Correcció'],
    es: ['Novedad', 'Mejora', 'Mejora', 'Corrección', 'Corrección', 'Corrección'],
    en: ['New', 'Improvement', 'Improvement', 'Fix', 'Fix', 'Fix'],
    eu: ['Berritasuna', 'Hobekuntza', 'Hobekuntza', 'Zuzenketa', 'Zuzenketa', 'Zuzenketa'],
    gl: ['Novidade', 'Mellora', 'Mellora', 'Corrección', 'Corrección', 'Corrección']
  };
  const DICCIONARIS_R32_3 = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  /* Les tres migracions R32. Onada R32.4 · Aplicades pel Mestre el 17-11-2026 a les 01:55 CET (supabase/README.md,
     files 117 a 119, amb el certificat 261117_0155). */
  const MIGRACIONS_R32_3 = ['20261116170000', '20261116170100', '20261116170200'];
  /* Onada R32.4 · La R32.3 és història: la versió d'aquell dia era la 1.2.5 (build 10), i es fixa literal (abans es
     derivava de package.json i de VERSIO_CLIENT_NATIU); la d'ara, 1.2.6 (build 11), la diu la R32.4. */
  const VERSIO_R32_3 = {
    ca: 'versió 1.2.5 (build 10)', es: 'versión 1.2.5 (build 10)', en: 'version 1.2.5 (build 10)', eu: '1.2.5 bertsiora (10. builda)',
    gl: 'versión 1.2.5 (build 10)'
  };
  const NO_BOTIGUES_R32_3 = { ca: 'encara no publicada a les botigues', es: 'todavía no publicada en las tiendas', en: 'not yet published in the stores',
    eu: 'oraindik dendetan argitaratu gabe', gl: 'aínda non publicada nas tendas' };
  /* Llei 0 · Una de les dues botigues encara no té el build 10: falta la clau del compte de servei. Es diu sense nomenar
     la plataforma (2.3.10). */
  const CLAU_PENDENT_R32_3 = { ca: 'encara espera la clau del compte de servei', es: 'todavía espera la clave de la cuenta de servicio',
    en: 'is still waiting for the service account key', eu: 'zerbitzu-kontuaren gakoa itxaroten du oraindik', gl: 'aínda espera a chave da conta de servizo' };
  /* Onada R32.4 · Llei 0 · Les tres migracions ja s'han aplicat (17-11-2026, 01:55 CET), amb el dia i l'hora en cada
     llengua; la forma d'abans, «encara no s'han aplicat», no hi torna. */
  const NO_APLICADES_R32_3 = { ca: 'encara no s’han aplicat', es: 'todavía no se han aplicado', en: 'have not yet been applied',
    eu: 'oraindik ez dira aplikatu', gl: 'aínda non se aplicaron' };
  const JA_APLICADES_R32_3 = { ca: 'ja s’han aplicat al servidor compartit (17 de novembre, 1.55)',
    es: 'ya se han aplicado en el servidor compartido (17 de noviembre, 1.55)',
    en: 'have already been applied on the shared server (17 November, 01:55)',
    eu: 'jada aplikatu dira zerbitzari partekatuan (azaroaren 17an, 01:55ean)',
    gl: 'xa se aplicaron no servidor compartido (17 de novembro, 1.55)' };
  /* Llei 0 · L'avís de versió nova: la primera versió que el porta, les instal·lades s'actualitzen una vegada a mà i no
     s'ha provat en un telèfon real. */
  const UNA_VEGADA_A_MA = { ca: 'una vegada a mà', es: 'una vez a mano', en: 'once by hand', eu: 'behin eskuz', gl: 'unha vez a man' };
  const AVIS_NO_PROVAT = { ca: 'no s’ha provat en un telèfon real', es: 'no se ha probado en un teléfono real', en: 'not yet been tested on a real phone',
    eu: 'ez da oraindik probatu benetako telefono batean', gl: 'non se probou nun teléfono real' };
  const AVISOS_XAT_NO_PROVATS = { ca: 'no s’han provat en aparells reals', es: 'no se han probado en aparatos reales', en: 'not yet been tested on real devices',
    eu: 'ez dira oraindik probatu benetako gailuetan', gl: 'non se probaron en aparellos reais' };
  const NO_ESBORRA = { ca: 'no esborra res', es: 'no borra nada', en: 'deletes nothing', eu: 'ez du ezer ezabatzen', gl: 'non borra nada' };
  /* Corrector R32.3 · Llei 0 · L'espai del giny és l'estimació de l'origen (navigator.storage.estimate), que pot incloure
     dades de l'amfitrió (notaHonestaNavegador): la crònica diu «estimació» i «este lloc web», no «l'espai de Sóc de Poble». */
  const ESTIMACIO_ESPAI_R32_3 = { ca: 'estimació de l’espai que ocupa este lloc web en este navegador',
    es: 'estimación del espacio que ocupa este sitio web en este navegador', en: 'estimate of the storage this website uses in this browser',
    eu: 'webgune honek nabigatzaile honetan hartzen duen lekuaren estimazioa', gl: 'estimación do espazo que ocupa este sitio web neste navegador' };
  /* Corrector R32.3 · La primera migració R32 conserva les set funcions i les blinda (supabase/README.md: «conserva totes
     les funcions»): «blinda», no «tanca», i les cinc llengües diuen el mateix. La segona és la del xat propi, amb el nom
     de la crònica R21 («El xat propi», «Your own chat»). */
  const MIGRACIONS_NOMS_R32_3 = {
    ca: ['la que blinda les set funcions antigues', 'la del xat propi'], es: ['la que blinda las siete funciones antiguas', 'la del chat propio'],
    en: ['the one that tightens the seven older functions', 'the one for your own chat'],
    eu: ['zazpi funtzio zaharrak blindatzen dituena', 'txat propioarena'], gl: ['a que blinda as sete funcións antigas', 'a do chat propio']
  };
  /* Corrector R32.3 · Les formes que el corrector ha retirat: la migració que «tanca» les funcions, el fil «del Xat», l'espai
     «de Sóc de Poble» i, en basc, el recíproc amb auxiliar intransitiu i el «saiatu» sense objecte. */
  const FRASES_CORREGIDES_R32_3 = /tanca les set|cierra las siete|ixten dituena|pecha as sete|Chat’s own thread|fil propi del Xat|hilo propio del Chat|fío propio do Chat|Txataren hari|ocupa Sóc de Poble|Sóc de Poble takes up|Sóc de Poble-k zenbat|ez dira jada elkar|berriro saiatzen da/i;
  /* Llei 0 · Cap promesa que no siga certa al repositori: ni que l'avís ja arribe a tots els telèfons, ni que la 1.2.5
     ja siga a cap botiga, ni espai alliberat. */
  const PROMESES_FALSES_R32_3 = /tots els telèfons|todos los teléfonos|every phone|all phones|telefono guztietara|todos os teléfonos|ja publicada|ya publicada|already published|argitaratuta dago|xa publicada|alliberat|liberado|freed|askatu|liberou/i;
  /* Corrector R32.3 · TRV-02 · Llei 0 · Els noms de la columna PERFIL tenen -webkit-line-clamp: 3 (modules.css): un nom
     que no hi cap es continua tallant. La crònica diu el límit, «fins a tres línies abans de tallar-se», amb el mateix
     sentit en les cinc llengües. */
  const NOMS_PERFIL_R32_3 = { ca: 'Els noms ocupen fins a tres línies abans de tallar-se',
    es: 'Los nombres ocupan hasta tres líneas antes de cortarse', en: 'Names take up to three lines before they are cut off',
    eu: 'Izenek gehienez hiru lerro hartzen dituzte moztu aurretik', gl: 'Os nomes ocupan ata tres liñas antes de cortarse' };
  /* I la forma absoluta que el corrector ha retirat no hi torna en cap llengua. */
  const NOMS_SENSE_TALL_R32_3 = /no es tallen|no se tallen|no se cortan|non se cortan|no longer cut|never cut|are not cut|aren’t cut|aren't cut|ez dira (?:jada )?mozten|ez da (?:jada )?mozten|sencers|enteros|in full|osorik|enteiros/i;
  const cometes =(llengua, frase) => (llengua === 'en' ? `“${frase}”` : `«${frase}»`);
  /* Onada R32.4 · La crònica R32.4 obri la pàgina: la R32.3 és la segona.
     Onada v1.2.7 · I la R32.5 i R32.6 davant de totes: la R32.3 és la tercera. */
  const blocR32_3 = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    return cos.slice(iniciDeLaCinquena(cos), iniciDeLaSisena(cos));
  };

  test('va darrere de la R32.4 i davant de la R32 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i 2.3.10', () => {
    expect(TITOL_FITA_R32_3).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR32_3Bloc)).toEqual(expect.arrayContaining(['/el-meu-perfil', '/control', '/calendari', '/xat']));
    expect(interns(fitaR32_3Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R32_3)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onada R32.4 · La R32.4 obri la pàgina i la R32.3 la seguix. Onada v1.2.7 · I la R32.5 i R32.6 davant de totes.
      expect(obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${iniciTitol}`, iniciDeLaCinquena(cos)), llengua).toBe(true);
      const bloc = blocR32_3(llengua);
      // L'ordre de /versions: R32.4 → R32.3 → R32 → R30.
      const iniciR32 = iniciDeLaCinquena(cos) + bloc.length;
      expect(cos.startsWith(`<h3>${INICIS_R32[llengua]}`, iniciR32)
        && cos.startsWith(`<h3>${INICIS_R30[llengua]}`, cos.indexOf('<h3>', iniciR32 + 4)), llengua).toBe(true);
      expect(interns(bloc), llengua).toEqual(interns(fitaR32_3Bloc));
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R32_3[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      // 2.3.10 · Cap altra plataforma mòbil, cap botiga nomenada ni cap canal de proves.
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b|\bAPK\b|\bAAB\b|F-Droid/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      // Llei 0 · Cap jerga tècnica, cap paraula de Push i cap promesa de puntuació o d'avisos a zero.
      expect(/\bCAS\b|\bRPC\b|search_path|SECURITY DEFINER|\bACK\b|\bE2EE\b|\bCRDT\b|\bPush\b|\bFCM\b|\bAPNs\b|\bVAPID\b|Lighthouse|\bAAA\b|\b100\s*\/\s*100\b|zero avisos|cero avisos|zero warnings/i.test(pla), llengua).toBe(false);
      // Llei 0 · La crònica no parla del xifratge d'extrem a extrem (continua apagat; el diu la R32).
      expect(/xifra|cifrad|encrypt|zifra/i.test(pla), llengua).toBe(false);
      expect(PROMESES_FALSES_R32_3.test(pla), llengua).toBe(false);
      // La versió i el build del repositori, encara no a les botigues, i la clau que falta per a una d'elles.
      expect(pla, llengua).toContain(VERSIO_R32_3[llengua]);
      expect(pla).not.toContain('1.2.4');
      // Onada R32.4 · La versió d'ara (1.2.6) no és la de la R32.3: la diu la R32.4.
      expect(pla).not.toContain(PAQUET.version);
      expect(pla, llengua).toContain(NO_BOTIGUES_R32_3[llengua]);
      expect(pla, llengua).toContain(CLAU_PENDENT_R32_3[llengua]);
      expect(pla).toContain(CONNECTOR_PUBLICAT);
      for (const migracio of MIGRACIONS_R32_3) expect(pla, `${llengua} · ${migracio}`).toContain(migracio);
      // Onada R32.4 · Llei 0 · Ja s'han aplicat, amb el dia i l'hora; la forma d'abans no hi torna.
      expect(pla, llengua).toContain(JA_APLICADES_R32_3[llengua]);
      expect(pla, llengua).not.toContain(NO_APLICADES_R32_3[llengua]);
      expect(pla, llengua).toContain(UNA_VEGADA_A_MA[llengua]);
      expect(pla, llengua).toContain(AVIS_NO_PROVAT[llengua]);
      expect(pla, llengua).toContain(AVISOS_XAT_NO_PROVATS[llengua]);
      expect(pla, llengua).toContain(NO_ESBORRA[llengua]);
      // Corrector R32.3 · L'espai és una estimació del lloc web; la primera migració blinda i la segona és la del xat propi.
      expect(pla, llengua).toContain(ESTIMACIO_ESPAI_R32_3[llengua]);
      for (const nom of MIGRACIONS_NOMS_R32_3[llengua]) expect(pla, `${llengua} · ${nom}`).toContain(nom);
      expect(FRASES_CORREGIDES_R32_3.test(pla), llengua).toBe(false);
      // Corrector R32.3 · TRV-02 · Els noms del Perfil mòbil: el límit de tres línies, mai «ja no es tallen».
      expect(pla, llengua).toContain(NOMS_PERFIL_R32_3[llengua]);
      expect(NOMS_SENSE_TALL_R32_3.test(pla), llengua).toBe(false);
      expect(pla).toContain('?data=');
      expect(pla).toContain('?date=');
      // Els noms que es veuen a la pantalla són els dels diccionaris i del giny, en cada llengua.
      const diccionari = DICCIONARIS_R32_3[llengua];
      for (const clau of ['section.perfil.shell.categories', 'section.perfil.shell.items', 'section.perfil.shell.reintenta']) {
        expect(diccionari[clau], `${llengua} · ${clau}`).toBeTruthy();
        expect(pla, `${llengua} · ${clau}`).toContain(cometes(llengua, diccionari[clau]));
      }
      expect(pla, llengua).toContain(cometes(llengua, TEXTOS_SALUT_DISPOSITIU[llengua].titolSeccio));
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(8);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });

  test('Llei 0 · cada fet té el seu consumidor a l’arbre: versió, avís de versió nova, Perfil, eixida, administració, Calendari, espai, Rebost, editor, avisos, migracions i clau', async () => {
    // La versió i el build de la crònica eren els del codi aquell dia (1.2.5, build 10). Onada R32.4 · Ara el codi ja
    // és més nou (la R32.4 diu la 1.2.6 amb el build 11), i la R32.3 no pot ser posterior a la d'ara.
    expect(noMesNova('1.2.5', PAQUET.version) && PAQUET.version !== '1.2.5').toBe(true);
    expect(VERSIO_CLIENT_NATIU).toBeGreaterThan(10);
    // L'avís de versió nova: el detector natiu llig el manifest públic i el pinta la barra de sempre.
    const detector = llegix('src/natiu/actualitzacioAppNativa.js');
    expect(detector).toContain('export const URL_MANIFEST_VERSIO = `${ORIGEN_PUBLIC_PER_DEFECTE}/.well-known/ard.json`;');
    expect(detector).toContain("export const CAMP_BUILD = Object.freeze({ android: 'androidBuild', ios: 'iosBuild' });");
    expect(llegix('src/natiu/entrada.jsx')).toContain('iniciaActualitzacioAppNativa({');
    expect(RUTES).toContain('BarraActualitzacioRecomanada');
    for (const [llengua, diccionari] of Object.entries(DICCIONARIS_R32_3)) expect(diccionari['natiu.actualitzacioRecomanada.titol'], llengua).toBeTruthy();
    // Llei 0 · El manifest mai promet un build que el codi no té (androidBuild i iosBuild, al sòl verificable fins que
    // el Mestre confirme el de cada botiga), i la versió és la del paquet.
    const ard = JSON.parse(llegix('public/.well-known/ard.json'));
    expect(ard.version).toBe(PAQUET.version);
    for (const camp of ['androidBuild', 'iosBuild']) {
      expect(Number.isInteger(ard[camp]) && ard[camp] >= 1 && ard[camp] <= VERSIO_CLIENT_NATIU, camp).toBe(true);
    }
    // El Perfil en dues columnes al mòbil, sense el vel fosc, amb el parell de botons i la banda de qui són els apartats.
    expect(llegix('src/sections/profile/PerfilShell.jsx')).toContain('duesColumnesEstret={true}');
    expect(llegix('src/components/layout/graella.js')).toContain('duesColumnesEstret');
    expect(llegix('src/components/layout/AppGridShell.css')).toContain('[data-dues-columnes="true"][data-panell="left"] .app-grid-backdrop');
    const workspace = llegix('src/components/universal/workspace/UniversalWorkspace.jsx');
    expect(workspace).toContain('sdp-workspace-context-actiu');
    expect(workspace).toContain('PanelLeftOpen');
    // Corrector R32.3 · TRV-02 · «Fins a tres línies abans de tallar-se»: la regla de dues columnes deixa els noms de
    // PERFIL en tres línies, i la regla base hi posa l'overflow amagat i els punts suspensius.
    const modulsCss = llegix('src/css/modules.css');
    const regla = (selector) => {
      const inici = modulsCss.indexOf(`${selector} {`);
      expect(inici, selector).toBeGreaterThanOrEqual(0);
      return modulsCss.slice(inici, modulsCss.indexOf('}', inici));
    };
    const nomsPerfil = regla('.app-grid-shell[data-layout="estret"][data-dues-columnes="true"][data-panell="left"] .sdp-workspace-groups .sdp-workspace-nav-item__label');
    expect(nomsPerfil).toContain('-webkit-line-clamp: 3;');
    expect(nomsPerfil).toContain('\n  line-clamp: 3;');
    expect(regla('\n.sdp-workspace-nav-item__label')).toContain('text-overflow: ellipsis;');
    // L'eixida de la sessió: l'oblit marcat abans d'esperar, i cap revocació de la sessió d'una altra persona.
    const sessio = llegix('src/app/contexts/SessionContext.jsx');
    expect(sessio).toContain('capturaSessio');
    expect(sessio).toContain("const PREFIX_OBLIT_TITOLS_IAIA = 'iaia-titols-oblit-pendent:';");
    expect(llegix('src/sections/multimedia/marcaOblitCarpetesLocals.js')).toContain('export function creaCarregadorOblitCarpetesLocals');
    expect(llegix('src/app/contexts/SessionContext.eixidaSessioNovaR32.test.jsx')).toContain('una altra persona entra durant la sincronització final: no es revoca la seua sessió');
    // Els apartats d'administració: la barrera només es queda el tros que no arriba, amb el reintent.
    const perfil = llegix('src/sections/profile/PerfilShell.jsx');
    expect(perfil).toContain("reintenta: p('reintenta', 'Tornar a provar')");
    expect(perfil).toContain('nomesTransport');
    // El Calendari: l'àlies ?data= de ?date=.
    expect(llegix('src/sections/calendari/useEstatCalendari.js')).toContain('const date = dateCanonic ?? dataAlias;');
    // L'espai del navegador al Panell de Control, sense cap productor que permeta esborrar res.
    expect(llegix('src/sections/control/ControlSection.jsx')).toContain('<GinySalutDispositiuJarvis idioma={idioma} />');
    const salut = llegix('src/data/salutEmmagatzematgeDispositiu.js');
    const { creaServeiSalutEmmagatzematgeDispositiu } = await import('../../data/salutEmmagatzematgeDispositiu.js');
    const eliminaCache = vi.fn(), desaRebut = vi.fn();
    const serveiSalut = creaServeiSalutEmmagatzematgeDispositiu({
      memories: { keys: async () => [], delete: eliminaCache },
      magatzemHistorial: { posa: desaRebut }
    });
    expect(await serveiSalut.purgaMemoriaCauRegenerable()).toMatchObject({ estat: 'bloquejat', bytesEliminats: 0, entradesEliminades: 0, historialDesat: null });
    expect(eliminaCache).not.toHaveBeenCalled();
    expect(desaRebut).not.toHaveBeenCalled();
    serveiSalut.tanca();
    // Corrector R32.3 · L'espai és l'estimació de l'origen, i el giny avisa que pot incloure dades de l'amfitrió.
    expect(salut).toContain('await navegador.storage.estimate()');
    expect(TEXTOS_SALUT_DISPOSITIU.ca.notaHonestaNavegador).toContain('l’estimació de l’espai que utilitza este lloc web');
    expect(TEXTOS_SALUT_DISPOSITIU.ca.notaHonestaNavegador).toContain('pot incloure dades de l’amfitrió');
    // Els cèntims del Rebost, amb mil·lèsimes enteres; el nom accessible del selector de fitxers de l'editor.
    expect(llegix('src/components/PedraSeca/UniversalListCard/modes/rebost.js')).toContain('(BigInt(mil) * BigInt(preu) + 500n) / 1000n');
    expect(llegix('src/components/universal/UniversalEditorShell.jsx')).toContain('aria-label={editLabel}');
    // L'alta i la baixa dels avisos del Xat sense carreres (proves de codi, no d'aparells).
    expect(llegix('src/natiu/avisosPushNatius.r322.test.js')).toContain('A activa → baixa → B activa');
    // Les tres migracions R32: al repositori i, Onada R32.4, aplicades pel Mestre el 17-11-2026 a les 01:55 CET.
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    const readme = llegix('supabase/README.md');
    for (const migracio of MIGRACIONS_R32_3) {
      expect(migracions.some((f) => f.startsWith(`${migracio}_`)), migracio).toBe(true);
      expect(readme, migracio).toMatch(new RegExp(`\\| \`${migracio}\` \\| [^|]+ \\| Aplicada a producció el 17-11-2026 a les 01:55 CET pel Mestre`));
      expect(readme, migracio).not.toMatch(new RegExp(`\\| \`${migracio}\` \\| [^|]+ \\| \\*\\*NO aplicada`));
    }
    // Corrector R32.3 · La primera conserva les set funcions i les blinda; la segona és la del xat propi (self).
    expect(readme).toContain('La migració **conserva totes les funcions**');
    expect(llegix('supabase/migrations/20261116170000_r32_fossils_search_path.sql')).toContain('No function, trigger, row, ACL or ownership is deleted.');
    expect(llegix('supabase/migrations/20261116170100_r32_xat_propi_rebase_r24.sql')).toContain('Additive 2611121630 rebase onto R24: self schema');
    // La pujada automàtica que espera la clau del compte de servei.
    expect(llegix('scripts/botigues/puja-android.mjs')).toContain('falta la clau del compte de servei (SDP_PLAY_JSON_KEY_PATH)');
  });
});

/* Onada R32.4 · Crònica d'obertura en les cinc llengües de la versió 1.2.6 (build 11) del repositori (ordre directa del
   Mestre del 17-11-2026, Onada v1.2.6, Carril 1 Claude), amb el que ha aterrat de veres al worktree d'integració: de
   Codex, els tractors que fallen tancats, l'aritmètica exacta del TPV del Bar i de la Gestoria i l'estat accessible
   mentre carrega un apartat del Perfil; de Gemini, la pàgina /page/sistema-nervios, la barra negra sense el botó
   d'Idioma, l'idioma i l'eixida al calaix «Amb qui actues?» i al Perfil, les Aplicacions com a un sol enllaç i les icones
   de l'Administració del sistema sense emoticona; i les cinc migracions que el Mestre va aplicar al servidor compartit el
   17-11-2026 a les 01:55 CET (supabase/README.md, files 109, 110 i 117 a 119). Llei 0: la 1.2.6 és la del repositori i
   de les botigues només se'n diu la previsió, sense cap nom de plataforma, de botiga, de canal ni de paquet (2.3.10);
   la pujada automàtica a una de les dues espera la clau del compte de servei; el connector publicat continua en la
   1.1.12; el TPV i la Gestoria continuen en proves, no són programes homologats i no envien res a VeriFactu (cap
   petició de xarxa al seu codi); la crònica no parla del xifratge ni de Push, ni promet Lighthouse, AAA ni zero
   avisos. */
describe('Onada R32.4 · Crònica d’obertura en les cinc llengües amb l’idioma i l’eixida al calaix, les Aplicacions en un sol enllaç, comptes exactes, cinc migracions i Llei 0', () => {
  const PREFIXOS_R32_4 = {
    ca: ['Novetat', 'Millora', 'Millora', 'Millora', 'Correcció', 'Correcció', 'Correcció', 'Correcció'],
    es: ['Novedad', 'Mejora', 'Mejora', 'Mejora', 'Corrección', 'Corrección', 'Corrección', 'Corrección'],
    en: ['New', 'Improvement', 'Improvement', 'Improvement', 'Fix', 'Fix', 'Fix', 'Fix'],
    eu: ['Berritasuna', 'Hobekuntza', 'Hobekuntza', 'Hobekuntza', 'Zuzenketa', 'Zuzenketa', 'Zuzenketa', 'Zuzenketa'],
    gl: ['Novidade', 'Mellora', 'Mellora', 'Mellora', 'Corrección', 'Corrección', 'Corrección', 'Corrección']
  };
  /* Llei 0 · Els títols del Perfil a 320 px: només els noms del sistema (el break-word es queda per a les dades de
     cada persona), i cap promesa que cap títol no es talle mai. */
  const TITOLS_320_R32_4 = { ca: 'a 320 píxels les paraules llargues dels noms del sistema', es: 'a 320 píxeles las palabras largas de los nombres del sistema',
    en: 'at 320 pixels the long words in the system names', eu: '320 pixeletan sistemaren izenetako hitz luzeak', gl: 'a 320 píxeles as palabras longas dos nomes do sistema' };
  const MAI_ES_TALLEN_R32_4 = /mai no es|nunca se|never|inoiz ez|nunca|cap títol|ningún título|no title|ningún título/i;
  const DICCIONARIS_R32_4 = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  /* Les cinc migracions aplicades pel Mestre el 17-11-2026 a les 01:55 CET, en l'ordre del certificat. */
  const MIGRACIONS_R32_4 = ['20261116170200', '20261116170000', '20261114060000', '20261114061000', '20261116170100'];
  const CERTIFICAT_R32_4 = '../_investigacio_ia_de_poble/261117_sql_produccio_r32/CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md';
  /* Onada v1.2.7 · La R32.4 és història: la versió d'aquell dia era la 1.2.6 (build 11), i es fixa literal (abans es
     derivava de package.json i de VERSIO_CLIENT_NATIU); la d'ara, 1.2.7 (build 12), la diu la R32.5 i R32.6. */
  const VERSIO_R32_4 = {
    ca: 'versió 1.2.6 (build 11)', es: 'versión 1.2.6 (build 11)', en: 'version 1.2.6 (build 11)', eu: '1.2.6 bertsiora (11. builda)',
    gl: 'versión 1.2.6 (build 11)'
  };
  /* Llei 0 · De les botigues, només la previsió: quan s'escriu, la 1.2.6 no consta a cap. Sense nomenar plataformes. */
  const PREVISIO_BOTIGUES_R32_4 = {
    ca: ['Està previst pujar-la al canal de proves d’una de les dues botigues', 'paquets signats per a l’altra'],
    es: ['Está previsto subirla al canal de pruebas de una de las dos tiendas', 'paquetes firmados para la otra'],
    en: ['The plan is to upload it to the testing channel of one of the two stores', 'signed packages for the other'],
    eu: ['Bi dendetako baten proba-kanalera igotzea', 'sinatutako paketeak prestatzea aurreikusita dago'],
    gl: ['Está previsto subila á canle de probas dunha das dúas tendas', 'paquetes asinados para a outra']
  };
  const CLAU_PENDENT_R32_4 = { ca: 'encara espera la clau del compte de servei', es: 'todavía espera la clave de la cuenta de servicio',
    en: 'is still waiting for the service account key', eu: 'zerbitzu-kontuaren gakoa itxaroten du oraindik', gl: 'aínda espera a chave da conta de servizo' };
  /* Llei 0 · Cap promesa que no siga certa quan s'escriu: ni que una botiga ja la tinga ni que ja siga publicada. */
  const PROMESES_FALSES_R32_4 = /ja publicada|ya publicada|already published|argitaratuta dago|xa publicada|ja és a la botiga|ya está en la tienda|is already in|ha rebut|ha recibido|has received|jaso du|recibiu|alliberat|liberado|freed/i;
  const MIGRACIONS_APLICADES_R32_4 = {
    ca: ['El 17 de novembre (1.55) s’han aplicat al servidor compartit cinc migracions', 'que ja hi era des del 14 de novembre i s’ha tornat a passar'],
    es: ['El 17 de noviembre (1.55) se han aplicado en el servidor compartido cinco migraciones', 'que ya estaba desde el 14 de noviembre y se ha vuelto a pasar'],
    en: ['On 17 November (01:55) five migrations were applied on the shared server', 'which was already there since 14 November and has been run again'],
    eu: ['Azaroaren 17an (01:55ean) bost migrazio aplikatu dira zerbitzari partekatuan', 'azaroaren 14tik bazegoena eta berriro exekutatu dena'],
    gl: ['O 17 de novembro (1.55) aplicáronse no servidor compartido cinco migracións', 'que xa estaba desde o 14 de novembro e pasouse de novo']
  };
  /* El calaix «Amb qui actues?» (títol de CalaixIdentitats.jsx, en valencià a totes les llengües) i els seus dos botons,
     amb el text de cada llengua (useIdentitatDeLaBarra.js). */
  const BOTONS_CALAIX_R32_4 = {
    ca: ['Idioma del sistema', 'Eixir de Sóc de Poble'], es: ['Idioma del sistema', 'Salir de Sóc de Poble'],
    en: ['System language', 'Sign out of Sóc de Poble'], eu: ['Sistemaren hizkuntza', 'Irten Sóc de Pobletik'],
    gl: ['Idioma do sistema', 'Saír de Sóc de Poble']
  };
  const BETA_I_VERIFACTU_R32_4 = {
    ca: ['no són programes homologats', 'no envien res a VeriFactu'], es: ['no son programas homologados', 'no envían nada a VeriFactu'],
    en: ['not certified software', 'send nothing to VeriFactu'], eu: ['ez dira programa homologatuak', 'ez diote ezer bidaltzen VeriFactu-ri'],
    gl: ['non son programas homologados', 'non envían nada a VeriFactu']
  };
  const cometes = (llengua, frase) => (llengua === 'en' ? `“${frase}”` : `«${frase}»`);
  /* Onada v1.2.7 · La crònica R32.5 i R32.6 obri la pàgina: la R32.4 és la segona. */
  const blocR32_4 = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    return cos.slice(iniciDeLaQuarta(cos), iniciDeLaCinquena(cos));
  };

  test('va darrere de la R32.5 i R32.6 i davant de la R32.3 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i 2.3.10', () => {
    expect(TITOL_FITA_R32_4).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR32_4Bloc)).toEqual(expect.arrayContaining(['/el-meu-perfil', '/wikidepoble?item=sistema_nervios_skills_i_repositoris']));
    expect(interns(fitaR32_4Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R32_4)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onada v1.2.7 · La R32.5 i R32.6 obri la pàgina i la R32.4 la seguix. Onada v1.2.8 · I la R32.7, R32.8 i R32.9 davant de totes.
      expect(obriR32_12R32_8iR32_5(cos, llengua) && cos.startsWith(`<h3>${iniciTitol}`, iniciDeLaQuarta(cos)), llengua).toBe(true);
      const bloc = blocR32_4(llengua);
      // L'ordre de /versions: R32.5 i R32.6 → R32.4 → R32.3 → R32.
      expect(cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaQuarta(cos) + bloc.length)
        && cos.startsWith(`<h3>${INICIS_R32[llengua]}`, iniciDeLaSisena(cos)), llengua).toBe(true);
      expect(interns(bloc), llengua).toEqual(interns(fitaR32_4Bloc));
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R32_4[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      // 2.3.10 · Cap altra plataforma mòbil, cap botiga nomenada, cap canal de proves ni cap format de paquet.
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b|\bAPK\b|\bAAB\b|F-Droid/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      // Llei 0 · Cap jerga tècnica, cap paraula de Push ni del xifratge, i cap promesa de puntuació o d'avisos a zero.
      expect(/\bCAS\b|\bRPC\b|search_path|SECURITY DEFINER|\bRLS\b|BigInt|role="status"|\bACK\b|\bE2EE\b|\bCRDT\b|\bPush\b|\bFCM\b|\bAPNs\b|\bVAPID\b|Lighthouse|\bAAA\b|\b100\s*\/\s*100\b|zero avisos|cero avisos|zero warnings/i.test(pla), llengua).toBe(false);
      expect(/xifra|cifrad|encrypt|zifra/i.test(pla), llengua).toBe(false);
      expect(PROMESES_FALSES_R32_4.test(pla), llengua).toBe(false);
      // La versió i el build del repositori; de les botigues, la previsió i la clau que falta.
      expect(pla, llengua).toContain(VERSIO_R32_4[llengua]);
      expect(pla).not.toContain('1.2.5');
      // Onada v1.2.7 · La versió d'ara (1.2.7) no és la de la R32.4: la diu la R32.5 i R32.6.
      expect(pla).not.toContain(PAQUET.version);
      for (const frase of PREVISIO_BOTIGUES_R32_4[llengua]) expect(pla, `${llengua} · ${frase}`).toContain(frase);
      expect(pla, llengua).toContain(CLAU_PENDENT_R32_4[llengua]);
      expect(pla).toContain(CONNECTOR_PUBLICAT);
      // Les cinc migracions, aplicades el 17 de novembre a la 1.55, i la del 14 de novembre, tornada a passar.
      for (const migracio of MIGRACIONS_R32_4) expect(pla, `${llengua} · ${migracio}`).toContain(migracio);
      for (const frase of MIGRACIONS_APLICADES_R32_4[llengua]) expect(pla, `${llengua} · ${frase}`).toContain(frase);
      // El calaix, els seus dos botons i l'avís de càrrega del Perfil: els textos que es veuen a la pantalla.
      expect(pla, llengua).toContain(cometes(llengua, 'Amb qui actues?'));
      for (const boto of BOTONS_CALAIX_R32_4[llengua]) expect(pla, `${llengua} · ${boto}`).toContain(cometes(llengua, boto));
      expect(DICCIONARIS_R32_4[llengua]['section.perfil.shell.carregant'], llengua).toBeTruthy();
      expect(pla, llengua).toContain(cometes(llengua, DICCIONARIS_R32_4[llengua]['section.perfil.shell.carregant']));
      // La pàgina nova, amb el títol que té en cada llengua.
      // La fita històrica R32.4 conserva el títol localitzat d'aquella entrega.
      const titolsHistorics = { ca: 'El Sistema Nerviós de Sóc de Poble', es: 'El Sistema Nervioso de Sóc de Poble', en: 'The Nervous System of Sóc de Poble', eu: 'Sóc de Pobleren Nerbio Sistema', gl: 'O Sistema Nervioso de Sóc de Poble' };
      expect(pla, llengua).toContain(titolsHistorics[llengua]);
      // El TPV i la Gestoria: en proves, sense homologació i sense VeriFactu.
      expect(pla, llengua).toContain(cometes(llengua, TEXTOS_BETA_OBERTA[llengua]));
      for (const frase of BETA_I_VERIFACTU_R32_4[llengua]) expect(pla, `${llengua} · ${frase}`).toContain(frase);
      expect(pla).toMatch(/\b303\b/);
      expect(pla).toMatch(/\b130\b/);
      // El README d'enginyeria i els títols del Perfil a 320 px, amb el seu límit.
      expect(pla).toContain('README');
      expect(pla, llengua).toContain(TITOLS_320_R32_4[llengua]);
      expect(MAI_ES_TALLEN_R32_4.test(pla), llengua).toBe(false);
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(11);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max})`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });

  test('Llei 0 · cada fet té el seu consumidor a l’arbre: versió, tractors, comptes exactes, en proves, Perfil, pàgina, barra, calaix, Aplicacions, icones, migracions i clau', () => {
    // La versió i el build de la crònica eren els del codi aquell dia (1.2.6, build 11). Onada v1.2.7 · Ara el codi ja
    // és més nou (la R32.5 i R32.6 diu la 1.2.7 amb el build 12), i la R32.4 no pot ser posterior a la d'ara.
    expect(noMesNova('1.2.6', PAQUET.version) && PAQUET.version !== '1.2.6').toBe(true);
    expect(VERSIO_CLIENT_NATIU).toBeGreaterThan(11);
    expect(JSON.parse(llegix('public/.well-known/ard.json')).version).toBe(PAQUET.version);
    // El connector publicat a WordPress.org (SVN: tags 1.1.10 i 1.1.12, Stable tag 1.1.12, llegit el 17-11-2026) no és
    // més nou que el del repositori.
    expect(noMesNova(CONNECTOR_PUBLICAT, CONNECTOR), `${CONNECTOR_PUBLICAT} ≤ ${CONNECTOR}`).toBe(true);
    // Codex · Els tractors fallen tancats: absent, buit o il·legible no es certifica.
    const tractors = llegix('tests/tractors-fail-closed.r324.test.mjs');
    for (const cas of ['graella: un CSS absent no es certifica com a contracte coherent', 'tokens: una font de vocabulari buida no és vocabulari verificat',
      'Peix crític: JS invàlid no queda certificat per una cerca lèxica']) expect(tractors, cas).toContain(cas);
    // Codex · Comptes exactes amb enters grans al TPV del Bar i a la Gestoria, amb l'avís quan un import passa del marge.
    expect(llegix('src/apps/bar/nucli/comu.js')).toContain('BigInt(');
    expect(llegix('src/sections/gestoria/nucli/diners.js')).toContain('BigInt(');
    const bar = llegix('src/apps/bar/nucli/aritmetica.r324.test.js');
    expect(bar).toContain('l’IVA de tot el marge segur es desglossa sense multiplicar en coma flotant');
    expect(bar).toContain('el descompte, la divisió i les devolucions conserven els cèntims grans');
    const gestoria = llegix('src/sections/gestoria/impostos/nucli/aritmetica.r324.test.js');
    expect(gestoria).toContain('el 130 no perd un cèntim en un producte intermedi');
    expect(gestoria).toContain('el 303 del Tauler avisa i no dona una xifra insegura');
    // En proves: el TPV sempre, i la Gestoria quan es compila; cap petició de xarxa al seu codi (res a VeriFactu), i la
    // remissió a l'AEAT és del servidor, en una fase futura.
    expect(PLUGINS.find((p) => p.id === 'tpv')?.estat).toBe(ESTAT_PROVES);
    expect(llegix('src/sections/plugins/registrePlugins.js')).toContain('estat: GESTORIA_COMPILADA ? ESTAT_PROVES : null');
    const fontsDe = (carpeta) => readdirSync(resolve(process.cwd(), carpeta), { recursive: true })
      .map((f) => `${carpeta}/${String(f)}`).filter((f) => /\.(?:js|jsx|mjs)$/.test(f) && !/\.test\./.test(f));
    const ambXarxa = [...fontsDe('src/sections/gestoria'), ...fontsDe('src/apps/bar')]
      .filter((f) => /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket/.test(llegix(f)));
    expect(ambXarxa).toEqual([]);
    expect(llegix('src/sections/gestoria/facturacio/registre/port.js')).toContain("la remissió a l'AEAT la fa el servidor, mai el navegador");
    // Codex · L'avís de càrrega del Perfil és una regió d'estat.
    expect(llegix('src/sections/profile/PerfilShell.jsx')).toContain('<Suspense fallback={<p role="status">{tradueix(t, TEXTOS_PERFIL_SHELL.carregant)}</p>}>');
    // R32.9 fusiona la pàgina històrica al llibre; la ruta compartida continua viva.
    expect(PAGE_COPY['sistema-nervios']).toBeUndefined();
    expect(llegix('src/config/navigation.js')).toContain("'sistema-nervios': '/wikidepoble?item=sistema_nervios_skills_i_repositoris'");
    // Gemini · La barra negra ja no porta el botó d'Idioma.
    expect(RUTES).not.toContain("aria-label={t('nav.idioma', 'Idioma')}");
    // Gemini · El calaix «Amb qui actues?» porta l'idioma i l'eixida, amb el text de cada llengua.
    const calaix = llegix('src/components/universal/identitat/CalaixIdentitats.jsx');
    expect(calaix).toContain('titol="Amb qui actues?"');
    expect(calaix).toContain('onClick={onIdioma}');
    expect(calaix).toContain('onClick={onEixir}');
    // v1.2.6 · Els rètols del peu del calaix viuen als diccionaris (claus topbar.identitat.*), fora de l'entrada del connector.
    const barra = llegix('src/components/universal/identitat/useIdentitatDeLaBarra.js');
    expect(barra).toContain("'topbar.identitat.idioma'");
    expect(barra).toContain("'topbar.identitat.eixir'");
    for (const [llengua, [idioma, eixir]] of Object.entries(BOTONS_CALAIX_R32_4)) {
      const diccionari = llegix(`src/config/idiomes/${llengua}.js`);
      expect(diccionari, llengua).toContain(`'topbar.identitat.idioma': '${idioma}'`);
      expect(diccionari, llengua).toContain(`'topbar.identitat.eixir': '${eixir}'`);
    }
    // Gemini · L'idioma i l'eixida, també apartats del Perfil; les Aplicacions, una sola entrada; l'Administració, sense emoticona.
    const model = llegix('src/sections/profile/perfilModel.js');
    expect(model).toContain("data: { vista: 'idioma'");
    expect(model).toContain("data: { vista: 'eixir'");
    expect(model).toContain("export const ID_APLICACIONS = 'aplicacions';");
    expect(model).toContain("label: 'Aplicacions',");
    expect(model).toContain("label: 'Administració del sistema',");
    const apartats = itemsDAdministracioSistema();
    expect(apartats.length).toBeGreaterThan(0);
    for (const apartat of apartats) {
      expect(/\p{Extended_Pictographic}/u.test(apartat.title), apartat.title).toBe(false);
      expect(apartat.icon, apartat.title).toBeTruthy();
    }
    // El README d'enginyeria de l'arrel, per a equips tècnics externs.
    expect(llegix('README.md')).toContain("README d'enginyeria per a equips tècnics externs");
    // Els títols dels apartats del Perfil en dues columnes: lletra estreta fins a 359 px de contenidor (D-R32.3-PIXEL).
    const modulsCss = llegix('src/css/modules.css');
    const blocs359 = modulsCss.split('@container sdp-arrel (max-width: 359px) {').slice(1).map((b) => b.slice(0, b.indexOf('\n}')));
    expect(blocs359.some((b) => b.includes('.sdp-gestor-fitxa__titol {') && b.includes('font-stretch: var(--sdp-font-amplada-estreta);'))).toBe(true);
    // Les cinc migracions: al repositori i aplicades pel Mestre el 17-11-2026 a les 01:55 CET, amb el certificat.
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    const readme = llegix('supabase/README.md');
    expect(readme).toContain(CERTIFICAT_R32_4);
    for (const migracio of MIGRACIONS_R32_4) {
      expect(migracions.some((f) => f.startsWith(`${migracio}_`)), migracio).toBe(true);
      const fila = readme.split('\n').find((l) => l.startsWith(`| `) && l.includes(` | \`${migracio}\` | `)) ?? '';
      expect(fila, migracio).toContain('17-11-2026 a les 01:55 CET');
      expect(fila, migracio).not.toMatch(/\*\*NO aplicada/);
    }
    // La pujada automàtica que espera la clau del compte de servei.
    expect(llegix('scripts/botigues/puja-android.mjs')).toContain('falta la clau del compte de servei (SDP_PLAY_JSON_KEY_PATH)');
  });
});

/* Onada v1.2.7 · Crònica d'obertura en les cinc llengües de la versió 1.2.7 (build 12) del repositori (ordre del Mestre
   del 17-11-2026, Carril 1 Claude), amb el que ha aterrat de veres al worktree d'integració (git diff 65b53edd5): les
   Onades R32.5 i R32.6 i l'avís d'un toc P0-123. Llei 0: la 1.2.7 no consta a cap botiga quan s'escriu; la migració
   20261117140000 és al repositori i NO s'ha aplicat (l'aplica el Mestre); el resum anual de la Gestoria, la safata LSSI
   i les regles RSVP del Calendari encara no tenen pantalla, i la crònica ho diu (si algú les connecta, la prova de
   consumidors cau i el text s'ha de tornar a escriure); l'avís dels canals de proves arriba «quan es publique» (els
   camps els escriu publica-tot.mjs --sincronitza-proves); els mòbils amb el build 11 o anterior s'actualitzen a mà una
   vegada; l'ona de les notes de veu no és el so real; el mapa 301 no publica cap redirecció. Regla 2.3.10: cap nom de
   plataforma mòbil, de botiga, de canal de proves, de paquet ni de navegador, i tampoc el del proveïdor de l'entrada.
   Cap menció d'homologació, del xifratge, de Push, de WCAG ni d'AAA. */
describe('Onades R32.5 i R32.6 · Crònica d’obertura en les cinc llengües amb l’avís d’un toc, les fotos del Xat, la fase beta, tres peces sense pantalla i Llei 0', () => {
  const PREFIXOS_R32_5 = {
    ca: ['Novetat', 'Novetat', 'Novetat', 'Novetat', 'Novetat', 'Novetat', 'Millora', 'Millora', 'Millora', 'Millora', 'Correcció', 'Correcció', 'Correcció'],
    es: ['Novedad', 'Novedad', 'Novedad', 'Novedad', 'Novedad', 'Novedad', 'Mejora', 'Mejora', 'Mejora', 'Mejora', 'Corrección', 'Corrección', 'Corrección'],
    en: ['New', 'New', 'New', 'New', 'New', 'New', 'Improvement', 'Improvement', 'Improvement', 'Improvement', 'Fix', 'Fix', 'Fix'],
    eu: ['Berritasuna', 'Berritasuna', 'Berritasuna', 'Berritasuna', 'Berritasuna', 'Berritasuna', 'Hobekuntza', 'Hobekuntza', 'Hobekuntza', 'Hobekuntza', 'Zuzenketa', 'Zuzenketa', 'Zuzenketa'],
    gl: ['Novidade', 'Novidade', 'Novidade', 'Novidade', 'Novidade', 'Novidade', 'Mellora', 'Mellora', 'Mellora', 'Mellora', 'Corrección', 'Corrección', 'Corrección']
  };
  /* Onada v1.2.8 · La R32.5 i R32.6 és història: la versió d'aquell dia era la 1.2.7 (build 12), i es fixa literal (abans es
     derivava de package.json i de VERSIO_CLIENT_NATIU); la d'ara, 1.2.8 (build 13), la diu la R32.7, R32.8 i R32.9. */
  const VERSIO_R32_5 = {
    ca: 'versió 1.2.7 (build 12)', es: 'versión 1.2.7 (build 12)', en: 'version 1.2.7 (build 12)', eu: '1.2.7 bertsiora (12. builda)',
    gl: 'versión 1.2.7 (build 12)'
  };
  /* Llei 0 · Quan s'escriu, la 1.2.7 no consta a cap botiga; cap previsió de pujada ni cap nom de plataforma. */
  const NO_BOTIGUES_R32_5 = { ca: 'no consta a cap botiga', es: 'no consta en ninguna tienda', en: 'not listed in any store',
    eu: 'ez dago inongo dendatan', gl: 'non consta en ningunha tenda' };
  /* Llei 0 · La migració LSSI és al repositori i NO s'ha aplicat: l'aplica el Mestre. */
  const MIGRACIO_R32_5 = '20261117140000';
  const NO_APLICADA_R32_5 = { ca: 'encara no s’ha aplicat al servidor compartit', es: 'todavía no se ha aplicado en el servidor compartido',
    en: 'has not yet been applied on the shared server', eu: 'oraindik ez da aplikatu zerbitzari partekatuan', gl: 'aínda non se aplicou no servidor compartido' };
  const JA_APLICADA_R32_5 = /ja s’ha aplicat|ya se ha aplicado|has already been applied|has been applied|jada aplikatu da|xa se aplicou/i;
  /* Llei 0 · L'avís d'un toc dels canals de proves arriba quan s'hi publica un build més nou, i els mòbils amb el build 11
     o anterior (que no porten el detector nou) s'actualitzen a mà una vegada. */
  const QUAN_ES_PUBLIQUE_R32_5 = { ca: 'quan es publique un build més nou al seu canal', es: 'cuando se publique un build más nuevo en su canal',
    en: 'when a newer build is published on their channel', eu: 'beren kanalean build berriago bat argitaratzen denean', gl: 'cando se publique un build máis novo na súa canle' };
  const BUILD_ANTERIOR_R32_5 = { ca: 'build 11 o anterior', es: 'build 11 o anterior', en: 'build 11 or earlier', eu: '11. builda edo zaharragoa', gl: 'build 11 ou anterior' };
  const A_MA_R32_5 = { ca: 'a mà una vegada', es: 'a mano una vez', en: 'by hand once', eu: 'behin eskuz', gl: 'a man unha vez' };
  /* Llei 0 · Tres peces d'esta versió no tenen pantalla (el resum anual, la safata LSSI i les regles RSVP), i ho diu. */
  const SENSE_PANTALLA_R32_5 = {
    ca: ['De moment no té cap botó a la pantalla', 'La safata encara no té pantalla', 'De moment no hi ha cap botó a la pantalla ni lloc al servidor'],
    es: ['De momento no tiene ningún botón en la pantalla', 'La bandeja todavía no tiene pantalla', 'De momento no hay ningún botón en la pantalla ni lugar en el servidor'],
    en: ['For now it has no button on screen', 'The tray has no screen yet', 'For now there is no button on screen and nowhere on the server'],
    eu: ['Oraingoz ez du botoirik pantailan', 'Erretiluak ez du pantailarik oraindik', 'Oraingoz ez dago botoirik pantailan, ezta erantzunak gordetzeko lekurik zerbitzarian ere'],
    gl: ['Polo de agora non ten ningún botón na pantalla', 'A bandexa aínda non ten pantalla', 'Polo de agora non hai ningún botón na pantalla nin lugar no servidor']
  };
  const NO_SO_REAL_R32_5 = { ca: 'no és el so real', es: 'no es el sonido real', en: 'not the real sound', eu: 'ez da benetako soinua', gl: 'non é o son real' };
  const MAPA_NO_PUBLICA_R32_5 = { ca: 'no publica cap redirecció', es: 'no publica ninguna redirección', en: 'publishes no redirects',
    eu: 'ez du birbideratzerik argitaratzen', gl: 'non publica ningunha redirección' };
  const SENSE_UBICACIO_R32_5 = { ca: 'sense dades d’ubicació', es: 'sin datos de ubicación', en: 'without location data', eu: 'kokapen-daturik gabe',
    gl: 'sen datos de localización' };
  /* Els textos que es veuen a la pantalla i no viuen en una taula importable: el subtítol de la Facturació
     (AppGestoria.jsx, TEXTOS_PONT_GESTORIA) i el botó de reintent de les mostres de La Veu (TEXTOS_MOSTRA_VEU). */
  const FACTURACIO_R32_5 = {
    ca: 'Esborranys de factures i registre encadenat local, també sense connexió',
    es: 'Borradores de facturas y registro encadenado local, también sin conexión',
    en: 'Invoice drafts and local chained ledger, offline-ready',
    eu: 'Faktura-zirriborroak eta tokiko erregistro kateatua, konexiorik gabe ere',
    gl: 'Borradores de facturas e rexistro encadeado local, tamén sen conexión'
  };
  const REINTENTA_LA_VEU_R32_5 = { ca: 'Torna a provar la mostra', es: 'Reintentar muestra', en: 'Retry sample', eu: 'Saiatu berriro', gl: 'Tentar de novo' };
  /* Llei 0 · Cap promesa que no siga certa quan s'escriu: ni publicada a una botiga, ni homologada, ni redireccions en marxa. */
  const PROMESES_FALSES_R32_5 = /ja publicada|ya publicada|already published|argitaratuta dago|xa publicada|ja és a la botiga|ya está en la tienda|is already in|homolog|certified|alliberat|liberado|freed|ja redirigix|ya redirige|already redirects/i;
  const cometes = (llengua, frase) => (llengua === 'en' ? `“${frase}”` : `«${frase}»`);
  const etiquetaBanda = (llengua) => TEXTOS_BANDA_BETA[llengua].text.replace(/^🧪 /u, '').split(' — ')[0];
  const etiquetaLinia = (llengua, clau) => TEXTOS_LINIA_VERSIO[llengua][clau].split(':')[0];
  /* Onada v1.2.8 · La crònica R32.7, R32.8 i R32.9 obri la pàgina: la R32.5 i R32.6 és la segona. */
  const blocR32_5 = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    return cos.slice(iniciDeLaTercera(cos), iniciDeLaQuarta(cos));
  };

  test('va darrere de la R32.7, R32.8 i R32.9 i davant de la R32.4 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i 2.3.10', () => {
    expect(TITOL_FITA_R32_5).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(interns(fitaR32_5Bloc)).toEqual(expect.arrayContaining(['/xat', '/control', '/app/nevera', '/mur/la-veu-de-soc-de-poble']));
    expect(interns(fitaR32_5Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R32_5)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onada v1.2.8 · La R32.7, R32.8 i R32.9 obri la pàgina i la R32.5 i R32.6 la seguix.
      // Onada v1.2.9 · I la R32.10, R32.11 i R32.12 davant de totes: la R32.5 i R32.6 és la tercera.
      expect(obriR32_12iR32_8(cos, llengua) && cos.startsWith(`<h3>${iniciTitol}`, iniciDeLaTercera(cos)), llengua).toBe(true);
      const bloc = blocR32_5(llengua);
      // L'ordre de /versions: R32.7, R32.8 i R32.9 → R32.5 i R32.6 → R32.4 → R32.3.
      expect(cos.startsWith(`<h3>${INICIS_R32_4[llengua]}`, iniciDeLaTercera(cos) + bloc.length)
        && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos)), llengua).toBe(true);
      expect(interns(bloc), llengua).toEqual(interns(fitaR32_5Bloc));
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R32_5[llengua]);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      // 2.3.10 · Cap altra plataforma mòbil, cap botiga nomenada, cap canal de proves, cap format de paquet ni cap navegador;
      // i tampoc el proveïdor de l'entrada que bloqueja el navegador intern de les xarxes socials.
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b|\bAPK\b|\bAAB\b|F-Droid|Safari|Chrome/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      // Llei 0 · Cap jerga tècnica, cap paraula de Push ni del xifratge, cap promesa d'accessibilitat AAA ni d'avisos a zero.
      expect(/\bCAS\b|\bRPC\b|search_path|SECURITY DEFINER|\bRLS\b|BigInt|\bEXIF\b|\bMIME\b|\bACK\b|\bE2EE\b|\bCRDT\b|\bPush\b|\bFCM\b|\bAPNs\b|\bVAPID\b|WCAG|Lighthouse|\bAAA\b|\b100\s*\/\s*100\b|zero avisos|cero avisos|zero warnings/i.test(pla), llengua).toBe(false);
      expect(/xifra|cifrad|encrypt|zifra/i.test(pla), llengua).toBe(false);
      expect(PROMESES_FALSES_R32_5.test(pla), llengua).toBe(false);
      // La versió i el build del repositori, cap botiga encara i el connector publicat.
      expect(pla, llengua).toContain(VERSIO_R32_5[llengua]);
      expect(pla).not.toContain('1.2.6');
      // Onada v1.2.8 · La versió d'ara (1.2.8) no és la de la R32.5 i R32.6: la diu la R32.7, R32.8 i R32.9.
      expect(pla).not.toContain(PAQUET.version);
      expect(pla, llengua).toContain(NO_BOTIGUES_R32_5[llengua]);
      expect(pla).toContain(CONNECTOR_PUBLICAT);
      // La migració LSSI, NO aplicada; la forma «ja s'ha aplicat» no hi entra.
      expect(pla).toContain(MIGRACIO_R32_5);
      expect(pla, llengua).toContain(NO_APLICADA_R32_5[llengua]);
      expect(JA_APLICADA_R32_5.test(pla), llengua).toBe(false);
      expect(pla).toContain('LSSI');
      // L'avís d'un toc: quan es publique, el paquet directe amb la seua suma, el botó de la web i el build 11 a mà.
      expect(pla, llengua).toContain(QUAN_ES_PUBLIQUE_R32_5[llengua]);
      expect(pla).toContain('SHA-256');
      expect(pla, llengua).toContain(cometes(llengua, TEXTOS_ACTUALITZACIO[llengua].accioWeb));
      expect(pla, llengua).toContain(BUILD_ANTERIOR_R32_5[llengua]);
      expect(pla, llengua).toContain(A_MA_R32_5[llengua]);
      // La línia «Instal·lada al dispositiu · Última publicada», amb el text de cada llengua.
      for (const clau of ['installada', 'publicada']) expect(pla, `${llengua} · ${clau}`).toContain(cometes(llengua, etiquetaLinia(llengua, clau)));
      expect(pla, llengua).toContain(cometes(llengua, '(web)'));
      // Les fotos del mòbil, sense dades d'ubicació; l'ona, que no és el so real.
      expect(pla).toContain('HEIC');
      expect(pla, llengua).toContain(SENSE_UBICACIO_R32_5[llengua]);
      expect(pla, llengua).toContain(NO_SO_REAL_R32_5[llengua]);
      // Les tres peces sense pantalla, dites com a tals.
      for (const frase of SENSE_PANTALLA_R32_5[llengua]) expect(pla, `${llengua} · ${frase}`).toContain(frase);
      // La banda de fase beta i la Facturació sense el llibre Veri*Factu, amb el text de la pantalla.
      expect(pla, llengua).toContain(cometes(llengua, etiquetaBanda(llengua)));
      expect(pla, llengua).toContain(cometes(llengua, FACTURACIO_R32_5[llengua]));
      // L'importador i el mapa 301, que no publica cap redirecció.
      expect(pla).toContain('WordPress');
      expect(pla).toContain('Blogger');
      expect(pla).toContain('socdepoble.net');
      expect(pla).toMatch(/\b301\b/);
      expect(pla, llengua).toContain(MAPA_NO_PUBLICA_R32_5[llengua]);
      // L'escut del navegador intern, la Nevera a 320 px i les mostres de La Veu amb el teclat.
      expect(pla).toContain('Facebook');
      expect(pla).toContain('Instagram');
      expect(pla).toMatch(/\b320\b/);
      expect(pla, llengua).toContain(cometes(llengua, MARCADORS_NO_INDICATS[llengua].date));
      expect(pla).toContain('Escape');
      expect(pla, llengua).toContain(cometes(llengua, REINTENTA_LA_VEU_R32_5[llengua]));
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(16);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max}): «${p.replace(/<[^>]+>/g, '').slice(0, 60)}…»`).toBe(true);
      }
      for (const m of bloc.matchAll(/<strong>([\s\S]*?)<\/strong>/g)) {
        const w = [...segmentador.segment(m[1].replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        expect(w >= 1 && w <= 6, `${llengua} · negreta de ${w} paraules: «${m[1]}»`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });

  test('Llei 0 · cada fet té el seu consumidor a l’arbre: versió, avís d’un toc, línia de versió, fotos, ona, cares, Gestoria, LSSI, Calendari, fase beta, importador, 301, escut, Nevera i La Veu', () => {
    // La versió i el build de la crònica eren els del codi aquell dia (1.2.7, build 12). Onada v1.2.8 · Ara el codi ja és
    // més nou (la R32.7, R32.8 i R32.9 diu la 1.2.8 amb el build 13), i la R32.5 i R32.6 no pot ser posterior a la d'ara.
    // El connector publicat no és més nou que el del repositori.
    expect(noMesNova('1.2.7', PAQUET.version) && PAQUET.version !== '1.2.7').toBe(true);
    expect(VERSIO_CLIENT_NATIU).toBeGreaterThan(12);
    expect(JSON.parse(llegix('public/.well-known/ard.json')).version).toBe(PAQUET.version);
    expect(JSON.parse(llegix('public/versio-viva.json')).versioSistema).toBe(PAQUET.version);
    expect(noMesNova(CONNECTOR_PUBLICAT, CONNECTOR), `${CONNECTOR_PUBLICAT} ≤ ${CONNECTOR}`).toBe(true);
    const fontsDe = (carpeta) => readdirSync(resolve(process.cwd(), carpeta), { recursive: true })
      .map((f) => `${carpeta}/${String(f)}`).filter((f) => /\.(?:js|jsx|mjs)$/.test(f) && !/\.test\./.test(f));
    const fontsSrc = fontsDe('src');
    /* Un consumidor és qui ho importa (estàtic o diferit), no un comentari que ho nomena (pageContent.r10.js en cita
       els fitxers a la seua nota de Llei 0). */
    const importsDe = (font) => [...font.matchAll(/\bimport\s*(?:[^'"`;]*?\bfrom\s*)?['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1] ?? m[2]);
    const nomsImportats = (font) => [...font.matchAll(/\bimport\s*\{([^}]*)\}\s*from/g)].flatMap((m) => m[1].split(',').map((n) => n.trim().split(/\s+as\s+/)[0]));
    const consumidors = (patro, propi) => fontsSrc.filter((f) => f !== propi && (importsDe(llegix(f)).some((r) => patro.test(r)) || nomsImportats(llegix(f)).some((n) => patro.test(n))));
    // L'avís d'un toc: d'on ve l'App, els canals de proves del manifest (que escriu publica-tot.mjs quan una pujada ho
    // acredita), la suma del paquet directe, la web amb /versio-viva.json, i el build 11 que s'instal·la a mà.
    const detector = llegix('src/natiu/actualitzacioAppNativa.js');
    expect(detector).toContain("import { ORIGENS, consultaOrigenInstallacio } from './origenInstallacio.js';");
    expect(detector).toContain('canal: CANALS_ACTUALITZACIO.TESTFLIGHT');
    expect(detector).toContain('origen === ORIGENS.DIRECTA && mesNou(manifest.apkBuild)');
    expect(llegix('scripts/botigues/publica-tot.mjs')).toContain('--sincronitza-proves --versio X.Y.Z [--build-testflight M] [--build-apk N]');
    for (const [llengua, textos] of Object.entries(TEXTOS_ACTUALITZACIO)) expect(textos.detallApk, llengua).toContain('SHA-256');
    expect(llegix('src/pwa/actualitzacioWeb.js')).toContain("export const URL_VERSIO_VIVA = '/versio-viva.json';");
    expect(llegix('src/pwa/registre.js')).toContain("importa = () => import('./actualitzacioWeb.js')");
    expect(llegix('src/data/contracte.js')).toContain('els mòbils amb el build 11 o anterior l\'instal·len a mà');
    // La línia «Instal·lada al dispositiu · Última publicada», a /versions i al Panell de Control; a la web, «(web)».
    expect(llegix('src/sections/text/TextSection.jsx')).toContain("{pageKey === 'versions' ? <LiniaVersioInstallada llengua={language} /> : null}");
    expect(llegix('src/sections/control/ControlSection.jsx')).toContain('<LiniaVersioInstallada llengua={idioma} />');
    for (const [llengua, textos] of Object.entries(TEXTOS_LINIA_VERSIO)) expect(textos.installadaWeb, llengua).toContain('(web)');
    // Les fotos del mòbil: HEIC i HEIF també per l'extensió, comprimides sense EXIF; el text principal com a peu en un
    // sol enviament, i el transport que no sobreviu a un canvi de sessió.
    const adjunt = llegix('src/sections/xat/adjuntLocal.js');
    expect(adjunt).toContain("heic: 'image/heic', heif: 'image/heif', jpg: 'image/jpeg', jpeg: 'image/jpeg',");
    /* R32.11 · La ubicació consentida es conserva estructurada; el binari
       no conserva GPS encara que un node antic només admeta RPC3. Data i
       càmera es reconstruïxen amb llista blanca. La crònica és històrica. */
    expect(adjunt).toContain('conservaExif: false');
    expect(adjunt).toContain('preparaTiffSenseUbicacio');
    expect(llegix('src/data/supabase/xatMultimedia.js')).toContain('await comprovaImatgeSenseUbicacio(fitxer, comprova, config.signal)');
    expect(llegix('src/sections/xat/components/Compositor.peuPrincipal.r32_6.test.jsx')).toContain('Retorn i submit, amb foto preparada, envien el fitxer i el principal sense missatge de text separat');
    expect(llegix('src/sections/xat/components/Compositor.peuPrincipal.r32_6.test.jsx')).toContain('dos enviaments abans de repintar i Retorn mentre puja només fan una crida');
    expect(llegix('src/sections/xat/XatContext.mediaR326.test.jsx')).toContain('un canvi d’actor liquida el port que ignora abort i rebutja l’ACK tardà');
    // L'ona: derivada de la clau de la nota (no del so), i les tres velocitats de sempre.
    const reproductor = llegix('src/sections/xat/components/AdjuntXat.jsx');
    expect(reproductor).toContain("Perfil determinista d'ona de veu (nivells 0..7) derivat de\n * la clau de la nota.");
    expect(reproductor).toContain('const VELOCITATS_VEU = Object.freeze([1, 1.5, 2]);');
    // Les cares clicables a les bombolles (també en 1:1) i a la capçalera.
    expect(llegix('src/sections/xat/components/Bombolla.jsx')).toContain('className="sdp-xat-bombolla__cara sdp-xat-bombolla__cara--enllac"');
    expect(llegix('src/sections/xat/components/CapcaleraConversa.jsx')).toContain('export function resolRutaPerfilCapcalera(fil, { canals = null, contrapartReserva = null } = {}) {');
    // Llei 0 · El resum anual de la Gestoria: exacte i «No Verifactu», i sense cap consumidor a la pantalla.
    const resum = llegix('src/sections/gestoria/historic/nucli/resumAnualGestoria.js');
    expect(resum).toContain("export const AVIS_RESUM_ANUAL_GESTORIA = \"Esborrany d'autoorganització per a revisió per gestoria humana — No Verifactu\";");
    expect(resum).toContain('Totes les sumes usen BigInt.');
    expect(consumidors(/resumAnualGestoria|exportaResumAnualGestoria|AVIS_RESUM_ANUAL_GESTORIA/, 'src/sections/gestoria/historic/nucli/resumAnualGestoria.js')).toEqual([]);
    // Llei 0 · La safata LSSI: la migració, la retirada cautelar sense esborrar, l'AAL2 i cap quota nova; NO aplicada; i
    // cap pantalla que la crida.
    const migracio = readdirSync(resolve(process.cwd(), 'supabase/migrations')).find((f) => f.startsWith(`${MIGRACIO_R32_5}_`));
    expect(migracio).toBe('20261117140000_r32_5_lssi_revisio_cautelar.sql');
    const sql = llegix(`supabase/migrations/${migracio}`);
    expect(sql).toContain("update public.section_submissions set moderation_state='retirada_cautelar' where id=s.id;");
    expect(sql).toContain('cal administració activa amb aal2');
    expect(sql).not.toMatch(/\bdelete\s+from\b/i);
    const fila = llegix('supabase/README.md').split('\n').find((l) => l.startsWith('| ') && l.includes(` | \`${MIGRACIO_R32_5}\` | `)) ?? '';
    expect(fila).toContain('**NO aplicada: R32.5, l\'aplica el Mestre**');
    expect(fila).toContain('LSSI (art. 16)');
    expect(fontsSrc.filter((f) => f.endsWith('.jsx') && /registraDenunciaPublica|adminSafataDenuncies|adminRevisaDenuncia|supabase\/lssi/.test(llegix(f)))).toEqual([]);
    // Llei 0 · Les regles RSVP del Calendari: l'aforament no baixa per davall de l'ocupació, i cap consumidor aquell dia.
    // Onada v1.2.9 · Ara en tenen un, i només un: el magatzem d'assistència del navegador (rsvpEsdeveniments.js), que la
    // crònica R32.10, R32.11 i R32.12 conta («es desa en este navegador»). La R32.5 i R32.6 és història.
    const calendari = llegix('src/sections/calendari/estatCalendari.js');
    expect(calendari).toContain("if (aforament < ocupades) return resultatRsvp(estat, false, 'aforament-inferior-ocupacio');");
    expect(consumidors(/^(?:aplicaRsvp|creaEstatRsvp|resumAforamentRsvp|canviaAforamentRsvp|RESPOSTES_RSVP)$/, 'src/sections/calendari/estatCalendari.js')).toEqual(['src/sections/calendari/rsvpEsdeveniments.js']);
    // La banda de fase beta a les apps en proves, i la Facturació sense el literal del llibre Veri*Factu.
    expect(llegix('src/apps/plataforma/RutaApps.jsx')).toContain('{enProves ? <BandaBetaMicroApp idioma={llenguaDelText} /> : null}');
    const gestoria = llegix('src/apps/gestoria/AppGestoria.jsx');
    expect(gestoria).not.toContain('subtitle="Factures i llibre Veri*Factu');
    for (const [llengua, subtitol] of Object.entries(FACTURACIO_R32_5)) expect(gestoria, llengua).toContain(`facturacioSubtitol: '${subtitol}'`);
    expect(llegix('src/apps/bar/i18nBar.js')).toContain("export const CODIS_IDIOMA_BAR = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);");
    // L'importador de WordPress i Blogger (amb els seus dos consumidors) i el validador del mapa 301, sense xarxa.
    const importador = llegix('src/utils/transformadorEditorialWpBlogger.r32_5.test.js');
    for (const cas of ['Blogger conserva galeria, peus, ordre, enllaços d’imatge i entitats de CDATA',
      'el títol rendered resol accents, puntuació i numèriques sense perdre entitats desconegudes',
      'WXR conserva data publicada amb fus, data local i GMT sense substituir-les per ara']) expect(importador, cas).toContain(cas);
    expect(consumidors(/transformadorEditorialWpBlogger\.js$/, null)).toEqual(expect.arrayContaining(['src/sections/notes/ImportacioPaginaWpNotes.jsx', 'src/sections/profile/admin/BancImportacioEditorial.jsx']));
    const mapa = llegix('src/utils/mapaRedireccions301.js');
    expect(mapa).toContain("const HOSTS_ORIGEN = new Set(['socdepoble.net', 'www.socdepoble.net', 'elrentonar.blogspot.com']);");
    expect(mapa).toContain('No acredita\n * cap resposta HTTP desplegada');
    expect(llegix('tooling/seo/verifica-mapa-301.mjs')).toContain('només lectura local, no peticions HTTP.');
    // L'escut del navegador intern de les xarxes socials, amb l'enllaç al correu, la contrasenya i la còpia de l'adreça.
    expect(llegix('src/sections/onboarding/detectaWebViewInApp.js')).toContain("{ app: 'instagram', nomApp: 'Instagram', re: /\\bInstagram\\b/i },");
    expect(llegix('src/sections/onboarding/OnboardingSection.jsx')).toContain("import { detectaWebViewInApp } from './detectaWebViewInApp.js';");
    // La Nevera: la pastilla de data només si n'hi ha una de real, a les tres vistes d'inventari.
    expect(llegix('src/apps/comu/esquelet/ColumnaCataleg.jsx')).toContain('{...(ometDataNoIndicada ? { showDateTime: Boolean(dataReal || creatReal) } : null)}');
    for (const vista of ['Casa', 'Cataleg', 'Compra']) expect(llegix(`src/apps/nevera/vistes/${vista}.jsx`), vista).toContain('ometDataNoIndicada');
    // Les mostres de La Veu: ±5 s amb les fletxes i Escape; el reintent amb el text de cada llengua.
    const laVeu = llegix('src/sections/mur/articles/LaVeuDeSocDePobleArticle.jsx');
    expect(laVeu).toContain("if (ev.key === 'Escape' && (estat === 'reproduint' || estat === 'carregant')) {");
    expect(laVeu).toContain("if (ev.key === 'ArrowRight') {");
    for (const [llengua, reintenta] of Object.entries(REINTENTA_LA_VEU_R32_5)) expect(laVeu, llengua).toContain(`reintenta: '${reintenta}'`);
  });
});

/* Onada v1.2.8 · Crònica d'obertura en les cinc llengües de la versió 1.2.8 (build 13) del repositori (ordre del Mestre
   del 18-11-2026, worktree r26-fusio), amb el que ha aterrat de veres a l'arbre d'integració: les Onades R32.7, R32.8 i
   R32.9 de Codex i Gemini. Llei 0: la 1.2.8 no consta a cap botiga quan s'escriu; les migracions 20261117173000 i
   20261117193000 són al repositori i NO s'han aplicat (les aplica el Mestre), i fins aleshores el servidor manté els
   20 MB i els 10 s, i un fitxer amb la ubicació no es pot publicar; les marques de la bombolla (reaccions, destacats,
   fixats i les dues formes d'eliminar) viuen en l'estat local de Conversa i no arriben al motor de XatContext, i la
   crònica ho diu (si algú les connecta, la prova de cablatge cau i el text s'ha de tornar a escriure); reenviar només
   porta el text; l'interruptor del Mur viu al navegador. Regla 2.3.10: cap nom de plataforma mòbil, de botiga, de canal
   de proves, de paquet, de navegador ni del proveïdor de l'entrada («el botó de marca»). Cap menció d'homologació, del
   xifratge, de Push, de WCAG ni d'AAA, i cap promesa de prova en un telèfon real. */
describe('Onades R32.7, R32.8 i R32.9 · Crònica d’obertura en les cinc llengües amb les accions del Xat, el vídeo i el lloc, la Wiki al Mur i Llei 0', () => {
  const PREFIXOS_R32_8 = {
    ca: [...Array(5).fill('Novetat'), ...Array(5).fill('Millora'), ...Array(3).fill('Correcció')],
    es: [...Array(5).fill('Novedad'), ...Array(5).fill('Mejora'), ...Array(3).fill('Corrección')],
    en: [...Array(5).fill('New'), ...Array(5).fill('Improvement'), ...Array(3).fill('Fix')],
    eu: [...Array(5).fill('Berritasuna'), ...Array(5).fill('Hobekuntza'), ...Array(3).fill('Zuzenketa')],
    gl: [...Array(5).fill('Novidade'), ...Array(5).fill('Mellora'), ...Array(3).fill('Corrección')]
  };
  const DICCIONARIS_R32_8 = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  /* Onada v1.2.9 · La R32.7, R32.8 i R32.9 és història: la versió d'aquell dia era la 1.2.8 (build 13), i es fixa literal (abans es
     derivava de package.json i de VERSIO_CLIENT_NATIU); la d'ara, 1.2.9 (build 14), la diu la R32.10, R32.11 i R32.12. */
  const VERSIO_R32_8 = {
    ca: 'versió 1.2.8 (build 13)', es: 'versión 1.2.8 (build 13)', en: 'version 1.2.8 (build 13)', eu: '1.2.8 bertsiora (13. builda)',
    gl: 'versión 1.2.8 (build 13)'
  };
  /* Llei 0 · Quan s'escriu, la 1.2.8 no consta a cap botiga; el build anterior (12) ja porta l'avís d'un toc. */
  const NO_BOTIGUES_R32_8 = { ca: 'no consta a cap botiga', es: 'no consta en ninguna tienda', en: 'not listed in any store',
    eu: 'ez dago inongo dendatan', gl: 'non consta en ningunha tenda' };
  const BUILD_ANTERIOR_R32_8 = { ca: 'build 12', es: 'build 12', en: 'build 12', eu: '12. builda', gl: 'build 12' };
  /* Llei 0 · Les dues migracions són al repositori i NO s'han aplicat: les aplica el Mestre. Fins aleshores, els límits d'abans. */
  const MIGRACIONS_R32_8 = ['20261117173000', '20261117193000'];
  const NO_APLICADES_R32_8 = { ca: 'encara no s’han aplicat al servidor compartit', es: 'todavía no se han aplicado en el servidor compartido',
    en: 'have not yet been applied on the shared server', eu: 'oraindik ez dira aplikatu zerbitzari partekatuan', gl: 'aínda non se aplicaron no servidor compartido' };
  const JA_APLICADA_R32_8 = /ja s’han? aplicat|ya se han? aplicado|ha(?:s|ve) already been applied|ha(?:s|ve) been applied|jada aplikatu d(?:a|ira)|xa se aplicaron|xa se aplicou/i;
  const LIMITS_ABANS_R32_8 = {
    ca: ['20 MB d’adjunts per persona', 'vídeos de fins a 10 segons'], es: ['20 MB de adjuntos por persona', 'vídeos de hasta 10 segundos'],
    en: ['20 MB of attachments per person', 'videos of up to 10 seconds'], eu: ['20 MB eranskin pertsonako', 'gehienez 10 segundoko bideoak'],
    gl: ['20 MB de adxuntos por persoa', 'vídeos de ata 10 segundos']
  };
  /* Llei 0 · Les marques de la bombolla i les dues formes d'eliminar, només a la pantalla de qui les fa; reenviar, només el text. */
  const NOMES_PANTALLA_R32_8 = { ca: 'només a la teua pantalla', es: 'solo en tu pantalla', en: 'only on your screen', eu: 'zure pantailan bakarrik',
    gl: 'só na túa pantalla' };
  const NO_ES_DESEN_R32_8 = { ca: 'encara no es desen al servidor', es: 'todavía no se guardan en el servidor', en: 'are not saved yet on the server',
    eu: 'oraindik ez dira gordetzen zerbitzarian', gl: 'aínda non se gardan no servidor' };
  const NOMES_TEXT_R32_8 = { ca: 'només viatja el text', es: 'solo viaja el texto', en: 'only the text travels', eu: 'testua bakarrik doa', gl: 'só viaxa o texto' };
  /* Llei 0 · Fins que s'aplique la migració, el fitxer amb la ubicació s'envia sense la ubicació al servidor i un avís
     ho diu (xatMultimedia.js · ubicacioNoAdmesa i ControlsAdjunt.jsx · ubicacio-no-admesa). */
  const SENSE_UBICACIO_FINS_R32_8 = { ca: 'el fitxer s’envia sense la ubicació al servidor', es: 'el archivo se envía sin la ubicación al servidor',
    en: 'the file is sent to the server without the location', eu: 'fitxategia kokapenik gabe bidaltzen da zerbitzarira', gl: 'o ficheiro envíase ao servidor sen a localización' };
  const SEGONS_R32_8 = { ca: 'segons', es: 'segundos', en: 'seconds', eu: 'segundoko', gl: 'segundos' };
  /* El nom del servidor als avisos, amb la forma de cada llengua (diccionaris: error.backendInabastable). */
  const SERVIDOR_R32_8 = { ca: 'el servidor de Sóc de Poble', es: 'el servidor de Sóc de Poble', en: 'the Sóc de Poble server',
    eu: 'Sóc de Poble-ren zerbitzaria', gl: 'o servidor de Sóc de Poble' };
  /* L'interruptor de la Wiki només té el rètol en valencià a la pantalla (WikiDePobleSection.jsx), i es cita literal. */
  const INTERRUPTOR_MUR_R32_8 = 'Mostrar també al Mur';
  /* Llei 0 · Cap promesa que no siga certa quan s'escriu: ni publicada a una botiga, ni homologada, ni desada al servidor. */
  const PROMESES_FALSES_R32_8 = /ja publicada|ya publicada|already published|argitaratuta dago|xa publicada|ja és a la botiga|ya está en la tienda|is already in|homolog|certified|alliberat|liberado|freed|ja es desen|ya se guardan|already saved|xa se gardan/i;
  const cometes = (llengua, frase) => (llengua === 'en' ? `“${frase}”` : `«${frase}»`);
  const blocR32_8 = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    /* Onada v1.2.9 · La crònica R32.10, R32.11 i R32.12 obri la pàgina: la R32.7, R32.8 i R32.9 és la segona. */
    return cos.slice(iniciDeLaSegona(cos), iniciDeLaTercera(cos));
  };

  test('va darrere de la R32.10, R32.11 i R32.12 i davant de la R32.5 i R32.6 en ca, es, en, eu i gl, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i 2.3.10', () => {
    expect(TITOL_FITA_R32_8).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(fitaR32_8Bloc.startsWith(`<h3>${TITOL_FITA_R32_8}</h3>`)).toBe(true);
    expect(interns(fitaR32_8Bloc)).toEqual(expect.arrayContaining(['/xat', '/wikidepoble', '/mur']));
    expect(interns(fitaR32_8Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R32_8)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      // Onada v1.2.9 · La R32.10, R32.11 i R32.12 obri la pàgina i la R32.7, R32.8 i R32.9 la seguix.
      expect(cos.startsWith(`<h3>${INICIS_R32_12[llengua]}`) && cos.startsWith(`<h3>${iniciTitol}`, iniciDeLaSegona(cos)), llengua).toBe(true);
      const bloc = blocR32_8(llengua);
      // L'ordre de /versions: R32.10, R32.11 i R32.12 → R32.7, R32.8 i R32.9 → R32.5 i R32.6 → R32.4 → R32.3.
      expect(cos.startsWith(`<h3>${INICIS_R32_5[llengua]}`, iniciDeLaSegona(cos) + bloc.length)
        && cos.startsWith(`<h3>${INICIS_R32_4[llengua]}`, iniciDeLaQuarta(cos))
        && cos.startsWith(`<h3>${INICIS_R32_3[llengua]}`, iniciDeLaCinquena(cos)), llengua).toBe(true);
      // Paritat: els mateixos enllaços, els mateixos prefixos i el mateix nombre d'apartats en cada llengua.
      expect(interns(bloc), llengua).toEqual(interns(fitaR32_8Bloc));
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R32_8[llengua]);
      expect(apartats(bloc), llengua).toHaveLength(13);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      // 2.3.10 · Cap altra plataforma mòbil, cap botiga nomenada, cap canal de proves, cap format de paquet ni cap navegador;
      // i tampoc el proveïdor de l'entrada del botó de marca.
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b|\bAPK\b|\bAAB\b|F-Droid|Safari|Chrome|Firefox/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      // Llei 0 · Cap jerga tècnica, cap paraula de Push ni del xifratge, cap promesa d'accessibilitat AAA ni d'avisos a zero.
      expect(/\bCAS\b|\bRPC\b|search_path|SECURITY DEFINER|\bRLS\b|BigInt|\bEXIF\b|\bGPS\b|\bMIME\b|\bACK\b|\bE2EE\b|\bCRDT\b|\bPush\b|\bFCM\b|\bAPNs\b|\bVAPID\b|WCAG|Lighthouse|\bAAA\b|\b100\s*\/\s*100\b|zero avisos|cero avisos|zero warnings|superadmin|localStorage|PostgREST/i.test(pla), llengua).toBe(false);
      expect(/xifra|cifrad|encrypt|zifra/i.test(pla), llengua).toBe(false);
      expect(PROMESES_FALSES_R32_8.test(pla), llengua).toBe(false);
      // La versió i el build del repositori, cap botiga encara, el build anterior amb l'avís d'un toc i el connector publicat.
      expect(pla, llengua).toContain(VERSIO_R32_8[llengua]);
      expect(pla).not.toContain('1.2.7');
      // Onada v1.2.9 · La versió d'ara (1.2.9) no és la de la R32.7, R32.8 i R32.9: la diu la R32.10, R32.11 i R32.12.
      expect(pla).not.toContain(PAQUET.version);
      expect(pla, llengua).toContain(NO_BOTIGUES_R32_8[llengua]);
      expect(pla, llengua).toContain(BUILD_ANTERIOR_R32_8[llengua]);
      expect(pla).toContain(CONNECTOR_PUBLICAT);
      // Les dues migracions, NO aplicades, i els límits d'abans mentre no s'apliquen; la forma «ja s'ha aplicat» no hi entra.
      for (const migracio of MIGRACIONS_R32_8) expect(pla).toContain(migracio);
      expect(pla, llengua).toContain(NO_APLICADES_R32_8[llengua]);
      expect(JA_APLICADA_R32_8.test(pla), llengua).toBe(false);
      for (const frase of LIMITS_ABANS_R32_8[llengua]) expect(pla, `${llengua} · ${frase}`).toContain(frase);
      // Les marques del Xat i les dues formes d'eliminar, només a la pantalla; reenviar, només el text. Amb el text de la pantalla.
      expect(pla.split(NOMES_PANTALLA_R32_8[llengua]).length - 1, llengua).toBeGreaterThanOrEqual(2);
      expect(pla, llengua).toContain(NO_ES_DESEN_R32_8[llengua]);
      expect(pla, llengua).toContain(NOMES_TEXT_R32_8[llengua]);
      const diccionari = DICCIONARIS_R32_8[llengua];
      for (const clau of ['section.xat.missatge.reenvia', 'section.xat.missatge.eliminaPerAMi', 'section.xat.missatge.eliminaPerATothom',
        'section.xat.adjunts.amagaLloc', 'section.xat.ubicacio.veureMapa']) {
        expect(diccionari[clau], `${llengua} · ${clau}`).toBeTruthy();
        expect(pla, `${llengua} · ${clau}`).toContain(cometes(llengua, diccionari[clau]));
      }
      // El vídeo: els sostres del codi (durada, entrada i preparat) i el costat curt de 720 píxels.
      expect(pla, llengua).toContain(`${MAX_VIDEO_MS / 1000} ${SEGONS_R32_8[llengua]}`);
      expect(pla).toContain(`${MAX_VIDEO_ENTRADA_BYTES / 1_000_000} MB`);
      expect(pla).toContain(`${MAXIM_ADJUNT_XAT.video / 1_000_000} MB`);
      expect(pla).toMatch(/\b720\b/);
      expect(pla).toContain('WebM');
      // El lloc: per defecte, el botó que l'amaga, el mapa i el que passa fins que s'aplique la migració.
      expect(pla).toContain('OpenStreetMap');
      expect(pla, llengua).toContain(SENSE_UBICACIO_FINS_R32_8[llengua]);
      // La Wiki al Mur, l'interruptor (literal de la pantalla) i el nom del servidor de cada llengua.
      expect(pla).toContain(cometes(llengua, INTERRUPTOR_MUR_R32_8));
      expect(pla, llengua).toContain(cometes(llengua, SERVIDOR_R32_8[llengua]));
      expect(pla).toContain('WordPress');
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(16);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max}): «${p.replace(/<[^>]+>/g, '').slice(0, 60)}…»`).toBe(true);
      }
      for (const m of bloc.matchAll(/<strong>([\s\S]*?)<\/strong>/g)) {
        const w = [...segmentador.segment(m[1].replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        expect(w >= 1 && w <= 6, `${llengua} · negreta de ${w} paraules: «${m[1]}»`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });

  test('Llei 0 · cada fet té el seu consumidor a l’arbre: versió, migracions, límits d’abans, marques locals, reenviar, vídeo, lloc, mapa, targetes, Wiki, Mur, columnes, Consola, servidor, WebM, avís i entrada', () => {
    // La versió i el build de la crònica eren els del codi aquell dia (1.2.8, build 13). Onada v1.2.9 · Ara el codi ja és
    // més nou (la R32.10, R32.11 i R32.12 diu la 1.2.9 amb el build 14), i la R32.7, R32.8 i R32.9 no pot ser posterior
    // a la d'ara. El connector publicat no és més nou que el del repositori.
    expect(noMesNova('1.2.8', PAQUET.version) && PAQUET.version !== '1.2.8').toBe(true);
    expect(VERSIO_CLIENT_NATIU).toBeGreaterThan(13);
    expect(JSON.parse(llegix('public/.well-known/ard.json')).version).toBe(PAQUET.version);
    expect(JSON.parse(llegix('public/versio-viva.json')).versioSistema).toBe(PAQUET.version);
    expect(noMesNova(CONNECTOR_PUBLICAT, CONNECTOR), `${CONNECTOR_PUBLICAT} ≤ ${CONNECTOR}`).toBe(true);
    expect(llegix('src/data/contracte.js')).toContain('Versió unificada 1.2.8 amb el build 13: integra R32.7, R32.8 i R32.9');
    // Les dues migracions: al repositori i cap fila del README les dona per aplicades.
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    expect(migracions).toEqual(expect.arrayContaining(['20261117173000_r32_7_xat_reaccions_destacats_fixats_amagats.sql',
      '20261117193000_r32_8_xat_quota_250mb_video_60s_i_ubicacio.sql']));
    const readme = llegix('supabase/README.md').split('\n');
    for (const migracio of MIGRACIONS_R32_8) {
      const files = readme.filter((l) => l.startsWith('| ') && l.includes(` | \`${migracio}\` | `));
      expect(files.every((l) => l.includes('**NO aplicada') && !/\d{2}-\d{2}-\d{4} a les \d{2}:\d{2} CET/.test(l)), migracio).toBe(true);
    }
    // Els límits d'abans (2610220240: 20 MB i vídeos de 10 s) i els nous de la R32.8 (250 MB i 60 s); el client accepta tots dos.
    const quotaAntiga = llegix('supabase/migrations/2610220240_xat_adjunts_i_quota.sql');
    expect(quotaAntiga).toContain("'limit', 20000000");
    expect(quotaAntiga).toContain('durada_ms between 1 and 10000');
    const r328 = llegix('supabase/migrations/20261117193000_r32_8_xat_quota_250mb_video_60s_i_ubicacio.sql');
    expect(r328).toContain("'limit', 250000000");
    expect(r328).toContain('durada_ms between 1 and 60000');
    expect(QUOTA_XAT_BYTES).toBe(250_000_000);
    const portMultimedia = llegix('src/data/supabase/xatMultimedia.js');
    expect(portMultimedia).toContain('![20_000_000, QUOTA_XAT_BYTES].includes(Number(quota?.limit))');
    // Llei 0 · Sense la migració, publicar amb el lloc (p_ubicacio) no troba la funció i torna «sense-capacitat»; el botó
    // «Amaga el lloc» es desactiva després del primer intent.
    expect(portMultimedia).toContain('...(ubicacio ? { p_ubicacio: ubicacio } : {})');
    expect(portMultimedia).toContain('if (error?.status === 404 || /PGRST20[25]|esquema requerit/.test(text)) return noDisponible();');
    expect(r328).toContain('create or replace function public.xat_publica_adjunt(p_id uuid,p_text text,p_resposta_a uuid,p_ubicacio jsonb)');
    const controls = llegix('src/sections/xat/components/ControlsAdjunt.jsx');
    expect(controls).toContain('disabled={pujant || Boolean(ocupat) || haIntentatEnviar}');
    // Llei 0 · Les marques de la bombolla: Conversa les guarda en estat local i XatSection no li passa cap acció del motor.
    // Si algú connecta el motor (XatContext: accionsMissatge), esta prova cau i la crònica s'ha de tornar a escriure.
    const conversa = llegix('src/sections/xat/components/Conversa.jsx');
    for (const estat of ['const [amagatsLocals, setAmagatsLocals] = useState(() => new Set());',
      'const [lapidesLocals, setLapidesLocals] = useState(() => new Map());',
      'const [reaccionsLocals, setReaccionsLocals] = useState(() => new Map());']) expect(conversa, estat).toContain(estat);
    expect(conversa).toContain("t('section.xat.missatge.eliminaPerATothom', 'Elimina per a tothom')");
    /* Onada v1.2.9 · La guarda ha caigut com estava previst: Gemini R32.11 (lot 02) connecta les accions al motor de
       XatContext des de XatSection, i la crònica R32.10, R32.11 i R32.12 ho conta. La R32.7, R32.8 i R32.9 és història i
       conserva el text d'aquell dia; ací es fixa el canvi i que «Elimina per a tothom» continua sense motor (D-v128-2). */
    const seccioXat = llegix('src/sections/xat/XatSection.jsx');
    expect(seccioXat).toMatch(/onAlternaReaccio=\{potAccionsMissatge && typeof alternaReaccio === 'function' \? handleAlternaReaccio : null\}/);
    expect(seccioXat).not.toMatch(/onEliminaPerATothom/);
    // Reenviar sense el motor: el text, al fil actual o com a context de la conversa triada.
    expect(conversa).toContain("if (textEnviar) p.set('context', textEnviar);");
    // El motor, el port i la capacitat opcional, preparats: l'absència de l'SQL es reconeix i no es fabrica cap confirmació.
    expect(llegix('src/data/contracte.js')).toContain("'carregaAccionsMissatges', 'alternaReaccio', 'alternaDestacat', 'alternaFixat', 'eliminaPerAMi'");
    expect(llegix('src/data/supabase/xatAccions.js')).toContain("code: 'XAT_ACCIONS_SQL_ABSENT'");
    expect(llegix('src/data/xat/accionsMissatge.js')).toContain("if (e?.code !== 'XAT_ACCIONS_SQL_ABSENT') throw e;");
    // La bombolla: el menú, el botó de reaccionar, el xip del mapa (OpenStreetMap) i la targeta interna sense xarxa.
    const bombolla = llegix('src/sections/xat/components/Bombolla.jsx');
    for (const rotul of ["t('section.xat.missatge.opcions', 'Opcions del missatge')", "t('section.xat.missatge.reacciona', 'Reacciona')",
      "t('section.xat.missatge.destaca', 'Destaca')", "t('section.xat.missatge.fixa', 'Fixa')", "t('section.xat.ubicacio.veureMapa', 'Veure al mapa')"]) {
      expect(bombolla, rotul).toContain(rotul);
    }
    expect(llegix('src/sections/xat/ubicacioMitjaUI.js')).toContain('return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;');
    expect(llegix('src/sections/xat/previaEnllacIntern.js')).toContain('Resol de manera síncrona i pura (zero peticions de');
    // El vídeo: 60 s i 150 MB d'entrada, 20 MB preparat, el costat curt de 720 px i l'original només si ja hi cap.
    expect([MAX_VIDEO_MS, MAX_VIDEO_ENTRADA_BYTES, MAXIM_ADJUNT_XAT.video]).toEqual([60_000, 150_000_000, 20_000_000]);
    const compressio = llegix('src/utils/compressioVideoClient.js');
    expect(compressio).toContain('const escala = Math.min(1, (horitzontal ? 1280 : 720) / amplada, (horitzontal ? 720 : 1280) / alcada);');
    expect(compressio).toContain('if (fitxer.size <= MAXIM_ADJUNT_XAT.video && duradaMs && duradaMs <= MAX_VIDEO_MS && FALLBACKS.has(conegut.code)) {');
    // El lloc: per defecte, i «Amaga el lloc» neteja el fitxer (la foto sense les metadades; el vídeo, o net o error).
    const adjunt = llegix('src/sections/xat/adjuntLocal.js');
    expect(adjunt).toContain('signal, conservaUbicacio = true, onProgresCompressio,');
    expect(adjunt).toContain('if (adjunt.tipus === \'imatge\') fitxer = await imatgeRecodificada(fitxer, { signal, comprimeix, conservaUbicacio: false });');
    expect(adjunt).toContain("if (!netejat.net && !conserva) throw errorAdjuntXat('ubicacio-no-eliminable');");
    expect(controls).toContain("onClick={amagaLloc}>{t('section.xat.adjunts.amagaLloc', 'Amaga el lloc')}</button>");
    // Els WebM sense durada: un sol salt al final dins del mateix temps límit.
    expect(adjunt).toContain('if (element.duration === Infinity) {');
    // L'avís d'error amb la creu i el focus que torna a un botó.
    expect(controls).toContain("onClick={tancaAvis} aria-label={t('section.xat.adjunts.tancaAvis', 'Tanca l’avís')}");
    expect(controls).toContain("if (teniaFocus) botons[preparat ? 'primari' : ocupat ? 'cancella' : 'adjunta'].current?.focus();");
    // L'entrada: cap paràgraf damunt del botó de marca, i el mateix botó dins d'un marc d'una altra web.
    const entrada = llegix('src/sections/onboarding/OnboardingSection.jsx');
    expect(entrada).toContain('const capcalera = { showLogos: true };');
    expect(entrada).toContain('className="sdp-boto sdp-boto--ple sdp-boto--marca sdp-boto--google"');
    // La Wiki: portada, dates i revisions al quadre; l'interruptor del Mur, només per a superadmin i desat al navegador.
    const wiki = llegix('src/sections/wiki-de-poble/WikiDePobleSection.jsx');
    expect(wiki).toContain('<th scope="row">Revisions</th>');
    expect(wiki).toContain('<th scope="row">Última actualització</th>');
    expect(wiki).toContain('heroImage={item.image || item.attributes?.image}');
    expect(wiki).toContain('if (!esSuperadmin || !item?.id) return null;');
    expect(wiki).toContain(INTERRUPTOR_MUR_R32_8);
    expect(wiki).toContain("from '../../data/revisionsEditorialsDelNavegador.js';");
    // Els capítols al Mur: el port els afig a la lectura del Mur, i el del sistema nerviós és l'únic marcat; la pàgina
    // de sempre porta a la Wiki.
    expect(llegix('src/data/backendPort.js')).toContain("const { completaMurAmbWiki } = await import('./wikiAlMur.js');");
    expect(llegix('src/data/wikiAlMur.js')).toContain("mostrarAlMur: typeof item.mur === 'boolean' ? item.mur : a.mur === true");
    expect(llegix('_wiki_de_poble/02_saber/sistema_nervios_skills_i_repositoris.md')).toMatch(/^mur: true$/m);
    expect(resolvePageSlugPath('sistema-nervios')).toBe('/wikidepoble?item=sistema_nervios_skills_i_repositoris');
    // Les columnes plegades: per espai, només després d'una acció manual, al navegador.
    const columnes = llegix('src/components/universal/workspace/columnesPlegades.js');
    expect(columnes).toContain("export const CLAU_COLUMNES_PLEGADES = 'workspace.columnesPlegades.v1';");
    expect(columnes).toContain("La UI només escriu després d'una acció manual, mai en canviar de document");
    expect(llegix('src/components/universal/workspace/persistenciaColumnesUI.js')).toContain("} from './columnesPlegades.js';");
    // La Consola: la revisió de només lectura, com a pas de les portes, que no certifica serveis ni hooks.
    const consola = llegix('tooling/gates/tractor-consola-neta.mjs');
    expect(consola).toContain('R32.9: read-only structural audit. It does not install hooks');
    expect(consola).toContain('perdutsReferenciats');
    expect(llegix('tooling/gates/run-portes.mjs')).toContain("args:['tooling/gates/tractor-consola-neta.mjs','--json'],readOnly:true");
    // El nom del servidor, el de cada diccionari.
    for (const [llengua, diccionari] of Object.entries(DICCIONARIS_R32_8)) {
      expect(diccionari['error.backendInabastable'].toLowerCase(), llengua).toContain(SERVIDOR_R32_8[llengua].replace(/^(?:el|the|o) /, '').replace(/a$/, '').toLowerCase());
    }
  });
});

/* Onada v1.2.9 · Crònica d'obertura en les cinc llengües de la versió 1.2.9 (build 14) del repositori (ordre del Mestre
   del 18-11-2026, nit, worktree r26-fusio), amb el que ha aterrat de veres a l'arbre d'integració: els lots de Gemini i
   de Codex de les Onades R32.10 i R32.11, l'arbre viu de MarIA i l'Avisador de l'Onada R32.12. Llei 0: la 1.2.9 no
   consta a cap botiga quan s'escriu; el connector publicat continua en la 1.1.12 i el 1.1.17 del repositori no s'ha
   publicat; les migracions 20261117173000 i 20261117193000 i els tres paquets manuals de supabase/snippets (r32_10_* i
   r32_11_*) NO s'han aplicat (els aplica el Mestre), i fins aleshores les marques dels missatges es queden en la sessió
   i el lloc no arriba al servidor; la resposta d'assistència es desa en el navegador; «Elimina per a tothom» continua
   sense aparéixer. Cap xifra del pes de l'arrencada (no hi ha cap mesura feta en este arbre). Regla 2.3.10: cap nom de
   plataforma mòbil, de botiga, de canal de proves, de paquet, de navegador ni de proveïdor. */
describe('Onades R32.10, R32.11 i R32.12 · Crònica d’obertura en les cinc llengües amb l’Avisador, l’assistència als esdeveniments, les accions del Xat dins de la sessió i Llei 0', () => {
  const PREFIXOS_R32_12 = {
    ca: [...Array(5).fill('Novetat'), ...Array(4).fill('Millora'), ...Array(3).fill('Correcció')],
    es: [...Array(5).fill('Novedad'), ...Array(4).fill('Mejora'), ...Array(3).fill('Corrección')],
    en: [...Array(5).fill('New'), ...Array(4).fill('Improvement'), ...Array(3).fill('Fix')],
    eu: [...Array(5).fill('Berritasuna'), ...Array(4).fill('Hobekuntza'), ...Array(3).fill('Zuzenketa')],
    gl: [...Array(5).fill('Novidade'), ...Array(4).fill('Mellora'), ...Array(3).fill('Corrección')]
  };
  const DICCIONARIS_R32_12 = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  /* La versió i el build d'ara, els del codi (package.json i VERSIO_CLIENT_NATIU). */
  const VERSIO_R32_12 = {
    ca: `versió ${PAQUET.version} (build ${VERSIO_CLIENT_NATIU})`, es: `versión ${PAQUET.version} (build ${VERSIO_CLIENT_NATIU})`,
    en: `version ${PAQUET.version} (build ${VERSIO_CLIENT_NATIU})`, eu: `${PAQUET.version} bertsiora (${VERSIO_CLIENT_NATIU}. builda)`,
    gl: `versión ${PAQUET.version} (build ${VERSIO_CLIENT_NATIU})`
  };
  /* Llei 0 · Quan s'escriu, la 1.2.9 no consta a cap botiga; el build anterior (13) ja porta l'avís d'un toc. */
  const NO_BOTIGUES_R32_12 = { ca: 'no consta a cap botiga', es: 'no consta en ninguna tienda', en: 'not listed in any store',
    eu: 'ez dago inongo dendatan', gl: 'non consta en ningunha tenda' };
  const BUILD_ANTERIOR_R32_12 = { ca: 'build 13', es: 'build 13', en: 'build 13', eu: '13. builda', gl: 'build 13' };
  /* Llei 0 · El connector del repositori (la capçalera PHP) encara no s'ha publicat a WordPress.org. */
  const CONNECTOR_NO_PUBLICAT_R32_12 = { ca: `la ${CONNECTOR} del repositori encara no s’ha publicat`,
    es: `la ${CONNECTOR} del repositorio todavía no se ha publicado`, en: `${CONNECTOR} in the repository has not been published yet`,
    eu: `biltegiko ${CONNECTOR} ez da oraindik argitaratu`, gl: `a ${CONNECTOR} do repositorio aínda non se publicou` };
  /* Llei 0 · Les dues migracions del Xat i els tres paquets manuals nous, NO aplicats: els aplica el Mestre. */
  const MIGRACIONS_R32_12 = ['20261117173000', '20261117193000'];
  const NO_APLICADES_R32_12 = { ca: 'encara no s’han aplicat al servidor compartit', es: 'todavía no se han aplicado en el servidor compartido',
    en: 'have not yet been applied on the shared server', eu: 'oraindik ez dira aplikatu zerbitzari partekatuan', gl: 'aínda non se aplicaron no servidor compartido' };
  const TRES_PAQUETS_R32_12 = { ca: 'tres paquets manuals', es: 'tres paquetes manuales', en: 'three new manual packages',
    eu: 'eskuzko hiru pakete', gl: 'tres paquetes manuais' };
  const JA_APLICADA_R32_12 = /ja s’han? aplicat|ya se han? aplicado|ha(?:s|ve) already been applied|ha(?:s|ve) been applied|jada aplikatu d(?:a|ira)|xa se aplicaron|xa se aplicou/i;
  /* Llei 0 · Les marques es queden en la sessió fins a la migració; l'assistència es desa en el navegador i no viatja. */
  const EN_LA_SESSIO_R32_12 = { ca: 'es queden en esta sessió', es: 'se quedan en esta sesión', en: 'stay in this session',
    eu: 'saio honetan geratzen dira', gl: 'quedan nesta sesión' };
  const EN_EL_NAVEGADOR_R32_12 = { ca: 'es desa en este navegador', es: 'se guarda en este navegador', en: 'is saved in this browser',
    eu: 'nabigatzaile honetan gordetzen da', gl: 'gárdase neste navegador' };
  const NO_VIATJA_R32_12 = { ca: 'no viatja al servidor', es: 'no viaja al servidor', en: 'does not travel to the server',
    eu: 'ez da zerbitzarira bidaiatzen', gl: 'non viaxa ao servidor' };
  /* Els rètols que la crònica cita, els dels diccionaris de cada llengua. */
  const CLAUS_CITADES_R32_12 = ['page.avisador.guiaTitol', 'page.avisador.copiaHorari', 'section.events.rsvp.titol',
    'section.calendari.filtre.tot', 'section.xat.missatge.eliminaPerAMi', 'section.xat.missatge.eliminaPerATothom', 'section.xat.missatge.reenvia'];
  const PROMESES_FALSES_R32_12 = /ja publicada|ya publicada|already published|argitaratuta dago|xa publicada|ja és a la botiga|ya está en la tienda|is already in|homolog|certified|alliberat|liberado|freed|ja es desen|ya se guardan|already saved|xa se gardan/i;
  const cometes = (llengua, frase) => (llengua === 'en' ? `“${frase}”` : `«${frase}»`);
  const blocR32_12 = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    return cos.slice(0, iniciDeLaSegona(cos));
  };

  test('obri /versions en ca, es, en, eu i gl, davant de la R32.7, R32.8 i R32.9, sense vX.Y.Z al títol, amb densitat de negretes, rutes vives i 2.3.10', () => {
    expect(TITOL_FITA_R32_12).not.toMatch(/ · v\d+\.\d+\.\d+/);
    expect(fitaR32_12Bloc.startsWith(`<h3>${TITOL_FITA_R32_12}</h3>`)).toBe(true);
    expect(interns(fitaR32_12Bloc)).toEqual(expect.arrayContaining(['/page/avisador', '/calendari', '/xat', '/traduccions', '/dispositius']));
    expect(interns(fitaR32_12Bloc).every(rutaExistix)).toBe(true);
    for (const [llengua, iniciTitol] of Object.entries(INICIS_R32_12)) {
      const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
      expect(cos.startsWith(`<h3>${iniciTitol}`), llengua).toBe(true);
      const bloc = blocR32_12(llengua);
      // L'ordre de /versions: R32.10, R32.11 i R32.12 → R32.7, R32.8 i R32.9 → R32.5 i R32.6 → R32.4.
      expect(obriR32_12R32_8R32_5iR32_4(cos, llengua) && cos.startsWith(`<h3>${INICIS_R32_8[llengua]}`, bloc.length), llengua).toBe(true);
      // Paritat: els mateixos enllaços, els mateixos prefixos i el mateix nombre d'apartats en cada llengua.
      expect(interns(bloc), llengua).toEqual(interns(fitaR32_12Bloc));
      expect(titolsH4(bloc).map((t) => t.split(' · ')[0])).toEqual(PREFIXOS_R32_12[llengua]);
      expect(apartats(bloc), llengua).toHaveLength(12);
      expect(bloc.match(/[^\s>]<a |<\/a>[^\s,.:]/g), llengua).toBeNull();
      const pla = text(bloc);
      // 2.3.10 · Cap altra plataforma mòbil, cap botiga nomenada, cap canal de proves, cap format de paquet ni cap navegador.
      expect(PLATAFORMA_ALIENA.test(pla), llengua).toBe(false);
      expect(/Google|Apple|App Store|iPhone|iPad|TestFlight|Android|\bPlay\b|\bAPK\b|\bAAB\b|F-Droid|Safari|Chrome|Firefox/i.test(pla), llengua).toBe(false);
      expect(/\bdesplegad[ae]s?\b|\bdesplegat|en producció|en producción|in production|\bactivad[ao]\b|\bactivat\b|aviat|pròximament|properament|IDEA-\d|P\d-\d|D-R\d|torn_|mas[i]a|sobir/i.test(pla), llengua).toBe(false);
      expect(/\bdel poble\b|\bdel pueblo\b|\bdo pobo\b/i.test(pla), llengua).toBe(false);
      // Llei 0 · Cap jerga tècnica, cap paraula de Push ni del xifratge, cap promesa d'accessibilitat AAA ni d'avisos a zero,
      // i cap nom de la facturació oficial fora de la banda que la nomena.
      expect(/\bCAS\b|\bRPC\b|search_path|SECURITY DEFINER|\bRLS\b|BigInt|\bEXIF\b|\bGPS\b|\bMIME\b|\bACK\b|\bE2EE\b|\bCRDT\b|\bPush\b|\bFCM\b|\bAPNs\b|\bVAPID\b|WCAG|Lighthouse|\bAAA\b|\b100\s*\/\s*100\b|zero avisos|cero avisos|zero warnings|superadmin|localStorage|PostgREST|Veri\*?Factu/i.test(pla), llengua).toBe(false);
      expect(/xifra|cifrad|encrypt|zifra/i.test(pla), llengua).toBe(false);
      expect(PROMESES_FALSES_R32_12.test(pla), llengua).toBe(false);
      // La versió i el build del repositori, cap botiga encara, el build anterior amb l'avís d'un toc i els dos connectors.
      expect(pla, llengua).toContain(VERSIO_R32_12[llengua]);
      expect(pla).not.toContain('1.2.8');
      expect(pla, llengua).toContain(NO_BOTIGUES_R32_12[llengua]);
      expect(pla, llengua).toContain(BUILD_ANTERIOR_R32_12[llengua]);
      expect(pla).toContain(CONNECTOR_PUBLICAT);
      expect(pla, llengua).toContain(CONNECTOR_NO_PUBLICAT_R32_12[llengua]);
      // Les migracions i els paquets manuals, NO aplicats; la forma «ja s'ha aplicat» no hi entra.
      for (const migracio of MIGRACIONS_R32_12) expect(pla).toContain(migracio);
      expect(pla, llengua).toContain(NO_APLICADES_R32_12[llengua]);
      expect(pla, llengua).toContain(TRES_PAQUETS_R32_12[llengua]);
      expect(JA_APLICADA_R32_12.test(pla), llengua).toBe(false);
      // Les marques, en la sessió; l'assistència, en el navegador i sense viatjar.
      expect(pla, llengua).toContain(EN_LA_SESSIO_R32_12[llengua]);
      expect(pla, llengua).toContain(EN_EL_NAVEGADOR_R32_12[llengua]);
      expect(pla, llengua).toContain(NO_VIATJA_R32_12[llengua]);
      // Els rètols de la pantalla, amb el text del diccionari de cada llengua.
      const diccionari = DICCIONARIS_R32_12[llengua];
      for (const clau of CLAUS_CITADES_R32_12) {
        expect(diccionari[clau], `${llengua} · ${clau}`).toBeTruthy();
        expect(pla, `${llengua} · ${clau}`).toContain(cometes(llengua, diccionari[clau]));
      }
      // L'Avisador: el 112 i les hores sense activitat del codi (de la primera a la de 8, i 12 i 24).
      expect(pla).toContain('112');
      expect(pla, llengua).toMatch(/(?<!\d)2(?!\d)[^.]*(?<!\d)8(?!\d)[^.]*(?<!\d)12(?!\d)[^.]*(?<!\d)24(?!\d)/);
      expect(pla).toContain('WordPress');
      const segmentador = new Intl.Segmenter(llengua, { granularity: 'word' });
      const paragrafsDelBloc = [...bloc.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafsDelBloc).toHaveLength(15);
      for (const p of paragrafsDelBloc) {
        const w = [...segmentador.segment(p.replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        const n = (p.match(/<strong>/g) ?? []).length;
        const [min, max] = w >= 40 ? [6, 8] : w >= 25 ? [5, 7] : w >= 12 ? [2, 4] : [1, 3];
        expect(n >= min && n <= max, `${llengua}: ${n} negretes per a ${w} paraules (${min}–${max}): «${p.replace(/<[^>]+>/g, '').slice(0, 60)}…»`).toBe(true);
      }
      for (const m of bloc.matchAll(/<strong>([\s\S]*?)<\/strong>/g)) {
        const w = [...segmentador.segment(m[1].replace(/<[^>]+>/g, ''))].filter((s) => s.isWordLike).length;
        expect(w >= 1 && w <= 6, `${llengua} · negreta de ${w} paraules: «${m[1]}»`).toBe(true);
      }
      expect(bloc, llengua).not.toMatch(/<h([34])>(?:(?!<\/h\1>)[\s\S])*<strong>/);
      expect(bloc, llengua).not.toMatch(/<code>(?:(?!<\/code>)[\s\S])*<strong>/);
    }
  });

  test('Llei 0 · cada fet té el seu consumidor a l’arbre: versió, connector, migracions, paquets, Avisador, assistència, Calendari, bàner, marques, reenviar, banda beta, Traduccions, Dispositius, menús, fotos, estils i Arbre Genealògic', async () => {
    // La versió i el build de la crònica són els del codi; el connector publicat no és més nou que el del repositori.
    expect(PAQUET.version).toBe('1.2.9');
    expect(VERSIO_CLIENT_NATIU).toBe(14);
    expect(JSON.parse(llegix('public/.well-known/ard.json')).version).toBe(PAQUET.version);
    expect(JSON.parse(llegix('public/versio-viva.json')).versioSistema).toBe(PAQUET.version);
    expect(llegix('src/data/contracte.js')).toContain('Versió unificada 1.2.9 amb el build 14: integra R32.10 i R32.11');
    expect(CONNECTOR).toBe('1.1.17');
    expect(llegix('wordpress-plugin/readme.txt')).toMatch(/^Stable tag: 1\.1\.17$/m);
    expect(noMesNova(CONNECTOR_PUBLICAT, CONNECTOR), `${CONNECTOR_PUBLICAT} ≤ ${CONNECTOR}`).toBe(true);
    // Les dues migracions del Xat, cap fila del README les dona per aplicades; i els tres paquets manuals, marcats com a tals.
    const readme = llegix('supabase/README.md').split('\n');
    for (const migracio of MIGRACIONS_R32_12) {
      const files = readme.filter((l) => l.startsWith('| ') && l.includes(` | \`${migracio}\` | `));
      expect(files.length > 0 && files.every((l) => l.includes('**NO aplicada')), migracio).toBe(true);
    }
    const paquets = readdirSync(resolve(process.cwd(), 'supabase/snippets')).filter((f) => /^r32_1[01]_.*\.sql$/.test(f)).sort();
    expect(paquets).toEqual(['r32_10_fossils_acl_enduriment.sql', 'r32_10_xat_privades_rls_repara.sql', 'r32_11_publicacions_cas.sql']);
    expect(llegix('supabase/snippets/r32_11_publicacions_cas.sql')).toContain('MANUAL, NO APLICAT A PRODUCCIÓ');
    // L'Avisador: les hores, sense banda beta, l'entradeta a PageFrame, el 112 i la còpia plegada.
    const { HORES_AVISADOR } = await import('../../services/avisador.js');
    expect([...HORES_AVISADOR]).toEqual([2, 3, 4, 5, 6, 7, 8, 12, 24]);
    const avisador = llegix('src/pages/AvisadorPage.jsx');
    expect(avisador).not.toContain('BandaBetaMicroApp');
    expect(avisador).toContain('lead={tx(TX.intro)}');
    expect(avisador).toContain('<a href="tel:112">112</a>');
    expect(avisador).toContain('<details className="sdp-avisador__copia">');
    // L'assistència: el quadre a la pàgina de l'esdeveniment i la resposta al magatzem del navegador.
    expect(llegix('src/sections/detail/ItemDetailSection.jsx')).toContain("import { QuadreAssistenciaEsdeveniment } from './QuadreAssistenciaEsdeveniment.jsx';");
    expect(llegix('src/sections/detail/QuadreAssistenciaEsdeveniment.jsx')).toContain("t('section.events.rsvp.desat', 'S’ha desat la teua resposta en este navegador.')");
    expect(llegix('src/sections/calendari/rsvpEsdeveniments.js')).toContain("import { STORAGE_PREFIX, getVal, setVal } from '../../config/storage.js';");
    // El Calendari obri amb els esdeveniments si la URL no demana la hemeroteca.
    expect(llegix('src/sections/calendari/CalendariSection.jsx')).toContain("return PARAMS_HEMEROTECA.some((clau) => searchParams.get(clau) !== null) ? 'all' : 'events';");
    // El bàner de referència: en memòria de pestanya i a dalt de la conversa.
    expect(llegix('src/sections/xat/referenciaPaginaXat.js')).toContain('sense tocar la URL (B05) ni localStorage');
    expect(llegix('src/sections/xat/components/Conversa.jsx')).toContain('<BanerReferenciaPagina referencia={referenciaPagina} t={t} />');
    // Les marques i el reenviament, pel motor de la sessió; sense l'SQL, estat local; reenviar, amb adjunts i confirmació.
    const seccioXat = llegix('src/sections/xat/XatSection.jsx');
    for (const accio of ['onAlternaReaccio', 'onAlternaDestacat', 'onAlternaFixat', 'onEliminaMissatge', 'onReenviaMissatge']) {
      expect(seccioXat, accio).toMatch(new RegExp(`${accio}=\\{potAccionsMissatge && typeof `));
    }
    expect(seccioXat).not.toMatch(/onEliminaPerATothom/);
    const motor = llegix('src/data/xat/accionsMissatge.js');
    expect(motor).toContain("if (e?.code !== 'XAT_ACCIONS_SQL_ABSENT') throw e;");
    expect(motor).toContain("if (['imatge', 'video', 'veu'].includes(original.tipus)) {");
    expect(motor).toContain("if (!confirmat) throw error('El servidor no ha confirmat el reenviament.', 'sense-confirmacio');");
    // La banda beta declarativa: la variant fiscal, només al Bar i a la Gestoria.
    const avisos = Object.fromEntries(['bar', 'gestoria', 'lector', 'genealogia', 'nevera', 'salut']
      .map((app) => [app, llegix(`src/apps/${app}/manifest.js`).match(/avisBeta: '(\w+)'/)?.[1]]));
    expect(avisos).toEqual({ bar: 'fiscal', gestoria: 'fiscal', lector: 'general', genealogia: 'general', nevera: 'general', salut: 'general' });
    for (const llengua of Object.keys(INICIS_R32_12)) {
      expect(TEXTOS_BANDA_BETA.general[llengua].text, llengua).not.toMatch(/Verifactu|factura/i);
      expect(TEXTOS_BANDA_BETA.fiscal[llengua].text, llengua).toContain('Verifactu');
    }
    // Traduccions i Dispositius; el menú de mostra del Catàleg amb fletxes i Escape; els diccionaris nous; l'Arbre Genealògic en la llengua activa.
    expect(llegix('src/sections/translations/TranslationsSection.jsx')).toContain("import { obteContingutDidacticTraduccions } from './contingutDidacticTraduccions.jsx';");
    expect(llegix('src/sections/translations/contingutDidacticTraduccions.jsx')).toContain('<strong>programari lliure</strong>');
    expect(llegix('src/sections/dispositius/DevicesSection.jsx')).toContain("import { Insignia, QuadreDeComandament } from '../../components/PedraSeca';");
    const menu = llegix('src/components/PedraSeca/molecules/Dropdown.jsx');
    expect(menu).toContain('ArrowDown');
    expect(menu).toContain("import { useCapaEnrere } from '../hooks/useCapaEnrere.js';");
    // Llei 0 · L'únic consumidor del Dropdown és el menú de mostra del Catàleg de Disseny (EspecimenMenu.jsx): la crònica no diu més.
    const consumidorsDropdown = readdirSync(resolve(process.cwd(), 'src'), { recursive: true })
      .filter((f) => /\.jsx?$/.test(f) && !/\.test\./.test(f) && /import \{[^}]*\bDropdown\b[^}]*\} from/.test(llegix(`src/${f}`)));
    expect(consumidorsDropdown.map((f) => f.split(/[\\/]/).pop())).toEqual(['EspecimenMenu.jsx']);
    for (const fitxer of ['src/apps/lector/i18nLector.js', 'src/apps/nevera/i18nNevera.js', 'src/apps/salut/i18nSalut.js']) expect(llegix(fitxer).length, fitxer).toBeGreaterThan(0);
    expect(llegix('src/apps/genealogia/AppGenealogia.jsx')).toContain('titols={titolsGenealogia(idioma)}');
    // Les fotos: el fitxer, sense el lloc; la data i la càmera, per llista blanca; i la comprovació abans de pujar.
    const adjunt = llegix('src/sections/xat/adjuntLocal.js');
    expect(adjunt).toContain('conservaExif: false');
    expect(adjunt).toContain('preparaTiffSenseUbicacio');
    expect(llegix('src/components/universal/enquadrament/exifIncrustat.js')).toContain('export const preparaTiffSenseUbicacio = entrada => preparaTiffAmbTria(entrada, TRIA_SENSE_UBICACIO);');
    expect(llegix('src/data/supabase/xatMultimedia.js')).toContain('await comprovaImatgeSenseUbicacio(fitxer, comprova, config.signal)');
    // Els estils de cinc parts, en fulls diferits que es carreguen des del component que els usa.
    const consumidorsDe = (full) => readdirSync(resolve(process.cwd(), 'src'), { recursive: true })
      .filter((f) => /\.jsx?$/.test(f) && !/\.test\./.test(f) && llegix(`src/${f}`).includes(`${full}?inline`));
    for (const full of ['diferit-gestoria.css', 'diferit-tpv.css', 'diferit-connectar.css', 'diferit-calendari.css', 'diferit-explorador.css']) {
      expect(consumidorsDe(full).length, full).toBeGreaterThan(0);
    }
  });
});
