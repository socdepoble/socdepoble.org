/**
 * xifresComu.js — les peces compartides de les targetes amb pàgina pròpia de
 * la Consola (xifresMas.js, xifresVistes.js i pecesMapa.js), sense React.
 *
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · «Per a tindre pàgina
 * pròpia has de ser una targeta (i viceversa).» Cada xifra i cada peça del
 * Mapa que la Consola pinta és una UniversalCard sencera que porta a la seua
 * pàgina, /consola/xifres/<slug>. Ací viuen la ruta, el format de les cel·les
 * del detall i les etiquetes d'estat, perquè les tres famílies diguen el
 * mateix de la mateixa manera.
 */
import { RUTA_CONSOLA } from './consolaPagines.js';
import { ambMajuscula, compteOMesura, concorda, de, plural, senseMesura } from './concordanca.js';
import { valorMetrica } from './mapa/mapaContent.js';

export { ambMajuscula, compteOMesura, concorda, de, plural, senseMesura };

export const RUTA_XIFRES = `${RUTA_CONSOLA}/xifres`;
/** La ruta compartible de la pàgina d'una xifra o d'una peça. */
export const rutaXifra = (slug) => `${RUTA_XIFRES}/${slug}`;

/** El compilador del Mapa: d'ací ix tota xifra del Mapa. */
export const GENERADOR_MAPA = 'tooling/brain/mapa-consola.mjs';
/** El middleware que servix consola.json: d'ací ixen les xifres del pols. */
export const GENERADOR_CONSOLA = 'tooling/vite/consola-iaia.mjs';
export const FONT_MAPA = 'GET /__iaia/mapa.json';
export const FONT_CONSOLA = 'GET /__iaia/consola.json';

/**
 * Un slug estable a partir d'un text (un id del Mapa, el nom d'una tasca):
 * minúscules, sense accents, i cada tram que no és lletra ni xifra, un guió.
 * 'document:.agents/LEDGER.md' → 'document-agents-ledger-md'.
 */
export function normalitzaSlug(text) {
  return String(text ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ── L'entradeta ──────────────────────────────────────────────────────────
   S'escriu en frases (què compta, d'on ix, per què importa) i els noms de
   fitxer van entre accents greus: la targeta i la pàgina els pinten en
   <Mono>, que el mode privacitat amaga. El text pla (sense marques) és el
   de la descripció SEO. */

/** L'entradeta sense les marques dels noms de fitxer. */
export const entradetaPlana = (marcada) => String(marcada ?? '').replace(/`/g, '');

/** Els trossos de l'entradeta: { text } o { mono } (un nom de fitxer). */
export function trossosEntradeta(marcada) {
  return String(marcada ?? '').split('`').map((tros, i) => (i % 2 ? { mono: tros } : { text: tros }))
    .filter((t) => (t.text ?? t.mono) !== '');
}

/* ── Les cel·les del detall ───────────────────────────────────────────────
   Sense React: { text }, { mono } (ruta, ordre o empremta: el mode
   privacitat l'amaga), { node } (una skill pel seu nom; qualsevol altra
   peça, la ruta), { codi } (el codi amb la seua frase), { severitat },
   { estat } i { confianca } (insígnies) i { avis } (totes les evidències). */
export const text = (valor) => ({ text: String(valor) });
export const mono = (valor) => (valor ? { mono: String(valor) } : text('—'));
export const siNo = (valor) => text(valor === true ? 'sí' : valor === false ? 'no' : '—');

/** Una mètrica del Mapa en quatre cel·les: nom, valor (o N/A), font i prova. */
export const filaMetrica = (m) => ({
  clau: m.metrica,
  celes: [text(m.metrica), m.valor === 'N/A' ? { estat: 'N/A' } : text(valorMetrica(m)), mono(m.font), mono(m.prova)]
});
export const COLUMNES_METRICA = Object.freeze(['Mètrica', 'Valor', 'Font', 'Prova']);

/** Una fila per avís: la peça, el codi amb la seua frase, la severitat i les evidències. */
export const filesAvisos = (avisos) => avisos.map((a, i) => ({
  clau: `${a.node}|${a.codi}|${i}`,
  celes: [{ node: a.node }, { codi: a.codi }, { severitat: a.severitat }, { avis: a }]
}));
export const COLUMNES_AVIS = Object.freeze(['Peça', 'Avís', 'Severitat', 'Evidència']);

/** Una taula de dades d'una peça: una fila per dada, amb la seua cel·la. */
export const taulaDades = (titol, files) => ({
  titol,
  columnes: ['Dada', 'Valor'],
  files: files.map(([etiqueta, cela]) => ({ clau: etiqueta, celes: [text(etiqueta), cela] })),
  buit: 'El Mapa no en guarda cap dada.'
});

/** Els avisos d'una peça del Mapa, en taula; cap, ho diu. */
export const taulaAvisosDe = (mapa, id) => ({
  titol: 'Avisos de la peça',
  columnes: COLUMNES_AVIS,
  files: filesAvisos(mapa.avisos.filter((a) => a.node === id)),
  buit: 'El Mapa no en fa cap avís.'
});

export const perId = (x, y) => x.id.localeCompare(y.id);
export const mesura = (mapa, nom) => mapa.salut.find((m) => m.metrica === nom) ?? null;
export const mesurada = (m) => Boolean(m) && m.valor !== 'N/A';
export const ambCodi = (mapa, ...codis) => mapa.avisos.filter((a) => codis.includes(a.codi));
/* senseMesura i compteOMesura viuen a concordanca.js (també els fa servir el
   resum del tauler, consolaPagines.js) i es reexporten ací. */
/** El darrer tram d'un camí: el nom del fitxer. */
export const darrer = (cami) => String(cami).split('/').filter(Boolean).pop() || String(cami);

/* Etiquetes d'estat de les targetes, amb les classes del Panell de Control:
   el que funciona, en `sdp-badge-system` (ACTIU); la resta, en `sdp-badge-tag`. */
export const etiquetaBona = (text) => [{ text, className: 'sdp-badge-system' }];
export const etiquetaPendent = (text) => [{ text, className: 'sdp-badge-tag' }];
