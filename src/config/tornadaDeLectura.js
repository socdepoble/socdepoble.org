/**
 * tornadaDeLectura.js — P0-ANDROID-PUSH (v1.2.16) · B8b · Tercera excepció escrita a l'ordre del
 * Mestre del 261002 (rutaEntrada.js): qui llig un enllaç compartit i entra (o crea el compte) torna
 * a la fitxa pública de LECTURA d'on venia. És el pas de Foraster a Conegut (doctrina del Foraster,
 * ordre del Mestre 261121 01:55; prompt 0216, T2.4; decisió D-9: «Sí, entrar i crear el compte»).
 *
 * Llista tancada, i res més (cap open redirect):
 *   · /events/<id>, /mur/<id>, /mercat/<id> i /pobles/<slug>: un sol segment, que comença per una
 *     lletra, una xifra, «_», «~» o «-» (mai «.» ni «%», així cap segment de punts, ni codificat);
 *     després, només els caràcters no reservats d'una URL i escapaments %XX ben formats;
 *   · /page/<slug>: minúscules, xifres i guions;
 *   · com a molt un fragment net (#ancora), mai una consulta.
 * Gauntlet v1.2.16, ronda 2 (L1R2-01) · Abans de validar es lleven NOMÉS els paràmetres de seguiment
 * d'una llista tancada (utm_*, fbclid, gclid, igshid: senseSeguiment), que no fan res en carregar i
 * que Facebook o Instagram afigen a cada enllaç eixint; es torna a la fitxa sense ells. Si la consulta
 * porta qualsevol altra clau, la tornada no canvia i continua anant al perfil.
 * Fora: tota URL externa o «//…» (ja ho barra tornadaSegura), /calendari i els seus ?mes= o ?date=
 * (el prompt només dona cinc famílies, [VA2-5]), les llistes (/mur, /mercat…), tota ruta que actue
 * en carregar (/connectar?…, /xat?sobre=…, /notes?mode=…) i tota ruta d'administració (/admin,
 * /control, /consola…). La Gestoria i «El compte» (RUTA_COMPTE) continuen manant com sempre
 * (aterratgeDespresDEntrar); la resta, al perfil.
 *
 * FORA de l'arrencada del connector de WordPress a posta ([VA-2]: el sostre és de 1.591.000 B, i la
 * release de la v1.2.16 en fa 1.589.999): només l'importa OnboardingSection.jsx, que és un tros diferit. rutaEntrada.js
 * no canvia de codi. Funcions pures, sense cap expressió amb retrocés ambigu.
 */
import { aterratgeDespresDEntrar, tornadaSegura } from './rutaEntrada.js';

const FITXA_DE_LECTURA = /^\/(?:mur|mercat|events|pobles)\/[A-Za-z0-9_~-](?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2}){0,199}$|^\/page\/[a-z0-9-]{1,120}$/;
const FRAGMENT_NET = /^#[A-Za-z0-9_-]{1,64}$/;
/* Els paràmetres de seguiment: la mateixa llista que SEGUIMENT de germanes.js, més igshid. */
const SEGUIMENT = /^(?:utm_[a-z0-9_]*|fbclid|gclid|igshid)$/i;

/**
 * La tornada sense la consulta, si la consulta NOMÉS porta paràmetres de seguiment (SEGUIMENT): el
 * camí net més el fragment. Sense consulta, amb una consulta buida o amb qualsevol altra clau
 * (?connectar=1…), la tornada tal qual. La consulta només es busca davant del fragment: «#a?b=1» és un
 * fragment, no una consulta. Pura.
 * @param {string} tornada una tornada ja segura (tornadaSegura)
 * @returns {string}
 */
export function senseSeguiment(tornada) {
  const h = tornada.indexOf('#');
  const abans = h === -1 ? tornada : tornada.slice(0, h);
  const q = abans.indexOf('?');
  if (q === -1) return tornada;
  const claus = [...new URLSearchParams(abans.slice(q + 1)).keys()];
  if (claus.length === 0 || !claus.every((clau) => SEGUIMENT.test(clau))) return tornada;
  return abans.slice(0, q) + (h === -1 ? '' : tornada.slice(h));
}

/**
 * Cert si la tornada és una fitxa pública de lectura de la llista tancada. Pura.
 * @param {unknown} tornada una tornada ja segura (tornadaSegura) o qualsevol valor
 * @returns {boolean}
 */
export function esTornadaDeLectura(tornada) {
  if (typeof tornada !== 'string') return false;
  const i = tornada.indexOf('#');
  const cami = i === -1 ? tornada : tornada.slice(0, i);
  if (i !== -1 && !FRAGMENT_NET.test(tornada.slice(i))) return false;
  return FITXA_DE_LECTURA.test(cami);
}

/**
 * aterratgeDespresDEntrar amb la tercera excepció: la fitxa de lectura d'on venia, si és de la
 * llista tancada (sense els paràmetres de seguiment, senseSeguiment); si no, el que diga
 * aterratgeDespresDEntrar (la Gestoria, «El compte» o el perfil).
 * @param {unknown} tornar el ?tornar de la consulta
 * @returns {string}
 */
export function aterratgeAmbLectura(tornar) {
  const tornada = tornadaSegura(tornar);
  const neta = tornada && senseSeguiment(tornada);
  return neta && esTornadaDeLectura(neta) ? neta : aterratgeDespresDEntrar(tornar);
}
