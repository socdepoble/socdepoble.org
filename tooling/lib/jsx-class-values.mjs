import { parse } from '@babel/parser';

/** Literal class values from JSX expressions, never literals used as conditions.
 * Template quasis are handled by the existing static-template extractor.
 * Parse failures propagate: malformed source cannot silently shrink the audit.
 */
export function jsxClassValues(text) {
  const ast = parse(text, { sourceType: 'module', plugins: ['jsx'] });
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
