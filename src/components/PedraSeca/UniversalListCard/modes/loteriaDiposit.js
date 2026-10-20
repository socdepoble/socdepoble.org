/**
 * modes/loteriaDiposit.js — Fase E (261020, tasca 2) · el mode Loteria ·
 * Dipòsit d'«El Comú»: els dècims i les paperetes que una associació deixa en
 * dipòsit en bars, comerços i socis (auditoria 261020_2030 §5.2 i §6.3, mode 5).
 *
 * capaMode d'un dipòsit (nom = qui el té: «Bar de la Plaça», «Forn del Carrer Major»):
 *   { format: 'decims' | 'paperetes', entregats (0..9999), retornats (0..entregats),
 *     depositariUsuariId?, signatures: { entregaDepositari, entregaSocietat,
 *     liquidacioDepositari, liquidacioSocietat } }
 * configMode:
 *   { sorteig?, numero?, decimFacialCents (2000), decimRecarrecPercent (15),
 *     paperetaFacialCents (240), paperetaRecarrecPercent (25), gestors? }
 *
 * El circuit de les quatre signatures: primer l'entrega (qui el rep i la
 * societat), després la liquidació (qui paga i la societat que cobra). La
 * liquidació no es pot signar sense l'entrega completa, ni l'entrega es pot
 * desfer amb la liquidació signada. Les signatures de la societat són de la
 * junta (propietari i gestors); les del depositari, seues si té compte i, si
 * no en té, la junta registra la seua signatura en paper. Els comptes són
 * enters en cèntims: venuts × preu de venda, i el benefici és el recàrrec.
 */
import { ambElement, ambElementNou, elementBase, enterEntre, errorComu, esGestor, textNet } from '../basesComu.js';
import { extrauEspecificacio } from '../extractorEspecificacio.js';

const FORMATS = Object.freeze(['decims', 'paperetes']);
export const SIGNATURES = Object.freeze(['entregaDepositari', 'entregaSocietat', 'liquidacioDepositari', 'liquidacioSocietat']);
const DE_LA_SOCIETAT = Object.freeze(['entregaSocietat', 'liquidacioSocietat']);
const PER_DEFECTE = Object.freeze({ decimFacialCents: 2000, decimRecarrecPercent: 15, paperetaFacialCents: 240, paperetaRecarrecPercent: 25 });

const signaturesDe = (element) => ({ entregaDepositari: false, entregaSocietat: false, liquidacioDepositari: false, liquidacioSocietat: false, ...element.capaMode.signatures });
const entregaFeta = (s) => s.entregaDepositari && s.entregaSocietat;
const liquidacioComencada = (s) => s.liquidacioDepositari || s.liquidacioSocietat;

/** Els preus d'un format: { facialCents, vendaCents } (venda = facial + recàrrec, arrodonit al cèntim). */
export function preusDe(format, configMode) {
  const c = { ...PER_DEFECTE, ...configMode };
  const facialCents = enterEntre(format === 'paperetes' ? c.paperetaFacialCents : c.decimFacialCents, 0, 1_000_000) ?? 0;
  const recarrec = enterEntre(format === 'paperetes' ? c.paperetaRecarrecPercent : c.decimRecarrecPercent, 0, 100) ?? 0;
  return { facialCents, vendaCents: facialCents + Math.round((facialCents * recarrec) / 100) };
}

/** Els comptes d'un dipòsit: venuts, el facial venut, el total a liquidar i el benefici de l'associació. */
export function comptesDe(element, configMode) {
  const { facialCents, vendaCents } = preusDe(element.capaMode.format, configMode);
  const venuts = Math.max(0, element.capaMode.entregats - element.capaMode.retornats);
  const facialVenutCents = venuts * facialCents;
  const totalLiquidarCents = venuts * vendaCents;
  return { venuts, facialVenutCents, totalLiquidarCents, beneficiCents: totalLiquidarCents - facialVenutCents };
}

const esDelDepositari = (element, actor) => Boolean(actor?.id) && element.capaMode.depositariUsuariId === actor.id;

/** L'entrada ràpida: «Bar de la Plaça 20» (qui el té i quants dècims). */
function entradaDeText(text) {
  const extret = extrauEspecificacio(text);
  return extret.unitat === 'u' && Number.isSafeInteger(extret.quantitat) ? { nom: extret.nom, entregats: extret.quantitat } : { nom: textNet(text) };
}

function afegeix(llista, entradaCrua, ctx) {
  if (!esGestor(llista, ctx.actor)) return errorComu('no-autoritzat');
  const entrada = typeof entradaCrua?.text === 'string' ? entradaDeText(entradaCrua.text) : entradaCrua;
  const entregats = enterEntre(entrada?.entregats ?? 0, 0, 9999);
  if (entregats === null) return errorComu('valor-invalid');
  const capa = {
    format: FORMATS.includes(entrada?.format) ? entrada.format : 'decims',
    entregats,
    retornats: 0,
    signatures: { entregaDepositari: false, entregaSocietat: false, liquidacioDepositari: false, liquidacioSocietat: false }
  };
  if (typeof entrada?.depositariUsuariId === 'string' && entrada.depositariUsuariId) capa.depositariUsuariId = entrada.depositariUsuariId;
  const base = elementBase(entrada, ctx, capa);
  return base.ok ? ambElementNou(llista, base.element) : base;
}

/** Els sobrants que tornen: entre 0 i els entregats, i mai amb la liquidació començada. */
function retorna(llista, element, accio, ctx) {
  if (!esGestor(llista, ctx.actor) && !esDelDepositari(element, ctx.actor)) return errorComu('no-autoritzat');
  if (liquidacioComencada(signaturesDe(element))) return errorComu('ordre-signatures');
  const retornats = enterEntre(accio?.retornats, 0, element.capaMode.entregats);
  if (retornats === null) return errorComu('valor-invalid');
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, retornats } })) };
}

/** Signar (o desfer una signatura) del circuit, en el seu ordre i per qui toca. */
function signa(llista, element, accio, ctx) {
  const signatura = accio?.signatura;
  if (!SIGNATURES.includes(signatura)) return errorComu('valor-invalid');
  const gestor = esGestor(llista, ctx.actor);
  const potSignar = DE_LA_SOCIETAT.includes(signatura)
    ? gestor
    : esDelDepositari(element, ctx.actor) || (gestor && !element.capaMode.depositariUsuariId);
  if (!potSignar) return errorComu('no-autoritzat');
  const abans = signaturesDe(element);
  const ara = { ...abans, [signatura]: !abans[signatura] };
  if (signatura.startsWith('liquidacio') && ara[signatura] && !entregaFeta(abans)) return errorComu('ordre-signatures');
  if (signatura.startsWith('entrega') && !ara[signatura] && liquidacioComencada(abans)) return errorComu('ordre-signatures');
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, signatures: ara } })) };
}

export function estatDeDiposit(element) {
  const s = signaturesDe(element);
  if (s.liquidacioDepositari && s.liquidacioSocietat) return 'liquidat';
  if (entregaFeta(s)) return 'entregat';
  return 'en_diposit';
}

export const MODE_LOTERIA_DIPOSIT = Object.freeze({
  id: 'loteria_diposit',
  forma: 'files',
  estats: Object.freeze(['en_diposit', 'entregat', 'liquidat']),
  potAfegir: esGestor,
  afegeix,
  potEliminar: (llista, element, actor) => esGestor(llista, actor) && !liquidacioComencada(signaturesDe(element)),
  potSignar: (llista, element, actor, signatura) => (DE_LA_SOCIETAT.includes(signatura)
    ? esGestor(llista, actor)
    : esDelDepositari(element, actor) || (esGestor(llista, actor) && !element.capaMode.depositariUsuariId)),
  accions: Object.freeze({ retorna, signa }),
  estatDe: estatDeDiposit,
  signaturesDe,
  filtres: Object.freeze([
    { valor: 'tots', estats: null },
    { valor: 'en_diposit', estats: ['en_diposit'] },
    { valor: 'entregat', estats: ['entregat'] },
    { valor: 'liquidat', estats: ['liquidat'] }
  ]),
  resum(llista) {
    const config = llista.configMode ?? {};
    const comptes = llista.elementsComu.map((e) => comptesDe(e, config));
    const suma = (clau) => comptes.reduce((s, c) => s + c[clau], 0);
    const paperetesVenudes = llista.elementsComu.reduce((s, e, i) => s + (e.capaMode.format === 'paperetes' ? comptes[i].venuts : 0), 0);
    const { facialCents: decimCents } = preusDe('decims', config);
    const { facialCents: paperetaCents } = preusDe('paperetes', config);
    const liquidats = llista.elementsComu.filter((e) => estatDeDiposit(e) === 'liquidat').length;
    return {
      progres: { fets: liquidats, total: llista.elementsComu.length },
      diposits: llista.elementsComu.length,
      entregats: llista.elementsComu.reduce((s, e) => s + e.capaMode.entregats, 0),
      venuts: suma('venuts'),
      totalLiquidarCents: suma('totalLiquidarCents'),
      beneficiCents: suma('beneficiCents'),
      liquidats,
      /* Els dècims de veres que cal guardar per a cobrir les paperetes venudes (ARRODONEIX.AMUNT del full de 2008). */
      decimsAReservar: decimCents > 0 ? Math.ceil((paperetesVenudes * paperetaCents) / decimCents) : 0
    };
  },
  columnes: Object.freeze([
    { clau: 'nom', valor: (e) => e.nom },
    { clau: 'format', valor: (e) => e.capaMode.format },
    { clau: 'entregats', valor: (e) => e.capaMode.entregats },
    { clau: 'retornats', valor: (e) => e.capaMode.retornats },
    { clau: 'venuts', valor: (e, llista) => comptesDe(e, llista.configMode).venuts },
    { clau: 'totalLiquidar', valor: (e, llista) => comptesDe(e, llista.configMode).totalLiquidarCents, cents: true },
    { clau: 'benefici', valor: (e, llista) => comptesDe(e, llista.configMode).beneficiCents, cents: true },
    ...SIGNATURES.map((s) => ({ clau: s, valor: (e) => signaturesDe(e)[s], siNo: true }))
  ])
});
