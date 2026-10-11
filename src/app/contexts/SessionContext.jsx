// src/app/contexts/SessionContext.jsx
import { createContext, useCallback, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { teCapacitat, logout, loginWithGoogle, loginWithPassword, registerWithPassword, listMyOrganizations, comprovaServidor, demanaRecuperacioContrasenya, definixContrasenyaNova } from '../../data/backendPort.js';
import { getSessionState, subscribeSession, setSessionConfig, renovaAra } from '../../data/sessionService.js';
import {
  escoltaRecuperacioPendent, estatEnllacDeRecuperacio, oblidaEnllacDeRecuperacio, oblidaRecuperacioPendent, recuperacioPendentPer
} from '../../data/recuperacioPendent.js';
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
/* R (Onada 3, 261003) · La capacitat opcional 'recuperacioContrasenya', igual:
   es resol en cridar-la i qui la usa pregunta abans teCapacitat.
   Correcció de la revisió · La recuperació en curs (data/recuperacioPendent.js:
   la marca i, des de R2, l'enllaç que espera «Desa») l'esborra ací, igual per
   a tots els backends: la contrasenya nova desada, eixir o una entrada
   explícita. Una entrada explícita només es pot fer des del formulari: la
   recuperació d'abans ja no és de ningú que estiga dins. */
const demanaRecuperacioDelPort = (...args) => demanaRecuperacioContrasenya(...args);
const definixContrasenyaDelPort = async (...args) => {
  const resultat = await definixContrasenyaNova(...args);
  oblidaRecuperacioPendent();
  return resultat;
};
const ambEntradaExplicita = (entra) => (...args) => {
  oblidaRecuperacioPendent();
  return entra(...args);
};
const loginWithPasswordDelPort = ambEntradaExplicita((...args) => loginWithPassword(...args));
const loginWithGoogleDelPort = ambEntradaExplicita((...args) => loginWithGoogle(...args));
const registerWithPasswordDelPort = ambEntradaExplicita((...args) => registerWithPassword(...args));
/* Eixir de veres (no buidar només la pestanya) també l'oblida, quan ha anat bé. */
const iOblidaRecuperacio = (promesa) => Promise.resolve(promesa).then((resultat) => {
  oblidaRecuperacioPendent();
  return resultat;
});

/* La capacitat del port, sense fer caure el proveïdor si el port no la sap dir. */
const teCapacitatSegura = (nom) => {
  try { return teCapacitat(nom) === true; } catch { return false; }
};

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

  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · `nivell` és el claim `aal`
     del JWT ('aal1' | 'aal2' | null, sessionService). */
  const { usuari, estat, rol, generacio, nivell = null } = estatComplet;
  const usuariId = usuari?.id ?? null;

  /* R · correcció de la revisió · La sessió d'un enllaç de recuperació encara
     ha de definir la contrasenya nova. Es llig a cada pintat (síncron i xicotet)
     i es torna a pintar quan la marca canvia, ací o en una altra pestanya. Sense
     la capacitat no hi ha pantalla on definir-la: no compta. */
  const [, setVersioRecuperacio] = useState(0);
  useEffect(() => escoltaRecuperacioPendent(() => setVersioRecuperacio((v) => v + 1)), []);
  const potRecuperar = teCapacitatSegura('recuperacioContrasenya');
  const recuperacioPendent = usuariId != null && potRecuperar && recuperacioPendentPer(usuariId);
  /* R2 (decisió del Mestre, 261003) · L'enllaç del correu espera «Desa» sense
     sessió: 'pendent' (en la memòria d'este document) o 'perdut' (la pestanya
     s'ha recarregat i cal tornar a obrir l'enllaç). Amb sessió o sense. */
  const enllacDeRecuperacio = potRecuperar ? estatEnllacDeRecuperacio() : null;

  /* T47 (ordre del Mestre, 260928) · En cada entrada de sessió (i en arrencar
     amb una de viva), la cua d'autodesament torna a enviar el que esta
     persona havia deixat pendent en este backend. */
  useEffect(() => {
    if (estat === 'dins' && usuariId != null) reprenSessio(config, usuariId);
  }, [config, estat, usuariId]);

  const backendFuncs = useMemo(() => ({
    teCapacitat,
    loginWithGoogle: loginWithGoogleDelPort,
    loginWithPassword: loginWithPasswordDelPort,
    registerWithPassword: registerWithPasswordDelPort,
    listMyOrganizations,
    comprovaServidor: comprovaServidorDelPort,
    demanaRecuperacioContrasenya: demanaRecuperacioDelPort,
    definixContrasenyaNova: definixContrasenyaDelPort,
    /* R2 · «Torna a entrar» i «Demana un enllaç nou» des de la pantalla. */
    oblidaEnllacDeRecuperacio
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
    (tanca, configCrida) => iOblidaRecuperacio(eixDeLaSessio({
      config: configDeCrida(configCrida), usuariId, tanca,
      abansDeTancar: ABANS_DE_TANCAR, despresDeTancar: DESPRES_DE_TANCAR,
    })),
    [configDeCrida, usuariId]
  );

  const tancaSessio = useCallback(
    (configCrida, opcions) => {
      const configEixida = configDeCrida(configCrida);
      /* Buidar només la pestanya ('pestanya': renovació fallida) no és eixir:
         els esborranys es conserven i es tornen a enviar en tornar. */
      if (opcions?.abast === 'pestanya') return logout(configEixida, opcions);
      return iOblidaRecuperacio(eixDeLaSessio({
        config: configEixida, usuariId, tanca: () => logout(configEixida, opcions),
        abansDeTancar: ABANS_DE_TANCAR, despresDeTancar: DESPRES_DE_TANCAR,
      }));
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
      const esSuperadmin = rol === 'superadmin';
      /* Onada 11 (261010) · private.es_superadmin() exigix aal2 (migració
         2610061448): un superadmin sense el segon factor confirmat en esta
         sessió no pot desar res al Tauler, i la interfície ho ha de dir abans
         que el servidor torne 42501. */
      return {
        currentUser: usuari, estat: estatEfectiu, rol, esSuperadmin, renovaAra, generacio,
        nivell, calSegonFactor: esSuperadmin && nivell !== 'aal2',
        recuperacioPendent, enllacDeRecuperacio, ...backendFuncs, logout: tancaSessio, eixAmb, preparaEixida
      };
    },
    [usuari, estat, rol, generacio, nivell, recuperacioPendent, enllacDeRecuperacio, backendFuncs, tancaSessio, eixAmb, preparaEixida]
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
