/**
 * appNativaIos.js — R13-C7 (ordre del Mestre, 08-11-2026) · La regla 2.3.10 de l'App Store per a
 * l'apartat «👥 Usuaris, Dispositius i Botigues»: dins de l'app d'iOS no es nomena cap altra plataforma
 * mòbil ni la seua botiga (ordre del Mestre 261027; perAppNativa.js, ConsolaSection.publica.test.jsx).
 *
 * Mòdul a part i menut perquè PerfilShell.jsx (la card i la capçalera) el puga llegir sense portar el
 * panell ni les seues dades, que es carreguen diferits (PanellUsuarisDispositiusBotigues.jsx).
 * Pur: llig el pont de Capacitor (window.Capacitor) i el registre de l'entrada nativa, sense importar-los.
 */
import { esAppNativa } from '../../../config/origenPublic.js';
import { plataformaNativa } from '../../../config/entradaNativa.js';

export const ID_APARTAT_USUARIS_BOTIGUES = 'administracio-usuaris-i-dispositius';

/**
 * Cert dins de l'app nativa, tret de l'app d'Android. Una plataforma nativa que no es pot llegir compta
 * com a iOS: és el cas prudent (amagar una menció de més no trenca cap regla).
 */
export function esAppNativaIos(finestra = typeof window === 'undefined' ? undefined : window) {
  if (!esAppNativa()) return false;
  let plataforma = null;
  try {
    plataforma = typeof finestra?.Capacitor?.getPlatform === 'function' ? finestra.Capacitor.getPlatform() : null;
  } catch { plataforma = null; }
  if (plataforma !== 'ios' && plataforma !== 'android') plataforma = plataformaNativa();
  return plataforma !== 'android';
}

/** La card i la capçalera de l'apartat dins de l'app d'iOS: sense Google. */
export const TEXTOS_APP_IOS = Object.freeze({
  title: '👥 Usuaris, Dispositius i Botigues (Apple)',
  subtitle: 'Directori d’usuaris registrats i distribució en viu per canal (App Store i Web)',
  searchText: 'usuaris dispositius botigues app store iphone ipad web sessions connectats'
});

/** L'apartat amb els textos de l'app d'iOS; qualsevol altre element, tal qual (el mateix objecte). */
export function ambTextosPerAppIos(item) {
  return item?.id === ID_APARTAT_USUARIS_BOTIGUES ? { ...item, ...TEXTOS_APP_IOS } : item;
}
