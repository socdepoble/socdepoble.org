/**
 * XatSection.jsx — el Xat sobre AppGridShell (pla 260927_0055 §4.D, DEC-02).
 *
 *   · Rail esquerre plegat per defecte (ClosCaXat), llista al centre amb la
 *     lupa, «Conversa nova», la fila de cerca i les píndoles Tot · No llegits ·
 *     Preferits · Grups que filtren de veres (XAT-A17), i la conversa a la
 *     dreta amb capçalera honesta, separadors de dia, «Carrega'n més»,
 *     bombolles en totes les variants i el compositor.
 *   · L'àmbit el marca `scopeKey` d'useXat() (ARQ-H01): useNotesData() només
 *     queda per a `creaNota` del Retall.
 *   · Tot el text passa per t() amb claus section.xat.* (XAT-P10) i les hores
 *     es formaten amb el locale de la interfície (XAT-P11).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileText, MessageCircle, Search, X } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from '../../app/contexts/RouterContext';
import NotFoundPage from '../../pages/NotFoundPage';
import AppGridColumn from '../../components/layout/AppGridColumn.jsx';
import TextSection from '../text/TextSection';
import { useXat } from './XatContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../notes/NotesDataContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { construeixRetall } from './retall.js';
import { useSEO } from '../../hooks/useSEO';
import { PAGE_COPY } from '../text/pageContent.js';
import ClosCaXat from './components/ClosCaXat.jsx';
import LlistaConverses from './components/LlistaConverses.jsx';
import FilaPersona from './components/FilaPersona.jsx';
import CapcaleraConversa from './components/CapcaleraConversa.jsx';
import Bombolla from './components/Bombolla.jsx';
import SeparadorDia from './components/SeparadorDia.jsx';
import Compositor from './components/Compositor.jsx';
import PanellInicialMobil from './components/PanellInicialMobil.jsx';
import { clauDia } from './temps.js';

/* Els quatre filtres fixos de WhatsApp (XAT-A17): identificador i clau i18n. */
const FILTRES = [
  ['tot', 'section.xat.filtres.tot', 'Tot'],
  ['noLlegits', 'section.xat.filtres.noLlegits', 'No llegits'],
  ['preferits', 'section.xat.filtres.preferits', 'Preferits'],
  ['grups', 'section.xat.filtres.grups', 'Grups']
];
const CAP = Object.freeze([]);
const noop = () => {};
const mai = () => false;

function passaFiltre(fil, filtre) {
  switch (filtre) {
    case 'noLlegits': return (Number(fil.noLlegits) || 0) > 0 || Boolean(fil.noLlegitManual);
    case 'preferits': return Boolean(fil.preferit);
    case 'grups': return fil.tipus === 'grup';
    default: return true;
  }
}

function textDeCerca(fil) {
  return fil.searchText || `${fil.name || fil.title || ''} ${fil.ultimText || ''}`.toLowerCase();
}

/** Clau estable de cada missatge dins de la llista (també per a la tria). */
function clauDe(msg, i) {
  return String(msg.id ?? `pos-${i}`);
}

export default function XatSection() {
  const { scopeKey } = useXat();
  // Padró, cerca, selecció i esborrany del compositor pertanyen al mateix àmbit.
  return <XatWorkspace key={scopeKey ?? 'xat'} />;
}

function XatWorkspace() {
  const mounted = useRef(false);
  useLayoutEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const { showToast } = useToast();
  const { t } = useUIActions();
  const { locale } = useUIState();
  const { pageCopy } = useCoreContent();
  const { creaNota } = useNotesData();

  const { threadId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const connectionContext = params.get('context') || '';
  const contextQuery = connectionContext ? `?context=${encodeURIComponent(connectionContext)}` : '';

  const {
    chatThreads,
    getThreadMessages,
    sendChatMessage,
    obriFil = noop,
    status = 'ready',
    avis = null,
    creaFil,
    cercaMembres,
    totalNoLlegits = 0,
    hiHaMesAntics = mai,
    carregantAntics = mai,
    carregaMesAntics = noop,
    reintenta = noop,
    descartaFallit = noop,
    marcaVist = noop
  } = useXat();

  const titolSeccio = t('section.xat.rail.titol', 'Xat');
  useSEO({
    title: totalNoLlegits > 0 ? `(${totalNoLlegits}) ${titolSeccio}` : titolSeccio,
    description: t('section.xat.subtitle', 'Espai de xat'),
    image: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'
  });

  const [modeNouXat, setModeNouXat] = useState(Boolean(connectionContext));
  const [membres, setMembres] = useState([]);
  const [carregantMembres, setCarregantMembres] = useState(false);
  const [errorMembres, setErrorMembres] = useState(null);
  const [obrintAmb, setObrintAmb] = useState(null);

  const [cercaOberta, setCercaOberta] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtre, setFiltre] = useState('tot');

  const threads = chatThreads || CAP;
  const activeThread = threadId ? threads.find((c) => String(c.id) === threadId) || null : null;
  const filActiuId = activeThread?.id ?? null;

  useEffect(() => {
    obriFil(threadId || null);
  }, [threadId, obriFil]);

  /* El padró del poble: cerca al servidor (XAT-A06) amb un xicotet retard. */
  useEffect(() => {
    if (!modeNouXat) return undefined;
    let viu = true;
    const temporitzador = setTimeout(() => {
      setCarregantMembres(true);
      setErrorMembres(null);
      cercaMembres(searchTerm.trim() || null)
        .then((llista) => { if (viu) setMembres(Array.isArray(llista) ? llista : []); })
        .catch((error) => {
          if (viu) setErrorMembres(error?.message || t('section.xat.padro.error', "No s'ha pogut obrir el padró"));
        })
        .finally(() => { if (viu) setCarregantMembres(false); });
    }, searchTerm ? 250 : 0);
    return () => { viu = false; clearTimeout(temporitzador); };
  }, [modeNouXat, cercaMembres, searchTerm, t]);

  const carregaMes = useCallback(() => {
    if (filActiuId != null) carregaMesAntics(filActiuId);
  }, [filActiuId, carregaMesAntics]);

  const marcaVistActiu = useCallback((seq) => {
    if (filActiuId != null) marcaVist(filActiuId, seq);
  }, [filActiuId, marcaVist]);

  const copiaText = useCallback(async (text) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast(t('section.xat.missatge.copiat', 'Text copiat'), 'success');
      }
    } catch {
      showToast(t('section.xat.missatge.noCopiat', "No s'ha pogut copiar el text"), 'error');
    }
  }, [showToast, t]);

  if (threadId && !activeThread && status === 'ready') {
    return <NotFoundPage />;
  }

  const messages = activeThread ? getThreadMessages(activeThread.id) : CAP;
  const terme = searchTerm.trim().toLowerCase();

  const filsVisibles = threads.filter((fil) => {
    if (fil.arxivat) return false;
    if (!passaFiltre(fil, filtre)) return false;
    if (!terme) return true;
    return textDeCerca(fil).includes(terme);
  });

  const obriConversaAmb = async (membre) => {
    if (obrintAmb) return;
    if (membre.fil_id) {
      setModeNouXat(false);
      setSearchTerm('');
      navigate(`/xat/${encodeURIComponent(membre.fil_id)}${contextQuery}`);
      return;
    }
    setObrintAmb(membre.usuari_id);
    try {
      const filId = await creaFil(membre.usuari_id, null);
      if (!mounted.current) return;
      setModeNouXat(false);
      setSearchTerm('');
      navigate(`/xat/${encodeURIComponent(filId)}${contextQuery}`);
    } catch (error) {
      if (mounted.current) showToast(error?.message || t('section.xat.obrirError', "No s'ha pogut obrir la conversa."), 'error');
    } finally {
      if (mounted.current) setObrintAmb(null);
    }
  };

  const handleSelectThread = (id) => {
    navigate(`/xat/${encodeURIComponent(String(id))}${contextQuery}`);
  };

  const handleBackToList = () => {
    navigate('/xat');
  };

  const alternaNouXat = () => {
    setModeNouXat((obert) => !obert);
    setSearchTerm('');
  };

  const enviaAlBloc = async (triats) => {
    const retall = construeixRetall({ fil: activeThread, missatges: triats, locale });
    try {
      const nota = await creaNota(retall);
      if (!mounted.current) return;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sdp:note-created', { detail: { note: nota } }));
      }
      showToast(t('section.xat.retall.desat', 'Retall guardat al Bloc de Notes.'), 'success');
      navigate(`/notes?nota=${encodeURIComponent(nota.id)}`);
    } catch (error) {
      if (!mounted.current) throw error;
      console.error('[xat] no s\'ha pogut crear el retall:', error);
      showToast(t('section.xat.retall.error', "No s'ha pogut crear la nota. Comprova la connexió i que tingues la sessió iniciada."), 'error');
      throw error;
    }
  };

  const titolLlista = t('section.xat.llista.titol', 'Converses');
  const etiquetaCerca = modeNouXat
    ? t('section.xat.cercaPersona', 'Cerca una persona')
    : t('section.xat.cerca', 'Cerca converses');

  const accioCerca = {
    id: 'search',
    etiqueta: etiquetaCerca,
    icona: Search,
    pressed: cercaOberta,
    onAcciona: () => setCercaOberta((oberta) => !oberta)
  };
  /* El botó primari: «Conversa nova» (aria-label «Nova conversa», que
     App.test.jsx exigix) o «Torna» quan el padró està obert. */
  const accioNova = modeNouXat
    ? {
      id: 'nova',
      variant: 'primary',
      label: t('section.xat.torna', 'Torna'),
      etiqueta: t('section.xat.tornaConverses', 'Torna a les converses'),
      pressed: true,
      onAcciona: alternaNouXat
    }
    : {
      id: 'nova',
      variant: 'primary',
      label: t('section.xat.novaConversa', 'Conversa nova'),
      etiqueta: t('section.xat.novaConversaAria', 'Nova conversa'),
      pressed: false,
      onAcciona: alternaNouXat
    };

  let estatBuit = null;
  if (terme) estatBuit = t('section.xat.buit.cerca', 'Cap conversa amb eixe nom.');
  else if (filtre !== 'tot') estatBuit = t('section.xat.buit.filtre', 'Cap conversa amb este filtre.');
  else {
    estatBuit = (
      <>
        <strong>{t('section.xat.buit.titol', 'Encara no tens cap conversa')}</strong>
        <p>{t('section.xat.buit.text', 'Prem «Conversa nova» per a triar amb qui vols parlar.')}</p>
      </>
    );
  }

  const middleColumn = (
    <aside className="sdp-workspace-column" aria-label={titolLlista}>
      <AppGridColumn esDark={true} titol={titolLlista} icona={MessageCircle} />
      <AppGridColumn esDark="intens" startActions={[accioCerca]} endActions={[accioNova]} />
      {cercaOberta ? (
        <div className="sdp-xat-cerca">
          <label className="sdp-xat-cerca__camp">
            <span className="sdp-nomes-lector">{etiquetaCerca}</span>
            <Search size={18} aria-hidden="true" focusable="false" />
            <input
              autoFocus
              type="search"
              name="xatSearch"
              value={searchTerm}
              placeholder={etiquetaCerca}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="sdp-xat-icona"
            aria-label={t('section.xat.tancaCerca', 'Tanca la cerca')}
            onClick={() => { setCercaOberta(false); setSearchTerm(''); }}
          >
            <X size={20} aria-hidden="true" focusable="false" />
          </button>
        </div>
      ) : null}
      {!modeNouXat ? (
        <div className="sdp-xat-filtres" role="group" aria-label={t('section.xat.filtres.etiqueta', 'Filtra les converses')}>
          {FILTRES.map(([id, clau, alternativa]) => (
            <button
              key={id}
              type="button"
              className="sdp-xat-pindola"
              aria-pressed={filtre === id}
              onClick={() => setFiltre(id)}
            >
              {t(clau, alternativa)}
            </button>
          ))}
        </div>
      ) : null}
      <div className="sdp-workspace-column__body">
        {modeNouXat ? (
          <>
            {carregantMembres ? (
              <p className="sdp-workspace-state" role="status" aria-live="polite">{t('section.xat.padro.carregant', 'Carregant la gent del poble…')}</p>
            ) : null}
            {errorMembres ? (
              <div className="sdp-workspace-state" role="alert">
                <strong>{t('section.xat.padro.error', "No s'ha pogut obrir el padró")}</strong>
                <p>{errorMembres}</p>
              </div>
            ) : null}
            {!carregantMembres && !errorMembres && membres.length === 0 ? (
              <p className="sdp-workspace-state" role="status">
                {terme
                  ? t('section.xat.padro.capNom', 'Cap veí amb eixe nom.')
                  : t('section.xat.padro.buit', 'Encara no hi ha ningú més al poble amb qui parlar.')}
              </p>
            ) : null}
            {membres.length ? (
              <ul className="sdp-xat-llista" aria-label={t('section.xat.padro.titol', 'Gent del poble')}>
                {membres.map((m) => (
                  <li key={m.usuari_id}>
                    <FilaPersona membre={m} obrint={obrintAmb === m.usuari_id} onSelect={obriConversaAmb} t={t} />
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <LlistaConverses
            fils={filsVisibles}
            filActiuId={threadId || null}
            onSelect={handleSelectThread}
            locale={locale}
            t={t}
            estatBuit={estatBuit}
            avis={avis}
            carregant={status !== 'ready' && !threads.length}
          />
        )}
      </div>
    </aside>
  );

  const rightColumn = (
    <>
      <PanellInicialMobil llistaPrimer={!threadId} />
      {activeThread ? (
        <Conversa
          key={activeThread.id}
          initialText={connectionContext}
          fil={activeThread}
          messages={messages}
          onSendMessage={sendChatMessage}
          onBack={handleBackToList}
          onEnviaAlBloc={enviaAlBloc}
          onCopia={copiaText}
          hiHaMes={Boolean(hiHaMesAntics(activeThread.id))}
          carregantMes={Boolean(carregantAntics(activeThread.id))}
          onCarregaMes={carregaMes}
          onReintenta={reintenta}
          onDescarta={descartaFallit}
          onMarcaVist={marcaVistActiu}
          locale={locale}
          t={t}
        />
      ) : (
        <div className="sdp-xat-buit">
          {pageCopy?.anima || PAGE_COPY?.anima ? (
            <TextSection page={{ ...(pageCopy?.anima || PAGE_COPY.anima), chrome: 'context' }} pageKey="anima" />
          ) : (
            <p className="sdp-workspace-state" role="status">{t('section.xat.selectConversation', 'Selecciona una conversa')}</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <ClosCaXat
      activa="converses"
      middleTitle={titolLlista}
      middleIcon={MessageCircle}
      middleColumn={middleColumn}
      rightColumn={rightColumn}
    />
  );
}

/* ─────────────────────────── La conversa oberta ─────────────────────────── */

function Conversa({
  initialText = '', fil, messages, onSendMessage, onBack, onEnviaAlBloc, onCopia,
  hiHaMes, carregantMes, onCarregaMes, onReintenta, onDescarta, onMarcaVist, locale, t
}) {
  const [text, setText] = useState(initialText);
  const [modeSeleccio, setModeSeleccio] = useState(false);
  const [triats, setTriats] = useState(() => new Set());
  const [creantNota, setCreantNota] = useState(false);
  const llistaRef = useRef(null);
  const sentinellaRef = useRef(null);
  const geometria = useRef({ ultimId: null, primerSeq: null, alcada: 0 });
  const esGrup = fil?.tipus === 'grup';

  /* Scroll: a baix quan arriba un missatge nou; si s'han carregat missatges
     antics per dalt, es conserva la posició de lectura. */
  useLayoutEffect(() => {
    const ol = llistaRef.current;
    if (!ol) return;
    const ultim = messages.length ? messages[messages.length - 1] : null;
    const primer = messages.length ? messages[0] : null;
    const previ = geometria.current;
    const ultimId = ultim?.id ?? null;
    const primerSeq = primer?.seq ?? null;
    if (ultimId !== previ.ultimId) {
      ol.scrollTop = ol.scrollHeight;
    } else if (primerSeq != null && previ.primerSeq != null && primerSeq < previ.primerSeq) {
      ol.scrollTop += ol.scrollHeight - previ.alcada;
    }
    geometria.current = { ultimId, primerSeq, alcada: ol.scrollHeight };
  }, [messages]);

  useEffect(() => {
    setModeSeleccio(false);
    setTriats(new Set());
  }, [fil?.id]);

  /* Carrega automàtica de l'historial en arribar a dalt (XAT-A23). */
  useEffect(() => {
    const node = sentinellaRef.current;
    if (!node || !hiHaMes || carregantMes || typeof IntersectionObserver === 'undefined') return undefined;
    const observador = new IntersectionObserver((entrades) => {
      if (entrades.some((e) => e.isIntersecting)) onCarregaMes();
    }, { root: llistaRef.current });
    observador.observe(node);
    return () => observador.disconnect();
  }, [hiHaMes, carregantMes, onCarregaMes]);

  /* Marcar com a llegit només el que ha entrat en pantalla amb la pestanya
     visible (XAT-C08). El context agrupa i mai fa retrocedir la marca. */
  useEffect(() => {
    const ol = llistaRef.current;
    if (!ol || typeof IntersectionObserver === 'undefined') return undefined;
    const nodes = ol.querySelectorAll('[data-vist]');
    if (!nodes.length) return undefined;
    const observador = new IntersectionObserver((entrades) => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      let maxim = null;
      for (const e of entrades) {
        if (!e.isIntersecting) continue;
        const seq = Number(e.target.getAttribute('data-vist'));
        if (Number.isFinite(seq) && (maxim == null || seq > maxim)) maxim = seq;
      }
      if (maxim != null) onMarcaVist(maxim);
    }, { root: ol, threshold: 0.5 });
    nodes.forEach((n) => observador.observe(n));
    return () => observador.disconnect();
  }, [messages, onMarcaVist]);

  const envia = useCallback(async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    try {
      await onSendMessage(fil, value);
    } catch {
      setText(value);
    }
  }, [text, fil, onSendMessage]);

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
      // El pare ja avisa.
    } finally {
      setCreantNota(false);
    }
  };

  /* Files de la llista: cada canvi de dia posa un separador davant. */
  const files = useMemo(() => {
    const eixida = [];
    let diaPrevi = null;
    messages.forEach((msg, i) => {
      const dia = clauDia(msg.creatAl);
      if (dia && dia !== diaPrevi) {
        eixida.push({ tipus: 'dia', clau: `dia-${dia}`, iso: msg.creatAl });
        diaPrevi = dia;
      }
      eixida.push({ tipus: 'missatge', clau: clauDe(msg, i), msg });
    });
    return eixida;
  }, [messages]);

  return (
    <div className="sdp-xat-conversa">
      <CapcaleraConversa
        fil={fil}
        onTorna={onBack}
        onSeleccionar={() => setModeSeleccio(true)}
        seleccio={modeSeleccio ? { quants: triats.size, onEixir: surtDeSeleccio } : null}
        t={t}
      />

      <ol className="sdp-xat-missatges" ref={llistaRef} aria-live="polite" aria-label={t('section.xat.missatges', 'Missatges')}>
        {hiHaMes ? (
          <li className="sdp-xat-carrega">
            <button type="button" className="sdp-xat-carrega__boto" onClick={onCarregaMes} disabled={carregantMes} aria-busy={carregantMes || undefined}>
              {carregantMes
                ? t('section.xat.carregantAntics', 'Carregant missatges anteriors…')
                : t('section.xat.carregaMes', "Carrega'n més")}
            </button>
          </li>
        ) : null}
        <li className="sdp-xat-sentinella" ref={sentinellaRef} aria-hidden="true" />
        {messages.length === 0 ? (
          <li className="sdp-xat-conversa-buida">{t('section.xat.conversaBuida', 'Cap missatge encara. Inicia la conversa!')}</li>
        ) : null}
        {files.map((fila) => (
          fila.tipus === 'dia'
            ? <SeparadorDia key={fila.clau} iso={fila.iso} locale={locale} t={t} />
            : (
              <Bombolla
                key={fila.clau}
                missatge={fila.msg}
                esGrup={esGrup}
                locale={locale}
                t={t}
                seleccio={modeSeleccio ? { actiu: true, triat: triats.has(fila.clau), onAlterna: () => alterna(fila.clau) } : null}
                onReintenta={onReintenta}
                onDescarta={onDescarta}
                onCopia={onCopia}
              />
            )
        ))}
      </ol>

      {modeSeleccio ? (
        <div className="sdp-xat-compositor sdp-xat-compositor--seleccio">
          <button
            type="button"
            className="sdp-xat-accio-bloc"
            onClick={enviaAlBloc}
            disabled={triats.size === 0 || creantNota}
            aria-busy={creantNota || undefined}
          >
            <FileText size={20} aria-hidden="true" focusable="false" />
            <span>{creantNota ? t('section.xat.seleccio.creant', 'Creant la nota…') : t('section.xat.seleccio.enviaBloc', 'Enviar al Bloc de Notes')}</span>
          </button>
        </div>
      ) : (
        <Compositor valor={text} onCanvia={setText} onEnvia={envia} t={t} />
      )}
    </div>
  );
}
