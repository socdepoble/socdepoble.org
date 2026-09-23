import { ItemMedia } from '../../components/universal/workspace/ItemMedia.jsx';
import { UniversalCard } from '../../components/PedraSeca';
import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
import { useMemo } from 'react';
import { Lock, PenSquare } from 'lucide-react';

/**
 * Targeta rica de nota per al llistat del Bloc de Notes.
 * S'injecta al UniversalWorkspace via `renderItem`; el nucli no la coneix.
 * Quan està activa es converteix en una UniversalCard (Live Preview).
 */
export function NotaFitxa({ item, active, onSelect }) {
  const identitatCtx = useIdentitat();
  const actorId = identitatCtx ? identitatCtx.actorId : null;
  
  const coreCtx = useCoreContent();
  const agents = coreCtx ? coreCtx.agents : [];
  
  const sessionCtx = useSession();
  const currentUser = sessionCtx ? sessionCtx.currentUser : null;

  const currentProfile = useMemo(() => {
    const isExampleNote = item?.id === 'n1';
    if (isExampleNote) {
      return {
        name: 'Sóc de Poble',
        avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
        location: 'La Torre de les Maçanes'
      };
    }
    const agent = agents?.find(a => String(a.id) === String(actorId));
    if (agent) return { name: agent.name, avatar: agent.avatar_url || agent.image_url, location: agent.location };
    return {
      name: currentUser?.user_metadata?.name || currentUser?.full_name || 'Foraster',
      avatar: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || null,
      location: 'Poble de la persona forastera'
    };
  }, [agents, actorId, currentUser, item?.id]);

  if (active) {
    return (
      <UniversalCard
        className="sdp-nota-fitxa-viva"
        variant="pla"
        title={item.title || 'Sense títol'}
        subtitle={item.data?.subtitle || item.subtitle}
        body={item.data?.lead || item.excerpt}
        imageUrl={item.image}
        author={currentProfile.name}
        avatarUrl={currentProfile.avatar}
        location={currentProfile.location}
        onDateTime={false}
        showPin={false}
        showTranslate={false}
        showComment={false}
        showShare={false}
        hasFooter={false}
        onMainClick={onSelect}
        icon={item.data?.isDraft ? <PenSquare size={16} /> : <Lock size={16} />}
      />
    );
  }

  return (
    <button
      type="button"
      className="sdp-gestor-fitxa sdp-nota-fitxa"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <ItemMedia item={item} titleFallback="Sense títol" className="sdp-nota-fitxa__media" />
      <span className="sdp-gestor-fitxa__text sdp-nota-fitxa__text">
        <span className="sdp-nota-fitxa__capcalera">
          <span className="sdp-gestor-fitxa__titol sdp-nota-fitxa__titol">{item.title || 'Sense títol'}</span>
          {item.subtitle ? (
            <time className="sdp-nota-fitxa__data" dateTime={item.updatedAt || undefined}>
              {item.subtitle}
            </time>
          ) : null}
        </span>
        {item.excerpt ? (
          <span className="sdp-gestor-fitxa__subtitol sdp-nota-fitxa__entradeta">{item.excerpt}</span>
        ) : null}
      </span>
    </button>
  );
}
