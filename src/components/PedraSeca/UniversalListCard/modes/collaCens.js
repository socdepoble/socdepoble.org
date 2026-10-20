/**
 * modes/collaCens.js — Fase E (261020, tasca 2) · el mode Colla · Cens d'«El
 * Comú»: rols, disfresses i encàrrecs que cada qui reclama amb un toc
 * (auditoria 261020_2030 §4 i §6.3, mode 3).
 *
 * capaMode d'un element:
 *   { descripcio?, faccio?, esMenut?, quota (1..99, per defecte 1),
 *     adjudicacions: [{ usuariId, nom, at }] }
 * configMode: { faccions?: [text], permetMultiReclam?: boolean, gestors? }
 *
 * Reclamar és un intercanvi atòmic: només entra si queda plaça (quota) i, si
 * la llista no ho permet, si la persona encara no en té cap altre. Ací és la
 * regla local i optimista; la de veres la repetix el servidor dins d'una
 * transacció (tasca 1, rpc_muta_element_comu), i un «ple» de tornada desfà el
 * toc. ALLIBERAR un lloc és cosa de qui el té o de qui governa la llista, mai
 * d'una altra persona: és la vulnerabilitat de la Vila Gal·la (§4.2) que no
 * repetim. La identitat ve de la sessió (ctx.actor), mai d'un text lliure.
 */
import { ambElement, ambElementNou, elementBase, enterEntre, errorComu, esGestor, signaturaDe, textNet } from '../basesComu.js';
import { extrauEspecificacio } from '../extractorEspecificacio.js';

const quotaDe = (element) => enterEntre(element.capaMode.quota, 1, 99) ?? 1;
const adjudicacionsDe = (element) => element.capaMode.adjudicacions ?? [];
export const teLloc = (element, usuariId) => adjudicacionsDe(element).some((a) => a.usuariId === usuariId);
export const placesLliures = (element) => Math.max(0, quotaDe(element) - adjudicacionsDe(element).length);

/** L'entrada ràpida: «Druida» (una plaça) o «Soldat romà x5» (cinc). */
function entradaDeText(text) {
  const extret = extrauEspecificacio(text);
  return extret.unitat === 'u' && Number.isSafeInteger(extret.quantitat) ? { nom: extret.nom, quota: extret.quantitat } : { nom: textNet(text) };
}

function afegeix(llista, entradaCrua, ctx) {
  if (!esGestor(llista, ctx.actor)) return errorComu('no-autoritzat');
  const entrada = typeof entradaCrua?.text === 'string' ? entradaDeText(entradaCrua.text) : entradaCrua;
  const quota = entrada?.quota === undefined ? 1 : enterEntre(entrada.quota, 1, 99);
  if (quota === null) return errorComu('valor-invalid');
  const capa = { quota, adjudicacions: [] };
  const descripcio = textNet(entrada?.descripcio, 160);
  const faccio = textNet(entrada?.faccio);
  if (descripcio) capa.descripcio = descripcio;
  if (faccio) capa.faccio = faccio;
  if (entrada?.esMenut === true) capa.esMenut = true;
  const base = elementBase(entrada, ctx, capa);
  return base.ok ? ambElementNou(llista, base.element) : base;
}

function reclama(llista, element, _accio, ctx) {
  const id = ctx.actor?.id;
  if (!id) return errorComu('no-autoritzat');
  if (teLloc(element, id)) return errorComu('ja-reclamat');
  if (placesLliures(element) === 0) return errorComu('ple');
  if (llista.configMode?.permetMultiReclam !== true && llista.elementsComu.some((e) => e.id !== element.id && teLloc(e, id))) {
    return errorComu('ja-en-tens');
  }
  return {
    ok: true,
    llista: ambElement(llista, element.id, (e) => ({
      ...e, capaMode: { ...e.capaMode, adjudicacions: [...adjudicacionsDe(e), signaturaDe(ctx.actor, ctx.ara)] }
    }))
  };
}

function allibera(llista, element, accio, ctx) {
  const objectiu = accio?.usuariId ?? ctx.actor?.id;
  if (!objectiu || !teLloc(element, objectiu)) return errorComu('valor-invalid');
  if (objectiu !== ctx.actor?.id && !esGestor(llista, ctx.actor)) return errorComu('no-autoritzat');
  return {
    ok: true,
    llista: ambElement(llista, element.id, (e) => ({
      ...e, capaMode: { ...e.capaMode, adjudicacions: adjudicacionsDe(e).filter((a) => a.usuariId !== objectiu) }
    }))
  };
}

export const MODE_COLLA_CENS = Object.freeze({
  id: 'colla_cens',
  forma: 'rajoles',
  estats: Object.freeze(['lliure', 'agafat']),
  potAfegir: esGestor,
  afegeix,
  potEliminar: (llista, _element, actor) => esGestor(llista, actor),
  accions: Object.freeze({ reclama, allibera }),
  estatDe: (element) => (placesLliures(element) > 0 ? 'lliure' : 'agafat'),
  filtres: Object.freeze([
    { valor: 'tots', estats: null },
    { valor: 'lliure', estats: ['lliure'] },
    { valor: 'agafat', estats: ['agafat'] }
  ]),
  resum(llista, actor) {
    const places = llista.elementsComu.reduce((s, e) => s + quotaDe(e), 0);
    const ocupades = llista.elementsComu.reduce((s, e) => s + Math.min(quotaDe(e), adjudicacionsDe(e).length), 0);
    const faccions = new Map();
    for (const e of llista.elementsComu) {
      const clau = e.capaMode.faccio ?? '';
      const f = faccions.get(clau) ?? { faccio: clau, places: 0, ocupades: 0 };
      f.places += quotaDe(e);
      f.ocupades += Math.min(quotaDe(e), adjudicacionsDe(e).length);
      faccions.set(clau, f);
    }
    return {
      progres: { fets: ocupades, total: places },
      places,
      ocupades,
      lliures: places - ocupades,
      perFaccio: [...faccions.values()],
      meus: actor?.id ? llista.elementsComu.filter((e) => teLloc(e, actor.id)).map((e) => e.id) : []
    };
  },
  columnes: Object.freeze([
    { clau: 'nom', valor: (e) => e.nom },
    { clau: 'faccio', valor: (e) => e.capaMode.faccio ?? '' },
    { clau: 'descripcio', valor: (e) => e.capaMode.descripcio ?? '' },
    { clau: 'quota', valor: (e) => quotaDe(e) },
    { clau: 'qui', valor: (e) => adjudicacionsDe(e).map((a) => a.nom).join(', ') }
  ])
});
