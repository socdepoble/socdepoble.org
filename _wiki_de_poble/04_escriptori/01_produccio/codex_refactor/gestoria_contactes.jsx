import React from 'react';
import { UniversalPage } from '../../../components/universal/UniversalPage';
import { useGestoriaData } from '../hooks/useGestoriaData';

export default function GestoriaContactes() {
  const { data, loading } = useGestoriaData();

  if (loading) {
    return (
      <UniversalPage title="Contactes" chrome="none">
        <div className="sdp-estat" role="status" aria-live="polite">
          <p className="sdp-estat__text">Carregant contactes...</p>
        </div>
      </UniversalPage>
    );
  }

  const contactes = data.contactes || [];

  return (
    <UniversalPage
      title="CONTACTES"
      category="GESTORIA"
      tags={["PANELL INTERN"]}
    >
      <section className="up-document" aria-labelledby="gestoria-contactes-titol">
        <h2 id="gestoria-contactes-titol">El CRM poble-first — Llibre Major</h2>

        <div
          className="sdp-taula-scroll"
          tabIndex="0"
          aria-label="Contactes: desplaçament horitzontal"
        >
          <table className="sdp-taula sdp-taula--interactiva">
            <caption>Contactes del Llibre Major</caption>
            <thead>
              <tr>
                <th scope="col">Nom o raó social</th>
                <th scope="col">NIF o CIF</th>
                <th scope="col">Tipus</th>
                <th className="sdp-taula__accions" scope="col">Accions</th>
              </tr>
            </thead>
            <tbody>
              {contactes.length === 0 ? (
                <tr>
                  <td className="sdp-taula__buit" colSpan="4">
                    Sense contactes al Llibre Major.
                  </td>
                </tr>
              ) : (
                contactes.map((contacte, index) => {
                  const esClient = contacte.tipus === 'CLIENT';

                  return (
                    <tr key={contacte.id || contacte.nif || index}>
                      <th scope="row">{contacte.nom}</th>
                      <td>{contacte.nif}</td>
                      <td>
                        <span
                          className={`sdp-insignia ${esClient ? 'sdp-insignia--exit' : 'sdp-insignia--info'}`}
                        >
                          {contacte.tipus}
                        </span>
                      </td>
                      <td className="sdp-taula__accions">
                        <button className="sdp-boto" type="button">
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </UniversalPage>
  );
}
