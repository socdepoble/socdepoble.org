import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from './SessionContext';
import { getDefaultUserId } from '../../data/backendPort';
import { getEfimer, setEfimer } from '../../config/storage';

const IdentitatContext = createContext(null);

export function IdentitatProvider({ children, config = {} }) {
  const { currentUser } = useSession();

  const [memberships, setMemberships] = useState([]);
  
  const getSafeDefaultUserId = useCallback(() => {
    try { return getDefaultUserId(config); } catch { return null; }
  }, [config]);

  const [pref, setPref] = useState(() => getEfimer('actor-preference'));

  const defaultActorId = currentUser?.id || getSafeDefaultUserId();
  
  const { actorType, actorId } = useMemo(() => {
    if (currentUser && pref?.type === 'entitat' && pref?.id) {
       // Si validem memberships en el futur, comprovarem ací:
       // && memberships.some(m => m.slug === pref.id)
       return { actorType: 'entitat', actorId: pref.id };
    }
    return { actorType: 'persona', actorId: defaultActorId };
  }, [currentUser, pref, defaultActorId]);

  const setActor = useCallback((type, id) => {
    const newPref = { type, id };
    setPref(newPref);
    setEfimer('actor-preference', newPref);
  }, []);

  const actorKey = `${actorType}::${actorId}`;

  // En el futur ací es farà un fetch a backend per carregar 'organizations'
  // i 'organization_memberships' si l'usuari està logat.

  const value = useMemo(() => ({
    actorType,
    actorId,
    actorKey,
    memberships,
    setActor
  }), [actorType, actorId, actorKey, memberships, setActor]);

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
