/**
 * Lector de notícies · l'adaptador REMOT del port (fontNoticies.js). T5
 * (P1-07, 261024): les fonts territorials de veres.
 *
 * L'app continua sense xarxa: este adaptador no fa cap petició ni sap cap
 * adreça. Rep el servei de notícies del poble que dona la plataforma
 * (useServeiNoticies, de l'API pública), que demana cada feed pel seu id al
 * servei del backend, i analitza el text amb el nucli (analitzaFeed), com la
 * llavor. El navegador no toca mai l'origen d'una font.
 *
 *   creaAdaptadorRemot({ servei, persona, ttlMs, concurrencia, terminiMs, ara }) → {
 *     llistaFonts()                            → el catàleg del servei (una vegada) i,
 *                                                si el servei en sap, les fonts personals
 *     llistaArticles({ categoriaId, fontId })  → els resums de les fonts que han
 *                                                respost; mai es rebutja per una font
 *     article(id)                              → l'article sencer, o null
 *     salut()                                  → { caigudes: [{ fontId, motiu }], comprovat }
 *   }
 *
 * LA RONDA (llistaArticles). Cada font es demana a part (com Promise.allSettled):
 *   · com a molt `concurrencia` (4) peticions alhora;
 *   · un termini de `terminiMs` (12 s) per a tota la ronda: les fonts que encara
 *     no han respost (o ni han eixit de la cua) compten com a 'temps' i les que
 *     estaven en camí s'avorten;
 *   · una ronda nova avorta la vella, que es rebutja (el seu ganxo ja no la vol);
 *   · el que ha anat bé es guarda `ttlMs` (10 min) i no es torna a demanar; el
 *     que ha fallat no es guarda mai;
 *   · un text que el nucli no reconeix com a feed és el motiu 'font'.
 * Resol sempre amb les notícies que hi ha, també buida si han caigut totes; per
 * què han caigut ho diu salut(), que el port normalitza.
 *
 * L'ARTICLE. Si ja s'ha llegit el seu feed, d'ací; si no (un enllaç profund),
 * es busca la font pel prefix més llarg de l'id (<fontId>-<empremta>, nucli/ids.js),
 * se'n demana només eixe feed i, si no hi és, null.
 *
 * T5b (ordre del Mestre, 261024) · EL QUE TRIA LA PERSONA. `persona()` (el posa
 * AppLector, del magatzem de l'app) diu, en cada ronda, { noSeguides, personals }:
 *   · noSeguides: les fonts que ha deixat de seguir. No es demanen (ni compten com
 *     a caigudes): el servei no sap res d'una font apagada. Només una font demanada
 *     pel seu id (`fontId`) o un enllaç profund (article) la tornen a llegir;
 *   · personals: les fonts que ha afegit (el registre de fontsPersonals.js, amb
 *     { id, nom, url, categoriaId }). Si el servei en sap (feedPersonal), entren al
 *     catàleg com una font més, amb el seu id «meva-…», i es demanen pel MATEIX
 *     servei (feedPersonal(url, { signal })), mai pel navegador, amb la mateixa
 *     ronda, la mateixa memòria i les mateixes caigudes. Sense feedPersonal, no hi
 *     entren: queden a la gestió de fonts, pendents.
 * Sense `persona`, o mentre torna null, es seguixen totes i cap personal.
 */
import { MOTIUS_NOTICIES } from './fontNoticies.js';
import { analitzaFeed } from './nucli/index.js';

export const TTL_MS = 10 * 60 * 1000;
export const CONCURRENCIA = 4;
export const TERMINI_RONDA_MS = 12000;

const ambMotiu = (motiu) => Object.assign(new Error(`La font no ha respost (${motiu}).`), { motiu });
const motiuDe = (error) => (MOTIUS_NOTICIES.includes(error?.motiu) ? error.motiu : 'servidor');
const superada = () => Object.assign(new Error('Una ronda més nova ha avortat esta.'), { name: 'AbortError' });
/* La descripció d'una font personal a la gestió de fonts i a l'arbre. */
const DESCRIPCIO_PERSONAL = 'Una font que has afegit tu.';
const CAP_PERSONA = Object.freeze({ noSeguides: new Set(), personals: Object.freeze([]) });

/* El que diu la persona, net: un Set de fonts apagades i les seues fonts. Mai llança. */
function personaDe(persona) {
  let cru = null;
  try {
    cru = typeof persona === 'function' ? persona() : null;
  } catch {
    cru = null;
  }
  if (!cru || typeof cru !== 'object') return CAP_PERSONA;
  return {
    noSeguides: new Set(Array.isArray(cru.noSeguides) ? cru.noSeguides.filter((id) => typeof id === 'string') : []),
    personals: Array.isArray(cru.personals) ? cru.personals : []
  };
}

/* El lloc d'una font personal: l'origen de la seua adreça (d'on ve), o null. */
function llocDeLAdreca(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/* El resum d'un article: sense el contingut (com a la llavor). */
function resumDe(article) {
  const resum = { ...article };
  delete resum.contingutHtml;
  delete resum.mitjansOmesos;
  return resum;
}

export function creaAdaptadorRemot({
  servei, persona = null, ttlMs = TTL_MS, concurrencia = CONCURRENCIA, terminiMs = TERMINI_RONDA_MS, ara = () => Date.now()
} = {}) {
  if (typeof servei?.fonts !== 'function' || typeof servei?.feed !== 'function') {
    throw new TypeError('L’adaptador remot necessita el servei de notícies de la plataforma.');
  }
  const llegixPersonals = typeof servei.feedPersonal === 'function';
  let cataleg = null;
  /* fontId → adreça, de les fonts personals de l'última llista. */
  let adreces = new Map();
  /* fontId → { fins, articles }: l'última lectura bona de cada font. */
  const cau = new Map();
  let rondaViva = null;
  let salut = Object.freeze({ caigudes: Object.freeze([]), comprovat: null });

  /* Les fonts personals com a fonts del catàleg (si el servei en sap); actualitza `adreces`. */
  function fontsPersonals(personals, delSistema) {
    if (!llegixPersonals) {
      adreces = new Map();
      return [];
    }
    const preses = new Set(delSistema.map((font) => font.id));
    const noves = new Map();
    const fonts = [];
    for (const propia of personals) {
      if (typeof propia?.id !== 'string' || typeof propia.url !== 'string' || preses.has(propia.id) || noves.has(propia.id)) continue;
      noves.set(propia.id, propia.url);
      fonts.push({
        id: propia.id, nom: propia.nom, categoriaId: propia.categoriaId ?? null, descripcio: DESCRIPCIO_PERSONAL, lloc: llocDeLAdreca(propia.url)
      });
    }
    adreces = noves;
    return fonts;
  }

  function catalegDelServei() {
    if (!cataleg) {
      cataleg = Promise.resolve().then(() => servei.fonts()).then((cru) => ({
        categories: Array.isArray(cru?.categories) ? cru.categories : [],
        fonts: Array.isArray(cru?.fonts) ? cru.fonts : []
      }));
      /* Un catàleg que falla no es guarda: el pròxim intent el torna a demanar. */
      cataleg.catch(() => { cataleg = null; });
    }
    return cataleg;
  }

  function llistaFonts() {
    const { personals } = personaDe(persona);
    return catalegDelServei().then(({ categories, fonts }) => ({
      categories: [...categories],
      fonts: [...fonts.map((font) => ({ ...font })), ...fontsPersonals(personals, fonts)]
    }));
  }

  /* Els articles d'una font: de la memòria, si encara valen; si no, del servei. */
  async function articlesDe(font, signal) {
    const desat = cau.get(font.id);
    if (desat && desat.fins > ara()) return desat.articles;
    const dto = adreces.has(font.id)
      ? await servei.feedPersonal(adreces.get(font.id), { signal })
      : await servei.feed(font.id, { signal });
    const { font: delFeed, articles } = analitzaFeed(typeof dto?.xml === 'string' ? dto.xml : '', { fontId: font.id, base: font.lloc ?? null });
    if (!delFeed) throw ambMotiu('font');
    cau.set(font.id, { fins: ara() + ttlMs, articles });
    return articles;
  }

  /* La ronda: Map fontId → { articles } | { motiu }. Mai es rebutja. */
  function ronda(fonts, controlador) {
    return new Promise((resol) => {
      const resultats = new Map();
      let seguent = 0;
      let enCami = 0;
      let acabada = false;
      const acaba = () => {
        if (acabada) return;
        acabada = true;
        clearTimeout(termini);
        controlador.signal.removeEventListener('abort', acaba);
        for (const font of fonts) if (!resultats.has(font.id)) resultats.set(font.id, { motiu: 'temps' });
        controlador.abort();
        resol(resultats);
      };
      const termini = setTimeout(acaba, terminiMs);
      controlador.signal.addEventListener('abort', acaba);
      const llança = () => {
        while (!acabada && enCami < concurrencia && seguent < fonts.length) {
          const font = fonts[seguent];
          seguent += 1;
          enCami += 1;
          articlesDe(font, controlador.signal).then(
            (articles) => { if (!acabada) resultats.set(font.id, { articles }); },
            (error) => { if (!acabada) resultats.set(font.id, { motiu: motiuDe(error) }); }
          ).finally(() => {
            enCami -= 1;
            if (acabada) return;
            if (resultats.size === fonts.length) acaba();
            else llança();
          });
        }
      };
      if (fonts.length === 0) acaba();
      else llança();
    });
  }

  async function llistaArticles({ categoriaId = null, fontId = null } = {}) {
    const { noSeguides } = personaDe(persona);
    const { fonts } = await llistaFonts();
    /* Una font apagada no es demana, llevat que es demane ella pel seu id. */
    const triades = fonts.filter((font) => (!categoriaId || font.categoriaId === categoriaId) && (fontId ? font.id === fontId : !noSeguides.has(font.id)));
    rondaViva?.abort();
    const controlador = new AbortController();
    rondaViva = controlador;
    const resultats = await ronda(triades, controlador);
    if (rondaViva !== controlador) throw superada();
    rondaViva = null;
    const caigudes = [];
    const resums = [];
    for (const font of triades) {
      const resultat = resultats.get(font.id);
      if (resultat?.articles) resums.push(...resultat.articles.map(resumDe));
      else caigudes.push(Object.freeze({ fontId: font.id, motiu: resultat?.motiu || 'servidor' }));
    }
    salut = Object.freeze({ caigudes: Object.freeze(caigudes), comprovat: ara() });
    return resums;
  }

  function delaMemoria(id) {
    for (const { articles } of cau.values()) {
      const trobat = articles.find((article) => article.id === id);
      if (trobat) return { ...trobat };
    }
    return null;
  }

  async function article(id) {
    const desat = delaMemoria(id);
    if (desat) return desat;
    const { fonts } = await llistaFonts();
    const font = fonts.filter((candidata) => typeof id === 'string' && id.startsWith(`${candidata.id}-`))
      .sort((a, b) => b.id.length - a.id.length)[0];
    if (!font) return null;
    const vigent = cau.get(font.id);
    if (vigent && vigent.fins > ara()) return null;
    await articlesDe(font, undefined);
    return delaMemoria(id);
  }

  return Object.freeze({ llistaFonts, llistaArticles, article, salut: async () => salut });
}
