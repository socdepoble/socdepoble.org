/**
 * Dropdown.jsx
 * Trasllat literal des d'UniversalElements.jsx (260910). Cap canvi de comportament.
 */
import { useRef, useState } from 'react';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';

export function Dropdown({ trigger, children, className = '', right = false, minWidth = '200px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  usePropietatsCss(menuRef, { '--sdp-desplegable-ample': isOpen ? minWidth : null });
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };
  
  return (
    <div className={`sp-dropdown-wrapper ${className}`}>
      <div 
        className="sp-dropdown-trigger"
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)} 
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setTimeout(() => setIsOpen(false), 200);
          }
        }}
      >
        {trigger}
      </div>
      {isOpen && (
        <div 
          ref={menuRef}
          className={`xat-header-dropdown ${right ? 'xat-header-dropdown--right' : 'xat-header-dropdown--left'}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, className = '', icon }) {
  return (
    <button 
      type="button" 
      className={`sdp-dropdown-item ${className}`} 
      onClick={onClick} 
    >
      {icon && <span className="sdp-dropdown-item__icona">{icon}</span>}
      {children}
    </button>
  );
}
