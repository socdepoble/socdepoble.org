// src/app/contexts/SessionContext.jsx
import { createContext, useCallback, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { teCapacitat, logout, loginWithGoogle, loginWithPassword, registerWithPassword, listMyOrganizations, comprovaServidor } from '../../data/backendPort.js';
import { getSessionState, subscribeSession, setSessionConfig, renovaAra } from '../../data/sessionService.js';
import { eixDeLaSessio, preparaEixida as preparaEixidaNucli, reprenSessio } from '../../data/autodesament/sessio.js';
import { enviaNotesDeLUsuari, oblidaNotesDeLUsuari, pendentsNotesDe } from '../../sections/notes/GlobalSaveManager.js';

const SessionContext = createContext(null);
const EMPTY_CONFIG = Object.freeze({});

/* T47 (correcció de la revisió C02, 260928) · Els gestors d'esborranys que no
   són la cua del nucli entren a l'eixida des d'ací (src/data no importa de
   src/sections). Notes ('SdpNotesQueue'): envia amb la sessió encara vàlida,
   oblida només si tancar ha anat bé i diu el que queda per a l'avís (C01). */
const ABANS_DE_TANCAR = Object.freeze([enviaNotesDeLUsuari]);
const DESPRES_DE_TANCAR = Object.freeze([oblidaNotesDeLUsuari]);
const PENDENTS_DE = Object.freeze([pendentsNotesDe]);

/* T2 i T4 (ordre del Mestre, 260930) · La capacitat opcional 'salut' del port,
   tal qual. Es resol en cridar-la, no en muntar: un port sense la capacitat
   (o una prova que el simula sense ella) no fa caure el proveïdor. Qui la usa
   pregunta abans teCapacitat('salut'). */
const comprovaServidorDelPort = (...args) => comprovaServidor(...args);

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
  const usuariId = usuari?.id ?? null;

  /* T47 (ordre del Mestre, 260928) · En cada entrada de sessió (i en arrencar
     amb una de viva), la cua d'autodesament torna a enviar el que esta
     persona havia deixat pendent en este backend. */
  useEffect(() => {
    if (estat === 'dins' && usuariId != null) reprenSessio(config, usuariId);
  }, [config, estat, usuariId]);

  const backendFuncs = useMemo(() => ({
    teCapacitat,
    loginWithGoogle,
    loginWithPassword,
    registerWithPassword,
    listMyOrganizations,
    comprovaServidor: comprovaServidorDelPort
  }), []);

  /* La revocació pertany a l'adaptador. Sense configuració explícita, o quan
     el botó passa l'esdeveniment del clic, usem la del proveïdor actual. */
  const configDeCrida = useCallback(
    (configCrida) => (configCrida && typeof configCrida === 'object' && !('preventDefault' in configCrida)
      ? configCrida : config),
    [config]
  );

  /* T47 (correcció de la revisió, 260928) · Tota eixida de veres passa per
     eixDeLaSessio: primer un intent final (curt) d'enviar el que esta persona
     té pendent amb la sessió encara vàlida, després `tanca` i, si ha anat bé,
     els seus esborranys s'obliden d'este dispositiu (un ordinador compartit
     del poble). `eixAmb` és per a qui tanca la sessió d'una altra manera (la
     baixa la tanca dins de l'adaptador). */
  const eixAmb = useCallback(
    (tanca, configCrida) => eixDeLaSessio({
      config: configDeCrida(configCrida), usuariId, tanca,
      abansDeTancar: ABANS_DE_TANCAR, despresDeTancar: DESPRES_DE_TANCAR,
    }),
    [configDeCrida, usuariId]
  );

  const tancaSessio = useCallback(
    (configCrida, opcions) => {
      const configEixida = configDeCrida(configCrida);
      /* Buidar només la pestanya ('pestanya': renovació fallida) no és eixir:
         els esborranys es conserven i es tornen a enviar en tornar. */
      if (opcions?.abast === 'pestanya') return logout(configEixida, opcions);
      return eixDeLaSessio({
        config: configEixida, usuariId, tanca: () => logout(configEixida, opcions),
        abansDeTancar: ABANS_DE_TANCAR, despresDeTancar: DESPRES_DE_TANCAR,
      });
    },
    [configDeCrida, usuariId]
  );

  /* T47 (correcció de la revisió C01, 260928) · Abans de «Confirmar eixida» o
     «Eixir del poble»: l'intent final i el que el servidor encara NO té. No
     tanca ni oblida res; qui pregunta ho diu a la persona i ella decidix. */
  const preparaEixida = useCallback(
    (configCrida) => preparaEixidaNucli({
      config: configDeCrida(configCrida), usuariId, abansDeTancar: ABANS_DE_TANCAR, pendentsDe: PENDENTS_DE,
    }),
    [configDeCrida, usuariId]
  );

  const value = useMemo(
    () => {
      const estatEfectiu = (estat === 'dins' && rol === 'desconegut') ? 'comprovant' : estat;
      return { currentUser: usuari, estat: estatEfectiu, rol, esSuperadmin: rol === 'superadmin', renovaAra, generacio, ...backendFuncs, logout: tancaSessio, eixAmb, preparaEixida };
    },
    [usuari, estat, rol, generacio, backendFuncs, tancaSessio, eixAmb, preparaEixida]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession ha de ser usat dins de SessionProvider');
  return ctx;
}

/** T47 · La sessió si n'hi ha proveïdor, o null (una peça muntada sola: proves, catàleg). */
export function useSessioOpcional() {
  return useContext(SessionContext);
}
