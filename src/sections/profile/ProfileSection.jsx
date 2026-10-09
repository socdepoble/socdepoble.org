import { UniversalPage } from '../../components/universal/UniversalPage';
import SectionItemCard from '../../components/SectionItemCard';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNavigate } from '../../app/contexts/RouterContext';
import { objecteDePerfil, rutaConnectarPerfil, rutaDePerfil, rutaXatDePagina } from '../../config/navigation.js';

/* El tipus d'agent del catàleg, en el vocabulari del perfil públic. */
const TIPUS = Object.freeze({ AI: 'ia', COMPANY: 'entitat' });
export const tipusDAgent = (agent) => TIPUS[agent?.type] || 'persona';

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
            eyebrow={agent.tag}
            meta={[agent.type]}
            buttonLabel={t('common.readMore', 'Llegir més')}
            onConnect={connecta(agent)}
            accio={portaDelXat(agent)}
            etiquetesAmbAccio
          />
        ))}
      </div>
    </UniversalPage>
  );
}
