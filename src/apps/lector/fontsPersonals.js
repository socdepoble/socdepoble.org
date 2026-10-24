/**
 * Lector de notícies · l'API pública mínima de les fonts personals (SN, 261003).
 *
 * Per ací entra al Lector un enllaç de fora (el Snippet Curador del Bloc): la
 * persona l'apunta com una font seua, que queda PENDENT DEL CONNECTOR. L'app
 * no baixa res per ella mateixa (Model B): quan l'amfitrió o el servidor la
 * servisquen, les seues notícies entraran pel port. T5b (261024) · El servei
 * de notícies del poble ja les servix: el port del servei (fontRemota.js) les
 * llig d'este mateix registre i les demana pel servei, mai pel navegador.
 *
 *   creaFontsPersonals({ obriMagatzem, font }) → {
 *     nomMaxim                        el límit del nom (LIMITS_MODEL.nom)
 *     categories()                    → [{ id, nom }]: les del poble (el port), [] sense port
 *     llistaFontsPersonals()          → [font personal]
 *     afigFontPersonal({ url, nom, categoriaId })
 *                                     → la font desada; si no val, llança un
 *                                       Error amb el motiu, `codi` i `camp`
 *     llevaFontPersonal(id)           → true si l'ha llevada
 *   Afegir i llevar exigixen el disc: sense base local (navegació privada,
 *   dades bloquejades) llancen el motiu 'no-persistent' i no escriuen res
 *   (correcció SN-R2: mai un «afegida» que es perd).
 *   }
 *   destinacioDe(api)      la forma que espera la plataforma
 *                          (plataforma/destinacions.js): { nomMaxim,
 *                          categories(), afig() → { id, nom, trams } }; els
 *                          trams porten a la font, a l'arbre de les notícies
 *                          (261024: la gestió de fonts ja no és cap pàgina)
 *                          AppLector l'exporta com a `destinacioEnllac`
 *   llevaDelMagatzem(magatzem, id) → { llevada, registre }
 *                          Peça C (ordre del Mestre, 261007, prompt
 *                          261007_1628) · L'ÚNICA implementació de llevar
 *                          una font personal. La fan servir
 *                          llevaFontPersonal (amb un magatzem de pas, després
 *                          d'exigir el disc) i useFontsPersonals (amb el
 *                          magatzem de l'app). Abans cadascun en tenia una
 *                          còpia. La guarda del disc no hi va dins: el
 *                          magatzem de l'app no la necessita (vegeu
 *                          useFontsPersonals.js)
 *
 * `obriMagatzem()`: un magatzem nou (magatzem.js) per a cada operació, que es
 * tanca en acabar. No demana el bloqueig d'escriptura: les fonts personals
 * van en un registre a banda i cada canvi és UNA transacció de lectura i
 * escriptura (actualitzaPersonals), de manera que un Lector obert en una
 * altra pestanya no les xafa ni les perd, i se n'assabenta per l'avís de
 * canvi. `font()`: el port de notícies (fontNoticies.js) o null; es demana
 * una sola vegada i només per a les categories.
 * Res ix del dispositiu: cap crida de xarxa.
 */
import {
  HUI, LIMITS_MODEL, MOTIUS_PERSONAL, afigPersonal, llevaPersonal, validaFontPersonal
} from './nucli/index.js';

/** On es veu una font personal dins de l'app: l'arbre de les notícies (rutes.js · RUTES_NOTICIES).
    Ordre del Mestre (261024, 15:05) · Abans, la gestió de fonts (/fonts/colleccio), que ja no és
    cap pàgina: les fonts viuen a l'arbre. La destinació hi afig la carpeta i la font. */
export const TRAMS_GESTIO = Object.freeze(['noticies']);

/** Un error amb el motiu dit a la persona, el seu `codi` i el `camp` del formulari. */
function errorDe(codi) {
  const motiu = MOTIUS_PERSONAL[codi];
  return Object.assign(new Error(motiu.text), { codi, camp: motiu.camp });
}

/**
 * Peça C (261007) · Lleva la font `id` en UNA transacció de lectura i
 * escriptura (actualitzaPersonals). Torna si l'ha llevada i el registre net
 * tal com ha quedat al disc (o a la memòria del magatzem). No mira el disc:
 * qui la crida sap quin magatzem té.
 */
export async function llevaDelMagatzem(magatzem, id) {
  let llevada = false;
  const registre = await magatzem.actualitzaPersonals((actual) => {
    const despres = llevaPersonal(actual, id);
    llevada = despres !== actual;
    return despres;
  });
  return { llevada, registre };
}

export function creaFontsPersonals({ obriMagatzem, font = () => null } = {}) {
  if (typeof obriMagatzem !== 'function') throw new TypeError('Les fonts personals necessiten obriMagatzem().');
  let port;
  const elPort = () => {
    if (port === undefined) port = (typeof font === 'function' ? font() : font) || null;
    return port;
  };

  /* Una operació amb un magatzem de pas: s'obri i es tanca sempre. */
  async function amb(operacio) {
    const magatzem = obriMagatzem();
    try {
      return await operacio(magatzem);
    } finally {
      magatzem.tanca();
    }
  }

  /* Correcció SN-R2 · Una escriptura només si arriba al disc. El magatzem de
     pas, sense IndexedDB, escriuria en la seua memòria i es tancaria tot
     seguit: la font es perdria i la persona creuria que l'ha afegida. */
  async function exigixDisc(magatzem) {
    if (!(await magatzem.prepara())) throw errorDe('no-persistent');
  }

  async function categories() {
    const delPoble = elPort();
    if (!delPoble) return [];
    const { categories: llista } = await delPoble.llistaFonts();
    return llista.map(({ id, nom }) => ({ id, nom }));
  }

  return Object.freeze({
    nomMaxim: LIMITS_MODEL.nom,
    categories,

    llistaFontsPersonals: () => amb(async (magatzem) => (await magatzem.llegixPersonals()).fonts),

    async afigFontPersonal(entrada) {
      /* La categoria només es contrasta amb el port si n'arriba una. */
      const demanada = entrada?.categoriaId;
      const ids = demanada === undefined || demanada === null || demanada === '' ? [] : (await categories()).map((c) => c.id);
      const validada = validaFontPersonal(entrada, ids);
      if (!validada.ok) throw errorDe(validada.motiu);
      return amb(async (magatzem) => {
        await exigixDisc(magatzem);
        let motiu = null;
        await magatzem.actualitzaPersonals((registre) => {
          const resultat = afigPersonal(registre, validada.font);
          motiu = resultat.motiu;
          return resultat.registre;
        });
        if (motiu) throw errorDe(motiu);
        return validada.font;
      });
    },

    llevaFontPersonal: (id) => amb(async (magatzem) => {
      await exigixDisc(magatzem);
      return (await llevaDelMagatzem(magatzem, id)).llevada;
    })
  });
}

/** La destinació d'enllaços de fora (plataforma/destinacions.js) sobre l'API. */
export function destinacioDe(api) {
  return Object.freeze({
    nomMaxim: api.nomMaxim,
    categories: () => api.categories(),
    async afig(entrada) {
      const font = await api.afigFontPersonal(entrada);
      return { id: font.id, nom: font.nom, trams: [...TRAMS_GESTIO, font.categoriaId || HUI, font.id] };
    }
  });
}
