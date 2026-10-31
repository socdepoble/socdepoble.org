// src/app/contexts/SessionContext.jsx
import { useCallback, useContext, useEffect, useState, useMemo, useRef } from 'react';
/* P1-71 (Gauntlet 261029) · L'objecte de context viu a objectesDeContext.js,
   que no importa res del projecte: una instància nova d'este mòdul (HMR) no
   en crea cap de nou. */
import { SessionContext } from './objectesDeContext.js';
import { teCapacitat, logout, loginWithGoogle, loginWithPassword, registerWithPassword, listMyOrganizations, comprovaServidor, demanaRecuperacioContrasenya, definixContrasenyaNova, entraAmbTokenDeProveidor, getCurrentUser } from '../../data/backendPort.js';
import { getSessionState, subscribeSession, setSessionConfig, renovaAra } from '../../data/sessionService.js';
import {
  escoltaRecuperacioPendent, estatEnllacDeRecuperacio, oblidaEnllacDeRecuperacio, oblidaRecuperacioPendent, recuperacioPendentPer
} from '../../data/recuperacioPendent.js';
import { eixDeLaSessio, preparaEixida as preparaEixidaNucli, reprenSessio } from '../../data/autodesament/sessio.js';
import { enviaNotesDeLUsuari, oblidaNotesDeLUsuari, pendentsNotesDe } from '../../sections/notes/GlobalSaveManager.js';
import { entraComAPilot } from '../../data/sessioPilot.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { oblidaXatEnEixir } from '../../data/xifratXatEixida.js';
import { configuraMarcaOblitCarpetesLocals, oblidaTotesLesCarpetesLocals } from '../../sections/multimedia/bibliotecaCarpetesLocals.js';
import { registraEixidaDeVeres } from '../../data/expulsioAmfitrio.js';
import { delVal, getVal, setVal } from '../../config/storage.js';

const EMPTY_CONFIG = Object.freeze({});

/* Pla 261029_1605 (Sessió; IDEA-54/55) · Un ordinador compartit del poble: les
   carpetes locals recordades del Gestor d'arxius (handles a la base del
   navegador) són del perfil, no de la persona. Eixir de veres les oblida totes,
   com els esborranys de Notes: després de tancar i només si ha anat bé. No
   rep cap argument (sessio.js passa usuariId i la biblioteca el prendria per
   opcions) i no llança mai. Ve del mòdul germà sense dependències que el motor
   multimèdia reexporta: el motor sencer no entra al paquet principal. */
const oblidaCarpetesLocalsEnEixir = () => oblidaTotesLesCarpetesLocals();

/* QA-R2-04 (Codex, Ronda 2) · Si l'oblit no ha pogut buidar la base
   ({ ok:false, codi:'OBLIT_CARPETES_PENDENT' }), la biblioteca el deixa
   pendent: cap muntatge del Gestor obri sol (ni llista) una carpeta de qui ha
   eixit fins que un reintent el confirma. La marca de memòria es perdria en
   recarregar o en una pestanya nova; esta, a la capa de preferències de
   src/config/storage.js (un booleà, cap dada de ningú), la conserva fins al
   reintent bo, també després de tancar el navegador: amb un permís
   persistent, la carpeta s'obriria sola en tornar. Es registra en carregar
   el mòdul: l'eixida sempre passa per ací i el Gestor l'importa abans de
   muntar-se. La biblioteca continua sense importar res. */
const CLAU_OBLIT_CARPETES_PENDENT = 'arxius-locals-oblit-pendent';
configuraMarcaOblitCarpetesLocals({
  llig: () => getVal(CLAU_OBLIT_CARPETES_PENDENT, false) === true,
  desa: () => setVal(CLAU_OBLIT_CARPETES_PENDENT, true),
  esborra: () => delVal(CLAU_OBLIT_CARPETES_PENDENT)
});

/* T47 (correcció de la revisió C02, 260928) · Els gestors d'esborranys que no
   són la cua del nucli entren a l'eixida des d'ací (src/data no importa de
   src/sections). Notes ('SdpNotesQueue'): envia amb la sessió encara vàlida,
   oblida només si tancar ha anat bé i diu el que queda per a l'avís (C01). */
const ABANS_DE_TANCAR = Object.freeze([enviaNotesDeLUsuari]);
const DESPRES_DE_TANCAR = Object.freeze([oblidaNotesDeLUsuari, oblidaCarpetesLocalsEnEixir]);
const PENDENTS_DE = Object.freeze([pendentsNotesDe]);

/* P1-12 pas 17 (disseny §8.5, D-09) · L'oblit del xat xifrat entra a l'eixida
   com Notes: després de tancar i només si ha anat bé, en paral·lel amb
   oblidaNotesDeLUsuari i darrere d'ella en la llista (bases distintes:
   'SdpNotesQueue' i la del xat). Porta en una clausura la config de l'eixida,
   perquè sessio.js només passa usuariId i la clauIdentitat de qui ix s'ha de
   calcular amb ella: quan arriba ací, la interfície ja pot haver buidat
   l'àmbit del xat. oblidaXatEnEixir no rebutja mai (una fallada és l'estat
   OBLIT_FALLIT, que XatContext mostra). Bandera apagada: la mateixa llista de
   sempre, sense cap crida nova. La bandera es llig en cridar (l'enllaç ESM és
   viu: una prova la pot canviar amb un getter), i SENSE try: Rollup plega la
   constant i, apagada, l'oblit del xat i el magatzem de claus no viatgen al tros
   d'entrada (Gauntlet c1, SessionContext.e2eeApagat.produccio.test.js). Qui
   simula config/xifratXat.js hi ha de posar la bandera (importOriginal). */
const xatXifratActiu = () => E2EE_ACTIU_PER_DEFECTE === true;
const despresDeTancarAmb = (config, opcionsXat = {}) => (xatXifratActiu()
  ? Object.freeze([...DESPRES_DE_TANCAR, (usuariId) => oblidaXatEnEixir({ ...opcionsXat, config, usuariId })])
  : DESPRES_DE_TANCAR);

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
/* Fase D (261020, tasca 1) · La capacitat opcional 'entradaAmbToken' (Apple i
   Google des del full natiu): una entrada explícita més, resolta en cridar-la
   com 'salut' (un port, o una prova, sense ella no fa caure el proveïdor). */
const entraAmbTokenDelPort = ambEntradaExplicita((...args) => entraAmbTokenDeProveidor(...args));
/* Gauntlet 261016_1530 (Bloc 3.6.4; F66) · L'entrada pilot local
   (data/sessioPilot.js): només en desenvolupament i en mode de proves, sense
   cap petició. No és del port: la sessió de prova és del nucli, per a tots els
   backends igual. És una entrada explícita com les altres i també oblida la
   recuperació en curs. */
const entraComAPilotDelNucli = ambEntradaExplicita((...args) => entraComAPilot(...args));
/* Eixir de veres (no buidar només la pestanya) també l'oblida, quan ha anat bé. */
const iOblidaRecuperacio = (promesa) => Promise.resolve(promesa).then((resultat) => {
  oblidaRecuperacioPendent();
  return resultat;
});

/* La capacitat del port, sense fer caure el proveïdor si el port no la sap dir. */
const teCapacitatSegura = (nom) => {
  try { return teCapacitat(nom) === true; } catch { return false; }
};

/* QA-A01a (Gauntlet 261029_1858) · L'eixida de veres, una sola font: «Tancar
   sessió», «Eixir del poble», la baixa (amb el seu `tanca`) i l'expulsió de
   l'amfitrió (host.js expulsaSessio, per data/expulsioAmfitrio.js) passen per
   ací. Primer l'intent final, després `tanca` i, només si ha anat bé,
   DESPRES_DE_TANCAR (Notes, carpetes locals i, amb E2EE, el xat). */
function eixidaDeVeres({ config, usuariId, tanca, opcionsXat }) {
  return iOblidaRecuperacio(eixDeLaSessio({
    config, usuariId, tanca,
    abansDeTancar: ABANS_DE_TANCAR, despresDeTancar: despresDeTancarAmb(config, opcionsXat),
  }));
}

/* QA-A01a · Sense cap proveïdor muntat (l'element tret de la pàgina de
   l'amfitrió), l'expulsió fa la mateixa eixida amb la config del paquet (el
   backend i el tenant són de la capa del paquet, Model B) i la persona que
   tinga la sessió desada ara. Cada SessionProvider muntat la tapa amb la seua. */
const usuariDeLaSessioDesada = () => {
  try {
    const usuari = getCurrentUser();
    if (usuari?.id != null) return usuari.id;
  } catch { /* port sense arrencar o simulat: l'estat del servei */ }
  try { return getSessionState()?.usuari?.id ?? null; } catch { return null; }
};
registraEixidaDeVeres(() => eixidaDeVeres({
  config: EMPTY_CONFIG, usuariId: usuariDeLaSessioDesada(), tanca: () => logout(EMPTY_CONFIG)
}));

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
    entraComAPilot: entraComAPilotDelNucli,
    listMyOrganizations,
    comprovaServidor: comprovaServidorDelPort,
    demanaRecuperacioContrasenya: demanaRecuperacioDelPort,
    definixContrasenyaNova: definixContrasenyaDelPort,
    entraAmbTokenDeProveidor: entraAmbTokenDelPort,
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
    (tanca, configCrida) => {
      const configEixida = configDeCrida(configCrida);
      /* P1-12 pas 17 (D-09) · La baixa no conserva res del xat xifrat, tampoc a l'app. */
      return eixidaDeVeres({ config: configEixida, usuariId, tanca, opcionsXat: { mantenSessio: false } });
    },
    [configDeCrida, usuariId]
  );

  const tancaSessio = useCallback(
    (configCrida, opcions) => {
      const configEixida = configDeCrida(configCrida);
      /* Buidar només la pestanya ('pestanya': renovació fallida) no és eixir:
         els esborranys es conserven i es tornen a enviar en tornar. */
      if (opcions?.abast === 'pestanya') return logout(configEixida, opcions);
      return eixidaDeVeres({ config: configEixida, usuariId, tanca: () => logout(configEixida, opcions) });
    },
    [configDeCrida, usuariId]
  );

  /* QA-A01a (Gauntlet 261029_1858) · L'amfitrió que expulsa la sessió
     (host.js expulsaSessio) passa per esta mateixa eixida de veres, amb la
     config d'este proveïdor: abans cridava el logout de l'adaptador
     directament i les carpetes locals, els esborranys de Notes i el xat xifrat
     es quedaven en un ordinador compartit. */
  useEffect(() => registraEixidaDeVeres(() => tancaSessio()), [tancaSessio]);

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
