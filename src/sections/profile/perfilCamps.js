import { extractPlainText } from '../../utils/contentAdapter.js';
import { netejaText, sanitizeHtml } from '../../utils/sanitize.js';
import { ErrorValidacio } from '../../data/autodesament/errors.js';

/* ═══════════════════════════════════════════════════════════════════
   LA FITXA · quin camp de l'editor va a quina columna (D2, opció A)

   El Mestre: «entradilla = lema, H1 = nom, cos = presentacio_html».
   L'H2 conserva les dades que ja hi havia (bio / description), així
   cap dada es perd ni s'ha de moure.

   Títol, subtítol i entradilla són TEXT PLA a la base de dades: la
   closca de l'editor escriu HTML sanejat («Pep &amp; Maria») i ací es
   torna text abans de desar-lo. Només el cos és HTML, i passa pel
   sanejador únic del projecte.
   ═══════════════════════════════════════════════════════════════════ */

export const CAMPS_FITXA = Object.freeze({
  persona: Object.freeze({
    title: 'full_name', subtitle: 'bio', lead: 'lema', content: 'presentacio_html',
    logoImage: 'avatar_url', heroImage: 'hero_url', copyright: 'copyright',
  }),
  organitzacio: Object.freeze({
    title: 'name', subtitle: 'description', lead: 'lema', content: 'presentacio_html',
    logoImage: 'logo_url', heroImage: 'hero_url', copyright: 'copyright',
  }),
  /* Lògica d'Usuari (T4): la fitxa d'un agent IA té la mateixa anatomia.
     H1 = name, H2 = role, entradilla = lema, cos = presentacio_html. */
  agent: Object.freeze({
    title: 'name', subtitle: 'role', lead: 'lema', content: 'presentacio_html',
    logoImage: 'avatar_url', heroImage: 'hero_url', copyright: 'copyright',
  }),
});

/* Els CHECK de les columnes (M01, M05 i la migració de la F1): [mínim, màxim]. */
export const LIMITS_TEXT = Object.freeze({
  copyright: Object.freeze([0, 256]),
  full_name: Object.freeze([1, 120]),
  name: Object.freeze([2, 120]),
  lema: Object.freeze([0, 120]),
  bio: Object.freeze([0, 500]),
  description: Object.freeze([0, 500]),
  role: Object.freeze([0, 120]),
});

/* CHECK de presentacio_html (migració F1). char_length compta caràcters, no
   unitats UTF-16: per això el client compta amb [...html]. */
export const MAXIM_PRESENTACIO = 20000;

const CAMPS_IMATGE = new Set(['logoImage', 'heroImage']);

/** 'persona' per a la persona; 'agent' per a una IA; 'organitzacio' per a empreses i grups. */
export const menaDeFitxa = (identitat) => (
  identitat?.mena === 'persona' ? 'persona' : identitat?.mena === 'agent' ? 'agent' : 'organitzacio'
);

/** Text pla → HTML que la closca pinta tal qual (EditableField saneja). */
export const aHtml = (text) => String(text ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const text = (valor) => (typeof valor === 'string' ? valor : '');

/** La fitxa en text pla: per a la vista de lectura (UniversalPage ja escapa). */
export function fitxaDeLectura(identitat) {
  const camps = CAMPS_FITXA[menaDeFitxa(identitat)];
  const dades = identitat?.dades || {};
  const titol = text(dades[camps.title]) || text(identitat?.nom);
  return {
    title: titol,
    subtitle: text(dades[camps.subtitle]),
    lead: text(dades[camps.lead]),
    content: text(dades[camps.content]),
    heroImage: text(dades[camps.heroImage]),
    copyright: text(dades.copyright) || `© ${titol || 'Sóc de Poble'}`,
  };
}

/** Si la fitxa ja és pública: `is_public` per a la persona, `visibility` per a l'organització. */
export function fitxaPublicada(identitat) {
  const dades = identitat?.dades || {};
  const mena = menaDeFitxa(identitat);
  /* La fitxa d'un agent IA sempre és pública: no hi ha res a amagar d'una màquina. */
  if (mena === 'agent') return true;
  return mena === 'persona' ? Boolean(dades.is_public) : dades.visibility === 'public';
}

/**
 * Document per a DocumentEditor. `local` porta el que s'està escrivint i
 * guanya a les dades del servidor fins que la fitxa es torna a obrir.
 */
export function documentDeFitxa(identitat, local = {}) {
  const camps = CAMPS_FITXA[menaDeFitxa(identitat)];
  const dades = identitat?.dades || {};
  const lectura = fitxaDeLectura(identitat);
  return {
    id: identitat?.id,
    title: local.title ?? aHtml(lectura.title),
    subtitle: local.subtitle ?? aHtml(lectura.subtitle),
    lead: local.lead ?? aHtml(lectura.lead),
    content: local.content ?? lectura.content,
    logoImage: local.logoImage ?? text(dades[camps.logoImage]),
    heroImage: local.heroImage ?? lectura.heroImage,
    isPublished: fitxaPublicada(identitat),
    copyright: local.copyright ?? lectura.copyright,
  };
}

/** T47 · El text pla d'un camp de text (títol, H2, entradilla), tal com el compta el CHECK. */
export const textDeCamp = (valor) => netejaText(extractPlainText(valor, Infinity), Infinity);

/** T47 · Llargària en caràcters de veres (char_length), no en unitats UTF-16: «🌾» és 1. */
export const llargariaDeCamp = (valor) => [...textDeCamp(valor)].length;

/** T47 · «Retallar a N»: el text del camp escurçat a N caràcters, en l'HTML que pinta la closca. */
export const retallaCamp = (valor, maxim) => aHtml([...textDeCamp(valor)].slice(0, maxim).join('').trim());

function missatgeDeLlargaria(columna, minim, maxim, llargaria) {
  if (llargaria < minim) {
    if (columna === 'full_name') return 'El nom no pot quedar buit.';
    return `El nom ha de tindre almenys ${minim} lletres.`;
  }
  return `Com a màxim ${maxim} caràcters (ara en són ${llargaria}).`;
}

/**
 * Què es desa i on. Torna { columna, valor } o llança un ErrorValidacio amb
 * el missatge per a la persona (la llargària, en lletres de veres) i, per al
 * comptador de T47, la llargària i el límit.
 */
export function valorPerDesar(mena, camp, valor) {
  const columna = CAMPS_FITXA[mena]?.[camp];
  if (!columna) throw new ErrorValidacio('Este camp no es desa a la fitxa.');

  if (camp === 'content') {
    const html = sanitizeHtml(valor);
    const llargaria = [...html].length;
    if (llargaria > MAXIM_PRESENTACIO) {
      throw new ErrorValidacio(`La presentació és massa llarga: com a màxim ${MAXIM_PRESENTACIO} caràcters (ara en són ${llargaria}).`,
        { columna, llargaria, minim: 0, maxim: MAXIM_PRESENTACIO });
    }
    return { columna, valor: html };
  }

  /* Una imatge esborrada és null, el mateix «sense imatge» per a les dues
     columnes (el CHECK de hero_url admet també '', però cap lector el necessita). */
  if (CAMPS_IMATGE.has(camp)) {
    const url = String(valor ?? '').trim();
    return { columna, valor: url || null };
  }

  const pla = textDeCamp(valor);
  const [minim, maxim] = LIMITS_TEXT[columna] || [0, 4000];
  /* Com el cos: char_length compta caràcters, no unitats UTF-16 («🌾» és 1, no 2). */
  const llargaria = [...pla].length;
  if (llargaria < minim || llargaria > maxim) {
    throw new ErrorValidacio(missatgeDeLlargaria(columna, minim, maxim, llargaria), { columna, llargaria, minim, maxim });
  }
  return { columna, valor: pla };
}
