import { afterEach, expect, it, vi } from 'vitest';
import { CONTRACTE_NUCLI } from './contracte.js';
import * as port from './backendPort.js';
import { CODI_BACKEND_INABASTABLE } from './errorsBackend.js';
function backend() {
  const calls = [];
  const impl = Object.fromEntries(CONTRACTE_NUCLI.map(n => [n, vi.fn()]));
  impl.getCurrentUser = () => ({ id: 'owner' });
  impl.loadNotes = vi.fn(() => { throw new Error('No GET preflight'); });
  impl.revocaPublicacioMur = vi.fn();
  impl.drenaRevocacionsMur = vi.fn();
  impl.encuaRevocacioNotaMur = async (...args) => { calls.push(args); };
  for (const n of ['esborraNota', 'mouNota', 'updateNote']) impl[n] = vi.fn(async () => ({ id: 'n' }));
  return { impl, calls };
}
afterEach(() => port.destroy());
it('la mutació reeixida usa la transacció del servidor, sense preflight ni revocació anticipada', async () => {
  const { impl, calls } = backend(); port.setBackendImplementation(impl);
  await port.esborraNota('n', 1, {}); await port.mouNota('n', 'paperera', 1, {});
  await port.updateNote('n', { isPublished: false }, 1, {});
  expect(impl.loadNotes).not.toHaveBeenCalled(); expect(impl.revocaPublicacioMur).not.toHaveBeenCalled(); expect(calls).toEqual([]);
});
const ACTE = '88000000-0000-4000-8000-000000000001';
it('transport fallit encua ID+CAS+acte sense GET i continua informant que DELETE ha fallat', async () => {
  const { impl, calls } = backend();
  impl.esborraNota = async () => { throw Object.assign(new Error('offline'), { codi: CODI_BACKEND_INABASTABLE }); };
  port.setBackendImplementation(impl);
  const config = { tenantId: 't', revocaPublicacioId: ACTE };
  await expect(port.esborraNota('n', 7, config)).rejects.toMatchObject({ revocacioPendent: true });
  expect(calls).toEqual([['n', 7, config, ACTE]]); expect(impl.loadNotes).not.toHaveBeenCalled();
});
it('403/409 conserven voluntat d’una nota publicada, i una revisió invàlida no entra al diari', async () => {
  for (const status of [403, 409]) {
    const { impl, calls } = backend(); impl.esborraNota = async () => { throw Object.assign(new Error('rejected'), { status }); };
    const config = { revocaPublicacioId: ACTE };
    port.setBackendImplementation(impl); await expect(port.esborraNota('n', 1, config)).rejects.toMatchObject({ status, revocacioPendent:true }); expect(calls).toEqual([['n',1,config,ACTE]]);
  }
  const { impl, calls } = backend(); impl.esborraNota = async () => { throw Object.assign(new Error('offline'), { codi: CODI_BACKEND_INABASTABLE }); };
  port.setBackendImplementation(impl); await expect(port.esborraNota('n', undefined, { revocaPublicacioId: ACTE })).rejects.toThrow(); expect(calls).toEqual([]);
});
/* Gauntlet R22 (dades-02, notes-02) · Sense acte publicat no hi ha res a retirar: cap fila que el servidor no podria confirmar mai. */
it('una nota mai publicada (sense acte) no entra al diari, ni amb transport caigut ni amb 403/404/409', async () => {
  for (const error of [Object.assign(new Error('offline'), { codi: CODI_BACKEND_INABASTABLE }), ...[403, 404, 409].map(status => Object.assign(new Error('rejected'), { status }))]) {
    const { impl, calls } = backend();
    impl.esborraNota = async () => { throw error; }; impl.mouNota = async () => { throw error; };
    port.setBackendImplementation(impl);
    await expect(port.esborraNota('n', 1, {})).rejects.toBe(error);
    await expect(port.mouNota('n', 'paperera', 1, {})).rejects.toBe(error);
    expect(error.revocacioPendent).toBeUndefined();
    expect(calls).toEqual([]);
  }
});
/* Gauntlet R22 (dades-04) · Si encuar falla, l'error que arriba al Bloc és l'original (el 409 que fa refrescar). */
it('si encuar la retirada falla, es llança l’error ORIGINAL, sense revocacioPendent i amb revocacioNoPersistida', async () => {
  const { impl } = backend();
  const conflicte = Object.assign(new Error('Conflicte de concurrència de revisió.'), { status: 409 });
  impl.mouNota = async () => { throw conflicte; };
  impl.encuaRevocacioNotaMur = async () => { throw Object.assign(new Error('No hi ha emmagatzematge persistent per a la revocació.'), { codi: 'MUR_REVOCACIO_PERSISTENCIA' }); };
  port.setBackendImplementation(impl);
  await expect(port.mouNota('n', 'paperera', 3, { revocaPublicacioId: ACTE })).rejects.toBe(conflicte);
  expect(conflicte).toMatchObject({ status: 409, revocacioNoPersistida: 'MUR_REVOCACIO_PERSISTENCIA' });
  expect(conflicte.revocacioPendent).toBeUndefined();
});
it('un adaptador que diu que no hi ha res a encuar (llavor o local) no marca cap retirada pendent', async () => {
  const { impl } = backend();
  const noTrobada = Object.assign(new Error('No trobada'), { status: 404 });
  impl.esborraNota = async () => { throw noTrobada; };
  impl.encuaRevocacioNotaMur = async (id) => ({ id, pendent: false });
  port.setBackendImplementation(impl);
  await expect(port.esborraNota('n', 2, { revocaPublicacioId: ACTE })).rejects.toBe(noTrobada);
  expect(noTrobada.revocacioPendent).toBeUndefined();
});
it('canvi de compte o backend durant el transport no encua una acció aliena i allibera listeners', async () => {
  const { impl, calls } = backend(); let user = 'owner'; impl.getCurrentUser = () => ({ id: user });
  impl.destroy = vi.fn();
  impl.esborraNota = async () => { user = 'other'; throw Object.assign(new Error('offline'), { codi: CODI_BACKEND_INABASTABLE }); };
  port.setBackendImplementation(impl); await expect(port.esborraNota('n', 1, {})).rejects.toThrow('offline'); expect(calls).toEqual([]);
  port.setBackendImplementation(backend().impl); expect(impl.destroy).toHaveBeenCalledOnce();
});

it('el rebut d’una retirada antiga ja consumada no encua l’acte nou',async()=>{
 const {impl,calls}=backend();impl.updateNote=async()=>{throw Object.assign(new Error('L’acte antic ja és retirat; hi ha una publicació nova.'),{status:409,revocacioNoReencuar:true});};
 port.setBackendImplementation(impl);
 await expect(port.updateNote('n',{isPublished:false,revocaPublicacioId:'act1'},9,{})).rejects.toMatchObject({revocacioNoReencuar:true});
 expect(calls).toEqual([]);
});
