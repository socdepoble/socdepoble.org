import { useEffect, useState } from 'react';


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

  let text = String(missatge);
  if (typeof missatge === 'object' && missatge !== null) {
    if (missatge.message) text = missatge.message;
    else if (missatge.error_description) text = missatge.error_description;
    else if (missatge.msg) text = missatge.msg;
    else if (typeof missatge.error === 'string') text = missatge.error;
    else {
      try { text = JSON.stringify(missatge); } catch { /* ignore */ }
    }
  }

  return (
    <div 
      className={`sdp-avisador-efimer ${tipus ? `sdp-avisador--${tipus}` : ''}`}
      role="alert" 
      aria-live="assertive"
    >
      {text}
    </div>
  );
}

