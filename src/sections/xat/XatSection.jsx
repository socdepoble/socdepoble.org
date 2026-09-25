import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Search, ArrowLeft, Send, Image as ImageIcon, Settings, X, Plus, Video, Phone, MoreHorizontal, FileText, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from '../../app/contexts/RouterContext';
import NotFoundPage from '../../pages/NotFoundPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import TextSection from '../text/TextSection';
import { useXat } from './XatContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../notes/NotesDataContext';

import { useToast } from '@/components/universal/NotificationContext.jsx';
import { construeixRetall } from './retall.js';
import { useSEO } from '../../hooks/useSEO';
import { PAGE_COPY } from '../text/pageContent.js';
import { Avatar } from '../../components/PedraSeca';


export default function XatSection() {
  const { workspaceKey } = useNotesData();
  // Padró, cerca, selecció i esborrany del compositor pertanyen al mateix àmbit.
  return <XatWorkspace key={workspaceKey} />;
}

function XatWorkspace() {
  const mounted = useRef(false);
  useLayoutEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const { showToast } = useToast();
  const { t } = useUIActions();
  const { language } = useUIState();
  const { pageCopy } = useCoreContent();
  const { creaNota } = useNotesData();

  const { threadId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const connectionContext = params.get('context') || '';
  const contextQuery = connectionContext ? `?context=${encodeURIComponent(connectionContext)}` : '';

  useSEO({
    title: t('section.xat.title', 'Xat'),
    description: t('section.xat.subtitle', 'Espai de xat'),
    image: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'
  });

  const {
    chatThreads,
    getThreadMessages,
    sendChatMessage,
    obriFil = () => {},
    status = 'ready',
    avis = null,
    creaFil,
    cercaMembres
  } = useXat();

  const [modeNouXat, setModeNouXat] = useState(Boolean(connectionContext));
  const [membres, setMembres] = useState([]);
  const [carregantMembres, setCarregantMembres] = useState(false);
  const [errorMembres, setErrorMembres] = useState(null);
  const [obrintAmb, setObrintAmb] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('totes');

  const threads = chatThreads || [];

  const activeThread = threadId
    ? threads.find(c => String(c.id) === threadId)
    : null;

  const base = '';

  useEffect(() => {
    obriFil(threadId || null);
  }, [threadId, obriFil]);

  useEffect(() => {
    if (!modeNouXat) return undefined;
    let viu = true;
    setCarregantMembres(true);
    setErrorMembres(null);
    cercaMembres(null)
      .then((llista) => { if (viu) setMembres(Array.isArray(llista) ? llista : []); })
      .catch((error) => {
        if (viu) setErrorMembres(error?.message || "No s'ha pogut carregar la llista del poble.");
      })
      .finally(() => { if (viu) setCarregantMembres(false); });
    return () => { viu = false; };
  }, [modeNouXat, cercaMembres]);

  if (threadId && !activeThread && status === 'ready') {
    return <NotFoundPage />;
  }

  const messages = activeThread ? getThreadMessages(activeThread.id) : [];

  const filteredThreads = threads.filter((th) => {
    if (!searchTerm) return true;
    const name = th.nom || th.other_user_name || 'Desconegut';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const membresFiltrats = membres.filter((m) => {
    if (!searchTerm) return true;
    return (m.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const obriConversaAmb = async (membre) => {
    if (obrintAmb) return;
    if (membre.fil_id) {
      setModeNouXat(false);
      setSearchTerm('');
      navigate(`${base}/xat/${encodeURIComponent(membre.fil_id)}${contextQuery}`);
      return;
    }
    setObrintAmb(membre.usuari_id);
    try {
      const filId = await creaFil(membre.usuari_id, null);
      if (!mounted.current) return;
      setModeNouXat(false);
      setSearchTerm('');
      navigate(`${base}/xat/${encodeURIComponent(filId)}${contextQuery}`);
    } catch (error) {
      if (mounted.current) showToast(error?.message || "No s'ha pogut obrir la conversa.", 'error');
    } finally {
      if (mounted.current) setObrintAmb(null);
    }
  };

  const handleSelectThread = (id) => {
    navigate(`${base}/xat/${encodeURIComponent(String(id))}${contextQuery}`);
  };

  const handleBackToList = () => {
    navigate(`${base}/xat`);
  };

  const enviaAlBloc = async (triats) => {
    const retall = construeixRetall({
      fil: activeThread,
      missatges: triats,
      locale: language === 'ca' ? 'ca-ES' : 'es-ES'
    });

    try {
      const nota = await creaNota(retall);
      if (!mounted.current) return;
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sdp:note-created', { detail: { note: nota } }));
      }
      
      showToast('Retall guardat al Bloc de Notes.', 'success');
      navigate(`${base}/notes?nota=${encodeURIComponent(nota.id)}`);
    } catch (error) {
      if (!mounted.current) throw error;
      console.error('[xat] no s\'ha pogut crear el retall:', error);
      showToast("No s'ha pogut crear la nota. Comprova la connexió i que tingues la sessió iniciada.", 'error');
      throw error;
    }
  };

  const config = {
    title: t('section.xat.kicker', 'Xat'),
    subtitle: t('section.xat.title', 'Converses'),
    lead: t('section.xat.subtitle', 'Connecta amb els veïns i grups del poble.'),
    chrome: "system",
    showLogos: true
  };

  return (
    <ContentProvider initialConfig={config}>
      <div className="xat-layout">

        <aside className={`xat-sidebar ${threadId ? 'd-desktop-only' : ''}`}>
          <header className="xat-sidebar-header">
            <div className="search-bar-basic">
              <Search size={18} color="currentColor" className="search-icon" />
              <input
                id="xat-search"
                name="xatSearch"
                type="text"
                placeholder={modeNouXat ? 'CERCA UNA PERSONA...' : 'CERCA UN XAT...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="xat-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Netejar cerca"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="sdp-boto sdp-boto--fantasma"
              aria-label={modeNouXat ? 'Cancel·lar la conversa nova' : 'Nova conversa'}
              aria-pressed={modeNouXat}
              onClick={() => { setModeNouXat((obert) => !obert); setSearchTerm(''); }}
            >
              {modeNouXat
                ? <X size={24} color="var(--sdp-sobre-accio)" aria-hidden="true" />
                : <Plus size={24} color="var(--sdp-sobre-accio)" aria-hidden="true" />}
            </button>
            {/* Sense embolcall: .sdp-alerta__accions és la botonera d'una Alerta i
                porta margin-top; baixava la roda 12px respecte del «+».
                --sdp-sobre-accio: blanc en clar i en fosc (--sdp-text-invers
                es torna quasi negre en fosc damunt del blau). */}
            <button
              type="button"
              className="sdp-boto sdp-boto--fantasma"
              aria-label="Control General del Xat"
              onClick={() => navigate(`${base}/control-xat`)}
            >
              <Settings size={24} color="var(--sdp-sobre-accio)" aria-hidden="true" />
            </button>
          </header>

          <div className="xat-filters">
            <button className={`btn-taronja-fort ${activeFilter === 'totes' ? 'active' : ''}`} onClick={() => setActiveFilter('totes')}>Tot</button>
            <button className={`btn-taronja-fort ${activeFilter === 'no-llegits' ? 'active' : ''}`} onClick={() => setActiveFilter('no-llegits')}>No llegit</button>
            <button className={`btn-taronja-fort ${activeFilter === 'grups' ? 'active' : ''}`} onClick={() => setActiveFilter('grups')}>Grups</button>
            <button className={`btn-taronja-fort ${activeFilter === 'iaies' ? 'active' : ''}`} onClick={() => setActiveFilter('iaies')}>IAIES</button>
            <button className="btn-taronja-fort btn-taronja-fort--icon" aria-label="Afegir filtre"><Plus size={16} /></button>
          </div>

          <div className="xat-list">
            {modeNouXat ? (
              <>
                {carregantMembres && (
                  <div className="xat-item" role="status">
                    <div className="xat-item-content">
                      <div className="xat-item-preview">Carregant la gent del poble…</div>
                    </div>
                  </div>
                )}
                {errorMembres && (
                  <div className="xat-item" role="status">
                    <div className="xat-item-content">
                      <div className="xat-item-title">No s'ha pogut obrir el padró</div>
                      <div className="xat-item-preview">{errorMembres}</div>
                    </div>
                  </div>
                )}
                {!carregantMembres && !errorMembres && membresFiltrats.length === 0 && (
                  <div className="xat-item" role="status">
                    <div className="xat-item-content">
                      <div className="xat-item-preview">
                        {searchTerm
                          ? 'Cap veí amb eixe nom.'
                          : 'Encara no hi ha ningú més al poble amb qui parlar.'}
                      </div>
                    </div>
                  </div>
                )}
                {membresFiltrats.map((m) => (
                  <div
                    key={m.usuari_id}
                    className="xat-item"
                    role="button"
                    tabIndex={0}
                    aria-busy={obrintAmb === m.usuari_id}
                    onClick={() => obriConversaAmb(m)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); obriConversaAmb(m); }
                    }}
                  >
                    <Avatar nom={m.nom} mida="md" />
                    <div className="xat-item-content">
                      <div className="xat-item-header">
                        <span className="xat-item-title">{m.nom}</span>
                        <span className="xat-item-time">
                          {obrintAmb === m.usuari_id ? 'Obrint…' : (m.fil_id ? 'Obrir' : 'Nou')}
                        </span>
                      </div>
                      <div className="xat-item-preview">
                        {m.fil_id ? 'Ja teniu una conversa oberta.' : 'Encara no heu parlat.'}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
            {avis && (
              <div className="xat-item" role="status">
                <div className="xat-item-content">
                  <div className="xat-item-title">No s'ha pogut carregar el xat</div>
                  <div className="xat-item-preview">{avis}</div>
                </div>
              </div>
            )}
            {!avis && filteredThreads.length === 0 && status === 'ready' && (
              <div className="xat-item" role="status">
                <div className="xat-item-content">
                  <div className="xat-item-title">Encara no tens cap conversa</div>
                  <div className="xat-item-preview">
                    Prem el botó + de dalt per a triar amb qui vols parlar.
                  </div>
                </div>
              </div>
            )}
            {filteredThreads.map((th) => (
              <div
                key={th.id}
                className={`xat-item ${threadId === String(th.id) ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectThread(th.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectThread(th.id);
                  }
                }}
              >
                <Avatar nom={th.name || th.title} src={th.avatar_url} mida="md" />
                <div className="xat-item-content">
                  <div className="xat-item-header">
                    <span className="xat-item-title">{th.name || th.title}</span>
                    <span className="xat-item-time">{th.lastMessageTime || 'Ahir'}</span>
                  </div>
                  <div className="xat-item-preview">
                    {th.lastMessagePreview || 'Cap missatge.'}
                  </div>
                </div>
              </div>
            ))}
              </>
            )}
          </div>
        </aside>

        <div className={`xat-main ${!threadId ? 'd-desktop-only' : ''}`}>
          {activeThread ? (
            <ChatConversation
              key={activeThread.id}
              initialText={connectionContext}
              thread={activeThread}
              messages={messages}
              onSendMessage={sendChatMessage}
              onBack={handleBackToList}
              onEnviaAlBloc={enviaAlBloc}
            />
          ) : (
            <div className="xat-scroll-area">
              {pageCopy?.['anima'] || PAGE_COPY?.['anima'] ? (
                <TextSection page={{...(pageCopy?.['anima'] || PAGE_COPY['anima']), chrome: 'context'}} pageKey="anima" />
              ) : (
                <div className="xat-empty-message">
                  <img src="/assets/system/ui/logo-socdepoble-rect-blanc.svg" alt="Sóc de Poble" />
                  <h2>Sóc de Poble Desktop</h2>
                  <p>Selecciona una conversa per començar a xatejar amb la gent de La Torre.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </ContentProvider>
  );
}

function ChatConversation({ initialText = '', thread, messages, onSendMessage, onBack, onEnviaAlBloc }) {
  const [text, setText] = useState(initialText);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modeSeleccio, setModeSeleccio] = useState(false);
  const [triats, setTriats] = useState(() => new Set());
  const [creantNota, setCreantNota] = useState(false);
  const chatLogRef = useRef(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setModeSeleccio(false);
    setTriats(new Set());
  }, [thread?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;

    setText('');
    try {
      await onSendMessage(thread, value);
    } catch {
      setText(value);
    }
  };

  const clauDe = (msg, i) => String(msg.id ?? `pos-${i}`);

  const alterna = (clau) => {
    setTriats((previs) => {
      const nous = new Set(previs);
      if (nous.has(clau)) nous.delete(clau);
      else nous.add(clau);
      return nous;
    });
  };

  const surtDeSeleccio = () => {
    setModeSeleccio(false);
    setTriats(new Set());
  };

  const enviaAlBloc = async () => {
    if (creantNota) return;
    const tria = messages.filter((m, i) => triats.has(clauDe(m, i)));
    if (tria.length === 0) return;

    setCreantNota(true);
    try {
      await onEnviaAlBloc(tria);
      surtDeSeleccio();
    } catch {
      // Pare ja avisa
    } finally {
      setCreantNota(false);
    }
  };

  return (
    <>
      {modeSeleccio ? (
        <header className="xat-main-header xat-main-header--seleccio">
          <button type="button" className="xat-header-btn" onClick={surtDeSeleccio} aria-label="Eixir de la selecció">
            <X size={24} color="currentColor" />
          </button>
          <strong className="xat-header-info" aria-live="polite">
            {triats.size === 0 ? 'Tria els missatges' : `${triats.size} triat${triats.size === 1 ? '' : 's'}`}
          </strong>
        </header>
      ) : (
        <header className="xat-main-header">
          <button className="sdp-boto sdp-boto--fantasma d-mobile-only" onClick={onBack} aria-label="Tornar">
            <ArrowLeft size={24} color="var(--sdp-text-invers)" />
          </button>
          <Avatar nom={thread?.name || thread?.title} src={thread?.avatar_url} mida="sm" />
          <div className="xat-header-info">
            <strong>{thread?.name || thread?.title}</strong>
            <span className="xat-header-subtitle">Prem ací per a més informació</span>
          </div>
          <div className="xat-header-actions">
            <button className="xat-header-btn" disabled aria-label="Videotrucada (no disponible)"><Video size={20} color="currentColor" /></button>
            <button className="xat-header-btn" disabled aria-label="Trucada de veu (no disponible)"><Phone size={20} color="currentColor" /></button>
            <div className="xat-header-menu">
              <button className={`xat-header-btn ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={20} color="currentColor" /></button>
              {menuOpen && (
                <div className="xat-header-dropdown">
                  <button className="sdp-dropdown-item">Info. del contacte</button>
                  <button className="sdp-dropdown-item">Cercar</button>
                  <hr className="xat-divider" />
                  <button
                    type="button"
                    className="sdp-dropdown-item"
                    onClick={() => { setModeSeleccio(true); setMenuOpen(false); }}
                  >
                    Seleccionar missatges
                  </button>
                  <button className="sdp-dropdown-item">Silenciar</button>
                  <hr className="xat-divider" />
                  <button className="sdp-dropdown-item">Nova telefonada en grup</button>
                  <button className="sdp-dropdown-item">Enviar enllaç de telefonada</button>
                  <button className="sdp-dropdown-item">Programar telefonada</button>
                  <hr className="xat-divider" />
                  <button className="sdp-dropdown-item">Obrir en una finestra nova</button>
                  <button className="sdp-dropdown-item sdp-dropdown-item--danger">Tancar xat</button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="xat-messages" ref={chatLogRef}>
        {messages.length === 0 && (
          <div className="xat-empty">
            Cap missatge encara. Inicia la conversa!
          </div>
        )}
        {messages.map((msg, i) => {
          const clau = clauDe(msg, i);
          const triat = triats.has(clau);
          const classes = [
            'sdp-chat-bubble',
            msg.sender === 'me' ? 'sdp-chat-bubble--user' : 'sdp-chat-bubble--ai',
            modeSeleccio ? 'sdp-chat-bubble--triable' : '',
            triat ? 'sdp-chat-bubble--triat' : ''
          ].filter(Boolean).join(' ');

          return (
            <div
              key={clau}
              className={`${classes} ${modeSeleccio ? 'xat-bubble-wrapper' : 'xat-bubble-wrapper--block'}`}
              role={modeSeleccio ? 'checkbox' : undefined}
              aria-checked={modeSeleccio ? triat : undefined}
              tabIndex={modeSeleccio ? 0 : undefined}
              onClick={modeSeleccio ? () => alterna(clau) : undefined}
              onKeyDown={modeSeleccio ? (e) => {
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); alterna(clau); }
              } : undefined}
            >
              {modeSeleccio && (
                <span className="xat-marca-tria" aria-hidden="true">
                  {triat ? <CheckCircle2 size={18} color="var(--sdp-accio)" /> : <Circle size={18} color="var(--sdp-text-suau)" />}
                </span>
              )}
              <div className="xat-bubble-content">
                {msg.sender !== 'me' && !msg.is_ai && (
                  <div className="xat-sender-name">
                    {msg.author || msg.author_name || 'Usuari'}
                  </div>
                )}
                <div>{msg.text ?? msg.content ?? ''}</div>
                <div className="sdp-chat-bubble-meta">
                  {msg.time_label || ''}{msg.estatEnviament === 'pendent' ? ' · enviant…' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modeSeleccio ? (
        <div className="xat-composer xat-composer--seleccio">
          <button
            type="button"
            className="xat-accio-bloc"
            onClick={enviaAlBloc}
            disabled={triats.size === 0 || creantNota}
          >
            <FileText size={20} />
            <span>{creantNota ? 'Creant la nota…' : 'Enviar al Bloc de Notes'}</span>
          </button>
        </div>
      ) : (
        <form className="xat-composer" onSubmit={handleSubmit}>
          <button type="button" className="sdp-boto sdp-boto--fantasma" aria-label="Adjuntar">
            <ImageIcon size={24} color="var(--sdp-text-suau)" />
          </button>
          <div className="xat-input-wrap">
            <input
              id="xat-message-input"
              name="message"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escriu un missatge..."
              aria-label="Escriu un missatge"
            />
          </div>
          <button type="submit" className="xat-send-btn" aria-label="Enviar missatge">
            <Send size={18} />
          </button>
        </form>
      )}
    </>
  );
}
