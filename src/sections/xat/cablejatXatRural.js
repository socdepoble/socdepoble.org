import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { entradaSessio } from '../../data/identitat.js';
import { esperaReintent, interromEnviaments } from './missatges.js';
import { creaServeiXat } from '../../data/xat/serveiXat.js';
import {
  aplicaCursorDestinatari, confirmaEnviamentServidor, construeixAmbitCuaRural,
  creaRegistreMissatgeRural, marcaErrorReintentable, preparaReintentMissatge,
} from '../../data/xat/estatSincronitzacioRural.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ESTATS_UI = Object.freeze({
  cua_local: 'pendent', error_reintentable: 'error', enviat_servidor: 'enviat',
  entregat_destinatari: 'lliurat', llegit_destinatari: 'llegit',
});

/** Espera `ms` o fins que el senyal s'aborte. Torna false en avortar. */
function espera(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(false); return; }
    let temporitzador = null;
    const alAbortar = () => { clearTimeout(temporitzador); resolve(false); };
    temporitzador = setTimeout(() => {
      signal?.removeEventListener('abort', alAbortar);
      resolve(true);
    }, ms);
    signal?.addEventListener('abort', alAbortar, { once: true });
  });
}

/* XC-03 · Un true de navigator.onLine no acredita cap ACK. */
const senseXarxa = () => typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine === false;
function esperaXarxa(signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(false); return; }
    const acaba = (valor) => {
      window.removeEventListener('online', alTornar);
      document.removeEventListener('visibilitychange', alVeure);
      document.removeEventListener('resume', alTornar);
      signal?.removeEventListener('abort', alAbortar);
      resolve(valor);
    };
    const alTornar = () => acaba(true);
    const alVeure = () => { if (!document.hidden) acaba(true); };
    const alAbortar = () => acaba(false);
    window.addEventListener('online', alTornar);
    document.addEventListener('visibilitychange', alVeure);
    document.addEventListener('resume', alTornar);
    signal?.addEventListener('abort', alAbortar, { once: true });
  });
}

/** Adaptador diferit del proveïdor real; la cua de la UI continua en memòria.
 * Cap ACK es deduïx de l'estat de xarxa ni d'un HTTP satisfactori sense seq.
 * El token i l'actor es consulten en viu, també abans de la neteja d'efectes.
 */
export function creaCablejatXatRural({ obteToken, obteOperacio, enviaMissatge, refreshSession }) {
  let ambit = null;
  let tancat = false;
  const registres = new Map();
  const enVol = new Set();
  /* R32 · F7 · Els que el motor E2EE ha desat a la safata del dispositiu. */
  const encuats = new Set();
  const contextViu = () => {
    const token = obteToken();
    return {
      backend: backendScope(token.config), tenantId: normalizeBackendConfig(token.config).tenantId,
      usuariId: token.jo, actorOrgId: token.actor, generacioLogin: entradaSessio(),
      autenticat: Boolean(token.jo),
    };
  };
  const servei = creaServeiXat({
    ...(enviaMissatge ? { enviaMissatge } : {}),
    ...(refreshSession ? { refreshSession } : {}),
    obteContextSessio: contextViu,
    obteActorOrgId: () => obteToken().actor,
  });
  function sincronitzaParticio() {
    const token = obteToken();
    const clau = JSON.stringify([token.ambit, entradaSessio()]);
    if (ambit !== clau) {
      registres.clear();
      enVol.clear();
      encuats.clear();
      servei.netejaEmpremtes();
      ambit = clau;
    }
  }
  function particio() {
    sincronitzaParticio();
    return construeixAmbitCuaRural(contextViu());
  }
  function operacioViva(origen) {
    const actual = obteOperacio();
    return actual?.llinatge === origen.llinatge && actual.token === obteToken()
      && !actual.controller.signal.aborted ? actual : null;
  }
  const cancelada = () => Object.assign(new Error('L’àmbit de l’enviament ja no és vigent.'), {
    codi: 'OPERACIO_CANCELADA', retriable: false,
  });

  async function envia(origen, filId, entrada, opcions) {
    if (tancat) throw Object.assign(new Error('El servei del xat està tancat.'), { codi: 'SERVEI_TANCAT', retriable: false });
    if (!operacioViva(origen)) throw cancelada();
    const particioOrigen = particio();
    const generacioOrigen = ambit;
    let registre = registres.get(entrada.id) || creaRegistreMissatgeRural({
      ambit: particioOrigen, filId, clientMsgId: entrada.id, ...entrada,
    });
    registre = preparaReintentMissatge(registre);
    registres.set(entrada.id, registre);
    enVol.add(entrada.id);
    try {
      const desat = await servei.enviaMissatge(filId, entrada, {
        ...opcions,
        // El senyal vell pot caure per renovació. El servei té controlador
        // propi i seguix el relleu vigent sense reenviar el transport en vol.
        signal: undefined,
        obteSenyalIntent: () => operacioViva(origen)?.controller.signal ?? null,
      });
      const op = operacioViva(origen);
      if (!op || particio() !== particioOrigen || ambit !== generacioOrigen) throw cancelada();
      /* R32 · F7 · Amb les claus bloquejades, el motor E2EE desa el missatge a
         la safata del dispositiu i torna { id, filId, encuat: true } sense seq
         (xifratXatPipeline.js, encua). Ni ✓ ni error: el registre es queda en
         cua_local i la bombolla, 'pendent'. Una renovació no la passa a error
         (interromp), perquè «Descarta» no pot traure-la de la safata. Només
         amb el mateix id i fil; qualsevol altra forma passa per l'ACK estricte. */
      if (desat?.encuat === true && String(desat.id).toLowerCase() === registre.client_msg_id && desat.filId === filId) {
        encuats.add(entrada.id);
        return { desat, op, encuat: true };
      }
      registre = confirmaEnviamentServidor(registre, desat);
      registres.set(entrada.id, registre);
      return { desat, op };
    } catch (error) {
      if (operacioViva(origen) && particio() === particioOrigen && ambit === generacioOrigen) {
        registres.set(entrada.id, marcaErrorReintentable(registre, error));
      }
      throw error;
    } finally {
      if (ambit === generacioOrigen) enVol.delete(entrada.id);
    }
  }

  function projecta(missatges, fil) {
    if (tancat) return missatges;
    const token = obteToken();
    sincronitzaParticio();
    if (!token.jo) return missatges;
    const particioActual = particio();
    return missatges.map((m) => {
      // La llavor històrica conserva ids locals: no se'ls inventa un UUID.
      if (m.sender !== 'me' || !UUID.test(m.id)) return m;
      let registre = registres.get(m.id);
      if (!registre) registre = creaRegistreMissatgeRural({
        ambit: particioActual, filId: m.threadId, clientMsgId: m.id, ...m,
      });
      if (Number.isSafeInteger(m.seq) && m.seq > 0) {
        registre = confirmaEnviamentServidor(registre, { id: m.id, seq: m.seq, creatEl: m.creatAl });
        // El cursor propi només equival a lectura en el fil personal, on la
        // persona és l'únic destinatari. En la resta només val el dels altres.
        registre = aplicaCursorDestinatari(registre, {
          rebutPelsAltresFinsSeq: fil?.esPropi ? null : fil?.rebutPelsAltresFinsSeq,
          llegitPelsAltresFinsSeq: fil?.esPropi
            ? Math.max(fil.llegitFinsSeq ?? 0, fil.ultimSeq ?? 0, fil.llegitPelsAltresFinsSeq ?? 0)
            : fil?.llegitPelsAltresFinsSeq,
        });
      } else if (m.estatEnviament === 'error' && registre.estat !== 'error_reintentable') {
        registre = marcaErrorReintentable(registre, { message: m.error });
      }
      registres.set(m.id, registre);
      const estatEnviament = registre.estat === 'error_reintentable' && m.estatEnviament === 'pendent'
        ? 'pendent' : ESTATS_UI[registre.estat];
      return { ...m, estatEnviament, estatSincronitzacio: registre.estat, persistitLocal: false };
    });
  }

  function interromp(pendents) {
    const aturats = interromEnviaments(pendents);
    if (!enVol.size && !encuats.size) return aturats;
    return Object.fromEntries(Object.entries(aturats).map(([filId, llista]) => [filId,
      llista.map((m) => enVol.has(m.id) || encuats.has(m.id) ? pendents[filId].find((anterior) => anterior.id === m.id) : m),
    ]));
  }
  function revalida() {
    if (tancat) return;
    sincronitzaParticio();
    servei.revalidaEnVol();
  }
  function tanca() {
    tancat = true;
    servei.tanca();
    servei.netejaEmpremtes();
    registres.clear();
    enVol.clear();
    encuats.clear();
    ambit = null;
  }
  return Object.freeze({
    envia, projecta, interromp, senseXarxa, esperaXarxa,
    esperaReintent: (intent, signal) => espera(esperaReintent(intent), signal),
    revalida, tanca,
  });
}
