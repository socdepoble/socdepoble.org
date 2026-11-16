import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { getEfimer } from '../../config/storage.js';
import {
  enviaMissatge as enviaMissatgePort,
  refrescaSessio as refrescaSessioPort,
} from '../backendPort.js';
import {
  CLAU_BACKEND,
  CLAU_USUARI,
  entradaSessio,
  esBackendDeSessio,
  identitat,
} from '../identitat.js';

/**
 * serveiXat.js — Servei d'enviament idempotent de missatges de `/xat` amb
 * renovació única de JWT en vol (`P1-XAT-04` + blindatge `R25.2-X01/X02`).
 *
 * Resol `CODEX-R24-D1-03`, `CODEX-R24-D1-05`, `R25.2-X01` i `R25.2-X02` sense acoplar la UI:
 *   1. Normalitza i congela el payload abans del primer intent amb un únic UUID
 *      canònic (`id` === `client_msg_id`, mapejat a `p_id` per `xat_envia`).
 *   2. Rebutja qualsevol reutilització del mateix `client_msg_id` per la mateixa
 *      persona i backend amb contingut o fil diferent (`COLISIO_PAYLOAD_IDEMPOTENT`):
 *      `p_id` és global al servidor (`first-write-wins` en el mateix fil,
 *      `SDP-XAT-008` en un altre). Als fils E2EE, el mateix `p_id` només és
 *      idempotent amb el MATEIX sobre: `xat_envia_xifrat` compara `xifrat` i la
 *      gènesi (`2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql`) i el transport
 *      decorat (`xifratXat.js` · `motor.prepara`) torna a xifrar a cada crida
 *      (`nf` i `iv` nous). Per això el servei només reenvia després d'un 401
 *      (PostgREST rebutja el JWT abans d'executar res: no s'ha desat res).
 *   3. Detecta `401 / PGRST301 / JWT expired / SESSIO_CADUCADA` (excloent `403`,
 *      `42501` i `SDP-XAT-*`), també en la forma normalitzada del port
 *      (`supabase/xat.js` · `errorDeXat`: `code` + `cause`), deduplica
 *      `refreshSession(config)` en vol per llinatge i verifica el llinatge estricte
 *      `(backend, tenantId, usuariId, actorOrgId, generacioLogin)` abans de cada
 *      intent, abans del reintent i abans d'entregar la resposta.
 *
 * Revisió R26 (Claude, contrast amb el contracte real de la sessió):
 *   · El llinatge es llig SEMPRE en viu. L'abast és `backendScope(config)` de la
 *     MATEIXA config amb què viatja el transport (no una config per defecte amb
 *     sentinelles), l'usuari és el blob desat de la sessió d'eixe backend (com
 *     `actorDesat` de `supabase/runtime.js`: amb el JWT caducat, el motiu del 401,
 *     `usuariDeSessio()` ja torna null i la renovació legítima no passaria), i la
 *     generació és `entradaSessio()` (una renovació no la mou; eixir o tornar a
 *     entrar, inclús amb el mateix UUID, sí). Cap opció de la crida pot fixar
 *     usuari, generació o abast: una foto comparada amb ella mateixa no detecta res.
 *   · L'actor (l'entitat amb què actua la barra negra) no viu a la sessió: només
 *     una font viva (`obteActorOrgId`) el pot dir. Declarar `comOrgId` sense font
 *     viva es rebutja (`ACTOR_SENSE_FONT_VIVA`).
 *   · Cada intent té un `AbortSignal` propi, encadenat a l'operació i, si la crida
 *     dona `obteSenyalIntent`, vigilat pel senyal VIU del relleu de la UI per a
 *     eixe intent (una renovació que avorta l'operació vella no mata el reintent;
 *     un relleu nul o ja avortat el cancel·la de manera definitiva i mai no es
 *     recicla). Ronda 3: el transport penja de l'operació, i el relleu el talla
 *     només a través d'una decisió definitiva (vegeu més avall).
 *
 * Revisió R26, ronda 2 (microsondes S1a/S1b/S1c del verificador), esmenada a
 * la ronda 3 (microsondes V1 i V2):
 *   · XatContext rota la seua operació a CADA renovació (`scopeKey` porta
 *     `generacio`), també una d'aliena o una que arriba quan el reintent ja ha
 *     eixit. Si el senyal del relleu cau amb el transport en vol, l'operació
 *     del servei viva, el llinatge intact i una font VIVA de l'actor
 *     (`obteActorOrgId`), és una rotació i no una cancel·lació: el servei torna
 *     a demanar `obteSenyalIntent` per al MATEIX intent i SEGUEIX el relleu
 *     sense tallar el transport, com a màxim `MAX_SALTS_RELLEU` vegades per
 *     enviament (`SALTS_RELLEU_ESGOTATS`). Mai no reenvia: el primer intent ja
 *     pot haver-se desat i, en un fil E2EE, un sobre nou per al mateix `p_id`
 *     seria `SDP-XAT-008` (vegeu el punt 2). La resposta s'entrega quan el
 *     relleu ja ha decidit.
 *   · Sense font viva de l'actor, el servei no distingix una rotació d'un canvi
 *     d'actor amb un relleu ingenu (el que torna l'operació viva ara mateix,
 *     siga de l'àmbit que siga): un senyal del relleu que cau amb el transport
 *     en vol és definitiu (`OPERACIO_CANCELADA` · `SENYAL_INTENT_AVORTAT`), com
 *     a la ronda 1. Mai no reenvia ni resol amb l'àmbit vell.
 *   · Són definitius, a més: un relleu null (`RELLEU_NUL`), un senyal ja avortat
 *     (`SENYAL_AVORTAT`), una excepció del relleu (`RELLEU_FALLIT`) i un
 *     llinatge que ja no casa (`SESSIO_CANVIADA`).
 *   · Contracte del cablejat: la font de l'actor s'actualitza en pintar (abans
 *     que la neteja de l'efecte avorte l'operació vella), mai en un efecte
 *     posterior; una funció constant no és una font viva. Entre dos intents
 *     (durant el refresc) no hi ha transport en vol: l'intent 1 demana el relleu
 *     de nou i el servei confia que torne null si l'àmbit ha canviat.
 *   · Qui talla què (sense promeses que cap avís no complix):
 *       - eixir, entrar o canviar de backend: `revalidaEnVol()`, que el servei
 *         crida sol amb l'avís `sdp:auth-change` mentre hi ha operacions en vol;
 *       - canviar d'actor: cap avís de l'app no ho diu (`IdentitatContext.setActor`
 *         no emet res). El talla el senyal del relleu (XatContext avorta
 *         l'operació en canviar l'àmbit i, amb `obteActorOrgId`, el llinatge ja no
 *         casa) o una crida explícita del cablejat a `revalidaEnVol()` o
 *         `cancelaTot()`. Sense cap d'eixos, només ho veu la comprovació de després
 *         de la resposta, i un transport penjat continua penjat;
 *       - desmuntar: `tanca()`.
 *   · Una renovació fallida amb UNA ALTRA sessió viva al lloc de la d'origen és
 *     `SESSIO_CANVIADA`; sense cap sessió continua sent `SESSIO_CADUCADA`
 *     (`refreshFallit`): `auth.js` (renova, 400/401) tanca la pestanya ell mateix
 *     quan el refresh token ja no val, i eixe estat és indistingible d'una eixida
 *     coincident.
 *   · En llavor/local, el convidat d'`identitat()` és la persona local, com el
 *     `joId` de XatContext (`getDefaultUserId()` fora del mode remot): pot enviar.
 *     En remot, sense el blob de la sessió del backend, mai.
 */

const RE_UUID_CANONIC = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_MISSATGE_JWT_CADUCAT = /\b(?:jwt\s+expired|jwt\s+is\s+expired|token\s+is\s+expired|invalid\s+jwt|expired\s+token)\b/i;
const CODIS_POSTGREST_JWT = new Set(['PGRST301', 'PGRST302']);
const LIMIT_EMPREMTES_MEMORIA = 512;
/* Rotacions de l'operació de la UI que un enviament segueix amb el transport en
   vol (les renovacions d'un reintent i una d'aliena), sumades entre els dos
   intents: com el bucle de relleu del pegat p1_xat_04. */
const MAX_SALTS_RELLEU = 2;

function generaUuidPerDefecte() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID().toLowerCase();
  }
  throw new Error('[serveiXat] Cal crypto.randomUUID o un generador injectat per a client_msg_id.');
}

function clonaProfundCongelat(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) {
    return Object.freeze(valor.map((element) => clonaProfundCongelat(element)));
  }
  const copia = Object.create(null);
  for (const clau of Object.keys(valor).sort()) {
    const v = valor[clau];
    if (v !== undefined) {
      copia[clau] = clonaProfundCongelat(v);
    }
  }
  const pla = {};
  for (const clau of Object.keys(copia)) {
    pla[clau] = copia[clau];
  }
  return Object.freeze(pla);
}

function serialitzaDeterminista(valor) {
  if (valor === null || valor === undefined) return 'null';
  if (typeof valor !== 'object') return JSON.stringify(valor);
  if (Array.isArray(valor)) {
    return `[${valor.map((item) => serialitzaDeterminista(item)).join(',')}]`;
  }
  const claus = Object.keys(valor)
    .filter((clau) => valor[clau] !== undefined)
    .sort();
  return `{${claus.map((clau) => `${JSON.stringify(clau)}:${serialitzaDeterminista(valor[clau])}`).join(',')}}`;
}

function creaErrorXat(missatge, extres = {}) {
  const err = new Error(missatge);
  return Object.assign(err, extres);
}

function textErrorCombinat(error) {
  if (!error || typeof error !== 'object') return String(error ?? '');
  return [error.message, error.details, error.hint, error.error_description, error.error]
    .filter((fragment) => typeof fragment === 'string' && fragment.trim().length > 0)
    .join(' | ');
}

/* Vocabulari neutral del port (`supabase/xat.js` · `errorDeXat`): `SESSIO_CADUCADA`
   quan PostgREST ha rebutjat el JWT, `SESSIO` quan el JWT ja no valia abans d'eixir
   (usuariDeSessio() torna null). Les dues només es renoven darrere de la guarda de
   llinatge: si qui ha eixit és la persona, el blob desat ja no hi és. */
const CODIS_PORT_SESSIO_RENOVABLE = new Set(['SESSIO_CADUCADA', 'SESSIO']);
const CODIS_TERMINALS = new Set([
  'SENSE_PERMIS', 'SESSIO_CANVIADA', 'COLISIO_PAYLOAD_IDEMPOTENT', 'OPERACIO_CANCELADA', 'SERVEI_TANCAT',
]);

function majuscules(valor) {
  return typeof valor === 'string' ? valor.trim().toUpperCase() : '';
}

function esExclosDeRenovacio(error) {
  if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
  const status = Number(error.status ?? error.statusCode ?? 0);
  const code = majuscules(error.code);
  const codi = majuscules(error.codi);
  return status === 403
    || code === '42501'
    || CODIS_TERMINALS.has(code)
    || CODIS_TERMINALS.has(codi)
    || code === 'ABORTERROR'
    || code === 'TIMEOUTERROR'
    || code.startsWith('SDP-XAT-')
    || codi.startsWith('SDP-XAT-');
}

function senyalaRenovacio(error) {
  const status = Number(error.status ?? error.statusCode ?? 0);
  const code = majuscules(error.code);
  const codi = majuscules(error.codi);
  if (status === 401 || codi === 'SESSIO_CADUCADA' || CODIS_POSTGREST_JWT.has(code)
    || CODIS_PORT_SESSIO_RENOVABLE.has(code)) {
    return true;
  }
  return RE_MISSATGE_JWT_CADUCAT.test(textErrorCombinat(error));
}

/**
 * Determina de forma determinista si un error d'enviament correspon a una
 * sessió/JWT caducat renovable, excloent explícitament errors de permisos (`403`,
 * `42501`, `SENSE_PERMIS`), validació de domini (`SDP-XAT-*`) i cancel·lacions.
 * Mira també `cause` (un nivell): el port normalitza l'error i hi deixa la
 * resposta crua; una exclusió a qualsevol dels dos nivells mana.
 */
export function esErrorJwtCaducat(error) {
  if (!error || typeof error !== 'object') return false;
  const causa = error.cause && typeof error.cause === 'object' ? error.cause : null;
  if (esExclosDeRenovacio(error) || (causa && esExclosDeRenovacio(causa))) return false;
  return senyalaRenovacio(error) || Boolean(causa && senyalaRenovacio(causa));
}

/**
 * Normalitza i congela la càrrega útil d'eixida garantint que `id` i
 * `client_msg_id` siguen exactament el mateix UUID v4 en minúscules.
 */
export function normalitzaMissatgeSortida(entrada, { generaUuid = generaUuidPerDefecte } = {}) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw creaErrorXat('Cal un objecte de missatge vàlid per a enviar al xat.', {
      codi: 'ENTRADA_INVALIDA',
      retriable: false,
    });
  }

  const idCru = typeof entrada.id === 'string' && entrada.id.trim() ? entrada.id.trim() : null;
  const clientIdCru = typeof entrada.client_msg_id === 'string' && entrada.client_msg_id.trim()
    ? entrada.client_msg_id.trim()
    : (typeof entrada.clientMsgId === 'string' && entrada.clientMsgId.trim() ? entrada.clientMsgId.trim() : null);

  if (idCru && !RE_UUID_CANONIC.test(idCru)) {
    throw creaErrorXat('L\'identificador del missatge (id) ha de ser un UUID vàlid.', {
      codi: 'ID_CLIENT_INVALID',
      retriable: false,
    });
  }
  if (clientIdCru && !RE_UUID_CANONIC.test(clientIdCru)) {
    throw creaErrorXat('L\'identificador idempotent (client_msg_id) ha de ser un UUID vàlid.', {
      codi: 'ID_CLIENT_INVALID',
      retriable: false,
    });
  }

  const idNormalitzat = idCru ? idCru.toLowerCase() : null;
  const clientNormalitzat = clientIdCru ? clientIdCru.toLowerCase() : null;

  if (idNormalitzat && clientNormalitzat && idNormalitzat !== clientNormalitzat) {
    throw creaErrorXat('id i client_msg_id han de coincidir exactament en el mateix enviament.', {
      codi: 'ID_CLIENT_INCOHERENT',
      retriable: false,
    });
  }

  const uuidCanonic = idNormalitzat || clientNormalitzat || String(generaUuid()).trim().toLowerCase();
  if (!RE_UUID_CANONIC.test(uuidCanonic)) {
    throw creaErrorXat('El generador d\'UUID ha retornat un client_msg_id invàlid.', {
      codi: 'ID_CLIENT_INVALID',
      retriable: false,
    });
  }

  const text = typeof entrada.text === 'string' ? entrada.text : '';
  const tipus = typeof entrada.tipus === 'string' && entrada.tipus.trim()
    ? entrada.tipus.trim()
    : 'text';
  const respostaA = typeof entrada.respostaA === 'string' && entrada.respostaA.trim()
    ? entrada.respostaA.trim().toLowerCase()
    : null;
  const metadades = entrada.metadades && typeof entrada.metadades === 'object' && !Array.isArray(entrada.metadades)
    ? clonaProfundCongelat(entrada.metadades)
    : Object.freeze({});

  const base = {
    id: uuidCanonic,
    client_msg_id: uuidCanonic,
    text,
    tipus,
    respostaA,
    metadades,
  };

  if (entrada.xifrat !== undefined) {
    base.xifrat = clonaProfundCongelat(entrada.xifrat);
  }
  if (entrada.epoca !== undefined && entrada.epoca !== null) {
    base.epoca = entrada.epoca;
  }

  return Object.freeze(base);
}

function empremtaPayloadCanonic(filId, payload) {
  return serialitzaDeterminista({
    filId: String(filId || '').trim().toLowerCase(),
    id: payload.id,
    text: payload.text,
    tipus: payload.tipus,
    respostaA: payload.respostaA,
    metadades: payload.metadades,
    xifrat: payload.xifrat ?? null,
    epoca: payload.epoca ?? null,
  });
}

/**
 * R25.2-X01 (revisió R26) · El context VIU de la sessió per a la config amb què
 * viatja el transport. No llança: un abast invàlid torna `backend: null`, que mai
 * no casa amb res (cap sentinella compartida entre dues lectures).
 *   · `backend`: `backendScope(config)`, la mateixa clau que XatContext
 *     (`scopeKey`) i que `identitat.js` (`configuraBackendSessio`).
 *   · `usuariId`: en remot, el blob desat de la sessió d'ESTE backend
 *     (`esBackendDeSessio` + `CLAU_BACKEND`, les guardes de `jwtPerBackend`),
 *     llegit com `actorDesat` de `supabase/runtime.js`. Eixir l'esborra.
 *     En llavor/local no hi ha JWT: la persona local o el convidat d'`identitat()`
 *     (decisió declarada a la capçalera: és el `joId` de XatContext en eixos
 *     modes). `autenticat` vol dir ací «té una identitat d'enviament per al mode».
 *   · `generacioLogin`: `entradaSessio()`.
 *   · `actorOrgId`: només d'una font viva (`obteActorOrgId`), o null (persona).
 */
function obteContextSessioPerDefecte(config = {}, { obteActorOrgId = null } = {}) {
  let backend = null;
  let tenantId = null;
  let remot = true;
  try {
    const cfg = normalizeBackendConfig(config);
    backend = backendScope(config);
    tenantId = cfg.tenantId ?? null;
    remot = cfg.dataMode === 'remote';
  } catch {
    backend = null;
  }

  let usuariId = null;
  if (backend) {
    if (remot) {
      const delBackend = esBackendDeSessio(config) && getEfimer(CLAU_BACKEND, null) === backend;
      const blob = delBackend ? getEfimer(CLAU_USUARI, null) : null;
      usuariId = blob && blob.id != null ? String(blob.id) : null;
    } else {
      const local = identitat();
      usuariId = local?.id ? String(local.id) : null;
    }
  }

  const actor = typeof obteActorOrgId === 'function' ? obteActorOrgId() : null;
  return {
    backend,
    tenantId,
    usuariId,
    actorOrgId: actor !== undefined && actor !== null && String(actor).trim() ? String(actor).trim() : null,
    autenticat: Boolean(usuariId),
    generacioLogin: entradaSessio(),
  };
}

function normalitzaContextSessio(cru = {}) {
  const gen = cru?.generacioLogin !== undefined
    ? Number(cru.generacioLogin)
    : (cru?.epoca !== undefined ? Number(cru.epoca) : 0);
  const actorCru = cru?.actorOrgId !== undefined ? cru.actorOrgId : cru?.comOrgId;
  const backend = typeof cru?.backend === 'string' && cru.backend.trim() ? cru.backend.trim() : null;
  const tenantCru = cru?.tenantId;
  return Object.freeze({
    backend,
    tenantId: tenantCru === undefined || tenantCru === null ? null : (String(tenantCru).trim() || null),
    usuariId: cru?.usuariId ? String(cru.usuariId).trim() : null,
    actorOrgId: actorCru ? String(actorCru).trim() : null,
    generacioLogin: Number.isFinite(gen) ? gen : 0,
    autenticat: cru?.autenticat !== false && Boolean(cru?.usuariId),
  });
}

function clauLlinatge(ctx) {
  return `${ctx.backend}::${ctx.tenantId ?? 'sense-tenant'}::${ctx.usuariId ?? 'anon'}::${ctx.actorOrgId ?? 'personal'}::gen:${ctx.generacioLogin}`;
}

function mateixLlinatgeActiu(origen, actual) {
  if (!origen.usuariId || !actual.usuariId || !actual.autenticat) return false;
  if (!origen.backend || !actual.backend) return false;
  return (
    origen.backend === actual.backend
    && origen.tenantId === actual.tenantId
    && origen.usuariId === actual.usuariId
    && origen.actorOrgId === actual.actorOrgId
    && origen.generacioLogin === actual.generacioLogin
  );
}

function refrescHaReeixit(resultat) {
  if (resultat === false || resultat === null || resultat === undefined) return false;
  if (typeof resultat === 'boolean') return resultat;
  if (typeof resultat === 'object') {
    if (resultat.ok === false || resultat.error) return false;
    if (resultat.session === null && resultat.access_token === undefined && resultat.ok !== true) {
      return false;
    }
    return true;
  }
  return Boolean(resultat);
}

const esSenyal = (valor) => Boolean(valor)
  && typeof valor === 'object'
  && typeof valor.aborted === 'boolean'
  && typeof valor.addEventListener === 'function'
  && typeof valor.removeEventListener === 'function';

/* Un controlador nou per intent, avortat quan qualsevol dels pares s'avorta. No
   es recicla mai: el pare avortat abans d'hora l'avorta de naixement. */
function creaControlIntent(pares) {
  const control = new AbortController();
  const vius = pares.filter(esSenyal);
  const avorta = (pare) => () => {
    if (!control.signal.aborted) {
      control.abort(pare.reason ?? new DOMException('Operació cancel·lada.', 'AbortError'));
    }
  };
  const gestors = vius.map((pare) => {
    const gestor = avorta(pare);
    if (pare.aborted) gestor();
    else pare.addEventListener('abort', gestor, { once: true });
    return [pare, gestor];
  });
  return {
    signal: control.signal,
    neteja() {
      for (const [pare, gestor] of gestors) pare.removeEventListener('abort', gestor);
    },
  };
}

/* La promesa del transport, tallada quan `senyal` (el de l'operació) s'avorta:
   una cancel·lació definitiva no espera que el transport respecte l'abort. La
   resposta tardana s'ignora (i el seu rebuig es consumix: cap rebuig sense
   gestor). */
function tallaAmbSenyal(promesa, senyal) {
  return new Promise((resol, rebutja) => {
    const enAvortar = () => rebutja(senyal.reason ?? new DOMException('Operació cancel·lada.', 'AbortError'));
    if (senyal.aborted) enAvortar();
    else senyal.addEventListener('abort', enAvortar, { once: true });
    Promise.resolve(promesa).then(
      (valor) => { senyal.removeEventListener('abort', enAvortar); resol(valor); },
      (err) => { senyal.removeEventListener('abort', enAvortar); rebutja(err); },
    );
  });
}

/* Opcions de la crida que són del servei i no de la config del transport. */
const CLAUS_DEL_SERVEI = Object.freeze(['signal', 'obteSenyalIntent', 'obteActorOrgId', 'actorOrgId', 'comOrgId']);
/* Claus que fixarien el llinatge: es llig en viu, mai d'una foto de la crida. */
const CLAUS_DE_LLINATGE_PROHIBIDES = Object.freeze(['usuariId', 'generacioLogin', 'backendScope', 'epoca']);

/* Mentre hi ha operacions en vol: l'avís d'identitat de l'app (eixida, entrada,
   renovació, canvi de backend) fa revalidar-les. Sense finestra, cap escolta. */
function escoltaCanvisSessioPerDefecte(avisa) {
  const finestra = globalThis.window;
  if (!finestra || typeof finestra.addEventListener !== 'function') return () => {};
  const gestor = () => avisa();
  finestra.addEventListener('sdp:auth-change', gestor);
  return () => finestra.removeEventListener('sdp:auth-change', gestor);
}

/**
 * Construeix una instància aïllada del servei d'enviament de xat amb deduplicació
 * de `refreshSession()` en vol i protecció d'idempotència per `client_msg_id`.
 *
 * Opcions d'instància:
 *   · `obteContextSessio(config, { obteActorOrgId })` → context viu (per defecte,
 *     el de `identitat.js` per a la config del transport).
 *   · `obteActorOrgId()` → l'entitat activa ara mateix, o null (persona).
 *   · `escoltaCanvisSessio(avisa) → desubscriu`, o null per a no escoltar res.
 *
 * Opcions de cada crida (la resta és la config del transport, tal qual):
 *   · `signal`: cancel·lació definitiva de tota l'operació.
 *   · `obteSenyalIntent({ intent, salt })` (síncrona o asíncrona): el senyal de
 *     l'operació de la UI que rebrà la resposta, del MATEIX àmbit: la vigent si
 *     encara és viva o, si ja està avortada, la que l'ha rellevada per
 *     renovacions. No ha d'esperar cap rotació futura (S1c). null si la cadena
 *     acaba en canvi d'àmbit o desmuntatge. `salt` és local de l'intent: 0 en
 *     la primera crida de cada intent (també la de l'intent 1) i 1, 2 quan el
 *     servei la torna a cridar perquè el senyal tornat ha caigut amb el
 *     transport en vol; el sostre `MAX_SALTS_RELLEU` és de l'enviament sencer.
 *     Eixa segona crida només es fa amb una font viva de l'actor; sense, la
 *     caiguda és definitiva. El servei mai no reenvia per un salt: segueix el
 *     relleu i el transport en vol continua. null, un senyal ja avortat o una
 *     excepció cancel·len definitivament.
 *   · `obteActorOrgId()`: font viva de l'actor per a esta crida.
 *   · `comOrgId` / `actorOrgId`: l'actor que la crida espera; cal una font viva.
 */
export function creaServeiXat({
  enviaMissatge = enviaMissatgePort,
  refreshSession = (...args) => refrescaSessioPort(...args),
  obteContextSessio = obteContextSessioPerDefecte,
  obteActorOrgId = null,
  escoltaCanvisSessio = escoltaCanvisSessioPerDefecte,
  generaUuid = generaUuidPerDefecte,
} = {}) {
  if (typeof enviaMissatge !== 'function') {
    throw new TypeError('[serveiXat] Cal proporcionar una funció enviaMissatge.');
  }
  if (typeof refreshSession !== 'function') {
    throw new TypeError('[serveiXat] Cal proporcionar una funció refreshSession.');
  }
  if (typeof obteContextSessio !== 'function') {
    throw new TypeError('[serveiXat] Cal proporcionar una funció obteContextSessio.');
  }
  if (obteActorOrgId !== null && typeof obteActorOrgId !== 'function') {
    throw new TypeError('[serveiXat] obteActorOrgId ha de ser una funció o null.');
  }

  const refrescosEnVol = Object.create(null);
  const empremtesEnviades = Object.create(null);
  const ordreEmpremtes = [];
  const operacionsEnVol = new Set();
  let motiuTancament = null;
  let desubscriu = null;

  function registraOVerificaEmpremta(clauIdempotencia, empremta) {
    if (Object.hasOwn(empremtesEnviades, clauIdempotencia)) {
      if (empremtesEnviades[clauIdempotencia] !== empremta) {
        throw creaErrorXat(
          'No es pot reutilitzar el mateix client_msg_id amb un contingut o destinatari diferent.',
          {
            codi: 'COLISIO_PAYLOAD_IDEMPOTENT',
            retriable: false,
          },
        );
      }
      return;
    }
    empremtesEnviades[clauIdempotencia] = empremta;
    ordreEmpremtes.push(clauIdempotencia);
    if (ordreEmpremtes.length > LIMIT_EMPREMTES_MEMORIA) {
      const mesAntiga = ordreEmpremtes.shift();
      if (mesAntiga) delete empremtesEnviades[mesAntiga];
    }
  }

  function executaRefrescDeduplicat(clauAmbit, configRefresc) {
    if (Object.hasOwn(refrescosEnVol, clauAmbit)) {
      return refrescosEnVol[clauAmbit];
    }
    let inici;
    try {
      inici = Promise.resolve(refreshSession(configRefresc));
    } catch (errSincron) {
      inici = Promise.reject(errSincron);
    }
    const promesa = inici.finally(() => {
      delete refrescosEnVol[clauAmbit];
    });
    refrescosEnVol[clauAmbit] = promesa;
    return promesa;
  }

  function llegixContextViu(op) {
    const fontActor = op.obteActorOrgId || obteActorOrgId;
    const ctx = normalitzaContextSessio(obteContextSessio(op.config, { obteActorOrgId: fontActor }));
    if (!fontActor) return ctx;
    const actor = fontActor();
    return Object.freeze({
      ...ctx,
      actorOrgId: actor !== undefined && actor !== null && String(actor).trim() ? String(actor).trim() : null,
    });
  }

  function errorSessioCanviada(cause) {
    return creaErrorXat(
      'La identitat, l\'actor o la generació de login de la sessió ha canviat; enviament avortat.',
      {
        codi: 'SESSIO_CANVIADA',
        retriable: false,
        definitiu: true,
        ...(cause ? { cause } : {}),
      },
    );
  }

  function cancelaDefinitivament(op, codi, motiu, cause) {
    const err = creaErrorXat(
      codi === 'SERVEI_TANCAT'
        ? 'El servei del xat s\'ha tancat; l\'enviament no continua.'
        : 'L\'enviament s\'ha cancel·lat de manera definitiva.',
      {
        codi,
        motiu,
        retriable: false,
        definitiu: true,
        ...(cause !== undefined ? { cause } : {}),
      },
    );
    if (!op.control.signal.aborted) op.control.abort(err);
    return op.control.signal.reason ?? err;
  }

  function asseguraOperacioViva(op) {
    if (op.control.signal.aborted) {
      throw op.control.signal.reason ?? new DOMException('Operació cancel·lada.', 'AbortError');
    }
  }

  function asseguraLlinatgeVigent(op, cause = undefined) {
    let viu = false;
    let errLectura;
    try {
      viu = mateixLlinatgeActiu(op.contextOrigen, llegixContextViu(op));
    } catch (err) {
      errLectura = err;
    }
    if (!viu) {
      const err = errorSessioCanviada(cause ?? errLectura);
      if (!op.control.signal.aborted) op.control.abort(err);
      throw op.control.signal.reason ?? err;
    }
  }

  function revalidaEnVol() {
    for (const op of [...operacionsEnVol]) {
      if (op.control.signal.aborted) continue;
      try {
        asseguraLlinatgeVigent(op);
      } catch {
        // asseguraLlinatgeVigent ja ha avortat l'operació amb SESSIO_CANVIADA.
      }
    }
  }

  function registraOperacio(op) {
    operacionsEnVol.add(op);
    if (!desubscriu && typeof escoltaCanvisSessio === 'function') {
      desubscriu = escoltaCanvisSessio(revalidaEnVol) || null;
    }
  }

  function retiraOperacio(op) {
    operacionsEnVol.delete(op);
    op.desenganxaSenyal?.();
    if (operacionsEnVol.size === 0 && desubscriu) {
      const fi = desubscriu;
      desubscriu = null;
      fi();
    }
  }

  async function obteSenyalPerIntent(op, numIntent, saltIntent) {
    let senyal;
    try {
      senyal = await op.obteSenyalIntent({ intent: numIntent, salt: saltIntent });
    } catch (err) {
      throw cancelaDefinitivament(op, 'OPERACIO_CANCELADA', 'RELLEU_FALLIT', err);
    }
    asseguraOperacioViva(op);
    if (senyal === null || senyal === undefined) {
      throw cancelaDefinitivament(op, 'OPERACIO_CANCELADA', 'RELLEU_NUL');
    }
    if (!esSenyal(senyal)) {
      throw cancelaDefinitivament(op, 'OPERACIO_CANCELADA', 'SENYAL_INVALID');
    }
    if (senyal.aborted) {
      throw cancelaDefinitivament(op, 'OPERACIO_CANCELADA', 'SENYAL_AVORTAT', senyal.reason);
    }
    return senyal;
  }

  /* Revisió R26, ronda 3 · Només una font VIVA de l'actor deixa distingir una
     rotació de la UI (renovació, mateix àmbit) d'un canvi d'actor quan el
     relleu és ingenu. Sense, el servei no la suposa. */
  function teFontVivaDeLActor(op) {
    return Boolean(op.obteActorOrgId || obteActorOrgId);
  }

  /* Revisió R26, ronda 3 · El seguiment del relleu mentre el transport d'un
     intent és en vol. El transport NO penja del senyal del relleu, només de
     l'operació del servei: una rotació de la UI no el talla i, per tant, mai
     no cal reenviar (ronda 2: el reenviament tornava a xifrar en un fil E2EE i
     acabava en SDP-XAT-008 d'un missatge ja desat, i competia amb el transport
     vell). Quan el senyal vigilat cau, en el mateix tic:
       · un llinatge que ja no casa és SESSIO_CANVIADA;
       · sense font viva de l'actor és definitiu (SENYAL_INTENT_AVORTAT, com a
         la ronda 1): un relleu ingenu tornaria l'operació d'un altre àmbit;
       · amb el sostre de salts esgotat és definitiu (SALTS_RELLEU_ESGOTATS);
       · si no, es torna a demanar el relleu per al mateix intent: un senyal viu
         passa a ser el vigilat, i null, un senyal ja avortat o una excepció són
         definitius (obteSenyalPerIntent).
     Tota decisió definitiva avorta l'operació, i amb ella el transport.
     `assentat()` espera la decisió en curs: cap resposta no s'entrega abans. */
  function segueixRelleu(op, numIntent, senyalInicial) {
    let vigilat = null;
    let saltsIntent = 0;
    let pendent = null;
    let tancat = false;

    function deixaDeVigilar() {
      if (vigilat) vigilat.removeEventListener('abort', enCaure);
      vigilat = null;
    }

    function vigila(senyal) {
      vigilat = senyal;
      senyal.addEventListener('abort', enCaure, { once: true });
      if (senyal.aborted) enCaure();
    }

    function enCaure() {
      const motiu = vigilat?.reason;
      deixaDeVigilar();
      if (tancat || op.control.signal.aborted) return;
      try {
        asseguraLlinatgeVigent(op, motiu);
        if (!teFontVivaDeLActor(op)) {
          throw cancelaDefinitivament(op, 'OPERACIO_CANCELADA', 'SENYAL_INTENT_AVORTAT', motiu);
        }
        if (op.saltsRelleu >= MAX_SALTS_RELLEU) {
          throw cancelaDefinitivament(op, 'OPERACIO_CANCELADA', 'SALTS_RELLEU_ESGOTATS', motiu);
        }
      } catch {
        return; // l'operació ja està avortada amb el seu motiu: el transport cau amb ella
      }
      op.saltsRelleu += 1;
      saltsIntent += 1;
      const demanda = (async () => {
        /* Fora del despatx de l'abort: qui rota (la neteja d'un useLayoutEffect)
           instal·la l'operació nova en el mateix commit síncron, i un relleu
           cridat ací dins encara veuria la vella. */
        await null;
        const nou = await obteSenyalPerIntent(op, numIntent, saltsIntent);
        asseguraOperacioViva(op);
        asseguraLlinatgeVigent(op);
        if (!tancat) vigila(nou);
      })().catch(() => {
        // obteSenyalPerIntent i les guardes ja han avortat l'operació amb el seu motiu.
      });
      pendent = demanda;
      demanda.then(() => {
        if (pendent === demanda) pendent = null;
      });
    }

    vigila(senyalInicial);
    return {
      decidint: () => Boolean(pendent),
      async assentat() {
        while (pendent) await pendent;
      },
      tanca() {
        tancat = true;
        deixaDeVigilar();
      },
    };
  }

  /* Un intent (el primer enviament o el reintent després de renovar).
       · si cau l'operació del servei (eixida, canvi detectat, cancelaTot, tanca,
         el `signal` de la crida o una decisió definitiva del seguiment del
         relleu), és definitiu amb el seu motiu, encara que el transport no
         respecte l'abort;
       · si només cau el senyal del relleu, el decidix segueixRelleu sense tallar
         el transport;
       · la resposta s'entrega amb l'operació viva, el relleu ja decidit i el
         llinatge intacte: és l'ACK del servidor, i qui crida tria a quina
         operació viva l'entrega. */
  async function executaIntent(op, numIntent) {
    asseguraOperacioViva(op);
    /* Sense obteSenyalIntent no hi ha cap await abans del transport (ni darrere):
       el refresc compartit continua arrancant en el mateix tic que en el kit. */
    const senyalIntent = op.obteSenyalIntent ? await obteSenyalPerIntent(op, numIntent, 0) : null;
    asseguraOperacioViva(op);
    asseguraLlinatgeVigent(op);
    const guard = creaControlIntent([op.control.signal]);
    const seguiment = senyalIntent ? segueixRelleu(op, numIntent, senyalIntent) : null;
    let resposta;
    let errTransport;
    let respost = false;
    try {
      /* El senyal ha caigut entre la resposta del relleu i ara: es decidix ABANS
         d'enviar res (cap transport no ix amb una decisió pendent). */
      while (seguiment?.decidint()) {
        await seguiment.assentat();
        asseguraOperacioViva(op);
        asseguraLlinatgeVigent(op);
      }
      if (guard.signal.aborted) throw guard.signal.reason;
      const enVol = op.transport(op.filNet, op.payload, { ...op.config, signal: guard.signal });
      resposta = await (seguiment ? tallaAmbSenyal(enVol, guard.signal) : enVol);
      respost = true;
    } catch (err) {
      errTransport = err;
    }
    try {
      if (seguiment) await seguiment.assentat();
    } finally {
      seguiment?.tanca();
      guard.neteja();
    }
    asseguraOperacioViva(op);
    if (!respost) throw errTransport;
    asseguraLlinatgeVigent(op);
    return resposta;
  }

  /* Revisió R26, ronda 2 · La renovació ha fallat. Si al lloc de la sessió
     d'origen ara n'hi ha UNA ALTRA de viva (una altra persona, una altra
     entrada, un altre actor o backend), és un canvi d'identitat i es diu així.
     Sense cap sessió, la caducitat de sempre: auth.js tanca la pestanya ell
     mateix quan el refresh token ja no val (renova: 400/401), i eixe estat no
     es distingix d'una eixida coincident; tots dos són definitius. */
  function errorRefrescFallit(op, primerError, missatge) {
    let actual = null;
    try {
      actual = llegixContextViu(op);
    } catch {
      actual = null;
    }
    if (actual?.usuariId && actual.autenticat && !mateixLlinatgeActiu(op.contextOrigen, actual)) {
      asseguraLlinatgeVigent(op, primerError);
    }
    return creaErrorXat(missatge, {
      codi: 'SESSIO_CADUCADA',
      status: 401,
      retriable: false,
      refreshFallit: true,
      cause: primerError,
    });
  }

  async function executaFlux(op) {
    try {
      const resposta = await executaIntent(op, 0);
      return op.normalitzaResposta(resposta);
    } catch (primerError) {
      if (op.control.signal.aborted) {
        throw op.control.signal.reason ?? primerError;
      }
      if (primerError?.codi === 'SESSIO_CANVIADA' || !esErrorJwtCaducat(primerError)) {
        throw primerError;
      }

      // Comprova que no haja canviat la sessió abans ni tan sols de disparar refreshSession()
      asseguraLlinatgeVigent(op, primerError);

      let resultatRefresc;
      try {
        resultatRefresc = await executaRefrescDeduplicat(op.clauAmbit, op.configRefresc);
      } catch (errorRefresc) {
        asseguraOperacioViva(op);
        throw errorRefrescFallit(op, primerError, errorRefresc?.message || 'No s\'ha pogut renovar la sessió caducada.');
      }

      asseguraOperacioViva(op);
      if (!refrescHaReeixit(resultatRefresc)) {
        throw errorRefrescFallit(op, primerError, 'La sessió ha caducat i no s\'ha pogut renovar.');
      }

      // R25.2-X01 & X02: Validació estricta del llinatge (inclosa generacioLogin) ABANS del reintent
      asseguraLlinatgeVigent(op, primerError);

      // Exactament UN sol reintent idempotent amb nou AbortSignal viu i el mateix payload congelat.
      try {
        const respostaReintent = await executaIntent(op, 1);
        return op.normalitzaResposta(respostaReintent);
      } catch (segonError) {
        if (op.control.signal.aborted) {
          throw op.control.signal.reason ?? segonError;
        }
        if (segonError?.codi !== 'SESSIO_CANVIADA' && esErrorJwtCaducat(segonError)) {
          throw creaErrorXat(
            segonError?.message || 'La sessió continua rebutjada després de renovar el token.',
            {
              codi: 'SESSIO_CADUCADA',
              status: Number(segonError?.status ?? 401) || 401,
              retriable: false,
              reintentEsgotat: true,
              cause: segonError,
            },
          );
        }
        throw segonError;
      }
    }
  }

  function preparaOperacio(filId, entrada, opcions) {
    if (motiuTancament) {
      throw creaErrorXat('El servei del xat s\'ha tancat; l\'enviament no continua.', {
        codi: 'SERVEI_TANCAT',
        motiu: motiuTancament,
        retriable: false,
        definitiu: true,
      });
    }
    const filNet = typeof filId === 'string' ? filId.trim() : '';
    if (!filNet) {
      throw creaErrorXat('Cal indicar un filId vàlid per a enviar el missatge.', {
        codi: 'ENTRADA_INVALIDA',
        retriable: false,
      });
    }

    const cru = opcions && typeof opcions === 'object' ? opcions : {};
    for (const clau of CLAUS_DE_LLINATGE_PROHIBIDES) {
      if (Object.hasOwn(cru, clau)) {
        throw creaErrorXat(
          `L'opció «${clau}» no s'admet: el llinatge de la sessió es llig en viu, mai d'una foto de la crida.`,
          { codi: 'ENTRADA_INVALIDA', retriable: false },
        );
      }
    }
    const config = {};
    for (const clau of Object.keys(cru)) {
      if (!CLAUS_DEL_SERVEI.includes(clau)) config[clau] = cru[clau];
    }
    const { signal, obteSenyalIntent } = cru;
    const actorPerCrida = cru.obteActorOrgId;
    if (obteSenyalIntent !== undefined && typeof obteSenyalIntent !== 'function') {
      throw creaErrorXat('obteSenyalIntent ha de ser una funció.', { codi: 'ENTRADA_INVALIDA', retriable: false });
    }
    if (actorPerCrida !== undefined && typeof actorPerCrida !== 'function') {
      throw creaErrorXat('obteActorOrgId ha de ser una funció.', { codi: 'ENTRADA_INVALIDA', retriable: false });
    }
    if (signal !== undefined && signal !== null && !esSenyal(signal)) {
      throw creaErrorXat('signal ha de ser un AbortSignal.', { codi: 'ENTRADA_INVALIDA', retriable: false });
    }
    if (signal?.aborted) {
      throw signal.reason ?? new DOMException('Operació cancel·lada.', 'AbortError');
    }

    const op = {
      filNet,
      config,
      configRefresc: { ...config },
      obteSenyalIntent: obteSenyalIntent || null,
      obteActorOrgId: actorPerCrida || null,
      control: new AbortController(),
      transport: enviaMissatge,
      desenganxaSenyal: null,
      saltsRelleu: 0,
    };

    const contextOrigen = llegixContextViu(op);
    if (!contextOrigen.backend) {
      throw creaErrorXat('La configuració del backend del xat és invàlida.', {
        codi: 'BACKEND_INVALID',
        retriable: false,
      });
    }
    if (!contextOrigen.usuariId || !contextOrigen.autenticat) {
      throw creaErrorXat('No hi ha cap sessió activa per a enviar el missatge.', {
        codi: 'SESSIO_CADUCADA',
        status: 401,
        retriable: false,
      });
    }

    const actorDeclarat = cru.actorOrgId !== undefined ? cru.actorOrgId : cru.comOrgId;
    if (actorDeclarat !== undefined && actorDeclarat !== null && String(actorDeclarat).trim()) {
      const teFontViva = Boolean(actorPerCrida || obteActorOrgId || obteContextSessio !== obteContextSessioPerDefecte);
      if (!teFontViva) {
        throw creaErrorXat(
          'No es pot enviar com a entitat sense una font viva de l\'actor (obteActorOrgId).',
          { codi: 'ACTOR_SENSE_FONT_VIVA', retriable: false },
        );
      }
      if (String(actorDeclarat).trim() !== contextOrigen.actorOrgId) {
        throw errorSessioCanviada();
      }
    }

    const payloadCongelat = normalitzaMissatgeSortida(entrada, { generaUuid });
    // p_id és global al servidor: la mateixa persona i backend no poden reutilitzar un UUID amb un altre fil o contingut.
    const clauIdempotencia = `${contextOrigen.backend}::${contextOrigen.usuariId}::${payloadCongelat.client_msg_id}`;
    registraOVerificaEmpremta(clauIdempotencia, empremtaPayloadCanonic(filNet, payloadCongelat));

    op.contextOrigen = contextOrigen;
    op.clauAmbit = clauLlinatge(contextOrigen);
    op.payload = payloadCongelat;
    op.normalitzaResposta = (resposta) => {
      if (!resposta || typeof resposta !== 'object' || Array.isArray(resposta)) {
        return resposta;
      }
      return {
        ...resposta,
        // client_msg_id identifica la petició. L'id del servidor només pot
        // vindre del seu ACK: sintetitzar-lo amagaria un contracte incomplet.
        client_msg_id: payloadCongelat.client_msg_id,
      };
    };

    if (signal) {
      const avortaDesDeLaCrida = () => {
        if (!op.control.signal.aborted) {
          op.control.abort(signal.reason ?? new DOMException('Operació cancel·lada.', 'AbortError'));
        }
      };
      signal.addEventListener('abort', avortaDesDeLaCrida, { once: true });
      op.desenganxaSenyal = () => signal.removeEventListener('abort', avortaDesDeLaCrida);
    }
    registraOperacio(op);
    return op;
  }

  function enviaMissatgeAmbReintentJwt(filId, entrada, opcions = {}) {
    let op;
    try {
      op = preparaOperacio(filId, entrada, opcions);
    } catch (err) {
      return Promise.reject(err);
    }
    const flux = executaFlux(op);
    /* La promesa de qui crida es liquida en avortar-se l'operació encara que el
       transport no respecte el senyal: cap resposta tardana no hi arriba després. */
    return new Promise((resol, rebutja) => {
      const senyal = op.control.signal;
      let acabat = false;
      const acaba = () => {
        if (acabat) return false;
        acabat = true;
        senyal.removeEventListener('abort', enAvortar);
        retiraOperacio(op);
        return true;
      };
      function enAvortar() {
        if (acaba()) rebutja(senyal.reason ?? new DOMException('Operació cancel·lada.', 'AbortError'));
      }
      senyal.addEventListener('abort', enAvortar, { once: true });
      flux.then(
        (valor) => { if (acaba()) resol(valor); },
        (err) => { if (acaba()) rebutja(err); },
      );
    });
  }

  function cancelaTot(motiu = 'cancelacio') {
    for (const op of [...operacionsEnVol]) {
      cancelaDefinitivament(op, 'OPERACIO_CANCELADA', String(motiu));
    }
  }

  function tanca(motiu = 'tancament') {
    if (!motiuTancament) motiuTancament = String(motiu);
    for (const op of [...operacionsEnVol]) {
      cancelaDefinitivament(op, 'SERVEI_TANCAT', motiuTancament);
    }
  }

  function netejaEmpremtes() {
    for (const clau of Object.keys(empremtesEnviades)) {
      delete empremtesEnviades[clau];
    }
    ordreEmpremtes.length = 0;
  }

  return Object.freeze({
    enviaMissatge: enviaMissatgeAmbReintentJwt,
    enviaMissatgeAmbReintentJwt,
    netejaEmpremtes,
    revalidaEnVol,
    cancelaTot,
    tanca,
    comptaEnVol: () => operacionsEnVol.size,
    teRefrescEnVol: (clau) => (clau
      ? Object.hasOwn(refrescosEnVol, clau)
      : Object.keys(refrescosEnVol).length > 0),
  });
}

export const serveiXat = creaServeiXat();
export const enviaMissatgeAmbReintentJwt = serveiXat.enviaMissatgeAmbReintentJwt;
