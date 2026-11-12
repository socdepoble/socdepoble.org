/**
 * vius.js — Arbre Genealògic · la protecció de les persones vives (RGPD).
 *
 * Una persona es tracta com a viva, en este ordre:
 *   1. marcada viva ('si') → viva;
 *   2. marcada difunta ('no'), o amb una data de defunció coneguda → no viva;
 *   3. amb naixement conegut → viva si va nàixer fa menys de 100 anys (amb
 *      l'extrem més recent de l'interval de precisió: prudència);
 *   4. si un fill va nàixer fa 113 anys o més (100 + l'edat mínima de
 *      progenitor), la persona va nàixer fa més de 100 anys → no viva;
 *   5. sense cap dada → viva (prudència).
 *
 * filtraVius s'aplica a TOTA eixida (prompts, GEDCOM, JSON, consultes): per
 * defecte les persones vives s'anonimitzen; només ixen amb incloureVius:true,
 * que ha de vindre d'una casella explícita de la persona.
 */
import { ANYS_PROTECCIO_VIUS, EDAT_MINIMA_PROGENITOR } from './constants.js';
import { dataDesconeguda, intervalAny } from './dates.js';
import { indexa } from './model.js';

function exigeixAnyActual(anyActual) {
  if (!Number.isSafeInteger(anyActual)) throw new TypeError('Cal `anyActual` (un enter) per a decidir qui és viu.');
}

/* La regla sense recalcular els índexs (filtraVius la crida per a cada persona). */
function viva(persona, fillsDe, perId, anyActual) {
  if (persona.viva === 'si') return true;
  if (persona.viva === 'no') return false;
  if (persona.defuncio && persona.defuncio.precisio !== 'desconeguda') return false;
  const naixement = intervalAny(persona.naixement);
  if (persona.naixement?.any) return !naixement || anyActual - naixement.max < ANYS_PROTECCIO_VIUS;
  const limit = anyActual - ANYS_PROTECCIO_VIUS - EDAT_MINIMA_PROGENITOR;
  for (const fillId of fillsDe.get(persona.id) || []) {
    const fill = intervalAny(perId.get(fillId)?.naixement);
    if (fill && fill.max <= limit) return false;
  }
  return true;
}

/** true si la persona s'ha de protegir com a viva. `complet` (o null) permet la inferència pels fills. */
export function esPersonaViva(persona, complet, { anyActual } = {}) {
  exigeixAnyActual(anyActual);
  if (!persona) return true;
  const { fillsDe, perId } = indexa(complet || { persones: [persona], relacions: [] });
  return viva(persona, fillsDe, perId, anyActual);
}

/** El conjunt d'ids de persones vives d'un arbre. */
export function idsVius(complet, { anyActual } = {}) {
  exigeixAnyActual(anyActual);
  const { fillsDe, perId } = indexa(complet);
  return new Set((complet?.persones || []).filter((p) => viva(p, fillsDe, perId, anyActual)).map((p) => p.id));
}

/* La persona viva sense cap dada que la identifique: només l'estructura. */
function anonimitza(persona) {
  return {
    id: persona.id,
    arbreId: persona.arbreId,
    nom: '',
    cognom1: '',
    cognom2: '',
    malnom: '',
    casa: '',
    lloc: '',
    sexe: persona.sexe,
    naixement: dataDesconeguda(),
    defuncio: null,
    viva: 'si',
    ofici: '',
    generacio: persona.generacio,
    estat: persona.estat,
    fonts: [],
    notes: '',
    origen: null,
    creada: persona.creada,
    modificada: persona.modificada,
    privada: true
  };
}

/**
 * L'arbre preparat per a eixir del dispositiu.
 *   incloureVius true → el mateix arbre, intacte (ocultes 0);
 *   mode 'anonimitza' (per defecte) → cada persona viva conserva id, sexe,
 *     generació i relacions, sense nom, dates, llocs, fonts ni notes, amb
 *     `privada: true`; les relacions que la toquen perden les notes i les fonts;
 *   mode 'omet' → la persona viva i les relacions que la toquen desapareixen
 *     (i l'arrel, si ho era, queda a null).
 * Sense incloureVius, l'entrevista no ix mai (les respostes porten noms de vius).
 */
export function filtraVius(complet, { incloureVius = false, mode = 'anonimitza', anyActual } = {}) {
  exigeixAnyActual(anyActual);
  if (mode !== 'anonimitza' && mode !== 'omet') throw new TypeError('mode ha de ser «anonimitza» o «omet».');
  if (incloureVius === true) return { complet, ocultes: 0, idsOcults: [] };
  const vius = idsVius(complet, { anyActual });
  const idsOcults = [...vius].sort();
  const toca = (relacio) => vius.has(relacio.de) || vius.has(relacio.a);
  let persones;
  let relacions;
  if (mode === 'omet') {
    persones = complet.persones.filter((p) => !vius.has(p.id));
    relacions = complet.relacions.filter((r) => !toca(r));
  } else {
    persones = complet.persones.map((p) => (vius.has(p.id) ? anonimitza(p) : p));
    relacions = complet.relacions.map((r) => (toca(r) ? { ...r, notes: '', fontIds: [] } : r));
  }
  const arbre = mode === 'omet' && vius.has(complet.arbre?.arrelId) ? { ...complet.arbre, arrelId: null } : complet.arbre;
  return { complet: { arbre, persones, relacions, entrevista: null }, ocultes: idsOcults.length, idsOcults };
}
