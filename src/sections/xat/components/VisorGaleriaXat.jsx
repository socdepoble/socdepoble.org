/**
 * VisorGaleriaXat.jsx — Lightbox accessible i carrusel d'imatges compartides
 * dins d'una conversa de xat (Onada R21.9 · P0-XAT-VISOR-GALERIA-IMATGES).
 *
 *   · S'integra a la pila LIFO de `useCapaEnrere`: un `Escape` o Arrere tanca
 *     primer el visor sense eixir de la conversa i retorna el focus al botó de
 *     la miniatura que l'ha obert.
 *   · Mostra capçalera amb avatar (`CaraXat`), nom de l'autor, data i hora,
 *     descàrrega directa, commutador de zoom (`1×` / `2×`) i botó de tancar
 *     (`>= 48×48px`).
 *   · Permet recórrer totes les fotos de la conversa amb botons Anterior (`←`)
 *     i Següent (`→`), tecles `ArrowLeft` / `ArrowRight` i tira de miniatures.
 *
 * Gauntlet R22 (correccions del COMMIT 5):
 *   · xat-01 · Es pinta amb un portal a la capa de dalt de l'App (capaDeDalt,
 *     el criteri de VisorDePublicacio), amb --z-calaix: dins de
 *     .sdp-xat-conversa (z-index 0) i .app-grid-page (isolation) la barra
 *     negra i el lateral el tapaven, i «Tanca», el zoom i «Descarrega» no
 *     rebien el toc.
 *   · xat-03 · El focus va a «Tanca» només en obrir. Navegar o un repintat de
 *     la conversa ja no el mouen: un segon Intro sobre «Foto següent» no tanca.
 *   · xat-04 · La foto activa i el zoom s'inicialitzen en obrir, mai perquè la
 *     llista canvie (un missatge nou en un grup actiu): la foto es conserva
 *     mentre hi siga.
 *   · xat-05 · Una URL signada de Storage dura 60 s. «Descarrega» és un
 *     enllaç natiu (dins del mateix gest) que apunta sempre a una signatura
 *     fresca: es torna a signar en mostrar la foto i cada
 *     RENOVA_DESCARREGA_MS mentre s'hi queda. En tancar, el visor oblida les
 *     URL resoltes; una foto que no carrega es torna a signar una vegada.
 *   · xat-07 i xat-09 · La cara de l'autor pren `avatar` (src de CaraXat) i
 *     `llavor` de la galeria (imatgesDeLaGaleria, conversa.js): una entitat
 *     mai no pren el color de qui l'opera.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCapaEnrere } from '../../../components/PedraSeca/hooks/useCapaEnrere.js';
import { teCapacitat, urlAdjuntXat } from '../../../data/backendPort.js';
import { etiquetaHora } from '../temps.js';
import CaraXat from './CaraXat.jsx';
import { capaDeDalt } from '../../../components/universal/PageFrame.jsx';


/* xat-05 · Una URL http(s) de Storage caduca (SEGONS_SIGNATURA = 60 s,
   data/supabase/xatMultimedia.js); un blob: (xifrat) o una data: (llavor), no. */
const caduca = (url) => /^https?:/i.test(String(url || ''));
/** Cada quant es torna a signar l'enllaç de descàrrega: sempre li queden més de 20 s. */
export const RENOVA_DESCARREGA_MS = 40_000;

function formataDataVisor(iso, locale) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const data = new Intl.DateTimeFormat(locale || 'ca-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  const hora = etiquetaHora(iso, locale);
  return hora ? `${data} · ${hora}` : data;
}

function MiniaturaCarrusel({ item, activa, urlConeguda, externalConfig, onSelecciona, etiqueta }) {
  const [url, setUrl] = useState(urlConeguda || null);
  useEffect(() => {
    if (urlConeguda) { setUrl(urlConeguda); return undefined; }
    if (!item?.adjuntId || !teCapacitat('xatMultimedia')) return undefined;
    const ctrl = new AbortController();
    let allibera = null;
    let muntat = true;
    urlAdjuntXat(item.adjuntId, { ...externalConfig, signal: ctrl.signal }, {
      renova: false,
      reten: (fn) => { if (typeof fn === 'function') allibera = fn; }
    }).then((resolta) => {
      if (!muntat || ctrl.signal.aborted) { allibera?.(); return; }
      setUrl(resolta);
    }).catch(() => {});
    return () => {
      muntat = false;
      ctrl.abort();
      allibera?.();
    };
  }, [item?.adjuntId, urlConeguda, externalConfig]);

  return (
    <button
      type="button"
      className={activa ? 'sdp-xat-visor__miniatura sdp-xat-visor__miniatura--activa' : 'sdp-xat-visor__miniatura'}
      aria-current={activa ? 'true' : undefined}
      aria-label={etiqueta}
      onClick={onSelecciona}
    >
      {url ? <img className="sdp-xat-visor__miniatura-img" src={url} alt="" /> : <span className="sdp-xat-visor__miniatura-buit" aria-hidden="true" />}
    </button>
  );
}

export default function VisorGaleriaXat({
  obert,
  imatges = [],
  missatgeInicialId = null,
  urlInicial = null,
  obridor = null,
  onTanca,
  externalConfig,
  locale = 'ca-ES',
  t
}) {
  const dialogRef = useRef(null);
  const tancaRef = useRef(null);
  const clauInicial = missatgeInicialId != null ? String(missatgeInicialId) : null;
  const [idActiu, setIdActiu] = useState(clauInicial);
  const [ampliat, setAmpliat] = useState(false);
  const [urlsResoltes, setUrlsResoltes] = useState(() => (clauInicial && urlInicial ? { [clauInicial]: urlInicial } : {}));
  /* xat-05 · Les fotos que no han carregat i es tornen a signar (una vegada per obertura). */
  const [renovades, setRenovades] = useState({});
  /* xat-05 · La signatura fresca de la descàrrega: { id, url, al }. */
  const [descarrega, setDescarrega] = useState(null);
  const [retingudes] = useState(() => new Set());
  const potSignar = teCapacitat('xatMultimedia');

  /* xat-04 · L'estat s'inicialitza en obrir (o si canvia la foto d'obertura),
     no en cada llista nova: `galeriaImatges` es recalcula amb cada missatge.
     En tancar s'oblida tot (xat-05: les URL d'una obertura ja poden haver
     caducat en la següent). */
  const obertura = obert ? (clauInicial ?? '') : null;
  const [oberturaVista, setOberturaVista] = useState(obertura);
  if (oberturaVista !== obertura) {
    setOberturaVista(obertura);
    setIdActiu(clauInicial);
    setAmpliat(false);
    setRenovades({});
    setDescarrega(null);
    setUrlsResoltes(obert && clauInicial && urlInicial ? { [clauInicial]: urlInicial } : {});
  }

  const indexActiu = useMemo(() => {
    if (!imatges.length) return -1;
    const idx = imatges.findIndex((img) => img.id === idActiu);
    return idx >= 0 ? idx : 0;
  }, [imatges, idActiu]);

  const actual = indexActiu >= 0 ? imatges[indexActiu] : null;
  const idActual = actual?.id ?? null;
  const adjuntActual = actual?.adjuntId ?? null;
  const urlActiva = idActual != null ? (urlsResoltes[idActual] ?? null) : null;
  const renovada = idActual != null && renovades[idActual] === true;
  const vistaCaduca = caduca(urlActiva);

  /* Les retencions (adjunts xifrats) de les URL que el visor ha posat viuen fins que es tanca. */
  useEffect(() => {
    if (!obert) return undefined;
    return () => {
      const totes = [...retingudes];
      retingudes.clear();
      for (const fn of totes) fn();
    };
  }, [obert, retingudes]);

  useEffect(() => {
    if (!obert || idActual == null || !adjuntActual || urlActiva || !potSignar) return undefined;
    const ctrl = new AbortController();
    let allibera = null;
    let muntat = true;
    urlAdjuntXat(adjuntActual, { ...externalConfig, signal: ctrl.signal }, {
      renova: renovada,
      reten: (fn) => { if (typeof fn === 'function') allibera = fn; }
    }).then((resolta) => {
      if (!muntat || ctrl.signal.aborted) { allibera?.(); return; }
      if (allibera) retingudes.add(allibera);
      setUrlsResoltes((prev) => ({ ...prev, [idActual]: resolta }));
    }).catch(() => {});
    return () => {
      muntat = false;
      ctrl.abort();
    };
  }, [obert, idActual, adjuntActual, urlActiva, renovada, potSignar, externalConfig, retingudes]);

  /* xat-05 · Mentre la foto es mostra, «Descarrega» porta una signatura nova
     (renova: true), i es renova cada RENOVA_DESCARREGA_MS. La imatge no canvia
     de src (no es torna a baixar): només l'enllaç. */
  useEffect(() => {
    if (!obert || idActual == null || !adjuntActual || !vistaCaduca || !potSignar) return undefined;
    const ctrl = new AbortController();
    let muntat = true;
    let rellotge = null;
    setDescarrega((prev) => (prev?.id === idActual && Date.now() - prev.al < RENOVA_DESCARREGA_MS ? prev : null));
    const signa = () => {
      /* xat-05 · descarrega: la signatura porta download=, i Storage respon amb Content-Disposition: attachment
         (un altre origen no respecta l'atribut download de l'enllaç). */
      urlAdjuntXat(adjuntActual, { ...externalConfig, signal: ctrl.signal }, { renova: true, descarrega: true })
        .then((fresca) => {
          if (!muntat || ctrl.signal.aborted) return;
          setDescarrega({ id: idActual, url: fresca, al: Date.now() });
          rellotge = setTimeout(signa, RENOVA_DESCARREGA_MS);
        })
        .catch(() => {});
    };
    signa();
    return () => {
      muntat = false;
      ctrl.abort();
      clearTimeout(rellotge);
    };
  }, [obert, idActual, adjuntActual, vistaCaduca, potSignar, externalConfig]);

  /* xat-05 · Una foto que no carrega (sol ser la signatura caducada) es torna
     a signar una vegada, com fallaCarrega d'AdjuntXat. */
  const fallaVista = () => {
    if (idActual == null || renovada || !adjuntActual || !potSignar) return;
    setRenovades((prev) => ({ ...prev, [idActual]: true }));
    setUrlsResoltes((prev) => {
      const resta = { ...prev };
      delete resta[idActual];
      return resta;
    });
  };

  const tanca = useCallback(() => {
    setAmpliat(false);
    onTanca?.();
    if (obridor && typeof obridor.focus === 'function') {
      queueMicrotask(() => obridor.focus());
    }
  }, [onTanca, obridor]);

  const teCapaDamunt = useCapaEnrere(Boolean(obert && actual), tanca);

  const seleccionaIndex = useCallback((nouIndex) => {
    if (!imatges.length) return;
    const total = imatges.length;
    const normalitzat = ((nouIndex % total) + total) % total;
    const desti = imatges[normalitzat];
    if (desti) {
      setIdActiu(desti.id);
      setAmpliat(false);
    }
  }, [imatges]);

  const anterior = useCallback(() => seleccionaIndex(indexActiu - 1), [seleccionaIndex, indexActiu]);
  const seguent = useCallback(() => seleccionaIndex(indexActiu + 1), [seleccionaIndex, indexActiu]);

  const capa = useMemo(() => (obert ? capaDeDalt(obridor) : null), [obert, obridor]);
  const visible = Boolean(obert && actual && capa);

  /* xat-03 · L'escolta del teclat llig les accions d'ara per una ref: canviar
     de foto o un onTanca nou del pare no la tornen a muntar. */
  const accionsRef = useRef(null);
  useLayoutEffect(() => {
    accionsRef.current = { anterior, seguent, tanca, total: imatges.length };
  });

  /* xat-03 · «Tanca» rep el focus només en obrir. */
  useEffect(() => {
    if (visible) tancaRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const node = dialogRef.current;
    const arrel = node?.getRootNode?.() || document;
    const alTeclat = (e) => {
      const accions = accionsRef.current;
      if (!accions) return;
      if (e.key === 'Escape') {
        if (e.defaultPrevented || teCapaDamunt()) return;
        e.preventDefault();
        accions.tanca();
        return;
      }
      if (teCapaDamunt()) return;
      if (e.key === 'ArrowLeft' && accions.total > 1) {
        e.preventDefault();
        accions.anterior();
      } else if (e.key === 'ArrowRight' && accions.total > 1) {
        e.preventDefault();
        accions.seguent();
      } else if (e.key === 'Tab' && node) {
        const enfocables = Array.from(node.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
        if (!enfocables.length) return;
        const primer = enfocables[0];
        const ultim = enfocables[enfocables.length - 1];
        const actiu = arrel.activeElement || document.activeElement;
        if (e.shiftKey && (actiu === primer || !node.contains(actiu))) {
          e.preventDefault();
          ultim.focus();
        } else if (!e.shiftKey && actiu === ultim) {
          e.preventDefault();
          primer.focus();
        }
      }
    };
    arrel.addEventListener('keydown', alTeclat);
    return () => arrel.removeEventListener('keydown', alTeclat);
  }, [visible, teCapaDamunt]);

  if (!visible) return null;

  const dataFormatejada = formataDataVisor(actual.creatAl, locale);
  const nomFitxer = `foto-xat-${actual.id || 'adjunt'}.webp`;
  const teCarrusel = imatges.length > 1;
  const textPeu = String(actual.text || '').trim();
  /* xat-05 · Una URL que caduca només es descarrega amb la signatura fresca;
     sense port que la signe (llavor) o sense caducitat (blob:, data:), la de la vista. */
  let hrefDescarrega = urlActiva;
  if (urlActiva && vistaCaduca && potSignar && adjuntActual) {
    hrefDescarrega = descarrega?.id === idActual ? descarrega.url : null;
  }

  return createPortal(
    <div
      className="sdp-xat-visor"
      role="dialog"
      aria-modal="true"
      aria-label={t('section.xat.visor.titol', 'Visor de fotos de la conversa')}
      ref={dialogRef}
      onClick={(e) => { if (e.target === e.currentTarget) tanca(); }}
    >
      <header className="sdp-xat-visor__capcalera">
        <div className="sdp-xat-visor__autor">
          <CaraXat nom={actual.autor} src={actual.avatar || null} llavor={actual.llavor || actual.autor} mida="sm" alt="" />
          <div className="sdp-xat-visor__meta">
            <strong className="sdp-xat-visor__nom">{actual.autor}</strong>
            {dataFormatejada ? <time className="sdp-xat-visor__data" dateTime={actual.creatAl || undefined}>{dataFormatejada}</time> : null}
          </div>
        </div>
        <div className="sdp-xat-visor__accions">
          <button
            type="button"
            className="sdp-xat-visor__accio"
            aria-pressed={ampliat}
            aria-label={ampliat ? t('section.xat.visor.reduir', 'Reduïx el zoom (1×)') : t('section.xat.visor.ampliar', 'Amplia el zoom (2×)')}
            onClick={() => setAmpliat((z) => !z)}
          >
            {ampliat ? <ZoomOut size={20} aria-hidden="true" focusable="false" /> : <ZoomIn size={20} aria-hidden="true" focusable="false" />}
            <span>{ampliat ? '2×' : '1×'}</span>
          </button>
          {hrefDescarrega ? (
            <a
              className="sdp-xat-visor__accio"
              href={hrefDescarrega}
              download={nomFitxer}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('section.xat.visor.descarrega', 'Descarrega la foto')}
            >
              <Download size={20} aria-hidden="true" focusable="false" />
              <span className="sdp-xat-visor__accio-text">{t('section.xat.visor.descarregarCurt', 'Descarregar')}</span>
            </a>
          ) : null}
          <button
            ref={tancaRef}
            type="button"
            className="sdp-xat-visor__tanca"
            aria-label={t('common.tanca', 'Tanca')}
            onClick={tanca}
          >
            <X size={22} aria-hidden="true" focusable="false" />
          </button>
        </div>
      </header>

      <div className="sdp-xat-visor__escenari" onClick={(e) => { if (e.target === e.currentTarget) tanca(); }}>
        {teCarrusel ? (
          <button
            type="button"
            className="sdp-xat-visor__fletxa sdp-xat-visor__fletxa--anterior"
            aria-label={t('section.xat.visor.anterior', 'Foto anterior')}
            onClick={anterior}
          >
            <ChevronLeft size={24} aria-hidden="true" focusable="false" />
          </button>
        ) : null}

        <figure className="sdp-xat-visor__figura">
          {urlActiva ? (
            <img
              className={ampliat ? 'sdp-xat-visor__imatge sdp-xat-visor__imatge--zoom' : 'sdp-xat-visor__imatge'}
              src={urlActiva}
              alt={textPeu || `${t('section.xat.adjunts.foto', 'Foto adjunta')} — ${actual.autor}`}
              onDoubleClick={() => setAmpliat((z) => !z)}
              onError={fallaVista}
            />
          ) : (
            <p className="sdp-xat-visor__carregant" role="status">{t('section.xat.adjunts.carregant', 'Carregant el fitxer…')}</p>
          )}
          {textPeu ? <figcaption className="sdp-xat-visor__peu" dir="auto">{textPeu}</figcaption> : null}
        </figure>

        {teCarrusel ? (
          <button
            type="button"
            className="sdp-xat-visor__fletxa sdp-xat-visor__fletxa--seguent"
            aria-label={t('section.xat.visor.seguent', 'Foto següent')}
            onClick={seguent}
          >
            <ChevronRight size={24} aria-hidden="true" focusable="false" />
          </button>
        ) : null}
      </div>

      {imatges.length > 0 ? (
        <div
          className="sdp-xat-visor__carrusel"
          role="group"
          aria-label={t('section.xat.visor.galeria', 'Fotos compartides a la conversa')}
        >
          {imatges.map((item, idx) => (
            <MiniaturaCarrusel
              key={item.id}
              item={item}
              activa={idx === indexActiu}
              urlConeguda={urlsResoltes[item.id] || null}
              externalConfig={externalConfig}
              onSelecciona={() => seleccionaIndex(idx)}
              etiqueta={`${t('section.xat.adjunts.foto', 'Foto adjunta')} ${idx + 1} / ${imatges.length} (${item.autor})`}
            />
          ))}
        </div>
      ) : null}
    </div>,
    capa
  );
}
