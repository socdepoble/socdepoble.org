import { useUIActions } from '../app/contexts/UIContext';
import { UniversalPage } from '../components/universal/UniversalPage';
import { useSEO } from '../hooks/useSEO';
import { Compass } from 'lucide-react';
import { Link } from '../app/contexts/RouterContext';

export default function NotFoundPage() {
  const { t } = useUIActions();
  
  useSEO({
    title: '404 - No Trobat',
    description: 'La pàgina que cerques no existeix o ha estat moguda.',
    index: false
  });

  return (
    <UniversalPage
      title="Ací no hi ha res"
      subtitle="Error 404"
      lead="La pàgina que busques no existeix o ha canviat de lloc."
      labels={['404', 'No trobat']}
    >
      <div className="sdp-404-cos">
        <Compass size={48} className="sdp-404-icona" />
        <p>
          Pots tornar a l'inici per seguir explorant Sóc de Poble.
        </p>
        <p>
          <Link to="/" className="btn btn-primary">
            Tornar a l'inici
          </Link>
        </p>
      </div>
    </UniversalPage>
  );
}
