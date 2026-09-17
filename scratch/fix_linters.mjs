import fs from 'fs';

// 1. sanitize.js
let s = fs.readFileSync('src/utils/sanitize.js', 'utf8');
s = s.replace(/\\-/g, '-');
fs.writeFileSync('src/utils/sanitize.js', s);

// 2. design_guard.mjs
let d = fs.readFileSync('tooling/gates/design_guard.mjs', 'utf8');
if (!d.includes('import path')) d = "import path from 'path';\nimport { fileURLToPath } from 'url';\n" + d;
fs.writeFileSync('tooling/gates/design_guard.mjs', d);

// 3. tractor-adaptadors.mjs
let a = fs.readFileSync('tooling/gates/tractor-adaptadors.mjs', 'utf8');
if (!a.includes('import path')) a = "import path from 'path';\nimport { fileURLToPath } from 'url';\n" + a;
fs.writeFileSync('tooling/gates/tractor-adaptadors.mjs', a);

// 4. verificador-scc.mjs
let v = fs.readFileSync('tooling/gates/verificador-scc.mjs', 'utf8');
if (!v.includes('import path')) v = "import path from 'path';\n" + v;
fs.writeFileSync('tooling/gates/verificador-scc.mjs', v);

// 5. tractor-psicopatia.test.mjs
let pt = fs.readFileSync('tooling/gates/tractor-psicopatia.test.mjs', 'utf8');
pt = pt.replace(/\{\s*\}/g, '{ /* empty */ }');
fs.writeFileSync('tooling/gates/tractor-psicopatia.test.mjs', pt);

// 6. tractor-vocabulari.mjs
let tv = fs.readFileSync('tooling/gates/tractor-vocabulari.mjs', 'utf8');
if (tv.startsWith("import { fileURLToPath }")) {
  tv = tv.replace("import { fileURLToPath } from 'node:url';\n#!/usr/bin/env node\n", "#!/usr/bin/env node\nimport { fileURLToPath } from 'node:url';\n");
  fs.writeFileSync('tooling/gates/tractor-vocabulari.mjs', tv);
}

console.log('Fixed linter errors.');
