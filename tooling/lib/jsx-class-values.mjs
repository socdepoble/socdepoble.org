import { parse } from '@babel/parser';

/** L'única anàlisi que compartixen tots els lectors de baix. Si la font no s'analitza, l'error puja. */
export const analitzaJsx = (text) => parse(text, { sourceType: 'module', plugins: ['jsx'] });

/** Literal class values from JSX expressions, never literals used as conditions.
 * Template quasis are handled by the existing static-template extractor.
 * Parse failures propagate: malformed source cannot silently shrink the audit.
 */
export function jsxClassValues(text, ast = analitzaJsx(text)) {
  const values = [];
  function value(node) {
    if (!node) return;
    if (node.type === 'StringLiteral') values.push({ value: node.value, index: node.start });
    else if (node.type === 'ConditionalExpression') { value(node.consequent); value(node.alternate); }
    else if (node.type === 'LogicalExpression') {
      if (node.operator !== '&&') value(node.left);
      value(node.right);
    } else if (node.type === 'TemplateLiteral') node.expressions.forEach(value);
    else if (node.type === 'ArrayExpression') node.elements.forEach(value);
    else if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression'
      && !node.callee.computed && ['join', 'filter'].includes(node.callee.property.name)) value(node.callee.object);
  }
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXAttribute' && ['className', 'class'].includes(node.name?.name)
      && node.value?.type === 'JSXExpressionContainer') value(node.value.expression);
    for (const [key, child] of Object.entries(node)) {
      if (['loc', 'extra', 'comments'].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(visit); else visit(child);
    }
  }
  visit(ast);
  return values;
}

/* Salts de línia de JavaScript: es conserven perquè les línies no es moguen. */
const SALTS = new Set(['\n', '\r', String.fromCharCode(0x2028), String.fromCharCode(0x2029)]);

/** Decisió del Mestre (30-10-2026), deute CSS «la part segura ara» · El codi
 * sense comentaris, amb la mateixa llargària i les mateixes línies: cada
 * caràcter d'un comentari passa a espai i els salts es conserven. Els límits
 * els dona l'analitzador, no una heurística: senseComentarisJS (codi.mjs) pren
 * l'apòstrof d'un text JSX («l'acte») per una cadena i «/perfil/*» per un
 * comentari, i esborrava codi de veres (17 classes de TaulerTelemetria.jsx).
 * Una font que no s'analitza fa caure la porta: mai s'audita a mitges. */
export function codiSenseComentaris(text, ast = analitzaJsx(text)) {
  const car = text.split('');
  for (const { start, end } of ast.comments ?? []) {
    for (let i = start; i < end; i++) if (!SALTS.has(car[i])) car[i] = ' ';
  }
  return car.join('');
}

/** Les propietats personalitzades (--x) que la mateixa font fixa en un node:
 * les claus literals de l'objecte de usePropietatsCss(ref, {…}) (també dins
 * d'un ?: o d'un && / ||), el primer argument literal de .setProperty('--x', …)
 * i les claus d'un style={{…}}. Una cadena '--x' en qualsevol altre lloc (un
 * text, un mapa de documentació, un comentari) no declara res. */
export function propietatsFixades(text, ast = analitzaJsx(text)) {
  const noms = [];
  const literal = (node) => {
    if (node?.type === 'StringLiteral') return node.value;
    if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0]?.value.cooked ?? null;
    return null;
  };
  const afig = (nom) => { if (typeof nom === 'string' && nom.startsWith('--')) noms.push(nom); };
  const objecte = (node) => {
    if (!node) return;
    if (node.type === 'ObjectExpression') {
      for (const p of node.properties) if (p.type === 'ObjectProperty') afig(literal(p.key));
    } else if (node.type === 'ConditionalExpression') { objecte(node.consequent); objecte(node.alternate); }
    else if (node.type === 'LogicalExpression') { objecte(node.left); objecte(node.right); }
  };
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression' || node.type === 'OptionalCallExpression') {
      const { callee } = node;
      if (callee.type === 'Identifier' && callee.name === 'usePropietatsCss') objecte(node.arguments[1]);
      if ((callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression')
        && !callee.computed && callee.property.name === 'setProperty') afig(literal(node.arguments[0]));
    }
    if (node.type === 'JSXAttribute' && node.name?.name === 'style' && node.value?.type === 'JSXExpressionContainer') objecte(node.value.expression);
    for (const [key, child] of Object.entries(node)) {
      if (['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(visit); else visit(child);
    }
  }
  visit(ast);
  return noms;
}

/** Pedra Seca, part C (proposta 261031) · Una sola passada per l'arbre per a
 * dues preguntes de la porta:
 *  · `prosa`: els trams [inici, fi) de text que es llig a la pantalla, el
 *    d'un element (JSXText) i el valor literal d'un atribut que no és
 *    className ni class (descripcio="…", title="…"). Un «class='x'» escrit
 *    ací és una frase, no una classe que es pinta (LLEI 1).
 *  · `comparacions`: les posicions on document.body, document.head o
 *    document.documentElement és, sencer, un operand d'una comparació
 *    d'identitat (===, !==, ==, !=): «el focus és al body?». Comparar no toca
 *    el document amfitrió; un accés (document.body.append), un argument, un
 *    return o un portal sí, i continuen comptant (LLEI 6). */
export function prosaIComparacions(text, ast = analitzaJsx(text)) {
  const prosa = [];
  const comparacions = new Set();
  const salta = new Set(['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments']);
  (function visit(node, pare) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXText') prosa.push([node.start, node.end]);
    else if (node.type === 'JSXAttribute' && node.value?.type === 'StringLiteral'
      && !['className', 'class', 'srcDoc', 'dangerouslySetInnerHTML'].includes(node.name?.name)) prosa.push([node.value.start, node.value.end]);
    else if ((node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') && !node.computed
      && node.object?.type === 'Identifier' && node.object.name === 'document'
      && ['body', 'head', 'documentElement'].includes(node.property?.name)
      && pare?.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(pare.operator)) comparacions.add(node.start);
    for (const [key, child] of Object.entries(node)) {
      if (salta.has(key)) continue;
      if (Array.isArray(child)) child.forEach((c) => visit(c, node)); else visit(child, node);
    }
  })(ast, null);
  return { prosa, comparacions };
}
