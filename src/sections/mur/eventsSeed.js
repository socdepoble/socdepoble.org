// Dades de calendari recuperades de la versió original.
export const CALENDAR_EVENTS = [{
  date: '2023-01-29',
  time: '10:30',
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
  author_avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  portada_sencera: true
}];

export const CURSOS_PEDRA_EN_SEC_2026_EVENT = Object.freeze({
  id: 'cursos-pedra-en-sec-fageca-alcosser-2026',
  type: 'event',
  type_label: 'Curs teoricopràctic',
  inici: '2026-10-23',
  fi: '2026-11-15',
  created_at: '2026-09-18T11:32:23+00:00',
  publish_date: '2026-09-18T11:32:23+00:00',
  boinaDataPublicacio: true,
  ometEntradillaTargeta: true,
  date_label: '23, 24, 30 i 31 d’octubre (Fageca) · 6, 7 i 14 de novembre de 2026 (Alcosser)',
  calendar_badge: {
    dia: '23–14',
    mes: 'OCT–NOV',
    any: '2026',
    dateTime: '2026-10-23',
    label: 'Del 23 d’octubre al 14 de novembre de 2026'
  },
  title: 'Cursos de pedra en sec a Fageca i Alcosser',
  subtitle: 'Formació teoricopràctica gratuïta de marges i construcció tradicional a les comarques del Comtat i l’Alcoià',
  entradilla: 'L’Ajuntament de Muro i l’Estació Experimental Agrària de Llutxent (GVA) difonen dos tallers oficials d’aprenentatge de l’art de la pedra en sec impartits per Ivana Ponsoda Revert a Fageca (octubre) i Alcosser (6, 7 i 14 de novembre de 2026).',
  image_url: '/assets/events/cursos_pedra_en_sec_2026_poster.webp',
  og_image: '/assets/events/cartell_pedra_en_sec_alcosser_2026.webp',
  imageAlt: 'Cartell informatiu del curs de pedra en sec a Alcosser (6, 7 i 14 de novembre de 2026)',
  video_url: 'https://socdepoble.cat/media/cursos-pedra-en-sec-fageca-alcosser-2026.mp4',
  author_entity_id: 'rentonar',
  author_name: 'El Rentonar',
  author_location: 'La Torre de les Maçanes',
  author_avatar: '/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg',
  town_name: 'Muro d’Alcoi',
  copyright: 'Font original: Ajuntament de Muro (vilademuro.net) i Generalitat Valenciana · Redacció pròpia CC BY-NC-SA 4.0 El Rentonar / Sóc de Poble',
  labels: [
    { text: 'Agenda', className: 'sdp-badge-category sp-card-label--enllac', href: '/calendari?vista=mes&date=2026-10-23' },
    { text: 'Pedra en sec', className: 'sdp-badge-category' },
    { text: 'Formació agrària', className: 'sdp-badge-tag' }
  ],
  description: `
    <h3>L’art dels marges torna a escola a les nostres muntanyes</h3>
    <p>L’ofici de la <strong>pedra en sec</strong> —declarat Patrimoni Cultural Immaterial de la Humanitat per la UNESCO— continua ben viu a les comarques de la muntanya d’Alacant. A partir de la convocatòria difosa per l’<strong>Ajuntament de Muro</strong> i organitzada per la <strong>Conselleria d’Agricultura, Aigua, Ramaderia i Pesca de la Generalitat Valenciana</strong> (a través de l’<strong>Estació Experimental Agrària de Llutxent</strong>, amb Labora, el SEPE i la FVMP), aquesta tardor s’impartixen <strong>dos cursos gratuïts</strong> d’aprenentatge i reconstrucció de marges als pobles de <strong>Fageca</strong> i <strong>Alcosser</strong>, a càrrec de la professora <strong>Ivana Ponsoda Revert</strong>.</p>
    <p>Al vídeo superior podeu veure en directe el taller pràctic de selecció, falcat i assentament de la pedra en sec a Fageca: una arquitectura agrària neta, sense ciment ni morter, que drena l’aigua de pluja, frena l’erosió i inspira també el nostre propi sistema de disseny digital <strong>Pedra Seca</strong>.</p>

    <h3>1. Taller de pedra en sec a Fageca (16 hores · Octubre de 2026)</h3>
    <p>La primera tanda formativa ha tingut lloc a <strong>Fageca</strong> amb quatre jornades teoricopràctiques impartides per <strong>Ivana Ponsoda Revert</strong>:</p>
    <ul>
      <li><strong>Dates:</strong> divendres <strong>23</strong>, dissabte <strong>24</strong>, divendres <strong>30</strong> i dissabte <strong>31 d’octubre de 2026</strong>.</li>
      <li><strong>Horaris:</strong> divendres 23/10 i 30/10 de <strong>16:00 a 19:00 h</strong> · dissabtes 24/10 i 31/10 de <strong>08:30 a 13:30 h</strong>.</li>
      <li><strong>Organització local:</strong> amb la col·laboració de l’<strong>Ajuntament de Fageca</strong> i pràctiques de camp als marges del terme.</li>
    </ul>
    <figure>
      <img src="/assets/events/cartell_pedra_en_sec_fageca_2026.webp" alt="Cartell informatiu i programa del curs Introducció a la pedra en sec: l’art dels marges a Fageca (23, 24, 30 i 31 d’octubre)" width="1131" height="1600" loading="lazy" />
      <figcaption>Cartell oficial del taller de pedra en sec celebrat a Fageca (23, 24, 30 i 31 d’octubre de 2026).</figcaption>
    </figure>

    <h3>2. Taller de pedra en sec a Alcosser (16 hores · Novembre de 2026)</h3>
    <p>La segona tanda formativa se celebra aquest mes de novembre a <strong>Alcosser</strong>, també amb <strong>Ivana Ponsoda Revert</strong> com a professora del taller:</p>
    <ul>
      <li><strong>Dates:</strong> divendres <strong>6</strong>, dissabte <strong>7</strong> i dissabte <strong>14 de novembre de 2026</strong>.</li>
      <li><strong>Horaris:</strong> divendres 06/11 de <strong>15:00 a 19:00 h</strong> · dissabtes 07/11 i 14/11 de <strong>08:00 a 14:00 h</strong>.</li>
      <li><strong>Organització local:</strong> amb la col·laboració de l’<strong>Ajuntament d’Alcosser</strong> i reconstrucció pràctica sobre els bancals del municipi.</li>
    </ul>
    <figure>
      <img src="/assets/events/cartell_pedra_en_sec_alcosser_2026.webp" alt="Cartell informatiu i programa del curs Construcció amb pedra en sec: l’art dels marges a Alcosser (6, 7 i 14 de novembre)" width="1131" height="1600" loading="lazy" />
      <figcaption>Cartell oficial del taller de pedra en sec a Alcosser (6, 7 i 14 de novembre de 2026).</figcaption>
    </figure>

    <h3>Inscripcions gratuïtes i contacte (EEA Llutxent)</h3>
    <p>Les places són <strong>gratuïtes i limitades</strong>, i la inscripció es gestiona a través de l’<strong>Estació Experimental Agrària (EEA) de Llutxent</strong> i del Portal Agrari de la Generalitat Valenciana:</p>
    <ul>
      <li><strong> Informació i inscripcions (EEA Llutxent):</strong> telèfon <strong>962 249 991</strong> · correu electrònic <strong>esexag_llutxent@gva.es</strong></li>
      <li><strong>Portal Agrari GVA:</strong> <a href="https://portalagrari.gva.es/es/formacio-i-transferencia/proximos-cursos" target="_blank" rel="noopener noreferrer">portalagrari.gva.es/es/formacio-i-transferencia/proximos-cursos</a></li>
    </ul>

    <h3>Font original i avís de drets</h3>
    <p>Aquesta crònica ha sigut redactada per <strong>El Rentonar</strong> a partir de la publicació difosa per l’<strong>Ajuntament de Muro</strong> el 18 de setembre de 2026 i dels cartells oficials de l’Estació Experimental Agrària de Llutxent (Generalitat Valenciana):</p>
    <ul>
      <li><strong>Font directa:</strong> <a href="https://www.vilademuro.net/cursos-de-pedra-en-sec-a-celebrar-en-fageca-i-alcosser/" target="_blank" rel="noopener noreferrer">Ajuntament de Muro · Cursos de pedra en sec a celebrar en Fageca i Alcosser (vilademuro.net)</a></li>
      <li><strong>Drets dels materials:</strong> El vídeo divulgatiu i els cartells oficials pertanyen als seus respectius autors i organismes públics (Generalitat Valenciana, Ajuntament de Fageca, Ajuntament d’Alcosser i Ajuntament de Muro) i es reproduïxen ací amb finalitat exclusivament informativa i d’utilitat pública docent. El text d’aquesta síntesi es compartix sota llicència <strong>CC BY-NC-SA 4.0</strong> citant sempre la font original.</li>
    </ul>
  `
});

export const FEATURED_EVENTS = Object.freeze([CURSOS_PEDRA_EN_SEC_2026_EVENT]);

