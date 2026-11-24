import { useRef } from 'react';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssCandidatsAlergens from '../../../css/diferit-candidats-alergens.css?inline';
import { ESTAT_CANDIDATS_ALERGENS, vesteixCandidatsAlergens } from '../../../utils/textosAlergens.js';

const CLASSE_FILA = Object.freeze({
  ingredient: 'sdp-candidats-alergens__item sdp-candidats-alergens__item--present',
  traca: 'sdp-candidats-alergens__item sdp-candidats-alergens__item--traca',
  'no-declarat': 'sdp-candidats-alergens__item sdp-candidats-alergens__item--absent',
  desconegut: 'sdp-candidats-alergens__item sdp-candidats-alergens__item--desconegut',
});

const CLASSE_ESTAT = Object.freeze({
  ingredient: 'sdp-candidats-alergens__estat sdp-candidats-alergens__estat--present',
  traca: 'sdp-candidats-alergens__estat sdp-candidats-alergens__estat--traca',
  'no-declarat': 'sdp-candidats-alergens__estat sdp-candidats-alergens__estat--absent',
  desconegut: 'sdp-candidats-alergens__estat sdp-candidats-alergens__estat--desconegut',
});

/** Review surface only: no edit, validation or publication action. No inferred
 * candidates are passed to IconesAlergens or the certified product list.
 * The generic proposal keeps unknown rows. In the reviewed cookbook matrix
 * «—» means the substance does not appear in the recipe text.
 * The literal book or source text keeps lang="ca". `escandall` shows the costing
 * line only where a costing exists (the Bar); the public recipe page omits it. */
export function CandidatsAlergens({ proposta, llengua = 'ca', escandall = true, nivell = 'h3' }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'candidats-alergens', cssCandidatsAlergens);

  if (!proposta || proposta.estat !== ESTAT_CANDIDATS_ALERGENS || !Array.isArray(proposta.alergens)) return null;
  const v = vesteixCandidatsAlergens(proposta, llengua);
  const Titol = nivell === 'h4' ? 'h4' : 'h3';
  return (
    <section
      ref={arrelRef}
      className="sdp-candidats-alergens"
      aria-label={v.ariaLabel}
      data-estat={ESTAT_CANDIDATS_ALERGENS}
      data-cobertura={v.cobertura}
      lang={v.llengua}
    >
      <Titol className="sdp-candidats-alergens__titol">{v.etiqueta}</Titol>
      <p role="note" className="sdp-candidats-alergens__llegenda">{v.llegenda}</p>
      <p className="sdp-candidats-alergens__cobertura">
        {v.textCobertura}
        {v.pendents.map((text, i) => <span key={`${i}-${text}`}>{i === 0 ? ' ' : '; '}<q lang="ca">{text}</q></span>)}
        {v.cobertura === 'parcial' && <>{v.pendents.length > 0 ? '. ' : ' '}{v.noMarcats}</>}
      </p>
      <ul className="sdp-candidats-alergens__llista">
        {v.files.map((fila) => (
          <li
            key={fila.id}
            className={CLASSE_FILA[fila.estat] || CLASSE_FILA.desconegut}
            data-alergen={fila.id}
            data-simbol={fila.simbol}
          >
            <div className="sdp-candidats-alergens__cap">
              <strong className="sdp-candidats-alergens__nom">{fila.nom}</strong>
              {/* v1.2.24 · costura R32.75 · El separador només per al lector: el patró visualment amagat de sempre. */}
              <span className="sdp-nomes-lector">{': '}</span>
              <span className={CLASSE_ESTAT[fila.estat] || CLASSE_ESTAT.desconegut}>{fila.text}</span>
            </div>
            {fila.evidencies.length > 0 && (
              <details className="sdp-candidats-alergens__detall">
                <summary className="sdp-candidats-alergens__resum">{v.fontLiteral}</summary>
                <ul className="sdp-candidats-alergens__evidencies">
                  {fila.evidencies.map((evidencia, i) => (
                    <li key={`${evidencia.camp}-${i}`}>
                      <q lang="ca">{evidencia.text}</q>{' · '}{evidencia.on}
                      {evidencia.motiu && <span>{' · '}{evidencia.motiu}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
      {escandall && proposta.escandall && (
        <p className="sdp-candidats-alergens__escandall">
          {v.escandall}<span lang="ca">{proposta.escandall.motiu}</span>
        </p>
      )}
    </section>
  );
}

export default CandidatsAlergens;
