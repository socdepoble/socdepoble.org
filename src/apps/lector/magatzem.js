/**
 * Lector de notícies · el magatzem local (sobre utils/magatzemLocal.js de P2,
 * com la Nevera i el Bar).
 *
 * Tot l'estat de la persona és UN registre ({ id: 'estat', … }): què ha
 * llegit, què ha desat per a després i quines fonts ha deixat de seguir.
 * Cada canvi el reescriu sencer en una transacció, i la llista blanca del
 * store és normalitzaEstat: res que no siga l'estat net arriba al disc.
 *
 * SN (261003) · Les fonts que afig la persona (nucli/personals.js) van en un
 * SEGON registre del mateix store ({ id: 'fonts-personals', … }), amb la seua
 * llista blanca (normalitzaPersonals). Van a banda perquè la pestanya que
 * escriu l'estat el reescriu sencer des de la memòria: si hi anaren dins, un
 * Lector obert en una altra pestanya les xafaria. Es canvien sempre amb
 * actualitzaPersonals, que llig i escriu en UNA transacció (`actualitza` del
 * motor): el Snippet Curador i el Lector poden escriure-hi sense perdre res.
 * Cap versió nova de la base: el store és el mateix.
 *
 * Una sola pestanya escriu (Web Locks); la resta llig i es posa al dia amb
 * l'avís de canvi (BroadcastChannel, sense cap valor). Sense base local
 * (navegació privada), treballa en memòria i ho diu (`persistent: false`).
 * Res d'això ix del dispositiu: cap crida de xarxa.
 */
import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { estatInicial, normalitzaEstat, normalitzaPersonals } from './nucli/index.js';

export const NOM_BASE = 'sdp-lector';
export const VERSIO_BASE = 1;
export const STORE = 'lector';
export const CLAU_ESTAT = 'estat';
export const CLAU_PERSONALS = 'fonts-personals';

/* La llista blanca del store: cada registre, per la seua clau. */
function registreNet(registre) {
  if (registre?.id === CLAU_PERSONALS) return { id: CLAU_PERSONALS, ...normalitzaPersonals(registre) };
  return { id: CLAU_ESTAT, ...normalitzaEstat(registre) };
}

/**
 * `opcions`: les de creaMagatzemIdb per a les proves (idb, navegador, Canal);
 * sense, el navegador de veres.
 */
export function creaMagatzemLector(opcions = {}) {
  const base = creaMagatzemIdb({
    ...opcions,
    nom: NOM_BASE,
    versio: VERSIO_BASE,
    stores: { [STORE]: { clau: 'id' } },
    llistaBlanca: { [STORE]: registreNet }
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
    /** Les fonts personals desades (el registre net; buit el primer dia). */
    async llegixPersonals() {
      return normalitzaPersonals(await base.obte(STORE, CLAU_PERSONALS));
    },
    /**
     * Aplica `operacio(registre)` (pura i síncrona: torna el registre nou o
     * el mateix si no canvia res) dins d'una sola transacció de lectura i
     * escriptura. Torna el registre net tal com ha quedat al disc.
     */
    async actualitzaPersonals(operacio) {
      const desat = await base.actualitza(STORE, CLAU_PERSONALS, (actual) => {
        const abans = normalitzaPersonals(actual);
        const despres = operacio(abans);
        return despres === abans ? undefined : { ...despres, id: CLAU_PERSONALS };
      });
      return normalitzaPersonals(desat);
    },
    /**
     * Obri la base una vegada i diu si les dades arriben al disc (true) o
     * només viurien en la memòria d'esta instància (false: navegació privada,
     * dades del lloc bloquejades). Correcció SN-R2: les fonts personals ho
     * miren abans d'escriure.
     */
    prepara: () => base.prepara(),
    obtinBloqueig: () => base.obtinBloqueig(),
    subscriu: (oient) => base.subscriu(oient),
    tanca: () => base.tanca()
  });
}
