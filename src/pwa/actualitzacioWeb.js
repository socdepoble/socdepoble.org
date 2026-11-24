/**
 * pwa/actualitzacioWeb.js — Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026:
 * «actualització automàtica real») · L'avís d'un toc quan socdepoble.org ja servix una versió web
 * més nova que la que té carregada esta pestanya o esta PWA instal·lada.
 *
 * QUÈ · Un GET del mateix origen a /versio-viva.json (versioSistema, la versió de package.json del
 * build desplegat: la porta CEV-2 la lliga a package.json). Si és més nova que VERSIO_SISTEMA (la
 * del codi carregat), publica l'avís al registre de sempre (config/actualitzacioRecomanada.js, amb
 * FONT_WEB) i avisa la finestra (ESDEVENIMENT_ACTUALITZACIO_WEB) perquè App.jsx carregue la barra,
 * que a la web no viatja a l'arrencada. Una sola barra (lliçó 261007), la mateixa de l'App nativa.
 *
 * EL TOC · Prepara el worker (el que hi haja en espera, si n'hi ha: ho fa registre.js, l'únic fitxer
 * que el pot nomenar) amb un tall curt i recarrega la pàgina. És la persona qui ho demana: el
 * missatge diu la versió i el botó, què passarà.
 * P0123-05 · Recarregar buida el que només viu en memòria (l'esborrany d'una conversa que ja no es
 * veu, l'informe d'«Informa d'un error»). Abans, el toc passa per la mateixa comprovació que veta la
 * recàrrega de la recuperació de desplegament: el registre d'estatsPendents.js (hiHaEstatPendent).
 * Amb estat pendent, el navegador pregunta (confirm, en la llengua triada) i diu què es perdrà; si la
 * persona no ho accepta, o no es pot preguntar, no es recarrega. Una recàrrega que el navegador
 * cancel·la (un beforeunload amb text sense desar) deixa la pàgina viva: passat el tall, el botó
 * torna a funcionar.
 *
 * QUAN · En carregar (el crida registre.js després de `load`, només a l'entrada pròpia i en
 * producció), en tornar a primer pla, en tornar la xarxa i, mentre la pestanya és visible, cada
 * hora. Mai dues consultes alhora; una consulta bona gasta la franja sencera (10 min), una de
 * fallida torna a deixar provar al cap d'un minut.
 *
 * COM · Fail-silent: sense xarxa, amb un tall, un no 2xx, un JSON trencat o massa gran, res. Cap
 * galeta, cap Referer, revalidació (no-cache). Cap nom del worker ni de la Cache API (frontera de
 * registre.test.js). Mai llança ni escriu a la consola.
 */
import {
  CANALS_ACTUALITZACIO,
  FONT_WEB,
  fixaRecarregaWeb,
  publicaActualitzacioRecomanada
} from '../config/actualitzacioRecomanada.js';
import { llegeixIdiomaTriat, resolIdioma } from '../config/i18n.js';
import { comparaSemver, consultaJsonPublic, llegixVersioViva, ordinalSemver } from '../config/manifestVersio.js';
import { VERSIO_SISTEMA } from '../config/versio.js';
import { hiHaEstatPendent } from './estatsPendents.js';

export const URL_VERSIO_VIVA = '/versio-viva.json';
/* App.jsx (BarraActualitzacioDiferida) escolta este nom literal: App.barraActualitzacioDiferida.test.jsx
   comprova que és el mateix. */
export const ESDEVENIMENT_ACTUALITZACIO_WEB = 'sdp:actualitzacio-web';
export const TEMPS_MAXIM_CONSULTA_WEB_MS = 5000;
export const INTERVAL_MINIM_WEB_MS = 10 * 60 * 1000;
export const INTERVAL_PERIODIC_WEB_MS = 60 * 60 * 1000;
export const RETROCES_FALLADA_WEB_MS = 60 * 1000;
export const ESPERA_WORKER_MS = 1500;
export const MIDA_MAXIMA_VERSIO_VIVA = 16 * 1024;

/* P0123-05 · La pregunta abans de recarregar amb estat pendent, en les cinc llengües (este tros es carrega
   per import(): no viatja a l'arrencada). Diu què es perdrà. */
export const TEXTOS_PENDENTS_WEB = Object.freeze({
  ca: 'Hi ha text a mig escriure que encara no s’ha enviat (per exemple, un missatge en una altra conversa). Si carregues ara la versió nova, es perdrà. Vols carregar-la igualment?',
  es: 'Hay texto a medio escribir que aún no se ha enviado (por ejemplo, un mensaje en otra conversación). Si cargas ahora la versión nueva, se perderá. ¿Quieres cargarla igualmente?',
  en: 'There is unsent text you were still writing (for example, a message in another conversation). If you load the new version now, it will be lost. Load it anyway?',
  eu: 'Bidali gabeko testua dago, idazten ari zinena (adibidez, beste elkarrizketa bateko mezu bat). Bertsio berria orain kargatzen baduzu, galdu egingo da. Hala ere kargatu nahi duzu?',
  gl: 'Hai texto a medio escribir que aínda non se enviou (por exemplo, unha mensaxe noutra conversa). Se cargas agora a versión nova, perderase. Queres cargala igualmente?'
});

/** La pregunta de TEXTOS_PENDENTS_WEB en `llengua` (valencià si no se sap). Pur. */
export function textPendentsWeb(llengua) {
  const codi = String(llengua || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_PENDENTS_WEB, codi) ? TEXTOS_PENDENTS_WEB[codi] : TEXTOS_PENDENTS_WEB.ca;
}

/* La llengua de la interfície a l'entrada pròpia (sense amfitrió): la triada, o el valencià (i18n.js). */
const llenguaDeLaInterficie = () => resolIdioma({ triat: llegeixIdiomaTriat() });

/** L'avís de la barra si la versió servida és més nova que la carregada; si no, null. Pur. */
export function novaVersioWeb(versioServida, versioCarregada = VERSIO_SISTEMA) {
  const ordre = comparaSemver(versioServida, versioCarregada);
  if (ordre === null || ordre <= 0) return null;
  const versioRecomanada = ordinalSemver(versioServida);
  if (versioRecomanada === null) return null;
  return { plataforma: 'web', canal: CANALS_ACTUALITZACIO.WEB, versioRecomanada, versio: versioServida };
}

/** La versió servida (o null): un GET acotat de versio-viva.json. Mai llança. */
export async function consultaVersioViva({ fetchImpl, url = URL_VERSIO_VIVA, tempsMaxim = TEMPS_MAXIM_CONSULTA_WEB_MS, rellotge = globalThis } = {}) {
  return llegixVersioViva(await consultaJsonPublic({ fetchImpl, url, tempsMaxim, midaMaxima: MIDA_MAXIMA_VERSIO_VIVA, rellotge }));
}

/**
 * Engega l'avís de la web. Torna { comprova(), tanca() } o null si no hi ha res a fer (sense
 * finestra, document o fetch). `preparaWorker({ vigent })` el passa registre.js. Mai llança.
 */
export function iniciaActualitzacioWeb({
  finestra = globalThis.window,
  fetchImpl = typeof finestra?.fetch === 'function' ? (url, opcions) => finestra.fetch(url, opcions) : null,
  versioCarregada = VERSIO_SISTEMA,
  publica = publicaActualitzacioRecomanada,
  fixaRecarrega = fixaRecarregaWeb,
  preparaWorker = null,
  ara = () => Date.now(),
  intervalMinim = INTERVAL_MINIM_WEB_MS,
  intervalPeriodic = INTERVAL_PERIODIC_WEB_MS,
  retroces = RETROCES_FALLADA_WEB_MS,
  tempsMaxim = TEMPS_MAXIM_CONSULTA_WEB_MS,
  esperaWorker = ESPERA_WORKER_MS,
  tePendents = hiHaEstatPendent,
  confirma = (text) => finestra.confirm(text),
  llengua = llenguaDeLaInterficie
} = {}) {
  try {
    const document = finestra?.document;
    if (typeof fetchImpl !== 'function' || typeof publica !== 'function' || typeof document?.addEventListener !== 'function'
      || typeof finestra.addEventListener !== 'function' || typeof finestra.setTimeout !== 'function') return null;
    const rellotge = finestra;
    let tancat = false;
    let enCurs = null;
    let darrera = -Infinity;
    let espera = 0;
    let publicada = null;
    let proper = null;
    let recarregant = false;
    let tallRec = null, reiniciRec = null;

    /* P0123-05 · Cert si es pot recarregar: sense estat pendent, o si la persona accepta perdre'l. Com a la
       recuperació, una resposta que no és funció o una excepció compten com a pendent; i no poder
       preguntar és un no. */
    const estatPendent = () => {
      try { return typeof tePendents !== 'function' || Boolean(tePendents()); } catch { return true; }
    };
    const potRecarregar = (pendent = estatPendent()) => {
      if (!pendent) return true;
      let codi = null;
      try { codi = llengua(); } catch { codi = null; }
      try { return confirma(textPendentsWeb(codi)) === true; } catch { return false; }
    };

    /* El toc: el worker en espera (si n'hi ha), amb un tall, i la recàrrega. Una sola vegada. */
    const recarrega = () => {
      if (tancat || recarregant) return;
      const pendentAlToc = estatPendent();
      if (!potRecarregar(pendentAlToc)) return;
      recarregant = true;
      const torna = () => {
        // A new draft during worker preparation was not covered by the click.
        if (tancat || !pendentAlToc && !potRecarregar()) { recarregant = false; return; }
        try { finestra.location.reload(); } catch { recarregant = false; return; }
        // Una recàrrega cancel·lada (beforeunload) deixa la pàgina viva: passat el tall, el botó torna a anar.
        try { reiniciRec = rellotge.setTimeout(() => { reiniciRec = null; recarregant = false; }, esperaWorker); } catch { recarregant = false; }
      };
      const tall = new Promise((resolve) => { tallRec = rellotge.setTimeout(resolve, esperaWorker); });
      const prepara = Promise.resolve()
        .then(() => (!tancat && typeof preparaWorker === 'function' ? preparaWorker({ vigent: () => !tancat }) : null))
        .catch(() => null);
      Promise.race([prepara, tall]).then(() => {
        try { rellotge.clearTimeout(tallRec); } catch { /* res */ }
        tallRec = null;
        torna();
      }, () => { recarregant = false; });
    };
    try { fixaRecarrega?.(recarrega); } catch { /* sense recarregador, la barra recarrega com sempre */ }

    const visible = () => document.visibilityState !== 'hidden';
    const programa = (retard) => {
      try { if (proper !== null) rellotge.clearTimeout(proper); } catch { /* res */ }
      proper = null;
      if (tancat || !(retard > 0)) return;
      proper = rellotge.setTimeout(() => {
        proper = null;
        if (!tancat && visible()) comprova();
      }, retard);
    };
    const avisaLaFinestra = () => {
      try {
        const Esdeveniment = finestra.Event;
        if (typeof Esdeveniment === 'function') finestra.dispatchEvent(new Esdeveniment(ESDEVENIMENT_ACTUALITZACIO_WEB));
      } catch { /* sense avís, la barra ja carregada continua pintant el registre */ }
    };

    function comprova() {
      if (tancat) return Promise.resolve(null);
      if (enCurs) return enCurs;
      let instant;
      try { instant = ara(); } catch { instant = NaN; }
      if (!Number.isFinite(instant) || Math.abs(instant - darrera) < espera) return Promise.resolve(null);
      if (finestra.navigator?.onLine === false) return Promise.resolve(null);
      darrera = instant;
      enCurs = consultaVersioViva({ fetchImpl, tempsMaxim, rellotge })
        .then((versioServida) => {
          if (tancat) return null;
          if (versioServida === null) {
            espera = Math.min(retroces, intervalMinim);
            programa(espera);
            return null;
          }
          espera = intervalMinim;
          programa(intervalPeriodic);
          const avis = novaVersioWeb(versioServida, versioCarregada);
          const ordinal = avis?.versioRecomanada ?? null;
          if (ordinal !== publicada) {
            publica(avis, FONT_WEB);
            publicada = ordinal;
          }
          if (avis) avisaLaFinestra();
          return avis;
        })
        .catch(() => null)
        .finally(() => { enCurs = null; });
      return enCurs;
    }

    const enTornarVisible = () => { if (document.visibilityState === 'visible') comprova(); };
    const enTornarLaXarxa = () => { if (visible()) comprova(); };
    document.addEventListener('visibilitychange', enTornarVisible);
    finestra.addEventListener('online', enTornarLaXarxa);
    comprova();
    return {
      comprova,
      tanca() {
        if (tancat) return;
        tancat = true;
        programa(0);
        for (const timer of [tallRec, reiniciRec]) try { rellotge.clearTimeout(timer); } catch { /* res */ }
        tallRec = reiniciRec = null;
        try {
          document.removeEventListener('visibilitychange', enTornarVisible);
          finestra.removeEventListener('online', enTornarLaXarxa);
          fixaRecarrega?.(null);
        } catch { /* res */ }
      }
    };
  } catch {
    return null;
  }
}
