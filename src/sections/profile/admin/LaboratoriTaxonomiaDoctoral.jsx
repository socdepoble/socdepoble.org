import { useMemo, useState } from 'react';
import { Link } from '../../../app/contexts/RouterContext';
import { Boto, Insignia } from '../../../components/PedraSeca';
import { Interruptor } from '../../../components/PedraSeca/organismes/formulari.jsx';
import {
  RESUM_AUDITORIA_BIBLIOTECONOMIA,
  FACETA_1_CATEGORIES_GEOGRAFIQUES,
  FACETA_2_VERTICALS_SISTEMA,
  FACETA_3_CATEGORIES_MARES_IA,
  FACETA_4_ETIQUETES_SKOS,
  ARTICLES_SIMULADOR_IA_425,
  llegeixEstatTaxonomiaAdmin,
  desaEstatTaxonomiaAdmin,
} from '../../../data/taxonomia/tesaurusDoctoralSocDePoble.js';

export function LaboratoriTaxonomiaDoctoral() {
  const [estat, setEstat] = useState(() => llegeixEstatTaxonomiaAdmin());
  const [facetaActiva, setFacetaActiva] = useState('totes');
  const [cercaGeografica, setCercaGeografica] = useState('');
  const [cercaEtiquetes, setCercaEtiquetes] = useState('');
  const [mostraBuides, setMostraBuides] = useState(true);
  const [cercaArticles, setCercaArticles] = useState('');
  const [filtreCatIA, setFiltreCatIA] = useState('totes');
  const [filtrePoble, setFiltrePoble] = useState('tots');
  const [filtreEtiqueta, setFiltreEtiqueta] = useState('totes');
  const [paginaArticles, setPaginaArticles] = useState(1);

  const actualitzaEstat = ( productor ) => {
    setEstat((prev) => {
      const next = typeof productor === 'function' ? productor(prev) : productor;
      desaEstatTaxonomiaAdmin(next);
      return next;
    });
  };

  const alternaCategoriaMare = (id, activa) => {
    actualitzaEstat((prev) => ({
      ...prev,
      categoriesActives: {
        ...prev.categoriesActives,
        [id]: Boolean(activa),
      },
    }));
  };

  const alternaEtiqueta = (slug, activa) => {
    actualitzaEstat((prev) => ({
      ...prev,
      etiquetesActives: {
        ...prev.etiquetesActives,
        [slug]: Boolean(activa),
      },
    }));
  };

  const podaEtiquetesBuides = () => {
    actualitzaEstat((prev) => {
      const nextEtiquetes = { ...prev.etiquetesActives };
      for (const tag of FACETA_4_ETIQUETES_SKOS) {
        if (tag.isEmpty || tag.isDeprecatedSynonym) {
          nextEtiquetes[tag.slug] = false;
        }
      }
      return {
        ...prev,
        etiquetesActives: nextEtiquetes,
        etiquetesBuidesPodades: true,
      };
    });
    setMostraBuides(false);
  };

  const categoriesGeografiquesFiltrades = useMemo(() => {
    const q = cercaGeografica.trim().toLowerCase();
    return FACETA_1_CATEGORIES_GEOGRAFIQUES.filter((c) => {
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.path.toLowerCase().includes(q);
    });
  }, [cercaGeografica]);

  const etiquetesFiltrades = useMemo(() => {
    const q = cercaEtiquetes.trim().toLowerCase();
    return FACETA_4_ETIQUETES_SKOS.filter((t) => {
      if (!mostraBuides && t.isEmpty) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.broaderTermLabel.toLowerCase().includes(q) ||
        t.useFor.some((uf) => uf.toLowerCase().includes(q))
      );
    });
  }, [cercaEtiquetes, mostraBuides]);

  const poblesUnicsArticles = useMemo(() => {
    const set = new Set();
    for (const art of ARTICLES_SIMULADOR_IA_425) {
      for (const p of art.poblesDetectats) set.add(p);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ca'));
  }, []);

  const etiquetesNetesUniques = useMemo(() => {
    const set = new Set();
    for (const art of ARTICLES_SIMULADOR_IA_425) {
      for (const et of art.etiquetesNetes) set.add(et);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ca'));
  }, []);

  const articlesFiltrats = useMemo(() => {
    const q = cercaArticles.trim().toLowerCase();
    return ARTICLES_SIMULADOR_IA_425.filter((art) => {
      if (filtreCatIA !== 'totes' && art.categoriaTematicaProposadaId !== filtreCatIA) return false;
      if (filtrePoble !== 'tots' && !art.poblesDetectats.includes(filtrePoble)) return false;
      if (filtreEtiqueta !== 'totes' && !art.etiquetesNetes.includes(filtreEtiqueta)) return false;
      if (!q) return true;
      return (
        art.title.toLowerCase().includes(q) ||
        art.slug.toLowerCase().includes(q) ||
        art.poblesDetectats.some((p) => p.toLowerCase().includes(q)) ||
        art.etiquetesNetes.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [cercaArticles, filtreCatIA, filtrePoble, filtreEtiqueta]);

  const PER_PAGINA = 25;
  const totalPagines = Math.max(1, Math.ceil(articlesFiltrats.length / PER_PAGINA));
  const paginaSegura = Math.min(paginaArticles, totalPagines);
  const articlesVisibles = articlesFiltrats.slice((paginaSegura - 1) * PER_PAGINA, paginaSegura * PER_PAGINA);

  const comptadorActives = Object.values(estat.etiquetesActives).filter(Boolean).length;
  const comptadorCategoriesActives = Object.values(estat.categoriesActives).filter(Boolean).length;

  return (
    <article className="sdp-admin-taxonomia" aria-label="Laboratori Doctoral de Biblioteconomia i Classificació">
      <header className="sdp-admin-taxonomia__header">
        <div className="sdp-admin-taxonomia__badges">
          <Insignia to="primari">PMEST · S. R. Ranganathan</Insignia>
          <Insignia to="neutre">Tesaurus ISO 25964 / W3C SKOS</Insignia>
          <Insignia to="exit">{`${RESUM_AUDITORIA_BIBLIOTECONOMIA.totalCategoriesWp} categories · ${RESUM_AUDITORIA_BIBLIOTECONOMIA.totalEtiquetesWp} etiquetes · ${RESUM_AUDITORIA_BIBLIOTECONOMIA.totalArticlesWp} articles`}</Insignia>
        </div>
        <h2>🏷️ Taxonomia: Categories i Etiquetes</h2>
        <p className="sdp-admin-taxonomia__lead">
          <strong>Explicat de forma clara i humana:</strong> En la web antiga (<code>socdepoble.net</code>), les <strong>114 categories</strong> s’havien usat per a posar el nom del poble o de la comarca (113 geogràfiques), i les <strong>105 etiquetes</strong> barrejaven temes, formats i sinònims duplicats (amb 53 etiquetes buides). Ací separem cada cosa al seu lloc amb quatre facetes netes perquè qualsevol veí o veïna trobe al moment el que busca.
        </p>
        <blockquote className="sdp-admin-taxonomia__diagnostic">
          <strong>Diagnòstic Doctoral (Ranganathan PMEST):</strong> {RESUM_AUDITORIA_BIBLIOTECONOMIA.diagnosticRanganathan}
        </blockquote>
      </header>

      <nav className="sdp-admin-taxonomia__tabs" aria-label="Facetes de la classificació">
        {[
          ['totes', '📚 Vista Integral (4 Facetes)'],
          ['faceta1', '1. 📍 Faceta Geogràfica (On · 113)'],
          ['faceta2', '2. 🧩 Faceta Funcional (Què és · 8 Verticals)'],
          ['faceta3', `3. ⚖️ Categories Temàtiques (${comptadorCategoriesActives}/6)`],
          ['faceta4', `4. 🏷️ Tesaurus SKOS (${comptadorActives}/105) + Simulador IA (425)`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`sdp-boto ${facetaActiva === id ? 'sdp-boto--primari' : 'sdp-boto--secundari'}`}
            aria-pressed={facetaActiva === id}
            onClick={() => setFacetaActiva(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* FACETA 1 · GEOGRÀFICA */}
      {(facetaActiva === 'totes' || facetaActiva === 'faceta1') && (
        <section className="sdp-admin-taxonomia__section" aria-labelledby="titol-faceta-1">
          <h2 id="titol-faceta-1">Faceta 1 · Geogràfica (<code>On</code> — Pobles, Pedanies, Comarques i Paratges Naturals)</h2>
          <p>
            Les <strong>113 categories geogràfiques</strong> de <code>socdepoble.net</code> estaven estructurades en un arbre de 4-5 nivells (<code>Xarxa de Pobles → Província/Demarcació → Comarca → Poble → Pedania</code>). En <strong>Sóc de Poble</strong> passen a ser camps natius (<code>poble_id</code> des d’on es publica i <code>pobles_etiquetats</code> de quins pobles es parla), alliberant les categories temàtiques.
          </p>
          <div className="sdp-admin-taxonomia__controls">
            <label htmlFor="cerca-geo">
              <strong>Filtrar arbre geogràfic (114 categories):</strong>
            </label>
            <input
              id="cerca-geo"
              type="search"
              className="sdp-input"
              placeholder="Ex. La Torre de les Maçanes, El Comtat, Alcoi, Benifallim…"
              value={cercaGeografica}
              onChange={(e) => setCercaGeografica(e.target.value)}
            />
          </div>
          <div className="sdp-admin-taxonomia__table-wrap">
            <table className="sdp-table">
              <thead>
                <tr>
                  <th>Nivell</th>
                  <th>Camí Jeràrquic a WordPress (<code>Xarxa de Pobles → Demarcació → Comarca → Poble</code>)</th>
                  <th>Articles</th>
                  <th>Rol / Destí en Sóc de Poble</th>
                </tr>
              </thead>
              <tbody>
                {categoriesGeografiquesFiltrades.slice(0, cercaGeografica ? 114 : 30).map((cat) => (
                  <tr key={cat.id}>
                    <td><code>Nivell {cat.depth}</code></td>
                    <td>
                      <strong>{cat.name}</strong>
                      <div className="sdp-nota-suau"><small>{cat.path}</small></div>
                    </td>
                    <td><strong>{cat.count}</strong></td>
                    <td>
                      <code>{cat.campDesti}</code> ({cat.rolGeografic})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!cercaGeografica && categoriesGeografiquesFiltrades.length > 30 ? (
              <p className="sdp-nota-suau">
                Mostrant 30 de les {categoriesGeografiquesFiltrades.length} categories. Usa el cercador superior per inspeccionar qualsevol dels 113 pobles i comarques.
              </p>
            ) : null}
          </div>
        </section>
      )}

      {/* FACETA 2 · FUNCIONAL DEL SISTEMA */}
      {(facetaActiva === 'totes' || facetaActiva === 'faceta2') && (
        <section className="sdp-admin-taxonomia__section" aria-labelledby="titol-faceta-2">
          <h2 id="titol-faceta-2">Faceta 2 · Funcional del Sistema (<code>Què és</code> — Les 8 Verticals)</h2>
          <p>
            Separa la forma i la funció de cada publicació (crònica del Mur, producte del Mercat, esdeveniment del Calendari, punt del Mapa, cotxe compartit, animalets, oferta de treball o habitatge rural).
          </p>
          <div className="sdp-admin-taxonomia__grid">
            {FACETA_2_VERTICALS_SISTEMA.map((v) => (
              <div key={v.id} className="sdp-card sdp-admin-taxonomia__card">
                <h3>
                  <span>{v.icona}</span> {v.nom}
                </h3>
                <p>{v.descripcio}</p>
                <Link to={v.ruta} className="sdp-boto sdp-boto--secundari">
                  Obrir {v.nom}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FACETA 3 · CATEGORIES TEMÀTIQUES I SOCIALS TRONCALS */}
      {(facetaActiva === 'totes' || facetaActiva === 'faceta3') && (
        <section className="sdp-admin-taxonomia__section" aria-labelledby="titol-faceta-3">
          <h2 id="titol-faceta-3">Faceta 3 · Categories Temàtiques i Socials Troncals (<code>De què tracta</code> — 6 Categories Mares IA)</h2>
          <p>
            Un cop alliberades les categories de la geografia, la IA bibliotecària proposa aquestes <strong>6 Categories Mares Troncals</strong>. Pots activar-les o desactivar-les amb l’interruptor; l’estat queda guardat.
          </p>
          <div className="sdp-admin-taxonomia__grid">
            {FACETA_3_CATEGORIES_MARES_IA.map((cat) => {
              const activa = Boolean(estat.categoriesActives[cat.id]);
              const recompteArticles = ARTICLES_SIMULADOR_IA_425.filter(
                (a) => a.categoriaTematicaProposadaId === cat.id
              ).length;
              return (
                <div key={cat.id} className="sdp-card sdp-admin-taxonomia__card" data-activa={String(activa)}>
                  <div className="sdp-admin-taxonomia__card-top">
                    <h3>{cat.label}</h3>
                    <Interruptor
                      checked={activa}
                      onChange={(val) => alternaCategoriaMare(cat.id, val)}
                      aria-label={`Activar categoria ${cat.label}`}
                    />
                  </div>
                  <p>{cat.descripcio}</p>
                  <p className="sdp-nota-suau">
                    <small>
                      <strong>Notació SKOS:</strong> <code>{cat.skosNotation}</code> · <strong>PMEST:</strong> {cat.ranganathanFacet} · <strong>Articles classificats per IA:</strong> {recompteArticles}
                    </small>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FACETA 4 · TESAURUS D'ETIQUETES SKOS + SIMULADOR IA DELS 425 ARTICLES */}
      {(facetaActiva === 'totes' || facetaActiva === 'faceta4') && (
        <section className="sdp-admin-taxonomia__section" aria-labelledby="titol-faceta-4">
          <h2 id="titol-faceta-4">Faceta 4 · Tesaurus d’Etiquetes (<code>Tags</code> SKOS) i Simulador IA dels 425 Articles</h2>
          <p>
            Ací tens les <strong>105 etiquetes reals de <code>socdepoble.net</code></strong> amb la seua Categoria Temàtica mare (<code>Broader Term</code>), les etiquetes relacionades (<code>Related Terms</code>) i els sinònims absorbits (<code>Use For</code>: <code>Aplec pel Territori</code> absorbeix <code>aplec-pel-territori-2</code> i <code>Aplecs</code>; <code>Posant en Valor els Recursos Locals</code> absorbeix <code>Recursos Locals</code>; <code>Reivindicant</code> absorbeix <code>Reivin</code>; <code>Arbres Monumentals</code> absorbeix <code>Arbres</code> i <code>Monumentals</code>).
          </p>

          <div className="sdp-admin-taxonomia__toolbar">
            <Boto varietat="primari" onClick={podaEtiquetesBuides}>
              ✂️ Podar les 53 etiquetes buides (0 articles)
            </Boto>
            <Boto
              varietat="secundari"
              onClick={() => setMostraBuides((v) => !v)}
            >
              {mostraBuides ? 'Amagar etiquetes de 0 articles de la taula' : 'Mostrar també les 53 etiquetes buides'}
            </Boto>
            <input
              type="search"
              className="sdp-input"
              aria-label="Cercar etiqueta al tesaurus SKOS"
              placeholder="Cercar etiqueta, Broader Term o sinònim…"
              value={cercaEtiquetes}
              onChange={(e) => setCercaEtiquetes(e.target.value)}
            />
          </div>

          {estat.etiquetesBuidesPodades ? (
            <p role="status" className="sdp-admin-taxonomia__status">
              ✅ S’han desactivat i podat les 53 etiquetes buides (0 articles) i els sinònims duplicats absorbits per SKOS <code>Use For</code>.
            </p>
          ) : null}

          <div className="sdp-admin-taxonomia__table-wrap">
            <table className="sdp-table" aria-label="Tesaurus SKOS de 105 etiquetes">
              <thead>
                <tr>
                  <th>Activa</th>
                  <th>Etiqueta (<code>prefLabel</code>)</th>
                  <th>Articles</th>
                  <th>Categoria Mare (<code>Broader Term</code>)</th>
                  <th>Relacionades (<code>Related Terms</code>)</th>
                  <th>Sinònims Absorbits (<code>Use For</code>)</th>
                </tr>
              </thead>
              <tbody>
                {etiquetesFiltrades.map((tag) => {
                  const activa = Boolean(estat.etiquetesActives[tag.slug]);
                  return (
                    <tr key={tag.id} data-empty={String(tag.isEmpty)}>
                      <td>
                        <Interruptor
                          checked={activa}
                          onChange={(val) => alternaEtiqueta(tag.slug, val)}
                          aria-label={`Activar etiqueta ${tag.name} (${tag.slug})`}
                        />
                      </td>
                      <td>
                        <strong>{tag.name}</strong> <code>({tag.slug})</code>
                        {tag.isDeprecatedSynonym ? (
                          <div><small>⚠️ Sinònim absorbit (SKOS altLabel)</small></div>
                        ) : null}
                      </td>
                      <td><strong>{tag.count}</strong></td>
                      <td>{tag.broaderTermLabel}</td>
                      <td><small>{tag.relatedTerms.join(' · ')}</small></td>
                      <td>
                        {tag.useFor.length > 0 ? (
                          <strong>Absorbeix: {tag.useFor.join(', ')}</strong>
                        ) : (
                          <span className="sdp-nota-suau">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <hr className="sdp-divider" />

          <div className="sdp-admin-taxonomia__simulador" aria-labelledby="titol-simulador-425">
            <h3 id="titol-simulador-425">🤖 Simulador IA dels 425 Articles Reals de <code>socdepoble.net</code></h3>
            <p>
              Comprova com queden classificats cadascun dels <strong>425 articles reals</strong> amb la separació entre pobles detectats (Faceta 1), la Categoria Temàtica proposada per la IA (Faceta 3) i les etiquetes netes sense duplicats (Faceta 4).
            </p>

            <div className="sdp-admin-taxonomia__filters">
              <input
                type="search"
                className="sdp-input"
                aria-label="Cercar entre els 425 articles"
                placeholder="Cercar per títol, slug, poble o etiqueta…"
                value={cercaArticles}
                onChange={(e) => {
                  setCercaArticles(e.target.value);
                  setPaginaArticles(1);
                }}
              />

              <select
                className="sdp-select"
                aria-label="Filtrar per Categoria Temàtica"
                value={filtreCatIA}
                onChange={(e) => {
                  setFiltreCatIA(e.target.value);
                  setPaginaArticles(1);
                }}
              >
                <option value="totes">Totes les Categories Temàtiques (6)</option>
                {FACETA_3_CATEGORIES_MARES_IA.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <select
                className="sdp-select"
                aria-label="Filtrar per Poble"
                value={filtrePoble}
                onChange={(e) => {
                  setFiltrePoble(e.target.value);
                  setPaginaArticles(1);
                }}
              >
                <option value="tots">Tots els Pobles ({poblesUnicsArticles.length})</option>
                {poblesUnicsArticles.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                className="sdp-select"
                aria-label="Filtrar per Etiqueta Neta"
                value={filtreEtiqueta}
                onChange={(e) => {
                  setFiltreEtiqueta(e.target.value);
                  setPaginaArticles(1);
                }}
              >
                <option value="totes">Totes les Etiquetes Netes ({etiquetesNetesUniques.length})</option>
                {etiquetesNetesUniques.map((et) => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>

            <p className="sdp-nota-suau">
              Mostrant <strong>{articlesFiltrats.length}</strong> de <strong>{ARTICLES_SIMULADOR_IA_425.length}</strong> articles reals (Pàgina {paginaSegura} de {totalPagines}).
            </p>

            <div className="sdp-admin-taxonomia__table-wrap">
              <table className="sdp-table" aria-label="Simulador IA dels 425 articles">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Títol i Enllaç Original</th>
                    <th>Pobles Detectats (<code>pobles_etiquetats</code>)</th>
                    <th>Categoria Temàtica IA</th>
                    <th>Etiquetes Netes SKOS</th>
                  </tr>
                </thead>
                <tbody>
                  {articlesVisibles.map((art) => (
                    <tr key={art.id}>
                      <td><small>{art.date.slice(0, 10)}</small></td>
                      <td>
                        <strong>{art.title}</strong>
                        <div>
                          <small>
                            <a href={art.link} target="_blank" rel="noopener noreferrer">
                              Original a socdepoble.net ↗
                            </a>
                            {' · '}
                            <Link to={art.rutaDestiCanonica}>
                              Ruta: <code>{art.rutaDestiCanonica}</code>
                            </Link>
                          </small>
                        </div>
                      </td>
                      <td>
                        {art.poblesDetectats.length > 0 ? (
                          art.poblesDetectats.join(', ')
                        ) : (
                          <span className="sdp-nota-suau">Xarxa General</span>
                        )}
                      </td>
                      <td>{art.categoriaTematicaProposadaLabel}</td>
                      <td>
                        {art.etiquetesNetes.length > 0 ? (
                          art.etiquetesNetes.join(' · ')
                        ) : (
                          <span className="sdp-nota-suau">Sense etiquetes</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPagines > 1 ? (
              <div className="sdp-admin-taxonomia__pagination">
                <Boto
                  varietat="secundari"
                  disabled={paginaSegura <= 1}
                  onClick={() => setPaginaArticles((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </Boto>
                <span>Pàgina {paginaSegura} / {totalPagines}</span>
                <Boto
                  varietat="secundari"
                  disabled={paginaSegura >= totalPagines}
                  onClick={() => setPaginaArticles((p) => Math.min(totalPagines, p + 1))}
                >
                  Següent →
                </Boto>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </article>
  );
}

export default LaboratoriTaxonomiaDoctoral;
