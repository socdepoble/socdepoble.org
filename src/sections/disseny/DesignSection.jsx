// src/sections/disseny/DesignSection.jsx
import { Suspense, useCallback, useMemo } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Carregant } from '../../components/PedraSeca';
import { LayoutGrid, Component } from 'lucide-react';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import { COPYRIGHT_SDP, dataHoraDeBarra, pindolesUniques } from '../../components/universal/editorial.js';
import { CATALOG_DETAIL_LOADERS } from './cataleg/detailRegistry';
import { CATALOG_CATEGORIES, CATALOG_ITEMS } from './cataleg/manifest';
/* T51 · La data de la versió del catàleg viu al costat del manifest
   (cataleg/versio.js), on la veu qui edita el catàleg i l'ha de posar al dia. */
import { VERSIO_CATALEG } from './cataleg/versio.js';
import { PAGE_COPY } from '../text/pageContent';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';

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

/**
 * Ordre del Mestre, 261001 · El copy de la portada: primer el del contingut
 * core (useCoreContent().pageCopy) i PAGE_COPY només de reserva, amb la
 * mateixa precedència que TextRoute (App.jsx) i paginaDeText.js.
 *
 * Per què: la targeta de Disseny al Mur i al Calendari porta la data del
 * pageCopy (en mode seed, la de prova de mur/datesDeProvaMur.js, que aplica
 * data/supabase/content.js). Si la portada llig PAGE_COPY directament, la
 * seua pastilla diu un altre dia i porta a un Calendari on la seua targeta no
 * hi és. Mentre el core carrega (pageCopy buit), mana PAGE_COPY, com abans.
 */
const copyDeLaPortada = (pageCopy) => pageCopy?.disseny || PAGE_COPY.disseny;

function CatalogDetail({ item }) {
  const { pageCopy } = useCoreContent();
  if (!item || item.id === '__intro') {
    const page = copyDeLaPortada(pageCopy);
    // T51 · la data real de la portada: la del seu copy (copyDeLaPortada).
    // Sense hora si el copy és un dia sol (editorial.js no n'inventa cap de la
    // mitjanit UTC); amb hora si el core en porta una (les de prova, 261001).
    const data = dataHoraDeBarra({ creat: page.date });
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
        {...data}
        onConnect={false}
      >
        {/* SPEC G · les imatges del copy, amb la base de l'amfitrió en pintar-lo. */}
        <div
          className="sdp-prose sdp-prose--encoixinada"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(page.html)) }}
        />
      </UniversalPage>
    );
  }

  const Detail = CATALOG_DETAIL_LOADERS[item.detailKey];
  if (!Detail) return <p>Espècimen encara no migrat.</p>;

  // Sense fitxa editorial (lead) l'espècimen es presenta «En curs». T51 · la
  // seua data és la de la versió del catàleg (VERSIO_CATALEG), o la pròpia
  // quan el manifest la porte.
  const categoria = etiquetaCategoria(item);
  const enCurs = !item.lead;
  const data = dataHoraDeBarra({ creat: item.creat, modificat: item.modificat || VERSIO_CATALEG });
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
      {...data}
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
  /* 261001 · La llista i el detall lligen el mateix copy (copyDeLaPortada). */
  const { pageCopy } = useCoreContent();
  const portada = copyDeLaPortada(pageCopy);
  const model = useMemo(() => ({
    status: 'ready',
    categories: CATALOG_CATEGORIES,
    items: [
      {
        id: '__intro',
        categoryId: 'fonaments',
        categoryIds: ['fonaments'],
        title: portada.title,
        subtitle: portada.subtitle,
        image: portada.image
      },
      ...CATALOG_ITEMS
    ]
  }), [portada]);

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
