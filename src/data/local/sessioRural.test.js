import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaSessioRural, lligJsonRural } from '../sessioRural.js';
import { exportaPaquetVaultFallback, normalitzaNotaVault, sincronitzaAmbDirectoryHandle } from './sincronitzadorCarpetaLocal.js';
import { verificaDeltaEmergenciaRural } from './pontEmergenciaRural.js';

const abast = { persona: 'persona-a', tenant: 'torre', endpoint: 'seed', mode: 'seed' };
const creades = [];
const memoria = new Map();
const ara = () => Date.parse('2026-11-03T16:00:00Z');
async function obri(extra = {}) {
  const s = await creaSessioRural({ abast, municipi: 'La Torre de les Maçanes', actorId: 'https://node.example/actors/emergencia', motor: 'memoria', memoria, crypto: webcrypto, ara, ...extra });
  creades.push(s); return s;
}
beforeEach(() => { memoria.clear(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => { creades.splice(0).forEach(s => s.close()); vi.unstubAllGlobals(); });

test('una nota i la cua sobreviuen al tancament del consumidor sense cap port remot', async () => {
  const s = await obri();
  const guardat = await s.desaNota({ title: 'Camí tallat', content: 'Pedres al camí del Pou', prioritat: 'alta' });
  expect(guardat).toMatchObject({ pendents: 1, cadenaValida: true });
  expect(guardat.notes[0].title).toBe('Camí tallat');
  expect(guardat.bans[0].prioritat).toBe('alta');
  s.close();
  const altra = await obri();
  expect(await altra.estat()).toEqual(guardat);
});

test('persona, poble i endpoint separen notes i cua', async () => {
  const s = await obri(); await s.desaNota({ title: 'Privada', content: 'Nota de camp' });
  for (const canvi of [{ persona: 'persona-b' }, { tenant: 'xixona' }, { endpoint: 'https://altre.example' }]) {
    expect(await (await obri({ abast: { ...abast, ...canvi } })).estat()).toMatchObject({ notes: [], bans: [], pendents: 0 });
  }
});

test('pont real signat, importació idempotent i rebutjos de clau i bytes', async () => {
  const a = await obri(); await a.desaNota({ title: 'Aigua', content: 'Font disponible' });
  const { delta, publicKeyJwk } = await a.exportaDelta();
  expect(delta.proof.proofValue.startsWith('z')).toBe(true);
  expect(publicKeyJwk.d).toBeUndefined();
  const b = await obri({ abast: { ...abast, persona: 'brigada-b' } });
  expect((await b.importaDelta(JSON.stringify(delta), publicKeyJwk)).bans).toHaveLength(1);
  expect((await b.importaDelta(delta, publicKeyJwk)).bans).toHaveLength(1);
  await expect(b.importaDelta(delta, null)).rejects.toThrow('clau pública');
  await expect(b.importaDelta(delta, { ...publicKeyJwk, d: 'privada' })).rejects.toThrow('clau pública');
  const alterat = JSON.parse(JSON.stringify(delta)); alterat.operacions[0].payload.content = 'Fals';
  await expect(b.importaDelta(alterat, publicKeyJwk)).rejects.toThrow();
  expect((await b.estat()).bans).toHaveLength(1);
});

test('carpeta Markdown: exportació i importació reals; corrupció sense mutació', async () => {
  const a = await obri(); await a.desaNota({ title: 'Reunió', content: 'Acta al local' });
  const paquet = await a.exportaVault();
  const b = await obri({ abast: { ...abast, persona: 'b' } });
  expect((await b.importaVault(JSON.stringify(paquet))).notes[0]).toMatchObject({ title: 'Reunió', content: 'Acta al local' });
  const alterat = JSON.parse(JSON.stringify(paquet));
  const nom = Object.keys(alterat.fitxers)[0]; alterat.fitxers[nom] += '\nFals';
  await expect(b.importaVault(alterat)).rejects.toThrow('empremtes');
  expect((await b.estat()).notes[0].content).toBe('Acta al local');
});

test('tancar talla mutacions i exportacions tardanes', async () => {
  const s = await obri(); s.close();
  await expect(s.desaNota({ title: 'x', content: 'y' })).rejects.toThrow('tancat');
  await expect(s.exportaDelta()).rejects.toThrow('tancat');
});

test('JSON hostil i límits es rebutgen abans de fer feina', async () => {
  expect(() => lligJsonRural('{')).toThrow('JSON');
  expect(() => lligJsonRural('x'.repeat(4 * 1024 * 1024 + 1))).toThrow('4 MB');
  expect(() => lligJsonRural('{"__proto__":{"polluted":true}}')).toThrow();
  expect({}.polluted).toBeUndefined();
});

test('una fusió amb la mateixa data conserva el cos importat i el conflicte després de reiniciar', async () => {
  const s = await obri(); await s.desaNota({ title: 'Original', content: 'Cos original' });
  const nota = (await s.estat()).notes[0];
  let canvi;
  for (let i = 0; i < 1000; i += 1) {
    const prova = { ...nota, content: `Canvi extern ${i}` };
    if (normalitzaNotaVault(prova).sha256Cos > normalitzaNotaVault(nota).sha256Cos) { canvi = prova; break; }
  }
  expect(canvi).toBeDefined();
  await s.importaVault(exportaPaquetVaultFallback({ notesApp: [canvi] }));
  const comprova = async motor => {
    const estat = await motor.estat();
    expect(estat.notes.some(n => n.content === canvi.content)).toBe(true);
    expect(estat.notes.some(n => n.content === nota.content)).toBe(true);
    expect(estat.pendents).toBe(1);
  };
  await comprova(s); s.close(); await comprova(await obri());
});

test('dues exportacions concurrents comparteixen una clau i les dues signatures verifiquen', async () => {
  const s = await obri(); await s.desaNota({ title: 'Camí', content: 'Obert' });
  const resultats = await Promise.all([s.exportaDelta(), s.exportaDelta()]);
  expect(resultats[0].publicKeyJwk.x).toBe(resultats[1].publicKeyJwk.x);
  for (const r of resultats) expect((await verificaDeltaEmergenciaRural(r.delta, { publicKeyJwk: r.publicKeyJwk, ara: ara() })).valid).toBe(true);
});

test('cancel·lar la carpeta durant una lectura evita crear i escriure fitxers', async () => {
  const controller = new AbortController();
  const escriptura = vi.fn();
  const handle = { entries: async function* () { yield ['nota.md', { kind: 'file', getFile: async () => { controller.abort(); return { text: async () => 'Text' }; } }]; }, getFileHandle: escriptura };
  await expect(sincronitzaAmbDirectoryHandle(handle, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(escriptura).not.toHaveBeenCalled();
});
