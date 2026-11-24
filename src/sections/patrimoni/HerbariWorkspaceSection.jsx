import { useMemo } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { usePublicadorsRegistrats } from '../../hooks/usePublicadorsRegistrats.js';
import { useSEO } from '../../hooks/useSEO';
import { useUIActions } from '../../app/contexts/UIContext';
import TextSection from '../text/TextSection';
import FitxaHerbari from './FitxaHerbari.jsx';
import { useLaminesBotaniquesNode0 } from './useLaminesBotaniquesNode0.js';
import { textosHerbari } from './textosHerbari.js';
import { modelHerbariWorkspace } from './modelHerbariWorkspace.js';

function PaginaFitxaHerbari({ item, textos, onClose, children }) {
  const { dadesBarra } = usePublicadorsRegistrats({ recursTipus: 'planta', recursId: item.id });
  const imatgeHero = item.dades?.imatgesDoctorals?.[0]?.src || item.imageUrl || undefined;
  useSEO({
    title: `${item.title} (${item.subtitle}) · ${textos.titol}`,
    description: `${item.title} (${item.subtitle}) · Herbari etnobotànic de La Torre de les Maçanes.`,
    image: imatgeHero,
    index: true
  });
  return (
    <UniversalPage
      chrome="full"
      title={item.title}
      subtitle={item.subtitle}
      heroImage={imatgeHero}
      heroAlt={imatgeHero ? `${item.title} (${item.subtitle})` : undefined}
      llenguaDelContingut="ca"
      showLogos={true}
      topBarData={{ showPin: false, ...dadesBarra }}
      onBack={onClose}
      copyright={COPYRIGHT_SDP}
    >
      {children}
    </UniversalPage>
  );
}

export default function HerbariWorkspaceSection({
  page = null,
  accioPrincipal = null,
  children = null,
  itemSlug = null,
  sincronitzaRuta = false
}) {
  const { language = 'ca' } = useUIActions();
  const textos = textosHerbari(language);
  const cataleg = useLaminesBotaniquesNode0();
  const model = useMemo(() => modelHerbariWorkspace(textos, cataleg?.obteLaminaBotanicaNode0), [textos, cataleg]);

  const fitxa = (item) => (item ? (
    <section className="sdp-cataleg-workspace__fitxa" aria-label={item.title}>
      <FitxaHerbari key={item.id} especie={item.dades} textos={textos} />
    </section>
  ) : (
    <p>{textos.documental}</p>
  ));

  return (
    <CatalegWorkspace
      font="herbari"
      destiPublicacio="herbari"
      model={model}
      id="herbari-p069"
      ruta="/page/herbari"
      itemSlug={itemSlug}
      sincronitzaRuta={sincronitzaRuta}
      labels={{
        categories: textos.us,
        items: textos.titol,
        all: textos.tots,
        search: textos.cerca,
        empty: textos.buit,
        noResults: textos.buit
      }}
      renderDetail={({ item, onClose }) => {
        if (item) {
          return (
            <PaginaFitxaHerbari key={item.id} item={item} textos={textos} onClose={onClose}>
              {fitxa(item)}
              {children}
            </PaginaFitxaHerbari>
          );
        }
        if (!page) return fitxa(null);
        return (
          <TextSection page={page} pageKey="herbari" accioPrincipal={accioPrincipal}>
            {fitxa(null)}
            {children}
          </TextSection>
        );
      }}
    />
  );
}
