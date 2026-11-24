/* Motor determinista Zero-IA, estat unificat dels 4 modes, importador/exportador universal
 * i generador de propostes ciutadanes CC BY-SA 4.0 per a «Cada Cosa al Seu Lloc» (IDEA-348 · R32.86).
 */
import { getVal, setVal, delVal } from '../../config/storage.js';

export const CLAU_STORAGE_JOC_BASE = 'joc_cada_cosa_v1';
const MAX_INPUT_CHARS = 1_500_000;
const MAX_IMPORTED_ITEMS = 1500;

export const TRONCS_MONS_2 = Object.freeze([
  Object.freeze({
    id: 'natura-i-patrimoni',
    emoji: '🌿',
    labels: Object.freeze({
      ca: '🌿 Natura i Patrimoni',
      es: '🌿 Naturaleza y Patrimonio',
      en: '🌿 Nature and Heritage',
      eu: '🌿 Natura eta Ondarea',
      gl: '🌿 Natureza e Patrimonio',
    }),
  }),
  Object.freeze({
    id: 'tecnologia',
    emoji: '💻',
    labels: Object.freeze({
      ca: '💻 Tecnologia',
      es: '💻 Tecnología',
      en: '💻 Technology',
      eu: '💻 Teknologia',
      gl: '💻 Tecnoloxía',
    }),
  }),
]);

export const CONCEPTES_INICIALS = Object.freeze([
  // 7 Categories inicials (5 sota Natura i Patrimoni + 2 sota Tecnologia)
  Object.freeze({
    id: 'defensa-territori',
    label: '⚖️ Defensa del Territori i Ecologia',
    rol: 'categoria',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: null,
    x: 14,
    y: 22,
    keywords: ['mosaic', 'incendi', 'eolic', 'fotovoltaic', 'biogas', 'radar', 'replantac', 'territori', 'ecolog', 'tala', 'especulac', 'sostenibl', 'abocador', 'defensa'],
  }),
  Object.freeze({
    id: 'natura-patrimoni',
    label: '🥾 Natura, Muntanya i Patrimoni Viu',
    rol: 'categoria',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: null,
    x: 38,
    y: 20,
    keywords: ['excursi', 'ruta', 'cim', 'serra', 'pou', 'neu', 'arbre', 'carrasca', 'font', 'pedra', 'herbari', 'castell', 'caset', 'muntanya', 'patrimoni', 'cami'],
  }),
  Object.freeze({
    id: 'terra-recursos',
    label: '🌾 Terra, Agricultura i Recursos Locals',
    rol: 'categoria',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: null,
    x: 16,
    y: 54,
    keywords: ['llavor', 'oli', 'oliver', 'moli', 'blat', 'vinya', 'bancal', 'agric', 'hort', 'mercat', 'fireta', 'fira', 'pergola', 'bioconstruc', 'tomaca', 'terra'],
  }),
  Object.freeze({
    id: 'comunitat-rural',
    label: '🤝 Comunitat i Món Rural',
    rol: 'categoria',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: null,
    x: 40,
    y: 54,
    keywords: ['aplec', 'trobada', 'reunio', 'associac', 'vein', 'escola', 'despobl', 'ajuntament', 'poble', 'convivenc', 'jove', 'assemblea', 'comunitat'],
  }),
  Object.freeze({
    id: 'cultura-llengua',
    label: '🎭 Cultura, Llengua i Gastronomia',
    rol: 'categoria',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: null,
    x: 28,
    y: 80,
    keywords: ['llengua', 'jazz', 'musica', 'concert', 'festa', 'recept', 'cuina', 'llibre', 'poesia', 'memoria', 'cultura', 'documental', 'cinema'],
  }),
  Object.freeze({
    id: 'tecnologia-xarxes',
    label: '🌐 Eines Digitals i Xarxes Lliures',
    rol: 'categoria',
    troncId: 'tecnologia',
    parentCategoryId: null,
    x: 74,
    y: 28,
    keywords: ['fedivers', 'web', 'digital', 'internet', 'xarxa', 'programari', 'lliure', 'rss', 'wordpress', 'blogger', 'connectivitat', 'dades', 'mapa', 'portal', 'tic'],
  }),
  Object.freeze({
    id: 'tecnologia-ia-disseny',
    label: '🧠 Node 0, Disseny i Autonomia Tecnològica',
    rol: 'categoria',
    troncId: 'tecnologia',
    parentCategoryId: null,
    x: 76,
    y: 64,
    keywords: ['node', 'iaia', 'accessibilitat', 'disseny', 'interficie', 'algoritm', 'servidor', 'autonomia', 'privacitat', 'wcag', 'taxonomia'],
  }),
  // Etiquetes vives que es poden promoure a Categoria amb 1 sol clic!
  Object.freeze({
    id: 'tag-mosaic-mediterrani',
    label: 'Mosaic Mediterrani',
    rol: 'etiqueta',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: 'defensa-territori',
    x: 8,
    y: 38,
    keywords: ['mosaic', 'bancal', 'previndre', 'maser'],
  }),
  Object.freeze({
    id: 'tag-incendis',
    label: 'Incendis',
    rol: 'etiqueta',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: 'defensa-territori',
    x: 24,
    y: 38,
    keywords: ['incendi', 'foc', 'cremat', 'replantac'],
  }),
  Object.freeze({
    id: 'tag-rutes',
    label: 'Rutes',
    rol: 'etiqueta',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: 'natura-patrimoni',
    x: 50,
    y: 36,
    keywords: ['ruta', 'excursi', 'sender', 'cami'],
  }),
  Object.freeze({
    id: 'tag-arbres-monumentals',
    label: 'Arbres Monumentals',
    rol: 'etiqueta',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: 'natura-patrimoni',
    x: 54,
    y: 18,
    keywords: ['arbre', 'carrasca', 'pi', 'xiprer', 'monumental', 'olivera'],
  }),
  Object.freeze({
    id: 'tag-llavors-i-oli',
    label: 'Llavors i Oli',
    rol: 'etiqueta',
    troncId: 'natura-i-patrimoni',
    parentCategoryId: 'terra-recursos',
    x: 10,
    y: 72,
    keywords: ['llavor', 'oli', 'oliver', 'moli', 'varietat'],
  }),
  Object.freeze({
    id: 'tag-fedivers',
    label: 'Fedivers i RSS',
    rol: 'etiqueta',
    troncId: 'tecnologia',
    parentCategoryId: 'tecnologia-xarxes',
    x: 84,
    y: 46,
    keywords: ['fedivers', 'rss', 'mastodon', 'protocol', 'federat'],
  }),
  Object.freeze({
    id: 'tag-pedra-seca',
    label: 'Pedra Seca',
    rol: 'etiqueta',
    troncId: 'tecnologia',
    parentCategoryId: 'tecnologia-ia-disseny',
    x: 84,
    y: 80,
    keywords: ['pedra seca', 'marge', 'caset', 'accessibilitat', 'contrast'],
  }),
]);

// Llavor instantània perquè el Píxel 0 tinga cartes reals amb foto des del mil·lisegon 0
export const LLAVOR_RAPIDA_JOC = Object.freeze([
  Object.freeze({
    id: 'rt-5440607702336839465',
    title: "Stop Biogàs a l'Estat espanyol",
    date: '2026-09-30',
    image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiDryiSrDiAvmYl2HDTjsw9oOxhdoLHdxBG4KAdeE-LMTXemndzYlpG3RdVbcuVaNe0AA4h-arKrswHsMnE6a4gJbM7nEsoz_U_X-B8Jps07C-jhy-OoePBjrtL75o5HdNy0j0PoSFlF2uL9B4XI1uM8lqnzzYpUIoxzVJCQSrpAMvgJW7Lrqu_jie-ly09/w640-h360-p-k-no-nu/WhatsApp%20Image%202026-09-22%20at%2022.45.49.jpeg',
    excerpt: "Trobada estatal d'entitats veïnals davant l'allau de macroplantes industrials de biometà en sòl agrari.",
    poble: 'El Comtat',
    sourceUrl: 'https://rentonar.blogspot.com/2026/09/stop-biogas-lestat-espanyol.html',
    isTwin: false,
    sources: [Object.freeze({ label: 'El Rentonar', url: 'https://rentonar.blogspot.com/2026/09/stop-biogas-lestat-espanyol.html' })],
    suggestedTroncId: 'natura-i-patrimoni',
    suggestedCategoryId: 'defensa-territori',
    initialTray: 'revisar',
    tags: ['Biogàs', 'Macroplantes Fotovoltaiques'],
  }),
  Object.freeze({
    id: 'dual-17176-2293632175285365968',
    title: 'El mosaic mediterrani: pagar als maseros per conrear els bancals i previndre incendis',
    date: '2024-08-06',
    image: 'https://blogger.googleusercontent.com/img/a/AVvXsEg3w8MbOBIhIx-qHhlKjHK6lwiSLcNVa_jIE7Vodzt01B4YqL4ejWPA9NfG2m-zp_KX_WdSMOaoY8l59eqNpZ09pkfDxXfIek7KNrRb66Fv4l0JixGlhuyZxAb-6-7pNE2h9tvyuC8fu9rh-8aGjfy3edSqZSmDxRu12PXes4I3twY2BViuC83SMKNI4g=w640-h360-p-k-no-nu',
    excerpt: 'Proposta viva de custòdia agrària i gestió forestal mosaicada publicada simultàniament als dos portals.',
    poble: 'La Torre de les Maçanes',
    sourceUrl: 'https://rentonar.blogspot.com/2024/08/el-mosaic-mediterrani-la-proposta-de.html',
    isTwin: true,
    sources: [
      Object.freeze({ label: 'El Rentonar', url: 'https://rentonar.blogspot.com/2024/08/el-mosaic-mediterrani-la-proposta-de.html' }),
      Object.freeze({ label: 'socdepoble.net', url: 'https://socdepoble.net/2024/08/07/el-mosaic-mediterrani/' }),
    ],
    suggestedTroncId: 'natura-i-patrimoni',
    suggestedCategoryId: 'defensa-territori',
    initialTray: 'revisar',
    tags: ['Mosaic Mediterrani', 'Incendis'],
  }),
  Object.freeze({
    id: 'rt-4550125026557873875',
    title: 'El Pou de la neu del Rentonar',
    date: '2020-04-17',
    image: '/assets/uploads/brain/ibanez_design_system_1780246898431.webp',
    excerpt: "Arquitectura tradicional del gel i camins de ferradura a les muntanyes d'Alacant.",
    poble: 'La Torre de les Maçanes',
    sourceUrl: 'https://rentonar.blogspot.com/2020/04/el-pou-de-la-neu-del-rentonar.html',
    isTwin: false,
    sources: [Object.freeze({ label: 'El Rentonar', url: 'https://rentonar.blogspot.com/2020/04/el-pou-de-la-neu-del-rentonar.html' })],
    suggestedTroncId: 'natura-i-patrimoni',
    suggestedCategoryId: 'natura-patrimoni',
    initialTray: 'revisar',
    tags: ['Patrimoni', 'Rutes', 'Pedra Seca'],
  }),
  Object.freeze({
    id: 'wp-3669',
    title: 'Projecte Sóc de Poble: Portal de Pobles Connectats en Xarxa Lliure',
    date: '2014-05-12',
    image: '/assets/uploads/brain/ibanez_design_system_1780246898431.webp',
    excerpt: 'Eines digitals obertes per compartir coneixement entre comunitats rurals sense monopolis.',
    poble: 'Xarxa de Pobles',
    sourceUrl: 'https://socdepoble.net/projecte-soc-de-poble/',
    isTwin: false,
    sources: [Object.freeze({ label: 'socdepoble.net', url: 'https://socdepoble.net/projecte-soc-de-poble/' })],
    suggestedTroncId: 'tecnologia',
    suggestedCategoryId: 'tecnologia-xarxes',
    initialTray: 'revisar',
    tags: ['Projecte Sóc de Poble', 'Fedivers i RSS'],
  }),
]);

export function pujaMiniaturaBloggerAS640(url) {
  if (!url || typeof url !== 'string') return '';
  const neta = url.trim();
  if (!/^https?:\/\//i.test(neta)) return '';
  if (/\/s72[^/]*\//.test(neta)) {
    return neta.replace(/\/s72[^/]*\//, '/w640-h360-p-k-no-nu/');
  }
  if (/=s72[^&?#]*$/.test(neta)) {
    return neta.replace(/=s72[^&?#]*$/, '=w640-h360-p-k-no-nu');
  }
  return neta;
}

export function urlSeguraExterna(url) {
  if (!url || typeof url !== 'string') return '';
  const neta = url.trim();
  if (neta.startsWith('/assets/')) return neta;
  try {
    const parsed = new URL(neta);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {
    return '';
  }
  return '';
}

export function plegaText(valor) {
  return String(valor || '')
    .slice(0, 2000)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/l[·•]l/gi, 'll')
    .toLowerCase()
    .trim();
}

function tokenitza(valor) {
  return plegaText(valor)
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length >= 3);
}

const POBLES_CONEGUTS = [
  'La Torre de les Maçanes',
  'Alcoi',
  'Benifallim',
  'Xixona',
  'Relleu',
  'Penàguila',
  'Benilloba',
  'Cocentaina',
  'Muro',
  'Ibi',
  'Tibi',
  'Castalla',
  'Banyeres',
  'Agres',
  'Sella',
];

export function detectaPobleDeterminista(text = '') {
  const plegat = plegaText(text);
  for (const p of POBLES_CONEGUTS) {
    if (plegat.includes(plegaText(p))) return p;
  }
  return 'Xarxa de Pobles';
}

/** Classificador local 100% determinista (BM25 lleuger + k-NN de les cartes ja classificades per l'usuari) */
export function classificaTextDeterminista(item, conceptes = CONCEPTES_INICIALS, itemsClassificats = []) {
  const categories = conceptes.filter((c) => c.rol === 'categoria');
  if (categories.length === 0) {
    return { troncId: 'natura-i-patrimoni', categoryId: 'revisar', tags: [] };
  }

  const textComplet = `${item.title || ''} ${(item.tags || []).join(' ')} ${item.excerpt || ''} ${item.pathHint || ''}`;
  const plegat = plegaText(textComplet);
  const tokens = tokenitza(textComplet);

  // Memòria de vocabulari k-NN de sessió (el que la persona ja ha classificat suma pes!)
  const memoriaTokensPerCat = new Map();
  for (const prev of itemsClassificats.slice(0, 300)) {
    if (!prev.categoryId || prev.categoryId === 'revisar') continue;
    let mapa = memoriaTokensPerCat.get(prev.categoryId);
    if (!mapa) {
      mapa = new Map();
      memoriaTokensPerCat.set(prev.categoryId, mapa);
    }
    for (const tk of tokenitza(prev.title)) {
      mapa.set(tk, (mapa.get(tk) || 0) + 1);
    }
  }

  let millorCat = categories[0];
  let millorPunts = -1;

  for (const cat of categories) {
    let punts = 0;
    const kwList = [...(cat.keywords || []), ...tokenitza(cat.label)];
    for (const kw of kwList) {
      const kwPlegat = plegaText(kw);
      if (kwPlegat && plegat.includes(kwPlegat)) punts += 4;
    }
    const mapaVeins = memoriaTokensPerCat.get(cat.id);
    if (mapaVeins) {
      for (const tk of tokens) {
        if (mapaVeins.has(tk)) punts += Math.min(3, mapaVeins.get(tk) * 0.8);
      }
    }
    if (punts > millorPunts) {
      millorPunts = punts;
      millorCat = cat;
    }
  }

  const etiquetesDetectades = [];
  for (const et of conceptes.filter((c) => c.rol === 'etiqueta')) {
    const etKws = [...(et.keywords || []), plegaText(et.label)];
    if (etKws.some((k) => k && plegat.includes(plegaText(k)))) {
      etiquetesDetectades.push(et.label);
    }
  }

  return {
    troncId: millorCat.troncId,
    categoryId: millorPunts > 0 ? millorCat.id : categories[0].id,
    tags: [...new Set([...(item.tags || []), ...etiquetesDetectades])].slice(0, 5),
  };
}

function clauStoragePerUsuari(userId) {
  const sufix = userId ? `_${String(userId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36)}` : '';
  return `${CLAU_STORAGE_JOC_BASE}${sufix}`;
}

export function creaEstatInicialJoc(corpus = LLAVOR_RAPIDA_JOC, userId = null) {
  const desat = getVal(clauStoragePerUsuari(userId), null);
  const modePropiBuit = Boolean(desat?.modePropiBuit);
  const conceptes = Array.isArray(desat?.conceptes) && desat.conceptes.length > 0
    ? desat.conceptes
    : CONCEPTES_INICIALS.map((c) => ({ ...c }));

  const categoriesIds = new Set(conceptes.filter((c) => c.rol === 'categoria').map((c) => c.id));
  const assignacionsDesades = desat?.assignacions && typeof desat.assignacions === 'object' ? desat.assignacions : {};
  const posicionsCartes = desat?.posicionsCartes && typeof desat.posicionsCartes === 'object' ? desat.posicionsCartes : {};
  const tagsDesats = desat?.tagsCartes && typeof desat.tagsCartes === 'object' ? desat.tagsCartes : {};
  const importatsDesats = Array.isArray(desat?.itemsImportats) ? desat.itemsImportats : [];

  const baseItems = modePropiBuit
    ? []
    : corpus.map((it, idx) => {
        const assignada = assignacionsDesades[it.id];
        const safata = assignada && (assignada === 'revisar' || categoriesIds.has(assignada))
          ? assignada
          : (it.initialTray && (it.initialTray === 'revisar' || categoriesIds.has(it.initialTray)) ? it.initialTray : 'revisar');
        const pos = posicionsCartes[it.id] || {
          x: 12 + ((idx * 17) % 76),
          y: 18 + ((idx * 23) % 66),
        };
        return {
          ...it,
          categoryId: safata,
          tags: Array.isArray(tagsDesats[it.id]) ? tagsDesats[it.id] : [...(it.tags || [])],
          x: pos.x,
          y: pos.y,
          isImported: false,
        };
      });

  const idsBase = new Set(baseItems.map((x) => x.id));
  const extraImportats = importatsDesats
    .filter((it) => it && it.id && !idsBase.has(it.id))
    .map((it) => ({
      ...it,
      categoryId: it.categoryId === 'revisar' || categoriesIds.has(it.categoryId) ? it.categoryId : 'revisar',
      isImported: true,
    }));

  return {
    conceptes,
    items: [...extraImportats, ...baseItems],
    undoStack: [],
    modePropiBuit,
    corpusCompletCarregat: corpus.length > LLAVOR_RAPIDA_JOC.length,
    darrerDesatIso: desat?.darrerDesatIso || null,
  };
}

/** Hidrata les 600 obres completes sense perdre cap moviment que l'usuari ja haja fet al Píxel 0 */
export function hidrataCorpusCompletEnEstat(estatActual, corpus600) {
  if (estatActual.modePropiBuit) {
    return { ...estatActual, corpusCompletCarregat: true };
  }
  const categoriesIds = new Set(estatActual.conceptes.filter((c) => c.rol === 'categoria').map((c) => c.id));
  const actualPerId = new Map(estatActual.items.map((it) => [it.id, it]));
  const importats = estatActual.items.filter((it) => it.isImported);

  const fusionats = corpus600.map((it, idx) => {
    const existent = actualPerId.get(it.id);
    if (existent) {
      return {
        ...it,
        categoryId: existent.categoryId === 'revisar' || categoriesIds.has(existent.categoryId)
          ? existent.categoryId
          : it.suggestedCategoryId,
        tags: existent.tags || it.tags || [],
        x: existent.x,
        y: existent.y,
        isImported: false,
      };
    }
    const safataInicial = it.initialTray === 'revisar'
      ? 'revisar'
      : (categoriesIds.has(it.suggestedCategoryId) ? it.suggestedCategoryId : 'revisar');
    return {
      ...it,
      categoryId: safataInicial,
      tags: [...(it.tags || [])],
      x: 12 + ((idx * 17) % 76),
      y: 18 + ((idx * 23) % 66),
      isImported: false,
    };
  });

  return {
    ...estatActual,
    items: [...importats, ...fusionats],
    corpusCompletCarregat: true,
  };
}

/** Buida l'exemple d'El Rentonar + Sóc de Poble perquè la persona enxufe només la seua web o els seus títols */
export function buidaExempleSocDePoble(estat) {
  const nextUndo = empilaUndo(estat);
  return {
    ...estat,
    modePropiBuit: true,
    items: estat.items.filter((it) => it.isImported),
    undoStack: nextUndo,
  };
}

/** Restaura l'exemple públic de Sóc de Poble + El Rentonar conservant el que l'usuari haja importat */
export function restauraExempleSocDePoble(estat, corpusComplet = LLAVOR_RAPIDA_JOC) {
  const nextUndo = empilaUndo(estat);
  const rehidratat = hidrataCorpusCompletEnEstat(
    { ...estat, modePropiBuit: false, undoStack: nextUndo },
    corpusComplet
  );
  return { ...rehidratat, modePropiBuit: false };
}

/** Persisteix el delta compacte de la partida utilitzant la capa canònica src/config/storage.js */
export function desaEstatJoc(estat, userId = null) {
  const assignacions = {};
  const posicionsCartes = {};
  const tagsCartes = {};

  for (const it of estat.items) {
    if (!it.isImported) {
      const safataDefecte = it.initialTray || it.suggestedCategoryId;
      if (it.categoryId !== safataDefecte) {
        assignacions[it.id] = it.categoryId;
      }
      if (it.tags && it.tags.length > 0) {
        tagsCartes[it.id] = it.tags.slice(0, 6);
      }
      if (it.posModificada) {
        posicionsCartes[it.id] = { x: Math.round(it.x), y: Math.round(it.y) };
      }
    }
  }

  const payload = {
    schema: 'sdp.cada-cosa-al-seu-lloc.v1',
    darrerDesatIso: new Date().toISOString(),
    modePropiBuit: Boolean(estat.modePropiBuit),
    conceptes: estat.conceptes,
    assignacions,
    tagsCartes,
    posicionsCartes,
    itemsImportats: estat.items.filter((it) => it.isImported).slice(0, 300),
  };

  setVal(clauStoragePerUsuari(userId), payload);
  return payload.darrerDesatIso;
}

export function reiniciaEstatJoc(corpus, userId = null) {
  delVal(clauStoragePerUsuari(userId));
  return creaEstatInicialJoc(corpus, userId);
}

function empilaUndo(estat) {
  const instantania = {
    conceptes: estat.conceptes.map((c) => ({ ...c })),
    items: estat.items.map((it) => ({ ...it, tags: [...(it.tags || [])] })),
  };
  return [instantania, ...(estat.undoStack || [])].slice(0, 25);
}

export function desfesUltimaAccio(estat) {
  if (!estat.undoStack || estat.undoStack.length === 0) return estat;
  const [anterior, ...resta] = estat.undoStack;
  return {
    ...estat,
    conceptes: anterior.conceptes,
    items: anterior.items,
    undoStack: resta,
  };
}

export function assignarCartaACategoria(estat, itemId, categoryId) {
  const nextUndo = empilaUndo(estat);
  const nextItems = estat.items.map((it) => (it.id === itemId ? { ...it, categoryId } : it));
  return { ...estat, items: nextItems, undoStack: nextUndo };
}

/** Mutació reversible d'1 clic Categoria <-> Etiqueta sota els 2 Grans Mons sense perdre cap carta */
export function mutarRolConcepte(estat, concepteId, troncOverride = null) {
  const concepte = estat.conceptes.find((c) => c.id === concepteId);
  if (!concepte) return estat;

  const troncDesti = troncOverride || concepte.troncId;

  if (concepte.rol === 'etiqueta') {
    // Promou Etiqueta -> Categoria!
    const nextUndo = empilaUndo(estat);
    const nomNet = plegaText(concepte.label);
    const nextConceptes = estat.conceptes.map((c) =>
      c.id === concepteId
        ? { ...c, rol: 'categoria', troncId: troncDesti, parentCategoryId: null }
        : c
    );
    // Les cartes que portaven aquesta etiqueta en 'revisar' (o amb l'etiqueta explícita) poden passar o mantindre's:
    // Movem les cartes que porten exactament aquesta etiqueta cap a la nova categoria acabada de crear!
    const nextItems = estat.items.map((it) => {
      const teEtiqueta = (it.tags || []).some((t) => plegaText(t) === nomNet);
      if (teEtiqueta) {
        return { ...it, categoryId: concepte.id };
      }
      return it;
    });
    return { ...estat, conceptes: nextConceptes, items: nextItems, undoStack: nextUndo };
  }

  // Degrada Categoria -> Etiqueta (sempre hi ha d'quedar almenys 1 categoria viva per no deixar orfes)
  const altresCategories = estat.conceptes.filter((c) => c.rol === 'categoria' && c.id !== concepteId);
  if (altresCategories.length === 0) return estat;

  const mareDesti =
    altresCategories.find((c) => c.troncId === troncDesti) || altresCategories[0];

  const nextUndo = empilaUndo(estat);
  const etiquetaNeta = concepte.label.replace(/^[^\p{L}\p{N}]+/u, '').trim() || concepte.label;

  const nextConceptes = estat.conceptes.map((c) => {
    if (c.id === concepteId) {
      return {
        ...c,
        rol: 'etiqueta',
        troncId: mareDesti.troncId,
        parentCategoryId: mareDesti.id,
      };
    }
    if (c.parentCategoryId === concepteId) {
      return { ...c, parentCategoryId: mareDesti.id };
    }
    return c;
  });

  const nextItems = estat.items.map((it) => {
    if (it.categoryId === concepteId) {
      const nousTags = it.tags?.includes(etiquetaNeta)
        ? it.tags
        : [...(it.tags || []), etiquetaNeta];
      return {
        ...it,
        categoryId: mareDesti.id,
        tags: nousTags,
      };
    }
    return it;
  });

  return { ...estat, conceptes: nextConceptes, items: nextItems, undoStack: nextUndo };
}

export function canviaTroncConcepte(estat, concepteId, nouTroncId) {
  const nextUndo = empilaUndo(estat);
  const nextConceptes = estat.conceptes.map((c) =>
    c.id === concepteId ? { ...c, troncId: nouTroncId } : c
  );
  return { ...estat, conceptes: nextConceptes, undoStack: nextUndo };
}

export function crearConcepteNou(estat, { label, troncId = 'natura-i-patrimoni', rol = 'categoria', parentCategoryId = null }) {
  const net = String(label || '').trim().slice(0, 64);
  if (!net) return estat;
  const slug = plegaText(net).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'concepte';
  const idBase = `usr-${slug}`;
  let id = idBase;
  let n = 2;
  const existents = new Set(estat.conceptes.map((c) => c.id));
  while (existents.has(id)) {
    id = `${idBase}-${n}`;
    n += 1;
  }
  const categoriesMateixTronc = estat.conceptes.filter((c) => c.rol === 'categoria' && c.troncId === troncId);
  const mare = rol === 'etiqueta'
    ? (parentCategoryId || categoriesMateixTronc[0]?.id || null)
    : null;

  const nextUndo = empilaUndo(estat);
  const nou = {
    id,
    label: net,
    rol,
    troncId,
    parentCategoryId: mare,
    x: troncId === 'tecnologia' ? 72 + ((estat.conceptes.length * 7) % 20) : 18 + ((estat.conceptes.length * 11) % 34),
    y: 24 + ((estat.conceptes.length * 13) % 58),
    keywords: tokenitza(net),
  };

  return {
    ...estat,
    conceptes: [...estat.conceptes, nou],
    undoStack: nextUndo,
  };
}

export function moureConcepte2D(estat, concepteId, x, y) {
  const nx = Math.max(4, Math.min(94, Math.round(x * 10) / 10));
  const ny = Math.max(8, Math.min(90, Math.round(y * 10) / 10));
  return {
    ...estat,
    conceptes: estat.conceptes.map((c) => (c.id === concepteId ? { ...c, x: nx, y: ny } : c)),
  };
}

export function moureCarta2D(estat, itemId, x, y) {
  const nx = Math.max(4, Math.min(94, Math.round(x * 10) / 10));
  const ny = Math.max(8, Math.min(90, Math.round(y * 10) / 10));
  return {
    ...estat,
    items: estat.items.map((it) =>
      it.id === itemId ? { ...it, x: nx, y: ny, posModificada: true } : it
    ),
  };
}

export function traureManetaPerJugar(estat, quantitat = 7) {
  const candidats = estat.items.filter((it) => it.categoryId !== 'revisar');
  if (candidats.length === 0) return estat;
  // Prioritza cartes amb foto real perquè siga un gust jugar!
  const ambFoto = candidats.filter((it) => Boolean(it.image));
  const font = ambFoto.length >= quantitat ? ambFoto : candidats;
  const escollits = new Set(font.slice(0, quantitat).map((it) => it.id));
  const nextUndo = empilaUndo(estat);
  return {
    ...estat,
    items: estat.items.map((it) => (escollits.has(it.id) ? { ...it, categoryId: 'revisar' } : it)),
    undoStack: nextUndo,
  };
}

export function aplicarSuggerimentsPendents(estat) {
  const categoriesIds = new Set(estat.conceptes.filter((c) => c.rol === 'categoria').map((c) => c.id));
  const fallbackCat = estat.conceptes.find((c) => c.rol === 'categoria')?.id || 'defensa-territori';
  const classificats = estat.items.filter((it) => it.categoryId !== 'revisar');
  const nextUndo = empilaUndo(estat);

  const nextItems = estat.items.map((it) => {
    if (it.categoryId !== 'revisar') return it;
    if (it.suggestedCategoryId && categoriesIds.has(it.suggestedCategoryId)) {
      return { ...it, categoryId: it.suggestedCategoryId };
    }
    const pred = classificaTextDeterminista(it, estat.conceptes, classificats);
    return {
      ...it,
      categoryId: categoriesIds.has(pred.categoryId) ? pred.categoryId : fallbackCat,
      tags: pred.tags,
    };
  });

  return { ...estat, items: nextItems, undoStack: nextUndo };
}

function extrauPrimeraImatgeHtml(html = '') {
  if (!html || typeof html !== 'string') return '';
  const match = html.slice(0, 20000).match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? urlSeguraExterna(pujaMiniaturaBloggerAS640(match[1])) : '';
}

function parsejaXmlWpORss(xmlText) {
  if (typeof DOMParser === 'undefined') return [];
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (doc.querySelector('parsererror')) return [];

  // Mapa d'attachments per a WordPress WXR (_thumbnail_id -> attachment_url)
  const attachments = new Map();
  const itemsXml = Array.from(doc.querySelectorAll('item, entry')).slice(0, MAX_IMPORTED_ITEMS);

  for (const node of itemsXml) {
    const postType = node.getElementsByTagName('wp:post_type')[0]?.textContent?.trim();
    const postId = node.getElementsByTagName('wp:post_id')[0]?.textContent?.trim();
    const attUrl = node.getElementsByTagName('wp:attachment_url')[0]?.textContent?.trim();
    if (postType === 'attachment' && postId && attUrl) {
      attachments.set(postId, urlSeguraExterna(attUrl));
    }
  }

  const resultat = [];
  for (const node of itemsXml) {
    const postType = node.getElementsByTagName('wp:post_type')[0]?.textContent?.trim();
    if (postType === 'attachment' || postType === 'nav_menu_item') continue;

    const title = node.querySelector('title')?.textContent?.trim() || '';
    if (!title) continue;

    const linkNode = node.querySelector('link');
    const link = urlSeguraExterna(
      linkNode?.getAttribute('href') || linkNode?.textContent?.trim() || ''
    );
    const pubDate =
      node.querySelector('pubDate, published, updated')?.textContent?.trim() || '';

    const cats = Array.from(node.querySelectorAll('category'))
      .map((c) => c.getAttribute('term') || c.textContent || '')
      .map((s) => s.trim())
      .filter(Boolean);

    // 1. WXR Yoast / RankMath SEO image o _thumbnail_id
    let seoImage = '';
    const metas = Array.from(node.getElementsByTagName('wp:postmeta'));
    let thumbId = '';
    for (const meta of metas) {
      const k = meta.getElementsByTagName('wp:meta_key')[0]?.textContent?.trim();
      const v = meta.getElementsByTagName('wp:meta_value')[0]?.textContent?.trim();
      if (k === '_thumbnail_id' && v) thumbId = v;
      if ((k === '_yoast_wpseo_opengraph-image' || k === 'rank_math_facebook_image') && v) {
        seoImage = urlSeguraExterna(v);
      }
    }
    if (!seoImage && thumbId && attachments.has(thumbId)) {
      seoImage = attachments.get(thumbId);
    }

    // 2. RSS media:thumbnail / media:content / enclosure
    if (!seoImage) {
      const mediaThumb =
        node.getElementsByTagName('media:thumbnail')[0]?.getAttribute('url') ||
        node.getElementsByTagName('media:content')[0]?.getAttribute('url') ||
        node.querySelector('enclosure[type^="image"]')?.getAttribute('url') ||
        '';
      seoImage = urlSeguraExterna(pujaMiniaturaBloggerAS640(mediaThumb));
    }

    // 3. Fallback a la primera imatge del contingut
    const contentEncoded =
      node.getElementsByTagName('content:encoded')[0]?.textContent ||
      node.querySelector('content, description, summary')?.textContent ||
      '';
    if (!seoImage && contentEncoded) {
      seoImage = extrauPrimeraImatgeHtml(contentEncoded);
    }

    const plainExcerpt = contentEncoded
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);

    resultat.push({
      title,
      date: pubDate ? pubDate.slice(0, 16) : '',
      image: seoImage,
      excerpt: plainExcerpt,
      sourceUrl: link,
      tags: cats.slice(0, 5),
    });
  }
  return resultat;
}

function parsejaJsonUniversal(parsed) {
  // Cas A: Instantània completa pròpia de Cada Cosa al Seu Lloc
  if (parsed && parsed.schema === 'sdp.cada-cosa-al-seu-lloc.v1') {
    return { tipus: 'instantania_propia', snapshot: parsed };
  }

  // Cas B: Blogger Feed JSON (feed.entry)
  if (parsed?.feed?.entry && Array.isArray(parsed.feed.entry)) {
    const items = parsed.feed.entry.slice(0, MAX_IMPORTED_ITEMS).map((entry) => {
      const title = entry.title?.$t?.trim() || '';
      const altLink = (entry.link || []).find((l) => l.rel === 'alternate')?.href || '';
      const thumb = pujaMiniaturaBloggerAS640(entry.media$thumbnail?.url || '');
      const cats = (entry.category || []).map((c) => c.term).filter(Boolean);
      const summary = (entry.summary?.$t || entry.content?.$t || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
      return {
        title,
        date: (entry.published?.$t || '').slice(0, 10),
        image: urlSeguraExterna(thumb),
        excerpt: summary,
        sourceUrl: urlSeguraExterna(altLink),
        tags: cats.slice(0, 5),
      };
    }).filter((x) => x.title);
    return { tipus: 'llista_items', formatDetectat: 'blogger_json', items };
  }

  // Cas C: Array JSON (WordPress REST API wp/v2/posts o exportació genèrica)
  const llista = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.posts)
      ? parsed.posts
      : Array.isArray(parsed?.items)
        ? parsed.items
        : null;

  if (llista) {
    const items = llista.slice(0, MAX_IMPORTED_ITEMS).map((raw) => {
      const title =
        (typeof raw.title === 'string' ? raw.title : raw.title?.rendered) ||
        raw.name ||
        '';
      const seoImg =
        raw.yoast_head_json?.og_image?.[0]?.url ||
        raw.jetpack_featured_media_url ||
        raw._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
        raw.heroImage ||
        raw.image ||
        raw.thumbnail ||
        extrauPrimeraImatgeHtml(raw.content?.rendered || '');
      const excerptRaw =
        (typeof raw.excerpt === 'string' ? raw.excerpt : raw.excerpt?.rendered) ||
        raw.summary ||
        '';
      return {
        title: String(title || '').replace(/<[^>]+>/g, '').trim(),
        date: String(raw.date || raw.published || '').slice(0, 10),
        image: urlSeguraExterna(pujaMiniaturaBloggerAS640(seoImg)),
        excerpt: String(excerptRaw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180),
        sourceUrl: urlSeguraExterna(raw.link || raw.url || raw.sourceUrl || ''),
        tags: Array.isArray(raw.tags) ? raw.tags.map(String).slice(0, 5) : [],
      };
    }).filter((x) => x.title);
    return { tipus: 'llista_items', formatDetectat: 'json_estructurat', items };
  }

  return { tipus: 'llista_items', formatDetectat: 'desconegut', items: [] };
}

function parsejaLiniesCarpetaRevisar(text) {
  const linies = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2)
    .slice(0, MAX_IMPORTED_ITEMS);

  return linies.map((linia) => {
    // Suporta Markdown "- [Títol](https://...)" o fitxers de carpeta "Recursos/ document_final.pdf"
    const mdMatch = linia.match(/^[-*•\d.)\s]*\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
    if (mdMatch) {
      return {
        title: mdMatch[1].trim(),
        date: '',
        image: '',
        excerpt: '',
        sourceUrl: urlSeguraExterna(mdMatch[2]),
        tags: [],
      };
    }

    const neta = linia.replace(/^[-*•│├└─\s]+/, '').trim();
    const extMatch = neta.match(/\.(pdf|docx?|xlsx?|pptx?|mp4|mp3|png|jpe?g|webp|md|txt)$/i);
    const formatTag = extMatch ? extMatch[1].toUpperCase() : '';
    const senseExt = extMatch ? neta.slice(0, -extMatch[0].length) : neta;
    const partsCarpeta = senseExt.split(/[\\/]/).filter(Boolean);
    const nomFitxer = (partsCarpeta.at(-1) || senseExt).replace(/[_-]+/g, ' ').trim();
    const carpeta = partsCarpeta.length > 1 ? partsCarpeta.slice(0, -1).join(' / ') : '';

    return {
      title: nomFitxer || neta,
      date: '',
      image: '',
      excerpt: carpeta ? `Carpeta d'origen: ${carpeta}` : '',
      pathHint: carpeta,
      sourceUrl: '',
      tags: formatTag ? [formatTag] : [],
    };
  }).filter((x) => x.title.length >= 2);
}

/** Importa qualsevol entrada de l'usuari (Carpeta "Revisar", WordPress JSON/XML, RSS o instantània) */
export function importaContingutUniversal(estat, rawInput, { autoClassifica = false } = {}) {
  const retallat = String(rawInput || '').slice(0, MAX_INPUT_CHARS).trim();
  if (!retallat) return { estat, importats: 0, formatDetectat: 'buit' };

  if (retallat.startsWith('{') || retallat.startsWith('[')) {
    try {
      const parsed = JSON.parse(retallat);
      const resJson = parsejaJsonUniversal(parsed);
      if (resJson.tipus === 'instantania_propia') {
        const snap = resJson.snapshot;
        const conceptes = Array.isArray(snap.conceptes) && snap.conceptes.length
          ? snap.conceptes
          : estat.conceptes;
        const assignacions = snap.assignacions || {};
        const tagsCartes = snap.tagsCartes || {};
        const baseActualitzats = estat.items
          .filter((it) => !it.isImported)
          .map((it) => ({
            ...it,
            categoryId: assignacions[it.id] || it.categoryId,
            tags: tagsCartes[it.id] || it.tags,
          }));
        const importatsSnap = Array.isArray(snap.itemsImportats) ? snap.itemsImportats : [];
        return {
          estat: {
            ...estat,
            conceptes,
            items: [...importatsSnap, ...baseActualitzats],
            undoStack: empilaUndo(estat),
          },
          importats: importatsSnap.length + Object.keys(assignacions).length,
          formatDetectat: 'instantania_propia',
        };
      }
      return incorporaItemsImportats(estat, resJson.items, resJson.formatDetectat, autoClassifica);
    } catch {
      // Si no és JSON vàlid, continua a XML o línies
    }
  }

  if (retallat.startsWith('<') && /<(rss|feed|channel|item|entry|wp:)/i.test(retallat.slice(0, 4000))) {
    const xmlItems = parsejaXmlWpORss(retallat);
    if (xmlItems.length > 0) {
      return incorporaItemsImportats(estat, xmlItems, 'xml_wp_rss', autoClassifica);
    }
  }

  const liniaItems = parsejaLiniesCarpetaRevisar(retallat);
  return incorporaItemsImportats(estat, liniaItems, 'carpeta_revisar', autoClassifica);
}

function incorporaItemsImportats(estat, llistaCrua, formatDetectat, autoClassifica) {
  if (!llistaCrua || llistaCrua.length === 0) {
    return { estat, importats: 0, formatDetectat };
  }

  const titolsExistents = new Map();
  for (const ex of estat.items) {
    titolsExistents.set(plegaText(ex.title), ex);
  }

  const classificats = estat.items.filter((it) => it.categoryId !== 'revisar');
  const nousItems = llistaCrua.map((it, idx) => {
    const pred = classificaTextDeterminista(it, estat.conceptes, classificats);
    const bessoExistent = titolsExistents.get(plegaText(it.title));
    const poble = detectaPobleDeterminista(`${it.title} ${it.tags?.join(' ') || ''}`);
    const idSegur = `imp-${idx + 1}-${plegaText(it.title).replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'element'}-${estat.items.length + idx}`;

    return {
      id: idSegur,
      title: it.title,
      date: it.date || 'Carpeta pròpia',
      image: it.image || '',
      excerpt: it.excerpt || '',
      poble,
      sourceUrl: it.sourceUrl || '',
      isTwin: Boolean(bessoExistent),
      sources: it.sourceUrl ? [{ label: 'Font importada', url: it.sourceUrl }] : [],
      suggestedTroncId: pred.troncId,
      suggestedCategoryId: pred.categoryId,
      categoryId: autoClassifica ? pred.categoryId : 'revisar',
      tags: pred.tags,
      x: 14 + ((idx * 19) % 72),
      y: 20 + ((idx * 23) % 62),
      isImported: true,
    };
  });

  return {
    estat: {
      ...estat,
      items: [...nousItems, ...estat.items],
      undoStack: empilaUndo(estat),
    },
    importats: nousItems.length,
    formatDetectat,
  };
}

/** Construeix rutes candidates per enxufar una web WordPress, Blogger o un feed RSS públic */
export function candidatsFeedDeUrlWeb(rawUrl) {
  const neta = urlSeguraExterna(rawUrl);
  if (!neta) return [];
  const u = new URL(neta);
  if (/\.(json|xml|rss|atom)$/i.test(u.pathname) || u.pathname.includes('/wp-json/') || u.pathname.includes('/feeds/')) {
    return [u.href];
  }
  const base = `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
  return [
    `${base}/wp-json/wp/v2/posts?_embed=1&per_page=50`,
    `${base}/feeds/posts/summary?alt=json&max-results=50`,
    `${base}/feed/`,
    u.href,
  ];
}

/** Exporta la partida sencera com a JSON reutilitzable */
export function exportaInstantaniaJson(estat) {
  const assignacions = {};
  const tagsCartes = {};
  for (const it of estat.items) {
    if (!it.isImported) {
      assignacions[it.id] = it.categoryId;
      tagsCartes[it.id] = it.tags || [];
    }
  }
  return JSON.stringify(
    {
      schema: 'sdp.cada-cosa-al-seu-lloc.v1',
      generatEl: new Date().toISOString(),
      llicencia: 'CC BY-SA 4.0',
      conceptes: estat.conceptes,
      assignacions,
      tagsCartes,
      itemsImportats: estat.items.filter((it) => it.isImported),
    },
    null,
    2
  );
}

/** Exporta OPML 2.0 per a lectors RSS */
export function exportaOpmlRss(estat) {
  const categories = estat.conceptes.filter((c) => c.rol === 'categoria');
  const escapa = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const outlines = TRONCS_MONS_2.map((tronc) => {
    const cats = categories.filter((c) => c.troncId === tronc.id);
    const fills = cats
      .map(
        (c) =>
          `      <outline text="${escapa(c.label)}" title="${escapa(c.label)}" category="/${escapa(tronc.id)}/${escapa(c.id)}" />`
      )
      .join('\n');
    return `    <outline text="${escapa(tronc.labels.ca)}" title="${escapa(tronc.labels.ca)}">\n${fills}\n    </outline>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head>\n    <title>Cada Cosa al Seu Lloc · Sóc de Poble (OPML 2.0)</title>\n  </head>\n  <body>\n${outlines}\n  </body>\n</opml>\n`;
}

/** Genera la Proposta Ciutadana de Categories i Classificació sota CC BY-SA 4.0 llesta per al /xat o Markdown */
export function generaPropostaCiutadana(estat, notaUsuari = '', idioma = 'ca') {
  const categories = estat.conceptes.filter((c) => c.rol === 'categoria');
  const etiquetes = estat.conceptes.filter((c) => c.rol === 'etiqueta');
  const recomptePerCat = new Map();
  for (const it of estat.items) {
    recomptePerCat.set(it.categoryId, (recomptePerCat.get(it.categoryId) || 0) + 1);
  }

  const classificades = estat.items.filter((it) => it.categoryId !== 'revisar').length;
  const pendents = recomptePerCat.get('revisar') || 0;

  const capcaleraPerIdioma = {
    ca: '🤝 Proposta col·lectiva per a «Cada cosa al seu lloc» (CC BY-SA 4.0)',
    es: '🤝 Propuesta colectiva para «Cada cosa en su sitio» (CC BY-SA 4.0)',
    en: '🤝 Community taxonomy proposal for “Everything in Its Place” (CC BY-SA 4.0)',
    eu: '🤝 «Gauza bakoitza bere lekuan» proposamen kolektiboa (CC BY-SA 4.0)',
    gl: '🤝 Proposta colectiva para «Cada cousa no seu sitio» (CC BY-SA 4.0)',
  };

  const linies = [
    `# ${capcaleraPerIdioma[idioma] || capcaleraPerIdioma.ca}`,
    '',
    `- Publicacions ordenades: **${classificades}** de **${estat.items.length}** (pendents a Revisar: **${pendents}**).`,
    `- Estructura viva: **2 Grans Mons** · **${categories.length} Categories** · **${etiquetes.length} Etiquetes**.`,
  ];

  if (notaUsuari && notaUsuari.trim()) {
    linies.push(`- Comentari de qui proposa: ${notaUsuari.trim().slice(0, 400)}`);
  }

  linies.push('');

  for (const tronc of TRONCS_MONS_2) {
    const titolTronc = tronc.labels[idioma] || tronc.labels.ca;
    linies.push(`## ${titolTronc}`);
    const catsTronc = categories.filter((c) => c.troncId === tronc.id);
    for (const cat of catsTronc) {
      const n = recomptePerCat.get(cat.id) || 0;
      const tagsFills = etiquetes
        .filter((e) => e.parentCategoryId === cat.id)
        .map((e) => `#${e.label}`);
      const sufixTags = tagsFills.length > 0 ? ` — Etiquetes: ${tagsFills.join(', ')}` : '';
      linies.push(`- **${cat.label}** (${n} publicacions)${sufixTags}`);
    }
    linies.push('');
  }

  linies.push('Ruta del joc viu: https://socdepoble.org/cada-cosa-al-seu-lloc');
  return linies.join('\n');
}
