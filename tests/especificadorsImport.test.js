// @vitest-environment node
/* Gauntlet 261030, cicle 3 (troballa inercia-per-text-cru-falsos-rojos) · El
   suport de proves tests/helpers/especificadorsImport.js: un comentari o una
   cadena que nomena un mòdul no és un import; qualsevol forma d'import de
   veres, sí. Els tres comentaris són els de la reproducció del Gauntlet. */
import { describe, expect, test } from 'vitest';
import { especificadorsImport, importaElModul, nomDelModul } from './helpers/especificadorsImport.js';

describe('un comentari o una cadena no és un import (la reproducció del Gauntlet)', () => {
  test.each([
    ['exportaMunicipiOpenData', 'export const x = 1;\n/* Com el paquet de dades obertes (exportaMunicipiOpenData), cap fila del veïnat. */\n'],
    ['avisosPushNatius', "import { Capacitor } from '@capacitor/core';\n/* Els avisos push (avisosPushNatius.js) arriben a la fase N4. */\n"],
    ['avisosPush', "import { useState } from 'react';\n/* N2: './avisosPush.js' (src/pwa) s'endollarà ací. */\n"],
    ['avisosPush', "// import { activaAvisosPush } from '../../pwa/avisosPush.js';\nexport const y = 2;\n"],
    ['avisosPush', "/** @see import('../pwa/avisosPush.js') */\nexport function z() {}\n"],
    ['avisosPush', "export const prosa = \"La Wiki diu: import { a } from './avisosPush.js' arribarà a la fase N2.\";\n"],
    ['avisosPush', 'export const Nota = () => <p>src/pwa/avisosPush.js</p>;\n']
  ])('%s: %j', (nom, codi) => {
    expect(importaElModul(codi, nom, 'peca.jsx')).toBe(false);
  });
});

describe('cada forma d’import de veres el nomena', () => {
  test.each([
    "import { activaAvisosPush } from '../../pwa/avisosPush.js';",
    "import '../pwa/avisosPush.js';",
    "import * as push from '@/pwa/avisosPush';",
    "export { activaAvisosPush } from './avisosPush.js';",
    "export * from './avisosPush.js';",
    "const m = await import('../pwa/avisosPush.js');",
    'const m = import(`../pwa/avisosPush.js`);',
    "const m = require('../pwa/avisosPush.js');",
    "const m = import.meta.glob('../pwa/avisosPush.js', { eager: true });",
    "const m = import.meta.glob(['../pwa/registre.js', '../pwa/avisosPush.js']);",
    "const u = new URL('../pwa/avisosPush.js?url', import.meta.url);",
    "/* N1 */ import { activaAvisosPush } from '../pwa/avisosPush.js'; // N2"
  ])('%s', (codi) => {
    expect(importaElModul(codi, 'avisosPush', 'peca.js')).toBe(true);
  });

  test('en un JSX, al costat d’un comentari que també el nomena', () => {
    const codi = "/* avisosPush */\nimport { activaAvisosPush } from '../../pwa/avisosPush.js';\nexport const B = () => <button onClick={activaAvisosPush}>Avisa'm</button>;\n";
    expect(especificadorsImport(codi, 'Boto.jsx')).toEqual(['../../pwa/avisosPush.js']);
    expect(importaElModul(codi, 'avisosPush', 'Boto.jsx')).toBe(true);
  });
});

describe('el nom del mòdul, i res més', () => {
  test('el darrer tros, sense consulta, fragment ni extensió', () => {
    expect(['./avisosPush.js', '@/pwa/avisosPush', '../pwa/avisosPush.js?url', './avisosPush.mjs#a', 'avisosPush.jsx'].map(nomDelModul))
      .toEqual(['avisosPush', 'avisosPush', 'avisosPush', 'avisosPush', 'avisosPush']);
  });

  test('avisosPush i avisosPushNatius no es confonen', () => {
    expect(importaElModul("import { creaAvisosPushNatius } from '../natiu/avisosPushNatius.js';", 'avisosPush')).toBe(false);
    expect(importaElModul("import { activaAvisosPush } from '../pwa/avisosPush.js';", 'avisosPushNatius')).toBe(false);
  });

  test('fallada tancada: un fitxer candidat que no s’analitza llança; un que no el nomena ni s’analitza', () => {
    expect(() => importaElModul("import { a } from './avisosPush.js'\nconst = ;", 'avisosPush')).toThrow();
    expect(importaElModul('const = ;', 'avisosPush')).toBe(false);
  });
});
