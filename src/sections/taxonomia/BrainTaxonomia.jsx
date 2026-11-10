import { lazy, Suspense, useId, useMemo, useState } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { Boto, Camp, CampText, Selector } from '../../components/PedraSeca/index.js';
import { useMur } from '../mur/MurContext.jsx';
import { ARTICLES_SIMULADOR_IA_425, FACETA_4_ETIQUETES_SKOS } from '../../data/taxonomia/tesaurusDoctoralSocDePoble.js';
import { construeixBrainTaxonomia, DIMENSIONS_BRAIN, EXEMPLE_MESTRE_BRAIN, filtraBrainTaxonomia, longitudNomBrain, PROPOSTES_MESTRE_BRAIN, PROPOSTES_NOMS_BRAIN, projectaBrainTaxonomia } from '../../data/taxonomia/brainTaxonomia.js';
import { PrevisualitzacioCardTaxonomia } from './PrevisualitzacioCardTaxonomia.jsx';

const BrainGraph = lazy(() => import('../../components/universal/graph/BrainGraph.jsx'));
const ESTIL = Object.freeze({
  radis: { category: 16, tema: 7, entitat: 8, format: 6 },
  colors: { category: 'var(--sdp-accio)', tema: 'var(--sdp-exit)', entitat: 'var(--sdp-accent)', format: 'var(--sdp-text-suau)', proposta: 'var(--sdp-accent)' },
  noms: { category: 'Categoria', tema: 'Tema', entitat: 'Entitat o lloc', format: 'Format' },
  etiquetaAmbZoom: { category: 0.3, tema: 1, entitat: 1, format: 1 },
});
const FONT_NOMS = { wordpress: 'WordPress històric', mur: 'Mur carregat', mercat: 'Mercat carregat', events: 'Calendari carregat' };
const neta = (valor) => valor.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('ca');
const nomRelacio = (link) => link.tipus === 'coaparicio' ? `${link.weight} documents compartits` : link.tipus === 'skos' ? 'Jerarquia SKOS declarada' : 'Candidatura editorial';

function ArticleFont({ article }) {
  const efectiva = article.observacioEfectiva;
  return <li>{article.href?.startsWith('/') ? <Link to={article.href}>{article.title}</Link> : /^https?:\/\//.test(article.href || '') ? <a href={article.href} target="_blank" rel="noopener noreferrer">{article.title}</a> : article.title}
    <p><small>Prova efectiva: {FONT_NOMS[efectiva.origen] || efectiva.origen} · {efectiva.dataOriginal || 'data no indicada'}{efectiva.versio > 0 ? ` · versió ${efectiva.versio}` : ''}.</small></p>
    <details><summary>Observacions de la font ({article.observacions.length})</summary><ul>{article.observacions.map((observacio) => <li key={observacio.ordre}>{FONT_NOMS[observacio.origen] || observacio.origen} · {observacio.dataOriginal || 'data no indicada'} · {observacio.ordre === efectiva.ordre ? 'efectiva per al recompte' : 'anterior o alternativa, no suma pes'}{observacio.versio > 0 ? ` · versió ${observacio.versio}` : ''}<p>Identitat de la font: <code>{observacio.identitatFont}</code>{observacio.referencia && <> · Referència: {observacio.referencia}</>}</p></li>)}</ul></details>
  </li>;
}

/** Una vista de lectura i simulació compartida; cap capacitat d'escriptura. */
export function BrainTaxonomiaVista({ model, paginacio = [] }) {
  const id = useId();
  const [dimensio, setDimensio] = useState('totes');
  const [consulta, setConsulta] = useState('');
  const [seleccio, setSeleccio] = useState('');
  const [vista, setVista] = useState('brain');
  const [noms, setNoms] = useState({});
  const [fusio, setFusio] = useState(null);
  const [origen, setOrigen] = useState('tag:Projecte Sóc de Poble');
  const [desti, setDesti] = useState('tag:Projectes');
  const [limitArticles, setLimitArticles] = useState(10);
  const [relacio, setRelacio] = useState('');
  const graf = useMemo(() => filtraBrainTaxonomia(model, dimensio), [model, dimensio]);
  const perId = useMemo(() => new Map(model.nodes.map((node) => [node.id, node])), [model]);
  const seleccionat = perId.get(seleccio);
  const connexions = model.links.filter((link) => link.source === seleccio || link.target === seleccio).sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const docs = model.documents.filter((article) => seleccionat?.documents.includes(article.id));
  const connexioTriada = connexions.find((link) => link.id === relacio);
  const proves = connexioTriada ? model.documents.filter((article) => connexioTriada.documents.includes(article.id)) : docs;
  const projeccio = useMemo(() => projectaBrainTaxonomia(model, { noms, fusio }), [model, noms, fusio]);
  const tria = (nodeId) => { setSeleccio(nodeId); setLimitArticles(10); setRelacio(''); };
  const opcions = graf.nodes.filter((node) => neta(node.label).includes(neta(consulta)));
  const etiquetes = model.nodes.filter((node) => node.type !== 'category');
  const afecta = (article) => projeccio.afectats.includes(article.id);
  const afectats = projeccio.afectats.length;
  const fontMostra = (fusio ? model.documents.find(afecta) : model.documents.find((article) => seleccionat && article.nodes.includes(seleccio))) || (!seleccionat ? model.documents.find(afecta) : null);
  const baseMostra = fontMostra || { id: 'mostra-composicio', title: 'Mostra del laboratori', nodes: (seleccio ? [seleccio] : fusio ? [fusio.origen, fusio.desti] : [model.nodes[0]?.id]).filter(Boolean) };
  const modelMostra = { ...model, documents: [baseMostra] };
  const mostraAbans = projectaBrainTaxonomia(modelMostra).documents[0];
  const mostra = projectaBrainTaxonomia(modelMostra, { noms, fusio }).documents[0];
  const aliases = [...new Set(docs.flatMap((article) => article.assignacions.filter((valor) => valor.node === seleccio && valor.metode === 'alias-declarat').map((valor) => `${valor.original} → ${valor.canonic}`)))];
  return <section className="sdp-taxonomia-brain" aria-label="Segon Brain de categories i etiquetes">
    <h3>El Brain de categories i etiquetes</h3>
    <p>{model.nodes.filter((node) => node.type === 'category').length} categories i {etiquetes.length} etiquetes canòniques. Cada connexió explica d’on ix; les propostes encara no són decisions.</p>
    <section aria-label="Procedència i cobertura del Brain">
      <p>{model.cobertura.historicsRebuts} files històriques · {model.cobertura.vivesRebudes} publicacions vives carregades · {model.cobertura.documentsUnics} documents únics observats.</p>
      {model.cobertura.estatViu === 'loading' && <p>La font viva encara s’està carregant.</p>}
      {model.cobertura.estatViu === 'error' && <p role="alert">No s’ha pogut llegir la font viva; els històrics es mantenen separats d’aquesta lectura fallida.</p>}
      <p>{model.cobertura.documentsAmbNoms} amb noms canònics · {model.cobertura.documentsSenseNoms} sense metadades canòniques reconegudes. {model.cobertura.vivaParcial ? 'La lectura viva és parcial.' : 'S’ha esgotat la paginació del context carregat.'} És una observació d’aquest context, no un cens de producció.</p>
      <p>Els històrics aporten les etiquetes originals amb àlies declarats. Les categories proposades per IA no compten com a categories efectives. {model.cobertura.politicaVersions}</p>
      {model.cobertura.abastIncomplet > 0 && <p>{model.cobertura.abastIncomplet} files vives sense identificador complet de backend/tenant: es mantenen dins del context actiu.</p>}
      {model.cobertura.senseIdentitat > 0 && <p>{model.cobertura.senseIdentitat} registres sense identitat s’han exclòs dels recomptes.</p>}
      {model.cobertura.conflictes.length > 0 && <details><summary>Conflictes d’identitat ({model.cobertura.conflictes.length})</summary><ul>{model.cobertura.conflictes.map((conflicte, i) => <li key={i}>{conflicte.motiu}</li>)}</ul></details>}
      {model.cobertura.nomsAmbigus.length > 0 && <details><summary>Noms amb assignació ambigua ({model.cobertura.nomsAmbigus.length})</summary><p>{model.cobertura.nomsAmbigus.join(' · ')}. No s’han assignat a cap concepte.</p></details>}
      {model.cobertura.nomsNoCanonics.length > 0 && <details><summary>Noms fora del vocabulari ({model.cobertura.nomsNoCanonics.length})</summary><p>{model.cobertura.nomsNoCanonics.join(' · ')}</p></details>}
      {paginacio.map((font) => <div className="sdp-taxonomia__accions" key={font.id}>{font.error && <p role="alert">No s’ha pogut continuar la lectura de {font.nom}.</p>}{font.mes && <Boto varietat="secundari" disabled={font.carregant} onClick={font.carrega}>{font.carregant ? 'Llegint…' : `Carrega més: ${font.nom}`}</Boto>}</div>)}
    </section>
    <nav className="sdp-taxonomia__accions" aria-label="Vistes del Brain">
      <Boto varietat={vista === 'brain' ? 'primari' : 'secundari'} aria-pressed={vista === 'brain'} onClick={() => setVista('brain')}>Brain semàntic</Boto>
      <Boto varietat={vista === 'laboratori' ? 'primari' : 'secundari'} aria-pressed={vista === 'laboratori'} onClick={() => setVista('laboratori')}>Laboratori de decisions</Boto>
    </nav>
    {vista === 'brain' ? <>
      <nav className="sdp-taxonomia__accions" aria-label="Dimensions del Brain">{DIMENSIONS_BRAIN.map((dim) => <Boto key={dim.id} varietat={dimensio === dim.id ? 'primari' : 'secundari'} aria-pressed={dimensio === dim.id} onClick={() => { setDimensio(dim.id); tria(''); }}>{dim.nom}</Boto>)}</nav>
      <Camp etiqueta="Cerca un concepte"><CampText tipus="search" value={consulta} onChange={(event) => setConsulta(event.target.value)}/></Camp>
      <Camp etiqueta="Inspecciona un node"><Selector value={seleccio} opcions={[{ valor: '', etiqueta: 'Tria un concepte…' }, ...opcions.map((node) => ({ valor: node.id, etiqueta: node.label }))]} onChange={(event) => tria(event.target.value)}/></Camp>
      <p className="sdp-taxonomia__llegenda"><span>Traç continu: coaparició observada; el gruix representa documents.</span><span>Traç puntuat: jerarquia SKOS declarada, sense pes documental.</span><span className="sdp-taxonomia__candidatura">Taronja discontinu: candidatura, no equivalència.</span></p>
      <div className="sdp-taxonomia__xarxa"><div className="sdp-taxonomia__graf"><Suspense fallback={<p>Obrint el graf…</p>}><BrainGraph graf={graf} estil={ESTIL} seleccio={seleccio} onSeleccio={tria} inspector={false} enquadra vinclesPonderats/></Suspense></div>
        <section className="sdp-taxonomia__inspector" aria-label="Fitxa MIT del node">
          {seleccionat ? <><h4>{seleccionat.label}</h4><p>{seleccionat.documents.length} documents observats · {seleccionat.longitud} caràcters{seleccionat.longitud > 20 ? ' · nom llarg per revisar' : ''}.</p><p>Identitat canònica: <code>{seleccionat.clau}</code>. {seleccionat.subtipus || ESTIL.noms[seleccionat.type]}.</p>
            {seleccionat.type === 'category' && <p>La categoria té identitat pròpia encara que no tinga assignacions efectives en els documents observats. La jerarquia SKOS no li atribuïx articles.</p>}
            {aliases.length > 0 && <p>Àlies amb traça: {aliases.join(' · ')}</p>}
            <details open><summary>Per què es connecta? ({connexions.length})</summary><ul>{connexions.map((link) => <li key={link.id}><button type="button" className="sdp-taxonomia__enllac" onClick={() => tria(link.source === seleccio ? link.target : link.source)}>{perId.get(link.source === seleccio ? link.target : link.source)?.label}</button> · {nomRelacio(link)}{link.motiu && <p>{link.motiu}</p>}<button type="button" className="sdp-taxonomia__enllac" onClick={() => { setRelacio(link.id); setLimitArticles(10); }}>Veure proves de la connexió</button></li>)}</ul></details>
            <details open><summary>{connexioTriada ? 'Documents de la connexió' : 'Documents del node'} ({proves.length})</summary>{connexioTriada && <p>{nomRelacio(connexioTriada)}. {connexioTriada.motiu}</p>}{proves.length ? <><ul>{proves.slice(0, limitArticles).map((article) => <ArticleFont key={article.id} article={article}/>)}</ul>{proves.length > limitArticles && <Boto varietat="secundari" onClick={() => setLimitArticles((valor) => valor + 10)}>Mostra més documents</Boto>}</> : <p>No hi ha assignacions documentals observades per a aquesta selecció.</p>}</details>
            <Boto varietat="secundari" onClick={() => setVista('laboratori')}>Prova un altre nom</Boto>
          </> : <p>Tria un node amb el selector o al graf. Ací veuràs el motiu de les connexions i els articles que les sostenen.</p>}
        </section>
      </div>
    </> : <section aria-labelledby={`${id}-laboratori`}>
      <h4 id={`${id}-laboratori`}>Provar abans de decidir</h4><p>Simulació en memòria: cap nom ni classificació es publica. Una coaparició no prova que dos conceptes siguen sinònims.</p>
      <details><summary>Dissonàncies entre identificador i nom visible</summary><div className="sdp-admin-editorial-stack" data-testid="dissonancies-editorial-stack">
        <div className="sdp-admin-editorial-bloc"><h5><code>natura-excursions</code></h5><p>{perId.get('category:natura-excursions').label}: el nom inclou Patrimoni i l’identificador conserva Excursions.</p></div>
        <div className="sdp-admin-editorial-bloc"><h5><code>patrimoni-cultura</code></h5><p>{perId.get('category:patrimoni-cultura').label}: l’identificador inclou Patrimoni i el nom actual no.</p></div>
      </div><p>Són identitats heretades diferents. Provar un nom no canvia cap identificador ni reclassifica articles.</p></details>
      <Camp etiqueta="Concepte per a escurçar"><Selector value={seleccio} opcions={[{ valor: '', etiqueta: 'Tria un concepte…' }, ...model.nodes.map((node) => ({ valor: node.id, etiqueta: node.label }))]} onChange={(event) => tria(event.target.value)}/></Camp>
      <section aria-label="Sis noms proposats pel Mestre"><h5>Propostes del Mestre</h5><p>Tria primer un concepte. Cada botó prova un nom sobre eixa identitat; no crea cap categoria ni reclassifica articles.</p><div className="sdp-taxonomia__accions">{PROPOSTES_MESTRE_BRAIN.map((nom) => <Boto key={nom} varietat="secundari" disabled={!seleccionat} onClick={() => setNoms((valors) => ({ ...valors, [seleccio]: nom }))}>Prova el nom: {nom}</Boto>)}</div><p>L’exemple proporcionat «{EXEMPLE_MESTRE_BRAIN}» té {longitudNomBrain(EXEMPLE_MESTRE_BRAIN)} caràcters i no és una de les sis categories d’aquest vocabulari. Les propostes es conserven separades dels noms canònics.</p></section>
      <details><summary>Exemples demanats i vocabulari disponible</summary><p>Podcast, Documental i Govern no són etiquetes canòniques d’aquesta instantània. Ajuntament de La Torre és la identitat concreta disponible; La Torre és també un lloc, i Associacionisme és el concepte canònic relacionat amb l’exemple genèric «Associació». Aquests exemples no afegixen etiquetes ni assignacions als documents.</p></details>
      {seleccionat && <><Camp etiqueta="Nom de prova"><CampText value={noms[seleccio] ?? seleccionat.label} maxLength={120} onChange={(event) => setNoms((valors) => ({ ...valors, [seleccio]: event.target.value }))}/></Camp>{PROPOSTES_NOMS_BRAIN[seleccionat.clau] && <Boto varietat="secundari" onClick={() => setNoms((valors) => ({ ...valors, [seleccio]: PROPOSTES_NOMS_BRAIN[seleccionat.clau] }))}>Prova: {PROPOSTES_NOMS_BRAIN[seleccionat.clau]}</Boto>}</>}
      <details><summary>Simula una fusió d’etiquetes</summary>
        <Camp etiqueta="Etiqueta d’origen"><Selector value={origen} opcions={etiquetes.map((node) => ({ valor: node.id, etiqueta: node.label }))} onChange={(event) => setOrigen(event.target.value)}/></Camp>
        <Camp etiqueta="Etiqueta de destinació"><Selector value={desti} opcions={etiquetes.map((node) => ({ valor: node.id, etiqueta: node.label }))} onChange={(event) => setDesti(event.target.value)}/></Camp>
        <Boto varietat="secundari" disabled={origen === desti} onClick={() => setFusio({ origen, desti })}>Simula la fusió</Boto>
      </details>
      <details><summary>Candidatures a comparar ({model.candidatures.length})</summary><ul>{model.candidatures.map((candidate) => <li key={`${candidate.source}:${candidate.target}`}><strong>{perId.get(candidate.source)?.label} ↔ {perId.get(candidate.target)?.label}</strong><p>{candidate.motiu}</p>{perId.get(candidate.target)?.type !== 'category' && <Boto varietat="secundari" onClick={() => { setFusio({ origen: candidate.source, desti: candidate.target }); tria(candidate.source); }}>Prova aquesta fusió</Boto>}</li>)}</ul></details>
      <p role="status">{afectats} documents observats afectats per la simulació.{!fontMostra && ' La targeta és una mostra de composició, no una assignació observada.'}</p>
      {projeccio.collisions.length > 0 && <section aria-label="Col·lisions de noms de prova"><h5>Noms iguals, identitats diferents</h5><p>Una coincidència de nom no fusiona conceptes. Revisa les identitats abans de decidir.</p><ul>{projeccio.collisions.map((collision) => <li key={collision.nom}>{collision.nom}: {collision.ids.map((nodeId) => <span key={nodeId}><code>{nodeId}</code> ({perId.get(nodeId).label}) </span>)}</li>)}</ul></section>}
      <div className="sdp-taxonomia__accions"><Boto varietat="secundari" onClick={() => { setNoms({}); setFusio(null); }}>Descarta la simulació</Boto></div>
      <section aria-label="Lectura accessible de la simulació"><h5>Comparació dels noms, sense reducció</h5><p>{mostra.title}</p>{[['Abans', mostraAbans], ['Després', mostra]].map(([etapa, article]) => <section key={etapa} aria-label={`Noms: ${etapa}`}><h6>{etapa}</h6><ul>{article.labels.map((label, index) => <li key={index}>{label.className === 'sdp-badge-category' ? 'Categoria' : 'Etiqueta'}: {label.text}</li>)}</ul></section>)}</section>
      <p>Les targetes mantenen un viewport intern real de 375 o 1440 píxels. La representació exterior es reduïx per a cabre; la comparació escrita de dalt conserva la mida de lectura.</p>
      {[375, 1440].map((amplaria) => <div key={amplaria}><PrevisualitzacioCardTaxonomia amplaria={amplaria} etapa="Abans" article={mostraAbans}/><PrevisualitzacioCardTaxonomia amplaria={amplaria} etapa="Després" article={mostra}/></div>)}
    </section>}
  </section>;
}

export default function BrainTaxonomia() {
  const font = useMur();
  const publicacions = useMemo(() => [
    ...(font.sortedFeedPosts || []).map((item) => ({ ...item, _brainColleccio: 'mur' })),
    ...(font.sortedMarketItems || []).map((item) => ({ ...item, _brainColleccio: 'mercat' })),
    ...(font.sortedEvents || []).map((item) => ({ ...item, _brainColleccio: 'events' })),
  ], [font.sortedFeedPosts, font.sortedMarketItems, font.sortedEvents]);
  const parcial = font.status !== 'ready' || ['mur', 'mercat', 'events'].some((seccio) => font.hiHaMes?.(seccio));
  const model = useMemo(() => construeixBrainTaxonomia({ historics: ARTICLES_SIMULADOR_IA_425, publicacions, skos: FACETA_4_ETIQUETES_SKOS, coberturaViva: { parcial, estat: font.status } }), [publicacions, parcial, font.status]);
  const paginacio = ['mur', 'mercat', 'events'].map((seccio) => ({ id: seccio, nom: FONT_NOMS[seccio], mes: font.hiHaMes?.(seccio), carregant: font.carregantMes?.(seccio), error: font.errorMes?.(seccio), carrega: () => font.carregaMes?.(seccio) }));
  return <BrainTaxonomiaVista model={model} paginacio={paginacio}/>;
}
