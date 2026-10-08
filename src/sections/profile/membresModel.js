/* ═══════════════════════════════════════════════════════════════════
   Ordre del Mestre (261008, grup C) · ELS MEMBRES D'UNA ORGANITZACIÓ (model)

   Pur: sense React ni xarxa. GestioMembres en pinta el resultat. Les regles
   de veres les fan complir el servidor (2610081402) i localPerfils; ací
   només es decidix QUÈ s'oferix, perquè la interfície no prometa res que el
   contracte rebutjaria (contracte.js, capacitat 'membresOrganitzacio'):
     · la propietària no es canvia ni es lleva (005);
     · ningú canvia el seu propi rol (004): eixir és l'ajust «Eixir»;
     · només la propietària nomena, degrada o lleva administradores (006);
     · una organització membre sempre és 'member' i no hereta cap permís.
   ═══════════════════════════════════════════════════════════════════ */
import { esRolQueMana } from '../../components/universal/identitat/rols.js';

/** Les lletres mínimes per a cercar candidats (persones o organitzacions). */
export const MINIM_CERCA = 2;

/** Com es diu cada tipus de membre a la taula i al selector. */
export const ETIQUETES_TIPUS = Object.freeze({
  persona: 'Persona',
  organitzacio: 'Organització',
});

const ORDRE_ROL = Object.freeze({ owner: 0, admin: 1, member: 2 });
const ORDRE_TIPUS = Object.freeze({ persona: 0, organitzacio: 1 });

/** La clau estable d'un membre o d'un candidat: el tipus i l'id. */
export const clauDeMembre = (membre) => `${membre?.tipus ?? ''}:${String(membre?.id ?? '')}`;

/* Sense accents ni majúscules, com la cerca del servidor (2609291210). */
const plega = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/**
 * La propietària primer, després les administradores i els membres; dins de
 * cada rol, les persones abans que les organitzacions, i per nom. Torna una
 * llista nova (l'entrada no es toca) i descarta els forats.
 */
export function ordenaMembres(membres = []) {
  const llista = Array.isArray(membres) ? membres.filter(Boolean) : [];
  return [...llista].sort((a, b) => (ORDRE_ROL[a.rol] ?? 3) - (ORDRE_ROL[b.rol] ?? 3)
    || (ORDRE_TIPUS[a.tipus] ?? 2) - (ORDRE_TIPUS[b.tipus] ?? 2)
    || String(a.nom ?? '').localeCompare(String(b.nom ?? ''), 'ca')
    || String(a.id ?? '').localeCompare(String(b.id ?? '')));
}

const CAP_ACCIO = Object.freeze({ rol: null, lleva: false });

/**
 * Què pot fer sobre `membre` qui mira, amb el seu rol a l'organització
 * (`rolMeu`) i el seu id de persona (`jo`). Torna { rol, lleva }: `rol` és el
 * rol al qual es pot canviar ('admin' o 'member'; null, cap canvi) i `lleva`
 * diu si es pot llevar.
 */
export function accionsSobre(membre, { rolMeu, jo } = {}) {
  if (!membre || !esRolQueMana(rolMeu) || membre.rol === 'owner') return CAP_ACCIO;
  if (membre.tipus === 'persona' && jo != null && String(membre.id) === String(jo)) return CAP_ACCIO;
  if (membre.tipus === 'organitzacio') return { rol: null, lleva: true };
  if (membre.tipus !== 'persona') return CAP_ACCIO;
  const propietaria = rolMeu === 'owner';
  if (membre.rol === 'admin') return propietaria ? { rol: 'member', lleva: true } : CAP_ACCIO;
  return { rol: propietaria ? 'admin' : null, lleva: true };
}

/**
 * Els candidats a membre de l'organització `orgId`, sense els que ja ho són
 * (`membres`) ni la persona que mira (`jo`):
 *   · `persones`: files de carregaMembres (el padró del poble, ja cercat pel
 *     servidor): només les de tipus 'persona';
 *   · `organitzacions`: files de listMyOrganizations. Només les que la
 *     persona administra (el servidor exigix administrar-les totes dues,
 *     008), mai la mateixa, i filtrades ací pel `text`, que no passa pel
 *     servidor.
 * Candidat: { tipus, id, nom, avatar }. Primer les persones, després les
 * organitzacions; cap repetit.
 */
export function candidatsDeMembre({ persones = [], organitzacions = [], membres = [], orgId = null, text = '', jo = null } = {}) {
  const exclosos = new Set((Array.isArray(membres) ? membres : []).filter(Boolean).map(clauDeMembre));
  if (jo != null) exclosos.add(clauDeMembre({ tipus: 'persona', id: jo }));
  const parts = plega(text).split(/\s+/).filter(Boolean);
  const casa = (nom) => parts.every((part) => plega(nom).includes(part));
  const deLaGent = (Array.isArray(persones) ? persones : [])
    .filter((fila) => fila && (fila.tipus ?? 'persona') === 'persona' && fila.usuari_id != null)
    .map((fila) => ({ tipus: 'persona', id: String(fila.usuari_id), nom: String(fila.nom ?? ''), avatar: fila.avatar_url || '' }));
  const deLesOrganitzacions = (Array.isArray(organitzacions) ? organitzacions : [])
    .filter((org) => org && org.id != null && esRolQueMana(org.role) && String(org.id) !== String(orgId) && casa(org.name))
    .map((org) => ({ tipus: 'organitzacio', id: String(org.id), nom: String(org.name ?? ''), avatar: org.logo_url || '' }));
  const vistos = new Set();
  return [...deLaGent, ...deLesOrganitzacions].filter((candidat) => {
    const clau = clauDeMembre(candidat);
    if (exclosos.has(clau) || vistos.has(clau)) return false;
    vistos.add(clau);
    return true;
  });
}
