/**
 * El Bar · magatzem.js — on viu la veritat del torn: IndexedDB d'este
 * dispositiu (disseny del Bar §A.5 i §A.11), sobre utils/magatzemLocal.js.
 *
 *   base 'sdp-bar' v1 · stores: cataleg, sala, comandes (índex tornId),
 *   tiquets (índex tornId), torns i meta.
 *
 *   · Llista blanca de camps per store: el que no hi és no arriba al disc.
 *   · Una comanda es desa amb concurrència optimista: si el `rev` no és el
 *     del disc, CONFLICTE (una altra pestanya o una operació vella).
 *   · Un tiquet s'escriu UNA vegada: cap funció d'ací l'edita ni l'esborra
 *     (invariant 2). Un torn tancat, tampoc.
 *   · Tancar una comanda escriu primer el tiquet (mateix id) i després
 *     esborra la comanda: si alguna cosa talla pel mig, en carregar-ho es
 *     reconcilia (una comanda que ja té tiquet és una comanda tancada).
 * Res d'això ix de l'ordinador: cap crida de xarxa.
 */
import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { validaCataleg } from './nucli/cataleg.js';
import { errorBar } from './nucli/comu.js';
import { esDescartable } from './nucli/comanda.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta, llavorSala } from './nucli/llavor.js';
import { validaSala } from './nucli/sala.js';

export const NOM_BASE = 'sdp-bar';
export const VERSIO_BASE = 1;

const CAMPS_COMANDA = Object.freeze(['id', 'tornId', 'origen', 'comensals', 'linies', 'pagaments', 'estat', 'obertaA', 'atesPer', 'rev', 'historial']);
const CAMPS_TIQUET = Object.freeze([...CAMPS_COMANDA, 'tipus', 'tiquetOrigenId', 'numero', 'totals', 'tancatA', 'motiu']);
const CAMPS_TORN = Object.freeze(['id', 'obertA', 'obertPer', 'fonsInicialCents', 'moviments', 'estat', 'traspasAnteriorLlegit',
  'traspasAnteriorDe', 'tancatA', 'tancatPer', 'arqueig', 'diferenciaCaixaCents', 'resum', 'traspas']);
export const CLAUS_META = Object.freeze(['establiment', 'tornActual', 'traspas', 'tancament']);

const ID_CARTA = 'carta';
const ID_SALA = 'sala';

function cartaNeta(registre) {
  const carta = {
    id: ID_CARTA,
    categories: registre.categories,
    productes: registre.productes,
    grups: registre.grups,
    ingredients: Array.isArray(registre.ingredients) ? registre.ingredients : [],
    escandalls: Array.isArray(registre.escandalls) ? registre.escandalls : []
  };
  const { ok, errors } = validaCataleg(carta);
  if (!ok) throw new TypeError(`La carta no és vàlida: ${errors.slice(0, 3).join('; ')}`);
  return carta;
}

function salaNeta(registre) {
  const sala = { id: ID_SALA, zones: registre.zones, taules: registre.taules };
  const { ok, errors } = validaSala(sala);
  if (!ok) throw new TypeError(`La sala no és vàlida: ${errors.slice(0, 3).join('; ')}`);
  return sala;
}

function metaNeta(registre) {
  if (!CLAUS_META.includes(registre.clau)) throw new TypeError(`Clau de meta desconeguda: «${String(registre.clau)}».`);
  return { clau: registre.clau, valor: registre.valor ?? null };
}

const senseId = ({ id, ...resta }) => {
  void id;
  return resta;
};

/**
 * @param {{ idb?: IDBFactory|null, navegador?: object, Canal?: Function }} [opcions]
 *   idb: per defecte el del navegador; null treballa en memòria (persistent: false).
 */
export function creaMagatzemBar(opcions = {}) {
  const base = creaMagatzemIdb({
    nom: NOM_BASE,
    versio: VERSIO_BASE,
    stores: {
      cataleg: { clau: 'id' },
      sala: { clau: 'id' },
      comandes: { clau: 'id', indexs: ['tornId'] },
      tiquets: { clau: 'id', indexs: ['tornId'] },
      torns: { clau: 'id' },
      meta: { clau: 'clau' }
    },
    llistaBlanca: {
      cataleg: cartaNeta,
      sala: salaNeta,
      comandes: [...CAMPS_COMANDA],
      tiquets: [...CAMPS_TIQUET],
      torns: [...CAMPS_TORN],
      meta: metaNeta
    },
    ...opcions
  });

  const meta = async (clau) => (await base.obte('meta', clau))?.valor ?? null;

  return {
    base,

    /**
     * Tot el que necessita la pantalla. La primera vegada (sense carta), la
     * llavor d'exemple; només s'escriu si esta pestanya és l'escriptora.
     */
    async carrega() {
      const escriptora = base.mode !== 'lectora';
      let carta = await base.obte('cataleg', ID_CARTA);
      let sala = await base.obte('sala', ID_SALA);
      let establiment = await meta('establiment');
      if (!carta) {
        carta = { id: ID_CARTA, ...llavorCarta() };
        if (escriptora) await base.desa('cataleg', carta);
      }
      if (!sala) {
        sala = { id: ID_SALA, ...llavorSala() };
        if (escriptora) await base.desa('sala', sala);
      }
      if (!establiment) {
        establiment = structuredClone(ESTABLIMENT_EXEMPLE);
        if (escriptora) await base.desa('meta', { clau: 'establiment', valor: establiment });
      }
      const tornActualId = await meta('tornActual');
      const torns = (await base.totes('torns')).sort((a, b) => (a.obertA < b.obertA ? 1 : -1));
      const tornActual = torns.find((t) => t.id === tornActualId && t.estat === 'obert') || null;
      const totesComandes = await base.totes('comandes');
      const tiquetsDelTorn = tornActual ? await base.perIndex('tiquets', 'tornId', tornActual.id) : [];
      /* Reconciliació: una comanda amb tiquet ja està tancada. */
      const ambTiquet = new Set();
      for (const comanda of totesComandes) {
        if (await base.obte('tiquets', comanda.id)) ambTiquet.add(comanda.id);
      }
      if (escriptora) for (const id of ambTiquet) await base.esborra('comandes', id);
      return {
        carta: senseId(carta),
        sala: senseId(sala),
        establiment,
        tornActual,
        torns,
        comandes: totesComandes.filter((c) => c.estat === 'oberta' && !ambTiquet.has(c.id)),
        tiquets: tiquetsDelTorn.sort((a, b) => a.numero - b.numero),
        traspas: await meta('traspas'),
        tancament: await meta('tancament')
      };
    },

    /** Desa una comanda oberta si el `rev` és el del disc; torna la desada (rev + 1). */
    desaComanda(comanda) {
      return base.actualitza('comandes', comanda.id, (actual) => {
        /* Sense registre al disc, només hi entra una comanda nova (rev 0). */
        const revDisc = actual ? actual.rev : 0;
        if (revDisc !== comanda.rev) {
          throw errorBar('CONFLICTE', 'Esta comanda ha canviat en una altra banda: torna a carregar-la.');
        }
        if (comanda.estat !== 'oberta') throw errorBar('NO_OBERTA', 'Al store de comandes només hi ha comandes obertes.');
        return { ...comanda, rev: comanda.rev + 1 };
      });
    },

    /** Descarta una comanda buida (cap línia ni pagament): no hi ha res a guardar. */
    async descartaComanda(comanda) {
      if (!esDescartable(comanda)) throw errorBar('NO_DESCARTABLE', 'Només es descarta una comanda buida.');
      await base.esborra('comandes', comanda.id);
    },

    /**
     * Tanca: escriu el tiquet (una sola vegada) i després esborra la comanda
     * oberta amb el mateix id.
     */
    async tancaComanda(tiquet) {
      await base.actualitza('tiquets', tiquet.id, (actual) => {
        if (actual) throw errorBar('JA_TANCAT', 'Este tiquet ja existix: un tiquet tancat no es reescriu.');
        return tiquet;
      });
      if (tiquet.tipus === 'venda') await base.esborra('comandes', tiquet.id);
      return tiquet;
    },

    /** Una devolució és un tiquet nou: també s'escriu una sola vegada. */
    desaDevolucio(tiquet) {
      return base.actualitza('tiquets', tiquet.id, (actual) => {
        if (actual) throw errorBar('JA_TANCAT', 'Esta devolució ja existix.');
        if (tiquet.tipus !== 'devolucio') throw errorBar('TIPUS', 'Només devolucions.');
        return tiquet;
      });
    },

    /** Desa el torn obert; un torn tancat al disc ja no es toca. */
    desaTorn(torn) {
      return base.actualitza('torns', torn.id, (actual) => {
        if (actual && actual.estat === 'tancat') throw errorBar('TORN_TANCAT', 'Un torn tancat no es reescriu.');
        return torn;
      });
    },

    desaMeta(clau, valor) {
      return base.desa('meta', { clau, valor });
    },

    desaCarta(carta) {
      return base.desa('cataleg', { id: ID_CARTA, ...carta }).then(senseId);
    },

    desaSala(sala) {
      return base.desa('sala', { id: ID_SALA, ...sala }).then(senseId);
    },

    tiquetsDelTorn(tornId) {
      return base.perIndex('tiquets', 'tornId', tornId).then((tiquets) => tiquets.sort((a, b) => a.numero - b.numero));
    },

    /** La còpia sencera (per a «Desa una còpia» en JSON des dels ajustos del dispositiu). */
    bolca() {
      return base.bolca();
    }
  };
}
