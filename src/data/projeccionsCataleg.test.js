import { describe, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaIdbFals } from '../utils/__fixtures__/navegadorFals.js';
import { capturaAbastProjeccions, capturaDestinsCataleg, capturaFontCataleg, idPublicacioProjeccio,
  itemWorkspaceDeProjeccio, payloadProjeccioCataleg, perDestiCataleg, projeccioCatalegDe, rutaDeFitxaCataleg } from './projeccionsCataleg.js';
import { creaServeiProjeccionsCataleg, filesDeRegistreProjeccio, registreProjeccioPendent } from './projeccionsCatalegServei.js';

const OWNER = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', ALTRE = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d';
const SCOPE = { tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', ownerId: OWNER, backendId: 'node-local:actor-persona' };
const FONT = { font: 'herbari', id: 'timus', title: 'Timonet', subtitle: 'Thymus vulgaris', lead: 'Fitxa literal' };
const crea = extra => creaServeiProjeccionsCataleg({ abast: SCOPE, idb: null, navegador: null, Canal: null, subtil: webcrypto.subtle, ...extra });
const publicador = () => vi.fn(async sub => structuredClone(sub));

describe('P0-59 · contracte de referència i autoritat', () => {
  test('R18 · cada destinació del WP reutilitza una referència pública amb identitat estable', async () => {
    const font = { font: 'importacio-wp', id: '619', title: 'Catàleg d’arbres', subtitle: 'socdepoble.net · WP #619', lead: '' };
    const publica = publicador(), servei = crea({ publica }); await servei.prepara();
    const ids = new Set();
    for (const desti of ['mur', 'arbres-monumentals', 'herbari', 'receptes', 'pagina']) {
      await servei.desa(font, [desti]); await servei.sincronitza();
      const sub = publica.mock.calls.at(-1)[0];
      ids.add(sub.id);
      expect(sub.sectionId).toBe('mur');
      expect(sub.payload.destinacio_workspace).toBe(desti);
      expect(sub.payload.content).toBeUndefined();
      const row = { id: sub.id, ownerUserId: OWNER, sectionId: sub.sectionId, ...sub.payload };
      expect(perDestiCataleg([row], desti)).toEqual([row]);
      expect(rutaDeFitxaCataleg(projeccioCatalegDe(row).font)).toBe('/mur/619');
    }
    expect(ids.size).toBe(1);
    expect(rutaDeFitxaCataleg(FONT)).toBe('/page/herbari?fitxa=timus');
    for (const destins of [['mercat'], ['bar'], ['mur', 'herbari']]) {
      await expect(servei.desa(font, destins)).rejects.toMatchObject({ codi: 'projeccio-invalida' });
    }
    const getter = vi.fn();
    expect(rutaDeFitxaCataleg(Object.defineProperty({ ...font }, 'id', { get: getter, enumerable: true }))).toBeNull();
    expect(getter).not.toHaveBeenCalled();
    expect(rutaDeFitxaCataleg({ ...font, id: '../notes' })).toBeNull();
    const payload = payloadProjeccioCataleg({ font, destins: ['herbari'], audiencia: 'publica' });
    expect(projeccioCatalegDe({ id: ALTRE, ownerUserId: OWNER, sectionId: 'mur', ...payload, destinacio_workspace: 'receptes' })).toBeNull();
    servei.tanca();
  });
  test('cap camp privat, import, foto ni propietat amb getter arriba al payload', () => {
    expect(capturaFontCataleg(FONT)).toEqual(FONT);
    for (const extra of [{ imageUrl: '/privada.jpg' }, { dades: {} }, { preuCents: 105 }, { ownerId: ALTRE }]) expect(() => capturaFontCataleg({ ...FONT, ...extra })).toThrow();
    const getter = vi.fn(); expect(() => capturaFontCataleg(Object.defineProperty({ ...FONT }, 'title', { get: getter, enumerable: true }))).toThrow(); expect(getter).not.toHaveBeenCalled();
    expect(() => capturaDestinsCataleg(['mur', 'mur'])).toThrow();
    expect(() => capturaDestinsCataleg(['inventat'])).toThrow();
    expect(() => capturaFontCataleg({ ...FONT, id: '../altra' })).toThrow();
    expect(() => capturaFontCataleg({ ...FONT, title: '\ud800' })).toThrow();
    expect(() => capturaAbastProjeccions({ ...SCOPE, ownerId: null })).toThrow();
    const coercio = vi.fn(() => OWNER); expect(() => capturaAbastProjeccions({ ...SCOPE, ownerId: { toString: coercio } })).toThrow(); expect(coercio).not.toHaveBeenCalled();
  });
  test('la selecció pública i privada no es poden barrejar en una mateixa fila', () => {
    expect(() => payloadProjeccioCataleg({ font: FONT, destins: ['bar'], audiencia: 'publica' })).toThrow();
    expect(() => payloadProjeccioCataleg({ font: FONT, destins: ['mur'], audiencia: 'privada' })).toThrow();
    expect(capturaDestinsCataleg(['llavors', 'mur'])).toEqual(['mur', 'llavors']);
  });
  test('els UUID són estables, separats per poble, compte, backend i audiència', async () => {
    const first = await idPublicacioProjeccio(SCOPE, FONT, 'publica', webcrypto.subtle);
    expect(first).toBe(await idPublicacioProjeccio(SCOPE, { ...FONT, title: 'Nou títol' }, 'publica', webcrypto.subtle));
    const variants = await Promise.all([
      idPublicacioProjeccio(SCOPE, FONT, 'privada', webcrypto.subtle),
      idPublicacioProjeccio({ ...SCOPE, ownerId: ALTRE }, FONT, 'publica', webcrypto.subtle),
      idPublicacioProjeccio({ ...SCOPE, backendId: 'altre-node' }, FONT, 'publica', webcrypto.subtle),
      idPublicacioProjeccio({ ...SCOPE, tenantId: ALTRE }, FONT, 'publica', webcrypto.subtle)
    ]);
    expect(new Set([first, ...variants]).size).toBe(5);
  });
  test('els filtres respecten destins, revocació, compte privat i estat pendent local', () => {
    const publicRow = { id: ALTRE, ownerUserId: OWNER, sectionId: 'mur', ...payloadProjeccioCataleg({ font: FONT, destins: ['mur', 'herbari'], audiencia: 'publica' }) };
    expect(perDestiCataleg([publicRow], 'mur')).toEqual([publicRow]);
    expect(perDestiCataleg([publicRow], 'receptes')).toEqual([]);
    expect(perDestiCataleg([{ ...publicRow, _projeccioLocal: true }], 'mur')).toEqual([]);
    expect(perDestiCataleg([{ ...publicRow, _projeccioLocal: true }], 'mur', { ownerId: OWNER })).toHaveLength(1);
    const privateRow = { ...publicRow, sectionId: 'notes', ...payloadProjeccioCataleg({ font: FONT, destins: ['bar', 'rebost'], audiencia: 'privada' }) };
    expect(perDestiCataleg([privateRow], 'bar')).toEqual([]);
    expect(perDestiCataleg([privateRow], 'bar', { ownerId: ALTRE })).toEqual([]);
    expect(perDestiCataleg([privateRow], 'bar', { ownerId: OWNER })).toEqual([privateRow]);
    expect(projeccioCatalegDe({ ...privateRow, sectionId: 'mur' })).toBeNull();
    expect(perDestiCataleg([{ ...publicRow, projeccioCataleg: { ...publicRow.projeccioCataleg, destins: [] } }], 'mur')).toEqual([]);
    expect(perDestiCataleg([publicRow, { ...publicRow, projeccioCataleg: { ...publicRow.projeccioCataleg, destins: [] } }], 'mur')).toEqual([]);
    expect(itemWorkspaceDeProjeccio(publicRow)).toMatchObject({ title: FONT.title, subtitle: FONT.subtitle, lead: FONT.lead, projeccio: { font: FONT } });
  });
});

describe('P0-59 · cua durable de publicació', () => {
  test('desa abans de xarxa; dos ACK, una referència per audiència i retry idempotent', async () => {
    const publica = publicador(), servei = crea({ publica }); await servei.prepara();
    const row = await servei.desa(FONT, ['mur', 'bar']);
    expect(publica).not.toHaveBeenCalled(); expect(registreProjeccioPendent(row)).toBe(true);
    await servei.sincronitza();
    expect(publica).toHaveBeenCalledTimes(2);
    expect(publica.mock.calls.map(([sub]) => sub.sectionId)).toEqual(['notes', 'mur']);
    expect(registreProjeccioPendent((await servei.llista())[0])).toBe(false);
    await servei.sincronitza(); expect(publica).toHaveBeenCalledTimes(2);
    await servei.desa(FONT, ['receptes']); await servei.sincronitza();
    expect(publica.mock.calls[2][0].id).toBe(publica.mock.calls[0][0].id);
    expect(publica.mock.calls[3][0].id).toBe(publica.mock.calls[1][0].id);
    expect(filesDeRegistreProjeccio((await servei.llista())[0], SCOPE).flatMap(item => item.projeccioCataleg.destins)).toEqual(['receptes']);
    servei.tanca();
  });
  test('una font només del Bar/Rebost no filtra ni el seu id al Mur', async () => {
    const publica = publicador(), servei = crea({ publica }); await servei.prepara();
    await servei.desa({ ...FONT, font: 'bar', title: 'Carta privada' }, ['bar', 'rebost']); await servei.sincronitza();
    expect(publica).toHaveBeenCalledTimes(1); expect(publica.mock.calls[0][0].sectionId).toBe('notes');
    expect(registreProjeccioPendent((await servei.llista())[0])).toBe(false); servei.tanca();
  });
  test('un ACK parcial continua pendent, recarrega d’IndexedDB i només reintenta la fila no confirmada', async () => {
    const idb = creaIdbFals().idb, publica = publicador();
    publica.mockImplementationOnce(async sub => structuredClone(sub)).mockRejectedValueOnce(new Error('sense connexió'));
    const first = crea({ idb, publica }); await first.prepara(); await first.desa(FONT, ['mur', 'rebost']);
    await expect(first.sincronitza()).rejects.toThrow('sense connexió');
    const partial = (await first.llista())[0]; expect(partial.confirmacions).toEqual({ privada: 1, publica: 0 }); expect(first.persistent).toBe(true); first.tanca();
    const next = crea({ idb, publica }); await next.prepara(); await next.sincronitza();
    expect(publica).toHaveBeenCalledTimes(3); expect(publica.mock.calls[2][0]).toEqual(publica.mock.calls[1][0]);
    expect(registreProjeccioPendent((await next.llista())[0])).toBe(false); next.tanca();
    const alien = crea({ idb, abast: { ...SCOPE, ownerId: ALTRE }, publica }); await alien.prepara(); expect(await alien.llista()).toEqual([]); alien.tanca();
  });
  test('revocar després d’un POST incert envia tombstone al mateix UUID sense metadades noves privades', async () => {
    const publica = publicador(), servei = crea({ publica }); await servei.prepara();
    publica.mockImplementationOnce(async sub => structuredClone(sub)).mockRejectedValueOnce(new Error('resposta perduda'));
    await servei.desa(FONT, ['mur']); await expect(servei.sincronitza()).rejects.toThrow();
    await servei.desa({ ...FONT, title: 'Ara és privat' }, []); await servei.sincronitza();
    const mur = publica.mock.calls.filter(([s]) => s.sectionId === 'mur').map(([s]) => s);
    expect(mur.at(-1).payload.projeccioCataleg.destins).toEqual([]); expect(mur.at(-1).payload.title).toBe('Publicació retirada'); servei.tanca();
  });
  test('una edició mentre arriba l’ACK no queda marcada com la versió vella', async () => {
    let allibera; const pending = new Promise(resolve => { allibera = resolve; });
    const publica = publicador(); publica.mockImplementationOnce(async sub => { await pending; return sub; });
    const servei = crea({ publica }); await servei.prepara(); await servei.desa(FONT, ['mur']);
    const sync = servei.sincronitza(); await vi.waitFor(() => expect(publica).toHaveBeenCalledTimes(1));
    await servei.desa(FONT, ['herbari']); allibera(); await sync;
    const row = (await servei.llista())[0]; expect(row.seq).toBe(2); expect(registreProjeccioPendent(row)).toBe(false);
    expect(publica.mock.calls.at(-1)[0].payload.projeccioCataleg.destins).toEqual(['herbari']); servei.tanca();
  });
  test('sessió canviada, magatzem tancat o resposta mentidera no acrediten publicació', async () => {
    let sessio = true; const publica = publicador();
    const servei = crea({ publica, comprovaSessio: () => { if (!sessio) throw new DOMException('canvi', 'AbortError'); } });
    await servei.prepara(); await servei.desa(FONT, ['mur']); sessio = false;
    await expect(servei.sincronitza()).rejects.toMatchObject({ name: 'AbortError' }); expect(publica).not.toHaveBeenCalled(); servei.tanca();
    const mentida = crea({ publica: async sub => ({ ...sub, id: ALTRE }) }); await mentida.prepara(); await mentida.desa(FONT, ['mur']);
    await expect(mentida.sincronitza()).rejects.toMatchObject({ codi: 'confirmacio-invalida' }); expect(registreProjeccioPendent((await mentida.llista())[0])).toBe(true); mentida.tanca();
    await expect(mentida.llista()).rejects.toMatchObject({ name: 'AbortError' });
  });
});
