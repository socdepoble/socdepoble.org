/**
 * Lector de notícies · l'API pública mínima de les fonts personals (SN, 261003).
 *
 * Per ací entra al Lector un enllaç de fora (el Snippet Curador del Bloc): la
 * persona l'apunta com una font seua, que queda PENDENT DEL CONNECTOR. L'app
 * no baixa res per ella mateixa (Model B): quan l'amfitrió o el servidor la
 * servisquen, les seues notícies entraran pel port.
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
 *                          trams porten a la gestió de fonts, on es veu.
 *                          AppLector l'exporta com a `destinacioEnllac`
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
  LIMITS_MODEL, MOTIUS_PERSONAL, afigPersonal, llevaPersonal, validaFontPersonal
} from './nucli/index.js';

/** On es veu una font personal dins de l'app: la gestió de fonts (rutes.js). */
export const TRAMS_GESTIO = Object.freeze(['fonts', 'colleccio']);

/** Un error amb el motiu dit a la persona, el seu `codi` i el `camp` del formulari. */
function errorDe(codi) {
  const motiu = MOTIUS_PERSONAL[codi];
  return Object.assign(new Error(motiu.text), { codi, camp: motiu.camp });
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
      let llevada = false;
      await magatzem.actualitzaPersonals((registre) => {
        const despres = llevaPersonal(registre, id);
        llevada = despres !== registre;
        return despres;
      });
      return llevada;
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
      return { id: font.id, nom: font.nom, trams: [...TRAMS_GESTIO] };
    }
  });
}
