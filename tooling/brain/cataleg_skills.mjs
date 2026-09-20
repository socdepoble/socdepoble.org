import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { arrelSegura } from '../lib/arrel.mjs';
import { parseFrontmatter } from '../wiki/lib/frontmatter.mjs';

export const ROOT = fs.realpathSync(arrelSegura());
export const sha = value => createHash('sha256').update(value).digest('hex');
export const MIRRORS = [
  '_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR',
  '_wiki_de_poble/01_Ser/00_AGENTS_I_SKILLS_MIRROR',
  '_wiki_de_poble/02_saber/skills_mirror',
];
export function segura(root, rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel) || rel.includes('\\') ||
      rel.split('/').some(p => !p || p === '.' || p === '..')) throw new Error(`Ruta invàlida: ${rel}`);
  let current = root;
  for (const part of rel.split('/')) {
    const parent = current;
    current = path.join(current, part);
    try {
      if (fs.existsSync(current) && !fs.readdirSync(parent).includes(part)) throw new Error(`Capitalització no canònica: ${rel}`);
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink prohibit: ${rel}`);
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return current;
}
export function font(root, ruta) {
  const abs = segura(root, ruta);
  if (!fs.statSync(abs).isFile()) throw new Error(`No és fitxer: ${ruta}`);
  const bytes = fs.readFileSync(abs);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (!text.trim()) throw new Error(`Font buida: ${ruta}`);
  return { ruta, sha256: sha(bytes), bytes: bytes.length, text };
}
export function atomic(root, ruta, text) {
  const dest = segura(root, ruta);
  const tmp = `${dest}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, text, { flag: 'wx', mode: 0o600 });
    fs.renameSync(tmp, dest);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
export function inventari(root = ROOT) {
  const dir = segura(root, '.agents/skills');
  const skills = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink en skills: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) throw new Error(`ID invàlid: ${entry.name}`);
    const src = font(root, `.agents/skills/${entry.name}/SKILL.md`);
    const fm = parseFrontmatter(src.text);
    if (!fm.hasFrontmatter || fm.errors.length) throw new Error(`${src.ruta}: ${fm.errors.join('; ') || 'sense frontmatter'}`);
    const d = fm.data;
    if (d.name !== entry.name || (d.type ?? d.tipus) !== 'skill' || !['actiu', 'canonic'].includes(d.status ?? d.estat))
      throw new Error(`Skill no activa o identitat divergent: ${src.ruta}`);
    if (typeof d.description !== 'string' || !d.description.trim()) throw new Error(`Falta description: ${src.ruta}`);
    if (!Array.isArray(d.triggers_on) || d.triggers_on.some(t => typeof t !== 'string' || !t.trim()))
      throw new Error(`triggers_on invàlid: ${src.ruta}`);
    if (d.core !== undefined && !/^core:[ \t]*(true|false)[ \t]*(?:#.*)?$/m.test(fm.rawFrontmatter)) throw new Error(`core invàlid: ${src.ruta}`);
    if (d.prioritat !== undefined && !/^prioritat:[ \t]*-?\d+[ \t]*(?:#.*)?$/m.test(fm.rawFrontmatter)) throw new Error(`prioritat invàlida: ${src.ruta}`);
    skills.push({ ...src, id: d.name, description: d.description.replace(/\s+/g, ' '),
      core: d.core === 'true', triggers: d.triggers_on, prioritat: d.prioritat === undefined ? 50 : Number(d.prioritat) });
  }
  skills.sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (skills.length !== 16) throw new Error(`Contracte d'esta implantació: 16 skills; trobades ${skills.length}`);
  for (const f of ['PROFILE.md', 'AGENTS.md', 'BASELINE.md', 'consell.json']) font(root, `.agents/${f}`);
  return skills;
}
export function projeccions(skills) {
  return new Map([
    ['.agents/manifest.yaml', [
      '# GENERAT per tooling/brain/cataleg_skills.mjs; no editar a mà.',
      'schema: socdepoble.manifest.v1', 'identity: PROFILE.md', 'bios: AGENTS.md',
      'baseline: BASELINE.md', 'index_skills: skills/00_INDEX_SKILLS.md', 'consell: consell.json',
      'skills:', ...skills.map(s => `  - skills/${s.id}/SKILL.md`), '',
    ].join('\n')],
    ['.agents/skills/00_INDEX_SKILLS.md', [
      '---', 'type: index', 'status: generat',
      'description: Catàleg determinista de les setze skills actives, generat des de les fonts canòniques.',
      'tags:', '  - skills', '  - core', '---', '', '# Catàleg de skills', '',
      'Font executiva única: `.agents/skills/`. Este índex només referencia les fonts.', '',
      ...skills.map(s => `- [[${s.id}/SKILL|${s.id}]]: ${s.description}`), '',
    ].join('\n')],
  ]);
}
export function comprovaCataleg(root = ROOT, skills = inventari(root)) {
  const problemes = [];
  for (const [rel, text] of projeccions(skills)) {
    const abs = segura(root, rel);
    if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text) problemes.push(`Projecció divergent: ${rel}`);
  }
  for (const rel of MIRRORS) if (fs.existsSync(path.join(root, rel))) problemes.push(`Espill pendent de quarantena: ${rel}`);
  return { ok: !problemes.length, disc: skills.map(s => s.id), problemes };
}
export function catalegCLI(args = process.argv.slice(2), root = ROOT) {
  const allowed = new Set(['--check', '--escriu', '--json']);
  try {
    if (args.some(a => !allowed.has(a) && !a.startsWith('--arrel=')) || (args.includes('--check') && args.includes('--escriu')))
      throw new Error('Ús: [--check | --escriu] [--json]');
    const skills = inventari(root);
    if (args.includes('--escriu')) {
      // Cada reemplaçament és atòmic; el conjunt de dos fitxers NO és una transacció.
      // Una interrupció deixa el check en roig, mai un catàleg acceptat parcialment.
      for (const [rel, text] of projeccions(skills)) {
        const abs = segura(root, rel);
        if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text) atomic(root, rel, text);
      }
    }
    const result = comprovaCataleg(root, skills);
    console.log(JSON.stringify({ porta: 'cataleg-skills', ...result }, null, 2));
    return result.ok ? 0 : 1;
  } catch (e) { console.error(e.message); return 2; }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = catalegCLI();