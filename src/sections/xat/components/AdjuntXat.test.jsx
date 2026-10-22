import '../../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AdjuntXat, { tempsDeVeu } from './AdjuntXat.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { errorAdjuntXat } from '../../../data/xatMultimedia.js';
const m = vi.hoisted(() => ({ urlAdjuntXat: vi.fn(), capacitat: true }));
vi.mock('../../../data/backendPort.js', () => ({ urlAdjuntXat: m.urlAdjuntXat, teCapacitat: () => m.capacitat }));

/* Un IntersectionObserver de mentides: la prova diu quan entra a la vista. */
let observats = [];
class Observador {
  constructor(callback, opcions) { this.callback = callback; this.opcions = opcions; observats.push(this); }
  observe(node) { this.node = node; }
  disconnect() { this.desconnectat = true; }
}
const entra = () => act(async () => { for (const o of observats) if (!o.desconnectat) o.callback([{ isIntersecting: true, target: o.node }]); });
let n = 0;
const URL_SIGNADA = () => `https://node.test/storage/v1/object/sign/xat_adjunts/x?token=${++n}`;
beforeEach(() => {
  vi.clearAllMocks(); m.capacitat = true; observats = []; n = 0;
  m.urlAdjuntXat.mockImplementation(async () => URL_SIGNADA());
  vi.stubGlobal('IntersectionObserver', Observador);
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const config = { dataMode: 'remote' };
const foto = { id: 'foto-1', mime: 'image/webp' };
const veu = { id: 'veu-1', mime: 'audio/webm', duradaMs: 12_400 };

test('tempsDeVeu: m:ss', () => {
  expect(tempsDeVeu(0)).toBe('0:00');
  expect(tempsDeVeu(65_900)).toBe('1:05');
  expect(tempsDeVeu(12_400, Math.round)).toBe('0:12');
});
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-8 i STRESS-2) · Cap petició en obrir la conversa. */
test('una foto no demana la URL fins que entra a la vista', async () => {
  render(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" />);
  expect(m.urlAdjuntXat).not.toHaveBeenCalled();
  expect(screen.queryByRole('status')).toBeNull();
  // Fora de la llista de missatges, l'arrel és el viewport.
  expect(observats[0].opcions).toEqual({ root: null, rootMargin: '200px 0px' });
  await entra();
  expect((await screen.findByAltText('Foto adjunta')).getAttribute('src')).toMatch(/token=1$/);
  expect(m.urlAdjuntXat).toHaveBeenCalledOnce();
  expect(m.urlAdjuntXat).toHaveBeenCalledWith('foto-1', expect.objectContaining({ dataMode: 'remote', signal: expect.any(AbortSignal) }), { renova: false });
});
/* STRESS-7 · Una URL caducada es renova una vegada sense demanar res; la segona fallada, el botó. */
/* ADV-MEDIA-6 · El marge de 200px compta des de la llista que desplaça, no des del viewport. */
test('dins de la llista, l’arrel de l’observador és la llista que desplaça', () => {
  const vista = render(<ol className="sdp-xat-missatges"><li><AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" /></li></ol>);
  expect(observats[0].opcions).toEqual({ root: vista.container.querySelector('ol.sdp-xat-missatges'), rootMargin: '200px 0px' });
});
test('un error de càrrega renova la signatura una vegada i després ofereix reintentar', async () => {
  render(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" />);
  await entra();
  fireEvent.error(await screen.findByAltText('Foto adjunta'));
  await waitFor(() => expect(screen.getByAltText('Foto adjunta').getAttribute('src')).toMatch(/token=2$/));
  expect(m.urlAdjuntXat).toHaveBeenLastCalledWith('foto-1', expect.anything(), { renova: true });
  fireEvent.error(screen.getByAltText('Foto adjunta'));
  fireEvent.click(await screen.findByRole('button', { name: 'Torna-ho a provar' }));
  expect(await screen.findByAltText('Foto adjunta')).toBeTruthy();
  expect(m.urlAdjuntXat).toHaveBeenCalledTimes(3);
});
test('el mode de selecció no torna a demanar res: la peça continua muntada, sense controls', async () => {
  const vista = render(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" />);
  await entra(); await screen.findByAltText('Foto adjunta');
  vista.rerender(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" interactiu={false} />);
  vista.rerender(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" />);
  expect(m.urlAdjuntXat).toHaveBeenCalledOnce();
});
test('un canvi de sessió no reutilitza la URL de l’altra persona', async () => {
  const vista = render(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" />);
  await entra(); await screen.findByAltText('Foto adjunta');
  vista.rerender(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="B" />);
  expect(screen.queryByAltText('Foto adjunta')).toBeNull();
  await entra();
  await waitFor(() => expect(m.urlAdjuntXat).toHaveBeenCalledTimes(2));
});
test('un fitxer que el servidor ja no deixa vore ho diu amb el text humà', async () => {
  m.urlAdjuntXat.mockRejectedValueOnce(errorAdjuntXat('SDP-XAT-006'));
  render(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" />);
  await entra();
  expect(await screen.findByText(/No tens accés a esta conversa o el fitxer ja no hi és\./)).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});
test('sense la capacitat, un text sense cap petició', () => {
  m.capacitat = false;
  render(<AdjuntXat adjunt={foto} tipus="imatge" externalConfig={config} usuariId="A" />);
  expect(screen.getByText('Este node encara no pot obrir els adjunts del xat.')).toBeTruthy();
  expect(m.urlAdjuntXat).not.toHaveBeenCalled();
});

/* ── MEDIA-7 · El reproductor de veu de Pedra Seca ── */
test('la nota de veu es pinta amb la durada desada i no demana res fins a prémer', () => {
  render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  expect(screen.getByRole('group', { name: 'Missatge de veu' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();
  const posicio = screen.getByRole('slider', { name: 'Posició del missatge de veu' });
  expect(posicio.getAttribute('aria-valuetext')).toBe('0:00 de 0:12');
  expect(screen.getByText('0:00 / 0:12')).toBeTruthy();
  expect(m.urlAdjuntXat).not.toHaveBeenCalled();
});
test('prémer reproduïx: una sola signatura, play() i el botó passa a pausa', async () => {
  const vista = render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  const audio = vista.container.querySelector('audio');
  await waitFor(() => expect(audio.getAttribute('src')).toMatch(/token=1$/));
  expect(m.urlAdjuntXat).toHaveBeenCalledOnce();
  // El primer play() va dins del gest, abans de tindre la URL (WebKit).
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  fireEvent.play(audio);
  expect(screen.getByRole('button', { name: 'Pausa el missatge de veu' })).toBeTruthy();
  Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 3.2 });
  fireEvent.timeUpdate(audio);
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('0:03 de 0:12');
});
test('la durada finita del navegador guanya; Infinity (WebM de Chromium) no', async () => {
  const vista = render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  const audio = vista.container.querySelector('audio');
  Object.defineProperty(audio, 'duration', { configurable: true, value: Infinity });
  fireEvent.loadedMetadata(audio);
  expect(screen.getByText('0:00 / 0:12')).toBeTruthy();
  Object.defineProperty(audio, 'duration', { configurable: true, value: 14.6 });
  fireEvent.durationChange(audio);
  expect(screen.getByText('0:00 / 0:15')).toBeTruthy();
});
test('una signatura caducada durant la nota es renova una vegada i continua; la segona, el botó', async () => {
  const vista = render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  const audio = vista.container.querySelector('audio');
  await waitFor(() => expect(audio.getAttribute('src')).toMatch(/token=1$/));
  fireEvent.error(audio);
  await waitFor(() => expect(audio.getAttribute('src')).toMatch(/token=2$/));
  expect(m.urlAdjuntXat).toHaveBeenLastCalledWith('veu-1', expect.anything(), { renova: true });
  fireEvent.error(audio);
  expect(await screen.findByText(/No hem pogut obrir el fitxer\./)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  await waitFor(() => expect(audio.getAttribute('src')).toMatch(/token=3$/));
});
/* ADV-MEDIA-2 · Com Chrome: play() sense font queda pendent; amb una font que no
   carrega, 'error' i el rebuig NotSupportedError, en qualsevol ordre. */
test.each([['l’error abans del rebuig', false], ['el rebuig abans de l’error', true]])('una font que no carrega acaba en el text amb codi i el botó Reprodueix (%s)', async (_cas, rebuigPrimer) => {
  HTMLMediaElement.prototype.play.mockImplementation(function play() {
    this.dispatchEvent(new Event('play'));
    if (!this.getAttribute('src')) return new Promise(() => {});
    const rebuig = Promise.reject(new DOMException('Failed to load because no supported source was found.', 'NotSupportedError'));
    const falla = () => this.dispatchEvent(new Event('error'));
    if (rebuigPrimer) setTimeout(falla, 0); else falla();
    return rebuig;
  });
  render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  expect(await screen.findByText(/No hem pogut obrir el fitxer\./)).toBeTruthy();
  expect(screen.queryByText(/Failed to load/)).toBeNull();
  // La primera fallada ha renovat la signatura; la segona ja no.
  expect(m.urlAdjuntXat).toHaveBeenCalledTimes(2);
  expect(m.urlAdjuntXat).toHaveBeenLastCalledWith('veu-1', expect.anything(), { renova: true });
  expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();
});
test('un play() que el navegador no deixa fer també es diu amb el text amb codi', async () => {
  HTMLMediaElement.prototype.play.mockImplementation(function play() {
    return this.getAttribute('src') ? Promise.reject(new DOMException('play() can only be initiated by a user gesture.', 'NotAllowedError')) : new Promise(() => {});
  });
  render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  expect(await screen.findByText(/No hem pogut obrir el fitxer\./)).toBeTruthy();
  expect(screen.queryByText(/user gesture/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();
});
/* ADV-MEDIA-10 · La vista quieta desmunta el reproductor (cap <audio> a la
   casella); en tornar, un de nou en repòs que sí que sona en prémer. */
test('després del mode de selecció, la nota torna en repòs i en prémer sona', async () => {
  const vista = render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  const abans = vista.container.querySelector('audio');
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  await waitFor(() => expect(abans.getAttribute('src')).toMatch(/token=1$/));
  fireEvent.play(abans);
  expect(screen.getByRole('button', { name: 'Pausa el missatge de veu' })).toBeTruthy();
  vista.rerender(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" interactiu={false} />);
  expect(vista.container.querySelector('audio')).toBeNull();
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  // L'element que se n'ha anat queda buit: res no continua baixant ni sonant.
  expect(abans.getAttribute('src')).toBeNull();
  vista.rerender(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  const nou = vista.container.querySelector('audio');
  expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();
  expect(screen.getByRole('slider').disabled).toBe(true);
  expect(screen.getByText('0:00 / 0:12')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  await waitFor(() => expect(nou.getAttribute('src')).toMatch(/token=2$/));
  fireEvent.play(nou);
  expect(screen.getByRole('button', { name: 'Pausa el missatge de veu' })).toBeTruthy();
});
test('en mode de selecció, la nota no porta controls dins de la casella', () => {
  render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" interactiu={false} />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('slider')).toBeNull();
  expect(screen.getByText('Missatge de veu')).toBeTruthy();
  expect(screen.getByText('0:12')).toBeTruthy();
});
/* MEDIA-5 · En la llengua de la interfície. */
test('el reproductor parla la llengua de qui llig', () => {
  render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" t={createTranslator('en')} />);
  expect(screen.getByRole('button', { name: 'Play the voice message' })).toBeTruthy();
  expect(screen.getByRole('slider', { name: 'Voice message position' }).getAttribute('aria-valuetext')).toBe('0:00 of 0:12');
});
test('un vídeo demana la URL en entrar a la vista i no porta controls en selecció', async () => {
  const vista = render(<AdjuntXat adjunt={{ id: 'video-1', mime: 'video/mp4' }} tipus="video" externalConfig={config} usuariId="A" interactiu={false} />);
  expect(m.urlAdjuntXat).not.toHaveBeenCalled();
  await entra();
  const video = await screen.findByLabelText('Vídeo adjunt');
  expect(video.hasAttribute('controls')).toBe(false);
  expect(video.getAttribute('tabindex')).toBe('-1');
  vista.rerender(<AdjuntXat adjunt={{ id: 'video-1', mime: 'video/mp4' }} tipus="video" externalConfig={config} usuariId="A" />);
  expect(screen.getByLabelText('Vídeo adjunt').hasAttribute('controls')).toBe(true);
  expect(m.urlAdjuntXat).toHaveBeenCalledOnce();
});
