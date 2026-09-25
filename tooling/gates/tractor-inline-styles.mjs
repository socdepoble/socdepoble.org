#!/usr/bin/env node
/** Tractor d'estils: AST JSX i excepcions canòniques compartides amb design_guard. */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { isSafeCromStyle } from '../lib/design-contracts.mjs';
import { esMain } from '../lib/arrel.mjs';

export function analitzaEstils(code, file = 'src/component.jsx') {
  const errors = [];
  let ast;
  try { ast = parse(code, { sourceType: 'unambiguous', plugins: ['jsx'] }); }
  catch (error) { return [{ file, line: error.loc?.line ?? 1, code: 'PARSE', message: error.message }]; }
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXAttribute' && node.name?.name === 'style' && !isSafeCromStyle(node, file)) {
      errors.push({ file, line: node.loc.start.line, code: 'INLINE_STYLE', message: 'Usa classes semàntiques del CSS. Només s’admeten les excepcions del contracte de disseny.' });
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(ast);
  return errors;
}
export function comprovaEstils(root = process.cwd()) {
  const errors = [];
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name), relative = path.relative(root, file).split(path.sep).join('/');
      if (entry.isSymbolicLink()) throw new Error(`Symlink no auditat: ${relative}`);
      if (['node_modules', '__tests__', '__mocks__'].includes(entry.name)) continue;
      if (entry.isDirectory()) scan(file);
      else if (/\.[cm]?[jt]sx?$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) errors.push(...analitzaEstils(fs.readFileSync(file, 'utf8'), relative));
    }
  }
  scan(path.join(root, 'src'));
  return errors;
}
if (esMain(import.meta.url)) {
  try {
    const root = process.argv.find(arg => arg.startsWith('--arrel='))?.slice(8) || process.cwd();
    const errors = comprovaEstils(path.resolve(root));
    for (const error of errors) console.error(`${error.file}:${error.line} [${error.code}] ${error.message}`);
    console.log(`[ESTILS] ${errors.length} infraccions; sense baseline ni canvis visuals.`);
    process.exitCode = errors.length ? 1 : 0;
  } catch (error) { console.error(`[ESTILS] ${error.message}`); process.exitCode = 2; }
}
