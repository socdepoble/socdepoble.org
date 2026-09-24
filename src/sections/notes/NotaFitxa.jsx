import { ItemMedia } from '../../components/universal/workspace/ItemMedia.jsx';
import { UniversalCard, Dialeg, Boto } from '../../components/PedraSeca';
import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { TEXTOS_LLAVOR } from '../../components/universal/textosLlavor.js';

const EMPTY_AGENTS = Object.freeze([]);
const TELEMETRIA_PREVISUALITZACIO = Object.freeze({ mode: 'previsualitzacio' });

/**
 * Targeta rica de nota per al llistat del Bloc de Notes.
 * S'injecta al UniversalWorkspace via `renderItem`; el nucli no la coneix.
 * Quan està activa es converteix en una UniversalCard (Live Preview).
 */
export function NotaFitxa({ item, active, onSelect }) {
  const identitatCtx = useIdentitat();
  const actorId = identitatCtx ? identitatCtx.actorId : null;

  const coreCtx = useCoreContent();
  const agents = coreCtx?.agents || EMPTY_AGENTS;

  const sessionCtx = useSession();
  const currentUser = sessionCtx ? sessionCtx.currentUser : null;

  /* El peu blau i la barra taronja ensenyen les proporcions que tindrà la
     nota publicada, però ací els botons no connecten amb res. Interceptem
     el clic i ho diem amb el diàleg del sistema (top layer, Escape, vel i
     creu de tancar), no amb un alert() del navegador. */
  const [avisObert, setAvisObert] = useState(false);
  const mostrarAvisPrevisualitzacio = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAvisObert(true);
  };
  const tancarAvis = () => setAvisObert(false);

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
      <>
        <UniversalCard
          className="sdp-nota-fitxa-viva"
          variant="pla"
          /* La previsualització diu el mateix que l'editor quan el camp és buit. */
          title={item.title || TEXTOS_LLAVOR.titol}
          subtitle={item.data?.subtitle || TEXTOS_LLAVOR.subtitol}
          body={item.data?.lead || TEXTOS_LLAVOR.entradilla}
          imageUrl={item.image}
          author={currentProfile.name}
          avatarUrl={currentProfile.avatar}
          location={currentProfile.location}
          time={item.data?.formattedTime}
          date={item.subtitle}
          dateTime={item.updatedAt}
          onDateTime={mostrarAvisPrevisualitzacio}
          showPin={false}
          showTranslate={true}
          showComment={true}
          showShare={true}
          hasFooter={true}
          showConnect={true}
          connectLabel="CONNECTAR"
          labels={item.labels || item.tags || []}
          copyright={item?.id === 'n1' ? '© Sóc de Poble / Fet per la IAIA i Nano Banana' : undefined}
          onConnect={mostrarAvisPrevisualitzacio}
          /* El Connectar de la previsualització també es compta, marcat com a
             previsualització, perquè el Mestre ho puga comprovar a /notes. */
          telemetria={TELEMETRIA_PREVISUALITZACIO}
          onTranslate={mostrarAvisPrevisualitzacio}
          onComment={mostrarAvisPrevisualitzacio}
          onShare={mostrarAvisPrevisualitzacio}
          onPin={mostrarAvisPrevisualitzacio}
          onMainClick={onSelect}
          headerAction={
            <button type="button" className="btn-icon-orange" aria-label="Informació de previsualització" onClick={mostrarAvisPrevisualitzacio}>
              <Info className="icon" />
            </button>
          }
        />
        <Dialeg
          obert={avisObert}
          onTanca={tancarAvis}
          titol="Això és una previsualització"
          descripcio="Estàs veient com quedarà la nota una vegada publicada al Mur. Els botons d'aquesta targeta —connectar, traduir, comentar i compartir— només funcionen a la publicació de veritat: mentres estigues editant, no fan res."
          mida="m"
          accions={<Boto varietat="accent" onClick={tancarAvis}>Entesos</Boto>}
        />
      </>
    );
  }

  return (
    <button
      type="button"
      className="sdp-gestor-fitxa sdp-nota-fitxa"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <ItemMedia item={item} titleFallback={TEXTOS_LLAVOR.titol} className="sdp-nota-fitxa__media" />
      <span className="sdp-gestor-fitxa__text sdp-nota-fitxa__text">
        <span className="sdp-nota-fitxa__capcalera">
          <span className="sdp-gestor-fitxa__titol sdp-nota-fitxa__titol">{item.title || TEXTOS_LLAVOR.titol}</span>
          {item.subtitle ? (
            <time className="sdp-nota-fitxa__data" dateTime={item.updatedAt || undefined}>
              {item.subtitle}
            </time>
          ) : null}
        </span>
        <span className="sdp-gestor-fitxa__subtitol sdp-nota-fitxa__entradeta">{item.excerpt || TEXTOS_LLAVOR.entradilla}</span>
      </span>
    </button>
  );
}
