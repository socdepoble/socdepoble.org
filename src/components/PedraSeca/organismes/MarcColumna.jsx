/**
 * MarcColumna.jsx — el marc d'una columna d'AppGridShell (esquelet comú
 * T4/T8): la capçalera fixa (AppGridColumn), una fila d'eines fixa (selector
 * de categoria, vista, afegit ràpid, el resum de la col·lecció), el cos que
 * fa scroll i, si cal, un peu fix (la BarraResum del mòbil).
 *
 * Llei de Scroll: només el cos es desplaça; la capçalera, les eines i el peu
 * es queden on són. Amb `etiqueta`, el cos és una regió amb nom que es pot
 * enfocar i desplaçar amb el teclat.
 *
 * Correcció F3 (261006) · `avis` (opcional): un avís de la pantalla (per
 * exemple, per què ara no es pot vendre) DINS del marc, com a primer fill del
 * cos: davall de la capçalera i de les eines, i la capçalera no baixa (les
 * barres de capçalera de les columnes veïnes continuen alineades). Va al cos
 * perquè la Llei de Scroll fixa només la capçalera, les eines i el peu: un
 * avís és contingut i, en el mòbil, fix es menjaria l'espai del cos. És el
 * mateix lloc on les columnes pròpies de les apps el pinten. Sense embolcall
 * propi: l'Alerta ja porta el seu marge. Sense `avis` (o si el node no pinta
 * res), el DOM de sempre.
 */
export function MarcColumna({ capcalera = null, eines = null, peu = null, avis = null, etiqueta, children, className }) {
  return (
    <div className={['sdp-marc-columna', className].filter(Boolean).join(' ')}>
      {capcalera ? <div className="sdp-marc-columna__cap">{capcalera}</div> : null}
      {eines ? <div className="sdp-marc-columna__eines">{eines}</div> : null}
      <div className="sdp-marc-columna__cos" role={etiqueta ? 'region' : undefined} aria-label={etiqueta || undefined}
        tabIndex={etiqueta ? 0 : undefined}>
        {avis}
        {children}
      </div>
      {peu ? <div className="sdp-marc-columna__peu">{peu}</div> : null}
    </div>
  );
}
