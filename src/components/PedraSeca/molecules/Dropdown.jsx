/**
 * Dropdown.jsx — Menú desplegable contextual de Pedra Seca.
 *
 * Onada R32.11 · Lot 06 (P0-24b + deute d'accessibilitat de teclat del catàleg):
 *   · Suport complet de teclat (Enter, Espai, ArrowDown, ArrowUp, Home, End).
 *   · S'elimina el tancament per temporitzador d'onBlur que tancava el menú en
 *     fer Tab cap als ítems; es tanca netament amb pointerdown fora (arrel local
 *     o document, compatible amb Shadow DOM <soc-de-poble>) o en triar una opció.
 *   · L'Escape des del disparador o des de qualsevol ítem intern tanca només la
 *     capa superior de la pila (useCapaEnrere), consumix l'esdeveniment perquè
 *     cap <Dialeg> pare es tanque alhora, i retorna el focus al disparador.
 *   · Quan `trigger` ja és un <button>, no nia un segon role="button" al voltant
 *     (WCAG 4.1.2 nested-interactive).
 */
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';
import { useCapaEnrere } from '../hooks/useCapaEnrere.js';

const DropdownInternalContext = createContext(null);
const FOCUSABLES_MENU = 'button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';
const PASSOS_FLETXA = Object.freeze({ ArrowDown: 1, ArrowUp: -1 });

export function Dropdown({ trigger, children, className = '', right = false, minWidth = '200px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const focusInicialRef = useRef(null);
  usePropietatsCss(menuRef, { '--sdp-desplegable-ample': isOpen ? minWidth : null });

  const enfocaItem = useCallback((index) => {
    const items = Array.from(menuRef.current?.querySelectorAll(FOCUSABLES_MENU) || []);
    if (!items.length) return;
    const pos = ((index % items.length) + items.length) % items.length;
    items[pos]?.focus();
  }, []);

  useEffect(() => {
    if (isOpen && focusInicialRef.current !== null) {
      const desti = focusInicialRef.current;
      focusInicialRef.current = null;
      enfocaItem(desti);
    }
  }, [isOpen, enfocaItem]);

  const tancaAmbFocus = useCallback(() => {
    const estavaDins = wrapperRef.current?.contains(
      (wrapperRef.current.getRootNode?.() || document).activeElement
    );
    setIsOpen(false);
    if (estavaDins) {
      triggerRef.current?.focus?.();
    }
  }, []);

  const teCapaDamunt = useCapaEnrere(isOpen, tancaAmbFocus);

  useEffect(() => {
    if (!isOpen) return undefined;
    const node = wrapperRef.current;
    const arrel = node?.getRootNode?.() || document;
    const onPointerDownFora = (event) => {
      if (!node || node.contains(event.target)) return;
      setIsOpen(false);
    };
    const onEscapeArrel = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || teCapaDamunt()) return;
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus?.();
    };
    arrel.addEventListener('pointerdown', onPointerDownFora);
    arrel.addEventListener('keydown', onEscapeArrel);
    return () => {
      arrel.removeEventListener('pointerdown', onPointerDownFora);
      arrel.removeEventListener('keydown', onEscapeArrel);
    };
  }, [isOpen, teCapaDamunt]);

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        focusInicialRef.current = 0;
        setIsOpen(true);
      } else {
        enfocaItem(0);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        focusInicialRef.current = -1;
        setIsOpen(true);
      } else {
        enfocaItem(-1);
      }
      return;
    }
    if (e.key === 'Escape' && isOpen && !e.defaultPrevented && !teCapaDamunt()) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus?.();
      return;
    }
    const esBotoNatiu = isValidElement(trigger) && trigger.type === 'button';
    if (!esBotoNatiu && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const handleMenuKeyDown = (e) => {
    if (e.key === 'Escape' && !e.defaultPrevented && !teCapaDamunt()) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus?.();
      return;
    }
    if (!(e.key in PASSOS_FLETXA) && e.key !== 'Home' && e.key !== 'End') return;
    const items = Array.from(menuRef.current?.querySelectorAll(FOCUSABLES_MENU) || []);
    if (!items.length) return;
    e.preventDefault();
    if (e.key === 'Home') {
      items[0].focus();
      return;
    }
    if (e.key === 'End') {
      items[items.length - 1].focus();
      return;
    }
    const actual = items.indexOf(e.target);
    const seguent = actual < 0 ? 0 : (actual + PASSOS_FLETXA[e.key] + items.length) % items.length;
    items[seguent].focus();
  };

  const tancaDespresDeTria = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus?.();
  }, []);

  const esBotoTrigger = isValidElement(trigger) && trigger.type === 'button';

  return (
    <DropdownInternalContext.Provider value={tancaDespresDeTria}>
      <div ref={wrapperRef} className={`sp-dropdown-wrapper ${className}`}>
        {esBotoTrigger ? (
          <div className="sp-dropdown-trigger">
            {cloneElement(trigger, {
              ref: triggerRef,
              'aria-haspopup': 'true',
              'aria-expanded': isOpen,
              onClick: (ev) => {
                trigger.props.onClick?.(ev);
                if (!ev.defaultPrevented) setIsOpen((prev) => !prev);
              },
              onKeyDown: (ev) => {
                trigger.props.onKeyDown?.(ev);
                if (!ev.defaultPrevented) handleTriggerKeyDown(ev);
              },
            })}
          </div>
        ) : (
          <div
            ref={triggerRef}
            className="sp-dropdown-trigger"
            role="button"
            tabIndex={0}
            aria-haspopup="true"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={handleTriggerKeyDown}
          >
            {trigger}
          </div>
        )}
        {isOpen && (
          <div
            ref={menuRef}
            className={`xat-header-dropdown ${right ? 'xat-header-dropdown--right' : 'xat-header-dropdown--left'}`}
            onKeyDown={handleMenuKeyDown}
          >
            {children}
          </div>
        )}
      </div>
    </DropdownInternalContext.Provider>
  );
}

export function DropdownItem({ children, onClick, className = '', icon }) {
  const tancaMenu = useContext(DropdownInternalContext);
  const handleClick = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      tancaMenu?.();
    }
  };
  return (
    <button
      type="button"
      className={`sdp-dropdown-item ${className}`}
      onClick={handleClick}
    >
      {icon && <span className="sdp-dropdown-item__icona">{icon}</span>}
      {children}
    </button>
  );
}
