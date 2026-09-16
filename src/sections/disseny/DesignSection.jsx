import { lazy, Suspense } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Link, useLocation, useSearchParams } from '../../app/contexts/RouterContext';
import { DesignSectionContent } from './DesignSectionContent.jsx';
import { PAGINES } from './cataleg/registre.js';
import { Carregant } from '../../components/PedraSeca/index.js';

/* Cada pàgina del catàleg és un chunk: qui obri Fonaments no paga Formularis. */
const PAGINA = {
  estructura: lazy(() => import('./cataleg/PaginaEstructura.jsx')),
  formularis: lazy(() => import('./cataleg/PaginaFormularis.jsx')),
  superposicions: lazy(() => import('./cataleg/PaginaSuperposicions.jsx')),
  retroalimentacio: lazy(() => import('./cataleg/PaginaRetroalimentacio.jsx')),
  navegacio: lazy(() => import('./cataleg/PaginaNavegacio.jsx')),
  inventari: lazy(() => import('./cataleg/PaginaInventari.jsx')),
};

export default function DesignSection() {
  const [params] = useSearchParams();
  /* /disseny redirigix a /jo/disseny i perd la query: els enllaços es fan
     sobre la ruta real, no sobre l'àlies. */
  const { pathname } = useLocation();
  const demanada = params.get('pagina');
  const actual = PAGINA[demanada] ? demanada : 'fonaments';
  const Pagina = PAGINA[actual];

  return (
    <UniversalPage
      chrome="full"
      showLogos={true}
      title="Disseny"
      subtitle="Sistema oficial de disseny per a Sóc de Poble"
      lead="Cada component es documenta amb el seu espècimen viu, el contracte, l'accessibilitat i les regles de fes / no facis, perquè qualsevol persona o IA el puga reproduir sense endevinar."
      copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
      heroImage="/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png"
      heroAlt="Il·lustració del sistema de disseny Pedra Seca"
      authorName="Sóc de Poble"
      authorLocation="La Torre de les Maçanes"
      time="23:29"
      date="22/3/22"
    >
      <nav className="sdp-pindola" aria-label="Pàgines del sistema de disseny">
          {PAGINES.map((p) => (
            <Link key={p.id} to={p.id === 'fonaments' ? pathname : `${pathname}?pagina=${p.id}`}
              className="sdp-pindola__opcio" aria-current={p.id === actual ? 'page' : undefined}>
              {p.titol}
            </Link>
          ))}
      </nav>
      {Pagina ? (
        <Suspense fallback={<Carregant etiqueta="Carregant la pàgina del catàleg…" />}>
          <Pagina />
        </Suspense>
      ) : (
        <DesignSectionContent />
      )}
    </UniversalPage>
  );
}
