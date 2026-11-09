/* R54 · Transport oficial PushNotifications8.1.3. El pont és inert sense
   connector; permisos només per gest explícit. El cicle recupera únicament
   l’opt-in del mateix compte. Tokens només en memòria; avís i toc cecs. */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { cicleAvisosPush } from './cicleAvisosPush.js';
import { memoriaConsentimentPush } from './consentimentPush.js';

export const CONNECTOR_PUSH = 'PushNotifications';

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

/* L'esdeveniment del connector quan la persona toca un avís. */
const TOC_DEL_CONNECTOR = 'pushNotificationActionPerformed';

/* Les plataformes que el servidor accepta per a un testimoni natiu (B8-SERVIDOR §2.9). */
/* Els permisos que encara es poden preguntar. */
const PREGUNTABLES = new Set(['prompt', 'prompt-with-rationale']);

/* Un connector per nucli: el registre de Capacitor és global i un segon
   registerPlugin del mateix nom avisa a la consola. */
const CONNECTORS = new WeakMap();

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
   topall. Els oients es lleven sempre. El testimoni no s'escriu enlloc. */
function testimoniDelRegistre(push, topallMs) {
  return new Promise((resol) => {
    const oients = [];
    let rellotge = null;
    let acabat = false;
    const acaba = (testimoni) => {
      if (acabat) return;
      acabat = true;
      clearTimeout(rellotge);
      for (const oient of oients) {
        Promise.resolve(oient).then((mansa) => (mansa && typeof mansa.remove === 'function' ? mansa.remove() : undefined)).catch(() => {});
      }
      resol(typeof testimoni === 'string' && testimoni ? testimoni : null);
    };
    const escolta = (nom, funcio) => {
      const oient = push.addListener(nom, funcio);
      oients.push(oient);
      Promise.resolve(oient).catch(() => acaba(null));
    };
    rellotge = setTimeout(() => acaba(null), topallMs);
    try {
      escolta('registration', (dada) => acaba(dada && dada.value));
      escolta('registrationError', () => acaba(null));
    } catch {
      acaba(null);
      return;
    }
    Promise.resolve().then(() => push.register()).catch(() => acaba(null));
  });
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
    return pont.isPluginAvailable(CONNECTOR_PUSH) ? null : ESTAT_PUSH_NATIU.SENSE_CONNECTOR;
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
export function creaAvisosPushNatius({ nucli = nucliPerDefecte(), desa = null, topallMs = TOPALL_TESTIMONI_MS, canal = null } = {}) {
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
  return {
    /** L'estat sense preguntar res ni registrar res. Mai llança. */
    async estat() {
      const push = connectorDe(nucli);
      if (!push) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
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
      const desaAra = opcions && typeof opcions.desa === 'function' ? opcions.desa : desa;
      const push = connectorDe(nucli);
      if (!push) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      try {
        let permis = textDelPermis(await push.checkPermissions());
        if (permis === 'denied') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
        if (typeof desaAra !== 'function') return { estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR };
        if (PREGUNTABLES.has(permis) && opcions.gest !== false) permis = textDelPermis(await push.requestPermissions());
        if (permis !== 'granted') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
        registreDemanat = true;
        const testimoni = await testimoniDelRegistre(push, topallMs);
        if (!testimoni) return { estat: ESTAT_PUSH_NATIU.ERROR };
        await desaAra({ testimoni, plataforma: plataformaDe(nucli) });
        testimoniDesat = testimoni;
        registrat = true;
        return { estat: ESTAT_PUSH_NATIU.ACTIU };
      } catch {
        return { estat: ESTAT_PUSH_NATIU.ERROR };
      }
    },
    /**
     * La baixa, NOMÉS si el pont té el connector (si no, 'sense-connector' i
     * cap crida): primer unregister, que mata el testimoni; després lleva els
     * avisos ja mostrats (a Android és cancelAll: tots els de l'App, que avui
     * són tots del Xat, com fa ja netejaAvisos d'avisosNatius.js); i, de
     * cortesia, retira({ testimoni, plataforma }) al servidor si este
     * adaptador coneix el testimoni. Torna inactiu, o error si unregister
     * falla (el testimoni continua viu; la retirada es fa igual). Mai llança
     * i mai torna el connector.
     */
    async desactiva(opcions = {}) {
      const push = connectorDe(nucli);
      if (!push) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      registrat = false;
      // Sanejament R15 (B3 · P1-03): res registrat en esta obertura, cap testimoni ni opt-in desat → cap crida nativa.
      if (!registreDemanat && !testimoniDesat && opcions?.ambOptIn !== true) return { estat: ESTAT_PUSH_NATIU.INACTIU };
      const retira = opcions && typeof opcions.retira === 'function' ? opcions.retira : null;
      let desfet = true;
      try {
        await push.unregister();
        registreDemanat = false;
      } catch {
        desfet = false;
      }
      try {
        await push.removeAllDeliveredNotifications();
      } catch {
        /* res a llevar */
      }
      const testimoni = testimoniDesat;
      if (testimoni && retira) {
        try {
          await retira({ testimoni, plataforma: plataformaDe(nucli) });
          if (testimoniDesat === testimoni) testimoniDesat = null;
        } catch {
          /* de cortesia: es podrà tornar a provar */
        }
      }
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
      const oient = Promise.resolve(push.addListener('registration', d => {
        if (typeof d?.value === 'string' && d.value) registreDemanat = true; // un testimoni viu d'esta obertura
        if (viu) Promise.resolve(fn({ testimoni: d?.value, plataforma: plataformaDe(nucli) })).catch(() => {});
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
