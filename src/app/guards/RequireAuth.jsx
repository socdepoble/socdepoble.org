// src/app/guards/RequireAuth.jsx
import { useRef } from 'react';
import { Navigate, useLocation } from '../contexts/RouterContext';
import { useSession, ESTAT } from '../contexts/SessionContext';

/** Pantalla d'espera. Mai cap redirecció mentre l'estat és 'comprovant'. */
function Comprovant() {
  return (
    <div className="sdp-route-loading-screen" role="status" aria-live="polite">
      <span className="sr-only">Comprovant la sessió…</span>
    </div>
  );
}

function SenseRol({ rol }) {
  return (
    <div className="sdp-buit">
      <div className="sdp-alerta sdp-alerta--error" role="alert">
        <h3>Accés restringit</h3>
        <p>Esta àrea necessita el rol <strong>{rol}</strong>. El teu compte no el té.</p>
      </div>
    </div>
  );
}

/**
 * Barrera de client. NO és seguretat: la seguretat és la RLS de Sollutia.
 * Açò evita muntar vistes que faran 42501 i filtrar-ne l'estructura.
 *
 * `?tornar=` en lloc de state del router: sobreviu a una recàrrega i al
 * viatge d'anada i tornada de l'OAuth, que és quan més falta fa.
 */
export function RequireAuth({ children, rol = null, fallback = '/registre' }) {
  const { currentUser, estat, rol: rolActual } = useSession();
  const location = useLocation();
  /* Compte al qual ja s'ha mostrat el contingut. La renovació del JWT torna a llegir
     el rol ('comprovant' amb el mateix usuari): desmuntar els fills perdria el que
     s'hi estava fent. Un compte nou sí que espera. */
  const mostrat = useRef(null);

  if (estat === ESTAT.COMPROVANT) {
    if (currentUser?.id != null && mostrat.current === currentUser.id) return children;
    return <Comprovant />;
  }

  if (!currentUser) {
    mostrat.current = null;
    const desti = location.pathname + (location.search ? `?${location.search}` : '');
    return <Navigate to={`${fallback}?tornar=${encodeURIComponent(desti)}`} replace />;
  }

  if (rol) {
    if (rolActual === null) return <Comprovant />;   // rol encara en vol
    if (rolActual !== rol) { mostrat.current = null; return <SenseRol rol={rol} />; }
  }

  mostrat.current = currentUser.id;
  return children;
}
