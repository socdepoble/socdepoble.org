#!/usr/bin/env node
/**
 * tooling/patrimoni/genera-que-dinem.mjs
 *
 * Generador determinista de src/data/patrimoni/queDinem.js: el receptari «Què dinem?» de l'Associació
 * Gastronòmica i Cultural «Fins rebentar com Sangonereta» (Muro, El Comtat, 2019).
 *
 * Fonts (cap no viu al repositori; es passen per argument):
 *   --kit     el JSON de receptes extret del kit R14 (array RECEPTES_QUE_DINEM_COMTAT) o el fitxer .js del kit;
 *             només se'n pren el text (ingredients, preparació i notes), mai cap camp afegit per damunt del llibre.
 *   --text    directori amb el text del PDF per pàgina (pag_NNN.txt, extracció PDFKit, una per pàgina).
 *   --webp    directori amb les làmines pNNN.webp del llibre (les mateixes que _cultura_de_poble/…/imatges_llibre_que_dinem_webp).
 *   --eixida  camí del mòdul que s'escriu (per defecte src/data/patrimoni/queDinem.js).
 *   --pdf     el PDF del llibre (el de public/, còpia byte a byte de l'original): se n'escriuen la mida i l'empremta.
 *   --informe directori on s'escriu l'informe de fidelitat (opcional).
 *
 * Regles (decisions de l'àrbitre, onada R14):
 *   - 149 receptes: les de l'índex del llibre (p. 3-5). Fora la cloenda de la p. 163 i les variants de títol inventat;
 *     les notes del llibre van com a notes literals de la recepta pare.
 *   - Camps: numero, slug, titol (el de l'índex), pagina, pagines, apartat (el de l'índex), ingredients, preparacio,
 *     notes, youtubeId (el que el PDF imprimix a la pàgina de la recepta) i lamina (la WebP de la pàgina).
 *   - Tot text ha de ser, lletra a lletra (sense espais ni puntuació), a les pàgines de la recepta: si no, el generador falla.
 *   - Cap camp que el llibre no done: res per damunt del text, el vídeo i la làmina de cada recepta.
 *
 * Ús:
 *   node tooling/patrimoni/genera-que-dinem.mjs --kit <receptes.json> --text <dir> --webp <dir> --pdf <pdf> [--eixida <js>] [--informe <dir>]
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
/* Correccions literals transcrites del PDF, només on el kit falla (preparacions buides, capçaleres convertides en
   passos, blocs d'ingredients barrejats, la nota que el kit perd). Passen per la mateixa verificació que la resta. */
import { CORRECCIONS, SUBSTITUCIONS } from './que-dinem-correccions.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, tot) => {
    if (!a.startsWith('--')) return acc;
    const valor = tot[i + 1] && !tot[i + 1].startsWith('--') ? tot[i + 1] : true;
    return [...acc, [a.slice(2), valor]];
  }, [])
);
for (const clau of ['kit', 'text', 'webp', 'pdf']) {
  if (!args[clau]) {
    console.error(`Falta --${clau}. Ús: node tooling/patrimoni/genera-que-dinem.mjs --kit <json> --text <dir> --webp <dir> --pdf <pdf>`);
    process.exit(2);
  }
}
const EIXIDA = args.eixida || 'src/data/patrimoni/queDinem.js';
/* Sota assets/uploads/: la carpeta que el connector del directori de WordPress.org ja servix des de l'origen públic
   (MITJANS_EXTERNS_DEL_DIRECTORI, src/config/politicaDeMitjans.js), com les altres imatges de patrimoni. Dins de
   assets/patrimoni/ el PDF i les làmines viatjaven dins del zip i el passaven del límit (standalone-build.test.mjs). */
const RUTA_LAMINES = '/assets/uploads/patrimoni/que-dinem';
const LAMINES_EXCLOSES = new Set(['p163.webp']); // foto de grup amb persones: no s'inclou

/* ---------- Normalització per a comparar amb el PDF ---------- */
const norm = (s) => String(s).normalize('NFC').toLowerCase().replace(/[^0-9a-zàáèéíïòóúüçñ]/g, '');
const espais = (s) => String(s).normalize('NFC').replace(/\s+/g, ' ').trim();

/* ---------- Text del PDF ---------- */
const pagines = new Map();
for (const nom of readdirSync(args.text)) {
  const m = /^pag_(\d{3})\.txt$/.exec(nom);
  if (m) pagines.set(Number(m[1]), readFileSync(path.join(args.text, nom), 'utf8').normalize('NFC'));
}
if (pagines.size < 160) throw new Error(`El text del PDF té ${pagines.size} pàgines; se n'esperaven 168.`);

/* ---------- Índex del llibre (p. 3-5): títols, pàgines i apartats ---------- */
const APARTATS = [
  { id: 'entrades', pagina: 8 },
  { id: 'plats', pagina: 55 },
  { id: 'postres', pagina: 115 },
  { id: 'licors', pagina: 156 }
];
const index = [];
let apartatActual = -1;
for (const p of [3, 4, 5]) {
  for (const brut of pagines.get(p).split('\n')) {
    const linia = brut.trim();
    if (/segons època de l’any\s*$/.test(linia) && !linia.startsWith('-')) {
      apartatActual += 1;
      APARTATS[apartatActual].titol = linia.replace(/^\d+/, '').replace(/^Índex/, '').trim();
      continue;
    }
    const m = /^-\s*(.+?)\s*\.{3,}\s*(\d+)\s*$/.exec(linia);
    if (m) index.push({ titol: espais(m[1]), pagina: Number(m[2]), apartat: APARTATS[apartatActual].id });
  }
}
if (index.length !== 149) throw new Error(`L'índex dona ${index.length} receptes; se n'esperaven 149.`);
if (APARTATS.some((a) => !a.titol)) throw new Error('No s’han trobat els 4 apartats de l’índex.');

/* ---------- Kit (només el text) ---------- */
function llegixKit(cami) {
  const font = readFileSync(cami, 'utf8');
  if (cami.endsWith('.json')) return JSON.parse(font);
  const marca = 'export const RECEPTES_QUE_DINEM_COMTAT = [';
  const inici = font.indexOf(marca) + marca.length - 1;
  let prof = 0;
  let dins = false;
  let esc = false;
  for (let j = inici; j < font.length; j += 1) {
    const c = font[j];
    if (dins) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') dins = false;
    } else if (c === '"') dins = true;
    else if (c === '[' || c === '{') prof += 1;
    else if (c === ']' || c === '}') {
      prof -= 1;
      if (prof === 0) return JSON.parse(font.slice(inici, j + 1));
    }
  }
  throw new Error('No s’ha pogut extraure l’array del kit.');
}
const kit = llegixKit(args.kit);
const kitPerNumero = new Map(kit.map((r) => [r.numero, r]));

/* Línies d'ingredients que el kit fusiona: el llibre de vegades marca la vinyeta amb «-» en lloc de «·»
   («Llucets -Gambetes pelades -Julivert…»). Es parteixen només per « -» seguit de text (no «4-5», «10-15»). */
const parteixFusionades = (linies) => linies.flatMap((l) => l.split(/\s+-(?=[\p{L}\d])/u).map(espais)).filter(Boolean);

/* ---------- Slug estable ---------- */
function slugDe(titol) {
  return titol
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[’'·]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ---------- Notes: el text de la nota al peu, sense el número de crida ni la frase del canal de YouTube ---------- */
/* La frase que remet al canal es trau (el vídeo va a youtubeId); si porta un matís («, però al forn,») es conserva
   la frase sense l'enllaç, perquè diu una cosa que el vídeo sol no diu.
   L'URL s'emporta també la cua de paràmetres («&feature=youtu.be», p. 57, #48): si no, quedava com a nota brossa. */
const FRASE_YOUTUBE = /Podeu veure l[’']elaboració d[’']aquesta recepta(,[^:]*?,)?\s*en el nostre canal de Youtube:\s*https?:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}(?:[&?#][^\s]*)?/gi;
/* Cap rastre d'URL ni de paràmetres de consulta al text de les dades. */
const RASTRE_D_URL = /https?:|www\.|youtu\.be|youtube\.com|watch\?|[?&][a-z_]+=/i;
/* Un pronom feble amb guionet enganxat a un altre sense guionet («traieu-losen»): és un guionet de final de línia
   llevat per error (el llibre escriu «traieu-los-en»). */
const PRONOMS_ENGANXATS = /-(?:l[aeio]s?|[nv]os|[mst]e)(?:en|hi|ho|ne)(?![\p{L}])/iu;
const TALL = '\u0000';
const trosNotes = (text) => espais(String(text || ''))
  .replace(FRASE_YOUTUBE, (_tot, matis) => (matis ? `${TALL}Podeu veure l’elaboració d’aquesta recepta${matis} en el nostre canal de Youtube.${TALL}` : TALL))
  .split(TALL)
  .map(espais)
  .filter((tros) => /\p{L}{2}/u.test(tros));
const notesDelKit = (text) => trosNotes(String(text || '').replace(/^\d{1,2}(?=\D)/, ''));

/* ---------- Vídeos: l'identificador imprés a les pàgines de la recepta ---------- */
const videosDePagines = (pags) => [...new Set(pags.flatMap((p) => [...(pagines.get(p) || '').matchAll(/watch\?v=([A-Za-z0-9_-]{11})/g)].map((m) => m[1])))];

/* ---------- Làmines ---------- */
const webpDisponibles = new Set(readdirSync(args.webp).filter((n) => /^p\d{3}\.webp$/.test(n)));
const laminaDe = (pags) => {
  const nom = pags.map((p) => `p${String(p).padStart(3, '0')}.webp`).find((n) => webpDisponibles.has(n) && !LAMINES_EXCLOSES.has(n));
  return nom ? `${RUTA_LAMINES}/${nom}` : null;
};

/* ---------- Construcció ---------- */
const errors = [];
const canvis = [];
const fidelitat = [];
const receptes = index.map((entrada, i) => {
  const numero = i + 1;
  const k = kitPerNumero.get(numero);
  if (!k) throw new Error(`El kit no té la recepta #${numero}.`);
  if (espais(k.titol) !== entrada.titol) canvis.push(`#${numero}: títol del kit «${k.titol}» → índex «${entrada.titol}»`);
  if (k.paginaPdf !== entrada.pagina) errors.push(`#${numero}: pàgina del kit ${k.paginaPdf} ≠ índex ${entrada.pagina}`);
  const pags = (k.paginesPdf && k.paginesPdf.length ? k.paginesPdf : [entrada.pagina]).slice();
  if (pags[0] !== entrada.pagina) errors.push(`#${numero}: pàgines ${pags} no comencen a ${entrada.pagina}`);
  const correccio = CORRECCIONS[numero] || {};
  /* Retocs de signes (SUBSTITUCIONS): cada parell ha de casar exactament una vegada en les línies del kit. */
  const pendents = (SUBSTITUCIONS[numero] || []).map(([de, a]) => ({ de, a, vegades: 0 }));
  const retoca = (linia) => pendents.reduce((text, s) => {
    const trossos = text.split(s.de);
    s.vegades += trossos.length - 1;
    return trossos.join(s.a);
  }, linia);
  const liniesKit = (k.ingredients || []).map(espais).map(retoca);
  const partides = parteixFusionades(liniesKit);
  if (!correccio.ingredients && partides.length !== liniesKit.length) canvis.push(`#${numero}: ${liniesKit.length} línies d'ingredients fusionades del kit → ${partides.length}`);
  const ingredients = correccio.ingredients || [{ titol: null, linies: partides }];
  const preparacio = correccio.preparacio || [{ titol: null, linies: (k.preparacio || []).map(espais).map(retoca) }];
  const notes = (correccio.notes || notesDelKit(k.notesVariants)).map(retoca);
  for (const s of pendents) {
    if (s.vegades !== 1) errors.push(`#${numero}: la substitució «${s.de}» → «${s.a}» casa ${s.vegades} vegades (n'ha de casar 1)`);
    else canvis.push(`#${numero}: signes retocats «${s.de}» → «${s.a}»`);
  }
  if (correccio.ingredients) canvis.push(`#${numero}: ingredients reconstruïts del PDF (${correccio.motiu})`);
  if (correccio.preparacio) canvis.push(`#${numero}: preparació reconstruïda del PDF (${correccio.motiu})`);
  if (correccio.notes) canvis.push(`#${numero}: notes reconstruïdes del PDF (${correccio.motiu})`);

  const videos = videosDePagines(pags);
  if (videos.length > 1) errors.push(`#${numero}: més d'un vídeo a les pàgines ${pags}`);
  const youtubeId = videos[0] || null;
  if ((k.youtubeId || null) !== youtubeId) canvis.push(`#${numero}: vídeo del kit ${k.youtubeId} → PDF ${youtubeId}`);
  const lamina = laminaDe(pags);
  if ((k.imatgeWebp || null) !== lamina) canvis.push(`#${numero}: làmina del kit ${k.imatgeWebp} → ${lamina}`);
  const slug = slugDe(entrada.titol);
  if (k.slug !== slug) canvis.push(`#${numero}: slug del kit «${k.slug}» → «${slug}»`);

  /* Verificació lletra a lletra contra les pàgines de la recepta. */
  const textPdf = pags.map((p) => norm(pagines.get(p) || '')).join('');
  const comprova = (camp, text) => {
    const n = norm(text);
    if (!n || !textPdf.includes(n)) errors.push(`#${numero} ${camp}: no literal → «${text.slice(0, 90)}»`);
    if (RASTRE_D_URL.test(text)) errors.push(`#${numero} ${camp}: rastre d'URL → «${text.slice(0, 90)}»`);
    if (PRONOMS_ENGANXATS.test(text)) errors.push(`#${numero} ${camp}: pronoms enganxats sense guionet → «${PRONOMS_ENGANXATS.exec(text)[0]}»`);
  };
  for (const b of ingredients) {
    if (b.titol) comprova('títol d’ingredients', b.titol);
    b.linies.forEach((l) => comprova('ingredient', l));
  }
  for (const b of preparacio) {
    if (b.titol) comprova('títol de preparació', b.titol);
    b.linies.forEach((l) => comprova('preparació', l));
  }
  notes.forEach((n) => comprova('nota', n));
  if (!preparacio.some((b) => b.linies.length)) errors.push(`#${numero}: preparació buida`);
  /* Una capçalera del llibre convertida en pas: línia curta sense punt final i quasi tota en majúscules. */
  const esCapcalera = (l) => l.length < 60 && !/[.:;]$/.test(l) && (l.match(/\p{Lu}/gu) || []).length >= (l.match(/\p{L}/gu) || []).length * 0.7;
  for (const b of preparacio) for (const l of b.linies) if (esCapcalera(l)) errors.push(`#${numero}: capçalera com a pas «${l}»`);
  for (const b of ingredients) for (const l of b.linies) if (esCapcalera(l)) errors.push(`#${numero}: capçalera com a ingredient «${l}»`);

  /* Notes al peu del PDF (línia que comença amb el número de crida enganxat al text): tot el que diuen, fora de la
     frase que remet al canal de YouTube, ha de ser a les notes de la recepta. */
  for (const p of pags) {
    const linies = (pagines.get(p) || '').split('\n');
    const inici = linies.findIndex((l) => /^\d{1,2}\p{L}/u.test(l.trim()));
    if (inici < 0) continue;
    const peu = linies.slice(inici).filter((l) => !/^\d+$/.test(l.trim())).join(' ').replace(/^\s*\d{1,2}/, '');
    const esperat = norm(trosNotes(peu).join(' '));
    const obtingut = norm(notes.join(' '));
    if (esperat !== obtingut) errors.push(`#${numero}: la nota al peu de la p. ${p} no quadra amb les notes («${esperat.slice(0, 60)}» ≠ «${obtingut.slice(0, 60)}»)`);
  }

  /* Recompte de vinyetes del PDF («·» o «-» a l'inici de línia) contra les línies d'ingredients. */
  const vinyetes = pags.reduce((s, p) => s + (pagines.get(p) || '').split('\n').filter((l) => /^\s*[·-]/.test(l)).length, 0);
  const nIngredients = ingredients.reduce((s, b) => s + b.linies.length, 0);
  if (vinyetes !== nIngredients) errors.push(`#${numero}: ${nIngredients} ingredients però ${vinyetes} vinyetes al PDF`);

  fidelitat.push({ numero, titol: entrada.titol, pagina: entrada.pagina, pagines: pags, vinyetes, ingredients: nIngredients, paragrafs: preparacio.reduce((s, b) => s + b.linies.length, 0), notes: notes.length, youtubeId, lamina, titolALaPagina: norm(pagines.get(pags[0]) || '').includes(norm(entrada.titol.replace(/\([^)]*\)/g, ''))) });
  return { numero, slug, titol: entrada.titol, pagina: entrada.pagina, pagines: pags, apartat: entrada.apartat, ingredients, preparacio, notes, youtubeId, lamina };
});

const slugs = new Set(receptes.map((r) => r.slug));
if (slugs.size !== receptes.length) errors.push('Hi ha slugs repetits.');
const lamines = receptes.map((r) => r.lamina).filter(Boolean);
if (new Set(lamines).size !== lamines.length) errors.push('Hi ha làmines repetides.');

if (args.diagnosi !== undefined || errors.length) {
  console.log(`Errors: ${errors.length}`);
  for (const e of errors) console.log(`  ${e}`);
  if (args.diagnosi !== undefined) for (const c of canvis) console.log(`  canvi ${c}`);
  if (errors.length) process.exit(1);
}

/* ---------- Escriptura del mòdul ---------- */
const sha = (cami) => createHash('sha256').update(readFileSync(cami)).digest('hex');
const OBRA = {
  titol: 'Què dinem?',
  associacio: 'Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»',
  lloc: 'Muro, El Comtat',
  any: 2019,
  dipositLegal: 'A 373-2019',
  isbnImpres: '978 84 09 131910 1',
  isbnValid: false,
  pdf: `${RUTA_LAMINES}/llibre-que-dinem.pdf`,
  pdfBytes: statSync(args.pdf).size,
  permis: 'Text i làmines amb permís d’ús.',
  canalVideos: 'Sangonereta Gastronomia',
  apartats: APARTATS.map(({ id, titol, pagina }) => ({ id, titol, pagina }))
};
const json = (v) => JSON.stringify(v, null, 2);
const modul = `/* «Què dinem?» · receptari de l'Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»
   (Muro, El Comtat, 2019; dipòsit legal A 373-2019). Text i làmines amb permís d'ús (el Llibre Mestre recull que
   el PDF arriba «amb tots els permisos d'ús de text i imatges», declaració del Mestre); vídeos del canal
   «Sangonereta Gastronomia».

   FITXER GENERAT per tooling/patrimoni/genera-que-dinem.mjs: no l'edites a mà, torna'l a generar.
   - 149 receptes, les de l'índex del llibre (p. 3-5), amb el títol i la pàgina de l'índex i l'apartat on les posa.
   - Ingredients, preparació i notes: text literal del PDF (cada línia hi és lletra a lletra a les pàgines de la
     recepta; el generador ho comprova). Les notes són les notes al peu, sense el número de crida ni la frase que
     remet al canal de YouTube (el vídeo va al camp youtubeId).
   - youtubeId: l'identificador que el PDF imprimix a la pàgina de la recepta. lamina: la WebP de la pàgina.
   - Cap camp per damunt del llibre: només el que el PDF dona per a cada recepta (text, vídeo i làmina).
   - ISBN: el que hi ha imprés té 14 dígits i no és vàlid; es conserva literal amb isbnValid: false.
   Empremtes: PDF ${sha(args.pdf)} (SHA-256). */

/**
 * @typedef {{ titol: string|null, linies: string[] }} BlocDeRecepta
 * @typedef {{ numero: number, slug: string, titol: string, pagina: number, pagines: number[],
 *   apartat: 'entrades'|'plats'|'postres'|'licors', ingredients: BlocDeRecepta[], preparacio: BlocDeRecepta[],
 *   notes: string[], youtubeId: string|null, lamina: string|null }} ReceptaQueDinem
 */

const congela = (valor) => {
  if (valor && typeof valor === 'object') {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
};

export const OBRA_QUE_DINEM = congela(${json(OBRA)});

/** @type {ReadonlyArray<ReceptaQueDinem>} */
export const RECEPTES_QUE_DINEM = congela(${json(receptes)});

const PER_SLUG = new Map(RECEPTES_QUE_DINEM.map((recepta) => [recepta.slug, recepta]));

/** Cerca exacta per slug: un slug inexistent (o que no siga una cadena) torna null; mai no fa cerca difusa. */
export function receptaPerSlug(slug) {
  return typeof slug === 'string' && PER_SLUG.has(slug) ? PER_SLUG.get(slug) : null;
}

/** Totes les línies d'ingredients d'una recepta, en l'ordre del llibre. */
export const liniesIngredients = (recepta) => recepta.ingredients.flatMap((bloc) => bloc.linies);

export const RECOMPTES_QUE_DINEM = congela({
  receptes: RECEPTES_QUE_DINEM.length,
  videos: new Set(RECEPTES_QUE_DINEM.map((r) => r.youtubeId).filter(Boolean)).size,
  receptesAmbVideo: RECEPTES_QUE_DINEM.filter((r) => r.youtubeId).length,
  lamines: new Set(RECEPTES_QUE_DINEM.map((r) => r.lamina).filter(Boolean)).size,
  perApartat: Object.fromEntries(OBRA_QUE_DINEM.apartats.map((a) => [a.id, RECEPTES_QUE_DINEM.filter((r) => r.apartat === a.id).length]))
});
`;
writeFileSync(EIXIDA, modul);
console.log(`Escrit ${EIXIDA}: ${receptes.length} receptes, ${new Set(receptes.map((r) => r.youtubeId).filter(Boolean)).size} vídeos, ${lamines.length} làmines.`);

if (args.informe) {
  mkdirSync(args.informe, { recursive: true });
  writeFileSync(path.join(args.informe, 'fidelitat.json'), json({ fidelitat, canvis }));
  writeFileSync(path.join(args.informe, 'lamines_usades.txt'), `${lamines.map((l) => path.basename(l)).sort().join('\n')}\n`);
  console.log(`Informe a ${args.informe}`);
}
if (!existsSync(EIXIDA)) process.exit(1);
