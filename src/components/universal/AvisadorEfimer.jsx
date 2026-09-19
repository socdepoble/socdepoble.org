import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

export function AvisadorEfimer({ missatge, tipus, durada = 3000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, durada);
    return () => clearTimeout(timer);
  }, [durada, onClose]);

  if (!visible) return null;

  return (
    <div 
      className={`sdp-avisador-efimer ${tipus ? `sdp-avisador--${tipus}` : ''}`}
      role="alert" 
      aria-live="assertive"
    >
      {missatge}
    </div>
  );
}

let sharedRoot = null;
let sharedContainer = null;

export function showToast(missatge, tipus, durada = 3000) {
  if (typeof tipus === 'number') {
    durada = tipus;
    tipus = 'default';
  }
  if (typeof document === 'undefined') return;
  
  // Neteja qualsevol timer pendent de destrucció
  if (sharedContainer && sharedContainer.__destroyTimer) {
    clearTimeout(sharedContainer.__destroyTimer);
    sharedContainer.__destroyTimer = null;
  }
  
  if (!sharedContainer || !sharedContainer.isConnected) {
    let target = document.querySelector('soc-de-poble') || document.querySelector('.sdp-root') || document.getElementById('socdepoble-app') || document.body;

    
    if (sharedRoot) {
      try { sharedRoot.unmount(); } catch (e) { /* ignore */ }
      sharedRoot = null;
    }
    if (sharedContainer && sharedContainer.parentNode) {
      sharedContainer.parentNode.removeChild(sharedContainer);
    }
    
    sharedContainer = document.createElement('div');
    target.appendChild(sharedContainer);
    sharedRoot = createRoot(sharedContainer);
    
    renderToast();
    return;
  }
  
  renderToast();
  
  function renderToast() {
    if (!sharedRoot) return;
    sharedRoot.render(
      <AvisadorEfimer 
        missatge={missatge} 
        tipus={tipus}
        durada={durada} 
        onClose={() => {
          if (sharedContainer) {
            sharedContainer.__destroyTimer = setTimeout(() => {
              if (sharedRoot) {
                try { sharedRoot.render(null); } catch (e) { /* ignore */ }
              }
            }, 300);
          }
        }}
      />
    );
  }
}

export function destroyToastSystem() {
  if (sharedContainer && sharedContainer.__destroyTimer) {
    clearTimeout(sharedContainer.__destroyTimer);
    sharedContainer.__destroyTimer = null;
  }
  if (sharedRoot) {
    try { sharedRoot.unmount(); } catch (e) { /* ignore */ }
    sharedRoot = null;
  }
  if (sharedContainer && sharedContainer.parentNode) {
    sharedContainer.parentNode.removeChild(sharedContainer);
  }
  sharedContainer = null;
}
