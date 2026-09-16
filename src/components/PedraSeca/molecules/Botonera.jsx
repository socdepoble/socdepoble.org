import React from 'react';
import { Link, useLocation } from '../../../app/contexts/RouterContext';

/**
 * Botonera.jsx — Menú de navegació semàntic de Pedra Seca.
 *
 * Reaprofita les classes CSS del PillToggle (.sdp-pindola) però utilitza
 * una semàntica correcta per a navegació (<nav>, <Link aria-current="page">).
 * Compleix amb els requisits d'accessibilitat permetent "Obrir en pestanya nova".
 */
export function Botonera({
  opcions = [],
  etiqueta,
  className = '',
  vertical = false,
  children,
}) {
  return (
    <nav
      aria-label={etiqueta}
      className={['sdp-pindola', vertical ? 'sdp-pindola--vertical' : '', className].filter(Boolean).join(' ')}
    >
      {opcions.map((opcio) => {
        return (
          <Link
            key={opcio.valor || opcio.to}
            to={opcio.to}
            className="sdp-pindola__opcio"
            aria-current={opcio.activa ? 'page' : undefined}
          >
            {opcio.icona ? <span className="sdp-pindola__icona" aria-hidden="true">{opcio.icona}</span> : null}
            {opcio.text}
          </Link>
        );
      })}
      {children}
    </nav>
  );
}
