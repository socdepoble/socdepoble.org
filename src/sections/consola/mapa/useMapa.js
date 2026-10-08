import { useFontDev } from '../useFontDev.js';
import { carregaMapa } from './mapaContent.js';

/**
 * Una sola lectura del Mapa per a totes les pàgines de la Consola.
 * `actiu: false` no llig res: el consumidor ja rep el Mapa d'un altre lloc.
 * Fora de DEV tampoc no llig res, ni en muntar ni amb `carrega` (Refrescar):
 * higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin»).
 * Estat: 'loading' | 'ready' | 'absent' | 'error'. Un error conserva
 * l'última lectura bona.
 * Neteja 261007 (prompt 261007_1628, peça D) · La lectura és la de
 * useFontDev (../useFontDev.js), la mateixa de consola.json; ací només es diu
 * `mapa` el que el hook genèric diu `valor`.
 */
export function useMapa({ actiu = true } = {}) {
  const { valor: mapa, ...font } = useFontDev(carregaMapa, { actiu });
  return { ...font, mapa };
}
