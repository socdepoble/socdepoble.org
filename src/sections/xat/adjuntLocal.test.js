import { afterEach, describe, expect, test, vi } from 'vitest';
import { CLAUS_ERROR_ADJUNT, MAX_VEU_MS, duradaLocal, gravaVeu, mimeDeGravacio, preparaAdjunt, senseUbicacioVideo, textDErrorAdjunt } from './adjuntLocal.js';
import { ERRORS_ADJUNT_XAT, MISSATGE_QUOTA_XAT, validaAdjuntXat } from '../../data/xatMultimedia.js';
import ca from '../../config/idiomes/ca.js';

afterEach(() => { vi.useRealTimers(); });
test('Safari tria MP4 quan Opus no és disponible', () => {
  expect(mimeDeGravacio({ isTypeSupported: (mime) => mime === 'audio/mp4' })).toBe('audio/mp4');
  expect(mimeDeGravacio({ isTypeSupported: () => false })).toBeNull();
});
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-7) · AAC primer; WebM només per a qui no grava MP4. */
test('Chrome grava AAC en MP4 i Firefox es queda amb Opus en WebM', () => {
  expect(mimeDeGravacio({ isTypeSupported: () => true })).toBe('audio/mp4;codecs=mp4a.40.2');
  expect(mimeDeGravacio({ isTypeSupported: (mime) => mime.startsWith('audio/webm') || mime.startsWith('audio/ogg') })).toBe('audio/webm;codecs=opus');
});
test('la foto es recodifica localment fins i tot si ja és menuda i lleva EXIF', async () => {
  const comprimeix = vi.fn().mockResolvedValue('data:image/webp;base64,YWJj');
  const foto = new Blob(['original'], { type: 'image/jpeg' });
  const a = await preparaAdjunt(foto, { comprimeix });
  expect(comprimeix).toHaveBeenCalledWith(foto, expect.objectContaining({ conservaExif: false, maxSize: 1200 }));
  expect(comprimeix).toHaveBeenCalledOnce();
  expect(a.fitxer.type).toBe('image/webp');
  expect(a.fitxer.size).toBe(3);
  expect(a.tipus).toBe('imatge');
});
/* MEDIA-3 · WebKit torna PNG quan se li demana WebP: es torna a demanar JPEG, mai PNG. */
test('si el navegador no sap fer WebP, la foto ix en JPEG', async () => {
  const comprimeix = vi.fn(async (_f, { format }) => (format === 'image/webp' ? 'data:image/png;base64,YWJj' : 'data:image/jpeg;base64,YWJjZA=='));
  const a = await preparaAdjunt(new Blob(['original'], { type: 'image/jpeg' }), { comprimeix });
  expect(comprimeix.mock.calls.map(([, o]) => o.format)).toEqual(['image/webp', 'image/jpeg']);
  expect(comprimeix.mock.calls[1][1]).toMatchObject({ conservaExif: false, maxSize: 1200 });
  expect(a.fitxer.type).toBe('image/jpeg');
  expect(a.fitxer.size).toBe(4);
});
test('una foto mai no es puja en PNG', async () => {
  const comprimeix = vi.fn().mockResolvedValue('data:image/png;base64,YWJj');
  await expect(preparaAdjunt(new Blob(['x'], { type: 'image/png' }), { comprimeix })).rejects.toMatchObject({ code: 'foto' });
  expect(() => validaAdjuntXat({ fitxer: new Blob(['x'], { type: 'image/png' }), tipus: 'imatge' })).toThrow();
});
test('la quota té 20.000.000 bytes exactes, sense confondre MB i MiB', () => {
  expect(() => validaAdjuntXat({ fitxer: new Blob([new Uint8Array(20_000_000)], { type: 'video/mp4' }), tipus: 'video', duradaMs: 9_000 })).not.toThrow();
  expect(() => validaAdjuntXat({ fitxer: new Blob([new Uint8Array(20_000_001)], { type: 'video/mp4' }), tipus: 'video', duradaMs: 9_000 })).toThrow(MISSATGE_QUOTA_XAT);
});
/* Els sostres per tipus de la migració 2610220240: el client no reserva el que el servidor rebutjaria. */
test('foto fins a 2 MB, veu fins a 3 MB i vídeo de l’iPhone admés', () => {
  expect(() => validaAdjuntXat({ fitxer: new Blob([new Uint8Array(2_000_000)], { type: 'image/webp' }), tipus: 'imatge' })).not.toThrow();
  expect(() => validaAdjuntXat({ fitxer: new Blob([new Uint8Array(2_000_001)], { type: 'image/jpeg' }), tipus: 'imatge' })).toThrow(MISSATGE_QUOTA_XAT);
  expect(() => validaAdjuntXat({ fitxer: new Blob([new Uint8Array(3_000_001)], { type: 'audio/mp4' }), tipus: 'veu', duradaMs: 1000 })).toThrow(MISSATGE_QUOTA_XAT);
  expect(() => validaAdjuntXat({ fitxer: new Blob(['mov'], { type: 'video/quicktime' }), tipus: 'video', duradaMs: 1000 })).not.toThrow();
});
describe('durada de vídeo i recursos locals', () => {
  test.each([10, 10.001, Infinity, NaN])('durada %s segons', async (durada) => {
    const element = { duration: durada, removeAttribute: vi.fn(), load: vi.fn() };
    const urls = { createObjectURL: () => 'blob:local', revokeObjectURL: vi.fn() };
    const resultat = duradaLocal(new Blob(['x']), { creaElement: () => element, urls });
    element.onloadedmetadata();
    if (durada === 10) await expect(resultat).resolves.toBe(10_000);
    else await expect(resultat).rejects.toThrow('10 segons');
    expect(urls.revokeObjectURL).toHaveBeenCalledWith('blob:local');
    expect(element.load).toHaveBeenCalled();
  });
  test('cancel·lar metadades revoca object URL i no deixa el vídeo carregant', async () => {
    const controller = new AbortController();
    const element = { removeAttribute: vi.fn(), load: vi.fn() };
    const urls = { createObjectURL: () => 'blob:local', revokeObjectURL: vi.fn() };
    const resultat = duradaLocal(new Blob(['x']), { signal: controller.signal, creaElement: () => element, urls });
    controller.abort();
    await expect(resultat).rejects.toMatchObject({ name: 'AbortError' });
    expect(urls.revokeObjectURL).toHaveBeenCalledOnce();
  });
});

/* ── MEDIA-4 · La ubicació del vídeo, fora sense recodificar ── */
const caixa = (tipus, ...fills) => {
  const cos = fills.map((f) => (typeof f === 'string' ? new TextEncoder().encode(f) : f));
  const mida = 8 + cos.reduce((n, c) => n + c.length, 0);
  const bytes = new Uint8Array(mida);
  new DataView(bytes.buffer).setUint32(0, mida);
  bytes.set(new TextEncoder().encode(tipus).subarray(0, 4), 4);
  let p = 8;
  for (const c of cos) { bytes.set(c, p); p += c.length; }
  return bytes;
};
const GPS = '+39.4699-000.3763/';
const mp4AmbUbicacio = () => {
  const xyz = caixa('xyz_', GPS);
  xyz.set([0xa9, 0x78, 0x79, 0x7a], 4); // ©xyz, la ubicació d'Android
  const udta = caixa('udta', xyz);
  const meta = caixa('meta', 'com.apple.quicktime.location.ISO6709', GPS);
  const trak = caixa('trak', caixa('tkhd', 'pista'), caixa('udta', GPS));
  return new Blob([caixa('ftyp', 'isom'), caixa('moov', caixa('mvhd', 'durada'), udta, meta, trak), caixa('mdat', 'IMATGES')], { type: 'video/mp4' });
};
const text = async (blob) => new TextDecoder('latin1').decode(new Uint8Array(await blob.arrayBuffer()));
describe('vídeo sense ubicació', () => {
  test('les caixes de metadades passen a free, buides, sense moure cap byte del vídeo', async () => {
    const original = mp4AmbUbicacio();
    expect(await text(original)).toContain(GPS);
    const { fitxer, net } = await senseUbicacioVideo(original);
    expect(net).toBe(true);
    expect(fitxer.size).toBe(original.size);
    expect(fitxer.type).toBe('video/mp4');
    const resultat = await text(fitxer);
    expect(resultat).not.toContain(GPS);
    expect(resultat).not.toContain('com.apple.quicktime.location');
    expect(resultat).not.toMatch(/udta|meta/);
    expect(resultat).toContain('mvhd');
    expect(resultat).toContain('tkhd');
    expect(resultat).toContain('IMATGES');
  });
  test('un WebM o una estructura estranya no es toca i la UI avisa', async () => {
    const webm = new Blob(['webm'], { type: 'video/webm' });
    await expect(senseUbicacioVideo(webm)).resolves.toEqual({ fitxer: webm, net: false });
    const trencat = new Blob([new Uint8Array([0, 0, 0, 99, 0x6d, 0x6f, 0x6f, 0x76])], { type: 'video/mp4' });
    await expect(senseUbicacioVideo(trencat)).resolves.toEqual({ fitxer: trencat, net: false });
  });
  test('preparaAdjunt puja el vídeo net i diu si l’ha pogut netejar', async () => {
    const original = mp4AmbUbicacio();
    const a = await preparaAdjunt(original, { lligDurada: async () => 4000 });
    expect(a).toMatchObject({ tipus: 'video', duradaMs: 4000, senseUbicacio: true });
    expect(await text(a.fitxer)).not.toContain(GPS);
    const webm = await preparaAdjunt(new Blob(['webm'], { type: 'video/webm' }), { lligDurada: async () => 4000 });
    expect(webm).toMatchObject({ tipus: 'video', senseUbicacio: false });
  });
  test('el MOV de l’iPhone (video/quicktime) s’admet i també es neteja', async () => {
    const mp4 = mp4AmbUbicacio();
    const mov = new Blob([await mp4.arrayBuffer()], { type: 'video/quicktime' });
    const a = await preparaAdjunt(mov, { lligDurada: async () => 3000 });
    expect(a).toMatchObject({ tipus: 'video', senseUbicacio: true });
    expect(a.fitxer.type).toBe('video/quicktime');
    expect(await text(a.fitxer)).not.toContain(GPS);
  });
});

function entornGravacio() {
  const track = { stop: vi.fn() };
  class Recorder {
    static isTypeSupported = (mime) => mime === 'audio/mp4';
    constructor(stream, options) { this.options = options; this.state = 'inactive'; Recorder.ultim = this; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['veu']) }); this.onstop?.(); }
  }
  return { track, Recorder, mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] }) } };
}
test('aturar àudio MP4 conserva MIME i allibera el micròfon', async () => {
  const e = entornGravacio();
  const gravacio = await gravaVeu(e);
  gravacio.atura();
  const a = await gravacio.resultat;
  expect(a.fitxer.type).toBe('audio/mp4');
  expect(a.fitxer.size).toBe(3);
  expect(e.track.stop).toHaveBeenCalledOnce();
});
test('cancel·lar una gravació no produïx cap adjunt i allibera tracks', async () => {
  const e = entornGravacio();
  const gravacio = await gravaVeu(e);
  gravacio.cancella();
  await expect(gravacio.resultat).rejects.toMatchObject({ name: 'AbortError' });
  expect(e.track.stop).toHaveBeenCalledOnce();
});
test('un permís de micròfon que arriba després de desmuntar es tanca immediatament', async () => {
  const e = entornGravacio();
  let resol;
  e.mediaDevices.getUserMedia = () => new Promise((r) => { resol = r; });
  const controller = new AbortController();
  const promise = gravaVeu({ ...e, signal: controller.signal });
  controller.abort();
  resol({ getTracks: () => [e.track] });
  await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  expect(e.track.stop).toHaveBeenCalledOnce();
});
/* MEDIA-11 · El permís que el sistema no dona no és culpa de la persona.
   ADV-MEDIA-12 · El micròfon ocupat (NotReadableError; AbortError a Firefox) diu què cal fer. */
test.each([['NotAllowedError', 'micro-permis'], ['SecurityError', 'micro-permis'], ['NotFoundError', 'micro-absent'], ['NotReadableError', 'micro-ocupat'], ['AbortError', 'micro-ocupat'], ['TypeError', 'gravacio']])('getUserMedia %s → %s', async (nom, code) => {
  const e = entornGravacio();
  e.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new DOMException('no', nom));
  await expect(gravaVeu(e)).rejects.toMatchObject({ code });
  expect(ERRORS_ADJUNT_XAT['micro-permis']).not.toMatch(/has donat|no has/i);
});
test('prop del sostre de la veu (3 MB) la gravació s’atura sola i conserva la nota', async () => {
  const e = entornGravacio();
  const gravacio = await gravaVeu(e);
  const gravador = e.Recorder.ultim;
  gravador.stop = function stop() { this.state = 'inactive'; this.onstop?.(); };
  gravador.ondataavailable({ data: new Blob([new Uint8Array(2_950_000)]) });
  await expect(gravacio.resultat).resolves.toMatchObject({ tipus: 'veu', fitxer: expect.any(Blob) });
  expect((await gravacio.resultat).fitxer.size).toBe(2_950_000);
});
/* XAT-07 · Abans s'aturava sense dir res: el resultat diu si s'ha aturat sola i per què. */
test('una gravació que s’atura sola diu per què; aturada a mà, no porta cap motiu', async () => {
  const mida = entornGravacio();
  const perMida = await gravaVeu(mida);
  const gravador = mida.Recorder.ultim;
  gravador.stop = function stop() { this.state = 'inactive'; this.onstop?.(); };
  gravador.ondataavailable({ data: new Blob([new Uint8Array(2_950_000)]) });
  await expect(perMida.resultat).resolves.toMatchObject({ tipus: 'veu', aturada: 'mida' });
  const ama = await gravaVeu(entornGravacio());
  ama.atura();
  expect(await ama.resultat).not.toHaveProperty('aturada');
});
test('als cinc minuts (MAX_VEU_MS) la gravació s’atura sola amb el motiu «temps»', async () => {
  vi.useFakeTimers();
  const e = entornGravacio();
  const gravacio = await gravaVeu(e);
  e.Recorder.ultim.onstart?.();
  expect(MAX_VEU_MS).toBe(300_000);
  await vi.advanceTimersByTimeAsync(MAX_VEU_MS - 1);
  expect(e.Recorder.ultim.state).toBe('recording');
  await vi.advanceTimersByTimeAsync(1);
  await expect(gravacio.resultat).resolves.toMatchObject({ tipus: 'veu', aturada: 'temps', duradaMs: MAX_VEU_MS });
  expect(e.track.stop).toHaveBeenCalledOnce();
});
/* MEDIA-7 · La durada és la del rellotge, des que el gravador comença. */
test('la durada de la nota ve del rellotge de la gravació', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const e = entornGravacio();
  const gravacio = await gravaVeu(e);
  e.Recorder.ultim.onstart?.();
  vi.setSystemTime(Date.now() + 4_200);
  gravacio.atura();
  await expect(gravacio.resultat).resolves.toMatchObject({ tipus: 'veu', duradaMs: 4_200 });
});
test('la quota de foto compta el resultat comprimit, no els bytes de l’original', async () => {
  const comprimeix = vi.fn().mockResolvedValue('data:image/webp;base64,YWJj');
  const original = new Blob([new Uint8Array(20_000_001)], { type: 'image/jpeg' });
  await expect(preparaAdjunt(original, { comprimeix })).resolves.toMatchObject({ tipus: 'imatge', fitxer: expect.any(Blob) });
});

/* ── MEDIA-5 · Cada codi té la seua clau, i el valor valencià és el text de l'adaptador ── */
describe('errors dels adjunts traduïbles', () => {
  test('els dos mapes tenen els mateixos codis', () => {
    expect(Object.keys(CLAUS_ERROR_ADJUNT).sort()).toEqual(Object.keys(ERRORS_ADJUNT_XAT).sort());
  });
  test.each(Object.entries(CLAUS_ERROR_ADJUNT))('%s → %s és al diccionari valencià amb el mateix text', (code, clau) => {
    expect(ca[clau]).toBe(ERRORS_ADJUNT_XAT[code]);
  });
  test('la quota diu literalment el text del Mestre', () => {
    expect(ca['section.xat.adjunts.error.quota']).toBe("Espera't, que no tenim més diners per a pagar el servidor... ja et direm quan en pots pujar més!");
  });
  test('textDErrorAdjunt tradueix pel codi i, sense codi, conserva el missatge', () => {
    const t = vi.fn((clau) => `«${clau}»`);
    expect(textDErrorAdjunt({ code: 'SDP-XAT-020', message: 'cru' }, t)).toBe('«section.xat.adjunts.error.quota»');
    expect(t).toHaveBeenCalledWith('section.xat.adjunts.error.quota', MISSATGE_QUOTA_XAT);
    expect(textDErrorAdjunt(new Error('Missatge propi'), t, 'reserva')).toBe('Missatge propi');
    expect(textDErrorAdjunt(null, t, 'reserva')).toBe('reserva');
  });
});
