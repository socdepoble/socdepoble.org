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
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4; decisió de les
 * 21:20): la referència opaca d'una pujada ('sdp-media://') es resol pel port
 * amb useResolvedAsset abans de passar per fontSegura; mentre es resol, o si
 * no es pot, la silueta honesta, mai la referència crua. Derogat EN PART
 * XAT-02 (ordre del Mestre, 261014, pla 261014_0210; marca.jsx i
 * utils/mitjaOpac.js), que deia que una referència opaca és una font absent i
 * que qui pinta hi posa el seu substitut: ací la portada i l'avatar opacs es
 * demanen abans al port, i fontSegura rep la URL que torna, no la referència.
 * Si el port torna encara la referència (no pot firmar una URL privada) o res,
 * fontSegura la descarta com fins ara. Sense la capacitat 'mitjans' (les
 * proves, una app sense node) el port no es crida: la silueta i cap portada,
 * com abans. La frontera del 261006 (apps/plataforma/sessioApp.js: el pont no
 * crida el port) no es toca: el crida esta peça en pintar.
 * Revisió adversarial, 14-10-2026 · La referència es demana al port amb
 * l'esquema en minúscules i sense espais (refDelPort): useResolvedAsset només
 * reconeix 'sdp-media://' escrit així, i un 'SDP-MEDIA://…' (que esMitjaOpac i
 * sanitize.js admeten) anava al resolutor de camins, tornava '/SDP-MEDIA://…' i
 * fontSegura el deixava passar com un camí del mateix origen.
 *
 * CONTRACTE
 *   title · subtitle · lead (l'H1, l'H2 i l'entradilla de PageFrame)
 *   author { nom, avatar, href, poble } · sense, signa «Sóc de Poble» i porta
 *     al seu perfil (DEFAULT_AUTHOR, T6; Onada 8, 261009: /empresa/socdepoble,
 *     abans la pàgina del projecte). Norma del Mestre, 261004 (logotips):
 *     sense autor o amb la ruta del projecte (esRutaDelProjecte: el perfil o
 *     la vella /projecte), la pàgina porta el logotip de Sóc de Poble dalt de
 *     l'H1; el decidix PageFrame per la ruta de la boina. Una font de fora o
 *     una persona, cap. Un avatar 'sdp-media://…' es resol pel port (vegeu
 *     dalt, 14-10-2026).
 *   date · time · dateTime (la pastilla de la barra taronja)
 *   heroImage · heroAlt (la portada, filtrada; una 'sdp-media://…', resolta
 *     abans pel port)
 *   labels (les píndoles de davall de l'H1) · accioPrincipal (l'acció gran
 *     del bloc del títol, PageFrame)
 *   onBack (Tornar de la barra blava) · refTitol (el focus a l'H1 en obrir)
 *   objecte · onComment · onShare · onConnect · showComment · showShare ·
 *     showConnect (les accions de la barra blava, com a PageFrame; sense, les
 *     de sempre. Una llista privada no té res a compartir: showShare={false})
 *   accionsInoperatives · onClickInoperatiu (opcionals) · Ordre del Mestre,
 *     14-10-2026 (prompt 261014_2015, punt 5): les accions inoperatives de
 *     PageFrame (T36), amb aria-disabled i el clic a onClickInoperatiu(accio);
 *     la Gestoria les fa servir perquè la barra porte les accions de sempre
 *     sense que cap dada isca de l'ordinador. Es passen tal qual a PageFrame,
 *     que en manté la forma: accionsInoperatives és un booleà (amb un valor
 *     cert, Comentar, Compartir i Connectar es pinten igual, enfocables, i el
 *     clic no fa la seua acció: ni menú de Comentar, ni navigator.share ni el
 *     porta-retalls, ni cap navegació) i onClickInoperatiu rep quin botó és,
 *     'comentar' | 'compartir' | 'connectar', perquè qui munta la pàgina hi
 *     pose l'avís honest. Índex, Tornar i Traduir (que ja avisa: sense
 *     traductor) continuen vius. Sense elles no es passen (nomesAmbValor) i
 *     el DOM és el de sempre (Llei del Píxel per a totes les apps).
 *   barActions (opcional; ordre del Mestre del 261004, Gestoria, principi 2:
 *     la boina personal porta l'ull de privacitat i la data de la darrera
 *     sincronització) · les accions de la dreta de la barra taronja
 *     (BarraTaronja). Manen sobre la pastilla per defecte: qui les passa hi
 *     posa la seua. Sense, el DOM de sempre.
 *   rellotgeViu · rellotge (ordre del Mestre, 13-10-2026, pla 261013_1405,
 *     front B: «A la part dreta de la barra taronja, SEMPRE la data i l'hora
 *     vives») · Amb rellotgeViu (només un `true` explícit: un text o un 1 no
 *     l'encenen), la data i l'hora d'ara (atoms/RellotgeViu.jsx) són SEMPRE
 *     l'últim fill de les accions de la dreta, l'extrem dret de la barra:
 *     darrere de barActions o, sense, darrere de la pastilla del document
 *     (date · time · dateTime), que no es perd. `rellotge` (() => ms) és el
 *     rellotge injectat (la Gestoria, les proves). És una excepció ordenada a
 *     la regla de la pastilla (skill sdp-pedra-seca §10, 28-09-2026: la
 *     pastilla és la data del document): PageFrame continua sense inventar-se
 *     «la d'ara», i el rellotge el posa esta porta quan la pàgina el demana.
 *     Sense rellotgeViu, el DOM de sempre (Llei del Píxel per a la resta
 *     d'apps).
 *   children (el cos, dins de l'article de la pàgina)
 */
import { Link } from '../../../app/contexts/RouterContext';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';
import { esMitjaOpac } from '../../../utils/mitjaOpac.js';
import { PageFrame } from '../../universal/PageFrame.jsx';
import { DateTimeControl } from '../atoms/controls.jsx';
import { RellotgeViu } from '../atoms/RellotgeViu.jsx';
import { fontSegura } from './marca.jsx';

const SENSE_TELEMETRIA = Object.freeze({ comptar: false });

/* Les props de PageFrame que només es passen quan arriben: un undefined
   explícit taparia el valor per defecte d'un paràmetre de PageFrame. */
const nomesAmbValor = (props) => Object.fromEntries(Object.entries(props).filter(([, valor]) => valor !== undefined));

/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4) · El que es
   demana al port: només una referència opaca (esMitjaOpac), sense espais i
   amb l'esquema en minúscules, l'única forma que useResolvedAsset envia al
   port (un 'SDP-MEDIA://…' tornava '/SDP-MEDIA://…', vegeu la capçalera).
   Qualsevol altra font, '': el ganxo no fa res i la font segueix el seu camí. */
const refDelPort = (src) => (esMitjaOpac(src) ? src.trim().replace(/^sdp-media:/i, 'sdp-media:') : '');

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
  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 5) · les accions
     inoperatives de PageFrame (T36). Sense, no es passen. */
  accionsInoperatives, onClickInoperatiu,
  barActions = null,
  rellotgeViu = false,
  rellotge,
  children
}) {
  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4; decisió de les
     21:20) · Els dos ganxos es criden sempre, en el mateix ordre i abans de
     res: sense referència opaca reben '' i no fan res. Una font opaca només
     arriba a fontSegura com la URL que torna el port ('' mentre es resol o si
     no es pot): la silueta o cap portada, mai la referència. */
  const heroDelPort = useResolvedAsset(refDelPort(heroImage));
  const avatarCru = author?.avatar;
  const avatarDelPort = useResolvedAsset(refDelPort(avatarCru));
  const portada = fontSegura(esMitjaOpac(heroImage) ? heroDelPort : heroImage);
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · Amb el
     rellotge, les accions acaben sempre en la data i l'hora d'ara. Sense
     barActions, davant hi va la pastilla del document, la mateixa que hi
     pintaria la barra (sense data, cap). */
  const accions = rellotgeViu === true ? (
    <>
      {barActions || ((time || date) ? <DateTimeControl time={time} date={date} dateTime={dateTime} /> : null)}
      <RellotgeViu rellotge={rellotge} />
    </>
  ) : barActions;
  /* La portada i, si n'hi ha, les accions de la barra taronja. Sense cap de
     les dues, l'objecte buit de sempre. */
  const dadesBarra = {
    ...(portada ? { heroComponent: <img src={portada} alt={heroAlt} referrerPolicy="no-referrer" decoding="async" /> } : {}),
    ...(accions ? { barActions: accions } : {})
  };
  const autoria = author ? {
    authorName: author.nom ?? '',
    authorLocation: author.poble ?? '',
    /* null (no undefined): sense avatar segur, el cercle de reserva de la
       barra, mai el logo de l'autor per defecte. */
    authorAvatar: fontSegura(esMitjaOpac(avatarCru) ? avatarDelPort : avatarCru),
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
      {...nomesAmbValor({
        objecte, onComment, onShare, onConnect, showComment, showShare, showConnect,
        accionsInoperatives, onClickInoperatiu
      })}
      LinkComponent={Link}
    >
      {children}
    </PageFrame>
  );
}
