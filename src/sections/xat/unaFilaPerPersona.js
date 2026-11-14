/**
 * unaFilaPerPersona.js — Onada R24 · IDEA-260 (a), carril xat_ui (C1 i C2 de
 * l'informe onada1/xat_duplicats.md; opció B, triada per l'integrador).
 *
 * La bústia del Mestre (captura 261114_0428) pintava Damià, Sofía i Alfredo
 * dues vegades. No eren fils duplicats: el Mestre és alhora persona i gestor
 * de l'entitat Sóc de Poble, i amb cada una d'eixes persones té dues converses
 * canòniques (el directe personal i el canal privat de l'entitat, on entra amb
 * `com_org_id`). La llista en pintava una fila per FIL.
 *
 * Ara, una fila per PERSONA, sense amagar mai cap canal d'entitat (R21.8,
 * decisió del Mestre del 12-11): els fils de la mateixa persona es pleguen en
 * la fila de la més recent, que guarda tots els canals (`canals`) perquè la
 * fila hi pinte una píndola per identitat i la capçalera de la conversa deixe
 * triar amb quina s'escriu. Les dades no es fusionen mai: és una vista per a
 * qui mira.
 *
 *   · clauDePersona(fil) · `persona:<id>` només per a un directe l'únic
 *     «altre» del qual és UNA persona (per id, mai pel nom). Mai per a la
 *     IAIA, el fil propi, una fila per defecte, una pàgina, una comunitat, un
 *     grup o un canal; tampoc per al canal on qui mira és la clienta d'una
 *     entitat (`altres = [entitat]`): no s'infereix qui opera una entitat.
 *   · esDirecteBuit(fil) · C2: un directe sense cap missatge (ultimSeq 0, sense
 *     ultimText ni ultimTipus). WhatsApp no l'ensenya fins al primer missatge.
 *     Un accessori sense ultimSeq no és buit: no se sap. R24 · Gauntlet
 *     (G-client-11) · Mai un canal on qui mira actua com a entitat
 *     (`comEntitat`): la regla R21.8.3 del Mestre, «mai s'oculten fils
 *     comEntitat». Un canal d'entitat buit es llista (i es plega a la fila
 *     de la persona si també hi ha el directe personal).
 *   · unaFilaPerPersona(files, { obert, ambBuits }) · rep les files ja
 *     ordenades de XatSection (fixades primer, després per activitat), lleva
 *     els directes buits que no són el fil `obert` (llevat d'`ambBuits`, la
 *     safata d'arxivades) i plega les de la mateixa clau al lloc de la
 *     primera. La fila plegada porta `clau: 'persona:<id>'`, `canals` (els
 *     fils, el més recent primer) i, com a `fil`, el representant: el fil
 *     obert; si no, R24 · Gauntlet (G-client-4) el canal no silenciat amb
 *     no llegits més recent (prémer la fila porta on són els missatges); si
 *     no, R24 · Elephant P2 (CA-3) el canal PERSONAL (el directe
 *     persona↔persona: amb missatges i, si no, qualsevol), perquè prémer una
 *     fila sense res nou no pose el Mestre a escriure com a entitat; si no n'hi
 *     ha cap de personal, el més recent amb algun missatge; i si no, el més
 *     recent (P-2). Els
 *     no llegits (G-client-3) són la suma dels canals NO silenciats, la regla
 *     de sumaNoLlegits i del comptador global (la llista del Xat no plega mai
 *     un canal arxivat amb un de no arxivat); si tots ho estan, la suma de
 *     tots, grisa, com una fila silenciada sola. Silenciada només si ho són
 *     TOTS els canals. Fixada, preferida o marcada a mà si ho és algun dels
 *     seus canals. Sense res a plegar ni a amagar, la mateixa referència (com
 *     anteposaActors).
 *   · identitatsDeLaFila(canals, obertId) · una identitat per canal, en ordre
 *     fix: «Personal» (si n'hi ha) i les entitats per nom. Amb dos directes
 *     personals (el duplicat latent CA-4), una sola «Personal»: la del fil
 *     obert o la més recent. Menys de dues identitats, cap.
 *
 * Pur: cap React ni cap xarxa.
 */
import { esXatDeLaIAIA } from '../../data/xatsPerDefecte.js';

const CAP = Object.freeze([]);
const PERSONAL = 'personal';

const idDe = (fil) => String(fil?.id ?? '');
const instantDe = (valor) => {
  const t = new Date(valor || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/* Un directe 1:1 de veres: cap fila d'ajuda, propi, pàgina, comunitat ni IAIA. */
function esDirecteDeVeres(fil) {
  return Boolean(fil) && (fil.tipus || 'directe') === 'directe'
    && !fil.perDefecte && !fil.esPropi && !fil.subjecte && !fil.comunitatId
    && !fil.sessioLocalIAIA && !fil.filLocalIAIA && !esXatDeLaIAIA(fil);
}

/** `persona:<id>` per a un directe amb una sola persona; si no, null. */
export function clauDePersona(fil) {
  if (!esDirecteDeVeres(fil)) return null;
  const altres = Array.isArray(fil.altres) ? fil.altres : CAP;
  if (altres.length !== 1) return null;
  const [altre] = altres;
  if (altre?.tipus !== 'persona' || altre.id == null || String(altre.id) === '') return null;
  return `persona:${altre.id}`;
}

/** C2 · Un directe que encara no porta cap missatge. */
export function esDirecteBuit(fil) {
  return esDirecteDeVeres(fil) && !fil.comEntitat && senseMissatges(fil);
}

/* Sense cap missatge conegut (ultimSeq 0, sense text ni tipus). */
function senseMissatges(fil) {
  return fil.ultimSeq != null && Number(fil.ultimSeq) === 0 && !fil.ultimText && !fil.ultimTipus;
}

const noLlegitsDe = (fil) => Math.max(0, Number(fil?.noLlegits) || 0);

/* La identitat amb què qui mira és en un canal: la personal o la d'una entitat. */
function clauDIdentitat(fil) {
  return fil?.comEntitat && fil?.entitatNom ? `entitat:${fil.entitatId ?? fil.entitatNom}` : PERSONAL;
}

/* «dd/mm» de l'última activitat d'un fil, per a distingir dos fils de la mateixa
   identitat al selector (XAT-D1). Sense data vàlida, res. */
function diaMesDe(valor) {
  const ms = instantDe(valor);
  if (!ms) return undefined;
  const data = new Date(ms);
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/* XAT-D1 (Codex, passada 2): el selector de la conversa oferix CADA fil quan una
   identitat en té més d'un (dos directes personals que la migració 20261114060000
   deixa pendents de fusió), perquè el més antic no quede inabastable. Personals
   primer (el més recent davant), després les entitats per nom. */
function totsElsFilsDeLaFila(canals) {
  const perClau = new Map();
  for (const fil of canals) {
    const clau = clauDIdentitat(fil);
    if (!perClau.has(clau)) perClau.set(clau, []);
    perClau.get(clau).push(fil);
  }
  const identitats = [];
  for (const [clau, fils] of perClau) {
    const ordenats = [...fils].sort((a, b) => instantDe(b.ultimAl) - instantDe(a.ultimAl));
    for (const fil of ordenats) {
      identitats.push({
        clau: ordenats.length > 1 ? `${clau}#${idDe(fil)}` : clau,
        tipus: clau === PERSONAL ? PERSONAL : 'entitat',
        nom: clau === PERSONAL ? null : fil.entitatNom,
        ...(ordenats.length > 1 ? { detall: diaMesDe(fil.ultimAl) } : {}),
        fil
      });
    }
  }
  if (identitats.length < 2) return [];
  const personals = identitats.filter((identitat) => identitat.tipus === PERSONAL);
  const entitats = identitats
    .filter((identitat) => identitat.tipus !== PERSONAL)
    .sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'ca') || a.clau.localeCompare(b.clau));
  return [...personals, ...entitats];
}

/** Les identitats d'una fila plegada (vegeu la capçalera). Amb `totsElsFils`, una
    opció per fil (el selector de la conversa); sense, una per identitat (les
    píndoles de la fila). */
export function identitatsDeLaFila(canals, obertId = null, { totsElsFils = false } = {}) {
  if (!Array.isArray(canals) || canals.length < 2) return [];
  if (totsElsFils) return totsElsFilsDeLaFila(canals);
  const obert = obertId == null ? '' : String(obertId);
  const perClau = new Map();
  for (const fil of canals) {
    const clau = clauDIdentitat(fil);
    const previ = perClau.get(clau);
    if (!previ || (obert && idDe(fil) === obert && idDe(previ.fil) !== obert)) {
      perClau.set(clau, { clau, tipus: clau === PERSONAL ? PERSONAL : 'entitat', nom: clau === PERSONAL ? null : fil.entitatNom, fil });
    }
  }
  if (perClau.size < 2) return [];
  const personal = perClau.get(PERSONAL);
  const entitats = [...perClau.values()]
    .filter((identitat) => identitat.clau !== PERSONAL)
    .sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'ca') || a.clau.localeCompare(b.clau));
  return personal ? [personal, ...entitats] : entitats;
}

/* Onada R24 · Elephant P2 (CA-3) · El directe persona↔persona de la fila. */
const esPersonal = (fil) => clauDIdentitat(fil) === PERSONAL;

/* La fila plegada d'un grup de files (ja en l'ordre de la llista).
   Onada R24 · Elephant P2 (CA-3) · El representant (el que obri prémer la
   fila): el fil obert; si no, el canal no silenciat amb no llegits més recent
   (G-client-4); si no, el canal PERSONAL (el que té missatges i, si no n'hi ha
   cap, qualsevol), perquè el Mestre no escriga com a entitat sense voler en
   prémer una fila sense res nou; i, només si no hi ha cap canal personal (dues
   entitats), el més recent amb missatges i després el més recent. Abans, sense
   no llegits, guanyava el canal d'entitat si era el més recent. */
function plega(clau, grup, obert) {
  const canals = grup.map((fila) => fila.fil).sort((a, b) => instantDe(b.ultimAl) - instantDe(a.ultimAl));
  const representant = (obert && canals.find((fil) => idDe(fil) === obert))
    || canals.find((fil) => !fil.silenciat && noLlegitsDe(fil) > 0)
    || canals.find((fil) => esPersonal(fil) && !senseMissatges(fil))
    || canals.find(esPersonal)
    || canals.find((fil) => !senseMissatges(fil))
    || canals[0];
  const algun = (camp) => canals.some((fil) => Boolean(fil[camp]));
  const silenciat = canals.every((fil) => Boolean(fil.silenciat));
  const comptables = silenciat ? canals : canals.filter((fil) => !fil.silenciat);
  return {
    ...grup[0],
    clau,
    fil: {
      ...representant,
      silenciat,
      noLlegits: comptables.reduce((suma, fil) => suma + noLlegitsDe(fil), 0),
      noLlegitManual: algun('noLlegitManual'),
      fixat: algun('fixat'),
      preferit: algun('preferit')
    },
    canals,
    fixat: grup.some((fila) => Boolean(fila.fixat))
  };
}

/** Una fila per persona i cap directe buit (vegeu la capçalera). */
export function unaFilaPerPersona(files, { obert = null, ambBuits = false } = {}) {
  if (!Array.isArray(files)) return files;
  const idObert = obert == null ? '' : String(obert);
  const visibles = [];
  const grups = new Map();
  let canvia = false;
  for (const fila of files) {
    const fil = fila?.tipus === 'fil' ? fila.fil : null;
    if (fil && !ambBuits && esDirecteBuit(fil) && idDe(fil) !== idObert) {
      canvia = true;
      continue;
    }
    visibles.push(fila);
    const clau = fil ? clauDePersona(fil) : null;
    if (!clau) continue;
    const grup = grups.get(clau);
    if (grup) {
      grup.push(fila);
      canvia = true;
    } else {
      grups.set(clau, [fila]);
    }
  }
  if (!canvia) return files;
  const resultat = [];
  for (const fila of visibles) {
    const clau = fila?.tipus === 'fil' ? clauDePersona(fila.fil) : null;
    const grup = clau ? grups.get(clau) : null;
    if (!grup || grup.length < 2) resultat.push(fila);
    else if (grup[0] === fila) resultat.push(plega(clau, grup, idObert));
  }
  return resultat;
}
