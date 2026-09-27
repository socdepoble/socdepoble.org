import { UniversalPage } from '../../components/universal/UniversalPage';
import SectionItemCard from '../../components/SectionItemCard';
import { useUIActions } from '../../app/contexts/UIContext';
import { rutaDePerfil } from '../../config/navigation.js';

/* El tipus d'agent del catàleg, en el vocabulari del perfil públic. */
const TIPUS = Object.freeze({ AI: 'ia', COMPANY: 'entitat' });
export const tipusDAgent = (agent) => TIPUS[agent?.type] || 'persona';

/**
 * El directori de persones, entitats i agents del portal. Cada targeta porta
 * al perfil públic (PerfilPublicSection, rutes /gent, /empresa i /perfil/:id).
 */
export default function ProfileSection({ agents = [] }) {
  const { t } = useUIActions();

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
          />
        ))}
      </div>
    </UniversalPage>
  );
}
