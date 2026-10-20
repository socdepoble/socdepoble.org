/**
 * moderacio.js — Fase D (261020, tasca 2; pla 261020_1300 · App Store 1.2 i
 * Google Play UGC) · Les regles pures de la moderació: què es pot denunciar
 * o bloquejar, què s'amaga quan has bloquejat algú i la capa optimista de
 * bloquejos de la sessió. Sense React ni xarxa: les llig ModeracioContext
 * (app/contexts), MurContext i XatContext.
 *
 * TRES REGLES DE PRIVACITAT (crítica 261020, troballa 4)
 *   · S'amaga per QUI SIGNA (autorDe): bloquejar una persona amaga el que ella
 *     publica com a ella mateixa; bloquejar una entitat, el que publica
 *     l'entitat. Mai s'infereix qui opera una entitat: amagar una publicació
 *     de l'entitat perquè l'ha escrita una persona bloquejada diria qui hi ha
 *     darrere (i podria amagar-te les de la teua pròpia entitat).
 *   · Al xat, el servidor torna la persona real (usuari_id) també en un
 *     missatge signat per una entitat (deute conegut de 2609282100): un
 *     missatge `comEntitat` no s'anota mai, i la vista prèvia d'un fil només
 *     s'amaga en un directe 1:1 amb una persona o en un grup sense subjecte
 *     ni entitat.
 *   · Res de qui mira (esDeQuiMira: la persona i les entitats que representa)
 *     no s'amaga mai.
 *
 * Objectiu (el que denuncia o bloqueja la interfície), congelat:
 *   { tipus, id, titol, autor: { tipus: 'persona' | 'entitat', id, nom } | null,
 *     filId: string | null, bloquejable: boolean }
 */
import { autorDe } from './navigation.js';
import { esIAIA } from '../data/identitatsSeed.js';
import { PREFIX_PER_DEFECTE } from '../data/xatsPerDefecte.js';
import { TIPUS_BLOQUEJAT, esIdDeModeracio } from '../data/contracte.js';

const text = (valor) => (valor == null ? '' : String(valor));
const MAI = () => false;

/** La clau d'un bloqueig al conjunt de la sessió: 'persona:<id>' o 'entitat:<id>'. */
export const clauDeBloqueig = (tipus, id) => `${tipus}:${id}`;

/**
 * El text amb cada {clau} de `valors` posada al seu lloc; una clau que no hi
 * és es queda com estava. Amb una funció de reemplaç: un nom amb «$&» o «$'»
 * es pinta tal qual (crítica 261020, troballa 20). Pura.
 */
export const omple = (plantilla, valors = {}) => String(plantilla ?? '').replace(/\{(\w+)\}/g,
  (tros, clau) => (Object.hasOwn(valors, clau) ? String(valors[clau]) : tros));

/* Els continguts que es denuncien des d'una targeta o d'una barra: les
   pàgines del sistema ('pagina'), els avisos i les notes, no. */
const MODERABLES = Object.freeze(['publicacio', 'producte', 'esdeveniment']);
/* Els perfils públics (objecteDePerfil) que es denuncien i es bloquegen: ni
   els grups ni les IA. */
const PERFILS = Object.freeze(['persona', 'entitat']);

/* Ni el pilot (Sóc de Poble), ni la IAIA, ni qui mira. */
const esIntocable = (id, projecte, esDeQuiMira) => projecte === true || esIAIA(id) || esDeQuiMira(id) === true;

/**
 * L'objectiu d'una targeta o d'una barra (el descriptor de objecteDe:
 * Mur, Mercat o Agenda) o d'un perfil públic (objecteDePerfil), o null si no
 * es pot denunciar: sense id vàlid, sense autor amb id, nom i tipus, o del
 * pilot, de la IAIA o de qui mira. Pura.
 */
export function objectiuDeTargeta(objecte, { esDeQuiMira = MAI } = {}) {
  if (!objecte || typeof objecte !== 'object') return null;
  if (objecte.seccio === 'perfil' && PERFILS.includes(objecte.tipus)) {
    const id = text(objecte.id).trim();
    const nom = text(objecte.titol).trim();
    if (!esIdDeModeracio(id) || !nom || esIntocable(id, objecte.projecte, esDeQuiMira)) return null;
    return Object.freeze({
      tipus: objecte.tipus, id, titol: nom, autor: Object.freeze({ tipus: objecte.tipus, id, nom }), filId: null, bloquejable: true
    });
  }
  if (!MODERABLES.includes(objecte.tipus)) return null;
  const id = text(objecte.id).trim();
  const autor = objecte.autor;
  const autorId = text(autor?.id).trim();
  const nom = text(autor?.nom).trim();
  if (!esIdDeModeracio(id) || !autorId || !nom || !TIPUS_BLOQUEJAT.includes(autor?.tipus)) return null;
  if (esIntocable(autorId, autor.projecte, esDeQuiMira)) return null;
  return Object.freeze({
    tipus: objecte.tipus, id, titol: text(objecte.titol), autor: Object.freeze({ tipus: autor.tipus, id: autorId, nom }),
    filId: null, bloquejable: esIdDeModeracio(autorId)
  });
}

/* Un fil que no és cap fil del servidor: el de mostra (fake-*) o una fila
   d'ajuda sintètica (xatsPerDefecte.js). */
const esFilDeMentida = (filId) => !filId || filId.startsWith('fake-') || filId.startsWith(PREFIX_PER_DEFECTE);

/**
 * L'objectiu d'una bombolla d'una altra persona, o null: ni les pròpies, ni
 * les de sistema, ni les esborrades, ni les que encara no són al servidor,
 * ni les de la IAIA, ni les d'un fil de mostra. Un visitant sense usuari és
 * només denunciable; un missatge signat per una entitat, també (bloquejar-ne
 * l'autor diria qui opera l'entitat). Pura.
 */
export function objectiuDeMissatge(missatge, fil) {
  const m = missatge;
  if (!m || m.tipus === 'sistema' || m.sender === 'me' || m.esborrat || m.esborratAl) return null;
  if (m.estatEnviament && m.estatEnviament !== 'enviat') return null;
  const filId = text(fil?.id ?? m.threadId);
  if (esFilDeMentida(filId)) return null;
  const id = text(m.id);
  const usuariId = text(m.usuariId).trim();
  if (!esIdDeModeracio(id) || m.is_ai || (usuariId && esIAIA(usuariId))) return null;
  const nom = text(m.author).trim();
  const autor = usuariId && esIdDeModeracio(usuariId) ? Object.freeze({ tipus: 'persona', id: usuariId, nom }) : null;
  return Object.freeze({ tipus: 'missatge', id, titol: '', autor, filId, bloquejable: Boolean(autor && nom) && !m.comEntitat });
}

/**
 * L'objectiu de l'altra part d'un directe 1:1 amb una persona (la capçalera
 * de la conversa), o null: ni grups, ni la IAIA, ni canals d'entitat, ni
 * fils de pàgina, ni fils de mostra. Pura.
 */
export function objectiuDeContrapart(fil) {
  if (!fil || fil.tipus !== 'directe' || fil.esIA || fil.subjecte || fil.comEntitat) return null;
  const filId = text(fil.id);
  const altres = Array.isArray(fil.altres) ? fil.altres : [];
  if (esFilDeMentida(filId) || altres.length !== 1) return null;
  const altra = altres[0];
  const id = text(altra?.id).trim();
  const nom = text(altra?.nom || fil.name).trim();
  if (altra?.tipus !== 'persona' || !esIdDeModeracio(id) || !nom || esIAIA(id)) return null;
  return Object.freeze({
    tipus: 'persona', id, titol: nom, autor: Object.freeze({ tipus: 'persona', id, nom }), filId, bloquejable: true
  });
}

/**
 * Cert si qui SIGNA l'element (autorDe: l'entitat o, si no n'hi ha, la
 * persona) és a `claus` (un Set de clauDeBloqueig). Mai res de qui mira. Pura.
 */
export function elementBloquejat(item, claus, { esDeQuiMira = MAI } = {}) {
  if (!item || !claus?.size) return false;
  const autor = autorDe(item);
  return Boolean(autor) && esDeQuiMira(autor.id) !== true && claus.has(clauDeBloqueig(autor.tipus, autor.id));
}

/** La llista sense els elements bloquejats; la MATEIXA referència si no en lleva cap. Pura. */
export function filtraElementsBloquejats(llista, esBloquejat) {
  if (!Array.isArray(llista) || typeof esBloquejat !== 'function') return llista;
  const visibles = llista.filter((element) => !esBloquejat(element));
  return visibles.length === llista.length ? llista : visibles;
}

/**
 * Els missatges amb els d'una persona bloquejada anotats: `bloquejat: true`,
 * el text buit i sense metadades (id, seq, sender, threadId, author i
 * creatAl es conserven: la lectura, el cursor i les marques continuen). Mai
 * els propis, els de sistema ni els signats per una entitat. La MATEIXA
 * referència si no n'anota cap. Pura.
 */
export function anotaMissatgesBloquejats(missatges, esPersonaBloquejada) {
  if (!Array.isArray(missatges) || typeof esPersonaBloquejada !== 'function') return missatges;
  let canvia = false;
  const eixida = missatges.map((m) => {
    if (!m || m.sender === 'me' || m.tipus === 'sistema' || m.comEntitat || !m.usuariId || !esPersonaBloquejada(m.usuariId)) return m;
    canvia = true;
    return { ...m, text: '', metadades: {}, bloquejat: true };
  });
  return canvia ? eixida : missatges;
}

/* La persona de l'altra part d'un directe 1:1, o null. */
function personaDelDirecte(fil) {
  if (fil?.tipus !== 'directe') return null;
  const altres = Array.isArray(fil.altres) ? fil.altres : [];
  return altres.length === 1 && altres[0]?.tipus === 'persona' && altres[0].id != null ? String(altres[0].id) : null;
}

/* Cert si la vista prèvia del fil és d'una persona bloquejada i es pot
   amagar sense dir qui opera cap entitat. */
function previaBloquejada(fil, esPersonaBloquejada) {
  if (!fil) return false;
  const persona = personaDelDirecte(fil);
  if (persona) {
    return esPersonaBloquejada(persona) === true && (!fil.ultimAutorId || String(fil.ultimAutorId) === persona);
  }
  return fil.tipus === 'grup' && !fil.subjecte && !fil.comEntitat && Boolean(fil.ultimAutorId)
    && esPersonaBloquejada(fil.ultimAutorId) === true;
}

/**
 * La llista de converses amb la vista prèvia amagada (`ultimAmagat: true`,
 * `ultimText` buit, i la cerca només pel nom) on l'últim missatge és d'una
 * persona bloquejada: un directe 1:1 amb ella o un grup sense subjecte ni
 * entitat.
 * Fase D (261020, revisió) · Un directe 1:1 amb una persona bloquejada ja no
 * avisa de res: `noLlegits: 0` (ni pastilla ni negreta, com el total, que no
 * el suma: senseDirectesBloquejats), també si l'últim és de qui mira; i, si
 * l'últim és d'ella, `ultimAl: null`, perquè cada missatge seu no torne a
 * pujar la fila al capdamunt ni en diga l'hora. `noLlegitManual` es queda:
 * és cosa de qui mira. Les dades crues (fils, cursors) no es toquen.
 * La MATEIXA referència si no en toca cap. Pura.
 */
export function anotaFilsBloquejats(fils, esPersonaBloquejada) {
  if (!Array.isArray(fils) || typeof esPersonaBloquejada !== 'function') return fils;
  let canvia = false;
  const eixida = fils.map((fil) => {
    const persona = personaDelDirecte(fil);
    const directeBloquejat = Boolean(persona) && esPersonaBloquejada(persona) === true;
    const amaga = previaBloquejada(fil, esPersonaBloquejada);
    const apagaNoLlegits = directeBloquejat && (Number(fil.noLlegits) || 0) !== 0;
    if (!amaga && !apagaNoLlegits) return fil;
    canvia = true;
    const anotat = { ...fil };
    if (directeBloquejat) anotat.noLlegits = 0;
    if (amaga) Object.assign(anotat, { ultimText: '', ultimAmagat: true, searchText: String(fil.name || '').toLowerCase() });
    if (amaga && directeBloquejat) anotat.ultimAl = null;
    return anotat;
  });
  return canvia ? eixida : fils;
}

/**
 * Els fils sense els directes 1:1 amb una persona bloquejada: el que compta
 * els no llegits i els contactes freqüents (com senseLaIAIA). La MATEIXA
 * referència si no en lleva cap. Pura.
 */
export function senseDirectesBloquejats(fils, esPersonaBloquejada) {
  if (!Array.isArray(fils) || typeof esPersonaBloquejada !== 'function') return fils;
  const queden = fils.filter((fil) => {
    const persona = personaDelDirecte(fil);
    return !persona || esPersonaBloquejada(persona) !== true;
  });
  return queden.length === fils.length ? fils : queden;
}

/** Una firma estable d'un conjunt de claus, siga quin siga l'ordre: les mateixes claus, la mateixa firma. Pura. */
export const firmaDeClaus = (claus) => [...claus].sort().join('\n');

/* ── La capa optimista de la sessió ──────────────────────────────────────
   Canvi: { ambit, afegits: Map<clau, Bloqueig>, llevats: Set<clau> }. Cada
   funció en torna un de NOU (mai muta el que rep) i bloquejar o desbloquejar
   sempre neteja el conjunt contrari: bloquejar de nou després de
   desbloquejar torna a amagar (crítica 261020, troballa 2). */

/** Un canvi buit per a `ambit`. */
export const canviBuit = (ambit) => ({ ambit, afegits: new Map(), llevats: new Set() });

/** El canvi amb el bloqueig `b` afegit (i tret dels llevats). */
export function afigAlCanvi(canvi, b) {
  const k = clauDeBloqueig(b.tipus, b.id);
  const afegits = new Map(canvi.afegits);
  afegits.set(k, b);
  const llevats = new Set(canvi.llevats);
  llevats.delete(k);
  return { ...canvi, afegits, llevats };
}

/** El canvi amb la clau `k` llevada (i treta dels afegits). */
export function llevaDelCanvi(canvi, k) {
  const afegits = new Map(canvi.afegits);
  afegits.delete(k);
  const llevats = new Set(canvi.llevats);
  llevats.add(k);
  return { ...canvi, afegits, llevats };
}

/** Com estava la clau `k` al canvi: { afegit: Bloqueig | null, llevat: boolean }, per a revertix. */
export const fotoDelCanvi = (canvi, k) => ({ afegit: canvi.afegits.get(k) ?? null, llevat: canvi.llevats.has(k) });

/** El canvi amb la clau `k` tornada exactament a com era a la foto (fotoDelCanvi). */
export function revertix(canvi, k, foto) {
  const afegits = new Map(canvi.afegits);
  if (foto?.afegit) afegits.set(k, foto.afegit);
  else afegits.delete(k);
  const llevats = new Set(canvi.llevats);
  if (foto?.llevat) llevats.add(k);
  else llevats.delete(k);
  return { ...canvi, afegits, llevats };
}

/**
 * Map<clau, Bloqueig> = (servidor ∪ afegits) − llevats, del més nou al més
 * vell: primer els afegits de la sessió (l'últim, primer) i després els del
 * servidor (que ja arriben del més nou al més vell). Pura.
 */
export function fusionaBloquejos(servidor, { afegits, llevats } = {}) {
  const fora = llevats instanceof Set ? llevats : new Set();
  const mapa = new Map();
  for (const b of [...(afegits instanceof Map ? afegits.values() : [])].reverse()) {
    const k = clauDeBloqueig(b?.tipus, b?.id);
    if (TIPUS_BLOQUEJAT.includes(b?.tipus) && b.id && !fora.has(k) && !mapa.has(k)) mapa.set(k, b);
  }
  for (const b of Array.isArray(servidor) ? servidor : []) {
    const k = clauDeBloqueig(b?.tipus, b?.id);
    if (TIPUS_BLOQUEJAT.includes(b?.tipus) && b.id && !fora.has(k) && !mapa.has(k)) mapa.set(k, b);
  }
  return mapa;
}
