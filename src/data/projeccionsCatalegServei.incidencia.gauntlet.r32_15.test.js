/* R32.15 · Gauntlet de l'eixida de la cua CAS (escèptic del Carril 1). Cada prova és l'inversa
 * d'una reproducció que passava amb la primera versió de les incidències: ara ha de fallar el defecte. */
import { expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaServeiProjeccionsCataleg, registreProjeccioAmbIncidencia, registreProjeccioPendent } from './projeccionsCatalegServei.js';
import { creaIdbFals } from '../utils/__fixtures__/navegadorFals.js';
import { creaMagatzemIdb } from '../utils/magatzemLocal.js';
import { destinsPerAudiencia, payloadProjeccioCataleg } from './projeccionsCataleg.js';
import { mapSectionSubmissionToItem, elementDeFilaPublicada } from './mapejadorSeccions.js';

const SCOPE = { tenantId: '22222222-2222-4222-8222-222222222222', ownerId: '11111111-1111-4111-8111-111111111111', backendId: 'r3215-gauntlet' };
/* Fidel a r32_11_publicacions_cas.sql: replay amb revisió posterior o fila absent → 003; expected null amb
   fila → 003; expected diferent del viu → 003; fila retirada per moderació → 004. */
function servidor({ revocats = new Set() } = {}) {
  const files = new Map(), rebuts = new Map(); let tick = 0;
  const err003 = () => Object.assign(new Error('La publicació ha canviat.'), { codi: 'conflicte-versio' });
  const cas = vi.fn(async (sub) => {
    if (revocats.has(sub.id)) throw Object.assign(new Error('SDP-PUB-CAS-004: acte vinculat o retirat.'), { status: 403, postgrestCode: '42501' });
    const r = rebuts.get(sub.operationId), s = files.get(sub.id);
    if (r) { if (!s || s.updatedAt !== r) throw err003(); return { ...structuredClone(sub), updatedAt: s.updatedAt }; }
    if ((sub.expectedUpdatedAt === null && s) || (sub.expectedUpdatedAt !== null && (!s || s.updatedAt !== sub.expectedUpdatedAt))) throw err003();
    const updatedAt = `2026-11-19T19:30:00.${String(++tick).padStart(6, '0')}Z`;
    files.set(sub.id, { updatedAt, payload: structuredClone(sub.payload) }); rebuts.set(sub.operationId, updatedAt);
    return { ...structuredClone(sub), updatedAt };
  });
  const legacy = vi.fn(async (sub) => {
    if ('expectedUpdatedAt' in sub) throw new Error('legacy no accepta CAS');
    files.set(sub.id, { updatedAt: `2026-11-19T19:30:00.${String(++tick).padStart(6, '0')}Z`, payload: structuredClone(sub.payload) });
    return { ...structuredClone(sub) };
  });
  return { files, cas, legacy, toca: (id) => { files.get(id).updatedAt = `2026-11-19T19:30:00.${String(++tick).padStart(6, '0')}Z`; } };
}
const crea = (srv, idb, versionada = true) => creaServeiProjeccionsCataleg({ abast: SCOPE, idb, navegador: null, Canal: null,
  subtil: webcrypto.subtle, versionada, publica: versionada ? srv.cas : srv.legacy });
const prova = async (s) => { try { await s.sincronitza(); return 'ok'; } catch (e) { return e.codi ?? e.message; } };
const F = (font, id, title = 'T') => ({ font, id, title, subtitle: '', lead: '' });

test('privada primer i Mur després: el Mur mai intentat és una creació, sense incidència', async () => {
  const srv = servidor(), { idb } = creaIdbFals(); const s = crea(srv, idb); await s.prepara();
  await s.desa(F('bar', 'cafe', 'Café'), ['bar']); expect(await prova(s)).toBe('ok');
  srv.cas.mockClear();
  await s.desa(F('bar', 'cafe', 'Café'), ['bar', 'mur']); expect(await prova(s)).toBe('ok');
  const mur = srv.cas.mock.calls.find(([sub]) => sub.sectionId === 'mur')[0];
  expect(mur.expectedUpdatedAt).toBeNull();
  const row = (await s.llista())[0];
  expect(registreProjeccioPendent(row)).toBe(false);
  expect(row.incidencies).toEqual({ privada: null, publica: null });
  s.tanca();
});

test('resolIncidencia accepta null com a creació quan la fila remota no existix', async () => {
  const srv = servidor(), { idb } = creaIdbFals(); const s = crea(srv, idb); await s.prepara();
  await s.desa(F('herbari', 'romer', 'R'), ['mur']); expect(await prova(s)).toBe('ok');
  const row = (await s.llista())[0];
  srv.files.delete(row.ids.privada); // la fila privada desapareix del servidor (purga)
  await s.desa(F('herbari', 'romer', 'R2'), ['mur']);
  expect(await prova(s)).toBe('incidencia-versio');
  await s.resolIncidencia(row.clau, 'privada', { versioRemota: null });
  expect(await prova(s)).toBe('ok');
  expect(srv.files.has(row.ids.privada)).toBe(true);
  s.tanca();
});

test('flag apagat (rollback): les incidències no compten i el camí legacy publica i les neteja', async () => {
  const srv = servidor(), { idb } = creaIdbFals();
  let s = crea(srv, idb, false); await s.prepara();
  await s.desa(F('herbari', 'romer', 'Legacy'), ['herbari']); expect(await prova(s)).toBe('ok'); s.tanca();
  s = crea(srv, idb, true); await s.prepara();
  await s.desa(F('herbari', 'romer', 'Edició amb el flag encés'), ['herbari']);
  expect(await prova(s)).toBe('incidencia-versio'); s.tanca();
  s = crea(srv, idb, false); await s.prepara();
  srv.legacy.mockClear();
  expect(await prova(s)).toBe('ok');
  expect(srv.legacy).toHaveBeenCalled();
  const row = (await s.llista())[0];
  expect(registreProjeccioPendent(row)).toBe(false);
  expect(registreProjeccioAmbIncidencia(row)).toBe(false);
  s.tanca();
});

test('un rebuig permanent (retirada per moderació) és incidència de la seua fila i no encalla la cua', async () => {
  const revocats = new Set(); const srv = servidor({ revocats }), { idb } = creaIdbFals(); const s = crea(srv, idb); await s.prepara();
  const a = await s.desa(F('herbari', 'a-primer', 'A'), ['mur']); expect(await prova(s)).toBe('ok');
  revocats.add(a.ids.publica);
  await s.desa(F('herbari', 'a-primer', 'A editat'), ['mur']);
  await s.desa(F('herbari', 'b-segon', 'B'), ['mur']);
  expect(await prova(s)).toBe('incidencia-versio');
  const rows = await s.llista();
  expect(registreProjeccioPendent(rows.find((r) => r.font.id === 'b-segon'))).toBe(false);
  expect(rows.find((r) => r.font.id === 'a-primer').incidencies.publica).toEqual({ codi: 'rebuig-servidor', seq: 2 });
  srv.cas.mockClear();
  expect(await prova(s)).toBe('incidencia-versio');
  expect(srv.cas).not.toHaveBeenCalled();
  // Una edició local nova és un intent nou: el rebuig permanent es neteja (el de versió, no).
  await s.desa(F('herbari', 'a-primer', 'A reescrit'), ['mur']);
  expect((await s.llista()).find((r) => r.font.id === 'a-primer').incidencies.publica).toBeNull();
  s.tanca();
});

test('la incidència es tanca sola quan el servidor ja té exactament la projecció local', async () => {
  const srv = servidor(), { idb: idbA } = creaIdbFals(), { idb: idbB } = creaIdbFals();
  const A = crea(srv, idbA); await A.prepara(); await A.desa(F('bar', 'cafe', 'Café'), ['bar']); await prova(A); A.tanca();
  const B = crea(srv, idbB); await B.prepara();
  await B.desa(F('bar', 'cafe', 'Café'), ['bar']); // aparell nou: mateix contingut, només privat
  expect(await prova(B)).toBe('incidencia-versio');
  const registre = (await B.llista())[0];
  expect(registre.incidencies.privada?.codi).toBe('conflicte-versio');
  const id = registre.ids.privada, createdAt = '2026-11-19T18:00:00.000Z', updatedAt = srv.files.get(id).updatedAt;
  const payload = mapSectionSubmissionToItem({ id, sectionId: 'notes', ownerUserId: SCOPE.ownerId, createdAt,
    payload: { ...payloadProjeccioCataleg({ font: registre.font, destins: destinsPerAudiencia(registre.destins, 'privada'), audiencia: 'privada' }), id, sectionId: 'notes', ownerUserId: SCOPE.ownerId, created_at: createdAt } });
  const fila = { ...elementDeFilaPublicada({ id, payload, titol: registre.font.title, createdAt, updatedAt, ownerUserId: SCOPE.ownerId, authorOrgId: null, sectionId: 'notes' }), sectionId: 'notes' };
  await expect(B.adoptaVersionsRemotes([fila])).resolves.toBe(true);
  const final = (await B.llista())[0];
  expect(registreProjeccioPendent(final)).toBe(false);
  expect(final.incidencies.privada).toBeNull();
  expect(final.versions.privada).toBe(updatedAt);
  // Una fila remota divergent no la tanca.
  await B.desa(F('bar', 'cafe', 'Café editat'), ['bar']); srv.toca(id);
  expect(await prova(B)).toBe('incidencia-versio');
  await expect(B.adoptaVersionsRemotes([{ ...fila, title: 'Una altra cosa', updated_at: srv.files.get(id).updatedAt }])).resolves.toBe(false);
  expect(registreProjeccioAmbIncidencia((await B.llista())[0])).toBe(true);
  B.tanca();
});

test('una incidència d\'un build posterior (codi o camp desconegut) no fa caure la cua', async () => {
  const srv = servidor(), { idb } = creaIdbFals(); let s = crea(srv, idb); await s.prepara();
  await s.desa(F('herbari', 'x', 'X'), ['mur']); await s.desa(F('herbari', 'y', 'Y'), ['mur']); s.tanca();
  const cru = creaMagatzemIdb({ nom: `sdp-projeccions-cataleg-v1:${JSON.stringify(SCOPE)}`, versio: 1, stores: { projeccions: { clau: 'clau' } }, llistaBlanca: { projeccions: (r) => r }, idb, navegador: null, Canal: null });
  await cru.prepara();
  const files = await cru.totes('projeccions');
  await cru.desa('projeccions', { ...files[0], incidencies: { privada: { codi: 'codi-del-futur', seq: 1 }, publica: 'no és un objecte' } });
  cru.tanca();
  s = crea(srv, idb); await s.prepara();
  expect(await prova(s)).toBe('ok');
  expect((await s.llista()).every((r) => !registreProjeccioPendent(r))).toBe(true);
  s.tanca();
});

test('la retirada del Mur amb incidència queda pendent i no s\'envia cap altra audiència al Mur', async () => {
  const srv = servidor(), { idb } = creaIdbFals(); const s = crea(srv, idb); await s.prepara();
  await s.desa(F('bar', 'cafe', 'Café'), ['bar', 'mur']); expect(await prova(s)).toBe('ok');
  const row = (await s.llista())[0];
  srv.toca(row.ids.publica);
  await s.desa(F('bar', 'cafe', 'Café 2'), ['bar', 'mur']); expect(await prova(s)).toBe('incidencia-versio');
  await s.desa(F('bar', 'cafe', 'Café 2'), ['bar']);
  expect(await prova(s)).toBe('incidencia-versio');
  // Límit conegut (P2-C, D-R32.15): la retirada espera la resolució explícita; el servidor conserva l'última versió pública.
  expect(registreProjeccioPendent((await s.llista())[0])).toBe(true);
  s.tanca();
});
