/* Suport de proves: un IndexedDB fals en memòria que clona amb
   structuredClone, fora de src/ (LLEI_08 de src/sections/tractors/clausura.test.js:
   el suport de proves viu a tests/helpers/).

   P1-12 / IDEA-19, pas 6 del disseny E2EE (disseny_final_e2ee.md §8.1).
   tests/helpers/idbFals.js clona amb JSON (:26) i convertiria una CryptoKey en
   {}; este, com el navegador, clona amb l'algorisme estructurat en desar i en
   llegir: una CryptoKey no extraïble torna CryptoKey, no extraïble i usable, i
   un Uint8Array torna Uint8Array. idbFals.js no es toca (el fan servir les
   proves del cofre).

   Què fa, i on és més estricte que el navegador (a posta):
     · open amb versions: VersionError si la base és més nova; si és més vella,
       versionchange a les connexions obertes, blocked si alguna no es tanca (i
       espera que es tanque) i la transacció d'actualització (createObjectStore
       i deleteObjectStore només dins d'ella; si el gestor llança, s'avorta i la
       base torna com era). Les obertures d'una base passen d'una en una.
     · claus fora de línia (put(valor, clau)) o keyPath de text, amb l'ordre de
       claus de l'especificació (nombre < data < text < binari < llista) i un
       IDBKeyRange propi (`IDBKeyRange`) per a get, getAll, getAllKeys, count i
       delete.
     · CAP índex ni cursor: createIndex, index i openCursor llancen. Els
       registres que porten una CryptoKey trenquen les consultes per índex al
       WebKit (bug 177350, recon_plataformes.md §3.2): qui ho provara ací ho
       veuria de seguida.
     · les transaccions d'una base passen d'una en una (com les readwrite que se
       solapen), es confirmen soles quan no queda cap petició i, avortades,
       desfan el que havien escrit al mateix lloc (les que ja l'esperaven no
       veuen mai el desfet; la d'actualització fa la foto abans del gestor).
       Només són actives durant el torn síncron en què es creen i durant cada
       callback (el navegador també ho és en les microtasques que encadenen):
       una petició feta després d'esperar el WebCrypto dins d'una transacció
       llança TransactionInactiveError.
     · `omplit = true` fa fallar amb QuotaExceededError el commit de qualsevol
       transacció que afig (put o add; esborrar no gasta espai);
       `fallaEnObrir = error` fa fallar open (navegació privada); cada error de
       `errorsEnTransaccio` avorta la pròxima transacció que comença (un
       UnknownError, una connexió perduda); `clona` s'injecta per a simular un
       motor que perd les claus.
     · `pestanya()` torna un altre IDBFactory damunt de les mateixes bases: el
       magatzem guarda les generacions per IDBFactory, l'una de cada pestanya.
     · `operacions` apunta cada petició; `files(base, store)` torna el que hi ha
       desat de veres ({ clau, valor }, en l'ordre de la clau); `connexions(base)`
       les connexions obertes, per a tancar-les sense avís com fa el navegador.
   Res d'ací no és codi de producció: només l'importen les proves. */

const despres = typeof setImmediate === 'function' ? (fn) => setImmediate(fn) : (fn) => setTimeout(fn, 0);
const espera = () => new Promise((resol) => despres(resol));
const errorDom = (nom, missatge) => new DOMException(missatge, nom);

/* El tipus d'una clau en l'ordre de l'especificació; null si no és una clau. */
function ordreDelTipus(clau) {
  if (typeof clau === 'number') return Number.isNaN(clau) ? null : 1;
  if (clau instanceof Date) return Number.isNaN(clau.getTime()) ? null : 2;
  if (typeof clau === 'string') return 3;
  if (clau instanceof ArrayBuffer || ArrayBuffer.isView(clau)) return 4;
  if (Array.isArray(clau)) return clau.every((c) => ordreDelTipus(c) !== null) ? 5 : null;
  return null;
}

const bytesDe = (clau) => (clau instanceof ArrayBuffer ? new Uint8Array(clau) : new Uint8Array(clau.buffer, clau.byteOffset, clau.byteLength));

const exigixClau = (clau) => {
  if (ordreDelTipus(clau) === null) throw errorDom('DataError', 'No és una clau vàlida d’IndexedDB.');
  return clau;
};

/** L'ordre de dues claus d'IndexedDB: -1, 0 o 1. */
export function comparaClaus(a, b) {
  const ta = ordreDelTipus(exigixClau(a));
  const tb = ordreDelTipus(exigixClau(b));
  if (ta !== tb) return ta < tb ? -1 : 1;
  if (ta === 2) return Math.sign(a.getTime() - b.getTime());
  if (ta === 4) {
    const x = bytesDe(a);
    const y = bytesDe(b);
    for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    return Math.sign(x.length - y.length);
  }
  if (ta === 5) {
    for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
      const c = comparaClaus(a[i], b[i]);
      if (c !== 0) return c;
    }
    return Math.sign(a.length - b.length);
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

/* Un text únic per a cada clau (0 i -0 són la mateixa, com a l'especificació). */
const etiqueta = (clau) => {
  const tipus = ordreDelTipus(clau);
  if (tipus === 1) return ['n', String(clau)];
  if (tipus === 2) return ['d', clau.getTime()];
  if (tipus === 3) return ['s', clau];
  if (tipus === 4) return ['b', [...bytesDe(clau)]];
  return ['a', clau.map(etiqueta)];
};
const codiDeClau = (clau) => JSON.stringify(etiqueta(exigixClau(clau)));

const RANGS = new WeakSet();
function creaRang(inferior, superior, inferiorObert, superiorObert) {
  const rang = Object.freeze({
    lower: inferior,
    upper: superior,
    lowerOpen: inferiorObert,
    upperOpen: superiorObert,
    includes(clau) {
      if (inferior !== undefined) {
        const c = comparaClaus(clau, inferior);
        if (c < 0 || (c === 0 && inferiorObert)) return false;
      }
      if (superior !== undefined) {
        const c = comparaClaus(clau, superior);
        if (c > 0 || (c === 0 && superiorObert)) return false;
      }
      return true;
    }
  });
  RANGS.add(rang);
  return rang;
}

/** L'IDBKeyRange del fals (només els seus rangs valen per a les seues consultes). */
export const IDBKeyRangeFals = Object.freeze({
  only: (clau) => creaRang(structuredClone(exigixClau(clau)), structuredClone(clau), false, false),
  bound(inferior, superior, inferiorObert = false, superiorObert = false) {
    const c = comparaClaus(inferior, superior);
    if (c > 0 || (c === 0 && (inferiorObert || superiorObert))) throw errorDom('DataError', 'El rang és buit o invertit.');
    return creaRang(structuredClone(inferior), structuredClone(superior), Boolean(inferiorObert), Boolean(superiorObert));
  },
  lowerBound: (inferior, obert = false) => creaRang(structuredClone(exigixClau(inferior)), undefined, Boolean(obert), false),
  upperBound: (superior, obert = false) => creaRang(undefined, structuredClone(exigixClau(superior)), false, Boolean(obert))
});

/* Quines claus tria una consulta: totes (res), un rang del fals o una clau exacta. */
function filtre(consulta, obligatoria) {
  if (consulta === undefined || consulta === null) {
    if (obligatoria) throw errorDom('DataError', 'Cal una clau o un rang.');
    return () => true;
  }
  if (RANGS.has(consulta)) return (clau) => consulta.includes(clau);
  exigixClau(consulta);
  return (clau) => comparaClaus(clau, consulta) === 0;
}

const ordenades = (store) => [...store.files.values()].sort((x, y) => comparaClaus(x.clau, y.clau));

/**
 * @param {object} [opcions]
 * @param {(valor: unknown) => unknown} [opcions.clona] el clonatge del motor (per defecte structuredClone)
 */
export function creaIdbFalsEstructurat({ clona = (valor) => structuredClone(valor) } = {}) {
  const bases = new Map();
  const obertures = new Map();
  const operacions = [];
  const fals = {};

  const creaBase = () => {
    const base = { versio: 0, stores: new Map(), connexions: new Set(), cua: Promise.resolve(), esperantTancar: [] };
    base.avisaTancades = () => {
      if (base.connexions.size === 0) base.esperantTancar.splice(0).forEach((resol) => resol());
    };
    base.totesTancades = () => (base.connexions.size === 0
      ? Promise.resolve()
      : new Promise((resol) => base.esperantTancar.push(resol)));
    return base;
  };

  /* `versioAbans` només per a la d'actualització: si s'avorta, la base torna a eixa versió. */
  function creaTransaccio(base, connexio, noms, mode, versioAbans = null) {
    const tx = { mode, db: connexio.bd, objectStoreNames: [...noms], error: null, oncomplete: null, onerror: null, onabort: null };
    let activa = true;
    let iniciada = false;
    let acabada = false;
    let enCurs = false;
    let creix = false;
    /* La foto per a desfer: la d'actualització abans del gestor (el crida processa, síncron), la resta en començar. */
    const fotografia = (versio) => ({
      versio,
      stores: new Map([...base.stores].map(([nom, s]) => [nom, { keyPath: s.keyPath, files: new Map(s.files) }]))
    });
    let instantania = mode === 'versionchange' ? fotografia(versioAbans) : null;
    let quanAcaba;
    const acabat = new Promise((resol) => { quanAcaba = resol; });
    const cua = [];
    queueMicrotask(() => { activa = false; });
    connexio.vives += 1;
    let allibera;
    const torn = new Promise((resol) => { allibera = resol; });
    const previ = base.cua;
    base.cua = previ.then(() => torn);

    const acaba = (correcta, error = null) => {
      if (acabada) return;
      acabada = true;
      activa = false;
      /* Es desfà al mateix objecte: una transacció que ja tenia el store no llig el desfet ni perd el que escriu. */
      if (!correcta && instantania) {
        for (const nom of [...base.stores.keys()]) if (!instantania.stores.has(nom)) base.stores.delete(nom);
        for (const [nom, copia] of instantania.stores) {
          const viu = base.stores.get(nom);
          if (viu) Object.assign(viu, copia);
          else base.stores.set(nom, copia);
        }
        base.versio = instantania.versio;
      }
      tx.error = correcta ? null : error;
      despres(() => {
        if (correcta) tx.oncomplete?.({ type: 'complete', target: tx });
        else tx.onabort?.({ type: 'abort', target: tx });
        connexio.vives -= 1;
        connexio.revisa();
        allibera();
        quanAcaba(correcta);
      });
    };
    const confirma = () => {
      if (mode !== 'readonly' && creix && fals.omplit) {
        acaba(false, errorDom('QuotaExceededError', 'No hi ha espai (simulat).'));
        return;
      }
      acaba(true);
    };
    const dispara = (gestor, event) => {
      activa = true;
      try {
        gestor?.(event);
        return null;
      } catch (error) {
        return error;
      } finally {
        activa = false;
      }
    };
    const seguent = () => {
      if (acabada || enCurs) return;
      const peticio = cua.shift();
      if (!peticio) {
        confirma();
        return;
      }
      enCurs = true;
      despres(() => {
        enCurs = false;
        if (acabada) return;
        const { p } = peticio;
        try {
          p.result = peticio.accio();
        } catch (error) {
          p.error = error;
          p.readyState = 'done';
          let previngut = false;
          const event = { type: 'error', target: p, preventDefault() { previngut = true; } };
          const llancat = dispara(p.onerror, event) ?? (previngut ? null : dispara(tx.onerror, event));
          if (llancat || !previngut) {
            acaba(false, llancat ? errorDom('AbortError', 'Un gestor ha llançat.') : error);
            return;
          }
          seguent();
          return;
        }
        p.readyState = 'done';
        if (dispara(p.onsuccess, { type: 'success', target: p })) {
          acaba(false, errorDom('AbortError', 'Un gestor ha llançat.'));
          return;
        }
        seguent();
      });
    };
    previ.then(() => despres(() => {
      if (acabada) return;
      iniciada = true;
      if (mode === 'readwrite') instantania = fotografia(base.versio);
      const injectat = mode === 'versionchange' ? undefined : fals.errorsEnTransaccio.shift();
      if (injectat) {
        acaba(false, injectat);
        return;
      }
      seguent();
    }));

    /* Una petició: comprova el torn i el mode, prepara (síncron, com el navegador: el clonatge es fa en cridar) i s'encua. */
    const peticio = (que, { escriu = false, afig = false, prepara = () => undefined, accio }) => {
      if (acabada || !activa) throw errorDom('TransactionInactiveError', `La transacció no és activa (${que}).`);
      if (escriu && mode === 'readonly') throw errorDom('ReadOnlyError', `Transacció de només lectura (${que}).`);
      const preparat = prepara();
      operacions.push(que);
      const p = { result: undefined, error: null, readyState: 'pending', transaction: tx, onsuccess: null, onerror: null };
      cua.push({
        p,
        accio: () => {
          if (afig) creix = true;
          return accio(preparat);
        }
      });
      if (iniciada) seguent();
      return p;
    };

    tx.abort = () => {
      if (acabada) throw errorDom('InvalidStateError', 'La transacció ja ha acabat.');
      acaba(false, null);
    };
    tx.objectStore = (nom) => {
      if (acabada) throw errorDom('InvalidStateError', 'La transacció ja ha acabat.');
      if (!noms.includes(nom) && mode !== 'versionchange') throw errorDom('NotFoundError', `«${nom}» no és d’esta transacció.`);
      const store = base.stores.get(nom);
      if (!store) throw errorDom('NotFoundError', `No hi ha cap store «${nom}».`);
      const valorAmbClau = (valor, clau) => {
        if (store.keyPath) {
          if (clau !== undefined) throw errorDom('DataError', 'Este store té keyPath: la clau no es passa.');
          const copia = clona(valor);
          return { clau: structuredClone(exigixClau(copia?.[store.keyPath])), copia };
        }
        if (clau === undefined) throw errorDom('DataError', 'Este store té les claus fora de línia: cal passar-la.');
        exigixClau(clau);
        return { clau: structuredClone(clau), copia: clona(valor) };
      };
      const tria = (consulta, quants) => {
        const coincidix = filtre(consulta, false);
        return () => {
          const files = ordenades(store).filter((e) => coincidix(e.clau));
          return quants ? files.slice(0, quants) : files;
        };
      };
      const sensePrimaria = (que) => () => {
        throw errorDom('NotSupportedError', `Este fals no té ${que}, a posta (WebKit 177350): consulta per clau primària.`);
      };
      return {
        name: nom,
        keyPath: store.keyPath,
        get(consulta) {
          const coincidix = filtre(consulta, true);
          return peticio('get', {
            accio: () => {
              const fila = ordenades(store).find((e) => coincidix(e.clau));
              return fila ? clona(fila.valor) : undefined;
            }
          });
        },
        getAll(consulta, quants) {
          const files = tria(consulta, quants);
          return peticio('getAll', { accio: () => files().map((e) => clona(e.valor)) });
        },
        getAllKeys(consulta, quants) {
          const files = tria(consulta, quants);
          return peticio('getAllKeys', { accio: () => files().map((e) => structuredClone(e.clau)) });
        },
        count(consulta) {
          const files = tria(consulta);
          return peticio('count', { accio: () => files().length });
        },
        put(valor, clau) {
          return peticio('put', {
            escriu: true,
            afig: true,
            prepara: () => valorAmbClau(valor, clau),
            accio: ({ clau: k, copia }) => {
              store.files.set(codiDeClau(k), { clau: k, valor: copia });
              return structuredClone(k);
            }
          });
        },
        add(valor, clau) {
          return peticio('add', {
            escriu: true,
            afig: true,
            prepara: () => valorAmbClau(valor, clau),
            accio: ({ clau: k, copia }) => {
              if (store.files.has(codiDeClau(k))) throw errorDom('ConstraintError', 'Clau duplicada.');
              store.files.set(codiDeClau(k), { clau: k, valor: copia });
              return structuredClone(k);
            }
          });
        },
        delete(consulta) {
          const coincidix = filtre(consulta, true);
          return peticio('delete', {
            escriu: true,
            accio: () => {
              for (const [codi, e] of [...store.files]) if (coincidix(e.clau)) store.files.delete(codi);
              return undefined;
            }
          });
        },
        clear() {
          return peticio('clear', { escriu: true, accio: () => { store.files.clear(); } });
        },
        createIndex: sensePrimaria('índexs'),
        index: sensePrimaria('índexs'),
        openCursor: sensePrimaria('cursors'),
        openKeyCursor: sensePrimaria('cursors')
      };
    };
    return { tx, acabada: () => acabada, acabat };
  }

  function creaConnexio(base, nom, versio) {
    const connexio = { vives: 0, tancada: false, versio, actualitzant: null, bd: null };
    connexio.revisa = () => {
      if (connexio.tancada && connexio.vives === 0 && base.connexions.delete(connexio)) base.avisaTancades();
    };
    const noms = () => [...base.stores.keys()].sort();
    const dinsActualitzacio = (que) => {
      if (!connexio.actualitzant || connexio.actualitzant.acabada()) {
        throw errorDom('InvalidStateError', `${que} només es pot fer dins de l’actualització.`);
      }
    };
    connexio.bd = {
      name: nom,
      get version() { return connexio.versio; },
      objectStoreNames: Object.freeze({
        contains: (n) => base.stores.has(n),
        get length() { return base.stores.size; },
        item: (i) => noms()[i] ?? null,
        [Symbol.iterator]: () => noms()[Symbol.iterator]()
      }),
      onversionchange: null,
      onclose: null,
      onabort: null,
      onerror: null,
      close() {
        connexio.tancada = true;
        connexio.revisa();
      },
      transaction(llista, mode = 'readonly') {
        if (connexio.tancada) throw errorDom('InvalidStateError', 'La connexió està tancada.');
        if (connexio.actualitzant && !connexio.actualitzant.acabada()) throw errorDom('InvalidStateError', 'Hi ha una actualització en curs.');
        const demanats = Array.isArray(llista) ? [...llista] : [llista];
        if (demanats.length === 0) throw errorDom('InvalidAccessError', 'Cal almenys un store.');
        for (const n of demanats) if (!base.stores.has(n)) throw errorDom('NotFoundError', `No hi ha cap store «${n}».`);
        if (mode !== 'readonly' && mode !== 'readwrite') throw new TypeError(`Mode de transacció desconegut: ${mode}.`);
        return creaTransaccio(base, connexio, demanats, mode).tx;
      },
      createObjectStore(n, opcions = {}) {
        dinsActualitzacio('createObjectStore');
        if (base.stores.has(n)) throw errorDom('ConstraintError', `Ja hi ha un store «${n}».`);
        if (opcions.autoIncrement) throw errorDom('NotSupportedError', 'Este fals no fa autoIncrement.');
        if (opcions.keyPath !== undefined && opcions.keyPath !== null && typeof opcions.keyPath !== 'string') {
          throw errorDom('NotSupportedError', 'Este fals només fa keyPath de text.');
        }
        base.stores.set(n, { keyPath: opcions.keyPath ?? null, files: new Map() });
        return connexio.actualitzant.tx.objectStore(n);
      },
      deleteObjectStore(n) {
        dinsActualitzacio('deleteObjectStore');
        if (!base.stores.delete(n)) throw errorDom('NotFoundError', `No hi ha cap store «${n}».`);
      }
    };
    base.connexions.add(connexio);
    return connexio;
  }

  async function processa(nom, versio, peticio) {
    await espera();
    const falla = (error) => {
      peticio.error = error;
      peticio.readyState = 'done';
      peticio.onerror?.({ type: 'error', target: peticio });
    };
    const surt = () => {
      peticio.readyState = 'done';
      peticio.onsuccess?.({ type: 'success', target: peticio });
    };
    if (fals.fallaEnObrir) {
      falla(fals.fallaEnObrir);
      return;
    }
    let base = bases.get(nom);
    if (!base) {
      base = creaBase();
      bases.set(nom, base);
    }
    const desti = versio ?? Math.max(base.versio, 1);
    if (desti < base.versio) {
      falla(errorDom('VersionError', `La base «${nom}» ja és a la versió ${base.versio}.`));
      return;
    }
    if (desti === base.versio) {
      peticio.result = creaConnexio(base, nom, desti).bd;
      surt();
      return;
    }
    const vella = base.versio;
    for (const c of [...base.connexions]) {
      if (!c.tancada) c.bd.onversionchange?.({ type: 'versionchange', oldVersion: vella, newVersion: desti, target: c.bd });
    }
    await espera();
    if ([...base.connexions].some((c) => !c.tancada)) {
      peticio.onblocked?.({ type: 'blocked', oldVersion: vella, newVersion: desti, target: peticio });
    }
    await base.totesTancades();
    await base.cua;
    const connexio = creaConnexio(base, nom, desti);
    const actualitzacio = creaTransaccio(base, connexio, [...base.stores.keys()], 'versionchange', vella);
    connexio.actualitzant = actualitzacio;
    base.versio = desti;
    peticio.result = connexio.bd;
    peticio.transaction = actualitzacio.tx;
    try {
      peticio.onupgradeneeded?.({ type: 'upgradeneeded', oldVersion: vella, newVersion: desti, target: peticio });
    } catch {
      if (!actualitzacio.acabada()) actualitzacio.tx.abort();
    }
    const correcta = await actualitzacio.acabat;
    peticio.transaction = null;
    if (!correcta) {
      connexio.bd.close();
      if (base.versio === 0) bases.delete(nom);
      peticio.result = undefined;
      falla(errorDom('AbortError', 'S’ha avortat l’actualització.'));
      return;
    }
    surt();
  }

  return Object.assign(fals, {
    IDBKeyRange: IDBKeyRangeFals,
    bases,
    operacions,
    omplit: false,
    fallaEnObrir: null,
    errorsEnTransaccio: [],
    /* Una altra pestanya del mateix navegador: un IDBFactory propi damunt de les mateixes bases. */
    pestanya() {
      return Object.freeze({ IDBKeyRange: IDBKeyRangeFals, open: (nom, versio) => fals.open(nom, versio) });
    },
    open(nom, versio) {
      if (versio !== undefined && !(Number.isInteger(versio) && versio >= 1)) throw new TypeError('La versió ha de ser un enter positiu.');
      operacions.push('open');
      const peticio = { result: undefined, error: null, transaction: null, readyState: 'pending', onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
      const aquesta = (obertures.get(nom) ?? Promise.resolve()).then(() => processa(nom, versio, peticio)).catch(() => {});
      obertures.set(nom, aquesta);
      return peticio;
    },
    /* Les files desades d'un store, en l'ordre de la clau. */
    files(nomBase, nomStore) {
      const store = bases.get(nomBase)?.stores.get(nomStore);
      return store ? ordenades(store).map((e) => ({ clau: structuredClone(e.clau), valor: clona(e.valor) })) : [];
    },
    /* Les connexions obertes d'una base (les seues IDBDatabase falses). */
    connexions(nomBase) {
      return [...(bases.get(nomBase)?.connexions ?? [])].filter((c) => !c.tancada).map((c) => c.bd);
    },
    /* Com el navegador quan es buiden les dades del lloc: tanca les connexions i avisa amb close. */
    tancaConnexions(nomBase) {
      for (const bd of fals.connexions(nomBase)) {
        bd.close();
        bd.onclose?.({ type: 'close', target: bd });
      }
    }
  });
}
