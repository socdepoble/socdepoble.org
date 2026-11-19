/* R32.15 · D-R32.14-1 · Eixida de la cua CAS de publicacions del catàleg.
 * El Gauntlet de v1.2.11 (P1, reproduït) va trobar que una operació rebutjada amb
 * «conflicte-versio» es reintentava per sempre al cap de la cua i encallava les
 * referències de darrere. Ara passa a incidència durable i recuperable. */
import { expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaServeiProjeccionsCataleg, filesDeRegistreProjeccio, registreProjeccioAmbIncidencia, registreProjeccioPendent } from './projeccionsCatalegServei.js';
import { creaIdbFals } from '../utils/__fixtures__/navegadorFals.js';

const SCOPE = { tenantId: '22222222-2222-4222-8222-222222222222', ownerId: '11111111-1111-4111-8111-111111111111', backendId: 'r3215-lab' };
const font = (id, title) => ({ font: 'importacio-wp', id, title, subtitle: '', lead: '' });
const herba = (id, title) => ({ font: 'herbari', id, title, subtitle: '', lead: '' });

/* Servidor CAS fidel a publica_section_submission_cas: rebut per operació, i
   conflicte (codi del client real, content.js) si la versió esperada no és la viva. */
function servidor() {
  const files = new Map(), rebuts = new Map(); let tick = 0;
  const publica = vi.fn(async (sub) => {
    const r = rebuts.get(sub.operationId), s = files.get(sub.id);
    const conflicte = () => Object.assign(new Error('La publicació ha canviat.'), { codi: 'conflicte-versio' });
    if (r) { if (!s || s.updatedAt !== r) throw conflicte(); return { ...structuredClone(sub), updatedAt: s.updatedAt }; }
    if ((sub.expectedUpdatedAt === null && s) || (sub.expectedUpdatedAt !== null && (!s || s.updatedAt !== sub.expectedUpdatedAt))) throw conflicte();
    const updatedAt = `2026-11-19T19:00:00.${String(++tick).padStart(6, '0')}Z`;
    files.set(sub.id, { updatedAt }); rebuts.set(sub.operationId, updatedAt);
    return { ...structuredClone(sub), updatedAt };
  });
  return { publica, files };
}
const aparell = (srv, extra = {}) => { const { idb } = creaIdbFals(); return () => creaServeiProjeccionsCataleg({ abast: SCOPE, idb, navegador: null, Canal: null, subtil: webcrypto.subtle, versionada: true, publica: srv.publica, ...extra }); };
const ids = (srv) => srv.publica.mock.calls.map(([sub]) => sub.payload.projeccioCataleg.id);

async function escenari() {
  const srv = servidor();
  const A = aparell(srv)(); await A.prepara();
  await A.desa(font('123', 'Vell'), ['mur']); await A.sincronitza(); A.tanca();
  const nouB = aparell(srv); const B = nouB(); await B.prepara();
  await B.desa(font('123', 'Vell revisat a B'), ['mur']);
  return { srv, B, nouB };
}

test('un conflicte-versio passa a incidència i no encalla la referència següent', async () => {
  const { srv, B } = await escenari();
  await expect(B.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio', incidencies: [
    { clau: expect.any(String), audiencia: 'privada', codi: 'conflicte-versio' }, { clau: expect.any(String), audiencia: 'publica', codi: 'conflicte-versio' }] });
  srv.publica.mockClear();
  await B.desa(font('456', 'Nou'), ['mur']);
  await expect(B.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio' });
  expect(ids(srv)).toEqual(['456', '456']);
  const rows = await B.llista();
  const nou = rows.find((r) => r.font.id === '456'), vell = rows.find((r) => r.font.id === '123');
  expect(registreProjeccioPendent(nou)).toBe(false);
  expect(registreProjeccioPendent(vell)).toBe(true);
  expect(registreProjeccioAmbIncidencia(vell)).toBe(true);
  expect(vell.operacions).toEqual({ privada: null, publica: null });
  expect(vell.font.title).toBe('Vell revisat a B');
  B.tanca();
});

test('sense bucle: una segona sincronització no torna a cridar el servidor per la incidència', async () => {
  const { srv, B } = await escenari();
  await expect(B.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio' });
  srv.publica.mockClear();
  for (let k = 0; k < 3; k++) await expect(B.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio' });
  expect(srv.publica).not.toHaveBeenCalled();
  B.tanca();
});

test('la incidència és durable, marca la fila i sobreviu a una nova edició local', async () => {
  const { srv, B, nouB } = await escenari();
  await expect(B.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio' });
  await B.desa(font('123', 'Segona edició a B'), ['mur']); B.tanca();
  const B2 = nouB(); await B2.prepara();
  const [row] = (await B2.llista()).filter((r) => r.font.id === '123');
  expect(row.incidencies.privada).toEqual({ codi: 'conflicte-versio', seq: 1 });
  expect(row.seq).toBe(2);
  const files = filesDeRegistreProjeccio(row, SCOPE);
  expect(files.find((f) => f.sectionId === 'notes')._projeccioIncidencia).toBe('conflicte-versio');
  expect(files.find((f) => f.sectionId === 'mur')._projeccioIncidencia).toBe('conflicte-versio');
  expect(filesDeRegistreProjeccio({ ...row, incidencies: { privada: null, publica: null } }, SCOPE).some((f) => '_projeccioIncidencia' in f)).toBe(false);
  srv.publica.mockClear();
  await expect(B2.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio' });
  expect(srv.publica).not.toHaveBeenCalled();
  B2.tanca();
});

test('resolució explícita: nova base remota, una sola operació nova i incidència tancada', async () => {
  const { srv, B } = await escenari();
  await expect(B.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio' });
  const row = (await B.llista()).find((r) => r.font.id === '123');
  const remota = srv.files.get(row.ids.privada).updatedAt, remotaMur = srv.files.get(row.ids.publica).updatedAt;
  await B.resolIncidencia(row.clau, 'privada', { versioRemota: remota });
  srv.publica.mockClear();
  // Mentre el Mur continua en incidència, la privada ja publica i la cua no torna al Mur.
  await expect(B.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio', incidencies: [{ audiencia: 'publica', codi: 'conflicte-versio' }] });
  expect(srv.publica).toHaveBeenCalledTimes(1);
  expect(srv.publica.mock.calls[0][0]).toMatchObject({ sectionId: 'notes', expectedUpdatedAt: remota });
  await B.resolIncidencia(row.clau, 'publica', { versioRemota: remotaMur });
  await B.sincronitza();
  expect(srv.publica).toHaveBeenCalledTimes(2);
  expect(srv.publica.mock.calls[1][0]).toMatchObject({ sectionId: 'mur', expectedUpdatedAt: remotaMur });
  const final = (await B.llista()).find((r) => r.font.id === '123');
  expect(registreProjeccioPendent(final)).toBe(false);
  expect(final.incidencies).toEqual({ privada: null, publica: null });
  expect(srv.files.get(final.ids.privada).updatedAt).toBe(final.versions.privada);
  expect(srv.files.get(final.ids.publica).updatedAt).toBe(final.versions.publica);
  B.tanca();
});

test('resolIncidencia valida audiència, versió i que hi haja incidència', async () => {
  const { B } = await escenari();
  const clau = (await B.llista())[0].clau;
  await expect(B.resolIncidencia(clau, 'privada', { versioRemota: '2026-11-19T19:00:00.000001Z' })).rejects.toMatchObject({ codi: 'sense-incidencia' });
  await expect(B.resolIncidencia(clau, 'altra', { versioRemota: '2026-11-19T19:00:00.000001Z' })).rejects.toMatchObject({ codi: 'versio-invalida' });
  await expect(B.resolIncidencia(clau, 'privada', { versioRemota: 'ahir' })).rejects.toMatchObject({ codi: 'versio-invalida' });
  B.tanca();
  const srv = servidor(), legacy = aparell(srv, { versionada: false })(); await legacy.prepara();
  await expect(legacy.resolIncidencia(clau, 'privada', { versioRemota: '2026-11-19T19:00:00.000001Z' })).rejects.toMatchObject({ codi: 'cas-no-disponible' });
  legacy.tanca();
});

test('versió desconeguda després d\'un ACK legacy: incidència, sense crida i la cua continua', async () => {
  const srv = servidor();
  // El servei legacy no envia versió: confirma sense testimoni.
  const legacyPub = vi.fn(async (sub) => ({ ...sub }));
  const { idb } = creaIdbFals();
  const mk = (extra) => creaServeiProjeccionsCataleg({ abast: SCOPE, idb, navegador: null, Canal: null, subtil: webcrypto.subtle, ...extra });
  const pas1 = mk({ versionada: false, publica: legacyPub }); await pas1.prepara();
  await pas1.desa(herba('romer', 'Legacy'), ['bar']); await pas1.sincronitza(); pas1.tanca();
  const pas2 = mk({ versionada: true, publica: srv.publica }); await pas2.prepara();
  await pas2.desa(herba('romer', 'Edició CAS'), ['bar']);
  await pas2.desa(herba('salvia', 'Una altra'), ['bar']);
  await expect(pas2.sincronitza()).rejects.toMatchObject({ codi: 'incidencia-versio', incidencies: [{ audiencia: 'privada', codi: 'versio-desconeguda' }] });
  expect(ids(srv)).toEqual(['salvia']);
  const vell = (await pas2.llista()).find((r) => r.font.id === 'romer');
  expect(vell.incidencies.privada).toEqual({ codi: 'versio-desconeguda', seq: 2 });
  pas2.tanca();
});

test('una fallada que no és de versió continua propagant-se i conserva l\'operació', async () => {
  const srv = servidor(); let caigut = true;
  const s = aparell(srv, { publica: async (sub) => { if (caigut) throw Object.assign(new Error('xarxa'), { status: 0 }); return srv.publica(sub); } })();
  await s.prepara(); await s.desa(herba('timo', 'Sense xarxa'), ['bar']);
  await expect(s.sincronitza()).rejects.toThrow('xarxa');
  const row = (await s.llista())[0];
  expect(row.operacions.privada?.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(registreProjeccioAmbIncidencia(row)).toBe(false);
  caigut = false; await s.sincronitza();
  expect(registreProjeccioPendent((await s.llista())[0])).toBe(false);
  s.tanca();
});
