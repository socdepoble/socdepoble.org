/**
 * La Nevera de Casa · el magatzem local (sobre utils/magatzemLocal.js de P2).
 *
 * Tot l'estat és UN registre ({ id: 'estat', … }) d'un sol store: cada canvi
 * el reescriu sencer en una transacció. Una llista de la compra és menuda i
 * així el disc no pot quedar mai a mitges (una línia d'una llista esborrada,
 * un recent d'un article que ja no hi és). La llista blanca del store és
 * normalitzaEstat: res que no siga l'estat net arriba al disc.
 *
 * Una sola pestanya escriu (Web Locks); la resta llig i es posa al dia amb
 * l'avís de canvi (BroadcastChannel, sense cap valor). Sense base local
 * (navegació privada), treballa en memòria i ho diu (`persistent: false`).
 * Res d'això ix del dispositiu: cap crida de xarxa.
 */
import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { estatInicial, normalitzaEstat } from './nucli/index.js';

export const NOM_BASE = 'sdp-nevera';
export const VERSIO_BASE = 1;
export const STORE = 'nevera';
export const CLAU_ESTAT = 'estat';

/**
 * `opcions`: les de creaMagatzemIdb per a les proves (idb, navegador, Canal);
 * sense, el navegador de veres.
 */
export function creaMagatzemNevera(opcions = {}) {
  const base = creaMagatzemIdb({
    ...opcions,
    nom: NOM_BASE,
    versio: VERSIO_BASE,
    stores: { [STORE]: { clau: 'id' } },
    llistaBlanca: { [STORE]: (registre) => ({ id: CLAU_ESTAT, ...normalitzaEstat(registre) }) }
  });

  return Object.freeze({
    /** true mentre les dades van al disc; false si només viuen en esta pestanya. */
    get persistent() { return base.persistent; },
    /** 'lliure' · 'escriptora' · 'lectora' (una altra pestanya escriu). */
    get mode() { return base.mode; },
    /** L'estat desat (net) o, el primer dia, l'estat inicial. */
    async llegix() {
      const registre = await base.obte(STORE, CLAU_ESTAT);
      return registre ? normalitzaEstat(registre) : estatInicial();
    },
    /** Desa l'estat sencer; torna l'estat net tal com ha quedat al disc. */
    async desa(estat) {
      const desat = await base.desa(STORE, { ...estat, id: CLAU_ESTAT });
      return normalitzaEstat(desat);
    },
    obtinBloqueig: () => base.obtinBloqueig(),
    subscriu: (oient) => base.subscriu(oient),
    estatPersistencia: () => base.estatPersistencia(),
    demanaPersistencia: () => base.demanaPersistencia(),
    tanca: () => base.tanca()
  });
}
