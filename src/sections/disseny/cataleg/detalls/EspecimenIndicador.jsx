import { useState } from 'react';
import { Users, CalendarDays, Home, TreePine, BookOpen } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { UniversalIndicatorCard } from '../../../../components/PedraSeca/index.js';

const ESTADISTIQUES = [
  [CalendarDays, '776', 'Anys d’història'],
  [Home, '2.341', 'Habitatges'],
  [TreePine, '29,4', 'Km² de natura'],
  [BookOpen, '142', 'Documents històrics']
];

export default function EspecimenIndicador() {
  const [actiu, setActiu] = useState('mur');
  return (
    <Especimen id="indicador" nom="UniversalIndicatorCard · estadístiques" fitxer="src/components/PedraSeca/organismes/UniversalIndicatorCard.jsx"
      descripcio="Targeta indicadora: un botó amb icona, títol i subtítol que marca un estat o filtre actiu (aria-pressed). Davall, la maqueta de targetes d'estadística (stat-card) heretada de la pàgina de Fonaments."
      contracte={[
        ['icon', 'node', '—', 'Icona lucide.'],
        ['title / subtitle', 'string', '—', 'Espans dins del botó: un botó només admet contingut de frase.'],
        ['active / onClick', 'boolean / fn', '—', 'aria-pressed i estil .active.'],
        ['iconColor', 'string', '—', 'Escriu --custom-icon-color; usa un token, no un hex.']
      ]}
      a11y={['<button> natiu amb aria-pressed: l’estat actiu es llig.']}
      fes={['Per a filtres o panells d’un quadre de comandament.']}
      noFacis={['h3 o p dins del botó: no és contingut permés.']}>
      <div className="sdp-especimen__fila">
        <UniversalIndicatorCard icon={<Users size={24} />} title="Mur" subtitle="12 publicacions" active={actiu === 'mur'} onClick={() => setActiu('mur')} />
        <UniversalIndicatorCard icon={<CalendarDays size={24} />} title="Esdeveniments" subtitle="3 esta setmana" active={actiu === 'events'} onClick={() => setActiu('events')} />
        <UniversalIndicatorCard icon={<Home size={24} />} title="Pobles" subtitle="7 connectats" active={actiu === 'pobles'} onClick={() => setActiu('pobles')} />
      </div>

      <h4>Targeta d’estadística (maqueta)</h4>
      <div className="stat-card">
        <div className="stat-icon"><Users size={16} aria-hidden="true" /></div>
        <div className="stat-info">
          <div className="stat-value">5.847</div>
          <div className="stat-label">Habitants</div>
        </div>
      </div>
      <h4>Graella d’estadístiques (maqueta)</h4>
      <div className="stat-grid">
        {ESTADISTIQUES.map(([Icona, valor, etiqueta]) => (
          <div className="stat-card" key={etiqueta}>
            <div className="stat-icon"><Icona size={16} aria-hidden="true" /></div>
            <div className="stat-info">
              <div className="stat-value">{valor}</div>
              <div className="stat-label">{etiqueta}</div>
            </div>
          </div>
        ))}
      </div>
    </Especimen>
  );
}
