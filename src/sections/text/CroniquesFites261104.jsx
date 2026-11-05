import { useId, useMemo } from 'react';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import {
  METADADES_INSTITUCIONALS_261104,
  obteFitesArquitectura261104,
} from '../../data/fitesArquitectura261104.js';

/**
 * Converteix marcat bàsic de negretes (`**text**`) i codi en línia (`` `codi` ``)
 * en nodes React segurs, sense `dangerouslySetInnerHTML`.
 */
function pintaFragmentsSegurs(text, clauPrefix) {
  const cadena = String(text || '');
  const parts = cadena.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((fragment, idx) => {
    const clau = `${clauPrefix}-${idx}`;
    if (fragment.startsWith('**') && fragment.endsWith('**') && fragment.length > 4) {
      return <strong key={clau}>{fragment.slice(2, -2)}</strong>;
    }
    if (fragment.startsWith('`') && fragment.endsWith('`') && fragment.length > 2) {
      return <code key={clau}>{fragment.slice(1, -1)}</code>;
    }
    return fragment;
  });
}

/**
 * Secció viva de Cròniques Editorials del 04-11-2026 muntada a `/versions` (`P2-18` / `AH-13`).
 * Renderitza en les 5 llengües oficials (`ca`, `es`, `en`, `eu`, `gl`) les 4 fites
 * d'arquitectura i sobirania ciutadana sense alterar l'empremta estructural de `PAGE_COPY.versions`.
 */
export default function CroniquesFites261104({ idiomaForcat = null }) {
  const idBase = useId();
  const uiState = useUIStateOpcional();
  const t = useTraductorOpcional();
  const idioma = idiomaForcat || uiState?.language || uiState?.lang || 'ca';

  const fites = useMemo(() => obteFitesArquitectura261104(idioma), [idioma]);

  const titolSeccio = tradueix(t, [
    'section.versions.fites261104.titol',
    "Cròniques d'arquitectura i sobirania ciutadana (04-11-2026)",
  ]);
  const plantillaSubtitol = tradueix(t, [
    'section.versions.fites261104.subtitol',
    'Fites editorials publicades en cinc llengües amb identitat canònica {compte} i rèplica federada {mastodon}.',
  ]);
  const subtitolSeccio = plantillaSubtitol
    .replace('{compte}', METADADES_INSTITUCIONALS_261104.compteInstitucionalCanonic)
    .replace('{mastodon}', METADADES_INSTITUCIONALS_261104.replicaPosseMastodon);
  const etiquetaVincles = tradueix(t, [
    'section.versions.fites261104.vincles',
    'Enllaços relacionats',
  ]);

  return (
    <section
      aria-labelledby={`${idBase}-titol`}
      data-testid="croniques-fites-261104"
      lang={fites[0]?.idioma || 'ca'}
    >
      <h3 id={`${idBase}-titol`}>{titolSeccio}</h3>
      <p>{subtitolSeccio}</p>

      <div>
        {fites.map((fita) => (
          <article
            key={fita.id}
            data-fita-id={fita.id}
            aria-labelledby={`${idBase}-${fita.id}-titol`}
          >
            <h4 id={`${idBase}-${fita.id}-titol`}>{fita.titol}</h4>
            <p>
              <strong>{fita.subtitol}</strong>
            </p>
            <blockquote>
              <p>{fita.entradeta}</p>
            </blockquote>

            {fita.seccions.map((sec, sIdx) => (
              <div key={`${fita.id}-sec-${sIdx}`}>
                <h5>{sec.titolH3.trim()}</h5>
                {sec.paragrafs.map((paragraf, pIdx) => (
                  <p key={`${fita.id}-sec-${sIdx}-p-${pIdx}`}>
                    {pintaFragmentsSegurs(paragraf, `${fita.id}-${sIdx}-${pIdx}`)}
                  </p>
                ))}
              </div>
            ))}

            <div>
              <h5>{etiquetaVincles}</h5>
              <ul>
                {fita.enllacosCanonics.map((url) => (
                  <li key={url}>
                    <a href={url}>{url}</a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
