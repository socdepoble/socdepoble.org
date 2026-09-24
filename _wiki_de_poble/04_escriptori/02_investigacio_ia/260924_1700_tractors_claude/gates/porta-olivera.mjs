#!/usr/bin/env node
/** Porta Olivera v2 · higiene d'Escriptori en la transició Pla → Petorreta.
 *
 *  DESTÍ: tooling/gates/porta-olivera.mjs (substitució sencera, en quarantena
 *  al laboratori 260924_1700_tractors_claude/gates). Les exportacions de la v1
 *  (`checkOlivera`, `esPetorreta`, `ranci`, `plaDeHui`, `destiDeShell`, `avui`,
 *  `inventari`, `ancoratge`, `checkPayload`) es conserven amb la mateixa
 *  signatura: `tests/sistema_nervios.test.mjs` continua passant.
 *
 *  L'ESCLETXA QUE TAPA (incidència del 260924, prompt 1540)
 *    La IAIA va marcar «[x] Escriptori classificat» amb dos prompts del mateix
 *    dia encara damunt la taula, i la porta va callar per quatre motius que
 *    ara són quatre comprovacions:
 *
 *    1. `ranci()` només mirava `data < hui`. Un document de hui, per vell que
 *       fóra dins de la jornada, no era mai ranci. Ara la sessió la marca el
 *       segell termodinàmic: tot transitori amb `aammdd_hhmm` anterior al de la
 *       petorreta que s'escriu (o al del Pla més recent) és ranci. Els plans no
 *       caduquen per sessió: són la pissarra.
 *    2. `inventari()` només llegia el primer nivell. La Safata d'Entrada
 *       (`00_bandeja_d_entrada/`) era invisible. Ara qualsevol element dins de
 *       la Safata és brossa (AGENTS §12: sempre buida).
 *    3. Les caselles eren autodeclaració: només es buscava «[ ]». Ara cada
 *       «[x]» es contrasta amb la comprovació que representa, i una casella
 *       marcada en fals és un error propi, més greu que una sense marcar.
 *    4. `hooks-local.mjs` autoritzava `document.mjs create` sense passar per
 *       ací (l'esborrany naixia sense mirar la taula). El pegat a hooks-local
 *       va a part (hooks-local.patch.txt); esta porta ja accepta `fitxer` sense
 *       `contingut` per a eixe cas.
 *
 *  No esborra res mai. `--arxiva` mou a `90_arxiu_historic/` i despenja les
 *  entrades de l'índex, i és una ordre explícita (AGENTS §5).
 *
 *  Ús:
 *    porta-olivera.mjs                          # hook: llig el payload per stdin
 *    porta-olivera.mjs --informe [--fitxer X]   # auditoria (eixida 1 si bruta)
 *    porta-olivera.mjs --arxiva                 # mou el que sobra a l'arxiu
 */
import { CAMINS } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ARREL = process.env.SDP_ARREL || process.cwd();
const ESCRIPTORI = CAMINS.escriptori;
const ARXIU = CAMINS.arxiuHistoric;
const INDEX = CAMINS.indexEscriptori;
const TORNS = '.agents/runtime/turns';

/** Categories de treball d'un torn: naixen, servixen i se'n van a l'arxiu. */
export const TRANSITORIES = /^(prompt|macro_prompt|micro_prompt|petorreta|auditoria|informe|bundle|macro_bundle|micro_bundle|pla|acta|tasques)$/;

const NOM = /^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.md$/;
const REBUT = /^sdp:(torn_[0-9a-f-]{36}):([0-9a-f-]{36})$/;

/** `aammdd` d'avui, en hora local: és el segell que porten els noms de fitxer. */
export function avui(ara = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(ara.getFullYear() % 100)}${p(ara.getMonth() + 1)}${p(ara.getDate())}`;
}

/** Segell `aammdd_hhmm` d'un nom termodinàmic, o null. */
export function segellDelNom(nom) {
  const m = NOM.exec(path.posix.basename(String(nom).split(path.sep).join('/')));
  return m ? `${m[1]}_${m[2]}` : null;
}

/** Documents solts de l'Escriptori, amb data, hora, categoria i cognom. */
export function inventari(arrel = ARREL) {
  const dir = path.join(arrel, ESCRIPTORI);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith('.') && e.name.endsWith('.md'))
    .map((e) => {
      const m = NOM.exec(e.name);
      if (!m) return null;
      const [, data, hora, resta] = m;
      const categoria = resta.startsWith('pla_implementacio') ? 'pla' : resta.split('_')[0];
      return { nom: e.name, rel: `${ESCRIPTORI}/${e.name}`, data, hora, segell: `${data}_${hora}`, categoria, resta };
    })
    .filter(Boolean);
}

/** El que hauria d'estar a l'arxiu per jornada: categoria de torn i data anterior a hui. */
export function ranci(arrel = ARREL, dia = avui()) {
  return inventari(arrel).filter((d) => TRANSITORIES.test(d.categoria) && d.data < dia);
}

/** Pissarra compartida d'aquesta jornada. */
export function plaDeHui(arrel = ARREL, dia = avui()) {
  return inventari(arrel).filter((d) => /^pla_implementacio(?:_|$)/.test(d.resta) && d.data === dia);
}

/** Segell de sessió: el de la petorreta que s'escriu o, si no, el del Pla més recent. */
export function segellDeSessio(arrel = ARREL, fitxer = null) {
  const propi = fitxer ? segellDelNom(fitxer) : null;
  if (propi) return propi;
  const plans = inventari(arrel).filter((d) => d.categoria === 'pla').map((d) => d.segell).sort();
  return plans.length ? plans[plans.length - 1] : null;
}

/**
 * El que hauria d'estar a l'arxiu per sessió: transitoris (que no siguen plans)
 * amb segell anterior al de la sessió. Els plans són la pissarra i no caduquen
 * per sessió; es queden fins a un `--arxiva` d'una jornada posterior.
 */
export function rancisDeSessio(arrel = ARREL, { fitxer = null, segell = segellDeSessio(arrel, fitxer) } = {}) {
  if (!segell) return [];
  return inventari(arrel).filter((d) => TRANSITORIES.test(d.categoria) && d.categoria !== 'pla' && d.segell < segell);
}

/** Elements de la Safata d'Entrada. Ha d'estar sempre buida (AGENTS §12). */
export function safata(arrel = ARREL) {
  const dir = path.join(arrel, ESCRIPTORI);
  if (!fs.existsSync(dir)) return { carpeta: null, elements: [] };
  const carpeta = fs.readdirSync(dir, { withFileTypes: true })
    .find((e) => e.isDirectory() && /^00_bandeja_d_entrada$/i.test(e.name));
  if (!carpeta) return { carpeta: null, elements: [] };
  const elements = fs.readdirSync(path.join(dir, carpeta.name)).filter((n) => !n.startsWith('.')).sort();
  return { carpeta: `${ESCRIPTORI}/${carpeta.name}`, elements };
}

/** Documents de l'Escriptori sense àncora a l'índex, i àncores a documents absents. */
export function ancoratge(arrel = ARREL) {
  const indexPath = path.join(arrel, INDEX);
  const text = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  const ancores = [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].split('|')[0].trim());
  const docs = inventari(arrel).filter((d) => d.nom !== '00_index_escriptori.md');
  const noms = new Set(docs.map((d) => d.nom.replace(/\.md$/, '')));
  const ancorats = new Set(ancores.map((a) => path.basename(a)));
  return {
    senseAncora: docs.filter((d) => !ancorats.has(d.nom.replace(/\.md$/, ''))).map((d) => d.nom),
    // Només comptem àncores planes: les que porten `/` apunten fora de l'Escriptori.
    fantasma: ancores.filter((a) => !a.includes('/') && !noms.has(a) && a !== '00_index_escriptori')
  };
}

/** El rebut del frontmatter és d'este fitxer? Llig el registre del torn, no es fia del text. */
export function rebutDelFitxer(arrel, fitxer, contingut) {
  const rel = fitxer ? fitxer.split(path.sep).join('/').replace(/^\.\//, '') : null;
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(contingut || '');
  const reflex = front && /^reflex:\s*["']?(sdp:[^"'\s]+)["']?\s*$/m.exec(front[1])?.[1];
  const m = reflex ? REBUT.exec(reflex) : null;
  if (!m) return { ok: false, motiu: 'el frontmatter no porta cap rebut `reflex` de document.mjs context' };
  const torn = path.join(arrel, TORNS, `${m[1]}.json`);
  if (!fs.existsSync(torn)) return { ok: false, motiu: `el torn ${m[1]} no és en este arbre` };
  let registre;
  try { registre = JSON.parse(fs.readFileSync(torn, 'utf8')); } catch { return { ok: false, motiu: `torn ${m[1]} il·legible` }; }
  const rebut = registre?.receipts?.[m[2]];
  if (!rebut) return { ok: false, motiu: 'el rebut no és al registre del torn' };
  if (rel && rebut.file !== rel) return { ok: false, motiu: `el rebut és de «${rebut.file}», no d'este fitxer` };
  return { ok: true, torn: m[1], rebut: m[2] };
}

/** Secció «0. Abans de generar» i l'estat de cada casella: {etiqueta, marcada}. */
export function caselles(contingut) {
  const section = /^##[ \t]+0\.[ \t]+Abans de generar[^\n]*\n([\s\S]*?)(?=^#{1,2}[ \t]+|(?![\s\S]))/m.exec(contingut);
  if (!section) return null;
  return [...section[1].matchAll(/^[ \t]*[-*+][ \t]+\[([ xX])\][ \t]*(?:\*\*([^*\n]+?)\*\*|([^:\n]+))/gm)]
    .map((m) => ({ etiqueta: (m[2] ?? m[3]).trim().replace(/[:.]\s*$/, ''), marcada: m[1] !== ' ' }));
}

/** Les comprovacions de la transició Pla → Petorreta. `fitxer` és el destí; `contingut`, el text complet si es coneix. */
export function checkOlivera(arrel = ARREL, { contingut = null, dia = avui(), fitxer = null } = {}) {
  const errors = [];
  const segell = segellDeSessio(arrel, fitxer);

  const perJornada = ranci(arrel, dia);
  const perSessio = rancisDeSessio(arrel, { fitxer, segell }).filter((d) => !perJornada.includes(d));
  const bruts = [...perJornada, ...perSessio];
  if (perJornada.length) {
    errors.push(`Escriptori sense classificar: ${perJornada.length} document(s) de jornades anteriors encara damunt la taula (${perJornada.map((d) => d.nom).join(', ')}). Arxiva'ls amb: node tooling/gates/porta-olivera.mjs --arxiva`);
  }
  if (perSessio.length) {
    errors.push(`Escriptori sense classificar: ${perSessio.length} document(s) de torns anteriors d'esta jornada, amb segell anterior a ${segell} (${perSessio.map((d) => d.nom).join(', ')}). Un prompt nou no conviu amb els prompts i auditories que ja ha consumit: arxiva'ls amb --arxiva`);
  }

  const bustia = safata(arrel);
  if (bustia.elements.length) {
    errors.push(`Safata d'entrada amb ${bustia.elements.length} element(s) (${bustia.carpeta}: ${bustia.elements.slice(0, 5).join(', ')}${bustia.elements.length > 5 ? '…' : ''}). La Safata s'ha de buidar sempre (AGENTS §12).`);
  }

  const plans = plaDeHui(arrel, dia);
  const plaDeSessio = segell ? plans.filter((d) => d.segell === segell) : plans;
  if (!plans.length) {
    errors.push(`Cap Pla d'Implementació de hui (${dia}) a l'Escriptori. Les altres IAs arriben a una habitació sense pissarra. Genera'l abans: node tooling/wiki/document.mjs context --turn-id ID --route pla.implementacio --file ${ESCRIPTORI}/${dia}_HHMM_pla_implementacio_COGNOM.md`);
  } else if (fitxer && segellDelNom(fitxer) && !plaDeSessio.length) {
    errors.push(`Cap Pla d'Implementació amb el segell ${segell} de la petorreta (n'hi ha de hui: ${plans.map((d) => d.nom).join(', ')}). Pla i petorreta comparteixen l'hora termodinàmica (AGENTS §6).`);
  }

  const anc = ancoratge(arrel);
  // L'àncora del fitxer que s'està escrivint no és cap fantasma: encara no és al disc.
  const propi = fitxer ? path.posix.basename(fitxer.split(path.sep).join('/'), '.md') : null;
  anc.fantasma = anc.fantasma.filter((a) => a !== propi);
  if (anc.senseAncora.length) errors.push(`Sense àncora a l’índex: ${anc.senseAncora.join(', ')}`);
  if (anc.fantasma.length) errors.push(`Àncores a documents absents: ${anc.fantasma.join(', ')}`);

  if (typeof contingut === 'string') {
    const marques = caselles(contingut);
    if (!marques) {
      errors.push("La petorreta no porta la secció «0. Abans de generar (per a l'autor, no per al destinatari)». És la precondició d'higiene i ha de viatjar dins del document, no a la memòria de qui l'escriu.");
    } else {
      const veritat = {
        escriptori: bruts.length === 0 && bustia.elements.length === 0 && anc.senseAncora.length === 0,
        pla: plaDeSessio.length > 0,
        rebut: rebutDelFitxer(arrel, fitxer, contingut)
      };
      const quina = (etiqueta) => /escriptori/i.test(etiqueta) ? 'escriptori' : /pla/i.test(etiqueta) ? 'pla' : /rebut/i.test(etiqueta) ? 'rebut' : null;
      for (const c of marques) {
        const clau = quina(c.etiqueta);
        if (!c.marcada) { errors.push(`La secció 0 té la casella «${c.etiqueta}» sense marcar. Cap petorreta ix del Mas amb la llista a mitges.`); continue; }
        if (clau === 'escriptori' && !veritat.escriptori) errors.push(`Casella «${c.etiqueta}» marcada en fals: la porta troba brossa o àncores pendents (mira els errors anteriors). Una casella no és una comprovació; la comprovació la fa la porta.`);
        if (clau === 'pla' && !veritat.pla) errors.push(`Casella «${c.etiqueta}» marcada en fals: no hi ha cap Pla d'Implementació amb el segell d'esta petorreta.`);
        if (clau === 'rebut' && !veritat.rebut.ok) errors.push(`Casella «${c.etiqueta}» marcada en fals: ${veritat.rebut.motiu}.`);
      }
    }
  }

  return { valid: errors.length === 0, errors, segell, bruts: bruts.map((d) => d.nom), safata: bustia.elements };
}

/** És una petorreta de l'Escriptori? Només eixe cas dispara la porta. */
export function esPetorreta(rel) {
  const pla = rel.split(path.sep).join('/');
  if (!pla.startsWith(`${ESCRIPTORI}/`)) return false;
  if (pla.slice(ESCRIPTORI.length + 1).includes('/')) return false;
  const m = NOM.exec(path.basename(pla));
  return !!m && /^(prompt|macro_prompt|micro_prompt|petorreta)_/.test(m[3]);
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

/** Destí d'una redirecció de shell que escriga una petorreta sense passar per cap eina de fitxers. */
export function destiDeShell(ordre) {
  if (typeof ordre !== 'string') return null;
  const m = /(?:>>?|\|\s*tee(?:\s+-a)?)\s*(?:'([^']+)'|"([^"]+)"|(\S+))/.exec(ordre);
  const desti = m && (m[1] || m[2] || m[3]);
  return desti && esPetorreta(desti.replace(/^\.\//, '')) ? desti : null;
}

function rutaIContingut(payload) {
  const ti = payload.tool_input;
  const ta = payload.toolArgs;
  const dialecte = ti ? 'claude' : 'antigravity';
  const fitxer = ti?.file_path || ti?.notebook_path || ta?.TargetFile
    || destiDeShell(ti?.command || ta?.Command || ta?.CommandLine) || null;
  const contingut = typeof ti?.content === 'string' ? ti.content
    : typeof ta?.CodeContent === 'string' ? ta.CodeContent
      : null;
  return { dialecte, fitxer, contingut };
}

export function checkPayload(payload, arrel = ARREL) {
  if (!payload || typeof payload !== 'object' || !payload.tool_name || (!payload.tool_input && !payload.toolArgs)) return { code: 2, errors: ['Payload de hook incomplet'] };
  const { dialecte, fitxer, contingut } = rutaIContingut(payload);
  if (!fitxer) {
    const reads = ['Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code'];
    return reads.includes(payload.tool_name) ? { code: 0, errors: [] } : { code: 2, errors: ['Hook sense destí verificable; usa hooks-local per a shell i eines no documentals'] };
  }
  const rel = path.isAbsolute(fitxer) ? path.relative(arrel, fitxer) : fitxer;
  if (!esPetorreta(rel)) return { code: 0, errors: [] };
  if (typeof contingut !== 'string') return { code: 2, errors: ['Petorreta sense contingut complet verificable; usa escriptura documental explícita'], file: rel };
  const r = checkOlivera(arrel, { contingut, fitxer: rel });
  return { code: r.valid ? 0 : (dialecte === 'claude' ? 2 : 1), errors: r.errors, file: rel };
}

/* ── Arxivat explícit ─────────────────────────────────────────────────────── */

function arxiva(arrel = ARREL) {
  const perJornada = ranci(arrel);
  const bruts = [...perJornada, ...rancisDeSessio(arrel).filter((d) => !perJornada.includes(d))];
  if (!bruts.length) return { moguts: [], index: false };
  const desti = path.join(arrel, ARXIU);
  fs.mkdirSync(desti, { recursive: true });

  const moguts = [];
  for (const d of bruts) {
    const origen = path.join(arrel, d.rel);
    const final = path.join(desti, d.nom);
    if (fs.existsSync(final)) { moguts.push({ ...d, nota: 'ja existia a l’arxiu; no es sobreescriu' }); continue; }
    fs.renameSync(origen, final);
    moguts.push({ ...d, nota: 'mogut' });
  }

  // Despenjar les àncores dels documents que ja no viuen a l'Escriptori.
  const indexPath = path.join(arrel, INDEX);
  let tocat = false;
  if (fs.existsSync(indexPath)) {
    const noms = new Set(moguts.filter((m) => m.nota === 'mogut').map((m) => m.nom.replace(/\.md$/, '')));
    const linies = fs.readFileSync(indexPath, 'utf8').split('\n');
    const netes = linies.filter((l) => {
      const m = /^\s*-\s*\[\[([^\]]+)\]\]/.exec(l);
      return !(m && noms.has(path.basename(m[1].split('|')[0].trim())));
    });
    if (netes.length !== linies.length) {
      fs.writeFileSync(indexPath, netes.join('\n'), 'utf8');
      tocat = true;
    }
  }
  return { moguts, index: tocat };
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */

function informe(arrel, fitxer = null) {
  const r = checkOlivera(arrel, { fitxer });
  const bustia = safata(arrel);
  const anc = ancoratge(arrel);
  console.log(`[Porta Olivera] Escriptori: ${inventari(arrel).length} documents solts · segell de sessió: ${r.segell ?? 'cap pla'}.`);
  console.log(r.bruts.length ? `❌ ${r.bruts.length} document(s) que ja no viuen ací:\n${r.bruts.map((n) => `   · ${n}`).join('\n')}` : '✅ Cap document de jornades o torns anteriors.');
  console.log(bustia.elements.length ? `❌ Safata d'entrada amb ${bustia.elements.length} element(s).` : '✅ Safata d\'entrada buida.');
  const pla = plaDeHui(arrel);
  console.log(pla.length ? `✅ Pla d'Implementació de hui: ${pla.map((d) => d.nom).join(', ')}` : "❌ Cap Pla d'Implementació de hui.");
  if (anc.senseAncora.length) console.log(`❌ Sense àncora a l'índex: ${anc.senseAncora.join(', ')}`);
  if (anc.fantasma.length) console.log(`❌ Àncores a documents que ja no són a l'Escriptori: ${anc.fantasma.length} (fan caure la porta)`);
  return r.valid ? 0 : 1;
}

function main() {
  const argv = process.argv.slice(2);
  const arrel = ARREL;
  const valor = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };

  if (argv.includes('--arxiva')) {
    const r = arxiva(arrel);
    if (!r.moguts.length) console.log('[Porta Olivera] Res a arxivar.');
    for (const m of r.moguts) console.log(`   · ${m.nom} → ${ARXIU}/ (${m.nota})`);
    if (r.index) console.log(`   · ${INDEX} actualitzat.`);
    process.exitCode = 0;
    return;
  }

  if (argv.includes('--informe')) { process.exitCode = informe(arrel, valor('--fitxer')); return; }

  const raw = fs.readFileSync(0, 'utf8');
  if (!raw.trim()) { process.exitCode = informe(arrel); return; }

  // Un payload il·legible no acredita cap comprovació: falla tancat.
  let result;
  try { result = checkPayload(JSON.parse(raw), arrel); }
  catch (e) {
    console.error(`[PORTA-OLIVERA] payload il·legible (${e.message}); cap comprovació executada.`);
    result = { code: 2, errors: ['Payload il·legible: cap autorització'] };
  }

  if (result.errors.length) {
    console.error(`[PORTA-OLIVERA] BLOQUEIG · ${result.file}\n${result.errors.map((e) => `- ${e}`).join('\n')}\nLa Reunió a l'Olivera comença amb la taula classificada i el Pla damunt.`);
  }
  process.exitCode = result.code;
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink no coincidixen i la porta ix 0 sense comprovar res.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { main(); } catch (e) { console.error(e.message); process.exitCode = 2; }
}
