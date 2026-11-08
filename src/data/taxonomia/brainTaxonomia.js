import { CATEGORIES_CANONIQUES_BASE, NOMS_ETIQUETES_CANONIQUES_49, normalitzaValorTaxonomia } from './vocabulariCanonic.js';
import { CATEGORIES_CANONIQUES, IDIOMES_TAXONOMIA, nomEtiquetaCanonica } from './taxonomiaCanonica.js';

/** Classificació de lectura del Brain; no modifica el tesaurus ni els articles. */
const ENTITATS = new Set(['Ajuntament de La Torre', 'Aplec pel Territori', 'Brull Viu', 'Camí de Santiago', "Coordinadora d'Estudis Eòlics del Comtat", 'El Camí', 'El Carreró Centre Cultural i Tecnològic', "El Planet Centre Rural d'Experimentació", 'El Rentonar', 'Rentonar Informa', 'Font Roja', 'Sant Gregori', 'Serra dels Plans']);
const GENRES_EDITORIALS = new Set(['Noticies', 'Opinió', 'Propostes']);
const FORMATS = new Set(['Fotos', 'Vídeos', 'Plànols', 'Llibres', 'Documentació', ...GENRES_EDITORIALS]);
const TIPUS = new Set(['Activitats', 'Projectes', 'Projecte Sóc de Poble', 'Reunions', 'Trobades', 'NGI Fediversity', 'Node 0']);
export const DIMENSIONS_BRAIN = Object.freeze([
  { id: 'totes', nom: 'Totes' }, { id: 'tema', nom: 'Temes' },
  { id: 'entitat', nom: 'Entitats i llocs' }, { id: 'format', nom: 'Formats' },
  { id: 'redundancies', nom: 'Redundàncies' },
]);
export const idEtiquetaBrain = (nom) => `tag:${nom}`;
export const idCategoriaBrain = (id) => `category:${id}`;
const faceta = (nom) => ENTITATS.has(nom) ? 'entitat' : FORMATS.has(nom) ? 'format' : 'tema';
const segmentador = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ca', { granularity: 'grapheme' }) : null;
export const longitudNomBrain = (nom) => segmentador ? [...segmentador.segment(nom)].length : [...nom].length;

export const PROPOSTES_NOMS_BRAIN = Object.freeze({
  'defensa-territori': '⚖️ Defensa del Territori', 'recursos-locals': '🌾 Terra i Rebost',
  'natura-excursions': '🌿 Natura i Patrimoni', 'patrimoni-cultura': '🎭 Cultura i Festa',
  'comunitat-rural': '🤝 Comunitat i Cures', 'tecnologia-lliure': '💻 Tecnologia Lliure',
});
/** Propostes literals del Mestre: no són una categoria nova ni una assignació. */
export const PROPOSTES_MESTRE_BRAIN = Object.freeze(['⚖️ Defensa del Territori', '🌾 Terra i Rebost', '🏛️ Govern i Poble', '🌿 Natura i Patrimoni', '🎭 Cultura i Festa', '🤝 Comunitat i Cures']);
export const EXEMPLE_MESTRE_BRAIN = '🏛️ Política Municipal, Transparència iGestió Pública';
const PARELLES = Object.freeze([
  ['Projectes', 'Projecte Sóc de Poble', 'Un projecte concret no és necessàriament el conjunt de projectes.'],
  ['El Rentonar', 'Rentonar Informa', 'Entitat i publicació poden tindre funcions diferents.'],
  ['Activitats', 'Trobades', 'Compara el tipus general amb un tipus de reunió.'],
  ['Trobades', 'Reunions', 'Les coaparicions ajuden a revisar; no proven equivalència.'],
  ['El Camí', 'Camí de Santiago', 'Són itineraris amb noms propis diferents; evita una fusió automàtica.'],
  ['Desenvolupament Sostenible', 'Gent Sostenible', 'Tema i persones poden expressar dimensions diferents.'],
]);
const text = (value) => typeof value === 'string' ? value.trim() : '';
const labelText = (value) => typeof value === 'string' ? value : text(value?.text || value?.label || value?.name || value?.slug);
const array = (value) => Array.isArray(value) ? value : [];
const urlIdentitat = (value) => {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return '';
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^utm_/i.test(key) || ['fbclid', 'gclid'].includes(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    return `${url.origin}${url.pathname.replace(/\/$/, '')}${url.search}`;
  }
  catch { return ''; }
};

/** Pesos observats: només metadades presents. Els camps *Proposada* no es lligen. */
export function construeixBrainTaxonomia({ historics = [], publicacions = [], skos = [], coberturaViva = {}, abastViu = {}, origenHistoric = 'https://socdepoble.net' } = {}) {
  const nodes = [
    ...Object.entries(CATEGORIES_CANONIQUES_BASE).map(([id, label]) => ({ id: idCategoriaBrain(id), clau: id, label, type: 'category', faceta: 'categoria', font: 'vocabulariCanonic.js' })),
    ...NOMS_ETIQUETES_CANONIQUES_49.map((label) => ({ id: idEtiquetaBrain(label), clau: label, label, type: faceta(label), faceta: faceta(label), subtipus: GENRES_EDITORIALS.has(label) ? 'Gènere editorial' : TIPUS.has(label) ? 'Tipus o sistema' : null, font: 'vocabulariCanonic.js' })),
  ].map((node) => ({ ...node, longitud: longitudNomBrain(node.label), documents: [] }));
  const perId = new Map(nodes.map((node) => [node.id, node]));
  const clauNom = (nom) => nom.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('ca').trim();
  const indexTags = new Map(), indexCategories = new Map();
  const afigAlias = (index, nom, id) => {
    if (!text(nom)) return;
    const clau = clauNom(nom);
    if (!index.has(clau)) index.set(clau, new Set());
    index.get(clau).add(id);
  };
  for (const nom of NOMS_ETIQUETES_CANONIQUES_49) for (const idioma of IDIOMES_TAXONOMIA) afigAlias(indexTags, nomEtiquetaCanonica(nom, idioma), idEtiquetaBrain(nom));
  for (const categoria of CATEGORIES_CANONIQUES) {
    afigAlias(indexCategories, categoria.id, idCategoriaBrain(categoria.id));
    Object.values(categoria.labels).forEach((nom) => afigAlias(indexCategories, nom, idCategoriaBrain(categoria.id)));
  }
  for (const terme of array(skos)) if (perId.has(idEtiquetaBrain(terme?.name))) {
    for (const nom of [terme.slug, ...array(terme.useFor)]) afigAlias(indexTags, nom, idEtiquetaBrain(terme.name));
  }
  const documents = new Map();
  const origenWp = new Map();
  const desconegudes = new Set();
  const ambigues = new Set();
  const conflictes = [];
  let senseIdentitat = 0;
  let abastIncomplet = 0;
  let ordre = 0;
  const resol = (nom, tipus) => {
    if (!text(nom)) return null;
    const index = tipus === 'category' ? indexCategories : indexTags;
    const normalitzat = normalitzaValorTaxonomia(nom, tipus === 'category' ? 'categories' : 'etiquetes');
    const candidats = index.get(clauNom(nom)) || (normalitzat && index.get(clauNom(normalitzat)));
    if (candidats?.size === 1) return [...candidats][0];
    if (candidats?.size > 1) ambigues.add(nom);
    return null;
  };
  const origenDe = (value) => { try { return new URL(value).origin; } catch { return ''; } };

  const incorpora = (item, origen) => {
    if (!item || item.id === undefined || item.id === null || !String(item.id).trim()) { senseIdentitat += 1; return; }
    const referencia = urlIdentitat(origen === 'wordpress' ? item.link : item.source_url || item.sourceUrl || item.original_url || '');
    const wpId = item.wp_id ?? item.wordpress_id ?? item.wp_post_id;
    const origenExtern = origenDe(referencia || item.source_origin || item.wordpress_origin || item.wp_origin || (origen === 'wordpress' ? origenHistoric : ''));
    const backend = text(item.backend_id || item.backendId || abastViu?.backend) || 'context-actiu';
    const tenant = text(item.tenant_id || item.tenantId || abastViu?.tenant) || 'context-actiu';
    if (origen !== 'wordpress' && (!text(item.backend_id || item.backendId || abastViu?.backend) || !text(item.tenant_id || item.tenantId || abastViu?.tenant))) abastIncomplet += 1;
    const identitatNativa = JSON.stringify(origen === 'wordpress' ? ['wordpress', origenExtern, String(item.id)] : ['live', backend, tenant, origen, String(item.id)]);
    const externaPerId = wpId != null && origenExtern ? JSON.stringify(['wordpress', origenExtern, String(wpId)]) : '';
    // Primer es tria la versió de la identitat nativa; després se'n resol l'àlies extern.
    const identitat = identitatNativa;
    const etiquetes = origen === 'wordpress' ? array(item.etiquetesOriginals) : [...array(item.labels), ...array(item.tags), ...array(item.etiquetes)];
    const ids = new Set();
    const assignacions = [];
    const assigna = (nom, tipus) => {
      const id = resol(nom, tipus);
      if (id) { ids.add(id); assignacions.push({ original: nom, canonic: perId.get(id).label, node: id, metode: nom === perId.get(id).label ? 'directe' : 'alias-declarat' }); }
      else if (nom) desconegudes.add(nom);
      return id;
    };
    for (const valor of etiquetes) {
      const nom = labelText(valor);
      if (origen !== 'wordpress' && ['category', 'sdp-badge-category'].includes(valor?.className || valor?.type)) assigna(nom, 'category');
      else {
        const id = resol(nom, 'tag');
        if (id) assigna(nom, 'tag');
        else if (origen !== 'wordpress' && indexCategories.has(clauNom(nom))) assigna(nom, 'category');
        else if (nom) desconegudes.add(nom);
      }
    }
    if (origen !== 'wordpress') {
      const valors = [item.categoria_tematica_id, item.categoria_tematica, item.category_id, item.category_slug, item.category, item.categoria];
      const efectiva = valors.map((valor) => typeof valor === 'object' ? valor?.id || labelText(valor) : text(valor)).find((nom) => nom && resol(nom, 'category'));
      if (efectiva) {
        for (const id of ids) if (perId.get(id).type === 'category') ids.delete(id);
        assigna(efectiva, 'category');
      }
      for (const valor of array(item.categories)) assigna(typeof valor === 'object' ? valor?.id || labelText(valor) : valor, 'category');
    }
    const article = documents.get(identitat) || { id: identitat, observacions: [] };
    const data = Date.parse(item.updated_at || item.updatedAt || item.created_at || item.date || '');
    article.observacions.push({
      identitatFont: identitatNativa, origen, backend, tenant, referencia, externaPerId, ordre: ordre++,
      prioritat: origen === 'wordpress' ? 0 : 1, instant: Number.isFinite(data) ? data : 0,
      versio: Number.isSafeInteger(item.versio ?? item.version) ? item.versio ?? item.version : 0,
      dataOriginal: text(item.updated_at || item.updatedAt || item.created_at || item.date),
      title: text(item.title || item.titol) || String(item.id),
      href: origen === 'wordpress' ? referencia : origen === 'events' ? '/calendari' : `/${origen}/${encodeURIComponent(item.slug || item.id)}`,
      nodes: [...ids].sort(), assignacions: assignacions.filter((valor) => ids.has(valor.node)),
    });
    documents.set(identitat, article);
    if (origen === 'wordpress' && referencia) {
      if (!origenWp.has(referencia)) origenWp.set(referencia, new Set());
      origenWp.get(referencia).add(identitat);
    }
  };
  array(historics).forEach((item) => incorpora(item, 'wordpress'));
  array(publicacions).forEach((item) => incorpora(item, ['mur', 'mercat', 'events'].includes(item?._brainColleccio) ? item._brainColleccio : 'mur'));
  const triaObservacio = (observacions) => [...observacions].sort((a, b) => b.prioritat - a.prioritat || b.instant - a.instant || b.versio - a.versio || b.ordre - a.ordre)[0];
  const natius = [...documents.values()];
  const histories = new Set(natius.filter((article) => article.observacions[0].origen === 'wordpress').map((article) => article.id));
  documents.clear();
  for (const natiu of natius) {
    const efectiva = triaObservacio(natiu.observacions);
    let identitat = natiu.id;
    if (efectiva.origen !== 'wordpress') {
      const candidates = origenWp.get(efectiva.referencia);
      const perUrl = candidates?.size === 1 ? [...candidates][0] : '';
      if (candidates?.size > 1 || (perUrl && efectiva.externaPerId && perUrl !== efectiva.externaPerId)) conflictes.push({ identitat: natiu.id, motiu: 'Referències d’origen incompatibles o ambigües; es conserva el registre separat.' });
      else if (perUrl) identitat = perUrl;
      else if (histories.has(efectiva.externaPerId)) identitat = efectiva.externaPerId;
    }
    const article = documents.get(identitat) || { id: identitat, observacions: [] };
    article.observacions.push(...natiu.observacions);
    documents.set(identitat, article);
  }
  for (const article of documents.values()) {
    const efectiva = triaObservacio(article.observacions);
    Object.assign(article, { title: efectiva.title, href: efectiva.href, nodes: efectiva.nodes, assignacions: efectiva.assignacions, fonts: [...new Set(article.observacions.map((observacio) => observacio.origen))], observacioEfectiva: { identitatFont: efectiva.identitatFont, origen: efectiva.origen, ordre: efectiva.ordre, versio: efectiva.versio, dataOriginal: efectiva.dataOriginal, referencia: efectiva.referencia } });
  }

  const arestes = new Map();
  const parella = (a, b) => [a, b].sort().join('\u0000');
  for (const article of documents.values()) {
    article.nodes.sort();
    for (const id of article.nodes) perId.get(id).documents.push(article.id);
    for (let i = 0; i < article.nodes.length; i += 1) for (let j = i + 1; j < article.nodes.length; j += 1) {
      const source = article.nodes[i], target = article.nodes[j], id = parella(source, target);
      if (!arestes.has(id)) arestes.set(id, { id: `observada:${id}`, source, target, tipus: 'coaparicio', documents: [] });
      arestes.get(id).documents.push(article.id);
    }
  }
  const links = [...arestes.values()].map((link) => ({ ...link, weight: link.documents.length }));
  const jerarquies = new Set();
  for (const terme of array(skos)) {
    if (!terme || typeof terme.name !== 'string') continue;
    const source = idEtiquetaBrain(terme.name), target = idCategoriaBrain(terme.broaderTermId);
    const id = parella(source, target);
    if (perId.has(source) && perId.has(target) && !jerarquies.has(id)) {
      links.push({ id: `skos:${id}`, source, target, tipus: 'skos', documents: [], motiu: 'Jerarquia declarada en el tesaurus SKOS; no és un recompte documental.' });
      jerarquies.add(id);
    }
  }
  const candidatures = PARELLES.map(([a, b, motiu]) => ({ source: idEtiquetaBrain(a), target: idEtiquetaBrain(b), motiu }));
  candidatures.push({ source: idEtiquetaBrain('Patrimoni'), target: idCategoriaBrain('natura-excursions'), motiu: 'Etiqueta i categoria compartixen una paraula; comprova si conserven funcions diferents.' });
  candidatures.forEach((candidate, i) => {
    const observada = arestes.get(parella(candidate.source, candidate.target));
    links.push({ ...candidate, id: `candidatura:${i}`, tipus: 'candidatura', proposta: true, discontinu: true, documents: observada?.documents || [] });
  });
  return {
    nodes, links, documents: [...documents.values()], candidatures,
    cobertura: { historicsRebuts: array(historics).length, vivesRebudes: array(publicacions).length, documentsUnics: documents.size,
      documentsAmbNoms: [...documents.values()].filter((article) => article.nodes.length).length,
      documentsSenseNoms: [...documents.values()].filter((article) => !article.nodes.length).length,
      senseIdentitat, abastIncomplet, conflictes, nomsAmbigus: [...ambigues], nomsNoCanonics: [...desconegudes].sort(),
      politicaVersions: 'Publicació viva abans de WordPress; després data, versió i ordre de la font. Les etiquetes de versions diferents no s’unixen.',
      vivaParcial: coberturaViva?.parcial !== false, estatViu: coberturaViva?.estat || 'desconegut',
    },
  };
}

export function filtraBrainTaxonomia(model, dimensio = 'totes') {
  const candidats = new Set(model.candidatures.flatMap(({ source, target }) => [source, target]));
  const nodes = model.nodes.filter((node) => dimensio === 'totes' || (dimensio === 'redundancies' ? candidats.has(node.id) : node.type === 'category' || node.faceta === dimensio));
  const ids = new Set(nodes.map((node) => node.id));
  return { nodes, links: model.links.filter((link) => ids.has(link.source) && ids.has(link.target)) };
}

/** Projecció en memòria: l'entrada i el vocabulari conserven identitat i bytes. */
export function simulaBrainTaxonomia(model, { noms = {}, fusio = null } = {}) {
  const perId = new Map(model.nodes.map((node) => [node.id, node]));
  const valida = fusio && fusio.origen !== fusio.desti && perId.get(fusio.origen)?.type !== 'category'
    && perId.get(fusio.desti)?.type !== 'category' && perId.has(fusio.origen) && perId.has(fusio.desti);
  return model.documents.map((article) => {
    const ids = [...new Set(article.nodes.map((id) => valida && id === fusio.origen ? fusio.desti : id))];
    return { ...article, nodes: ids, labels: ids.map((id) => ({ text: text(noms[id]) || perId.get(id).label, className: perId.get(id).type === 'category' ? 'sdp-badge-category' : 'sdp-badge-tag' })) };
  });
}

/** Una projecció efectiva comuna per al recompte, la Card i les col·lisions. */
export function projectaBrainTaxonomia(model, opcions = {}) {
  const documents = simulaBrainTaxonomia(model, opcions);
  const perId = new Map(model.nodes.map((node) => [node.id, node]));
  const afectats = documents.filter((article, i) => JSON.stringify(article.nodes.map((id, n) => [id, article.labels[n].text])) !== JSON.stringify(model.documents[i].nodes.map((id) => [id, perId.get(id).label]))).map((article) => article.id);
  const conceptes = simulaBrainTaxonomia({ ...model, documents: [{ nodes: model.nodes.map((node) => node.id) }] }, opcions)[0];
  const noms = new Map();
  conceptes.nodes.forEach((id, i) => {
    const nom = conceptes.labels[i].text.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('ca');
    if (!noms.has(nom)) noms.set(nom, []);
    noms.get(nom).push(id);
  });
  const collisions = [...noms.entries()].filter(([, ids]) => ids.length > 1).map(([nom, ids]) => ({ nom, ids }));
  return { documents, afectats, collisions };
}
