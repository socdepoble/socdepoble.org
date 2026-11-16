/**
 * D-R30-14 (aprovada pel Mestre el 16-11-2026 a les 14:32) · Enllaços vius cap a l'arxiu històric.
 *
 * CAMINS.arxiuHistoric no es versiona (D-R27-4) i l'arbre preparat del hook (git-staged.mjs) només en
 * porta la part versionada. L'SCC accepta un enllaç a l'arxiu si el destí existix al disc local; dins
 * de l'arbre preparat, eixe disc és el de l'arrel viva, acreditada per procedència (SDP_PRE_COMMIT=1 i
 * el magatzem d'objectes que l'arbre preparat manlleva per .git/objects/info/alternates), mai per una
 * variable sola. Un destí absent, ambigu, fora de l'arxiu o simbòlic continua sent LINK_INVALID; un
 * nom sol no es busca mai a l'arxiu, i de l'arxiu només es mira l'existència (ni es llig ni es llista).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CAMINS, MARCADOR } from '../tooling/lib/arrel.mjs';
import { VerificadorSCC, arrelVivaDelHook, magatzemGit } from '../tooling/gates/verificador-scc.mjs';
import { REPO } from './helpers/documental.mjs';

const ARXIU = CAMINS.arxiuHistoric;
const INDEX = CAMINS.indexEscriptori;
const NOM = '261115_2318_auditoria_claude_r30_contractes';
const SESSIO = '261020_Sessio_Salfumant_i_El_Comu';
const HOOK = Object.freeze({ SDP_PRE_COMMIT: '1' });

function tmp(t, prefix) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  t.after(() => {
    // Les proves de permisos lleven la lectura de l'arxiu: es restituïx abans d'esborrar.
    try { fs.chmodSync(path.join(dir, ARXIU), 0o755); } catch { /* sense arxiu */ }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}
const put = (root, rel, text = '# Nota\n') => {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text);
};
/** Wiki mínima que l'SCC dona per bona: índex canònic, índex de l'Escriptori i el marcador del Mas. */
function wiki(root, enllacos) {
  put(root, MARCADOR, '# BIOS\n');
  put(root, `${CAMINS.wiki}/00_index.md`, '# Índex\n\n[[00_index_escriptori]]\n');
  put(root, INDEX, `# Escriptori\n\n${enllacos.join('\n')}\n`);
}
/** Repositori viu: .git real (carpeta) amb el seu magatzem d'objectes i, a l'arxiu, `arxivats`. */
function viu(t, enllacos, arxivats = [`${NOM}.md`]) {
  const root = tmp(t, 'sdp d-r30-14 viu ');
  wiki(root, enllacos);
  fs.mkdirSync(path.join(root, '.git/objects/info'), { recursive: true });
  for (const rel of arxivats) put(root, `${ARXIU}/${rel}`, '# Arxivat\n');
  return root;
}
/** Arbre preparat com el de git-staged.mjs: els mateixos documents vius, sense l'arxiu, i alternates cap al magatzem `objectes`. */
function preparat(t, enllacos, objectes) {
  const root = tmp(t, 'sdp d-r30-14 index ');
  wiki(root, enllacos);
  fs.mkdirSync(path.join(root, '.git/objects/info'), { recursive: true });
  if (objectes !== undefined) fs.writeFileSync(path.join(root, '.git/objects/info/alternates'), `${objectes}\n`);
  return root;
}
const audita = (root, env = {}) => new VerificadorSCC(root, { env }).runAudits();
const invalids = (r) => r.errors.filter((e) => e.code === 'LINK_INVALID');

const ENLLACOS_ARXIU = [
  `- [[../90_arxiu_historic/${NOM}|${NOM}]]`,
  `- [t](../90_arxiu_historic/${NOM}.md)`,
  `- [[../90_arxiu_historic/${NOM}#Secció|àlies]]`,
  `- [[../90_arxiu_historic/${SESSIO}/${NOM}]]`,
];

test('D-R30-14 · fora del hook, el disc local decidix: destí present vàlid, destí absent LINK_INVALID amb el motiu', async (t) => {
  const root = viu(t, ENLLACOS_ARXIU, [`${NOM}.md`, `${SESSIO}/${NOM}.md`]);
  const r = await audita(root);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
  assert.deepEqual(r.arxiuHistoric, { acceptatsDesDeLArrelViva: 0, arrelViva: null, motiu: "fora de l'arbre preparat del pre-commit (SDP_PRE_COMMIT no és 1)" });

  fs.rmSync(path.join(root, ARXIU, `${NOM}.md`));
  const roig = invalids(await audita(root));
  assert.equal(roig.length, 6, JSON.stringify(roig)); // 3 enllaços al destí esborrat × (ancoratge + graf)
  for (const e of roig) assert.match(e.message, /^Enllaç inexistent: .* · arxiu històric \(D-R30-14\): el destí no existix a l'arxiu del disc local$/);
});

test('D-R30-14 · a l’arbre preparat del hook, els destins no versionats es comproven al disc de l’arrel viva', async (t) => {
  const viva = viu(t, ENLLACOS_ARXIU, [`${NOM}.md`, `${SESSIO}/${NOM}.md`]);
  const index = preparat(t, ENLLACOS_ARXIU, path.join(viva, '.git/objects'));

  // Sense el fix (o fora del pre-commit), l'arbre preparat els veu trencats: és el roig de D-R30-14.
  assert.equal(invalids(await audita(index)).length, 2 * ENLLACOS_ARXIU.length);

  const r = await audita(index, HOOK);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
  assert.equal(r.arxiuHistoric.arrelViva, viva);
  assert.equal(r.arxiuHistoric.motiu, null);
  // Cada enllaç es resol dues voltes (ancoratge de l'Escriptori i graf).
  assert.equal(r.arxiuHistoric.acceptatsDesDeLArrelViva, 2 * ENLLACOS_ARXIU.length);
});

test('D-R30-14 · un destí inventat continua roig, també amb l’arrel viva acreditada', async (t) => {
  const enllacos = [`- [[../90_arxiu_historic/${NOM}|${NOM}]]`, '- [[../90_arxiu_historic/261116_9999_inventat|inventat]]', '- [t](../90_arxiu_historic/261116_9999_inventat.md)'];
  const viva = viu(t, enllacos);
  const index = preparat(t, enllacos, path.join(viva, '.git/objects'));
  const roig = invalids(await audita(index, HOOK));
  assert.equal(roig.length, 4, JSON.stringify(roig)); // 2 enllaços × (ancoratge + graf)
  for (const e of roig) {
    assert.ok(e.message.includes('261116_9999_inventat.md'), e.message);
    assert.ok(e.message.endsWith(`el destí no és cap fitxer regular (sense symlink) de l'arxiu de l'arrel viva ${viva}`), e.message);
  }
});

test('D-R30-14 · cap rescat fora de l’arxiu, per nom sol, per directori, per symlink o fora de l’arrel', async (t) => {
  const fora = tmp(t, 'sdp d-r30-14 fora ');
  put(fora, 'secret.md', '# Fora\n');
  const PREPARADA = '261116_Sessio_Preparada';
  const enllacos = [
    `- [[${NOM}]]`, // nom sol: l'arxiu no es llista mai
    '- [[../10_actes/inexistent]]', // fora de l'arxiu: l'error de sempre, sense motiu
    '- [[../90_arxiu_historic/carpeta]]', // a l'arrel viva és una carpeta, no un fitxer
    '- [[../90_arxiu_historic/simbolic]]', // fitxer simbòlic
    '- [[../90_arxiu_historic/261116_Sessio_Simbolica/secret]]', // carpeta simbòlica cap a fora de l'arxiu
    '- [t](../90_arxiu_historic/../../../fora.md)', // camí que ix de l'arrel sense tocar l'arxiu (no arriba a la guarda dels candidats)
    // Guarda dels candidats de destiArxiuHistoric: si un candidat ix de l'arrel, no hi ha rescat ni consulta al disc,
    // encara que un altre candidat caiga a l'arxiu i el destí hi existisca a l'arrel viva (paritat amb resolveDocumentLink).
    `- [[q/../../90_arxiu_historic/${NOM}]]`, // eixida lèxica: un dels tres candidats penja del pare de l'arrel
    `- [t](../90_arxiu_historic/${PREPARADA}/${NOM}.md)`, // eixida canònica: a l'arbre preparat la carpeta és un symlink cap a fora
  ];
  const viva = viu(t, enllacos);
  fs.mkdirSync(path.join(viva, ARXIU, 'carpeta.md'));
  fs.symlinkSync(path.join(viva, ARXIU, `${NOM}.md`), path.join(viva, ARXIU, 'simbolic.md'));
  fs.symlinkSync(fora, path.join(viva, ARXIU, '261116_Sessio_Simbolica'), 'dir');
  put(viva, `${ARXIU}/${PREPARADA}/${NOM}.md`, '# Arxivat\n'); // a l'arrel viva sí que és un fitxer regular de l'arxiu
  const index = preparat(t, enllacos, path.join(viva, '.git/objects'));
  fs.mkdirSync(path.join(index, ARXIU), { recursive: true });
  fs.symlinkSync(fora, path.join(index, ARXIU, PREPARADA), 'dir');
  const r = await audita(index, HOOK);
  assert.equal(r.arxiuHistoric.acceptatsDesDeLArrelViva, 0);
  const missatges = invalids(r).map((e) => e.message);
  assert.equal(missatges.length, 2 * enllacos.length, missatges.join('\n'));
  // Cada enllaç es resol dues voltes (ancoratge de l'Escriptori i graf): el missatge exacte hi ha d'aparéixer dues voltes.
  const dues = (missatge, llista = missatges) => assert.equal(llista.filter((m) => m === missatge).length, 2, `${missatge}\n---\n${llista.join('\n')}`);
  assert.ok(missatges.includes(`Enllaç inexistent: ${NOM}.md`), 'el nom sol no porta motiu de l’arxiu: no s’hi ha buscat');
  assert.ok(missatges.includes('Enllaç inexistent: ../10_actes/inexistent.md'));
  dues('Enllaç fora de l’arrel: ../90_arxiu_historic/../../../fora.md');
  // Sense motiu de l'arxiu: la guarda torna l'error de sempre abans de mirar l'arrel viva.
  dues(`Enllaç inexistent: q/../../90_arxiu_historic/${NOM}.md`);
  dues(`Enllaç fora de l’arrel: ../90_arxiu_historic/${PREPARADA}/${NOM}.md`);
  // El hook no és més permissiu que l'execució in situ: amb l'arxiu present, l'eixida lèxica també hi és roja.
  const situ = invalids(await audita(viva)).map((e) => e.message);
  dues(`Enllaç fora de l’arrel: q/../../90_arxiu_historic/${NOM}.md`, situ);
  for (const nom of ['carpeta.md', 'simbolic.md', 'secret.md']) {
    assert.ok(missatges.some((m) => m.includes(nom) && m.includes("el destí no és cap fitxer regular (sense symlink) de l'arxiu de l'arrel viva")), `${nom}\n${missatges.join('\n')}`);
  }
});

test('D-R30-14 · l’arrel viva s’acredita per procedència, mai per una variable sola', async (t) => {
  const enllacos = [`- [[../90_arxiu_historic/${NOM}|${NOM}]]`];
  const viva = viu(t, enllacos);
  // Un altre Mas amb el mateix destí arxivat: SDP_ARREL_VIVA hi apunta, però l'arbre preparat no en manlleva el magatzem.
  const impostora = viu(t, enllacos);
  const index = preparat(t, enllacos, path.join(viva, '.git/objects'));
  assert.deepEqual(arrelVivaDelHook(index, HOOK), { cami: viva, motiu: null }, 'la procedència bona sí que val');
  const casos = [
    [{ ...HOOK, SDP_ARREL_VIVA: impostora }, `l'arbre preparat no manlleva el magatzem d'objectes de ${impostora} (${path.join(impostora, '.git/objects')} ≠ ${path.join(viva, '.git/objects')})`],
    [{ ...HOOK, SDP_ARREL_VIVA: 'relativa/al/cwd' }, 'SDP_ARREL_VIVA ha de ser un camí absolut'],
    [{ ...HOOK, SDP_ARREL_VIVA: index }, "l'arrel viva és l'arbre preparat mateix"],
    [{ SDP_PRE_COMMIT: 'true' }, "fora de l'arbre preparat del pre-commit (SDP_PRE_COMMIT no és 1)"],
    [{ SDP_ARREL_VIVA: viva }, "fora de l'arbre preparat del pre-commit (SDP_PRE_COMMIT no és 1)"],
  ];
  for (const [env, motiu] of casos) {
    assert.deepEqual(arrelVivaDelHook(index, env), { cami: null, motiu }, JSON.stringify(env));
    assert.equal((await audita(index, env)).valid, false, JSON.stringify(env));
  }
  // Sense alternates, amb dues línies o cap a un magatzem absent: no hi ha procedència.
  const sense = preparat(t, enllacos);
  assert.deepEqual(arrelVivaDelHook(sense, HOOK), { cami: null, motiu: "l'arbre preparat no porta .git/objects/info/alternates" });
  const dues = preparat(t, enllacos, `${path.join(viva, '.git/objects')}\n${path.join(impostora, '.git/objects')}`);
  assert.deepEqual(arrelVivaDelHook(dues, HOOK), { cami: null, motiu: '.git/objects/info/alternates ha de tindre una sola línia i en té 2' });
  const absent = preparat(t, enllacos, path.join(viva, 'no-hi-es/objects'));
  assert.deepEqual(arrelVivaDelHook(absent, HOOK), { cami: null, motiu: "el magatzem d'objectes de .git/objects/info/alternates no existix" });
  // Un magatzem que no penja d'un arbre de treball (repositori nu) només val amb SDP_ARREL_VIVA.
  const nu = tmp(t, 'sdp d-r30-14 nu ');
  fs.mkdirSync(path.join(nu, 'objects'));
  const delNu = preparat(t, enllacos, path.join(nu, 'objects'));
  assert.match(arrelVivaDelHook(delNu, HOOK).motiu, /no és el d'un arbre de treball/);
  // Un directori sense el marcador del Mas no és una arrel viva.
  fs.rmSync(path.join(viva, MARCADOR));
  assert.deepEqual(arrelVivaDelHook(index, HOOK), { cami: null, motiu: `${viva} no porta el marcador ${MARCADOR}` });
  const r = await audita(index, HOOK);
  assert.ok(invalids(r).every((e) => e.message.endsWith(`arrel viva no acreditada (${viva} no porta el marcador ${MARCADOR})`)), JSON.stringify(r.errors));
});

test('D-R30-14 · worktree: SDP_ARREL_VIVA el fixa amb la mateixa prova; sense ella, mana l’arbre principal del magatzem', async (t) => {
  const enllacos = [`- [[../90_arxiu_historic/${NOM}|${NOM}]]`];
  const principal = viu(t, enllacos, []); // l'arbre principal no té el destí
  const wt = tmp(t, 'sdp d-r30-14 worktree ');
  wiki(wt, enllacos);
  put(wt, `${ARXIU}/${NOM}.md`, '# Arxivat al worktree\n');
  const gitdir = path.join(principal, '.git/worktrees/wt');
  fs.mkdirSync(gitdir, { recursive: true });
  fs.writeFileSync(path.join(gitdir, 'commondir'), '../..\n');
  fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${gitdir}\n`);
  assert.equal(magatzemGit(wt), magatzemGit(principal));
  // Com git-staged.mjs des d'un worktree: `git rev-parse --git-path objects` és el magatzem comú.
  const index = preparat(t, enllacos, path.join(principal, '.git/objects'));

  const ambVariable = await audita(index, { ...HOOK, SDP_ARREL_VIVA: wt });
  assert.equal(ambVariable.valid, true, JSON.stringify(ambVariable.errors));
  assert.equal(ambVariable.arxiuHistoric.arrelViva, wt);

  const senseVariable = await audita(index, HOOK);
  assert.equal(senseVariable.arxiuHistoric.arrelViva, principal);
  assert.equal(senseVariable.valid, false, 'l’arbre principal no té el destí: roig');
  put(principal, `${ARXIU}/${NOM}.md`, '# Arxivat a l’arbre principal\n');
  assert.equal((await audita(index, HOOK)).valid, true);
});

test('D-R30-14 · de l’arxiu només es mira l’existència: ni es llig cap document ni es llista cap carpeta', { skip: process.getuid?.() === 0 && 'root ignora els permisos' }, async (t) => {
  const viva = viu(t, ENLLACOS_ARXIU, [`${NOM}.md`, `${SESSIO}/${NOM}.md`]);
  const index = preparat(t, ENLLACOS_ARXIU, path.join(viva, '.git/objects'));
  const sessio = path.join(viva, ARXIU, SESSIO);
  fs.chmodSync(path.join(viva, ARXIU, `${NOM}.md`), 0o000);
  fs.chmodSync(path.join(sessio, `${NOM}.md`), 0o000);
  fs.chmodSync(sessio, 0o311);
  fs.chmodSync(path.join(viva, ARXIU), 0o311); // es pot travessar, no es pot llistar
  let r;
  try {
    assert.throws(() => fs.readdirSync(path.join(viva, ARXIU)), { code: 'EACCES' });
    assert.throws(() => fs.readdirSync(sessio), { code: 'EACCES' });
    assert.throws(() => fs.readFileSync(path.join(viva, ARXIU, `${NOM}.md`)), { code: 'EACCES' });
    r = await audita(index, HOOK);
  } finally { fs.chmodSync(sessio, 0o755); }
  assert.equal(r.valid, true, JSON.stringify(r.errors));
  assert.equal(r.arxiuHistoric.acceptatsDesDeLArrelViva, 2 * ENLLACOS_ARXIU.length);
});

test('D-R30-14 · el wikilink amb carpeta i sense ./ també es resol a l’arxiu viu; l’ambigu continua roig', async (t) => {
  const enllacos = [`- [[90_arxiu_historic/${NOM}]]`];
  const viva = viu(t, enllacos);
  put(viva, `${CAMINS.wiki}/00_index.md`, `# Índex\n\n[[00_index_escriptori]]\n[[90_arxiu_historic/${NOM}]]\n`);
  const index = preparat(t, enllacos, path.join(viva, '.git/objects'));
  put(index, `${CAMINS.wiki}/00_index.md`, `# Índex\n\n[[00_index_escriptori]]\n[[90_arxiu_historic/${NOM}]]\n`);
  // Des de 04_escriptori, «90_arxiu_historic/X» no penja de la carpeta del document, però sí de la Wiki.
  const r = await audita(index, HOOK);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
  // Si l'arbre auditat també porta un homònim a l'arrel, l'enllaç és ambigu (com fora del hook).
  put(index, `90_arxiu_historic/${NOM}.md`, '# Homònim a l’arrel\n');
  const ambigu = invalids(await audita(index, HOOK));
  assert.ok(ambigu.length > 0 && ambigu.every((e) => /^Enllaç ambigu: /.test(e.message)), JSON.stringify(ambigu));
});

test('D-R30-14 · CLI dins del hook: el procés llig SDP_PRE_COMMIT i acredita l’arrel viva amb Git real', (t) => {
  const enllacos = [`- [[../90_arxiu_historic/${NOM}|${NOM}]]`];
  const viva = tmp(t, 'sdp d-r30-14 git ');
  const entorn = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_') && !k.startsWith('SDP_')));
  const git = (args, cwd) => spawnSync('git', args, { cwd, env: entorn, encoding: 'utf8' });
  if (git(['init', '--quiet'], viva).status !== 0) return t.skip('git no disponible');
  wiki(viva, enllacos);
  put(viva, `${ARXIU}/${NOM}.md`, '# Arxivat\n');
  // El mateix càlcul que git-staged.mjs: path.resolve(PROJECT_DIR, git rev-parse --git-path objects).
  const objectes = path.resolve(viva, git(['rev-parse', '--git-path', 'objects'], viva).stdout.trim());
  const index = preparat(t, enllacos, objectes);
  const cli = path.join(REPO, 'tooling/gates/verificador-scc.mjs');
  const dins = spawnSync(process.execPath, [cli], { cwd: index, env: { ...entorn, SDP_ARREL: index, SDP_PRE_COMMIT: '1' }, encoding: 'utf8' });
  assert.equal(dins.status, 0, dins.stderr);
  const eixida = JSON.parse(dins.stdout);
  assert.equal(eixida.arxiuHistoric.arrelViva, viva);
  assert.equal(eixida.arxiuHistoric.acceptatsDesDeLArrelViva, 2);
  const fora = spawnSync(process.execPath, [cli], { cwd: index, env: { ...entorn, SDP_ARREL: index }, encoding: 'utf8' });
  assert.equal(fora.status, 1, 'sense SDP_PRE_COMMIT, l’arbre preparat continua roig');
  assert.match(fora.stderr, /arxiu històric \(D-R30-14\): el destí no existix a l'arxiu del disc local/);
});

/* R32 · D-R30-14-bis · La zona humana 04_escriptori/01_produccio/ també és ignorada per Git (D-R27-4): l'índex
   de l'Escriptori hi enllaça i l'arbre preparat no la porta. La mateixa regla: existència al disc de l'arrel
   viva, només en el hook acreditat; un destí inventat continua roig. */
test('D-R30-14-bis · la zona humana 01_produccio es comprova al disc de l’arrel viva, i un destí inventat continua roig', async (t) => {
  const PRODUCCIO = `${CAMINS.escriptori}/01_produccio`;
  const enllacos = ['- [captura](01_produccio/261020_captura.png)', '- [[01_produccio/261020_nota]]'];
  const viva = viu(t, enllacos);
  put(viva, `${PRODUCCIO}/261020_captura.png`, 'PNG');
  put(viva, `${PRODUCCIO}/261020_nota.md`, '# Nota humana\n');
  const index = preparat(t, enllacos, path.join(viva, '.git/objects'));
  assert.equal(invalids(await audita(index)).length, 2 * enllacos.length);
  const r = await audita(index, HOOK);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
  assert.equal(r.arxiuHistoric.acceptatsDesDeLArrelViva, 2 * enllacos.length);

  const inventats = ['- [captura](01_produccio/261020_inventada.png)'];
  const viva2 = viu(t, inventats);
  const index2 = preparat(t, inventats, path.join(viva2, '.git/objects'));
  assert.equal(invalids(await audita(index2, HOOK)).length, 2);
});
