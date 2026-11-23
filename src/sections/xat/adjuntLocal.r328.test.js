import ca from '../../config/idiomes/ca.js';
import es from '../../config/idiomes/es.js';
import en from '../../config/idiomes/en.js';
import eu from '../../config/idiomes/eu.js';
import gl from '../../config/idiomes/gl.js';
// @vitest-environment node
import { describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { preparaAdjunt, amagaUbicacioAdjunt, senseUbicacioVideo, CLAUS_ERROR_ADJUNT } from './adjuntLocal.js';
import { ERRORS_ADJUNT_XAT, MAX_VIDEO_ENTRADA_BYTES } from '../../data/xatMultimedia.js';
import { ascii, box, join } from '../../../tests/helpers/contenidorsMedia.js';
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
  /* v1.2.23 · IDEA-331 (ordre del Mestre 261123, deroga el bloqueig per defecte de L4-04) · Per defecte l'original
     del fallback ix tal com és, amb el seu lloc i sense passar pel sanejador. Només l'opt-out el bloqueja si no es
     pot netejar. */
  test('fallback MP4: per defecte l’original ix amb el lloc; amb opt-out no ix si no es pot netejar', async () => {
    const original = video();const fallback = async fitxer => ({ fitxer, comprimit: false, motiuFallback: 'video-compressio-no-disponible' });
    const netejaVideo = vi.fn(async fitxer => ({ fitxer, net: false }));
    await expect(preparaAdjunt(original, { ...opcions(), comprimeixVideo: fallback, netejaVideo })).resolves.toMatchObject({
      fitxer: original, senseUbicacio: false, conservaUbicacio: true, ubicacio: { lat: 38.64, lng: -0.49 }, motiuFallback: 'video-compressio-no-disponible' });
    expect(netejaVideo).not.toHaveBeenCalled();
    // v1.2.22 · Gauntlet R1 (L4-04) · L'avís d'un MP4/MOV no acreditable és el seu propi.
    // Gauntlet R2 (M2-02) · En el fallback del navegador, l'avís és el del navegador i porta el motiu.
    await expect(preparaAdjunt(original, { ...opcions(), comprimeixVideo: fallback, netejaVideo, conservaUbicacio: false })).rejects.toMatchObject({ code: 'video-no-acreditable-navegador', motiuFallback: 'video-compressio-no-disponible' });
    expect(netejaVideo).toHaveBeenCalledOnce();
    // Un compressor sense motiuFallback (el real sempre el dona amb comprimit:false) manté l'avís del fitxer.
    await expect(preparaAdjunt(original, { ...opcions(), comprimeixVideo: async fitxer => ({ fitxer, comprimit: false }), netejaVideo, conservaUbicacio: false })).rejects.toMatchObject({ code: 'video-no-acreditable' });
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

/* v1.2.22 · Gauntlet R2 (M2-02) · El mateix MOV de telèfon (vide + soun + una pista de metadades amb handler meta, com
   la mebx de l'iPhone), amb l'inspector i el sanejador reals. Si el navegador el comprimix, ix net en un contenidor nou;
   si no ha pogut (motiuFallback), no ix i l'avís és el del navegador, per a cada motiu de fallback que llista
   compressioVideoClient.js. La política no canvia: un MP4/MOV que no es pot acreditar no s'envia.
   v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Ara només quan la persona ha demanat «Amaga el lloc»: per defecte ix
   tal com és, amb el lloc, i la interfície ho diu abans de publicar. */
describe('R2 · M2-02 · l’avís del vídeo no acreditable depén del camí', () => {
  const hdlr = (handler) => { const d = new Uint8Array(24); d.set(ascii(handler), 8); return box('hdlr', d); };
  const trak = (handler) => box('trak', box('mdia', hdlr(handler)));
  const mov = (...handlers) => new Blob([box('ftyp', join(ascii('qt  '), new Uint8Array(4), ascii('qt  '))),
    box('moov', join(...handlers.map(trak))), box('mdat', new Uint8Array(64))], { type: 'video/quicktime' });
  const movTelefon = () => mov('vide', 'soun', 'meta');
  const font = readFileSync(new URL('../../utils/compressioVideoClient.js', import.meta.url), 'utf8');
  const MOTIUS_FALLBACK = [...(/const FALLBACKS = new Set\(\[([^\]]*)\]\)/.exec(font)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);

  test('la llista de fallbacks és la de compressioVideoClient.js i el sanejador real no acredita el MOV', async () => {
    expect(MOTIUS_FALLBACK).toEqual(['video-compressio-no-disponible', 'video-audio-no-capturable', 'video-compressio', 'video-compressio-temps', 'video-mida']);
    expect((await senseUbicacioVideo(movTelefon())).net).toBe(false);
    expect((await senseUbicacioVideo(mov('vide', 'soun'))).net).toBe(true);
  });
  test('si el navegador el comprimix, el mateix MOV ix net', async () => {
    const comprimeixVideo = async (_fitxer, { duradaMs }) => ({ fitxer: new Blob([new Uint8Array(100)], { type: 'video/mp4' }), duradaMs, comprimit: true });
    for (const conservaUbicacio of [true, false]) {
      await expect(preparaAdjunt(movTelefon(), { conservaUbicacio, lligDurada: async () => 5000, comprimeixVideo }))
        .resolves.toMatchObject({ tipus: 'video', senseUbicacio: true, videoComprimit: true });
    }
  });
  /* v1.2.23 · IDEA-331 · Per defecte el mateix MOV ix tal com és (amb el lloc); amb «Amaga el lloc» no ix i l'avís és
     el del navegador, també quan la persona l'amaga després de preparar-lo (amagaUbicacioAdjunt). */
  test.each(MOTIUS_FALLBACK)('fallback %s: per defecte el MOV ix tal com és; amb opt-out no ix, amb l’avís del navegador', async (motiu) => {
    const opcions = { lligDurada: async () => 5000, comprimeixVideo: async (fitxer) => ({ fitxer, comprimit: false, motiuFallback: motiu }) };
    const mov = movTelefon();
    const conservat = await preparaAdjunt(mov, opcions);
    expect(conservat).toMatchObject({ fitxer: mov, tipus: 'video', senseUbicacio: false, conservaUbicacio: true, motiuFallback: motiu });
    const error = await preparaAdjunt(movTelefon(), { ...opcions, conservaUbicacio: false }).catch((e) => e);
    expect(error).toMatchObject({ code: 'video-no-acreditable-navegador', motiuFallback: motiu, message: ERRORS_ADJUNT_XAT['video-no-acreditable-navegador'] });
    const despres = await amagaUbicacioAdjunt(conservat).catch((e) => e);
    expect(despres).toMatchObject({ code: 'video-no-acreditable-navegador', motiuFallback: motiu });
  });
  test('l’avís del navegador és en les cinc llengües, el valencià és el del codi i no promet cap eixida', () => {
    const clau = CLAUS_ERROR_ADJUNT['video-no-acreditable-navegador'];
    expect(clau).toBe('section.xat.adjunts.error.video-no-acreditable-navegador');
    expect(ca[clau]).toBe(ERRORS_ADJUNT_XAT['video-no-acreditable-navegador']);
    for (const idioma of [ca, es, en, eu, gl]) {
      expect(idioma[clau], clau).toBeTruthy();
      expect(idioma[clau]).not.toBe(idioma['section.xat.adjunts.error.video-no-acreditable']);
      // Ni un altre vídeo (fa el mateix camí) ni un altre navegador (pot no descodificar-lo).
      expect(idioma[clau]).not.toMatch(/\b(Prova|Prueba|Try|Probatu|Proba|altre|otro|another|beste|outro)\b/);
    }
  });
});

test('els errors del pipeline tenen text en cinc llengües i cap banner de diners', () => {
  for (const idioma of [ca, es, en, eu, gl]) {
    for (const clau of Object.values(CLAUS_ERROR_ADJUNT)) expect(idioma[clau], clau).toBeTruthy();
    expect(idioma['section.xat.adjunts.error.quota']).not.toMatch(/diners|dinero|money|diru|diñeiro/);
  }
});
