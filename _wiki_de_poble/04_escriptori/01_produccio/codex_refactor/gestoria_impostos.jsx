// ESTAT: Esborrany (No utilitzar en producció)
import React from 'react';
import { UniversalPage } from '../../../components/universal/UniversalPage';

const TRIMESTRES = [1, 2, 3, 4];

export default function GestoriaImpostos() {
  return (
    <UniversalPage
      title="IMPOSTOS"
      category="GESTORIA"
      tags={["IMPOSTOS"]}
    >
      <section className="up-document" aria-labelledby="gestoria-impostos-titol">
        <h2 id="gestoria-impostos-titol">Gestió fiscal — models 303 i 130</h2>

        <section aria-labelledby="gestoria-propers-impostos">
          <h3 id="gestoria-propers-impostos">Els pròxims impostos</h3>
          <ul className="sdp-llista-accions">
            <li>
              <button className="sdp-boto" type="button">
                <span className="sdp-insignia sdp-insignia--exit">303</span>
                <span>Model 303 trimestral — 2 trimestres pendents</span>
              </button>
            </li>
            <li>
              <button className="sdp-boto" type="button">
                <span className="sdp-insignia sdp-insignia--info">130</span>
                <span>Model 130 — 2 trimestres pendents</span>
              </button>
            </li>
          </ul>
        </section>

        <section aria-labelledby="gestoria-model-303">
          <div className="sdp-accions">
            <h3 id="gestoria-model-303">Model 303 trimestral</h3>
            <span className="sdp-insignia sdp-insignia--info">2026</span>
          </div>

          <div
            className="sdp-taula-scroll"
            tabIndex="0"
            aria-label="Model 303: desplaçament horitzontal"
          >
            <table className="sdp-taula sdp-taula--interactiva">
              <caption>Resum trimestral del model 303</caption>
              <thead>
                <tr>
                  <th scope="col">Període</th>
                  <th className="sdp-taula__nombre" scope="col">Impost suportat</th>
                  <th className="sdp-taula__nombre" scope="col">Impost repercutit</th>
                  <th className="sdp-taula__nombre" scope="col">Resultat fiscal</th>
                  <th scope="col">Estat</th>
                </tr>
              </thead>
              <tbody>
                {TRIMESTRES.map((trimestre) => (
                  <tr key={trimestre}>
                    <th scope="row">{trimestre} trimestre</th>
                    <td className="sdp-taula__nombre">0,00 €</td>
                    <td className="sdp-taula__nombre">0,00 €</td>
                    <td className="sdp-taula__nombre">0,00 €</td>
                    <td>
                      <span className="sdp-insignia sdp-insignia--avis">
                        Pendent
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td className="sdp-taula__nombre">0,00 €</td>
                  <td className="sdp-taula__nombre">0,00 €</td>
                  <td className="sdp-taula__nombre">0,00 €</td>
                  <td>
                    <span className="sdp-insignia sdp-insignia--avis">
                      Pendent
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </section>
    </UniversalPage>
  );
}
