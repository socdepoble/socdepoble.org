/**
 * BarraReproductorVeu.jsx · IDEA-255 (Onada R23) + IDEA-268 (Onada R27 · 15-11-2026) ·
 * Reproductor Flotant Universal de So per a totes les pàgines de lectura de
 * PageFrame i preparat per a emissions d'àudio com la futura Ràdio de Poble.
 *
 * Disseny 100% Pedra Seca:
 *   · Zero objectes style inline; 100% tokens semàntics de Capa 2 i objectius >= 48px.
 *   · Muntat dins de `.sdp-root` (o `capaDeDalt` de reserva) per compatibilitat
 *     completa amb l'SPA i amb l'arrel ombra tancada `<soc-de-poble>` (LLEI_06).
 *   · Centrat geomètric mil·limètric sobre el panell de lectura actiu tant en
 *     mòbil (`.sdp-root.is-compact`, damunt de `nav.mobile-nav` i coordinat amb
 *     `.sdp-tornar-dalt` via `data-sdp-veu-oberta`) com en escriptori amb barra
 *     lateral oberta, tancada o espais multicolumna (`--barra-veu-inici` i
 *     `--barra-veu-fi` mesurats amb ResizeObserver). Són propietats locals
 *     calculades en temps d'execució, no tokens: per això no porten el prefix
 *     `--sdp-`, que només declara src/css/tokens.css (com `--cal-*` al Calendari).
 *   · Pausa / Continua conserva exactament l'`indexActual` (`[0..N-1]`) i, en
 *     fonts d'àudio (`fontSo`), l'instant de reproducció de la pista activa.
 *   · `seguixLectura={false}` (obertura des del Banc de Veus) no desplaça la
 *     pàgina quan la lectura passa al bloc següent, i `invocadorRef` és el
 *     control on torna el focus en tancar (si no, el disparador de dalt, sense
 *     desplaçar la pàgina).
 *   · Contracte desacoplat `fontSo` (`tipus: 'lectura' | 'audio'`) llest per a
 *     connectar pistes i emissions en directe de Ràdio de Poble sense duplicar UI.
 *   · Onada R28 · Una locució aliena (el Refranyer, el joc o l'opció del menú
 *     Traduir) que avorta la de la barra la deixa en pausa al mateix bloc. Triar
 *     un apartat o prémer Escape dins del panell «Apartats» el tanca i torna el
 *     focus al seu botó; `aria-controls` només apunta al panell quan existix.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
/* Onada R28 · D-R27-1 (opció b) · L'estil de la peça no viatja a l'arrencada: s'adopta en pintar-se. */
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssBarraVeu from '../../../css/diferit-barra-veu.css?inline';
import { createPortal } from 'react-dom';
import { Check, Copy, ListOrdered, Pause, Play, Radio, Search, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { resolveAsset } from '../../../config/assetResolver.js';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';
import { capaDeDalt, desplacaASeccio } from '../PageFrame.jsx';
import { extreuBlocsLecturaVeu, marcaBlocActiuDom } from './lectorPaginaVeu.js';
import * as serveiVeu from '../../../services/veuIaiaService.js';

const TEXTOS = Object.freeze({
  regio: ['veu.reproductor.regio', 'Reproductor de lectura en veu alta'],
  regioAudio: ['veu.reproductor.regioAudio', 'Reproductor universal de so'],
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
  posicioAudio: ['veu.reproductor.posicioAudio', 'Pista {actual} de {total}'],
  enDirecte: ['veu.reproductor.enDirecte', 'Ràdio de Poble · En directe'],
  senseVeu: ['veu.reproductor.senseVeu', 'Este navegador no pot llegir la pàgina en veu alta ara mateix.'],
  senseAudio: ['veu.reproductor.senseAudio', 'No s’ha pogut reproduir esta pista d’àudio ara mateix.'],
  buit: ['veu.reproductor.buit', 'Esta pàgina no té cap paràgraf disponible per a llegir en veu alta.'],
});

/* Onada R29 · R29-02-05 · Amb una font d'àudio (fontSo 'audio') els controls parlen de pistes,
   no de blocs ni de lectura. La resta de textos són els mateixos que en mode lectura. */
const TEXTOS_AUDIO = Object.freeze({
  ...TEXTOS,
  anterior: ['veu.reproductor.anteriorAudio', 'Pista anterior'],
  seguent: ['veu.reproductor.seguentAudio', 'Pista següent'],
  pausa: ['veu.reproductor.pausaAudio', 'Pausa l’àudio'],
  continua: ['veu.reproductor.continuaAudio', 'Escolta l’àudio'],
  tornaEscoltar: ['veu.reproductor.tornaEscoltarAudio', 'Torna a escoltar des de la primera pista'],
  apartats: ['veu.reproductor.apartatsAudio', 'Llista de pistes i cerca'],
  cercaPlaceholder: ['veu.reproductor.cercaPlaceholderAudio', 'Cerca una pista…'],
  cercaEtiqueta: ['veu.reproductor.cercaEtiquetaAudio', 'Cerca entre les pistes'],
  senseResultats: ['veu.reproductor.senseResultatsAudio', 'Cap pista coincidix amb la cerca.'],
  copia: ['veu.reproductor.copiaAudio', 'Copiar el text de la pista'],
  copiat: ['veu.reproductor.copiatAudio', 'Text de la pista copiat al porta-retalls.'],
  errorCopia: ['veu.reproductor.errorCopiaAudio', 'No s’ha pogut copiar el text de la pista.'],
  tanca: ['veu.reproductor.tancaAudio', 'Tancar el reproductor de so'],
});

function formatPosicio(plantilla, actual, total) {
  return String(plantilla || 'Bloc {actual} de {total}')
    .replace('{actual}', String(actual))
    .replace('{total}', String(total));
}

function trobaSdpRoot(ancora) {
  return ancora?.closest?.('.sdp-root') || globalThis.document?.querySelector?.('.sdp-root') || null;
}

function destiDelReproductor(ancora) {
  return trobaSdpRoot(ancora) || capaDeDalt(ancora);
}

function esVistaCompacta(ancora) {
  return Boolean(trobaSdpRoot(ancora)?.classList?.contains?.('is-compact'));
}

function normalitzaPistesFontSo(fontSo) {
  if (!fontSo || !Array.isArray(fontSo.pistes) || fontSo.pistes.length === 0) return null;
  const emissio = typeof fontSo.titolEmissio === 'string' ? fontSo.titolEmissio.trim() : '';
  return fontSo.pistes
    .filter((p) => p && (typeof p.titol === 'string' || typeof p.text === 'string'))
    .map((pista, idx) => {
      const titol = String(pista.titol || pista.text || `Pista ${idx + 1}`).trim();
      const subtitol = String(pista.subtitol || emissio || '').trim();
      const text = String(pista.text || titol).trim();
      const srcAudio = typeof pista.src === 'string' && pista.src.trim() ? resolveAsset(pista.src.trim()) : null;
      return {
        index: idx,
        id: String(pista.id || `pista-${idx}`),
        etiqueta: srcAudio ? 'audio' : 'p',
        esTitol: Boolean(pista.esCapitol),
        seccioTitol: subtitol,
        resumCurt: titol,
        text,
        srcAudio,
        element: null,
      };
    });
}

export function BarraReproductorVeu({
  oberta = false,
  capcaleraRef = null,
  cosRef = null,
  idioma = 'ca',
  privat = false,
  fontSo = null,
  botoActivadorRef = null,
  /* Control que ha obert el reproductor (p. ex. «Tria esta veu»): hi torna el focus en tancar. */
  invocadorRef = null,
  /* Amb false, l'avanç automàtic de bloc no desplaça la pàgina (la persona es queda on és). */
  seguixLectura = true,
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
  /* Onada R28 · veu-editorial-06/10 · El botó «Apartats i cerca al text», on torna el focus en tancar el panell. */
  const botoApartatsRef = useRef(null);
  useFullDiferit(barraRef, 'barra-veu', cssBarraVeu);
  const audioFontRef = useRef(null);
  const pistaAudioCarregadaRef = useRef('');

  /* Onada R28 (revisió adversarial, P3) · Les pistes es memoritzen pel contingut, no per la identitat de l'objecte:
     un pare que passe fontSo com a literal nou a cada render no ha de tornar la Ràdio a la pista 1. */
  const signaturaFontSo = useMemo(() => {
    const pistes = normalitzaPistesFontSo(fontSo);
    return pistes ? JSON.stringify([fontSo?.tipus, fontSo?.enDirecte, pistes.map((p) => [p.id, p.resumCurt, p.seccioTitol, p.text, p.srcAudio, p.esTitol])]) : '';
  }, [fontSo]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- es recalcula només quan canvia la signatura del contingut
  const pistesFontSo = useMemo(() => normalitzaPistesFontSo(fontSo), [signaturaFontSo]);
  const esFontAudio = Boolean(fontSo?.tipus === 'audio' && pistesFontSo?.some((p) => Boolean(p.srcAudio)));
  const textos = esFontAudio ? TEXTOS_AUDIO : TEXTOS;

  const [destiPortal, setDestiPortal] = useState(null);
  const [compacte, setCompacte] = useState(false);
  const [blocs, setBlocs] = useState(() => (pistesFontSo || (Array.isArray(blocsMostra) ? blocsMostra : [])));
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
  /* Onada R29 · R29-CV-05 · Testimoni de la locució que la barra té en curs (null si no en té cap,
     o si una altra peça l'ha tallada): tancar o desmuntar només aturen la veu si és de la barra. */
  const veuPropiaRef = useRef(null);
  const aturaVeuPropia = useCallback(() => {
    const propia = veuPropiaRef.current;
    veuPropiaRef.current = null;
    if (typeof propia?.tanca === 'function') propia.tanca();
    else if (propia) serveiVeu.atura();
  }, []);
  const indexRef = useRef(0);
  const blocsRef = useRef(blocs);
  const estatRef = useRef(estat);
  const obertaRef = useRef(oberta);
  const ressaltatDomRef = useRef(null);
  const timerCopiatRef = useRef(null);
  /* Onada R29 · R29-UI-01 · La còpia pot continuar al sistema després de tancar la barra. Només
     l'última petició de la sessió vigent pot publicar estat o crear un timer. */
  const copiaIdRef = useRef(0);
  /* En ref i no en les dependències del motor: canviar-lo no ha de reiniciar el bloc que sona. */
  const seguixLecturaRef = useRef(seguixLectura);

  blocsRef.current = blocs;
  indexRef.current = indexActual;
  estatRef.current = estat;
  obertaRef.current = oberta;
  seguixLecturaRef.current = seguixLectura;

  useEffect(() => {
    onCanviEstat?.({
      oberta,
      parlant: oberta && estat === 'parlant',
      estat,
      indexActual,
      total: blocs.length,
      tipusFont: esFontAudio ? 'audio' : 'lectura',
    });
  }, [oberta, estat, indexActual, blocs.length, esFontAudio, onCanviEstat]);

  /* Portal dins `.sdp-root` (o `capaDeDalt`) i marca `data-sdp-veu-oberta` per a no xocar amb `.sdp-tornar-dalt`. */
  useLayoutEffect(() => {
    if (!oberta || mostraEspecimen) {
      setDestiPortal(null);
      return undefined;
    }
    const ancora = cosRef?.current || capcaleraRef?.current || botoActivadorRef?.current || null;
    const desti = destiDelReproductor(ancora);
    setDestiPortal(desti);
    const sdpRoot = trobaSdpRoot(ancora);
    if (sdpRoot) {
      sdpRoot.setAttribute('data-sdp-veu-oberta', 'true');
    }
    const actualitzaCompacte = () => setCompacte(esVistaCompacta(ancora));
    actualitzaCompacte();
    let obs = null;
    if (sdpRoot && typeof MutationObserver === 'function') {
      obs = new MutationObserver(actualitzaCompacte);
      obs.observe(sdpRoot, { attributes: true, attributeFilter: ['class', 'data-sdp-immersiu', 'data-sdp-barres'] });
    }
    return () => {
      obs?.disconnect();
      if (sdpRoot) {
        sdpRoot.removeAttribute('data-sdp-veu-oberta');
      }
    };
  }, [oberta, mostraEspecimen, cosRef, capcaleraRef, botoActivadorRef]);

  /* IDEA-268 · Centrat geomètric mil·limètric respecte del panell de lectura actiu
     (escriptori amb barra lateral oberta/tancada, Workspace de 3 columnes i mòbil). */
  useLayoutEffect(() => {
    if (!oberta || mostraEspecimen || !destiPortal) return undefined;
    const ancora = cosRef?.current || capcaleraRef?.current || botoActivadorRef?.current || null;
    const panell = ancora?.closest?.('.sdp-universal-page-container, .sdp-workspace-detail, .app-main__content, main.app-main') || null;
    const sdpRoot = trobaSdpRoot(ancora);
    const sidebar = sdpRoot?.querySelector?.('nav.app-sidebar') || null;

    const actualitzaGeometria = () => {
      const barraEl = barraRef.current;
      if (!barraEl || typeof destiPortal.getBoundingClientRect !== 'function') return;
      const rBarra = barraEl.getBoundingClientRect();
      if (sdpRoot && rBarra.height > 0) {
        sdpRoot.style.setProperty('--barra-veu-alcada', `${Math.ceil(rBarra.height)}px`);
      }
      if (!panell || typeof panell.getBoundingClientRect !== 'function') {
        barraEl.style.removeProperty('--barra-veu-inici');
        barraEl.style.removeProperty('--barra-veu-fi');
        return;
      }
      const rArrel = destiPortal.getBoundingClientRect();
      const rPanell = panell.getBoundingClientRect();
      if (rArrel.width <= 0 || rPanell.width <= 0) return;
      const inici = Math.max(0, Math.round(rPanell.left - rArrel.left));
      const fi = Math.max(0, Math.round(rArrel.right - rPanell.right));
      barraEl.style.setProperty('--barra-veu-inici', `${inici}px`);
      barraEl.style.setProperty('--barra-veu-fi', `${fi}px`);
    };

    actualitzaGeometria();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(actualitzaGeometria) : null;
    if (ro) {
      ro.observe(destiPortal);
      if (barraRef.current) ro.observe(barraRef.current);
      if (panell) ro.observe(panell);
      if (sidebar) ro.observe(sidebar);
    }
    let mo = null;
    if (sdpRoot && typeof MutationObserver === 'function') {
      mo = new MutationObserver(actualitzaGeometria);
      mo.observe(sdpRoot, { attributes: true, attributeFilter: ['class'] });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', actualitzaGeometria, { passive: true });
    }
    return () => {
      ro?.disconnect();
      mo?.disconnect();
      if (sdpRoot) {
        sdpRoot.style.removeProperty('--barra-veu-alcada');
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', actualitzaGeometria);
      }
    };
  }, [oberta, mostraEspecimen, destiPortal, cosRef, capcaleraRef, botoActivadorRef]);

  /* Represa única (Play i canvi de veu en calent): si la lectura ja havia acabat
     torna al bloc 0, i sempre neteja l'avís d'estat anterior (error o copiat). */
  const reprenLectura = useCallback(() => {
    if (estatRef.current === 'acabat') {
      indexRef.current = 0;
      pistaAudioCarregadaRef.current = '';
      setIndexActual(0);
    }
    setMissatgeEstat('');
    setEstat('parlant');
  }, []);

  /* Subscripció a canvis de veu preferida (MenuTraduir o banc de veus): actualitza en calent sense perdre el bloc! */
  useEffect(() => serveiVeu.subscriuVeuPreferida((novaVeu) => {
    setClauVeuActiva(novaVeu);
    if (!mostraEspecimen && !esFontAudio && obertaRef.current && blocsRef.current.length > 0 && estatRef.current !== 'parlant') {
      reprenLectura();
    }
  }), [mostraEspecimen, esFontAudio, reprenLectura]);

  /* Pistes d'una font d'àudio: només es tornen a carregar (i a sonar des de la
     primera) quan s'obri el reproductor o quan canvien les pistes mateixes, mai
     per un canvi d'idioma, de traductor o de cos de la pàgina. */
  useEffect(() => {
    if (!oberta || !pistesFontSo) return;
    setBlocs(pistesFontSo);
    setIndexActual(0);
    indexRef.current = 0;
    pistaAudioCarregadaRef.current = '';
    setMissatgeEstat('');
    if (!mostraEspecimen) setEstat('parlant');
  }, [oberta, pistesFontSo, mostraEspecimen]);

  /* Re-indexa els blocs de lectura quan s'obri el reproductor o quan canvia l'idioma/vista traduïda. */
  useEffect(() => {
    if (!oberta) {
      sessioIdRef.current += 1;
      copiaIdRef.current += 1;
      clearTimeout(timerCopiatRef.current);
      setCopiatRecent(false);
      setMissatgeEstat('');
      aturaVeuPropia();
      if (audioFontRef.current) {
        try { audioFontRef.current.pause(); } catch { /* ignorat */ }
      }
      pistaAudioCarregadaRef.current = '';
      ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, null);
      setPanellSaltObert(false);
      setCercaText('');
      return;
    }
    /* La font d'àudio la governa l'efecte de les pistes, d'ací dalt. */
    if (pistesFontSo) return;
    if (Array.isArray(blocsMostra)) {
      setBlocs(blocsMostra);
      setIndexActual(0);
      indexRef.current = 0;
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
  }, [oberta, idioma, capcaleraRef, cosRef, pistesFontSo, blocsMostra, mostraEspecimen, t, aturaVeuPropia]);

  /* Neteja garantida en desmuntar. Onada R29 · R29-CV-04/05 · Només calla la veu si és de la barra
     (també a l'espècimen, que abans només avortava la promesa i el bloc continuava sonant). */
  useEffect(() => () => {
    sessioIdRef.current += 1;
    copiaIdRef.current += 1;
    clearTimeout(timerCopiatRef.current);
    aturaVeuPropia();
    if (audioFontRef.current) {
      try { audioFontRef.current.pause(); } catch { /* ignorat */ }
    }
    ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, null);
  }, [aturaVeuPropia]);

  /* Ressaltat suau del bloc actiu al DOM mentre el reproductor és obert en mode lectura. */
  useEffect(() => {
    if (!oberta || mostraEspecimen || esFontAudio || blocs.length === 0) {
      ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, null);
      return;
    }
    const actual = blocs[indexActual]?.element || null;
    ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, actual);
  }, [oberta, mostraEspecimen, esFontAudio, blocs, indexActual]);

  /* Motor d'àudio dedicat quan `fontSo.tipus === 'audio'` (Ràdio de Poble / pistes d'àudio). */
  useEffect(() => {
    if (!oberta || !esFontAudio || blocs.length === 0) return undefined;
    const elAudio = audioFontRef.current;
    if (!elAudio) return undefined;

    if (estat !== 'parlant') {
      try { elAudio.pause(); } catch { /* ignorat */ }
      return undefined;
    }

    let i = indexRef.current;
    if (i < 0 || i >= blocs.length) {
      i = 0;
      indexRef.current = 0;
      setIndexActual(0);
    }
    const pista = blocs[i];
    if (!pista?.srcAudio) {
      setEstat('error');
      setMissatgeEstat(tradueix(t, TEXTOS.senseAudio));
      return undefined;
    }

    if (pistaAudioCarregadaRef.current !== pista.srcAudio) {
      elAudio.src = pista.srcAudio;
      pistaAudioCarregadaRef.current = pista.srcAudio;
    }

    let cancelat = false;
    const onEnded = () => {
      if (cancelat) return;
      const seguent = indexRef.current + 1;
      if (seguent < blocsRef.current.length) {
        indexRef.current = seguent;
        pistaAudioCarregadaRef.current = '';
        setIndexActual(seguent);
        setCicleCua((n) => n + 1);
      } else {
        setEstat('acabat');
      }
    };
    const onError = () => {
      if (cancelat) return;
      setEstat('error');
      setMissatgeEstat(tradueix(t, TEXTOS.senseAudio));
    };

    elAudio.addEventListener('ended', onEnded);
    elAudio.addEventListener('error', onError);

    const promesa = elAudio.play?.();
    if (promesa && typeof promesa.catch === 'function') {
      promesa.catch(() => {
        if (!cancelat) {
          setEstat('error');
          setMissatgeEstat(tradueix(t, TEXTOS.senseAudio));
        }
      });
    }

    return () => {
      cancelat = true;
      elAudio.removeEventListener('ended', onEnded);
      elAudio.removeEventListener('error', onError);
    };
  }, [oberta, esFontAudio, destiPortal, estat, cicleCua, blocs, t]);

  /* Motor seqüencial determinista de lectura de blocs [0..N-1] quan no és una font d'àudio externa. */
  useEffect(() => {
    if (!oberta || esFontAudio || estat !== 'parlant' || blocs.length === 0) return undefined;
    const idSessio = sessioIdRef.current + 1;
    sessioIdRef.current = idSessio;
    const control = new AbortController();
    /* Els ports injectats antics conserven el camí seqüencial. El servei real
       aporta una sessió propietària: un Audio, quatre slots i cua nativa real. */
    const sessio = typeof serveiVeu.creaSessioVeu === 'function' ? serveiVeu.creaSessioVeu({
      idioma: idioma || 'ca', privat, veu: clauVeuActiva || undefined, signal: control.signal
    }) : null;

    const correSessio = async () => {
      let inici = indexRef.current;
      if (inici < 0 || inici >= blocs.length) inici = 0;
      const enCua = new Map();
      const vigent = () => sessioIdRef.current === idSessio && !control.signal.aborted;
      const encua = (i) => {
        if (i >= blocs.length || enCua.has(i) || !vigent()) return;
        const promesa = sessio.parla(blocs[i].text, { onInici: () => {
          if (!vigent()) return;
          setIndexActual(i); indexRef.current = i;
          if (!mostraEspecimen && blocs[i]?.element) {
            ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, blocs[i].element);
            if (i !== inici && seguixLecturaRef.current) desplacaASeccio(blocs[i].element, { behavior: 'smooth', block: 'start' });
          }
          // Preparar no significa sonar: només l'inici real avança el ressaltat.
          for (const futur of [i + 1, i + 2]) {
            if (futur < blocs.length) sessio.precarregaVeu(blocs[futur].text).catch(() => {
              /* La demanda d'eixe bloc aplicarà el fallback del servei si cal. */
            });
          }
        } });
        promesa.catch(() => {}); // El pròxim bloc pot avortar abans que l'esperem.
        enCua.set(i, promesa);
      };
      veuPropiaRef.current = sessio;
      try {
        encua(inici); encua(inici + 1);
        for (let i = inici; i < blocs.length && vigent(); i += 1) {
          await enCua.get(i);
          if (!vigent()) return;
          enCua.delete(i); encua(i + 2);
        }
        if (vigent()) setEstat('acabat');
      } catch (error) {
        if (!vigent()) return;
        if (error?.codi === serveiVeu.CODI_VEU_AVORTADA) setEstat('pausat');
        else { setEstat('error'); setMissatgeEstat(tradueix(t, TEXTOS.senseVeu)); }
      } finally {
        if (veuPropiaRef.current === sessio) veuPropiaRef.current = null;
        sessio.tanca();
      }
    };

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
        const jo = {};
        veuPropiaRef.current = jo;
        try {
          await serveiVeu.parla(bloc.text, {
            idioma: idioma || 'ca',
            privat,
            veu: clauVeuActiva || undefined,
            signal: control.signal,
          });
          if (veuPropiaRef.current === jo) veuPropiaRef.current = null;
        } catch (err) {
          if (veuPropiaRef.current === jo) veuPropiaRef.current = null;
          if (sessioIdRef.current !== idSessio || control.signal.aborted) {
            return;
          }
          /* Onada R28 · veu-editorial-03 · Cada avortament propi (pausa, salt, tancar, desmuntar o
             la neteja d'este efecte) ja canvia la sessió o avorta el control. Un VEU_AVORTADA que
             arriba igualment ve d'un atura() alié (una altra peça de la pàgina ha començat a
             parlar): la barra queda en pausa al mateix bloc, no en «parlant» muda. */
          if (err?.codi === serveiVeu.CODI_VEU_AVORTADA) {
            setEstat('pausat');
            return;
          }
          setEstat('error');
          setMissatgeEstat(tradueix(t, TEXTOS.senseVeu));
          return;
        }
        if (sessioIdRef.current !== idSessio || control.signal.aborted) return;
        i += 1;
        if (i < blocs.length && !mostraEspecimen && seguixLecturaRef.current && blocs[i]?.element) {
          desplacaASeccio(blocs[i].element, { behavior: 'smooth', block: 'start' });
        }
      }
      if (sessioIdRef.current === idSessio && !control.signal.aborted) {
        setEstat('acabat');
      }
    };

    if (sessio) correSessio(); else correCua();
    return () => {
      control.abort();
      sessio?.tanca();
    };
  }, [oberta, esFontAudio, estat, cicleCua, blocs, idioma, privat, clauVeuActiva, mostraEspecimen, t]);

  const alternaPausaContinua = useCallback(() => {
    if (blocsRef.current.length === 0) return;
    setMissatgeEstat('');
    if (estatRef.current === 'parlant') {
      sessioIdRef.current += 1;
      if (esFontAudio) {
        try { audioFontRef.current?.pause(); } catch { /* ignorat */ }
      } else {
        aturaVeuPropia();
      }
      setEstat('pausat');
      return;
    }
    reprenLectura();
  }, [esFontAudio, reprenLectura, aturaVeuPropia]);

  const saltaABloc = useCallback((nouIndex, { tancaSelector = false } = {}) => {
    const total = blocsRef.current.length;
    if (total === 0) return;
    const desti = Math.min(Math.max(0, nouIndex), total - 1);
    sessioIdRef.current += 1;
    if (esFontAudio) {
      try {
        if (audioFontRef.current) {
          audioFontRef.current.pause();
          audioFontRef.current.currentTime = 0;
        }
      } catch { /* ignorat */ }
      pistaAudioCarregadaRef.current = '';
    } else {
      aturaVeuPropia();
    }
    indexRef.current = desti;
    setIndexActual(desti);
    setMissatgeEstat('');
    if (tancaSelector) {
      setPanellSaltObert(false);
      /* Onada R28 · veu-editorial-06 · El botó de l'apartat triat desapareix amb el panell: el focus
         torna al botó «Apartats i cerca al text», sense lluitar amb el desplaçament suau. */
      botoApartatsRef.current?.focus?.({ preventScroll: true });
    }
    const element = blocsRef.current[desti]?.element;
    if (!mostraEspecimen && element) {
      desplacaASeccio(element, { behavior: 'smooth', block: 'start' });
    }
    setCicleCua((n) => n + 1);
    setEstat('parlant');
  }, [esFontAudio, mostraEspecimen, aturaVeuPropia]);

  const copiaFragmentActual = useCallback(async () => {
    const bloc = blocsRef.current[indexRef.current];
    if (!bloc?.text) return;
    const idCopia = ++copiaIdRef.current;
    clearTimeout(timerCopiatRef.current);
    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(bloc.text);
      } else {
        throw new Error('Clipboard no disponible');
      }
      if (idCopia !== copiaIdRef.current || !obertaRef.current) return;
      setCopiatRecent(true);
      setMissatgeEstat(tradueix(t, textos.copiat));
      timerCopiatRef.current = setTimeout(() => {
        setCopiatRecent(false);
      }, 2200);
    } catch {
      if (idCopia !== copiaIdRef.current || !obertaRef.current) return;
      setCopiatRecent(false);
      setMissatgeEstat(tradueix(t, textos.errorCopia));
    }
  }, [t, textos]);

  const tancaReproductor = useCallback(() => {
    const arrelDoc = barraRef.current?.getRootNode?.() || globalThis.document;
    const focusDins = Boolean(barraRef.current && arrelDoc?.activeElement && barraRef.current.contains(arrelDoc.activeElement));
    sessioIdRef.current += 1;
    copiaIdRef.current += 1;
    clearTimeout(timerCopiatRef.current);
    setCopiatRecent(false);
    /* Onada R29 · R29-CV-05 · Pausada per una altra peça (el Refranyer, el joc), tancar la barra no talla eixa veu. */
    aturaVeuPropia();
    if (audioFontRef.current) {
      try { audioFontRef.current.pause(); } catch { /* ignorat */ }
    }
    pistaAudioCarregadaRef.current = '';
    ressaltatDomRef.current = marcaBlocActiuDom(ressaltatDomRef.current, null);
    setPanellSaltObert(false);
    setCercaText('');
    /* El destí del focus es pren ABANS d'onTanca, que pot reiniciar la ref de
       l'invocador. Primer el control que va obrir la barra (on és la persona);
       si ja no és al document, el disparador de dalt sense desplaçar la pàgina. */
    const invocador = invocadorRef?.current || null;
    const tornaAInvocador = Boolean(invocador?.isConnected && typeof invocador.focus === 'function');
    const desti = tornaAInvocador ? invocador : botoActivadorRef?.current || null;
    onTanca?.();
    if (focusDins && desti) {
      queueMicrotask(() => {
        if (tornaAInvocador) {
          desti.focus?.();
        } else {
          desti.focus?.({ preventScroll: true });
        }
      });
    }
  }, [onTanca, botoActivadorRef, invocadorRef, aturaVeuPropia]);

  /* Onada R28 · veu-editorial-10 · Escape dins de la barra tanca el panell «Apartats» i torna el
     focus al seu botó. Amb el panell tancat no fa res: la barra no és cap diàleg i continua sonant. */
  const tancaPanellAmbEscape = useCallback((ev) => {
    if (ev.key !== 'Escape' || !panellSaltObert) return;
    ev.stopPropagation();
    setPanellSaltObert(false);
    botoApartatsRef.current?.focus?.({ preventScroll: true });
  }, [panellSaltObert]);

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
  const etiquetaRegio = esFontAudio
    ? (fontSo?.titolEmissio || tradueix(t, TEXTOS.regioAudio))
    : tradueix(t, TEXTOS.regio);
  const etiquetaPosicio = total > 0
    ? (esFontAudio && fontSo?.enDirecte
      ? tradueix(t, TEXTOS.enDirecte)
      : formatPosicio(tradueix(t, esFontAudio ? TEXTOS.posicioAudio : TEXTOS.posicio), indexActual + 1, total))
    : '';
  const etiquetaPlay = parlant
    ? tradueix(t, textos.pausa)
    : estat === 'acabat'
      ? tradueix(t, textos.tornaEscoltar)
      : tradueix(t, textos.continua);

  const contingut = (
    <aside
      ref={barraRef}
      className={mostraEspecimen ? 'sdp-barra-veu sdp-barra-veu--especimen' : 'sdp-barra-veu'}
      data-compacte={!mostraEspecimen && compacte ? 'true' : undefined}
      data-font-so={esFontAudio ? 'audio' : 'lectura'}
      data-sdp-no-locutar=""
      translate="no"
      aria-label={etiquetaRegio}
      onKeyDown={tancaPanellAmbEscape}
    >
      {esFontAudio ? (
        <audio ref={audioFontRef} preload="none" hidden />
      ) : null}

      {panellSaltObert && total > 0 ? (
        <div id={idPanellSalt} className="sdp-barra-veu__panell-salt">
          <div className="sdp-barra-veu__cerca-fila">
            <label htmlFor={`${idBase}-cerca`} className="sr-only">
              {tradueix(t, textos.cercaEtiqueta)}
            </label>
            <div className="sdp-barra-veu__cerca-camp">
              <Search size={18} aria-hidden="true" focusable="false" />
              <input
                id={`${idBase}-cerca`}
                type="search"
                className="sdp-barra-veu__cerca-input"
                value={cercaText}
                onChange={(ev) => setCercaText(ev.target.value)}
                placeholder={tradueix(t, textos.cercaPlaceholder)}
              />
            </div>
            {!esFontAudio ? (
              <div className="sdp-barra-veu__filtres" role="group" aria-label={tradueix(t, textos.apartats)}>
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
            ) : null}
          </div>

          {blocsFiltrats.length === 0 ? (
            <p className="sdp-barra-veu__buit">{tradueix(t, textos.senseResultats)}</p>
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
            {esFontAudio ? (
              <Radio size={16} aria-hidden="true" focusable="false" />
            ) : (
              <Volume2 size={16} aria-hidden="true" focusable="false" />
            )}
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
            ref={botoApartatsRef}
            type="button"
            className={panellSaltObert ? 'sdp-barra-veu__control sdp-barra-veu__control--actiu' : 'sdp-barra-veu__control'}
            aria-expanded={panellSaltObert}
            /* Onada R28 · veu-editorial-10 · Només apunta al panell quan és al DOM (es munta en obrir-lo). */
            aria-controls={panellSaltObert ? idPanellSalt : undefined}
            aria-label={tradueix(t, textos.apartats)}
            title={tradueix(t, textos.apartats)}
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
          aria-label={tradueix(t, textos.anterior)}
          title={tradueix(t, textos.anterior)}
          disabled={total === 0 || indexActual <= 0}
          onClick={() => saltaABloc(indexActual - 1)}
        >
          <SkipBack size={20} aria-hidden="true" focusable="false" />
        </button>

        <button
          type="button"
          className="sdp-barra-veu__control sdp-barra-veu__control--principal"
          aria-label={etiquetaPlay}
          title={etiquetaPlay}
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
          aria-label={tradueix(t, textos.seguent)}
          title={tradueix(t, textos.seguent)}
          disabled={total === 0 || indexActual >= total - 1}
          onClick={() => saltaABloc(indexActual + 1)}
        >
          <SkipForward size={20} aria-hidden="true" focusable="false" />
        </button>

        <button
          type="button"
          className={copiatRecent ? 'sdp-barra-veu__control sdp-barra-veu__control--actiu' : 'sdp-barra-veu__control'}
          aria-label={tradueix(t, textos.copia)}
          title={tradueix(t, textos.copia)}
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
          aria-label={tradueix(t, textos.tanca)}
          title={tradueix(t, textos.tanca)}
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
