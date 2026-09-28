/**
 * BotoIdentitatActiva.jsx — Amb qui actues, a la barra negra (T43, ordre del
 * Mestre, 260928).
 *
 *   · Sense sessió: la icona de persona i «Entrar» (porta al registre).
 *   · Persona: la seua foto o les seues inicials.
 *   · Entitat: el SEU logo o les SEUES inicials, MAI la foto de la persona, i
 *     un anell de crom perquè es veja d'un colp que no actues com a tu.
 * El nom accessible diu sempre la identitat activa i que el botó la canvia.
 * L'avatar és decoració (alt=""): el nom ja el porta el botó.
 *
 * Presentacional: rep la identitat per props. Les classes són cadenes
 * senceres (cap classe muntada a trossos) i la closca només pinta amb
 * --sdp-crom-* (css/modules.css, bloc T43).
 */
import { UserRound } from '../../../icons.jsx';
import { AvatarResolt } from './AvatarResolt.jsx';

/** El nom accessible del botó, en un sol lloc (també el lligen les proves). */
export function etiquetaIdentitatActiva(nom, entitat = false) {
  return `Identitat activa: ${nom}${entitat ? ' (organització)' : ''}. Canviar identitat`;
}

export function BotoIdentitatActiva({
  teSessio = false, nom, avatar = null, llavor = null, entitat = false, obert = false,
  onClick, etiquetaEntrar = 'Entrar'
}) {
  if (!teSessio) {
    return (
      <button type="button" className="icon sdp-top-bar-btn" onClick={onClick} aria-label={etiquetaEntrar} title={etiquetaEntrar}>
        <UserRound aria-hidden="true" focusable="false" />
      </button>
    );
  }
  const nomVisible = nom || 'El meu compte';
  return (
    <button
      type="button"
      className={entitat
        ? 'icon sdp-top-bar-btn sdp-top-bar-btn--identitat sdp-top-bar-btn--entitat'
        : 'icon sdp-top-bar-btn sdp-top-bar-btn--identitat'}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={obert ? 'true' : 'false'}
      aria-label={etiquetaIdentitatActiva(nomVisible, entitat)}
      title={`Actues com a ${nomVisible}`}
    >
      <AvatarResolt nom={nomVisible} src={avatar} mida="sm" llavor={llavor} alt="" />
    </button>
  );
}

export default BotoIdentitatActiva;
