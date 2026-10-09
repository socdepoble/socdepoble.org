#!/usr/bin/env node
/**
 * escriu-png.mjs — Onada 8 (261009), punt 1: els logotips de SVG a PNG.
 *
 * Claude no pot escriure binaris (el hook de la sessió només deixa escriure
 * text). Els tres PNG els va rasteritzar el navegador integrat, amb el canvas
 * de Chromium, des dels SVG que el servidor de desenvolupament servix a
 * /assets/system/ui/. Els bytes viatgen com a base64 en trossos de text
 * (trossos/), amb el hash de cada tros i del PNG sencer al manifest.
 *
 * Este script reconstruïx cada PNG, el contrasta amb el manifest (llargada i
 * sha256 del base64, mida, sha256 i dimensions IHDR del PNG) i, només amb
 * --escriu, el desa a public/assets/system/ui/. Mai sobreescriu: si el destí
 * ja existix amb el mateix sha256 diu «aplicat», i si existix amb un altre,
 * para. La prova tests/laboratori-logotips-261009.test.js fa servir estes
 * mateixes funcions sense escriure res.
 *
 * Ús (des de l'arrel del repositori):
 *   node _wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1330_logotips_png_claude/escriu-png.mjs
 *   node _wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1330_logotips_png_claude/escriu-png.mjs --escriu
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
/** LAB és _wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1330_logotips_png_claude: quatre nivells. */
export const ARREL = path.resolve(LAB, '../../../..');
export const TROSSOS = path.join(LAB, 'trossos');
export const MANIFEST = JSON.parse(fs.readFileSync(path.join(LAB, 'manifest.json'), 'utf8'));

export const sha = (dades) => createHash('sha256').update(dades).digest('hex');
const llig = (fitxer) => fs.readFileSync(fitxer, 'utf8').replace(/\s+/g, '');

/**
 * Les peces d'un tros, trossos/<clau>.<i>.b64.<desplaçament>, per desplaçament
 * numèric creixent. Un tros amb un caràcter mal copiat no es reescriu sencer
 * (cada còpia pot portar un error nou): s'hi superposa la peça bona. Un tros
 * també pot vindre sencer en peces sobre una base buida.
 */
export function pecesDe(clau, i) {
  if (!fs.existsSync(TROSSOS)) return [];
  const patro = new RegExp(`^${clau}\\.${i}\\.b64\\.(\\d+)$`);
  return fs.readdirSync(TROSSOS).map((nom) => nom.match(patro)).filter(Boolean)
    .map((m) => ({ desplacament: Number(m[1]), text: llig(path.join(TROSSOS, m[0])) }))
    .sort((a, b) => a.desplacament - b.desplacament);
}

/** El text d'un tros: la base (trossos/<clau>.<i>.b64) amb les peces superposades. */
export function tros(clau, i) {
  const base = path.join(TROSSOS, `${clau}.${i}.b64`);
  if (!fs.existsSync(base)) throw new Error(`${clau}.${i}: absent`);
  let text = llig(base);
  for (const { desplacament, text: peca } of pecesDe(clau, i)) {
    if (desplacament > text.length) throw new Error(`${clau}.${i}: la peça ${desplacament} cau fora del tros (${text.length})`);
    text = text.slice(0, desplacament) + peca + text.slice(desplacament + peca.length);
  }
  return text;
}

/** Amplada i alçada d'un PNG: la signatura i el bloc IHDR (bytes 16-23), o null. */
export function dimensionsPng(bytes) {
  const signatura = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signatura) || bytes.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
  return { amplada: bytes.readUInt32BE(16), alcada: bytes.readUInt32BE(20) };
}

/** Errors d'un tros contra el hash del navegador (els 16 primers hex del sha256). */
export function errorsDelTros(f, i) {
  let text;
  try { text = tros(f.clau, i); } catch (e) { return [e.message]; }
  const trobat = sha(text).slice(0, 16);
  return trobat === f.trossos[i] ? [] : [`${f.clau}.${i}: ${text.length} caràcters, hash ${trobat} i s’esperava ${f.trossos[i]}`];
}

/** El PNG d'una entrada del manifest, reconstruït i contrastat. { bytes, errors }. */
export function assembla(f) {
  const errors = f.trossos.flatMap((_, i) => errorsDelTros(f, i));
  if (errors.length) return { bytes: null, errors };
  const b64 = f.trossos.map((_, i) => tros(f.clau, i)).join('');
  if (b64.length !== f.llargadaB64) errors.push(`${f.clau}: el base64 fa ${b64.length} caràcters i n’ha de fer ${f.llargadaB64}`);
  if (sha(b64) !== f.sha256B64) errors.push(`${f.clau}: el sha256 del base64 no és el del navegador`);
  const bytes = Buffer.from(b64, 'base64');
  if (bytes.length !== f.mida) errors.push(`${f.clau}: el PNG fa ${bytes.length} B i n’ha de fer ${f.mida}`);
  if (sha(bytes) !== f.sha256) errors.push(`${f.clau}: el sha256 del PNG no és el del navegador`);
  const d = dimensionsPng(bytes);
  if (!d || d.amplada !== f.amplada || d.alcada !== f.alcada) errors.push(`${f.clau}: dimensions ${d ? `${d.amplada}×${d.alcada}` : 'il·legibles'} i s’esperava ${f.amplada}×${f.alcada}`);
  return { bytes: errors.length ? null : bytes, errors };
}

/** Estat de cada PNG: 'aplicat' (el destí ja té el sha del manifest), 'pendent' o 'error'. Només llig. */
export function estat(arrel = ARREL) {
  return MANIFEST.fitxers.map((f) => {
    const desti = path.join(arrel, f.desti);
    if (fs.existsSync(desti)) {
      const ara = sha(fs.readFileSync(desti));
      return ara === f.sha256 ? { f, estat: 'aplicat', errors: [] }
        : { f, estat: 'error', errors: [`${f.desti} ja existix amb un altre contingut (sha256 ${ara.slice(0, 16)}…): no es toca`] };
    }
    const { bytes, errors } = assembla(f);
    return { f, estat: errors.length ? 'error' : 'pendent', errors, bytes };
  });
}

function main(argv) {
  const escriu = argv.includes('--escriu');
  if (argv.some((a) => a !== '--escriu')) throw new Error('Ús: escriu-png.mjs [--escriu]');
  const estats = estat();
  for (const e of estats) {
    console.log(`${e.estat.padEnd(8)} ${e.f.desti} (${e.f.amplada}×${e.f.alcada}, ${e.f.mida} B, sha256 ${e.f.sha256.slice(0, 16)}…)`);
    for (const err of e.errors) console.log(`         ${err}`);
  }
  if (estats.some((e) => e.estat === 'error')) { process.exitCode = 1; return; }
  if (!escriu) { console.log('\nTot quadra. Per a escriure els pendents: --escriu'); return; }
  for (const e of estats.filter((x) => x.estat === 'pendent')) {
    fs.writeFileSync(path.join(ARREL, e.f.desti), e.bytes, { flag: 'wx' });
    console.log(`escrit   ${e.f.desti}`);
  }
}

// La guarda que no salta mai és `file://${argv[1]}`: l'arrel té espais (memòria del projecte).
function esEntrada() {
  try { return Boolean(process.argv[1]) && pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}
if (esEntrada()) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(`[escriu-png] ${e.message}`); process.exitCode = 1; }
}
