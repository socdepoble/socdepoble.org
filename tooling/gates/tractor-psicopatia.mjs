#!/usr/bin/env node

/**
 * Porta de coherència arquitectònica de Sóc de Poble.
 *
 * Exit codes:
 *   0 — cap contradicció activa
 *   1 — contradiccions actives detectades
 *   2 — error de configuració o d'execució (l'auditoria no és fiable)
 *
 * Sense dependències externes. Compatible amb Node.js >= 18.
 */

import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const NOM = '🚜 [TRACTOR PSICOPATIA]';
const ANSI = {
  reset: '\u001B[0m',
  bold: '\u001B[1m',
  red: '\u001B[31m',
  green: '\u001B[32m',
  yellow: '\u001B[33m',
  cyan: '\u001B[36m',
  gray: '\u001B[90m'
};

function usaColor() {
  if ('NO_COLOR' in process.env || process.env.TERM === 'dumb') return false;
  if (process.env.FORCE_COLOR === '0') return false;
  return Boolean(process.stdout.isTTY || process.env.CI || process.env.FORCE_COLOR);
}

const colorActiu = usaColor();
const pinta = (color, text) => colorActiu ? `${ANSI[color]}${text}${ANSI.reset}` : text;
const info = (text) => console.log(`${pinta('cyan', NOM)} ${text}`);
const ok = (text) => console.log(`${pinta('green', NOM)} ${text}`);
const avisa = (text) => console.warn(`${pinta('yellow', NOM)} ${text}`);
const falla = (text) => console.error(`${pinta('red', NOM)} ${text}`);

class ErrorTractor extends Error {}

function argumentsCLI(args) {
  const resultat = {
    root: null,
    config: 'requirements/online-first.json',
    jsonReport: null,
    quiet: false,
    help: false
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--root' || arg === '--config' || arg === '--json-report') {
      const seguent = args[++i];
      if (!seguent || seguent.startsWith('--')) throw new ErrorTractor(`Falta el valor de ${arg}.`);
      const clau = arg === '--json-report' ? 'jsonReport' : arg.slice(2);
      resultat[clau] = seguent;
    } else if (arg === '--quiet') {
      resultat.quiet = true;
    } else if (arg === '--help' || arg === '-h') {
      resultat.help = true;
    } else {
      throw new ErrorTractor(`Argument desconegut: ${arg}`);
    }
  }
  return resultat;
}

function ajuda() {
  console.log(`
${NOM}

Ús:
  node tooling/gates/tractor-psicopatia.mjs [opcions]

Opcions:
  --root <ruta>          Arrel del repositori (per defecte: dos nivells damunt del script)
  --config <ruta>        JSON de requisits, relatiu a l'arrel
  --json-report <ruta>   Escriu també un informe JSON
  --quiet                Oculta el progrés; conserva errors i resum
  --help, -h             Mostra aquesta ajuda
`);
}

function regexSegura(pattern, flags = 'iu') {
  if (typeof pattern !== 'string' || pattern.length === 0) {
    throw new ErrorTractor('Cada regla necessita un pattern no buit.');
  }
  const netes = [...new Set(flags.replaceAll('g', '').split(''))].join('');
  try {
    return new RegExp(pattern, netes);
  } catch (error) {
    throw new ErrorTractor(`Expressió regular invàlida «${pattern}»: ${error.message}`);
  }
}

function validaConfig(raw, configPath) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ErrorTractor(`Configuració invàlida: ${configPath}`);
  }
  if (!Array.isArray(raw.targets) || raw.targets.length === 0) {
    throw new ErrorTractor('La configuració ha de declarar almenys un directori en targets.');
  }
  if (!Array.isArray(raw.rules) || raw.rules.length === 0) {
    throw new ErrorTractor('La configuració ha de declarar almenys una regla en rules.');
  }

  const ids = new Set();
  const rules = raw.rules.map((rule, index) => {
    if (!rule?.id || typeof rule.id !== 'string') {
      throw new ErrorTractor(`La regla ${index + 1} no té id.`);
    }
    if (ids.has(rule.id)) throw new ErrorTractor(`Id de regla duplicat: ${rule.id}`);
    ids.add(rule.id);
    return {
      id: rule.id,
      message: rule.message ?? 'Requisit contradictori',
      severity: rule.severity ?? 'error',
      regex: regexSegura(rule.pattern, rule.flags),
      pathAllow: (rule.path_allow ?? []).map((p) => regexSegura(p)),
      pathDeny: (rule.path_deny ?? []).map((p) => regexSegura(p))
    };
  });

  return {
    id: raw.id ?? 'REQ-SENSE-ID',
    title: raw.title ?? 'Coherència arquitectònica',
    targets: raw.targets,
    extensions: new Set(raw.extensions ?? ['.md', '.mdx', '.txt', '.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.html']),
    ignoreDirectories: new Set(raw.ignore_directories ?? ['.git', 'node_modules', 'dist', 'build', 'coverage']),
    ignoreFilePatterns: (raw.ignore_file_patterns ?? ['\\.abans-[^/]*$', '\\.orig$', '\\.rej$']).map((p) => regexSegura(p)),
    ignorePathPatterns: (raw.ignore_path_patterns ?? []).map((p) => regexSegura(p)),
    inactiveStatuses: new Set((raw.inactive_statuses ?? ['historical', 'historic', 'archived', 'superseded', 'obsolete', 'obsolet']).map((x) => x.toLowerCase())),
    maxBytes: Number.isSafeInteger(raw.max_file_bytes) ? raw.max_file_bytes : 5_000_000,
    rules
  };
}

function frontmatter(text) {
  const normalitzat = text.replaceAll('\r\n', '\n');
  if (!normalitzat.startsWith('---\n')) return {};
  const final = normalitzat.indexOf('\n---\n', 4);
  if (final < 0) return {};

  const meta = {};
  for (const line of normalitzat.slice(4, final).split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!match) continue;
    meta[match[1].toLowerCase()] = match[2].replace(/^(['"])(.*)\1$/, '$2').trim();
  }
  return meta;
}

function esBinari(buffer) {
  const mostra = buffer.subarray(0, Math.min(buffer.length, 8_000));
  return mostra.includes(0);
}

function rutaPosix(rel) {
  return rel.split(path.sep).join('/');
}

function ignoratPerNom(rel, config) {
  const nom = path.basename(rel);
  return config.ignoreFilePatterns.some((regex) => regex.test(nom))
    || config.ignorePathPatterns.some((regex) => regex.test(rutaPosix(rel)));
}

function esInactiu(meta, config) {
  const status = (meta.status ?? meta.estat ?? '').toLowerCase();
  return status !== '' && config.inactiveStatuses.has(status);
}

async function existeixDirectori(abs) {
  try {
    return (await stat(abs)).isDirectory();
  } catch {
    return false;
  }
}

async function recorre(dir, root, config, files, stats) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    throw new ErrorTractor(`No es pot llegir ${path.relative(root, dir)}: ${error.message}`);
  }

  entries.sort((a, b) => a.name.localeCompare(b.name, 'ca'));
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs);

    if (entry.isSymbolicLink()) {
      stats.symlinks += 1;
      continue;
    }
    if (entry.isDirectory()) {
      if (!config.ignoreDirectories.has(entry.name)) await recorre(abs, root, config, files, stats);
      continue;
    }
    if (!entry.isFile()) continue;
    if (ignoratPerNom(rel, config)) {
      stats.historical += 1;
      continue;
    }
    if (!config.extensions.has(path.extname(entry.name).toLowerCase())) {
      stats.unsupported += 1;
      continue;
    }
    files.push({ abs, rel: rutaPosix(rel) });
  }
}

function reglaAplicable(rule, rel) {
  if (rule.pathAllow.length > 0 && !rule.pathAllow.some((regex) => regex.test(rel))) return false;
  if (rule.pathDeny.some((regex) => regex.test(rel))) return false;
  return true;
}

function supressio(line, ruleId) {
  // Exigeix id i motiu: evita excepcions mudes que es convertisquen en forats permanents.
  const escaped = ruleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`tractor-psicopatia:\\s*allow\\s+${escaped}\\s+--\\s+\\S`, 'iu').test(line);
}

function fragment(line, column, length) {
  const max = 180;
  if (line.length <= max) return line.trim();
  const inici = Math.max(0, column - 50);
  const final = Math.min(line.length, Math.max(column + length + 50, inici + max));
  return `${inici > 0 ? '…' : ''}${line.slice(inici, final).trim()}${final < line.length ? '…' : ''}`;
}

async function analitzaFitxer(file, config, stats) {
  const fileStat = await stat(file.abs);
  if (fileStat.size > config.maxBytes) {
    throw new ErrorTractor(`${file.rel} supera max_file_bytes (${fileStat.size} > ${config.maxBytes}).`);
  }

  const buffer = await readFile(file.abs);
  if (esBinari(buffer)) {
    stats.binary += 1;
    return [];
  }

  const text = buffer.toString('utf8');
  if (esInactiu(frontmatter(text), config)) {
    stats.historical += 1;
    return [];
  }

  stats.scanned += 1;
  const findings = [];
  const lines = text.replaceAll('\r\n', '\n').split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const rule of config.rules) {
      if (!reglaAplicable(rule, file.rel)) continue;
      rule.regex.lastIndex = 0;
      const match = rule.regex.exec(line);
      if (!match) continue;

      const mateixa = supressio(line, rule.id);
      const anterior = index > 0 && supressio(lines[index - 1], rule.id);
      if (mateixa || anterior) {
        stats.suppressed += 1;
        continue;
      }

      findings.push({
        rule: rule.id,
        severity: rule.severity,
        message: rule.message,
        path: file.rel,
        line: index + 1,
        column: match.index + 1,
        excerpt: fragment(line, match.index, match[0].length)
      });
    }
  }
  return findings;
}

async function escriuInforme(reportPath, root, payload) {
  const abs = path.isAbsolute(reportPath) ? reportPath : path.resolve(root, reportPath);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return abs;
}

async function main() {
  const cli = argumentsCLI(process.argv.slice(2));
  if (cli.help) {
    ajuda();
    return 0;
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(cli.root ?? path.join(scriptDir, '..', '..'));
  const configPath = path.isAbsolute(cli.config) ? cli.config : path.resolve(root, cli.config);

  if (!cli.quiet) info('Analitzant coherència global…');
  if (!cli.quiet) console.log(`${pinta('gray', '  arrel:')} ${root}`);
  if (!cli.quiet) console.log(`${pinta('gray', '  norma:')} ${path.relative(root, configPath)}`);

  let raw;
  try {
    raw = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    throw new ErrorTractor(`No es pot carregar ${configPath}: ${error.message}`);
  }
  const config = validaConfig(raw, configPath);

  const files = [];
  const stats = { scanned: 0, historical: 0, unsupported: 0, binary: 0, symlinks: 0, suppressed: 0 };
  for (const target of config.targets) {
    const abs = path.resolve(root, target);
    const rel = path.relative(root, abs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new ErrorTractor(`Target fora de l'arrel: ${target}`);
    }
    if (!await existeixDirectori(abs)) {
      throw new ErrorTractor(`Falta el directori obligatori: ${target}`);
    }
    await recorre(abs, root, config, files, stats);
  }

  const findings = [];
  for (const file of files) findings.push(...await analitzaFitxer(file, config, stats));
  findings.sort((a, b) => a.path.localeCompare(b.path, 'ca') || a.line - b.line || a.rule.localeCompare(b.rule));

  const blocking = findings.filter((item) => item.severity === 'error');
  const warnings = findings.filter((item) => item.severity === 'warning');
  const payload = {
    schema: 1,
    gate: 'tractor-psicopatia',
    requirement: { id: config.id, title: config.title },
    generated_at: new Date().toISOString(),
    root,
    result: blocking.length > 0 ? 'failed' : 'passed',
    summary: { ...stats, findings: findings.length, blocking: blocking.length, warnings: warnings.length },
    findings
  };

  if (cli.jsonReport) {
    const informe = await escriuInforme(cli.jsonReport, root, payload);
    if (!cli.quiet) console.log(`${pinta('gray', '  informe:')} ${informe}`);
  }

  for (const item of findings) {
    const color = item.severity === 'error' ? 'red' : 'yellow';
    console.error(`\n${pinta(color, `${item.path}:${item.line}:${item.column}`)} ${pinta('bold', `[${item.rule}]`)}`);
    console.error(`  ${item.message}`);
    console.error(`  ${pinta('gray', item.excerpt)}`);
  }

  console.log('');
  if (blocking.length > 0) {
    falla(`${blocking.length} contradicció(ns) activa(es). BUILD BLOQUEJAT.`);
    console.error(`${pinta('gray', '  Reescriu el requisit o, si és context històric legítim, documenta una supressió local amb motiu.')}`);
    return 1;
  }

  if (warnings.length > 0) avisa(`${warnings.length} avís(os) no bloquejants.`);
  ok(`Coherència verificada: ${stats.scanned} fitxers vius, ${stats.historical} històrics ignorats.`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  falla(`AUDITORIA INCOMPLETA: ${error.message}`);
  if (!(error instanceof ErrorTractor) && process.env.DEBUG) console.error(error.stack);
  process.exitCode = 2;
}
