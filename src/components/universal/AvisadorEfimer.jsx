import React, { useEffect, useState } from 'react';


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

