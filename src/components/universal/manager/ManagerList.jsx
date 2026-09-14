import React, { useState, useEffect } from 'react';
import AppGridColumn from '../../layout/AppGridColumn';
import { useAppGrid } from '../../layout/AppGridShell';
import { useManager } from './ManagerContext';
import ManagerItemCard from './ManagerItemCard';
import { Search, Plus } from 'lucide-react';


/**
 * La llista del gestor. És l'ÚNICA que pinta fitxes: els consumidors només
 * projecten dades amb `getItemCard(item) → { titol, subtitol, imatge, icona }`.
 *
 * P0 · 260911: la identitat de cada fila és `getItemId(item)`, la mateixa que
 * usa el context. Abans era `item.id`: al Perfil els id d'ajust es repetixen
 * entre identitats, les claus xocaven i clicar qualsevol ajust obria el primer.
 */
export default function ManagerList({ getItemCard, onActionCreate, createLabel = 'CREAR', listTitle = 'LLISTA', listIcon = null }) {
  const {
    filteredItems,
    activeItemId,
    setActiveItemId,
    getItemId,
    searchQuery: ctxSearchQuery,
    setSearchQuery: setCtxSearchQuery,
    colMiddleCollapsed,
    setColMiddleCollapsed
  } = useManager();

  const { mida, setPanellObert } = useAppGrid();
  const isCompact = mida !== 'ample';
  const [localQuery, setLocalQuery] = useState(ctxSearchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ctxSearchQuery !== localQuery) {
        setCtxSearchQuery(localQuery);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [localQuery, ctxSearchQuery, setCtxSearchQuery]);

  const handleSelect = (id) => {
    setActiveItemId(id);
    if (isCompact) setPanellObert(null);
  };

  if (colMiddleCollapsed && !isCompact) {
    return (
      <aside className="notes-column collapsed">
        <AppGridColumn
          variant="collapsed"
          titol={listTitle}
          icona={Search}
          onReplega={() => setColMiddleCollapsed(false)}
        />
      </aside>
    );
  }

  return (
    <aside className="notes-column">
      <AppGridColumn
        titol={listTitle}
        icona={listIcon}
        plegable={!isCompact}
        onReplega={() => setColMiddleCollapsed(true)}
      />

      <div className="notes-list-header univ-manager-toolbar univ-manager-toolbar--list">
        <div className="search-bar univ-manager-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            placeholder="Cerca..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            aria-label="Cercar elements"
          />
        </div>
        {onActionCreate && (
          <button
            className="btn btn-primary"
            onClick={onActionCreate}
            title={createLabel}
          >
            <Plus size={16} />
            <span className="d-desktop-only">{createLabel}</span>
          </button>
        )}
      </div>

      <div className="notes-column__body notes-column__body--sense-marge sdp-scrollable">
        <ul className="sdp-gestor-llista">
          {filteredItems.map((item) => {
            const id = getItemId(item);
            const fitxa = getItemCard
              ? getItemCard(item)
              : { titol: item.name || item.title || String(id) };
            return (
              <li key={id}>
                <ManagerItemCard
                  {...fitxa}
                  actiu={id === activeItemId}
                  onSelecciona={() => handleSelect(id)}
                />
              </li>
            );
          })}
          {filteredItems.length === 0 && (
            <li className="sdp-gestor-buit">Cap element trobat.</li>
          )}
        </ul>
      </div>


    </aside>
  );
}
