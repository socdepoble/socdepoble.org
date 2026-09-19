// src/app/contexts/SessionContext.jsx
import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  getCurrentUser, teCapacitat, refrescaSessio, logout, elMeuRol,
  loginWithGoogle, loginWithPassword, registerWithPassword, listMyOrganizations
} from '../../data/backendPort.js';
import { getSessionState, subscribeSession, setSessionConfig, renovaAra } from '../../data/sessionService.js';

const SessionContext = createContext(null);

/** 'comprovant' → encara no se sap. 'dins' / 'fora' → resolt. */
export const ESTAT = Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' });

export function SessionProvider({ children, config = {} }) {
  const [estatComplet, setEstatComplet] = useState(getSessionState());
  
  useEffect(() => {
    setSessionConfig(config);
    return subscribeSession(setEstatComplet);
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
    () => ({ currentUser: usuari, estat, rol, esSuperadmin: rol === 'superadmin', renovaAra, generacio, ...backendFuncs }),
    [usuari, estat, rol, generacio, backendFuncs]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession ha de ser usat dins de SessionProvider');
  return ctx;
}
