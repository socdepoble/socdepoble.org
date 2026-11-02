/* B8C-3 (marató 261101_2143; Bloc B8, ordre del Mestre 261101) · L'adaptador
   web dels avisos push del Xat: endolla la subscripció de la fase N1
   (src/pwa/avisosPush.js) al registre neutre (src/config/avisosPushXat.js)
   amb el contracte d'adaptador de B8-CLIENT §3.

   Només el carrega src/main.jsx, amb import() i darrere de la bandera
   AVISOS_PUSH_XAT_ACTIUS: apagada, Rollup no el posa en cap tros. Tot el que
   toca el navegador li arriba injectat: el registre del worker
   (registreActiu per a SUBSCRIURE, registreDelSw per a la baixa,
   l'interruptor i la neteja; tots dos de src/pwa/registre.js, l'únic fitxer
   que pot nomenar el worker), la clau pública VAPID del build, la decisió de
   producció i el nom de l'esdeveniment del toc.

   Regles:
     · activa és SÍNCRONA fins a Notification.requestPermission(): cap espera
       ni cap import() pel camí, o Safari i Firefox perden el gest;
     · al servidor només hi va { plataforma: 'web', adreca, caducaMs, gest }:
       les claus de la subscripció no ixen mai d'ací;
     · gest és cert des d'activa (el gest de la persona) i fals des de
       sincronitza (el registre el torna a fixar igualment);
     · si motiu() diu que no s'oferix, activa no pregunta i sincronitza desfà;
       totes dues, com estat(), diuen no-oferit (un error de la baixa, no);
     · el toc no porta cap dada: escoltaToc crida fn({}), sense res de
       l'esdeveniment. */
import {
  ESTAT_PUSH, activaAvisosPush, desactivaAvisosPush, motiuPerNoOferirPush, netejaAvisosPush, oblidaDesatsPush, sincronitzaAvisosPush
} from './avisosPush.js';

/* L'estat del registre (ESTAT_AVISOS) quan no s'oferix; avisosPush.js no el té. */
const NO_OFERIT = 'no-oferit';

/**
 * L'adaptador web, congelat. `registreActiu` i `registreDelSw` reben
 * { navegador } i tornen el registre del worker propi o null.
 */
export function creaAvisosPushWeb({
  registreActiu, registreDelSw, clau, produccio, esdevenimentToc,
  finestra = globalThis.window, navegador = globalThis.navigator
} = {}) {
  const registreDe = (resol) => () => (typeof resol === 'function' ? resol({ navegador }) : null);
  const perSubscriure = registreDe(registreActiu);
  const perDesfer = registreDe(registreDelSw);

  /* Per què no s'oferix, o null. SÍNCRON i sense xarxa (el registre el llig en cada canvi). */
  const motiu = () => motiuPerNoOferirPush({ produccio, actiu: true, clau, finestra, navegador });

  /* El desat i la retirada del registre, amb la forma del servidor (cap clau de la subscripció). */
  const desaAmb = (desa, gest) => (typeof desa === 'function'
    ? (forma) => desa({ plataforma: 'web', adreca: forma.endpoint, caducaMs: forma.caducaMs, gest })
    : undefined);
  const retiraAmb = (retira) => (typeof retira === 'function'
    ? (forma) => retira({ plataforma: 'web', adreca: forma.endpoint })
    : null);

  return Object.freeze({
    tipus: 'web',
    motiu,

    /* L'estat d'este aparell, sense preguntar res. Mai llança. */
    async estat() {
      try {
        const perque = motiu();
        if (perque) return { estat: NO_OFERIT, motiu: perque };
        const permis = finestra.Notification.permission;
        if (permis === 'denied') return { estat: ESTAT_PUSH.DENEGAT };
        if (permis !== 'granted') return { estat: ESTAT_PUSH.INACTIU };
        /* Sense registre no se sap si hi ha subscripció: mai un inactiu fals. */
        const registre = await perDesfer();
        if (!registre || !registre.pushManager || typeof registre.pushManager.getSubscription !== 'function') return { estat: ESTAT_PUSH.SENSE_WORKER };
        return (await registre.pushManager.getSubscription()) ? { estat: ESTAT_PUSH.ACTIU } : { estat: ESTAT_PUSH.INACTIU };
      } catch {
        return { estat: ESTAT_PUSH.ERROR };
      }
    },

    /* Des del GEST: sense async ni cap espera abans de requestPermission(). */
    activa({ desa } = {}) {
      if (motiu()) return Promise.resolve({ estat: NO_OFERIT });
      return activaAvisosPush({ registre: perSubscriure, finestra, navegador, clau, desa: desaAmb(desa, true) });
    },

    /* La baixa: unsubscribe i, amb `retira`, la retirada de cortesia. Sense `retira`, només local. */
    desactiva({ retira } = {}) {
      return desactivaAvisosPush({ registre: perDesfer, retira: retiraAmb(retira) });
    },

    /* Mai pregunta. Sense servidor o sense oferta fa d'interruptor (desfà).
       Sense oferta, el que no és un error diu no-oferit, com estat(): el
       registre publica este resultat, i un sense-worker (Safari d'iOS sense
       instal·lar no té pushManager) contradiria la nota d'instal·lar. */
    sincronitza({ actiu, desa, retira, ambit } = {}) {
      const perque = motiu();
      const fet = sincronitzaAvisosPush({
        registre: perDesfer, finestra, actiu: actiu === true && !perque, clau,
        desa: desaAmb(desa, false), retira: retiraAmb(retira), ambit
      });
      return perque ? fet.then((r) => (r && r.estat !== ESTAT_PUSH.ERROR ? { estat: NO_OFERIT } : r)) : fet;
    },

    neteja() {
      return netejaAvisosPush({ registre: perDesfer, navegador });
    },

    oblida() {
      oblidaDesatsPush();
    },

    /* El toc d'un avís, sense cap dada de l'esdeveniment. Torna la funció que deixa d'escoltar. */
    escoltaToc(fn) {
      if (typeof fn !== 'function' || typeof esdevenimentToc !== 'string' || !esdevenimentToc ||
        !finestra || typeof finestra.addEventListener !== 'function') return () => {};
      const toc = () => {
        try { fn({}); } catch { /* un oient trencat no talla la pàgina */ }
      };
      finestra.addEventListener(esdevenimentToc, toc);
      return () => {
        if (typeof finestra.removeEventListener === 'function') finestra.removeEventListener(esdevenimentToc, toc);
      };
    }
  });
}
