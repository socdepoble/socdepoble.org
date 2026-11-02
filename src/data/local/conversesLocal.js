/**
 * conversesLocal.js — El Xat de l'adaptador local (T1 · D01): el nucli del
 * Xat, el xat de pàgina i, sense servidor, els rebuigs honestos dels adjunts
 * privats ('xatMultimedia') i del transport E2EE ('clausXat' i
 * 'xatMultimediaXifrat').
 * B8C-2 (marató 261101_2143; Bloc B8) · El silenci de la conversa
 * ('silenciXat'), al magatzem del Xat, i el rebuig honest dels avisos push
 * ('avisosPush', D-B8C-16): un node sense servidor no té cap servei que els
 * envie. Rebuig i no capacitat no declarada a posta: CAPACITATS_NO_DECLARADES
 * d'adaptadorLocal.js continua sent ['versioClient'] i el text públic de
 * /page/versions («els serveis que un node sense servidor no té… els rebutja
 * amb el codi que prescriu el contracte») continua sent cert.
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
import { PREFIX_PER_DEFECTE, ambXatsPerDefecte } from '../xatsPerDefecte.js';
import { errorAdjuntXat } from '../xatMultimedia.js';
import { CAPACITATS, DURADES_SILENCI } from '../contracte.js';

/* Contracte (xatMultimedia): «Sense servidor/migració: error 'sense-capacitat', mai èxit local simulat». */
const senseAdjunts = () => errorAdjuntXat('sense-capacitat');
/* El mateix rebuig que supabase/xatXifrat.js quan la fase E2EE no hi és: mai cap clau ni cap sobre inventats. */
const senseE2ee = () => Object.assign(errorAdjuntXat('sense-capacitat'), { codi: 'sense-capacitat-e2ee' });
const cursorInvalid = () => Object.assign(new Error('Cursor de lectura invàlid.'), { code: 'CURSOR_INVALID', retriable: false });
const rebuigs = (noms, error) => Object.fromEntries(noms.map((nom) => [nom, async () => { throw error(); }]));
/* B8C-2 · El code del contracte de 'avisosPush' sense servidor (el mateix que supabase/dispositiusAvisos.js en llavor). */
const senseServidorDePush = () => Object.assign(new Error('Sense servidor no hi ha avisos push.'), { code: 'NO-DISPONIBLE', codi: 'NO-DISPONIBLE' });
/* ARB-B8C2-03 · La mateixa entrada invàlida que supabase/xat.js · silenciaFil
   rebutja abans de cap petició (durada fora de DURADES_SILENCI, un fil que no
   és cap text, en blanc o una fila d'ajuda): SILENCI_INVALID, com diu el
   contracte, i no XAT_NO_PARTICIPANT del magatzem. */
const entradaDeSilenciInvalida = (filId, durada) => typeof durada !== 'string' || !DURADES_SILENCI.includes(durada)
  || typeof filId !== 'string' || !filId.trim() || filId.startsWith(PREFIX_PER_DEFECTE);
const silenciInvalid = () => Object.assign(new Error('No es pot silenciar: la durada o la conversa no són vàlides.'), { code: 'SILENCI_INVALID', codi: 'SILENCI_INVALID', retriable: false });

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

    /* B8C-2 · Capacitat 'silenciXat': supabase/xat.js en seed fa el mateix. */
    async silenciaFil(dades = {}, config = {}) {
      if (entradaDeSilenciInvalida(dades?.filId, dades?.durada)) throw silenciInvalid();
      return e.copia(await xat.silenciaFil(dades.filId, dades.durada, e.ci(config)));
    },

    ...rebuigs(CAPACITATS.xatMultimedia, senseAdjunts),
    ...rebuigs([...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat], senseE2ee),
    ...rebuigs(CAPACITATS.avisosPush, senseServidorDePush)
  };
}
