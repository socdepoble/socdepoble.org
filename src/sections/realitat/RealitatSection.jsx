import React, { useEffect, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { AGENTS } from '../profile/agentsSeed';
import { resolveAsset } from '../../config/assetResolver';
import { getVal, setVal } from '../../config/storage.js';
import { useUIActions } from '../../app/contexts/UIContext';

export default function RealitatSection() {
  const { t } = useUIActions();

  const [level, setLevel] = useState(() =>
    parseInt(getVal('socdepoble-iaia-level', '1'), 10)
  );

  const [selectedCompanions, setSelectedCompanions] = useState(() =>
    getVal('socdepoble-iaia-companions', [])
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVal('socdepoble-iaia-level', level.toString());
      setVal('socdepoble-iaia-companions', selectedCompanions);
    }
  }, [level, selectedCompanions]);

  const toggleCompanion = (id) => {
    setSelectedCompanions((previous) =>
      previous.includes(id)
        ? previous.filter((companionId) => companionId !== id)
        : [...previous, id]
    );
  };

  const aiAgents = AGENTS.filter(
    (agent) => agent.type === 'AI' || agent.type === 'MASTER'
  );

  const levels = [
    {
      id: 0,
      label: 'Apagada',
      desc: 'Sense intervenció de la intel·ligència artificial.',
    },
    {
      id: 1,
      label: 'Passiva',
      desc: 'Només recomanacions i accions a petició teua.',
    },
    {
      id: 2,
      label: 'Interactiva (Selecció)',
      desc: 'Conversa activa amb acompanyants específics.',
    },
    {
      id: 3,
      label: 'Connexió Total',
      desc: 'Connexió total amb tots els agents de la Masia.',
    },
  ];

  return (
    <UniversalPage
      title={t('section.realitat.title', 'Selector de Realitat')}
      subtitle={t(
        'section.realitat.subtitle',
        "Configura el teu nivell d'interacció amb la IAIA MarIA i els Acompanyants."
      )}
      chrome="system"
      showLogos={false}
    >
      <div className="stack-grid content-wrapper">
        {levels.map((currentLevel) => (
          <div key={currentLevel.id} className="stack-grid">
            <button
              type="button"
              onClick={() => setLevel(currentLevel.id)}
              className={`card ${
                level === currentLevel.id ? 'card--accent' : 'card--hover'
              } realitat-btn`}
            >
              <div className="card__body">
                <h3 className="card__title">
                  Nivell {currentLevel.id}: {currentLevel.label}
                </h3>
                <p className="card__text">{currentLevel.desc}</p>
              </div>
            </button>

            {level === 2 && currentLevel.id === 2 && (
              <div className="card card--soft">
                <div className="card__body">
                  <h4 className="section-title">
                    Tria els teus acompanyants:
                  </h4>

                  <div className="stack-grid">
                    {aiAgents.map((agent) => {
                      const isSelected = selectedCompanions.includes(agent.id);

                      return (
                        <label key={agent.id} className="sdp-casella">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCompanion(agent.id)}
                            className="sdp-casella__control"
                          />

                          <img
                            src={resolveAsset(agent.avatar_url)}
                            alt={agent.name}
                            className="sdp-avatar"
                          />

                          <span className="stack-grid">
                            <strong className="sdp-casella__etiqueta">
                              {agent.name}
                            </strong>
                            <span className="sdp-casella__ajuda">
                              {agent.role}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </UniversalPage>
  );
}
