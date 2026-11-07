import { lazy, Suspense, useMemo } from 'react';
import { renderRichText } from '../../detail/detailRichText.jsx';
import { BotoVeuIaia } from '../../../components/PedraSeca/molecules/BotoVeuIaia.jsx';
import ReproductorExplicatiuPouNeu3D, { nomDeLaVeu } from '../../../components/patrimoni/ReproductorExplicatiuPouNeu3D.jsx';
import { useUIActionsOpcional } from '../../../app/contexts/UIContext.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { cosDeLArticle, cosPerAPintar } from './cosCanonic.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_HTML } from './novesTecnologiesCulturaRuralContent.js';

const T_PER_DEFECTE = createTranslator('ca');
const PouDeLaNeuAnatomiaCard = lazy(() => import('../../../components/patrimoni/PouDeLaNeuAnatomiaCard.jsx'));

/** El text pla d'un cos HTML (el que diu la veu): sense etiquetes ni blancs repetits. */
export function textPlaDelCos(html) {
  if (typeof html !== 'string' || !html.trim()) return '';
  if (typeof DOMParser === 'function') {
    const analitzat = new DOMParser().parseFromString(html, 'text/html');
    return (analitzat.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** IDEA-116 + IDEA-119 (Onada R9, carril C2) · La primera publicació del Mur:
 *  «Noves tecnologies aplicades a la cultura rural». Com el Manifest i l'Aplec
 *  (P0-26), el cos és `item.content` (la llavor o la versió editada des de
 *  /notes) i, si el que arriba no és HTML, el canònic de la llavor. Damunt del
 *  cos, les peces que no poden viure a l'HTML: la veu de la IAIA
 *  (IDEA-108), que llig el títol, l'entradeta i el cos tal com es pinten, i el
 *  visor didàctic 3D i el reproductor històric del pou. Els dos botons de veu porten noms diferents (R9V-C2-10). Este mòdul el carrega detailSectionMeta en diferit:
 *  ni l'article, ni el reproductor, ni l'anatomia no pesen a l'entrada. */
export default function NovesTecnologiesCulturaRuralArticle({ item = null } = {}) {
  const t = useUIActionsOpcional()?.t || T_PER_DEFECTE;
  const cos = cosPerAPintar(cosDeLArticle(item, NOVES_TECNOLOGIES_CULTURA_RURAL_HTML));
  const textDeLaVeu = useMemo(() => [item?.title, item?.entradilla, textPlaDelCos(cos)]
    .filter((tros) => typeof tros === 'string' && tros.trim()).join('. '), [cos, item?.title, item?.entradilla]);
  return (
    <div className="noves-tecnologies-rural">
      <div className="noves-tecnologies-rural__veu">
        <BotoVeuIaia text={textDeLaVeu} idioma="ca" privat={false} aria-label={nomDeLaVeu(t, 'publicacio')} />
      </div>
      <Suspense fallback={null}><PouDeLaNeuAnatomiaCard /></Suspense>
      <ReproductorExplicatiuPouNeu3D />
      {renderRichText(cos)}
    </div>
  );
}
