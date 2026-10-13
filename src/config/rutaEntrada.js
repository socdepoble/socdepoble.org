/**
 * rutaEntrada.js — On es va per a entrar o crear el compte (T4, ordre del
 * Mestre, 260930).
 *
 * Una sola forma per a totes les portes (barra negra, àlies /login, /entrar,
 * /crear-compte, Xat, Connectar): /registre amb el mode que s'obri i la ruta
 * on tornar després. La tornada només s'admet si és interna (esTornadaInterna)
 * i mai és el mateix /registre, perquè no s'encadene. Funcions pures.
 *
 * Ordre del Mestre (261002) · Deroga T4 per a l'ENTRADA: després d'entrar o de
 * crear el compte ja no es torna a la ruta d'origen, s'aterra sempre a la
 * pròpia identitat (RUTA_DESPRES_D_ENTRAR). El ?tornar es continua construint
 * i validant ací, però cap porta l'obeïx per a decidir on s'aterra…
 *
 * …llevat d'una excepció estreta i escrita (petició del Mestre via MarIA,
 * 261012_2148: «en registrar-se, salta directament a la Gestoria»): una
 * tornada que és una entrada de la Gestoria (/app/gestoria/<entrada>) sí que
 * mana (aterratgeDespresDEntrar). Qualsevol altra porta, també la de la resta
 * d'apps (la Bar envia la seua tornada), continua aterrant al perfil.
 */

export const RUTA_ENTRADA = '/registre';

/* Ordre del Mestre (261002) · «L'entrada ha de ser sempre directa a la seua
   identitat»: el punt únic on es decidix on aterra qualsevol entrada correcta
   (contrasenya, registre amb sessió, Google per finestra o per redirecció, i
   la barrera RequireAuth, que passa per /registre). Mai el Panell de Control. */
export const RUTA_DESPRES_D_ENTRAR = '/el-meu-perfil';

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

/* Una entrada de la Gestoria: /app/gestoria/<entrada>, i res més darrere que no siga consulta o fragment. */
const ENTRADA_DE_LA_GESTORIA = /^\/app\/gestoria\/[a-z0-9-]+(?:[?#]|$)/;

/**
 * On aterra una entrada correcta: la tornada, si és segura i és una entrada
 * de la Gestoria; si no, sempre el propi perfil (ordre del Mestre, 261002).
 * @param {unknown} tornar el ?tornar de la consulta
 * @returns {string}
 */
export function aterratgeDespresDEntrar(tornar) {
  const tornada = tornadaSegura(tornar);
  return tornada && ENTRADA_DE_LA_GESTORIA.test(tornada) ? tornada : RUTA_DESPRES_D_ENTRAR;
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
