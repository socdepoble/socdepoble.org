/** Hidratació completa i restauració local; Supabase continua sent l'autoritat. */
import { exportaCopiaSeguretatXatAmbRebut, importaCopiaSeguretatXat, fusionaRevisioMissatge, MAX_MISSATGES, MAX_FILS } from './copiaSeguretatPortatil.js';
const falla = motiu => Object.assign(new Error(`Còpia de seguretat: ${motiu}.`), { code: 'SDP_BACKUP_RESTAURACIO_AVORTADA', codi: 'SDP_BACKUP_RESTAURACIO_AVORTADA', motiu });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const comprovaAmbitRestauracio = ({ senyal, comprovaAmbit }) => {
  if (typeof comprovaAmbit !== 'function') throw falla('falta la guarda de sessió i àmbit');
  senyal?.throwIfAborted();
  const resultat = comprovaAmbit();
  if (resultat && typeof resultat.then === 'function') {
    Promise.resolve(resultat).catch(() => {});
    throw falla('la guarda de sessió ha de ser síncrona');
  }
  if (resultat === false) throw falla('sessió o àmbit revocat');
};
const comprova = comprovaAmbitRestauracio;

/** Contracte de pàgina idèntic a loadMissatges: seq ascendent, cursor exclusiu abansDeSeq. */
export async function hidrataConversesCompletes({ fils, carregaPagina, carregaAdjunt, limit = 100, maxPagines = 10_000, senyal, comprovaAmbit } = {}) {
  if (!Array.isArray(fils) || fils.length > MAX_FILS || typeof carregaPagina !== 'function'
    || !Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(maxPagines) || maxPagines < 1 || maxPagines > 10_000) throw falla('paràmetres invàlids');
  const missatges = [], adjunts = [], idsFils = new Set();
  for (const fil of fils) {
    if (!uuid.test(fil?.id) || idsFils.has(fil.id)) throw falla('identificador de conversa invàlid o repetit');
    idsFils.add(fil.id);
    let abansDeSeq = null, acabat = false;
    const files = new Map();
    for (let pagina = 0; pagina < maxPagines; pagina++) {
      comprova({ senyal, comprovaAmbit });
      const lot = await carregaPagina(fil.id, { abansDeSeq, limit, signal: senyal });
      comprova({ senyal, comprovaAmbit });
      if (!Array.isArray(lot) || lot.length > limit) throw falla('pàgina invàlida');
      let minim = abansDeSeq ?? Infinity, anterior = 0;
      for (const m of lot) {
        if (!uuid.test(m?.id) || m.filId !== fil.id || !Number.isSafeInteger(m.seq) || m.seq <= anterior || m.seq >= (abansDeSeq ?? Infinity) || files.has(m.id)) throw falla('cursor sense progrés o missatge divergent');
        anterior = m.seq; minim = Math.min(minim, m.seq); files.set(m.id, m);
        if (files.size + missatges.length > MAX_MISSATGES) throw falla('massa missatges');
      }
      if (lot.length < limit) { acabat = true; break; }
      if (!(minim < (abansDeSeq ?? Infinity))) throw falla('paginació estancada');
      abansDeSeq = minim;
    }
    if (!acabat) throw falla('límit de pàgines; no s’exporta una còpia parcial com a completa');
    for (const m of [...files.values()].sort((a, b) => a.seq - b.seq)) {
      missatges.push(m);
      if (m.metadades?.adjunt && !m.esborratAl) {
        if (typeof carregaAdjunt !== 'function') throw falla('falta el carregador de bytes dels adjunts');
        const a = await carregaAdjunt(m, { signal: senyal });
        comprova({ senyal, comprovaAmbit });
        if (!a || a.missatgeId !== m.id || a.id !== m.metadades.adjunt.id) throw falla('adjunt absent o divergent');
        adjunts.push(a);
      }
    }
  }
  return { fils, missatges, adjunts };
}

export async function exportaConversesCompletes(opcions) {
  if (!opcions?.contrasenya || opcions.permetSenseXifrar || ['base', 'desDeSeq', 'desDeSeqPerFil', 'desDeData', 'finsAlDia'].some(k => opcions[k] != null)) throw falla('exportació completa requerix xifrat i cap tall parcial');
  const contingut = await hidrataConversesCompletes(opcions);
  comprova(opcions);
  const resultat = await exportaCopiaSeguretatXatAmbRebut({ ...opcions, ...contingut, iteracions: 600_000, permetSenseXifrar: false });
  comprova(opcions);
  return resultat;
}

const buida = () => ({ fils: {}, missatges: {}, adjunts: {}, copies: {} });
function obriIdb(indexedDB, nom) {
  if (!indexedDB?.open) return Promise.reject(falla('IndexedDB no disponible'));
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(nom, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('ambits');
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(falla('IndexedDB bloquejat per una altra finestra'));
    req.onsuccess = () => resolve(req.result);
  });
}

/** Un snapshot per compte/poble; cap credencial, clau ni autoritat remota es restaura. */
export function creaMagatzemRestauracioXat({ usuariId, tenantId, indexedDB = globalThis.indexedDB, nom = 'sdp-xat-restauracio-v1' } = {}) {
  if (!uuid.test(usuariId) || typeof tenantId !== 'string' || !tenantId || tenantId.length > 256) throw falla('àmbit invàlid');
  const ambit = JSON.stringify([tenantId, usuariId]);
  async function transaccio(mode, aplica, opcions) {
    const db = await obriIdb(indexedDB, nom);
    return new Promise((resolve, reject) => {
      let tx, valor, causa;
      const tanca = () => { opcions?.senyal?.removeEventListener('abort', enAbort); db.close(); };
      const avorta = error => {
        causa ??= error;
        try { tx.abort(); } catch { /* Si ja està en commit, oncomplete en declara el rebut confirmat. */ }
      };
      const enAbort = () => avorta(opcions.senyal.reason ?? new DOMException('Restauració avortada.', 'AbortError'));
      try {
        if (opcions) comprova(opcions);
        tx = db.transaction('ambits', mode);
        const store = tx.objectStore('ambits');
        tx.oncomplete = () => {
          tanca();
          try {
            if (causa) throw causa;
            if (opcions) comprova(opcions);
            resolve(valor);
          } catch (error) {
            reject(Object.assign(error, { commitConfirmat: mode === 'readwrite', rebut: valor }));
          }
        };
        tx.onabort = () => { tanca(); reject(causa ?? tx.error ?? falla('transacció avortada')); };
        tx.onerror = () => { causa ??= tx.error; };
        opcions?.senyal?.addEventListener('abort', enAbort, { once: true });
        if (opcions?.senyal?.aborted) { enAbort(); return; }
        const req = store.get(ambit);
        req.onerror = () => avorta(req.error);
        req.onsuccess = () => {
          try { valor = aplica(req.result ?? buida(), store, avorta); }
          catch (error) { avorta(error); }
        };
      } catch (error) {
        if (tx) avorta(error);
        else { tanca(); reject(error); }
      }
    });
  }
  return Object.freeze({
    usuariId, tenantId,
    llegix: () => transaccio('readonly', snapshot => snapshot),
    async aplica(resultat, copiesEsperades, opcions = {}) {
      return transaccio('readwrite', (snapshot, store, avorta) => {
        comprova(opcions);
        if (!resultat?.autenticada || resultat.manifest?.usuariId !== usuariId || resultat.manifest?.tenantId !== tenantId) throw falla('còpia fora d’àmbit o sense autenticar');
        if (JSON.stringify(snapshot.copies) !== JSON.stringify(copiesEsperades)) throw falla('restauració concurrent; torna-ho a provar');
        if (resultat.idempotent) return { idempotent: true, operacions: 0 };
        for (const op of resultat.operacions) {
          const clau = { fil: 'fils', missatge: 'missatges', adjunt: 'adjunts', registre_copia: 'copies' }[op.tipus];
          if (!clau || !(op.tipus === 'registre_copia' ? /^[A-Za-z0-9_-]{22}$/.test(op.id) : uuid.test(op.id))) throw falla('operació invàlida');
          const existent = snapshot[clau][op.id];
          if (op.tipus === 'missatge' && existent) {
            if (existent.filId !== op.valor.filId || existent.seq !== op.valor.seq) throw falla('UUID de missatge en conflicte');
            snapshot[clau][op.id] = fusionaRevisioMissatge(existent, op.valor);
          } else if (op.mode === 'aplica-si-mes-nou') snapshot[clau][op.id] = fusionaRevisioMissatge(existent, op.valor);
          else if (op.mode === 'insereix-si-absent' && !existent) snapshot[clau][op.id] = op.valor;
          else if (op.mode !== 'insereix-si-absent') throw falla('mode desconegut');
        }
        for (const [id, adjunt] of Object.entries(snapshot.adjunts)) {
          if (snapshot.missatges[adjunt.missatgeId]?.esborratAl) delete snapshot.adjunts[id];
        }
        comprova(opcions);
        const peticio = store.put(snapshot, ambit);
        peticio.onsuccess = () => {
          try { comprova(opcions); }
          catch (error) { avorta(error); }
        };
        peticio.onerror = () => avorta(peticio.error);
        return { idempotent: false, operacions: resultat.operacions.length };
      }, opcions);
    },
  });
}

export async function restauraCopiaSeguretat(text, { magatzem, contrasenya, cripto = globalThis.crypto, senyal, comprovaAmbit } = {}) {
  if (!magatzem?.llegix || !magatzem?.aplica || typeof contrasenya !== 'string' || !contrasenya) throw falla('magatzem o contrasenya absent');
  comprova({ senyal, comprovaAmbit });
  const snapshot = await magatzem.llegix();
  comprova({ senyal, comprovaAmbit });
  const resultat = await importaCopiaSeguretatXat(text, { usuariIdEsperat: magatzem.usuariId, tenantIdEsperat: magatzem.tenantId,
    contrasenya, estatLocal: { copies: snapshot.copies }, cripto, senyal });
  comprova({ senyal, comprovaAmbit });
  const rebut = await magatzem.aplica(resultat, snapshot.copies, { senyal, comprovaAmbit });
  return { ...rebut, backupId: resultat.rebut.backupId, fils: resultat.fils.length, missatges: resultat.missatges.length };
}
