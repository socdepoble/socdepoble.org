import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('E4 exclou mocks de proves però bloqueja la mateixa assignació en producte', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-enxufe-'));
  const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  try {
    write('.agents/AGENTS.md', 'fixture');
    for (const file of ['src/data/backendPort.js', 'src/data/contracte.js', 'src/host.js', 'src/PedraSecaEmbed.jsx']) write(file, fs.readFileSync(file, 'utf8'));
    write('src/example.test.js', 'window.location = {}; Object.defineProperty(window, "parent", {});');
    const run = () => {
      const result = spawnSync(process.execPath, ['tooling/gates/tractor-enxufe.mjs', '--json', `--arrel=${root}`], { encoding: 'utf8' });
      assert.ok([0, 1].includes(result.status), result.stderr);
      return JSON.parse(result.stdout).infraccions.filter(x => x.llei === 'E4');
    };
    assert.deepEqual(run(), []);
    write('src/example.js', fs.readFileSync(path.join(root, 'src/example.test.js'), 'utf8'));
    assert.equal(run().length, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

/* Onada R30 · A3-ENX-02 i A3-ENX-03 · Una arrel de proves amb el port, el
   contracte, el host i l'embed de veres: `escriu` hi posa fitxers i `infraccions`
   torna les de la llei demanada. */
function arrelDeProves() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-enxufe-'));
  const escriu = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  escriu('.agents/AGENTS.md', 'fixture');
  for (const file of ['src/data/backendPort.js', 'src/data/contracte.js', 'src/host.js', 'src/PedraSecaEmbed.jsx']) escriu(file, fs.readFileSync(file, 'utf8'));
  const infraccions = (llei) => {
    const result = spawnSync(process.execPath, ['tooling/gates/tractor-enxufe.mjs', '--json', `--arrel=${root}`], { encoding: 'utf8' });
    assert.ok([0, 1].includes(result.status), result.stderr);
    return JSON.parse(result.stdout).infraccions.filter((x) => x.llei === llei);
  };
  return { root, escriu, infraccions, neteja: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test('E1 veu el SDK del proveïdor importat pel nom del paquet fora de les zones d’adaptador', () => {
  const a = arrelDeProves();
  try {
    assert.deepEqual(a.infraccions('E1'), []);
    a.escriu('src/data/supabase/client.js', "import { createClient } from '@supabase/supabase-js';\nexport default createClient;\n");
    a.escriu('src/data/adaptadors/sollutia/client.js', "export const carrega = () => import('@supabase/realtime-js');\n");
    a.escriu('src/sections/ui/Llista.jsx', "// import { createClient } from '@supabase/supabase-js';\nimport { Link } from 'react-router';\nexport default Link;\n");
    assert.deepEqual(a.infraccions('E1'), [], 'les zones d’adaptador i un comentari no compten; un paquet que no és del proveïdor, tampoc');
    a.escriu('src/sections/ui/Estatic.jsx', "import { createClient } from '@supabase/supabase-js';\nexport default createClient;\n");
    a.escriu('src/components/ui/Dinamic.js', "export const carrega = () => import('@supabase/storage-js');\n");
    assert.deepEqual(a.infraccions('E1').map((i) => i.fitxer).sort(), ['src/components/ui/Dinamic.js', 'src/sections/ui/Estatic.jsx']);
  } finally { a.neteja(); }
});

/* Onada R30 · A3-ENX-02 (àrbitre, P3) · El port neutral pot importar
   l'adaptador pel camí relatiu (és la seua feina), però no el SDK del
   proveïdor pel nom del paquet: ESLint només cobrix @supabase/supabase-js. */
test('E1 · el port neutral tampoc importa el SDK del proveïdor pel nom del paquet', () => {
  const a = arrelDeProves();
  try {
    assert.deepEqual(a.infraccions('E1'), [], 'el port de veres, que importa l’adaptador pel camí relatiu, és net');
    const port = fs.readFileSync('src/data/backendPort.js', 'utf8');
    a.escriu('src/data/backendPort.js', `${port}\nexport const sdkAuth = () => import('@supabase/auth-js');\n`);
    assert.deepEqual(a.infraccions('E1').map((i) => [i.fitxer, i.detall]),
      [['src/data/backendPort.js', "importa el SDK del proveïdor (@supabase/auth-js) fora de l'adaptador"]]);
  } finally { a.neteja(); }
});

test('E5 · el protocol del proveïdor fora de l’adaptador és una infracció, i la porta no deixa passar res que no siga a la línia base', () => {
  const a = arrelDeProves();
  try {
    assert.deepEqual(a.infraccions('E5'), []);
    a.escriu('src/data/supabase/storage.js', "export const cami = (b) => `/storage/v1/object/public/${b}`;\n");
    a.escriu('src/data/adaptadors/noticies/client.js', "export const CAMI = '/functions/v1/noticies';\n");
    a.escriu('src/data/explica.js', "/* El bescanvi va a /auth/v1/token amb { apikey: k }. */\n// també /rest/v1/perfils\nexport const res = 1;\n");
    a.escriu('src/data/consulta.test.js', "fetch('https://x.supabase.co/rest/v1/perfils', { headers: { apikey: 'k' } });\n");
    /* Onada R30 · àrbitre (P3) · Un ternari amb una variable que es diu apikey
       no és la capçalera: el senyal vol context de clau d'objecte. */
    a.escriu('src/sections/ui/Clau.jsx', 'export const tria = (ok, apikey) => ok ? apikey : null;\n');
    assert.deepEqual(a.infraccions('E5'), [], 'adaptadors, comentaris, proves i un ternari no compten');

    a.escriu('src/data/consulta.js', "export const llig = (u, k) => fetch(`${u}/rest/v1/perfils`, { headers: { apikey: k } });\n");
    a.escriu('src/sections/ui/Viu.jsx', "export const canal = (u) => new WebSocket(`${u}/realtime/v1/websocket`);\n");
    /* Onada R30 · àrbitre (P2) · El camí escrit dins d'un literal de regex, amb
       les barres escapades (`\/storage\/v1`), és el mateix senyal. */
    a.escriu('src/sections/ui/Foto.jsx', 'const RUTA = /^\\/storage\\/v1\\/object\\/public\\/mitjans\\/(.+)$/;\nexport const ref = (p) => RUTA.exec(p)?.[1] ?? null;\n');
    a.escriu('src/sections/ui/Capcalera.js', "export const posa = (h, k) => { h.set('apikey', k); return { ...h, 'apikey': k }; };\n");
    const noves = a.infraccions('E5');
    assert.deepEqual(noves.map((i) => i.fitxer).sort(), ['src/data/consulta.js', 'src/sections/ui/Capcalera.js', 'src/sections/ui/Foto.jsx', 'src/sections/ui/Viu.jsx']);
    assert.match(noves.find((i) => i.fitxer === 'src/data/consulta.js').detall, /PostgREST, capçalera apikey/);
    assert.match(noves.find((i) => i.fitxer === 'src/sections/ui/Foto.jsx').detall, /\(Storage\)/);
    assert.match(noves.find((i) => i.fitxer === 'src/sections/ui/Capcalera.js').detall, /\(capçalera apikey\)/);
    a.escriu('src/sections/ui/Foto.jsx', 'export const ref = null;\n');
    a.escriu('src/sections/ui/Capcalera.js', 'export const posa = null;\n');

    /* Declarat amb motiu: passa. Un senyal nou en un mòdul conegut, no. */
    const linia = (e5) => a.escriu('.agents/deute/.enxufe-deute.json', JSON.stringify({ E5: e5 }));
    linia({
      'src/data/consulta.js': { senyals: ['PostgREST', 'capçalera apikey'], motiu: 'prova' },
      'src/sections/ui/Viu.jsx': { senyals: ['Realtime'], motiu: 'prova' }
    });
    assert.deepEqual(a.infraccions('E5'), []);
    a.escriu('src/sections/ui/Viu.jsx', "export const canal = (u) => new WebSocket(`${u}/realtime/v1/websocket`);\nexport const foto = (u) => `${u}/storage/v1/object/public/a.webp`;\n");
    assert.deepEqual(a.infraccions('E5').map((i) => [i.fitxer, i.detall]), [['src/sections/ui/Viu.jsx', "parla el protocol del proveïdor (Storage) fora de l'adaptador"]]);

    /* Deute pagat: l'entrada que l'arbre ja no porta s'ha de llevar. */
    a.escriu('src/sections/ui/Viu.jsx', 'export const canal = null;\n');
    const pagat = a.infraccions('E5');
    assert.equal(pagat.length, 1);
    assert.equal(pagat[0].fitxer, '.agents/deute/.enxufe-deute.json');
    assert.match(pagat[0].detall, /src\/sections\/ui\/Viu\.jsx: declara Realtime/);

    /* Una línia base malformada o sense motiu no fa passar res. */
    linia({ 'src/data/consulta.js': { senyals: ['PostgREST', 'capçalera apikey'], motiu: ' ' } });
    assert.deepEqual(a.infraccions('E5').map((i) => i.fitxer).sort(), ['.agents/deute/.enxufe-deute.json', 'src/data/consulta.js']);
    a.escriu('.agents/deute/.enxufe-deute.json', '{ no és json');
    assert.ok(a.infraccions('E5').some((i) => i.fitxer === '.agents/deute/.enxufe-deute.json' && /no és JSON vàlid/.test(i.detall)));
  } finally { a.neteja(); }
});

test('E5 · la línia base de l’arbre té motiu i senyals coneguts a cada entrada, i cap entrada és de l’adaptador', () => {
  const { E5 } = JSON.parse(fs.readFileSync('.agents/deute/.enxufe-deute.json', 'utf8'));
  const coneguts = new Set(['GoTrue', 'PostgREST', 'Realtime', 'Storage', 'Edge Functions', 'GraphQL', 'capçalera apikey']);
  assert.ok(Object.keys(E5).length > 0);
  for (const [cami, entrada] of Object.entries(E5)) {
    assert.ok(fs.existsSync(cami), `${cami} no existix`);
    assert.ok(!/^src\/data\/(?:supabase|adaptadors)\//.test(cami), `${cami} és de l’adaptador: no és deute`);
    assert.ok(entrada.senyals.length > 0 && entrada.senyals.every((s) => coneguts.has(s)), cami);
    assert.ok(entrada.motiu.trim().length >= 40, `${cami}: el motiu ha de dir per què encara no és a l’adaptador`);
  }
});

/* Onada R30 · àrbitre (P3) · La porta només llig l'arbre: no deixa passar cap
   mòdul ni senyal que no siga a la línia base, però no pot saber si la línia
   base ha crescut. Ho mira esta prova contra HEAD: una entrada o un senyal que
   HEAD no porta hi ha d'entrar amb el camp «alta» (qui accepta el deute nou,
   quan i per què no pot anar a l'adaptador), perquè afegir deute siga un acte
   explícit a la revisió i no l'efecte de posar-hi un motiu. Baixar sempre val. */
const MINIM_ALTA = 20;
function creixementsSenseAlta(abans, ara) {
  const nous = [];
  for (const [cami, entrada] of Object.entries(ara ?? {})) {
    const vells = new Set(abans?.[cami]?.senyals ?? []);
    const afegits = (Array.isArray(entrada?.senyals) ? entrada.senyals : []).filter((s) => !vells.has(s));
    const ambAlta = typeof entrada?.alta === 'string' && entrada.alta.trim().length >= MINIM_ALTA;
    if (afegits.length && !ambAlta) nous.push(`${cami}: ${afegits.join(', ')}`);
  }
  return nous;
}

test('E5 · la línia base no creix sense «alta»: el comparador veu l’entrada i el senyal nous, i deixa baixar', () => {
  const base = { 'src/a.js': { senyals: ['Storage'], motiu: 'm' } };
  const alta = '261116 · Mestre · el mòdul encara no pot anar a l’adaptador';
  assert.deepEqual(creixementsSenseAlta(base, base), []);
  assert.deepEqual(creixementsSenseAlta(base, {}), [], 'llevar deute sempre val');
  assert.deepEqual(creixementsSenseAlta(base, { 'src/a.js': { senyals: ['Storage', 'GoTrue'], motiu: 'm' } }), ['src/a.js: GoTrue']);
  assert.deepEqual(creixementsSenseAlta(base, { ...base, 'src/b.js': { senyals: ['PostgREST'], motiu: 'un motiu llarg que no és cap alta' } }), ['src/b.js: PostgREST']);
  assert.deepEqual(creixementsSenseAlta(base, { ...base, 'src/b.js': { senyals: ['PostgREST'], motiu: 'm', alta: ' curta ' } }), ['src/b.js: PostgREST']);
  assert.deepEqual(creixementsSenseAlta(base, { ...base, 'src/b.js': { senyals: ['PostgREST'], motiu: 'm', alta } }), []);
});

test('E5 · la línia base de l’arbre no porta cap entrada ni senyal que HEAD no tinga, llevat dels que entren amb «alta»', (t) => {
  const head = spawnSync('git', ['show', 'HEAD:.agents/deute/.enxufe-deute.json'], { encoding: 'utf8' });
  if (head.status !== 0) { t.skip('HEAD encara no porta la línia base d’E5 (el commit que la crea)'); return; }
  const abans = JSON.parse(head.stdout).E5;
  const { E5: ara } = JSON.parse(fs.readFileSync('.agents/deute/.enxufe-deute.json', 'utf8'));
  assert.deepEqual(creixementsSenseAlta(abans, ara), [],
    `la línia base només pot baixar: el deute nou va a l’adaptador, o entra amb «alta» (${MINIM_ALTA}+ caràcters: qui, quan i per què)`);
});
