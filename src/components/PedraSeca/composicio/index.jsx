import React from 'react';

/**
 * Pila (Stack)
 * Un contenidor flexible vertical on tot apila cap avall amb un espaiat (gap).
 */
export const Pila = ({ children, gap = 4, className = '', as: Component = 'div', ...props }) => {
  return (
    <Component className={`sdp-pila sdp-gap-${gap} ${className}`} {...props}>
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
    <Component className={`sdp-fila sdp-gap-${gap} ${flexWrap} ${alignClass} ${justifyClass} ${className}`} {...props}>
      {children}
    </Component>
  );
};

/**
 * Graella (Grid)
 * Contenidor Grid amb Container Queries per defecte per ser auto-responsive.
 */
export const Graella = ({ children, gap = 4, columns = 'auto', minWidth = '300px', className = '', as: Component = 'div', ...props }) => {
  const gridStyle = columns === 'auto' 
    ? { gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))` } 
    : { gridTemplateColumns: `repeat(${columns}, 1fr)` };
    
  return (
    <Component className={`sdp-graella sdp-gap-${gap} ${className}`} style={gridStyle} {...props}>
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
    <div className={`sdp-costat sdp-gap-${gap} ${className}`} style={layoutStyle} {...props}>
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
