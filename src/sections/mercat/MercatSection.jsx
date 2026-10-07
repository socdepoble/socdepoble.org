import React from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { objecteDe, rutaConnectarObjecte } from '../../config/navigation';
import { useNavigate } from '../../app/contexts/RouterContext';

import { useSEO } from '../../hooks/useSEO';
import { useMur } from '../mur/MurContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { Carregant } from '../../components/PedraSeca/index.js';
// T2 · El mateix estat d'error que el Mur (un sol contracte per a les dues seccions).
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';
/* Revisió del 261007 (M3-12) · Les props de la targeta d'un producte (boina,
   data, drets, foto, etiquetes) viuen a targetaDeProducte.js: la mostra del
   catàleg passa pel mateix camí. */
import { propsDeTargetaDeProducte } from './targetaDeProducte.js';

export default function MercatSection() {
  const { sortedMarketItems, status, error, refresh } = useMur();
  const { t } = useUIActions();
  const navigate = useNavigate();

  useSEO({
    title: t('section.mercat.kicker', 'Mercat'),
    description: t('section.mercat.subtitle', 'Explora els productes i les ofertes disponibles.')
  });

  const config = {
    title: t('section.mercat.kicker', 'Mercat'),
    subtitle: t('section.mercat.title', 'Productes i intercanvis'),
    lead: t('section.mercat.subtitle', 'Explora els productes i les ofertes disponibles.'),
    chrome: "system",
    showLogos: true
  };

  return (
    <ContentProvider initialConfig={config}>
      <UniversalPage>
        {status === 'loading' ? <Carregant etiqueta={t('section.mercat.carregant', 'Carregant els productes…')} /> : null}
        {status === 'error'
          ? <EstatErrorDades titol={t('section.mercat.error', "No s'ha pogut carregar el Mercat")} error={error} onReintenta={refresh} />
          : null}
        {status === 'ready' && !sortedMarketItems.length ? <p role="status">
          {t('section.mercat.buit', 'Encara no hi ha productes publicats en este poble.')}
        </p> : null}
        <div className="sdp-card-grid">
          {sortedMarketItems.map((item) => {
            /* T63.2 · el descriptor del producte: Connectar se l'emporta i
               Comentar obri el seu xat comú. Lògica d'Usuari (T4, T5):
               Connectar recorda d'on ve. */
            const producte = objecteDe(item, 'mercat');

            return (
              <UniversalCard
                key={item.id}
                {...propsDeTargetaDeProducte(item, t)}
                objecte={producte}
                onConnect={() => navigate(rutaConnectarObjecte(producte))}
                hasFooter={true}
                showTranslate={true}
                showComment={true}
                showShare={true}
                showConnect={true}
              />
            );
          })}
        </div>
      </UniversalPage>
    </ContentProvider>
  );
}
