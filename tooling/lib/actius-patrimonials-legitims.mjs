/** D-SENTINELLA-2MB · Política declarativa d'integritat, mai una exclusió de lectura.
 * El cens es comprova amb AST: ni imports ni codi d'aplicació s'executen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';

export const MAX_LEGITIMATE_BINARY_BYTES = 8 * 1024 * 1024;
const SOURCE_BYTES = 2 * 1024 * 1024;
const scopes = Object.freeze({
  image: Object.freeze({ file: 'src/sections/multimedia/censImatges.js', export: 'CENS_IMATGES' }),
  'work-pdf': Object.freeze({ file: 'src/data/patrimoni/queDinem.js', export: 'OBRA_QUE_DINEM' }),
});
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys) => plain(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const relativePath = value => typeof value === 'string' && value.startsWith('public/assets/')
  && !/[\\%?#\p{Cc}\p{Cf}]/u.test(value) && value.split('/').every(p => p && p !== '.' && p !== '..' && !/[ .]$/.test(p));
export function validaManifestActius(value) {
  if (!exactKeys(value, ['schema','control','assets']) || value.schema !== 'sdp.static-binaries.integrity.v1'
      || typeof value.control !== 'string' || !Array.isArray(value.assets) || !value.assets.length || value.assets.length > 16) throw Error('STATIC_MANIFEST_INVALID');
  const paths = new Set();
  for (const asset of value.assets) {
    const scope = scopes[asset?.census?.kind];
    if (!exactKeys(asset, ['path','bytes','sha256','census']) || !relativePath(asset.path) || paths.has(asset.path)
        || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 2 * 1024 * 1024 || asset.bytes > MAX_LEGITIMATE_BINARY_BYTES
        || typeof asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256)
        || !exactKeys(asset.census, ['file','export','kind']) || !scope
        || asset.census.file !== scope.file || asset.census.export !== scope.export) throw Error('STATIC_MANIFEST_INVALID');
    paths.add(asset.path);
  }
  return value.assets;
}
const policy = JSON.parse(fs.readFileSync(new URL('./actius-patrimonials-legitims.json', import.meta.url), 'utf8'));
export const ACTIUS_PATRIMONIALS_LEGITIMS = Object.freeze(validaManifestActius(policy).map(asset => Object.freeze({ ...asset, census: Object.freeze({ ...asset.census }) })));
export const sha256 = content => createHash('sha256').update(content).digest('hex');
const nameOf = node => node?.name ?? node?.value;
function unwrap(node) {
  if (node?.type === 'CallExpression' && node.arguments.length === 1 &&
      (node.callee.type === 'Identifier' && node.callee.name === 'congela'
      || node.callee.type === 'MemberExpression' && !node.callee.computed && node.callee.object.name === 'Object' && nameOf(node.callee.property) === 'freeze')) return node.arguments[0];
  return node;
}
function exported(program, name) {
  for (const statement of program.body) {
    if (statement.type !== 'ExportNamedDeclaration' || statement.declaration?.type !== 'VariableDeclaration' || statement.declaration.kind !== 'const') continue;
    for (const declaration of statement.declaration.declarations) if (declaration.id.type === 'Identifier' && declaration.id.name === name) return unwrap(declaration.init);
  }
  return null;
}
function source(root, relative, read) {
  let current = root;
  for (const part of relative.split('/')) { current = path.join(current, part); if (fs.lstatSync(current).isSymbolicLink()) throw Error('UNSAFE_SOURCE'); }
  return read(current, SOURCE_BYTES).toString('utf8');
}
/** Cada lectura és nova dins d'una ronda; la cache només evita reparsejar el mateix cens en eixa ronda. */
export function referenciaActiva(root, asset, read, cache) {
  try {
    if (!cache.has(asset.census.file)) {
      const ast = parse(source(root, asset.census.file, read), { sourceType: 'module', attachComment: false, plugins: ['estree'] }).program;
      cache.set(asset.census.file, ast);
    }
    const node = exported(cache.get(asset.census.file), asset.census.export), url = asset.path.slice('public'.length);
    if (asset.census.kind === 'image') return node?.type === 'ArrayExpression' && node.elements.some(element =>
      element?.type === 'CallExpression' && element.callee.type === 'Identifier' && element.callee.name === 'e'
      && element.arguments[0]?.type === 'Literal' && element.arguments[0].value === url);
    if (node?.type !== 'ObjectExpression' || node.properties.some(p => p.type !== 'Property' || p.computed || p.kind !== 'init' || p.method)) return false;
    // No s'ignora cap spread/computed/accessor: podria trepitjar el PDF literal en execució.
    const fields = new Map(node.properties.map(p => [nameOf(p.key), p.value]));
    if (fields.size !== node.properties.length) return false;
    return fields.get('pdf')?.type === 'Literal' && fields.get('pdf').value === url
      && fields.get('pdfBytes')?.type === 'Literal' && fields.get('pdfBytes').value === asset.bytes;
  } catch { return false; }
}
/** El contenidor publicat no és un resource del seu propi datapackage.
 * Pin de la publicació reproduïble de Node 0: cap generador ni font s'executa.
 */
export const ZIP_OPENDATA_CANONIC = Object.freeze({
  path: 'opendata/dades-obertes-la-torre-de-les-macanes-20261103.zip',
  bytes: 21096,
  sha256: 'fb1611627c2cd2e23defe38f04d9dd58ed7cdc2a95766d5c5fc381f500a651be',
  snapshot: Object.freeze({ path: 'opendata/snapshot-public.json', bytes: 9059, sha256: '48716205451305b472d54697260dda9bf532547948f1f84a7e443bcb1e95a144' }),
  manifest: Object.freeze({ path: 'opendata/manifest.json', bytes: 4696, sha256: 'e7a48ffe2dbd88cf790d4f01fa3cd5a068e40b597d0a8e2b4b5413eb4c18cd59' }),
});
/** ZIP contenidor canònic fixat o resource actual amb mida/hash explícits. */
export function zipOpendataVigent(root, relative, bytes, read) {
  const base = relative.startsWith('dist/') ? 'dist' : 'public';
  const name = relative.slice(`${base}/opendata/`.length);
  if (!relative.startsWith(`${base}/opendata/`) || !/^[^/\\%?#]+\.zip$/i.test(name)) return false;
  try {
    if (relative === `${base}/${ZIP_OPENDATA_CANONIC.path}`) {
      if (bytes.length !== ZIP_OPENDATA_CANONIC.bytes || sha256(bytes) !== ZIP_OPENDATA_CANONIC.sha256) return false;
      // Un pin fallit no pot acabar autoritzat per un resource afegit al manifest.
      return [ZIP_OPENDATA_CANONIC.snapshot, ZIP_OPENDATA_CANONIC.manifest].every(binding => {
        const content = source(root, `${base}/${binding.path}`, read);
        return Buffer.byteLength(content) === binding.bytes && sha256(content) === binding.sha256;
      });
    }
    const manifest = JSON.parse(source(root, `${base}/opendata/manifest.json`, read));
    if (!Array.isArray(manifest.resources) || manifest.resources.length > 128) return false;
    const matches = manifest.resources.filter(resource => plain(resource) && resource.path === name);
    return matches.length === 1 && matches[0].bytes === bytes.length && matches[0].hash === `sha256:${sha256(bytes)}`;
  } catch { return false; }
}
