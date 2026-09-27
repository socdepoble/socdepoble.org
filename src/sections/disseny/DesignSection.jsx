// src/sections/disseny/DesignSection.jsx
import { Suspense, useCallback, useMemo } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Carregant } from '../../components/PedraSeca';
import { LayoutGrid, Component } from 'lucide-react';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import { COPYRIGHT_SDP, dataDocument, pindolesUniques } from '../../components/universal/editorial.js';
import { CATALOG_DETAIL_LOADERS } from './cataleg/detailRegistry';
import { CATALOG_CATEGORIES, CATALOG_ITEMS } from './cataleg/manifest';
import { PAGE_COPY } from '../text/pageContent';
import { sanitizeHtml } from '../../utils/sanitize.js';

/* Família del catàleg on viu l'espècimen (la primera, si en té més d'una). */
const etiquetaCategoria = (item) => (
  CATALOG_CATEGORIES.find((categoria) => categoria.id === item.categoryIds?.[0])?.label || null
);

/* Els espècimens encara no tenen fitxa editorial pròpia. Ho diem clar
   (ordre del Mestre, 260925: «Crea una presentació bonica, sigues honest i
   digues que està en curs»). */
const entradillaEnCurs = (categoria) => (
  `Espècimen viu del catàleg Pedra Seca${categoria ? `, a la família ${categoria}` : ''}. `
  + 'El que veus davall és el component de veres, funcionant; la seua fitxa editorial encara està en curs.'
);

function CatalogDetail({ item }) {
  if (!item || item.id === '__intro') {
    const page = PAGE_COPY.disseny;
    // Una data sense hora no s'inventa les «02:00» de la mitjanit UTC.
    const data = dataDocument(page.date);
    return (
      <UniversalPage
        chrome="context"
        title={page.title}
        subtitle={page.subtitle}
        lead={page.lead}
        heroImage={page.image}
        heroAlt={page.imageAlt || ''}
        showLogos={true}
        labels={page.labels}
        copyright={COPYRIGHT_SDP}
        time={data?.time || ''}
        date={data?.date || ''}
        dateTime={data?.dateTime || ''}
        onConnect={false}
      >
        <div
          className="sdp-prose sdp-prose--encoixinada"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html) }}
        />
      </UniversalPage>
    );
  }

  const Detail = CATALOG_DETAIL_LOADERS[item.detailKey];
  if (!Detail) return <p>Espècimen encara no migrat.</p>;

  // Sense fitxa editorial (lead) l'espècimen es presenta «En curs». Cap data:
  // el catàleg no en guarda cap de real i no se n'inventa.
  const categoria = etiquetaCategoria(item);
  const enCurs = !item.lead;
  return (
    <UniversalPage
      chrome="context"
      title={item.title}
      subtitle={item.subtitle || categoria}
      lead={item.lead || entradillaEnCurs(categoria)}
      showLogos={true}
      labels={pindolesUniques([
        categoria && { text: categoria, className: 'sdp-badge-system' },
        enCurs && { text: 'En curs', className: 'sdp-badge-category' },
        ...(item.tags || []).map((tag) => ({ text: tag, className: 'sdp-badge-tag' }))
      ])}
      copyright={COPYRIGHT_SDP}
      onConnect={false}
    >
      <Suspense fallback={<Carregant etiqueta="Carregant l’espècimen…" />}>
        <Detail />
      </Suspense>
    </UniversalPage>
  );
}

export default function DesignSection() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get('categoria') ?? 'fonaments';
  const itemId = params.get('item'); // If null, UniversalWorkspace won't auto-select the first item
  const model = useMemo(() => ({
    status: 'ready',
    categories: CATALOG_CATEGORIES,
    items: [
      {
        id: '__intro',
        categoryId: 'fonaments',
        categoryIds: ['fonaments'],
        title: PAGE_COPY.disseny.title,
        subtitle: PAGE_COPY.disseny.subtitle,
        image: PAGE_COPY.disseny.image
      },
      ...CATALOG_ITEMS
    ]
  }), []);

  const handleSelectionChange = useCallback((selection, meta) => {
    const currentCategory = params.get('categoria');
    const currentItem = params.get('item');
    if (
      currentCategory === selection.categoryId
      && (currentItem ?? null) === (selection.itemId ?? null)
      && !params.has('pagina')
    ) return;

    const next = new URLSearchParams(params);
    next.set('categoria', selection.categoryId);
    if (selection.itemId == null) next.delete('item');
    else next.set('item', String(selection.itemId));
    next.delete('pagina');

    const isPush = meta?.reason === 'user' || meta?.reason === 'create';
    setParams(next, { replace: !isPush });
  }, [params, setParams]);

  return (
    <UniversalWorkspace
      collapsibleNavigation={false}
      replegaTotaCapcalera
      sortable
      model={model}
      initialSelection={{ categoryId, itemId }}
      selection={{ categoryId, itemId }}
      onSelectionChange={handleSelectionChange}
      labels={{ categories: 'DISSENY', items: 'COMPONENTS', select: 'Tria un component del catàleg.' }}
      icons={{ categories: LayoutGrid, items: Component }}

      renderDetail={({ item }) => <CatalogDetail item={item} />}
    />
  );
}
