import { ESTAT_CANDIDATS_ALERGENS, vesteixCandidatsAlergens } from '../../../utils/textosAlergens.js';

/** Review surface only: no edit, validation or publication action. No inferred
 * candidates are passed to IconesAlergens or the certified product list.
 * Onada R15b (RV-01, RV-02) · The mandatory label is the title, in the interface
 * language (ca, es, en, eu, gl); every row is «•», «T» or «? Sense dada», never
 * an absence; partial coverage lists the literal lines the lexicon does not know.
 * The literal book or source text keeps lang="ca". `escandall` shows the costing
 * line only where a costing exists (the Bar); the public recipe page omits it. */
export function CandidatsAlergens({ proposta, llengua = 'ca', escandall = true }) {
  if (!proposta || proposta.estat !== ESTAT_CANDIDATS_ALERGENS || !Array.isArray(proposta.alergens)) return null;
  const v = vesteixCandidatsAlergens(proposta, llengua);
  return (
    <section aria-label={v.ariaLabel} data-estat={ESTAT_CANDIDATS_ALERGENS} data-cobertura={v.cobertura} lang={v.llengua}>
      <h3>{v.etiqueta}</h3>
      <p role="note">{v.llegenda}</p>
      <p>
        {v.textCobertura}
        {v.pendents.map((text, i) => <span key={`${i}-${text}`}>{i === 0 ? ' ' : '; '}<q lang="ca">{text}</q></span>)}
        {v.cobertura === 'parcial' && <>{v.pendents.length > 0 ? '. ' : ' '}{v.noMarcats}</>}
      </p>
      <ul>
        {v.files.map(fila => (
          <li key={fila.id} data-alergen={fila.id} data-simbol={fila.simbol}>
            <strong>{fila.nom}</strong>{': '}{fila.text}
            {fila.evidencies.length > 0 && (
              <details>
                <summary>{v.fontLiteral}</summary>
                <ul>
                  {fila.evidencies.map((evidencia, i) => (
                    <li key={`${evidencia.camp}-${i}`}><q lang="ca">{evidencia.text}</q>{' · '}{evidencia.on}</li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
      {escandall && proposta.escandall && <p>{v.escandall}<span lang="ca">{proposta.escandall.motiu}</span></p>}
    </section>
  );
}

export default CandidatsAlergens;
