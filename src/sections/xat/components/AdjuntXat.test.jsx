import '../../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AdjuntXat, { _reiniciaVeus, callaVeuActiva, tempsDeVeu } from './AdjuntXat.jsx';
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
// XAT-08 · La velocitat i on es va quedar cada nota són del mòdul: cada prova comença de zero.
afterEach(() => { cleanup(); _reiniciaVeus(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
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
/* ── XAT-08 i l'omissió del verificador · Les notes de veu com a WhatsApp ── */
const nota = (id) => ({ id, mime: 'audio/mp4', duradaMs: 12_400 });
// Prem el botó d'una nota i, quan té la font, el navegador diu que sona.
const sona = async (audio, nom = 'Reprodueix el missatge de veu') => {
  fireEvent.click(within(audio.closest('.sdp-xat-veu')).getByRole('button', { name: nom }));
  await waitFor(() => expect(audio.getAttribute('src')).toBeTruthy());
  fireEvent.play(audio);
  return audio;
};
test('la velocitat gira 1× → 1,5× → 2× i val per a totes les notes de la sessió', async () => {
  const vista = render(<><AdjuntXat adjunt={nota('veu-v1')} tipus="veu" externalConfig={config} usuariId="A" /><AdjuntXat adjunt={nota('veu-v2')} tipus="veu" externalConfig={config} usuariId="A" /></>);
  // En repòs no hi ha pastilla: apareix en prémer Reprodueix, com a WhatsApp.
  expect(screen.queryByRole('button', { name: /^Velocitat/ })).toBeNull();
  const [primera, segona] = vista.container.querySelectorAll('audio');
  await sona(primera);
  const velocitat = screen.getByRole('button', { name: 'Velocitat de reproducció: 1×' });
  expect(velocitat.textContent).toBe('1×');
  fireEvent.click(velocitat);
  expect(screen.getByRole('button', { name: 'Velocitat de reproducció: 1,5×' }).textContent).toBe('1,5×');
  expect(primera.playbackRate).toBe(1.5);
  // La font nova (load) torna a defaultPlaybackRate: també es fixa.
  expect(primera.defaultPlaybackRate).toBe(1.5);
  fireEvent.click(screen.getByRole('button', { name: 'Velocitat de reproducció: 1,5×' }));
  expect(primera.playbackRate).toBe(2);
  // L'altra nota ja comença a 2×.
  await sona(segona);
  expect(segona.playbackRate).toBe(2);
  expect(screen.getAllByRole('button', { name: 'Velocitat de reproducció: 2×' })).toHaveLength(2);
  fireEvent.click(screen.getAllByRole('button', { name: 'Velocitat de reproducció: 2×' })[1]);
  expect(primera.playbackRate).toBe(1);
  expect(segona.playbackRate).toBe(1);
  // I una nota nova de la mateixa sessió hereta la triada.
  fireEvent.click(screen.getAllByRole('button', { name: 'Velocitat de reproducció: 1×' })[0]);
  vista.unmount();
  const altra = render(<AdjuntXat adjunt={nota('veu-v3')} tipus="veu" externalConfig={config} usuariId="A" />);
  const tercera = await sona(altra.container.querySelector('audio'));
  expect(tercera.playbackRate).toBe(1.5);
});
test('la velocitat parla la llengua (i els decimals) de qui llig', async () => {
  const vista = render(<AdjuntXat adjunt={nota('veu-en')} tipus="veu" externalConfig={config} usuariId="A" t={createTranslator('en')} locale="en-GB" />);
  await sona(vista.container.querySelector('audio'), 'Play the voice message');
  fireEvent.click(screen.getByRole('button', { name: 'Playback speed: 1×' }));
  expect(screen.getByRole('button', { name: 'Playback speed: 1.5×' }).textContent).toBe('1.5×');
  fireEvent.click(screen.getByRole('button', { name: 'Playback speed: 1.5×' }));
  fireEvent.click(screen.getByRole('button', { name: 'Playback speed: 2×' }));
  expect(screen.getByRole('button', { name: 'Playback speed: 1×' })).toBeTruthy();
});
test('una nota que comença para la que sonava: una sola veu alhora', async () => {
  const vista = render(<><AdjuntXat adjunt={nota('veu-e1')} tipus="veu" externalConfig={config} usuariId="A" /><AdjuntXat adjunt={nota('veu-e2')} tipus="veu" externalConfig={config} usuariId="A" /></>);
  const [primera, segona] = vista.container.querySelectorAll('audio');
  await sona(primera);
  expect(screen.getAllByRole('button', { name: 'Pausa el missatge de veu' })).toHaveLength(1);
  HTMLMediaElement.prototype.pause.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  // La que sonava es para dins del mateix gest, abans que arribe la URL de l'altra.
  expect(HTMLMediaElement.prototype.pause.mock.contexts).toContain(primera);
  expect(HTMLMediaElement.prototype.pause.mock.contexts).not.toContain(segona);
  fireEvent.pause(primera);
  await waitFor(() => expect(segona.getAttribute('src')).toBeTruthy());
  fireEvent.play(segona);
  const botons = screen.getAllByRole('button', { name: /missatge de veu$/ });
  expect(botons.map((b) => b.getAttribute('aria-label'))).toEqual(['Reprodueix el missatge de veu', 'Pausa el missatge de veu']);
});
test('una nota que encara esperava la URL no sona si mentrestant en comença una altra', async () => {
  const tard = (() => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; })();
  m.urlAdjuntXat.mockImplementationOnce(() => tard.promise);
  const vista = render(<><AdjuntXat adjunt={nota('veu-t1')} tipus="veu" externalConfig={config} usuariId="A" /><AdjuntXat adjunt={nota('veu-t2')} tipus="veu" externalConfig={config} usuariId="A" /></>);
  const [primera, segona] = vista.container.querySelectorAll('audio');
  fireEvent.click(screen.getAllByRole('button', { name: 'Reprodueix el missatge de veu' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  await waitFor(() => expect(segona.getAttribute('src')).toBeTruthy());
  await act(async () => { tard.resolve(URL_SIGNADA()); });
  expect(primera.getAttribute('src')).toBeNull();
  expect(screen.getAllByRole('button', { name: /missatge de veu$/ })[0].getAttribute('aria-label')).toBe('Reprodueix el missatge de veu');
});
test('eixir i tornar a la conversa reprén la nota on s’havia quedat; en acabar, l’oblida', async () => {
  const pinta = (usuariId = 'A') => render(<AdjuntXat adjunt={nota('veu-r1')} tipus="veu" externalConfig={config} usuariId={usuariId} />);
  const primera = pinta();
  const audio = await sona(primera.container.querySelector('audio'));
  Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 7.3 });
  fireEvent.timeUpdate(audio);
  primera.unmount();
  // Una altra persona, al mateix aparell, no hereta on anava.
  pinta('B').unmount();
  const tornada = pinta();
  expect(screen.getByText('0:07 / 0:12')).toBeTruthy();
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('0:07 de 0:12');
  const nou = tornada.container.querySelector('audio');
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  await waitFor(() => expect(nou.getAttribute('src')).toBeTruthy());
  fireEvent.loadedMetadata(nou);
  expect(nou.currentTime).toBe(7.3);
  fireEvent.play(nou);
  fireEvent.ended(nou);
  // Acabada, la durada (amb la pastilla, un sol número) i res a reprendre.
  expect(screen.getByText('0:12')).toBeTruthy();
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('0:00 de 0:12');
  tornada.unmount();
  pinta();
  expect(screen.getByText('0:00 / 0:12')).toBeTruthy();
});
/* Revisió XAT-08 · Amb la pastilla, la fila de 16rem ha de cabre en un mòbil
   de 320px: el temps passa a un sol número. En repòs, el de sempre. */
test('amb la pastilla, el temps és un sol número; en repòs, la fila de sempre', async () => {
  const vista = render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  const fila = screen.getByRole('group', { name: 'Missatge de veu' });
  const temps = fila.querySelector('.sdp-xat-veu__temps');
  expect(fila.className).toBe('sdp-xat-veu');
  expect(temps.textContent).toBe('0:00 / 0:12');
  const audio = await sona(vista.container.querySelector('audio'));
  // La fila es pot partir (la pastilla baixa de línia si no hi cap) i el temps és on va.
  expect(fila.className).toBe('sdp-xat-veu sdp-xat-veu--velocitat');
  expect(temps.textContent).toBe('0:00');
  Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 3.2 });
  fireEvent.timeUpdate(audio);
  expect(temps.textContent).toBe('0:03');
  // La durada no es perd per als lectors: la diu el lliscant.
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('0:03 de 0:12');
  fireEvent.pause(audio);
  expect(temps.textContent).toBe('0:03');
  fireEvent.ended(audio);
  expect(temps.textContent).toBe('0:12');
  expect(screen.getByRole('button', { name: 'Velocitat de reproducció: 1×' })).toBeTruthy();
});
/* Revisió XAT-08 (MEDIA-6) · Si la URL falla abans de la primera font, la
   pastilla no se'n va: qui l'havia enfocada no perd el focus. */
test('la pastilla enfocada no desapareix quan la URL falla', async () => {
  const tard = (() => { let reject; const promise = new Promise((_r, j) => { reject = j; }); return { promise, reject }; })();
  m.urlAdjuntXat.mockImplementationOnce(() => tard.promise);
  render(<AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" />);
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  const velocitat = screen.getByRole('button', { name: 'Velocitat de reproducció: 1×' });
  velocitat.focus();
  await act(async () => { tard.reject(errorAdjuntXat('SDP-XAT-006')); });
  expect(await screen.findByText(/No tens accés a esta conversa o el fitxer ja no hi és\./)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();
  expect(velocitat.isConnected).toBe(true);
  expect(document.activeElement).toBe(velocitat);
});
/* Revisió XAT-08 · El play pot vindre d'un altre lloc (els controls del
   sistema, la pantalla de bloqueig): també para la que sonava. */
test('un play que no ve del botó també para l’altra nota', async () => {
  const vista = render(<><AdjuntXat adjunt={nota('veu-s1')} tipus="veu" externalConfig={config} usuariId="A" /><AdjuntXat adjunt={nota('veu-s2')} tipus="veu" externalConfig={config} usuariId="A" /></>);
  const [primera, segona] = vista.container.querySelectorAll('audio');
  await sona(primera);
  HTMLMediaElement.prototype.pause.mockClear();
  fireEvent.play(segona);
  expect(HTMLMediaElement.prototype.pause.mock.contexts).toContain(primera);
  expect(HTMLMediaElement.prototype.pause.mock.contexts).not.toContain(segona);
});
test('la nota de B no recorda la posició de la nota d’A', async () => {
  const vista = render(<AdjuntXat adjunt={nota('veu-r2')} tipus="veu" externalConfig={config} usuariId="A" />);
  const audio = await sona(vista.container.querySelector('audio'));
  Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 9 });
  fireEvent.timeUpdate(audio);
  vista.rerender(<AdjuntXat adjunt={nota('veu-r2')} tipus="veu" externalConfig={config} usuariId="B" />);
  expect(screen.getByText('0:00 / 0:12')).toBeTruthy();
  vista.rerender(<AdjuntXat adjunt={nota('veu-r2')} tipus="veu" externalConfig={config} usuariId="A" />);
  expect(screen.getByText('0:09 / 0:12')).toBeTruthy();
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

/* Consens Gauntlet 2120 (C2120-04 + G2120-04 + G2120-05) · El reproductor de
   veu amb peticions de signatura que es creuen, i WebKit que torna a 1×. */
const enEspera = () => { let resolve; let reject; const promise = new Promise((s, r) => { resolve = s; reject = r; }); return { promise, resolve, reject }; };
test('C2120-04 · l’error tardà d’una signatura antiga no para la càrrega nova', async () => {
  const primera = enEspera();
  m.urlAdjuntXat.mockImplementationOnce(() => primera.promise);
  const vista = render(<AdjuntXat adjunt={nota('veu-c4')} tipus="veu" externalConfig={config} usuariId="A" />);
  const audio = vista.container.querySelector('audio');
  // Prem, pausa i torna a prémer abans que arribe la primera signatura: dos peticions.
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pausa el missatge de veu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  await waitFor(() => expect(audio.getAttribute('src')).toMatch(/token=1$/));
  expect(m.urlAdjuntXat).toHaveBeenCalledTimes(2);
  await act(async () => { primera.reject(errorAdjuntXat('obrir')); });
  fireEvent.play(audio);
  expect(screen.getByRole('button', { name: 'Pausa el missatge de veu' })).toBeTruthy();
  expect(screen.queryByText('No hem pogut obrir el fitxer.')).toBeNull();
});
test('C2120-04 · la signatura nova que arriba després de l’error antic encara sona', async () => {
  const primera = enEspera();
  const segona = enEspera();
  m.urlAdjuntXat.mockImplementationOnce(() => primera.promise).mockImplementationOnce(() => segona.promise);
  const vista = render(<AdjuntXat adjunt={nota('veu-c4b')} tipus="veu" externalConfig={config} usuariId="A" />);
  const audio = vista.container.querySelector('audio');
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pausa el missatge de veu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  await act(async () => { primera.reject(errorAdjuntXat('obrir')); });
  // La càrrega vigent continua: el botó encara espera, sense error.
  expect(screen.getByRole('button', { name: 'Pausa el missatge de veu' }).getAttribute('aria-busy')).toBe('true');
  await act(async () => { segona.resolve(URL_SIGNADA()); });
  expect(audio.getAttribute('src')).toMatch(/token=1$/);
  expect(screen.queryByText('No hem pogut obrir el fitxer.')).toBeNull();
});
test('G2120-04 · una nota pausada no renova la signatura quan la font falla', async () => {
  const vista = render(<AdjuntXat adjunt={nota('veu-g4')} tipus="veu" externalConfig={config} usuariId="A" />);
  const audio = await sona(vista.container.querySelector('audio'));
  fireEvent.click(screen.getByRole('button', { name: 'Pausa el missatge de veu' }));
  fireEvent.pause(audio);
  fireEvent.error(audio);
  await act(async () => {});
  expect(m.urlAdjuntXat).toHaveBeenCalledOnce();
});
test('G2120-01 · callaVeuActiva para la nota que sona i la deixa en repòs', async () => {
  const vista = render(<AdjuntXat adjunt={nota('veu-g1')} tipus="veu" externalConfig={config} usuariId="A" />);
  const audio = await sona(vista.container.querySelector('audio'));
  HTMLMediaElement.prototype.pause.mockClear();
  callaVeuActiva();
  expect(HTMLMediaElement.prototype.pause.mock.contexts).toContain(audio);
  fireEvent.pause(audio);
  expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();
  // Sense cap nota activa, no fa res.
  expect(() => callaVeuActiva()).not.toThrow();
});
test('G2120-05 · en carregar metadades i en sonar es reafirma la velocitat triada', async () => {
  const vista = render(<AdjuntXat adjunt={nota('veu-g5')} tipus="veu" externalConfig={config} usuariId="A" />);
  const audio = await sona(vista.container.querySelector('audio'));
  fireEvent.click(screen.getByRole('button', { name: 'Velocitat de reproducció: 1×' }));
  fireEvent.click(screen.getByRole('button', { name: 'Velocitat de reproducció: 1,5×' }));
  // WebKit en carregar una font nova: torna a 1×.
  audio.playbackRate = 1; audio.defaultPlaybackRate = 1;
  fireEvent.loadedMetadata(audio);
  expect([audio.playbackRate, audio.defaultPlaybackRate]).toEqual([2, 2]);
  audio.playbackRate = 1; audio.defaultPlaybackRate = 1;
  fireEvent.play(audio);
  expect([audio.playbackRate, audio.defaultPlaybackRate]).toEqual([2, 2]);
});
/* Revisió adversarial del consens 2120 · Les guardes que cap prova no vigilava:
   la generació en el then, i el «recarregant» que deixen net calla i la pausa
   (si no, una pausa externa posterior no deixava la nota en repòs). */
const botoDe = (audio) => within(audio.closest('.sdp-xat-veu')).getAllByRole('button')[0];
test('C2120-04 · una signatura antiga que arriba bé però tard no posa la seua font', async () => {
  const primera = enEspera();
  const segona = enEspera();
  m.urlAdjuntXat.mockImplementationOnce(() => primera.promise).mockImplementationOnce(() => segona.promise);
  const vista = render(<AdjuntXat adjunt={nota('veu-r1')} tipus="veu" externalConfig={config} usuariId="A" />);
  const audio = vista.container.querySelector('audio');
  fireEvent.click(botoDe(audio)); fireEvent.click(botoDe(audio)); fireEvent.click(botoDe(audio));
  expect(m.urlAdjuntXat).toHaveBeenCalledTimes(2);
  await act(async () => { primera.resolve('https://node.test/x?token=VELL'); });
  expect(audio.getAttribute('src')).toBeNull();
  await act(async () => { segona.resolve('https://node.test/x?token=NOU'); });
  expect(audio.getAttribute('src')).toMatch(/token=NOU$/);
});
test('C2120-04 · una renovació callada per una altra nota no deixa la nota sense poder-se pausar', async () => {
  const vista = render(<><AdjuntXat adjunt={nota('veu-r4a')} tipus="veu" externalConfig={config} usuariId="A" /><AdjuntXat adjunt={nota('veu-r4b')} tipus="veu" externalConfig={config} usuariId="A" /></>);
  const [a, b] = vista.container.querySelectorAll('audio');
  fireEvent.click(botoDe(a));
  await waitFor(() => expect(a.getAttribute('src')).toBeTruthy());
  fireEvent.play(a);
  const renova = enEspera();
  m.urlAdjuntXat.mockImplementationOnce(() => renova.promise);
  fireEvent.error(a);
  fireEvent.click(botoDe(b)); // B calla A a mitja renovació
  fireEvent.pause(a);
  await waitFor(() => expect(b.getAttribute('src')).toBeTruthy());
  fireEvent.play(b);
  await act(async () => { renova.resolve('https://node.test/x?token=RENOVA'); });
  fireEvent.click(botoDe(a));
  fireEvent.play(a);
  expect(botoDe(a).getAttribute('aria-label')).toBe('Pausa el missatge de veu');
  // Una pausa externa (pantalla de bloqueig) la deixa en repòs, i el clic següent torna a sonar.
  fireEvent.pause(a);
  expect(botoDe(a).getAttribute('aria-label')).toBe('Reprodueix el missatge de veu');
  HTMLMediaElement.prototype.play.mockClear();
  fireEvent.click(botoDe(a));
  expect(HTMLMediaElement.prototype.play.mock.contexts).toContain(a);
});
test('C2120-04 · una renovació pausada pel botó no deixa la nota sense poder-se pausar', async () => {
  const vista = render(<AdjuntXat adjunt={nota('veu-r5')} tipus="veu" externalConfig={config} usuariId="A" />);
  const a = vista.container.querySelector('audio');
  fireEvent.click(botoDe(a));
  await waitFor(() => expect(a.getAttribute('src')).toBeTruthy());
  fireEvent.play(a);
  const renova = enEspera();
  m.urlAdjuntXat.mockImplementationOnce(() => renova.promise);
  fireEvent.error(a);
  fireEvent.click(botoDe(a)); fireEvent.pause(a);
  await act(async () => { renova.resolve('https://node.test/x?token=RENOVA'); });
  fireEvent.click(botoDe(a)); fireEvent.play(a);
  fireEvent.pause(a);
  HTMLMediaElement.prototype.play.mockClear();
  fireEvent.click(botoDe(a));
  expect(HTMLMediaElement.prototype.play.mock.contexts).toContain(a);
});
