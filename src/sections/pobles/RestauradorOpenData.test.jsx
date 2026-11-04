import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import RestauradorOpenData, { TEXTOS_RESTAURADOR } from './RestauradorOpenData.jsx';
import { exportaMunicipiOpenData } from '../../data/exportaMunicipiOpenData.js';
import { preparaSnapshotOpenDataPublic } from '../../../tooling/seo/snapshot-opendata-public.mjs';
import { creaAdaptadorLocal } from '../../data/local/adaptadorLocal.js';
import { CAPACITATS } from '../../data/contracte.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const TX = Object.fromEntries(Object.entries(TEXTOS_RESTAURADOR).map(([k, [, v]]) => [k, v]));
const MUNICIPI = { slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' };
const creats = [];
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); });
afterEach(async () => { cleanup(); for (const a of creats.splice(0)) await a.destroy(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function paquet() {
  const s = preparaSnapshotOpenDataPublic({ feedPosts: [{ id: 'node-zero-mac-mini-m4', title: 'Node 0', body: 'A La Torre de les Maçanes.', author_entity_id: 'socdepoble' }], events: [], ara: '2026-11-03T15:33:02Z' });
  return exportaMunicipiOpenData(s.entrada, { subtle: webcrypto.subtle });
}
function local() {
  const a = creaAdaptadorLocal({ mode: 'local', dades: { entitats: [] }, restauracioOberta: true }); creats.push(a);
  return { ...a, teCapacitat: c => CAPACITATS[c]?.every(k => typeof a[k] === 'function') || false, restauraDadesObertes: vi.fn(a.restauraDadesObertes) };
}
function aporta(p, sha = p.sha256, bytes = p.zip) {
  const file = new File([bytes], 'poble.zip', { type: 'application/zip' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
  fireEvent.change(screen.getByLabelText(TX.fitxer), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText(TX.sha), { target: { value: sha } });
}
async function comprova() {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: TX.comprova })); });
  await screen.findByRole('button', { name: TX.comprova });
}
const props = port => ({ port, municipi: MUNICIPI, scopeKey: 'persona::tenant-a::local', config: { tenantId: 'a', dataMode: 'local' }, autoritzat: true });

test('preview amb ZIP i SHA reals, després restaura al port local real sense cap petició remota', async () => {
  const p = await paquet(), port = local(), fetch = vi.spyOn(globalThis, 'fetch');
  render(<RestauradorOpenData {...props(port)} />); aporta(p); await comprova();
  expect(await screen.findByText(TX.valid)).toBeTruthy();
  expect(port.restauraDadesObertes).not.toHaveBeenCalled();
  expect(screen.getByText('Notícies: 1')).toBeTruthy();
  expect(screen.getByText('Memòria oral revisada: 0')).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: TX.restaura })); });
  expect(await screen.findByText(TX.restaurat)).toBeTruthy();
  expect(port.restauraDadesObertes).toHaveBeenCalledOnce();
  expect((await port.llegixDadesObertes({ poble: MUNICIPI })).memoria).toHaveLength(1);
  expect(fetch).not.toHaveBeenCalled();
});
test('SHA incorrecte i ZIP manipulat rebutgen abans de qualsevol escriptura', async () => {
  const p = await paquet(), port = local(); render(<RestauradorOpenData {...props(port)} />);
  aporta(p, '0'.repeat(64)); await comprova(); expect(await screen.findByText(TX.error)).toBeTruthy();
  const mal = p.zip.slice(); mal[Math.floor(mal.length / 2)] ^= 1;
  aporta(p, p.sha256, mal); await comprova(); expect(await screen.findByText(TX.error)).toBeTruthy();
  expect(screen.queryByText(TX.valid)).toBeNull(); expect(port.restauraDadesObertes).not.toHaveBeenCalled();
});
test('descartar el paquet elimina bytes, resum i SHA sense cap escriptura, i permet tornar-lo a comprovar', async () => {
  const p = await paquet(), port = local();
  render(<RestauradorOpenData {...props(port)} />); aporta(p); await comprova();
  expect(await screen.findByText(TX.valid)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: TX.descarta }));
  expect(screen.queryByText(TX.valid)).toBeNull();
  expect(screen.queryByRole('button', { name: TX.restaura })).toBeNull();
  expect(screen.getByLabelText(TX.sha).value).toBe('');
  expect(screen.getByRole('button', { name: TX.comprova }).disabled).toBe(true);
  expect(port.restauraDadesObertes).not.toHaveBeenCalled();
  aporta(p); await comprova(); expect(await screen.findByText(TX.valid)).toBeTruthy();
  expect(port.restauraDadesObertes).not.toHaveBeenCalled();
});
test('un altre municipi, un usuari sense permís i un port remot sense capacitat només poden previsualitzar', async () => {
  const p = await paquet(), port = local();
  const { rerender } = render(<RestauradorOpenData {...props(port)} municipi={{ slug: 'xixona', nom: 'Xixona' }} />);
  aporta(p); await comprova(); expect(await screen.findByText(TX.altreMunicipi)).toBeTruthy(); expect(screen.queryByRole('button', { name: TX.restaura })).toBeNull();
  rerender(<RestauradorOpenData {...props(port)} autoritzat={false} />); aporta(p); await comprova();
  expect(await screen.findByText(TX.valid)).toBeTruthy(); expect(screen.queryByRole('button', { name: TX.restaura })).toBeNull();
  rerender(<RestauradorOpenData {...props(port)} port={{ teCapacitat: () => false }} />); aporta(p); await comprova();
  expect(await screen.findByText(TX.valid)).toBeTruthy(); expect(screen.getByText(TX.senseCapacitat)).toBeTruthy();
  expect(screen.queryByRole('button', { name: TX.restaura })).toBeNull(); expect(port.restauraDadesObertes).not.toHaveBeenCalled();
});
test('canviar tenant o àmbit durant la lectura elimina bytes i resultats antics', async () => {
  const p = await paquet(), port = local(); let allibera;
  const file = new File([p.zip], 'poble.zip'); Object.defineProperty(file, 'arrayBuffer', { value: () => new Promise(resolve => { allibera = resolve; }) });
  const { rerender } = render(<RestauradorOpenData {...props(port)} />);
  fireEvent.change(screen.getByLabelText(TX.fitxer), { target: { files: [file] } }); fireEvent.change(screen.getByLabelText(TX.sha), { target: { value: p.sha256 } });
  fireEvent.click(screen.getByRole('button', { name: TX.comprova }));
  rerender(<RestauradorOpenData {...props(port)} config={{ tenantId: 'b', dataMode: 'local' }} />);
  await act(async () => { allibera(p.zip.buffer); });
  expect(screen.queryByText(TX.valid)).toBeNull(); expect(screen.getByLabelText(TX.sha).value).toBe(''); expect(port.restauraDadesObertes).not.toHaveBeenCalled();
});
test('el canvi d’àmbit avorta l’escriptura cooperativa en vol i no anuncia èxit antic', async () => {
  const p = await paquet(); let allibera, senyal; let escrit = false;
  const port = { teCapacitat: () => true, restauraDadesObertes: vi.fn(async (_lot, { signal }) => { senyal = signal; await new Promise(resolve => { allibera = resolve; }); signal.throwIfAborted(); escrit = true; }) };
  const { rerender } = render(<RestauradorOpenData {...props(port)} />); aporta(p); await comprova();
  fireEvent.click(screen.getByRole('button', { name: TX.restaura })); await waitFor(() => expect(senyal).toBeTruthy());
  rerender(<RestauradorOpenData {...props(port)} scopeKey="altra-persona::tenant-a::local" />);
  expect(senyal.aborted).toBe(true); await act(async () => { allibera(); });
  expect(escrit).toBe(false); expect(screen.queryByText(TX.restaurat)).toBeNull(); expect(screen.queryByText(TX.valid)).toBeNull();
});
test('un rebuig de permisos del backend no es presenta com a restauració correcta', async () => {
  const p = await paquet(), port = local(); port.restauraDadesObertes.mockRejectedValue(Object.assign(new Error('no'), { code: 'sense-permis' }));
  render(<RestauradorOpenData {...props(port)} />); aporta(p); await comprova();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: TX.restaura })); });
  expect(await screen.findByText(TX.errorRestauracio)).toBeTruthy(); expect(screen.queryByText(TX.restaurat)).toBeNull();
});
test('tots els textos del restaurador estan als cinc idiomes', () => {
  for (const dict of [CA, ES, EN, EU, GL]) for (const [key] of Object.values(TEXTOS_RESTAURADOR)) expect(dict[key], key).toEqual(expect.any(String));
});
