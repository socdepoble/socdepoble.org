import { Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { DateTimeControl } from '../ui/controls';
import { sanitizeHtml } from '../../utils/sanitize.js';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';
import React, { Component, useRef, useCallback, useEffect } from 'react';
import { useContent } from './ContentProvider.jsx';

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
      <div className={`ues-root ${className}`}>
        <header className="ues-header">
          {topBar}
        </header>
        <div className="ues-scroll">
          {shellData.topBarData.heroComponent ? (
            <div className="hero-image">
              {shellData.topBarData.heroComponent}
            </div>
          ) : null}
          
          <section className="bar-orange bar-orange--embed bar-orange--top" aria-label="Autoria i data">
            <div className="sp-card-author">
              <img
                className="sp-card-avatar"
                src={barAuthorAvatar}
                alt="Avatar"
                decoding="async"
                width="48"
                height="48"
              />
              <div className="sp-card-author-info">
                <div className="sp-card-author-name">{barAuthorName}</div>
                <div className="sp-card-author-location">{barAuthorLocation}</div>
              </div>
            </div>
            <div className="bar-actions">
              {shellData.topBarData.barActions}
            </div>
          </section>

          <div className="ues-canvas">
            <div className="page-title">
              {shellData.topBarData.logoComponent}
              <EditableField 
                key={`${id}-title`} 
                className="editor-title-input" 
                html={titleHtml} 
                placeholder="Títol..." 
                onChange={(val) => handleFieldChange('title', val)} 
                onBlur={(val) => handleFieldBlur('title', val)} 
              />
              {labels && labels.length > 0 && (
                <ul className="sp-card-labels page-title-labels" aria-label="Categories" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  {labels.map((label, idx) => (
                    <li key={idx} className={`sdp-badge sdp-badge-${label.type}`}>
                      {label.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <EditableField 
              key={`${id}-subtitle`} 
              className="editor-subtitle-input" 
              html={subtitleHtml} 
              placeholder="Subtítol opcional..." 
              onChange={(val) => handleFieldChange('subtitle', val)} 
              onBlur={(val) => handleFieldBlur('subtitle', val)} 
            />
            <EditableField 
              key={`${id}-lead`} 
              className="editor-lead-input" 
              html={leadHtml} 
              placeholder="Entradilla opcional..." 
              onChange={(val) => handleFieldChange('lead', val)} 
              onBlur={(val) => handleFieldBlur('lead', val)} 
            />
            {children}
          </div>
        </div>
      </div>
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
