/* Porta Crom · K4 RECTANGLE PUR (Ordre del Mestre, T15 260930; 30-10-2026).
   La barra lateral és un llistat a sang: `nav.app-sidebar .nav-item` i `.sidebar-control-btn`
   porten border-radius: 0 i mai width: 100%, i cap altra regla de `.nav-item` els arrodonix.
   Només la `.nav-item` nua i exacta (barra mòbil) queda fora d'abast del radi. Fixtures
   temporals amb un full CSS mínim que complix K1–K6. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTA = fileURLToPath(new URL('../tooling/gates/tractor-crom.mjs', import.meta.url));

const ARRELS = `:root { --sdp-crom-fons: #111; --sdp-crom-text: #eee; }
nav.app-sidebar { color-scheme: dark; background: var(--sdp-crom-fons); }
header.bar-black { color-scheme: dark; background: var(--sdp-crom-fons); }
`;
const CONTROL_RECTE = '.sidebar-control-btn { height: 40px; border-radius: 0; color: var(--sdp-crom-text); }\n';
const MOBIL_PASTILLA = '.nav-item { padding: 8px 16px; border-radius: var(--sdp-radi-pastilla); }\n';
const ENTRADA_RECTA = 'nav.app-sidebar .nav-item { min-height: 44px; margin-bottom: 0; border-radius: 0; }\n';
const PLEGADA_RECTA = '.sdp-root:not(.is-compact).sidebar-closed nav.app-sidebar .nav-item { width: auto; border-radius: 0; }\n';
const VIU = ARRELS + CONTROL_RECTE + MOBIL_PASTILLA + ENTRADA_RECTA + PLEGADA_RECTA;

function corre(css) {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-crom-'));
  try {
    mkdirSync(path.join(arrel, 'src', 'css'), { recursive: true });
    writeFileSync(path.join(arrel, 'src', 'css', 'closca.css'), css);
    const r = spawnSync(process.execPath, [PORTA], { cwd: arrel, encoding: 'utf8', env: { PATH: process.env.PATH } });
    return { status: r.status, eixida: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(arrel, { recursive: true, force: true });
  }
}

test('K4: la barra lateral de rectangle pur (la regla vigent, T15) passa; la .nav-item nua de la barra mòbil queda fora d’abast', () => {
  const r = corre(VIU);
  assert.equal(r.status, 0, r.eixida);
  assert.match(r.eixida, /K1–K6 net/);
});

test('K4: el mutant de la pastilla a l’entrada de la barra lateral fa caure la porta', () => {
  const r = corre(VIU.replace(ENTRADA_RECTA, 'nav.app-sidebar .nav-item { min-height: 44px; border-radius: var(--sdp-radi-pastilla); }\n'));
  assert.equal(r.status, 1, r.eixida);
  assert.match(r.eixida, /K4 · src\/css\/closca\.css:\d+ {2}«nav\.app-sidebar \.nav-item» \{ border-radius: var\(--sdp-radi-pastilla\) \}/);
  assert.match(r.eixida, /La regla base «nav\.app-sidebar \.nav-item» no declara border-radius: 0/);
});

test('K4: la pastilla al botó del CONTROL, també en una sola cantonada, fa caure la porta', () => {
  const pastilla = corre(VIU.replace(CONTROL_RECTE, '.sidebar-control-btn { height: 40px; border-radius: var(--sdp-radi-pastilla); color: var(--sdp-crom-text); }\n'));
  assert.equal(pastilla.status, 1, pastilla.eixida);
  assert.match(pastilla.eixida, /La regla base «\.sidebar-control-btn» no declara border-radius: 0/);
  const cantonada = corre(`${VIU}.sidebar-control-row .sidebar-control-btn { border-top-left-radius: 8px; }\n`);
  assert.equal(cantonada.status, 1, cantonada.eixida);
  assert.match(cantonada.eixida, /K4 · .*border-top-left-radius: 8px/);
});

/* Gauntlet f6 (crom-k4-abast-del-radi-afluixat) · `.sdp-root .nav-item.active` (0,3,0) guanya
   la base `nav.app-sidebar .nav-item` (0,2,1) i arrodonix l'entrada activa de la barra lateral
   (Chrome sense capçal: de 0px a 12px), encara que no nomene app-sidebar. */
test('K4: una .nav-item més específica que la base, sense app-sidebar, que arrodonix la barra lateral fa caure la porta', () => {
  for (const regla of ['.sdp-root .nav-item.active { border-radius: 12px; }', '.nav-item.active:hover { border-radius: var(--sdp-radi-pastilla); }']) {
    const r = corre(`${VIU}${regla}\n`);
    assert.equal(r.status, 1, `${regla}\n${r.eixida}`);
    assert.match(r.eixida, /K4 · src\/css\/closca\.css:\d+ {2}«[^»]*\.nav-item\.active[^»]*» \{ border-radius: [^}]+ \}: .*rectangle pur/);
  }
});

test('K4: width: 100% continua prohibit (fantasma de punta a punta), també a la plegada', () => {
  const r = corre(VIU.replace(PLEGADA_RECTA, '.sdp-root:not(.is-compact).sidebar-closed nav.app-sidebar .nav-item { width: 100%; border-radius: 0; }\n'));
  assert.equal(r.status, 1, r.eixida);
  assert.match(r.eixida, /K4 · .*\{ width: 100% \}/);
});

test('K4: sense la regla base de l’entrada de la barra lateral, la porta cau', () => {
  const r = corre(VIU.replace(ENTRADA_RECTA, '').replace(PLEGADA_RECTA, ''));
  assert.equal(r.status, 1, r.eixida);
  assert.match(r.eixida, /La regla base «nav\.app-sidebar \.nav-item» no declara border-radius: 0/);
});
