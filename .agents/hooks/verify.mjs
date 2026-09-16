#!/usr/bin/env node
/**
 * verify.mjs v2 — Porta d'escriptura (PreToolUse).
 *
 * QUÈ FEIA MALAMENT LA v1 (auditoria 260831, Seient 5)
 * ────────────────────────────────────────────────────
 *   La v1 s'executava en CADA escriptura i retornava `allow` sempre, tret
 *   d'un `ask` quan es sobreescrivia el LEDGER. Deia «Fitxer verificat» sense
 *   haver verificat res. Era el mateix patró que el `context_preflight.mjs`:
 *   una porta que no tanca però encén el llum verd.
 *
 * ARNÉS CONCRET
 * ─────────────
 *   Aquesta porta està dissenyada específicamente per al payload de l'arnés
 *   que proporciona toolCall.args (TargetFile / AbsolutePath / DirectoryPath / Overwrite).
 *
 * LLEI D'ESTA PORTA
 * ─────────────────
 *   La brossa no es neteja: no es deixa caure. Esta porta no comprova a la fi
 *   del torn si l'Escriptori està net; impedix que s'embrute mentre s'escriu.
 *   Un Diògenes al qual li lleven la mà no acumula.
 *
 *   Si la porta no pot llegir la petició, respon `ask`. Mai `allow` per
 *   defecte: un permís que no s'ha pogut fonamentar no és un permís.
 *
 * EIXIDA
 *   { "decision": "allow" | "ask" | "deny", "reason": "..." }
 */

import fs from 'node:fs';
import path from 'node:path';

const ARREL = process.env.SDP_ARREL || process.cwd();
const ESCRIPTORI = '_wiki_de_poble/04_escriptori';
const DIARI = path.join(ARREL, '.agents', '.diari_sessio.jsonl');

/* AGENTS.md §2 — AAMMDD_HHMM_categoria_titol.ext, 1–6 paraules */
const TERMODINAMIC = /^\d{6}_\d{4}_[a-z0-9]+(?:_[a-z0-9]+){1,6}\.(md|txt|json|csv)$/;

/* AGENTS.md §2 — excepcions reservades i codi font */
const RESERVATS = new Set([
  'SKILL.md', 'LEDGER.md', 'ESTAT.md', 'AGENTS.md', 'BIOS.md', 'BASELINE.md',
  'PROFILE.md', 'BOOTSTRAP.md', 'PROTOCOL_PETORRETA.md',
  '00_INDEX_ESCRIPTORI.md', 'REGISTRE_CODI.md', '.gitkeep', '.DS_Store',
]);
const EXT_CODI = new Set([
  '.mjs', '.js', '.cjs', '.jsx', '.ts', '.tsx', '.css', '.php',
  '.sh', '.py', '.sql', '.yaml', '.yml', '.html',
]);

/* Satèl·lits: patrons que la casa ha vist créixer i no vol tornar a veure. */
const SATELLITS = [
  { re: /\.abans-\d{6}$/i, nom: 'una còpia .abans-AAMMDD' },
  { re: /\.(bak|old|orig|tmp|copy)$/i, nom: 'una còpia de seguretat manual' },
  { re: /^(prova|test|tmp|temp|scratch|borrador)[-_.]/i, nom: 'un fitxer de prova solt' },
  { re: /\bcopy\b|\(\d+\)\./i, nom: 'un duplicat automàtic' },
];
const CARPETES_PROHIBIDES = /^(Z|Z\.ai|Qwen|Deepseek|Dola|Kimi|Claude|Perplexity|Mistral|Mistral Vibe|Grok|Gemini|Copilot|ChatGPT|ChatGPT Codex|Codex|IA)\d*$/i;

const resp = (decision, reason) => {
  process.stdout.write(JSON.stringify({ decision, reason }));
  process.exit(0);
};

/* Un rebut més vell que això ja no descriu el que s'està fent ara. */
const FINESTRA_REBUT_MS = 30 * 60 * 1000;

/* Llig el darrer rebut Matrix del diari. Si no el pot llegir, torna null:
   «no he pogut comprovar-ho» mai equival a «està bé» (P-07). */
function darrerRebutMatrix() {
  try {
    const linies = fs.readFileSync(DIARI, 'utf8').trim().split('\n');
    for (let i = linies.length - 1; i >= 0; i--) {
      const e = JSON.parse(linies[i]);
      if (e?.tipus === 'matrix.rebut' && e.t && e.peticio_sha256 && Array.isArray(e.fonts)) return e;
    }
  } catch { /* diari absent o il·legible → cap rebut */ }
  return null;
}

function anotaDiari(entrada) {
  try {
    fs.mkdirSync(path.dirname(DIARI), { recursive: true });
    fs.appendFileSync(DIARI, `${JSON.stringify(entrada)}\n`, 'utf8');
  } catch { /* el diari és observació, no autoritat: mai bloqueja */ }
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { input += c; });

process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    resp('ask', "[PORTA] No he pogut llegir la petició d'escriptura. "
      + 'No autoritze el que no puc comprovar. Confirma manualment.');
  }

  const args = payload?.toolCall?.args || {};
  const eina = payload?.toolCall?.name || '';
  
  if (!payload?.toolCall?.args) {
    resp('ask', "[PORTA] Arnés desconegut. L'estructura del payload no conté 'toolCall.args'. "
      + 'No puc comprovar què vols escriure. Confirma manualment.');
  }

  if (eina === 'run_command') {
    const cmd = String(args.CommandLine || args.command || '');
    const BLANCA = /^(git (status|diff|log|show)\b|node tooling\/(gates|wiki|brain)\/|npm (run )?(porta|test|lint|build)\b)/;
    if (!BLANCA.test(cmd) || /[;&|`$\n\r]/.test(cmd)) {
      resp('deny', `[PORTA] Ordre no permesa per la llista blanca o injecció de shell: ${cmd.slice(0, 80)}`);
    }
    resp('allow', 'ordre de la llista blanca permesa');
  }

  const brut = args.TargetFile || args.AbsolutePath || args.DirectoryPath || '';

  if (!brut) {
    resp('ask', "[PORTA] La petició no declara cap ruta de destí. Confirma manualment.");
  }

  const abs = path.isAbsolute(brut) ? brut : path.resolve(ARREL, brut);
  const rel = path.relative(ARREL, abs).split(path.sep).join('/');
  const base = path.basename(abs);
  const ext = path.extname(base).toLowerCase();



  /* ── LLEI 0-bis · Zona constitucional ── */
  const ZONA_CONSTITUCIONAL = ['.agents/', 'tooling/gates/', 'tooling/wiki/reflex_petorreta.mjs', 'supabase/migrations/'];
  const EXCEPCIONS_CONSTITUCIONALS = ['.agents/ESTAT.md', '.agents/LEDGER.md'];
  if (ZONA_CONSTITUCIONAL.some(p => rel.startsWith(p)) && !EXCEPCIONS_CONSTITUCIONALS.includes(rel)) {
    resp('deny', `[PORTA] "${rel}" forma part del contracte executable o la constitució (BIOS/Agents). No es pot modificar per esta via sense autoritat superior manual.`);
  }

  /* ── LLEI 0 · Zona prohibida (AGENTS.md §5) ── */
  if (rel === '.env' || (rel.startsWith('.env.') && rel !== '.env.example')) {
    resp('deny', "[PORTA · §5] Els secrets no s'escriuen des d'ací.");
  }
  
  if (['.zip', '.tar', '.gz', '.tgz'].includes(ext)) {
    resp('deny', "[PORTA] Creació de paquets comprimits prohibida per regla.");
  }

  if (rel.startsWith('90_arxiu_historic/')) {
    resp('deny', "[PORTA] L'arxiu històric és de NOMÉS LECTURA. Posa el fitxer a 90_arxiu_historic/.");
  }

  /* ── LLEI 1 · Immutabilitat del LEDGER ── */
  if (base === 'LEDGER.md' && eina === 'write_to_file' && args.Overwrite) {
    resp('ask', "[PORTA · LEDGER] L'historial és immutable i estàs sobreescrivint-lo "
      + 'sencer. Si vols afegir una entrada, afig; no reescrigues.');
  }

  /* ── LLEI 2 · Cap satèl·lit, enlloc ── */
  for (const s of SATELLITS) {
    if (s.re.test(base)) {
      resp('deny', `[PORTA · SATÈL·LIT] "${base}" és ${s.nom}. `
        + 'La casa no guarda dobles. Si vols una còpia de seguretat, usa git; '
        + `si vols un document de treball, escriu-lo a ${ESCRIPTORI}/ amb nom termodinàmic.`);
    }
  }

  /* ── LLEI 3 · Arrel del repositori neta (AGENTS.md §3) ── */
  const dinsArrel = !rel.includes('/');
  if (dinsArrel && !rel.startsWith('.') && !RESERVATS.has(base) && !EXT_CODI.has(ext)) {
    resp('deny', `[PORTA · §3] "${base}" a l'arrel del repositori. `
      + `L'única safata de treball és ${ESCRIPTORI}/.`);
  }

  /* ── LLEI 4 · Escriptori: nom termodinàmic i pla ── */
  if (rel.startsWith(`${ESCRIPTORI}/`)) {
    const cua = rel.slice(ESCRIPTORI.length + 1);
    const primer = cua.split('/')[0];

    if (cua.includes('/')) {
      if (CARPETES_PROHIBIDES.test(primer)) {
        resp('deny', `[PORTA · §3] "${primer}/" és una carpeta de niu d'IA. `
          + "L'Escriptori és una safata plana: un document, un nom, un índex. "
          + 'No hi ha subcarpetes per IA.');
      }
      resp('ask', `[PORTA · §3] Vols crear "${primer}/" dins de l'Escriptori. `
        + "L'Escriptori és pla per disseny. Confirma que esta subcarpeta és permanent "
        + "i que la declararàs a 00_INDEX_ESCRIPTORI.md.");
    }

    if (!RESERVATS.has(base) && !TERMODINAMIC.test(base)) {
      const ara = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const suggerit = `${String(ara.getFullYear()).slice(2)}${p(ara.getMonth() + 1)}${p(ara.getDate())}`
        + `_${p(ara.getHours())}${p(ara.getMinutes())}_categoria_titol${ext || '.md'}`;
      resp('deny', `[PORTA · §2] "${base}" no té nom termodinàmic. `
        + `Format: AAMMDD_HHMM_categoria_titol.ext (md|txt|json|csv). Exemple: ${suggerit}. `
        + "Si és una eina i no un document, no va a l'Escriptori: va a tooling/.");
    }
  }

  /* ── LLEI 5 · Zero !important (Invariant de Z) ── */
  if (ext === '.css') {
    let contingut = '';
    if (args.CodeContent) contingut += args.CodeContent;
    if (args.ReplacementContent) contingut += args.ReplacementContent;
    if (Array.isArray(args.ReplacementChunks)) {
      args.ReplacementChunks.forEach(c => {
        if (c.ReplacementContent) contingut += c.ReplacementContent;
      });
    }
    if (contingut.includes('!important')) {
      resp('deny', `[PORTA · INVARIANT CSS] Has intentat injectar un '!important' a ${base}. `
        + 'Això viola la política d\'arquitectura Pedra Seca (Cascade Layers). Fes servir @layer o augmenta l\'especificitat del selector de forma neta.');
    }
  }

  /* ── LLEI 6 · Cap document sense rebut Matrix (Saber ≠ Fer) ──
     L'Efecte Matrix estava escrit com una instrucció: «busca la plantilla
     abans d'actuar». Una instrucció es desobeïx sense conseqüència. Ací
     passa a ser precondició: si el torn no ha carregat el context de
     veritat (rebut sha256 al diari, viu), no hi ha document.

     Només aplica a documents nous de la Wiki i de l'Escriptori. El codi
     no passa per ací: el codi el governa el Trellat, no la plantilla. */
  const ES_DOCUMENT = ext === '.md'
    && !RESERVATS.has(base)
    && (rel.startsWith(`${ESCRIPTORI}/`) || rel.startsWith('_wiki_de_poble/'));

  const EINES_ESCRIPTURA = new Set(['write_to_file', 'replace_file_content', 'multi_replace_file_content']);
  if (ES_DOCUMENT && EINES_ESCRIPTURA.has(eina)) {
    let destins;
    try {
      destins = JSON.parse(fs.readFileSync(path.join(ARREL, '.agents', 'DESTINS_CANONICS.json'), 'utf8'));
    } catch {
      resp('deny', "[PORTA] No s'ha pogut llegir DESTINS_CANONICS.json. Arquitectura compromesa.");
    }
    
    // Verifiquem si el destí del document està dins de les carpetes permeses
    const permeses = Object.values(destins.destins_permesos || {});
    const esPermes = permeses.some(p => rel.startsWith(p + '/'));
    if (!esPermes && !rel.includes('/') && !RESERVATS.has(base)) {
      // Rebuig explícit
      resp('deny', `[PORTA] Destí il·legal. La creació de documents només està permesa als destins del JSON canònic: ${permeses.join(', ')}.`);
    } else if (!esPermes) {
      resp('deny', `[PORTA] Destí il·legal. Has intentat escriure a ${rel}, però no està al JSON canònic.`);
    }

    const rebut = darrerRebutMatrix();
    if (!rebut) {
      resp('deny', `[PORTA · LLEI 6] Vols crear "${base}" sense haver fet l'Efecte Matrix. `
        + 'Executa `node tooling/brain/matrix.mjs "<el que t\'han demanat>"`, llig la plantilla '
        + 'que t\'encamine i torna. Sense rebut no hi ha document: la Wiki no es consulta de memòria.');
    }
    if (Date.now() - Date.parse(rebut.t) > FINESTRA_REBUT_MS) {
      resp('deny', `[PORTA · LLEI 6] El rebut Matrix és de fa més de ${FINESTRA_REBUT_MS / 60000} minuts `
        + `(${rebut.t}). Un context caducat no és context. Torna a passar el Matrix amb la petició d'ara.`);
    }
    anotaDiari({ t: new Date().toISOString(), eina, ruta: rel, rebut: rebut.peticio_sha256.slice(0, 12), protocols: rebut.protocols });
    resp('allow', `ruta ${rel} conforme a §2/§3/§5 i destins canònics. Rebut Matrix ${rebut.peticio_sha256.slice(0, 12)} `
      + `(${rebut.fonts.length} fonts, protocol: ${rebut.protocols.join(', ') || 'per defecte'})`);
  }

  /* ── Autoritzat: queda anotat al diari de sessió ── */
  anotaDiari({ t: new Date().toISOString(), eina, ruta: rel });
  resp('allow', `ruta ${rel} conforme a §2/§3/§5`);
});
