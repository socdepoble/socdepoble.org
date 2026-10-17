/**
 * BotoIdentitatActiva.jsx — Amb qui actues, a la barra negra (T43, ordre del
 * Mestre, 260928).
 *
 *   · Sense sessió: la icona de persona i «Entrar» (porta al registre). És el
 *     Foraster de sempre: el seu DOM no canvia.
 *   · Revisió del Gauntlet 261017 (ID4) · Mentre una sessió recordada es
 *     restaura (`pendent`): cap botó, només l'estat ocupat (vegeu baix).
 *   · Persona: la seua foto o les seues inicials.
 *   · Entitat: el SEU logo o les SEUES inicials, MAI la foto de la persona, i
 *     un anell de crom perquè es veja d'un colp que no actues com a tu.
 *
 * Acta 261004_1027 §3 (ordre del Mestre, beta testers) · Amb sessió, l'avatar
 * és redó i gran (Avatar `lg`, 56px; mai menys de --sdp-touch) i és el botó
 * sencer: no hi ha caixa d'icona al voltant. Amb `perfil` (una sola
 * identitat: res a triar) porta directament al perfil propi i el seu nom
 * accessible és «El teu perfil: {nom}». Sense `perfil` (la persona mana en
 * alguna organització), obri el calaix «Amb qui actues?» com fins ara.
 * L'avatar és decoració (alt="", sense títol propi): el nom i el rètol els
 * porta el botó.
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

/** Acta 261004_1027 §3 · El nom accessible de l'avatar que porta al perfil. */
export function etiquetaPerfilPropi(nom) {
  return `El teu perfil: ${nom}`;
}

/** Revisió del Gauntlet 261017 (ID4) · El que diu l'estat ocupat al lector de
 *  pantalla, el mateix text de la pantalla d'espera de RequireAuth. */
export const TEXT_COMPROVANT_SESSIO = 'Comprovant la sessió…';

/* Revisió del Gauntlet 261017 (ID4; relleu 3: mai «Foraster» mentre la sessió
   és vàlida) · `pendent`: la sessió recordada encara es restaura
   (useIdentitatDeLaBarra). Ni el botó «Entrar» ni la silueta del Foraster ni
   cap clic que porte a /registre: només un estat ocupat (aria-busy) per al
   lector de pantalla, sense cap píxel nou ni cap caixa que es puga punxar.
   Quan la comprovació es resol, l'avatar de la persona o, sense sessió, el
   Foraster de sempre. Amb sessió, `pendent` no hi compta. */
export function BotoIdentitatActiva({
  teSessio = false, pendent = false, nom, avatar = null, llavor = null, entitat = false, obert = false,
  perfil = false, onClick, etiquetaEntrar = 'Entrar'
}) {
  if (!teSessio && pendent) {
    return <span className="sr-only" role="status" aria-busy="true">{TEXT_COMPROVANT_SESSIO}</span>;
  }
  if (!teSessio) {
    return (
      <button type="button" className="icon sdp-top-bar-btn" onClick={onClick} aria-label={etiquetaEntrar} title={etiquetaEntrar}>
        <UserRound aria-hidden="true" focusable="false" />
      </button>
    );
  }
  const nomVisible = nom || 'El meu compte';
  const imatge = <AvatarResolt nom={nomVisible} src={avatar} mida="lg" llavor={llavor} alt="" titol="" />;
  /* Una entitat activa vol dir que hi ha més d'una identitat: mai arriba ací
     amb `perfil`, però si hi arribara, el calaix mana (no s'amaga l'anell). */
  if (perfil && !entitat) {
    const etiqueta = etiquetaPerfilPropi(nomVisible);
    return (
      <button type="button" className="sdp-top-bar-avatar" onClick={onClick} aria-label={etiqueta} title={etiqueta}>
        {imatge}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={entitat
        ? 'sdp-top-bar-avatar sdp-top-bar-avatar--entitat'
        : 'sdp-top-bar-avatar'}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={obert ? 'true' : 'false'}
      aria-label={etiquetaIdentitatActiva(nomVisible, entitat)}
      title={`Actues com a ${nomVisible}`}
    >
      {imatge}
    </button>
  );
}

export default BotoIdentitatActiva;
