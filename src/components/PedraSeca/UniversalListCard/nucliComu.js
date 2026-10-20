/**
 * nucliComu.js — Fase E (261020, tasca 2; pla 261020_2045 «El Comú») · el
 * nucli pur de la llista viva: els sis modes, la validació de la forma
 * neutra, l'acció que muta una llista i el resum que pinta la vista.
 *
 *   aplicaAccio(llista, accio, ctx) → { ok: true, llista } | { ok: false, error: { codi } }
 *     accio: { tipus: 'afegeix', entrada } | { tipus: 'elimina', elementId }
 *          | { tipus: <acció de llista>, … } | { tipus: <acció del mode>, elementId, … }
 *     Cada acció bona puja la revisió en u (optimista: el servidor torna la seua).
 *   resumDe(llista, actor) → el resum del mode (progres, xifres…)
 *   elementsFiltrats(llista, filtre) → els elements del filtre, en ordre
 *   triaInstantania(actual, remota, { clientInstanceId }) → la que ha de manar
 *     (la guarda anti-eco: el ressò del propi toc i les instantànies velles no
 *     tornen a pintar res; la tasca 4 la connecta al port).
 *
 * JS pur: sense DOM, sense React, sense xarxa ni emmagatzematge.
 */
import { CODIS_COMU, LIMITS_COMU, elementBase, ambElementNou, elementDe, errorComu, senseElement } from './basesComu.js';
import { MODE_REBOST } from './modes/rebost.js';
import { MODE_BAR_TPV } from './modes/barTpv.js';
import { MODE_COLLA_CENS } from './modes/collaCens.js';
import { MODE_BANDA_EIXIDA } from './modes/bandaEixida.js';
import { MODE_LOTERIA_DIPOSIT } from './modes/loteriaDiposit.js';
import { MODE_ESCOLA_EDUCAND } from './modes/escolaEducand.js';

export { CODIS_COMU, LIMITS_COMU };

/** Els sis modes canònics, en l'ordre del pla 261020_2045 (i del CHECK de comu_llistes). */
export const MODES_COMU = Object.freeze({
  rebost: MODE_REBOST,
  bar_tpv: MODE_BAR_TPV,
  colla_cens: MODE_COLLA_CENS,
  banda_eixida: MODE_BANDA_EIXIDA,
  loteria_diposit: MODE_LOTERIA_DIPOSIT,
  escola_educand: MODE_ESCOLA_EDUCAND
});
export const IDS_MODES_COMU = Object.freeze(Object.keys(MODES_COMU));

export const modeDe = (llista) => (Object.hasOwn(MODES_COMU, llista?.mode) ? MODES_COMU[llista.mode] : null);

/** { ok, errors } de la forma neutra d'una llista. */
export function validaLlista(llista) {
  const errors = [];
  if (!llista || typeof llista !== 'object') return { ok: false, errors: ['llista'] };
  if (typeof llista.id !== 'string' || !llista.id) errors.push('id');
  if (!modeDe(llista)) errors.push('mode');
  if (typeof llista.titol !== 'string' || !llista.titol.trim()) errors.push('titol');
  if (!Array.isArray(llista.elementsComu)) errors.push('elementsComu');
  else {
    if (llista.elementsComu.length > LIMITS_COMU.elements) errors.push('elementsComu.massa');
    const ids = new Set();
    for (const e of llista.elementsComu) {
      if (!e || typeof e.id !== 'string' || !e.id || ids.has(e.id)) { errors.push('element.id'); break; }
      ids.add(e.id);
      if (typeof e.nom !== 'string' || !e.capaMode || typeof e.capaMode !== 'object') { errors.push('element.forma'); break; }
    }
  }
  if (llista.revisio !== undefined && !Number.isSafeInteger(llista.revisio)) errors.push('revisio');
  return { ok: errors.length === 0, errors };
}

/** La llista amb els camps opcionals posats (configMode, recentsComu, revisio). */
export function normalitzaLlista(llista) {
  return {
    ...llista,
    configMode: llista.configMode && typeof llista.configMode === 'object' ? llista.configMode : {},
    recentsComu: Array.isArray(llista.recentsComu) ? llista.recentsComu : [],
    revisio: Number.isSafeInteger(llista.revisio) ? llista.revisio : 0
  };
}

/** Pot l'actor vore la llista? (Escola: només professorat i família.) */
export function potVeure(llista, actor) {
  const mode = modeDe(llista);
  if (!mode) return false;
  return typeof mode.potVeure === 'function' ? mode.potVeure(normalitzaLlista(llista), actor) : true;
}

const ambRevisio = (anterior, resultat) => (resultat.ok
  ? { ok: true, llista: { ...resultat.llista, revisio: anterior.revisio + 1 } }
  : resultat);

/** L'afegit per defecte: el bloc nuclear i la capa que torna mode.capaNova. */
function afegeixPerDefecte(mode, llista, entrada, ctx) {
  if (!mode.potAfegir(llista, ctx.actor)) return errorComu('no-autoritzat');
  const capa = mode.capaNova?.(entrada, ctx, llista) ?? {};
  const base = elementBase(entrada, ctx, capa);
  return base.ok ? ambElementNou(llista, base.element) : base;
}

/** L'acció sobre la llista. Mai llança: torna l'error estable (una capa amb forma estranya, «valor-invalid»). */
export function aplicaAccio(llistaEntrada, accio, ctx) {
  try {
    return aplicaAccioSenseGuarda(llistaEntrada, accio, ctx);
  } catch {
    return errorComu('valor-invalid');
  }
}

function aplicaAccioSenseGuarda(llistaEntrada, accio, ctx) {
  if (!validaLlista(llistaEntrada).ok) return errorComu('llista-invalida');
  const llista = normalitzaLlista(llistaEntrada);
  const mode = modeDe(llista);
  if (!ctx?.actor?.id || !potVeure(llista, ctx.actor)) return errorComu('no-autoritzat');
  const tipus = accio?.tipus;
  if (tipus === 'afegeix') {
    if (!mode.potAfegir(llista, ctx.actor)) return errorComu('no-autoritzat');
    const resultat = mode.afegeix ? mode.afegeix(llista, accio.entrada, ctx) : afegeixPerDefecte(mode, llista, accio.entrada, ctx);
    return ambRevisio(llista, resultat);
  }
  if (Object.hasOwn(mode.accionsDeLlista ?? {}, tipus)) return ambRevisio(llista, mode.accionsDeLlista[tipus](llista, accio, ctx));
  const element = elementDe(llista, accio?.elementId);
  if (tipus === 'elimina') {
    if (!element) return errorComu('element-absent');
    if (!mode.potEliminar(llista, element, ctx.actor)) return errorComu('no-autoritzat');
    return ambRevisio(llista, { ok: true, llista: senseElement(llista, element.id) });
  }
  if (!Object.hasOwn(mode.accions, tipus)) return errorComu('accio-desconeguda');
  if (!element) return errorComu('element-absent');
  return ambRevisio(llista, mode.accions[tipus](llista, element, accio, ctx));
}

/** El resum del mode per a la vista. */
export function resumDe(llista, actor) {
  const mode = modeDe(llista);
  return mode ? mode.resum(normalitzaLlista(llista), actor) : null;
}

/** L'estat d'un element segons el seu mode. */
export const estatDElement = (llista, element) => modeDe(llista)?.estatDe(element, llista) ?? null;

/** Els elements que deixa passar un filtre del mode, per ordre. Un filtre desconegut: tots. */
export function elementsFiltrats(llista, valorFiltre = 'tots') {
  const mode = modeDe(llista);
  if (!mode) return [];
  const filtre = mode.filtres.find((f) => f.valor === valorFiltre) ?? mode.filtres[0] ?? null;
  const ordenats = [...llista.elementsComu].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  if (!filtre?.estats) return ordenats;
  return ordenats.filter((e) => filtre.estats.includes(mode.estatDe(e, llista)));
}

/**
 * La guarda anti-eco i de revisions: quina instantània ha de manar.
 *   · una de més vella que la que tenim, no (arriba tard);
 *   · el ressò del nostre propi toc (mateix clientInstanceId) amb la mateixa
 *     revisió o una de més vella, tampoc: ja l'hem pintat;
 *   · la resta, sí (un altre ha tocat, o el servidor corregix el nostre toc).
 */
export function triaInstantania(actual, remota, { clientInstanceId } = {}) {
  if (!validaLlista(remota).ok) return actual;
  if (!actual) return normalitzaLlista(remota);
  const r = Number.isSafeInteger(remota.revisio) ? remota.revisio : 0;
  const a = Number.isSafeInteger(actual.revisio) ? actual.revisio : 0;
  if (r < a) return actual;
  if (clientInstanceId && remota.darrerClientInstanceId === clientInstanceId && r <= a) return actual;
  return normalitzaLlista(remota);
}
