import { Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { Dropdown, DateTimeControl } from '../PedraSeca/index.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import React, { Component, useRef, useCallback, useEffect, useState } from 'react';
import { useContent } from './ContentProvider.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { TEXTOS_LLAVOR } from './textosLlavor.js';
import { FORASTER } from './UniversalUtils';

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

/* A3 · Un camp que la persona ha buidat es desa com a cadena buida. El
   contenteditable hi deixa restes (<br>, salts, espais, &nbsp;) que es
   pintarien com a línies en blanc a la targeta i al Mur. */
function valorDelCamp(html) {
  const net = sanitizeHtml(html);
  return (extractPlainText(net, Infinity) || /<img\b/i.test(net)) ? net : '';
}

export function EditableField({ html, placeholder, onChange, onBlur, className }) {
  /* A2 · Mentre el camp té el focus, el DOM és de qui escriu. Si el valor que
     torna del pare es reinjectara a cada tecla, React reescriuria el contingut,
     el cursor tornaria a l'inici i «Hola» eixiria «aloH». El camp pinta un
     valor «mostrat» que només seguix `html` quan no té el focus. Els hooks van
     abans del return null perquè l'ordre no canvie entre renders. */
  const [enfocat, setEnfocat] = useState(false);
  const [mostrat, setMostrat] = useState(html);
  if (!enfocat && mostrat !== html) setMostrat(html);
  if (html === null) return null;
  return (
    <span
      className={className}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setEnfocat(true)}
      onInput={(e) => onChange?.(valorDelCamp(e.currentTarget.innerHTML))}
      onBlur={(e) => {
        const valor = valorDelCamp(e.currentTarget.innerHTML);
        // Buit de veres (sense el <br> que deixa el navegador): així el
        // placeholder ix amb :empty, sense dependre de :has().
        if (!valor) e.currentTarget.replaceChildren();
        setEnfocat(false);
        onBlur?.(valor);
      }}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(mostrat || '') }}
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
  /* D13 · On va la barra d'eines. 'dalt' (per defecte): la fila d'eines
     damunt del document, com sempre. 'davall-entradilla': dins de l'article,
     just després de l'H2 i l'entradilla, i la barra blava passa a ser el
     primer element de la columna. Qualsevol altre valor es comporta com 'dalt'. */
  posicioEines = 'dalt',
  children,
  labels,
  isPublished = false,
  onImageUpload = null,
  formattedTime,
  formattedDate,
  barAuthorAvatar: propBarAuthorAvatar,
  barAuthorName: propBarAuthorName,
  barAuthorLocation: propBarAuthorLocation,
  showStatusToggle = true,
  showLogoUpload = true,
  identityActions = null,
  statusIcon = null,
  previewTitle = "Previsualitzar / Tancar",
  previewHelp = "No oblides desar els canvis.",
  onToast = (msg, type) => console.log(`[Toast ${type}] ${msg}`),
  className = '',
  ...rest
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
    showLogoUpload,
    previewTitle,
    previewHelp,
    identityActions,
    statusIcon,
    onToast
  });

  const contentContext = useContent();
  const config = contentContext?.config || {};
  const barAuthorAvatar = propBarAuthorAvatar || config.barAuthorAvatar || '';
  const barAuthorName = propBarAuthorName || config.barAuthorName || FORASTER.name;
  /* Una cadena buida explícita vol dir «sense poble» (la fitxa d'una persona que
     encara no en té): no s'hi inventa el del Foraster. Sense la prop, com sempre. */
  const barAuthorLocation = propBarAuthorLocation ?? config.barAuthorLocation ?? FORASTER.location;

  /* Amb 'davall-entradilla' les eines es pinten dins de l'article, en un
     embolcall sticky dins del contenidor de scroll (.sdp-editor-eines). Els
     dos fills de l'article van sempre en la mateixa posició: canviar de mode
     no remunta el cos (TipTap). Amb 'dalt' el DOM és el de sempre. */
  const einesDavall = posicioEines === 'davall-entradilla' && topBar != null;

  return (
    <EditorErrorBoundary>
      <div className={`sdp-editor-shell-atomic ${className || ''}`.trim()}>
        {einesDavall ? null : topBar}
        <div className="sdp-editor-document">
          <UniversalPage
            chrome="context"
            layout="contained"
            {...rest}
            topBarData={{
              heroComponent: shellData.topBarData.heroComponent,
              isEmptyHero: !heroImage && !shellData.heroImage,
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
                placeholder={TEXTOS_LLAVOR.titol}
                onChange={(val) => handleFieldChange('title', val)}
                onBlur={(val) => handleFieldBlur('title', val)}
              />
            }
            subtitle={
              <EditableField
                key={`${id}-subtitle`}
                className="editor-subtitle-input"
                html={subtitleHtml}
                placeholder={TEXTOS_LLAVOR.subtitol}
                onChange={(val) => handleFieldChange('subtitle', val)}
                onBlur={(val) => handleFieldBlur('subtitle', val)}
              />
            }
            lead={
              <EditableField
                key={`${id}-lead`}
                className="editor-lead-input"
                html={leadHtml}
                placeholder={TEXTOS_LLAVOR.entradilla}
                onChange={(val) => handleFieldChange('lead', val)}
                onBlur={(val) => handleFieldBlur('lead', val)}
              />
            }
            labels={labels}
          >
            {einesDavall ? <div className="sdp-editor-eines">{topBar}</div> : null}
            {children}
          </UniversalPage>
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
  showLogoUpload = true,
  previewTitle = "Exemple de Publicació",
  previewHelp = "Aquesta targeta és una previsualització de com quedarà al Mur. Utilitza l'editor inferior per modificar el contingut.",
  identityActions = null,
  statusIcon = null,
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

  const resolvedHeroImage = useResolvedAsset(heroImage);
  const resolvedLogoImage = useResolvedAsset(logoImage);

  return {
    heroImage,
    logoImage,
    isPublished,
    formattedTime,
    formattedDate,
    topBarData: {
      logoComponent: showLogoUpload ? ((logoImage && !logoHandler.isEditing) ? (
        <img
          src={resolvedLogoImage || logoImage}
          alt="Logotip"
          className="sdp-logo-personalitzat sdp-logo-personalitzat--editable"
          role="button"
          tabIndex="0"
          onClick={logoHandler.startEdit}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), logoHandler.startEdit())}
          title="Clica per canviar el logotip"
        />
      ) : (
        <div className="sdp-alerta__accions sdp-camp sdp-camp--centrat">
          <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" ref={logoHandler.fileInputRef} onChange={logoHandler.handleFileChange} className="sdp-nomes-lector" />
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => logoHandler.fileInputRef.current?.click()}>
            <ImageIcon size={16} /> Editar logotip
          </button>
          <p className="sdp-camp__ajuda">Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.</p>
          {logoImage && (
            <div className="sdp-alerta__accions">
              <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={logoHandler.cancelEdit}>Enrere</button>
              <button type="button" className="sdp-boto sdp-boto--perill" onClick={logoHandler.handleDelete}>Esborrar</button>
            </div>
          )}
        </div>
      )) : null,
      heroComponent: (heroImage && !heroHandler.isEditing) ? (
        <img
          src={resolvedHeroImage || heroImage}
          alt="Capçalera"
          className="sdp-hero__imatge"
          role="button"
          tabIndex="0"
          onClick={heroHandler.startEdit}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), heroHandler.startEdit())}
          title="Clica per canviar la imatge"
        />
      ) : (
        <div className="sdp-alerta__accions sdp-camp sdp-camp--centrat">
          <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" ref={heroHandler.fileInputRef} onChange={heroHandler.handleFileChange} className="sdp-nomes-lector" />
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => heroHandler.fileInputRef.current?.click()}>
            <ImageIcon size={16} /> Editar capçalera
          </button>
          <p className="sdp-camp__ajuda">Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.</p>
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
                  {statusIcon ? statusIcon : (isPublished ? <Globe size={16} /> : <Lock size={16} />)}
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
          {identityActions}
        </>
      )
    }
  };
}

export default UniversalEditorShell;
