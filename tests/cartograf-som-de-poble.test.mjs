import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { auditaContenidor, recomanaUbicacio, TAXONOMIA_CANONICA } from './fixtures/cartografia/cartograf_som_de_poble.snapshot.mjs';

const scratch = path.join(process.cwd(), '.r3243-fixtures');
const snapshot = fileURLToPath(new URL('./fixtures/cartografia/cartograf_som_de_poble.snapshot.mjs', import.meta.url));
const original = '/Users/javillinares/.gemini/config/skills/core-cartografia-contenidor-som-de-poble/scripts/cartograf_som_de_poble.mjs';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  fs.mkdirSync(scratch, { recursive: true });
  const root = fs.mkdtempSync(path.join(scratch, 'cartograf-'));
  t.after(() => { fs.rmSync(root, { recursive: true, force: true }); try { fs.rmdirSync(scratch); } catch { /* altres fixtures */ } });
  return root;
}
function write(root, name, bytes) {
  const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); return file;
}

test('snapshot del Cartògraf és íntegre; si l’original local existix, només es llig i es contrasta', () => {
  const expected = '6c43e1c6c405de4466b2fb1ce6273a634bd128032747bce0bc75604fcb7aa960';
  assert.equal(sha(fs.readFileSync(snapshot)), expected);
  if (fs.existsSync(original)) assert.equal(sha(fs.readFileSync(original)), expected, 'L’original ha canviat: cal revisar el snapshot, no editar-lo automàticament.');
});
test('destinació de receptari i kit CAS és canònica, amb fallback honest per allò desconegut', () => {
  assert.equal(recomanaUbicacio('llibre pdf de receptes de cuina').destiCanonic, '_cultura_de_poble/menjar_i_beure_de_poble/');
  assert.equal(recomanaUbicacio('kit cas').destiCanonic, '_investigacio_ia_de_poble/');
  assert.equal(recomanaUbicacio('qzxv987').destiCanonic, 'CONSULTAR_MESTRE_O_00_MAPA_CANONIC_SOM_DE_POBLE.md');
});
test('audita root explícit sense seguir symlinks ni escriure en el contenidor', t => {
  const root = fixture(t);
  write(root, '00_MAPA_CANONIC_SOM_DE_POBLE.md', '# Mapa sintètic');
  fs.mkdirSync(path.join(root, '_cultura_de_poble/menjar_i_beure_de_poble'), { recursive: true });
  fs.symlinkSync('_cultura_de_poble/menjar_i_beure_de_poble', path.join(root, '_menjar_i_beure_de_poble'));
  fs.mkdirSync(path.join(root, 'carpeta_no_autoritzada'));
  const before = fs.readdirSync(root).sort(), report = auditaContenidor(root);
  assert.equal(report.teMapaArrel, true); assert(report.noCanoniquesArrel.includes('carpeta_no_autoritzada'));
  assert.equal(report.symlinks[0].relPath, '_menjar_i_beure_de_poble');
  assert.deepEqual(fs.readdirSync(root).sort(), before); assert(fs.lstatSync(path.join(root, '_menjar_i_beure_de_poble')).isSymbolicLink());
});
test('duplicats pesants byte a byte travessen les arrels seleccionades i fitxers distints no es confonen', t => {
  const root = fixture(t), data = Buffer.alloc(512 * 1024, 17);
  write(root, '_multimedia_de_poble/one.png', data); write(root, 'socdepoble.org/public/assets/uploads/two.png', data);
  const different = Buffer.from(data); different[0] = 18; write(root, '_multimedia_de_poble/three.png', different);
  const report = auditaContenidor(root);
  assert.equal(report.fitxersDuplicats.length, 1); assert.equal(report.fitxersDuplicats[0].sha256, sha(data));
  assert.deepEqual(report.fitxersDuplicats[0].rutes.sort(), ['_multimedia_de_poble/one.png', 'socdepoble.org/public/assets/uploads/two.png']);
  assert.equal(report.fitxersDuplicats[0].justificacioCanonica, null);
});
test('límit publicat del Cartògraf és >=512KiB i profunditat5: no es presenta com cens complet de public/assets', t => {
  const root = fixture(t), small = Buffer.from('tiny'), large = Buffer.alloc(512 * 1024, 19);
  write(root, '_multimedia_de_poble/a.png', small); write(root, '_multimedia_de_poble/b.png', small);
  write(root, '_multimedia_de_poble/a/b/c/d/e/outside-depth.png', large); write(root, '_multimedia_de_poble/visible.png', large);
  const report = auditaContenidor(root); assert.equal(report.fitxersDuplicats.length, 0);
});
test('normalitza accents i identifica directoris homònims sense retirar-los', t => {
  const root = fixture(t); fs.mkdirSync(path.join(root, '_cultura_de_poble/Cüína'), { recursive: true }); fs.mkdirSync(path.join(root, '_multimedia_de_poble/cuina'), { recursive: true });
  const report = auditaContenidor(root);
  assert(report.carpetesHomonimes.some(group => group.nomNormalitzat === 'cuina' && group.rutes.length === 2));
  assert.equal(TAXONOMIA_CANONICA['_oficina_de_poble'].tipus, 'claus_i_immobilitzat_sensible');
});
