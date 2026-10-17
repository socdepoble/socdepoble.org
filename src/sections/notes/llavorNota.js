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
 * Pur: sense React ni backend. NotesSection en reexporta LLAVOR_NOTA (el
 * DocumentEditor la hi llig: deute previ conservat).
 */
import { extractPlainText } from '../../utils/contentAdapter.js';

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
/* El text pla, amb els espais plegats: la reserva quan un sanejador o un
   endoll ha tocat algun atribut però no el contingut. */
const textPla = (html) => extractPlainText(html, Infinity).replace(/\s+/g, ' ').trim();

const FORMES = new Set(LLAVORS_NOTA.map(formaCompacta));
let textos = null;
const textosDeLlavor = () => {
  // Es calcula en la primera crida: extractPlainText necessita el DOM del navegador.
  if (!textos) textos = new Set(LLAVORS_NOTA.map(textPla));
  return textos;
};

/* Correcció de la revisió adversarial (261016) · La llista del Bloc ho
   pregunta per a CADA nota a cada tecla (NotesSection · toWorkspaceNote,
   dins del useMemo que depén de les notes), i la reserva de text pla passa
   per DOMPurify i DOMParser. Dues guardes tornen el camí calent a un cost
   de comparació de cadenes:
     · un cos més llarg que el doble de la llavor més llarga no pot ser cap
       llavor (amb un atribut afegit per un sanejador o un endoll creix uns
       quants caràcters, no el doble): no es saneja ni es parseja, encara que
       porte imatges data: de megabytes (seed i local);
     · la resposta de la reserva es recorda per cadena: les notes que no
       canvien no es tornen a parsejar. Memòria fitada: plena, es buida. */
export const MIDA_MAXIMA_LLAVOR = 2 * Math.max(...LLAVORS_NOTA.map((llavor) => llavor.length));
const MAXIM_RECORDATS = 512;
const recordats = new Map();
function esTextDeLlavor(html) {
  const sabut = recordats.get(html);
  if (sabut !== undefined) return sabut;
  const es = textosDeLlavor().has(textPla(html));
  if (recordats.size >= MAXIM_RECORDATS) recordats.clear();
  recordats.set(html, es);
  return es;
}

/**
 * Cert si `html` és una llavor verge (la d'ara o la d'abans), siga en la forma
 * en què es va escriure o en la que torna TipTap. Un cos amb qualsevol canvi
 * de text no ho és.
 */
export function esLlavorDeNota(html) {
  if (typeof html !== 'string' || html.length > MIDA_MAXIMA_LLAVOR || !html.trim()) return false;
  return FORMES.has(formaCompacta(html)) || esTextDeLlavor(html);
}
