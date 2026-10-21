import { UniversalPage } from '../../components/universal/UniversalPage';
import SectionItemCard from '../../components/SectionItemCard';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNavigate } from '../../app/contexts/RouterContext';
import { objecteDePerfil, rutaConnectarPerfil, rutaDePerfil, rutaXatDePagina } from '../../config/navigation.js';
/* El tipus d'agent del catàleg, en el vocabulari del perfil públic. Gauntlet
   261016 (Bloc 3) · La font única viu a la capa de dades (agentsSeed.js), on
   un personatge ANIMAL és una IA; abans n'hi havia una còpia ací. */
import { tipusDAgent } from '../../data/agentsSeed.js';
import { ETIQUETA_IA } from './fitxaDePerfil.js';

/* Gauntlet 261016 (Bloc 3; ordre del Mestre: els personatges ANIMAL i els
   agents són IA «no com a humans», «preservant la seua fitxa») · L'etiqueta
   de la targeta del directori: per a una IA (tipusDAgent 'ia': AI i ANIMAL),
   la marca d'IA, ETIQUETA_IA, la de la seua fitxa pública; mai l'etiqueta
   humana del catàleg (El Pregoner i L'Acompanyant de Paraula hi porten
   'GENT'; ordre del Mestre, 261021, pla 261021_0015 §12). La fitxa del
   catàleg no es toca: només canvia el que pinta la targeta. La resta, el tag
   de sempre. */
const etiquetaDeLaTargeta = (agent) => (tipusDAgent(agent) === 'ia' ? ETIQUETA_IA : agent?.tag);

/* Gauntlet 261016 (Bloc 3; ordre del Mestre: «mostrar clarament el poble de
   cada persona a la targeta del directori») · El poble va a la boina de la
   targeta (`location`), on UniversalCard el pinta també per a una persona (la
   guarda de dignitat no el toca). Amb el poble va l'avatar de l'agent: sense,
   la boina pintaria la silueta de reserva al costat d'una fitxa que sí que
   té foto. A totes les targetes del directori, per coherència de la graella.
   Sense poble, cap prop nova: el DOM de sempre. */
const boinaDelPoble = (agent) => {
  const poble = typeof agent?.town_name === 'string' ? agent.town_name.trim() : '';
  return poble ? { location: poble, avatarUrl: agent.avatar_url || undefined } : {};
};

/**
 * El directori de persones, entitats i agents del portal. Cada targeta porta
 * al perfil públic (PerfilPublicSection, rutes /gent, /empresa i /perfil/:id).
 */
export default function ProfileSection({ agents = [] }) {
  const { t } = useUIActions();
  const navigate = useNavigate();
  /* T43 (ordre del Mestre, 260928) · Connectar una persona, entitat o IA del
     directori porta el seu descriptor (tipus, id i ruta del perfil públic) i,
     per a una entitat, `organitzacio=ID`: el mateix camí que la fitxa pública. */
  const connecta = (agent) => {
    const ruta = rutaConnectarPerfil({ tipus: tipusDAgent(agent), id: agent?.id, nom: agent?.name });
    return ruta ? () => navigate(ruta) : undefined;
  };
  /* Onada 8 (261009; requeriments, punt 4) · La targeta d'una entitat (o
     d'un grup) del directori porta el botó gran «Anar al xat», cap al xat
     comú de la seua pàgina (la Comunitat: rutaXatDePagina sobre el seu
     descriptor, el mateix de «Comentar · En públic»), com la del poble. Una
     persona o una IA no en tenen (el seu és el directe, «En privat»): cap
     botó. Les etiquetes es queden (etiquetesAmbAccio). */
  const portaDelXat = (agent) => {
    const tipus = tipusDAgent(agent);
    if (tipus !== 'entitat' && tipus !== 'grup') return null;
    const desti = rutaXatDePagina(objecteDePerfil({ tipus, id: agent?.id, nom: agent?.name }));
    return desti ? <PortaDePagina porta={{ id: 'xat-de-l-entitat', verb: t('section.xat.anarAlXat', 'Anar al xat'), desti, varietat: 'primari' }} /> : null;
  };

  return (
    <UniversalPage
      title={t('section.profile.title', 'Agents i persones')}
      subtitle={t('section.profile.subtitle', 'Directori de persones, grups i agents del portal.')}
      chrome="system"
      showLogos={true}
    >
      <div className="feed-grid">
        {agents.map((agent, index) => (
          <SectionItemCard
            key={`${agent.id}-${index}`}
            to={rutaDePerfil(tipusDAgent(agent), agent.id)}
            state={{ preloadedItem: agent }}
            image={agent.avatar_url}
            title={agent.name}
            subtitle={agent.role}
            excerpt={agent.short_bio}
            eyebrow={etiquetaDeLaTargeta(agent)}
            meta={[agent.type]}
            buttonLabel={t('common.readMore', 'Llegir més')}
            onConnect={connecta(agent)}
            accio={portaDelXat(agent)}
            etiquetesAmbAccio
            {...boinaDelPoble(agent)}
          />
        ))}
      </div>
    </UniversalPage>
  );
}
