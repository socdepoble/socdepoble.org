/**
 * useEdicioEnLloc.js — R32.44 / R32.45 · IDEA-324 v3
 *
 * Resol si la icona d'edició in-situ (`✏️ Editar`) de la BarraBlava s'ha de
 * mostrar per a la peça actual (pàgina de sistema o publicació del Mur,
 * Mercat, Esdeveniments/Calendari o verticals), commuta automàticament la
 * identitat activa (`setActor`) cap a l'entitat o persona propietària quan
 * l'usuari loguejat hi té permís de signatura, guarda en memòria efímera el
 * perfil previ (`actorAnterior`) per oferir el retorn d'1 clic («Vols tornar a
 * ser Javi?»), i obri el Bloc de Notes amb les dues columnes esquerres
 * plegades (`?plegades=1`) i ruta de retorn (`?retorn=...`).
 */
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from '../app/contexts/RouterContext';
import { useSessioOpcional } from '../app/contexts/SessionContext';
import { potSignarPer, useIdentitatOpcional } from '../app/contexts/IdentitatContext';
import { useTraductorOpcional } from '../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useToast } from '../components/universal/NotificationContext';
import { useSuperadminEstable } from './useSuperadminEstable.js';
import {
  ENTITAT_PILOT_ID,
  ENTITAT_PILOT_SLUG,
  PERSONA_PILOT,
  aliesDeLActor,
  entitatSeed,
  rolALEntitat
} from '../data/identitatsSeed.js';
import { esAliesDelProjecte, pertanyALActor } from '../sections/notes/pertinencaDeLActor.js';
import { modeDeDadesResolt } from '../sections/notes/autoriaDeLActor.js';
import { autorDe, esRutaInterna } from '../config/navigation.js';
import {
  llegixCanviIdentitatEdicio,
  netejaCanviIdentitatEdicio,
  registraCanviIdentitatEdicio
} from '../data/retornIdentitatEdicio.js';

const CARPETA_DE_SECCIO = Object.freeze({
  mur: 'f-mur',
  mercat: 'f-mercat',
  events: 'f-events',
  sistema: 'f-sistema'
});

const VERTICALS_DEL_MUR = Object.freeze(new Set([
  'mur',
  'calendari',
  'mapa',
  'vehicle',
  'animalets',
  'treball',
  'habitatge'
]));

const INACTIU = Object.freeze({ editarVisible: false, onEdit: null, editLabel: null });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOM_PROJECTE_RESERVA = 'Sóc de Poble';

function useNavigateSegur() {
  try { return useNavigate(); } catch { return null; }
}
function useLocationSegura() {
  try { return useLocation(); } catch { return null; }
}
function useSessioSegura() {
  try { return useSessioOpcional(); } catch { return null; }
}
function useIdentitatSegura() {
  try { return useIdentitatOpcional(); } catch { return null; }
}

function formatToastIdentitat(t, nom) {
  const plantilla = typeof t === 'function'
    ? t('pagina.barra.editantCom', 'Editant com a {nom}')
    : 'Editant com a {nom}';
  return plantilla.replace('{nom}', nom);
}

function esPertinencaDelProjecte(m, dataMode) {
  if (!m || !potSignarPer(m)) return false;
  const alies = aliesDeLActor({ tipus: 'entitat', id: m.id, slug: m.slug }, { dataMode });
  return esAliesDelProjecte(alies);
}

function seccioDelMasDeRuta(sectionId) {
  if (sectionId === 'mercat') return 'mercat';
  if (sectionId === 'events') return 'events';
  if (VERTICALS_DEL_MUR.has(sectionId)) return 'mur';
  return '';
}

function nomDeLActorActiu(actor, actorType, actorId, currentUser, memberships) {
  if (actorType === 'entitat') {
    if (actor?.nom) return actor.nom;
    const m = Array.isArray(memberships)
      ? memberships.find((x) => String(x?.id) === String(actorId))
      : null;
    return m?.name || m?.slug || NOM_PROJECTE_RESERVA;
  }
  return actor?.nom
    || currentUser?.user_metadata?.full_name
    || currentUser?.full_name
    || PERSONA_PILOT.nom;
}

export function useEdicioEnLloc({
  tipus,
  pageKey = '',
  sectionId = '',
  item = null,
  notes = null,
  enContext = false
} = {}) {
  const sessio = useSessioSegura();
  const identitat = useIdentitatSegura();
  const { esSuperadmin } = useSuperadminEstable();
  const t = useTraductorOpcional();
  const { showToast } = useToast();
  const navigate = useNavigateSegur();
  const location = useLocationSegura();

  const currentUser = sessio?.currentUser ?? null;
  const userId = currentUser?.id ?? null;
  const dataMode = userId ? (modeDeDadesResolt(sessio?.config) || 'seed') : 'seed';
  const actor = identitat?.actor ?? null;
  const actorType = identitat?.actorType ?? (actor?.tipus === 'entitat' ? 'entitat' : 'persona');
  const actorId = identitat?.actorId ?? actor?.id ?? null;
  const memberships = identitat?.memberships;
  const setActor = identitat?.setActor ?? null;

  const resolucio = useMemo(() => {
    if (enContext || !userId || typeof navigate !== 'function') return null;

    const llistaMembres = Array.isArray(memberships) ? memberships : [];
    const aliesActiu = actor ? aliesDeLActor(actor, { dataMode }) : new Set();

    const clauPagina = tipus === 'pagina'
      ? String(pageKey || '').trim()
      : (item?.isSystem ? String(item?.id || '').trim() : '');

    if (tipus === 'pagina' || item?.isSystem) {
      if (!clauPagina) return null;
      const jaEsProjecte = esAliesDelProjecte(aliesActiu);
      const membreProjecte = llistaMembres.find((m) => esPertinencaDelProjecte(m, dataMode)) || null;
      const tePermisProjecte = jaEsProjecte
        || Boolean(membreProjecte)
        || esSuperadmin === true
        || ((dataMode === 'seed' || dataMode === 'local')
          && rolALEntitat(ENTITAT_PILOT_ID, userId, { teSessio: true }) === 'owner');
      if (!tePermisProjecte) return null;
      const entitatSeedPilot = entitatSeed(ENTITAT_PILOT_SLUG);
      return {
        seccio: 'sistema',
        carpeta: CARPETA_DE_SECCIO.sistema,
        notaId: `publicacio:sistema:${clauPagina}`,
        canviActor: jaEsProjecte
          ? null
          : {
            tipus: 'entitat',
            id: membreProjecte?.id ?? ENTITAT_PILOT_ID,
            nom: membreProjecte?.name || entitatSeedPilot?.name || NOM_PROJECTE_RESERVA
          }
      };
    }

    if (tipus !== 'publicacio' || !item || item.id == null) return null;
    const seccioNorm = seccioDelMasDeRuta(sectionId);
    if (!seccioNorm) return null;
    if (seccioNorm === 'mercat' && !UUID.test(String(item.id)) && item.ambit !== 'mercat') {
      return null;
    }

    const autor = autorDe(item);
    const idEntitatItem = item.author_org_id ?? item.authorOrgId ?? item.author_entity_id ?? null;
    const signables = llistaMembres.filter(potSignarPer);

    for (const m of signables) {
      const aliesOrg = aliesDeLActor({ tipus: 'entitat', id: m.id, slug: m.slug }, { dataMode });
      if ((idEntitatItem != null && aliesOrg.has(String(idEntitatItem))) || pertanyALActor(item, aliesOrg)) {
        const jaActiva = actorType === 'entitat' && String(actorId) === String(m.id);
        return {
          seccio: seccioNorm,
          carpeta: CARPETA_DE_SECCIO[seccioNorm],
          publicacioId: String(item.id),
          canviActor: jaActiva
            ? null
            : { tipus: 'entitat', id: m.id, nom: m.name || m.slug || NOM_PROJECTE_RESERVA }
        };
      }
    }

    const aliesPilot = aliesDeLActor({ tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG }, { dataMode });
    if (
      ((idEntitatItem != null && aliesPilot.has(String(idEntitatItem))) || pertanyALActor(item, aliesPilot))
      && (esSuperadmin === true
        || ((dataMode === 'seed' || dataMode === 'local')
          && rolALEntitat(ENTITAT_PILOT_ID, userId, { teSessio: true }) === 'owner'))
    ) {
      const jaEsProjecte = esAliesDelProjecte(aliesActiu);
      const entitatSeedPilot = entitatSeed(ENTITAT_PILOT_SLUG);
      return {
        seccio: seccioNorm,
        carpeta: CARPETA_DE_SECCIO[seccioNorm],
        publicacioId: String(item.id),
        canviActor: jaEsProjecte
          ? null
          : { tipus: 'entitat', id: ENTITAT_PILOT_ID, nom: entitatSeedPilot?.name || NOM_PROJECTE_RESERVA }
      };
    }

    if (idEntitatItem == null || String(idEntitatItem) === '') {
      const aliesPersona = aliesDeLActor({
        tipus: 'persona',
        id: userId,
        email: currentUser?.email,
        email_confirmed_at: currentUser?.email_confirmed_at,
        confirmed_at: currentUser?.confirmed_at,
        identities: currentUser?.identities,
        rol: 'persona'
      }, { dataMode });
      if (pertanyALActor(item, aliesPersona)) {
        const nomPersona = currentUser?.user_metadata?.full_name
          || currentUser?.full_name
          || (actorType === 'persona' && actor?.nom ? actor.nom : PERSONA_PILOT.nom);
        return {
          seccio: seccioNorm,
          carpeta: CARPETA_DE_SECCIO[seccioNorm],
          publicacioId: String(item.id),
          canviActor: actorType === 'entitat'
            ? { tipus: 'persona', id: userId, nom: nomPersona }
            : null
        };
      }
    }

    if (esSuperadmin === true && autor && (seccioNorm === 'events' || (seccioNorm === 'mur' && !UUID.test(String(item.id))))) {
      return {
        seccio: seccioNorm,
        carpeta: CARPETA_DE_SECCIO[seccioNorm],
        publicacioId: String(item.id),
        canviActor: null
      };
    }

    return null;
  }, [
    enContext, userId, navigate, memberships, actor, dataMode, tipus, pageKey,
    item, esSuperadmin, sectionId, actorType, actorId, currentUser
  ]);

  const onEdit = useCallback(() => {
    if (!resolucio || typeof navigate !== 'function') return;

    const camiActual = location?.pathname
      ? `${location.pathname}${location.search || ''}${location.hash || ''}`
      : '';
    const retorn = camiActual && esRutaInterna(camiActual) ? camiActual : '';

    let haCanviatActor = false;
    const actorPrevi = {
      tipus: actorType === 'entitat' ? 'entitat' : 'persona',
      id: String(actorType === 'entitat' ? (actorId ?? '') : (userId ?? '')),
      nom: nomDeLActorActiu(actor, actorType, actorId, currentUser, memberships)
    };

    if (resolucio.canviActor && typeof setActor === 'function') {
      const aplicat = resolucio.canviActor.tipus === 'persona'
        ? setActor('persona')
        : setActor('entitat', resolucio.canviActor.id);
      if (aplicat !== false) {
        haCanviatActor = true;
        showToast?.(formatToastIdentitat(t, resolucio.canviActor.nom), 'info');
      }
    }

    let notaId = resolucio.notaId || '';
    if (!notaId && resolucio.publicacioId) {
      const notaVinculada = !haCanviatActor && Array.isArray(notes)
        ? notes.find((n) => n?.isPublished && String(n.publishedSubmissionId) === resolucio.publicacioId)
        : null;
      notaId = notaVinculada
        ? String(notaVinculada.id)
        : `publicacio:${resolucio.seccio}:${resolucio.publicacioId}`;
    }

    if (haCanviatActor) {
      registraCanviIdentitatEdicio({
        anterior: actorPrevi,
        desti: resolucio.canviActor,
        retorn,
        notaId
      });
    } else {
      /* v1.2.23 · L5-03 (Gauntlet R1) · Una segona edició amb la identitat que
         el Mas ja havia commutat (l'actor actiu és el destí de la memòria) no
         esborra el retorn: el reapunta a esta pàgina, amb el mateix «anterior»,
         i «Vols tornar a ser {anterior}?» continua. Si l'actor ja no és el destí
         (la persona ha tornat a l'anterior o ha triat una altra identitat), o
         l'anterior és una persona que no és la de la sessió, s'oblida com fins ara. */
      const vigent = llegixCanviIdentitatEdicio();
      const continuaAlDesti = Boolean(vigent?.desti)
        && vigent.desti.tipus === actorPrevi.tipus
        && vigent.desti.id === actorPrevi.id
        && (vigent.anterior.tipus !== 'persona' || vigent.anterior.id === String(userId ?? ''));
      if (continuaAlDesti) {
        registraCanviIdentitatEdicio({ anterior: vigent.anterior, desti: vigent.desti, retorn, notaId });
      } else {
        netejaCanviIdentitatEdicio();
      }
    }

    const params = new URLSearchParams();
    if (resolucio.carpeta) params.set('carpeta', resolucio.carpeta);
    if (notaId) params.set('nota', notaId);
    params.set('plegades', '1');
    if (retorn) params.set('retorn', retorn);

    navigate(`/notes?${params.toString()}`);
  }, [resolucio, navigate, location, actorType, actorId, userId, actor, currentUser, memberships, setActor, showToast, t, notes]);

  if (!resolucio) return INACTIU;

  const editLabel = typeof t === 'function' ? t('pagina.barra.editar', 'Editar') : 'Editar';
  return {
    editarVisible: true,
    onEdit,
    editLabel
  };
}
