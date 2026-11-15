// @vitest-environment node
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {expect,test} from 'vitest';
const css=readFileSync('src/css/components.css','utf8');
const root=postcss.parse(css);
const decls=selector=>{const out={};root.walkRules(r=>{if(r.selectors?.includes(selector))r.walkDecls(d=>{out[d.prop]=d.value})});return out};
test('estat Publicat conserva la caixa/tipografia canònica, sense selectors interactius',()=>{
  const base=decls('.sdp-boto'),status=decls('.sdp-visibilitat-linia__estat-publicat');
  const shared=decls('.sdp-visibilitat-linia__boto');
  expect(status.display).toBe(shared.display);
  expect(status['min-block-size']).toBe(shared['min-block-size']);
  expect(status.padding).toBe(base.padding);
  for(const p of ['font','font-size','font-weight','line-height','border-radius'])expect(status[p],p).toBe(base[p]);
  expect(status.border).toBe('2px solid var(--sdp-exit-control)');
  expect(status['align-items']).toBe(shared['align-items']);
  expect(status['justify-content']).toBe(shared['justify-content']);
  expect(status.gap).toBe(shared.gap);
  expect(status.cursor).toBe('default');
  expect(status.transition).toBeUndefined();
  expect(status.transform).toBeUndefined();
  root.walkRules(r=>{for(const s of r.selectors??[])if(s.includes('.sdp-visibilitat-linia__estat-publicat'))expect(s).not.toMatch(/:active|:hover|:focus/)});
});
