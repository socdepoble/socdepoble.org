import { createContext, useContext, useState, useMemo, useCallback, useRef } from 'react';
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
  return netejaText(value);
}

export function etiquetesDeNota(note, noteFolders, accions = {}) {
  const carpeta = noteFolders.find((f) => f.id === note.folderId)?.name || null;
  const eixida = [];
  if (carpeta) {
    eixida.push({ text: carpeta, className: 'sdp-badge-system',
      onClick: accions.carpeta ? () => accions.carpeta(note.folderId) : undefined });
  }
  if (note.category && note.category !== carpeta) {
    eixida.push({ text: note.category, className: 'sdp-badge-category',
      onClick: accions.categoria ? () => accions.categoria(note.category) : undefined });
  }
  for (const etiqueta of note.tags || []) {
    eixida.push({ text: etiqueta, className: 'sdp-badge-tag',
      onClick: accions.etiqueta ? () => accions.etiqueta(etiqueta) : undefined });
  }
  return eixida;
}

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const { language, externalConfig } = useUIState();
  const { normalizeSearchText, t } = useUIActions();
  const { noteFolders, notes: rawNotes, creaNota } = useNotesData();
  const { sendSectionSubmission } = useMur();
  
  const knownRevisions = useRef(new Map());
  const locale = language === 'ca' ? 'ca-ES' : 'es-ES';

  const [localNoteOverrides, setLocalNoteOverrides] = useState(() => {
    try {
      const stored = getEfimer('sdp_notes_drafts');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('sdp_notes_drafts parse error', e);
      return {};
    }
  });

  const setLocalNoteField = useCallback((id, field, value) => {
    if (!id) return;
    const netejat = netejaCamp(field, value);
    setLocalNoteOverrides(prev => {
      const next = { ...prev, [id]: { ...prev[id], [field]: netejat } };
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

  const saveNoteField = useCallback(async (noteId, field, value) => {
    if (!noteId) return false;
    const netejat = netejaCamp(field, value);
    
    setLocalNoteField(noteId, field, netejat);
    
    const baseNote = rawNotes.find(n => n.id === noteId);
    const expectedRevision = (knownRevisions.current.has(noteId) 
      ? knownRevisions.current.get(noteId) 
      : (baseNote ? baseNote.revision : undefined)) ?? 0;
    
    try {
      const savedNote = await updateNote(noteId, { [field]: netejat }, expectedRevision, externalConfig);
      
      knownRevisions.current.set(noteId, savedNote.revision);
      setLocalNoteOverrides(prev => {
        const next = { ...prev };
        if (!next[noteId]) next[noteId] = {};
        if (next[noteId][field] === netejat) { delete next[noteId][field]; }
        next[noteId].revision = savedNote.revision;
        try { setEfimer('sdp_notes_drafts', JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
      
      return true;
    } catch (e) {
      console.warn("No s'ha pogut guardar la nota en remot:", e);
      if (e.status === 409) {
        showToast('Conflicte: la nota s\'ha actualitzat en un altre dispositiu.', 'error');
      } else {
        showToast('El canvi no ha arribat al servidor. Reintenta-ho.', 'error');
      }
      return false;
    }
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
      await saveNoteField(activeNote.id, 'isPublished', true);
      showToast('Nota publicada correctament al mur!', 'success');
    } catch (err) {
      console.error('Error enviant publicació:', err);
      showToast('Error publicant al mur. Verifica la connexió o l\'entorn.', 'error');
    }
  }, [noteFolders, sendSectionSubmission, saveNoteField]);

  return (
    <NotesContext.Provider value={{
      notes,
      noteFolders,
      saveNoteField,
      setLocalNoteField,
      publishNote,
      creaNota,
      t
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  return useContext(NotesContext);
}
