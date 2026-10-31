/* Ordre nocturna 261030_0252 (Fase 3, WP) · L'adaptador dels avisos push de
   l'App, fase N1 i INERT: ningú no l'importa ni el registra (ni l'entrada
   nativa, ni el Xat, ni main.jsx) i cap servidor no rep testimonis.
   Sense npm install: el connector PushNotifications (el paquet oficial de
   Capacitor, amb FCM a Android i APNs a iOS) no és a l'App fins que el Mestre
   ho decidisca (D-WP-7). Fins llavors el pont diu que no hi és i l'estat és
   'sense-connector', net: cap crida al natiu i res a la consola.
   Del nucli del pont (ja instal·lat) només s'usen isPluginAvailable i
   registerPlugin, i registerPlugin només quan el connector hi és, una sola
   vegada per nucli (dos registres del mateix nom avisen a la consola).
   Compte: registerPlugin torna un Proxy que respon a qualsevol nom, també a
   `then` (avisosNatius.js). Una promesa que es resol AMB ell no es resol mai.
   Per això el connector només el torna una funció síncrona, i les asíncrones
   en tornen sempre un objecte pla.
   El mateix despertador cec que el web (src/pwa/avisosPush.js): el text de
   l'avís el posarà el servidor amb una clau de text localitzada a l'aparell,
   sense cap dada. Este adaptador no veu ni pinta cap avís.
   Estats, en este ordre: sense-connector; denegat (el permís, llegit sense
   preguntar); sense-servidor (sense `desa` no es pregunta ni es registra:
   demanar el permís seria prometre el que no passarà); actiu quan el servidor
   ha rebut el testimoni.
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

/* Els permisos que encara es poden preguntar. */
const PREGUNTABLES = new Set(['prompt', 'prompt-with-rationale']);

/* Un connector per nucli: el registre de Capacitor és global i un segon
   registerPlugin del mateix nom avisa a la consola. */
const CONNECTORS = new WeakMap();

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
 * L'adaptador dels avisos push de l'App. Inert fins que algú el registre.
 * @param {{ nucli?: { Capacitor: object, registerPlugin: Function },
 *   desa?: ((dades: { testimoni: string, plataforma: (string|null) }) => Promise<unknown>)|null,
 *   topallMs?: number }} [opcions]
 *   `nucli`: el del pont (per defecte, el de @capacitor/core). `desa`: el
 *   servidor que rep el testimoni; sense, 'sense-servidor'.
 * @returns {{ estat(): Promise<{ estat: string }>, activa(): Promise<{ estat: string }>,
 *   desactiva(opcions?: { retira?: (dades: { testimoni: string, plataforma: (string|null) }) => Promise<unknown> }) => Promise<{ estat: string }> }}
 */
export function creaAvisosPushNatius({ nucli = { Capacitor, registerPlugin }, desa = null, topallMs = TOPALL_TESTIMONI_MS } = {}) {
  /* El testimoni que este adaptador ha passat al servidor, només en memòria
     (no s'escriu enlloc) i fins que el servidor en confirma la retirada:
     desactiva el dona a retira. Després de reobrir l'App no se sap: el
     testimoni mor amb unregister i el servidor l'esborrarà quan FCM o APNs
     el rebutgen. */
  let testimoniDesat = null;
  return {
    /** L'estat sense preguntar res ni registrar res. Mai llança. */
    async estat() {
      const push = connectorDe(nucli);
      if (!push) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      try {
        const permis = textDelPermis(await push.checkPermissions());
        if (permis === 'denied') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
        if (typeof desa !== 'function') return { estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR };
        return { estat: ESTAT_PUSH_NATIU.INACTIU };
      } catch {
        return { estat: ESTAT_PUSH_NATIU.ERROR };
      }
    },
    /**
     * Activa els avisos des d'un gest de la persona: pregunta el permís si
     * encara es pot, registra l'aparell i passa el testimoni al servidor.
     * Mai llança.
     */
    async activa() {
      const push = connectorDe(nucli);
      if (!push) return { estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR };
      try {
        let permis = textDelPermis(await push.checkPermissions());
        if (permis === 'denied') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
        if (typeof desa !== 'function') return { estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR };
        if (PREGUNTABLES.has(permis)) permis = textDelPermis(await push.requestPermissions());
        if (permis !== 'granted') return { estat: ESTAT_PUSH_NATIU.DENEGAT };
        const testimoni = await testimoniDelRegistre(push, topallMs);
        if (!testimoni) return { estat: ESTAT_PUSH_NATIU.ERROR };
        await desa({ testimoni, plataforma: plataformaDe(nucli) });
        testimoniDesat = testimoni;
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
    }
  };
}
