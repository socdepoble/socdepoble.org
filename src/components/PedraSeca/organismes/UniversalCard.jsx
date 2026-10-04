/**
 * UniversalCard.jsx — la targeta mestra. L'única peça de ui/ que toca el router.
 *
 * Mateix DOM i mateixes classes que a UniversalElements.jsx. Correccions 260910:
 *
 *  1 · TRADUIR. `showTranslate`/`onTranslate` es calculaven i el peu no els
 *      rebia: nou crides demanaven el botó i no eixia mai, i si era l'única
 *      acció quedava un `.sp-card-actions` buit. Ara es pinta, el primer.
 *  2 · NOMS ACCESSIBLES. «Connectar amb …» anava en `aria-label`, que
 *      ActionControl no llig: es perdia. Ara va per `label`. Comentar,
 *      Compartir i Traduir porten el títol: deu botons iguals en una llista
 *      no es distingixen amb un lector de pantalla.
 *  3 · CONTENIDORS BUITS. Un avatar insegur sense autor ni lloc deixava un
 *      capçal amb un <span> buit; `onDateTime` sense data deixava un
 *      `.sp-card-meta` buit. Ara la visibilitat es calcula sobre el que es pinta.
 *  4 · COMPARTIR. clipboard sense await avisava «copiat» encara que fallara;
 *      sense clipboard (http) petava; alert() bloquejava; tancar el menú
 *      natiu es registrava com a error.
 *  5 · DATA. toISOString() passava a UTC i restava un dia a les dates locals.
 *  6 · `headingLevel` es pintava com a etiqueta sense filtre: ara h2–h6.
 *  7 · `labels: null` (columna buida de Supabase) tombava la targeta.
 *
 * Poliment editorial 260925: el títol i el subtítol visibles, quan són text,
 * es pinten sense punt final (els suspensius es queden). Els noms accessibles
 * de les accions conserven el títol tal com arriba.
 *
 * Ordre del Mestre, 261001 (tasca 4, «la Boina Taronja») · La pastilla de la
 * boina, en lectura, porta al Calendari global en el mes que pinta
 * (/calendari?mes=AAAA-MM, barres/pastillaCalendari.js), no al filtre del
 * Mur, i el seu nom accessible diu l'hora, el dia i on porta, en l'ordre en
 * què es lligen. La data es llig amb el lector únic d'editorial.js: la còpia
 * local (diaDeLaTargeta) s'ha retirat.
 *
 * Base de recursos (T5, 261001) · imageUrl i avatarUrl es resolen amb
 * resolRecursPropi() abans del filtre: incrustat en un amfitrió, un
 * '/assets/…' (l'avatar de Pobles, el directori de perfils) penja de la
 * carpeta del paquet. Un valor ja resolt (Mercat, Mur, Agenda) passa intacte
 * i, sense base, tot és el valor de sempre (Llei del Píxel).
 *
 * P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció»,
 * aprovat pel Mestre el 261003) · La prop `portes` (PortesTargeta.jsx): com a
 * màxim dues portes. Amb portes no hi ha enllaç estirat (el peu, vegeu P6).
 * ESMENA 261003 22:34 (directrius 2234 i 2245 del Mestre) · La targeta amb
 * portes és la UniversalCard estàndard, no una variant compacta: boina
 * d'autoria, imatge, títol, subtítol i entradilla visibles, i les dues portes
 * al final del cos. La variant «vinyeta» (títol per a lector, reserva 1:1 i
 * el clic a la il·lustració, D3) s'ha retirat: només són interactius l'autor,
 * la data i les portes. Sense `portes`, el DOM de sempre, byte a byte
 * (UniversalCard.vinyeta.test.jsx).
 * W4-07 · L'autor amb una ruta de l'app passa per la frontera de les portes
 * (esRutaDeLaPorta), que no depén del protocol de la finestra: a l'app nativa
 * (capacitor://localhost) isSafeUrl el deixava sense enllaç. Una adreça
 * absoluta continua passant per isSafeUrl, com sempre.
 *
 * P6 · Onada 4, sisena passada (directriu 261003_2325 del Mestre, «la
 * regressió de l'UniversalCard») ·
 *  · PREU AL QUADRAT. `price` ja no pinta la píndola: va al quadrat de 128 px,
 *    el mateix de les dates (SquareBadge), com `squareBadge={{ type: 'price' }}`.
 *    Mana squareBadge, després el preu i després calendarBadge. Un preu llarg
 *    («1.250,00 €») baixa de lletra per trams (data-mida, midaDelPreu) i cap
 *    sencer al quadrat. La píndola .sp-card-price continua al detall
 *    (detailSectionMeta i la barra de PageFrame, .sp-card-price--en-linia).
 *  · PEU AMB PORTES. Les portes ja no amaguen el peu blau: la targeta amb
 *    portes és una pàgina de veres, amb boina dalt i peu baix, com al Mur.
 *    L'única variació és el cos: dues portes en lloc de l'enllaç de tota la
 *    targeta. Per això, amb portes, `mainHref` no fa cap overlay però continua
 *    sent la pàgina de Comentar i Compartir (useAccions), la mateixa de
 *    «Saber-ne més».
 */
import { Link } from '../../../app/contexts/RouterContext';
import { resolRecursPropi } from '../../../config/assetResolver.js';
import { isSafeAsset, isSafeUrl } from '../../universal/UniversalUtils';
import { llevaPuntFinal } from '../../universal/editorial.js';
import { EmoticonaBarra } from '../../universal/EmoticonaBarra.jsx';
import { usePastillaCalendari } from '../../universal/barres/pastillaCalendari.js';
import { emoticonaDeBarra } from '../../../utils/emoji.js';
import { ActionControl, IconButton, DateTimeControl } from '../atoms/controls.jsx';
import { PinIcon, TranslateIcon, CommentIcon, ShareIcon } from '../atoms/icones.jsx';
import { useAccions } from '../hooks/useAccions.js';
import { PortesTargeta, esRutaDeLaPorta, normalitzaPortes } from './PortesTargeta.jsx';

const TITOLS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

/* W4-07 · La ruta de l'autor: un camí de l'app ('/…') passa per la frontera
   de les portes, que no mira la finestra; una adreça absoluta, per isSafeUrl. */
const rutaDAutorSegura = (href) => {
  if (typeof href !== 'string' || !href) return null;
  if (href.startsWith('/')) return esRutaDeLaPorta(href) ? href : null;
  return isSafeUrl(href) ? href : null;
};

/* T51 (ordre del Mestre, 260928) · `centre` és l'espai central de la caputxa
   (EmoticonaBarra en lectura): només hi és amb una emoticona triada, i
   llavors la caputxa passa a la graella de tres columnes de la barra
   taronja. Sense, el DOM i el flex de sempre. */
function CardHeader({ autor, autorHref, centre, pin, dataHora, headerAction }) {
  return (
    <header className={centre ? 'sp-card-header sp-card-header--amb-emoticona' : 'sp-card-header'}>
      {autor && (autorHref ? (
        <Link className="sp-card-author-link" to={autorHref}>{autor}</Link>
      ) : (
        <span className="sp-card-author-block">{autor}</span>
      ))}
      {centre}
      {(pin || headerAction || dataHora) && (
        <div className="sp-card-meta">
          {pin}
          {headerAction}
          {dataHora}
        </div>
      )}
    </header>
  );
}

/**
 * P6 · El tram de lletra d'un preu dins del quadrat de 128 px (data-mida),
 * pels caràcters que es veuen: «15 €» es llig gran i «1.250,00 €» cap sencer.
 * Els límits es van mesurar al navegador amb Noto Sans 900 (components.css,
 * .sp-card-calendar-badge__dia[data-mida]); un valor més llarg encara parteix
 * línia dins del quadrat i no se n'ix.
 */
export function midaDelPreu(valor) {
  const caracters = Array.from(String(valor ?? '').trim()).length;
  if (caracters <= 3) return 'gran';
  if (caracters <= 5) return 'mitjana';
  if (caracters <= 7) return 'menuda';
  return 'minima';
}

function SquareBadge({ badge }) {
  const isCalendar = badge.dia || badge.mes || badge.any || badge.type === 'calendar';
  const isPrice = badge.type === 'price';
  const etiqueta = badge.label || (isCalendar
    ? [badge.dia, badge.mes, badge.any].filter(Boolean).join(' ')
    : isPrice ? `Preu: ${badge.value}` : 'Insígnia');

  const contingut = isCalendar ? (
    <>
      <span className="sp-card-calendar-badge__dia">{badge.dia}</span>
      <span className="sp-card-calendar-badge__mes">{badge.mes}</span>
      {badge.any && <span className="sp-card-calendar-badge__any">{badge.any}</span>}
    </>
  ) : isPrice ? (
    <span className="sp-card-calendar-badge__dia" data-oversized="true" data-mida={midaDelPreu(badge.value)}>{badge.value}</span>
  ) : badge.content;

  if (badge.onClick) {
    return (
      <button
        type="button"
        className="sp-card-calendar-badge"
        aria-label={etiqueta}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          badge.onClick();
        }}
      >
        {contingut}
      </button>
    );
  }

  return isCalendar ? (
    <time className="sp-card-calendar-badge" aria-label={etiqueta} dateTime={badge.dateTime}>
      {contingut}
    </time>
  ) : (
    <div className="sp-card-calendar-badge" aria-label={etiqueta}>{contingut}</div>
  );
}

function Etiqueta({ label }) {
  const text = typeof label === 'string' ? label : label.text;
  const classe = typeof label === 'string' ? 'sdp-badge-tag' : label.className || 'sdp-badge-tag';
  const href = typeof label === 'string' ? null : label.href;
  const segur = href && isSafeUrl(href) ? href : null;
  return (
    <li className={`sp-card-label ${classe}`}>
      {!segur ? text : segur.startsWith('http') ? (
        <a href={segur} target="_blank" rel="noopener noreferrer" className="sp-card-label">{text}</a>
      ) : (
        <Link to={segur} className="sp-card-label">{text}</Link>
      )}
    </li>
  );
}

function LlistaEtiquetes({ etiquetes }) {
  return (
    <ul className="sp-card-labels" aria-label="Categories">
      {etiquetes.map((label, index) => (
        <Etiqueta key={`${typeof label === 'string' ? label : label.text}-${index}`} label={label} />
      ))}
    </ul>
  );
}

/* `portes` (P5) · Les portes de la targeta de doble acció, al final del cos.
   Sense, res: el DOM de sempre.
   P6 · El preu va al quadrat (SquareBadge), mai a la píndola: un sol
   indicador, i mana squareBadge, després el preu i després la data. La classe
   has-price es conserva per a qui la mire. */
function CardBody({ imatge, imageAlt, calendarBadge, squareBadge, price, icon, title, TitleTag, subtitle, body, etiquetes, copyright, portes = null }) {
  const activeBadge = squareBadge || (price ? { type: 'price', value: price } : null) || calendarBadge;
  return (
    <>
      {imatge && (
        <div className="sp-card-media-container">
          <img className="sp-card-media" src={imatge} alt={imageAlt} loading="lazy" decoding="async" />
        </div>
      )}
      <div
        className={[
          'sp-card-body',
          price && 'has-price',
          activeBadge && 'has-calendar-badge',
          (price || activeBadge) && 'has-aside'
        ].filter(Boolean).join(' ')}
      >
        {activeBadge && <SquareBadge badge={activeBadge} />}
        {title && icon ? (
          <div className="sp-card-heading-with-icon">
            <span className="sp-card-title-icon">{icon}</span>
            <TitleTag className="sp-card-title">{title}</TitleTag>
          </div>
        ) : title ? (
          <TitleTag className="sp-card-title">{title}</TitleTag>
        ) : null}
        {subtitle && <h4 className="sp-card-subtitle">{subtitle}</h4>}
        {body && (typeof body === 'string'
          ? <p className="sp-card-text">{body}</p>
          : <div className="sp-card-text">{body}</div>)}
        {etiquetes.length > 0 && <LlistaEtiquetes etiquetes={etiquetes} />}
        {copyright && <p className="sp-card-copyright">{copyright}</p>}
        {portes}
      </div>
    </>
  );
}

function CardFooter({ accions, connectar }) {
  return (
    <footer className="sp-card-footer">
      {accions.length > 0 && <div className="sp-card-actions">{accions}</div>}
      {connectar}
    </footer>
  );
}

export function UniversalCard({
  variant = 'default',
  className,
  icon,
  /* T51 · El camp CRU d'emoticona del document (mai el model de vista de la
     llista, que porta la 🪶 per defecte): el centre de la caputxa, en lectura. */
  emoticona = '',
  title,
  headingLevel = 'h3',
  subtitle,
  body,
  location,
  time,
  date,
  dateTime,
  author,
  authorHref,
  avatarUrl,
  avatarAlt = '',
  imageUrl,
  imageAlt = '',
  price,
  labels = [],
  mainHref,
  onMainClick,
  /* T63.2 (doctrina del Mestre, 260928) · el descriptor tipat de l'element
     (objecteDe, objecteDePerfil…): sense onComment propi, Comentar obri el
     seu xat; una nota no en té i no es pinta (useAccions). Sense objecte, el
     xat de la 'pagina' del detall (mainHref), mai el de la llista; sense
     detall, el clic avisa que no hi ha xat. */
  objecte,
  copyright,
  calendarBadge = null,
  squareBadge = null,
  isAvis = false,
  hasFooter,
  showPin,
  showDateTime,
  showTranslate,
  showComment,
  showShare,
  showConnect,
  headerAction,
  onPin,
  onDateTime,
  onTranslate,
  onComment,
  onShare,
  onConnect,
  connectLabel = 'Connectar',
  telemetria, // { mode: 'previsualitzacio' }: com es compta el Connectar (useAccions)
  /* Correcció D5 (revisió de T50) · `actual`: la targeta és l'element triat
     d'una llista (la fitxa activa del Bloc de Notes o del Perfil). L'estat va
     on va el focus, a l'element principal (l'enllaç o el botó de tota la
     targeta), com a la fitxa compacta: aria-current="true". Sense element
     principal, a l'article. Sense la prop, el DOM de sempre. */
  actual = false,
  /* P5 · Com a màxim dues portes [{ id, verb, nom, desti, varietat }]
     (PortesTargeta.jsx), al final del cos de la targeta de sempre. */
  portes
}) {
  const safeMainHref = mainHref && isSafeUrl(mainHref) ? mainHref : null;
  const safeAuthorHref = rutaDAutorSegura(authorHref);
  const imatgeFont = resolRecursPropi(imageUrl);
  const avatarFont = resolRecursPropi(avatarUrl);
  const safeImageUrl = imatgeFont && isSafeAsset(imatgeFont) ? imatgeFont : null;
  const safeAvatarUrl = avatarFont && isSafeAsset(avatarFont) ? avatarFont : null;
  const TitleTag = TITOLS.has(headingLevel) ? headingLevel : 'h3';
  const etiquetes = Array.isArray(labels) ? labels.filter(Boolean) : [];
  const ambTitol = (verb) => (title ? `${verb} ${title}` : verb);

  const alCalendari = usePastillaCalendari({ time, date, dateTime });

  const {
    handleConnect,
    handleTranslate,
    handleComment,
    handleShare,
    traduirVisible,
    comentarVisible,
    compartirVisible,
    connectarVisible
  } = useAccions({
    title,
    mainHref: safeMainHref,
    objecte,
    onConnect,
    onTranslate,
    onComment,
    onShare,
    showConnect,
    showTranslate,
    showComment,
    showShare,
    hasFooter,
    telemetria: { ...telemetria, origen: 'targeta' }
  });

  /* Ordre del Mestre, 261001 (tasca 4) · Sense onDateTime propi, la pastilla
     porta al Calendari en el seu mes i ho diu al nom accessible. Un
     onDateTime propi (la previsualització que avisa) mana i conserva el nom
     de sempre; onDateTime={false}, un <time> sense clic. */
  const pastillaPropia = onDateTime === false || Boolean(onDateTime);
  const handleDateTime = onDateTime === false ? undefined : (onDateTime || alCalendari.onClick);
  const nomPastilla = pastillaPropia ? undefined : alCalendari.etiqueta;

  /* Visibilitat calculada sobre el que de veritat es pinta (correcció 3). */
  const teAutor = Boolean(author || safeAvatarUrl || location);
  const pinVisible = showPin ?? Boolean(onPin);
  const dataVisible = Boolean(time || date) && (showDateTime ?? true);

  const autor = teAutor && (
    <span className="sp-card-author">
      {safeAvatarUrl ? (
        <img alt={avatarAlt} className="sp-card-avatar" src={safeAvatarUrl} width="48" height="48" />
      ) : (
        <span className="sp-card-avatar sp-card-avatar--fallback">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        </span>
      )}
      {(author || location) && (
        <span className="sp-card-author-info">
          {author && <span className="sp-card-author-name">{author}</span>}
          {location && <span className="sp-card-author-location">{location}</span>}
        </span>
      )}
    </span>
  );

  const pin = pinVisible && (
    <ActionControl className="btn-icon-orange" label={ambTitol('Ancorar')} onClick={onPin}>
      <PinIcon className="icon" />
    </ActionControl>
  );

  const dataHora = dataVisible && (
    <DateTimeControl time={time} date={date} dateTime={dateTime} label={nomPastilla} onClick={handleDateTime} />
  );

  /* T51 · La targeta és sempre lectura: només l'emoticona triada, mai la ploma. */
  const centre = emoticonaDeBarra({ mode: 'lectura', icon: emoticona }).mostra === 'glif'
    && <EmoticonaBarra emoticona={emoticona} />;

  const accions = [
    traduirVisible && (
      <IconButton key="traduir" label={ambTitol('Traduir')} onClick={handleTranslate}>
        <TranslateIcon className="icon" />
      </IconButton>
    ),
    comentarVisible && (
      <IconButton key="comentar" label={ambTitol('Comentar')} onClick={handleComment}>
        <CommentIcon className="icon" />
      </IconButton>
    ),
    compartirVisible && (
      <IconButton key="compartir" label={ambTitol('Compartir')} onClick={handleShare}>
        <ShareIcon className="icon" />
      </IconButton>
    )
  ].filter(Boolean);

  /* «Connectar amb …» només té sentit amb Connectar: qualsevol altre verb
     («Obrir», «Veure detall», «Sol·licitar plaça») porta el títol darrere
     de dos punts. */
  const titolText = typeof title === 'string' ? title : '';
  const esConnectar = String(connectLabel).toLocaleLowerCase('ca') === 'connectar';
  const nomConnectar = !titolText ? connectLabel
    : esConnectar ? `${connectLabel} amb ${titolText}` : `${connectLabel}: ${titolText}`;

  const connectar = connectarVisible && (
    <ActionControl
      className="btn-connectar sp-card-connect"
      label={nomConnectar}
      onClick={handleConnect}
    >
      <span className="sp-card-connect-text">{connectLabel}</span>
      <span className="sp-card-connect-plus" aria-hidden="true">+</span>
    </ActionControl>
  );

  const peuVisible = hasFooter !== false && (accions.length > 0 || Boolean(connectar));

  const cardClasses = [
    'sp-card',
    isAvis && 'sp-card--avis',
    variant !== 'default' && `sp-card--${variant}`,
    className
  ].filter(Boolean).join(' ');

  /* P5 (PRD §5.1) · Amb portes, la targeta sencera no és cap enllaç: un
     tercer objectiu (l'overlay) faria car un toc fallat i el lector
     anunciaria un control que només es diu com el títol.
     P6 · `mainHref` sí que compta: és la pàgina de Comentar i Compartir del
     peu. onMainClick, en canvi, no fa res i en DEV ho avisa. */
  const portesNetes = normalitzaPortes(portes);
  const ambPortes = portesNetes.length > 0;
  if (ambPortes && onMainClick && import.meta.env.DEV) {
    console.warn('[UniversalCard] Amb `portes` no es pinta l’enllaç de tota la targeta: onMainClick no fa res (mainHref només és la pàgina del peu).');
  }

  const ariaActual = actual ? 'true' : undefined;
  const ambPrincipal = !ambPortes && Boolean(safeMainHref || onMainClick);

  return (
    <article className={cardClasses} aria-current={ambPrincipal ? undefined : ariaActual}>
      {(autor || centre || pin || headerAction || dataHora) && (
        <CardHeader autor={autor} autorHref={safeAuthorHref} centre={centre} pin={pin} dataHora={dataHora} headerAction={headerAction} />
      )}

      {ambPortes ? null : safeMainHref ? (
        <Link className="sp-card-link-overlay" to={safeMainHref} onClick={onMainClick} aria-label={title || 'Obrir detall'} aria-current={ariaActual} />
      ) : onMainClick ? (
        <button type="button" className="sp-card-link-overlay" onClick={onMainClick} aria-label={title || 'Obrir detall'} aria-current={ariaActual} />
      ) : null}

      <CardBody
        imatge={safeImageUrl}
        imageAlt={imageAlt}
        calendarBadge={calendarBadge}
        squareBadge={squareBadge}
        price={price}
        icon={icon}
        title={llevaPuntFinal(title)}
        TitleTag={TitleTag}
        subtitle={llevaPuntFinal(subtitle)}
        body={body}
        etiquetes={etiquetes}
        copyright={copyright}
        portes={ambPortes ? <PortesTargeta portes={portesNetes} /> : null}
      />

      {/* P6 (directriu 2325, confirmació 2) · El peu es pinta amb portes o sense. */}
      {peuVisible && <CardFooter accions={accions} connectar={connectar} />}
    </article>
  );
}
