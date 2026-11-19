import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { escoltaAvisosPush, instantaniaAvisosPush } from '../../config/avisosPushXat.js';
import { MODEL_BOTIGUES, fraseEstatLocalAvisos } from './botiguesSistemaModel.js';
import { textosBotiguesSistema } from './i18nBotiguesSistema.js';
import { VistaBotiguesSistema } from './VistaBotiguesSistema.jsx';

function useIdiomaBotigues() {
  try {
    return useUIStateOpcional()?.language || 'ca';
  } catch {
    return 'ca';
  }
}

export default function BotiguesSistema() {
  const idioma = useIdiomaBotigues();
  const tx = textosBotiguesSistema(idioma);
  const inst = useSyncExternalStore(escoltaAvisosPush, instantaniaAvisosPush, instantaniaAvisosPush);
  const [copiant, setCopiant] = useState(false);
  const [avis, setAvis] = useState(null);
  const viu = useRef(false);
  const ocupat = useRef(false);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);
  const copia = useCallback(async () => {
    if (ocupat.current) return;
    const clipboard = globalThis.navigator?.clipboard;
    if (typeof clipboard?.writeText !== 'function') { setAvis(tx.noPotCopiarAuto); return; }
    ocupat.current = true;
    setCopiant(true);
    setAvis(null);
    try {
      await clipboard.writeText(MODEL_BOTIGUES.play.optInUrl);
      if (viu.current) setAvis(tx.copiatExit);
    } catch {
      if (viu.current) setAvis(tx.noShaPogutCopiar);
    } finally {
      ocupat.current = false;
      if (viu.current) setCopiant(false);
    }
  }, [tx]);
  return <VistaBotiguesSistema model={MODEL_BOTIGUES} onCopia={copia} copiant={copiant} avis={avis} estatLocalAvisos={fraseEstatLocalAvisos(inst)} idioma={idioma} />;
}
