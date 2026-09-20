import { ArrowLeft, List, Heading2, Heading3, Bold, Italic, Strikethrough, MoreHorizontal } from 'lucide-react';
import { useContext, useState, useRef, useEffect, forwardRef } from 'react';
import { AppGridContext } from '../layout/AppGridShell';

const iconProps = { size: 20, strokeWidth: 2, 'aria-hidden': true, focusable: false };

export function useCompactControls() {
  const [compact, setCompact] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 500);
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
  formatState = {},
  formatActions = {},
  t = (key, fallback) => fallback
}) {
  const gridCtx = useContext(AppGridContext);
  const { ref: containerRef, compact } = useCompactControls();
  
  const handleBack = onBack || (() => gridCtx?.setPanellObert('middle'));

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
        
        <div className="sdp-editor-tools__group" role="group" aria-label="Format del text">
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

        <div className="sdp-editor-tools__group" style={{ marginLeft: 'auto', borderRight: 0, paddingRight: 0 }}>
          {onPublish && (
            <BlocAction 
              label={t('section.notes.publish', 'Publicar')}
              disabled={publishDisabled}
              onClick={onPublish}
            >
              <MoreHorizontal {...iconProps} />
            </BlocAction>
          )}
        </div>
      </div>
    </div>
  );
}
