/* B8C-1 (marató 261101_2143; Bloc B8, D-B8C-1) · On porta el toc d'un avís
   push del Xat, sense que el servei de push sàpia mai el fil. L'avís és cec:
   el worker obri sempre la mateixa ruta neutra (CAMI_AVIS_XAT) i el toc natiu
   no porta cap dada que es llija. El destí es calcula ací, amb els fils de la
   sessió ACTUAL: un avís vell d'una altra persona, tocat per qui ara és dins,
   obri els no llegits de qui és dins i no deixa res de l'anterior.
   Pur i sense cap import. */

export const PARAM_AVIS = 'obri';
export const VALOR_AVIS = 'no-llegits';
/** La ruta neutra de l'avís (la mateixa que public/sw.js: B8C-3 en prova la paritat). */
export const CAMI_AVIS_XAT = `/xat?${PARAM_AVIS}=${VALOR_AVIS}`;

const PREFIX_PER_DEFECTE = 'sdp-per-defecte:';

/**
 * Cert si la ruta és la de l'avís: '/xat' (o '/xat/') amb obri=no-llegits.
 * `search` amb o sense '?' (useLocation().search no el porta).
 */
export function esRutaDeLAvis(pathname, search) {
  if (pathname !== '/xat' && pathname !== '/xat/') return false;
  if (typeof search !== 'string' || search === '') return false;
  try {
    return new URLSearchParams(search).get(PARAM_AVIS) === VALOR_AVIS;
  } catch {
    return false;
  }
}

/* L'identificador d'un fil com a text no buit, o null. */
function idDe(fil) {
  const id = fil.id;
  if (typeof id === 'string') return id.trim() ? id : null;
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  return null;
}

/* Un fil que pot haver dut l'avís: un missatge nou de veres en una conversa
   on la persona participa i que no ha apartat (silenci, arxiu, bloqueig). La
   marca «no llegit» que posa la persona a mà no és cap missatge nou, i una
   comunitat és un contenidor sense missatges propis. */
function esCandidat(fil) {
  if (!fil || typeof fil !== 'object') return false;
  const id = idDe(fil);
  if (id === null || id.startsWith(PREFIX_PER_DEFECTE)) return false;
  if (fil.silenciat || fil.arxivat || fil.perDefecte || fil.bloquejat) return false;
  if (fil.participant === false || fil.tipus === 'comunitat' || fil.esComunitat) return false;
  const noLlegits = Number(fil.noLlegits);
  return Number.isFinite(noLlegits) && noLlegits > 0;
}

/**
 * El destí del toc amb els fils de la sessió actual:
 *   · exactament una conversa amb missatges nous → '/xat/<id codificat>';
 *   · més d'una → '/xat' (la llista ja ressalta els no llegits);
 *   · cap → null: qui ja llig la conversa de l'avís no en surt.
 */
export function destiDelToc(fils) {
  if (!Array.isArray(fils)) return null;
  const ids = new Set();
  for (const fil of fils) {
    if (esCandidat(fil)) ids.add(idDe(fil));
    if (ids.size > 1) return '/xat';
  }
  if (ids.size === 0) return null;
  const [id] = ids;
  return `/xat/${encodeURIComponent(id)}`;
}
