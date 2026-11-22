import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTA = fileURLToPath(new URL('../tooling/gates/tractor-rutes.mjs', import.meta.url));
const PROVEIDOR = readFileSync(new URL('../tooling/lib/arrel.mjs', import.meta.url), 'utf8');
const WIKI = ['_wiki', 'de', 'poble'].join('_');

function corre(text, rel = 'tooling/lib/arrel.mjs') {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-r3236-rutes-'));
  try {
    const fitxers = {
      'tooling/wiki/lib/project_paths.mjs': 'export const ESCRIPTORI_DIR = "x";\nexport const WIKI_DIR = "y";\n',
      [rel]: text,
    };
    for (const [fitxer, contingut] of Object.entries(fitxers)) {
      const desti = path.join(arrel, fitxer);
      mkdirSync(path.dirname(desti), { recursive: true });
      writeFileSync(desti, contingut);
    }
    const r = spawnSync(process.execPath, [PORTA, '--detall'], { cwd: arrel, encoding: 'utf8' });
    const eixida = `${r.stdout}${r.stderr}`;
    return { status: r.status, eixida, orfes: Number(eixida.match(/R1 literal de ruta orfe\s*:\s*(\d+)/)?.[1]) };
  } finally {
    rmSync(arrel, { recursive: true, force: true });
  }
}

test('el proveïdor real pot declarar els seus nou literals canònics', () => {
  const r = corre(PROVEIDOR);
  assert.equal(r.orfes, 0, r.eixida);
  assert.equal(r.status, 0, r.eixida);
});

test('un consumidor afegit al mateix proveïdor continua fallant', () => {
  const r = corre(`${PROVEIDOR}\nexport function malaRuta() { return '${WIKI}/fora'; }\n`);
  assert.equal(r.orfes, 1, r.eixida);
  assert.equal(r.status, 1, r.eixida);
});

test('un literal alié en la mateixa línia no queda ocult per la declaració', () => {
  const r = corre(PROVEIDOR.replace(`wiki: '${WIKI}',`, `wiki: '${WIKI}', estranya: '${WIKI}/fora',`));
  assert.equal(r.orfes, 1, r.eixida);
  assert.equal(r.status, 1, r.eixida);
});

test('un valor canònic incorrecte no queda exempt', () => {
  const r = corre(PROVEIDOR.replace(`wiki: '${WIKI}',`, `wiki: '${WIKI}/incorrecte',`));
  assert.equal(r.orfes, 1, r.eixida);
  assert.equal(r.status, 1, r.eixida);
});

test('una propietat desconeguda de CAMINS no queda exempta', () => {
  const r = corre(PROVEIDOR.replace("agents: '.agents',", `agents: '.agents',\n  inesperada: '${WIKI}/fora',`));
  assert.equal(r.orfes, 1, r.eixida);
  assert.equal(r.status, 1, r.eixida);
});

test('copiar el proveïdor a un altre fitxer no crea una exempció', () => {
  const r = corre(PROVEIDOR, 'tooling/lib/copia.mjs');
  assert.equal(r.orfes, 9, r.eixida);
  assert.equal(r.status, 1, r.eixida);
});

test('un proveïdor que no es pot analitzar conserva tots els diagnòstics', () => {
  const r = corre(`${PROVEIDOR}\nconst trencat = ;\n`);
  assert.equal(r.orfes, 9, r.eixida);
  assert.equal(r.status, 1, r.eixida);
});

test('CORROBORADORS només declara cami: una nota en la mateixa línia continua fallant', () => {
  const r = corre(PROVEIDOR.replace("nota: 'Wiki d\\'Obsidian; pot ser un repositori separat'", `nota: '${WIKI}/no-es-un-cami'`));
  assert.equal(r.orfes, 1, r.eixida);
  assert.equal(r.status, 1, r.eixida);
});
