import { useRef } from 'react';
import { ArrowUpRight, Calendar, FileText, ShoppingBag } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext.jsx';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssXatReferencia from '../../../css/diferit-xat-referencia.css?inline';

function IconaDeReferencia({ tipus }) {
  if (tipus === 'esdeveniment') return <Calendar size={16} aria-hidden="true" focusable="false" />;
  if (tipus === 'producte') return <ShoppingBag size={16} aria-hidden="true" focusable="false" />;
  return <FileText size={16} aria-hidden="true" focusable="false" />;
}

function etiquetaTipusReferencia(tipus, t) {
  if (tipus === 'esdeveniment') return t('section.xat.referencia.esdeveniment', 'Esdeveniment:');
  if (tipus === 'publicacio') return t('section.xat.referencia.publicacio', 'Notícia:');
  if (tipus === 'producte') return t('section.xat.referencia.producte', 'Producte:');
  return t('section.xat.referencia.pagina', 'Pàgina:');
}

export default function BanerReferenciaPagina({ referencia, t }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'xat-referencia', cssXatReferencia);

  if (!referencia?.ruta || !referencia?.titol) return null;

  const etiqueta = etiquetaTipusReferencia(referencia.tipus, t);
  const veureText = t('section.xat.referencia.veure', 'Veure la pàgina');
  const veureAria = t('section.xat.referencia.veureAria', 'Veure la pàgina d’origen: {titol}')
    .replace('{titol}', () => referencia.titol);

  return (
    <div
      ref={arrelRef}
      className="sdp-xat-ref-baner"
      role="region"
      aria-label={t('section.xat.referencia.regio', 'Pàgina de referència de la conversa')}
      data-testid="baner-referencia-pagina-xat"
    >
      <div className="sdp-xat-ref-baner__info">
        <span className="sdp-xat-ref-baner__icona">
          <IconaDeReferencia tipus={referencia.tipus} />
        </span>
        <span className="sdp-xat-ref-baner__text">
          <span className="sdp-xat-ref-baner__etiqueta">{`${etiqueta} `}</span>
          <strong className="sdp-xat-ref-baner__titol">{referencia.titol}</strong>
        </span>
      </div>

      <Link className="sdp-xat-ref-baner__accio" to={referencia.ruta} aria-label={veureAria}>
        <span>{veureText}</span>
        <ArrowUpRight size={15} aria-hidden="true" focusable="false" />
      </Link>
    </div>
  );
}
