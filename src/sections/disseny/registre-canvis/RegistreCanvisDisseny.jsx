/**
 * RegistreCanvisDisseny.jsx — Vista atòmica del Registre de Canvis dins de /disseny
 * (Onada v1.2.25 · Lot G3 · IDEA-354).
 *
 * Implementa els criteris de la captura de referència 261125_0219 i les guies
 * modernes `modern-web-guidance` (accordion + accessibility + content-first-noise-reduction):
 *   · <details>/<summary> nadius sense headings (h1-h6) dins <summary>.
 *   · Botó «Expandir tot / Plegar tot» amb `aria-expanded` en `true` només quan
 *     tots els blocs visibles estan oberts.
 *   · Carregat 100 % en tros diferit + CSS `?inline` adoptat via `adoptaFullDiferit` (+0 B nucli WP).
 */
import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import { useUIActionsOpcional, useUIStateOpcional } from '../../../app/contexts/UIContext';
import { Alerta, Boto, Insignia } from '../../../components/PedraSeca/index.js';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssRegistreCanvis from '../../../css/diferit-registre-canvis.css?inline';
import { PAGE_COPY } from '../../text/pageContent.js';
import QuadreEstatCanalsVersions from '../../text/QuadreEstatCanalsVersions.jsx';
import ArxiuHistoricVersions from '../../text/ArxiuHistoricVersions.jsx';
import {
  RUTA_REGISTRE_CANVIS,
  TEXTOS_REGISTRE_CANVIS,
  VERSIONS_REGISTRE,
  normalitzaLlenguaRc
} from './dadesRegistreCanvis.js';

const adoptaEstils = (el) => { adoptaFullDiferit(el, 'registre-canvis', cssRegistreCanvis); };

function useIdiomaSegur() {
  const accions = useUIActionsOpcional();
  const estat = useUIStateOpcional();
  return normalitzaLlenguaRc(accions?.language || estat?.language || 'ca');
}

function BlocDesplegable({ clau, titol, elements, obert, onCanvi, textObert, textTancat }) {
  if (!Array.isArray(elements) || elements.length === 0) return null;
  return (
    <details
      className="sdp-rc-detalls"
      open={obert}
      onToggle={(e) => onCanvi(clau, e.currentTarget.open)}
    >
      <summary className="sdp-rc-sumari">
        <span>{titol}</span>
        <span className="sdp-rc-sumari__indicador" aria-hidden="true">
          {obert ? <ChevronDown size={18} focusable="false" /> : <ChevronRight size={18} focusable="false" />}
        </span>
        <span className="sr-only">{obert ? textObert : textTancat}</span>
      </summary>
      <ul className="sdp-rc-llista">
        {elements.map((item, i) => (
          <li key={`${clau}-${i}`} className="sdp-rc-llista__item">{item}</li>
        ))}
      </ul>
    </details>
  );
}

export default function RegistreCanvisDisseny({ versioId = 'conjunt', llengua: llenguaProp = null }) {
  const idiomaContext = useIdiomaSegur();
  const idioma = llenguaProp ? normalitzaLlenguaRc(llenguaProp) : idiomaContext;
  const tx = TEXTOS_REGISTRE_CANVIS[idioma];

  const clausVisibles = useMemo(() => {
    if (versioId === 'conjunt') {
      return VERSIONS_REGISTRE.flatMap((v) => [`${v.id}:millores`, `${v.id}:correccions`]);
    }
    if (versioId === 'historic') return [];
    return [`${versioId}:millores`, `${versioId}:correccions`];
  }, [versioId]);

  const [oberts, setOberts] = useState(() => {
    const mapa = {};
    if (versioId === 'conjunt') {
      const primera = VERSIONS_REGISTRE[0]?.id;
      if (primera) {
        mapa[`${primera}:millores`] = true;
        mapa[`${primera}:correccions`] = false;
      }
    } else if (versioId !== 'historic') {
      mapa[`${versioId}:millores`] = true;
      mapa[`${versioId}:correccions`] = true;
    }
    return mapa;
  });

  const totsOberts = clausVisibles.length > 0 && clausVisibles.every((k) => Boolean(oberts[k]));

  const alternaTots = useCallback(() => {
    const desti = !totsOberts;
    const seguent = {};
    for (const k of clausVisibles) seguent[k] = desti;
    setOberts(seguent);
  }, [clausVisibles, totsOberts]);

  const canviaUn = useCallback((clau, estatObert) => {
    setOberts((prev) => (prev[clau] === estatObert ? prev : { ...prev, [clau]: estatObert }));
  }, []);

  if (versioId === 'historic') {
    return (
      <div ref={adoptaEstils} className="sdp-rc-contenidor" data-testid="registre-canvis-historic" lang={idioma}>
        <Alerta to="info" viva={false} titol={tx.categoriaNom}>
          {tx.arxiuHistoricIntro}
        </Alerta>
        <ArxiuHistoricVersions llengua={idioma} />
        <nav className="sdp-rc-nav-versions" aria-label={tx.categoriaNom}>
          <Link className="sdp-boto sdp-boto--secundari" to={RUTA_REGISTRE_CANVIS}>
            <Layers size={16} aria-hidden="true" focusable="false" />{' '}
            {tx.tornarConjunt}
          </Link>
        </nav>
      </div>
    );
  }

  if (versioId === 'conjunt') {
    return (
      <div ref={adoptaEstils} className="sdp-rc-contenidor" data-testid="registre-canvis-conjunt" lang={idioma}>
        <QuadreEstatCanalsVersions llengua={idioma} etiquetes={PAGE_COPY.versions?.labels} />

        <div className="sdp-rc-barra-accions">
          <Insignia to="info">{`${VERSIONS_REGISTRE.length} · ${tx.categoriaNom}`}</Insignia>
          <Boto
            varietat="secundari"
            aria-expanded={totsOberts}
            onClick={alternaTots}
            data-testid="registre-canvis-alterna-tots"
          >
            {totsOberts ? tx.plegarTot : tx.expandirTot}
          </Boto>
        </div>

        {VERSIONS_REGISTRE.map((v) => {
          const millores = v.millores[idioma] || v.millores.ca;
          const correccions = v.correccions[idioma] || v.correccions.ca;
          const rutaFitxa = `/disseny?categoria=registre-de-canvis&item=${v.itemId}`;
          return (
            <article key={v.id} className="sdp-rc-versio-targeta" aria-label={v.versio}>
              <header className="sdp-rc-cap">
                <div className="sdp-rc-versio-meta">
                  <Insignia to="exit">{v.versio}</Insignia>
                  <span>{v.data[idioma]}</span>
                </div>
                <Link className="sdp-boto sdp-boto--secundari" to={rutaFitxa}>
                  {tx.obriFitxa}
                </Link>
              </header>
              <h3>{v.titol[idioma]}</h3>
              <p className="sdp-rc-resum">{v.resum[idioma]}</p>
              <BlocDesplegable
                clau={`${v.id}:millores`}
                titol={tx.millores(millores.length)}
                elements={millores}
                obert={Boolean(oberts[`${v.id}:millores`])}
                onCanvi={canviaUn}
                textObert={tx.obert}
                textTancat={tx.tancat}
              />
              <BlocDesplegable
                clau={`${v.id}:correccions`}
                titol={tx.correccions(correccions.length)}
                elements={correccions}
                obert={Boolean(oberts[`${v.id}:correccions`])}
                onCanvi={canviaUn}
                textObert={tx.obert}
                textTancat={tx.tancat}
              />
            </article>
          );
        })}
      </div>
    );
  }

  const index = VERSIONS_REGISTRE.findIndex((v) => v.id === versioId);
  const actual = index >= 0 ? VERSIONS_REGISTRE[index] : VERSIONS_REGISTRE[0];
  const mesNova = index > 0 ? VERSIONS_REGISTRE[index - 1] : null;
  const mesAntiga = index >= 0 && index < VERSIONS_REGISTRE.length - 1 ? VERSIONS_REGISTRE[index + 1] : null;
  const millores = actual.millores[idioma] || actual.millores.ca;
  const correccions = actual.correccions[idioma] || actual.correccions.ca;

  return (
    <div ref={adoptaEstils} className="sdp-rc-contenidor" data-testid={`registre-canvis-${actual.id}`} lang={idioma}>
      <div className="sdp-rc-barra-accions">
        <div className="sdp-rc-versio-meta">
          <Insignia to="exit">{actual.versio}</Insignia>
          <span>{actual.data[idioma]}</span>
        </div>
        <Boto
          varietat="secundari"
          aria-expanded={totsOberts}
          onClick={alternaTots}
          data-testid="registre-canvis-alterna-tots"
        >
          {totsOberts ? tx.plegarTot : tx.expandirTot}
        </Boto>
      </div>

      <Alerta to="info" viva={false} titol={tx.abastTitol}>
        {actual.abast[idioma]}
      </Alerta>

      <BlocDesplegable
        clau={`${actual.id}:millores`}
        titol={tx.millores(millores.length)}
        elements={millores}
        obert={Boolean(oberts[`${actual.id}:millores`])}
        onCanvi={canviaUn}
        textObert={tx.obert}
        textTancat={tx.tancat}
      />

      <BlocDesplegable
        clau={`${actual.id}:correccions`}
        titol={tx.correccions(correccions.length)}
        elements={correccions}
        obert={Boolean(oberts[`${actual.id}:correccions`])}
        onCanvi={canviaUn}
        textObert={tx.obert}
        textTancat={tx.tancat}
      />

      <nav className="sdp-rc-nav-versions" aria-label={tx.categoriaNom}>
        {mesNova ? (
          <Link className="sdp-boto sdp-boto--secundari" to={`/disseny?categoria=registre-de-canvis&item=${mesNova.itemId}`}>
            <ArrowLeft size={16} aria-hidden="true" focusable="false" />{' '}
            {`${tx.versioSeguent} · ${mesNova.versio}`}
          </Link>
        ) : null}
        <Link className="sdp-boto sdp-boto--secundari" to={RUTA_REGISTRE_CANVIS}>
          <Layers size={16} aria-hidden="true" focusable="false" />{' '}
          {tx.tornarConjunt}
        </Link>
        {mesAntiga ? (
          <Link className="sdp-boto sdp-boto--secundari" to={`/disseny?categoria=registre-de-canvis&item=${mesAntiga.itemId}`}>
            {`${tx.versioAnterior} · ${mesAntiga.versio}`}{' '}
            <ArrowRight size={16} aria-hidden="true" focusable="false" />
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
