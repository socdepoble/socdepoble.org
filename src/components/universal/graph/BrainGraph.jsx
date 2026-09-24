import React, { useRef, useEffect, useState, useMemo, useId } from 'react';
import useForceLayout from './useForceLayout';
import { wikiManifest } from '../../../data/wikiManifest';
import { RefreshCw, ZoomIn, ZoomOut, Maximize, X } from 'lucide-react';

const NODE_RADIUS = {
  document: 8,
  category: 12,
  tag: 6,
};

/* El canvas no llig tokens: `resolveColor` els fa resoldre al navegador amb un
   <span> de sonda. Els colors de reserva que duien estos var() no s'han
   disparat mai —els cinc tokens existixen— i eren l'única tinta en brut del
   sistema de disseny. Fora, sense moure cap píxel. */
const COLORS = {
  document: 'var(--sdp-accent)',
  category: 'var(--sdp-accio)',
  tag: 'var(--sdp-exit)',
  link: 'var(--sdp-vora-forta)',
  text: 'var(--sdp-text-cos)',
  bg: 'transparent'
};

/* El graf és un component universal: la Wiki hi pinta el seu manifest i la
   Consola hi pinta el Mapa dels agents. Sense `graf`, `estil` ni `textos`,
   es comporta i es pinta exactament com abans (graf de la Wiki). */
const ESTIL_WIKI = Object.freeze({
  radis: NODE_RADIUS,
  colors: { document: COLORS.document, category: COLORS.category, tag: COLORS.tag },
  noms: { document: 'Document', category: 'Categoria', tag: 'Etiqueta' },
  etiquetaAmbZoom: { category: 0.6 },
});

const TEXTOS_WIKI = Object.freeze({
  titol: 'Explorador del coneixement',
  selector: 'Document, etiqueta o categoria',
  obrir: 'Obrir document',
  buit: 'Fes clic en un node per explorar les seues connexions.',
  canvas: 'Graf de coneixement. Utilitza l’explorador per seleccionar nodes amb el teclat.',
  inspector: 'Consola del graf',
});

/** Graf de la Wiki: categories, etiquetes i documents del manifest compilat. */
export function grafDeLaWiki(manifest = wikiManifest) {
  const rawNodes = [];
  const rawLinks = [];
  const nodeMap = new Set();

  // Add Category nodes
  manifest.categories.forEach(cat => {
    rawNodes.push({ id: cat.id, label: cat.label, type: 'category' });
    nodeMap.add(cat.id);
  });

  // Add tags (extract from items)
  const tags = new Set();
  manifest.items.forEach(item => {
    if (item.tags) item.tags.forEach(t => tags.add(`tag_${t}`));
  });
  tags.forEach(t => {
    rawNodes.push({ id: t, label: t.replace('tag_', '#'), type: 'tag' });
    nodeMap.add(t);
  });

  // Add Document nodes
  manifest.items.forEach(item => {
    const rest = { ...item };
    delete rest.content;
    rawNodes.push({ ...rest, id: item.id, label: item.title || item.id, type: 'document' });
    nodeMap.add(item.id);

    // Link to category
    if (item.categoryId && nodeMap.has(item.categoryId)) {
      rawLinks.push({ source: item.id, target: item.categoryId, type: 'categorizes' });
    }

    // Link to tags
    if (item.tags) {
      item.tags.forEach(t => {
        rawLinks.push({ source: item.id, target: `tag_${t}`, type: 'tags' });
      });
    }

    // Link to other documents (markdown content)
    if (item.content) {
      const regex = /\(\?item=([^)]+)\)/g;
      let match;
      while ((match = regex.exec(item.content)) !== null) {
        const targetId = match[1];
        // We will add the link even if target doesn't exist yet, but filter later
        rawLinks.push({ source: item.id, target: targetId, type: 'references' });
      }
    }
  });

  // Filter out invalid links and duplicates
  const uniqueLinks = [];
  const linkSet = new Set();
  rawLinks.forEach(l => {
    const key = l.source < l.target ? `${l.source}-${l.target}` : `${l.target}-${l.source}`;
    if (!linkSet.has(key)) {
      linkSet.add(key);
      uniqueLinks.push(l);
    }
  });
  const validLinks = uniqueLinks.filter(l => nodeMap.has(l.source) && nodeMap.has(l.target));

  return { nodes: rawNodes, links: validLinks };
}

/**
 * Props opcionals (totes amb el valor de la Wiki per defecte):
 *   graf          { nodes: [{id, label, type}], links: [{source, target, discontinu?}] }
 *   estil         { radis, colors (tokens), noms, etiquetaAmbZoom } per tipus de node
 *   forces        { repulsio, llargaria, molla, gravetat } (useForceLayout)
 *   fletxes       pinta el sentit de cada vincle
 *   textos        rètols de l'inspector; `obrir: null` amaga el botó d'obrir
 *   renderDetall  (node, veïns) => detall propi en lloc de la fitxa de la Wiki
 * `graf`, `estil`, `forces` i `textos` han de ser estables (constants o memo).
 */
export default function BrainGraph({
  onNodeClick, className = '', graf, estil = ESTIL_WIKI, forces, fletxes = false, textos = TEXTOS_WIKI, renderDetall
}) {
  const nodeSelectId = useId();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedId, setSelectedId] = useState('');
  const [revision, setRevision] = useState(0);
  const redraw = () => setRevision(value => value + 1);
  const [isSimulationActive, setIsSimulationActive] = useState(true);

  // Transform settings
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 1. Extract Data
  const { nodes, links } = useMemo(() => graf ?? grafDeLaWiki(), [graf]);
  const paleta = useMemo(() => ({ ...estil.colors, link: COLORS.link, text: COLORS.text, bg: COLORS.bg }), [estil]);
  const radiDe = (type) => estil.radis[type] || 5;

  const selected = nodes.find(node => node.id === selectedId);
  const neighbours = useMemo(() => {
    if (!selectedId) return [];
    return nodes.filter(node => links.some(link =>
      (link.source === selectedId && link.target === node.id) ||
      (link.target === selectedId && link.source === node.id)
    ));
  }, [selectedId, nodes, links]);

  const renderRef = useRef(null);

  // 2. Run physics
  const nodesRef = useForceLayout({
    nodes,
    links,
    width: dimensions.width,
    height: dimensions.height,
    isSimulationActive,
    forces,
    onTick: () => {
      if (renderRef.current) renderRef.current();
    }
  });

  // 3. Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;
    const resolveColor = (value) => {
      const probe = document.createElement('span');
      probe.style.color = value;
      containerRef.current.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const colors = Object.fromEntries(Object.entries(paleta).map(([key, value]) => [key, resolveColor(value)]));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(dimensions.width * dpr);
    canvas.height = Math.round(dimensions.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const radis = estil.radis;
    const zoomEtiqueta = estil.etiquetaAmbZoom || {};
    const continus = links.filter(link => !link.discontinu);
    const discontinus = links.filter(link => link.discontinu);

    let rafId;
    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);
      const k = transformRef.current.k;
      const escala = Math.min(1.4, Math.max(0.3, Math.sqrt(k)));

      // Draw links
      ctx.lineWidth = 1 / k;
      ctx.strokeStyle = colors.link;
      ctx.globalAlpha = 0.3;
      const byId = new Map(nodesRef.current.map(node => [node.id, node]));
      const traca = (grup) => {
        ctx.beginPath();
        grup.forEach(link => {
          const source = byId.get(link.source);
          const target = byId.get(link.target);
          if (source && target) {
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);
          }
        });
        ctx.stroke();
      };
      traca(continus);
      // Un vincle inferit (de prosa) es pinta discontinu: no val igual que un declarat.
      if (discontinus.length) {
        ctx.setLineDash([4 / k, 4 / k]);
        traca(discontinus);
        ctx.setLineDash([]);
      }
      if (fletxes) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = colors.link;
        links.forEach(link => {
          const source = byId.get(link.source);
          const target = byId.get(link.target);
          if (!source || !target) return;
          const angle = Math.atan2(target.y - source.y, target.x - source.x);
          const vora = ((radis[target.type] || 5) * escala) / k;
          const punta = 7 / k;
          const px = target.x - Math.cos(angle) * vora;
          const py = target.y - Math.sin(angle) * vora;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - punta * Math.cos(angle - 0.4), py - punta * Math.sin(angle - 0.4));
          ctx.lineTo(px - punta * Math.cos(angle + 0.4), py - punta * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fill();
        });
      }

      ctx.globalAlpha = 1;
      // Draw nodes
      nodesRef.current.forEach(node => {
        ctx.beginPath();
        const r = (radis[node.type] || 5) * escala;
        ctx.arc(node.x, node.y, r / k, 0, 2 * Math.PI);
        ctx.fillStyle = colors[node.type] || colors.link;
        ctx.fill();

        if (node.id === selectedId) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, (r + 5) / k, 0, 2 * Math.PI);
          ctx.strokeStyle = colors.text;
          ctx.lineWidth = 2 / k;
          ctx.stroke();
        }
        // Draw labels if zoomed in enough
        const llindar = zoomEtiqueta[node.type];
        if (k > 1.5 || (llindar !== undefined && k > llindar) || node.id === selectedId) {
          ctx.fillStyle = colors.text;
          ctx.font = `${12 / k}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label.length > 44 ? `${node.label.slice(0, 41)}…` : node.label, node.x, node.y + (r / k) + (12 / k));
        }
      });

      ctx.restore();
    };

    renderRef.current = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    };

    renderRef.current();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      renderRef.current = null;
    };
  }, [dimensions, links, selectedId, revision, nodesRef, paleta, estil, fletxes]);

  // Handle Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Interactivity (Pan & Zoom)
  const zoomAt = (factor, x, y) => {
    const t = transformRef.current;
    const k = Math.min(Math.max(t.k * factor, 0.1), 5);
    transformRef.current = { x: x - (x - t.x) * k / t.k, y: y - (y - t.y) * k / t.k, k };
    redraw();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wheel = event => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1);
      const t = transformRef.current;
      const k = Math.min(Math.max(t.k * Math.exp(-delta * 0.002), 0.1), 5);
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      transformRef.current = { x: x - (x - t.x) * k / t.k, y: y - (y - t.y) * k / t.k, k };
      setRevision(value => value + 1);
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => canvas.removeEventListener('wheel', wheel);
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY, tx: transformRef.current.x, ty: transformRef.current.y };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    transformRef.current.x = dragStartRef.current.tx + dx;
    transformRef.current.y = dragStartRef.current.ty + dy;

    redraw();
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
    if (e.type !== 'pointercancel' && Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y) < 5) {
      const rect = canvasRef.current.getBoundingClientRect();
      const t = transformRef.current;
      const hit = [...nodesRef.current].reverse().find(node => {
        const r = radiDe(node.type) * Math.min(1.4, Math.max(0.3, Math.sqrt(t.k)));
        return Math.hypot(node.x * t.k + t.x - (e.clientX - rect.left), node.y * t.k + t.y - (e.clientY - rect.top)) <= r + 5;
      });
      setSelectedId(hit?.id || '');
      if (hit) onNodeClick?.(hit);
    }
    redraw();
  };

  const handleZoomIn = () => zoomAt(1.3, dimensions.width / 2, dimensions.height / 2);
  const handleZoomOut = () => zoomAt(1 / 1.3, dimensions.width / 2, dimensions.height / 2);
  const handleReset = () => {
    const positions = nodesRef.current;
    if (!positions.length) return;
    const xs = positions.map(node => node.x), ys = positions.map(node => node.y);
    const left = Math.min(...xs), top = Math.min(...ys);
    const width = Math.max(...xs) - left, height = Math.max(...ys) - top;
    const k = Math.max(0.1, Math.min(3, (dimensions.width - 80) / Math.max(width, 1), (dimensions.height - 100) / Math.max(height, 1)));
    transformRef.current = { x: dimensions.width / 2 - (left + width / 2) * k, y: dimensions.height / 2 - (top + height / 2) * k, k };
    redraw();
  };

  return (
    <div ref={containerRef} className={`sdp-brain-graph-wrapper ${className}`}>
      <canvas
        ref={canvasRef}
        aria-label={textos.canvas}
        width={dimensions.width}
        height={dimensions.height}
        className={`sdp-brain-graph-canvas ${isDraggingRef.current ? 'sdp-brain-graph-canvas--grabbing' : 'sdp-brain-graph-canvas--grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <aside className="sdp-brain-graph-inspector" aria-label={textos.inspector}>
        <h3>{textos.titol}</h3>
        <label htmlFor={nodeSelectId}>{textos.selector}</label>
        <select id={nodeSelectId} value={selectedId} onChange={event => {
          setSelectedId(event.target.value);
          const node = nodes.find(candidate => candidate.id === event.target.value);
          if (node) onNodeClick?.(node);
        }}>
          <option value="">Selecciona un node…</option>
          {nodes.map(node => <option key={node.id} value={node.id}>{node.label}</option>)}
        </select>
        {selected ? <>
          <button type="button" onClick={() => setSelectedId('')} aria-label="Netejar selecció"><X size={16} /></button>
          <h4>{selected.label}</h4>
          {selected.attributes?.summary && <p>{selected.attributes.summary}</p>}
          {textos.obrir && <button type="button" className="sdp-boto sdp-boto--secundari sdp-brain-graph-open-btn" onClick={() => onNodeClick?.(selected)}>{textos.obrir}</button>}
          {renderDetall ? renderDetall(selected, neighbours) : <dl>
            <dt>Tipus</dt><dd>{estil.noms[selected.type]}</dd>
            <dt>Identificador</dt><dd>{selected.id}</dd>
            {selected.categoryId && <><dt>Categoria</dt><dd>{nodes.find(node => node.id === selected.categoryId)?.label}</dd></>}
            {selected.tags?.length > 0 && <><dt>Etiquetes</dt><dd>{selected.tags.join(', ')}</dd></>}
            <dt>Connexions</dt><dd>{neighbours.length}</dd>
          </dl>}
          <ul>{neighbours.map(node => <li key={node.id}><button type="button" onClick={() => setSelectedId(node.id)}>{node.label}</button></li>)}</ul>
        </> : <p>{textos.buit}</p>}
        <p>{nodes.length} nodes · {links.length} vincles</p>
      </aside>
      <div className="sdp-brain-graph-controls" role="group" aria-label="Controls del graf">
        <button className="sdp-boto sdp-boto--secundari btn-icon" onClick={() => setIsSimulationActive(!isSimulationActive)} title={isSimulationActive ? 'Pausar simulació' : 'Reprendre simulació'}>
          <RefreshCw size={18} className={isSimulationActive ? 'spinner' : ''} />
        </button>
        <button className="sdp-boto sdp-boto--secundari btn-icon" onClick={handleZoomIn} title="Apropar"><ZoomIn size={18} /></button>
        <button className="sdp-boto sdp-boto--secundari btn-icon" onClick={handleZoomOut} title="Allunyar"><ZoomOut size={18} /></button>
        <button className="sdp-boto sdp-boto--secundari btn-icon" onClick={handleReset} title="Centrar"><Maximize size={18} /></button>
      </div>
    </div>
  );
}
