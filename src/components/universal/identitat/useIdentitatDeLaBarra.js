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
 *   · Sense sessió, el botó porta a /registre.
 * `onNavega(ruta)` el posa la barra (amb la seua transició de vista).
 */
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../../../app/contexts/SessionContext';
import { useIdentitat } from '../../../app/contexts/IdentitatContext';

export function useIdentitatDeLaBarra({ onNavega, etiquetaEntrar } = {}) {
  const { currentUser } = useSession();
  const { actor, identitats = [], setActor } = useIdentitat();
  const [obert, setObert] = useState(false);
  const teSessio = Boolean(currentUser);
  const entitat = teSessio && actor?.tipus === 'entitat';

  /* Si la sessió se'n va amb el calaix obert, es tanca. */
  useEffect(() => { if (!teSessio) setObert(false); }, [teSessio]);

  const tanca = useCallback(() => setObert(false), []);
  const navega = useCallback((ruta) => { setObert(false); onNavega?.(ruta); }, [onNavega]);
  const tria = useCallback((tipus, id) => {
    const fet = setActor?.(tipus, id) ?? false;
    setObert(false);
    return fet;
  }, [setActor]);

  const boto = {
    teSessio,
    nom: teSessio ? actor?.nom : null,
    /* L'avatar de l'actor: el logo de l'entitat o la foto de la persona. Una
       entitat sense logo porta null i es pinten les SEUES inicials. */
    avatar: teSessio ? actor?.avatar || null : null,
    llavor: teSessio ? actor?.id ?? null : null,
    entitat,
    obert,
    etiquetaEntrar,
    onClick: teSessio ? () => setObert(true) : () => onNavega?.('/registre')
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
    onFitxa: () => navega('/el-meu-perfil')
  } : null;

  return { boto, calaix };
}

export default useIdentitatDeLaBarra;
