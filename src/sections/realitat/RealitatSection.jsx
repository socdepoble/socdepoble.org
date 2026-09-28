import React, { useEffect, useId, useState } from 'react';
import { Lightbulb, MessagesSquare, Network, PowerOff } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Avatar, Casella, GrupAvatars, GrupOpcions, IaiaIcon } from '../../components/PedraSeca/index.js';
import { AGENTS } from '../profile/agentsSeed';
import { resolveAsset } from '../../config/assetResolver';
import { getVal, setVal } from '../../config/storage.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { CLAU_NIVELL_IAIA, anunciaNivellIaia, esIaiaActiva, nivellIaiaDesat } from './nivellIaia.js';

/* T44 (ordre del Mestre, 260928) · cada nivell diu el seu propòsit, i el
   detall de la targeta diu l'efecte que ja té hui: la IAIA de la barra negra
   s'activa a partir del nivell 2 (T30.2). No es diu «respira»: amb moviment
   reduït el resplendor de layout.css no es veu i la frase seria falsa.
   Constant de mòdul: no es recrea. */
const NIVELLS = [
  { id: 0, etiqueta: 'Apagada', Icona: PowerOff, descripcio: 'La IA no intervé: ni suggeriments ni converses. Només tu i la gent del poble.' },
  { id: 1, etiqueta: 'Passiva', Icona: Lightbulb, descripcio: 'La IA només respon quan li ho demanes. Mai no pren la iniciativa.' },
  { id: 2, etiqueta: 'Interactiva', Icona: MessagesSquare, descripcio: 'Converses actives amb els acompanyants que tries tu.' },
  { id: 3, etiqueta: 'Connexió total', Icona: Network, descripcio: "Tots els agents del Mas t'acompanyen alhora, sense triar-los." }
];

const LLISTA_CA = new Intl.ListFormat('ca', { type: 'conjunction' });

/** Mesurador d'intensitat 0-3: tres pedres, les n primeres plenes. Decoratiu. */
function Pedres({ plenes }) {
  return (
    <span className="sdp-realitat__pedres" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= plenes ? 'sdp-realitat__pedra sdp-realitat__pedra--plena' : 'sdp-realitat__pedra'} />
      ))}
    </span>
  );
}

export default function RealitatSection() {
  const { t } = useUIActions();
  const idAjudaCompanys = useId();

  const [level, setLevel] = useState(nivellIaiaDesat);

  const [selectedCompanions, setSelectedCompanions] = useState(() => {
    const desats = getVal('socdepoble-iaia-companions', []);
    return Array.isArray(desats) ? desats : [];
  });

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

  const nivellActual = NIVELLS.find((n) => n.id === level) ?? NIVELLS[1];
  const activa = esIaiaActiva(nivellActual.id);

  return (
    <UniversalPage
      title={t('section.realitat.title', 'Selector de Realitat')}
      subtitle={t('section.realitat.subtitle', "Tu decidixes quanta intel·ligència artificial t'acompanya")}
      lead={t(
        'section.realitat.lead',
        'Cada nivell diu fins on pot arribar la IA. La tria es guarda només en este navegador i la pots canviar quan vulgues.'
      )}
      chrome="system"
      showLogos={false}
    >
      {/* T44 (ordre del Mestre, 260928) · substituïx la llista grisa de T31:
          un tauler d'estat lligat a la IAIA de la barra negra, els nivells com
          a targetes (GrupOpcions aspecte="targetes": el control continua sent
          el ràdio natiu) i els acompanyants com a targetes-casella. */}
      <div className="sdp-realitat">
        {/* Sense regió viva: el ràdio ja anuncia el canvi i no es repetix. */}
        <div className="sdp-realitat__estat">
          <span className={activa ? 'sdp-realitat__iaia sdp-realitat__iaia--activa' : 'sdp-realitat__iaia'} aria-hidden="true">
            <IaiaIcon />
          </span>
          <div className="sdp-realitat__estat-text">
            <p className="sdp-realitat__estat-titol">Ara: nivell {nivellActual.id} · {nivellActual.etiqueta}</p>
            <p className="sdp-realitat__estat-desc">
              {activa
                ? "La IA està activa: la IAIA de la barra negra s'activa amb ella."
                : 'La IA està en repòs: la IAIA de la barra negra reposa.'}
            </p>
          </div>
        </div>

        <GrupOpcions
          aspecte="targetes"
          textTriada="Nivell actual"
          llegenda={t('section.realitat.nivells', "Nivell d'interacció amb la IAIA")}
          nom="nivell-iaia"
          opcions={NIVELLS.map((n) => ({
            valor: n.id,
            antetitol: `Nivell ${n.id}`,
            etiqueta: n.etiqueta,
            ajuda: n.descripcio,
            icona: <n.Icona size={28} strokeWidth={1.5} aria-hidden="true" focusable="false" />,
            detall: (
              <>
                <Pedres plenes={n.id} />
                {esIaiaActiva(n.id) ? "La IAIA s'activa a la barra negra" : 'La IAIA reposa a la barra negra'}
              </>
            )
          }))}
          valor={level}
          onCanvi={(valor) => setLevel(Number(valor))}
        />

        {level === 2 ? (
          <fieldset className="sdp-grup sdp-realitat__acompanyants" aria-describedby={idAjudaCompanys}>
            <legend className="sdp-grup__llegenda">
              {t('section.realitat.acompanyants', 'Tria els teus acompanyants')}
            </legend>
            <p id={idAjudaCompanys} className="sdp-camp__ajuda">Marca amb quins acompanyants vols conversar.</p>
            <div className="sdp-realitat__graella">
              {aiAgents.map((agent) => {
                const triat = selectedCompanions.includes(agent.id);
                return (
                  <Casella
                    key={agent.id}
                    className={triat ? 'sdp-realitat__company sdp-realitat__company--triat' : 'sdp-realitat__company'}
                    checked={triat}
                    onChange={() => toggleCompanion(agent.id)}
                    etiqueta={(
                      <>
                        {/* Sense `nom`: posaria un title i repetiria el nom escrit al costat. */}
                        <Avatar src={resolveAsset(agent.avatar_url)} mida="lg" alt="" llavor={agent.id} />
                        <span className="sdp-realitat__company-nom">{agent.name}</span>
                      </>
                    )}
                    ajuda={agent.role}
                  />
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {level === 3 && aiAgents.length ? (
          <div className="sdp-realitat__connexio">
            <GrupAvatars>
              {aiAgents.map((agent) => (
                <Avatar key={agent.id} src={resolveAsset(agent.avatar_url)} mida="md" alt="" llavor={agent.id} />
              ))}
            </GrupAvatars>
            <p className="sdp-realitat__connexio-text">
              Amb la connexió total t&apos;acompanyen tots alhora: {LLISTA_CA.format(aiAgents.map((agent) => agent.name))}.
            </p>
          </div>
        ) : null}
      </div>
    </UniversalPage>
  );
}
