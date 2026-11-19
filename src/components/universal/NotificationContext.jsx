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

  /* Onada R30 · A2-LLEI06 · L'avís va al node que declara l'entrada (targetNode: el #root de la SPA i
     de l'app nativa, l'arrel ombra tancada de <soc-de-poble>); les tres entrades de producció en passen
     sempre un, i ahí res no canvia. Sense node declarat (les proves, un proveïdor muntat a soles), l'avís
     es pinta al seu lloc dins de l'arbre de React en compte de penjar-se del <body> del document: la UI
     no toca el document amfitrió (LLEI_06). */
  const avis = toast ? (
    <div className="sdp-toast-container">
      <AvisadorEfimer
        key={toast.id}
        missatge={toast.missatge}
        durada={toast.durada}
        onClose={closeToast}
      />
    </div>
  ) : null;

  /* Auditoria 261007 (B) · Un valor estable: `{ showToast }` en línia era un
     objecte nou a cada setToast (en mostrar un avís i en tancar-lo) i tornava a
     pintar tots els consumidors de useToast (cada targeta, AppShell i, per
     ell, el TopBar). showToast ja és estable, i el valor també ho és. */
  const valor = useMemo(() => ({ showToast }), [showToast]);

  return (
    <NotificationContext.Provider value={valor}>
      {children}
      {avis && (targetNode ? createPortal(avis, targetNode) : avis)}
    </NotificationContext.Provider>
  );
}

export function useToast() {
  return useContext(NotificationContext);
}
