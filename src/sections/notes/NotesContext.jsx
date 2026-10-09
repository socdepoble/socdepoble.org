import { createContext, useContext, useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { bgSaveManager } from './GlobalSaveManager.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { emojiSol } from '../../utils/emoji.js';
import { useUIState } from '../../app/contexts/UIContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNotesData } from './NotesDataContext';
import { useMur } from '../mur/MurContext';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { promoteToPublic, teCapacitat } from '../../data/backendPort.js';
import { dataIsoONull } from '../../utils/calendari.js';
import { estatPerAlEditor } from './useEstatDesamentNota.js';
import { ErrorPublicacio, MOTIU_LOCAL, MOTIU_LOCAL_CONNEXIO, motiuDesatPendent, motiuSignaturaAliena } from './visibilitatNota.js';
import { autorDe } from '../../config/navigation.js';
import { aliesDeLActor } from '../../data/identitatsSeed.js';
import { pertanyALActor } from './masDeLUsuari.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { actorAmbPobleDeLEntitat, autoriaDeLActor } from './autoriaNota.js';
import { slugDelPoble } from '../pobles/nomsDelPoble.js';
import { pobleDeConfig } from '../xat/pobleAmfitrio.js';
import { esConnexio, esExtern, netejaDrets } from '../../data/origenNota.js';
import { cosDeConnexioEditadaPerAlMur } from './connexions.js';
import { cosDeLExternPerAlMur } from '../connectar/contingutExtern.js';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
/* P4 (revisió, 261003) · El sanejador del canal viu a netejaCamp.js: la nota
   preparada (notaPreparada.js) en crear-se hi passa pel mateix. */
import { netejaCamp } from './netejaCamp.js';

export function etiquetesDeNota(note, _noteFolders, accions = {}) {
  // La carpeta organitza el bloc; no és una categoria editorial. Els labels
  // explícits de notes antigues són el fallback fins que tinguen categories.
  if (!Array.isArray(note.categories) && Array.isArray(note.labels)) {
    return note.labels.map(label => typeof label === 'string'
      ? { text: label, className: 'sdp-badge-tag' }
      : label);
  }
  return [
    ...(note.categories || []).filter(Boolean).map(cat => ({
      text: cat, className: 'sdp-badge-category',
      onClick: accions.categoria ? () => accions.categoria(cat) : undefined
    })),
    ...(note.tags || []).filter(Boolean).map(etiqueta => ({
      text: etiqueta, className: 'sdp-badge-tag',
      onClick: accions.etiqueta ? () => accions.etiqueta(etiqueta) : undefined
    }))
  ];
}

const EMPTY_OVERRIDE = {};

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const { showToast } = useToast();
  const { locale, externalConfig } = useUIState();
  const { normalizeSearchText, t } = useUIActions();
  const { noteFolders, notes: rawNotes, creaNota, updateNote: updateNoteContext, mouNota: mouNotaContext, esborraNota: esborraNotaContext, status, error, scopeKey, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate } = useNotesData();
  const { sendSectionSubmission, feedPosts } = useMur();
  /* Poliment T41/T43 · Qui signa la publicació: l'actor que MurContext envia
     com a author_org_id, també al nom, la foto i el poble del payload. */
  const { actor, memberships } = useIdentitat();
  const { currentUser } = useSession();
  /* Onada 6 (revisió adversarial) · Una entitat signa des del poble de la
     seua organització (el town_name de la seua fila de pertinença): sense,
     les seues publicacions no arribaven a cap pestanya «Gent de …». */
  const actorQueSigna = useMemo(() => actorAmbPobleDeLEntitat(actor, memberships), [actor, memberships]);
  const autoria = useMemo(() => autoriaDeLActor(actorQueSigna, currentUser), [actorQueSigna, currentUser]);
  /* Grup E (261008) · Les publicacions del Mur que ja hi ha carregades, per a
     la guarda de re-signatura de publishNote. En una referència: el Mur es
     refresca després de cada publicació i publishNote no ha de canviar per
     això (el valor del context es tornaria a fer a cada refresc). */
  const publicacionsDelMur = useRef(feedPosts);
  useLayoutEffect(() => { publicacionsDelMur.current = feedPosts; }, [feedPosts]);

  const parsedNotesCache = useRef(new Map());

  // F01 / F05 / F07: El desmuntatge no interromp el desat
  // Com que ara utilitzem un gestor global en segon pla (GlobalSaveManager),
  // les operacions continuen encara que el NotesProvider es desmunte.

  // IndexedDB owns persistence; React only holds the immediate editing overlay.
  const [localNoteOverrides, setLocalNoteOverrides] = useState({});
  const operationRef = useRef(null);
  const operation = useMemo(() => ({ workspaceKey, scopeKey }), [workspaceKey, scopeKey]);
  useLayoutEffect(() => {
    operationRef.current = operation;
    setLocalNoteOverrides({});
    return () => { if (operationRef.current === operation) operationRef.current = null; };
  }, [operation]);
  /* T47b (ordre del Mestre, 260928) · Els desadors de l'operació viva. Una
     crida d'un editor d'abans (la tecla que el debounce de TipTap o el
     desmuntatge lliuren tard) que és del MATEIX actor va ací i no es perd.
     D'un altre actor (scopeKey diferent), mai: el text d'A no es desa amb B. */
  const vigentRef = useRef(null);
  const delMateixActor = useCallback(() => {
    const viva = operationRef.current;
    return Boolean(viva && viva !== operation && viva.scopeKey === operation.scopeKey && vigentRef.current);
  }, [operation]);
  const publishing = useRef(new Map());
  // Notes que han eixit del Bloc (paperera, arxiu o esborrat). L'editor encara
  // desa en desmuntar-se i a cada tecla; cap d'eixos desats ha d'arribar a una
  // nota que ja no hi és (tornaria 404 i un avís d'error fals).
  const esborrades = useRef(new Set());

  const clearLocalNoteFields = useCallback((id, savedPayload) => {
    if (!id || operationRef.current !== operation) return;
    setLocalNoteOverrides(prev => {
      const currentOverrides = prev[id];
      if (!currentOverrides) return prev;

      const nextOverrides = { ...currentOverrides };
      let changed = false;
      for (const k of Object.keys(savedPayload)) {
        if (k in nextOverrides && nextOverrides[k] === savedPayload[k]) {
          delete nextOverrides[k];
          changed = true;
        }
      }
      if (!changed) return prev;

      const next = { ...prev, [id]: nextOverrides };



      return next;
    });
  }, [operation]);

  const notes = useMemo(() => {
    // F12: purgar memòria cau per evitar fuita amb notes desaparegudes
    const validIds = new Set(rawNotes.map(n => n.id));
    for (const key of parsedNotesCache.current.keys()) {
      if (!validIds.has(key)) parsedNotesCache.current.delete(key);
    }

    return rawNotes.map((rawNote) => {
      const overrides = localNoteOverrides[rawNote.id] || EMPTY_OVERRIDE;
      const note = { ...rawNote, ...overrides };

      const cache = parsedNotesCache.current.get(rawNote.id);
      if (cache && cache.rawNote === rawNote && cache.overrides === overrides) {
        return cache.parsed;
      }

      const plainText = extractPlainText(note.content || '', Infinity);
      const plainTitle = extractPlainText(note.title || '', Infinity);

      const parsed = {
        ...note,
        plainText,
        coverImage: note.heroImage || undefined,
        searchText: normalizeSearchText(`${plainTitle} ${extractPlainText(note.subtitle || '')} ${extractPlainText(note.lead || '')} ${(note.tags || []).join(' ')} ${plainText}`),
        formattedDate: new Date(note.updatedAt || Date.now()).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }),
        formattedTime: new Date(note.updatedAt || Date.now()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      };

      parsedNotesCache.current.set(rawNote.id, { rawNote, overrides, parsed });
      return parsed;
    });
  }, [locale, normalizeSearchText, rawNotes, localNoteOverrides]);

  const saveNoteField = useCallback((noteId, field, value) => {
    if (noteId && delMateixActor()) return vigentRef.current.saveNoteField(noteId, field, value);
    if (!noteId || operationRef.current !== operation) return Promise.resolve(false);
    if (esborrades.current.has(noteId)) return Promise.resolve(false);
    const netejat = netejaCamp(field, value);
    return bgSaveManager.enqueue(
      scopeKey,
      noteId,
      field,
      netejat,
      (id) => rawNotes.find(n => n.id === id),
      updateNoteContext,
      clearLocalNoteFields,
      (msg, type) => showToast(msg, type)
    );
  }, [scopeKey, rawNotes, clearLocalNoteFields, updateNoteContext, operation, showToast, delMateixActor]);

  const setLocalNoteField = useCallback((id, field, value) => {
    if (id && delMateixActor()) {
      vigentRef.current.setLocalNoteField(id, field, value);
      return;
    }
    if (!id || operationRef.current !== operation || esborrades.current.has(id)) return;
    void saveNoteField(id, field, value);
    setLocalNoteOverrides(prev => {
      const currentOverrides = prev[id] || EMPTY_OVERRIDE;
      if (currentOverrides[field] === value) return prev;

      const next = { ...prev, [id]: { ...currentOverrides, [field]: value } };



      return next;
    });
  }, [operation, saveNoteField, delMateixActor]);

  useLayoutEffect(() => {
    vigentRef.current = { saveNoteField, setLocalNoteField };
  }, [saveNoteField, setLocalNoteField]);

  /* T5 · `mode: 'compartir'`: la nota és d'altri (origen) i va al mur de la
     persona com a compartida, citant l'origen, mai com a publicació pròpia.
     T47 (ordre del Mestre, 260928) · Torna true (publicada) o false (la xarxa:
     ERROR_PUBLICAR, tornar-ho a provar servix). Quan no ha arribat ni a provar-ho
     (sense servidor, desat previ sense confirmar) rebutja amb ErrorPublicacio i
     el motiu del toast: el selector de visibilitat el diu en línia.
     T71b · Una nota amb origen (connexió o contingut de fora) mai es publica
     com a pròpia: es compartix encara que la crida no ho demane. */
  const publishNote = useCallback((activeNote, { mode = 'publicar' } = {}) => {
    const compartir = mode === 'compartir' || esConnexio(activeNote) || esExtern(activeNote);
    if (!activeNote || operationRef.current !== operation) return Promise.resolve(false);
    if (config?.dataMode === 'seed' || config?.dataMode === 'local') {
      const motiu = compartir ? MOTIU_LOCAL_CONNEXIO : MOTIU_LOCAL;
      showToast(motiu, 'info');
      return Promise.reject(new ErrorPublicacio(motiu));
    }
    /* Grup E de l'Onada 4 (prompt 261008_1201, risc «que estiga clavat el
       comportament») · La guarda de re-signatura. Una nota ja publicada
       s'edita com a esborrany privat, i el Mur només canvia amb «Actualitzar
       al Mur», que fa un upsert amb el mateix id signat per l'actor actiu
       (MurContext). Si la publicació (la del Mur amb publishedSubmissionId)
       la signa una altra identitat, no s'envia res: el motiu va pel canal de
       sempre (ErrorPublicacio, que el selector diu en línia). Si no és entre
       les carregades (el port en porta una finestra), o no se sap qui la
       signa, o no hi ha actor, com abans. */
    if (activeNote.isPublished && activeNote.publishedSubmissionId != null && actor?.id) {
      const idPublicat = String(activeNote.publishedSubmissionId);
      const publicada = (publicacionsDelMur.current || []).find((element) => element && String(element.id) === idPublicat);
      if (publicada && autorDe(publicada) && !pertanyALActor(publicada, aliesDeLActor(actor, { dataMode: config?.dataMode }))) {
        const motiu = motiuSignaturaAliena(publicada.author_name || publicada.seller);
        showToast(motiu, 'info');
        return Promise.reject(new ErrorPublicacio(motiu));
      }
    }
    const key = `${workspaceKey}:${activeNote.id}`;
    if (publishing.current.has(key)) return publishing.current.get(key);
    // Capture and persist the exact visible document, including editor changes
    // whose own debounce has not fired yet, before entering publication.
    /* Revisió de D4 (260930) · Una connexió no té drets propis que desar: el
       copyright que li pinta l'editor és el de l'original (NotesEditor), i
       desar-lo ací l'escriuria a la nota. */
    for (const field of ['title', 'subtitle', 'lead', 'content', 'heroImage', 'logoImage', 'folderId', 'categories', 'tags', 'copyright', 'icon', 'publishDate']) {
      if (field === 'copyright' && esConnexio(activeNote)) continue;
      if (activeNote[field] !== undefined) void saveNoteField(activeNote.id, field, activeNote[field]);
    }
    const result = bgSaveManager.runExclusive(scopeKey, activeNote.id, async () => {
    const assertCurrent = () => {
      if (operationRef.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
    };
    assertCurrent();

    const labels = etiquetesDeNota(activeNote, noteFolders)
      .map(({ text, className }) => ({ text, className }));

    try {
      /* La reserva '/assets/…' va al payload tal qual, SENSE resolveAsset: és
         una dada que es desa al servidor i la llegix qualsevol amfitrió. El Mur
         la resol en pintar-la (MurSection); desar-la resolta hi gravaria la
         carpeta del paquet de l'amfitrió on s'ha publicat. */
      let finalHeroImage = netejaCamp('heroImage', activeNote.coverImage) || externalConfig?.fallbackLogoUrl || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
      /* Ordre E del Mestre (261007, prompt 261007_1628: «no es pot posar el
         logotip damunt de l'H1») · El logotip que la persona puja amb
         «Editar logotip» (logoImage) es desava a la nota i no arribava enlloc:
         ara viatja al Mur com a logo_image i la pàgina publicada el pinta
         damunt de l'H1 (elementDeSeccio.js · logoEntitatDElement). Net pel
         mateix sanejador del canal; sense reserva: sense logotip, cap clau. */
      let finalLogo = netejaCamp('logoImage', activeNote.logoImage);
      /* D4 (excepció del Mestre, 260930; desfà T54) · Una connexió és una
         còpia editable: ix el cos EDITAT, sense els paràgrafs fixos que el
         sistema li escriu a qui la té, i la presentació de l'original (enllaç
         i autoria) només si el cos ja no l'enllaça (connexions.js). La nota
         desada no es toca: el bucle de dalt només torna a desar el cos que ja
         tenia.
         T71b · Un contingut de fora és de la persona: ix el seu cos, i la
         cita de l'origen només si el cos ja no en porta l'enllaç (una sola
         vegada). Es mira el cos sanejat, el que arriba al Mur. */
      const cosPerAlMur = esConnexio(activeNote) ? cosDeConnexioEditadaPerAlMur(netejaCamp('content', activeNote.content), activeNote.origen)
        : esExtern(activeNote) ? cosDeLExternPerAlMur(netejaCamp('content', activeNote.content), activeNote.origen)
          : activeNote.content;
      let finalContent = netejaCamp('content', cosPerAlMur);
      /* D4 · Els drets d'una connexió són els de l'original (origen.drets,
         presos de l'element resolt en connectar), no els de la nota: una
         còpia no canvia la llicència de l'obra d'altri.
         Revisió (260930) · Sense drets a l'origen, cap copyright propi ('' i
         el Mur pinta el seu text de sèrie, com la pàgina de l'original), mai
         el de la nota: triar-hi una llicència relicenciaria l'obra d'altri. */
      const drets = esConnexio(activeNote) ? netejaDrets(activeNote.origen?.drets) : (activeNote.copyright || '');

      if (teCapacitat('mitjans')) {
        if (typeof finalHeroImage === 'string' && finalHeroImage.startsWith('sdp-media://mitjans_privats/')) {
          const publicHero = await promoteToPublic(finalHeroImage, config);
          if (publicHero !== finalHeroImage) {
            finalHeroImage = publicHero;

          }
        }
        /* Ordre E (261007) · El logotip, com la capçalera: el Mur el llig tot
           el poble i un mitjà privat no s'hi veuria. */
        if (finalLogo.startsWith('sdp-media://mitjans_privats/')) {
          finalLogo = (await promoteToPublic(finalLogo, config)) || finalLogo;
        }

        const imgRegex = /sdp-media:\/\/mitjans_privats\/[^\s"']+/g;
        const matches = finalContent.match(imgRegex);
        if (matches) {
          // Eliminem duplicats
          const uniqueMatches = [...new Set(matches)];
          for (const match of uniqueMatches) {
            const newUrl = await promoteToPublic(match, config);
            if (newUrl !== match) {
              // Reemplaçar de forma global
              finalContent = finalContent.split(match).join(newUrl);
            }
          }

        }
      }

      const dataTriada = dataIsoONull(activeNote.publishDate);
      /* Onada 6 · El poble des d'on es publica (vegeu author_location, baix):
         el de qui signa; si no, el poble que declara l'amfitrió (el seu id,
         pobleDeConfig, el mateix que llig el Xat), sense inventar-ne el nom. */
      const llocDePublicacio = String(autoria?.poble || externalConfig?.appLocation || '').trim();
      const pobleDePublicacio = slugDelPoble(llocDePublicacio) || pobleDeConfig(externalConfig)?.id || null;
      const payload = {
        sectionId: 'mur',
        type: compartir ? 'compartit' : 'feed',
        ...(compartir && activeNote.origen ? { origen: activeNote.origen } : {}),
        title: netejaCamp('title', activeNote.title) || 'Sense Títol',
        subtitle: netejaCamp('subtitle', activeNote.subtitle),
        description: netejaCamp('lead', activeNote.lead),
        content: finalContent,
        copyright: netejaCamp('copyright', drets),
        image: finalHeroImage,
        labels,
      /* Poliment T41/T43 · el nom, la foto i el poble de l'actor que signa (mai
         un correu). El de l'app només queda de reserva sense actor (incrustat);
         sense poble conegut, el del poble on es publica.
         Onada 6 (decisió 2 de la nit del 261009: «les publicacions noves
         porten poble_id i ja no s'escriu "La Torre de les Maçanes" per
         defecte a les dades») · Sense poble conegut (ni el de qui signa ni
         el de l'amfitrió), cap clau: la targeta continua pintant la seua
         reserva (TargetaDelMur, Llei del Píxel), però la dada ja no diu un
         poble que ningú ha triat. Amb poble, també poble_id (el seu slug,
         nomsDelPoble.js): la clau per la qual la pestanya «Gent de …» de la
         pàgina del poble la troba (pobles/clauDelPoble.js). Com publish_date
         i icon, l'upsert reemplaça el payload: republicar sense poble el
         lleva. */
      author_name: autoria?.nom || externalConfig?.appName || 'Sóc de Poble',
      ...(autoria?.avatar ? { author_avatar: autoria.avatar } : {}),
      ...(llocDePublicacio ? { author_location: llocDePublicacio } : {}),
      ...(pobleDePublicacio ? { poble_id: pobleDePublicacio } : {}),
      /* T40 (ordre del Mestre, 260928) · la data triada al calendari de la
         barra taronja. No programa res: el Mur l'ordena amb esta data. Sense
         data triada no s'envia la clau: l'upsert reemplaça el payload i el Mur
         cau a created_at, que el trigger section_submissions_conserva_creacio
         conserva en republicar. Posar-hi l'hora de publicar tornaria a datar,
         i a pujar dalt de tot, cada «Actualitzar al Mur». */
      ...(dataTriada ? { publish_date: dataTriada } : {}),
      /* T51 (ordre del Mestre, 260928) · l'emoticona triada, perquè el Mur la
         pinte al centre de la caputxa de la targeta. El payload és jsonb
         flexible (section_submissions.payload): cap canvi d'esquema. Com la
         data, sense emoticona no s'envia la clau (l'upsert reemplaça el
         payload: llevar-la i republicar la lleva també del Mur). */
      ...(emojiSol(activeNote.icon) ? { icon: emojiSol(activeNote.icon) } : {}),
      /* Ordre E (261007) · Com l'emoticona: sense logotip no s'envia la clau,
         i llevar-lo i republicar el lleva també de la pàgina publicada. */
      ...(finalLogo ? { logo_image: finalLogo } : {})
    };

    assertCurrent();
    // The note UUID is also the stable submission UUID. Retrying an uncertain
    // POST upserts the same row; linking can then be retried without duplicates.
    const submissionId = activeNote.publishedSubmissionId || activeNote.id;
    await sendSectionSubmission({ id: submissionId, sectionId: 'mur', payload });
    assertCurrent();
    const changes = { isPublished: true, publishedSubmissionId: submissionId };
    const expectedRevision = bgSaveManager.getExpectedRevision(scopeKey, activeNote.id, activeNote.revision);
    const saved = await updateNoteContext(activeNote.id, changes, expectedRevision);
    // D01 · La revisió de la publicació és pròpia: avança també la base persistida
    // de l'esborrany, perquè una recàrrega no la confonga amb un canvi d'altri.
    // La revisió en memòria s'anota en l'acte; si l'escriptura local fallara, la
    // publicació continua feta i, com a molt, una recàrrega demanaria decidir.
    bgSaveManager.confirmRevision(scopeKey, activeNote.id, saved.revision).catch(() => {});
    assertCurrent();
    clearLocalNoteFields(activeNote.id, changes);
    showToast(compartir ? 'Compartit al teu mur, citant l’origen.' : 'Nota publicada correctament al mur!', 'success');
    return true;
  } catch (error) {
    if (operationRef.current === operation) {
      /* T2 · En mode de proves el port rebutja sense xarxa (code 'mode-local'):
         dir «pendent de confirmar» faria creure que s'ha enviat. */
      showToast(error?.code === CODI_ENTRADA.MODE_LOCAL
        ? error.message
        : 'Publicació pendent de confirmar. Reintenta-la: es reutilitzarà la mateixa publicació.', 'error');
    }
    return false;
  }
    }).catch((error) => {
      // La sessió ha canviat abans d'entrar: l'editor és d'una altra operació.
      if (error?.name === 'AbortError' || operationRef.current !== operation) return false;
      /* T47 · El desat previ no s'ha confirmat: el motiu és el de la ploma
         (conflicte D01, validació, sense còpia al dispositiu…), no «torna-ho a provar». */
      const motiu = motiuDesatPendent(estatPerAlEditor(bgSaveManager.estat(scopeKey, activeNote.id)).detall);
      showToast(motiu, 'error');
      throw new ErrorPublicacio(motiu);
    }).finally(() => publishing.current.delete(key));
    publishing.current.set(key, result);
    return result;
  }, [noteFolders, sendSectionSubmission, saveNoteField, externalConfig, autoria, actor, config, workspaceKey, scopeKey, operation, updateNoteContext, clearLocalNoteFields, showToast]);

  const compartirNota = useCallback((note) => publishNote(note, { mode: 'compartir' }), [publishNote]);

  const informaError = useCallback((msg) => showToast(msg?.message || msg || 'Error', 'error'), [showToast]);
  // La roda de CARPETES ja es veu (sdp-app-grid-shell §2), però el gestor de
  // carpetes, categories i etiquetes encara no existix: ho diem a la persona
  // en lloc de deixar un botó mut. Quan hi haja gestor, s'obrirà ací.
  const obriConfiguracioNotes = useCallback(
    () => showToast('La configuració de carpetes, categories i etiquetes encara no està disponible.'),
    [showToast]
  );

  // D01 · Resolució explícita d'un esborrany antic (vegeu applyDraft a NotesDataContext).
  //   · 'remot': es descarta l'esborrany i es torna a llegir la nota del servidor.
  //   · 'meu': la base passa a la revisió remota i els camps es desen damunt.
  const resolConflicteEsborrany = useCallback(async (note, decisio) => {
    if (!note?.draftConflict || operationRef.current !== operation) return false;
    if (decisio === 'remot') {
      await bgSaveManager.clearDraft(scopeKey, note.id);
      setLocalNoteOverrides(prev => {
        if (!prev[note.id]) return prev;
        const resta = { ...prev };
        delete resta[note.id];
        return resta;
      });
      // Una recàrrega de llistat pot portar només resums, i mergeNotes hi
      // conservaria el cos de l'esborrany descartat: es resol la nota sencera.
      try {
        await resolveNote(note.id);
      } catch {
        refresh();
      }
      return true;
    }
    const camps = await bgSaveManager.rebaseDraft(scopeKey, note.id, note.draftConflict.remoteRevision);
    const desats = await Promise.all(Object.entries(camps).map(([field, value]) => saveNoteField(note.id, field, value)));
    return desats.every(Boolean);
  }, [operation, scopeKey, resolveNote, refresh, saveNoteField]);

  // Capacitat opcional del backend: sense ella l'editor no pinta «Borrar».
  const potEsborrar = teCapacitat('cicleNotes');

  const oblidaOverlay = useCallback((id) => {
    setLocalNoteOverrides(prev => {
      if (!prev[id]) return prev;
      const resta = { ...prev };
      delete resta[id];
      return resta;
    });
  }, []);

  /* Paperera ('paperera') o arxiu ('arxivada'). runExclusive desa primer el
     que quede pendent: la nota ix del Bloc tal com es veu. La revisió esperada
     es llig DINS del torn, com a publishNote: un desat en curs l'avança i
     llegir-la abans donaria un 409 fals. Només fa eixir notes del Bloc: la
     nota es retira de la llista i els desats posteriors es tallen. Recuperar-la
     ('activa') necessita desfer tot açò i és de la fase de la vista de
     recuperació; ací es refusa sense tocar res. */
  const mouNota = useCallback((note, estat) => {
    if (!note?.id || operationRef.current !== operation) return Promise.resolve(false);
    if (estat !== 'paperera' && estat !== 'arxivada') return Promise.resolve(false);
    return bgSaveManager.runExclusive(scopeKey, note.id, async () => {
      if (operationRef.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
      esborrades.current.add(note.id);
      try {
        await mouNotaContext(note.id, estat, bgSaveManager.getExpectedRevision(scopeKey, note.id, note.revision));
      } catch (error) {
        esborrades.current.delete(note.id);
        throw error;
      }
    }).then(async () => {
      /* T47b (ordre del Mestre, 260928) · retira i no oblida: el que el servidor
         no ha pogut guardar (l'emoticona en quarantena) es queda al dispositiu. */
      await bgSaveManager.retira(scopeKey, note.id).catch(() => {});
      oblidaOverlay(note.id);
      showToast(estat === 'paperera' ? 'Nota a la paperera. Es guardarà 30 dies.' : 'Nota arxivada.', 'success');
      return true;
    }, () => {
      if (operationRef.current === operation) showToast('No s’ha pogut moure la nota. Continua on estava.', 'error');
      return false;
    });
  }, [operation, scopeKey, mouNotaContext, oblidaOverlay, showToast]);

  /* Esborrat definitiu: no es desa res. La cua pendent es cancel·la abans
     (oblida); si hi havia un desat en curs, el serial l'espera i la revisió es
     llig després. El segon oblida neteja el registre que eixe desat en curs
     haja pogut tornar a escriure en IndexedDB. */
  const esborraNota = useCallback(async (note) => {
    if (!note?.id || operationRef.current !== operation) return false;
    esborrades.current.add(note.id);
    try {
      await bgSaveManager.oblida(scopeKey, note.id);
      await bgSaveManager.serial(`${scopeKey}:${note.id}`, () => esborraNotaContext(
        note.id, bgSaveManager.getExpectedRevision(scopeKey, note.id, note.revision)));
    } catch {
      esborrades.current.delete(note.id);
      if (operationRef.current === operation) showToast('No s’ha pogut borrar la nota. Continua on estava.', 'error');
      return false;
    }
    await bgSaveManager.oblida(scopeKey, note.id).catch(() => {});
    oblidaOverlay(note.id);
    showToast('Nota borrada definitivament.', 'success');
    return true;
  }, [operation, scopeKey, esborraNotaContext, oblidaOverlay, showToast]);

  const ctxValue = useMemo(() => ({
    notes,
    noteFolders,
    saveNoteField,
    setLocalNoteField,
    publishNote,
    compartirNota,
    creaNota,
    updateNote: updateNoteContext,
    status,
    error,
    // T47b · l'àmbit de la cua: NotesEditor el fa servir per a llegir la ploma.
    scopeKey,
    workspaceKey, notesComplete, resolveNote, refresh, config, canCreate,
    /* P4 (ordre del Mestre, 261003) · Si hi ha sessió, de la mateixa font que
       canCreate (useSession). canCreate també depén de la càrrega; esta no:
       el Bloc diu «Connecta…» només quan de veres no n'hi ha (reglaDEntrada). */
    teSessio: Boolean(currentUser?.id),
    informaError,
    obriConfiguracioNotes,
    resolConflicteEsborrany,
    mouNota,
    esborraNota,
    potEsborrar,
    t
  }), [
    notes, noteFolders, saveNoteField, setLocalNoteField,
    publishNote, compartirNota, creaNota, updateNoteContext, status, error, scopeKey, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate, currentUser, informaError, obriConfiguracioNotes, resolConflicteEsborrany,
    mouNota, esborraNota, potEsborrar, t
  ]);

  return (
    <NotesContext.Provider value={ctxValue}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  return useContext(NotesContext);
}
