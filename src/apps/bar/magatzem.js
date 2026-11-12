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
 *   · Cobrar escriu el tiquet i esborra la comanda en una sola transacció.
 *     La càrrega encara reconcilia els talls de versions anteriors.
 *   · Moure o dividir comprova les dues revisions i desa el moviment en
 *     una transacció. Els moviments antics que van quedar a mitges encara
 *     es detecten i s'avisen perquè el personal els puga revisar.
 *   · Cobrar mira el `rev`: una comanda que al disc ha canviat (o ja no hi
 *     és) des que la memòria la va llegir no es cobra (CONFLICTE).
 * Res d'això ix de l'ordinador: cap crida de xarxa.
 */
import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { validaCataleg } from './nucli/cataleg.js';
import { CLAUS_META, ESQUEMA_COPIA_BAR, llegixCopiaBar } from './nucli/copia.js';
import { errorBar } from './nucli/comu.js';
import { esDescartable } from './nucli/comanda.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta, llavorSala } from './nucli/llavor.js';
import { detectaMigsMoviments } from './nucli/migMoviment.js';
import { validaSala } from './nucli/sala.js';

export const NOM_BASE = 'sdp-bar';
export const VERSIO_BASE = 1;

const CAMPS_COMANDA = Object.freeze(['id', 'tornId', 'origen', 'comensals', 'linies', 'pagaments', 'estat', 'obertaA', 'atesPer', 'rev', 'historial']);
const CAMPS_TIQUET = Object.freeze([...CAMPS_COMANDA, 'tipus', 'tiquetOrigenId', 'numero', 'totals', 'tancatA', 'motiu']);
const CAMPS_TORN = Object.freeze(['id', 'obertA', 'obertPer', 'fonsInicialCents', 'moviments', 'estat', 'traspasAnteriorLlegit',
  'traspasAnteriorDe', 'tancatA', 'tancatPer', 'arqueig', 'diferenciaCaixaCents', 'resum', 'traspas']);
export { CLAUS_META };

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

  function comprovaRev(actual, comanda) {
    if ((actual?.rev ?? 0) !== comanda.rev) {
      throw errorBar('CONFLICTE', 'Esta comanda ha canviat en una altra banda: torna a carregar-la.');
    }
  }

  /* Desa una comanda oberta si el `rev` és el del disc (la regla de desaComanda). */
  const conflicteTorn = () => errorBar('CONFLICTE', 'El torn ha canviat en una altra pestanya.');
  const estable = (valor) => JSON.stringify(valor ?? null, (_clau, camp) => (
    camp && typeof camp === 'object' && !Array.isArray(camp)
      ? Object.fromEntries(Object.keys(camp).sort().map((clau) => [clau, camp[clau]])) : camp
  ));
  const igual = (a, b) => estable(a) === estable(b);
  const comprovaTorn = (registre, id) => {
    if (registre?.valor !== id) throw conflicteTorn();
  };
  const comprovaComandes = (actuals, previstes) => {
    const perId = new Map(previstes.map((registre) => [registre.id, registre.rev]));
    if (actuals.length !== perId.size || actuals.some((registre) => perId.get(registre.id) !== registre.rev)) throw conflicteTorn();
  };
  const clauActual = ['meta', 'tornActual'];
  const clauTraspas = ['meta', 'traspas'];
  const clauTancament = ['meta', 'tancament'];

  const desaOberta = async (comanda, { ambTorn = false } = {}) => {
    const claus = [['comandes', comanda.id], ['tiquets', comanda.id]];
    if (ambTorn) claus.push(clauActual);
    const [desada] = await base.actualitzaRegistres(claus, ([actual, tiquet, torn]) => {
      if (ambTorn) comprovaTorn(torn, comanda.tornId);
      if (tiquet) throw errorBar('JA_TANCAT', 'Esta comanda ja té un tiquet.');
      comprovaRev(actual, comanda);
      if (comanda.estat !== 'oberta') throw errorBar('NO_OBERTA', 'Al store de comandes només hi ha comandes obertes.');
      const canvis = Array(claus.length);
      canvis[0] = { ...comanda, rev: comanda.rev + 1 };
      return canvis;
    });
    return desada;
  };

  /** Tanca amb un tiquet immutable i retira la comanda en la mateixa transacció. */
  async function tancaComanda(tiquet, { ambTorn = false } = {}) {
    const venda = tiquet.tipus === 'venda';
    const referencies = [
      ['tiquets', tiquet.id], ['tiquets', tiquet.tornId, 'tornId']
    ];
    if (ambTorn) referencies.push(clauActual);
    if (venda) referencies.push(['comandes', tiquet.id]);
    await base.actualitzaRegistres(referencies, ([actual, tiquets, ...altres]) => {
      if (actual) throw errorBar('JA_TANCAT', 'Este tiquet ja existix: un tiquet tancat no es reescriu.');
      if (ambTorn) comprovaTorn(altres[0], tiquet.tornId);
      if (tiquets.some((t) => t.numero === tiquet.numero)) throw conflicteTorn();
      const canvis = Array(referencies.length);
      canvis[0] = tiquet;
      if (venda) {
        comprovaRev(altres.at(-1), tiquet);
        canvis[canvis.length - 1] = null;
      }
      return canvis;
    });
    return tiquet;
  }

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
        if (escriptora) carta = await base.actualitza('cataleg', ID_CARTA, (actual) => actual ? undefined : carta);
      }
      if (!sala) {
        sala = { id: ID_SALA, ...llavorSala() };
        if (escriptora) sala = await base.actualitza('sala', ID_SALA, (actual) => actual ? undefined : sala);
      }
      if (!establiment) {
        establiment = structuredClone(ESTABLIMENT_EXEMPLE);
        if (escriptora) {
          const desat = await base.actualitza('meta', 'establiment', (actual) => actual?.valor
            ? undefined : { clau: 'establiment', valor: establiment });
          establiment = desat.valor;
        }
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
      const comandes = totesComandes.filter((c) => c.estat === 'oberta' && !ambTiquet.has(c.id));
      return {
        carta: senseId(carta),
        sala: senseId(sala),
        establiment,
        tornActual,
        torns,
        comandes,
        /* Correcció del refutador (261011, T2; decisió: «detecta i avisa») · Els «Mou» i els
           «Dividix» que un tall va deixar a mitges: NOMÉS es detecten (nucli/migMoviment.js, pur
           i que mai llança). Ací no s'escriu, no es retalla ni es descarta res: la pantalla avisa
           i la persona ho arregla. */
        migsMoviments: detectaMigsMoviments(comandes, tiquetsDelTorn),
        tiquets: tiquetsDelTorn.sort((a, b) => a.numero - b.numero),
        traspas: await meta('traspas'),
        tancament: await meta('tancament')
      };
    },

    /** Desa una comanda oberta si el `rev` és el del disc; torna la desada (rev + 1). */
    desaComanda(comanda, opcions) {
      return desaOberta(comanda, opcions);
    },

    /** Mou o dividix línies i aplica els dos canvis junts si continuen vigents. */
    async traspassaComandes(origen, desti) {
      const [, destiDesat, origenDesat] = await base.actualitzaRegistres([
        clauActual, ['comandes', desti.id], ['comandes', origen.id],
        ['tiquets', desti.id], ['tiquets', origen.id]
      ], ([vigent, alDesti, aLOrigen, tiquetDesti, tiquetOrigen]) => {
        comprovaTorn(vigent, origen.tornId);
        if (origen.tornId !== desti.tornId || tiquetDesti || tiquetOrigen || !aLOrigen) throw conflicteTorn();
        comprovaRev(aLOrigen, origen);
        comprovaRev(alDesti, desti);
        const origenNou = esDescartable(origen) ? null : { ...origen, rev: origen.rev + 1 };
        return [undefined, { ...desti, rev: desti.rev + 1 }, origenNou, undefined, undefined];
      });
      return { origen: origenDesat, desti: destiDesat };
    },

    /** Descarta una comanda buida i comprova que la versió del disc és la prevista. */
    async descartaComanda(comanda) {
      if (!esDescartable(comanda)) throw errorBar('NO_DESCARTABLE', 'Només es descarta una comanda buida.');
      await base.actualitzaRegistres([['comandes', comanda.id]], ([actual]) => {
        if (!actual) return [undefined];
        /* També la crida «Mou» després de desar el destí; l'origen al disc
           pot tindre línies, però ha de ser de la mateixa revisió. */
        comprovaRev(actual, comanda);
        return [null];
      });
    },

    tancaComanda,

    /** Una devolució és un tiquet nou: també s'escriu una sola vegada. */
    async desaDevolucio(tiquet, opcions) {
      if (tiquet.tipus !== 'devolucio') throw errorBar('TIPUS', 'Només devolucions.');
      return tancaComanda(tiquet, opcions);
    },

    async obriTorn(torn, comandes, traspas) {
      const referencies = [clauActual, clauTraspas, clauTancament, ['torns', torn.id], ['comandes', null],
        ...comandes.map(({ id }) => ['comandes', id])];
      const canvis = await base.actualitzaRegistres(referencies, ([vigent, nota, , repetit, obertes]) => {
        if (vigent?.valor || repetit) throw errorBar('TORN_OBERT', 'Ja hi ha un torn obert.');
        if (!igual(traspas, nota?.valor)) throw conflicteTorn();
        comprovaComandes(obertes, comandes);
        return [{ clau: 'tornActual', valor: torn.id }, undefined, { clau: 'tancament', valor: null }, torn, undefined,
          ...comandes.map((comanda) => ({ ...comanda, rev: comanda.rev + 1 }))];
      });
      return canvis.slice(5);
    },

    async tancaTorn(torn, actual, buides) {
      const referencies = [clauActual, clauTraspas, clauTancament, ['torns', torn.id], ['comandes', null],
        ['tiquets', torn.id, 'tornId'], ...buides.map(({ id }) => ['comandes', id])];
      await base.actualitzaRegistres(referencies, ([vigent, , esborrany, anterior, comandes, tiquets]) => {
        comprovaTorn(vigent, torn.id);
        const idsTiquets = new Set(actual.tiquets.map(({ id }) => id));
        if (!igual(anterior, actual.tornActual) || !igual(esborrany?.valor, actual.tancament)
          || tiquets.length !== idsTiquets.size || tiquets.some(({ id }) => !idsTiquets.has(id))) throw conflicteTorn();
        comprovaComandes(comandes, actual.comandes);
        return [{ clau: 'tornActual', valor: null }, { clau: 'traspas', valor: torn.traspas },
          { clau: 'tancament', valor: null }, torn, undefined, undefined, ...buides.map(() => null)];
      });
    },

    /** Desa el torn obert; un torn tancat al disc ja no es toca. */
    desaTorn(torn, previst) {
      return base.actualitza('torns', torn.id, (actual) => {
        if (actual && actual.estat === 'tancat') throw errorBar('TORN_TANCAT', 'Un torn tancat no es reescriu.');
        if (previst !== undefined && !igual(actual, previst)) throw conflicteTorn();
        return torn;
      });
    },

    desaMeta(clau, valor) {
      return base.desa('meta', { clau, valor });
    },

    desaCarta(carta) {
      return base.desa('cataleg', { id: ID_CARTA, ...carta }).then(senseId);
    },

    /** Aplica la llavor i la identitat del bar al mateix temps, amb el torn tancat. */
    async desaLlavor(carta, establiment, previst) {
      const [desada] = await base.actualitzaRegistres([
        ['cataleg', ID_CARTA], ['meta', 'establiment'], clauActual, ['comandes', null]
      ], ([anterior, ajustos, vigent, comandes]) => {
        if (vigent?.valor || comandes.length) throw errorBar('OCUPAT', 'Cal tancar el torn i les comandes obertes abans de canviar la carta.');
        if (!igual(anterior && senseId(anterior), previst.carta) || !igual(ajustos?.valor, previst.establiment)) throw conflicteTorn();
        return [{ ...carta, id: ID_CARTA }, { clau: 'establiment', valor: establiment }, undefined, undefined];
      });
      return senseId(desada);
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
    },

    async exportaCopia(ara = new Date()) {
      return JSON.stringify({ schema: ESQUEMA_COPIA_BAR, desadaA: ara.toISOString(), ...await base.bolca() }, null, 2);
    },

    /** Restaura en un dispositiu nou o que només té les dades d'exemple. */
    async restauraCopia(text) {
      const entrant = llegixCopiaBar(text);
      const nomesLlavor = (files, llavor) => files.length === 0
        || (files.length === 1 && igual(files[0], llavor));
      await base.actualitzaBolcat((actual) => {
        const treball = actual.comandes.length || actual.torns.length || actual.tiquets.length
          || actual.meta.some(({ clau, valor }) => clau !== 'establiment' && valor !== null);
        const ajustos = actual.meta.filter(({ clau }) => clau === 'establiment');
        if (treball || !nomesLlavor(actual.cataleg, cartaNeta(llavorCarta()))
          || !nomesLlavor(actual.sala, salaNeta(llavorSala()))
          || !nomesLlavor(ajustos, { clau: 'establiment', valor: ESTABLIMENT_EXEMPLE })) {
          throw errorBar('DISPOSITIU_OCUPAT', 'Ja hi ha dades del Bar en este navegador. Tria un navegador sense dades del Bar per a restaurar la còpia.');
        }
        return entrant;
      });
      return { torns: entrant.torns.length, tiquets: entrant.tiquets.length };
    }
  };
}
