import { useEffect, useLayoutEffect, useRef } from 'react';
import { useModeracio } from '../PedraSeca/hooks/moderacioDePoble.js';
import { enviaMissatge } from '../../data/backendPort.js';
import { useXat } from '../../sections/xat/XatContext.jsx';
import { esDirecteDeConfianca } from '../../services/avisador.js';
import { creaEnviamentAvisador } from '../../services/avisadorEnviament.js';
import { ambBloqueigPreferenciesAvisador, desaAvisador, escoltaAvisador, llegixAvisador } from '../../services/avisadorPreferencies.js';

// En obrir l'app o en tornar-hi, els temporitzadors han pogut estar aturats
// mentre el dispositiu dormia. La persona que torna demostra que està bé:
// li deixem uns minuts per a tocar la pantalla abans de cap avís.
const GRACIA_MS = 5 * 60_000;

export default function AvisadorEnSessio({ clau, config, targetNode }) {
  const xat = useXat();
  const moderacio = useModeracio();
  const context = useRef(null);
  const operacio = useRef(null);
  useLayoutEffect(() => {
    context.current = { xat, moderacio };
  }, [xat, moderacio]);

  useEffect(() => {
    let viu = true;
    let graciaFins = Date.now() + GRACIA_MS;
    const arrel = targetNode ?? document;
    const monitor = creaEnviamentAvisador({
      llegix: () => llegixAvisador(clau),
      desa: (estat) => desaAvisador(clau, estat),
      transaccio: (fn) => ambBloqueigPreferenciesAvisador(clau, fn),
      potEnviar({ filId, personaId }) {
        if (Date.now() < graciaFins) return false;
        const { xat: vigent, moderacio: normes } = context.current;
        if (!viu || navigator.onLine === false || vigent.avisadorClau !== clau || vigent.status !== 'ready'
          || !vigent.llistaFresca || normes?.normesPendents
          || (normes?.potBloquejar && normes.estatBloquejos !== 'llest')
          || normes?.esPersonaBloquejada?.(personaId)) return false;
        return vigent.chatThreads.some((fil) => fil.id === filId && esDirecteDeConfianca(fil, vigent.joId)
          && fil.altres[0].id === personaId);
      },
      envia: (persona, text, signal) => enviaMissatge(persona.filId, { id: persona.idMissatge, text }, {
        ...config, signal, senseSafata: true
      })
    });
    const tick = () => {
      if (navigator.locks?.request) {
        // Un únic intent entre pestanyes. El mateix id de missatge manté
        // la idempotència quan l'entorn no implementa Web Locks.
        void navigator.locks.request(clau, { ifAvailable: true }, (lock) => viu && lock && monitor.avalua())
          .catch(() => {});
      } else {
        void monitor.avalua().catch(() => {});
      }
    };
    operacio.current = tick;
    const activitat = (event) => {
      if (event.isTrusted && !event.repeat) monitor.activitat();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') graciaFins = Date.now() + GRACIA_MS;
      tick();
    };
    const cancel = () => monitor.cancella();
    const deixa = escoltaAvisador(clau, monitor.comprova);
    arrel.addEventListener('pointerdown', activitat, true);
    arrel.addEventListener('keydown', activitat, true);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', tick);
    window.addEventListener('offline', cancel);
    const interval = window.setInterval(tick, 60_000);
    tick();
    return () => {
      viu = false;
      cancel();
      deixa();
      window.clearInterval(interval);
      arrel.removeEventListener('pointerdown', activitat, true);
      arrel.removeEventListener('keydown', activitat, true);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('online', tick);
      window.removeEventListener('offline', cancel);
      operacio.current = null;
    };
  }, [clau, config, targetNode, xat.scopeKey]);

  useEffect(() => {
    operacio.current?.();
  }, [xat.status, xat.llistaFresca, moderacio?.normesPendents]);
  return null;
}
