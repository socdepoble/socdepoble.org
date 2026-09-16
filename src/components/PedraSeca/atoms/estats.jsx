/**
 * estats.jsx — Estats de la interfície: buit, carregant, progrés.
 *
 * Tot estat asíncron s'anuncia (role="status"), però els esquelets són
 * decoració: aria-hidden, i el text real el porta un sol node per al lector.
 * El moviment respecta prefers-reduced-motion (al CSS).
 */
import { Inbox, LoaderCircle } from 'lucide-react';

export function EstatBuit({ icona: Icona = Inbox, titol, children, accio = null, className }) {
  return (
    <div className={['sdp-buit', className].filter(Boolean).join(' ')}>
      <Icona className="sdp-buit" size={56} aria-hidden="true" focusable="false" />
      <p className="sdp-buit__titol">{titol}</p>
      {children ? <div className="sdp-buit__text">{children}</div> : null}
      {accio ? <div className="sdp-buit">{accio}</div> : null}
    </div>
  );
}

export function Carregant({ etiqueta = 'Carregant…', className }) {
  return (
    <div role="status" className={['sdp-carregant', className].filter(Boolean).join(' ')}>
      <LoaderCircle className="sdp-carregant__gir" size={28} aria-hidden="true" focusable="false" />
      <span>{etiqueta}</span>
    </div>
  );
}

export function Esquelet({ linies = 3, ambMedia = false, etiqueta = 'Carregant contingut…', className }) {
  return (
    <div role="status" className={['sdp-esquelet', className].filter(Boolean).join(' ')}>
      <span className="sdp-nomes-lector">{etiqueta}</span>
      <div className="sdp-esquelet__forma" aria-hidden="true">
        {ambMedia ? <span className="sdp-esquelet__media" /> : null}
        <span className="sdp-esquelet__linia sdp-esquelet__linia--titol" />
        {Array.from({ length: linies }, (_, i) => <span key={i} className="sdp-esquelet__linia" />)}
      </div>
    </div>
  );
}

/** Progres: <progress> natiu. valor null → indeterminat (no inventem %). */
export function Progres({ etiqueta, valor = null, max = 100, className }) {
  const pct = valor == null ? null : Math.round((valor / max) * 100);
  return (
    <div className={['sdp-progres', className].filter(Boolean).join(' ')}>
      <div className="sdp-progres__cap">
        <span>{etiqueta}</span>
        {pct != null ? <span aria-hidden="true">{pct}%</span> : null}
      </div>
      <progress className="sdp-progres__barra" max={max} value={valor ?? undefined} aria-label={etiqueta} />
    </div>
  );
}
