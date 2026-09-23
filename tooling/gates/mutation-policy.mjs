/** Explicit capabilities. Opaque commands never acquire write authority from text matching. */
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
    if (humanZone(candidate) || candidate === '_wiki_de_poble/04_escriptori/01_produccio') throw new Error('Zona de producció humana protegida, independentment de l’extensió');
    if (SECURITY_PATHS.some(p => candidate === p || candidate.startsWith(`${p}/`)) || /^(AGENTS|CLAUDE)\.md$/.test(candidate) || /^package(?:-lock)?\.json$/.test(candidate)) {
      throw new Error('Governança: usa executor-mutacio.mjs amb pla exacte i lease; l’eina directa no té autoritat');
    }
  }
  return rel;
}
export function knownRead(payload) {
  if (['Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code'].includes(payload.tool_name)) return true;
  if (!['Bash', 'exec_command', 'run_command'].includes(payload.tool_name)) return false;
  const cmd = (payload.tool_input?.command ?? payload.tool_input?.cmd ?? payload.toolArgs?.CommandLine ?? '').trim();
  
  if (/[&|;<>$`\\]/.test(cmd)) return false;
  
  if (['pwd', '/bin/pwd', 'npm test', 'npm run test'].includes(cmd)) return true;
  if (/^npm run porta(:[a-zA-Z0-9-]+)?( [a-zA-Z0-9_.-]+)*$/.test(cmd)) {
    if (cmd.includes(':baseline')) return false;
    return true;
  }
  if (/^git (status|diff|log)( [a-zA-Z0-9_./-]+)*$/.test(cmd)) {
    if (cmd.includes('--output')) return false;
    return true;
  }
  if (/^node tooling\/gates\/[a-zA-Z0-9_.-]+(\.mjs|\.js|\.cjs)( [a-zA-Z0-9_./-]+)*$/.test(cmd)) return true;
  if (/^node tooling\/wiki\/document\.mjs( [a-zA-Z0-9_./-]+)*$/.test(cmd)) return true;
  return false;
}
