import { useId, useRef } from 'react';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssPerfilShell from '../../css/diferit-perfil-shell.css?inline';

/**
 * Un bloc de les pàgines del Perfil (El compte, Privacitat i dades, les
 * utilitats): una secció amb el seu H2, que és també el seu nom accessible.
 */
export function BlocPerfil({ titol, children }) {
  const id = useId();
  const arrelPerfilRef = useRef(null);
  useFullDiferit(arrelPerfilRef, 'perfil-shell', cssPerfilShell);
  return (
    <section ref={arrelPerfilRef} className="perfil-compte__bloc" aria-labelledby={id}>
      <h2 id={id} className="perfil-compte__titol">{titol}</h2>
      {children}
    </section>
  );
}

export default BlocPerfil;
