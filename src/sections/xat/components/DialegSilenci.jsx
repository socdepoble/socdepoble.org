/**
 * DialegSilenci.jsx — Per a quant de temps se silencia una conversa (B8C-5,
 * marató 261101_2143; ordre del Mestre: «Silenciar conversa (8 h, 1 setmana,
 * sempre) a la UI del fil»).
 *
 * Només organismes de Pedra Seca, zero CSS nou: DialegConfirmacio (títol,
 * descripció, focus, Escape i l'Arrere d'Android del Dialeg) amb un GrupOpcions
 * de ràdios. «8 hores» ve triat. «Silencia» crida onConfirma(durada) i porta
 * `carregant` mentre vola; «Cancel·la», l'Escape o el vel el tanquen sense res.
 * Fins que s'obri la primera vegada no pinta cap node: la conversa té el DOM de
 * sempre. Després es queda muntat (tancat), perquè el focus torne on era.
 */
import { useEffect, useState } from 'react';
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { GrupOpcions } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { DURADA_PER_DEFECTE, OPCIONS_SILENCI, TEXTOS_SILENCI } from '../silenciXat.js';

const tradueix = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);

export default function DialegSilenci({ obert = false, onTanca, onConfirma, carregant = false, t }) {
  const [durada, setDurada] = useState(DURADA_PER_DEFECTE);
  const [muntat, setMuntat] = useState(false);
  /* Cada obertura comença per la durada per defecte. */
  useEffect(() => {
    if (!obert) return;
    setMuntat(true);
    setDurada(DURADA_PER_DEFECTE);
  }, [obert]);

  if (!obert && !muntat) return null;
  const opcions = OPCIONS_SILENCI.map((opcio) => ({ valor: opcio.durada, etiqueta: tradueix(t, opcio.text) }));
  return (
    <DialegConfirmacio
      obert={obert}
      onTanca={() => onTanca?.()}
      onConfirma={() => { if (!carregant) onConfirma?.(durada); }}
      carregant={carregant}
      titol={tradueix(t, TEXTOS_SILENCI.titol)}
      descripcio={tradueix(t, TEXTOS_SILENCI.descripcio)}
      etiquetaConfirma={tradueix(t, TEXTOS_SILENCI.confirma)}
      etiquetaCancela={tradueix(t, TEXTOS_SILENCI.cancela)}
    >
      <GrupOpcions
        llegenda={tradueix(t, TEXTOS_SILENCI.durada)}
        opcions={opcions}
        valor={durada}
        onCanvi={setDurada}
        disabled={carregant}
      />
    </DialegConfirmacio>
  );
}
