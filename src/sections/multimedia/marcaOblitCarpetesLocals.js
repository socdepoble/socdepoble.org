/**
 * marcaOblitCarpetesLocals.js — Estat mínim compartit per a la marca d'oblit
 * pendent de les carpetes locals (QA-R2-04 · Onada R30.2).
 *
 * Viu en este mòdul lleuger sense dependències perquè `SessionContext.jsx`
 * puga registrar la marca persistent a l'arrencada i carregar la biblioteca
 * d'IndexedDB (`bibliotecaCarpetesLocals.js`) sota demanda amb `import()`.
 */

export const NOM_BD_ARXIUS_LOCALS = 'socdepoble_arxius_locals_v1';

const oblitsPendents = new Set();
let marcaPersistent = null;

function ambMarca(nom, accio) {
  if (nom !== NOM_BD_ARXIUS_LOCALS || !marcaPersistent) return undefined;
  try {
    return accio(marcaPersistent);
  } catch {
    return undefined;
  }
}

/**
 * Registra la marca persistent de l'oblit pendent (o la lleva amb null):
 * `{ llig: () => boolean, desa: () => void, esborra: () => void }`.
 */
export function configuraMarcaOblitCarpetesLocals(marca) {
  marcaPersistent = marca && typeof marca === 'object' ? marca : null;
}

export function esOblitCarpetaPendent(nom = NOM_BD_ARXIUS_LOCALS) {
  return oblitsPendents.has(nom) || ambMarca(nom, (marca) => marca.llig?.()) === true;
}

export function marcaOblitCarpetaPendent(nom, pendent) {
  if (pendent) {
    oblitsPendents.add(nom);
    ambMarca(nom, (marca) => marca.desa?.());
  } else {
    oblitsPendents.delete(nom);
    ambMarca(nom, (marca) => marca.esborra?.());
  }
}
