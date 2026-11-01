/* P0-24 (G2120-07, marató 261101_2143) · L'adaptador del botó Arrere
   d'Android. El connector és propi de l'App (EnrereNatiuPlugin.java), no cap
   paquet npm: és l'amo de l'OnBackPressedCallback i només l'encén quan hi ha
   alguna cosa a fer (una capa oberta o historial al WebView). Apagat, el
   sistema fa l'Arrere amb el gest predictiu de «tornar a l'inici» (Android 16).
   Dos camins, cap import del nucli de Capacitor (frontera.test.js):
     · JS → natiu: el nombre de capes obertes (config/pilaEnrere.js), amb
       Capacitor.nativePromise('EnrereNatiu', 'estat', { capes }), agrupat per
       microtasca i només quan canvia;
     · natiu → JS: en cada Arrere amb capes, el natiu avalua
       window.__sdpEnrere(): true = ha tancat la de dalt (consumit); qualsevol
       altra cosa = torna arrere al WebView o deixa fer el sistema.
   Mai es torna cap connector d'una funció async (el Proxy respon a `then`):
   ací no n'hi ha cap, només el pont global, com compartirNatiu.js. Només
   Android: iOS no té Arrere. */
import { capesEnrereObertes, escoltaCapesEnrere, tancaCapaSuperior } from '../config/pilaEnrere.js';

export const CONNECTOR_ENRERE = 'EnrereNatiu';
export const METODE_ESTAT = 'estat';
export const FUNCIO_ENRERE = '__sdpEnrere';
const PLATAFORMES = new Set(['android']);
const PILA = Object.freeze({ capesEnrereObertes, escoltaCapesEnrere, tancaCapaSuperior });
const FUNCIONS_DE_LA_PILA = Object.freeze(Object.keys(PILA));

/**
 * Connecta la pila amb el natiu. Mai llança.
 * @param {{ plataforma: string, finestra?: object, pila?: typeof PILA }} opcions
 * @returns {{ tanca(): void }|null} null fora de l'App d'Android
 */
export function connectaEnrereNatiu({ plataforma, finestra = globalThis, pila = PILA } = {}) {
  if (!PLATAFORMES.has(plataforma)) return null;
  const pont = finestra?.Capacitor;
  if (typeof pont?.nativePromise !== 'function') return null;
  if (FUNCIONS_DE_LA_PILA.some((f) => typeof pila?.[f] !== 'function')) return null;

  let tancat = false;
  let enviat = null;
  let pendent = false;
  const informa = () => {
    if (tancat || pendent) return;
    pendent = true;
    queueMicrotask(() => {
      pendent = false;
      if (tancat) return;
      const capes = pila.capesEnrereObertes();
      if (capes === enviat) return;
      enviat = capes;
      // Un rebuig (pont sense el connector) torna a provar en el canvi següent.
      Promise.resolve()
        .then(() => pont.nativePromise(CONNECTOR_ENRERE, METODE_ESTAT, { capes }))
        .catch(() => { if (enviat === capes) enviat = null; });
    });
  };
  const respon = () => {
    if (tancat) return false;
    try { return pila.tancaCapaSuperior() === true; } catch { return false; }
  };
  try {
    Object.defineProperty(finestra, FUNCIO_ENRERE, { value: respon, configurable: true, enumerable: false });
  } catch {
    return null;
  }
  let desescolta = null;
  try { desescolta = pila.escoltaCapesEnrere(informa); } catch { /* Sense oient, l'estat inicial continua valent. */ }
  informa();
  return {
    /** Deixa d'escoltar i lleva la funció global (només si encara és la nostra). */
    tanca() {
      if (tancat) return;
      tancat = true;
      try { desescolta?.(); } catch { /* res */ }
      try { if (finestra[FUNCIO_ENRERE] === respon) delete finestra[FUNCIO_ENRERE]; } catch { /* res */ }
    }
  };
}
