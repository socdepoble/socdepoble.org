/**
 * indexConsola.js — l'Índex de la Consola Termodinàmica, sense React.
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 5) · Requeriment del Mestre
 * (auditoria 261010_1404 §8.2, dictat): «On: a la part de baix de la Consola,
 * després de totes les targetes. Què: un índex de text pur: un H2 de títol i
 * H3 i H4 per als subapartats. Per a què: explicar què fa cada peça de la
 * Consola i enllaçar a la Pàgina Universal de cada targeta; només amb
 * targetes costa tindre una vista general.»
 *
 * Ací viu la jerarquia com a dada, perquè una prova la fixe sense muntar res
 * i la vista (IndexConsola.jsx) només la pinte. Cada node és
 * { id, nivell, titol, ruta, text, fills }:
 *  · nivell 2: l'arrel, «Índex de la Consola», sense ruta.
 *  · nivell 3: cada una de les nou pàgines (IDS_PAGINES, consolaPagines.js),
 *    amb el títol, la ruta de la pàgina, el «per a què» (`subtitol`) i
 *    l'entradeta del copy (`text`); i, al final, «El Mas en xifres», que no
 *    té pàgina pròpia (és una secció del tauler): sense ruta.
 *  · nivell 4: cada targeta de dins de cada pàgina, amb la seua pàgina
 *    pròpia: al pols, els tres panells (/consola/pols/<id>, polsConsola.js)
 *    i després les xifres de la seua vista; a la resta, les targetes que la
 *    vista pinta amb les fonts d'ara (VISTES_XIFRES · xifresDeVista,
 *    xifresMas.js: /consola/xifres/<slug>); davall d'«El Mas en xifres», les
 *    deu xifres del tauler (xifresDeLaGraella). `text` és l'entradeta de la
 *    xifra o l'entradilla del panell, marcada: els noms de fitxer van entre
 *    accents greus i la vista els pinta en <Mono>, que el mode privacitat
 *    amaga. `titolPrivat`, si la peça en té, és el títol sense cap ruta.
 *
 * Cap número inventat: sense Mapa ni consola.json, xifresDeVista torna el
 * nom de cada xifra fixa i cap peça de família (no es pot saber quines n'hi
 * ha); amb les fonts, el títol que la targeta pinta. Les rutes són les que
 * ja existixen (paginaConsola, rutaPanell, rutaXifra): ací no se'n fabrica
 * cap.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 2: «Agafa-les i enceta-les als
 * objectes de indexConsola.js») · Els nodes de nivell 2 i 3 porten `imatge` i
 * `imatgeAlt` (null i '' si no en tenen): la il·lustració de MarIA que els
 * toca, d'una sola taula (IMATGES_INDEX). Derogat EN PART el «text pur» del
 * dictat de l'Onada 11: l'índex continua sent un H2, H3 i H4 de text, i la
 * imatge és una miniatura quadrada davall de l'entradeta del seu títol, mai
 * una targeta ni una graella. Els H4 no en porten cap.
 * Derogat EN PART per l'ordre del Mestre del 13-10-2026 (pla 261013_1405,
 * front F) · Les il·lustracions de les pàgines van a les capçaleres de les
 * seues targetes del tauler (imatgesConsola.js, la taula única): els H3 ja no
 * porten miniatura (null i ''), perquè /consola no pinte dues vegades la
 * mateixa imatge (lliçó 261010 de sdp-universal-page). Només l'H2 conserva
 * la seua. Els camps `imatge` i `imatgeAlt` dels nivells 2 i 3 es queden.
 *
 * Ordre del Mestre, 30-10-2026 (xat, ~14:15, punts 2.1 i 2.3: «Reparació
 * integral de /consola… Redacció DIDÀCTICA en estil de publicació») ·
 *  · Fora la miniatura repetida: l'H2 ja no porta la vinyeta de la Consola
 *    (és la portada de /page/consola i la seua targeta del Mur). Cap node
 *    porta `imatge` ni `imatgeAlt`, i la taula IMATGES_INDEX desapareix.
 *    Derogat EN PART: l'Onada 12 («l'H2 i els H3 que tenen il·lustració la
 *    pinten en una miniatura») i el front F («Només l'H2 conserva la seua»).
 *  · Un article didàctic, no un llistat de definicions: cada H3 i cada H4
 *    fa els tres moviments que mana l'ordre, (1) què és i per a què servix,
 *    (2) què diuen ara les dades i (3) què està en ordre i què queda, amb
 *    l'enllaç. El primer és `text` (l'entradeta del copy, la de la xifra o
 *    la del panell) i, als H3, `explica` (paraules planes, sense cap xifra);
 *    el segon, `diu`; el tercer, `queda`. `diu` i `queda` només porten el
 *    que calculen les funcions de les targetes (mesuresPagina, estatsPagina,
 *    problemesPagina, etiquetesPagina, cobertesPols, xifresDeVista,
 *    cobertaEmpaquetats, la matriu del govern…): sense font, ho diuen amb
 *    honestedat i expliquen què hi veu qui té accés. Cap número inventat.
 *  · Hi entren tots els blocs del tauler, en el seu ordre: «Com es llig la
 *    Consola» (l'H3 just darrere de l'entradeta, lliçó 261030 de
 *    sdp-universal-page), el Govern del Mestre, les nou pàgines de la sala
 *    de màquines, El Mas en xifres i Empaquetats i llançament.
 *  · Un paràgraf és una llista de trossos sense React: { text }, { fort }
 *    (negreta), { mono } (un fitxer o una ruta, que el mode privacitat
 *    amaga) i { enllac, ruta }; `privat`, si el porta, és el que es llig amb
 *    el mode privacitat (el títol d'una peça sense la seua ruta).
 *
 * Gauntlet 261030 (cicle 4, corrector de la Consola; troballes dels crítics
 * sobre el punt 2.3) ·
 *  · El Govern no fabrica cap verd: «En ordre» només quan totes les files
 *    estan fetes i segellades; una fila amb un estat que no s'entén és «per
 *    tornar a comprovar», i el que queda es diu sense color. Les etiquetes
 *    dels H4 del Govern són les de les seues targetes (GovernConsola.jsx ·
 *    cobertaDe i senseMatriu): «Matriu obsoleta», «Hi ha P1 obertes», «El
 *    trasllat no quadra», «Cal reparar», «Sense font».
 *  · Una font que falla, o que encara es carrega, ho diu igual que la seua
 *    targeta (etiquetesPagina, etiquetesPols, senseMatriu,
 *    cobertaEmpaquetats): «Cal reparar» quan l'última lectura ha fallat,
 *    «Sense font» quan no n'hi ha i cap verd ni cap «sense semàfor» inventat.
 *    El motiu és una frase sencera (perQueNoHiHa): «l’última lectura del Mapa
 *    del Mas (mapa.json) ha fallat», «consola.json encara s’està carregant».
 *  · Res de paràgrafs plantilla: les peces d'una família (llocs del sòl,
 *    candats, arnesos, carregadors, tasques, agents atòmics) ja no són un H4
 *    cada una amb la mateixa entradeta. La família es definix una vegada, a
 *    l'H4 de la xifra que les compta (o en un H4 propi si no n'hi ha cap), i
 *    les peces que marquen alguna cosa van en una llista, cada una amb el seu
 *    enllaç, el seu estat dit en paraules (SIGNIFICAT_ESTAT) i els seus
 *    problemes, nomenats amb les línies de la seua coberta
 *    (resumProblemes.js). Una xifra que torna a eixir (El Mas en xifres, o
 *    «skills» a Entrades) remet al bloc que ja l'ha explicada.
 *  · Hipervincles vius (lliçó 261030 de sdp-universal-page): les pàgines que
 *    nomena la prosa (el pols, els empaquetats, les quatre peces dels agents,
 *    les anomalies del Mas) porten el seu enllaç ([text](clau),
 *    ambEnllacos), i els H4 de les plataformes porten a la pàgina dels
 *    empaquetats. L'alerta de vigilància diu quin avís és i enllaça la seua
 *    xifra, com AlertaVigilancia.
 *  Derogat EN PART: un H4 per peça de família, el «Sense semàfor» de les
 *  fonts que fallen, l'«En ordre» del Govern amb files obertes i la decisió
 *  de repetir el títol d'una xifra segons si porta un dígit.
 */
import { dataLocal } from './consolaContent.js';
import { plural } from './concordanca.js';
import {
  ETIQUETES, IDS_PAGINES, ORDRE_TO, avisosDeVigilancia, estatsPagina, etiquetesPagina, etiquetesPols, mesuresPagina,
  paginaConsola, paginesConsola, problemesPagina, problemesPols
} from './consolaPagines.js';
import { cobertesPols, panellsPols } from './polsConsola.js';
import {
  GRUPS_XIFRES, VISTES_XIFRES, XIFRA_DE_CODI, rutaXifra, xifresDeFamilia, xifresDeGrup, xifresDeLaGraella
} from './xifresMas.js';
import { FAMILIES } from './pecesMapa.js';
import { COLOR_D_ESTAT } from './semafor.js';
import { TEXTOS_AVIS } from './mapa/grafMapa.js';
import { resumDeProblemes } from './resumProblemes.js';
import { TITOL_GOVERN, paginesGovern } from './govern/governConsola.js';
import { recompteVist, vistaMatriu } from './govern/matriuGovern.js';
import { balancDe, comparaTrasllat } from './govern/balancGovern.js';
import { fraseDeRecompte, resumsExecutius } from './govern/comunicacioGovern.js';
import {
  ENTRADETA_EMPAQUETATS, RUTA_EMPAQUETATS, SEMAFOR, TITOL_EMPAQUETATS, canonicaDesfasada, cobertaEmpaquetats,
  paginaEmpaquetats, plataformesEmpaquetades, plataformesPerPintar
} from './empaquetats.js';
import { VERSIO_SISTEMA } from '../../config/versio.js';
import { ambEscriptures, ambInstantania } from './fontsConsola.js';

/* Decisió del Mestre (31-10-2026) · Gauntlet f9 (F3) · A la web publicada les
   fonts són la instantània sanejada de cada publicació (fontsConsola.js): no
   es lligen en viu i Refrescar torna a llegir el mateix fitxer. Els textos que
   parlaven sempre del servidor local o que prometien Refrescar ho diuen ara
   segons d'on llig la Consola. Derogat, a la web publicada: «Totes se servixen
   només al servidor local de desenvolupament: fora d’ell, la Consola no té
   dades», «El Govern la llig (del servidor local…)» i els estats de la matriu
   «del servidor local». Es llig en cada pintada, com fontsConsola.js. */
const publicada = () => ambInstantania();

/** El títol de l'índex (l'H2) i el seu id de node. */
export const TITOL_INDEX = 'Índex de la Consola';
export const ID_INDEX = 'index';
/** L'entradeta de l'índex, centrada davall de l'H2. */
export const TEXT_INDEX = 'Una guia per a llegir la Consola de dalt a baix: què és cada peça, què diuen ara les seues dades i què queda per fer. Cada títol amb enllaç porta a la pàgina on es tracta la seua peça, la mateixa que obri la seua targeta del tauler.';
/** «Com es llig la Consola»: l'H3 que obri l'article, sense pàgina pròpia. */
export const TITOL_INTRO = 'Com es llig la Consola';
export const ID_INTRO = 'com-es-llig';
/** «El Mas en xifres»: la secció del tauler, com a H3 de l'índex, sense pàgina pròpia. */
export const TITOL_MAS = 'El Mas en xifres';
export const ID_MAS = 'mas';
export const TEXT_MAS = 'Les deu xifres de capçalera del Mas, cada una amb la seua pàgina: el resum d’un colp d’ull de com està l’eixam.';
/** Els ids dels H3 del Govern del Mestre i dels empaquetats (els títols són els de les seues seccions del tauler). */
export const ID_GOVERN = 'govern';
export const ID_EMPAQUETATS = 'empaquetats';

/* ── Els trossos d'un paràgraf ───────────────────────────────────────────── */

const node = (id, nivell, titol, ruta, text, fills = []) => ({ id, nivell, titol, ruta, text, fills });

const t = (text, privat = null) => (privat ? { text, privat } : { text });
const f = (fort, privat = null) => (privat ? { fort, privat } : { fort });
const m = (mono) => ({ mono });
const a = (enllac, ruta, privat = null) => (privat ? { enllac, ruta, privat } : { enllac, ruta });
const minuscula = (text) => (text ? text[0].toLocaleLowerCase('ca') + text.slice(1) : '');
const majuscula = (text) => (text ? text[0].toLocaleUpperCase('ca') + text.slice(1) : '');

/**
 * Una frase marcada en trossos: el que va entre `accents greus` és un
 * fitxer o una ruta ({ mono }), i el que va entre **dos asteriscs**, negreta
 * ({ fort }). La resta, text. Cap tros buit.
 */
export function trossosMarcats(marcada) {
  return String(marcada ?? '').split('`')
    .flatMap((tros, i) => (i % 2 ? [m(tros)] : tros.split('**').map((part, j) => (j % 2 ? f(part) : t(part)))))
    .filter((s) => (s.text ?? s.fort ?? s.mono) !== '');
}

/* La ruta d'una clau d'enllaç de la prosa: una pàgina de la sala de
   màquines, la dels empaquetats o una xifra (rutaXifra). Cap ruta nova. */
function rutaDeClau(clau) {
  if (clau === ID_EMPAQUETATS) return RUTA_EMPAQUETATS;
  return IDS_PAGINES.includes(clau) ? paginaConsola(clau).ruta : rutaXifra(clau);
}

/**
 * Gauntlet 261030 (cicle 4; hipervincles vius) · Com trossosMarcats, i a més
 * `[text](clau)` és un enllaç a la pàgina de la clau (rutaDeClau): la prosa
 * nomena una pàgina i hi porta. Una negreta o un fitxer no travessen mai un
 * enllaç.
 */
export function ambEnllacos(marcada) {
  return String(marcada ?? '').split(/(\[[^\]]+\]\([^)]+\))/).flatMap((tros) => {
    const enllac = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tros);
    return enllac ? [a(enllac[1], rutaDeClau(enllac[2]))] : trossosMarcats(tros);
  });
}

/** Una enumeració en trossos: «a, b i c», cada element en negreta (o amb el tros, o els trossos, que torna `tros`). */
function enumera(elements, tros = (x) => f(x)) {
  return elements.flatMap((x, i) => {
    const propi = tros(x);
    return [...(i === 0 ? [] : [t(i === elements.length - 1 ? ' i ' : ', ')]), ...(Array.isArray(propi) ? propi : [propi])];
  });
}

/** L'etiqueta més greu d'una llista (roig, taronja, verd, neutre); «Canvis nous» no compta. Null sense cap. */
function pitjor(etiquetes) {
  const valides = (etiquetes ?? []).filter((e) => e && e !== ETIQUETES.nou);
  return valides.reduce((p, e) => (p === null || (ORDRE_TO[e.to] ?? 9) < (ORDRE_TO[p.to] ?? 9) ? e : p), null);
}
const esGreu = (to) => to === 'error' || to === 'avis';

/* ── Les fonts, dites en paraules ────────────────────────────────────────── */

const FONT_MAPA = [f('el Mapa del Mas'), t(' ('), m('mapa.json'), t(')')];
const FONT_CONSOLA = [m('consola.json')];
/* La mateixa font darrere de «de»: «del Mapa del Mas (mapa.json)», «de consola.json». */
const DE_FONT_MAPA = [t('del '), f('Mapa del Mas'), t(' ('), m('mapa.json'), t(')')];
const DE_FONT_CONSOLA = [t('de '), m('consola.json')];
const fontDe = (id) => (id === 'pols' ? FONT_CONSOLA : FONT_MAPA);
const deFontDe = (id) => (id === 'pols' ? DE_FONT_CONSOLA : DE_FONT_MAPA);
const estatDeFont = (id, fonts) => (id === 'pols' ? fonts.estatDades : fonts.estatMapa);
const quan = (iso, locale) => dataLocal(iso, locale);

/* Per què no hi ha dades d'una font: l'estat de la lectura (useFontDev) en
   una frase sencera. La font és el subjecte («consola.json encara s’està
   carregant») o el complement («l’última lectura del Mapa del Mas ha
   fallat»): `font` i `deFont` són les dues formes. Gauntlet 261030 (cicle 4) ·
   Derogat: MOTIU_SENSE_FONT, que penjava el predicat darrere del nom de la
   font («consola.json l’última lectura ha fallat»). */
function perQueNoHiHa(estat, font, deFont) {
  if (estat === 'loading') return [...font, t(' encara s’està carregant')];
  if (estat === 'error') return [t('l’última lectura '), ...deFont, t(' ha fallat')];
  if (publicada()) return [...font, t(' no ha arribat a la instantània d’esta publicació, i la Consola no n’inventa cap dada')];
  return [...font, t(' només se servix al servidor local de desenvolupament, i la Consola no n’inventa cap dada')];
}

/* Qui hi veurà què, segons l'estat de la lectura: qui obri la Consola al
   servidor local o, si ja hi és, la mateixa targeta quan la font arribe. A la
   web publicada, quan una publicació la porte a la instantània. */
function quiHoVeu(estat, que) {
  if (estat === 'loading') return t(` Quan acabe de carregar, la targeta hi comptarà ${que}.`);
  if (publicada()) {
    return t(estat === 'error' ? ` La seua pàgina diu l’error; quan la instantània la porte, la targeta hi comptarà ${que}.`
      : ` Quan una publicació nova de la web la porte a la instantània, la targeta hi comptarà ${que}.`);
  }
  if (estat === 'error') return t(` Quan es torne a llegir (el botó Refrescar ho torna a provar), la targeta hi comptarà ${que}.`);
  return t(` Qui obri la Consola al servidor local hi veu ${que}.`);
}

/**
 * Gauntlet 261030 (cicle 4) · Què vol dir l'estat d'una peça (els de
 * semafor.js · COLOR_D_ESTAT, en majúscules a les targetes), en paraules
 * planes. «Com es llig la Consola» ho explica una sola vegada, i cada peça
 * que el porta el diu en minúscula amb el seu significat.
 */
export const SIGNIFICAT_ESTAT = Object.freeze({
  VIU: 'corre quan li toca',
  ACTIU: 'funciona, i un consumidor acreditat ho demostra',
  'EN MARXA': 'ja funciona',
  MORT: 'havia de córrer i no corre',
  'SENSE CONSUMIDOR': 'està declarat, però cap consumidor acreditat demostra que salte',
  'SENSE LLANÇADOR': 'el registre la declara i ningú no la llança',
  'SENSE DECLARACIÓ': 'es llança, però el registre no la declara',
  'SENSE CANDATS': 'no dispara cap candat',
  'SENSE LECTOR': 'algú hi escriu i ningú no ho llig',
  PARCIAL: 'funciona només en part',
  DESCONEGUT: 'la Consola no en pot saber l’estat',
  FALTA: 'hi falta una peça per a funcionar',
  'SENSE MESURA': 'no hi ha prou dades per a mesurar-ho'
});

/* Una línia del resum dels problemes (resumDeProblemes), en trossos: la
   marca, el text, el nom curt (en <Mono>, que el mode privacitat amaga) i
   quants casos són. */
const liniaDeProblema = (l) => [
  ...(l.marca ? [t(`${l.marca} `)] : []), ...(l.text ? [t(l.text)] : []), ...(l.curt ? [m(l.curt)] : []),
  ...(l.n > 1 ? [t(` (${l.n} casos)`)] : [])
];
/* Els problemes d'una peça, nomenats com a la seua coberta: com a molt cinc línies i quants casos més. */
function nomenaProblemes(problemes) {
  const { visibles, resta } = resumDeProblemes(problemes);
  if (!visibles.length) return [];
  return [...enumera(visibles, liniaDeProblema), ...(resta ? [t(`; i ${plural(resta, 'cas', 'casos')} més`)] : [])];
}
/* L'estat d'una peça dit en paraules: el seu nom en minúscula (en negreta) i què vol dir; una etiqueta del semàfor, tal qual. */
const estatDit = (e) => (SIGNIFICAT_ESTAT[e.text]
  ? [f(e.text.toLocaleLowerCase('ca')), t(`, ${SIGNIFICAT_ESTAT[e.text]}`)]
  : [f(e.text)]);

/* ── Què és cada pàgina, en paraules planes (moviment 1, als H3) ─────────── */

const PLA = Object.freeze({
  pols: 'Com el pols d’una persona, esta pàgina diu si **l’eixam respira bé**: **quant gasta** en tòkens i crèdits, **què llig** (el rebut que deixa un agent quan llig sencer un protocol) i **quantes skills** hi ha al disc comparades amb el manifest. Servix per a preparar l’Acta Marmota **amb proves i no amb impressions**.',
  explorador: 'Imagina el Mas com un poble: cada skill, script, document o agent és **una casa**, i cada relació, **un camí**. L’Explorador és **el plànol del poble**: servix per a saber, **abans de tocar una peça, qui en depén**, i on hi ha camins que porten a cases que ja no hi són.',
  fluxos: 'Un flux de treball és **una cadena de faena**: una peça deixa un document i la següent el llig. Ací només compten les cadenes **declarades als contractes**; el que la prosa insinua es queda en **suggeriment**. Servix per a trobar **els llocs on algú deixa faena i ningú no la recull**.',
  calendari: 'Hi ha faenes que **corren soles**, sense ningú davant: tasques de launchd, hooks de git i rutines programades. El Calendari diu **quines estan vives, quines han mort** i quines estan declarades **sense llançador**, perquè cap vigilància no caiga en silenci.',
  inventari: 'És **l’inventari del magatzem de procediments**: cada skill amb el seu **semàfor** (verd, ambre o roig) segons els avisos que porta. Servix per a decidir **quina skill cal cuidar primer**.',
  entrades: 'Cada skill hauria de dir **què llig i què escriu**. Les que no ho diuen són **caixes opaques**: no es poden encadenar en cap flux i **ningú no sap què toquen** quan corren. Esta pàgina les assenyala.',
  agents: 'Un agent atòmic és un perfil que pot **treballar sol amb contracte**: rep una tasca, la fa i en deixa constància. La pàgina mira **les quatre peces** que ho fan possible ([fluxos de treball](peca-fluxos-de-treball), [tauler](peca-tauler), [agents sols](peca-agents-sols) i [vigilants](peca-vigilants)) i diu **quines falten o van a mitges**.',
  actors: 'Al voltant dels agents hi ha **actors**: els arnesos d’IA que conversen amb el Mestre, el que **es carrega en arrencar**, els [candats](candats) que vigilen cada acció, el que **corre sol** i el **sòl** de documents on treballen. Esta pàgina els ordena **capa per capa**.',
  salut: 'És **la consulta del metge**: reunix **tots els avisos del Mapa** per gravetat (alts, mitjans i baixos) i les **mètriques de salut** amb la seua prova reproduïble. Servix per a saber **què està trencat ara** i què cal vigilar.'
});

/* Què hi veu qui obri la Consola amb la font: el que mesura cada targeta
   (consolaPagines.js · MESURES), dit sense cap número. */
const QUE_HI_VEURIES = Object.freeze({
  pols: 'quants registres de consum i rebuts de lectura hi ha, i quantes skills té el manifest',
  explorador: 'quants nodes i quantes arestes té el graf del Mas',
  fluxos: 'quantes cadenes de faena hi ha declarades i quants suggeriments de la prosa',
  calendari: 'quantes tasques hi ha, quantes estan vives i quantes mortes',
  inventari: 'quantes skills hi ha al Mapa i el semàfor de cada una',
  entrades: 'quantes skills i rutes documentals hi ha, i quines són opaques',
  agents: 'quants agents atòmics i quants arnesos que conversen hi ha',
  actors: 'quants arnesos, candats i tasques programades hi ha',
  salut: 'quants avisos hi ha (i quants d’alts) i quantes mètriques de salut tenen mesura'
});

/* ── Moviments 2 i 3 de les nou pàgines (H3) ─────────────────────────────── */

function diuDePagina(p, fonts, locale) {
  const mesures = mesuresPagina(p.id, fonts);
  const estatFont = estatDeFont(p.id, fonts);
  if (!mesures) {
    return [f('Ara mateix no hi ha dades'), t(': '), ...perQueNoHiHa(estatFont, fontDe(p.id), deFontDe(p.id)), t('.'),
      quiHoVeu(estatFont, QUE_HI_VEURIES[p.id])];
  }
  const generat = p.id === 'pols' ? fonts.dades?.generat : fonts.mapa?.generat;
  return [f('Ara mateix'), t(', segons '), ...fontDe(p.id), ...(generat ? [t(` del ${quan(generat, locale)}`)] : []), t(', la targeta compta '),
    ...enumera(mesures), t('.')];
}

function quedaDePagina(p, fonts, ara) {
  const estats = estatsPagina(p.id, fonts, ara);
  const fi = (frase) => [t(frase), a(p.title, p.ruta), t('.')];
  if (!estats) {
    /* Gauntlet 261030 (cicle 4) · Sense dades, l'etiqueta de la seua targeta
       (etiquetesPagina): «Cal reparar» si l'última lectura ha fallat, «Sense
       font» si no n'hi ha i cap mentre es carrega. Derogat: «Sense font, sense
       semàfor» per a tots tres. */
    const etiqueta = pitjor(etiquetesPagina(p.id, fonts, undefined, ara));
    if (etiqueta === ETIQUETES.reparar) {
      if (publicada()) {
        return [f(etiqueta.text), t(': l’última lectura '), ...deFontDe(p.id), t(' ha fallat; la pàgina '), a(p.title, p.ruta),
          t(' diu l’error, i la instantània es torna a fer en cada publicació de la web.')];
      }
      return [f(etiqueta.text), t(': l’última lectura '), ...deFontDe(p.id), t(' ha fallat. Torna a provar-ho amb Refrescar; la pàgina '),
        a(p.title, p.ruta), t(' diu l’error.')];
    }
    return [f(etiqueta?.text ?? 'Encara es carrega'), t(': el semàfor de la targeta s’encén quan arriba '), ...fontDe(p.id),
      t('. Mentrestant, la pàgina '), a(p.title, p.ruta), t(' diu per què no hi ha dades.')];
  }
  const etiqueta = pitjor(etiquetesPagina(p.id, fonts, undefined, ara));
  const greus = estats.filter((e) => esGreu(e.to));
  const informa = estats.filter((e) => !esGreu(e.to));
  const problemes = problemesPagina(p.id, fonts) ?? [];
  const nomenats = problemes.length ? [t(` La llista sencera (${plural(problemes.length, 'cas', 'casos')}), amb cada ruta, és a `), a(p.title, p.ruta), t('.')] : null;
  if (etiqueta && esGreu(etiqueta.to)) {
    const que = greus.length ? [t(' · per resoldre: '), ...enumera(greus.map((e) => minuscula(e.text))), t('.')]
      : [t(': l’última lectura de la font ha fallat i es conserva l’anterior.')];
    return [f(etiqueta.text), ...que, ...(nomenats ?? fi(' El detall és a '))];
  }
  const nota = informa.length ? [t(' Només informa de '), ...enumera(informa.map((e) => e.text), (x) => t(x)), t('.')] : [];
  if (etiqueta) {
    return [f(etiqueta.text), t(': la font s’ha llegit i la targeta no marca res greu.'), ...nota, ...(nomenats ?? fi(' Ho pots repassar a '))];
  }
  return [f('Sense prou base per a dir que està en ordre'), t(': la font s’ha llegit, però li falta alguna mesura per a donar-la per bona.'), ...nota,
    ...(nomenats ?? fi(' El detall és a '))];
}

/* ── Moviments 2 i 3 de les targetes (H4) ────────────────────────────────── */

/**
 * Què està en ordre d'una targeta: la seua etiqueta més greu, dita en
 * paraules, i quins problemes nomena (els de la seua coberta). Sense font,
 * l'etiqueta que la targeta porta en eixe estat («Cal reparar» si la lectura
 * ha fallat, «Sense font») o, si no en porta cap, per què no es pot jutjar.
 * Gauntlet 261030 (cicle 4) · Derogat: «Sense semàfor» per a tota targeta
 * sense font, el recompte sol («11 casos per resoldre») i l'estat d'una peça
 * en majúscules sense dir què vol dir.
 */
function quedaDeTargeta({ etiquetes, problemes, ambFont, estat, deFont }) {
  const e = pitjor(etiquetes);
  if (!ambFont) {
    if (e === ETIQUETES.reparar) return [f(e.text), t(': l’última lectura '), ...deFont, t(' ha fallat.')];
    if (e) return [f(e.text), t(': sense dades no es pot dir si està en ordre.')];
    return estat === 'loading' ? [f('Encara es carrega'), t(': el semàfor arriba amb les dades.')]
      : [f('Sense mesura'), t(': sense dades no es pot dir si està en ordre.')];
  }
  const quins = nomenaProblemes(problemes);
  const perResoldre = quins.length ? [t(' Per resoldre: '), ...quins, t('.')] : [];
  if (!e) return quins.length ? [f('Sense semàfor propi'), t('.'), ...perResoldre] : [f('Només informa'), t(': és un recompte sense semàfor propi.')];
  if (SIGNIFICAT_ESTAT[e.text]) return [f(majuscula(e.text.toLocaleLowerCase('ca'))), t(`: ${SIGNIFICAT_ESTAT[e.text]}.`), ...perResoldre];
  if (e === ETIQUETES.senseFont) return [f(e.text), t(': li falta la mesura per a dir si està en ordre.')];
  if (e.to === 'exit') return [f(e.text), t(quins.length ? '.' : ': cap problema a la vista.'), ...perResoldre];
  return [f(e.text), t(quins.length ? '.' : ': la seua pàgina diu per què.'), ...perResoldre];
}

const ambFontDe = (x, mapa, dades) => Boolean(x.origen === 'consola' ? dades : mapa);
const nomDeFont = (x) => (x.origen === 'consola' ? FONT_CONSOLA : FONT_MAPA);
const deNomDeFont = (x) => (x.origen === 'consola' ? DE_FONT_CONSOLA : DE_FONT_MAPA);

/* Què diu ara una xifra: el seu títol i el seu subtítol. Una xifra que es
   titula pel seu nom (Tauler, Fluxos de treball…: el títol amb dades és el
   mateix que sense, `nom`) diu només el subtítol, que és on porta la dada.
   Gauntlet 261030 (cicle 4) · Derogat: decidir-ho per si el títol porta un
   dígit («LEDGER amb la signatura trencada» no en porta i és el fet). */
function araDeXifra(x, nom) {
  const ambTitol = x.titol !== nom || !x.subtitol;
  return [f('Ara mateix'), t(': '),
    ...(ambTitol ? [f(x.titol, x.titolPrivat), ...(x.subtitol ? [t(' · '), t(x.subtitol, x.subtitolPrivat)] : [])] : [f(x.subtitol, x.subtitolPrivat)]),
    t('.')];
}

/* Què diu una xifra sense la seua font, curt i segons l'estat de la lectura. */
function diuSenseFont(estat, x) {
  if (estat === 'loading') return [f('Encara es carrega'), t(': el recompte arriba amb '), ...nomDeFont(x), t('.')];
  if (estat === 'error') return [f('Sense dades'), t(': l’última lectura '), ...deNomDeFont(x), t(' ha fallat.')];
  return [f('Sense dades en este entorn'), t(': ací només en queda el nom.')];
}

/* Una targeta amb pàgina pròpia (una xifra) com a H4. La primera vegada que
   ix a l'article porta la seua entradeta; si torna a eixir (El Mas en
   xifres, «skills» a Entrades), remet al bloc que ja l'ha explicada. */
function deXifra(x, ctx, bloc) {
  const { fonts } = ctx;
  const ambFont = ambFontDe(x, fonts.mapa, fonts.dades);
  const estat = x.origen === 'consola' ? fonts.estatDades : fonts.estatMapa;
  const explicada = ctx.explicades.get(x.slug);
  if (!explicada) ctx.explicades.set(x.slug, bloc);
  return {
    ...node(x.slug, 4, x.titol, x.ruta, explicada ? `És la mateixa xifra del bloc «${explicada}», que ja l’explica.` : x.entradetaMarcada),
    titolPrivat: x.titolPrivat ?? null,
    diu: ambFont ? araDeXifra(x, ctx.noms.get(x.slug) ?? null) : diuSenseFont(estat, x),
    queda: quedaDeTargeta({ etiquetes: x.etiquetes, problemes: x.problemes, ambFont, estat, deFont: deNomDeFont(x) })
  };
}

/* Un panell del pols com a H4: les mètriques de la seua coberta (cobertesPols) o per què no n'hi ha. */
function dePanell(p, dades, estat, ara) {
  const coberta = cobertesPols(dades, estat)[p.id];
  return {
    ...node(`pols/${p.id}`, 4, p.titol, p.ruta, p.entradilla),
    titolPrivat: null,
    diu: coberta.metriques ? [f('Ara mateix'), t(': '), ...enumera(coberta.metriques), t('.')] : [f('Ara mateix'), t(`: ${minuscula(coberta.senseMesura)}.`)],
    queda: quedaDeTargeta({
      etiquetes: etiquetesPols(dades, estat, ara)[p.id], problemes: problemesPols(dades, ara)[p.id], ambFont: Boolean(dades), estat,
      deFont: DE_FONT_CONSOLA
    })
  };
}

/* ── Les famílies de peces (llocs del sòl, candats, arnesos…) ────────────── */

/* El nom de cada família en singular i en plural, per a comptar-ne les peces. */
const NOMS_FAMILIA = Object.freeze({
  arnes: ['arnés del Mas', 'arnesos del Mas'],
  carregador: ['carregador d’arrencada', 'carregadors d’arrencada'],
  candat: ['candat', 'candats'],
  tasca: ['tasca que corre sola', 'tasques que corren soles'],
  lloc: ['lloc del sòl', 'llocs del sòl'],
  'agent-atomic': ['agent atòmic', 'agents atòmics']
});

/* Una peça marca alguna cosa si la seua etiqueta és taronja o roja, o si nomena algun problema. */
const marcaAlgunaCosa = (x) => esGreu(pitjor(x.etiquetes)?.to) || Boolean(x.problemes?.length);

/* Una peça que marca alguna cosa, com a element de llista: el títol enllaçat
   a la seua pàgina, el subtítol de la seua targeta, l'estat dit en paraules i
   els problemes de la seua coberta. Amb el mode privacitat, les versions
   sense ruta del títol i del subtítol. */
function membre(x) {
  const e = pitjor(x.etiquetes);
  const quins = nomenaProblemes(x.problemes);
  return {
    id: x.slug,
    trossos: [a(x.titol, x.ruta, x.titolPrivat), ...(x.subtitol ? [t(' ('), t(x.subtitol, x.subtitolPrivat), t(')')] : []), t(': '),
      ...(e ? estatDit(e) : []), ...(quins.length ? [t(e ? '; per resoldre, ' : 'per resoldre, '), ...quins] : []), t('.')]
  };
}

/* Quantes peces de la família marquen alguna cosa, quantes estan en ordre i quantes només informen. */
function recompteDeMembres(peces) {
  const revisar = peces.filter(marcaAlgunaCosa).length;
  const enOrdre = peces.filter((x) => !marcaAlgunaCosa(x) && pitjor(x.etiquetes)?.to === 'exit').length;
  const informen = peces.length - revisar - enOrdre;
  return enumera([
    revisar && `${revisar} per revisar`, enOrdre && `${enOrdre} en ordre`,
    informen && `${informen} que ${informen === 1 ? 'només informa' : 'només informen'}`
  ].filter(Boolean), (x) => t(x));
}

/* On viuen totes les peces, i si la llista de davall en porta cap. */
function onEsTracten(peces, p) {
  return peces.some(marcaAlgunaCosa)
    ? [f('La llista de davall'), t(' diu què marca cada peça i porta a la seua pàgina; totes, amb la seua targeta, són a '), a(p.title, p.ruta), t('.')]
    : [f('Cap peça no marca res'), t(': totes, amb la seua targeta, són a '), a(p.title, p.ruta), t('.')];
}

/* Una família: { definicio, resum, llista }. Amb una xifra que la compta
   (`pare`), la definició de la família (què és cada peça i, si la xifra no
   ho diu ja, per què compta) va davall de la xifra; sense, la família té el
   seu H4 i la definició n'és l'entradeta. */
function membresDe(familia, peces, p, pare) {
  const [un, molts] = NOMS_FAMILIA[familia.id] ?? ['peça', 'peces'];
  const [que, ...resta] = familia.entradeta;
  const perQue = resta.at(-1);
  return {
    definicio: pare ? trossosMarcats(pare.text.includes(perQue) ? que : `${que} ${perQue}`) : null,
    resum: pare ? [f('Peça per peça'), t(`, ${plural(peces.length, un, molts)}: `), ...recompteDeMembres(peces), t('. '), ...onEsTracten(peces, p)] : null,
    llista: peces.filter(marcaAlgunaCosa).map(membre)
  };
}

/* Una família sense cap xifra que la compte, com a H4 propi (sense pàgina pròpia: les seues peces en tenen). */
function nodeFamilia(familia, peces, p) {
  const [un, molts] = NOMS_FAMILIA[familia.id] ?? ['peça', 'peces'];
  return {
    ...node(`familia/${familia.id}`, 4, plural(peces.length, un, molts), null, familia.entradeta.join(' ')),
    titolPrivat: null,
    diu: [f('Ara mateix'), t(` hi ha ${plural(peces.length, un, molts)}: `), ...recompteDeMembres(peces), t('.')],
    queda: onEsTracten(peces, p),
    membres: membresDe(familia, peces, p, null)
  };
}

/* Les targetes de dins d'una pàgina, en l'ordre en què la pàgina les pinta
   (VISTES_XIFRES): al pols, primer els tres panells (PaginaPols,
   PolsConsola.jsx) i després les xifres de la seua vista. Una família de
   peces va davall de la xifra que la compta, si la vista la pinta just
   davant (una sola xifra); si no, en un H4 propi. Sense font, cap peça. */
function fillsDePagina(p, ctx) {
  const { fonts, locale, ara } = ctx;
  const fills = p.id === 'pols' ? panellsPols().map((panell) => dePanell(panell, fonts.dades, fonts.estatDades, ara)) : [];
  let pare = null;
  for (const tros of VISTES_XIFRES[p.id] ?? []) {
    if (tros.grup) {
      const xifres = xifresDeGrup(tros.grup, fonts.mapa, fonts.dades, locale).map((x) => deXifra(x, ctx, p.title));
      fills.push(...xifres);
      pare = xifres.length === 1 ? xifres[0] : null;
      continue;
    }
    const peces = xifresDeFamilia(tros.familia, fonts.mapa, fonts.dades);
    const familia = FAMILIES.find((x) => x.id === tros.familia);
    if (peces.length && familia) {
      if (pare) pare.membres = membresDe(familia, peces, p, pare);
      else fills.push(nodeFamilia(familia, peces, p));
    }
    pare = null;
  }
  return fills;
}

/* ── «Com es llig la Consola» (el primer H3) ─────────────────────────────── */

const INTRO = 'La Consola Termodinàmica és el **tauler de manteniment** de l’eixam d’IA que cuida el Mas. **No mana res ni toca cap fitxer**: llig les fonts del repositori i les ensenya en targetes, perquè el Mestre i les IAs vegen d’un colp d’ull **què funciona, què falla i què queda per fer**.';
const INTRO_FONTS = 'Cada bloc viu d’una font: el **Govern del Mestre**, de la **matriu de requeriments**; la **sala de màquines** i **El Mas en xifres**, del **Mapa del Mas** (`mapa.json`, que compila `tooling/brain/mapa-consola.mjs`), llevat del [pols](pols), que llig `consola.json`; i els [empaquetats](empaquetats), de la **carpeta de builds**. Totes se servixen només al **servidor local de desenvolupament**: fora d’ell, la Consola **no té dades i no n’inventa cap**.';
/* Decisió del Mestre (31-10-2026) · Gauntlet f9 (F3) · La mateixa entradeta a la web publicada. */
const INTRO_FONTS_PUBLICADA = 'Cada bloc viu d’una font: el **Govern del Mestre**, de la **matriu de requeriments**; la **sala de màquines** i **El Mas en xifres**, del **Mapa del Mas** (`mapa.json`, que compila `tooling/brain/mapa-consola.mjs`), llevat del [pols](pols), que llig `consola.json`; i els [empaquetats](empaquetats), de la **carpeta de builds**. A la **web publicada**, com ara, totes ixen de la **instantània sanejada** que es fa en cada publicació, i cada pàgina diu de quan és; en viu només es compilen a l’**ordinador de desenvolupament**. Si una font no ha arribat a la instantània, la Consola **no n’inventa cap dada**.';

/* Gauntlet 261030 (cicle 4) · Els estats de les peces, una sola vegada i
   agrupats pel seu color (semafor.js · COLOR_D_ESTAT): cada estat amb el que
   vol dir (SIGNIFICAT_ESTAT). Les peces de davall el diuen en minúscula. */
const NOM_DEL_COLOR = Object.freeze([['verd', 'en verd'], ['taronja', 'en taronja'], ['roig', 'en roig'], [null, 'sense color']]);
function introEstats() {
  const grups = NOM_DEL_COLOR.map(([color, nom]) => [nom, Object.keys(COLOR_D_ESTAT).filter((k) => COLOR_D_ESTAT[k] === color)])
    .filter(([, estats]) => estats.length);
  return [t('Dins de cada pàgina, les peces porten a més el seu '), f('estat'), t(', en majúscules i amb el mateix semàfor: '),
    ...grups.flatMap(([nom, estats], i) => [t(`${i === 0 ? '' : i === grups.length - 1 ? '; i ' : '; '}${nom}, `),
      ...enumera(estats, (k) => [f(k), t(` (${SIGNIFICAT_ESTAT[k]})`)])]),
    t('.')];
}
const INTRO_SEMAFOR = 'Les etiquetes de cada targeta fan de **semàfor**: **En ordre** (verd) vol dir que la font s’ha llegit i no hi ha res greu; **Important** (taronja), que hi ha coses a mitges o per revisar; **Cal reparar** (roig), que alguna cosa està trencada; i **Sense font**, que en este entorn no s’ha pogut mesurar. **El color mai no va sol**: l’etiqueta sempre ho diu en paraules.';

function nodeIntro({ fonts, vista, govern, empaquetats, locale, ara }) {
  const llegides = [
    fonts.mapa && [f('el Mapa'), t(` (${quan(fonts.mapa.generat, locale)})`)],
    fonts.dades && [m('consola.json'), t(` (${quan(fonts.dades.generat, locale)})`)],
    vista && [f('la matriu de requeriments'), t(vista.at ? ` (${quan(vista.at, locale)})` : '')],
    empaquetats?.valor && [f('els empaquetats'), t(empaquetats.valor.generat ? ` (${quan(empaquetats.valor.generat, locale)})` : '')]
  ].filter(Boolean);
  /* Gauntlet 261030 (cicle 4) · Cada font que no hi és diu per què (encara
     es carrega o l'última lectura ha fallat), i sense cap font només callen
     les targetes de la sala de màquines i del Mas en xifres: la certificació
     del Mestre viu en este navegador i sempre compta. Derogat: «Per això cap
     targeta porta números». */
  const COM_FALTA = { loading: ' (encara es carrega)', error: ' (l’última lectura ha fallat)' };
  const faltes = [
    [!fonts.mapa, 'el Mapa', fonts.estatMapa], [!fonts.dades, 'consola.json', fonts.estatDades],
    [!vista, 'la matriu de requeriments', estatGovern(govern)], [!empaquetats?.valor, 'els empaquetats', empaquetats?.estat ?? 'absent']
  ].filter(([falta]) => falta);
  const absents = faltes.map(([, nom, estat]) => `${nom}${COM_FALTA[estat] ?? ''}`);
  const algunaFallada = faltes.some(([, , estat]) => estat === 'error');
  const diu = llegides.length
    ? [f('Ara mateix'), t(', en este entorn, la Consola llig '), ...enumera(llegides, (trossos) => trossos),
      ...(absents.length ? [t('; no té '), ...enumera(absents, (x) => t(x))] : []), t('.')]
    : [f('Ara mateix, en este entorn, la Consola no llig cap font'), t(': no té '), ...enumera(absents, (x) => t(x)),
      t('. Per això les targetes de la sala de màquines i del Mas en xifres no porten números'),
      t(publicada()
        ? (algunaFallada ? ': la pàgina de cada bloc diu l’error, i la instantània es torna a fer en cada publicació de la web.'
          : ': esta publicació de la web no porta la instantània de les seues fonts.')
        : algunaFallada ? ': torna a provar-ho amb Refrescar, i la pàgina de cada bloc diu l’error.'
          : ': qui obri la Consola al servidor local hi veu les xifres de cada peça i el seu semàfor.')];
  const perEtiqueta = new Map();
  for (const p of paginesConsola()) {
    const e = pitjor(etiquetesPagina(p.id, fonts, undefined, ara));
    const clau = e?.text ?? 'Sense etiqueta';
    perEtiqueta.set(clau, (perEtiqueta.get(clau) ?? 0) + 1);
  }
  const resum = [
    [ETIQUETES.enOrdre.text, 'en ordre', 'en ordre'], [ETIQUETES.important.text, 'important', 'importants'],
    [ETIQUETES.reparar.text, 'per reparar', 'per reparar'], [ETIQUETES.senseFont.text, 'sense font', 'sense font'],
    ['Sense etiqueta', 'sense prou base per a jutjar-la', 'sense prou base per a jutjar-les']
  ].filter(([clau]) => perEtiqueta.get(clau)).map(([clau, un, molts]) => `${perEtiqueta.get(clau)} ${perEtiqueta.get(clau) === 1 ? un : molts}`);
  const vigilancia = avisosDeVigilancia(fonts.mapa);
  const salut = paginaConsola('salut');
  /* Gauntlet 261030 (cicle 4) · Quin avís és: el que el diu (TEXTOS_AVIS, la
     redacció de l'alerta del tauler, fins als dos punts) i la seua xifra
     enllaçada (XIFRA_DE_CODI), com AlertaVigilancia. Derogat: «(el segell de
     les skills o la signatura del LEDGER)». */
  const delMas = new Map(xifresDeLaGraella(fonts.mapa).map((x) => [x.slug, x]));
  const quinAvis = (av) => {
    const que = minuscula((TEXTOS_AVIS[av.codi] ?? `Avís ${av.codi}`).split(':')[0].replace(/\.$/, ''));
    const xifra = delMas.get(XIFRA_DE_CODI[av.codi]);
    return xifra ? [t(`${que} (la seua xifra: `), a(xifra.titol, xifra.ruta, xifra.titolPrivat), t(')')] : [t(que)];
  };
  const queda = [f('Ara mateix'), t(', de les nou pàgines de la sala de màquines: '), ...enumera(resum), t('.'),
    ...(vigilancia.length
      ? [t(' '), f('Alerta'), t(': la vigilància del cervell té '), f(plural(vigilancia.length, 'avís obert', 'avisos oberts')),
        t(': '), ...enumera(vigilancia, quinAvis), t('. El detall és a '), a(salut.title, salut.ruta), t('.')]
      : [])];
  return {
    ...node(ID_INTRO, 3, TITOL_INTRO, null, INTRO),
    subtitol: null,
    explica: [ambEnllacos(publicada() ? INTRO_FONTS_PUBLICADA : INTRO_FONTS), trossosMarcats(INTRO_SEMAFOR), introEstats()],
    diu,
    queda
  };
}

/* ── El Govern del Mestre ────────────────────────────────────────────────── */

const TEXT_GOVERN = 'El **quadre de comandament del Mestre**: què s’ha demanat, què s’ha fet, què cal certificar i què passa a la tanda següent, dit en paraules planes.';
const PLA_GOVERN = 'Les IAs treballen per **tandes**, i cada tanda deixa una **matriu de requeriments**: una fila per cosa demanada, amb el seu estat, la prova i qui la porta. El Govern la llig (del servidor local o d’un fitxer que obri el Mestre) i la **compara amb el que de veres s’ha fet**; una matriu vella o d’un altre codi es marca **obsoleta** i **mai no es pinta de verd**.';
/* Decisió del Mestre (31-10-2026) · Gauntlet f9 (F3) · D'on la llig a la web publicada. */
const PLA_GOVERN_PUBLICADA = 'Les IAs treballen per **tandes**, i cada tanda deixa una **matriu de requeriments**: una fila per cosa demanada, amb el seu estat, la prova i qui la porta. El Govern la llig (a la web publicada, de la **instantània sanejada** de cada publicació; en viu, a l’ordinador de desenvolupament; o d’un fitxer que obris en este navegador) i la **compara amb el que de veres s’ha fet**; una matriu vella o d’un altre codi es marca **obsoleta** i **mai no es pinta de verd**.';

/* L'estat de la lectura de la matriu, com el llig la seua targeta
   (GovernConsola.jsx · senseMatriu): 'ready' amb matriu, 'loading' mentre es
   llig, 'error' si ha fallat i 'absent' si no n'hi ha (o sense govern). */
function estatGovern(govern) {
  if (govern?.matriu) return 'ready';
  const estat = govern?.servidor?.estat;
  return estat === 'loading' || estat === 'error' ? estat : 'absent';
}

/* Què queda obert en una matriu d'ara, sense cap color: les files a mitges,
   les de la tanda següent i les que diuen un estat que la Consola no entén. */
const queQueda = (r) => [
  r.parcial && `${r.parcial} a mitges`, r.pendent && `${r.pendent} per a la tanda següent`,
  r.obsolet && `${plural(r.obsolet, 'fila per tornar a comprovar', 'files per tornar a comprovar')}, perquè la matriu en diu un estat que la Consola no entén`
].filter(Boolean);
const totFet = (vista, r) => vista.files.length > 0 && r.fet === vista.files.length;

/* Sense matriu, què dirà cada targeta quan arribe (una frase pròpia per targeta). */
const QUE_DIRA_GOVERN = Object.freeze({
  requeriments: 'quants requeriments estan fets i segellats, quants a mitges i quants pendents',
  balanc: 'quant s’ha demanat, quant s’ha fet i què passa a la tanda següent',
  comunicacio: 'quantes tasques urgents queden obertes i qui porta cada fila'
});

/* Les quatre targetes del govern, amb les mateixes funcions que les seues
   cobertes (GovernConsola.jsx · cobertaDe): recompteVist, balancDe,
   comparaTrasllat, resumsExecutius i el registre de certificacions.
   Gauntlet 261030 (cicle 4; troballa P1 «govern-verd-fabricat») · El tercer
   moviment és el de la targeta: les seues etiquetes («Matriu obsoleta», «El
   trasllat no quadra», «Hi ha P1 obertes»; sense matriu, les de senseMatriu)
   i, on la targeta no en porta cap, el que queda dit sense color. «En ordre»
   només quan totes les files estan fetes i segellades. Derogat: «En ordre»
   amb files per tornar a comprovar, i «Sense semàfor» sense matriu. */
function cobertaGovern(id, govern, vista) {
  const registres = govern?.certificacions?.registres ?? null;
  if (id === 'certificacio') {
    // Decisió del Mestre (31-10-2026) · Gauntlet f9 (F3, F4) · Fora de desenvolupament no s'apunta res (ambEscriptures, com la pàgina).
    if (!ambEscriptures()) {
      return {
        diu: [f('A la web publicada no s’apunta cap decisió'), t(': el Mestre certifica a l’ordinador de desenvolupament, i ací es veu la matriu sencera.')],
        queda: [f('Només lectura'), t(': cap botó d’esta pàgina no apunta res, ni en este navegador ni enlloc.')]
      };
    }
    const persistent = govern?.certificacions?.persistent !== false;
    return {
      diu: !govern ? [f('Sense registre en este entorn'), t(': les decisions s’apunten en el navegador de qui obri la Consola.')]
        : registres === null ? [f('Ara mateix encara s’està carregant'), t(' el registre de decisions d’este navegador.')]
          : [f('Ara mateix'), t(': '), f(plural(registres.length, 'decisió apuntada', 'decisions apuntades')), t(' en este navegador.')],
      queda: persistent
        ? [f('Cada decisió s’apunta i no es reescriu mai'), t(': viu en este navegador, i cap agent la llig si no l’exportes.')]
        : [f('Important'), t(': este navegador no deixa desar les decisions; es perdran en tancar la pàgina.')]
    };
  }
  if (!vista) {
    const estat = estatGovern(govern);
    return {
      diu: [f(estat === 'loading' ? 'Encara es llig la matriu' : 'Sense matriu'), t(`: quan arribe, ací es dirà ${QUE_DIRA_GOVERN[id]}.`)],
      queda: estat === 'error' ? [f(ETIQUETES.reparar.text), t(': l’última lectura de la matriu ha fallat.')]
        : estat === 'loading' ? [f('Encara es carrega'), t(': el semàfor arriba amb la matriu.')]
          : [f(ETIQUETES.senseFont.text), t(': sense matriu no es pot comparar res.')]
    };
  }
  if (id === 'requeriments') {
    const r = recompteVist(vista.files);
    return {
      diu: [f('Ara mateix'), t(`: ${fraseDeRecompte(r)}.`)],
      queda: vista.caducitat.obsoleta
        ? [f('Matriu obsoleta'), t(': cap fila no es pot donar per feta fins que es torne a fer.')]
        : totFet(vista, r) ? [f('En ordre'), t(': tot el que es va demanar està fet i segellat.')]
          : !vista.files.length ? [f('Matriu buida'), t(': no porta cap requeriment, i no hi ha res a comparar.')]
            : [f('Queda faena'), t(': '), ...enumera(queQueda(r), (x) => t(x)), t('.')]
    };
  }
  if (id === 'balanc') {
    const balanc = balancDe(vista);
    const comparacio = comparaTrasllat(balanc, govern.trasllat, vista);
    return {
      diu: [f('Ara mateix'), t(': '), ...enumera([plural(balanc.demanat.length, 'demanat', 'demanats'), plural(balanc.fet.length, 'fet', 'fets'),
        `${balanc.traslladat.length} a la tanda següent`]), t('.')],
      queda: !comparacio ? [f('Sense trasllat obert'), t(': quan n’hi haja un, ací es dirà si porta tot el que queda obert.')]
        : comparacio.igual ? [f('El trasllat quadra'), t(': porta tot el que la matriu deixa obert, i res més.')]
          : [f('El trasllat no quadra'), t(`: en falten ${comparacio.falten.length} i en sobren ${comparacio.sobren.length}.`)]
    };
  }
  const resums = resumsExecutius(vista);
  return {
    diu: [f('Ara mateix'), t(': '), ...enumera([plural(resums.p1Oberts.length, 'P1 oberta', 'P1 obertes'), plural(resums.responsables, 'responsable', 'responsables'),
      ...(resums.senseResponsable ? [plural(resums.senseResponsable, 'fila sense responsable', 'files sense responsable')] : [])]), t('.')],
    queda: resums.p1Oberts.length
      ? [f('Hi ha P1 obertes'), t(': les més urgents ('), ...enumera(resums.p1Oberts.map((p) => p.id)), t(').')]
      : [f('Cap P1 oberta'), t(': no queda cap tasca de prioritat 1; la resta del que falta ho diu «Estat dels requeriments».')]
  };
}

/* Decisió del Mestre (31-10-2026) · Gauntlet f9 (F3) · Sense matriu a la web
   publicada: es llig de la instantània, no hi ha pogut entrar (o no s'ha pogut
   llegir) o esta publicació no la porta. Cap promesa de Refrescar. */
function diuGovernPublicat(estat, ambElla) {
  if (estat === 'loading') return [f('Ara mateix es llig la matriu'), t(` de la instantània publicada.${ambElla}`)];
  if (estat === 'error') {
    return [f('Ara mateix no hi ha matriu'), t(': la matriu no ha pogut entrar en la instantània publicada, o no s’ha pogut llegir, i la pàgina diu l’error. Mentrestant, pots obrir el fitxer de la matriu a la pàgina.'), t(ambElla)];
  }
  return [f('Ara mateix no hi ha cap matriu'), t(`: esta publicació de la web no la porta a la instantània; pots obrir-la des d’un fitxer a la pàgina.${ambElla}`)];
}

function nodeGovern(govern, vista) {
  const fills = paginesGovern().map((p) => ({
    ...node(`govern/${p.id}`, 4, p.title, p.ruta, p.lead), titolPrivat: null, ...cobertaGovern(p.id, govern, vista)
  }));
  const resums = vista ? resumsExecutius(vista) : null;
  const r = vista ? recompteVist(vista.files) : null;
  const estat = estatGovern(govern);
  const AMB_ELLA = ' Amb ella, ací es llig quants requeriments estan fets i segellats, quants van a mitges i quants passen a la tanda següent.';
  /* Gauntlet 261030 (cicle 4; «govern-verd-fabricat») · «En ordre» només amb
     totes les files fetes i segellades i cap P1 oberta; si no, què queda. I
     sense matriu, per què: es llig, l'última lectura ha fallat o no n'hi ha. */
  return {
    ...node(ID_GOVERN, 3, TITOL_GOVERN, null, TEXT_GOVERN, fills),
    subtitol: null,
    explica: [trossosMarcats(publicada() ? PLA_GOVERN_PUBLICADA : PLA_GOVERN)],
    diu: resums ? [f('Ara mateix'), t(`: ${resums.general.join(' ')}`)]
      : publicada() ? diuGovernPublicat(estat, AMB_ELLA)
        : estat === 'loading' ? [f('Ara mateix es llig la matriu'), t(` del servidor local.${AMB_ELLA}`)]
          : estat === 'error' ? [f('Ara mateix no hi ha matriu'), t(': l’última lectura de la matriu del servidor local ha fallat. Torna a provar-ho amb Refrescar, o obri el fitxer de la matriu a la pàgina.'), t(AMB_ELLA)]
            : [f('Ara mateix no hi ha cap matriu connectada'), t(`: arriba pel servidor local de desenvolupament o des d’un fitxer que el Mestre obri a la pàgina.${AMB_ELLA}`)],
    queda: !vista
      ? (estat === 'error' ? [f(ETIQUETES.reparar.text), t(': les quatre targetes de davall diuen que la lectura ha fallat.')]
        : estat === 'loading' ? [f('Encara es carrega'), t(': el semàfor de cada targeta arriba amb la matriu.')]
          : [f(ETIQUETES.senseFont.text), t(': les quatre targetes de davall diuen què falta per a mesurar-les.')])
      : vista.caducitat.obsoleta ? [f('Important'), t(': la matriu és obsoleta. '), t(vista.caducitat.motius.map((x) => x.text).join(' '))]
        : resums.p1Oberts.length ? [f('Important'), t(`: queden ${plural(resums.p1Oberts.length, 'P1 oberta', 'P1 obertes')}.`)]
          : totFet(vista, r) ? [f('En ordre'), t(': la matriu és d’ara, tot el que es va demanar està fet i segellat i no queda cap P1 oberta.')]
            : [f('Queda faena'), t(': cap P1 oberta, però '), ...(vista.files.length ? enumera(queQueda(r), (x) => t(x)) : [t('la matriu no porta cap requeriment')]), t('.')]
  };
}

/* ── Empaquetats i llançament ────────────────────────────────────────────── */

const PLA_EMPAQUETATS = 'Abans de publicar una versió a les botigues o al web, cal saber si **totes les plataformes porten el mateix número** que la **Versió Canònica del Sistema**. Esta peça ho compara amb la **carpeta de builds** i diu **l’ordre exacta** per a publicar cada una; **cap botó no puja res**.';
const QUE_ES_PLATAFORMA = Object.freeze({
  android: 'L’aplicació d’Android, la que es publica a Google Play. Ha de portar la mateixa versió que la Versió Canònica del Sistema.',
  ios: 'L’aplicació d’iPhone i d’iPad, la que es publica a l’App Store. També ha d’anar al pas de la Versió Canònica del Sistema.',
  pwa: 'La web `socdepoble.org`. Declara la versió de `package.json`, que és la mateixa font de la canònica: no es pot desfasar d’ella mateixa, i la versió desplegada no es mesura ací.',
  wordpress: 'El connector que porta Sóc de Poble a qualsevol web WordPress. Porta numeració pròpia (1.1.x) i es compara amb el seu canal estable, no amb la canònica.'
});

function nodeEmpaquetats(empaquetats) {
  const valor = empaquetats?.valor ?? null;
  const estat = empaquetats?.estat ?? 'absent';
  const pagina = paginaEmpaquetats();
  const coberta = cobertaEmpaquetats(valor, estat);
  const plataformes = valor ? plataformesEmpaquetades(valor) : [];
  /* Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · Dins de l'app nativa,
     la Consola pública no nomena cap altra plataforma mòbil (regla 2.3.10):
     l'entrada d'Android no es pinta (plataformesPerPintar). */
  const fills = plataformesPerPintar().map((base) => {
    const p = plataformes.find((x) => x.id === base.id) ?? null;
    const semafor = p ? SEMAFOR[p.semafor] : null;
    /* Gauntlet 261030 (cicle 4) · El títol porta a la pàgina dels empaquetats,
       on viu el detall de cada plataforma (hipervincles vius). Què declara és
       el motiu del seu semàfor, una sola vegada, i la build a part; sense
       dades, per què, segons l'estat de la lectura. Derogat: «declara X.
       Declara X, …» i «Sense semàfor». */
    return {
      ...node(`empaquetats/${base.id}`, 4, base.nom, pagina.ruta, QUE_ES_PLATAFORMA[base.id]),
      titolPrivat: null,
      diu: !p ? (estat === 'loading' ? [f('Encara es carrega'), t(': la versió declarada arriba amb els empaquetats.')]
        : estat === 'error' ? [f('Sense dades'), t(': l’última lectura dels empaquetats ha fallat.')]
          : [f('Sense dades en este entorn'), t(': la versió declarada no es pot llegir.')])
        : [f('Ara mateix'), t(`: ${minuscula(p.motiu)}`), ...(p.build ? [t(' Porta la build '), f(p.build), t('.')] : [])],
      queda: !p ? [f('Sense mesura'), t(': sense dades no es pot dir si va al pas.')]
        : [f(semafor.text), t(p.ultim ? (p.alDia ? ' · a la carpeta de builds, l’últim artefacte és el de la versió declarada.' : ' · a la carpeta de builds, l’últim artefacte és d’una altra versió.')
          : ' · cap artefacte de la carpeta de builds no porta la versió al nom.')]
    };
  });
  const comparables = plataformes.filter((p) => p.pista !== 'font');
  const desfasades = comparables.filter((p) => p.semafor === 'desfasat').length;
  const foraDelPas = comparables.filter((p) => p.semafor !== 'alineat').map((p) => p.nom);
  const etiqueta = pitjor(coberta.etiquetes);
  return {
    ...node(ID_EMPAQUETATS, 3, TITOL_EMPAQUETATS, RUTA_EMPAQUETATS, ENTRADETA_EMPAQUETATS, fills),
    subtitol: pagina.subtitle,
    explica: [trossosMarcats(PLA_EMPAQUETATS)],
    diu: valor
      ? [f('Ara mateix'), t(': la Versió Canònica del Sistema és '), f(`v${VERSIO_SISTEMA}`), t(', i hi van al pas '),
        f(`${comparables.filter((p) => p.semafor === 'alineat').length} de ${comparables.length}`), t(' plataformes'),
        ...(desfasades ? [t(' ('), f(plural(desfasades, 'desfasada', 'desfasades')), t(')')] : []), t('. La web no hi compta: n’és la font.'),
        ...(canonicaDesfasada(valor) ? [t(' La pàgina porta una versió diferent de la del disc: cal recarregar-la.')] : [])]
      : [f('Ara mateix no hi ha dades dels empaquetats'), t(': '),
        ...perQueNoHiHa(estat, [m('/__iaia/empaquetats.json')], [t('de '), m('/__iaia/empaquetats.json')]), t('.'),
        t(estat === 'absent' && !publicada() ? ' Qui hi té accés veu la versió que declara cada plataforma, si va al pas i quins artefactes ja estan fets.'
          : ' Quan es puguen llegir, ací es dirà la versió que declara cada plataforma, si va al pas i quins artefactes ja estan fets.')],
    queda: [f(etiqueta?.text ?? 'Encara es carrega'),
      ...(etiqueta === ETIQUETES.enOrdre ? [t(': totes les plataformes van al pas.')]
        : etiqueta === ETIQUETES.important && foraDelPas.length ? [t(' · no van al pas: '), ...enumera(foraDelPas), t('.')]
          : etiqueta === ETIQUETES.important ? [t(': la pàgina porta una versió diferent de la del disc.')]
            : etiqueta === ETIQUETES.reparar ? [t(publicada() ? ': l’última lectura dels empaquetats ha fallat; la pàgina diu l’error.'
              : ': l’última lectura dels empaquetats ha fallat; torna a provar-ho amb Refrescar.')]
              : [t(': sense dades no es pot dir si van al pas.')]),
      t(' Les ordres de publicació són a '), a(pagina.title, pagina.ruta), t('.')]
  };
}

/* ── El Mas en xifres ────────────────────────────────────────────────────── */

const PLA_MAS = 'Són **deu números que resumixen tot el tauler**: quantes skills, agents i coses que corren soles hi ha, i quantes **anomalies** ([avisos alts](avisos-alts), [el LEDGER](linies-ledger), [els torns caducats](torns-caducats), [el segell de les skills](skills-fora-del-segell)…). Totes ixen del **Mapa del Mas**, i cada una porta a **la pàgina on es tracta**.';

function nodeMas(ctx) {
  const { fonts, locale } = ctx;
  const xifres = xifresDeLaGraella(fonts.mapa);
  const fills = xifres.map((x) => deXifra(x, ctx, TITOL_MAS));
  const perTo = (to) => xifres.filter((x) => pitjor(x.etiquetes)?.to === to);
  const recompte = [[perTo('exit'), 'en ordre', 'en ordre'], [perTo('avis'), 'important', 'importants'], [perTo('error'), 'per reparar', 'per reparar']]
    .filter(([llista]) => llista.length).map(([llista, un, molts]) => `${llista.length} ${llista.length === 1 ? un : molts}`);
  const llistaXifres = (llista) => enumera(llista, (x) => a(x.titol, x.ruta, x.titolPrivat));
  const roges = perTo('error');
  const taronja = perTo('avis');
  return {
    ...node(ID_MAS, 3, TITOL_MAS, null, TEXT_MAS, fills),
    subtitol: null,
    explica: [ambEnllacos(PLA_MAS)],
    diu: fonts.mapa
      ? [f('Ara mateix'), t(`, amb el Mapa del ${quan(fonts.mapa.generat, locale)}, de les ${xifres.length} xifres: `), ...enumera(recompte), t('.')]
      : [f('Ara mateix no hi ha Mapa'), t(': '), ...perQueNoHiHa(fonts.estatMapa, FONT_MAPA, DE_FONT_MAPA),
        t('. Les deu targetes només porten el seu nom; amb el Mapa, cada una hi porta el seu recompte i el seu semàfor.')],
    queda: !fonts.mapa
      ? (fonts.estatMapa === 'loading' ? [f('Encara es carrega'), t(': el semàfor de cada xifra arriba amb el Mapa.')]
        : [f('Sense mesura'), t(': sense el Mapa no es pot dir quines xifres estan en ordre.')])
      : roges.length || taronja.length
        ? [...(roges.length ? [f('Cal reparar'), t(': '), ...llistaXifres(roges), t('. ')] : []),
          ...(taronja.length ? [f('Important'), t(': '), ...llistaXifres(taronja), t('.')] : [])]
        : [f('En ordre'), t(': cap xifra no marca res greu.')]
  };
}

/* ── L'índex sencer ──────────────────────────────────────────────────────── */

/**
 * La jerarquia de l'índex amb les fonts d'ara: un sol node arrel (nivell 2)
 * amb «Com es llig la Consola», el Govern del Mestre, les nou pàgines, «El
 * Mas en xifres» i els empaquetats (nivell 3), i dins de cada un les seues
 * targetes (nivell 4). `extres` porta l'estat de les lectures (estatMapa,
 * estatDades), la font del govern (useGovern), la dels empaquetats
 * (useFontDev) i el rellotge de la pintada (`ara`), el mateix de les
 * targetes. Sense fonts, el nom de cada xifra fixa, cap peça de família i
 * cap número.
 */
export function indexConsola(mapa = null, dades = null, locale = 'ca-ES', extres = {}) {
  const { govern = null, empaquetats = null, ara = Date.now() } = extres;
  const fonts = {
    mapa, dades, estatMapa: extres.estatMapa ?? (mapa ? 'ready' : 'absent'), estatDades: extres.estatDades ?? (dades ? 'ready' : 'absent')
  };
  // Decisió del Mestre (31-10-2026) · La matriu de la instantània publicada, amb el seu rellotge (useGovern.js).
  const vista = govern?.matriu ? vistaMatriu(govern.matriu, { head: govern.head, ara: govern.rellotge ?? ara }) : null;
  /* El context dels H4: les fonts, el nom sense dades de cada xifra fixa (per
     a saber quines es titulen pel seu nom, araDeXifra) i les xifres que ja
     s'han explicat, amb el bloc on ho han fet (deXifra). */
  const ctx = {
    fonts, locale, ara, explicades: new Map(),
    noms: new Map(Object.keys(GRUPS_XIFRES).flatMap((grup) => xifresDeGrup(grup)).map((x) => [x.slug, x.titol]))
  };
  const pagines = paginesConsola().map((p) => ({
    ...node(p.id, 3, p.title, p.ruta, p.lead, fillsDePagina(p, ctx)),
    subtitol: p.subtitle,
    explica: [ambEnllacos(PLA[p.id])],
    diu: diuDePagina(p, fonts, locale),
    queda: quedaDePagina(p, fonts, ara)
  }));
  const fills = [
    nodeIntro({ fonts, vista, govern, empaquetats, locale, ara }),
    nodeGovern(govern, vista),
    ...pagines,
    nodeMas(ctx),
    nodeEmpaquetats(empaquetats)
  ];
  return [node(ID_INDEX, 2, TITOL_INDEX, null, TEXT_INDEX, fills)];
}

/** Tots els nodes de l'índex, aplanats en l'ordre del document (per a provar-lo i per a l'Índex de secció). */
export function nodesDeLIndex(index) {
  return index.flatMap((n) => [n, ...nodesDeLIndex(n.fills)]);
}
