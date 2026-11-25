/** Cerca local, fusió i navegació. Els resultats remots sempre passen l'autorització SQL. */
import { normalitzaUnicodeAmbLimit } from '../../utils/normalitzaUnicodeSegura.js';
const plega = text => normalitzaUnicodeAmbLimit(String(text ?? '').slice(0, 100_000), 'NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('ca');
const idValid = id => typeof id === 'string' && id.length > 0 && id.length <= 128;
const ordre = (a, b) => (Number(a.seq) || 0) - (Number(b.seq) || 0) || String(a.id).localeCompare(String(b.id));
const visible = m => m && !m.esborratAl && !m.esborrat_al && !m.xifrat;

export function fusionaResultatsCerca(locals = [], remots = [], { filId } = {}) {
  if (!idValid(filId) || !Array.isArray(locals) || !Array.isArray(remots)) throw new TypeError('Cerca sense fil o resultats vàlids.');
  const files = new Map(), retirats = new Set();
  for (const m of [...locals, ...remots]) {
    if (!idValid(m?.id) || m.filId !== filId) throw new TypeError('Resultat de cerca fora de la conversa.');
    if (!visible(m)) retirats.add(m.id);
    const anterior = files.get(m.id);
    if (anterior && anterior.seq !== m.seq) throw new TypeError('UUID de cerca amb seq divergent.');
    const editatAnterior = Date.parse(anterior?.editatAl), editatNou = Date.parse(m.editatAl);
    if (!anterior || !Number.isFinite(editatAnterior) || (Number.isFinite(editatNou) && editatNou >= editatAnterior)) files.set(m.id, m);
  }
  return [...files.values()].filter(m => visible(m) && !retirats.has(m.id)).sort(ordre);
}

export function creaIndexCercaConversa(missatges = [], { filId } = {}) {
  const files = fusionaResultatsCerca(missatges, [], { filId });
  const index = files.map(missatge => ({ missatge, text: plega(missatge.text) }));
  return Object.freeze({
    filId,
    cerca(consulta) {
      if (typeof consulta !== 'string' || consulta.length > 256) throw new TypeError('Consulta de cerca invàlida.');
      const text = plega(consulta.trim());
      return text ? index.filter(f => f.text.includes(text)).map(f => f.missatge) : [];
    },
  });
}

/** actual és 1..total; 0 amb cap resultat. El cursor manté UUID després de fusionar pàgines. */
export function navegaResultatsCerca(resultats, { idActual = null, direccio = 0 } = {}) {
  if (!Array.isArray(resultats) || ![-1, 0, 1].includes(direccio)) throw new TypeError('Navegació de cerca invàlida.');
  const total = resultats.length;
  if (!total) return { actual: 0, total: 0, missatge: null, anterior: null, seguent: null };
  const trobat = resultats.findIndex(m => m.id === idActual);
  const index = trobat < 0 ? (direccio < 0 ? total - 1 : 0) : (trobat + direccio + total) % total;
  return { actual: index + 1, total, missatge: resultats[index], anterior: resultats[(index + total - 1) % total].id, seguent: resultats[(index + 1) % total].id };
}

/** carregaPerId no s'ha de limitar a les 50 files ja presents; SQL revalida visibilitat. */
export async function carregaMissatgeCitat(id, { filId, missatges = [], carregaPerId, signal } = {}) {
  if (!idValid(id) || !idValid(filId)) throw new TypeError('Citació invàlida.');
  signal?.throwIfAborted();
  let fila = missatges.find(m => m.id === id && m.filId === filId);
  if (!fila) {
    if (typeof carregaPerId !== 'function') throw new TypeError('Falta el carregador del missatge antic.');
    fila = await carregaPerId(filId, id, { signal });
  }
  signal?.throwIfAborted();
  if (!fila || fila.id !== id || fila.filId !== filId || !visible(fila)) throw Object.assign(new Error('Missatge citat no disponible.'), { code: 'NO_TROBAT' });
  return fila;
}

const CAP_CERCA = Object.freeze([]);
const UUID_CERCA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorControlador(codi, causa) {
  const error = Object.assign(new Error(codi), { code: codi, codi });
  if (['AMBIT_REVOCAT', 'CERCA_DESCARTADA', 'INSTANCIA_TANCADA'].includes(codi)) error.name = 'AbortError';
  if (causa !== undefined) Object.defineProperty(error, 'cause', { value: causa });
  return error;
}

/** Compara instants sense perdre microsegons; mai reconstruïx el cursor enviat. */
function microsegonsCerca(text) {
  const m = typeof text === 'string' && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(text);
  if (!m) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
  const [any, mes, dia, hora, minut, segon] = m.slice(1, 7).map(Number);
  const traspas = any % 4 === 0 && (any % 100 !== 0 || any % 400 === 0);
  const dies = [31, traspas ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (any < 1 || mes < 1 || mes > 12 || dia < 1 || dia > dies[mes - 1] || hora > 23 || minut > 59 || segon > 59 || Number(m[10] ?? 0) > 23 || Number(m[11] ?? 0) > 59) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
  const ms = Date.UTC(any < 100 ? any + 400 : any, mes - 1, dia, hora, minut, segon) - (any < 100 ? 146097 * 86400000 : 0);
  const offset = (Number(m[10] ?? 0) * 60 + Number(m[11] ?? 0)) * (m[9] === '-' ? -1 : 1);
  return BigInt(ms) * 1000n + BigInt((m[7] ?? '').padEnd(6, '0')) - BigInt(offset) * 60000000n;
}

function comparaCursorCerca(a, b) {
  const x = microsegonsCerca(a.creatAl), y = microsegonsCerca(b.creatAl);
  return x < y ? -1 : x > y ? 1 : a.seq < b.seq ? -1 : a.seq > b.seq ? 1 : 0;
}

function copiaDadesCerca(value, depth = 0, budget = { n: 0 }) {
  if (++budget.n > 20000 || depth > 24) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || (!Array.isArray(value) && ![null, Object.prototype].includes(Object.getPrototypeOf(value)))) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
  const result = Array.isArray(value) ? [] : Object.create(null);
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value)).sort(([a], [b]) => a.localeCompare(b))) {
    if (!descriptor.enumerable) continue;
    if (!('value' in descriptor)) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
    Object.defineProperty(result, key, { value: copiaDadesCerca(descriptor.value, depth + 1, budget), enumerable: true });
  }
  return Object.freeze(result);
}

const visibleControlador = m => visible(m) && !m.esborrat && !m.bloquejat && !m.amagat && !m.seguretat?.xifrat;
const errorPublicCerca = (codi, operacio, recuperable) => Object.freeze({ codi, operacio, recuperable });
function dadaUiCerca(objecte, clau) {
  const descriptor = Object.getOwnPropertyDescriptor(objecte, clau);
  if (descriptor && !('value' in descriptor)) throw new TypeError('DTO UI amb getter.');
  return descriptor?.value;
}

/**
 * Instància per sessió+fil. Només les accions fan transport. Lectures síncrones
 * poden marcar revocació terminal; notifiquen en una única microtasca, mai inline.
 * El consumidor connecta onCanviaConsulta i el provider preparat a G1/G6.
 */
export function creaControladorCercaConversa({ filId, generacioSessio, comprovaAmbit, signal, cercaPagina, carregaPerId, limit = 50 } = {}) {
  if (!UUID_CERCA.test(filId) || !((typeof generacioSessio === 'string' && generacioSessio.length > 0 && generacioSessio.length <= 128) || (Number.isSafeInteger(generacioSessio) && generacioSessio >= 0)) || typeof comprovaAmbit !== 'function' || typeof cercaPagina !== 'function' || typeof carregaPerId !== 'function' || !Number.isInteger(limit) || limit < 1 || limit > 100 || typeof signal?.aborted !== 'boolean' || typeof signal?.addEventListener !== 'function' || typeof signal?.removeEventListener !== 'function') throw new TypeError('Controlador de cerca sense contracte complet.');
  let vida = 'viu', causaRevocacio, estat, generacioConsulta = 0, generacioSalt = 0, revisioLocal = -1, signaturaLocal = '';
  let locals = CAP_CERCA, remots = new Map(), retirats = new Set(), exclososConsulta = new Set(), identitats = new Map();
  let pendentPagina = null, pendentSalt = null, ultimError = null, reintent = null, avisProgramat = false;
  const listeners = new Set(), rebuts = new WeakMap();

  function programaAvis() {
    if (avisProgramat) return;
    avisProgramat = true;
    queueMicrotask(() => {
      avisProgramat = false;
      if (vida !== 'viu') {
        pendentPagina?.controller.abort(); pendentSalt?.controller.abort();
        signal.removeEventListener('abort', onAbort);
      }
      let fallades = 0;
      for (const listener of [...listeners]) {
        try { listener(); } catch { fallades++; }
      }
      if (fallades && vida === 'viu') publica({ fase: 'error', error: errorPublicCerca('SUBSCRIPTOR_FALLIT', 'notifica', false), completa: false }, false);
      if (vida === 'tancat') listeners.clear();
    });
  }

  function proveidor(gen, revisio, consulta, ids) {
    return (missatgesUi, consultaUi) => {
      if (!lecturaVigent() || gen !== generacioConsulta || revisio !== estat.revisioResultats || typeof consultaUi !== 'string' || consultaUi.trim() !== consulta) return CAP_CERCA;
      try {
        const ocults = new Set();
        for (const m of Array.isArray(missatgesUi) ? missatgesUi : CAP_CERCA) {
          if (!m) continue;
          if (typeof m !== 'object' || ![null, Object.prototype].includes(Object.getPrototypeOf(m))) return CAP_CERCA;
          const target = dadaUiCerca(m, 'id'), seguretat = dadaUiCerca(m, 'seguretat');
          if (seguretat && (typeof seguretat !== 'object' || ![null, Object.prototype].includes(Object.getPrototypeOf(seguretat)))) return CAP_CERCA;
          if (['esborrat', 'esborratAl', 'esborrat_al', 'bloquejat', 'amagat', 'xifrat'].some(clau => dadaUiCerca(m, clau)) || seguretat && dadaUiCerca(seguretat, 'xifrat')) ocults.add(String(target));
        }
        return ocults.size ? Object.freeze(ids.filter(id => !ocults.has(id))) : ids;
      } catch { return CAP_CERCA; }
    };
  }

  function publica(canvis = {}, avis = true) {
    const files = canvis.missatges ?? estat?.missatges ?? CAP_CERCA;
    const idsNous = Object.freeze(files.map(m => m.id));
    const consulta = canvis.consulta ?? estat?.consulta ?? '';
    const resultatsCanvien = !estat || estat.generacioConsulta !== generacioConsulta || consulta !== estat.consulta || idsNous.length !== estat.ids.length || idsNous.some((id, i) => id !== estat.ids[i]);
    const ids = resultatsCanvien ? idsNous : estat.ids;
    const revisioResultats = (estat?.revisioResultats ?? -1) + Number(resultatsCanvien);
    estat = Object.freeze({ fase: 'inactiva', consulta: '', missatges: CAP_CERCA, seguent: null, potCarregarMes: false, completa: false, error: null,
      salt: Object.freeze({ fase: 'inactiu', id: null, error: null }), ...estat, ...canvis,
      filId, generacioConsulta, revisio: (estat?.revisio ?? -1) + 1, revisioResultats, ids,
      cercadorG1: resultatsCanvien ? proveidor(generacioConsulta, revisioResultats, consulta, ids) : estat.cercadorG1 });
    if (avis) programaAvis();
    return estat;
  }

  function revoca(causa, tancat = false) {
    if (vida === 'tancat' || vida === 'revocat' && !tancat) return;
    vida = tancat ? 'tancat' : 'revocat'; causaRevocacio = causa;
    generacioConsulta++; generacioSalt++;
    locals = CAP_CERCA; remots.clear(); retirats.clear(); exclososConsulta.clear(); identitats.clear();
    reintent = null; ultimError = null; revisioLocal = -1; signaturaLocal = '';
    publica({ fase: tancat ? 'tancada' : 'revocada', consulta: '', missatges: CAP_CERCA, seguent: null, potCarregarMes: false, completa: false,
      error: errorPublicCerca(tancat ? 'INSTANCIA_TANCADA' : 'AMBIT_REVOCAT', 'ambit', false), salt: Object.freeze({ fase: 'inactiu', id: null, error: null }) });
  }
  function onAbort() { revoca(signal.reason); }
  function guarda() {
    if (vida !== 'viu') throw errorControlador(vida === 'tancat' ? 'INSTANCIA_TANCADA' : 'AMBIT_REVOCAT', causaRevocacio);
    try {
      if (signal.aborted) throw signal.reason ?? errorControlador('AMBIT_REVOCAT');
      const resultat = comprovaAmbit();
      if (resultat && typeof resultat.then === 'function') {
        Promise.resolve(resultat).catch(() => {});
        throw new TypeError('La guarda d’àmbit ha de ser síncrona.');
      }
      if (resultat !== undefined && resultat !== true) throw new TypeError('Àmbit no vigent.');
    } catch (error) {
      revoca(error); throw errorControlador('AMBIT_REVOCAT', error);
    }
  }
  function lecturaVigent() { try { guarda(); return true; } catch { return false; } }
  function comprovaIntent(intent, salt = false) {
    guarda();
    if (intent.gen !== generacioConsulta || intent.controller.signal.aborted || salt && intent.salt !== generacioSalt) throw errorControlador('CERCA_DESCARTADA');
  }
  function revalidaError(error, intent, salt = false) {
    try { comprovaIntent(intent, salt); } catch (invalidacio) { throw errorControlador(invalidacio.codi, error); }
    return error;
  }
  function anullaPendents() {
    pendentPagina?.controller.abort(); pendentSalt?.controller.abort();
    pendentPagina = null; pendentSalt = null;
  }
  function esperaIntent(intent, operacio) {
    return new Promise((resolve, reject) => {
      const aborta = () => { intent.controller.signal.removeEventListener('abort', aborta); reject(errorControlador('CERCA_DESCARTADA')); };
      intent.controller.signal.addEventListener('abort', aborta, { once: true });
      Promise.resolve().then(() => { comprovaIntent(intent); return operacio(); }).then(
        value => { intent.controller.signal.removeEventListener('abort', aborta); resolve(value); },
        error => { intent.controller.signal.removeEventListener('abort', aborta); reject(error); },
      );
      if (intent.controller.signal.aborted) aborta();
    });
  }
  function copiaFila(fila) {
    const copia = copiaDadesCerca(fila);
    if (!copia || !UUID_CERCA.test(copia.id) || copia.filId !== filId || !Number.isSafeInteger(copia.seq) || copia.seq < 1 || copia.text !== undefined && copia.text !== null && typeof copia.text !== 'string') throw errorControlador('RESPOSTA_CERCA_INVALIDA');
    microsegonsCerca(copia.creatAl);
    return copia;
  }
  function incorporaIdentitats(files) {
    const noves = new Map(identitats);
    for (const fila of files) {
      const previa = noves.get(fila.id), instant = microsegonsCerca(fila.creatAl);
      if (previa && (previa.seq !== fila.seq || previa.instant !== instant)) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
      noves.set(fila.id, { seq: fila.seq, instant });
    }
    return noves;
  }
  function signaturaSalt(fila) {
    return fila ? JSON.stringify({ id: fila.id, filId: fila.filId, seq: fila.seq, text: fila.text ?? null, editatAl: fila.editatAl ?? null,
      esborratAl: fila.esborratAl ?? fila.esborrat_al ?? null, esborrat: !!fila.esborrat, amagat: !!fila.amagat, bloquejat: !!fila.bloquejat,
      xifrat: !!fila.xifrat || !!fila.seguretat?.xifrat, metadades: fila.metadades ?? null }) : null;
  }
  function calcula(filesRemotes = remots, retiratsVigents = retirats, filesLocals = locals) {
    if (!estat.consulta) return CAP_CERCA;
    try {
      const files = fusionaResultatsCerca(filesLocals, [...filesRemotes.values()], { filId }).filter(m => visibleControlador(m) && !retiratsVigents.has(m.id) && !exclososConsulta.has(m.id));
      return Object.freeze(creaIndexCercaConversa(files, { filId }).cerca(estat.consulta).sort((a, b) => -comparaCursorCerca(a, b) || a.id.localeCompare(b.id)));
    } catch (error) { throw errorControlador(error?.codi ?? 'RESPOSTA_CERCA_INVALIDA', error); }
  }
  function validaPagina(resposta, intent) {
    if (!resposta || !Array.isArray(resposta.missatges) || resposta.missatges.length > limit || !Object.hasOwn(resposta, 'seguent')) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
    const files = resposta.missatges.map(copiaFila), ultim = files.at(-1);
    const cursor = resposta.seguent === null ? null : copiaDadesCerca(resposta.seguent);
    if ((files.length === limit) !== (cursor !== null)) throw errorControlador('CURSOR_CERCA_INVALID');
    if (cursor && (!ultim || !Number.isSafeInteger(cursor.seq) || cursor.seq < 1 || cursor.creatAl !== ultim.creatAl || cursor.seq !== ultim.seq || intent.cursor && comparaCursorCerca(cursor, intent.cursor) >= 0)) throw errorControlador('CURSOR_CERCA_INVALID');
    if (intent.cursor && files.some(fila => comparaCursorCerca(fila, intent.cursor) >= 0)) throw errorControlador('CURSOR_CERCA_INVALID');
    for (let i = 1; i < files.length; i++) if (comparaCursorCerca(files[i - 1], files[i]) < 0) throw errorControlador('CURSOR_CERCA_INVALID');
    return { files, cursor };
  }
  function executaPagina(cursor) {
    const intent = { gen: generacioConsulta, query: estat.consulta, cursor, controller: new AbortController() };
    const operacio = cursor ? 'pagina' : 'consulta';
    publica({ fase: 'carregant', completa: false, potCarregarMes: false, error: null });
    const promise = Promise.resolve().then(() => {
      comprovaIntent(intent);
      return esperaIntent(intent, () => cercaPagina(filId, intent.query, { limit, abansDe: cursor, signal: intent.controller.signal }));
    }).then(resposta => {
      comprovaIntent(intent);
      const { files, cursor: seguent } = validaPagina(resposta, intent);
      const novesIdentitats = incorporaIdentitats(files);
      const nous = new Map(remots), novesRetirades = new Set(retirats);
      for (const fila of files) {
        const anterior = nous.get(fila.id) ?? locals.find(local => local.id === fila.id);
        if (anterior && (anterior.seq !== fila.seq || microsegonsCerca(anterior.creatAl) !== microsegonsCerca(fila.creatAl))) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
        if (!visibleControlador(fila)) { novesRetirades.add(fila.id); nous.delete(fila.id); }
        else if (!novesRetirades.has(fila.id)) nous.set(fila.id, fila);
      }
      const missatges = calcula(nous, novesRetirades);
      comprovaIntent(intent); remots = nous; retirats = novesRetirades; identitats = novesIdentitats; reintent = null; ultimError = null;
      return publica({ fase: 'preparada', missatges, seguent, potCarregarMes: seguent !== null, completa: seguent === null, error: null });
    }).catch(error => {
      revalidaError(error, intent);
      const protocol = ['RESPOSTA_CERCA_INVALIDA', 'CURSOR_CERCA_INVALID'].includes(error?.codi);
      ultimError = errorControlador(error?.codi ?? 'CERCA_TRANSPORT', error);
      reintent = protocol ? null : cursor;
      publica({ fase: 'error', completa: false, potCarregarMes: false, error: errorPublicCerca(ultimError.codi, operacio, !protocol) });
      throw ultimError;
    }).finally(() => { if (pendentPagina?.intent === intent) pendentPagina = null; });
    pendentPagina = { intent, promise, controller: intent.controller };
    return promise;
  }
  function promesaAccio(operacio) { try { guarda(); return operacio(); } catch (error) { return Promise.reject(error); } }

  guarda(); signal.addEventListener('abort', onAbort, { once: true }); publica({}, false);
  const controlador = {
    llegixEstat() { lecturaVigent(); return estat; },
    subscriu(listener) {
      if (typeof listener !== 'function') throw new TypeError('Subscriptor invàlid.');
      listeners.add(listener); lecturaVigent(); return () => listeners.delete(listener);
    },
    actualitzaLocals(missatges, { revisio } = {}) {
      guarda();
      if (!Array.isArray(missatges) || !Number.isSafeInteger(revisio) || revisio < 0 || revisio < revisioLocal) throw errorControlador('REVISIO_LOCAL_INVALIDA');
      const files = missatges.map(copiaFila), signatura = JSON.stringify(files);
      if (revisio === revisioLocal) {
        if (signatura !== signaturaLocal) throw errorControlador('REVISIO_LOCAL_INVALIDA');
        return estat;
      }
      const novesIdentitats = incorporaIdentitats(files);
      const nousRemots = new Map(remots), novesRetirades = new Set(retirats);
      for (const fila of files) if (!visibleControlador(fila)) { novesRetirades.add(fila.id); nousRemots.delete(fila.id); }
      const nousLocals = Object.freeze(files.filter(fila => visibleControlador(fila) && !novesRetirades.has(fila.id)));
      try {
        fusionaResultatsCerca(files, [...nousRemots.values()], { filId });
        creaIndexCercaConversa(nousLocals, { filId });
      } catch (error) { throw errorControlador('RESPOSTA_CERCA_INVALIDA', error); }
      const missatgesNous = calcula(nousRemots, novesRetirades, nousLocals);
      guarda();
      locals = nousLocals; remots = nousRemots; retirats = novesRetirades; identitats = novesIdentitats;
      revisioLocal = revisio; signaturaLocal = signatura;
      return publica({ missatges: missatgesNous });
    },
    canviaConsulta(consulta) {
      return promesaAccio(() => {
        let neta;
        try {
          if (typeof consulta !== 'string' || consulta.length > 256) throw errorControlador('CONSULTA_INVALIDA');
          neta = consulta.trim(); plega(neta);
        } catch (error) {
          generacioConsulta++; generacioSalt++; anullaPendents();
          remots = new Map(); reintent = null; ultimError = errorControlador('CONSULTA_INVALIDA', error);
          publica({ consulta: '', missatges: CAP_CERCA, fase: 'error', seguent: null, potCarregarMes: false, completa: false, error: errorPublicCerca('CONSULTA_INVALIDA', 'consulta', false), salt: Object.freeze({ fase: 'inactiu', id: null, error: null }) });
          throw ultimError;
        }
        if (neta === estat.consulta && !(neta === '' && estat.fase === 'error')) return pendentPagina?.promise ?? (estat.fase === 'error' ? Promise.reject(ultimError ?? errorControlador(estat.error.codi)) : Promise.resolve(estat));
        generacioConsulta++; generacioSalt++; anullaPendents();
        remots = new Map(); exclososConsulta = new Set(); reintent = null; ultimError = null;
        publica({ consulta: neta, missatges: CAP_CERCA, fase: neta ? 'carregant' : 'inactiva', seguent: null, potCarregarMes: false, completa: false, error: null, salt: Object.freeze({ fase: 'inactiu', id: null, error: null }) });
        if (!neta) return Promise.resolve(estat);
        publica({ missatges: calcula() });
        return executaPagina(null);
      });
    },
    carregaMes() {
      return promesaAccio(() => pendentPagina?.promise ?? (estat.fase === 'error' ? Promise.reject(ultimError ?? errorControlador(estat.error.codi)) : estat.seguent && estat.fase === 'preparada' ? executaPagina(estat.seguent) : Promise.resolve(estat)));
    },
    reintenta() {
      return promesaAccio(() => pendentPagina?.promise ?? (estat.fase === 'error' && estat.error?.recuperable ? executaPagina(reintent) : Promise.reject(ultimError ?? errorControlador('REINTENT_NO_DISPONIBLE'))));
    },
    preparaSalt(id) {
      return promesaAccio(() => {
        if (!UUID_CERCA.test(id) || !estat.ids.includes(id)) throw errorControlador('MISSATGE_NO_DISPONIBLE');
        if (pendentSalt?.id === id && pendentSalt.intent.gen === generacioConsulta) return pendentSalt.promise;
        generacioSalt++; pendentSalt?.controller.abort();
        const intent = { gen: generacioConsulta, salt: generacioSalt, controller: new AbortController() };
        publica({ salt: Object.freeze({ fase: 'carregant', id, error: null }) });
        const promise = Promise.resolve().then(() => {
          comprovaIntent(intent, true);
          return esperaIntent(intent, () => carregaMissatgeCitat(id, { filId, missatges: [], signal: intent.controller.signal,
            carregaPerId: (fil, target, opcions) => carregaPerId(fil, target, opcions) }));
        }).then(fila => {
          comprovaIntent(intent, true);
          const copia = copiaFila(fila), anterior = estat.missatges.find(m => m.id === id);
          if (!anterior || anterior.seq !== copia.seq || microsegonsCerca(anterior.creatAl) !== microsegonsCerca(copia.creatAl)) throw errorControlador('RESPOSTA_CERCA_INVALIDA');
          const novesIdentitats = incorporaIdentitats([copia]);
          if (!visibleControlador(copia)) throw errorControlador('MISSATGE_NO_DISPONIBLE');
          let coincidix;
          try { coincidix = creaIndexCercaConversa([copia], { filId }).cerca(estat.consulta).length > 0; }
          catch (error) { throw errorControlador('RESPOSTA_CERCA_INVALIDA', error); }
          if (!coincidix) throw errorControlador('MISSATGE_NO_DISPONIBLE');
          const nous = new Map(remots); nous.set(id, copia);
          const missatges = calcula(nous), seleccionat = missatges.find(m => m.id === id);
          if (!seleccionat) throw errorControlador('MISSATGE_NO_DISPONIBLE');
          comprovaIntent(intent, true);
          remots = nous; identitats = novesIdentitats;
          const rebut = Object.freeze({ id, filId, missatge: copia });
          rebuts.set(rebut, { gen: generacioConsulta, salt: generacioSalt, signaturaFresca: signaturaSalt(copia),
            signaturaLocal: signaturaSalt(locals.find(local => local.id === id)) });
          publica({ missatges, salt: Object.freeze({ fase: 'preparat', id, error: null }) });
          return rebut;
        }).catch(error => {
          revalidaError(error, intent, true);
          const absent = error?.code === 'NO_TROBAT' || error?.codi === 'MISSATGE_NO_DISPONIBLE';
          const protocol = error?.codi === 'RESPOSTA_CERCA_INVALIDA';
          const codi = absent ? 'MISSATGE_NO_DISPONIBLE' : error?.codi ?? 'SALT_TRANSPORT';
          if (absent || protocol) { exclososConsulta.add(id); remots.delete(id); }
          publica({ missatges: calcula(), salt: Object.freeze({ fase: 'error', id, error: errorPublicCerca(codi, 'salt', !absent && !protocol) }) });
          throw errorControlador(codi, error);
        }).finally(() => { if (pendentSalt?.intent === intent) pendentSalt = null; });
        pendentSalt = { id, intent, promise, controller: intent.controller };
        return promise;
      });
    },
    comprovaSalt(rebut) {
      guarda();
      const privat = rebuts.get(rebut), fila = estat.missatges.find(m => m.id === rebut?.id);
      const local = locals.find(m => m.id === rebut?.id), signaturaLocalActual = signaturaSalt(local);
      if (!privat || privat.gen !== generacioConsulta || privat.salt !== generacioSalt || !fila
        || signaturaSalt(remots.get(rebut.id)) !== privat.signaturaFresca
        || signaturaLocalActual !== privat.signaturaLocal && signaturaLocalActual !== privat.signaturaFresca) throw errorControlador('CERCA_DESCARTADA');
      return rebut.missatge;
    },
    destrueix() { revoca(undefined, true); },
  };
  return Object.freeze(controlador);
}
