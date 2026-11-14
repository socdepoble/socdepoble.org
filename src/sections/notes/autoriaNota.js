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
 * Un correu no es publica mai. La reserva del nom de l'actor persona
 * (nomDePersona, a app/contexts/personaDeSessio.js des del 13-10-2026, pla
 * 261013_1405, front A) hi cau quan la persona no té nom ni a la fila de
 * profiles ni a les metadades; aleshores es diu «Veí».
 *
 * Ordre del Mestre (261007): «Quan isquen, les barres taronges han de portar
 * a la pàgina de l'autor que l'ha creada». signaturaDeNota hi afig la `ruta`
 * de la pàgina de qui signa; autoriaDeNota continua tornant { nom, avatar,
 * poble }, la forma que llegix la targeta viva de la llista (NotaFitxa).
 *
 * Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
 * Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
 * oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · El
 * pilot com a actor signa la barra i la targeta viva amb l'autoria oficial
 * sencera (AUTORIA_BENVINGUDA) i porta al seu perfil. Es reconeix amb el
 * predicat del xat (esLaIdentitatDAjuda: slug declarat o id de la llavor,
 * mai pel nom ni per cap uuid; data/xatsPerDefecte.js només importa la
 * llavor i el contracte: cap cicle). El payload del Mur (autoriaDeLActor) no
 * canvia: continua sent el de la fila.
 * Revisió del prompt 261014_0400 · Per tant, per al pilot, la barra i la
 * targeta viva poden dir un nom, un poble i un logo que el selector
 * «Publicaràs com a» i la publicació no porten: passa quan la fila té un
 * altre nom, un altre town_name o cap logo_url. Per al pilot, la invariant de
 * NotesEditor («el selector i la barra no poden dir una cosa i el Mur una
 * altra») i l'avís de la targeta viva (AVISOS_TARGETA_VIVA.notes) deixen de
 * complir-se. El payload queda fora per ordre. Triar entre l'autoria sencera
 * i només el logo és decisió pendent del Mestre: la prova [DEFECTE]
 * d'autoriaNota.test.js reproduïx el deute.
 *
 * Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5; ordre del Mestre) · Cap barra
 * taronja ni cap targeta viva no signa «Foraster». Sense sessió en el mode
 * del padró pilot (seed o local), i amb la sessió de la persona pilot per
 * àlies, signa Javi Llinares (AUTORIA_PILOT) i porta a la seua fitxa; amb
 * una altra sessió, la persona de la sessió (l'actor persona); i, sense nom
 * ni sessió coneguda, «Veí» sense poble. El payload del Mur
 * (autoriaDeLActor) no canvia.
 */
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { RUTA_PERFIL_PROJECTE, RUTES_CANONIQUES, rutaDAutoria, rutaDePerfil } from '../../config/navigation.js';
import { esLaIdentitatDAjuda, esLaPersonaDeContacte } from '../../data/xatsPerDefecte.js';
import { PERSONA_PILOT, POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';
import { avatarDePersona } from '../../app/contexts/personaDeSessio.js';
import {
  ID_NOTA_BENVINGUDA, NOM_SENSE_NOM, actorAmbPobleDeLEntitat, autoriaDeLActor, modeDeDadesResolt, net, nomPublic
} from './autoriaDeLActor.js';

/* Onada R24 · wp_trinquet (SEO-R22-08) · NOM_SENSE_NOM, modeDeDadesResolt,
   ID_NOTA_BENVINGUDA, autoriaDeLActor i actorAmbPobleDeLEntitat viuen a
   autoriaDeLActor.js (trasllat literal), que l'arrencada importa sense la
   signatura de la barra taronja; ací es reexporten amb els mateixos noms. */
export { ID_NOTA_BENVINGUDA, NOM_SENSE_NOM, actorAmbPobleDeLEntitat, autoriaDeLActor, modeDeDadesResolt };

/* Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5; ordre del Mestre: «En redactar
   una nota sota sessió, pilot o llavor, la barra taronja mostra Javi
   Llinares i La Torre de les Maçanes amb la seua foto canònica (o la de
   l'entitat activa). Prohibit etiquetar d'ofici com a "Foraster"») · La
   signatura de la persona pilot, d'una sola font (identitatsSeed.js): el seu
   nom, la seua foto canònica i el poble fundacional. Congelada: la targeta
   viva la compara per identitat. */
export const AUTORIA_PILOT = Object.freeze({
  nom: PERSONA_PILOT.nom,
  avatar: PERSONA_PILOT.avatar,
  poble: POBLE_FUNDACIONAL
});
/* La pàgina de la persona pilot (el seu slug declarat).
   Correcció de la revisió (261016; ordre del Mestre del Bloc 3.5.1: les rutes
   canòniques netes) · La seua adreça canònica, /javillinares
   (RUTES_CANONIQUES), la mateixa que fa servir el xat (actorsDelXat ·
   RUTA_DE_JAVI) i que declara el SEO; /gent/javillinares obri la mateixa
   fitxa i queda de reserva. */
export const RUTA_PERSONA_PILOT = RUTES_CANONIQUES[PERSONA_PILOT.slug] ?? rutaDePerfil('persona', PERSONA_PILOT.slug);

/* El nom de reserva de l'actor persona quan el compte no en porta cap ni té
   correu (app/contexts/personaDeSessio.js · nomDePersona). No és el nom de
   ningú: a la barra, «Veí». */
const NOM_DE_RESERVA_DEL_COMPTE = 'El meu compte';
const MODES_DE_LLAVOR = new Set(['seed', 'local']);

/* La nota de benvinguda (n1) és de Sóc de Poble, a La Torre, per a tothom.
   T65 (decisió del Mestre, 260928: «Editable, signa Sóc de Poble») · També la
   còpia que en prova el Foraster (ID_COPIA_PROVA): continua editable i desada
   al dispositiu, però la signa sempre Sóc de Poble, la llija o l'edite qui
   siga. L'autoria és la mateixa DEFAULT_AUTHOR que PageFrame posa a les
   pàgines de sistema: nom, avatar oficial i poble, d'una sola font. */
export const ID_COPIA_PROVA = 'prova-local';
const IDS_BENVINGUDA = new Set([ID_NOTA_BENVINGUDA, ID_COPIA_PROVA]);
export const AUTORIA_BENVINGUDA = Object.freeze({
  nom: DEFAULT_AUTHOR.name,
  avatar: DEFAULT_AUTHOR.avatarUrl,
  poble: DEFAULT_AUTHOR.location
});

/**
 * T50 (D2) · { nom, avatar, poble } de qui signa una nota a la barra taronja
 * de l'editor (NotesEditor) I a la seua targeta viva de la llista (NotaFitxa):
 * abans cadascuna ho calculava pel seu compte i, amb una entitat activa, la
 * targeta signava amb la persona.
 *   · la nota de benvinguda i la còpia que en prova el Foraster: Sóc de
 *     Poble, a La Torre, amb el seu avatar (T65), per damunt de tot actor;
 *   · l'entitat pilot activa: la mateixa autoria oficial, siga quin siga el
 *     logo, el nom o el poble de la seua fila (prompt 261014_0400, ordre del
 *     Mestre; el PNG verd guanya també a un logo propi, com l'ordre E de
 *     PerfilEditor). El payload del Mur no la porta: vegeu la capçalera;
 *   · entitat activa: el seu nom i el seu logo, mai la persona (T43.3);
 *   · agent IA actiu: el seu nom, la seua foto i el seu poble;
 *   · la persona pilot (Gauntlet 261016, Bloc 3.9): Javi Llinares, la seua
 *     foto canònica i La Torre de les Maçanes (AUTORIA_PILOT). Només en dos
 *     casos: sense sessió i amb el mode de dades EXPLÍCITAMENT 'seed' o
 *     'local' (el padró pilot del dispositiu: identitatsSeed.js, regla del
 *     mode seed), o amb una sessió que és la persona pilot per àlies declarat
 *     (PERSONA_PILOT.alies, mai pel nom). Mai en remot sense sessió (un
 *     visitant anònim d'un paquet de producció) ni per a una altra sessió;
 *   · si no, la sessió: l'actor persona d'IdentitatContext (el nom, la foto i
 *     el poble que tria personaDeSessio amb la fila de profiles), amb les
 *     metadades de reserva. Sense nom, «Veí» (NOM_SENSE_NOM); sense poble, cap.
 *     Mai el Foraster: deroga T22 (abans, sense sessió, nom i poble del
 *     Foraster junts) per ordre del Mestre del 261016.
 * Sense foto, null: la barra i la targeta hi pinten la silueta de reserva
 * (abans l'editor hi posava /assets/system/ui/default-avatar.jpg, que no
 * existix a public/: la barra l'amagava en fallar la càrrega, però la targeta
 * pintava una imatge trencada). El poble pot ser una cadena buida legítima
 * (persona sense poble, entitat).
 * `dataMode` (opcional): el mode de dades RESOLT del Bloc
 * (modeDeDadesResolt(config), correcció de la revisió del 261016; abans el
 * cru, config.dataMode). Sense, cap via pilot pel mode.
 */
export function autoriaDeNota({ notaId, actor, actorId, agents, currentUser, dataMode } = {}) {
  const signant = triaSignant({ notaId, actor, actorId, agents, currentUser, dataMode });
  if (signant.via === 'benvinguda' || signant.via === 'oficial') return AUTORIA_BENVINGUDA;
  if (signant.via === 'pilot') return AUTORIA_PILOT;
  let qui;
  if (signant.via === 'entitat') {
    qui = { nom: signant.autoria.nom, avatar: actor.avatar, poble: signant.autoria.poble };
  } else if (signant.via === 'agent') {
    const { agent } = signant;
    qui = { nom: agent.name, avatar: agent.avatar_url || agent.image_url, poble: agent.location };
  } else {
    qui = autoriaDeLaSessio(actor, currentUser);
  }
  return {
    nom: net(qui.nom) || NOM_SENSE_NOM,
    avatar: qui.avatar || null,
    poble: net(qui.poble)
  };
}

/* Gauntlet 261016 (Bloc 3.9) · La persona que signa amb sessió: l'actor
   persona d'IdentitatContext (personaDeSessio: la fila de profiles i, de
   reserva, les metadades), i les metadades quan no hi ha actor persona (un
   muntatge sense proveïdor). Un correu o el nom de reserva del compte no
   són cap nom. Sense sessió, ni nom ni foto ni poble: «Veí». */
function autoriaDeLaSessio(actor, currentUser) {
  if (!currentUser) return { nom: '', avatar: null, poble: '' };
  const persona = actor?.tipus === 'persona' ? actor : null;
  const meta = currentUser.user_metadata || {};
  const nomDeLActor = net(persona?.nom) === NOM_DE_RESERVA_DEL_COMPTE ? '' : persona?.nom;
  return {
    nom: nomPublic(nomDeLActor, meta.full_name, meta.name, currentUser.full_name),
    avatar: net(persona?.avatar) || avatarDePersona(currentUser),
    poble: net(persona?.poble) || net(meta.town_name)
  };
}

/* La persona pilot signa: sense sessió en el mode del padró pilot, o la
   sessió és ella per àlies declarat (també el seu actor persona). */
function esLaPersonaPilot({ actor, currentUser, dataMode }) {
  if (!currentUser) return MODES_DE_LLAVOR.has(dataMode);
  return esLaPersonaDeContacte(currentUser) || (actor?.tipus === 'persona' && esLaPersonaDeContacte(actor));
}

/* Qui signa, en l'ordre de autoriaDeNota: una sola tria per al nom i per a la
   ruta, perquè la barra no diga un autor i porte a la pàgina d'un altre.
   Prompt 261014_0400 (ordre del Mestre) · El pilot, just després de la
   benvinguda i abans de mirar-ne el nom: una fila sense nom tampoc no cau a
   la persona. Gauntlet 261016 (Bloc 3.9) · La persona pilot, després de
   l'entitat i de l'agent actius i abans de la sessió. */
function triaSignant({ notaId, actor, actorId, agents, currentUser, dataMode }) {
  if (notaId != null && IDS_BENVINGUDA.has(String(notaId))) return { via: 'benvinguda' };
  if (esLaIdentitatDAjuda(actor, 'socdepoble')) return { via: 'oficial' };
  const autoria = autoriaDeLActor(actor, currentUser);
  if (actor?.tipus === 'entitat' && autoria) return { via: 'entitat', autoria };
  const agent = (agents || []).find((a) => String(a?.id) === String(actorId));
  if (agent) return { via: 'agent', agent };
  if (esLaPersonaPilot({ actor, currentUser, dataMode })) return { via: 'pilot' };
  return { via: 'sessio' };
}

/**
 * Ordre del Mestre (261007) · La ruta de la pàgina de qui signa una nota, o
 * null. La mateixa tria que autoriaDeNota:
 *   · la nota de benvinguda i la còpia de prova: Sóc de Poble, al seu perfil
 *     (RUTA_PERFIL_PROJECTE; Onada 8, 261009: abans, RUTA_PROJECTE);
 *   · l'entitat pilot activa: el seu perfil, també abans que ningú n'haja
 *     registrat l'uuid (prompt 261014_0400, ordre del Mestre);
 *   · entitat activa: rutaDAutoria (l'entitat pilot porta al seu perfil; la
 *     resta, a la seua fitxa pública);
 *   · agent IA actiu: la seua fitxa (rutaDePerfil 'ia');
 *   · la persona pilot (Gauntlet 261016, Bloc 3.9): la seua fitxa, a la seua
 *     adreça canònica (RUTA_PERSONA_PILOT, /javillinares);
 *   · persona amb sessió: la seua fitxa pública (rutaDePerfil 'persona', amb
 *     l'id de la sessió);
 *   · sense sessió i fora del padró pilot: null. Un nom sense identitat
 *     coneguda no s'endevina.
 */
export function rutaDAutoriaDeNota({ notaId, actor, actorId, agents, currentUser, dataMode } = {}) {
  const signant = triaSignant({ notaId, actor, actorId, agents, currentUser, dataMode });
  if (signant.via === 'benvinguda' || signant.via === 'oficial') return RUTA_PERFIL_PROJECTE;
  if (signant.via === 'entitat') return rutaDAutoria({ tipus: 'entitat', id: actor.id });
  if (signant.via === 'agent') return rutaDePerfil('ia', signant.agent.id);
  if (signant.via === 'pilot') return RUTA_PERSONA_PILOT;
  return currentUser?.id == null ? null : rutaDePerfil('persona', currentUser.id);
}

/**
 * Ordre del Mestre (261007) · { nom, avatar, poble, ruta } de qui signa: el
 * que pinta la barra taronja de l'editor (NotesEditor), amb l'enllaç a la
 * pàgina de l'autor. Els tres primers camps són sempre els de autoriaDeNota.
 */
export function signaturaDeNota(params = {}) {
  return { ...autoriaDeNota(params), ruta: rutaDAutoriaDeNota(params) };
}
