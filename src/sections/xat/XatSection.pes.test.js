// @vitest-environment node
/* Fase D (261020, L4) · El pes de /xat en mòbil. XatSection ja no porta el
   document destacat de la columna dreta (TextSection i PAGE_COPY): el demana
   en diferit i només en ample o mitjà. Esta prova recorre el tancament
   ESTÀTIC dels imports des de XatSection.jsx (els import() no hi compten) i
   comprova que cap camí no hi torna a portar els mòduls del document.
   Rollup encara sacseja alguns camins que el tancament de la font sí que veu
   (el barril de PedraSeca), així que els bytes es mesuren al build; ací només
   es vigilen els quatre mòduls de text.
   Gauntlet Loop 261029 (cicle 1) · Este tancament és el del tros de /xat, no
   el de l'arrencada: PAGE_COPY ja hi arriba abans, amb l'adaptador. El bloc
   «Graf real», al final, recorre el que baixa qualsevol ruta en arrencar. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SRC = path.join(ARREL, 'src');
const ENTRADA = path.join(SRC, 'sections', 'xat', 'XatSection.jsx');
const IMPORT_ESTATIC = /\b(?:import|export)\s+(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"\n]+)['"]/g;
const EXTENSIONS = ['', '.js', '.jsx', '/index.js', '/index.jsx'];

const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** El fitxer real d'un especificador relatiu o amb @/, o null (un paquet, un ?raw…). */
function resol(des, especificador) {
  const base = especificador.startsWith('@/') ? path.join(SRC, especificador.slice(2))
    : especificador.startsWith('.') ? path.resolve(path.dirname(des), especificador) : null;
  if (!base || especificador.includes('?')) return null;
  for (const ext of EXTENSIONS) {
    const cami = base + ext;
    try { if (fs.statSync(cami).isFile()) return cami; } catch { /* el següent */ }
  }
  return null;
}

/** Tots els fitxers de src/ que arriben des d'`entrada` per imports estàtics. */
function tancamentEstatic(entrada) {
  const vistos = new Set([entrada]);
  const pendents = [entrada];
  while (pendents.length) {
    const fitxer = pendents.pop();
    for (const [, especificador] of senseComentaris(fs.readFileSync(fitxer, 'utf8')).matchAll(IMPORT_ESTATIC)) {
      const fill = resol(fitxer, especificador);
      if (fill && !vistos.has(fill)) { vistos.add(fill); pendents.push(fill); }
    }
  }
  return new Set([...vistos].map((f) => path.relative(ARREL, f).split(path.sep).join('/')));
}

describe('L4 · /xat no porta el document destacat al seu tros', () => {
  const tancament = tancamentEstatic(ENTRADA);

  test('el tancament estàtic de XatSection.jsx no arriba als mòduls del document de text', () => {
    const document = ['src/sections/text/TextSection.jsx', 'src/sections/text/pageContent.js',
      'src/sections/text/legalContent.js', 'src/sections/text/paginaDeText.js'];
    expect(document.filter((rel) => tancament.has(rel)),
      'un import estàtic hi torna a portar el document al tros de /xat (TextSection: bytes de més en mòbil; PAGE_COPY: un lligam estàtic que impediria traure-la de l’arrencada)').toEqual([]);
  });

  test('sanitat: el recorregut veu els mòduls que XatSection sí importa', () => {
    expect(tancament.has('src/sections/xat/paginaDestacada.js')).toBe(true);
    expect(tancament.has('src/components/layout/AppGridShell.jsx')).toBe(true);
    expect(tancament.size).toBeGreaterThan(20);
  });
});

/* Pla 261027_0845 (Guarda Nocturna), P1-55 · La pàgina viva d'una comunitat
   (la fitxa pública d'una entitat, la pàgina d'un poble) també va en
   diferit i només en ample o mitjà: cap dels seus quatre mòduls no pot
   entrar al tros de /xat per un import estàtic. */
const PAGINA_VIVA = ['src/sections/xat/components/FitxaVivaDeComunitat.jsx', 'src/sections/profile/PerfilPublicSection.jsx',
  'src/sections/detail/ItemDetailSection.jsx', 'src/sections/detail/detailSectionMeta.jsx'];

describe('P1-55 · /xat no porta la pàgina viva de la comunitat al seu tros', () => {
  const tancament = tancamentEstatic(ENTRADA);

  test('el tancament estàtic de XatSection.jsx no arriba a la fitxa viva, al perfil públic ni al detall del poble', () => {
    expect(PAGINA_VIVA.filter((rel) => tancament.has(rel)),
      'un import estàtic hi porta la pàgina viva: /xat en mòbil baixaria la fitxa pública i el detall del poble').toEqual([]);
  });

  test('sanitat: XatSection la demana en diferit i la fitxa viva sí que arriba als quatre mòduls', () => {
    const font = senseComentaris(fs.readFileSync(ENTRADA, 'utf8'));
    expect(font).toMatch(/import\(\s*['"]\.\/components\/FitxaVivaDeComunitat\.jsx['"]\s*\)/);
    const delaFitxa = tancamentEstatic(path.join(SRC, 'sections', 'xat', 'components', 'FitxaVivaDeComunitat.jsx'));
    expect(PAGINA_VIVA.filter((rel) => !delaFitxa.has(rel))).toEqual([]);
  });
});

/* Gauntlet Loop 261029 (cicle 1, page-copy-carrega-a-xat-mobil) · El graf
   REAL de l'arrencada. Les proves d'amunt només recorren el tros de /xat i,
   en verd, deixaven creure que /xat en mòbil s'estalviava PAGE_COPY. host.js
   (arrenca) baixa l'adaptador amb import('./data/supabase/index.js') en cada
   arrencada sense backend injectat, i l'adaptador porta la llavor (notes.js i
   runtime.js → appSeed.js → sectionContent.js → pageContent.js), perquè
   loadCoreContent servix les pàgines de sistema en tots els modes, també en
   remot. Ací es recorre el tancament de main.jsx més el de l'adaptador: el que
   baixa qualsevol ruta abans de pintar-se. Traure PAGE_COPY de l'arrencada
   toca el contracte del nucli i els seus consumidors (decisió del Mestre);
   mentrestant, cap comentari de src/ no pot tornar a afirmar el contrari.
   Si un dia ix de l'arrencada, la darrera prova ho permet sense tocar-la. */
const ADAPTADOR = path.join(SRC, 'data', 'supabase', 'index.js');
const PAGE_COPY_FONT = 'src/sections/text/pageContent.js';
const AQUESTA_PROVA = fileURLToPath(import.meta.url);
/* L'afirmació de l'estalvi i les seues variants (baixa, carrega, porta). */
const AFIRMACIO_D_ESTALVI = /(?:\/xat|m[òo]bil)[^.;]{0,60}?\bno\s+(?:baixa|carrega|porta)\b[^.;]{0,60}?\bPAGE_COPY\b/g;

/** Tots els .js, .jsx i .mjs de `carpeta`, recursivament. */
function fontsDe(carpeta) {
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    const cami = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) return fontsDe(cami);
    return /\.(?:m?js|jsx)$/.test(entrada.name) ? [cami] : [];
  });
}

describe('Graf real · el que baixa /xat en mòbil en arrencar', () => {
  const arrencada = new Set([...tancamentEstatic(path.join(SRC, 'main.jsx')), ...tancamentEstatic(ADAPTADOR)]);

  test('sanitat: host.js baixa l’adaptador en arrencar i el recorregut arriba a loadCoreContent', () => {
    const host = senseComentaris(fs.readFileSync(path.join(SRC, 'host.js'), 'utf8'));
    expect(host).toMatch(/import\(\s*['"]\.\/data\/supabase\/index\.js['"]\s*\)/);
    expect(arrencada.has('src/host.js')).toBe(true);
    expect(arrencada.has('src/data/supabase/content.js')).toBe(true);
  });

  test('el document destacat sí que estalvia: TextSection i paginaDeText no entren en arrencar', () => {
    expect(['src/sections/text/TextSection.jsx', 'src/sections/text/paginaDeText.js'].filter((rel) => arrencada.has(rel)),
      'un import estàtic de l’arrencada porta el document de text a totes les rutes').toEqual([]);
  });

  test('la segona capa de la IAIA sí que estalvia: la Wiki del paquet no entra ni en arrencar ni al tros de /xat', () => {
    const xat = tancamentEstatic(ENTRADA);
    expect(['src/data/wikiManifest.js'].filter((rel) => arrencada.has(rel) || xat.has(rel)),
      'un import estàtic porta la Wiki del paquet (uns 187 KB gzip) abans de la primera pregunta').toEqual([]);
  });

  test('cap comentari de src/ no afirma que /xat en mòbil s’estalvia PAGE_COPY mentre l’arrencada la porte', () => {
    const afirmacions = !arrencada.has(PAGE_COPY_FONT) ? [] : fontsDe(SRC)
      .filter((fitxer) => fitxer !== AQUESTA_PROVA)
      .flatMap((fitxer) => {
        const codi = fs.readFileSync(fitxer, 'utf8');
        return [...codi.matchAll(AFIRMACIO_D_ESTALVI)].map((coincidencia) =>
          `${path.relative(ARREL, fitxer).split(path.sep).join('/')}:${codi.slice(0, coincidencia.index).split('\n').length}`);
      });
    expect(afirmacions,
      'PAGE_COPY ja arriba en arrencar (adaptador → appSeed.js → sectionContent.js → pageContent.js): el comentari no és cert').toEqual([]);
  });
});
