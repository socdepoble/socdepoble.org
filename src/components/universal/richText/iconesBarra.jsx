/**
 * iconesBarra.jsx · IDEA-59 / P1-72 (ordre del Mestre, 261101, punt 4) · La
 * iconografia pròpia de la barra d'eines de l'Editor Universal.
 *
 * Mateix contracte que les icones de lucide-react que ja fa servir el
 * projecte (les capçaleres de columna, la tornada): una graella de 24 × 24,
 * traç de `currentColor` amb puntes i unions arrodonides, cap color propi
 * (la barra els vist en clar i en fosc amb els seus tokens) i les mateixes
 * propietats (`size`, `strokeWidth`, `aria-hidden`, `focusable`). La barra
 * les pinta totes a 24 px dins de la cel·la tàctil de 48 px
 * (--sdp-bloc-control).
 *
 * El dibuix: cada glif ocupa la mateixa caixa òptica (de 4 a 20), amb el
 * mateix pes de traç i la mateixa alçada de lletra, perquè la fila es llija
 * com un sol joc. La negreta porta el traç una mica més gros (és el que vol
 * dir); els números de la llista, una mica més prims (són menuts).
 */

const BASE = Object.freeze({
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
});

/* Gauntlet 261101 · X-C-notes (C-04) · Cap classe pròpia al glif: no en porta
   cap regla CSS (la barra el vist pel botó). El marca un atribut de dades amb
   el nom del glif (data-icona, el mateix ús que a Pedra Seca), i la classe és
   només la del consumidor, si en passa cap. */
function Icona({ size = 24, strokeWidth = 2, className = '', nom, children, ...props }) {
  return (
    <svg
      {...BASE}
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      data-icona={nom}
      className={className || undefined}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Negreta: una «B» de dos panxes, amb el traç un quart més gros. */
export function IconaNegreta({ strokeWidth = 2, ...props }) {
  return (
    <Icona nom="negreta" strokeWidth={strokeWidth * 1.25} {...props}>
      <path d="M7 5h5.5a3.5 3.5 0 0 1 0 7H7z" />
      <path d="M7 12h6.5a3.5 3.5 0 0 1 0 7H7z" />
    </Icona>
  );
}

/** Cursiva: una «I» inclinada amb les dues gràcies. */
export function IconaCursiva(props) {
  return (
    <Icona nom="cursiva" {...props}>
      <path d="M10.5 5h7" />
      <path d="M6.5 19h7" />
      <path d="M14 5 10 19" />
    </Icona>
  );
}

/** Ratllat: una «S» travessada per la ratlla. */
export function IconaRatllat(props) {
  return (
    <Icona nom="ratllat" {...props}>
      <path d="M16.5 7.25C15.9 5.9 14.3 5 12.2 5 9.6 5 7.75 6.4 7.75 8.4c0 1.4.9 2.3 2.4 2.85" />
      <path d="M14.1 13.2c1.5.6 2.4 1.55 2.4 2.95 0 2-1.9 3.35-4.5 3.35-2.3 0-4.05-.95-4.65-2.5" />
      <path d="M5 12.25h14" />
    </Icona>
  );
}

/** Llista amb pics: tres pics plens i tres ratlles. */
export function IconaLlista(props) {
  return (
    <Icona nom="llista" {...props}>
      <circle cx="5.5" cy="7" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="17" r="1.25" fill="currentColor" stroke="none" />
      <path d="M10 7h10" />
      <path d="M10 12h10" />
      <path d="M10 17h10" />
    </Icona>
  );
}

/** Llista numerada: «1» i «2» davant de les ratlles. */
export function IconaLlistaNumerada({ strokeWidth = 2, ...props }) {
  const prim = strokeWidth * 0.75;
  return (
    <Icona nom="llista-numerada" strokeWidth={strokeWidth} {...props}>
      <path d="M4.5 5.25 6 4.25v5.5" strokeWidth={prim} />
      <path d="M4.25 14.6c.2-.75.85-1.35 1.75-1.35 1 0 1.75.65 1.75 1.5 0 1.45-3.5 2.2-3.5 4h3.6" strokeWidth={prim} />
      <path d="M11 7h9" />
      <path d="M11 12h9" />
      <path d="M11 17h9" />
    </Icona>
  );
}

/** Citació: la barra del marge i tres ratlles de text. */
export function IconaCitacio(props) {
  return (
    <Icona nom="citacio" {...props}>
      <path d="M5.5 5v14" />
      <path d="M10 7.5h9" />
      <path d="M10 12h9" />
      <path d="M10 16.5h6" />
    </Icona>
  );
}

/** Divisor: una ratlla sencera entre dos blocs de text. */
export function IconaDivisor({ strokeWidth = 2, ...props }) {
  const prim = strokeWidth * 0.75;
  return (
    <Icona nom="divisor" strokeWidth={strokeWidth} {...props}>
      <path d="M8 6h8" strokeWidth={prim} />
      <path d="M4 12h16" />
      <path d="M8 18h8" strokeWidth={prim} />
    </Icona>
  );
}

/** O4-CLAUDE-2 · Subtargeta: una caixa de cantons arrodonits amb el títol
 *  (la ratlla de dalt, sencera) i dues línies de text davall. */
export function IconaSubtargeta({ strokeWidth = 2, ...props }) {
  const prim = strokeWidth * 0.75;
  return (
    <Icona nom="subtargeta" strokeWidth={strokeWidth} {...props}>
      <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
      <path d="M7.5 9h9" />
      <path d="M7.5 13h9" strokeWidth={prim} />
      <path d="M7.5 16h6" strokeWidth={prim} />
    </Icona>
  );
}

/** O4-CLAUDE-2 · Targeta incrustada: la targeta del Mur, amb la imatge a
 *  dalt (el sol i la serra) i el títol davall. */
export function IconaTargeta({ strokeWidth = 2, ...props }) {
  const prim = strokeWidth * 0.75;
  return (
    <Icona nom="targeta" strokeWidth={strokeWidth} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M4 12.5h16" />
      <path d="m7 12.5 3-3 2.5 2.5 1.5-1.5 2 2" strokeWidth={prim} />
      <circle cx="15.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M7.5 16.25h9" />
    </Icona>
  );
}

/** B3-2 (Onada R6 · Bloc 3) · Enllaç de la imatge: el quadre d'una foto (la
 *  serra) obert pel cantó de baix a la dreta, on hi ha la baula d'enllaç. */
export function IconaEnllacImatge({ strokeWidth = 2, ...props }) {
  const prim = strokeWidth * 0.75;
  return (
    <Icona nom="enllac-imatge" strokeWidth={strokeWidth} {...props}>
      <path d="M11 18H6.5A2.5 2.5 0 0 1 4 15.5v-9A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V10" />
      <path d="m7 14 3-3 2 2" strokeWidth={prim} />
      <path d="M15.5 13.5h-1a2.5 2.5 0 0 0 0 5h1" />
      <path d="M18.5 13.5h1a2.5 2.5 0 0 1 0 5h-1" />
      <path d="M15.5 16h3" strokeWidth={prim} />
    </Icona>
  );
}

/** Més eines: tres punts en filera («⋯»). */
export function IconaMesEines(props) {
  return (
    <Icona nom="mes-eines" {...props}>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Icona>
  );
}

/** El galló del desplegable d'encapçalaments. */
export function IconaDesplega(props) {
  return (
    <Icona nom="desplega" {...props}>
      <path d="m8 10 4 4 4-4" />
    </Icona>
  );
}
