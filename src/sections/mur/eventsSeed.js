// Dades de calendari recuperades de la versió original.
export const CALENDAR_EVENTS = [{
  date: '2023-01-29',
  time: '10:00',
  title: '2n Aplec pel Territori',
  type: 'event',
  id: 'aplec-2023',
  subtitle: "Nou Aplec, arrel de l'incendi d'aquest estiu",
  entradilla: "La Coordinadora d'Estudis Eòlics i l'Associació El Rentonar amb el Projecte Sóc de Poble hem organitzat a Benillup un nou Aplec pel Territori com a resposta a l'incendi que va assolar les nostres comarques en agost del 2022.",
  image_url: '/assets/events/aplec_2023_cartell.jpg',
  author_name: 'Sóc de Poble',
  /* T6 (261004) · Qui el signa, per identificador: l'entitat pilot
     (identitatsSeed.js · ENTITAT_PILOT_ID, com la samarreta de marketSeed.js).
     La boina porta al projecte per l'id, mai pel nom.
     Declarat (verificació del front «autoria», 261004): l'Aplec és de
     l'entitat, i això té dos efectes buscats, els mateixos que la samarreta.
       · En llavor, qui actua com a «Sóc de Poble» el veu al seu MAS, a la
         carpeta «Esdeveniments» (NotesSection → masDeLUsuari.pertanyALActor).
         La persona pilot i el convidat, no: no és seu.
       · Connectar l'acte porta targetUserId=socdepoble&autorTipus=entitat
         (objecteConnectable.rutaConnectarObjecte): es connecta amb l'entitat.
     eventsSeed.test.js ho fixa. */
  author_entity_id: 'socdepoble',
  author_location: 'La Torre de les Maçanes',
  author_avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png'
}];
