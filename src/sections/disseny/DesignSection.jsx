// src/sections/disseny/DesignSection.jsx
import { Suspense, useCallback, useMemo } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Carregant } from '../../components/PedraSeca';
import { LayoutGrid, Component } from 'lucide-react';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import { CATALOG_DETAIL_LOADERS } from './cataleg/detailRegistry';
import { CATALOG_CATEGORIES, CATALOG_ITEMS } from './cataleg/manifest';
import TextSection from '../text/TextSection';
import { PAGE_COPY } from '../text/pageContent';
import { UniversalCard } from '../../components/PedraSeca';



function CatalogDetail({ item }) {
  if (!item || item.id === '__intro') {
    const page = PAGE_COPY.disseny;
    return (
      <UniversalPage
        chrome="context"
        title={page.title}
        subtitle={page.subtitle}
        heroImage={page.image}
        dateTime="2026-09-19T12:00:00Z"
        onConnect={false}
      >
        <div 
          className="sdp-article__contingut sdp-prose"
          style={{ padding: 'var(--sdp-space-4)' }}
          dangerouslySetInnerHTML={{ __html: page.html }}
        />
      </UniversalPage>
    );
  }

  const Detail = CATALOG_DETAIL_LOADERS[item.detailKey];
  if (!Detail) return <p>Espècimen encara no migrat.</p>;

  return (
    <UniversalPage
      chrome="context"
      title={item.title}
      subtitle={item.subtitle}
      dateTime="2026-09-19T12:00:00Z"
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
      model={model}
      initialSelection={{ categoryId, itemId }}
      selection={{ categoryId, itemId }}
      onSelectionChange={handleSelectionChange}
      labels={{ categories: 'DISSENY', items: 'COMPONENTS', select: 'Tria un component del catàleg.' }}
      icons={{ categories: LayoutGrid, items: Component }}
      className="sdp-cataleg"
      renderDetail={({ item }) => <CatalogDetail item={item} />}
    />
  );
}
