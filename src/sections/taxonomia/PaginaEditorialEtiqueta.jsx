/**
 * PaginaEditorialEtiqueta.jsx — IDEA-370 (v1.2.26 · Pàgina Editorial
 * d'Etiqueta i Categoria estil `/etiqueta/idees`, consumint `C26-1`).
 *
 * Rutes `/etiqueta/:slug` i `/categoria/:slug`, carregades sempre via
 * `lazyRoute` (+0 B al nucli WP). Mostra H1 + H2 + entradeta plana editable +
 * àlies + accés a ruta dedicada + graella de targetes coincidents + panell
 * `IDEA-375` per a superadmin AAL2.
 *
 * D3 (IDEA-365, Llibre Mestre línies 3820 i 3825) · Una classificació que no
 * és del catàleg editorial però que porten publicacions té pàgina automàtica:
 * H1 amb el text de la primera coincidència, H2 i entradeta genèriques en 5
 * llengües, sense àlies ni ruta dedicada, fora de l'índex dels cercadors
 * (contingut prim) i sense panell IDEA-375 (no hi ha cap editorial desat).
 * Sense cap publicació coincident, «Classificació no trobada».
 */
import { useMemo, useRef } from 'react';
import { Link, useLocation, useParams } from '../../app/contexts/RouterContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useMur } from '../mur/MurContext.jsx';
import { useUIActions } from '../../app/contexts/UIContext.jsx';
import { useSEO } from '../../hooks/useSEO.js';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';
import { COPYRIGHT_SDP, encapcalamentDeTargeta } from '../../components/universal/editorial.js';
import {
  resolPaginaEditorialTaxonomia,
  slugTaxonomia
} from '../../data/taxonomia/taxonomiaCanonica.js';
import { elementsTerritorialsDe } from '../../data/taxonomia/taxonomiaGeografica.js';
import { textosTaxonomiaV26 } from '../../data/taxonomia/i18nTaxonomiaV26.js';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssTaxonomiaV26 from '../../css/diferit-taxonomia-v26.css?inline';
import ControlEdicioTaxonomia from './ControlEdicioTaxonomia.jsx';
import { projectaOverlayALabels, useEstatUITaxonomia, useTaxonomiaPaginaOverlay } from './useTaxonomiaPaginaOverlay.js';
import { formataEtiquetaHumana } from '../mercat/etiquetesMercat.js';
import { targetesDeSistema } from '../mur/targetesMur.js';

function textDeEtiqueta(etiqueta) {
  return typeof etiqueta === 'string' ? etiqueta : etiqueta?.text || '';
}

/* Els valors de taxonomia d'una publicació que tenen text: etiquetes, tags i
   categories (de sistema i temàtiques). v1.2.26 · Els productes del Mercat
   porten la seua classificació a `category_slug` i `tag` (destinsDeProducte.js),
   sense `labels`: les píndoles de producte porten a /categoria/<category_slug>
   i /etiqueta/<tag>, i la pàgina les ha de trobar. */
function valorsTaxonomia(item) {
  if (!item || typeof item !== 'object') return [];
  const candidats = [];
  if (Array.isArray(item.labels)) candidats.push(...item.labels.map(textDeEtiqueta));
  if (Array.isArray(item.tags)) candidats.push(...item.tags);
  if (Array.isArray(item.categoriesSistema)) candidats.push(...item.categoriesSistema);
  if (Array.isArray(item.categories)) candidats.push(...item.categories);
  if (typeof item.category === 'string') candidats.push(item.category);
  if (typeof item.categoria_tematica_id === 'string') candidats.push(item.categoria_tematica_id);
  if (typeof item.category_slug === 'string') candidats.push(item.category_slug);
  if (typeof item.tag === 'string') candidats.push(item.tag);
  return candidats.filter((valor) => typeof valor === 'string' && valor.trim());
}

function elementCoincideixAmbClaus(item, clausSlug) {
  return valorsTaxonomia(item).some((valor) => clausSlug.has(slugTaxonomia(valor)));
}

/* D3 · La pàgina automàtica: la primera publicació que porta la classificació
   en dona el nom (H1). Cap coincidència: null. */
function paginaAutomatica(publicacions, slug, tipus, tx, idioma) {
  const clau = slugTaxonomia(slug);
  if (!clau) return null;
  for (const item of publicacions) {
    const trobat = valorsTaxonomia(item).find((valor) => slugTaxonomia(valor) === clau)?.trim();
    /* Un slug intern de producte (`roba`, `oli-verge-extra`) es mostra amb el seu nom
       humà en la llengua de la interfície, el mateix de la píndola (etiquetesMercat.js). */
    const nom = trobat && (trobat === item.category_slug || trobat === item.tag)
      ? formataEtiquetaHumana(trobat, idioma)
      : trobat;
    if (nom) {
      return {
        tipus,
        slug: clau,
        h1: nom,
        h2: tx.taxonomiaV26EditorialAutomaticaSubtitol,
        entradeta: tx.taxonomiaV26EditorialAutomaticaEntradeta.replace('{nom}', () => nom),
        alies: [],
        rutaDedicada: null,
        automatica: true
      };
    }
  }
  return null;
}

export default function PaginaEditorialEtiqueta({ tipusRuta = null }) {
  const { slug = '' } = useParams();
  const { pathname } = useLocation();
  const { feedPosts = [], events = [], marketItems = [] } = useMur();
  const { towns = [], personalitzacio = null, pageCopy = null } = useCoreContent();
  const { language = 'ca' } = useUIActions();
  const externalConfig = useEstatUITaxonomia()?.externalConfig || null;
  const tx = textosTaxonomiaV26(language);
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'taxonomia-v26', cssTaxonomiaV26);

  const tipusEfectiu = tipusRuta || (pathname?.startsWith('/categoria/') ? 'categoria' : 'etiqueta');
  const rutaConsulta = `/${tipusEfectiu}/${slug}`;
  /* IDEA-365 (línia 3820) · La pàgina mostra totes les cards categoritzades així, també les
     de les pàgines del sistema i dels catàlegs que es pinten al /mur (targetesDeSistema):
     /categoria/catalegs llista les biblioteques i «Què dinem?». */
  const tots = useMemo(
    () => [
      ...(feedPosts || []),
      ...(events || []),
      ...(marketItems || []),
      ...(pageCopy ? targetesDeSistema(pageCopy, { language }) : [])
    ],
    [feedPosts, events, marketItems, pageCopy, language]
  );
  const editorialCataleg = useMemo(() => {
    const edicionsCms = personalitzacio?.taxonomia?.payload?.editorials ?? {};
    return resolPaginaEditorialTaxonomia(rutaConsulta, edicionsCms)
      || resolPaginaEditorialTaxonomia(slug, edicionsCms);
  }, [rutaConsulta, slug, personalitzacio]);
  const editorial = useMemo(
    () => editorialCataleg || paginaAutomatica(tots, slug, tipusEfectiu, tx, language),
    [editorialCataleg, tots, slug, tipusEfectiu, tx, language]
  );

  const idPagina = editorialCataleg ? `${editorialCataleg.tipus}/${editorialCataleg.slug}` : null;
  const overlay = useTaxonomiaPaginaOverlay(idPagina, externalConfig);

  const clausCoincidencia = useMemo(() => {
    if (!editorial) return new Set();
    return new Set([
      slugTaxonomia(editorial.slug),
      slugTaxonomia(editorial.h1),
      ...(editorial.alies || []).map(slugTaxonomia)
    ].filter(Boolean));
  }, [editorial]);

  const publicacions = useMemo(() => {
    if (!editorial) return [];
    return tots.filter((item) => elementCoincideixAmbClaus(item, clausCoincidencia));
  }, [editorial, tots, clausCoincidencia]);

  useSEO({
    title: editorial ? `${editorial.h1} · ${editorial.h2}` : tx.taxonomiaV26EditorialNoTrobada,
    description: editorial ? editorial.entradeta : tx.taxonomiaV26EditorialNoTrobadaSub,
    index: Boolean(editorialCataleg)
  });

  if (!editorial) {
    return (
      <UniversalPage
        title={tx.taxonomiaV26EditorialNoTrobada}
        subtitle={tx.taxonomiaV26EditorialNoTrobadaSub}
        chrome="system"
        showLogos={true}
        copyright={COPYRIGHT_SDP}
      >
        <div className="content-wrapper">
          <Link className="sdp-boto sdp-boto--primari" to="/mur">
            {tx.taxonomiaV26EditorialTornarMur}
          </Link>
        </div>
      </UniversalPage>
    );
  }

  /* D3 · A la pàgina automàtica, la segona píndola és la mateixa classificació
     (com la comarca a PaginaComarca), no «Etiqueta editorial»: no en té. */
  const labelsBase = [
    { text: 'Sistema', className: 'sdp-badge-system', href: '/categoria/sistema' },
    editorial.automatica ? {
      text: editorial.h1,
      className: editorial.tipus === 'categoria' ? 'sdp-badge-category' : 'sdp-badge-tag',
      href: `/${editorial.tipus}/${editorial.slug}`
    } : {
      text: editorial.tipus === 'categoria' ? tx.taxonomiaV26EditorialTipusCategoria : tx.taxonomiaV26EditorialTipusEtiqueta,
      className: 'sdp-badge-category',
      href: `/${editorial.tipus}/${editorial.slug}`
    }
  ];
  const labels = projectaOverlayALabels(overlay, labelsBase, language);
  const mostraRutaDedicada = Boolean(editorial.rutaDedicada && editorial.rutaDedicada !== `/${editorial.tipus}/${editorial.slug}`);

  return (
    <UniversalPage
      chrome="system"
      title={editorial.h1}
      subtitle={editorial.h2}
      lead={editorial.entradeta}
      labels={labels}
      showLogos={true}
      copyright={COPYRIGHT_SDP}
      llenguaDelContingut={editorial.automatica ? null : 'ca'}
      accioPrincipal={mostraRutaDedicada ? (
        <Link className="sdp-boto sdp-boto--primari" to={editorial.rutaDedicada}>
          {tx.taxonomiaV26EditorialRutaDedicada}
        </Link>
      ) : null}
    >
      <div ref={arrelRef} className="content-wrapper">
        {editorial.alies.length > 0 ? (
          <p className="sdp-taxonomia-alies">
            {tx.taxonomiaV26EditorialAlies}: {editorial.alies.join(' · ')}
          </p>
        ) : null}

        <section aria-labelledby="editorial-taxonomia-publicacions">
          <h3 id="editorial-taxonomia-publicacions">{tx.taxonomiaV26EditorialPublicacionsTitol}</h3>
          {publicacions.length > 0 ? (
            <div className="sdp-card-grid">
              {publicacions.map((item) => {
                const seccio = item.type === 'event' ? 'events' : item.type === 'market' || item.type === 'product' ? 'mercat' : 'mur';
                /* Una card de sistema o de catàleg porta la seua pàgina (mainHref, /page/…). */
                const ruta = typeof item.mainHref === 'string' && item.mainHref.startsWith('/')
                  ? item.mainHref
                  : `/${seccio}/${encodeURIComponent(item.slug || item.id)}`;
                /* LU02 · La capçalera de lectura completa, de la font editorial
                   compartida (encapcalamentDeTargeta, que llig la data amb
                   dataDElement): sense dada, el marcador honest «no indicat»,
                   mai una data inventada. */
                return (
                  <UniversalCard
                    key={`${seccio}-${item.id}`}
                    headingLevel="h4"
                    title={item.title || item.titol}
                    subtitle={item.subtitle}
                    body={item.entradilla || item.summary || item.lead || undefined}
                    imageUrl={item.image_url || item.image || undefined}
                    imageAlt={item.title || ''}
                    mainHref={ruta}
                    labels={Array.isArray(item.labels) ? item.labels : []}
                    territori={elementsTerritorialsDe(item, towns)}
                    copyright={item.copyright || COPYRIGHT_SDP}
                    {...encapcalamentDeTargeta(item, {
                      author: item.author_name || 'Sóc de Poble',
                      location: item.town_name || item.location,
                      idioma: language
                    })}
                  />
                );
              })}
            </div>
          ) : (
            <p>{tx.taxonomiaV26EditorialSensePublicacions}</p>
          )}
        </section>

        {idPagina ? (
          <ControlEdicioTaxonomia
            idPagina={idPagina}
            categoriesSistemaInicials={editorial.tipus === 'categoria' ? [editorial.h1] : ['Sistema']}
            etiquetesInicials={editorial.tipus === 'etiqueta' ? [editorial.h1] : []}
          />
        ) : null}
      </div>
    </UniversalPage>
  );
}
