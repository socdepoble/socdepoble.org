/**
 * PaginaApp.jsx — la Pàgina Universal de les apps: el detall d'un element
 * d'una app (una notícia, un article de la Nevera) amb l'anatomia de sempre.
 *
 * Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes»; D-A
 * del xat de les 06:38) · Les apps no poden muntar PageFrame ni UniversalPage
 * (src/apps/plataforma/fronteres.test.js: cap traducció de pàgina ni
 * telemetria a src/apps). Esta és la porta permesa: arriba per la façana de
 * PedraSeca i munta PageFrame amb la doble barra sencera, però
 *  · sense traductor (traduccio={false}): Traduir avisa i cap text ix cap
 *    al servei de l'amfitrió;
 *  · sense telemetria: el Connectar de la barra no compta ({ comptar: false });
 *  · amb les imatges privades: la portada i l'avatar passen pel filtre de les
 *    peces de les apps (fontSegura de marca.jsx: el mateix origen o el de
 *    mitjans) i la portada es demana sense referent. Una imatge de fora no es
 *    pinta: el lector de notícies no avisa ningú que algú ha obert l'article.
 * La pastilla de data és text (<time>): un element d'una app no és al
 * Calendari.
 *
 * CONTRACTE
 *   title · subtitle · lead (l'H1, l'H2 i l'entradilla de PageFrame)
 *   author { nom, avatar, href, poble } · sense, signa «Sóc de Poble» i porta
 *     a la pàgina del projecte (DEFAULT_AUTHOR, T6). Norma del Mestre, 261004
 *     (logotips): sense autor o amb la ruta del projecte (/projecte), la
 *     pàgina porta el logotip de Sóc de Poble dalt de l'H1; el decidix
 *     PageFrame per la ruta de la boina. Una font de fora o una persona, cap.
 *   date · time · dateTime (la pastilla de la barra taronja)
 *   heroImage · heroAlt (la portada, filtrada)
 *   labels (les píndoles de davall de l'H1) · accioPrincipal (l'acció gran
 *     del bloc del títol, PageFrame)
 *   onBack (Tornar de la barra blava) · refTitol (el focus a l'H1 en obrir)
 *   objecte · onComment · onShare · onConnect · showComment · showShare ·
 *     showConnect (les accions de la barra blava, com a PageFrame; sense, les
 *     de sempre. Una llista privada no té res a compartir: showShare={false})
 *   barActions (opcional; ordre del Mestre del 261004, Gestoria, principi 2:
 *     la boina personal porta l'ull de privacitat i la data de la darrera
 *     sincronització) · les accions de la dreta de la barra taronja
 *     (BarraTaronja). Manen sobre la pastilla per defecte: qui les passa hi
 *     posa la seua. Sense, el DOM de sempre.
 *   children (el cos, dins de l'article de la pàgina)
 */
import { Link } from '../../../app/contexts/RouterContext';
import { PageFrame } from '../../universal/PageFrame.jsx';
import { fontSegura } from './marca.jsx';

const SENSE_TELEMETRIA = Object.freeze({ comptar: false });

/* Les props de PageFrame que només es passen quan arriben: un undefined
   explícit taparia el valor per defecte d'un paràmetre de PageFrame. */
const nomesAmbValor = (props) => Object.fromEntries(Object.entries(props).filter(([, valor]) => valor !== undefined));

export function PaginaApp({
  title, subtitle, lead,
  author = null,
  date, time, dateTime,
  heroImage, heroAlt = '',
  labels = [],
  accioPrincipal = null,
  onBack,
  refTitol,
  objecte, onComment, onShare, onConnect, showComment, showShare, showConnect,
  barActions = null,
  children
}) {
  const portada = fontSegura(heroImage);
  /* La portada i, si n'hi ha, les accions de la barra taronja. Sense cap de
     les dues, l'objecte buit de sempre. */
  const dadesBarra = {
    ...(portada ? { heroComponent: <img src={portada} alt={heroAlt} referrerPolicy="no-referrer" decoding="async" /> } : {}),
    ...(barActions ? { barActions } : {})
  };
  const autoria = author ? {
    authorName: author.nom ?? '',
    authorLocation: author.poble ?? '',
    /* null (no undefined): sense avatar segur, el cercle de reserva de la
       barra, mai el logo de l'autor per defecte. */
    authorAvatar: fontSegura(author.avatar),
    authorHref: author.href ?? null
  } : {};

  return (
    <PageFrame
      chrome="full"
      layout="page"
      title={title}
      subtitle={subtitle}
      lead={lead}
      labels={labels}
      {...autoria}
      date={date}
      time={time}
      dateTime={dateTime}
      topBarData={dadesBarra}
      accioPrincipal={accioPrincipal}
      onBack={onBack}
      refTitol={refTitol}
      traduccio={false}
      telemetria={SENSE_TELEMETRIA}
      {...nomesAmbValor({ objecte, onComment, onShare, onConnect, showComment, showShare, showConnect })}
      LinkComponent={Link}
    >
      {children}
    </PageFrame>
  );
}
