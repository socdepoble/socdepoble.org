import { ArrowLeft, List, Globe, Heading2, Bold, Italic, Strikethrough } from 'lucide-react';
import { useContext } from 'react';
import { AppGridContext } from '../layout/AppGridShell';

const iconProps = { size: 20, strokeWidth: 2, 'aria-hidden': true, focusable: false };

export default function UniversalToolbar({
  onBack,
  onPublish,
  publishDisabled = false,
  formatState = {},
  formatActions = {},
  t = (key, fallback) => fallback
}) {
  const gridCtx = useContext(AppGridContext);
  
  // Try to use the passed onBack, or fallback to closing the mobile panel (if inside a grid)
  const handleBack = onBack || (() => gridCtx?.setPanellObert('middle'));

  const { isHeading, isList, isBold, isItalic, isStrike } = formatState;
  const { toggleHeading, toggleList, toggleBold, toggleItalic, toggleStrike } = formatActions;

  return (
    <div className="editor-toolbar" role="group" aria-label="Format i accions de la pàgina">
      <button 
        type="button" 
        aria-label="Tornar a la llista" 
        title="Tornar a la llista"
        onClick={handleBack} 
        className="btn-icon d-mobile-only"
      >
        <ArrowLeft {...iconProps} />
      </button>
      
      <div className="toolbar-actions" role="group" aria-label="Format del text">
        <button 
          aria-label="Alternar encapçalament"
          onClick={toggleHeading} 
          className={`btn-icon ${isHeading ? 'active-text' : ''}`}
          disabled={!toggleHeading}
        >
          <Heading2 {...iconProps} />
        </button>
        <button 
          aria-label={t('section.notes.format.list', 'Llista')}
          onClick={toggleList} 
          className={`btn-icon ${isList ? 'active-text' : ''}`}
          disabled={!toggleList}
        >
          <List {...iconProps} />
        </button>
        <button 
          aria-label={t('section.notes.format.bold', 'Negreta')}
          onClick={toggleBold} 
          className={`btn-icon ${isBold ? 'active-text' : ''}`}
          disabled={!toggleBold}
        >
          <Bold {...iconProps} />
        </button>
        <button 
          aria-label={t('section.notes.format.italic', 'Cursiva')}
          onClick={toggleItalic} 
          className={`btn-icon ${isItalic ? 'active-text' : ''}`}
          disabled={!toggleItalic}
        >
          <Italic {...iconProps} />
        </button>
        <button 
          aria-label={t('section.notes.format.strike', 'Ratllat')}
          onClick={toggleStrike} 
          className={`btn-icon ${isStrike ? 'active-text' : ''}`}
          disabled={!toggleStrike}
        >
          <Strikethrough {...iconProps} />
        </button>
      </div>

      <div className="toolbar-actions right">
        {onPublish && (
          <button 
            type="button"
            className="sdp-boto sdp-boto--primari" 
            disabled={publishDisabled} 
            onClick={onPublish}
            aria-label={t('section.notes.publish', 'Publicar article')}
          >
            {t('section.notes.publish', 'Publicar')}
          </button>
        )}
      </div>
    </div>
  );
}
