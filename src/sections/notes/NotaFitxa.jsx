import { ItemMedia } from '../../components/universal/workspace/ItemMedia.jsx';
import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
import { useMemo } from 'react';
import { TEXTOS_LLAVOR } from '../../components/universal/textosLlavor.js';
import { AVISOS_TARGETA_VIVA, TargetaViva } from '../../components/universal/TargetaViva.jsx';
import { signaturaDeNota } from './autoriaNota.js';

const EMPTY_AGENTS = Object.freeze([]);
const CAP = Object.freeze([]);

/**
 * Targeta rica de nota per al llistat del Bloc de Notes.
 * S'injecta al UniversalWorkspace via `renderItem`; el nucli no la coneix.
 * Quan està activa es converteix en la targeta viva (TargetaViva, T50): la
 * mateixa UniversalCard de la publicació, alimentada pel document cru de la
 * nota (item.data), que ja porta les tecles que s'escriuen (NotesContext).
 *   · D1 · títol, subtítol i entradilla en text pla, no l'HTML de l'editor;
 *   · D2 · signa qui signa la barra taronja de l'editor (autoriaNota.js);
 *   · D3 · la data de publicació triada (T40), si n'hi ha;
 *   · D4 · només l'emoticona triada (item.data.icon), mai la 🪶 de la llista.
 * Poliment T50 · l'avís parla de la publicació al Mur (AVISOS_TARGETA_VIVA)
 * i la targeta exposa que és la fitxa triada (aria-current), com la compacta.
 * Onada 8 (261009) · La boina porta a la pàgina de qui signa, la mateixa de
 * la barra taronja (signaturaDeNota: { nom, avatar, poble, ruta }).
 */
export function NotaFitxa({ item, active, onSelect }) {
  const identitatCtx = useIdentitat();
  const actorId = identitatCtx ? identitatCtx.actorId : null;
  const actor = identitatCtx ? identitatCtx.actor : null;

  const coreCtx = useCoreContent();
  const agents = coreCtx?.agents || EMPTY_AGENTS;

  const sessionCtx = useSession();
  const currentUser = sessionCtx ? sessionCtx.currentUser : null;

  const autor = useMemo(
    () => signaturaDeNota({ notaId: item?.id, actor, actorId, agents, currentUser }),
    [item?.id, actor, actorId, agents, currentUser]
  );

  /* La nota crua, amb la reserva del model de vista de la llista per al títol
     i la imatge (toWorkspaceNote ja els ha resolt: coverImage || heroImage). */
  const notaViva = useMemo(() => ({
    ...item?.data,
    title: item?.data?.title ?? item?.title,
    heroImage: item?.data?.heroImage || item?.image || undefined
  }), [item?.data, item?.title, item?.image]);

  if (active) {
    return (
      <TargetaViva
        className="sdp-nota-fitxa-viva"
        document={notaViva}
        autor={autor}
        etiquetes={item.labels || item.tags || CAP}
        onMainClick={onSelect}
        avis={AVISOS_TARGETA_VIVA.notes}
        actual
      />
    );
  }

  return (
    <button
      type="button"
      className="sdp-gestor-fitxa"
      onClick={onSelect}
    >
      <ItemMedia item={item} titleFallback={TEXTOS_LLAVOR.titol} />
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-nota-fitxa__capcalera">
          <span className="sdp-gestor-fitxa__titol">{item.title || TEXTOS_LLAVOR.titol}</span>
          {item.subtitle ? (
            <time className="sdp-nota-fitxa__data" dateTime={item.updatedAt || undefined}>
              {item.subtitle}
            </time>
          ) : null}
        </span>
        <span className="sdp-gestor-fitxa__subtitol">{item.excerpt || TEXTOS_LLAVOR.entradilla}</span>
      </span>
    </button>
  );
}
