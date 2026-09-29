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
import { DEFAULT_AUTHOR, FORASTER, autorDeSessio, isSafeUrl } from '../../components/universal/UniversalUtils.js';

export const NOM_SENSE_NOM = 'Veí';

/* La nota de benvinguda (n1) és de Sóc de Poble, a La Torre, per a tothom.
   T65 (decisió del Mestre, 260928: «Editable, signa Sóc de Poble») · També la
   còpia que en prova el Foraster (ID_COPIA_PROVA): continua editable i desada
   al dispositiu, però la signa sempre Sóc de Poble, la llija o l'edite qui
   siga. L'autoria és la mateixa DEFAULT_AUTHOR que PageFrame posa a les
   pàgines de sistema: nom, avatar oficial i poble, d'una sola font. */
export const ID_NOTA_BENVINGUDA = 'n1';
export const ID_COPIA_PROVA = 'prova-local';
const IDS_BENVINGUDA = new Set([ID_NOTA_BENVINGUDA, ID_COPIA_PROVA]);
export const AUTORIA_BENVINGUDA = Object.freeze({
  nom: DEFAULT_AUTHOR.name,
  avatar: DEFAULT_AUTHOR.avatarUrl,
  poble: DEFAULT_AUTHOR.location
});

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

/**
 * T50 (D2) · { nom, avatar, poble } de qui signa una nota a la barra taronja
 * de l'editor (NotesEditor) I a la seua targeta viva de la llista (NotaFitxa):
 * abans cadascuna ho calculava pel seu compte i, amb una entitat activa, la
 * targeta signava amb la persona.
 *   · la nota de benvinguda i la còpia que en prova el Foraster: Sóc de
 *     Poble, a La Torre, amb el seu avatar (T65), per damunt de tot actor;
 *   · entitat activa: el seu nom i el seu logo, mai la persona (T43.3);
 *   · agent IA actiu: el seu nom, la seua foto i el seu poble;
 *   · si no, la sessió (T22: sense sessió, nom i poble del Foraster junts).
 * Sense foto, null: la barra i la targeta hi pinten la silueta de reserva
 * (abans l'editor hi posava /assets/system/ui/default-avatar.jpg, que no
 * existix a public/: la barra l'amagava en fallar la càrrega, però la targeta
 * pintava una imatge trencada). El poble pot ser una cadena buida legítima
 * (persona sense poble, entitat): `??`, perquè no es convertisca en el del Foraster.
 */
export function autoriaDeNota({ notaId, actor, actorId, agents, currentUser } = {}) {
  if (notaId != null && IDS_BENVINGUDA.has(String(notaId))) return AUTORIA_BENVINGUDA;
  const autoria = autoriaDeLActor(actor, currentUser);
  const agent = (agents || []).find((a) => String(a?.id) === String(actorId));
  let qui;
  if (actor?.tipus === 'entitat' && autoria) {
    qui = { nom: autoria.nom, avatar: actor.avatar, poble: autoria.poble };
  } else if (agent) {
    qui = { nom: agent.name, avatar: agent.avatar_url || agent.image_url, poble: agent.location };
  } else {
    const sessio = autorDeSessio(currentUser);
    const meta = currentUser?.user_metadata || {};
    qui = { nom: sessio.name, avatar: meta.avatar_url || meta.picture, poble: sessio.location };
  }
  return {
    nom: qui.nom || FORASTER.name,
    avatar: qui.avatar || null,
    poble: qui.poble ?? FORASTER.location
  };
}
