import { RUTA_PROJECTE, rutaDAutoria, rutaDePerfil } from '../../config/navigation.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { menaDeFitxa } from './perfilCamps.js';

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
 *     a /projecte des del primer render;
 *   · un agent IA, a la seua fitxa (/perfil/:id).
 * Sense id, null: la barra queda sense enllaç.
 */
export function rutaDeFitxaPublica(identitat) {
  const mena = identitat?.mena;
  if (mena === 'persona') return rutaDePerfil('persona', identitat.dades?.id);
  if (mena === 'agent') return rutaDePerfil('ia', identitat.id);
  if (identitat?.id != null && slugDEntitat(identitat) === ENTITAT_PILOT_SLUG) return RUTA_PROJECTE;
  return rutaDAutoria({ tipus: mena === 'grup' ? 'grup' : 'entitat', id: identitat?.id });
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
 * El poble de la barra taronja i de la targeta:
 *   · la persona, el seu (dades.town_name);
 *   · una organització, el seu (dades.town_name), o cap: mai el de la persona
 *     (decisió del Mestre, 261008: l'organització tria el seu poble);
 *   · un agent IA, el seu o, si no en té, el de la persona que l'administra
 *     (`identitats`, com fa l'editor).
 */
export function pobleDeFitxa(identitat, identitats = []) {
  const propi = identitat?.dades?.town_name;
  const mena = menaDeFitxa(identitat);
  if (mena !== 'agent') return propi ? String(propi) : '';
  return String(propi
    || (identitats || []).find((i) => i?.mena === 'persona')?.dades?.town_name
    || '');
}

/** Les píndoles de la fitxa: el rol i, si cal, l'estat que la fa de lectura o l'avís d'IA. */
export function etiquetesDeFitxa(identitat) {
  const rol = { text: identitat?.rol };
  if (enBaixa(identitat)) return [rol, { text: 'Baixa en curs' }];
  if (deReserva(identitat)) return [rol, { text: 'Sense connexió' }];
  if (menaDeFitxa(identitat) === 'agent') return [rol, { text: ETIQUETA_IA }];
  return [rol];
}
