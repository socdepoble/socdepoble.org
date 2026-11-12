/**
 * Onada R17 (AH-R17-10) · L'arxiu històric, estatutari i el model d'acta d'El
 * Rentonar, a la seua fitxa pública (/rentonar). Tros diferit: el munta
 * PerfilPublicSection.jsx (FitxaPublica) només a la fitxa de Rentonar, i les
 * dades viuen a src/data/patrimoni/actaRentonar.js.
 *
 * Arbitratge R18 (Gauntlet del Kit R17.3):
 *   · Pedra Seca de lectura, cap classe d'administració en una fitxa pública:
 *     els blocs són la Subtargeta (.sdp-subtargeta: títol, metadada i cos per
 *     estructura), les insígnies van en la fila d'etiquetes de les targetes
 *     (.sp-card-labels) i la llista de definicions és la del document.
 *   · Zero dades personals: ni signataris ni identificadors sense font. La fitxa
 *     registral identifica l'entitat pel seu CIF.
 *   · El model d'acta és un model: ho diu davall del text i no porta
 *     l'atribució de Pedro Ferrer, que només signa els continguts seus.
 */
import { Fragment, useState } from 'react';
import { Link } from '../../app/contexts/RouterContext.jsx';
import { Alerta, Boto, Insignia } from '../../components/PedraSeca/index.js';
import {
  ATRIBUCIO_RENTONAR,
  CRONOLOGIA_HISTORICA_RENTONAR,
  ESTATUTS_VIGENTS_RENTONAR,
  FITXA_REGISTRAL_RENTONAR,
  PLANTILLA_ACTA_ASSEMBLEA_RENTONAR
} from '../../data/patrimoni/actaRentonar.js';

const PESTANYES_RENTONAR = Object.freeze([
  Object.freeze({ id: 'historia', titol: 'Història i Registre (1994–2026)', emoji: '🏛️' }),
  Object.freeze({ id: 'estatuts', titol: 'Estatuts Vigents (LO 1/2002)', emoji: '📜' }),
  Object.freeze({ id: 'acta', titol: 'Model d’Acta Assembleària', emoji: '🖨️' })
]);

export default function DocumentacioHistoricaRentonar() {
  const [pestanya, setPestanya] = useState('historia');

  const imprimeixModelActa = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  return (
    <section
      className="sdp-rentonar-doc"
      aria-label="Arxiu històric, estatutari i constitutiu d’El Rentonar"
      data-testid="documentacio-historica-rentonar"
    >
      <header>
        <ul className="sp-card-labels" aria-label="Dades registrals d’El Rentonar">
          <li><Insignia to="info">{`Registre GVA ${FITXA_REGISTRAL_RENTONAR.numeroRegistre}`}</Insignia></li>
          <li><Insignia to="exit">{`Fundada el ${FITXA_REGISTRAL_RENTONAR.dataConstitucio}`}</Insignia></li>
          <li><Insignia to="neutre">{`CIF ${FITXA_REGISTRAL_RENTONAR.cifEntitat}`}</Insignia></li>
        </ul>
        <h2>Arxiu Històric i Constitutiu d’El Rentonar (1994–2026)</h2>
        <p className="sdp-muted">
          {FITXA_REGISTRAL_RENTONAR.denominacioOficial} · Memòria viva de defensa forestal, custòdia etnobotànica i
          patrimoni públic de La Torre de les Maçanes.
        </p>
      </header>

      <div
        className="sdp-rentonar-doc__pestanyes"
        role="tablist"
        aria-label="Seccions documentals d’El Rentonar"
      >
        {PESTANYES_RENTONAR.map((item) => {
          const activa = pestanya === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`tab-rentonar-${item.id}`}
              role="tab"
              aria-selected={activa}
              /* Només el panell de la pestanya activa és al document. */
              aria-controls={activa ? `panel-rentonar-${item.id}` : undefined}
              className="sdp-workspace-llibres__tab"
              onClick={() => setPestanya(item.id)}
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{item.titol}</span>
            </button>
          );
        })}
      </div>

      {pestanya === 'historia' ? (
        <div id="panel-rentonar-historia" role="tabpanel" aria-labelledby="tab-rentonar-historia">
          <div className="sdp-subtargeta">
            <h3>Fitxa registral i institucional pública</h3>
            <dl>
              <dt>Denominació estatutària</dt>
              <dd>{FITXA_REGISTRAL_RENTONAR.denominacioOficial}</dd>
              <dt>Denominació fundacional (1994)</dt>
              <dd>{FITXA_REGISTRAL_RENTONAR.denominacioFundacional1994}</dd>
              <dt>Inscripció autonòmica</dt>
              <dd>{`${FITXA_REGISTRAL_RENTONAR.registreAutonomic} · núm. ${FITXA_REGISTRAL_RENTONAR.numeroRegistre}`}</dd>
              <dt>Resolució i diligència</dt>
              <dd>{FITXA_REGISTRAL_RENTONAR.resolucioInscripcio}</dd>
              <dt>CIF</dt>
              <dd>{FITXA_REGISTRAL_RENTONAR.cifEntitat}</dd>
              <dt>Seu social estatutària</dt>
              <dd>{FITXA_REGISTRAL_RENTONAR.domiciliEstatutariPublic}</dd>
              <dt>Règim de governança</dt>
              <dd>{FITXA_REGISTRAL_RENTONAR.regimCarrecs}</dd>
            </dl>
          </div>

          <h3>Cronologia documental (1994–2026)</h3>
          {CRONOLOGIA_HISTORICA_RENTONAR.map((fita) => (
            <article key={fita.id} className="sdp-subtargeta">
              <h4>{fita.titol}</h4>
              <p>{fita.periode}</p>
              <p>{fita.resum}</p>
            </article>
          ))}

          <div className="sdp-alerta__accions">
            <Link className="sdp-boto sdp-boto--primari" to="/page/arbres-monumentals">
              Obrir el Workspace de Natura i els 19 Arbres Singulars (2007–2020)
            </Link>
          </div>
        </div>
      ) : null}

      {pestanya === 'estatuts' ? (
        <div id="panel-rentonar-estatuts" role="tabpanel" aria-labelledby="tab-rentonar-estatuts">
          <p className="sdp-muted">{ESTATUTS_VIGENTS_RENTONAR.marcLegal}</p>

          <div className="sdp-subtargeta">
            <h3>Article 4 · Fins estatutaris</h3>
            <ul>
              {ESTATUTS_VIGENTS_RENTONAR.finsArticle4.map((fi) => (
                <li key={fi}>{fi}</li>
              ))}
            </ul>
          </div>

          <div className="sdp-subtargeta">
            <h3>Article 5 · Activitats associatives</h3>
            <ul>
              {ESTATUTS_VIGENTS_RENTONAR.activitatsArticle5.map((act) => (
                <li key={act}>{act.trim()}</li>
              ))}
            </ul>
          </div>

          <div className="sdp-subtargeta">
            <h3>Capítols dels Estatuts</h3>
            {ESTATUTS_VIGENTS_RENTONAR.capitols.map((bloc) => (
              <Fragment key={bloc.capitol}>
                <h4>{bloc.capitol}</h4>
                <p>{bloc.contingut}</p>
              </Fragment>
            ))}
          </div>
        </div>
      ) : null}

      {pestanya === 'acta' ? (
        <div id="panel-rentonar-acta" role="tabpanel" aria-labelledby="tab-rentonar-acta">
          <Alerta to="info" titol="Protecció de dades i custòdia del Llibre d’Actes">
            {PLANTILLA_ACTA_ASSEMBLEA_RENTONAR.notaCustodiaRgpd}
          </Alerta>

          <div className="sdp-subtargeta">
            <h3>{PLANTILLA_ACTA_ASSEMBLEA_RENTONAR.titol}</h3>
            <p>{PLANTILLA_ACTA_ASSEMBLEA_RENTONAR.subtitol}</p>
            <p>{PLANTILLA_ACTA_ASSEMBLEA_RENTONAR.encapcalament}</p>
            {PLANTILLA_ACTA_ASSEMBLEA_RENTONAR.ordreDelDia.map((item) => (
              <Fragment key={item.punt}>
                <h4>{item.punt}</h4>
                <p>{item.acord}</p>
              </Fragment>
            ))}
            <p><strong>Diligència de tancament:</strong> {PLANTILLA_ACTA_ASSEMBLEA_RENTONAR.peuSignatura}</p>
          </div>
          <p className="sdp-muted">Model redactat per Sóc de Poble; no és cap acta aprovada.</p>

          <div className="sdp-alerta__accions">
            <Boto varietat="primari" onClick={imprimeixModelActa}>
              Imprimir model d’acta
            </Boto>
          </div>
        </div>
      ) : null}

      {/* L'atribució de Pedro Ferrer, només als continguts seus: la història i els
          Estatuts. El model d'acta és de Sóc de Poble i no la porta. */}
      {pestanya === 'acta' ? null : (
        <footer>
          <p className="sdp-muted">{ATRIBUCIO_RENTONAR}</p>
        </footer>
      )}
    </section>
  );
}
