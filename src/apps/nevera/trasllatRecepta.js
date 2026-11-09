import { LIMITS, afigPerNom, articlePerNom, clauDeNom, llistaPerId, netejaText } from './nucli/index.js';

/** Lot atòmic sobre les mateixes operacions de «Necessite…». Cap correspondència aproximada. */
export function afigIngredientsRecepta(estat, llistaId, linies) {
  const llista = llistaPerId(estat, llistaId);
  if (!llista) throw new TypeError('La llista de compra no existix.');
  if (!Array.isArray(linies) || !linies.length || linies.length > 100) throw new TypeError('Revisa els ingredients de la recepta.');
  const vistes = new Set();
  const netes = linies.map(({ nom, especificacio }) => {
    const nomNet = netejaText(nom, Infinity); const nota = netejaText(especificacio, Infinity);
    if (!nomNet || [...nomNet].length > LIMITS.nom || !nota || [...nota].length > LIMITS.especificacio) {
      throw new TypeError(`Cada ingredient necessita un nom de fins a ${LIMITS.nom} caràcters i una quantitat o indicació de fins a ${LIMITS.especificacio}.`);
    }
    const clau = clauDeNom(nomNet);
    if (vistes.has(clau)) throw new TypeError('Hi ha ingredients amb el mateix nom: combina’n les quantitats abans d’afegir-los.');
    vistes.add(clau);
    return { nom: nomNet, especificacio: nota };
  });
  let nou = estat;
  for (const linia of netes) {
    const existent = articlePerNom(nou, linia.nom);
    if (existent && llistaPerId(nou, llistaId).linies.some((l) => l.articleId === existent.id)) continue;
    const candidat = afigPerNom(nou, llistaId, linia.nom, { especificacio: linia.especificacio });
    const article = articlePerNom(candidat, linia.nom);
    if (!article || !llistaPerId(candidat, llistaId).linies.some((l) => l.articleId === article.id)) {
      throw new TypeError('No hi ha espai per a tots els ingredients. No se n’ha afegit cap; revisa els límits de la llista i dels articles propis.');
    }
    nou = candidat;
  }
  return nou;
}
