// src/sections/disseny/DesignSection.jsx
import { Suspense, useCallback, useMemo } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Carregant } from '../../components/PedraSeca';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import { CATALOG_DETAIL_LOADERS } from './cataleg/detailRegistry';
import { CATALOG_CATEGORIES, CATALOG_ITEMS } from './cataleg/manifest';

function CatalogDetail({ item }) {
  const Detail = CATALOG_DETAIL_LOADERS[item.detailKey];
  if (!Detail) return <p>Espècimen encara no migrat.</p>;

  return (
    <UniversalPage
      chrome="context"
      title={item.title}
      subtitle={item.subtitle}
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
  const itemId = params.get('item') ?? undefined;
  const model = useMemo(() => ({
    status: 'ready',
    categories: CATALOG_CATEGORIES,
    items: CATALOG_ITEMS
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
    setParams(next);
    // Igual que Notes: el router ha de diferenciar push d’usuari i
    // replace de reconciliació; la selecció externa no torna a emetre.
  }, [params, setParams]);

  return (
    <UniversalWorkspace
      model={model}
      initialSelection={{ categoryId, itemId }}
      selection={{ categoryId, itemId }}
      onSelectionChange={handleSelectionChange}
      labels={{ categories: 'ÀREES', items: 'COMPONENTS', create: 'CREAR' }}
      renderDetail={({ item }) => <CatalogDetail item={item} />}
    />
  );
}
