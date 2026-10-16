// @vitest-environment node
/* Auditoria de Codex 261016 (P2, baixa fallida del canal) · Les proves de
   xat.test.js simulen el client amb un doble. Ací la baixa passa pel client de
   Realtime instal·lat, @supabase/realtime-js 2.112.4 sobre @supabase/phoenix
   0.4.5: la propietat del canal, removeChannel i el teardown són els de veres.
   Només s'injecta la resposta del primer `leave`, com a la reproducció de Codex
   (tests/gauntlet-codex-concurrency.stress.mjs), i `subscribe` és inert: el
   client no obri cap WebSocket.
   Fonts: RealtimeClient.ts:370-378 (removeChannel només fa teardown amb 'ok'),
   RealtimeClient.ts:462-475 (channel() torna el canal que encara hi haja amb el
   mateix tema), RealtimeChannel.ts:354-356 (en tancar-se, el canal ix del
   client) i phoenix channel.js:238-254 (leave; un canal que no està unit es
   tanca en local amb 'ok', sense servidor). */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RealtimeClient } from '@supabase/realtime-js';

const mock = vi.hoisted(() => ({ client: null }));
vi.mock('./config.js', () => ({ getClient: async () => mock.client }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => ({ id: 'A' }), getDefaultUserId: () => 'A' }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: (config) => ({ ...config, runtimeDataMode: 'remote' }),
  generateUUID: () => 'uuid-generat'
}));

import { subscribeToXat, unsubscribeFromXat } from './xat.js';

const REMOT = { tenantId: '00000000-0000-4000-8000-000000000000' };
const buidaCua = () => new Promise((r) => { setTimeout(r, 0); });
/* Comparar per identitat: un canal porta el socket dins i el diff d'una fallada seria il·legible. */
const esperaCanals = (client, ...canals) => {
  const ara = client.getChannels();
  expect(ara).toHaveLength(canals.length);
  canals.forEach((canal, i) => expect(ara[i]).toBe(canal));
};

/* Client aïllat per prova. Cada `leave` gasta la resposta següent de la llista;
   esgotada la llista, el `leave` és el del SDK. */
function clientAmbBaixes(respostes) {
  const client = new RealtimeClient('ws://127.0.0.1:1/realtime/v1', { params: { apikey: 'nomes-proves' } });
  const creaCanal = client.channel.bind(client);
  const estat = { intents: 0, client, totes: vi.spyOn(client, 'removeAllChannels') };
  client.channel = (...args) => {
    const canal = creaCanal(...args);
    const leaveDelSdk = canal.unsubscribe.bind(canal);
    canal.subscribe = () => canal;
    canal.unsubscribe = async (...opcions) => {
      estat.intents += 1;
      return respostes.length ? respostes.shift() : leaveDelSdk(...opcions);
    };
    return canal;
  };
  mock.client = client;
  return estat;
}

let actiu = null;
afterEach(async () => {
  if (!actiu) return;
  /* L'adaptador mai crida removeAllChannels; la neteja del client aïllat de la prova, sí. */
  actiu.totes.mockRestore();
  await actiu.client.removeAllChannels();
  actiu = null;
});

describe('baixa del canal del xat amb el client de Realtime instal·lat', () => {
  it('el desmuntatge dona de baixa una vegada: darrere d’un error, un sol intent més allibera el canal', async () => {
    actiu = clientAmbBaixes(['error']);
    const { subscription } = await subscribeToXat('fil', () => {}, REMOT);
    esperaCanals(actiu.client, subscription);
    // XatContext no reintenta: avisa a la consola i se'n va.
    await expect(unsubscribeFromXat(subscription)).rejects.toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    await buidaCua();
    expect(actiu.client.getChannels()).toHaveLength(0);
    expect(actiu.intents).toBe(2);
    // Tornar al mateix fil obri un canal nou, no el retingut.
    const { subscription: nova } = await subscribeToXat('fil', () => {}, REMOT);
    expect(nova).not.toBe(subscription);
    esperaCanals(actiu.client, nova);
    expect(actiu.totes).not.toHaveBeenCalled();
  });

  it('el reintent de qui crida s’afig a l’intent acotat: dos intents en total, mai tres', async () => {
    actiu = clientAmbBaixes(['error']);
    const { subscription } = await subscribeToXat('fil', () => {}, REMOT);
    await expect(unsubscribeFromXat(subscription)).rejects.toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    await expect(unsubscribeFromXat(subscription)).resolves.toBeUndefined();
    await buidaCua();
    expect(actiu.intents).toBe(2);
    expect(actiu.client.getChannels()).toHaveLength(0);
    expect(actiu.totes).not.toHaveBeenCalled();
  });

  it('si el segon intent també falla, no n’hi ha cap més i el propietari queda per a un reintent explícit', async () => {
    actiu = clientAmbBaixes(['error', 'error']);
    const { subscription } = await subscribeToXat('fil', () => {}, REMOT);
    await expect(unsubscribeFromXat(subscription)).rejects.toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    await buidaCua();
    await buidaCua();
    expect(actiu.intents).toBe(2);
    esperaCanals(actiu.client, subscription);
    await expect(unsubscribeFromXat(subscription)).resolves.toBeUndefined();
    expect(actiu.intents).toBe(3);
    expect(actiu.client.getChannels()).toHaveLength(0);
    expect(actiu.totes).not.toHaveBeenCalled();
  });

  it('una subscripció aliena del mateix client no es toca en cap intent', async () => {
    actiu = clientAmbBaixes(['error']);
    const aliena = actiu.client.channel('una-altra-cosa');
    const { subscription } = await subscribeToXat('fil', () => {}, REMOT);
    await expect(unsubscribeFromXat(subscription)).rejects.toMatchObject({ code: 'CANAL_NO_TANCAT' });
    await buidaCua();
    esperaCanals(actiu.client, aliena);
    expect(actiu.totes).not.toHaveBeenCalled();
  });
});
