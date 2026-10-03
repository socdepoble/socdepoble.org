/* Qualitat (Onada 3 · integració, ordre del Mestre): cap full de CSS de
   src/sections redefinix les classes base de Pedra Seca (.sdp-boto, les seues
   varietats .sdp-boto--* i les parts .sdp-boto__*) sense un selector d'àmbit
   de secció. PerfilShell.css ho feia: el seu .sdp-boto global es carregava
   després de components.css a la mateixa capa, anul·lava .sdp-boto--gran
   (58 px → 44 px) i pintava de blau les varietats de tota l'app.
   jsdom no resol la cascada: es comprova la regla escrita. La guarda recorre
   tots els .css de src/sections, no només el del Perfil. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori, extensio) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

/* Una classe base del Botó: .sdp-boto, .sdp-boto--x o .sdp-boto__x. No casa
   amb noms que només comencen igual (.sdp-boto-targeta-viva és una altra peça). */
const BASE_BOTO = /\.sdp-boto(?:--[\w-]+|__[\w-]+)?(?![\w-])/;
/* Arrels que no són cap secció: un «àmbit» amb elles continua sent global. */
const ARRELS_GLOBALS = new Set(['sdp-root']);

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, ' ');

/* Parteix per un separador de primer nivell (fora de parèntesis i claudàtors). */
function parteix(text, esSeparador) {
  const trossos = [];
  let fondaria = 0;
  let actual = '';
  for (const caracter of text) {
    if (caracter === '(' || caracter === '[') fondaria += 1;
    if (caracter === ')' || caracter === ']') fondaria -= 1;
    if (fondaria === 0 && esSeparador(caracter)) {
      if (actual.trim()) trossos.push(actual.trim());
      actual = '';
    } else {
      actual += caracter;
    }
  }
  if (actual.trim()) trossos.push(actual.trim());
  return trossos;
}

/* Els selectors de cada regla, també dins de @media, @layer o @supports. */
function selectorsDe(css) {
  const selectors = [];
  for (const [, preludi] of senseComentaris(css).matchAll(/([^{}]*)\{/g)) {
    const net = preludi.slice(preludi.lastIndexOf(';') + 1).trim();
    if (!net || net.startsWith('@')) continue;
    selectors.push(...parteix(net, (c) => c === ','));
  }
  return selectors;
}

/* Els compostos d'un selector, separats pels combinadors de primer nivell. */
const compostosDe = (selector) => parteix(selector, (c) => /[\s>+~]/.test(c));

/* Classes que un compost aporta com a àmbit: les de dins de :not() no ho són. */
function classesDAmbit(compost) {
  let net = compost;
  while (/:not\([^()]*\)/.test(net)) net = net.replace(/:not\([^()]*\)/g, '');
  return [...net.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
}

/* Un selector que toca una classe base del Botó ha de portar, en un compost
   anterior, una classe de secció (cap classe del Botó ni cap arrel global). */
function infraccionsDAmbit(css) {
  return selectorsDe(css).filter((selector) => {
    const compostos = compostosDe(selector);
    const primer = compostos.findIndex((compost) => BASE_BOTO.test(compost));
    if (primer === -1) return false;
    const ambit = compostos.slice(0, primer).flatMap(classesDAmbit)
      .filter((classe) => !BASE_BOTO.test(`.${classe}`) && !ARRELS_GLOBALS.has(classe));
    return ambit.length === 0;
  });
}

describe('el detector d’àmbit', () => {
  test('marca les redefinicions globals, també amb varietat, estat, @media o dins d’una llista', () => {
    expect(infraccionsDAmbit('.sdp-boto { color: red; }')).toEqual(['.sdp-boto']);
    expect(infraccionsDAmbit('.sdp-boto--secundari:hover:not(:disabled) { color: red; }'))
      .toEqual(['.sdp-boto--secundari:hover:not(:disabled)']);
    expect(infraccionsDAmbit('@media (max-width: 720px) { .sdp-boto--gran { min-height: 0; } }'))
      .toEqual(['.sdp-boto--gran']);
    expect(infraccionsDAmbit('.a, .sdp-boto__gir { color: red; }')).toEqual(['.sdp-boto__gir']);
    // Un compost amb el mateix element no és cap àmbit.
    expect(infraccionsDAmbit('.sdp-boto.altra { color: red; }')).toEqual(['.sdp-boto.altra']);
    // Les arrels globals i les negacions tampoc ho són.
    expect(infraccionsDAmbit('body .sdp-boto, :root .sdp-boto, .sdp-root .sdp-boto, :not(.x) .sdp-boto { color: red; }'))
      .toHaveLength(4);
    expect(infraccionsDAmbit('.sdp-boto--primari .sdp-boto__gir { color: red; }')).toHaveLength(1);
  });

  test('accepta un àmbit de secció, també amb :where() i amb comes dins de parèntesis', () => {
    expect(infraccionsDAmbit([
      '.perfil-espai .sdp-boto { color: red; }',
      ':where(.perfil-pagina) .sdp-boto:hover:not(:disabled) { color: red; }',
      ':where(.a, .b) > .sdp-boto--secundari { color: red; }',
      '@layer components { .notes .sdp-boto--gran { color: red; } }',
    ].join('\n'))).toEqual([]);
    // Altres peces que comencen igual i els comentaris no compten.
    expect(infraccionsDAmbit('.sdp-boto-targeta-viva { color: red; } /* .sdp-boto { } */')).toEqual([]);
  });
});

describe('els fulls de CSS de src/sections', () => {
  const fulls = fitxersDe('src/sections', /\.css$/);

  test('n’hi ha almenys un (el del Perfil): la guarda no passa en buit', () => {
    expect(fulls).toContain('src/sections/profile/PerfilShell.css');
  });

  test.each(fulls)('%s no redefinix .sdp-boto* sense un selector d’àmbit de secció', (full) => {
    expect(infraccionsDAmbit(llig(full))).toEqual([]);
  });
});

describe('el Perfil conserva els seus botons sense tocar la resta de l’app', () => {
  const css = llig('src/sections/profile/PerfilShell.css');
  const jsx = llig('src/sections/profile/PerfilShell.jsx');

  test('els botons del Perfil van dins de :where(.perfil-pagina): mateixa especificitat que abans', () => {
    const delBoto = selectorsDe(css).filter((selector) => BASE_BOTO.test(selector));
    expect(delBoto).toEqual([
      ':where(.perfil-pagina) .sdp-boto',
      ':where(.perfil-pagina) .sdp-boto:hover:not(:disabled)',
      ':where(.perfil-pagina) .sdp-boto:disabled',
    ]);
  });

  test('les tres eixides de PerfilShell porten l’àmbit a l’embolcall de la pàgina', () => {
    const embolcalls = [...jsx.matchAll(/className="([^"]*\bsdp-gestor-pagina\b[^"]*)"/g)].map((m) => m[1]);
    expect(embolcalls).toEqual(Array(3).fill('sdp-gestor-pagina perfil-pagina'));
  });
});
