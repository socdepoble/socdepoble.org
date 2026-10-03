/**
 * magatzemLocal.js — dades que només viuen en este dispositiu (IndexedDB).
 *
 * Generalització de gestoria/aprendre/magatzemProgres.js, sense importar-lo:
 *   · Cada operació obri la base, fa UNA transacció i la tanca. Si una altra
 *     pestanya puja la versió, la connexió es tanca sola; i si esta pestanya
 *     té el codi vell, les operacions fallen amb el codi VERSIO_ANTIGA.
 *   · Les operacions van en fila: una escriptura vella mai aterra damunt
 *     d'una de nova.
 *   · Sense IndexedDB, o si el navegador no el deixa obrir la PRIMERA vegada
 *     (navegació privada, permisos), treballa en memòria i ho declara amb
 *     `persistent: false`: la UI ho ha de dir, perquè les dades duren només la
 *     sessió. Si la base ja s'ha obert i deixa de respondre, no passa a
 *     memòria (seria una còpia parcial): l'operació falla amb NO_DISPONIBLE.
 *   · Llista blanca per store: el que no hi és no arriba al disc.
 *   · Una sola pestanya escriu (Web Locks, `ifAvailable`); la resta queda en
 *     lectura, ho diu, i agafa el relleu quan l'escriptora es tanca.
 *   · Avís de canvis entre pestanyes amb BroadcastChannel. El missatge només
 *     porta el nom del store: cap valor, cap clau.
 * Res d'això ix de l'ordinador: cap crida de xarxa.
 *
 * Ús:
 *   const magatzem = creaMagatzemIdb({
 *     nom: 'sdp-bar', versio: 1,
 *     stores: { tiquets: { clau: 'id', indexs: ['tornId'] }, meta: { clau: 'clau' } },
 *     llistaBlanca: { tiquets: ['id', 'tornId', 'linies', 'total'], meta: (r) => ({ clau: r.clau, valor: r.valor }) }
 *   });
 *   await magatzem.obtinBloqueig();            // 'escriptora' | 'lectora'
 *   await magatzem.desa('tiquets', { id: 't-1', tornId: 'torn-1', linies: [], total: 0 });
 *   const delTorn = await magatzem.perIndex('tiquets', 'tornId', 'torn-1');
 *   const desfes = magatzem.subscriu((avis) => { … });  // { tipus: 'canvi' | 'mode' | 'persistent', … }
 *   magatzem.tanca();
 */

const PREFIX = 'sdp-magatzem:';
const MODES = Object.freeze({ lliure: 'lliure', escriptora: 'escriptora', lectora: 'lectora' });

/* Un error amb codi estable, perquè la UI decidisca què diu:
     NOMES_LECTURA  una altra pestanya escriu; esta només llig
     BLOQUEJAT      una altra pestanya té oberta una versió anterior
     VERSIO_ANTIGA  una altra pestanya ja ha pujat la versió: cal recarregar
     NO_DISPONIBLE  la base s'havia obert i ara no respon: cal recarregar */
const errorAmbCodi = (codi, missatge, causa) => Object.assign(
  new Error(missatge, causa === undefined ? undefined : { cause: causa }),
  { codi }
);
const CODIS_DE_BASE = new Set(['BLOQUEJAT', 'VERSIO_ANTIGA', 'NO_DISPONIBLE']);

const copia = (valor) => (valor === undefined ? undefined : structuredClone(valor));

function comprovaDefinicio({ nom, versio, stores, llistaBlanca }) {
  if (typeof nom !== 'string' || nom.trim() === '') throw new TypeError('Cal el nom de la base (p. ex. «sdp-bar»).');
  if (!Number.isSafeInteger(versio) || versio < 1) throw new TypeError('La versió de la base ha de ser un enter positiu.');
  if (!stores || typeof stores !== 'object' || Object.keys(stores).length === 0) throw new TypeError('Cal almenys un store.');
  if (!llistaBlanca || typeof llistaBlanca !== 'object') throw new TypeError('Cal la llista blanca de camps de cada store.');
  const definicions = new Map();
  for (const [nomStore, definicio] of Object.entries(stores)) {
    const clau = definicio?.clau;
    if (typeof clau !== 'string' || clau === '') throw new TypeError(`El store «${nomStore}» necessita la clau (el camp que l'identifica).`);
    const indexs = definicio.indexs ?? [];
    if (!Array.isArray(indexs) || indexs.some((camp) => typeof camp !== 'string' || camp === '')) {
      throw new TypeError(`Els índexs del store «${nomStore}» són una llista de noms de camp.`);
    }
    const blanca = llistaBlanca[nomStore];
    if (Array.isArray(blanca)) {
      for (const camp of [clau, ...indexs]) {
        if (!blanca.includes(camp)) throw new TypeError(`La llista blanca de «${nomStore}» ha d'incloure «${camp}».`);
      }
    } else if (typeof blanca !== 'function') {
      throw new TypeError(`Falta la llista blanca del store «${nomStore}» (una llista de camps o una funció).`);
    }
    definicions.set(nomStore, { clau, indexs: [...indexs], blanca });
  }
  return definicions;
}

/**
 * Crea un magatzem local sobre IndexedDB.
 * @param {object} opcions
 * @param {string} opcions.nom nom de la base (p. ex. 'sdp-bar'); també anomena el bloqueig i el canal
 * @param {number} opcions.versio enter ≥ 1; pujar-la crea els stores i índexs nous (mai n'esborra)
 * @param {Record<string, { clau: string, indexs?: string[] }>} opcions.stores
 * @param {Record<string, string[] | ((registre: object) => object)>} opcions.llistaBlanca
 *   per store: els camps que es desen (els altres es descarten) o una funció
 *   que torna el registre net (i llança un TypeError per a rebutjar-lo)
 * @param {IDBFactory|null} [opcions.idb] per defecte globalThis.indexedDB; null → memòria
 * @param {Navigator|null} [opcions.navegador] per a Web Locks i StorageManager (proves)
 * @param {typeof BroadcastChannel|null} [opcions.Canal] per a l'avís entre pestanyes (proves)
 */
export function creaMagatzemIdb({
  nom, versio = 1, stores, idb = globalThis.indexedDB, llistaBlanca,
  navegador = globalThis.navigator, Canal = globalThis.BroadcastChannel
} = {}) {
  const definicions = comprovaDefinicio({ nom, versio, stores, llistaBlanca });
  const NOMS = [...definicions.keys()];
  const nomCompartit = PREFIX + nom;

  /* El magatzem sencer quan no hi ha IndexedDB. Mentre IndexedDB funciona no
     es toca: mai es barregen dades del disc amb una còpia parcial. */
  const memoria = new Map(NOMS.map((n) => [n, new Map()]));
  let disponible = Boolean(idb);
  /* true des de la primera obertura bona: a partir d'ací ja no es passa a memòria. */
  let haObert = false;
  let cadena = Promise.resolve();
  let mode = MODES.lliure;
  let alliberament = null;
  let espera = null;
  /* Puja amb cada tanca(): un callback de Web Locks d'una generació anterior no fa res. */
  let generacio = 0;
  let canal = null;
  const oients = new Set();

  /* ── Avisos ─────────────────────────────────────────────────────────── */

  /* En una microtasca: un oient que falla no trenca l'operació que avisa. */
  function emet(avis) {
    for (const oient of [...oients]) queueMicrotask(() => oient(avis));
  }

  function obriCanal() {
    if (canal || typeof Canal !== 'function') return canal;
    try {
      canal = new Canal(nomCompartit);
    } catch {
      return null;
    }
    canal.onmessage = (event) => {
      const store = event?.data?.store;
      if (event?.data?.tipus === 'canvi' && definicions.has(store)) emet({ tipus: 'canvi', store, local: false });
    };
    /* Fora del navegador (Node), que el canal no retinga el procés. */
    if (typeof canal.unref === 'function') canal.unref();
    return canal;
  }

  function avisaCanvi(store) {
    emet({ tipus: 'canvi', store, local: true });
    try { obriCanal()?.postMessage({ tipus: 'canvi', store }); } catch { /* canal tancat: res a avisar */ }
  }

  function passaAMemoria() {
    if (!disponible) return;
    disponible = false;
    emet({ tipus: 'persistent', persistent: false });
  }

  function canviaMode(nou) {
    if (mode === nou) return;
    mode = nou;
    emet({ tipus: 'mode', mode });
  }

  /* ── IndexedDB ──────────────────────────────────────────────────────── */

  function obri() {
    return new Promise((resolve, reject) => {
      let acabada = false;
      const peticio = idb.open(nom, versio);
      peticio.onupgradeneeded = () => {
        const db = peticio.result;
        for (const [nomStore, { clau, indexs }] of definicions) {
          const magatzem = db.objectStoreNames.contains(nomStore)
            ? peticio.transaction.objectStore(nomStore)
            : db.createObjectStore(nomStore, { keyPath: clau });
          for (const camp of indexs) {
            if (!magatzem.indexNames.contains(camp)) magatzem.createIndex(camp, camp, { unique: false });
          }
        }
      };
      peticio.onerror = () => {
        acabada = true;
        const error = peticio.error;
        if (error?.name === 'VersionError') {
          reject(errorAmbCodi('VERSIO_ANTIGA', 'Hi ha una versió nova en una altra pestanya: recarrega la pàgina per a continuar.', error));
          return;
        }
        reject(error || new Error('No s’ha pogut obrir la base local.'));
      };
      peticio.onblocked = () => {
        acabada = true;
        reject(errorAmbCodi('BLOQUEJAT', 'Una altra pestanya té oberta una versió anterior: tanca-la per a continuar.'));
      };
      peticio.onsuccess = () => {
        const db = peticio.result;
        if (acabada) {
          db.close();
          return;
        }
        acabada = true;
        db.onversionchange = () => db.close();
        resolve(db);
      };
    });
  }

  /* Obri la base. Un error amb codi (BLOQUEJAT, VERSIO_ANTIGA) es llança.
     Si la base no s'ha pogut obrir mai, passa a memòria i torna null; si ja
     s'havia obert, llança NO_DISPONIBLE: la memòria només tindria el que
     s'ha escrit en esta sessió, i servir-la com si fóra completa perdria dades. */
  async function obriOPassaAMemoria() {
    try {
      const db = await obri();
      haObert = true;
      return db;
    } catch (error) {
      if (CODIS_DE_BASE.has(error?.codi)) throw error;
      if (haObert) throw errorAmbCodi('NO_DISPONIBLE', 'La base local ha deixat de respondre: recarrega la pàgina abans de continuar.', error);
      passaAMemoria();
      return null;
    }
  }

  /* Una transacció sobre `noms`. `accio(tx, torna, avorta)` programa les
     peticions; `enMemoria()` fa el mateix sobre la memòria quan no hi ha IndexedDB. */
  async function opera(noms, tipus, accio, enMemoria) {
    if (!disponible) return enMemoria();
    const db = await obriOPassaAMemoria();
    if (!db) return enMemoria();
    try {
      return await new Promise((resolve, reject) => {
        let tx;
        try {
          tx = db.transaction(noms, tipus);
        } catch (error) {
          reject(error);
          return;
        }
        let resultat;
        let errorPropi = null;
        const torna = (valor) => { resultat = valor; };
        const avorta = (error) => {
          errorPropi = error;
          try { tx.abort(); } catch { /* ja acabada */ }
        };
        tx.oncomplete = () => resolve(resultat);
        tx.onerror = () => reject(errorPropi || tx.error || new Error('La base local no s’ha pogut actualitzar.'));
        tx.onabort = tx.onerror;
        try {
          accio(tx, torna, avorta);
        } catch (error) {
          avorta(error);
        }
      });
    } finally {
      db.close();
    }
  }

  function enFila(operacio) {
    const pas = cadena.then(operacio);
    cadena = pas.catch(() => undefined);
    return pas;
  }

  /* ── Validació ──────────────────────────────────────────────────────── */

  function definicio(store) {
    const def = definicions.get(store);
    if (!def) throw new TypeError(`Store desconegut: «${store}».`);
    return def;
  }

  const clauValida = (valor) => (typeof valor === 'string' && valor !== '') || Number.isFinite(valor);
  /* El valor que es busca en un índex: un text o un nombre finit. IndexedDB
     llegiria undefined o null com «tot l'índex» i llançaria amb un booleà o
     un objecte; la memòria, en canvi, no tornaria res. Es rebutgen abans. */
  const valorIndexValid = (valor) => typeof valor === 'string' || Number.isFinite(valor);

  /* En memòria, el mateix ordre que IndexedDB: els nombres abans que els textos, i cada grup de menor a major. */
  function perClau(store, registres) {
    const { clau } = definicio(store);
    const rang = (valor) => (typeof valor === 'number' ? 0 : 1);
    return registres.sort((a, b) => {
      const [x, y] = [a[clau], b[clau]];
      if (rang(x) !== rang(y)) return rang(x) - rang(y);
      if (x < y) return -1;
      return x > y ? 1 : 0;
    });
  }
  const deMemoria = (store, filtre = () => true) => perClau(store, [...memoria.get(store).values()].filter(filtre).map(copia));

  /* La llista blanca: el registre que es desa és una còpia neta. */
  function registreNet(store, registre) {
    const { clau, blanca } = definicio(store);
    if (!registre || typeof registre !== 'object' || Array.isArray(registre)) throw new TypeError(`Registre no vàlid per a «${store}».`);
    let net;
    if (typeof blanca === 'function') {
      net = blanca(registre);
      if (!net || typeof net !== 'object') throw new TypeError(`La llista blanca de «${store}» no ha tornat cap registre.`);
    } else {
      net = {};
      for (const camp of blanca) if (registre[camp] !== undefined) net[camp] = registre[camp];
    }
    if (!clauValida(net[clau])) throw new TypeError(`El registre de «${store}» no porta una clau «${clau}» vàlida.`);
    return copia(net);
  }

  function exigeixEscriptura() {
    if (mode === MODES.lectora) {
      throw errorAmbCodi('NOMES_LECTURA', 'Una altra pestanya està escrivint: esta només pot llegir.');
    }
  }

  /* ── API ────────────────────────────────────────────────────────────── */

  const llegix = (store, accio, enMemoria) => {
    try {
      definicio(store);
    } catch (error) {
      return Promise.reject(error);
    }
    return enFila(() => opera(store, 'readonly', (tx, torna) => accio(tx.objectStore(store), torna), enMemoria));
  };

  return {
    /** true mentre les dades van a IndexedDB; false si viuen només en memòria. */
    get persistent() { return disponible; },

    /** 'lliure' (sense bloqueig demanat) · 'escriptora' · 'lectora' (no pot escriure). */
    get mode() { return mode; },

    /** Obri la base una vegada (crea stores i índexs) i diu si és persistent. */
    prepara() {
      return enFila(async () => {
        if (!disponible) return false;
        (await obriOPassaAMemoria())?.close();
        return disponible;
      });
    },

    /** Un registre per la clau (còpia), o undefined. */
    obte(store, clau) {
      return llegix(store, (magatzem, torna) => {
        const peticio = magatzem.get(clau);
        peticio.onsuccess = () => torna(peticio.result);
      }, () => copia(memoria.get(store).get(clau)));
    },

    /** Tots els registres d'un store (còpies), en l'ordre de la clau a IndexedDB. */
    totes(store) {
      return llegix(store, (magatzem, torna) => {
        const peticio = magatzem.getAll();
        peticio.onsuccess = () => torna(peticio.result);
      }, () => deMemoria(store));
    },

    /**
     * Els registres amb `index` igual a `valor`. L'índex ha d'estar declarat i
     * el valor ha de ser un text o un nombre finit (TypeError si no): mai
     * «tot l'índex» per un undefined.
     */
    perIndex(store, index, valor) {
      if (!definicions.get(store)?.indexs.includes(index)) return Promise.reject(new TypeError(`«${store}» no té l'índex «${index}».`));
      if (!valorIndexValid(valor)) return Promise.reject(new TypeError(`perIndex(«${store}», «${index}») espera un text o un nombre finit.`));
      return llegix(store, (magatzem, torna) => {
        const peticio = magatzem.index(index).getAll(valor);
        peticio.onsuccess = () => torna(peticio.result);
      }, () => deMemoria(store, (r) => r[index] === valor));
    },

    /** Desa (o substituïx) un registre passat per la llista blanca; torna la còpia desada. */
    async desa(store, registre) {
      exigeixEscriptura();
      const net = registreNet(store, registre);
      const { clau } = definicio(store);
      await enFila(() => opera(store, 'readwrite', (tx) => { tx.objectStore(store).put(net); }, () => {
        memoria.get(store).set(net[clau], net);
      }));
      avisaCanvi(store);
      return copia(net);
    },

    /** Desa molts registres en una sola transacció: o tots o cap. */
    async desaTots(store, registres) {
      exigeixEscriptura();
      if (!Array.isArray(registres)) throw new TypeError('desaTots espera una llista de registres.');
      const nets = registres.map((registre) => registreNet(store, registre));
      const { clau } = definicio(store);
      await enFila(() => opera(store, 'readwrite', (tx) => {
        const magatzem = tx.objectStore(store);
        for (const net of nets) magatzem.put(net);
      }, () => {
        for (const net of nets) memoria.get(store).set(net[clau], net);
      }));
      avisaCanvi(store);
      return nets.map(copia);
    },

    /**
     * Llig i reescriu un registre dins de la MATEIXA transacció. `fn(actual)`
     * rep una còpia (o undefined) i ha de ser síncrona: torna el registre nou,
     * undefined per a no canviar res, o llança per a avortar (p. ex. un
     * conflicte de `rev`); l'error arriba tal qual a qui crida.
     */
    async actualitza(store, clau, fn) {
      exigeixEscriptura();
      const { clau: camp } = definicio(store);
      if (typeof fn !== 'function') throw new TypeError('actualitza necessita una funció.');
      const prepara = (actual) => {
        const nou = fn(copia(actual));
        if (nou === undefined) return { canvi: false, registre: copia(actual) };
        const net = registreNet(store, nou);
        if (net[camp] !== clau) throw new TypeError(`actualitza no pot canviar la clau «${camp}».`);
        return { canvi: true, registre: net };
      };
      const resultat = await enFila(() => opera(store, 'readwrite', (tx, torna, avorta) => {
        const magatzem = tx.objectStore(store);
        const peticio = magatzem.get(clau);
        peticio.onsuccess = () => {
          try {
            const r = prepara(peticio.result);
            if (r.canvi) magatzem.put(r.registre);
            torna(r);
          } catch (error) {
            avorta(error);
          }
        };
      }, () => {
        const r = prepara(memoria.get(store).get(clau));
        if (r.canvi) memoria.get(store).set(clau, r.registre);
        return r;
      }));
      if (resultat.canvi) avisaCanvi(store);
      return copia(resultat.registre);
    },

    /** Esborra un registre per la clau. */
    async esborra(store, clau) {
      exigeixEscriptura();
      definicio(store);
      await enFila(() => opera(store, 'readwrite', (tx) => { tx.objectStore(store).delete(clau); }, () => {
        memoria.get(store).delete(clau);
      }));
      avisaCanvi(store);
    },

    /** Buida un store sencer. */
    async buida(store) {
      exigeixEscriptura();
      definicio(store);
      await enFila(() => opera(store, 'readwrite', (tx) => { tx.objectStore(store).clear(); }, () => {
        memoria.get(store).clear();
      }));
      avisaCanvi(store);
    },

    /** Buida TOTS els stores en una sola transacció («Esborra-ho tot»). */
    async buidaTot() {
      exigeixEscriptura();
      await enFila(() => opera(NOMS, 'readwrite', (tx) => {
        for (const store of NOMS) tx.objectStore(store).clear();
      }, () => {
        for (const store of NOMS) memoria.get(store).clear();
      }));
      for (const store of NOMS) avisaCanvi(store);
    },

    /** Tots els stores d'una vegada (per a fer una còpia): { store: [registres] }. */
    bolca() {
      return enFila(() => opera(NOMS, 'readonly', (tx, torna) => {
        const bolcat = {};
        for (const store of NOMS) {
          const peticio = tx.objectStore(store).getAll();
          peticio.onsuccess = () => {
            bolcat[store] = peticio.result;
            torna(bolcat);
          };
        }
      }, () => Object.fromEntries(NOMS.map((store) => [store, deMemoria(store)]))));
    },

    /**
     * Demana que el navegador no esborre les dades quan li falte espai
     * (navigator.storage.persist). true concedit · false denegat · null sense API.
     */
    async demanaPersistencia() {
      const storage = navegador?.storage;
      if (typeof storage?.persist !== 'function') return null;
      try {
        return Boolean(await storage.persist());
      } catch {
        return false;
      }
    },

    /**
     * L'estat que la UI ha de mostrar:
     *   persistent  les dades van a IndexedDB (false: només memòria)
     *   duradora    el navegador ha promés no esborrar-les (null: no se sap)
     *   usat/quota  bytes, si el navegador ho diu (null si no)
     *   mode        'lliure' | 'escriptora' | 'lectora'
     */
    async estatPersistencia() {
      const storage = navegador?.storage;
      let duradora = null;
      let usat = null;
      let quota = null;
      try {
        if (typeof storage?.persisted === 'function') duradora = Boolean(await storage.persisted());
      } catch { duradora = null; }
      try {
        if (typeof storage?.estimate === 'function') {
          const estimacio = await storage.estimate();
          usat = Number.isFinite(estimacio?.usage) ? estimacio.usage : null;
          quota = Number.isFinite(estimacio?.quota) ? estimacio.quota : null;
        }
      } catch { /* sense estimació */ }
      return { persistent: disponible, duradora, usat, quota, mode };
    },

    /**
     * Intenta ser la pestanya que escriu (Web Locks, `ifAvailable`).
     * 'escriptora': esta escriu · 'lectora': una altra ja escriu; esta espera
     * el relleu i avisa amb { tipus: 'mode', mode: 'escriptora' } quan li toca.
     * Sense Web Locks no hi ha manera de coordinar-se: 'escriptora'.
     * El navegador crida el callback del bloqueig en una tasca posterior: si
     * tanca() arriba abans, el callback no reté res ni es posa a la cua, i la
     * promesa torna 'lliure' (el cas de StrictMode, que munta, desmunta i torna a muntar).
     */
    obtinBloqueig() {
      const locks = navegador?.locks;
      if (mode === MODES.escriptora) return Promise.resolve(mode);
      if (typeof locks?.request !== 'function') {
        canviaMode(MODES.escriptora);
        return Promise.resolve(mode);
      }
      const meva = generacio;
      const vigent = () => meva === generacio;
      const reten = () => new Promise((allibera) => { alliberament = allibera; });
      const esperaRelleu = () => {
        if (espera) return;
        const controlador = new AbortController();
        espera = controlador;
        locks.request(nomCompartit, { signal: controlador.signal }, () => {
          if (espera === controlador) espera = null;
          /* Concedit després de tanca(): es torna en acabant i passa a la següent. */
          if (!vigent()) return undefined;
          canviaMode(MODES.escriptora);
          return reten();
        }).catch(() => {
          if (espera === controlador) espera = null;
        });
      };
      return new Promise((resolve) => {
        locks.request(nomCompartit, { ifAvailable: true }, (bloqueig) => {
          if (!vigent()) {
            resolve(mode);
            return undefined;
          }
          if (!bloqueig) {
            /* Si el relleu ja ha arribat, el bloqueig és nostre: no es torna a lectora. */
            if (mode !== MODES.escriptora) {
              canviaMode(MODES.lectora);
              esperaRelleu();
            }
            resolve(mode);
            return undefined;
          }
          canviaMode(MODES.escriptora);
          resolve(mode);
          return reten();
        }).catch(() => {
          /* Web Locks no disponible en este context (p. ex. un iframe aïllat). */
          if (vigent()) canviaMode(MODES.escriptora);
          resolve(mode);
        });
      });
    },

    /**
     * Escolta els avisos: { tipus: 'canvi', store, local } (local: false si
     * ve d'una altra pestanya), { tipus: 'mode', mode } i
     * { tipus: 'persistent', persistent: false }. Torna la funció per a deixar d'escoltar.
     */
    subscriu(oient) {
      if (typeof oient !== 'function') throw new TypeError('subscriu necessita una funció.');
      oients.add(oient);
      obriCanal();
      return () => { oients.delete(oient); };
    },

    /**
     * Allibera el bloqueig, deixa d'esperar el relleu i tanca el canal. Els
     * callbacks de Web Locks que encara han d'arribar ja no faran res; un
     * obtinBloqueig() posterior torna a començar.
     */
    tanca() {
      generacio += 1;
      espera?.abort();
      espera = null;
      alliberament?.();
      alliberament = null;
      try { canal?.close(); } catch { /* ja tancat */ }
      canal = null;
      oients.clear();
      mode = MODES.lliure;
    }
  };
}
