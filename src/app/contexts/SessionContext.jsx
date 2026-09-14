// src/app/contexts/SessionContext.jsx
import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { getCurrentUser, teCapacitat, refrescaSessio, logout, elMeuRol } from '../../data/backendPort.js';
import { caducitatJwt, MARGE_RENOVACIO_MS } from '../../data/identitat.js';

const SessionContext = createContext(null);

/** 'comprovant' → encara no se sap. 'dins' / 'fora' → resolt. */
export const ESTAT = Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' });

export function SessionProvider({ children }) {
  const [usuari, setUsuari] = useState(null);
  const [estat, setEstat] = useState(ESTAT.COMPROVANT);
  const [rol, setRol] = useState(null);
  const temporitzador = useRef(null);

  /* Llegix la sessió i reprograma la renovació. Únic camí d'entrada. */
  const sincronitza = useCallback(() => {
    let u = null;
    try { u = getCurrentUser(); } catch { u = null; }  // backend no segellat encara
    setUsuari(u);
    setEstat(u ? ESTAT.DINS : ESTAT.FORA);
    if (!u) { setRol(null); }
    return u;
  }, []);

  useEffect(() => {
    sincronitza();
    if (typeof window === 'undefined') return;
    const alCanvi = () => sincronitza();
    window.addEventListener('sdp:auth-change', alCanvi);
    return () => window.removeEventListener('sdp:auth-change', alCanvi);
  }, [sincronitza]);

  /* ── Caducitat del JWT · §2 ──────────────────────────────────────────── */
  const renovaAra = useCallback(async () => {
    if (!teCapacitat('sessio')) { await logout(); return; }
    const ok = await refrescaSessio().catch(() => false);
    if (!ok) await logout();   // logout() emet sdp:auth-change i sincronitza
  }, []);

  useEffect(() => {
    if (temporitzador.current) { clearTimeout(temporitzador.current); temporitzador.current = null; }
    if (estat !== ESTAT.DINS) return;

    const exp = caducitatJwt();
    if (!exp) return;                        // token opac: no podem programar res

    const espera = exp - Date.now() - MARGE_RENOVACIO_MS;
    if (espera <= 0) { renovaAra(); return; }

    /* setTimeout no dispara si el portàtil dorm i es passa de llarg, i el
       màxim d'un timer és ~24,8 dies. Capem a 10 min i reavaluem: el cost
       és un render cada 10 min, el benefici és que no hi ha deriva. */
    temporitzador.current = setTimeout(
      () => { if (caducitatJwt() <= Date.now() + MARGE_RENOVACIO_MS) renovaAra(); else sincronitza(); },
      Math.min(espera, 600000)
    );
    return () => { if (temporitzador.current) clearTimeout(temporitzador.current); };
  }, [estat, usuari?.id, renovaAra, sincronitza]);

  /* Tornar d'una pestanya adormida: el timer no ha corregut. Comprova al vol. */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const alDespertar = () => {
      if (document.visibilityState !== 'visible') return;
      const exp = caducitatJwt();
      if (!exp) return;
      if (exp <= Date.now()) { renovaAra(); return; }             // JWT caducat, però el refresh token podria estar viu
      if (exp - Date.now() <= MARGE_RENOVACIO_MS) renovaAra();  // moribund: renova
    };
    document.addEventListener('visibilitychange', alDespertar);
    window.addEventListener('online', alDespertar);
    return () => {
      document.removeEventListener('visibilitychange', alDespertar);
      window.removeEventListener('online', alDespertar);
    };
  }, [renovaAra]);

  /* Rol de plataforma. Cosmètic: qui mana és la RLS. Fail-closed a 'usuari'. */
  useEffect(() => {
    if (estat !== ESTAT.DINS || !teCapacitat('sessio')) return;
    let viu = true;
    elMeuRol().then(r => { if (viu) setRol(r || 'usuari'); }).catch(() => { if (viu) setRol('usuari'); });
    return () => { viu = false; };
  }, [estat, usuari?.id]);

  const value = useMemo(
    () => ({ currentUser: usuari, estat, rol, esSuperadmin: rol === 'superadmin', renovaAra }),
    [usuari, estat, rol, renovaAra]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession ha de ser usat dins de SessionProvider');
  return ctx;
}
