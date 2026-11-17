/**
 * modes/rebost.js — Fase E (261020, tasca 2) · el mode Rebost d'«El Comú»: la
 * compra col·laborativa (patró de rajoles de l'auditoria 261020_2030 §2) amb
 * el comparador Poble · Gran superfície (§3.2).
 *
 * capaMode d'un element:
 *   { estat: 'falta' | 'comprat', especificacio, demanatPer: [{ usuariId, nom, at, especificacio }],
 *     compratPer: { usuariId, nom, at } | null,
 *     preuPobleCents?, preuGranSuperficieCents?, unitatPreu? ('kg', 'l', 'u'…) }
 * configMode: { costDesplacamentCents?, desplacament?: { km, consumL100km, preuLitreCents, anadaITornada? }, gestors? }
 *   (el cost fix explícit mana; si no n'hi ha, es calcula la benzina amb costDesplacamentDe)
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

const preuDe = (valor) => Number.isSafeInteger(valor) && valor >= 0 && valor <= 10_000_000 ? valor : null;

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

/** Configurar el viatge a la gran superfície (km, consumL100km i preuLitreCents): només qui governa la llista. */
function configuraDesplacament(llista, accio, ctx) {
  if (!esGestor(llista, ctx.actor)) return errorComu('no-autoritzat');
  const neteja = Object.fromEntries(
    Object.entries(llista.configMode ?? {}).filter(([clau]) => clau !== 'desplacament' && clau !== 'costDesplacamentCents')
  );
  if (accio?.desplacament === null) {
    return { ok: true, llista: { ...llista, configMode: neteja } };
  }
  const d = accio?.desplacament;
  if (costDesplacamentDe(d) === null) return errorComu('valor-invalid');
  const net = {
    km: d.km,
    consumL100km: d.consumL100km,
    preuLitreCents: d.preuLitreCents,
    ...(d.anadaITornada === false ? { anadaITornada: false } : {})
  };
  return { ok: true, llista: { ...llista, configMode: { ...neteja, desplacament: net } } };
}

const potEliminar = (llista, element, actor) => esGestor(llista, actor)
  || (element.capaMode.demanatPer ?? []).some((p) => p.usuariId === actor?.id);

/** La quantitat en la unitat del preu (sense especificació, 1 unitat), o null si no es pot dir. */
export function quantitatEnUnitatDePreu(especificacio, unitatPreu = 'u') {
  return String(especificacio ?? '').trim() ? quantitatEn(especificacio, unitatPreu) : 1;
}

/** Un número de veres (mai una cadena) dins del marge, o null. */
const numeroEntre = (valor, minim, maxim) => (typeof valor === 'number' && Number.isFinite(valor) && valor >= minim && valor <= maxim ? valor : null);

/* La representació decimal d'un Number ja validat, també si usa notació exponencial. */
function fraccioDecimal(valor) {
  const [mantissa, exponent = '0'] = String(valor).split('e');
  const [enter, decimals = ''] = mantissa.split('.');
  const xifra = BigInt(`${enter}${decimals}`);
  const escala = decimals.length - Number(exponent);
  return escala >= 0 ? [xifra, 10n ** BigInt(escala)] : [xifra * 10n ** BigInt(-escala), 1n];
}

/**
 * El cost del viatge a la gran superfície, en cèntims, o null si les dades no són vàlides (P1-01: la benzina, no un cost fix).
 * desplacament: { km (el camí d'anada, 0-300), consumL100km (2-25), preuLitreCents (enter, 50-500),
 *   anadaITornada (només false compta el camí sol; qualsevol altre valor, anada i tornada) }.
 * Llig els camps un a un: ni spread de la capa JSONB ni cadenes numèriques.
 */
export function costDesplacamentDe(desplacament) {
  if (!desplacament || typeof desplacament !== 'object') return null;
  const km = numeroEntre(desplacament.km, 0, 300);
  const consum = numeroEntre(desplacament.consumL100km, 2, 25);
  const preu = Number.isSafeInteger(desplacament.preuLitreCents) ? numeroEntre(desplacament.preuLitreCents, 50, 500) : null;
  if (km === null || consum === null || preu === null) return null;
  const trams = desplacament.anadaITornada === false ? 1 : 2;
  /* Un sol arrodoniment sobre els decimals originals: ni 8,2 es queda curt
     a la meitat, ni 8,199999999 puja artificialment a eixa mateixa meitat. */
  const [kmN, kmD] = fraccioDecimal(km);
  const [consumN, consumD] = fraccioDecimal(consum);
  const numerador = kmN * BigInt(trams) * consumN * BigInt(preu);
  const denominador = 100n * kmD * consumD;
  const cents = Number((2n * numerador + denominador) / (2n * denominador));
  /* «|| 0» lleva el -0 que donaria km = -0. */
  return Number.isSafeInteger(cents) && cents <= 100_000 ? cents || 0 : null;
}

/* Onada R32.2 · Un preu del comparador és un número enter dins del marge de preuDe. Una cadena no hi
   compta (com abans de R32): «1e2» o «1.0» passarien preuDe i BigInt els rebutjaria amb un SyntaxError
   que tombaria la targeta sencera del Rebost. Passat el filtre, el valor cru ja és eixe enter. */
const preuComparable = (valor) => (typeof valor === 'number' ? preuDe(valor) : null);

/** El comparador Poble · Gran superfície dels articles que falten i tenen els dos preus, o null. */
export function comparadorDe(llista) {
  const amb = llista.elementsComu.filter((e) => e.capaMode.estat === 'falta'
    && preuComparable(e.capaMode.preuPobleCents) !== null && preuComparable(e.capaMode.preuGranSuperficieCents) !== null);
  if (amb.length === 0) return null;
  let pobleCents = 0;
  let granCents = 0;
  let sensePreu = 0;
  for (const e of amb) {
    const q = quantitatEnUnitatDePreu(e.capaMode.especificacio, e.capaMode.unitatPreu ?? 'u');
    /* quantitatEn ja fixa tres decimals: el producte es calcula amb les
       mil·lèsimes enteres perquè 0,145 kg × 100 c són 14,5 c, mai 14,499… . */
    const mil = q === null ? null : Math.round(q * 1000);
    if (!Number.isSafeInteger(mil) || mil < 0) { sensePreu += 1; continue; }
    const importDe = (preu) => Number((BigInt(mil) * BigInt(preu) + 500n) / 1000n);
    const poble = importDe(e.capaMode.preuPobleCents), gran = importDe(e.capaMode.preuGranSuperficieCents);
    if (!Number.isSafeInteger(poble) || !Number.isSafeInteger(gran)) { sensePreu += 1; continue; }
    pobleCents += poble;
    granCents += gran;
    if (!Number.isSafeInteger(pobleCents) || !Number.isSafeInteger(granCents)) return null;
  }
  /* Cap article amb una quantitat que es puga posar en la unitat del preu: res a comparar. */
  if (amb.length === sensePreu) return null;
  /* El cost fix explícit continua manant (les llistes d'abans fan el mateix); si no n'hi ha, la benzina. */
  const desplacamentCents = enterEntre(llista.configMode?.costDesplacamentCents, 0, 100_000)
    ?? costDesplacamentDe(llista.configMode?.desplacament) ?? 0;
  const totalGranCents = granCents + desplacamentCents;
  if (!Number.isSafeInteger(totalGranCents)) return null;
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
  accionsDeLlista: Object.freeze({ buidaCistell, configuraDesplacament }),
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
