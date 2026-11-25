/** Subscripcions i avisos agrícoles. Dates proporcionades per una font explícita;
 * no inventa recomanacions ni activa SMS. El simulador és 100% sense IA.
 * El port injectat envia al Xat intern amb UUID idempotent (xat_envia).
 */
export const CANAL_AGRICOLA = 'sdp-calendari-agricola';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const falla = (codi) => Object.assign(new TypeError(`Dades agrícoles invàlides (${codi}).`), { codi });
const idDe = (v) => { if (typeof v !== 'string' || !UUID.test(v)) throw falla('UUID'); return v.toLowerCase(); };
const slugDe = (v) => { if (typeof v !== 'string' || v.length > 80 || !SLUG.test(v)) throw falla('SLUG'); return v; };

// Un error d'un callback pot ser congelat, primitiu o tindre getters que
// llancen. Llegir-ne metadades no ha de destruir el rebut d'un ACK anterior.
function dadaErrorAgricola(entrada, camp) {
  let objecte = entrada;
  for (let n = 0; n < 8 && objecte != null && ['object', 'function'].includes(typeof objecte); n++) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(objecte, camp);
      if (descriptor) return Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
      objecte = Object.getPrototypeOf(objecte);
    } catch { return undefined; }
  }
  return undefined;
}

function embolcallErrorAgricola(base, missatge, { causa = base, codiDefecte = 'ENVIAMENT_FALLIT' } = {}) {
  let nom = dadaErrorAgricola(base, 'name');
  let codiPort = dadaErrorAgricola(base, 'code');
  let esDom = false;
  try {
    if (typeof DOMException === 'function' && base instanceof DOMException) {
      const getterNom = Object.getOwnPropertyDescriptor(DOMException.prototype, 'name')?.get;
      const getterCodi = Object.getOwnPropertyDescriptor(DOMException.prototype, 'code')?.get;
      nom = getterNom.call(base);
      codiPort ??= getterCodi.call(base);
      esDom = true;
    }
  } catch { esDom = false; }
  const identificador = valor => typeof valor === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(valor);
  if (!identificador(nom)) nom = 'Error';
  // Només constructors natius coneguts; mai base.constructor o un callback.
  const constructors = new Map([
    ['TypeError', TypeError], ['RangeError', RangeError], ['SyntaxError', SyntaxError],
    ['ReferenceError', ReferenceError], ['URIError', URIError], ['EvalError', EvalError],
  ]);
  const Ctor = constructors.get(nom) ?? Error;
  const err = esDom ? new DOMException(missatge, nom) : new Ctor(missatge);
  if (!esDom) err.name = nom;
  const codi = dadaErrorAgricola(base, 'codi');
  err.codi = identificador(codi) ? codi : codiDefecte;
  if (identificador(codiPort) || Number.isSafeInteger(codiPort)) {
    Object.defineProperty(err, 'code', { value: codiPort, enumerable: true, configurable: true });
  }
  Object.defineProperty(err, 'cause', { value: causa });
  return err;
}
export function diaAgricola(v) {
  if (typeof v !== 'string' || !DATA.test(v)) throw falla('DATA');
  const instant = new Date(`${v}T12:00:00Z`);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString().slice(0, 10) !== v) throw falla('DATA');
  return v;
}

/** No converteix dies civils en instants: el 29 de març no canvia amb el DST. */
export function normalitzaSubscripcioAgricola(v) {
  if (!v || typeof v !== 'object' || typeof v.activa !== 'boolean') throw falla('SUBSCRIPCIO');
  return Object.freeze({ id: idDe(v.id), usuariId: idDe(v.usuariId), pobleId: idDe(v.pobleId), filId: idDe(v.filId),
    cultiu: slugDe(v.cultiu), comarca: slugDe(v.comarca), activa: v.activa });
}

export function normalitzaFitaAgricola(v) {
  if (!v || typeof v !== 'object') throw falla('FITA');
  const titol = typeof v.titol === 'string' ? v.titol.trim() : '';
  if (!titol || titol.length > 240 || /[\u0000-\u001f\u007f]/.test(titol)) throw falla('TITOL');
  let font;
  try { font = new URL(v.font); } catch { throw falla('FONT'); }
  if (font.protocol !== 'https:' || font.username || font.password) throw falla('FONT');
  return Object.freeze({ id: idDe(v.id), cultiu: slugDe(v.cultiu), comarca: slugDe(v.comarca), dia: diaAgricola(v.dia), titol, font: font.href });
}

async function uuidAvis(clau, cripto) {
  if (!cripto?.subtle?.digest) throw falla('SENSE_CRIPTO');
  const b = new Uint8Array(await cripto.subtle.digest('SHA-256', new TextEncoder().encode(clau))).slice(0, 16);
  b[6] = (b[6] & 15) | 0x50; b[8] = (b[8] & 63) | 0x80;
  const s = [...b].map((n) => n.toString(16).padStart(2, '0')).join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

/** Construïx un pla sense efectes laterals. Qualsevol duplicat divergent refusa tot el pla. */
export async function simulaAvisosAgricoles({ subscripcions, fites, desde, fins, cripto = globalThis.crypto } = {}) {
  diaAgricola(desde); diaAgricola(fins);
  if (desde >= fins || !Array.isArray(subscripcions) || !Array.isArray(fites) || subscripcions.length > 10000 || fites.length > 10000) throw falla('RANG');
  const subs = new Map();
  for (const cru of subscripcions) {
    const sub = normalitzaSubscripcioAgricola(cru);
    if (subs.has(sub.id) && JSON.stringify(subs.get(sub.id)) !== JSON.stringify(sub)) throw falla('DUPLICAT');
    subs.set(sub.id, sub);
  }
  const fonts = new Map();
  for (const cru of fites) {
    const fita = normalitzaFitaAgricola(cru);
    if (fonts.has(fita.id) && JSON.stringify(fonts.get(fita.id)) !== JSON.stringify(fita)) throw falla('DUPLICAT');
    fonts.set(fita.id, fita);
  }
  const avisos = [];
  for (const sub of subs.values()) {
    if (!sub.activa) continue;
    for (const fita of fonts.values()) {
      if (fita.cultiu !== sub.cultiu || fita.comarca !== sub.comarca || fita.dia < desde || fita.dia >= fins) continue;
      const clientId = await uuidAvis(`${CANAL_AGRICOLA}|${sub.id}|${fita.id}|${fita.dia}`, cripto);
      avisos.push(Object.freeze({ clientId, filId: sub.filId, usuariId: sub.usuariId, subscripcioId: sub.id,
        pobleId: sub.pobleId, cultiu: sub.cultiu, comarca: sub.comarca,
        canal: CANAL_AGRICOLA, dia: fita.dia, text: `${fita.dia} · ${fita.titol}\n${fita.font}` }));
    }
  }
  avisos.sort((a, b) => a.dia.localeCompare(b.dia) || a.clientId.localeCompare(b.clientId));
  return Object.freeze({ mode: 'simulat', senseIa: true, avisos: Object.freeze(avisos) });
}

/** Enviament explícit, mai automàtic en simular. `comprovaAmbit` és síncron i
 * obligatori; llança si ha canviat compte/tenant/sessió. `subscripcioActiva(id)`
 * retorna la fila autoritativa vigent (no un booleà), que es contrasta tota
 * abans d'enviar. El servidor encara ha de revalidar pertinença i identitat.
 * Refusa un ACK buit o d'un altre UUID.
 * `enviaXat` ha de fer servir clientId com a id de xat_envia (reintents idempotents).
 */
export async function enviaAvisosAgricoles(pla, { usuariId, subscripcioActiva, enviaXat, comprovaAmbit } = {}) {
  const actor = idDe(usuariId);
  if (pla?.mode !== 'simulat' || pla?.senseIa !== true || !Array.isArray(pla.avisos) || typeof subscripcioActiva !== 'function' || typeof enviaXat !== 'function' || typeof comprovaAmbit !== 'function') throw falla('PORT');
  const comprova = () => {
    const resultat = comprovaAmbit();
    if (resultat && typeof resultat.then === 'function') {
      Promise.resolve(resultat).catch(() => {}); // una guarda async refusada no deixa rebuig orfe
      throw falla('AMBIT_ASINCRON');
    }
    if (resultat === false) throw falla('AMBIT');
  };
  comprova();
  // Validar i capturar tot abans del primer await: ni una mutació posterior
  // de la UI ni un callback poden redirigir un avís ja validat a un altre fil.
  const avisos = pla.avisos.map((a) => {
    if (!a || idDe(a.usuariId) !== actor || !UUID.test(a.clientId) || !UUID.test(a.filId) || !UUID.test(a.subscripcioId) || a.canal !== CANAL_AGRICOLA || typeof a.text !== 'string' || !a.text || a.text.length > 4096) throw falla('AVIS');
    return Object.freeze({ clientId: idDe(a.clientId), usuariId: actor, subscripcioId: idDe(a.subscripcioId), filId: idDe(a.filId),
      pobleId: idDe(a.pobleId), cultiu: slugDe(a.cultiu), comarca: slugDe(a.comarca), canal: CANAL_AGRICOLA, dia: diaAgricola(a.dia), text: a.text });
  });
  const ids = new Set();
  for (const avis of avisos) {
    if (ids.has(avis.clientId)) throw falla('AVIS_DUPLICAT');
    ids.add(avis.clientId);
  }
  const resultats = [];
  let index = 0;
  let fase = 'ambit';
  let intentat = false;
  let ackConfirmat = false;
  // Les dues vies de settlement observen l'àmbit. Un rebuig de transport no
  // pot ocultar la revocació detectada ni permetre enviar el següent avís.
  const espera = async (operacio) => {
    try { return await operacio(); }
    catch (cause) {
      try { comprova(); }
      catch (errorAmbit) {
        const err = embolcallErrorAgricola(errorAmbit, 'Àmbit revocat durant un avís agrícola.', {
          causa: cause, codiDefecte: 'AMBIT',
        });
        Object.defineProperty(err, 'errorAmbit', { value: errorAmbit });
        throw err;
      }
      throw cause;
    }
  };
  try {
    for (; index < avisos.length; index++) {
      const avis = avisos[index];
      intentat = false;
      ackConfirmat = false;
      fase = 'ambit';
      comprova();
      fase = 'subscripcio';
      const crua = await espera(() => subscripcioActiva(avis.subscripcioId));
      comprova();
      const vigent = normalitzaSubscripcioAgricola(crua);
      if (vigent.id !== avis.subscripcioId || vigent.usuariId !== actor || vigent.filId !== avis.filId || vigent.pobleId !== avis.pobleId || vigent.cultiu !== avis.cultiu || vigent.comarca !== avis.comarca) throw falla('SUBSCRIPCIO_DIVERGENT');
      if (!vigent.activa) {
        resultats.push(Object.freeze({ clientId: avis.clientId, estat: 'baixa' }));
        continue;
      }
      fase = 'ambit';
      comprova();
      fase = 'enviament';
      intentat = true;
      const ack = await espera(() => enviaXat(avis));
      // Capturar l'ACK abans de la guarda posterior: si aquesta refusa,
      // l'error conserva el fet observat, sense anunciar èxit a la UI nova.
      ackConfirmat = ack?.id === avis.clientId;
      comprova();
      fase = 'ack';
      if (!ackConfirmat) throw falla('ACK');
      resultats.push(Object.freeze({ clientId: avis.clientId, estat: 'confirmat' }));
    }
    return Object.freeze(resultats);
  } catch (cause) {
    const actual = avisos[index];
    const confirmats = resultats.filter(r => r.estat === 'confirmat');
    if (ackConfirmat && actual && !confirmats.some(r => r.clientId === actual.clientId)) {
      confirmats.push(Object.freeze({ clientId: actual.clientId, estat: 'confirmat' }));
    }
    const rebut = Object.freeze({
      schema: 'sdp.avisos-agricoles.rebut.v1',
      confirmats: Object.freeze(confirmats),
      baixes: Object.freeze(resultats.filter(r => r.estat === 'baixa')),
      interromput: actual?.clientId ?? null,
      fase,
      estatActual: ackConfirmat ? 'ack-confirmat' : intentat ? 'sense-confirmacio' : 'no-enviat',
      noIntentats: Object.freeze(avisos.slice(index + 1).map(a => a.clientId)),
    });
    const err = Object.assign(embolcallErrorAgricola(cause, 'No s’han completat tots els avisos agrícoles.'), {
      rebut, ackConfirmat, teConfirmacions: confirmats.length > 0,
    });
    throw err;
  }
}
