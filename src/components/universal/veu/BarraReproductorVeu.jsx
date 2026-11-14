/**
 * BarraReproductorVeu.jsx · IDEA-255 (Onada R23 · 14-11-2026) · Mini-Reproductor
 * Flotant Universal de Veu per a totes les pàgines de lectura de PageFrame.
 *
 * Disseny 100% Pedra Seca:
 *   · Zero inline styles; 100% tokens semàntics de Capa 2 i objectius >= 48px.
 *   · Muntat a la capa superior (`capaDeDalt`) per compatibilitat tant amb l'SPA
 *     com amb l'arrel ombra tancada `<soc-de-poble>` (LLEI_06).
 *   · En vista compacta (`.sdp-root.is-compact`), flota damunt de `nav.mobile-nav`
 *     amb `--sdp-alt-nav-mobil`; en escriptori, centrat a la part inferior.
 *   · Pausa / Continua conserva exactament l'`indexActual` (`[0..N-1]`) perquè
 *     la lectura mai reinicie des de zero ni es pengen les pauses del navegador.
 *   · Selector / cercador ràpid per apartats i text amb salt immediat, ressaltat
 *     suau del paràgraf actiu sense CLS, «Copiar fragment» i «Tancar».
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, ListOrdered, Pause, Play, Search, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';
import { capaDeDalt, desplacaASeccio } from '../PageFrame.jsx';
import { extreuBlocsLecturaVeu, marcaBlocActiuDom } from './lectorPaginaVeu.js';
import * as serveiVeu from '../../../services/veuIaiaService.js';

const TEXTOS = Object.freeze({
  regio: ['veu.reproductor.regio', 'Reproductor de lectura en veu alta'],
  anterior: ['veu.reproductor.anterior', 'Bloc anterior'],
  seguent: ['veu.reproductor.seguent', 'Bloc següent'],
  pausa: ['veu.reproductor.pausa', 'Pausa la lectura'],
  continua: ['veu.reproductor.continua', 'Continua la lectura'],
  tornaEscoltar: ['veu.reproductor.tornaEscoltar', 'Torna a escoltar des del principi'],
  apartats: ['veu.reproductor.apartats', 'Apartats i cerca al text'],
  cercaPlaceholder: ['veu.reproductor.cercaPlaceholder', 'Cerca una paraula o apartat…'],
  cercaEtiqueta: ['veu.reproductor.cercaEtiqueta', 'Cerca dins dels blocs de la pàgina'],
  nomesTitols: ['veu.reproductor.nomesTitols', 'Només apartats'],
  totsElsBlocs: ['veu.reproductor.totsElsBlocs', 'Tots els blocs'],
  senseResultats: ['veu.reproductor.senseResultats', 'Cap paràgraf ni apartat coincidix amb la cerca.'],
  copia: ['veu.reproductor.copia', 'Copiar fragment actual'],
  copiat: ['veu.reproductor.copiat', 'Fragment copiat al porta-retalls.'],
  errorCopia: ['veu.reproductor.errorCopia', 'No s’ha pogut copiar el fragment.'],
  tanca: ['veu.reproductor.tanca', 'Tancar el reproductor de veu'],
  posicio: ['veu.reproductor.posicio', 'Bloc {actual} de {total}'],
  senseVeu: ['veu.reproductor.senseVeu', 'Este navegador no pot llegir la pàgina en veu alta ara mateix.'],
  buit: ['veu.reproductor.buit', 'Esta pàgina no té cap paràgraf disponible per a llegir en veu alta.'],
});

function formatPosicio(plantilla, actual, total) {
  return String(plantilla || 'Bloc {actual} de {total}')
    .replace('{actual}', String(actual))
    .replace('{total}', String(total));
}

function esVistaCompacta(arrelAncora) {
  const sdpRoot = arrelAncora?.closest?.('.sdp-root') || globalThis.document?.querySelector?.('.sdp-root');
  return Boolean(sdpRoot?.classList?.contains?.('is-compact'));
}

export function BarraReproductorVeu({
  oberta = false,
  capcaleraRef = null,
  cosRef = null,
  idioma = 'ca',
  privat = false,
  botoActivadorRef = null,
  onTanca = null,
  onCanviEstat = null,
  /* Per a l'espècimen del catàleg Pedra Seca (/disseny): es pinta al flux sense portal ni auto-reproducció forçada. */
  mostraEspecimen = false,
  blocsMostra = null,
}) {
  const t = useTraductorOpcional();
  const idBase = useId();
  const idPanellSalt = `${idBase}-salt`;
  const barraRef = useRef(null);

  const [destiPortal, setDestiPortal] = useState(null);
  const [compacte, setCompacte] = useState(false);
  const [blocs, setBlocs] = useState(() => (Array.isArray(blocsMostra) ? blocsMostra : []));
  const [indexActual, setIndexActual] = useState(0);
  /* 'parlant' | 'pausat' | 'acabat' | 'error' */
  const [estat, setEstat] = useState(() => (mostraEspecimen ? 'pausat' : 'parlant'));
  const [panellSaltObert, setPanellSaltObert] = useState(false);
  const [filtreSalt, setFiltreSalt] = useState('tots'); // 'tots' | 'titols'
  const [cercaText, setCercaText] = useState('');
  const [missatgeEstat, setMissatgeEstat] = useState('');
  const [copiatRecent, setCopiatRecent] = useState(false);
  const [clauVeuActiva, setClauVeuActiva] = useState(() => serveiVeu.llegeixVeuPreferida());
  const [cicleCua, setCicleCua] = useState(0);

  const sessioIdRef = useRef(0);
  const indexRef = useRef(0);
  const blocsRef = useRef(blocs);
  const estatRef = useRef(estat);
  const ressaltatDomRef = useRef(null);
  const timerCopiatRef = useRef(null);

  blocsRef.current = blocs;
  indexRef.current = indexActual;
  estatRef.current = estat;

  useEffect(() => {
    onCanviEstat?.({ oberta, parlant: oberta && estat === 'parlant', estat, indexActual, total: blocs.length });
  }, [oberta, estat, indexActual, blocs.length, onCanviEstat]);

  /* Observa `.sdp-root.is-compact` perquè la barra portalitzada sàpia sempre si `nav.mobile-nav` és present. */
  useLayoutEffect(() => {
    if (!oberta || mostraEspecimen) {
      setDestiPortal(null);
      return undefined;
    }
    const ancora = cosRef?.current || capcaleraRef?.current || botoActivadorRef?.current || null;
    setDestiPortal(capaDeDalt(ancora));
    const sdpRoot = ancora?.closest?.('.sdp-root') || globalThis.document?.querySelector?.('.sdp-root');
    const actualitzaCompacte = () => setCompacte(esVistaCompacta(ancora));
    actualitzaCompacte();
    if (!sdpRoot || typeof MutationObserver !== 'function') return undefined;
    const obs = new MutationObserver(actualitzaCompacte);
    obs.observe(sdpRoot, { attributes: true, attributeFilter: ['class', 'data-sdp-immersiu'] });
    return () => obs.disconnect();
  }, [oberta, mostraEspecimen, cosRef, capcaleraRef, botoActivadorRef]);

  /* Subscripció a canvis de veu preferida (MenuTraduir o banc de veus): actualitza en calent sense perdre el bloc! */
  useEffect(() => serveiVeu.subscriuVeuPreferida((novaVeu) => {
    setClauVeuActiva(novaVeu);
  }), []);

  /* Re-indexa els blocs quan s'obri el reproductor o quan canvia l'idioma/vista traduïda. */
  useEffect(() => {
    if (!oberta) {
      sessioIdRef.current += 1;
      serveiVeu.atura();
      ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, null);
      setPanellSaltObert(false);
      setCercaText('');
      return;
    }
    if (Array.isArray(blocsMostra)) {
      setBlocs(blocsMostra);
      setIndexActual(0);
      return;
    }
    const extrets = extreuBlocsLecturaVeu({
      capcalera: capcaleraRef?.current || null,
      cos: cosRef?.current || null,
    });
    setBlocs(extrets);
    setIndexActual(0);
    indexRef.current = 0;
    setMissatgeEstat('');
    if (extrets.length === 0) {
      setEstat('error');
      setMissatgeEstat(tradueix(t, TEXTOS.buit));
      return;
    }
    if (!mostraEspecimen) {
      setEstat('parlant');
    }
  }, [oberta, idioma, capcaleraRef, cosRef, blocsMostra, mostraEspecimen, t]);

  /* Neteja garantida en desmuntar. */
  useEffect(() => () => {
    sessioIdRef.current += 1;
    clearTimeout(timerCopiatRef.current);
    if (!mostraEspecimen) serveiVeu.atura();
    ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, null);
  }, [mostraEspecimen]);

  /* Ressaltat suau del bloc actiu al DOM mientras el reproductor és obert. */
  useEffect(() => {
    if (!oberta || mostraEspecimen || blocs.length === 0) {
      ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, null);
      return;
    }
    const actual = blocs[indexActual]?.element || null;
    ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, actual);
  }, [oberta, mostraEspecimen, blocs, indexActual]);

  /* Motor seqüencial determinista: quan `estat === 'parlant'`, llig des d'`indexRef.current` fins al final. */
  useEffect(() => {
    if (!oberta || estat !== 'parlant' || blocs.length === 0) return undefined;
    const idSessio = sessioIdRef.current + 1;
    sessioIdRef.current = idSessio;
    const control = new AbortController();

    const correCua = async () => {
      let i = indexRef.current;
      if (i < 0 || i >= blocs.length) {
        i = 0;
        setIndexActual(0);
        indexRef.current = 0;
      }
      while (i < blocs.length && sessioIdRef.current === idSessio && !control.signal.aborted) {
        const bloc = blocs[i];
        setIndexActual(i);
        indexRef.current = i;
        if (!mostraEspecimen && bloc?.element) {
          ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, bloc.element);
        }
        try {
          await serveiVeu.parla(bloc.text, {
            idioma: idioma || 'ca',
            privat,
            veu: clauVeuActiva || undefined,
            signal: control.signal,
          });
        } catch (err) {
          if (sessioIdRef.current !== idSessio || control.signal.aborted || err?.codi === serveiVeu.CODI_VEU_AVORTADA) {
            return;
          }
          setEstat('error');
          setMissatgeEstat(tradueix(t, TEXTOS.senseVeu));
          return;
        }
        if (sessioIdRef.current !== idSessio || control.signal.aborted) return;
        i += 1;
        if (i < blocs.length && !mostraEspecimen && blocs[i]?.element) {
          desplacaASeccio(blocs[i].element, { behavior: 'smooth', block: 'start' });
        }
      }
      if (sessioIdRef.current === idSessio && !control.signal.aborted) {
        setEstat('acabat');
      }
    };

    correCua();
    return () => {
      control.abort();
    };
  }, [oberta, estat, cicleCua, blocs, idioma, privat, clauVeuActiva, mostraEspecimen, t]);

  const alternaPausaContinua = useCallback(() => {
    if (blocsRef.current.length === 0) return;
    setMissatgeEstat('');
    if (estatRef.current === 'parlant') {
      sessioIdRef.current += 1;
      serveiVeu.atura();
      setEstat('pausat');
      return;
    }
    if (estatRef.current === 'acabat') {
      indexRef.current = 0;
      setIndexActual(0);
    }
    setEstat('parlant');
  }, []);

  const saltaABloc = useCallback((nouIndex, { tancaSelector = false } = {}) => {
    const total = blocsRef.current.length;
    if (total === 0) return;
    const desti = Math.min(Math.max(0, nouIndex), total - 1);
    sessioIdRef.current += 1;
    serveiVeu.atura();
    indexRef.current = desti;
    setIndexActual(desti);
    setMissatgeEstat('');
    if (tancaSelector) {
      setPanellSaltObert(false);
    }
    const element = blocsRef.current[desti]?.element;
    if (!mostraEspecimen && element) {
      desplacaASeccio(element, { behavior: 'smooth', block: 'start' });
    }
    /* Incrementem `cicleCua` explícitament per re-disparar el motor seqüencial sense dependre de `queueMicrotask` ni del batching de React. */
    setCicleCua((n) => n + 1);
    setEstat('parlant');
  }, [mostraEspecimen]);

  const copiaFragmentActual = useCallback(async () => {
    const bloc = blocsRef.current[indexRef.current];
    if (!bloc?.text) return;
    clearTimeout(timerCopiatRef.current);
    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(bloc.text);
      } else {
        throw new Error('Clipboard no disponible');
      }
      setCopiatRecent(true);
      setMissatgeEstat(tradueix(t, TEXTOS.copiat));
      timerCopiatRef.current = setTimeout(() => {
        setCopiatRecent(false);
      }, 2200);
    } catch {
      setCopiatRecent(false);
      setMissatgeEstat(tradueix(t, TEXTOS.errorCopia));
    }
  }, [t]);

  const tancaReproductor = useCallback(() => {
    const arrelDoc = barraRef.current?.getRootNode?.() || globalThis.document;
    const focusDins = Boolean(barraRef.current && arrelDoc?.activeElement && barraRef.current.contains(arrelDoc.activeElement));
    sessioIdRef.current += 1;
    serveiVeu.atura();
    ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, null);
    setPanellSaltObert(false);
    setCercaText('');
    onTanca?.();
    if (focusDins && botoActivadorRef?.current) {
      queueMicrotask(() => {
        botoActivadorRef.current?.focus?.();
      });
    }
  }, [onTanca, botoActivadorRef]);

  const blocsFiltrats = useMemo(() => {
    const q = cercaText.trim().toLowerCase();
    return blocs.filter((bloc) => {
      if (filtreSalt === 'titols' && !bloc.esTitol) return false;
      if (!q) return true;
      return bloc.text.toLowerCase().includes(q) || bloc.seccioTitol.toLowerCase().includes(q);
    });
  }, [blocs, filtreSalt, cercaText]);

  if (!oberta) return null;
  if (!mostraEspecimen && !destiPortal) return null;

  const total = blocs.length;
  const blocActiu = blocs[indexActual] || null;
  const parlant = estat === 'parlant';
  const etiquetaPosicio = total > 0
    ? formatPosicio(tradueix(t, TEXTOS.posicio), indexActual + 1, total)
    : '';
  const etiquetaPlay = parlant
    ? tradueix(t, TEXTOS.pausa)
    : estat === 'acabat'
      ? tradueix(t, TEXTOS.tornaEscoltar)
      : tradueix(t, TEXTOS.continua);

  const contingut = (
    <aside
      ref={barraRef}
      className={mostraEspecimen ? 'sdp-barra-veu sdp-barra-veu--especimen' : 'sdp-barra-veu'}
      data-compacte={!mostraEspecimen && compacte ? 'true' : undefined}
      data-sdp-no-locutar=""
      translate="no"
      aria-label={tradueix(t, TEXTOS.regio)}
    >
      {panellSaltObert && total > 0 ? (
        <div id={idPanellSalt} className="sdp-barra-veu__panell-salt">
          <div className="sdp-barra-veu__cerca-fila">
            <label htmlFor={`${idBase}-cerca`} className="sr-only">
              {tradueix(t, TEXTOS.cercaEtiqueta)}
            </label>
            <div className="sdp-barra-veu__cerca-camp">
              <Search size={18} aria-hidden="true" focusable="false" />
              <input
                id={`${idBase}-cerca`}
                type="search"
                className="sdp-barra-veu__cerca-input"
                value={cercaText}
                onChange={(ev) => setCercaText(ev.target.value)}
                placeholder={tradueix(t, TEXTOS.cercaPlaceholder)}
              />
            </div>
            <div className="sdp-barra-veu__filtres" role="group" aria-label={tradueix(t, TEXTOS.apartats)}>
              <button
                type="button"
                className={filtreSalt === 'tots' ? 'sdp-barra-veu__pindola sdp-barra-veu__pindola--activa' : 'sdp-barra-veu__pindola'}
                aria-pressed={filtreSalt === 'tots'}
                onClick={() => setFiltreSalt('tots')}
              >
                {tradueix(t, TEXTOS.totsElsBlocs)}
              </button>
              <button
                type="button"
                className={filtreSalt === 'titols' ? 'sdp-barra-veu__pindola sdp-barra-veu__pindola--activa' : 'sdp-barra-veu__pindola'}
                aria-pressed={filtreSalt === 'titols'}
                onClick={() => setFiltreSalt('titols')}
              >
                {tradueix(t, TEXTOS.nomesTitols)}
              </button>
            </div>
          </div>

          {blocsFiltrats.length === 0 ? (
            <p className="sdp-barra-veu__buit">{tradueix(t, TEXTOS.senseResultats)}</p>
          ) : (
            <ul className="sdp-barra-veu__llista-salt">
              {blocsFiltrats.map((bloc) => {
                const esActiu = bloc.index === indexActual;
                return (
                  <li key={bloc.id} className="sdp-barra-veu__item-salt">
                    <button
                      type="button"
                      className={[
                        'sdp-barra-veu__boto-salt',
                        bloc.esTitol ? 'sdp-barra-veu__boto-salt--titol' : '',
                        esActiu ? 'sdp-barra-veu__boto-salt--actiu' : '',
                      ].filter(Boolean).join(' ')}
                      aria-current={esActiu ? 'step' : undefined}
                      onClick={() => saltaABloc(bloc.index, { tancaSelector: true })}
                    >
                      <span className="sdp-barra-veu__salt-num">{bloc.index + 1}</span>
                      <span className="sdp-barra-veu__salt-text">{bloc.resumCurt}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div className="sdp-barra-veu__cap">
        <div className="sdp-barra-veu__resum">
          <span className="sdp-barra-veu__meta">
            <Volume2 size={16} aria-hidden="true" focusable="false" />
            <span>{etiquetaPosicio}</span>
            {blocActiu?.seccioTitol ? (
              <span className="sdp-barra-veu__seccio">· {blocActiu.seccioTitol}</span>
            ) : null}
          </span>
          {blocActiu ? (
            <p className="sdp-barra-veu__fragment">{blocActiu.resumCurt}</p>
          ) : null}
        </div>
        {total > 0 ? (
          <button
            type="button"
            className={panellSaltObert ? 'sdp-barra-veu__control sdp-barra-veu__control--actiu' : 'sdp-barra-veu__control'}
            aria-expanded={panellSaltObert}
            aria-controls={idPanellSalt}
            aria-label={tradueix(t, TEXTOS.apartats)}
            onClick={() => setPanellSaltObert((v) => !v)}
          >
            <ListOrdered size={20} aria-hidden="true" focusable="false" />
          </button>
        ) : null}
      </div>

      <div className="sdp-barra-veu__controls">
        <button
          type="button"
          className="sdp-barra-veu__control"
          aria-label={tradueix(t, TEXTOS.anterior)}
          disabled={total === 0 || indexActual <= 0}
          onClick={() => saltaABloc(indexActual - 1)}
        >
          <SkipBack size={20} aria-hidden="true" focusable="false" />
        </button>

        <button
          type="button"
          className="sdp-barra-veu__control sdp-barra-veu__control--principal"
          aria-label={etiquetaPlay}
          disabled={total === 0}
          onClick={alternaPausaContinua}
        >
          {parlant ? (
            <Pause size={22} aria-hidden="true" focusable="false" />
          ) : (
            <Play size={22} aria-hidden="true" focusable="false" />
          )}
        </button>

        <button
          type="button"
          className="sdp-barra-veu__control"
          aria-label={tradueix(t, TEXTOS.seguent)}
          disabled={total === 0 || indexActual >= total - 1}
          onClick={() => saltaABloc(indexActual + 1)}
        >
          <SkipForward size={20} aria-hidden="true" focusable="false" />
        </button>

        <button
          type="button"
          className={copiatRecent ? 'sdp-barra-veu__control sdp-barra-veu__control--actiu' : 'sdp-barra-veu__control'}
          aria-label={tradueix(t, TEXTOS.copia)}
          disabled={!blocActiu}
          onClick={copiaFragmentActual}
        >
          {copiatRecent ? (
            <Check size={20} aria-hidden="true" focusable="false" />
          ) : (
            <Copy size={20} aria-hidden="true" focusable="false" />
          )}
        </button>

        <button
          type="button"
          className="sdp-barra-veu__control"
          aria-label={tradueix(t, TEXTOS.tanca)}
          onClick={tancaReproductor}
        >
          <X size={20} aria-hidden="true" focusable="false" />
        </button>
      </div>

      <p
        className={missatgeEstat ? 'sdp-barra-veu__avis' : 'sr-only'}
        role="status"
        aria-live="polite"
      >
        {missatgeEstat}
      </p>
    </aside>
  );

  if (mostraEspecimen) return contingut;
  return createPortal(contingut, destiPortal);
}

export default BarraReproductorVeu;
