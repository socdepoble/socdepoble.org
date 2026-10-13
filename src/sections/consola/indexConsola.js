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
 */
import { paginesConsola } from './consolaPagines.js';
import { IMATGES_CONSOLA } from './imatgesConsola.js';
import { panellsPols } from './polsConsola.js';
import { xifresDeLaGraella, xifresDeVista } from './xifresMas.js';

/** El títol de l'índex (l'H2) i el seu id de node. */
export const TITOL_INDEX = 'Índex de la Consola';
export const ID_INDEX = 'index';
/** La línia que explica l'índex, davall de l'H2. */
export const TEXT_INDEX = 'Què fa cada peça de la Consola i on és la seua pàgina: les nou pàgines del tauler, les targetes de dins de cada una i les deu xifres del Mas. Cada títol porta a la seua pàgina.';
/** «El Mas en xifres»: la secció del tauler, com a H3 de l'índex, sense pàgina pròpia. */
export const TITOL_MAS = 'El Mas en xifres';
export const ID_MAS = 'mas';
export const TEXT_MAS = 'Les deu xifres del tauler, cada una amb la seua pàgina. Sense el Mapa, el seu nom i cap número.';

/* Onada 12 (261011; ordres 261011_0130, punt 2) · LA TAULA ÚNICA id del node
   → il·lustració. Les rutes són fitxers que ja se servixen des de public/
   (les 14 vinyetes de /assets/ui/plugins i les 4 nano cards de
   /assets/nano_cards són les 18 de 01_produccio/Targetes_Davinci_Llestes,
   que és zona humana i no s'importa): indexConsola.test.js llig el disc i
   comprova que cada fitxer hi és, i que la ruta i el text alternatiu són els
   de la font que ja pinta eixa imatge (PAGE_COPY o registrePlugins.js).
   Criteri: una imatge només entra on el seu significat casa de veres amb el
   node. Cap il·lustració d'una app (TPV, Rebost, Gestoria, Vehicle…) va
   damunt d'una pàgina de la Consola que parla d'una altra cosa.
    · index (l'H2) · consola_vinyeta: és la imatge de la Consola
      (PAGE_COPY.consola, la de /page/consola i de la seua targeta del Mur).
   Derogat EN PART per l'ordre del Mestre del 13-10-2026 (pla 261013_1405,
   front F): «explorador · cervell_vinyeta» i «salut · salut_vinyeta» com a
   miniatures dels seus H3, i «La resta de pàgines no tenen cap il·lustració
   pròpia entre les 18: es queden sense». Ara la taula de totes les
   il·lustracions de la Consola és imatgesConsola.js, amb el criteri de cada
   una (i les ESBORRANY per al Mestre); les de les nou pàgines van a la seua
   targeta del tauler, i d'ací l'Índex només en pren la de l'H2. L'export es
   conserva amb el seu nom: qui el llig continua llegint la taula de l'Índex. */
export const IMATGES_INDEX = Object.freeze({ [ID_INDEX]: IMATGES_CONSOLA.index });

/** La il·lustració d'un node ({ imatge, imatgeAlt }); sense, null i ''. */
const imatgeDe = (id) => {
  const propia = Object.hasOwn(IMATGES_INDEX, id) ? IMATGES_INDEX[id] : null;
  return { imatge: propia?.imatge ?? null, imatgeAlt: propia?.imatgeAlt ?? '' };
};

const node = (id, nivell, titol, ruta, text, fills = []) => ({ id, nivell, titol, ruta, text, fills });

/* Una targeta amb pàgina pròpia (xifra, peça del Mapa o panell del pols) com a H4. */
const deXifra = (x) => ({ ...node(x.slug, 4, x.titol, x.ruta, x.entradetaMarcada), titolPrivat: x.titolPrivat ?? null });
const dePanell = (p) => ({ ...node(`pols/${p.id}`, 4, p.titol, p.ruta, p.entradilla), titolPrivat: null });

/* Les targetes de dins d'una pàgina, en l'ordre en què la pàgina les pinta:
   al pols, primer els tres panells (PaginaPols, PolsConsola.jsx) i després
   les xifres de la seua vista. */
function fillsDePagina(id, mapa, dades, locale) {
  const xifres = xifresDeVista(id, mapa, dades, locale).map(deXifra);
  return id === 'pols' ? [...panellsPols().map(dePanell), ...xifres] : xifres;
}

/**
 * La jerarquia de l'índex amb les fonts d'ara: un sol node arrel (nivell 2)
 * amb les nou pàgines i «El Mas en xifres» (nivell 3), i dins de cada un les
 * seues targetes (nivell 4). Sense fonts, el nom de cada xifra fixa i cap
 * peça de família.
 */
export function indexConsola(mapa = null, dades = null, locale = 'ca-ES') {
  const pagines = paginesConsola().map((p) => ({
    ...node(p.id, 3, p.title, p.ruta, p.lead, fillsDePagina(p.id, mapa, dades, locale)),
    subtitol: p.subtitle,
    ...imatgeDe(p.id)
  }));
  const mas = {
    ...node(ID_MAS, 3, TITOL_MAS, null, TEXT_MAS, xifresDeLaGraella(mapa).map(deXifra)), subtitol: null, ...imatgeDe(ID_MAS)
  };
  return [{ ...node(ID_INDEX, 2, TITOL_INDEX, null, TEXT_INDEX, [...pagines, mas]), ...imatgeDe(ID_INDEX) }];
}

/** Tots els nodes de l'índex, aplanats en l'ordre del document (per a provar-lo i per a l'Índex de secció). */
export function nodesDeLIndex(index) {
  return index.flatMap((n) => [n, ...nodesDeLIndex(n.fills)]);
}
