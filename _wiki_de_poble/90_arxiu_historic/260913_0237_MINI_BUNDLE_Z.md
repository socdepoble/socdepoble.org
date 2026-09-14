---
tipus: document
estat: esborrany
description: "MINI-BUNDLE PER A Z: AUDITORIA EDITOR PLUGIN"
---
# MINI-BUNDLE PER A Z: AUDITORIA EDITOR PLUGIN

## FITXER: src/components/universal/UniversalEditorShell.jsx
```jsx
import { Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { UniversalPage } from './UniversalPage';
import { DateTimeControl, Dropdown } from './UniversalElements';
import { sanitizeHtml } from '../../utils/sanitize.js';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';

export default function UniversalEditorShell({
  children,
  className = '',
  topBar,
  titleText = 'Sense Títol',
  heroImage,
  logoImage,
  authorName,
  authorLocation,
  authorAvatar,
  isPublished,
  formattedTime,
  formattedDate,
  titleHtml = '',
  subtitleHtml = '',
  leadHtml = '',
  onSaveField,
  onLocalChange,
  labels = [],
  copyright = '© Sóc de Poble / Fet per la IAIA i Nano Banana',
}) {
  const heroHandler = useHeroImageHandler({ onSaveField, fieldName: 'heroImage' });
  const logoHandler = useHeroImageHandler({ onSaveField, fieldName: 'logoImage' });

  return (
    <section className={`editor-shell--main ${className}`}>
      {topBar}
      <div className="editor-scroll-area">
        <UniversalPage 
          titleText={titleText}
          chrome="context" 
          variant="embed"
          showLogos={!heroImage}
          authorName={authorName}
          authorLocation={authorLocation}
          authorAvatar={authorAvatar}
          topBarData={{
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
                  <ImageIcon size={16} /> Inserir Imatge (Logotip) o Multimèdia (600x600)
                </button>
                {logoImage && (
                  <div className="sdp-alerta__accions">
                    <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={logoHandler.cancelEdit}>
                      Tornar enrere
                    </button>
                    <button type="button" className="sdp-boto sdp-boto--perill" onClick={logoHandler.handleDelete}>
                      Esborrar contingut
                    </button>
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
                  <ImageIcon size={16} /> Inserir Imatge o Multimèdia
                </button>
                {heroImage && (
                  <div className="sdp-alerta__accions">
                    <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={heroHandler.cancelEdit}>
                      Tornar enrere
                    </button>
                    <button type="button" className="sdp-boto sdp-boto--perill" onClick={heroHandler.handleDelete}>
                      Esborrar contingut
                    </button>
                  </div>
                )}
              </div>
            ),
            barActions: (
              <>
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
                    <strong className="sdp-alerta__titol">{isPublished ? 'Exemple de Publicació' : 'Pàgina en Edició'}</strong>
                    <p className="sdp-camp__ajuda">Aquesta targeta és una previsualització de com quedarà al Mur. Utilitza l'editor inferior per modificar el contingut.</p>
                  </div>
                </Dropdown>
                <DateTimeControl time={formattedTime} date={formattedDate} />
              </>
            )
          }}
          title={
            <span
              className="editor-title-input"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => onLocalChange?.('title', e.currentTarget.innerHTML)}
              onBlur={(e) => onSaveField?.('title', e.currentTarget.innerHTML)}
              data-placeholder="Escriu el títol de l'article (H1)..."
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(titleHtml) }}
            />
          }
          labels={labels}
          copyright={copyright}
          subtitle={
            <span
              className="editor-subtitle-input"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => onLocalChange?.('subtitle', e.currentTarget.innerHTML)}
              onBlur={(e) => onSaveField?.('subtitle', e.currentTarget.innerHTML)}
              data-placeholder="Escriu el subtítol (H2)..."
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(subtitleHtml) }}
            />
          }
          lead={
            <span
              className="editor-lead-input"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => onLocalChange?.('lead', e.currentTarget.innerHTML)}
              onBlur={(e) => onSaveField?.('lead', e.currentTarget.innerHTML)}
              data-placeholder="Escriu l'entradilla..."
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(leadHtml) }}
            />
          }
        >
          {children}
        </UniversalPage>
      </div>
    </section>
  );
}

```

## FITXER: src/sections/notes/NotesEditor.jsx
```jsx
import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FileText } from 'lucide-react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useManager } from '../../components/universal/manager/ManagerContext';
import NotesToolbar from './NotesToolbar';
import UniversalEditorShell from '../../components/universal/UniversalEditorShell';

export default function NotesEditor() {
  const { saveNoteField, setLocalNoteField, noteFolders, t } = useNotes();
  const { activeItem: activeNote } = useManager();
  const timeoutRef = useRef(null);
  const pendingSaveRef = useRef({ id: null, content: null });
  const currentNoteRef = useRef({ id: null, title: '', subtitle: '', lead: '' });

  if (currentNoteRef.current.id !== activeNote?.id) {
    currentNoteRef.current = {
      id: activeNote?.id,
      title: activeNote?.title || '',
      subtitle: activeNote?.subtitle || '',
      lead: activeNote?.lead || ''
    };
  }

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] } })],
    content: activeNote?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const currentId = currentNoteRef.current.id;
      pendingSaveRef.current = { id: currentId, content: html };
      setLocalNoteField(currentId, 'content', html);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (currentId) saveNoteField(currentId, 'content', html);
        pendingSaveRef.current = { id: null, content: null };
      }, 800);
    },
    editorProps: {
      attributes: {
        class: 'editor-content page-content sdp-text-cos sdp-prose'
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed || !activeNote) return;
    try {
      if (editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content || '', false);
      }
    } catch (err) {
      console.warn('Editor sync skipped (Fast Refresh / not ready)', err);
    }
  }, [activeNote?.id, editor]);

  // Guardat segur al canviar de nota, desmuntar o en tancar la pestanya (pagehide)
  useEffect(() => {
    const currentId = activeNote?.id;

    const flushSave = () => {
      if (timeoutRef.current && pendingSaveRef.current.id === currentId) {
        clearTimeout(timeoutRef.current);
        saveNoteField(currentId, 'content', pendingSaveRef.current.content);
        pendingSaveRef.current = { id: null, content: null };
      }
    };

    window.addEventListener('pagehide', flushSave);
    return () => {
      window.removeEventListener('pagehide', flushSave);
      flushSave();
    };
  }, [activeNote?.id, saveNoteField]);

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

  return (
    <UniversalEditorShell
      topBar={<NotesToolbar editor={editor} />}
      titleText={activeNote.title || 'Sense Títol'}
      heroImage={activeNote.heroImage}
      logoImage={activeNote.logoImage}
      isPublished={activeNote.isPublished}
      formattedTime={activeNote.formattedTime}
      formattedDate={activeNote.formattedDate}
      titleHtml={currentNoteRef.current.title}
      subtitleHtml={currentNoteRef.current.subtitle}
      leadHtml={currentNoteRef.current.lead}
      onSaveField={(field, value) => saveNoteField(activeNote.id, field, value)}
      onLocalChange={(field, value) => setLocalNoteField(activeNote.id, field, value)}
      labels={etiquetesDeNota(activeNote, noteFolders, {})}
    >
      <div className="editor-scroll-area">
        <EditorContent editor={editor} />
      </div>
    </UniversalEditorShell>
  );
}

```

## FITXER: src/sections/profile/DetallAjust.jsx
```jsx
import { useEffect, useState } from 'react';
import { logout } from '../../data/backendPort.js';
import { useNavigate } from '../../app/contexts/RouterContext';
import { compressImage } from '../../utils/imageUtils.js';
import UniversalToolbar from '../../components/universal/UniversalToolbar';
import UniversalEditorShell from '../../components/universal/UniversalEditorShell';
import { FileText } from 'lucide-react';

export default function DetallAjust({ ajust, identitat, guardarAjust }) {
  const navigate = useNavigate();

  const [valorTemp, setValorTemp] = useState('');
  const [desant, setDesant] = useState(false);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    setValorTemp(ajust?.valor || '');
    setMissatge(null);
  }, [ajust?.id, identitat?.id]);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await compressImage(file, { maxSize: 600, format: 'image/webp' });
      setValorTemp(dataUrl);
    } catch (error) {
      setMissatge({ tipus: 'error', text: 'S\'ha produït un error processant la imatge.' });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ajust) return;
    
    setDesant(true);
    setMissatge(null);
    try {
      await guardarAjust(ajust.id, valorTemp);
      setMissatge({ tipus: 'exit', text: 'Desat correctament.' });
      
      setTimeout(() => setMissatge(null), 3000);
    } catch (error) {
      setMissatge({ tipus: 'error', text: error.message || 'Error en desar.' });
    } finally {
      setDesant(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  function renderitzaFormulari() {
    if (!ajust.obert) {
      return (
        <p className="perfil-detall-buit">
          {ajust.motiu || 'Aquest ajust no es pot modificar.'}
        </p>
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

    const esMultilinia = ajust.id === 'descripcio' || ajust.id === 'biografia';
    const esContrasenya = ajust.id === 'contrasenya';
    const esAvatar = ajust.id === 'avatar';

    return (
      <form onSubmit={handleSubmit} className="form-trellat">
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor={`ajust-${ajust.id}`}>
            Nou valor per a {ajust.titol.toLowerCase()}:
          </label>
          
          {esAvatar ? (
            <div className="sdp-alerta__accions">
              {valorTemp && (
                <div className="sdp-avatar sdp-avatar--xl">
                  <img 
                    src={valorTemp} 
                    alt="Previsualització" 
                    className="sdp-avatar__imatge" 
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id={`ajust-${ajust.id}`}
                className="sdp-control"
                onChange={handleFileChange}
              />
            </div>
          ) : esMultilinia ? (
            <textarea
              id={`ajust-${ajust.id}`}
              className="sdp-control sdp-control--area"
              rows="5"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
            />
          ) : (
            <input
              type={esContrasenya ? 'password' : 'text'}
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              placeholder={esContrasenya ? 'Introdueix nova contrasenya...' : ''}
            />
          )}

          {missatge && (
            <p className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'}>
              {missatge.text}
            </p>
          )}

          <div className="sdp-alerta__accions">
            <button type="submit" className="sdp-boto sdp-boto--primari" disabled={desant}>
              {desant ? 'Desant...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (!identitat) {
    return (
      <UniversalEditorShell
        titleText="El Meu Perfil"
        heroImage="/assets/system/ui/login-fons.jpg"
        logoImage="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"
        titleHtml="Benvingut al teu perfil"
        subtitleHtml="L'ànima de la IAIA"
        leadHtml="Registra't per a tindre la teua pròpia veu, crear targetes i personalitzar el teu entorn."
        isPublished={true}
      >
        <div className="perfil-detall-buit">
          Crea el teu compte o inicia sessió per a començar.
        </div>
      </UniversalEditorShell>
    );
  }

  const dades = identitat.dades || {};
  const isPersona = identitat.mena === 'persona';

  return (
    <UniversalEditorShell
      topBar={
        <UniversalToolbar 
          onPublish={() => alert("El perfil es desarà automàticament")} 
          isPublished={dades.is_public} 
          publishDisabled={false} 
        />
      }
      titleText={identitat.nom || 'Sense nom'}
      heroImage={dades.hero_image}
      logoImage={dades.avatar_url || dades.logo_url}
      isPublished={dades.is_public}
      titleHtml={identitat.nom || ''}
      subtitleHtml={isPersona ? '' : (dades.lema || '')}
      leadHtml={isPersona ? '' : (dades.description || '')}
      onSaveField={(field, value) => {
        if (field === 'title') guardarAjust(isPersona ? 'nom' : 'nom', value);
        if (field === 'subtitle' && !isPersona) guardarAjust('lema', value);
        if (field === 'lead' && !isPersona) guardarAjust('descripcio', value);
        if (field === 'logoImage') guardarAjust('avatar', value);
        if (field === 'heroImage') guardarAjust('hero_image', value);
      }}
      labels={[{ id: 'tipus', etiqueta: identitat.mena, color: 'gris' }]}
    >
      <div className="perfil-detall">
        {ajust ? (
          renderitzaFormulari()
        ) : (
          <p className="perfil-detall-buit">
            Estàs modificant la teua fitxa de perfil. Pots editar els camps a la capçalera (títol, subtítol, text inicial, i imatges) directament. O bé, selecciona un ajust a l'esquerra (com Contrasenya o Privacitat) per a modificar-lo aquí.
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

export default function useHeroImageHandler({ onSaveField, fieldName = 'heroImage', maxSizeBytes = 512 * 1024 }) {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Només imatges, de moment.');
      return;
    }
    if (file.size > maxSizeBytes) {
      alert(`La imatge passa de ${Math.round(maxSizeBytes / 1024)} KB. Redueix-la abans.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onSaveField?.(fieldName, String(reader.result));
      setIsEditing(false);
    };
    reader.onerror = () => alert("No s'ha pogut llegir el fitxer.");
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    if (!window.confirm('Esborrar definitivament la imatge?')) return;
    onSaveField?.(fieldName, '');
    setIsEditing(false);
  };

  const cancelEdit = () => setIsEditing(false);
  const startEdit = () => setIsEditing(true);

  return {
    isEditing,
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
import { resolveAsset } from '../../config/assetResolver';

import { useNavigate, Link } from '../../app/contexts/RouterContext';

import { useEffect, useState, useRef } from 'react';

import { showToast } from './AvisadorEfimer';

import { useContent } from './ContentProvider';

import {

  BackIcon, ForwardIcon, IndexIcon,
  CommentIcon, ShareIcon, PinIcon,
  IconButton, ActionControl, DateTimeControl
} from './UniversalElements';

import { isSafeUrl, isValidDate, DEFAULT_AUTHOR, PAGE_CHROME_MODES } from './UniversalUtils';





export function TableOfContentsDrawer({ isOpen, onClose }) {
  const [headings, setHeadings] = useState([]);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const rootNode = rootRef.current ? rootRef.current.getRootNode() : document;
    const domHeadings = rootNode.querySelectorAll('.page-title h1, .page-title h2, .content-wrapper h1, .content-wrapper h2, .content-wrapper h3, .content-wrapper h4, .sp-card-body h1, .sp-card-body h2, .sp-card-body h3, .sp-card-body h4');
    
    const parsedHeadings = Array.from(domHeadings).map((el, idx) => {
      // Ignoremos els visualment amagats
      if (el.classList.contains('sr-only') || el.textContent.trim() === '') return null;
      
      // Sense filtre de números per suportar targetes i pantalles sense numeració
      
      if (!el.id) {
        el.id = `toc-heading-${idx}`;
      }
      return {
        id: el.id,
        text: el.innerText || el.textContent,
        level: parseInt(el.tagName.substring(1), 10),
        element: el
      };
    }).filter(Boolean);

    setHeadings(parsedHeadings);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="toc-overlay" onClick={onClose} ref={rootRef}>
      <aside className="toc-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="toc-header">
          <h2>Taula de continguts</h2>
          <button className="toc-close-btn" onClick={onClose} aria-label="Tancar taula">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav className="toc-nav">
          {headings.length === 0 ? (
            <p className="toc-empty">No s'han trobat seccions.</p>
          ) : (
            <ul>
              {headings.map((h, idx) => (
                <li key={idx} className={`toc-item toc-level-${h.level}`}>
                  <button 
                    onClick={() => {
                      h.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      onClose();
                    }}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </div>
  );
}


export function UniversalPage(props) {
  const contentContext = useContent();
  const config = contentContext?.config || {};

  const title = props.title ?? config.title;
  const subtitle = props.subtitle ?? config.subtitle;
  const lead = props.lead ?? config.lead;
  const labels = props.labels ?? config.labels ?? [];
  const copyright = props.copyright ?? config.copyright;
  const showLogos = props.showLogos ?? config.showLogos ?? false;
  const tone = props.tone ?? config.tone;
  const variant = props.variant ?? config.variant;
  const chrome = props.chrome ?? config.chrome ?? 'page';
  const hideHeader = props.hideHeader ?? config.hideHeader ?? false;
  const showTopBars = props.showTopBars ?? config.showTopBars;
  const topBarData = props.topBarData ?? config.topBarData ?? {};
  const heroImage = props.heroImage ?? config.heroImage;
  const heroAlt = props.heroAlt ?? config.heroAlt ?? '';
  const authorName = props.authorName ?? config.authorName ?? DEFAULT_AUTHOR.name;
  const authorLocation = props.authorLocation ?? config.authorLocation ?? DEFAULT_AUTHOR.location;
  const authorAvatar = props.authorAvatar ?? config.authorAvatar ?? DEFAULT_AUTHOR.avatarUrl;
  const authorAvatarAlt = props.authorAvatarAlt ?? config.authorAvatarAlt ?? '';
  const time = props.time ?? config.time;
  const date = props.date ?? config.date;
  const dateTime = props.dateTime ?? config.dateTime;
  const onBack = props.onBack ?? config.onBack;
  const onForward = props.onForward ?? config.onForward;
  const onIndex = props.onIndex ?? config.onIndex;
  const onComment = props.onComment ?? config.onComment;
  const onShare = props.onShare ?? config.onShare;
  const onConnect = props.onConnect ?? config.onConnect;
  const onPin = props.onPin ?? config.onPin;
  const onDateTime = props.onDateTime ?? config.onDateTime;
  const connectLabel = props.connectLabel ?? config.connectLabel ?? 'Connectar';
  const price = props.price ?? config.price;
  const noPadding = props.noPadding ?? config.noPadding ?? false;
  const layout = props.layout ?? config.layout ?? 'page';
  const children = props.children;

  const [isTocOpen, setIsTocOpen] = useState(false);
  const navigate = useNavigate();
  
  const actualTitleText = props.titleText || config.titleText || (typeof title === 'string' ? title : '');
  const handleConnect = onConnect || (() => navigate('/connectar?item_id=' + encodeURIComponent(actualTitleText || 'page')));
  
  const handleBack = onBack || (() => navigate(-1));
  const handleForward = onForward || (() => navigate(1));
  const handleIndex = onIndex || (() => setIsTocOpen(true));

  const handleComment = onComment || (() => navigate('/xat'));
  const handleShare = onShare || (() => {
    const safeHref = isSafeUrl(window.location.href) ? window.location.href : window.location.origin;
    if (navigator.share) {
      navigator.share({ title: title || document.title, url: safeHref }).catch(console.error);
    } else {
      navigator.clipboard.writeText(safeHref);
      showToast('Enllaç copiat al porta-retalls');
    }
  });
  
  const barAuthorName = topBarData.authorName ?? authorName;
  const barAuthorLocation = topBarData.authorLocation ?? authorLocation;
  const barAuthorAvatar = topBarData.authorAvatar ?? authorAvatar;
  const barTime = topBarData.time ?? time;
  const barDate = topBarData.date ?? date;
  const barDateTime = topBarData.dateTime ?? dateTime;
  const barHeroImage = topBarData.heroImage ?? heroImage;
  const barHeroAlt = topBarData.heroAlt ?? heroAlt;

  const handleDateTime = onDateTime || ((e) => {
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

  const requestedChrome = showTopBars ? 'full' : chrome;
  const resolvedChrome = PAGE_CHROME_MODES.has(requestedChrome) ? requestedChrome : 'page';
  const showBlueBar = resolvedChrome === 'full' || resolvedChrome === 'context' || resolvedChrome === 'system';
  const showOrangeBar = resolvedChrome === 'full' || resolvedChrome === 'context';
  const showPageHeader = resolvedChrome !== 'none' && !hideHeader;
  const hasHeader = Boolean(showPageHeader && (showLogos || title || labels.length || copyright));



  return (
    <>
      <div className={`sdp-universal-page-container sdp-universal-page-container--${layout}`}>
      {showBlueBar && (
          <header className={`bar-blue ${variant === 'embed' ? 'bar-blue--embed' : ''} ${resolvedChrome === 'context' ? 'bar-blue--top' : ''}`.trim()}>
            <div className="bar-blue-left">
              <IconButton label="Tornar arrere" onClick={handleBack} presentation>
                <BackIcon className="icon" />
              </IconButton>
              <IconButton label="Tornar endavant" onClick={handleForward} presentation>
                <ForwardIcon className="icon" />
              </IconButton>
              <IconButton label="Índex de secció" onClick={handleIndex} presentation>
                <IndexIcon className="icon" />
              </IconButton>
            </div>
            <div className="sp-card-actions">

              <IconButton
                label="Comentar (Xat Privat)"
                onClick={handleComment}
                presentation
              >
                <CommentIcon className="icon" />
              </IconButton>
              <IconButton label="Compartir" onClick={handleShare} presentation>
                <ShareIcon className="icon" />
              </IconButton>
            </div>
            <ActionControl
              className="btn-connectar sp-card-connect"
              label={connectLabel}
              onClick={handleConnect}
            >
              {connectLabel}
            </ActionControl>
          </header>
      )}

      {topBarData?.heroComponent ? (
        <div className="hero-image">
          {topBarData.heroComponent}
        </div>
      ) : barHeroImage ? (
        <div className="hero-image">
          <img alt={barHeroAlt} src={resolveAsset(barHeroImage)} />
        </div>
      ) : null}

      {showOrangeBar && (
        <section className={`bar-orange ${variant === 'embed' ? 'bar-orange--embed' : ''} ${resolvedChrome === 'context' ? 'bar-orange--top' : ''}`.trim()} aria-label="Autoria i data">
              <div className="sp-card-author">
                <img
                  className="sp-card-avatar"
                  src={resolveAsset(barAuthorAvatar)}
                  alt={authorAvatarAlt}
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
                {topBarData?.barActions ? topBarData.barActions : (
                  <>
                    {topBarData?.showPin !== false && (
                      <ActionControl
                        className="btn-icon-orange"
                        label="Ancorar"
                        onClick={onPin}
                      >
                        <PinIcon className="icon" />
                      </ActionControl>
                    )}
                    <DateTimeControl
                      time={barTime}
                      date={barDate}
                      dateTime={barDateTime}
                      onClick={handleDateTime}
                    />
                  </>
                )}
              </div>
            </section>
          )}

      {hasHeader && (
        <header
          className={['page-title', tone && `is-${tone}`].filter(Boolean).join(' ')}
        >
          {topBarData?.logoComponent ? (
            <div className="page-title">
              {topBarData.logoComponent}
            </div>
          ) : (showLogos || chrome === 'system') ? (
            <>
              <img
                alt="Logotip Sóc de Poble"
                className="page-title-logo light-only"
                src={resolveAsset("/assets/system/ui/logo-socdepoble-rect-negre.svg")}
              />
              <img
                alt="Logotip Sóc de Poble"
                className="page-title-logo dark-only"
                src={resolveAsset("/assets/system/ui/logo-socdepoble-rect-blanc.svg")}
              />
            </>
          ) : null}
          {title && (
            <h1>
              {title}
              {price && <span className="sp-card-price sp-card-price--en-linia">{price}</span>}
            </h1>
          )}
          {labels.length > 0 && (
            <ul className="sp-card-labels page-title-labels" aria-label="Categories">
              {labels.map((label, index) => {
                const text = typeof label === 'string' ? label : label.text;
                const className = typeof label === 'string' ? 'sdp-badge-tag' : label.className || 'sdp-badge-tag';
                const href = typeof label === 'string' ? null : label.href;
                const safeHref = href && isSafeUrl(href) ? href : null;
                return (
                  <li
                    key={`${text}-${index}`}
                    className={['sp-card-label', className].filter(Boolean).join(' ')}
                  >
                    {label.onClick ? (
                      <button type="button" className="sp-card-label__action" onClick={label.onClick}>
                        {text}
                      </button>
                    ) : safeHref ? (
                      safeHref.startsWith('http') ? (
                        <a href={safeHref} target="_blank" rel="noopener noreferrer" className="sp-card-label">{text}</a>
                      ) : (
                        <Link to={safeHref} className="sp-card-label">{text}</Link>
                      )
                    ) : (
                      text
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {copyright && (
            <p className="sp-card-copyright page-title-copyright">{copyright}</p>
          )}
        </header>
      )}

      <article className={`content-wrapper${noPadding ? ' content-wrapper--sense-marge' : ''}`}>
        {(subtitle || lead) && (
          <div className="page-intro">
            {subtitle && <h2>{subtitle}</h2>}
            {lead && <p className="lead">{lead}</p>}
          </div>
        )}
        {children}
      </article>
      </div>

      <TableOfContentsDrawer isOpen={isTocOpen} onClose={() => setIsTocOpen(false)} />
    </>
  );}

```

## FITXER: src/sections/notes/NotesContext.jsx
```jsx
import { createContext, useContext, useState, useMemo, useCallback, useRef } from 'react';
import { updateNote } from '../../data/backendPort';
import { showToast } from '../../components/universal/AvisadorEfimer.jsx';
import { sanitizeHtml, netejaText, esFontImatgeSegura } from '../../utils/sanitize.js';
import { useUIState } from '../../app/contexts/UIContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNotesData } from './NotesDataContext';
import { useMur } from '../mur/MurContext';

const CAMPS_HTML = new Set(['title', 'subtitle', 'lead', 'content']);

function netejaCamp(field, value) {
  if (CAMPS_HTML.has(field)) return sanitizeHtml(value);
  if (field === 'heroImage') return esFontImatgeSegura(value) ? String(value).trim() : '';
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
      const stored = sessionStorage.getItem('sdp_notes_drafts');
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
      try { sessionStorage.setItem('sdp_notes_drafts', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const notes = useMemo(() => {
    return rawNotes.map((rawNote) => {
      const overrides = localNoteOverrides[rawNote.id] || {};
      const note = { ...rawNote, ...overrides };
      const plainText = String(note.content || '').replace(/<[^>]*>/g, ' ').trim();
      return {
        ...note,
        plainText,
        coverImage: note.heroImage || undefined,
        searchText: normalizeSearchText(`${note.title} ${plainText}`),
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
        try { sessionStorage.setItem('sdp_notes_drafts', JSON.stringify(next)); } catch { /* ignore */ }
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

