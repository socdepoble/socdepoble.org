/* PRODUCCIO-01 (R15b) · Dos magatzems del mateix abast (el mateix compte en dues pestanyes del Mas) comparteixen un
   sol bloqueig d'escriptura (Web Locks) i una sola base. El segon catàleg queda lector i el seu desament falla amb
   NOMES_LECTURA (el selector ho diu: tanca l'altra pestanya); quan la primera es tanca, agafa el relleu. Una superfície
   que només llig (el Mur, el Mercat: `lectora`) no agafa el bloqueig: el catàleg de l'altra pestanya hi desa. */
import { describe, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../utils/__fixtures__/navegadorFals.js';
import { creaServeiProjeccionsCataleg } from './projeccionsCatalegServei.js';
import { elementDeFilaPublicada, mapSectionSubmissionToItem } from './mapejadorSeccions.js';
import { destinsPerAudiencia, payloadProjeccioCataleg } from './projeccionsCataleg.js';

const SCOPE = { tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', ownerId: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', backendId: 'sdp-local' };
const FONT = { font: 'herbari', id: 'romer', title: 'Romer', subtitle: 'Salvia rosmarinus', lead: '' };
const espera = (ms = 5) => new Promise((resolve) => { setTimeout(resolve, ms); });
function navegador() {
  const { idb } = creaIdbFals();
  const comu = { idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal, subtil: webcrypto.subtle };
  return (extra = {}) => creaServeiProjeccionsCataleg({ abast: SCOPE, ...comu, ...extra });
}

describe('dos magatzems del mateix abast', () => {
  test('el segon catàleg és lector: desa falla amb NOMES_LECTURA fins que la primera pestanya es tanca', async () => {
    const pestanya = navegador();
    const a = pestanya(), b = pestanya();
    await a.prepara(); await b.prepara();
    expect([a.mode, b.mode]).toEqual(['escriptora', 'lectora']);
    await expect(b.desa(FONT, ['mur'])).rejects.toMatchObject({ codi: 'NOMES_LECTURA' });
    await a.desa(FONT, ['mur']);
    expect((await b.llista()).map(row => row.destins)).toEqual([['mur']]);
    a.tanca();
    await espera();
    expect(b.mode).toBe('escriptora');
    await b.desa(FONT, ['mur', 'herbari']);
    expect((await b.llista()).map(row => [row.destins, row.seq])).toEqual([[['mur', 'herbari'], 2]]);
    b.tanca();
  });

  test('el Mur (lector) obert abans no agafa el bloqueig: el catàleg de l’altra pestanya hi desa i el Mur ho llig', async () => {
    const pestanya = navegador();
    const mur = pestanya({ lectora: true }), cataleg = pestanya();
    const avisos = [];
    mur.subscriu(avis => avisos.push(avis));
    await mur.prepara();
    expect(mur.mode).toBe('lliure');
    await cataleg.prepara();
    expect(cataleg.mode).toBe('escriptora');
    await cataleg.desa(FONT, ['mur']);
    await espera();
    expect(avisos).toContainEqual({ tipus: 'canvi', store: 'projeccions', local: false });
    expect((await mur.llista()).map(row => row.font.id)).toEqual(['romer']);
    mur.tanca(); cataleg.tanca();
  });

  test('el lector no escriu mai: ni desa ni sincronitza', async () => {
    const pestanya = navegador();
    const publica = vi.fn();
    const mur = pestanya({ lectora: true, publica });
    await mur.prepara();
    await expect(mur.desa(FONT, ['mur'])).rejects.toMatchObject({ codi: 'nomes-lectura' });
    await expect(mur.sincronitza()).rejects.toMatchObject({ codi: 'nomes-lectura' });
    expect(publica).not.toHaveBeenCalled();
    expect(await mur.llista()).toEqual([]);
    mur.tanca();
  });
});

/* Onada R32 · L'adopció de versions remotes (Codex R31, opció A) és comptabilitat local. Una pestanya que el
   magatzem deixa lectora (una altra té el bloqueig) no pot fer fallar la seua lectura remota per voler-la
   escriure (NOMES_LECTURA), i una fila remota que no coincidix exactament no provoca cap escriptura ni cap
   avís a les altres pestanyes. La versió, si coincidix, l'adopta la pestanya escriptora. Tot això només
   quan el servei és `versionada` (D-R32-PUB-1 a); dorment, no toca el magatzem. */
const filaPrivadaExacta = (registre, updatedAt) => {
  const id = registre.ids.privada, createdAt = '2026-11-16T04:00:00.000Z';
  const destins = destinsPerAudiencia(registre.destins, 'privada');
  const payload = mapSectionSubmissionToItem({ id, sectionId: 'notes', ownerUserId: SCOPE.ownerId, createdAt,
    payload: { ...payloadProjeccioCataleg({ font: registre.font, destins, audiencia: 'privada' }), id, sectionId: 'notes', ownerUserId: SCOPE.ownerId, created_at: createdAt } });
  return { ...elementDeFilaPublicada({ id, payload, titol: registre.font.title, createdAt, updatedAt,
    ownerUserId: SCOPE.ownerId, authorOrgId: null, sectionId: 'notes' }), sectionId: 'notes' };
};
describe('adopció de versions remotes amb dues pestanyes', () => {
  test('un ACK amb una versió no estricta es confirma igual, però no la certifica', async () => {
    let versio;
    const publica = vi.fn(async sub => ({ id: sub.id, sectionId: sub.sectionId, payload: sub.payload, updatedAt: versio }));
    const a = navegador()({ publica });
    try {
      await a.prepara();
      for (const [i, cas] of [1794849257732, '2026-11-16', '2026-11-16 05:00:00', 'invalid', null, new Date(0), '2026-11-16T05:00:00.000001Z'].entries()) {
        versio = cas;
        await a.desa({ ...FONT, title: `Romer ${i}` }, ['bar']); await a.sincronitza();
        const row = (await a.llista())[0];
        expect(row.confirmacions.privada, String(cas)).toBe(row.seq);
        expect(row.versions.privada, String(cas)).toBe(typeof cas === 'string' && cas.includes('T') && cas.endsWith('Z') ? cas : null);
      }
    } finally { a.tanca(); }
  });
  test('dorment (producció, D-R32-PUB-1 pendent): ni una fila exacta fa llegir ni escriure el magatzem', async () => {
    const { idb, registre: disc } = creaIdbFals(), avisos = [];
    const publica = vi.fn(async sub => ({ id: sub.id, sectionId: sub.sectionId, payload: sub.payload }));
    const a = creaServeiProjeccionsCataleg({ abast: SCOPE, idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal, subtil: webcrypto.subtle, publica });
    a.subscriu(avis => avisos.push(avis));
    try {
      await a.prepara(); await a.desa(FONT, ['bar']); await a.sincronitza(); await espera();
      const registre = (await a.llista())[0];
      const fila = filaPrivadaExacta(registre, '2026-11-16T05:00:00.000001Z');
      const obertures = disc.obrides.length; avisos.length = 0;
      await expect(a.adoptaVersionsRemotes([fila])).resolves.toBe(false); await espera();
      // Cap obertura de la base (ni lectura ni escriptura) i cap avís.
      expect(disc.obrides.length).toBe(obertures); expect(avisos).toEqual([]);
      expect((await a.llista())[0].versions).toEqual({ privada: null, publica: null });
    } finally { a.tanca(); }
  });
  test('la pestanya lectora no escriu ni falla; una fila divergent no escriu ni avisa ningú', async () => {
    const pestanya = navegador();
    const publica = vi.fn(async sub => ({ id: sub.id, sectionId: sub.sectionId, payload: sub.payload }));
    // Primera confirmació legacy sense token; després s'obri el servei CAS.
    const legacy = pestanya({ publica }); await legacy.prepara(); await legacy.desa(FONT, ['mur']); await legacy.sincronitza(); legacy.tanca();
    const a = pestanya({ publica, versionada: true }), b = pestanya({ publica, versionada: true });
    const avisos = [];
    b.subscriu(avis => avisos.push(avis));
    try {
      await a.prepara(); await b.prepara();
      expect([a.mode, b.mode]).toEqual(['escriptora', 'lectora']);
      await espera();
      const registre = (await a.llista())[0];
      // Un ACK sense versió del servidor: el registre queda com un d'abans de R32.
      expect(registre.versions).toEqual({ privada: null, publica: null });
      const divergent = ['privada', 'publica'].map(audiencia => ({ id: registre.ids[audiencia], updated_at: '2026-11-16T05:00:00.000001Z', title: 'Edició d’un altre dispositiu' }));
      avisos.length = 0;
      await expect(b.adoptaVersionsRemotes(divergent)).resolves.toBe(false);
      await expect(a.adoptaVersionsRemotes(divergent)).resolves.toBe(false); await espera();
      expect(avisos.filter(avis => avis.tipus === 'canvi')).toEqual([]);
      expect((await b.llista())[0]).toEqual(registre);
    } finally { a.tanca(); b.tanca(); }
  });
  test('una fila exacta l’adopta només la pestanya escriptora; la lectora ni escriu ni falla', async () => {
    const pestanya = navegador();
    const publica = vi.fn(async sub => ({ id: sub.id, sectionId: sub.sectionId, payload: sub.payload }));
    const legacy = pestanya({ publica }); await legacy.prepara(); await legacy.desa(FONT, ['bar']); await legacy.sincronitza(); legacy.tanca();
    const a = pestanya({ publica, versionada: true }), b = pestanya({ publica, versionada: true });
    try {
      await a.prepara(); await b.prepara();
      await espera();
      const registre = (await a.llista())[0];
      expect(registre.versions).toEqual({ privada: null, publica: null });
      // La fila privada tal com la serviria el servidor per a esta mateixa projecció.
      const updatedAt = '2026-11-16T05:00:00.000001Z', fila = filaPrivadaExacta(registre, updatedAt);
      await expect(b.adoptaVersionsRemotes([fila])).resolves.toBe(false);
      expect((await b.llista())[0].versions.privada).toBeNull();
      await expect(a.adoptaVersionsRemotes([fila])).resolves.toBe(true); await espera();
      expect((await b.llista())[0].versions).toEqual({ privada: updatedAt, publica: null });
    } finally { a.tanca(); b.tanca(); }
  });
});
