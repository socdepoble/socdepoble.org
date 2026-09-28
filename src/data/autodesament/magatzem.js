/* ═══════════════════════════════════════════════════════════════════
   T47 (ordre del Mestre, 260928) · MAGATZEM DE L'AUTODESAMENT

   «Totes les dades s'han de desar automàticament sense pèrdues de
   dades.» El text de la persona es guarda ací ABANS de cap petició de
   xarxa, i la cua (cua.js) només l'oblida quan el servidor confirma
   exactament eixa versió.

   Dues capes:
   · Cau en memòria, síncrona: sobreviu a desmuntar una ruta dins de la
     SPA i és la que llig l'editor en tornar, sense parpelleig.
   · IndexedDB «SdpAutodesament»: sobreviu a recàrregues i tancaments.
     Una sola connexió reutilitzada (GlobalSaveManager n'obri una a cada
     tecla) i totes les escriptures en fila, en ordre d'arribada.

   Sense IndexedDB (jsdom, navegació privada que no el deixa obrir) es
   queda en memòria i ho declara amb `persistent: false`: la interfície
   no pot dir «en este dispositiu» quan només és «en esta pestanya».

   Només hi entren els registres de la cua: cap clau d'API ni
   configuració del backend. Mai localStorage (tractor-persistencia L2).
   ═══════════════════════════════════════════════════════════════════ */

const NOM_BD = 'SdpAutodesament';
const MAGATZEM = 'registres';

/* La mateixa versió d'un camp (la còpia del disc és un clon: es compara per valor). */
const mateixaEntrada = (a, b) => a != null && b != null && a.versio === b.versio && a.valor === b.valor;

export function creaMagatzem({ idb = globalThis.indexedDB, nomBD = NOM_BD } = {}) {
  const cau = new Map();
  let disponible = Boolean(idb);
  let connexio = null;
  let cadena = Promise.resolve();
  let hidratacio = null;
  /* Mentre es llig IndexedDB, per clau, els CAMPS que esta pestanya ha escrit
     o esborrat: la lectura és més vella que ells i no els pot ressuscitar.
     T47 (correcció de la revisió, 260928) · Per camp, no per clau: una tecla
     durant la lectura descartava els altres camps d'esborrany que el registre
     tenia d'una sessió anterior (i el `put` els esborrava del disc). */
  let tocades = null;
  /* Els àmbits oblidats sencers durant la lectura (eixir): res d'ells torna. */
  let ambitsOblidats = null;

  function anotaTocats(clau, anterior, nou) {
    if (!tocades) return;
    const camps = tocades.get(clau) || new Set();
    /* Un registre sense `camps` (forma genèrica) es protegix sencer. */
    if (!anterior?.camps && !nou?.camps) camps.add('\u0000registre');
    for (const camp of Object.keys(anterior?.camps || {})) camps.add(camp);
    for (const camp of Object.keys(nou?.camps || {})) camps.add(camp);
    tocades.set(clau, camps);
  }

  /* El registre del disc, fusionat damunt del viu: només els camps que esta
     pestanya no ha tocat. null si no n'hi ha cap per recuperar. */
  function fusiona(viu, desat, tocats) {
    if (tocats.has('\u0000registre') || !desat?.camps || (viu && !viu.camps)) return null;
    const recuperats = Object.entries(desat.camps).filter(([camp]) => !tocats.has(camp) && !viu?.camps?.[camp]);
    if (!recuperats.length) return null;
    const base = viu || { ...desat, camps: {} };
    const camps = { ...Object.fromEntries(recuperats), ...base.camps };
    /* La seqüència ha de passar totes les versions: la tecla següent de
       qualsevol camp ha de ser més nova que la recuperada. */
    const seq = Math.max(Number(base.seq) || 0, Number(desat.seq) || 0,
      ...Object.values(camps).map((entrada) => Number(entrada?.versio) || 0));
    return { ...base, camps, seq };
  }

  function obri() {
    if (!disponible) return Promise.reject(new Error('Sense IndexedDB.'));
    if (connexio) return connexio;
    const oberta = new Promise((resolve, reject) => {
      let peticio;
      try { peticio = idb.open(nomBD, 1); } catch (error) { reject(error); return; }
      peticio.onupgradeneeded = () => {
        const db = peticio.result;
        if (!db.objectStoreNames.contains(MAGATZEM)) db.createObjectStore(MAGATZEM);
      };
      peticio.onsuccess = () => {
        const db = peticio.result;
        /* Una altra pestanya puja la versió: es tanca i la pròxima escriptura torna a obrir. */
        db.onversionchange = () => { db.close(); connexio = null; };
        db.onclose = () => { connexio = null; };
        resolve(db);
      };
      peticio.onerror = () => reject(peticio.error || new Error('No s’ha pogut obrir el magatzem d’esborranys.'));
      peticio.onblocked = () => reject(new Error('El magatzem d’esborranys està bloquejat.'));
    });
    connexio = oberta;
    /* Si no s'obri, el navegador no en té (o no el deixa): memòria i prou. */
    oberta.catch((error) => {
      if (connexio === oberta) connexio = null;
      if (disponible) console.warn('[autodesament] Sense IndexedDB: els esborranys es queden en esta pestanya.', error?.message || error);
      disponible = false;
    });
    return oberta;
  }

  function transaccio(mode, accio) {
    return obri().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(MAGATZEM, mode);
      let resultat;
      accio(tx.objectStore(MAGATZEM), (valor) => { resultat = valor; });
      tx.oncomplete = () => resolve(resultat);
      tx.onerror = () => reject(tx.error || new Error('Esborrany no desat.'));
      tx.onabort = () => reject(tx.error || new Error('Esborrany no desat.'));
    }));
  }

  /* En fila: l'escriptura d'una tecla vella mai no aterra damunt d'una
     de més nova. Una fallada no talla la fila ni llança: torna false. */
  function enFila(accio) {
    if (!disponible) return Promise.resolve(false);
    const pas = cadena.then(() => transaccio('readwrite', accio)).then(() => true, (error) => {
      if (disponible) console.warn('[autodesament] No s’ha pogut guardar l’esborrany en este dispositiu.', error?.message || error);
      return false;
    });
    cadena = pas;
    return pas;
  }

  function encua(clau, anterior, nou, accio) {
    anotaTocats(clau, anterior, nou);
    return enFila(accio);
  }

  /* T47 (correcció de la revisió C03, 260928) · Una escriptura d'esta pestanya
     damunt del que hi ha al DISC, dins de la mateixa transacció (llig, fusiona,
     escriu): només els camps que esta pestanya ha canviat (anterior → nou); els
     que hi ha deixat una altra pestanya es conserven. Abans, el `put` del
     registre sencer de la cau i el `delete` de la clau esborraven del disc
     l'entradilla d'una altra pestanya. Un camp que esta pestanya lleva només
     s'esborra si el disc encara té la versió que ella coneixia. La clau
     s'esborra només si el registre fusionat es queda sense camps. */
  function fusionaAlDisc(disc, anterior, nou) {
    const generic = (registre) => registre != null && !registre.camps;
    /* Un registre sense `camps` (forma genèrica) es desa sencer, com abans. */
    if (generic(nou) || generic(anterior) || generic(disc)) return nou ?? null;
    const camps = { ...(disc?.camps || {}) };
    const abans = anterior?.camps || {};
    const ara = nou?.camps || {};
    for (const camp of new Set([...Object.keys(abans), ...Object.keys(ara)])) {
      if (abans[camp] === ara[camp]) continue;
      if (Object.hasOwn(ara, camp)) camps[camp] = ara[camp];
      else if (mateixaEntrada(camps[camp], abans[camp])) delete camps[camp];
    }
    if (!Object.keys(camps).length) return null;
    const base = nou || disc;
    const seq = Math.max(Number(disc?.seq) || 0, Number(nou?.seq) || 0,
      ...Object.values(camps).map((entrada) => Number(entrada?.versio) || 0));
    return { ...base, camps, seq };
  }

  function escriuFusionant(clau, anterior, nou) {
    return (magatzem) => {
      const peticio = magatzem.get(clau);
      peticio.onsuccess = () => {
        const fusionat = fusionaAlDisc(peticio.result, anterior, nou);
        if (fusionat) magatzem.put(fusionat, clau);
        else magatzem.delete(clau);
      };
    };
  }

  return {
    /** Hi ha IndexedDB: el que es guarda sobreviu a tancar la pestanya. */
    get persistent() { return disponible; },
    llig: (clau) => cau.get(clau),
    llista: () => [...cau.values()],
    /** Síncron a la cau; la promesa diu quan (i si) ha aterrat a IndexedDB. */
    desa(clau, registre) {
      const anterior = cau.get(clau);
      cau.set(clau, registre);
      return encua(clau, anterior, registre, escriuFusionant(clau, anterior, registre));
    },
    esborra(clau) {
      const anterior = cau.get(clau);
      cau.delete(clau);
      return encua(clau, anterior, null, escriuFusionant(clau, anterior, null));
    },
    /**
     * T47 (correcció de la revisió, 260928) · Eixir: tots els registres d'un
     * àmbit fora, de la cau i del DISC, amb un cursor dins de la mateixa fila
     * d'escriptures. No depén de la cau: el que una altra pestanya o una
     * sessió anterior va deixar a IndexedDB i esta no ha llegit també se'n va.
     */
    esborraAmbit(ambit) {
      const objectiu = String(ambit ?? '');
      for (const [clau, registre] of [...cau]) {
        if (registre?.ambit === objectiu) cau.delete(clau);
      }
      if (ambitsOblidats) ambitsOblidats.add(objectiu);
      return enFila((magatzem) => {
        const cursor = magatzem.openCursor();
        cursor.onsuccess = () => {
          const actual = cursor.result;
          if (!actual) return;
          if (actual.value?.ambit === objectiu) actual.delete();
          actual.continue();
        };
      });
    },
    /** Porta a la cau el que quedava d'una sessió anterior. Una vegada; mai rebutja. */
    hidrata() {
      if (hidratacio) return hidratacio;
      if (!disponible) {
        hidratacio = Promise.resolve();
        return hidratacio;
      }
      tocades = new Map();
      ambitsOblidats = new Set();
      hidratacio = transaccio('readonly', (magatzem, torna) => {
        const trobats = [];
        const cursor = magatzem.openCursor();
        cursor.onsuccess = () => {
          const actual = cursor.result;
          if (!actual) { torna(trobats); return; }
          trobats.push([String(actual.key), actual.value]);
          actual.continue();
        };
      }).then((trobats = []) => {
        for (const [clau, registre] of trobats) {
          if (ambitsOblidats.has(registre?.ambit)) continue;
          const tocats = tocades.get(clau);
          if (!tocats) {
            if (!cau.has(clau)) cau.set(clau, registre);
            continue;
          }
          const fusionat = fusiona(cau.get(clau), registre, tocats);
          if (!fusionat) continue;
          /* El `put` d'esta pestanya ha trepitjat el disc: el fusionat hi torna. */
          cau.set(clau, fusionat);
          void enFila((magatzem) => magatzem.put(fusionat, clau));
        }
      }).catch((error) => {
        console.warn('[autodesament] No s’han pogut llegir els esborranys d’este dispositiu.', error?.message || error);
      }).finally(() => { tocades = null; ambitsOblidats = null; });
      return hidratacio;
    },
    /** Per a les proves: buida la cau i el magatzem. */
    buida() {
      cau.clear();
      hidratacio = null;
      if (!disponible) return Promise.resolve(false);
      const pas = cadena.then(() => transaccio('readwrite', (magatzem) => magatzem.clear())).then(() => true, () => false);
      cadena = pas;
      return pas;
    },
  };
}
