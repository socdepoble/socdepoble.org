import { Suspense, useState } from 'react';
import { lazyRoute } from '../apps/plataforma/lazyRoute.js';
import { RouteErrorBoundary } from './RouteErrorBoundary.jsx';

const Dialegs = lazyRoute(() => import('../components/universal/DialegsModeracio.jsx'));

// Load on first use and retain the mounted dialogs so closing restores focus.
export default function DialegsModeracioAjornats({ externalConfig, ...props }) {
  const obert = Boolean(props.denuncia?.obert || props.bloqueig?.obert || props.normes?.obert);
  const [activats, setActivats] = useState(obert);
  if (obert && !activats) setActivats(true);
  if (!obert && !activats) return null;
  return <RouteErrorBoundary resetKey="moderacio" externalConfig={externalConfig}>
    <Suspense fallback={null}><Dialegs {...props} /></Suspense>
  </RouteErrorBoundary>;
}
