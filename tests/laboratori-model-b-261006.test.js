// @vitest-environment node
/** Corredor del laboratori T4 · Model B (261006_0300_ledger_claude/t4_model_b), segona onada.
 *
 *  Decisió del Mestre (261006, xat): candidata S amb la variant final, «ADR + port
 *  neutral», i l'ADR-2026-09 signada. La Wiki i src/ ja porten els canvis (Edit). El
 *  paquet de governança (nous/: AGENTS.md, el seu mirall, QUI_SOC.md i
 *  protocolledge.json) l'aplica el Mestre amb executor-mutacio.mjs i una lease.
 *  Este corredor comprova, sense escriure res al repositori:
 *    · que cada fitxer de nous/ és l'original del tall amb les substitucions de
 *      substitucions.json i res més, i que el mirall porta els mateixos bytes;
 *    · que BASES és el sha256 del disc, que una base falsa és deriva i que el pla
 *      passa validatePlan de l'executor;
 *    · que la frase canònica és idèntica, una sola vegada, als quatre llocs
 *      (AGENTS.md, el mirall, la plantilla prompt_local i l'ADR-2026-09);
 *    · que el contracte carrega amb la plantilla del disc i la versió 3.4.0, i que
 *      porta-autoritat donaria valid:true amb el paquet aplicat;
 *    · que la Petorreta passa validatePetorreta i que comprova, preparaSessio i la
 *      CLI funcionen d'extrem a extrem (sessió fictícia en un directori temporal);
 *    · que el que esta onada ha escrit a la Wiki i a src/ hi és, i que al codi
 *      només han canviat comentaris i el títol d'una prova.
 *
 *  Fa skip quan el paquet ja és al disc o l'executor ja n'ha deixat la transacció:
 *  llavors s'ha de retirar en el mateix commit.
 */
import { describe, expect, test, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0300_ledger_claude/t4_model_b';
const LAB = path.join(REPO, REL_LAB);
const NOUS = path.join(LAB, 'nous');
const PLANTILLA = '_wiki_de_poble/03_actuar/plantilles/prompt_local.md';
const ADR = '_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md';
const llig = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const sha = (valor) => createHash('sha256').update(valor).digest('hex');

/** Fitxers de nous/, recursiu, amb la ruta real (.md.txt → .md). */
function fitxersDe(dir, rel = '') {
  if (!fs.existsSync(path.join(dir, rel))) return [];
  return fs.readdirSync(path.join(dir, rel), { withFileTypes: true })
    .filter((e) => e.name !== '.DS_Store')
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((e) => {
      const r = rel ? `${rel}/${e.name}` : e.name;
      return e.isDirectory() ? fitxersDe(dir, r) : [r];
    });
}
const PAQUET = fitxersDe(NOUS).map((nou) => ({ nou, ruta: nou.endsWith('.md.txt') ? nou.slice(0, -'.txt'.length) : nou }));
const nouDe = (ruta) => fs.readFileSync(path.join(NOUS, PAQUET.find((f) => f.ruta === ruta).nou), 'utf8');

function transaccioFeta() {
  const dir = path.join(REPO, '.agents/seal-transactions');
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).some((n) => {
    try {
      const t = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8'));
      return t?.state === 'accepted' && String(t.operationId).startsWith('sdp-model-b-enx01-261006-');
    } catch { return false; }
  });
}

const APLICAT = PAQUET.length > 0 && PAQUET.every((f) => fs.existsSync(path.join(REPO, f.ruta)) && llig(f.ruta) === nouDe(f.ruta));
const ACTIU = PAQUET.length > 0 && fs.existsSync(path.join(LAB, 'prepara-pla.mjs')) && !APLICAT && !transaccioFeta();
const DADES = ACTIU ? JSON.parse(fs.readFileSync(path.join(LAB, 'substitucions.json'), 'utf8')) : null;
const FRASE = DADES?.frase ?? '';
const carregaLab = () => import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href);
const carregaCore = () => import(pathToFileURL(path.join(REPO, 'tooling/documental/core.mjs')).href);

/** El codi sense comentaris de bloc ni de línia: si coincidix, només han canviat comentaris. */
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
/** Enllaços Markdown relatius, tal com els llig porta-autoritat.mjs:16. */
const enllacos = (text) => [...text.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map((m) => m[1]).filter((x) => !/^https?:/.test(x));
/** Cites `ruta[:línia]` amb barra d'un text. */
const cites = (text) => [...text.matchAll(/`([^`\s]+)`/g)].map((m) => m[1])
  .filter((c) => c.includes('/') && /^[\w./-]+(?::\d+(?:-\d+)?)?$/.test(c)).map((c) => c.replace(/:\d+(?:-\d+)?$/, ''));
const tmp = (prefix) => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
const escriu = (arrel, rel, text) => { fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true }); fs.writeFileSync(path.join(arrel, rel), text); };

describe.skipIf(!ACTIU)('laboratori 261006_0300 · T4 Model B · paquet de governança', () => {
  // L'única prova que escriu, i només dins de nous/: `npx vitest run tests/laboratori-model-b-261006.test.js --mode genera`.
  // Una còpia a mà no conserva els espais finals de línia dels originals; genera() sí.
  test.runIf(import.meta.env.MODE === 'genera')('genera nous/ des del disc del tall i les substitucions', async () => {
    const lab = await carregaLab();
    expect(lab.genera(REPO).sort()).toEqual(PAQUET.map((f) => f.nou).sort());
  });

  test('prepara-pla, este corredor i el codi tocat a src/ passen l’ESLint del repositori sense cap missatge', async () => {
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({ cwd: REPO });
    const fitxers = [`${REL_LAB}/prepara-pla.mjs`, 'tests/laboratori-model-b-261006.test.js',
      'src/data/contracte.js', 'src/data/conformitat/kit.js', 'src/data/contracte.test.js'];
    const missatges = [];
    for (const rel of fitxers) {
      const [r] = await eslint.lintText(llig(rel), { filePath: path.join(REPO, rel) });
      missatges.push(...r.messages.map((m) => `${rel}:${m.line} ${m.ruleId} ${m.message}`));
    }
    expect(missatges).toEqual([]);
  }, 120000);

  test('BASES és el sha256 del disc al tall i una base falsa és deriva', async () => {
    const lab = await carregaLab();
    expect(Object.keys(lab.BASES).sort()).toEqual(PAQUET.map((f) => f.ruta).sort());
    const actuals = Object.fromEntries(Object.keys(lab.BASES).map((r) => [r, sha(fs.readFileSync(path.join(REPO, r)))]));
    expect(lab.BASES, JSON.stringify(actuals, null, 2)).toEqual(actuals);
    expect(lab.estat(REPO).map((f) => `${f.ruta}:${f.estat}`)).toEqual(PAQUET.map((f) => `${f.ruta}:pendent`));
    const falsa = Object.fromEntries(Object.keys(lab.BASES).map((k) => [k, '0'.repeat(64)]));
    const deriva = lab.estat(REPO, { bases: falsa });
    expect(deriva.every((f) => f.estat === 'deriva' && /refés el paquet/.test(f.motiu))).toBe(true);
  });

  test('cada fitxer de nous/ és l’original del disc amb les substitucions de substitucions.json i res més', async () => {
    const lab = await carregaLab();
    const perFitxer = new Map();
    for (const s of DADES.governanca) perFitxer.set(s.fitxer, [...(perFitxer.get(s.fitxer) ?? []), s]);
    expect([...perFitxer.keys()].sort()).toEqual(PAQUET.map((f) => f.ruta).sort());
    for (const [ruta, subs] of perFitxer) {
      let esperat = llig(ruta);
      for (const s of subs) {
        expect(lab.compta(esperat, s.vell), `${s.id}: el text vell ha d'aparéixer una sola vegada a ${ruta}`).toBe(1);
        esperat = esperat.replace(s.vell, () => lab.expandix(s.nou, DADES));
      }
      const nou = nouDe(ruta);
      if (nou !== esperat) {
        const i = [...nou].findIndex((c, k) => c !== [...esperat][k]);
        throw new Error(`${ruta}: nous/ divergix del disc més les substitucions a partir del caràcter ${i}: «${[...nou].slice(i - 20, i + 40).join('')}» contra «${[...esperat].slice(i - 20, i + 40).join('')}»`);
      }
    }
    // El mirall: mateixos bytes que AGENTS.md, a nous/ i al disc d'ara (porta-autoritat.mjs:13).
    expect(fs.readFileSync(path.join(NOUS, '.agents/AGENTS.md.txt')).equals(fs.readFileSync(path.join(NOUS, 'AGENTS.md.txt')))).toBe(true);
    expect(fs.readFileSync(path.join(REPO, '.agents/AGENTS.md')).equals(fs.readFileSync(path.join(REPO, 'AGENTS.md')))).toBe(true);
  });

  test('la frase canònica és idèntica, una sola vegada i en la seua línia, als quatre llocs', async () => {
    const lab = await carregaLab();
    const governanca = new Set(PAQUET.map((f) => f.ruta));
    expect(Object.keys(DADES.llocsDeLaFrase).sort()).toEqual(['.agents/AGENTS.md', 'AGENTS.md', ADR, PLANTILLA].sort());
    for (const [ruta, forma] of Object.entries(DADES.llocsDeLaFrase)) {
      const text = governanca.has(ruta) ? nouDe(ruta) : llig(ruta);
      const linia = lab.expandix(forma, DADES);
      expect(lab.compta(text, FRASE), ruta).toBe(1);
      expect(text.split('\n').filter((l) => l === linia), ruta).toHaveLength(1);
    }
    expect(nouDe('AGENTS.md').split('\n')[52]).toBe(FRASE);
    // Línia 73: l'Historial de la plantilla té una línia més (v3.4.0).
    expect(llig(PLANTILLA).split('\n')[72]).toBe(`- ${FRASE}`);
    expect(llig(ADR).split('\n')[9]).toBe(`${FRASE} No hi ha escriptures creuades.`);
    expect(lab.precondicions(REPO)).toEqual([]);
    // Cites amb ruta dels textos nous de la governança: la ruta existix (tractor-doctrina).
    for (const s of DADES.governanca) for (const r of cites(lab.expandix(s.nou, DADES))) expect(fs.existsSync(path.join(REPO, r)), `${s.id}: ${r}`).toBe(true);
  });

  test('porta-autoritat: valid:true hui i també amb el paquet aplicat en una còpia', async () => {
    const { checkAuthority } = await import(pathToFileURL(path.join(REPO, 'tooling/gates/porta-autoritat.mjs')).href);
    expect(checkAuthority(REPO)).toEqual({ valid: true, errors: [] });
    expect(enllacos(nouDe('AGENTS.md'))).toEqual(enllacos(llig('AGENTS.md')));
    const arrel = tmp('sdp-t4-autoritat-');
    try {
      escriu(arrel, 'AGENTS.md', nouDe('AGENTS.md'));
      escriu(arrel, '.agents/AGENTS.md', nouDe('.agents/AGENTS.md'));
      escriu(arrel, '.agents/cervell.json', llig('.agents/cervell.json'));
      const mapa = JSON.parse(llig('.agents/cervell.json'));
      for (const rel of [...mapa.entrada, ...mapa.dimensions.map((x) => x.ruta), ...enllacos(nouDe('AGENTS.md'))]) {
        if (fs.existsSync(path.join(arrel, rel))) continue;
        if (fs.statSync(path.join(REPO, rel)).isDirectory()) fs.mkdirSync(path.join(arrel, rel), { recursive: true });
        else escriu(arrel, rel, '');
      }
      expect(checkAuthority(arrel)).toEqual({ valid: true, errors: [] });
    } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
  });

  test('el contracte carrega amb la plantilla del disc: hui 3.3.0 a la ruta, 3.4.0 amb el paquet', async () => {
    const core = await carregaCore();
    const hui = core.resolveRoute(core.loadContract(REPO, { route: 'prompt.local' }), { route: 'prompt.local' });
    expect(hui.version).toBe('3.3.0');
    expect(hui.fixedBlocks['Context Tècnic i Arquitectònic'].includes(`- ${FRASE}`)).toBe(true);
    const arrel = tmp('sdp-t4-contracte-');
    try {
      const router = JSON.parse(nouDe('.agents/protocolledge.json'));
      escriu(arrel, '.agents/protocolledge.json', nouDe('.agents/protocolledge.json'));
      escriu(arrel, 'tooling/wiki/schema.json', llig('tooling/wiki/schema.json'));
      for (const r of router.rutes) escriu(arrel, r.plantilla, llig(r.plantilla));
      const contracte = core.loadContract(arrel, { route: 'prompt.local' });
      const ruta = core.resolveRoute(contracte, { route: 'prompt.local' });
      expect(ruta.version).toBe('3.4.0');
      expect(ruta.fixedBlocks['Context Tècnic i Arquitectònic'].includes(`- ${FRASE}`)).toBe(true);
      expect(core.templateParity({ router: { rutes: [ruta] } })).toEqual([]);
      expect(llig(PLANTILLA)).toContain('| Versió del document | 3.4.0 |');
      expect(llig(PLANTILLA)).toContain('| Plantilla | prompt_local.md (v3.4.0) |');
      // Només canvia la versió de prompt.local: la resta del router és idèntica.
      const vell = JSON.parse(llig('.agents/protocolledge.json'));
      vell.rutes.find((r) => r.id === 'prompt.local').version = '3.4.0';
      expect(router).toEqual(vell);
    } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
  });

  test('el pla passa validatePlan de l’executor amb els quatre fitxers i la base del tall', async () => {
    const lab = await carregaLab();
    const { plan, targets, scopes, aplicats } = await lab.preparaPla(REPO);
    expect(plan.schema).toBe('sdp.mutation.v1');
    expect(plan.operationId.startsWith(lab.OPERACIO)).toBe(true);
    expect([...targets].sort()).toEqual(PAQUET.map((f) => f.ruta).sort());
    expect(aplicats).toEqual([]);
    for (const f of plan.files) {
      expect(f.before, f.path).toBe(lab.BASES[f.path]);
      expect(f.content, f.path).toBe(nouDe(f.path));
    }
    expect(scopes).toEqual(['.agents/AGENTS.md', '.agents/QUI_SOC.md', '.agents/protocolledge.json', 'AGENTS.md']);
  });

  test('precondició de la Wiki: sense la frase a la plantilla, el pla es nega', async () => {
    const lab = await carregaLab();
    const arrel = tmp('sdp-t4-pre-');
    try {
      for (const r of [...PAQUET.map((f) => f.ruta), ADR]) escriu(arrel, r, llig(r));
      escriu(arrel, PLANTILLA, llig(PLANTILLA).replace(`- ${FRASE}`, '- **Backend Intercanviable (Model B):** text vell.'));
      expect(lab.precondicions(arrel)).toEqual([`${PLANTILLA}: la frase canònica no hi és una sola vegada en la forma «- {{FRASE}}»`]);
      await expect(lab.preparaPla(arrel, { eines: REPO })).rejects.toThrow('Precondició de la Wiki incomplida');
    } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
  });

  test('la Petorreta passa validatePetorreta, té un títol de 8 a 12 paraules i ni ella ni el manifest porten patrons sensibles', async () => {
    const lab = await carregaLab();
    const { validatePetorreta } = await import(pathToFileURL(path.join(REPO, 'tooling/wiki/reflex_petorreta.mjs')).href);
    const paraules = /^\d{6}_\d{4}_PROMPT_(.+)\.md$/.exec(lab.NOM_PETORRETA)[1].split('_');
    expect(paraules.length).toBeGreaterThanOrEqual(8);
    expect(paraules.length).toBeLessThanOrEqual(12);
    const petorreta = lab.construeixPetorreta({ sessio: lab.SESSIO_ZERO, intentSha256: 'a'.repeat(64), rulesSha256: 'b'.repeat(64), planSha256: 'c'.repeat(64), targets: PAQUET.map((f) => f.ruta) });
    expect(validatePetorreta(path.join(REPO, '.sdp-reflex/bootstrap/x', lab.NOM_PETORRETA), petorreta)).toEqual([]);
    expect([...lab.sensibles(petorreta), ...lab.sensibles(lab.manifest()), ...lab.sensibles(llig(`${REL_LAB}/LLEGIU_PRIMER.txt`)),
      ...lab.sensibles(llig(`${REL_LAB}/CANDIDATES.txt`))]).toEqual([]);
  });

  test('d’extrem a extrem: comprova i preparaSessio amb una sessió fictícia, i les seues negatives', async () => {
    const lab = await carregaLab();
    const arrel = tmp('sdp-t4-sessio-');
    const sessio = '11111111-2222-4333-8444-555555555555';
    const desa = (s) => escriu(arrel, `.sdp-reflex/sessions/${sessio}.json`, JSON.stringify(s));
    const base = { status: 'open', risk: 'high', operations: ['governance-write'], scopes: ['.agents', 'AGENTS.md'],
      bootstrap: { path: `.sdp-reflex/bootstrap/${sessio}` }, intentSha256: 'a'.repeat(64), rulesDigest: 'b'.repeat(64) };
    const linies = [];
    const espia = vi.spyOn(console, 'log').mockImplementation((...a) => { linies.push(a.join(' ')); });
    try {
      for (const r of [...PAQUET.map((f) => f.ruta), PLANTILLA, ADR, `${REL_LAB}/LLEGIU_PRIMER.txt`]) escriu(arrel, r, llig(r));
      fs.mkdirSync(path.join(arrel, base.bootstrap.path), { recursive: true });
      desa(base);
      await lab.comprova(arrel, sessio, { eines: REPO });
      const eixida = linies.join('\n');
      expect(eixida).toContain('Pla vàlid: 4 fitxers');
      expect(eixida).toContain('Sessió vàlida. Petorreta i manifest passarien el seal.');
      expect(eixida).toContain(`node tooling/gates/executor-mutacio.mjs .sdp-reflex/plans/${sessio}.json .sdp-reflex/sessions/${sessio}.json`);
      const { plan, petorreta } = await lab.preparaSessio(arrel, sessio, { eines: REPO });
      expect(plan.session).toBe(sessio);
      expect(petorreta).toContain(`Plan-SHA256: ${sha(JSON.stringify(plan))}`);
      desa({ ...base, scopes: ['.agents'] });
      await expect(lab.preparaSessio(arrel, sessio, { eines: REPO })).rejects.toThrow('Targets fora dels scopes de la sessió: AGENTS.md');
      desa({ ...base, status: 'sealed' });
      await expect(lab.preparaSessio(arrel, sessio, { eines: REPO })).rejects.toThrow('La sessió no està oberta');
      desa({ ...base, risk: 'low' });
      await expect(lab.preparaSessio(arrel, sessio, { eines: REPO })).rejects.toThrow('--risk=high');
      expect(lab.parseArgs(['comprova', `--session=${sessio}`])).toEqual({ ordre: 'comprova', sessio });
      expect(() => lab.parseArgs(['comprova', '--candidata=S'])).toThrow('Argument desconegut');
      expect(() => lab.parseArgs(['aplica'])).toThrow('Ordre desconeguda');
    } finally {
      espia.mockRestore();
      fs.rmSync(arrel, { recursive: true, force: true });
    }
  });

  test('la CLI real (node prepara-pla.mjs comprova i manifest) ix amb 0 i imprimix el pla i l’ordre d’open', () => {
    const cli = path.join(LAB, 'prepara-pla.mjs');
    const comprova = spawnSync(process.execPath, [cli, 'comprova'], { cwd: REPO, encoding: 'utf8' });
    expect(comprova.status, comprova.stderr).toBe(0);
    expect(comprova.stdout).toContain('Pla vàlid: 4 fitxers');
    expect(comprova.stdout).toContain("Ordre d'open:");
    expect(comprova.stdout).toContain('--risk=high --operation=governance-write --scope=.agents/AGENTS.md --scope=.agents/QUI_SOC.md --scope=.agents/protocolledge.json --scope=AGENTS.md');
    const manifest = spawnSync(process.execPath, [cli, 'manifest'], { cwd: REPO, encoding: 'utf8' });
    expect(manifest.status, manifest.stderr).toBe(0);
    expect(JSON.parse(manifest.stdout).sources.map((s) => s.path)).toEqual([`${REL_LAB}/LLEGIU_PRIMER.txt`]);
  });

  test('el que esta onada ha aplicat a la Wiki i a src/ hi és; al codi només canvien comentaris i un títol', async () => {
    const lab = await carregaLab();
    for (const s of DADES.aplicat) {
      const text = llig(s.fitxer);
      expect(lab.compta(text, s.vell), `${s.id}: el text vell encara és a ${s.fitxer}`).toBe(0);
      expect(lab.compta(text, lab.expandix(s.nou, DADES)), `${s.id}: el text nou no és una sola vegada a ${s.fitxer}`).toBe(1);
    }
    const head = (rel) => execFileSync('git', ['show', `HEAD:${rel}`], { cwd: REPO, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    for (const rel of ['src/data/contracte.js', 'src/data/conformitat/kit.js']) expect(senseComentaris(llig(rel)), rel).toBe(senseComentaris(head(rel)));
    const titolVell = "test('R · un backend injectat sense recuperacioContrasenya (Sollutia) continua sent vàlid i no la pot cridar'";
    const titolNou = "test('R · un backend injectat sense recuperacioContrasenya continua sent vàlid i no la pot cridar'";
    expect(llig('src/data/contracte.test.js')).toBe(head('src/data/contracte.test.js').replace(titolVell, titolNou));
    // Les cites amb ruta dels textos aplicats apunten a fitxers vius.
    for (const s of DADES.aplicat) for (const r of cites(lab.expandix(s.nou, DADES))) {
      const candidats = [r, `src/data/adaptadors/sollutia/${r}`];
      expect(candidats.some((c) => fs.existsSync(path.join(REPO, c))), `${s.id}: ${r}`).toBe(true);
    }
  });

  test('les cites ruta:línia dels textos aplicats i de D5 apunten a codi viu', () => {
    const linies = (rel, de, fins = de) => llig(rel).split('\n').slice(de - 1, fins).join('\n');
    expect(linies('src/data/identitat.js', 486)).toContain('export function adoptaSessioExterna');
    expect(linies('src/data/adaptadors/sollutia/creaFrontissa.js', 60, 63)).toContain("credentials: 'omit'");
    expect(linies('src/data/adaptadors/sollutia/creaFrontissa.js', 60, 63)).not.toMatch(/Authorization/i);
    expect(linies('src/data/adaptadors/sollutia/client.js', 9)).toContain('ESCRIPTURES_PERMESES = Object.freeze([])');
    expect(linies('src/config/contracteAmfitrio.js', 108, 111)).toContain("prohibides: ['backend', 'backend_url', 'tenant_id']");
    expect(linies('src/host.js', 85, 110)).toContain('export function configura');
    expect(linies('src/host.js', 126)).toContain('export function injectaBackendDelPaquet');
    // D5: la Frontissa no es pot recórrer hui (CANDIDATES.txt §6).
    expect(linies('src/data/adaptadors/sollutia/recursos.js', 4, 15)).toContain('traductor:');
    expect(linies('src/data/adaptadors/sollutia/creaFrontissa.js', 19, 27)).toContain("typeof source.decode !== 'function'");
    expect(linies('src/data/adaptadors/sollutia/client.js', 4, 8)).toContain('resources: Object.freeze({})');
    expect(llig('src/data/adaptadors/sollutia/client.js')).not.toMatch(/from\s+['"][^'"]*recursos/);
    expect(llig('src/data/adaptadors/sollutia/client.js').split('\n').length - 1).toBe(17);
  });

  test('injectaBackendDelPaquet no té cap cridador productiu i la Frontissa no té cap consumidor', () => {
    const fonts = [];
    (function camina(dir) {
      for (const e of fs.readdirSync(path.join(REPO, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) camina(rel);
        else if (/\.(js|jsx|mjs)$/.test(e.name) && !/\.test\.(js|jsx|mjs)$/.test(e.name)) fonts.push(rel);
      }
    })('src');
    const cridadors = fonts.filter((f) => f !== 'src/host.js' && /injectaBackendDelPaquet\s*\(/.test(senseComentaris(llig(f))));
    // Només imports: wikiManifest.js cita la ruta dins del text publicat de la Wiki.
    const consumidors = fonts.filter((f) => !f.startsWith('src/data/adaptadors/sollutia/')
      && /(?:\bfrom\s*|\bimport\s*\(\s*)['"][^'"]*adaptadors\/sollutia\/client(?:\.js)?['"]/.test(senseComentaris(llig(f))));
    expect(cridadors).toEqual([]);
    expect(consumidors).toEqual([]);
  });

  test('efectes declarats: torns sense instantània caducats, Plantilla viva sobre el 0224 i frontmatter dels tres documents', async () => {
    // Pujar protocolledge canvia el hash del contracte: només afecta torns no tancats amb algun rebut sense instantània.
    const dir = path.join(REPO, '.agents/runtime/turns');
    const vius = [];
    for (const nom of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      let t;
      try { t = JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8')); } catch { continue; }
      if (t?.state === 'closed') continue;
      const rebuts = Object.values(t?.receipts ?? {});
      if (rebuts.length && !rebuts.every((r) => r.contractSnapshot) && Date.parse(t.expiresAt) >= Date.now()) vius.push(t.turn_id);
    }
    expect(vius, 'pujar protocolledge trencaria el tancament d’estos torns vius').toEqual([]);

    // Plantilla viva: el 0224 valida contra la plantilla viva només si el seu reflex no és del fitxer.
    const { inspecciona } = await import(pathToFileURL(path.join(REPO, 'tooling/gates/porta-plantilla-viva.mjs')).href);
    const rel = '_wiki_de_poble/04_escriptori/261006_0224_prompt_claude_ledger.md';
    if (fs.existsSync(path.join(REPO, rel))) {
      // Hui el reflex apunta a e0cdbec3, rebut de «…_petorreta_…»: la porta cau al reflex i, sense instantània,
      // valida contra la plantilla viva i hi suma el bloc normatiu. Amb un rebut del fitxer, cap dels dos.
      const [, torn, rebut] = /reflex: sdp:(torn_[0-9a-f-]+):([0-9a-f-]+)/.exec(llig(rel)) ?? [];
      const registre = torn ? JSON.parse(llig(`.agents/runtime/turns/${torn}.json`)) : null;
      const deUnAltre = registre?.receipts?.[rebut]?.file !== rel;
      const informe = inspecciona(REPO, rel);
      const alie = informe.errors.some((e) => e.startsWith('reflex: el rebut és de'));
      const bloc = informe.errors.includes('bloc normatiu alterat: «Context Tècnic i Arquitectònic» ha de ser còpia literal de la plantilla');
      expect([alie, bloc], JSON.stringify(informe.errors)).toEqual([deUnAltre, deUnAltre]);
      // La causa és la plantilla nova: el bloc del 0224 és el de la instantània del seu rebut.
      const instantania = registre?.receipts?.[rebut]?.contractSnapshot;
      if (instantania) {
        const core = await carregaCore();
        const ruta = core.readContract(REPO, instantania).router.rutes.find((r) => r.id === 'prompt.local');
        expect(core.sections(core.parseDocument(llig(rel)).body).get('Context Tècnic i Arquitectònic')).toBe(ruta.fixedBlocks['Context Tècnic i Arquitectònic']);
      }
    }

    // tractor-frontmatter: cap fallada als tres documents de la Wiki tocats per esta onada.
    const r = spawnSync(process.execPath, ['tooling/wiki/tractor-frontmatter.mjs', '--json'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const json = JSON.parse(r.stdout || 'null');
    expect(json, r.stderr).not.toBeNull();
    expect(Object.keys(json.fallades)).toEqual(expect.arrayContaining(['F1', 'F3', 'F9']));
    expect(json.documents).toBeGreaterThan(100);
    const meus = new Set([ADR, PLANTILLA, '_wiki_de_poble/02_saber/estandard_integracio_react.md']);
    const fallades = Object.entries(json.fallades).flatMap(([llei, items]) => items.filter((it) => meus.has(it.n)).map((it) => `${llei} ${it.n} ${it.clau ?? ''} ${it.detall ?? ''}`));
    expect(fallades).toEqual([]);
  }, 120000);
});
