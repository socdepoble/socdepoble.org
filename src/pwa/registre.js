/* Fase 0 de l'empaquetat mòbil (261003) · registre del service worker de
   l'entrada pròpia (public/sw.js). Disseny: _wiki_de_poble/04_escriptori/
   02_investigacio_ia/261003_1330_empaquetat_mobil_claude/FASE0_PWA.txt.

   Només el crida src/main.jsx, l'entrada de socdepoble.org. El paquet autònom
   (embed.jsx) i qualsevol amfitrió no el registren mai: la PWA és de la
   pàgina, no del component (estandard_integracio_react, LLEI 3).
   En desenvolupament no fa res; tampoc toca un worker vell de localhost. */

export const RUTA_DEL_SW = '/sw.js';
export const ABAST_DEL_SW = '/';

/**
 * Per què NO s'ha de registrar, o null si s'ha de registrar.
 * Pura: rep la decisió de producció, el navigator i la finestra.
 */
export function motiuPerNoRegistrar({ produccio, navegador, finestra } = {}) {
  if (produccio !== true) return 'desenvolupament';
  if (!navegador || !('serviceWorker' in navegador)) return 'sense-suport';
  if (!finestra || finestra.isSecureContext !== true) return 'context-insegur';
  // Dins d'un iframe la pàgina és de l'amfitrió, no nostra.
  if (finestra.top !== finestra.self) return 'incrustat';
  // Dins de l'app de Capacitor (Fases 1 i 2) la capa nativa porta dades i actualitzacions.
  const capacitor = finestra.Capacitor;
  if (capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform()) return 'nativa';
  return null;
}

/**
 * Registra /sw.js amb abast / quan la pàgina ha acabat de carregar, per no
 * competir amb la primera pintada. No llança mai: torna
 * { registrat: true, registre } o { registrat: false, motiu[, error] }.
 */
export function registraServiceWorker({
  produccio = import.meta.env.PROD,
  navegador = globalThis.navigator,
  finestra = globalThis.window
} = {}) {
  const motiu = motiuPerNoRegistrar({ produccio, navegador, finestra });
  if (motiu) return Promise.resolve({ registrat: false, motiu });

  const registra = () => Promise.resolve()
    .then(() => navegador.serviceWorker.register(RUTA_DEL_SW, { scope: ABAST_DEL_SW }))
    .then((registre) => ({ registrat: true, registre }))
    .catch((error) => ({ registrat: false, motiu: 'error', error }));

  if (finestra.document?.readyState === 'complete') return registra();
  return new Promise((resol) => {
    finestra.addEventListener('load', () => resol(registra()), { once: true });
  });
}
