import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* jsdom no calcula ni capes ni amplària min-content: es comprova la regla escrita.
   La targeta d'accés és una columna flex centrada (components.css) i el seu cos
   pren l'amplària del contingut: una cadena sense espais (l'error cru del
   servidor, un correu llarg) l'eixamplava més que la targeta, que el retallava. */
const moduls = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

const blocDe = (text, obertura, regla) => {
  for (let obri = text.indexOf(obertura); obri >= 0; obri = text.indexOf(obertura, obri + 1)) {
    let fons = 0;
    for (let i = text.indexOf('{', obri); i < text.length; i += 1) {
      if (text[i] === '{') fons += 1;
      else if (text[i] === '}' && (fons -= 1) === 0) {
        const bloc = text.slice(obri, i + 1);
        if (bloc.includes(regla)) return bloc;
        break;
      }
    }
  }
  return '';
};

const REGLA = '.sp-card--onboarding :is(.sdp-alerta, strong) { overflow-wrap: anywhere; }';
test('l’alerta i el correu de les targetes d’accés (UniversalCard variant onboarding) partixen les cadenes llargues, dins de @layer components', () => {
  expect(moduls).toContain(REGLA);
  expect(blocDe(moduls, '@layer components {', REGLA)).toContain(REGLA);
});
