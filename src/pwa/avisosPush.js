/* Ordre nocturna 261030_0252 (Fase 3, WP) · Avisos push del Xat compatibles
   amb l'E2EE (sdp-xat-v1), fase N1 i INERT: cap pantalla ni cap entrada no
   importa este mòdul, cap servidor no desa subscripcions i encendre-ho és
   decisió del Mestre (D-WP-1 a D-WP-10: reobrir «push: no» de la Fase 0, el
   parell VAPID, la migració, el text legal…).

   El mòdul pur de la subscripció. Tot entra injectat: el registre del worker
   (el resol src/pwa/registre.js, l'únic fitxer que el pot nomenar:
   registreActiu() per a SUBSCRIURE, sense cap versió en espera, i
   registreDelSw() per a la BAIXA, l'interruptor i la neteja, també amb una
   versió en espera), la finestra, el navigator, la clau pública VAPID
   (base64url) i les funcions del servidor (desa, retira).

   El push és un DESPERTADOR CEC: el servidor envia un push sense cos i
   public/sw.js mostra sempre «Tens missatges nous», sense text, remitent ni
   fil. Per això el servidor només rep l'endpoint i la caducitat: les claus de
   xifratge de la subscripció (p256dh i auth, RFC 8291) no ixen mai d'ací.

   Regles:
     · el permís només es demana des d'un gest de la persona, com a PRIMERA
       crida asíncrona i sense cap espera abans (Safari i Firefox perden el
       gest); si navigator.userActivation diu que no hi ha gest, no es pregunta;
     · sincronitzar no pregunta MAI;
     · userVisibleOnly sempre: cada push mostra un avís;
     · cap emmagatzematge: l'estat és el permís més la subscripció del
       navegador, i el que s'ha desat en esta càrrega viu en memòria, per
       persona (l'àmbit de la sessió), i s'oblida en eixir;
     · l'endpoint només d'un servei de push conegut i sense res estrany
       (contra SSRF: la funció del servidor hi farà un POST i ho ha de tornar
       a comprovar);
     · res fora del Baseline 2022 (la clau es descodifica amb atob).
   Cap funció no llança: totes tornen { estat[, error] } (o res, la neteja). */

/** L'etiqueta dels avisos del Xat, la mateixa que public/sw.js (sw.test.js ho comprova). */
export const ETIQUETA_AVIS_XAT = 'sdp-xat';

/** Per què no s'oferix el push (motiuPerNoOferirPush), en ordre. */
export const MOTIU_PUSH = Object.freeze({
  DESENVOLUPAMENT: 'desenvolupament',
  APAGAT: 'apagat',
  SENSE_CLAU: 'sense-clau',
  CONTEXT_INSEGUR: 'context-insegur',
  INCRUSTAT: 'incrustat',
  NATIVA: 'nativa',
  IOS_SENSE_INSTALAR: 'ios-sense-instalar',
  SENSE_SUPORT: 'sense-suport'
});

/** L'estat que tornen activa, desactiva i sincronitza. */
export const ESTAT_PUSH = Object.freeze({
  ACTIU: 'actiu',
  INACTIU: 'inactiu',
  DENEGAT: 'denegat',
  SENSE_GEST: 'sense-gest',
  SENSE_WORKER: 'sense-worker',
  ERROR: 'error'
});

/** El codi de l'error que acompanya ESTAT_PUSH.ERROR. */
export const ERROR_PUSH = Object.freeze({
  SENSE_SUPORT: 'sense-suport',
  SENSE_CLAU: 'sense-clau',
  SENSE_SERVIDOR: 'sense-servidor',
  PERMIS: 'permis',
  SUBSCRIPCIO: 'subscripcio',
  SERVEI_DESCONEGUT: 'servei-desconegut',
  SERVIDOR: 'servidor'
});

/* Els serveis de push dels navegadors (Google FCM, Mozilla autopush, Apple i
   Microsoft WNS): el nom de l'amfitrió sencer. Contra SSRF; el servidor ho ha
   de tornar a comprovar. */
export const SERVEIS_DE_PUSH = Object.freeze([
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /(?:^|\.)push\.apple\.com$/,
  /(?:^|\.)notify\.windows\.com$/
]);

/** La llargada màxima d'un endpoint (la mateixa que el CHECK proposat per al servidor). */
export const MAXIM_ENDPOINT = 2048;

/* Una clau pública VAPID: un punt P-256 sense comprimir (65 bytes, 0x04 al
   davant) en base64url sense farciment, 87 caràcters. */
const CLAU_VAPID = /^[A-Za-z0-9_-]{87}$/;
const BYTES_CLAU = 65;
/* Un endpoint: https i només caràcters ASCII visibles (cap espai ni control). */
const ENDPOINT_VISIBLE = /^https:\/\/[!-~]+$/;

/**
 * Una memòria nova dels endpoints que el servidor ja té en esta càrrega de la
 * pàgina, per àmbit (la identitat de la sessió): sincronitza desa una sola
 * vegada per càrrega i per persona. Memòria, no emmagatzematge: es perd en
 * recarregar. Cada oblit n'avança la `generacio`: un desat que encara era en
 * vol quan s'ha oblidat ja no s'hi anota en tornar.
 */
export function creaMemoriaDeDesats() {
  return { generacio: 0, perAmbit: new Map() };
}

/* La de la pàgina. Gauntlet matinal 261030 (ALT-01 de Gemini i MITJÀ-C7 de
   Codex): abans era un Set d'endpoints sense persona que no es buidava mai, i
   si A eixia i B entrava en la mateixa pestanya, la sincronització de B ometia
   el desat i deia «actiu». */
const DESATS_D_ESTA_CARREGA = creaMemoriaDeDesats();

function esMemoria(memoria) {
  return Boolean(memoria && typeof memoria === 'object' && Number.isInteger(memoria.generacio) && memoria.perAmbit instanceof Map);
}

/* Oblida un endpoint de tots els àmbits (s'ha desfet o retirat) i avança la
   generació: un desat en vol no el tornarà a anotar. */
function oblidaEndpoint(memoria, endpoint) {
  if (!esMemoria(memoria)) return;
  memoria.generacio += 1;
  for (const endpoints of memoria.perAmbit.values()) endpoints.delete(endpoint);
}

/**
 * En eixir de la sessió (o en canviar de persona): oblida tots els desats
 * d'esta càrrega i n'avança la generació, de manera que un desat que encara
 * era en vol no s'hi anota. L'ha de cridar l'eixida de la sessió quan el push
 * s'endolle (fase N2). Mai llança.
 */
export function oblidaDesatsPush(memoria = DESATS_D_ESTA_CARREGA) {
  if (!esMemoria(memoria)) return;
  memoria.generacio += 1;
  memoria.perAmbit.clear();
}

/** La clau pública VAPID (base64url, 87 caràcters) com a Uint8Array(65) que comença per 0x04, o null. Pura. */
export function clauDeServidor(text) {
  if (typeof text !== 'string' || !CLAU_VAPID.test(text)) return null;
  try {
    const binari = atob(`${text.replace(/-/g, '+').replace(/_/g, '/')}=`);
    if (binari.length !== BYTES_CLAU || binari.charCodeAt(0) !== 4) return null;
    const bytes = new Uint8Array(BYTES_CLAU);
    for (let i = 0; i < BYTES_CLAU; i += 1) bytes[i] = binari.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Per què NO s'ha d'oferir el push, o null. Pura (com motiuPerNoRegistrar de
 * registre.js, que decidix si hi ha worker). `actiu`: la bandera i la capacitat
 * del port, decidides fora. Safari d'iOS fora de la pantalla d'inici no té
 * PushManager i diu navigator.standalone === false: cal instal·lar l'app.
 */
export function motiuPerNoOferirPush({ produccio, actiu, clau, finestra, navegador } = {}) {
  if (produccio !== true) return MOTIU_PUSH.DESENVOLUPAMENT;
  if (actiu !== true) return MOTIU_PUSH.APAGAT;
  if (!clauDeServidor(clau)) return MOTIU_PUSH.SENSE_CLAU;
  if (!finestra || finestra.isSecureContext !== true) return MOTIU_PUSH.CONTEXT_INSEGUR;
  // Dins d'un iframe la pàgina és de l'amfitrió, no nostra.
  if (finestra.top !== finestra.self) return MOTIU_PUSH.INCRUSTAT;
  // Dins de l'app de Capacitor no hi ha worker: els avisos hi són natius (src/natiu/).
  const capacitor = finestra.Capacitor;
  if (capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform()) return MOTIU_PUSH.NATIVA;
  if (typeof finestra.PushManager !== 'function' || typeof finestra.Notification !== 'function') {
    return navegador && navegador.standalone === false ? MOTIU_PUSH.IOS_SENSE_INSTALAR : MOTIU_PUSH.SENSE_SUPORT;
  }
  return null;
}

/**
 * { endpoint, caducaMs } de la forma JSON d'una subscripció (toJSON()), o
 * null. L'endpoint ha de ser https, d'un dels SERVEIS_DE_PUSH, de com a molt
 * MAXIM_ENDPOINT caràcters ASCII visibles, sense credencials, port ni
 * fragment, i escrit ja en forma canònica (el que llig el servidor és el
 * mateix que s'ha comprovat ací). Viatja tal qual. Les claus (keys) no ixen
 * mai. Pura.
 */
export function formaDeLaSubscripcio(json) {
  const endpoint = json && typeof json === 'object' ? json.endpoint : null;
  if (typeof endpoint !== 'string' || endpoint.length > MAXIM_ENDPOINT || !ENDPOINT_VISIBLE.test(endpoint) || endpoint.includes('#')) return null;
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !endpoint.startsWith(`https://${url.hostname}/`)) return null;
  if (!SERVEIS_DE_PUSH.some((servei) => servei.test(url.hostname))) return null;
  const caduca = json.expirationTime;
  return { endpoint, caducaMs: typeof caduca === 'number' && Number.isFinite(caduca) && caduca > 0 ? caduca : null };
}

/* La forma JSON d'una subscripció (o la subscripció tal qual, si no en té). */
function jsonDe(subscripcio) {
  return subscripcio && typeof subscripcio.toJSON === 'function' ? subscripcio.toJSON() : subscripcio;
}

/* Si una subscripció és de la clau `bytes`. Si el navegador no diu la clau
   (options.applicationServerKey), es dona per bona: es conserva. */
function esDeLaClau(subscripcio, bytes) {
  const actual = subscripcio && subscripcio.options && subscripcio.options.applicationServerKey;
  if (!actual) return true;
  let vista;
  try {
    vista = new Uint8Array(actual);
  } catch {
    return true;
  }
  return vista.length === bytes.length && vista.every((valor, index) => valor === bytes[index]);
}

/* El registre injectat: un valor, una promesa o una funció que el torna. */
async function resolRegistre(registre) {
  const valor = typeof registre === 'function' ? await registre() : await registre;
  return valor || null;
}

/* Un registre amb un worker actiu, cap versió en espera ni instal·lant-se, i
   el gestor de subscripcions del navegador. */
function esRegistreActiu(registre) {
  const gestor = registre && registre.pushManager;
  return Boolean(registre && registre.active && !registre.waiting && !registre.installing && gestor &&
    typeof gestor.subscribe === 'function' && typeof gestor.getSubscription === 'function');
}

/* La subscripció actual del registre, o null. */
async function subscripcioDe(registre) {
  const gestor = registre && registre.pushManager;
  if (!gestor || typeof gestor.getSubscription !== 'function') return null;
  return (await gestor.getSubscription()) || null;
}

/* Desfà una subscripció: torna si s'ha pogut. */
async function desfes(subscripcio) {
  try {
    await subscripcio.unsubscribe();
    return true;
  } catch {
    return false;
  }
}

function subscriu(registre, bytes) {
  return registre.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
}

/**
 * Activa els avisos des d'un GEST de la persona. Abans de la primera espera
 * només hi ha comprovacions síncrones (suport, clau, servidor i gest) i la
 * crida a Notification.requestPermission(). Després exigix un registre actiu,
 * sense cap versió en espera ni instal·lant-se. Si hi ha una subscripció
 * d'una altra clau VAPID, la desfà i en fa una de nova (userVisibleOnly). Si
 * l'endpoint no és d'un servei conegut o el servidor no la desa, la desfà:
 * cap subscripció òrfena. Torna { estat[, error] }. Mai llança.
 * `registre`: el de registreActiu() (un valor, una promesa o una funció).
 * `desa({ endpoint, caducaMs })`: el servidor.
 */
export async function activaAvisosPush({ registre, finestra, navegador, clau, desa } = {}) {
  let permis;
  let bytes;
  try {
    const avisos = finestra && finestra.Notification;
    if (!avisos || typeof avisos.requestPermission !== 'function') return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SENSE_SUPORT };
    bytes = clauDeServidor(clau);
    if (!bytes) return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SENSE_CLAU };
    if (typeof desa !== 'function') return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SENSE_SERVIDOR };
    const activacio = navegador && navegador.userActivation;
    if (activacio && activacio.isActive === false) return { estat: ESTAT_PUSH.SENSE_GEST };
    permis = avisos.requestPermission();
  } catch {
    return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.PERMIS };
  }
  let resposta;
  try {
    resposta = await permis;
  } catch {
    return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.PERMIS };
  }
  if (resposta === 'denied') return { estat: ESTAT_PUSH.DENEGAT };
  if (resposta !== 'granted') return { estat: ESTAT_PUSH.INACTIU };
  let actiu;
  try {
    actiu = await resolRegistre(registre);
  } catch {
    actiu = null;
  }
  if (!esRegistreActiu(actiu)) return { estat: ESTAT_PUSH.SENSE_WORKER };
  let subscripcio;
  try {
    const anterior = await subscripcioDe(actiu);
    if (anterior && esDeLaClau(anterior, bytes)) subscripcio = anterior;
    else {
      if (anterior && !(await desfes(anterior))) return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO };
      subscripcio = await subscriu(actiu, bytes);
    }
  } catch {
    return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO };
  }
  return desaOdesfes(subscripcio, desa, true);
}

/* Desa la subscripció al servidor: { estat: actiu } si ho ha pogut. Un
   endpoint d'un servei desconegut es desfà sempre; si el servidor falla, es
   desfà només si `desfesSiFalla` (la que no sabem segur que el servidor
   coneix). Només s'anota a la `memoria` amb un `ambit` (la identitat de la
   sessió); sense, es desa cada vegada. */
async function desaOdesfes(subscripcio, desa, desfesSiFalla, memoria = null, ambit = null) {
  let forma;
  try {
    forma = formaDeLaSubscripcio(jsonDe(subscripcio));
  } catch {
    forma = null;
  }
  if (!forma) {
    await desfes(subscripcio);
    return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SERVEI_DESCONEGUT };
  }
  const anota = esMemoria(memoria) && typeof ambit === 'string' && ambit !== '';
  const delAmbit = anota ? memoria.perAmbit.get(ambit) : null;
  if (delAmbit && delAmbit.has(forma.endpoint)) return { estat: ESTAT_PUSH.ACTIU };
  const generacio = anota ? memoria.generacio : null;
  try {
    await desa(forma);
  } catch {
    if (desfesSiFalla) await desfes(subscripcio);
    return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SERVIDOR };
  }
  if (anota && memoria.generacio === generacio) {
    if (!memoria.perAmbit.has(ambit)) memoria.perAmbit.set(ambit, new Set());
    memoria.perAmbit.get(ambit).add(forma.endpoint);
  }
  return { estat: ESTAT_PUSH.ACTIU };
}

/* Desfà la subscripció, l'oblida de la `memoria` i, després, la retira del
   servidor, de cortesia: el servei de push ja ha matat l'endpoint. */
async function desfesIRetira(subscripcio, retira, memoria = null) {
  let forma = null;
  try {
    forma = formaDeLaSubscripcio(jsonDe(subscripcio));
  } catch {
    forma = null;
  }
  const desfeta = await desfes(subscripcio);
  if (forma) oblidaEndpoint(memoria, forma.endpoint);
  if (forma && typeof retira === 'function') {
    try {
      await retira({ endpoint: forma.endpoint });
    } catch {
      /* de cortesia: l'endpoint ja és mort */
    }
  }
  return desfeta;
}

/**
 * La baixa: primer la local (unsubscribe, que mata l'endpoint) i després
 * retira({ endpoint }) al servidor, de cortesia. Torna { estat[, error] }.
 * `registre`: el de registreDelSw(), que el troba també amb una versió en
 * espera. Sense registre no se sap si hi ha subscripció: sense-worker, mai
 * inactiu (Gauntlet c3, push-desactiva-fals-exit-amb-worker-en-espera).
 * L'endpoint s'oblida de la memoria `desats` (la de la pàgina per defecte):
 * una sincronització posterior el tornarà a desar si encara és viu. Mai
 * llança.
 */
export async function desactivaAvisosPush({ registre, retira, desats = DESATS_D_ESTA_CARREGA } = {}) {
  let subscripcio;
  try {
    const resolt = await resolRegistre(registre);
    if (!resolt) return { estat: ESTAT_PUSH.SENSE_WORKER };
    subscripcio = await subscripcioDe(resolt);
  } catch {
    return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO };
  }
  if (!subscripcio) return { estat: ESTAT_PUSH.INACTIU };
  return (await desfesIRetira(subscripcio, retira, desats)) ? { estat: ESTAT_PUSH.INACTIU } : { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO };
}

/**
 * Sincronitza en carregar i en tornar a la vista. MAI no pregunta. És
 * l'INTERRUPTOR: amb `actiu` fals (la bandera o la capacitat apagades), sense
 * servidor, sense clau o sense el permís, desfà la subscripció que hi haja i
 * la retira; si la baixa local falla, error, mai un «inactiu» fals (Gauntlet
 * matinal 261030, MITJÀ-C6). Amb una clau rotada, desfà la vella i se subscriu
 * de nou (el permís ja hi és). Amb una subscripció vigent, la desa una sola
 * vegada per càrrega i per `ambit` (la identitat de la sessió, una cadena no
 * buida; sense, la desa cada vegada) a la memòria `desats` (la de la pàgina
 * per defecte; oblidaDesatsPush la buida en eixir). Sense subscripció no en
 * fa cap: només un gest activa.
 * `registre`: el de registreDelSw(), perquè l'interruptor desfaça també amb
 * una versió en espera; només per a tornar a subscriure (clau rotada) exigix
 * un registre sense cap versió en espera. Torna { estat[, error] }. Mai llança.
 */
export async function sincronitzaAvisosPush({ registre, finestra, actiu, clau, desa, retira, ambit, desats = DESATS_D_ESTA_CARREGA } = {}) {
  let resolt;
  let subscripcio;
  try {
    resolt = await resolRegistre(registre);
    if (!resolt || !resolt.pushManager) return { estat: ESTAT_PUSH.SENSE_WORKER };
    subscripcio = await subscripcioDe(resolt);
  } catch {
    return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO };
  }
  let permis;
  try {
    permis = finestra && finestra.Notification ? finestra.Notification.permission : undefined;
  } catch {
    permis = undefined;
  }
  const bytes = clauDeServidor(clau);
  if (actiu !== true || typeof desa !== 'function' || !bytes || permis !== 'granted') {
    if (subscripcio && !(await desfesIRetira(subscripcio, retira, desats))) return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO };
    return { estat: permis === 'denied' ? ESTAT_PUSH.DENEGAT : ESTAT_PUSH.INACTIU };
  }
  if (!subscripcio) return { estat: ESTAT_PUSH.INACTIU };
  if (esDeLaClau(subscripcio, bytes)) return desaOdesfes(subscripcio, desa, false, desats, ambit);
  if (!(await desfesIRetira(subscripcio, retira, desats))) return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO };
  if (!esRegistreActiu(resolt)) return { estat: ESTAT_PUSH.SENSE_WORKER };
  let nova;
  try {
    nova = await subscriu(resolt, bytes);
  } catch {
    return { estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO };
  }
  return desaOdesfes(nova, desa, true, desats, ambit);
}

/**
 * Tanca els avisos del Xat ja mostrats (només els de l'etiqueta del Xat) i la
 * insígnia de l'app, si n'hi ha. Per a quan la persona torna a la vista. Mai
 * llança.
 */
export async function netejaAvisosPush({ registre, navegador } = {}) {
  try {
    const resolt = await resolRegistre(registre);
    if (resolt && typeof resolt.getNotifications === 'function') {
      const avisos = await resolt.getNotifications({ tag: ETIQUETA_AVIS_XAT });
      for (const avis of Array.isArray(avisos) ? avisos : []) {
        if (avis && avis.tag === ETIQUETA_AVIS_XAT && typeof avis.close === 'function') avis.close();
      }
    }
  } catch {
    /* res a tancar */
  }
  try {
    if (navegador && typeof navegador.clearAppBadge === 'function') await navegador.clearAppBadge();
  } catch {
    /* sense insígnia */
  }
}
