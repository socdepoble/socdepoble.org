/**
 * Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25; MCR b36_xat.3, risc 4) · La
 * resposta de la IAIA local és asíncrona (busca a la Wiki abans de contestar).
 * Ací es prova l'ordre del fil amb respostes que arriben quan la prova vol:
 *  · dos missatges seguits no s'intercalen: pregunta, resposta, pregunta,
 *    resposta, amb el `seq` seguit i sense forats;
 *  · un reintent del mateix id mentre espera no entra dues vegades;
 *  · un sol avís per pregunta, amb el seq de la resposta, com abans;
 *  · sense resposta de la Wiki, o si falla, la frase de sempre;
 *  · les altres converses no esperen la IAIA, i el remot no la crida mai.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IAIA_ID, RESPOSTA_IAIA } from './identitatsSeed.js';
import { esperaLaIAIA, localXat, reiniciaLocalXat } from './localXat.js';
import { XAT_SEED_IDS } from './xatSeed.js';

const mock = vi.hoisted(() => ({
  user: { id: 'jo-A' },
  respostes: [],
  resposta: null
}));
vi.mock('./identitat.js', () => ({ usuariDeSessio: () => mock.user, getDefaultUserId: () => 'convidat-seed' }));
vi.mock('./iaiaLocal.js', () => ({ respostaDeLaIAIA: (...args) => mock.resposta(...args) }));

const SEED = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
const FIL = XAT_SEED_IDS.filIaia;

/* Cada pregunta deixa una resposta pendent que la prova resol quan vol. */
function respostesADemanda() {
  mock.respostes = [];
  mock.resposta = vi.fn((pregunta) => new Promise((resol, rebutja) => { mock.respostes.push({ pregunta, resol, rebutja }); }));
}
/* Deixa córrer les microtasques pendents (cap temporitzador en joc). */
const buida = () => new Promise((resol) => { setTimeout(resol, 0); });
/* Resol la resposta `i` i deixa que s'escriga (i que la pregunta que
   l'esperava entre). No espera les respostes que això obri. */
const dona = async (i, text) => { mock.respostes[i].resol(text); await buida(); };
const missatges = async () => (await localXat.loadMissatges(FIL, SEED)).map((m) => [m.seq, m.usuariId, m.text]);
const ultimaSeq = async () => (await localXat.loadMissatges(FIL, SEED)).at(-1).seq;

beforeEach(() => { reiniciaLocalXat(); mock.user = { id: 'jo-A' }; respostesADemanda(); });

describe('l’ordre del fil de la IAIA', () => {
  it('dos missatges seguits: pregunta, resposta, pregunta, resposta, amb el seq seguit', async () => {
    const abans = await ultimaSeq();
    const primer = localXat.enviaMissatge(FIL, { id: 'q-1', text: 'Primera pregunta' }, SEED);
    const segon = localXat.enviaMissatge(FIL, { id: 'q-2', text: 'Segona pregunta' }, SEED);
    expect(await primer).toMatchObject({ seq: abans + 1, usuariId: 'jo-A' });
    await buida();
    /* La segona espera: la IAIA encara pensa la primera, i només hi ha una pregunta oberta. */
    expect(mock.resposta.mock.calls.map(([pregunta]) => pregunta)).toEqual(['Primera pregunta']);
    let segonaAcabada = false;
    segon.then(() => { segonaAcabada = true; });
    await buida();
    expect(segonaAcabada).toBe(false);
    expect((await missatges()).slice(-1)).toEqual([[abans + 1, 'jo-A', 'Primera pregunta']]);
    await dona(0, 'Resposta a la primera');
    expect(await segon).toMatchObject({ seq: abans + 3, usuariId: 'jo-A' });
    await dona(1, 'Resposta a la segona');
    expect((await missatges()).slice(-4)).toEqual([
      [abans + 1, 'jo-A', 'Primera pregunta'],
      [abans + 2, IAIA_ID, 'Resposta a la primera'],
      [abans + 3, 'jo-A', 'Segona pregunta'],
      [abans + 4, IAIA_ID, 'Resposta a la segona']
    ]);
    expect(mock.resposta.mock.calls.map(([pregunta]) => pregunta)).toEqual(['Primera pregunta', 'Segona pregunta']);
  });

  it('tres missatges seguits també respecten l’ordre en què s’han escrit', async () => {
    const abans = await ultimaSeq();
    const enviats = ['A', 'B', 'C'].map((text) => localXat.enviaMissatge(FIL, { id: `t-${text}`, text }, SEED));
    await buida();
    expect(mock.respostes).toHaveLength(1);
    await dona(0, 'rA');
    await dona(1, 'rB');
    await dona(2, 'rC');
    await Promise.all(enviats);
    await esperaLaIAIA();
    expect((await missatges()).slice(-6).map(([seq, , text]) => [seq - abans, text])).toEqual([
      [1, 'A'], [2, 'rA'], [3, 'B'], [4, 'rB'], [5, 'C'], [6, 'rC']
    ]);
  });

  it('un reintent del mateix id mentre espera no entra dues vegades ni demana dues respostes', async () => {
    const abans = await ultimaSeq();
    await localXat.enviaMissatge(FIL, { id: 'q-1', text: 'Primera' }, SEED);
    const segon = localXat.enviaMissatge(FIL, { id: 'q-2', text: 'Segona' }, SEED);
    const reintent = localXat.enviaMissatge(FIL, { id: 'q-2', text: 'Segona' }, SEED);
    await buida();
    await dona(0, 'r1');
    /* El reintent no espera la resposta de la segona: ja ha entrat. */
    const [original, repetit] = await Promise.all([segon, reintent]);
    expect(repetit).toEqual(original);
    await dona(1, 'r2');
    expect((await missatges()).slice(-4).map(([seq, , text]) => [seq - abans, text])).toEqual([[1, 'Primera'], [2, 'r1'], [3, 'Segona'], [4, 'r2']]);
    expect(mock.resposta).toHaveBeenCalledTimes(2);
  });

  it('un sol avís per pregunta, quan arriba la resposta i amb el seu seq', async () => {
    const callback = vi.fn();
    await localXat.subscribeToXat(FIL, callback);
    const pregunta = await localXat.enviaMissatge(FIL, { id: 'avis-1', text: 'Hola, Wiki' }, SEED);
    await buida();
    expect(callback).not.toHaveBeenCalled();
    await dona(0, 'r1');
    expect(callback.mock.calls).toEqual([[null, { tipus: 'nous', filId: FIL, seq: pregunta.seq + 1 }]]);
  });
});

describe('la reserva', () => {
  it.each([
    ['sense cap document (null)', (i) => dona(i, null)],
    ['amb un text buit', (i) => dona(i, '   ')],
    ['si la Wiki falla', async (i) => { mock.respostes[i].rebutja(new Error('xarxa')); await buida(); }]
  ])('%s, la IAIA contesta RESPOSTA_IAIA', async (_cas, contesta) => {
    const pregunta = await localXat.enviaMissatge(FIL, { id: 'r-1', text: 'Pedra seca' }, SEED);
    await contesta(0);
    expect((await missatges()).at(-1)).toEqual([pregunta.seq + 1, IAIA_ID, RESPOSTA_IAIA]);
  });

  it('si la funció de la Wiki peta abans de prometre res, també RESPOSTA_IAIA', async () => {
    mock.resposta = vi.fn(() => { throw new Error('síncron'); });
    const pregunta = await localXat.enviaMissatge(FIL, { id: 'r-2', text: 'Pedra seca' }, SEED);
    await esperaLaIAIA();
    expect((await missatges()).at(-1)).toEqual([pregunta.seq + 1, IAIA_ID, RESPOSTA_IAIA]);
  });

  it('una resposta d’un magatzem ja oblidat no s’escriu ni avisa', async () => {
    await localXat.enviaMissatge(FIL, { id: 'vell', text: 'Abans de reiniciar' }, SEED);
    const pendent = mock.respostes[0];
    reiniciaLocalXat();
    const callback = vi.fn();
    await localXat.subscribeToXat(FIL, callback);
    pendent.resol('Resposta vella');
    await buida();
    expect(callback).not.toHaveBeenCalled();
    expect((await missatges()).some(([, , text]) => text === 'Resposta vella')).toBe(false);
  });
});

describe('fora del fil de la IAIA', () => {
  it('un altre fil no espera la IAIA ni li demana res', async () => {
    await localXat.enviaMissatge(FIL, { id: 'iaia-1', text: 'Pensa-ho' }, SEED);
    const general = await localXat.enviaMissatge(XAT_SEED_IDS.filGeneral, { id: 'general-1', text: 'Bon dia, veïns' }, SEED);
    expect(general).toMatchObject({ usuariId: 'jo-A', text: 'Bon dia, veïns' });
    expect(mock.resposta).toHaveBeenCalledTimes(1);
    expect(mock.resposta).toHaveBeenCalledWith('Pensa-ho');
  });
});
