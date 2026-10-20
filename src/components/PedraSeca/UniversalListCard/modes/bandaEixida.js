/**
 * modes/bandaEixida.js — Fase E (261020, tasca 2) · el mode Banda · Eixida
 * d'«El Comú»: el full d'eixides d'una contrata (auditoria 261020_2030 §5.1 i
 * §6.3, mode 4), en un sol foli viu dins del grup de la banda.
 *
 * capaMode d'un element (un músic o un reforç):
 *   { corda, vinculacio: 'plantilla' | 'eventual' | 'contractat', nivell? (1..6, plantilla),
 *     usuariId?, assistencia: 'convocat' | 'confirmat' | 'baixa',
 *     posaCotxe: boolean, places (0..8), pagament: 'pendent' | 'pagat' }
 * configMode:
 *   { acte?, data?, lloc?, volen?, codiActe? (1..4), necessitats?: { corda: n },
 *     tarifesCents?: { plantilla_nivell_1: { 1: 3000, … }, …, eventual?: {…}, contractat: {…} },
 *     suplementCotxeCents?, pressupostatCents?, gestors? }
 *
 * Cada músic confirma, es dona de baixa o posa cotxe per a ell mateix; la
 * junta (el propietari i els gestors) ho pot fer per qualsevol i és l'única
 * que paga i que veu la capa econòmica (la vista la demana amb esGestor).
 */
import { ambElement, ambElementNou, elementBase, enterEntre, errorComu, esGestor, partsPerComes, textNet } from '../basesComu.js';

const VINCULACIONS = Object.freeze(['plantilla', 'eventual', 'contractat']);
const ASSISTENCIES = Object.freeze(['convocat', 'confirmat', 'baixa']);
export const PLACES_PER_DEFECTE = 4;

const esDelMusic = (element, actor) => Boolean(actor?.id) && element.capaMode.usuariId === actor.id;
const potTocar = (llista, element, actor) => esGestor(llista, actor) || esDelMusic(element, actor);

/** La clau de la taula de tarifes d'un músic: 'plantilla_nivell_N', 'eventual' o 'contractat'. */
export function clauDeTarifa(element) {
  const { vinculacio, nivell } = element.capaMode;
  return vinculacio === 'plantilla' ? `plantilla_nivell_${enterEntre(nivell, 1, 6) ?? 1}` : vinculacio;
}

/** El sou d'un músic per a l'acte de la contrata, en cèntims, o null si la taula no el diu. */
export function souDe(element, configMode) {
  const codi = enterEntre(configMode?.codiActe, 1, 4);
  const fila = configMode?.tarifesCents?.[clauDeTarifa(element)];
  const sou = codi && fila ? fila[codi] ?? fila[String(codi)] : null;
  return Number.isSafeInteger(sou) && sou >= 0 ? sou : null;
}

/** L'entrada ràpida: «Pere, trompa» (el nom i la corda, amb una coma). */
function entradaDeText(text) {
  const [nom, corda] = partsPerComes(text);
  return { nom, corda };
}

function afegeix(llista, entradaCrua, ctx) {
  if (!esGestor(llista, ctx.actor)) return errorComu('no-autoritzat');
  const entrada = typeof entradaCrua?.text === 'string' ? entradaDeText(entradaCrua.text) : entradaCrua;
  const corda = textNet(entrada?.corda);
  if (!corda) return errorComu('valor-invalid');
  const vinculacio = VINCULACIONS.includes(entrada?.vinculacio) ? entrada.vinculacio : 'plantilla';
  const capa = { corda, vinculacio, assistencia: 'convocat', posaCotxe: false, places: 0, pagament: 'pendent' };
  if (vinculacio === 'plantilla') capa.nivell = enterEntre(entrada?.nivell, 1, 6) ?? 1;
  if (typeof entrada?.usuariId === 'string' && entrada.usuariId) capa.usuariId = entrada.usuariId;
  const base = elementBase(entrada, ctx, capa);
  return base.ok ? ambElementNou(llista, base.element) : base;
}

const posaAssistencia = (assistencia) => (llista, element, _accio, ctx) => {
  if (!potTocar(llista, element, ctx.actor)) return errorComu('no-autoritzat');
  /* Un músic ja pagat no deixa de constar com a confirmat: la junta desfà primer el pagament. */
  if (assistencia !== 'confirmat' && element.capaMode.pagament === 'pagat') return errorComu('valor-invalid');
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, assistencia } })) };
};

/** Posar o llevar el cotxe particular (amb les places lliures per a companys i instruments). */
function cotxe(llista, element, accio, ctx) {
  if (!potTocar(llista, element, ctx.actor)) return errorComu('no-autoritzat');
  const posaCotxe = typeof accio?.posaCotxe === 'boolean' ? accio.posaCotxe : !element.capaMode.posaCotxe;
  const places = posaCotxe ? enterEntre(accio?.places ?? PLACES_PER_DEFECTE, 1, 8) : 0;
  if (places === null) return errorComu('valor-invalid');
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, posaCotxe, places } })) };
}

/** Pagar (o desfer el pagament) d'un músic confirmat: només la junta. */
function paga(llista, element, _accio, ctx) {
  if (!esGestor(llista, ctx.actor)) return errorComu('no-autoritzat');
  if (element.capaMode.assistencia !== 'confirmat') return errorComu('valor-invalid');
  const pagament = element.capaMode.pagament === 'pagat' ? 'pendent' : 'pagat';
  return { ok: true, llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, pagament } })) };
}

export const MODE_BANDA_EIXIDA = Object.freeze({
  id: 'banda_eixida',
  forma: 'files',
  estats: ASSISTENCIES,
  potAfegir: esGestor,
  afegeix,
  potEliminar: (llista, _element, actor) => esGestor(llista, actor),
  potTocar,
  accions: Object.freeze({ confirma: posaAssistencia('confirmat'), baixa: posaAssistencia('baixa'), cotxe, paga }),
  estatDe: (element) => element.capaMode.assistencia,
  filtres: Object.freeze([
    { valor: 'tots', estats: null },
    { valor: 'confirmat', estats: ['confirmat'] },
    { valor: 'convocat', estats: ['convocat'] },
    { valor: 'baixa', estats: ['baixa'] }
  ]),
  resum(llista) {
    const config = llista.configMode ?? {};
    const confirmats = llista.elementsComu.filter((e) => e.capaMode.assistencia === 'confirmat');
    const ambCotxe = confirmats.filter((e) => e.capaMode.posaCotxe);
    const perCorda = new Map();
    for (const e of confirmats) perCorda.set(e.capaMode.corda, (perCorda.get(e.capaMode.corda) ?? 0) + 1);
    const falten = Object.entries(config.necessitats ?? {})
      .map(([corda, n]) => ({ corda, falten: Math.max(0, (enterEntre(n, 0, 999) ?? 0) - (perCorda.get(corda) ?? 0)) }))
      .filter((f) => f.falten > 0);
    const volen = enterEntre(config.volen, 0, 999);
    const suplement = enterEntre(config.suplementCotxeCents, 0, 100_000) ?? 0;
    const sous = confirmats.map((e) => souDe(e, config));
    const subtotalMusicsCents = sous.reduce((s, sou) => s + (sou ?? 0), 0);
    const totalCotxesCents = ambCotxe.length * suplement;
    const totalActeCents = subtotalMusicsCents + totalCotxesCents;
    const pressupostatCents = enterEntre(config.pressupostatCents, 0, 100_000_000);
    return {
      progres: { fets: confirmats.length, total: volen ?? llista.elementsComu.length },
      volen,
      anem: confirmats.length,
      convocats: llista.elementsComu.filter((e) => e.capaMode.assistencia === 'convocat').length,
      baixes: llista.elementsComu.filter((e) => e.capaMode.assistencia === 'baixa').length,
      cotxes: ambCotxe.length,
      places: ambCotxe.reduce((s, e) => s + (e.capaMode.places ?? 0), 0),
      falten,
      economia: {
        sensePreu: sous.filter((sou) => sou === null).length,
        subtotalMusicsCents,
        totalCotxesCents,
        totalActeCents,
        pressupostatCents,
        fonsCents: pressupostatCents === null ? null : pressupostatCents - totalActeCents,
        pagats: confirmats.filter((e) => e.capaMode.pagament === 'pagat').length
      }
    };
  },
  columnes: Object.freeze([
    { clau: 'nom', valor: (e) => e.nom },
    { clau: 'corda', valor: (e) => e.capaMode.corda },
    { clau: 'vinculacio', valor: (e) => e.capaMode.vinculacio },
    { clau: 'nivell', valor: (e) => e.capaMode.nivell ?? null },
    { clau: 'assistencia', valor: (e) => e.capaMode.assistencia },
    { clau: 'places', valor: (e) => (e.capaMode.posaCotxe ? e.capaMode.places : 0) },
    { clau: 'sou', valor: (e, llista) => souDe(e, llista.configMode), cents: true, economia: true },
    { clau: 'pagament', valor: (e) => e.capaMode.pagament, economia: true }
  ])
});
