// src/data/frontissa/local/idb.js
// Article 2 de la Llei de l'Enxufabilitat: este és l'ÚNIC lloc del projecte
// amb dret a parlar amb window.indexedDB. La regla dura d'ESLint
// (no-restricted-globals sobre indexedDB/IDBKeyRange) ho fa complir a la resta.
// Tot és promès: cap consumidor tornarà a escriure callbacks d'IDB.
// Minimalista deliberadament; per a pujar de versió d'esquema en calent, recarrega.

const BASES = new Map(); // nom -> { versio, promesa }

/** Declara (i obri) una base amb el seu esquema. Idempotent.
 *  botigues: [{ nom, keyPath?, autoIncrement?, indexes?: { nomIndex: clau } }] */
export function defineixBase(nom, versio, botigues = []) {
  const existent = BASES.get(nom);
  if (existent) {
    if (existent.versio !== versio) {
      throw new Error(`idb: «${nom}» ja és definida amb versió ${existent.versio}, no ${versio}.`);
    }
    return existent.promesa;
  }
  const promesa = new Promise((Completa, Falla) => {
    const peticio = indexedDB.open(nom, versio);
    peticio.onupgradeneeded = (e) => {
      const base = e.target.result;
      for (const b of botigues) {
        if (base.objectStoreNames.contains(b.nom)) continue;
        const magatzem = base.createObjectStore(b.nom, {
          keyPath: b.keyPath,
          autoIncrement: Boolean(b.autoIncrement),
        });
        for (const [nomIndex, clau] of Object.entries(b.indexes ?? {})) {
          magatzem.createIndex(nomIndex, clau);
        }
      }
    };
    peticio.onsuccess = () => Completa(peticio.result);
    peticio.onerror = () => Falla(peticio.error);
  });
  BASES.set(nom, { versio, promesa });
  return promesa;
}

async function botiga(nomBase, nomBotiga, mode) {
  const declarada = BASES.get(nomBase);
  if (!declarada) throw new Error(`idb: base «${nomBase}» no declarada. Crida defineixBase() primer.`);
  const base = await declarada.promesa;
  return base.transaction(nomBotiga, mode).objectStore(nomBotiga);
}

function comAPromesa(peticio) {
  return new Promise((Completa, Falla) => {
    peticio.onsuccess = () => Completa(peticio.result);
    peticio.onerror = () => Falla(peticio.error);
  });
}

/** Llig un registre per clau. Retorna undefined si no hi és. */
export async function obte(nomBase, nomBotiga, clau) {
  const m = await botiga(nomBase, nomBotiga, 'readonly');
  return comAPromesa(m.get(clau));
}

/** Escriu (inserir o substituir). Si la botiga no té keyPath, cal la clau. */
export async function posa(nomBase, nomBotiga, valor, clau) {
  const m = await botiga(nomBase, nomBotiga, 'readwrite');
  return comAPromesa(clau === undefined ? m.put(valor) : m.put(valor, clau));
}

export async function esborra(nomBase, nomBotiga, clau) {
  const m = await botiga(nomBase, nomBotiga, 'readwrite');
  return comAPromesa(m.delete(clau));
}

export async function esborraTot(nomBase, nomBotiga) {
  const m = await botiga(nomBase, nomBotiga, 'readwrite');
  return comAPromesa(m.clear());
}

/** Tots els registres d'una botiga, en ordre de clau. */
export async function tots(nomBase, nomBotiga) {
  const m = await botiga(nomBase, nomBotiga, 'readonly');
  return comAPromesa(m.getAll());
}

/** Cerca per índex (valor exacte o rang IDBKeyRange). */
export async function perIndex(nomBase, nomBotiga, nomIndex, valor) {
  const m = await botiga(nomBase, nomBotiga, 'readonly');
  return comAPromesa(m.index(nomIndex).getAll(valor));
}

/** Recorregut amb cursor i filtre. Retorna un array. */
export async function recorre(nomBase, nomBotiga, filtre = () => true) {
  const m = await botiga(nomBase, nomBotiga, 'readonly');
  return new Promise((Completa, Falla) => {
    const resultat = [];
    const cursor = m.openCursor();
    cursor.onsuccess = () => {
      const actual = cursor.result;
      if (!actual) return Completa(resultat);
      if (filtre(actual.value)) resultat.push(actual.value);
      actual.continue();
    };
    cursor.onerror = () => Falla(cursor.error);
  });
}
