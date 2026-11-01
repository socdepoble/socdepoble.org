/**
 * BlocPersonesConfianca.jsx — El bloc «Persones de confiança» de Privacitat i
 * dades (IDEA-48, estat previ a F7; pla 261101_1246, T7 · S6).
 *
 * Contenidor: llig del servei del xifratge del xat quants contactes té la
 * persona amb el número de seguretat verificat en este aparell
 * (contactesVerificats) i ho pinta amb CosPersonesConfianca dins del Bloc del
 * Perfil. Sense servei (bandera E2EE apagada, backend local o encara no
 * instal·lat), no pinta res. Si la recuperació ja està activa ho diu el contracte
 * (teCapacitat('recuperacioSocial'), avui sempre fals: el grup no és a
 * CAPACITATS; l'afigen T1 i el kit amb F7). DetallPrivacitat.jsx el carrega amb lazy plegat per
 * la bandera: apagada, no entra al paquet.
 */
import { useEffect, useState } from 'react';
import { getBackendImplementation, teCapacitat } from '../../data/backendPort.js';
import { serveiXifratXat } from '../../data/xifratXat.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import CosPersonesConfianca from './CosPersonesConfianca.jsx';
import { TEXTOS_CONFIANCA } from './personesConfianca.js';

export default function BlocPersonesConfianca() {
  const t = useTraductorOpcional();
  const servei = E2EE_ACTIU_PER_DEFECTE ? serveiXifratXat(getBackendImplementation()) : null;
  const teRecuperacio = servei ? teCapacitat('recuperacioSocial') === true : false;
  const [lectura, setLectura] = useState({ verificats: null, error: false });

  useEffect(() => {
    if (!servei || typeof servei.contactesVerificats !== 'function') return undefined;
    let viu = true;
    servei.contactesVerificats().then(
      /* Un recompte que no és un enter no negatiu és una lectura fallida, mai un zero inventat. */
      (n) => { if (viu) setLectura(Number.isSafeInteger(n) && n >= 0 ? { verificats: n, error: false } : { verificats: null, error: true }); },
      () => { if (viu) setLectura({ verificats: null, error: true }); }
    );
    return () => { viu = false; };
  }, [servei]);

  if (!servei) return null;
  return (
    <Bloc titol={tradueix(t, TEXTOS_CONFIANCA.titol)}>
      <CosPersonesConfianca verificats={lectura.verificats} error={lectura.error} teRecuperacio={teRecuperacio} />
    </Bloc>
  );
}
