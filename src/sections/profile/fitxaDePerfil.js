import { RUTA_PERFIL_PROJECTE, rutaDAutoria, rutaDePerfil } from '../../config/navigation.js';
import { ENTITAT_PILOT_SLUG, POBLE_FUNDACIONAL, clauFundacional } from '../../data/identitatsSeed.js';
import { DEFAULT_AUTHOR, esRutaDelProjecte } from '../../components/universal/UniversalUtils.js';
import { esFontImatgePropia } from '../../utils/sanitize.js';
import { menaDeFitxa } from './perfilCamps.js';
import { formataPoble, llistaDePobles, poblePrincipal } from '../pobles/nomsDelPoble.js';

/* ═══════════════════════════════════════════════════════════════════
   LA FITXA D'UNA IDENTITAT DEL PERFIL · funcions pures

   Ordre del Mestre (261008, «Les vistes») · «Vista A4 / PDF», «Crear
   portada» i «Vista targeta» ixen de l'editor i tenen apartat propi a la
   segona columna (DetallVistes). L'apartat i la seua pàgina han de saber el
   mateix que l'editor de la fitxa: qui la pot editar, on porta la barra
   taronja, de quin poble és i quines píndoles porta.

   FONT ÚNICA (Línia I2, pla 261008_1201) de rutaDeFitxaPublica,
   slugDEntitat, potEditarFitxa, etiquetesDeFitxa i ETIQUETA_IA. Ací no hi
   ha cap còpia: PerfilEditor.jsx les importa d'este mòdul (i torna a
   exportar ETIQUETA_IA, rutaDeFitxaPublica i slugDEntitat per a les proves
   del Perfil), i DetallVistes.jsx i perfilModel.js també en lligen.

   La direcció PerfilEditor → fitxaDePerfil és la segura: les proves de
   PerfilShell (PerfilShell.test, .espai i .mestreDetall) i d'UniversalWorkspace
   (.ajustos i .barres dels consumidors) fan mock de PerfilEditor.jsx sencer.
   Un mòdul que les importara d'allí les rebria sense definir en eixes
   proves: perfilModel.js (potEditarFitxa), que PerfilShell carrega sense
   doble en totes, i DetallVistes.jsx en les que no el substituïxen.

   Prompt 261014_0400 (ordre del Mestre, tasca 4) · avatarDeLaBarraDeFitxa
   també viu ací: l'avatar de la barra taronja i de la targeta viva de la
   fitxa, el mateix a l'editor, a «Les vistes» i a «El compte». Abans la regla
   del pilot vivia només a PerfilEditor i les tres superfícies es veien
   distintes en passar d'apartat. UniversalUtils.js no importa res d'este
   mòdul ni de la llavor: cap cicle. esFitxaDelPilot n'és el criteri, a
   soles: amb ell, «Les vistes» i l'editor no demanen al port el logo de la
   fila del pilot, que no pinten.

   Gauntlet 261016 (encàrrec D) · avatarDeLaFitxa també: la imatge pròpia de
   la fitxa amb l'esborrany de la cua, la mateixa a l'editor, a «Les vistes»,
   a «El compte» i a la fitxa compacta de la llista central.

   pobleDeFitxa és la regla del poble de «Les vistes»: la persona, el seu
   (dades.town_name); una organització, el seu propi o cap, mai el de la
   persona; un agent IA, el seu o el de la persona que l'administra.
   PerfilEditor NO la usa: té el seu `poble`, que per a una persona sense
   poble propi encara mira la persona d'`identitats`. Fins que el Mestre
   decidisca quina de les dues mana, cada una es queda com és.
   ═══════════════════════════════════════════════════════════════════ */

/* Qui pot editar la fitxa d'una organització (la RLS ho torna a dir al servidor). */
const ROLS_QUE_EDITEN = new Set(['owner', 'admin']);

/* Lògica d'Usuari (T4): la fitxa d'un agent IA es diu clarament el que és. */
export const ETIQUETA_IA = 'Intel·ligència artificial';

/**
 * El slug d'una organització que no és un grup (la fila de
 * list_my_organizations, `dades.slug`), o '' per a la resta: un grup, una
 * persona o un agent no poden ser l'entitat pilot.
 */
export function slugDEntitat(identitat) {
  if (menaDeFitxa(identitat) !== 'organitzacio' || identitat?.mena === 'grup') return '';
  const slug = identitat?.dades?.slug;
  return slug == null ? '' : String(slug);
}

/**
 * La fitxa pública d'una identitat, on porta l'autoria de la barra taronja
 * (ordre del Mestre, 261007):
 *   · la persona, per l'id de la seua fila (dades.id): `identitat.id` és 'jo';
 *   · una organització, per rutaDAutoria; l'entitat pilot, pel slug declarat,
 *     al seu perfil des del primer render (RUTA_PERFIL_PROJECTE; Onada 8,
 *     261009: abans, /projecte);
 *   · un agent IA, a la seua fitxa (/perfil/:id).
 * Sense id, null: la barra queda sense enllaç.
 */
export function rutaDeFitxaPublica(identitat) {
  const mena = identitat?.mena;
  if (mena === 'persona') return rutaDePerfil('persona', identitat.dades?.id);
  if (mena === 'agent') return rutaDePerfil('ia', identitat.id);
  if (identitat?.id != null && slugDEntitat(identitat) === ENTITAT_PILOT_SLUG) return RUTA_PERFIL_PROJECTE;
  return rutaDAutoria({ tipus: mena === 'grup' ? 'grup' : 'entitat', id: identitat?.id });
}

/**
 * Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
 * Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
 * oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») ·
 * L'avatar de la barra taronja i de la targeta viva d'una fitxa:
 *   · la fitxa del pilot (la seua fitxa és el seu perfil: esRutaDelProjecte
 *     de rutaDeFitxaPublica, pel slug declarat o per l'id de la llavor, mai
 *     pel nom; el criteri de l'ordre E), el PNG verd oficial
 *     (DEFAULT_AUTHOR.avatarUrl), siga quin siga el logo de la fila: cap, una
 *     referència opaca o un de propi;
 *   · la resta, `avatarResolt`, el que cada superfície ja hi posava, tal qual.
 * Només l'avatar: el nom, el poble i l'enllaç continuen sent els de la fitxa.
 */
export function avatarDeLaBarraDeFitxa(identitat, avatarResolt) {
  return esFitxaDelPilot(identitat) ? DEFAULT_AUTHOR.avatarUrl : avatarResolt;
}

/**
 * Gauntlet 261016 (encàrrec D; pla, Onada 1.1.4: «han de beure exactament de
 * la mateixa instància de dades») · La imatge pròpia de la fitxa (l'avatar o
 * el logotip), la mateixa a totes les superfícies del Perfil: l'editor, la
 * seua barra taronja i la targeta viva (PerfilEditor), «Les vistes»
 * (DetallVistes), «El compte» (DetallCompte) i la fitxa compacta de la llista
 * central (FitxaDePerfil, PerfilShell; la base, perfilModel.js). Abans la
 * regla vivia dins de l'editor (Bloc 3.5.4), copiada a «Les vistes» (F1), i
 * la llista i «El compte» llegien identitat.avatar: després d'un avatar
 * rebutjat (403), una foto al centre i una altra a la dreta.
 *   · mentre la cua guarda un esborrany de logoImage (pendent o rebutjat), la
 *     imatge de la fitxa tal qual, també el buit de «Llevar l'avatar»;
 *   · si no, la de la fitxa o, sense cap, la reserva de la identitat (per a
 *     la persona, la foto de la sessió: pla 261014_1450, front B).
 * Pla 261018_1605 (Tasca 3, D6; ordre del Mestre, 18-10-2026) · Per a la
 * persona, una foto pròpia guanya: si la de la fitxa no és pròpia (la de
 * Google, p. ex.) i la de la identitat sí que ho és, la de la identitat. Un
 * sol classificador, esFontImatgePropia (utils/sanitize.js).
 * `fitxa` és el document de la fitxa amb l'esborrany (documentDeFitxa);
 * `camps`, l'esborrany de la cua (useAutodesament). Torna la font crua: una
 * referència opaca (sdp-media://) la resol cada superfície pel port, i el PNG
 * verd del pilot el posa avatarDeLaBarraDeFitxa, a la barra. Mai null.
 */
export function avatarDeLaFitxa(fitxa, camps, identitat) {
  const imatge = fitxa?.logoImage || '';
  if (Object.hasOwn(camps || {}, 'logoImage')) return imatge;
  if (
    menaDeFitxa(identitat) === 'persona'
    && imatge
    && !esFontImatgePropia(imatge)
    && esFontImatgePropia(identitat?.avatar)
  ) {
    return identitat.avatar;
  }
  return imatge || identitat?.avatar || '';
}

/**
 * Revisió del prompt 261014_0400 (ordre del Mestre) · Si la fitxa és la del
 * pilot (esRutaDelProjecte de rutaDeFitxaPublica: el slug declarat o l'id de
 * la llavor, mai el nom). És el criteri d'avatarDeLaBarraDeFitxa, a soles:
 * «Les vistes» i l'editor el lligen abans de resoldre el logo de la fila,
 * que la fitxa del pilot no pinta, per a no demanar-lo al port (com la fitxa
 * pública, que per al pilot ja no el resol).
 */
export function esFitxaDelPilot(identitat) {
  return esRutaDelProjecte(rutaDeFitxaPublica(identitat));
}

/* Amb una baixa en curs el servidor té el perfil congelat: la fitxa es veu en
   lectura. Amb la fila de reserva (la lectura de profiles ha fallat), també. */
const enBaixa = (identitat) => menaDeFitxa(identitat) === 'persona' && Boolean(identitat?.dades?.baixa_demanada_at);
const deReserva = (identitat) => menaDeFitxa(identitat) === 'persona' && identitat?.dades?.reserva === true;

/**
 * Qui veu la fitxa en edició (i, per tant, els botons de les vistes): la
 * persona i els agents que administra, i qui és propietària o administradora
 * d'una organització. Mai amb una baixa en curs ni amb la fila de reserva.
 */
export function potEditarFitxa(identitat) {
  if (!identitat) return false;
  const mena = menaDeFitxa(identitat);
  if (enBaixa(identitat) || deReserva(identitat)) return false;
  return mena === 'persona' || mena === 'agent' || ROLS_QUE_EDITEN.has(identitat.dades?.role);
}

/**
 * Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar entitats
 * sense poble») · El poble de reserva d'una fitxa sense poble propi: el de les
 * tres identitats del Mestre (POBLE_FUNDACIONAL), si ho és (clauFundacional,
 * la mateixa regla que la fitxa pública, PerfilPublicSection.jsx: per l'id o
 * un àlies declarat, un id remot declarat o, per a la persona, el slug que
 * posa la llavor; mai pel nom ni pel slug d'una organització); si no, ''.
 *   · la persona, per la seua fila (dades.id i dades.slug): `identitat.id` és 'jo';
 *   · una organització, pel seu id, com a entitat o com a grup (identitat.mena);
 *   · un agent IA no és cap de les tres: ''.
 * El poble desat sempre mana: qui crida només hi cau sense poble propi.
 * Pla 261018_1605 (Tasca 0, D7; integració) · Ací no entra el correu: el de
 * `dades.email` el copia PerfilContext de la sessió sense dir si GoTrue l'ha
 * confirmat, i un DTO sense les claus de GoTrue saltaria la regla de
 * confirmació (esComptePersonaPilot). El compte remot de la persona pilot ja
 * porta el poble canònic a la fila (hidrataPerfilPersonaPilot, amb l'usuari
 * de sessió sencer).
 */
export function pobleDeReservaDeFitxa(identitat) {
  const mena = menaDeFitxa(identitat);
  if (!identitat || mena === 'agent') return '';
  const perfil = mena === 'persona'
    ? { tipus: 'persona', id: identitat.dades?.id, slug: identitat.dades?.slug }
    : { tipus: identitat.mena === 'grup' ? 'grup' : 'entitat', id: identitat.id };
  return clauFundacional(perfil) ? POBLE_FUNDACIONAL : '';
}

/* Pla 261018_1605 (Tasca 2, D5; ordre del Mestre, 18-10-2026) · Diversos
   pobles d'una persona viuen a la mateixa columna de text de sempre
   (profiles.town_name), com la cadena canònica 'A · B': el PRIMER és el poble
   principal. Cap columna nova (D10). Correcció de la revisió · llistaDePobles,
   formataPoble i poblePrincipal viuen a sections/pobles/nomsDelPoble.js (purs,
   sense el Perfil: també els lligen les notes i la pestanya «Gent de …»), i
   ací es tornen a exportar perquè cap importació del Perfil no canvie. */
export { formataPoble, llistaDePobles, poblePrincipal };

/**
 * El poble de la barra taronja i de la targeta:
 *   · la persona, el seu (dades.town_name, en la forma canònica: 'A · B' si
 *     en té més d'un);
 *   · una organització, el seu (dades.town_name), o cap: mai el de la persona
 *     (decisió del Mestre, 261008: l'organització tria el seu poble);
 *   · un agent IA, el seu o, si no en té, el de la persona que l'administra
 *     (`identitats`, com fa l'editor).
 * Gauntlet 261016 (Bloc 3.5.2) · Sense poble propi, la persona o
 * l'organització que és una de les tres identitats del Mestre porta el seu
 * (pobleDeReservaDeFitxa), com a la fitxa pública. La resta, com sempre.
 */
export function pobleDeFitxa(identitat, identitats = []) {
  const propi = formataPoble(identitat?.dades?.town_name);
  const mena = menaDeFitxa(identitat);
  if (mena === 'agent') {
    const persona = (identitats || []).find((i) => i?.mena === 'persona');
    return propi || formataPoble(persona?.dades?.town_name);
  }
  return propi || pobleDeReservaDeFitxa(identitat);
}

/**
 * Les píndoles de la fitxa: el rol i, si cal, l'estat que la fa de lectura o l'avís d'IA.
 * Directiva de Dignitat Humana (pla 261015_1900, Onada 1.1) · Una persona no
 * es categoritza: la seua fitxa no porta el rol («Persona»). Només, si cal,
 * l'estat que la fa de lectura («Baixa en curs», «Sense connexió»), que no és
 * cap categoria sinó un avís honest. L'organització i l'agent, com sempre.
 */
export function etiquetesDeFitxa(identitat) {
  const rol = menaDeFitxa(identitat) === 'persona' ? [] : [{ text: identitat?.rol }];
  if (enBaixa(identitat)) return [...rol, { text: 'Baixa en curs' }];
  if (deReserva(identitat)) return [...rol, { text: 'Sense connexió' }];
  if (menaDeFitxa(identitat) === 'agent') return [...rol, { text: ETIQUETA_IA }];
  return rol;
}
