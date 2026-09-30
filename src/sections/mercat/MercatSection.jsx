import React from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { getSectionItemPath, objecteDe, rutaConnectarObjecte, rutaDePerfilDAutor } from '../../config/navigation';
import { useNavigate } from '../../app/contexts/RouterContext';

import { useSEO } from '../../hooks/useSEO';
import { resolRecursPropi, resolveAsset } from '../../config/assetResolver.js';
import { useMur } from '../mur/MurContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { Carregant } from '../../components/PedraSeca/index.js';
// T2 · El mateix estat d'error que el Mur (un sol contracte per a les dues seccions).
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';

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
            let itemDate = '';
            let itemTime = '';
            if (item?.created_at) {
              const d = new Date(item.created_at);
              itemDate = d.toLocaleDateString('ca-ES');
              itemTime = d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
            }
            /* T63.2 · el descriptor del producte: Connectar se l'emporta i
               Comentar obri el seu xat comú. */
            const producte = objecteDe(item, 'mercat');

            return (
              <UniversalCard
                key={item.id}
                author={item.author_name || item.seller || 'Sóc de Poble'}
                /* Lògica d'Usuari (T4, T5): qui ven té perfil, i Connectar recorda d'on ve. */
                authorHref={rutaDePerfilDAutor(item) || undefined}
                objecte={producte}
                onConnect={() => navigate(rutaConnectarObjecte(producte))}
                /* SPEC G · les imatges pròpies ('/assets/…') es resolen en
                   PINTAR-LES, amb la base de l'amfitrió; les dades no es tornen
                   a escriure. Sense base, el mateix valor (assetResolver.js). */
                avatarUrl={resolRecursPropi(item.avatar_url) || resolveAsset('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg')}
                body={item.description || ''}
                copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
                date={itemDate}
                time={itemTime}
                imageAlt={item.title}
                imageUrl={resolRecursPropi(item.images?.[0] || item.imageSrc || '')}
                labels={[
                  { text: t('section.mercat.kicker', 'Mercat'), className: 'sdp-badge-system' },
                  item.variations?.length ? { text: `${item.variations.length} ${t('section.mercat.variations', 'variants')}`, className: 'sdp-badge-accent' } : null,
                  item.category_slug ? { text: item.category_slug, className: 'sdp-badge-category' } : null,
                  item.tag ? { text: item.tag, className: 'sdp-badge-tag' } : null
                ].filter(Boolean)}
                location={item.author_location || item.population || 'La Torre de les Maçanes'}
                mainHref={getSectionItemPath('mercat', item.id)}
                subtitle={item.subtitle || ''}
                title={item.title}
                price={item.price}
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
