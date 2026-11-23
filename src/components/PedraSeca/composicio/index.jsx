import React, { useRef } from 'react';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';

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

const ALINEACIONS_FILA = Object.freeze({
  center: 'sdp-align-center',
  start: 'sdp-align-start',
  end: 'sdp-align-end',
  stretch: 'sdp-align-stretch',
});

const JUSTIFICACIONS_FILA = Object.freeze({
  center: 'sdp-justify-center',
  'flex-start': 'sdp-justify-flex-start',
  'flex-end': 'sdp-justify-flex-end',
  'space-between': 'sdp-justify-space-between',
});

/**
 * Fila (Row)
 * Un contenidor flexible horitzontal on tot es posa de costat amb un espaiat.
 */
export const Fila = ({ children, gap = 4, wrap = true, align = 'center', justify = 'flex-start', className = '', as: Component = 'div', ...props }) => {
  const flexWrap = wrap ? 'sdp-wrap' : '';
  /* Gauntlet v1.2.16 (L5-01, L6-P1-02; Llei del Píxel) · Un valor fora del mapa
     ('flex-end', 'flex-start'…) no porta cap classe i la fila queda en stretch,
     com a ded51467c, on la classe composta amb el valor no tenia cap regla. */
  const alignClass = ALINEACIONS_FILA[align] ?? '';
  const justifyClass = JUSTIFICACIONS_FILA[justify] || 'sdp-justify-flex-start';
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
  const ref = useRef(null);
  const gridTemplateColumns = columns === 'auto'
    ? `repeat(auto-fit, minmax(${minWidth}, 1fr))`
    : `repeat(${columns}, 1fr)`;
  usePropietatsCss(ref, { 'grid-template-columns': gridTemplateColumns });

  return (
    <Component ref={ref} className={`sdp-graella ${ESPAIS.graella[gap] || ''} ${className}`} {...props}>
      {children}
    </Component>
  );
};

/**
 * Costat (Sidebar / Sidebar-content layout)
 * Dos elements on el primer és la barra lateral i el segon el contingut, o viceversa, segons Container Queries.
 */
export const Costat = ({ children, width = '250px', gap = 4, reversed = false, className = '', ...props }) => {
  const ref = useRef(null);
  const [sidebar, content] = React.Children.toArray(children);
  const gridTemplateColumns = reversed
    ? `1fr ${width}`
    : `${width} 1fr`;
  usePropietatsCss(ref, { 'grid-template-columns': gridTemplateColumns });

  return (
    <div ref={ref} className={`sdp-costat ${ESPAIS.costat[gap] || ''} ${className}`} {...props}>
      {reversed ? <>{content}{sidebar}</> : <>{sidebar}{content}</>}
    </div>
  );
};

/**
 * Centre (Center / Wrapper)
 * Contenidor neutre a tota l'amplada (width: 100%, box-sizing: border-box). Des de R32.47 no aplica --sdp-measure.
 * v1.2.23 · R2E-07 (Gauntlet R2) · Abans deia «amplada màxima (measure editorial)», que ja no és cert (components.css).
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
const CLASSES_OMBRA_SUPERFICIE = Object.freeze({
  1: 'sdp-ombra-1',
  2: 'sdp-ombra-2',
  3: 'sdp-ombra-3',
});

const CLASSES_RADI_SUPERFICIE = Object.freeze({
  s: 'sdp-radi-s',
  m: 'sdp-radi-m',
  g: 'sdp-radi-g',
  pastilla: 'sdp-radi-pastilla',
});

export const Superficie = ({ children, eleva = 1, radi = 'm', className = '', as: Component = 'div', ...props }) => {
  const ombra = Object.hasOwn(CLASSES_OMBRA_SUPERFICIE, eleva) ? CLASSES_OMBRA_SUPERFICIE[eleva] : '';
  const vora = Object.hasOwn(CLASSES_RADI_SUPERFICIE, radi) ? CLASSES_RADI_SUPERFICIE[radi] : '';
  const classes = ['sdp-superficie', ombra, vora, className].filter(Boolean).join(' ');
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};
