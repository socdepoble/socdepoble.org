// @vitest-environment node
/** Sonda del front T6a (261006): quan va eixir Telefonades de la barra mòbil.
 *
 *  Evidència reproduïble per a la decisió del Mestre sobre les dues proves T3 roges
 *  d'App.test.jsx (:541 i :574). Només llig git (rev-parse, show, log i diff): no
 *  escriu res. La marca és la clau de l'avís de D17 (nav.telefonades.avis), que
 *  MobileNav només porta quan pinta el botó de Telefonades.
 *
 *  - Commits de la branca: Telefonades hi és des del tall congelat de la Marató
 *    (886f4272, 5-10 04:41) fins a 8f4ae700 (6-10 02:38). El primer commit sense
 *    el botó és 76947e5d (6-10 02:51), l'únic d'eixa sèrie que porta App.jsx.
 *  - Màquina del temps (refs/time-machine, local i podable): la instantània de les
 *    02:12 (hora local) encara el porta i la de les 02:42 ja no. Entre les dues,
 *    l'únic canvi d'App.jsx és llevar el botó, el seu estat, el Dialeg i la icona
 *    Phone: ni l'ordre Pobles/Mercat ni el comentari T3 (App.jsx:105-109).
 *
 *  - Reagrupament de la Wiki: el mateix 76947e5d porta WikiDePobleSection.jsx
 *    (maquinaria_cat) i PanellAgents.jsx, i abans la Consola tenia entrada pròpia
 *    amb FileText. Al final, l'ESLint dels sis fitxers del front T6a.
 *
 *  Cada bloc de git fa skip si no hi ha git o els objectes no hi són (clon superficial,
 *  CI sense refs/time-machine o instantànies podades). És una sonda d'un dia:
 *  quan el Mestre decidisca, s'ha de retirar.
 */
import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUTA = 'src/app/App.jsx';
const MARCA = 'nav.telefonades.avis';

const git = (...args) => execFileSync('git', args, {
  cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore']
});
const existix = (rev) => { try { git('rev-parse', '--verify', '--quiet', `${rev}^{commit}`); return true; } catch { return false; } };
const portaTelefonades = (rev) => git('show', `${rev}:${RUTA}`).includes(MARCA);
const toca = (rev) => git('show', '--format=', '--name-only', rev).split('\n').includes(RUTA);

/* Tall congelat de la Marató, la sessió d'Opus i la neteja de MarIA, en ordre. */
const AMB_TELEFONADES = ['886f4272', '44e2b8e2', '39a25fc5', 'c774c7da', 'e7bf16ef', '3ebc280f', '8f4ae700'];
const RETIRADA = '76947e5d';
const commitsDisponibles = [...AMB_TELEFONADES, RETIRADA].every(existix);

/* Instantànies de la màquina del temps a banda i banda de l'edició d'App.jsx (mtime 02:15). */
const ABANS = '49eeb200';
const DESPRES = '780c059b';
const instantaniesDisponibles = existix(ABANS) && existix(DESPRES);

describe.skipIf(!commitsDisponibles)('Telefonades als commits de la branca', () => {
  test('el porten tots fins a 8f4ae700 i el lleva 76947e5d, que és qui porta App.jsx', () => {
    for (const c of AMB_TELEFONADES) expect({ c, tel: portaTelefonades(c) }).toEqual({ c, tel: true });
    expect(portaTelefonades(RETIRADA)).toBe(false);
    /* Després del tall congelat, només 76947e5d toca App.jsx. */
    expect(AMB_TELEFONADES.slice(1).filter(toca)).toEqual([]);
    expect(toca(RETIRADA)).toBe(true);
    expect(git('show', '-s', '--format=%cI', RETIRADA).trim()).toBe('2026-10-06T02:51:54+02:00');
  });
});

describe.skipIf(!instantaniesDisponibles)('Telefonades a la màquina del temps', () => {
  test('l\'edició entre les 02:12 i les 02:42 del 6-10 només lleva Telefonades', () => {
    expect(git('show', '-s', '--format=%cI', ABANS).trim()).toBe('2026-10-06T00:12:19Z');
    expect(git('show', '-s', '--format=%cI', DESPRES).trim()).toBe('2026-10-06T00:42:19Z');
    expect(portaTelefonades(ABANS)).toBe(true);
    expect(portaTelefonades(DESPRES)).toBe(false);
    /* Cap instantània entre les dues canvia App.jsx: és una sola edició. */
    expect(git('log', '--format=%h', `${ABANS}..${DESPRES}`, '--', RUTA).trim().split('\n')).toHaveLength(1);

    const linies = git('diff', '--no-ext-diff', '--no-textconv', ABANS, DESPRES, '--', RUTA).split('\n');
    const afegides = linies.filter((l) => l.startsWith('+') && !l.startsWith('+++'));
    const llevades = linies.filter((l) => l.startsWith('-') && !l.startsWith('---'));
    expect(afegides).toEqual(["+import { PanelLeftClose } from 'lucide-react';"]);
    expect(llevades[0]).toBe("-import { PanelLeftClose, Phone } from 'lucide-react';");
    /* La resta de línies llevades són el botó, el seu estat i el Dialeg de D17. */
    expect(llevades.slice(1).every((l) => /telefonades|Telefonades|Phone|<\/?Dialeg|accions=|<\/button>|<span className="nav-item__text">/.test(l))).toBe(true);
    expect(llevades.join('\n')).toContain(MARCA);
    /* Ni l'ordre de la barra ni el comentari T3 no canvien. */
    expect(linies.some((l) => /^[+-].*MOBILE_NAV_/.test(l))).toBe(false);
    expect(linies.some((l) => /^[+-].*ordre del Mestre, 260930/.test(l))).toBe(false);
  });
});

/* El mateix commit porta el reagrupament de la Wiki (MarIA, 01:46) i PanellAgents.jsx
   (01:52): és la base de la recepta de reversió si el Mestre no el ratifica. */
const WIKI = 'src/sections/wiki-de-poble/WikiDePobleSection.jsx';
const AGENTS = 'src/sections/tractors/PanellAgents.jsx';

describe.skipIf(!commitsDisponibles)('El reagrupament de la Wiki als commits de la branca', () => {
  test('només 76947e5d porta WikiDePobleSection.jsx i PanellAgents.jsx des de 44e2b8e2', () => {
    /* Actualitzada a posta (261024, P1-10): %h s'allarga quan el repositori creix
       (ja ix «76947e5d7»); es compara el SHA sencer del mateix commit. */
    expect(git('log', '--format=%H', '44e2b8e2..76947e5d', '--', WIKI, AGENTS).trim().split('\n'))
      .toEqual([git('rev-parse', '76947e5d^{commit}').trim()]);
    const abans = git('show', `44e2b8e2:${WIKI}`);
    const despres = git('show', `76947e5d:${WIKI}`);
    /* Abans, la Consola tenia entrada pròpia amb FileText i la seua fitxa l'heretava. */
    expect(abans).toContain("{ id: 'consola_termodinamica_cat', label: 'Consola Termodinàmica', icon: FileText }");
    expect(abans).toContain("{ id: 'tractors_cat', label: 'Tractors', icon: Folder }");
    expect(abans).not.toContain('maquinaria_cat');
    /* Després, cap de les dues: tot penja de maquinaria_cat, i la Consola no declara glif. */
    expect(despres).toContain("{ id: 'maquinaria_cat', label: 'Maquinària de la IAIA', icon: Folder }");
    /* Els comentaris encara les nomenen: es miren només les declaracions. */
    expect(despres).not.toMatch(/id: '(?:consola_termodinamica|tractors)_cat'|categoryIds?: \[?'(?:consola_termodinamica|tractors)_cat'|, '(?:consola_termodinamica|tractors)_cat', \[/);
    const inici = despres.indexOf("id: 'consola_termodinamica',");
    const itemConsola = despres.slice(inici, despres.indexOf("content: ''", inici));
    expect(inici).toBeGreaterThan(0);
    expect(itemConsola).toContain("categoryIds: ['maquinaria_cat']");
    expect(itemConsola).not.toContain('icon:');
    expect(despres).toContain("agents_panell: lazyRoute(() => import('../tractors/PanellAgents.jsx'))");
    expect(() => git('show', `44e2b8e2:${AGENTS}`)).toThrow();
  });
});

/* Els fitxers del front T6a passen l'ESLint del repositori sense cap missatge. */
const FRONT_T6A = [
  'tests/laboratori-telefonades-261006.test.js',
  WIKI,
  'src/sections/wiki-de-poble/WikiDePobleSection.einesLocals.test.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.icones.test.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.produccio.test.jsx',
  'src/sections/gestoria/privacitat.test.js'
];

test('el front T6a passa l’ESLint del repositori sense cap missatge', async () => {
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: REPO });
  const resultats = await eslint.lintFiles(FRONT_T6A.map((rel) => path.join(REPO, rel)));
  expect(resultats).toHaveLength(FRONT_T6A.length);
  expect(resultats.flatMap((r) => r.messages.map((m) => `${path.relative(REPO, r.filePath)}:${m.line} ${m.ruleId} ${m.message}`))).toEqual([]);
}, 60000);
