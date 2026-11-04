/**
 * modeDeConnectar.js — Com es disposa /connectar (FEDI-22, ordre del Mestre,
 * 261103; captura 261103_2055). Lògica pura, sense cap import de
 * ConnectarSection.jsx (cap cicle).
 *
 *   · 'social' · el perfil d'una persona, d'una entitat o d'un grup amb una
 *     relació que oferir (o amb la fitxa encara carregant): el primer que es
 *     veu és CONNECTAR (la targeta de la connexió directa) i, a banda, formar
 *     part. Guardar-ho a les teues notes va plegat a la columna lateral.
 *   · 'element' · tota la resta (Mur, Mercat, agenda, una pàgina, un poble, una
 *     IA o un perfil sense relació, també amb ?organitzacio): l'objecte i les
 *     notes, obertes i primàries; la relació i formar part, a la lateral.
 *   · C1 (crític, 261103) · La disposició no depén d'orgId: un perfil d'entitat
 *     sense relació (la teua, sense cap altre barret, o una fitxa fallida) no
 *     deixa les notes primàries en una columna lateral estreta.
 */
import { esRolQueMana } from '../../components/universal/identitat/rols.js';

export const TIPUS_SOCIALS = Object.freeze(['persona', 'entitat', 'grup']);

/** Un perfil de persona, d'entitat o de grup, segons l'URL: estable des del primer pintat. */
export function esPerfilSocial(origen) {
  return origen?.sectionId === 'perfil' && TIPUS_SOCIALS.includes(origen?.objecte);
}

/** 'social' o 'element' (vegeu la capçalera). `carregantFitxa`: la fitxa del perfil encara no ha arribat i no hi ha cap contacte. */
export function disposicioDeLaVista({ esPerfil = false, ambRelacio = false, carregantFitxa = false } = {}) {
  return esPerfil && (ambRelacio || carregantFitxa) ? 'social' : 'element';
}

/**
 * Quin botó de BlocRelacio és el primari de la vista social (un per vista):
 * 'entra' (sense contacte, o sense sessió: C3), 'connecta', 'escriu' (ja
 * connectats, o sense poder connectar des d'ací) o cap ('comprovant', o un
 * destí teu sense xat). Pura.
 */
export function botoPrincipalDeLaRelacio({ teContacte = false, estat = null, propi = false } = {}) {
  if (!teContacte) return 'entra';
  switch (estat) {
    case 'no-segueix': return 'connecta';
    case 'sense-sessio': return 'entra';
    case 'segueix':
    case 'no-disponible':
    case 'no-seguible':
      return propi ? null : 'escriu';
    default:
      return null;
  }
}

/**
 * C2 (crític, 261103) · Les entitats on qui mira pot incloure una persona: les
 * opcions de «Connectar com a» (actorsConnectar, ja traduïdes) que són una
 * identitat d'entitat que administra, amb el seu rol ('owner' | 'admin'). La
 * font és la mateixa del selector, mai `memberships`. Mai la persona. Pura.
 * RA-05 (revisió 261104) · I el poble de la identitat (el de la pertinença,
 * town_name), o '': per a avisar abans del clic si la fitxa en diu un altre.
 */
export function entitatsPerIncloure(actorsConnectar = [], identitats = []) {
  const actors = Array.isArray(actorsConnectar) ? actorsConnectar : [];
  const perId = new Map();
  for (const identitat of Array.isArray(identitats) ? identitats : []) {
    if (identitat?.tipus === 'entitat' && identitat.id != null && esRolQueMana(identitat.rol)) perId.set(String(identitat.id), identitat);
  }
  return actors
    .filter((opcio) => opcio && perId.has(String(opcio.valor)))
    .map((opcio) => {
      const identitat = perId.get(String(opcio.valor));
      const poble = typeof identitat.poble === 'string' ? identitat.poble.trim() : '';
      return { valor: opcio.valor, etiqueta: opcio.etiqueta, nom: opcio.nom, rol: identitat.rol, poble };
    });
}
