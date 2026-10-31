// @vitest-environment node
/* Onada 11 (261010; prompt 261010_1730, tasca 6) · Front F: dieta de CSS mort
   amb la Llei del Píxel (skill sdp-workflow, lliçó 260923).
   Esta prova és un INFORME, no una porta de disseny: llig els tres fulls
   (modules, components i layout), trau cada classe de cada selector i la
   busca com a text a tot el repositori. Una classe que ningú nomena és una
   òrfena: la seua regla no pinta cap píxel i es pot llevar sense canviar res.
     · Compta com a ús el nom sencer com a token ([\w-]+) a qualsevol fitxer
       de text del repositori que no siga un full d'estil (src, index.html,
       public, wordpress-plugin sense dist, tests, la Wiki de 02_saber…).
     · Compta també l'ús dinàmic BEM: `sdp-insignia--${to}` o
       `sdp-x__${nom}` fan vives totes les classes amb eixe prefix fins al
       '--' o al '__' (també 'sdp-x__' + nom).
     · Exclusions del recorregut: node_modules, .git, dist, wordpress-plugin/
       dist, _wiki_de_poble/90_arxiu_historic (AGENTS §5), var, .sdp-* i
       este mateix fitxer (la instantània de baix nomena les òrfenes).
   La prova passa sempre, llevat d'una asserció: la llista d'òrfenes no pot
   CRÉIXER respecte de la instantània (INSTANTANIA) que es deixa ací després
   de la neteja. Una classe nova al CSS sense cap consumidor l'engrandix i
   la prova ho diu; una òrfena que algú torna a usar s'informa perquè es
   puga traure de la instantània.
   Viu al costat dels fulls que vigila (src/css). */
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
/* 31-10-2026 (ordre del Mestre, prompt 2208, T3.1) · i taulers.css, el Quadre de Comandament. */
const FULLS = ['src/css/modules.css', 'src/css/components.css', 'src/css/layout.css', 'src/css/taulers.css'];
const PROPI = 'src/css/qualitat.classesOrfes.test.js';
const DIRS_EXCLOSOS = new Set(['node_modules', '.git', 'dist', 'var']);
const RUTES_EXCLOSES = new Set(['wordpress-plugin/dist', '_wiki_de_poble/90_arxiu_historic']);
/* Els .css del recorregut només servixen per al revers (classes del JSX sense
   regla): del corpus de consumidors, FITXERS els deixa fora. */
const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.html', '.htm', '.php', '.md', '.json', '.svg', '.txt', '.yml', '.yaml', '.xml', '.css']);
/* Per damunt d'esta mida no hi ha marcatge escrit a mà (índexs RAG, bolcats). */
const MIDA_MAXIMA = 4 * 1024 * 1024;

/* ── Recorregut del repositori ── */
function recorre(dir, eixida = []) {
  for (const nom of readdirSync(dir)) {
    const ple = path.join(dir, nom);
    const rel = path.relative(ARREL, ple).split(path.sep).join('/');
    if (DIRS_EXCLOSOS.has(nom) || nom.startsWith('.sdp-') || RUTES_EXCLOSES.has(rel)) continue;
    const info = lstatSync(ple);
    if (info.isSymbolicLink()) continue;
    if (info.isDirectory()) recorre(ple, eixida);
    else if (EXTENSIONS.has(path.extname(nom)) && rel !== PROPI && info.size <= MIDA_MAXIMA) eixida.push(rel);
  }
  return eixida;
}

const esProva = (rel) => /\.test\.[mc]?[jt]sx?$/.test(rel) || rel.startsWith('tests/') || rel.includes('/__fixtures__/');

/* ── Tokens i construccions dinàmiques d'un text ── */
const TOKEN = /[A-Za-z0-9_-]+/g;
/* Classes construïdes, només al codi (un document no construïx classes):
   · prefix: `sdp-insignia--${to}`, `sdp-x__${nom}`, `sdp-align-${align}`
     (composicio/index.jsx), `btn-${variant}` (controls.jsx) o 'sdp-x--' +
     variable. El prefix fins al separador (-, -- o __) fa vives totes les
     classes que comencen per ell. No comença darrere d'un guió: `--sdp-${x}`
     és un token de CSS, no una classe amb prefix `sdp-`.
   · sufix: `${CLASSE}__opcio--activa` (slash.js) o '--activa' solt. El
     sufix fa viva la classe base + sufix si la base és un token conegut. */
const CODI = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.html', '.htm', '.php']);
/* Prefix i cua literal d'una plantilla: `editor-${nom}-input` dona
   ['editor-', '-input'] i només fa vives les classes que comencen i acaben
   així. Un prefix d'un sol segment (`btn-`, `app-`, `toc-`) és sovint un id
   (`app-${id}`, `toc-${useId()}`): només compta si el text de davant parla
   de classes (className, classList, variantClass, CLASSE…) o si és un
   selector (`.editor-${nom}`). */
const PREFIX_PLANTILLA = /(?<![\w-])([A-Za-z_][\w-]*[-_])\$\{[^}]*\}([\w-]*)/g;
const PREFIX_CONCATENAT = /['"]([A-Za-z_][\w-]*[-_])['"]\s*\+/g;
const SUFIX_PLANTILLA = /\}((?:--|__|-)[A-Za-z][\w-]*)/g;
const SUFIX_CADENA = /['"]((?:--|__)[A-Za-z][\w-]*)['"]/g;
const segments = (prefix) => prefix.split(/[-_]+/).filter(Boolean).length;
const contextDeClasse = (text, index) => {
  const abans = text.slice(Math.max(0, index - 120), index);
  return /class/i.test(abans) || abans.endsWith('.');
};

function indexa(text, esCodi, { tokens, prefixos, sufixos }) {
  for (const t of text.match(TOKEN) || []) tokens.add(t);
  if (!esCodi) return;
  for (const m of text.matchAll(PREFIX_PLANTILLA)) {
    if (segments(m[1]) >= 2 || contextDeClasse(text, m.index)) prefixos.add(`${m[1]}|${m[2]}`);
  }
  for (const m of text.matchAll(PREFIX_CONCATENAT)) {
    if (segments(m[1]) >= 2 || contextDeClasse(text, m.index)) prefixos.add(`${m[1]}|`);
  }
  for (const m of text.matchAll(SUFIX_PLANTILLA)) sufixos.add(m[1]);
  for (const m of text.matchAll(SUFIX_CADENA)) sufixos.add(m[1]);
}

/* ── Lectura dels fulls: regles amb línia d'inici i de fi ── */
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));

/** Blocs d'un full: { prelud, pares, fulla, cos, liniaInici, liniaFi }. */
function blocs(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  let linia = 1;
  for (const c of senseComentaris(css)) {
    if (c === '\n') linia += 1;
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      const cru = tros.slice(tros.lastIndexOf(';') + 1);
      const saltsDavant = (cru.match(/^\s*/)[0].match(/\n/g) || []).length;
      const salts = (cru.match(/\n/g) || []).length;
      pila.push({ prelud: cru.trim().replace(/\s+/g, ' '), fills: false, cos: '', liniaInici: linia - (salts - saltsDavant) });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (!marc) continue;
      eixida.push({
        prelud: marc.prelud,
        pares: pila.map((p) => p.prelud),
        fulla: !marc.fills,
        cos: marc.fills ? '' : tros.replace(/\s+/g, ' ').trim(),
        liniaInici: marc.liniaInici,
        liniaFi: linia
      });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

const PAS_DE_KEYFRAME = /^(from|to|[\d.]+%)(\s*,\s*(from|to|[\d.]+%))*$/;
const esSelector = (b) => !b.prelud.startsWith('@') && !PAS_DE_KEYFRAME.test(b.prelud) && !b.pares.some((p) => p.startsWith('@keyframes'));
/** Classes d'un selector (fora dels selectors d'atribut: [href$=".pdf"]). */
const classesDe = (prelud) => [...prelud.replace(/\[[^\]]*\]/g, '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);

/* ── Cens ── */
const DECLARADES = new Map(); // classe → [{ full, prelud, liniaInici, liniaFi, fulla }]
const REGLES = [];
for (const full of FULLS) {
  for (const b of blocs(readFileSync(path.join(ARREL, full), 'utf8'))) {
    if (!esSelector(b)) continue;
    const classes = [...new Set(classesDe(b.prelud))];
    const regla = { full, ...b, classes };
    REGLES.push(regla);
    for (const classe of classes) {
      if (!DECLARADES.has(classe)) DECLARADES.set(classe, []);
      DECLARADES.get(classe).push(regla);
    }
  }
}

const nouIndex = () => ({ tokens: new Set(), prefixos: new Set(), sufixos: new Set() });
const TOT = nouIndex();
const SENSE_PROVES = nouIndex();
const RECORREGUT = recorre(ARREL);
const FITXERS = RECORREGUT.filter((rel) => path.extname(rel) !== '.css');
for (const rel of FITXERS) {
  const text = readFileSync(path.join(ARREL, rel), 'utf8');
  const esCodi = CODI.has(path.extname(rel));
  indexa(text, esCodi, TOT);
  if (!esProva(rel)) indexa(text, esCodi, SENSE_PROVES);
}

/** Com es fa servir una classe: 'token' (sencera), 'prefix' (plantilla amb
    prefix), 'composicio' (base coneguda + sufix literal, `${CLASSE}__x`) o
    null (òrfena). */
function motiu(classe, { tokens, prefixos, sufixos }) {
  if (tokens.has(classe)) return 'token';
  for (const entrada of prefixos) {
    const [prefix, cua] = entrada.split('|');
    if (classe.length > prefix.length + cua.length && classe.startsWith(prefix) && classe.endsWith(cua)) return 'prefix';
  }
  for (const m of classe.matchAll(/[-_]/g)) {
    if (m.index > 0 && sufixos.has(classe.slice(m.index)) && tokens.has(classe.slice(0, m.index))) return 'composicio';
  }
  return null;
}
const usada = (classe, index) => motiu(classe, index) !== null;

const ORFES = [...DECLARADES.keys()].filter((c) => !usada(c, TOT)).sort();
/* Vives només per construcció dinàmica: cap fitxer les escriu senceres. */
const DINAMIQUES = [...DECLARADES.keys()].map((c) => [c, motiu(c, TOT)]).filter(([, m]) => m && m !== 'token').sort();
/* Vives només perquè una prova les nomena: al DOM no hi són. Informació
   per al Mestre, no asserció. */
const NOMES_A_PROVES = [...DECLARADES.keys()].filter((c) => usada(c, TOT) && !usada(c, SENSE_PROVES)).sort();
const ORFES_SET = new Set(ORFES);
/* Blocs que es poden llevar sencers: fulla amb classes i totes òrfenes. Un
   selector que barreja una classe viva no es toca (tasca 6). */
const BLOCS_ORFES = REGLES.filter((r) => r.fulla && r.classes.length > 0 && r.classes.every((c) => ORFES_SET.has(c)));

const on = (r) => `${r.full}:${r.liniaInici}${r.liniaFi !== r.liniaInici ? `-${r.liniaFi}` : ''}`;

/* ── El revers, per a la dieta de DOM (tasca 6, pas 3): classes escrites als
   components de la superfície (Consola i universal) que cap full de src no
   declara. Un node amb només una classe sense regla és un candidat a
   embolcall superflu, o un ganxo de proves: ho decidix qui llig. Informació. */
const SUPERFICIE_JSX = ['src/sections/consola', 'src/components/universal'];
const FULLS_DE_SRC = RECORREGUT.filter((rel) => rel.startsWith('src/') && rel.endsWith('.css'));
const CLASSES_DE_SRC = new Set(FULLS_DE_SRC.flatMap((rel) => blocs(readFileSync(path.join(ARREL, rel), 'utf8')).filter(esSelector).flatMap((b) => classesDe(b.prelud))));
const CLASSE_LITERAL = /className=(?:"([^"]*)"|'([^']*)'|\{"([^"]*)"\}|\{'([^']*)'\}|\{`([^`]*)`\})/g;
const SENSE_REGLA = new Map(); // classe → [fitxer:línia]
for (const rel of FITXERS.filter((f) => SUPERFICIE_JSX.some((d) => f.startsWith(`${d}/`)) && f.endsWith('.jsx') && !esProva(f))) {
  const text = readFileSync(path.join(ARREL, rel), 'utf8');
  for (const m of text.matchAll(CLASSE_LITERAL)) {
    const literal = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '').replace(/\$\{[^}]*\}/g, ' ');
    const linia = text.slice(0, m.index).split('\n').length;
    for (const classe of literal.split(/\s+/).filter(Boolean)) {
      /* Fora: les declarades, les constants (MAJÚSCULES) i els prefixos d'una
         plantilla (`toc-level-${n}` deixa «toc-level-»). */
      if (CLASSES_DE_SRC.has(classe) || /^[A-Z_]/.test(classe) || /[-_]$/.test(classe)) continue;
      if (!SENSE_REGLA.has(classe)) SENSE_REGLA.set(classe, []);
      SENSE_REGLA.get(classe).push(`${rel}:${linia}`);
    }
  }
}

/* ═══ INSTANTÀNIA · òrfenes que es conserven a propòsit després de la neteja
   del 261010 (Front F: 51 classes i 8,3 KB fora). Cada grup porta el motiu.
   La llista només pot baixar: traure'n una classe és llevar-la del CSS o
   tornar-la a usar. Onada 12 (261011): de 18 a 4. ═══ */
const INSTANTANIA = new Set([
  /* Classe del runtime de ProseMirror (node_modules, fora del recorregut):
     la posa el propi editor al node seleccionat. Viva de veres. */
  'ProseMirror-selectednode',
  /* Onada 12 (261011; ordres 261011_0130, D-03: «Esborra totes eixes regles
     orfes d'immediat») · Fora del CSS i de la instantània, amb la cerca
     repetida a tot el repositori abans de llevar-les:
      · el vocabulari Pedra Seca sense consumidor (sdp-accions,
        sdp-accions--final, sdp-cataleg-nav, sdp-cataleg-nav__llista,
        sdp-cataleg-nav__enllac, sdp-taula--ampla i sdp-taula--interactiva);
      · les .search-result* legacy (quatre regles i el fragment de la llista
        del Bancal);
      · els fragments morts de la llista de D-03 (`.nav-bar a.active`,
        `.editor-toolbar .toolbar-actions*`, `.editor-toolbar .btn-icon`,
        `.onboarding-card__heading h2`, `nav.app-sidebar.sidebar-open` i el
        `.nav-bar` de `.tabs, .nav-bar`), amb el fragment viu intacte;
      · btn-base, btn-outline-dark, btn-group i univ-manager-toolbar--list:
        el prefix `btn-` només el construïx l'UniversalButton de
        atoms/controls.jsx, que ningú importa (la façana exporta Boto amb
        eixe nom), i cap codi construïx `univ-manager-toolbar--`.
     Les dos de baix no són a la llista de D-03 (l'abast es definix per
     superfície, skill sdp-workflow, lliçó 260923): es queden, pendents
     d'ordre. Viuen dins de selectors amb una classe viva
     (`.app-sidebar-nav-footer .nav-item.nav-item--system` i la llista del
     Bancal). Gauntlet 261017 (Bloc 0.1) · `.sdp-editor-tools__actions` ja
     és fora: les seues quatre regles, amb els selectors vius que les
     compartien intactes. */
  'app-sidebar-nav-footer', 'sdp-chat-bubble-meta'
]);

describe('classes òrfenes dels fulls modules, components i layout', () => {
  test('les sondes veuen el que han de vore', () => {
    const b = blocs('/* .fals */\n.a,\n.b > .c:not(.d)::before { x: 1 }\n@media (x) {\n  .e[href$=".pdf"] { y: 2 }\n}\n@keyframes gir { from { z: 0 } to { z: 1 } }\n');
    expect(b.filter(esSelector).map((r) => [r.prelud, r.classes ?? classesDe(r.prelud), r.liniaInici, r.liniaFi])).toEqual([
      ['.a, .b > .c:not(.d)::before', ['a', 'b', 'c', 'd'], 2, 3],
      ['.e[href$=".pdf"]', ['e'], 5, 5]
    ]);
    const index = nouIndex();
    indexa('className={`sdp-insignia--${to} sdp-x__${nom} sdp-align-${a} ${CLASSE}__opcio--activa`} c = "sdp-y__" + nom; v = `--sdp-${tok}`; <div class="viva altra-viva">', true, index);
    indexa('const CLASSE = "sdp-slash-menu"; if (x) s = "--obert"; <p className="sdp-boto">', true, index);
    indexa('const variantClass = variant ? `btn-${variant}` : "";', true, index);
    indexa('export const idAplicacio = (id) => `app-${id}`;', true, index);
    indexa('const camp = (nom) => document.querySelector(`.editor-${nom}-input`);', true, index);
    expect(usada('viva', index)).toBe(true);
    expect(usada('sdp-insignia--avis', index)).toBe(true);
    expect(usada('sdp-x__cap', index)).toBe(true);
    expect(usada('sdp-align-center', index)).toBe(true);
    expect(usada('sdp-y__peu', index)).toBe(true);
    expect(usada('sdp-slash-menu__opcio--activa', index)).toBe(true);
    expect(usada('sdp-boto--obert', index)).toBe(true);
    expect(usada('btn-primary', index), 'prefix d’un segment amb context de classe (variantClass)').toBe(true);
    expect(usada('editor-nom-input', index), 'selector amb prefix i cua').toBe(true);
    expect(usada('app-sidebar', index), 'un id (`app-${id}`) no fa prefix de classe').toBe(false);
    expect(usada('editor-toolbar', index), 'la cua `-input` no casa').toBe(false);
    expect(usada('sdp-z__peu', index)).toBe(false);
    expect(usada('sdp-ocult', index), 'el `--sdp-${tok}` d’un token de CSS no fa prefix sdp-').toBe(false);
    expect(usada('orfena', index)).toBe(false);
    /* Un document no construïx classes: el mateix text, fora del codi, no deixa prefixos. */
    const document = nouIndex();
    indexa('`sdp-insignia--${to}` i "sdp-y__" + nom', false, document);
    expect(usada('sdp-insignia--avis', document)).toBe(false);
  });

  test('informe: la llista d’òrfenes no creix respecte de la instantània', () => {
    expect(FITXERS.length).toBeGreaterThan(1000);
    expect(DECLARADES.size).toBeGreaterThan(1000);
    const linies = [
      `CLASSES DECLARADES: ${DECLARADES.size} · FITXERS LLEGITS: ${FITXERS.length}`,
      `ÒRFENES (${ORFES.length}):`,
      ...ORFES.map((c) => `  .${c} · ${DECLARADES.get(c).map(on).join(', ')}`),
      `BLOCS SENCERS LLEVABLES (${BLOCS_ORFES.length}):`,
      ...BLOCS_ORFES.map((r) => `  ${on(r)} · ${r.prelud}`),
      `VIVES NOMÉS PER CONSTRUCCIÓ DINÀMICA (${DINAMIQUES.length}):`,
      ...DINAMIQUES.map(([c, m]) => `  .${c} · ${m} · ${DECLARADES.get(c).map(on).join(', ')}`),
      `VIVES NOMÉS A LES PROVES (${NOMES_A_PROVES.length}):`,
      ...NOMES_A_PROVES.map((c) => `  .${c} · ${DECLARADES.get(c).map(on).join(', ')}`),
      `CLASSES DE LA SUPERFÍCIE JSX (Consola i universal) SENSE REGLA A CAP FULL DE src (${SENSE_REGLA.size}):`,
      ...[...SENSE_REGLA.keys()].sort().map((c) => `  .${c} · ${SENSE_REGLA.get(c).join(', ')}`)
    ];
    const recuperades = [...INSTANTANIA].filter((c) => !ORFES_SET.has(c)).sort();
    if (recuperades.length) linies.push(`JA NO SÓN ÒRFENES (traieu-les de la instantània): ${recuperades.map((c) => `.${c}`).join(' ')}`);
    console.log(linies.join('\n'));
    const noves = ORFES.filter((c) => !INSTANTANIA.has(c));
    expect(noves, 'classes noves al CSS sense cap consumidor al repositori').toEqual([]);
  });
});
