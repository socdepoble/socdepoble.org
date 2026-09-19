import { useState, useEffect } from 'react';
import { resolveAsset as resolveAssetSync } from '../config/assetResolver.js';
import { resolveAsset as resolveAssetAsync, teCapacitat } from '../data/backendPort.js';

/**
 * Hook per a resoldre referències opaques (sdp-media://) a URLs vàlides.
 * Funciona de manera asíncrona per als recursos que necessiten signatures (com el bucket mitjans_privats).
 * 
 * @param {string} assetRef Referència de l'actiu (ex. sdp-media://..., /assets/...)
 * @returns {string} L'URL resolta i llesta per a posar-se a l'atribut `src`.
 */
export function useResolvedAsset(assetRef) {
  const [resolvedUrl, setResolvedUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    if (!assetRef) {
      setResolvedUrl('');
      return;
    }

    if (assetRef.startsWith('sdp-media://')) {
      if (!teCapacitat('mitjans')) {
        setResolvedUrl(''); // No hi ha backend de mitjans
        return;
      }
      // Resolució asíncrona a través del contracte
      resolveAssetAsync(assetRef)
        .then(url => {
          if (isMounted) setResolvedUrl(url);
        })
        .catch(err => {
          console.error("Error resolent asset:", assetRef, err);
          if (isMounted) setResolvedUrl('');
        });
    } else {
      // Resolució síncrona per als assets locals, http, etc.
      setResolvedUrl(resolveAssetSync(assetRef));
    }

    return () => {
      isMounted = false;
    };
  }, [assetRef]);

  return resolvedUrl;
}
