import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ARRELS_WIKI, opcions, mides, midaDesti, patronsDinamics, classifica, cens, pla, triaCodificador,
  rutaChrome, paginaChrome, webpDeDom, executa, main, motiuDError,
} from './optimitzar_webp.mjs';

/* ── Capçaleres sintètiques ── */

function png(amplada, alcada) {
  const b = Buffer.alloc(33);
  b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(0x0d0a1a0a, 4);
  b.writeUInt32BE(13, 8); b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(amplada, 16); b.writeUInt32BE(alcada, 20);
  return b;
}

/** JPEG mínim: SOI, APP1 amb EXIF (orientació) i SOF0 amb les mides. */
function jpeg(amplada, alcada, orientacio = null, bigEndian = true) {
  const parts = [Buffer.from([0xff, 0xd8])];
  if (orientacio) {
    const tiff = Buffer.alloc(8 + 2 + 12 + 4);
    tiff.write(bigEndian ? 'MM' : 'II', 0, 'latin1');
    const u16 = (v, p) => (bigEndian ? tiff.writeUInt16BE(v, p) : tiff.writeUInt16LE(v, p));
    const u32 = (v, p) => (bigEndian ? tiff.writeUInt32BE(v, p) : tiff.writeUInt32LE(v, p));
    u16(42, 2); u32(8, 4); u16(1, 8);
    u16(0x0112, 10); u16(3, 12); u32(1, 14); u16(orientacio, 18);
    const app1 = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
    const cap = Buffer.from([0xff, 0xe1, 0, 0]);
    cap.writeUInt16BE(app1.length + 2, 2);
    parts.push(cap, app1);
  }
  const sof = Buffer.from([0xff, 0xc0, 0, 17, 8, 0, 0, 0, 0, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  sof.writeUInt16BE(alcada, 5); sof.writeUInt16BE(amplada, 7);
  parts.push(sof, Buffer.from([0xff, 0xd9]));
  return Buffer.concat(parts);
}

function gif(amplada, alcada) {
  const b = Buffer.alloc(13);
  b.write('GIF89a', 0, 'latin1'); b.writeUInt16LE(amplada, 6); b.writeUInt16LE(alcada, 8);
  return b;
}

function webpVp8x(amplada, alcada) {
  const b = Buffer.alloc(30);
  b.write('RIFF', 0, 'latin1'); b.writeUInt32LE(22, 4); b.write('WEBP', 8, 'latin1'); b.write('VP8X', 12, 'latin1');
  b.writeUIntLE(amplada - 1, 24, 3); b.writeUIntLE(alcada - 1, 27, 3);
  return b;
}

const temporal = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-webp-prova-'));
const escriu = (arrel, rel, contingut) => {
  const abs = path.join(arrel, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contingut);
  return abs;
};

/* ── Arguments ── */

test('opcions: cens per defecte, read-only i valors per defecte de l\'encàrrec', () => {
  const o = opcions([]);
  assert.equal(o.ordre, 'cens');
  assert.equal(o.max, 1600);
  assert.equal(o.qualitat, 80);
  assert.equal(o.aplica, false);
});

test('opcions: converteix amb camins i banderes', () => {
  const o = opcions(['converteix', 'a.jpg', 'carpeta', '--max', '1200', '--qualitat', '75', '--aplica', '--codificador', 'chrome', '--eixida', 'x']);
  assert.deepEqual(o.camins, ['a.jpg', 'carpeta']);
  assert.equal(o.max, 1200);
  assert.equal(o.qualitat, 75);
  assert.equal(o.aplica, true);
  assert.equal(o.codificador, 'chrome');
  assert.equal(o.eixida, 'x');
});

test('opcions: rebutja ordres, valors i codificadors invàlids', () => {
  assert.throws(() => opcions(['esborra']), /Ordre desconeguda/);
  assert.throws(() => opcions(['converteix']), /almenys un fitxer/);
  assert.throws(() => opcions(['cens', 'public']), /no accepta camins/);
  assert.throws(() => opcions(['converteix', 'a.jpg', '--max', '99']), /entre 320 i 4096/);
  assert.throws(() => opcions(['converteix', 'a.jpg', '--max']), /necessita un valor/);
  assert.throws(() => opcions(['converteix', 'a.jpg', '--codificador', 'photoshop']), /Codificador desconegut/);
  assert.throws(() => opcions(['--esborra']), /Opció desconeguda/);
});

/* ── Capçaleres ── */

test('mides: PNG, GIF, WebP i JPEG sense dependències', () => {
  assert.deepEqual(mides(png(1441, 1269)), { format: 'png', amplada: 1441, alcada: 1269, orientacio: 1 });
  assert.deepEqual(mides(gif(64, 32)), { format: 'gif', amplada: 64, alcada: 32, orientacio: 1 });
  assert.deepEqual(mides(webpVp8x(1200, 630)), { format: 'webp', amplada: 1200, alcada: 630, orientacio: 1 });
  assert.deepEqual(mides(jpeg(5184, 3888)), { format: 'jpeg', amplada: 5184, alcada: 3888, orientacio: 1 });
});

test('mides: llig l\'orientació EXIF en tots dos ordres de bytes', () => {
  assert.equal(mides(jpeg(4624, 3472, 6, true)).orientacio, 6);
  assert.equal(mides(jpeg(4624, 3472, 8, false)).orientacio, 8);
});

test('mides: torna null amb dades que no són imatge o tallades', () => {
  assert.equal(mides(Buffer.from('hola, açò no és una imatge')), null);
  assert.equal(mides(Buffer.from([0xff, 0xd8, 0xff])), null);
  assert.equal(mides('no és un buffer'), null);
});

test('midaDesti: limita el costat llarg, no amplia mai i gira amb EXIF 5-8', () => {
  assert.deepEqual(midaDesti({ amplada: 5184, alcada: 3888 }, 1600), { amplada: 1600, alcada: 1200, redueix: true });
  assert.deepEqual(midaDesti({ amplada: 800, alcada: 600 }, 1600), { amplada: 800, alcada: 600, redueix: false });
  assert.deepEqual(midaDesti({ amplada: 4624, alcada: 3472, orientacio: 6 }, 1200), { amplada: 901, alcada: 1200, redueix: true });
});

/* ── Cens ── */

test('patronsDinamics: plantilles amb literals reconstruïxen camins', () => {
  const patrons = patronsDinamics('const a = `/assets/towns/${slug}/1.jpg`; const b = `${x}${y}`; const c = `hola ${nom}`;');
  assert.equal(patrons.length, 1);
  assert.ok(patrons[0].test('/assets/towns/la-torre/1.jpg'));
  assert.ok(!patrons[0].test('/assets/towns/la-torre/2.jpg'));
});

test('classifica: codi, dinàmica, carpeta citada, wiki i orfe', () => {
  const imatges = ['assets/a/usada.png', 'assets/towns/poble_2.jpg', 'assets/system/x.png', 'assets/doc/nomes-wiki.jpg', 'assets/b/orfe.png']
    .map((cami) => ({ cami, bytes: 10 }));
  const codi = "img src='/assets/a/usada.png'; `/assets/towns/${slug}_${n}.jpg`; const base = '/assets/system/';";
  const wiki = '![captura](../public/assets/doc/nomes-wiki.jpg)';
  const estats = Object.fromEntries(classifica(imatges, { codi, wiki }).map((i) => [i.cami, i.estat]));
  assert.deepEqual(estats, {
    'assets/a/usada.png': 'codi',
    'assets/towns/poble_2.jpg': 'dinamic',
    'assets/system/x.png': 'dinamic',
    'assets/doc/nomes-wiki.jpg': 'wiki',
    'assets/b/orfe.png': 'orfe',
  });
});

test('classifica: el nom sol també salva una imatge (criteri conservador)', () => {
  const [img] = classifica([{ cami: 'assets/fotos/sultan.png', bytes: 1 }], { codi: "foto: 'sultan.png'", wiki: '' });
  assert.equal(img.estat, 'codi');
});

test('cens: inventari d\'una arrel sintètica, sense tocar cap fitxer', () => {
  const arrel = temporal();
  try {
    escriu(arrel, 'public/assets/fotos/gran.jpg', Buffer.concat([jpeg(4000, 3000), Buffer.alloc(400 * 1024)]));
    escriu(arrel, 'public/assets/fotos/gran.webp', webpVp8x(1600, 1200));
    escriu(arrel, 'public/assets/fotos/oblidada.png', png(100, 100));
    escriu(arrel, 'src/App.jsx', "const foto = '/assets/fotos/gran.jpg';\n");
    escriu(arrel, path.join(ARRELS_WIKI[0], '90_arxiu_historic', 'vell.md'), 'assets/fotos/oblidada.png');
    const abans = fs.readdirSync(path.join(arrel, 'public/assets/fotos')).sort();
    const { resum, imatges } = cens(arrel, { max: 1600, llindarKb: 300 });
    assert.equal(resum.total, 3);
    assert.equal(resum.perEstat.orfe, 1, 'només la imatge citada des de 90_arxiu_historic');
    assert.equal(imatges.find((i) => i.cami === 'assets/fotos/oblidada.png').estat, 'orfe', '90_arxiu_historic no compta com a referència');
    const gran = imatges.find((i) => i.cami === 'assets/fotos/gran.jpg');
    assert.equal(gran.estat, 'codi');
    assert.equal(gran.candidataWebp, true);
    assert.equal(gran.teWebp, true);
    // Encàrrec 261019_1425 · La bessona sense cap cita hereta l'estat del seu original.
    const bessona = imatges.find((i) => i.cami === 'assets/fotos/gran.webp');
    assert.equal(bessona.estat, 'codi');
    assert.equal(bessona.bessonaDe, 'assets/fotos/gran.jpg');
    assert.equal(imatges.find((i) => i.cami === 'assets/fotos/oblidada.png').candidataWebp, false);
    assert.ok(imatges.every((i) => !('abs' in i)), 'el JSON no exposa camins absoluts');
    assert.deepEqual(fs.readdirSync(path.join(arrel, 'public/assets/fotos')).sort(), abans);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

/* ── Pla i execució ── */

test('pla: destí al costat, respecta webp existents i col·lisions', () => {
  const arrel = temporal();
  try {
    const a = escriu(arrel, 'in/foto.jpg', jpeg(3000, 2000));
    const b = escriu(arrel, 'in/foto.png', png(10, 10));
    const c = escriu(arrel, 'in/ja.png', png(2000, 1000));
    escriu(arrel, 'in/ja.webp', webpVp8x(10, 10));
    const d = escriu(arrel, 'in/trencada.jpg', Buffer.from('no és jpeg'));
    const passos = pla([a, b, c, d], { max: 1600 });
    const per = Object.fromEntries(passos.map((p) => [path.basename(p.orig), p]));
    assert.match(per['foto.jpg'].salta, /mateix \.webp/);
    assert.match(per['foto.png'].salta, /mateix \.webp/);
    assert.match(per['ja.png'].salta, /ja existix/);
    assert.match(per['trencada.jpg'].salta, /capçalera/);
    const ambSobreescriu = pla([c], { max: 1600, sobreescriu: true });
    assert.equal(ambSobreescriu[0].salta, null);
    assert.deepEqual(ambSobreescriu[0].midesDesti, { amplada: 1600, alcada: 800, redueix: true });
    const ambEixida = pla([c], { max: 1600, sobreescriu: true, eixida: 'fora', base: arrel });
    assert.equal(ambEixida[0].desti, path.join(arrel, 'fora', 'ja.webp'));
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('executa: sense --aplica no escriu; amb --aplica escriu i no toca l\'original', async () => {
  const arrel = temporal();
  try {
    const orig = escriu(arrel, 'in/foto.png', Buffer.concat([png(2000, 1000), Buffer.alloc(2048)]));
    const original = fs.readFileSync(orig);
    const petit = async () => webpVp8x(1600, 800);
    const opts = { max: 1600, qualitat: 80 };
    const [sec] = await executa(pla([orig], opts), { nom: 'prova' }, { ...opts, aplica: false }, petit);
    assert.equal(sec.bytesWebp, 30);
    assert.equal(fs.existsSync(sec.desti), false, 'sense --aplica no hi ha .webp');
    const [aplicat] = await executa(pla([orig], opts), { nom: 'prova' }, { ...opts, aplica: true }, petit);
    assert.equal(aplicat.escrit, true);
    assert.deepEqual(fs.readFileSync(aplicat.desti), webpVp8x(1600, 800));
    assert.deepEqual(fs.readFileSync(orig), original, 'l\'original no es toca mai');
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('executa: un .webp que no pesa menys no s\'escriu i un error queda en el seu pas', async () => {
  const arrel = temporal();
  try {
    const orig = escriu(arrel, 'in/xicoteta.png', png(100, 100));
    const opts = { max: 1600, qualitat: 80, aplica: true };
    const [gros] = await executa(pla([orig], opts), { nom: 'prova' }, opts, async () => Buffer.alloc(4096));
    assert.match(gros.salta, /no pesa menys/);
    assert.equal(fs.existsSync(gros.desti), false);
    const [trencat] = await executa(pla([orig], opts), { nom: 'inexistent' }, opts);
    assert.match(trencat.error, /Codificador desconegut/);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

/* ── Codificadors ── */

test('l\'ordre de preferència comença per la maquinària del Mas (conserva l\'EXIF)', async () => {
  const { ORDRE_CODIFICADORS } = await import('./optimitzar_webp.mjs');
  assert.deepEqual(ORDRE_CODIFICADORS, ['maquinaria', 'sharp', 'cwebp', 'magick', 'chrome']);
  assert.equal(opcions(['converteix', 'a.jpg', '--codificador', 'maquinaria']).codificador, 'maquinaria');
});

test('triaCodificador: auto tria el primer; un demanat absent torna null', () => {
  const disponibles = [{ nom: 'cwebp', ruta: '/x/cwebp' }, { nom: 'chrome', ruta: '/x/chrome' }];
  assert.equal(triaCodificador(disponibles).nom, 'cwebp');
  assert.equal(triaCodificador(disponibles, 'chrome').nom, 'chrome');
  assert.equal(triaCodificador(disponibles, 'magick'), null);
  assert.equal(triaCodificador([]), null);
});

test('rutaChrome: la variable d\'entorn mana si el fitxer existix', () => {
  assert.equal(rutaChrome({ SDP_CHROME: '/opt/chrome' }, (c) => c === '/opt/chrome'), '/opt/chrome');
});

test('paginaChrome i webpDeDom: la pàgina porta els paràmetres i el DOM es valida', () => {
  const pagina = paginaChrome('QUJD', 'image/png', 1200, 75);
  assert.match(pagina, /1200 \/ Math\.max/);
  assert.match(pagina, /'image\/webp', 0\.75/);
  assert.match(pagina, /data:image\/png;base64,QUJD/);
  const webp = webpVp8x(10, 10);
  assert.deepEqual(webpDeDom(`<pre id="sdp-webp">data:image/webp;base64,${webp.toString('base64')}</pre>`), webp);
  assert.throws(() => webpDeDom('<body>SDP-WEBP-ERROR</body>'), /no ha pogut decodificar/);
  assert.throws(() => webpDeDom(`data:image/webp;base64,${Buffer.from('fals').toString('base64')}`), /no és WebP/);
});

/* ── CLI ── */

test('main: ús incorrecte ix amb 2 i el cens ix amb 0', async () => {
  const arrel = temporal();
  const linies = [];
  const sortida = { log: (t) => linies.push(t), error: (t) => linies.push(t) };
  try {
    escriu(arrel, 'public/assets/a.png', png(10, 10));
    assert.equal(await main(['esborra'], { arrel, sortida }), 2);
    assert.equal(await main(['cens', '--json'], { arrel, sortida }), 0);
    const json = JSON.parse(linies.at(-1));
    assert.equal(json.resum.total, 1);
    assert.equal(json.resum.perEstat.orfe, 1);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

/* ── Revisió adversarial (261018) ── */

test('mides: un APP1 d\'XMP darrere de l\'EXIF no torna l\'orientació a 1', () => {
  const ambExif = jpeg(4000, 3000, 6);
  const xmp = Buffer.concat([Buffer.from([0xff, 0xe1, 0, 0]), Buffer.from('http://ns.adobe.com/xap/1.0/\0<x/>', 'latin1')]);
  xmp.writeUInt16BE(xmp.length - 2, 2);
  const buf = Buffer.concat([ambExif.subarray(0, ambExif.length - 21), xmp, ambExif.subarray(ambExif.length - 21)]);
  assert.equal(mides(buf).orientacio, 6);
  assert.deepEqual(midaDesti(mides(buf), 1600), { amplada: 1200, alcada: 1600, redueix: true });
});

test('triaCodificador: la maquinària només rep JPEG; un PNG va al següent', () => {
  const disponibles = [{ nom: 'maquinaria', ruta: 'x' }, { nom: 'chrome', ruta: '/x/chrome' }];
  assert.equal(triaCodificador(disponibles, 'auto', 'jpeg').nom, 'maquinaria');
  assert.equal(triaCodificador(disponibles, 'auto', 'png').nom, 'chrome');
  assert.equal(triaCodificador(disponibles, 'maquinaria', 'png'), null);
});

test('executa: tria el codificador per format i ho apunta a cada pas', async () => {
  const arrel = temporal();
  try {
    const a = escriu(arrel, 'in/foto.jpg', Buffer.concat([jpeg(3000, 2000), Buffer.alloc(4096)]));
    const b = escriu(arrel, 'in/dibuix.png', Buffer.concat([png(3000, 2000), Buffer.alloc(4096)]));
    const disponibles = [{ nom: 'maquinaria' }, { nom: 'chrome' }];
    const passos = await executa(pla([a, b], { max: 1600 }), (format) => triaCodificador(disponibles, 'auto', format),
      { max: 1600, qualitat: 80, aplica: false }, async () => webpVp8x(10, 10));
    assert.deepEqual(passos.map((p) => p.codificador), ['maquinaria', 'chrome']);
    const [sense] = await executa(pla([b], { max: 1600 }), () => null, { max: 1600, qualitat: 80, aplica: false });
    assert.match(sense.error, /cap codificador disponible per a png/);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('motiuDError: hi afig l\'última línia de l\'stderr de l\'eina', () => {
  const e = Object.assign(new Error('Command failed: python3 -c \nTraceback...'), { stderr: 'Traceback\nPIL.UnidentifiedImageError: cannot identify image file\n' });
  assert.equal(motiuDError(e), 'Command failed: python3 -c  · PIL.UnidentifiedImageError: cannot identify image file');
  assert.equal(motiuDError(new Error('simple')), 'simple');
});

test('pla: Foto.jpg i foto.png col·lidixen també sense distingir majúscules', () => {
  const arrel = temporal();
  try {
    const a = escriu(arrel, 'in/Foto.jpg', jpeg(100, 100));
    const b = escriu(arrel, 'in/foto.png', png(100, 100));
    const passos = pla([a, b], { max: 1600 });
    assert.ok(passos.every((p) => /mateix \.webp/.test(p.salta)));
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('classifica: una base sense barra final, una adreça absoluta i una extensió dinàmica no fan orfes', () => {
  const imatges = ['assets/towns/poble.jpg', 'assets/og/poble.png', 'assets/ui/plugins/tpv_vinyeta.webp']
    .map((cami) => ({ cami, bytes: 1 }));
  const codi = [
    "const BASE = '/assets/towns'; const u = `${BASE}/${slug}.jpg`;",
    'const og = `https://socdepoble.org/assets/og/${slug}.png`;',
    'const imatge = `${IMATGES_PLUGINS}/${id}_vinyeta.${extensioImatge}`;',
  ].join('\n');
  const estats = classifica(imatges, { codi, wiki: '' }).map((i) => i.estat);
  assert.deepEqual(estats, ['dinamic', 'dinamic', 'dinamic']);
});

/* ── Encàrrec 261019_1425 (alliberament multimèdia) ── */

test('esCandidata i --nomes-candidates: el mateix criteri que el cens (pes o costat llarg)', async () => {
  const { esCandidata, nomesCandidates } = await import('./optimitzar_webp.mjs');
  const opts = { max: 1600, llindarKb: 300 };
  assert.equal(esCandidata({ ext: '.jpg', bytes: 301 * 1024, mides: { amplada: 10, alcada: 10 } }, opts), true);
  assert.equal(esCandidata({ ext: '.PNG', bytes: 10, mides: { amplada: 1601, alcada: 10 } }, opts), true);
  assert.equal(esCandidata({ ext: '.png', bytes: 300 * 1024, mides: { amplada: 1600, alcada: 1600 } }, opts), false);
  assert.equal(esCandidata({ ext: '.webp', bytes: 900 * 1024, mides: null }, opts), false);
  assert.equal(opcions(['converteix', 'x', '--nomes-candidates']).nomesCandidates, true);
  assert.equal(opcions(['converteix', 'x']).nomesCandidates, false);
  const arrel = temporal();
  try {
    const gran = escriu(arrel, 'in/gran.jpg', jpeg(4000, 3000));
    const pesada = escriu(arrel, 'in/pesada.png', Buffer.concat([png(100, 100), Buffer.alloc(400 * 1024)]));
    const petita = escriu(arrel, 'in/petita.png', png(100, 100));
    assert.deepEqual(nomesCandidates([gran, pesada, petita], opts), { candidates: [gran, pesada], descartades: 1 });
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('main converteix --nomes-candidates: les no candidates no entren al pla', async () => {
  const arrel = temporal();
  const linies = [];
  const sortida = { log: (t) => linies.push(t), error: (t) => linies.push(t) };
  try {
    escriu(arrel, 'in/gran.jpg', jpeg(4000, 3000));
    escriu(arrel, 'in/petita.png', png(100, 100));
    const codi = await main(['converteix', path.join(arrel, 'in'), '--nomes-candidates', '--json'], { arrel, sortida });
    // Sense codificador en esta màquina el tractor ix amb 2 abans del pla: llavors no hi ha res a comprovar.
    if (codi === 2) return;
    const json = JSON.parse(linies.at(-1));
    assert.equal(json.descartades, 1);
    assert.deepEqual(json.passos.map((p) => path.basename(p.orig)), ['gran.jpg']);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('executa: escriu en un temporal i el canvia de nom; si falla, no queda cap .webp ni cap temporal', async () => {
  const arrel = temporal();
  try {
    const orig = escriu(arrel, 'in/foto.png', Buffer.concat([png(2000, 1000), Buffer.alloc(2048)]));
    const opts = { max: 1600, qualitat: 80, aplica: true };
    const [bo] = await executa(pla([orig], opts), { nom: 'prova' }, opts, async () => webpVp8x(1600, 800));
    assert.equal(bo.escrit, true);
    assert.deepEqual(fs.readdirSync(path.join(arrel, 'in')).sort(), ['foto.png', 'foto.webp']);
    fs.rmSync(bo.desti);
    // Un temporal que ja hi és (una altra passada a mitges) fa fallar l'escriptura sense tocar res.
    const temporal = path.join(arrel, 'in', `.foto.webp.${process.pid}.tmp`);
    fs.writeFileSync(temporal, 'a mitges');
    const [mal] = await executa(pla([orig], opts), { nom: 'prova' }, opts, async () => webpVp8x(1600, 800));
    assert.match(mal.error, /EEXIST/);
    assert.equal(mal.escrit, undefined);
    assert.equal(fs.existsSync(mal.desti), false, 'cap .webp a mitges');
    assert.equal(fs.existsSync(temporal), false, 'el temporal no es queda');
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('cens: una bessona citada conserva el seu estat; una .webp amb dos originals no és bessona de ningú', () => {
  const arrel = temporal();
  try {
    escriu(arrel, 'public/assets/a/foto.jpg', jpeg(100, 100));
    escriu(arrel, 'public/assets/a/foto.webp', webpVp8x(100, 100));
    escriu(arrel, 'public/assets/b/og.jpg', jpeg(100, 100));
    escriu(arrel, 'public/assets/b/og.png', png(100, 100));
    escriu(arrel, 'public/assets/b/og.webp', webpVp8x(100, 100));
    escriu(arrel, 'src/App.jsx', "const a = '/assets/a/foto.webp'; const b = 'og.jpg';\n");
    const { imatges } = cens(arrel, { max: 1600, llindarKb: 300 });
    const per = Object.fromEntries(imatges.map((i) => [i.cami, i]));
    assert.equal(per['assets/a/foto.webp'].estat, 'codi');
    assert.equal(per['assets/a/foto.webp'].bessonaDe, 'assets/a/foto.jpg');
    assert.equal(per['assets/a/foto.jpg'].teWebp, true);
    assert.equal(per['assets/b/og.webp'].bessonaDe, undefined);
    assert.equal(per['assets/b/og.webp'].estat, 'orfe');
    assert.equal(per['assets/b/og.jpg'].teWebp, false);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('pla: un original sol del pla amb un germà al disc (foto.png i foto.jpg) no té bessona', () => {
  const arrel = temporal();
  try {
    const sol = escriu(arrel, 'in/og.png', Buffer.concat([png(1200, 630), Buffer.alloc(400 * 1024)]));
    escriu(arrel, 'in/og.jpg', jpeg(1200, 630));
    const unic = escriu(arrel, 'in/unic.png', png(100, 100));
    const per = Object.fromEntries(pla([sol, unic], { max: 1600 }).map((p) => [path.basename(p.orig), p.salta]));
    assert.match(per['og.png'], /mateix \.webp/);
    assert.equal(per['unic.png'], null);
    // Amb --eixida compta la carpeta de destí: buida, cap problema; amb un altre og.jpg, col·lisió.
    assert.equal(pla([sol], { max: 1600, eixida: 'fora', base: arrel })[0].salta, null);
    escriu(arrel, 'fora/og.jpg', jpeg(10, 10));
    assert.match(pla([sol], { max: 1600, eixida: 'fora', base: arrel })[0].salta, /mateix \.webp/);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});
