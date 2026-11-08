import { useState } from 'react';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import {
  IAIA_SABER_DOMAINS_EN_PREPARACIO,
  IAIA_WHATSAPP_NODE0_ARCHITECTURE,
  IAIA_WHATSAPP_MAPA_SABER_TEXTS,
  simulaRespostaHonestaIaiaWhatsapp,
} from '../../data/iaiaWhatsappMapaSaberHonest.js';

/**
 * IDEA-171 · El WhatsApp de la IAIA: targeta interactiva Pedra Seca. Es munta a `/page/node-zero`
 * (PageDetailSection, en un chunk lazy), la pàgina del Node 0 (decisió D-R11-4 del Mestre).
 * Mostra l'arquitectura del 2n número exclusiu de WhatsApp de la IAIA MarIA pensat per a
 * `Hermes WhatsApp Gateway` + `Node 0 (iaia:latest + hermes3:8b + SQLite FTS5)`
 * i permet provar el simulador de resposta honesta en les 5 llengües (`ca, es, en, eu, gl`).
 * Només classes .pou-neu-* declarades a src/css/components.css; zero atributs `[style]` inline.
 * La pregunta escrita només compta quan es prem «Envia».
 */
export default function IaiaWhatsappCard({ language: idiomaProp } = {}) {
  const ui = useUIActionsOpcional();
  const language = idiomaProp ?? ui?.language ?? 'ca';
  const copy = IAIA_WHATSAPP_MAPA_SABER_TEXTS[language] ?? IAIA_WHATSAPP_MAPA_SABER_TEXTS.ca;

  const [selectedDomainId, setSelectedDomainId] = useState('pou-de-neu-rentonar');
  const [customPrompt, setCustomPrompt] = useState('');
  const [preguntaEnviada, setPreguntaEnviada] = useState('');
  const [dispatchCount, setDispatchCount] = useState(1);

  const handleDomainChange = (nextDomainId) => {
    setSelectedDomainId(nextDomainId);
    setCustomPrompt('');
    setPreguntaEnviada('');
    setDispatchCount((c) => c + 1);
  };

  const handleSend = () => {
    setPreguntaEnviada(customPrompt);
    setDispatchCount((c) => c + 1);
  };

  const simulation = simulaRespostaHonestaIaiaWhatsapp({
    dominiId: selectedDomainId,
    idioma: language,
    pregunta: preguntaEnviada,
  });
  const selectedDomain = copy.domains.find((d) => d.id === selectedDomainId);
  const placeholder = selectedDomain?.sampleQuestion ?? copy.unverifiedSampleQuestion;

  return (
    <section
      className="pou-neu-card"
      lang={language}
      aria-label={copy.title}
      data-testid="iaia-whatsapp-card"
    >
      <header className="pou-neu-heading">
        <p className="pou-neu-kicker">{copy.kicker}</p>
        <h3>{copy.title}</h3>
        <p>{copy.subtitle}</p>
      </header>

      <section
        className="pou-neu-description"
        aria-label={copy.architectureHeading}
        data-testid="iaia-whatsapp-architecture"
      >
        <h4>{copy.architectureHeading}</h4>
        <p>{copy.architectureSummary}</p>
        <dl className="pou-neu-readout">
          <div>
            <dt>{copy.readoutGatewayLabel}</dt>
            <dd>{IAIA_WHATSAPP_NODE0_ARCHITECTURE.gateway}</dd>
          </div>
          <div>
            <dt>{copy.readoutNodeLabel}</dt>
            <dd>{copy.readoutNodeValue}</dd>
          </div>
          <div>
            <dt>{copy.readoutModelsLabel}</dt>
            <dd>
              {IAIA_WHATSAPP_NODE0_ARCHITECTURE.primaryModel} +{' '}
              {IAIA_WHATSAPP_NODE0_ARCHITECTURE.reasoningFallbackModel}
            </dd>
          </div>
          <div>
            <dt>{copy.readoutMemoryLabel}</dt>
            <dd>{IAIA_WHATSAPP_NODE0_ARCHITECTURE.memoryEngine}</dd>
          </div>
        </dl>
      </section>

      <blockquote className="pou-neu-description" data-testid="iaia-whatsapp-humility-pledge">
        <strong>{copy.humilityPledgeTitle}</strong>
        <p>{copy.humilityPledgeBody}</p>
      </blockquote>

      <section
        className="pou-neu-description"
        aria-label={copy.domainsHeading}
        data-testid="iaia-whatsapp-domains-list"
      >
        <h4>{copy.domainsHeading}</h4>
        <ol>
          {copy.domains.map((domain) => (
            <li
              key={domain.id}
              data-domain-item={domain.id}
              data-domain-estat={IAIA_SABER_DOMAINS_EN_PREPARACIO.includes(domain.id) ? 'en-preparacio' : 'amb-fonts'}
            >
              <strong>
                {domain.num}. {domain.title}:
              </strong>{' '}
              {domain.summary} <em>({domain.sources})</em>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="pou-neu-description"
        aria-label={copy.simulatorHeading}
        data-testid="iaia-whatsapp-simulator"
      >
        <div className="pou-neu-caption">
          <strong>{copy.simulatorHeading}</strong>
          <span className="pou-neu-kicker" data-testid="iaia-whatsapp-trajectory-tag">
            {simulation.trajectoryTag} · {simulation.statusBadge}
          </span>
        </div>

        <div className="pou-neu-controls">
          <label className="pou-neu-field">
            <span>{copy.simulatorDomainLabel}</span>
            <select
              value={selectedDomainId}
              onChange={(e) => handleDomainChange(e.target.value)}
              data-testid="iaia-whatsapp-domain-select"
            >
              {copy.domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.num} · {d.title}
                </option>
              ))}
              <option value="unverified">{copy.simulatorUnverifiedOption}</option>
            </select>
          </label>

          <label className="pou-neu-field">
            <span>{copy.simulatorPromptLabel}</span>
            <input
              type="text"
              value={customPrompt}
              placeholder={placeholder}
              onChange={(e) => setCustomPrompt(e.target.value)}
              data-testid="iaia-whatsapp-prompt-input"
            />
          </label>

          <button
            type="button"
            className="pou-neu-explode"
            onClick={handleSend}
            data-testid="iaia-whatsapp-send-btn"
            data-dispatch-count={dispatchCount}
          >
            {copy.simulatorSendButton}
          </button>
        </div>

        <div className="pou-neu-description" role="status" aria-live="polite" data-testid="iaia-whatsapp-reply-box">
          <strong>{copy.simulatorResponseHeading}</strong>
          <p data-testid="iaia-whatsapp-effective-question">
            <em>«{simulation.preguntaEfectiva}»</em>
          </p>
          <p data-testid="iaia-whatsapp-reply-text">{simulation.resposta}</p>
          <p className="pou-neu-note" data-testid="iaia-whatsapp-reply-sources">
            <strong>{copy.simulatorSourcesLabel}</strong> {simulation.fonts}
          </p>
        </div>
      </section>
    </section>
  );
}
