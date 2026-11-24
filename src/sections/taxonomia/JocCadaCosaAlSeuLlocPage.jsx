/* Pàgina pública canònica i Joc Viu «Cada Cosa al Seu Lloc» (IDEA-348 · R32.86).
 * Rutes: /cada-cosa-al-seu-lloc, /joc-taxonomia i /page/cada-cosa-al-seu-lloc.
 * Arquitectura Pedra Seca 2.0 (feedback directe del Mestre 16:30 CET):
 *   1. Embolcall <UniversalPage showLogos={true}> amb BarraBlava, BarraTaronja, H1, H2, entradilla i Escolta la IAIA.
 *   2. Organisme del Joc Pedra Seca (QuadreDeComandament + 4 modes sincronitzats + Pantalla completa + Importador).
 *   3. Explicació editorial a sota com a prosa normal (.cms-preview) a tota amplària començant directament en <h3>.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { desplacaASeccio } from '../../components/universal/PageFrame.jsx';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import {
  Boto,
  Insignia,
  QuadreDeComandament,
  UniversalCard,
  fraccioQuadre,
} from '../../components/PedraSeca';
import { resolveAsset } from '../../config/assetResolver.js';
import { useElementFullscreen } from '../../hooks/useElementFullscreen.js';
import { useSEO } from '../../hooks/useSEO';
import { useFullDiferit } from '../../config/fullDiferit.js';
import { CAP_SOCIAL_BASE } from '../../config/imatgeSocial.js';
import { metadadesDePagina } from '../../config/metadadesSocials.js';
import { opcionsDeLaImatgeSocial } from '../../config/opcionsImatgeSocial.js';
import { lliuraCompartit } from '../../config/compartirNatiu.js';
import { etiquetesDePaginaPublica } from '../../data/taxonomia/classificacioPaginesPubliques.js';
import { PAGINA_CADA_COSA_AL_SEU_LLOC } from '../text/pageContent.cadaCosaAlSeuLloc.js';
import cssJocTaxonomia from '../../css/diferit-joc-taxonomia.css?inline';
import { obtinTextosJoc } from './i18nJocCadaCosa.js';
import {
  TRONCS_MONS_2,
  LLAVOR_RAPIDA_JOC,
  creaEstatInicialJoc,
  hidrataCorpusCompletEnEstat,
  desaEstatJoc,
  reiniciaEstatJoc,
  buidaExempleSocDePoble,
  restauraExempleSocDePoble,
  desfesUltimaAccio,
  assignarCartaACategoria,
  mutarRolConcepte,
  canviaTroncConcepte,
  crearConcepteNou,
  moureConcepte2D,
  traureManetaPerJugar,
  aplicarSuggerimentsPendents,
  importaContingutUniversal,
  candidatsFeedDeUrlWeb,
  exportaInstantaniaJson,
  exportaOpmlRss,
  generaPropostaCiutadana,
  urlSeguraExterna,
} from './jocCadaCosaModel.js';

const MODES_IDS = Object.freeze(['carta', 'pissarra', 'rss', 'equilibri']);

const EXEMPLE_CARPETA_REVISAR = [
  'Recursos/Apunts_botanica_herbes_remedieres_mariola.pdf',
  'Revisar_2026/Proposta_custodia_agraria_contra_incendis.docx',
  'Revisar_2026/Recepta_tradicional_olleta_de_blat_muro.md',
  'Tecnologia/Guia_configuracio_lector_rss_i_fedivers_local.pdf',
  'Patrimoni/Inventari_casetes_de_pedra_seca_serra_dels_plans.xlsx',
].join('\n');

/** Converteix etiquetes controlades (<strong>, <em>, <a href>) del diccionari propi en JSX segur */
function renderProsaControlada(htmlText) {
  const parts = [];
  const tokenRegex = /(<a\s+href="([^"]+)"><strong>([^<]+)<\/strong><\/a>|<strong>([^<]+)<\/strong>|<em>([^<]+)<\/em>)/g;
  let cursor = 0;
  let match;
  let k = 0;
  while ((match = tokenRegex.exec(htmlText)) !== null) {
    if (match.index > cursor) {
      parts.push(htmlText.slice(cursor, match.index));
    }
    if (match[2] && match[3]) {
      parts.push(
        <Link key={`lk-${k}`} to={match[2]}>
          <strong>{match[3]}</strong>
        </Link>
      );
    } else if (match[4]) {
      parts.push(<strong key={`st-${k}`}>{match[4]}</strong>);
    } else if (match[5]) {
      parts.push(<em key={`em-${k}`}>{match[5]}</em>);
    }
    cursor = match.index + match[0].length;
    k += 1;
  }
  if (cursor < htmlText.length) {
    parts.push(htmlText.slice(cursor));
  }
  return parts;
}

/** Node espacial 2D sense atribut style en JSX (sincronitza left/top per ref i suporta punter + teclat) */
function NodePissarra2D({
  concepte,
  recompte,
  seleccionat,
  tx,
  pissarraRef,
  onSelecciona,
  onMou2D,
  onMutaRol,
  onCanviaMon,
}) {
  const nodeRef = useRef(null);
  const dragRef = useRef(null);

  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    el.style.left = `${concepte.x}%`;
    el.style.top = `${concepte.y}%`;
  }, [concepte.x, concepte.y]);

  const iniciaArrossegament = (ev) => {
    if (ev.target.closest('button')) return;
    const contenidor = pissarraRef.current;
    const el = nodeRef.current;
    if (!contenidor || !el) return;
    const rect = contenidor.getBoundingClientRect();
    dragRef.current = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      origX: concepte.x,
      origY: concepte.y,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
    el.setPointerCapture?.(ev.pointerId);
  };

  const mouArrossegament = (ev) => {
    const act = dragRef.current;
    if (!act || act.pointerId !== ev.pointerId) return;
    const dxPct = ((ev.clientX - act.startX) / act.width) * 100;
    const dyPct = ((ev.clientY - act.startY) / act.height) * 100;
    onMou2D(concepte.id, act.origX + dxPct, act.origY + dyPct);
  };

  const acabaArrossegament = (ev) => {
    const act = dragRef.current;
    if (!act || act.pointerId !== ev.pointerId) return;
    dragRef.current = null;
    nodeRef.current?.releasePointerCapture?.(ev.pointerId);
  };

  const mouAmbTeclat = (ev) => {
    if (ev.target.tagName === 'BUTTON') return;
    const pas = ev.shiftKey ? 6 : 3;
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      onMou2D(concepte.id, concepte.x - pas, concepte.y);
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      onMou2D(concepte.id, concepte.x + pas, concepte.y);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      onMou2D(concepte.id, concepte.x, concepte.y - pas);
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      onMou2D(concepte.id, concepte.x, concepte.y + pas);
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      if (concepte.rol === 'categoria') {
        ev.preventDefault();
        onSelecciona(concepte.id);
      }
    }
  };

  const classeNode =
    concepte.rol === 'categoria'
      ? 'sdp-joc-lloc__node-2d sdp-joc-lloc__node-2d--categoria'
      : 'sdp-joc-lloc__node-2d sdp-joc-lloc__node-2d--etiqueta';

  const altreTronc =
    concepte.troncId === 'tecnologia' ? 'natura-i-patrimoni' : 'tecnologia';

  return (
    <article
      ref={nodeRef}
      tabIndex={0}
      aria-label={`${concepte.label} (${recompte})`}
      data-concepte-id={concepte.id}
      data-concepte-rol={concepte.rol}
      className={classeNode}
      onClick={() => {
        if (concepte.rol === 'categoria') onSelecciona(concepte.id);
      }}
      onPointerDown={iniciaArrossegament}
      onPointerMove={mouArrossegament}
      onPointerUp={acabaArrossegament}
      onPointerCancel={acabaArrossegament}
      onKeyDown={mouAmbTeclat}
    >
      <strong>
        {concepte.rol === 'etiqueta' ? `#${concepte.label}` : concepte.label}{' '}
        {concepte.rol === 'categoria' ? `(${recompte})` : ''}
        {seleccionat ? ' ✓' : ''}
      </strong>
      <div className="sdp-joc-lloc__node-accions">
        <Boto
          varietat="secundari"
          onClick={(ev) => {
            ev.stopPropagation();
            onMutaRol(concepte.id);
          }}
        >
          {concepte.rol === 'categoria' ? tx.fesEtiqueta : tx.fesCategoria}
        </Boto>
        <Boto
          varietat="secundari"
          onClick={(ev) => {
            ev.stopPropagation();
            onCanviaMon(concepte.id, altreTronc);
          }}
        >
          {tx.canviaMon}
        </Boto>
      </div>
    </article>
  );
}

function descarregaArxiuLocal(nomFitxer, contingut, mimeType) {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return;
  const blob = new Blob([contingut], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFitxer;
  a.rel = 'noopener';
  /* Enllaç despenjat (Llei 06), com descarregaPaquet de detallPobleModel.js:
     el clic no necessita penjar-lo del document. */
  try { a.click(); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

export default function JocCadaCosaAlSeuLlocPage() {
  const uiState = useUIStateOpcional();
  const sessio = useSessioOpcional();
  const navigate = useNavigate();
  const idiomaRaw = String(uiState?.language || 'ca').toLowerCase().slice(0, 2);
  const idioma = ['ca', 'es', 'en', 'eu', 'gl'].includes(idiomaRaw) ? idiomaRaw : 'ca';
  const tx = obtinTextosJoc(idioma);
  const userId = sessio?.user?.id || null;

  const { elementRef, isFullscreen, toggleFullscreen } = useElementFullscreen();
  useFullDiferit(elementRef, 'joc-taxonomia', cssJocTaxonomia);

  const historiaRef = useRef(null);

  const paginaLocalitzada = useMemo(() => {
    const tr = idioma !== 'ca' ? PAGINA_CADA_COSA_AL_SEU_LLOC.translations?.[idioma] : null;
    return tr ? { ...PAGINA_CADA_COSA_AL_SEU_LLOC, ...tr } : PAGINA_CADA_COSA_AL_SEU_LLOC;
  }, [idioma]);

  const etiquetesCapcalera = useMemo(
    () => etiquetesDePaginaPublica('cada-cosa-al-seu-lloc', [], idioma),
    [idioma]
  );

  const metaSeo = useMemo(() => {
    const m = metadadesDePagina(paginaLocalitzada, opcionsDeLaImatgeSocial());
    return { ...m, image: m.image || resolveAsset(CAP_SOCIAL_BASE.image.url) };
  }, [paginaLocalitzada]);

  useSEO({
    title: metaSeo.title,
    description: metaSeo.description,
    image: metaSeo.image,
    canonical: '/cada-cosa-al-seu-lloc',
  });

  const corpusCompletRef = useRef(LLAVOR_RAPIDA_JOC);
  const [estat, setEstat] = useState(() => creaEstatInicialJoc(LLAVOR_RAPIDA_JOC, userId));
  const [modeActiu, setModeActiu] = useState('carta');
  const [panellObert, setPanellObert] = useState(null);
  const [indexCarta, setIndexCarta] = useState(0);
  const [cercaText, setCercaText] = useState('');
  const [nomesRevisar, setNomesRevisar] = useState(true);
  const [catSeleccionada2D, setCatSeleccionada2D] = useState('defensa-territori');
  const [nouNomConcepte, setNouNomConcepte] = useState('');
  const [nouRolConcepte, setNouRolConcepte] = useState('categoria');
  const [nouTroncConcepte, setNouTroncConcepte] = useState('natura-i-patrimoni');
  const [idCartaComparador, setIdCartaComparador] = useState('');
  const [textImportar, setTextImportar] = useState('');
  const [urlWebImportar, setUrlWebImportar] = useState('');
  const [autoClassificarImport, setAutoClassificarImport] = useState(false);
  const [notaProposta, setNotaProposta] = useState('');
  const [avisFeedback, setAvisFeedback] = useState('');

  const pissarraRef = useRef(null);
  const tabRefs = useRef({});
  const dragRssItemIdRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    import('../../data/taxonomia/corpusJoc600.js')
      .then((mod) => {
        if (cancel || !Array.isArray(mod?.CORPUS_JOC_600)) return;
        corpusCompletRef.current = mod.CORPUS_JOC_600;
        setEstat((prev) => hidrataCorpusCompletEnEstat(prev, mod.CORPUS_JOC_600));
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  const mutaIDesa = useCallback(
    (productor) => {
      setEstat((prev) => {
        const seg = typeof productor === 'function' ? productor(prev) : productor;
        desaEstatJoc(seg, userId);
        return seg;
      });
    },
    [userId]
  );

  const categoriesVives = useMemo(
    () => estat.conceptes.filter((c) => c.rol === 'categoria'),
    [estat.conceptes]
  );

  const recomptePerCat = useMemo(() => {
    const mapa = new Map();
    for (const it of estat.items) {
      mapa.set(it.categoryId, (mapa.get(it.categoryId) || 0) + 1);
    }
    return mapa;
  }, [estat.items]);

  const totalRevisar = recomptePerCat.get('revisar') || 0;
  const totalClassificades = estat.items.length - totalRevisar;
  const totalBessons = useMemo(
    () => estat.items.filter((it) => it.isTwin).length,
    [estat.items]
  );

  const itemsFiltrats = useMemo(() => {
    const q = cercaText.trim().toLowerCase();
    return estat.items.filter((it) => {
      if (modeActiu === 'carta' && nomesRevisar && totalRevisar > 0 && it.categoryId !== 'revisar') {
        return false;
      }
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        String(it.poble || '').toLowerCase().includes(q) ||
        (it.tags || []).some((tg) => tg.toLowerCase().includes(q))
      );
    });
  }, [estat.items, cercaText, modeActiu, nomesRevisar, totalRevisar]);

  const cartaActiva =
    itemsFiltrats.length > 0
      ? itemsFiltrats[indexCarta % itemsFiltrats.length]
      : null;

  useEffect(() => {
    if (modeActiu !== 'carta' || !cartaActiva) return undefined;
    const onKey = (ev) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target?.tagName)) return;
      const num = Number.parseInt(ev.key, 10);
      if (num >= 1 && num <= categoriesVives.length) {
        const desti = categoriesVives[num - 1];
        if (desti) {
          ev.preventDefault();
          mutaIDesa((prev) => assignarCartaACategoria(prev, cartaActiva.id, desti.id));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modeActiu, cartaActiva, categoriesVives, mutaIDesa]);

  const gestionaTeclatPestanyes = (ev) => {
    const idx = MODES_IDS.indexOf(modeActiu);
    let nextIdx = -1;
    if (ev.key === 'ArrowRight') nextIdx = (idx + 1) % MODES_IDS.length;
    else if (ev.key === 'ArrowLeft') nextIdx = (idx - 1 + MODES_IDS.length) % MODES_IDS.length;
    else if (ev.key === 'Home') nextIdx = 0;
    else if (ev.key === 'End') nextIdx = MODES_IDS.length - 1;
    if (nextIdx >= 0) {
      ev.preventDefault();
      const nextMode = MODES_IDS[nextIdx];
      setModeActiu(nextMode);
      tabRefs.current[nextMode]?.focus();
    }
  };

  const executaImportacioText = () => {
    const res = importaContingutUniversal(estat, textImportar, {
      autoClassifica: autoClassificarImport,
    });
    if (res.importats > 0) {
      desaEstatJoc(res.estat, userId);
      setEstat(res.estat);
      setTextImportar('');
      setNomesRevisar(!autoClassificarImport);
      setAvisFeedback(tx.missatgeImportatOk(res.importats));
    }
  };

  const gestionaFitxerLocal = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const contingut = await file.text();
      const res = importaContingutUniversal(estat, contingut, {
        autoClassifica: autoClassificarImport,
      });
      if (res.importats > 0) {
        desaEstatJoc(res.estat, userId);
        setEstat(res.estat);
        setNomesRevisar(!autoClassificarImport);
        setAvisFeedback(tx.missatgeImportatOk(res.importats));
      }
    } catch {
      // Silencia lectura cancel·lada
    }
  };

  const connectaUrlRemota = async () => {
    const candidats = candidatsFeedDeUrlWeb(urlWebImportar);
    if (candidats.length === 0 || typeof fetch !== 'function') {
      setAvisFeedback(tx.missatgeUrlError);
      return;
    }
    for (const urlCandidata of candidats) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);
      try {
        // R32.87 · Tellado: un feed públic no rep ni galetes ni la URL de la pàgina que el demana.
        const resp = await fetch(urlCandidata, { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
        clearTimeout(timer);
        if (!resp.ok) continue;
        const text = await resp.text();
        const res = importaContingutUniversal(estat, text, {
          autoClassifica: autoClassificarImport,
        });
        if (res.importats > 0) {
          desaEstatJoc(res.estat, userId);
          setEstat(res.estat);
          setUrlWebImportar('');
          setNomesRevisar(!autoClassificarImport);
          setAvisFeedback(tx.missatgeImportatOk(res.importats));
          return;
        }
      } catch {
        clearTimeout(timer);
      }
    }
    setAvisFeedback(tx.missatgeUrlError);
  };

  const comparteixPropostaAlXat = () => {
    const resum = generaPropostaCiutadana(estat, notaProposta, idioma);
    lliuraCompartit({ text: resum });
    navigate('/xat');
  };

  const copiaAlPortaRetalls = async (text) => {
    try {
      await navigator?.clipboard?.writeText?.(text);
      setAvisFeedback(tx.copiatOk);
    } catch {
      setAvisFeedback(tx.copiatOk);
    }
  };

  const cartaMostraComparador = useMemo(() => {
    if (idCartaComparador) {
      const trobada = estat.items.find((it) => it.id === idCartaComparador);
      if (trobada) return trobada;
    }
    return estat.items.find((it) => Boolean(it.image)) || estat.items[0] || LLAVOR_RAPIDA_JOC[0];
  }, [estat.items, idCartaComparador]);

  const categoriaMostraComparador = useMemo(() => {
    const cat = categoriesVives.find((c) => c.id === cartaMostraComparador?.categoryId);
    return cat || categoriesVives[0];
  }, [categoriesVives, cartaMostraComparador]);

  const troncMostraComparador = useMemo(() => {
    const tronc = TRONCS_MONS_2.find((t) => t.id === categoriaMostraComparador?.troncId) || TRONCS_MONS_2[0];
    return tronc.labels[idioma] || tronc.labels.ca;
  }, [categoriaMostraComparador, idioma]);

  const postitsCategoria2D = useMemo(() => {
    const catId = categoriesVives.some((c) => c.id === catSeleccionada2D)
      ? catSeleccionada2D
      : categoriesVives[0]?.id;
    return estat.items.filter((it) => it.categoryId === catId).slice(0, 8);
  }, [estat.items, categoriesVives, catSeleccionada2D]);

  const filesRanquingEquilibri = useMemo(() => {
    const maxim = Math.max(
      1,
      ...categoriesVives.map((cat) => recomptePerCat.get(cat.id) || 0)
    );
    return categoriesVives.map((cat) => {
      const n = recomptePerCat.get(cat.id) || 0;
      const pct = estat.items.length > 0 ? Math.round((n / estat.items.length) * 1000) / 10 : 0;
      return {
        clau: cat.id,
        nom: cat.label,
        valor: `${n} (${pct}%)`,
        proporcio: fraccioQuadre(n, maxim),
      };
    });
  }, [categoriesVives, recomptePerCat, estat.items.length]);

  const etiquetesModes = {
    carta: tx.mode1,
    pissarra: tx.mode2,
    rss: tx.mode3,
    equilibri: tx.mode4,
  };

  const fotoCartaActiva = cartaActiva ? urlSeguraExterna(cartaActiva.image) : '';

  return (
    <UniversalPage
      title={paginaLocalitzada.title}
      subtitle={paginaLocalitzada.subtitle}
      lead={paginaLocalitzada.lead}
      heroImage={resolveAsset(PAGINA_CADA_COSA_AL_SEU_LLOC.image)}
      heroAlt={paginaLocalitzada.imageAlt}
      heroWidth={PAGINA_CADA_COSA_AL_SEU_LLOC.imageWidth}
      heroHeight={PAGINA_CADA_COSA_AL_SEU_LLOC.imageHeight}
      portadaPlegable={{
        clau: 'joc:cada-cosa',
        etiquetes: { amaga: tx.portadaAmaga, mostra: tx.portadaMostra },
      }}
      labels={etiquetesCapcalera}
      copyright={COPYRIGHT_SDP}
      {...dataHoraDeBarra({ creat: PAGINA_CADA_COSA_AL_SEU_LLOC.date })}
      showLogos={true}
      chrome="full"
      topBarData={{ showPin: false }}
      llenguaDelContingut={idioma}
    >
      {/* ═══ BLOC 1: ORGANISME INTERACTIU PEDRA SECA DEL JOC (SENSE LOCUCIÓ DE SOROLL UI) ═══ */}
      <section
        ref={elementRef}
        data-element-fullscreen=""
        data-sdp-no-locutar=""
        data-testid="taulell-joc-viu"
        className={isFullscreen ? 'sdp-joc-lloc is-fullscreen' : 'sdp-joc-lloc'}
      >
        <div className="sdp-joc-lloc__comandaments">
          <QuadreDeComandament
            estat={{ text: tx.estatTaulellViu, viu: true }}
            xifres={[
              {
                clau: 'classificades',
                nom: tx.kpiAlSeuLloc,
                valor: `${totalClassificades}/${estat.items.length}`,
              },
              {
                clau: 'revisar',
                nom: tx.kpiRevisar,
                valor: String(totalRevisar),
              },
              {
                clau: 'bessons',
                nom: tx.kpiBessons,
                valor: String(totalBessons),
              },
              {
                clau: 'categories',
                nom: tx.kpiCategories,
                valor: String(categoriesVives.length),
              },
            ]}
          />

          <div className="sdp-joc-lloc__accions">
            <Boto
              varietat={isFullscreen ? 'primari' : 'secundari'}
              aria-pressed={isFullscreen}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? tx.pantallaCompletaIx : tx.pantallaCompletaEntra}
            </Boto>

            <Boto
              varietat={panellObert === 'importar' ? 'primari' : 'secundari'}
              aria-expanded={panellObert === 'importar'}
              onClick={() => {
                setAvisFeedback('');
                setPanellObert((p) => (p === 'importar' ? null : 'importar'));
              }}
            >
              {tx.botoImportar}
            </Boto>

            <Boto
              varietat={panellObert === 'desar' ? 'primari' : 'secundari'}
              aria-expanded={panellObert === 'desar'}
              onClick={() => {
                setAvisFeedback('');
                setPanellObert((p) => (p === 'desar' ? null : 'desar'));
              }}
            >
              {tx.botoDesarExportar}
            </Boto>

            <Boto
              varietat={panellObert === 'proposta' ? 'primari' : 'secundari'}
              aria-expanded={panellObert === 'proposta'}
              onClick={() => {
                setAvisFeedback('');
                setPanellObert((p) => (p === 'proposta' ? null : 'proposta'));
              }}
            >
              {tx.botoProposta}
            </Boto>

            <Boto
              varietat="secundari"
              disabled={!estat.undoStack || estat.undoStack.length === 0}
              onClick={() => mutaIDesa((prev) => desfesUltimaAccio(prev))}
            >
              {tx.botoDesfer}
            </Boto>

            <Boto
              varietat="secundari"
              onClick={() => {
                if (historiaRef.current) {
                  desplacaASeccio(historiaRef.current, { behavior: 'smooth', block: 'start' });
                }
              }}
            >
              {tx.enllacHistoriaBaix}
            </Boto>
          </div>

          <div
            role="tablist"
            aria-label={tx.tablistModesAria}
            className="sdp-joc-lloc__modes"
            onKeyDown={gestionaTeclatPestanyes}
          >
            {MODES_IDS.map((mId) => {
              const actiu = modeActiu === mId;
              return (
                <button
                  key={mId}
                  ref={(node) => {
                    tabRefs.current[mId] = node;
                  }}
                  id={`tab-mode-${mId}`}
                  type="button"
                  role="tab"
                  aria-selected={actiu}
                  aria-controls={`panel-mode-${mId}`}
                  tabIndex={actiu ? 0 : -1}
                  className={actiu ? 'sdp-boto sdp-boto--primari' : 'sdp-boto sdp-boto--secundari'}
                  onClick={() => setModeActiu(mId)}
                >
                  {etiquetesModes[mId]}
                </button>
              );
            })}
          </div>
        </div>

        {/* PANELL EN LÍNIA 1: NETEJAR EXEMPLE I ENXUFAR WEB / WP / RSS / CARPETA REVISAR */}
        {panellObert === 'importar' ? (
          <section className="sdp-joc-lloc__panell" aria-label={tx.panellImportarTitol}>
            <div className="sdp-joc-lloc__panell-cap">
              <h4>{tx.panellImportarTitol}</h4>
              <Boto varietat="secundari" onClick={() => setPanellObert(null)}>
                {tx.tancaPanell}
              </Boto>
            </div>
            <p>{tx.panellImportarAjuda}</p>

            <div className="sdp-joc-lloc__accions">
              {!estat.modePropiBuit ? (
                <Boto
                  varietat="primari"
                  onClick={() => {
                    mutaIDesa((prev) => buidaExempleSocDePoble(prev));
                    setAvisFeedback(tx.missatgeBuidatOk);
                  }}
                >
                  {tx.botoBuidaExemple}
                </Boto>
              ) : (
                <Boto
                  varietat="primari"
                  onClick={() => {
                    mutaIDesa((prev) => restauraExempleSocDePoble(prev, corpusCompletRef.current));
                    setAvisFeedback('');
                  }}
                >
                  {tx.botoRestauraExemple}
                </Boto>
              )}

              <Boto
                varietat="secundari"
                onClick={() => setTextImportar(EXEMPLE_CARPETA_REVISAR)}
              >
                {tx.botoCarregaExemple}
              </Boto>
            </div>

            <label className="sdp-joc-lloc__camp">
              <span>{tx.urlWebLabel}</span>
              <input
                type="url"
                className="sdp-joc-lloc__entrada"
                value={urlWebImportar}
                placeholder={tx.urlWebPlaceholder}
                onChange={(ev) => setUrlWebImportar(ev.target.value)}
              />
            </label>
            <div className="sdp-joc-lloc__accions">
              <Boto
                varietat="secundari"
                disabled={!urlWebImportar.trim()}
                onClick={connectaUrlRemota}
              >
                {tx.botoConnectaUrl}
              </Boto>
            </div>

            <label className="sdp-joc-lloc__camp">
              <span>{tx.fitxerLocalLabel}</span>
              <input
                type="file"
                accept=".json,.xml,.rss,.atom,.txt,.md,.csv"
                className="sdp-joc-lloc__entrada"
                onChange={gestionaFitxerLocal}
              />
            </label>

            <label className="sdp-joc-lloc__camp">
              <textarea
                className="sdp-joc-lloc__textarea"
                value={textImportar}
                placeholder={tx.importarTextareaPlaceholder}
                onChange={(ev) => setTextImportar(ev.target.value)}
              />
            </label>

            <label className="sdp-joc-lloc__camp">
              <span>
                <input
                  type="checkbox"
                  checked={autoClassificarImport}
                  onChange={(ev) => setAutoClassificarImport(ev.target.checked)}
                />{' '}
                {tx.autoClassificarCheck}
              </span>
            </label>

            <div className="sdp-joc-lloc__accions">
              <Boto
                varietat="primari"
                disabled={!textImportar.trim()}
                onClick={executaImportacioText}
              >
                {tx.botoImportarAra}
              </Boto>
            </div>

            {avisFeedback ? <p role="status" className="sdp-joc-lloc__avis-ok">{avisFeedback}</p> : null}
          </section>
        ) : null}

        {/* PANELL EN LÍNIA 2: PERSISTÈNCIA CONTÍNUA I EXPORTACIÓ */}
        {panellObert === 'desar' ? (
          <section className="sdp-joc-lloc__panell" aria-label={tx.panellDesarTitol}>
            <div className="sdp-joc-lloc__panell-cap">
              <h4>{tx.panellDesarTitol}</h4>
              <Boto varietat="secundari" onClick={() => setPanellObert(null)}>
                {tx.tancaPanell}
              </Boto>
            </div>
            <p>{tx.panellDesarAjuda}</p>
            <div className="sdp-joc-lloc__accions">
              <Boto
                varietat="primari"
                onClick={() =>
                  descarregaArxiuLocal(
                    'cada-cosa-al-seu-lloc.json',
                    exportaInstantaniaJson(estat),
                    'application/json'
                  )
                }
              >
                {tx.botoDescarregaJson}
              </Boto>
              <Boto
                varietat="secundari"
                onClick={() =>
                  descarregaArxiuLocal(
                    'arbre-categories-socdepoble.md',
                    generaPropostaCiutadana(estat, notaProposta, idioma),
                    'text/markdown'
                  )
                }
              >
                {tx.botoDescarregaMd}
              </Boto>
              <Boto
                varietat="secundari"
                onClick={() =>
                  descarregaArxiuLocal(
                    'canals-rss-socdepoble.opml',
                    exportaOpmlRss(estat),
                    'text/xml'
                  )
                }
              >
                {tx.botoDescarregaOpml}
              </Boto>
              <Boto
                varietat="secundari"
                onClick={() => copiaAlPortaRetalls(exportaInstantaniaJson(estat))}
              >
                {tx.botoCopiaJson}
              </Boto>
              <Boto
                varietat="secundari"
                onClick={() => setEstat(reiniciaEstatJoc(corpusCompletRef.current, userId))}
              >
                {tx.botoReiniciaPartida}
              </Boto>
            </div>
            {avisFeedback ? <p role="status" className="sdp-joc-lloc__avis-ok">{avisFeedback}</p> : null}
          </section>
        ) : null}

        {/* PANELL EN LÍNIA 3: PARTICIPACIÓ CIUTADANA (CC BY-SA 4.0 + ENVIAMENT 1 CLIC AL /XAT) */}
        {panellObert === 'proposta' ? (
          <section className="sdp-joc-lloc__panell" aria-label={tx.panellPropostaTitol}>
            <div className="sdp-joc-lloc__panell-cap">
              <h4>{tx.panellPropostaTitol}</h4>
              <Boto varietat="secundari" onClick={() => setPanellObert(null)}>
                {tx.tancaPanell}
              </Boto>
            </div>
            <p>{tx.panellPropostaAjuda}</p>
            <label className="sdp-joc-lloc__camp">
              <textarea
                className="sdp-joc-lloc__textarea"
                value={notaProposta}
                placeholder={tx.notaPropostaPlaceholder}
                onChange={(ev) => setNotaProposta(ev.target.value)}
              />
            </label>
            <div className="sdp-joc-lloc__accions">
              <Boto varietat="primari" onClick={comparteixPropostaAlXat}>
                {tx.botoEnviaAlXat}
              </Boto>
              <Boto
                varietat="secundari"
                onClick={() => copiaAlPortaRetalls(generaPropostaCiutadana(estat, notaProposta, idioma))}
              >
                {tx.botoCopiaPropostaMd}
              </Boto>
            </div>
            {avisFeedback ? <p role="status" className="sdp-joc-lloc__avis-ok">{avisFeedback}</p> : null}
          </section>
        ) : null}

        {/* ESCENARI DEL MODE ACTIU */}
        <div
          id={`panel-mode-${modeActiu}`}
          role="tabpanel"
          aria-labelledby={`tab-mode-${modeActiu}`}
          className="sdp-joc-lloc__escenari"
        >
          {/* ── MODE 1: CARTA A LA MÀ ── */}
          {modeActiu === 'carta' ? (
            <>
              <div className="sdp-joc-lloc__accions">
                <input
                  type="search"
                  className="sdp-joc-lloc__entrada"
                  value={cercaText}
                  placeholder={tx.cercaPlaceholder}
                  aria-label={tx.cercaPlaceholder}
                  onChange={(ev) => {
                    setCercaText(ev.target.value);
                    setIndexCarta(0);
                  }}
                />
                <Boto
                  varietat={nomesRevisar ? 'primari' : 'secundari'}
                  aria-pressed={nomesRevisar}
                  onClick={() => {
                    setNomesRevisar((v) => !v);
                    setIndexCarta(0);
                  }}
                >
                  {nomesRevisar ? tx.filtreRevisar : tx.filtreTotes}
                </Boto>
                <Boto
                  varietat="secundari"
                  onClick={() => mutaIDesa((prev) => traureManetaPerJugar(prev, 7))}
                >
                  {tx.botoTrau7Cartes}
                </Boto>
                {totalRevisar > 0 ? (
                  <Boto
                    varietat="secundari"
                    onClick={() => mutaIDesa((prev) => aplicarSuggerimentsPendents(prev))}
                  >
                    {tx.botoOrdenaPendents}
                  </Boto>
                ) : null}
              </div>

              {cartaActiva ? (
                <div className="sdp-joc-lloc__vista-carta">
                  <article className="sdp-joc-lloc__carta-gran">
                    <figure className="sdp-joc-lloc__carta-foto">
                      {fotoCartaActiva ? (
                        <img
                          src={fotoCartaActiva}
                          alt={cartaActiva.title}
                          loading="eager"
                        />
                      ) : (
                        <div className="sdp-joc-lloc__sense-foto">
                          <span>{`📍 ${cartaActiva.poble || 'Sóc de Poble'}`}</span>
                          <span>{tx.senseFotoSegell}</span>
                        </div>
                      )}
                    </figure>

                    <div className="sdp-joc-lloc__carta-meta">
                      <Insignia to="neutre">{`📍 ${cartaActiva.poble || 'Xarxa de Pobles'}`}</Insignia>
                      {cartaActiva.date ? <Insignia to="neutre">{cartaActiva.date}</Insignia> : null}
                      {cartaActiva.isTwin ? <Insignia to="primari">{tx.insigniaBesso}</Insignia> : null}
                    </div>

                    <div className="sdp-joc-lloc__carta-cos">
                      <h4>{cartaActiva.title}</h4>
                      {cartaActiva.excerpt ? <p>{cartaActiva.excerpt}</p> : null}
                    </div>

                    {Array.isArray(cartaActiva.sources) && cartaActiva.sources.length > 0 ? (
                      <div className="sdp-joc-lloc__enllacos">
                        {cartaActiva.sources.map((src, sIdx) => {
                          const hrefSegur = urlSeguraExterna(src.url);
                          if (!hrefSegur) return null;
                          return (
                            <a
                              key={`${src.label}-${sIdx}`}
                              href={hrefSegur}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sdp-joc-lloc__enllac-font"
                            >
                              {`${src.label} · ${tx.obriFontOriginal}`}
                            </a>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="sdp-joc-lloc__accions">
                      <Boto
                        varietat="secundari"
                        onClick={() =>
                          setIndexCarta((i) => (i - 1 + itemsFiltrats.length) % itemsFiltrats.length)
                        }
                      >
                        {tx.cartaAnterior}
                      </Boto>
                      <span>{`${(indexCarta % itemsFiltrats.length) + 1} / ${itemsFiltrats.length}`}</span>
                      <Boto
                        varietat="secundari"
                        onClick={() => setIndexCarta((i) => (i + 1) % itemsFiltrats.length)}
                      >
                        {tx.cartaSeguent}
                      </Boto>
                    </div>
                  </article>

                  <div className="sdp-joc-lloc__cistelles">
                    <p className="sdp-joc-lloc__instruccio">{tx.assignaACistella}</p>
                    {TRONCS_MONS_2.map((tronc) => {
                      const catsMon = categoriesVives.filter((c) => c.troncId === tronc.id);
                      return (
                        <section key={tronc.id} className="sdp-joc-lloc__mon-caixa">
                          <h4 className="sdp-joc-lloc__mon-titol">
                            {tronc.labels[idioma] || tronc.labels.ca}
                          </h4>
                          <div className="sdp-joc-lloc__cistelles-llista">
                            {catsMon.map((cat) => {
                              const esSuggerida = cartaActiva.suggestedCategoryId === cat.id;
                              const numOrdre = categoriesVives.findIndex((x) => x.id === cat.id) + 1;
                              const classeBoto = esSuggerida
                                ? 'sdp-joc-lloc__cistella-boto sdp-joc-lloc__cistella-suggerida'
                                : 'sdp-joc-lloc__cistella-boto';
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  className={classeBoto}
                                  onClick={() =>
                                    mutaIDesa((prev) =>
                                      assignarCartaACategoria(prev, cartaActiva.id, cat.id)
                                    )
                                  }
                                >
                                  <span>{`${numOrdre}. ${cat.label}`}</span>
                                  <span className="sdp-joc-lloc__cistella-recompte">
                                    {recomptePerCat.get(cat.id) || 0}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="sdp-joc-lloc__mon-caixa">
                  <h4 className="sdp-joc-lloc__mon-titol">{tx.safataRevisarBuidaTitol}</h4>
                  <p>{tx.safataRevisarBuidaCos}</p>
                  <div className="sdp-joc-lloc__accions">
                    <Boto
                      varietat="primari"
                      onClick={() => mutaIDesa((prev) => traureManetaPerJugar(prev, 7))}
                    >
                      {tx.botoTrau7Cartes}
                    </Boto>
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* ── MODE 2: PISSARRA 2D ESPACIAL ── */}
          {modeActiu === 'pissarra' ? (
            <>
              <p className="sdp-joc-lloc__instruccio">{tx.pissarraInstruccio}</p>

              <form
                className="sdp-joc-lloc__pissarra-controls"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  if (!nouNomConcepte.trim()) return;
                  mutaIDesa((prev) =>
                    crearConcepteNou(prev, {
                      label: nouNomConcepte,
                      troncId: nouTroncConcepte,
                      rol: nouRolConcepte,
                    })
                  );
                  setNouNomConcepte('');
                }}
              >
                <input
                  type="text"
                  className="sdp-joc-lloc__entrada"
                  value={nouNomConcepte}
                  placeholder={tx.nouConceptePlaceholder}
                  aria-label={tx.nouConceptePlaceholder}
                  onChange={(ev) => setNouNomConcepte(ev.target.value)}
                />
                <select
                  className="sdp-joc-lloc__entrada"
                  value={nouRolConcepte}
                  aria-label={tx.rolCategoria}
                  onChange={(ev) => setNouRolConcepte(ev.target.value)}
                >
                  <option value="categoria">{tx.rolCategoria}</option>
                  <option value="etiqueta">{tx.rolEtiqueta}</option>
                </select>
                <select
                  className="sdp-joc-lloc__entrada"
                  value={nouTroncConcepte}
                  aria-label={TRONCS_MONS_2[0].labels.ca}
                  onChange={(ev) => setNouTroncConcepte(ev.target.value)}
                >
                  {TRONCS_MONS_2.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.labels[idioma] || tr.labels.ca}
                    </option>
                  ))}
                </select>
                <Boto type="submit" varietat="primari">
                  {tx.botoCrearConcepte}
                </Boto>
              </form>

              <div ref={pissarraRef} className="sdp-joc-lloc__suro" data-testid="pissarra-suro-2d">
                {TRONCS_MONS_2.map((tr) => (
                  <div key={tr.id} className="sdp-joc-lloc__suro-meitat">
                    <h4 className="sdp-joc-lloc__mon-titol">
                      {tr.labels[idioma] || tr.labels.ca}
                    </h4>
                  </div>
                ))}

                {estat.conceptes.map((concepte) => (
                  <NodePissarra2D
                    key={concepte.id}
                    concepte={concepte}
                    recompte={recomptePerCat.get(concepte.id) || 0}
                    seleccionat={concepte.id === catSeleccionada2D}
                    tx={tx}
                    pissarraRef={pissarraRef}
                    onSelecciona={setCatSeleccionada2D}
                    onMou2D={(id, x, y) => mutaIDesa((prev) => moureConcepte2D(prev, id, x, y))}
                    onMutaRol={(id) => mutaIDesa((prev) => mutarRolConcepte(prev, id))}
                    onCanviaMon={(id, nouMon) =>
                      mutaIDesa((prev) => canviaTroncConcepte(prev, id, nouMon))
                    }
                  />
                ))}
              </div>

              <div className="sdp-joc-lloc__postits-graella">
                {postitsCategoria2D.map((it) => {
                  const foto = urlSeguraExterna(it.image);
                  return (
                    <article key={it.id} className="sdp-joc-lloc__postit">
                      {foto ? (
                        <img
                          src={foto}
                          alt={it.title}
                          loading="lazy"
                          className="sdp-joc-lloc__postit-miniatura"
                        />
                      ) : null}
                      <strong>{it.title}</strong>
                      {it.excerpt ? <small>{it.excerpt}</small> : null}
                      <select
                        className="sdp-joc-lloc__entrada"
                        aria-label={tx.mouAColumnaAria}
                        value={it.categoryId}
                        onChange={(ev) =>
                          mutaIDesa((prev) => assignarCartaACategoria(prev, it.id, ev.target.value))
                        }
                      >
                        <option value="revisar">{tx.safataRevisarColumna}</option>
                        {categoriesVives.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </article>
                  );
                })}
              </div>
            </>
          ) : null}

          {/* ── MODE 3: CANALS RSS PARAL·LELS ── */}
          {modeActiu === 'rss' ? (
            <>
              <div className="sdp-joc-lloc__accions">
                <input
                  type="search"
                  className="sdp-joc-lloc__entrada"
                  value={cercaText}
                  placeholder={tx.cercaPlaceholder}
                  aria-label={tx.cercaPlaceholder}
                  onChange={(ev) => setCercaText(ev.target.value)}
                />
                <span className="sdp-joc-lloc__instruccio">{tx.rssInstruccio}</span>
              </div>

              <div className="sdp-joc-lloc__rius">
                {[{ id: 'revisar', label: tx.safataRevisarColumna }, ...categoriesVives].map(
                  (columna) => {
                    const itemsCol = itemsFiltrats
                      .filter((it) => it.categoryId === columna.id)
                      .slice(0, 14);
                    const totalCol = recomptePerCat.get(columna.id) || 0;
                    return (
                      <section
                        key={columna.id}
                        className="sdp-joc-lloc__riu-columna"
                        onDragOver={(ev) => ev.preventDefault()}
                        onDrop={(ev) => {
                          ev.preventDefault();
                          const arrossegat = dragRssItemIdRef.current;
                          if (arrossegat) {
                            mutaIDesa((prev) =>
                              assignarCartaACategoria(prev, arrossegat, columna.id)
                            );
                            dragRssItemIdRef.current = null;
                          }
                        }}
                      >
                        <header className="sdp-joc-lloc__riu-cap">
                          <h4>{columna.label}</h4>
                          <Insignia to="neutre">{String(totalCol)}</Insignia>
                        </header>

                        <div className="sdp-joc-lloc__riu-llista">
                          {itemsCol.map((it) => {
                            const foto = urlSeguraExterna(it.image);
                            return (
                              <article
                                key={it.id}
                                draggable
                                onDragStart={() => {
                                  dragRssItemIdRef.current = it.id;
                                }}
                                className="sdp-joc-lloc__riu-item"
                              >
                                {foto ? (
                                  <img
                                    src={foto}
                                    alt={it.title}
                                    loading="lazy"
                                    className="sdp-joc-lloc__postit-miniatura"
                                  />
                                ) : null}
                                <strong>{it.title}</strong>
                                {it.excerpt ? <small>{it.excerpt}</small> : null}
                                {it.sourceUrl ? (
                                  <a
                                    href={urlSeguraExterna(it.sourceUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sdp-joc-lloc__enllac-font"
                                  >
                                    {tx.obriFontOriginal}
                                  </a>
                                ) : null}
                                <select
                                  className="sdp-joc-lloc__entrada"
                                  aria-label={tx.mouAColumnaAria}
                                  value={it.categoryId}
                                  onChange={(ev) =>
                                    mutaIDesa((prev) =>
                                      assignarCartaACategoria(prev, it.id, ev.target.value)
                                    )
                                  }
                                >
                                  <option value="revisar">{tx.safataRevisarColumna}</option>
                                  {categoriesVives.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    );
                  }
                )}
              </div>
            </>
          ) : null}

          {/* ── MODE 4: EQUILIBRI (QUADRE DE COMANDAMENT) I COMPARADOR EN VIU D'UNIVERSALCARD ── */}
          {modeActiu === 'equilibri' ? (
            <>
              <QuadreDeComandament
                nivell={4}
                ranquing={{
                  titol: tx.equilibriTitol,
                  files: filesRanquingEquilibri,
                  buit: tx.safataRevisarBuidaTitol,
                  falta: '',
                }}
              />

              <h4 className="sdp-joc-lloc__mon-titol">{tx.comparadorTitol}</h4>
              <label className="sdp-joc-lloc__camp">
                <span>{tx.triaCartaComparador}</span>
                <select
                  className="sdp-joc-lloc__entrada"
                  value={cartaMostraComparador?.id || ''}
                  onChange={(ev) => setIdCartaComparador(ev.target.value)}
                >
                  {estat.items.slice(0, 80).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.title}
                    </option>
                  ))}
                </select>
              </label>

              {cartaMostraComparador ? (
                <div className="sdp-joc-lloc__comparador">
                  <section className="sdp-joc-lloc__comparador-col">
                    <h4 className="sdp-joc-lloc__mon-titol">{tx.comparadorAmbTronc}</h4>
                    <UniversalCard
                      title={cartaMostraComparador.title}
                      subtitle={cartaMostraComparador.poble || 'Xarxa de Pobles'}
                      author={cartaMostraComparador.sources?.[0]?.label || 'Xarxa de Pobles'}
                      location={cartaMostraComparador.poble || 'Xarxa de Pobles'}
                      date={dataCurtaDeCarta(cartaMostraComparador.date)}
                      dateTime={cartaMostraComparador.date || undefined}
                      image={urlSeguraExterna(cartaMostraComparador.image) || undefined}
                      labels={[
                        { text: troncMostraComparador, className: 'sdp-badge-system' },
                        {
                          text: categoriaMostraComparador?.label || 'Categoria',
                          className: 'sdp-badge-category',
                        },
                        ...(cartaMostraComparador.tags || []).slice(0, 2).map((tg) => ({
                          text: tg,
                          className: 'sdp-badge-tag',
                        })),
                      ]}
                      hasFooter={false}
                      traduccio={false}
                      body={
                        <p>
                          {cartaMostraComparador.excerpt ||
                            'Previsualització real amb el Gran Tronc explícit.'}
                        </p>
                      }
                    />
                  </section>

                  <section className="sdp-joc-lloc__comparador-col">
                    <h4 className="sdp-joc-lloc__mon-titol">{tx.comparadorSenseTronc}</h4>
                    <UniversalCard
                      title={cartaMostraComparador.title}
                      subtitle={cartaMostraComparador.poble || 'Xarxa de Pobles'}
                      author={cartaMostraComparador.sources?.[0]?.label || 'Xarxa de Pobles'}
                      location={cartaMostraComparador.poble || 'Xarxa de Pobles'}
                      date={dataCurtaDeCarta(cartaMostraComparador.date)}
                      dateTime={cartaMostraComparador.date || undefined}
                      image={urlSeguraExterna(cartaMostraComparador.image) || undefined}
                      labels={[
                        {
                          text: categoriaMostraComparador?.label || 'Categoria',
                          className: 'sdp-badge-category',
                        },
                        ...(cartaMostraComparador.tags || []).slice(0, 3).map((tg) => ({
                          text: tg,
                          className: 'sdp-badge-tag',
                        })),
                      ]}
                      hasFooter={false}
                      traduccio={false}
                      body={
                        <p>
                          {cartaMostraComparador.excerpt ||
                            'Previsualització neta amb el Gran Tronc al filtre superior.'}
                        </p>
                      }
                    />
                  </section>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      {/* ═══ BLOC 2: PROSA EDITORIAL NORMAL A TOTA AMPLÀRIA (COMENÇANT DIRECTAMENT EN H3, FORA DE CAP QUADRE ESTRET!) ═══ */}
      <div
        ref={historiaRef}
        id="historia-joc"
        data-testid="historia-humana-sota-joc"
        className="cms-preview"
      >
        {tx.historiaBlocs.map((bloc, idx) => (
          <section key={`bloc-hist-${idx}`}>
            <h3>{bloc.h3}</h3>
            <p>{renderProsaControlada(bloc.p1)}</p>
            <p>{renderProsaControlada(bloc.p2)}</p>
          </section>
        ))}
      </div>
    </UniversalPage>
  );
}

/* R32.87 · Lògica universal (LU02): la previsualització del comparador és una targeta de contingut i porta
   la capçalera completa de la publicació real (font, poble i data), no una targeta anònima. */
function dataCurtaDeCarta(iso) {
  const [any, mes, dia] = String(iso || '').slice(0, 10).split('-');
  return any && mes && dia ? `${dia}/${mes}/${any.slice(2)}` : undefined;
}
