import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { cridaOllamaNode0, LIMITS_DOM_NODE0, preparaPeticioNode0, resumeixDomNode0 } from './resumDomNode0.mjs';

const UTIL = 'La lectura mostra una acció per a entrar i dos camps amb etiqueta. No acredita autenticació ni avisos efectius. Cal conservar el límit de la prova i la veu discrepant.';
const consulta = (url, extra = {}) => cridaOllamaNode0({ url, model: 'model-simulat:1', prompt: 'Descriu només la pantalla del laboratori.', ...extra });

async function ambServidor(handler, comprova) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const url = `http://127.0.0.1:${server.address().port}/api/generate`;
  try { await comprova(url); }
  finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
}

const envia = (res, dada) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(dada)); };

test('parser inert: CSS amb falsos botons/enllaços no contamina noms ni text; recursos i scripts no s’executen', () => {
  const html = `<title>Plaça &amp; poble</title><style>/* <button>CSS_INJECTAT</button><a href="/fals">CSS_ENLLAC</a> */</style>
    <script>globalThis.executat = true; '<button>SCRIPT</button>'</script><script src="https://laboratori.invalid/no.js"></script>
    <link rel="stylesheet" href="https://laboratori.invalid/no.css"><h1>Benvinguda</h1>
    <button><style>CSS_DINS</style>Entrar <span hidden>AMAGAT</span></button><button aria-label="Cerca"></button>
    <a href="/events/acte?code=privat&mes=11#access_token=privat">Acte públic</a>
    <input type="password" aria-label="Contrasenya" value="SECRET_PASSWORD"><textarea name="nota"></textarea>`;
  const resum = resumeixDomNode0(html);
  assert.equal(resum.titol, 'Plaça & poble');
  assert.deepEqual(resum.botons, ['Entrar', 'Cerca']);
  assert.deepEqual(resum.enllacos, ['Acte públic (/events/acte?mes=11)']);
  assert.deepEqual(resum.camps, ['password: Contrasenya', 'textarea: nota']);
  assert.doesNotMatch(JSON.stringify(resum), /CSS_|AMAGAT|SCRIPT|SECRET_PASSWORD|access_token|privat/);
  assert.equal(globalThis.executat, undefined);
});

test('hidden, aria-hidden, inline display:none i visibility:hidden exclouen tota la subbranca', () => {
  const resum = resumeixDomNode0(`<div hidden><h1>HIDDEN</h1><button>HIDDEN</button></div>
    <div aria-hidden="true"><a href="/no">ARIA</a></div><div style="display:none"><input name="DISPLAY"></div>
    <div style="visibility: hidden"><button>VISIBILITY</button></div><input type="hidden" name="TOKEN" value="SECRET">
    <noscript>NOSCRIPT</noscript><template><button>TEMPLATE</button></template><svg><text>SVG</text></svg>
    <h2>Lectura pública</h2><button disabled>Acció desactivada</button>`);
  assert.deepEqual(resum.encapcalaments, ['H2: Lectura pública']);
  assert.deepEqual(resum.botons, ['Acció desactivada']);
  assert.deepEqual(resum.camps, []);
  assert.doesNotMatch(JSON.stringify(resum), /HIDDEN|ARIA|DISPLAY|VISIBILITY|TOKEN|SECRET|NOSCRIPT|TEMPLATE|SVG/);
  assert.match(resum.naturalesa, /sense layout/);
});

test('HTML malformat, comentaris i seqüències de tags no requerixen regex sobre tota la font', () => {
  const resum = resumeixDomNode0('<!-- <button>FALS</button> --><h1>Un &lt; dos</h1><button aria-label="Acció > amb accent">Ves &amp; torna');
  assert.deepEqual(resum.encapcalaments, ['H1: Un < dos']);
  assert.deepEqual(resum.botons, ['Ves & torna']);
  assert.doesNotMatch(JSON.stringify(resum), /FALS/);
});

test('pressupost real UTF-8 amb emoji, molts controls i noms llargs; HTML sobredimensionat refusat abans del parser', () => {
  const resum = resumeixDomNode0('<main>' + Array.from({ length: 100 }, (_, i) => `<h2>${i} ${'🌱'.repeat(200)}</h2><button>${i} ${'🍞'.repeat(200)}</button><a href="/${i}">${'🏘'.repeat(200)}</a><input name="${'🌼'.repeat(150)}">`).join('') + '</main>');
  assert.ok(Buffer.byteLength(JSON.stringify(resum)) <= LIMITS_DOM_NODE0.resumBytes);
  assert.ok(resum.botons.length <= 22);
  assert.ok(resum.camps.length <= 15);
  assert.throws(() => resumeixDomNode0('x'.repeat(LIMITS_DOM_NODE0.htmlBytes + 1)), { code: 'HTML_MASSA_GRAN' });
  assert.throws(() => resumeixDomNode0({ toString() { throw new Error('No coaccionar'); } }), { code: 'HTML_NO_TEXTUAL' });
});

test('tots els noms/camps tenen topalls i un input password mai exporta value/defaultValue', () => {
  const resum = resumeixDomNode0(`<button>${'a'.repeat(10000)}</button><input type="password" value="NO_EXPORTAR" placeholder="Contrasenya">`);
  assert.equal(resum.botons[0].length, 160);
  assert.doesNotMatch(JSON.stringify(resum), /NO_EXPORTAR/);
  assert.ok(resum.mostraText.length <= 1400);
});

test('textareas i opcions no filtren valors al text de pàgina ni als noms de controls/enllaços', () => {
  const resum = resumeixDomNode0('<h1>Prova</h1><textarea name="nota">CANARI_PRIVAT_TEXTAREA</textarea>' +
    '<select aria-label="Tria"><option selected>CANARI_PRIVAT_SELECT</option></select>' +
    '<button>Publicar<textarea>CANARI_DINS_BOTO</textarea></button>' +
    '<a href="/llegir">Llegir<select><option>CANARI_DINS_ENLLAC</option></select></a>');
  assert.equal(resum.mostraText, 'Prova Publicar Llegir');
  assert.deepEqual(resum.botons, ['Publicar']);
  assert.deepEqual(resum.enllacos, ['Llegir (/llegir)']);
  assert.ok(resum.camps.includes('textarea: nota'));
  assert.ok(resum.camps.includes('select: Tria'));
  assert.doesNotMatch(JSON.stringify(resum), /CANARI_/);
});

test('think:false i pressupost explícit; no es retalla la missió per encaixar', () => {
  const { cos, pressupost } = preparaPeticioNode0({ model: 'qwen3:8b', prompt: 'Missió amb à i 🌱' });
  assert.equal(cos.think, false);
  assert.equal(cos.stream, false);
  assert.equal(cos.options.num_ctx, 8192);
  assert.equal(cos.options.num_predict, 900);
  assert.equal(pressupost.promptBytes, Buffer.byteLength(cos.prompt));
  assert.equal(pressupost.tokenitzacioExacta, false);
  assert.throws(() => preparaPeticioNode0({ model: 'x', prompt: '🌱'.repeat(2000) }), { code: 'CONTEXT_MASSA_GRAN' });
  assert.throws(() => preparaPeticioNode0({ model: 'x', prompt: 'x', numCtx: 4096, numPredict: 4096 }), { code: 'CONTEXT_MASSA_GRAN' });
});

test('Ollama simulat real rep el resum net, think:false i pressupost verificat; text útil sense think', async () => {
  let rebut;
  await ambServidor(async (req, res) => {
    const fragments = [];
    for await (const chunk of req) fragments.push(chunk);
    rebut = JSON.parse(Buffer.concat(fragments).toString());
    envia(res, { done: true, response: `<think>Només pensament intern</think> ${UTIL}` });
  }, async (url) => {
    const resum = resumeixDomNode0('<style>CSS_PRIVAT<button>Fals</button></style><h1>La plaça</h1><button>Entrar</button><input type="password" value="SECRET">');
    const resultat = await consulta(url, { prompt: 'Observació semàntica: ' + JSON.stringify(resum) });
    assert.equal(resultat.text, UTIL);
    assert.equal(rebut.think, false);
    assert.equal(rebut.stream, false);
    assert.equal(rebut.options.num_ctx, 8192);
    assert.doesNotMatch(rebut.prompt, /CSS_PRIVAT|SECRET|Fals/);
    assert.equal(resultat.pressupost.promptBytes, Buffer.byteLength(rebut.prompt));
    assert.match(resultat.limit, /no acredita/);
  });
});

test('context excessiu es rebutja abans de qualsevol efecte de xarxa', async () => {
  let crides = 0;
  await ambServidor((_, res) => { crides += 1; envia(res, { done: true, response: UTIL }); }, async (url) => {
    await assert.rejects(consulta(url, { prompt: 'x'.repeat(7000) }), { code: 'CONTEXT_MASSA_GRAN' });
    assert.equal(crides, 0);
  });
});

for (const [nom, dada, codi] of [
  ['buit', { done: true, response: '' }, 'OLLAMA_RESPOSTA_NO_UTIL'],
  ['només think', { done: true, response: `<think>${UTIL}</think>` }, 'OLLAMA_RESPOSTA_NO_UTIL'],
  ['think inacabat', { done: true, response: `<think>${UTIL}` }, 'OLLAMA_RESPOSTA_NO_UTIL'],
  ['curt', { done: true, response: 'D’acord' }, 'OLLAMA_RESPOSTA_NO_UTIL'],
  ['no acabat', { done: false, response: UTIL }, 'OLLAMA_RESPOSTA_INVALIDA'],
  ['pressupost esgotat', { done: true, done_reason: 'length', response: UTIL }, 'OLLAMA_RESPOSTA_TRUNCADA'],
  ['error amb response', { done: true, error: 'fallada', response: UTIL }, 'OLLAMA_RESPOSTA_INVALIDA'],
  ['objecte en response', { done: true, response: {} }, 'OLLAMA_RESPOSTA_INVALIDA']
]) test(`Ollama simulat: ${nom} mai dona PASS de contingut`, async () => {
  await ambServidor((_, res) => envia(res, dada), async (url) => assert.rejects(consulta(url), { code: codi }));
});

test('HTTP fallit i JSON malformat no retornen ok:true', async () => {
  await ambServidor((_, res) => { res.statusCode = 503; res.end('No mostrar cos privat'); }, async (url) => assert.rejects(consulta(url), { code: 'OLLAMA_HTTP_FALLIT' }));
  await ambServidor((_, res) => res.end('{'), async (url) => assert.rejects(consulta(url), { code: 'OLLAMA_JSON_INVALID' }));
});

test('cos excessiu es talla en lectura, abans de parsejar o afirmar contingut vàlid', async () => {
  await ambServidor((_, res) => envia(res, { done: true, response: 'x'.repeat(140000) }), async (url) => assert.rejects(consulta(url), { code: 'OLLAMA_COS_MASSA_GRAN' }));
});

test('deadline inclou el cos que queda pendent i allibera sockets', async () => {
  await ambServidor((_, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.write('{"done":true,"response":"'); }, async (url) => {
    await assert.rejects(consulta(url, { timeoutMs: 40 }), { code: 'CONSULTA_FORA_TERMINI' });
  });
});

test('abort abans i durant la resposta no es convertix en èxit tardà', async () => {
  let crides = 0;
  await ambServidor((_, res) => { crides += 1; res.writeHead(200); res.write('{'); }, async (url) => {
    const abans = new AbortController(); abans.abort();
    await assert.rejects(consulta(url, { signal: abans.signal }), { code: 'CONSULTA_AVORTADA' });
    assert.equal(crides, 0);
    const durant = new AbortController();
    const timer = setTimeout(() => durant.abort(), 40);
    try { await assert.rejects(consulta(url, { signal: durant.signal }), { code: 'CONSULTA_AVORTADA' }); }
    finally { clearTimeout(timer); }
  });
});

test('redirect no es seguix i endpoint amb credencials es refusa', async () => {
  let seguits = 0;
  await ambServidor((req, res) => {
    if (req.url === '/seguiment') { seguits += 1; envia(res, { done: true, response: UTIL }); }
    else { res.statusCode = 307; res.setHeader('location', '/seguiment'); res.end(); }
  }, async (url) => {
    await assert.rejects(consulta(url));
    assert.equal(seguits, 0);
    await assert.rejects(consulta(url.replace('http://', 'http://usuari:secret@')), { code: 'ENDPOINT_INVALID' });
  });
});
