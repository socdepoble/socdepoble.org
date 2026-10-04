/**
 * BarraTaronja.jsx — La barra taronja d'autoria i data: el component pare.
 *
 * T51 (ordre del Mestre, 260928) · Extreta de PageFrame (fase B1 de T52): la
 * pinten PageFrame (totes les pàgines, lectura i editor) i els espècimens del
 * catàleg, que abans en feien còpies a mà. Graella de tres columnes (com la
 * blava de T37; components.css, @layer components):
 *   autoria · espai central (EmoticonaBarra) · accions i data.
 *
 * CONTRACTE
 *   authorName · authorLocation · authorAvatar (ruta crua: es resol i es
 *     valida ací; si no és segura, el cercle de reserva) · authorHref (amb
 *     ruta segura, avatar i nom enllacen al perfil; T4) · LinkComponent ·
 *   emoticona (camp CRU del document) · onObriEmoticona (amb ell, l'espai
 *     central és el botó d'emoticona; sense, lectura) ·
 *   barActions (node: les accions de la dreta; mana sobre la data per defecte,
 *     i qui el passa hi posa la seua pastilla) ·
 *   time · date · dateTime · onDateTime (la pastilla per defecte,
 *     DateTimeControl; sense cap dada no es pinta: la data de LECTURA la
 *     posa cada pàgina, T51b) · etiquetaData (el nom accessible de la
 *     pastilla; sense, el de DateTimeControl) · etiqueta (nom de la regió)
 *
 * Ordre del Mestre, 261001 (tasca 4) · En LECTURA la UniversalPage hi passa
 * el clic que porta al Calendari en el mes de la pastilla, i `etiquetaData`
 * ho diu en l'ordre en què es llig: «10:30 24/09/26 · Obri el calendari
 * d’eixe mes»
 * (barres/pastillaCalendari.js). La barra no toca el router: el clic li
 * arriba fet, com l'enllaç de l'autoria (LinkComponent).
 *
 * T6 (ordre del Mestre, 261004) · La ruta de l'autoria passa per la mateixa
 * regla que la boina de la targeta (rutaDAutorSegura, W4-07): un camí de
 * l'app enllaça també a l'app nativa (capacitor://localhost), on isSafeUrl
 * el deixava sense enllaç. Una adreça absoluta, per isSafeUrl com sempre.
 *
 * Ordre del Mestre, 261004 (prompt 261004_0515; privacitat) · L'avatar no
 * envia cap Referer (referrerPolicy="no-referrer"): el detall del Lector hi
 * pot passar el logo d'una font de fora sense dir-li qui el llig. Un atribut,
 * cap píxel.
 */
import { UserRound } from 'lucide-react';
import { resolveAsset } from '../../../config/assetResolver';
import { DateTimeControl } from '../../PedraSeca/atoms/controls.jsx';
import { isSafeAsset, rutaDAutorSegura } from '../UniversalUtils';
import { EmoticonaBarra } from '../EmoticonaBarra.jsx';

export function BarraTaronja({
  authorName, authorLocation, authorAvatar, authorHref = null, LinkComponent = 'a',
  emoticona = '', onObriEmoticona = null,
  barActions = null,
  time, date, dateTime, onDateTime, etiquetaData,
  etiqueta = 'Autoria i data',
}) {
  const resolt = typeof authorAvatar === 'string' ? resolveAsset(authorAvatar) : null;
  const avatar = isSafeAsset(resolt) ? resolt : null;
  const href = rutaDAutorSegura(authorHref);
  const Autor = href ? (LinkComponent === 'a' ? 'a' : LinkComponent) : 'div';
  const propsAutor = href ? (LinkComponent === 'a' ? { href } : { to: href }) : {};

  return (
    <section className="bar-orange" aria-label={etiqueta}>
      <Autor className={href ? 'sp-card-author sp-card-author-link' : 'sp-card-author'} {...propsAutor}>
        {avatar ? (
          <img
            className="sp-card-avatar"
            src={avatar}
            alt=""
            decoding="async"
            referrerPolicy="no-referrer"
            width="48"
            height="48"
            onError={(e) => {
              e.currentTarget.classList.add('sp-card-avatar--amagat');
              e.currentTarget.nextSibling?.classList.remove('sp-card-avatar--amagat');
            }}
          />
        ) : null}
        <div
          className={['sp-card-avatar', 'sp-card-avatar--fallback', avatar && 'sp-card-avatar--amagat'].filter(Boolean).join(' ')}
        >
          <UserRound size={24} />
        </div>
        <div className="sp-card-author-info">
          <div className="sp-card-author-name">{authorName}</div>
          <div className="sp-card-author-location">{authorLocation}</div>
        </div>
      </Autor>
      <EmoticonaBarra emoticona={emoticona} onObri={onObriEmoticona} />
      <div className="bar-actions">
        {barActions ? barActions : ((time || date || dateTime)
          ? <DateTimeControl time={time} date={date} dateTime={dateTime} label={etiquetaData} onClick={onDateTime} />
          : null)}
      </div>
    </section>
  );
}

export default BarraTaronja;
