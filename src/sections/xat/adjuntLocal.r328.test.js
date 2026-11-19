import ca from '../../config/idiomes/ca.js';
import es from '../../config/idiomes/es.js';
import en from '../../config/idiomes/en.js';
import eu from '../../config/idiomes/eu.js';
import gl from '../../config/idiomes/gl.js';
// @vitest-environment node
import { describe, expect, test, vi } from 'vitest';
import { preparaAdjunt, amagaUbicacioAdjunt, CLAUS_ERROR_ADJUNT } from './adjuntLocal.js';
import { MAX_VIDEO_ENTRADA_BYTES } from '../../data/xatMultimedia.js';
const lloc = { lat: 38.64, lng: -0.49, altitud: 520 };
const inspecciona = async () => ({ coordenades: lloc, completa: true, audioEsperat: 'si' });
const foto = () => new Blob(['original'], { type: 'image/jpeg' });
const video = () => new Blob(['original'], { type: 'video/mp4' });
const comprimeix = async () => 'data:image/webp;base64,YWJj';
const comprimeixVideo = async (_fitxer, { duradaMs, onProgresCompressio }) => {
  onProgresCompressio?.(0); onProgresCompressio?.(1);
  return { fitxer: new Blob(['nou'], { type: 'video/webm' }), duradaMs, comprimit: true };
};
const opcions = () => ({ inspecciona, comprimeix, comprimeixVideo, lligDurada: async () => 60_000 });
describe('R32.8 · el lloc viatja abans de comprimir i només false explícit l’amaga', () => {
  test.each([undefined, true, null, 0])('opció %s conserva lat/lng però no altitud en la càrrega', async conservaUbicacio => {
    const ordre = [];
    const resultat = await preparaAdjunt(foto(), { ...opcions(), conservaUbicacio,
      inspecciona: async () => { ordre.push('GPS'); return { coordenades: lloc, completa: true }; },
      comprimeix: async (_f, o) => { ordre.push('canvas'); expect(o.conservaExif).toBe(false); return 'data:image/webp;base64,YWJj'; }
    });
    expect(ordre).toEqual(['GPS', 'canvas']);
    expect(resultat.ubicacio).toEqual({ lat: 38.64, lng: -0.49 });
    expect(resultat.conservaUbicacio).toBe(true);
  });
  test('false lleva EXIF i metadades de lloc de la foto', async () => {
    const encode = vi.fn(comprimeix);
    const r = await preparaAdjunt(foto(), { ...opcions(), conservaUbicacio: false, comprimeix: encode });
    expect(r).not.toHaveProperty('ubicacio');
    expect(encode.mock.calls[0][1].conservaExif).toBe(false);
  });
  test('vídeo60s comprimit conserva GPS; opt-out recodificat no torna a netejar', async () => {
    const netejaVideo = vi.fn(); const progress = [];
    const r = await preparaAdjunt(video(), { ...opcions(), netejaVideo, onProgresCompressio: p => progress.push(p) });
    expect(r).toMatchObject({ tipus: 'video', duradaMs: 60_000, ubicacio: { lat: 38.64, lng: -0.49 }, videoComprimit: true });
    expect(progress).toEqual([0, 1]);
    const amagat = await preparaAdjunt(video(), { ...opcions(), netejaVideo, conservaUbicacio: false });
    expect(amagat).not.toHaveProperty('ubicacio'); expect(netejaVideo).not.toHaveBeenCalled();
  });
  test('entrada150MB és independent de la quota i passa per reducció abans del sostre20MB', async () => {
    const gran = new Blob([new Uint8Array(MAX_VIDEO_ENTRADA_BYTES)], { type: 'video/mp4' });
    const compressor = vi.fn(comprimeixVideo);
    await expect(preparaAdjunt(gran, { ...opcions(), comprimeixVideo: compressor })).resolves.toMatchObject({ fitxer: expect.any(Blob) });
    expect(compressor).toHaveBeenCalledOnce();
    await expect(preparaAdjunt(new Blob([gran, 'x'], { type: 'video/mp4' }), opcions())).rejects.toMatchObject({ code: 'video-mida-entrada' });
  });
  test('fallback MP4 intenta sanejar sense perdre l’original; opt-out exigix prova de neteja', async () => {
    const original = video();const fallback = async fitxer => ({ fitxer, comprimit: false });
    const netejaVideo = vi.fn(async fitxer => ({ fitxer, net: false }));
    const r = await preparaAdjunt(original, { ...opcions(), comprimeixVideo: fallback, netejaVideo });
    expect(r.fitxer).toBe(original); expect(r.ubicacio).toEqual({ lat: 38.64, lng: -0.49 });expect(netejaVideo).toHaveBeenCalledOnce();
    await expect(preparaAdjunt(original, { ...opcions(), comprimeixVideo: fallback, netejaVideo, conservaUbicacio: false })).rejects.toMatchObject({ code: 'ubicacio-no-eliminable' });
  });
  test('cancel·lar durant inspecció no recodifica ni publica coords tardanes', async () => {
    const c = new AbortController();const encode = vi.fn(comprimeix);
    await expect(preparaAdjunt(foto(), { ...opcions(), signal: c.signal, comprimeix: encode,
      inspecciona: async () => { c.abort(); return { coordenades: lloc }; } })).rejects.toMatchObject({ name: 'AbortError' });
    expect(encode).not.toHaveBeenCalled();
  });
  test('amagar una foto és un altre binari i ID; no hi ha coords al resultat', async () => {
    const a = { id: crypto.randomUUID(), fitxer: foto(), tipus: 'imatge', duradaMs: null, ubicacio: lloc };
    const b = await amagaUbicacioAdjunt(a, { comprimeix });
    expect(b.id).not.toBe(a.id);expect(b.fitxer).not.toBe(a.fitxer);expect(b).not.toHaveProperty('ubicacio');expect(a.ubicacio).toBe(lloc);
  });
  test('amagar un vídeo recodificat no fa altra transcodificació', async () => {
    const netejaVideo = vi.fn(); const a = { id: crypto.randomUUID(), fitxer: video(), tipus: 'video', senseUbicacio: true, ubicacio: lloc };
    const b = await amagaUbicacioAdjunt(a, { netejaVideo });expect(b.fitxer).toBe(a.fitxer);expect(b).not.toHaveProperty('ubicacio');expect(netejaVideo).not.toHaveBeenCalled();
  });
});

test('els errors del pipeline tenen text en cinc llengües i cap banner de diners', () => {
  for (const idioma of [ca, es, en, eu, gl]) {
    for (const clau of Object.values(CLAUS_ERROR_ADJUNT)) expect(idioma[clau], clau).toBeTruthy();
    expect(idioma['section.xat.adjunts.error.quota']).not.toMatch(/diners|dinero|money|diru|diñeiro/);
  }
});
