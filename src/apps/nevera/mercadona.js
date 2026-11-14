/** Adaptador pur de la llista de botiga de poble (compatible amb llistes antigues desades). */
const NOMS_LLISTA_BOTIGA = new Set(['botiga de poble', 'catàleg de botiga', 'mercadona']);
export const esLlistaMercadona = (llista) => typeof llista?.nom === 'string'
  && NOMS_LLISTA_BOTIGA.has(llista.nom.trim().toLocaleLowerCase('ca'));

export const nomLlistaVisible = (nom) => (
  typeof nom === 'string' && nom.trim().toLocaleLowerCase('ca') === 'mercadona'
    ? 'Botiga de poble'
    : nom
);

export function ambPreusMercadona(articles, productes) {
  const perId = new Map((productes || []).map((p) => [p.id, p]));
  return articles.map((article) => {
    const producte = perId.get(article.id);
    if (!producte) return article;
    return {
      ...article,
      valor: `${producte.preuEnvas.toFixed(2).replace('.', ',')} € · ${producte.preuUnitari.toFixed(2).replace('.', ',')} €/${producte.unitatPreuUnitari}`
    };
  });
}
