import React from 'react';
import { useAppGrid } from '../../layout/AppGridShell';
import { useManager } from '../manager/ManagerContext';

export default function UniversalSettingsPanel() {
  const { applyPreset } = useAppGrid();
  const { setViewMode } = useManager();

  return (
    <div className="sdp-article-layout">
      <div className="page-title" >
        <h1 >Ajustos de la Graella</h1>
        <p className="lead" >
          Ací concentrarem les preferències de la Plantilla Enxufable. Pots provar ara mateix unes amplàries equilibrades o restaurar la mida original.
        </p>
        <div >
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => applyPreset('compacta')}>Compacta</button>
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => applyPreset('defecte')}>Per defecte</button>
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => applyPreset('ampla')}>Ampla</button>
        </div>
        <div>
          <button type="button" className="sdp-boto" onClick={() => setViewMode('editor')}>Tornar a la nota</button>
        </div>
      </div>
    </div>
  );
}
