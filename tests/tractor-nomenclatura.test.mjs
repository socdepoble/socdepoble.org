/* Porta Nomenclatura · N2 RUTA-MORTA (Ordre del Mestre, 30-10-2026). L'arrel de la wiki compta
   només com a nom sencer: l'arxiu fred germà («../_arxiu_» + l'arrel) és fora de l'arbre i no és
   cap ruta morta; les rutes mortes reals de la wiki continuen caient. N1 no es toca (Decisió del
   Mestre, 30-10-2026: després del commit). Fixture temporal amb la seua nomenclatura.json. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTA = fileURLToPath(new URL('../tooling/wiki/tractor-nomenclatura.mjs', import.meta.url));
const WIKI = ['_wiki', 'de', 'poble'].join('_');
const CONFIG = { esquema: 'sdp.nomenclatura.v1', arrels_wiki: [WIKI], arrels_codi: ['tooling'], exempts_nom: {}, exempts_patro: [], rutes_absents_tolerades: [] };

function corre(fitxers) {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-nomenclatura-'));
  try {
    const tots = {
      '.agents/AGENTS.md': '# fixture\n',
      'tooling/wiki/nomenclatura.json': JSON.stringify(CONFIG),
      [`${WIKI}/01_ser/index.md`]: '# índex\n',
      ...fitxers
    };
    for (const [rel, text] of Object.entries(tots)) {
      mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
      writeFileSync(path.join(arrel, rel), text);
    }
    const r = spawnSync(process.execPath, [PORTA, `--arrel=${arrel}`, '--json'], { encoding: 'utf8', env: { PATH: process.env.PATH } });
    let informe = null;
    /* Amb --json la porta imprimix l'informe (acaba en una línia «}») i, si passa, una línia de veredicte. */
    try { informe = JSON.parse(r.stdout.slice(0, r.stdout.lastIndexOf('\n}') + 2)); } catch { /* l'asserció ho dirà */ }
    return { status: r.status, eixida: `${r.stdout}${r.stderr}`, informe };
  } finally {
    rmSync(arrel, { recursive: true, force: true });
  }
}

const PODA = `/**\n * Sub-lot 2A -> ../_arxiu${WIKI}/02_investigacio_ia/\n * Manifest a ../_arxiu${WIKI}/00_manifest_arxiu_fred.json\n */\nconst VIVA = '${WIKI}/01_ser/index.md';\n`;

test('N2: les dues formes de l’arxiu fred germà no són rutes mortes; una ruta viva de la wiki tampoc', () => {
  const r = corre({ 'tooling/maquinaria/poda.mjs': PODA });
  assert.equal(r.status, 0, r.eixida);
  assert.deepEqual(r.informe.fallades.N2, []);
  assert.equal(r.informe.compte.N2, 0);
});

test('N2: les rutes mortes reals de la wiki encara cauen, també darrere de «../»', () => {
  const r = corre({
    'tooling/maquinaria/poda.mjs': PODA,
    'tooling/morta.mjs': `const A = '${WIKI}/01_Produccio/x.md';\nconst B = '../${WIKI}/99_inexistent';\n`
  });
  assert.equal(r.status, 1, r.eixida);
  /* La porta cita el primer segment de sota l'arrel (RE_RUTA). */
  assert.deepEqual(r.informe.fallades.N2.map((n) => n.ruta).sort(), [`${WIKI}/01_Produccio`, `${WIKI}/99_inexistent`]);
  for (const n of r.informe.fallades.N2) assert.deepEqual(n.citada_per, ['tooling/morta.mjs']);
});
