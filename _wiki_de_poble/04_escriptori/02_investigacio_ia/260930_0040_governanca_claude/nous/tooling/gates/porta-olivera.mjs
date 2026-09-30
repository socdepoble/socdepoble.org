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
 *    1. L'Escriptori està net (`checkTaula`, la definició única d'AGENTS §0.1):
 *       cap prompt, auditoria, pla o bundle consumit de jornades anteriors solt
 *       damunt la taula, la Safata d'Entrada buida, cada document ancorat a
 *       l'índex i cap àncora a un document absent.
 *    2. Hi ha un Pla d'Implementació d'aquesta jornada: la pissarra compartida
 *       existix abans de convocar ningú.
 *    3. La petorreta porta la secció 0 i cap casella sense marcar. La secció es
 *       pot dir «0. Abans de generar» o «0. Preflight», que és el nom que du la
 *       plantilla `prompt_local.md`: un prompt fet bé des de la plantilla no pot
 *       quedar bloquejat pel nom de la capçalera.
 *
 *  Viu per declaració, no per data (260930). A les 00:00 el rellotge convertia en
 *  brossa el prompt que s'estava executant. Ara decidix qui treballa: tot document
 *  llistat davall d'una capçalera «## Activitat en curs» de l'índex continua viu,
 *  siga del dia que siga, i `ranci()` no el toca. La tria és explícita i
 *  auditable: l'informe la mostra sencera.
 *
 *  L'informe (`npm run porta:olivera`) jutja la taula, no la petorreta: ix amb 0
 *  quan `checkTaula` és vàlid. El «pla de hui» només té sentit quan s'escriu una
 *  petorreta, i per això el demana el hook i no l'informe; si no, un Escriptori
 *  acabat de netejar al matí no passaria mai abans del primer pla.
 *
 *  No esborra res mai. `--arxiva` mou a `90_arxiu_historic/` i despenja les
 *  entrades de l'índex, i és una ordre explícita: AGENTS §5 prohibix l'esborrat
 *  automàtic i el trasllat silenciós d'allò que encara pot estar viu.
 *
 *  Ús:
 *    porta-olivera.mjs [--informe]          # auditoria de l'Escriptori (eixida 1 si brut); mai llig stdin
 *    porta-olivera.mjs --hook               # hook: llig el payload per stdin
 *    porta-olivera.mjs --arxiva [--sec]     # mou els consumits de jornades anteriors
 *    porta-olivera.mjs --arxiva --nom F.md [--nom G.md] [--sec]
 *                                           # mou documents de torn concrets, també d'avui
 *
 *  El mode hook és explícit: sense bandera, `readFileSync(0)` esperava un EOF que
 *  un terminal (o un pipe que ningú tanca) no envia mai, i la porta es penjava
 *  just quan la skill manava executar-la.
 */
import { CAMINS } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import tty from 'node:tty';
import { pathToFileURL } from 'node:url';

export const ARREL = process.env.SDP_ARREL || process.cwd();
const ESCRIPTORI = CAMINS.escriptori;
const ARXIU = CAMINS.arxiuHistoric;
const INDEX = CAMINS.indexEscriptori;

/** Categories de treball d'un torn: naixen, servixen i se'n van a l'arxiu. */
export const TRANSITORIES = /^(prompt|macro_prompt|micro_prompt|petorreta|auditoria|informe|bundle|macro_bundle|micro_bundle|pla|acta|tasques)$/;

const NOM = /^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.md$/;

/** Capçalera que declara vius els documents que llista. N'hi pot haver més d'una, amb sufix. */
const ACTIVITAT = /^##[ \t]+Activitat en curs[^\n]*\n([\s\S]*?)(?=^##[ \t]|(?![\s\S]))/gm;

/** Secció 0 d'una petorreta: el nom de les proves antigues i el de la plantilla viva. */
const SECCIO_ZERO = /^##[ \t]+0\.[ \t]+(?:Abans de generar|Preflight)[^\n]*\n([\s\S]*?)(?=^#{1,2}[ \t]+|(?![\s\S]))/m;

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

/**
 * Noms (sense `.md`) que l'índex declara vius davall de qualsevol «## Activitat en
 * curs». Només compten les àncores planes, com a `ancoratge()`: una àncora amb `/`
 * apunta fora del primer nivell i no pot protegir cap document de la taula.
 */
export function vius(arrel = ARREL) {
  const p = path.join(arrel, INDEX);
  const text = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  const noms = new Set();
  for (const bloc of text.matchAll(ACTIVITAT)) {
    for (const a of bloc[1].matchAll(/\[\[([^\]|#]+)/g)) {
      const nom = a[1].trim();
      if (nom && !nom.includes('/')) noms.add(nom.replace(/\.md$/, ''));
    }
  }
  return noms;
}

/** El que hauria d'estar a l'arxiu: categoria de torn, data anterior a hui i cap declaració de viu. */
export function ranci(arrel = ARREL, dia = avui()) {
  const viu = vius(arrel);
  return inventari(arrel).filter((d) => TRANSITORIES.test(d.categoria) && d.data < dia && !viu.has(d.nom.replace(/\.md$/, '')));
}

/** Pissarra compartida d'aquesta jornada. */
export function plaDeHui(arrel = ARREL, dia = avui()) {
  return inventari(arrel).filter((d) => /^pla_implementacio(?:_|$)/.test(d.resta) && d.data === dia);
}

/**
 * Elements de la Safata d'Entrada, que ha d'estar sempre buida (AGENTS §12). La
 * carpeta es busca sense distingir caixa: el codi en conserva `00_Bandeja_d_Entrada`
 * i el disc du `00_bandeja_d_entrada`, i a Linux una comparació exacta no la veuria.
 */
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

/**
 * Escriptori net: la definició única (AGENTS §0.1) i el que jutja l'informe.
 * Brossa, Safata i àncores; el «pla de hui» no hi entra, és cosa de la petorreta.
 */
export function checkTaula(arrel = ARREL, { dia = avui() } = {}) {
  const errors = [];

  const bruts = ranci(arrel, dia);
  if (bruts.length) {
    errors.push(`Escriptori sense classificar: ${bruts.length} document(s) de jornades anteriors encara damunt la taula (${bruts.map((d) => d.nom).join(', ')}). Arxiva'ls amb: node tooling/gates/porta-olivera.mjs --arxiva, o declara'ls vius davall de «## Activitat en curs» a ${INDEX}`);
  }

  const bustia = safata(arrel);
  if (bustia.elements.length) {
    errors.push(`Safata d'entrada amb ${bustia.elements.length} element(s) (${bustia.carpeta}: ${bustia.elements.slice(0, 5).join(', ')}${bustia.elements.length > 5 ? '…' : ''}). La Safata s'ha de buidar sempre (AGENTS §12).`);
  }

  const anc = ancoratge(arrel);
  if (anc.senseAncora.length) errors.push(`Sense àncora a l’índex: ${anc.senseAncora.join(', ')}`);
  if (anc.fantasma.length) errors.push(`Àncores a documents absents: ${anc.fantasma.join(', ')}`);

  return { valid: errors.length === 0, errors };
}

/** Les tres comprovacions de la transició Pla → Petorreta: la taula, el pla i la secció 0. */
export function checkOlivera(arrel = ARREL, { contingut = null, dia = avui() } = {}) {
  const errors = [...checkTaula(arrel, { dia }).errors];

  if (!plaDeHui(arrel, dia).length) {
    errors.push(`Cap Pla d'Implementació de hui (${dia}) a l'Escriptori. Les altres IAs arriben a una habitació sense pissarra. Genera'l abans: node tooling/wiki/document.mjs context --turn-id ID --route pla.implementacio --file ${ESCRIPTORI}/${dia}_HHMM_pla_implementacio_COGNOM.md`);
  }

  if (typeof contingut === 'string') {
    const section = SECCIO_ZERO.exec(contingut);
    if (!section) {
      errors.push("La petorreta no porta la secció 0: «0. Abans de generar (per a l'autor, no per al destinatari)» o «0. Preflight», com la plantilla prompt_local.md. És la precondició d'higiene i ha de viatjar dins del document, no a la memòria de qui l'escriu.");
    } else if (/^[ \t]*[-*+][ \t]+\[[ \t]\]/m.test(section[1])) {
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
  if (!payload || typeof payload !== 'object' || !payload.tool_name || (!payload.tool_input && !payload.toolArgs)) return {code: 2, errors: ['Payload de hook incomplet']};
  const { dialecte, fitxer, contingut } = rutaIContingut(payload);
  if (!fitxer) {
    const reads = ['Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code'];
    return reads.includes(payload.tool_name) ? {code: 0, errors: []} : {code: 2, errors: ['Hook sense destí verificable; usa hooks-local per a shell i eines no documentals']};
  }
  const rel = path.isAbsolute(fitxer) ? path.relative(arrel, fitxer) : fitxer;
  if (!esPetorreta(rel)) return { code: 0, errors: [] };
  if (typeof contingut !== 'string') return {code: 2, errors: ['Petorreta sense contingut complet verificable; usa escriptura documental explícita'], file: rel};
  const r = checkOlivera(arrel, { contingut });
  return { code: r.valid ? 0 : (dialecte === 'claude' ? 2 : 1), errors: r.errors, file: rel };
}

/* ── Arxivat explícit ─────────────────────────────────────────────────────── */

/**
 * Què mouria `--arxiva`. Sense noms: els rancis (jornades anteriors, no declarats
 * vius). Amb noms: exactament eixos documents, també d'avui. Cada nom es valida
 * abans de moure res, i un sol nom dolent atura el lot sencer: subcarpetes, noms
 * que no són a la taula i categories que no són de torn. L'índex, els recursos i
 * les notes es queden on són, i per nom tampoc ixen.
 */
export function arxivables(arrel = ARREL, { noms = [], dia = avui() } = {}) {
  if (!noms.length) return ranci(arrel, dia);
  const inv = inventari(arrel);
  const triats = [];
  for (const cru of noms) {
    const pla = String(cru).split('\\').join('/').replace(/^\.\//, '');
    const solt = pla.startsWith(`${ESCRIPTORI}/`) ? pla.slice(ESCRIPTORI.length + 1) : pla;
    if (!solt || solt.includes('/')) {
      throw new Error(`--nom ${cru}: només s'arxiven per nom documents solts del primer nivell de ${ESCRIPTORI}; les subcarpetes (Safata, 01_produccio, 02_investigacio_ia) queden fora`);
    }
    const nom = solt.endsWith('.md') ? solt : `${solt}.md`;
    const d = inv.find((x) => x.nom === nom);
    if (!d) throw new Error(`--nom ${cru}: no és cap document solt de ${ESCRIPTORI} amb nom aammdd_hhmm_categoria_titol.md`);
    if (!TRANSITORIES.test(d.categoria)) {
      throw new Error(`--nom ${cru}: la categoria «${d.categoria}» no és de torn; per nom només ixen prompts, petorretes, auditories, informes, bundles, plans, actes i tasques`);
    }
    if (!triats.includes(d)) triats.push(d);
  }
  return triats;
}

/** Trasllat a l'arxiu. Amb `sec` només respon què faria: cap fitxer mogut ni índex tocat. */
export function arxiva(arrel = ARREL, { noms = [], sec = false, dia = avui() } = {}) {
  const bruts = arxivables(arrel, { noms, dia });
  if (!bruts.length) return { moguts: [], index: false, sec };
  const desti = path.join(arrel, ARXIU);

  if (sec) {
    const moguts = bruts.map((d) => ({ ...d, nota: fs.existsSync(path.join(desti, d.nom)) ? 'simulació: ja existix a l’arxiu; no es mouria' : 'simulació: es mouria' }));
    return { moguts, index: false, sec };
  }

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
  return { moguts, index: tocat, sec };
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */

const US = 'Ús: porta-olivera.mjs [--informe] | --hook | --arxiva [--nom FITXER.md]... [--sec]';

/** Banderes de la línia d'ordres. Una bandera desconeguda no es llig com a informe: falla. */
function opcions(argv) {
  const o = { informe: false, hook: false, arxiva: false, sec: false, noms: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--informe') o.informe = true;
    else if (a === '--hook') o.hook = true;
    else if (a === '--arxiva') o.arxiva = true;
    else if (a === '--sec') o.sec = true;
    else if (a === '--nom' || a.startsWith('--nom=')) {
      const valor = a === '--nom' ? argv[++i] : a.slice('--nom='.length);
      if (!valor || valor.startsWith('--')) throw new Error(`--nom necessita el nom d'un document. ${US}`);
      o.noms.push(valor);
    } else throw new Error(`Argument desconegut: ${a}. ${US}`);
  }
  if ([o.informe, o.hook, o.arxiva].filter(Boolean).length > 1) throw new Error(`Tria un sol mode. ${US}`);
  if ((o.noms.length || o.sec) && !o.arxiva) throw new Error(`--nom i --sec només valen amb --arxiva. ${US}`);
  return o;
}

function informe(arrel, dia = avui()) {
  const docs = inventari(arrel);
  const presents = new Set(docs.map((d) => d.nom.replace(/\.md$/, '')));
  const viu = [...vius(arrel)].filter((n) => presents.has(n)).sort();
  const bruts = ranci(arrel, dia);
  const bustia = safata(arrel);
  const anc = ancoratge(arrel);
  const pla = plaDeHui(arrel, dia);
  console.log(`[Porta Olivera] Escriptori: ${docs.length} documents solts.`);
  console.log(viu.length
    ? `🌿 Declarats vius a «## Activitat en curs» (es conserven): ${viu.join(', ')}`
    : '🌿 Cap document de la taula declarat viu a «## Activitat en curs».');
  if (bruts.length) {
    console.log(`❌ ${bruts.length} de jornades anteriors sense declarar vius (han d'anar a ${ARXIU}/):`);
    for (const d of bruts) console.log(`   · ${d.nom}`);
  } else console.log('✅ Cap document consumit de jornades anteriors.');
  console.log(bustia.elements.length ? `❌ Safata d'entrada amb ${bustia.elements.length} element(s): ${bustia.elements.join(', ')}` : "✅ Safata d'entrada buida.");
  if (anc.senseAncora.length) console.log(`❌ Sense àncora a l'índex: ${anc.senseAncora.join(', ')}`);
  if (anc.fantasma.length) console.log(`❌ Àncores a documents absents (fan caure la porta): ${anc.fantasma.join(', ')}`);
  console.log(pla.length
    ? `ℹ️ Pla d'Implementació de hui: ${pla.map((d) => d.nom).join(', ')}`
    : "ℹ️ Cap Pla d'Implementació de hui: el demana l'escriptura d'una petorreta, no l'Escriptori net.");
  return checkTaula(arrel, { dia }).valid ? 0 : 1;
}

function main(argv = process.argv.slice(2)) {
  const o = opcions(argv);
  const arrel = ARREL;

  if (o.arxiva) {
    const r = arxiva(arrel, { noms: o.noms, sec: o.sec });
    if (o.sec) console.log('[Porta Olivera] Simulació (--sec): no es mou cap fitxer ni es toca l’índex.');
    if (!r.moguts.length) console.log('[Porta Olivera] Res a arxivar.');
    for (const m of r.moguts) console.log(`   · ${m.nom} → ${ARXIU}/ (${m.nota})`);
    if (r.index) console.log(`   · ${INDEX} actualitzat.`);
    if (r.moguts.some((m) => m.nota === 'mogut')) console.log('   Si algun portava rebut de torn: node tooling/wiki/document.mjs handoff --turn-id ID --file ORIGEN --to DESTÍ');
    process.exitCode = 0;
    return;
  }

  if (!o.hook) { process.exitCode = informe(arrel); return; }

  // Mode hook: sense payload no hi ha res a jutjar, i no es pot fingir un verd.
  if (tty.isatty(0)) {
    console.error('[PORTA-OLIVERA] --hook espera el payload JSON per stdin; des d’un terminal usa el mode informe (sense bandera).');
    process.exitCode = 2;
    return;
  }
  const raw = fs.readFileSync(0, 'utf8');
  if (!raw.trim()) {
    console.error('[PORTA-OLIVERA] --hook amb payload buit; cap comprovació executada.');
    process.exitCode = 2;
    return;
  }

  // Un payload il·legible no acredita cap comprovació: falla tancat.
  let result;
  try { result = checkPayload(JSON.parse(raw), arrel); }
  catch (e) {
    console.error(`[PORTA-OLIVERA] payload il·legible (${e.message}); cap comprovació executada.`);
    result = { code: 2, errors: ['Payload il·legible: cap autorització'] };
  }

  if (result.errors.length) {
    console.error(`[PORTA-OLIVERA] BLOQUEIG · ${result.file ?? '(sense destí)'}\n${result.errors.map((e) => `- ${e}`).join('\n')}\nLa Reunió a l'Olivera comença amb la taula classificada i el Pla damunt.`);
  }
  process.exitCode = result.code;
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { main(); } catch (e) { console.error(e.message); process.exitCode = 2; }
}
