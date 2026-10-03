/**
 * MarcColumna.jsx — el marc d'una columna d'AppGridShell (esquelet comú
 * T4/T8): la capçalera fixa (AppGridColumn), una fila d'eines fixa (selector
 * de categoria, vista, afegit ràpid, el resum de la col·lecció), el cos que
 * fa scroll i, si cal, un peu fix (la BarraResum del mòbil).
 *
 * Llei de Scroll: només el cos es desplaça; la capçalera, les eines i el peu
 * es queden on són. Amb `etiqueta`, el cos és una regió amb nom que es pot
 * enfocar i desplaçar amb el teclat.
 */
export function MarcColumna({ capcalera = null, eines = null, peu = null, etiqueta, children, className }) {
  return (
    <div className={['sdp-marc-columna', className].filter(Boolean).join(' ')}>
      {capcalera ? <div className="sdp-marc-columna__cap">{capcalera}</div> : null}
      {eines ? <div className="sdp-marc-columna__eines">{eines}</div> : null}
      <div className="sdp-marc-columna__cos" role={etiqueta ? 'region' : undefined} aria-label={etiqueta || undefined}
        tabIndex={etiqueta ? 0 : undefined}>
        {children}
      </div>
      {peu ? <div className="sdp-marc-columna__peu">{peu}</div> : null}
    </div>
  );
}
