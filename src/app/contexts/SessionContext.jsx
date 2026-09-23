// src/app/contexts/SessionContext.jsx
import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { teCapacitat, logout, loginWithGoogle, loginWithPassword, registerWithPassword, listMyOrganizations } from '../../data/backendPort.js';
import { getSessionState, subscribeSession, setSessionConfig, renovaAra } from '../../data/sessionService.js';

const SessionContext = createContext(null);
const EMPTY_CONFIG = Object.freeze({});

/** 'comprovant' → encara no se sap. 'dins' / 'fora' → resolt. */
export const ESTAT = Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' });

export function SessionProvider({ children, config = EMPTY_CONFIG }) {
  const owner = useRef(Symbol('SessionProvider'));
  const [estatComplet, setEstatComplet] = useState(getSessionState());
  
  useEffect(() => {
    const release = setSessionConfig(config, owner.current);
    const unsubscribe = subscribeSession(setEstatComplet);
    return () => { unsubscribe(); release(); };
  }, [config]);

  const { usuari, estat, rol, generacio } = estatComplet;

  const backendFuncs = useMemo(() => ({
    logout,
    teCapacitat,
    loginWithGoogle,
    loginWithPassword,
    registerWithPassword,
    listMyOrganizations
  }), []);

  const value = useMemo(
    () => {
      const estatEfectiu = (estat === 'dins' && rol === 'desconegut') ? 'comprovant' : estat;
      return { currentUser: usuari, estat: estatEfectiu, rol, esSuperadmin: rol === 'superadmin', renovaAra, generacio, ...backendFuncs };
    },
    [usuari, estat, rol, generacio, backendFuncs]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession ha de ser usat dins de SessionProvider');
  return ctx;
}
