/* Peces internes de la Consola (sense classes noves fora de sdp-consola__*).
   Les comparteixen els panells de ConsolaSection i el Mapa. */
import { createContext, useContext } from 'react';

/* Mode privacitat (l'interruptor d'Emowe): amaga rutes, ordres i empremtes
   per a gravar o compartir pantalla sense repassar-la abans. Tot el que la
   Consola pinta amb <Mono> passa per ací; hui res no està marcat com a privat. */
export const PrivacitatConsola = createContext(false);

export function Xifra({ etiqueta, valor }) {
  return (
    <div className="sdp-consola__xifra">
      <span className="sdp-consola__xifra-valor">{valor}</span>
      <span className="sdp-consola__xifra-etiqueta">{etiqueta}</span>
    </div>
  );
}

export function Mono({ children }) {
  const privat = useContext(PrivacitatConsola);
  if (privat) {
    return (
      <code className="sdp-consola__mono">
        <span aria-hidden="true">••••••</span>
        <span className="sdp-nomes-lector">dada amagada pel mode privacitat</span>
      </code>
    );
  }
  return <code className="sdp-consola__mono">{children}</code>;
}
