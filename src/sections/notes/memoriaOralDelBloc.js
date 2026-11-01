/**
 * memoriaOralDelBloc.js — L'adaptador del Bloc de Notes per a la fitxa de
 * memòria oral de «🎴 Proposa Card» (T3.2, marató 261101; IDEA-29 i IDEA-41
 * del Llibre Mestre).
 *
 * DocumentEditor no importa cap secció (C06): rep d'ací, per la clau
 * `memoriaOral` de l'adaptador, les dues funcions que necessita, ja lligades
 * a la sessió i als pobles del Bloc:
 *  · estructura(contingut): la fitxa d'una nota { title, subtitle, lead,
 *    content } (estructuraMemoriaOral), amb l'hora del clic (`ara`), un autor
 *    humà (`autor`, si hi ha sessió) i els pobles que coneix l'aplicació;
 *  · revisa(fitxa, correccio): «L'he revisada» (marcaRevisioHumana), que
 *    només es pot fer amb sessió; null sense sessió, perquè ningú no signa
 *    per ningú. `correccio` (opcional, Gauntlet 261101, B2-04) porta el que
 *    la persona ha corregit al diàleg abans de signar: { etiquetes, municipi }.
 *    Només passen eixes dues claus: qui signa i quan, els posa l'adaptador.
 * L'hora es llig quan es crida, no quan es crea l'adaptador: el motor és pur
 * i no llig mai el rellotge.
 *
 * PRIVACITAT (Gauntlet 2, 261101, G2-MO-08). El fitxer OKF es pensa per a
 * compartir-lo o catalogar-lo, i porta el testimoni d'una persona, sovint
 * gran: l'identificador intern del compte de la sessió (l'id d'autenticació)
 * no hi va mai. `sources[].author` i `verified[].by` hi porten un actor humà
 * sense identificador, `human:sense-identificador` (PERSONA_SENSE_IDENTIFICADOR):
 * diu que ho ha escrit i revisat una persona (OKF v0.2 §5.3,
 * «human-reviewed»), però no qui. La sessió només decidix si es pot signar.
 * És una decisió reversible, pendent del Mestre: signar amb l'identificador
 * públic de l'actor (l'àlies del perfil) o no posar autor en l'esborrany són
 * les alternatives, i només canviaria esta constant o el que es passa ací.
 *
 * No hi va `recurs`: una nota del Bloc no té cap URL pública pròpia, i la
 * font queda descrita com a nota sense URL (FONT_SENSE_URL de memoriaOral.js).
 */
import { estructuraMemoriaOral, marcaRevisioHumana } from './proposaCard.js';

/** L'actor humà del fitxer: `human:sense-identificador`, mai l'id del compte. */
export const PERSONA_SENSE_IDENTIFICADOR = 'sense-identificador';

const rellotgeDelSistema = () => new Date();

/* Cert si hi ha sessió: un identificador de compte com els que admet el motor
   (lletres, xifres, «.», «_» o «-», sense espais), demanat al motor amb un
   relat buit (no analitza res). No s'escriu enlloc: només obri la signatura. */
function hiHaSessio(id) {
  if (id === undefined || id === null || id === '') return false;
  try {
    estructuraMemoriaOral('', { autor: String(id) });
    return true;
  } catch {
    return false;
  }
}

/**
 * L'adaptador de la fitxa per a DocumentEditor.
 *  · persona: l'id del compte de la sessió (null o absent: sense sessió); no
 *    arriba mai al fitxer;
 *  · pobles: la llista de pobles de l'aplicació (useCoreContent().towns);
 *    buida o absent, la llavor del codi (townsSeed.js), la de memoriaOral.js;
 *  · rellotge: () => Date, per a les proves.
 * Torna, immutable: { estructura(contingut), revisa: ((fitxa, correccio) => fitxa) | null }.
 */
export function memoriaOralDelBloc({ persona = null, pobles, rellotge = rellotgeDelSistema } = {}) {
  const ambSessio = hiHaSessio(persona);
  const llista = Array.isArray(pobles) && pobles.length ? pobles : undefined;
  return Object.freeze({
    estructura: (contingut) => estructuraMemoriaOral(contingut, {
      ara: rellotge(),
      ...(ambSessio ? { autor: PERSONA_SENSE_IDENTIFICADOR } : {}),
      ...(llista ? { pobles: llista } : {})
    }),
    revisa: ambSessio
      ? (fitxa, correccio) => marcaRevisioHumana(fitxa, {
        etiquetes: correccio?.etiquetes,
        municipi: correccio?.municipi,
        persona: PERSONA_SENSE_IDENTIFICADOR,
        ara: rellotge()
      })
      : null
  });
}
