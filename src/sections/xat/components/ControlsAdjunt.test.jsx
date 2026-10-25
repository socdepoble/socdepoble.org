import '../../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { ERRORS_ADJUNT_XAT, errorAdjuntXat } from '../../../data/xatMultimedia.js';
const m = vi.hoisted(() => ({ user: 'A', preparaAdjunt: vi.fn(), gravaVeu: vi.fn() }));
vi.mock('../adjuntLocal.js', async (importOriginal) => ({ ...(await importOriginal()), preparaAdjunt: m.preparaAdjunt, gravaVeu: m.gravaVeu, mimeDeGravacio: () => 'audio/mp4' }));
vi.mock('../../../data/backendPort.js', () => ({ quotaXat: vi.fn(), teCapacitat: () => true, urlAdjuntXat: vi.fn(), descartaAdjuntXat: vi.fn() }));
const adjunt = () => ({ id: 'mateix-id', tipus: 'imatge', fitxer: new Blob(['foto'], { type: 'image/webp' }) });
// ADV-MEDIA-4 · La quota desada és per port: cada prova en porta un de nou.
let servei;
const fil = { id: 'fil-A' };
const deferred = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
beforeEach(() => {
  vi.clearAllMocks(); m.user = 'A';
  servei = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 20_000_000 }) };
  m.preparaAdjunt.mockImplementation(async () => adjunt());
  vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:foto-local'), revokeObjectURL: vi.fn() });
  // jsdom no reproduïx: el reproductor de veu de la previsualització només ha de poder cridar-ho.
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });
const tria = async () => {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [new Blob(['original'], { type: 'image/jpeg' })] } });
};
/* Amb micròfon (jsdom no en porta): l'API i el gravador, de mentides. */
const ambMicrofon = () => { vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia: vi.fn() } }); };
test('triar mostra la foto local i exigeix un enviament explícit', async () => {
  const envia = vi.fn().mockResolvedValue([{ id: 'm' }]);
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria();
  expect((await screen.findByAltText('Foto adjunta')).getAttribute('src')).toBe('blob:foto-local');
  expect(envia).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledWith(fil, expect.objectContaining({ id: 'mateix-id' }), expect.objectContaining({ signal: expect.any(AbortSignal) })));
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto-local');
});
test('error de servidor conserva previsualització i mateix ID per a reintentar', async () => {
  const envia = vi.fn().mockRejectedValue(new Error('Servidor temporalment ocupat'));
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await screen.findByText('Servidor temporalment ocupat');
  expect(screen.getByAltText('Foto adjunta')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledTimes(2));
  expect(envia.mock.calls[0][1]).toBe(envia.mock.calls[1][1]);
});
test('canviar d’usuari descarta foto privada i revoca la URL', async () => {
  const envia = vi.fn();
  const vista = render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  m.user = 'B'; vista.rerender(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto-local'); expect(envia).not.toHaveBeenCalled();
});
test('canviar de conversa aborta upload i ignora la confirmació tardana', async () => {
  const tard = deferred(); const envia = vi.fn().mockReturnValue(tard.promise);
  const vista = render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  const signal = envia.mock.calls[0][2].signal;
  vista.rerender(<ControlsAdjunt usuariId={m.user} fil={{ id: 'fil-B' }} servei={servei} onEnvia={envia} />);
  expect(signal.aborted).toBe(true);
  await act(async () => { tard.resolve([{ id: 'm' }]); });
  expect(screen.queryByAltText('Foto adjunta')).toBeNull(); expect(screen.queryByRole('alert')).toBeNull();
});
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-10) · Sense migració, el xat es veu com abans. */
test('un node sense migració no pinta cap panell ni cap alerta', async () => {
  servei.quotaXat.mockRejectedValueOnce(errorAdjuntXat('sense-capacitat'));
  const vista = render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  await waitFor(() => expect(servei.quotaXat).toHaveBeenCalledOnce());
  await act(async () => {});
  expect(vista.container.firstChild).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});
test('sense la capacitat al port, ni tan sols es pregunta la quota', () => {
  const sense = { teCapacitat: () => false, quotaXat: vi.fn() };
  const vista = render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={sense} onEnvia={vi.fn()} />);
  expect(vista.container.firstChild).toBeNull();
  expect(sense.quotaXat).not.toHaveBeenCalled();
});
test('mentre es llig la quota no hi ha cap panell que després desaparega', () => {
  servei.quotaXat.mockReturnValueOnce(new Promise(() => {}));
  const vista = render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  expect(vista.container.firstChild).toBeNull();
});
test('una quota que no es pot llegir es diu sense alerta i es pot tornar a provar', async () => {
  servei.quotaXat.mockRejectedValueOnce(errorAdjuntXat('xarxa'));
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Torna-ho a provar' }));
  expect(screen.queryByRole('alert')).toBeNull();
  await screen.findByRole('button', { name: 'Foto o vídeo' });
  expect(servei.quotaXat).toHaveBeenCalledTimes(2);
});
test('un fitxer pujat sense missatge és recuperable després de recarregar', async () => {
  const serveiAmbPendents = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValueOnce({ usats: 12_000_000, limit: 20_000_000, pendents: [{ id: 'pendent', bytes: 12_000_000 }] }).mockResolvedValue({ usats: 0, limit: 20_000_000, pendents: [] }), descartaAdjuntXat: vi.fn().mockResolvedValue(true) };
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={serveiAmbPendents} onEnvia={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Descarta el fitxer pendent (12,0 MB)' }));
  await waitFor(() => expect(serveiAmbPendents.descartaAdjuntXat).toHaveBeenCalledWith('pendent', expect.objectContaining({ signal: expect.any(AbortSignal) })));
  await waitFor(() => expect(screen.queryByLabelText('Fitxers pendents d’enviar')).toBeNull());
  expect(screen.getByText('0,0 de 20 MB del xat')).toBeTruthy();
});
test('mentre descarta un pendent no permet iniciar una altra preparació', async () => {
  const tard = deferred();
  const serveiAmbPendents = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValueOnce({ usats: 12_000_000, limit: 20_000_000, pendents: [{ id: 'pendent', bytes: 12_000_000 }] }).mockResolvedValue({ usats: 0, limit: 20_000_000, pendents: [] }), descartaAdjuntXat: vi.fn().mockReturnValue(tard.promise) };
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={serveiAmbPendents} onEnvia={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Descarta el fitxer pendent (12,0 MB)' }));
  expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Grava àudio' }).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [new Blob(['foto'], { type: 'image/jpeg' })] } });
  expect(m.preparaAdjunt).not.toHaveBeenCalled();
  await act(async () => { tard.resolve(true); });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
});
/* MEDIA-12 · Si només falla tornar a llegir la quota, l'enviament ja fet no és un error. */
test('un refresc de quota fallit després d’enviar no mostra cap error', async () => {
  const envia = vi.fn().mockResolvedValue([{ id: 'm' }]);
  servei.quotaXat.mockResolvedValueOnce({ usats: 0, limit: 20_000_000 }).mockRejectedValueOnce(errorAdjuntXat('xarxa'));
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(servei.quotaXat).toHaveBeenCalledTimes(2));
  await act(async () => {});
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByAltText('Foto adjunta')).toBeNull();
  expect(screen.getByText('0,0 de 20 MB del xat')).toBeTruthy();
});
/* MEDIA-5 · Els codis del servidor arriben com a text humà, en la llengua de la interfície. */
test('un codi SDP del servidor es diu en la llengua de qui envia', async () => {
  const envia = vi.fn().mockRejectedValue(errorAdjuntXat('SDP-XAT-011'));
  const t = createTranslator('es');
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} t={t} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
  expect(screen.getByText('0,0 de 20 MB del chat')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Elige una foto o un vídeo de hasta 10 segundos'), { target: { files: [new Blob(['original'], { type: 'image/jpeg' })] } });
  fireEvent.click(await screen.findByRole('button', { name: 'Envía el archivo' }));
  expect((await screen.findByRole('alert')).textContent).toBe('En esta conversación no puedes enviar archivos.');
  expect(screen.queryByText(ERRORS_ADJUNT_XAT['SDP-XAT-011'])).toBeNull();
});
test('la quota esgotada diu literalment el text del Mestre', async () => {
  servei.quotaXat.mockResolvedValue({ usats: 19_999_999, limit: 20_000_000 });
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  await tria();
  expect((await screen.findByRole('alert')).textContent).toBe("Espera't, que no tenim més diners per a pagar el servidor... ja et direm quan en pots pujar més!");
});
/* MEDIA-6 · El focus segueix el pas: mai no cau al principi de la pàgina. */
test('triar una foto porta el focus a Envia i enviar-la el torna a Foto o vídeo', async () => {
  const preparant = deferred();
  m.preparaAdjunt.mockReturnValueOnce(preparant.promise);
  const envia = vi.fn().mockResolvedValue([{ id: 'm' }]);
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  const foto = await screen.findByRole('button', { name: 'Foto o vídeo' });
  foto.focus();
  fireEvent.change(screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [new Blob(['original'], { type: 'image/jpeg' })] } });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel·la' })));
  expect(screen.getByRole('status').textContent).toBe('Preparant el fitxer…');
  await act(async () => { preparant.resolve(adjunt()); });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Envia el fitxer' })));
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Foto o vídeo' })));
});
test('gravar: espera el permís amb el seu text, el focus va a Atura i després a Envia', async () => {
  ambMicrofon();
  const permis = deferred(); const nota = deferred();
  m.gravaVeu.mockReturnValueOnce(permis.promise);
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  const grava = await screen.findByRole('button', { name: 'Grava àudio' });
  grava.focus(); fireEvent.click(grava);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel·la' })));
  expect(screen.getByRole('status').textContent).toBe('Esperant el permís del micròfon…');
  await act(async () => { permis.resolve({ atura: vi.fn(), cancella: vi.fn(), resultat: nota.promise }); });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Atura la gravació' })));
  expect(screen.getByRole('status').textContent).toBe('Gravant… Atura per escoltar-la abans d’enviar.');
  await act(async () => { nota.resolve({ id: 'veu', tipus: 'veu', duradaMs: 12_000, fitxer: new Blob(['veu'], { type: 'audio/mp4' }) }); });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Envia el fitxer' })));
  // La previsualització és el reproductor de veu, amb la durada del rellotge.
  expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();
  expect(screen.getByText('0:00 / 0:12')).toBeTruthy();
});
/* MEDIA-11 · El permís denegat pel sistema no culpa ningú. */
test('un micròfon sense permís explica on activar-lo', async () => {
  ambMicrofon();
  m.gravaVeu.mockRejectedValueOnce(errorAdjuntXat('micro-permis'));
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Grava àudio' }));
  expect((await screen.findByRole('alert')).textContent).toBe(ERRORS_ADJUNT_XAT['micro-permis']);
});
/* MEDIA-4 · Un vídeo que no s'ha pogut netejar mai no s'envia en silenci. */
test('un vídeo amb la ubicació sense netejar avisa abans del botó d’enviar', async () => {
  m.preparaAdjunt.mockResolvedValueOnce({ id: 'video', tipus: 'video', duradaMs: 4000, senseUbicacio: false, fitxer: new Blob(['v'], { type: 'video/webm' }) });
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  await tria();
  const envia = await screen.findByRole('button', { name: 'Envia el fitxer' });
  const avis = screen.getByText(/si el mòbil hi va guardar la ubicació/);
  expect(envia.getAttribute('aria-describedby')).toBe(avis.id);
});
test('un vídeo net no porta cap avís', async () => {
  m.preparaAdjunt.mockResolvedValueOnce({ id: 'video', tipus: 'video', duradaMs: 4000, senseUbicacio: true, fitxer: new Blob(['v'], { type: 'video/mp4' }) });
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  await tria();
  expect((await screen.findByRole('button', { name: 'Envia el fitxer' })).getAttribute('aria-describedby')).toBeNull();
  expect(screen.queryByText(/ubicació/)).toBeNull();
});
/* MEDIA-9 · Amb el temps proporcional, una pujada llarga es pot parar. */
test('durant la pujada es pot cancel·lar i Envia continua enfocable', async () => {
  const tard = deferred(); const envia = vi.fn().mockReturnValue(tard.promise);
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  const boto = screen.getByRole('button', { name: 'Envia el fitxer' });
  boto.focus(); fireEvent.click(boto);
  const enviant = await screen.findByRole('button', { name: 'Enviant…' });
  expect(enviant.getAttribute('aria-disabled')).toBe('true');
  expect(document.activeElement).toBe(enviant);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
  expect(envia.mock.calls[0][2].signal.aborted).toBe(true);
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
});
/* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-4) · Conversa munta uns
   controls nous a cada fil: amb la quota ja llegida, el panell hi és des del
   primer frame i la llista no s'encongix quan torna la lectura. */
test('després d’una quota llegida, el fil següent pinta el panell des del primer frame', async () => {
  const primer = render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  await screen.findByText('0,0 de 20 MB del xat');
  primer.unmount();
  servei.quotaXat.mockReturnValueOnce(new Promise(() => {}));
  render(<ControlsAdjunt usuariId={m.user} fil={{ id: 'fil-B' }} servei={servei} onEnvia={vi.fn()} />);
  expect(screen.getByText('0,0 de 20 MB del xat')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Foto o vídeo' })).toBeTruthy();
  expect(servei.quotaXat).toHaveBeenCalledTimes(2);
});
test('la quota desada és de cada persona, i un node sense adjunts l’oblida', async () => {
  const primer = render(<ControlsAdjunt usuariId="A" fil={fil} servei={servei} onEnvia={vi.fn()} />);
  await screen.findByText('0,0 de 20 MB del xat');
  primer.unmount();
  servei.quotaXat.mockReturnValueOnce(new Promise(() => {}));
  const altra = render(<ControlsAdjunt usuariId="B" fil={fil} servei={servei} onEnvia={vi.fn()} />);
  expect(altra.container.firstChild).toBeNull();
  altra.unmount();
  servei.quotaXat.mockRejectedValueOnce(errorAdjuntXat('sense-capacitat'));
  const sense = render(<ControlsAdjunt usuariId="A" fil={fil} servei={servei} onEnvia={vi.fn()} />);
  await waitFor(() => expect(sense.container.firstChild).toBeNull());
  sense.unmount();
  servei.quotaXat.mockReturnValueOnce(new Promise(() => {}));
  expect(render(<ControlsAdjunt usuariId="A" fil={fil} servei={servei} onEnvia={vi.fn()} />).container.firstChild).toBeNull();
});
/* ADV-MEDIA-5 · A l'encastat, el ShadowRoot no té activeElement quan el focus
   és a la pàgina amfitriona: acabar un pas llarg no el pren. */
const dinsDUnShadow = () => {
  const amfitrio = document.createElement('input');
  const host = document.createElement('div');
  document.body.append(amfitrio, host);
  const shadow = host.attachShadow({ mode: 'open' });
  const arrel = document.createElement('div');
  shadow.append(arrel);
  return { amfitrio, host, shadow, arrel, treu: () => { amfitrio.remove(); host.remove(); } };
};
test('a l’encastat, acabar de preparar la foto no pren el focus a la pàgina amfitriona', async () => {
  const preparant = deferred();
  m.preparaAdjunt.mockReturnValueOnce(preparant.promise);
  const e = dinsDUnShadow();
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />, { container: e.arrel });
  const dins = within(e.arrel);
  await waitFor(() => expect(dins.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
  fireEvent.change(dins.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [new Blob(['original'], { type: 'image/jpeg' })] } });
  e.amfitrio.focus();
  await act(async () => { preparant.resolve(adjunt()); });
  await dins.findByRole('button', { name: 'Envia el fitxer' });
  expect(document.activeElement).toBe(e.amfitrio);
  expect(e.shadow.activeElement).toBeNull();
  e.treu();
});
test('a l’encastat, el focus perdut dins del panell continua passant al pas nou', async () => {
  const preparant = deferred();
  m.preparaAdjunt.mockReturnValueOnce(preparant.promise);
  const e = dinsDUnShadow();
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />, { container: e.arrel });
  const dins = within(e.arrel);
  const foto = await dins.findByRole('button', { name: 'Foto o vídeo' });
  await waitFor(() => expect(foto.disabled).toBe(false));
  foto.focus();
  fireEvent.change(dins.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [new Blob(['original'], { type: 'image/jpeg' })] } });
  await waitFor(() => expect(e.shadow.activeElement).toBe(dins.getByRole('button', { name: 'Cancel·la' })));
  await act(async () => { preparant.resolve(adjunt()); });
  await waitFor(() => expect(e.shadow.activeElement).toBe(dins.getByRole('button', { name: 'Envia el fitxer' })));
  e.treu();
});
/* ADV-MEDIA-7 · Rebutjar les normes de convivència (AbortError de sendChatMedia) calla, com al compositor. */
test('rebutjar les normes calla i conserva la previsualització per a tornar-ho a provar', async () => {
  const envia = vi.fn().mockRejectedValue(new DOMException('Cal acceptar les normes de convivència.', 'AbortError'));
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  await act(async () => {});
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByAltText('Foto adjunta')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Envia el fitxer' })).toBeTruthy();
});
/* ADV-MEDIA-8 · Massa pendents: esperar no ho resol; la quota es torna a llegir i ix la llista per descartar. */
test('massa fitxers pendents ho diu i mostra els pendents per descartar', async () => {
  const envia = vi.fn().mockRejectedValue(errorAdjuntXat('SDP-XAT-022'));
  servei.quotaXat.mockResolvedValueOnce({ usats: 0, limit: 20_000_000 })
    .mockResolvedValueOnce({ usats: 1_200_000, limit: 20_000_000, pendents: [{ id: 'vell', bytes: 1_200_000 }] });
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Tens massa fitxers pendents d’enviar. Descarta’n algun per a continuar.');
  expect(await screen.findByRole('button', { name: 'Descarta el fitxer pendent (1,2 MB)' })).toBeTruthy();
});
/* ADV-MEDIA-13 · Cancel·la durant la pujada pot deixar la reserva pendent: en acabar, la quota es torna a llegir. */
test('cancel·lar durant la pujada torna a llegir la quota i el pendent es pot descartar', async () => {
  const envia = vi.fn((_fil, _adjunt, { signal }) => new Promise((_resol, rebutja) => {
    signal.addEventListener('abort', () => rebutja(new DOMException('Operació cancel·lada.', 'AbortError')), { once: true });
  }));
  servei.quotaXat.mockResolvedValueOnce({ usats: 0, limit: 20_000_000 })
    .mockResolvedValueOnce({ usats: 1_200_000, limit: 20_000_000, pendents: [{ id: 'mateix-id', bytes: 1_200_000 }] });
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel·la' }));
  expect(await screen.findByRole('button', { name: 'Descarta el fitxer pendent (1,2 MB)' })).toBeTruthy();
  expect(servei.quotaXat).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();
});
/* ── XAT-07 · La gravadora: el rellotge, els avisos del sostre i l'aturada sola ── */
const veuGravada = (extra = {}) => ({ id: 'veu', tipus: 'veu', duradaMs: 12_000, fitxer: new Blob(['veu'], { type: 'audio/mp4' }), ...extra });
const comencaAGravar = async (resultat = new Promise(() => {})) => {
  ambMicrofon();
  m.gravaVeu.mockResolvedValueOnce({ atura: vi.fn(), cancella: vi.fn(), resultat });
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={vi.fn()} />);
  const grava = await screen.findByRole('button', { name: 'Grava àudio' });
  await waitFor(() => expect(grava.disabled).toBe(false));
  return grava;
};
test('mentre grava, un rellotge visible que no parla sol i només dos avisos abans dels 5 minuts', async () => {
  const grava = await comencaAGravar();
  // Només el rellotge (setInterval) i Date: la resta de temporitzadors continuen de veres.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  await act(async () => { fireEvent.click(grava); });
  const rellotge = screen.getByRole('timer');
  expect(rellotge.textContent).toBe('Temps de gravació 0:00');
  // role=timer és aria-live=off: cap segon no s'anuncia.
  expect(rellotge.getAttribute('aria-live')).toBeNull();
  const estats = [screen.getByRole('status').textContent];
  for (let segon = 1; segon <= 299; segon++) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    const ara = screen.getByRole('status').textContent;
    if (ara !== estats.at(-1)) estats.push(ara);
    if (segon === 42) expect(screen.getByRole('timer').textContent).toBe('Temps de gravació 0:42');
    if (segon === 239) expect(ara).toBe('Gravant… Atura per escoltar-la abans d’enviar.');
  }
  expect(screen.getByRole('timer').textContent).toBe('Temps de gravació 4:59');
  // La regió viva canvia dues vegades: queda un minut (4:00) i queden 10 segons (4:50).
  expect(estats).toEqual([
    'Gravant… Atura per escoltar-la abans d’enviar.',
    'Queda un minut: als 5 minuts la gravació s’aturarà sola.',
    'Queden 10 segons: la gravació s’aturarà sola.'
  ]);
});
test.each([
  ['temps', 'La gravació s’ha aturat sola en arribar als 5 minuts. Escolta-la abans d’enviar.'],
  ['mida', 'La gravació s’ha aturat sola perquè ja no hi cap més. Escolta-la abans d’enviar.']
])('una gravació que s’atura sola (%s) ho diu clarament, i el motiu no viatja amb l’adjunt', async (motiu, text) => {
  const nota = deferred();
  ambMicrofon();
  m.gravaVeu.mockResolvedValueOnce({ atura: vi.fn(), cancella: vi.fn(), resultat: nota.promise });
  const envia = vi.fn().mockResolvedValue([{ id: 'm' }]);
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  const grava = await screen.findByRole('button', { name: 'Grava àudio' });
  await waitFor(() => expect(grava.disabled).toBe(false));
  fireEvent.click(grava);
  await screen.findByRole('timer');
  await act(async () => { nota.resolve(veuGravada({ aturada: motiu })); });
  const estat = await screen.findByText(text);
  expect(estat.getAttribute('role')).toBe('status');
  expect(estat.classList.contains('sdp-xat-adjunts__avis')).toBe(true);
  expect(screen.queryByRole('timer')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  expect(envia.mock.calls[0][1]).not.toHaveProperty('aturada');
  expect(envia.mock.calls[0][1]).toMatchObject({ id: 'veu', tipus: 'veu', duradaMs: 12_000 });
  await waitFor(() => expect(screen.queryByText(text)).toBeNull());
  expect(screen.getByRole('status').textContent).toBe('');
});
test('una gravació aturada a mà no porta cap avís', async () => {
  const nota = deferred();
  await comencaAGravar(nota.promise);
  fireEvent.click(screen.getByRole('button', { name: 'Grava àudio' }));
  await screen.findByRole('timer');
  await act(async () => { nota.resolve(veuGravada()); });
  await screen.findByRole('button', { name: 'Envia el fitxer' });
  expect(screen.getByRole('status').textContent).toBe('');
  expect(screen.getByRole('status').classList.contains('sdp-xat-adjunts__avis')).toBe(false);
});

/* ── XAT-03 · El progrés de la pujada ── */
test('mentre envia, una barra de progrés amb nom i percentatge; en acabar se’n va', async () => {
  const tard = deferred(); const envia = vi.fn().mockReturnValue(tard.promise);
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  expect(screen.queryByRole('progressbar')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  const barra = await screen.findByRole('progressbar', { name: 'Progrés de l’enviament' });
  expect(barra.tagName).toBe('PROGRESS');
  // Abans del primer byte, indeterminada (sense value) i sense cap percentatge inventat.
  expect(barra.hasAttribute('value')).toBe(false);
  const { onProgres } = envia.mock.calls[0][2];
  expect(onProgres).toEqual(expect.any(Function));
  await act(async () => { onProgres(0.42); });
  expect(barra.value).toBeCloseTo(0.42);
  expect(barra.parentElement.textContent).toMatch(/^42\s%$/);
  await act(async () => { onProgres(1); });
  expect(barra.parentElement.textContent).toMatch(/^100\s%$/);
  await act(async () => { tard.resolve([{ id: 'm' }]); });
  await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
});
/* Revisió XAT-03 · La guarda és l'única cosa que separa les pujades: la
   barra de la pujada nova ja és visible quan arriba el progrés de la vella. */
test('el progrés d’una pujada cancel·lada o d’una altra conversa no es pinta en la barra de la nova', async () => {
  // Com el port: la pujada cancel·lada rebutja amb AbortError.
  const envia = vi.fn((_fil, _adjunt, { signal }) => new Promise((_resol, rebutja) => {
    signal.addEventListener('abort', () => rebutja(new DOMException('Operació cancel·lada.', 'AbortError')), { once: true });
  }));
  const vista = render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} />);
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await screen.findByRole('progressbar');
  const cancellada = envia.mock.calls[0][2].onProgres;
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
  await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
  // La pujada nova, del mateix fil: la barra hi és i encara no sap res.
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  const barra = await screen.findByRole('progressbar');
  await act(async () => { cancellada(0.9); });
  expect(barra.hasAttribute('value')).toBe(false);
  const nova = envia.mock.calls[1][2].onProgres;
  await act(async () => { nova(0.3); });
  expect(barra.value).toBeCloseTo(0.3);
  await act(async () => { cancellada(0.9); });
  expect(barra.value).toBeCloseTo(0.3);
  // Una altra conversa: la pujada d'abans ja no pinta en la barra de la de B.
  vista.rerender(<ControlsAdjunt usuariId={m.user} fil={{ id: 'fil-B' }} servei={servei} onEnvia={envia} />);
  await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
  await tria(); await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  const barraB = await screen.findByRole('progressbar');
  await act(async () => { nova(0.7); cancellada(0.9); });
  expect(barraB.hasAttribute('value')).toBe(false);
  await act(async () => { envia.mock.calls[2][2].onProgres(0.5); });
  expect(barraB.value).toBeCloseTo(0.5);
});
test('el percentatge parla la llengua de qui envia', async () => {
  const tard = deferred(); const envia = vi.fn().mockReturnValue(tard.promise);
  render(<ControlsAdjunt usuariId={m.user} fil={fil} servei={servei} onEnvia={envia} t={createTranslator('en')} locale="en-GB" />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Photo or video' }).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText('Choose a photo or a video of up to 10 seconds'), { target: { files: [new Blob(['original'], { type: 'image/jpeg' })] } });
  fireEvent.click(await screen.findByRole('button', { name: 'Send the file' }));
  const barra = await screen.findByRole('progressbar', { name: 'Upload progress' });
  await act(async () => { envia.mock.calls[0][2].onProgres(0.05); });
  expect(barra.parentElement.textContent).toBe('5%');
});
