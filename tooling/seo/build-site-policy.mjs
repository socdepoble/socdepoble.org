#!/usr/bin/env node
/* Derivat de firebase.json; no desplega, no amplia la política ni genera claus de caché. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateSitePolicy} from './apply-site-policy.mjs';
const sha = text => createHash('sha256').update(text).digest('hex');
const CORS = new Set(['access-control-allow-origin', 'access-control-expose-headers', 'access-control-allow-headers']);
export function buildSitePolicy(sourceText) {
  if (typeof sourceText !== 'string' || Buffer.byteLength(sourceText) > 1024 * 1024) throw new Error('Font Firebase absent o massa gran');
  const configuration = JSON.parse(sourceText);
  const rules = configuration?.hosting?.headers;
  if (!Array.isArray(rules)) throw new Error('Cal una única configuració hosting.headers de Firebase');
  const globalHeaders = {}, assetHeaders = {};
  for (const rule of rules) {
    const allowed = rule?.source === '**' ? new Set(['content-security-policy'])
      : rule?.source === '/assets/**' ? CORS : null;
    if (!allowed) continue;
    if (!Array.isArray(rule.headers)) throw new Error('Regla Firebase de capçaleres incompleta');
    const target = rule.source === '**' ? globalHeaders : assetHeaders;
    for (const header of rule.headers) {
      if (typeof header?.key !== 'string') throw new Error('Nom de capçalera Firebase invàlid');
      const name = header.key.toLowerCase();
      if (!allowed.has(name)) continue;
      if (Object.hasOwn(target, name)) throw new Error(`Capçalera Firebase ambigua: ${name}`);
      target[name] = header.value;
    }
  }
  return validateSitePolicy({ schema: 'sdp.site-policy.v1', source: 'firebase.json', sourceSha256: sha(sourceText),
    globalHeaders, assets: { prefix: '/assets/', headers: assetHeaders } });
}
function main(argv) {
  if (argv.length !== 2) throw new Error('Ús: node build-site-policy.mjs firebase.json dist-edge/site-policy.json');
  const [input, output] = argv;
  const policy = buildSitePolicy(fs.readFileSync(input, 'utf8'));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(policy, null, 2)}\n`);
  console.log(JSON.stringify({ valid: true, sourceSha256: policy.sourceSha256,
    globalHeaders: Object.keys(policy.globalHeaders), assetHeaders: Object.keys(policy.assets.headers) }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
