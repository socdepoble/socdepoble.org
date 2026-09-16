/**
 * Alerta.jsx — Missatge en línia (no efímer: per a efímers, showToast).
 *
 * El rol NO és sempre "alert": `alert` interromp el lector de pantalla.
 *   error → role="alert" (cal actuar ja) · info/exit/avis → role="status".
 * Emet el canon `sdp-alerta--*` de @layer sdp. `ok` queda com a àlies
 * obsolet d'`exit` (el token es diu --sdp-exit).
 */
import { Info, CircleCheck, TriangleAlert, CircleX, X } from 'lucide-react';

const ICONA = { info: Info, exit: CircleCheck, avis: TriangleAlert, error: CircleX };

export function Alerta({ to = 'info', titol, children, accions = null, onTanca = null, className }) {
  const Icona = ICONA[to] || Info;
  return (
    <div role={to === 'error' ? 'alert' : 'status'}
      className={['sdp-alerta', `sdp-alerta--${to}`, className].filter(Boolean).join(' ')}>
      <Icona className="sdp-alerta__icona" size={22} aria-hidden="true" focusable="false" />
      <div className="sdp-alerta__cos">
        {titol ? <p className="sdp-alerta__titol">{titol}</p> : null}
        <div className="sdp-alerta__text">{children}</div>
        {accions ? <div className="sdp-alerta__accions">{accions}</div> : null}
      </div>
      {onTanca ? (
        <button type="button" className="sdp-alerta__tanca" onClick={onTanca} aria-label="Tancar l'avís">
          <X size={20} aria-hidden="true" focusable="false" />
        </button>
      ) : null}
    </div>
  );
}
