import React, { useEffect, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Casella, GrupOpcions } from '../../components/PedraSeca/index.js';
import { AGENTS } from '../profile/agentsSeed';
import { resolveAsset } from '../../config/assetResolver';
import { getVal, setVal } from '../../config/storage.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { CLAU_NIVELL_IAIA, anunciaNivellIaia, nivellIaiaDesat } from './nivellIaia.js';

export default function RealitatSection() {
  const { t } = useUIActions();

  const [level, setLevel] = useState(nivellIaiaDesat);

  const [selectedCompanions, setSelectedCompanions] = useState(() =>
    getVal('socdepoble-iaia-companions', [])
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVal(CLAU_NIVELL_IAIA, level.toString());
      setVal('socdepoble-iaia-companions', selectedCompanions);
      /* T30.2 · la barra negra s'assabenta del nivell sense tornar a muntar-se. */
      anunciaNivellIaia(level);
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
      desc: 'Connexió total amb tots els agents de el Mas.',
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
      {/* T31 (ordre del Mestre, 260927 nit) · abans eren <button> amb classes
          que cap full definia (card--accent, realitat-btn): es pintaven amb
          l'estil de l'agent d'usuari i el nivell triat no es distingia. Ara
          són els àtoms de Pedra Seca: un grup d'opcions (ràdios) per al
          nivell i caselles per als acompanyants, dins de l'ample de lectura. */}
      <div className="sdp-realitat">
        <GrupOpcions
          llegenda={t('section.realitat.nivells', "Nivell d'interacció amb la IAIA")}
          nom="nivell-iaia"
          opcions={levels.map((currentLevel) => ({
            valor: currentLevel.id,
            etiqueta: `Nivell ${currentLevel.id}: ${currentLevel.label}`,
            ajuda: currentLevel.desc
          }))}
          valor={level}
          onCanvi={(valor) => setLevel(Number(valor))}
        />

        {level === 2 ? (
          <fieldset className="sdp-grup">
            <legend className="sdp-grup__llegenda">
              {t('section.realitat.acompanyants', 'Tria els teus acompanyants')}
            </legend>
            {aiAgents.map((agent) => (
              <Casella
                key={agent.id}
                checked={selectedCompanions.includes(agent.id)}
                onChange={() => toggleCompanion(agent.id)}
                etiqueta={(
                  <span className="sdp-realitat__acompanyant">
                    <img src={resolveAsset(agent.avatar_url)} alt="" className="sdp-avatar sdp-avatar--md" />
                    <span>{agent.name}</span>
                  </span>
                )}
                ajuda={agent.role}
              />
            ))}
          </fieldset>
        ) : null}
      </div>
    </UniversalPage>
  );
}
