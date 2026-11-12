/** Test-only forensic inverse. Never import into product code. */
import { CANVIS_IAIA_R54 } from './legalR54IAIA.js';
export const CANVIS_PUSH_R54 = Object.freeze([
  [
    "    <p><em><strong>Versió 2.5</strong> · <strong>En vigor</strong> des del <strong>6 de novembre de 2026</strong>. <strong>Substitueix</strong> <strong>qualsevol versió anterior</strong> <strong>d'aquest text</strong>.</em></p>",
    "    <p><em><strong>Versió 2.6</strong> · <strong>En vigor</strong> des del <strong>8 de novembre de 2026</strong>. <strong>Substitueix</strong> <strong>qualsevol versió anterior</strong> <strong>d'aquest text</strong>.</em></p>"
  ],
  [
    "      <li><strong>Avisos push del xat:</strong> només si els encens tu, amb el botó «🔔 Activar notificacions del xat» o amb l'interruptor «Avisos en este dispositiu» dels ajustos del xat («Tu: ajustos» → «Notificacions»), i després de donar-hi permís al navegador. De cada aparell on els encens guardem, lligada al teu compte, l'adreça que li dona el servei de push del navegador (un enllaç <em>https</em>), el tipus d'aparell, la llengua de l'avís, quan es va desar, quan caduca i l'última vegada que es va renovar. No guardem les claus de xifratge de la subscripció. Quan algú escriu en una conversa, una cua interna n'apunta la conversa, el missatge i qui l'ha escrit i, si n'hi ha, l'organització en nom de la qual escriu i el missatge al qual respon, per a saber quins aparells dels altres membres cal despertar. L'avís és cec: només diu «Tens missatges nous», mai qui t'escriu ni què et diu, i en tocar-lo és l'aplicació, amb la teua sessió, la que tria la conversa. A l'aplicació per al mòbil encara no hi ha avisos push: quan n'hi haja, guardarem el testimoni del dispositiu en lloc de l'adreça i ho direm en una versió nova d'aquest text.</li>",
    "      <li><strong>Avisos push del xat:</strong> només si els encens tu, amb el botó «🔔 Activar notificacions del xat» o amb l'interruptor «Avisos en este dispositiu» dels ajustos del xat («Tu: ajustos» → «Notificacions»), i després de donar-hi permís al navegador. De cada aparell on els encens guardem, lligada al teu compte, l'adreça que li dona el servei de push del navegador (un enllaç <em>https</em>), el tipus d'aparell, la llengua de l'avís, quan es va desar, quan caduca i l'última vegada que es va renovar. No guardem les claus de xifratge de la subscripció. Quan algú escriu en una conversa, una cua interna n'apunta la conversa, el missatge i qui l'ha escrit i, si n'hi ha, l'organització en nom de la qual escriu i el missatge al qual respon, per a saber quins aparells dels altres membres cal despertar. L'avís és cec: només diu «Tens missatges nous», mai qui t'escriu ni què et diu, i en tocar-lo és l'aplicació, amb la teua sessió, la que tria la conversa. A l'aplicació per al mòbil, els avisos també necessiten que els encengues tu, el permís del sistema i un servidor preparat per a enviar-los. Guardem el testimoni del dispositiu en lloc de l'adreça del navegador. Al dispositiu només conservem una marca de la teua tria vinculada al teu compte, sense cap testimoni ni missatge; s'esborra quan els apagues o tanques la sessió. La icona pot indicar que hi ha missatges pendents: només l'aplicació, amb la sessió oberta, calcula el recompte exacte.</li>"
  ],
  [
    "    <p><strong>Els avisos push del xat</strong> passen pel <strong>servei de push del teu navegador</strong>, que no triem nosaltres: <strong>Google</strong> (Firebase Cloud Messaging, FCM, el de Chrome), <strong>Apple</strong> (Apple Push Notification service, APNs, el de Safari), <strong>Mozilla</strong> (el de Firefox) o <strong>Microsoft</strong> (el de Windows). Només acceptem adreces d'aquests quatre. El teu navegador hi parla amb la teua adreça IP, com amb qualsevol web que envie avisos. Quan algú t'escriu, el servidor els envia l'adreça del teu aparell i un avís <strong>sense cap contingut</strong>, que el servei guarda com a molt un dia si l'aparell no està connectat: mai qui t'escriu ni què et diu. Quan l'aplicació per al mòbil els porte, passaran per <strong>APNs d'Apple</strong> o per <strong>FCM de Google</strong>, segons el telèfon, amb el testimoni del dispositiu i el text «Tens missatges nous» en la seua llengua.</p>",
    "    <p><strong>Els avisos push del xat</strong> passen pel <strong>servei de push del teu navegador</strong>, que no triem nosaltres: <strong>Google</strong> (Firebase Cloud Messaging, FCM, el de Chrome), <strong>Apple</strong> (Apple Push Notification service, APNs, el de Safari), <strong>Mozilla</strong> (el de Firefox) o <strong>Microsoft</strong> (el de Windows). Només acceptem adreces d'aquests quatre. El teu navegador hi parla amb la teua adreça IP, com amb qualsevol web que envie avisos. Quan algú t'escriu, el servidor els envia l'adreça del teu aparell i un avís <strong>sense cap contingut</strong>, que el servei guarda com a molt un dia si l'aparell no està connectat: mai qui t'escriu ni què et diu. A l'aplicació per al mòbil passen per <strong>APNs d'Apple</strong> o per <strong>FCM de Google</strong>, segons el telèfon, amb el testimoni del dispositiu i el text «Tens missatges nous» en la seua llengua.</p>"
  ],
  [
    "    <p><strong>Si encens els avisos push del xat</strong> (apartat 8), <strong>la subscripció</strong> no la guardem nosaltres en cap d'aquests llocs: la crea i la <strong>guarda el teu navegador</strong> amb el seu servei de push, a petició teua, i <strong>la desfem</strong> quan els apagues o tanques la sessió.</p>",
    "    <p><strong>Si encens els avisos push del xat</strong> (apartat 8), <strong>la subscripció</strong> no la guardem nosaltres en cap d'aquests llocs: la crea i la <strong>guarda el teu navegador</strong> amb el seu servei de push, a petició teua, i <strong>la desfem</strong> quan els apagues o tanques la sessió. A l'aplicació mòbil conservem només la marca d'opt-in del compte per a recuperar la teua tria en reobrir-la; mai el testimoni del dispositiu ni el contingut de les converses.</p>"
  ]
]);
/* D1 Opció A (decisió del Mestre, 261112) · El Mur i el Mercat del poble són
   públics: la 2.6 ho diu a l'apartat 4 (el permís per a mostrar el que hi
   publiques a qualsevol persona, també sense compte) i a l'apartat 13 (qui
   ho pot llegir). No hi diu què no ix a la versió pública: eixes garanties
   depenen del kit SQL de Codex (revocació de la fila crua a anon i RPC
   public.llig_mur_public). Llista blanca ampliada en R21: l'aprova el Mestre. */
export const CANVIS_MUR_PUBLIC_R21 = Object.freeze([
  [
    "    <p><strong>El contingut que publiques tu</strong> <strong>continua sent teu</strong>. <strong>En publicar-lo dins de l'aplicació</strong>, ens dones <strong>permís per a mostrar-lo</strong> <strong>als altres membres del teu poble</strong> <strong>segons la visibilitat que hages triat</strong>, i <strong>només per a això</strong>.</p>",
    "    <p><strong>El contingut que publiques tu</strong> <strong>continua sent teu</strong>. <strong>En publicar-lo dins de l'aplicació</strong>, ens dones <strong>permís per a mostrar-lo</strong> <strong>als altres membres del teu poble</strong> <strong>segons la visibilitat que hages triat</strong> i, <strong>si el publiques al Mur o al Mercat</strong>, <strong>a qualsevol persona</strong>, <strong>també sense compte</strong> (apartat 13), i <strong>només per a això</strong>.</p>"
  ],
  [
    "      <li>El que publiques al <strong>Mur</strong> o al <strong>Mercat</strong> és visible segons la visibilitat que hages triat en publicar-ho.</li>",
    "      <li>El que publiques al <strong>Mur</strong> o al <strong>Mercat</strong> és visible segons la visibilitat que hages triat en publicar-ho. <strong>El Mur i el Mercat del poble són públics</strong>: <strong>qualsevol persona</strong>, <strong>també sense compte</strong>, pot llegir el que hi publiques.</li>"
  ]
]);
export function legal26A25(html) {
  let text = html;
  for (const [before, after] of [...CANVIS_IAIA_R54, ...CANVIS_PUSH_R54, ...CANVIS_MUR_PUBLIC_R21].reverse()) {
    if (text.split(after).length !== 2) throw new Error('R54 forensic inverse requires one exact authorized paragraph');
    text = text.replace(after, before);
  }
  return text;
}
