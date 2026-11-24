import { useId, useRef } from 'react';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { IconesAlergens } from '../../components/PedraSeca/molecules/IconesAlergens.jsx';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssHerbariFitxa from '../../css/diferit-herbari-fitxa.css?inline';
import { USOS_HERBARI_CANONICS } from '../../data/patrimoni/herbariLaTorre117.js';
import LaminesBotaniquesNode0 from './LaminesBotaniquesNode0.jsx';
import { TEXTOS_HERBARI } from './textosHerbari.js';
import { useLaminesBotaniquesNode0 } from './useLaminesBotaniquesNode0.js';

const CLAUS_USOS = ['tots', 'aliment', 'aromatica', 'medicinal', 'ornamental', 'artesanal', 'toxic'];

const EMOJIS_US = Object.freeze({
  Aliment: '🍽️',
  'Aromàtica': '🌿',
  Medicinal: '⚕️',
  Ornamental: '🌸',
  Artesanal: '🧺',
  'Tòxic': '⚠️',
});

/**
 * Resol de manera determinista i sense inventar dades el bloc d'aptitud i els
 * 14 al·lèrgens UE 1169/2011 quan l'espècie o `registreAlergens` porta el
 * consens 8/8 d'IDEA-336 (`aptitud`, `matriuFinal` / `matriuAlergens`, `alergens`).
 * Invariant innegociable: una planta tòxica o no comestible mai es presenta com
 * a apta per al consum ni exposa al·lèrgens d'aliment.
 */
function resolSeguretatIAlergens(especie, registreAlergens, tx) {
  const reg = registreAlergens || especie?.consensAlergens || null;
  const aptitud = reg?.aptitud || especie?.aptitud || null;
  const esToxica = especie?.esToxica === true || aptitud === 'toxica' || especie?.usos?.includes('Tòxic');
  const esNoComestible = !esToxica && aptitud === 'no_comestible';

  let insigniaTo = 'neutre';
  let insigniaText = tx.aptitudNoAvaluada;
  if (esToxica) {
    insigniaTo = 'error';
    insigniaText = tx.aptitudToxica;
  } else if (esNoComestible) {
    insigniaTo = 'neutre';
    insigniaText = tx.aptitudNoComestible;
  } else if (aptitud === 'aliment' || especie?.usos?.includes('Aliment')) {
    insigniaTo = 'avis';
    insigniaText = tx.aptitudAlimentDocumental;
  } else if (aptitud === 'aromatica_infusio' || especie?.usos?.includes('Aromàtica')) {
    insigniaTo = 'info';
    insigniaText = tx.aptitudAromaticaDocumental;
  }

  if (esToxica || esNoComestible) {
    return { esToxica, insigniaTo, insigniaText, alergens: [], traces: [], estatAlergens: 'ocult' };
  }

  const normalitzaIdAlergen = (id) => String(id || '').trim().toLowerCase().replace(/_/g, '-');
  const matriu = reg?.matriuFinal || reg?.matriuAlergens || especie?.matriuFinal || especie?.matriuAlergens || null;
  let alergens = Array.isArray(reg?.alergens)
    ? reg.alergens.map(normalitzaIdAlergen)
    : Array.isArray(especie?.alergens)
      ? especie.alergens.map(normalitzaIdAlergen)
      : [];
  let traces = Array.isArray(reg?.tracesAlergens)
    ? reg.tracesAlergens.map(normalitzaIdAlergen)
    : Array.isArray(especie?.tracesAlergens)
      ? especie.tracesAlergens.map(normalitzaIdAlergen)
      : [];

  if (matriu && typeof matriu === 'object') {
    const desDeMatriu = [];
    const tracesMatriu = [];
    for (const [clau, valor] of Object.entries(matriu)) {
      const idCanonic = normalitzaIdAlergen(clau);
      if (valor === 'conte' || valor === 'ingredient') desDeMatriu.push(idCanonic);
      else if (valor === 'traca') tracesMatriu.push(idCanonic);
    }
    if (!alergens.length) alergens = desDeMatriu;
    if (!traces.length) traces = tracesMatriu;
  }

  const teConsensComplet = Boolean(
    matriu && Object.values(matriu).every((v) => v === 'conte' || v === 'ingredient' || v === 'traca' || v === 'absent')
  );

  if (alergens.length > 0 || traces.length > 0) {
    return { esToxica: false, insigniaTo, insigniaText, alergens, traces, estatAlergens: 'declarat' };
  }
  if (teConsensComplet) {
    return { esToxica: false, insigniaTo, insigniaText, alergens: [], traces: [], estatAlergens: 'absent_verificat' };
  }
  const teUsIngestio = Boolean(especie?.usos?.includes('Aliment') || especie?.usos?.includes('Aromàtica'));
  return {
    esToxica: false,
    insigniaTo,
    insigniaText,
    alergens: [],
    traces: [],
    estatAlergens: teUsIngestio ? 'desconegut' : 'ocult',
  };
}

export default function FitxaHerbari({ especie, textos, registreAlergens = null }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'herbari-fitxa', cssHerbariFitxa);
  const idSinonimia = useId();
  const tx = { ...TEXTOS_HERBARI.ca, ...(textos || {}) };

  const cataleg = useLaminesBotaniquesNode0();
  const lamina = cataleg?.obteLaminaBotanicaNode0(especie.id);
  const zones = Array.isArray(especie.zonesHerbari) && especie.zonesHerbari.length > 0
    ? especie.zonesHerbari
    : (especie.zonaHerbari ? [especie.zonaHerbari] : []);
  const seguretat = resolSeguretatIAlergens(especie, registreAlergens, tx);

  const filesSinonimia = [
    ['valencia', especie.nomValencia, 'ca', true],
    ['castella', especie.nomCastella, 'es', false],
    ['angles', especie.nomAngles, 'en', false],
    ['cientific', especie.nomCientific, 'la', false],
  ];

  return (
    <div ref={arrelRef} className="sdp-herbari-fitxa">
      <ul role="list" className="sdp-herbari-fitxa__pindoles" aria-label={`${tx.usos} · ${tx.zona}`}>
        {especie.usos.map((us) => {
          const idx = USOS_HERBARI_CANONICS.indexOf(us);
          const etiquetaUs = (idx >= 0 ? tx[CLAUS_USOS[idx]] : null) ?? us;
          const emoji = EMOJIS_US[us] || '🌿';
          const esUsToxic = us === 'Tòxic';
          return (
            <li
              key={`us-${us}`}
              className={esUsToxic ? 'sdp-herbari-fitxa__pindola sdp-herbari-fitxa__pindola--toxica' : 'sdp-herbari-fitxa__pindola'}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{etiquetaUs}</span>
            </li>
          );
        })}
        {zones.map((zona) => (
          <li key={`zona-${zona}`} className="sdp-herbari-fitxa__pindola sdp-herbari-fitxa__pindola--paratge">
            <span aria-hidden="true">📍</span>
            <span lang="ca">{zona}</span>
          </li>
        ))}
      </ul>

      <p className="sdp-herbari-fitxa__nota">{tx.documental}</p>

      <section className="sdp-herbari-fitxa__seccio" aria-labelledby={idSinonimia}>
        <h3 id={idSinonimia}>{tx.sinonimia}</h3>
        <div className="sdp-taula-prosa" role="region" aria-labelledby={idSinonimia} tabIndex={0}>
          <table>
            <caption className="sdp-sr-only">{`${tx.sinonimia} · ${especie.nomValencia}`}</caption>
            <thead>
              <tr>
                <th scope="col">{tx.llenguaCol}</th>
                <th scope="col">{tx.denominacioCol}</th>
              </tr>
            </thead>
            <tbody>
              {filesSinonimia.map(([clau, valor, lang, destacat]) => (
                <tr key={clau}>
                  <th scope="row">{tx[clau]}</th>
                  <td lang={lang}>
                    {clau === 'cientific' ? <i>{valor}</i> : (destacat ? <strong>{valor}</strong> : valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <LaminesBotaniquesNode0 lamina={lamina} nom={especie.nomValencia} binomi={lamina?.binomiNet} />

      <section className="sdp-herbari-fitxa__seccio" aria-label={tx.seguretatTitol}>
        <h3>{tx.seguretatTitol}</h3>
        <div className="sdp-herbari-fitxa__seguretat">
          <div className="sdp-herbari-fitxa__aptitud">
            <Insignia to={seguretat.insigniaTo}>{seguretat.insigniaText}</Insignia>
          </div>
          <Alerta to={seguretat.esToxica ? 'avis' : 'info'} viva={false}>
            <p>{seguretat.esToxica ? tx.toxicitatAdvertida : tx.toxicitatDesconeguda}</p>
          </Alerta>
          {seguretat.estatAlergens === 'declarat' ? (
            <div className="sdp-herbari-fitxa__alergens">
              {seguretat.alergens.length > 0 ? (
                <IconesAlergens alergens={seguretat.alergens} mida="mitjana" etiqueta={tx.alergensEtiqueta} />
              ) : null}
              {seguretat.traces.length > 0 ? (
                <IconesAlergens alergens={seguretat.traces} mida="xicoteta" etiqueta={tx.tracesEtiqueta} />
              ) : null}
            </div>
          ) : null}
          {seguretat.estatAlergens === 'absent_verificat' ? (
            <div className="sdp-herbari-fitxa__alergens">
              <p className="sdp-herbari-fitxa__alergens-nota">{tx.alergensCapDeclarat}</p>
            </div>
          ) : null}
          {seguretat.estatAlergens === 'desconegut' ? (
            <div className="sdp-herbari-fitxa__alergens">
              <p className="sdp-herbari-fitxa__alergens-nota">{tx.alergensPendent}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="sdp-herbari-fitxa__seccio" aria-label={tx.font}>
        <h3>{tx.font}</h3>
        <div className="sdp-herbari-fitxa__font">
          <p>
            <strong>{especie.font.document}</strong> · {tx.pagina} {especie.font.pagina}
          </p>
          <details className="sdp-herbari-fitxa__empremta">
            <summary>{tx.empremta}</summary>
            <p>
              <code>
                {especie.font.sha256.match(/.{1,8}/g).map((tros, i) => (
                  <span key={i}>{tros}<wbr /></span>
                ))}
              </code>
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
