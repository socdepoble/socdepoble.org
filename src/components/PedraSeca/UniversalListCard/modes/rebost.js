/**
 * modes/rebost.js — Fase E (261020, tasca 2) · el mode Rebost d'«El Comú»: la
 * compra col·laborativa (patró de rajoles de l'auditoria 261020_2030 §2) amb
 * el comparador Poble · Gran superfície (§3.2).
 *
 * capaMode d'un element:
 *   { estat: 'falta' | 'comprat', especificacio, demanatPer: [{ usuariId, nom, at, especificacio }],
 *     compratPer: { usuariId, nom, at } | null,
 *     preuPobleCents?, preuGranSuperficieCents?, unitatPreu? ('kg', 'l', 'u'…) }
 * configMode: { costDesplacamentCents?, gestors? }
 * recentsComu: els darrers comprats, com a molt LIMITS_COMU.recents, el més nou primer.
 *
 * Tothom qui és a la llista hi afig, la commuta i en buida el cistell, com en
 * qualsevol llista de la compra compartida. Eliminar un article: qui el va
 * demanar o qui governa la llista.
 */
import {
  LIMITS_COMU, ambElement, ambElementNou, clauDeNom, elementBase, enterEntre, errorComu, esGestor,
  signaturaDe, textNet
} from '../basesComu.js';
import { extrauEspecificacio, fusionaEspecificacions, quantitatEn, unitatDe } from '../extractorEspecificacio.js';

const preuDe = (valor) => enterEntre(valor, 0, 10_000_000);

/** Els recents amb este article al davant, sense repetits i dins del límit. */
function ambRecent(recents, element, ara) {
  const clau = clauDeNom(element.nom);
  const resta = (recents ?? []).filter((r) => clauDeNom(r.nom) !== clau);
  return [{ nom: element.nom, especificacio: element.capaMode.especificacio, at: ara }, ...resta].slice(0, LIMITS_COMU.recents);
}

/** Afegir: una entrada ràpida («2 kg de tomaca») o un nom amb especificació. */
function afegeix(llista, entrada, ctx) {
  const extret = typeof entrada?.text === 'string' ? extrauEspecificacio(entrada.text) : null;
  const nom = textNet(extret ? extret.nom : entrada?.nom);
  if (!nom) return errorComu('nom-buit');
  const especificacio = textNet(extret ? extret.especificacio : entrada?.especificacio, LIMITS_COMU.especificacio);
  const peticio = { ...signaturaDe(ctx.actor, ctx.ara), especificacio };
  const existent = llista.elementsComu.find((e) => clauDeNom(e.nom) === clauDeNom(nom));
  if (existent) {
    const pendent = existent.capaMode.estat === 'falta';
    return {
      ok: true,
      llista: ambElement(llista, existent.id, (e) => ({
        ...e,
        capaMode: {
          ...e.capaMode,
          estat: 'falta',
          especificacio: fusionaEspecificacions(e.capaMode.especificacio, especificacio, { pendent }),
          demanatPer: pendent ? [...(e.capaMode.demanatPer ?? []), peticio] : [peticio],
          compratPer: null
        }
      }))
    };
  }
  const preus = {};
  const poble = preuDe(entrada?.preuPobleCents);
  const gran = preuDe(entrada?.preuGranSuperficieCents);
  if (poble !== null) preus.preuPobleCents = poble;
  if (gran !== null) preus.preuGranSuperficieCents = gran;
  const unitatPreu = unitatDe(entrada?.unitatPreu);
  if (unitatPreu) preus.unitatPreu = unitatPreu;
  const base = elementBase({ ...entrada, nom }, ctx, {
    estat: 'falta', especificacio, demanatPer: [peticio], compratPer: null, ...preus
  });
  return base.ok ? ambElementNou(llista, base.element) : base;
}

/** Un toc a la rajola: «falta» ↔ «comprat». */
function commuta(llista, element, _accio, ctx) {
  if (element.capaMode.estat === 'falta') {
    const comprat = { ...element, capaMode: { ...element.capaMode, estat: 'comprat', compratPer: signaturaDe(ctx.actor, ctx.ara) } };
    return {
      ok: true,
      llista: { ...ambElement(llista, element.id, () => comprat), recentsComu: ambRecent(llista.recentsComu, comprat, ctx.ara) }
    };
  }
  return {
    ok: true,
    llista: ambElement(llista, element.id, (e) => ({
      ...e,
      capaMode: { ...e.capaMode, estat: 'falta', especificacio: '', demanatPer: [{ ...signaturaDe(ctx.actor, ctx.ara), especificacio: '' }], compratPer: null }
    }))
  };
}

/** L'especificació escrita a mà damunt de la rajola (només mentre falta). */
function especifica(llista, element, accio) {
  if (element.capaMode.estat !== 'falta') return errorComu('valor-invalid');
  const especificacio = textNet(accio?.especificacio, LIMITS_COMU.especificacio);
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, especificacio } })) };
}

/** «Buida el cistell»: els comprats ixen de la llista (es queden als recents). */
function buidaCistell(llista) {
  return { ok: true, llista: { ...llista, elementsComu: llista.elementsComu.filter((e) => e.capaMode.estat !== 'comprat') } };
}

const potEliminar = (llista, element, actor) => esGestor(llista, actor)
  || (element.capaMode.demanatPer ?? []).some((p) => p.usuariId === actor?.id);

/** La quantitat en la unitat del preu (sense especificació, 1 unitat), o null si no es pot dir. */
export function quantitatEnUnitatDePreu(especificacio, unitatPreu = 'u') {
  return String(especificacio ?? '').trim() ? quantitatEn(especificacio, unitatPreu) : 1;
}

/** El comparador Poble · Gran superfície dels articles que falten i tenen els dos preus, o null. */
export function comparadorDe(llista) {
  const amb = llista.elementsComu.filter((e) => e.capaMode.estat === 'falta'
    && Number.isSafeInteger(e.capaMode.preuPobleCents) && Number.isSafeInteger(e.capaMode.preuGranSuperficieCents));
  if (amb.length === 0) return null;
  let pobleCents = 0;
  let granCents = 0;
  let sensePreu = 0;
  for (const e of amb) {
    const q = quantitatEnUnitatDePreu(e.capaMode.especificacio, e.capaMode.unitatPreu ?? 'u');
    if (q === null) { sensePreu += 1; continue; }
    pobleCents += Math.round(q * e.capaMode.preuPobleCents);
    granCents += Math.round(q * e.capaMode.preuGranSuperficieCents);
  }
  /* Cap article amb una quantitat que es puga posar en la unitat del preu: res a comparar. */
  if (amb.length === sensePreu) return null;
  const desplacamentCents = enterEntre(llista.configMode?.costDesplacamentCents, 0, 100_000) ?? 0;
  const totalGranCents = granCents + desplacamentCents;
  return { articles: amb.length - sensePreu, sensePreu, pobleCents, granCents, desplacamentCents, totalGranCents, estalviCents: totalGranCents - pobleCents };
}

export const MODE_REBOST = Object.freeze({
  id: 'rebost',
  forma: 'rajoles',
  estats: Object.freeze(['falta', 'comprat']),
  potAfegir: (_llista, actor) => Boolean(actor?.id),
  afegeix,
  potEliminar,
  accions: Object.freeze({ commuta, especifica }),
  accionsDeLlista: Object.freeze({ buidaCistell }),
  estatDe: (element) => element.capaMode.estat,
  filtres: Object.freeze([
    { valor: 'tots', estats: null },
    { valor: 'falta', estats: ['falta'] },
    { valor: 'comprat', estats: ['comprat'] }
  ]),
  resum(llista) {
    const falta = llista.elementsComu.filter((e) => e.capaMode.estat === 'falta').length;
    const comprat = llista.elementsComu.length - falta;
    return { progres: { fets: comprat, total: llista.elementsComu.length }, falta, comprat, comparador: comparadorDe(llista) };
  },
  columnes: Object.freeze([
    { clau: 'nom', valor: (e) => e.nom },
    { clau: 'especificacio', valor: (e) => e.capaMode.especificacio },
    { clau: 'estat', valor: (e) => e.capaMode.estat },
    { clau: 'demanatPer', valor: (e) => (e.capaMode.demanatPer ?? []).map((p) => p.nom).join(', ') },
    { clau: 'preuPoble', valor: (e) => e.capaMode.preuPobleCents ?? null, cents: true },
    { clau: 'preuGranSuperficie', valor: (e) => e.capaMode.preuGranSuperficieCents ?? null, cents: true }
  ])
});
