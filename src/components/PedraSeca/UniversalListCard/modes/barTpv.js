/**
 * modes/barTpv.js — Fase E (261020, tasca 2) · el mode Bar · TPV d'«El Comú»:
 * la comanda de la colla o de la cantina de festes dins del xat (auditoria
 * 261020_2030 §3 i §6.3, mode 2). No és la caixa de l'app El Bar: ni torns, ni
 * IVA, ni cobraments de veres; és la llista viva del que s'ha demanat.
 *
 * capaMode d'una línia:
 *   { estat: 'demanat' | 'servit' | 'cobrat' | 'anullat', quantitat (1..99),
 *     preuCents | null, desti: 'barra' | 'cuina', demanatPer: { usuariId, nom, at } }
 * configMode: { carta?: [{ nom, preuCents?, desti?, emoji? }], gestors? }
 *
 * Tothom demana. Qui demana una línia la pot canviar o anul·lar mentre és
 * «demanat»; servir i cobrar és de qui governa la barra (el propietari i els
 * gestors). Dues peticions iguals de la mateixa persona es fusionen sumant
 * quantitats (deltes relatives, com sumaQuantitat del Bar): dos tocs no es
 * trepitgen, i la línia de cadascú continua sent seua.
 */
import { ambElement, ambElementNou, clauDeNom, elementBase, enterEntre, errorComu, esGestor, signaturaDe, textNet } from '../basesComu.js';
import { extrauEspecificacio } from '../extractorEspecificacio.js';

export const QUANTITAT_MAXIMA = 99;
const SEGUENT = Object.freeze({ demanat: 'servit', servit: 'cobrat' });
const DESTINS = Object.freeze(['barra', 'cuina']);

const cartaDe = (llista) => (Array.isArray(llista.configMode?.carta) ? llista.configMode.carta : []);
const esDeQuiDemana = (element, actor) => element.capaMode.demanatPer?.usuariId === actor?.id;

/** «2 cafè sol» o «Cafè sol x2»: la quantitat entera i el nom; la resta del text, nom. */
function entradaDeText(text) {
  const extret = extrauEspecificacio(text);
  const q = extret.unitat === 'u' && Number.isSafeInteger(extret.quantitat) ? extret.quantitat : null;
  return q ? { nom: extret.nom, quantitat: q } : { nom: textNet(text), quantitat: 1 };
}

function afegeix(llista, entrada, ctx) {
  const llegida = typeof entrada?.text === 'string' ? entradaDeText(entrada.text) : { nom: entrada?.nom, quantitat: entrada?.quantitat ?? 1 };
  const nom = textNet(llegida.nom);
  if (!nom) return errorComu('nom-buit');
  const quantitat = enterEntre(llegida.quantitat, 1, QUANTITAT_MAXIMA);
  if (quantitat === null) return errorComu('valor-invalid');
  const deCarta = cartaDe(llista).find((a) => clauDeNom(a.nom) === clauDeNom(nom)) ?? null;
  /* El preu és el de la carta; fora de la carta, només el posa qui governa la barra. */
  const preuCents = enterEntre(deCarta ? deCarta.preuCents : (esGestor(llista, ctx.actor) ? entrada?.preuCents : null), 0, 1_000_000);
  const desti = DESTINS.includes(entrada?.desti) ? entrada.desti : (DESTINS.includes(deCarta?.desti) ? deCarta.desti : 'barra');
  /* Només es fusiona amb una línia pròpia: cada qui és amo del que demana. */
  const igual = llista.elementsComu.find((e) => e.capaMode.estat === 'demanat' && clauDeNom(e.nom) === clauDeNom(nom)
    && e.capaMode.preuCents === preuCents && e.capaMode.desti === desti && esDeQuiDemana(e, ctx.actor));
  if (igual) {
    return {
      ok: true,
      llista: ambElement(llista, igual.id, (e) => ({
        ...e, capaMode: { ...e.capaMode, quantitat: Math.min(QUANTITAT_MAXIMA, e.capaMode.quantitat + quantitat) }
      }))
    };
  }
  const base = elementBase({ emoji: deCarta?.emoji, ...entrada, nom }, ctx, {
    estat: 'demanat', quantitat, preuCents, desti, demanatPer: signaturaDe(ctx.actor, ctx.ara)
  });
  return base.ok ? ambElementNou(llista, base.element) : base;
}

/** Servir i cobrar: demanat → servit → cobrat. */
function avanca(llista, element, _accio, ctx) {
  if (!esGestor(llista, ctx.actor)) return errorComu('no-autoritzat');
  const seguent = SEGUENT[element.capaMode.estat];
  if (!seguent) return errorComu('valor-invalid');
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, estat: seguent } })) };
}

/** Una unitat més o menys mentre és «demanat»; a zero, la línia queda anul·lada. */
function quantitat(llista, element, accio, ctx) {
  if (element.capaMode.estat !== 'demanat') return errorComu('valor-invalid');
  if (!esGestor(llista, ctx.actor) && !esDeQuiDemana(element, ctx.actor)) return errorComu('no-autoritzat');
  const delta = accio?.delta === 1 || accio?.delta === -1 ? accio.delta : null;
  if (delta === null) return errorComu('valor-invalid');
  const nova = Math.min(QUANTITAT_MAXIMA, element.capaMode.quantitat + delta);
  const capaMode = nova < 1 ? { ...element.capaMode, estat: 'anullat' } : { ...element.capaMode, quantitat: nova };
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode })) };
}

function anula(llista, element, _accio, ctx) {
  if (element.capaMode.estat !== 'demanat') return errorComu('valor-invalid');
  if (!esGestor(llista, ctx.actor) && !esDeQuiDemana(element, ctx.actor)) return errorComu('no-autoritzat');
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, estat: 'anullat' } })) };
}

/** El total d'una línia en cèntims, o null si no té preu. */
export const totalDeLinia = (element) => (Number.isSafeInteger(element.capaMode.preuCents)
  ? element.capaMode.preuCents * element.capaMode.quantitat : null);

export const MODE_BAR_TPV = Object.freeze({
  id: 'bar_tpv',
  forma: 'rajoles',
  estats: Object.freeze(['demanat', 'servit', 'cobrat', 'anullat']),
  potAfegir: (_llista, actor) => Boolean(actor?.id),
  afegeix,
  potEliminar: (llista, _element, actor) => esGestor(llista, actor),
  accions: Object.freeze({ avanca, quantitat, anula }),
  estatDe: (element) => element.capaMode.estat,
  filtres: Object.freeze([
    { valor: 'tots', estats: ['demanat', 'servit', 'cobrat'] },
    { valor: 'demanat', estats: ['demanat'] },
    { valor: 'servit', estats: ['servit'] },
    { valor: 'cobrat', estats: ['cobrat'] }
  ]),
  resum(llista) {
    const actives = llista.elementsComu.filter((e) => e.capaMode.estat !== 'anullat');
    const suma = (linies) => linies.reduce((s, e) => s + (totalDeLinia(e) ?? 0), 0);
    const perServir = actives.filter((e) => e.capaMode.estat === 'demanat');
    return {
      progres: { fets: actives.filter((e) => e.capaMode.estat === 'cobrat').length, total: actives.length },
      linies: actives.length,
      unitats: actives.reduce((s, e) => s + e.capaMode.quantitat, 0),
      totalCents: suma(actives),
      pendentCobrarCents: suma(actives.filter((e) => e.capaMode.estat !== 'cobrat')),
      perServir: perServir.length,
      perServirCuina: perServir.filter((e) => e.capaMode.desti === 'cuina').length,
      sensePreu: actives.filter((e) => totalDeLinia(e) === null).length
    };
  },
  columnes: Object.freeze([
    { clau: 'quantitat', valor: (e) => e.capaMode.quantitat },
    { clau: 'nom', valor: (e) => e.nom },
    { clau: 'desti', valor: (e) => e.capaMode.desti },
    { clau: 'estat', valor: (e) => e.capaMode.estat },
    { clau: 'preu', valor: (e) => e.capaMode.preuCents ?? null, cents: true },
    { clau: 'total', valor: (e) => totalDeLinia(e), cents: true },
    { clau: 'demanatPer', valor: (e) => e.capaMode.demanatPer?.nom ?? '' }
  ])
});
