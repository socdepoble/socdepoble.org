/**
 * magatzem.js — on es guarden les aprovacions i les claus públiques WebAuthn.
 *
 * Cap dada personal: registres d'aprovació (empremtes, dates, nonces) i claus
 * públiques. Només afegir: un registre no es reescriu mai (la revocació és un
 * registre nou). `esborraTot` és per a desenxufar la porta sencera.
 */
import { base64url, desdeBase64url, jsonCanonic } from './canonic.js';
import { instantDe, ordenaRegistres, validaRegistre } from './registre.js';

export const VERSIO_BD = 1;
const MAGATZEM_REGISTRES = 'registres';
const MAGATZEM_CLAUS = 'claus';
const CAMPS_CLAU = Object.freeze(['credencial', 'jwk', 'creat', 'etiqueta']);

function base64urlCanonic(text, longitud) {
  if (typeof text !== 'string' || !text) return false;
  try {
    const bytes = desdeBase64url(text);
    return base64url(bytes) === text && (longitud === undefined || bytes.length === longitud);
  } catch {
    return false;
  }
}

export function validaClau(clau) {
  if (clau === null || typeof clau !== 'object' || Array.isArray(clau)) return ['La clau ha de ser un objecte.'];
  const errors = [];
  for (const camp of Object.keys(clau)) {
    if (!CAMPS_CLAU.includes(camp)) errors.push(`Camp desconegut: «${camp}».`);
  }
  if (!base64urlCanonic(clau.credencial)) errors.push('credencial ha de ser base64url.');
  const jwk = clau.jwk;
  const jwkValida = jwk !== null && typeof jwk === 'object'
    && Object.keys(jwk).every((camp) => ['kty', 'crv', 'x', 'y'].includes(camp))
    && jwk.kty === 'EC' && jwk.crv === 'P-256' && base64urlCanonic(jwk.x, 32) && base64urlCanonic(jwk.y, 32);
  if (!jwkValida) errors.push('jwk ha de ser una clau pública EC P-256.');
  if (typeof clau.creat !== 'string' || !Number.isFinite(instantDe(clau.creat))) errors.push('creat ha de ser una data ISO en UTC.');
  if (typeof clau.etiqueta !== 'string' || !clau.etiqueta.trim()) errors.push('etiqueta és obligatòria.');
  return errors;
}

function comprova(errors, que) {
  if (errors.length) throw new TypeError(`${que} invàlid: ${errors.join(' ')}`);
}

function copia(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function ordenaClaus(claus) {
  return [...claus].sort((a, b) => instantDe(a.creat) - instantDe(b.creat));
}

function filtraTractor(registres, tractorId) {
  return tractorId === undefined ? registres : registres.filter((r) => r?.tractor === tractorId);
}

const errorDuplicat = (que) => new Error(`${que} ja existix: el magatzem només admet afegir, mai sobreescriure.`);

/* Una línia JSON canònica per element: primer les claus, després els registres. */
function exportaJsonl(claus, registres) {
  const linies = [
    ...ordenaClaus(claus).map((valor) => jsonCanonic({ tipus: 'clau', valor })),
    ...ordenaRegistres(registres).map((valor) => jsonCanonic({ tipus: 'registre', valor }))
  ];
  return linies.length ? `${linies.join('\n')}\n` : '';
}

export function crearMagatzemMemoria() {
  let registres = [];
  let claus = [];
  return {
    tipus: 'memoria',
    persistent: false,
    async registres(tractorId) {
      return ordenaRegistres(filtraTractor(registres, tractorId)).map(copia);
    },
    async afegixRegistre(registre) {
      comprova(validaRegistre(registre), 'Registre d\'aprovació');
      if (registres.some((r) => r.nonce === registre.nonce)) throw errorDuplicat('El registre');
      registres.push(copia(registre));
    },
    async claus() {
      return ordenaClaus(claus).map(copia);
    },
    async afegixClau(clau) {
      comprova(validaClau(clau), 'Clau');
      if (claus.some((c) => c.credencial === clau.credencial)) throw errorDuplicat('La clau');
      claus.push(copia(clau));
    },
    async exporta() {
      return exportaJsonl(claus, registres);
    },
    async esborraTot() {
      registres = [];
      claus = [];
    },
    tanca() {}
  };
}

export function crearMagatzemIndexedDB({ nom = 'sdp-aprovacions', idb = globalThis.indexedDB } = {}) {
  if (!idb || typeof idb.open !== 'function') {
    throw new Error('Aquest navegador no oferix IndexedDB: les aprovacions no es poden desar de manera persistent.');
  }
  let connexio = null;

  const obri = () => {
    if (!connexio) {
      connexio = new Promise((resol, rebutja) => {
        const peticio = idb.open(nom, VERSIO_BD);
        peticio.onupgradeneeded = () => {
          const bd = peticio.result;
          if (!bd.objectStoreNames.contains(MAGATZEM_REGISTRES)) bd.createObjectStore(MAGATZEM_REGISTRES, { keyPath: 'nonce' });
          if (!bd.objectStoreNames.contains(MAGATZEM_CLAUS)) bd.createObjectStore(MAGATZEM_CLAUS, { keyPath: 'credencial' });
        };
        peticio.onsuccess = () => {
          const bd = peticio.result;
          bd.onversionchange = () => {
            bd.close();
            connexio = null;
          };
          resol(bd);
        };
        peticio.onerror = () => rebutja(peticio.error ?? new Error('No s\'ha pogut obrir IndexedDB.'));
        peticio.onblocked = () => rebutja(new Error('IndexedDB està bloquejada per una altra pestanya de l\'app.'));
      });
      connexio.catch(() => {
        connexio = null;
      });
    }
    return connexio;
  };

  /* Resol quan la transacció es completa, no quan acaba la petició. */
  const opera = async (magatzems, mode, accio) => {
    const bd = await obri();
    return new Promise((resol, rebutja) => {
      const tx = bd.transaction(magatzems, mode);
      let resultat;
      tx.oncomplete = () => resol(resultat);
      tx.onerror = () => rebutja(tx.error ?? new Error('Error d\'IndexedDB.'));
      tx.onabort = () => rebutja(tx.error ?? new Error('Transacció d\'IndexedDB avortada.'));
      const peticio = accio(tx);
      if (peticio) {
        peticio.onsuccess = () => {
          resultat = peticio.result;
        };
      }
    });
  };

  const afegix = async (magatzem, valor, que) => {
    try {
      await opera([magatzem], 'readwrite', (tx) => tx.objectStore(magatzem).add(copia(valor)));
    } catch (error) {
      if (error?.name === 'ConstraintError') throw errorDuplicat(que);
      throw error;
    }
  };

  const totsDe = (magatzem) => opera([magatzem], 'readonly', (tx) => tx.objectStore(magatzem).getAll());

  return {
    tipus: 'indexeddb',
    persistent: true,
    /* true si la base s'obri; false si el navegador no la deixa obrir. No llança mai. */
    async disponible() {
      try {
        await obri();
        return true;
      } catch {
        return false;
      }
    },
    async registres(tractorId) {
      return ordenaRegistres(filtraTractor((await totsDe(MAGATZEM_REGISTRES)) ?? [], tractorId));
    },
    async afegixRegistre(registre) {
      comprova(validaRegistre(registre), 'Registre d\'aprovació');
      await afegix(MAGATZEM_REGISTRES, registre, 'El registre');
    },
    async claus() {
      return ordenaClaus((await totsDe(MAGATZEM_CLAUS)) ?? []);
    },
    async afegixClau(clau) {
      comprova(validaClau(clau), 'Clau');
      await afegix(MAGATZEM_CLAUS, clau, 'La clau');
    },
    async exporta() {
      return exportaJsonl((await totsDe(MAGATZEM_CLAUS)) ?? [], (await totsDe(MAGATZEM_REGISTRES)) ?? []);
    },
    async esborraTot() {
      await opera([MAGATZEM_REGISTRES, MAGATZEM_CLAUS], 'readwrite', (tx) => {
        tx.objectStore(MAGATZEM_REGISTRES).clear();
        tx.objectStore(MAGATZEM_CLAUS).clear();
      });
    },
    tanca() {
      if (connexio) connexio.then((bd) => bd.close(), () => {});
      connexio = null;
    }
  };
}

/* IndexedDB si el navegador la deixa obrir; si no n'hi ha, o si open() falla
   (també més tard, de manera asíncrona: finestra privada, permisos, una
   altra pestanya que la bloqueja), memòria amb persistent: false, i la UI ho
   ha d'avisar. És la política del progrés d'Aprendre
   (gestoria/aprendre/magatzemProgres.js): el pas a memòria és per a tota la
   sessió. Un error d'una transacció amb la base ja oberta es propaga i no
   canvia de magatzem. Fail-closed: la memòria comença buida, sense cap
   aprovació. */
export function crearMagatzem({ nom, idb = globalThis.indexedDB } = {}) {
  if (!idb || typeof idb.open !== 'function') return crearMagatzemMemoria();
  const disc = crearMagatzemIndexedDB({ nom, idb });
  const memoria = crearMagatzemMemoria();
  let actiu = disc;

  const tria = async () => {
    if (actiu === disc && !(await disc.disponible())) {
      actiu = memoria;
      disc.tanca();
    }
    return actiu;
  };

  return {
    get tipus() {
      return actiu.tipus;
    },
    get persistent() {
      return actiu.persistent;
    },
    async registres(tractorId) {
      return (await tria()).registres(tractorId);
    },
    async afegixRegistre(registre) {
      return (await tria()).afegixRegistre(registre);
    },
    async claus() {
      return (await tria()).claus();
    },
    async afegixClau(clau) {
      return (await tria()).afegixClau(clau);
    },
    async exporta() {
      return (await tria()).exporta();
    },
    async esborraTot() {
      return (await tria()).esborraTot();
    },
    tanca() {
      disc.tanca();
    }
  };
}
