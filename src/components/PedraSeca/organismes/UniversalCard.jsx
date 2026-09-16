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
 */
import { useNavigate, Link } from '../../../app/contexts/RouterContext';
import { isSafeAsset, isSafeUrl, isValidDate } from '../../universal/UniversalUtils';
import { showToast } from '../../universal/AvisadorEfimer';
import { ActionControl, IconButton, DateTimeControl } from '../atoms/controls.jsx';
import { PinIcon, TranslateIcon, CommentIcon, ShareIcon } from '../atoms/icones.jsx';

const TITOLS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
const dosXifres = (n) => String(n).padStart(2, '0');

/** Dia que filtra el Mur («AAAA-MM-DD»), sempre amb el calendari local. */
function diaDeLaTargeta(dateTime, date) {
  if (dateTime) return String(dateTime).split('T')[0];
  if (!date) return null;
  const text = String(date);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parts = text.split('/');
  if (parts.length === 3) {
    let [dd, mm, aa] = parts;
    if (aa.length === 2) aa = `20${aa}`;
    return isValidDate(dd, mm, aa) ? `${aa}-${dosXifres(mm)}-${dosXifres(dd)}` : null;
  }
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${dosXifres(d.getMonth() + 1)}-${dosXifres(d.getDate())}`;
}

/** URL absoluta del detall; si no n'hi ha, la de la pàgina. */
function urlPerCompartir(href) {
  if (!href) return window.location.href;
  try { return new URL(href, window.location.origin).href; } catch { return window.location.href; }
}

async function compartix(titol, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title: titol || document.title, url });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return; // ha tancat el menú: no és cap error
      // Qualsevol altra fallada: provem el porta-retalls.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Enllaç copiat al porta-retalls.');
  } catch {
    showToast(`No s'ha pogut copiar. Enllaç: ${url}`, 6000);
  }
}

function CardHeader({ autor, autorHref, pin, dataHora }) {
  return (
    <header className="sp-card-header">
      {autor && (autorHref ? (
        <Link className="sp-card-author-link" to={autorHref}>{autor}</Link>
      ) : (
        <span className="sp-card-author-block">{autor}</span>
      ))}
      {(pin || dataHora) && (
        <div className="sp-card-meta">
          {pin}
          {dataHora}
        </div>
      )}
    </header>
  );
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
    <span className="sp-card-calendar-badge__dia" data-oversized="true">{badge.value}</span>
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

function CardBody({ imatge, imageAlt, calendarBadge, squareBadge, price, icon, title, TitleTag, subtitle, body, etiquetes, copyright }) {
  const activeBadge = squareBadge || calendarBadge;
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
        {price && <p className="sp-card-price">{price}</p>}
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
        {etiquetes.length > 0 && (
          <ul className="sp-card-labels" aria-label="Categories">
            {etiquetes.map((label, index) => (
              <Etiqueta key={`${typeof label === 'string' ? label : label.text}-${index}`} label={label} />
            ))}
          </ul>
        )}
        {copyright && <p className="sp-card-copyright">{copyright}</p>}
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
  onPin,
  onDateTime,
  onTranslate,
  onComment,
  onShare,
  onConnect,
  connectLabel = 'Connectar'
}) {
  const navigate = useNavigate();

  const safeMainHref = mainHref && isSafeUrl(mainHref) ? mainHref : null;
  const safeAuthorHref = authorHref && isSafeUrl(authorHref) ? authorHref : null;
  const safeImageUrl = imageUrl && isSafeAsset(imageUrl) ? imageUrl : null;
  const safeAvatarUrl = avatarUrl && isSafeAsset(avatarUrl) ? avatarUrl : null;
  const TitleTag = TITOLS.has(headingLevel) ? headingLevel : 'h3';
  const etiquetes = Array.isArray(labels) ? labels.filter(Boolean) : [];
  const ambTitol = (verb) => (title ? `${verb} ${title}` : verb);

  const handleConnect = onConnect || (() => navigate('/connectar?item_id=' + encodeURIComponent(title || 'card')));
  const handleTranslate = onTranslate || (() => navigate('/traduccions'));
  const handleComment = onComment || (() => navigate('/xat'));
  const handleShare = onShare || (() => compartix(title, urlPerCompartir(safeMainHref)));
  const handleDateTime = onDateTime || ((e) => {
    e.preventDefault();
    e.stopPropagation();
    const dia = diaDeLaTargeta(dateTime, date);
    navigate(dia ? `/mur?date=${encodeURIComponent(dia)}` : '/mur');
  });

  /* Visibilitat calculada sobre el que de veritat es pinta (correcció 3). */
  const perDefecte = hasFooter === true;
  const teAutor = Boolean(author || safeAvatarUrl || location);
  const pinVisible = showPin ?? Boolean(onPin);
  const dataVisible = Boolean(time || date) && (showDateTime ?? true);
  const traduirVisible = showTranslate ?? (perDefecte || Boolean(onTranslate));
  const comentarVisible = showComment ?? (perDefecte || Boolean(onComment));
  const compartirVisible = showShare ?? (perDefecte || Boolean(onShare));
  const connectarVisible = showConnect ?? (perDefecte || Boolean(onConnect));

  const autor = teAutor && (
    <span className="sp-card-author">
      {safeAvatarUrl && (
        <img alt={avatarAlt} className="sp-card-avatar" src={safeAvatarUrl} width="48" height="48" />
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
    <DateTimeControl time={time} date={date} dateTime={dateTime} onClick={handleDateTime} />
  );

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

  const connectar = connectarVisible && (
    <ActionControl
      className="btn-connectar sp-card-connect"
      label={title ? `${connectLabel} amb ${title}` : connectLabel}
      onClick={handleConnect}
    >
      {connectLabel}
    </ActionControl>
  );

  const peuVisible = hasFooter !== false && (accions.length > 0 || Boolean(connectar));

  const cardClasses = [
    'sp-card',
    isAvis && 'sp-card--avis',
    variant !== 'default' && `sp-card--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <article className={cardClasses}>
      {(autor || pin || dataHora) && (
        <CardHeader autor={autor} autorHref={safeAuthorHref} pin={pin} dataHora={dataHora} />
      )}

      {safeMainHref ? (
        <Link className="sp-card-link-overlay" to={safeMainHref} onClick={onMainClick} aria-label={title || 'Obrir detall'} />
      ) : onMainClick ? (
        <button type="button" className="sp-card-link-overlay" onClick={onMainClick} aria-label={title || 'Obrir detall'} />
      ) : null}

      <CardBody
        imatge={safeImageUrl}
        imageAlt={imageAlt}
        calendarBadge={calendarBadge}
        squareBadge={squareBadge}
        price={price}
        icon={icon}
        title={title}
        TitleTag={TitleTag}
        subtitle={subtitle}
        body={body}
        etiquetes={etiquetes}
        copyright={copyright}
      />

      {peuVisible && <CardFooter accions={accions} connectar={connectar} />}
    </article>
  );
}
