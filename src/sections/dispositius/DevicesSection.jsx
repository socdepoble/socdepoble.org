import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Link2, MessageSquare, RefreshCcw, ShieldCheck, Wifi, X } from 'lucide-react';
import { Insignia, QuadreDeComandament } from '../../components/PedraSeca';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { FORASTER, autorDeSessio } from '../../components/universal/UniversalUtils.js';
import { Link, useRouter } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useSessioOpcional } from '../../app/contexts/SessionContext';
import { useSEO } from '../../hooks/useSEO';
import { esAppNativa } from '../../config/origenPublic.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { compatibilitatDispositius } from '../text/pageContent.dispositius.js';
import { textosDispositiusA11y } from './i18nDispositiusA11y.js';
import {
  PRESENCE_STALE_MS,
  ambNomSuggerit,
  createChatMessage,
  createDeviceBridge,
  idDeInstancia,
  loadDeviceChats,
  loadDeviceConnections,
  loadDeviceProfile,
  loadSelectedPeer,
  saveDeviceChats,
  saveDeviceConnections,
  saveDeviceProfile,
  saveSelectedPeer
} from './devicesRuntime';

/* Redisseny Pedra Seca 261118 (ordre del Mestre):
   · UniversalPage amb title, subtitle i lead canònics (H1 → H2 → entradeta → veu IAIA).
   · QuadreDeComandament amb targetes KPI blanques estandarditzades en lloc dels
     blocs grisos heretats (sdp-stat-grid, sdp-stat-card, sdp-stat-value,
     sdp-stat-label) i de l'embolcall devices-shell, que es podaran de modules.css
     en l'onada d'estils.
   · Seccions internes en H3, prosa alineada amb negretes d'escaneig i enllaços
     certificats a les fonts (MDN BroadcastChannel, /xat i avís TLS de Supabase). */

const URL_MDN_BROADCAST_CHANNEL = 'https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API';

const MOCK_DEVICES = [
  { id: 'E9B234F1-mock-a', name: 'Mòbil de prova', kind: 'mock', lastSeen: Date.now() },
  { id: '4A1D8F2C-mock-b', name: 'Tauleta de prova', kind: 'mock', lastSeen: Date.now() },
  { id: 'B8C1D9F4-mock-c', name: 'Ordinador de prova', kind: 'mock', lastSeen: Date.now() }
];

/* v1.2.9 (integració) · El router opcional amb el patró de PageFrame.jsx: objectesDeContext.js només
   l'importen els .jsx del seu context (src/app/contexts/objectesDeContext.test.jsx). Fora del Router
   (proves, encastats) l'enllaç torna a l'<a> de sempre. */
function useRouterOpcional() {
  try {
    return useRouter() ?? null;
  } catch {
    return null;
  }
}

function EnllacRuta({ to, children }) {
  const router = useRouterOpcional();
  if (router) return <Link to={to}>{children}</Link>;
  return <a href={to}>{children}</a>;
}

/* P5 (Mestre, 261003) · De qui és este aparell, per al nom suggerit. Sense
   sessió (el Foraster) no hi ha ningú: el nom és sempre genèric. Amb sessió,
   l'agent del padró si la persona n'és un, o el nom de la sessió; mai el del
   Foraster, que una persona registrada no ho és. */
function nomDePersona(currentUser, agents) {
  if (!currentUser) return null;
  const agent = agents?.find((a) => String(a.id) === String(currentUser.id));
  if (agent?.name) return agent.name;
  const { name } = autorDeSessio(currentUser);
  return name && name !== FORASTER.name ? name : null;
}

function toDeConnexio(state) {
  if (state === 'connected') return 'exit';
  if (state === 'pending' || state === 'incoming') return 'info';
  if (state === 'declined') return 'avis';
  return 'neutre';
}

export default function DevicesSection() {
  const idCampNom = useId();
  const idCampMissatge = useId();
  const { externalConfig, language = 'ca' } = useUIState();
  const compatibilitat = compatibilitatDispositius(language);
  const txDisp = textosDispositiusA11y(language);
  const { agents } = useCoreContent();
  const currentUser = useSessioOpcional()?.currentUser || null;
  const tenantId = externalConfig?.tenantId || 'default-tenant';
  const nomPersona = useMemo(() => nomDePersona(currentUser, agents), [currentUser, agents]);

  /* Onada 8 (261009) · Sense `image`: useSEO no passa cap SVG a les xarxes i
     ja hi posava la imatge base. El <head> és el mateix. */
  useSEO({
    title: txDisp.seoTitle,
    description: txDisp.seoDescription
  });

  const [profile, setProfile] = useState(() => loadDeviceProfile(tenantId, nomPersona));
  const [draftName, setDraftName] = useState(profile.name);
  const [devices, setDevices] = useState({});
  const [connections, setConnections] = useState(() => loadDeviceConnections(tenantId, profile.id));
  const [messagesByPeer, setMessagesByPeer] = useState(() => loadDeviceChats(tenantId, profile.id));
  const [selectedPeerId, setSelectedPeerId] = useState(() => loadSelectedPeer(tenantId, profile.id));
  const [draftMessage, setDraftMessage] = useState('');
  const [isSimulationEnabled, setIsSimulationEnabled] = useState(false);
  const bridgeRef = useRef(null);
  const mockReplyTimerRef = useRef(null);
  const chatLogRef = useRef(null);

  const supportsBridge = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined';

  const visibleDevices = useMemo(
    () =>
      Object.values(devices)
        .filter((device) => device.id !== profile.id)
        .filter((device) => Date.now() - (device.lastSeen || 0) < PRESENCE_STALE_MS)
        .sort((left, right) => (right.lastSeen || 0) - (left.lastSeen || 0)),
    [devices, profile.id]
  );

  const mergedDevices = useMemo(() => {
    const visibleIds = new Set(visibleDevices.map((device) => device.id));
    const mockDevices = isSimulationEnabled
      ? MOCK_DEVICES.filter((device) => !visibleIds.has(device.id)).map((device) => ({
          ...device,
          lastSeen: Date.now()
        }))
      : [];
    return [...mockDevices, ...visibleDevices];
  }, [visibleDevices, isSimulationEnabled]);

  const connectedPeers = useMemo(
    () => mergedDevices.filter((device) => connections[device.id]?.state === 'connected'),
    [connections, mergedDevices]
  );
  const activeChatPeer = connectedPeers.find((device) => device.id === selectedPeerId) || null;
  const activeChatConnection = activeChatPeer ? connections[activeChatPeer.id] : null;
  const activeChatMessages = useMemo(
    () => (activeChatPeer ? messagesByPeer[activeChatPeer.id] || [] : []),
    [activeChatPeer, messagesByPeer]
  );

  const appendMessage = useCallback((peerId, message) => {
    setMessagesByPeer((current) => {
      const next = { ...current, [peerId]: [...(current[peerId] || []), message] };
      saveDeviceChats(tenantId, profile.id, next);
      return next;
    });
  }, [tenantId, profile.id]);

  /* Si la persona entra o ix, el nom automàtic la seguix; un nom desat amb «Guardar» no es toca. */
  useEffect(() => {
    setProfile((current) => ambNomSuggerit(current, nomPersona));
  }, [nomPersona]);

  useEffect(() => {
    saveDeviceProfile(tenantId, profile);
    setDraftName(profile.name);
  }, [profile, tenantId]);

  useEffect(() => {
    saveDeviceConnections(tenantId, profile.id, connections);
  }, [connections, profile.id, tenantId]);

  useEffect(() => {
    saveSelectedPeer(tenantId, profile.id, selectedPeerId);
  }, [profile.id, selectedPeerId, tenantId]);

  useEffect(() => {
    if (!supportsBridge) return undefined;

    bridgeRef.current?.destroy?.();
    bridgeRef.current = createDeviceBridge(tenantId, profile, {
      onPresence(device) {
        setDevices((current) => ({
          ...current,
          [device.id]: { ...current[device.id], ...device, lastSeen: Date.now() }
        }));
      },
      onConnectRequest(fromId) {
        setConnections((current) => ({ ...current, [fromId]: { state: 'incoming', updatedAt: Date.now() } }));
        setSelectedPeerId((current) => current || fromId);
      },
      onConnectAccept(fromId) {
        setConnections((current) => ({ ...current, [fromId]: { state: 'connected', updatedAt: Date.now() } }));
        setSelectedPeerId(fromId);
      },
      onConnectDecline(fromId) {
        setConnections((current) => ({ ...current, [fromId]: { state: 'declined', updatedAt: Date.now() } }));
      },
      onMessage(fromId, message) {
        setConnections((current) => ({ ...current, [fromId]: { state: 'connected', updatedAt: Date.now() } }));
        appendMessage(fromId, { ...message, sender: 'other' });
        setSelectedPeerId((current) => current || fromId);
      },
      onDisconnect(fromId) {
        setConnections((current) => ({ ...current, [fromId]: { state: 'idle', updatedAt: Date.now() } }));
        appendMessage(fromId, createChatMessage({ sender: 'other', text: 'La connexió s’ha tancat.', author: 'Dispositiu' }));
      },
      onDuplicate() {
        /* Pestanya duplicada: este document és la còpia (el més nou). Deixa
           l'id a l'original i comença net, sense les connexions ni els xats
           que ha heretat. */
        const id = idDeInstancia(tenantId, { renova: true });
        setDevices({});
        setConnections({});
        setMessagesByPeer({});
        setSelectedPeerId('');
        setProfile((current) => ({ ...current, id }));
      }
    });

    return () => {
      bridgeRef.current?.destroy?.();
      bridgeRef.current = null;
    };
  }, [profile, supportsBridge, tenantId, appendMessage]);

  /* Auditoria 261007 (B) · El tic de 4 s només torna un objecte nou quan algun
     dispositiu ha creuat, des del tic anterior, el llindar de visibilitat
     (PRESENCE_STALE_MS, que aplica visibleDevices en recalcular-se) o el
     d'esborrat (el doble). Abans en tornava un a cada tic i la secció sencera
     es tornava a pintar cada 4 s encara que la llista fora la mateixa. Un
     dispositiu silenciós continua desapareixent entre 16 i 20 s. */
  const darrerTicRef = useRef(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      const abans = darrerTicRef.current;
      const ara = Date.now();
      darrerTicRef.current = ara;
      setDevices((current) => {
        const entrades = Object.entries(current);
        const vius = entrades.filter(([, device]) => ara - (device.lastSeen || 0) < PRESENCE_STALE_MS * 2);
        const amagat = entrades.some(([, device]) => {
          const vist = device.lastSeen || 0;
          return abans - vist < PRESENCE_STALE_MS && ara - vist >= PRESENCE_STALE_MS;
        });
        if (!amagat && vius.length === entrades.length) return current;
        return Object.fromEntries(vius);
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedPeerId && connectedPeers.length > 0) setSelectedPeerId(connectedPeers[0].id);
  }, [connectedPeers, selectedPeerId]);

  useEffect(() => {
    if (!chatLogRef.current) return;
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [activeChatMessages, activeChatPeer]);

  const refreshDiscovery = () => {
    bridgeRef.current?.announcePresence?.();
    bridgeRef.current?.requestPresence?.();
  };

  const saveName = () => {
    const nextName = draftName.trim();
    if (!nextName) return;
    setProfile((current) => ({ ...current, name: nextName, nomAutomatic: false }));
    window.setTimeout(() => bridgeRef.current?.announcePresence?.(), 0);
  };

  const requestConnection = (peerId) => {
    setConnections((current) => ({ ...current, [peerId]: { state: 'pending', updatedAt: Date.now() } }));
    if (MOCK_DEVICES.some((device) => device.id === peerId)) {
      mockReplyTimerRef.current = window.setTimeout(() => {
        setConnections((current) => ({ ...current, [peerId]: { state: 'connected', updatedAt: Date.now() } }));
      }, 700);
      setSelectedPeerId(peerId);
      return;
    }
    bridgeRef.current?.requestConnection?.(peerId);
    setSelectedPeerId(peerId);
  };

  const acceptConnection = (peerId) => {
    setConnections((current) => ({ ...current, [peerId]: { state: 'connected', updatedAt: Date.now() } }));
    bridgeRef.current?.acceptConnection?.(peerId);
    setSelectedPeerId(peerId);
  };

  const declineConnection = (peerId) => {
    setConnections((current) => ({ ...current, [peerId]: { state: 'idle', updatedAt: Date.now() } }));
    bridgeRef.current?.declineConnection?.(peerId);
  };

  const disconnectPeer = (peerId) => {
    setConnections((current) => ({ ...current, [peerId]: { state: 'idle', updatedAt: Date.now() } }));
    if (!MOCK_DEVICES.some((device) => device.id === peerId)) bridgeRef.current?.disconnectConnection?.(peerId);
  };

  const sendMessage = (text) => {
    if (!selectedPeerId || !text.trim()) return;
    const message = createChatMessage({ sender: 'me', text: text.trim(), author: profile.name });
    appendMessage(selectedPeerId, message);
    if (MOCK_DEVICES.some((device) => device.id === selectedPeerId)) {
      mockReplyTimerRef.current = window.setTimeout(() => {
        appendMessage(selectedPeerId, createChatMessage({ sender: 'other', text: 'Rebut.', author: 'Prova' }));
      }, 800);
      setDraftMessage('');
      return;
    }
    bridgeRef.current?.sendMessage?.(selectedPeerId, message);
    setDraftMessage('');
  };

  const connectionLabel = (peerId) => {
    const state = connections[peerId]?.state || 'idle';
    if (state === 'connected') return 'Connectat';
    if (state === 'pending') return 'Pendent';
    if (state === 'incoming') return 'Vol connectar';
    if (state === 'declined') return 'Rebutjat';
    if (MOCK_DEVICES.some((device) => device.id === peerId)) return 'Prova';
    return 'Disponible';
  };

  const connexionsActives = Object.values(connections).filter((entry) => entry.state === 'connected').length;

  const xifresResum = [
    { clau: 'actual', nom: 'Dispositiu actual', valor: profile.name },
    { clau: 'visibles', nom: 'Dispositius visibles', valor: String(mergedDevices.length) },
    { clau: 'actives', nom: 'Connexions actives', valor: String(connexionsActives) }
  ];

  /* Decisions 261030 §7 · Dispositius i missatges directes: Traduir no envia res fora. */
  return (
    <UniversalPage
      title={txDisp.title}
      subtitle={txDisp.subtitle}
      lead={txDisp.lead}
      traduccio={false}
      chrome="system"
    >
      <QuadreDeComandament
        estat={{
          viu: Boolean(profile.isVisible),
          text: profile.isVisible
            ? 'Visible · Anunciant presència a les altres pestanyes d’este navegador'
            : 'Mode privat · Invisible per a altres pestanyes'
        }}
        xifres={xifresResum}
        explicacio={(
          <p>
            Esta eina enllaça <strong>pestanyes i finestres obertes en este mateix navegador</strong>{' '}
            mitjançant l’estàndard web{' '}
            <a href={URL_MDN_BROADCAST_CHANNEL} target="_blank" rel="noopener noreferrer">
              <strong>BroadcastChannel</strong>
            </a>
            , <strong>sense enviar cap dada fora de l’aparell</strong>. Per escriure a{' '}
            <strong>altres mòbils, ordinadors o pobles</strong> per la xarxa, obri el{' '}
            <EnllacRuta to="/xat"><strong>Xat de Sóc de Poble</strong></EnllacRuta>.
          </p>
        )}
      />

      <div className="devices-layout">
        <section>
          <h3>Este dispositiu</h3>
          <p>
            Tria el <strong>nom visible</strong> d’esta instància i commuta entre el{' '}
            <strong>mode privat</strong> (per defecte, <strong>invisible</strong>) i el{' '}
            <strong>mode públic</strong> per anunciar la teua presència a la resta de pestanyes obertes.
          </p>
          <div className="devices-panel__body">
            <article className="card--soft">
              <div className="card__body">
                <div className="badge-row">
                  <Insignia to="info">
                    <Wifi size={14} aria-hidden="true" />{' '}
                    <span>{`ID ${profile.id.slice(0, 8)}`}</span>
                  </Insignia>
                  <Insignia to={profile.isVisible ? 'exit' : 'neutre'}>
                    <ShieldCheck size={14} aria-hidden="true" />{' '}
                    <span>Sessió local</span>
                  </Insignia>
                </div>

                <div className="devices-panel__accions">
                  <button
                    type="button"
                    title={profile.isVisible ? txDisp.modePublicTitle : txDisp.modePrivatTitle}
                    className={profile.isVisible ? 'sdp-boto sdp-boto--primari' : 'sdp-boto sdp-boto--secundari'}
                    onClick={() => {
                      const next = { ...profile, isVisible: !profile.isVisible };
                      setProfile(next);
                      if (next.isVisible) bridgeRef.current?.requestPresence?.();
                    }}
                  >
                    {profile.isVisible ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                    <span>{profile.isVisible ? 'Visible (Públic)' : 'Invisible (Privat)'}</span>
                  </button>
                  <button type="button" className="sdp-boto sdp-boto--accent" onClick={refreshDiscovery}>
                    <RefreshCcw size={16} aria-hidden="true" /> <span>Refrescar</span>
                  </button>
                </div>

                <div className="devices-name-row">
                  <label htmlFor={idCampNom} className="sdp-nomes-lector">{txDisp.nomDispositiuLabel}</label>
                  <input
                    id={idCampNom}
                    type="text"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    className="sdp-control"
                    placeholder={txDisp.nomDispositiuPlaceholder}
                  />
                  <button type="button" className="sdp-boto sdp-boto--primari" onClick={saveName}>
                    <Check size={16} aria-hidden="true" /> <span>Guardar</span>
                  </button>
                  <p className="sdp-camp__ajuda">Este és el nom que veuran les altres instàncies quan et faces visible.</p>
                </div>
                {!supportsBridge ? (
                  <div className="note-card">Este navegador no suporta la descoberta en viu per BroadcastChannel.</div>
                ) : null}
              </div>
            </article>
          </div>
        </section>

        <section>
          <h3>Dispositius trobats</h3>
          <p>
            Ací apareixen les <strong>altres pestanyes obertes</strong> que s’estan anunciant ara mateix
            (una pestanya silenciosa desapareix sola entre els <strong>16 i 20 segons</strong>). També pots
            activar <strong>connexions simulades de prova</strong> per assajar tot el recorregut.
          </p>
          <div className="devices-panel__head">
            <div className="devices-panel__accions">
              <button
                type="button"
                aria-pressed={isSimulationEnabled}
                className={isSimulationEnabled ? 'sdp-boto sdp-boto--secundari' : 'sdp-boto sdp-boto--primari'}
                onClick={() => setIsSimulationEnabled(!isSimulationEnabled)}
              >
                Simular connexions de prova
              </button>
            </div>
          </div>
          <div className="devices-panel__body">
            {/* Fora de la graella: dins, ocupava la primera de les tres columnes. */}
            {mergedDevices.length === 0 ? <div className="note-card">Encara no hi ha altres instàncies visibles.</div> : null}
            <div className="sdp-card-grid">
              {mergedDevices.map((device) => {
                const state = connections[device.id]?.state || 'idle';
                return (
                  <article key={device.id} className="card--soft">
                    <div className="card__body">
                      <div className="devices-row">
                        <div>
                          <strong className="card__title">{device.name}</strong>
                          <p className="card__text">{`ID curt: ${device.id.slice(0, 8)}`}</p>
                        </div>
                        <Insignia to={toDeConnexio(state)}>{connectionLabel(device.id)}</Insignia>
                      </div>
                      <div className="devices-panel__accions">
                        {(state === 'idle' || state === 'declined') ? (
                          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => requestConnection(device.id)}>
                            <Link2 size={16} aria-hidden="true" /> <span>Connectar</span>
                          </button>
                        ) : null}
                        {state === 'connected' ? (
                          <button type="button" className="sdp-boto sdp-boto--accent" onClick={() => disconnectPeer(device.id)}>
                            <X size={16} aria-hidden="true" /> <span>Desconnectar</span>
                          </button>
                        ) : null}
                        {state === 'pending' ? <Insignia to="info">Esperant resposta</Insignia> : null}
                        {state === 'incoming' ? (
                          <>
                            <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => acceptConnection(device.id)}>
                              <Check size={16} aria-hidden="true" /> Acceptar
                            </button>
                            <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => declineConnection(device.id)}>
                              <X size={16} aria-hidden="true" /> Rebutjar
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <h3>Canal directe</h3>
          <p>
            {activeChatPeer ? (
              <>
                <strong>Canal directe actiu</strong> establert amb <strong>{activeChatPeer.name}</strong>: els
                missatges viatgen de pestanya a pestanya dins d’este navegador.
              </>
            ) : (
              <>
                Quan dues instàncies <strong>accepten connectar-se</strong>, s’obri ací un{' '}
                <strong>canal local directe</strong> entre elles,{' '}
                <strong>sense passar pel servidor de Sóc de Poble</strong>.
              </>
            )}
          </p>
          <div className="devices-panel__body">
            {!activeChatPeer ? <div className="note-card">No hi ha cap dispositiu connectat en el canal inferior.</div> : null}
            {activeChatPeer ? (
              <div className="devices-chat-shell">
                <article className="card--soft">
                  <div className="card__body">
                    <div className="devices-row">
                      <div>
                        <strong className="card__title">{activeChatPeer.name}</strong>
                        <p className="card__text">{`ID curt: ${activeChatPeer.id.slice(0, 8)}`}</p>
                      </div>
                      <Insignia to={toDeConnexio(activeChatConnection?.state)}>{connectionLabel(activeChatPeer.id)}</Insignia>
                    </div>
                    <div className="devices-panel__accions">
                      {activeChatConnection?.state === 'connected' ? (
                        <button type="button" className="sdp-boto sdp-boto--perill" onClick={() => disconnectPeer(activeChatPeer.id)}>
                          <X size={16} aria-hidden="true" /> <span>Desconnectar</span>
                        </button>
                      ) : null}
                    </div>

                    {activeChatConnection?.state !== 'connected' ? (
                      <div className="note-card">
                        {activeChatConnection?.state === 'pending'
                          ? 'Has enviat una petició. Esperant acceptació.'
                          : activeChatConnection?.state === 'incoming'
                          ? 'Este dispositiu vol connectar amb tu. Pots acceptar-lo des del llistat dalt.'
                          : 'Encara no hi ha connexió acceptada. Primer cal establir el vincle.'}
                      </div>
                    ) : null}
                  </div>
                </article>

                {connectedPeers.length > 0 ? (
                  <div className="devices-panel__accions">
                    {connectedPeers.map((peer) => (
                      <button
                        key={peer.id}
                        type="button"
                        className={selectedPeerId === peer.id ? 'sdp-boto sdp-boto--primari' : 'sdp-boto sdp-boto--secundari'}
                        onClick={() => setSelectedPeerId(peer.id)}
                      >
                        <MessageSquare size={16} aria-hidden="true" /> <span>{peer.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div ref={chatLogRef} className="devices-chat-log">
                  {activeChatMessages.length === 0 ? <div className="note-card">Encara no hi ha missatges en este canal.</div> : null}
                  {activeChatMessages.map((message) => (
                    <article
                      key={message.id}
                      className={message.sender === 'me' ? 'sdp-chat-bubble sdp-chat-bubble--user' : 'sdp-chat-bubble sdp-chat-bubble--ai'}
                    >
                      <strong>{message.sender === 'me' ? profile.name : message.author || activeChatPeer.name}</strong>
                      <p>{message.text}</p>
                    </article>
                  ))}
                </div>

                <div className="search-bar-basic">
                  <label htmlFor={idCampMissatge} className="sdp-nomes-lector">{txDisp.missatgeDirecteLabel}</label>
                  <input
                    id={idCampMissatge}
                    type="text"
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && activeChatConnection?.state === 'connected') {
                        sendMessage(draftMessage);
                      }
                    }}
                    placeholder={txDisp.missatgeDirectePlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage(draftMessage)}
                    disabled={activeChatConnection?.state !== 'connected'}
                  >
                    <ArrowRight size={16} aria-hidden="true" /> Enviar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {!esAppNativa() && (
          <section lang={compatibilitat.language}>
            <h3>{compatibilitat.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(compatibilitat.html) }} />
          </section>
        )}
      </div>
    </UniversalPage>
  );
}
