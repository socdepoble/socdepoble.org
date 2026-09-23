#!/usr/bin/env node
/** Índex de skills per a l'encaminador cognitiu.
 *
 *  `persona_router.mjs` demanava `.agents/skills_index.json` i deia «executa
 *  primer tooling/brain/build_skills_index.mjs», un fitxer que no existia. Ni
 *  l'índex ni el constructor. Per això les skills declaraven `triggers_on`
 *  que cap motor llegia mai.
 *
 *  Ací es construïx l'índex des de l'única font de veritat que hi ha: el
 *  frontmatter de `.agents/skills/**\/SKILL.md`. Res inventat, res duplicat.
 *
 *  Ús: build_skills_index.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { R, arrelSegura } from '../lib/arrel.mjs';
import { parseFrontmatter } from '../wiki/lib/frontmatter.mjs';

export const INDEX_REL = '.agents/skills_index.json';
const SKILLS_REL = '.agents/skills';

export function construeixIndex(arrel = arrelSegura()) {
  const dir = path.join(arrel, SKILLS_REL);
  const index = { schema: 'sdp.skills_index.v1', core: [], plugins: {} };
  if (!fs.existsSync(dir)) return index;

  for (const entrada of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entrada.isDirectory() || entrada.name.startsWith('.')) continue;
    const fitxer = path.join(dir, entrada.name, 'SKILL.md');
    if (!fs.existsSync(fitxer)) continue;

    const { data } = parseFrontmatter(fs.readFileSync(fitxer, 'utf8'));
    const nom = data?.name || entrada.name;
    const registre = {
      name: nom,
      path: `${SKILLS_REL}/${entrada.name}/SKILL.md`,
      description: data?.description || '',
      triggers_on: Array.isArray(data?.triggers_on) ? data.triggers_on : []
    };
    if (data?.core === true || data?.core === 'true') index.core.push(registre);
    else index.plugins[nom] = registre;
  }
  return index;
}

/** Escriptura condicional: no toquem l'`mtime` si el contingut no canvia. */
export function escriuIndex(arrel = arrelSegura()) {
  const index = construeixIndex(arrel);
  const fitxer = path.join(arrel, INDEX_REL);
  const text = `${JSON.stringify(index, null, 2)}\n`;
  const previ = fs.existsSync(fitxer) ? fs.readFileSync(fitxer, 'utf8') : null;
  if (previ === text) return { index, changed: false, fitxer };
  fs.writeFileSync(fitxer, text, 'utf8');
  return { index, changed: true, fitxer };
}

function main() {
  const arrel = arrelSegura();
  if (process.argv.includes('--check')) {
    const index = construeixIndex(arrel);
    const sensTriggers = Object.values(index.plugins).filter((p) => !p.triggers_on.length).map((p) => p.name);
    console.log(`[Índex de skills] ${index.core.length} core, ${Object.keys(index.plugins).length} plugins.`);
    if (sensTriggers.length) console.log(`ℹ️ Plugins sense triggers_on (només per invocació explícita): ${sensTriggers.join(', ')}`);
    process.exitCode = 0;
    return;
  }
  const r = escriuIndex(arrel);
  console.log(`✅ ${R(INDEX_REL) && INDEX_REL} ${r.changed ? 'actualitzat' : 'sense canvis'}: ${r.index.core.length} core, ${Object.keys(r.index.plugins).length} plugins.`);
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) main();
