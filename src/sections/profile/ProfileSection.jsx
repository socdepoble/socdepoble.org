import { UniversalPage } from '../../components/universal/UniversalPage';
import SectionItemCard from '../../components/SectionItemCard';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNavigate } from '../../app/contexts/RouterContext';
import { rutaConnectarPerfil, rutaDePerfil } from '../../config/navigation.js';

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
          />
        ))}
      </div>
    </UniversalPage>
  );
}
