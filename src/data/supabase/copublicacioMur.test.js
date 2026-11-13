import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';

const simulacio = vi.hoisted(() => ({ user: '33000000-0000-4000-8000-000000000001', epoch: 1, request: vi.fn() }));
vi.mock('./runtime.js', () => ({
  getCurrentUser: () => simulacio.user ? { id: simulacio.user } : null,
  getResolvedConfig: config => ({ supabaseUrl: config.supabaseUrl ?? 'https://example.supabase.co',
    tenantId: config.tenantId ?? '11000000-0000-4000-8000-000000000001',
    hasSupabaseConfig: true, runtimeDataMode: config.dataMode ?? 'remote' }),
  request: (...args) => simulacio.request(...args)
}));
vi.mock('../identitat.js', () => ({ get versioSessio() { return simulacio.epoch; } }));
import * as provider from './copublicacioMur.js';
import { esPublicacioEsborrada, filtraPublicacionsEsborrades } from '../publicacionsEsborrades.js';

const ID = '44000000-0000-4000-8000-000000000001';
const CONFIG = Object.freeze({ tenantId: '11000000-0000-4000-8000-000000000001' });
const offline = () => Object.assign(new Error('offline'), { codi: 'servidor-inabastable' });
const rows = () => globalThis.indexedDB.files('sdp-copublicacio-mur-r21', 'revocacions').map(r => r.valor);
let fresh;
beforeEach(() => {
  simulacio.user = '33000000-0000-4000-8000-000000000001';
  simulacio.epoch = 1;
  simulacio.request.mockReset();
  vi.stubGlobal('indexedDB', creaIdbFalsEstructurat());
  vi.stubGlobal('window', new EventTarget());
});
afterEach(() => { provider.destroy(); fresh?.destroy(); fresh = null; vi.unstubAllGlobals(); });

async function awaitingAck(change) {
  let release;
  simulacio.request.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const result = provider.revocaPublicacioMur(ID, CONFIG);
  await vi.waitFor(() => expect(simulacio.request).toHaveBeenCalledOnce());
  change();
  release(true);
  await expect(result).rejects.toMatchObject({ name: 'AbortError' });
  expect(rows()[0].pending).toBe(true);
}

describe('R21 · provider de revocació, ACK i cicle de vida', () => {
  it('envia només POST al port amb ID+poble; confirma únicament ACK true i deixa tombstone', async () => {
    simulacio.request.mockResolvedValue(true);
    await expect(provider.revocaPublicacioMur(ID, CONFIG)).resolves.toEqual({ id: ID, pendent: false });
    expect(simulacio.request).toHaveBeenCalledExactlyOnceWith('/rest/v1/rpc/revoca_publicacio_mur', CONFIG, {
      method: 'POST', body: { p_id: ID, p_tenant_id: CONFIG.tenantId }
    });
    expect(rows()[0].pending).toBe(false);
  });
  it.each([false, null, {}])('ACK %j continua pendent i no consumeix la revocació', async ack => {
    simulacio.request.mockResolvedValue(ack);
    await expect(provider.revocaPublicacioMur(ID, CONFIG)).resolves.toEqual({ id:ID, pendent:true });
    expect(rows()[0].pending).toBe(true);
  });
  it.each([403,404,409,500])('HTTP %s es conserva amb retard i es recupera en primer pla', async status => {
    simulacio.request.mockRejectedValueOnce(Object.assign(new Error('provider private body'),{status}));
    await expect(provider.revocaPublicacioMur(ID,CONFIG)).resolves.toEqual({id:ID,pendent:true});
    expect(rows()[0]).toMatchObject({pending:true,attempt:1});
    await provider.drenaRevocacionsMur(CONFIG); expect(simulacio.request).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(rows())).not.toContain('provider private body');
    simulacio.request.mockResolvedValue(true);
    await expect(provider.revocaPublicacioMur(ID,CONFIG)).resolves.toEqual({id:ID,pendent:false});
    expect(simulacio.request).toHaveBeenCalledTimes(2);
  });
  it('A→logout→A mentre arriba un ACK no consumeix la generació anterior', async () => {
    await awaitingAck(() => {
      simulacio.user = null; simulacio.epoch += 1;
      simulacio.user = '33000000-0000-4000-8000-000000000001'; simulacio.epoch += 1;
    });
  });
  it('destroy durant una petició invalida l’ACK sense perdre la cua durable', async () => {
    await awaitingAck(() => provider.destroy());
  });
  it('un provider nou amb una altra generació pot recuperar el mateix àmbit persistent', async () => {
    simulacio.request.mockRejectedValueOnce(offline());
    await provider.revocaPublicacioMur(ID, CONFIG);
    provider.destroy();
    simulacio.epoch += 1;
    vi.resetModules();
    fresh = await import('./copublicacioMur.js');
    simulacio.request.mockResolvedValue(true);
    await expect(fresh.revocaPublicacioMur(ID, CONFIG)).resolves.toEqual({ id:ID, pendent:false });
    expect(rows()[0].pending).toBe(false);
  });
  it('persistència absent o quota fallida no envien xarxa ni anuncien pendent durable', async () => {
    vi.stubGlobal('indexedDB', null);
    await expect(provider.revocaPublicacioMur(ID, CONFIG)).rejects.toThrow('persistent');
    const idb = creaIdbFalsEstructurat(); idb.omplit = true;
    vi.stubGlobal('indexedDB', idb);
    await expect(provider.revocaPublicacioMur(ID, CONFIG)).rejects.toThrow();
    expect(simulacio.request).not.toHaveBeenCalled();
  });
  it('els despertars repetits respecten el retard persistent després del reinici', async () => {
    simulacio.request.mockRejectedValue(offline()); await provider.revocaPublicacioMur(ID,CONFIG);
    provider.destroy(); simulacio.epoch += 1;
    await provider.drenaRevocacionsMur(CONFIG); window.dispatchEvent(new Event('online')); window.dispatchEvent(new Event('focus'));
    await new Promise(resolve=>setTimeout(resolve,20)); expect(simulacio.request).toHaveBeenCalledTimes(1);
  });
  it('la retirada de nota transporta l’acte exacte amb la revisió', async () => {
    const act = ID.replace(/1$/, '2'); await provider.encuaRevocacioNotaMur(ID,7,CONFIG,act);
    simulacio.request.mockResolvedValue(true); await provider.drenaRevocacionsMur(CONFIG);
    expect(simulacio.request).toHaveBeenCalledWith('/rest/v1/rpc/revoca_publicacio_de_nota',CONFIG,{method:'POST',body:{p_id:ID,p_tenant_id:CONFIG.tenantId,p_expected_revision:7,p_publicacio_id:act}});
  });
});

/* Gauntlet R22 (dades-04) · En llavor o local no hi ha cap Mur de servidor que retirar: encuar no llança
   (abans tapava l'error de la mutació amb «Cal una sessió remota») i diu que no queda res pendent. */
describe('R22 · encuaRevocacioNotaMur fora del mode remot', () => {
  it.each(['seed', 'local'])('en mode %s no escriu res al diari i torna { pendent: false }', async dataMode => {
    await expect(provider.encuaRevocacioNotaMur(ID, 3, { ...CONFIG, dataMode })).resolves.toEqual({ id: ID, pendent: false });
    expect(rows()).toEqual([]);
    expect(simulacio.request).not.toHaveBeenCalled();
  });
  it('en remot sense IndexedDB, llança (el port conserva l’error original)', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(provider.encuaRevocacioNotaMur(ID, 3, CONFIG, ID)).rejects.toMatchObject({ codi: 'MUR_REVOCACIO_PERSISTENCIA' });
  });
});

it('R22 · una entrada invàlida rebutja també en llavor o local (contracte del port)', async () => {
  for (const dataMode of ['seed', 'local', 'remote']) {
    await expect(provider.encuaRevocacioNotaMur('no-uuid', -1, { ...CONFIG, dataMode })).rejects.toThrow('invàlid');
    await expect(provider.encuaRevocacioNotaMur(ID, 2, { ...CONFIG, dataMode }, 'no-uuid')).rejects.toThrow('invàlid');
  }
});

/* Gauntlet R22 (ronda 3, dades-03) · loadSections llança el drenatge sense esperar-lo i llig el Mur alhora: la
   lectura pot portar encara la publicació que el drenatge retira tot seguit. Amb l'ACK, i només amb ell, la
   publicació retirada passa al registre d'esborrades i el Mur, el Mercat i l'Agenda la deixen de mostrar. */
describe('R22 (ronda 3) · l’ACK d’un drenatge en segon pla amaga la publicació retirada', () => {
  it('retirada d’una nota amb acte: l’acte (i l’id de la nota) ja no passen el filtre del Mur, el Mercat ni l’Agenda', async () => {
    const nota = '44000000-0000-4000-8000-0000000000a1', acte = '44000000-0000-4000-8000-0000000000a2';
    const llista = [{ id: acte }, { id: 'una-altra' }];
    await provider.encuaRevocacioNotaMur(nota, 7, CONFIG, acte);
    expect(filtraPublicacionsEsborrades(llista, 'mur')).toEqual(llista);
    simulacio.request.mockResolvedValue(true);
    await expect(provider.drenaRevocacionsMur(CONFIG)).resolves.toMatchObject({ pendents: 0 });
    for (const seccio of ['mur', 'mercat', 'events']) expect(filtraPublicacionsEsborrades(llista, seccio)).toEqual([{ id: 'una-altra' }]);
    expect(esPublicacioEsborrada('mur', nota)).toBe(true);
  });
  it('retirada directa d’una publicació del Mur: amb l’ACK, amagada', async () => {
    const id = '44000000-0000-4000-8000-0000000000c1';
    simulacio.request.mockResolvedValue(true);
    await expect(provider.revocaPublicacioMur(id, CONFIG)).resolves.toEqual({ id, pendent: false });
    expect(esPublicacioEsborrada('mur', id)).toBe(true);
  });
  it.each([
    ['un ACK que no és true', '44000000-0000-4000-8000-0000000000d1', '44000000-0000-4000-8000-0000000000d2', () => simulacio.request.mockResolvedValue(false)],
    ['un error del servidor', '44000000-0000-4000-8000-0000000000e1', '44000000-0000-4000-8000-0000000000e2',
      () => simulacio.request.mockRejectedValue(Object.assign(new Error('x'), { status: 500 }))],
  ])('sense ACK (%s), res no s’amaga: la publicació continua visible fins que el servidor la retire', async (_cas, nota, acte, prepara) => {
      await provider.encuaRevocacioNotaMur(nota, 7, CONFIG, acte);
      prepara();
      await provider.drenaRevocacionsMur(CONFIG).catch(() => {});
      expect(simulacio.request).toHaveBeenCalled();
      expect(esPublicacioEsborrada('mur', acte)).toBe(false);
      expect(esPublicacioEsborrada('mur', nota)).toBe(false);
    });
});
