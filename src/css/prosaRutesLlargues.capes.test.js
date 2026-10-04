/* Correcció final (ordre del Mestre, 261004; revisió final de la nit) · A
   l'Índex mestre de la Wiki (/wikidepoble?item=00_index) 29 dels 70 enllaços
   de ruta llarga passaven de la vora del detall (overflow-x: hidden) i no es
   podien llegir: .sdp-prose tenia overflow-wrap normal. jsdom no resol la
   cascada ni parteix línies: es comprova la regla escrita, com
   PageFrame.capes.test.js. Al navegador (Chromium, 375/768/1024/1280) s'ha
   comprovat que 00_index passa de 29 enllaços tallats a 0.
   Arreglo dels verificadors (261004): NO és cert que només canvie el text
   tallat. break-word partix a la vora de la línia (la caixa de contingut de
   la prosa), no a la vora visible del detall: un enllaç o un codi que passava
   de la línia però cabia dins del farciment de l'article, i es llegia sencer,
   ara també es partix. Escombrada dels 75 documents de la Wiki (barra de
   scroll clàssica): a 1024, 103 elements no tallats canvien en 41 documents
   (a 375, 13 en 8; a 768, 42 en 30; a 1280, 23 en 16); les taules no canvien
   enlloc. Cap CSS partix només el que talla la vora visible: la regla es
   queda com l'ordre la va demanar i la decisió és del Mestre (xifres al
   RELLEU_correccio_index-wiki.txt de la nit).
   L'ordre deia `anywhere` «o l'equivalent»: és `break-word`, perquè anywhere
   també rebaixa l'amplària mínima i en mòbil estretava i allargava les
   taules de la prosa (desplaçadors horitzontals) on no es tallava res. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const BASE = net('src/css/base.css');
const REGLA = ':where(.sdp-prose) :where(a, code) { overflow-wrap: break-word; }';

/* El bloc que obri `obertura` (comptant claus) i conté `regla`. */
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

test('261004 · a la prosa, els enllaços i el codi es partixen on no caben (rutes llargues), dins de @layer components', () => {
  expect(BASE).toContain(REGLA);
  expect(blocDe(BASE, '@layer components {', REGLA)).toBe(`@layer components { ${REGLA} }`);
  // Fora de la capa legacy de la tipografia i del reset.
  expect(blocDe(BASE, '@layer legacy {', REGLA)).toBe('');
  expect(blocDe(BASE, '@layer reset {', REGLA)).toBe('');
});

test('261004 · només els enllaços i el codi de la prosa, i sense tocar l’amplària mínima (cap anywhere ni break-all)', () => {
  const partixen = [...BASE.matchAll(/([^{}]*)\{[^{}]*(?:overflow-wrap|word-break|word-wrap):[^{}]*\}/g)].map(([, selector]) => selector.trim());
  expect(partixen).toEqual([':where(.sdp-prose) :where(a, code)']);
  // anywhere rebaixaria l'amplària mínima: les taules de la prosa canviarien sense tallar-se res.
  expect(BASE).not.toMatch(/overflow-wrap:\s*anywhere/);
  expect(BASE).not.toMatch(/word-break:\s*break-all/);
  // Especificitat zero: qualsevol component la pot desfer.
  expect(REGLA.startsWith(':where(.sdp-prose) :where(')).toBe(true);
});
