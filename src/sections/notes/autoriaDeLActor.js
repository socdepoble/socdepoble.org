/**
 * autoriaDeLActor.js — Onada R24 · wp_trinquet (SEO-R22-08, trinquet de
 * l'arrencada estàtica) · Qui signa el payload del Mur (autoriaDeLActor), el
 * poble de l'entitat (actorAmbPobleDeLEntitat), el mode de dades resolt i l'id
 * de la nota de benvinguda, en un mòdul propi: NotesContext.jsx i
 * signaturaDAltri.js, que són de l'arrencada, només en volien això i,
 * important-ho d'autoriaNota.js, arrossegaven al tros d'entrada la signatura
 * de la barra taronja (autoriaDeNota, signaturaDeNota, la persona pilot i les
 * seues rutes), que només fan servir l'editor i la llista de Notes, diferits.
 * Trasllat literal: autoriaNota.js els reexporta amb els mateixos noms i en
 * fa servir `net` i `nomPublic`. Pur: sense React ni backend. Un correu no es
 * publica mai.
 */
import { isSafeUrl } from '../../components/universal/UniversalUtils.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { fotoDelBucketPublic } from '../../utils/mitjaOpac.js';

export const NOM_SENSE_NOM = 'Veí';

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

/* La nota de benvinguda (n1): la signa Sóc de Poble (autoriaNota.js, AUTORIA_BENVINGUDA). */
export const ID_NOTA_BENVINGUDA = 'n1';

const RE_CORREU = /[^\s@]+@[^\s@]+\.[^\s@]+/;
export const net = (valor) => (typeof valor === 'string' ? valor.trim() : '');
export const nomPublic = (...candidats) => candidats.map(net).find((nom) => nom && !RE_CORREU.test(nom)) || '';
/* Només una foto que qualsevol pot obrir tal qual (http(s) o ruta pròpia): una
   referència sdp-media:// o una data: no viatja al payload del Mur.
   Revisió del Gauntlet 261017 (ID2; relleu 3: la foto de la barra és la de
   la publicació) · Derogat EN PART: la foto pujada a l'app al bucket PÚBLIC
   (sdp-media://mitjans/…, PerfilContext · uploadToStorage) sí que hi viatja.
   La pot obrir qualsevol (el port la resol a la URL pública: la targeta del
   Mur, UniversalCard, i la barra taronja, BarraTaronja), el servidor
   l'admet com a pròpia (supabase/migrations/2610072230_mur_imatges_propies.sql:
   «les pujades legítimes viatgen com a sdp-media://») i la barra negra i la
   taronja ja la pintaven. Abans la publicació eixia sense la foto que la
   barra prometia. El bucket privat (mitjans_privats) i una data: continuen
   fora: qui llig el Mur no les podria obrir. Decisió 3 no canvia.
   Revisió del Gauntlet 261017 (ID2, escriptura) · Resolt el PENDENT: el
   mapejador d'escriptura (mapejadorSeccions.js · mapSectionSubmissionToItem,
   avatarDeLaPublicacio de la branca 'mur') ja conserva la del bucket públic
   amb la mateixa regla, i la foto arriba a la fila
   (NotesContext.dataPublicacio.test.jsx). La targeta del Mur només la passa
   al port si és d'eixe bucket (TargetaDelMur.jsx).
   Contrast final · La regla és una sola, a utils/mitjaOpac.js
   (fotoDelBucketPublic, que torna la forma canònica): un camí amb '..' cap al
   bucket privat o amb caràcters estranys ja no viatja. */
const fotoPublica = (valor) => {
  const foto = net(valor);
  return isSafeUrl(foto) ? foto : fotoDelBucketPublic(foto);
};

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
 * fila de profiles).
 * Revisió del Gauntlet 261017 (ID3; relleu 3: una sessió, una identitat) ·
 * La persona signa amb el poble de l'actor i, de reserva, amb el town_name
 * de les metadades de la sessió: el mateix ordre que la barra taronja i la
 * targeta viva (autoriaDeLaSessio, baix). Abans només les metadades: una
 * sessió adoptada de l'amfitrió (adoptaSessioExterna no en copia el
 * town_name) o un compte amb el poble només a profiles publicava sense poble
 * ni poble_id, mentre la barra en deia un.
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
    poble: net(actor.poble) || net(meta.town_name)
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
