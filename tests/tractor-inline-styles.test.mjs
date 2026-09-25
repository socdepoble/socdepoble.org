import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analitzaEstils } from '../tooling/gates/tractor-inline-styles.mjs';

test('bloca propietats, variables, spreads i espais que les regex ometien', () => {
  for (const expression of ["{{ textAlign: 'center' }}", "{{ marginTop: 18 }}", "{{ ['color']: 'red' }}", 'styles', '{...styles}', "ok ? { padding: 1 } : {}", "{{ opacity: 0.7 }}"]) {
    assert.equal(analitzaEstils(`<div style = { ${expression.startsWith('{{') ? expression.slice(1, -1) : expression} } />`).length, 1, expression);
  }
});
test('comentaris i cadenes no són atributs; errors de parseig fallen tancats', () => {
  assert.deepEqual(analitzaEstils('const example = "style={{color: red}}"; // style={x}\nconst view = <div className="text" />;'), []);
  assert.equal(analitzaEstils('const view = <div style={').at(0).code, 'PARSE');
});
