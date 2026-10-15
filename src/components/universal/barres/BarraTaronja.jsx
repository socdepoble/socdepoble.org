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
 *
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4; decisió de les
 * 21:20): la referència opaca d'una pujada ('sdp-media://') es resol pel port
 * amb useResolvedAsset abans de passar per fontSegura; mentre es resol, o si
 * no es pot, la silueta honesta, mai la referència crua. Ací el filtre és
 * resolveAsset i isSafeAsset (la barra no usa fontSegura): rep la URL que
 * torna el port, mai la referència. Derogat EN PART el contracte d'authorAvatar
 * («ruta crua: es resol i es valida ací»): una 'sdp-media://…' ja no passa per
 * resolveAsset, que la convertia en '/sdp-media://…', un camí del mateix
 * origen que isSafeAsset deixava passar (una imatge trencada demanada al
 * nostre servidor), sinó pel port. Si el port torna encara la referència o
 * res, o la capacitat 'mitjans' no hi és, el cercle de reserva. La resta de
 * fonts, el camí de sempre (Llei del Píxel).
 * Revisió adversarial, 14-10-2026 · La referència es demana al port amb
 * l'esquema en minúscules i sense espais (refDelPort, el mateix que a
 * PaginaApp i UniversalCard): useResolvedAsset només reconeix 'sdp-media://'
 * escrit així, i un 'SDP-MEDIA://…' tornava '/SDP-MEDIA://…' del resolutor de
 * camins i es pintava.
 */
import { UserRound } from 'lucide-react';
import { resolveAsset } from '../../../config/assetResolver';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';
import { esMitjaOpac } from '../../../utils/mitjaOpac.js';
import { DateTimeControl } from '../../PedraSeca/atoms/controls.jsx';
import { isSafeAsset, rutaDAutorSegura } from '../UniversalUtils';
import { EmoticonaBarra } from '../EmoticonaBarra.jsx';
import { emoticonaDeBarra } from '../../../utils/emoji.js';

/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4) · El que es
   demana al port: només una referència opaca, sense espais i amb l'esquema
   en minúscules (vegeu la capçalera). Qualsevol altra font, '': el ganxo no
   fa res. */
const refDelPort = (src) => (esMitjaOpac(src) ? src.trim().replace(/^sdp-media:/i, 'sdp-media:') : '');

export function BarraTaronja({
  authorName, authorLocation, authorAvatar, authorHref = null, LinkComponent = 'a',
  emoticona = '', onObriEmoticona = null,
  barActions = null,
  time, date, dateTime, onDateTime, etiquetaData,
  etiqueta = 'Autoria i data',
}) {
  /* El ganxo es crida sempre, el primer: sense referència opaca rep '' i no fa res. */
  const avatarDelPort = useResolvedAsset(refDelPort(authorAvatar));
  const fontAvatar = esMitjaOpac(authorAvatar) ? avatarDelPort : authorAvatar;
  const resolt = typeof fontAvatar === 'string' && fontAvatar && !esMitjaOpac(fontAvatar) ? resolveAsset(fontAvatar) : null;
  const avatar = isSafeAsset(resolt) ? resolt : null;
  const href = rutaDAutorSegura(authorHref);
  const Autor = href ? (LinkComponent === 'a' ? 'a' : LinkComponent) : 'div';
  const propsAutor = href ? (LinkComponent === 'a' ? { href } : { to: href }) : {};
  /* Correcció de l'Onada 6 (QA visual, 375px: «Gent de la Torre» i «La
     Torre de les Maçanes» es tallaven a 100px amb 100px lliures fins a la
     data) · En lectura sense emoticona l'espai central és buit i no hi ha
     res a centrar: la barra ho diu amb data-centre="buit" i l'autoria pot
     ocupar l'ample que deixa la data (components.css). Amb emoticona o en
     edició, la graella de T51 de sempre. */
  const { mostra } = emoticonaDeBarra({ mode: typeof onObriEmoticona === 'function' ? 'edicio' : 'lectura', icon: emoticona });
  const centreBuit = mostra !== 'boto' && mostra !== 'glif';

  return (
    <section className="bar-orange" aria-label={etiqueta} data-centre={centreBuit ? 'buit' : undefined}>
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
