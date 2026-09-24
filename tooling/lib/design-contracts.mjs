import { parse } from '@babel/parser';

const sourceFile = file => file.replaceAll('\\', '/').replace(/^src\//, '');
const string = (node, value) => node?.type === 'StringLiteral' && node.value === value;
const identifier = (node, name) => node?.type === 'Identifier' && node.name === name;

/** Only this primitive preview accepts a dynamic color, after a local HEX6 check.
 * The single property contract cannot transport URLs, spreads or arbitrary CSS.
 */
export function isSafeCromStyle(node, file) {
  if (sourceFile(file) !== 'components/universal/PanellCrom.jsx'
    || node?.type !== 'JSXAttribute' || node.name?.name !== 'style') return false;
  const object = node.value?.type === 'JSXExpressionContainer' && node.value.expression;
  if (object?.type !== 'ObjectExpression' || object.properties.length !== 1) return false;
  const property = object.properties[0];
  if (property.type !== 'ObjectProperty' || property.computed || property.method
    || !string(property.key, '--sdp-crom-mostra')) return false;
  const value = property.value;
  if (value?.type !== 'ConditionalExpression' || value.consequent?.type !== 'Identifier'
    || value.alternate?.type !== 'NullLiteral') return false;
  const name = value.consequent.name;
  const test = value.test;
  if (test?.type !== 'LogicalExpression' || test.operator !== '&&') return false;
  const checks = test.left;
  if (checks?.type !== 'LogicalExpression' || checks.operator !== '&&') return false;
  const length = checks.right;
  if (length?.type !== 'BinaryExpression' || length.operator !== '==='
    || length.left?.type !== 'MemberExpression' || length.left.computed
    || !identifier(length.left.object, name) || !identifier(length.left.property, 'length')
    || length.right?.type !== 'NumericLiteral' || length.right.value !== 7) return false;
  const type = checks.left;
  if (type?.type !== 'BinaryExpression' || type.operator !== '==='
    || type.left?.type !== 'UnaryExpression' || type.left.operator !== 'typeof'
    || !identifier(type.left.argument, name) || !string(type.right, 'string')) return false;
  const call = test.right;
  const member = call?.callee;
  return call?.type === 'CallExpression' && call.arguments.length === 1
    && identifier(call.arguments[0], name) && member?.type === 'MemberExpression'
    && !member.computed && identifier(member.property, 'test')
    && member.object?.type === 'RegExpLiteral'
    && member.object.pattern === '^#[0-9a-fA-F]{6}$' && member.object.flags === '';
}

export function cromStyleOffsets(text, file) {
  const offsets = new Set();
  if (sourceFile(file) !== 'components/universal/PanellCrom.jsx') return offsets;
  let ast;
  try { ast = parse(text, { sourceType: 'module', plugins: ['jsx'] }); } catch { return offsets; }
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (isSafeCromStyle(node, file)) offsets.add(node.start);
    for (const [key, child] of Object.entries(node)) {
      if (['loc', 'extra', 'comments'].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(visit); else visit(child);
    }
  }
  visit(ast);
  return offsets;
}

/** Generated, JSON-only wiki content is documentary text. Keep all executable
 * source and HTML/CSS-bearing content visible to the raw-color detector.
 * This is deliberately conservative: an ambiguous document receives no masking.
 */
export function designColorSource(text, file) {
  if (sourceFile(file) !== 'data/wikiManifest.js') return text;
  let ast;
  try { ast = parse(text, { sourceType: 'module' }); } catch { return text; }
  const body = ast.program.body;
  const declaration = body[0]?.declaration;
  if (body.length !== 1 || body[0].type !== 'ExportNamedDeclaration'
    || declaration?.type !== 'VariableDeclaration' || declaration.kind !== 'const'
    || declaration.declarations.length !== 1) return text;
  const variable = declaration.declarations[0];
  if (!identifier(variable.id, 'wikiManifest') || variable.init?.type !== 'ObjectExpression') return text;
  // No calls, computed fields, getters, template substitutions or spread values.
  try { JSON.parse(text.slice(variable.init.start, variable.init.end)); } catch { return text; }
  const items = variable.init.properties.find(p => string(p.key, 'items'))?.value;
  if (items?.type !== 'ArrayExpression') return text;
  const replacements = [];
  for (const item of items.elements) {
    if (item?.type !== 'ObjectExpression') continue;
    const content = item.properties.find(p => string(p.key, 'content'))?.value;
    if (content?.type !== 'StringLiteral') continue;
    if (text.slice(content.start, content.end) !== JSON.stringify(content.value)) continue;
    const lower = content.value.toLowerCase();
    const maskedValue = content.value.replace(/#[0-9a-fA-F]{3,8}\b/g, (token, index) => {
      const before = lower.slice(0, index);
      const lineStart = content.value.lastIndexOf('\n', index) + 1;
      const lineEnd = content.value.indexOf('\n', index);
      const line = content.value.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      let codeLanguage = null;
      let fence = null;
      for (const marker of before.matchAll(/^\s*(`{3,}|~{3,})([^\n]*)$/gm)) {
        if (!fence) { fence = marker[1][0]; codeLanguage = marker[2].trim().toLowerCase(); }
        else if (marker[1][0] === fence) { fence = null; codeLanguage = null; }
      }
      // Incomplete/multiline markup and <style> bodies stay in scope too.
      if ((fence && /^(?:css|scss|less|html|xml|svg|javascript|js|jsx|typescript|ts|tsx)(?:\s|$)/.test(codeLanguage))
        || before.lastIndexOf('<') > before.lastIndexOf('>')
        || before.lastIndexOf('<style') > before.lastIndexOf('</style')
        || /[<>]|&(?:lt|gt|#\d+|#x[\da-f]+);/i.test(line)
        || /\b(?:style\s*=|["']?(?:[\w-]*color|background[\w-]*|fill|stroke|border[\w-]*|outline[\w-]*|[\w-]*shadow|--[\w-]+)["']?\s*:)\s*[^;\n{}]*$/i.test(before)
        || /\b(?:style\s*=|["']?(?:[\w-]*color|background[\w-]*|fill|stroke|border[\w-]*|outline[\w-]*|[\w-]*shadow|--[\w-]+)["']?\s*:)/i.test(line)) return token;
      return ' '.repeat(token.length);
    });
    replacements.push([content.start, content.end, JSON.stringify(maskedValue)]);
  }
  let masked = text;
  for (const [start, end, replacement] of replacements.reverse()) {
    masked = masked.slice(0, start) + replacement + masked.slice(end);
  }
  return masked;
}
