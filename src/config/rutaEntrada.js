/**
 * rutaEntrada.js — On es va per a entrar o crear el compte (T4, ordre del
 * Mestre, 260930).
 *
 * Una sola forma per a totes les portes (barra negra, àlies /login, /entrar,
 * /crear-compte, Xat, Connectar): /registre amb el mode que s'obri i la ruta
 * on tornar després. La tornada només s'admet si és interna (esTornadaInterna)
 * i mai és el mateix /registre, perquè no s'encadene. Funcions pures.
 */

export const RUTA_ENTRADA = '/registre';

/* Correcció de la revisió T1–T4 (260930) · La tornada té un topall propi, el
   d'una adreça (MAXIM_URL d'origenNota.js), i no hereta els 300 caràcters d'un
   objecte connectable (MAXIM_RUTA d'esRutaInterna): un /connectar amb una
   adreça compartida o amb un element de títol llarg en passa sovint, i perdre'n
   la consulta és perdre l'element. Els controls són els d'esRutaInterna:
   relativa a l'arrel de l'app, mai «//», «\\», espais ni caràcters de control. */
export const MAXIM_TORNADA = 2048;

function esTornadaInterna(ruta) {
  if (typeof ruta !== 'string' || !ruta || ruta.length > MAXIM_TORNADA) return false;
  if (!ruta.startsWith('/') || ruta.startsWith('//')) return false;
  return !/[\\\u0000-\u001F\u007F\s]/.test(ruta);
}
export const MODES_ENTRADA = Object.freeze(['entrar', 'crear']);

/** El mode admés, o null si no n'és cap. */
export function modeDEntrada(valor) {
  return MODES_ENTRADA.includes(valor) ? valor : null;
}

/** Cert si la ruta ja és la pantalla d'entrada. */
export function esRutaDEntrada(ruta) {
  return typeof ruta === 'string' && /^\/registre(?:[/?#]|$)/.test(ruta);
}

/** La tornada admesa, o null: interna (fins a MAXIM_TORNADA) i que no torne a l'entrada. */
export function tornadaSegura(ruta) {
  return esTornadaInterna(ruta) && !esRutaDEntrada(ruta) ? ruta : null;
}

/** /registre amb `mode` i `tornar`, sense cap paràmetre que no siga vàlid. */
export function rutaDEntrada({ mode = 'entrar', tornar } = {}) {
  const params = new URLSearchParams();
  const modeNet = modeDEntrada(mode);
  if (modeNet) params.set('mode', modeNet);
  const tornada = tornadaSegura(tornar);
  if (tornada) params.set('tornar', tornada);
  const consulta = params.toString();
  return consulta ? `${RUTA_ENTRADA}?${consulta}` : RUTA_ENTRADA;
}
