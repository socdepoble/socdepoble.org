/**
 * El Bar · estat/ProveidorBar.jsx — l'estat de l'app i les operacions.
 *
 * Carrega el magatzem del dispositiu (magatzem.js), demana ser la pestanya
 * que escriu i aplica les funcions pures del nucli. Cada operació:
 *   1. espera la seua torn (una cua: dos tocs ràpids mai es xafen);
 *   2. calcula amb el nucli sobre l'últim estat;
 *   3. ho desa al disc i, només si ha anat bé, ho mostra.
 * Les operacions tornen { ok, valor } o { ok: false, error }: mai llancen a
 * la vista. L'error queda a `avis` amb un text per a la persona.
 *
 * El rellotge i l'atzar s'injecten (proves); el magatzem també.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { creaMagatzemBar } from '../magatzem.js';
import { errorBar } from '../nucli/comu.js';
import { nouId } from '../nucli/ids.js';
import {
  adoptaComanda, afegeixProducte, anullaLinia, aplicaDescompte, canviaNota, canviaQuantitat, comandaObertaDe, convida, creaComanda,
  esDescartable, marxa, mouLinies, sumaQuantitat, totals
} from '../nucli/comanda.js';
import { afegeixPagament, potTancar, tanca } from '../nucli/cobrament.js';
import { divideixPerLinies } from '../nucli/divisio.js';
import { costDeVenda } from '../nucli/escandall.js';
import { creaDevolucio } from '../nucli/tiquet.js';
import { afegeixMoviment, arqueig, obriTorn, potVendre, resumTorn, tancaTorn } from '../nucli/torn.js';
import { marcaLlegida, notaDeTraspas } from '../nucli/traspas.js';
import { llistaReposicio } from '../nucli/reposicio.js';
import { textError } from './textos.js';

const ContextBar = createContext(null);

const araReal = () => new Date().toISOString();

/** El número següent del torn: «Nota 0001», «Nota 0002»… (vendes i devolucions). */
const seguentNumero = (tiquets) => tiquets.reduce((maxim, t) => Math.max(maxim, t.numero || 0), 0) + 1;

export function ProveidorBar({ magatzem: injectat = null, rellotge = araReal, atzar = Math.random, children }) {
  const [magatzem] = useState(() => injectat || creaMagatzemBar());
  const [dades, setDades] = useState(null);
  const [errorCarrega, setErrorCarrega] = useState(null);
  const [base, setBase] = useState(() => ({ persistent: magatzem.base.persistent, mode: magatzem.base.mode }));
  const [avis, setAvis] = useState(null);
  const ref = useRef(null);
  const cua = useRef(Promise.resolve());

  const posa = useCallback((nou) => {
    ref.current = nou;
    setDades(nou);
  }, []);

  useEffect(() => {
    let viu = true;
    const llegixBase = () => setBase({ persistent: magatzem.base.persistent, mode: magatzem.base.mode });
    const recarrega = () => magatzem.carrega().then((d) => { if (viu) posa(d); }).catch(() => {});
    const desfes = magatzem.base.subscriu((esdeveniment) => {
      if (!viu) return;
      if (esdeveniment.tipus === 'mode' || esdeveniment.tipus === 'persistent') llegixBase();
      /* Una altra pestanya ha escrit: esta (lectora) torna a llegir. */
      if (esdeveniment.tipus === 'canvi' && !esdeveniment.local) recarrega();
    });
    (async () => {
      await magatzem.base.obtinBloqueig();
      const carregades = await magatzem.carrega();
      if (!viu) return;
      posa(carregades);
      llegixBase();
    })().catch((error) => {
      if (viu) setErrorCarrega(textError(error));
    });
    return () => {
      viu = false;
      desfes();
      magatzem.base.tanca();
    };
  }, [magatzem, posa]);

  /* Una operació a la cua: fn(estat, ctx) torna { estat?, valor }. */
  const opera = useCallback((fn) => {
    const pas = cua.current.then(async () => {
      const actual = ref.current;
      if (!actual) throw errorBar('CARREGANT', 'Encara s’està carregant.');
      const ara = rellotge();
      const id = (prefix) => nouId(prefix, ara, atzar);
      const resultat = await fn(actual, { ara, id });
      if (resultat?.estat) posa({ ...ref.current, ...resultat.estat });
      return resultat?.valor;
    });
    cua.current = pas.catch(() => undefined);
    return pas.then((valor) => {
      setAvis(null);
      return { ok: true, valor };
    }, (error) => {
      setAvis(textError(error));
      return { ok: false, error };
    });
  }, [posa, rellotge, atzar]);

  const accions = useMemo(() => {
    const exigeixVenda = (d) => {
      if (!potVendre(d.tornActual)) throw errorBar('SENSE_TORN', 'Cal obrir el torn per a vendre.');
    };
    const comandaDe = (d, comandaId) => {
      const comanda = d.comandes.find((c) => c.id === comandaId);
      if (!comanda) throw errorBar('NO_TROBADA', 'Esta comanda ja no està oberta.');
      return comanda;
    };
    const ambComanda = (d, desada) => ({ comandes: d.comandes.some((c) => c.id === desada.id)
      ? d.comandes.map((c) => (c.id === desada.id ? desada : c))
      : [...d.comandes, desada] });

    /* Modifica una comanda oberta amb una funció pura i la desa. */
    const modifica = (comandaId, fn) => opera(async (d, ctx) => {
      exigeixVenda(d);
      const nova = fn(comandaDe(d, comandaId), ctx, d);
      if (nova === comandaDe(d, comandaId)) return { valor: nova };
      const desada = await magatzem.desaComanda(nova);
      return { estat: ambComanda(d, desada), valor: desada };
    });

    const novaComandaA = async (d, ctx, origen) => {
      const comanda = creaComanda({ id: ctx.id('c'), tornId: d.tornActual.id, origen, ara: ctx.ara, per: d.tornActual.obertPer });
      return magatzem.desaComanda(comanda);
    };

    /* Tanca i desa el tiquet; el torn en guarda la llista. */
    const tancaDesada = async (d, ctx, comanda) => {
      const tiquet = tanca(comanda, { numero: seguentNumero(d.tiquets), ara: ctx.ara });
      await magatzem.tancaComanda(tiquet);
      return { estat: { comandes: d.comandes.filter((c) => c.id !== comanda.id), tiquets: [...d.tiquets, tiquet] }, valor: { tiquet } };
    };

    return {
      /** Obri el torn (amb la nota anterior ja llegida) i adopta les comandes que hi passaven. */
      obriTorn: ({ per, fonsInicialCents }) => opera(async (d, ctx) => {
        if (d.tornActual) throw errorBar('TORN_OBERT', 'Ja hi ha un torn obert.');
        const torn = obriTorn({ id: ctx.id('t'), per, fonsInicialCents, ara: ctx.ara, traspasAnterior: d.traspas });
        await magatzem.desaTorn(torn);
        await magatzem.desaMeta('tornActual', torn.id);
        await magatzem.desaMeta('tancament', null);
        const comandes = [];
        for (const comanda of d.comandes) comandes.push(await magatzem.desaComanda(adoptaComanda(comanda, torn.id, { ara: ctx.ara })));
        return { estat: { tornActual: torn, torns: [torn, ...d.torns], comandes, tiquets: [], tancament: null }, valor: torn };
      }),

      /** La nota de traspàs del torn anterior, llegida (un toc). */
      llegeixTraspas: ({ per }) => opera(async (d, ctx) => {
        if (!d.traspas) return { valor: null };
        const llegida = marcaLlegida(d.traspas, { per, ara: ctx.ara });
        await magatzem.desaMeta('traspas', llegida);
        return { estat: { traspas: llegida }, valor: llegida };
      }),

      /** Una comanda nova i buida (un tiquet de barra més, per emportar). */
      novaComanda: (origen) => opera(async (d, ctx) => {
        exigeixVenda(d);
        const desada = await novaComandaA(d, ctx, origen);
        return { estat: ambComanda(d, desada), valor: desada };
      }),

      /**
       * Afig un producte a la comanda `comandaId` o, si la ruta no en nomena
       * cap, a la de l'origen (comandaObertaDe, amb l'estat d'ara: dos tocs
       * ràpids no en creen dues) o a una de nova.
       */
      afegeix: ({ comandaId = null, origen = { tipus: 'barra' } }, article) => opera(async (d, ctx) => {
        exigeixVenda(d);
        let comanda = comandaId ? comandaDe(d, comandaId) : comandaObertaDe(d.comandes, origen);
        let estat = d;
        if (!comanda) {
          comanda = await novaComandaA(d, ctx, origen);
          estat = { ...d, ...ambComanda(d, comanda) };
        }
        /* El cost es congela a la línia amb el mateix càlcul que la carta: l'escandall o el manual (BAR-R6). */
        const { costCents } = costDeVenda(d.carta, article.producte, article.varianteId);
        const nova = afegeixProducte(comanda, {
          ...(costCents === null ? {} : { costCents }), ...article, ivaPerDefecte: d.establiment.ivaPerDefecte
        }, { ara: ctx.ara, idLinia: ctx.id('l') });
        const desada = await magatzem.desaComanda(nova);
        return { estat: ambComanda(estat, desada), valor: desada };
      }),

      canviaQuantitat: (comandaId, liniaId, quantitat) => modifica(comandaId, (c, ctx) => canviaQuantitat(c, liniaId, quantitat, { ara: ctx.ara })),
      /** + i − d'una línia: relatius a la comanda d'ara, dins de la cua (BAR-R5). */
      sumaQuantitat: (comandaId, liniaId, delta) => modifica(comandaId, (c, ctx) => sumaQuantitat(c, liniaId, delta, { ara: ctx.ara })),
      canviaNota: (comandaId, liniaId, nota) => modifica(comandaId, (c, ctx) => canviaNota(c, liniaId, nota, { ara: ctx.ara })),
      marxa: (comandaId) => modifica(comandaId, (c, ctx) => marxa(c, { ara: ctx.ara })),
      anulla: (comandaId, liniaId, { motiu, quantitat }) => modifica(comandaId, (c, ctx, d) => anullaLinia(c, liniaId, {
        motiu, quantitat, ara: ctx.ara, idLinia: ctx.id('l'), per: d.tornActual.obertPer
      })),
      descompte: (comandaId, liniaId, descompte) => modifica(comandaId, (c, ctx, d) => aplicaDescompte(c, liniaId, descompte, { ara: ctx.ara, per: d.tornActual.obertPer })),
      convida: (comandaId, liniaId, motiu) => modifica(comandaId, (c, ctx, d) => convida(c, liniaId, { motiu, ara: ctx.ara, per: d.tornActual.obertPer })),

      /** Un pagament; si el pendent arriba a 0, la comanda es tanca i torna { tiquet }. */
      paga: (comandaId, pagament) => opera(async (d, ctx) => {
        exigeixVenda(d);
        const nova = afegeixPagament(comandaDe(d, comandaId), pagament, { id: ctx.id('p'), ara: ctx.ara });
        if (totals(nova).pendentCents === 0) return tancaDesada(d, ctx, nova);
        const desada = await magatzem.desaComanda(nova);
        return { estat: ambComanda(d, desada), valor: { comanda: desada } };
      }),

      /** Tanca una comanda que ja no deu res (p. ex. tota convidada). */
      tanca: (comandaId) => opera(async (d, ctx) => {
        exigeixVenda(d);
        const comanda = comandaDe(d, comandaId);
        const pot = potTancar(comanda);
        if (!pot.ok) throw errorBar(pot.motiu, 'Esta comanda no es pot tancar encara.');
        return tancaDesada(d, ctx, comanda);
      }),

      /** Descarta una comanda buida. */
      descarta: (comandaId) => opera(async (d) => {
        const comanda = comandaDe(d, comandaId);
        await magatzem.descartaComanda(comanda);
        return { estat: { comandes: d.comandes.filter((c) => c.id !== comandaId) }, valor: null };
      }),

      /** Mou línies a una altra comanda o a un origen sense comanda (una taula lliure). */
      mou: (comandaId, desti, seleccio) => opera(async (d, ctx) => {
        exigeixVenda(d);
        const origen = comandaDe(d, comandaId);
        let estat = d;
        let comandaDesti = desti.comandaId ? comandaDe(d, desti.comandaId) : null;
        if (!comandaDesti) {
          comandaDesti = await novaComandaA(d, ctx, desti.origen);
          estat = { ...d, ...ambComanda(d, comandaDesti) };
        }
        const r = mouLinies(origen, comandaDesti, seleccio, { ara: ctx.ara, nouIdLinia: () => ctx.id('l') });
        const desatDesti = await magatzem.desaComanda(r.desti);
        estat = { ...estat, ...ambComanda(estat, desatDesti) };
        if (esDescartable(r.origen)) {
          await magatzem.descartaComanda(origen);
          return { estat: { comandes: estat.comandes.filter((c) => c.id !== origen.id) }, valor: desatDesti };
        }
        const desatOrigen = await magatzem.desaComanda(r.origen);
        return { estat: ambComanda(estat, desatOrigen), valor: desatDesti };
      }),

      /** Separa línies en una comanda filla (dividir el compte per línies). */
      divideix: (comandaId, seleccio) => opera(async (d, ctx) => {
        exigeixVenda(d);
        const { mare, filla } = divideixPerLinies(comandaDe(d, comandaId), seleccio, { idNova: ctx.id('c'), ara: ctx.ara, nouIdLinia: () => ctx.id('l') });
        const desadaFilla = await magatzem.desaComanda(filla);
        const desadaMare = await magatzem.desaComanda(mare);
        const estat = { ...d, ...ambComanda(d, desadaFilla) };
        return { estat: ambComanda(estat, desadaMare), valor: desadaFilla };
      }),

      /** Devolució enllaçada d'un tiquet del torn. */
      retorna: (tiquetId, seleccio, { motiu, metode }) => opera(async (d, ctx) => {
        exigeixVenda(d);
        const tiquet = d.tiquets.find((t) => t.id === tiquetId);
        if (!tiquet) throw errorBar('NO_TROBADA', 'Este tiquet no és del torn obert.');
        const devolucio = creaDevolucio(tiquet, seleccio, {
          motiu, metode, id: ctx.id('k'), ara: ctx.ara, numero: seguentNumero(d.tiquets), tornId: d.tornActual.id,
          per: d.tornActual.obertPer, devolucionsPrevies: d.tiquets.filter((t) => t.tipus === 'devolucio')
        });
        await magatzem.desaDevolucio(devolucio);
        return { estat: { tiquets: [...d.tiquets, devolucio] }, valor: devolucio };
      }),

      /** Entrada o eixida de caixa. */
      moviment: (moviment) => opera(async (d, ctx) => {
        if (!d.tornActual) throw errorBar('SENSE_TORN', 'No hi ha cap torn obert.');
        const torn = afegeixMoviment(d.tornActual, moviment, { id: ctx.id('m'), ara: ctx.ara });
        await magatzem.desaTorn(torn);
        return { estat: { tornActual: torn, torns: d.torns.map((t) => (t.id === torn.id ? torn : t)) }, valor: torn };
      }),

      /**
       * L'esborrany del tancament (arqueig, avisos, fons): sobreviu a una
       * recàrrega. `canvis` és un objecte o una funció de l'esborrany d'ARA
       * (dins de la cua): els + i − de l'arqueig són relatius (BAR-R5).
       */
      desaEsborranyTancament: (canvis) => opera(async (d) => {
        const actual = { perDenominacio: {}, avisos: [], fonsDeixatCents: 0, ...d.tancament };
        const tancament = { ...actual, ...(typeof canvis === 'function' ? canvis(actual) : canvis) };
        await magatzem.desaMeta('tancament', tancament);
        return { estat: { tancament }, valor: tancament };
      }),

      /**
       * Tanca el torn: resum, reposició, nota de traspàs i congelat. Les
       * comandes buides es descarten; la resta passa al torn següent.
       */
      tancaTorn: () => opera(async (d, ctx) => {
        if (!d.tornActual) throw errorBar('SENSE_TORN', 'No hi ha cap torn obert.');
        const esborrany = { perDenominacio: {}, avisos: [], fonsDeixatCents: 0, ...d.tancament };
        const buides = d.comandes.filter(esDescartable);
        for (const comanda of buides) await magatzem.descartaComanda(comanda);
        const obertes = d.comandes.filter((c) => !esDescartable(c));
        const resum = resumTorn(d.tornActual, d.tiquets, obertes, { categories: d.carta.categories });
        const comptat = arqueig(esborrany.perDenominacio, d.establiment.denominacions);
        const traspas = notaDeTraspas({
          torn: d.tornActual, resum, obertes, reposicio: llistaReposicio(d.tiquets, d.carta), avisos: esborrany.avisos,
          fonsDeixatCents: esborrany.fonsDeixatCents, diferenciaCaixaCents: comptat - resum.efectiuEsperatCents,
          per: d.tornActual.obertPer, ara: ctx.ara
        });
        const tancat = tancaTorn(d.tornActual, { arqueig: { perDenominacio: esborrany.perDenominacio }, resum, traspas, obertes, per: d.tornActual.obertPer, ara: ctx.ara });
        await magatzem.desaTorn(tancat);
        await magatzem.desaMeta('traspas', traspas);
        await magatzem.desaMeta('tornActual', null);
        await magatzem.desaMeta('tancament', null);
        return {
          estat: { tornActual: null, torns: d.torns.map((t) => (t.id === tancat.id ? tancat : t)), comandes: obertes, tiquets: [], traspas, tancament: null },
          valor: tancat
        };
      }),

      desaCarta: (carta) => opera(async () => ({ estat: { carta: await magatzem.desaCarta(carta) }, valor: true })),
      desaEstabliment: (establiment) => opera(async () => {
        await magatzem.desaMeta('establiment', establiment);
        return { estat: { establiment }, valor: establiment };
      }),

      /** Els tiquets d'un torn qualsevol (historial), de només lectura. */
      tiquetsDelTorn: (tornId) => magatzem.tiquetsDelTorn(tornId),
      demanaPersistencia: () => magatzem.base.demanaPersistencia(),
      estatPersistencia: () => magatzem.base.estatPersistencia(),
      bolca: () => magatzem.bolca(),
      oblidaAvis: () => setAvis(null)
    };
  }, [opera, magatzem]);

  const valor = useMemo(() => ({
    carregat: Boolean(dades),
    errorCarrega,
    ...base,
    avis,
    ...(dades || {}),
    accions
  }), [dades, errorCarrega, base, avis, accions]);

  return <ContextBar.Provider value={valor}>{children}</ContextBar.Provider>;
}

/** Dins de l'app del Bar: l'estat i les operacions. */
export function useBar() {
  const valor = useContext(ContextBar);
  if (!valor) throw new Error('useBar s’ha de cridar dins de ProveidorBar.');
  return valor;
}
