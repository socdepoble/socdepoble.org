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
import { useCallback, useEffect, useState } from 'react';
import { useSessioOpcional } from '../../../app/contexts/SessionContext';
import { useIdentitatOpcional } from '../../../app/contexts/IdentitatContext.jsx';
import { useUbicacioApp } from '../../PedraSeca/hooks/useAccions.js';
import { treuBase } from '../../../app/contexts/politicaRouter.js';
import { esRutaDEntrada, rutaDEntrada } from '../../../config/rutaEntrada.js';

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

/** La ruta del perfil propi (App.jsx: <Route path="el-meu-perfil">). */
export const RUTA_PERFIL_PROPI = '/el-meu-perfil';

export function useIdentitatDeLaBarra({ onNavega, etiquetaEntrar } = {}) {
  const sessio = useSessioOpcional();
  const currentUser = sessio?.currentUser ?? null;
  const { actor = null, identitats = [], setActor } = useIdentitatOpcional() ?? {};
  /* El router on viu l'app (memòria o navegador), o null: la ruta es llig en el clic. */
  const router = useUbicacioApp();
  const [obert, setObert] = useState(false);
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

  /* Si la sessió se'n va amb el calaix obert, es tanca. */
  useEffect(() => { if (!teSessio) setObert(false); }, [teSessio]);

  const tanca = useCallback(() => setObert(false), []);
  const navega = useCallback((ruta) => { setObert(false); onNavega?.(ruta); }, [onNavega]);
  const tria = useCallback((tipus, id) => {
    const fet = setActor?.(tipus, id) ?? false;
    setObert(false);
    return fet;
  }, [setActor]);
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
    obert,
    perfil: directe,
    etiquetaEntrar,
    onClick: pendent ? undefined : !teSessio ? entra : directe ? () => navega(RUTA_PERFIL_PROPI) : () => setObert(true)
  };

  const calaix = teSessio ? {
    obert,
    onTanca: tanca,
    identitats,
    onTria: tria,
    /* Poliment T43 · les organitzacions reals del poble: /cerca en trau el
       padró i enllaça cada entitat a /empresa/:id. /perfil és el catàleg
       d'agents del contingut base, no el directori d'organitzacions. */
    onConnectar: () => navega('/cerca?tipus=entitats'),
    onFitxa: () => navega(RUTA_PERFIL_PROPI)
  } : null;

  return { boto, calaix };
}

export default useIdentitatDeLaBarra;
