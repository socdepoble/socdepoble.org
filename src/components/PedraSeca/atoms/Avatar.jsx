/**
 * Avatar.jsx — Representació d'una persona o entitat.
 *
 * Mides tancades (§ 4.5 del sistema): xs 24 · sm 32 · md 44 · lg 56 · xl 80.
 * md és el mínim tàctil: per davall, l'avatar no pot ser interactiu.
 * Amb imatge, l'alt és obligatori. Sense imatge, les inicials són decoració
 * i el nom el porta el títol accessible.
 *
 * Props opcionals (xat F0, PER-B03 i PER-B04):
 *   · `llavor`: identificador estable de la persona. Tria un dels sis tons
 *     semàntics (sdp-avatar--to-1..6) a partir de l'identificador, no del nom,
 *     perquè el color no canvie si la persona es reanomena.
 *   · `alt`: text alternatiu explícit. `alt=""` quan la foto va al costat del
 *     nom escrit (repetir-lo seria soroll per al lector de pantalla).
 * Sense `llavor` ni `alt`, el comportament és idèntic a l'anterior.
 *
 * Base de recursos (T5, 261001): un `src` propi ('/assets/…') es resol amb
 * la base de l'amfitrió (config/assetResolver.js) ABANS del filtre de
 * seguretat. Incrustat, el paquet no viu a l'arrel del domini i el xat
 * demanava la IAIA i el logo a l'arrel (404). Sense base, el mateix valor;
 * un valor ja resolt (AvatarResolt, RealitatSection) passa intacte.
 */
import { esFontImatgeSegura } from '../../../utils/sanitize.js';
import { resolRecursPropi } from '../../../config/assetResolver.js';

const MIDES = ['xs', 'sm', 'md', 'lg', 'xl'];
const TONS = 6;

/** Enter d'1 a 6 derivat de la llavor; sense llavor, cap to (classe base). */
export function toDeLlavor(llavor) {
  if (llavor == null || llavor === '') return null;
  const s = String(llavor);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % TONS) + 1;
}

export function Avatar({ nom, src = null, mida = 'md', className, llavor = null, alt }) {
  const m = MIDES.includes(mida) ? mida : 'md';
  const inicials = (nom || '?')
    .trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '').join('');

  const font = resolRecursPropi(src);
  let safeSrc = null;
  if (font && esFontImatgeSegura(font)) {
    safeSrc = font;
  }

  const to = toDeLlavor(llavor);
  const textLector = alt === undefined ? (nom || '') : alt;

  return (
    <span
      className={['sdp-avatar', `sdp-avatar--${m}`, to ? `sdp-avatar--to-${to}` : null, className].filter(Boolean).join(' ')}
      title={nom || undefined}
    >
      {safeSrc
        ? <img className="sdp-avatar__imatge" src={safeSrc} alt={textLector} loading="lazy" referrerPolicy="no-referrer" />
        : <span aria-hidden="true">{inicials}</span>}
      {textLector ? <span className="sdp-nomes-lector">{textLector}</span> : null}
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
