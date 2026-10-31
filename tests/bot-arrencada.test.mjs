// P1-24 (C1645-03/04) · Arrencada del cervell del bot amb un corpus mínim, sense xarxa
// ni credencials: @google/genai (ni tan sols instal·lat) se substituïx per un mòdul fals
// i fetch peta si algú el crida. Contracte: productor → public/rag-index.json →
// hydrateRagIndex → search → prompt, dins de la frontera de la Wiki pública, amb
// l'historial fitat. Tot l'estat va a mkdtemp; cap fitxer del repositori no s'escriu.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const FALS = `export const crides = [];
export const Type = { OBJECT: 'OBJECT', STRING: 'STRING' };
export class GoogleGenAI {
  constructor() {
    this.models = {
      generateContent: async (peticio) => { crides.push(peticio); return { text: 'Resposta de prova', functionCalls: [] }; },
      generateImages: async () => { throw new Error('sense xarxa'); },
    };
  }
}`;
const URL_FALS = `data:text/javascript,${encodeURIComponent(FALS)}`;
registerHooks({
  resolve: (especificador, context, seguent) => (especificador === '@google/genai'
    ? { url: URL_FALS, shortCircuit: true }
    : seguent(especificador, context)),
});
mock.method(globalThis, 'fetch', async () => { throw new Error('La prova del bot no fa xarxa'); });
mock.method(console, 'log', () => {});

const arrel = mkdtempSync(join(tmpdir(), 'sdp-bot-arrel-'));
const estat = mkdtempSync(join(tmpdir(), 'sdp-bot-estat-'));
// A l'eixida el bucle ja és buit: el purgeExpired() que iniciaCervell no espera ja ha acabat.
process.on('exit', () => {
  rmSync(arrel, { recursive: true, force: true });
  rmSync(estat, { recursive: true, force: true });
});
const posa = (rel, text) => {
  mkdirSync(dirname(join(arrel, rel)), { recursive: true });
  writeFileSync(join(arrel, rel), text);
};
posa('bot/persona/IAIA_MARIA.md', '# Persona de prova\n');
posa('_wiki_de_poble/02_saber/olivera.md', '# Olivera\nolivera rural del poble CANARI_WIKI\n');
posa('_wiki_de_poble/02_saber/aigua.md', '# Aigua\naigua de la font\n');
// Fora de la frontera pública: cap d'estos textos no pot arribar mai al prompt.
posa('.env', 'GEMINI_API_KEY=CANARI_SECRET\n');
posa('_wiki_de_poble/90_arxiu_historic/intern.md', '# Intern\nCANARI_SECRET intern\n');
posa('_wiki_de_poble/02_saber/privat.md', '---\nvisibility: private\n---\n# Privat\nCANARI_SECRET privat\n');
posa('_wiki_de_poble_germana/02_saber/germana.md', '# Germana\nCANARI_SECRET germana\n');
symlinkSync('../../.env', join(arrel, '_wiki_de_poble/02_saber/enllac.md'));

const { buildIndex } = await import('../tooling/wiki/core/build_rag_index.mjs');
const wire = await buildIndex(arrel);
const escriuIndex = (index) => posa('public/rag-index.json', JSON.stringify(index));
escriuIndex(wire);

process.env.IAIA_PROJECT_ROOT = arrel;
process.env.IAIA_STATE_ROOT = estat;
process.env.GEMINI_API_KEY = 'fals';
const { crides } = await import('@google/genai');
const cervell = await import('../bot/cervell.mjs');

const SENSE_CONTEXT = /No hi ha documentació de la wiki per a aquesta consulta\./;

test('C1645-03 · arrenca amb l’índex que escriu el productor (public/rag-index.json)', async () => {
  assert.deepEqual(wire.docs.map((d) => d.path), [
    '_wiki_de_poble/02_saber/aigua.md',
    '_wiki_de_poble/02_saber/olivera.md',
  ], 'el productor només publica la Wiki pública, amb camins relatius a l’arrel del projecte');
  await cervell.iniciaCervell();
});

test('C1645-03 · productor → JSON → hydrateRagIndex → search porta el document al prompt', async (t) => {
  const avisos = t.mock.method(console, 'warn', () => {});
  crides.length = 0;
  const resposta = await cervell.pensa('olivera');
  assert.equal(resposta.text, 'Resposta de prova');
  const prompt = crides[0].config.systemInstruction;
  assert.match(prompt, /--- Document: _wiki_de_poble\/02_saber\/olivera\.md ---\n# Olivera\nolivera rural del poble CANARI_WIKI/);
  assert.doesNotMatch(prompt, SENSE_CONTEXT);
  assert.equal(avisos.mock.callCount(), 0);
});

test('un índex invàlid fa petar l’arrencada en veu alta', async (t) => {
  const errors = t.mock.method(console, 'error', () => {});
  // El que dona JSON.stringify d'un índex amb Set i Map (edge_rag.buildIndex): {}.
  escriuIndex({ ...wire, stopwords: {} });
  try {
    await assert.rejects(cervell.iniciaCervell(), /RAG index absent o invàlid/);
    assert.ok(errors.mock.calls.some((c) => /Invalid RAG index/.test(String(c.arguments.at(-1)))),
      'el registre diu per què l’índex no val');
  } finally {
    escriuIndex(wire);
    await cervell.iniciaCervell();
  }
});

test('cap entrada de l’índex no porta al prompt res de fora de la Wiki pública', async (t) => {
  const fora = {
    'fitxer de l’arrel (.env)': '.env',
    'eixida per ../': '_wiki_de_poble/02_saber/../../.env',
    'camí absolut': join(arrel, '.env'),
    'carpeta germana amb el mateix prefix': '_wiki_de_poble_germana/02_saber/germana.md',
    'carpeta privada de la Wiki (90_)': '_wiki_de_poble/90_arxiu_historic/intern.md',
    'enllaç simbòlic dins de la Wiki': '_wiki_de_poble/02_saber/enllac.md',
    'document amb visibility no pública': '_wiki_de_poble/02_saber/privat.md',
  };
  const posicio = wire.docs.findIndex((d) => d.path.endsWith('/olivera.md'));
  try {
    for (const [cas, cami] of Object.entries(fora)) {
      await t.test(cas, async (st) => {
        const avisos = st.mock.method(console, 'warn', () => {});
        const dolent = structuredClone(wire);
        dolent.docs[posicio].path = cami;
        escriuIndex(dolent);
        await cervell.iniciaCervell();
        crides.length = 0;
        await cervell.pensa('olivera');
        const prompt = crides[0].config.systemInstruction;
        assert.doesNotMatch(prompt, /CANARI_SECRET/);
        assert.match(prompt, SENSE_CONTEXT);
        // No en silenci (B5 va ser un context buit sense cap avís): l'entrada es nomena.
        assert.equal(avisos.mock.callCount(), 1);
        assert.ok(String(avisos.mock.calls[0].arguments[0]).includes(cami));
      });
    }
  } finally {
    escriuIndex(wire);
    await cervell.iniciaCervell();
  }
});

test('C1645-04 · l’historial d’una conversa queda fitat a 8 apunts i el prompt no canvia', async () => {
  crides.length = 0;
  for (let i = 0; i < 20; i += 1) await cervell.pensa(`pregunta ${i}`);
  const parells = (...n) => n.flatMap((i) => [`Veí: pregunta ${i}`, 'IAIA: Resposta de prova']);
  assert.deepEqual(cervell.sessions.get('foraster_desconegut').history, parells(16, 17, 18, 19));
  // El prompt porta els mateixos 8 apunts que abans de la poda (slice(-8) d'un historial sense fi).
  const fil = ['IAIA: Resposta de prova', ...parells(16, 17, 18), 'Veí: pregunta 19'].join('\n');
  assert.equal(crides.at(-1).contents[0].text, `[FIL ACTUAL]\n${fil}\n\nRespon al veí com a IAIA MarIA:`);
});

test('B8 · immunite.mjs linka i poda les sessions del mateix cervell', async () => {
  const { runPlaquetes } = await import('../bot/immunite.mjs');
  cervell.sessions.get('foraster_desconegut').lastSeen = 0;
  await runPlaquetes();
  assert.equal(cervell.sessions.has('foraster_desconegut'), false);
});
