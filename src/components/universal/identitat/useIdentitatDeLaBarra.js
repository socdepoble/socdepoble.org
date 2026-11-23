/**
 * useIdentitatDeLaBarra.js — Contenidor de la identitat activa de la barra
 * negra (T43, ordre del Mestre, 260928).
 *
 * Llig la sessió i IdentitatContext i torna les props dels dos components
 * presentacionals: { boto } per a BotoIdentitatActiva i { calaix } per a
 * CalaixIdentitats (null sense sessió).
 *
 *   · Una entitat mostra NOMÉS el seu logo (o les seues inicials): mai la
 *     foto de la persona que hi ha darrere.
 *   · Canviar d'identitat és sempre una tria explícita al calaix.
 *   · Sense sessió, el botó porta a entrar: /registre?mode=entrar amb la
 *     ruta on estava la persona com a ?tornar (T4, 260930). Si ja és a
 *     /registre no hi torna: l'entrada no s'encadena amb ella mateixa.
 *   · Revisió del Gauntlet 261017 (ID4) · Mentre una sessió recordada es
 *     restaura (estat 'comprovant' sense usuari), ni Entrar ni cap clic:
 *     `boto.pendent` i un estat ocupat (vegeu `pendent`, baix).
 *   · Acta 261004_1027 §3 (beta testers) · Amb sessió i UNA sola identitat
 *     (la persona, sense cap organització on mane) no hi ha res a triar:
 *     l'avatar porta directament al perfil propi (`boto.perfil`). Amb més
 *     d'una, el calaix, que també hi porta («La meua fitxa i ajustos»).
 * `onNavega(ruta)` el posa la barra (amb la seua transició de vista).
 *
 * Prompt 261014_0400 (ordre del Mestre) · Sense proveïdor no llança. Llig les
 * variants opcionals (useSessioOpcional, useIdentitatOpcional) i l'ordre dels
 * hooks no canvia: dos useContext, com abans. Els dos casos no són iguals:
 *   · Sense SessionProvider: «sense sessió», el botó Entrar i cap calaix.
 *   · Amb sessió però sense IdentitatProvider: cap identitat carregada.
 *     L'avatar genèric «El meu compte» porta al perfil propi; el calaix es
 *     munta tancat i buit, i no s'obri mai (`perfil` és cert amb 0 identitats).
 * La guarda és DEFENSIVA, no cura cap causa: en execució normal la
 * TopBar sempre és dins dels dos proveïdors (PedraSecaEmbed.jsx). El pet vist
 * en desenvolupament el provoca el HMR de Vite amb React Refresh, que torna a
 * carregar SessionContext.jsx amb un createContext nou i deixa la barra
 * lligada al context vell (vegeu src/apps/plataforma/fronteres.test.js:205-219).
 * En eixe cas la barra diu «Entrar» a qui té sessió fins a recarregar, i el pet
 * passa al consumidor següent (CoreContentProvider). En producció no hi ha HMR.
 */
import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';
import { ETIQUETA_EIXIR_CALAIX, ETIQUETA_IDIOMA_CALAIX } from './CalaixIdentitats.jsx';
import { useSessioOpcional } from '../../../app/contexts/SessionContext';
import { useIdentitatOpcional } from '../../../app/contexts/IdentitatContext.jsx';
/* Onada R24 · wp_trinquet · Del seu mòdul, no de useAccions.js: la barra és de l'arrencada. */
import { useUbicacioApp } from '../../PedraSeca/hooks/useUbicacioApp.js';
import { treuBase } from '../../../app/contexts/politicaRouter.js';
import { esRutaDEntrada, rutaDEntrada } from '../../../config/rutaEntrada.js';
import { RUTA_PERFIL_PROPI, rutaEspaiDIdentitat } from '../../../config/navigation.js';
/* v1.2.23 · L5-05 (Gauntlet R1) · La mateixa regla que ClosCaXat.jsx, d'un sol mòdul. */
import { codiDeLlengua } from './codiDeLlengua.js';

/* Correcció de la revisió T1–T4 (260930) · La ruta de l'app, camí i consulta
   SENCERS, llegida en el clic com rutaActual (useAccions.js): en memòria,
   l'entrada del router; al navegador, la barra d'adreces sense la base; fora
   de la base, cap. No passa per rutaActual, que cau al camí sol quan la
   consulta no cap en els 300 d'un objecte connectable: un /connectar sense la
   seua consulta ja no és l'element. El topall és el de la tornada
   (tornadaSegura, dins de rutaDEntrada); si no hi cap, no hi ha ?tornar. */
export function rutaSencera(router) {
  if (router?.memoria === true) {
    const cami = typeof router.currentPath === 'string' ? router.currentPath : '';
    const consulta = router.searchParams ? String(router.searchParams) : '';
    return consulta ? `${cami}?${consulta}` : cami;
  }
  if (typeof window === 'undefined' || !window.location) return '';
  const { pathname = '', search = '' } = window.location;
  const cami = router?.basename ? treuBase(pathname, router.basename) : pathname;
  return cami === null ? '' : `${cami}${search}`;
}

/** La ruta del perfil propi (App.jsx: <Route path="el-meu-perfil">). Viu a config/navigation.js. */
export { RUTA_PERFIL_PROPI };

/* Encàrrec 261018_1220 (Tasca 1, ordre del Mestre: «en clicar l'avatar o la
   identitat personal, la interfície es queda atrapada al Bloc de notes») ·
   Triar una identitat al calaix ja no deixa la persona on era: canvia l'actor
   i porta al workspace d'eixa identitat, el que ja existix (el Perfil:
   rutaEspaiDIdentitat). L'avatar directe i «La meua fitxa i ajustos» hi porten
   igual. Cada anada porta a l'estat de l'historial un número nou
   (`espaiIdentitat`): el Perfil el llig per a tornar a obrir la identitat
   triada encara que la ruta no canvie (PerfilShell · workspaceKey). */
export const CLAU_RECUPERACIO_ESPAI = 'espaiIdentitat';
/* Revisió adversarial (261018) · Comença en l'instant de càrrega, no en 0:
   l'estat de l'historial sobreviu a recarregar, i un número repetit no
   tornaria a obrir la identitat. */
let recuperacions = Date.now();
const ambRecuperacio = () => ({ state: { [CLAU_RECUPERACIO_ESPAI]: ++recuperacions } });

/* v1.2.6 (trinquet de l'arrencada del connector WordPress) · L'avís de canvis
   sense desar i l'error d'eixida es pinten amb les peces d'EixidaSegura.jsx
   (AvisEixidaDelCalaix, ErrorEixidaDelCalaix), que no viatgen a l'arrencada:
   ni el mòdul (les taules de les cinc llengües) ni Alerta i les seues icones.
   El patró és el de l'oblit de la IAIA (SessionContext.jsx): import() sota
   demanda, precarregat després del primer pintat amb una persona dins (una
   eixida sense xarxa en un ordinador compartit troba el tros ja en memòria) i
   una càrrega fallida s'oblida perquè la següent ho torne a provar. L'eixida
   l'espera junt amb preparaEixida abans de pintar res: l'avís no apareix mai
   a mitges ni en una altra llengua. Si el tros no arriba i queden canvis, no
   s'ix: sense avís, eixir els esborraria en silenci (T47).
   v1.2.23 · R2E-04 (Gauntlet R2) · El patró, d'una sola peça (`diferit`) per
   als dos trossos de la barra: este i el dels textos del calaix (baix). */
const diferit = (importa) => {
  let promesa = null;
  return () => (promesa ??= importa().catch((error) => {
    promesa = null;
    throw error;
  }));
};
const carregaAvisosEixida = diferit(() => import('../EixidaSegura.jsx'));

/* v1.2.23 · R2E-04 (Gauntlet R2) · El calaix «Amb qui actues?» de la barra
   negra, en la llengua de la interfície sencer, com el del peu del rail del Xat
   (ClosCaXat.jsx). Els textos fixos (títol, descripció, llista i «Activa») són
   els de textosCalaixIdentitats.js, que viatja com a tros diferit: cap clau
   nova a ca.js ni a l'arrencada. Es demana amb una persona dins quan la
   interfície ja parla una llengua que no és el valencià, i en cada obertura;
   com l'avís d'eixida, una càrrega fallida s'oblida perquè la següent ho torne
   a provar. El valencià no espera res: són els valors de sempre de
   CalaixIdentitats, que la barra no repetix. */
const carregaTextosCalaix = diferit(() => import('./textosCalaixIdentitats.js'));
/* L'estat del hook: el mòdul quan ha arribat, false si ha fallat (el calaix
   s'obri amb el valencià) i null mentre no se sap. */
const preparaTextosCalaix = (llengua, setTextos) => {
  if (llengua !== 'ca') carregaTextosCalaix().then(setTextos, () => setTextos(false));
};

export function useIdentitatDeLaBarra({ onNavega, etiquetaEntrar } = {}) {
  const sessio = useSessioOpcional();
  const currentUser = sessio?.currentUser ?? null;
  const { actor = null, identitats = [], setActor } = useIdentitatOpcional() ?? {};
  /* El router on viu l'app (memòria o navegador), o null: la ruta es llig en el clic. */
  const router = useUbicacioApp();
  const t = useTraductorOpcional();
  const llengua = codiDeLlengua(t);
  const [obert, setObert] = useState(false);
  const [pendentsEixida, setPendentsEixida] = useState(null);
  const [eixint, setEixint] = useState(false);
  /* Cert quan el logout ha fallat: el text es tria en pintar, en la llengua d'ara. */
  const [errorEixida, setErrorEixida] = useState(null);
  /* Gauntlet R32.6 (PERFIL-01 i I18N-02) · L'avís d'eixida, en la llengua de la
     interfície, amb els mateixos textos que l'apartat Eixir del Perfil: les
     peces d'EixidaSegura.jsx, quan el seu tros ja és en memòria (vegeu
     carregaAvisosEixida, dalt). */
  const [avisos, setAvisos] = useState(null);
  /* v1.2.23 · R2E-04 (Gauntlet R2) · El tros dels textos del calaix (vegeu preparaTextosCalaix, dalt). */
  const [textos, setTextos] = useState(null);
  /* Gauntlet R32.6 (PERFIL-02) · El botó «Eixir de Sóc de Poble» que ha obert
     l'avís. Viu a CalaixIdentitats, que no porta ref: el pren el clic. */
  const obridorEixida = useRef(null);
  const teSessio = Boolean(currentUser);
  /* Revisió del Gauntlet 261017 (ID4; relleu 3: mai «Foraster» mentre la
     sessió és vàlida) · Una pestanya nova amb una sessió recordada: mentre es
     restaura (estat 'comprovant' encara sense usuari, sessionService.js) no
     se sap si hi ha sessió. El botó no és el Foraster ni porta a /registre:
     un estat neutre i ocupat (BotoIdentitatActiva · pendent), com el
     «Comprovant la sessió…» de RequireAuth i la càrrega del Bloc
     (NotesDataContext · sessioResolta). Amb la persona ja dins i el rol en
     vol ('comprovant' amb usuari), l'avatar de sempre. Sense SessionProvider,
     cap estat: «Entrar», com abans. */
  const pendent = !teSessio && sessio?.estat === 'comprovant';
  const entitat = teSessio && actor?.tipus === 'entitat';
  /* Res a triar: només la persona (o encara cap organització carregada). */
  const directe = teSessio && !entitat && identitats.length <= 1;

  /* Amb una persona dins, el tros de l'avís d'eixida es precarrega després del
     primer pintat (una fallada no avisa: l'eixida ho torna a provar). Si la
     sessió se'n va amb el calaix obert, es tanca.
     v1.2.23 · R2E-04 (Gauntlet R2) · I el tros dels textos del calaix, quan la
     interfície ja no parla valencià: quan la persona l'obri, normalment ja és
     en memòria. Un canvi de llengua sense sessió només torna a tancar el que ja
     era tancat. */
  useEffect(() => {
    if (teSessio) {
      carregaAvisosEixida().catch(() => {});
      preparaTextosCalaix(llengua, setTextos);
      return;
    }
    setObert(false);
    setPendentsEixida(null);
    setErrorEixida(null);
    setEixint(false);
  }, [teSessio, llengua]);
  /* v1.2.23 · R2E-04 (Gauntlet R2) · El calaix no s'obri a mitges: en una altra llengua espera el tros dels seus
     textos, o la seua fallada (i aleshores, el valencià de sempre). */
  const calaixObert = obert && (llengua === 'ca' || textos !== null);

  const tanca = useCallback(() => {
    setObert(false);
    setPendentsEixida(null);
    setErrorEixida(null);
  }, []);
  const navega = useCallback((ruta, opcions) => {
    setObert(false);
    setPendentsEixida(null);
    setErrorEixida(null);
    if (opcions) onNavega?.(ruta, opcions);
    else onNavega?.(ruta);
  }, [onNavega]);
  const tria = useCallback((tipus, id) => {
    const fet = setActor?.(tipus, id) ?? false;
    setObert(false);
    setPendentsEixida(null);
    setErrorEixida(null);
    if (fet) onNavega?.(rutaEspaiDIdentitat(tipus, id), ambRecuperacio());
    return fet;
  }, [setActor, onNavega]);
  const confirmaEixir = useCallback(async () => {
    setErrorEixida(null);
    setEixint(true);
    try {
      await sessio?.logout?.();
    } catch {
      setEixint(false);
      setErrorEixida(true);
      return;
    }
    setPendentsEixida(null);
    setEixint(false);
    setObert(false);
    onNavega?.('/registre', { replace: true });
  }, [sessio, onNavega]);
  const demanaEixir = useCallback(async (event) => {
    const boto = event?.currentTarget;
    obridorEixida.current = typeof boto?.focus === 'function' ? boto : null;
    if (eixint) return;
    setErrorEixida(null);
    setEixint(true);
    const prepara = async () => {
      if (typeof sessio?.preparaEixida !== 'function') return [];
      try { return await sessio.preparaEixida(); } catch { return []; }
    };
    /* preparaEixida es crida en el clic, com abans; el tros, en paral·lel. */
    const [queden, peces] = await Promise.all([prepara(), carregaAvisosEixida().catch(() => null)]);
    if (peces) setAvisos(peces);
    if (Array.isArray(queden) && queden.length) {
      setEixint(false);
      if (peces) setPendentsEixida(queden);
      else console.warn('[eixida] No ha arribat el tros de l’avís: amb canvis sense desar, no s’ix.');
      return;
    }
    await confirmaEixir();
  }, [eixint, sessio, confirmaEixir]);
  /* Gauntlet R32.6 (PERFIL-02) · «No eixir encara» desmunta l'Alerta amb el
     botó enfocat a dins: el focus queia a <body>, fora del calaix modal. Torna
     a «Eixir de Sóc de Poble», com FilaEixidaAmbSessio a FullAjustos. */
  const noEixirEncara = useCallback(() => {
    setPendentsEixida(null);
    const boto = obridorEixida.current;
    if (boto?.isConnected) boto.focus();
  }, []);
  const entra = () => {
    const ruta = rutaSencera(router);
    if (esRutaDEntrada(ruta)) return;
    onNavega?.(rutaDEntrada({ mode: 'entrar', tornar: ruta }));
  };

  const boto = {
    teSessio,
    pendent,
    nom: teSessio ? actor?.nom : null,
    /* L'avatar de l'actor: el logo de l'entitat o la foto de la persona. Una
       entitat sense logo porta null i es pinten les SEUES inicials. */
    avatar: teSessio ? actor?.avatar || null : null,
    llavor: teSessio ? actor?.id ?? null : null,
    entitat,
    obert: calaixObert,
    perfil: directe,
    /* Gauntlet R32.6 (PERFIL-04) · El nom accessible del botó, en esta llengua. */
    llengua,
    etiquetaEntrar,
    onClick: pendent ? undefined : !teSessio ? entra : directe ? () => navega(RUTA_PERFIL_PROPI, ambRecuperacio()) : () => {
      preparaTextosCalaix(llengua, setTextos);
      setObert(true);
    }
  };

  const avisEixida = pendentsEixida && avisos ? createElement(avisos.AvisEixidaDelCalaix, {
    pendents: pendentsEixida, llengua, eixint, onNoEixir: noEixirEncara, onEixir: confirmaEixir,
  }) : null;

  const calaix = teSessio ? {
    obert: calaixObert,
    onTanca: tanca,
    identitats,
    onTria: tria,
    /* v1.2.6 (trinquet de l'arrencada del connector WordPress) · Els dos botons
       del peu, en la llengua de la interfície, amb les claus topbar.identitat.*:
       es, en, eu i gl viatgen al tros diferit de cada diccionari, ja en memòria
       quan la interfície parla eixa llengua. Sense traductor, el valencià que
       CalaixIdentitats pinta de sempre. */
    etiquetaIdioma: tradueix(t, ['topbar.identitat.idioma', ETIQUETA_IDIOMA_CALAIX]),
    etiquetaEixir: tradueix(t, ['topbar.identitat.eixir', ETIQUETA_EIXIR_CALAIX]),
    /* v1.2.23 · R2E-04 (Gauntlet R2) i integració (pesDelNucli) · Els textos fixos i el rol de cada fila, d'una
       peça des del tros (textosCalaixIdentitats.js · propsDelCalaix). Sense el tros (el valencià, o una càrrega
       fallida), cap: CalaixIdentitats pinta els seus valors de sempre, rols inclosos. */
    ...(textos ? textos.propsDelCalaix(llengua, t) : null),
    onIdioma: () => navega('/traduccions'),
    onEixir: demanaEixir,
    eixint,
    avisEixida,
    errorEixida: errorEixida && avisos ? createElement(avisos.ErrorEixidaDelCalaix, { llengua }) : null,
  } : null;

  return { boto, calaix };
}

export default useIdentitatDeLaBarra;
