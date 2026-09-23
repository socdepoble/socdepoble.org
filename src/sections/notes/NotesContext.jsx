import { createContext, useContext, useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { bgSaveManager } from './GlobalSaveManager.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { sanitizeHtml, netejaText, esFontImatgeSegura } from '../../utils/sanitize.js';
import { useUIState } from '../../app/contexts/UIContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNotesData } from './NotesDataContext';
import { useMur } from '../mur/MurContext';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { promoteToPublic, teCapacitat } from '../../data/backendPort.js';

const CAMPS_HTML = new Set(['title', 'subtitle', 'lead', 'content']);

function netejaCamp(field, value) {
  if (CAMPS_HTML.has(field)) return sanitizeHtml(value);
  if (field === 'heroImage' || field === 'logoImage') return esFontImatgeSegura(value) ? String(value).trim() : '';
  if (typeof value === 'boolean') return value;
  // If we start saving categories and tags, they are arrays
  if (Array.isArray(value)) return value.map(v => netejaText(v)).filter(Boolean);
  return netejaText(value);
}

export function etiquetesDeNota(note, noteFolders, accions = {}) {
  const carpeta = noteFolders.find((f) => f.id === note.folderId)?.name || null;
  const eixida = [];
  if (carpeta) {
    eixida.push({ text: carpeta, className: 'sdp-badge-system',
      onClick: accions.carpeta ? () => accions.carpeta(note.folderId) : undefined });
  }
  for (const cat of note.categories || []) {
    if (cat && cat !== carpeta) {
      eixida.push({ text: cat, className: 'sdp-badge-category',
        onClick: accions.categoria ? () => accions.categoria(cat) : undefined });
    }
  }
  for (const etiqueta of note.tags || []) {
    eixida.push({ text: etiqueta, className: 'sdp-badge-tag',
      onClick: accions.etiqueta ? () => accions.etiqueta(etiqueta) : undefined });
  }
  return eixida;
}

const EMPTY_OVERRIDE = {};

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const { showToast } = useToast();
  const { locale, externalConfig } = useUIState();
  const { normalizeSearchText, t } = useUIActions();
  const { noteFolders, notes: rawNotes, creaNota, updateNote: updateNoteContext, status, error, scopeKey, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate } = useNotesData();
  const { sendSectionSubmission } = useMur();

  const parsedNotesCache = useRef(new Map());

  // F01 / F05 / F07: El desmuntatge no interromp el desat
  // Com que ara utilitzem un gestor global en segon pla (GlobalSaveManager),
  // les operacions continuen encara que el NotesProvider es desmunte.

  // IndexedDB owns persistence; React only holds the immediate editing overlay.
  const [localNoteOverrides, setLocalNoteOverrides] = useState({});
  const operationRef = useRef(null);
  const operation = useMemo(() => ({ workspaceKey }), [workspaceKey]);
  useLayoutEffect(() => {
    operationRef.current = operation;
    setLocalNoteOverrides({});
    return () => { if (operationRef.current === operation) operationRef.current = null; };
  }, [operation]);
  const publishing = useRef(new Map());

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
        searchText: normalizeSearchText(`${plainTitle} ${plainText}`),
        formattedDate: new Date(note.updatedAt || Date.now()).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }),
        formattedTime: new Date(note.updatedAt || Date.now()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      };

      parsedNotesCache.current.set(rawNote.id, { rawNote, overrides, parsed });
      return parsed;
    });
  }, [locale, normalizeSearchText, rawNotes, localNoteOverrides]);

  const saveNoteField = useCallback((noteId, field, value) => {
    if (!noteId || operationRef.current !== operation) return Promise.resolve(false);
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
  }, [scopeKey, rawNotes, clearLocalNoteFields, updateNoteContext, operation, showToast]);

  const setLocalNoteField = useCallback((id, field, value) => {
    if (!id || operationRef.current !== operation) return;
    void saveNoteField(id, field, value);
    setLocalNoteOverrides(prev => {
      const currentOverrides = prev[id] || EMPTY_OVERRIDE;
      if (currentOverrides[field] === value) return prev;

      const next = { ...prev, [id]: { ...currentOverrides, [field]: value } };



      return next;
    });
  }, [operation, saveNoteField]);

  const publishNote = useCallback((activeNote) => {
    if (!activeNote || operationRef.current !== operation) return Promise.resolve(false);
    const key = `${workspaceKey}:${activeNote.id}`;
    if (publishing.current.has(key)) return publishing.current.get(key);
    // Capture and persist the exact visible document, including editor changes
    // whose own debounce has not fired yet, before entering publication.
    for (const field of ['title', 'subtitle', 'lead', 'content', 'heroImage', 'logoImage', 'folderId', 'categories', 'tags']) {
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
      let finalContent = netejaCamp('content', activeNote.content);

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

      const payload = {
        sectionId: 'mur',
        type: 'feed',
        title: netejaCamp('title', activeNote.title) || 'Sense Títol',
        subtitle: netejaCamp('subtitle', activeNote.subtitle),
        description: netejaCamp('lead', activeNote.lead),
        content: finalContent,
        image: finalHeroImage,
        labels,
      author_name: externalConfig?.appName || 'Sóc de Poble',
      author_location: externalConfig?.appLocation || 'La Torre de les Maçanes',
      publish_date: new Date().toISOString()
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
    bgSaveManager.setRevision(scopeKey, activeNote.id, saved.revision);
    assertCurrent();
    clearLocalNoteFields(activeNote.id, changes);
    showToast('Nota publicada correctament al mur!', 'success');
    return true;
  } catch {
    if (operationRef.current === operation) {
      showToast('Publicació pendent de confirmar. Reintenta-la: es reutilitzarà la mateixa publicació.', 'error');
    }
    return false;
  }
    }).catch(() => {
      if (operationRef.current === operation) showToast('Cal confirmar el desat abans de publicar.', 'error');
      return false;
    }).finally(() => publishing.current.delete(key));
    publishing.current.set(key, result);
    return result;
  }, [noteFolders, sendSectionSubmission, saveNoteField, externalConfig, config, workspaceKey, scopeKey, operation, updateNoteContext, clearLocalNoteFields, showToast]);

  const informaError = useCallback((msg) => showToast(msg?.message || msg || 'Error', 'error'), [showToast]);
  const obriConfiguracioNotes = useCallback(() => console.log('obriConfiguracioNotes no implementat'), []);

  const ctxValue = useMemo(() => ({
    notes,
    noteFolders,
    saveNoteField,
    setLocalNoteField,
    publishNote,
    creaNota,
    updateNote: updateNoteContext,
    status,
    error,
    workspaceKey, notesComplete, resolveNote, refresh, config, canCreate,
    informaError,
    obriConfiguracioNotes,
    t
  }), [
    notes, noteFolders, saveNoteField, setLocalNoteField,
    publishNote, creaNota, updateNoteContext, status, error, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate, informaError, obriConfiguracioNotes, t
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
