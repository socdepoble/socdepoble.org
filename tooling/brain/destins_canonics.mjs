import {createHash} from 'node:crypto';
import path from 'node:path';
import {esMain} from '../lib/arrel.mjs';
import {ROOT, font} from './cataleg_skills.mjs';
const REGISTRY = '.agents/protocolledge.json';
const PROJECTION = '.agents/DESTINS_CANONICS.json';
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const label = value => typeof value === 'string' && value.trim() === value && value.length > 0 && !/[\0\r\n]/.test(value);
function destination(value) {
  if (!label(value) || value.includes('\\') || /^[a-z][a-z0-9+.-]*:/i.test(value) || /[*?[\]{}]/.test(value)) throw new Error('Destinació relativa invàlida');
  const normalized = value.replace(/\/$/, '');
  if (normalized.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Destinació relativa invàlida');
  return normalized;
}
/** Pure creation-destination projection; no permission or archive inference.
 * Only id/type/destinations affect the digest, not unrelated template edits.
 */
export function projectaDestins(registry) {
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)
    || !['sdp.protocolledge.v1', 'sdp.protocolledge.v3', 'sdp.protocolledge.v4'].includes(registry.schema)
    || !Array.isArray(registry.rutes) || registry.rutes.length === 0) throw new Error('Registre de destinacions incomplet o invàlid');
  const ids = new Set();
  const rows = [...registry.rutes].map(route => {
    if (!route || !label(route.id) || !label(route.tipus) || !Array.isArray(route.destins) || route.destins.length === 0) throw new Error('Ruta sense id, tipus o destinacions explícites');
    if (ids.has(route.id)) throw new Error(`Ruta duplicada: ${route.id}`);
    ids.add(route.id);
    const destins = [...route.destins].map(destination).sort(cmp);
    if (new Set(destins).size !== destins.length) throw new Error(`Destinació duplicada: ${route.id}`);
    return {id: route.id, tipus: route.tipus, destins};
  }).sort((a, b) => cmp(a.id, b.id));
  return {schema: 'sdp.destins-projectats.v1', font: REGISTRY,
    contracte_sha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
    abast: 'Projecció generada de destinacions de creació. No amplia permisos ni decidix retenció, trasllats o arxivament.',
    retencio_i_arxiu: {font: 'AGENTS.md', procediment: '.agents/skills/core-higiene-escriptori/SKILL.md'}, rutes: rows};
}
export const textDestins = registry => JSON.stringify(projectaDestins(registry), null, 2) + '\n';
/** Uses the catalogue exact-case/no-symlink reader; writes nothing. */
export function comprovaDestins(root = ROOT) {
  try {
    const expected = textDestins(JSON.parse(font(root, REGISTRY).text));
    const actual = font(root, PROJECTION).text;
    return actual === expected ? {ok: true, errors: []} : {ok: false,
      errors: [`Projecció divergent: ${PROJECTION}; font única: ${REGISTRY}. Regenera amb destins_canonics.mjs --print pel carril de governança.`]};
  } catch (error) { return {ok: false, errors: [`Destinacions no verificables: ${error.message}`]}; }
}
export function destinsCLI(args = process.argv.slice(2), root = ROOT, io = process) {
  try {
    let mode = null, selected = root, hasRoot = false;
    for (let i = 0; i < args.length; i++) {
      if (['--check', '--print'].includes(args[i]) && mode === null) mode = args[i];
      else if (args[i] === '--arrel' && !hasRoot && typeof args[i + 1] === 'string' && !args[i + 1].startsWith('--')) {
        selected = path.resolve(args[++i]); hasRoot = true;
      } else throw new Error('Ús: destins_canonics.mjs [--check | --print] [--arrel RUTA]; només lectura');
    }
    if (mode === '--print') io.stdout.write(textDestins(JSON.parse(font(selected, REGISTRY).text)));
    else {
      const result = comprovaDestins(selected);
      io.stdout.write(JSON.stringify(result, null, 2) + '\n');
      return result.ok ? 0 : 1;
    }
    return 0;
  } catch (error) { io.stderr.write(error.message + '\n'); return 2; }
}
if (esMain(import.meta.url)) process.exitCode = destinsCLI();
