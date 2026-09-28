/**
 * autoriaNota.js — Qui signa una nota publicada, dit d'una sola manera.
 *
 * Poliment T41/T43 (ordre del Mestre, 260928) · El selector de visibilitat
 * («Publicaràs com a …»), la barra taronja de l'editor i el payload del Mur
 * (author_name, author_avatar, author_location) llegixen l'actor
 * d'IdentitatContext: el mateix que MurContext envia al servidor com a
 * author_org_id. Abans el payload deia sempre el nom de l'app i un poble fix.
 * Pur: sense React ni backend.
 *
 * Un correu no es publica mai. IdentitatContext.nomDePersona hi cau quan la
 * persona no té cap nom; aleshores es diu «Veí».
 */
import { isSafeUrl } from '../../components/universal/UniversalUtils.js';

export const NOM_SENSE_NOM = 'Veí';

const RE_CORREU = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const net = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const nomPublic = (...candidats) => candidats.map(net).find((nom) => nom && !RE_CORREU.test(nom)) || '';
/* Només una foto que qualsevol pot obrir tal qual (http(s) o ruta pròpia): una
   referència sdp-media:// o una data: no viatja al payload del Mur. */
const fotoPublica = (valor) => (isSafeUrl(net(valor)) ? net(valor) : null);

/**
 * { nom, avatar, poble } de qui signa, o null sense actor (mode incrustat sense
 * identitat: qui publica decidix la reserva).
 *   · entitat: el seu nom i el seu logo; el poble no se sap (cadena buida);
 *   · persona: el nom de l'actor (mai un correu), la foto i el poble de la sessió.
 */
export function autoriaDeLActor(actor, currentUser) {
  if (!actor) return null;
  if (actor.tipus === 'entitat') {
    const nom = nomPublic(actor.nom, actor.slug);
    return nom ? { nom, avatar: fotoPublica(actor.avatar), poble: '' } : null;
  }
  if (!actor.nom && !currentUser) return null;
  const meta = currentUser?.user_metadata || {};
  return {
    nom: nomPublic(actor.nom, meta.full_name, meta.name, currentUser?.full_name) || NOM_SENSE_NOM,
    avatar: fotoPublica(actor.avatar),
    poble: net(meta.town_name)
  };
}
