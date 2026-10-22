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
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
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
