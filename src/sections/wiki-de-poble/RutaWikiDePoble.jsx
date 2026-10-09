import { lazyRoute } from '../../apps/plataforma/lazyRoute.js';

const WikiDePobleSection = lazyRoute(() => import('./WikiDePobleSection.jsx'));

/* La ruta /wikidepoble: la Wiki, carregada a demanda. Ordre del Mestre,
   261004 («contaminació crítica de rutes/estats entre Gestoria i Wiki»): la
   ruta no coneix cap id ni cap destí de la Gestoria. Una URL vella amb els
   seus ids carrega la Wiki, que la tracta com un ítem desconegut. */
export default function RutaWikiDePoble() {
  return <WikiDePobleSection />;
}
