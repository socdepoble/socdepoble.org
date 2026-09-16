/**
 * Accordion.jsx
 * Trasllat literal des d'UniversalElements.jsx (260910). Cap canvi de comportament.
 */
import { useState } from 'react';

export function Accordion({ children, className = '' }) {
  return <div className={`accordion ${className}`}>{children}</div>;
}

export function AccordionItem({ title, children, defaultOpen = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`accordion-item ${className}`}>
      <button 
        type="button"
        className={`accordion-header ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <svg
          className={`accordion-item__fletxa${isOpen ? ' accordion-item__fletxa--obert' : ''}`}
          fill="none" height="20" stroke="currentColor" strokeLinecap="round"
          strokeLinejoin="round" strokeWidth="2" viewBox="0 0 20 20" width="20"
          aria-hidden="true" focusable="false"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div className="accordion-item__cos">
          {children}
        </div>
      )}
    </div>
  );
}
