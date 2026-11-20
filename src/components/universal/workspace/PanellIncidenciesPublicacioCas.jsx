/**
 * PanellIncidenciesPublicacioCas.jsx — Resolució explícita d'incidències durables
 * per audiència en la cua CAS de publicacions (Onada R32.17 · Lot 01 · D-R32.15-1).
 *
 * Dissenyat per carregar-se amb React.lazy (0 B al boot estàtic de WordPress)
 * i adoptar en calent diferit-incidencies-cas.css.
 */
import { useId, useRef, useState } from 'react';
import { Boto, Insignia } from '../../PedraSeca/index.js';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssIncidenciesCas from '../../../css/diferit-incidencies-cas.css?inline';
import { missatgeErrorIncidenciaCas, textosIncidenciesCas } from './i18nIncidenciesPublicacioCas.js';

function etiquetaCodi(codi, tx) {
  if (codi === 'conflicte-versio') return tx.etiquetaCodiConflicte;
  if (codi === 'versio-desconeguda') return tx.etiquetaCodiDesconeguda;
  return tx.etiquetaCodiRebuig;
}

function explicacioCodi(codi, tx) {
  if (codi === 'conflicte-versio') return tx.explicacioConflicte;
  if (codi === 'versio-desconeguda') return tx.explicacioDesconeguda;
  return tx.explicacioRebuig;
}

export function PanellIncidenciesPublicacioCas({
  incidencies = [],
  onResol,
  onRefresca,
  idioma = 'ca'
}) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'incidencies-cas', cssIncidenciesCas);
  const tx = textosIncidenciesCas(idioma);
  const idTitol = useId();
  const [enVolClau, setEnVolClau] = useState(null);
  const [comprovant, setComprovant] = useState(false);
  const [feedback, setFeedback] = useState(null); // { tipus: 'exit' | 'error', text: string }

  const llista = Array.isArray(incidencies) ? incidencies : [];
  if (llista.length === 0 && !feedback) return null;

  const comprovaServidor = async () => {
    if (comprovant || typeof onRefresca !== 'function') return;
    setComprovant(true);
    setFeedback(null);
    try {
      await onRefresca();
    } catch (err) {
      setFeedback({ tipus: 'error', text: missatgeErrorIncidenciaCas(err, tx) });
    } finally {
      setComprovant(false);
    }
  };

  const resolItem = async (inc, versioRemota) => {
    const idAccio = `${inc.clau}:${inc.audiencia}`;
    if (enVolClau || typeof onResol !== 'function') return;
    setEnVolClau(idAccio);
    setFeedback(null);
    try {
      await onResol(inc.clau, inc.audiencia, { versioRemota });
      setFeedback({ tipus: 'exit', text: tx.exitResolucio });
    } catch (err) {
      setFeedback({ tipus: 'error', text: missatgeErrorIncidenciaCas(err, tx) });
    } finally {
      setEnVolClau(null);
    }
  };

  return (
    <section
      ref={arrelRef}
      className="sdp-incidencies-cas"
      aria-labelledby={idTitol}
      data-testid="panell-incidencies-publicacio-cas"
    >
      <div className="sdp-incidencies-cas__cap">
        <h3 id={idTitol} className="sdp-incidencies-cas__titol">
          {tx.titolPanell}
        </h3>
        {llista.length > 0 ? (
          <p className="sdp-incidencies-cas__resum">{tx.resumPanell}</p>
        ) : null}
      </div>

      {feedback ? (
        <p
          role={feedback.tipus === 'error' ? 'alert' : 'status'}
          className="sdp-incidencies-cas__feedback"
          data-testid="feedback-incidencia-cas"
        >
          {feedback.text}
        </p>
      ) : null}

      {llista.length > 0 ? (
        <ul className="sdp-incidencies-cas__llista" aria-label={tx.regioAria}>
          {llista.map((inc) => {
            const idAccio = `${inc.clau}:${inc.audiencia}`;
            const ocupat = enVolClau === idAccio;
            const titolFitxa = inc.font?.title || inc.titolRemot || tx.senseTitol;
            const teVersioServidor = Boolean(inc.lecturaRemotaOk && inc.filaRemotaExisteix && inc.versioRemotaActual);
            const esCreacioNova = Boolean(inc.lecturaRemotaOk && inc.filaRemotaExisteix === false);

            return (
              <li
                key={idAccio}
                className="sdp-incidencies-cas__targeta"
                data-testid={`incidencia-cas-${inc.audiencia}`}
              >
                <div className="sdp-incidencies-cas__etiquetes">
                  <Insignia to={inc.audiencia === 'publica' ? 'primari' : 'neutre'}>
                    {inc.audiencia === 'publica' ? tx.audienciaPublica : tx.audienciaPrivada}
                  </Insignia>
                  <Insignia to="avis">{etiquetaCodi(inc.codi, tx)}</Insignia>
                </div>

                <p className="sdp-incidencies-cas__fitxa-titol">{titolFitxa}</p>
                <p className="sdp-incidencies-cas__text">{explicacioCodi(inc.codi, tx)}</p>

                {inc.esRetirada ? (
                  <p className="sdp-incidencies-cas__retirada" data-testid="avis-retirada-mur-p2c">
                    {tx.avisRetiradaMur}
                  </p>
                ) : null}

                <p className="sdp-incidencies-cas__meta">
                  {teVersioServidor ? (
                    <>
                      {tx.estatServidorLlegitExisteix}{' '}
                      <code>{inc.versioRemotaActual}</code>
                    </>
                  ) : esCreacioNova ? (
                    tx.estatServidorLlegitNoExisteix
                  ) : (
                    tx.estatServidorPendentLectura
                  )}
                </p>

                <div className="sdp-incidencies-cas__accions">
                  {teVersioServidor ? (
                    <Boto
                      varietat="primari"
                      className="sdp-incidencies-cas__boto"
                      disabled={Boolean(enVolClau) || comprovant}
                      onClick={() => resolItem(inc, inc.versioRemotaActual)}
                    >
                      {ocupat ? tx.resolent : tx.botoReintentaVersioActual}
                    </Boto>
                  ) : null}

                  {esCreacioNova ? (
                    <Boto
                      varietat="primari"
                      className="sdp-incidencies-cas__boto"
                      disabled={Boolean(enVolClau) || comprovant}
                      onClick={() => resolItem(inc, null)}
                    >
                      {ocupat ? tx.resolent : tx.botoPublicaComNova}
                    </Boto>
                  ) : null}

                  {typeof onRefresca === 'function' ? (
                    <Boto
                      varietat="secundari"
                      className="sdp-incidencies-cas__boto"
                      disabled={Boolean(enVolClau) || comprovant}
                      onClick={comprovaServidor}
                    >
                      {comprovant ? tx.comprovant : tx.botoComprovaServidor}
                    </Boto>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export default PanellIncidenciesPublicacioCas;
