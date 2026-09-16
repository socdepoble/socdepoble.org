/**
 * navegacio.jsx — Molla de pa i paginació.
 *
 * MollaPa: <nav aria-label> + <ol>; l'últim pas és la pàgina actual
 *   (aria-current="page", no enllaç). passos: [{ etiqueta, a? }]
 * Paginacio: botons amb TEXT («Anterior»/«Següent»), no només fletxes.
 *   Finestra: 1 … p-1 p p+1 … N. Mai més de 7 botons: cap en 44px × 7.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';

export function MollaPa({ passos = [], className }) {
  return (
    <nav aria-label="Molla de pa" className={['sdp-molla', className].filter(Boolean).join(' ')}>
      <ol className="sdp-molla__llista">
        {passos.map((p, i) => {
          const ultim = i === passos.length - 1;
          return (
            <li key={`${p.etiqueta}-${i}`} className="sdp-molla__pas">
              {ultim || !p.a
                ? <span aria-current={ultim ? 'page' : undefined}>{p.etiqueta}</span>
                : <Link to={p.a} className="sdp-molla__enllac">{p.etiqueta}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function finestraPagines(pagina, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const nuc = [pagina - 1, pagina, pagina + 1].filter((n) => n > 1 && n < total);
  const eixida = [1];
  if (nuc[0] > 2) eixida.push('…');
  eixida.push(...nuc);
  if (nuc[nuc.length - 1] < total - 1) eixida.push('…');
  eixida.push(total);
  return eixida;
}

export function Paginacio({ pagina, total, onCanvi, className }) {
  if (!total || total < 2) return null;
  return (
    <nav aria-label="Paginació" className={['sdp-paginacio', className].filter(Boolean).join(' ')}>
      <button type="button" className="sdp-paginacio__pas" disabled={pagina <= 1} onClick={() => onCanvi(pagina - 1)}>
        <ChevronLeft size={20} aria-hidden="true" focusable="false" /><span>Anterior</span>
      </button>
      <ol className="sdp-paginacio__llista">
        {finestraPagines(pagina, total).map((n, i) => (
          <li key={`${n}-${i}`}>
            {n === '…'
              ? <span className="sdp-paginacio__salt" aria-hidden="true">…</span>
              : (
                <button type="button" className="sdp-paginacio__num" aria-label={`Pàgina ${n}`}
                  aria-current={n === pagina ? 'page' : undefined} onClick={() => onCanvi(n)}>{n}</button>
              )}
          </li>
        ))}
      </ol>
      <button type="button" className="sdp-paginacio__pas" disabled={pagina >= total} onClick={() => onCanvi(pagina + 1)}>
        <span>Següent</span><ChevronRight size={20} aria-hidden="true" focusable="false" />
      </button>
    </nav>
  );
}
