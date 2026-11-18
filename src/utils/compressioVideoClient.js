import { MAX_VIDEO_ENTRADA_BYTES, MAX_VIDEO_MS, MAXIM_ADJUNT_XAT, errorAdjuntXat } from '../data/xatMultimedia.js';

/** P0-125 · Transcodificació local en temps real. No usa xarxa ni micròfon.
 * GPS: el caller inspecciona l'original ABANS d'entrar ací. Només la branca
 * canvas/captura crea metadades noves; un fallback és l'original, encara cru.
 */
export const FPS_VIDEO_CLIENT = 30;
export const BITRATE_VIDEO_CLIENT = 1_500_000;
export const BITRATE_AUDIO_CLIENT = 96_000;
export const TEMPS_MAXIM_COMPRESSIO_VIDEO_MS = 90_000;
const TEMPS_METADADES_MS = 10_000;
const TEMPS_SENSE_AVANCAR_MS = 10_000;
const MIMES = Object.freeze([
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/webm;codecs=vp9,opus'
]);
const FALLBACKS = new Set(['video-compressio-no-disponible', 'video-audio-no-capturable', 'video-compressio', 'video-compressio-temps', 'video-mida']);
const abortat = () => new DOMException('Operació cancel·lada.', 'AbortError');
const error = (code, cause) => errorAdjuntXat(code, cause === undefined ? {} : { cause });
const motiuSenyal = signal => signal.reason instanceof Error ? signal.reason : abortat();

export function midaVideo720(amplada, alcada) {
  if (!Number.isFinite(amplada) || !Number.isFinite(alcada) || amplada < 2 || alcada < 2) throw error('video-illegible');
  const horitzontal = amplada >= alcada;
  const escala = Math.min(1, (horitzontal ? 1280 : 720) / amplada, (horitzontal ? 720 : 1280) / alcada);
  return { amplada: Math.max(2, Math.floor(amplada * escala / 2) * 2), alcada: Math.max(2, Math.floor(alcada * escala / 2) * 2) };
}

function entornNatiu() {
  return {
    creaVideo: () => globalThis.document?.createElement('video'),
    creaCanvas: () => globalThis.document?.createElement('canvas'),
    Recorder: globalThis.MediaRecorder, Stream: globalThis.MediaStream, urls: globalThis.URL, targetVisibilitat: globalThis.document,
    requestFrame: callback => globalThis.requestAnimationFrame(callback),
    cancelFrame: id => globalThis.cancelAnimationFrame(id), ara: () => globalThis.performance?.now?.() ?? Date.now(),
    setTimeout: (...args) => globalThis.setTimeout(...args),
    clearTimeout: id => globalThis.clearTimeout(id),
    setInterval: (...args) => globalThis.setInterval(...args),
    clearInterval: id => globalThis.clearInterval(id)
  };
}

function espera(element, events, condicio, signal, runtime) {
  if (signal.aborted) return Promise.reject(motiuSenyal(signal));
  if (condicio()) return Promise.resolve();
  const promesa = new Promise((resolve, reject) => {
    const neteja = () => {
      events.forEach(nom => element.removeEventListener(nom, comprova));
      element.removeEventListener('error', falla); signal.removeEventListener('abort', cancella); runtime.clearTimeout(timer);
    };
    const acaba = causa => { neteja(); if (causa) reject(causa); else resolve(); };
    const comprova = () => { if (condicio()) acaba(); };
    const falla = () => acaba(error('video-illegible'));
    const cancella = () => acaba(motiuSenyal(signal));
    const timer = runtime.setTimeout(() => acaba(error('video-compressio-temps')), TEMPS_METADADES_MS);
    events.forEach(nom => element.addEventListener(nom, comprova));
    element.addEventListener('error', falla); signal.addEventListener('abort', cancella, { once: true });
  });
  // Si assignar src/seek llança abans de l'await, el finally encara cancel·la
  // esta espera. No deixem un rebuig orfe; qui l'espera rep igualment l'error.
  promesa.catch(() => {});
  return promesa;
}

/** Torna un DTO; comprimit:false no acredita ni 720p/30fps ni neteja de GPS.
 * audioEsperat ve d'una inspecció completa ('no') o d'una pista observada
 * ('si'); amb 'desconegut' mai s'accepta recodificació sense pista d'àudio.
 * duradaMs és una durada ja provada pel caller, útil per a WebM sense índex.
 */
export async function comprimeixVideoClient(fitxer, {
  signal, onProgresCompressio, duradaMs: duradaProvada, audioEsperat = 'desconegut', entorn
} = {}) {
  if (!(fitxer instanceof Blob) || !fitxer.size) throw error('buit');
  if (!/^video\/(mp4|quicktime|webm)$/.test(fitxer.type)) throw error('format');
  if (fitxer.size > MAX_VIDEO_ENTRADA_BYTES) throw error('video-mida-entrada');
  if (signal?.aborted) throw abortat();
  if (!['si', 'no', 'desconegut'].includes(audioEsperat)) throw error('video-audio-no-capturable');
  const runtime = { ...entornNatiu(), ...entorn };
  const control = new AbortController();
  const cancella = () => control.abort(abortat());
  signal?.addEventListener('abort', cancella, { once: true });
  const globalTimer = runtime.setTimeout(() => control.abort(error('video-compressio-temps')), TEMPS_MAXIM_COMPRESSIO_VIDEO_MS);
  const viu = () => { if (control.signal.aborted) throw motiuSenyal(control.signal); };
  let element, canvas, recorder, url, frame = null, rellotge = null;
  const pistes = new Set(); const listeners = [];
  let duradaMs = Number.isFinite(duradaProvada) && duradaProvada > 0 && duradaProvada <= MAX_VIDEO_MS ? Math.ceil(duradaProvada) : null;
  let amplada = null, alcada = null, ultimProgres = -1;
  const informa = valor => {
    const p = Math.max(0, Math.min(1, valor));
    if (p > ultimProgres) { ultimProgres = p; onProgresCompressio?.(p); }
  };
  const escolta = (target, nom, callback) => { target.addEventListener(nom, callback); listeners.push(() => target.removeEventListener(nom, callback)); };
  const registraStream = stream => { stream?.getTracks?.().forEach(pista => pistes.add(pista)); return stream; };
  const neteja = () => {
    listeners.splice(0).forEach(lleva => lleva());
    if (!control.signal.aborted) control.abort(abortat());
    if (rellotge !== null) runtime.clearInterval(rellotge);
    if (frame !== null) runtime.cancelFrame(frame);
    if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch { /* ja aturat pel navegador */ } }
    for (const pista of pistes) { try { pista.stop(); } catch { /* pista ja alliberada */ } }
    if (element) { try { element.pause(); element.removeAttribute('src'); element.load(); } catch { /* element desconnectat */ } }
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    if (url !== undefined) { runtime.urls.revokeObjectURL(url); url = undefined; }
    runtime.clearTimeout(globalTimer); signal?.removeEventListener('abort', cancella);
  };
  try {
    informa(0);
    element = runtime.creaVideo();
    if (!element) throw error('video-compressio-no-disponible');
    element.preload = 'auto'; element.muted = true; element.playsInline = true;
    url = runtime.urls.createObjectURL(fitxer);
    const metadata = espera(element, ['loadedmetadata', 'durationchange'], () => element.readyState >= 1 && element.videoWidth > 0 && element.videoHeight > 0, control.signal, runtime);
    element.src = url;
    await metadata; viu();
    if (Number.isFinite(element.duration) && element.duration > 0) duradaMs = Math.ceil(element.duration * 1000);
    if (!duradaMs && element.duration === Infinity) {
      // WebM de MediaRecorder sovint no duu índex de durada; un seek local
      // al final permet al decoder trobar-la, sense llegir tot el Blob en JS.
      const final = espera(element, ['durationchange', 'timeupdate', 'seeked'], () => Number.isFinite(element.duration) && element.duration > 0, control.signal, runtime);
      element.currentTime = 1e10;
      await final; viu(); duradaMs = Math.ceil(element.duration * 1000);
    }
    if (!Number.isSafeInteger(duradaMs) || duradaMs <= 0) throw error('durada-illegible');
    if (duradaMs > MAX_VIDEO_MS) throw error('durada');
    amplada = element.videoWidth; alcada = element.videoHeight;
    if (runtime.targetVisibilitat?.visibilityState === 'hidden') throw error('video-compressio-temps');
    const mimeType = MIMES.find(mime => runtime.Recorder?.isTypeSupported?.(mime));
    if (!mimeType || typeof runtime.Stream !== 'function') throw error('video-compressio-no-disponible');
    if (element.currentTime !== 0) {
      const principi = espera(element, ['seeked', 'timeupdate'], () => element.currentTime <= 0.001 && !element.seeking, control.signal, runtime);
      element.currentTime = 0; await principi; viu();
    }
    await espera(element, ['loadeddata', 'canplay'], () => element.readyState >= 2, control.signal, runtime); viu();
    canvas = runtime.creaCanvas();
    const context = canvas?.getContext('2d');
    if (!context || typeof canvas.captureStream !== 'function') throw error('video-compressio-no-disponible');
    const mida = midaVideo720(amplada, alcada); canvas.width = mida.amplada; canvas.height = mida.alcada;
    const captura = element.captureStream || element.mozCaptureStream;
    const origen = typeof captura === 'function' ? registraStream(captura.call(element)) : null;
    const audio = (origen?.getAudioTracks?.() || []).filter(pista => pista.readyState !== 'ended' && pista.enabled !== false);
    if (!audio.length && audioEsperat !== 'no') throw error('video-audio-no-capturable');
    const video = registraStream(canvas.captureStream(FPS_VIDEO_CLIENT));
    if (!video?.getVideoTracks?.().length) throw error('video-compressio-no-disponible');
    const combinat = registraStream(new runtime.Stream([...video.getVideoTracks(), ...audio]));
    recorder = new runtime.Recorder(combinat, { mimeType, videoBitsPerSecond: BITRATE_VIDEO_CLIENT, audioBitsPerSecond: BITRATE_AUDIO_CLIENT });
    const blob = await new Promise((resolve, reject) => {
      let acabat = false, bytes = 0, ultimTemps = element.currentTime, ultimAvanc = runtime.ara(), ultimDibuix = -Infinity;
      const chunks = [], audioObservat = new Set(audio.filter(pista => !pista.muted));
      const acaba = causa => {
        if (acabat) return;
        acabat = true;
        if (causa) { reject(causa); return; }
        if (!element.ended) { reject(error('video-compressio')); return; }
        if (audio.some(pista => !audioObservat.has(pista))) { reject(error('video-audio-no-capturable')); return; }
        const mimeReal = String(recorder.mimeType || mimeType).split(';')[0];
        if (!['video/mp4', 'video/webm'].includes(mimeReal)) { reject(error('video-compressio-no-disponible')); return; }
        const dades = new Blob(chunks, { type: mimeReal });
        if (!dades.size) reject(error('video-compressio'));
        else if (dades.size > MAXIM_ADJUNT_XAT.video) reject(error('video-mida'));
        else resolve(dades);
      };
      const dibuixa = () => {
        if (acabat || control.signal.aborted) return;
        try {
          const ara = runtime.ara();
          if (ara - ultimDibuix >= 1000 / FPS_VIDEO_CLIENT - 1) {
            context.drawImage(element, 0, 0, mida.amplada, mida.alcada); ultimDibuix = ara;
          }
          frame = runtime.requestFrame(dibuixa);
        }
        catch (cause) { acaba(error('video-compressio', cause)); }
      };
      const comprova = () => {
        if (acabat) return;
        try {
          viu();
          if (element.currentTime * 1000 > MAX_VIDEO_MS + 10) { acaba(error('durada')); return; }
          if (element.currentTime > ultimTemps + 0.01) { ultimTemps = element.currentTime; ultimAvanc = runtime.ara(); }
          if (runtime.ara() - ultimAvanc > TEMPS_SENSE_AVANCAR_MS) { acaba(error('video-compressio-temps')); return; }
          informa(Math.min(0.98, element.currentTime * 1000 / duradaMs * 0.98));
        } catch (cause) { acaba(cause); }
      };
      escolta(control.signal, 'abort', () => acaba(motiuSenyal(control.signal)));
      if (runtime.targetVisibilitat?.addEventListener) escolta(runtime.targetVisibilitat, 'visibilitychange', () => {
        // rAF pot parar mentre el rellotge del vídeo i l'àudio continuen.
        // Un resultat congelat no es confirma com una compressió correcta.
        if (runtime.targetVisibilitat.visibilityState === 'hidden') acaba(error('video-compressio-temps'));
      });
      audio.forEach(pista => escolta(pista, 'unmute', () => audioObservat.add(pista)));
      escolta(recorder, 'dataavailable', event => {
        if (acabat || !event.data?.size) return;
        bytes += event.data.size;
        if (bytes > MAXIM_ADJUNT_XAT.video) { acaba(error('video-mida')); return; }
        chunks.push(event.data);
      });
      escolta(recorder, 'error', event => acaba(error('video-compressio', event.error)));
      escolta(recorder, 'stop', () => acaba());
      escolta(element, 'error', () => acaba(error('video-compressio')));
      escolta(element, 'timeupdate', comprova);
      escolta(element, 'ended', () => {
        if (acabat) return;
        try { comprova(); if (!acabat) recorder.stop(); }
        catch (cause) { acaba(error('video-compressio', cause)); }
      });
      try {
        viu(); dibuixa();
        if (acabat) return;
        recorder.start(1000);
        rellotge = runtime.setInterval(comprova, 250);
        Promise.resolve(element.play()).catch(cause => acaba(error('video-compressio-no-disponible', cause)));
      } catch (cause) { acaba(cause?.name === 'AbortError' ? cause : error('video-compressio', cause)); }
    });
    viu(); informa(1);
    return { fitxer: blob, duradaMs, comprimit: true, amplada: mida.amplada, alcada: mida.alcada,
      mimeType: blob.type, audioConservat: true, pistesAudio: audio.length, metadadesNoves: true };
  } catch (cause) {
    if (signal?.aborted || cause?.name === 'AbortError') throw abortat();
    const actual = control.signal.aborted ? motiuSenyal(control.signal) : cause;
    const conegut = actual?.code ? actual : error('video-compressio', actual);
    if (fitxer.size <= MAXIM_ADJUNT_XAT.video && duradaMs && duradaMs <= MAX_VIDEO_MS && FALLBACKS.has(conegut.code)) {
      informa(1);
      return { fitxer, duradaMs, comprimit: false, amplada, alcada, mimeType: fitxer.type,
        audioConservat: true, metadadesNoves: false, motiuFallback: conegut.code };
    }
    throw conegut;
  } finally { neteja(); }
}
