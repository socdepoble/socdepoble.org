/**
 * Rajola.jsx — botó quadrat (1:1) amb imatge o marcador, títol i línia secundària.
 * L'única excepció és la del Lector: dins de .sdp-panoramica (GraellaArticles
 * amb la variant panoramica; src/css/modules.css, bloc catalegColleccio) la
 * rajola deixa de ser quadrada i la imatge o el marcador van en 16:9.
 *
 * La peça de les graelles tàctils: els productes del Bar, les categories,
 * qualsevol tria que es fa amb un dit. És sempre un <button> natiu: el nom
 * accessible és el títol i la línia secundària; la imatge (o el marcador
 * d'inicials) és decoració. Mai fa menys de --sdp-touch.
 *
 *   imatge      src d'una imatge quadrada; passa pel filtre de sanitize.js i,
 *               si és un recurs propi ('/assets/…'), per la base de l'amfitrió
 *   media       un node propi en lloc de la imatge (p. ex. <ImatgeProducte>)
 *   marcador    el text del quadrat sense imatge; per defecte, les inicials
 *               de les dues primeres paraules del títol
 *   seleccionada  true/false → aria-pressed (una rajola que es tria);
 *               sense, és una acció (afig, obri)
 *   desactivada   disabled natiu (p. ex. «Esgotat» a la línia secundària)
 * La resta de props (aria-*, data-*, onClick) van al <button>.
 */
import { esFontImatgeSegura } from '../../../utils/sanitize.js';
import { resolRecursPropi } from '../../../config/assetResolver.js';

/** Inicials de les dues primeres paraules (com l'Avatar): «Cafè amb llet» → «CA». */
export function inicialsDe(text) {
  const paraules = String(text ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const inicials = paraules.map((paraula) => [...paraula][0].toLocaleUpperCase('ca')).join('');
  return inicials || '?';
}

export function Rajola({
  titol, secundari = null, imatge = null, media = null, marcador = null,
  seleccionada, desactivada = false, className, ...rest
}) {
  const font = typeof imatge === 'string' && imatge !== '' ? resolRecursPropi(imatge) : null;
  const src = font && esFontImatgeSegura(font) ? font : null;
  let quadrat;
  if (src) quadrat = <img className="sdp-rajola__imatge" src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />;
  else if (media) quadrat = media;
  else quadrat = <span className="sdp-rajola__marcador">{marcador || inicialsDe(titol)}</span>;
  return (
    <button
      type="button"
      className={['sdp-rajola', className].filter(Boolean).join(' ')}
      disabled={desactivada}
      aria-pressed={typeof seleccionada === 'boolean' ? seleccionada : undefined}
      {...rest}
    >
      <span className="sdp-rajola__media" aria-hidden="true">{quadrat}</span>
      <span className="sdp-rajola__titol">{titol}</span>
      {/* L'espai separa títol i línia secundària al nom accessible; dins de la graella no es pinta. */}
      {secundari ? <>{' '}<span className="sdp-rajola__secundari">{secundari}</span></> : null}
    </button>
  );
}
