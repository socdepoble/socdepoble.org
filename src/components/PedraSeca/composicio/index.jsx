import React from 'react';

// Variants de cada component: mateixa escala pública, classes explícites i auditables.
const ESPAIS = {
  pila: { 0: 'sdp-pila--espai-0', 1: 'sdp-pila--espai-1', 2: 'sdp-pila--espai-2', 3: 'sdp-pila--espai-3', 4: 'sdp-pila--espai-4', 5: 'sdp-pila--espai-5', 6: 'sdp-pila--espai-6', 8: 'sdp-pila--espai-8', 10: 'sdp-pila--espai-10', 12: 'sdp-pila--espai-12', 16: 'sdp-pila--espai-16', 20: 'sdp-pila--espai-20' },
  fila: { 0: 'sdp-fila--espai-0', 1: 'sdp-fila--espai-1', 2: 'sdp-fila--espai-2', 3: 'sdp-fila--espai-3', 4: 'sdp-fila--espai-4', 5: 'sdp-fila--espai-5', 6: 'sdp-fila--espai-6', 8: 'sdp-fila--espai-8', 10: 'sdp-fila--espai-10', 12: 'sdp-fila--espai-12', 16: 'sdp-fila--espai-16', 20: 'sdp-fila--espai-20' },
  graella: { 0: 'sdp-graella--espai-0', 1: 'sdp-graella--espai-1', 2: 'sdp-graella--espai-2', 3: 'sdp-graella--espai-3', 4: 'sdp-graella--espai-4', 5: 'sdp-graella--espai-5', 6: 'sdp-graella--espai-6', 8: 'sdp-graella--espai-8', 10: 'sdp-graella--espai-10', 12: 'sdp-graella--espai-12', 16: 'sdp-graella--espai-16', 20: 'sdp-graella--espai-20' },
  costat: { 0: 'sdp-costat--espai-0', 1: 'sdp-costat--espai-1', 2: 'sdp-costat--espai-2', 3: 'sdp-costat--espai-3', 4: 'sdp-costat--espai-4', 5: 'sdp-costat--espai-5', 6: 'sdp-costat--espai-6', 8: 'sdp-costat--espai-8', 10: 'sdp-costat--espai-10', 12: 'sdp-costat--espai-12', 16: 'sdp-costat--espai-16', 20: 'sdp-costat--espai-20' }
};


/**
 * Pila (Stack)
 * Un contenidor flexible vertical on tot apila cap avall amb un espaiat (gap).
 */
export const Pila = ({ children, gap = 4, className = '', as: Component = 'div', ...props }) => {
  return (
    <Component className={`sdp-pila ${ESPAIS.pila[gap] || ''} ${className}`} {...props}>
      {children}
    </Component>
  );
};

/**
 * Fila (Row)
 * Un contenidor flexible horitzontal on tot es posa de costat amb un espaiat.
 */
export const Fila = ({ children, gap = 4, wrap = true, align = 'center', justify = 'flex-start', className = '', as: Component = 'div', ...props }) => {
  const flexWrap = wrap ? 'sdp-wrap' : '';
  const alignClass = `sdp-align-${align}`;
  const justifyClass = `sdp-justify-${justify}`;
  return (
    <Component className={`sdp-fila ${ESPAIS.fila[gap] || ''} ${flexWrap} ${alignClass} ${justifyClass} ${className}`} {...props}>
      {children}
    </Component>
  );
};

/**
 * Accions (bloc d'accions)
 * IDEA-26 i IDEA-27 (ordre del Mestre, 261025) · Els botons van DESPRÉS del
 * text que els explica, en un bloc propi i centrat que respira sempre el
 * mateix (24px) del text de dalt i del de baix. Un títol mai porta un botó
 * enganxat: primer el paràgraf que diu per a què és, després <Accions>.
 */
export const Accions = React.forwardRef(function Accions({ children, className = '', as: Component = 'div', ...props }, ref) {
  return (
    <Component ref={ref} className={`sdp-accions ${className}`} {...props}>
      {children}
    </Component>
  );
});

/**
 * Graella (Grid)
 * Contenidor Grid amb Container Queries per defecte per ser auto-responsive.
 */
export const Graella = ({ children, gap = 4, columns = 'auto', minWidth = '300px', className = '', as: Component = 'div', ...props }) => {
  const gridStyle = columns === 'auto' 
    ? { gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))` } 
    : { gridTemplateColumns: `repeat(${columns}, 1fr)` };
    
  return (
    <Component className={`sdp-graella ${ESPAIS.graella[gap] || ''} ${className}`} style={gridStyle} {...props}>
      {children}
    </Component>
  );
};

/**
 * Costat (Sidebar / Sidebar-content layout)
 * Dos elements on el primer és la barra lateral i el segon el contingut, o viceversa, segons Container Queries.
 */
export const Costat = ({ children, width = '250px', gap = 4, reversed = false, className = '', ...props }) => {
  const [sidebar, content] = React.Children.toArray(children);
  const layoutStyle = reversed 
    ? { gridTemplateColumns: `1fr ${width}` } 
    : { gridTemplateColumns: `${width} 1fr` };
    
  return (
    <div className={`sdp-costat ${ESPAIS.costat[gap] || ''} ${className}`} style={layoutStyle} {...props}>
      {reversed ? <>{content}{sidebar}</> : <>{sidebar}{content}</>}
    </div>
  );
};

/**
 * Centre (Center / Wrapper)
 * Contenidor per centrar contingut amb una amplada màxima (measure editorial).
 */
export const Centre = ({ children, className = '', ...props }) => {
  return (
    <div className={`sdp-centre ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Superficie (Surface)
 * Contenidor base per a targetes o àrees elevades.
 */
export const Superficie = ({ children, eleva = 1, radi = 'm', className = '', as: Component = 'div', ...props }) => {
  return (
    <Component className={`sdp-superficie sdp-ombra-${eleva} sdp-radi-${radi} ${className}`} {...props}>
      {children}
    </Component>
  );
};
