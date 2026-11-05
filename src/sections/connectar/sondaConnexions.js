/**
 * sondaConnexions.js — Si el servidor té les connexions públiques (FEDI-23).
 *
 *   · Ronda 7 (GLOBAL-06) · El port declara la capacitat 'connexionsPubliques'
 *     quan l'adaptador té els mètodes, però el servidor pot no tindre la
 *     migració 2611032100: aleshores la lectura torna NO-DISPONIBLE. Es
 *     recorda per backend, en este document, i ni la Targeta 2 ni
 *     l'interruptor de la connexió no tornen a fer la crida a cada visita.
 *   · Només NO-DISPONIBLE es recorda: un error de xarxa o de permís no diu res
 *     del servidor, i la pròxima visita torna a preguntar.
 *   · No és estat del port (P0-16): si el mòdul es reavalua, només es perd el
 *     record i es torna a preguntar una vegada.
 *   · Límits acceptats (revisió 261104): el record no caduca dins del document
 *     (si s'aplica la migració amb la pestanya oberta, cal recarregar), i dues
 *     sondes concurrents del mateix backend (la Targeta 2 i l'interruptor) no
 *     es dedupliquen: com a màxim, una crida de més.
 */
import { teCapacitat } from '../../data/backendPort.js';
import { backendScope } from '../../config/backendConfig.js';

const SENSE_CONNEXIONS = new Set();
const CODIS_ESQUEMA_NO_DISPONIBLE = new Set([
  'NO-DISPONIBLE',
  'PGRST202',
  'PGRST205'
]);

/**
 * Si un error indica que el servidor encara no té la migració o les RPC/taules
 * de connexions públiques (tant si l'adaptador ja l'ha normalitzat a
 * `NO-DISPONIBLE` com si arriba amb PGRST202/PGRST205 de PostgREST).
 */
export function esErrorNoDisponibleConnexions(error) {
  if (!error || typeof error !== 'object') return false;
  const code = typeof error.code === 'string' ? error.code.trim().toUpperCase() : '';
  // Un 404 nu també pot vindre d'una passarel·la o d'una fitxa absent. No
  // desactiva tota la capacitat durant la resta de la sessió del document.
  return CODIS_ESQUEMA_NO_DISPONIBLE.has(code);
}

/** La clau del backend; una configuració il·legible és un àmbit més. */
export function ambitDeConnexions(config) {
  try { return backendScope(config); } catch { return 'backend:invàlid'; }
}

/** El port declara les connexions i el servidor no ha dit que no les té. */
export function connexionsPotserDisponibles(ambit) {
  try {
    return teCapacitat('connexionsPubliques') === true && !SENSE_CONNEXIONS.has(String(ambit));
  } catch { return false; }
}

/** Recorda que el servidor d'este backend no té les connexions (només amb NO-DISPONIBLE o esquema absent). */
export function recordaSiNoDisponibles(ambit, error) {
  if (esErrorNoDisponibleConnexions(error)) SENSE_CONNEXIONS.add(String(ambit));
}

/** Només per a les proves. */
export function oblidaSondaConnexions() {
  SENSE_CONNEXIONS.clear();
}
