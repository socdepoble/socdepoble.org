/**
 * recuperacioPendent.js — LA RECUPERACIÓ DE CONTRASENYA EN CURS
 *
 * Mòdul del nucli: no sap res de cap proveïdor ni guarda cap secret. Diu dues
 * coses a la interfície, que en tots dos casos porta qualsevol ruta a la
 * pantalla de /registre (App.jsx, OnboardingSection.jsx).
 *
 * ── 1. L'ENLLAÇ QUE ESPERA «DESA» (R2, Onada 3, 261003) ─────────────────────
 * Decisió del Mestre (Safe Links d'Outlook): l'enllaç del correu NO es
 * verifica en arribar, sinó en prémer «Desa». En arribar, l'adaptador guarda
 * el seu token en la memòria del seu mòdul (mai ací: el format és seu) i avisa
 * amb anunciaEnllacDeRecuperacio(). Estats (estatEnllacDeRecuperacio):
 *   'pendent'  hi ha un enllaç en la memòria d'este document: pantalla
 *              «Definix la contrasenya nova», genèrica, sense sessió;
 *   'perdut'   s'havia obert un enllaç en esta pestanya, però el document
 *              s'ha recarregat i la memòria ja no el té: cal tornar a obrir
 *              l'enllaç del correu (o demanar-ne un altre);
 *   null       res en curs.
 * 'perdut' necessita saber, després de recarregar, que hi havia un enllaç: una
 * marca SENSE SECRET a la capa efímera (storage.js, sessionStorage), per
 * pestanya, que mor amb ella com el verificador PKCE (storage.js:65-78). La URL
 * ja és neta i la memòria s'ha perdut: sense la marca, la recàrrega no podria
 * explicar res. S'esborra en qualsevol eixida (oblidaEnllacDeRecuperacio).
 *
 * ── 2. LA SESSIÓ SENSE CONTRASENYA NOVA (compatibilitat) ───────────────────
 * R (261003) · correcció de la revisió. Si un backend torna una sessió amb
 * l'enllaç (el contracte d'abans de R2), eixa sessió és completa però encara
 * ha de triar la contrasenya nova: la marca { v: 1, sub }, lligada al compte, a
 * la capa persistent (storage.js, getVal/setVal: el mateix abast que el
 * refresh token que restringix), amb reserva en memòria si el navegador no
 * deixa escriure. La posa App.jsx; l'adaptador Supabase ja no en fa cap, de
 * sessió, fins que la contrasenya és nova.
 *
 * QUI ESBORRA TOT (oblidaRecuperacioPendent), i ningú més:
 *   · definir la contrasenya nova amb èxit;
 *   · eixir (no buidar només la pestanya: la sessió continua a les altres);
 *   · una entrada explícita (contrasenya, alta, Google).
 * L'enllaç sol (oblidaEnllacDeRecuperacio): «Torna a entrar» i «Demana un
 * enllaç nou» des de la pantalla, i l'adaptador quan l'enllaç no es pot usar.
 */
import { STORAGE_PREFIX, delEfimer, delVal, getEfimer, getVal, setEfimer, setVal } from '../config/storage.js';

export const CLAU_RECUPERACIO_PENDENT = 'socdepoble-recuperacio-pendent';
/** La marca efímera «s'ha obert un enllaç en esta pestanya». Cap secret. */
export const CLAU_ENLLAC_OBERT = 'socdepoble-recuperacio-enllac-obert';
/** Avís dins del document quan res d'açò canvia (les altres pestanyes reben `storage`). */
export const EVENT_RECUPERACIO_PENDENT = 'sdp:recuperacio-pendent';

export const ESTAT_ENLLAC = Object.freeze({ PENDENT: 'pendent', PERDUT: 'perdut' });

/* Només quan el registre persistent no l'ha pogut desar: si no, una altra
   pestanya que l'esborra no la podria esborrar d'ací. */
let enMemoria = null;
/* L'enllaç d'este document: només que n'hi ha un. El token és de l'adaptador. */
let enllacEnMemoria = false;

const avisa = () => globalThis.window?.dispatchEvent(new CustomEvent(EVENT_RECUPERACIO_PENDENT));

const esMarca = (valor) => Boolean(valor) && typeof valor === 'object' && valor.v === 1
  && typeof valor.sub === 'string' && valor.sub !== '';

/* ── 1. L'enllaç ── */

/**
 * L'adaptador ha recollit un enllaç de recuperació i el guarda en memòria fins
 * a «Desa». Ho diu abans de tornar de recullTornadaOAuth. Idempotent.
 */
export function anunciaEnllacDeRecuperacio() {
  enllacEnMemoria = true;
  setEfimer(CLAU_ENLLAC_OBERT, { v: 1 });
  avisa();
}

/** 'pendent', 'perdut' o null (vegeu la capçalera). */
export function estatEnllacDeRecuperacio() {
  if (enllacEnMemoria) return ESTAT_ENLLAC.PENDENT;
  return getEfimer(CLAU_ENLLAC_OBERT, null) == null ? null : ESTAT_ENLLAC.PERDUT;
}

/** Oblida l'enllaç d'este document i la marca efímera. Avisa si hi era. */
export function oblidaEnllacDeRecuperacio() {
  const hiEra = estatEnllacDeRecuperacio() !== null;
  enllacEnMemoria = false;
  delEfimer(CLAU_ENLLAC_OBERT);
  if (hiEra) avisa();
}

/* ── 2. La sessió sense contrasenya nova ── */

/** Posa la marca per al compte `sub`. Torna true si ha quedat al registre persistent. */
export function marcaRecuperacioPendent(sub) {
  if (sub == null || String(sub) === '') return false;
  const marca = { v: 1, sub: String(sub) };
  const desada = setVal(CLAU_RECUPERACIO_PENDENT, marca);
  enMemoria = desada ? null : marca;
  avisa();
  return desada;
}

/** Cert si el compte `sub` encara ha de definir la contrasenya nova. */
export function recuperacioPendentPer(sub) {
  if (sub == null || String(sub) === '') return false;
  const desada = getVal(CLAU_RECUPERACIO_PENDENT, null);
  const marca = esMarca(desada) ? desada : enMemoria;
  return esMarca(marca) && marca.sub === String(sub);
}

/** Oblida tota la recuperació en curs: la marca, siga de qui siga, i l'enllaç d'este document. */
export function oblidaRecuperacioPendent() {
  const hiEra = enMemoria !== null || getVal(CLAU_RECUPERACIO_PENDENT, null) !== null
    || estatEnllacDeRecuperacio() !== null;
  enMemoria = null;
  delVal(CLAU_RECUPERACIO_PENDENT);
  enllacEnMemoria = false;
  delEfimer(CLAU_ENLLAC_OBERT);
  if (hiEra) avisa();
}

/** L'esdeveniment `storage` d'una altra pestanya parla de la marca (null: s'ha buidat tot). */
export const esClauDeRecuperacio = (key) => key === null || key === STORAGE_PREFIX + CLAU_RECUPERACIO_PENDENT;

/**
 * Escolta els canvis: els d'este document (la marca i l'enllaç) i els de la
 * marca a les altres pestanyes. Torna la funció que deixa d'escoltar.
 */
export function escoltaRecuperacioPendent(escoltador) {
  const win = globalThis.window;
  if (!win || typeof escoltador !== 'function') return () => {};
  const enCanvi = () => escoltador();
  const enStorage = (event) => { if (esClauDeRecuperacio(event?.key ?? null)) escoltador(); };
  win.addEventListener(EVENT_RECUPERACIO_PENDENT, enCanvi);
  win.addEventListener('storage', enStorage);
  return () => {
    win.removeEventListener(EVENT_RECUPERACIO_PENDENT, enCanvi);
    win.removeEventListener('storage', enStorage);
  };
}
