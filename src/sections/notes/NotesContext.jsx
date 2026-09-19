import { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { getEfimer, setEfimer } from '../../config/storage.js';
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
  const { noteFolders, notes: rawNotes, creaNota, updateNote: updateNoteContext, status, error, scopeKey } = useNotesData();
  const { sendSectionSubmission } = useMur();
  
  const parsedNotesCache = useRef(new Map());

  // F01 / F05 / F07: El desmuntatge no interromp el desat
  // Com que ara utilitzem un gestor global en segon pla (GlobalSaveManager), 
  // les operacions continuen encara que el NotesProvider es desmunte.

  const draftKey = scopeKey ? `sdp_notes_drafts_${scopeKey}` : 'sdp_notes_drafts';

  const [localNoteOverrides, setLocalNoteOverrides] = useState(() => {
    try {
      const stored = getEfimer(draftKey);
      return stored || {};
    } catch (e) {
      console.warn('draft parse error', e);
      return {};
    }
  });

  // Quan canvia l'scopeKey, recarrega els overrides. Aïllament per usuari/tenant.
  useEffect(() => {
    try {
      const stored = getEfimer(draftKey);
      setLocalNoteOverrides(stored || {});
    } catch (e) {
      setLocalNoteOverrides({});
    }
  }, [draftKey]);

  const setLocalNoteField = useCallback((id, field, value) => {
    if (!id) return;
    setLocalNoteOverrides(prev => {
      const currentOverrides = prev[id] || EMPTY_OVERRIDE;
      if (currentOverrides[field] === value) return prev;
      
      const next = { ...prev, [id]: { ...currentOverrides, [field]: value } };
      try { setEfimer(draftKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [draftKey]);

  const clearLocalNoteFields = useCallback((id, savedPayload, revision) => {
    if (!id) return;
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
      if (!changed && nextOverrides.revision === revision) return prev;
      nextOverrides.revision = revision;
      
      const next = { ...prev, [id]: nextOverrides };
      try { setEfimer(draftKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [draftKey]);

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
    if (!noteId) return Promise.resolve(false);
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
  }, [scopeKey, rawNotes, clearLocalNoteFields, updateNoteContext]);

  const publishNote = useCallback(async (activeNote) => {
    if (!activeNote) return;
    
    const labels = etiquetesDeNota(activeNote, noteFolders)
      .map(({ text, className }) => ({ text, className })); 

    try {
      let finalHeroImage = netejaCamp('heroImage', activeNote.coverImage) || externalConfig?.fallbackLogoUrl || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
      let finalContent = netejaCamp('content', activeNote.content);

      if (teCapacitat('mitjans')) {
        if (typeof finalHeroImage === 'string' && finalHeroImage.startsWith('sdp-media://mitjans_privats/')) {
          const publicHero = await promoteToPublic(finalHeroImage);
          if (publicHero !== finalHeroImage) {
            finalHeroImage = publicHero;
            await saveNoteField(activeNote.id, 'heroImage', publicHero);
          }
        }

        const imgRegex = /sdp-media:\/\/mitjans_privats\/[^\s"']+/g;
        const matches = finalContent.match(imgRegex);
        if (matches) {
          // Eliminem duplicats
          const uniqueMatches = [...new Set(matches)];
          for (const match of uniqueMatches) {
            const newUrl = await promoteToPublic(match);
            if (newUrl !== match) {
              // Reemplaçar de forma global
              finalContent = finalContent.split(match).join(newUrl);
            }
          }
          await saveNoteField(activeNote.id, 'content', finalContent);
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
