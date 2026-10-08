// @vitest-environment node
/* Esmena 3 del pla 261007_1645 i ordre E del Mestre (261007) · qualitat de la
   peça «lector del MAS»: ESLint amb la configuració del projecte i zero
   missatges (avisos inclosos) sobre cada fitxer que toca o crea, i les
   comprovacions de Pedra Seca per text. Patró de notes/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  'src/sections/detail/detailSectionMeta.jsx',
  'src/sections/detail/ItemDetailSection.jsx',
  'src/sections/detail/elementDeSeccio.js',
  'src/sections/detail/elementDeSeccio.logo.test.jsx',
  'src/sections/notes/PublicacioDetall.jsx',
  'src/sections/notes/PublicacioDetall.mercat.test.jsx',
  'src/sections/notes/masDeLUsuari.js',
  'src/sections/notes/masDeLUsuari.mercat.test.js',
  'src/sections/notes/NotesContext.jsx',
  'src/sections/notes/NotesContext.logo.test.jsx',
  'src/sections/mercat/imatgesDeProducte.js',
  'src/sections/notes/qualitat.masLector.test.js',
  /* Grup E de l'Onada 4 (261008) · Les pàgines del sistema al MAS de
     l'entitat pilot i la guarda de re-signatura. */
  'src/sections/notes/masDeLUsuari.test.js',
  'src/sections/notes/NotesSection.mas.test.jsx',
  'src/sections/notes/NotesSection.fontPublicacio.sistema.test.jsx',
  'src/sections/notes/PublicacioDetall.sistema.test.jsx',
  'src/sections/notes/NotesContext.test.jsx',
  'src/sections/notes/visibilitatNota.js',
  'src/sections/notes/visibilitatNota.test.js',
  'src/sections/text/TextSection.jsx'
]);

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);

test('tots els fitxers del lot existixen', () => {
  expect(FITXERS.filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/notes/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('fora de proves: cap style=, cap hex, cap :has(), res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/:has\(/, ':has()'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = FITXERS.filter((f) => !esProva(f)).flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  /* Model B · la UI parla amb el backend només pel port: cap adaptador. */
  test('cap import d’un adaptador del proveïdor', () => {
    const trobats = FITXERS.filter((f) => !esProva(f)).filter((f) => /from '[^']*data\/(?:supabase|adaptadors)\//.test(llig(f)));
    expect(trobats).toEqual([]);
  });

  /* Lliçó 261007 · una sola peça per al carrusel i l'avatar de capçalera:
     el detall i el lector la criden, cap no en porta còpia. */
  test('el carrusel i l’avatar de capçalera, una sola vegada (detailSectionMeta)', () => {
    for (const lector of ['src/sections/detail/ItemDetailSection.jsx', 'src/sections/notes/PublicacioDetall.jsx']) {
      const codi = llig(lector);
      expect(codi, lector).toMatch(/portadaDElement\(/);
      expect(codi, lector).toMatch(/avatarAutorDElement\(/);
      expect(codi, lector).not.toMatch(/<CarruselImatges\b/);
      expect(codi, lector).not.toMatch(/autorDe\(/);
    }
    expect(llig('src/sections/detail/detailSectionMeta.jsx'))
      .toContain("import { CarruselImatges } from '../../components/PedraSeca/organismes/CarruselImatges.jsx';");
  });

  /* Grup E (261008) · Lliçó 261007: es reutilitza la maquinària que ja
     existix. Una pàgina del sistema es llig amb les props i el cos de
     TextSection i amb la porta de la seua targeta; les targetes, les de
     MurSection (targetesDeSistema), una sola vegada (usePaginesDelSistema). */
  test('el lector d’una pàgina del sistema i les targetes reutilitzen la maquinària de TextSection i del Mur', () => {
    const lector = llig('src/sections/notes/PublicacioDetall.jsx');
    for (const peca of ['propsDePaginaDeText(', '<CosDeLaPagina', '<PortaDePagina', 'accioDeLaPagina(', 'objecteDePagina(']) {
      expect(lector, peca).toContain(peca);
    }
    expect(lector).not.toMatch(/dangerouslySetInnerHTML/);
    expect(llig('src/sections/text/TextSection.jsx')).toContain('export function CosDeLaPagina({ html })');
    expect(llig('src/sections/mur/usePublicacionsDeLActor.js')).toContain('targetesDeSistema(pageCopy)');
    expect(llig('src/sections/notes/NotesSection.jsx')).toContain('usePaginesDelSistema()');
  });
});
