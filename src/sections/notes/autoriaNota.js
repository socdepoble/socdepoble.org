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
import { DEFAULT_AUTHOR, isSafeUrl } from '../../components/universal/UniversalUtils.js';
import { RUTA_PERFIL_PROJECTE, RUTES_CANONIQUES, rutaDAutoria, rutaDePerfil } from '../../config/navigation.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { esLaIdentitatDAjuda, esLaPersonaDeContacte } from '../../data/xatsPerDefecte.js';
import { PERSONA_PILOT, POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';
import { avatarDePersona } from '../../app/contexts/personaDeSessio.js';

export const NOM_SENSE_NOM = 'Veí';

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

/**
 * Correcció de la revisió (261016) · El mode de dades que decidix la via pilot
 * de la signatura: el RESOLT (normalizeBackendConfig, que té en compte
 * l'elecció remota desada en este navegador), no el `dataMode` cru que demana
 * el paquet. Un paquet 'seed' que ja ha triat l'entrada real treballa en
 * remot, i un visitant anònim no ha de vore la persona pilot («mai remot»).
 * El mateix criteri que reglaDEntrada (connectar/contingutExtern.js) i
 * App.jsx. Llig la configuració de l'amfitrió i l'elecció desada; cap xarxa.
 *   · sense config (un muntatge sense NotesDataProvider): undefined, cap via
 *     pilot pel mode, com abans;
 *   · una config que no es pot normalitzar (un tenant invàlid): 'remote', que
 *     no obri mai la via pilot.
 */
export function modeDeDadesResolt(config) {
  if (!config) return undefined;
  try {
    return normalizeBackendConfig(config).dataMode;
  } catch {
    return 'remote';
  }
}
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
 *   · entitat: el seu nom, el seu logo i el seu poble (el town_name de
 *     l'organització, 2610081401) si l'actor el porta; si no, cadena buida;
 *   · persona: el nom de l'actor (mai un correu), la foto i el poble de la sessió.
 * Onada 6 (decisió 2 de la nit del 261009: «l'entitat porta el town_name de
 * l'organització si l'actor el té») · Es llig `poble` o `town_name` de
 * l'actor; sense, continua sent buit, com abans. Fins al 13-10-2026 l'actor
 * d'IdentitatContext no el portava i qui publicava l'hi posava abans amb
 * actorAmbPobleDeLEntitat (la fila de la pertinença, baix). Des de l'ordre
 * del Mestre del 13-10-2026 (pla 261013_1405, front A) l'actor entitat ja el
 * porta, de la mateixa fila. L'actor persona també porta `poble` (el de la
 * fila de profiles), però ací la persona continua signant amb el town_name
 * de les metadades de la sessió: el codi no ha canviat.
 */
export function autoriaDeLActor(actor, currentUser) {
  if (!actor) return null;
  if (actor.tipus === 'entitat') {
    const nom = nomPublic(actor.nom, actor.slug);
    return nom ? { nom, avatar: fotoPublica(actor.avatar), poble: net(actor.poble) || net(actor.town_name) } : null;
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
 * Revisió adversarial de l'Onada 6 · L'actor entitat d'IdentitatContext porta
 * { tipus, id, nom, avatar, rol, slug, kind }, sense el poble de
 * l'organització, i les seues publicacions eixien sense poble: cap pestanya
 * «Gent de …» les trobava (el requisit diu «persones o grups locals»). El
 * poble ja viatja a la fila de la pertinença (`memberships` del mateix
 * context: list_my_organizations torna town_name des de 2610081401, i el
 * mode seed des de localPerfils.js). Torna l'actor amb `poble` = el
 * town_name de la seua fila; si l'actor ja en porta, si no és una entitat o
 * si la fila no en té, el MATEIX actor. Pur.
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front A) · L'actor entitat
 * d'IdentitatContext ja porta este `poble` (la mateixa fila): per a ell és
 * una no-operació. Es conserva per als actors que no passen pel proveïdor.
 */
export function actorAmbPobleDeLEntitat(actor, memberships) {
  if (actor?.tipus !== 'entitat' || net(actor.poble) || net(actor.town_name)) return actor;
  const fila = (Array.isArray(memberships) ? memberships : []).find((org) => org && String(org.id) === String(actor.id));
  const poble = net(fila?.town_name);
  return poble ? { ...actor, poble } : actor;
}

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
