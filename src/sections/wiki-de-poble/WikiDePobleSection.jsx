import React, { useMemo } from 'react';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { wikiManifest } from '../../data/wikiManifest.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { Folder, FileText } from 'lucide-react';
import { useNavigate, useLocation } from '../../app/contexts/RouterContext';
import { PAGE_COPY } from '../text/pageContent';
import BrainGraph from '../../components/universal/graph/BrainGraph';
import { useSession } from '../../app/contexts/SessionContext';
import { ConsolaPanells } from '../consola/ConsolaSection.jsx';

// El compilador dona `categoryId: null` als documents solts de l'arrel de la
// Wiki (00_index). Abans penjaven d'una categoria contenidora «WIKI DE POBLE»
// que només afegia un nivell; ara SER/SABER/ACTUAR són arrels i la portada té
// la seua pròpia categoria base, visible sense haver de desplegar res.
const CATEGORIA_ARREL = 'folder:__arrel';


// Improved Markdown parser to HTML
function parseMarkdown(md) {
  if (!md) return '';
  let html = md.replace(/\r\n/g, '\n');
  
  // Headers
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Horizontal Rule
  html = html.replace(/^---$/gim, '<hr />');
  
  // Blockquotes and Alerts
  html = html.replace(/^> \[!([A-Z]+)\]\n((?:> .*\n?)+)/gim, (match, type, content) => {
     let inner = content.replace(/^> /gm, '');
     return `<div class="sdp-alert ${type.toLowerCase()}">${inner.trim()}</div>`;
  });
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Formatting
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
  
  // Lists
  html = html.replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>');
  html = html.replace(/<\/li>\n<li>/gim, '</li><li>');
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  
  // Tables
  html = html.replace(/^\|(.+)\|[ \t]*\n\|([-: |]+)\|[ \t]*\n((\|.*\|[ \t]*(?:\n|$))+)/gm, (match, head, sep, body) => {
    let thead = '<thead><tr>' + head.split('|').filter(c => c.trim() || c === '').slice(1, -1).map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead>';
    let tbody = '<tbody>' + body.trim().split('\n').map(row => {
      return '<tr>' + row.split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    }).join('') + '</tbody>';
    return `<div class="sdp-table-container"><table class="sdp-table">\n${thead}\n${tbody}\n</table></div>`;
  });
  
  // Paragraphs (grouping hard-wrapped lines)
  let blocks = html.split(/\n\s*\n/);
  html = blocks.map(block => {
    if (block.trim() === '') return '';
    if (block.trim().match(/^(<h|<u|<l|<a|<hr|<div|<blockquote)/)) return block;
    // Text net: ajuntem les línies amb un espai
    return `<p>${block.trim().replace(/\n/g, ' ')}</p>`;
  }).join('\n\n');
  
  return html;
}

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

// Un custom renderDetail que llegeix el Markdown i l'estilitza
function WikiDetail({ item, onSelectionChange }) {
  if (!item || item.id === '__intro') {
    const page = PAGE_COPY.wikidepoble;
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
          className="sdp-article__contingut sdp-prose"
          style={{ padding: 'var(--sdp-space-4)' }}
          dangerouslySetInnerHTML={{ __html: page.html }}
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
        <div style={{ height: 'calc(100vh - 200px)', borderRadius: 'var(--sdp-radi-lg)', overflow: 'hidden', border: '1px solid var(--sdp-crom-vora)' }}>
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
        <div className="sdp-article sdp-article--card sdp-border-soft sdp-bg-alt sdp-p-m sdp-mb-l sdp-radius-m">
          <h4 className="sdp-text-brand sdp-mb-s sdp-weight-bold">Quadre de Comandament ISO</h4>
          <table className="sdp-table">
            <tbody>
              <tr>
                <th className="sdp-text-mut">Identificador</th>
                <td className="sdp-font-mono">{item.id}</td>
              </tr>
              <tr>
                <th className="sdp-text-mut">Domini</th>
                <td>_wiki_de_poble</td>
              </tr>
              {item.attributes?.version && (
                <tr>
                  <th className="sdp-text-mut">Versió</th>
                  <td>{String(item.attributes.version)}</td>
                </tr>
              )}
              {item.attributes?.author && (
                <tr>
                  <th className="sdp-text-mut">Autor / Propietari</th>
                  <td>{String(item.attributes.author)}</td>
                </tr>
              )}
              {item.attributes?.date && (
                <tr>
                  <th className="sdp-text-mut">Data Creació</th>
                  <td>{String(item.attributes.date)}</td>
                </tr>
              )}
              {item.attributes?.type && (
                <tr>
                  <th className="sdp-text-mut">Tipus</th>
                  <td>{String(item.attributes.type)}</td>
                </tr>
              )}
              {item.attributes?.status && (
                <tr>
                  <th className="sdp-text-mut">Estat</th>
                  <td>
                    <span className="sdp-badge sdp-badge--info">
                      {String(item.attributes.status)}
                    </span>
                  </td>
                </tr>
              )}
              {item.attributes?.description && (
                <tr>
                  <th className="sdp-text-mut">Descripció</th>
                  <td>{String(item.attributes.description)}</td>
                </tr>
              )}
              <tr>
                <th className="sdp-text-mut">Classificació</th>
                <td>{item.tags?.length > 0 ? item.tags.join(', ') : 'Públic'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div 
        className="sdp-article__contingut sdp-prose"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(parseMarkdown(item.content)) }}
      />
    </UniversalPage>
  );
}

export default function WikiDePobleSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { estat: sessionEstat, esSuperadmin } = useSession();

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

  const isAdminMode = sessionEstat === 'dins' && esSuperadmin;

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
          title: PAGE_COPY.wikidepoble.title,
          subtitle: PAGE_COPY.wikidepoble.subtitle,
          categoryId: '__intro_cat',
          categoryIds: ['__intro_cat'],
          attributes: { type: 'Portada', date: PAGE_COPY.wikidepoble.date },
          image: PAGE_COPY.wikidepoble.image
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
  }, [isAdminMode, wikiManifest]);

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
