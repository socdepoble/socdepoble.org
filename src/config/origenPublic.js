/* Ordre del Mestre (261021, pla 261021_0015 §13, P1-03) · L'origen públic dels
   enllaços que ixen de l'app (compartir, la URL canònica, la del Perfil).
   Dins de l'app de Capacitor la barra d'adreces no és cap web:
   capacitor://localhost a iOS i https://localhost a Android. Un enllaç
   compartit amb eixe origen no obri res fora del telèfon. Ací es decidix una
   sola vegada:
     · el canònic del build (VITE_CANONICAL_URL), si el porta;
     · dins de l'app nativa, socdepoble.org;
     · si no, l'origen de la pàgina, com sempre (la web, la PWA i el connector
       de WordPress, on l'amfitrió és qui és, no canvien en res).
   Sense barra final. Pur i sense cap import de Capacitor (src/natiu/frontera
   .test.js): es llig el pont que el WebView injecta (window.Capacitor), com
   src/pwa/instalacio.js, i el registre de l'entrada nativa, que
   src/natiu/entrada.jsx fixa abans del primer pintat. */
import { plataformaNativa } from './entradaNativa.js';

export const ORIGEN_PUBLIC_PER_DEFECTE = 'https://socdepoble.org';

const senseBarraFinal = (origen) => String(origen).replace(/\/$/, '');

/** Cert dins de l'app nativa: el pont de Capacitor o l'entrada nativa registrada. */
export function esAppNativa() {
  try {
    const capacitor = typeof window === 'undefined' ? null : window.Capacitor;
    if (typeof capacitor?.isNativePlatform === 'function' && capacitor.isNativePlatform() === true) return true;
  } catch { /* un pont natiu trencat no és l'app nativa */ }
  return plataformaNativa() !== 'web';
}

/** L'origen públic: VITE_CANONICAL_URL; si no, socdepoble.org dins de l'app nativa; si no, el de la pàgina. */
export function origenPublic() {
  const canonic = import.meta.env?.VITE_CANONICAL_URL;
  if (canonic) return senseBarraFinal(canonic);
  if (esAppNativa()) return ORIGEN_PUBLIC_PER_DEFECTE;
  return window.location.origin;
}

/* Compartir la pàgina on està la persona: la barra d'adreces, byte a byte, com
   sempre; només dins de l'app nativa, el mateix camí a l'origen públic. */

/** L'origen sobre el qual es resol un enllaç compartit des de la pàgina. */
export function origenDeLaPagina() {
  return esAppNativa() ? origenPublic() : window.location.origin;
}

/** La URL de la pàgina on està la persona, per a compartir-la. */
export function urlDeLaPagina() {
  if (!esAppNativa()) return window.location.href;
  const { pathname, search, hash } = window.location;
  return `${origenPublic()}${pathname}${search}${hash}`;
}
