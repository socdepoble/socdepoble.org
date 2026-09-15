// ESTAT: Esborrany (No utilitzar en producció)
import React, { useState } from 'react';
import { UniversalPage } from '../../../components/universal/UniversalPage';
import { useGestoriaData } from '../hooks/useGestoriaData';

export default function GestoriaFacturacio() {
  const { data, loading } = useGestoriaData();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  if (loading) {
    return (
      <UniversalPage title="Facturació" chrome="none">
        <div className="sdp-estat" role="status" aria-live="polite">
          <p className="sdp-estat__text">Carregant factures...</p>
        </div>
      </UniversalPage>
    );
  }

  const { formatEur } = data;
  let factures = [...(data.factures || [])];

  if (filter !== 'ALL') {
    factures = factures.filter((factura) => factura.type === filter);
  }

  if (search.trim()) {
    const consulta = search.trim().toLowerCase();
    factures = factures.filter((factura) => (
      factura.contact_name?.toLowerCase().includes(consulta)
      || factura.id?.toLowerCase().includes(consulta)
    ));
  }

  factures.sort((a, b) => b.date_timestamp - a.date_timestamp);

  return (
    <UniversalPage
      title="FACTURACIÓ"
      category="GESTORIA"
      tags={["PANELL INTERN"]}
    >
      <section className="up-document" aria-labelledby="gestoria-facturacio-titol">
        <h2 id="gestoria-facturacio-titol">
          Registre unificat de vendes i compres
        </h2>

        <div className="sdp-accions" aria-label="Filtres de facturació">
          <button
            className={`sdp-boto${filter === 'ALL' ? ' sdp-boto--primari' : ''}`}
            type="button"
            aria-pressed={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
          >
            Tot
          </button>
          <button
            className={`sdp-boto${filter === 'INGRES' ? ' sdp-boto--primari' : ''}`}
            type="button"
            aria-pressed={filter === 'INGRES'}
            onClick={() => setFilter('INGRES')}
          >
            Vendes
          </button>
          <button
            className={`sdp-boto${filter === 'GASTO' ? ' sdp-boto--primari' : ''}`}
            type="button"
            aria-pressed={filter === 'GASTO'}
            onClick={() => setFilter('GASTO')}
          >
            Compres
          </button>
        </div>

        <form
          className="sdp-formulari"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="sdp-camp">
            <label htmlFor="gestoria-cerca-factures">Cerca factures</label>
            <input
              id="gestoria-cerca-factures"
              className="sdp-control"
              type="search"
              placeholder="Nom, NIF o número de document"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </form>

        <div className="sdp-accions sdp-accions--final">
          <button className="sdp-boto sdp-boto--accent" type="button">
            Nova factura
          </button>
        </div>

        <div
          className="sdp-taula-scroll"
          tabIndex="0"
          aria-label="Factures: desplaçament horitzontal"
        >
          <table className="sdp-taula sdp-taula--interactiva sdp-taula--ampla">
            <caption>Factures registrades</caption>
            <thead>
              <tr>
                <th scope="col">Tipus</th>
                <th scope="col">Data</th>
                <th scope="col">Número de document</th>
                <th scope="col">Client o proveïdor</th>
                <th scope="col">Concepte</th>
                <th className="sdp-taula__nombre" scope="col">Total</th>
                <th scope="col">Estat</th>
              </tr>
            </thead>
            <tbody>
              {factures.length === 0 ? (
                <tr>
                  <td className="sdp-taula__buit" colSpan="7">
                    Sense documents per mostrar. Usa l’escàner o canvia els filtres.
                  </td>
                </tr>
              ) : (
                factures.map((factura, index) => {
                  const esVenda = factura.type === 'INGRES';
                  const conciliada = factura.estat_conciliacio === 'CONCILIAT';

                  return (
                    <tr key={factura.id || index}>
                      <td>
                        <span
                          className={`sdp-insignia ${esVenda ? 'sdp-insignia--exit' : 'sdp-insignia--info'}`}
                        >
                          {esVenda ? 'Venda' : 'Compra'}
                        </span>
                      </td>
                      <td>{new Date(factura.date_timestamp).toLocaleDateString()}</td>
                      <th scope="row">{factura.id}</th>
                      <td>{factura.contact_name || factura.contact_nif}</td>
                      <td>{factura.desc}</td>
                      <td className="sdp-taula__nombre">{formatEur(factura.total)}</td>
                      <td>
                        <span
                          className={`sdp-insignia ${conciliada ? 'sdp-insignia--exit' : 'sdp-insignia--avis'}`}
                        >
                          {factura.estat_conciliacio}
                        </span>
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
