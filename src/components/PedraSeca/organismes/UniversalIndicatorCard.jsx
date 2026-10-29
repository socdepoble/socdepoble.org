/**
 * UniversalIndicatorCard.jsx
 * CORRECCIÓ 260910: <h3> i <p> dins de <button> no són contingut permés
 * (un botó només admet contingut de frase). Ara són <span> amb les mateixes
 * classes. Sense canvi visual: .sdp-indicator-card és flex en columna (els
 * fills es fan bloc) i títol i subtítol ja fixen font, color i margin: 0.
 */
import { useRef } from 'react';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';

export function UniversalIndicatorCard({
  icon,
  title,
  subtitle,
  active,
  onClick,
  iconColor,
  className = ''
}) {
  const iconRef = useRef(null);
  usePropietatsCss(iconRef, { '--custom-icon-color': iconColor || null });

  return (
    <button 
      type="button"
      className={`sdp-indicator-card ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span ref={iconRef} className="sdp-indicator-card-icon">
        {icon}
      </span>
      <span className="sdp-indicator-card-title">{title}</span>
      {subtitle && <span className="sdp-indicator-card-subtitle">{subtitle}</span>}
    </button>
  );
}
