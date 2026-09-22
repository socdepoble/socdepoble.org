import { useEffect, useRef, useCallback } from 'react';

export default function useForceLayout({ nodes, links, width, height, isSimulationActive, onTick }) {
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const rafRef = useRef(null);
  
  // Forces parameters
  const REPULSION = 800; // Constante Coulomb
  const SPRING_LENGTH = 150;
  const SPRING_FORCE = 0.05;
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
      const GRAVITY = 0.01;
      
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
      if (totalVelocity / n > 2.0) {
         rafRef.current = requestAnimationFrame(tick);
      }
      if (typeof onTick === 'function') onTick();
    };
    
    rafRef.current = requestAnimationFrame(tick);
    
    return () => {
      isRunning = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [nodes, links, width, height, isSimulationActive]);

  return nodesRef;
}
