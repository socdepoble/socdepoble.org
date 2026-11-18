import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import * as video from './compressioVideoClient.js';

let proves;
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function runtime({ durada = 3, amplada = 1920, alcada = 1080, audio = true, supported = true, bytes = 256, playError = null, autoEnd = true, stopError = null } = {}) {
  const pistes = [];
  const pista = kind => { const p = new EventTarget(); Object.assign(p, { kind, readyState: 'live', enabled: true, muted: false, stop: vi.fn(() => { p.readyState = 'ended'; }) }); pistes.push(p); return p; };
  class Stream {
    constructor(tracks = []) { this.tracks = tracks; }
    getTracks() { return this.tracks; }
    getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); }
    getAudioTracks() { return this.tracks.filter(t => t.kind === 'audio'); }
    addTrack(t) { this.tracks.push(t); }
  }
  const element = new EventTarget();
  Object.assign(element, { duration: durada, videoWidth: amplada, videoHeight: alcada, readyState: 4, currentTime: 0, ended: false,
    pause: vi.fn(), load: vi.fn(), removeAttribute: vi.fn(),
    captureStream: () => new Stream([pista('video'), ...(audio ? [pista('audio')] : [])]),
    play: vi.fn(() => {
      if (playError) return Promise.reject(playError);
      queueMicrotask(() => {
        element.dispatchEvent(new Event('playing'));
        element.currentTime = durada / 2; element.dispatchEvent(new Event('timeupdate'));
        if (autoEnd) queueMicrotask(() => { element.currentTime = durada; element.ended = true; element.dispatchEvent(new Event('ended')); });
      });
      return Promise.resolve();
    })
  });
  Object.defineProperty(element, 'src', { configurable: true, set: () => { queueMicrotask(() => element.dispatchEvent(new Event('loadedmetadata'))); } });
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), captureStream: vi.fn(() => new Stream([pista('video')])) };
  const recorders = [];
  class Recorder extends EventTarget {
    static isTypeSupported() { return supported; }
    constructor(stream, options) { super(); this.stream = stream; this.options = options; this.mimeType = options.mimeType; this.state = 'inactive'; recorders.push(this); }
    start() { this.state = 'recording'; queueMicrotask(() => this.dispatchEvent(new Event('start'))); }
    stop() {
      if (stopError) throw stopError;
      this.state = 'inactive';
      queueMicrotask(() => {
        const e = new Event('dataavailable'); Object.defineProperty(e, 'data', { value: new Blob([new Uint8Array(bytes)], { type: this.mimeType }) });
        this.dispatchEvent(e); this.dispatchEvent(new Event('stop'));
      });
    }
  }
  const urls = { createObjectURL: vi.fn(() => 'blob:video-prova'), revokeObjectURL: vi.fn() };
  const entorn = { creaVideo: () => element, creaCanvas: () => canvas, Recorder, Stream, urls,
    requestFrame: vi.fn(() => 77), cancelFrame: vi.fn(), ara: () => Date.now(), setInterval, clearInterval, setTimeout, clearTimeout };
  const resultat = { entorn, element, canvas, recorders, pistes, urls };
  proves.push(resultat); return resultat;
}
// El decoder està simulat: injectable size prova els sostres sense reservar150MB.
const fitxer = (size = 30_000_000, type = 'video/mp4') => {
  const blob = new Blob([size ? 'mostra' : ''], { type });
  Object.defineProperty(blob, 'size', { value: size });
  return blob;
};
beforeEach(() => { proves = []; });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

test('mides horitzontals, verticals i quadrades respecten720p i no amplien originals menuts', () => {
  expect(video.midaVideo720(3840, 2160)).toEqual({ amplada: 1280, alcada: 720 });
  expect(video.midaVideo720(2160, 3840)).toEqual({ amplada: 720, alcada: 1280 });
  expect(video.midaVideo720(1080, 1080)).toEqual({ amplada: 720, alcada: 720 });
  expect(video.midaVideo720(640, 360)).toEqual({ amplada: 640, alcada: 360 });
});

test('recodifica ambàudio capturat,30fps i bitratesobjectiu; progrésmonòton0..1 i cleanup', async () => {
  const r = runtime(); const progres = [];
  const resultat = await video.comprimeixVideoClient(fitxer(), { onProgresCompressio: p => progres.push(p), audioEsperat: 'si', entorn: r.entorn });
  expect(resultat).toMatchObject({ comprimit: true, duradaMs: 3000, amplada: 1280, alcada: 720, audioConservat: true, metadadesNoves: true });
  expect(resultat.fitxer.type).toBe('video/mp4'); expect(resultat.fitxer.size).toBe(256);
  expect(r.canvas.captureStream).toHaveBeenCalledWith(30);
  expect(r.recorders[0].options).toMatchObject({ videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 96_000 });
  expect(r.recorders[0].stream.getAudioTracks()).toHaveLength(1);
  expect(progres[0]).toBe(0); expect(progres.at(-1)).toBe(1); expect(progres.every((v, i) => v >= 0 && v <= 1 && (!i || v >= progres[i - 1]))).toBe(true);
  expect(r.pistes.every(p => p.stop.mock.calls.length === 1)).toBe(true);
  expect(r.urls.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:video-prova');
  expect(r.canvas.width).toBe(0); expect(r.canvas.height).toBe(0);
});

test('codec no disponible usa original de20MB ambflag explícit, durada provada i sense fingir720p', async () => {
  const r = runtime({ supported: false, amplada: 3840, alcada: 2160 }); const original = fitxer(20_000_000);
  const resultat = await video.comprimeixVideoClient(original, { entorn: r.entorn });
  expect(resultat).toMatchObject({ comprimit: false, metadadesNoves: false, amplada: 3840, alcada: 2160, motiuFallback: 'video-compressio-no-disponible' });
  expect(resultat.fitxer).toBe(original); expect(r.recorders).toHaveLength(0);
});

test('codec no disponible no retorna l’original gran', async () => {
  const r = runtime({ supported: false });
  await expect(video.comprimeixVideoClient(fitxer(20_000_001), { entorn: r.entorn })).rejects.toMatchObject({ code: 'video-compressio-no-disponible' });
  expect(r.urls.revokeObjectURL).toHaveBeenCalledOnce();
});

test.each(['si', 'desconegut'])('captura sensepistaaudio i expectativa%s no crea un vídeo mut per a un original gran', async audioEsperat => {
  const r = runtime({ audio: false });
  await expect(video.comprimeixVideoClient(fitxer(), { entorn: r.entorn, audioEsperat })).rejects.toMatchObject({ code: 'video-audio-no-capturable' });
  expect(r.recorders).toHaveLength(0);
});

test('si l’àudio noéscapturable, originalmenut preservaexactamentelsbytesenfallback', async () => {
  const r = runtime({ audio: false }); const original = fitxer(100);
  const resultat = await video.comprimeixVideoClient(original, { entorn: r.entorn, audioEsperat: 'si' });
  expect(resultat.fitxer).toBe(original); expect(resultat.comprimit).toBe(false); expect(resultat.audioConservat).toBe(true);
});

test('absènciaàudio provada permetcompressió de vídeo originalmentmut', async () => {
  const r = runtime({ audio: false });
  const resultat = await video.comprimeixVideoClient(fitxer(), { entorn: r.entorn, audioEsperat: 'no' });
  expect(resultat.comprimit).toBe(true); expect(resultat.pistesAudio).toBe(0);
});

test('entrada superior150MB, tipus alié i fitxer buit fallenabansd’assignarobjectURL', async () => {
  const r = runtime();
  for (const [file, code] of [[fitxer(150_000_001), 'video-mida-entrada'], [fitxer(1, 'text/plain'), 'format'], [fitxer(0), 'buit']]) {
    await expect(video.comprimeixVideoClient(file, { entorn: r.entorn })).rejects.toMatchObject({ code });
  }
  expect(r.urls.createObjectURL).not.toHaveBeenCalled();
});

test('60s exacte admés,60001ms rebutjat encara que duradaMs delcaller intenteescurçarlo', async () => {
  const bona = runtime({ durada: 60 });
  expect((await video.comprimeixVideoClient(fitxer(), { entorn: bona.entorn })).duradaMs).toBe(60_000);
  const roina = runtime({ durada: 60.001 });
  await expect(video.comprimeixVideoClient(fitxer(10), { duradaMs: 2000, entorn: roina.entorn })).rejects.toMatchObject({ code: 'durada' });
});

test('abortabansd’obrir noretorna originalni creaURL', async () => {
  const r = runtime(); const c = new AbortController(); c.abort();
  await expect(video.comprimeixVideoClient(fitxer(10), { signal: c.signal, entorn: r.entorn })).rejects.toMatchObject({ name: 'AbortError' });
  expect(r.urls.createObjectURL).not.toHaveBeenCalled();
});

test('abortgravantliquida,atura pistes i URL; un onstop tardà no transformaabort enèxit', async () => {
  const r = runtime({ autoEnd: false }); const c = new AbortController();
  const resultat = video.comprimeixVideoClient(fitxer(100), { signal: c.signal, entorn: r.entorn }); resultat.catch(() => {});
  await tick(); c.abort();
  await expect(resultat).rejects.toMatchObject({ name: 'AbortError' });
  await tick(); expect(r.urls.revokeObjectURL).toHaveBeenCalledOnce(); expect(r.pistes.every(p => p.stop.mock.calls.length === 1)).toBe(true);
});

test('un navegador que ignorevideo.play no mantélapromesa indefinida', async () => {
  vi.useFakeTimers(); const r = runtime({ autoEnd: false }); r.element.play.mockImplementation(() => new Promise(() => {}));
  const resultat = video.comprimeixVideoClient(fitxer(), { entorn: r.entorn }); resultat.catch(() => {});
  await vi.advanceTimersByTimeAsync(95_000);
  await expect(resultat).rejects.toMatchObject({ code: 'video-compressio-temps' });
  expect(r.urls.revokeObjectURL).toHaveBeenCalledOnce();
});

test('sortida superior20MB esfalla, no s’accepta clipretallat ni quota250MB', async () => {
  const r = runtime({ bytes: 20_000_001 });
  await expect(video.comprimeixVideoClient(fitxer(), { entorn: r.entorn })).rejects.toMatchObject({ code: 'video-mida' });
});

test('els temporitzadors natius es criden amb el receptor global de navegador', async () => {
  const r = runtime();
  for (const nom of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']) {
    const original = globalThis[nom];
    vi.spyOn(globalThis, nom).mockImplementation(function (...args) { expect(this).toBe(globalThis); return original.call(globalThis, ...args); });
    delete r.entorn[nom];
  }
  expect((await video.comprimeixVideoClient(fitxer(), { entorn: r.entorn })).comprimit).toBe(true);
});

test('src que llança mentre hi ha una espera de metadades no deixa listeners, timers ni rebuig orfe', async () => {
  vi.useFakeTimers(); const r = runtime(); r.element.readyState = 0;
  Object.defineProperty(r.element, 'src', { set: () => { throw new Error('src rebutjat'); } });
  await expect(video.comprimeixVideoClient(fitxer(), { entorn: r.entorn })).rejects.toMatchObject({ code: 'video-compressio' });
  expect(vi.getTimerCount()).toBe(0); expect(r.urls.revokeObjectURL).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(95_000);
});

test('una pista capturada que no arriba mai a tindre contingut no acredita conservació del so', async () => {
  const r = runtime(); const captura = r.element.captureStream;
  r.element.captureStream = () => { const s = captura(); s.getAudioTracks().forEach(t => { t.muted = true; }); return s; };
  await expect(video.comprimeixVideoClient(fitxer(), { entorn: r.entorn, audioEsperat: 'si' })).rejects.toMatchObject({ code: 'video-audio-no-capturable' });
});

test('sense captureStream de l’element només es comprimix si absència d’àudio està provada', async () => {
  const r = runtime(); r.element.captureStream = undefined;
  expect((await video.comprimeixVideoClient(fitxer(), { entorn: r.entorn, audioEsperat: 'no' })).comprimit).toBe(true);
  const sense = runtime(); sense.element.captureStream = undefined;
  await expect(video.comprimeixVideoClient(fitxer(), { entorn: sense.entorn })).rejects.toMatchObject({ code: 'video-audio-no-capturable' });
});

test('si MP4 no és compatible, usa VP9/Opus i informa el MIME real d’eixida', async () => {
  const r = runtime(); r.entorn.Recorder.isTypeSupported = mime => mime.startsWith('video/webm');
  const resultat = await video.comprimeixVideoClient(fitxer(), { entorn: r.entorn });
  expect(resultat.fitxer.type).toBe('video/webm'); expect(r.recorders[0].options.mimeType).toBe('video/webm;codecs=vp9,opus');
});

test('constructor del gravador fallit allibera totes les pistes, el canvas i la URL', async () => {
  const r = runtime(); r.entorn.Recorder = class {
    static isTypeSupported() { return true; }
    constructor() { throw new Error('Codificador ocupat'); }
  };
  await expect(video.comprimeixVideoClient(fitxer(), { entorn: r.entorn })).rejects.toMatchObject({ code: 'video-compressio' });
  expect(r.pistes.every(p => p.stop.mock.calls.length === 1)).toBe(true); expect(r.canvas.width).toBe(0); expect(r.urls.revokeObjectURL).toHaveBeenCalledOnce();
});

test('stop que llança no deixa la promesa penjada ni reté les pistes', async () => {
  const r = runtime({ stopError: new Error('stop ha fallat') });
  await expect(video.comprimeixVideoClient(fitxer(), { entorn: r.entorn })).rejects.toMatchObject({ code: 'video-compressio' });
  expect(r.pistes.every(p => p.stop.mock.calls.length === 1)).toBe(true); expect(r.urls.revokeObjectURL).toHaveBeenCalledOnce();
});

test('150MB d’entrada i20MB d’eixida exactes són límits inclusius diferents de la quota', async () => {
  const r = runtime({ bytes: 20_000_000 });
  const resultat = await video.comprimeixVideoClient(fitxer(150_000_000), { entorn: r.entorn });
  expect(resultat.fitxer.size).toBe(20_000_000); expect(resultat.comprimit).toBe(true);
});

test('vídeo sense avançar té deadline de10s i allibera els temporitzadors', async () => {
  vi.useFakeTimers(); const r = runtime({ autoEnd: false }); r.element.play.mockImplementation(() => Promise.resolve());
  const resultat = video.comprimeixVideoClient(fitxer(), { entorn: r.entorn }); resultat.catch(() => {});
  await vi.advanceTimersByTimeAsync(10_500);
  await expect(resultat).rejects.toMatchObject({ code: 'video-compressio-temps' }); expect(vi.getTimerCount()).toBe(0);
});

test('play rebutjat usa fallback només quan l’original compleix20MB', async () => {
  const r = runtime({ playError: new DOMException('Gest necessari', 'NotAllowedError') }); const original = fitxer(200);
  const resultat = await video.comprimeixVideoClient(original, { entorn: r.entorn });
  expect(resultat).toMatchObject({ comprimit: false, motiuFallback: 'video-compressio-no-disponible' }); expect(resultat.fitxer).toBe(original);
  const gran = runtime({ playError: new DOMException('Gest necessari', 'NotAllowedError') });
  await expect(video.comprimeixVideoClient(fitxer(), { entorn: gran.entorn })).rejects.toMatchObject({ code: 'video-compressio-no-disponible' });
});

test('amagar la pestanya durant compressió falla sense confirmar un vídeo congelat', async () => {
  const r = runtime({ autoEnd: false }); const visibilitat = new EventTarget(); visibilitat.visibilityState = 'visible'; r.entorn.targetVisibilitat = visibilitat;
  const resultat = video.comprimeixVideoClient(fitxer(), { entorn: r.entorn }); resultat.catch(() => {}); await tick();
  visibilitat.visibilityState = 'hidden'; visibilitat.dispatchEvent(new Event('visibilitychange'));
  await expect(resultat).rejects.toMatchObject({ code: 'video-compressio-temps' });
  expect(r.pistes.every(p => p.stop.mock.calls.length === 1)).toBe(true); expect(r.urls.revokeObjectURL).toHaveBeenCalledOnce();
});

test('si coincideixen hidden i cancel·lació explícita, la persona continua rebent AbortError sense fallback', async () => {
  const r = runtime({ autoEnd: false }); const visibilitat = new EventTarget(); visibilitat.visibilityState = 'visible'; r.entorn.targetVisibilitat = visibilitat;
  const c = new AbortController(); const resultat = video.comprimeixVideoClient(fitxer(100), { signal: c.signal, entorn: r.entorn }); resultat.catch(() => {}); await tick();
  visibilitat.visibilityState = 'hidden'; visibilitat.dispatchEvent(new Event('visibilitychange')); c.abort();
  await expect(resultat).rejects.toMatchObject({ name: 'AbortError' });
});
