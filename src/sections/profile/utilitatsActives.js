/**
 * utilitatsActives.js — la preferència «Mostrar al Panell de Control» de les
 * utilitats ({ <id>: booleà }): l'escriu DetallEspai i la llig el Panell
 * (ControlSection).
 *
 * Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
 * Abans DetallEspai llegia i escrivia la clau directament a localStorage i
 * llançava un `storage` fals a window: dins de WordPress, la pàgina de
 * l'amfitrió rebia un esdeveniment amb key null que no era seu. Ara:
 *  · s'escriu per storage.js (setVal), amb el prefix de l'app;
 *  · es llig la clau amb prefix i, si no n'hi ha, la de llegat
 *    ('sdp_utilitats_actives', getPreferenciaLlegat): ningú no perd la
 *    configuració que ja tenia;
 *  · el Panell s'assabenta per un estat compartit d'este mòdul
 *    (subscriuUtilitatsActives), dins de l'app: cap esdeveniment a window ni
 *    al document de l'amfitrió.
 *
 * Ordre del Mestre (261007, prompt 261007_1628, peça C) · Una sola regla i un
 * sol id per a les dues bandes:
 *  · la regla és la del Panell: una utilitat hi és mentre la preferència no
 *    diga exactament false (estaAlPanell). Abans el Perfil la llegia al revés
 *    (sense preferència, «Mostrar») i el primer clic no canviava res;
 *  · l'id és el del Panell (aplicacions.js, camp `panell`). Una preferència
 *    desada abans amb l'id de l'aplicació ('metriques', 'lector-rss') es
 *    llig com la del seu id del Panell ('consola', 'rss') mentre este no en
 *    tinga cap de pròpia (ALIES_DEL_PANELL): ningú no perd el que va triar.
 */
import { getPreferenciaLlegat, getVal, setVal } from '../../config/storage.js';
import { ALIES_DEL_PANELL } from './aplicacions.js';

/* La clau pròpia: storage.js hi posa el prefix (STORAGE_PREFIX). */
export const CLAU_UTILITATS_ACTIVES = 'utilitats_actives';
/* La clau de llegat, sense prefix: només es llig. */
export const CLAU_UTILITATS_LLEGAT = 'sdp_utilitats_actives';

const ESCOLTES = new Set();

/* Només un objecte pla és una preferència; la resta (null, llista, text, número) no en diu res. */
const mapaDe = (valor) => (valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? valor : null);

function delLlegat() {
  const cru = getPreferenciaLlegat(CLAU_UTILITATS_LLEGAT);
  if (cru == null) return null;
  try {
    return mapaDe(JSON.parse(cru));
  } catch {
    return null;
  }
}

/* Peça C (261007) · Les preferències d'un id vell, copiades a l'id del Panell
   si este no en té cap. L'id vell es conserva tal qual: no s'esborra res. */
function ambAlies(preferencia) {
  for (const [vell, nou] of Object.entries(ALIES_DEL_PANELL)) {
    if (Object.hasOwn(preferencia, vell) && !Object.hasOwn(preferencia, nou)) preferencia[nou] = preferencia[vell];
  }
  return preferencia;
}

/**
 * La preferència guardada: la clau amb prefix i, si no n'hi ha, la de llegat,
 * amb les preferències dels ids vells traduïdes a l'id del Panell. Sense cap, {}.
 */
export function llegixUtilitatsActives() {
  const propia = mapaDe(getVal(CLAU_UTILITATS_ACTIVES));
  return ambAlies({ ...(propia ?? delLlegat() ?? {}) });
}

/**
 * Peça C (261007) · Si una utilitat (per l'id del Panell) es veu al Panell de
 * Control: la regla de ControlSection (utilitatsAmagades), que només l'amaga
 * amb un false explícit. Sense preferència, malmesa o amb qualsevol altre
 * valor, hi és.
 */
export function estaAlPanell(id) {
  return llegixUtilitatsActives()[id] !== false;
}

/**
 * Guarda si una utilitat es mostra al Panell i ho diu a qui escolta. Parteix
 * de la preferència llegida (amb el llegat inclòs), així la primera escriptura
 * conserva tot el que ja hi havia. Torna true només si ha quedat escrit.
 */
export function desaUtilitatActiva(id, activa) {
  const nova = { ...llegixUtilitatsActives(), [id]: activa === true };
  if (!setVal(CLAU_UTILITATS_ACTIVES, nova)) return false;
  ESCOLTES.forEach((escolta) => escolta());
  return true;
}

/** Escolta els canvis de la preferència dins de l'app. Torna la funció per a deixar d'escoltar. */
export function subscriuUtilitatsActives(escolta) {
  ESCOLTES.add(escolta);
  return () => { ESCOLTES.delete(escolta); };
}
