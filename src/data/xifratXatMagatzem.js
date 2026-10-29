/**
 * xifratXatMagatzem.js — on dormen les claus dels xats privats a l'aparell:
 * IndexedDB, base 'sdp_xat_claus_v1'.
 *
 * P1-12 / IDEA-19, pas 6 del disseny E2EE (_investigacio_ia_de_poble/
 * 261028_2330_p112_e2ee_claude/disseny_final_e2ee.md §8.1, amb §4.3-§4.5,
 * §5.1, §5.5 i §8.6; decisions del Mestre D-07, D-08 i D-09). Encara no el fa
 * servir ningú: no activa res.
 *
 * Patró de gestoria/cofre/magatzemCofre.js (connexió perezosa, una transacció
 * per operació que resol quan es completa, errors amb codi, mai memòria si no
 * hi ha IndexedDB), amb cinc diferències:
 *   · Només clau primària: claus fora de línia, sense keyPath, índexs ni
 *     cursors. Els registres que porten una CryptoKey trenquen les consultes
 *     per índex al WebKit (bug 177350, recon_plataformes.md §3.2): les llistes
 *     d'una persona són rangs de la clau primària, que sempre comença per la
 *     seua clauIdentitat.
 *   · Falla tancat: sense IndexedDB, IDBKeyRange, WebCrypto o CryptoKey (fora
 *     d'un context segur no n'hi ha), no es crea. Abans de la primera
 *     operació, una sonda desa una CryptoKey no extraïble, la rellig dins de la
 *     mateixa transacció (i l'esborra: no en queda res) i comprova que la
 *     rellegida desxifra el que xifra l'original. Un motor que la perd (la
 *     convertix en {}) o que no la sap clonar (DataCloneError) deixa el
 *     magatzem inservible: CLAUS_NO_DESABLES, mai una reserva en memòria. Si la
 *     sonda no troba espai, llegir encara es pot (cada clau llegida es torna a
 *     comprovar); desar claus, no. Tota CryptoKey que es desa ha de ser no
 *     extraïble (CLAU_EXTRAIBLE si no) i es rellig dins de la mateixa
 *     transacció; tota la que es llig es torna a comprovar (CLAUS_MALMESES si
 *     no és la que tocava).
 *   · clauIdentitat = [backendId, endpoint, joId], sense tenantId, dataMode ni
 *     actor (§4.3, CS-08, G-17): una persona de dos pobles té una sola
 *     identitat, i l'ambitEstable (que porta l'actor) no hi val. L'endpoint va
 *     canònic: escrit d'una altra manera, és la mateixa persona.
 *   · Una generació per persona i per pestanya (§8.6, QA-E07): van per
 *     IDBFactory (una per pestanya) i les compartixen totes les instàncies de
 *     la pestanya (StrictMode, un servei substituït). Oblidar-la (eixir de la
 *     sessió) fa fallar amb OBLIDAT tota operació de la mateixa persona
 *     demanada abans i que encara no ha tornat: res del que es demanara abans
 *     d'eixir torna a escriure ni a donar claus després.
 *   · Obrir mai es penja: blocked, o TERMINI_OBRIR_MS sense resposta, rebutja
 *     amb BLOQUEJAT. Mentre aquell open no acaba no se'n fa cap altre (el
 *     navegador el posaria a la cua darrere seu i no tornaria mai); si arriba,
 *     es queda com a connexió.
 *
 * Una fila que el motor no sap llegir torna null (WebKit, CP-17: un aparell
 * restaurat sense la clau mestra del clauer). Mai se'n desa cap de null, i null
 * no és «no n'hi ha»: CLAUS_MALMESES (MAGATZEM_MALMES si no porta claus). La
 * identitat es refà amb la frase: desaIdentitat(ci, nova, { anterior:
 * IDENTITAT_MALMESA }); la clau de repòs de la safata i les CK illegibles se
 * substituïxen en desar-ne de noves.
 *
 * Els cinc magatzems (la clau primària entre claudàtors; ci és la clauIdentitat):
 *   · identitats   [ci, 'identitat'] { usuari, kid, sigPub, dhPub, sigPriv,
 *                  dhPriv, creatMs, recuperacio?, clauLlibreta? }: les dues
 *                  privades, no extraïbles; recuperacio = { dk, iv, rk }, la RK
 *                  xifrada amb la clau local DK (D-07); clauLlibreta = K_ll
 *                  (§5.5). Comparar-i-canviar sobre el kid: mai una identitat
 *                  nova damunt de la que hi ha sense dir quina es substituïx
 *                  (QA-E06).
 *                  [ci, 'llibreta'] { comptador }: el comptador monòton de la
 *                  llibreta de seguretat (§5.5), que mai baixa.
 *   · fixacions    [ci, usuari] { usuari, kid, verificat, vistAl }: TOFU; un kid
 *                  diferent només entra comparant amb el fixat (§4.4).
 *   · filsXifrats  [ci, fil] { fil, epoca, hash }: el cap verificat de la cadena
 *                  d'èpoques, que també és la marca apegalosa del fil
 *                  (§4.5.3.8): només avança, comparant amb el cap d'abans.
 *   · safata       [ci, 'clau'] { idClau, clau } i [ci, 'missatge', id] { fil,
 *                  id, actor, creatMs, idClau, iv, ct }: els missatges que esperen que
 *                  l'altra part active el xifrat (§4.5.6, D-08), xifrats en
 *                  repòs amb una clau local no extraïble que només evita la
 *                  lectura casual, 30 dies com a molt (més d'un dia en el futur
 *                  també és caducat) i 200 per persona. Els caducats de TOTHOM
 *                  s'esborren en la primera operació de cada càrrega i amb
 *                  purgaSafata(): qui no torna no els eternitza.
 *   · clausFil     [ci, fil, epoca] { fil, epoca, clau, hashE }: la CK de cada
 *                  època, HKDF no extraïble (§4.2), lligada al hash_e.
 *
 * En eixir (D-09): oblidaEnTancar(ci, { mantenSessio }) esborra sempre la safata
 * (§4.5.6) i, sense «Mantén la sessió iniciada en este aparell», tot el que és
 * de la persona en els cinc magatzems, en UNA transacció; la llibreta ho torna
 * en restaurar. Qui decidix mantenSessio (la casella a la web, sempre a les
 * apps) és la interfície; només `true` conserva. Esborrar no passa per la
 * sonda: es pot fer encara que el motor ja no sàpia desar claus. Si no pot
 * esborrar, OBLIT_FALLIT amb la causa, mai un èxit fals: abans reintenta una
 * vegada un error del motor i, amb una base més nova (VERSIO_NOVA) o sense
 * algun magatzem, l'obri sense versió i esborra per rang en els que hi ha.
 *
 * Límits honestos (recon_plataformes.md §3.3, QA-E07): extractable:false
 * impedix que un script s'enduga una clau, no que la faça servir mentre la
 * pàgina és oberta; a Chromium i a Gecko els bytes queden en clar al disc, i
 * esborrar una fila no garantix que el navegador els borre del disc. El kid,
 * la parella de claus i les cadenes els comprova el protocol, no este fitxer.
 * Un rellotge tornat arrere mentre l'app és tancada allarga la safata: el
 * rellotge (`ara`) l'ha d'ancorar a l'hora del servidor qui el crea.
 */

export const NOM_BD_XAT = 'sdp_xat_claus_v1';
export const IDENTITATS = 'identitats';
export const FIXACIONS = 'fixacions';
export const FILS_XIFRATS = 'filsXifrats';
export const SAFATA = 'safata';
export const CLAUS_FIL = 'clausFil';
export const MAGATZEMS_XAT = Object.freeze([IDENTITATS, FIXACIONS, FILS_XIFRATS, SAFATA, CLAUS_FIL]);
/* Les migracions de l'esquema: la n porta de la versió n a la n + 1. Cap índex (WebKit 177350). Només
   s'hi afigen magatzems i mai canvia la clau primària dels cinc: un codi més vell que ix de la sessió
   encara ha d'esborrar per rang en una base més nova (esborraSenseVersio). */
const MIGRACIONS = Object.freeze([
  (bd) => {
    for (const nom of MAGATZEMS_XAT) if (!bd.objectStoreNames.contains(nom)) bd.createObjectStore(nom);
  }
]);
export const VERSIO_BD_XAT = MIGRACIONS.length;
/* D-08: un missatge en espera viu 30 dies a l'aparell. */
export const CADUCITAT_SAFATA_MS = 30 * 24 * 60 * 60 * 1000;
/* Un missatge que diu venir de més d'un dia en el futur és d'un rellotge tocat: caducat. */
export const MARGE_FUTUR_SAFATA_MS = 24 * 60 * 60 * 1000;
export const MAX_MISSATGES_SAFATA = 200;
export const MAX_BYTES_SAFATA = 64 * 1024;
/* Quant pot tardar a obrir-se la base abans de dir BLOQUEJAT (una pestanya vella que no la deixa, un motor encallat). */
export const TERMINI_OBRIR_MS = 10 * 1000;
/* L'`anterior` de desaIdentitat per a substituir una identitat desada que ja no es pot llegir (CLAUS_MALMESES). */
export const IDENTITAT_MALMESA = 'malmesa';
/* El sostre de l'època és el del format (xifratXatFormats.MAX_EPOCA: u32be d'1 a 2³¹ − 1, perquè la columna
   del servidor és `integer`): cap CK ni cap cap d'un fil per damunt del que una declaració SDPE pot portar. */
const MAX_EPOCA = 2147483647;
const BYTES_IV = 12;
const BYTES_ETIQUETA = 16;
/* La fila de la sonda: cap clauIdentitat (un text JSON que comença per «[») no hi pot coincidir. */
const CLAU_SONDA = Object.freeze(['sonda']);
/* Les generacions de cada persona, per IDBFactory: una per pestanya al navegador, la mateixa per a totes les instàncies. */
const GENERACIONS = new WeakMap();

/* ── Errors amb codi estable, perquè la pantalla decidisca què diu ──────── */

function errorAmbCodi(codi, missatge, causa) {
  const error = new Error(missatge, causa ? { cause: causa } : undefined);
  error.codi = codi;
  return error;
}

const senseIndexedDb = (causa) => errorAmbCodi('SENSE_INDEXEDDB', 'Este navegador no deixa guardar les claus dels xats privats (IndexedDB): ací no es poden obrir.', causa);
const senseCripto = () => errorAmbCodi('SENSE_CRIPTO', 'Este navegador no té el xifratge que fa falta (WebCrypto en una connexió segura): els xats privats no es poden obrir ací.');
const noDesables = (causa) => errorAmbCodi('CLAUS_NO_DESABLES', 'Este navegador no sap guardar les claus dels xats privats sense perdre-les: ací no es poden obrir.', causa);
const malmeses = () => errorAmbCodi('CLAUS_MALMESES', 'Les claus desades en este aparell no són les que tocaven: cal recuperar-les amb la frase.');
const malmes = (causa) => errorAmbCodi('MAGATZEM_MALMES', 'La base de les claus dels xats d’este navegador no té la forma que toca.', causa);
const oblidat = () => errorAmbCodi('OBLIDAT', 'La sessió ha canviat: esta operació ja no és de ningú.');
const invalides = (detall) => errorAmbCodi('DADES_INVALIDES', `Dades no vàlides per al magatzem del xat: ${detall}.`);
const bloquejat = () => errorAmbCodi('BLOQUEJAT', 'Una altra pestanya té oberta una versió anterior de Sóc de Poble, o la base no respon: tanca les altres pestanyes i torna-ho a provar.');
const oblitFallit = (causa) => errorAmbCodi('OBLIT_FALLIT', 'Les claus dels xats d’este aparell no s’han pogut esborrar: torna-ho a provar.', causa);

function normalitza(error) {
  if (error?.codi) return error;
  switch (error?.name) {
    case 'QuotaExceededError':
      return errorAmbCodi('SENSE_ESPAI', 'L’aparell no té prou espai per a guardar les claus dels xats.', error);
    case 'DataCloneError':
      return noDesables(error);
    case 'VersionError':
      return errorAmbCodi('VERSIO_NOVA', 'Una altra pestanya té una versió més nova de Sóc de Poble: recarrega esta.', error);
    case 'NotFoundError':
      return malmes(error);
    case 'InvalidStateError':
      return errorAmbCodi('MAGATZEM_TANCAT', 'El navegador ha tancat la base de les claus: torna-ho a provar.', error);
    default:
      return errorAmbCodi('MAGATZEM_ERROR', 'La base de les claus dels xats no ha respost.', error ?? undefined);
  }
}

/* ── Formes ─────────────────────────────────────────────────────────────── */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ID_CLAU = /^[0-9a-f]{32}$/;
/* actorKey arriba del context: opac, sense normalitzar ni posar-lo a clauIdentitat.
   El separador nul i els substituts UTF-16 aïllats no hi valen: l'AAD ha de conservar el valor exacte. */
const esActor = (actor) => typeof actor === 'string' && actor.length > 0 && actor === actor.trim() && !actor.includes('\u0000') && !/\p{Surrogate}/u.test(actor);
const esUuid = (valor) => typeof valor === 'string' && UUID.test(valor);
const esBytes = (valor, n) => valor instanceof Uint8Array && valor.length === n;
const esPublica = (valor) => esBytes(valor, 65) && valor[0] === 0x04;
const esMs = (valor) => Number.isSafeInteger(valor) && valor >= 0;
const esEpoca = (valor) => Number.isSafeInteger(valor) && valor >= 1 && valor <= MAX_EPOCA;
const esObjectePla = (valor) => valor !== null && typeof valor === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(valor));
const iguals = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const exigix = (condicio, detall) => {
  if (!condicio) throw invalides(detall);
};

/* L'endpoint com el backendScope (src/config/backendConfig.js): https (http només a localhost), sense credencials,
   consulta ni fragment; l'amfitrió en minúscules, sense el port per defecte ni barres finals. Null si no en val cap. */
function endpointCanonic(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  if (url.username || url.password || url.search || url.hash) return null;
  if (!(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) return null;
  return url.origin + url.pathname.replace(/\/+$/, '');
}

/** La clau sota la qual dorm tot el d'una persona: [backendId, endpoint canònic, joId], en text. */
export function clauIdentitat({ backendId, endpoint, joId } = {}) {
  exigix(typeof backendId === 'string' && backendId.length > 0 && backendId.length <= 200, 'backendId');
  const canonic = typeof endpoint === 'string' && endpoint.length <= 2048 ? endpointCanonic(endpoint) : null;
  exigix(canonic !== null, 'endpoint (https, o http a localhost; sense credencials, consulta ni fragment)');
  exigix(esUuid(joId), 'joId (uuid canònic en minúscules)');
  return JSON.stringify([backendId, canonic, joId]);
}

/* Una clauIdentitat feta per clauIdentitat(), i cap altra (ni l'ambitEstable, ni el backendScope). */
function llegixCi(ci) {
  let parts = null;
  try {
    parts = typeof ci === 'string' ? JSON.parse(ci) : null;
  } catch {
    parts = null;
  }
  exigix(Array.isArray(parts) && parts.length === 3, 'clauIdentitat');
  exigix(clauIdentitat({ backendId: parts[0], endpoint: parts[1], joId: parts[2] }) === ci, 'clauIdentitat (no canònica)');
  return parts[2];
}

/* Què ha de ser cada CryptoKey que es desa: tipus, algorisme i usos permesos (cap altre, almenys un). */
const PERFILS = Object.freeze({
  firma: Object.freeze({ tipus: 'private', nom: 'ECDSA', corba: 'P-256', usos: Object.freeze(['sign']) }),
  recepcio: Object.freeze({ tipus: 'private', nom: 'ECDH', corba: 'P-256', usos: Object.freeze(['deriveBits', 'deriveKey']) }),
  local: Object.freeze({ tipus: 'secret', nom: 'AES-GCM', longitud: 256, usos: Object.freeze(['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']) }),
  epoca: Object.freeze({ tipus: 'secret', nom: 'HKDF', usos: Object.freeze(['deriveBits', 'deriveKey']) })
});

/* ── Connexió, sonda i transaccions ─────────────────────────────────────── */

/**
 * @param {object} opcions
 * @param {IDBFactory} [opcions.idb] per defecte globalThis.indexedDB
 * @param {typeof IDBKeyRange} [opcions.rangs] per defecte globalThis.IDBKeyRange
 * @param {Crypto} opcions.cripto el WebCrypto (subtle i getRandomValues), sempre injectat
 * @param {Function} [opcions.ClasseClau] per defecte globalThis.CryptoKey
 * @param {() => number} [opcions.ara] el rellotge, en mil·lisegons
 * @param {number} [opcions.terminiMs] quant pot tardar a obrir-se la base (TERMINI_OBRIR_MS)
 */
export function creaMagatzemXat({
  idb = globalThis.indexedDB, rangs = globalThis.IDBKeyRange, cripto, ClasseClau = globalThis.CryptoKey, ara = () => Date.now(),
  terminiMs = TERMINI_OBRIR_MS
} = {}) {
  if (!idb || typeof idb.open !== 'function' || typeof rangs?.bound !== 'function') throw senseIndexedDb();
  if (typeof cripto?.subtle?.encrypt !== 'function' || typeof cripto.getRandomValues !== 'function' || typeof ClasseClau !== 'function') {
    throw senseCripto();
  }
  exigix(Number.isFinite(terminiMs) && terminiMs > 0, 'terminiMs');
  const aleatori = (n) => cripto.getRandomValues(new Uint8Array(n));
  const araMs = () => {
    const ms = Math.floor(ara());
    if (!esMs(ms)) throw invalides('rellotge');
    return ms;
  };

  const esClau = (clau, perfil) => {
    if (!(clau instanceof ClasseClau) || clau.extractable !== false || clau.type !== perfil.tipus) return false;
    const algorisme = clau.algorithm ?? {};
    if (algorisme.name !== perfil.nom) return false;
    if (perfil.corba && algorisme.namedCurve !== perfil.corba) return false;
    if (perfil.longitud && algorisme.length !== perfil.longitud) return false;
    return Array.isArray(clau.usages) && clau.usages.length > 0 && clau.usages.every((us) => perfil.usos.includes(us));
  };
  const exigixClau = (clau, perfil, detall) => {
    if (clau instanceof ClasseClau && clau.extractable !== false) {
      throw errorAmbCodi('CLAU_EXTRAIBLE', `Una clau extraïble no es desa mai en este aparell (${detall}).`);
    }
    exigix(esClau(clau, perfil), `${detall} (CryptoKey ${perfil.nom} no extraïble)`);
  };

  let connexio = null;
  /* Un open que ja ha rebutjat (blocked o termini) però que encara pot arribar: { error, tancada }. */
  let enEspera = null;
  const oblidaConnexio = (promesa) => {
    if (connexio === promesa) connexio = null;
  };
  const vigila = (bd, promesa) => {
    bd.onversionchange = () => {
      bd.close();
      oblidaConnexio(promesa);
    };
    bd.onclose = () => oblidaConnexio(promesa);
  };
  const obri = () => {
    if (connexio) return connexio;
    if (enEspera) return Promise.reject(enEspera.error);
    let peticio;
    try {
      peticio = idb.open(NOM_BD_XAT, VERSIO_BD_XAT);
    } catch (error) {
      return Promise.reject(senseIndexedDb(error));
    }
    const promesa = new Promise((resol, rebutja) => {
      let espera = null;
      let temporitzador = null;
      const deixaEnEspera = () => {
        clearTimeout(temporitzador);
        if (espera) return;
        espera = { error: bloquejat(), tancada: false };
        enEspera = espera;
        rebutja(espera.error);
      };
      const acabaEspera = () => {
        if (enEspera === espera) enEspera = null;
      };
      temporitzador = setTimeout(deixaEnEspera, terminiMs);
      peticio.onupgradeneeded = (event) => {
        const des = Number.isInteger(event?.oldVersion) ? event.oldVersion : 0;
        /* Si una migració llança, el navegador avorta l'actualització i open falla. */
        for (let v = des; v < VERSIO_BD_XAT; v += 1) MIGRACIONS[v](peticio.result);
      };
      peticio.onsuccess = () => {
        clearTimeout(temporitzador);
        const bd = peticio.result;
        const sencera = MAGATZEMS_XAT.every((nom) => bd.objectStoreNames.contains(nom));
        if (espera) {
          /* Arriba tard: es queda com a connexió (ja no bloqueja ningú: vigila tanca en versionchange). */
          acabaEspera();
          if (espera.tancada || !sencera || connexio) {
            bd.close();
            return;
          }
          const adoptada = Promise.resolve(bd);
          vigila(bd, adoptada);
          connexio = adoptada;
          return;
        }
        if (!sencera) {
          bd.close();
          rebutja(malmes());
          return;
        }
        vigila(bd, promesa);
        resol(bd);
      };
      peticio.onerror = () => {
        clearTimeout(temporitzador);
        if (espera) {
          acabaEspera();
          return;
        }
        const error = peticio.error;
        rebutja(['VersionError', 'QuotaExceededError'].includes(error?.name) ? normalitza(error) : senseIndexedDb(error));
      };
      peticio.onblocked = deixaEnEspera;
    });
    connexio = promesa;
    promesa.catch(() => oblidaConnexio(promesa));
    return promesa;
  };

  /* Una transacció; resol quan es completa, no quan acaba una petició. Mai s'espera res de fora dins d'ella. */
  const acompanya = (tx, accio) => new Promise((resol, rebutja) => {
    let resultat;
    let errorPropi = null;
    let acabada = false;
    const torna = (valor) => {
      resultat = valor;
    };
    const avorta = (error) => {
      errorPropi ??= error;
      try { tx.abort(); } catch { /* ja acabada */ }
    };
    /* El gestor d'una petició: si llança (un DataCloneError en un put, el rellotge), s'avorta amb eixe error, no amb AbortError. */
    const quan = (peticio, gestor) => {
      peticio.onsuccess = () => {
        try {
          gestor();
        } catch (error) {
          avorta(error);
        }
      };
    };
    const falla = (event) => {
      if (acabada) return;
      acabada = true;
      rebutja(normalitza(errorPropi ?? tx.error ?? event?.target?.error ?? null));
    };
    tx.oncomplete = () => {
      if (acabada) return;
      acabada = true;
      resol(resultat);
    };
    tx.onerror = falla;
    tx.onabort = falla;
    try {
      accio((nom) => tx.objectStore(nom), torna, avorta, quan);
    } catch (error) {
      avorta(error);
    }
  });

  /* Si el navegador ha tancat la connexió sense avisar, se n'obri una altra una sola vegada. */
  const transaccio = async (stores, mode, accio) => {
    let promesa = obri();
    let bd = await promesa;
    let tx;
    try {
      tx = bd.transaction(stores, mode);
    } catch (error) {
      if (error?.name !== 'InvalidStateError') throw normalitza(error);
      oblidaConnexio(promesa);
      promesa = obri();
      bd = await promesa;
      try {
        tx = bd.transaction(stores, mode);
      } catch (segon) {
        throw normalitza(segon);
      }
    }
    return acompanya(tx, accio);
  };

  const provaLesClaus = async () => {
    let clau;
    try {
      clau = await cripto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    } catch (error) {
      throw noDesables(error);
    }
    const llegida = await transaccio([CLAUS_FIL], 'readwrite', (s, torna, avorta, quan) => {
      const store = s(CLAUS_FIL);
      store.put({ clau }, CLAU_SONDA);
      const peticio = store.get(CLAU_SONDA);
      quan(peticio, () => {
        torna(peticio.result?.clau);
        store.delete(CLAU_SONDA);
      });
    });
    if (!esClau(llegida, PERFILS.local)) throw noDesables();
    const iv = aleatori(BYTES_IV);
    const prova = aleatori(16);
    let tornada;
    try {
      const xifrat = await cripto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, clau, prova);
      tornada = new Uint8Array(await cripto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, llegida, xifrat));
    } catch (error) {
      throw noDesables(error);
    }
    if (!iguals(tornada, prova)) throw noDesables();
  };

  /* ── Safata: caducitat (la de tothom, per clau primària) ──────────────── */

  const filaSafataSencera = (fila) => esObjectePla(fila) && esActor(fila.actor) && esUuid(fila.fil) && esUuid(fila.id) && esMs(fila.creatMs)
    && typeof fila.idClau === 'string' && ID_CLAU.test(fila.idClau) && esBytes(fila.iv, BYTES_IV)
    && fila.ct instanceof Uint8Array && fila.ct.length >= BYTES_ETIQUETA && fila.ct.length <= MAX_BYTES_SAFATA + BYTES_ETIQUETA;
  /* Caducada als 30 dies; també si el rellotge diu que ve de més d'un dia en el futur (un rellotge tocat no l'eternitza). */
  const caducada = (creatMs, ms) => ms - creatMs >= CADUCITAT_SAFATA_MS || creatMs - ms > MARGE_FUTUR_SAFATA_MS;
  const deLaPersona = (...prefix) => rangs.bound(prefix, [...prefix, []]);
  /* Dins d'una transacció: les files de missatge de la persona, les caducades i les trencades ja esborrades. */
  const vivesDeLaSafata = (store, ci, quan, seguix) => {
    const rang = deLaPersona(ci, 'missatge');
    const claus = store.getAllKeys(rang);
    const valors = store.getAll(rang);
    quan(valors, () => {
      const ms = araMs();
      const vives = [];
      let esborrades = 0;
      (valors.result ?? []).forEach((fila, i) => {
        if (filaSafataSencera(fila) && !caducada(fila.creatMs, ms)) {
          vives.push(fila);
          return;
        }
        store.delete(claus.result[i]);
        esborrades += 1;
      });
      seguix(vives, esborrades);
    });
  };
  /* Els missatges caducats i trencats de totes les persones, en UNA transacció: primer les claus, després els missatges
     de cada persona (mai les files de la clau de repòs). Torna quants. */
  const purgaCaducades = () => transaccio([SAFATA], 'readwrite', (s, torna, avorta, quan) => {
    const store = s(SAFATA);
    const claus = store.getAllKeys();
    quan(claus, () => {
      const persones = [...new Set((claus.result ?? [])
        .filter((clau) => Array.isArray(clau) && typeof clau[0] === 'string' && clau[1] === 'missatge')
        .map((clau) => clau[0]))];
      let total = 0;
      let queden = persones.length;
      if (queden === 0) torna(0);
      for (const ci of persones) {
        vivesDeLaSafata(store, ci, quan, (vives, esborrades) => {
          total += esborrades;
          queden -= 1;
          if (queden === 0) torna(total);
        });
      }
    });
  });

  let sonda = null;
  /*
   * La sonda es fa una vegada i, si passa, purga la safata de tothom; si falla per una altra cosa (espai, pestanya),
   * es repetix la pròxima vegada. Sense espai (SENSE_ESPAI), una operació que no desa claus continua.
   */
  const prepara = async (desaClaus) => {
    if (!sonda) {
      const aquesta = provaLesClaus().then(() => purgaCaducades().then(() => undefined, () => undefined));
      sonda = aquesta;
      aquesta.catch((error) => {
        if (sonda === aquesta && error?.codi !== 'CLAUS_NO_DESABLES') sonda = null;
      });
    }
    try {
      await sonda;
    } catch (error) {
      if (desaClaus || error?.codi !== 'SENSE_ESPAI') throw error;
    }
  };

  if (!GENERACIONS.has(idb)) GENERACIONS.set(idb, new Map());
  const generacions = GENERACIONS.get(idb);
  const generacio = (ci) => generacions.get(ci) ?? 0;
  const oblidaGeneracio = (ci) => generacions.set(ci, generacio(ci) + 1);
  /* Una operació de la persona `ci` en la generació `gen`: si s'ha oblidat entremig, ni escriu ni torna res. */
  const ambLaPersona = async (ci, gen, stores, mode, accio, desaClaus = false) => {
    await prepara(desaClaus);
    if (generacio(ci) !== gen) throw oblidat();
    const resultat = await transaccio(stores, mode, (s, torna, avorta, quan) => {
      if (generacio(ci) !== gen) {
        avorta(oblidat());
        return;
      }
      accio(s, torna, avorta, quan);
    });
    if (generacio(ci) !== gen) throw oblidat();
    return resultat;
  };
  const operacio = (ci, stores, mode, accio, desaClaus) => ambLaPersona(ci, generacio(ci), stores, mode, accio, desaClaus);
  /* La fila tal com torna: undefined si no n'hi ha; null si n'hi ha però el motor no la sap llegir. */
  const llegixUna = (ci, store, clau) => operacio(ci, [store], 'readonly', (s, torna, avorta, quan) => {
    const peticio = s(store).get(clau);
    quan(peticio, () => torna(peticio.result));
  });
  const llegixTotes = (ci, store, ...prefix) => operacio(ci, [store], 'readonly', (s, torna, avorta, quan) => {
    const peticio = s(store).getAll(deLaPersona(ci, ...prefix));
    quan(peticio, () => torna(peticio.result ?? []));
  });
  const hiEs = (fila) => fila !== undefined && fila !== null;

  /* ── Identitat ────────────────────────────────────────────────────────── */

  /* Només els camps coneguts: res més ix cap al disc (ni un JWK amb «d» que algú hi deixara). */
  const filaIdentitat = (identitat, joId) => {
    exigix(esObjectePla(identitat), 'identitat');
    const { usuari, kid, sigPub, dhPub, sigPriv, dhPriv, creatMs, recuperacio, clauLlibreta } = identitat;
    exigix(usuari === joId, 'identitat.usuari (ha de ser la persona de la clauIdentitat)');
    exigix(esBytes(kid, 16), 'identitat.kid (16 bytes)');
    exigix(esPublica(sigPub) && esPublica(dhPub), 'identitat.sigPub i dhPub (65 bytes sense comprimir)');
    exigix(esMs(creatMs), 'identitat.creatMs');
    exigixClau(sigPriv, PERFILS.firma, 'identitat.sigPriv');
    exigixClau(dhPriv, PERFILS.recepcio, 'identitat.dhPriv');
    const fila = { v: 1, usuari, kid: new Uint8Array(kid), sigPub: new Uint8Array(sigPub), dhPub: new Uint8Array(dhPub), sigPriv, dhPriv, creatMs };
    if (recuperacio !== undefined) {
      exigix(esObjectePla(recuperacio), 'identitat.recuperacio');
      exigixClau(recuperacio.dk, PERFILS.local, 'identitat.recuperacio.dk');
      exigix(esBytes(recuperacio.iv, BYTES_IV), 'identitat.recuperacio.iv (12 bytes)');
      exigix(esBytes(recuperacio.rk, 32 + BYTES_ETIQUETA), 'identitat.recuperacio.rk (la RK xifrada: 48 bytes)');
      fila.recuperacio = { dk: recuperacio.dk, iv: new Uint8Array(recuperacio.iv), rk: new Uint8Array(recuperacio.rk) };
    }
    if (clauLlibreta !== undefined) {
      exigixClau(clauLlibreta, PERFILS.local, 'identitat.clauLlibreta');
      fila.clauLlibreta = clauLlibreta;
    }
    return fila;
  };
  const identitatSencera = (fila, joId) => {
    try {
      return fila?.v === 1 && Boolean(filaIdentitat(fila, joId));
    } catch {
      return false;
    }
  };
  const senseVersio = (fila) => {
    const resta = { ...fila };
    delete resta.v;
    return resta;
  };
  const identitatDiferent = (anterior) => (anterior
    ? errorAmbCodi('IDENTITAT_CANVIADA', 'La clau d’identitat d’este aparell ha canviat en una altra pestanya.')
    : errorAmbCodi('IDENTITAT_EXISTENT', 'Ja hi ha una clau d’identitat en este aparell: no se’n desa cap altra al damunt.'));

  /* ── Fixacions, caps i llibreta ───────────────────────────────────────── */

  const filaFixacio = ({ usuari, kid, verificat, vistAl }) => ({ usuari, kid: new Uint8Array(kid), verificat, vistAl });
  const fixacioSencera = (fila) => esObjectePla(fila) && esUuid(fila.usuari) && esBytes(fila.kid, 16)
    && typeof fila.verificat === 'boolean' && esMs(fila.vistAl);
  const capSencer = (fila) => esObjectePla(fila) && esEpoca(fila.epoca) && esBytes(fila.hash, 32);
  const filSencer = (fila) => capSencer(fila) && esUuid(fila.fil);
  const mateixCap = (a, b) => (a === null || b === null ? a === b : a.epoca === b.epoca && iguals(a.hash, b.hash));
  const exigixCap = (cap, detall) => exigix(capSencer(cap), `${detall} ({ epoca, hash de 32 bytes })`);
  const comptadorDe = (fila) => {
    if (fila === undefined) return 0;
    if (!esObjectePla(fila) || !esMs(fila.comptador)) throw malmes();
    return fila.comptador;
  };
  const llibretaAntiga = () => errorAmbCodi('LLIBRETA_ANTIGA', 'Esta llibreta de seguretat és més antiga que la que ja coneix este aparell.');

  /* ── Claus de fil i safata ────────────────────────────────────────────── */

  const clauFilSencera = (fila) => filSencer({ fil: fila?.fil, epoca: fila?.epoca, hash: fila?.hashE }) && esClau(fila.clau, PERFILS.epoca);
  const clauSafataSencera = (fila) => esObjectePla(fila) && typeof fila.idClau === 'string' && ID_CLAU.test(fila.idClau)
    && esClau(fila.clau, PERFILS.local) && fila.clau.usages.includes('encrypt') && fila.clau.usages.includes('decrypt');
  const aadSafata = (ci, fila) => new TextEncoder().encode(
    `sdp-xat-v1/safata\u0000${ci}\u0000${fila.actor}\u0000${fila.fil}\u0000${fila.id}\u0000${fila.idClau}\u0000${fila.creatMs}`
  );
  const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  const resumSafata = (fila) => ({ fil: fila.fil, id: fila.id, actor: fila.actor, creatMs: fila.creatMs, caducaMs: fila.creatMs + CADUCITAT_SAFATA_MS });
  const safataOblidada = () => errorAmbCodi('SAFATA_OBLIDADA', 'La safata d’esta sessió s’ha buidat mentre es desava el missatge.');
  const obriEntrada = async (ci, clauFila, fila) => {
    const resum = resumSafata(fila);
    if (!clauFila || fila.idClau !== clauFila.idClau) return { ...resum, contingut: null, malmes: true };
    let bytes = null;
    try {
      bytes = new Uint8Array(await cripto.subtle.decrypt(
        { name: 'AES-GCM', iv: fila.iv, additionalData: aadSafata(ci, fila), tagLength: 128 }, clauFila.clau, fila.ct
      ));
      const contingut = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (!esObjectePla(contingut)) throw new TypeError('No és un objecte.');
      return { ...resum, contingut, malmes: false };
    } catch {
      return { ...resum, contingut: null, malmes: true };
    } finally {
      bytes?.fill(0);
    }
  };
  /*
   * La clau de repòs de la safata: la que hi ha o una de nova (si dues pestanyes la fan alhora, guanya la primera).
   * Una fila illegible (null) se substituïx: els missatges vells tornen malmesos; una clau que es llig però no és la
   * que toca, CLAUS_MALMESES.
   */
  const clauDeLaSafata = async (ci, gen) => {
    const desada = await ambLaPersona(ci, gen, [SAFATA], 'readonly', (s, torna, avorta, quan) => {
      const peticio = s(SAFATA).get([ci, 'clau']);
      quan(peticio, () => torna(peticio.result ?? null));
    }, true);
    if (desada !== null) {
      if (!clauSafataSencera(desada)) throw malmeses();
      return desada;
    }
    const nova = { idClau: hex(aleatori(16)), clau: await cripto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']) };
    const guanyadora = await ambLaPersona(ci, gen, [SAFATA], 'readwrite', (s, torna, avorta, quan) => {
      const store = s(SAFATA);
      const peticio = store.get([ci, 'clau']);
      quan(peticio, () => {
        if (hiEs(peticio.result)) {
          torna(peticio.result);
          return;
        }
        store.put(nova, [ci, 'clau']);
        const rellegida = store.get([ci, 'clau']);
        quan(rellegida, () => {
          if (!clauSafataSencera(rellegida.result)) {
            avorta(noDesables());
            return;
          }
          torna(rellegida.result);
        });
      });
    }, true);
    if (!clauSafataSencera(guanyadora)) throw malmeses();
    return guanyadora;
  };

  /* ── Oblit ────────────────────────────────────────────────────────────── */

  /* Compta i esborra les files de la persona en els magatzems `noms`, en UNA transacció. */
  const esborraEn = (ci, noms) => (s, torna, avorta, quan) => {
    const rang = deLaPersona(ci);
    let total = 0;
    let queden = noms.length;
    for (const nom of noms) {
      const store = s(nom);
      const compte = store.count(rang);
      quan(compte, () => {
        total += compte.result;
        store.delete(rang);
        queden -= 1;
        if (queden === 0) torna(total);
      });
    }
  };
  /* Una base més nova o sense algun magatzem: s'obri sense versió i s'esborra per rang en els que hi ha. Si no existia,
     no hi ha res a esborrar, i no se'n crea cap de buida (l'actualització s'avorta). */
  const esborraSenseVersio = (ci, noms) => new Promise((resol, rebutja) => {
    let peticio;
    try {
      peticio = idb.open(NOM_BD_XAT);
    } catch (error) {
      rebutja(senseIndexedDb(error));
      return;
    }
    let noExistia = false;
    let vencut = false;
    const temporitzador = setTimeout(() => {
      vencut = true;
      rebutja(bloquejat());
    }, terminiMs);
    peticio.onupgradeneeded = () => {
      noExistia = true;
      peticio.transaction?.abort();
    };
    peticio.onerror = () => {
      clearTimeout(temporitzador);
      if (noExistia) resol(0);
      else rebutja(normalitza(peticio.error));
    };
    peticio.onsuccess = () => {
      clearTimeout(temporitzador);
      const bd = peticio.result;
      bd.onversionchange = () => bd.close();
      const presents = noms.filter((nom) => bd.objectStoreNames.contains(nom));
      if (vencut || presents.length === 0) {
        bd.close();
        resol(0);
        return;
      }
      let tx;
      try {
        tx = bd.transaction(presents, 'readwrite');
      } catch (error) {
        bd.close();
        rebutja(normalitza(error));
        return;
      }
      acompanya(tx, esborraEn(ci, presents)).finally(() => bd.close()).then(resol, rebutja);
    };
  });
  /* Esborrar en eixir: un error del motor es reintenta una vegada; si no es pot, OBLIT_FALLIT (mai un èxit fals). */
  const esborra = async (ci, noms) => {
    const accio = esborraEn(ci, noms);
    try {
      return await transaccio(noms, 'readwrite', accio);
    } catch (primer) {
      let causa = primer;
      try {
        if (['MAGATZEM_ERROR', 'MAGATZEM_TANCAT'].includes(primer?.codi)) return await transaccio(noms, 'readwrite', accio);
        if (['VERSIO_NOVA', 'MAGATZEM_MALMES'].includes(primer?.codi)) return await esborraSenseVersio(ci, noms);
      } catch (segon) {
        causa = segon;
      }
      throw oblitFallit(causa);
    }
  };
  /* Tot el de la persona, en els cinc magatzems i en UNA transacció. No passa per la sonda: esborrar sempre es pot. */
  const oblida = async (ci) => {
    llegixCi(ci);
    oblidaGeneracio(ci);
    return esborra(ci, [...MAGATZEMS_XAT]);
  };

  return Object.freeze({
    tipus: 'indexeddb',

    /** Resol si este navegador pot desar claus dels xats (obri la base i passa la sonda); si no, rebutja amb el codi. */
    async comprova() {
      await prepara(true);
      return true;
    },

    /* ── Identitat (§4.3, D-07) ── */

    /** La identitat d'este aparell ({ usuari, kid, sigPub, dhPub, sigPriv, dhPriv, creatMs, recuperacio?, clauLlibreta? }), o null. */
    async identitat(ci) {
      const joId = llegixCi(ci);
      const fila = await llegixUna(ci, IDENTITATS, [ci, 'identitat']);
      if (fila === undefined) return null;
      if (!identitatSencera(fila, joId)) throw malmeses();
      return senseVersio(fila);
    },

    /**
     * Desa la identitat. `anterior` és el kid que se substituïx (null: no n'hi
     * ha d'haver cap; IDENTITAT_MALMESA: la desada no es pot llegir). Si la
     * vigent no és eixa, IDENTITAT_EXISTENT o IDENTITAT_CANVIADA i res escrit:
     * mai una regeneració per damunt. Si la vigent és illegible i no es diu,
     * CLAUS_MALMESES.
     */
    async desaIdentitat(ci, identitat, { anterior = null } = {}) {
      const joId = llegixCi(ci);
      const fila = filaIdentitat(identitat, joId);
      exigix(anterior === null || anterior === IDENTITAT_MALMESA || esBytes(anterior, 16), 'anterior (kid de 16 bytes, null o IDENTITAT_MALMESA)');
      return operacio(ci, [IDENTITATS], 'readwrite', (s, torna, avorta, quan) => {
        const store = s(IDENTITATS);
        const clau = [ci, 'identitat'];
        const peticio = store.get(clau);
        quan(peticio, () => {
          const actual = peticio.result;
          const sencera = actual !== undefined && identitatSencera(actual, joId);
          let esLaDesperada;
          if (actual === undefined) esLaDesperada = anterior === null;
          else if (anterior === IDENTITAT_MALMESA) esLaDesperada = !sencera;
          else esLaDesperada = anterior !== null && esBytes(actual?.kid, 16) && iguals(actual.kid, anterior);
          if (!esLaDesperada) {
            avorta(actual !== undefined && !sencera && anterior !== IDENTITAT_MALMESA ? malmeses() : identitatDiferent(anterior));
            return;
          }
          store.put(fila, clau);
          const rellegida = store.get(clau);
          quan(rellegida, () => {
            if (!identitatSencera(rellegida.result, joId)) {
              avorta(noDesables());
              return;
            }
            torna(true);
          });
        });
      }, true);
    },

    /* ── Fixacions (§4.4) ── */

    /** La fixació d'un contacte ({ usuari, kid, verificat, vistAl }), o null. */
    async fixacio(ci, usuari) {
      llegixCi(ci);
      exigix(esUuid(usuari), 'usuari');
      const fila = await llegixUna(ci, FIXACIONS, [ci, usuari]);
      if (fila === undefined) return null;
      if (!fixacioSencera(fila)) throw malmes();
      return fila;
    },

    /** Totes les fixacions de la persona, en l'ordre de l'usuari. */
    async fixacions(ci) {
      llegixCi(ci);
      const files = await llegixTotes(ci, FIXACIONS);
      if (!files.every(fixacioSencera)) throw malmes();
      return files;
    },

    /**
     * Fixa (TOFU) o actualitza la clau d'un contacte. Amb el mateix kid,
     * actualitza verificat (si es dona) i vistAl (mai enrere). Un kid diferent
     * només entra si `anterior` és el fixat: FIXACIO_DIFERENT si no se'n diu
     * cap, FIXACIO_CANVIADA si se'n diu un altre. El protocol decidix abans si
     * el canvi és suau, fort acceptat o verificat de nou.
     */
    async fixa(ci, { usuari, kid, verificat, vistAl } = {}, { anterior = null } = {}) {
      llegixCi(ci);
      exigix(esUuid(usuari), 'usuari');
      exigix(esBytes(kid, 16), 'kid (16 bytes)');
      exigix(verificat === undefined || typeof verificat === 'boolean', 'verificat');
      exigix(vistAl === undefined || esMs(vistAl), 'vistAl');
      exigix(anterior === null || esBytes(anterior, 16), 'anterior (kid de 16 bytes o null)');
      const vist = vistAl ?? araMs();
      return operacio(ci, [FIXACIONS], 'readwrite', (s, torna, avorta, quan) => {
        const store = s(FIXACIONS);
        const peticio = store.get([ci, usuari]);
        quan(peticio, () => {
          const actual = peticio.result;
          let fila;
          if (actual === undefined) {
            if (anterior !== null) {
              avorta(errorAmbCodi('FIXACIO_CANVIADA', 'La clau fixada d’este contacte ha canviat en una altra pestanya.'));
              return;
            }
            fila = filaFixacio({ usuari, kid, verificat: verificat === true, vistAl: vist });
          } else if (!fixacioSencera(actual)) {
            avorta(malmes());
            return;
          } else if (iguals(actual.kid, kid)) {
            fila = filaFixacio({ usuari, kid, verificat: verificat ?? actual.verificat, vistAl: Math.max(actual.vistAl, vist) });
          } else if (anterior !== null && iguals(actual.kid, anterior)) {
            fila = filaFixacio({ usuari, kid, verificat: verificat === true, vistAl: vist });
          } else {
            avorta(anterior === null
              ? errorAmbCodi('FIXACIO_DIFERENT', 'Este contacte té fixada una altra clau.')
              : errorAmbCodi('FIXACIO_CANVIADA', 'La clau fixada d’este contacte ha canviat en una altra pestanya.'));
            return;
          }
          store.put(fila, [ci, usuari]);
          torna(fila);
        });
      });
    },

    /* ── Fils xifrats: el cap verificat i la marca apegalosa (§4.5.3) ── */

    /** El cap verificat d'un fil ({ fil, epoca, hash }), o null si este aparell no l'ha vist mai xifrat. */
    async filXifrat(ci, fil) {
      llegixCi(ci);
      exigix(esUuid(fil), 'fil');
      const fila = await llegixUna(ci, FILS_XIFRATS, [ci, fil]);
      if (fila === undefined) return null;
      if (!filSencer(fila)) throw malmes();
      return fila;
    },

    /** Tots els fils xifrats de la persona. */
    async filsXifrats(ci) {
      llegixCi(ci);
      const files = await llegixTotes(ci, FILS_XIFRATS);
      if (!files.every(filSencer)) throw malmes();
      return files;
    },

    /**
     * Avança el cap d'un fil, comparant-i-canviant: només si el desat és encara
     * `anterior` (null: cap), i mai enrere (CAP_RETROCEDIX). Cert si ha avançat,
     * fals si ja hi era (un reintent). Si una altra pestanya l'ha mogut,
     * CAP_CANVIAT: el protocol rellig i torna a verificar la cadena.
     */
    async avancaCap(ci, fil, { anterior = null, nou } = {}) {
      llegixCi(ci);
      exigix(esUuid(fil), 'fil');
      exigixCap(nou, 'nou');
      if (anterior !== null) {
        exigixCap(anterior, 'anterior');
        if (nou.epoca <= anterior.epoca) throw errorAmbCodi('CAP_RETROCEDIX', 'El cap d’una cadena d’èpoques no pot tornar arrere.');
      }
      const fila = { fil, epoca: nou.epoca, hash: new Uint8Array(nou.hash) };
      return operacio(ci, [FILS_XIFRATS], 'readwrite', (s, torna, avorta, quan) => {
        const store = s(FILS_XIFRATS);
        const peticio = store.get([ci, fil]);
        quan(peticio, () => {
          if (peticio.result !== undefined && !filSencer(peticio.result)) {
            avorta(malmes());
            return;
          }
          const actual = peticio.result ?? null;
          if (actual !== null && mateixCap(actual, fila)) {
            torna(false);
            return;
          }
          if (!mateixCap(actual, anterior)) {
            avorta(errorAmbCodi('CAP_CANVIAT', 'La cadena d’este xat ha avançat en una altra pestanya.'));
            return;
          }
          store.put(fila, [ci, fil]);
          torna(true);
        });
      });
    },

    /* ── Claus d'època (§4.2, §4.5) ── */

    /** La CK d'una època ({ fil, epoca, clau, hashE }), o null. */
    async clauDeFil(ci, fil, epoca) {
      llegixCi(ci);
      exigix(esUuid(fil) && esEpoca(epoca), 'fil i època');
      const fila = await llegixUna(ci, CLAUS_FIL, [ci, fil, epoca]);
      if (fila === undefined) return null;
      if (!clauFilSencera(fila)) throw malmeses();
      return fila;
    },

    /** Totes les CK d'un fil, de l'època més vella a la més nova. */
    async clausDelFil(ci, fil) {
      llegixCi(ci);
      exigix(esUuid(fil), 'fil');
      const files = await llegixTotes(ci, CLAUS_FIL, fil);
      if (!files.every(clauFilSencera)) throw malmeses();
      return files;
    },

    /**
     * Desa la CK d'una època. Cert si l'ha desada; fals si ja hi era amb el
     * mateix hash_e. Una altra clau per a la mateixa època és una bifurcació:
     * CLAU_FIL_CONFLICTE i res escrit. Una fila illegible (null) se substituïx.
     */
    async desaClauDeFil(ci, { fil, epoca, clau, hashE } = {}) {
      llegixCi(ci);
      exigix(esUuid(fil) && esEpoca(epoca), 'fil i època');
      exigix(esBytes(hashE, 32), 'hashE (32 bytes)');
      exigixClau(clau, PERFILS.epoca, 'clau');
      const fila = { fil, epoca, clau, hashE: new Uint8Array(hashE) };
      return operacio(ci, [CLAUS_FIL], 'readwrite', (s, torna, avorta, quan) => {
        const store = s(CLAUS_FIL);
        const clauFila = [ci, fil, epoca];
        const peticio = store.get(clauFila);
        quan(peticio, () => {
          const actual = peticio.result;
          if (hiEs(actual)) {
            if (!esBytes(actual.hashE, 32)) avorta(malmeses());
            else if (iguals(actual.hashE, fila.hashE)) torna(false);
            else avorta(errorAmbCodi('CLAU_FIL_CONFLICTE', 'Esta època del xat ja té una altra clau: la cadena s’ha bifurcat.'));
            return;
          }
          store.put(fila, clauFila);
          const rellegida = store.get(clauFila);
          quan(rellegida, () => {
            if (!clauFilSencera(rellegida.result)) {
              avorta(noDesables());
              return;
            }
            torna(true);
          });
        });
      }, true);
    },

    /* ── Llibreta de seguretat (§5.5) ── */

    /** El comptador de l'última llibreta que coneix este aparell (0 si cap). */
    async comptadorLlibreta(ci) {
      llegixCi(ci);
      return comptadorDe(await llegixUna(ci, IDENTITATS, [ci, 'llibreta']));
    },

    /** Apunta el comptador d'una llibreta desada al servidor. Mai baixa (LLIBRETA_ANTIGA); cert si ha pujat. */
    async desaComptadorLlibreta(ci, comptador) {
      llegixCi(ci);
      exigix(esMs(comptador) && comptador >= 1, 'comptador');
      return operacio(ci, [IDENTITATS], 'readwrite', (s, torna, avorta, quan) => {
        const store = s(IDENTITATS);
        const peticio = store.get([ci, 'llibreta']);
        quan(peticio, () => {
          const actual = comptadorDe(peticio.result);
          if (comptador < actual) {
            avorta(llibretaAntiga());
            return;
          }
          if (comptador > actual) store.put({ comptador }, [ci, 'llibreta']);
          torna(comptador > actual);
        });
      });
    },

    /** El que va a la llibreta, llegit en UNA transacció: { comptador, fixacions, fils }. */
    async instantaniaLlibreta(ci) {
      llegixCi(ci);
      const { llibreta, fixacions, fils } = await operacio(ci, [IDENTITATS, FIXACIONS, FILS_XIFRATS], 'readonly', (s, torna, avorta, quan) => {
        const llibretaP = s(IDENTITATS).get([ci, 'llibreta']);
        const fixacionsP = s(FIXACIONS).getAll(deLaPersona(ci));
        const filsP = s(FILS_XIFRATS).getAll(deLaPersona(ci));
        quan(filsP, () => torna({ llibreta: llibretaP.result, fixacions: fixacionsP.result ?? [], fils: filsP.result ?? [] }));
      });
      if (!fixacions.every(fixacioSencera) || !fils.every(filSencer)) throw malmes();
      return { comptador: comptadorDe(llibreta), fixacions, fils };
    },

    /**
     * Torna a este aparell el contingut d'una llibreta ja verificada (§5.5), en
     * UNA transacció. Mai res més vell: una llibreta amb un comptador menor que
     * el conegut, LLIBRETA_ANTIGA i res escrit. Les fixacions i els caps que
     * falten entren; els iguals fusionen verificat i vistAl; un cap més nou que
     * el local avança; un kid diferent o una mateixa època amb un altre hash no
     * trepitgen res i tornen com a conflictes.
     */
    async importaLlibreta(ci, { comptador, fixacions = [], fils = [] } = {}) {
      llegixCi(ci);
      exigix(esMs(comptador) && comptador >= 1, 'comptador');
      exigix(Array.isArray(fixacions) && fixacions.every(fixacioSencera), 'fixacions');
      exigix(Array.isArray(fils) && fils.every(filSencer), 'fils');
      exigix(new Set(fixacions.map((f) => f.usuari)).size === fixacions.length && new Set(fils.map((f) => f.fil)).size === fils.length, 'duplicats');
      return operacio(ci, [IDENTITATS, FIXACIONS, FILS_XIFRATS], 'readwrite', (s, torna, avorta, quan) => {
        const resultat = { fixacions: 0, fils: 0, conflictes: [] };
        const llibreta = s(IDENTITATS).get([ci, 'llibreta']);
        quan(llibreta, () => {
          const actual = comptadorDe(llibreta.result);
          if (comptador < actual) {
            avorta(llibretaAntiga());
            return;
          }
          if (comptador > actual) s(IDENTITATS).put({ comptador }, [ci, 'llibreta']);
          for (const f of fixacions) {
            const peticio = s(FIXACIONS).get([ci, f.usuari]);
            quan(peticio, () => {
              const local = peticio.result;
              if (local !== undefined && (!fixacioSencera(local) || !iguals(local.kid, f.kid))) {
                resultat.conflictes.push({ tipus: 'fixacio', usuari: f.usuari });
                return;
              }
              const fila = local === undefined
                ? filaFixacio(f)
                : filaFixacio({ ...f, verificat: f.verificat || local.verificat, vistAl: Math.max(f.vistAl, local.vistAl) });
              s(FIXACIONS).put(fila, [ci, f.usuari]);
              resultat.fixacions += 1;
            });
          }
          for (const f of fils) {
            const peticio = s(FILS_XIFRATS).get([ci, f.fil]);
            quan(peticio, () => {
              const local = peticio.result;
              if (local !== undefined && (!filSencer(local) || (local.epoca === f.epoca && !iguals(local.hash, f.hash)))) {
                resultat.conflictes.push({ tipus: 'fil', fil: f.fil });
                return;
              }
              if (local === undefined || local.epoca < f.epoca) {
                s(FILS_XIFRATS).put({ fil: f.fil, epoca: f.epoca, hash: new Uint8Array(f.hash) }, [ci, f.fil]);
                resultat.fils += 1;
              }
            });
          }
          torna(resultat);
        });
      });
    },

    /* ── Safata: «esperar, mai en clar» (§4.5.6, D-08) ── */

    /**
     * Deixa un missatge esperant a l'aparell, xifrat en repòs. `contingut` és un
     * objecte pla (el que el decorador enviarà, amb el mateix `id`). `actor` és
     * l'actorKey explícit del context i queda autenticat amb l'AAD. Tres
     * transaccions perquè el WebCrypto no pot anar dins de cap: llegir (o fer)
     * la clau de repòs, xifrar fora, i desar comprovant que la clau és encara
     * la mateixa (SAFATA_OBLIDADA si s'ha eixit entremig). SAFATA_DUPLICADA si
     * l'id ja hi és, SAFATA_PLENA amb 200 vius, SAFATA_GRAN per damunt de 64 KiB.
     */
    async desaASafata(ci, { fil, id, actor, contingut } = {}) {
      llegixCi(ci);
      exigix(esActor(actor), 'actor');
      exigix(esUuid(fil) && esUuid(id), 'fil i id');
      exigix(esObjectePla(contingut), 'contingut (objecte pla)');
      let text;
      try {
        text = JSON.stringify(contingut);
      } catch {
        throw invalides('contingut (no es pot serialitzar)');
      }
      const bytes = new TextEncoder().encode(text);
      try {
        if (bytes.length > MAX_BYTES_SAFATA) throw errorAmbCodi('SAFATA_GRAN', 'Este missatge és massa gran per a deixar-lo esperant.');
        const gen = generacio(ci);
        const clauFila = await clauDeLaSafata(ci, gen);
        const fila = { fil, id, actor, creatMs: araMs(), idClau: clauFila.idClau, iv: aleatori(BYTES_IV) };
        fila.ct = new Uint8Array(await cripto.subtle.encrypt(
          { name: 'AES-GCM', iv: fila.iv, additionalData: aadSafata(ci, fila), tagLength: 128 }, clauFila.clau, bytes
        ));
        return await ambLaPersona(ci, gen, [SAFATA], 'readwrite', (s, torna, avorta, quan) => {
          const store = s(SAFATA);
          const clau = store.get([ci, 'clau']);
          const existent = store.get([ci, 'missatge', id]);
          quan(existent, () => {
            if (clau.result?.idClau !== fila.idClau) {
              avorta(safataOblidada());
              return;
            }
            if (existent.result !== undefined) {
              avorta(errorAmbCodi('SAFATA_DUPLICADA', 'Este missatge ja és a la safata.'));
              return;
            }
            vivesDeLaSafata(store, ci, quan, (vives) => {
              if (vives.length >= MAX_MISSATGES_SAFATA) {
                avorta(errorAmbCodi('SAFATA_PLENA', 'Hi ha massa missatges esperant: espera que ixquen o esborra’n algun.'));
                return;
              }
              store.put(fila, [ci, 'missatge', id]);
              torna(resumSafata(fila));
            });
          });
        }, true);
      } finally {
        bytes.fill(0);
      }
    },

    /**
     * Els missatges de l’actor explícit que esperen, del més vell al més nou, desxifrats:
     * { fil, id, actor, creatMs, caducaMs, contingut, malmes }. Els caducats (30 dies)
     * i les files trencades s'esborren en la mateixa transacció; un que no es
     * pot desxifrar torna amb malmes: true i contingut null, per a poder-lo
     * descartar.
     */
    async safata(ci, actor) {
      llegixCi(ci);
      exigix(esActor(actor), 'actor');
      const gen = generacio(ci);
      const { clau, vives } = await ambLaPersona(ci, gen, [SAFATA], 'readwrite', (s, torna, avorta, quan) => {
        const store = s(SAFATA);
        const clauP = store.get([ci, 'clau']);
        vivesDeLaSafata(store, ci, quan, (files) => torna({ clau: clauP.result ?? null, vives: files }));
      });
      const clauFila = clauSafataSencera(clau) ? clau : null;
      /* Només les files de l'actor demanat arriben al desxifrat; l'AAD l'autentica. */
      const entrades = await Promise.all(vives.filter((fila) => fila.actor === actor).map((fila) => obriEntrada(ci, clauFila, fila)));
      if (generacio(ci) !== gen) throw oblidat();
      return entrades.sort((a, b) => a.creatMs - b.creatMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    },

    /** Trau un missatge de l’actor explícit (ja ha eixit, o el descarta); cert si hi era i li corresponia. */
    async treuDeSafata(ci, id, actor) {
      llegixCi(ci);
      exigix(esActor(actor), 'actor');
      exigix(esUuid(id), 'id');
      return operacio(ci, [SAFATA], 'readwrite', (s, torna, avorta, quan) => {
        const store = s(SAFATA);
        const peticio = store.get([ci, 'missatge', id]);
        quan(peticio, () => {
          const correspon = peticio.result !== undefined && peticio.result?.actor === actor;
          torna(correspon);
          if (correspon) store.delete([ci, 'missatge', id]);
        });
      });
    },

    /** Esborra els missatges caducats (i les files trencades) de TOTES les persones d'este aparell; torna quants. No passa per la sonda. */
    async purgaSafata() {
      return purgaCaducades();
    },

    /* ── Oblit (D-09) ── */

    /**
     * Esborra tot el que és de la persona en els cinc magatzems, en UNA
     * transacció, i fa fallar amb OBLIDAT les seues operacions encara en vol
     * (les de qualsevol instància d'esta pestanya). Torna quantes files ha
     * esborrat; si no ha pogut, OBLIT_FALLIT. No passa per la sonda.
     */
    oblida,

    /**
     * En tancar la sessió: la safata, sempre (§4.5.6); la resta, també, si no
     * s'ha marcat «Mantén la sessió iniciada en este aparell» (D-09). Només
     * mantenSessio === true conserva: qualsevol altre valor (també cap opció o
     * null) esborra.
     */
    async oblidaEnTancar(ci, opcions) {
      if (opcions?.mantenSessio !== true) return oblida(ci);
      llegixCi(ci);
      oblidaGeneracio(ci);
      return esborra(ci, [SAFATA]);
    },

    tanca() {
      if (connexio) connexio.then((bd) => bd.close(), () => {});
      connexio = null;
      if (enEspera) enEspera.tancada = true;
    }
  });
}
