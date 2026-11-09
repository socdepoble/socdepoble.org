/** Marques amb text accessible: pendent, enviat al servidor, lliurat als
 * altres segons el seu rebut explícit, llegit o error. */
import { AlertTriangle, Check, CheckCheck, Clock } from 'lucide-react';

const MARQUES = {
  pendent: { Icona: Clock, clau: 'section.xat.estat.pendent', alternativa: 'Pendent' },
  enviat: { Icona: Check, clau: 'section.xat.estat.enviat', alternativa: 'Enviat' },
  lliurat: { Icona: CheckCheck, clau: 'section.xat.estat.lliurat', alternativa: 'Lliurat' },
  llegit: { Icona: CheckCheck, clau: 'section.xat.estat.llegit', alternativa: 'Llegit' },
  error: { Icona: AlertTriangle, clau: 'section.xat.estat.error', alternativa: 'No enviat' }
};

export default function MarquesEstat({ estat = 'enviat', t }) {
  const clau = estat in MARQUES ? estat : 'enviat';
  const { Icona } = MARQUES[clau];
  /* Classes escrites senceres perquè el vocabulari canònic les puga comprovar. */
  const classe = clau === 'llegit'
    ? 'sdp-xat-marques--llegit'
    : clau === 'error'
      ? 'sdp-xat-marques--error'
      : clau === 'pendent'
        ? 'sdp-xat-marques--pendent'
        : clau === 'lliurat' ? 'sdp-xat-marques--lliurat' : 'sdp-xat-marques--enviat';
  return (
    <span className={`sdp-xat-marques ${classe}`}>
      <Icona size={16} aria-hidden="true" focusable="false" />
      <span className="sdp-nomes-lector">{t(MARQUES[clau].clau, MARQUES[clau].alternativa)}</span>
    </span>
  );
}
