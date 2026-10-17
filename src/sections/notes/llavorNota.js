/**
 * llavorNota.js — La plantilla de format que porta el cos d'una nota nova.
 *
 * Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5; ordre del Mestre: «Injectar en
 * notes buides un template d'exemple canònic (H3, H4, paràgrafs, llistes amb
 * vinyetes) que s'esvaeix al primer clic o pulsació de tecla») · La llavor
 * porta un H3 i un H4, cadascun amb el seu paràgraf, una llista de pics, una
 * de numerada i el text que diu que s'esborra en punxar. Fora l'H5 i l'H6
 * d'abans. S'escriu en la forma que TipTap serialitza (els elements de llista
 * porten el seu paràgraf), perquè el cos que torna l'editor siga la mateixa
 * llavor amb els salts de línia llevats.
 *
 * La llavor d'abans (LLAVOR_NOTA_ANTIGA) continua reconeguda: hi ha notes
 * creades des de «Tot» que la porten desada, i s'han d'esborrar igual al
 * primer clic. Cap de les dues no es publica mai (NotesContext · publishNote)
 * ni crea la nota preparada (notaPreparada.js · teContingut).
 *
 * Pur: sense React ni backend. Qui la vol la importa d'ací: NotesSection
 * (entradaDeNotaNova), NotesEditor (LLAVORS_NOTA) i les proves. Revisió del
 * Gauntlet 261017 (R6) · NotesSection ja no en reexporta LLAVOR_NOTA.
 * Gauntlet 261017 (C06, auditoria Codex) · El DocumentEditor ja no la hi
 * llig: el Bloc la passa per `seedContent` (NotesEditor · LLAVORS_NOTA).
 */

export const LLAVOR_NOTA = `
<h3>Títol de secció (H3)</h3>
<p>Esta és la plantilla de format de Sóc de Poble: punxa en qualsevol lloc del text i s’esborrarà tota sola, perquè hi escrigues la teua nota.</p>
<h4>Subtítol de secció (H4)</h4>
<p>Un paràgraf de prova davall d’un subtítol H4.</p>
<ul><li><p>Una llista amb pics</p></li><li><p>Un altre punt de la llista</p></li></ul>
<ol><li><p>Una llista numerada</p></li><li><p>El segon pas de la llista</p></li></ol>
`.trim();

/** La llavor d'abans del Bloc 3.9 (H3 a H6), tal com es desava. */
export const LLAVOR_NOTA_ANTIGA = `
<h3>Heading 3 (punxa ací per esborrar-ho tot)</h3>
<p>Aquest és un paràgraf de prova sota un Heading 3.</p>
<h4>Heading 4</h4>
<p>Aquest és un paràgraf de prova sota un Heading 4.</p>
<h5>Heading 5</h5>
<p>Aquest és un paràgraf de prova sota un Heading 5.</p>
<h6>Heading 6</h6>
<p>Aquest és un paràgraf de prova sota un Heading 6.</p>
`.trim();

/** Les llavors que el Bloc reconeix, la d'ara primer. */
export const LLAVORS_NOTA = Object.freeze([LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA]);

/* La forma normalitzada d'un HTML: sense els espais i salts entre etiquetes,
   que TipTap no conserva en serialitzar (getHTML), ni els paràgrafs buits del
   final, que l'editor hi afig després d'una llista (TrailingNode). */
export const formaCompacta = (html) => html.replace(/>\s+</g, '><').trim().replace(/(?:<p><\/p>)+$/, '');

/* Gauntlet 261017 (C02, auditoria Codex: «una coincidència de text no és
   autorització per buidar contingut») · La reserva compara l'ESTRUCTURA, amb
   el mateix contracte que l'editor (useUniversalRichText · esLlavorVerge):
   cada element amb la seua etiqueta (el nivell d'un títol és l'etiqueta) i
   els seus atributs, i cada text tal qual. Abans comparava només el text pla:
   la plantilla amb un enllaç, una fotografia, una negreta o un H3 passat a
   paràgraf o a H2 era «verge», i publishNote en publicava el cos buit. Només
   es toleren les normalitzacions conegudes: els espais entre etiquetes, els
   atributs editorials que hi posa un sanejador o un endoll (class, dir, id,
   data-*) i els paràgrafs buits del final (TrailingNode). Un `style`, no:
   l'editor en llig marques (font-weight és una negreta). Els comentaris no
   són contingut. El document de DOMParser és inert: no s'hi executa ni s'hi
   carrega res. */
const ATRIBUT_EDITORIAL = /^(?:class|dir|id|data-.*)$/;
const perNom = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);
function firmaDelNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return /\S/.test(node.data) ? node.data : null;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const atributs = Array.from(node.attributes, ({ name, value }) => [name, value])
    .filter(([nom]) => !ATRIBUT_EDITORIAL.test(nom))
    .sort(perNom);
  return [node.localName, atributs, firmaDelsFills(node)];
}
function firmaDelsFills(node) {
  return Array.from(node.childNodes, firmaDelNode).filter((firma) => firma !== null);
}
const esParagrafBuit = (firma) => Array.isArray(firma) && firma[0] === 'p' && !firma[1].length && !firma[2].length;
function firmaDeLHtml(html) {
  if (typeof DOMParser === 'undefined') return null;
  const blocs = firmaDelsFills(new DOMParser().parseFromString(html, 'text/html').body);
  while (blocs.length && esParagrafBuit(blocs[blocs.length - 1])) blocs.pop();
  return JSON.stringify(blocs);
}

const FORMES = new Set(LLAVORS_NOTA.map(formaCompacta));
let firmes = null;
const firmesDeLlavor = () => {
  // Es calcula en la primera crida: DOMParser és del navegador.
  if (!firmes) firmes = new Set(LLAVORS_NOTA.map(firmaDeLHtml));
  return firmes;
};

/* Correcció de la revisió adversarial (261016) · La llista del Bloc ho
   pregunta per a CADA nota a cada tecla (NotesSection · toWorkspaceNote,
   dins del useMemo que depén de les notes), i la reserva estructural passa
   per DOMParser. Dues guardes tornen el camí calent a un cost de comparació
   de cadenes:
     · un cos més llarg que el doble de la llavor més llarga no pot ser cap
       llavor (amb un atribut afegit per un sanejador o un endoll creix uns
       quants caràcters, no el doble): no es parseja, encara que porte
       imatges data: de megabytes (seed i local);
     · la resposta de la reserva es recorda per cadena: les notes que no
       canvien no es tornen a parsejar. Memòria fitada: plena, es buida. */
export const MIDA_MAXIMA_LLAVOR = 2 * Math.max(...LLAVORS_NOTA.map((llavor) => llavor.length));
const MAXIM_RECORDATS = 512;
const recordats = new Map();
function teEstructuraDeLlavor(html) {
  const sabut = recordats.get(html);
  if (sabut !== undefined) return sabut;
  const firma = firmaDeLHtml(html);
  const es = firma !== null && firmesDeLlavor().has(firma);
  if (recordats.size >= MAXIM_RECORDATS) recordats.clear();
  recordats.set(html, es);
  return es;
}

/**
 * Cert si `html` és una llavor verge (la d'ara o la d'abans), siga en la forma
 * en què es va escriure, en la que torna TipTap o amb els atributs editorials
 * que hi afig un sanejador. Un cos amb qualsevol canvi de text, d'etiqueta,
 * d'atribut (un enllaç, una imatge, l'inici d'una llista) o de marques no ho
 * és: es publica i es conserva tal qual.
 */
export function esLlavorDeNota(html) {
  if (typeof html !== 'string' || html.length > MIDA_MAXIMA_LLAVOR || !html.trim()) return false;
  return FORMES.has(formaCompacta(html)) || teEstructuraDeLlavor(html);
}
