import { ArrowLeft, List, Heading2, Heading3, Bold, Italic, Strikethrough } from 'lucide-react';
import { useContext, useState, useRef, useEffect, useId, forwardRef } from 'react';
import { AppGridContext } from '../layout/AppGridShell';
import { PUNTS_DE_TALL } from '../layout/graella.js';

const iconProps = { size: 20, strokeWidth: 2, 'aria-hidden': true, focusable: false };

/* T7 (P2) · El tall de la barra d'eines ve de la font única de la graella. */
export function useCompactControls() {
  const [compact, setCompact] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < PUNTS_DE_TALL.eines);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return { ref, compact };
}

const BlocIcon = forwardRef(function BlocIcon({ icon: Icon, active, label, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className="sdp-bloc-icon"
      aria-pressed={active}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon {...iconProps} />
    </button>
  );
});

const BlocAction = forwardRef(function BlocAction({ label, active, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className="sdp-bloc-action"
      aria-pressed={active}
      {...props}
    >
      {children}
      <span className="sdp-bloc-action__label">{label}</span>
    </button>
  );
});

export default function UniversalToolbar({
  onBack,
  onPublish,
  publishDisabled = false,
  /* T5 · una nota connectada no es publica: es compartix. L'etiqueta la
     decidix l'adaptador del document; sense ella, «Publicar» com sempre. */
  publishLabel = null,
  /* T41 (ordre del Mestre, 260928) · Quan PUBLICAR obri una finestra (el
     selector de visibilitat), el botó ho diu: aria-haspopup. La barra continua
     muda: només rep dades. */
  publishPopup = null,
  onDelete,
  deleteDisabled = false,
  formatState = {},
  formatActions = {},
  t = (key, fallback) => fallback
}) {
  const gridCtx = useContext(AppGridContext);
  const { ref: containerRef, compact } = useCompactControls();
  const [formatOpen, setFormatOpen] = useState(false);
  const formatId = useId();
  const toggleRef = useRef(null);
  useEffect(() => {
    if (!formatOpen) return;
    const root = containerRef.current.getRootNode();
    const outside = (event, fromWindow = false) => {
      const path = event.composedPath();
      // Window cannot see inside a closed shadow root; handle those events there.
      if (fromWindow && root.host && path.includes(root.host)) return;
      if (!path.includes(containerRef.current)) setFormatOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') { setFormatOpen(false); toggleRef.current?.focus(); }
    };
    const outsideWindow = event => outside(event, true);
    window.addEventListener('pointerdown', outsideWindow);
    root.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', escape);
    return () => { root.removeEventListener('pointerdown', outside); window.removeEventListener('pointerdown', outsideWindow); window.removeEventListener('keydown', escape); };
  }, [formatOpen, containerRef]);
  
  /* MD (261003) · La mateixa tornada que la fletxa blava quan la closca
     l'oferix (mestre-detall en estret); si no, la d'abans. */
  const handleBack = onBack || gridCtx?.tornaDelDetall || (() => gridCtx?.setPanellObert('middle'));

  const { isHeading, isSubheading, isList, isBold, isItalic, isStrike } = formatState;
  const { toggleHeading, toggleSubheading, toggleList, toggleBold, toggleItalic, toggleStrike } = formatActions;

  return (
    <div 
      ref={containerRef}
      className="sdp-editor-tools" 
      data-compact={compact}
      role="group" 
      aria-label="Eines de l'editor"
    >
      <div className="sdp-editor-tools__formats">
        <button 
          type="button" 
          aria-label="Tornar a la llista" 
          title="Tornar a la llista"
          onClick={handleBack} 
          className="sdp-bloc-icon d-mobile-only"
        >
          <ArrowLeft {...iconProps} />
        </button>
        
        {compact && <button ref={toggleRef} type="button" className="sdp-bloc-icon"
          aria-label="Format del text" aria-expanded={formatOpen} aria-controls={formatId}
          onClick={() => setFormatOpen(value => !value)}>Aa</button>}
        <div id={formatId} className="sdp-editor-tools__group sdp-editor-tools__format-options"
          hidden={compact && !formatOpen} role="group" aria-label="Opcions de format del text">
          <BlocIcon 
            icon={Heading2} 
            active={isHeading} 
            label="Alternar títol" 
            onClick={toggleHeading} 
            disabled={!toggleHeading} 
          />
          <BlocIcon 
            icon={Heading3} 
            active={isSubheading} 
            label="Alternar subtítol" 
            onClick={toggleSubheading} 
            disabled={!toggleSubheading} 
          />
          <BlocIcon 
            icon={Bold} 
            active={isBold} 
            label={t('section.notes.format.bold', 'Negreta')} 
            onClick={toggleBold} 
            disabled={!toggleBold} 
          />
          <BlocIcon 
            icon={Italic} 
            active={isItalic} 
            label={t('section.notes.format.italic', 'Cursiva')} 
            onClick={toggleItalic} 
            disabled={!toggleItalic} 
          />
          <BlocIcon 
            icon={Strikethrough} 
            active={isStrike} 
            label={t('section.notes.format.strike', 'Ratllat')} 
            onClick={toggleStrike} 
            disabled={!toggleStrike} 
          />
          <BlocIcon 
            icon={List} 
            active={isList} 
            label={t('section.notes.format.list', 'Llista')} 
            onClick={toggleList} 
            disabled={!toggleList} 
          />
        </div>

        <div className="sdp-editor-tools__group sdp-editor-tools__group--publicacio">
          {onDelete && (
            <BlocAction
              label={t('section.notes.delete', 'Borrar')}
              disabled={deleteDisabled}
              onClick={onDelete}
              className="sdp-bloc-action sdp-bloc-action--perill"
            />
          )}
          {onPublish && (
            <BlocAction
              label={publishLabel || t('section.notes.publish', 'Publicar')}
              disabled={publishDisabled}
              aria-haspopup={publishPopup || undefined}
              onClick={onPublish}
            />
          )}
        </div>
      </div>
    </div>
  );
}
