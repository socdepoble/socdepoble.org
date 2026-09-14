import React from 'react';
import AppGridColumn from '../../layout/AppGridColumn';
import { useAppGrid } from '../../layout/AppGridShell';
import { useManager } from './ManagerContext';
import { Inbox, Settings } from 'lucide-react';


export default function ManagerFacets() {
  const { 
    facets, 
    activeFacets, 
    setFacet, 
    clearFacet,
    colLeftCollapsed, 
    setColLeftCollapsed,
    facetsTitle
  } = useManager();
  
  const { mida, setPanellObert } = useAppGrid();
  const isCompact = mida !== 'ample';
  const [expandedFacets, setExpandedFacets] = React.useState({});

  const toggleFacet = (facetId) => {
    setExpandedFacets(prev => ({ ...prev, [facetId]: prev[facetId] === false ? true : false }));
  };

  const handleSelectFacet = (facetId, valueId) => {
    setFacet(facetId, valueId);
    if (isCompact) setPanellObert('middle');
  };

  const renderTreeNodes = (facetId, nodes) => {
    if (!nodes || !Array.isArray(nodes)) return null;

    return nodes.map((node) => {
      const Icon = node.icon;
      const isActive = activeFacets[facetId] === node.id;

      return (
        <React.Fragment key={node.id}>
          <button
            type="button"
            onClick={() => handleSelectFacet(facetId, node.id)}
            className={`univ-manager-facet-item ${isActive ? 'univ-manager-facet-item--active' : ''}`}
          >
            {Icon && <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />}
            <span>{node.label || node.name}</span>
          </button>
          {node.children && node.children.length > 0 && (
            <div className="univ-manager-facet-tree-branch">
              {renderTreeNodes(facetId, node.children)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  if (colLeftCollapsed && !isCompact) {
    return (
      <aside className="notes-column collapsed">
        <AppGridColumn
          variant="collapsed"
          titol={facetsTitle || 'CARPETES'}
          onReplega={() => setColLeftCollapsed(false)}
          accions={[{
            id: 'settings',
            icona: Settings,
            etiqueta: 'Ajustos (pròximament)',
            desactivat: true,
          }]}
        />
      </aside>
    );
  }

  return (
    <aside className="notes-column">
      <AppGridColumn
        titol={facetsTitle || 'CARPETES'}
        onReplega={() => setColLeftCollapsed(true)}
      />

      <div className="notes-list-header univ-manager-toolbar univ-manager-toolbar--facets">
        <button
          type="button"
          className="univ-manager-inbox"
          onClick={() => {
            facets.forEach(f => clearFacet(f.id));
            if (isCompact) setPanellObert('middle');
          }}
        >
          <Inbox size={18} aria-hidden="true" />
          <span>Tot</span>
        </button>
        <button type="button" className="app-grid-col-header__accio-icon" title="Ajustos (pròximament)" aria-label="Ajustos (pròximament)" disabled>
          <Settings size={18} />
        </button>
      </div>

      <div className="notes-column__body notes-column__body--sense-marge sdp-scrollable">
        {facets.map(facet => (
          <div key={facet.id}>
            {!facet.hideHeader && (
              <AppGridColumn
                variant="accordion"
                titol={facet.label || facet.id}
                plegable={true}
                obert={expandedFacets[facet.id] !== false}
                onPlega={() => toggleFacet(facet.id)}
              />
            )}
            {expandedFacets[facet.id] !== false && (
              <div className="notes-column__body">

            {facet.type === 'tree' ? (
               renderTreeNodes(facet.id, facet.options || [])
            ) : (
               (facet.options || []).map(opt => (
                 <button
                   key={opt.id}
                   type="button"
                   onClick={() => handleSelectFacet(facet.id, opt.id)}
                   className={`univ-manager-facet-item ${activeFacets[facet.id] === opt.id ? 'univ-manager-facet-item--active' : ''}`}
                 >
                   {opt.icon && <opt.icon size={18} strokeWidth={activeFacets[facet.id] === opt.id ? 2.5 : 2} />}
                   <span>{opt.label || opt.name}</span>
                 </button>
               ))
            )}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
