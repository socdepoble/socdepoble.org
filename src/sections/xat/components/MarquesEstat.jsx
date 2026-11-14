/** Marques amb text accessible: pendent, enviat al servidor, lliurat als
 * altres segons el seu rebut explícit, llegit o error.
 * R24 · xat_entrega (P2-9) · Textos honestos: ✓ «Enviat al servidor», ✓✓ gris
 * «Ha arribat a l'aplicació» (el rebut d'entrega de l'altra aplicació, mai una
 * lectura) i ✓✓ blau «Llegit». Si el servidor no informa de l'entrega
 * (`rebutsConeguts` fals), el ✓ no diu «encara no ha arribat»: diu que no se sap. */
import { AlertTriangle, Check, CheckCheck, Clock } from 'lucide-react';

const MARQUES = {
  pendent: { Icona: Clock, clau: 'section.xat.estat.pendent', alternativa: 'Pendent' },
  enviat: { Icona: Check, clau: 'section.xat.estat.enviat', alternativa: 'Enviat al servidor' },
  lliurat: { Icona: CheckCheck, clau: 'section.xat.estat.lliurat', alternativa: 'Ha arribat a l’aplicació' },
  llegit: { Icona: CheckCheck, clau: 'section.xat.estat.llegit', alternativa: 'Llegit' },
  error: { Icona: AlertTriangle, clau: 'section.xat.estat.error', alternativa: 'No enviat' }
};
const ENVIAT_SENSE_REBUTS = { clau: 'section.xat.estat.enviatSenseRebuts', alternativa: 'Enviat al servidor (este servidor no informa de l’entrega)' };

export default function MarquesEstat({ estat = 'enviat', rebutsConeguts = true, t }) {
  const clau = estat in MARQUES ? estat : 'enviat';
  const { Icona } = MARQUES[clau];
  const text = clau === 'enviat' && rebutsConeguts === false ? ENVIAT_SENSE_REBUTS : MARQUES[clau];
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
      <span className="sdp-nomes-lector">{t(text.clau, text.alternativa)}</span>
    </span>
  );
}
