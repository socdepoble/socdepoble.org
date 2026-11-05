/**
 * maquetacio.js · P0-26 D1 (Onada R6, Bloc 2; avís A1 de Gemini) · Els
 * contenidors de maquetació dels cossos canònics (Manifest de Poble i 2n Aplec
 * pel Territori) passen per l'editor sense perdre's. Abans, cap node no
 * reconeixia un <div>: ProseMirror el desfeia i n'hissava el contingut, i el
 * primer desat deixava la galeria, les figures i els logotips en columna.
 *
 * Tres peces, totes en LLISTA BLANCA (cap classe arbitrària no entra):
 *   · ContenidorDeMaquetacio · <div> de blocs amb una classe de
 *     CLASSES_DE_CONTENIDOR, o una ítem de galeria (div[data-wp-media-id],
 *     un enter). Contingut: block+.
 *   · AccionsDeMaquetacio · <div class="sdp-accions"> amb els botons EN LÍNIA
 *     (els enllaços sdp-boto), tal com els pinta la primitiva: sense cap <p>
 *     pel mig, que trencaria el flex de la fila.
 *   · ClasseDeParagraf · la classe d'un <p> de CLASSES_DE_PARAGRAF (el
 *     paràgraf centrat i el peu de foto de l'Aplec).
 * B3-3 (Onada R6, Bloc 3) · Fidelitat completa en desar, també en llista blanca:
 *   · ClassesTipografiques · la classe tipogràfica d'un títol (CLASSES_DE_TITOL)
 *     o d'una llista (CLASSES_DE_LLISTA); la del paràgraf (detail-content__paragraph)
 *     va a CLASSES_DE_PARAGRAF. Cada tipus té el seu atribut (classeDeTitol,
 *     classeDeLlista): amb un nom compartit, el Retorn al final d'un títol
 *     (splitBlock, keepOnSplit) passaria la classe del títol al paràgraf nou.
 *   · NomesPerALectors · la marca del <span class="sdp-sr-only"> (el «s'obri en
 *     una altra pestanya» del botó d'adhesió del Manifest). Sense, el span es
 *     desfeia i el text quedava visible dins del botó. inclusive: false, perquè
 *     el que s'escriu darrere no s'amague.
 *   La classe del quadre d'adhesió (manifest-de-poble__adhesio) la porta la
 *   primitiva mateixa (subtargeta.js, CLASSES_DE_SUBTARGETA).
 * El sanejador (utils/sanitize.js) ja conserva div, class i els data-*: el que
 * es desa es torna a llegir igual.
 */
import { Extension, Mark, Node } from '@tiptap/core';

export const CLASSES_DE_CONTENIDOR = Object.freeze([
  'aplec-2023__galeria',
  'aplec-2023__figura',
  'aplec-2023__complement',
  'aplec-2023__organitzadores',
  'manifest-de-poble__organitzadores',
]);
export const CLASSE_ACCIONS = 'sdp-accions';
export const CLASSES_D_ACCIONS = Object.freeze(['manifest-de-poble__documents', CLASSE_ACCIONS]);
export const CLASSES_DE_PARAGRAF = Object.freeze(['sdp-paragraf-centrat', 'aplec-2023__peu', 'detail-content__paragraph']);
export const CLASSES_DE_TITOL = Object.freeze(['detail-content__titol']);
export const CLASSES_DE_LLISTA = Object.freeze(['detail-content__llista']);
export const CLASSE_NOMES_LECTOR = 'sdp-sr-only';

const FORMA_ID_DE_MITJA = /^\d{1,12}$/;

/** Les classes de `valor` que són a la llista, en el seu ordre i sense repetir; o null. */
export function classesPermeses(valor, permeses) {
  if (typeof valor !== 'string') return null;
  const tokens = [...new Set(valor.split(/\s+/).filter((token) => permeses.includes(token)))];
  return tokens.length ? tokens.join(' ') : null;
}

const atributDeClasse = (permeses, nom = 'classe') => ({
  default: null,
  parseHTML: (element) => classesPermeses(element.getAttribute('class'), permeses),
  renderHTML: (atributs) => (atributs[nom] ? { class: atributs[nom] } : {}),
});

const esAccions = (element) => element.classList?.contains(CLASSE_ACCIONS) === true;

export const ContenidorDeMaquetacio = Node.create({
  name: 'sdpContenidor',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: false,

  addAttributes() {
    return {
      classe: atributDeClasse(CLASSES_DE_CONTENIDOR),
      wpMediaId: {
        default: null,
        parseHTML: (element) => {
          const id = element.getAttribute('data-wp-media-id');
          return id !== null && FORMA_ID_DE_MITJA.test(id) ? id : null;
        },
        renderHTML: (atributs) => (atributs.wpMediaId ? { 'data-wp-media-id': atributs.wpMediaId } : {}),
      },
    };
  },

  parseHTML() {
    return [{
      tag: 'div',
      getAttrs: (element) => {
        if (esAccions(element)) return false;
        const id = element.getAttribute('data-wp-media-id');
        const teId = id !== null && FORMA_ID_DE_MITJA.test(id);
        return teId || classesPermeses(element.getAttribute('class'), CLASSES_DE_CONTENIDOR) ? null : false;
      },
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
});

export const AccionsDeMaquetacio = Node.create({
  name: 'sdpAccions',
  group: 'block',
  content: 'inline*',
  defining: true,
  draggable: false,

  addAttributes() {
    return { classe: atributDeClasse(CLASSES_D_ACCIONS) };
  },

  parseHTML() {
    return [{ tag: 'div', getAttrs: (element) => (esAccions(element) ? null : false) }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
});

export const ClasseDeParagraf = Extension.create({
  name: 'sdpClasseDeParagraf',
  addGlobalAttributes() {
    return [{ types: ['paragraph'], attributes: { classe: atributDeClasse(CLASSES_DE_PARAGRAF) } }];
  },
});

export const ClassesTipografiques = Extension.create({
  name: 'sdpClassesTipografiques',
  addGlobalAttributes() {
    return [
      { types: ['heading'], attributes: { classeDeTitol: atributDeClasse(CLASSES_DE_TITOL, 'classeDeTitol') } },
      { types: ['bulletList', 'orderedList'], attributes: { classeDeLlista: atributDeClasse(CLASSES_DE_LLISTA, 'classeDeLlista') } },
    ];
  },
});

export const NomesPerALectors = Mark.create({
  name: 'sdpNomesLector',
  inclusive: false,

  parseHTML() {
    return [{ tag: 'span', getAttrs: (element) => (element.classList?.contains(CLASSE_NOMES_LECTOR) ? null : false) }];
  },

  renderHTML() {
    return ['span', { class: CLASSE_NOMES_LECTOR }, 0];
  },
});

/** Les peces, en l'ordre en què l'editor les ha de llegir. */
export const extensionsDeMaquetacio = () => [
  AccionsDeMaquetacio, ContenidorDeMaquetacio, ClasseDeParagraf, ClassesTipografiques, NomesPerALectors,
];
