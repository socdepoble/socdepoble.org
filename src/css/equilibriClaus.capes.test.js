// @vitest-environment node
/* Onada 12 (261011; ordres 261011_0130, punt 7: «Arquitectura Resilient i
   Auto-curativa»; proposta C18 del front 7) · AUTOCURACIÓ DEL CSS: l'equilibri
   de claus i de capes.

   El 20-09 una `@layer legacy {` sense tancar a modules.css va reanidar mig
   full: tot el que venia darrere, escrit per a la capa `components`, va
   passar a viure dins de `legacy` (una subcapa, de fet), i les regles de
   l'AppGridShell guanyaven al Bloc de Notes sense que cap prova ho diguera.
   Un navegador no avisa: tanca el que queda obert al final del fitxer i
   continua. Esta prova sí que avisa.

   Només lectura. Per a cada full:
     · cada `{` té la seua `}`, i mai es tanca una clau que no s'ha obert;
     · al final del fitxer no queda cap bloc obert (i diu quin, i a quina
       línia s'ha obert);
     · cap comentari ni cap cadena queda sense tancar (un `/*` orfe es menja
       el full fins al següent comentari, sense desquadrar cap clau);
     · tota `@layer nom {` s'obri a profunditat 0: una capa dins d'un altre
       bloc és una subcapa, i l'ordre de index.css
       (reset, sdp, legacy, components, utilities) ja no la governa.
   Les claus de dins dels comentaris, de les cadenes i dels url() no compten.
   Els tres fulls grans (modules, components i layout) són els de l'ordre; la
   resta de fulls de src van a una segona prova, amb la mateixa sonda. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');

/**
 * Recorre un full i en torna el diagnòstic:
 *  { obertes, tancades, sobreres, pendents, capesNiades, comentariObert, cadenaOberta }
 *   · sobreres: línies on hi ha una `}` sense `{` (profunditat negativa);
 *   · pendents: blocs encara oberts al final, [{ prelud, linia }];
 *   · capesNiades: `@layer nom {` obertes dins d'un altre bloc, [{ prelud, linia, dins }].
 */
export function sonda(css) {
  const pila = [];
  const sobreres = [];
  const capesNiades = [];
  let obertes = 0;
  let tancades = 0;
  let linia = 1;
  let tros = '';
  let comentariObert = null;
  let cadenaOberta = null;
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i];
    if (c === '\n') linia += 1;
    if (comentariObert !== null) {
      if (c === '*' && css[i + 1] === '/') { comentariObert = null; i += 1; }
      continue;
    }
    if (cadenaOberta !== null) {
      /* La barra s'emporta el caràcter següent (una cometa escapada no tanca). */
      if (c === '\\') { if (css[i + 1] === '\n') linia += 1; i += 1; continue; }
      /* Una cadena de CSS no passa de línia: un salt sense barra vol dir que
         no s'ha tancat. Es denuncia i no es mira res més. */
      if (c === '\n') break;
      if (c === cadenaOberta.cometa) cadenaOberta = null;
      continue;
    }
    if (c === '/' && css[i + 1] === '*') { comentariObert = linia; i += 1; continue; }
    if (c === '"' || c === "'") { cadenaOberta = { cometa: c, linia }; continue; }
    /* url( sense cometes: fins al parèntesi de tancament, res no compta. */
    if (c === '(' && /url$/i.test(tros.trimEnd().slice(-3)) && css[i + 1] !== '"' && css[i + 1] !== "'") {
      const fi = css.indexOf(')', i);
      if (fi === -1) break;
      linia += css.slice(i, fi).split('\n').length - 1;
      i = fi;
      tros += '()';
      continue;
    }
    if (c === '{') {
      obertes += 1;
      const prelud = tros.slice(tros.lastIndexOf(';') + 1).trim().replace(/\s+/g, ' ');
      if (/^@layer\b/.test(prelud) && pila.length > 0) capesNiades.push({ prelud, linia, dins: pila[pila.length - 1].prelud });
      pila.push({ prelud, linia });
      tros = '';
    } else if (c === '}') {
      tancades += 1;
      if (pila.length === 0) sobreres.push(linia);
      else pila.pop();
      tros = '';
    } else {
      tros += c;
    }
  }
  return {
    obertes,
    tancades,
    sobreres,
    pendents: pila,
    capesNiades,
    comentariObert,
    cadenaOberta: cadenaOberta ? cadenaOberta.linia : null
  };
}

/** El diagnòstic, en text: el que ha de llegir qui trenque la prova. */
const informe = (rel, d) => [
  d.obertes !== d.tancades ? `${rel}: ${d.obertes} «{» i ${d.tancades} «}»` : null,
  ...d.sobreres.map((l) => `${rel}:${l} · «}» sense cap bloc obert`),
  ...d.pendents.map((p) => `${rel}:${p.linia} · sense tancar al final del fitxer: ${p.prelud || '(bloc sense prelud)'}`),
  ...d.capesNiades.map((p) => `${rel}:${p.linia} · ${p.prelud} oberta dins de «${p.dins}» (subcapa)`),
  d.comentariObert !== null ? `${rel}:${d.comentariObert} · comentari sense tancar` : null,
  d.cadenaOberta !== null ? `${rel}:${d.cadenaOberta} · cadena sense tancar` : null
].filter(Boolean);

const GRANS = ['src/css/modules.css', 'src/css/components.css', 'src/css/layout.css'];

function fullsDe(dir, eixida = []) {
  for (const ent of readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
    const rel = `${dir}/${ent.name}`;
    if (ent.isDirectory()) fullsDe(rel, eixida);
    else if (ent.name.endsWith('.css')) eixida.push(rel);
  }
  return eixida;
}
const RESTA = fullsDe('src').filter((f) => !GRANS.includes(f)).sort();

describe('la sonda veu el que ha de vore', () => {
  test('un full sa: claus equilibrades, res pendent', () => {
    const d = sonda('@layer components {\n  .a { color: red; }\n  @media (min-width: 1px) {\n    .b { x: 1 }\n  }\n}\n');
    expect([d.obertes, d.tancades, d.sobreres, d.pendents, d.capesNiades]).toEqual([4, 4, [], [], []]);
  });

  test('el defecte del 20-09: una @layer sense tancar reanida la següent, i la sonda diu on', () => {
    const d = sonda('@layer legacy {\n.a { x: 1 }\n\n@layer components {\n  .b { y: 2 }\n}\n');
    expect(d.obertes - d.tancades).toBe(1);
    expect(d.pendents).toEqual([{ prelud: '@layer legacy', linia: 1 }]);
    expect(d.capesNiades).toEqual([{ prelud: '@layer components', linia: 4, dins: '@layer legacy' }]);
  });

  test('una clau de més es denuncia a la seua línia, encara que el total quadre', () => {
    const d = sonda('.a { x: 1 }\n}\n@layer components {\n.b { y: 2 }\n');
    expect(d.obertes).toBe(d.tancades);
    expect(d.sobreres).toEqual([2]);
    expect(d.pendents).toEqual([{ prelud: '@layer components', linia: 3 }]);
  });

  test('les claus dels comentaris, de les cadenes i dels url() no compten', () => {
    const d = sonda('/* } { @layer legacy { */\n.a::before { content: "}{"; }\n.b::after { content: \'{\\\'{\'; }\n.c { background: url(data:image/svg+xml,{x}); }\n.d[title="{"] { x: 1 }\n');
    expect([d.obertes, d.tancades, d.sobreres, d.pendents]).toEqual([4, 4, [], []]);
  });

  test('un comentari o una cadena sense tancar es denuncien amb la línia on comencen', () => {
    expect(sonda('.a { x: 1 }\n/* es menja la resta\n.b { y: 2 }\n').comentariObert).toBe(2);
    expect(sonda('.a { x: 1 }\n.b::before { content: "sense tancar; }\n.c { z: 3 }\n').cadenaOberta).toBe(2);
    expect(sonda('.a { x: 1 } /* tancat */ .b { content: "be" }').comentariObert).toBeNull();
  });
});

describe('equilibri de claus i de capes · els tres fulls grans', () => {
  test.each(GRANS)('%s: cada «{» té la seua «}», cap @layer oberta al final i cap capa niada', (rel) => {
    const d = sonda(llig(rel));
    expect(d.obertes, 'el full ha de tindre regles').toBeGreaterThan(100);
    expect(informe(rel, d)).toEqual([]);
  });

  test('els tres declaren les seues capes (si en desapareixen, la prova de dalt no mira res)', () => {
    for (const rel of GRANS) expect(llig(rel), rel).toMatch(/^@layer (components|legacy) \{/m);
  });
});

describe('equilibri de claus i de capes · la resta de fulls de src', () => {
  test('n’hi ha, i són fulls de veres', () => {
    expect(RESTA.length).toBeGreaterThan(10);
    expect(RESTA).toContain('src/components/layout/AppGridShell.css');
  });

  test.each(RESTA)('%s', (rel) => {
    expect(informe(rel, sonda(llig(rel)))).toEqual([]);
  });
});
