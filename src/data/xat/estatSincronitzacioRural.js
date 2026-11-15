/**
 * estatSincronitzacioRural.js — Màquina d'estats honesta de xarxa rural i cua
 * local particionada per a `/xat` (`R25-B` · inspiració Emowe).
 *
 * Garanties matemàtiques:
 *   1. Cap missatge entra en `enviat_servidor` (`✓`) sense confirmació real del
 *      servidor amb `seq` enter segur (`>= 1`) i `id` coherent amb `client_msg_id`.
 *   2. Cap missatge entra en `entregat_destinatari` (`✓✓` gris) ni en
 *      `llegit_destinatari` (`✓✓` blau) per heurístiques falses (`navigator.onLine`,
 *      HTTP 200 sense cursor, ACK de proveïdor Push o despertar del Service Worker):
 *      cal cursor real del destinatari (`rebutPelsAltresFinsSeq >= seq` o
 *      `llegitPelsAltresFinsSeq >= seq`).
 *   3. Transicions monòtones: esdeveniments desordenats mai degraden `✓✓` blau a
 *      gris ni `✓✓` a `✓`.
 *   4. Cua local particionada per `backend::tenantId::usuariId::actorOrgId`, amb
 *      payload congelat per `client_msg_id` i bandera honesta `persistitLocal`
 *      davant `QuotaExceededError` o absència d'IndexedDB.
 */

export const ESTATS_MISSATGE_RURAL = Object.freeze({
  CUA_LOCAL: 'cua_local',
  ENVIAT_SERVIDOR: 'enviat_servidor',
  ENTREGAT_DESTINATARI: 'entregat_destinatari',
  LLEGIT_DESTINATARI: 'llegit_destinatari',
  ERROR_REINTENTABLE: 'error_reintentable',
});

export const ESTATS_CONNEXIO_RURAL = Object.freeze({
  EN_LINIA: 'en_linia',
  COBERTURA_INESTABLE: 'cobertura_inestable',
  FORA_DE_LINIA: 'fora_de_linia',
  SINCRONITZANT: 'sincronitzant',
});

const ORDRE_PROGRES_CONFIRMAT = Object.freeze({
  [ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE]: 0,
  [ESTATS_MISSATGE_RURAL.CUA_LOCAL]: 1,
  [ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR]: 2,
  [ESTATS_MISSATGE_RURAL.ENTREGAT_DESTINATARI]: 3,
  [ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI]: 4,
});

const FONTS_EVIDENCIA_ESPURIES = new Set([
  'navigator_online',
  'online',
  'http_ok_sense_seq',
  'optimista',
  'push_provider',
  'push_ack',
  'service_worker_wake',
  'sw_sync',
  'broadcast_local',
]);

const RE_UUID_CANONIC = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Revisió R26, ronda 3 · Intents d'un mateix missatge dins d'un sol drenatge (el
   de la foto i, com a molt, un altre per una petició arribada després que
   fallara): una enviaFn que demana drenatges no pot fer reintents sense fi. */
const MAX_INTENTS_PER_DRENATGE = 2;

/* Cedix el fil (una macrotasca) abans d'una passada de més del drenatge. */
function cedeixElFil() {
  return new Promise((resol) => { setTimeout(resol, 0); });
}

/* Revisió R26, ronda 3 · Valors amb què la clau de partició marca l'absència de
   tenant i d'actor: cap identificador real no els pot prendre. */
const TENANT_ABSENT = 'sense-tenant';
const ACTOR_PERSONAL = 'personal';

function errorRural(missatge, codi, extres = {}) {
  return Object.assign(new Error(missatge), { codi, ...extres });
}

function clonaICongela(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) {
    return Object.freeze(valor.map((item) => clonaICongela(item)));
  }
  const eixida = {};
  for (const clau of Object.keys(valor).sort()) {
    if (valor[clau] !== undefined) {
      eixida[clau] = clonaICongela(valor[clau]);
    }
  }
  return Object.freeze(eixida);
}

function empremtaPayload(filId, payload) {
  return JSON.stringify({
    filId: String(filId || '').trim().toLowerCase(),
    client_msg_id: payload.client_msg_id,
    text: payload.text,
    tipus: payload.tipus,
    respostaA: payload.respostaA,
    metadades: payload.metadades,
  });
}

/**
 * Construeix l'àmbit estricte d'aïllament de la cua local perquè cap missatge
 * pendent sobrevisca a un canvi de compte, de poble/tenant o d'entitat activa.
 *
 * Revisió R26, ronda 2 (el mateix patró que la R25.2-X01) · Sense sentinelles
 * compartides: abans, un backend o un tenant omesos queien tots dos a
 * 'default', i dos backends (o dos pobles) compartien partició i disc. Ara el
 * backend és obligatori (`backendScope(config)` de la config del transport,
 * com al servei) i el tenant s'ha de declarar (null explícit si el backend no
 * en té: «sense-tenant», la mateixa clau que el llinatge del servei).
 *
 * Revisió R26, ronda 3 (microsonda V5) · Injectivitat de veres: rebutjar només
 * «::» dins d'un component no bastava ({tenant 'x:', usuari 'y'} i {tenant 'x',
 * usuari ':y'} donaven tots dos 'b::x:::y::personal'), i els literals de
 * sentinella ('sense-tenant', 'personal') es confonien amb l'absència. Ara cap
 * component fora del backend pot portar «:», i els dos literals són reservats.
 * Com que tenant, usuari i actor no tenen «:» i no són buits, la clau es llig
 * sense ambigüitat de dreta a esquerra (el backend és el que queda). Un tenant
 * o un actor en blanc equivalen a null (la mateixa absència, la mateixa clau).
 */
export function construeixAmbitCuaRural({
  backend,
  tenantId,
  usuariId,
  actorOrgId = null,
} = {}) {
  const usuariNet = typeof usuariId === 'string' ? usuariId.trim() : '';
  if (!usuariNet) {
    throw errorRural(
      'Cal un usuariId autenticat per a particionar la cua local del xat.',
      'AMBIT_SENSE_USUARI',
    );
  }
  const backendNet = typeof backend === 'string' ? backend.trim() : '';
  if (!backendNet) {
    throw errorRural(
      'Cal l\'abast del backend (backendScope de la config del transport) per a particionar la cua local del xat.',
      'AMBIT_SENSE_BACKEND',
    );
  }
  if (tenantId === undefined) {
    throw errorRural(
      'Cal declarar el tenant (null si el backend no en té) per a particionar la cua local del xat.',
      'AMBIT_SENSE_TENANT',
    );
  }
  const tenantNet = tenantId === null ? '' : String(tenantId).trim();
  /* Un actor que no és text (un número, un objecte) no cau a 'personal': ajuntaria
     la cua d'una entitat amb la de la persona. null o text buit, sí que és la persona. */
  if (actorOrgId !== null && actorOrgId !== undefined && typeof actorOrgId !== 'string') {
    throw errorRural(
      'L\'actorOrgId de l\'àmbit de la cua ha de ser text (l\'identificador de l\'entitat) o null.',
      'AMBIT_INVALID',
    );
  }
  const actorNet = typeof actorOrgId === 'string' ? actorOrgId.trim() : '';
  if ([tenantNet, usuariNet, actorNet].some((component) => component.includes(':'))) {
    throw errorRural(
      'Cap component de l\'àmbit de la cua (fora del backend) pot contindre «:».',
      'AMBIT_INVALID',
    );
  }
  if (tenantNet === TENANT_ABSENT || actorNet === ACTOR_PERSONAL) {
    throw errorRural(
      `«${TENANT_ABSENT}» i «${ACTOR_PERSONAL}» marquen l'absència de tenant i d'actor: no poden ser identificadors.`,
      'AMBIT_INVALID',
    );
  }
  return `${backendNet}::${tenantNet || TENANT_ABSENT}::${usuariNet}::${actorNet || ACTOR_PERSONAL}`;
}

/**
 * Deriva l'estat honest de cobertura rural per a la interfície sense confondre
 * `navigator.onLine === true` amb connexió real quan els enviaments fallen o la
 * latència rural es dispara.
 */
export function derivaEstatConnexioRural({
  navigatorOnline = true,
  sincronitzant = false,
  falladesRecents = 0,
  rttMs = null,
  cuaPendent = 0,
} = {}) {
  if (!navigatorOnline) {
    return ESTATS_CONNEXIO_RURAL.FORA_DE_LINIA;
  }
  if (sincronitzant) {
    return ESTATS_CONNEXIO_RURAL.SINCRONITZANT;
  }
  if (
    falladesRecents > 0
    || (typeof rttMs === 'number' && Number.isFinite(rttMs) && rttMs >= 1800)
    || (cuaPendent > 0 && typeof rttMs === 'number' && rttMs >= 1000)
  ) {
    return ESTATS_CONNEXIO_RURAL.COBERTURA_INESTABLE;
  }
  return ESTATS_CONNEXIO_RURAL.EN_LINIA;
}

/**
 * Calcula el retard de reintent amb backoff exponencial acotat i jitter positiu
 * per evitar tempestes de reintents quan torna la cobertura al poble.
 */
export function calculaRetardReintentRural(
  intents,
  {
    baseMs = 1000,
    maxMs = 30000,
    factorJitter = 0.25,
    aleatori = Math.random,
  } = {},
) {
  const n = Math.max(0, Math.trunc(Number(intents) || 0));
  const baseSegura = Math.max(100, Number(baseMs) || 1000);
  const sostreSegur = Math.max(baseSegura, Number(maxMs) || 30000);
  const exponencial = Math.min(sostreSegur, baseSegura * (2 ** Math.min(n, 10)));
  const r = Math.min(1, Math.max(0, Number(aleatori()) || 0));
  const margeJitter = exponencial * Math.max(0, Math.min(0.5, Number(factorJitter) || 0));
  const ambJitter = Math.round(exponencial - (margeJitter / 2) + (r * margeJitter));
  return Math.min(sostreSegur, Math.max(baseSegura, ambJitter));
}

/**
 * Retorna els indicadors visuals honestos associats a cada estat del missatge.
 */
export function descriptorVisualEstatMissatge(registre) {
  const estat = registre?.estat || ESTATS_MISSATGE_RURAL.CUA_LOCAL;
  switch (estat) {
    case ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR:
      return Object.freeze({
        estat,
        icona: 'check_unic',
        checks: 1,
        lecturaConfirmada: false,
        pendentXarxa: false,
      });
    case ESTATS_MISSATGE_RURAL.ENTREGAT_DESTINATARI:
      return Object.freeze({
        estat,
        icona: 'doble_check_gris',
        checks: 2,
        lecturaConfirmada: false,
        pendentXarxa: false,
      });
    case ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI:
      return Object.freeze({
        estat,
        icona: 'doble_check_blau',
        checks: 2,
        lecturaConfirmada: true,
        pendentXarxa: false,
      });
    case ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE:
      return Object.freeze({
        estat,
        icona: 'alerta_reintent',
        checks: 0,
        lecturaConfirmada: false,
        pendentXarxa: true,
      });
    case ESTATS_MISSATGE_RURAL.CUA_LOCAL:
    default:
      return Object.freeze({
        estat: ESTATS_MISSATGE_RURAL.CUA_LOCAL,
        icona: 'rellotge_local',
        checks: 0,
        lecturaConfirmada: false,
        pendentXarxa: true,
      });
  }
}

/**
 * Crea un registre inicial honest en `cua_local` amb càrrega congelada.
 */
export function creaRegistreMissatgeRural({
  ambit,
  filId,
  clientMsgId,
  text,
  tipus = 'text',
  respostaA = null,
  metadades = {},
  persistitLocal = false,
  avisPersistencia = null,
  araMs = Date.now(),
}) {
  if (typeof ambit !== 'string' || ambit.split('::').length < 4) {
    throw errorRural('Cal un àmbit particionat vàlid per al missatge.', 'AMBIT_INVALID');
  }
  const filNet = typeof filId === 'string' ? filId.trim() : '';
  if (!filNet) {
    throw errorRural('Cal un filId vàlid per a encuar el missatge.', 'FIL_INVALID');
  }
  const uuid = typeof clientMsgId === 'string' ? clientMsgId.trim().toLowerCase() : '';
  if (!RE_UUID_CANONIC.test(uuid)) {
    throw errorRural('clientMsgId ha de ser un UUID v4 vàlid.', 'ID_CLIENT_INVALID');
  }

  const payload = clonaICongela({
    id: uuid,
    client_msg_id: uuid,
    text: typeof text === 'string' ? text : '',
    tipus: typeof tipus === 'string' && tipus.trim() ? tipus.trim() : 'text',
    respostaA: typeof respostaA === 'string' && respostaA.trim() ? respostaA.trim().toLowerCase() : null,
    metadades: metadades && typeof metadades === 'object' && !Array.isArray(metadades) ? metadades : {},
  });

  return clonaICongela({
    ambit,
    filId: filNet,
    client_msg_id: uuid,
    estat: ESTATS_MISSATGE_RURAL.CUA_LOCAL,
    persistitLocal: Boolean(persistitLocal),
    avisPersistencia: avisPersistencia ? String(avisPersistencia) : null,
    seq: null,
    servidorId: null,
    intents: 0,
    properReintentMs: null,
    ultimError: null,
    creatLocalMs: Number(araMs) || Date.now(),
    confirmatServidorEl: null,
    entregatEl: null,
    llegitEl: null,
    payload,
  });
}

/**
 * Transiciona a `enviat_servidor` (`✓`) ÚNICAMENT si hi ha evidència real del
 * servidor (`seq` enter segur >= 1 i identificador coherent).
 */
export function confirmaEnviamentServidor(registre, evidenciaServidor = {}) {
  if (!registre || typeof registre !== 'object') {
    throw errorRural('Cal un registre de missatge vàlid.', 'REGISTRE_INVALID');
  }
  const font = typeof evidenciaServidor?.font === 'string'
    ? evidenciaServidor.font.trim().toLowerCase()
    : 'rpc_xat_envia';

  if (FONTS_EVIDENCIA_ESPURIES.has(font)) {
    throw errorRural(
      `La font "${font}" no acredita que el servidor haja persistit el missatge.`,
      'EVIDENCIA_SERVIDOR_ESPURIA',
    );
  }

  const seq = evidenciaServidor?.seq;
  if (!Number.isSafeInteger(seq) || seq < 1) {
    throw errorRural(
      'Prohibit marcar ✓ sense un seq enter segur (>= 1) emès pel servidor.',
      'EVIDENCIA_SERVIDOR_SENSE_SEQ',
    );
  }

  const idServidor = typeof evidenciaServidor?.id === 'string' ? evidenciaServidor.id.trim().toLowerCase() : '';
  if (!idServidor) {
    throw errorRural(
      'Prohibit marcar ✓ sense l\'identificador confirmat pel servidor.',
      'EVIDENCIA_SERVIDOR_SENSE_ID',
    );
  }
  if (idServidor !== registre.client_msg_id) {
    throw errorRural(
      'L\'identificador retornat pel servidor no coincideix amb client_msg_id.',
      'ID_SERVIDOR_DIVERGENT',
    );
  }

  const progresActual = ORDRE_PROGRES_CONFIRMAT[registre.estat] ?? 0;
  const estatDesti = progresActual > ORDRE_PROGRES_CONFIRMAT[ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR]
    ? registre.estat
    : ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR;

  return clonaICongela({
    ...registre,
    estat: estatDesti,
    seq,
    servidorId: idServidor,
    properReintentMs: null,
    ultimError: null,
    confirmatServidorEl: registre.confirmatServidorEl
      || evidenciaServidor.creatEl
      || new Date().toISOString(),
  });
}

/**
 * Marca una fallada de transport com a `error_reintentable` sense esborrar el
 * payload ni degradar un missatge que ja estiga confirmat pel servidor (`seq >= 1`).
 */
export function marcaErrorReintentable(
  registre,
  error,
  {
    araMs = Date.now(),
    opcionsBackoff = {},
  } = {},
) {
  if (!registre || typeof registre !== 'object') {
    throw errorRural('Cal un registre de missatge vàlid.', 'REGISTRE_INVALID');
  }
  // Si el servidor ja havia confirmat el missatge amb seq, mai el degradem a error local.
  if (
    Number.isSafeInteger(registre.seq)
    && registre.seq >= 1
    && ORDRE_PROGRES_CONFIRMAT[registre.estat] >= ORDRE_PROGRES_CONFIRMAT[ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR]
  ) {
    return registre;
  }

  const nousIntents = (Number(registre.intents) || 0) + 1;
  const retardMs = calculaRetardReintentRural(nousIntents - 1, opcionsBackoff);

  return clonaICongela({
    ...registre,
    estat: ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE,
    intents: nousIntents,
    properReintentMs: (Number(araMs) || Date.now()) + retardMs,
    ultimError: {
      missatge: String(error?.message || 'Error temporal de xarxa rural.'),
      codi: error?.codi ? String(error.codi) : null,
      status: Number.isFinite(Number(error?.status)) ? Number(error.status) : null,
    },
  });
}

/**
 * Reencua un missatge en `error_reintentable` cap a `cua_local` preservant
 * exactament el mateix `client_msg_id` i `payload` congelat.
 */
export function preparaReintentMissatge(registre) {
  if (!registre || typeof registre !== 'object') {
    throw errorRural('Cal un registre vàlid per a preparar el reintent.', 'REGISTRE_INVALID');
  }
  if (ORDRE_PROGRES_CONFIRMAT[registre.estat] >= ORDRE_PROGRES_CONFIRMAT[ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR]) {
    return registre;
  }
  return clonaICongela({
    ...registre,
    estat: ESTATS_MISSATGE_RURAL.CUA_LOCAL,
    properReintentMs: null,
  });
}

/**
 * Avança de forma monòtona a `entregat_destinatari` (`✓✓` gris) o
 * `llegit_destinatari` (`✓✓` blau) només si existeix cursor real del destinatari
 * i el missatge ja té `seq` confirmat pel servidor.
 */
export function aplicaCursorDestinatari(registre, evidencia = {}) {
  if (!registre || typeof registre !== 'object') {
    throw errorRural('Cal un registre de missatge vàlid.', 'REGISTRE_INVALID');
  }

  const font = typeof evidencia?.font === 'string' ? evidencia.font.trim().toLowerCase() : 'cursor_xat_membres';
  if (FONTS_EVIDENCIA_ESPURIES.has(font)) {
    throw errorRural(
      `Prohibit avançar a ✓✓ des d'una font no acreditada ("${font}").`,
      'EVIDENCIA_DESTINATARI_ESPURIA',
    );
  }

  if (!Number.isSafeInteger(registre.seq) || registre.seq < 1) {
    throw errorRural(
      'Prohibit marcar ✓✓ en un missatge que encara no té seq confirmat pel servidor.',
      'MISSATGE_SENSE_SEQ_PER_DOBLE_CHECK',
    );
  }

  // Si l'evidència porta l'usuari que emet el cursor i és el mateix autor, mai compta com a destinatari!
  if (
    evidencia.usuariCursorId
    && evidencia.autorUsuariId
    && String(evidencia.usuariCursorId) === String(evidencia.autorUsuariId)
  ) {
    return registre;
  }

  const rebutSeq = Number.isSafeInteger(evidencia.rebutPelsAltresFinsSeq)
    ? evidencia.rebutPelsAltresFinsSeq
    : null;
  const llegitSeq = Number.isSafeInteger(evidencia.llegitPelsAltresFinsSeq)
    ? evidencia.llegitPelsAltresFinsSeq
    : null;

  let nouEstat = registre.estat;
  let entregatEl = registre.entregatEl;
  let llegitEl = registre.llegitEl;
  const instantIso = evidencia.instantIso || new Date().toISOString();

  if (llegitSeq !== null && llegitSeq >= registre.seq) {
    nouEstat = ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI;
    entregatEl = entregatEl || instantIso;
    llegitEl = llegitEl || instantIso;
  } else if (rebutSeq !== null && rebutSeq >= registre.seq) {
    if (ORDRE_PROGRES_CONFIRMAT[registre.estat] < ORDRE_PROGRES_CONFIRMAT[ESTATS_MISSATGE_RURAL.ENTREGAT_DESTINATARI]) {
      nouEstat = ESTATS_MISSATGE_RURAL.ENTREGAT_DESTINATARI;
    }
    entregatEl = entregatEl || instantIso;
  }

  if (
    nouEstat === registre.estat
    && entregatEl === registre.entregatEl
    && llegitEl === registre.llegitEl
  ) {
    return registre;
  }

  return clonaICongela({
    ...registre,
    estat: nouEstat,
    entregatEl,
    llegitEl,
  });
}

/**
 * Crea un gestor de cua rural particionat per `ambit` (`backend::tenantId::usuariId::actorOrgId`),
 * amb persistència honesta (ex. adaptador IndexedDB) i protecció contra reenviaments
 * creuats entre comptes o entitats.
 */
export function creaCuaSincronitzacioRural({
  ambitInicial,
  adaptadorPersistencia = null,
  ara = () => Date.now(),
  opcionsBackoff = {},
} = {}) {
  let ambitActiu = ambitInicial ? String(ambitInicial) : null;
  // Mapa sense prototip: ambit -> Map(client_msg_id -> registre)
  const particions = Object.create(null);
  const empremtesPerAmbit = Object.create(null);
  const drenatgesEnVol = Object.create(null);

  function obteMapaAmbit(ambit) {
    if (!ambit || typeof ambit !== 'string' || ambit.split('::').length < 4) {
      throw errorRural('L\'àmbit actiu de la cua rural és invàlid o buit.', 'AMBIT_INVALID');
    }
    if (!Object.hasOwn(particions, ambit)) {
      particions[ambit] = new Map();
      empremtesPerAmbit[ambit] = Object.create(null);
    }
    return particions[ambit];
  }

  async function persisteixParticio(ambit) {
    if (!adaptadorPersistencia || typeof adaptadorPersistencia.desa !== 'function') {
      return { persistit: false, avis: 'SENSE_ADAPTADOR_PERSISTENT' };
    }
    const mapa = obteMapaAmbit(ambit);
    const pendents = [...mapa.values()].filter(
      (r) => r.estat === ESTATS_MISSATGE_RURAL.CUA_LOCAL || r.estat === ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE,
    );
    try {
      await adaptadorPersistencia.desa(ambit, pendents);
      return { persistit: true, avis: null };
    } catch (err) {
      const nomError = err?.name || err?.codi || 'ERROR_PERSISTENCIA_LOCAL';
      return { persistit: false, avis: String(nomError) };
    }
  }

  async function encua(entrada, { ambit = ambitActiu } = {}) {
    const mapa = obteMapaAmbit(ambit);
    const registreInicial = creaRegistreMissatgeRural({
      ambit,
      filId: entrada.filId,
      clientMsgId: entrada.client_msg_id || entrada.clientMsgId || entrada.id,
      text: entrada.text,
      tipus: entrada.tipus,
      respostaA: entrada.respostaA,
      metadades: entrada.metadades,
      persistitLocal: false,
      araMs: ara(),
    });

    // R25.2-X03: Prohibit reutilitzar el mateix client_msg_id en un altre fil dins del mateix àmbit
    const existentPerUuid = mapa.get(registreInicial.client_msg_id);
    if (existentPerUuid && existentPerUuid.filId.toLowerCase() !== registreInicial.filId.toLowerCase()) {
      throw errorRural(
        'No es pot reutilitzar el mateix client_msg_id en un altre fil de conversa.',
        'COLISIO_UUID_ENTRE_FILS',
      );
    }

    const clauEmpremta = `${registreInicial.filId.toLowerCase()}::${registreInicial.client_msg_id}`;
    const empremtaNova = empremtaPayload(registreInicial.filId, registreInicial.payload);
    const diccionariEmpremtes = empremtesPerAmbit[ambit];

    if (Object.hasOwn(diccionariEmpremtes, clauEmpremta)) {
      if (diccionariEmpremtes[clauEmpremta] !== empremtaNova) {
        throw errorRural(
          'Col·lisió d\'idempotència a la cua local: mateix client_msg_id amb payload diferent.',
          'COLISIO_PAYLOAD_IDEMPOTENT',
        );
      }
      return existentPerUuid || registreInicial;
    }

    diccionariEmpremtes[clauEmpremta] = empremtaNova;
    mapa.set(registreInicial.client_msg_id, registreInicial);

    const estatDisc = await persisteixParticio(ambit);
    const vigent = mapa.get(registreInicial.client_msg_id) || registreInicial;
    const registreActualitzat = clonaICongela({
      ...vigent,
      persistitLocal: estatDisc.persistit,
      avisPersistencia: estatDisc.avis,
    });
    mapa.set(registreActualitzat.client_msg_id, registreActualitzat);
    return registreActualitzat;
  }

  /* Rehidratació honesta (garantia 1) · El disc només guarda pendents (vegeu
     persisteixParticio): un registre desat en un estat confirmat, sense UUID
     canònic, sense fil o amb un payload d'un altre identificador no és de fiar i
     pintaria un ✓ sense seq del servidor. Es descarta; la resta torna a la cua
     amb el seu estat pendent. Un UUID que ja és d'un altre fil es queda amb el
     primer (R25.2-X03). */
  function registreDesatAdmes(cru, ambit) {
    if (!cru || typeof cru !== 'object' || cru.ambit !== ambit) return false;
    if (cru.estat !== ESTATS_MISSATGE_RURAL.CUA_LOCAL && cru.estat !== ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE) {
      return false;
    }
    const uuid = typeof cru.client_msg_id === 'string' ? cru.client_msg_id : '';
    if (!RE_UUID_CANONIC.test(uuid) || uuid !== uuid.toLowerCase()) return false;
    if (typeof cru.filId !== 'string' || !cru.filId.trim()) return false;
    const payload = cru.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
    return payload.id === uuid && payload.client_msg_id === uuid;
  }

  async function hidrataAmbit(ambit = ambitActiu) {
    const mapa = obteMapaAmbit(ambit);
    if (!adaptadorPersistencia || typeof adaptadorPersistencia.carrega !== 'function') {
      return [...mapa.values()];
    }
    const desats = await adaptadorPersistencia.carrega(ambit);
    if (!Array.isArray(desats)) return [...mapa.values()];
    if (particions[ambit] !== mapa) return llistaMissatges(ambit);

    for (const cru of desats) {
      if (!registreDesatAdmes(cru, ambit)) continue;
      if (!mapa.has(cru.client_msg_id)) {
        const reconstruit = clonaICongela({
          ...cru,
          seq: null,
          servidorId: null,
          persistitLocal: true,
        });
        mapa.set(reconstruit.client_msg_id, reconstruit);
        const clauEmpremta = `${String(reconstruit.filId || '').toLowerCase()}::${reconstruit.client_msg_id}`;
        empremtesPerAmbit[ambit][clauEmpremta] = empremtaPayload(reconstruit.filId, reconstruit.payload);
      }
    }
    return [...mapa.values()];
  }

  /* `seguiment` (només dins de drenaPendents): `comenca(id)` i `acaba(id)` al
     voltant de cada enviament, i `admet(registre)` per a les passades de més. */
  async function executaDrenatgeSerial(enviaFn, ambit, forca, mapa, seguiment = null) {
    /* Revisió R26 · La partició vigent és ESTE Map, no només la clau: eixir i
       tornar a entrar com la mateixa persona dona el mateix àmbit i una partició
       nova, i un drenatge vell que reprén després d'un transport penjat no hi
       pot escriure ni seguir enviant. */
    const particioVigent = () => ambitActiu === ambit && particions[ambit] === mapa;
    const admet = seguiment?.admet || null;
    const araActual = ara();
    const pendents = [...mapa.values()]
      .filter((r) => {
        if (admet && !admet(r)) return false;
        if (r.estat === ESTATS_MISSATGE_RURAL.CUA_LOCAL) return true;
        if (r.estat === ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE) {
          return forca || r.properReintentMs === null || r.properReintentMs <= araActual;
        }
        return false;
      })
      .sort((a, b) => a.creatLocalMs - b.creatLocalMs);

    /* Revisió R26, ronda 3 · Una passada de més sense res a provar no toca el
       disc (la primera, sí: és el comportament de sempre). */
    if (admet && pendents.length === 0) return [];

    const resultats = [];
    for (const item of pendents) {
      if (!particioVigent()) {
        break;
      }
      // R25.2-X04: Relectura vigent (CAS monòton) abans de tocar l'estat del registre
      const actualAbans = mapa.get(item.client_msg_id);
      if (!actualAbans) continue;
      if (
        ORDRE_PROGRES_CONFIRMAT[actualAbans.estat]
        >= ORDRE_PROGRES_CONFIRMAT[ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR]
      ) {
        continue;
      }

      const preparat = preparaReintentMissatge(actualAbans);
      mapa.set(preparat.client_msg_id, preparat);
      seguiment?.comenca(preparat.client_msg_id);
      try {
        let respostaServidor;
        try {
          respostaServidor = await enviaFn(preparat.filId, preparat.payload, { ambit });
        } finally {
          seguiment?.acaba(preparat.client_msg_id);
        }
        if (!particioVigent()) {
          break;
        }
        const vigentPost = mapa.get(preparat.client_msg_id) || preparat;
        const confirmat = confirmaEnviamentServidor(vigentPost, respostaServidor);
        mapa.set(confirmat.client_msg_id, confirmat);
        resultats.push({ ok: true, registre: confirmat });
      } catch (err) {
        if (!particioVigent()) {
          break;
        }
        const vigentPostError = mapa.get(preparat.client_msg_id) || preparat;
        const fallit = marcaErrorReintentable(vigentPostError, err, {
          araMs: ara(),
          opcionsBackoff,
        });
        mapa.set(fallit.client_msg_id, fallit);
        const jaEstavaConfirmat = ORDRE_PROGRES_CONFIRMAT[fallit.estat]
          >= ORDRE_PROGRES_CONFIRMAT[ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR];
        resultats.push(
          jaEstavaConfirmat
            ? { ok: true, registre: fallit }
            : { ok: false, registre: fallit, error: err },
        );
      }
    }

    if (particions[ambit] === mapa) {
      await persisteixParticio(ambit);
    }
    return resultats;
  }

  async function drenaPendents(enviaFn, { ambit = ambitActiu, forca = false } = {}) {
    if (typeof enviaFn !== 'function') {
      throw new TypeError('[estatSincronitzacioRural] Cal una funció enviaFn per a drenar la cua.');
    }
    if (ambit !== ambitActiu) {
      throw errorRural(
        'Prohibit drenar una partició de cua que no correspon a l\'àmbit actiu actual.',
        'DRENATGE_AMBIT_INACTIU',
      );
    }

    // R25.2-X04: Un únic drenatge en vol per partició (single-flight), lligat al
    // Map concret: el d'una partició ja purgada no frena ni allibera el de la nova.
    const mapa = obteMapaAmbit(ambit);
    const enVol = drenatgesEnVol[ambit];
    if (enVol && enVol.mapa === mapa) {
      /* Revisió R26, ronda 2 (R26-XAT-09, despertar perdut) · Qui arriba amb un
         drenatge en vol rep la MATEIXA promesa (single-flight), però la foto de
         pendents d'eixe drenatge pot ser d'abans del seu missatge. Es deixa
         l'encàrrec d'una passada més en acabar la vigent, amb l'enviaFn d'esta
         crida i forçada si qualsevol de les que han arribat ho ha demanat. Una
         passada no reenvia cap ACK (relectura CAS d'executaDrenatgeSerial).
         Ronda 3 · `marca` situa la petició respecte dels intents (vegeu més avall). */
      enVol.tornaADrenar = {
        enviaFn,
        forca: Boolean(forca) || Boolean(enVol.tornaADrenar?.forca),
        marca: ++enVol.rellotge,
      };
      return enVol.promesa;
    }

    /* Revisió R26, ronda 3 (microsonda V6) · Una enviaFn que demana ella mateixa
       un drenatge (forçat) i rebutja de seguida feia passades sense fi dins de
       la mateixa cua de microtasques i congelava el fil de la UI. Ara:
         · abans de cada passada de més es cedix una macrotasca (setTimeout 0);
         · una passada de més només torna a provar un missatge ja provat en este
           drenatge si la petició ha arribat DESPRÉS que acabara el seu últim
           intent (una petició feta mentre el seu enviament era en vol té per
           resposta eixe mateix intent), i cap missatge no es prova més de
           MAX_INTENTS_PER_DRENATGE vegades en un drenatge;
         · un missatge que no s'havia provat (encuat després de la foto, o en
           backoff i ara forçat) sí que entra;
         · una passada de més sense res a provar acaba el drenatge sense tocar el
           disc. Qui demane després en tindrà un de nou (l'entrada s'esborra en
           el mateix tic que la decisió de parar). */
    const entrada = { mapa, promesa: null, tornaADrenar: null, rellotge: 0 };
    const vigent = () => ambitActiu === ambit && particions[ambit] === mapa;
    drenatgesEnVol[ambit] = entrada;
    entrada.promesa = (async () => {
      try {
        await null;
        const resultats = [];
        /* client_msg_id -> { vegades, fi }: `fi` és la marca del rellotge de
           l'entrada quan ha acabat l'últim intent (null mentre és en vol). */
        const intents = new Map();
        let marcaPeticio = 0;
        const seguiment = {
          admet: null,
          comenca(id) {
            intents.set(id, { vegades: (intents.get(id)?.vegades || 0) + 1, fi: null });
          },
          acaba(id) {
            const fet = intents.get(id);
            if (fet && fet.fi === null) fet.fi = ++entrada.rellotge;
          },
        };
        const admetEnPassadaDeMes = (registre) => {
          const fet = intents.get(registre.client_msg_id);
          if (!fet) return true;
          return fet.fi !== null && fet.fi < marcaPeticio && fet.vegades < MAX_INTENTS_PER_DRENATGE;
        };
        let peticio = { enviaFn, forca: Boolean(forca) };
        for (;;) {
          /* Les demanades abans d'esta foto hi entren ja: no cal una passada buida. */
          const posterior = entrada.tornaADrenar;
          entrada.tornaADrenar = null;
          if (posterior) {
            peticio = { enviaFn: posterior.enviaFn, forca: Boolean(peticio?.forca) || posterior.forca };
            marcaPeticio = posterior.marca;
          }
          resultats.push(...await executaDrenatgeSerial(peticio.enviaFn, ambit, peticio.forca, mapa, seguiment));
          peticio = null;
          if (!entrada.tornaADrenar || !vigent()) break;
          await cedeixElFil();
          if (!vigent()) break;
          seguiment.admet = admetEnPassadaDeMes;
        }
        return resultats;
      } finally {
        /* En el mateix tic que la decisió de parar: cap crida no pot quedar
           penjada d'una entrada que ja no farà cap passada més. */
        if (drenatgesEnVol[ambit] === entrada) delete drenatgesEnVol[ambit];
      }
    })();
    return entrada.promesa;
  }

  function actualitzaCursorFil(filId, evidencia, { ambit = ambitActiu } = {}) {
    const mapa = obteMapaAmbit(ambit);
    const filNet = String(filId || '').trim();
    const actualitzats = [];
    for (const [id, reg] of mapa.entries()) {
      if (reg.filId !== filNet) continue;
      if (reg.seq === null) continue;
      const nou = aplicaCursorDestinatari(reg, evidencia);
      if (nou !== reg) {
        mapa.set(id, nou);
        actualitzats.push(nou);
      }
    }
    return actualitzats;
  }

  function canviaAmbitActiu(nouAmbit) {
    ambitActiu = nouAmbit ? String(nouAmbit) : null;
    if (ambitActiu) obteMapaAmbit(ambitActiu);
    return ambitActiu;
  }

  async function purgaAmbit(ambit) {
    // Desactiva l’àmbit que ix abans d’esperar el disc. Una entrada nova amb
    // la mateixa clau durant l’espera ja pertany a una altra partició viva.
    if (ambitActiu === ambit) {
      ambitActiu = null;
    }
    if (Object.hasOwn(particions, ambit)) {
      particions[ambit].clear();
      delete particions[ambit];
      delete empremtesPerAmbit[ambit];
    }
    if (adaptadorPersistencia && typeof adaptadorPersistencia.esborra === 'function') {
      await adaptadorPersistencia.esborra(ambit);
    }
  }

  function llistaMissatges(ambit = ambitActiu) {
    if (!ambit || !Object.hasOwn(particions, ambit)) return [];
    return [...particions[ambit].values()].sort((a, b) => a.creatLocalMs - b.creatLocalMs);
  }

  function comptaPendents(ambit = ambitActiu) {
    return llistaMissatges(ambit).filter(
      (r) => r.estat === ESTATS_MISSATGE_RURAL.CUA_LOCAL || r.estat === ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE,
    ).length;
  }

  return Object.freeze({
    encua,
    hidrataAmbit,
    drenaPendents,
    actualitzaCursorFil,
    canviaAmbitActiu,
    purgaAmbit,
    llistaMissatges,
    comptaPendents,
    obteAmbitActiu: () => ambitActiu,
  });
}
