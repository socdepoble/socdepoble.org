import React, { useRef, useEffect, useState, useMemo, useId } from 'react';
import useForceLayout from './useForceLayout';
import { wikiManifest } from '../../../data/wikiManifest';
import { Play, Pause, ZoomIn, ZoomOut, Maximize, X } from 'lucide-react';

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

/* Zoom com al graf d'Obsidian: la rodeta apropa i allunya sense cap tecla,
   centrada en el punter. Un clic de rodeta de ratolí envia uns 100 px. La
   pinça del trackpad arriba com a rodeta amb ctrlKey (Chrome, Edge, Firefox)
   en passos de pocs píxels, amb deltaY ≈ 100·ln(escala): amb 1/100 el graf
   seguix els dits, i el topall per esdeveniment impedix que ctrl+rodeta d'un
   ratolí faça bots. Safari envia la pinça com a gesturechange. */
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5;
const PAS_RODETA = 0.002;        // un clic de ratolí (100 px) ≈ 18 %
const PAS_PINCA = 0.01;          // pinça: escala = e^(−deltaY/100)
const SALT_MAXIM = 0.25;         // ln del salt màxim per esdeveniment (≈ 28 %)
const PX_PER_LINIA = 16;         // deltaMode 1: Firefox compta la rodeta en línies
const LLINDAR_CLIC = 5;          // px: menys recorregut que açò és un clic, no un arrossegament
const DURADA_ENQUADRAMENT = 450; // ms

const limita = (valor, min, max) => Math.min(max, Math.max(min, valor));

/** Amplia `factor` vegades mantenint quiet el punt (x, y) del canvas, dins dels límits. */
function zoomSobre(t, factor, x, y) {
  const k = limita(t.k * factor, ZOOM_MIN, ZOOM_MAX);
  return { x: x - (x - t.x) * k / t.k, y: y - (y - t.y) * k / t.k, k };
}

/** ln del factor de zoom d'una rodeta: deltaMode normalitzat a píxels i amb topall. */
function logZoomDeRodeta({ deltaY, deltaMode, ctrlKey }, alcariaPagina) {
  const px = deltaY * (deltaMode === 1 ? PX_PER_LINIA : deltaMode === 2 ? alcariaPagina : 1);
  return -limita(px * (ctrlKey ? PAS_PINCA : PAS_RODETA), -SALT_MAXIM, SALT_MAXIM);
}

/** Vista on caben tots els nodes, amb marge per als controls (el botó Centrar). */
function enquadrament(nodes, amplaria, alcaria) {
  if (!nodes.length) return null;
  let esquerra = Infinity, dalt = Infinity, dreta = -Infinity, baix = -Infinity;
  for (const node of nodes) {
    esquerra = Math.min(esquerra, node.x); dreta = Math.max(dreta, node.x);
    dalt = Math.min(dalt, node.y); baix = Math.max(baix, node.y);
  }
  const ample = dreta - esquerra, alt = baix - dalt;
  const k = limita(Math.min((amplaria - 80) / Math.max(ample, 1), (alcaria - 100) / Math.max(alt, 1)), ZOOM_MIN, 3);
  return { x: amplaria / 2 - (esquerra + ample / 2) * k, y: alcaria / 2 - (dalt + alt / 2) * k, k };
}

const redueixMoviment = () => typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* La vista (desplaçament i escala) viu fora de React. Rodeta, arrossegament i
   pinça la mouen i demanen un fotograma: cap esdeveniment re-renderitza, i els
   que cauen dins del mateix fotograma s'agrupen en un sol pintat. */
function creaVista() {
  const vista = {
    t: { x: 0, y: 0, k: 1 },
    pinta: null,         // el posa l'efecte de pintat del canvas
    tocada: false,       // l'usuari ja l'ha moguda: no se li enquadra pel seu compte
    punters: new Map(),  // pointerId → posició dins del canvas
    gest: null,          // { tipus: 'pan', … } o { tipus: 'pinca', … }
  };
  const rodeta = { log: 0, x: 0, y: 0 };
  let fotograma = 0;
  let animacio = 0;
  const pintaAra = () => {
    fotograma = 0;
    if (rodeta.log) {
      vista.t = zoomSobre(vista.t, Math.exp(rodeta.log), rodeta.x, rodeta.y);
      rodeta.log = 0;
    }
    vista.pinta?.();
  };
  const paraAnimacio = () => {
    if (animacio) cancelAnimationFrame(animacio);
    animacio = 0;
  };
  vista.demana = () => { if (!fotograma) fotograma = requestAnimationFrame(pintaAra); };
  vista.ara = () => {
    if (fotograma) cancelAnimationFrame(fotograma);
    pintaAra();
  };
  vista.acumula = (log, x, y) => {
    rodeta.log += log;
    rodeta.x = x;
    rodeta.y = y;
    vista.demana();
  };
  vista.zoom = (factor, x, y) => {
    vista.t = zoomSobre(vista.t, factor, x, y);
    vista.demana();
  };
  vista.atura = () => {
    vista.tocada = true;
    paraAnimacio();
  };
  vista.anima = (desti) => {
    paraAnimacio();
    if (redueixMoviment()) {
      vista.t = desti;
      vista.demana();
      return;
    }
    const inici = vista.t;
    let t0 = null;
    const pas = (ara) => {
      t0 ??= ara;
      const p = Math.min(1, (ara - t0) / DURADA_ENQUADRAMENT);
      const e = 1 - (1 - p) ** 3;
      vista.t = {
        x: inici.x + (desti.x - inici.x) * e,
        y: inici.y + (desti.y - inici.y) * e,
        k: inici.k * (desti.k / inici.k) ** e,
      };
      vista.pinta?.();
      animacio = p < 1 ? requestAnimationFrame(pas) : 0;
    };
    animacio = requestAnimationFrame(pas);
  };
  vista.cancela = () => {
    paraAnimacio();
    if (fotograma) cancelAnimationFrame(fotograma);
    fotograma = 0;
  };
  return vista;
}

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
 *   enquadra     quan la simulació para, fa cabre el graf a la vista mentre
 *                 l'usuari no l'haja moguda
 *   seleccio      id del node triat ('' = cap): el tria qui munta el graf
 *                 (mode controlat); sense este prop, el graf el guarda ell
 *   onSeleccio    (id) => avís de cada tria (clic al canvas, selector,
 *                 veïns), en els dos modes
 *   inspector     false amaga el panell superposat: qui munta el graf pinta
 *                 el seu detall (l'Explorador de la Consola). Per això ja no
 *                 hi ha `renderDetall`: el seu únic usuari era l'Explorador.
 * `graf`, `estil`, `forces` i `textos` han de ser estables (constants o memo).
 */
export default function BrainGraph({
  onNodeClick, className = '', graf, estil = ESTIL_WIKI, forces, fletxes = false, textos = TEXTOS_WIKI,
  enquadra = false, seleccio, onSeleccio, inspector = true
}) {
  const nodeSelectId = useId();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  /* T4 (ordre del Mestre, 260930) · selecció controlada opcional. La Wiki
     no passa `seleccio` i tot continua com abans. */
  const [seleccioInterna, setSeleccioInterna] = useState('');
  const controlat = seleccio !== undefined;
  const selectedId = controlat ? (seleccio ?? '') : seleccioInterna;
  const setSelectedId = (id) => {
    if (!controlat) setSeleccioInterna(id);
    onSeleccio?.(id);
  };
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  // Canvia quan el tema canvia: el canvas ha de tornar a resoldre els colors.
  const [tema, setTema] = useState(0);
  const [vista] = useState(creaVista);

  // 1. Extract Data
  const { nodes, links } = useMemo(() => graf ?? grafDeLaWiki(), [graf]);
  const paleta = useMemo(() => ({ ...estil.colors, link: COLORS.link, text: COLORS.text, bg: COLORS.bg }), [estil]);
  const radiDe = (type) => estil.radis[type] || 5;

  useEffect(() => {
    setIsSimulationActive(true);
  }, [nodes, links]);

  const selected = nodes.find(node => node.id === selectedId);
  const neighbours = useMemo(() => {
    if (!selectedId || !inspector) return [];
    return nodes.filter(node => links.some(link =>
      (link.source === selectedId && link.target === node.id) ||
      (link.target === selectedId && link.source === node.id)
    ));
  }, [selectedId, nodes, links, inspector]);

  // 2. Run physics
  const nodesRef = useForceLayout({
    nodes,
    links,
    width: dimensions.width,
    height: dimensions.height,
    isSimulationActive,
    forces,
    onTick: vista.ara,
    onAssentat: () => {
      setIsSimulationActive(false);
      if (!enquadra || vista.tocada) return;
      const desti = enquadrament(nodesRef.current, dimensions.width, dimensions.height);
      if (desti) vista.anima(desti);
    }
  });

  // 3. Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    if (!ctx) return undefined;
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

    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      ctx.save();
      ctx.translate(vista.t.x, vista.t.y);
      ctx.scale(vista.t.k, vista.t.k);
      const k = vista.t.k;
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

    // Canviar la mida del canvas l'esborra: es pinta ara, sense esperar fotograma.
    vista.pinta = render;
    vista.ara();
    return () => { vista.pinta = null; };
  }, [vista, dimensions, links, selectedId, nodesRef, paleta, estil, fletxes, tema]);

  useEffect(() => () => vista.cancela(), [vista]);

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

  /* Abans, cada pas d'arrossegament re-renderitzava i tornava a resoldre els
     colors; per això el canvas seguia el tema de rebot. Ara no hi ha re-render:
     s'escolta el data-theme de l'avantpassat que el porta. Incrustat
     (<soc-de-poble>), el porta l'amfitrió, i closest() no ix del shadow root. */
  useEffect(() => {
    const nus = containerRef.current;
    const arrel = nus?.closest('[data-theme]') ?? nus?.getRootNode?.().host?.closest('[data-theme]');
    if (!arrel || typeof MutationObserver !== 'function') return undefined;
    const observador = new MutationObserver(() => setTema(valor => valor + 1));
    observador.observe(arrel, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observador.disconnect();
  }, []);

  // Interactivity (Pan & Zoom): rodeta sense tecla i pinça del trackpad (Safari: gesturechange).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const puntDe = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, alcaria: rect.height };
    };
    const rodeta = (event) => {
      event.preventDefault();
      vista.atura();
      const punt = puntDe(event);
      const log = logZoomDeRodeta(event, punt.alcaria);
      if (log) vista.acumula(log, punt.x, punt.y);
    };
    let escalaGest = 1;
    const gestInici = (event) => {
      event.preventDefault();
      escalaGest = 1;
    };
    const gestCanvi = (event) => {
      event.preventDefault();
      // En iOS la pinça amb els dits ja arriba pels pointer events.
      if (vista.punters.size > 1 || !event.scale) return;
      vista.atura();
      const punt = puntDe(event);
      vista.acumula(Math.log(event.scale / escalaGest), punt.x, punt.y);
      escalaGest = event.scale;
    };
    canvas.addEventListener('wheel', rodeta, { passive: false });
    canvas.addEventListener('gesturestart', gestInici);
    canvas.addEventListener('gesturechange', gestCanvi);
    canvas.addEventListener('gestureend', gestInici);
    return () => {
      canvas.removeEventListener('wheel', rodeta);
      canvas.removeEventListener('gesturestart', gestInici);
      canvas.removeEventListener('gesturechange', gestCanvi);
      canvas.removeEventListener('gestureend', gestInici);
    };
  }, [vista]);

  const posDe = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const comencaPan = (inici, clic) => {
    vista.gest = { tipus: 'pan', inici, tx: vista.t.x, ty: vista.t.y, clic };
  };
  // Distància i punt mitjà dels dos primers dits.
  const parella = () => {
    const [a, b] = vista.punters.values();
    return { dist: Math.hypot(b.x - a.x, b.y - a.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    vista.atura();
    const pos = posDe(e);
    vista.punters.set(e.pointerId, pos);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.classList.replace('sdp-brain-graph-canvas--grab', 'sdp-brain-graph-canvas--grabbing');
    if (vista.punters.size === 1) comencaPan(pos, true);
    else vista.gest = { tipus: 'pinca', ...parella() };
  };

  const handlePointerMove = (e) => {
    if (!vista.punters.has(e.pointerId)) return;
    const pos = posDe(e);
    vista.punters.set(e.pointerId, pos);
    const gest = vista.gest;
    if (gest?.tipus === 'pinca' && vista.punters.size > 1) {
      const ara = parella();
      if (gest.dist > 0) vista.t = zoomSobre(vista.t, ara.dist / gest.dist, gest.x, gest.y);
      vista.t = { ...vista.t, x: vista.t.x + ara.x - gest.x, y: vista.t.y + ara.y - gest.y };
      Object.assign(gest, ara);
    } else if (gest?.tipus === 'pan') {
      const dx = pos.x - gest.inici.x;
      const dy = pos.y - gest.inici.y;
      if (Math.hypot(dx, dy) >= LLINDAR_CLIC) gest.clic = false;
      vista.t = { ...vista.t, x: gest.tx + dx, y: gest.ty + dy };
    }
    vista.demana();
  };

  const handlePointerUp = (e) => {
    if (!vista.punters.has(e.pointerId)) return;
    const pos = posDe(e);
    const gest = vista.gest;
    vista.punters.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (vista.punters.size === 1) {
      // De la pinça a arrossegar amb el dit que queda, sense bot.
      comencaPan(vista.punters.values().next().value, false);
    } else if (vista.punters.size > 1) {
      vista.gest = { tipus: 'pinca', ...parella() };
    } else {
      vista.gest = null;
      e.currentTarget.classList.replace('sdp-brain-graph-canvas--grabbing', 'sdp-brain-graph-canvas--grab');
      if (e.type !== 'pointercancel' && gest?.tipus === 'pan' && gest.clic
        && Math.hypot(pos.x - gest.inici.x, pos.y - gest.inici.y) < LLINDAR_CLIC) {
        const t = vista.t;
        const escala = Math.min(1.4, Math.max(0.3, Math.sqrt(t.k)));
        const hit = [...nodesRef.current].reverse().find(node =>
          Math.hypot(node.x * t.k + t.x - pos.x, node.y * t.k + t.y - pos.y) <= radiDe(node.type) * escala + 5);
        setSelectedId(hit?.id || '');
        if (hit) onNodeClick?.(hit);
      }
    }
    vista.demana();
  };

  const handleZoomIn = () => {
    vista.atura();
    vista.zoom(1.3, dimensions.width / 2, dimensions.height / 2);
  };
  const handleZoomOut = () => {
    vista.atura();
    vista.zoom(1 / 1.3, dimensions.width / 2, dimensions.height / 2);
  };
  const handleReset = () => {
    vista.atura();
    const desti = enquadrament(nodesRef.current, dimensions.width, dimensions.height);
    if (desti) vista.anima(desti);
  };

  return (
    <div ref={containerRef} className={`sdp-brain-graph-wrapper ${className}`}>
      <canvas
        ref={canvasRef}
        aria-label={textos.canvas}
        width={dimensions.width}
        height={dimensions.height}
        className="sdp-brain-graph-canvas sdp-brain-graph-canvas--grab"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {inspector && <aside className="sdp-brain-graph-inspector" aria-label={textos.inspector}>
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
          <dl>
            <dt>Tipus</dt><dd>{estil.noms[selected.type]}</dd>
            <dt>Identificador</dt><dd>{selected.id}</dd>
            {selected.categoryId && <><dt>Categoria</dt><dd>{nodes.find(node => node.id === selected.categoryId)?.label}</dd></>}
            {selected.tags?.length > 0 && <><dt>Etiquetes</dt><dd>{selected.tags.join(', ')}</dd></>}
            <dt>Connexions</dt><dd>{neighbours.length}</dd>
          </dl>
          <ul>{neighbours.map(node => <li key={node.id}><button type="button" onClick={() => setSelectedId(node.id)}>{node.label}</button></li>)}</ul>
        </> : <p>{textos.buit}</p>}
        <p>{nodes.length} nodes · {links.length} vincles</p>
      </aside>}
      <div className="sdp-brain-graph-controls" role="group" aria-label="Controls del graf">
        <button className="sdp-boto sdp-boto--secundari btn-icon" onClick={() => setIsSimulationActive(!isSimulationActive)} title={isSimulationActive ? 'Pausar simulació' : 'Reprendre simulació'}>
          {isSimulationActive ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="sdp-boto sdp-boto--secundari btn-icon" onClick={handleZoomIn} title="Apropar"><ZoomIn size={18} /></button>
        <button className="sdp-boto sdp-boto--secundari btn-icon" onClick={handleZoomOut} title="Allunyar"><ZoomOut size={18} /></button>
        <button className="sdp-boto sdp-boto--secundari btn-icon" onClick={handleReset} title="Centrar"><Maximize size={18} /></button>
      </div>
    </div>
  );
}
