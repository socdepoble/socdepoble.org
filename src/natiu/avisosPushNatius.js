/* R54 · Transport oficial PushNotifications8.1.3. El pont és inert sense
   connector; permisos només per gest explícit. El cicle recupera únicament
   l’opt-in del mateix compte. Tokens només en memòria; avís i toc cecs. */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { cicleAvisosPush } from './cicleAvisosPush.js';
import { memoriaConsentimentPush } from './consentimentPush.js';

export const CONNECTOR_PUSH = 'PushNotifications';
export const CONNECTOR_CICLE_PUSH_ANDROID = 'CiclePushNatiu';

/* Sanejament R15 (B3 · P1-03, R15A-NAT-01) · Sense google-services.json, register() i
   unregister() del connector criden FirebaseMessaging.getInstance() sense FirebaseApp i
   l'APK peta (RuntimeException al fil CapacitorPlugins). El push natiu només s'encén amb la
   bandera de build literal VITE_SDP_PUSH_NATIU==='1' (tooling/vite/banderes-de-capacitat.mjs),
   que es declara a .env.natiu.local quan hi ha la configuració d'FCM i APNs. Apagada, tot el
   cicle diu 'sense-config' i no toca el pont. Es llig en cada crida (les proves la canvien). */
const pushNatiuConfigurat = () => import.meta.env.VITE_SDP_PUSH_NATIU === '1';

export const ESTAT_PUSH_NATIU = Object.freeze({
  SENSE_CONFIG: 'sense-config',
  SENSE_CONNECTOR: 'sense-connector',
  DENEGAT: 'denegat',
  SENSE_SERVIDOR: 'sense-servidor',
  INACTIU: 'inactiu',
  ACTIU: 'actiu',
  ERROR: 'error'
});

/** Quant s'espera, com a molt, el testimoni del registre (l'esdeveniment 'registration'). */
export const TOPALL_TESTIMONI_MS = 15000;
// Mateix límit de l'eixida del registre neutre; el test R31 en prova paritat.
export const TOPALL_BAIXA_NATIVA_MS = 2500;

/* L'esdeveniment del connector quan la persona toca un avís. */
const TOC_DEL_CONNECTOR = 'pushNotificationActionPerformed';

/* Les plataformes que el servidor accepta per a un testimoni natiu (B8-SERVIDOR §2.9). */
/* Els permisos que encara es poden preguntar. */
const PREGUNTABLES = new Set(['prompt', 'prompt-with-rationale']);

/* Un connector per nucli: el registre de Capacitor és global i un segon
   registerPlugin del mateix nom avisa a la consola. */
const CONNECTORS = new WeakMap();
const CICLES_ANDROID = new WeakMap();

/* El nucli de @capacitor/core, el de per defecte. */
const nucliPerDefecte = () => ({ Capacitor, registerPlugin });

/* El connector, o null si el pont no el té. SÍNCRONA: torna el Proxy. */
function connectorDe(nucli) {
  try {
    const pont = nucli && nucli.Capacitor;
    const registra = nucli && nucli.registerPlugin;
    if (!pont || typeof pont.isPluginAvailable !== 'function' || typeof registra !== 'function') return null;
    if (!pont.isPluginAvailable(CONNECTOR_PUSH)) return null;
    if (!CONNECTORS.has(registra)) CONNECTORS.set(registra, registra(CONNECTOR_PUSH));
    return CONNECTORS.get(registra) || null;
  } catch {
    return null;
  }
}

// Android8.1.3 resol unregister abans de la Task Firebase. El plugin local
// resol només després de getToken/deleteToken reals i els serialitza també
// si Android recrea l'Activity en el mateix procés. Cap fallback al pont vell.
function cicleAndroidDe(nucli) {
  try {
    if (!nucli.Capacitor.isPluginAvailable(CONNECTOR_CICLE_PUSH_ANDROID)) return null;
    const registra = nucli.registerPlugin;
    if (!CICLES_ANDROID.has(registra)) CICLES_ANDROID.set(registra, registra(CONNECTOR_CICLE_PUSH_ANDROID));
    return CICLES_ANDROID.get(registra) || null;
  } catch { return null; }
}

/* El permís de rebre avisos com el diu el pont ('granted', 'denied',
   'prompt'…), o null. */
function textDelPermis(estat) {
  return estat && typeof estat.receive === 'string' ? estat.receive : null;
}

/* La plataforma del pont ('android', 'ios'), o null. */
function plataformaDe(nucli) {
  try {
    const plataforma = nucli.Capacitor.getPlatform();
    return typeof plataforma === 'string' ? plataforma : null;
  } catch {
    return null;
  }
}

/* Registra l'aparell al servei de push i torna el testimoni ('registration'),
   o null si falla ('registrationError', un rebuig) o no arriba dins del
   topall. Els oients es lleven sempre, com a tard en acabar el topall. El
   testimoni no s'escriu enlloc.
   R32.2 (troballa de la nit 2) · A iOS register() resol de seguida i el
   testimoni arriba després, per l'esdeveniment. Si una baixa (o un altre
   activa) avorta l'espera quan register() ja ha eixit, activa rep null de
   seguida, però l'oient queda de sentinella: un testimoni tardà no torna
   mai a activa, va a `vigia.tarda` (la revocació).
   Correcció de l'Elefant (R32.2, Peix 1) · El rellotge de la sentinella
   torna a comptar un topall sencer DES DE L'AVORTAMENT (la baixa), no des
   del register(). I quan un register() ja eixit acaba sense cap senyal del
   pont (topall de l'espera o de la sentinella), el registre natiu queda
   incert: `vigia.incert` ho diu a l'adaptador, que en fa un deure de baixa.
   `vigia.enviat` es crida just abans del register(): des d'eixe moment,
   el registre natiu és d'esta crida. Si `vigia.tarda` torna false, el
   testimoni és d'un activa viu que ja n'és l'amo: no es revoca i la
   sentinella continua escoltant, perquè el d'esta crida encara pot arribar. */
function testimoniDelRegistre(push, topallMs, senyal, vigia = {}) {
  const avisa = (fn, ...dades) => {
    if (typeof fn !== 'function') return undefined;
    try { return fn(...dades); } catch { return undefined; /* la vigilància no tomba el pont */ }
  };
  return new Promise((resol) => {
    const oients = [];
    let rellotge = null;
    let acabat = false;
    let registreEnviat = false;
    let sentinella = false;
    const lleva = () => {
      clearTimeout(rellotge);
      senyal?.removeEventListener('abort', cancella);
      for (const oient of oients) {
        Promise.resolve(oient).then((mansa) => (mansa && typeof mansa.remove === 'function' ? mansa.remove() : undefined)).catch(() => {});
      }
    };
    // `incertesa`: el topall ha vençut sense cap senyal del pont.
    const acaba = (testimoni, incertesa = false) => {
      const valid = typeof testimoni === 'string' && testimoni ? testimoni : null;
      if (acabat) {
        // La sentinella acaba amb el primer senyal tardà (testimoni, error, rebuig o topall),
        // llevat del testimoni d'un activa viu que ja és l'amo del registre natiu.
        if (!sentinella) return;
        if (valid && avisa(vigia.tarda, valid) === false) return;
        sentinella = false;
        lleva();
        if (incertesa) avisa(vigia.incert);
        else if (!valid) avisa(vigia.tarda, null);
        return;
      }
      acabat = true;
      resol(valid);
      if (!valid && senyal?.aborted && registreEnviat && typeof vigia.tarda === 'function') {
        sentinella = true;
        senyal.removeEventListener('abort', cancella);
        clearTimeout(rellotge);
        rellotge = setTimeout(() => acaba(null, true), topallMs);
        return;
      }
      lleva();
      if (!valid && incertesa && registreEnviat) avisa(vigia.incert);
    };
    const cancella = () => acaba(null);
    senyal?.addEventListener('abort', cancella, { once: true });
    if (senyal?.aborted) { acaba(null); return; }
    const escolta = (nom, funcio) => {
      const oient = push.addListener(nom, funcio);
      oients.push(oient);
      Promise.resolve(oient).catch(() => acaba(null));
    };
    rellotge = setTimeout(() => acaba(null, true), topallMs);
    try {
      escolta('registration', (dada) => acaba(dada && dada.value));
      escolta('registrationError', () => acaba(null));
    } catch {
      acaba(null);
      return;
    }
    // El pont pot instal·lar els oients asíncronament: no registrem fins
    // que els dos estiguen preparats. Un rebuig o un timeout no ha de deixar
    // arrancar un registre tardà sense ningú que reculla el testimoni.
    Promise.all(oients).then(() => {
      if (acabat) return undefined;
      registreEnviat = true;
      avisa(vigia.enviat);
      return push.register();
    }).catch(() => acaba(null));
  });
}

// El resultat pertany a esta crida getToken, no a un esdeveniment Android
// retingut d'una sessió anterior. Expirar o avortar JS no acaba la Task: la
// cua nativa continua ocupada i un deleteToken posterior l'ha d'esperar.
function testimoniDeTask(cicle, topallMs, senyal) {
  return new Promise(resolve => {
    let acabat = false;
    let timer;
    const acaba = dada => {
      if (acabat) return;
      acabat = true;
      clearTimeout(timer);
      senyal?.removeEventListener('abort', cancella);
      resolve(typeof dada?.value === 'string' && dada.value ? dada.value : null);
    };
    const cancella = () => acaba(null);
    senyal?.addEventListener('abort', cancella, { once: true });
    if (senyal?.aborted) { acaba(null); return; }
    timer = setTimeout(() => acaba(null), topallMs);
    try { Promise.resolve(cicle.register()).then(acaba, cancella); }
    catch { acaba(null); }
  });
}

/* El pont no admet cancel·lació d'un unregister ja enviat. El caller no
   espera indefinidament i l'adaptador refusa un registre nou fins que el
   treball vell haja acabat: cap resposta tardana no pot afectar B. */
function limitaBaixa(promesa, ms) {
  const limit = Number.isFinite(ms) && ms >= 0 ? ms : TOPALL_BAIXA_NATIVA_MS;
  let timer;
  return Promise.race([promesa, new Promise(resolve => { timer = setTimeout(() => resolve(false), limit); })])
    .finally(() => clearTimeout(timer));
}

/**
 * Per què el registre no ha d'oferir els avisos push de l'App: 'sense-config' si el build
 * no porta VITE_SDP_PUSH_NATIU=1 (Sanejament R15, B3); 'sense-connector'
 * si el pont no té el connector PushNotifications, o null si el té.
 * SÍNCRONA i sense efectes (B8-CLIENT, ARB-06): només isPluginAvailable, mai
 * registerPlugin, cap permís ni cap xarxa. Mai llança.
 * @param {{ nucli?: { Capacitor: object, registerPlugin: Function } }} [opcions]
 * @returns {('sense-config'|'sense-connector'|null)}
 */
export function motiuPushNatiu(opcions = {}) {
  // Sanejament R15 (B3): sense la bandera de build, 'sense-config' abans de mirar el pont.
  if (!pushNatiuConfigurat()) return ESTAT_PUSH_NATIU.SENSE_CONFIG;
  try {
    const nucli = opcions && opcions.nucli !== undefined ? opcions.nucli : nucliPerDefecte();
    const pont = nucli && nucli.Capacitor;
    if (!pont || typeof pont.isPluginAvailable !== 'function' || typeof nucli.registerPlugin !== 'function') return ESTAT_PUSH_NATIU.SENSE_CONNECTOR;
    if (!pont.isPluginAvailable(CONNECTOR_PUSH)) return ESTAT_PUSH_NATIU.SENSE_CONNECTOR;
    if (plataformaDe(nucli) === 'android' && !pont.isPluginAvailable(CONNECTOR_CICLE_PUSH_ANDROID)) return ESTAT_PUSH_NATIU.SENSE_CONNECTOR;
    return null;
  } catch {
    return ESTAT_PUSH_NATIU.SENSE_CONNECTOR;
  }
}

/**
 * L'adaptador dels avisos push de l'App. Inert fins que algú el registre.
 * @param {{ nucli?: { Capacitor: object, registerPlugin: Function },
 *   desa?: ((dades: { testimoni: string, plataforma: (string|null) }) => Promise<unknown>)|null,
 *   topallMs?: number }} [opcions]
 *   `nucli`: el del pont (per defecte, el de @capacitor/core). `desa`: el
 *   servidor que rep el testimoni; sense, 'sense-servidor' (llevat que el
 *   porte la crida a activa).
 * @returns {{ estat(): Promise<{ estat: string }>,
 *   activa(opcions?: { desa?: (dades: { testimoni: string, plataforma: (string|null) }) => Promise<unknown> }) => Promise<{ estat: string }>,
 *   desactiva(opcions?: { retira?: (dades: { testimoni: string, plataforma: (string|null) }) => Promise<unknown> }) => Promise<{ estat: string }>,
 *   escoltaToc(fn: (dades: {}) => void) => () => void }}
 */
export function creaAvisosPushNatius({ nucli = nucliPerDefecte(), desa = null, topallMs = TOPALL_TESTIMONI_MS, limitBaixaMs = TOPALL_BAIXA_NATIVA_MS, canal = null } = {}) {
  /* Sanejament R15 (B3) · Sense la bandera de build, l'adaptador ni tan sols mira el pont. */
  if (!pushNatiuConfigurat()) return adaptadorSenseConfig();
  /* Sanejament R15 (B3 · P1-03) · Cert des que esta obertura de l'App ha demanat register()
     (o n'ha rebut un testimoni) fins a una baixa feta. Sense això, ni cap testimoni ni cap
     opt-in desat (opcions.ambOptIn, que passa el cicle), desactiva no crida unregister():
     no hi ha res a desfer, i el connector sense FirebaseApp petaria. */
  let registreDemanat = false;
  /* El testimoni que este adaptador ha passat al servidor, només en memòria
     (no s'escriu enlloc) i fins que el servidor en confirma la retirada:
     desactiva el dona a retira. Després de reobrir l'App no se sap: el
     testimoni mor amb unregister i el servidor l'esborrarà quan FCM o APNs
     el rebutgen. */
  let testimoniDesat = null;
  /* Cert des que el servidor ha rebut el testimoni d'esta obertura de l'App
     fins a la primera baixa (B8C-4): així una sincronització en tornar a la
     vista (també la del diàleg del permís d'Android) no apaga l'interruptor
     de qui acaba d'activar. Cap baixa, ni la que falla, el deixa cert: després
     d'una baixa, l'App mai diu «actiu» a una altra persona. */
  let registrat = false;
  /* R32.2 (troballa de la nit 2, Peixos 3 i 4) · La generació local de
     l'adaptador (des de R31 es deia `generacio`): cada activa i cada desactiva
     la incrementen, i una continuació d'una generació vella no escriu mai
     registrat ni testimoniDesat. */
  let generacioLocal = 0;
  /* La generació de la darrera baixa. */
  let generacioBaixa = 0;
  /* Correcció de l'Elefant (R32.2, Peix 2) · La generació de l'activa que
     ha despatxat de veres el darrer register() (iOS) o getToken (Android).
     Només un activa viu que ha arribat al pont després de la darrera baixa
     és amo del registre natiu (un per aparell): un activa que falla abans
     (permís denegat, checkPermissions que llança) no ho és, i tampoc no ho
     és el que hi ha arribat però acaba sense «actiu» (desa rebutjat,
     topall): en tornar, deixa la generació a 0. Llavors el testimoni tardà
     d'una generació anterior es revoca igual (fail-closed: el cicle torna
     a registrar en la sincronització següent). */
  let generacioRegistre = 0;
  /* Correcció de l'Elefant (R32.2, Peix 1) · Un register() d'iOS ja eixit
     que ha acabat sense cap senyal del pont (ni testimoni ni error): APNs
     encara pot lliurar el testimoni quan ningú no l'escolta. Mentre siga
     cert, cada baixa crida unregister i escolta el testimoni tardà (la
     guarda). Un senyal del pont o un register() nou el tornen fals. */
  let registreIncert = false;
  /* La marca del deure de baixa (Peix R2): avança cada vegada que es torna a
     deure una baixa nativa. Una baixa en vol només esborra registreDemanat
     si ningú no l'ha tornat a deure mentrestant. */
  let marcaBaixa = 0;
  const deuBaixa = () => { registreDemanat = true; marcaBaixa += 1; };
  let controlRegistre = null;
  let baixaPont = null;
  let guarda = null;
  /* La baixa nativa. Android passa sempre per la cua de Tasks de
     CiclePushNatiu (contracte R31), mai per l'unregister del connector
     oficial. Cert només si el pont la confirma. Mai llança. */
  const desfesNatiu = async (push) => {
    const marca = marcaBaixa;
    try {
      if (plataformaDe(nucli) === 'android') {
        const cicle = cicleAndroidDe(nucli);
        if (!cicle) return false;
        await cicle.unregister();
      } else await push.unregister();
      if (marca === marcaBaixa) registreDemanat = false;
      return true;
    } catch { return false; }
  };
  /* R32.2 · Un testimoni que arriba després d'una baixa es revoca al pont.
     Entra a la mateixa cua que la baixa (baixaPont, darrere de la que ja hi
     haja): cap activa nou no arrenca fins que el pont la confirma. El deure
     de baixa es marca ABANS de mirar l'amo (Peix 2): si la revocació no es
     fa o falla, la baixa següent crida unregister. Si un activa viu ha
     arribat al pont després de la darrera baixa, és l'amo del registre
     natiu: no es toca i torna false. */
  const revocaTarda = (push) => {
    deuBaixa();
    // R32.3 · Un activa confirmat després de la darrera baixa (registrat) també
    // n'és amo, encara que un re-registre posterior haja renunciat a la generació.
    if (registrat || generacioRegistre > generacioBaixa) return false;
    const anterior = baixaPont;
    const feina = Promise.resolve(anterior)
      .then(() => desfesNatiu(push), () => desfesNatiu(push))
      .finally(() => { if (baixaPont === feina) baixaPont = null; });
    baixaPont = feina;
    return true;
  };
  /* El que l'espera del registre (o la sentinella) diu a l'adaptador. */
  const vigiaDe = (gen, push) => ({
    enviat: () => {
      generacioRegistre = gen;
      registreIncert = false;
      // Els oients d'esta crida ja escolten el pont: rellevem la guarda.
      guarda?.tanca(null, 'relleu');
    },
    // Fals: el testimoni és de l'amo viu i la sentinella continua.
    tarda: (testimoni) => {
      if (testimoni && !revocaTarda(push)) return false;
      registreIncert = false;
      return true;
    },
    incert: () => { registreIncert = true; }
  });
  /* Correcció de l'Elefant (R32.2, Peix 1) · La guarda d'una baixa amb el
     registre incert (només iOS: a Android la cua de Tasks de CiclePushNatiu
     ja posa el deleteToken darrere del getToken en vol). Escolta
     'registration' i 'registrationError' durant un topall comptat des de la
     baixa. Un testimoni tardà es revoca; un error tanca la incertesa; amb
     el topall la incertesa continua, i la baixa següent torna a cridar
     unregister i a escoltar. La vida dels oients continua fitada. */
  const vigilaBaixa = (push) => {
    if (!registreIncert || guarda || plataformaDe(nucli) === 'android') return;
    const oients = [];
    const propia = {};
    propia.tanca = (testimoni, motiu) => {
      if (guarda !== propia) return;
      guarda = null;
      clearTimeout(propia.rellotge);
      for (const oient of oients) {
        Promise.resolve(oient).then((mansa) => (mansa && typeof mansa.remove === 'function' ? mansa.remove() : undefined)).catch(() => {});
      }
      if (motiu !== 'senyal') return;
      registreIncert = false;
      if (testimoni) revocaTarda(push);
    };
    guarda = propia;
    propia.rellotge = setTimeout(() => propia.tanca(null, 'topall'), topallMs);
    const escolta = (nom, funcio) => {
      const oient = push.addListener(nom, funcio);
      oients.push(oient);
      Promise.resolve(oient).catch(() => propia.tanca(null, 'topall'));
    };
    try {
      escolta('registration', (dada) => propia.tanca(typeof dada?.value === 'string' && dada.value ? dada.value : null, 'senyal'));
      escolta('registrationError', () => propia.tanca(null, 'senyal'));
    } catch {
      propia.tanca(null, 'topall');
    }
  };
  return {
    /** L'estat sense preguntar res ni registrar res. Mai llança. */
    async estat() {
      const push = connectorDe(nucli);
      if (!push) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      if (plataformaDe(nucli) === 'android' && !cicleAndroidDe(nucli)) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      try {
        const permis = textDelPermis(await push.checkPermissions());
        if (permis === 'denied') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
        if (registrat && permis === 'granted') return { estat: ESTAT_PUSH_NATIU.ACTIU };
        if (typeof desa !== 'function') return { estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR };
        return { estat: ESTAT_PUSH_NATIU.INACTIU };
      } catch {
        return { estat: ESTAT_PUSH_NATIU.ERROR };
      }
    },
    /**
     * Activa els avisos des d'un gest de la persona: pregunta el permís si
     * encara es pot, registra l'aparell i passa el testimoni al servidor.
     * El `desa` de la crida (el del registre, per a la persona de la sessió)
     * mana sobre el de la construcció. Mai llança.
     */
    async activa(opcions = {}) {
      if (baixaPont) return { estat: ESTAT_PUSH_NATIU.ERROR };
      const gen = ++generacioLocal;
      controlRegistre?.abort();
      const control = new AbortController();
      controlRegistre = control;
      const desaAra = opcions && typeof opcions.desa === 'function' ? opcions.desa : desa;
      const push = connectorDe(nucli);
      if (!push) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      const android = plataformaDe(nucli) === 'android';
      const cicle = android ? cicleAndroidDe(nucli) : null;
      if (android && !cicle) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      let testimoni = null;
      let actiu = false;
      // Peix 2 · Un activa que no acaba «actiu» deixa de ser amo del registre natiu.
      const renuncia = () => { if (generacioRegistre === gen) generacioRegistre = 0; };
      /* R32.2 · Una baixa o un altre activa ha passat per davant: este activa
         no escriu res, revoca el testimoni que ja tenia (si cap activa viu
         posterior a la darrera baixa no ha arribat al pont) i torna inactiu,
         també si el desa ha rebutjat. */
      const obsolet = () => {
        renuncia();
        if (testimoni) revocaTarda(push);
        return { estat: ESTAT_PUSH_NATIU.INACTIU };
      };
      try {
        let permis = textDelPermis(await push.checkPermissions());
        if (gen !== generacioLocal) return { estat: ESTAT_PUSH_NATIU.INACTIU };
        if (permis === 'denied') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
        if (typeof desaAra !== 'function') return { estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR };
        if (PREGUNTABLES.has(permis) && opcions.gest !== false) permis = textDelPermis(await push.requestPermissions());
        if (gen !== generacioLocal) return { estat: ESTAT_PUSH_NATIU.INACTIU };
        if (permis !== 'granted') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
        deuBaixa();
        // Android despatxa el getToken de seguida (dins de testimoniDeTask); iOS, quan els oients són a punt (vigia.enviat).
        if (android) generacioRegistre = gen;
        testimoni = android ? await testimoniDeTask(cicle, topallMs, control.signal) : await testimoniDelRegistre(push, topallMs, control.signal, vigiaDe(gen, push));
        if (gen !== generacioLocal) return obsolet();
        if (!testimoni) return { estat: ESTAT_PUSH_NATIU.ERROR };
        await desaAra({ testimoni, plataforma: plataformaDe(nucli) });
        if (gen !== generacioLocal) return obsolet();
        testimoniDesat = testimoni;
        registrat = true;
        actiu = true;
        return { estat: ESTAT_PUSH_NATIU.ACTIU };
      } catch {
        return gen !== generacioLocal ? obsolet() : { estat: ESTAT_PUSH_NATIU.ERROR };
      } finally {
        if (controlRegistre === control) controlRegistre = null;
        if (!actiu) renuncia();
      }
    },
    /**
     * La baixa, NOMÉS si el pont té el connector (si no, 'sense-connector' i
     * cap crida): unregister, neteja dels avisos mostrats i retirada remota
     * arranquen independentment. Un pont natiu penjat no pot impedir que
     * la sessió encara vàlida revoque el registre al servidor. Es passa
     * retira({ testimoni, plataforma }) al servidor si este
     * adaptador coneix el testimoni. Torna inactiu, o error si unregister
     * falla (el testimoni continua viu; la retirada es fa igual). Mai llança
     * i mai torna el connector.
     */
    async desactiva(opcions = {}) {
      const gen = ++generacioLocal;
      generacioBaixa = gen;
      controlRegistre?.abort();
      controlRegistre = null;
      const push = connectorDe(nucli);
      if (!push) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      registrat = false;
      // Sanejament R15 (B3 · P1-03): res registrat en esta obertura, cap testimoni ni opt-in desat → cap crida nativa.
      if (!registreDemanat && !registreIncert && !testimoniDesat && opcions?.ambOptIn !== true) return { estat: ESTAT_PUSH_NATIU.INACTIU };
      // R32.2 (Peix 1) · Amb el registre incert, els oients de la guarda arriben al pont abans que l'unregister.
      vigilaBaixa(push);
      const retira = opcions && typeof opcions.retira === 'function' ? opcions.retira : null;
      const testimoni = testimoniDesat;
      const netejaMostrats = async () => {
        try { await push.removeAllDeliveredNotifications(); } catch { /* res a llevar */ }
      };
      const retiraRemot = async () => {
        if (!testimoni || !retira) return;
        try {
          await retira({ testimoni, plataforma: plataformaDe(nucli) });
          if (gen === generacioLocal && testimoniDesat === testimoni) testimoniDesat = null;
        } catch {
          /* de cortesia: es podrà tornar a provar */
        }
      };
      if (!baixaPont) {
        const feina = Promise.all([desfesNatiu(push), netejaMostrats()])
          .then(([desfet]) => desfet)
          .finally(() => { if (baixaPont === feina) baixaPont = null; });
        baixaPont = feina;
      }
      const [desfet] = await Promise.all([limitaBaixa(baixaPont, limitBaixaMs), limitaBaixa(retiraRemot(), limitBaixaMs)]);
      return { estat: desfet ? ESTAT_PUSH_NATIU.INACTIU : ESTAT_PUSH_NATIU.ERROR };
    },
    /**
     * La persona toca un avís: fn({}), sempre SENSE cap dada (ni el fil, ni
     * el text, ni el `desti` del servidor; D-B8C-1). Sense el connector torna
     * una funció buida i no crida el pont. La funció que torna deixa
     * d'escoltar: des d'eixe moment fn no es torna a cridar, encara que el
     * connector tarde a llevar l'oient. Mai llança.
     */
    async preparaCanal() {
      const push = connectorDe(nucli);
      const textos = (typeof canal === 'function' ? canal() : canal) || {};
      if (push && plataformaDe(nucli) === 'android') await push.createChannel({ id: 'xat', name: textos.nom || 'Missatges del xat', description: textos.descripcio || 'Avisos dels missatges nous de Sóc de Poble', importance: 4, visibility: 0, vibration: true, lights: true });
    },
    async neteja() {
      const push = connectorDe(nucli);
      if (push) await push.removeAllDeliveredNotifications();
    },
    escoltaPendent(fn) {
      const push = connectorDe(nucli);
      if (!push) return () => {};
      let viu = true;
      const avisa = () => { if (viu) fn(); };
      const oient = Promise.resolve(push.addListener('pushNotificationReceived', avisa));
      oient.catch(() => {});
      globalThis.document?.addEventListener?.('visibilitychange', avisa);
      return () => {
        viu = false;
        globalThis.document?.removeEventListener?.('visibilitychange', avisa);
        oient.then(m => m?.remove()).catch(() => {});
      };
    },
    escoltaRegistre(fn) {
      const push = connectorDe(nucli);
      if (!push || typeof fn !== 'function') return () => {};
      let viu = true;
      const android = plataformaDe(nucli) === 'android';
      const oient = Promise.resolve(push.addListener('registration', async d => {
        const gen = generacioLocal;
        let testimoni = d?.value;
        if (android) {
          if (!viu || baixaPont || !registrat) return;
          const cicle = cicleAndroidDe(nucli);
          if (!cicle) return;
          // El token de l'event pot ser retingut o anterior a una baixa.
          // És només un senyal: verificar el token vigent dins de la cua SDK.
          testimoni = await testimoniDeTask(cicle, topallMs);
        }
        if (!viu || gen !== generacioLocal || (android && (baixaPont || !registrat)) || typeof testimoni !== 'string' || !testimoni) return;
        deuBaixa();
        try { Promise.resolve(fn({ testimoni, plataforma: plataformaDe(nucli) })).catch(() => {}); } catch { /* el consumidor no tomba el pont */ }
      }));
      oient.catch(() => {});
      return () => { viu = false; oient.then(m => m?.remove()).catch(() => {}); };
    },
    escoltaToc(fn) {
      if (typeof fn !== 'function') return () => {};
      const push = connectorDe(nucli);
      if (!push) return () => {};
      let viu = true;
      let oient;
      try {
        oient = Promise.resolve(push.addListener(TOC_DEL_CONNECTOR, () => {
          if (!viu) return;
          try { fn({}); } catch { /* el toc no tomba res */ }
        }));
      } catch {
        return () => {};
      }
      oient.catch(() => {});
      return () => {
        if (!viu) return;
        viu = false;
        oient.then((mansa) => (mansa && typeof mansa.remove === 'function' ? mansa.remove() : undefined)).catch(() => {});
      };
    }
  };
}

/* Sanejament R15 (B3) · L'adaptador quan el build no porta VITE_SDP_PUSH_NATIU=1: la mateixa
   forma, cap crida al pont (ni registerPlugin), cap permís, cap oient. */
function adaptadorSenseConfig() {
  const senseConfig = async () => ({ estat: ESTAT_PUSH_NATIU.SENSE_CONFIG });
  const capOient = () => () => {};
  return {
    estat: senseConfig, activa: senseConfig, desactiva: senseConfig,
    async preparaCanal() {}, async neteja() {},
    escoltaPendent: capOient, escoltaRegistre: capOient, escoltaToc: capOient
  };
}

/* Cicle del registre: opt-in, canal, rotació i confirmació de lectures. */
export function adaptadorPushNatiuPerAlRegistre(push = null, opcions = {}) {
  const nucli = opcions && opcions.nucli !== undefined ? opcions.nucli : undefined;
  const ambNucli = nucli !== undefined ? { nucli } : {};
  const avisos = push && typeof push === 'object' ? push : creaAvisosPushNatius({ ...ambNucli, canal: opcions.canal });
  const estatPerAlRegistre = async () => {
    let resultat;
    try {
      resultat = await avisos.estat();
    } catch {
      return { estat: ESTAT_PUSH_NATIU.ERROR };
    }
    return resultat && resultat.estat === ESTAT_PUSH_NATIU.SENSE_SERVIDOR ? { estat: ESTAT_PUSH_NATIU.INACTIU } : resultat;
  };
  return cicleAvisosPush({
    avisos: { ...avisos, estat: estatPerAlRegistre },
    motiu: () => motiuPushNatiu(ambNucli),
    memoria: opcions.memoria || memoriaConsentimentPush(),
    visible: opcions.visible
  });
}
