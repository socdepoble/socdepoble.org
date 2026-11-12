/**
 * SquareBadge · el quadrat de 128 px (data, preu o contingut propi). Mòdul propi (AH-20, IDEA-77): PageFrame el
 * pinta dalt a la dreta de la capçalera i no pot arrossegar tota la UniversalCard a l'entrada del paquet (trinquet de pes).
 */
import { useNavigate } from '../../../app/contexts/RouterContext';
import { useUIActionsOpcional } from '../../../app/contexts/UIContext';
import { usePastillaCalendari } from '../../universal/barres/pastillaCalendari.js';

const RESERVES_AL_MAPA = Object.freeze({
  ca: 'AL MAPA',
  es: 'AL MAPA',
  en: 'ON MAP',
  gl: 'NO MAPA',
  eu: 'MAPAN'
});

export function formataCoordenadaCurta(lat, lng, idioma = 'ca') {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return '';
  const ns = la >= 0 ? (idioma === 'eu' ? 'I' : 'N') : (idioma === 'eu' ? 'H' : 'S');
  const ew = ln >= 0 ? 'E' : (idioma === 'en' ? 'W' : idioma === 'eu' ? 'M' : 'O');
  return `${Math.abs(la).toFixed(2)}°${ns} · ${Math.abs(ln).toFixed(2)}°${ew}`;
}

export function rutaAlMapaDeBadge(badge) {
  if (typeof badge?.href === 'string' && badge.href.trim()) return badge.href.trim();
  const la = Number(badge?.lat);
  const ln = Number(badge?.lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  const zoom = Number.isFinite(Number(badge?.zoom)) ? Number(badge.zoom) : 18;
  const params = new URLSearchParams({
    lat: la.toFixed(6),
    lng: ln.toFixed(6),
    zoom: String(zoom)
  });
  if (badge?.id != null && String(badge.id).trim() !== '') {
    params.set('id', String(badge.id).trim());
  }
  return `/mapa?${params.toString()}`;
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

const SEMAFORS_DEL_QUADRAT = new Set(['exit', 'avis', 'error']);

/* Revisió del 261111 (R19) · La guarda de useTraductorOpcional (l.7-9):
   null fora de l'app (sense UIProvider) o amb una prova que simula UIContext
   sense useUIActionsOpcional, perquè el mock llança en llegir l'exportació
   que li falta i això passa dins del try. Aleshores, la reserva: idioma 'ca'
   i els textos en valencià. La forma `return …` dins del try és la que
   rules-of-hooks accepta. Cap píxel canvia. */
function useAccionsUIOpcional() {
  try {
    return useUIActionsOpcional() ?? null;
  } catch {
    return null;
  }
}

export function SquareBadge({ badge }) {
  const ui = useAccionsUIOpcional();
  const idioma = ui?.language || 'ca';
  let navigate = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const isGeo = badge.type === 'geo' && Number.isFinite(Number(badge.lat)) && Number.isFinite(Number(badge.lng));
  const isCalendar = !isGeo && (badge.dia || badge.mes || badge.any || badge.type === 'calendar');
  const isPrice = !isGeo && badge.type === 'price';
  const { onClick: navegaAlCalendari } = usePastillaCalendari({ dateTime: badge?.dateTime });

  if (isGeo) {
    const coordsCurtes = badge.coordsLabel || formataCoordenadaCurta(badge.lat, badge.lng, idioma);
    const verb = badge.verb || (ui?.t ? ui.t('card.alMapa', RESERVES_AL_MAPA[idioma] || 'AL MAPA') : (RESERVES_AL_MAPA[idioma] || 'AL MAPA'));
    const href = rutaAlMapaDeBadge(badge);
    const nom = badge.nom || badge.title || '';
    const etiquetaGeo = badge.label || (nom
      ? (ui?.t
        ? ui.t('card.alMapaAria', 'Vore al mapa: {nom} ({coords})', { nom, coords: coordsCurtes })
        : `Vore al mapa: ${nom} (${coordsCurtes})`)
      : `${verb}: ${coordsCurtes}`);
    return (
      <button
        type="button"
        className="sp-card-calendar-badge"
        data-tipus="geo"
        aria-label={etiquetaGeo}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (badge.onClick) badge.onClick();
          else if (href && navigate) navigate(href);
        }}
      >
        <span className="sp-card-calendar-badge__geo-pin" aria-hidden="true">📍</span>
        <span className="sp-card-calendar-badge__geo-verb">{verb}</span>
        <span className="sp-card-calendar-badge__geo-coords">{coordsCurtes}</span>
      </button>
    );
  }

  const etiqueta = badge.label || (isCalendar
    ? [badge.dia, badge.mes, badge.any].filter(Boolean).join(' ')
    : isPrice ? `Preu: ${badge.value}` : 'Insígnia');
  const diaText = String(badge.dia ?? '').trim();
  const midaDia = isCalendar && Array.from(diaText).length > 2 ? midaDelPreu(diaText) : undefined;

  const contingut = isCalendar ? (
    <>
      <span className="sp-card-calendar-badge__dia" data-mida={midaDia}>{badge.dia}</span>
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

  if (isCalendar) {
    return (
      <time
        className="sp-card-calendar-badge"
        aria-label={etiqueta}
        dateTime={badge.dateTime}
        role={navegaAlCalendari ? 'button' : undefined}
        tabIndex={navegaAlCalendari ? 0 : undefined}
        onClick={navegaAlCalendari}
        onKeyDown={navegaAlCalendari ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navegaAlCalendari(event);
          }
        } : undefined}
      >
        {contingut}
      </time>
    );
  }
  /* Revisió del 261007 (M2-08) · Un quadrat personalitzat (badge.content)
     amb `label` és una imatge amb nom (role="img"): un aria-label en un <div>
     sense rol no el llig cap lector. Un de `decoratiu` (insigniaEmojiXL sense
     label: la targeta viva, que ja diu el títol) no té nom i s'amaga. La
     resta, com sempre. Cap píxel canvia.
     IDEA-40 (decisió del Mestre, 261028, pla 261028_1526) · Un quadrat
     personalitzat pot portar el to del semàfor de la targeta (`semafor`:
     'exit', 'avis' o 'error'), com a data-semafor: el pinta el full de qui
     el demana (modules.css § CONSOLA), sense cap :has(). Sense, el DOM de sempre. */
  const personalitzat = !isPrice;
  const semafor = personalitzat && SEMAFORS_DEL_QUADRAT.has(badge.semafor) ? badge.semafor : undefined;
  if (personalitzat && badge.decoratiu) {
    return <div className="sp-card-calendar-badge" aria-hidden="true" data-semafor={semafor}>{contingut}</div>;
  }
  return (
    <div className="sp-card-calendar-badge" role={personalitzat && badge.label ? 'img' : undefined} aria-label={etiqueta} data-semafor={semafor}>{contingut}</div>
  );
}
