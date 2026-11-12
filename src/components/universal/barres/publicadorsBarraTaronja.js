import { PUBLICADOR_SDP, tipusDeRutaAcreditada } from '../../../data/copublicacio.js';
import {
  AGENTS_IA_SEED,
  ENTITAT_PILOT_SLUG,
  ENTITATS_SEED,
  PERSONA_PILOT,
  entitatSeed
} from '../../../data/identitatsSeed.js';
import { rutaDAutorSegura } from '../UniversalUtils.js';

/**
 * Onada R19 · Llei de la Barra Taronja i Co-Publicació Multi-Entitat Registrada.
 *
 * INVARIANT INNEGOCIABLE:
 * 1. Cap cadena de text lliure ni cap DTO arbitrari amb nom i ruta d'aspecte intern
 *    pot superar la guarda si no prové d'una lectura autoritativa del port `copublicacio`
 *    (compte amb `actor_id` UUID verificat i ruta de registre exacta)
 *    o d'una identitat canònica declarada al padró (`identitatsSeed.js`).
 * 2. En producció, la BarraTaronja es nodrix de `lligPublicadorsRegistrats` (via
 *    `usePublicadorsBarraRecurs` / `projectaLecturaCopublicacio`) i conserva la
 *    reserva editorial mentre el node no oferisca la capacitat.
 */

export const UUID_ACTOR_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ACTORS_ACREDITATS = new WeakSet();

const ENTITAT_OFICIAL = entitatSeed(ENTITAT_PILOT_SLUG);
export const UUID_SOC_DE_POBLE = ENTITAT_OFICIAL?.alies?.find((a) => UUID_ACTOR_RE.test(a))
  || 'a240e870-4aef-4d92-b138-e8b4e2f2123a';

export const PUBLICADOR_PER_DEFECTE = Object.freeze({
  id: UUID_SOC_DE_POBLE,
  actorId: UUID_SOC_DE_POBLE,
  name: ENTITAT_OFICIAL?.name || 'Sóc de Poble',
  href: '/socdepoble',
  avatarUrl: PUBLICADOR_SDP.avatar_url,
  town: ENTITAT_OFICIAL?.town_name || 'La Torre de les Maçanes',
  rol: 'principal'
});
ACTORS_ACREDITATS.add(PUBLICADOR_PER_DEFECTE);

function rutesCanoniquesDePadro(identitat, tipus) {
  if (!identitat) return new Set();
  const rutes = new Set();
  const slug = String(identitat.slug || '').trim().toLowerCase();
  const id = String(identitat.id || '').trim().toLowerCase();
  if (tipus === 'entitat') {
    if (slug) {
      rutes.add(`/empresa/${slug}`);
      if (slug === 'socdepoble' || slug === 'rentonar') rutes.add(`/${slug}`);
    }
    if (UUID_ACTOR_RE.test(id)) rutes.add(`/perfil/${id}`);
    for (const alies of identitat.alies || []) {
      const net = String(alies || '').trim().toLowerCase();
      if (UUID_ACTOR_RE.test(net)) rutes.add(`/perfil/${net}`);
    }
  } else if (tipus === 'persona') {
    if (slug) {
      rutes.add(`/${slug}`);
      rutes.add(`/gent/${slug}`);
    }
    if (UUID_ACTOR_RE.test(id)) rutes.add(`/perfil/${id}`);
    for (const alies of identitat.alies || []) {
      const net = String(alies || '').trim().toLowerCase();
      if (UUID_ACTOR_RE.test(net)) rutes.add(`/perfil/${net}`);
      else if (net) rutes.add(`/gent/${net}`);
    }
  } else if (tipus === 'agent') {
    rutes.add('/iaia');
    if (UUID_ACTOR_RE.test(id)) rutes.add(`/perfil/${id}`);
  }
  return rutes;
}

function resolIdentitatDelPadro(actorId) {
  const clau = String(actorId ?? '').trim();
  if (!clau) return null;
  const entitat = ENTITATS_SEED.find(
    (e) => e.id === clau || e.slug === clau || e.alies?.some((a) => String(a).toLowerCase() === clau.toLowerCase())
  );
  if (entitat) {
    const uuid = entitat.alies?.find((a) => UUID_ACTOR_RE.test(a)) || (UUID_ACTOR_RE.test(entitat.id) ? entitat.id : entitat.id);
    return {
      actorId: String(uuid).toLowerCase(),
      nomCanonic: entitat.name,
      avatarCanonic: entitat.logo_url || '',
      pobleCanonic: entitat.town_name || '',
      rutesPermeses: rutesCanoniquesDePadro(entitat, 'entitat'),
      rutaPerDefecte: entitat.slug === 'socdepoble' || entitat.slug === 'rentonar' ? `/${entitat.slug}` : `/empresa/${entitat.slug}`
    };
  }
  if (PERSONA_PILOT.alies.some((a) => String(a).toLowerCase() === clau.toLowerCase())) {
    return {
      actorId: String(PERSONA_PILOT.id).toLowerCase(),
      nomCanonic: PERSONA_PILOT.nom,
      avatarCanonic: PERSONA_PILOT.avatar_url || '',
      pobleCanonic: PERSONA_PILOT.poble || '',
      rutesPermeses: rutesCanoniquesDePadro(PERSONA_PILOT, 'persona'),
      rutaPerDefecte: `/${PERSONA_PILOT.slug}`
    };
  }
  const agent = AGENTS_IA_SEED.find((a) => String(a.id).toLowerCase() === clau.toLowerCase() || a.slug === clau);
  if (agent) {
    return {
      actorId: String(agent.id).toLowerCase(),
      nomCanonic: agent.name,
      avatarCanonic: agent.avatar_url || '',
      pobleCanonic: agent.town_name || '',
      rutesPermeses: rutesCanoniquesDePadro(agent, 'agent'),
      rutaPerDefecte: '/iaia'
    };
  }
  return null;
}

/**
 * Valida que la ruta apunte estrictament a una fitxa interna segura i neta.
 */
export function esRutaDActorRegistrat(href) {
  const segura = rutaDAutorSegura(href);
  if (!segura || /[?#]/.test(segura)) return '';
  const cami = segura.replace(/\/+$/, '') || '/';
  return /^\/(?:(?:empresa|gent|perfil)\/[a-z0-9][a-z0-9._-]*|socdepoble|rentonar|javillinares|iaia)$/i.test(cami)
    ? cami
    : '';
}

/**
 * Normalitza un candidat a publicador registrat només si:
 * a) ja ha sigut segellat per `projectaLecturaCopublicacio`, o
 * b) porta un UUID, una ruta de registre exacta i el rol del DTO del port, o
 * c) correspon a una identitat canònica declarada a `identitatsSeed.js` (sense suplantar el nom).
 * Qualsevol string solt o DTO arbitrari no acreditat es rebutja amb `null`.
 */
export function normalitzaPublicadorRegistrat(candidat) {
  if (!candidat || typeof candidat !== 'object' || Array.isArray(candidat)) return null;
  if (ACTORS_ACREDITATS.has(candidat)) return candidat;
  if (
    candidat.registrat === false
    || candidat.esRegistrat === false
    || candidat.compteRegistrat === false
    || candidat.unregistered === true
  ) {
    return null;
  }

  const actorIdCru = String(candidat.actor_id ?? candidat.actorId ?? candidat.id ?? '').trim();
  const nomCru = String(candidat.nom ?? candidat.name ?? '').trim();
  const hrefOriginal = candidat.slug_ruta ?? candidat.slugRuta ?? candidat.href ?? '';
  const uuid = actorIdCru.toLowerCase();
  const rolDto = candidat.rol_publicacio ?? candidat.rol;
  const tipusRegistre = tipusDeRutaAcreditada(hrefOriginal, uuid);
  const registreExplicit = String(candidat.registre ?? candidat.tipus_actor ?? '').trim();
  if (registreExplicit && registreExplicit !== tipusRegistre) return null;
  const hrefAcreditat = actorIdCru === uuid
    && (rolDto === 'principal' || rolDto === 'copublicador')
    && tipusRegistre
    ? rutaDAutorSegura(hrefOriginal) : null;
  if (typeof hrefOriginal === 'string' && /[?#]/.test(hrefOriginal) && !hrefAcreditat) return null;
  const hrefCru = hrefAcreditat || esRutaDActorRegistrat(hrefOriginal);
  const rolBrut = String(candidat.rol_publicacio ?? candidat.rol ?? '').trim().toLowerCase();

  if (!actorIdCru) return null;

  /* Camí 1 · Identitat canònica del padró pilot (`identitatsSeed.js`).
     El nom i la ruta mai es deixen falsificar per un DTO extern arbitrari. */
  const delPadro = hrefAcreditat ? null : resolIdentitatDelPadro(actorIdCru);
  if (delPadro) {
    if (hrefCru && !delPadro.rutesPermeses.has(hrefCru.toLowerCase())) return null;
    if (nomCru && nomCru.toLowerCase() !== delPadro.nomCanonic.toLowerCase()) return null;
    const rol = rolBrut === 'principal' ? 'principal' : 'copublicador';
    const segellat = Object.freeze({
      id: delPadro.actorId,
      actorId: delPadro.actorId,
      name: delPadro.nomCanonic,
      href: hrefCru || delPadro.rutaPerDefecte,
      avatarUrl: String(candidat.avatar_url ?? candidat.avatarUrl ?? delPadro.avatarCanonic ?? '').trim(),
      town: String(candidat.poble_nom ?? candidat.pobleNom ?? candidat.town ?? delPadro.pobleCanonic ?? '').trim(),
      rol
    });
    ACTORS_ACREDITATS.add(segellat);
    return segellat;
  }

  /* El DTO del port conserva el marcador de registre. Els espècimens antics
     encara poden passar un camí pla que coincidix amb el seu UUID. */
  if (!UUID_ACTOR_RE.test(actorIdCru)) return null;
  if (!hrefAcreditat && hrefCru.toLowerCase() !== `/perfil/${uuid}`) return null;
  if (rolBrut !== 'principal' && rolBrut !== 'copublicador') return null;
  if (!nomCru || nomCru.length > 240) return null;

  const avatarUrl = String(candidat.avatar_url ?? candidat.avatarUrl ?? '').trim();
  const town = String(candidat.poble_nom ?? candidat.pobleNom ?? candidat.town ?? '').trim();
  if (avatarUrl.length > 4096 || town.length > 240) return null;

  const segellat = Object.freeze({
    id: uuid,
    actorId: uuid,
    name: nomCru,
    href: hrefAcreditat || `/perfil/${uuid}`,
    avatarUrl,
    town,
    rol: rolBrut
  });
  ACTORS_ACREDITATS.add(segellat);
  return segellat;
}

/**
 * Projecta la resposta autoritativa de `lligPublicadorsRegistrats` / `traspassaPublicacio`
 * cap a la llista de publicadors de la BarraTaronja.
 * Una llista buida o invàlida retorna `null` perquè la pàgina conserve la reserva editorial.
 */
export function projectaLecturaCopublicacio(lectura) {
  if (!lectura || typeof lectura !== 'object') return null;
  if (!Array.isArray(lectura.publicadorsRegistrats) || lectura.publicadorsRegistrats.length === 0) {
    return null;
  }
  const actors = [];
  const vistos = new Set();
  for (let i = 0; i < lectura.publicadorsRegistrats.length; i += 1) {
    const brut = lectura.publicadorsRegistrats[i];
    const rolEsperat = i === 0 ? 'principal' : 'copublicador';
    if (!brut || typeof brut !== 'object' || brut.rol_publicacio !== rolEsperat
      || !tipusDeRutaAcreditada(brut.slug_ruta, brut.actor_id)) return null;
    const net = normalitzaPublicadorRegistrat(brut);
    if (!net || vistos.has(net.actorId)) return null;
    vistos.add(net.actorId);
    actors.push(net);
  }
  return actors.length > 0 ? Object.freeze(actors) : null;
}

/**
 * Resol la llista ordenada i deduplicada de publicadors registrats per a la
 * BarraTaronja:
 * - Si `publicadorsRegistrats` no és un Array (`null` o `undefined`), retorna `null`
 *   perquè BarraTaronja mantinga intacte el camí clàssic d'un sol autor.
 * - Si és un Array però cap candidat supera la guarda d'acreditació del padró,
 *   retorna deterministament `[PUBLICADOR_PER_DEFECTE]` (`Sóc de Poble`).
 */
export function resolPublicadorsRegistrats(publicadorsRegistrats) {
  if (!Array.isArray(publicadorsRegistrats)) return null;

  const vistosId = new Set();
  const vistosHref = new Set();
  const valids = [];

  for (const item of publicadorsRegistrats) {
    const net = normalitzaPublicadorRegistrat(item);
    if (!net) continue;
    const clauId = net.actorId.toLowerCase();
    const clauHref = net.href.toLowerCase();
    if (vistosId.has(clauId) || vistosHref.has(clauHref)) continue;
    vistosId.add(clauId);
    vistosHref.add(clauHref);
    valids.push(net);
  }

  if (valids.length === 0) {
    return Object.freeze([PUBLICADOR_PER_DEFECTE]);
  }

  const principals = valids.filter((actor) => actor.rol === 'principal');
  const copublicadors = valids.filter((actor) => actor.rol !== 'principal');
  return Object.freeze([...principals, ...copublicadors]);
}

/**
 * Retorna els pobles únics (preservant l'ordre d'aparició) dels publicadors registrats.
 */
export function resumPoblesPublicadors(publicadors, pobleReserva = '') {
  if (!Array.isArray(publicadors) || publicadors.length === 0) {
    return pobleReserva ? [String(pobleReserva).trim()].filter(Boolean) : [];
  }
  const vistos = new Set();
  const pobles = [];
  for (const actor of publicadors) {
    const poble = String(actor?.town ?? '').trim();
    if (!poble) continue;
    const clau = poble.toLowerCase();
    if (vistos.has(clau)) continue;
    vistos.add(clau);
    pobles.push(poble);
  }
  if (pobles.length === 0 && pobleReserva) {
    const net = String(pobleReserva).trim();
    if (net) pobles.push(net);
  }
  return pobles;
}

const PARAULES_GENERIQUES_INICIALS = new Set([
  'associacio', 'associació', 'ajuntament', 'cooperativa', 'col·lectiu', 'collectiu',
  'fundacio', 'fundació', 'cultural', 'gastronomica', 'gastronòmica', 'agraria', 'agrària',
  'de', 'del', 'dels', 'la', 'el', 'les', 'els', 'i'
]);

/**
 * Extreu 1 o 2 lletres nítides per a una cel·la d'avatar compost quan l'entitat
 * registrada encara no té logotip pujat.
 */
export function inicialsDePublicador(nom = '') {
  const net = String(nom || '').trim();
  if (!net) return 'SP';
  const paraules = net
    .split(/[\s·—–-]+/)
    .map((p) => p.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+|[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+$/g, ''))
    .filter(Boolean);
  const significatives = paraules.filter((p) => !PARAULES_GENERIQUES_INICIALS.has(p.toLowerCase()));
  const font = significatives.length > 0 ? significatives : paraules;
  if (font.length >= 2) {
    return `${font[0][0]}${font[1][0]}`.toUpperCase();
  }
  if (font.length === 1 && font[0].length >= 2) {
    return font[0].slice(0, 2).toUpperCase();
  }
  return (font[0]?.[0] || 'S').toUpperCase();
}
