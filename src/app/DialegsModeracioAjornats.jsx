import { Suspense, useState } from 'react';
import { lazyRoute } from '../apps/plataforma/lazyRoute.js';
import { useEnLinia } from '../components/universal/connexio/useEnLinia.js';
import { RouteErrorBoundary } from './RouteErrorBoundary.jsx';

const Dialegs = lazyRoute(() => import('../components/universal/DialegsModeracio.jsx'));

// Load on first use and retain the mounted dialogs so closing restores focus.
export default function DialegsModeracioAjornats({ externalConfig, ...props }) {
  const obert = Boolean(props.denuncia?.obert || props.bloqueig?.obert || props.normes?.obert);
  const [activats, setActivats] = useState(obert);
  const enLinia = useEnLinia();
  if (obert && !activats) setActivats(true);
  if (!obert && !activats) return null;
  /* Onada R29 · R29-RUT-05 · Esta barrera només naix d'un gest (Denunciar, Bloquejar o les normes): si el
     tros no arriba, el focus va a l'avís, que pot quedar al final de la columna, i la connexió decidix
     si «Recarrega l’aplicació» es pot prémer. */
  return <RouteErrorBoundary resetKey="moderacio" externalConfig={externalConfig} enLinia={enLinia} prenElFocus>
    <Suspense fallback={null}><Dialegs {...props} /></Suspense>
  </RouteErrorBoundary>;
}
