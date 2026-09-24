/** Explicit capabilities. Opaque commands never acquire write authority from text matching. */
import { CAMINS } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {relativePath, humanZone} from '../documental/core.mjs';
export const SECURITY_PATHS = ['.codex', '.claude', '.agents', '.husky', '.github', 'tooling', 'scripts'];
export function mutationPath(root, file, cwd = root) {
  if (typeof file !== 'string' || !file) throw new Error('Escriptura sense ruta');
  const rel = relativePath(root, file, cwd);
  const abs = path.join(root, rel);
  if (fs.existsSync(abs) && fs.lstatSync(abs).nlink > 1) throw new Error('Escriptura amb hardlink no autoritzada');
  const lexical = path.relative(root, path.resolve(cwd, file)).split(path.sep).join('/');
  for (const candidate of [rel, lexical]) {
    if (humanZone(candidate) || candidate === `${CAMINS.escriptori}/01_produccio`) throw new Error('Zona de producció humana protegida, independentment de l’extensió');
    if (SECURITY_PATHS.some(p => candidate === p || candidate.startsWith(`${p}/`)) || /^(AGENTS|CLAUDE)\.md$/.test(candidate) || /^package(?:-lock)?\.json$/.test(candidate)) {
      throw new Error('Governança: usa executor-mutacio.mjs amb pla exacte i lease; l’eina directa no té autoritat');
    }
  }
  return rel;
}
/** Una sola interpretació dels selectors que determinen la shell real. */
export function normalizeShellCommand(payload, root = process.cwd()) {
  if (!['Bash','exec_command','run_command'].includes(payload.tool_name)) return null;
  const inputs = [payload.tool_input,payload.toolArgs].filter(Boolean);
  const commands = inputs.flatMap(input => ['command','cmd','CommandLine','Command']
    .filter(key=>Object.hasOwn(input,key)).map(key=>input[key]));
  if (!commands.length || commands.some(command=>typeof command!=='string'||command!==commands[0])) throw new Error('Comandes shell absents o divergents');
  const command = commands[0];
  // NBSP/BOM/control no són separadors de paraules del shell POSIX.
  if (/[^\S \t]/u.test(command) || /[\0\r\n]/.test(command)) throw new Error('Separador shell no literal');
  const overrides = ['shell','shellPath','shell_path','executable','interpreter','env','environment','environmentVariables','env_vars','login'];
  if ([payload,...inputs].some(input=>overrides.some(key=>Object.hasOwn(input,key)))) throw new Error('Entorn o shell sobreescrit');
  const actualRoot = fs.realpathSync(root);
  for (const input of [payload,...inputs]) {
    for (const key of ['cwd','workdir','Cwd','WorkingDirectory','working_directory']) {
      if (!Object.hasOwn(input,key)) continue;
      if (typeof input[key]!=='string'||!input[key]||fs.realpathSync(input[key])!==actualRoot) throw new Error('Cwd shell divergent');
    }
  }
  return command.trim();
}
// Only audited argv shapes are readings. A script name/prefix conveys no authority.
const READ_NODE_COMMANDS = new Set([
  'node tooling/gates/segella.mjs',
  'node tooling/gates/design_guard.mjs --arrel=src',
  'node tooling/gates/porta-olivera.mjs --informe',
  'node tooling/gates/porta-documents.mjs',
  'node tooling/gates/porta-plantilles.mjs',
  'node tooling/gates/tractor-enxufe.mjs',
  'node tooling/gates/tractor-rls.mjs',
]);
export function knownRead(payload, root = process.cwd()) {
  if (['Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code', 'ToolSearch'].includes(payload.tool_name)) return true;
  if (!['Bash', 'exec_command', 'run_command'].includes(payload.tool_name)) return false;
  let cmd;
  try { cmd = normalizeShellCommand(payload, root); } catch { return false; }
  if (/[&|;<>$`\\\r\n]/.test(cmd)) return false;
  if (['pwd', '/bin/pwd'].includes(cmd)) return true;
  // Commands are relative to the reviewed repository, never another checkout.
  if (fs.realpathSync(payload.cwd || root) !== fs.realpathSync(root)) return false;
  if (READ_NODE_COMMANDS.has(cmd)) return true;
  if (/^npx vitest run(?: [\w./-]+)+$/.test(cmd) || /^node --test(?: tests\/[\w.-]+\.test\.mjs)+$/.test(cmd)) return true;
  if (['git status --short', 'git status --porcelain', 'git diff --no-ext-diff --no-textconv', 'git diff --stat --no-ext-diff --no-textconv', 'git log --oneline'].includes(cmd)) return true;
  const npm = /^npm run (porta:[a-z-]+)$/.exec(cmd);
  if (npm) {
    const {scripts = {}} = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    return !scripts[`pre${npm[1]}`] && !scripts[`post${npm[1]}`] && READ_NODE_COMMANDS.has(scripts[npm[1]]);
  }
  return false;
}
