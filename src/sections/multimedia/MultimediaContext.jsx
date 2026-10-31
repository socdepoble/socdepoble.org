import { backendScope } from '../../config/backendConfig.js';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { useScopedResource } from '../../app/contexts/useScopedResource.js';
import { useContext, useMemo } from 'react';
/* P1-71 (Gauntlet 261029) · L'objecte de context viu a objectesDeContext.js,
   que no importa res del projecte. */
import { MultimediaContext } from './objectesDeContext.js';
import { loadMultimedia } from '../../data/backendPort.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useMur } from '../mur/MurContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { esFontImatgePropia } from '../../utils/sanitize.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { fotosDeLAgenda, fotosDelMercat, fotosDelMur, fotosDelsPobles, fusionaMitjans } from './mediaContent.js';
import { agrupaPerMes } from './cronologia.js';

import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

const CAP = Object.freeze([]);

/* Onada 0.3 (Gauntlet 261016, M03) · Una foto viva entra a l'Arxiu si el
   navegador la pot pintar sense eixir de casa: pròpia (Decisió 3 del Mestre,
   261007: cap imatge de tercers, ni a l'Arxiu) i no opaca (una sdp-media://
   la resol el port, no un <img>). */
const esFotoVivaPintable = (foto) => esFontImatgePropia(foto.src) && !esMitjaOpac(foto.src);

export function MultimediaProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const { currentUser } = useSession();
  /* Decisió 2 del Mestre (261007) · Renovació silenciosa. La clau d'àmbit és
     la d'AÏLLAMENT (backend, persona, actor), sense `generacio`: renovar el
     JWT ja no buida la Multimèdia. La frescor per generació la porta
     useScopedResource. */
  const scopeKey = JSON.stringify([backendScope(config),
    currentUser?.id, actorKey]);
  const data = useScopedResource(loadMultimedia, actorId, scopeKey, config);
  const { status, payload, error, errorRevalidacio, refresh } = data;

  /* Onada 0.3 (Gauntlet 261016, M03 i I35; MCR 261016, b03_multimedia.2) ·
     Les fotos vives dels articles que el proveïdor ja té carregats: el Mur,
     el Mercat i l'Agenda (MurProvider) i els Pobles (CoreContentProvider), que
     embolcallen este proveïdor (App.jsx · AppContent). Abans només arribaven
     a /multimedia les de la llavor estàtica: una foto nova del Mur no hi era
     mai. Es memoritzen sobre les llistes, no sobre el valor dels proveïdors. */
  const { feedPosts = CAP, marketItems = CAP, events = CAP } = useMur();
  const { towns = CAP } = useCoreContent();
  const vives = useMemo(() => [
    ...fotosDelMur(feedPosts || CAP),
    ...fotosDelMercat(marketItems || CAP),
    ...fotosDeLAgenda(events || CAP),
    ...fotosDelsPobles((towns || CAP).filter((town) => town?.image_url))
  ].filter(esFotoVivaPintable), [feedPosts, marketItems, events, towns]);

  const delPort = status === 'ready' && payload ? (payload.mediaItems || CAP) : null;
  /* Els del port davant i en el seu ordre; les vives que encara no hi són,
     darrere (fusionaMitjans: per id, per src i, des de la revisió adversarial
     del 261016, per article: una entrada rància de la fila remota d'abans de
     l'Onada 12 deixa el seu lloc a la foto viva del mateix article, i sense
     viva, si porta un logotip o un avatar, no entra). Mentre carrega o amb
     error, res: el contingut d'un altre àmbit no s'ensenya mai
     (useScopedResource). */
  const mediaItems = useMemo(() => (delPort ? fusionaMitjans(delPort, vives) : CAP), [delPort, vives]);
  /* Onada 0.3 (I35) · La Cronologia es calcula ací (cronologia.js): abans es
     llegia payload.mediaTimelineGroups, que cap adaptador no torna, i la vista
     era sempre buida. */
  const mediaTimelineGroups = useMemo(() => (mediaItems.length ? agrupaPerMes(mediaItems) : CAP), [mediaItems]);

  /* Decisió 2 del Mestre (261007) · El valor es memoritza sobre camps i no
     sobre `data`: la marca `revalidant` fa un `data` nou en cada renovació i
     cada refresh, i amb `[data]` es tornava a pintar cada consumidor de
     useMultimedia sense cap dada nova. `revalidant` no s'exposa (cap
     consumidor no la llig); `errorRevalidacio` sí, a banda de `status`. */
  const value = useMemo(() => ({
    status,
    error,
    errorRevalidacio,
    mediaItems,
    mediaTimelineGroups,
    refresh
  }), [status, error, errorRevalidacio, mediaItems, mediaTimelineGroups, refresh]);

  useRecarregaExterna(refresh);

  return <MultimediaContext.Provider value={value}>{children}</MultimediaContext.Provider>;
}

export function useMultimedia() {
  return useContext(MultimediaContext) || { status: 'loading', mediaItems: [], mediaTimelineGroups: [] };
}
