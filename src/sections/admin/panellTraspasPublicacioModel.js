/**
 * panellTraspasPublicacioModel.js — Catàleg canònic i utilitats pures de co-publicació (Onada R32.22 · T2 HMR).
 */
import { ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, ENTITATS_SEED, entitatSeed } from '../../data/identitatsSeed.js';
import {
  PUBLICADOR_PER_DEFECTE,
  UUID_ACTOR_RE,
  UUID_SOC_DE_POBLE,
  normalitzaPublicadorRegistrat,
} from '../../components/universal/barres/publicadorsBarraTaronja.js';

export const UUID_RENTONAR = entitatSeed(ENTITAT_RENTONAR_SLUG)?.alies?.find((a) => UUID_ACTOR_RE.test(a))
  || 'b2c87505-53b1-4108-902f-2313e77b9968';

const CLAUS_SDP = new Set([
  UUID_SOC_DE_POBLE.toLowerCase(),
  ENTITAT_PILOT_SLUG.toLowerCase(),
  'soc-de-poble_official',
]);

export function esActorSdp(actorId) {
  return CLAUS_SDP.has(String(actorId ?? '').trim().toLowerCase());
}

export const RECURSOS_CATALEG_CANONICS = Object.freeze([
  Object.freeze({
    clau: 'pagina:receptes',
    recursTipus: 'pagina',
    recursId: 'receptes',
    etiqueta: 'Pàgina /page/receptes · Espai del Receptari Tradicional',
    creditsObra: 'Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» · CC BY-NC-SA 4.0',
  }),
  Object.freeze({
    clau: 'llibre_cataleg:que-dinem',
    recursTipus: 'llibre_cataleg',
    recursId: 'que-dinem',
    etiqueta: 'Llibre de catàleg · «Què dinem?» (Muro, 2016)',
    creditsObra: 'Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta» · CC BY-NC-SA 4.0 (pendent de registre al padró)',
  }),
  Object.freeze({
    clau: 'pagina:arbres-monumentals',
    recursTipus: 'pagina',
    recursId: 'arbres-monumentals',
    etiqueta: 'Pàgina /page/arbres-monumentals · Arbres Monumentals',
    creditsObra: 'Associació Cultural El Rentonar · Inventari arbori local',
  }),
  Object.freeze({
    clau: 'llibre_cataleg:la-torre-de-les-macanes',
    recursTipus: 'llibre_cataleg',
    recursId: 'la-torre-de-les-macanes',
    etiqueta: 'Llibre de catàleg · Arbres Monumentals de La Torre de les Maçanes',
    creditsObra: 'Associació Cultural El Rentonar · Inventari arbori de 2020',
  }),
  Object.freeze({
    clau: 'pagina:herbari',
    recursTipus: 'pagina',
    recursId: 'herbari',
    etiqueta: 'Pàgina /page/herbari · Herbari de La Torre (117 plantes)',
    creditsObra: 'Fons documental etnobotànic de La Torre de les Maçanes',
  }),
  Object.freeze({
    clau: 'llibre_cataleg:herbari',
    recursTipus: 'llibre_cataleg',
    recursId: 'herbari',
    etiqueta: 'Catàleg · Herbari escolar de La Torre de les Maçanes (117 plantes)',
    creditsObra: 'CEIP Cristòfol Colom · Herbari escolar de La Torre de les Maçanes',
  }),
  Object.freeze({
    clau: 'pagina:banc-de-llavors',
    recursTipus: 'pagina',
    recursId: 'banc-de-llavors',
    etiqueta: 'Pàgina /page/banc-de-llavors · Banc de Llavors Tradicionals',
    creditsObra: 'Catàlegs públics de varietats tradicionals valencianes',
  }),
  Object.freeze({
    clau: 'llibre_cataleg:banc-de-llavors',
    recursTipus: 'llibre_cataleg',
    recursId: 'banc-de-llavors',
    etiqueta: 'Catàleg conjunt · Banc de Llavors Tradicionals',
    creditsObra: 'Tres catàlegs públics de varietats tradicionals',
  }),
  Object.freeze({
    clau: 'llibre_cataleg:cataleg-valencia',
    recursTipus: 'llibre_cataleg',
    recursId: 'cataleg-valencia',
    etiqueta: 'Catàleg · Varietats Tradicionals d’Interés Agrari (València)',
    creditsObra: 'Generalitat Valenciana · Catàleg de varietats tradicionals',
  }),
  Object.freeze({
    clau: 'llibre_cataleg:atles-catalunya',
    recursTipus: 'llibre_cataleg',
    recursId: 'atles-catalunya',
    etiqueta: 'Catàleg · Atles de varietats locals (Catalunya)',
    creditsObra: 'Atles de varietats locals d’interés agrari de Catalunya',
  }),
  Object.freeze({
    clau: 'llibre_cataleg:avl-mallorca',
    recursTipus: 'llibre_cataleg',
    recursId: 'avl-mallorca',
    etiqueta: 'Catàleg · Varietats locals de les Illes Balears (Mallorca)',
    creditsObra: 'Associació de Varietats Locals de Mallorca',
  }),
]);

export const ACTORS_REGISTRATS_BASE = Object.freeze(
  ENTITATS_SEED.map((entitat) => {
    const uuid = entitat.alies?.find((a) => UUID_ACTOR_RE.test(a))
      || (UUID_ACTOR_RE.test(entitat.id) ? entitat.id : entitat.id);
    const esSdp = entitat.slug === ENTITAT_PILOT_SLUG;
    const href = entitat.slug === ENTITAT_PILOT_SLUG || entitat.slug === ENTITAT_RENTONAR_SLUG
      ? `/${entitat.slug}`
      : `/empresa/${entitat.slug}`;
    return normalitzaPublicadorRegistrat({
      actor_id: uuid,
      slug_ruta: href,
      nom: entitat.name,
      avatar_url: entitat.logo_url || (esSdp ? PUBLICADOR_PER_DEFECTE.avatarUrl : ''),
      poble_nom: entitat.town_name || 'La Torre de les Maçanes',
      rol_publicacio: esSdp ? 'principal' : 'copublicador',
    });
  }).filter(Boolean)
);

export function generaUuidOperacio() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function adaptaOrganitzacioRegistrada(org) {
  if (!org || typeof org !== 'object') return null;
  const direct = normalitzaPublicadorRegistrat({
    ...org,
    rol_publicacio: org.rol_publicacio ?? 'copublicador',
  });
  if (direct) return direct;

  const rawId = String(org.actor_id ?? org.id ?? '').trim();
  if (!UUID_ACTOR_RE.test(rawId)) return null;
  const uuid = rawId.toLowerCase();
  const nom = String(org.nom ?? org.name ?? '').trim();
  const avatarUrl = String(org.avatar_url ?? org.logo_url ?? org.avatarUrl ?? '').trim();
  const pobleNom = String(org.poble_nom ?? org.town_name ?? org.town ?? '').trim();
  return normalitzaPublicadorRegistrat({
    actor_id: uuid,
    slug_ruta: `/perfil/${uuid}?registre=organitzacio`,
    nom,
    avatar_url: avatarUrl,
    poble_nom: pobleNom,
    rol_publicacio: 'copublicador',
  });
}

export function missatgeDErrorCopublicacio(err, accio = 'desar el traspàs') {
  const codi = err?.code || err?.codi || '';
  if (codi === 'cal-segon-factor') {
    return {
      to: 'avis',
      titol: 'Cal confirmar el segon factor de seguretat (AAL2)',
      text: 'com a superadministrador, el servidor exigix una sessió amb segon factor verificat (AAL2) abans de modificar la titularitat de publicació. Confirma el segon factor a «El compte» (/compte) i torna a prémer el botó: es conservarà el mateix identificador d’operació.',
    };
  }
  return {
    to: 'error',
    titol: `No s’ha pogut ${accio}`,
    text: err?.message || 'El servidor ha rebutjat l’operació. Pots tornar-ho a provar amb el mateix identificador d’operació.',
  };
}

export function clauRecursValida(clau) {
  const text = String(clau || '').trim();
  return text.includes(':') ? text : 'pagina:receptes';
}
