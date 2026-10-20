/**
 * TargetaLlistaComu.jsx — Fase E (261020, tasca 3; pla 261020_2045) · la
 * llista viva d'«El Comú» dins d'una bombolla del xat.
 *
 * Memoritzada (React.memo): Conversa guarda el text del compositor en el seu
 * estat i cada tecla torna a pintar totes les bombolles. La targeta només es
 * torna a pintar si canvia el que rep: la instantània, l'actor, si és
 * interactiva i el port. Per això l'actor ve memoritzat de XatSection i
 * onMuta és estable (o null fins a la tasca 4); cap prop no es crea a cada
 * pintat. L'estat dels tocs viu dins de la peça (useLlistaComu), no a la
 * bombolla.
 *
 * interactiva={false} en el mode de selecció del xat: la bombolla sencera és
 * una casella i dins no hi ha d'haver cap control.
 */
import { memo } from 'react';
import { UniversalListCard } from '../../../components/PedraSeca/index.js';

function TargetaLlistaComu({ llista, actor = null, interactiva = true, onMuta = null }) {
  return <UniversalListCard llista={llista} actor={actor} variant="bombolla" interactiva={interactiva} onMuta={onMuta} />;
}

export default memo(TargetaLlistaComu);
