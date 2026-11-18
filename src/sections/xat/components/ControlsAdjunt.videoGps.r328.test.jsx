/** Interaccions DOM amb el compositor real; preparació i neteja de binari
 * controlades només ací. No acredita MediaRecorder ni un mòbil físic. */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { descartaCompartit, lliuraCompartit, triaDestiCompartit } from '../../../config/compartirNatiu.js';
import { errorAdjuntXat } from '../../../data/xatMultimedia.js';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import Compositor from './Compositor.jsx';

const m = vi.hoisted(() => ({ prepara: vi.fn(), amaga: vi.fn() }));
vi.mock('../adjuntLocal.js', async original => ({ ...(await original()), preparaAdjunt: m.prepara, amagaUbicacioAdjunt: m.amaga, mimeDeGravacio: () => null }));
vi.mock('../../../data/backendPort.js', () => ({ quotaXat: vi.fn(), teCapacitat: () => true, descartaAdjuntXat: vi.fn(), urlAdjuntXat: vi.fn() }));
const t = (_, alternativa) => alternativa;
const ORIGINAL = new File(['original'], 'clip.mp4', { type: 'video/mp4' });
const FILE = new Blob(['preparat'], { type: 'video/mp4' });
const LOCATION = { lat: 38.64, lng: -0.49 };
const prepared = () => ({ id: 'primer-id', fitxer: FILE, tipus: 'video', duradaMs: 60_000, ubicacio: LOCATION, senseUbicacio: false });
const deferred = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
let servei;
beforeEach(() => {
  vi.clearAllMocks(); descartaCompartit();
  servei = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 250_000_000 }) };
  m.prepara.mockResolvedValue(prepared());
  m.amaga.mockImplementation(async adjunt => {
    const rest = { ...adjunt }; delete rest.ubicacio;
    return { ...rest, id: 'nou-id-net', fitxer: new Blob(['net'], { type: 'video/mp4' }), senseUbicacio: true };
  });
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:fixture'), revokeObjectURL: vi.fn() });
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); descartaCompartit(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function Barra({ fil = { id: 'A' }, onEnvia = vi.fn(), ...props }) {
  const [valor, setValor] = useState('Text que es conserva');
  return <AppGridContext.Provider value={{ mida: 'ample' }}>
    <ControlsAdjunt fil={fil} servei={servei} usuariId="veí" t={t} onEnvia={onEnvia} {...props}>
      {adjunts => <Compositor fil={fil} valor={valor} onCanvia={setValor} onEnvia={vi.fn()} t={t} adjunts={adjunts} />}
    </ControlsAdjunt>
  </AppGridContext.Provider>;
}
async function select() {
  const selector = await screen.findByLabelText(/Tria una foto o un vídeo de fins a \d+ segons/);
  fireEvent.change(selector, { target: { files: [ORIGINAL] } });
}
const send = () => screen.getByRole('button', { name: 'Envia el fitxer' });
const field = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const hide = () => screen.getByRole('button', { name: 'Amaga el lloc' });

test('compressió visible 0..1 i cancel·lació que ignora progrés i resultat tardans', async () => {
  const job = deferred(); let options;
  m.prepara.mockImplementation((_file, opts) => { options = opts; return job.promise; });
  render(<Barra />); await select();
  expect(typeof options.onProgresCompressio).toBe('function');
  act(() => options.onProgresCompressio(0.42));
  expect(screen.getByRole('status').textContent).toContain('Comprimint vídeo… 42');
  expect(screen.getByRole('progressbar', { name: 'Progrés de la compressió del vídeo' }).value).toBe(0.42);
  act(() => options.onProgresCompressio(NaN));
  expect(screen.getByRole('progressbar').value).toBe(0.42);
  act(() => options.onProgresCompressio(2));
  expect(screen.getByRole('progressbar').value).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
  expect(options.signal.aborted).toBe(true);
  await act(async () => { options.onProgresCompressio(0.9); job.resolve(prepared()); });
  expect(screen.queryByRole('progressbar')).toBeNull(); expect(screen.queryByRole('button', { name: 'Envia el fitxer' })).toBeNull();
  expect(field().value).toBe('Text que es conserva');
});

test('desmuntar aborta la preparació i no crea cap URL per al resultat tardà', async () => {
  const job = deferred(); let options;
  m.prepara.mockImplementation((_file, opts) => { options = opts; return job.promise; });
  const view = render(<Barra />); await select(); view.unmount();
  expect(options.signal.aborted).toBe(true);
  await act(async () => { options.onProgresCompressio(0.9); job.resolve(prepared()); });
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

test('canvi de fil aborta compressió i no pinta la preparació antiga damunt de la nova', async () => {
  const old = deferred(); let options;
  m.prepara.mockImplementationOnce((_file, opts) => { options = opts; return old.promise; });
  const view = render(<Barra />); await select();
  view.rerender(<Barra fil={{ id: 'B' }} />); await select(); await screen.findByRole('button', { name: 'Amaga el lloc' });
  expect(options.signal.aborted).toBe(true);
  await act(async () => { options.onProgresCompressio(0.8); old.resolve({ ...prepared(), id: 'antic-tardà' }); });
  expect(screen.queryByRole('progressbar')).toBeNull(); expect(hide()).toBeTruthy();
});

test('píndola GPS i opt-out netegen el binari amb ID nou, conservant principal i peu compartit', async () => {
  lliuraCompartit({ fitxers: [ORIGINAL], text: 'Peu compartit' }); triaDestiCompartit('A');
  const onEnvia = vi.fn().mockRejectedValue(new Error('Xarxa temporal'));
  render(<Barra onEnvia={onEnvia} />);
  await screen.findByRole('button', { name: 'Amaga el lloc' });
  expect(screen.getByText(/S’inclourà la ubicació/)).toBeTruthy();
  fireEvent.click(hide());
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Amaga el lloc' })).toBeNull());
  expect(m.amaga).toHaveBeenCalledWith(expect.objectContaining({ id: 'primer-id', ubicacio: LOCATION }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(field().value).toBe('Text que es conserva');
  expect(screen.getByRole('textbox', { name: 'Text del fitxer (opcional)' }).value).toBe('Peu compartit');
  fireEvent.click(send()); await screen.findByRole('alert');
  expect(onEnvia.mock.calls[0][1]).toMatchObject({ id: 'nou-id-net', senseUbicacio: true, text: 'Peu compartit\n\nText que es conserva' });
  expect(Object.hasOwn(onEnvia.mock.calls[0][1], 'ubicacio')).toBe(false);
});

test('fallada de neteja conserva el preparat i tancar l’avís només lleva l’error', async () => {
  m.amaga.mockRejectedValue(errorAdjuntXat('ubicacio-no-eliminable'));
  const onEnvia = vi.fn().mockRejectedValue(new Error('Reintent'));
  render(<Barra onEnvia={onEnvia} />); await select(); await screen.findByRole('button', { name: 'Amaga el lloc' });
  fireEvent.click(hide()); await screen.findByRole('alert');
  expect(screen.getByText(/S’inclourà la ubicació/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tanca l’avís' }));
  expect(screen.queryByRole('alert')).toBeNull(); expect(field().value).toBe('Text que es conserva');
  expect(hide().disabled).toBe(false);
  fireEvent.click(send()); await screen.findByRole('alert');
  expect(onEnvia.mock.calls[0][1]).toMatchObject({ id: 'primer-id', fitxer: FILE, ubicacio: LOCATION });
});

test('mentre amaga el lloc no envia i un canvi de fil ignora la neteja tardana', async () => {
  const job = deferred(); m.amaga.mockReturnValue(job.promise); const onEnvia = vi.fn();
  const view = render(<Barra onEnvia={onEnvia} />); await select(); await screen.findByRole('button', { name: 'Amaga el lloc' });
  fireEvent.click(hide()); fireEvent.click(send()); expect(onEnvia).not.toHaveBeenCalled();
  const signal = m.amaga.mock.calls[0][1].signal;
  view.rerender(<Barra fil={{ id: 'B' }} onEnvia={onEnvia} />);
  expect(signal.aborted).toBe(true);
  await act(async () => job.resolve({ ...prepared(), id: 'net-tardà', ubicacio: undefined }));
  expect(screen.queryByRole('button', { name: 'Envia el fitxer' })).toBeNull(); expect(screen.queryByRole('alert')).toBeNull();
});

test('després del primer intent incert, opt-out queda bloquejat i el retry conserva ID/GPS', async () => {
  const onEnvia = vi.fn().mockRejectedValue(new Error('ACK perdut'));
  render(<Barra onEnvia={onEnvia} />); await select(); await screen.findByRole('button', { name: 'Amaga el lloc' });
  fireEvent.click(send()); await screen.findByRole('alert');
  expect(hide().disabled).toBe(true); expect(hide().title).toContain('El primer intent pot haver arribat al servidor');
  fireEvent.click(hide()); expect(m.amaga).not.toHaveBeenCalled();
  fireEvent.click(send()); await waitFor(() => expect(onEnvia).toHaveBeenCalledTimes(2));
  expect(onEnvia.mock.calls[0][1]).toEqual(onEnvia.mock.calls[1][1]);
});

test('tancar l’avís respecta el focus alié i retorna al primari si el tenia el botó, sense alterar el retry', async () => {
  const onEnvia = vi.fn().mockRejectedValue(new Error('Xarxa temporal'));
  render(<Barra onEnvia={onEnvia} />); await select(); await screen.findByRole('button', { name: 'Amaga el lloc' });
  fireEvent.click(send()); await screen.findByRole('alert');
  const payload = onEnvia.mock.calls[0][1];
  field().focus(); fireEvent.click(screen.getByRole('button', { name: 'Tanca l’avís' }));
  expect(document.activeElement).toBe(field()); expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.click(send()); await screen.findByRole('alert');
  const close = screen.getByRole('button', { name: 'Tanca l’avís' }); close.focus(); fireEvent.click(close);
  expect(document.activeElement).toBe(send()); expect(field().value).toBe('Text que es conserva');
  expect(onEnvia.mock.calls[1][1]).toEqual(payload); expect(screen.getByText(/S’inclourà la ubicació/)).toBeTruthy();
  expect(servei.quotaXat).toHaveBeenCalledTimes(3);
});

test('tancar amb teclat un avís de preparació torna al més i conserva text i quota', async () => {
  m.prepara.mockRejectedValue(errorAdjuntXat('video-illegible'));
  render(<Barra />); await select(); await screen.findByRole('alert');
  const close = screen.getByRole('button', { name: 'Tanca l’avís' }); close.focus(); fireEvent.click(close);
  const plus = screen.getByRole('button', { name: 'Adjunta' });
  expect(document.activeElement).toBe(plus); expect(field().value).toBe('Text que es conserva');
  expect(servei.quotaXat).toHaveBeenCalledOnce();
  fireEvent.click(plus); expect(screen.getByText('0,0 de 250 MB del xat')).toBeTruthy();
});

test('vídeo sense coordenades i amb binari no verificat conserva l’avís honest', async () => {
  const noLocation = prepared(); delete noLocation.ubicacio; m.prepara.mockResolvedValue(noLocation);
  render(<Barra />); await select(); await screen.findByRole('button', { name: 'Envia el fitxer' });
  expect(screen.getByText(/Este vídeo s’envia tal com és/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Amaga el lloc' })).toBeNull();
});
