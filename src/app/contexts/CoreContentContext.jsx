import { backendScope } from '../../config/backendConfig.js';
import { useScopedResource } from './useScopedResource.js';
import { useContext, useEffect, useMemo } from 'react';
/* P1-71 (Gauntlet 261029) · L'objecte de context viu a objectesDeContext.js,
   que no importa res del projecte. */
import { CoreContentContext } from './objectesDeContext.js';
import { loadCoreContent } from '../../data/backendPort.js';
import { aplicaPersonalitzacio } from '../../data/personalitzacio.js';
import { byId } from '../../config/contentHelpers';
import { useIdentitatOpcional } from './IdentitatContext.jsx';
import { useRecarregaExterna } from './useRecarregaExterna.jsx';
import { useUIActions } from './UIContext.jsx';
import { useSession } from './SessionContext.jsx';

/* PN-02 (auditoria Port Neutral 261025) · Defensa en profunditat: este
   proveïdor viu per damunt de la barrera de ruta (App.jsx), i una llista mal
   formada d'un adaptador (un objecte on toca una llista, un null o un número
   dins) el feia petar en pintar (byId, pages.map) i tombava el Mas sencer.
   Només una llista, i dins, només objectes; la llista neta es torna tal qual. */
const esFitxa = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const nomesFitxes = (valor) => {
  if (!Array.isArray(valor)) return [];
  return valor.every(esFitxa) ? valor : valor.filter(esFitxa);
};

/* Pla 261029_1605 (Bloc G, P1-71) · Blindatge HMR. En desenvolupament, una
   recàrrega en calent pot deixar este proveïdor lligat a un IdentitatContext
   vell (fronteres.test.js, useIdentitatDeLaBarra.js) i useIdentitat() tombava
   el Mas sencer a l'ErrorBoundary. Sense proveïdor, la reserva és la d'un
   visitant anònim, mai la d'una altra persona: el contingut core és del poble
   (pobles, agents i personalització) i no depén de l'actor, i la clau d'àmbit
   'anon' no coincidix amb cap «tipus::id». En producció IdentitatProvider
   sempre embolcalla l'App (PedraSecaEmbed.jsx). És una guarda defensiva.
   Gauntlet 261029 (cicle 1) · La causa del context duplicat s'ha tancat a
   l'arrel: els createContext de l'arrel viuen a objectesDeContext.js, que no
   importa res del projecte, i una instància nova d'este mòdul o de
   SessionContext.jsx ja no en porta cap de nou (objectesDeContext.test.jsx).
   Per això useSession(), davall, continua exigint el seu proveïdor. */
const IDENTITAT_DE_RESERVA = Object.freeze({ actorId: null, actorKey: 'anon' });

export function CoreContentProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitatOpcional() || IDENTITAT_DE_RESERVA;
  const { currentUser } = useSession();
  const { setGlobalStatus } = useUIActions();
  /* Decisió 2 del Mestre (261007) · Renovació silenciosa. La clau d'àmbit és
     la d'AÏLLAMENT (backend, persona, actor), sense `generacio`: renovar el
     JWT ja no buida el contingut ni fa parpellejar l'estat global (el
     contingut continua 'ready' mentre es revalida). La frescor per generació
     la porta useScopedResource. */
  const scopeKey = JSON.stringify([backendScope(config),
    currentUser?.id, actorKey]);
  const data = useScopedResource(loadCoreContent, actorId, scopeKey, config);
  const { status, payload, error, errorRevalidacio, refresh } = data;
  /* Decisió 2 del Mestre (261007) · L'estat global és l'entrada de la franja
     del node i del pilot del Perfil (T7 i T9, estatConnexio.js): «l'estat de
     l'última càrrega del contingut core» i «en el dubte, mai verd». Una
     revalidació en segon pla que falla conserva el contingut en 'ready' (la
     decisió només lleva el «Carregant»), però l'última càrrega ha fallat:
     l'estat global diu 'error' («Sense connexió»), com abans, sense buidar
     res. Torna a 'ready' quan una revalidació acaba bé. aria-busy només mira
     'loading' (App.jsx). */
  const estatGlobal = errorRevalidacio ? 'error' : status;
  useEffect(() => { setGlobalStatus(estatGlobal); }, [estatGlobal, setGlobalStatus]);

  /* Decisió 2 del Mestre (261007) · El valor es memoritza sobre camps i no
     sobre `data`: la marca `revalidant` fa un `data` nou en cada renovació i
     cada refresh, i amb `[data]` es refeien byId(towns) i tots els arrays
     amb el mateix contingut i es tornava a pintar cada consumidor de
     useCoreContent sense cap dada nova. `revalidant` no s'exposa: cap
     consumidor no la llig i el Mestre no ha demanat cap indicador.
     `errorRevalidacio` sí (l'error de la revalidació, a banda de `status`). */
  const value = useMemo(() => {
    if (status !== 'ready' || !payload) return { status, error, errorRevalidacio, towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [], personalitzacio: null, refresh };
    /* Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització
       del poble (camp additiu `personalitzacio` de loadCoreContent: taxonomia
       i estil, cada una { payload, versio } o null). L'únic punt de fusió:
       les etiquetes de la taxonomia entren al pageCopy ací, i tots els
       consumidors («pageCopy[k] || PAGE_COPY[k]») les reben sense saber-ho.
       Llei del Píxel: sense taxonomia, aplicaPersonalitzacio torna el mateix
       objecte, i el value és el d'abans amb el camp `personalitzacio` a més. */
    const personalitzacio = payload.personalitzacio ?? null;
    const towns = nomesFitxes(payload.towns);
    const pages = nomesFitxes(payload.pages);
    return {
      status,
      error,
      errorRevalidacio,
      towns,
      sortedTowns: byId(towns),
      featuredTowns: byId(towns).filter(t => t.is_featured),
      pages,
      pageCopy: aplicaPersonalitzacio(Object.fromEntries(pages.map(page => [page.id, { ...page }])), personalitzacio?.taxonomia?.payload),
      agents: nomesFitxes(payload.agents),
      ownerUserId: payload.ownerUserId,
      personalitzacio,
      refresh
    };
  }, [status, payload, error, errorRevalidacio, refresh]);

  useRecarregaExterna(refresh);

  return <CoreContentContext.Provider value={value}>{children}</CoreContentContext.Provider>;
}

export function useCoreContent() {
  return useContext(CoreContentContext) || { status: 'loading', towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [], personalitzacio: null };
}
