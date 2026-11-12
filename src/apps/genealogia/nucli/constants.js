/**
 * constants.js — Arbre Genealògic · els vocabularis tancats del model.
 *
 * Només claus i valors: cap frase en llengua natural (la interfície ho
 * traduïx a textos.js). Les etiquetes d'estat són canòniques i iguals en les
 * cinc llengües, com al kit R111 (IDEA-100).
 */

export const IDIOMES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

/* Els 4 estats epistemològics d'IDEA-100. */
export const ESTATS = Object.freeze(['confirmat', 'aproximat', 'falta-confirmar', 'contradiccio']);
export const ETIQUETES_ESTAT = Object.freeze({
  confirmat: '[CONFIRMAT]',
  aproximat: '[APROXIMAT]',
  'falta-confirmar': '[FALTA CONFIRMAR]',
  contradiccio: '[CONTRADICCIÓ]'
});

/* Les 4 precisions de data (FamyTree): 1908 · ~1908 · 1908? · desconeguda. */
export const PRECISIONS = Object.freeze(['exacta', 'aproximada', 'estimada', 'desconeguda']);
/* Anys de marge a cada costat de l'any declarat. */
export const MARGE_PRECISIO = Object.freeze({ exacta: 0, aproximada: 5, estimada: 10 });

export const SEXES = Object.freeze(['M', 'F', 'U']);
export const VIVA = Object.freeze(['si', 'no', 'desconegut']);
export const GENERACIONS = Object.freeze(['G1', 'G2', 'G3', 'G4']);

/* Els germans es deriven dels progenitors compartits; un germà sense
   progenitors coneguts va amb una relació 'germa'. */
export const TIPUS_RELACIO = Object.freeze(['progenitor', 'parella', 'padri', 'testimoni', 'vei']);
export const TIPUS_RELACIO_TOTS = Object.freeze([...TIPUS_RELACIO, 'germa']);
/* Les branques col·laterals del FAN Club (Friends, Associates, Neighbours). */
export const ROLS_FAN = Object.freeze(['germa', 'padri', 'testimoni', 'vei']);

export const TIPUS_FONT = Object.freeze(['oral', 'parroquial', 'registre-civil', 'padro', 'notarial', 'premsa', 'militar', 'altra']);

/* Llindars del validador cronològic (kit R111) i de la protecció de vius. */
export const EDAT_MINIMA_PROGENITOR = 13;
export const EDAT_MAXIMA_PROGENITOR = 85;
export const EDAT_MAXIMA_MARE = 55;
export const EDAT_MAXIMA_VIDA = 120;
export const ANYS_PROTECCIO_VIUS = 100;

/* Primer any que admet una data (els Quinque Libri comencen al segle XVI). */
export const ANY_MINIM = 1000;
