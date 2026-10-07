/**
 * destinsEmoji.js — on es pot posar una emoticona del catàleg Emojis XL.
 *
 * Ordre del Mestre (261007, via MarIA) · «El catàleg d'Emojis XL no pot ser
 * només per a copiar i enganxar»: el botó «Assignar» de cada targeta obri una
 * pantalla completa (AssignacioEmoji.jsx) on «es llisten les carpetes i
 * documents disponibles (Wiki, Disseny, Notes personals)», agrupats a la
 * manera de «Reenviar a…» de WhatsApp: Notes personals, Wiki de Poble,
 * Disseny i les pàgines de Sóc de Poble que viuen al PAGE_COPY (les del
 * sistema). Dins de cada grup, l'ordre de la seua secció, que en mòbil
 * ensenya primer l'arbre: la portada, les carpetes i els documents. Ací, en
 * funcions pures, cada font es fa destins i la cerca els filtra amb el
 * plegat de /cerca (indexCerca.js: «disseny» troba «Disseny»).
 *
 * Un destí: { id, grup, titol, previa, glif, data, escriu, nota? }
 *   · glif    l'emoji o la icona que porta ara (emoji en text o component
 *             d'icona, el que pinta NavGlyph);
 *   · escriu  'nota': l'emoticona és un camp de la nota (`icon`, T23) i
 *             s'assigna de veres pel canal del Bloc (setLocalNoteField).
 *             La resta no s'escriu des d'ací, i motiuInert diu per què:
 *             'codi': la pàgina o la família viatja dins del paquet
 *             (PAGE_COPY, el manifest del catàleg o la Wiki compilada). El
 *             navegador no la pot reescriure: el seu emoji es canvia amb un
 *             commit, i la pantalla ho diu en lloc de fingir-ho;
 *             'carpeta-wiki': les carpetes de la Wiki porten un emoji fix,
 *             declarat al codi (wiki-de-poble/iconesWiki.js ·
 *             glifDeCarpetaWiki; ordre del Mestre, pla 261007_0012, §0.7): com
 *             les pàgines, es canvia amb un commit;
 *             'carpeta-bloc': les carpetes del Bloc porten icones de Lucide
 *             (ordre del Mestre, 261007: «Les carpetes de sistema (Mur, Mercat,
 *             Pobles…) usen icones de Lucide»), i el contracte de les carpetes
 *             del Bloc no guarda cap emoticona.
 */
import { GLIF_CARPETA, GLIF_DOCUMENT } from '../../../components/universal/workspace/NavGlyph.jsx';
import { TEXTOS_LLAVOR } from '../../../components/universal/textosLlavor.js';
import { esConnexio, esExtern } from '../../../data/origenNota.js';
import { extractPlainText } from '../../../utils/contentAdapter.js';
import { EMOTICONA_PER_DEFECTE, emojiInicial, emojiSol } from '../../../utils/emoji.js';
import { iconaDeCarpeta, opcionsDeCarpetes } from '../../notes/carpetes.js';
import { fitxes, plega } from '../../search/indexCerca.js';
import { ICONES_ITEMS_WIKI, glifDeCarpetaWiki, iconaDeDocument } from '../../wiki-de-poble/iconesWiki.js';

const MAX_PREVIA = 140;
const CAP = Object.freeze([]);

const AVIS_PAGINES_I_CARPETES = 'Estes pàgines i carpetes viatgen dins del codi de l’app: des d’ací no se’n pot canviar l’emoji ni la icona.';

/* Els grups, en l'ordre en què es pinten, amb l'avís del grup (o cap). */
export const GRUPS_DESTI = Object.freeze([
  Object.freeze({ id: 'notes', titol: 'Notes personals', avis: null }),
  Object.freeze({ id: 'wiki', titol: 'Wiki de Poble', avis: AVIS_PAGINES_I_CARPETES }),
  Object.freeze({ id: 'disseny', titol: 'Disseny', avis: AVIS_PAGINES_I_CARPETES }),
  Object.freeze({
    id: 'sistema', titol: 'Pàgines de Sóc de Poble',
    avis: 'Estes pàgines viatgen dins del codi de l’app: des d’ací no se’n pot canviar l’emoji.'
  })
]);

/* La carpeta de la Wiki que declara la secció (WikiDePobleSection.jsx, el seu
   model: no l'exporta) i d'on pengen la Consola i les eines locals. La prova
   vigila que el literal coincidix amb el de la Wiki. */
export const CARPETA_MAQUINARIA = Object.freeze({ id: 'maquinaria_cat', label: 'Maquinària de la IAIA', parentId: null });

const previaDe = (valor) => extractPlainText(valor || '', MAX_PREVIA);

const destiDelCodi = (grup, id, titol, previa, glif, escriu = 'codi') => ({
  id, grup, titol, previa: previaDe(previa), glif, data: '', escriu
});

/* «cap document», «1 document», «3 documents». */
const quants = (nombre, un, molts) => (nombre === 0 ? `cap ${un}` : `${nombre} ${nombre === 1 ? un : molts}`);

/* La previa d'una carpeta: on penja i quants documents hi ha. */
const previaDeCarpeta = (pare, recompte) => [pare ? `Carpeta de ${pare}` : 'Carpeta', recompte].filter(Boolean).join(' · ');

/**
 * Les notes del Bloc (useNotes().notes) com a destins. El glif és el de la
 * llista del Bloc (NotesSection): l'emoticona triada, l'emoji del títol o, si
 * no n'hi ha cap, la ploma 🪶 de sèrie (T34); una connexió o un contingut de
 * fora no porten la ploma, sinó la carpeta (T71).
 */
export function destinsDeNotes(notes) {
  if (!Array.isArray(notes)) return CAP;
  return notes.filter((nota) => nota?.id != null).map((nota) => {
    const titol = extractPlainText(nota.title || '', Infinity) || TEXTOS_LLAVOR.titol;
    const deFora = esConnexio(nota) || esExtern(nota);
    return {
      id: `nota:${nota.id}`,
      grup: 'notes',
      titol,
      previa: previaDe(nota.subtitle || nota.lead) || String(nota.plainText || '').slice(0, MAX_PREVIA),
      glif: emojiSol(nota.icon) || emojiInicial(titol) || (deFora ? GLIF_CARPETA : EMOTICONA_PER_DEFECTE),
      data: nota.formattedDate || '',
      escriu: 'nota',
      nota
    };
  });
}

/**
 * Les carpetes del Bloc, les mateixes que pinta la seua columna
 * (NotesSection · opcionsDeCarpetes: les del servidor o les de sèrie, sense
 * «Tot» i amb la Safata d’Entrada), cadascuna amb la seua icona de Lucide
 * (iconaDeCarpeta). Cap no s'escriu des d'ací: vegeu motiuInert.
 */
export function destinsDeCarpetesDelBloc(noteFolders) {
  const carpetes = opcionsDeCarpetes(noteFolders);
  const noms = new Map(carpetes.map((carpeta) => [carpeta.id, carpeta.nom]));
  return carpetes.map((carpeta) => ({
    id: `nota:carpeta:${carpeta.id}`,
    grup: 'notes',
    titol: String(carpeta.nom || carpeta.id),
    previa: noms.has(carpeta.parentId) ? `Carpeta de ${noms.get(carpeta.parentId)}` : 'Carpeta del Bloc',
    glif: iconaDeCarpeta(carpeta.id),
    data: '',
    escriu: 'carpeta-bloc'
  }));
}

/**
 * La Wiki com la pinta WikiDePobleSection: la portada (el seu PAGE_COPY), les
 * carpetes (Maquinària de la IAIA i les del manifest) i els documents (la
 * Consola, les eines locals i els documents de la Wiki compilada,
 * src/data/wikiManifest.js). El glif de cada destí és el que pinta la Wiki, de
 * la mateixa font (wiki-de-poble/iconesWiki.js): la portada, el seu
 * (ICONES_ITEMS_WIKI.__intro; el document, si un dia faltara); cada carpeta,
 * glifDeCarpetaWiki (el seu emoji o, una carpeta nova sense, Folder); la
 * Consola (⚙️), el propi de cada eina local i, per a cada document,
 * iconaDeDocument (el propi per id, el de la família o 📄).
 *
 * `consola` és el copy de la Consola (el carregat primer i PAGE_COPY de
 * reserva) i `locals`, les eines locals (modulsLocalsActius de la Wiki: només
 * en desenvolupament). Sense el manifest (la Wiki encara no ha arribat), només
 * la portada.
 */
export function destinsDeLaWiki(manifest, portada, { consola = null, locals = CAP } = {}) {
  const destins = [];
  if (portada) {
    destins.push(destiDelCodi('wiki', 'wiki:portada', portada.title || 'Wiki de Poble', portada.subtitle,
      ICONES_ITEMS_WIKI.__intro || GLIF_DOCUMENT));
  }
  if (!manifest) return destins;
  /* Els mateixos títols de reserva que la Wiki, si el copy de la Consola falta. */
  const documents = [
    {
      id: 'consola_termodinamica', title: consola?.title || 'Consola Termodinàmica',
      subtitle: consola?.subtitle || 'Manteniment de la IAIA', categoryId: CARPETA_MAQUINARIA.id,
      glif: ICONES_ITEMS_WIKI.consola_termodinamica
    },
    ...(locals || CAP).filter((eina) => eina?.id).map((eina) => ({ ...eina, glif: eina.icon || ICONES_ITEMS_WIKI[eina.id] })),
    ...(manifest.items || CAP).filter((doc) => doc?.id).map((doc) => ({ ...doc, glif: iconaDeDocument(doc) }))
  ];
  const carpetes = [CARPETA_MAQUINARIA, ...(manifest.categories || CAP)].filter((carpeta) => carpeta?.id);
  const etiquetes = new Map(carpetes.map((carpeta) => [carpeta.id, carpeta.label]));
  for (const carpeta of carpetes) {
    const dins = documents.filter((doc) => doc.categoryId === carpeta.id).length;
    destins.push(destiDelCodi('wiki', `wiki:carpeta:${carpeta.id}`, String(carpeta.label || carpeta.id),
      previaDeCarpeta(etiquetes.get(carpeta.parentId), quants(dins, 'document', 'documents')), glifDeCarpetaWiki(carpeta.id), 'carpeta-wiki'));
  }
  for (const doc of documents) {
    destins.push(destiDelCodi('wiki', `wiki:${doc.id}`, String(doc.title || doc.id), doc.subtitle, doc.glif || GLIF_DOCUMENT));
  }
  return destins;
}

/**
 * Disseny com el pinta DesignSection: la portada (el seu PAGE_COPY), les
 * famílies del catàleg (les seues carpetes, cadascuna amb el seu emoji: 🧱,
 * 📐…) i els espècimens. El glif d'un espècimen és el de la llista de
 * Disseny: el propi, si en porta (Emojis XL, 🌻), o el de la seua família.
 */
export function destinsDelDisseny(categories, items, portada) {
  const glifs = new Map((categories || CAP).map((categoria) => [categoria.id, categoria.icon]));
  const destins = [];
  if (portada) destins.push(destiDelCodi('disseny', 'disseny:portada', portada.title || 'Disseny', portada.subtitle, GLIF_DOCUMENT));
  for (const categoria of categories || CAP) {
    if (!categoria?.id) continue;
    const dins = (items || CAP).filter((item) => item?.categoryIds?.includes(categoria.id)).length;
    destins.push(destiDelCodi('disseny', `disseny:carpeta:${categoria.id}`, String(categoria.label || categoria.id),
      previaDeCarpeta(null, quants(dins, 'espècimen', 'espècimens')), categoria.icon || GLIF_CARPETA));
  }
  for (const item of items || CAP) {
    if (!item?.id) continue;
    const titol = String(item.title || item.id);
    destins.push(destiDelCodi('disseny', `disseny:${item.id}`, titol, item.subtitle,
      emojiSol(item.icon) || emojiInicial(titol) || glifs.get(item.categoryIds?.[0]) || GLIF_DOCUMENT));
  }
  return destins;
}

/**
 * Les pàgines de Sóc de Poble que viuen al PAGE_COPY: primer les del sistema
 * (SYSTEM_PAGES, les que el Mur barreja) i, darrere, les pàgines de text de
 * la navegació que no hi són (SECTIONS amb pageKey: L'Ànima de la IAIA, Nodes
 * i Fedivers). `copyDe(clau)` torna el copy de la pàgina (el carregat primer i
 * PAGE_COPY de reserva); una clau sense copy no es pinta, com al Mur
 * (targetesDeSistema). Les portades que ja encapçalen el seu grup
 * (`jaLlistades`: la Wiki i Disseny) no es repetixen. El glif és el de la
 * barra lateral (SECTIONS, per ruta) o, si la pàgina no hi té entrada (El Xat,
 * Drets d'autor), el document.
 */
export function destinsDelSistema(pagines, seccions, copyDe, jaLlistades = CAP) {
  const perRuta = new Map((seccions || CAP).map((seccio) => [seccio.path, seccio]));
  const entrades = [
    ...(pagines || CAP).map((pagina) => ({ clau: pagina.key, ruta: pagina.href })),
    ...(seccions || CAP).filter((seccio) => seccio.pageKey).map((seccio) => ({ clau: seccio.pageKey, ruta: seccio.path }))
  ];
  const vistes = new Set(jaLlistades);
  const destins = [];
  for (const { clau, ruta } of entrades) {
    if (!clau || vistes.has(clau)) continue;
    vistes.add(clau);
    const copy = copyDe(clau);
    if (!copy) continue;
    destins.push(destiDelCodi('sistema', `sistema:${clau}`, String(copy.title || clau), copy.subtitle,
      perRuta.get(ruta)?.icon || GLIF_DOCUMENT));
  }
  return destins;
}

/** Els destins que contenen totes les paraules de la consulta, al títol o a la previa. */
export function filtraDestins(destins, consulta) {
  const llista = fitxes(consulta);
  if (!llista.length) return destins;
  return destins.filter((desti) => {
    const plegat = plega(`${desti.titol} ${desti.previa}`);
    return llista.every((fitxa) => plegat.includes(fitxa));
  });
}

/* Els avisos de la pantalla, en una sola font (la pantalla i les proves). */
export const textAssignat = (emoji, titol) => `Fet: ${emoji} és ara l’emoji de «${titol}».`;
export const textJaHiEra = (emoji, titol) => `«${titol}» ja porta ${emoji}: no hi havia res a canviar.`;
export const textDelCodi = (titol) => `No s’ha canviat res: «${titol}» viu al codi de l’app i el seu emoji es canvia amb un commit.`;
export const textNoValid = (emoji) => `${emoji} no pot ser l’emoticona d’una nota: ha de ser un sol emoji.`;
export const textNoReconegut = (emoji) => `Este navegador encara no reconeix ${emoji} com a emoji: no es pot desar a la nota.`;

/* Revisió del 261007 (M2-12) · Un pictograma (Extended_Pictographic, que
   també cobrix els punts de codi reservats per als emojis que encara han de
   vindre). */
const PICTOGRAMA = /\p{Extended_Pictographic}/u;

/**
 * L'avís per a un glif que emojiSol no accepta. emojiSol llig
 * \p{Emoji_Presentation} del motor, i els del Baseline 2022 (Chrome 100,
 * Firefox 100, Safari 16) porten les dades d'Unicode 14: un emoji del catàleg
 * d'Unicode 15 o posterior (🫨, 🩷…) hi dona null encara que siga un sol
 * emoji. Si el glif porta un pictograma, el que falla és el navegador
 * (textNoReconegut); si no en porta cap (una entrada lliure com «ab»), el glif
 * (textNoValid).
 */
export const textNoAssignable = (emoji) => (PICTOGRAMA.test(String(emoji ?? '')) ? textNoReconegut(emoji) : textNoValid(emoji));
/* Ordre del Mestre (pla 261007_0012, §0.7) · Les carpetes de la Wiki ja porten
   emoji, però és fix: viu al codi (iconesWiki.js), com les pàgines. */
export const textCarpetaWiki = (titol) => `No s’ha canviat res: «${titol}» és una carpeta de la Wiki, i el seu emoji és fix: viu al codi de l’app i es canvia amb un commit.`;
export const textCarpetaBloc = (titol) => `No s’ha canviat res: «${titol}» és una carpeta del Bloc. Les carpetes porten icones de Lucide, i el contracte de dades amb el servidor encara no els guarda cap emoticona.`;

/* Per què no s'escriu: [l'etiqueta de la fila, l'avís en prémer-la]. */
const MOTIUS_INERTS = Object.freeze({
  codi: Object.freeze(['Al codi', textDelCodi]),
  'carpeta-wiki': Object.freeze(['Icona fixa', textCarpetaWiki]),
  'carpeta-bloc': Object.freeze(['Icona fixa', textCarpetaBloc])
});

/**
 * Per què un destí no s'escriu des d'ací: { etiqueta, text } (l'etiqueta de
 * la fila inerta i l'avís que es pinta davall en prémer-la), o null si
 * s'escriu de veres (una nota). Un `escriu` desconegut compta com a codi: mai
 * es fingix una escriptura.
 */
export function motiuInert(desti) {
  if (desti?.escriu === 'nota') return null;
  const clau = Object.prototype.hasOwnProperty.call(MOTIUS_INERTS, desti?.escriu) ? desti.escriu : 'codi';
  const [etiqueta, text] = MOTIUS_INERTS[clau];
  return { etiqueta, text: text(desti?.titol ?? '') };
}
