// @vitest-environment node
/** Corredor del laboratori 261009_0400_higiene_claude (Onada 6, front d'higiene: motor de
 *  l'Escriptori net, cron d'higiene i inventari de brossa).
 *
 *  El paquet viu a `02_investigacio_ia/261009_0400_higiene_claude/`: substitucions exactes
 *  sobre els fitxers instal·lats (substitucions.json i PECES.txt) i fitxers nous a nous/ amb
 *  la ruta real. L'aplicarà el Mestre amb executor-mutacio.mjs i una lease. Mentre no
 *  s'aplique, este corredor:
 *    · comprova que el paquet casa amb el disc d'ara (cap deriva) i que prepara-pla.mjs fa un
 *      pla que l'executor valida i una Petorreta que el seal accepta;
 *    · munta a os.tmpdir() un «taller» (tooling/ i scripts/immunitari amb el paquet aplicat)
 *      i hi prova el motor de la porta, el tancament, el despertar, el hook, Plaquetes i el
 *      cron amb Masos de prova;
 *    · separa les reproduccions [DEFECTE] (passen amb el codi instal·lat perquè reproduïxen
 *      el deute) de les reparacions;
 *    · executa amb `node --test` la bateria que depén de les peces tocades en dues còpies del
 *      repositori (base i paquet) i exigix que no hi haja cap fallada nova.
 *  Patró: tests/laboratori-higiene-261006.test.js. Cap prova escriu fora d'os.tmpdir(); de
 *  90_arxiu_historic no es copia res. Fa skip si el laboratori no hi és, si l'executor ja
 *  n'ha deixat la transacció o si tots els fitxers ja són al disc: llavors manen les proves
 *  reals i este corredor es retira. Amb deriva (una altra mà ha tocat un fitxer del paquet
 *  després de preparar-lo) també fa skip, amb un avís que diu quins fitxers i el seu sha:
 *  la deriva es resol refent el paquet, i un `npm test` roig no ho arreglaria.
 */
import { afterAll, describe, expect, test, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_0400_higiene_claude';
const LAB = path.join(REPO, REL_LAB);
const HI_HA_LAB = fs.existsSync(path.join(LAB, 'prepara-pla.mjs'));
const pla = HI_HA_LAB ? await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href) : null;
const sha = (valor) => createHash('sha256').update(valor).digest('hex');
const llig = (abs) => fs.readFileSync(abs, 'utf8');
const url = (abs) => pathToFileURL(abs).href;

let ERROR_PAQUET = null;
let SUBST = [];
let NOUS = [];
let ESTAT = [];
if (HI_HA_LAB) {
  try {
    SUBST = pla.substitucions();
    NOUS = pla.fitxersNous();
    ESTAT = pla.estat(REPO, { subst: SUBST });
  } catch (error) { ERROR_PAQUET = error; }
}
const TRANSACCIO = HI_HA_LAB ? pla.transaccio(REPO) : null;
const APLICAT = HI_HA_LAB && !ERROR_PAQUET && ESTAT.length > 0 && ESTAT.every((f) => f.estat === 'aplicat');
const DERIVA = ESTAT.filter((f) => f.estat === 'deriva' || f.estat === 'deriva-base');
const ACTIU = HI_HA_LAB && !TRANSACCIO && !APLICAT && !DERIVA.length;
/** Paquet de la Consola d'esta Onada (G4 i G5): la coordinació només es prova mentre hi siga. */
const CONSOLA = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_0400_consola_claude/nous/substitucions.json');
const deLaConsola = (ruta) => (fs.existsSync(CONSOLA) ? JSON.parse(fs.readFileSync(CONSOLA, 'utf8')).fitxers.find((f) => f.ruta === ruta) ?? null : null);
const G4 = deLaConsola('.agents/skills/core-higiene-escriptori/SKILL.md');
const G5 = deLaConsola('.agents/skills/sdp-clon-loiverse/SKILL.md');

test.runIf(HI_HA_LAB && !TRANSACCIO && !APLICAT && DERIVA.length > 0)('laboratori 261009_0400_higiene_claude: deriva, el corredor fa skip i ho diu', () => {
  const detall = DERIVA.map((f) => `${f.ruta}: ${f.estat} · sha actual ${f.before} · ${f.motiu ?? ''}`).join('\n');
  console.warn(`[laboratori higiene 261009] Deriva: refés el paquet (substitucions.json) o aplica'l amb --sobre-base-nova si el Mestre ho veu bé.\n${detall}`);
  expect(DERIVA.length).toBeGreaterThan(0);
});

const DESK = '_wiki_de_poble/04_escriptori';
const INDEX = `${DESK}/00_index_escriptori.md`;
const temporals = [];
afterAll(() => { for (const d of temporals) fs.rmSync(d, { recursive: true, force: true }); });

function nouDir(prefix) {
  const d = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  temporals.push(d);
  return d;
}
function posa(arrel, rel, contingut) {
  fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
  fs.writeFileSync(path.join(arrel, rel), contingut);
}
function copia(desti, rel, { filtre } = {}) {
  if (!fs.existsSync(path.join(REPO, rel))) return;
  fs.mkdirSync(path.dirname(path.join(desti, rel)), { recursive: true });
  fs.cpSync(path.join(REPO, rel), path.join(desti, rel), { recursive: true, verbatimSymlinks: true, filter: filtre });
}
/** Entorn per als processos fills: sense les variables de vitest ni una arrel imposada. */
function entorn(extra = {}) {
  const net = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(?:VITEST|SDP_ARREL$|CLAUDE_PROJECT_DIR$|NODE_OPTIONS$|NODE_ENV$|TEST$)/.test(k)));
  return { ...net, ...extra };
}

/** Aplica el paquet sobre una còpia: substitucions als fitxers que hi són i els fitxers nous. */
function aplicaPaquet(dir) {
  for (const s of SUBST) {
    const abs = path.join(dir, s.ruta);
    if (!fs.existsSync(abs)) continue;
    fs.writeFileSync(abs, pla.aplicaCanvis(llig(abs), s.canvis, s.ruta).text);
  }
  for (const f of NOUS) posa(dir, f.ruta, fs.readFileSync(path.join(pla.NOUS, f.nou)));
}

/** Taller: tooling/ i scripts/immunitari amb el paquet (o sense), el marcador d'arrel i node_modules. */
function taller(prefix, { paquet = true } = {}) {
  const dir = nouDir(prefix);
  const fora = (src) => !/[\\/](?:node_modules|\.DS_Store)$/.test(src);
  // El Mapa de la Consola (tooling/brain/mapa-consola.mjs) importa el seu compilador de src/.
  for (const rel of ['tooling', 'scripts/immunitari', '.agents/AGENTS.md', '.agents/cron/registre_tasques.json', '.immunitari/config.json',
    'src/sections/consola/mapa/construeixMapa.js', 'src/sections/consola/mapa/contracteMapa.js', 'src/sections/consola/concordanca.js']) copia(dir, rel, { filtre: fora });
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  if (paquet) aplicaPaquet(dir);
  return dir;
}

let TALLER = null;
let BASE = null;
const elTaller = () => { TALLER ??= taller('sdp-higiene-261009-taller-'); return TALLER; };
const laBase = () => { BASE ??= taller('sdp-higiene-261009-base-', { paquet: false }); return BASE; };
const modul = (dir, rel) => import(url(path.join(dir, rel)));

/** Mas de prova: Escriptori amb índex, arxiu i, si cal, la bandera de fase i el contracte documental. */
function mas({ activitat = '', altres = '', fase = null, contracte = false } = {}) {
  const arrel = nouDir('sdp-higiene-261009-mas-');
  posa(arrel, '.agents/AGENTS.md', '# marcador\n');
  posa(arrel, INDEX, `---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n\n## Activitat en curs\n\n${activitat}${altres}`);
  fs.mkdirSync(path.join(arrel, '_wiki_de_poble/90_arxiu_historic'), { recursive: true });
  if (fase) posa(arrel, '.agents/olivera-fase.json', `${JSON.stringify({ fase })}\n`);
  if (contracte) {
    const config = JSON.parse(llig(path.join(REPO, '.agents/protocolledge.json')));
    for (const rel of ['.agents/protocolledge.json', 'tooling/wiki/schema.json', ...config.rutes.map((r) => r.plantilla)]) posa(arrel, rel, fs.readFileSync(path.join(REPO, rel)));
    posa(arrel, '.agents/ESTAT.md', '# Estat\n');
    posa(arrel, '.agents/LEDGER.md', '# Ledger\n');
  }
  return arrel;
}
function torn(arrel, { state = 'opened', vigent = true, tocat = 60 } = {}) {
  const id = `torn_${randomUUID()}`;
  const ara = Date.now();
  posa(arrel, `.agents/runtime/turns/${id}.json`, `${JSON.stringify({
    schema: 'sdp.turn.v1', turn_id: id, actor: 'prova', scope: 'documents', state, revision: 0,
    createdAt: new Date(ara - tocat * 60000).toISOString(), updatedAt: new Date(ara - tocat * 60000).toISOString(),
    expiresAt: new Date(ara + (vigent ? 3600000 : -3600000)).toISOString(), receipts: {}, initial: {}, history: [],
  })}\n`);
  if (tocat > 0) { const t = new Date(ara - tocat * 60000); fs.utimesSync(path.join(arrel, `.agents/runtime/turns/${id}.json`), t, t); }
  return id;
}
const PREFLIGHT = "## 0. Preflight (Per a l'agent orquestrador)";
const prompt0 = (seccio, creacio = '2026-10-09T00:30:00.000Z') => `---\ntype: prompt\nstatus: esborrany\ndescription: Prompt de prova\n---\n# Prompt\n\n${PREFLIGHT}\n\n${seccio}\n\n## Registre\n\n| Camp | Valor |\n| --- | --- |\n| Creació | ${creacio} |\n`;
const pla0 = ({ estat = 'aprovat', verificacio = 'Proves del front.', riscos = 'Cap de nou.', creacio = '2026-10-09T00:20:00.000Z' } = {}) => `---\ntype: document\nstatus: esborrany\ndescription: Pla de prova\n---\n# Pla\n\n**Estat del Pla:** ${estat}\n\n## Registre\n\n| Camp | Valor |\n| --- | --- |\n| Creació | ${creacio} |\n\n<!-- SDP:SECTION pla.implementacio.s5 -->\n## Verificació\n\n${verificacio}\n\n<!-- SDP:SECTION pla.implementacio.s6 -->\n## Riscos\n\n${riscos}\n\n## Vincles\n\n- [[00_index]]\n`;
const codis = (r) => r.troballes.map((t) => t.codi).sort();

describe.skipIf(!ACTIU)('laboratori 261009_0400_higiene_claude', () => {
  /* ── El paquet ──────────────────────────────────────────────────────────── */

  test('el paquet es llig sencer: cada peça citada existix, cap peça sobra i cap fitxer és .md', () => {
    expect(ERROR_PAQUET?.message ?? null).toBeNull();
    const peces = pla.llegeixPeces();
    const dades = JSON.parse(llig(pla.SUBSTITUCIONS));
    const citades = new Set(dades.fitxers.flatMap((f) => f.canvis.flatMap((c) => [c.peca, c.abansPeca].filter(Boolean))));
    expect([...citades].filter((n) => !peces.has(n))).toEqual([]);
    expect([...peces.keys()].filter((n) => !citades.has(n))).toEqual([]);
    const tots = [];
    (function recorre(rel) {
      for (const e of fs.readdirSync(path.join(LAB, rel), { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) recorre(r); else tots.push(r);
      }
    })('');
    expect(tots.filter((f) => /\.md$/i.test(f))).toEqual([]);
    expect(tots.filter((f) => !/\.(?:txt|mjs|json)$/.test(f) && path.basename(f) !== '.DS_Store')).toEqual([]);
  });

  test('cada fitxer del paquet és pendent sobre la base fixada (cap deriva) i els nous no existixen', () => {
    const deriva = ESTAT.filter((f) => f.estat !== 'pendent').map((f) => `${f.ruta}: ${f.estat} · ${f.motiu ?? ''} · sha actual ${f.before}`);
    expect(deriva, deriva.join('\n')).toEqual([]);
    expect(ESTAT.map((f) => f.ruta).sort()).toEqual([...SUBST.map((s) => s.ruta), ...NOUS.map((f) => f.ruta)].sort());
    // Deriva de veres: una base falsa, o un ancoratge que ja no hi és, no entren mai al pla.
    const falses = SUBST.map((s) => (s.bases === null ? s : { ...s, bases: ['0'.repeat(64)] }));
    expect(pla.estat(REPO, { subst: falses }).filter((f) => f.estat === 'deriva-base').map((f) => f.ruta).sort())
      .toEqual(SUBST.filter((s) => s.bases !== null).map((s) => s.ruta).sort());
    const trencat = [{ ...SUBST[0], canvis: [{ motiu: 'ancoratge absent', alternatives: [{ abans: 'açò no és al fitxer\n', despres: 'x' }] }] }];
    expect(pla.estat(REPO, { subst: trencat }).find((f) => f.ruta === SUBST[0].ruta).estat).toBe('deriva');
    // Aplicar dues vegades no canvia res: el segon pas ho veu aplicat.
    for (const s of SUBST) {
      const una = pla.aplicaCanvis(llig(path.join(REPO, s.ruta)), s.canvis, s.ruta);
      const dues = pla.aplicaCanvis(una.text, s.canvis, s.ruta);
      expect(dues.fets, s.ruta).toBe(0);
      expect(dues.text, s.ruta).toBe(una.text);
    }
  });

  test.skipIf(!G4)('coordinació amb el paquet de la Consola (261009_0400_consola_claude, G4): si la seua description entra primer, este paquet encara s’aplica', () => {
    const ruta = '.agents/skills/core-higiene-escriptori/SKILL.md';
    let text = llig(path.join(REPO, ruta));
    for (const c of G4.canvis) if (text.includes(c.abans)) text = text.replace(c.abans, () => c.despres);
    const copia = nouDir('sdp-higiene-261009-consola-');
    posa(copia, ruta, text);
    const nostra = SUBST.filter((s) => s.ruta === ruta);
    const [e] = pla.estat(copia, { subst: nostra, nous: nouDir('sdp-higiene-261009-buit-') });
    expect(e.estat, `${e.motiu ?? ''} · sha amb la G4 ${sha(text)}`).toBe('pendent');
    expect(pla.aplicaCanvis(text, nostra[0].canvis, ruta).text).toBe(pla.mostra(REPO, ruta));
  });

  test('prepara-pla.mjs: pla que l’executor valida, Petorreta que el seal accepta i manifest sense dades sensibles', async () => {
    const { plan, targets, avisos } = await pla.preparaPla(REPO);
    expect(plan.schema).toBe('sdp.mutation.v1');
    expect(plan.operationId.startsWith(pla.OPERACIO)).toBe(true);
    const propis = targets.filter((t) => !pla.PROJECCIONS.includes(t));
    expect(propis.sort()).toEqual(ESTAT.map((f) => f.ruta).sort());
    if (avisos.length) expect(targets.filter((t) => pla.PROJECCIONS.includes(t))).toEqual([]);
    for (const f of plan.files.filter((x) => !pla.PROJECCIONS.includes(x.path))) {
      const e = ESTAT.find((x) => x.ruta === f.path);
      expect(f.before, f.path).toBe(e.before);
      expect(f.content, f.path).toBe(e.contingut);
    }
    const { validatePetorreta } = await import(url(path.join(REPO, 'tooling/wiki/reflex_petorreta.mjs')));
    for (const [nom, fase] of [[pla.NOM_PETORRETA, false], [pla.NOM_PETORRETA_FASE, true]]) {
      const text = pla.construeixPetorreta({ sessio: pla.SESSIO_ZERO, intentSha256: '0'.repeat(64), rulesSha256: '0'.repeat(64), planSha256: '0'.repeat(64), targets, fase });
      expect(validatePetorreta(path.join(REPO, '.sdp-reflex/bootstrap/x', nom), text), nom).toEqual([]);
      expect(pla.sensibles(text), nom).toEqual([]);
    }
    const fonts = JSON.parse(pla.manifest()).sources;
    for (const f of fonts) expect(fs.existsSync(path.join(REPO, f.path)), f.path).toBe(true);
    expect([...pla.sensibles(pla.manifest()), ...fonts.flatMap((f) => pla.sensibles(llig(path.join(REPO, f.path))))]).toEqual([]);
    // La fase 2 només es pot preparar quan la bandera ja diu «avis».
    await expect(pla.preparaFaseBloqueig(REPO, { validar: false })).rejects.toThrow(/no hi és|ja diu|diu/);
    const t = elTaller();
    const fase = await pla.preparaFaseBloqueig(t, { validar: false });
    expect(fase.targets).toEqual([pla.BANDERA]);
    expect(JSON.parse(fase.plan.files[0].content).fase).toBe('bloqueig');
  }, 120000);

  test('el codi nou passa node --check i l’ESLint del repositori sense missatges nous', async () => {
    const t = elTaller();
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({ cwd: REPO });
    const missatges = async (text, rel) => (await eslint.lintText(text, { filePath: path.join(REPO, rel) }))[0].messages
      .map((m) => `${rel}:${m.line} ${m.severity === 2 ? 'error' : 'avís'} ${m.ruleId} ${m.message}`);
    const problemes = [];
    const generats = nouDir('sdp-higiene-261009-check-');
    for (const s of SUBST.filter((x) => /\.m?js$/.test(x.ruta))) {
      const nou = pla.mostra(REPO, s.ruta);
      const copiaNova = path.join(generats, s.ruta);
      posa(generats, s.ruta, nou);
      const r = spawnSync(process.execPath, ['--check', copiaNova], { encoding: 'utf8' });
      if (r.status !== 0) problemes.push(`${s.ruta}: ${r.stderr}`);
      const ara = await missatges(nou, s.ruta);
      const abans = await missatges(llig(path.join(REPO, s.ruta)), s.ruta);
      problemes.push(...ara.filter((m) => / error /.test(m)));
      if (ara.length > abans.length) problemes.push(`${s.ruta}: avisos nous\n${ara.join('\n')}`);
    }
    for (const f of NOUS.filter((x) => x.ruta.endsWith('.mjs'))) {
      const r = spawnSync(process.execPath, ['--check', path.join(t, f.ruta)], { encoding: 'utf8' });
      if (r.status !== 0) problemes.push(`${f.ruta}: ${r.stderr}`);
      problemes.push(...await missatges(llig(path.join(t, f.ruta)), f.ruta));
    }
    for (const rel of [`${REL_LAB}/prepara-pla.mjs`, 'tests/laboratori-higiene-261009.test.js']) problemes.push(...await missatges(llig(path.join(REPO, rel)), rel));
    expect(problemes).toEqual([]);
  }, 180000);

  test('les skills: frontmatter vàlid, description ≤ 220 sense «: », lliçons intactes, Vincles al final i cap ordre d’esborrar', async () => {
    const t = elTaller();
    const { parseFrontmatter } = await import(url(path.join(REPO, 'tooling/wiki/lib/frontmatter.mjs')));
    const { validarFrontmatter } = await import(url(path.join(REPO, 'tooling/wiki/entropia_zero_router.mjs')));
    const nova = (nom) => pla.mostra(REPO, `.agents/skills/${nom}/SKILL.md`);
    const ara = (nom) => llig(path.join(REPO, `.agents/skills/${nom}/SKILL.md`));
    const errorsFm = (text) => { const p = parseFrontmatter(text); return [...p.errors, ...(p.hasFrontmatter ? validarFrontmatter(p.data) : ['sense frontmatter'])]; };
    const llicons = (text) => (/## Lliçons del Mestre\n([\s\S]*?)\n## /.exec(text) ?? [null, ''])[1];

    const higiene = nova('core-higiene-escriptori');
    expect(errorsFm(higiene)).toEqual([]);
    const fm = parseFrontmatter(higiene).data;
    expect(fm.version).toBe('4.0.0');
    expect([...fm.description].length).toBeLessThanOrEqual(220);
    expect(fm.description).not.toMatch(/: /);
    expect(llicons(higiene)).toBe(llicons(ara('core-higiene-escriptori')));
    expect(higiene.endsWith('## Vincles\n- [[00_INDEX_SKILLS]]\n')).toBe(true);
    for (const tros of ['## Procediment: Convocatòria (Onada nova)', '· per a [[consumidor]]', 'torn_ID', 'Mestre aammdd: motiu', '.agents/olivera-fase.json', 'mateix HHMM', '[pendent]']) expect(higiene).toContain(tros);
    expect(higiene).not.toMatch(/amb la seua àncora sola a la línia/);

    const reflex = nova('wiki-documentacio-i-reflex');
    const reflexAra = ara('wiki-documentacio-i-reflex');
    expect(errorsFm(reflex).length).toBeLessThanOrEqual(errorsFm(reflexAra).length);
    const afegides = reflex.split('\n').filter((l) => !reflexAra.split('\n').includes(l));
    expect(afegides).toHaveLength(1);
    expect(afegides[0]).toMatch(/^- \*\*261009\*\* \| \*\*Les tasques de l'Onada següent naixen al seu pla\*\*: /);
    expect(reflex.replace(`${afegides[0]}\n`, '')).toBe(reflexAra);

    const wp = nova('core-empaquetat-wp');
    expect(errorsFm(wp).length).toBeLessThanOrEqual(errorsFm(ara('core-empaquetat-wp')).length);
    expect(wp).not.toMatch(/01_produccio\/builds/);
    expect(wp).not.toMatch(/rm -rf/);
    for (const tros of ['## 4. Retenció', 'stable.json', '--l2 --confirma CODI', '## Vincles\n- [[00_INDEX_SKILLS]]']) expect(wp).toContain(tros);
    expect(wp.endsWith('\n')).toBe(ara('core-empaquetat-wp').endsWith('\n'));
    expect(t).toBeTruthy();

    // Còpies de lectura de les tres skills finals (lectura/NOM.SKILL.md.txt): el Mestre les llig
    // sense executar node. Han de ser el que deixarà el paquet, llevat dels espais en blanc al final
    // de línia (l'editor d'esta sessió no els conserva; el paquet aplica PECES.txt, no estes còpies).
    // Si no quadren, es tornen a copiar de os.tmpdir()/sdp-laboratori-higiene-261009-lectura/.
    const senseFinals = (text) => (text === null ? null : text.replace(/[ \t]+$/gm, ''));
    const generades = path.join(os.tmpdir(), 'sdp-laboratori-higiene-261009-lectura');
    try { fs.mkdirSync(generades, { recursive: true }); } catch { /* només és una ajuda */ }
    const SKILLS = ['core-higiene-escriptori', 'wiki-documentacio-i-reflex', 'core-empaquetat-wp'];
    for (const nom of SKILLS) {
      try { fs.writeFileSync(path.join(generades, `${nom}.SKILL.md.txt`), nova(nom)); } catch { /* només és una ajuda */ }
    }
    for (const nom of SKILLS) {
      const copia = path.join(LAB, 'lectura', `${nom}.SKILL.md.txt`);
      expect(senseFinals(fs.existsSync(copia) ? llig(copia) : null), `${nom}: còpia de lectura desfasada`).toBe(senseFinals(nova(nom)));
    }
  });

  test('el registre de tasques: JSON vàlid, cap tasca d’abans retocada, higiene-diaria declarada i refresc-tokens retirada amb motiu', () => {
    const abans = JSON.parse(llig(path.join(REPO, '.agents/cron/registre_tasques.json')));
    const ara = JSON.parse(pla.mostra(REPO, '.agents/cron/registre_tasques.json'));
    // fatiga-261002 exigix que cap tasca del commit base es perda ni es retoque.
    for (const tasca of abans.tasques) expect(ara.tasques.find((x) => x.id === tasca.id), tasca.id).toEqual(tasca);
    const diaria = ara.tasques.find((x) => x.id === 'higiene-diaria');
    expect(diaria.llancador).toEqual({ tipus: 'launchd', etiqueta: 'org.socdepoble.higiene' });
    expect(diaria.script).toBe('tooling/higiene/cron_higiene.mjs');
    expect(diaria.cadencia.cada_segons).toBe(86400);
    expect(ara.plaquetes.find((x) => x.id === 'higiene-basica').llancador).toEqual({ tipus: 'tasca', tasca: 'higiene-diaria' });
    expect(ara.plaquetes.some((x) => x.id === 'refresc-tokens')).toBe(false);
    expect(ara.retirades).toEqual([expect.objectContaining({ id: 'refresc-tokens', data: '261009', motiu: expect.stringMatching(/getNivell/) })]);
    // higiene-basica porta l'script que l'executa (el nivell L1 del cron): la Consola no la pinta «desconegut» amb la mare viva.
    expect(ara.plaquetes.find((x) => x.id === 'higiene-basica').script).toBe('tooling/higiene/cron_higiene.mjs');
    // El plist que el llança diu el mateix.
    const plist = llig(path.join(pla.NOUS, 'scripts/immunitari/org.socdepoble.higiene.plist.txt'));
    expect(plist).toMatch(/<string>org\.socdepoble\.higiene<\/string>/);
    expect(plist).toMatch(/<string>tooling\/higiene\/cron_higiene\.mjs<\/string>\s*<string>--aplica<\/string>/);
    expect(plist).toMatch(/<key>Hour<\/key>\s*<integer>5<\/integer>\s*<key>Minute<\/key>\s*<integer>30<\/integer>/);
    expect(JSON.parse(llig(path.join(pla.NOUS, '.agents/olivera-fase.json'))).fase).toBe('avis');
    const pkg = JSON.parse(pla.mostra(REPO, 'package.json'));
    expect(pkg.scripts['higiene:cron']).toBe('node tooling/higiene/cron_higiene.mjs');
    expect(pla.mostra(REPO, '.gitignore')).toMatch(/^\.immunitari\/receptes\/$/m);
  });

  const PLIST = () => llig(path.join(pla.NOUS, 'scripts/immunitari/org.socdepoble.higiene.plist.txt'));

  test('[DEFECTE] el Mapa de la Consola instal·lat no llig cap interval d’un StartCalendarInterval: el cron quedaria «desconegut» per sempre', async () => {
    const { llegeixPlist } = await modul(laBase(), 'tooling/brain/mapa-consola.mjs');
    expect(llegeixPlist(PLIST())).toMatchObject({ etiqueta: 'org.socdepoble.higiene', interval: null });
  });

  test('reparació: el Mapa llig el període d’un StartCalendarInterval (dict o llista) i conserva StartInterval', async () => {
    const { llegeixPlist } = await modul(elTaller(), 'tooling/brain/mapa-consola.mjs');
    expect(llegeixPlist(PLIST())).toMatchObject({ etiqueta: 'org.socdepoble.higiene', interval: 86400, enArrencar: false, keepAlive: false });
    const dict = (claus) => `<dict>${Object.entries(claus).map(([k, v]) => `<key>${k}</key><integer>${v}</integer>`).join('')}</dict>`;
    const cal = (cos) => llegeixPlist(`<key>Label</key><string>org.x</string><key>StartCalendarInterval</key>${cos}`).interval;
    expect(cal(dict({ Weekday: 1, Hour: 3, Minute: 0 }))).toBe(7 * 86400);
    expect(cal(dict({ Day: 1, Hour: 3 }))).toBe(31 * 86400);
    expect(cal(dict({ Minute: 15 }))).toBe(3600);
    expect(cal(`<array>${dict({ Weekday: 1, Hour: 3 })}${dict({ Hour: 12, Minute: 0 })}</array>`)).toBe(86400);
    expect(llegeixPlist('<key>Label</key><string>org.x</string><key>StartInterval</key><integer>3600</integer><key>RunAtLoad</key><true/>')).toMatchObject({ interval: 3600, enArrencar: true });
    expect(llegeixPlist('<key>Label</key><string>org.x</string>').interval).toBeNull();
  });

  test('reparació: prepara-pla.mjs «comprova --fase» és el flux de lease de la fase 2, amb el paquet ja aplicat', async () => {
    const t = elTaller();
    const linies = [];
    const espia = vi.spyOn(console, 'log').mockImplementation((...a) => { linies.push(a.join(' ')); });
    try { await pla.main(['comprova', '--fase'], { root: t }); }
    finally { espia.mockRestore(); }
    const text = linies.join('\n');
    expect(text).toMatch(/^Pla vàlid: 1 fitxers/m);
    expect(text).toMatch(/^ {2}M \.agents\/olivera-fase\.json$/m);
    expect(text).toContain(`--intent="${pla.INTENT_FASE}"`);
    expect(text).toContain('--scope=.agents/olivera-fase.json');
    // Sense la bandera al disc (el paquet encara no s'ha aplicat), la fase 2 no es pot preparar.
    await expect(pla.main(['comprova', '--fase'], { root: REPO })).rejects.toThrow(/no hi és/);
  }, 60000);

  /* ── Motor de l'Escriptori net (porta Olivera v4) ─────────────────────────── */

  test('[DEFECTE] la porta instal·lada: àncora repetida, viu sense motiu d’abans de hui, secció 0 en [pendent] i pla nascut després passen', async () => {
    const instal = await modul(laBase(), 'tooling/gates/porta-olivera.mjs');
    const dia = instal.avui();
    const p = `${dia}_0230_prompt_claude_prova.md`;
    const arrel = mas({ activitat: `- [[${dia}_0245_pla_implementacio_prova]]\n- [[${dia}_0245_pla_implementacio_prova]]\n- [[250101_0900_auditoria_vella]]\n` });
    posa(arrel, `${DESK}/${dia}_0245_pla_implementacio_prova.md`, pla0({ estat: '[en elaboració | aprovat | acabat | descartat]', verificacio: '[pendent]' }));
    posa(arrel, `${DESK}/250101_0900_auditoria_vella.md`, '# vella\n');
    expect(instal.checkTaula(arrel).valid).toBe(true);
    expect(instal.checkOlivera(arrel, { contingut: prompt0('[pendent]'), fitxer: `${DESK}/${p}` }).errors).toEqual([]);
    expect(typeof instal.checkConvocatoria).toBe('undefined');
  });

  test('reparació: les mateixes troballes ixen com a avisos en fase «avis» i com a errors en fase «bloqueig»', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const dia = porta.avui();
    const p = `${DESK}/${dia}_0230_prompt_claude_prova.md`;
    const munta = (fase) => {
      const arrel = mas({ fase, activitat: `- [[${dia}_0245_pla_implementacio_prova]]\n- [[${dia}_0245_pla_implementacio_prova]]\n- [[250101_0900_auditoria_vella]]\n` });
      posa(arrel, `${DESK}/${dia}_0245_pla_implementacio_prova.md`, pla0({ estat: '[en elaboració | aprovat | acabat | descartat]', verificacio: '[pendent]' }));
      posa(arrel, `${DESK}/250101_0900_auditoria_vella.md`, '# vella\n');
      return arrel;
    };
    const avis = porta.checkConvocatoria(munta(null), { fitxer: p, contingut: prompt0('[pendent]') });
    expect(avis.fase).toBe('avis');
    expect(avis.errors).toEqual([]);
    expect(codis(avis)).toEqual(['CONV-01', 'CONV-02', 'CONV-02', 'CONV-04', 'CONV-05']);
    expect(avis.avisos.filter((a) => /^\[CONV-0[1-5]\]/.test(a))).toHaveLength(5);
    const bloqueig = porta.checkConvocatoria(munta('bloqueig'), { fitxer: p, contingut: prompt0('[pendent]') });
    expect(bloqueig.fase).toBe('bloqueig');
    expect(bloqueig.errors.map((e) => e.slice(0, 9)).sort()).toEqual(['[CONV-01]', '[CONV-02]', '[CONV-02]', '[CONV-04]', '[CONV-05]']);
    expect(bloqueig.errors.join('\n')).toMatch(/naix després/);
    // checkOlivera (els hooks) porta les mateixes troballes; checkPayload conserva la forma { code, errors, file }.
    expect(porta.checkOlivera(munta(null), { contingut: prompt0('[pendent]'), fitxer: p }).avisos.length).toBeGreaterThan(0);
    const arrel = munta('bloqueig');
    const r = porta.checkPayload({ tool_name: 'Write', tool_input: { file_path: path.join(arrel, p), content: prompt0('[pendent]') } }, arrel);
    expect(Object.keys(r).sort()).toEqual(['code', 'errors', 'file']);
    expect(r.code).toBe(2);
    expect(r.errors.join('\n')).toMatch(/\[CONV-04\]/);
  });

  test('vida justificada: consumidor present, torn obert, retenció del Mestre i rebut implícit sostenen; la resta és rància', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const dia = porta.avui();
    const arrel = mas();
    const obert = torn(arrel);
    const tancat = torn(arrel, { state: 'closed' });
    const caducat = torn(arrel, { vigent: false });
    const d = (n) => `250101_09${n}_auditoria_${n}`;
    for (const n of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']) posa(arrel, `${DESK}/${d(n)}.md`, '# doc\n');
    posa(arrel, `${DESK}/${d('11')}.md`, `---\ntype: informe\nstatus: esborrany\ndescription: Prova del rebut implícit\nreflex: sdp:${obert}:${randomUUID()}\n---\n# rebut\n`);
    posa(arrel, INDEX, `# Índex\n\n## Activitat en curs\n\n${[
      `- [[${d('01')}]] · per a [[${d('02')}]]`,
      `- [[${d('02')}]] · ${obert.slice(0, 13)}`,
      `- [[${d('03')}]] · per a [[../90_arxiu_historic/250101_0999_auditoria_arxivada]]`,
      `- [[${d('04')}]] · ${tancat}`,
      `- [[${d('05')}]] · ${caducat}`,
      `- [[${d('06')}]] · Mestre ${dia}: el llig la Gestoria dilluns`,
      `- [[${d('07')}]] · Mestre 991231: data futura`,
      `- [[${d('08')}]] · perquè sí`,
      `- [[${d('09')}]]`,
      `- [[${d('11')}]]`,
    ].join('\n')}\n\nEn prosa: [[${d('10')}]] també hi és.\n`);
    const r = porta.checkConvocatoria(arrel);
    const vida = Object.fromEntries(r.vida.map((v) => [v.nom.replace(/\.md$/, ''), v]));
    expect(vida[d('01')]).toMatchObject({ valid: true, motiu: `per a ${d('02')}` });
    expect(vida[d('02')]).toMatchObject({ valid: true });
    expect(vida[d('06')]).toMatchObject({ valid: true, motiu: expect.stringMatching(/^Mestre /) });
    expect(vida[d('11')]).toMatchObject({ valid: true, motiu: expect.stringMatching(/^rebut de torn_/) });
    expect(vida[d('03')]).toMatchObject({ valid: false, codi: 'CONV-03', motiu: expect.stringMatching(/ja no és a la taula/) });
    expect(vida[d('04')]).toMatchObject({ valid: false, codi: 'CONV-03', motiu: expect.stringMatching(/ja està tancat/) });
    expect(vida[d('05')]).toMatchObject({ valid: false, codi: 'CONV-03', motiu: expect.stringMatching(/ha caducat/) });
    expect(vida[d('07')]).toMatchObject({ valid: false, codi: 'CONV-03', motiu: expect.stringMatching(/data futura/) });
    expect(vida[d('08')]).toMatchObject({ valid: false, codi: 'CONV-03', motiu: expect.stringMatching(/motiu desconegut/) });
    expect(vida[d('09')]).toMatchObject({ valid: false, codi: 'CONV-02', motiu: 'sense motiu' });
    expect(vida[d('10')]).toMatchObject({ valid: false, codi: 'CONV-02', motiu: expect.stringMatching(/sense línia de declaració pròpia/) });
    // Un document d'avui sense motiu també és ranci per a la convocatòria (la vida ja no la dona la data).
    posa(arrel, `${DESK}/${dia}_1200_auditoria_avui.md`, '# avui\n');
    fs.appendFileSync(path.join(arrel, INDEX), `\n## Activitat en curs (2)\n\n- [[${dia}_1200_auditoria_avui]]\n`);
    expect(porta.checkConvocatoria(arrel).vida.find((v) => v.nom.startsWith(dia))).toMatchObject({ valid: false, codi: 'CONV-02' });
    // La taula (checkTaula) no canvia: la vida justificada és cosa de la convocatòria.
    expect(porta.checkTaula(arrel).valid).toBe(true);
  });

  const C_A = '250101_0910_auditoria_cicle_a';
  const C_B = '250101_0911_auditoria_cicle_b';
  const C_C = '250101_0912_auditoria_cicle_c';
  const masCicle = (linies) => {
    const arrel = mas({ activitat: `${linies.join('\n')}\n` });
    for (const n of [C_A, C_B, C_C]) posa(arrel, `${DESK}/${n}.md`, '# doc\n');
    return arrel;
  };

  test('[DEFECTE] la porta instal·lada dona per vius dos documents que només es declaren l’un per a l’altre', async () => {
    const instal = await modul(laBase(), 'tooling/gates/porta-olivera.mjs');
    const arrel = masCicle([`- [[${C_A}]] · per a [[${C_B}]]`, `- [[${C_B}]] · per a [[${C_A}]]`, `- [[${C_C}]] · per a [[${C_A}]]`]);
    expect(instal.checkTaula(arrel).valid).toBe(true);
    expect([...instal.vius(arrel)].sort()).toEqual([C_A, C_B, C_C]);
  });

  test('reparació: un consumidor només sosté si té vida; un cicle de «per a» sense ancoratge no sosté ningú, i amb un ancoratge sosté tota la cadena', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const vidaDe = (arrel) => Object.fromEntries(porta.checkConvocatoria(arrel).vida.map((v) => [v.nom.replace(/\.md$/, ''), v]));
    // A ↔ B, i C per a A: cap vida pròpia en tota la cadena.
    const cicle = vidaDe(masCicle([`- [[${C_A}]] · per a [[${C_B}]]`, `- [[${C_B}]] · per a [[${C_A}]]`, `- [[${C_C}]] · per a [[${C_A}]]`]));
    for (const n of [C_A, C_B, C_C]) expect(cicle[n], n).toMatchObject({ valid: false, codi: 'CONV-03', motiu: expect.stringMatching(/no té vida .*cicle de «per a» no sosté ningú/) });
    // El mateix cicle amb una retenció del Mestre a B: B té vida pròpia i sosté A, i A sosté C.
    const ancorat = vidaDe(masCicle([`- [[${C_A}]] · per a [[${C_B}]]`, `- [[${C_B}]] · per a [[${C_A}]] · Mestre 261009: el revisa el Mestre`, `- [[${C_C}]] · per a [[${C_A}]]`]));
    expect(ancorat[C_B]).toMatchObject({ valid: true });
    expect(ancorat[C_A]).toMatchObject({ valid: true, motiu: `per a ${C_B}` });
    expect(ancorat[C_C]).toMatchObject({ valid: true, motiu: `per a ${C_A}` });
    // Un «per a» que només es cita a ell mateix no és cap motiu.
    expect(vidaDe(masCicle([`- [[${C_A}]] · per a [[${C_A}]]`]))[C_A]).toMatchObject({ valid: false, codi: 'CONV-03', motiu: expect.stringMatching(/només el cita a ell mateix/) });
  });

  test('reparació: el tancament avisa també dels que penjaven, per «per a», d’un document que només sostenia el torn que es tanca', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const arrel = mas();
    const id = torn(arrel);
    const altre = torn(arrel);
    for (const n of [C_A, C_B, C_C]) posa(arrel, `${DESK}/${n}.md`, '# doc\n');
    posa(arrel, INDEX, `# Índex\n\n## Activitat en curs\n\n- [[${C_A}]] · per a [[${C_B}]]\n- [[${C_B}]] · ${id}\n- [[${C_C}]] · ${altre}\n`);
    const r = porta.checkTancament(arrel, { torn: id });
    expect(r.valid).toBe(true);
    expect(r.avisos.filter((a) => a.startsWith('[CONV-08]')).map((a) => /, (\S+) es queda sense vida/.exec(a)[1]).sort()).toEqual([C_A, C_B]);
    // Abans de tancar, tots tenen vida: el torn que es tanca encara és obert.
    expect(porta.checkConvocatoria(arrel).vida.every((v) => v.valid)).toBe(true);
  });

  test('reparació: el paràmetre «fase» només endurix; un «avis» no afluixa una bandera en «bloqueig»', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const brut = (fase) => {
      const arrel = mas({ fase, activitat: '- [[250101_0900_auditoria_vella]]\n' });
      posa(arrel, `${DESK}/250101_0900_auditoria_vella.md`, '# vella\n');
      return arrel;
    };
    const bloquejat = porta.checkConvocatoria(brut('bloqueig'), { fase: 'avis' });
    expect(bloquejat.fase).toBe('bloqueig');
    expect(bloquejat.errors.join('\n')).toMatch(/\[CONV-02\]/);
    expect(porta.checkOlivera(brut('bloqueig'), { fase: 'avis' }).errors.join('\n')).toMatch(/\[CONV-02\]/);
    expect(porta.checkConvocatoria(brut(null), { fase: 'bloqueig' })).toMatchObject({ fase: 'bloqueig', valid: false });
    expect(porta.checkConvocatoria(brut(null))).toMatchObject({ fase: 'avis', valid: true });
  });

  test('trinitat: el pla de la jornada nascut abans (millor amb el mateix HHMM) i complet; els germans de la mateixa hora no són rancis', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const dia = porta.avui();
    const p = `${dia}_0230_prompt_claude_prova.md`;
    const cas = ({ plans, germa = false }) => {
      const arrel = mas({ activitat: `${plans.map(([n]) => `- [[${n}]]`).join('\n')}\n${germa ? `- [[${dia}_0230_prompt_codex_prova]]\n` : ''}` });
      for (const [n, text] of plans) posa(arrel, `${DESK}/${n}.md`, text);
      if (germa) posa(arrel, `${DESK}/${dia}_0230_prompt_codex_prova.md`, prompt0('- [x] fet'));
      posa(arrel, `${DESK}/${p}`, prompt0('- [x] taula\n- [x] pla\n- [x] rebut'));
      return porta.checkConvocatoria(arrel, { fitxer: `${DESK}/${p}` });
    };
    // Mateix HHMM, nascut abans i complet: cap troballa ni avís de trinitat.
    const bo = cas({ plans: [[`${dia}_0230_pla_implementacio_prova`, pla0()]], germa: true });
    expect(codis(bo)).toEqual([]);
    expect(bo.trinitat).toMatchObject({ mateixaHora: true, triat: `${dia}_0230_pla_implementacio_prova.md` });
    expect(bo.vida.every((v) => v.valid)).toBe(true);
    // Mateix HHMM però amb la «Creació» posterior a la del prompt: naix després.
    expect(codis(cas({ plans: [[`${dia}_0230_pla_implementacio_prova`, pla0({ creacio: '2026-10-09T00:45:45.000Z' })]] }))).toContain('CONV-04');
    // HHMM anterior: val, però avisa del HHMM.
    const abans = cas({ plans: [[`${dia}_0200_pla_implementacio_prova`, pla0()]] });
    expect(codis(abans)).toEqual([]);
    expect(abans.avisos.join('\n')).toMatch(/\[CONV-04\] Trinitat: el pla .* no comparteix l'hora 0230/);
    // Pla incomplet: «Estat del Pla» de la plantilla, Verificació i Riscos en [pendent].
    const incomplet = cas({ plans: [[`${dia}_0230_pla_implementacio_prova`, pla0({ estat: '[en elaboració | aprovat | acabat | descartat]', verificacio: '[pendent]', riscos: '[pendent]' })]] });
    expect(codis(incomplet)).toEqual(['CONV-06']);
    expect(incomplet.troballes[0].missatge).toMatch(/«Estat del Pla» sense triar; «Verificació» en \[pendent\]; «Riscos» en \[pendent\]/);
    // El pla d'una altra jornada no compta.
    expect(codis(cas({ plans: [['250101_0100_pla_implementacio_vell', pla0()]] }))).toEqual(expect.arrayContaining(['CONV-04']));
  });

  test('secció 0: només [pendent], caselles a mitges o prosa sense caselles no compten com a fetes', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    expect(porta.seccioZeroFeta(prompt0('[pendent]'))).toBe(false);
    expect(porta.seccioZeroFeta(prompt0('- [x] taula\n- [ ] pla'))).toBe(false);
    expect(porta.seccioZeroFeta(prompt0('Ho he fet tot.'))).toBe(false);
    expect(porta.seccioZeroFeta(prompt0('- [x] taula\n- [X] pla\n<!-- nota -->'))).toBe(true);
    expect(porta.seccioZeroFeta('# sense secció 0\n')).toBe(false);
  });

  test('sediment de l’índex: mètrica i avís, mai error, ni en fase «bloqueig»', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const linies = Array.from({ length: 320 }, (_, i) => `- línia ${i}`).join('\n');
    const arrel = mas({ fase: 'bloqueig', altres: `\n## Seccio buida\n\n## Fix Automàtic d'Àncores\n\n${linies}\n` });
    const r = porta.checkConvocatoria(arrel);
    expect(r.sediment).toMatchObject({ fixAutomatic: true, seccionsBuides: expect.arrayContaining(['Seccio buida', 'Activitat en curs']) });
    expect(r.sediment.linies).toBeGreaterThan(300);
    expect(r.errors).toEqual([]);
    expect(r.avisos.filter((a) => a.startsWith('[CONV-07]'))).toHaveLength(3);
  });

  test('bandera de fase: absent «avis», «bloqueig» bloqueja i una bandera il·legible es llig com a «bloqueig» i ho diu', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    expect(porta.faseConvocatoria(mas())).toEqual({ fase: 'avis', error: null });
    expect(porta.faseConvocatoria(mas({ fase: 'bloqueig' }))).toEqual({ fase: 'bloqueig', error: null });
    const corrupta = mas();
    posa(corrupta, '.agents/olivera-fase.json', '{ fase: avis');
    expect(porta.faseConvocatoria(corrupta).fase).toBe('bloqueig');
    const r = porta.checkConvocatoria(corrupta);
    expect(r.errors.join('\n')).toMatch(/\[CONV-00\]/);
    const estranya = mas();
    posa(estranya, '.agents/olivera-fase.json', '{"fase":"potser"}');
    expect(porta.faseConvocatoria(estranya)).toMatchObject({ fase: 'bloqueig', error: expect.stringMatching(/no diu/) });
  });

  const indexAmb = (a, b) => `- [[${a}]] · per a [[${b}]]\n- [[${b}]] · Mestre 261009: el llig el Mestre\n`;
  const A_ = '250101_0900_auditoria_a';
  const B_ = '250101_0901_auditoria_b';

  test('[DEFECTE] --arxiva instal·lat despenja només el token: el motiu de la declaració queda solt a l’índex', async () => {
    const instal = await modul(laBase(), 'tooling/gates/porta-olivera.mjs');
    const vell = mas({ activitat: indexAmb(A_, B_) });
    for (const n of [A_, B_]) posa(vell, `${DESK}/${n}.md`, '# doc\n');
    instal.arxiva(vell, { noms: [`${A_}.md`] });
    expect(llig(path.join(vell, INDEX))).toMatch(/^-\s+· per a \[\[250101_0901_auditoria_b\]\]$/m);
  });

  test('reparació: --arxiva se’n du la línia de declaració sencera, el consumidor arxivat apunta a l’arxiu i una línia amb dos documents conserva l’altre', async () => {
    const [a, b] = [A_, B_];
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const arrel = mas({ activitat: indexAmb(a, b) });
    for (const n of [a, b]) posa(arrel, `${DESK}/${n}.md`, '# doc\n');
    porta.arxiva(arrel, { noms: [`${a}.md`] });
    const despres = llig(path.join(arrel, INDEX));
    expect(despres).not.toMatch(/per a/);
    expect(despres).toContain(`- [[${b}]] · Mestre 261009: el llig el Mestre\n`);
    expect(porta.checkTaula(arrel).valid).toBe(true);
    // Arxivar el consumidor: la línia d'A queda apuntant a l'arxiu i A es veu rànci.
    const c = mas({ activitat: indexAmb(a, b) });
    for (const n of [a, b]) posa(c, `${DESK}/${n}.md`, '# doc\n');
    porta.arxiva(c, { noms: [`${b}.md`] });
    const text = llig(path.join(c, INDEX));
    expect(text).toContain(`- [[${a}]] · per a [[../90_arxiu_historic/${b}]]\n`);
    expect(text).not.toMatch(/Mestre 261009/);
    expect(porta.checkTaula(c).valid).toBe(true);
    expect(porta.checkConvocatoria(c).vida.find((v) => v.nom === `${a}.md`)).toMatchObject({ valid: false, codi: 'CONV-03' });
    // Una línia que declara dos documents (`- [[D]] · [[E]]`, CONTROL D4 de porta-olivera-diagnosi): E és una
    // co-declaració, no un motiu; arxivar D només se'n du el seu token i E continua ancorat i declarat.
    const d = '250101_0902_auditoria_d';
    const e = '250101_0903_auditoria_e';
    const dues = mas({ activitat: `- [[${d}]] · [[${e}]]\n` });
    for (const n of [d, e]) posa(dues, `${DESK}/${n}.md`, '# doc\n');
    expect(porta.declaracions(dues).map((x) => [x.nom, x.motius.length])).toEqual([[`${d}.md`, 0], [`${e}.md`, 0]]);
    porta.arxiva(dues, { noms: [`${d}.md`] });
    expect(llig(path.join(dues, INDEX))).toMatch(new RegExp(`\\[\\[${e}\\]\\]`));
    expect(porta.ancoratge(dues)).toEqual({ senseAncora: [], fantasma: [] });
    // La línia que queda («-  · [[E]]») ja no és una declaració ben formada: E es veu ranci i cal declarar-lo bé.
    expect(porta.checkConvocatoria(dues).vida.find((v) => v.nom === `${e}.md`)).toMatchObject({ valid: false, codi: 'CONV-02' });
  });

  test('l’informe i el mode --tancament, com a processos: fase «avis» ix amb 0 i ho diu; fase «bloqueig» ix amb 1; el torn que es tanca avisa dels seus vius', async () => {
    const t = elTaller();
    const porta = path.join(t, 'tooling/gates/porta-olivera.mjs');
    const corre = (arrel, args) => spawnSync(process.execPath, [porta, ...args], { cwd: arrel, env: entorn({ SDP_ARREL: arrel }), encoding: 'utf8', timeout: 30000 });
    const munta = (fase) => {
      const arrel = mas({ fase, activitat: '- [[250101_0900_auditoria_vella]]\n' });
      posa(arrel, `${DESK}/250101_0900_auditoria_vella.md`, '# vella\n');
      return arrel;
    };
    const avis = corre(munta(null), ['--informe']);
    expect(avis.status, avis.stderr).toBe(0);
    expect(avis.stdout).toMatch(/Convocatòria v4 · fase «avis»/);
    expect(avis.stdout).toMatch(/🍂 250101_0900_auditoria_vella ← sense motiu/);
    expect(avis.stdout).toMatch(/⚠️ \[CONV-02\]/);
    expect(corre(munta('bloqueig'), ['--informe']).status).toBe(1);
    // Tancament: un document que només sosté el torn que es tanca.
    const arrel = mas();
    const id = torn(arrel);
    posa(arrel, `${DESK}/250101_0900_auditoria_del_torn.md`, '# del torn\n');
    posa(arrel, INDEX, `# Índex\n\n## Activitat en curs\n\n- [[250101_0900_auditoria_del_torn]] · ${id}\n`);
    const tanca = corre(arrel, ['--tancament', '--torn', id]);
    expect(tanca.status, tanca.stderr).toBe(0);
    expect(tanca.stdout).toMatch(/avís: \[CONV-08\] En tancar torn_/);
    posa(arrel, '.agents/olivera-fase.json', '{"fase":"bloqueig"}');
    const bloquejat = corre(arrel, ['--tancament', '--torn', id]);
    expect(bloquejat.status).toBe(1);
    expect(bloquejat.stderr).toMatch(/\[CONV-08\]/);
    expect(corre(arrel, ['--informe', '--torn', id]).status).toBe(2);
  });

  test('deliverContext i create de prompt: en «avis» com abans; en «bloqueig» sense pla de la trinitat es neguen sense rebut, i amb el pla complet passen', async () => {
    const t = elTaller();
    const turns = await modul(t, 'tooling/documental/turns.mjs');
    const document = await modul(t, 'tooling/wiki/document.mjs');
    const porta = await modul(t, 'tooling/gates/porta-olivera.mjs');
    const dia = porta.avui();
    const opts = { route: 'prompt.local', file: `${DESK}/${dia}_0230_prompt_claude_prova.md`, title: 'Prova', description: 'Convocatòria de prova del corredor' };
    // Fase «avis»: crear un prompt sense pla funciona com abans.
    const avis = mas({ contracte: true });
    const ta = turns.openTurn(avis, { scope: 'documents' });
    document.createDraft(avis, ta.turn_id, opts);
    expect(fs.existsSync(path.join(avis, opts.file))).toBe(true);
    // Fase «bloqueig»: sense pla, ni context ni create; el torn no rep cap rebut.
    const bloc = mas({ contracte: true, fase: 'bloqueig' });
    const tb = turns.openTurn(bloc, { scope: 'documents' });
    const abans = turns.readTurn(bloc, tb.turn_id);
    expect(() => turns.deliverContext(bloc, tb.turn_id, opts)).toThrow(/Convocatòria amb Escriptori brut[\s\S]*\[CONV-04\]/);
    expect(() => document.createDraft(bloc, tb.turn_id, opts)).toThrow(/\[CONV-04\]/);
    expect(turns.readTurn(bloc, tb.turn_id)).toEqual(abans);
    expect(fs.existsSync(path.join(bloc, opts.file))).toBe(false);
    // Amb el pla de la mateixa hora, complet i declarat: passa, i el prompt nou el sosté el seu rebut.
    // (Un «per a [[prompt]]» que encara no existix seria una àncora a un document absent: el pla
    // naix abans, i el seu motiu és el torn que el crea o una retenció del Mestre.)
    posa(bloc, `${DESK}/${dia}_0230_pla_implementacio_prova.md`, pla0());
    fs.appendFileSync(path.join(bloc, INDEX), `- [[${dia}_0230_pla_implementacio_prova]] · Mestre ${dia}: pla de l'Onada de prova\n`);
    document.createDraft(bloc, tb.turn_id, opts);
    expect(fs.existsSync(path.join(bloc, opts.file))).toBe(true);
    const vida = porta.checkConvocatoria(bloc).vida;
    expect(vida.find((v) => v.nom === path.basename(opts.file))).toMatchObject({ valid: true, motiu: expect.stringMatching(/^rebut de torn_/) });
    expect(vida.find((v) => v.nom.includes('pla_implementacio'))).toMatchObject({ valid: true, motiu: expect.stringMatching(/^Mestre /) });
    expect(porta.checkEscriptori(bloc).valid).toBe(true);
  });

  test('reparació: en fase «avis» la convocatòria avisa en convocar; deliverContext i create tornen els avisos i la CLI els escriu per stderr', async () => {
    const t = elTaller();
    const turns = await modul(t, 'tooling/documental/turns.mjs');
    const document = await modul(t, 'tooling/wiki/document.mjs');
    const porta = await modul(t, 'tooling/gates/porta-olivera.mjs');
    const dia = porta.avui();
    const prompt = (hhmm) => `${DESK}/${dia}_${hhmm}_prompt_claude_prova.md`;
    const arrel = mas({ contracte: true, activitat: '- [[250101_0900_auditoria_vella]]\n' });
    posa(arrel, `${DESK}/250101_0900_auditoria_vella.md`, '# vella\n');
    const { turn_id: id } = turns.openTurn(arrel, { scope: 'documents' });
    // En funció: el context no bloqueja i torna els avisos (viu sense motiu i trinitat sense pla).
    const d = turns.deliverContext(arrel, id, { route: 'prompt.local', file: prompt('0230') });
    expect(d.reflex).toMatch(/^sdp:torn_/);
    expect(d.avisos.filter((a) => /^\[CONV-0[24]\]/.test(a)).map((a) => a.slice(1, 8)).sort()).toEqual(['CONV-02', 'CONV-04']);
    expect(turns.deliverContext(arrel, id, { route: 'auditoria', file: `${DESK}/${dia}_0231_auditoria_prova.md` }).avisos).toEqual([]);
    const creat = document.createDraft(arrel, id, { route: 'prompt.local', file: prompt('0232'), title: 'Prova', description: 'Convocatòria de prova del corredor' });
    expect(creat.avisos.join('\n')).toMatch(/\[CONV-02\]/);
    // La CLI: eixida 0, el JSON de stdout es llig igual i els avisos van per stderr.
    const cli = (args) => spawnSync(process.execPath, [path.join(t, 'tooling/wiki/document.mjs'), ...args, '--arrel', arrel], { cwd: arrel, env: entorn({ SDP_ARREL: arrel }), encoding: 'utf8', timeout: 30000 });
    const ctx = cli(['context', '--turn-id', id, '--route', 'prompt.local', '--file', prompt('0233')]);
    expect(ctx.status, ctx.stderr).toBe(0);
    expect(JSON.parse(ctx.stdout)).toMatchObject({ route: 'prompt.local', reflex: expect.stringMatching(/^sdp:torn_/) });
    expect(ctx.stderr).toMatch(/^\[Convocatòria v4 · avís\] \[CONV-02\]/m);
    expect(ctx.stderr).toMatch(/^\[Convocatòria v4 · avís\] \[CONV-04\]/m);
    const crea = cli(['create', '--turn-id', id, '--route', 'prompt.local', '--file', prompt('0234'), '--title', 'Prova', '--description', 'Convocatòria de prova per la CLI']);
    expect(crea.status, crea.stderr).toBe(0);
    expect(JSON.parse(crea.stdout).avisos.length).toBeGreaterThan(0);
    expect(crea.stderr).toMatch(/^\[Convocatòria v4 · avís\] \[CONV-02\]/m);
    // Una ruta que no convoca no avisa de res.
    const aud = cli(['context', '--turn-id', id, '--route', 'auditoria', '--file', `${DESK}/${dia}_0235_auditoria_prova.md`]);
    expect(aud.status, aud.stderr).toBe(0);
    expect(aud.stderr).not.toMatch(/Convocatòria v4/);
  });

  test('diagnosi de la taula real amb la porta v4 (només lectura): el que veuria el Mestre en aplicar el paquet', async () => {
    const porta = await modul(elTaller(), 'tooling/gates/porta-olivera.mjs');
    const r = porta.checkConvocatoria(REPO);
    expect(r.fase).toBe('avis');
    expect(Array.isArray(r.vida) && Array.isArray(r.troballes)).toBe(true);
    const resum = [
      `fase ${r.fase} · ${r.troballes.length} troballa(es) · sediment ${r.sediment?.linies} línies, ${r.sediment?.seccionsBuides.length} seccions buides`,
      ...r.troballes.map((x) => `[${x.codi}] ${x.missatge}`),
      ...r.vida.map((v) => `${v.valid ? 'viu' : 'ranci'} · ${v.nom} ← ${v.motiu}`),
    ];
    // Invariants que valen siga quina siga la taula: cada declarat viu té el seu veredicte amb motiu,
    // els codis són els del motor i cada àncora repetida ix com a CONV-01.
    expect(new Set(r.vida.map((v) => v.nom.replace(/\.md$/, '')))).toEqual(porta.vius(REPO));
    expect(r.vida.every((v) => typeof v.valid === 'boolean' && typeof v.motiu === 'string' && v.motiu.length > 0)).toBe(true);
    expect(r.troballes.every((x) => /^CONV-0[0-7]$/.test(x.codi))).toBe(true);
    const comptes = new Map();
    for (const dec of porta.declaracions(REPO)) comptes.set(dec.nom, (comptes.get(dec.nom) ?? 0) + 1);
    expect(r.troballes.filter((x) => x.codi === 'CONV-01').map((x) => x.nom).sort()).toEqual([...comptes].filter(([, n]) => n > 1).map(([nom]) => nom).sort());
    expect(r.errors).toEqual([]);
    // La convocatòria del prompt de l'Onada 6 tal com és al disc, si encara hi és.
    const prompt = fs.readdirSync(path.join(REPO, DESK)).find((n) => /^\d{6}_\d{4}_prompt_claude_onada6\.md$/.test(n));
    if (prompt) {
      const p = porta.checkConvocatoria(REPO, { fitxer: `${DESK}/${prompt}`, contingut: llig(path.join(REPO, DESK, prompt)) });
      resum.push('', `Convocatòria de ${prompt}: ${p.troballes.map((x) => x.codi).join(', ') || 'cap troballa'}`, ...p.troballes.map((x) => `[${x.codi}] ${x.missatge}`), ...p.avisos.filter((a) => a.startsWith('[CONV-04] Trinitat: el pla ')));
    }
    try { fs.writeFileSync(path.join(os.tmpdir(), 'sdp-laboratori-higiene-261009-taula-real.txt'), `${resum.join('\n')}\n`); } catch { /* el resum no decidix res */ }
  });

  /* ── Tancament, despertar i hook ──────────────────────────────────────────── */

  test('[DEFECTE] tancament.mjs i despertar.mjs instal·lats: cap porta Olivera al tancament i el segell llarg de l’ESTAT no es data', async () => {
    expect(llig(path.join(REPO, 'tooling/gates/tancament.mjs'))).not.toMatch(/porta-olivera/);
    const { estatActual } = await modul(laBase(), 'tooling/brain/despertar.mjs');
    expect(estatActual('## ESTAT_ACTUAL · 2026-10-08 19:19 · MarIA · Tancament\n\ntext\n').segell).toBeNull();
  });

  test('reparació: tancament amb la comprovació «olivera» i el torn; despertar data l’ESTAT llarg, avisa del ranci i porta l’informe Olivera al canal fresc', async () => {
    const t = elTaller();
    const tancament = llig(path.join(t, 'tooling/gates/tancament.mjs'));
    expect(tancament).toMatch(/const commands=\[\['olivera',\['tooling\/gates\/porta-olivera\.mjs','--tancament',\.\.\.\(turnId\?\['--torn',turnId\]:\[\]\)\]\],/);
    expect(tancament).toMatch(/environmentChecks\(root,turnCheck\.turn\?\.scope\|\|'documents',\{turnId:id\|\|null\}\)/);
    const despertar = await modul(t, 'tooling/brain/despertar.mjs');
    const estat = despertar.estatActual('## ESTAT_ACTUAL · 2026-10-08 19:19 · MarIA · Tancament\n\ntext\n');
    expect(estat.segell).toBe('261008_1919');
    expect(despertar.estatActual('## ESTAT_ACTUAL · 260923_1310 · x\n\ny\n').segell).toBe('260923_1310');
    expect(despertar.avisRanci(estat, { mtime: new Date(2026, 9, 8, 23, 45), name: `${DESK}/261008_2345_pla_implementacio_onada5.md` })).toMatch(/^ESTAT RANCI: l'últim relleu és de 261008_1919/);
    const arrel = mas({ activitat: '- [[250101_0900_auditoria_vella]]\n' });
    posa(arrel, `${DESK}/250101_0900_auditoria_vella.md`, '# vella\n');
    const informe = await despertar.informeOlivera(arrel);
    expect(informe).toMatch(/^## 1b\. Porta Olivera \(verda, convocatòria en fase «avis»\)/);
    expect(informe).toMatch(/🍂 250101_0900_auditoria_vella ← sense motiu/);
    expect(await despertar.informeOlivera(path.join(arrel, 'no-hi-es'))).toMatch(/roja|No s'ha pogut/);
  });

  test('hook d’Antigravity (procés real del taller): el briefing diu qui necessita cada viu i, en «bloqueig», la taula sense motius és bruta', async () => {
    const hook = path.join(elTaller(), 'tooling/gates/antigravity-hook.mjs');
    const executa = (arrel, payload) => {
      const r = spawnSync(process.execPath, [hook, 'pre-invocation'], { cwd: arrel, env: entorn({ SDP_ARREL: arrel }), input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000 });
      return JSON.parse(r.stdout.trim().split('\n').at(-1));
    };
    const munta = (fase) => {
      const arrel = mas({ fase, activitat: '- [[250101_0900_auditoria_vella]]\n- [[250101_0901_auditoria_amb_motiu]] · Mestre 261009: el revisa el Mestre\n' });
      posa(arrel, `${DESK}/250101_0900_auditoria_vella.md`, '# vella\n');
      posa(arrel, `${DESK}/250101_0901_auditoria_amb_motiu.md`, '# amb motiu\n');
      return arrel;
    };
    const missatge = executa(munta(null), { invocationNum: 1, conversationId: 'conv-v4' }).injectSteps[0].ephemeralMessage;
    expect(missatge.startsWith('[Briefing de taula')).toBe(true);
    expect(missatge).toMatch(/Qui els necessita \(porta v4\): 250101_0900_auditoria_vella ← RANCI, sense motiu; 250101_0901_auditoria_amb_motiu ← Mestre 261009: el revisa el Mestre\./);
    // Amb la vida de la v4, el briefing no diu que la declaració no caduca: caduca amb el seu motiu.
    expect(missatge).toMatch(/Una declaració caduca amb el seu motiu/);
    expect(missatge).not.toMatch(/no caduca sola/);
    const brut = executa(munta('bloqueig'), { invocationNum: 1, conversationId: 'conv-v4' }).injectSteps[0].ephemeralMessage;
    expect(brut).toMatch(/^\[Escriptori brut · AGENTS §0\.1\] \[CONV-02\]/);
  });

  /* ── Plaquetes ─────────────────────────────────────────────────────────── */

  const preparaPlaquetes = (dir) => {
    posa(dir, '_wiki_de_poble/orfe.md', '# Orfe\n\nNingú no m’enllaça.\n');
    posa(dir, '_wiki_de_poble/00_INDEX.md', '# Índex\n');
    fs.mkdirSync(path.join(dir, '.immunitari/receptes'), { recursive: true });
    return () => {
      const r = spawnSync(process.execPath, ['scripts/immunitari/plaquetes.mjs', 'diagnostic', '--autonom'], { cwd: dir, env: entorn(), encoding: 'utf8', timeout: 60000 });
      expect(r.status, r.stderr).toBe(0);
      return r.stdout;
    };
  };
  const receptesDe = (dir) => fs.readdirSync(path.join(dir, '.immunitari/receptes')).filter((n) => n.endsWith('_RECEPTA.json')).sort();

  test('[DEFECTE] Plaquetes instal·lat escriu una recepta idèntica a cada execució', () => {
    const base = taller('sdp-higiene-261009-plaquetes-base-', { paquet: false });
    const correBase = preparaPlaquetes(base);
    correBase();
    correBase();
    const [r1, r2] = receptesDe(base).map((n) => JSON.parse(llig(path.join(base, '.immunitari/receptes', n))).operacions);
    expect(r2).toEqual(r1);
    expect(receptesDe(base)).toHaveLength(2);
  }, 120000);

  test('reparació: Plaquetes només escriu una recepta quan canvia l’empremta, la mateixa que calcula el cron', async () => {
    const prepara = preparaPlaquetes;
    const receptes = receptesDe;
    const nou = taller('sdp-higiene-261009-plaquetes-');
    const correNou = prepara(nou);
    expect(correNou()).toMatch(/Recepta \d+_RECEPTA generada/);
    expect(correNou()).toMatch(/Recepta idèntica a \d+_RECEPTA/);
    expect(receptes(nou)).toHaveLength(1);
    posa(nou, '_wiki_de_poble/un_altre_orfe.md', '# Un altre\n');
    expect(correNou()).toMatch(/generada/);
    expect(receptes(nou)).toHaveLength(2);
    const cron = await modul(nou, 'tooling/higiene/cron_higiene.mjs');
    for (const nom of receptes(nou)) {
      const r = JSON.parse(llig(path.join(nou, '.immunitari/receptes', nom)));
      expect(r.empremta).toBe(cron.empremtaOperacions(r.operacions));
    }
  }, 120000);

  /* ── Cron d'higiene ─────────────────────────────────────────────────────── */

  const ARA = new Date(2026, 9, 9, 5, 30);
  const DIA = '261009';
  const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  const recepta = (ops) => `${JSON.stringify({ id: 'R', data: '2026-10-08T00:00:00.000Z', operacions: ops }, null, 2)}\n`;
  const OPS = [{ id: 'OP-001', tipus: 'ADOPTA', fitxer: '_wiki_de_poble/orfe.md', hashFont: 'a'.repeat(64) }];
  const OPS2 = [{ id: 'OP-001', tipus: 'ADOPTA', fitxer: '_wiki_de_poble/altre.md', hashFont: 'b'.repeat(64) }];
  const ZIP = (p, v, s) => `socdepoble-${p}-v${v}-${s}.zip`;

  /** Mas del cron: git, brossa a l'arrel, logs, receptes, builds i una acta. */
  function masCron() {
    const arrel = mas({ activitat: '- [[250101_0900_auditoria_vella]] · Mestre 261009: el revisa el Mestre\n', altres: '\n## Recursos\n\n- [[bossa.log]]\n' });
    posa(arrel, `${DESK}/250101_0900_auditoria_vella.md`, '# vella\n');
    posa(arrel, `${DESK}/bossa.log`, 'no és de l’arrel\n');
    git(arrel, 'init', '-q');
    posa(arrel, 'probe_x.mjs', '// sonda\n');
    posa(arrel, 'eslint_errors.txt', 'x\n');
    posa(arrel, 'antic.orig', 'versionat\n');
    posa(arrel, 'config.js.bak', 'versionat\n');
    posa(arrel, 'README.md', '# no és brossa\n');
    posa(arrel, '.DS_Store', 'finder\n');
    posa(arrel, '.env.local', 'NO_ES_TOCA=1\n');
    posa(arrel, '.agents/runtime/antigravity-hook.log', 'x'.repeat(1024 * 1024 + 10));
    posa(arrel, '.agents/runtime/fatiga-hook.log', 'curt\n');
    posa(arrel, '.agents/runtime/segell.log', 'y'.repeat(1024 * 1024 + 10));
    posa(arrel, '.immunitari/receptes/1000_RECEPTA.json', recepta(OPS));
    posa(arrel, '.immunitari/receptes/2000_RECEPTA.json', recepta(OPS));
    posa(arrel, '.immunitari/receptes/3000_RECEPTA.json', recepta(OPS));
    posa(arrel, '.immunitari/receptes/4000_RECEPTA.json', recepta(OPS));
    posa(arrel, '.immunitari/receptes/5000_RECEPTA.json', recepta(OPS2));
    posa(arrel, '.immunitari/receptes/6000_RECEPTA.json', recepta(OPS));
    posa(arrel, '.immunitari/aprovacions/2000_RECEPTA.aprovat.json', '{}\n');
    const B = 'wordpress-plugin/builds';
    for (const z of [ZIP('enxufe', '1.0.2', '261004_0527'), ZIP('enxufe', '1.0.5', '261007_1602'), ZIP('enxufe', '1.0.6', '261008_2036'), ZIP('enxufe', '1.0.6', '261008_2330'),
      ZIP('spa', '1.0.3', '261004_1916'), ZIP('spa', '1.0.5', '261007_1602'), 'paquet-a-ma.zip']) posa(arrel, `${B}/${z}`, `zip ${z}\n`);
    for (const z of [ZIP('enxufe', '1.0.1', '261003_1324'), ZIP('enxufe', '1.0.5', '261007_1602')]) posa(arrel, `${B}/directori/${z}`, `zip ${z}\n`);
    posa(arrel, `${B}/stable.json`, `${JSON.stringify({ adaptadors: { wordpress: { paquet: { nom: ZIP('enxufe', '1.0.5', '261007_1602'), url: `http://localhost:8881/enxufe/${ZIP('enxufe', '1.0.5', '261007_1602')}` }, directori: { cami: `directori/${ZIP('enxufe', '1.0.5', '261007_1602')}` } } }, estatic: { paquet: { nom: ZIP('spa', '1.0.5', '261007_1602') } } })}\n`);
    posa(arrel, '_wiki_de_poble/10_actes/261008_2300_acta_marmota.md', `# Acta\n\nPaquet ${ZIP('enxufe', '1.0.6', '261008_2036')} lliurat.\n`);
    posa(arrel, '_wiki_de_poble/10_actes/261007_1645_acta_marmota.md', `# Acta vella\n\n${ZIP('enxufe', '1.0.2', '261004_0527')}\n`);
    git(arrel, 'add', 'antic.orig', 'config.js.bak', 'README.md', '.immunitari/receptes/1000_RECEPTA.json');
    return arrel;
  }

  test('cron L0: informe a .immunitari/higiene/aammdd.json sense moure res, amb la retenció, les receptes, els logs i la porta', async () => {
    const cron = await modul(elTaller(), 'tooling/higiene/cron_higiene.mjs');
    const arrel = masCron();
    const abans = llistat(arrel);
    const r = cron.higiene(arrel, { ara: ARA });
    expect(llistat(arrel).filter((f) => !f.startsWith('.immunitari/higiene/'))).toEqual(abans);
    expect(r.fitxer).toBe(`.immunitari/higiene/${DIA}.json`);
    expect(JSON.parse(llig(path.join(arrel, r.fitxer)))).toEqual(JSON.parse(JSON.stringify(r)));
    expect(r.l1).toBeNull();
    expect(r.l0.arrel.brossa).toEqual(['eslint_errors.txt', 'probe_x.mjs']);
    expect(r.l0.arrel.sospitososVersionats).toEqual(['antic.orig', 'config.js.bak']);
    expect(r.l0.arrel.dsStore).toBe(1);
    const retira = r.l0.zips.retira.map((z) => z.rel.split('/').slice(2).join('/')).sort();
    expect(retira).toEqual([ZIP('enxufe', '1.0.2', '261004_0527'), ZIP('spa', '1.0.3', '261004_1916'), `directori/${ZIP('enxufe', '1.0.1', '261003_1324')}`].sort());
    const motiu = (nom) => r.l0.zips.conserva.find((z) => z.rel.endsWith(`/${nom}`)).motius.join('; ');
    expect(motiu(ZIP('enxufe', '1.0.5', '261007_1602'))).toMatch(/estable/);
    expect(motiu(ZIP('enxufe', '1.0.6', '261008_2330'))).toMatch(/més recent/);
    expect(motiu(ZIP('enxufe', '1.0.6', '261008_2036'))).toMatch(/citat a 261008_2300_acta_marmota\.md/);
    expect(motiu('paquet-a-ma.zip')).toMatch(/no canònic/);
    expect(r.l0.receptes).toMatchObject({ total: 6, versionades: 1, empremtes: 2, repetides: 3, repetidesNoVersionades: 2 });
    expect(r.l0.logs.find((l) => l.rel.endsWith('antigravity-hook.log')).rotable).toBe(true);
    expect(r.l0.logs.find((l) => l.rel.endsWith('segell.log')).rotable).toBe(false);
    expect(r.l0.olivera).toMatchObject({ valid: true, fase: 'avis' });
    expect(JSON.stringify(r)).not.toContain(arrel);
  });

  /** Fitxers del mas en camins posix, sense .git, ordenats. */
  function llistat(arrel) {
    const out = [];
    (function recorre(rel) {
      for (const e of fs.readdirSync(path.join(arrel, rel), { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (r === '.git') continue;
        if (e.isDirectory()) recorre(r); else out.push(r);
      }
    })('');
    return out.sort();
  }

  test('cron L1: només el reversible, amb MANIFEST; mai punt (fora dels camins de la casa), versionats, Escriptori ni .env', async () => {
    const cron = await modul(elTaller(), 'tooling/higiene/cron_higiene.mjs');
    const arrel = masCron();
    const r = cron.higiene(arrel, { aplica: true, ara: ARA });
    expect(r.l1.fet).toBe(true);
    const quarantena = r.l1.arrel.paperera;
    expect(r.l1.arrel.moguts.map((m) => m.origen).sort()).toEqual(['eslint_errors.txt', 'probe_x.mjs']);
    expect(JSON.parse(llig(path.join(arrel, quarantena, 'MANIFEST.json'))).moguts).toHaveLength(2);
    for (const f of ['antic.orig', 'config.js.bak', 'README.md', '.DS_Store', '.env.local', `${DESK}/bossa.log`, `${DESK}/250101_0900_auditoria_vella.md`]) expect(fs.existsSync(path.join(arrel, f)), f).toBe(true);
    expect(r.l1.logs).toEqual([{ origen: '.agents/runtime/antigravity-hook.log', desti: '.agents/runtime/antigravity-hook.261009_0530.log', mida: 1024 * 1024 + 10 }]);
    expect(fs.existsSync(path.join(arrel, '.agents/runtime/segell.log'))).toBe(true);
    expect(fs.existsSync(path.join(arrel, '.agents/runtime/fatiga-hook.log'))).toBe(true);
    // Receptes: es queda la més nova de cada empremta, l'aprovada i la versionada.
    expect(r.l1.receptes.moguts.map((m) => m.origen).sort()).toEqual(['.immunitari/receptes/3000_RECEPTA.json', '.immunitari/receptes/4000_RECEPTA.json']);
    expect(fs.readdirSync(path.join(arrel, '.immunitari/receptes')).sort()).toEqual(['1000_RECEPTA.json', '2000_RECEPTA.json', '5000_RECEPTA.json', '6000_RECEPTA.json']);
    expect(JSON.parse(llig(path.join(arrel, r.l1.receptes.quarantena, 'MANIFEST.json'))).moguts).toHaveLength(2);
    // Una segona passada el mateix dia no troba res nou.
    const dues = cron.higiene(arrel, { aplica: true, ara: new Date(ARA.getTime() + 60000) });
    expect([dues.l1.arrel.moguts.length, dues.l1.logs.length, dues.l1.receptes.moguts.length]).toEqual([0, 0, 0]);
    expect(cron.intocable('_wiki_de_poble/04_escriptori/x.log')).toBe(true);
    expect(cron.intocable('.env.production.local')).toBe(true);
    expect(cron.intocable('.iaia_auth/creds.json')).toBe(true);
    expect(cron.intocable('wordpress-plugin/builds/x.zip')).toBe(false);
  });

  test('cron L0: els sospitosos versionats inclouen .old i .abans-aammdd (les còpies velles de tooling/wiki i .immunitari/quarantena)', async () => {
    const cron = await modul(elTaller(), 'tooling/higiene/cron_higiene.mjs');
    const arrel = masCron();
    posa(arrel, 'tooling/wiki/x.mjs.abans-260830', '// còpia vella\n');
    posa(arrel, '.immunitari/quarantena/bot.mjs.old', '// vell\n');
    git(arrel, 'add', '-f', 'tooling/wiki/x.mjs.abans-260830', '.immunitari/quarantena/bot.mjs.old');
    const r = cron.higiene(arrel, { aplica: true, ara: ARA });
    expect(r.l0.arrel.sospitososVersionats).toEqual(['.immunitari/quarantena/bot.mjs.old', 'antic.orig', 'config.js.bak', 'tooling/wiki/x.mjs.abans-260830']);
    // Només es llisten: són versionats i el L1 no els toca.
    for (const f of ['tooling/wiki/x.mjs.abans-260830', '.immunitari/quarantena/bot.mjs.old']) expect(fs.existsSync(path.join(arrel, f)), f).toBe(true);
  });

  test('cron L1: dels rotats de cada log es queden els tres més nous; els altres van a quarantena amb MANIFEST', async () => {
    const cron = await modul(elTaller(), 'tooling/higiene/cron_higiene.mjs');
    const arrel = masCron();
    for (const s of ['261001_0530', '261002_0530', '261003_0530', '261004_0530']) posa(arrel, `.agents/runtime/antigravity-hook.${s}.log`, `rotat ${s}\n`);
    posa(arrel, '.agents/runtime/fatiga-hook.261001_0530.log', 'un sol rotat\n');
    expect(cron.rotatsVells(arrel)).toEqual(['.agents/runtime/antigravity-hook.261001_0530.log']);
    const r = cron.higiene(arrel, { aplica: true, ara: ARA });
    // ARA rota antigravity-hook.log a .261009_0530: n'hi ha cinc i se'n queden tres.
    expect(r.l1.logsVells.moguts.map((m) => m.origen)).toEqual(['.agents/runtime/antigravity-hook.261001_0530.log', '.agents/runtime/antigravity-hook.261002_0530.log']);
    expect(JSON.parse(llig(path.join(arrel, r.l1.logsVells.quarantena, 'MANIFEST.json'))).moguts).toHaveLength(2);
    expect(fs.readdirSync(path.join(arrel, '.agents/runtime')).filter((n) => /^antigravity-hook\.\d/.test(n)).sort())
      .toEqual(['antigravity-hook.261003_0530.log', 'antigravity-hook.261004_0530.log', 'antigravity-hook.261009_0530.log']);
    expect(fs.existsSync(path.join(arrel, '.agents/runtime/fatiga-hook.261001_0530.log'))).toBe(true);
    expect(cron.rotatsVells(arrel)).toEqual([]);
  });

  test('.gitignore del paquet: les quarantenes del circuit queden fora de git, i la resta de .sdp-paperera/ i de .immunitari/ no canvia', () => {
    const dir = nouDir('sdp-higiene-261009-gitignore-');
    git(dir, 'init', '-q');
    posa(dir, '.gitignore', pla.mostra(REPO, '.gitignore'));
    const ignorat = (rel) => { posa(dir, rel, 'x\n'); return spawnSync('git', ['-C', dir, 'check-ignore', '-q', rel]).status === 0; };
    expect(ignorat('.sdp-paperera/quarantena-2026-10-09T03-30-00-000Z/probe_x.mjs')).toBe(true);
    expect(ignorat('.sdp-paperera/quarantena-2026-10-09T03-30-00-000Z-receptes/.immunitari/receptes/1_RECEPTA.json')).toBe(true);
    expect(ignorat('.sdp-paperera/quarantena-261009-mestre/wordpress-plugin-supabase/.temp/estat')).toBe(true);
    expect(ignorat('.immunitari/receptes/2_RECEPTA.json')).toBe(true);
    expect(ignorat('.immunitari/higiene/261009.json')).toBe(true);
    expect(ignorat('.sdp-paperera/LLEGIU.txt')).toBe(false);
    expect(ignorat('.immunitari/config.json')).toBe(false);
  });

  test('cron: s’absté amb un lock d’escriptura, una mutació pendent, un torn obert recent o sense git; l’informe diu per què', async () => {
    const cron = await modul(elTaller(), 'tooling/higiene/cron_higiene.mjs');
    for (const [nom, prepara] of [
      ['document-create.lock', (a) => posa(a, '.agents/runtime/document-create.lock', '')],
      ['mutation.pending.json', (a) => posa(a, '.agents/runtime/mutation.pending.json', '{}')],
      ['torn obert recent', (a) => torn(a, { tocat: 30 })],
    ]) {
      const arrel = masCron();
      prepara(arrel);
      const r = cron.higiene(arrel, { aplica: true, ara: new Date() });
      expect(r.l1.fet, nom).toBe(false);
      expect(r.abstencio, nom).toBeTruthy();
      expect(fs.existsSync(path.join(arrel, 'probe_x.mjs')), nom).toBe(true);
    }
    // Un torn obert però tocat fa més de dues hores, o un de tancat, no aturen el cron.
    const vell = masCron();
    torn(vell, { tocat: 180 });
    torn(vell, { state: 'closed', tocat: 5 });
    expect(cron.motiuAbstencio(vell)).toBeNull();
    const senseGit = masCron();
    const r = cron.higiene(senseGit, { aplica: true, ara: ARA, vers: null });
    expect(r.l1).toEqual({ fet: false, motiu: expect.stringMatching(/git no respon/) });
  });

  test('cron L2: proposta amb codi; un codi equivocat no mou res; el bo trasllada els ZIP fora del repositori amb MANIFEST i purga les quarantenes velles', async () => {
    const cron = await modul(elTaller(), 'tooling/higiene/cron_higiene.mjs');
    const arrel = masCron();
    const paperera = nouDir('sdp-higiene-261009-paperera-builds-');
    const vella = '.sdp-paperera/quarantena-2026-08-01T00-00-00-000Z';
    posa(arrel, `${vella}/x.log`, 'vell\n');
    posa(arrel, `${vella}/MANIFEST.json`, '{}\n');
    const fa40 = new Date(Date.now() - 40 * 86400000);
    fs.utimesSync(path.join(arrel, vella, 'MANIFEST.json'), fa40, fa40);
    const recent = '.sdp-paperera/quarantena-2026-10-08T00-00-00-000Z';
    posa(arrel, `${recent}/MANIFEST.json`, '{}\n');
    const versionada = '.sdp-paperera/quarantena-2026-07-01T00-00-00-000Z';
    posa(arrel, `${versionada}/y.log`, 'versionat\n');
    posa(arrel, `${versionada}/MANIFEST.json`, '{}\n');
    fs.utimesSync(path.join(arrel, versionada, 'MANIFEST.json'), fa40, fa40);
    git(arrel, 'add', '-f', `${versionada}/y.log`);
    const sensePaperera = '.sdp-paperera/quarantena-260913';
    posa(arrel, `${sensePaperera}/z.txt`, 'antiga, sense manifest\n');
    // Una retirada de ZIP de fa 40 dies a la paperera germana: el cron no la purga mai.
    const retencioVella = 'retencio-2026-08-01T00-00-00-000Z';
    posa(paperera, `${retencioVella}/socdepoble-enxufe-v1.0.0-261001_0320.zip`, 'zip vell\n');
    posa(paperera, `${retencioVella}/MANIFEST.json`, '{}\n');
    fs.utimesSync(path.join(paperera, retencioVella, 'MANIFEST.json'), fa40, fa40);

    const p = cron.propostaL2(arrel, { paperera });
    expect(p.codi).toMatch(/^[0-9a-f]{12}$/);
    expect(p.items.filter((i) => i.tipus === 'quarantena').map((i) => i.rel)).toEqual([vella]);
    expect(p.items.filter((i) => i.tipus === 'zip')).toHaveLength(3);
    expect(() => cron.aplicaL2(arrel, { confirma: '000000000000', paperera })).toThrow(/Confirmació incorrecta/);
    expect(fs.existsSync(path.join(arrel, vella))).toBe(true);
    const r = cron.aplicaL2(arrel, { confirma: p.codi, paperera });
    const manifest = JSON.parse(llig(path.join(arrel, r.manifest)));
    expect(manifest.codi).toBe(p.codi);
    expect(manifest.moguts.map((m) => m.sha256)).toEqual(manifest.moguts.map((m) => sha(`zip ${path.basename(m.origen)}\n`)));
    for (const m of manifest.moguts) {
      expect(fs.existsSync(path.join(arrel, m.origen))).toBe(false);
      expect(fs.existsSync(path.join(arrel, m.desti))).toBe(true);
      expect(path.resolve(arrel, m.desti).startsWith(paperera)).toBe(true);
    }
    expect(fs.existsSync(path.join(arrel, vella))).toBe(false);
    for (const q of [recent, versionada, sensePaperera]) expect(fs.existsSync(path.join(arrel, q)), q).toBe(true);
    expect(fs.existsSync(path.join(paperera, retencioVella, 'socdepoble-enxufe-v1.0.0-261001_0320.zip'))).toBe(true);
    for (const z of [ZIP('enxufe', '1.0.5', '261007_1602'), ZIP('enxufe', '1.0.6', '261008_2036'), ZIP('enxufe', '1.0.6', '261008_2330'), ZIP('spa', '1.0.5', '261007_1602'), 'paquet-a-ma.zip']) {
      expect(fs.existsSync(path.join(arrel, 'wordpress-plugin/builds', z)), z).toBe(true);
    }
    // Sense stable.json llegible no es proposa cap ZIP.
    const sense = masCron();
    fs.writeFileSync(path.join(sense, 'wordpress-plugin/builds/stable.json'), '{');
    expect(cron.propostaL2(sense, { paperera }).items.filter((i) => i.tipus === 'zip')).toEqual([]);
    // La CLI no aplica la L2 sense un terminal humà.
    const cli = spawnSync(process.execPath, [path.join(elTaller(), 'tooling/higiene/cron_higiene.mjs'), '--l2', '--confirma', p.codi], { cwd: arrel, env: entorn({ SDP_ARREL: arrel }), encoding: 'utf8', input: '' });
    expect(cli.status).toBe(1);
    expect(cli.stderr).toMatch(/terminal humà/);
  });

  /* ── Bateria de regressió ─────────────────────────────────────────────────── */

  /** Bateria: les proves que nomenen les peces tocades, més les guardes de la cadena de seguretat i del segell. */
  const FIXES = ['security-chain', 'hooks-local', 'tractor-fortification', 'sistema_nervios', 'governanca-260930-segell', 'backend_consolidacio',
    'documental', 'cognitive-preflight', 'document-create-race', 'cognitive-hook-safety', 'fatiga-261002', 'antigravity-hook', 'porta-olivera-v3',
    'porta-olivera-diagnosi', 'olivera-arxiva-261002', 'petorreta-generador', 'cognitive-document-handoff', 'document-command-policy'].map((n) => `tests/${n}.test.mjs`);
  const TOCATS = /porta-olivera|draft-write|documental\/turns|antigravity-hook|tancament\.mjs|despertar|plaquetes|cron_higiene|registre_tasques|core-higiene-escriptori|core-empaquetat-wp|wiki-documentacio-i-reflex|wiki\/document\.mjs|olivera-fase|mapa-consola/;
  function bateria() {
    const trobades = fs.readdirSync(path.join(REPO, 'tests')).filter((n) => n.endsWith('.test.mjs'))
      .filter((n) => TOCATS.test(llig(path.join(REPO, 'tests', n)))).map((n) => `tests/${n}`);
    return [...new Set([...FIXES, ...trobades])].filter((f) => fs.existsSync(path.join(REPO, f))).sort();
  }

  const WIKI = ['00_index.md', '01_ser', '02_saber', '03_actuar', '10_actes'];
  const ARREL_SOLTS = ['AGENTS.md', 'CLAUDE.md', 'package.json', 'eslint.config.js', '.gitignore'];
  const CODI = ['src'];
  const INVESTIGACIO = '_wiki_de_poble/04_escriptori/02_investigacio_ia';

  /** Segell de skills com el deixa executor-mutacio.mjs en aplicar un pla que toca .agents/skills. */
  async function segellaComExecutor(dir, fitxers) {
    const { calculaSegell } = await import(url(path.join(dir, 'tooling/gates/segella.mjs')));
    const segell = calculaSegell(dir);
    const id = randomUUID();
    posa(dir, `.agents/seal-transactions/${id}.json`, `${JSON.stringify({ id, state: 'accepted', kind: 'laboratori-higiene-261009', operationId: `${pla.OPERACIO}corredor`, afterSeal: segell.hash, files: fitxers, manifest: segell.manifest })}\n`);
    posa(dir, '.agents/SKILLS_SEAL.json', `${JSON.stringify({ timestamp: new Date().toISOString(), hash: segell.hash, filesCount: segell.files.length, manifest: segell.manifest, transaction: id }, null, 2)}\n`);
  }

  /**
   * Parell de còpies del repositori per a la bateria, com la del 261006 (mai l'arxiu ni els
   * documents de l'Escriptori): la base i, clonada d'ella, la del paquet. Clonar garantix que
   * les dues parteixen del mateix arbre encara que altres fronts escriguen mentrestant.
   */
  async function construeixParell(prefix, { abansDelPaquet = null } = {}) {
    const base = nouDir(`${prefix}base-`);
    const fora = (src) => !/[\\/](?:node_modules|\.DS_Store|\.git)$/.test(src) && !src.includes(`${path.sep}.agents${path.sep}runtime`);
    for (const rel of ['tooling', 'tests', 'scripts', '.agents', '.claude', '.codex', '.husky', ...ARREL_SOLTS, ...CODI]) copia(base, rel, { filtre: fora });
    for (const rel of WIKI) copia(base, `_wiki_de_poble/${rel}`, { filtre: fora });
    fs.mkdirSync(path.join(base, INVESTIGACIO), { recursive: true });
    for (const e of fs.readdirSync(path.join(REPO, INVESTIGACIO), { withFileTypes: true })) if (e.isDirectory()) copia(base, `${INVESTIGACIO}/${e.name}`, { filtre: fora });
    fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(base, 'node_modules'), 'dir');
    execFileSync('git', ['init', '-q'], { cwd: base });
    if (abansDelPaquet) await abansDelPaquet(base);
    const paquet = nouDir(`${prefix}paquet-`);
    fs.cpSync(base, paquet, { recursive: true, verbatimSymlinks: true });
    const cat = await pla.projeccioCataleg(base);
    aplicaPaquet(paquet);
    for (const f of cat.fitxers ?? []) posa(paquet, f.ruta, f.contingut);
    await segellaComExecutor(paquet, [...ESTAT.map((f) => f.ruta), ...(cat.fitxers ?? []).map((f) => f.ruta)]);
    return { base, paquet, cataleg: cat };
  }

  function llegeixTap(text, arrel) {
    const resultats = new Map();
    const vistos = new Map();
    const pila = [];
    for (const linia of text.split('\n')) {
      const sub = /^( *)# Subtest: (.*)$/.exec(linia);
      if (sub) { pila.length = Math.floor(sub[1].length / 4); pila.push(sub[2]); continue; }
      const m = /^( *)(not ok|ok) \d+ - (.*)$/.exec(linia);
      if (!m) continue;
      let nom = m[3];
      let estat = m[2] === 'ok' ? 'pass' : 'fail';
      const directiva = / # (SKIP|TODO)\b.*$/.exec(nom);
      if (directiva) { nom = nom.slice(0, directiva.index); estat = directiva[1] === 'SKIP' ? 'skip' : 'todo'; }
      const clau = [...pila.slice(0, Math.floor(m[1].length / 4)), nom].join(' › ').split(arrel).join('<arrel>');
      const n = (vistos.get(clau) ?? 0) + 1;
      vistos.set(clau, n);
      resultats.set(n > 1 ? `${clau} #${n}` : clau, estat);
    }
    return resultats;
  }

  function corre(arrel, fitxer) {
    return new Promise((resolve) => {
      const fill = spawn(process.execPath, ['--test', '--test-reporter=tap', fitxer], { cwd: arrel, env: entorn(), stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      let err = '';
      fill.stdout.on('data', (tros) => { out += tros; });
      fill.stderr.on('data', (tros) => { err += tros; });
      const rellotge = setTimeout(() => fill.kill('SIGKILL'), 5 * 60 * 1000);
      fill.on('close', (codi) => { clearTimeout(rellotge); resolve({ fitxer, codi, resultats: llegeixTap(out, arrel), err }); });
    });
  }

  async function enPiscina(tasques, limit) {
    const eixida = new Array(tasques.length);
    let seguent = 0;
    const treballador = async () => {
      while (seguent < tasques.length) {
        const i = seguent++;
        eixida[i] = await tasques[i]();
      }
    };
    await Promise.all(Array.from({ length: Math.min(limit, tasques.length) }, treballador));
    return eixida;
  }

  const compte = (execucions) => {
    const c = { pass: 0, fail: 0, skip: 0, todo: 0 };
    for (const e of execucions) for (const estat of e.resultats.values()) c[estat] += 1;
    return c;
  };
  const regressa = (base, paquet) => (base === 'pass' && paquet !== 'pass') || (base !== 'fail' && paquet === 'fail');

  /**
   * Conflictes coneguts i declarats: proves d'un laboratori vell i no aplicat que comparen un
   * fitxer instal·lat amb la seua còpia i cauen amb qualsevol canvi posterior d'eixe fitxer. No
   * es resolen tocant este paquet: es resolen arxivant el laboratori (INVENTARI_BROSSA §3.17), i
   * llavors la prova fa skip. Qualsevol altra regressió fa caure la bateria.
   */
  const CONFLICTES_CONEGUTS = new Map([
    ['tests/governanca-260930b-torns.test.mjs :: despertar.mjs i mapa-consola.mjs conserven l’original i només afigen el que diu el paquet (pass) → fail',
      'el laboratori 260930_0400_governanca_claude, sense aplicar, exigix que despertar.mjs i mapa-consola.mjs instal·lats siguen un subconjunt ordenat de les seues còpies (només hi afig «## Vincles» a l’ON_ESTIC); este paquet toca tots dos'],
  ]);

  test('la bateria de les peces tocades: cap fallada nova respecte de l’arbre d’ara', async () => {
    const fitxers = bateria();
    const { base, paquet } = await construeixParell('sdp-higiene-261009-bateria-');
    const eixides = await enPiscina(fitxers.flatMap((f) => [() => corre(base, f), () => corre(paquet, f)]), 4);
    const deBase = new Map(eixides.filter((_, i) => i % 2 === 0).map((e) => [e.fitxer, e]));
    const delPaquet = new Map(eixides.filter((_, i) => i % 2 === 1).map((e) => [e.fitxer, e]));
    const regressions = (f) => {
      const out = [];
      const b = deBase.get(f).resultats;
      const p = delPaquet.get(f).resultats;
      for (const [clau, estat] of b) if (regressa(estat, p.get(clau))) out.push(`${f} :: ${clau} (${estat}) → ${p.get(clau) ?? 'absent'}`);
      for (const [clau, estat] of p) if (!b.has(clau) && estat === 'fail') out.push(`${f} :: ${clau} → fail (nova al paquet)`);
      return out;
    };
    // Una caiguda del paquet es repetix una vegada, en sèrie: un timeout per càrrega no és una regressió.
    const repetits = fitxers.filter((f) => regressions(f).length);
    for (const f of repetits) delPaquet.set(f, await corre(paquet, f));
    const totes = fitxers.flatMap(regressions);
    const conegudes = totes.filter((r) => CONFLICTES_CONEGUTS.has(r)).map((r) => `conflicte conegut · ${r} · ${CONFLICTES_CONEGUTS.get(r)}`);
    const inesperades = totes.filter((r) => !CONFLICTES_CONEGUTS.has(r));
    const cb = compte([...deBase.values()]);
    const cp = compte([...delPaquet.values()]);
    const resum = `Bateria de ${fitxers.length} fitxers. Base: ${cb.pass} pass · ${cb.fail} fail · ${cb.skip} skip. Paquet: ${cp.pass} pass · ${cp.fail} fail · ${cp.skip} skip. Conflictes coneguts: ${conegudes.length}. Repetits en sèrie: ${repetits.length ? repetits.join(', ') : 'cap'}.`;
    const detall = fitxers.map((f) => {
      const [b, p] = [compte([deBase.get(f)]), compte([delPaquet.get(f)])];
      return `${f}: base ${b.pass}/${b.fail}/${b.skip} · paquet ${p.pass}/${p.fail}/${p.skip} (pass/fail/skip)`;
    });
    try { fs.writeFileSync(path.join(os.tmpdir(), 'sdp-laboratori-higiene-261009-bateria.txt'), `${[resum, ...detall, ...conegudes, ...inesperades].join('\n')}\n`); } catch { /* el resum no decidix res */ }
    expect(fitxers.every((f) => deBase.get(f).resultats.size > 0), detall.join('\n')).toBe(true);
    expect(inesperades, `${resum}\n${detall.join('\n')}`).toEqual([]);
  }, 40 * 60 * 1000);

  // Amb la G5 aplicada o arxivada, la bateria ja corre backend_consolidacio sencera.
  test.skipIf(!G5)('backend_consolidacio amb la G5 de la Consola a les dues còpies: el cablejat del tancament continua verd amb «olivera» aïllada', async () => {
    // A l'arbre d'ara, backend_consolidacio cau sencera perquè sdp-clon-loiverse no porta triggers_on i
    // inventari() llança (la G5 del paquet 261009_0400_consola_claude ho arregla). Sense eixa
    // correcció, la substitució d'este paquet sobre la prova no es podria vore treballar.
    const { base, paquet } = await construeixParell('sdp-higiene-261009-g5-', {
      abansDelPaquet: async (dir) => {
        const abs = path.join(dir, G5.ruta);
        let text = llig(abs);
        for (const c of G5.canvis) if (text.includes(c.abans)) text = text.replace(c.abans, () => c.despres);
        fs.writeFileSync(abs, text);
        await segellaComExecutor(dir, [G5.ruta]);
      },
    });
    const fitxer = 'tests/backend_consolidacio.test.mjs';
    const [b, p] = await Promise.all([corre(base, fitxer), corre(paquet, fitxer)]);
    const tancament = [...p.resultats.keys()].find((k) => k.startsWith('dos cicles d’arrancada i tancament'));
    expect(tancament, `${[...p.resultats.keys()].join('\n')}\n${p.err.slice(0, 2000)}`).toBeTruthy();
    expect(b.resultats.get(tancament), b.err.slice(0, 2000)).toBe('pass');
    expect(p.resultats.get(tancament), p.err.slice(0, 2000)).toBe('pass');
    expect([...b.resultats].filter(([k, e]) => regressa(e, p.resultats.get(k))).map(([k]) => k)).toEqual([]);
  }, 10 * 60 * 1000);
});
