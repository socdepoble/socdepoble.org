/**
 * BarraSeleccio.jsx — la fila de títol de la llista mentre se seleccionen
 * xats (T68, «Seleccionar xats» de WhatsApp Desktop). Substituïx la fila del
 * títol a la mateixa altura (AppGridColumn, fila 1 de la graella): la creu
 * per a eixir (també Escape, que escolta qui la munta), el recompte i
 * l'única acció que té RPC darrere: «Marcar com a llegides»
 * (useXat().marcaLlegides). Cap acció inventada. `refEixir` deixa que qui la
 * munta hi porte el focus en entrar a la selecció.
 */
import { X } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';

export function textDeRecompte(quants, t) {
  if (quants === 0) return t('section.xat.seleccio.triaXats', 'Tria els xats');
  if (quants === 1) return t('section.xat.seleccio.unaSeleccionada', '1 seleccionada');
  return t('section.xat.seleccio.seleccionades', '{n} seleccionades').replace('{n}', String(quants));
}

export default function BarraSeleccio({ quants = 0, onEixir, onMarcaLlegides, t, refEixir = null }) {
  const eixir = (
    <button
      ref={refEixir}
      type="button"
      className="sdp-xat-icona"
      onClick={onEixir}
      aria-label={t('section.xat.seleccio.eixirXats', 'Eixir de la selecció de xats')}
    >
      <X size={24} aria-hidden="true" focusable="false" />
    </button>
  );
  return (
    <AppGridColumn
      esDark={true}
      esquerra={eixir}
      titol={<span className="sdp-xat-barra-seleccio__recompte" aria-live="polite">{textDeRecompte(quants, t)}</span>}
    >
      <button
        type="button"
        className="sdp-xat-barra-seleccio__accio"
        onClick={onMarcaLlegides}
        disabled={quants === 0}
      >
        {t('section.xat.seleccio.marcaLlegides', 'Marcar com a llegides')}
      </button>
    </AppGridColumn>
  );
}
