import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { backendScope } from '../../config/backendConfig.js';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { useScopedResource } from '../../app/contexts/useScopedResource.js';
import { useContext, useEffect, useMemo, useRef } from 'react';
/* P1-71 (Gauntlet 261029) · L'objecte de context viu a objectesDeContext.js,
   que no importa res del projecte. */
import { MultimediaContext } from './objectesDeContext.js';
import { loadMultimedia } from '../../data/backendPort.js';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext.jsx';
import { useMur } from '../mur/MurContext.jsx';
import { IDENTITAT_DE_RESERVA, useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
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

/* P1-71 (marató nocturna 261101, T5.1) · Defensa en profunditat: el
   blindatge de CoreContentProvider (Bloc G del pla 261029_1605), també ací.
   La causa arrel del pet «useIdentitat ha de ser usat dins de
   IdentitatProvider» en una recàrrega en calent (dos createContext per a un
   mateix context) la va tancar objectesDeContext.js el 261029. Este canvi tot
   sol no salva /multimedia de l'ErrorBoundary (Gauntlet 261101, G-D2): a
   App.jsx, MurProvider, NotesDataProvider, NotesProvider i XatProvider
   embolcallen este proveïdor i criden useIdentitat(), i sense IdentitatProvider
   el pet ix d'ells abans d'arribar ací. Tampoc no toca «Comprovant la
   sessió…», que és de RequireAuth i del botó d'identitat de la barra
   (BotoIdentitatActiva, useIdentitatDeLaBarra). Blindar els altres quatre és
   una decisió del Mestre: el Xat i les Notes funcionarien com a anònims.
   Sense proveïdor, la reserva és la d'un visitant anònim, mai la d'una altra
   persona: la clau d'àmbit 'anon' no coincidix amb cap «tipus::id», i l'Arxiu
   es carrega com el veu qui no ha entrat. Dins del proveïdor, res no canvia.
   useSession(), davall, continua exigint el seu proveïdor, com a
   CoreContentProvider. Gauntlet 2 261101 (G2-10) · La reserva és la de
   CoreContentProvider (IDENTITAT_DE_RESERVA, importada): una sola font. */
export function MultimediaProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitatOpcional() || IDENTITAT_DE_RESERVA;
  const { currentUser } = useSession();
  const moderacio = useModeracio();
  /* Decisió 2 del Mestre (261007) · Renovació silenciosa. La clau d'àmbit és
     la d'AÏLLAMENT (backend, persona, actor), sense `generacio`: renovar el
     JWT ja no buida la Multimèdia. La frescor per generació la porta
     useScopedResource.
     Gauntlet R22 (notes-04) · versioBloquejos és FRESCOR, no identitat (com a
     MurContext): dins de la clau d'aïllament, cada bloqueig o desbloqueig
     buidava l'Arxiu fins a «Carregant». Ara un canvi revalida en segon pla
     (refresh, baix) i el que ja hi era es queda en 'ready'. */
  const versioBloquejos = moderacio?.versioBloquejos || 0;
  const scopeKey = JSON.stringify([backendScope(config),
    currentUser?.id, actorKey]);
  const data = useScopedResource(loadMultimedia, actorId, scopeKey, config);
  const { status, payload, error, errorRevalidacio, refresh } = data;

  /* Gauntlet R22 (notes-04) · Un bloqueig (o desbloqueig) nou revalida sense
     passar per 'loading'; el primer muntatge no fa res. */
  const versioBloquejosVista = useRef(versioBloquejos);
  useEffect(() => {
    if (versioBloquejosVista.current === versioBloquejos) return;
    versioBloquejosVista.current = versioBloquejos;
    refresh?.();
  }, [versioBloquejos, refresh]);

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
