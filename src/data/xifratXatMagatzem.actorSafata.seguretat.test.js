// @vitest-environment node
/* QA-E07 / E2EE-C03: actor explícit de safata, sense dividir la identitat.
   Dades sintètiques, IndexedDB fals estructurat i AES-GCM de Node. */
import { describe, expect, test } from 'vitest';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';
import { clauIdentitat, creaMagatzemXat, NOM_BD_XAT, SAFATA } from './xifratXatMagatzem.js';

const cripto = globalThis.crypto;
const JO = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const ALTRA = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';
const ENTITAT = '9b2d5f1e-3c4a-4e8b-9d6f-1a2b3c4d5e6f';
const FIL = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const ID_A = '00000000-0000-4000-8000-000000000001';
const ID_B = '00000000-0000-4000-8000-000000000002';
const actorA = `persona::${JO}`;
const actorB = `entitat::${ENTITAT}`;
const ci = (joId = JO) => clauIdentitat({ backendId: 'supabase', endpoint: 'https://exemple.supabase.co', joId });
const CI = ci();
const errorDades = expect.objectContaining({ codi: 'DADES_INVALIDES' });
function entorn() {
  const fals = creaIdbFalsEstructurat();
  const comptador = { decrypt: 0 };
  const criptoDe = {
    getRandomValues: (v) => cripto.getRandomValues(v),
    subtle: {
      generateKey: (...args) => cripto.subtle.generateKey(...args),
      encrypt: (...args) => cripto.subtle.encrypt(...args),
      decrypt: (...args) => { comptador.decrypt += 1; return cripto.subtle.decrypt(...args); }
    }
  };
  const obri = (idb = fals) => creaMagatzemXat({ idb, rangs: fals.IDBKeyRange, cripto: criptoDe, ClasseClau: globalThis.CryptoKey, ara: () => 1793318400000 });
  const fila = (id) => [...fals.bases.get(NOM_BD_XAT).stores.get(SAFATA).files.values()]
    .find((f) => JSON.stringify(f.clau) === JSON.stringify([CI, 'missatge', id])).valor;
  return { fals, obri, fila, comptador, m: obri() };
}
const desa = (m, actor, id = ID_A, contingut = { text: id }) => m.desaASafata(CI, { fil: FIL, id, actor, contingut });

describe('safata amb actor explícit', () => {
  test('control: dos actors compartixen la mateixa clauIdentitat, sense actor a la clau primària', () => {
    expect(ci()).toBe(JSON.stringify(['supabase', 'https://exemple.supabase.co', JO]));
    expect(ci()).not.toBe(ci(ALTRA));
  });

  test('cada lectura torna únicament l’actor demanat; el resum identifica l’actor', async () => {
    const { m } = entorn();
    expect(await desa(m, actorA)).toMatchObject({ actor: actorA, id: ID_A });
    await desa(m, actorB, ID_B);
    expect((await m.safata(CI, actorA)).map((e) => [e.actor, e.id])).toEqual([[actorA, ID_A]]);
    expect((await m.safata(CI, actorB)).map((e) => [e.actor, e.id])).toEqual([[actorB, ID_B]]);
    expect(await m.safata(ci(ALTRA), actorA)).toEqual([]);
  });

  test('llegir un altre actor no intenta desxifrar els missatges ocults ni els esborra', async () => {
    const { m, fals, comptador } = entorn();
    await desa(m, actorA);
    comptador.decrypt = 0;
    expect(await m.safata(CI, actorB)).toEqual([]);
    expect(comptador.decrypt).toBe(0);
    expect(fals.files(NOM_BD_XAT, SAFATA).filter((f) => f.clau[1] === 'missatge')).toHaveLength(1);
    expect((await m.safata(CI, actorA))[0].contingut).toEqual({ text: ID_A });
  });

  test('l’actor és a la fila i a l’AAD: reetiquetar-lo no revela el contingut', async () => {
    const { m, fila } = entorn();
    await desa(m, actorA);
    expect(fila(ID_A).actor).toBe(actorA);
    fila(ID_A).actor = actorB;
    expect(await m.safata(CI, actorA)).toEqual([]);
    expect(await m.safata(CI, actorB)).toEqual([expect.objectContaining({ actor: actorB, id: ID_A, contingut: null, malmes: true })]);
  });

  test('contingut.actor no substituïx l’actor explícit del context', async () => {
    const { m } = entorn();
    await desa(m, actorA, ID_A, { actor: actorB, text: 'prova' });
    expect(await m.safata(CI, actorB)).toEqual([]);
    expect((await m.safata(CI, actorA))[0]).toMatchObject({ actor: actorA, contingut: { actor: actorB } });
  });

  test.each([undefined, null, '', ' ', ` ${actorA}`, `${actorA} `, `${actorA}\u0000altre`, `${actorA}\ud800`, `${actorA}\udc00`, 3, {}])('actor invàlid %j falla abans d’obrir IndexedDB', async (actor) => {
    const { m, fals } = entorn();
    await expect(desa(m, actor)).rejects.toThrow(errorDades);
    await expect(m.safata(CI, actor)).rejects.toThrow(errorDades);
    await expect(m.treuDeSafata(CI, ID_A, actor)).rejects.toThrow(errorDades);
    expect(fals.bases.size).toBe(0);
  });

  test('una altra instància i una altra pestanya conserven el filtre sense canviar la clau de repòs', async () => {
    const { m, fals, obri } = entorn();
    await desa(m, actorA);
    const altra = obri(fals.pestanya());
    await desa(altra, actorB, ID_B);
    for (const servei of [obri(), altra]) {
      expect((await servei.safata(CI, actorA)).map((e) => e.id)).toEqual([ID_A]);
      expect((await servei.safata(CI, actorB)).map((e) => e.id)).toEqual([ID_B]);
    }
    expect(fals.files(NOM_BD_XAT, SAFATA).map((f) => f.clau)).toEqual([[CI, 'clau'], [CI, 'missatge', ID_A], [CI, 'missatge', ID_B]]);
  });

  test('un actor no pot descartar una entrada d’un altre actor', async () => {
    const { m } = entorn();
    await desa(m, actorB);
    expect(await m.treuDeSafata(CI, ID_A, actorA)).toBe(false);
    expect((await m.safata(CI, actorB)).map((e) => e.id)).toEqual([ID_A]);
    expect(await m.treuDeSafata(CI, ID_A, actorB)).toBe(true);
    expect(await m.safata(CI, actorB)).toEqual([]);
  });

  test('l’id continua sent únic per persona encara que els actors siguen diferents', async () => {
    const { m } = entorn();
    await desa(m, actorA);
    await expect(desa(m, actorB)).rejects.toThrow(expect.objectContaining({ codi: 'SAFATA_DUPLICADA' }));
    expect((await m.safata(CI, actorA)).map((e) => e.id)).toEqual([ID_A]);
    expect(await m.safata(CI, actorB)).toEqual([]);
  });

  test('una fila antiga sense actor no s’atribuïx al context vigent i es purga com a trencada', async () => {
    const { m, fila, fals } = entorn();
    await desa(m, actorA);
    delete fila(ID_A).actor;
    expect(await m.safata(CI, actorA)).toEqual([]);
    expect(await m.safata(CI, actorB)).toEqual([]);
    expect(fals.files(NOM_BD_XAT, SAFATA).map((f) => f.clau)).toEqual([[CI, 'clau']]);
  });

  test('eixir encara buida els missatges de tots els actors de la persona', async () => {
    const { m, fals } = entorn();
    await desa(m, actorA);
    await desa(m, actorB, ID_B);
    await m.oblidaEnTancar(CI, { mantenSessio: true });
    expect(fals.files(NOM_BD_XAT, SAFATA)).toEqual([]);
  });
});
