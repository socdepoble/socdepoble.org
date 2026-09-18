import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useLocation, matchPath } from './RouterContext';
import { useSession } from './SessionContext';
import { getDefaultUserId } from '../../data/backendPort';

const IdentitatContext = createContext(null);

export function IdentitatProvider({ children, config = {} }) {
  const { currentUser } = useSession();
  const location = useLocation();

  let actorType = 'persona';
  let actorId = currentUser?.id || getDefaultUserId(config);

  const entitatMatch = matchPath('/e/:slug/*', location.pathname);
  if (entitatMatch) {
    actorType = 'entitat';
    actorId = entitatMatch.params.slug;
  } else if (location.pathname.startsWith('/jo')) {
    actorType = 'persona';
  }

  const actorKey = `${actorType}::${actorId}`;

  const [memberships, setMemberships] = useState([]);

  // En el futur ací es farà un fetch a backend per carregar 'organizations'
  // i 'organization_memberships' si l'usuari està logat.

  const value = useMemo(() => ({
    actorType,
    actorId,
    actorKey,
    memberships
  }), [actorType, actorId, actorKey, memberships]);

  return (
    <IdentitatContext.Provider value={value}>
      {children}
    </IdentitatContext.Provider>
  );
}

export function useIdentitat() {
  const context = useContext(IdentitatContext);
  if (!context) throw new Error('useIdentitat ha de ser usat dins de IdentitatProvider');
  return context;
}
