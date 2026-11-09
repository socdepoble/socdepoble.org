import { useCallback, useEffect, useRef, useState } from 'react';
import { actualitzaPresenciaXat, loadRitmeXat, teCapacitat } from '../../data/backendPort.js';
import { generaId } from './missatges.js';
import { creaSessioRitmeXat } from './ritmeXat.js';

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const BUIT = Object.freeze({ rebutPelsAltresFinsSeq: 0, llegitPelsAltresFinsSeq: 0, escrivint: [] });
export function useRitmeXat({ fil, joId, modeDades, senseSessio, ambit, config }) {
  const sessio = useRef(null);
  const instancia = useRef(null);
  const revisio = useRef(0);
  if (instancia.current === null) instancia.current = generaId();
  const [dades, setDades] = useState(null);
  const filId = fil?.id;
  const actiu = modeDades === 'remote' && !senseSessio && UUID.test(joId) && UUID.test(filId)
    && fil?.participant !== false && !fil?.perDefecte && !fil?.filLocalIAIA && teCapacitat('xatRitme');
  const potPublicar = actiu && fil?.potEscriure !== false && ['directe', 'grup'].includes(fil?.tipus) && !fil?.esIA;
  useEffect(() => {
    if (!actiu) return undefined;
    let vigent = true;
    const lifecycle = creaSessioRitmeXat({ instancia: instancia.current, nextRevisio: () => ++revisio.current,
      load: signal => loadRitmeXat(filId, { ...config, signal, ritmeActorId: joId }),
      publica: (value, signal) => potPublicar ? actualitzaPresenciaXat(filId, value, { ...config, signal, ritmeActorId: joId }) : Promise.resolve({ acceptat: true }),
      onChange: value => { if (vigent) setDades({ ambit, filId, value }); }
    });
    sessio.current = lifecycle;
    return () => { vigent = false; lifecycle.stop(); if (sessio.current === lifecycle) sessio.current = null; };
  }, [actiu, potPublicar, filId, joId, ambit, config]);
  const onEscrivint = useCallback(value => { if (potPublicar) sessio.current?.input(value === true); }, [potPublicar]);
  return { ritme: actiu && dades?.ambit === ambit && dades?.filId === filId ? dades.value : BUIT, onEscrivint };
}
