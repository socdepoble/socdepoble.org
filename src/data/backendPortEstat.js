/* P0-16 (consola del Mestre, 261103) · L'adaptador pertany al document, no a
   cada versió de backendPort.js. Com hostEstatIntern.js (P1-71 / T-06), este
   fitxer no importa res: l'edició d'un altre fitxer no li posa mai ?t=.
   backendPort.js sí que en rep: el seu import('../host.js') el fa importador
   d'host, i host importa tota la interfície (PedraSecaEmbed.jsx). Una edició
   de qualsevol component estampa el ?t= nou a backendPort.js i Fast Refresh
   n'importa una segona instància. Amb l'estat dins del port, eixa instància
   naixia sense backend mentre hostEstatIntern ja deia SEGELLAT: quanLlest()
   resolia a l'instant i el port llançava «no està implementat» (el Mur,
   CoreContent i Notes, fins a recarregar). Ara totes les instàncies llegixen i
   segellen el mateix adaptador. En producció, a l'app nativa i al paquet de
   WordPress és un mòdul més del mateix tros: el comportament no canvia, i
   vi.resetModules() el torna a crear buit com abans. No és cap API pública:
   només el toca backendPort.js. */
export const estatPort = {
  currentImpl: null,
  isLocked: false,
  dispose: null,
  lecturesEnVol: new Set()
};
