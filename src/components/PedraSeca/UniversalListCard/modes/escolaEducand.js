/**
 * modes/escolaEducand.js — Fase E (261020, tasca 2) · el mode Escola ·
 * Educand d'«El Comú»: la fitxa d'un alumne de l'escola de música
 * (auditoria 261020_2030 §5.3 i §6.3, mode 6). Un element és una assignatura.
 *
 * capaMode d'una assignatura:
 *   { professor?, professorId?,
 *     mesos: [{ mes, setmanes: [null | 'E' | 'B' | 'R' | 'M' | 'X' × 5], nota: null | 0..10 }],
 *     dialeg: [{ id, rol: 'professor' | 'familia', text, usuariId, nom, at }] }
 * configMode: { curs?, alumne?, instrument?, gestors? (el professorat que la governa), families?: [usuariId] }
 *
 * Seguiment formatiu, no punitiu: cap rànquing ni comparació amb ningú, les
 * lletres es diuen amb paraules i l'evolució és una línia, no un semàfor.
 * És informació d'un menor: només la veuen el professorat (gestors i el
 * professor de l'assignatura) i la família; per a la resta, la fitxa no
 * existix (potVeure). Ací és la regla de la vista; la del servidor (RLS) és
 * de la tasca 1.
 */
import { LIMITS_COMU, ambElement, ambElementNou, elementBase, errorComu, esGestor, partsPerComes, signaturaDe, textNet } from '../basesComu.js';

export const MESOS_CURS = Object.freeze(['setembre', 'octubre', 'novembre', 'desembre', 'gener', 'febrer', 'marc', 'abril', 'maig', 'juny', 'juliol', 'agost']);
export const LLETRES = Object.freeze(['E', 'B', 'R', 'M', 'X']);
const SETMANES = 5;
const DIALEG_MAXIM = 100;

const esDeLaFamilia = (llista, actor) => Boolean(actor?.id) && (llista.configMode?.families ?? []).includes(actor.id);
const esProfessorDe = (element, actor) => Boolean(actor?.id) && element.capaMode.professorId === actor.id;
const potAnotar = (llista, element, actor) => esGestor(llista, actor) || esProfessorDe(element, actor);

/** Qui pot vore la fitxa: el professorat i la família. */
export function potVeureFitxa(llista, actor) {
  return esGestor(llista, actor) || esDeLaFamilia(llista, actor) || llista.elementsComu.some((e) => esProfessorDe(e, actor));
}

const mesosBuits = () => MESOS_CURS.map((mes) => ({ mes, setmanes: Array(SETMANES).fill(null), nota: null }));
/** Els dotze mesos del curs, en ordre: els que falten a la capa, buits (anotar gener amb setembre a desembre també es guarda). */
const mesosDe = (element) => {
  const desats = Array.isArray(element.capaMode.mesos) ? element.capaMode.mesos : [];
  return MESOS_CURS.map((mes) => desats.find((m) => m?.mes === mes) ?? { mes, setmanes: Array(SETMANES).fill(null), nota: null });
};

/** L'entrada ràpida: «Solfeig, Pep» (l'assignatura i qui la fa, amb una coma). */
function entradaDeText(text) {
  const [nom, professor] = partsPerComes(text);
  return { nom, professor };
}

function afegeix(llista, entradaCrua, ctx) {
  if (!esGestor(llista, ctx.actor)) return errorComu('no-autoritzat');
  const entrada = typeof entradaCrua?.text === 'string' ? entradaDeText(entradaCrua.text) : entradaCrua;
  const capa = { mesos: mesosBuits(), dialeg: [] };
  const professor = textNet(entrada?.professor);
  if (professor) capa.professor = professor;
  if (typeof entrada?.professorId === 'string' && entrada.professorId) capa.professorId = entrada.professorId;
  const base = elementBase(entrada, ctx, capa);
  return base.ok ? ambElementNou(llista, base.element) : base;
}

const ambMes = (llista, element, mes, canvi) => ambElement(llista, element.id, (e) => ({
  ...e, capaMode: { ...e.capaMode, mesos: mesosDe(e).map((m) => (m.mes === mes ? canvi(m) : m)) }
}));

/** La lletra d'una setmana (o null per a esborrar-la). */
function anota(llista, element, accio, ctx) {
  if (!potAnotar(llista, element, ctx.actor)) return errorComu('no-autoritzat');
  const setmana = accio?.setmana;
  const valor = accio?.valor ?? null;
  if (!MESOS_CURS.includes(accio?.mes) || !Number.isSafeInteger(setmana) || setmana < 0 || setmana >= SETMANES
    || (valor !== null && !LLETRES.includes(valor))) return errorComu('valor-invalid');
  return { ok: true, llista: ambMes(llista, element, accio.mes, (m) => ({ ...m, setmanes: m.setmanes.map((s, i) => (i === setmana ? valor : s)) })) };
}

/** La nota del mes, de 0 a 10 amb un decimal (o null). */
function qualifica(llista, element, accio, ctx) {
  if (!potAnotar(llista, element, ctx.actor)) return errorComu('no-autoritzat');
  const nota = accio?.nota === null ? null : Number(accio?.nota);
  if (!MESOS_CURS.includes(accio?.mes) || (nota !== null && (!Number.isFinite(nota) || nota < 0 || nota > 10))) return errorComu('valor-invalid');
  const arrodonida = nota === null ? null : Math.round(nota * 10) / 10;
  return { ok: true, llista: ambMes(llista, element, accio.mes, (m) => ({ ...m, nota: arrodonida })) };
}

/** Una observació al diàleg de tutoria: del professorat o de la família, mai d'una altra persona. */
function comenta(llista, element, accio, ctx) {
  const rol = potAnotar(llista, element, ctx.actor) ? 'professor' : (esDeLaFamilia(llista, ctx.actor) ? 'familia' : null);
  if (!rol) return errorComu('no-autoritzat');
  const text = textNet(accio?.text, LIMITS_COMU.text);
  if (!text) return errorComu('valor-invalid');
  const entrada = { id: ctx.nouId(), rol, text, ...signaturaDe(ctx.actor, ctx.ara) };
  return {
    ok: true,
    llista: ambElement(llista, element.id, (e) => ({ ...e, capaMode: { ...e.capaMode, dialeg: [...(e.capaMode.dialeg ?? []), entrada].slice(-DIALEG_MAXIM) } }))
  };
}

/** El seguiment d'una assignatura: el recompte de lletres, les notes per mes (per a la línia) i la mitjana. */
export function seguimentDe(element) {
  const recompte = { E: 0, B: 0, R: 0, M: 0, X: 0 };
  const notes = [];
  for (const m of mesosDe(element)) {
    for (const s of m.setmanes ?? []) if (LLETRES.includes(s)) recompte[s] += 1;
    notes.push(Number.isFinite(m.nota) ? m.nota : null);
  }
  const amb = notes.filter((n) => n !== null);
  const mitjana = amb.length ? Math.round((amb.reduce((s, n) => s + n, 0) / amb.length) * 10) / 10 : null;
  return { recompte, notes, mitjana, darrera: amb.length ? amb[amb.length - 1] : null };
}

export const MODE_ESCOLA_EDUCAND = Object.freeze({
  id: 'escola_educand',
  forma: 'files',
  estats: Object.freeze(['actiu']),
  potVeure: potVeureFitxa,
  potAfegir: esGestor,
  afegeix,
  potEliminar: (llista, _element, actor) => esGestor(llista, actor),
  potAnotar,
  potComentar: (llista, element, actor) => potAnotar(llista, element, actor) || esDeLaFamilia(llista, actor),
  accions: Object.freeze({ anota, qualifica, comenta }),
  estatDe: () => 'actiu',
  filtres: Object.freeze([]),
  resum(llista) {
    const mitjanes = llista.elementsComu.map((e) => seguimentDe(e).mitjana).filter((m) => m !== null);
    return {
      progres: null,
      assignatures: llista.elementsComu.length,
      mitjana: mitjanes.length ? Math.round((mitjanes.reduce((s, m) => s + m, 0) / mitjanes.length) * 10) / 10 : null
    };
  },
  columnes: Object.freeze([
    { clau: 'nom', valor: (e) => e.nom },
    { clau: 'professor', valor: (e) => e.capaMode.professor ?? '' },
    ...LLETRES.map((l) => ({ clau: `lletra${l}`, valor: (e) => seguimentDe(e).recompte[l] })),
    { clau: 'mitjana', valor: (e) => seguimentDe(e).mitjana }
  ])
});
