/** Aïlla cada càrrega per àmbit i descarta respostes de generacions anteriors. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from './SessionContext.jsx';

let hostPromise;
function hostReady(signal) {
  // Compartir la importació entre providers i el doble muntatge de StrictMode.
  hostPromise ||= import('../../host.js').catch(error => { hostPromise = null; throw error; });
  return hostPromise.then(host => host.quanLlest({ signal }));
}

/* Decisió 2 del Mestre (261007) · «El Mur "Carregant": RENOVACIÓ SILENCIOSA.
   La sessió s'ha de renovar en segon pla sense forçar un re-render complet
   del Mur que provoque la pantalla de "Carregant".» Dues claus amb papers
   diferents:
   - AÏLLAMENT (`token`): la clau d'àmbit del proveïdor (backend, persona,
     actor), la configuració, l'actor de la petició i el loader. Si canvia, el
     que hi havia és d'una altra identitat: es buida en el MATEIX pintat
     ('loading', payload null) i tota resposta tardana de l'àmbit vell es
     descarta. És la garantia de sempre (scopedProviders.test.jsx).
   - FRESCOR: la `generacio` de la sessió (cada renovació del JWT la puja,
     sessionService.js) i el `tick` de refresh (després de publicar,
     sdp:refresh-data). És la mateixa identitat: si ja hi ha dades bones
     ('ready'), es conserven i es tornen a demanar en segon pla amb
     `revalidant: true`. Cap estat nou: els consumidors comproven
     status !== 'ready' i === 'loading', i un 'revalidating' els tornaria a
     buidar (verificador de l'auditoria 261007). Sense dades bones ('loading'
     o 'error', com el «Torna-ho a provar»), torna a 'loading' com sempre.
   Si la revalidació falla, es conserva l'últim payload bo en 'ready', amb
   `revalidant: false` i l'error a banda (`errorRevalidacio`), sense tocar
   `status` ni `error`. Són dades de la MATEIXA identitat (l'aïllament no ha
   canviat) i la propera renovació o refresh ho torna a provar; canviar-les
   per la pantalla d'error per una fallada transitòria en segon pla (la xarxa
   del mòbil en tornar a la pestanya) és just el que l'ordre prohibix. Un
   canvi de persona, actor o backend mai no arriba ací: purga abans. */
const BUIT = Object.freeze({ status: 'loading', payload: null, error: null, revalidant: false, errorRevalidacio: null });

export function useScopedResource(loader, actorId, scopeKey, config) {
  /* Auditoria 261007 (B) · La generació 0 és el primer pintat, abans que
     l'efecte del SessionProvider configure la sessió (sessionService la puja
     sempre en eixa primera configuració). Els efectes dels fills corren abans
     que el del pare: la tanda de la generació 0 eixia (7 peticions REST en
     remot entre Core, Mur i Multimèdia) i s'avortava en el pintat següent
     sense haver-se pintat mai. Ara espera en 'loading', que és el mateix que
     ja es veia. La guarda viu ací perquè l'hereten tots els proveïdors.
     Decisió 2 del Mestre (261007) · La `generacio` ja no viatja a la clau
     d'àmbit dels proveïdors: és frescor, i la gestiona este hook. */
  const { generacio } = useSession();
  const actiu = generacio !== 0;
  const token = useMemo(() => ({ scopeKey, config, actorId, loader }), [scopeKey, config, actorId, loader]);
  const latest = useRef(0);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ token: null, ...BUIT });
  useEffect(() => {
    const generation = ++latest.current;
    const controller = new AbortController();
    const current = () => !controller.signal.aborted && latest.current === generation;
    // Dades bones del MATEIX àmbit: l'única cosa que una revalidació conserva.
    const ambDades = previ => previ.token === token && previ.status === 'ready';
    setState(previ => {
      if (ambDades(previ)) return previ.revalidant === actiu ? previ : { ...previ, revalidant: actiu };
      return previ.token === token && previ.status === 'loading' ? previ : { token, ...BUIT };
    });
    if (!actiu) return () => controller.abort();
    void (async () => {
      try {
        await hostReady(controller.signal);
        if (!current()) return;
        const payload = await loader(actorId, { ...config, signal: controller.signal });
        if (current()) setState({ token, status: 'ready', payload, error: null, revalidant: false, errorRevalidacio: null });
      } catch (error) {
        if (!current()) return;
        setState(previ => (ambDades(previ)
          ? { ...previ, revalidant: false, errorRevalidacio: error }
          : { token, status: 'error', payload: null, error, revalidant: false, errorRevalidacio: null }));
      }
    })();
    return () => controller.abort();
  }, [token, loader, actorId, config, tick, generacio, actiu]);
  const refresh = useCallback(() => setTick(value => value + 1), []);
  return useMemo(() => (state.token === token ? { ...state, refresh }
    : { token, ...BUIT, refresh }), [state, token, refresh]);
}
