import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AvisadorEfimer } from './AvisadorEfimer.jsx';

const NotificationContext = createContext({
  showToast: (missatge) => {
    console.warn('[NotificationContext] showToast called outside of NotificationProvider:', missatge);
  }
});

export function NotificationProvider({ children, targetNode }) {
  const [toast, setToast] = useState(null);
  const destroyTimer = useRef(null);
  const toastCounter = useRef(0);

  const showToast = useCallback((missatge, tipus, durada = 3000) => {
    if (typeof tipus === 'number') { durada = tipus; tipus = 'default'; }
    if (destroyTimer.current) { clearTimeout(destroyTimer.current); destroyTimer.current = null; }
    
    toastCounter.current += 1;
    setToast({ missatge, tipus, durada, id: toastCounter.current });
  }, []);

  const closeToast = useCallback(() => {
    destroyTimer.current = setTimeout(() => setToast(null), 300);
  }, []);

  useEffect(() => {
    return () => {
      if (destroyTimer.current) {
        clearTimeout(destroyTimer.current);
        destroyTimer.current = null;
      }
    };
  }, []);

  const portalTarget = targetNode || (typeof document !== 'undefined' ? document.body : null);

  /* Auditoria 261007 (B) · Un valor estable: `{ showToast }` en línia era un
     objecte nou a cada setToast (en mostrar un avís i en tancar-lo) i tornava a
     pintar tots els consumidors de useToast (cada targeta, AppShell i, per
     ell, el TopBar). showToast ja és estable, i el valor també ho és. */
  const valor = useMemo(() => ({ showToast }), [showToast]);

  return (
    <NotificationContext.Provider value={valor}>
      {children}
      {toast && portalTarget && createPortal(
        <div className="sdp-toast-container">
          <AvisadorEfimer 
            key={toast.id}
            missatge={toast.missatge}
            tipus={toast.tipus}
            durada={toast.durada}
            onClose={closeToast}
          />
        </div>,
        portalTarget
      )}
    </NotificationContext.Provider>
  );
}

export function useToast() {
  return useContext(NotificationContext);
}
