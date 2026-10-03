/** Explicit capabilities. Opaque commands never acquire write authority from text matching. */
import { CAMINS } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {relativePath, humanZone, UUID} from '../documental/core.mjs';
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
// These host tools only read/discover instructions or return an agent result.
// Skill loads instructions; any tools subsequently invoked still pass their own hook.
const READ_TOOLS = new Set([
  'Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search',
  'search_code', 'ToolSearch', 'Skill', 'ListSkills', 'SubagentHandback', 'StructuredOutput',
]);

/** Literal argv only: quoted patterns may contain shell punctuation, but never expand. */
function readArgv(command) {
  const words = []; let word = '', quote = null, started = false;
  for (const character of command) {
    if (quote) {
      if (character === quote) quote = null;
      else {
        if (quote === '"' && /[$`\\]/.test(character)) return null;
        word += character;
      }
    } else if (character === "'" || character === '"') {
      quote = character; started = true;
    } else if (character === ' ' || character === '\t') {
      if (started) { words.push(word); word = ''; started = false; }
    } else {
      // No composition, redirections, substitution, globbing, comments or escapes.
      if (/[&|;<>$`\\(){}[\]*?!#~]/.test(character)) return null;
      word += character; started = true;
    }
  }
  if (quote) return null;
  if (started) words.push(word);
  return words;
}

const READ_OPTIONS = {
  ls: { short: 'ABCFGHILOPRSTUW@abcdefghiklmnopqrstuvwx1', values: '', long: ['all', 'almost-all', 'author', 'classify', 'directory', 'file-type', 'full-time', 'group-directories-first', 'human-readable', 'inode', 'literal', 'numeric-uid-gid', 'quote-name', 'recursive', 'reverse', 'size', 'version', 'help'], longValues: ['block-size', 'color', 'format', 'hide', 'ignore', 'indicator-style', 'quoting-style', 'sort', 'time', 'time-style', 'width', 'tabsize'] },
  grep: { short: 'EFGHILPRSVabcdhiklnoqrsuvwxZz', values: 'ABCDefm', long: ['basic-regexp', 'extended-regexp', 'fixed-strings', 'perl-regexp', 'ignore-case', 'no-ignore-case', 'word-regexp', 'line-regexp', 'null-data', 'line-number', 'with-filename', 'no-filename', 'only-matching', 'quiet', 'silent', 'invert-match', 'text', 'binary', 'count', 'files-with-matches', 'files-without-match', 'recursive', 'dereference-recursive', 'no-messages', 'null', 'line-buffered', 'help', 'version'], longValues: ['regexp', 'file', 'max-count', 'after-context', 'before-context', 'context', 'binary-files', 'devices', 'directories', 'label', 'include', 'exclude', 'exclude-from', 'exclude-dir', 'color', 'colour', 'group-separator'] },
  rg: { short: 'abcEFhiIjLlMnNoPpqsSuUvVwx0', values: 'ABCefgmrtT', long: ['files', 'hidden', 'no-hidden', 'no-ignore', 'no-ignore-vcs', 'no-ignore-parent', 'no-ignore-global', 'no-ignore-dot', 'no-config', 'line-number', 'no-line-number', 'with-filename', 'no-filename', 'heading', 'no-heading', 'count', 'count-matches', 'files-with-matches', 'files-without-match', 'only-matching', 'quiet', 'invert-match', 'ignore-case', 'case-sensitive', 'smart-case', 'fixed-strings', 'word-regexp', 'line-regexp', 'multiline', 'multiline-dotall', 'pcre2', 'pcre2-unicode', 'text', 'follow', 'null', 'null-data', 'json', 'vimgrep', 'pretty', 'stats', 'trim', 'crlf', 'help', 'version'], longValues: ['regexp', 'file', 'glob', 'iglob', 'type', 'type-not', 'max-count', 'max-depth', 'max-filesize', 'max-columns', 'after-context', 'before-context', 'context', 'context-separator', 'color', 'colors', 'encoding', 'engine', 'replace', 'sort', 'sortr', 'threads', 'ignore-file', 'path-separator', 'field-match-separator', 'field-context-separator'] },
  cat: { short: 'AbbenstuvET', values: '', long: ['show-all', 'number-nonblank', 'show-ends', 'number', 'squeeze-blank', 'show-tabs', 'show-nonprinting', 'help', 'version'], longValues: [] },
  head: { short: 'qv', values: 'cn', long: ['quiet', 'silent', 'verbose', 'help', 'version'], longValues: ['bytes', 'lines'] },
  tail: { short: 'qrRv', values: 'bcn', long: ['quiet', 'silent', 'verbose', 'help', 'version'], longValues: ['bytes', 'lines'] },
  wc: { short: 'clmwL', values: '', long: ['bytes', 'chars', 'lines', 'max-line-length', 'words', 'help', 'version'], longValues: ['files0-from'] },
};

function readOptions(args, spec) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') return true;
    if (arg === '-' || !arg.startsWith('-')) continue;
    if (arg.startsWith('--')) {
      const [name, ...value] = arg.slice(2).split('=');
      if (spec.long.includes(name) && !value.length) continue;
      if (!spec.longValues.includes(name)) return false;
      if (!value.length && ++i >= args.length) return false;
    } else {
      if (/^-\d+$/.test(arg)) continue;
      for (let j = 1; j < arg.length; j++) {
        if (spec.values.includes(arg[j])) {
          if (j === arg.length - 1 && ++i >= args.length) return false;
          break;
        }
        if (!spec.short.includes(arg[j])) return false;
      }
    }
  }
  return true;
}

function elementaryRead(command) {
  const argv = readArgv(command);
  if (!argv?.length) return false;
  const [executable, ...args] = argv;
  const name = path.posix.basename(executable);
  // No wrappers, relative executables or arbitrary paths bearing a trusted basename.
  const directories = name === 'rg' ? ['/usr/bin', '/usr/local/bin', '/opt/homebrew/bin'] : ['/bin', '/usr/bin'];
  if (executable !== name && !directories.some(dir => executable === `${dir}/${name}`)) return false;
  if (name === 'pwd') return args.length === 0;
  if (!Object.hasOwn(READ_OPTIONS, name)) return false;
  const spec = READ_OPTIONS[name];
  // ripgrep configuration and preprocessors may launch processes. Require a clean
  // config for inherited overrides; command-line executable options stay denied.
  if (name === 'rg' && process.env.RIPGREP_CONFIG_PATH && args[0] !== '--no-config') return false;
  if (name === 'rg' && args.some(arg => /^--(?:pre|pre-glob|hostname-bin|hyperlink-format)(?:=|$)/.test(arg))) return false;
  return readOptions(args, spec);
}

/** Reads with no subordinate script execution; safe to omit post-mutation checks. */
export function knownPureRead(payload, root = process.cwd()) {
  if (READ_TOOLS.has(payload.tool_name)) return true;
  if (!['Bash', 'exec_command', 'run_command'].includes(payload.tool_name)) return false;
  try { return elementaryRead(normalizeShellCommand(payload, root)); } catch { return false; }
}

// Only audited argv shapes are readings. A script name/prefix conveys no authority.
const READ_NODE_COMMANDS = new Set([
  'node tooling/gates/segella.mjs',
  'node tooling/gates/design_guard.mjs --arrel=src',
  'node tooling/gates/porta-olivera.mjs --informe',
  // 261002 (D9): el pas «observa» d'AGENTS §0.1 i la verificació de core-higiene-escriptori.
  'node tooling/gates/porta-olivera.mjs',
  'node tooling/gates/tractor-orfandat.mjs',
  'node tooling/gates/porta-documents.mjs',
  'node tooling/gates/porta-plantilles.mjs',
  'node tooling/gates/tractor-enxufe.mjs',
  'node tooling/gates/tractor-rls.mjs',
]);
/**
 * Formes de lectura amb arguments (261002, D9). `--arxiva --sec` és la simulació
 * de la porta Olivera: no mou res ni toca l'índex, i els noms només poden ser
 * documents solts del primer nivell. `tancament.mjs --check` és lectura per
 * contracte (wiki-cicle-de-vida pas 8): sense --close/--verify no segella res, i
 * `checkClosure` fa caure el torn si la comprovació deixa cap canvi.
 */
const READ_SHAPES = Object.freeze([
  /^node tooling\/gates\/porta-olivera\.mjs --arxiva --sec(?: --nom (?:_wiki_de_poble\/04_escriptori\/)?\d{6}_\d{4}_[a-z0-9]+(?:_[a-z0-9]+)*\.md)*$/,
  new RegExp(`^node tooling/gates/tancament\\.mjs --check --turn-id torn_${UUID}$`),
]);
export function knownRead(payload, root = process.cwd()) {
  if (knownPureRead(payload, root)) return true;
  if (!['Bash', 'exec_command', 'run_command'].includes(payload.tool_name)) return false;
  let cmd;
  try { cmd = normalizeShellCommand(payload, root); } catch { return false; }
  if (/[&|;<>$`\\\r\n]/.test(cmd)) return false;
  if (['pwd', '/bin/pwd'].includes(cmd)) return true;
  // Commands are relative to the reviewed repository, never another checkout.
  if (fs.realpathSync(payload.cwd || root) !== fs.realpathSync(root)) return false;
  if (READ_NODE_COMMANDS.has(cmd)) return true;
  if (READ_SHAPES.some(shape => shape.test(cmd))) return true;
  if (/^npx vitest run(?: [\w./-]+)+$/.test(cmd) || /^node --test(?: tests\/[\w.-]+\.test\.mjs)+$/.test(cmd)) return true;
  if (['git status --short', 'git status --porcelain', 'git diff --no-ext-diff --no-textconv', 'git diff --stat --no-ext-diff --no-textconv', 'git log --oneline'].includes(cmd)) return true;
  const npm = /^npm run (porta:[a-z-]+)$/.exec(cmd);
  if (npm) {
    const {scripts = {}} = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    return !scripts[`pre${npm[1]}`] && !scripts[`post${npm[1]}`] && READ_NODE_COMMANDS.has(scripts[npm[1]]);
  }
  return false;
}
