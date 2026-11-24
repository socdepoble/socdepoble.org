/**
 * Porta i prova d'invariant IDEA-343:
 *   1. Al cor del sanejador (`src/utils/sanitize.js`), tot `<a href>` extern
 *      (`esEnllacExtern(href) === true`) rep sempre `target="_blank"` i `rel`
 *      segur amb `noopener noreferrer`, encara que l'HTML o Markdown d'origen
 *      no portara `target`.
 *   2. Rutes internes de la SPA (`/mur`, `/page/...`, `?item=...`, `#ancora`),
 *      relatius i esquemes d'acció (`mailto:`, `tel:`) perden sempre
 *      `target="_blank"` per no obrir pestanyes en blanc ni expulsar l'usuari.
 *   3. Escaneig estàtic AST (`@babel/parser`) sobre tot `src/`: cap `<a ...>`
 *      en JSX amb URL externa literal o constant `https://` pot anar sense
 *      `target="_blank"` ni `noopener noreferrer`, i cap `mailto:`, `tel:` o
 *      ruta interna literal en JSX pot portar `target="_blank"`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { JSDOM } from 'jsdom';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Costura documentada per a v1.2.24: FitxaArbreMonumental.jsx té una àncora a
   FONT_XYLELLA_CIPRERET_2024 però el fitxer està bloquejat pels kits pendents
   R32.48 i R32.55. Quan Claude aplique la costura en v1.2.24, aquesta entrada
   quedarà obsoleta o buida; cap altre fitxer de tot src/ pot incomplir la llei. */
const COSTURA_PENDENT_ALTRES_KITS = new Set([
  'src/sections/patrimoni/FitxaArbreMonumental.jsx',
]);

/* Excepció funcional deliberada (Gauntlet R9 · G2-03): la casella del
   consentiment a l'alta obri /legal en pestanya nova perquè la persona no
   perda les dades ja escrites al formulari de registre. */
const EXCEPCIO_FORMULARI_ALTA = new Set([
  'src/sections/onboarding/OnboardingSteps.jsx',
]);

function instalLaDom(url = 'https://socdepoble.org/wikidepoble') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'location', {
    value: dom.window.location,
    configurable: true,
    writable: true,
  });
  globalThis.Element = dom.window.Element;
  globalThis.Node = dom.window.Node;
  globalThis.NodeFilter = dom.window.NodeFilter;
  globalThis.DOMParser = dom.window.DOMParser;
  return dom;
}

function llistaFontsJsx(dir) {
  const resultat = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const complet = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      resultat.push(...llistaFontsJsx(complet));
      continue;
    }
    if (!/\.(?:js|jsx)$/.test(entrada.name)) continue;
    if (/\.(?:test|spec)\.(?:js|jsx)$/.test(entrada.name)) continue;
    resultat.push(complet);
  }
  return resultat.sort();
}

function valorLiteralAtribut(attr) {
  if (!attr || !attr.value) return null;
  if (attr.value.type === 'StringLiteral') return attr.value.value;
  if (attr.value.type === 'JSXExpressionContainer') {
    const expr = attr.value.expression;
    if (expr.type === 'StringLiteral') return expr.value;
    if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
      return expr.quasis[0]?.value?.cooked ?? null;
    }
  }
  return null;
}

function teRelSegur(attrRel) {
  if (!attrRel || !attrRel.value) return false;
  const lit = valorLiteralAtribut(attrRel);
  if (typeof lit === 'string') {
    const tokens = lit.toLowerCase().split(/\s+/);
    // noreferrer implica noopener en l'estàndard HTML WHATWG (acceptat a CopyrightPage CC0)
    return (tokens.includes('noopener') && tokens.includes('noreferrer')) || tokens.includes('noreferrer');
  }
  // Expressió dinàmica explícita (ex. relEnllacExtern(...) o REL_DE_FORA)
  return attrRel.value.type === 'JSXExpressionContainer';
}

test('IDEA-343 · sanitizeHtml + parseMarkdown injecten target="_blank" als externs i netegen interns i esquemes d’acció', async () => {
  const dom = instalLaDom('https://socdepoble.org/wikidepoble');
  try {
    const { sanitizeHtml } = await import('../src/utils/sanitize.js');
    const { esEnllacExtern, relEnllacExtern } = await import('../src/utils/enllacosExterns.js');
    const { parseMarkdown } = await import('../src/sections/wiki-de-poble/parseMarkdown.js');

    const lligAncora = (html, opcions) => {
      const caixa = dom.window.document.createElement('div');
      caixa.innerHTML = sanitizeHtml(html, opcions);
      return caixa.querySelector('a');
    };

    // 1. Positius externs (HTTP i HTTPS fora de socdepoble.org, sense target previ)
    for (const url of ['https://blog.google/', 'http://zona14.org/', 'https://gentdelatorre.net/', 'https://socdepoble.cat/']) {
      assert.equal(esEnllacExtern(url), true, `esEnllacExtern ha de ser true per a ${url}`);
      const ugc = lligAncora(`<a href="${url}">Extern</a>`);
      assert.equal(ugc.getAttribute('target'), '_blank', `${url} ha d'obrir en _blank`);
      assert.equal(ugc.getAttribute('rel'), 'ugc nofollow noopener noreferrer');

      const editorial = lligAncora(`<a href="${url}">Editorial</a>`, { enllacosEditorials: true });
      assert.equal(editorial.getAttribute('target'), '_blank');
      assert.equal(editorial.getAttribute('rel'), 'noopener noreferrer');

      const patrocinat = lligAncora(`<a href="${url}" rel="sponsored dofollow">Patrocini</a>`);
      assert.equal(patrocinat.getAttribute('target'), '_blank');
      assert.equal(patrocinat.getAttribute('rel'), 'ugc nofollow sponsored noopener noreferrer');
    }

    assert.equal(relEnllacExtern({ editorial: true, sponsored: true }), 'sponsored noopener noreferrer');

    // 2. Markdown de la Wiki sense target a l'origen
    const mdHtml = sanitizeHtml(
      parseMarkdown('Llig [Google](https://blog.google/) i torna al [Mur](/mur) o a la [nota](?item=genoma).', { entradilla: false }),
      { enllacosEditorials: true },
    );
    const mdCaixa = dom.window.document.createElement('div');
    mdCaixa.innerHTML = mdHtml;
    const mdEnllacos = [...mdCaixa.querySelectorAll('a')].map((a) => [
      a.getAttribute('href'),
      a.getAttribute('target'),
      a.getAttribute('rel'),
    ]);
    assert.deepEqual(mdEnllacos, [
      ['https://blog.google/', '_blank', 'noopener noreferrer'],
      ['/mur', null, 'noopener noreferrer nofollow'],
      ['?item=genoma', null, 'noopener noreferrer nofollow'],
    ]);

    // 3. Negatius interns, mateix origen, fragments i mailto:/tel: (fins i tot amb target="_blank" forçat)
    for (const intern of [
      '/mur',
      '/page/reconeixements',
      '?item=sistema_nervios_skills_i_repositoris',
      '#ancora',
      'docs/guia.md',
      'https://socdepoble.org/mur',
      'mailto:hola@socdepoble.org',
      'tel:+34600000000',
    ]) {
      assert.equal(esEnllacExtern(intern), false, `esEnllacExtern ha de ser false per a ${intern}`);
      const a = lligAncora(`<a href="${intern}" target="_blank">Intern</a>`, { enllacosEditorials: true });
      assert.equal(a.hasAttribute('target'), false, `${intern} no pot conservar target="_blank"`);
      assert.equal(a.getAttribute('rel'), 'noopener noreferrer nofollow');
    }

    // 4. Intents de bypass (//host, javascript:, data:text/html, target="_top")
    for (const malicios of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'vbscript:x',
      'data:text/html,<script>alert(1)</script>',
      '//malicios.example/x',
      ' //malicios.example/x',
    ]) {
      const a = lligAncora(`<a href="${malicios}" target="_blank" rel="dofollow">Maliciós</a>`);
      assert.equal(a.hasAttribute('href'), false, `${malicios} no pot conservar href`);
      assert.equal(a.hasAttribute('target'), false, `${malicios} no pot conservar target`);
      assert.equal(a.hasAttribute('rel'), false, `${malicios} no pot conservar rel`);
    }

    const topExtern = lligAncora('<a href="https://extern.example/" target="_top">Fora</a>');
    assert.equal(topExtern.getAttribute('target'), '_blank');
  } finally {
    dom.window.close();
  }
});

test('IDEA-343 · Escàner estàtic AST de tots els <a ...> en JSX dins de src/', () => {
  const fitxers = llistaFontsJsx(path.join(ARREL, 'src'));
  assert.ok(fitxers.length > 400, 's’esperava escanejar tot l’arbre src/');

  // Recollim primer totes les constants exportades/locals amb URL http(s) literal
  const constantsExternesGlobals = new Map();
  const asts = [];

  for (const fitxer of fitxers) {
    const relPath = path.relative(ARREL, fitxer).split(path.sep).join('/');
    const codi = fs.readFileSync(fitxer, 'utf8');
    if (!codi.includes('<a') && !codi.includes('http://') && !codi.includes('https://')) continue;
    let ast;
    try {
      ast = parse(codi, {
        sourceType: 'module',
        plugins: ['jsx'],
      });
    } catch {
      continue;
    }

    const constantsLocals = new Map();
    const registraDeclaracions = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.init) {
        let val = null;
        if (node.init.type === 'StringLiteral') val = node.init.value;
        else if (node.init.type === 'TemplateLiteral' && node.init.expressions.length === 0) {
          val = node.init.quasis[0]?.value?.cooked ?? null;
        }
        if (typeof val === 'string' && /^https?:\/\//i.test(val)) {
          constantsLocals.set(node.id.name, val);
          constantsExternesGlobals.set(node.id.name, val);
        }
      }
      for (const clau of Object.keys(node)) {
        if (clau === 'loc' || clau === 'start' || clau === 'end') continue;
        const fill = node[clau];
        if (Array.isArray(fill)) fill.forEach(registraDeclaracions);
        else if (fill && typeof fill.type === 'string') registraDeclaracions(fill);
      }
    };
    registraDeclaracions(ast.program);
    if (codi.includes('<a')) asts.push({ relPath, ast, constantsLocals });
  }

  const infraccions = [];

  for (const { relPath, ast, constantsLocals } of asts) {
    const visita = (node) => {
      if (!node || typeof node !== 'object') return;
      if (
        node.type === 'JSXOpeningElement'
        && node.name?.type === 'JSXIdentifier'
        && node.name.name === 'a'
      ) {
        const atributs = node.attributes.filter((a) => a.type === 'JSXAttribute');
        const perNom = new Map(
          atributs
            .filter((a) => a.name?.type === 'JSXIdentifier')
            .map((a) => [a.name.name, a]),
        );
        const attrHref = perNom.get('href');
        const attrTarget = perNom.get('target');
        const attrRel = perNom.get('rel');
        const attrDownload = perNom.get('download');
        const linia = node.loc?.start?.line ?? 0;

        let hrefResolt = valorLiteralAtribut(attrHref);
        if (
          hrefResolt === null
          && attrHref?.value?.type === 'JSXExpressionContainer'
          && attrHref.value.expression?.type === 'Identifier'
        ) {
          const idNom = attrHref.value.expression.name;
          hrefResolt = constantsLocals.get(idNom) ?? constantsExternesGlobals.get(idNom) ?? null;
        }

        const targetLit = valorLiteralAtribut(attrTarget);

        if (typeof hrefResolt === 'string') {
          if (/^https?:\/\//i.test(hrefResolt) && !attrDownload) {
            const faltaTarget = targetLit !== '_blank';
            const faltaRel = !teRelSegur(attrRel);
            if ((faltaTarget || faltaRel) && !COSTURA_PENDENT_ALTRES_KITS.has(relPath)) {
              infraccions.push(
                `${relPath}:${linia} -> <a href="${hrefResolt}"> extern sense target="_blank" i rel segur`,
              );
            }
          } else if (/^(?:mailto:|tel:|#)/i.test(hrefResolt)) {
            if (targetLit === '_blank') {
              infraccions.push(
                `${relPath}:${linia} -> <a href="${hrefResolt}"> no pot portar target="_blank"`,
              );
            }
          } else if (
            hrefResolt.startsWith('/')
            && !hrefResolt.startsWith('//')
            && !/^\/(?:assets|opendata|\.well-known|nodeinfo|ap|federation)\//i.test(hrefResolt)
          ) {
            if (targetLit === '_blank' && !EXCEPCIO_FORMULARI_ALTA.has(relPath)) {
              infraccions.push(
                `${relPath}:${linia} -> <a href="${hrefResolt}"> ruta interna de la SPA amb target="_blank"`,
              );
            }
          }
        }
      }

      for (const clau of Object.keys(node)) {
        if (clau === 'loc' || clau === 'start' || clau === 'end') continue;
        const fill = node[clau];
        if (Array.isArray(fill)) fill.forEach(visita);
        else if (fill && typeof fill.type === 'string') visita(fill);
      }
    };
    visita(ast.program);
  }

  assert.deepEqual(infraccions, []);
});
