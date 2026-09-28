/**
 * correuOrganitzacio.js — El correu opcional d'una organització (T43, ordre
 * del Mestre, 260928). Funcions pures, sense xarxa ni React: les usen els
 * adaptadors (supabase/organizations.js, localPerfils.js) i la interfície.
 *
 * MODEL (dos valors):
 *   · `correu`: el correu propi de l'organització. PRIVAT: només el veuen i
 *     l'editen les persones que l'administren (owner/admin).
 *   · `public`: «Mostrar-lo a la fitxa pública». Opt-in, desactivat per
 *     defecte. Sense correu no hi ha res a mostrar, i per tant és false.
 *   · `perDefecte`: d'on ix el correu dels avisos quan no n'hi ha de propi
 *     ({ origen: 'creador' | 'propietaria' | 'cap', correu }). El correu
 *     d'una altra persona MAI arriba al client (RGPD, minimització): només
 *     ve ple si qui mira n'és la titular.
 */

/* Una forma conservadora: sense espais ni caràcters que en un `mailto:`
   obririen capçaleres (`?`, `&`, `%`, `=`). Un correu rar però vàlid
   segons l'RFC es rebutja: millor un «escriu-lo d'una altra manera» que
   un enllaç injectable. */
const RE_CORREU = /^[A-Za-z0-9._+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
export const LIMIT_CORREU = 254;
export const ORIGENS_PER_DEFECTE = Object.freeze(['creador', 'propietaria', 'cap']);

/** El correu tal com es desa: sense espais als extrems i en minúscules. */
export function normalitzaCorreu(valor) {
  return String(valor ?? '').trim().toLowerCase();
}

/** true si el correu té una forma vàlida. Buit NO és vàlid (buit vol dir «cap»). */
export function validaCorreu(valor) {
  const correu = String(valor ?? '').trim();
  return correu.length > 0 && correu.length <= LIMIT_CORREU && RE_CORREU.test(correu);
}

/**
 * Normalitza la resposta d'un adaptador: cap camp desconegut, cap correu
 * públic sense correu, cap origen inventat.
 */
export function normalitzaContacte(dades) {
  const correu = typeof dades?.correu === 'string' ? normalitzaCorreu(dades.correu) : '';
  const origen = ORIGENS_PER_DEFECTE.includes(dades?.perDefecte?.origen) ? dades.perDefecte.origen : 'cap';
  const correuPerDefecte = typeof dades?.perDefecte?.correu === 'string' && dades.perDefecte.correu.trim()
    ? dades.perDefecte.correu.trim()
    : null;
  return {
    correu,
    public: Boolean(dades?.public) && Boolean(correu),
    perDefecte: { origen, correu: origen === 'cap' ? null : correuPerDefecte }
  };
}
