// @vitest-environment node
/* B2a (marató 261101_2143; disseny §4.4, CS-01, D-05 a) · Les `anteriors` de la
   fixació d'un contacte: els kids que una fixació ha substituït, perquè després
   d'acceptar un canvi fort de clau la història d'abans es continue obrint en
   recarregar. Camp opcional d'una fila existent (cap versió nova d'IndexedDB):
   una fila o una llibreta velles sense el camp es lligen igual; el més recent
   primer, sense el kid actiu ni repetits, com a molt 8; el mateix kid les
   conserva; una fila manipulada falla tancada. IndexedDB fals que clona amb
   structuredClone (tests/helpers/idbFalsEstructurat.js). Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';
import { MAX_ANTERIORS_FIXACIO, NOM_BD_XAT, VERSIO_BD_XAT, clauIdentitat, creaMagatzemXat } from './xifratXatMagatzem.js';

const cripto = globalThis.crypto;
const JO = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const ALTRA = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';
const TERCERA = '1b2c3d4e-5f6a-4b7c-8d8e-9f0a1b2c3d4e';
const CI = clauIdentitat({ backendId: 'supabase', endpoint: 'https://exemple.supabase.co', joId: JO });
const INICI = Date.UTC(2026, 10, 1, 22);
const ambCodi = (codi) => expect.objectContaining({ codi });
const bytes = (n) => cripto.getRandomValues(new Uint8Array(n));

function entorn() {
  const fals = creaIdbFalsEstructurat();
  const amb = () => creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => INICI });
  return { fals, obri: amb, m: amb() };
}
/* La fila tal com dorm al fals (per a manipular-la com faria algú amb el disc). */
const filaDesada = (fals, clau) => [...fals.bases.get(NOM_BD_XAT).stores.get('fixacions').files.values()]
  .find((fila) => JSON.stringify(fila.clau) === JSON.stringify(clau)).valor;

describe('anteriors de la fixació (B2a, §4.4)', () => {
  test('una fila sense canvi no porta el camp (forma vella intacta) i la versió de la base no puja', async () => {
    const { m } = entorn();
    const kid = bytes(16);
    expect(await m.fixa(CI, { usuari: ALTRA, kid })).toEqual({ usuari: ALTRA, kid, verificat: false, vistAl: INICI });
    expect(await m.fixacio(CI, ALTRA)).toEqual({ usuari: ALTRA, kid, verificat: false, vistAl: INICI });
    expect(VERSIO_BD_XAT).toBe(1);
  });

  test('un canvi amb `anterior` guarda el kid substituït; el mateix kid conserva la llista; una recàrrega la rellig', async () => {
    const { m, obri } = entorn();
    const k1 = bytes(16);
    const k2 = bytes(16);
    await m.fixa(CI, { usuari: ALTRA, kid: k1 });
    const canviada = await m.fixa(CI, { usuari: ALTRA, kid: k2 }, { anterior: k1 });
    expect(canviada).toMatchObject({ kid: k2, verificat: false });
    expect(canviada.anteriors).toEqual([k1]);
    /* La marca de verificat (mateix kid) no esborra la història. */
    const marcada = await m.fixa(CI, { usuari: ALTRA, kid: k2, verificat: true });
    expect(marcada).toMatchObject({ verificat: true, anteriors: [k1] });
    const recarregat = obri();
    expect((await recarregat.fixacio(CI, ALTRA)).anteriors).toEqual([k1]);
    expect((await recarregat.fixacions(CI))[0].anteriors).toEqual([k1]);
  });

  test('el més recent primer, sense repetits ni el kid actiu, i tallat a 8', async () => {
    const { m } = entorn();
    const kids = Array.from({ length: 11 }, () => bytes(16));
    await m.fixa(CI, { usuari: ALTRA, kid: kids[0] });
    for (let i = 1; i < kids.length; i += 1) await m.fixa(CI, { usuari: ALTRA, kid: kids[i] }, { anterior: kids[i - 1] });
    const fila = await m.fixacio(CI, ALTRA);
    expect(MAX_ANTERIORS_FIXACIO).toBe(8);
    expect(fila.kid).toEqual(kids[10]);
    expect(fila.anteriors).toEqual([kids[9], kids[8], kids[7], kids[6], kids[5], kids[4], kids[3], kids[2]]);
    /* Tornar a una clau d'abans: ix de les anteriors (és l'activa) i la substituïda hi entra davant. */
    const tornada = await m.fixa(CI, { usuari: ALTRA, kid: kids[5] }, { anterior: kids[10] });
    expect(tornada.anteriors).toEqual([kids[10], kids[9], kids[8], kids[7], kids[6], kids[4], kids[3], kids[2]]);
  });

  test('un `anterior` que no és el fixat no escriu res, tampoc les anteriors', async () => {
    const { m } = entorn();
    const k1 = bytes(16);
    await m.fixa(CI, { usuari: ALTRA, kid: k1 });
    await expect(m.fixa(CI, { usuari: ALTRA, kid: bytes(16) }, { anterior: bytes(16) })).rejects.toThrow(ambCodi('FIXACIO_CANVIADA'));
    expect(await m.fixacio(CI, ALTRA)).toEqual({ usuari: ALTRA, kid: k1, verificat: false, vistAl: INICI });
  });

  test('una llibreta vella (sense anteriors) s’importa; una de nova fa la unió sense repetir i tallada a 8', async () => {
    const origen = entorn();
    const k1 = bytes(16);
    const k2 = bytes(16);
    await origen.m.fixa(CI, { usuari: ALTRA, kid: k1 });
    await origen.m.fixa(CI, { usuari: ALTRA, kid: k2 }, { anterior: k1 });
    const foto = await origen.m.instantaniaLlibreta(CI);
    expect(foto.fixacions[0].anteriors).toEqual([k1]);

    /* Llibreta vella: la fila sense el camp entra tal qual. */
    const vell = entorn();
    const kt = bytes(16);
    expect(await vell.m.importaLlibreta(CI, { comptador: 1, fixacions: [{ usuari: TERCERA, kid: kt, verificat: false, vistAl: INICI }] }))
      .toEqual({ fixacions: 1, fils: 0, conflictes: [] });
    expect(await vell.m.fixacio(CI, TERCERA)).toEqual({ usuari: TERCERA, kid: kt, verificat: false, vistAl: INICI });

    /* Unió: el mateix kid local amb altres anteriors; les repetides i les que passen de 8 no entren. */
    const desti = entorn();
    const locals = Array.from({ length: 6 }, () => bytes(16));
    await desti.m.fixa(CI, { usuari: ALTRA, kid: locals[0] });
    for (let i = 1; i < locals.length; i += 1) await desti.m.fixa(CI, { usuari: ALTRA, kid: locals[i] }, { anterior: locals[i - 1] });
    await desti.m.fixa(CI, { usuari: ALTRA, kid: k2 }, { anterior: locals[5] });
    const abans = (await desti.m.fixacio(CI, ALTRA)).anteriors;
    expect(abans).toHaveLength(6);
    const importades = [k1, locals[5], bytes(16), bytes(16), bytes(16)];
    expect(await desti.m.importaLlibreta(CI, { comptador: 2, fixacions: [{ usuari: ALTRA, kid: k2, verificat: true, vistAl: INICI, anteriors: importades }] }))
      .toEqual({ fixacions: 1, fils: 0, conflictes: [] });
    const unida = await desti.m.fixacio(CI, ALTRA);
    expect(unida.verificat).toBe(true);
    expect(unida.anteriors).toEqual([...abans, k1, importades[2]]);
  });

  test('una llibreta amb anteriors mal formades no s’importa (DADES_INVALIDES) i res s’escriu', async () => {
    const { m } = entorn();
    const kid = bytes(16);
    for (const anteriors of [[bytes(8)], Array.from({ length: 9 }, () => bytes(16)), 'no', [null]]) {
      await expect(m.importaLlibreta(CI, { comptador: 1, fixacions: [{ usuari: ALTRA, kid, verificat: false, vistAl: INICI, anteriors }] }))
        .rejects.toThrow(ambCodi('DADES_INVALIDES'));
    }
    expect(await m.fixacio(CI, ALTRA)).toBeNull();
  });

  test('una fila manipulada al disc (anteriors de 8 bytes, massa o no llista) falla tancada amb MAGATZEM_MALMES', async () => {
    for (const anteriors of [[bytes(8)], Array.from({ length: 9 }, () => bytes(16)), 'kid', { 0: bytes(16) }]) {
      const { m, fals } = entorn();
      const k1 = bytes(16);
      await m.fixa(CI, { usuari: ALTRA, kid: k1 });
      await m.fixa(CI, { usuari: ALTRA, kid: bytes(16) }, { anterior: k1 });
      filaDesada(fals, [CI, ALTRA]).anteriors = anteriors;
      await expect(m.fixacio(CI, ALTRA)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
      await expect(m.fixacions(CI)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
      await expect(m.fixa(CI, { usuari: ALTRA, kid: bytes(16) })).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    }
  });
});
