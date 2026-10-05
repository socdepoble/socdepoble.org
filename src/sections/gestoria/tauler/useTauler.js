/**
 * useTauler.js — l'estat del Tauler de la Gestoria: la porta d'aprovació del
 * tractor 'gestoria.tauler' i la lectura dels extractes.
 *
 * Ordre del Mestre, 261004 (onada 2, pas 1). La porta és la de sempre
 * (useTractors, el magatzem compartit de la pàgina) i l'aprovació es llig
 * just abans de cada lectura (contextAprovacio), mai de memòria: revocar el
 * tractor al panell de Tractors para la lectura següent. executaTractorTauler
 * la torna a exigir abans de tocar cap fitxer (fail-closed).
 *
 * La lectura viu NOMÉS en la memòria d'este hook: res es desa al navegador.
 * `llegit` és l'instant de la darrera lectura bona (la data de sincronització
 * de la boina). `oblida` ho buida tot i cancel·la la lectura activa; també
 * la cancel·len una crida programàtica nova a `llig` i el desmuntatge.
 * El selector està desactivat mentre llig; canviar de mòdul dins de la closca
 * conserva la lectura. Revocar l'aprovació només bloqueja les lectures següents.
 * El fitxer ja començat acaba,
 * però els seus bytes es descarten i no se'n comença cap altre.
 * `generacio` canvia a cada lectura bona
 * i a cada oblit: les targetes la porten a la clau i tornen a nàixer amb
 * l'ull tancat, de manera que l'ull obert d'una targeta no passa mai a les
 * xifres d'una lectura nova (ordre del Mestre, 261004).
 * Proves: el magatzem, subtle, el catàleg, l'entorn i el rellotge s'injecten,
 * com a ContenidorGestoria.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { contextAprovacio, useTractors } from '../../tractors/useTractors.js';
import { TRACTOR_TAULER } from '../tractors.js';
import { executaTractorTauler } from './nucli/tractorTauler.js';

const ESTAT_BUIT = Object.freeze({ llegint: false, error: null, lectura: null, llegit: null, generacio: 0 });
const missatgeDe = (error) => error?.message ?? String(error);

/**
 * @param {{ magatzem?: object, subtle?: SubtleCrypto, tractors?: object[], entorn?: object, rellotge?: () => number }} [opcions]
 * @returns {{ porta: object, fila: object|null, aprovat: boolean, llegint: boolean, error: string|null,
 *   lectura: object|null, llegit: number|null, generacio: number, llig: (fitxers: ArrayLike<File>) => Promise<void>,
 *   oblida: () => void }}
 */
export function useTauler({ magatzem, subtle, tractors, entorn, rellotge } = {}) {
  const porta = useTractors({ magatzem, subtle, tractors, entorn, rellotge });
  const fila = porta.tractors.find((t) => t.id === TRACTOR_TAULER.id) ?? null;
  const [estat, setEstat] = useState(ESTAT_BUIT);
  const torn = useRef(0);
  const lecturaActiva = useRef(null);

  useEffect(() => () => {
    torn.current += 1;
    lecturaActiva.current?.abort();
    lecturaActiva.current = null;
  }, []);

  const llig = useCallback(async (fitxers) => {
    const meu = ++torn.current;
    lecturaActiva.current?.abort();
    const controlador = new AbortController();
    lecturaActiva.current = controlador;
    setEstat((previ) => ({ ...previ, llegint: true, error: null }));
    try {
      const aprovacio = await contextAprovacio(TRACTOR_TAULER.id, { magatzem, subtle, tractors, entorn, rellotge });
      const lectura = await executaTractorTauler({ fitxers, aprovacio, subtle, signal: controlador.signal });
      const ara = typeof rellotge === 'function' ? rellotge() : Date.now();
      if (meu === torn.current) setEstat({ llegint: false, error: null, lectura, llegit: ara, generacio: meu });
    } catch (error) {
      if (meu === torn.current) setEstat((previ) => ({ ...previ, llegint: false, error: missatgeDe(error) }));
    } finally {
      // Una lectura antiga no pot retirar el controlador de la següent.
      if (lecturaActiva.current === controlador) lecturaActiva.current = null;
    }
  }, [magatzem, subtle, tractors, entorn, rellotge]);

  const oblida = useCallback(() => {
    torn.current += 1;
    lecturaActiva.current?.abort();
    lecturaActiva.current = null;
    setEstat({ ...ESTAT_BUIT, generacio: torn.current });
  }, []);

  return { porta, fila, aprovat: fila?.estat === 'aprovat', ...estat, llig, oblida };
}
