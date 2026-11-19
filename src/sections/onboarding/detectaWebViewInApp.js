/**
 * detectaWebViewInApp.js — Adaptador d'entrada cap al detector lineal O(n)
 * `esNavegadorSocialIncrustat` (`src/utils/navegadorIncrustat.js`), injectant
 * l'estat de plataforma nativa Capacitor registrat a `entradaNativa.js`.
 */
import { plataformaNativa } from '../../config/entradaNativa.js';
import { esNavegadorSocialIncrustat } from '../../utils/navegadorIncrustat.js';

/**
 * @param {string} [userAgent] Cadena User-Agent opcional (per defecte `navigator.userAgent`).
 * @param {{ esNatiu?: boolean, finestra?: Window|null }} [opcions]
 * @returns {Readonly<{ esWebViewSocial: boolean, app: string|null, nomApp: string|null, sistema: 'ios'|'android'|'altre' }>}
 */
export function detectaWebViewInApp(userAgent, opcions = {}) {
  return esNavegadorSocialIncrustat(userAgent, { ...opcions, plataformaNativa });
}
