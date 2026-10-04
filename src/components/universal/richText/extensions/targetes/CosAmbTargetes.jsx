/**
 * CosAmbTargetes.jsx — La lectura d'un cos amb targetes incrustades.
 *
 * T7 (ordre del Mestre, prompt 261004_0515) · renderRichText
 * (sections/detail/detailRichText.jsx) el munta només quan l'HTML porta
 * algun grup de targetes: la resta de documents es pinten pel camí de
 * sempre, byte a byte (Llei del Píxel).
 *
 * L'HTML ja arriba sanejat i partit (segmentsAmbTargetes). Cada tros es
 * torna a passar pel sanejador en pintar-se (tractor-innerhtml), dins d'un
 * embolcall que no pinta res (display: contents). Cada grup és la targeta
 * del Mur (UniversalCard en lectura): la caputxa, la imatge, el cos i el peu
 * amb Connectar i Comentar de l'objecte tipat. Sense mòduls de TipTap: la
 * lectura no arrossega l'editor.
 */
import { UniversalCard } from '../../../../PedraSeca/organismes/UniversalCard.jsx';
import { useNavigate } from '../../../../../app/contexts/RouterContext';
import { rutaConnectarObjecte } from '../../../../../config/objecteConnectable.js';
import { sanitizeHtml } from '../../../../../utils/sanitize.js';
import { useImatgeResolta } from '../../../../../hooks/useImatgeTargeta.js';
import { propsDeTargetaIncrustada } from './formaDelGrup.js';

function TargetaDeLectura({ attrs }) {
  const navigate = useNavigate();
  const props = propsDeTargetaIncrustada(attrs, { mode: 'lectura' });
  const imatge = useImatgeResolta(props.imageUrl);
  const objecte = props.objecte;
  return (
    <div className="sdp-targeta">
      <UniversalCard
        {...props}
        imageUrl={imatge}
        onConnect={objecte ? () => navigate(rutaConnectarObjecte(objecte)) : undefined}
      />
    </div>
  );
}

/* El className, literal (Pedra Seca): «detail-content» és l'article de
   sempre de renderRichText i «sdp-amb-targetes», CLASSE_AMB_TARGETES de
   formaDelGrup.js (qualitat.test.js en fixa la igualtat). */
export function CosAmbTargetes({ segments = [] }) {
  return (
    <article className="detail-content sdp-amb-targetes">
      {segments.map((segment, index) => (segment.tipus === 'targetes' ? (
        <div key={`g${index}`} className="sdp-targetes" data-forma={segment.forma} data-alineacio={segment.alineacio}>
          {segment.targetes.map((attrs, posicio) => <TargetaDeLectura key={`${attrs.clau}#${posicio}`} attrs={attrs} />)}
        </div>
      ) : (
        <div key={`h${index}`} className="sdp-cos-tros" dangerouslySetInnerHTML={{ __html: sanitizeHtml(segment.html) }} />
      )))}
    </article>
  );
}

export default CosAmbTargetes;
