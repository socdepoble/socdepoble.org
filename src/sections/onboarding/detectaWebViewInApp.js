/**
 * detectaWebViewInApp.js — Detector pur d'entorns WebView socials incrustats
 * (Facebook, Messenger, Instagram, TikTok, LINE) on Google OAuth bloqueja
 * l'autorització amb `403 Error: disallowed_useragent` (P0-113 / Onada R32.5).
 *
 * GARANTIA D'EXCLUSIÓ NATIVA CAPACITOR:
 * L'App nativa d'iOS (WKWebView Capacitor) i d'Android (WebView Capacitor)
 * fa servir l'adaptador natiu registrat a `entradaNativa.js` (`plataformaNativa() !== 'web'`)
 * o s'identifica per `window.Capacitor.isNativePlatform()` / `protocol === 'capacitor:'`.
 * Este detector torna SEMPRE `esWebViewSocial: false` en qualsevol entorn
 * Capacitor natiu perquè no es confonga mai amb un navegador incrustat aliè.
 */
import { plataformaNativa } from '../../config/entradaNativa.js';

const NO_WEBVIEW = Object.freeze({
  esWebViewSocial: false,
  app: null,
  nomApp: null,
  sistema: 'altre'
});

const PATRONS_WEBVIEW_SOCIAL = Object.freeze([
  { app: 'instagram', nomApp: 'Instagram', re: /\bInstagram\b/i },
  { app: 'facebook', nomApp: 'Facebook', re: /\b(?:FBAN|FBAV|FB_IAB|FBIOS|FB4A|FBMessenger)\b/i },
  { app: 'tiktok', nomApp: 'TikTok', re: /\b(?:TikTok|BytedanceWebview|ByteLocale|musical_ly)\b/i },
  { app: 'line', nomApp: 'LINE', re: /\bLine\//i }
]);

function esEntornCapacitorNatiu(opcions = {}) {
  if (opcions?.esNatiu === true) return true;
  if (plataformaNativa() !== 'web') return true;
  const finestra = opcions?.finestra ?? (typeof window !== 'undefined' ? window : null);
  if (!finestra) return false;
  try {
    if (finestra.Capacitor?.isNativePlatform?.() === true) return true;
    const protocol = String(finestra.location?.protocol || '').toLowerCase();
    if (protocol === 'capacitor:' || protocol === 'ionic:') return true;
  } catch {
    return false;
  }
  return false;
}

function detectaSistemaMobil(ua) {
  if (/\b(?:iPhone|iPad|iPod)\b/i.test(ua)) return 'ios';
  if (/\bAndroid\b/i.test(ua)) return 'android';
  return 'altre';
}

/**
 * @param {string} [userAgent] Cadena User-Agent opcional (per defecte `navigator.userAgent`).
 * @param {{ esNatiu?: boolean, finestra?: Window|null }} [opcions]
 * @returns {Readonly<{ esWebViewSocial: boolean, app: string|null, nomApp: string|null, sistema: 'ios'|'android'|'altre' }>}
 */
export function detectaWebViewInApp(userAgent, opcions = {}) {
  if (esEntornCapacitorNatiu(opcions)) return NO_WEBVIEW;

  const ua = typeof userAgent === 'string'
    ? userAgent
    : (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string' ? navigator.userAgent : '');

  if (!ua.trim()) return NO_WEBVIEW;

  const sistema = detectaSistemaMobil(ua);
  for (const candidat of PATRONS_WEBVIEW_SOCIAL) {
    if (candidat.re.test(ua)) {
      return Object.freeze({
        esWebViewSocial: true,
        app: candidat.app,
        nomApp: candidat.nomApp,
        sistema
      });
    }
  }

  return NO_WEBVIEW;
}
