import { createContext, useContext, useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { bgSaveManager } from './GlobalSaveManager.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { sanitizeHtml, netejaText, esFontImatgeSegura } from '../../utils/sanitize.js';
import { emojiSol } from '../../utils/emoji.js';
import { useUIState } from '../../app/contexts/UIContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNotesData } from './NotesDataContext';
import { useMur } from '../mur/MurContext';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { promoteToPublic, teCapacitat } from '../../data/backendPort.js';
import { dataIsoONull } from '../../utils/calendari.js';
import { estatPerAlEditor } from './useEstatDesamentNota.js';
import { ErrorPublicacio, MOTIU_LOCAL, MOTIU_LOCAL_CONNEXIO, motiuDesatPendent } from './visibilitatNota.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { autoriaDeLActor } from './autoriaNota.js';
import { esConnexio, esExtern } from '../../data/origenNota.js';
import { cosDeConnexioPerAlMur } from './connexions.js';
import { cosDeLExternPerAlMur } from '../connectar/contingutExtern.js';

const CAMPS_HTML = new Set(['title', 'subtitle', 'lead', 'content']);

function netejaCamp(field, value) {
  if (field === 'copyright') return netejaText(value).slice(0, 256);
  /* T40 (ordre del Mestre, 260928) · data de publicació: ISO vàlida o null. */
  if (field === 'publishDate') return dataIsoONull(value);
  /* T23 · emoticona de la nota: un sol emoji (utils/emoji.emojiSol) o cadena
     buida per a llevar-la; qualsevol altra cosa es descarta. */
  if (field === 'icon') return emojiSol(value) || '';
  if (CAMPS_HTML.has(field)) return sanitizeHtml(value);
  if (field === 'heroImage' || field === 'logoImage') return esFontImatgeSegura(value) ? String(value).trim() : '';
  if (typeof value === 'boolean') return value;
  // If we start saving categories and tags, they are arrays
  if (Array.isArray(value)) return value.map(v => netejaText(v)).filter(Boolean);
  return netejaText(value);
}

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
  const { sendSectionSubmission } = useMur();
  /* Poliment T41/T43 · Qui signa la publicació: l'actor que MurContext envia
     com a author_org_id, també al nom, la foto i el poble del payload. */
  const { actor } = useIdentitat();
  const { currentUser } = useSession();
  const autoria = useMemo(() => autoriaDeLActor(actor, currentUser), [actor, currentUser]);

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
    const key = `${workspaceKey}:${activeNote.id}`;
    if (publishing.current.has(key)) return publishing.current.get(key);
    // Capture and persist the exact visible document, including editor changes
    // whose own debounce has not fired yet, before entering publication.
    for (const field of ['title', 'subtitle', 'lead', 'content', 'heroImage', 'logoImage', 'folderId', 'categories', 'tags', 'copyright', 'icon', 'publishDate']) {
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
      let finalHeroImage = netejaCamp('heroImage', activeNote.coverImage) || externalConfig?.fallbackLogoUrl || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
      /* T54 · El cos d'una connexió és privat (el llig qui la té, al seu MAS) i
         no va al Mur: la publicació en porta un de nou, fet amb l'origen
         (connexions.js). La nota desada no es toca: el bucle de dalt només
         torna a desar el cos que ja tenia.
         T71b · Un contingut de fora és de la persona: ix el seu cos, i la
         cita de l'origen només si el cos ja no en porta l'enllaç (una sola
         vegada). Es mira el cos sanejat, el que arriba al Mur. */
      const cosPerAlMur = esConnexio(activeNote) ? cosDeConnexioPerAlMur(activeNote.origen)
        : esExtern(activeNote) ? cosDeLExternPerAlMur(netejaCamp('content', activeNote.content), activeNote.origen)
          : activeNote.content;
      let finalContent = netejaCamp('content', cosPerAlMur);

      if (teCapacitat('mitjans')) {
        if (typeof finalHeroImage === 'string' && finalHeroImage.startsWith('sdp-media://mitjans_privats/')) {
          const publicHero = await promoteToPublic(finalHeroImage, config);
          if (publicHero !== finalHeroImage) {
            finalHeroImage = publicHero;

          }
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
      const payload = {
        sectionId: 'mur',
        type: compartir ? 'compartit' : 'feed',
        ...(compartir && activeNote.origen ? { origen: activeNote.origen } : {}),
        title: netejaCamp('title', activeNote.title) || 'Sense Títol',
        subtitle: netejaCamp('subtitle', activeNote.subtitle),
        description: netejaCamp('lead', activeNote.lead),
        content: finalContent,
        copyright: netejaCamp('copyright', activeNote.copyright || ''),
        image: finalHeroImage,
        labels,
      /* Poliment T41/T43 · el nom, la foto i el poble de l'actor que signa (mai
         un correu). El de l'app només queda de reserva sense actor (incrustat);
         sense poble conegut, el del poble on es publica. */
      author_name: autoria?.nom || externalConfig?.appName || 'Sóc de Poble',
      ...(autoria?.avatar ? { author_avatar: autoria.avatar } : {}),
      author_location: autoria?.poble || externalConfig?.appLocation || 'La Torre de les Maçanes',
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
      ...(emojiSol(activeNote.icon) ? { icon: emojiSol(activeNote.icon) } : {})
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
  } catch {
    if (operationRef.current === operation) {
      showToast('Publicació pendent de confirmar. Reintenta-la: es reutilitzarà la mateixa publicació.', 'error');
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
  }, [noteFolders, sendSectionSubmission, saveNoteField, externalConfig, autoria, config, workspaceKey, scopeKey, operation, updateNoteContext, clearLocalNoteFields, showToast]);

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
    informaError,
    obriConfiguracioNotes,
    resolConflicteEsborrany,
    mouNota,
    esborraNota,
    potEsborrar,
    t
  }), [
    notes, noteFolders, saveNoteField, setLocalNoteField,
    publishNote, compartirNota, creaNota, updateNoteContext, status, error, scopeKey, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate, informaError, obriConfiguracioNotes, resolConflicteEsborrany,
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
