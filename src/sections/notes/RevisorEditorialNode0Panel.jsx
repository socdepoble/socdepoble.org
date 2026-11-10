import { useState } from 'react';
import { Boto } from '../../components/PedraSeca/index.js';
import {
  resolTextosRevisorEditorial,
  revisaTextEditorialNode0,
} from './revisorEditorialNode0.js';

const CAMPS_DE_TEXT = Object.freeze(['title', 'subtitle', 'entradilla', 'content']);

function textDe(valors) {
  return Object.fromEntries(CAMPS_DE_TEXT.map((camp) => [camp, String(valors?.[camp] ?? '')]));
}

function mateixText(a, b) {
  return Boolean(a && b) && CAMPS_DE_TEXT.every((camp) => String(a[camp] ?? '') === String(b[camp] ?? ''));
}

/**
 * Panell controlat: el pare passa el text actual i rep a `onAplicaProposta` els camps a escriure.
 *
 * - «Aplicar» només actua si el text no ha canviat des de la revisió (si no, el dictamen és obsolet).
 * - La instantània per a «Restaurar» es pren en aplicar, amb el text d'abans d'aplicar.
 * - «Restaurar» només actua mentre el text continua sent el que s'ha aplicat: no esborra edicions
 *   fetes després.
 * - Taxonomia: si el pare passa `categories` (o `categoriaMare`) i/o `etiquetesSkos` (els valors
 *   actuals de la nota), aplicar envia també la taxonomia suggerida AFEGIDA als valors actuals
 *   (`categories` sencer, mai una sola) i restaurar torna els valors d'abans. Si no els passa, la
 *   taxonomia només es mostra i no viatja, perquè no es podria desfer.
 */
function mateixesLlistes(a, b) {
  const la = Array.isArray(a) ? a : [];
  const lb = Array.isArray(b) ? b : [];
  return la.length === lb.length && la.every((item, idx) => String(item) === String(lb[idx]));
}

export default function RevisorEditorialNode0Panel({
  idioma = 'ca',
  title = '',
  subtitle = '',
  entradilla = '',
  content = '',
  categories,
  categoriaMare,
  etiquetesSkos,
  disabled = false,
  onAplicaProposta,
}) {
  const [revisio, setRevisio] = useState(null); // { entrada, dictamen }
  const [aplicacio, setAplicacio] = useState(null); // { abans, aplicat }

  const textos = resolTextosRevisorEditorial(idioma);
  const entradaActual = { title, subtitle, entradilla, content };
  const categoriesActuals = Array.isArray(categories)
    ? categories
    : (categoriaMare !== undefined && categoriaMare !== null ? [categoriaMare] : undefined);
  const taxonomiaControlada = categoriesActuals !== undefined || etiquetesSkos !== undefined;
  const resultat = revisio ? revisio.dictamen : null;
  const revisioVigent = Boolean(revisio) && mateixText(revisio.entrada, entradaActual);
  const restauracioVigent = Boolean(aplicacio)
    && mateixText(aplicacio.aplicat, entradaActual)
    && (!taxonomiaControlada || (
      (categoriesActuals === undefined || mateixesLlistes(aplicacio.aplicat.categories, categoriesActuals))
      && (etiquetesSkos === undefined || mateixesLlistes(aplicacio.aplicat.etiquetesSkos, etiquetesSkos))
    ));

  const executaRevisio = () => {
    if (disabled) return;
    const entrada = textDe(entradaActual);
    setRevisio({ entrada, dictamen: revisaTextEditorialNode0(entrada) });
  };

  const aplicaProposta = () => {
    if (disabled || !resultat || !revisioVigent || typeof onAplicaProposta !== 'function') return;
    const abans = textDe(entradaActual);
    const aplicat = textDe(resultat.proposta);
    const valors = { ...aplicat };
    if (taxonomiaControlada) {
      const etiquetesAbans = Array.isArray(etiquetesSkos) ? [...etiquetesSkos] : [];
      const catsAbans = Array.isArray(categoriesActuals) ? [...categoriesActuals] : [];
      abans.categoriaMare = categoriaMare ?? catsAbans[0] ?? null;
      abans.categories = catsAbans;
      abans.etiquetesSkos = etiquetesAbans;

      /* R11 Loop 3 (L2-02) · La categoria suggerida s'AFIG a les que ja hi havia: mai les
         substituïx (abans una nota amb ['Cultura','Festes'] quedava amb una sola). */
      const mareSuggerida = resultat.taxonomia.categoriaMare ?? null;
      const catsAplicades = mareSuggerida && !catsAbans.includes(mareSuggerida)
        ? [...catsAbans, mareSuggerida]
        : catsAbans;
      const tagsAplicats = resultat.taxonomia.etiquetesSkos.length > 0
        ? [...new Set([...etiquetesAbans, ...resultat.taxonomia.etiquetesSkos])]
        : etiquetesAbans;

      aplicat.categoriaMare = mareSuggerida ?? abans.categoriaMare;
      aplicat.categories = catsAplicades;
      aplicat.etiquetesSkos = tagsAplicats;

      valors.categoriaMare = aplicat.categoriaMare;
      valors.categories = catsAplicades;
      valors.etiquetesSkos = tagsAplicats;
    }
    setAplicacio({ abans, aplicat });
    onAplicaProposta(valors);
  };

  const restauraOriginal = () => {
    if (disabled || !aplicacio || !restauracioVigent || typeof onAplicaProposta !== 'function') return;
    onAplicaProposta({ ...aplicacio.abans });
    setAplicacio(null);
  };

  return (
    <section
      className="sdp-admin-importacio__card"
      aria-label={textos.title}
      data-sdp-revisor-editorial-node0="true"
    >
      <div className="sdp-admin-importacio__card-cap">
        <span className="sdp-badge-system">{textos.title}</span>
        {resultat && (
          <span className="sdp-admin-pill" data-testid="veredicte-editorial-pill">
            {textos.verdictLabel} {resultat.veredicte}
          </span>
        )}
      </div>

      <p>{textos.subtitle}</p>

      <div className="sdp-admin-actions-inline">
        <Boto varietat="primari" onClick={executaRevisio} disabled={disabled}>
          {textos.btnReview}
        </Boto>
        {resultat && (
          <Boto varietat="secundari" onClick={aplicaProposta} disabled={disabled || !revisioVigent}>
            {textos.btnApplyProposal}
          </Boto>
        )}
        {restauracioVigent && (
          <Boto varietat="fantasma" onClick={restauraOriginal} disabled={disabled}>
            {textos.btnRestoreOriginal}
          </Boto>
        )}
      </div>

      {resultat && !revisioVigent && !restauracioVigent && (
        <p role="status" data-testid="revisio-obsoleta-node0">
          {textos.staleReview}
        </p>
      )}

      {resultat && (
        <div data-testid="resultat-revisio-node0">
          <h4>{textos.findingsTitle}</h4>
          {resultat.observacions.length === 0 ? (
            <p role="status">{textos.noIssues}</p>
          ) : (
            <ul className="sdp-llista">
              {resultat.observacions.map((obs) => (
                <li key={obs.id}>{obs.missatge}</li>
              ))}
            </ul>
          )}

          <h4>{textos.proposalTitle}</h4>
          <p data-testid="proposta-content-node0">{resultat.proposta.content}</p>

          <div className="sdp-admin-editorial-stack" data-testid="taxonomia-suggerida-editorial-node0">
            <div className="sdp-admin-editorial-bloc">
              <h5>{textos.suggestedCategoryLabel}</h5>
              <p data-testid="categoria-suggerida-node0">
                {resultat.taxonomia.categoriaMare || textos.noTaxonomy}
              </p>
            </div>
            <div className="sdp-admin-editorial-bloc">
              <h5>{textos.suggestedTagsLabel}</h5>
              <p data-testid="etiquetes-suggerides-node0">
                {resultat.taxonomia.etiquetesSkos.length > 0
                  ? resultat.taxonomia.etiquetesSkos.map((t) => `#${t}`).join(' · ')
                  : textos.noTaxonomy}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
