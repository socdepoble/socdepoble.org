import { useState } from 'react';
import { Apple, Croissant, Milk, SprayCan } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import {
  OrdenaCategories, SeccionsCategoria, SelectorCategoria, mouCategoria
} from '../../../../components/PedraSeca/index.js';

/* Esquelet comú T4/T8 · les categories: seccions plegables, el filtre i
   l'ordre de la persona. Dades sintètiques. */
const INICIALS = [
  { id: 'fruita', nom: 'Fruita i verdura', icona: Apple, ordre: 0, visible: true },
  { id: 'forn', nom: 'Forn', icona: Croissant, ordre: 1, visible: true },
  { id: 'lactics', nom: 'Llet i formatge', icona: Milk, ordre: 2, visible: true },
  { id: 'neteja', nom: 'Neteja', icona: SprayCan, ordre: 3, visible: false }
];
const ARTICLES = [
  { id: 'pomes', nom: 'Pomes', categoriaId: 'fruita' },
  { id: 'tomaques', nom: 'Tomaques', categoriaId: 'fruita' },
  { id: 'pa', nom: 'Pa de llenya', categoriaId: 'forn' },
  { id: 'llet', nom: 'Llet', categoriaId: 'lactics' },
  { id: 'sabo', nom: 'Sabó de roba', categoriaId: 'neteja' }
];

export default function EspecimenSeccionsCategoria() {
  const [categories, setCategories] = useState(INICIALS);
  const [plegades, setPlegades] = useState(['forn']);
  const [filtre, setFiltre] = useState(null);
  const visibles = filtre ? ARTICLES.filter((a) => a.categoriaId === filtre) : ARTICLES;
  return (
    <Especimen id="seccions-categoria" nom="SeccionsCategoria · SelectorCategoria · OrdenaCategories" fitxer="src/components/PedraSeca/organismes/SeccionsCategoria.jsx"
      descripcio="Les categories d’un catàleg: seccions plegables en l’ordre de la persona, un selector per a filtrar (pastilles o desplegable) i la pantalla d’ordenar amb botons amunt i avall, sense arrossegar, i l’ull per a mostrar o amagar. Serveix igual per a la carta del bar i per als passadissos de la compra."
      contracte={[
        ['SeccionsCategoria', '{ categories, articles, children(articles, categoria), plegades?, onPlega?, nivell? }', 'nivell 3', 'Un títol h3-h6 per secció; amb onPlega, el títol és un botó aria-expanded.'],
        ['SelectorCategoria', "{ categories, valor, onCanvi(id | null), forma: 'pastilles' | 'desplegable', etiqueta, textTotes }", "'pastilles'", '«Totes» és null. Només les visibles.'],
        ['OrdenaCategories', '{ categories, onMou(id, -1 | 1), onVisibilitat(id, visible) }', '—', 'mouCategoria(categories, id, direccio) en fa la llista nova amb ordre renumerat.']
      ]}
      a11y={['Ordenar és amb botons («Puja Forn», «Baixa Forn»): cap gest d’arrossegar obligatori.', 'Moure una fila no perd el focus i un avís diu la posició nova.', 'Mostrar i amagar és un interruptor (aria-pressed); amagada es diu amb text.']}
      fes={['Desar l’ordre i la visibilitat a l’app: l’esquelet només les pinta.']}
      noFacis={['Donar un color a cada categoria: la icona i el nom la distingixen.']}>
      <h4>Filtre (pastilles i desplegable)</h4>
      <SelectorCategoria categories={categories} valor={filtre} onCanvi={setFiltre} />
      <SelectorCategoria categories={categories} valor={filtre} onCanvi={setFiltre} forma="desplegable" etiqueta="Passadís" />
      <h4>Seccions plegables</h4>
      <SeccionsCategoria categories={categories} articles={visibles} plegades={plegades}
        onPlega={(id, plegada) => setPlegades((actuals) => (plegada ? [...actuals, id] : actuals.filter((x) => x !== id)))}>
        {(articles) => <ul>{articles.map((a) => <li key={a.id}>{a.nom}</li>)}</ul>}
      </SeccionsCategoria>
      <h4>Ordenar i mostrar</h4>
      <OrdenaCategories categories={categories}
        onMou={(id, direccio) => setCategories((actuals) => mouCategoria(actuals, id, direccio))}
        onVisibilitat={(id, visible) => setCategories((actuals) => actuals.map((c) => (c.id === id ? { ...c, visible } : c)))} />
    </Especimen>
  );
}
