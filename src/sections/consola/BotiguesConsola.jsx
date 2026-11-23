import { Suspense, lazy } from 'react';
import { Smartphone } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { Carregant, MollaPa } from '../../components/PedraSeca/index.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { TargetaConsola } from './peces.jsx';
import { tca, useIdiomaConsola } from './i18nConsolaA11y.js';
import { BOTIGUES_SISTEMA_META as meta } from '../botigues/botiguesSistemaMeta.js';

const BotiguesSistema = lazy(() => import('../botigues/BotiguesSistema.jsx'));

export function TargetaBotiguesConsola({ headingLevel = 'h3' } = {}) {
  return <TargetaConsola icona={Smartphone} titol={meta.title} subtitol={meta.subtitle} entradilla={meta.lead} creat={meta.creat} a={meta.ruta} imatge={meta.image} imatgeAlt={meta.imageAlt} headingLevel={headingLevel} />;
}

export function SeccioBotiguesConsola() {
  const idioma = useIdiomaConsola();
  return <section aria-label={tca(idioma, 'botiguesIVerificadors')}><h3>Botigues i verificadors</h3><div className="sdp-card-grid">
    <TargetaBotiguesConsola headingLevel="h4" />
  </div></section>;
}

export function PaginaBotiguesConsola({ cimRef }) {
  return <UniversalPage title={meta.title} subtitle={meta.subtitle} lead={meta.lead} heroImage={meta.image} heroAlt={meta.imageAlt} chrome="system" traduccio={false} llenguaDelContingut="ca" {...dataHoraDeBarra({ creat: meta.creat })}>
    <div ref={cimRef}><MollaPa passos={[{ etiqueta: 'Consola', a: '/consola' }, { etiqueta: meta.title }]} /></div>
    <Suspense fallback={<Carregant etiqueta="Carregant botigues i verificadors…" />}><BotiguesSistema /></Suspense>
  </UniversalPage>;
}
