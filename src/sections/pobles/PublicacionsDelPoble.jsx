/**
 * PublicacionsDelPoble.jsx · Onada 6 (pla 261009_0245, ítem 5: «La primera
 * vista mostrarà exclusivament totes les targetes creades des d'eixe poble per
 * les persones o grups locals») · El panell de la pestanya «Gent de …» de la
 * pàgina d'un poble.
 *
 * Cap peça nova: la vista és la de l'històric de l'actor
 * (VistaPublicacionsDeLActor: GraellaTargetes amb TargetaDelMur o
 * TargetaDelMercat, Carregant, EstatErrorDades i el buit amb role=status),
 * amb els textos del poble; les dades, usePublicacionsDelPoble; i la barrera,
 * el SlotErrorBoundary amb la mateixa fallada (FalladaDeLHistoric). Si una
 * targeta remota malformada peta, el panell ho diu i la pàgina continua.
 *
 * El munta la meta de Pobles (detailSectionMeta.jsx) en diferit (lazyRoute:
 * la meta no arrossega la façana de Pedra Seca), només a la pàgina del poble
 * (/pobles/:id), mai al lector de connexions del MAS.
 */
import { useUIActions } from '../../app/contexts/UIContext';
import { SlotErrorBoundary } from '../../components/universal/workspace/SlotErrorBoundary.jsx';
import { FalladaDeLHistoric, VistaPublicacionsDeLActor } from '../mur/PublicacionsDeLActor.jsx';
import { textosDelPoble, usePublicacionsDelPoble } from './usePublicacionsDelPoble.js';

/* El traductor de l'App, o res fora d'ella (una prova, el catàleg). La forma
   `return useX()` dins d'un try és la que rules-of-hooks accepta. */
function useTraductor() {
  try {
    return useUIActions().t;
  } catch {
    return undefined;
  }
}

/* Les dades i la vista, dins de la barrera: un càlcul que peta queda dins
   del SlotErrorBoundary, com una targeta que peta. */
function PublicacionsDelPobleAmbDades({ poble, textos }) {
  const { elements, estat, error, refresh } = usePublicacionsDelPoble(poble);
  return <VistaPublicacionsDeLActor elements={elements} estat={estat} error={error} refresh={refresh} textos={textos} />;
}

/** Les targetes publicades des de `poble` (una fitxa de /pobles), en l'ordre del Mur. */
export function PublicacionsDelPoble({ poble }) {
  const t = useTraductor();
  const textos = textosDelPoble(t);
  return (
    <SlotErrorBoundary
      resetKey={String(poble?.id ?? '')}
      fallback={({ reinicia }) => <FalladaDeLHistoric t={t} textos={textos} reinicia={reinicia} />}
    >
      <PublicacionsDelPobleAmbDades poble={poble} textos={textos} />
    </SlotErrorBoundary>
  );
}

export default PublicacionsDelPoble;
