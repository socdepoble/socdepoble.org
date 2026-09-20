import { useState } from 'react';
import { Search } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Camp, CampText, Selector, Boto, UniversalSearch } from '../../../../components/PedraSeca/index.js';

const RESULTATS = [
  ['Festa Major de Benigànim', 'Festes • Benigànim • Agost 2024', 'Del 15 al 20 d’agost celebrem les festes patronals amb més de 50 activitats per a tots els públics…'],
  ['Festa Major de Llutxent', 'Festes • Llutxent • Setembre 2024', 'La festa major de Llutxent destaca per la seua processó de les festes de la Mare de Déu…']
];

export default function EspecimenCercaFiltres() {
  const [cerca, setCerca] = useState('festa major');
  return (
    <Especimen id="cerca-filtres" nom="Cerca i filtratge" fitxer="src/components/PedraSeca/organismes/UniversalSearch.jsx · src/css/modules.css (.search-result)"
      descripcio="Patrons de cerca: la barra bàsica del gestor (UniversalSearch), la cerca amb filtres dins d'un formulari (Camp + CampText tipus search + Selector) i la llista de resultats amb títol, meta i extracte."
      a11y={['Tot camp de cerca amb etiqueta (visible o aria-label concret).', 'El recompte de resultats s’anuncia en text: «S’han trobat 12 resultats».']}
      fes={['Al gestor universal, la lupa obri la cerca i les píndoles d’etiquetes només es mostren mentre la cerca està oberta.']}
      noFacis={['Un tercer cercador.', 'Filtres invisibles actius: tancar la cerca els neteja.']}>
      <h4>Barra de cerca del gestor</h4>
      <UniversalSearch value={cerca} onChange={(e) => setCerca(e.target.value)} ariaLabel="Cerca al catàleg" />

      <h4>Cerca amb filtres</h4>
      <form className="search-filters" onSubmit={(e) => e.preventDefault()} aria-label="Cerca amb filtres (exemple)">
        <Camp etiqueta="Què busques?"><CampText tipus="search" placeholder="Cerca pobles, festes, documents…" /></Camp>
        <Camp etiqueta="Categoria"><Selector opcions={[{ valor: '', etiqueta: 'Totes les categories' }, { valor: 'festes', etiqueta: 'Festes' }, { valor: 'llocs', etiqueta: 'Llocs' }]} /></Camp>
        <Boto tipus="submit" varietat="primari" icona={Search}>Cerca</Boto>
      </form>

      <h4>Resultats de cerca</h4>
      <p role="status">S’han trobat <strong>12 resultats</strong> per a «{cerca}»</p>
      {RESULTATS.map(([titol, meta, extracte]) => (
        <div className="search-result" key={titol}>
          <div className="search-result-title">{titol}</div>
          <div className="search-result-meta">{meta}</div>
          <div className="search-result-excerpt">{extracte}</div>
        </div>
      ))}

      <h4>Paginació simplificada (anterior / següent)</h4>
      <div className="pagination-simple">
        <a href="#anterior" onClick={(e) => e.preventDefault()}>
          <span className="pagination-label">← Article anterior</span>
          <span className="pagination-title">Les festes de la Magdalena</span>
        </a>
        <a className="next" href="#seguent" onClick={(e) => e.preventDefault()}>
          <span className="pagination-label">Article següent →</span>
          <span className="pagination-title">La ruta del riu-rau</span>
        </a>
      </div>
    </Especimen>
  );
}
