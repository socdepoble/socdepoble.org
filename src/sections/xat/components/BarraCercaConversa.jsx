/**
 * BarraCercaConversa.jsx — Barra de cerca intra-conversa (v1.2.25 · Lot G1).
 *
 *  · Cerca sobre els missatges visibles de la conversa (plegant accents via `plega`,
 *    excloent esborrats, bloquejats i xifrats no verificats).
 *  · Compatible amb el motor pur de Codex (`cercadorExtern` opcional); sense ell,
 *    filtra de forma 100 % operativa els missatges carregats.
 *  · Navegació per fletxes `↑` / `↓`, `Enter` / `Shift+Enter` i `Escape` (tanca
 *    i retorna el focus a la lupa de la capçalera).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, CircleX, Search, X } from 'lucide-react';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import { plega } from '../../search/indexCerca.js';
import cssV1225 from '../../../css/diferit-xat-v1225.css?inline';
import { textXatV1225 } from '../i18nVistesXatV1225.js';

const CAP = Object.freeze([]);
const noop = () => {};

/** Cerca pura sobre els missatges d'una conversa; retorna IDs del més recent al més antic. */
export function cercaMissatgesConversa(missatges, consulta) {
  const plegat = plega(String(consulta ?? '').trim());
  if (!plegat) return [];
  const trobats = [];
  for (let i = (missatges?.length || 0) - 1; i >= 0; i -= 1) {
    const m = missatges[i];
    if (!m || m.id == null || m.esborrat || m.esborratAl || m.bloquejat || m.amagat) continue;
    if (m.seguretat?.xifrat && m.seguretat?.verificat !== true) continue;
    const text = [m.text, m.author, m.autorNom, m.metadades?.adjunt?.nom, m.metadades?.llista?.titol]
      .filter(Boolean)
      .join(' ');
    if (plega(text).includes(plegat)) trobats.push(String(m.id));
  }
  return trobats;
}

export default function BarraCercaConversa({
  id,
  missatges = CAP,
  cercadorExtern = null,
  resultatsExterns = null,
  onCanviaConsulta = null,
  carregantExtern = false,
  errorExtern = null,
  onVesAlMissatge = noop,
  onTanca = noop,
  idioma = 'ca'
}) {
  const arrelRef = useRef(null);
  const inputRef = useRef(null);
  useFullDiferit(arrelRef, 'xat-v1225', cssV1225);

  const [consulta, setConsulta] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Costura C1+G1 (Codex C6b): notifica canvis de consulta fora del render per a cerques RPC asíncrones. */
  useEffect(() => {
    if (typeof onCanviaConsulta !== 'function') return undefined;
    onCanviaConsulta(consulta.trim());
    return undefined;
  }, [consulta, onCanviaConsulta]);

  const coincidencies = useMemo(() => {
    const net = consulta.trim();
    if (!net) return CAP;
    if (Array.isArray(resultatsExterns)) {
      return resultatsExterns.map((x) => String(typeof x === 'object' ? x?.id : x)).filter(Boolean);
    }
    if (typeof cercadorExtern === 'function') {
      const externs = cercadorExtern(missatges, net);
      /* Nunca consumir Promises en render (contracte C6b). */
      if (Array.isArray(externs)) return externs.map((x) => String(typeof x === 'object' ? x?.id : x)).filter(Boolean);
    }
    return cercaMissatgesConversa(missatges, net);
  }, [missatges, consulta, cercadorExtern, resultatsExterns]);

  const total = coincidencies.length;
  const indexActiu = total > 0 ? Math.min(index, total - 1) : 0;
  const enfocaSaltRef = useRef(false);

  useEffect(() => {
    if (total > 0) {
      const enfoca = enfocaSaltRef.current;
      enfocaSaltRef.current = false;
      onVesAlMissatge(coincidencies[indexActiu], { enfoca });
    }
  }, [coincidencies, indexActiu, total, onVesAlMissatge]);

  const vesAnterior = () => {
    if (!total) return;
    enfocaSaltRef.current = true;
    if (total === 1) onVesAlMissatge(coincidencies[0], { enfoca: true });
    else setIndex((i) => (i + 1) % total);
  };
  const vesSeguent = () => {
    if (!total) return;
    enfocaSaltRef.current = true;
    if (total === 1) onVesAlMissatge(coincidencies[0], { enfoca: true });
    else setIndex((i) => (i - 1 + total) % total);
  };

  const estat = consulta.trim()
    ? (errorExtern
      ? String(errorExtern)
      : carregantExtern
        ? textXatV1225(idioma, 'cercaConversa.carregant')
        : total > 0
          ? textXatV1225(idioma, 'cercaConversa.comptador', { actual: indexActiu + 1, total })
          : textXatV1225(idioma, 'cercaConversa.capResultat'))
    : '';

  return (
    <div
      ref={arrelRef}
      id={id}
      className="sdp-xat-cerca-conversa"
      role="search"
      aria-label={textXatV1225(idioma, 'cercaConversa.regio')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onTanca();
        }
      }}
    >
      <div className="sdp-xat-cerca-conversa__camp">
        <Search size={18} aria-hidden="true" focusable="false" />
        <label className="sdp-nomes-lector" htmlFor={`${id}-input`}>
          {textXatV1225(idioma, 'cercaConversa.etiqueta')}
        </label>
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="search"
          className="sdp-xat-cerca-conversa__input"
          autoComplete="off"
          value={consulta}
          placeholder={textXatV1225(idioma, 'cercaConversa.placeholder')}
          onChange={(e) => { setConsulta(e.target.value); setIndex(0); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) vesSeguent();
              else vesAnterior();
            }
          }}
        />
        {consulta ? (
          <button
            type="button"
            className="sdp-xat-icona"
            aria-label={textXatV1225(idioma, 'cercaConversa.neteja')}
            title={textXatV1225(idioma, 'cercaConversa.neteja')}
            onClick={() => { setConsulta(''); setIndex(0); inputRef.current?.focus(); }}
          >
            <CircleX size={18} aria-hidden="true" focusable="false" />
          </button>
        ) : null}
      </div>
      <span className="sdp-xat-cerca-conversa__estat" role="status" aria-live="polite">
        {estat}
      </span>
      <div className="sdp-xat-cerca-conversa__accions">
        <button
          type="button"
          className="sdp-xat-icona"
          aria-label={textXatV1225(idioma, 'cercaConversa.anterior')}
          title={textXatV1225(idioma, 'cercaConversa.anterior')}
          disabled={total === 0}
          onClick={vesAnterior}
        >
          <ChevronUp size={20} aria-hidden="true" focusable="false" />
        </button>
        <button
          type="button"
          className="sdp-xat-icona"
          aria-label={textXatV1225(idioma, 'cercaConversa.seguent')}
          title={textXatV1225(idioma, 'cercaConversa.seguent')}
          disabled={total === 0}
          onClick={vesSeguent}
        >
          <ChevronDown size={20} aria-hidden="true" focusable="false" />
        </button>
        <button
          type="button"
          className="sdp-xat-icona"
          aria-label={textXatV1225(idioma, 'cercaConversa.tanca')}
          title={textXatV1225(idioma, 'cercaConversa.tanca')}
          onClick={onTanca}
        >
          <X size={20} aria-hidden="true" focusable="false" />
        </button>
      </div>
    </div>
  );
}
