/**
 * taxonomiaGeografica.js — IDEA-360 (v1.2.26 · Taxonomia Geogràfica en text pla
 * clicable centrat de 4 nivells + pàgines de comarca i paratges).
 *
 * Nivells:
 *   1. Xarxa de Pobles → /pobles
 *   2. Demarcació (Comarques d'Alacant / València / Castelló) → /pobles?provincia=<id>
 *   3. Comarca (ex. L'Alacantí, El Comtat, L'Alcoià) → /comarca/<slug>
 *   4. Poble (ex. La Torre de les Maçanes, Xixona) → /pobles/<slug>
 *   5. Paratge / muntanya / lloc singular → pàgina pròpia si en té, o /mapa?paratge=<slug>
 */
import { DEMARCACIONS, comarcaDelPoble, provinciaDelPoble, rutaTerritorial } from '../../sections/pobles/territoriDelPoble.js';
import { slugDelPoble } from '../../sections/pobles/nomsDelPoble.js';

export const RUTA_XARXA_DE_POBLES = '/pobles';

export function rutaDeComarca(nomOSlug) {
  const slug = slugDelPoble(nomOSlug);
  return slug ? `/comarca/${encodeURIComponent(slug)}` : null;
}

export function rutaDeParatge(paratge) {
  if (!paratge) return null;
  if (typeof paratge === 'object') {
    if (typeof paratge.href === 'string' && paratge.href.startsWith('/')) return paratge.href;
    const nom = typeof paratge.nom === 'string' ? paratge.nom.trim() : '';
    const slug = slugDelPoble(paratge.slug || nom);
    return slug ? `/mapa?paratge=${encodeURIComponent(slug)}${nom ? `&lloc=${encodeURIComponent(nom)}` : ''}` : null;
  }
  const nom = String(paratge).trim();
  const slug = slugDelPoble(nom);
  return slug ? `/mapa?paratge=${encodeURIComponent(slug)}&lloc=${encodeURIComponent(nom)}` : null;
}

function trobaDemarcacio(valor) {
  const clau = slugDelPoble(valor);
  if (!clau) return null;
  return DEMARCACIONS.find((d) =>
    d.id === clau
    || slugDelPoble(d.nom) === clau
    || slugDelPoble(d.etiqueta) === clau
  ) || null;
}

function trobaPoble(valor, towns = []) {
  const clau = slugDelPoble(valor);
  if (!clau || !Array.isArray(towns)) return null;
  return towns.find((t) =>
    t && (
      slugDelPoble(t.id) === clau
      || slugDelPoble(t.slug) === clau
      || slugDelPoble(t.title) === clau
      || slugDelPoble(t.name) === clau
    )
  ) || null;
}

/**
 * Resol una comarca per slug sobre la llista de pobles del sistema (`towns`).
 * Torna `{ slug, nom, demarcacio, pobles }` o `null` si no existix cap coincidència.
 */
export function resolComarcaPerSlug(slugCru, towns = []) {
  const slug = slugDelPoble(slugCru);
  if (!slug || !Array.isArray(towns)) return null;
  const pobles = towns
    .filter((p) => p && comarcaDelPoble(p) === slug)
    .sort((a, b) => String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''), 'ca'));
  if (!pobles.length) return null;
  const nom = pobles[0].comarca;
  const provId = provinciaDelPoble(pobles[0]);
  const demarcacio = DEMARCACIONS.find((d) => d.id === provId) || null;
  return { slug, nom, demarcacio, pobles };
}

/**
 * Llista tots els elements territorials clicables d'un element (publicació, acte,
 * producte, pàgina o overlay `C26-3`), sense duplicats i en ordre jeràrquic:
 * Xarxa → Demarcació → Comarques → Pobles → Paratges.
 */
export function elementsTerritorialsDe(item, towns = [], overlayGeografia = null) {
  const geo = overlayGeografia && typeof overlayGeografia === 'object' ? overlayGeografia : item?.geografia || null;
  const entrades = [];
  const vistos = new Set();
  const afig = (clau, text, href, nivell) => {
    const nom = typeof text === 'string' ? text.trim() : '';
    if (!nom || !href) return;
    const id = `${nivell}:${slugDelPoble(clau || nom)}`;
    if (vistos.has(id)) return;
    vistos.add(id);
    entrades.push({ id, text: nom, href, nivell });
  };

  if (geo) {
    for (const x of geo.xarxa || []) afig(x, x, RUTA_XARXA_DE_POBLES, 'xarxa');
    for (const d of geo.demarcacions || []) {
      const dem = trobaDemarcacio(d);
      afig(dem?.id || d, dem?.etiqueta || d, dem ? rutaTerritorial(dem.id) : RUTA_XARXA_DE_POBLES, 'demarcacio');
    }
    for (const c of geo.comarques || []) {
      const href = rutaDeComarca(c);
      if (href) afig(c, c, href, 'comarca');
    }
    for (const p of geo.pobles || []) {
      const fitxa = trobaPoble(p, towns);
      const slug = fitxa?.id || fitxa?.slug || slugDelPoble(p);
      const nom = fitxa?.title || fitxa?.name || p;
      if (slug) afig(slug, nom, `/pobles/${encodeURIComponent(slug)}`, 'poble');
    }
    for (const par of geo.paratges || []) {
      const nom = typeof par === 'object' ? par.nom : par;
      const href = rutaDeParatge(par);
      if (href) afig(nom, nom, href, 'paratge');
    }
    if (entrades.length > 0) return entrades;
  }

  if (!item || typeof item !== 'object') return [];

  const nomsPobles = [];
  if (Array.isArray(item.pobles_esmentats)) nomsPobles.push(...item.pobles_esmentats);
  if (Array.isArray(item.pobles)) nomsPobles.push(...item.pobles);
  for (const camp of [item.poble_id, item.town_name, item.population]) {
    if (typeof camp === 'string' && camp.trim()) nomsPobles.push(camp.trim());
  }

  const nomsComarques = [];
  if (Array.isArray(item.comarques)) nomsComarques.push(...item.comarques);
  if (typeof item.comarca === 'string' && item.comarca.trim()) nomsComarques.push(item.comarca.trim());

  const dem = trobaDemarcacio(item.provincia || item.demarcacio);
  const poblesResolts = [];
  for (const candidat of nomsPobles) {
    const fitxa = trobaPoble(candidat, towns);
    if (fitxa) {
      poblesResolts.push(fitxa);
      if (fitxa.comarca && nomsComarques.length === 0) nomsComarques.push(fitxa.comarca);
    } else if (typeof candidat === 'string' && candidat.trim() && !/^[0-9a-f-]{32,}$/i.test(candidat.trim())) {
      poblesResolts.push({ id: slugDelPoble(candidat), title: candidat.trim(), comarca: null, provincia: null });
    }
  }

  const teTerritori = Boolean(dem || nomsComarques.length > 0 || poblesResolts.length > 0 || (Array.isArray(item.paratges) && item.paratges.length > 0));
  if (!teTerritori) return [];

  const demResolta = dem || (poblesResolts[0]?.provincia ? trobaDemarcacio(poblesResolts[0].provincia) : null);
  if (demResolta) afig(demResolta.id, demResolta.etiqueta, rutaTerritorial(demResolta.id), 'demarcacio');
  for (const c of nomsComarques) {
    const href = rutaDeComarca(c);
    if (href) afig(c, c, href, 'comarca');
  }
  for (const fitxa of poblesResolts) {
    const slug = fitxa.id || fitxa.slug || slugDelPoble(fitxa.title || fitxa.name);
    const nom = fitxa.title || fitxa.name;
    if (slug && nom) afig(slug, nom, `/pobles/${encodeURIComponent(slug)}`, 'poble');
  }
  for (const par of Array.isArray(item.paratges) ? item.paratges : []) {
    const nom = typeof par === 'object' ? par.nom : par;
    const href = rutaDeParatge(par);
    if (href) afig(nom, nom, href, 'paratge');
  }
  return entrades;
}
