import { Compass } from 'lucide-react';
import { useUIStateOpcional } from '../app/contexts/UIContext.jsx';
import { Link } from '../app/contexts/RouterContext';
import { Accions } from '../components/PedraSeca/index.js';
import { UniversalPage } from '../components/universal/UniversalPage';
import { useSEO } from '../hooks/useSEO';
import { textosNotFound } from './i18nNotFound.js';

export default function NotFoundPage() {
  const ui = useUIStateOpcional();
  const idioma = ui?.llenguaDelText || ui?.language || 'ca';
  const tx = textosNotFound(idioma);

  useSEO({
    title: tx.seoTitle,
    description: tx.seoDescription,
    index: false
  });

  return (
    <UniversalPage
      title={tx.title}
      subtitle={tx.subtitle}
      lead={tx.lead}
      labels={[...tx.labels]}
      chrome="system"
      traduccio={false}
    >
      <section className="sdp-404-cos">
        <Compass size={48} className="sdp-404-icona" aria-hidden="true" focusable="false" />
        <h3>{tx.cosTitol}</h3>
        <p>
          {tx.cosAbansNegreta}
          <strong>{tx.cosNegreta}</strong>
          {tx.cosDespresNegreta}
        </p>
        <nav aria-label={tx.navAriaLabel}>
          <Accions>
            <Link to="/mur" className="sdp-boto sdp-boto--primari">
              {tx.mur}
            </Link>
            <Link to="/pobles" className="sdp-boto sdp-boto--secundari">
              {tx.pobles}
            </Link>
            <Link to="/mercat" className="sdp-boto sdp-boto--secundari">
              {tx.mercat}
            </Link>
            <Link to="/mapa" className="sdp-boto sdp-boto--secundari">
              {tx.mapa}
            </Link>
            <Link to="/" className="sdp-boto sdp-boto--fantasma">
              {tx.inici}
            </Link>
          </Accions>
        </nav>
      </section>
    </UniversalPage>
  );
}
