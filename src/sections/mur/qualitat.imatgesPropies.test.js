// @vitest-environment node
/* Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT)») · qualitat de la peça «imatges pròpies» del
   relleu 261007: ESLint amb la configuració del projecte i zero missatges
   (avisos inclosos) sobre cada fitxer que crea o toca, les comprovacions de
   Pedra Seca i del Model B per text, i que el mode estricte és el de
   utils/sanitize.js (cap filtre a mida). Patró de qualitat.publicacionsActor.test.js.
   La migració (supabase/migrations/2610072230_mur_imatges_propies.sql) no
   l'executa cap prova: la llança el Mestre. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  'src/utils/sanitize.js',
  'src/utils/sanitize.test.js',
  'src/sections/mur/TargetaDelMur.jsx',
  'src/sections/mur/TargetaDelMur.imatgesPropies.test.jsx',
  'src/sections/mur/qualitat.imatgesPropies.test.js',
  'src/components/universal/EventCard.jsx',
  'src/components/universal/EventCard.test.jsx',
  'src/sections/detail/elementDeSeccio.js',
  'src/sections/detail/elementDeSeccio.test.js',
  'src/sections/detail/elementDeSeccio.logo.test.jsx',
  /* Relleu 261007 (peça «imatges-detall») · el detall, el lector del MAS, la
     targeta del Mercat, l'origen del paquet i les guardes compartides. */
  'src/sections/detail/detailSectionMeta.jsx',
  'src/sections/detail/detailSectionMeta.recursos.test.jsx',
  'src/sections/detail/ItemDetailSection.jsx',
  'src/sections/detail/ItemDetailSection.imatgesPropies.test.jsx',
  'src/sections/notes/PublicacioDetall.jsx',
  'src/sections/notes/PublicacioDetall.imatgesPropies.test.jsx',
  'src/sections/mercat/TargetaDelMercat.jsx',
  'src/sections/mercat/TargetaDelMercat.test.jsx',
  'src/sections/mercat/imatgesDeProducte.js',
  'src/components/universal/UniversalUtils.js',
  'src/components/universal/UniversalUtils.guardes.test.js',
  'src/components/universal/targetaDeLaPagina.js',
  'src/PedraSecaEmbed.origenDelPaquet.test.jsx'
]);

const MIGRACIO = 'supabase/migrations/2610072230_mur_imatges_propies.sql';

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);
/* El codi sense els comentaris de bloc: els comentaris nomenen formes vetades
   per a explicar per què no hi són. */
const codiDe = (ruta) => llig(ruta).replace(/\/\*[\s\S]*?\*\//g, '');

test('tots els fitxers del lot existixen', () => {
  expect([...FITXERS, MIGRACIO].filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/mur/sonda.js') });
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
      const codi = codiDe(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });
});

describe('Model B i maquinària existent', () => {
  test('cap import d’un adaptador del proveïdor', () => {
    const trobats = FITXERS.filter((f) => !esProva(f)).filter((f) => /from '[^']*data\/(?:supabase|adaptadors)\//.test(llig(f)));
    expect(trobats).toEqual([]);
  });

  test('les targetes i el detall usen el mode estricte de sanitize.js i imatgePrivada d’UniversalCard; cap filtre a mida', () => {
    const mur = codiDe('src/sections/mur/TargetaDelMur.jsx');
    const acte = codiDe('src/components/universal/EventCard.jsx');
    for (const codi of [mur, acte]) {
      expect(codi).toContain("import { fontImatgePropia } from '");
      expect(codi.match(/fontImatgePropia\(resolveAsset\(/g)).toHaveLength(2);
      expect(codi).toMatch(/^\s*imatgePrivada$/m);
      expect(codi).not.toMatch(/new URL\(/);
    }
    const detall = codiDe('src/sections/detail/elementDeSeccio.js');
    expect(detall).toContain("import { esFontImatgePropia } from '../../utils/sanitize.js';");
    expect(detall).toContain('heroImage: imatgePropiaDelDetall(section, section.getImage(item))');
    expect(detall).toContain('authorAvatar: imatgePropiaDelDetall(section, authorAvatar)');
    /* Revisió adversarial del 261007 · El logotip (logo_image) també: el mode
       estricte abans i després de resoldre'l, a més del filtre de sempre. */
    expect(detall).toContain('!esFontImatgePropia(src) || !esFontImatgePropia(resolt)');
  });

  /* Relleu 261007 (peça «imatges-detall») · Una sola regla del detall
     (imatgePropiaDelDetall, a detailSectionMeta.jsx) i tots els camins del
     detall hi passen: l'avatar redó, el carrusel, les variacions, og:image,
     el lector del MAS i la seua fitxa. La targeta del Mercat, com la del Mur. */
  test('el detall i el lector del MAS usen la regla única del mode estricte; la targeta del Mercat, el de sanitize.js', () => {
    const meta = codiDe('src/sections/detail/detailSectionMeta.jsx');
    expect(meta).toContain("import { esFontImatgePropia, sanitizeHtml } from '../../utils/sanitize.js';");
    expect(meta).toContain('export function imatgePropiaDelDetall(seccio, valor)');
    expect(meta).toContain('const src = imatgePropiaDelDetall(seccio, avatarDeLaIdentitat);');
    expect(meta).toContain('totes.filter(esImatgePropiaDelDetall)');
    /* Revisió adversarial del 261008 · A les variacions, cap sdp-media:// cru
       trencat. Relleu 261007 · Verificació final · Exclòs per la forma, no
       amb isSafeAsset, que a l'app nativa (capacitor://localhost) rebutjava
       també la foto pròpia '/…'. */
    expect(meta).toContain("typeof variation.image === 'string' && !REFERENCIA_OPACA.test(variation.image.trim()) && esImatgePropiaDelDetall(variation.image)");
    expect(meta).toContain('const REFERENCIA_OPACA = /^sdp-media:/i;');
    expect(meta).not.toContain('isSafeAsset(variation.image)');
    expect(meta).not.toMatch(/new URL\(/);
    /* Punt g · El cos HTML del Mur, el Mercat i l'agenda, pel mode estricte
       del sanejador (una sola opció, cap filtre d'<img> a mida); Pobles,
       Multimèdia i Notes, pel camí de sempre. */
    expect(meta).toContain('sanitizeHtml(resolRecursosDeHtml(raw), { imatgesPropies: true })');
    /* Revisió adversarial del 261008 · També un cos amb targetes incrustades,
       encara que no porte cap <img>: la seua instantània (data-imatge). */
    expect(meta).toContain('(PORTA_IMATGE.test(raw) || raw.includes(MARCA_GRUP))');
    expect(meta.match(/cosAmbImatgesPropies\(item\./g)).toHaveLength(3);
    expect(meta).toContain('renderPostContent(cosAmbImatgesPropies(item.content || item.summary))');
    expect(meta).toContain('renderRichText(cosAmbImatgesPropies(item.description))');
    expect(meta).toContain('renderRichText(cosAmbImatgesPropies(item.description || item.content))');
    expect(meta).not.toMatch(/getAttribute\(|querySelectorAll\(|DOMParser/);
    const element = codiDe('src/sections/detail/elementDeSeccio.js');
    expect(element).toContain("import { buildDetailSectionMeta, imatgePropiaDelDetall } from './detailSectionMeta.jsx';");
    expect(element).not.toMatch(/LLISTES_DEL_MUR|function imatgePropiaDelDetall/);
    const detall = codiDe('src/sections/detail/ItemDetailSection.jsx');
    expect(detall).toContain('image: pagina ? pagina.heroImage : null');
    expect(detall).not.toContain('section?.getImage?.(item)');
    expect(detall).toContain('avatarAutorDElement(item, pagina.authorName, section)');
    const lector = codiDe('src/sections/notes/PublicacioDetall.jsx');
    expect(lector).toContain('avatarAutorDElement(publicacio, nomAutor, seccio)');
    expect(lector.match(/imatgePropiaDelDetall\(/g)).toHaveLength(3);
    expect(lector).toContain('const cosDelLector = !esProducte && esSeccioDelMur(seccio) ? cosAmbImatgesPropies(cos) : cos;');
    const mercat = codiDe('src/sections/mercat/TargetaDelMercat.jsx');
    expect(mercat).toContain("import { fontImatgePropia } from '../../utils/sanitize.js';");
    expect(mercat).toMatch(/^\s*imatgePrivada$/m);
    expect(mercat).toContain('imageUrl={imatgePropia(props.imageUrl)}');
    expect(mercat).toContain('avatarUrl={imatgePropia(props.avatarUrl)}');
  });

  test('l’element <soc-de-poble> registra també l’origen del paquet', () => {
    const embed = codiDe('src/PedraSecaEmbed.jsx');
    expect(embed).toContain('permetOrigenMitjans(ORIGEN_DEL_PAQUET);');
  });

  /* Relleu 261007 («Límits» §5) · Les guardes de la capçalera, una sola
     còpia a UniversalUtils.js. */
  test('esAvatarSegur, camiDe i esMarcaDeLEntitat viuen només a UniversalUtils.js', () => {
    const utils = codiDe('src/components/universal/UniversalUtils.js');
    expect(utils).toContain('export const esAvatarSegur = ');
    expect(utils).toContain('export const camiDe = ');
    expect(utils).toContain('export function esMarcaDeLEntitat(url)');
    for (const fitxer of ['src/components/universal/PageFrame.jsx', 'src/sections/detail/elementDeSeccio.js', 'src/sections/mercat/imatgesDeProducte.js']) {
      const codi = codiDe(fitxer);
      expect(codi, fitxer).not.toMatch(/const (?:esAvatarSegur|camiDe) = |function (?:esMarcaDeLEntitat|esMarcaDeSocDePoble)\(/);
      expect(codi, fitxer).not.toContain("new URL(url, 'http://sdp.invalid')");
      expect(codi, fitxer).toMatch(/from '\.\.?\/(?:\.\.\/components\/universal\/)?UniversalUtils(?:\.js)?';/);
    }
  });

  test('esFontImatgeSegura conserva els orígens OAuth; el mode estricte no els mira', () => {
    const codi = codiDe('src/utils/sanitize.js');
    expect(codi).toContain('origensPropis.includes(origen) || ORIGENS_OAUTH.includes(origen)');
    const estricte = codi.slice(codi.indexOf('export function esFontImatgePropia'), codi.indexOf('export function fontImatgePropia'));
    expect(estricte).not.toContain('ORIGENS_OAUTH');
    /* Punt g · L'opció del sanejador només dura la crida, i sense ella el
       ganxo fa el filtre de sempre. */
    expect(codi).toContain('const esLocal = imatgesNomesPropies ? esFontImatgePropia(src) : esFontImatgeSegura(src);');
    expect(codi).toContain('imatgesNomesPropies = opcions?.imatgesPropies === true;');
    expect(codi).toMatch(/finally \{\s*imatgesNomesPropies = false;\s*\}/);
    /* Revisió adversarial del 261008 · La instantània d'una targeta
       incrustada, només amb l'opció i amb el mateix mode estricte. */
    expect(codi).toContain("if (instantania && !esFontImatgePropia(instantania)) node.removeAttribute('data-imatge');");
    expect(codi).toContain('if (imatgesNomesPropies && node.nodeType === 1) {');
  });
});

describe('La migració (no s’aplica: la llança el Mestre)', () => {
  test('trigger nou, idempotent, search_path fix i sense tocar trg_force_submission_author', () => {
    const sql = llig(MIGRACIO).replace(/--[^\n]*/g, '');
    expect(sql).toMatch(/drop trigger if exists sdp_mur_imatges_propies on public\.section_submissions;/);
    expect(sql).toMatch(/create trigger sdp_mur_imatges_propies\s+before insert or update on public\.section_submissions/);
    /* Revisió adversarial del 261007 · Només les files que llig el Mur. */
    expect(sql).toMatch(/for each row\s+when \(new\.section_id in \('mur', 'mercat', 'events'\)\)\s+execute function private\.trg_mur_imatges_propies\(\);/);
    expect(sql.match(/create or replace function/g)).toHaveLength(4);
    expect(sql.match(/set search_path = ''/g)).toHaveLength(4);
    expect(sql.match(/security definer/g)).toHaveLength(1);
    expect(sql).not.toMatch(/trg_force_submission_author/);
    expect(sql).not.toMatch(/\bupdate public\.section_submissions\b/);
    expect(sql).toMatch(/^begin;/m);
    expect(sql).toMatch(/^commit;/m);
  });
});
