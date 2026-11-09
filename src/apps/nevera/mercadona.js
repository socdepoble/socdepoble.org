/** Adaptador pur de la llista de botiga. No canvia les dades de casa. */
export const esLlistaMercadona = (llista) => typeof llista?.nom === 'string' && llista.nom.trim().toLocaleLowerCase('ca') === 'mercadona';

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
