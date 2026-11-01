/**
 * conversesLocal.js — El Xat de l'adaptador local (T1 · D01): el nucli del
 * Xat, el xat de pàgina i, sense servidor, els rebuigs honestos dels adjunts
 * privats ('xatMultimedia') i del transport E2EE ('clausXat' i
 * 'xatMultimediaXifrat').
 *
 * Compon localXat.js, que fa de servidor (seq, idempotència per id, marques,
 * padró, comunitats i la resposta de la IAIA), amb la configuració d'abast
 * d'esta instància: el seu tenantId separa el magatzem del de qualsevol altre
 * adaptador; els canals compartixen el mateix abast de poble i persona. Com supabase/xat.js
 * en seed, la llista porta les files d'ajuda
 * que hi falten (ambXatsPerDefecte) i marcaLlegit normalitza els cursors
 * abans d'arribar al magatzem. Les altes del canal es registren a la
 * instància: destroy() i logout() tanquen les que ja estan registrades. Una
 * alta en vol en el mateix tic que logout() pot sobreviure (T1-V01); la de
 * destroy() no, perquè la guarda d'adaptadorLocal la desfà, com la d'una
 * crida avortada.
 */
import { createLocalXatAdapter } from '../localXat.js';
import { ambXatsPerDefecte } from '../xatsPerDefecte.js';
import { errorAdjuntXat } from '../xatMultimedia.js';
import { CAPACITATS } from '../contracte.js';

/* Contracte (xatMultimedia): «Sense servidor/migració: error 'sense-capacitat', mai èxit local simulat». */
const senseAdjunts = () => errorAdjuntXat('sense-capacitat');
/* El mateix rebuig que supabase/xatXifrat.js quan la fase E2EE no hi és: mai cap clau ni cap sobre inventats. */
const senseE2ee = () => Object.assign(errorAdjuntXat('sense-capacitat'), { codi: 'sense-capacitat-e2ee' });
const cursorInvalid = () => Object.assign(new Error('Cursor de lectura invàlid.'), { code: 'CURSOR_INVALID', retriable: false });
const rebuigs = (noms, error) => Object.fromEntries(noms.map((nom) => [nom, async () => { throw error(); }]));

export function creaConversesLocal(e) {
  const xat = createLocalXatAdapter();

  async function enviaMissatge(filId, cos, config = {}) {
    return e.copia(await xat.enviaMissatge(filId, cos, e.ci(config)));
  }

  return {
    async loadFils(config = {}) {
      return e.copia(ambXatsPerDefecte(await xat.loadFils(e.ci(config)), { paginaDeLaIAIA: false }));
    },

    async loadMissatges(filId, config = {}) {
      return e.copia(await xat.loadMissatges(filId, e.ci(config)));
    },

    enviaMissatge,

    /* supabase/xat.js · marcaLlegit: un rebut sol (llegit absent o 0) no marca
       cap lectura, i un cursor que no és un enter no negatiu no arriba al magatzem. */
    async marcaLlegit(filId, config = {}) {
      const opcions = config ?? {};
      const rebut = opcions.rebutFinsSeq ?? opcions.llegitFinsSeq ?? null;
      const nomesRebut = opcions.rebutFinsSeq != null && (opcions.llegitFinsSeq == null || opcions.llegitFinsSeq === 0);
      const llegit = opcions.llegitFinsSeq ?? (nomesRebut ? 0 : null);
      if ([rebut, llegit].some((n) => n !== null && (!Number.isSafeInteger(n) || n < 0))) throw cursorInvalid();
      return e.copia(await xat.marcaLlegit(filId, { ...e.ci(opcions), rebutFinsSeq: rebut, llegitFinsSeq: llegit }));
    },

    async creaFilDirecte(altreUsuariId, titol = null, config = {}) {
      return xat.creaFilDirecte(altreUsuariId, titol, e.ci(config));
    },

    async carregaMembres(text = null, config = {}) {
      return e.copia(await xat.carregaMembres(text, e.ci(config)));
    },

    async obriFilDePagina(objecte, config = {}) {
      return e.copia(await xat.obriFilDePagina(objecte, e.ci(config)));
    },

    async subscribeToXat(filId, callback) {
      const alta = await xat.subscribeToXat(filId, callback, e.ci());
      if (alta?.subscription) e.subscripcions.set(alta.subscription, () => xat.unsubscribeFromXat(alta.subscription));
      return alta;
    },

    async unsubscribeFromXat(subscription) {
      if (!subscription) return;
      e.subscripcions.delete(subscription);
      await xat.unsubscribeFromXat(subscription);
    },

    /* supabase/content.js · appendChatMessages: un per un, en ordre, amb l'id
       de cada missatge (o un de nou): reenviar la mateixa llista no duplica. */
    async appendChatMessages(messages, config = {}) {
      const enviats = [];
      for (const missatge of Array.isArray(messages) ? messages : []) {
        enviats.push(await enviaMissatge(missatge?.threadId ?? missatge?.filId,
          { id: missatge?.id ?? e.nouId(), text: missatge?.text }, config));
      }
      return enviats;
    },

    ...rebuigs(CAPACITATS.xatMultimedia, senseAdjunts),
    ...rebuigs([...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat], senseE2ee)
  };
}
