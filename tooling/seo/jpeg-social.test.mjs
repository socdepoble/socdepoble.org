/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · La imatge social d'una foto remota (jpeg-social.mjs):
   la composició, els límits abans de descodificar, l'escala de qualitat, la llista blanca de segments i,
   si la màquina té Pillow i sandbox-exec, el convertidor de veres i el seu aïllament. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ALT_SOCIAL, AMPLE_SOCIAL, DefecteDeDada, defecteDeLOriginal, detectaConvertidor, ErrorDInfraestructura, jpegSocial, LIMITS_DE_L_ORIGINAL,
  modeDeComposicio, nomesSegmentsBasics, PES_MAXIM_SOCIAL, pngDeProva, QUALITATS, sniffImage} from './jpeg-social.mjs';

const png = (w, h) => { const b = Buffer.alloc(33); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b); b.writeUInt32BE(13, 8); b.write('IHDR', 12, 'latin1'); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return b; };
/* Un JPEG baseline mínim; `extres` són segments [marcador, cos] que s'hi afigen abans del SOF0. */
const jpeg = (w = 1200, h = 630, {extres = [], sof = 0xc0, cos = Buffer.alloc(16), eoi = true} = {}) => Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.alloc(14), Buffer.from([0xff, 0xdb, 0x00, 0x03, 0x00]),
  ...extres.map(([m, dades]) => { const mida = Buffer.alloc(2); mida.writeUInt16BE(dades.length + 2); return Buffer.concat([Buffer.from([0xff, m]), mida, dades]); }),
  Buffer.from([0xff, sof, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03]), Buffer.alloc(9),
  Buffer.from([0xff, 0xc4, 0x00, 0x03, 0x00, 0xff, 0xda, 0x00, 0x03, 0x00]), cos, eoi ? Buffer.from([0xff, 0xd9]) : Buffer.alloc(0)]);
const fals = (mides = () => 1000) => { const crides = []; return {crides, convertix: async (bytes, opcions) => { crides.push(opcions); return jpeg(1200, 630, {cos: Buffer.alloc(mides(opcions))}); }}; };

test('modeDeComposicio: es retalla si l’original cobrix 1200x630 sense ampliar i es perd un terç o menys; si no, s’encabix', () => {
  for (const [ample, alt] of [[1200, 800], [1200, 900], [1200, 630], [2400, 1260], [1600, 900], [1200, 945]]) assert.equal(modeDeComposicio({ample, alt}), 'retalla', `${ample}x${alt}`);
  /* 1200x514 (la portada panoràmica d'una entitat de producció) no cobrix els 630 d'alt: no s'amplia mai, s'encabix. */
  for (const [ample, alt] of [[1200, 1200], [600, 600], [800, 1200], [1200, 514], [4000, 1100], [1199, 630], [1200, 946]]) assert.equal(modeDeComposicio({ample, alt}), 'encabix', `${ample}x${alt}`);
});

test('abans de convertir: massa menuda, massa llarga, massa gran o que no és cap imatge és un defecte de dada, sense cridar el convertidor', async () => {
  const convertidor = fals();
  for (const [bytes, motiu] of [[png(299, 600), /299 px d'ample/], [png(4001, 1000), /més de 4:1/], [png(1000, 4001), /més de 4:1/], [png(8193, 4000), /massa gran per a descodificar/],
    [png(7000, 6000), /massa gran per a descodificar/], [Buffer.concat([png(1200, 630), Buffer.alloc(LIMITS_DE_L_ORIGINAL.bytes)]), /el sostre és/],
    [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), /no són cap imatge/], [Buffer.alloc(0), /no són cap imatge/]]) {
    await assert.rejects(jpegSocial(bytes, {convertidor}), error => error instanceof DefecteDeDada && motiu.test(error.message), String(motiu));
    assert.equal(defecteDeLOriginal(bytes) !== null, true);
  }
  assert.equal(convertidor.crides.length, 0);
  assert.equal(defecteDeLOriginal(png(300, 300)), null);
  assert.deepEqual(LIMITS_DE_L_ORIGINAL, {bytes: 5 * 1024 * 1024, ampleMinim: 300, relacioMaxima: 4, costatMaxim: 8192, pixelsMaxims: 40_000_000});
});

test('l’escala baixa de qualitat fins a 300.000 B; si no hi cap, defecte de dada; el mode és el de la forma de l’original', async () => {
  const primer = fals();
  const ok = await jpegSocial(png(1200, 800), {convertidor: primer});
  assert.deepEqual([ok.type, ok.width, ok.height, ok.mode, ok.qualitat, primer.crides], ['image/jpeg', 1200, 630, 'retalla', 85, [{mode: 'retalla', qualitat: 85}]]);
  // Massa pesada fins a la qualitat 74.
  const baixant = fals(({qualitat}) => (qualitat > 74 ? PES_MAXIM_SOCIAL : 1000));
  const baixada = await jpegSocial(png(600, 600), {convertidor: baixant});
  assert.deepEqual([baixada.mode, baixada.qualitat, baixant.crides.map(c => c.qualitat)], ['encabix', 74, [85, 82, 78, 74]]);
  assert.ok(baixada.bytes.length <= PES_MAXIM_SOCIAL);
  const mai = fals(() => PES_MAXIM_SOCIAL);
  await assert.rejects(jpegSocial(png(1200, 800), {convertidor: mai}), error => error instanceof DefecteDeDada && /no hi cap en 300000 B/.test(error.message));
  assert.deepEqual(mai.crides.map(c => c.qualitat), [...QUALITATS]);
  assert.deepEqual([...QUALITATS], [85, 82, 78, 74, 70, 64]);
});

test('un convertidor que no torna un JPEG baseline de 1200x630 només amb segments bàsics és un error d’infraestructura; sense convertidor, també', async () => {
  for (const eixida of [Buffer.from('no és cap JPEG'), png(1200, 630), jpeg(1200, 631), jpeg(1200, 630, {sof: 0xc2}), jpeg(1200, 630, {extres: [[0xe1, Buffer.from('Exif\0\0GPS')]]})]) {
    await assert.rejects(jpegSocial(png(1200, 800), {convertidor: {convertix: async () => eixida}}), error => error instanceof ErrorDInfraestructura);
  }
  await assert.rejects(jpegSocial(png(1200, 800), {}), error => error instanceof ErrorDInfraestructura);
  await assert.rejects(detectaConvertidor({aillament: '/no/existix/sandbox-exec'}), error => error instanceof ErrorDInfraestructura && /Cap aïllament/.test(error.message));
});

test('nomesSegmentsBasics: només APP0, DQT, SOF0, DHT, DRI i SOS, acabat en EOI; qualsevol altre APPn o un COM, fora', () => {
  assert.equal(nomesSegmentsBasics(jpeg()), true);
  assert.equal(nomesSegmentsBasics(jpeg(1200, 630, {extres: [[0xdd, Buffer.from([0, 0])]]})), true, 'DRI');
  for (const [marcador, nom] of [[0xe1, 'APP1 (EXIF, XMP)'], [0xe2, 'APP2 (ICC)'], [0xed, 'APP13 (IPTC)'], [0xee, 'APP14 (Adobe)'], [0xfe, 'COM'], [0xef, 'APP15']]) {
    assert.equal(nomesSegmentsBasics(jpeg(1200, 630, {extres: [[marcador, Buffer.from('dades')]]})), false, nom);
  }
  assert.equal(nomesSegmentsBasics(jpeg(1200, 630, {sof: 0xc2})), false, 'progressiu');
  assert.equal(nomesSegmentsBasics(jpeg(1200, 630, {eoi: false})), false, 'sense EOI');
  for (const dolent of [png(1200, 630), Buffer.from('text'), Buffer.alloc(0)]) assert.equal(nomesSegmentsBasics(dolent), false);
});

test('pngDeProva és un PNG de veres amb les mides que es demanen', () => {
  assert.deepEqual(sniffImage(pngDeProva(400, 300)), {type: 'image/png', width: 400, height: 300});
  assert.deepEqual([AMPLE_SOCIAL, ALT_SOCIAL, PES_MAXIM_SOCIAL], [1200, 630, 300000]);
});

/* El convertidor de veres. Si la màquina no té Pillow o sandbox-exec, detectaConvertidor llança (i la release
   s'atura a posta): ací la prova se salta, i ho diu. */
async function convertidorDeVeres(t) {
  try { const c = await detectaConvertidor(); t.after(() => c.tanca()); return c; } catch (error) {
    if (!(error instanceof ErrorDInfraestructura)) throw error;
    t.skip(`sense convertidor aïllat en esta màquina: ${error.message}`);
    return null;
  }
}

test('convertidor de veres: un original sembrat amb EXIF, GPS, comentari i ICC ix en JPEG baseline de 1200x630 sense cap de les cadenes', async t => {
  const convertidor = await convertidorDeVeres(t);
  if (!convertidor) return;
  /* L'original es fa amb Pillow fora de l'aïllament (és una fixture de la prova): un JPEG de 1600x1200 amb EXIF
     (fabricant, descripció i GPS), un comentari i un perfil ICC. */
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-jpeg-prova-')); t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const original = path.join(dir, 'sembrat.jpg');
  execFileSync(convertidor.interpret, ['-I', '-c', `
import sys
from PIL import Image, ImageCms
im = Image.new('RGB', (1600, 1200), (180, 120, 60))
exif = Image.Exif()
exif[0x010F] = 'FABRICANT_SEMBRAT'
exif[0x010E] = 'DESCRIPCIO_SEMBRADA'
gps = exif.get_ifd(0x8825)
gps[1] = 'N'; gps[2] = (38.0, 36.0, 12.0); gps[3] = 'W'; gps[4] = (0.0, 26.0, 42.0)
icc = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
im.save(sys.argv[1], 'JPEG', quality=90, exif=exif, comment=b'COMENTARI_SEMBRAT', icc_profile=icc)
`, original]);
  const bytes = fs.readFileSync(original);
  for (const cadena of ['FABRICANT_SEMBRAT', 'DESCRIPCIO_SEMBRADA', 'COMENTARI_SEMBRAT']) assert.ok(bytes.includes(cadena), `l'original porta ${cadena}`);
  assert.equal(nomesSegmentsBasics(bytes), false, 'l’original porta APP1, APP2 i COM');
  const social = await jpegSocial(bytes, {convertidor});
  assert.deepEqual([social.type, social.width, social.height, social.mode], ['image/jpeg', 1200, 630, 'retalla']);
  assert.deepEqual(sniffImage(social.bytes), {type: 'image/jpeg', width: 1200, height: 630});
  assert.ok(social.bytes.length <= PES_MAXIM_SOCIAL && nomesSegmentsBasics(social.bytes));
  for (const cadena of ['FABRICANT_SEMBRAT', 'DESCRIPCIO_SEMBRADA', 'COMENTARI_SEMBRAT', 'Exif', 'ICC_PROFILE', 'GPS']) assert.ok(!social.bytes.includes(cadena), `l'eixida no porta ${cadena}`);
});

test('convertidor de veres: un PNG amb alfa ix sobre blanc; un logotip quadrat s’encabix sense ampliar; uns bytes trencats són un defecte de dada', async t => {
  const convertidor = await convertidorDeVeres(t);
  if (!convertidor) return;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-jpeg-prova-')); t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const alfa = path.join(dir, 'alfa.png'), mostra = path.join(dir, 'mostra.txt');
  execFileSync(convertidor.interpret, ['-I', '-c', `
import sys
from PIL import Image
Image.new('RGBA', (600, 600), (0, 0, 0, 0)).save(sys.argv[1], 'PNG')
`, alfa]);
  const social = await jpegSocial(fs.readFileSync(alfa), {convertidor});
  assert.equal(social.mode, 'encabix');
  const sortida = path.join(dir, 'eixida.jpg'); fs.writeFileSync(sortida, social.bytes);
  execFileSync(convertidor.interpret, ['-I', '-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
open(sys.argv[2], 'w').write(repr([im.size, im.getpixel((600, 315)), im.getpixel((5, 5))]))
`, sortida, mostra]);
  // Tot transparent sobre un llenç blanc: el centre i el cantó són blancs (mai negres).
  assert.equal(fs.readFileSync(mostra, 'utf8'), '[(1200, 630), (255, 255, 255), (255, 255, 255)]');
  // Una capçalera de PNG amb un cos que no ho és.
  const trencat = Buffer.concat([pngDeProva(400, 300).subarray(0, 60), Buffer.from('aixo no es cap imatge'.repeat(20))]);
  await assert.rejects(jpegSocial(trencat, {convertidor}), error => error instanceof DefecteDeDada && /no es pot descodificar/.test(error.message));
});

test('convertidor de veres: dins de l’aïllament no hi ha xarxa ni escriptura fora del seu directori temporal', async t => {
  const convertidor = await convertidorDeVeres(t);
  if (!convertidor) return;
  /* El mateix perfil que el convertidor, amb un guió que intenta eixir: obrir un sòcol i escriure fora. */
  const dins = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-jpeg-aillat-'))); t.after(() => fs.rmSync(dins, {recursive: true, force: true}));
  const fora = path.join(fs.realpathSync(os.tmpdir()), `sdp-jpeg-fora-${process.pid}.txt`); t.after(() => fs.rmSync(fora, {force: true}));
  const perfil = `(version 1)(allow default)(deny network*)(deny file-write*)(allow file-write* (subpath "${dins}"))(deny file-read* (subpath "/Users"))`;
  const intent = guio => { try { execFileSync('/usr/bin/sandbox-exec', ['-p', perfil, convertidor.interpret, '-I', '-c', guio], {env: {}, stdio: 'pipe', timeout: 15000}); return 'permés'; } catch { return 'denegat'; } };
  assert.equal(intent(`open(${JSON.stringify(path.join(dins, 'dins.txt'))}, 'w').write('ok')`), 'permés');
  assert.equal(intent(`open(${JSON.stringify(fora)}, 'w').write('fora')`), 'denegat');
  assert.equal(fs.existsSync(fora), false);
  assert.equal(intent(`import socket; socket.create_connection(('1.1.1.1', 443), timeout=3)`), 'denegat');
  assert.equal(intent(`import os; os.listdir('/Users')`), 'denegat');
});
