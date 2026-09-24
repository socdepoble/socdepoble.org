#!/usr/bin/env node
/** Adaptador comú: conserva Reflex/Olivera i traduïx apply_patch de Codex. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../documental/cli.mjs';
import { protectedPath, relativePath, humanZone } from '../documental/core.mjs';
import { checkPayload as reflex, normalitza } from './porta-reflex.mjs';
import { checkPayload as olivera } from './porta-olivera.mjs';
import { mutationPath, knownRead, normalizeShellCommand } from './mutation-policy.mjs';
import { authorizeDocumentCommand } from '../documental/command-policy.mjs';
import { contextLocal } from '../brain/context-local.mjs';

export const RECOVERY = 'Recuperació: node tooling/wiki/document.mjs context --turn-id ID --route ID --file CAMÍ; llig la plantilla íntegra. DESPRÉS: node tooling/wiki/document.mjs create --turn-id ID --route ID --file CAMÍ --title TÍTOL --description DESCRIPCIÓ (només per a un fitxer nou); completa i valida el document existent sense sobreescriure’l amb create.';

export function patchOperations(command, cwd, root) {
  if (typeof command !== 'string' || !command.startsWith('*** Begin Patch\n') || !command.trimEnd().endsWith('*** End Patch')) throw new Error('Pegat desconegut');
  const lines = command.trimEnd().split('\n');
  const operations = [];
  let mutationCount = 0;
  const seen = new Set();
  for (let i = 1; i < lines.length - 1;) {
    const header = /^\*\*\* (Add|Update|Delete) File: (.+)$/.exec(lines[i++]);
    if (!header) throw new Error('Capçalera de pegat desconeguda');
    const [, kind, file] = header;
    if (++mutationCount > 5) throw new Error('Mutació massiva: usa executor amb lease');
    let destination = file;
    if (lines[i]?.startsWith('*** Move to: ')) destination = lines[i++].slice(13);
    const body = [];
    while (i < lines.length - 1 && !/^\*\*\* (?:Add|Update|Delete) File: /.test(lines[i])) body.push(lines[i++]);
    if (kind === 'Delete' || destination !== file) throw new Error('Esborrat o trasllat: usa el circuit específic amb lease i pla explícit');
    mutationPath(root, file, cwd);
    mutationPath(root, destination, cwd);
    const guarded = protectedPath(root, file, cwd) || protectedPath(root, destination, cwd);
    if (!guarded) continue;
    const rel = relativePath(root, file, cwd);
    if (seen.has(rel)) throw new Error('Fitxer repetit al pegat; agrupa els fragments');
    seen.add(rel);
    if (humanZone(rel) || humanZone(relativePath(root, destination, cwd))) throw new Error('Zona de producció humana protegida');
    if (kind === 'Delete' || destination !== file) throw new Error('Esborrat o trasllat documental: usa el circuit explícit de handoff');
    let content;
    if (kind === 'Add') {
      if (fs.existsSync(path.resolve(cwd, file))) throw new Error('Add sobre un fitxer existent');
      if (body.some(line => !line.startsWith('+'))) throw new Error('Add invàlid');
      content = body.map(line => line.slice(1)).join('\n') + '\n';
    } else {
      content = fs.readFileSync(path.join(root, rel), 'utf8');
      const hunks = [];
      for (const line of body) {
        if (line.startsWith('@@')) hunks.push([]);
        else if (line === '*** End of File') continue;
        else {
          if (!hunks.length || !/^[ +-]/.test(line)) throw new Error('Fragment de pegat desconegut');
          hunks.at(-1).push(line);
        }
      }
      if (!hunks.length) throw new Error('Pegat sense fragments');
      for (const hunk of hunks) {
        const before = hunk.filter(line => line[0] !== '+').map(line => line.slice(1)).join('\n');
        const after = hunk.filter(line => line[0] !== '-').map(line => line.slice(1)).join('\n');
        if (!before || content.split(before).length !== 2) throw new Error('Pegat ambigu: envia un fragment amb context únic');
        const start = content.indexOf(before), end = start + before.length;
        if ((start && content[start - 1] !== '\n') || (end < content.length && content[end] !== '\n')) throw new Error('El fragment no coincidix amb línies completes');
        content = content.replace(before, () => after);
      }
    }
    operations.push({tool_name: 'Write', cwd, tool_input: {file_path: file, content}});
  }
  return operations;
}

export function checkLocal(payload, root = ROOT) {
  try {
    // Una font absent no pot convertir-se en un verd fictici abans d'una eina.
    contextLocal(root);
    const cwd = payload.cwd ? path.resolve(payload.cwd) : root;
    const name = payload.tool_name;
    const shellCommand = normalizeShellCommand(payload, root);
    if (['Bash','exec_command','run_command'].includes(name) && cwd === root && /^node tooling\/gates\/executor-mutacio\.mjs [a-zA-Z0-9_./-]+ [a-zA-Z0-9_./-]+$/.test(shellCommand || '')) return {code:0, errors:[]};
    if (knownRead(payload, root)) return {code: 0, errors: []};
    // Orquestració i navegador: no escriuen al disc; cada subagent torna a passar pel hook eina a eina.
    if (['Workflow', 'Agent', 'TaskStop', 'SendMessage', 'AskUserQuestion'].includes(name)
      || name.startsWith('mcp__Claude_Browser__')) return {code: 0, errors: []};
    const documentary = authorizeDocumentCommand(payload, root);
    if (documentary?.kind === 'read') return {code: 0, errors: [], authority: documentary};
    if (fs.existsSync(path.join(root,'.agents/runtime/mutation.pending.json'))) throw new Error('Operació incompleta: noves mutacions bloquejades fins a reconciliació');
    if (documentary) return {code: 0, errors: [], authority: documentary};
    if (!['apply_patch', 'Write', 'Edit', 'NotebookEdit', 'write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(name)) throw new Error('Eina opaca o shell no confinada: usa lectura explícita o executor-mutacio.mjs amb lease; cap escriptura autoritzada');
    if (name !== 'apply_patch') mutationPath(root, payload.tool_input?.file_path || payload.tool_input?.notebook_path || payload.toolArgs?.TargetFile, cwd);
    const ops = name === 'apply_patch' ? patchOperations(payload.tool_input?.command, cwd, root)
      : [payload];
    const errors = [];
    for (const op of ops) {
      errors.push(...reflex(op, root).errors);
      const normalized = normalitza(op, root);
      if (!normalized.fora) {
        const absolute = {tool_name: 'Write', tool_input: {
          file_path: path.join(root, normalized.fitxer), content: normalized.contingut
        }};
        errors.push(...olivera(absolute, root).errors);
      }
    }
    if (name === 'Bash') errors.push(...olivera(payload, root).errors);
    return {code: errors.length ? 2 : 0, errors};
  } catch (error) { return {code: 2, errors: [error.message]}; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (payload.hook_event_name !== 'PreToolUse' || !payload.tool_name || (!payload.tool_input && !payload.toolArgs)) throw new Error('Payload PreToolUse incomplet');
    const result = checkLocal(payload);
    if (result.code) {
      console.error(`[HOOKS-LOCAL] BLOQUEIG\n${result.errors.join('\n')}\n${RECOVERY}`);
      process.exitCode = 2;
    } else process.stdout.write(JSON.stringify({hookSpecificOutput: {
      hookEventName: 'PreToolUse', additionalContext: 'Sóc de Poble: aplica la Constitució i el Genotip carregats. Documents: context → lectura → create → completar → check. Una comprovació de hook no és una lease. Shell opaca denegada; governança només amb executor i lease. L’activació del client i el confinament extern s’han de verificar separadament.'
    }}));
  } catch (error) { console.error(`[HOOKS-LOCAL] ${error.message}`); process.exitCode = 2; }
}
