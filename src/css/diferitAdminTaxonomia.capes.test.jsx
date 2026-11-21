/**
 * v1.2.18 · Sostre d'arrencada (D-v1214-1) · Els fills .sdp-admin-taxonomia__* viatgen en un full diferit
 * (diferit-admin-taxonomia.css), adoptat per cada element que en porta una classe abans del primer pintat.
 * L'arrel .sdp-admin-taxonomia i :where(.sdp-admin-taxonomia) .sdp-admin-dl es queden a modules.css: comparteixen
 * element amb sdp-workspace-settings-inline (arrencada) i sdp-safata-lssi (un altre full diferit), i l'ordre de la
 * cascada no ha de canviar (Llei del Píxel).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { parse } from '@babel/parser';
import cssAdminTaxonomia from './diferit-admin-taxonomia.css?inline';
import { adoptaFullDiferit } from '../config/fullDiferit.js';
import { fullsArrencada } from '../../tooling/gates/tractor-vocabulari.mjs';
import PanellSessionsDetall from '../sections/profile/admin/PanellSessionsDetall.jsx';

/* Vitest no servix el text dels .css?inline: una regla de mostra. */
vi.mock('./diferit-admin-taxonomia.css?inline', () => ({ default: '.sdp-admin-taxonomia__panel { display: flex; }' }));
/* v1.2.18 · Gauntlet R2 (L4R2-02) · El mòdul de veres amb un espia a adoptaFullDiferit: compta les crides que fa
   el ref d'un consumidor real (el full s'adopta igual, perquè l'espia crida l'original). */
vi.mock('../config/fullDiferit.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, adoptaFullDiferit: vi.fn(original.adoptaFullDiferit) };
});

const ARREL = process.cwd();
const llegix = (cami) => readFileSync(resolve(ARREL, cami), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const CLAU = 'admin-taxonomia';
const fullsDeLArrel = () => (document.adoptedStyleSheets?.length ?? 0)
  + document.querySelectorAll(`style[data-sdp-full-diferit="${CLAU}"]`).length;
const NOM_DEL_REF = 'adoptaEstilsAdminTaxonomia';

/* v1.2.18 · Gauntlet R2 (L4R2-02) · Cada aparició del nom del ref en un fitxer: «modul» si és el nom d'un const del
   cos del mòdul (fora de tot component), «ref» si és l'expressió d'un ref={…} i «altre» per a la resta (una
   redeclaració dins d'un component, un paràmetre, una crida a mà). */
function usosDelRef(font) {
  const { program } = parse(font, { sourceType: 'module', plugins: ['jsx'] });
  const deModul = new Set(program.body
    .filter((sentencia) => sentencia.type === 'VariableDeclaration' && sentencia.kind === 'const')
    .flatMap((sentencia) => sentencia.declarations.map((declarador) => declarador.id)));
  const deRef = new Set();
  const usos = [];
  const visita = (node) => {
    if (Array.isArray(node)) { node.forEach(visita); return; }
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'JSXAttribute' && node.name.name === 'ref' && node.value?.type === 'JSXExpressionContainer') deRef.add(node.value.expression);
    if (node.type === 'Identifier' && node.name === NOM_DEL_REF) usos.push(deModul.has(node) ? 'modul' : deRef.has(node) ? 'ref' : 'altre');
    for (const [clau, valor] of Object.entries(node)) if (clau !== 'loc' && valor && typeof valor === 'object') visita(valor);
  };
  visita(program);
  return usos;
}

function fontsJsx(dir, out = []) {
  for (const nom of readdirSync(dir)) {
    const cami = join(dir, nom);
    if (statSync(cami).isDirectory()) fontsJsx(cami, out);
    else if (/\.jsx$/.test(nom) && !/\.test\.jsx$/.test(nom)) out.push(cami);
  }
  return out;
}

/* Etiquetes JSX d'obertura (amb atributs en diverses línies i expressions entre claus). */
function etiquetes(font) {
  const out = [];
  const obre = /<([a-z][\w-]*)\b/g;
  let m;
  while ((m = obre.exec(font))) {
    let j = obre.lastIndex, prof = 0, cometa = null;
    for (; j < font.length; j += 1) {
      const c = font[j];
      if (cometa) { if (c === cometa && font[j - 1] !== '\\') cometa = null; }
      else if ((c === '"' || c === "'" || c === '`') && prof === 0) cometa = c;
      else if (c === '{') prof += 1;
      else if (c === '}') prof -= 1;
      else if (c === '>' && prof === 0) break;
    }
    out.push(font.slice(m.index, j + 1));
  }
  return out;
}

afterEach(() => cleanup());

describe('v1.2.18 · el full diferit dels panells d’administració', () => {
  test('cap selector .sdp-admin-taxonomia__* viatja a l’arrencada; l’arrel i :where(...) es queden a modules.css', () => {
    const modules = senseComentaris(llegix('src/css/modules.css'));
    expect(modules).not.toContain('.sdp-admin-taxonomia__');
    expect(modules).toMatch(/\.sdp-admin-taxonomia,\s*\.sdp-admin-importacio \{/);
    expect(modules).toContain(':where(.sdp-admin-taxonomia) .sdp-admin-dl {');
    /* v1.2.18 · Gauntlet R2 (L4R2-01) · Tota la cadena d'@import d'index.css (la mateixa de la Porta Vocabulari), no
       una llista a mà de tres fulls: una regla .sdp-admin-taxonomia__* a taulers.css o a base.css també tornaria a
       l'arrencada, i la classe deixaria de ser «només diferida» per a V4. */
    const { fulls, absents } = fullsArrencada(ARREL);
    expect(absents).toEqual([]);
    expect(fulls).toEqual(expect.arrayContaining(['src/css/index.css', 'src/css/base.css', 'src/css/modules.css', 'src/css/taulers.css']));
    for (const cami of fulls) {
      expect(senseComentaris(llegix(cami)), cami).not.toContain('.sdp-admin-taxonomia__');
    }
    const diferit = llegix('src/css/diferit-admin-taxonomia.css');
    expect(diferit).toMatch(/@layer components \{/);
    for (const selector of ['.sdp-admin-taxonomia__header {', '.sdp-admin-taxonomia__panel,', '.sdp-admin-taxonomia__table-wrap--sense-marc {', '.sdp-admin-taxonomia__pagination {']) {
      expect(diferit, selector).toContain(selector);
    }
    expect(senseComentaris(diferit)).not.toMatch(/\.sdp-admin-taxonomia[,\s{]/);
  });

  test('tota etiqueta amb una classe .sdp-admin-taxonomia__* adopta el full abans de pintar', () => {
    const sensRef = [];
    let amb = 0;
    for (const cami of fontsJsx(resolve(ARREL, 'src'))) {
      const font = readFileSync(cami, 'utf8');
      if (!font.includes('sdp-admin-taxonomia__')) continue;
      /* Gauntlet R1 (L5-01) · Cada consumidor importa ell mateix el full ?inline i l'adopta amb la clau literal (Porta Vocabulari, V4). */
      expect(font, cami).toMatch(/^import cssAdminTaxonomia from '[./]+\/css\/diferit-admin-taxonomia\.css\?inline';$/m);
      /* v1.2.18 · Gauntlet R2 (L4R2-02) · La declaració, ancorada com l'import, i de mòdul: una sola, en el cos del
         mòdul; fora dels ref={…}, el nom no apareix enlloc més (cap redeclaració dins d'un component). */
      expect(font, cami).toMatch(/^const adoptaEstilsAdminTaxonomia = \(node\) => \{ if \(node\) adoptaFullDiferit\(node, 'admin-taxonomia', cssAdminTaxonomia\); \};$/m);
      expect(usosDelRef(font).filter((us) => us !== 'ref'), cami).toEqual(['modul']);
      for (const etiqueta of etiquetes(font)) {
        if (!/className=[\s\S]*sdp-admin-taxonomia__/.test(etiqueta)) continue;
        if (etiqueta.includes('ref={adoptaEstilsAdminTaxonomia}')) amb += 1;
        else sensRef.push(`${cami.slice(ARREL.length + 1)}: ${etiqueta.slice(0, 80)}`);
      }
    }
    expect(sensRef).toEqual([]);
    expect(amb).toBeGreaterThanOrEqual(60);
  });

  /* v1.2.18 · Gauntlet R2 (L4R2-02) · El ref d'un consumidor real (PanellSessionsDetall), no una còpia local. Un ref
     nou a cada render (una arrow inline al JSX o declarada dins del component) React el desenganxa i el torna a
     enganxar en cada commit, i l'espia comptaria una segona adopció; el nombre de fulls sol no ho veu, perquè
     adoptaFullDiferit és idempotent. */
  test('el ref d’un consumidor real és estable: adopta una sola vegada per arrel, no es torna a cridar en re-renderitzar i no fa res amb null', () => {
    const adopcions = () => vi.mocked(adoptaFullDiferit).mock.calls.filter(([, clau]) => clau === CLAU);
    vi.mocked(adoptaFullDiferit).mockClear();
    const abans = fullsDeLArrel();
    const consulta = vi.fn();
    const { container, rerender, unmount } = render(<PanellSessionsDetall consulta={consulta} />);
    const panell = container.querySelector('section.sdp-admin-taxonomia__panel');
    expect(panell).not.toBeNull();
    expect(adopcions()).toEqual([[panell, CLAU, cssAdminTaxonomia]]);
    expect(fullsDeLArrel()).toBe(abans + 1);
    rerender(<PanellSessionsDetall consulta={consulta} nativaIos />);
    expect(adopcions()).toHaveLength(1);
    expect(fullsDeLArrel()).toBe(abans + 1);
    expect(() => unmount()).not.toThrow();
    expect(adopcions()).toHaveLength(1);
    expect(consulta).not.toHaveBeenCalled();
  });
});
