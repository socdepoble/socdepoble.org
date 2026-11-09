import { Suspense, lazy } from 'react';
import { Smartphone } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { Carregant, MollaPa } from '../../components/PedraSeca/index.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { TargetaConsola } from './peces.jsx';
import { BOTIGUES_SISTEMA_META as meta } from '../botigues/botiguesSistemaMeta.js';

const BotiguesSistema = lazy(() => import('../botigues/BotiguesSistema.jsx'));

export function SeccioBotiguesConsola() {
  return <section aria-label="Botigues i verificadors"><h2>Botigues i verificadors</h2><div className="sdp-card-grid">
    <TargetaConsola icona={Smartphone} titol={meta.title} subtitol={meta.subtitle} entradilla={meta.lead} creat={meta.creat} a={meta.ruta} imatge={meta.image} imatgeAlt={meta.imageAlt} />
  </div></section>;
}

export function PaginaBotiguesConsola({ cimRef }) {
  return <UniversalPage title={meta.title} subtitle={meta.subtitle} lead={meta.lead} heroImage={meta.image} heroAlt={meta.imageAlt} chrome="system" traduccio={false} llenguaDelContingut="ca" {...dataHoraDeBarra({ creat: meta.creat })}>
    <div ref={cimRef}><MollaPa passos={[{ etiqueta: 'Consola', a: '/consola' }, { etiqueta: meta.title }]} /></div>
    <Suspense fallback={<Carregant etiqueta="Carregant botigues i verificadors…" />}><BotiguesSistema /></Suspense>
  </UniversalPage>;
}
