/**
 * EstatDesament.jsx — La ploma de l'autodesament (skill sdp-universal-editor §1).
 *
 * T47 (ordre del Mestre, 260928). L'editor no té botó «Guardar»:
 *   · 'pendent' / 'enviant' → es veu la ploma (Feather): hi ha canvis que
 *     el servidor encara no té.
 *   · 'sessio'  → la ploma, i el text diu que cal tornar a entrar per a desar-los.
 *   · 'error'   → un avís (triangle): alguna cosa no s'ha pogut desar.
 *   · 'net'     → DESAPAREIX: el servidor ho ha confirmat tot.
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
 *   [{ text, onClick }] (opcional: les eixides del detall; sense, només «Entesos»).
 */
import { useEffect, useRef, useState } from 'react';
import { Feather, TriangleAlert } from 'lucide-react';
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

/** El que es veu a la barra taronja: la ploma, l'avís o res. */
export function IconaEstatDesament({ estat = 'net', detall = '', accions = null }) {
  const clau = estatConegut(estat);
  const text = textDe(clau, detall);
  const ambDetall = AMB_DETALL.includes(clau);
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
  if (clau === 'net' && !esBoto) return null;
  const Icona = clau === 'error' ? TriangleAlert : Feather;
  const to = clau === 'error' ? 'sdp-estat-desament--avis' : 'sdp-estat-desament--ploma';

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
export function EstatDesament({ estat = 'net', detall = '', accions = null }) {
  return (
    <>
      <RegioEstatDesament estat={estat} detall={detall} />
      <IconaEstatDesament estat={estat} detall={detall} accions={accions} />
    </>
  );
}

export default EstatDesament;
