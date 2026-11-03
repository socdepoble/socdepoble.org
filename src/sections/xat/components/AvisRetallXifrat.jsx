/**
 * AvisRetallXifrat.jsx — L'avís i la confirmació abans de guardar al Bloc de Notes
 * missatges d'una conversa xifrada d'extrem a extrem (P1-12, decisió D-18 a;
 * disseny E2EE §10: «Retall a Notes: avís i confirmació»; O4-CLAUDE-3,
 * D3-xat-iaia-e2ee-03).
 *
 * El retall es construïx amb el text ja desxifrat en este aparell i la nota es
 * guarda al servidor de Notes sense xifratge d'extrem a extrem: abans d'enviar-la,
 * la persona ho ha de saber i ho ha de confirmar. Només peces de Pedra Seca
 * (DialegConfirmacio: títol, descripció, focus, Escape i l'Arrere d'Android del
 * Dialeg) i zero CSS nou. «Guardar» crida onConfirma() i porta `carregant` mentre
 * vola; «Cancel·lar», l'Escape o el vel el tanquen sense res.
 *
 * Conversa.jsx el carrega amb lazy plegat per la bandera E2EE: apagada, no entra al
 * paquet. Hi queda muntat (tancat) després de la primera obertura, perquè el focus
 * torne on era.
 */
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';

const T_RESERVA = (_clau, reserva) => reserva;

/** Els textos [clau, reserva] de l'avís (reserves idèntiques a config/idiomes/ca.js). */
export const TEXTOS_RETALL_XIFRAT = Object.freeze({
  titol: Object.freeze(['section.xat.seleccio.enviaBloc', 'Enviar al Bloc de Notes']),
  avis: Object.freeze(['section.xat.xifratge.retall.avis', 'La nota es guardarà al servidor sense xifratge d’extrem a extrem.']),
  guarda: Object.freeze(['section.xat.xifratge.retall.guarda', 'Guardar']),
  cancela: Object.freeze(['common.cancela', 'Cancel·lar'])
});

export default function AvisRetallXifrat({ obert = false, onTanca = null, onConfirma = null, carregant = false, t = T_RESERVA }) {
  const tr = ([clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);
  return (
    <DialegConfirmacio
      obert={obert}
      onTanca={() => { if (!carregant) onTanca?.(); }}
      onConfirma={() => { if (!carregant) onConfirma?.(); }}
      carregant={carregant}
      titol={tr(TEXTOS_RETALL_XIFRAT.titol)}
      descripcio={tr(TEXTOS_RETALL_XIFRAT.avis)}
      etiquetaConfirma={tr(TEXTOS_RETALL_XIFRAT.guarda)}
      etiquetaCancela={tr(TEXTOS_RETALL_XIFRAT.cancela)}
    />
  );
}
