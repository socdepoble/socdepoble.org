// @vitest-environment node
/* El magatzem del cofre xifrat (Onada 6, ordre del Mestre, 261009: cofre
   xifrat): els camins d'obertura de l'IndexedDB que cofre.test.js no toca.
   Un IDBFactory mínim escrit ací (LLEI_08 de tractors/clausura.test.js: cap
   prova dels carrils importa suport de dins de src/), que pot fallar en obrir
   (navegació privada), quedar bloquejat per una pestanya amb una versió
   anterior o rebre un versionchange. Les escriptures atòmiques i la
   comparació de la meta dins de la transacció les mira cofre.test.js amb un
   fals sencer. */
import { describe, expect, test } from 'vitest';
import { NOM_BD_COFRE, VERSIO_BD_COFRE, creaMagatzemCofre, mateixaMeta } from './magatzemCofre.js';

const despres = (fn) => setTimeout(fn, 0);

/* Una base que només sap llegir: get sobre qualsevol store torna `files[clau]`. */
function baseLectora(files = {}) {
  const bd = {
    tancada: false,
    objectStoreNames: { contains: () => true },
    close() {
      bd.tancada = true;
    },
    transaction() {
      const tx = {};
      tx.objectStore = () => ({
        get(clau) {
          const peticio = {};
          despres(() => {
            peticio.result = files[clau];
            peticio.onsuccess?.();
            despres(() => tx.oncomplete?.());
          });
          return peticio;
        }
      });
      return tx;
    }
  };
  return bd;
}

/* Un IDBFactory que respon a cada open() amb la resposta que toca (l'última es repetix). */
function fabrica(respostes) {
  const oberts = [];
  return {
    oberts,
    open(nom, versio) {
      oberts.push([nom, versio]);
      const resposta = respostes[Math.min(oberts.length - 1, respostes.length - 1)];
      const peticio = {};
      despres(() => {
        if (resposta.error) {
          peticio.error = resposta.error;
          peticio.onerror?.();
        } else if (resposta.bloquejada) {
          peticio.onblocked?.();
        } else {
          peticio.result = resposta.bd;
          peticio.onsuccess?.();
        }
      });
      return peticio;
    }
  };
}

const META = { clau: 'cofre', format: 'sdp.gestoria.cofre', v: 1, contrasenya: { sal: 'c2Fs', dek: 'ZGVr' }, recuperacio: { sal: 'c2FsMg==', dek: 'ZGVrMg==' } };

describe('obrir la base', () => {
  test('sense IndexedDB: SENSE_INDEXEDDB, i mai passa a memòria', () => {
    for (const idb of [null, {}]) {
      expect(() => creaMagatzemCofre({ idb })).toThrow(expect.objectContaining({ codi: 'SENSE_INDEXEDDB' }));
    }
  });

  test('obri la seua base i la seua versió una sola vegada; la meta torna sense la clau de la fila', async () => {
    const idb = fabrica([{ bd: baseLectora({ cofre: META }) }]);
    const m = creaMagatzemCofre({ idb });
    const meta = await m.llegixMeta();
    expect(meta).not.toHaveProperty('clau');
    expect(meta.format).toBe('sdp.gestoria.cofre');
    await m.llegixMeta();
    expect(idb.oberts).toEqual([[NOM_BD_COFRE, VERSIO_BD_COFRE]]);
  });

  test('si obrir falla (navegació privada), arriba l’error i el pròxim intent torna a obrir', async () => {
    const privada = Object.assign(new Error('La base no està disponible.'), { name: 'InvalidStateError' });
    const idb = fabrica([{ error: privada }, { bd: baseLectora() }]);
    const m = creaMagatzemCofre({ idb });
    await expect(m.llegixMeta()).rejects.toBe(privada);
    expect(await m.llegixMeta()).toBeNull();
    expect(idb.oberts).toHaveLength(2);
  });

  test('una pestanya amb una versió anterior oberta: BLOQUEJAT, i després es pot tornar a provar', async () => {
    const idb = fabrica([{ bloquejada: true }, { bd: baseLectora() }]);
    const m = creaMagatzemCofre({ idb });
    await expect(m.llegixMeta()).rejects.toEqual(expect.objectContaining({ codi: 'BLOQUEJAT' }));
    expect(await m.llegixMeta()).toBeNull();
  });

  test('versionchange: tanca la connexió i la pròxima operació n’obri una de nova', async () => {
    const bd = baseLectora({ cofre: META });
    const idb = fabrica([{ bd }]);
    const m = creaMagatzemCofre({ idb });
    await m.llegixMeta();
    bd.onversionchange();
    expect(bd.tancada).toBe(true);
    await m.llegixMeta();
    expect(idb.oberts).toHaveLength(2);
  });
});

describe('mateixaMeta', () => {
  test('compara les dues sals i els dos embolcalls; dues metes absents mai no són la mateixa', () => {
    const copia = JSON.parse(JSON.stringify(META));
    expect(mateixaMeta(META, copia)).toBe(true);
    expect(mateixaMeta(META, { ...copia, recuperacio: { ...copia.recuperacio, dek: 'YWx0cmE=' } })).toBe(false);
    expect(mateixaMeta(null, null)).toBe(false);
    expect(mateixaMeta(undefined, undefined)).toBe(false);
    expect(mateixaMeta({}, {})).toBe(false);
    expect(mateixaMeta(META, null)).toBe(false);
  });
});
