/**
 * marcaOblitCarpetesLocals.js — Estat mínim compartit per a la marca d'oblit
 * pendent de les carpetes locals (QA-R2-04 · Onada R30.2).
 *
 * Viu en este mòdul lleuger sense dependències perquè `SessionContext.jsx`
 * puga registrar la marca persistent a l'arrencada i carregar la biblioteca
 * d'IndexedDB (`bibliotecaCarpetesLocals.js`) sota demanda amb `import()`.
 *
 * Onada R32.2 (fusió del lot_05 i del lot_02 de Codex R32) · La biblioteca
 * llig i escriu ESTA mateixa marca: la importa d'ací. Per això no cal cap port
 * que el Gestor injecte abans de llegir handles, ni n'hi ha cap segona còpia:
 * des que este mòdul s'avalua, la marca que registra SessionContext és la que
 * consulta qualsevol lectura de la biblioteca.
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

/**
 * Onada R32.2 (Codex R32, lot_05 i lot_02) · El carregador de l'oblit de les
 * carpetes locals. `carrega` és l'`import()` diferit de la biblioteca: el posa
 * qui crida, perquè este mòdul no importa res.
 *   · `carrega()`: la precàrrega. No marca res (el Gestor de qui és dins no
 *     queda bloquejat). Una càrrega fallida s'oblida i la següent ho torna a
 *     provar.
 *   · `oblidaTotesLesCarpetesLocals()`: posa la marca d'oblit pendent ABANS de
 *     cap espera (si la pestanya es tanca o el tros no arriba, la marca
 *     persistent ja hi és), carrega la biblioteca i oblida. Rebutja si el tros
 *     no arriba, amb la marca posada; si no, torna tal qual el que torna la
 *     biblioteca. Només un `{ ok: true }` lleva la marca: la biblioteca ja ho
 *     fa quan buida la base, i el navegador sense IndexedDB no tenia res a
 *     oblidar (la biblioteca no toca la marca i, sense esta línia, quedaria
 *     posada per sempre i canviaria el missatge del Gestor).
 */
export function creaCarregadorOblitCarpetesLocals(carrega) {
  if (typeof carrega !== 'function') throw new TypeError('Falta el carregador de la biblioteca de carpetes.');
  let carregant = null;
  const carregaBiblioteca = () => {
    carregant ??= Promise.resolve().then(carrega).catch((error) => {
      carregant = null;
      throw error;
    });
    return carregant;
  };
  const oblida = () => {
    marcaOblitCarpetaPendent(NOM_BD_ARXIUS_LOCALS, true);
    return carregaBiblioteca()
      .then((modul) => modul.oblidaTotesLesCarpetesLocals())
      .then((resultat) => {
        if (resultat?.ok === true) marcaOblitCarpetaPendent(NOM_BD_ARXIUS_LOCALS, false);
        return resultat;
      });
  };
  return Object.freeze({ carrega: carregaBiblioteca, oblidaTotesLesCarpetesLocals: oblida });
}
