import { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { getEfimer, setEfimer } from '../../config/storage.js';
import { updateNote } from '../../data/backendPort';
import { showToast } from '../../components/universal/AvisadorEfimer.jsx';
import { sanitizeHtml, netejaText, esFontImatgeSegura } from '../../utils/sanitize.js';
import { useUIState } from '../../app/contexts/UIContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNotesData } from './NotesDataContext';
import { useMur } from '../mur/MurContext';
import { extractPlainText } from '../../utils/contentAdapter.js';

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

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const { locale, externalConfig } = useUIState();
  const { normalizeSearchText, t } = useUIActions();
  const { noteFolders, notes: rawNotes, creaNota, status, error } = useNotesData();
  const { sendSectionSubmission } = useMur();
  
  const knownRevisions = useRef(new Map());
  const saveQueue = useRef({});
  const noteLocks = useRef({});

  // Neteja qualsevol timer penjat i rebutja promeses quan el context es desmunta
  useEffect(() => {
    return () => {
      Object.values(saveQueue.current).forEach(q => {
        clearTimeout(q.timeout);
        q.resolves.forEach(res => res(false));
      });
    };
  }, []);

  const [localNoteOverrides, setLocalNoteOverrides] = useState(() => {
    try {
      const stored = getEfimer('sdp_notes_drafts');
      return stored || {};
    } catch (e) {
      console.warn('sdp_notes_drafts parse error', e);
      return {};
    }
  });

  const setLocalNoteField = useCallback((id, field, value) => {
    if (!id) return;
    setLocalNoteOverrides(prev => {
      const next = { ...prev, [id]: { ...prev[id], [field]: value } };
      try { setEfimer('sdp_notes_drafts', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const notes = useMemo(() => {
    return rawNotes.map((rawNote) => {
      const overrides = localNoteOverrides[rawNote.id] || {};
      const note = { ...rawNote, ...overrides };
      const plainText = extractPlainText(note.content || '', Infinity);
      const plainTitle = extractPlainText(note.title || '', Infinity);
      return {
        ...note,
        plainText,
        coverImage: note.heroImage || undefined,
        searchText: normalizeSearchText(`${plainTitle} ${plainText}`),
        formattedDate: new Date(note.updatedAt || Date.now()).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }),
        formattedTime: new Date(note.updatedAt || Date.now()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      };
    });
  }, [locale, normalizeSearchText, rawNotes, localNoteOverrides]);

  const saveNoteField = useCallback((noteId, field, value) => {
    if (!noteId) return Promise.resolve(false);
    const netejat = netejaCamp(field, value);
    
    setLocalNoteField(noteId, field, netejat);
    
    return new Promise((resolve) => {
      let queueItem = saveQueue.current[noteId];
      if (!queueItem) {
        queueItem = { payload: {}, resolves: [], timeout: null };
        saveQueue.current[noteId] = queueItem;
      }
      
      queueItem.payload[field] = netejat;
      queueItem.resolves.push(resolve);
      
      if (queueItem.timeout) clearTimeout(queueItem.timeout);
      
      queueItem.timeout = setTimeout(() => {
        const { payload, resolves } = queueItem;
        delete saveQueue.current[noteId];
        
        const doSave = async () => {
          const baseNote = rawNotes.find(n => n.id === noteId);
          const expectedRevision = (knownRevisions.current.has(noteId) 
            ? knownRevisions.current.get(noteId) 
            : (baseNote ? baseNote.revision : undefined)) ?? 0;
            
          try {
            const savedNote = await updateNote(noteId, payload, expectedRevision, externalConfig);
            
            knownRevisions.current.set(noteId, savedNote.revision);
            setLocalNoteOverrides(prev => {
              const next = { ...prev };
              if (!next[noteId]) next[noteId] = {};
              for (const k of Object.keys(payload)) {
                if (next[noteId][k] === payload[k]) delete next[noteId][k];
              }
              next[noteId].revision = savedNote.revision;
              try { setEfimer('sdp_notes_drafts', JSON.stringify(next)); } catch { /* ignore */ }
              return next;
            });
            
            resolves.forEach(res => res(true));
          } catch (e) {
            console.warn("No s'ha pogut guardar la nota en remot:", e);
            if (e.status === 409) {
              showToast('Conflicte: la nota s\'ha actualitzat en un altre dispositiu.', 'error');
            } else {
              showToast('El canvi no ha arribat al servidor. Reintenta-ho.', 'error');
            }
            resolves.forEach(res => res(false));
          }
        };

        const prevLock = noteLocks.current[noteId] || Promise.resolve();
        const nextLock = prevLock.then(doSave).finally(() => {
          if (noteLocks.current[noteId] === nextLock) delete noteLocks.current[noteId];
        });
        noteLocks.current[noteId] = nextLock;

      }, 600); // 600ms debounce
    });
  }, [rawNotes, setLocalNoteField, externalConfig]);

  const publishNote = useCallback(async (activeNote) => {
    if (!activeNote) return;
    
    const labels = etiquetesDeNota(activeNote, noteFolders)
      .map(({ text, className }) => ({ text, className })); 

    const payload = {
      sectionId: 'mur',
      type: 'feed',
      title: netejaCamp('title', activeNote.title) || 'Sense Títol',
      subtitle: netejaCamp('subtitle', activeNote.subtitle),
      description: netejaCamp('lead', activeNote.lead),
      content: netejaCamp('content', activeNote.content),
      image: netejaCamp('heroImage', activeNote.coverImage) || externalConfig?.fallbackLogoUrl || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
      labels,
      author_name: externalConfig?.appName || 'Sóc de Poble',
      author_location: externalConfig?.appLocation || 'La Torre de les Maçanes',
      publish_date: new Date().toISOString()
    };
    
    try {
      await sendSectionSubmission({ sectionId: 'mur', payload });
      const saved = await saveNoteField(activeNote.id, 'isPublished', true);
      if (saved) {
        showToast('Nota publicada correctament al mur!', 'success');
      }
    } catch (err) {
      console.error('Error enviant publicació:', err);
      showToast('Error publicant al mur. Verifica la connexió o l\'entorn.', 'error');
    }
  }, [noteFolders, sendSectionSubmission, saveNoteField, externalConfig]);

  return (
    <NotesContext.Provider value={{
      notes,
      noteFolders,
      saveNoteField,
      setLocalNoteField,
      publishNote,
      creaNota,
      status,
      error,
      informaError: (msg) => showToast(msg || 'Error', 'error'),
      obriConfiguracioNotes: () => console.log('obriConfiguracioNotes no implementat'),
      t
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  return useContext(NotesContext);
}
