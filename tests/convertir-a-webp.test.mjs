import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { dataOriginal, gpsTorre, orientacio, tiff } from '../src/components/universal/enquadrament/jpegProva.js';
import {
  MIDA_AVATAR_UNIVERSAL,
  MIDA_QUADRAT_UNIVERSAL,
  convertirImatgeAWebp,
  esRutaDIdentitat,
  extreuTiffExif,
  incrustaExifEnWebp,
  llegixExifUniversal,
  normalitzaOrientacioTiff,
} from '../tooling/maquinaria/convertir_a_webp.mjs';

/* OG-7 (pla 261028_1526 §3.1.1, P1-64; Mestre 261028, decisió 7) · Un JPEG
   real (Pillow) amb el GPS de la Torre i la data, per a les proves del tractor. */
function jpegAmbGps(dir, nom = 'foto-camp.jpg') {
  const jpgBase = path.join(dir, `base-${nom}`);
  const jpgExif = path.join(dir, nom);
  execFileSync('python3', [
    '-c',
    `from PIL import Image; Image.new("RGB", (1600, 1200), (45, 95, 65)).save(${JSON.stringify(jpgBase)}, "JPEG")`,
  ]);
  const realJpg = fs.readFileSync(jpgBase);
  const tiffBytes = tiff({ ifd0: [orientacio(6)], exif: dataOriginal('2026:10:15 09:15:30', '+02:00'), gps: gpsTorre() });
  const app1Len = tiffBytes.length + 8;
  const app1 = Buffer.alloc(4 + app1Len);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1.writeUInt16BE(app1Len, 2);
  app1.write('Exif\0\0', 4, 'ascii');
  Buffer.from(tiffBytes).copy(app1, 10);
  fs.writeFileSync(jpgExif, Buffer.concat([realJpg.subarray(0, 2), app1, realJpg.subarray(2)]));
  return jpgExif;
}

test('convertir_a_webp · extrau TIFF EXIF, normalitza orientació a 1 i l’incrusta en RIFF WebP conservant GPS i dataCaptura', () => {
  const tiffOriginal = tiff({
    ordre: 'MM',
    ifd0: [orientacio(6)],
    exif: dataOriginal('2026:10:15 18:30:00', '+02:00'),
    gps: gpsTorre(),
  });
  const tiffNorm = normalitzaOrientacioTiff(tiffOriginal);

  const vp8x = new Uint8Array(10);
  vp8x[4] = (1200 - 1) & 0xff;
  vp8x[5] = ((1200 - 1) >>> 8) & 0xff;
  vp8x[7] = (1200 - 1) & 0xff;
  vp8x[8] = ((1200 - 1) >>> 8) & 0xff;
  const webpBase = new Uint8Array(12 + 8 + 10);
  webpBase.set([0x52, 0x49, 0x46, 0x46, 22, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], 0);
  webpBase.set([0x56, 0x50, 0x38, 0x58, 10, 0, 0, 0], 12);
  webpBase.set(vp8x, 20);

  const webpAmbExif = incrustaExifEnWebp(webpBase, tiffNorm);
  const tiffExtreu = extreuTiffExif(webpAmbExif);
  assert.ok(tiffExtreu, 'El chunk EXIF ha d’existir al contenidor RIFF WebP');

  const metadades = llegixExifUniversal(webpAmbExif);
  assert.deepEqual(metadades, {
    orientacio: 1,
    gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 },
    dataCaptura: '2026-10-15T18:30:00+02:00',
  });
});

/* OG-7 · ACTUALITZADA A POSTA: l'avatar (400 × 400) ja no conserva l'EXIF de
   sèrie (és identitat); el quadrat, sí. */
test('convertir_a_webp · converteix JPEG amb GPS i data de captura a WebP quadrat 1200x1200 (<80 KB) preservant EXIF, i avatar 400x400 sense EXIF de sèrie', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-webp-test-'));
  try {
    const jpgBase = path.join(dir, 'base.jpg');
    const jpgExif = path.join(dir, 'foto-camp.jpg');
    const webpQuadrat = path.join(dir, 'foto-camp-1200.webp');
    const webpAvatar = path.join(dir, 'foto-camp-400.webp');

    execFileSync('python3', [
      '-c',
      `from PIL import Image; Image.new("RGB", (1600, 1200), (45, 95, 65)).save(${JSON.stringify(jpgBase)}, "JPEG")`,
    ]);
    const realJpg = fs.readFileSync(jpgBase);
    const tiffBytes = tiff({
      ifd0: [orientacio(6)],
      exif: dataOriginal('2026:10:15 09:15:30', '+02:00'),
      gps: gpsTorre(),
    });
    const app1Len = tiffBytes.length + 8;
    const app1 = Buffer.alloc(4 + app1Len);
    app1[0] = 0xff;
    app1[1] = 0xe1;
    app1.writeUInt16BE(app1Len, 2);
    app1.write('Exif\0\0', 4, 'ascii');
    Buffer.from(tiffBytes).copy(app1, 10);
    fs.writeFileSync(jpgExif, Buffer.concat([realJpg.subarray(0, 2), app1, realJpg.subarray(2)]));

    const resQuadrat = convertirImatgeAWebp(jpgExif, webpQuadrat, { mode: 'quadrat', maxKb: 80 });
    assert.equal(resQuadrat.amplada, MIDA_QUADRAT_UNIVERSAL);
    assert.equal(resQuadrat.alcada, MIDA_QUADRAT_UNIVERSAL);
    assert.ok(resQuadrat.bytes <= 80 * 1024);
    assert.equal(resQuadrat.exifPreservat, true);
    assert.deepEqual(resQuadrat.gps, { lat: 38.5919, lng: -0.4184, altitud: 456.7 });
    assert.equal(resQuadrat.dataCaptura, '2026-10-15T09:15:30+02:00');

    const resAvatar = convertirImatgeAWebp(jpgExif, webpAvatar, { mode: 'avatar', maxKb: 40 });
    assert.equal(resAvatar.amplada, MIDA_AVATAR_UNIVERSAL);
    assert.equal(resAvatar.alcada, MIDA_AVATAR_UNIVERSAL);
    assert.ok(resAvatar.bytes <= 40 * 1024);
    assert.equal(resAvatar.exifPreservat, false);
    assert.equal(extreuTiffExif(fs.readFileSync(webpAvatar)), null);
    assert.equal(llegixExifUniversal(fs.readFileSync(webpAvatar)).gps, null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('convertir_a_webp · preserva EXIF en entrades PNG (chunk eXIf) i TIFF, i admet preservaExifBinari:false per a D4/D6', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-webp-png-tiff-'));
  try {
    const exifFile = path.join(dir, 'exif.bin');
    const pngIn = path.join(dir, 'foto.png');
    const tiffIn = path.join(dir, 'foto.tiff');
    const pngOut = path.join(dir, 'foto-png.webp');
    const tiffOut = path.join(dir, 'foto-tiff.webp');
    const privOut = path.join(dir, 'foto-privada.webp');

    const tiffBytes = tiff({
      ordre: 'II',
      ifd0: [orientacio(6)],
      exif: dataOriginal('2026:10:15 09:15:30', '+02:00'),
      gps: gpsTorre(),
    });
    fs.writeFileSync(exifFile, tiffBytes);

    execFileSync('python3', [
      '-c',
      `from PIL import Image\nimport sys\np, ef = sys.argv[1], sys.argv[2]\nim = Image.new("RGB", (600, 400), (20, 80, 120))\nexif = b"Exif\\0\\0" + open(ef, "rb").read()\nim.save(p + "/foto.png", format="PNG", exif=exif)\nim.save(p + "/foto.tiff", format="TIFF", exif=exif)`,
      dir,
      exifFile,
    ]);

    const resPng = convertirImatgeAWebp(pngIn, pngOut, { mode: 'original' });
    assert.equal(resPng.exifPreservat, true);
    assert.deepEqual(resPng.gps, { lat: 38.5919, lng: -0.4184, altitud: 456.7 });
    assert.equal(resPng.dataCaptura, '2026-10-15T09:15:30+02:00');
    assert.equal(llegixExifUniversal(fs.readFileSync(pngOut)).orientacio, 1);

    const resTiff = convertirImatgeAWebp(tiffIn, tiffOut, { mode: 'original' });
    assert.equal(resTiff.exifPreservat, true);
    assert.deepEqual(resTiff.gps, { lat: 38.5919, lng: -0.4184, altitud: 456.7 });
    assert.equal(resTiff.dataCaptura, '2026-10-15T09:15:30+02:00');
    assert.equal(llegixExifUniversal(fs.readFileSync(tiffOut)).orientacio, 1);

    const resPriv = convertirImatgeAWebp(pngIn, privOut, { mode: 'original', preservaExifBinari: false });
    assert.equal(resPriv.exifPreservat, false);
    assert.deepEqual(resPriv.gps, { lat: 38.5919, lng: -0.4184, altitud: 456.7 });
    assert.equal(extreuTiffExif(fs.readFileSync(privOut)), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('convertir_a_webp · imposa estrictament el pressupost maxKb i preserva l’original atòmicament davant fallades', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-webp-atomic-'));
  try {
    const granWebp = path.join(dir, 'gran.webp');
    const originalWebp = path.join(dir, 'original.webp');
    const invalidJpg = path.join(dir, 'invalid.jpg');
    const destiProtegit = path.join(dir, 'protegit.webp');

    execFileSync('python3', [
      '-c',
      `from PIL import Image\nimport sys\np = sys.argv[1]\nim = Image.new("RGB", (400, 400), (120, 40, 60))\nlarge = Image.Exif()\nlarge[270] = "M" * 90000\nlarge[274] = 1\nim.save(p + "/gran.webp", format="WEBP", exif=large)\nim.save(p + "/original.webp", format="WEBP")`,
      dir,
    ]);

    assert.throws(
      () => convertirImatgeAWebp(granWebp, path.join(dir, 'out-gran.webp'), { maxKb: 80 }),
      /superen el pressupost màxim permès/,
    );
    assert.equal(fs.existsSync(path.join(dir, 'out-gran.webp')), false);

    assert.throws(
      () => convertirImatgeAWebp(originalWebp, path.join(dir, 'out-1kb.webp'), { maxKb: 0.05 }),
      /superen el pressupost|supera el pressupost/,
    );

    const bytesOriginals = fs.readFileSync(originalWebp);
    const shims = path.join(dir, 'shim');
    fs.mkdirSync(shims);
    fs.writeFileSync(path.join(shims, 'python3'), '#!/bin/sh\nprintf partial > "$4"\nexit 9\n', { mode: 0o755 });
    const prevPath = process.env.PATH;
    process.env.PATH = `${shims}:${prevPath}`;
    try {
      assert.throws(() => convertirImatgeAWebp(originalWebp));
    } finally {
      process.env.PATH = prevPath;
    }
    assert.deepEqual(fs.readFileSync(originalWebp), bytesOriginals, 'L’original no pot quedar truncat si falla l’encoder');
    const restants = fs.readdirSync(dir).filter((f) => f.includes('.tmp-'));
    assert.deepEqual(restants, [], 'Cap fitxer temporal residual pot quedar al directori');

    fs.writeFileSync(invalidJpg, 'no-es-imatge');
    fs.writeFileSync(destiProtegit, 'contingut-intacte');
    assert.throws(
      () => convertirImatgeAWebp(invalidJpg, destiProtegit),
      /Format d’imatge no suportat/,
    );
    assert.equal(fs.readFileSync(destiProtegit, 'utf8'), 'contingut-intacte');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


/* OG-7 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 7) · Una foto
   d'identitat no porta el GPS: el mode avatar i qualsevol ruta d'eixida
   d'identitat (el patró del test d'OG-7) no l'incrusten si no es força
   (preservaExifBinari: true, la bandera --conserva-exif). */
test('convertir_a_webp · OG-7 · --mode avatar i les rutes d’identitat ixen sense GPS de sèrie; només forçant-ho el conserven', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-webp-og7-'));
  try {
    const jpgExif = jpegAmbGps(dir);
    const senseGps = (fitxer) => {
      assert.equal(extreuTiffExif(fs.readFileSync(fitxer)), null, fitxer);
      assert.equal(llegixExifUniversal(fs.readFileSync(fitxer)).gps, null, fitxer);
    };

    const avatar = path.join(dir, 'avatar-400.webp');
    assert.equal(convertirImatgeAWebp(jpgExif, avatar, { mode: 'avatar', maxKb: 40 }).exifPreservat, false);
    senseGps(avatar);

    fs.mkdirSync(path.join(dir, 'avatars'));
    const perCarpeta = path.join(dir, 'avatars', 'javi-1200.webp');
    assert.equal(convertirImatgeAWebp(jpgExif, perCarpeta, { mode: 'quadrat', maxKb: 80 }).exifPreservat, false);
    senseGps(perCarpeta);
    const perNom = path.join(dir, 'javi-llinares-perfil-1200px.webp');
    assert.equal(convertirImatgeAWebp(jpgExif, perNom, { mode: 'quadrat', maxKb: 80 }).exifPreservat, false);
    senseGps(perNom);

    const forcat = path.join(dir, 'avatar-forcat.webp');
    const resForcat = convertirImatgeAWebp(jpgExif, forcat, { mode: 'avatar', maxKb: 40, preservaExifBinari: true });
    assert.equal(resForcat.exifPreservat, true);
    assert.deepEqual(llegixExifUniversal(fs.readFileSync(forcat)).gps, { lat: 38.5919, lng: -0.4184, altitud: 456.7 });

    const patrimoni = path.join(dir, 'font-del-poble.webp');
    assert.equal(convertirImatgeAWebp(jpgExif, patrimoni, { mode: 'quadrat', maxKb: 80 }).exifPreservat, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('convertir_a_webp · OG-7 · esRutaDIdentitat mira el camí dins del repo i, fora, només la carpeta i el nom', () => {
  const arrel = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  assert.equal(esRutaDIdentitat(path.join(arrel, 'public/assets/uploads/gent/javi-llinares/avatars/a.webp')), true);
  assert.equal(esRutaDIdentitat(path.join(arrel, 'public/assets/uploads/avatars/b.webp')), true);
  assert.equal(esRutaDIdentitat(path.join(arrel, 'public/assets/fotos/javi-llinares-perfil-1200px.webp')), true);
  assert.equal(esRutaDIdentitat(path.join(arrel, 'public/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.webp')), false);
  assert.equal(esRutaDIdentitat('/Users/gent/proves/foto.webp'), false);
  assert.equal(esRutaDIdentitat('/tmp/usuaris/foto.webp'), true);
});
