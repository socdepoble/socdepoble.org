/**
 * termodinamic.mjs
 * FONT ÚNICA DE VERITAT de la nomenclatura termodinàmica.
 *
 * REGLA D'OR (Veritat en Dos Miralls, arquitectura_cognitiva.md §3):
 * Aquest és l'ÚNIC lloc on es defineix el regex de nom vàlid.
 * Cap altre script (audit_estructura, wiki_integritat, etc.) pot declarar
 * el seu propi regex de nomenclatura. Tots importen d'ací.
 * L'auditoria de 260705 va detectar dos regex divergents (termodinamic.cjs
 * vs checkThermoFilenames() dins audit_estructura.js) que es contradeien:
 * els únics fitxers ben nomenats del bundle fallaven l'auditoria estructural.
 * Este fitxer existeix per fer estructuralment impossible que això torne a passar.
 *
 * ABAST: esta llei de nomenclatura s'aplica NOMÉS al contingut de la Wiki
 * (fitxers .md d'esdeveniment dins dels 4 pilars o les 2 zones). NO s'aplica al codi font
 * (02_ACTUAR_Maquina_Tecnica/scripts/**), que segueix convencions pròpies
 * de l'ecosistema Node (camelCase / snake_case en fitxers .mjs/.cjs/.json).
 * Aplicar la llei del contingut al codi és el que va fer que
 * wiki-integrity.cjs (amb guió) es mossegara la pota ell mateix.
 */

/**
 * AUDITORIA 260829 — CATEGORIES QUE FALTAVEN.
 *
 * `BUNDLE` i `PETORRETA` son les dues categories que mes useu cada dia i
 * no estaven al vocabulari. Consequencia mesurada: TOTS els bundles que
 * heu generat mai eren il·legals segons esta mateixa SSOT. Es va comprovar
 * amb el fitxer 260828_2356_BUNDLE_Sistema_Disseny_OAuth.md, que falla
 * `isValidContentFile()`.
 *
 * La llei no fallava perque `termodinamic.mjs` l'importen 8 scripts i cap
 * dels 8 esta a `npm run porta`. Vocabulari tancat sense porta = preferencia.
 */
export const CATEGORIES = [
  'ACTA', 'REPORT', 'SKILL', 'DOC', 'CORE',
  'PROMPT', 'WORKFLOW', 'ASSET', 'PLANTILLA', 'AUDITORIA',
  'BUNDLE', 'PETORRETA'
];

/**
 * LONGITUD DEL TITOL — resolucio de la contradiccio activa.
 *
 * socdepoble-workflow/SKILL.md deia «entre 1 i 6 paraules, mai mes de 6».
 * PROTOCOL_PETORRETA.md deia «8-12 paraules descriptives».
 * Cap gate resolia el conflicte, aixi que l'agent triava la que recordava.
 *
 * Es fixa ACI, en codi, i els dos documents han de citar aquest fitxer.
 * Les paraules del titol es conten pels trossos separats per guio baix.
 */
export const TITOL_MIN_PARAULES = 1;
export const TITOL_MAX_PARAULES = 6;

export function comptaParaulesTitol(filename) {
  const m = filename.match(TERMODINAMIC_REGEX);
  if (!m) return null;
  const titol = filename.slice(`${'0'.repeat(6)}_${'0'.repeat(4)}_${m[1]}_`.length, -3);
  return titol.split('_').filter(Boolean).length;
}

export function titolDinsDeLimits(filename) {
  const n = comptaParaulesTitol(filename);
  return n !== null && n >= TITOL_MIN_PARAULES && n <= TITOL_MAX_PARAULES;
}

// Caràcters permesos, LITERALMENT segons especificació del Mestre (260705):
// majúscules, minúscules, guions BAIXOS, punts, números. Sense guions normals.
export const CHAR_WHITELIST_REGEX = /^[A-Za-z0-9_.]+$/;

// Forma completa: YYMMDD_HHMM_CATEGORIA_Titol.md
// Un sol regex — la "forma" i el "joc de caràcters" ja no poden divergir
// perquè la forma és un subconjunt estricte del whitelist de caràcters.
export const TERMODINAMIC_REGEX = new RegExp(
  `^\\d{6}_\\d{4}_(${CATEGORIES.join('|')})_[A-Za-z0-9_]+\\.md$`
);

// Directoris/fitxers exempts de la llei termodinàmica (no són "contingut"):
// 260829: els ancoratges estructurals (index de zona) no son contingut.
export const EXEMPT_BASENAMES = new Set([
  'README.md', '00_index.md', '.gitignore', '.DS_Store',
  '00_index_escriptori.md', '00_EN_CURS.md'
]);
export const EXEMPT_DIR_SEGMENTS = new Set(['scripts', 'node_modules', '.git', '.husky', 'assets']);

/**
 * Valida un nom de fitxer de CONTINGUT (.md) contra la llei termodinàmica.
 */
export function isValidContentFile(filename) {
  return TERMODINAMIC_REGEX.test(filename);
}

/**
 * Comprova només el joc de caràcters (per a diagnosticar "quin caràcter sobra").
 */
export function hasValidCharset(filename) {
  return CHAR_WHITELIST_REGEX.test(filename);
}

export function getTimestamp(date = new Date()) {
  const YY = String(date.getFullYear()).slice(-2);
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${YY}${MM}${DD}_${HH}${mm}`;
}

export function classify(content = '', filename = '') {
  const upperContent = content.toUpperCase();
  const upperFilename = filename.toUpperCase();
  if (upperContent.includes('ACTA:') || upperFilename.includes('ACTA')) return 'ACTA';
  if (upperContent.includes('SKILL:') || upperFilename.includes('SKILL')) return 'SKILL';
  if (upperContent.includes('REPORT:') || upperFilename.includes('REPORT')) return 'REPORT';
  if (upperFilename.includes('PLANTILLA')) return 'PLANTILLA';
  return 'DOC';
}

export function normalize(originalTitle, content = '') {
  let title = originalTitle.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const category = classify(content, originalTitle);
  return `${getTimestamp()}_${category}_${title}.md`;
}
