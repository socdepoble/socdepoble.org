/**
 * Plataforma d'Apps Enxufables · els interruptors (funcions pures).
 *
 * estatApp(manifest, ctx) diu en quin estat és una app en este node, per a
 * esta persona i en este document:
 *   'disabled'     · apagada (pel build, per l'entorn, per l'amfitrió o per la persona);
 *   'unavailable'  · encesa, però el node no la pot servir (capacitat del
 *                    backend absent, o dades de salut o financeres en un
 *                    document que no és nostre);
 *   'unsubscribed' · premium i este node no en té el dret;
 *   'available'    · es pot obrir.
 * avaluaApp torna el mateix estat i el `motiu`, per a explicar-lo a la persona.
 *
 * LES CAPES, de més autoritat a menys:
 *   0. Build      · una app interna amb `carrega` null no és al paquet. El
 *                   literal de compilació viu al manifest (import.meta.env.DEV ||
 *                   import.meta.env.VITE_SDP_APP_<ID> === '1'): Vite la trau del build.
 *                   Una externa o un mòdul (sdp.modul.v1) no hi passen: el
 *                   seu codi no és del paquet, el porta l'amfitrió.
 *      Entorn     · 'desenvolupament' no es carrega mai en producció.
 *   1. Poble      · FUTURA. L'autoritat és el servidor (una capacitat `apps`
 *                   del contracte, servida amb RLS per tenant UUID). És l'única
 *                   que podrà concedir un premium; el client només presenta.
 *   2. Amfitrió   · ctx.declaradesPerAmfitrio: llista d'ids o undefined. Si
 *                   l'amfitrió en declara una llista, només esta s'encén. El
 *                   canal (clau `apps` de CLAUS_PERMESES) l'endolla el lot WP.
 *                   Sense declaració: actiuPerDefecte en producció; tot el
 *                   compilat en desenvolupament.
 *   3. Persona    · ctx.preferencies (getVal/setVal, preferenciesApps.js).
 *                   NOMÉS POT APAGAR: mai encén una app apagada ni un premium.
 *
 * Res de patrons foscos: una app premium sense dret diu la veritat
 * (motiu 'sense-dret'), no s'amaga ni es disfressa.
 */

export const ESTATS_APP = Object.freeze(['disabled', 'unavailable', 'unsubscribed', 'available']);

const CAP = () => false;
const BUIDES = Object.freeze({ apps: Object.freeze({}), interruptors: Object.freeze({}) });

/* Dades personals que només s'obrin quan l'App és l'ama del document, i el
   motiu que ho explica. Dins d'un WordPress o de l'iframe d'un tercer,
   l'IndexedDB és de l'origen de l'amfitrió i la poden llegir tots els seus
   connectors i scripts. Les financeres, des de l'Onada 6 (261009): la
   Gestoria mai dins d'una web d'un altre. */
const NOMES_AL_DOCUMENT_PROPI = Object.freeze({
  salut: 'document-no-propi',
  financeres: 'document-no-propi-financeres'
});

function valor(estat, motiu) {
  return Object.freeze({ estat, motiu });
}

/** Encesa abans de la persona: build, entorn i amfitrió. */
function base(manifest, ctx) {
  if (manifest.origen === 'interna' && typeof manifest.carrega !== 'function') return 'no-compilada';
  if (manifest.entorn === 'desenvolupament' && ctx.produccio !== false) return 'entorn-desenvolupament';
  if (Array.isArray(ctx.declaradesPerAmfitrio)) {
    return ctx.declaradesPerAmfitrio.includes(manifest.id) ? null : 'amfitrio-no-la-declara';
  }
  if (manifest.actiuPerDefecte === true || ctx.produccio === false) return null;
  return 'apagada-per-defecte';
}

/**
 * L'estat i el motiu d'una app.
 * @param {object} manifest manifest validat (manifestApp.js)
 * @param {{ produccio?: boolean, declaradesPerAmfitrio?: string[], preferencies?: object,
 *           teCapacitat?: (nom: string) => boolean, teDret?: (dret: string) => boolean,
 *           amaDelDocument?: boolean }} ctx
 */
export function avaluaApp(manifest, ctx = {}) {
  const apagada = base(manifest, ctx);
  if (apagada) return valor('disabled', apagada);
  const preferencies = ctx.preferencies || BUIDES;
  if (preferencies.apps?.[manifest.id] === false) return valor('disabled', 'persona-apagada');
  const teCapacitat = typeof ctx.teCapacitat === 'function' ? ctx.teCapacitat : CAP;
  if (!manifest.capacitats.every((capacitat) => teCapacitat(capacitat))) return valor('unavailable', 'sense-capacitat');
  const nomesAlDocumentPropi = Object.hasOwn(NOMES_AL_DOCUMENT_PROPI, manifest.dadesPersonals)
    ? NOMES_AL_DOCUMENT_PROPI[manifest.dadesPersonals] : null;
  if (nomesAlDocumentPropi && ctx.amaDelDocument !== true) return valor('unavailable', nomesAlDocumentPropi);
  const teDret = typeof ctx.teDret === 'function' ? ctx.teDret : CAP;
  if (manifest.nivell === 'premium' && !teDret(manifest.dret)) return valor('unsubscribed', 'sense-dret');
  return valor('available', null);
}

export function estatApp(manifest, ctx) {
  return avaluaApp(manifest, ctx).estat;
}

/** Pot la persona tocar l'interruptor d'esta app? Només si la resta de capes l'encenen. */
export function personaPotApagar(manifest, ctx = {}) {
  return base(manifest, ctx) === null;
}

/**
 * Un interruptor intern d'una app (manifest.interruptors). Les mateixes regles:
 * la persona només apaga; un interruptor premium necessita el seu dret.
 * @returns {{ estat: string, motiu: string|null, actiu: boolean }}
 */
export function avaluaInterruptor(manifest, id, ctx = {}) {
  const interruptor = manifest.interruptors.find((candidat) => candidat.id === id);
  if (!interruptor) return Object.freeze({ estat: 'disabled', motiu: 'desconegut', actiu: false });
  const preferencies = ctx.preferencies || BUIDES;
  const resultat = (estat, motiu) => Object.freeze({ estat, motiu, actiu: estat === 'available' });
  if (!interruptor.actiuPerDefecte) return resultat('disabled', 'apagat-per-defecte');
  if (preferencies.interruptors?.[manifest.id]?.[id] === false) return resultat('disabled', 'persona-apagat');
  const teDret = typeof ctx.teDret === 'function' ? ctx.teDret : CAP;
  if (interruptor.nivell === 'premium' && !teDret(interruptor.dret)) return resultat('unsubscribed', 'sense-dret');
  return resultat('available', null);
}

/**
 * Llista d'apps que declara l'amfitrió: una cadena separada per espais o una
 * llista, només amb ids en forma de slug. Torna una llista congelada o
 * undefined (cap declaració). Res més passa.
 */
export function sanejaAppsDeclarades(valorAmfitrio) {
  let ids;
  if (typeof valorAmfitrio === 'string') ids = valorAmfitrio.split(/\s+/).filter(Boolean);
  else if (Array.isArray(valorAmfitrio)) ids = valorAmfitrio;
  else return undefined;
  const nets = ids.filter((id) => typeof id === 'string' && /^[a-z][a-z0-9-]{1,30}$/.test(id));
  return Object.freeze([...new Set(nets)].slice(0, 50));
}

/**
 * L'app és l'ama del document: el mateix criteri que esAmaDelDocument de
 * src/hooks/RouteTelemetria.jsx (manageDocumentHead === true, sense
 * window.__SDP_EMBEDDED__ i fora d'un iframe). fronteres.test.js vigila que
 * els dos criteris no divergisquen.
 */
export function esAmaDelDocument(externalConfig, finestra = typeof window === 'undefined' ? undefined : window) {
  if (!finestra) return false;
  if (externalConfig?.manageDocumentHead !== true || finestra.__SDP_EMBEDDED__) return false;
  try { return finestra.self === finestra.top; } catch { return false; }
}
