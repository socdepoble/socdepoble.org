import { useEffect } from 'react';

/**
 * Hook que escolta l'esdeveniment global 'sdp:refresh-data'
 * i crida la funció de recàrrega que se li passe.
 */
export function useRecarregaExterna(onRefresh) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleRefresh = () => {
      onRefresh();
    };
    
    window.addEventListener('sdp:refresh-data', handleRefresh);
    return () => {
      window.removeEventListener('sdp:refresh-data', handleRefresh);
    };
  }, [onRefresh]);
}
