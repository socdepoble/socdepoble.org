import React, { useMemo } from 'react';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { ALL_CATEGORY_ID } from '../../components/universal/workspace/workspaceState.js';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { wikiManifest } from '../../data/wikiManifest.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { Folder, FileText } from 'lucide-react';
import { useNavigate, useLocation } from '../../app/contexts/RouterContext';
import { PAGE_COPY } from '../text/pageContent';
import { COPYRIGHT_SDP, dataDocument } from '../../components/universal/editorial.js';
import { COVER_PAGE_KEYS } from '../../config/systemPages';
import BrainGraph from '../../components/universal/graph/BrainGraph';
import { ConsolaIncrustada } from '../consola/ConsolaSection.jsx';
import { parseMarkdown, extreuEditorial, parseMarkdownEnLinia } from './parseMarkdown.js';

// La portada és una peça estructural: si la clau desapareix, la pàgina es
// pinta buida. En desenvolupament ho diem en veu alta (incident del 24-09).
if (import.meta.env?.DEV && !PAGE_COPY[COVER_PAGE_KEYS.wiki]) {
  console.warn(`[Wiki] Falta la portada «${COVER_PAGE_KEYS.wiki}» a PAGE_COPY; es pinta el títol per defecte.`);
}

function WikiDetail({ item, onSelectionChange }) {
  if (!item || item.id === '__intro') {
    const page = PAGE_COPY[COVER_PAGE_KEYS.wiki] || { title: 'Wiki de Poble', subtitle: 'La base de coneixement', image: '', html: '' };
    const data = dataDocument(page.date);
    return (
      <UniversalPage
        chrome="context"
        title={page.title}
        subtitle={page.subtitle}
        lead={page.lead}
        heroImage={page.image}
        heroAlt={page.imageAlt || ''}
        date={data?.date || ''}
        time={data?.time || ''}
        dateTime={data?.dateTime || ''}
        showLogos={true}
        labels={[
          { text: 'WIKI DE POBLE', className: 'sdp-badge-system' },
          { text: 'Portada', className: 'sdp-badge-category' }
        ]}
        copyright={COPYRIGHT_SDP}
        /* T43 (ordre del Mestre, 260928) · la portada també es connecta: sense
           onConnect, UniversalPage la connecta com a 'pagina' amb la seua ruta. */
      >
        <div
          className="sdp-prose sdp-prose--encoixinada"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html) }}
        />
      </UniversalPage>
    );
  }

  if (item.id === 'obrir_graf') {
    return (
      <UniversalPage
        chrome="context"
        title={item.title}
        subtitle={item.subtitle}
        showLogos={true}
        copyright={COPYRIGHT_SDP}
      >
        <div className="sdp-wiki-graf">
           <BrainGraph onNodeClick={(node) => {
             if (node.type === 'document' && onSelectionChange) {
               onSelectionChange({ itemId: node.id });
             }
           }} />
        </div>
      </UniversalPage>
    );
  }

  if (item.id === 'consola_termodinamica') {
    // Mateix copy que la ruta /consola: el subtítol (h2) va seguit de
    // l'entradeta, i les targetes (h3) porten a /consola/<pàgina>.
    const consola = PAGE_COPY[COVER_PAGE_KEYS.consola];
    const data = dataDocument(consola?.date);
    return (
      <UniversalPage
        chrome="context"
        title={consola?.title || item.title}
        subtitle={consola?.subtitle || item.subtitle}
        lead={consola?.lead}
        date={data?.date || ''}
        time={data?.time || ''}
        dateTime={data?.dateTime || ''}
        showLogos={true}
        labels={[
          { text: 'WIKI DE POBLE', className: 'sdp-badge-system' },
          { text: 'Eina Interactiva', className: 'sdp-badge-category' },
          ...(item.tags || []).map(text => ({ text, className: 'sdp-badge-tag' }))
        ]}
        copyright={COPYRIGHT_SDP}
      >
        <ConsolaIncrustada />
      </UniversalPage>
    );
  }

  const data = dataDocument(item.attributes?.date);

  const categoryLabels = (item.categoryIds || []).map(id => {
    const cat = wikiManifest.categories.find(c => c.id === id);
    return { text: cat ? cat.label : id, className: 'sdp-badge-category' };
  });
  
  const tagLabels = (item.tags || []).map(tag => ({ text: tag, className: 'sdp-badge-tag' }));
  
  const labels = [...categoryLabels, ...tagLabels];

  const editorial = extreuEditorial(item.content);

  return (
    <UniversalPage
      chrome="context"
      title={editorial.titol || item.title}
      subtitle={item.subtitle}
      lead={editorial.entradilla ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(parseMarkdownEnLinia(editorial.entradilla)) }} /> : null}
      date={data?.date || ''}
      time={data?.time || ''}
      dateTime={data?.dateTime || ''}
      labels={labels}
      heroImage={item.image}
      showLogos={true}
      copyright={COPYRIGHT_SDP}
    >
      {item.id !== '00_index' && (

        <div className="sdp-article">
        {/* Quadre ISO. Les classes d'utilitat que duia (sdp-bg-alt, sdp-p-m,
            sdp-text-mut, sdp-text-brand, sdp-border-soft, sdp-radius-m,
            sdp-mb-l, sdp-mb-s, sdp-weight-bold, sdp-font-mono, sdp-badge…)
            no estaven declarades a cap full: no pintaven res i la porta de
            disseny les comptava com a Tailwind. Llevades sense tocar cap
            píxel. El quadre continua sense pell pròpia; vestir-lo amb Pedra
            Seca és una decisió de disseny, no de neteja. */}
          <h4>Quadre de Comandament ISO</h4>
          <table>
            <tbody>
              <tr>
                <th>Identificador</th>
                <td>{item.id}</td>
              </tr>
              <tr>
                <th>Domini</th>
                <td>_wiki_de_poble</td>
              </tr>
              {item.attributes?.version && (
                <tr>
                  <th>Versió</th>
                  <td>{String(item.attributes.version)}</td>
                </tr>
              )}
              {item.attributes?.author && (
                <tr>
                  <th>Autor / Propietari</th>
                  <td>{String(item.attributes.author)}</td>
                </tr>
              )}
              {item.attributes?.date && (
                <tr>
                  <th>Data Creació</th>
                  <td>{String(item.attributes.date)}</td>
                </tr>
              )}
              {item.attributes?.type && (
                <tr>
                  <th>Tipus</th>
                  <td>{String(item.attributes.type)}</td>
                </tr>
              )}
              {item.attributes?.status && (
                <tr>
                  <th>Estat</th>
                  <td>
                    <span>{String(item.attributes.status)}</span>
                  </td>
                </tr>
              )}
              {item.attributes?.description && (
                <tr>
                  <th>Descripció</th>
                  <td>{String(item.attributes.description)}</td>
                </tr>
              )}
              <tr>
                <th>Classificació</th>
                <td>{item.tags?.length > 0 ? item.tags.join(', ') : 'Públic'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div
        className="sdp-prose"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(parseMarkdown(editorial.cos, { entradilla: false })) }}
      />
    </UniversalPage>
  );
}

/* La primera opció de l'arbre: la portada («Wiki de Poble»). */
const CATEGORIA_INICIAL = '__intro_cat';

export default function WikiDePobleSection() {
  const navigate = useNavigate();
  const location = useLocation();

  const model = useMemo(() => {
    const portada = PAGE_COPY[COVER_PAGE_KEYS.wiki];
    return {
      status: 'ready',
      itemsComplete: true,
      workspaceKey: 'wikidepoble',
      categories: [
        { id: '__intro_cat', label: 'Wiki de Poble', icon: FileText },
        { id: 'consola_termodinamica_cat', label: 'Consola Termodinàmica', icon: FileText },
        ...wikiManifest.categories.map(c => ({
          id: c.id,
          parentId: c.parentId,
          label: c.label,
          icon: Folder
        }))
      ],
      items: [
        {
          id: '__intro',
          title: portada?.title || 'Wiki de Poble',
          subtitle: portada?.subtitle || 'La base de coneixement',
          categoryId: '__intro_cat',
          categoryIds: ['__intro_cat'],
          attributes: { type: 'Portada', date: portada?.date },
          image: portada?.image || ''
        },
        {
          id: 'consola_termodinamica',
          title: PAGE_COPY[COVER_PAGE_KEYS.consola]?.title || 'Consola Termodinàmica',
          subtitle: PAGE_COPY[COVER_PAGE_KEYS.consola]?.subtitle || 'Manteniment de la IAIA',
          categoryId: 'consola_termodinamica_cat',
          categoryIds: ['consola_termodinamica_cat'],
          tags: ['consola', 'ia'],
          attributes: { type: 'Eina Interactiva', author: 'Sistema', date: PAGE_COPY[COVER_PAGE_KEYS.consola]?.date },
          content: ''
        },
        ...wikiManifest.items.map(i => ({
          id: i.id,
          title: i.id === '00_index' && i.title === '00_index' ? 'Índex' : i.title,
          subtitle: i.subtitle,
          // Un fitxer de l'arrel (00_index) és un document de «Tot», no una carpeta.
          categoryId: i.categoryId || null,
          categoryIds: i.categoryId ? [i.categoryId] : [],
          tags: i.tags,
          attributes: i.attributes || {},
          content: i.content,
          image: i.image
        }))
      ]
    };
  }, []);

  // Parseitem de la URL per mantenir l'estat (ex: ?item=genoma)
  const queryParams = new URLSearchParams(location.search);
  const activeItemId = queryParams.get('item');
  // T26.2 (ordre del Mestre, 260927 nit): en entrar sense res a la URL, la
  // primera opció de l'arbre («Wiki de Poble», la portada) va seleccionada,
  // com a Disseny i al Xat. Obrir un document per URL sense carpeta continua
  // mostrant «Tot» (no restringix la llista a sa carpeta), i «Tot» triat a mà
  // es guarda a la URL com qualsevol altra carpeta.
  const categoryParam = queryParams.get('categoria');
  const categoriaInicial = activeItemId ? ALL_CATEGORY_ID : CATEGORIA_INICIAL;
  const activeCategoryId = categoryParam === ALL_CATEGORY_ID || model.categories.some(category => category.id === categoryParam)
    ? categoryParam
    : categoriaInicial;
  const itemEfectiu = activeItemId
    ?? (activeCategoryId === ALL_CATEGORY_ID || activeCategoryId === CATEGORIA_INICIAL ? '__intro' : null);

  const initialSelection = useMemo(() => {
    return { categoryId: activeCategoryId, itemId: itemEfectiu };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selection = useMemo(() => {
    return { categoryId: activeCategoryId, itemId: itemEfectiu };
  }, [activeCategoryId, itemEfectiu]);

  const handleSelectionChange = (sel) => {
    const next = new URLSearchParams(location.search);
    // El valor per defecte no s'escriu a la URL: la carpeta inicial sense
    // document obert, «Tot» amb un document obert (mateix criteri que en llegir-la).
    const itemObert = Boolean(sel.itemId && sel.itemId !== '__intro');
    const perDefecte = itemObert ? ALL_CATEGORY_ID : CATEGORIA_INICIAL;
    if (sel.categoryId && sel.categoryId !== perDefecte) next.set('categoria', sel.categoryId);
    else next.delete('categoria');
    if (sel.itemId && sel.itemId !== '__intro') {
      next.set('item', sel.itemId);
    } else {
      next.delete('item');
    }
    navigate(`?${next.toString()}`, { replace: true });
  };

  return (
    <UniversalWorkspace
      collapsibleNavigation={false}
      replegaTotaCapcalera
      model={model}
      initialSelection={initialSelection}
      selection={selection}
      onSelectionChange={handleSelectionChange}
      labels={{ categories: 'WIKI DE POBLE', items: 'DOCUMENTS', select: 'Tria un document.' }}
      icons={{ categories: Folder, items: FileText }}
      className="sdp-wiki-workspace"
      renderDetail={({ item, onSelectionChange }) => <WikiDetail item={item} onSelectionChange={onSelectionChange} />}
    />
  );
}
