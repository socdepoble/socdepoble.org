import React, { useEffect, useState } from 'react';
import { useAppData } from '../../app/AppDataContext';
import { UniversalPage } from '../../components/universal/UniversalComponents';
import { AGENTS } from '../profile/agentsSeed';
import { resolveAsset } from '../../config/assetResolver';
import { getVal, setVal } from '../../config/storage.js';

export default function RealitatSection() {
  const { t } = useAppData();
  const [level, setLevel] = useState(() => {
    return parseInt(getVal('socdepoble-iaia-level', '1'), 10);
  });
  
  const [selectedCompanions, setSelectedCompanions] = useState(() => {
    return getVal('socdepoble-iaia-companions', []);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVal('socdepoble-iaia-level', level.toString());
      setVal('socdepoble-iaia-companions', selectedCompanions);
    }
  }, [level, selectedCompanions]);

  const toggleCompanion = (id) => {
    setSelectedCompanions(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const aiAgents = AGENTS.filter(a => a.type === 'AI' || a.type === 'MASTER');

  return (
    <UniversalPage
      title={t('section.realitat.title', 'Selector de Realitat')}
      subtitle={t('section.realitat.subtitle', "Configura el teu nivell d'interacció amb la IAIA MarIA i els Acompanyants.")}
      chrome="system"
      showLogos={false}
    >
      // eslint-disable-next-line
      <div className="sdp-card-grid" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {[
          { id: 0, label: 'Apagada', desc: 'Sense intervenció de la intel·ligència artificial.' },
          { id: 1, label: 'Passiva', desc: 'Només recomanacions i accions a petició teua.' },
          { id: 2, label: 'Interactiva (Selecció)', desc: 'Conversa activa amb acompanyants específics.' },
          { id: 3, label: 'Connexió Total', desc: 'Connexió total amb tots els agents de el Mas.' }
        ].map((lvl) => (
          // eslint-disable-next-line
          <div key={lvl.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sdp-space-2)' }}>
            <button
              onClick={() => setLevel(lvl.id)}
              // eslint-disable-next-line
              style={{
                textAlign: 'left',
                padding: 'var(--sdp-space-5)',
                borderRadius: 'var(--sdp-radi-targeta)',
                border: level === lvl.id ? '2px solid var(--sdp-accent)' : '1px solid var(--sdp-vora-control)',
                background: level === lvl.id ? 'var(--sdp-fons-subtil)' : 'var(--sdp-fons-targeta)',
                cursor: 'pointer',
                transition: 'all var(--sdp-t)'
              }}
            >
              // eslint-disable-next-line
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: level === lvl.id ? 'var(--sdp-accent)' : 'var(--sdp-text-titol)' }}>
                Nivell {lvl.id}: {lvl.label}
              </div>
              // eslint-disable-next-line
              <div style={{ fontSize: '0.9rem', color: 'var(--sdp-text-suau)', marginTop: 'var(--sdp-space-1)' }}>
                {lvl.desc}
              </div>
            </button>
            
            {level === 2 && lvl.id === 2 && (
              // eslint-disable-next-line
              <div style={{ 
                padding: 'var(--sdp-space-4)', 
                background: 'var(--sdp-fons-invers)', 
                borderRadius: 'var(--sdp-radi-targeta)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sdp-space-3)',
                marginTop: 'var(--sdp-space-2)'
              }}>
                // eslint-disable-next-line
                <p style={ { color: 'var(--sdp-text-invers)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: 'var(--sdp-space-1)' }}>
                  Tria els teus acompanyants:
                </p>
                {aiAgents.map(agent => {
                  const isSelected = selectedCompanions.includes(agent.id);
                  return (
                    // eslint-disable-next-line
                    <label key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sdp-space-4)', color: 'var(--sdp-text-invers)', cursor: 'pointer', padding: 'var(--sdp-space-2) 0' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleCompanion(agent.id)}
                        // eslint-disable-next-line
                        style={{ accentColor: 'var(--sdp-accent)', width: '20px', height: '20px' }}
                      />
                      <img 
                        src={resolveAsset(agent.avatar_url)} 
                        alt={agent.name}
                        // eslint-disable-next-line
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      // eslint-disable-next-line
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        // eslint-disable-next-line
                        <span style={{ fontSize: '1rem', fontWeight: '600' }}>{agent.name}</span>
                        // eslint-disable-next-line
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{agent.role}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </UniversalPage>
  );
}
