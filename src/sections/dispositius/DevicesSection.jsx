import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Link2, MessageSquare, RefreshCcw, ShieldCheck, Wifi, X, Eye, EyeOff } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useUIState } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext';
import { useSEO } from '../../hooks/useSEO';
import {
  PRESENCE_STALE_MS,
  createChatMessage,
  createDeviceBridge,
  loadDeviceChats,
  loadDeviceConnections,
  loadDeviceProfile,
  loadSelectedPeer,
  saveDeviceConnections,
  saveDeviceChats,
  saveDeviceProfile,
  saveSelectedPeer
} from './devicesRuntime';

const MOCK_DEVICES = [
  { id: 'E9B234F1-mock-a', name: 'Mòbil de prova', kind: 'mock', lastSeen: Date.now() },
  { id: '4A1D8F2C-mock-b', name: 'Tauleta de prova', kind: 'mock', lastSeen: Date.now() },
  { id: 'B8C1D9F4-mock-c', name: 'Ordinador de prova', kind: 'mock', lastSeen: Date.now() }
];

export default function DevicesSection() {
  const { externalConfig } = useUIState();
  const { agents } = useCoreContent();
  const { ownerUserId } = useIdentitat();
  const tenantId = externalConfig?.tenantId || 'default-tenant';
  const activeAgent = agents?.find(a => String(a.id) === String(ownerUserId));
  const activeName = activeAgent?.name || 'Mestre Poble';
  
  useSEO({
    title: 'Dispositius',
    description: 'Gestió de dispositius i connexions',
    image: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'
  });
  
  const [profile, setProfile] = useState(() => loadDeviceProfile(tenantId, activeName));
  const [draftName, setDraftName] = useState(() => loadDeviceProfile(tenantId, activeName).name);
  const [devices, setDevices] = useState({});
  const [connections, setConnections] = useState(() => loadDeviceConnections(tenantId, loadDeviceProfile(tenantId, activeName).id));
  const [messagesByPeer, setMessagesByPeer] = useState(() => loadDeviceChats(tenantId, loadDeviceProfile(tenantId, activeName).id));
  const [selectedPeerId, setSelectedPeerId] = useState(() => loadSelectedPeer(tenantId, loadDeviceProfile(tenantId, activeName).id));
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
  const activeChatMessages = activeChatPeer ? messagesByPeer[activeChatPeer.id] || [] : [];

  const appendMessage = (peerId, message) => {
    setMessagesByPeer((current) => {
      const next = { ...current, [peerId]: [...(current[peerId] || []), message] };
      saveDeviceChats(tenantId, profile.id, next);
      return next;
    });
  };

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
      }
    });

    return () => {
      bridgeRef.current?.destroy?.();
      bridgeRef.current = null;
    };
  }, [profile, supportsBridge, tenantId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDevices((current) =>
        Object.fromEntries(Object.entries(current).filter(([, device]) => Date.now() - (device.lastSeen || 0) < PRESENCE_STALE_MS * 2))
      );
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
    setProfile((current) => ({ ...current, name: nextName }));
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

  const summary = [
    { label: 'Dispositiu actual', value: profile.name },
    { label: 'Dispositius visibles', value: String(mergedDevices.length) },
    { label: 'Connexions actives', value: String(Object.values(connections).filter((entry) => entry.state === 'connected').length) }
  ];

  return (
    <UniversalPage chrome="system" showLogos={true}>
      <div className="devices-shell">
        <div>
          <h2>Descobrix instàncies del portal</h2>
          <p className="lead">Llança una connexió i envia missatges directes des d’esta mateixa pantalla.</p>
        </div>

        <div className="sdp-stat-grid">
          {summary.map((item) => (
            <article key={item.label} className="sdp-stat-card">
              <div className="stat-info">
                <div className="sdp-stat-value">{item.value}</div>
                <div className="sdp-stat-label">{item.label}</div>
              </div>
            </article>
          ))}
        </div>

        <div className="devices-layout">
          <section className="devices-panel__head">
            <div className="devices-panel__head">
              <div>
                <h2>Este dispositiu</h2>
                <p className="lead">Canvia el nom visible i publica la teua presència per a la resta d’instàncies obertes.</p>
              </div>
              <div className="devices-panel__accions">
                <button 
                  type="button"
                  title={profile.isVisible ? "Mode públic" : "Mode privat"}
                  className={profile.isVisible ? 'sdp-boto sdp-boto--primari' : 'sdp-boto sdp-boto--secundari'}
                  onClick={() => {
                    const next = { ...profile, isVisible: !profile.isVisible };
                    setProfile(next);
                    if (next.isVisible) bridgeRef.current?.requestPresence?.();
                  }}
                >
                  {profile.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span>{profile.isVisible ? 'Visible (Públic)' : 'Invisible (Privat)'}</span>
                </button>
                <button type="button" className="sdp-boto sdp-boto--accent" onClick={refreshDiscovery}>
                  <RefreshCcw size={16} /> <span>Refrescar</span>
                </button>
              </div>
            </div>
            <div className="devices-panel__body">
              <article className="card card--soft">
                <div className="card__body">
                  <div className="badge-row">
                    <span className="badge"><Wifi size={14} /> ID {profile.id.slice(0, 8)}</span>
                    <span className="badge"><ShieldCheck size={14} /> Sessió local</span>
                  </div>
                  <div className="devices-name-row">
                    <input
                      type="text"
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      className="sdp-control"
                      placeholder="Nom del dispositiu"
                    />
                    <button type="button" className="sdp-boto sdp-boto--primari" onClick={saveName}>
                      <Check size={16} /> <span>Guardar</span>
                    </button>
                    <p className="sdp-camp__ajuda">Este és el nom que es mostrarà a la resta de dispositius connectats.</p>
                  </div>
                  {!supportsBridge ? <div className="note-card">Este navegador no suporta la descoberta en viu per BroadcastChannel.</div> : null}
                </div>
              </article>
            </div>
          </section>

          <section className="devices-panel__head">
            <div className="devices-panel__head">
              <div>
                <h2>Dispositius trobats</h2>
                <p className="lead">Llistat de tots els ordinadors, tauletes o mòbils que s'estan anunciant. Selecciona'n un per demanar de connectar-vos.</p>
              </div>
              <div className="devices-panel__accions">
                <button type="button" className="sdp-boto sdp-boto--primari" onClick={() => setIsSimulationEnabled(!isSimulationEnabled)}>
                  Simular connexions de prova
                </button>
              </div>
            </div>
            <div className="devices-panel__body">
              <div className="sdp-card-grid">
                {mergedDevices.length === 0 ? <div className="note-card">Encara no hi ha altres instàncies visibles.</div> : null}
                {mergedDevices.map((device) => {
                  const state = connections[device.id]?.state || 'idle';
                  return (
                    <article key={device.id} className="card card--soft">
                      <div className="card__body">
                        <div className="devices-row">
                          <div>
                            <strong className="card__title">{device.name}</strong>
                            <p className="card__text">ID curt: {device.id.slice(0, 8)}</p>
                          </div>
                          <span className="sdp-insignia">{connectionLabel(device.id)}</span>
                        </div>
                        <div className="devices-panel__accions">
                          {(state === 'idle' || state === 'declined') ? (
                            <button type="button" className="sdp-boto sdp-boto--primari" onClick={() => requestConnection(device.id)}>
                              <Link2 size={16} /> <span>Connectar</span>
                            </button>
                          ) : null}
                          {state === 'connected' ? (
                            <button type="button" className="sdp-boto sdp-boto--accent" onClick={() => disconnectPeer(device.id)}>
                              <X size={16} /> <span>Desconnectar</span>
                            </button>
                          ) : null}
                          {state === 'pending' ? <span className="sdp-insignia sdp-insignia--info">Esperant resposta</span> : null}
                          {state === 'incoming' ? (
                            <>
                              <button type="button" className="sdp-boto sdp-boto--primari" onClick={() => acceptConnection(device.id)}>
                                <Check size={16} /> Acceptar
                              </button>
                              <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => declineConnection(device.id)}>
                                <X size={16} /> Rebutjar
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

          <section className="devices-panel__head">
            <div className="devices-panel__head">
              <div>
                <h2>Canal directe</h2>
                <p className="lead">
                  {activeChatPeer
                    ? `Canal actiu i privat establert amb ${activeChatPeer.name}.`
                    : 'És un xat 100% privat que viatja directament entre els vostres dos aparells (sense xafar cap servidor ni núvol).'}
                </p>
              </div>
            </div>
            <div className="devices-panel__body">
              {!activeChatPeer ? <div className="note-card">No hi ha cap dispositiu connectat en el canal inferior.</div> : null}
              {activeChatPeer ? (
                <div className="devices-chat-shell">
                  <article className="card card--soft">
                    <div className="card__body">
                      <div className="devices-row">
                        <div>
                          <strong className="card__title">{activeChatPeer.name}</strong>
                          <p className="card__text">ID curt: {activeChatPeer.id.slice(0, 8)}</p>
                        </div>
                        <span className="sdp-insignia">{connectionLabel(activeChatPeer.id)}</span>
                      </div>
                      <div className="devices-panel__accions">
                        {activeChatConnection?.state === 'connected' ? (
                          <button type="button" className="sdp-boto sdp-boto--perill" onClick={() => disconnectPeer(activeChatPeer.id)}>
                            <X size={16} /> <span>Desconnectar</span>
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
                          <MessageSquare size={16} /> <span>{peer.name}</span>
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
                    <input
                      type="text"
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && activeChatConnection?.state === 'connected') {
                          sendMessage(draftMessage);
                        }
                      }}
                      placeholder="Escriu un missatge directe..."
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage(draftMessage)}
                      disabled={activeChatConnection?.state !== 'connected'}
                    >
                      <ArrowRight size={16} /> Enviar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </UniversalPage>
  );
}
