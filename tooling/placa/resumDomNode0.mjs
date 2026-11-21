import { JSDOM, VirtualConsole } from 'jsdom';

/** Eina de laboratori Node: no importa cap mòdul del client ni executa HTML.
 * El resum descriu DOM semàntic, mai geometria/visibilitat dins del viewport.
 * CSS, recursos, scripts i valors de formulari no entren en la consulta. */
export const LIMITS_DOM_NODE0 = Object.freeze({ htmlBytes: 4 * 1024 * 1024, nodes: 30_000, resumBytes: 12_000 });
const IGNORATS = new Set(['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED']);
const CONTROLS_AMB_VALOR = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'DATALIST']);
const textNet = (text, maxim = 160) => text.replace(/\s+/gu, ' ').trim().slice(0, maxim);
const bytes = (text) => Buffer.byteLength(text, 'utf8');
const error = (codi) => Object.assign(new Error(codi), { code: codi });

function estaOcult(element) {
  return IGNORATS.has(element.tagName.toUpperCase()) || element.hasAttribute('hidden') ||
    element.getAttribute('aria-hidden')?.toLowerCase() === 'true' ||
    element.style?.display === 'none' || element.style?.visibility === 'hidden' ||
    (element.tagName === 'INPUT' && element.type === 'hidden');
}

/** Recorregut iteratiu i acotat: evita CSS amb falsos <button> i descendents ocults. */
function textDe(node, maxim) {
  const pendents = [node];
  const fragments = [];
  let total = 0;
  let visitats = 0;
  while (pendents.length && total < maxim && visitats < LIMITS_DOM_NODE0.nodes) {
    const actual = pendents.pop();
    visitats += 1;
    if (actual.nodeType === 3) {
      const fragment = textNet(actual.nodeValue, maxim - total);
      if (fragment) { fragments.push(fragment); total += fragment.length + 1; }
    } else if (actual.nodeType === 1 && !estaOcult(actual) && !CONTROLS_AMB_VALOR.has(actual.tagName)) {
      for (let fill = actual.lastChild; fill; fill = fill.previousSibling) pendents.push(fill);
    }
  }
  return textNet(fragments.join(' '), maxim);
}

function enllacNet(element) {
  const cru = element.getAttribute('href') || '';
  try {
    const url = new URL(cru, 'https://laboratori.invalid');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    // Una ruta de lectura no necessita transportar tokens d'autenticació al model.
    for (const clau of [...url.searchParams.keys()]) {
      if (/token|password|secret|code|auth|key/i.test(clau)) url.searchParams.delete(clau);
    }
    url.hash = '';
    return textNet(url.origin === 'https://laboratori.invalid' ? url.pathname + url.search : url.href, 160);
  } catch { return ''; }
}

export function resumeixDomNode0(html) {
  if (typeof html !== 'string') throw error('HTML_NO_TEXTUAL');
  if (bytes(html) > LIMITS_DOM_NODE0.htmlBytes) throw error('HTML_MASSA_GRAN');
  const dom = new JSDOM(html, { virtualConsole: new VirtualConsole() });
  try {
    const document = dom.window.document;
    const resum = {
      naturalesa: 'DOM semantic sense layout; no prova viewport, interaccio ni autenticacio',
      titol: textNet(document.title, 180), encapcalaments: [], botons: [], camps: [], enllacos: [], mostraText: '', truncat: false
    };
    const pendents = [document.body];
    const vistos = { botons: new Set(), enllacos: new Set() };
    const afegix = (camp, valor, maxim) => {
      if (!valor || resum[camp].length >= maxim || vistos[camp]?.has(valor)) return;
      resum[camp].push(valor);
      vistos[camp]?.add(valor);
    };
    let nodes = 0;
    while (pendents.length && nodes < LIMITS_DOM_NODE0.nodes) {
      const element = pendents.pop();
      nodes += 1;
      if (!element || estaOcult(element)) continue;
      const nom = () => textDe(element, 160) || textNet(element.getAttribute('aria-label') || element.getAttribute('title') || '', 160);
      if (/^H[1-3]$/.test(element.tagName)) afegix('encapcalaments', `${element.tagName}: ${nom()}`, 14);
      if (element.tagName === 'BUTTON') afegix('botons', nom(), 22);
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
        // Mai .value, defaultValue, selected text o atribut value: poden ser secrets.
        const tipus = element.tagName === 'INPUT' ? element.type : element.tagName.toLowerCase();
        const etiqueta = element.getAttribute('aria-label') || element.getAttribute('placeholder') || element.getAttribute('name') || '';
        afegix('camps', `${tipus}: ${textNet(etiqueta, 120)}`, 15);
      }
      if (element.tagName === 'A') {
        const href = enllacNet(element);
        if (href) afegix('enllacos', `${nom()} (${href})`, 16);
      }
      for (let fill = element.lastElementChild; fill; fill = fill.previousElementSibling) pendents.push(fill);
    }
    resum.mostraText = textDe(document.body, 1400);
    resum.truncat = pendents.length > 0;
    // El pressupost s'aplica a la serialització UTF-8 real, també amb emoji.
    for (const camp of ['enllacos', 'camps', 'botons', 'encapcalaments']) {
      while (bytes(JSON.stringify(resum)) > LIMITS_DOM_NODE0.resumBytes && resum[camp].length) {
        resum[camp].pop(); resum.truncat = true;
      }
    }
    return Object.freeze(resum);
  } finally { dom.window.close(); }
}

/** Bytes UTF-8 és un sostre conservador de tokens per a vocabularis per bytes;
 * 512 tokens queden reservats per a plantilla/marges. No és tokenització exacta.
 * No es retalla la missió en silenci: el caller rep CONTEXT_MASSA_GRAN. */
export function preparaPeticioNode0({ model, prompt, numCtx = 8192, numPredict = 900 } = {}) {
  if (typeof model !== 'string' || !model.trim() || model.length > 160 || typeof prompt !== 'string' || !prompt.trim()) throw error('CONSULTA_INVALIDA');
  if (!Number.isSafeInteger(numCtx) || numCtx < 2048 || numCtx > 32768 || !Number.isSafeInteger(numPredict) || numPredict < 120 || numPredict > 4096) throw error('PRESSUPOST_INVALID');
  const pressupost = numCtx - numPredict - 512;
  const promptBytes = bytes(prompt);
  if (pressupost < 1 || promptBytes > pressupost) throw error('CONTEXT_MASSA_GRAN');
  return {
    cos: { model: model.trim(), prompt, stream: false, think: false, options: { temperature: 0.3, num_ctx: numCtx, num_predict: numPredict } },
    pressupost: Object.freeze({ promptBytes, maximPromptBytes: pressupost, reservaTokens: 512, tokenitzacioExacta: false })
  };
}

function sensePensament(text) {
  const minuscules = text.toLowerCase();
  const fragments = [];
  let cursor = 0;
  while (cursor < text.length) {
    const inici = minuscules.indexOf('<think>', cursor);
    if (inici === -1) { fragments.push(text.slice(cursor)); break; }
    fragments.push(text.slice(cursor, inici));
    const fi = minuscules.indexOf('</think>', inici + 7);
    if (fi === -1) break;
    cursor = fi + 8;
  }
  return fragments.join('').trim();
}

/** Un sol termini per a headers+cos. Només URL explícita: importar l'eina no
 * inicia cap consulta, cron ni servei. L'endpoint de proves és loopback propi. */
export async function cridaOllamaNode0({ url, model, prompt, numCtx, numPredict, signal, timeoutMs = 180_000 } = {}) {
  const peticio = preparaPeticioNode0({ model, prompt, numCtx, numPredict });
  let endpoint;
  try { endpoint = new URL(url); } catch { throw error('ENDPOINT_INVALID'); }
  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.hash) throw error('ENDPOINT_INVALID');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 180_000) throw error('TERMINI_INVALID');
  const ctrl = new AbortController();
  let reader;
  let timer;
  let avorta;
  const interrupcio = new Promise((_, rebutja) => {
    avorta = () => { ctrl.abort(); rebutja(error('CONSULTA_AVORTADA')); };
    if (signal?.aborted) avorta();
    else signal?.addEventListener('abort', avorta, { once: true });
    timer = setTimeout(() => { ctrl.abort(); rebutja(error('CONSULTA_FORA_TERMINI')); }, timeoutMs);
  });
  const treball = async () => {
    if (ctrl.signal.aborted) throw error('CONSULTA_AVORTADA');
    const resposta = await fetch(endpoint, {
      method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal, body: JSON.stringify(peticio.cos)
    });
    if (!resposta.ok) throw error('OLLAMA_HTTP_FALLIT');
    if (!resposta.body?.getReader) throw error('OLLAMA_COS_INVALID');
    reader = resposta.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let total = 0;
    let fragments = 0;
    let text = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      fragments += 1;
      if (total > 131_072 || fragments > 4096) throw error('OLLAMA_COS_MASSA_GRAN');
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    let dades;
    try { dades = JSON.parse(text); } catch { throw error('OLLAMA_JSON_INVALID'); }
    if (dades === null || typeof dades !== 'object' || dades.error || dades.done !== true || typeof dades.response !== 'string') throw error('OLLAMA_RESPOSTA_INVALIDA');
    if (dades.done_reason === 'length') throw error('OLLAMA_RESPOSTA_TRUNCADA');
    const net = sensePensament(dades.response);
    if (net.length < 120) throw error('OLLAMA_RESPOSTA_NO_UTIL');
    return { ok: true, text: net, pressupost: peticio.pressupost, limit: 'Resposta textual sintetica; no acredita missio humana ni consens' };
  };
  try { return await Promise.race([treball(), interrupcio]); }
  finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', avorta);
    ctrl.abort();
    // No esperem un cleanup remot no cooperatiu després del termini.
    try { const cancel = reader?.cancel(); cancel?.catch(() => {}); } catch { /* El lector ja pot estar tancat. */ }
  }
}
