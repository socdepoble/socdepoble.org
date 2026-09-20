/**
 * Avatar.jsx — Representació d'una persona o entitat.
 *
 * Mides tancades (§ 4.5 del sistema): xs 24 · sm 32 · md 44 · lg 56 · xl 80.
 * md és el mínim tàctil: per davall, l'avatar no pot ser interactiu.
 * Amb imatge, l'alt és obligatori. Sense imatge, les inicials són decoració
 * i el nom el porta el títol accessible.
 */
import { esFontImatgeSegura } from '../../../utils/sanitize.js';

const MIDES = ['xs', 'sm', 'md', 'lg', 'xl'];

export function Avatar({ nom, src = null, mida = 'md', className }) {
  const m = MIDES.includes(mida) ? mida : 'md';
  const inicials = (nom || '?')
    .trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '').join('');

  let safeSrc = null;
  if (src && esFontImatgeSegura(src)) {
    safeSrc = src;
  }

  return (
    <span
      className={['sdp-avatar', `sdp-avatar--${m}`, className].filter(Boolean).join(' ')}
      title={nom || undefined}
    >
      {safeSrc
        ? <img className="sdp-avatar__imatge" src={safeSrc} alt={nom || ''} loading="lazy" referrerPolicy="no-referrer" />
        : <span aria-hidden="true">{inicials}</span>}
      {nom ? <span className="sdp-nomes-lector">{nom}</span> : null}
    </span>
  );
}

export function GrupAvatars({ children, className }) {
  return (
    <span className={['sdp-avatar-grup', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
