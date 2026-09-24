import React, { useMemo } from 'react';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { wikiManifest } from '../../data/wikiManifest.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { Folder, FileText } from 'lucide-react';
import { useNavigate, useLocation } from '../../app/contexts/RouterContext';
import { PAGE_COPY } from '../text/pageContent';
import BrainGraph from '../../components/universal/graph/BrainGraph';
import { ConsolaPanells } from '../consola/ConsolaSection.jsx';
import { parseMarkdown } from './parseMarkdown.js';

// El compilador dona `categoryId: null` als documents solts de l'arrel de la
// Wiki (00_index). Abans penjaven d'una categoria contenidora «WIKI DE POBLE»
// que només afegia un nivell; ara SER/SABER/ACTUAR són arrels i la portada té
// la seua pròpia categoria base, visible sense haver de desplegar res.
const CATEGORIA_ARREL = 'folder:__arrel';


function formatDate(dStr) {
  if (!dStr) return '';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  return d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatTime(dStr) {
  if (!dStr) return '';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
}

function WikiDetail({ item, onSelectionChange }) {
  if (!item || item.id === '__intro') {
    const page = PAGE_COPY.wikidepoble || { title: 'Wiki de Poble', subtitle: 'La base de coneixement', image: '', date: new Date().toISOString(), html: '' };
    return (
      <UniversalPage
        chrome="context"
        title={page.title}
        subtitle={page.subtitle}
        heroImage={page.image}
        dateTime={page.date}
        onConnect={false}
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
    return (
      <UniversalPage
        chrome="context"
        title={item.title}
        subtitle={item.subtitle}
      >
        <ConsolaPanells />
      </UniversalPage>
    );
  }

  const dateStr = item.attributes?.date || new Date().toISOString();

  const categoryLabels = (item.categoryIds || []).map(id => {
    const cat = wikiManifest.categories.find(c => c.id === id);
    return { text: cat ? cat.label : id, className: 'sdp-badge-category' };
  });
  
  const tagLabels = (item.tags || []).map(tag => ({ text: tag, className: 'sdp-badge-tag' }));
  
  const labels = [...categoryLabels, ...tagLabels];

  return (
    <UniversalPage
      chrome="context"
      title={item.title}
      subtitle={item.subtitle}
      date={formatDate(dateStr)}
      time={formatTime(dateStr)}
      dateTime={dateStr}
      labels={labels}
      heroImage={item.image}
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
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(parseMarkdown(item.content)) }}
      />
    </UniversalPage>
  );
}

export default function WikiDePobleSection() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parseitem de la URL per mantenir l'estat (ex: ?item=genoma)
  const queryParams = new URLSearchParams(location.search);
  const activeItemId = queryParams.get('item');
  const activeItem = useMemo(() => {
    return wikiManifest.items.find(i => i.id === activeItemId) || null;
  }, [activeItemId]);

  const activeCategoryId = activeItem ? activeItem.categoryId : null;

  const initialSelection = useMemo(() => {
    return { categoryId: activeCategoryId, itemId: activeItemId };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selection = useMemo(() => {
    return { categoryId: activeCategoryId, itemId: activeItemId };
  }, [activeCategoryId, activeItemId]);

  const handleSelectionChange = (sel) => {
    if (sel.itemId) {
      navigate(`?item=${encodeURIComponent(sel.itemId)}`, { replace: true });
    } else {
      navigate('?', { replace: true });
    }
  };


  const model = useMemo(() => {
    return {
      status: 'ready',
      workspaceKey: 'wikidepoble',
      categories: [
        { id: '__intro_cat', label: 'Wiki de Poble', icon: FileText },
        { id: 'obrir_graf_cat', label: 'Explorador del Cervell', icon: FileText },
        { id: 'consola_termodinamica_cat', label: 'Consola Termodinàmica', icon: FileText },
        { id: CATEGORIA_ARREL, label: 'ÍNDEX', icon: Folder },
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
          title: PAGE_COPY.wikidepoble?.title || 'Wiki de Poble',
          subtitle: PAGE_COPY.wikidepoble?.subtitle || 'La base de coneixement',
          categoryId: '__intro_cat',
          categoryIds: ['__intro_cat'],
          attributes: { type: 'Portada', date: PAGE_COPY.wikidepoble?.date || new Date().toISOString() },
          image: PAGE_COPY.wikidepoble?.image || ''
        },
        {
          id: 'obrir_graf',
          title: 'Explorador del Cervell',
          subtitle: 'Visualitza la xarxa de coneixement',
          categoryId: 'obrir_graf_cat',
          categoryIds: ['obrir_graf_cat'],
          tags: ['graf', 'cervell', 'ia'],
          attributes: { type: 'Eina Interactiva', author: 'Sistema', date: new Date().toISOString() },
          content: '## El Graf de Sóc de Poble\n\nAquest és el mapa del coneixement integrat. Quan estiga completament connectat, ací es visualitzarà el graf interactiu que relacionarà tota la Wiki, les etiquetes i els motors cognitius (skills).\n\n> [!NOTE]\n> Aquesta eina es troba en fase d\'auditoria per al seu trasllat al nou sistema atòmic.\n\n[Obrir Graf (Pendent de connexió)](#)'
        },
        {
          id: 'consola_termodinamica',
          title: 'Consola Termodinàmica',
          subtitle: 'Manteniment de la IAIA',
          categoryId: 'consola_termodinamica_cat',
          categoryIds: ['consola_termodinamica_cat'],
          tags: ['consola', 'ia'],
          attributes: { type: 'Eina Interactiva', author: 'Sistema', date: new Date().toISOString() },
          content: ''
        },
        ...wikiManifest.items.map(i => ({
          id: i.id,
          title: i.title,
          subtitle: i.subtitle,
          categoryId: i.categoryId || CATEGORIA_ARREL,
          categoryIds: [i.categoryId || CATEGORIA_ARREL],
          tags: i.tags,
          attributes: i.attributes || {},
          content: i.content,
          image: i.image
        }))
      ]
    };
  }, []);

  return (
    <UniversalWorkspace
      collapsibleNavigation={false}
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
