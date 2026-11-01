/* PC155-01 (auditoria Codex post-155d84bd8, marató 261101_2143) · Una exportació
   local en vol no sobreviu al canvi de persona, a una entrada nova ni al
   tancament de l'adaptador. Els dos primers casos són el reproductor de Codex
   (_investigacio_ia_de_poble/261101_auditoria_postcommit_codex/adversarial.local.test.js)
   girat: abans passaven reproduint la fuita; ara exigixen el rebuig. Els
   controls demostren que la prova mossega: la mateixa exportació, sense canvi
   o amb una renovació del testimoni, sí que ix (la de la renovació en vol, a
   més, amb el format v1). El canvi en el mateix tic de la crida, abans que la
   guarda entre al mètode, és la troballa PC155-01-A1 de l'àrbitre. */
import { afterEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ uid: null }));
/* Només el reproductor de Codex simula la persona; la resta usa la sessió real. */
vi.mock('../identitat.js', async (original) => {
  const real = await original();
  return {
    ...real,
    usuariDeSessio: () => (m.uid === null ? real.usuariDeSessio() : { id: m.uid }),
    getDefaultUserId: () => (m.uid === null ? real.getDefaultUserId() : m.uid)
  };
});

const { configuraBackendSessio, desaSessio, esborraSessio } = await import('../identitat.js');
const { creaAdaptadorLocal } = await import('./adaptadorLocal.js');

const ANNA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const BERTA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const ARA = new Date('2026-11-01T10:00:00.000Z');
const ara = () => new Date(ARA);
const RENTONAR = 'rentonar';
/* Les claus del format socdepoble.exportacio.v1, en l'ordre de sempre. */
const CLAUS_V1 = ['format', 'node', 'generatAl', 'perfil', 'notes', 'seguiments', 'bloquejos', 'normes', 'consentiments', 'baixa'];
const NOTA_ANNA = { id: 'nota-anna', folderId: 'f-notes', title: 'Meua', content: 'meua', revision: 0,
  createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z' };

function manual() {
  let resol;
  const p = new Promise((r) => { resol = r; });
  return { p, resol };
}
/* Un magatzem de notes que retén la primera lectura fins que la prova la
   solta; les següents responen buides i les escriptures no fan res. */
function magatzemRetingut() {
  const lectura = manual();
  const inici = manual();
  let primera = true;
  const read = () => {
    if (!primera) return Promise.resolve({});
    primera = false;
    inici.resol();
    return lectura.p;
  };
  return { lectura, inici, magatzem: { read, mutate: () => {} } };
}
const entra = (adaptador, id, { renovacio = false } = {}) => {
  configuraBackendSessio(adaptador.configuracio);
  expect(desaSessio({ access_token: renovacio ? 'testimoni-renovat-local' : 'testimoni-opac-local',
    user: { id, email: 'proves@poble.invalid' } }, { renovacio })).toBe(true);
};

afterEach(() => { m.uid = null; esborraSessio({ abast: 'tot' }); });

describe('reproductor de Codex, girat', () => {
  test('una exportació pendent d’Anna no ix si la sessió passa a Berta', async () => {
    m.uid = 'anna';
    const { lectura, inici, magatzem } = magatzemRetingut();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    const pendent = a.exportaLesMeuesDades();
    await inici.p;
    m.uid = 'berta';
    lectura.resol({ 'privada-anna': { id: 'privada-anna', content: 'secret d’Anna' } });
    await expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
    await a.destroy();
  });

  test('destroy descarta l’exportació ja iniciada', async () => {
    m.uid = 'anna';
    const { lectura, inici, magatzem } = magatzemRetingut();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    const pendent = a.exportaLesMeuesDades();
    await inici.p;
    await a.destroy();
    lectura.resol({ 'privada-anna': { id: 'privada-anna', content: 'secret després de destroy' } });
    await expect(pendent).rejects.toThrow('[adaptadorLocal] Adaptador tancat.');
  });

  test('control: sense canvi, la mateixa exportació retinguda sí que ix (la prova mossega)', async () => {
    m.uid = 'anna';
    const { lectura, inici, magatzem } = magatzemRetingut();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    const pendent = a.exportaLesMeuesDades();
    await inici.p;
    lectura.resol({ 'nota-anna': NOTA_ANNA });
    expect((await pendent).notes.map((n) => n.id)).toEqual(['nota-anna']);
    await a.destroy();
  });
});

describe('amb la sessió real (identitat.js)', () => {
  test('una entrada de Berta mentre s’exporta Anna: AbortError', async () => {
    const { lectura, inici, magatzem } = magatzemRetingut();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    entra(a, ANNA);
    const pendent = a.exportaLesMeuesDades({});
    await inici.p;
    entra(a, BERTA);
    lectura.resol({});
    await expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
    await a.destroy();
  });

  test('Anna ix i torna a entrar mentre s’exporta: l’entrada és una altra, AbortError', async () => {
    const { lectura, inici, magatzem } = magatzemRetingut();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    entra(a, ANNA);
    const pendent = a.exportaLesMeuesDades({});
    await inici.p;
    esborraSessio({ abast: 'tot' });
    entra(a, ANNA);
    lectura.resol({});
    await expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
    await a.destroy();
  });

  test('control: una renovació del testimoni d’Anna en vol no la rebutja, i el format v1 no canvia', async () => {
    const { lectura, inici, magatzem } = magatzemRetingut();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem, ara });
    entra(a, ANNA);
    await a.segueix({ tipus: 'entitat', id: RENTONAR }, {});
    await a.bloquejaAutor({ tipus: 'persona', id: BERTA, nom: 'Berta' }, {});
    await a.registraConsentiment('rgpd_acepta', '2026-10', {});
    const pendent = a.exportaLesMeuesDades({});
    await inici.p;
    entra(a, ANNA, { renovacio: true });
    lectura.resol({ 'nota-anna': NOTA_ANNA });
    const dades = await pendent;
    expect(Object.keys(dades)).toEqual(CLAUS_V1);
    expect(dades).toMatchObject({ format: 'socdepoble.exportacio.v1', node: 'local', generatAl: '2026-11-01T10:00:00.000Z' });
    expect(dades.perfil.id).toBe(ANNA);
    expect(dades.notes.map((n) => n.id)).toEqual(['nota-anna']);
    expect(dades.seguiments.map((s) => [s.tipus, s.id])).toEqual([['entitat', RENTONAR]]);
    expect(dades.bloquejos.map((b) => [b.tipus, b.id])).toEqual([['persona', BERTA]]);
    expect(dades.consentiments.map((c) => [c.tipus, c.accio])).toEqual([['rgpd_acepta', 'accepta']]);
    expect(dades.baixa).toEqual({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
    await a.destroy();
  });

  test('la guarda transversal: una lectura sense desfes que acaba amb l’adaptador tancat no lliura res', async () => {
    const { lectura, inici, magatzem } = magatzemRetingut();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    entra(a, ANNA);
    const pendent = a.loadNotes(ANNA, {});
    await inici.p;
    await a.destroy();
    lectura.resol({});
    await expect(pendent).rejects.toThrow('[adaptadorLocal] Adaptador tancat.');
  });
});

describe('en el mateix tic de la crida (PC155-01-A1)', () => {
  /* Un magatzem que compta les lectures: si el mètode no hi entra, no n'hi ha cap. */
  const magatzemComptat = () => {
    const read = vi.fn(() => Promise.resolve({}));
    return { read, magatzem: { read, mutate: () => {} } };
  };

  test('Anna crida i entra Berta abans que la guarda entre al mètode: AbortError, sense llegir res', async () => {
    const { read, magatzem } = magatzemComptat();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    entra(a, ANNA);
    const pendent = a.exportaLesMeuesDades({});
    entra(a, BERTA);
    await expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
    expect(read).not.toHaveBeenCalled();
    await a.destroy();
  });

  test('Anna crida, ix i torna a entrar en el mateix tic: l’entrada és una altra, AbortError', async () => {
    const { read, magatzem } = magatzemComptat();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    entra(a, ANNA);
    const pendent = a.exportaLesMeuesDades({});
    esborraSessio({ abast: 'tot' });
    entra(a, ANNA);
    await expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
    expect(read).not.toHaveBeenCalled();
    await a.destroy();
  });

  test('control: una renovació del testimoni en el mateix tic no la rebutja', async () => {
    const { read, magatzem } = magatzemComptat();
    const a = creaAdaptadorLocal({ mode: 'local', magatzemNotes: magatzem });
    entra(a, ANNA);
    const pendent = a.exportaLesMeuesDades({});
    entra(a, ANNA, { renovacio: true });
    expect((await pendent).perfil.id).toBe(ANNA);
    expect(read).toHaveBeenCalled();
    await a.destroy();
  });
});
