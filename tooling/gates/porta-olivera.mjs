#!/usr/bin/env node
/** Porta Olivera · higiene d'Escriptori en la transició Pla → Petorreta.
 *
 *  El problema que resol, dit sense adornar-lo: la precondició d'higiene («neteja
 *  l'Escriptori i escriu el Pla abans de cridar les altres IAs») vivia a les
 *  Lliçons d'una skill, i el moment de decisió té davant un altre document. Una
 *  regla que ha de disparar en el moment X ha de viure al canal que corre en el
 *  moment X. Qualsevol altra ubicació és decorativa.
 *
 *  Per això açò no és un recordatori: és una porta `PreToolUse`. Quan algú escriu
 *  una petorreta a l'Escriptori, comprova tres coses i bloqueja si no es complixen:
 *
 *    1. L'Escriptori està classificat: cap prompt, auditoria, pla o bundle de
 *       jornades anteriors solt damunt la taula.
 *    2. Hi ha un Pla d'Implementació d'aquesta jornada: la pissarra compartida
 *       existix abans de convocar ningú.
 *    3. La petorreta porta la secció «0. Abans de generar» i cap casella sense
 *       marcar.
 *
 *  No esborra res mai. `--arxiva` mou a `90_arxiu_historic/` i despenja les
 *  entrades de l'índex, i és una ordre explícita: AGENTS §5 prohibix l'esborrat
 *  automàtic i el trasllat silenciós d'allò que encara pot estar viu.
 *
 *  Ús:
 *    porta-olivera.mjs                 # hook: llig el payload per stdin
 *    porta-olivera.mjs --informe       # auditoria de l'Escriptori (eixida 1 si brut)
 *    porta-olivera.mjs --arxiva        # mou el que sobra a 90_arxiu_historic/
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ARREL = process.env.SDP_ARREL || process.cwd();
const ESCRIPTORI = '_wiki_de_poble/04_escriptori';
const ARXIU = '_wiki_de_poble/90_arxiu_historic';
const INDEX = `${ESCRIPTORI}/00_index_escriptori.md`;

/** Categories de treball d'un torn: naixen, servixen i se'n van a l'arxiu. */
const TRANSITORIES = /^(prompt|macro_prompt|micro_prompt|petorreta|auditoria|informe|bundle|macro_bundle|micro_bundle|pla|acta|tasques)$/;

const NOM = /^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.md$/;

/** `aammdd` d'avui, en hora local: és el segell que porten els noms de fitxer. */
export function avui(ara = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(ara.getFullYear() % 100)}${p(ara.getMonth() + 1)}${p(ara.getDate())}`;
}

/** Documents solts de l'Escriptori, amb data, categoria i cognom. */
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
      return { nom: e.name, rel: `${ESCRIPTORI}/${e.name}`, data, hora, categoria, resta };
    })
    .filter(Boolean);
}

/** El que hauria d'estar a l'arxiu: categoria de torn i data anterior a hui. */
export function ranci(arrel = ARREL, dia = avui()) {
  return inventari(arrel).filter((d) => TRANSITORIES.test(d.categoria) && d.data < dia);
}

/** Pissarra compartida d'aquesta jornada. */
export function plaDeHui(arrel = ARREL, dia = avui()) {
  return inventari(arrel).filter((d) => d.categoria === 'pla' && d.data === dia);
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

/** Les tres comprovacions de la transició Pla → Petorreta. */
export function checkOlivera(arrel = ARREL, { contingut = null, dia = avui() } = {}) {
  const errors = [];

  const bruts = ranci(arrel, dia);
  if (bruts.length) {
    errors.push(`Escriptori sense classificar: ${bruts.length} document(s) de jornades anteriors encara damunt la taula (${bruts.map((d) => d.nom).join(', ')}). Arxiva'ls amb: node tooling/gates/porta-olivera.mjs --arxiva`);
  }

  if (!plaDeHui(arrel, dia).length) {
    errors.push(`Cap Pla d'Implementació de hui (${dia}) a l'Escriptori. Les altres IAs arriben a una habitació sense pissarra. Genera'l abans: node tooling/wiki/document.mjs context --turn-id ID --route pla.implementacio --file ${ESCRIPTORI}/${dia}_HHMM_pla_implementacio_COGNOM.md`);
  }

  if (typeof contingut === 'string') {
    if (!/^##\s+0\.\s+Abans de generar/m.test(contingut)) {
      errors.push("La petorreta no porta la secció «0. Abans de generar (per a l'autor, no per al destinatari)». És la precondició d'higiene i ha de viatjar dins del document, no a la memòria de qui l'escriu.");
    } else if (/^\s*-\s*\[\s\]/m.test(contingut)) {
      errors.push('La secció 0 té caselles sense marcar. Cap petorreta ix del Mas amb la llista a mitges.');
    }
  }

  return { valid: errors.length === 0, errors };
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

/**
 * Una redirecció de shell escriu sense passar per cap eina de fitxers, i eixa és
 * la via per la qual els documents d'aquesta jornada van arribar al disc sense
 * rebut. Ací només mirem el destí: si apunta a una petorreta de l'Escriptori,
 * la porta actua igual que amb una escriptura normal.
 */
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
  const { dialecte, fitxer, contingut } = rutaIContingut(payload);
  if (!fitxer) return { code: 0, errors: [] };
  const rel = path.isAbsolute(fitxer) ? path.relative(arrel, fitxer) : fitxer;
  if (!esPetorreta(rel)) return { code: 0, errors: [] };
  const r = checkOlivera(arrel, { contingut });
  return { code: r.valid ? 0 : (dialecte === 'claude' ? 2 : 1), errors: r.errors, file: rel };
}

/* ── Arxivat explícit ─────────────────────────────────────────────────────── */

function arxiva(arrel = ARREL) {
  const bruts = ranci(arrel);
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

function informe(arrel) {
  const bruts = ranci(arrel);
  const pla = plaDeHui(arrel);
  const anc = ancoratge(arrel);
  console.log(`[Porta Olivera] Escriptori: ${inventari(arrel).length} documents solts.`);
  if (bruts.length) {
    console.log(`❌ ${bruts.length} de jornades anteriors (han d'anar a ${ARXIU}/):`);
    for (const d of bruts) console.log(`   · ${d.nom}`);
  } else console.log('✅ Cap document de jornades anteriors.');
  console.log(pla.length ? `✅ Pla d'Implementació de hui: ${pla.map((d) => d.nom).join(', ')}` : "❌ Cap Pla d'Implementació de hui.");
  if (anc.senseAncora.length) console.log(`❌ Sense àncora a l'índex: ${anc.senseAncora.join(', ')}`);
  if (anc.fantasma.length) console.log(`⚠️ Àncores a documents que ja no són a l'Escriptori: ${anc.fantasma.length}`);
  return bruts.length || !pla.length || anc.senseAncora.length ? 1 : 0;
}

function main() {
  const argv = process.argv.slice(2);
  const arrel = ARREL;

  if (argv.includes('--arxiva')) {
    const r = arxiva(arrel);
    if (!r.moguts.length) console.log('[Porta Olivera] Res a arxivar.');
    for (const m of r.moguts) console.log(`   · ${m.nom} → ${ARXIU}/ (${m.nota})`);
    if (r.index) console.log(`   · ${INDEX} actualitzat.`);
    process.exitCode = 0;
    return;
  }

  if (argv.includes('--informe')) { process.exitCode = informe(arrel); return; }

  const raw = fs.readFileSync(0, 'utf8');
  if (!raw.trim()) { process.exitCode = informe(arrel); return; }

  // Obri en fals davant d'un payload il·legible: una porta d'higiene no pot
  // deixar el Mestre tancat fora per un dialecte de hook que no coneixem. Es
  // diu per stderr perquè l'omissió es veja.
  let result;
  try { result = checkPayload(JSON.parse(raw), arrel); }
  catch (e) {
    console.error(`[PORTA-OLIVERA] payload il·legible (${e.message}); cap comprovació executada.`);
    result = { code: 0, errors: [] };
  }

  if (result.errors.length) {
    console.error(`[PORTA-OLIVERA] BLOQUEIG · ${result.file}\n${result.errors.map((e) => `- ${e}`).join('\n')}\nLa Reunió a l'Olivera comença amb la taula classificada i el Pla damunt.`);
  }
  process.exitCode = result.code;
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { main(); } catch (e) { console.error(e.message); process.exitCode = 0; }
}
