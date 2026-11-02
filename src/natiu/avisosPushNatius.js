/* Ordre nocturna 261030_0252 (Fase 3, WP) · L'adaptador dels avisos push de
   l'App. Fase N2 (B8-CLIENT, marató 261101_2143): només l'importa l'entrada
   nativa (src/natiu/entrada.jsx), darrere de la bandera AVISOS_PUSH_XAT_ACTIUS
   i amb una importació dinàmica, i el registre neutre (src/config/avisosPushXat.js) el rep
   embolcallat amb adaptadorPushNatiuPerAlRegistre.
   Sense npm install: el connector PushNotifications (el paquet oficial de
   Capacitor, amb FCM a Android i APNs a iOS) no és a l'App fins que el Mestre
   ho decidisca (D-WP-7, D-B8C-3). Fins llavors el pont diu que no hi és,
   motiuPushNatiu() diu 'sense-connector' i tot és net: cap interruptor, cap
   crida al natiu i res a la consola.
   Del nucli del pont (ja instal·lat) només s'usen isPluginAvailable i
   registerPlugin, i registerPlugin només quan el connector hi és, una sola
   vegada per nucli (dos registres del mateix nom avisen a la consola).
   Compte: registerPlugin torna un Proxy que respon a qualsevol nom, també a
   `then` (avisosNatius.js). Una promesa que es resol AMB ell no es resol mai.
   Per això el connector només el torna una funció síncrona, i les asíncrones
   en tornen sempre un objecte pla.
   El mateix despertador cec que el web (src/pwa/avisosPush.js): el text de
   l'avís el posa el servidor, literal i sense cap dada (B8-SERVIDOR §2.6).
   Este adaptador no veu ni pinta cap avís, i el toc (escoltaToc) arriba sense
   cap dada: la del connector (també el `desti` del servidor) s'ignora a posta.
   Estats, en este ordre: sense-connector; denegat (el permís, llegit sense
   preguntar); actiu si el testimoni d'esta obertura de l'App és al servidor;
   sense-servidor (sense `desa` no es pregunta ni es registra: demanar el
   permís seria prometre el que no passarà); inactiu.
   La baixa (desactiva, Gauntlet matinal 261030: ALT-01.2 de Gemini i
   MILLORA-C10 de Codex), també només amb el connector al pont: unregister (a
   Android esborra el testimoni de FCM; a iOS dona de baixa l'APNs), lleva els
   avisos ja mostrats i, de cortesia, retira el testimoni al servidor. */
import { Capacitor, registerPlugin } from '@capacitor/core';

export const CONNECTOR_PUSH = 'PushNotifications';

export const ESTAT_PUSH_NATIU = Object.freeze({
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
const PLATAFORMES_NATIVES = new Set(['ios', 'android']);

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
 * Per què el registre no ha d'oferir els avisos push de l'App: 'sense-connector'
 * si el pont no té el connector PushNotifications, o null si el té.
 * SÍNCRONA i sense efectes (B8-CLIENT, ARB-06): només isPluginAvailable, mai
 * registerPlugin, cap permís ni cap xarxa. Mai llança.
 * @param {{ nucli?: { Capacitor: object, registerPlugin: Function } }} [opcions]
 * @returns {('sense-connector'|null)}
 */
export function motiuPushNatiu(opcions = {}) {
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
export function creaAvisosPushNatius({ nucli = nucliPerDefecte(), desa = null, topallMs = TOPALL_TESTIMONI_MS } = {}) {
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
        if (PREGUNTABLES.has(permis)) permis = textDelPermis(await push.requestPermissions());
        if (permis !== 'granted') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
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
      const retira = opcions && typeof opcions.retira === 'function' ? opcions.retira : null;
      let desfet = true;
      try {
        await push.unregister();
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

/* Un testimoni sense plataforma coneguda no es desa: el servidor el
   rebutjaria igual (SDP-PUSH-002) i és millor no enviar-lo. */
function desaPerAlRegistre(desa, dades) {
  const testimoni = dades && dades.testimoni;
  const plataforma = dades && dades.plataforma;
  if (!PLATAFORMES_NATIVES.has(plataforma) || typeof testimoni !== 'string' || !testimoni) {
    return Promise.reject(Object.assign(new Error('Plataforma de push desconeguda.'), { code: 'AVISOS_INVALID', codi: 'AVISOS_INVALID' }));
  }
  return Promise.resolve().then(() => desa({ plataforma, adreca: testimoni, caducaMs: null, gest: true }));
}

/**
 * L'adaptador natiu amb la forma del registre neutre (src/config/avisosPushXat.js,
 * B8-CLIENT §3): { tipus, motiu, estat, activa, desactiva, sincronitza,
 * neteja, oblida, escoltaToc }. El servidor el porta el registre a cada crida
 * (desa i retira de la persona de la sessió), per això l'adaptador es
 * construïx sense `desa`.
 *   · motiu(): motiuPushNatiu, SÍNCRON;
 *   · estat(): 'sense-servidor' es diu 'inactiu' (AUTO-02);
 *   · activa({ desa }): desa({ plataforma, adreca, caducaMs: null, gest: true });
 *   · desactiva({ retira }): retira({ plataforma, adreca }), o només la baixa local;
 *   · sincronitza(): només l'estat. MAI registra cap testimoni sense gest
 *     (D-B8C-12: a Android el permís és el mateix dels avisos locals).
 * @param {object|null} [push] un adaptador de creaAvisosPushNatius (per defecte, un de nou)
 * @param {{ nucli?: { Capacitor: object, registerPlugin: Function } }} [opcions]
 */
export function adaptadorPushNatiuPerAlRegistre(push = null, opcions = {}) {
  const nucli = opcions && opcions.nucli !== undefined ? opcions.nucli : undefined;
  const ambNucli = nucli !== undefined ? { nucli } : {};
  const avisos = push && typeof push === 'object' ? push : creaAvisosPushNatius(ambNucli);
  const estatPerAlRegistre = async () => {
    let resultat;
    try {
      resultat = await avisos.estat();
    } catch {
      return { estat: ESTAT_PUSH_NATIU.ERROR };
    }
    return resultat && resultat.estat === ESTAT_PUSH_NATIU.SENSE_SERVIDOR ? { estat: ESTAT_PUSH_NATIU.INACTIU } : resultat;
  };
  return Object.freeze({
    tipus: 'natiu',
    motiu: () => motiuPushNatiu(ambNucli),
    estat: estatPerAlRegistre,
    activa: (crida = {}) => {
      const desa = crida && typeof crida.desa === 'function' ? crida.desa : null;
      return avisos.activa({ desa: desa ? (dades) => desaPerAlRegistre(desa, dades) : undefined });
    },
    desactiva: (crida = {}) => {
      const retira = crida && typeof crida.retira === 'function' ? crida.retira : null;
      return avisos.desactiva({ retira: retira ? ({ testimoni, plataforma }) => retira({ plataforma, adreca: testimoni }) : null });
    },
    sincronitza: () => estatPerAlRegistre(),
    neteja: async () => {},
    oblida: () => {},
    escoltaToc: (fn) => avisos.escoltaToc(fn)
  });
}
