import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { escoltaAvisosPush, instantaniaAvisosPush } from '../../config/avisosPushXat.js';
import { MODEL_BOTIGUES, fraseEstatLocalAvisos } from './botiguesSistemaModel.js';
import { VistaBotiguesSistema } from './VistaBotiguesSistema.jsx';

export default function BotiguesSistema() {
  const inst = useSyncExternalStore(escoltaAvisosPush, instantaniaAvisosPush, instantaniaAvisosPush);
  const [copiant, setCopiant] = useState(false);
  const [avis, setAvis] = useState(null);
  const viu = useRef(false);
  const ocupat = useRef(false);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);
  const copia = useCallback(async () => {
    if (ocupat.current) return;
    const clipboard = globalThis.navigator?.clipboard;
    if (typeof clipboard?.writeText !== 'function') { setAvis('No es pot copiar automàticament. Obri l’enllaç i copia’l des del navegador.'); return; }
    ocupat.current = true;
    setCopiant(true);
    setAvis(null);
    try {
      await clipboard.writeText(MODEL_BOTIGUES.play.optInUrl);
      if (viu.current) setAvis('Enllaç de proves copiat. Pots compartir-lo des de la teua aplicació de missatgeria.');
    } catch {
      if (viu.current) setAvis('No s’ha pogut copiar. Obri l’enllaç i copia’l des del navegador.');
    } finally {
      ocupat.current = false;
      if (viu.current) setCopiant(false);
    }
  }, []);
  return <VistaBotiguesSistema model={MODEL_BOTIGUES} onCopia={copia} copiant={copiant} avis={avis} estatLocalAvisos={fraseEstatLocalAvisos(inst)} />;
}
