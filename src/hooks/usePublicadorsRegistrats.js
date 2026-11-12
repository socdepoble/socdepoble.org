import { useEffect, useReducer, useRef, useState } from 'react';
import { useSessioOpcional } from '../app/contexts/SessionContext.jsx';
import { useUIStateOpcional } from '../app/contexts/UIContext.jsx';
import { backendScope } from '../config/backendConfig.js';
import { lligPublicadorsRegistrats, teCapacitat } from '../data/backendPort.js';
import { publicacioPerDefecte } from '../data/copublicacio.js';

const CONFIG_BUIDA = Object.freeze({});

export function usePublicadorsRegistrats({ recursTipus, recursId } = {}, configExplicit) {
  const configContext = useUIStateOpcional()?.externalConfig;
  const sessio = useSessioOpcional();
  const config = configExplicit ?? configContext ?? CONFIG_BUIDA;
  const configActual = useRef(config);
  configActual.current = config;
  const disponible = Boolean(recursTipus && recursId && teCapacitat('copublicacio'));
  const [intent, recarrega] = useReducer(nombre => nombre + 1, 0);
  const [estat, desaEstat] = useState(null);
  const clau = disponible ? JSON.stringify([backendScope(config), sessio?.currentUser?.id,
    sessio?.generacio, recursTipus, recursId, intent]) : null;

  useEffect(() => {
    if (clau === null) return undefined;
    const control = new AbortController();
    const configCrida = { ...configActual.current, signal: control.signal };
    Promise.resolve().then(async () => {
      if (control.signal.aborted) return;
      try {
        const resultat = await lligPublicadorsRegistrats({ recursTipus, recursId }, configCrida);
        if (!control.signal.aborted) desaEstat({ clau, resultat, fase: 'llest', error: null });
      } catch (error) {
        if (!control.signal.aborted) desaEstat({ clau, resultat: null,
          fase: error?.code === 'no-disponible' ? 'no-disponible' : 'error', error });
      }
    });
    return () => control.abort();
  }, [clau, recursTipus, recursId]);

  const actual = clau !== null && estat?.clau === clau ? estat : null;
  const consulta = actual?.resultat ?? publicacioPerDefecte({ recursTipus, recursId });
  const principal = consulta.publicadorsRegistrats[0];
  const dadesBarra = principal ? {
    authorName: principal.nom,
    authorLocation: principal.poble_nom,
    authorAvatar: principal.avatar_url,
    authorHref: principal.slug_ruta,
    publicadorsRegistrats: consulta.publicadorsRegistrats
  } : null;
  return {
    ...consulta,
    dadesBarra,
    fase: actual?.fase ?? (disponible ? 'carregant' : 'no-disponible'),
    error: actual?.error ?? null,
    recarrega
  };
}
