/**
 * EspecimenPublicacionsDeLActor.jsx — «Ja publicat»: el que l'actor actiu ja
 * té publicat en una secció, amb la targeta canònica de cada secció.
 *
 * Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de
 * llistar elements de la categoria per a l'avatar actiu ha d'estar disponible
 * per tot el sistema») · Pedra Seca §9: l'espècimen abans d'endollar-lo al
 * Bloc de Notes i a la publicació oberta del MAS. Dades de la llavor, les
 * mateixes de /mercat i /mur: la Samarreta i els actes de Sóc de Poble,
 * filtrats amb la funció pura del hook (publicacionsDeLaSeccio), la mateixa
 * que filtra a l'App.
 *
 * Fora de l'App (la prova solta del catàleg, allLoaders.test.jsx, sense
 * UIProvider) no es poden pintar la targeta d'un acte (TargetaDelMur) ni
 * l'estat d'error (EstatErrorDades): totes dues llegixen l'estat de l'App. Ho
 * diu en lloc de pintar-les; dins de l'App (/disseny) es pinten de veres.
 */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { useUIActions } from '../../../../app/contexts/UIContext';
import { aliesDeLActor, ENTITAT_PILOT_ID } from '../../../../data/identitatsSeed.js';
import { MARKET_ITEMS } from '../../../mercat/marketContent.js';
import { EVENTS } from '../../../mur/eventsContent.js';
import { VistaPublicacionsDeLActor } from '../../../mur/PublicacionsDeLActor.jsx';
import { publicacionsDeLaSeccio } from '../../../mur/usePublicacionsDeLActor.js';

/* L'actor de mostra: l'entitat Sóc de Poble, amb els àlies de la llavor. */
const ALIES = aliesDeLActor({ tipus: 'entitat', id: ENTITAT_PILOT_ID }, { dataMode: 'seed' });
const PRODUCTES = publicacionsDeLaSeccio(MARKET_ITEMS, 'mercat', ALIES);
const ACTES = publicacionsDeLaSeccio(EVENTS, 'events', ALIES);
const ERROR_DE_MOSTRA = Object.freeze({ status: 503 });
const FORA_DE_LAPP = 'Fora de l’App (la prova solta del catàleg) esta mostra no es pinta: llig l’estat de l’App. A /disseny es veu de veres.';

/* Si l'espècimen viu dins de l'App (amb UIProvider). La forma `return useX()`
   dins d'un try és la que rules-of-hooks accepta (useEntitatDelProjecte.js). */
function useAccionsDeLApp() {
  try {
    return useUIActions();
  } catch {
    return null;
  }
}

export default function EspecimenPublicacionsDeLActor() {
  const dinsDeLApp = Boolean(useAccionsDeLApp());
  const [reintents, setReintents] = useState(0);
  return (
    <Especimen id="publicacions-actor" nom="PublicacionsDeLActor · el que l’actor ja té publicat" fitxer="src/sections/mur/PublicacionsDeLActor.jsx"
      descripcio="El que l’actor actiu (la persona o l’entitat amb què actua) ja té publicat en una secció, amb la targeta canònica de cada secció: la del Mercat per als productes (TargetaDelMercat) i la del Mur per a les publicacions i els actes (TargetaDelMur), dins de GraellaTargetes. Les dades són les del Mur, pel port, filtrades per l’actor (usePublicacionsDeLActor). Al Bloc de Notes i a una publicació oberta del MAS va a la ranura peuDePagina de PageFrame: davall de l’article, dins del scroll i fora de l’Índex."
      contracte={[
        ['seccio', "'mur' | 'mercat' | 'events'", '—', 'La secció. Una altra (Multimèdia, cap) no pinta res: no té targeta canònica de llista.'],
        ['exclouId', 'string | number', 'null', 'L’element que ja està obert damunt (la publicació, o la de la nota que s’edita): no es repetix davall.'],
        ['nivell', "'h2' … 'h6'", "'h2'", 'El nivell de la capçalera de la regió. A la pàgina, h2 (davall de l’H1).'],
        ['VistaPublicacionsDeLActor', '{ seccio, elements, estat, error, refresh }', '—', 'La vista sense dades pròpies: la munten el component i este espècimen.'],
        ['peuDePagina (PageFrame)', 'node', 'null', 'La ranura on va: després de l’article i de la traducció, dins del contenidor que fa scroll. Sense, el DOM de sempre.'],
        ['etiquetaPeuDePagina (PageFrame)', 'string', '—', 'El nom accessible del section de la ranura: el títol de la regió.']
      ]}
      a11y={[
        'La ranura és un section amb nom (el títol de la regió) i la regió porta la seua capçalera (h2 a la pàgina).',
        'Fora de l’article: l’Índex de la nota, la traducció i el Lector no en recullen els títols de les targetes.',
        'Mentre carrega, el Carregant (role=status); si falla, l’Alerta d’error amb «Torna-ho a provar»; buit, un text amb role=status.'
      ]}
      fes={['Passar la secció de la carpeta (o de la publicació) i l’element obert.', 'Al Bloc, memoritzar el peu (useMemo): un JSX nou a cada pintada refaria l’adaptador de l’editor.']}
      noFacis={['Una targeta nova per a l’històric: cada secció pinta la seua de sempre.', 'Posar-lo dins de l’article (children): entraria a l’Índex i a la traducció.']}>
      <VistaPublicacionsDeLActor seccio="mercat" elements={PRODUCTES} nivell="h4" />
      {dinsDeLApp
        ? <VistaPublicacionsDeLActor seccio="events" elements={ACTES} nivell="h4" />
        : <p>{FORA_DE_LAPP}</p>}
      <VistaPublicacionsDeLActor seccio="mur" estat="loading" nivell="h4" />
      <VistaPublicacionsDeLActor seccio="mur" elements={[]} nivell="h4" />
      {dinsDeLApp ? (
        <>
          <VistaPublicacionsDeLActor seccio="mur" estat="error" error={ERROR_DE_MOSTRA} refresh={() => setReintents((n) => n + 1)} nivell="h4" />
          {reintents ? <p role="status">{`Reintents de mostra: ${reintents}. No s’ha carregat res.`}</p> : null}
        </>
      ) : <p>{FORA_DE_LAPP}</p>}
    </Especimen>
  );
}
