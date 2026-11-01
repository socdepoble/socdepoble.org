// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';

/* P1-28 (assalt 10/10, 261101, T4b) · Cap paraula tallada a la Columna 1 de
   l'UniversalWorkspace quan l'arbre es queda estret (201 px a 1024 px).
   jsdom no resol @container ni pinta: es comprova la regla escrita. La mesura
   de veres (Chrome a 1024 × 768: 0 rètols de fila tallats a /notes,
   /multimedia, /wikidepoble i /disseny; geometria idèntica a 1100, 1280 i
   1440, al Xat i al panell de mòbil) és a l'informe del carril T4b. */

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla: { prelud, cos, pares } (pares: els blocs que la contenen). */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}
const declaracions = (cos) => Object.fromEntries(cos.split(';').map((d) => d.split(':')).filter((p) => p.length >= 2)
  .map(([prop, ...valor]) => [prop.trim(), valor.join(':').trim()]));

/* Lectura de l'AST de la closca: l'ordre dels atributs o el format no hi compten. */
const SALTA = new Set(['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments']);
function elementsJsx(node, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) { for (const fill of node) elementsJsx(fill, acc); return acc; }
  if (node.type === 'JSXElement') acc.push(node);
  for (const [clau, valor] of Object.entries(node)) if (!SALTA.has(clau)) elementsJsx(valor, acc);
  return acc;
}
const atribut = (el, nom) => el.openingElement.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === nom);
function classeDe(el) {
  const valor = atribut(el, 'className')?.value;
  if (valor?.type === 'StringLiteral') return valor.value;
  if (valor?.type === 'JSXExpressionContainer' && valor.expression.type === 'Identifier') return `{${valor.expression.name}}`;
  return null;
}
const fillsJsx = (el) => el.children.filter((c) => c.type === 'JSXElement');

const MODULS = regles(llig('src/css/modules.css'));
/* Només en «ample»: la columna és una pista de la graella. En «estret» i
   «mitja» és un panell de width: max-content, i la contenció l'encongiria. */
const ARREL = '.app-grid-shell[data-layout="ample"] > .app-grid-content > .app-grid-column--left .sdp-workspace-groups';
const CONSULTA = '@container sdp-navegacio (max-width: 239.98px)';
const XARXA = '@media (min-width: 1024px) and (max-width: 1121.98px)';
const ESPAIADOR = '.sdp-workspace-folder-row > .sdp-workspace-folder-toggle-spacer';
const NOM_AMB_FILLS = '.sdp-workspace-folder-row > .sdp-workspace-nav-item[aria-expanded]:not(.sdp-workspace-folder-toggle)';
const INSIGNIA_FULLA = '.sdp-workspace-folder-row > .sdp-workspace-nav-item:not([aria-expanded]) > .sdp-insignia';
const INSIGNIA_CARPETA = `${NOM_AMB_FILLS} > .sdp-insignia`;
const ESPERAT = {
  [ESPAIADOR]: { display: 'none' },
  [NOM_AMB_FILLS]: { 'padding-inline-end': '0' },
  [INSIGNIA_FULLA]: { 'margin-inline-end': 'var(--sdp-touch-min)' },
  [INSIGNIA_CARPETA]: { 'margin-inline-end': 'var(--sdp-space-4)' },
  '.sdp-workspace-folder-row .sdp-workspace-nav-item__label': { 'white-space': 'normal' }
};
const dins = (pare) => MODULS.filter((r) => r.pares.includes(pare));

describe('P1-28 · la Columna 1 estreta no talla paraules', () => {
  test('l’arrel de l’arbre és el contenidor, només en «ample» i dins de @layer components', () => {
    const r = MODULS.filter((x) => /container-(name|type)/.test(x.cos));
    const nostres = r.filter((x) => /sdp-navegacio/.test(x.cos));
    expect(nostres).toHaveLength(1);
    expect(nostres[0].prelud).toBe(ARREL);
    expect(declaracions(nostres[0].cos)).toEqual({ 'container-name': 'sdp-navegacio', 'container-type': 'inline-size' });
    expect(nostres[0].pares).toEqual(['@layer components']);
    /* Cap contenidor d'amplària a l'arbre fora d'«ample» ni a la zona de
       desplaçament (la del Xat porta la mateixa classe). */
    expect(r.filter((x) => x !== nostres[0] && /sdp-workspace-(groups|column__body)/.test(x.prelud))).toEqual([]);
  });

  test('l’ancoratge del contenidor existix: closca > graella > columna esquerra, i l’arrel de l’arbre', () => {
    const codi = llig('src/components/layout/AppGridShell.jsx');
    const elements = elementsJsx(parse(codi, { sourceType: 'module', plugins: ['jsx'] }));
    const closca = elements.find((el) => classeDe(el) === 'app-grid-shell');
    expect(closca, 'la closca .app-grid-shell').toBeTruthy();
    expect(atribut(closca, 'data-layout'), 'data-layout a la closca').toBeTruthy();
    const graella = fillsJsx(closca).find((el) => classeDe(el) === '{contentMods}');
    expect(graella, 'la graella, filla directa de la closca').toBeTruthy();
    expect(codi).toMatch(/const contentMods = \[\s*'app-grid-content',/);
    const esquerra = fillsJsx(graella).find((el) => (classeDe(el) || '').split(' ').includes('app-grid-column--left'));
    expect(esquerra, 'la columna esquerra, filla directa de la graella').toBeTruthy();
    /* En «estret» la navegació és un panell de max-content: per això el contenidor només viu en «ample». */
    expect(llig('src/components/layout/AppGridShell.css')).toMatch(/\.app-grid-shell\[data-layout="estret"\] \.app-grid-column--left \{[^}]*width: max-content;/);
    expect(llig('src/components/universal/workspace/UniversalWorkspace.jsx')).toContain('<div className="sdp-workspace-groups"');
  });

  test('a l’arbre estret: sense espaiador, sense coixí final al nom amb fills, la Insígnia al seu lloc i salt de línia per l’espai', () => {
    const consulta = dins(CONSULTA);
    expect(consulta.map((r) => r.prelud).sort()).toEqual(Object.keys(ESPERAT).sort());
    for (const r of consulta) {
      expect(declaracions(r.cos)).toEqual(ESPERAT[r.prelud]);
      expect(r.pares).toEqual(['@layer components', CONSULTA]);
    }
  });

  test('la xarxa sense @container porta les mateixes declaracions, dins de l’arbre d’«ample»', () => {
    const xarxa = dins(XARXA);
    expect(xarxa).toHaveLength(Object.keys(ESPERAT).length);
    for (const r of xarxa) {
      expect(r.pares).toEqual(['@layer components', '@supports not (container-type: inline-size)', XARXA]);
      const original = Object.keys(ESPERAT).find((s) => r.prelud === `${ARREL} ${s}`);
      expect(original, r.prelud).toBeTruthy();
      expect(declaracions(r.cos)).toEqual(ESPERAT[original]);
    }
  });

  test('la Insígnia de recompte no es mou: rep de marge el que la fila deixa de reservar', () => {
    /* Fulla: l'amplària de l'espaiador que s'amaga. Nom amb fills: el coixí
       final que es lleva. Així continua a 64 px de la vora (16 + 48), com a
       l'arbre ample i com la de la carpeta: la columna de recomptes no es mou. */
    const espaiador = MODULS.find((r) => r.prelud.includes(ESPAIADOR) && r.pares.length === 1 && /width/.test(r.cos));
    const fila = MODULS.filter((r) => r.prelud === '.sdp-workspace-nav-item' && r.pares.length === 1 && 'padding' in declaracions(r.cos));
    expect(fila).toHaveLength(1);
    const [, coixiFinal] = declaracions(fila[0].cos).padding.split(/\s+/);
    expect(ESPERAT[INSIGNIA_FULLA]['margin-inline-end']).toBe(declaracions(espaiador.cos).width);
    expect(ESPERAT[INSIGNIA_CARPETA]['margin-inline-end']).toBe(coixiFinal);
    /* La regla base de la Insígnia de la fila no porta cap marge final: el de
       la consulta no en trepitja cap altre. */
    const base = MODULS.filter((r) => r.prelud === '.sdp-workspace-nav-item > .sdp-insignia' && r.pares.length === 1);
    expect(base).toHaveLength(1);
    expect(declaracions(base[0].cos)).toEqual({ 'margin-inline-start': 'auto', flex: 'none' });
  });

  test('mai a mitja paraula: cap overflow-wrap, word-break ni hyphens, i cap mida ni espaiat de lletra', () => {
    for (const r of [...dins(CONSULTA), ...dins(XARXA)]) {
      expect(r.cos).not.toMatch(/overflow-wrap|word-break|hyphens|font-size|letter-spacing/);
    }
  });

  test('fora de l’arbre estret res no canvia: el rètol de sempre, en una línia amb el·lipsi, i l’espaiador de 48', () => {
    const base = MODULS.filter((r) => r.prelud === '.sdp-workspace-nav-item__label' && r.pares.length === 1);
    expect(base).toHaveLength(1);
    expect(declaracions(base[0].cos)).toMatchObject({ 'white-space': 'nowrap', 'text-overflow': 'ellipsis', overflow: 'hidden' });
    const espaiador = MODULS.find((r) => r.prelud.includes('.sdp-workspace-folder-row > .sdp-workspace-folder-toggle-spacer') && r.pares.length === 1 && /width/.test(r.cos));
    expect(declaracions(espaiador.cos)).toMatchObject({ width: 'var(--sdp-touch-min)', flex: 'none' });
  });
});
