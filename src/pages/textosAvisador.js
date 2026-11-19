/**
 * textosAvisador.js — els textos de la pàgina de l'Avisador (/page/avisador).
 *
 * GAUNTLET-CARBON-R18-05 (P1) · Abans, escrits en valencià dins del JSX,
 * sense diccionari. Ara, parells [clau, reserva en valencià] que la pàgina
 * tradueix amb el traductor opcional (useTraductorOpcional + tradueix); les
 * claus són als cinc diccionaris de src/config/idiomes/.
 *
 * La reserva és el text exacte d'abans (Llei del Píxel): en valencià, o sense
 * traductor, la pàgina es veu igual caràcter per caràcter.
 *
 * MISSATGE_AVISADOR (src/services/avisador.js) NO és ací: és el text que
 * s'envia de veres a les persones de confiança i no es traduïx.
 *
 * Onada R32.12 · T1 (ordre del Mestre, 261118 19:33) · Redisseny Pedra Seca:
 * l'antic paràgraf `limitacions` passa a la secció «Com funciona i límits de
 * seguretat» (<h3>) en quatre paràgrafs amb negretes d'escaneig (Llei 35).
 * Els textos rics només admeten dos marques, que pinta `textRic` (AvisadorPage.jsx)
 * sense interpretar cap HTML: `**…**` per a la negreta i `{nom}` per a un enllaç
 * que posa la pàgina (`{telefon112}` → tel:112, `{enllacXat}` → /xat i
 * `{enllacDispositius}` → /dispositius). Els cinc diccionaris porten els
 * mateixos marcadors (AvisadorPage.idiomes.test.jsx).
 */
const text = (clau, reserva) => Object.freeze([`page.avisador.${clau}`, reserva]);

export const TEXTOS_AVISADOR = Object.freeze({
  titol: text('titol', 'L’Avisador'),
  subtitol: text('subtitol', 'Batec de Vida'),
  intro: text('intro', 'L’Avisador envia un missatge veïnal al Xat quan passen les hores que has triat sense activitat en esta app. El comptador es pausa durant el descans nocturn.'),
  guiaTitol: text('guiaTitol', 'Com funciona i límits de seguretat'),
  guiaSessio: text('guiaSessio', 'Funciona amb la **sessió personal oberta**, mentre l’app pot executar-se i té **connexió** al Xat. Els ajustos es guarden **en este dispositiu** i en este navegador; a {enllacDispositius} veus el nom d’este dispositiu i les pestanyes de Sóc de Poble d’este navegador que s’hi anuncien.'),
  guiaArribada: text('guiaArribada', 'Mentre l’app està tancada o el dispositiu apagat, l’avís **no s’envia**. Si l’app està suspesa o el Xat no està disponible, l’avís pot arribar **tard o no arribar**. En tornar a obrir l’app, l’Avisador espera **uns minuts** abans d’avisar.'),
  guiaConfianca: text('guiaConfianca', 'Només pots triar persones amb qui ja tens una **conversa privada** al {enllacXat}. L’avís els arriba **des del teu compte**, com un missatge teu.'),
  guiaEmergencia: text('guiaEmergencia', 'Per a una emergència, **telefona al {telefon112}**. L’Avisador **no substituïx la teleassistència** mèdica homologada.'),
  enllacXat: text('enllacXat', 'Xat'),
  enllacDispositius: text('enllacDispositius', 'Dispositius'),
  descansMaxim: text('descansMaxim', 'El descans nocturn pot durar com a màxim 12 hores.'),
  errorDescans: text('errorDescans', 'Posa dues hores de descans diferents.'),
  errorPersones: text('errorPersones', 'Tria d’una a tres persones amb un xat privat disponible.'),
  errorNormes: text('errorNormes', 'Per a enviar avisos pel Xat, cal acceptar les normes de convivència.'),
  errorDesaDispositiu: text('errorDesaDispositiu', 'No s’han pogut desar els ajustos en este dispositiu.'),
  errorDesa: text('errorDesa', 'No s’han pogut desar els ajustos. Torna-ho a provar.'),
  errorDesactiva: text('errorDesactiva', 'No s’ha pogut desactivar l’Avisador en este dispositiu.'),
  copiaHorari: text('copiaHorari', 'Còpia de l’horari'),
  copiaExplicacio: text('copiaExplicacio', 'Guarda una **còpia de seguretat** de l’horari en un fitxer .json, o porta el mateix horari a **un altre dispositiu**. Les persones de confiança **no viatgen** amb la còpia: es trien en cada dispositiu.'),
  descarregaHorari: text('descarregaHorari', 'Descarrega l’horari'),
  importaHorari: text('importaHorari', 'Importa un horari (.json)'),
  horariCarregat: text('horariCarregat', 'Horari carregat al formulari. Revisa’l i desa els ajustos per aplicar-lo.'),
  errorCopiaHorari: text('errorCopiaHorari', 'No s’ha pogut llegir o descarregar l’horari.'),
  errorCanviConcurrent: text('errorCanviConcurrent', 'Els ajustos han canviat en una altra pestanya. Revisa els valors actuals.'),
  llegendaHorari: text('llegendaHorari', 'Horari de l’avís'),
  horesSenseActivitat: text('horesSenseActivitat', 'Hores sense activitat'),
  iniciDescans: text('iniciDescans', 'Inici del descans nocturn'),
  fiDescans: text('fiDescans', 'Fi del descans nocturn'),
  llegendaPersones: text('llegendaPersones', 'Persones de confiança'),
  comptadorPersones: text('comptadorPersones', '{seleccionades} de 3 seleccionades'),
  estatEnviat: text('estatEnviat', 'El Xat ha confirmat l’avís.'),
  estatFallit: text('estatFallit', 'Avís pendent de confirmació del Xat.'),
  triaPersones: text('triaPersones', 'Tria d’una a tres persones amb qui ja tens una conversa privada al Xat.'),
  rebran: text('rebran', 'Rebran este missatge:'),
  obriConversa: text('obriConversa', 'Obri una conversa al Xat'),
  obriConversaResta: text('obriConversaResta', 'i torna ací per a triar-la.'),
  contacteXat: text('contacteXat', 'Contacte del Xat'),
  contacteNoDisponible: text('contacteNoDisponible', 'Contacte que ara no està disponible'),
  llegit: text('llegit', 'He llegit que l’Avisador no substituïx el 112 ni la teleassistència'),
  guarda: text('guarda', 'Guarda els ajustos'),
  activa: text('activa', 'Activa l’Avisador'),
  desactiva: text('desactiva', 'Desactiva l’Avisador'),
  activat: text('activat', 'Activat en este dispositiu.'),
  desactivat: text('desactivat', 'Desactivat.'),
  confirmats: text('confirmats', 'El Xat ha confirmat {enviats} de {total} enviaments en este període.'),
  pendents: text('pendents', 'Hi ha avisos pendents de confirmació del Xat.'),
  comprovant: text('comprovant', 'Comprovant la sessió…'),
  entra: text('entra', 'Entra amb el teu compte'),
  entraResta: text('entraResta', 'per a configurar-lo.'),
  triaIdentitat: text('triaIdentitat', 'Tria la teua identitat personal per a configurar-lo.'),
});

/**
 * Omple els marcadors {nom} d'un text ja traduït. Un marcador sense valor es
 * queda tal qual. La substitució és una funció: un «$&» no s'interpreta.
 * @param {string} plantilla
 * @param {Record<string, unknown>} valors
 */
export function omple(plantilla, valors) {
  return String(plantilla).replace(/\{(\w+)\}/g, (tros, nom) => (
    Object.hasOwn(valors, nom) && valors[nom] != null ? String(valors[nom]) : tros
  ));
}
