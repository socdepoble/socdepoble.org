import fs from 'node:fs';
import path from 'node:path';
import { ROOT, segura, font } from '../../tooling/brain/cataleg_skills.mjs';
import { verificaEmissio } from '../../tooling/brain/context_documental.mjs';

const ESCRIPTORI = '_wiki_de_poble/04_escriptori';
const WRITES = new Set(['write_to_file', 'replace_file_content', 'multi_replace_file_content']);
const RESERVED = new Set(['SKILL.md', 'LEDGER.md', 'ESTAT.md', 'AGENTS.md', 'BIOS.md', 'BASELINE.md',
  'PROFILE.md', 'BOOTSTRAP.md', 'PROTOCOL_PETORRETA.md', '00_INDEX_ESCRIPTORI.md', '00_index_escriptori.md',
  'REGISTRE_CODI.md', '.gitkeep']);
const CODE = new Set(['.mjs', '.js', '.cjs', '.jsx', '.ts', '.tsx', '.css', '.php', '.sh', '.py', '.sql', '.yaml', '.yml', '.html']);
const THERMO = /^\d{6}_\d{4}_[a-z0-9]+(?:_[a-z0-9]+){1,6}\.(md|txt|json|csv)$/;
const within = (rel, dir) => rel === dir || rel.startsWith(dir + '/');
const answer = (decision, reason) => ({ decision, reason });
export function decide(payload, root = ROOT) {
  const call = payload?.toolCall;
  if (!call || typeof call.name !== 'string' || !call.args || typeof call.args !== 'object')
    return answer('deny', 'Payload desconegut: falta toolCall.name/args');
  const args = call.args;
  if (call.name === 'run_command') {
    const cmd = args.CommandLine ?? args.command;
    // No inferim efectes d'un script a partir del seu directori.
    const reads = new Set(['git status --short', 'git diff --stat', 'git diff --check',
      'node tooling/brain/cataleg_skills.mjs --check', 'node tooling/gates/tractor-manifest.mjs --json']);
    return reads.has(cmd) ? answer('allow', 'Ordre exacta de diagnòstic')
      : answer('ask', 'Efectes de shell no modelats: cal autorització explícita de l’arnés');
  }
  if (!WRITES.has(call.name) && call.name !== 'create_directory') return answer('deny', 'Eina no reconeguda');
  const targets = [args.TargetFile, args.AbsolutePath, args.DirectoryPath].filter(v => v !== undefined);
  if (!targets.length || targets.some(v => typeof v !== 'string' || !v.trim())) return answer('deny', 'Destí absent o invàlid');
  const absolute = targets.map(v => path.resolve(root, v));
  if (new Set(absolute).size !== 1) return answer('deny', 'Diversos destins incompatibles');
  const rel = path.relative(root, absolute[0]).split(path.sep).join('/');
  try { segura(root, rel); } catch (e) { return answer('deny', e.message); }
  const parts = rel.split('/'), base = parts.at(-1), ext = path.extname(base).toLowerCase();
  if (parts.some(p => p === '.git' || p === 'node_modules' || p === '.brain-trash' ||
      p === '.env' || (p.startsWith('.env.') && p !== '.env.example'))) return answer('deny', 'Destí protegit');
  if (parts.some(p => p.toLowerCase() === '90_arxiu_historic')) return answer('deny', 'Arxiu històric de lectura');
  if (within(rel, `${ESCRIPTORI}/01_produccio`) || within(rel, `${ESCRIPTORI}/01_Produccio`))
    return answer('deny', 'Producció humana protegida');
  const constitutional = within(rel, '.agents') || within(rel, 'tooling/gates') || within(rel, 'tooling/brain') ||
    within(rel, 'supabase/migrations') || rel === 'tooling/wiki/reflex_petorreta.mjs';
  if (constitutional && !['.agents/ESTAT.md', '.agents/LEDGER.md'].includes(rel)) return answer('deny', 'Contracte executable: aplicació manual');
  if (['.zip', '.tar', '.gz', '.tgz'].includes(ext)) return answer('deny', 'Paquet comprimit fora del contracte');
  if (/\.abans-\d{6}$|\.(bak|old|orig|tmp|copy)$|^(prova|test|tmp|temp|scratch|borrador)[-_.]|\bcopy\b|\(\d+\)\./i.test(base))
    return answer('deny', 'Còpia o fitxer de treball fora de lloc');
  if (base === 'LEDGER.md' && (call.name !== 'write_to_file' || args.Overwrite))
    return answer('ask', 'Cal comprovar que el canvi només afig al LEDGER');
  if (parts.length === 1 && !base.startsWith('.') && !RESERVED.has(base) && !CODE.has(ext))
    return answer('deny', 'Document de treball fora de l’escriptori');
  if (within(rel, ESCRIPTORI)) {
    const tail = rel.slice(ESCRIPTORI.length + 1);
    if (tail.includes('/') || call.name === 'create_directory') return answer('ask', 'Subcarpeta permanent: cal decisió explícita');
    if (!RESERVED.has(base) && !THERMO.test(base)) return answer('deny', 'Nom termodinàmic invàlid');
  }
  if (ext === '.css') {
    const fragments = [args.CodeContent, args.ReplacementContent,
      ...(Array.isArray(args.ReplacementChunks) ? args.ReplacementChunks.map(c => c.ReplacementContent) : [])];
    if (fragments.some(s => typeof s === 'string' && s.includes('!important'))) return answer('deny', 'Invariant CSS !important');
  }
  if (WRITES.has(call.name) && ext === '.md' && within(rel, '_wiki_de_poble')) {
    try {
      const config = JSON.parse(font(root, '.agents/DESTINS_CANONICS.json').text);
      const destinations = Object.values(config.destins_permesos ?? {});
      if (!destinations.length || destinations.some(d => typeof d !== 'string')) throw new Error('Destins invàlids');
      for (const d of destinations) segura(root, d);
      if (!destinations.some(d => within(rel, d))) throw new Error('Destí no canònic');
      const receipt = verificaEmissio(payload, root);
      return answer('allow', `Context emés i vigent: ${receipt.torn}; destí ${rel}`);
    } catch (e) { return answer('deny', e.message); }
  }
  return answer('allow', `Ruta conforme: ${rel}`);
}
try { console.log(JSON.stringify(decide(JSON.parse(fs.readFileSync(0, 'utf8'))))); }
catch (e) { console.log(JSON.stringify(answer('deny', e.message))); }