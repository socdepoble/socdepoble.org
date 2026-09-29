/* ═══════════════════════════════════════════════════════════════════
   LÍMITS DE TEXT · font única al client (T49, ordre del Mestre, 260928)

   Es compten en caràcters de veres, com char_length de Postgres, no en
   unitats UTF-16: «🌾» és 1. Mòdul pur, sense React ni xarxa, perquè el
   puguen importar la capa de dades i les seccions sense dependre l'una
   de l'altra.

   El CHECK de la base de dades el fixa
   supabase/migrations/2609281500_lema_entradilla_256.sql (el de
   l'emoticona, 2609282035_perfil_emoticona.sql); la prova
   limitsText.test.js vigila que tots dos diguen el mateix.
   ═══════════════════════════════════════════════════════════════════ */

/** Entradilla = lema: profiles i organizations (i els agents, en local). */
export const MAXIM_LEMA = 256;

/** T66 · L'emoticona de la fitxa de la persona (profiles.icon): un sol emoji,
    que en punts de codi no passa de 16 (CHECK profiles_icon_llargaria de
    supabase/migrations/2609282035_perfil_emoticona.sql). */
export const MAXIM_EMOTICONA = 16;

/** T50 · Fracció del límit a partir de la qual es veu el comptador
    («205 de 256»): l'editor del Perfil i l'espècimen del catàleg. */
export const LLINDAR_COMPTADOR = 0.8;
