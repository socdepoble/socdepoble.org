/**
 * provisionalDelPaquet.js — el costat ESM del protocol sdp.carregador.v1.
 *
 * Decisió 5 del Mestre (261007) · el paquet de l'amfitrió és un carregador
 * clàssic menut (carregadorDelPaquet.js) que deixa un SocDePoble provisional
 * i demana el mòdul d'entrada (embed.jsx) amb import(). Este fitxer és el que
 * el mòdul llig d'eixe provisional:
 *   · controlDelProvisional(finestra): NOMÉS llig. Torna el control
 *     {base, url, adopta} si la finestra porta una propietat pròpia
 *     SocDePoble, configurable, amb la marca del carregador; si no, null.
 *   · prenProvisional(finestra): esborra el provisional (perquè exposaGlobal
 *     hi puga definir l'API real, no configurable) i torna el control, o null.
 *   · comprovaUrlDelModul(control, urlDelModul): delata una redirecció de
 *     dist/trossos/ (vegeu-ne el comentari).
 *
 * EFECTE EN AVALUAR-SE, i per això ha de ser el PRIMER import d'embed.jsx:
 * fixa la base de recursos amb la base del carregador ABANS que s'avaluen
 * host.js i els mòduls que resolen imatges en importar-se (townsContent.js,
 * marketContent.js). Dins d'un mòdul, document.currentScript és null i
 * assetResolver.js ja no la pot trobar sol. Sense provisional (socdepoble.org,
 * les proves o el paquet monolític, on assetResolver la troba com sempre) la
 * base és '' i fixaBaseRecursos('') no canvia res (Llei del Píxel).
 * No assigna cap global (tractor-enxufe E4).
 */
import { fixaBaseRecursos } from './assetResolver.js';
import { MARCA_DEL_CARREGADOR } from './carregadorDelPaquet.js';

const GLOBAL = 'SocDePoble';

/** El control {base, adopta} del provisional del carregador, o null. No toca res. */
export function controlDelProvisional(finestra) {
  if (!finestra) return null;
  const propietat = Object.getOwnPropertyDescriptor(finestra, GLOBAL);
  if (!propietat || !propietat.configurable || !propietat.value) return null;
  const control = propietat.value[Symbol.for(MARCA_DEL_CARREGADOR)];
  return control && typeof control.adopta === 'function' ? control : null;
}

/** Esborra el provisional de la finestra i en torna el control; null si no n'hi ha cap. */
export function prenProvisional(finestra) {
  const control = controlDelProvisional(finestra);
  if (!control) return null;
  delete finestra[GLOBAL];
  return control;
}

/**
 * Relleu 261007 · Cert si el mòdul d'entrada s'avalua a l'URL EXACTA que el
 * carregador ha demanat (control.url); sense control, o sense url, no hi ha
 * res a comprovar. El navegador indexa el mapa de mòduls amb l'URL demanada,
 * però import.meta.url, i la base dels imports relatius, és la FINAL: si
 * dist/trossos/ es servix amb una redirecció (un siteurl sense www que el
 * servidor envia cap a www, http cap a https), el primer tros mandrós que
 * importa ./soc-de-poble-<hash>.js no el troba al mapa i torna a avaluar
 * l'entrada: un segon host.js, un segon React i rutes que fallen en els
 * contextos. No es pot desfer des d'ací; es diu en veu alta a la consola.
 */
export function comprovaUrlDelModul(control, urlDelModul) {
  if (!control || !control.url || urlDelModul === control.url) return true;
  console.error(`[sdp-carregador] El mòdul d'entrada s'ha avaluat a ${urlDelModul} i el carregador l'havia demanat a ${control.url}: dist/trossos/ s'ha servit amb una redirecció. Servix dist/ sense redireccions, o els trossos tornaran a avaluar l'entrada (dues Apps a la mateixa pàgina).`);
  return false;
}

if (typeof window !== 'undefined') fixaBaseRecursos(controlDelProvisional(window)?.base || '');
