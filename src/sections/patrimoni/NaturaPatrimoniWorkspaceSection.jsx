import { localitzaPagina } from '../text/pageContent.r10.js';
import { propsDePaginaDeText } from '../text/paginaDeText.js';
import { resolveAsset } from '../../config/assetResolver.js';
import { useEffect, useMemo, useState } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { usePublicadorsBarraRecurs } from '../../hooks/usePublicadorsBarraRecurs.js';
import { COPYRIGHT_SDP, dataHoraDeBarra, encapcalamentDeTargeta } from '../../components/universal/editorial.js';
import { Boto, UniversalCard } from '../../components/PedraSeca/index.js';
import { Link, Navigate, useSearchParams } from '../../app/contexts/RouterContext.jsx';
import { useUIActionsOpcional } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO.js';
import { LLIBRES_ARBRES_MONUMENTALS, modelLlibresArbres } from '../../data/patrimoni/llibresArbresMonumentals.js';
import { carregaPortadaImportadaPublica } from '../../data/importacio/paginesTrilogiaIMoliEditorial.js';
import TextSection, { CosDeLaPagina } from '../text/TextSection';
import FitxaArbreMonumental from './FitxaArbreMonumental.jsx';
import EinesDadesArbres from './EinesDadesArbres.jsx';
import { textosArbresWorkspace } from './textosArbresWorkspace.js';

function autoriaDelLlibre(llibre, publicadorsRegistrats = null) {
  const autoria = llibre.autoria;
  const font = llibre.fontDoctoral;
  const extraTopBar = publicadorsRegistrats ? { publicadorsRegistrats } : {};
  if (!autoria || !autoria.ruta) return {
    copyright: autoria?.drets ?? font?.llicencia ?? COPYRIGHT_SDP,
    showLogos: true,
    topBarData: { showPin: false, ...extraTopBar }
  };
  return {
    copyright: autoria.drets ?? font?.llicencia ?? null,
    logoEntitat: autoria.logo ? { clar: resolveAsset(autoria.logo), alt: autoria.altLogo } : null,
    topBarData: {
      showPin: false,
      authorName: autoria.nom || font?.entitatPromotora || font?.autoriaTecnica || null,
      authorLocation: autoria.poble,
      authorAvatar: autoria.logo ? resolveAsset(autoria.logo) : '',
      authorHref: autoria.ruta,
      ...extraTopBar
    }
  };
}

function PortadaDelLlibre({ llibre, textos }) {
  const wpId = llibre.portada?.wpId;
  const { publicadorsRegistrats } = usePublicadorsBarraRecurs({
    recursTipus: 'llibre_cataleg',
    recursId: llibre.id
  });
  const [intent, setIntent] = useState(0);
  const [carga, setCarga] = useState({ wpId: null, pagina: null, error: false });
  useSEO({
    title: llibre.titol,
    description: `${llibre.titol} (${llibre.poble}) · ${llibre.autoria?.nom || llibre.fontDoctoral?.autoriaTecnica || 'Sóc de Poble'}.`,
    index: true
  });
  useEffect(() => {
    if (!wpId) return undefined;
    const controller = new AbortController();
    carregaPortadaImportadaPublica(wpId, { signal: controller.signal }).then(pagina => {
      if (!controller.signal.aborted) setCarga({ wpId, pagina, error: !pagina });
    }, () => {
      if (!controller.signal.aborted) setCarga({ wpId, pagina: null, error: true });
    });
    return () => controller.abort();
  }, [wpId, intent]);

  const eines = <EinesDadesArbres arbres={llibre.exemplars} font={llibre.fontDoctoral} />;
  if (llibre.portada?.pagina) {
    const pagina = localitzaPagina(llibre.portada.pagina, textos.language, llibre.id);
    const propsText = propsDePaginaDeText(pagina, llibre.id);
    const autoria = autoriaDelLlibre(llibre, publicadorsRegistrats);
    return <UniversalPage chrome="full" {...propsText} {...autoria}
      topBarData={{ ...propsText.topBarData, ...autoria.topBarData }}
      llenguaDelContingut={pagina.contentLanguage || 'ca'}>
      <CosDeLaPagina html={pagina.html} />{eines}
    </UniversalPage>;
  }
  if (!wpId) return <UniversalPage chrome="full" title={llibre.titol} subtitle={llibre.poble} {...autoriaDelLlibre(llibre, publicadorsRegistrats)}>{eines}</UniversalPage>;
  if (carga.wpId !== wpId) return <p role="status">{textos.carregant}</p>;
  if (carga.error) return <div role="alert"><p>{textos.errorPortada}</p><Boto onClick={() => {
    setCarga({ wpId: null, pagina: null, error: false });
    setIntent(value => value + 1);
  }}>{textos.reintenta}</Boto></div>;
  const pagina = carga.pagina;
  return <UniversalPage chrome="full" title={pagina.title} labels={[]}
    {...autoriaDelLlibre(llibre, publicadorsRegistrats)} llenguaDelContingut="ca" {...dataHoraDeBarra({ creat: pagina.created_at })}>
    <CosDeLaPagina html={pagina.htmlNet} />
    {eines}
  </UniversalPage>;
}

function PaginaFitxaArbre({ item, textos, onClose }) {
  const { publicadorsRegistrats: publicadorsArbre } = usePublicadorsBarraRecurs({
    recursTipus: 'arbre',
    recursId: item.arbre?.id || item.id
  });
  const { publicadorsRegistrats: publicadorsLlibre } = usePublicadorsBarraRecurs({
    recursTipus: 'llibre_cataleg',
    recursId: item.llibre.id
  });
  const publicadorsRegistrats = publicadorsArbre ?? publicadorsLlibre;
  useSEO({
    title: `${item.title} · ${item.llibre.titol}`,
    description: `${item.subtitle} · ${item.lead} (${item.llibre.poble}).`,
    image: item.imageUrl || undefined,
    index: true
  });
  return (
    <section className="sdp-cataleg-workspace__fitxa" aria-label={item.arbre.nom}>
      <UniversalPage chrome="full" title={item.title} labels={[item.llibre.poble]}
        {...autoriaDelLlibre(item.llibre, publicadorsRegistrats)} llenguaDelContingut="ca" onBack={onClose}>
        <FitxaArbreMonumental key={item.id} arbre={item.arbre} fontDoctoral={item.llibre.fontDoctoral}
          onTanca={onClose} etiquetaTornada={textos.tornaLlibre} amagaTitol />
      </UniversalPage>
    </section>
  );
}

/** El paquet injectat és l'única diferència entre els llibres de cada poble. */
export default function NaturaPatrimoniWorkspaceSection({
  page = null, accioPrincipal = null, children = null, llibreInicial = null,
  itemSlug = null, sincronitzaRuta = false,
  llibres = LLIBRES_ARBRES_MONUMENTALS
}) {
  const ui = useUIActionsOpcional();
  const esSuperadmin = useSessioOpcional()?.esSuperadmin === true;
  const textos = useMemo(() => textosArbresWorkspace(ui?.language), [ui?.language]);
  const [parametres] = useSearchParams();
  const llibreDemanat = parametres.get('llibre') || llibreInicial;
  const model = useMemo(() => modelLlibresArbres(llibres, textos), [llibres, textos]);
  const totalArbres = new Set(llibres.flatMap(llibre => llibre.exemplars.map(arbre =>
    JSON.stringify([llibre.fontDoctoral?.id || llibre.id, arbre.id])))).size;
  const llibreEnllacat = llibres.find(item => item.id === llibreDemanat)
    || (llibreDemanat === 'arbres' ? llibres[0] : null);
  const fitxaDemanada = parametres.get('fitxa');
  const candidates = model.items.filter(item => item.id === fitxaDemanada || item.arbre?.id === fitxaDemanada);
  // Els ids antics sense llibre només es resolen quan identifiquen un únic exemplar.
  const fitxa = llibreEnllacat ? candidates.find(item => item.llibre.id === llibreEnllacat.id)
    : candidates.length === 1 ? candidates[0] : null;
  const llibre = llibreEnllacat || fitxa?.llibre;
  const categoriaInicial = llibre?.id ?? '__all__';

  // Els enllaços del Workspace R17 continuen arribant a les seues pàgines.
  if (llibreDemanat === 'herbari') return <Navigate to="/page/herbari" replace />;
  if (llibreDemanat === 'rutes') return <Navigate to="/page/rutes-de-poble" replace />;

  return <CatalegWorkspace id="arbres-monumentals-r18" ruta="/page/arbres-monumentals" model={model}
    itemSlug={itemSlug} sincronitzaRuta={sincronitzaRuta}
    destiPublicacio="arbres-monumentals" inclouDescendents afegirCataleg={esSuperadmin} navegacioLlibres={{ categoriaInicial, fitxaInicial: fitxa?.arbre ? fitxa.id : null,
      portadaInicial: llibre && !fitxa?.arbre ? `portada-${llibre.id}` : null }}
    labels={{ categories: textos.llibreria, items: textos.exemplars, all: `${textos.tots} (${totalArbres})`,
      search: textos.cerca, empty: textos.buit, noResults: textos.senseResultats }}
    renderDetail={({ item, selection, onClose, onTriaCategoria }) => {
      const categoria = model.categories.find(row => row.id === selection.categoryId);
      const llibreActiu = item?.llibre || llibres.find(row => row.id === (categoria?.llibreId || selection.categoryId));
      if (item?.arbre) return <PaginaFitxaArbre key={item.id} item={item} textos={textos} onClose={onClose} />;
      if (llibreActiu) return <PortadaDelLlibre key={llibreActiu.id} llibre={llibreActiu} textos={textos} />;
      const prestatgeriaMultipoble = <section className="sdp-prose" aria-labelledby="sdp-arbres-catalegs-municipals">
        <h2 id="sdp-arbres-catalegs-municipals">{textos.catalegsMunicipals}</h2>
        <p>{textos.introMultipoble}</p>
        <div className="sdp-card-grid">
          {llibres.map(llibreItem => {
            const primerExemplar = llibreItem.exemplars?.[0] ?? null;
            const fotoPortada = primerExemplar?.fotos?.foto2020 || primerExemplar?.fotos?.foto2007 || '';
            const recompte = textos.recompteArbres.replace('{n}', () => String(llibreItem.exemplars?.length ?? 0));
            return (
              <UniversalCard
                key={llibreItem.id}
                headingLevel="h3"
                title={llibreItem.titol}
                subtitle={`${llibreItem.poble} · ${recompte}`}
                body={llibreItem.fontDoctoral?.autoriaTecnica || llibreItem.autoria?.nom || undefined}
                imageUrl={fotoPortada ? resolveAsset(fotoPortada) : undefined}
                imageAlt={primerExemplar ? `${primerExemplar.nom} (${llibreItem.poble})` : llibreItem.titol}
                /* R21.7 · Capçalera de lectura per la font editorial compartida: l'autoria del catàleg, el seu poble i
                   l'any de l'edició revisada; sense any conegut, «Data no indicada» (cap data inventada). */
                {...encapcalamentDeTargeta({ year: llibreItem.fontDoctoral?.anyEdicioRevisada },
                  { author: llibreItem.autoria?.nom, location: llibreItem.poble, idioma: ui?.language })}
                {...(llibreItem.autoria?.ruta ? { authorHref: llibreItem.autoria.ruta } : {})}
                avatarUrl={llibreItem.autoria?.logo ? resolveAsset(llibreItem.autoria.logo) : undefined}
                copyright={llibreItem.autoria?.drets || llibreItem.fontDoctoral?.llicencia || undefined}
                labels={[llibreItem.poble]}
                etiquetesAmbAccio
                accio={<Boto varietat="secundari" onClick={() => onTriaCategoria?.(llibreItem.id)}>{`${textos.obriCataleg}: ${llibreItem.poble}`}</Boto>}
              />
            );
          })}
        </div>
      </section>;
      const enllacos = <nav aria-label={textos.llibreria}>
        <p><Link to="/page/herbari">{textos.herbari}</Link> · <Link to="/page/rutes-de-poble">{textos.rutes}</Link></p>
      </nav>;
      return page ? <TextSection page={{ ...page, copyright: COPYRIGHT_SDP }} pageKey="arbres-monumentals" accioPrincipal={accioPrincipal}>
        {prestatgeriaMultipoble}{enllacos}{children}
      </TextSection> : <UniversalPage title={textos.general} copyright={COPYRIGHT_SDP}>{prestatgeriaMultipoble}{enllacos}{children}</UniversalPage>;
    }} />;
}
