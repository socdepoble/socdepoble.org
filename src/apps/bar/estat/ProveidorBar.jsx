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
 * EL PERMÍS DE SESSIÓ, UNA SOLA REGLA PER A TOT EL BAR (ordre del Mestre,
 * 261006: el permís «escriure: 'sessio'» s'aplica a la Caixa, el cobrament,
 * els torns, la carta i els ajustos, no només al TPV). L'estat llig el pont
 * de la plataforma (useSessioApp, de només lectura) i en dona a les vistes
 *   permis: { potEscriure, motiu, enLinia, modeProves, rutaEntrada }
 * Sense potEscriure, TOTA operació d'escriptura (obrir i tancar el torn,
 * vendre, cobrar, moure, dividir, retornar, moviments, l'esborrany del
 * tancament, la carta, la llavor, l'establiment i llegir el traspàs) refusa
 * amb SENSE_PERMIS abans de tocar res; les de lectura (tiquetsDelTorn,
 * bolca, estatPersistencia, demanaPersistencia i oblidaAvis) no. Mirar
 * sempre es pot.
 *   · És una GUARDA D'EXPERIÈNCIA, no de seguretat: les dades del Bar són
 *     locals (IndexedDB d'este dispositiu) i qui tinga el dispositiu les pot
 *     llegir i escriure fora de l'app. Evita que algú vena sense compte quan
 *     la sessió és obligatòria (mode remot) i que cap botó semble actiu sense
 *     fer res; les vistes desactiven els seus botons i AvisSessio diu per què.
 *   · El motiu el decidix el pont: en mode de proves (dades 'seed' o 'local',
 *     on entrar és impossible per disseny) i sense xarxa amb una sessió
 *     desada en este dispositiu, el Bar ven igualment.
 *   · Es mira quan l'operació arriba al seu torn de la cua, amb l'últim
 *     permís pintat (una ref): dos tocs encuats abans de perdre la sessió no
 *     escriuen després.
 *
 * El rellotge i l'atzar s'injecten (proves); el magatzem també.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSessioApp } from '../../plataforma/index.js';
import { creaMagatzemBar } from '../magatzem.js';
import { errorBar } from '../nucli/comu.js';
import { nouId } from '../nucli/ids.js';
import {
  adoptaComanda, afegeixProducte, anullaLinia, aplicaDescompte, canviaNota, canviaQuantitat, comandaObertaDe, convida, creaComanda,
  esDescartable, heretaHistorial, marxa, mouLinies, sumaQuantitat, totals
} from '../nucli/comanda.js';
import { afegeixPagament, potTancar, tanca } from '../nucli/cobrament.js';
import { divideixPerLinies } from '../nucli/divisio.js';
import { costDeVenda } from '../nucli/escandall.js';
import { creaDevolucio } from '../nucli/tiquet.js';
import { afegeixMoviment, arqueig, obriTorn, potVendre, resumTorn, tancaTorn } from '../nucli/torn.js';
import { marcaLlegida, notaDeTraspas } from '../nucli/traspas.js';
import { llistaReposicio } from '../nucli/reposicio.js';
import { obteLlavor } from '../llavors/index.js';
import { detectaMigsMoviments } from '../nucli/migMoviment.js';
import { textError } from './textos.js';

const ContextBar = createContext(null);

const araReal = () => new Date().toISOString();
const AMB_TORN = Object.freeze({ ambTorn: true });

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
  const generacio = useRef(0);
  const sessio = useSessioApp();
  const { potEscriure, motiu, enLinia, modeProves, rutaEntrada } = sessio;
  const permis = useMemo(() => Object.freeze({ potEscriure, motiu, enLinia, modeProves, rutaEntrada }),
    [potEscriure, motiu, enLinia, modeProves, rutaEntrada]);
  /* L'últim permís pintat, per a la guarda de la cua: les accions no canvien d'identitat. */
  const potEscriureAra = useRef(potEscriure);
  useEffect(() => {
    potEscriureAra.current = potEscriure;
  });

  const posa = useCallback((nou) => {
    ref.current = nou;
    setDades(nou);
  }, []);

  useEffect(() => {
    let viu = true;
    const llegixBase = () => setBase({ persistent: magatzem.base.persistent, mode: magatzem.base.mode });
    let modeAnterior = magatzem.base.mode;
    const recarrega = () => {
      const pas = cua.current.then(async () => {
        if (!viu) return;
        const d = await magatzem.carrega();
        if (viu) posa(d);
      });
      cua.current = pas.catch(() => {});
    };
    const desfes = magatzem.base.subscriu((esdeveniment) => {
      if (!viu) return;
      if (esdeveniment.tipus === 'mode') {
        const relleu = modeAnterior === 'lectora' && esdeveniment.mode === 'escriptora';
        modeAnterior = esdeveniment.mode;
        llegixBase();
        if (relleu) recarrega();
      } else if (esdeveniment.tipus === 'persistent') llegixBase();
      else if (esdeveniment.tipus === 'canvi' && !esdeveniment.local) recarrega();
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
      generacio.current += 1;
      desfes();
      magatzem.base.tanca();
    };
  }, [magatzem, posa]);

  /* Una operació a la cua: fn(estat, ctx) torna { estat?, valor }. */
  const opera = useCallback((fn) => {
    const vigent = generacio.current;
    const pas = cua.current.then(async () => {
      if (vigent !== generacio.current) throw errorBar('TANCAT', 'El Bar ja s’ha tancat.');
      const actual = ref.current;
      if (!actual) throw errorBar('CARREGANT', 'Encara s’està carregant.');
      const ara = rellotge();
      const id = (prefix) => nouId(prefix, ara, atzar);
      let resultat;
      try {
        resultat = await fn(actual, { ara, id });
      } catch (error) {
        if (['CONFLICTE', 'JA_TANCAT', 'TORN_TANCAT', 'TORN_OBERT'].includes(error?.codi)) {
          const fresques = await magatzem.carrega().catch(() => null);
          if (fresques && vigent === generacio.current) posa(fresques);
        }
        throw error;
      }
      if (resultat?.estat && vigent === generacio.current) posa({ ...ref.current, ...resultat.estat });
      return resultat?.valor;
    });
    cua.current = pas.catch(() => undefined);
    return pas.then((valor) => {
      if (vigent === generacio.current) setAvis(null);
      return { ok: true, valor };
    }, (error) => {
      if (vigent === generacio.current) setAvis(textError(error));
      return { ok: false, error };
    });
  }, [posa, rellotge, atzar, magatzem]);

  const accions = useMemo(() => {
    /* Una operació d'ESCRIPTURA: la guarda del permís (vegeu la capçalera) i després la de sempre. */
    const escriu = (fn) => opera((d, ctx) => {
      if (!potEscriureAra.current) throw errorBar('SENSE_PERMIS', 'Entra per a vendre.');
      if (magatzem.base.mode !== 'escriptora') throw errorBar('NOMES_LECTURA', 'Esta pestanya només pot llegir.');
      return fn(d, ctx);
    });
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
    const modifica = (comandaId, fn) => escriu(async (d, ctx) => {
      exigeixVenda(d);
      const nova = fn(comandaDe(d, comandaId), ctx, d);
      if (nova === comandaDe(d, comandaId)) return { valor: nova };
      const desada = await magatzem.desaComanda(nova, AMB_TORN);
      return { estat: ambComanda(d, desada), valor: desada };
    });

    const novaComandaA = async (d, ctx, origen) => {
      const comanda = creaComanda({ id: ctx.id('c'), tornId: d.tornActual.id, origen, ara: ctx.ara, per: d.tornActual.obertPer });
      return magatzem.desaComanda(comanda, AMB_TORN);
    };

    const traspassa = async (d, ctx, origenNou, destiNou, origenAbans) => {
      const destiAmbHistorial = esDescartable(origenNou) ? heretaHistorial(destiNou, origenAbans, { ara: ctx.ara }) : destiNou;
      const { origen, desti } = await magatzem.traspassaComandes(origenNou, destiAmbHistorial);
      const ambDesti = { ...d, ...ambComanda(d, desti) };
      const estat = origen ? ambComanda(ambDesti, origen) : { comandes: ambDesti.comandes.filter((c) => c.id !== origenNou.id) };
      return { estat, valor: desti };
    };

    /* Tanca i desa el tiquet; el torn en guarda la llista. */
    const tancaDesada = async (d, ctx, comanda) => {
      const tiquet = tanca(comanda, { numero: seguentNumero(d.tiquets), ara: ctx.ara });
      await magatzem.tancaComanda(tiquet, AMB_TORN);
      return { estat: { comandes: d.comandes.filter((c) => c.id !== comanda.id), tiquets: [...d.tiquets, tiquet] }, valor: { tiquet } };
    };

    return {
      /** Obri el torn (amb la nota anterior ja llegida) i adopta les comandes que hi passaven. */
      obriTorn: ({ per, fonsInicialCents }) => escriu(async (d, ctx) => {
        if (d.tornActual) throw errorBar('TORN_OBERT', 'Ja hi ha un torn obert.');
        const torn = obriTorn({ id: ctx.id('t'), per, fonsInicialCents, ara: ctx.ara, traspasAnterior: d.traspas });
        const previstes = d.comandes.map((comanda) => adoptaComanda(comanda, torn.id, { ara: ctx.ara }));
        const comandes = await magatzem.obriTorn(torn, previstes, d.traspas);
        return { estat: { tornActual: torn, torns: [torn, ...d.torns], comandes, tiquets: [], tancament: null }, valor: torn };
      }),

      /** La nota de traspàs del torn anterior, llegida (un toc). */
      llegeixTraspas: ({ per }) => escriu(async (d, ctx) => {
        if (!d.traspas) return { valor: null };
        const llegida = marcaLlegida(d.traspas, { per, ara: ctx.ara });
        await magatzem.desaMeta('traspas', llegida);
        return { estat: { traspas: llegida }, valor: llegida };
      }),

      /** Una comanda nova i buida (un tiquet de barra més, per emportar). */
      novaComanda: (origen) => escriu(async (d, ctx) => {
        exigeixVenda(d);
        const desada = await novaComandaA(d, ctx, origen);
        return { estat: ambComanda(d, desada), valor: desada };
      }),

      /**
       * Afig un producte a la comanda `comandaId` o, si la ruta no en nomena
       * cap, a la de l'origen (comandaObertaDe, amb l'estat d'ara: dos tocs
       * ràpids no en creen dues) o a una de nova.
       */
      afegeix: ({ comandaId = null, origen = { tipus: 'barra' } }, article) => escriu(async (d, ctx) => {
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
        const desada = await magatzem.desaComanda(nova, AMB_TORN);
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
      paga: (comandaId, pagament) => escriu(async (d, ctx) => {
        exigeixVenda(d);
        const nova = afegeixPagament(comandaDe(d, comandaId), pagament, { id: ctx.id('p'), ara: ctx.ara });
        if (totals(nova).pendentCents === 0) return tancaDesada(d, ctx, nova);
        const desada = await magatzem.desaComanda(nova, AMB_TORN);
        return { estat: ambComanda(d, desada), valor: { comanda: desada } };
      }),

      /** Tanca una comanda que ja no deu res (p. ex. tota convidada). */
      tanca: (comandaId) => escriu(async (d, ctx) => {
        exigeixVenda(d);
        const comanda = comandaDe(d, comandaId);
        const pot = potTancar(comanda);
        if (!pot.ok) throw errorBar(pot.motiu, 'Esta comanda no es pot tancar encara.');
        return tancaDesada(d, ctx, comanda);
      }),

      /** Descarta una comanda buida. */
      descarta: (comandaId) => escriu(async (d) => {
        const comanda = comandaDe(d, comandaId);
        await magatzem.descartaComanda(comanda);
        return { estat: { comandes: d.comandes.filter((c) => c.id !== comandaId) }, valor: null };
      }),

      /**
       * Mou línies a una altra comanda o a un origen sense comanda (una taula lliure).
       * Correccions del refutador (261011):
       *   T1 · Tot es valida ABANS d'escriure res. La comanda de destí nova es fa en memòria
       *        (abans s'escrivia buida i, si mouLinies refusava —un pagament parcial, PAGAT_SUPERA—,
       *        quedava una comanda fantasma al disc) i s'escriu una sola vegada, ja amb les línies.
       *   T2 · El magatzem comprova ambdues revisions i aplica el moviment en una transacció.
       *        La marca `op` permet identificar els moviments al llarg de l'historial.
       *   T7 · Si l'origen es buida i es descarta, el destí n'hereta l'historial.
       *   BAR-R9 (Onada 12) · Es descarta l'origen JA BUIT, no el d'abans.
       */
      mou: (comandaId, desti, seleccio) => escriu(async (d, ctx) => {
        exigeixVenda(d);
        const origen = comandaDe(d, comandaId);
        const comandaDesti = desti.comandaId
          ? comandaDe(d, desti.comandaId)
          : creaComanda({ id: ctx.id('c'), tornId: d.tornActual.id, origen: desti.origen, ara: ctx.ara, per: d.tornActual.obertPer });
        const r = mouLinies(origen, comandaDesti, seleccio, { ara: ctx.ara, nouIdLinia: () => ctx.id('l'), op: ctx.id('m') });
        return traspassa(d, ctx, r.origen, r.desti, origen);
      }),

      /**
       * Separa línies en una comanda filla (dividir el compte per línies). Com «mou»: la filla
       * i la mare, amb la marca del moviment; si la mare es buida, es descarta (BAR-R10) i la
       * filla n'hereta l'historial (T7).
       */
      divideix: (comandaId, seleccio) => escriu(async (d, ctx) => {
        exigeixVenda(d);
        const abans = comandaDe(d, comandaId);
        const { mare, filla } = divideixPerLinies(abans, seleccio, { idNova: ctx.id('c'), ara: ctx.ara, nouIdLinia: () => ctx.id('l'), op: ctx.id('m') });
        return traspassa(d, ctx, mare, filla, abans);
      }),

      /** Devolució enllaçada d'un tiquet del torn. */
      retorna: (tiquetId, seleccio, { motiu, metode }) => escriu(async (d, ctx) => {
        exigeixVenda(d);
        const tiquet = d.tiquets.find((t) => t.id === tiquetId);
        if (!tiquet) throw errorBar('NO_TROBADA', 'Este tiquet no és del torn obert.');
        const devolucio = creaDevolucio(tiquet, seleccio, {
          motiu, metode, id: ctx.id('k'), ara: ctx.ara, numero: seguentNumero(d.tiquets), tornId: d.tornActual.id,
          per: d.tornActual.obertPer, devolucionsPrevies: d.tiquets.filter((t) => t.tipus === 'devolucio')
        });
        await magatzem.desaDevolucio(devolucio, AMB_TORN);
        return { estat: { tiquets: [...d.tiquets, devolucio] }, valor: devolucio };
      }),

      /** Entrada o eixida de caixa. */
      moviment: (moviment) => escriu(async (d, ctx) => {
        if (!d.tornActual) throw errorBar('SENSE_TORN', 'No hi ha cap torn obert.');
        const torn = afegeixMoviment(d.tornActual, moviment, { id: ctx.id('m'), ara: ctx.ara });
        await magatzem.desaTorn(torn, d.tornActual);
        return { estat: { tornActual: torn, torns: d.torns.map((t) => (t.id === torn.id ? torn : t)) }, valor: torn };
      }),

      /**
       * L'esborrany del tancament (arqueig, avisos, fons): sobreviu a una
       * recàrrega. `canvis` és un objecte o una funció de l'esborrany d'ARA
       * (dins de la cua): els + i − de l'arqueig són relatius (BAR-R5).
       */
      desaEsborranyTancament: (canvis) => escriu(async (d) => {
        const actual = { perDenominacio: {}, avisos: [], fonsDeixatCents: 0, ...d.tancament };
        const tancament = { ...actual, ...(typeof canvis === 'function' ? canvis(actual) : canvis) };
        await magatzem.desaMeta('tancament', tancament);
        return { estat: { tancament }, valor: tancament };
      }),

      /**
       * Tanca el torn: resum, reposició, nota de traspàs i congelat. Les
       * comandes buides es descarten; la resta passa al torn següent.
       */
      tancaTorn: () => escriu(async (d, ctx) => {
        if (!d.tornActual) throw errorBar('SENSE_TORN', 'No hi ha cap torn obert.');
        const esborrany = { perDenominacio: {}, avisos: [], fonsDeixatCents: 0, ...d.tancament };
        const buides = d.comandes.filter(esDescartable);
        const obertes = d.comandes.filter((c) => !esDescartable(c));
        const resum = resumTorn(d.tornActual, d.tiquets, obertes, { categories: d.carta.categories });
        const comptat = arqueig(esborrany.perDenominacio, d.establiment.denominacions);
        const traspas = notaDeTraspas({
          torn: d.tornActual, resum, obertes, reposicio: llistaReposicio(d.tiquets, d.carta), avisos: esborrany.avisos,
          fonsDeixatCents: esborrany.fonsDeixatCents, diferenciaCaixaCents: comptat - resum.efectiuEsperatCents,
          per: d.tornActual.obertPer, ara: ctx.ara
        });
        const tancat = tancaTorn(d.tornActual, { arqueig: { perDenominacio: esborrany.perDenominacio }, resum, traspas, obertes, per: d.tornActual.obertPer, ara: ctx.ara });
        await magatzem.tancaTorn(tancat, d, buides);
        return {
          estat: { tornActual: null, torns: d.torns.map((t) => (t.id === tancat.id ? tancat : t)), comandes: obertes, tiquets: [], traspas, tancament: null },
          valor: tancat
        };
      }),

      desaCarta: (carta) => escriu(async () => ({ estat: { carta: await magatzem.desaCarta(carta) }, valor: true })),

      /**
       * Substituïx la carta per la d'una llavor (llavors/index.js). De
       * l'establiment només en canvia la identitat: el slug (el camí de les
       * fotos), el nom si la llavor en porta un i l'id de la llavor. L'IVA per
       * defecte i les denominacions són de qui gestiona el bar (Ajustos ›
       * Caixa) i es conserven. Només amb el torn tancat i cap comanda oberta
       * (OCUPAT): les línies obertes apunten a productes de la carta d'ara. La
       * sala, els torns i els tiquets no es toquen.
       * Torna { resum, avisos } de l'importador.
       */
      carregaLlavor: (id) => escriu(async (d) => {
        if (d.tornActual || d.comandes.length > 0) throw errorBar('OCUPAT', 'Cal tancar el torn i les comandes obertes abans de canviar la carta.');
        const llavor = await obteLlavor(id);
        const { nom, slug } = llavor.establiment || {};
        const establiment = { ...d.establiment, ...(nom ? { nom } : {}), ...(slug ? { slug } : {}), llavor: id };
        const carta = await magatzem.desaLlavor(llavor.carta, establiment, d);
        return { estat: { carta, establiment }, valor: { resum: llavor.resum, avisos: llavor.avisos } };
      }),
      desaEstabliment: (establiment) => escriu(async () => {
        await magatzem.desaMeta('establiment', establiment);
        return { estat: { establiment }, valor: establiment };
      }),

      /** Els tiquets d'un torn qualsevol (historial), de només lectura. */
      tiquetsDelTorn: (tornId) => magatzem.tiquetsDelTorn(tornId),
      demanaPersistencia: () => magatzem.base.demanaPersistencia(),
      estatPersistencia: () => magatzem.base.estatPersistencia(),
      bolca: () => magatzem.bolca(),
      exportaCopia: () => magatzem.exportaCopia(),
      restauraCopia: (text) => escriu(async () => {
        const valor = await magatzem.restauraCopia(text);
        return { estat: await magatzem.carrega(), valor };
      }),
      oblidaAvis: () => setAvis(null)
    };
  }, [opera, magatzem]);

  /* Correcció del refutador (261011, T2; «detecta i avisa») · Els moviments a mitges, calculats
     de l'estat d'ARA (comandes obertes i tiquets del torn), no només en carregar: l'avís no depén
     de cap operació (una de bona no l'esborra) i se'n va sol quan el duplicat ja no hi és. */
  const migsMoviments = useMemo(() => (dades ? detectaMigsMoviments(dades.comandes, dades.tiquets) : []), [dades]);

  const valor = useMemo(() => ({
    carregat: Boolean(dades),
    errorCarrega,
    ...base,
    avis,
    ...(dades || {}),
    migsMoviments,
    permis,
    accions
  }), [dades, errorCarrega, base, avis, migsMoviments, permis, accions]);

  return <ContextBar.Provider value={valor}>{children}</ContextBar.Provider>;
}

/** Dins de l'app del Bar: l'estat i les operacions. */
export function useBar() {
  const valor = useContext(ContextBar);
  if (!valor) throw new Error('useBar s’ha de cridar dins de ProveidorBar.');
  return valor;
}
