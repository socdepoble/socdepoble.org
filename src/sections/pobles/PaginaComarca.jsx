/**
 * PaginaComarca.jsx — IDEA-360 (v1.2.26 · Pàgina Universal de Comarca).
 *
 * Ruta `/comarca/:slug`, carregada sempre via `lazyRoute` (+0 B al nucli WP).
 * Mostra la molla de pa territorial (Xarxa de Pobles → Demarcació → Comarca),
 * els pobles documentats de la comarca i les publicacions/actes del territori.
 */
import { useMemo } from 'react';
import { Link, useParams } from '../../app/contexts/RouterContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useMur } from '../mur/MurContext.jsx';
import { useUIActions } from '../../app/contexts/UIContext.jsx';
import { useSEO } from '../../hooks/useSEO.js';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { MollaPa } from '../../components/PedraSeca/organismes/navegacio.jsx';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA, encapcalamentDeTargeta } from '../../components/universal/editorial.js';
import { rutaTerritorial } from './territoriDelPoble.js';
import { nomDeLaGent, slugDelPoble } from './nomsDelPoble.js';
import { resolComarcaPerSlug, RUTA_XARXA_DE_POBLES } from '../../data/taxonomia/taxonomiaGeografica.js';
import { entradetaDeComarca, textosTaxonomiaV26 } from '../../data/taxonomia/i18nTaxonomiaV26.js';

export default function PaginaComarca() {
  const { slug = '' } = useParams();
  const { towns = [] } = useCoreContent();
  const { feedPosts = [], events = [], marketItems = [] } = useMur();
  const { language = 'ca' } = useUIActions();
  const tx = textosTaxonomiaV26(language);

  const comarca = useMemo(() => resolComarcaPerSlug(slug, towns), [slug, towns]);

  const publicacionsTerritori = useMemo(() => {
    if (!comarca) return [];
    const slugsPobles = new Set(comarca.pobles.flatMap((p) => [
      slugDelPoble(p.id),
      slugDelPoble(p.slug),
      slugDelPoble(p.title || p.name)
    ].filter(Boolean)));
    const tots = [...(feedPosts || []), ...(events || []), ...(marketItems || [])];
    return tots.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      if (slugDelPoble(item.comarca) === comarca.slug) return true;
      if (Array.isArray(item.comarques) && item.comarques.some((c) => slugDelPoble(c) === comarca.slug)) return true;
      if (Array.isArray(item.pobles_esmentats) && item.pobles_esmentats.some((p) => slugsPobles.has(slugDelPoble(p)))) return true;
      return [item.poble_id, item.town_name, item.population].some((v) => slugsPobles.has(slugDelPoble(v)));
    });
  }, [comarca, feedPosts, events, marketItems]);

  const subtitol = comarca
    ? tx.taxonomiaV26ComarcaSubtitol
      .replace('{demarcacio}', () => comarca.demarcacio?.etiqueta || tx.taxonomiaV26XarxaPobles)
      .replace('{n}', () => String(comarca.pobles.length))
    : tx.taxonomiaV26ComarcaNoTrobadaSub;

  const entradeta = comarca
    ? entradetaDeComarca(comarca.nom, language)
    : tx.taxonomiaV26ComarcaNoTrobadaSub;

  useSEO({
    title: comarca ? `${comarca.nom} · ${tx.taxonomiaV26XarxaPobles}` : tx.taxonomiaV26ComarcaNoTrobada,
    description: entradeta,
    index: Boolean(comarca && comarca.pobles.length > 0)
  });

  if (!comarca) {
    return (
      <UniversalPage
        title={tx.taxonomiaV26ComarcaNoTrobada}
        subtitle={tx.taxonomiaV26ComarcaNoTrobadaSub}
        chrome="system"
        showLogos={true}
        copyright={COPYRIGHT_SDP}
      >
        <div className="content-wrapper">
          <Link className="sdp-boto sdp-boto--primari" to={RUTA_XARXA_DE_POBLES}>
            {tx.taxonomiaV26ComarcaTornarPobles}
          </Link>
        </div>
      </UniversalPage>
    );
  }

  const passosMolla = [
    { etiqueta: tx.taxonomiaV26XarxaPobles, a: RUTA_XARXA_DE_POBLES },
    ...(comarca.demarcacio ? [{ etiqueta: comarca.demarcacio.etiqueta, a: rutaTerritorial(comarca.demarcacio.id) }] : []),
    { etiqueta: comarca.nom }
  ];

  const labels = [
    { text: 'Pobles', className: 'sdp-badge-system', href: RUTA_XARXA_DE_POBLES },
    ...(comarca.demarcacio
      ? [{ text: comarca.demarcacio.etiqueta, className: 'sdp-badge-category', href: rutaTerritorial(comarca.demarcacio.id) }]
      : []),
    { text: comarca.nom, className: 'sdp-badge-tag', href: `/comarca/${encodeURIComponent(comarca.slug)}` }
  ];

  return (
    <UniversalPage
      chrome="system"
      title={comarca.nom}
      subtitle={subtitol}
      lead={entradeta}
      labels={labels}
      showLogos={true}
      copyright={COPYRIGHT_SDP}
      llenguaDelContingut="ca"
    >
      <div className="content-wrapper">
        <MollaPa className="sdp-molla--panell" passos={passosMolla} />

        <section aria-labelledby="comarca-pobles-titol">
          <h3 id="comarca-pobles-titol">{tx.taxonomiaV26ComarcaPoblesTitol}</h3>
          <div className="sdp-card-grid">
            {comarca.pobles.map((poble) => {
              const nomPoble = poble.title || poble.name || poble.id;
              const ruta = `/pobles/${encodeURIComponent(poble.id || poble.slug || slugDelPoble(nomPoble))}`;
              return (
                <UniversalCard
                  key={poble.id || nomPoble}
                  headingLevel="h4"
                  title={nomPoble}
                  subtitle={poble.author || nomDeLaGent(nomPoble)}
                  body={poble.entradilla || poble.subtitle || undefined}
                  imageUrl={poble.image_url || poble.avatar_url || undefined}
                  imageAlt={nomPoble}
                  authorHref={ruta}
                  mainHref={ruta}
                  labels={[
                    { text: 'Pobles', className: 'sdp-badge-system', href: RUTA_XARXA_DE_POBLES },
                    { text: comarca.nom, className: 'sdp-badge-tag', href: `/comarca/${encodeURIComponent(comarca.slug)}` }
                  ]}
                  copyright={poble.copyright || COPYRIGHT_VIQUIPEDIA}
                  /* LU02 · La capçalera de lectura completa, de la font
                     editorial compartida (encapcalamentDeTargeta, que llig la
                     data amb dataDElement): sense data, el marcador honest. */
                  {...encapcalamentDeTargeta(poble, {
                    author: poble.author || nomDeLaGent(nomPoble),
                    location: nomPoble,
                    idioma: language
                  })}
                />
              );
            })}
          </div>
        </section>

        <section aria-labelledby="comarca-publicacions-titol">
          <h3 id="comarca-publicacions-titol">{tx.taxonomiaV26ComarcaPublicacionsTitol}</h3>
          {publicacionsTerritori.length > 0 ? (
            <div className="sdp-card-grid">
              {publicacionsTerritori.map((item) => {
                const seccio = item.type === 'event' ? 'events' : item.type === 'market' || item.type === 'product' ? 'mercat' : 'mur';
                const ruta = `/${seccio}/${encodeURIComponent(item.slug || item.id)}`;
                return (
                  <UniversalCard
                    key={`${seccio}-${item.id}`}
                    headingLevel="h4"
                    title={item.title || item.titol}
                    subtitle={item.subtitle}
                    body={item.entradilla || item.summary || undefined}
                    imageUrl={item.image_url || item.image || undefined}
                    imageAlt={item.title || ''}
                    mainHref={ruta}
                    labels={Array.isArray(item.labels) ? item.labels : []}
                    copyright={item.copyright || COPYRIGHT_SDP}
                    {...encapcalamentDeTargeta(item, {
                      author: item.author_name || 'Sóc de Poble',
                      location: item.town_name || item.location || comarca.nom,
                      idioma: language
                    })}
                  />
                );
              })}
            </div>
          ) : (
            <p>{tx.taxonomiaV26ComarcaCapPublicacio}</p>
          )}
        </section>
      </div>
    </UniversalPage>
  );
}
