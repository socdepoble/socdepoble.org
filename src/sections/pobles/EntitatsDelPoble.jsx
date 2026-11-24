/**
 * EntitatsDelPoble.jsx · P1-11 (pla 261024_2230, T5B-01; Llibre Mestre
 * P1-11, ordre del Mestre 261024 18:21) · El panell de la segona pestanya de
 * la pàgina d'un poble, «Empreses i entitats»: les empreses, les entitats i
 * els grups públics que declaren eixe poble (organizations.town_name).
 *
 * Cap peça nova: la targeta és la del directori (UniversalCard, la
 * mateixa de /perfil: «Llegir més» a la fitxa pública, el Connectar
 * centralitzat i el botó gran «Anar al xat» de l'entitat), dins de
 * GraellaTargetes; el Carregant, EstatErrorDades amb «Torna-ho a provar» i
 * el buit amb role=status, com el panell «Gent de …». Cap botó solt de
 * seguir: la relació passa per /connectar (doctrina del Connectar).
 * Les dades, useEntitatsDelPoble (el filtre `poble` del directori, al
 * servidor). El munta la meta de Pobles (detailSectionMeta.jsx) en diferit
 * (lazyRoute) i només quan la persona obri la pestanya: la pàgina del poble
 * no fa cap petició de més si no la mira.
 */
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { useNavigate } from '../../app/contexts/RouterContext';
import { UniversalCard } from '../../components/PedraSeca';
import { encapcalamentDeTargeta } from '../../components/universal/editorial.js';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { GraellaTargetes } from '../../components/PedraSeca/organismes/GraellaTargetes.jsx';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { SlotErrorBoundary } from '../../components/universal/workspace/SlotErrorBoundary.jsx';
import { objecteDePerfil, rutaConnectarPerfil, rutaDePerfil, rutaXatDePagina } from '../../config/navigation.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { fontVideoPropia } from '../../utils/sanitize.js';
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';
import { FalladaDeLHistoric } from '../mur/PublicacionsDeLActor.jsx';
import { useEntitatsDelPoble } from './useEntitatsDelPoble.js';
import { entradaDeEntitat, senseTraduccioEntitats, textosDeLesEntitats, tipusDeKind } from './entitatsDelPobleModel.js';

/* El traductor de l'App, o res fora d'ella (una prova, el catàleg). */
function useTraductor() {
  try {
    return useUIActions().t;
  } catch {
    return senseTraduccioEntitats;
  }
}

function TargetaDeLEntitat({ fila, textos, t, navigate }) {
  const tipus = tipusDeKind(fila.kind);
  const perfil = { tipus, id: fila.id, nom: fila.name };
  const connectar = rutaConnectarPerfil(perfil);
  const desti = rutaXatDePagina(objecteDePerfil(perfil));
  const poble = typeof fila.town_name === 'string' ? fila.town_name.trim() : '';
  const capcalera = encapcalamentDeTargeta(fila, { author: fila.name, location: poble, t });
  const lemaNet = typeof fila.lema === 'string' ? fila.lema.trim() : '';
  const subtitolTargeta = lemaNet && lemaNet !== String(capcalera.location || '').trim() ? fila.lema : undefined;
  const verbXat = t('section.xat.anarAlXat', 'Anar al xat');
  const nomPortaXat = fila.name ? `${verbXat} ${fila.name}` : verbXat;
  /* R22.1 · El vídeo principal és el de la fila del directori
     (COLUMNES_DIRECTORI; la vista el porta des de 20261113060000), mai un de
     llavor hidratat al client: sense columna o sense vídeo, la targeta de sempre.
     Gauntlet R22.1 (regressió de la targeta) · Una referència opaca del bucket
     públic (sdp-media://mitjans/…, que el validador i el CHECK admeten) es
     resol pel port (useResolvedAsset → resolveAsset), com la portada i el
     logotip i com a la fitxa pública (FitxaPublica), i després passa pel
     filtre de vídeo propi. Abans es filtrava crua i no es veia mai: mentre es
     resol, o si no es pot resoldre, la targeta de sempre. */
  const videoCru = typeof fila.hero_video_url === 'string' ? fila.hero_video_url.trim() : '';
  /* La forma canònica que demana el port: l'esquema en minúscules (com refDelPort d'UniversalCard). */
  const videoDelPort = useResolvedAsset(esMitjaOpac(videoCru) ? videoCru.replace(/^sdp-media:/i, 'sdp-media:') : '');
  const videoHero = videoCru
    ? fontVideoPropia(esMitjaOpac(videoCru) ? videoDelPort : resolRecursPropi(videoCru))
    : null;
  const imatgeTargeta = videoHero
    ? (resolRecursPropi(fila.hero_url || fila.logo_url) || undefined)
    : (fila.logo_url || fila.hero_url || undefined);
  /* PS-07 (B7, marató 261101_2143) · Un sol primari per vista: el blau és
     de l'acció de la pàgina del poble; «Anar al xat» de cada entitat de la
     graella és secundari, gran i a l'ample com sempre. */
  return (
    <UniversalCard
      mainHref={rutaDePerfil(tipus, fila.id)}
      imageUrl={imatgeTargeta}
      videoUrl={videoHero || undefined}
      title={fila.name}
      subtitle={subtitolTargeta}
      body={fila.description || undefined}
      labels={[textos.tipus[fila.kind] || textos.tipus.entity]}
      {...capcalera}
      authorHref={rutaDePerfil(tipus, fila.id)}
      avatarUrl={fila.logo_url || undefined}
      onMainClick={(event) => { event.preventDefault(); navigate(rutaDePerfil(tipus, fila.id), {}); }}
      onConnect={connectar ? () => navigate(connectar) : undefined}
      accio={desti ? <PortaDePagina porta={{ id: 'xat-de-l-entitat', verb: verbXat, nom: nomPortaXat, desti, varietat: 'secundari' }} varietat="secundari" /> : null}
      etiquetesAmbAccio
      objecte={objecteDePerfil(perfil) || undefined}
      hasFooter
      showTranslate
      showComment
      showShare
    />
  );
}

function useIdiomaEntitats() {
  try {
    const estat = useUIState();
    return estat?.language || estat?.externalConfig?.language || 'ca';
  } catch {
    return 'ca';
  }
}

function EntitatsDelPobleAmbDades({ poble, textos, t }) {
  const navigate = useNavigate();
  const { estat, entitats, error, refresh } = useEntitatsDelPoble(poble);
  if (estat === 'sense-poble' || (estat === 'ready' && !entitats.length)) {
    return <p role="status" className="sdp-paragraf-centrat">{textos.buit}</p>;
  }
  /* C11-01 · Un servidor que no sap el poble de les organitzacions: el mateix avís que sense directori, sense «Torna-ho a provar» fals. */
  if (estat === 'no-disponible' || (estat === 'error' && error?.code === 'NO-DISPONIBLE')) {
    return <p role="status" className="sdp-paragraf-centrat">{textos.noDisponible}</p>;
  }
  if (estat === 'error') return <EstatErrorDades titol={textos.error} error={error} onReintenta={refresh} />;
  if (estat !== 'ready') return <Carregant etiqueta={textos.carregant} />;
  return (
    <GraellaTargetes elements={entitats.map(entradaDeEntitat)}>
      {({ id, fila }) => <TargetaDeLEntitat key={id} fila={fila} textos={textos} t={t} navigate={navigate} />}
    </GraellaTargetes>
  );
}

/** Les organitzacions públiques de `poble` (una fitxa de /pobles), dins de la barrera de les targetes. */
export function EntitatsDelPoble({ poble }) {
  const t = useTraductor();
  const idioma = useIdiomaEntitats();
  const textos = textosDeLesEntitats(t, idioma);
  return (
    <SlotErrorBoundary
      resetKey={String(poble?.id ?? '')}
      fallback={({ reinicia }) => <FalladaDeLHistoric t={t} textos={textos} reinicia={reinicia} />}
    >
      <EntitatsDelPobleAmbDades poble={poble} textos={textos} t={t} />
    </SlotErrorBoundary>
  );
}

export default EntitatsDelPoble;
