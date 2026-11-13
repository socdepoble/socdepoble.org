import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard } from '../../components/PedraSeca';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { gestionaTeclaGraella } from '../../components/universal/workspace/navegacioTeclat.js';
import { dataDElement, encapcalamentDeTargeta } from '../../components/universal/editorial.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { objecteDePerfil, rutaConnectarPerfil, rutaDePerfil, rutaXatDePagina } from '../../config/navigation.js';
import { AGENTS_MAP, tipusDAgent } from '../../data/agentsSeed.js';
import { ETIQUETA_IA, TEXTOS_FITXA_PERFIL } from './fitxaDePerfil.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { fontVideoPropia } from '../../utils/sanitize.js';
import SubnavigacioPoblesIGent, { encapcalamentDirectoriGent, filtraAgentsDelDirectori } from '../pobles/SubnavigacioPoblesIGent.jsx';

/* Technical catalogue fallback, from the same source as the repaired server.
   This is not a person's birth date or legal incorporation date. */
const DATA_FUNDACIONAL_SDP = AGENTS_MAP.SOCDEPOBLE.created_at;

function pobleNormalitzat(agent) {
  const cru = typeof agent?.town_name === 'string' ? agent.town_name.trim() : '';
  if (cru === 'Sóc de Poble') return AGENTS_MAP.SOCDEPOBLE.town_name;
  if (!cru && agent?.id === AGENTS_MAP.SOCDEPOBLE.id) return AGENTS_MAP.SOCDEPOBLE.town_name;
  return cru;
}

/* Gauntlet 261016 (Bloc 3; ordre del Mestre: les IA «no com a humans») i
   Gauntlet R21 (regressio_ui_xat-04, honestedat_textos-03) · L'etiqueta de la
   targeta del directori: per a una IA (tipusDAgent 'ia'; al directori, només la
   IAIA MarIA) la marca d'IA de la seua fitxa, ETIQUETA_IA («Intel·ligència
   artificial», en la llengua de la interfície), mai l'etiqueta interna del
   catàleg («MASTER») ni una d'humana que porte el contingut remot («GENT»). Una
   persona no en porta cap (Dignitat Humana); una entitat, la seua. */
function etiquetesDeTargeta(agent, tipus, t) {
  if (tipus === 'ia') return [t(TEXTOS_FITXA_PERFIL.ia[0], ETIQUETA_IA)];
  return tipus !== 'persona' && agent?.tag ? [agent.tag] : [];
}

function dataDeTargetaDirectori(agent) {
  const directa = dataDElement(agent);
  if (directa.date || directa.time) return directa;
  if (agent?.id === AGENTS_MAP.SOCDEPOBLE.id) {
    return dataDElement({ created_at: DATA_FUNDACIONAL_SDP });
  }
  return directa;
}

/**
 * R21.5 · El directori de persones, entitats i col·lectius d’este poble (/perfil).
 * Reixeta responsiva `sdp-card-grid` amb `UniversalCard` directa (1/2/3 columnes
 * segons `@container`), barra taronja completa (avatar + nom + poble + data),
 * enquadrament 1:1, Dignitat Humana per a persones i botó secundari «Anar al xat»
 * per a entitats (`PS-07`). La purga exclou els personatges històrics i conserva la IAIA canònica.
 */
export default function ProfileSection({ agents = [] }) {
  const { t, language } = useUIActions();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filtreTipus = ['persona', 'entitat'].includes(params.get('tipus')) ? params.get('tipus') : 'tots';
  const canviaFiltreTipus = (valor) => {
    const next = new URLSearchParams(params);
    if (valor === 'persona' || valor === 'entitat') next.set('tipus', valor);
    else next.delete('tipus');
    if (next.toString() !== params.toString()) setParams(next, { replace: false });
  };
  const agentsVisibles = filtraAgentsDelDirectori(agents, filtreTipus);

  const connecta = (agent, tipus) => {
    const ruta = rutaConnectarPerfil({ tipus, id: agent?.id, nom: agent?.name });
    return ruta ? () => navigate(ruta) : undefined;
  };

  const portaDelXat = (agent, tipus) => {
    if (tipus !== 'entitat' && tipus !== 'grup') return null;
    const desti = rutaXatDePagina(objecteDePerfil({ tipus, id: agent?.id, nom: agent?.name }));
    return desti
      ? <PortaDePagina porta={{ id: 'xat-de-l-entitat', verb: t('section.xat.anarAlXat', 'Anar al xat'), desti, varietat: 'secundari' }} varietat="secundari" />
      : null;
  };

  const reservesCap = encapcalamentDirectoriGent(language);
  const { titol, subtitol } = encapcalamentDirectoriGent(
    language,
    t('section.profile.title', reservesCap.titol),
    t('section.profile.subtitle', reservesCap.subtitol)
  );

  return (
    <UniversalPage
      title={titol}
      subtitle={subtitol}
      chrome="system"
      showLogos={true}
    >
      <SubnavigacioPoblesIGent
        actiu="perfil"
        idioma={language}
        filtreActiu={filtreTipus}
        onCanviaFiltre={canviaFiltreTipus}
      />
      <div className="sdp-card-grid" onKeyDown={gestionaTeclaGraella}>
        {agentsVisibles.map((agent, index) => {
          const tipus = tipusDAgent(agent);
          const ruta = rutaDePerfil(tipus, agent.id);
          const objecte = objecteDePerfil({ tipus, id: agent?.id, nom: agent?.name }) || undefined;
          const poble = pobleNormalitzat(agent);
          const capcalera = encapcalamentDeTargeta(agent, { author: agent.name, location: poble, t });
          const fontData = dataDeTargetaDirectori(agent);
          const data = fontData.date ? fontData : capcalera;
          const excerpt = agent.short_bio || agent.lema || agent.type || '';
          const labels = etiquetesDeTargeta(agent, tipus, t);
          const videoHero = typeof agent?.hero_video_url === 'string' && agent.hero_video_url.trim()
            ? fontVideoPropia(resolRecursPropi(agent.hero_video_url))
            : null;
          const imatgeTargeta = videoHero
            ? (resolRecursPropi(agent.hero_url || agent.avatar_url) || agent.avatar_url)
            : agent.avatar_url;

          return (
            <UniversalCard
              key={`${agent.id}-${index}`}
              author={capcalera.author}
              authorHref={ruta || undefined}
              avatarUrl={agent.avatar_url || undefined}
              location={capcalera.location}
              date={data.date}
              time={data.time}
              dateTime={data.dateTime}
              imageUrl={imatgeTargeta}
              videoUrl={videoHero || undefined}
              imageAlt={agent.name}
              title={agent.name}
              subtitle={agent.role}
              body={excerpt}
              labels={labels}
              accio={portaDelXat(agent, tipus)}
              etiquetesAmbAccio
              mainHref={ruta || undefined}
              onMainClick={ruta ? (e) => {
                e.preventDefault();
                navigate(ruta, { state: { preloadedItem: agent } });
              } : undefined}
              hasFooter={true}
              showTranslate={true}
              showComment={true}
              showShare={true}
              showConnect={true}
              objecte={objecte}
              onConnect={connecta(agent, tipus)}
            />
          );
        })}
      </div>
    </UniversalPage>
  );
}
