import { useEffect, useRef, useCallback } from 'react';

/* Forces per defecte: les del graf de la Wiki. `forces` les pot canviar
   (repulsio, llargaria, molla, gravetat) sense tocar el graf de la Wiki. */
const FORCES_PER_DEFECTE = Object.freeze({ repulsio: 800, llargaria: 150, molla: 0.05, gravetat: 0.01 });

/* Gauntlet 261022_0225 (crítica Claude, F1) · La repulsió de tots amb tots és
   O(n²): amb 7.000 nodes són 24,5 milions de parelles per fotograma (5–9 fps).
   Fins a LLINDAR_EXACTE nodes es fa la suma exacta de sempre, i els grafs de
   la Wiki i de la Consola es mouen igual que abans. Per damunt, Barnes-Hut:
   un quadtree on cada grup de nodes prou llunyà empenta com un sol node pesat
   al seu centre de massa. Amb θ² < 1/2, la cel·la que conté el node mai no
   s'aproxima. Amb θ = 0,6, l'error mitjà de la força és de l'1–2,5 %, el graf
   s'assenta en els mateixos fotogrames que amb la suma exacta (133 per 128
   amb 2.000 nodes; amb θ = 0,7 en calien 218), i 7.000 nodes passen de 85 ms
   a 7–9 ms per tic. Sense cap dependència. */
export const LLINDAR_EXACTE = 1000;
const THETA2 = 0.36;           // θ = 0,6 (d3-force fa servir 0,9)
const PROFUNDITAT_MAXIMA = 24; // amb nodes al mateix punt, el quadtree no es dividix sense fi

function repulsioExacta(currentNodes, REPULSION) {
  const n = currentNodes.length;
  // 1. Repulsión entre todos los nodos (Coulomb)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = currentNodes[i];
      const b = currentNodes[j];

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distSq = dx * dx + dy * dy;

      if (distSq === 0) {
        dx = (Math.random() - 0.5) * 10;
        dy = (Math.random() - 0.5) * 10;
        distSq = dx * dx + dy * dy;
      }

      // Fuerza inversamente proporcional a la distancia al cuadrado (Coulomb)
      const dist = Math.sqrt(distSq);
      const force = REPULSION / Math.max(distSq, 100);

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }
}

/* Les cel·les del quadtree viuen en arrays tipats que es reaprofiten d'un tic
   a l'altre: cap objecte nou per fotograma. Una cel·la és o bé interna
   (`fills`: la primera de les seues quatre filles, consecutives) o bé fulla
   (`cossos`: el primer node de la seua llista, encadenada per `seguents`).
   REV-ESTRES-6 · Es queden de mòdul i no s'alliberen: uns 1,5 MB després d'un
   graf de 7.000 nodes. Alliberar-los amb un graf xicotet faria que dos grafs
   oberts alhora (un de gran i un de xicotet) els tornaren a demanar a cada
   fotograma. */
const CAMPS_REALS = ['ox', 'oy', 'mida', 'massa', 'sx', 'sy'];
const CAMPS_ENTERS = ['fills', 'cossos'];
let cel = null;
let seguents = new Int32Array(0);
const pila = new Int32Array(4 * PROFUNDITAT_MAXIMA + 8);

function amplia(previ, cap) {
  const nou = { cap };
  for (const camp of CAMPS_REALS) { nou[camp] = new Float64Array(cap); if (previ) nou[camp].set(previ[camp]); }
  for (const camp of CAMPS_ENTERS) { nou[camp] = new Int32Array(cap); if (previ) nou[camp].set(previ[camp]); }
  return nou;
}

function repulsioBarnesHut(nodes, repulsio) {
  const n = nodes.length;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    const { x, y } = nodes[i];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  /* REV-ESTRES-6 · Tots al mateix punt (amplada 0 en muntar, o el mateix x,y
     per a tots): una sola fulla encadenada calcularia cada parella dues
     vegades. La suma exacta en fa la meitat, i el tic següent ja els separa. */
  if (x1 - x0 < 1 && y1 - y0 < 1) { repulsioExacta(nodes, repulsio); return; }
  if (!cel || cel.cap < 4 * n + 1) cel = amplia(null, 4 * n + 1);
  if (seguents.length < n) seguents = new Int32Array(n);
  let usades = 0;
  const nova = (x, y, mida) => {
    if (usades === cel.cap) cel = amplia(cel, cel.cap * 2);
    const k = usades++;
    cel.ox[k] = x; cel.oy[k] = y; cel.mida[k] = mida;
    cel.massa[k] = 0; cel.sx[k] = 0; cel.sy[k] = 0;
    cel.fills[k] = -1; cel.cossos[k] = -1;
    return k;
  };
  const quadrant = (c, x, y) => {
    const meitat = cel.mida[c] / 2;
    return (x >= cel.ox[c] + meitat ? 1 : 0) | (y >= cel.oy[c] + meitat ? 2 : 0);
  };

  nova(x0, y0, Math.max(x1 - x0, y1 - y0, 1));
  for (let i = 0; i < n; i++) {
    const x = nodes[i].x, y = nodes[i].y;
    let c = 0;
    for (let profunditat = 0; ; profunditat++) {
      cel.massa[c]++; cel.sx[c] += x; cel.sy[c] += y;
      if (cel.fills[c] < 0) {
        const b = cel.cossos[c];
        if (b < 0 || profunditat >= PROFUNDITAT_MAXIMA) { seguents[i] = b; cel.cossos[c] = i; break; }
        // Una fulla amb un node: es dividix en quatre i el node baixa a la seua.
        const meitat = cel.mida[c] / 2;
        const ox = cel.ox[c], oy = cel.oy[c];
        const primer = nova(ox, oy, meitat);
        nova(ox + meitat, oy, meitat);
        nova(ox, oy + meitat, meitat);
        nova(ox + meitat, oy + meitat, meitat);
        cel.fills[c] = primer;
        cel.cossos[c] = -1;
        const k = primer + quadrant(c, nodes[b].x, nodes[b].y);
        cel.massa[k] = 1; cel.sx[k] = nodes[b].x; cel.sy[k] = nodes[b].y;
        cel.cossos[k] = b; seguents[b] = -1;
      }
      c = cel.fills[c] + quadrant(c, x, y);
    }
  }

  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    const ax = a.x, ay = a.y;
    let fx = 0, fy = 0, cim = 0;
    pila[cim++] = 0;
    while (cim) {
      const c = pila[--cim];
      const massa = cel.massa[c];
      if (!massa) continue;
      const primer = cel.fills[c];
      if (primer < 0) {
        // Fulla: la força exacta de cada node, com a repulsioExacta.
        for (let b = cel.cossos[c]; b >= 0; b = seguents[b]) {
          if (b === i) continue;
          let dx = nodes[b].x - ax;
          let dy = nodes[b].y - ay;
          let distSq = dx * dx + dy * dy;
          if (distSq === 0) {
            dx = (Math.random() - 0.5) * 10;
            dy = (Math.random() - 0.5) * 10;
            distSq = dx * dx + dy * dy;
          }
          const dist = Math.sqrt(distSq);
          const force = repulsio / Math.max(distSq, 100);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
        continue;
      }
      const dx = cel.sx[c] / massa - ax;
      const dy = cel.sy[c] / massa - ay;
      const distSq = dx * dx + dy * dy;
      const mida = cel.mida[c];
      if (mida * mida < THETA2 * distSq) {
        // Prou lluny: tota la cel·la empenta des del seu centre de massa.
        const dist = Math.sqrt(distSq);
        const force = (repulsio * massa) / Math.max(distSq, 100);
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      } else {
        pila[cim++] = primer;
        pila[cim++] = primer + 1;
        pila[cim++] = primer + 2;
        pila[cim++] = primer + 3;
      }
    }
    a.vx -= fx;
    a.vy -= fy;
  }
}

/** La repulsió d'un tic: suma les velocitats de cada node (no en mou cap). */
export function aplicaRepulsio(nodes, repulsio) {
  if (nodes.length <= LLINDAR_EXACTE) repulsioExacta(nodes, repulsio);
  else repulsioBarnesHut(nodes, repulsio);
}

/* `onAssentat` s'avisa quan la simulació para sola (els nodes ja no es mouen):
   és el moment d'enquadrar el graf sense perseguir nodes en moviment. */
export default function useForceLayout({ nodes, links, width, height, isSimulationActive, onTick, onAssentat, forces }) {
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const rafRef = useRef(null);
  const onTickRef = useRef(onTick);
  const onAssentatRef = useRef(onAssentat);
  useEffect(() => {
    onTickRef.current = onTick;
    onAssentatRef.current = onAssentat;
  }, [onTick, onAssentat]);

  // Forces parameters
  const REPULSION = forces?.repulsio ?? FORCES_PER_DEFECTE.repulsio; // Constante Coulomb
  const SPRING_LENGTH = forces?.llargaria ?? FORCES_PER_DEFECTE.llargaria;
  const SPRING_FORCE = forces?.molla ?? FORCES_PER_DEFECTE.molla;
  const GRAVITY = forces?.gravetat ?? FORCES_PER_DEFECTE.gravetat;
  const DAMPING = 0.85; // Fricción para que pare

  const initPositions = useCallback(() => {
    const existingMap = new Map((nodesRef.current || []).map(n => [n.id, n]));
    const count = nodes.length;
    const currentNodes = nodes.map((node, i) => {
      const existing = existingMap.get(node.id);
      if (existing && existing.x !== undefined) {
        return { ...node, x: existing.x, y: existing.y, vx: existing.vx || 0, vy: existing.vy || 0 };
      }
      const angle = (i / count) * 2 * Math.PI;
      const r = Math.min(width, height) * 0.3;
      return {
        ...node,
        x: node.x !== undefined ? node.x : width / 2 + Math.cos(angle) * r,
        y: node.y !== undefined ? node.y : height / 2 + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      };
    });

    nodesRef.current = currentNodes;
    linksRef.current = links;
  }, [nodes, links, width, height]);

  useEffect(() => {
    initPositions();
  }, [initPositions]);

  useEffect(() => {
    if (!isSimulationActive) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let isRunning = true;
    
    const tick = () => {
      if (!isRunning) return;
      
      const currentNodes = nodesRef.current;
      const currentLinks = linksRef.current;
      const n = currentNodes.length;

      // 1. Repulsió (F1): exacta fins a LLINDAR_EXACTE nodes, Barnes-Hut per damunt.
      aplicaRepulsio(currentNodes, REPULSION);

      const byId = new Map(currentNodes.map(node => [node.id, node]));
      // 2. Atracción por los enlaces (Springs)
      for (const link of currentLinks) {
        const sourceNode = byId.get(link.source);
        const targetNode = byId.get(link.target);
        
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Ley de Hooke: fuerza proporcional a la elongación respecto a la longitud ideal
          const diff = dist - SPRING_LENGTH;
          const force = diff * SPRING_FORCE;
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      }
      
      // 3. Atracción al centro de gravedad para que no se dispersen al infinito
      const centerX = width / 2;
      const centerY = height / 2;

      // 4. Actualizar posiciones
      let totalVelocity = 0;
      for (let i = 0; i < n; i++) {
        const a = currentNodes[i];
        
        // Atracción gravitatoria suave
        a.vx += (centerX - a.x) * GRAVITY;
        a.vy += (centerY - a.y) * GRAVITY;
        
        // Aplicar fricción/amortiguación
        a.vx *= DAMPING;
        a.vy *= DAMPING;
        
        // Prevenir velocidades extremas (clamp)
        a.vx = Math.max(-30, Math.min(30, a.vx));
        a.vy = Math.max(-30, Math.min(30, a.vy));
        
        // Actualizar posición
        a.x += a.vx;
        a.y += a.vy;
        
        totalVelocity += Math.abs(a.vx) + Math.abs(a.vy);
      }
      
      // Disparar un re-render o comunicar que la posición ha cambiado
      const enMoviment = totalVelocity / n > 2.0;
      rafRef.current = enMoviment ? requestAnimationFrame(tick) : null;
      if (typeof onTickRef.current === 'function') onTickRef.current();
      if (!enMoviment && typeof onAssentatRef.current === 'function') onAssentatRef.current();
    };
    
    rafRef.current = requestAnimationFrame(tick);
    
    return () => {
      isRunning = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [nodes, links, width, height, isSimulationActive, REPULSION, SPRING_LENGTH, SPRING_FORCE, GRAVITY]);

  return nodesRef;
}
