/**
 * EstatDesament.jsx — L'indicador de l'autodesament (skill sdp-universal-editor §1).
 *
 * T47 (ordre del Mestre, 260928). L'editor no té botó «Guardar»:
 *   · 'pendent' / 'enviant' → es veu el núvol amb la fletxa (CloudUpload):
 *     hi ha canvis que el servidor encara no té.
 *   · 'sessio'  → el mateix núvol, i el text diu que cal tornar a entrar per a desar-los.
 *   · 'error'   → un avís (triangle): alguna cosa no s'ha pogut desar.
 *   · 'net'     → el servidor ho ha confirmat tot. Ordre del Mestre (261008,
 *     «confirmació o feedback visual del desat automàtic») · Si abans hi havia
 *     canvis en camí ('pendent', 'enviant' o 'sessio'), el núvol amb el check
 *     (CloudCheck), que ES QUEDA fins al canvi següent: la persona té la
 *     certesa en qualsevol moment, com el «Desat a Drive» de Google Docs. Sense
 *     cap desat d'esta peça (muntada ja en 'net', o després d'un 'error'
 *     resolt sense passar per 'enviant'), no pinta res, com abans. Cap
 *     temporitzador: el check se'n va quan torna un canvi, mai pel rellotge.
 *     Correcció de la revisió (261008) · Un error temporal (sense xarxa, 5xx)
 *     el torna a provar la cua sola, i les dues cues passen d'eixe 'error' a
 *     'net' sense dir mai 'enviant': l'estat sol no distingix eixa confirmació
 *     d'un descart («Tornar al que hi ha desat», «conservar el remot»). Ho diu
 *     el consumidor amb `reintentant`: amb ell, eixe 'error' compta com a
 *     canvis en camí i el pas a 'net' pinta el check; sense, res, com abans.
 * T51 (ordre del Mestre, 260928) · Abans era la ploma (Feather). La ploma
 * queda reservada al botó d'emoticona de l'espai central (EmoticonaBarra):
 * dues plomes alhora a la barra deien dues coses diferents.
 *
 * Dues peces (correcció C13, 260928):
 *   · RegioEstatDesament: la regió role="status" (aria-live="polite"), sempre
 *     al DOM i invisible (sdp-nomes-lector). La closca la munta a la seua
 *     arrel, FORA de la barra taronja: Notes amaga la barra en mòbil i en
 *     columna estreta (display:none), i un node sense caixa no s'anuncia.
 *   · IconaEstatDesament: el que es veu a la barra (PRIMER element de
 *     barActions). En 'pendent' i 'enviant' és decorativa (aria-hidden).
 *     Correcció C14 · En 'error' i 'sessio' és un <button> amb la mateixa
 *     pell i mida que obri el detall (Dialeg lloc="barra"): el que no s'ha
 *     desat i què cal fer, també amb teclat i pantalla tàctil.
 * EstatDesament les pinta juntes (catàleg de Disseny).
 *
 * CONTRACTE: estat · detall (text; buit = el de l'estat) · accions
 *   [{ text, onClick }] (opcional: les eixides del detall; sense, només «Entesos»)
 *   · reintentant (opcional, false) · en 'error', la cua el torna a provar sola:
 *   el pas a 'net' és la confirmació del servidor. No canvia el DOM de l'avís.
 */
import { useEffect, useRef, useState } from 'react';
import { CloudCheck, CloudUpload, TriangleAlert } from 'lucide-react';
import { Boto } from '../PedraSeca/atoms/Boto.jsx';
import { Dialeg } from '../PedraSeca/organismes/Dialeg.jsx';

export const TEXTOS_ESTAT_DESAMENT = Object.freeze({
  net: 'Tots els canvis estan desats.',
  pendent: 'Canvis pendents de desar.',
  /* Mateix text que «pendent»: el lector no ha d'anunciar cada enviament. */
  enviant: 'Canvis pendents de desar.',
  sessio: 'Canvis pendents: cal tornar a entrar per a desar-los.',
  error: 'No s’han pogut desar tots els canvis.',
});

/** Títol del detall (Dialeg) que obri la icona en 'error' i 'sessio'. */
export const TITOL_DETALL_DESAMENT = 'Estat del desament';

/* Els estats que porten detall: la icona hi és un botó. */
const AMB_DETALL = Object.freeze(['error', 'sessio']);

/* Ordre del Mestre (261008) · Les fases amb canvis en camí: passar d'una
   d'elles a 'net' és la confirmació del servidor que pinta el check.
   'reintent' és un 'error' que la cua torna a provar sola (`reintentant`). */
const EN_CAMI = Object.freeze(['pendent', 'enviant', 'sessio', 'reintent']);

const estatConegut = (estat) => (Object.hasOwn(TEXTOS_ESTAT_DESAMENT, estat) ? estat : 'pendent');
const textDe = (estat, detall) => detall || TEXTOS_ESTAT_DESAMENT[estatConegut(estat)];

/** La regió viva, invisible: el lector anuncia cada canvi d'estat. */
export function RegioEstatDesament({ estat = 'net', detall = '' }) {
  return <span className="sdp-nomes-lector" role="status" aria-live="polite">{textDe(estat, detall)}</span>;
}

/** El primer control que es pot enfocar després de `boto` dins del seu pare (la barra). */
function controlSeguent(boto) {
  const candidats = boto.parentElement?.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])') || [];
  return [...candidats].find((el) => el !== boto && !el.closest('dialog')
    && Boolean(boto.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) || null;
}

/** El que es veu a la barra taronja: el núvol dels canvis pendents, l'avís, el check de desat o res. */
export function IconaEstatDesament({ estat = 'net', detall = '', accions = null, reintentant = false }) {
  const clau = estatConegut(estat);
  const text = textDe(clau, detall);
  const ambDetall = AMB_DETALL.includes(clau);
  /* Ordre del Mestre (261008) · La fase anterior i si ja s'ha confirmat un
     desat. Es deriven en el render (el patró de React per a «l'estat
     anterior d'una prop»), sense efecte ni temporitzador: el check apareix en
     el mateix pintat que diu 'net' i se'n va en el mateix que diu 'pendent'.
     La fase és l'estat, llevat d'un 'error' que es torna a provar sol. */
  const fase = clau === 'error' && reintentant ? 'reintent' : clau;
  const [anterior, setAnterior] = useState(fase);
  const [desat, setDesat] = useState(false);
  if (anterior !== fase) {
    setAnterior(fase);
    setDesat(fase === 'net' && EN_CAMI.includes(anterior));
  }
  const [obert, setObert] = useState(false);
  /* El botó es queda muntat fins que el focus hi ha tornat, encara que
     l'estat canvie amb el detall obert (p. ex. el reintent arriba i tot és desat). */
  const [retingut, setRetingut] = useState(false);
  const botoRef = useRef(null);

  /* Com SelectorDataHora: el <dialog> naix dins de la barra, que Notes amaga
     en mòbil. Si el botó PASSA a no tindre caixa amb el detall obert, es tanca. */
  useEffect(() => {
    const boto = botoRef.current;
    if (!obert || !boto || typeof ResizeObserver !== 'function') return undefined;
    let teniaCaixa = boto.getClientRects().length > 0;
    const vigia = new ResizeObserver(() => {
      const teCaixa = boto.getClientRects().length > 0;
      if (teniaCaixa && !teCaixa) setObert(false);
      teniaCaixa = teCaixa;
    });
    vigia.observe(boto);
    return () => vigia.disconnect();
  }, [obert]);

  /* Tancat el detall, el Dialeg (fill, el seu efecte va abans) ja ha tornat
     el focus al botó. Si l'estat ja no en porta, el botó se'n va: el focus
     passa abans al control següent de la barra, no al <body>. */
  useEffect(() => {
    if (obert || !retingut) return;
    const boto = botoRef.current;
    if (!ambDetall && boto && boto.getRootNode().activeElement === boto) controlSeguent(boto)?.focus();
    setRetingut(false);
  }, [obert, retingut, ambDetall]);

  const esBoto = ambDetall || obert || retingut;
  /* Desat i confirmat: el núvol amb el check, amb nom propi (role="img") per
     a qui recorre la barra amb el lector. La regió viva ja l'ha anunciat.
     Mentre la classe --desat no tinga regla pròpia, la base el pinta com les
     altres icones (mateix cercle i mateix blanc). */
  if (clau === 'net' && !esBoto && desat) {
    const textDesat = TEXTOS_ESTAT_DESAMENT.net;
    return (
      <span className="sdp-estat-desament sdp-estat-desament--desat" role="img" aria-label={textDesat} title={textDesat} data-estat={clau}>
        <CloudCheck className="icon" aria-hidden="true" focusable="false" />
      </span>
    );
  }
  if (clau === 'net' && !esBoto) return null;
  const Icona = clau === 'error' ? TriangleAlert : CloudUpload;
  const to = clau === 'error' ? 'sdp-estat-desament--avis' : 'sdp-estat-desament--pendent';

  if (!esBoto) {
    return (
      <span className={`sdp-estat-desament ${to}`} title={text} aria-hidden="true" data-estat={clau}>
        <Icona className="icon" focusable="false" />
      </span>
    );
  }

  const tanca = () => setObert(false);
  return (
    <>
      <button ref={botoRef} type="button" className={`sdp-estat-desament sdp-estat-desament--boto ${to}`}
        aria-haspopup="dialog" aria-expanded={obert} aria-label={`${TEXTOS_ESTAT_DESAMENT[clau]} Vore el detall`}
        title={text} data-estat={clau} onClick={() => { setRetingut(true); setObert(true); }}>
        <Icona className="icon" aria-hidden="true" focusable="false" />
      </button>
      <Dialeg obert={obert} onTanca={tanca} titol={TITOL_DETALL_DESAMENT} descripcio={text} mida="s" lloc="barra"
        accions={(
          <>
            {(accions || []).map((accio) => (
              <Boto key={accio.text} varietat="secundari" onClick={() => { tanca(); accio.onClick?.(); }}>{accio.text}</Boto>
            ))}
            <Boto varietat="primari" onClick={tanca}>Entesos</Boto>
          </>
        )} />
    </>
  );
}

/** Les dues peces juntes (catàleg). La closca les separa: regió a l'arrel, icona a la barra. */
export function EstatDesament({ estat = 'net', detall = '', accions = null, reintentant = false }) {
  return (
    <>
      <RegioEstatDesament estat={estat} detall={detall} />
      <IconaEstatDesament estat={estat} detall={detall} accions={accions} reintentant={reintentant} />
    </>
  );
}

export default EstatDesament;
