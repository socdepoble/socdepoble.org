/**
 * src/data/xifratXat.js — Decorador neutral `ambXifratXat(impl, entorn)` i
 * servei de cicle de vida d'àmbit per a la interfície (`sdp-xat-v1`, P1-12 /
 * IDEA-19; `_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/
 * disseny_final_e2ee.md` §8.1, §8.2, §8.6 i §21.1).
 *
 * Propietats estructurals verificables:
 *   · Cap import de `src/data/supabase/` (porta E1, `tractor-enxufe.mjs`).
 *   · Cap accés a globals (`window`, `crypto`, `indexedDB`): tot s'injecta per
 *     `entorn`.
 *   · Apagat per defecte per flag (`entorn.actiu === false`): pass-through
 *     exacte que preserva el receptor (`this`), els arguments, les promeses i
 *     les instàncies d'error de totes les capacitats del port (`CONTRACTE_NUCLI`,
 *     `xatMultimedia`, `clausXat`, `xatMultimediaXifrat`, `agenda`), sense
 *     tocar WebCrypto, IndexedDB ni la xarxa.
 *   · Canal de servei fora de les operacions de transport (`serveiXifratXat`),
 *     registrat en un `WeakMap` perquè sobrevisca a `validaBackendImplementation`
 *     sense afegir `fixaAmbit` a `CONTRACTE_BACKEND`.
 *   · Cicle de vida de 4 claus (`clauIdentitat`, `ambitEstable`, `genAmbit`,
 *     `genIdentitat`, §8.6 i §21.1):
 *       - La renovació del JWT amb el mateix parell conserva les memòries en
 *         RAM i no incrementa cap generació.
 *       - El canvi d'actor incrementa `genAmbit`, buida la RAM i revoca els
 *         `blob:`, però conserva `genIdentitat` i els camins d'identitat.
 *       - El canvi de persona/backend incrementa `genAmbit` i `genIdentitat`.
 *       - L'anada i tornada `A -> B -> A` incrementa `genAmbit` dues vegades i
 *         descarta qualsevol resultat tardà iniciat en el primer `A` (posant a
 *         zero els `Uint8Array` temporals i revocant qualsevol `blob:`).
 *   · Quan `actiu === true`:
 *       - Fallar tancat (§8.2) en fils d'abast (`ambitDelFil(fil).xifrat`) si
 *         falta `fixaAmbit`, `isSecureContext === true`, `cripto.subtle`,
 *         `indexedDB` o un origen de confiança (`esOrigenDeConfianca`).
 *       - Registre propi de fils amb marca apegalosa: `enviaMissatge` classifica
 *         sempre amb el registre propi del decorador (mai amb l'objecte que li
 *         passen); si no coneix el fil, el carrega abans; si no pot o està
 *         bloquejat, rebutja sense enviar en clar.
 *       - `appendChatMessages` s'executa com un bucle sobre l'`enviaMissatge`
 *         decorat.
 *       - `publicaAdjuntXat` classifica amb el mateix registre: els adjunts
 *         privats queden bloquejats fins a tindre el pipeline xifrat complet.
 */

import { E2EE_ACTIU_PER_DEFECTE, esOrigenDeConfianca } from '../config/xifratXat.js';
import { ambitDelFil, teMarcaApegalosa } from './xifratXatAbast.js';
import { creaMagatzemXat } from './xifratXatMagatzem.js';
import { ESTAT_OBLIT, creaMotorXifrat } from './xifratXatPipeline.js';
import { PRESSUPOST_BLOBS_MOBIL, PRESSUPOST_BLOBS_ESCRIPTORI, creaRegistreBlobsAdjunts } from './xatMultimediaXifrat.js';

import { serveiXifratXatDe, registraServeiXifratXat } from './xifratXatServei.js';

function errorXifrat(codi, missatge, extres = {}) {
  const error = new Error(missatge);
  error.codi = codi;
  return Object.assign(error, extres);
}

function errorAmbitCanviat() {
  return errorXifrat(
    'ambit-canviat',
    'L’operació ja no correspon a l’àmbit vigent.',
    { name: 'AbortError', code: 'AMBIT_CANVIAT', reintentable: true }
  );
}

function errorSenseAmbit() {
  return errorXifrat(
    'sense-ambit',
    'Cal fixar l’àmbit estable abans d’operar en un fil xifrat.',
    { code: 'SENSE_AMBIT', reintentable: false }
  );
}

function netejaBytes(valor) {
  if (!valor) return;
  if (Object.prototype.toString.call(valor) === '[object Uint8Array]') {
    valor.fill(0);
    return;
  }
  if (Array.isArray(valor)) {
    for (const element of valor) netejaBytes(element);
    return;
  }
  if (typeof valor === 'object') {
    for (const v of Object.values(valor)) {
      if (Object.prototype.toString.call(v) === '[object Uint8Array]') v.fill(0);
    }
  }
}

function normalitzaEntradaAmbit(entrada, segonaClau) {
  if (typeof entrada === 'string') {
    return {
      ambitEstable: entrada.trim(),
      clauIdentitat: typeof segonaClau === 'string' ? segonaClau.trim() : ''
    };
  }
  if (entrada && typeof entrada === 'object') {
    const ambitEstable = typeof (entrada.ambitEstable ?? entrada.ambit) === 'string'
      ? (entrada.ambitEstable ?? entrada.ambit).trim()
      : '';
    const clauIdentitat = typeof (entrada.clauIdentitat ?? entrada.clau) === 'string'
      ? (entrada.clauIdentitat ?? entrada.clau).trim()
      : '';
    return { ambitEstable, clauIdentitat };
  }
  return { ambitEstable: '', clauIdentitat: '' };
}

/**
 * Crea el gestor de les 4 claus (`clauIdentitat`, `ambitEstable`, `genAmbit`,
 * `genIdentitat`) i de les memòries en RAM de l'àmbit (§8.6 i §21.1).
 */
export function creaServeiAmbitXat({ revocaUrl = () => {}, motorRef = {}, pressupostBlobs = null } = {}) {
  let ambitEstable = null;
  let clauIdentitat = null;
  let genAmbit = 0;
  let genIdentitat = 0;
  let viu = true;

  const resumUltimXifrat = new Map();
  const textosDesxifrats = new Map();
  const clausEpocaRam = new Map();
  const registreFils = new Map();
  const marquesApegaloses = new Set();
  const blobsActius = new Set();
  /* Fase 4 (E1) · RAM de l'àmbit del motor: índex d'adjunts rebuts, URL blob: per
     clau (adjunt, SHA-256(FK)) i l'últim estat de l'oblit (D-09, sobreviu a l'àmbit).
     Pas 17 (§4.7) · Les URL dels adjunts viuen en un LRU amb pressupost de bytes en
     clar (48 MB al mòbil, 100 MB a l'escriptori; un valor invàlid o per damunt de
     100 MB cau als 48 MB): en desallotjar es revoca i ix de blobsActius. */
  const adjuntsRebuts = new Map();
  const pressupost = Number.isSafeInteger(pressupostBlobs) && pressupostBlobs > 0 && pressupostBlobs <= PRESSUPOST_BLOBS_ESCRIPTORI
    ? pressupostBlobs
    : PRESSUPOST_BLOBS_MOBIL;
  const urlsAdjunts = creaRegistreBlobsAdjunts({
    pressupost,
    revoca: (url) => {
      blobsActius.delete(url);
      revocaUrl(url);
    }
  });
  let estatOblit = null;

  const revocaTotsElsBlobs = () => {
    for (const url of blobsActius) {
      try { revocaUrl(url); } catch { /* ignora error de revocació tardana */ }
    }
    blobsActius.clear();
  };

  const buidaRamAmbit = () => {
    for (const ck of clausEpocaRam.values()) netejaBytes(ck);
    clausEpocaRam.clear();
    resumUltimXifrat.clear();
    /* Gauntlet c2 (C2, Codex 0256) · Les FK dels adjunts (`a.k`, 32 B en clar) són d'este
       servei: els textos desxifrats i l'índex d'adjunts rebuts compartixen el mateix `a`, i cap
       objecte que ix cap a la interfície no el porta (vesteix i eco només en donen les
       metadades). A zero abans de soltar-ne les referències. */
    for (const valor of textosDesxifrats.values()) netejaBytes(valor?.a);
    for (const info of adjuntsRebuts.values()) netejaBytes(info?.a);
    textosDesxifrats.clear();
    registreFils.clear();
    adjuntsRebuts.clear();
    urlsAdjunts.buida();
    revocaTotsElsBlobs();
  };

  const fixaAmbit = (entrada, segonaClau) => {
    if (!viu) throw errorAmbitCanviat();
    const { ambitEstable: nouAmbit, clauIdentitat: novaClau } = normalitzaEntradaAmbit(entrada, segonaClau);
    if (!nouAmbit || !novaClau) {
      throw new TypeError('Cal ambitEstable i clauIdentitat explícits no buits.');
    }
    const canviaIdentitat = novaClau !== clauIdentitat;
    const canviaAmbit = nouAmbit !== ambitEstable;
    if (canviaIdentitat) {
      clauIdentitat = novaClau;
      genIdentitat += 1;
      marquesApegaloses.clear();
    }
    if (canviaAmbit || canviaIdentitat) {
      ambitEstable = nouAmbit;
      genAmbit += 1;
      buidaRamAmbit();
    }
    return estatAmbit();
  };

  const estatAmbit = () => {
    const blobs = urlsAdjunts.estat();
    return Object.freeze({
      ambitEstable,
      clauIdentitat,
      genAmbit,
      genIdentitat,
      viu,
      midaResums: resumUltimXifrat.size,
      midaFils: registreFils.size,
      midaBlobs: blobsActius.size,
      bytesBlobs: blobs.bytes,
      pressupostBlobs: blobs.pressupost
    });
  };

  const captura = (tipus = 'ambit') => {
    if (tipus !== 'ambit' && tipus !== 'identitat') {
      throw new TypeError('Tipus de captura invàlid; usa "ambit" o "identitat".');
    }
    if (!viu) throw errorAmbitCanviat();
    const clau = tipus === 'ambit' ? ambitEstable : clauIdentitat;
    if (!clau) throw errorSenseAmbit();
    return Object.freeze({
      tipus,
      clau,
      gen: tipus === 'ambit' ? genAmbit : genIdentitat
    });
  };

  const vigent = (token) => Boolean(
    viu
    && token
    && (token.tipus === 'ambit'
      ? token.clau === ambitEstable && token.gen === genAmbit
      : token.tipus === 'identitat' && token.clau === clauIdentitat && token.gen === genIdentitat)
  );

  const exigix = (token) => {
    if (!vigent(token)) throw errorAmbitCanviat();
  };

  const guarda = async (tipus, treballa, { descarta = () => {}, blobs = [] } = {}) => {
    const token = captura(tipus);
    exigix(token);
    const blobsOperacio = [];
    const anotaBlob = (url) => {
      if (typeof url === 'string' && url.startsWith('blob:')) blobsOperacio.push(url);
      return url;
    };
    const netejaOperacio = (resultat) => {
      netejaBytes(resultat);
      for (const b of [...blobs, ...blobsOperacio]) {
        blobsActius.delete(b);
        try { revocaUrl(b); } catch { /* ignora */ }
      }
      descarta(resultat);
    };
    try {
      const resultat = await treballa(() => exigix(token), anotaBlob, token);
      if (!vigent(token)) {
        netejaOperacio(resultat);
        throw errorAmbitCanviat();
      }
      for (const b of blobsOperacio) blobsActius.add(b);
      return resultat;
    } catch (error) {
      if (!vigent(token)) {
        netejaOperacio(null);
        throw errorAmbitCanviat();
      }
      throw error;
    }
  };

  const registraBlob = (url, token = null) => {
    if (typeof url !== 'string' || !url.startsWith('blob:')) return url;
    if (token && !vigent(token)) {
      try { revocaUrl(url); } catch { /* ignora */ }
      throw errorAmbitCanviat();
    }
    blobsActius.add(url);
    return url;
  };

  const oblidaClausXat = () => {
    genAmbit += 1;
    genIdentitat += 1;
    ambitEstable = null;
    clauIdentitat = null;
    buidaRamAmbit();
    marquesApegaloses.clear();
  };

  const desmunta = () => {
    oblidaClausXat();
    viu = false;
  };

  const anotaFilAlRegistre = (conversa) => {
    if (!conversa || typeof conversa !== 'object' || typeof conversa.id !== 'string' || !conversa.id.trim()) {
      return conversa;
    }
    const id = conversa.id.trim();
    if (teMarcaApegalosa(conversa, marquesApegaloses.has(id))) {
      marquesApegaloses.add(id);
    }
    const copia = Object.freeze({
      ...conversa,
      id,
      ...(marquesApegaloses.has(id) ? { e2eeObligatori: true } : {})
    });
    registreFils.set(id, copia);
    return copia;
  };

  return Object.freeze({
    fixaAmbit,
    estatAmbit,
    captura,
    vigent,
    exigix,
    guarda,
    guardaAmbit: (treballa, opcions) => guarda('ambit', treballa, opcions),
    guardaIdentitat: (treballa, opcions) => guarda('identitat', treballa, opcions),
    registraBlob,
    revocaBlobs: revocaTotsElsBlobs,
    oblidaClausXat,
    desmunta,
    anotaFilAlRegistre,
    obtindreFilRegistrat: (filId) => registreFils.get(typeof filId === 'string' ? filId.trim() : '') ?? null,
    esFilApegalos: (filId) => marquesApegaloses.has(typeof filId === 'string' ? filId.trim() : ''),
    desaResumUltimXifrat: (filId, ultimId, textClar) => {
      resumUltimXifrat.set(`${filId}::${ultimId}`, textClar);
    },
    llegixResumUltimXifrat: (filId, ultimId) => resumUltimXifrat.get(`${filId}::${ultimId}`) ?? null,
    /* Fase 4 (E1) · El motor guarda ací, sota l'àmbit, l'estat del protocol de cada fil
       (clausEpocaRam), els textos desxifrats per (fil, id), els adjunts rebuts i les URL. */
    estatFilDesat: (filId) => clausEpocaRam.get(filId) ?? null,
    desaEstatFil: (filId, context) => { if (context) clausEpocaRam.set(filId, context); else clausEpocaRam.delete(filId); },
    textDesxifrat: (filId, id) => textosDesxifrats.get(`${filId}::${id}`) ?? null,
    desaTextDesxifrat: (filId, id, valor) => { textosDesxifrats.set(`${filId}::${id}`, valor); },
    adjuntDesat: (id) => adjuntsRebuts.get(id) ?? null,
    /* Cicle 4 (tancament, e2ee-index-adjunts) · Un id d'adjunt és d'un sol (fil, emissor): la
       primera entrada mana i una d'un altre fil o d'un altre emissor no la sobreescriu (torna
       false i el motor tanca eixa fila). El mateix (fil, emissor) sí que la renova. */
    desaAdjunt: (id, info) => {
      const previ = adjuntsRebuts.get(id);
      if (previ && (previ.fil !== info?.fil || previ.emissor !== info?.emissor)) return false;
      adjuntsRebuts.set(id, info);
      return true;
    },
    urlAdjuntDesada: (clau) => urlsAdjunts.obte(clau),
    desaUrlAdjunt: (clau, url, bytes = 0) => {
      blobsActius.add(url);
      try {
        urlsAdjunts.desa(clau, url, bytes);
      } catch (error) {
        /* Una entrada invàlida (o sense lloc dins del sostre de 100 MB) no deixa cap blob: penjat fora del registre. */
        blobsActius.delete(url);
        try { revocaUrl(url); } catch { /* ignora */ }
        throw error;
      }
    },
    /* QA-C01 (Gauntlet 261029_1858) · La retenció de la URL que una peça pinta o reprodueix
       (el motor la pren en servir-la) i la pregunta del sostre abans de desxifrar. */
    retenUrlAdjunt: (clau) => urlsAdjunts.reten(clau),
    hiCapUrlAdjunt: (bytes) => urlsAdjunts.hiCap(bytes),
    /* La cua F7 i l'oblit (D-09) passen pel motor quan n'hi ha; sense motor, l'oblit és només RAM i ho diu. */
    drenaSafata: (config = {}) => (typeof motorRef.drena === 'function'
      ? motorRef.drena(config)
      : Promise.resolve(Object.freeze({ enviats: [], pendents: [], error: errorXifrat('sense-motor-xifrat', 'Este entorn no té el motor del pipeline xifrat.') }))),
    oblidaTotXat: (opcions = {}) => {
      if (typeof motorRef.oblidaTot === 'function') return motorRef.oblidaTot(opcions);
      /* Gauntlet c1 · conservaAmbit: l'àmbit fixat és d'una altra persona que ja ha entrat (xifratXatEixida.js). */
      if (opcions?.conservaAmbit !== true) oblidaClausXat();
      estatOblit = Object.freeze({ estat: ESTAT_OBLIT.oblidat, pendents: Object.freeze([]), causes: Object.freeze([]), nomesRam: true });
      return Promise.resolve(estatOblit);
    },
    estatOblit: () => estatOblit,
    desaEstatOblit: (estat) => { estatOblit = estat; }
  });
}

function comprovaEntornSegur(entorn = {}) {
  if (entorn.isSecureContext !== true) {
    throw errorXifrat('entorn-insegur', 'Cal un context segur (isSecureContext === true) per al xifratge del xat.');
  }
  if (!esOrigenDeConfianca(entorn.origen, { dev: entorn.dev === true, enMarc: entorn.enMarc === true })) {
    throw errorXifrat('origen-no-confiat', 'L’origen actual no està autoritzat per al xifratge del xat.');
  }
  if (!entorn.cripto || typeof entorn.cripto?.subtle?.digest !== 'function') {
    throw errorXifrat('sense-cripto', 'WebCrypto (crypto.subtle) és obligatori per al xifratge del xat.');
  }
  if (!entorn.indexedDB || typeof entorn.indexedDB?.open !== 'function') {
    throw errorXifrat('sense-indexeddb', 'IndexedDB és obligatori per guardar les claus del xat.');
  }
}

/* QA-C01 · Les opcions de urlAdjuntXat sense la retenció interna, per a l'adaptador. */
function senseRetencio(opcions) {
  if (!opcions || typeof opcions !== 'object' || !Object.hasOwn(opcions, 'reten')) return opcions;
  const copia = { ...opcions };
  delete copia.reten;
  return copia;
}

/**
 * Embolcalla una implementació del backend amb el decorador d'E2EE (`§8.2`).
 * Quan `entorn.actiu !== true` (per defecte `false`), actua com a pass-through
 * literal sense activar ni exigir WebCrypto/IndexedDB.
 */
export function ambXifratXat(impl, entorn = {}) {
  if (!impl || typeof impl !== 'object') {
    throw new TypeError('ambXifratXat necessita una implementació de backend vàlida.');
  }
  const actiu = entorn?.actiu ?? E2EE_ACTIU_PER_DEFECTE;
  const modeDades = entorn?.modeDades ?? 'remote';
  if (actiu !== true || modeDades !== 'remote') return impl;
  const motorRef = {};
  const servei = creaServeiAmbitXat({ revocaUrl: entorn?.revocaUrl, motorRef, pressupostBlobs: entorn?.pressupostBlobs ?? null });
  /* Fase 4 (pla 261029_1305, E1) · El motor del pipeline només quan l'entorn porta
     WebCrypto i un magatzem de claus (o IndexedDB amb IDBKeyRange i CryptoKey
     injectats); si no, el decorador es comporta com a la Fase 3 (fallar tancat). */
  const potTindreMotor = Boolean(entorn?.cripto?.subtle)
    && (Boolean(entorn?.magatzem) || (Boolean(entorn?.indexedDB) && Boolean(entorn?.IDBKeyRange) && typeof entorn?.ClasseClau === 'function'));
  let motor = null;
  if (potTindreMotor) {
    const magatzem = entorn.magatzem ?? creaMagatzemXat({
      idb: entorn.indexedDB, rangs: entorn.IDBKeyRange, cripto: entorn.cripto, ClasseClau: entorn.ClasseClau, ...(entorn.ara ? { ara: entorn.ara } : {})
    });
    motor = creaMotorXifrat({ cripto: entorn.cripto, impl, servei, magatzem, ...(entorn.ara ? { ara: entorn.ara } : {}), creaBlob: entorn.creaBlob ?? null, creaUrl: entorn.creaUrl ?? null });
    motorRef.oblidaTot = (opcions = {}) => motor.oblidaTot({ sessio: entorn.sessio ?? null, preferencies: entorn.preferencies ?? null, ...opcions });
  }

  const delega = (nom) => {
    const fn = impl[nom];
    if (typeof fn !== 'function') return undefined;
    return function metodeDelegat(...args) {
      return Reflect.apply(fn, impl, args);
    };
  };

  const claus = new Set();
  for (let owner = impl; owner && owner !== Object.prototype; owner = Object.getPrototypeOf(owner)) {
    for (const nom of Object.getOwnPropertyNames(owner)) claus.add(nom);
  }

  const decorat = {};
  for (const nom of claus) {
    if (nom === 'constructor') continue;
    let descriptor;
    for (let owner = impl; owner && owner !== Object.prototype; owner = Object.getPrototypeOf(owner)) {
      descriptor = Object.getOwnPropertyDescriptor(owner, nom);
      if (descriptor) break;
    }
    if (descriptor && ('get' in descriptor || 'set' in descriptor)) {
      Object.defineProperty(decorat, nom, descriptor);
      continue;
    }
    if (typeof impl[nom] === 'function') {
      decorat[nom] = delega(nom);
    }
  }

  if (actiu === true && modeDades === 'remote') {
    const carregaFilAlRegistre = async (filId, config, exigix) => {
      let fil = servei.obtindreFilRegistrat(filId);
      if (!fil && typeof impl.loadFils === 'function') {
        const llista = await Reflect.apply(impl.loadFils, impl, [config]);
        exigix();
        if (Array.isArray(llista)) {
          for (const item of llista) servei.anotaFilAlRegistre(item);
          fil = servei.obtindreFilRegistrat(filId);
        }
      }
      return fil;
    };

    const classificaFil = (fil) => ambitDelFil(fil, { modeDades, marcatApegalos: servei.esFilApegalos(fil?.id ?? '') });
    if (motor) {
      motorRef.drena = (config = {}) => servei.guardaAmbit(async (exigix) => motor.drena({
        config, exigix, classifica: classificaFil,
        carregaFil: (filId) => carregaFilAlRegistre(filId, config, exigix),
        envia: (filId, paquet) => Reflect.apply(impl.enviaXifratXat, impl, [filId, paquet, config])
      }));
    }

    if (typeof impl.loadFils === 'function') {
      decorat.loadFils = async function loadFilsDecorat(config = {}) {
        return servei.guardaAmbit(async (exigix) => {
          const fils = await Reflect.apply(impl.loadFils, impl, [config]);
          exigix();
          if (!Array.isArray(fils)) return fils;
          const resultat = [];
          for (const fil of fils) {
            const registrat = servei.anotaFilAlRegistre(fil);
            const ultimId = registrat?.ultimXifrat?.id ?? registrat?.ultim_id ?? null;
            if (ultimId && registrat?.id) {
              const enCau = servei.llegixResumUltimXifrat(registrat.id, ultimId);
              if (enCau !== null) {
                resultat.push({ ...registrat, ultimTextDesxifrat: enCau });
                continue;
              }
              if (typeof entorn.desxifraResum === 'function' && registrat.ultimXifrat) {
                const textClar = entorn.desxifraResum(registrat);
                servei.desaResumUltimXifrat(registrat.id, ultimId, textClar);
                resultat.push({ ...registrat, ultimTextDesxifrat: textClar });
                continue;
              }
              /* Fase 4 · El resum el desxifra el motor (memòria cau per (fil, últim id) sota l'àmbit). */
              if (motor && registrat.ultimXifrat?.xifrat) {
                const textClar = await motor.resumDelFil({ fil: registrat, tipusFil: classificaFil(registrat).tipusFil, config, exigix });
                if (textClar !== null) {
                  servei.desaResumUltimXifrat(registrat.id, ultimId, textClar);
                  resultat.push({ ...registrat, ultimTextDesxifrat: textClar });
                  continue;
                }
              }
            }
            resultat.push(registrat);
          }
          return resultat;
        });
      };
    }

    if (typeof impl.loadMissatges === 'function') {
      decorat.loadMissatges = async function loadMissatgesDecorat(filId, config = {}) {
        return servei.guardaAmbit(async (exigix) => {
          const files = await Reflect.apply(impl.loadMissatges, impl, [filId, config]);
          exigix();
          /* Fase 4 · Recepció i historial: cada fila amb sobre es desxifra (o queda amb l'estat explícit). */
          if (motor && Array.isArray(files) && files.some((f) => f && typeof f === 'object' && f.xifrat)) {
            const idDelFil = typeof filId === 'string' ? filId.trim() : '';
            const fil = await carregaFilAlRegistre(idDelFil, config, exigix);
            exigix();
            if (fil) return motor.obri({ fil, tipusFil: classificaFil(fil).tipusFil, files, config, exigix });
          }
          return files;
        });
      };
    }

    if (typeof impl.enviaMissatge === 'function') {
      decorat.enviaMissatge = async function enviaMissatgeDecorat(filIdOObj, cos, config = {}) {
        const filId = typeof filIdOObj === 'string'
          ? filIdOObj.trim()
          : (typeof filIdOObj?.id === 'string' ? filIdOObj.id.trim() : '');
        const idMissatge = cos?.id ?? config?.id ?? null;

        return servei.guardaAmbit(async (exigix) => {
          const fil = await carregaFilAlRegistre(filId, config, exigix);
          exigix();

          const classificacio = ambitDelFil(fil, {
            modeDades,
            marcatApegalos: servei.esFilApegalos(filId)
          });

          if (!classificacio.xifrat && !classificacio.bloquejat) {
            exigix();
            return Reflect.apply(impl.enviaMissatge, impl, [filIdOObj, cos, config]);
          }

          if (classificacio.bloquejat) {
            throw errorXifrat(
              classificacio.motiu || 'fil-bloquejat',
              `El fil no pot enviar missatges (${classificacio.motiu}).`,
              { id: idMissatge, reintentable: false }
            );
          }

          comprovaEntornSegur(entorn);
          if (typeof impl.enviaXifratXat !== 'function') {
            throw errorXifrat(
              'sense-capacitat-e2ee',
              'El backend no exposa el transport enviaXifratXat per a un fil d’abast xifrat.',
              { id: idMissatge, reintentable: false }
            );
          }

          if (typeof entorn.preparaSobreXifrat === 'function') {
            const paquet = await entorn.preparaSobreXifrat({ fil, cos, config, exigix });
            exigix();
            if (!paquet || typeof paquet !== 'object' || paquet.text !== null
              || !paquet.xifrat || typeof paquet.xifrat !== 'object') {
              throw errorXifrat('clar-rebutjat', 'SDP-XAT-031: el preparador ha de tornar un sobre sense text en clar.',
                { id: idMissatge, code: 'SDP-XAT-031', reintentable: false });
            }
            return Reflect.apply(impl.enviaXifratXat, impl, [fil.id, paquet, config]);
          }

          exigix();
          /* Fase 4 · El motor prepara el sobre (gènesi dins de l'enviament si cal); amb les claus
             bloquejades el missatge s'encua a la safata (F7) amb el mateix id i la interfície ho sap. */
          if (motor && !(cos && typeof cos === 'object' && cos.xifrat)) {
            let paquet;
            try {
              paquet = await motor.prepara({ fil, tipusFil: classificacio.tipusFil, cos, config, exigix });
            } catch (error) {
              if (error?.encuable === true) return motor.encua({ fil, cos, exigix });
              throw error;
            }
            let resultat;
            try {
              resultat = await Reflect.apply(impl.enviaXifratXat, impl, [fil.id, paquet, config]);
            } catch (error) {
              if (paquet.epocaNova) motor.descarta(fil.id);
              throw error;
            }
            exigix();
            return motor.eco(resultat, paquet, cos, fil.id);
          }
          if (!cos || typeof cos !== 'object' || !cos.xifrat || cos.text !== null) {
            throw errorXifrat(
              'clar-rebutjat',
              'SDP-XAT-031: un fil d’abast xifrat no envia mai text en clar.',
              { id: idMissatge, code: 'SDP-XAT-031', reintentable: false }
            );
          }
          return Reflect.apply(impl.enviaXifratXat, impl, [fil.id, cos, config]);
        });
      };
    }

    if (claus.has('publicaAdjuntXat') && typeof impl.publicaAdjuntXat === 'function') {
      decorat.publicaAdjuntXat = async function publicaAdjuntXatDecorat(filId, entrada, config = {}) {
        const idDelFil = typeof filId === 'string' ? filId.trim() : '';
        return servei.guardaAmbit(async (exigix) => {
          const fil = await carregaFilAlRegistre(idDelFil, config, exigix);
          exigix();
          const classificacio = ambitDelFil(fil, {
            modeDades,
            marcatApegalos: servei.esFilApegalos(idDelFil)
          });
          if (classificacio.bloquejat) {
            throw errorXifrat(classificacio.motiu || 'fil-bloquejat', 'El fil no pot publicar este adjunt.',
              { id: entrada?.id ?? null, reintentable: false });
          }
          if (classificacio.xifrat) {
            /* Fase 4 · Amb motor: xifrar abans de pujar (xatMultimediaXifrat.js); sense motor, fallar tancat com a la Fase 3. */
            if (!motor) {
              throw errorXifrat('adjunt-xifrat-pendent', 'Encara no es poden publicar adjunts xifrats en este fil.',
                { id: entrada?.id ?? null, reintentable: false });
            }
            return motor.publicaAdjunt({ fil, tipusFil: classificacio.tipusFil, entrada, config, exigix });
          }
          exigix();
          return Reflect.apply(impl.publicaAdjuntXat, impl, [filId, entrada, config]);
        });
      };
    }

    /* Fase 4 · Un adjunt rebut xifrat es servix com a blob: desxifrat (hash abans de desxifrar);
       la resta d'ids van pel camí de sempre (URL signada). */
    if (motor && claus.has('urlAdjuntXat') && typeof impl.urlAdjuntXat === 'function') {
      /* QA-C01 · `opcions.reten` (AdjuntXat, només amb la bandera encesa) rep l'alliberament
         de la URL desxifrada que se li servix; és intern del paquet i no arriba mai a
         l'adaptador (les URL signades no es revoquen). */
      decorat.urlAdjuntXat = async function urlAdjuntXatDecorat(id, config = {}, opcions = {}) {
        const reten = typeof opcions?.reten === 'function' ? opcions.reten : null;
        if (!servei.adjuntDesat(typeof id === 'string' ? id : '')) return Reflect.apply(impl.urlAdjuntXat, impl, [id, config, senseRetencio(opcions)]);
        return servei.guardaAmbit(async (exigix, anotaBlob) => anotaBlob(await motor.urlAdjunt({ id, config, exigix, renova: opcions?.renova === true, reten })));
      };
    }

    if (typeof impl.appendChatMessages === 'function' && typeof decorat.enviaMissatge === 'function') {
      decorat.appendChatMessages = async function appendChatMessagesDecorat(messages, config = {}) {
        if (!Array.isArray(messages)) return [];
        const resultats = [];
        for (const msg of messages) {
          const filId = msg?.threadId ?? msg?.filId ?? config?.threadId ?? '';
          resultats.push(await decorat.enviaMissatge(filId, msg, config));
        }
        return resultats;
      };
    }
  }

  Object.defineProperty(decorat, 'servei', {
    value: servei,
    enumerable: false,
    configurable: false,
    writable: false
  });

  let ownerDestroy = impl, descriptorDestroy;
  while (ownerDestroy && ownerDestroy !== Object.prototype) {
    descriptorDestroy = Object.getOwnPropertyDescriptor(ownerDestroy, 'destroy');
    if (descriptorDestroy) break;
    ownerDestroy = Object.getPrototypeOf(ownerDestroy);
  }
  if (descriptorDestroy && (!('value' in descriptorDestroy) || typeof descriptorDestroy.value !== 'function')) {
    throw new TypeError('destroy ha de ser un mètode.');
  }
  const destrueixBackend = descriptorDestroy?.value ?? null;
  decorat.destroy = function destroyDecorat(...args) {
    servei.desmunta();
    return destrueixBackend ? Reflect.apply(destrueixBackend, impl, args) : undefined;
  };

  registraServeiXifratXat(decorat, servei);
  return decorat;
}

/** Recupera només el servei associat a la implementació indicada. */
export function serveiXifratXat(impl = null) {
  return serveiXifratXatDe(impl);
}
