import { consultaRevisioEditorialWp, llegeixEstatRevisioEditorial } from '../../../utils/revisioEditorialWp.js';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { UniversalCard } from '../../../components/PedraSeca/organismes/UniversalCard.jsx';
import { encapcalamentDeTargeta } from '../../../components/universal/editorial.js';
import { Camp, CampText, Selector } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { Link } from '../../../app/contexts/RouterContext.jsx';
import { useSessioOpcional } from '../../../app/contexts/SessionContext.jsx';
import { useUIActionsOpcional } from '../../../app/contexts/UIContext.jsx';
import { useProjeccionsCataleg } from '../../../hooks/useProjeccionsCataleg.js';
import { esPaginaTrilogiaIMoliWp } from '../../../data/importacio/paginesTrilogiaIMoliWp.js';
import { rutaWorkspaceWp } from '../../../data/importacio/destinacionsWorkspaceWp.js';
import { ETIQUETES_ESTAT_REVISIO_WP, desaRevisio, notificaRevisio, subscriu } from '../../../data/importacio/revisioImportacioWpStore.js';
import { desplacaDinsApp, enfocaSenseSalt } from '../../../utils/desplacamentProxim.js';
import { BarreraDelTrosAccessori, lazyRoute } from '../../../apps/plataforma/lazyRoute.js';
import {
  CASOS_US_EDITORIALS,
  desaDestinacioArticleImportat,
  fontReferenciaArticleImportat,
  LIMIT_BYTES_IMPORTACIO_EDITORIAL,
  estadistiquesRevisioImportacio,
  lligArticlesImportatsAmbRevisio,
  parsejaBloggerAtomXml,
  parsejaWordPressWxrXml,
  sincronitzaRevisionsEditorialsWpAmbServidor
} from '../../../utils/transformadorEditorialWpBlogger.js';
import cssAdminTaxonomia from '../../../css/diferit-admin-taxonomia.css?inline';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';

/* v1.2.18 · Sostre d'arrencada (Gauntlet R1, L5-01) · Els fills .sdp-admin-taxonomia__* viatgen en un full diferit:
   cada etiqueta que en porta una classe l'adopta abans de pintar amb este ref estable (clau literal per a la
   Porta Vocabulari i el tractor de fulls diferits). */
const adoptaEstilsAdminTaxonomia = (node) => { if (node) adoptaFullDiferit(node, 'admin-taxonomia', cssAdminTaxonomia); };

const ETIQUETA_ESTAT = ETIQUETES_ESTAT_REVISIO_WP;
/* Gauntlet v1.2.13 · lazyRoute i la barrera del tros accessori: si el tros no carrega, el banc continua. */
const PanellIncidenciesPublicacioCas = lazyRoute(() => import('../../../components/universal/workspace/PanellIncidenciesPublicacioCas.jsx'));

const DESTINACIONS = Object.freeze([
  { valor: 'mur', etiqueta: 'Mur' },
  { valor: 'arbres-monumentals', etiqueta: 'Workspace d’Arbres' },
  { valor: 'herbari', etiqueta: 'Herbari' },
  { valor: 'receptes', etiqueta: 'Receptes' },
  { valor: 'pagina', etiqueta: 'Pàgina' }
]);

export function BancImportacioEditorial() {
  const sessio = useSessioOpcional();
  /* Les marques honestes de la targeta parlen la llengua de la interfície; sense UIProvider
     (proves del banc) `t` és undefined i el helper torna al valencià de sempre. */
  const ui = useUIActionsOpcional();
  const t = ui?.t;
  const potPublicar = Boolean(sessio?.currentUser?.id && sessio?.estat === 'dins');
  const publicacio = useProjeccionsCataleg({ enabled: potPublicar });
  const [versio, setVersio] = useState(0);
  const [cerca, setCerca] = useState('');
  const [filtreEstat, setFiltreEstat] = useState('tots');
  const [filtreCasUs, setFiltreCasUs] = useState('tots');
  const [pagina, setPagina] = useState(1);
  const [articleSeleccionatId, setArticleSeleccionatId] = useState(null);
  const [notaEdicio, setNotaEdicio] = useState('');
  const [revisant, setRevisant] = useState(false);
  const [conflicteRevisio, setConflicteRevisio] = useState(null);
  const [avisRevisio, setAvisRevisio] = useState('');
  const [resultatXml, setResultatXml] = useState(null);
  const [errorXml, setErrorXml] = useState('');
  const [confirmacioPublica, setConfirmacioPublica] = useState(false);
  const [publicant, setPublicant] = useState(false);
  const [missatgeDestinacio, setMissatgeDestinacio] = useState('');
  const seleccioViva = useRef(null);
  const revisioEnVol = useRef(false);
  const muntat = useRef(true);
  const baseEdicio = useRef(null);
  const lecturaXml = useRef(0);
  const inspectorRef = useRef(null);
  const titolInspectorRef = useRef(null);
  const llistaCapRef = useRef(null);
  const saltPendentRef = useRef(false);
  useEffect(() => { muntat.current = true; return () => { muntat.current = false; seleccioViva.current = null; lecturaXml.current += 1; saltPendentRef.current = false; }; }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const articles = useMemo(() => lligArticlesImportatsAmbRevisio(), [versio]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => estadistiquesRevisioImportacio(), [versio]);

  /* IDEA-125 · El Banc escolta el mateix registre que la fitxa de revisió del Bloc de notes
     (revisioImportacioWpStore.js): un canvi fet allà, o en una altra pestanya, es veu ací. */
  useEffect(() => subscriu(() => { if (muntat.current) setVersio((v) => v + 1); }), []);

  useEffect(() => {
    let viu = true;
    sincronitzaRevisionsEditorialsWpAmbServidor().then((res) => {
      if (viu && res?.sincronitzat) notificaRevisio();
    });
    return () => {
      viu = false;
    };
  }, []);

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
  seleccioViva.current = seleccionat ? `${seleccionat.wp_id}:${seleccionat.destinacio_workspace}` : null;

  const canviaEstatArticle = async (wpId, estat, nota = undefined, actualitzatEsperat = undefined) => {
    if (revisioEnVol.current) return;
    revisioEnVol.current = true;
    const clauPendent = seleccioViva.current;
    const item = articles.find((a) => a.wp_id === wpId);
    setRevisant(true); setAvisRevisio('');
    const token = actualitzatEsperat === undefined && baseEdicio.current?.id === wpId
      ? baseEdicio.current.token : actualitzatEsperat;
    const resultat = await desaRevisio(wpId, {
      estat, nota: nota ?? item?.nota_revisio ?? '',
      autoria: item?.author || undefined,
      desti: item?.destinacio_workspace || item?.verticalProposada || undefined
    }, { actualitzatEsperat: token });
    revisioEnVol.current = false;
    if (muntat.current) setRevisant(false);
    if (muntat.current && seleccioViva.current === clauPendent) {
      setVersio(v => v + 1);
      if (resultat.conflicte) {
        setConflicteRevisio({ wpId, estat, nota: nota ?? item?.nota_revisio ?? '', llegida: false });
        setAvisRevisio('Una altra revisió ha canviat al servidor. La teua nota continua desada en este navegador.');
      } else {
        setConflicteRevisio(null);
        if (resultat.remot) baseEdicio.current = { id: wpId, token: resultat.fila?.actualitzatA };
        setAvisRevisio(resultat.remot ? 'Revisió confirmada pel servidor.' : 'Revisió desada només en este navegador.');
      }
    }
  };

  const revisaConflicte = async () => {
    if (!conflicteRevisio || revisioEnVol.current) return;
    revisioEnVol.current = true;
    const clauPendent = seleccioViva.current;
    const pendent = conflicteRevisio;
    setRevisant(true);
    try {
      const remota = await consultaRevisioEditorialWp(pendent.wpId);
      if (muntat.current && seleccioViva.current === clauPendent) setConflicteRevisio({ ...pendent, llegida: true, remota });
    } catch { if (muntat.current && seleccioViva.current === clauPendent) setAvisRevisio('No s’ha pogut llegir la revisió del servidor. La teua nota es conserva.'); }
    finally { revisioEnVol.current = false; if (muntat.current) setRevisant(false); }
  };

  const esColumnaUnicaMobil = () => (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 960px)').matches
  );

  const saltaAInspector = () => {
    desplacaDinsApp(inspectorRef.current);
    enfocaSenseSalt(titolInspectorRef.current || inspectorRef.current);
  };

  const tornaALaLlista = () => {
    desplacaDinsApp(llistaCapRef.current);
    enfocaSenseSalt(llistaCapRef.current);
  };

  useEffect(() => {
    if (!saltPendentRef.current || !seleccionat) return;
    saltPendentRef.current = false;
    saltaAInspector();
  }, [seleccionat]);

  const seleccionaArticle = (art, { salta = false } = {}) => {
    const deuSaltar = salta || esColumnaUnicaMobil();
    const mateixArticle = seleccionat?.wp_id === art.wp_id;
    baseEdicio.current = { id: art.wp_id, token: llegeixEstatRevisioEditorial().versions?.[String(art.wp_id)] ?? null };
    setArticleSeleccionatId(art.wp_id);
    setConflicteRevisio(null); setAvisRevisio('');
    setNotaEdicio(art.nota_revisio || '');
    setConfirmacioPublica(false);
    setMissatgeDestinacio('');
    if (deuSaltar) {
      if (mateixArticle) {
        saltaAInspector();
      } else {
        saltPendentRef.current = true;
      }
    }
  };

  const canviaDestinacio = (destinacio) => {
    setConfirmacioPublica(false);
    try {
      desaDestinacioArticleImportat(seleccionat.wp_id, destinacio);
      setVersio(v => v + 1);
      setMissatgeDestinacio('Destinació desada en este navegador.');
    } catch (error) { setMissatgeDestinacio(error.message); }
  };

  const publicaReferencia = async () => {
    if (!potPublicar || !publicacio.autoritzat || !confirmacioPublica || publicant || !seleccionat) return;
    const clau = seleccioViva.current;
    setPublicant(true);
    setMissatgeDestinacio('');
    try {
      await publicacio.desa(fontReferenciaArticleImportat(seleccionat), [seleccionat.destinacio_workspace]);
      if (seleccioViva.current === clau) setMissatgeDestinacio('Referència confirmada pel servidor en la destinació triada.');
    } catch (error) {
      if (seleccioViva.current === clau) setMissatgeDestinacio(error?.desatLocal === true
        ? 'Referència desada en la cua local, pendent de confirmació del servidor.'
        : 'No s’ha pogut desar la referència. Revisa la connexió i torna-ho a provar.');
    } finally { if (seleccioViva.current !== null) setPublicant(false); }
  };

  const gestionaFitxerXml = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const lectura = ++lecturaXml.current;
    setResultatXml(null); setErrorXml('');
    if (file.size > LIMIT_BYTES_IMPORTACIO_EDITORIAL) {
      setErrorXml('El fitxer supera el límit de 8 MiB.'); return;
    }
    try {
      const text = await file.text();
      if (lectura !== lecturaXml.current) return;
      const esWxr = text.includes('<wp:post_id>') || text.includes('wordpress.org/export/');
      const items = esWxr ? parsejaWordPressWxrXml(text) : parsejaBloggerAtomXml(text);
      setResultatXml({ nom: file.name, format: esWxr ? 'WordPress WXR (.xml)' : 'Blogger Atom (.xml)', total: items.length });
    } catch (error) {
      if (lectura === lecturaXml.current) setErrorXml(error.message || 'No s’ha pogut llegir el fitxer.');
    }
  };

  return (
    <article className="sdp-admin-importacio" aria-label="Importació i Revisió Editorial de WordPress i Blogger">
      {avisRevisio && <p role="status">{avisRevisio}</p>}
      {conflicteRevisio && <div role="alert">
        <p>Conflicte de revisió de l’article #{conflicteRevisio.wpId}.</p>
        {!conflicteRevisio.llegida ? <Boto disabled={revisant} onClick={revisaConflicte}>Revisa la versió del servidor</Boto> : <>
          <p>Nota del servidor: {conflicteRevisio.remota?.nota || 'Sense nota'}</p>
          <p>La teua nota: {conflicteRevisio.nota}</p>
          <Boto disabled={revisant} onClick={() => canviaEstatArticle(conflicteRevisio.wpId, conflicteRevisio.estat, conflicteRevisio.nota, conflicteRevisio.remota?.actualitzatA ?? null)}>Reintenta amb la nota conservada</Boto>
        </>}
      </div>}
      {Array.isArray(publicacio.incidencies) && publicacio.incidencies.length > 0 ? (
        <BarreraDelTrosAccessori><Suspense fallback={null}>
          <PanellIncidenciesPublicacioCas
            incidencies={publicacio.incidencies}
            onResol={publicacio.resolIncidencia}
            onRefresca={publicacio.refresca}
            idioma={ui?.language}
          />
        </Suspense></BarreraDelTrosAccessori>
      ) : null}
      <header ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__header">
        <div ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__badges">
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

      <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__kpis" aria-label="Resum d'importació i casos d'ús">
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

      <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__panel" aria-label="Importador d'arxius XML WXR i Blogger">
        <div ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__toolbar">
          <div>
            <h3>📂 Ingesta d’arxius d’exportació (WP REST API · WordPress WXR .xml · Blogger Atom .xml)</h3>
            <p className="sdp-muted">
              A més del catàleg de <code>socdepoble.net</code>, pots previsualitzar un fitxer{' '}
              <code>.xml</code> d’exportació de WordPress o Blogger de fins a 8 MiB.
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
            <strong>{resultatXml.total}</strong> entrades transformades per a la previsualització.
          </p>
        )}
        {errorXml && <p role="alert">{errorXml}</p>}
      </section>

      <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__panel" aria-label="Filtres del banc d'importació">
        <div ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__toolbar">
          <Camp etiqueta="Cerca per títol, slug, ID de WordPress, poble o etiqueta">
            <CampText value={cerca} onChange={(e) => { setCerca(e.target.value); setPagina(1); }} />
          </Camp>
          <div ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__selects">
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
          <div>
            {seleccionat && (
              <div
                ref={llistaCapRef}
                tabIndex={-1}
                className="sdp-admin-importacio__barra-proxima"
                data-testid="importacio-barra-proxima"
              >
                <p>
                  {'En revisió: '}
                  <code>{`#${seleccionat.wp_id}`}</code>
                  {' · '}
                  <strong>{seleccionat.title}</strong>
                </p>
                <Boto varietat="secundari" onClick={saltaAInspector}>
                  Anar a la fitxa de revisió ↓
                </Boto>
              </div>
            )}
            {/* IDEA-125 · Ordre del Mestre (261106 16:21) · Cada article és la nostra UniversalCard,
                no una fila de taula: en mòbil la taula de 5 columnes no hi cabia. La graella
                (.sdp-admin-taxonomia__grid) fa una columna a 375 px. Tota la targeta tria l'article;
                les accions ràpides van a la ranura `accio`, germana del vel i damunt seu: el seu clic
                no arriba al botó de la targeta i no canvia la tria. */}
            <ul ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__grid sdp-admin-importacio__llista" aria-label="Articles importats">
              {visibles.map((art) => {
                const badgeEstat = ETIQUETA_ESTAT[art.estat_revisio] || ETIQUETA_ESTAT.pendent_admin;
                const actiu = seleccionat?.wp_id === art.wp_id;
                return (
                  <li key={art.wp_id}>
                    {/* LU02 · La capçalera ix de la font editorial compartida amb les dades de l'article
                        importat: l'autoria (`author`), el poble principal (`poblePrincipal`) i la data
                        d'origen de WordPress (`date`). Si en falta cap, el marcador honest «no indicat»;
                        cap data inventada. La pastilla és un <time> sense clic: el Banc revisa
                        esborranys i no envia al Calendari. */}
                    <UniversalCard
                      {...encapcalamentDeTargeta(art, { location: art.poblePrincipal, t })}
                      onDateTime={false}
                      headingLevel="h4"
                      title={art.title}
                      subtitle={`#${art.wp_id} · ${String(art.date || '').slice(0, 10)}`}
                      body={<>
                        <code>{art.ruta_canonica}</code>{' '}
                        <Insignia to={badgeEstat.to}>{badgeEstat.label}</Insignia>
                      </>}
                      labels={art.casos_us_meta.map((cas) => `${cas.icona} ${cas.titol}`)}
                      actual={actiu}
                      onMainClick={() => seleccionaArticle(art)}
                      hasFooter={false}
                      etiquetesAmbAccio
                      accio={(
                        <div className="sdp-admin-actions-inline">
                          <Link className="sdp-boto sdp-boto--secundari" to={art.ruta_canonica}>
                            👁️ Veure pàgina
                          </Link>
                          <Boto
                            varietat={art.estat_revisio === 'aprovat' ? 'primari' : 'secundari'}
                            disabled={revisant || !!conflicteRevisio} onClick={() => canviaEstatArticle(art.wp_id, 'aprovat')}
                          >
                            Aprovar
                          </Boto>
                          <Boto
                            varietat="fantasma"
                            onClick={() => seleccionaArticle(art, { salta: true })}
                          >
                            Inspeccionar
                          </Boto>
                        </div>
                      )}
                    />
                  </li>
                );
              })}
            </ul>

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
            <aside
              ref={inspectorRef}
              className="sdp-admin-importacio__inspector"
              aria-label="Inspector comparatiu d'article importat"
            >
              <div className="sdp-admin-importacio__inspector-cap">
                <h4
                  ref={titolInspectorRef}
                  tabIndex={-1}
                  className="sdp-admin-importacio__inspector-titol"
                >
                  🔍 Fitxa de Revisió · #{seleccionat.wp_id}
                </h4>
                <Boto
                  varietat="fantasma"
                  className="sdp-admin-importacio__tornar-llista"
                  onClick={tornaALaLlista}
                >
                  ↑ Tornar a la llista d’articles
                </Boto>
              </div>
              <p><strong>{seleccionat.title}</strong></p>
              <div className="sdp-admin-editorial-stack" data-testid="inspector-editorial-importacio">
                <div className="sdp-admin-editorial-bloc">
                  <h5>Autoria i Custòdia</h5>
                  <p>
                    <strong>{seleccionat.author}</strong>
                    {seleccionat.estudi_tecnic ? ` · ${seleccionat.estudi_tecnic}` : ''}
                  </p>
                </div>
                <div className="sdp-admin-editorial-bloc">
                  <Camp etiqueta="Destinació de publicació" ajuda="La referència conserva el WP id i el contingut original del corpus.">
                    <Selector opcions={DESTINACIONS} value={seleccionat.destinacio_workspace}
                      disabled={publicant} onChange={e => canviaDestinacio(e.target.value)} />
                  </Camp>
                  <p><Link to={rutaWorkspaceWp(seleccionat.destinacio_workspace)}>Obri la destinació</Link></p>
                  <p>La tria i la revisió editorial es guarden en este navegador. Publica la referència per a sincronitzar-la amb el poble.</p>
                  <label><input type="checkbox" checked={confirmacioPublica} disabled={publicant || !potPublicar || !publicacio.autoritzat}
                    onChange={e => setConfirmacioPublica(e.target.checked)} /> Accepte publicar el títol, la data i la referència al registre original.</label>
                  <Boto disabled={publicant || !potPublicar || !publicacio.autoritzat || !confirmacioPublica} onClick={publicaReferencia}>
                    {publicant ? 'Publicant la referència…' : 'Publica la referència'}
                  </Boto>
                  {!potPublicar && <p>Entra amb el teu compte per a publicar una referència.</p>}
                  {missatgeDestinacio && <p role="status">{missatgeDestinacio}</p>}
                  {esPaginaTrilogiaIMoliWp(seleccionat.wp_id) && <p><Link to={`/notes?importacioWp=${encodeURIComponent(seleccionat.slug)}`}>Revisa i publica el cos complet al Bloc de notes</Link></p>}
                </div>
                <div className="sdp-admin-editorial-bloc">
                  <h5>Ruta Sóc de Poble</h5>
                  <p><Link to={seleccionat.ruta_canonica}><code>{seleccionat.ruta_canonica}</code></Link></p>
                </div>
                <div className="sdp-admin-editorial-bloc">
                  <h5>URL Original WordPress</h5>
                  <p>
                    <a href={seleccionat.source_url} target="_blank" rel="noopener noreferrer">
                      {seleccionat.source_url} ↗
                    </a>
                  </p>
                </div>
                <div className="sdp-admin-editorial-bloc">
                  <h5>Categoria Temàtica IA</h5>
                  <p><Insignia to="primari">{seleccionat.categoria_tematica}</Insignia></p>
                </div>
                <div className="sdp-admin-editorial-bloc">
                  <h5>Pobles etiquetats ({seleccionat.pobles_etiquetats.length})</h5>
                  <p>{seleccionat.pobles_etiquetats.join(', ') || 'Cap poble específic'}</p>
                </div>
                <div className="sdp-admin-editorial-bloc">
                  <h5>Etiquetes SKOS ({seleccionat.etiquetes_netes.length})</h5>
                  <p>{seleccionat.etiquetes_netes.join(', ') || 'Sense etiquetes'}</p>
                </div>
              </div>

              <div className="sdp-admin-importacio__notes">
                <label htmlFor="nota-revisio-admin">
                  <strong>Anotacions del Mestre per a la transformació Pedra Seca:</strong>
                </label>
                <textarea
                  id="nota-revisio-admin"
                  rows={3}
                  value={notaEdicio}
                  onChange={(e) => {
                    if (baseEdicio.current?.id !== seleccionat.wp_id) baseEdicio.current = { id: seleccionat.wp_id, token: llegeixEstatRevisioEditorial().versions?.[String(seleccionat.wp_id)] ?? null };
                    setNotaEdicio(e.target.value);
                  }}
                  placeholder="Anota què cal polir d'aquest article (ex. revisar galeria, separar en dos articles, millorar subtítol)..."
                />
                <div className="sdp-admin-actions-inline sdp-admin-actions-inline--separat">
                  <Link className="sdp-boto sdp-boto--primari" to={seleccionat.ruta_canonica}>
                    👁️ Veure pàgina completa
                  </Link>
                  <Boto
                    varietat="primari"
                    disabled={revisant || !!conflicteRevisio} onClick={() => canviaEstatArticle(seleccionat.wp_id, 'aprovat', notaEdicio)}
                  >
                    ✅ Aprovar i desar nota
                  </Boto>
                  <Boto
                    varietat="secundari"
                    disabled={revisant || !!conflicteRevisio} onClick={() => canviaEstatArticle(seleccionat.wp_id, 'amb_observacions', notaEdicio)}
                  >
                    📝 Marcar amb observacions
                  </Boto>
                  <Boto
                    varietat="fantasma"
                    disabled={revisant || !!conflicteRevisio} onClick={() => canviaEstatArticle(seleccionat.wp_id, 'pendent_admin', notaEdicio)}
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
