// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { expect, test } from 'vitest';

/* Llei de llistes · Ordre del Mestre (31-10-2026): els ítems (<li>) d'una
   <ul> o d'una <ol> van sempre més junts entre ells que els paràgrafs (<p>).
   L'espai entre ítems el dona només el marge del li (base.css,
   --sdp-li-gap: 4px); una llista de text no hi suma cap gap. Abans,
   .sdp-telemetria__punts (i .sdp-normes i .detail-content__llista, el mateix
   defecte) sumaven gap 8px + marge 8px = 16px, la distància dels paràgrafs.
   jsdom no aplica capes ni calcula graelles: es comprova la regla escrita.
   F10-C5 (Gauntlet, 31-10-2026): la guarda mira tots els fulls .css de src,
   no només tres; casa la classe dins de qualsevol selector compost
   (ul.sdp-normes, .sdp-normes:not(.x)) i també els <li> amb classe pròpia que
   el JSX pinta dins de la llista (.sdp-normes__zero). A més fa un cens: cap
   <ul>/<ol> del JSX que conserve els marcadors (cap regla seua amb
   list-style: none) ni cap regla de ul/ol pelada pot dur gap ni grid/flex.
   Límit: un <li> pintat per un component fill no es resol (el cens és una
   cota baixa); una classe muntada amb clsx() tampoc. */

const ARREL = process.cwd();
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full: { prelud, cos }. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim() });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

/** Fitxers d'una carpeta, recursivament, sense node_modules. */
function* fitxers(carpeta, accepta) {
  for (const nom of readdirSync(carpeta)) {
    const cami = join(carpeta, nom);
    if (statSync(cami).isDirectory()) {
      if (nom !== 'node_modules') yield* fitxers(cami, accepta);
    } else if (accepta(nom)) {
      yield cami;
    }
  }
}

/** Parteix pel separador només fora de parèntesis i claudàtors. */
function trossos(text, separador) {
  const eixida = [];
  let fondaria = 0;
  let tros = '';
  for (const c of text) {
    if (c === '(' || c === '[') fondaria++;
    else if (c === ')' || c === ']') fondaria--;
    if (fondaria === 0 && separador.test(c)) {
      eixida.push(tros);
      tros = '';
    } else {
      tros += c;
    }
  }
  eixida.push(tros);
  return eixida.map((t) => t.trim()).filter(Boolean);
}

/** Els selectors compostos d'un selector complex, sense el que va dins de :not(). */
const composts = (selector) => trossos(selector.replace(/\s*([>+~])\s*/g, ' '), /\s/)
  .map((compost) => compost.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, ''));
const classesDe = (compost) => [...compost.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);

const REGLES = [...fitxers(resolve(ARREL, 'src'), (nom) => nom.endsWith('.css'))]
  .flatMap((cami) => regles(readFileSync(cami, 'utf8')).map((r) => ({ ...r, full: relative(ARREL, cami) })))
  .filter((r) => !r.prelud.startsWith('@'))
  .map((r) => {
    const selectors = trossos(r.prelud, /,/).map(composts);
    /* Les classes de l'element que pinta la regla: les del darrer compost. */
    return { ...r, selectors, finals: new Set(selectors.flatMap((s) => classesDe(s.at(-1) ?? ''))) };
  });

const GAP = /(^|;)\s*(grid-)?(row-)?gap\s*:/;
const GRID_O_FLEX = /(^|;)\s*display\s*:\s*(inline-)?(grid|flex)\b/;
const MARGE_VERTICAL = /(^|;)\s*margin(-top|-bottom|-block(-start|-end)?)?\s*:/;
const SENSE_MARCADORS = /(^|;)\s*list-style(-type)?\s*:\s*none\b/;
const sumaGap = (regla) => GAP.test(regla.cos) || GRID_O_FLEX.test(regla.cos);

const CLASSE_JSX = /className=(?:"([^"]+)"|\{`([^`]+)`\}|\{'([^']+)'\}|\{"([^"]+)"\})/;
const classesJsx = (atributs) => {
  const m = CLASSE_JSX.exec(atributs);
  if (!m) return [];
  return (m[1] ?? m[2] ?? m[3] ?? m[4]).replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).filter((c) => /^[a-z][\w-]*$/.test(c));
};

/** Cada <ul>/<ol> del JSX amb classe literal, amb les classes dels <li> que pinta dins. */
const LLISTES_JSX = [...fitxers(resolve(ARREL, 'src'), (nom) => /\.jsx?$/.test(nom) && !nom.includes('.test.'))]
  .flatMap((cami) => {
    const font = readFileSync(cami, 'utf8');
    return [...font.matchAll(/<(ul|ol)\b([^>]*?)>/g)].flatMap((obri) => {
      const classes = classesJsx(obri[2]);
      if (!classes.length) return [];
      const etiqueta = /<(\/?)(ul|ol)\b[^>]*?(\/?)>/g;
      etiqueta.lastIndex = obri.index + obri[0].length;
      let fondaria = 1;
      let fi = font.length;
      for (let m = etiqueta.exec(font); m; m = etiqueta.exec(font)) {
        if (m[3]) continue;
        fondaria += m[1] ? -1 : 1;
        if (fondaria === 0) {
          fi = m.index;
          break;
        }
      }
      const lis = [...font.slice(obri.index, fi).matchAll(/<li\b([^>]*?)>/g)].flatMap((li) => classesJsx(li[1]));
      const linia = font.slice(0, obri.index).split('\n').length;
      return [{ on: `${relative(ARREL, cami)}:${linia}`, classes, lis: [...new Set(lis)] }];
    });
  });

/* Una llista de component lleva els marcadors (list-style: none) i pot
   ordenar-se amb grid o flex; una llista de text els conserva i no. */
const LLISTES_AMB_MARCADORS = LLISTES_JSX.filter((llista) => !REGLES.some((r) =>
  SENSE_MARCADORS.test(r.cos) && llista.classes.some((c) => r.finals.has(c))));

const LLISTES_DE_TEXT = ['sdp-telemetria__punts', 'sdp-normes', 'detail-content__llista'];

test.each(LLISTES_DE_TEXT)('Llei de llistes · .%s no suma cap gap ni grid/flex al marge dels <li>', (classe) => {
  const seues = REGLES.filter((r) => r.finals.has(classe));
  expect(seues.length, `cap regla per a .${classe}`).toBeGreaterThan(0);
  for (const regla of seues) {
    expect(regla.cos, `${regla.full}: ${regla.prelud}`).not.toMatch(GAP);
    expect(regla.cos, `${regla.full}: ${regla.prelud}`).not.toMatch(GRID_O_FLEX);
  }
});

test('Llei de llistes · cap regla d\'estes llistes ni dels seus <li> torna a posar marge vertical propi', () => {
  /* El li de les normes porta classe pròpia: el cens del JSX l'ha de vore. */
  expect(LLISTES_JSX.find((l) => l.classes.includes('sdp-normes'))?.lis).toContain('sdp-normes__zero');
  for (const classe of LLISTES_DE_TEXT) {
    const lisJsx = new Set(LLISTES_JSX.filter((l) => l.classes.includes(classe)).flatMap((l) => l.lis));
    const dels = REGLES.filter((r) => r.selectors.some((s) => {
      const ultim = s.at(-1) ?? '';
      return (/^li(?![\w-])/.test(ultim) && s.slice(0, -1).some((c) => classesDe(c).includes(classe)))
        || classesDe(ultim).some((c) => lisJsx.has(c));
    }));
    for (const regla of dels) expect(regla.cos, `${regla.full}: ${regla.prelud}`).not.toMatch(MARGE_VERTICAL);
  }
});

test('Llei de llistes · cens: cap <ul>/<ol> del JSX que conserve els marcadors duu gap ni grid/flex', () => {
  expect(LLISTES_AMB_MARCADORS.length).toBeGreaterThan(20);
  for (const classe of LLISTES_DE_TEXT) {
    expect(LLISTES_AMB_MARCADORS.some((l) => l.classes.includes(classe)), classe).toBe(true);
  }
  const infractores = LLISTES_AMB_MARCADORS.flatMap((llista) => REGLES
    .filter((r) => llista.classes.some((c) => r.finals.has(c)) && sumaGap(r))
    .map((r) => `${llista.on} · ${r.full}: ${r.prelud}`));
  expect(infractores).toEqual([]);
});

test('Llei de llistes · una regla de ul/ol pelada amb gap o grid/flex lleva els marcadors', () => {
  const infractores = REGLES
    .filter((r) => r.selectors.some((s) => /^(ul|ol)(?![\w-])/.test(s.at(-1) ?? '')) && sumaGap(r) && !SENSE_MARCADORS.test(r.cos))
    .map((r) => `${r.full}: ${r.prelud}`);
  expect(infractores).toEqual([]);
});
