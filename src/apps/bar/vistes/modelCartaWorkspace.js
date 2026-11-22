import { declaraNivellInicialEspai } from '../../../components/universal/workspace/index.js';
import { imatgeDe, pictogramaFamiliaBar, valorDeProducte } from './vestits.js';

export const ID_CATALEG_BAR = 'bar-cataleg-p069';

/* Onada R32.38 · DOL-51 · En pantalla estreta (320px / 360px), entrar a /app/bar
   mostra directament la portada operativa amb els botons «Obri el TPV» i «Obri la caixa»
   visibles i actius sense quedar tapats pel calaix de la llista; el rail lateral
   permet obrir categories i productes amb un sol toc. */
declaraNivellInicialEspai(ID_CATALEG_BAR, null);

export function modelCartaWorkspace(carta, establiment) {
  const categories = (carta?.categories || []).map(categoria => ({ id: categoria.id, label: categoria.nom }));
  const noms = new Map(categories.map(categoria => [categoria.id, categoria.label]));
  /* v1.2.17 · Gauntlet R1 (L3-08) · El dibuix de la família, només ací: amb la icona pròpia de la categoria si en té. */
  const icones = new Map((carta?.categories || []).map(categoria => [categoria.id, categoria.icona]));
  return { status: 'ready', canAutoSelect: false, categories,
    items: (carta?.productes || []).map(producte => ({ id: producte.id, title: producte.nom,
      subtitle: noms.get(producte.categoriaId) || 'Carta',
      lead: `${valorDeProducte(producte)}${producte.exemple ? ' · Preu d’exemple' : ''}`,
      imageUrl: imatgeDe(producte, establiment),
      glyph: pictogramaFamiliaBar(producte.categoriaId, noms.get(producte.categoriaId), icones.get(producte.categoriaId)),
      categoryIds: [categoriaIdDe(producte)], dades: producte })) };
}

function categoriaIdDe(producte) {
  return producte.categoriaId;
}
