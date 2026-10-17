/**
 * sessioPilot.js — L'entrada pilot local (Gauntlet 261016_1530, Bloc 3.6.4 del
 * prompt; F66 del relleu de Codex).
 *
 * El problema: a localhost:3340/registre?mode=entrar, amb el node en mode de
 * proves i el servidor del poble caigut (ERR_EMPTY_RESPONSE contra
 * http://127.0.0.1:54321/auth/v1/), no hi havia manera d'entrar. L'entrada
 * real rebutja en seed i local amb MODE_LOCAL (supabase/auth.js ·
 * exigeixModeRemot), i «Forçar entrada local (Mock)» només desbloquejava el
 * formulari, que acabava en el mateix rebuig.
 *
 * La solució, amb el criteri de Codex: una sessió de prova de la persona pilot
 * (identitatsSeed.js · PERSONA_PILOT, amb l'id del padró AGENTS_MAP.JAVI.id:
 * este fitxer no inventa cap identificador nou). Naix en este navegador sense
 * cap petició HTTP i només existix quan es complixen les tres condicions:
 *   · desenvolupament (import.meta.env.DEV). En un build de producció
 *     rebutja sempre, i identitat.js tampoc no n'admet el testimoni;
 *   · mode de proves explícit ('seed' o 'local'), el que resol este document
 *     (config/dataMode.js · resolveDataMode). Una elecció remota desada el fa
 *     remot, i ací no hi ha pilot;
 *   · el backend de la sessió ja és el d'esta configuració (SessionProvider
 *     l'ha configurat). Una configuració local falsa no pot canviar el
 *     backend d'un document remot.
 *
 * El que garantix identitat.js (TESTIMONI_PILOT):
 *   · el testimoni no és cap JWT i no viatja mai: jwtPerBackend no el torna,
 *     i per això cap petició el porta i l'eixida no el revoca al servidor;
 *   · només val dins del backend de proves on ha nascut. L'àmbit del backend
 *     porta el mode de dades: en passar a remot (enterRemoteMode recarrega),
 *     la pestanya es buida, i usuariDeSessio ja no el torna encara abans;
 *   · és de pestanya: sense refresh token, mai no baixa al registre persistent.
 * sessionService no pregunta el rol a cap servidor: és 'usuari'.
 *
 * El mode remot continua exigint l'autenticació real i mai no rep ni la
 * identitat ni els permisos de la persona pilot. La resta de la regla del mode
 * seed (identitatsSeed.js, capçalera) no canvia: qui té sessió en la llavor és
 * la persona pilot i és propietària de l'entitat pilot.
 */
import { normalizeBackendConfig } from '../config/backendConfig.js';
import { AGENTS_MAP } from './agentsSeed.js';
import { PERSONA_PILOT } from './identitatsSeed.js';
import { TESTIMONI_PILOT, desaSessio, esBackendDeSessio } from './identitat.js';

const MODES_DEL_PILOT = new Set(['seed', 'local']);

/** El proveïdor de la sessió pilot, a `app_metadata.provider` (la forma de GoTrue). */
export const PROVEIDOR_PILOT = 'pilot-local';

/** El codi d'una entrada pilot rebutjada (`error.code`). No és cap CODI_ENTRADA:
 * la vista en pinta el missatge tal qual (onboardingModel.js · missatgeDEntrada). */
export const CODI_PILOT_NO_DISPONIBLE = 'pilot-no-disponible';

const MISSATGE_NOMES_EN_PROVES = 'L’entrada pilot només existix en desenvolupament i en mode de proves (seed o local). Amb el servidor del poble cal entrar amb un compte de veres.';
const MISSATGE_SESSIO_SENSE_PREPARAR = 'La sessió d’esta pàgina encara no està preparada per al mode de proves. Recarrega la pàgina i torna-ho a provar.';
const MISSATGE_SENSE_EMMAGATZEMATGE = 'No s’ha pogut desar la sessió de prova. Comprova que el navegador deixa guardar dades d’esta pàgina.';

const enDesenvolupament = () => import.meta.env?.DEV === true;
const noDisponible = (missatge) => Object.assign(new Error(missatge), { code: CODI_PILOT_NO_DISPONIBLE });

/**
 * Cert si este document pot oferir l'entrada pilot: en desenvolupament i amb
 * el mode de dades resolt en 'seed' o 'local'. Pura (cap xarxa). Una
 * configuració que no es pot normalitzar no en té.
 */
export function entradaPilotDisponible(config = {}) {
  if (!enDesenvolupament()) return false;
  try {
    return MODES_DEL_PILOT.has(normalizeBackendConfig(config).dataMode);
  } catch {
    return false;
  }
}

/** L'usuari de la sessió pilot, amb la forma d'un usuari de GoTrue. Una còpia nova a cada crida. */
export function usuariPilot() {
  return {
    id: AGENTS_MAP.JAVI.id,
    email: null,
    app_metadata: { provider: PROVEIDOR_PILOT, providers: [PROVEIDOR_PILOT] },
    user_metadata: { full_name: PERSONA_PILOT.nom, name: PERSONA_PILOT.nom, avatar_url: PERSONA_PILOT.avatar }
  };
}

/**
 * Entra com a persona pilot en este navegador: desa la sessió de prova a la
 * pestanya i avisa (sdp:auth-change), sense cap petició. Torna { user }.
 * Rebutja, sense tocar cap sessió, si l'entrada pilot no està disponible
 * (producció, remot) o si el backend de la sessió no és el d'esta configuració.
 * Qui la crida l'ha de passar per SessionContext (entrada explícita).
 */
export function entraComAPilot(config = {}) {
  if (!entradaPilotDisponible(config)) throw noDisponible(MISSATGE_NOMES_EN_PROVES);
  if (!esBackendDeSessio(config)) throw noDisponible(MISSATGE_SESSIO_SENSE_PREPARAR);
  const usuari = usuariPilot();
  if (!desaSessio({ access_token: TESTIMONI_PILOT, refresh_token: null, user: usuari })) {
    throw new Error(MISSATGE_SENSE_EMMAGATZEMATGE);
  }
  globalThis.window?.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuari } }));
  return { user: usuari };
}
