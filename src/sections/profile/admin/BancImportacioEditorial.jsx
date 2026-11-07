import { useMemo, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Camp } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { Link } from '../../../app/contexts/RouterContext.jsx';
import {
  CASOS_US_EDITORIALS,
  desaRevisioArticleImportat,
  estadistiquesRevisioImportacio,
  lligArticlesImportatsAmbRevisio,
  parsejaBloggerAtomXml,
  parsejaWordPressWxrXml
} from '../../../utils/transformadorEditorialWpBlogger.js';

const ETIQUETA_ESTAT = Object.freeze({
  pendent_admin: { label: '⏳ Pendent de revisió', to: 'avis' },
  aprovat: { label: '✅ Aprovat per al Mur', to: 'exit' },
  amb_observacions: { label: '📝 Amb observacions', to: 'primari' }
});

export function BancImportacioEditorial() {
  const [versio, setVersio] = useState(0);
  const [cerca, setCerca] = useState('');
  const [filtreEstat, setFiltreEstat] = useState('tots');
  const [filtreCasUs, setFiltreCasUs] = useState('tots');
  const [pagina, setPagina] = useState(1);
  const [articleSeleccionatId, setArticleSeleccionatId] = useState(null);
  const [notaEdicio, setNotaEdicio] = useState('');
  const [resultatXml, setResultatXml] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const articles = useMemo(() => lligArticlesImportatsAmbRevisio(), [versio]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => estadistiquesRevisioImportacio(), [versio]);

  const articlesFiltrats = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return articles.filter((art) => {
      if (filtreEstat !== 'tots' && art.estat_revisio !== filtreEstat) return false;
      if (filtreCasUs !== 'tots' && !art.casos_us.includes(filtreCasUs)) return false;
      if (!q) return true;
      return (
        art.title.toLowerCase().includes(q) ||
        art.slug.toLowerCase().includes(q) ||
        String(art.wp_id).includes(q) ||
        art.pobles_etiquetats.some((p) => p.toLowerCase().includes(q)) ||
        art.etiquetes_netes.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [articles, cerca, filtreEstat, filtreCasUs]);

  const PER_PAGINA = 20;
  const totalPagines = Math.max(1, Math.ceil(articlesFiltrats.length / PER_PAGINA));
  const paginaSegura = Math.min(pagina, totalPagines);
  const visibles = articlesFiltrats.slice((paginaSegura - 1) * PER_PAGINA, paginaSegura * PER_PAGINA);

  const seleccionat = useMemo(
    () => articles.find((a) => a.wp_id === articleSeleccionatId) || visibles[0] || null,
    [articles, articleSeleccionatId, visibles]
  );

  const canviaEstatArticle = (wpId, estat, nota = undefined) => {
    desaRevisioArticleImportat(wpId, {
      estat,
      ...(nota !== undefined ? { nota } : {})
    });
    setVersio((v) => v + 1);
  };

  const seleccionaArticle = (art) => {
    setArticleSeleccionatId(art.wp_id);
    setNotaEdicio(art.nota_revisio || '');
  };

  const gestionaFitxerXml = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const text = await file.text();
    const esWxr = text.includes('<wp:post_id>') || text.includes('wordpress.org/export/');
    const items = esWxr ? parsejaWordPressWxrXml(text) : parsejaBloggerAtomXml(text);
    setResultatXml({
      nom: file.name,
      format: esWxr ? 'WordPress WXR (.xml)' : 'Blogger Atom (.xml)',
      total: items.length
    });
  };

  return (
    <article className="sdp-admin-importacio" aria-label="Importació i Revisió Editorial de WordPress i Blogger">
      <header className="sdp-admin-taxonomia__header">
        <div className="sdp-admin-taxonomia__badges">
          <Insignia to="primari">Motor Universal WordPress + Blogger</Insignia>
          <Insignia to="avis">{stats.pendent_admin} pendents de revisió</Insignia>
          <Insignia to="exit">{stats.aprovat} aprovats</Insignia>
          <Insignia to="neutre">{stats.totalPagines} pàgines estàtiques mapejades</Insignia>
        </div>
        <p>
          Banc d’auditoria i curació humana de les <strong>{stats.total} publicacions històriques</strong> i{' '}
          <strong>{stats.totalPagines} pàgines</strong> de <code>socdepoble.net</code>. Pots revisar cada article,
          comparar-lo amb l’original de WordPress i verificar els casos d’ús multimèdia (galeries, vídeos, PDFs,
          iframes d’agenda/mapes reescrits a components natius i enllaços interns).
        </p>
      </header>

      <section className="sdp-admin-taxonomia__kpis" aria-label="Resum d'importació i casos d'ús">
        <div className="sdp-admin-kpi">
          <strong>{stats.total}</strong>
          <span>Articles WordPress</span>
        </div>
        <div className="sdp-admin-kpi">
          <strong>{stats.pendent_admin}</strong>
          <span>⏳ Pendents Admin</span>
        </div>
        <div className="sdp-admin-kpi">
          <strong>{stats.aprovat}</strong>
          <span>✅ Aprovats</span>
        </div>
        <div className="sdp-admin-kpi">
          <strong>{stats.amb_observacions}</strong>
          <span>📝 Amb observacions</span>
        </div>
      </section>

      <section className="sdp-admin-taxonomia__panel" aria-label="Importador d'arxius XML WXR i Blogger">
        <div className="sdp-admin-taxonomia__toolbar">
          <div>
            <h3>📂 Ingesta d’arxius d’exportació (WP REST API · WordPress WXR .xml · Blogger Atom .xml)</h3>
            <p className="sdp-muted">
              A més del catàleg complet de <code>socdepoble.net</code> ja carregat, pots importar qualsevol arxiu{' '}
              <code>.xml</code> d’exportació de WordPress o dels blogs històrics de Blogger.
            </p>
          </div>
          <div>
            <label className="sdp-boto sdp-boto--secundari sdp-admin-accio-fitxer">
              Carregar arxiu .XML (WXR / Blogger)
              <input
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={gestionaFitxerXml}
                hidden
              />
            </label>
          </div>
        </div>
        {resultatXml && (
          <p role="status" className="sdp-admin-status-ok">
            ✅ Arxiu <strong>{resultatXml.nom}</strong> processat amb èxit ({resultatXml.format}):{' '}
            <strong>{resultatXml.total}</strong> entrades transformades a Pedra Seca.
          </p>
        )}
      </section>

      <section className="sdp-admin-taxonomia__panel" aria-label="Filtres del banc d'importació">
        <div className="sdp-admin-taxonomia__toolbar">
          <Camp
            id="cerca-importacio-wp"
            etiqueta="Cerca per títol, slug, ID de WordPress, poble o etiqueta"
            value={cerca}
            onChange={(e) => {
              setCerca(e.target.value);
              setPagina(1);
            }}
            placeholder="Ex: aplec, manifest, pedra en sec, benillup, 16893..."
          />
          <div className="sdp-admin-taxonomia__selects">
            <label>
              <span>Estat de revisió</span>
              <select
                value={filtreEstat}
                onChange={(e) => {
                  setFiltreEstat(e.target.value);
                  setPagina(1);
                }}
              >
                <option value="tots">Tots els estats ({stats.total})</option>
                <option value="pendent_admin">⏳ Pendents de revisió ({stats.pendent_admin})</option>
                <option value="aprovat">✅ Aprovats ({stats.aprovat})</option>
                <option value="amb_observacions">📝 Amb observacions ({stats.amb_observacions})</option>
              </select>
            </label>
            <label>
              <span>Cas d’ús de transformació</span>
              <select
                value={filtreCasUs}
                onChange={(e) => {
                  setFiltreCasUs(e.target.value);
                  setPagina(1);
                }}
              >
                <option value="tots">Tots els casos d’ús</option>
                {Object.values(CASOS_US_EDITORIALS).map((cas) => (
                  <option key={cas.id} value={cas.id}>
                    {cas.icona} {cas.titol} ({stats.perCasUs[cas.id] || 0})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="sdp-admin-importacio__layout">
          <div className="sdp-admin-taxonomia__table-wrap">
            <table className="sdp-admin-table">
              <thead>
                <tr>
                  <th>WP ID / Data</th>
                  <th>Títol i URL Canònica Sóc de Poble</th>
                  <th>Casos d’ús detectats</th>
                  <th>Estat</th>
                  <th>Acció ràpida</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((art) => {
                  const badgeEstat = ETIQUETA_ESTAT[art.estat_revisio] || ETIQUETA_ESTAT.pendent_admin;
                  const actiu = seleccionat?.wp_id === art.wp_id;
                  return (
                    <tr
                      key={art.wp_id}
                      className={actiu ? 'is-selected sdp-fila-seleccionable' : 'sdp-fila-seleccionable'}
                      onClick={() => seleccionaArticle(art)}
                    >
                      <td>
                        <code>#{art.wp_id}</code>
                        <div className="sdp-muted">{String(art.date || '').slice(0, 10)}</div>
                      </td>
                      <td>
                        <strong>{art.title}</strong>
                        <div className="sdp-muted">
                          <Link to={art.ruta_canonica}>{art.ruta_canonica}</Link>
                        </div>
                      </td>
                      <td>
                        <div className="sdp-admin-pills">
                          {art.casos_us_meta.map((cas) => (
                            <span key={cas.id} className="sdp-admin-pill" title={cas.descripcio}>
                              {cas.icona} {cas.titol}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Insignia to={badgeEstat.to}>{badgeEstat.label}</Insignia>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="sdp-admin-actions-inline">
                          <Link className="sdp-boto sdp-boto--secundari" to={art.ruta_canonica}>
                            👁️ Veure pàgina
                          </Link>
                          <Boto
                            varietat={art.estat_revisio === 'aprovat' ? 'primari' : 'secundari'}
                            onClick={() => canviaEstatArticle(art.wp_id, 'aprovat')}
                          >
                            Aprovar
                          </Boto>
                          <Boto
                            varietat="fantasma"
                            onClick={() => seleccionaArticle(art)}
                          >
                            Inspeccionar
                          </Boto>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="sdp-admin-pagination">
              <Boto
                varietat="secundari"
                disabled={paginaSegura <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </Boto>
              <span>
                Pàgina <strong>{paginaSegura}</strong> de <strong>{totalPagines}</strong> ({articlesFiltrats.length} articles)
              </span>
              <Boto
                varietat="secundari"
                disabled={paginaSegura >= totalPagines}
                onClick={() => setPagina((p) => Math.min(totalPagines, p + 1))}
              >
                Següent →
              </Boto>
            </div>
          </div>

          {seleccionat && (
            <aside className="sdp-admin-importacio__inspector" aria-label="Inspector comparatiu d'article importat">
              <h4>🔍 Fitxa de Revisió · #{seleccionat.wp_id}</h4>
              <p><strong>{seleccionat.title}</strong></p>
              <dl className="sdp-admin-dl">
                <dt>Ruta Sóc de Poble</dt>
                <dd><Link to={seleccionat.ruta_canonica}><code>{seleccionat.ruta_canonica}</code></Link></dd>
                <dt>URL Original WordPress</dt>
                <dd>
                  <a href={seleccionat.source_url} target="_blank" rel="noopener noreferrer">
                    {seleccionat.source_url} ↗
                  </a>
                </dd>
                <dt>Categoria Temàtica IA</dt>
                <dd><Insignia to="primari">{seleccionat.categoria_tematica}</Insignia></dd>
                <dt>Pobles etiquetats ({seleccionat.pobles_etiquetats.length})</dt>
                <dd>{seleccionat.pobles_etiquetats.join(', ') || 'Cap poble específic'}</dd>
                <dt>Etiquetes SKOS ({seleccionat.etiquetes_netes.length})</dt>
                <dd>{seleccionat.etiquetes_netes.join(', ') || 'Sense etiquetes'}</dd>
              </dl>

              <div className="sdp-admin-importacio__notes">
                <label htmlFor="nota-revisio-admin">
                  <strong>Anotacions del Mestre per a la transformació Pedra Seca:</strong>
                </label>
                <textarea
                  id="nota-revisio-admin"
                  rows={3}
                  value={notaEdicio}
                  onChange={(e) => setNotaEdicio(e.target.value)}
                  placeholder="Anota què cal polir d'aquest article (ex. revisar galeria, separar en dos articles, millorar subtítol)..."
                />
                <div className="sdp-admin-actions-inline sdp-admin-actions-inline--separat">
                  <Link className="sdp-boto sdp-boto--primari" to={seleccionat.ruta_canonica}>
                    👁️ Veure pàgina completa
                  </Link>
                  <Boto
                    varietat="primari"
                    onClick={() => canviaEstatArticle(seleccionat.wp_id, 'aprovat', notaEdicio)}
                  >
                    ✅ Aprovar i desar nota
                  </Boto>
                  <Boto
                    varietat="secundari"
                    onClick={() => canviaEstatArticle(seleccionat.wp_id, 'amb_observacions', notaEdicio)}
                  >
                    📝 Marcar amb observacions
                  </Boto>
                  <Boto
                    varietat="fantasma"
                    onClick={() => canviaEstatArticle(seleccionat.wp_id, 'pendent_admin', notaEdicio)}
                  >
                    ⏳ Tornar a pendent
                  </Boto>
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>
    </article>
  );
}

export default BancImportacioEditorial;
