/**
 * estatFormarPart.js — En quin punt està la persona respecte de FORMAR PART
 * d'una entitat (membre, soci o treballador): IDEA-14 (Directiva del Mestre,
 * 261024; auditoria Gemini G-04). Lògica pura.
 *
 * Formar part no és seguir ni connectar al MAS: és una pertinença formal que
 * dona qui administra l'entitat, després de parlar-ho. Decisió del Mestre
 * (261024): cap taula de sol·licituds nova; la petició és un missatge
 * estructurat al xat privat de l'entitat (BlocFormarPart.jsx).
 *
 * Prioritat: sense-sessio > administres > membre > comprovant > sense-xat >
 * pot-demanar. La pertinença és la d'IdentitatContext (memberships); el xat,
 * el contacte de confiança que ha resolt la vista (perfilPerConnectar), mai
 * l'URL.
 */
import { esRolQueMana } from '../../../components/universal/identitat/rols.js';

export const ESTATS_FORMAR_PART = Object.freeze([
  'sense-sessio', 'administres', 'membre', 'comprovant', 'sense-xat', 'pot-demanar'
]);

export function estatDeFormarPart({ teSessio = false, membership = null, carregant = false, contacte = null } = {}) {
  if (!teSessio) return 'sense-sessio';
  if (membership && esRolQueMana(membership.role)) return 'administres';
  if (membership) return 'membre';
  if (carregant) return 'comprovant';
  if (!contacte) return 'sense-xat';
  return 'pot-demanar';
}

/** La pertinença per id o per slug (l'enllaç pot portar qualsevol dels dos), com useAdministrarOrganitzacio. */
export function pertinencaDe(memberships, orgId) {
  const id = String(orgId ?? '').trim();
  if (!id || !Array.isArray(memberships)) return null;
  return memberships.find((m) => String(m?.id) === id || (m?.slug && String(m.slug) === id)) || null;
}

/** El límit de l'afegit de la sol·licitud: el missatge sencer ha de cabre al xat. */
export const LIMIT_AFEGIT = 500;

/**
 * El text de la sol·licitud que arriba al xat: la línia fixa (ja traduïda,
 * amb el nom de confiança) i, si n'hi ha, el que la persona hi afig, separat
 * per una línia en blanc. El xat del client no porta metadades (XatContext
 * les envia buides i xat_envia les ignora des de 2610081543): l'estructura
 * és el text.
 */
export function textDeLaSollicitud(capcalera, afegit = '') {
  const cap = String(capcalera ?? '').trim();
  const mes = String(afegit ?? '').trim().slice(0, LIMIT_AFEGIT);
  return mes ? `${cap}\n\n${mes}` : cap;
}
