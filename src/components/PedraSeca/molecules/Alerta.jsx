/**
 * Alerta.jsx — Missatge en línia (no efímer: per a efímers, showToast).
 *
 * El rol NO és sempre "alert": `alert` interromp el lector de pantalla.
 *   error → role="alert" (cal actuar ja) · info/exit/avis → role="status".
 * Emet el canon `sdp-alerta--*` de @layer sdp. `ok` queda com a àlies
 * obsolet d'`exit` (el token es diu --sdp-exit).
 *
 * Correcció C17 (260928) · `viva` (per defecte true: els usos de sempre no
 * canvien). Amb viva={false} no porta cap rol, i la pell és la mateixa: per
 * a una explicació llarga o un formulari, que no han de viure dins d'una
 * regió viva (el lector ho llegiria tot de colp en aparéixer).
 */
import { Info, CircleCheck, TriangleAlert, CircleX, X } from 'lucide-react';
import { tradueix, useTraductorOpcional } from '../hooks/useTraductorOpcional.js';

const ICONA = { info: Info, exit: CircleCheck, avis: TriangleAlert, error: CircleX };
/* Gauntlet 261029 (cicle 1, i18n) · El nom accessible de la creu, en la
   llengua de la interfície; fora de l'app, la reserva de sempre. */
const TANCA_AVIS = Object.freeze(['common.tancaAvis', 'Tancar l\'avís']);

export function Alerta({ to = 'info', titol, children, accions = null, onTanca = null, className, viva = true }) {
  const Icona = ICONA[to] || Info;
  const t = useTraductorOpcional();
  return (
    <div role={viva ? (to === 'error' ? 'alert' : 'status') : undefined}
      className={['sdp-alerta', `sdp-alerta--${to}`, className].filter(Boolean).join(' ')}>
      <Icona className="sdp-alerta__icona" size={22} aria-hidden="true" focusable="false" />
      <div className="sdp-alerta__cos">
        {titol ? <p className="sdp-alerta__titol">{titol}</p> : null}
        <div className="sdp-alerta__text">{children}</div>
        {accions ? <div className="sdp-alerta__accions">{accions}</div> : null}
      </div>
      {onTanca ? (
        <button type="button" className="sdp-alerta__tanca" onClick={onTanca} aria-label={tradueix(t, TANCA_AVIS)}>
          <X size={20} aria-hidden="true" focusable="false" />
        </button>
      ) : null}
    </div>
  );
}
