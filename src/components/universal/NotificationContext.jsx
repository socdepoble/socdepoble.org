import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AvisadorEfimer } from './AvisadorEfimer.jsx';

const NotificationContext = createContext({
  showToast: (missatge, tipus, durada) => {
    console.warn('[NotificationContext] showToast called outside of NotificationProvider:', missatge);
  }
});

export function NotificationProvider({ children, targetNode }) {
  const [toast, setToast] = useState(null);
  const destroyTimer = useRef(null);

  const showToast = useCallback((missatge, tipus, durada = 3000) => {
    if (typeof tipus === 'number') { durada = tipus; tipus = 'default'; }
    if (destroyTimer.current) { clearTimeout(destroyTimer.current); destroyTimer.current = null; }
    
    setToast({ missatge, tipus, durada, id: Date.now() });
  }, []);

  const closeToast = useCallback(() => {
    destroyTimer.current = setTimeout(() => setToast(null), 300);
  }, []);

  const portalTarget = targetNode || (typeof document !== 'undefined' ? document.body : null);

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      {toast && portalTarget && createPortal(
        <div className="sdp-toast-container" style={{ position: 'relative', zIndex: 9999 }}>
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
