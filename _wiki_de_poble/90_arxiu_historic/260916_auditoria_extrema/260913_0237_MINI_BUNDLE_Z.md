---
type: document
status: esborrany
description: "MINI-BUNDLE PER A Z: AUDITORIA EDITOR PLUGIN"
---
# MINI-BUNDLE PER A Z: AUDITORIA EDITOR PLUGIN

## FITXER: src/components/universal/UniversalEditorShell.jsx
```jsx
import { Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { DateTimeControl } from '../ui/controls';
import { sanitizeHtml } from '../../utils/sanitize.js';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';
import React, { Component, useRef, useCallback, useEffect } from 'react';
import { useContent } from './ContentProvider.jsx';
import { UniversalPage } from './UniversalPage.jsx';

// Error Boundary per protegir l'editor i evitar tombar la pàgina hoste
class EditorErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("EditorErrorBoundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="sdp-estat sdp-estat--error">
          <div className="sdp-estat__contenidor">
            <h3 className="sdp-estat__titol">L'editor ha fallat</h3>
            <p className="sdp-estat__descripcio">S'ha produït un error inesperat dins del motor d'edició. Torna a carregar la pàgina per a continuar.</p>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

export function EditableField({ html, placeholder, onChange, onBlur, className }) {
  if (html === null) return null;
  return (
    <span
      className={className}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange?.(sanitizeHtml(e.currentTarget.innerHTML))}
      onBlur={(e) => onBlur?.(sanitizeHtml(e.currentTarget.innerHTML))}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html || '') }}
    />
  );
}

export function UniversalEditorShell({
  id,
  titleHtml,
  subtitleHtml,
  leadHtml,
  onSaveField,
  onLocalChange,
  heroImage,
  logoImage,
  topBar,
  children,
  labels,
  isPublished = false,
  onImageUpload = null,
  formattedTime,
  formattedDate,
  showStatusToggle = true,
  previewTitle = "Previsualitzar / Tancar",
  previewHelp = "No oblides desar els canvis.",
  onToast = (msg, type) => console.log(`[Toast ${type}] ${msg}`),
  className = ''
}) {
  const debounceTimeouts = useRef({});
  const onSaveFieldRef = useRef(onSaveField);
  const onLocalChangeRef = useRef(onLocalChange);

  onSaveFieldRef.current = onSaveField;
  onLocalChangeRef.current = onLocalChange;

  const flushField = useCallback((field) => {
    const pending = debounceTimeouts.current[field];
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    delete debounceTimeouts.current[field];
    onSaveFieldRef.current?.(field, pending.value, pending.id);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    onLocalChangeRef.current?.(field, value, id);

    const previous = debounceTimeouts.current[field];
    if (previous) {
      clearTimeout(previous.timeoutId);
    }
    const timeoutId = setTimeout(() => flushField(field), 800);
    debounceTimeouts.current[field] = { timeoutId, value, id };
  }, [flushField, id]);

  const handleFieldBlur = useCallback((field, value) => {
    const pending = debounceTimeouts.current[field];
    if (pending) {
      pending.value = value;
      flushField(field);
      return;
    }
    onSaveFieldRef.current?.(field, value, id);
  }, [flushField, id]);

  useEffect(() => () => {
    Object.keys(debounceTimeouts.current).forEach(flushField);
  }, [id, flushField]);

  useEffect(() => {
    const flushAllFields = () => {
      Object.keys(debounceTimeouts.current).forEach(flushField);
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushAllFields();
    };

    window.addEventListener('pagehide', flushAllFields);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flushAllFields);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, [flushField]);

  const shellData = useEditorShell({
    onSaveField: (field, value) => onSaveFieldRef.current?.(field, value, id),
    onImageUpload,
    heroImage,
    logoImage,
    isPublished,
    formattedTime,
    formattedDate,
    showStatusToggle,
    previewTitle,
    previewHelp,
    onToast
  });

  const contentContext = useContent();
  const config = contentContext?.config || {};
  const barAuthorAvatar = config.barAuthorAvatar || '/assets/system/ui/default-avatar.jpg';
  const barAuthorName = config.barAuthorName || 'Foraster';
  const barAuthorLocation = config.barAuthorLocation || 'Identitat Lliure';

  return (
    <EditorErrorBoundary>
      {topBar}
      <UniversalPage
        chrome="context"
        variant="embed"
        topBarData={{
          heroComponent: shellData.topBarData.heroComponent,
          logoComponent: shellData.topBarData.logoComponent,
          barActions: shellData.topBarData.barActions,
          authorName: barAuthorName,
          authorLocation: barAuthorLocation,
          authorAvatar: barAuthorAvatar,
          dateTime: formattedDate
        }}
        title={
          <EditableField 
            key={`${id}-title`} 
            className="editor-title-input" 
            html={titleHtml} 
            placeholder="Títol..." 
            onChange={(val) => handleFieldChange('title', val)} 
            onBlur={(val) => handleFieldBlur('title', val)} 
          />
        }
        subtitle={
          <EditableField 
            key={`${id}-subtitle`} 
            className="editor-subtitle-input" 
            html={subtitleHtml} 
            placeholder="Subtítol opcional..." 
            onChange={(val) => handleFieldChange('subtitle', val)} 
            onBlur={(val) => handleFieldBlur('subtitle', val)} 
          />
        }
        lead={
          <EditableField 
            key={`${id}-lead`} 
            className="editor-lead-input" 
            html={leadHtml} 
            placeholder="Entradilla opcional..." 
            onChange={(val) => handleFieldChange('lead', val)} 
            onBlur={(val) => handleFieldBlur('lead', val)} 
          />
        }
        labels={labels}
      >
        <div className="ues-canvas ues-canvas--ple">
          {children}
        </div>
      </UniversalPage>
    </EditorErrorBoundary>
  );
}

export function useEditorShell({ 
  onSaveField, 
  onImageUpload = null,
  heroImage, 
  logoImage, 
  isPublished, 
  formattedTime, 
  formattedDate,
  showStatusToggle = true,
  previewTitle = "Exemple de Publicació",
  previewHelp = "Aquesta targeta és una previsualització de com quedarà al Mur. Utilitza l'editor inferior per modificar el contingut.",
  onToast = console.log
}) {
  const heroHandler = useHeroImageHandler({ 
    onSaveField, 
    fieldName: 'heroImage',
    onImageUpload,
    onError: (msg) => onToast(msg, 'error'),
    onConfirmDelete: () => {
      onToast("Imatge esborrada", "success");
      return true;
    }
  });
  
  const logoHandler = useHeroImageHandler({ 
    onSaveField, 
    fieldName: 'logoImage',
    onImageUpload,
    onError: (msg) => onToast(msg, 'error'),
    onConfirmDelete: () => {
      onToast("Logotip esborrat", "success");
      return true;
    }
  });

  return {
    heroImage,
    logoImage,
    isPublished,
    formattedTime,
    formattedDate,
    topBarData: {
      logoComponent: (logoImage && !logoHandler.isEditing) ? (
        <img 
          src={logoImage} 
          alt="Logotip" 
          className="page-title-logo hero-image" 
          onClick={logoHandler.startEdit}
          title="Clica per canviar el logotip"
        />
      ) : (
        <div className="sdp-alerta__accions sdp-camp">
          <input type="file" accept="image/*" ref={logoHandler.fileInputRef} onChange={logoHandler.handleFileChange} className="sdp-nomes-lector" />
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => logoHandler.fileInputRef.current?.click()}>
            <ImageIcon size={16} /> Inserir Logotip
          </button>
          {logoImage && (
            <div className="sdp-alerta__accions">
              <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={logoHandler.cancelEdit}>Enrere</button>
              <button type="button" className="sdp-boto sdp-boto--perill" onClick={logoHandler.handleDelete}>Esborrar</button>
            </div>
          )}
        </div>
      ),
      heroComponent: (heroImage && !heroHandler.isEditing) ? (
        <img 
          src={heroImage} 
          alt="Capçalera" 
          className="hero-image" 
          onClick={heroHandler.startEdit}
          title="Clica per canviar la imatge"
        />
      ) : (
        <div className="sdp-alerta__accions sdp-camp">
          <input type="file" accept="image/*" ref={heroHandler.fileInputRef} onChange={heroHandler.handleFileChange} className="sdp-nomes-lector" />
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => heroHandler.fileInputRef.current?.click()}>
            <ImageIcon size={16} /> Inserir Capçalera
          </button>
          {heroImage && (
            <div className="sdp-alerta__accions">
              <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={heroHandler.cancelEdit}>Enrere</button>
              <button type="button" className="sdp-boto sdp-boto--perill" onClick={heroHandler.handleDelete}>Esborrar</button>
            </div>
          )}
        </div>
      ),
      barActions: (
        <>
          {showStatusToggle && (
            <Dropdown
              right
              minWidth="320px"
              trigger={
                <button type="button" className={`btn-icon-orange ${isPublished ? 'published' : ''}`}>
                  {isPublished ? <Globe size={16} /> : <Lock size={16} />}
                </button>
              }
            >
              <div className="sdp-camp">
                <strong className="sdp-alerta__titol">{isPublished ? previewTitle : 'Pàgina en Edició'}</strong>
                <p className="sdp-camp__ajuda">{previewHelp}</p>
              </div>
            </Dropdown>
          )}
          <DateTimeControl time={formattedTime} date={formattedDate} />
        </>
      )
    }
  };
}

export default UniversalEditorShell;

```

## FITXER: src/sections/notes/NotesEditor.jsx
```jsx
import { FileText } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import {
  useUniversalRichText,
  useTipTapToolbarAdapter,
  UniversalRichTextToolbar,
  UniversalRichTextContent,
} from '../../components/universal/richText';
import { extensionsRiques } from '../../components/universal/richText/extensions/index.js';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';

/* Constants de mòdul: identitat eterna, cap recreació per render. */
const SENSE_PARAMS = {};
const toastPerConsola = (msg, tipus) =>
  console.warn('[NotesEditor] Toast sense cablejar:', msg, tipus);

/* La capacitat es comprova al MOMENT de la crida (abans es capturava al
   muntatge i quedava antiguada si l'usuari entrava després). A més:
   funció de mòdul = identitat estable per a l'hook i per a la closca. */
async function pujarImatgeDeNota(fitxer) {
  if (!teCapacitat('mitjans')) return null;
  const res = await uploadToStorage(fitxer, { carpeta: 'notes' });
  return res.url;
}

export default function NotesEditor({ activeNote, onToast = toastPerConsola }) {
  const { saveNoteField, setLocalNoteField, publishNote, noteFolders, t } = useNotes();

  const extensions = useMemo(
    () => extensionsRiques({ onImageUpload: pujarImatgeDeNota }),
    [],
  );

  /* Handlers ESTABLES. Sospitós #1 de la pèrdua de focus: si
     useUniversalRichText posa onChange/onSave en deps de recreació de
     l'editor, una identitat nova per render destrueix el TipTap.
     Açò ho neutralitza — sempre que NotesContext done funcions
     estables (si no, el focus killer viu allà). */
  const desaLocal = useCallback(
    (field, val, noteId) => {
      if (noteId != null) setLocalNoteField(noteId, field, val);
    },
    [setLocalNoteField],
  );

  const desaCamp = useCallback(
    (field, val, noteId) => {
      if (noteId != null) saveNoteField(noteId, field, val);
    },
    [saveNoteField],
  );

  const handleChange = useCallback(
    (html, noteId) => desaLocal('content', html, noteId),
    [desaLocal],
  );

  const handleSave = useCallback(
    (html, noteId) => desaCamp('content', html, noteId),
    [desaCamp],
  );

  const editor = useUniversalRichText({
    content: activeNote?.content || '',
    id: activeNote?.id,
    extensions,
    onChange: handleChange,
    onSave: handleSave,
    debounceMs: 800,
  });

  const { state, exec } = useTipTapToolbarAdapter(editor);

  const publica = useCallback(() => {
    if (activeNote) publishNote(activeNote);
  }, [publishNote, activeNote]);

  if (!activeNote) {
    return (
      <section className="editor-shell--main">
        <div className="chat-empty">
          <FileText size={64} />
          <h2 className="section-title">{t('section.notes.open', 'Obre un solc')}</h2>
        </div>
      </section>
    );
  }

  const topBar = (
    <UniversalRichTextToolbar
      state={state}
      exec={exec}
      onPublish={publica}
      isPublished={activeNote.isPublished}
      t={t}
    />
  );

  return (
    <UniversalEditorShell
      key={activeNote.id}
      id={activeNote.id}
      topBar={topBar}
      titleHtml={activeNote.title}
      subtitleHtml={activeNote.subtitle}
      leadHtml={activeNote.lead}
      heroImage={activeNote.heroImage}
      logoImage={activeNote.logoImage}
      isPublished={activeNote.isPublished}
      formattedTime={activeNote.formattedTime}
      formattedDate={activeNote.formattedDate}
      labels={etiquetesDeNota(activeNote, noteFolders, SENSE_PARAMS)}
      onImageUpload={pujarImatgeDeNota}
      onLocalChange={desaLocal}
      onSaveField={desaCamp}
      onToast={onToast}
    >
      <UniversalRichTextContent editor={editor} />
    </UniversalEditorShell>
  );
}

```

## FITXER: src/sections/profile/DetallAjust.jsx
```jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { logout } from '../../data/backendPort.js';
import { useNavigate } from '../../app/contexts/RouterContext';
import { compressImage } from '../../utils/imageUtils.js';
import UniversalToolbar from '../../components/universal/UniversalToolbar';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';

/** Un data URL comprimit tornat a Blob, per a pujar-lo com a fitxer. */
async function aBlob(dataUrl) {
  const resposta = await fetch(dataUrl);
  return await resposta.blob();
}

/* Si l'apujada ha fallat i la imatge es queda en data URL local, no la
   desarem a la BD si pesa com un manuscrit. */
const MAX_DATA_URL = 150_000;

export default function DetallAjust({
  ajust,
  identitat,
  guardarAjust,
  guardarCampPerfil,
  pujaMitja,
}) {
  const navigate = useNavigate();

  const [valorTemp, setValorTemp] = useState('');
  const [desant, setDesant] = useState(false);
  const [pujant, setPujant] = useState(false);
  const [missatge, setMissatge] = useState(null);
  const timeoutMissatge = useRef(null);

  /* ── Tots els hooks ABANS de cap return condicional ── */
  const dades = identitat?.dades || {};
  const isPersona = identitat?.mena === 'persona';
  const carpetaMitjans = isPersona ? 'avatars' : 'organitzacions';

  /* El timeout del missatge de "Desat" es neteja en desmuntar. */
  useEffect(() => () => clearTimeout(timeoutMissatge.current), []);

  useEffect(() => {
    clearTimeout(timeoutMissatge.current);
    const valorInicial =
      ajust?.tipus === 'password'
        ? ''
        : ajust?.tipus === 'boolean'
          ? Boolean(ajust?.valor)
          : ajust?.valor ?? '';
    setValorTemp(valorInicial);
    setMissatge(null);
  }, [ajust?.id, identitat?.id]);

  /* Abans: funcions noves per render (memo busting). */
  const pujaDesDeLaClosca = useCallback(
    (file) => (typeof pujaMitja === 'function' ? pujaMitja(file, carpetaMitjans) : null),
    [pujaMitja, carpetaMitjans],
  );

  const desaCampClosca = useCallback(
    (field, value, identitatId) => {
      if (!identitatId) return;
      if (field === 'title') guardarCampPerfil(isPersona ? 'full_name' : 'name', value, identitatId);
      else if (field === 'subtitle' && !isPersona) guardarCampPerfil('lema', value, identitatId);
      else if (field === 'lead' && !isPersona) guardarCampPerfil('description', value, identitatId);
      else if (field === 'logoImage') guardarCampPerfil(isPersona ? 'avatar_url' : 'logo_url', value, identitatId);
    },
    [guardarCampPerfil, isPersona],
  );

  /* El botó de la barra ja no menteix amb un alert(): commuta la
     visibilitat de veres. */
  const commutaPublicacio = useCallback(async () => {
    if (!identitat?.id) return;
    try {
      await guardarCampPerfil('is_public', !dades.is_public, identitat.id);
    } catch (e) {
      setMissatge({ tipus: 'error', text: e?.message || "No s'ha pogut canviar la visibilitat." });
    }
  }, [guardarCampPerfil, dades.is_public, identitat?.id]);

  /* ── Accions ── */

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMissatge({ tipus: 'error', text: 'Només imatges, de moment.' });
      return;
    }

    setPujant(true);
    setMissatge(null);
    let dataUrl = null;
    try {
      dataUrl = await compressImage(file, {
        maxSize: 600,
        format: 'image/webp',
        quality: 0.8,
      });

      if (typeof pujaMitja !== 'function') {
        setMissatge({ tipus: 'error', text: 'El servidor no admet pujada d\'imatges.' });
        return;
      }

      const blob = await aBlob(dataUrl);
      const fitxer = new File([blob], 'avatar.webp', { type: 'image/webp' });
      const url = await pujaMitja(fitxer, 'avatars');

      if (url) {
        setValorTemp(url);
        setMissatge({ tipus: 'exit', text: 'Imatge pujada. Ara dóna-li a Guardar.' });
      } else {
        setMissatge({ tipus: 'error', text: 'No s\'ha pogut pujar la imatge al servidor.' });
      }
    } catch (error) {
      console.warn('Upload to storage failed', error);
      setMissatge({ tipus: 'error', text: 'S\'ha produït un error al pujar la imatge. Comprova la teua connexió.' });
    } finally {
      setPujant(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ajust || !identitat) return;

    if (
      ajust.tipus === 'imatge' &&
      typeof valorTemp === 'string' &&
      valorTemp.startsWith('data:') &&
      valorTemp.length > MAX_DATA_URL
    ) {
      setMissatge({
        tipus: 'error',
        text: 'La imatge local és massa gran per a desar-la. Torna-ho a provar amb connexió.',
      });
      return;
    }

    setDesant(true);
    setMissatge(null);
    try {
      /* Identitat EXPLÍCITA: este era el forat que escrivia a
         l'entitat equivocada. */
      await guardarAjust(identitat.id, ajust.id, valorTemp);
      setMissatge({ tipus: 'exit', text: 'Desat correctament.' });
      clearTimeout(timeoutMissatge.current);
      timeoutMissatge.current = setTimeout(() => setMissatge(null), 3000);
    } catch (error) {
      setMissatge({ tipus: 'error', text: error?.message || 'Error en desar.' });
    } finally {
      setDesant(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (e) {
      setMissatge({ tipus: 'error', text: "No s'ha pogut tancar la sessió." });
      return;
    }
    /* Recàrrega completa: cap context en memòria sobreviu a la sessió. */
    navigate('/', { replace: true });
    window.location.reload();
  }

  function obriFitxa() {
    if (ajust?.valor) navigate(ajust.valor);
  }

  /* ── Render: el CATÀLEG mana, la UI obedeix ── */

  function renderitzaAccio() {
    if (ajust.pendent) {
      /* Honestedat abans que promeses: acció declarada però sense
         backend = botó desactivat + explicació, mai "permission
         denied" en silenci. */
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto" disabled>
            {ajust.titol}
          </button>
          <p className="perfil-detall-buit">
            Aquesta acció encara no està implementada en aquesta versió.
          </p>
        </div>
      );
    }
    if (ajust.accio === 'logout') {
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto sdp-boto--perill" onClick={handleLogout}>
            Confirmar eixida
          </button>
        </div>
      );
    }
    if (ajust.accio === 'obrir-fitxa') {
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto" onClick={obriFitxa}>
            Veure la fitxa pública
          </button>
        </div>
      );
    }
    /* Acció declarada però sense despachar: que el catàleg i la UI no
       tornen a divergir en silenci. */
    if (import.meta.env.DEV) {
      console.error(`[DetallAjust] Acció sense implementar: "${ajust.accio}" (ajust "${ajust.id}")`);
    }
    return <p className="perfil-detall-buit">Acció pendent d'implementació.</p>;
  }

  function renderitzaFormulari() {
    if (!ajust.obert) {
      return (
        <p className="perfil-detall-buit">
          {ajust.motiu || 'Aquest ajust no es pot modificar.'}
        </p>
      );
    }

    if (ajust.tipus === 'accio') return renderitzaAccio();

    const tipus = ajust.tipus || 'text';

    return (
      <form onSubmit={handleSubmit} className="form-trellat">
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor={`ajust-${ajust.id}`}>
            {tipus === 'boolean'
              ? `${ajust.titol}:`
              : `Nou valor per a ${ajust.titol.toLowerCase()}:`}
          </label>

          {tipus === 'imatge' ? (
            <div className="sdp-alerta__accions">
              {valorTemp && (
                <div className="sdp-avatar sdp-avatar--xl">
                  <img src={valorTemp} alt="Previsualització" className="sdp-avatar__imatge" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id={`ajust-${ajust.id}`}
                className="sdp-control"
                onChange={handleFileChange}
                disabled={pujant}
              />
              {pujant && <p className="sdp-camp__ajuda">Pujant la imatge...</p>}
            </div>
          ) : tipus === 'boolean' ? (
            <label className="sdp-camp__check">
              <input
                type="checkbox"
                checked={Boolean(valorTemp)}
                onChange={(e) => setValorTemp(e.target.checked)}
              />
              {valorTemp ? 'Públic' : 'Privat'}
            </label>
          ) : tipus === 'area' ? (
            <textarea
              id={`ajust-${ajust.id}`}
              className="sdp-control sdp-control--area"
              rows="5"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
            />
          ) : (
            <input
              type={tipus === 'password' ? 'password' : 'text'}
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              placeholder={tipus === 'password' ? 'Introdueix nova contrasenya...' : ''}
            />
          )}

          {missatge && (
            <p className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'}>
              {missatge.text}
            </p>
          )}

          <div className="sdp-alerta__accions">
            <button type="submit" className="sdp-boto sdp-boto--primari" disabled={desant || pujant}>
              {desant ? 'Desant...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (!identitat) {
    return (
      <div className="sdp-buit">
        <p>Crea el teu compte o inicia sessió per a començar.</p>
      </div>
    );
  }

  return (
    <UniversalEditorShell
      key={identitat.id}
      id={identitat.id}
      topBar={
        <UniversalToolbar
          onPublish={commutaPublicacio}
          isPublished={Boolean(dades.is_public)}
          publishDisabled={false}
        />
      }
      titleHtml={identitat.nom || ''}
      subtitleHtml={isPersona ? null : dades.lema || ''}
      leadHtml={isPersona ? null : dades.description || ''}
      heroImage={null}
      logoImage={dades.avatar_url || dades.logo_url}
      isPublished={Boolean(dades.is_public)}
      onImageUpload={pujaDesDeLaClosca}
      onSaveField={desaCampClosca}
      showStatusToggle={false}
    >
      <div className="perfil-detall">
        {ajust ? renderitzaFormulari() : (
          <p className="perfil-detall-buit">
            Selecciona un ajust de l'esquerra per a modificar-lo.
          </p>
        )}
      </div>
    </UniversalEditorShell>
  );
}

```

## FITXER: src/hooks/useHeroImageHandler.js
```jsx
import { useState, useRef } from 'react';

import { compressImage } from '../utils/imageUtils.js';

/** Un data URL comprimit tornat a fitxer, per a pujar-lo. */
async function aFitxer(dataUrl, nom, tipus) {
  const resposta = await fetch(dataUrl);
  const blob = await resposta.blob();
  return new File([blob], nom, { type: tipus });
}

export default function useHeroImageHandler({ 
  onSaveField, 
  fieldName = 'heroImage', 
  maxSizeBytes = 5 * 1024 * 1024, // Accept up to 5MB, then compress
  onError = (msg) => console.error(msg),
  onConfirmDelete = () => true,
  /* FASE 4. Capacitat opcional. Si no ve, comportament idèntic al d'abans:
     data URL. Cap host existent es trenca per no passar-la. */
  onImageUpload = null
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError('Només imatges, de moment.');
      return;
    }
    if (file.size > maxSizeBytes) {
      onError(`La imatge passa de ${Math.round(maxSizeBytes / (1024 * 1024))} MB. És massa pesada per processar-la.`);
      return;
    }

    setIsUploading(true);
    try {
      const esMenut = fieldName.toLowerCase().includes('logo') || fieldName.toLowerCase().includes('avatar');
      const maxSize = esMenut ? 600 : 1200;
      const dataUrl = await compressImage(file, { maxSize, format: 'image/webp', quality: 0.8 });

      let valor = dataUrl;
      if (typeof onImageUpload === 'function') {
        const fitxer = await aFitxer(dataUrl, `${fieldName}.webp`, 'image/webp');
        const url = await onImageUpload(fitxer);
        if (url) valor = url;
      }

      onSaveField?.(fieldName, valor);
      setIsEditing(false);
    } catch (err) {
      onError(err?.message || "No s'ha pogut processar la imatge.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await onConfirmDelete();
    if (!confirmed) return;
    onSaveField?.(fieldName, '');
    setIsEditing(false);
  };

  const cancelEdit = () => setIsEditing(false);
  const startEdit = () => setIsEditing(true);

  return {
    isEditing,
    isUploading,
    startEdit,
    cancelEdit,
    fileInputRef,
    handleFileChange,
    handleDelete
  };
}

```

## FITXER: src/hooks/useLogoImageHandler.js
[FITXER ABSENT]

## FITXER: src/components/universal/UniversalPage.jsx
```jsx
import { useNavigate, Link } from '../../app/contexts/RouterContext';
import { showToast } from './AvisadorEfimer';
import { useContent } from './ContentProvider';
import { PageFrame } from './PageFrame';
import { isSafeUrl, isValidDate } from './UniversalUtils';

export function UniversalPage(props) {
  const contentContext = useContent();
  const config = contentContext?.config || {};

  const navigate = useNavigate();
  
  const title = props.title ?? config.title;
  const actualTitleText = props.titleText || config.titleText || (typeof title === 'string' ? title : '');
  
  const handleConnect = props.onConnect || (() => navigate('/connectar?item_id=' + encodeURIComponent(actualTitleText || 'page')));
  const handleBack = props.onBack || (() => navigate(-1));
  const handleForward = props.onForward || (() => navigate(1));
  
  const handleComment = props.onComment || (() => navigate('/xat'));
  const handleTranslate = props.onTranslate || (() => navigate('/traduccions?item_id=' + encodeURIComponent(actualTitleText || 'page')));
  const handleShare = props.onShare || (() => {
    const safeHref = isSafeUrl(window.location.href) ? window.location.href : window.location.origin;
    if (navigator.share) {
      navigator.share({ title: title || document.title, url: safeHref }).catch(console.error);
    } else {
      navigator.clipboard.writeText(safeHref);
      showToast('Enllaç copiat al porta-retalls');
    }
  });

  const barDateTime = props.topBarData?.dateTime ?? props.dateTime ?? config.dateTime;
  const barDate = props.topBarData?.date ?? props.date ?? config.date;
  
  const handleDateTime = props.onDateTime || config.onDateTime || ((e) => {
    e.preventDefault();
    e.stopPropagation();
    let yyyymmdd;
    if (barDateTime) {
      yyyymmdd = barDateTime.split('T')[0];
    } else if (barDate) {
      const parts = barDate.split('/');
      if (parts.length === 3) {
        let [dd, mm, yy] = parts;
        if (yy.length === 2) yy = '20' + yy;
        if (isValidDate(dd, mm, yy)) {
          yyyymmdd = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
      } else {
        const d = new Date(barDate);
        if (!isNaN(d.getTime())) yyyymmdd = d.toISOString().split('T')[0];
      }
    }
    if (yyyymmdd) {
      navigate(`/mur?date=${encodeURIComponent(yyyymmdd)}`);
    } else {
      navigate('/mur');
    }
  });

  return (
    <PageFrame
      {...config}
      {...props}
      onConnect={handleConnect}
      onBack={handleBack}
      onForward={handleForward}
      onTranslate={handleTranslate}
      onComment={handleComment}
      onShare={handleShare}
      onDateTime={handleDateTime}
      LinkComponent={Link}
    />
  );
}

```

## FITXER: src/sections/notes/NotesContext.jsx
```jsx
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
      image: netejaCamp('heroImage', activeNote.coverImage) || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
      labels,
      author_name: 'Sóc de Poble',
      author_location: 'La Torre de les Maçanes',
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

```

