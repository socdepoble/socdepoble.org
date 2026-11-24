/** Reproduce the vendored independent QA oracle without touching its files.
 * Upstream arithmetic is unchanged. Only its CSPRNG import is substituted by
 * the historical deterministic QA stream before TypeScript→ESM compilation.
 * Usage: node tests/fixtures/shamir-independent/regenerate.mjs --check
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {transform, version} from 'esbuild';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function checkReference() {
  const source = fs.readFileSync(new URL('./index.ts.txt', import.meta.url), 'utf8');
  if (hash(source) !== 'f5096daf3155502c27d0b7a703fa61e0bf26fda348f2a2f216872bf49498e050') throw Error('Independent source drift');
  const marker = "import {getRandomBytes} from 'shamir-secret-sharing/csprng';";
  if (source.split(marker).length !== 2) throw Error('CSPRNG import drift');
  const replacement = 'let cursor=0; export function resetRandom(seed=0){cursor=seed;} function getRandomBytes(n){const out=new Uint8Array(n);for(let i=0;i<n;i++)out[i]=((cursor++*73+41)^(cursor>>>3))&255;return out;}';
  const adapted = source.replace(marker, replacement);
  const code = (await transform(adapted, {loader: 'ts', format: 'esm', target: 'es2022'})).code;
  const reference = fs.readFileSync(new URL('./reference.mjs', import.meta.url));
  if (hash(code) !== hash(reference) || hash(reference) !== '518fb8756a8a2d4ee072a08eba834394822fc221925f30f319d39cb0e68cd8fa') throw Error('Generated reference drift');
  const ref = await import(pathToFileURL(fileURLToPath(new URL('./reference.mjs', import.meta.url))));
  const hex = bytes => Buffer.from(bytes).toString('hex'), cases = [];
  for (const n of [3, 5, 40, 255]) {
    ref.resetRandom(n);
    const secret = Uint8Array.from({length: 32}, (_, i) => (i * 19 + n) & 255);
    const shares = await ref.split(secret, n, 3);
    cases.push({n, secret: hex(secret), shares: shares.map(hex)});
  }
  const vectors = JSON.stringify({format: 'Reference Y||X; SDP X||Y; threshold=3', cases}, null, 2) + '\n';
  if (hash(vectors) !== '25fcd61329abaef445f37234c6b469ce71857204ebb710a7716382602eb52885'
      || hash(vectors) !== hash(fs.readFileSync(new URL('./vectors.json', import.meta.url)))) throw Error('Generated vectors drift');
  return {sourceSha256: hash(source), adaptedSourceSha256: hash(adapted), referenceSha256: hash(reference),
    vectorsSha256: hash(vectors), esbuild: version, transform: 'Only the exact CSPRNG import; TS types erased by esbuild.',
    referenceByteIdentical: true, vectorsByteIdentical: true, sourceWrites: 0,
    liveSdpImportedByGenerator: false, deterministicRandomness: 'QA fixture only; never imported by production.'};
}
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  if (process.argv.length !== 3 || process.argv[2] !== '--check') throw Error('Use --check; no fixture files are written');
  console.log(JSON.stringify(await checkReference(), null, 2));
}
